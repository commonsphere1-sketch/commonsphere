/**
 * Who gives aid and who receives it, as asked (foreignAid.ts, build-aid.cjs): a country's net official development
 * assistance received - in all, per person and as a share of its national income - and, for a donor, what it gave, each
 * year of the last ten, by the OECD's Development Assistance Committee as the World Bank publishes it.
 *
 * Every figure is the OECD's. "Net" is the OECD's: loans repaid are taken off what was lent, so a year can be below zero.
 */
import { AID_SOURCES, FOREIGN_AID } from "../data/foreignAid";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const COLOR = "#7c3aed";
const usd = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v) >= 1e9 ? `$${(Math.abs(v) / 1e9).toFixed(Math.abs(v) >= 1e10 ? 1 : 2)}B` : Math.abs(v) >= 1e6 ? `$${(Math.abs(v) / 1e6).toFixed(1)}M` : `$${Math.round(Math.abs(v)).toLocaleString("en-US")}`}`;

function Years({ rows, label }: { rows: [number, number][]; label: string }) {
  const positive = rows.every(([, v]) => v >= 0);
  // A year below zero cannot sit on a bar from zero: such a series is given as figures.
  return positive ? (
    <MeasureBars rows={rows.map(([y, v]) => ({ key: String(y), label: String(y), value: v, text: usd(v), color: COLOR }))} label={label} />
  ) : (
    <div>
      {rows.map(([y, v]) => (
        <FigureRow key={y} label={String(y)} value={usd(v)} />
      ))}
    </div>
  );
}

export default function AidPanel({ code, country }: { code: string; country: string }) {
  const a = FOREIGN_AID[code];
  if (!a) return null;
  const r = a.received[a.received.length - 1];
  const g = a.given[a.given.length - 1];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Foreign aid</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {g && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`Given · net official development assistance, current US dollars · ${a.given[0][0]}–${g[0]}`}</ChartTitle>
            <FigureRow label={`Given · ${g[0]}`} value={usd(g[1])} sub={a.givenGni ? `${a.givenGni[1]}% of its national income, ${a.givenGni[0]}` : undefined} />
            {a.given.length > 2 && (
              <div className="mt-3">
                <Years rows={a.given} label={`${country}'s aid given, by year`} />
              </div>
            )}
          </div>
        )}
        {r && (
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`Received · net official development assistance and aid, current US dollars · ${a.received[0][0]}–${r[0]}`}</ChartTitle>
            <FigureRow label={`Received · ${r[0]}`} value={usd(r[1])} sub={[a.receivedPerPerson !== null ? `$${a.receivedPerPerson.toLocaleString("en-US")} a person` : "", a.receivedGni !== null ? `${a.receivedGni}% of its national income` : ""].filter(Boolean).join(" · ") || undefined} />
            {a.received.length > 2 && (
              <div className="mt-3">
                <Years rows={a.received} label={`Aid ${country} received, by year`} />
              </div>
            )}
          </div>
        )}
        <ChartNote>
          The OECD&apos;s count of grants and cheap loans from governments and multilateral bodies, given to promote a country&apos;s development and welfare. It is net: what a country repays on earlier loans is taken off what it is lent, so a year can fall below zero.
        </ChartNote>
      </div>
      <SourceLink sources={[...(g ? [AID_SOURCES.given] : []), ...(r ? [AID_SOURCES.received] : []), AID_SOURCES.oecd]} className="mt-2" />
    </div>
  );
}
