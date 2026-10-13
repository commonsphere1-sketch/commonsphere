/**
 * How a country is governed, as the records set it out: the rows that fill
 * the "Politics and government" tile of a country's window under its type of
 * government and its head of state.
 *
 * Its legislature - how many chambers, the seats of the lower or only one,
 * how it is elected and for how long, when it was last elected and when it
 * is next due, and the party with the most seats - is the CIA World
 * Factbook's, as its final edition left it (data/countryPolitics.ts). Its
 * score for voice and accountability is the World Bank's
 * (data/countryIndexes.ts), and the day it joined the United Nations is the
 * UN's (data/countryUn.ts). A row the record does not give is left out;
 * nothing is put in its place.
 *
 * The rows are a line each, the name on the left and the fact on the right,
 * in two columns where there is room: the tile takes the whole line of its
 * panel and is filled across it.
 */
import { COUNTRY_INDEXES, INDEX_DEFS } from "../data/countryIndexes";
import { COUNTRY_POLITICS, COUNTRY_POLITICS_SOURCE } from "../data/countryPolitics";
import { COUNTRY_UN, COUNTRY_UN_SOURCES } from "../data/countryUn";
import { SourceLink } from "./SourceLink";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** A date the record gives as a day is written out; anything else is the record's own words. */
const when = (s: string) => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : s;
};
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
type Row = [label: string, value: string];

export default function GovernmentFacts({ code }: { /** The country's ISO code. */ code: string }) {
  const politics = COUNTRY_POLITICS[code];
  const voice = COUNTRY_INDEXES[code]?.voice;
  const voiceDef = INDEX_DEFS.find((d) => d.id === "voice");
  const un = COUNTRY_UN[code];
  // The lower chamber, or the only one, is given in full; an upper chamber by its name and its seats.
  const [first, second] = politics?.chambers ?? [];
  const lead = first?.parties?.length ? [...first.parties].sort((a, b) => b[1] - a[1])[0] : null;
  const rows: Row[] = [
    ...(politics?.structure ? [["Legislature", capital(politics.structure)] as Row] : []),
    ...(first ? [[second ? "Lower chamber" : "Chamber", first.name] as Row] : []),
    ...(first?.seats ? [["Seats", first.seats] as Row] : []),
    ...(first?.electoral || first?.term ? [["Elected", [first.electoral, first.term && `for ${first.term}`].filter(Boolean).join(" · ")] as Row] : []),
    ...(first?.lastElection ? [["Last elected", when(first.lastElection)] as Row] : []),
    ...(first?.nextElection ? [["Next election due", when(first.nextElection)] as Row] : []),
    ...(lead ? [["Most seats", `${lead[0]} · ${lead[1].toLocaleString("en-US")}`] as Row] : []),
    ...(second ? [["Upper chamber", [second.name, second.seats && `${second.seats} seats`].filter(Boolean).join(" · ")] as Row] : []),
    ...(voice ? [["Voice and accountability", `${voice.v} of 100 · ${voice.y}`] as Row] : []),
    ...(un ? [["In the United Nations since", when(un.admitted)] as Row] : []),
  ];
  if (!rows.length) return null;
  return (
    <div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-border/40">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 py-1 border-b border-border/40">
            <dt className="text-[10px] text-muted-foreground font-sans shrink-0">{label}</dt>
            <dd className="text-[11px] font-sans text-foreground text-right leading-snug min-w-0">{value}</dd>
          </div>
        ))}
      </dl>
      <SourceLink
        sources={[...(politics ? [{ label: COUNTRY_POLITICS_SOURCE.label, url: COUNTRY_POLITICS_SOURCE.url }] : []), ...(voice && voiceDef ? [voiceDef.source] : []), ...(un ? [COUNTRY_UN_SOURCES.members] : [])]}
        className="mt-2"
      />
    </div>
  );
}
