/**
 * The composite indexes a place's country is scored on - human development,
 * equality, governance, the economy and its statistics - in the place's
 * window (data/countryIndexes.ts: UNDP and the World Bank). None of them is
 * published for a town, a district or a city, so they are given as the
 * country's and the panel says so.
 *
 * Each index is on its own scale and is drawn on it, from one end to the
 * other, with the figure in ink beside it: an index without a scale - the
 * Gender Development Index, a ratio about 1 - is a figure and not a length.
 * A group fills the row it is in, so the panel leaves no gap. An index the
 * country is not scored on is left out.
 */
import { ChartNote } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { inSentence } from "./CountryQuality";
import { COUNTRY_INDEXES, INDEX_DEFS, type IndexDef, type IndexFigure } from "../data/countryIndexes";

/** A group's colour, as the country's panels have theirs. */
const GROUP_COLOR: Record<string, string> = { Development: "#10b981", Equality: "#ec4899", Governance: "#6366f1", "Economy & data": "#f59e0b" };

const ordinal = (n: number) => {
  const t = n % 100;
  const s = t >= 11 && t <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n.toLocaleString("en-US")}${s}`;
};
const print = (d: IndexDef, v: number) => (d.id === "mpm" ? `${v}%` : String(v));

function Row({ d, f, color }: { d: IndexDef; f: IndexFigure; color: string }) {
  const at = d.scale ? Math.max(0, Math.min(1, (f.v - d.scale[0]) / (d.scale[1] - d.scale[0]))) : null;
  const stands = f.rank ? `${d.by} ranks it ${ordinal(f.rank)} of ${f.of}` : f.place ? `${ordinal(f.place)} of ${f.of} scored, counted here` : "";
  return (
    <div className="py-2 border-b border-border/60 last:border-b-0">
      <div className="flex items-baseline gap-3">
        <p className="text-[11px] font-sans font-semibold text-foreground leading-snug min-w-0 flex-1">{d.name}</p>
        <p className="text-sm font-mono font-bold text-foreground shrink-0">{print(d, f.v)}</p>
      </div>
      {at !== null && (
        <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden" role="img" aria-label={`${d.name}: ${print(d, f.v)} on a scale from ${d.scale![0]} to ${d.scale![1]}`}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, at * 100)}%`, background: color }} />
        </div>
      )}
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
        {d.what} · {d.by}, {f.y}
        {stands ? ` · ${stands}` : ""}
      </p>
    </div>
  );
}

export default function PlaceIndexes({
  code,
  country,
  place,
  className = "",
}: {
  /** The country's ISO 3166-1 code. */
  code: string;
  country: string;
  /** The place whose window this is, where it is not the country itself. */
  place?: string;
  className?: string;
}) {
  const held = COUNTRY_INDEXES[code] ?? {};
  const defs = INDEX_DEFS.filter((d) => held[d.id]);
  if (!defs.length) return null;
  const groups = [...new Set(defs.map((d) => d.group))];
  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">📊 Indexes{place ? ` · ${country}` : ""}</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
        {place
          ? `The indexes ${inSentence(country)} is scored on. No body publishes them for a town, a district or a city, so they are the country's and not ${place}'s own.`
          : `The indexes ${inSentence(country)} is scored on, each on its maker's own scale.`}
      </p>
      <div className="chart-fill">
        {groups.map((g) => (
          <div key={g} className="modal-tile rounded-xl px-4 py-2">
            <p className="text-[10px] font-mono uppercase tracking-widest leading-snug pt-1" style={{ color: GROUP_COLOR[g] }}>
              {g}
            </p>
            {defs
              .filter((d) => d.group === g)
              .map((d) => (
                <Row key={d.id} d={d} f={held[d.id]!} color={GROUP_COLOR[g] ?? "#64748b"} />
              ))}
          </div>
        ))}
      </div>
      <ChartNote className="mt-2">
        Each bar runs from one end of its index's scale to the other. More is the better on each, except the Gender Inequality Index, the Gini index and the Multidimensional
        Poverty Measure, where less is. A place “counted here” is the country's among those scored for the same year, from the scores; a rank is its maker's own. An index{" "}
        {inSentence(country)} is not scored on is left out.
      </ChartNote>
      <SourceLink sources={defs.map((d) => d.source)} className="mt-1" />
    </section>
  );
}
