/**
 * Who is under sanctions, by country, as asked (sanctions.ts, build-sanctions.cjs): the entries of the US Treasury's,
 * the UK's and the EU's official sanctions lists tied to a country by an address there or a nationality of it - how
 * many, people and companies apart - and the programmes they are listed under, by each list's own name or code for them.
 *
 * The counts are worked out here from the lists. No one listed is named. An entry tied to a country is not the country's
 * government under sanctions, and the panel says so.
 */
import { SANCTIONS, SANCTIONS_SOURCES, SANCTIONS_TOTALS } from "../data/sanctions";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const LISTS = [
  { key: "us", title: "The United States · OFAC's list of Specially Designated Nationals", note: "OFAC's own tags for its programmes" },
  { key: "uk", title: "The United Kingdom · the UK Sanctions List", note: "the UK's sanctions regimes" },
  { key: "eu", title: "The European Union · its consolidated financial sanctions list", note: "the EU's own codes for its regimes, each named on its Sanctions Map" },
] as const;
const KIND: Record<string, string> = { person: "people", entity: "companies and bodies", vessel: "ships", aircraft: "aircraft" };
const COLOR = "#dc2626";

export default function SanctionsPanel({ code, country }: { code: string; country: string }) {
  const lists = LISTS.map((l) => ({ ...l, t: SANCTIONS[l.key][code] })).filter((l) => l.t);
  if (!lists.length) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Sanctions</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {lists.map(({ key, title, note, t }) => {
          const [n, kinds, progs] = t!;
          return (
            <div key={key} className="modal-tile rounded-xl p-4 min-w-0">
              <ChartTitle>{title}</ChartTitle>
              <FigureRow
                label={`Entries tied to ${country}`}
                value={n.toLocaleString("en-US")}
                sub={`of ${SANCTIONS_TOTALS[key].toLocaleString("en-US")} on the list · worked out here`}
              />
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {Object.entries(kinds)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => `${v.toLocaleString("en-US")} ${KIND[k] ?? k}`)
                  .join(" · ")}
              </p>
              {progs.length > 0 && (
                <div className="mt-3">
                  <MeasureBars rows={progs.map(([p, v]) => ({ key: p, label: p, value: v, text: v.toLocaleString("en-US"), color: COLOR }))} label={`The programmes ${country}'s entries are listed under, ${title}`} />
                  <ChartNote className="mt-1">By {note}; an entry can be listed under more than one.</ChartNote>
                </div>
              )}
            </div>
          );
        })}
        <ChartNote>
          An entry is tied to {country} where the list gives it an address there or a nationality or citizenship of it, so one can be tied to several countries; ships, tied by their flag rather than an address, are not counted. An entry tied to a country is a person or company under sanctions, not the country&apos;s government. No one listed is named here.
        </ChartNote>
      </div>
      <SourceLink sources={[SANCTIONS_SOURCES.us, SANCTIONS_SOURCES.uk, SANCTIONS_SOURCES.eu, { label: "EU Sanctions Map — each EU regime, by its code", url: "https://www.sanctionsmap.eu/" }]} className="mt-2" />
    </div>
  );
}
