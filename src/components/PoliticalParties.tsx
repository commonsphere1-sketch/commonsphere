/**
 * A country's political parties, in its window: the parties the CIA World
 * Factbook lists for it, and for each chamber of its legislature the seats
 * each party won at the most recent election (countryPolitics.ts).
 *
 * It is the record as the Factbook's final edition (January 2026) left it,
 * and says so: a government formed or an election held since is not in it.
 * Where an election renewed only part of a chamber - a third of a senate -
 * the seats shown are the ones contested, and the panel says that too.
 *
 * Loaded when a window's Politics tab opens: the data is every country's.
 */
import { UsersThree } from "@phosphor-icons/react";
import { COUNTRY_POLITICS, COUNTRY_POLITICS_SOURCE, type Chamber } from "../data/countryPolitics";
import { ChartNote, ChartTitle, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const day = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : iso);

function ChamberBlock({ c }: { c: Chamber }) {
  const total = c.parties?.reduce((a, [, n]) => a + n, 0) ?? 0;
  const partial = /partial/i.test(c.scope ?? "");
  const facts = [c.seats && `seats: ${c.seats}`, c.electoral && `electoral system: ${c.electoral}`, c.term && `term: ${c.term}`, c.nextElection && `next election: ${c.nextElection}`].filter(Boolean);
  return (
    <div className="min-w-0">
      <ChartTitle>
        {c.name}
        {c.lastElection ? ` · ${partial ? "seats contested" : "seats won"} · election of ${day(c.lastElection)}` : " · seats by party"}
      </ChartTitle>
      {c.parties ? (
        // On the scale of the seats listed: a bar's length is the party's share of them.
        <MeasureBars
          max={total}
          label={`${c.name}: seats by party`}
          rows={c.parties.map(([name, seats]) => ({ label: name, value: seats, text: `${seats.toLocaleString("en-US")}`, sub: total > 0 ? `${((100 * seats) / total).toFixed(1)}%` : undefined }))}
        />
      ) : c.partiesText ? (
        <p className="text-[11px] font-sans text-foreground leading-relaxed">{c.partiesText}</p>
      ) : (
        <p className="text-[11px] font-sans text-muted-foreground">The Factbook gives no seats by party for this chamber.</p>
      )}
      {facts.length > 0 && <p className="text-[10px] font-mono text-muted-foreground leading-snug mt-2">{facts.join(" · ")}</p>}
      {partial && c.parties && (
        <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
          The election renewed part of the chamber: these are the {total.toLocaleString("en-US")} seats contested, not the whole chamber.
        </p>
      )}
    </div>
  );
}

export default function PoliticalParties({ code, name, className = "mb-4" }: { /** The country's ISO code. */ code: string; name: string; className?: string }) {
  const p = COUNTRY_POLITICS[code];
  if (!p) return null;
  return (
    <div className={`modal-tile rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-2 mb-4">
        <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">
          <UsersThree size={13} weight="fill" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">Political Parties</h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            The parties of {name}, and the seats each won in its {p.structure ? `${p.structure} ` : ""}legislature · as the Factbook's final edition records them
          </p>
        </div>
      </div>

      {p.parties.length > 0 && (
        <>
          <ChartTitle>
            The parties the Factbook lists · {p.parties.length}
          </ChartTitle>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.parties.map((x) => (
              <span key={x} className="text-[11px] font-sans text-foreground border border-border rounded-full px-2.5 py-0.5">
                {x}
              </span>
            ))}
          </div>
        </>
      )}

      {p.chambers.length > 0 && (
        <div className={`grid grid-cols-1 ${p.chambers.length > 1 ? "sm:grid-cols-2" : ""} gap-x-6 gap-y-5`}>
          {p.chambers.map((c) => (
            <ChamberBlock key={c.name} c={c} />
          ))}
        </div>
      )}

      <ChartNote className="mt-4">
        This is the record as the CIA World Factbook left it in January 2026, when its final edition was published: an election held, a seat changed or a
        coalition formed since is not in it. Seats are those won at the election named, so members who have changed party since are counted where they
        were elected.
      </ChartNote>
      <SourceLink sources={[COUNTRY_POLITICS_SOURCE]} className="mt-2" />
    </div>
  );
}
