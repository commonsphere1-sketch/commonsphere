/**
 * Where an economy stands among the producers of the commodities the page
 * follows, for the Resources tab of its window.
 *
 * Nothing new is published here: each row is read from the same country
 * table the commodity's own window lists (USGS for minerals, the energy and
 * farm tables for the rest), so a figure here and the figure there cannot
 * disagree. A commodity whose table does not name the economy is left out,
 * not given a zero - the tables list the main producers, not every country.
 *
 * The bar is the economy's share of the world's output, on a scale of 0 to
 * 100, in the commodity's colour; the largest share comes first. The place
 * is its place among the countries the table lists, and says so.
 */
import { RESOURCES } from "../data/resourceList";
import { countriesData } from "../data/countriesData";
import { CODE_OF_ECONOMY } from "../data/placeIndex";
import { SourceLink } from "./SourceLink";
import { PRODUCERS, fmtAmount } from "./ResourceModal";
import type { Share } from "../data/resourceProducerTypes";

/** A table's name for a country where the site's differs. */
const ALIAS: Record<string, string> = { Turkey: "Türkiye", Czechia: "Czech Republic", "Korea, South": "South Korea" };

const share = (s: Share | null) => (s ? `${s.bound === "atMost" ? "≤" : s.bound === "atLeast" ? "≥" : ""}${s.pct}%` : null);
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

export function CommodityStanding({ economyId, name }: { economyId: string; name: string }) {
  const code = CODE_OF_ECONOMY[economyId];
  const country = code ? countriesData.find((c) => c.code === code)?.name : undefined;
  const is = (n: string) => {
    const site = ALIAS[n] ?? n;
    return site === name || site === country;
  };

  const rows = RESOURCES.flatMap((r) => {
    const p = PRODUCERS[r.name];
    if (!p) return [];
    const c = p.countries.find((x) => is(x.name));
    if (!c || (!c.production && !c.reserves && !c.productionWithheld)) return [];
    // Its place among the countries the table lists with an output figure.
    const listed = p.countries.filter((x) => x.production).sort((a, b) => b.production!.value - a.production!.value);
    const place = c.production ? listed.indexOf(c) + 1 : 0;
    return [{ r, p, c, place, of: listed.length }];
  });
  if (rows.length === 0) return null;
  // The commodity it has the largest share of the world's output of comes first.
  rows.sort((a, b) => (b.c.productionShare?.pct ?? -1) - (a.c.productionShare?.pct ?? -1));

  const sources = [...new Map(rows.flatMap((x) => x.p.sources).map((s) => [s.url, s])).values()];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Among the World's Producers</span>
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
          {rows.length} of {RESOURCES.length} commodities
        </span>
      </div>
      <div className="modal-tile rounded-xl p-4">
        <ul className="flex flex-col gap-3.5">
          {rows.map(({ r, p, c, place, of }) => {
            const out = share(c.productionShare);
            const held = c.reserves && p.reservesUnit ? fmtAmount(c.reserves, p.reservesUnit) : null;
            const heldShare = share(c.reservesShare);
            return (
              <li key={r.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} aria-hidden />
                    <span className="text-xs font-semibold font-sans text-foreground">{r.name}</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground text-right shrink-0">
                    {c.production ? fmtAmount(c.production, p.productionUnit) : c.productionWithheld ? "Withheld" : "—"}
                    {out && <span className="font-normal text-muted-foreground"> · {out} of world</span>}
                  </span>
                </div>
                {c.productionShare && (
                  <span className="relative block h-1.5 rounded-full bg-muted mt-1.5" aria-hidden>
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, c.productionShare.pct)}%`, minWidth: 2, background: r.color }} />
                  </span>
                )}
                <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
                  {p.measure}, {p.productionYear}
                  {place > 0 && ` · ${ordinal(place)} of the ${of} countries listed`}
                  {held && ` · ${(p.reservesLabel ?? "Reserves").toLowerCase()} ${held}${heldShare ? ` (${heldShare} of world)` : ""}${p.reservesYear ? `, ${p.reservesYear}` : ""}`}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
          Each row is {name}'s line in the commodity's own country table. A bar is its share of the world's output, on a scale of 0 to 100. The tables list the
          main producers, so its place is among the countries listed, and a commodity whose table does not name {name} is left out here, not counted as none.
        </p>
      </div>
      <SourceLink sources={sources} showIcon={false} className="mt-2" />
    </div>
  );
}
