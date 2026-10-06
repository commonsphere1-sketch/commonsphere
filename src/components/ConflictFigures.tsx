/**
 * Conflict and displacement on the Dashboard: the world's published counts,
 * each with its series - armed conflicts and the deaths in them from the
 * Uppsala Conflict Data Program, and the people forcibly displaced from
 * UNHCR (worldview.ts).
 *
 * It stands where a "Conflicts" box stood: five conflicts each with an
 * "intensity" out of 100, and "42 active, 18 monitored" - figures nobody
 * publishes, under the names of two bodies that publish others. These are
 * the bodies' own counts, with what each counts said beside it.
 */
import { useNavigate } from "react-router-dom";
import { ArrowRight, Crosshair } from "@phosphor-icons/react";
import { WORLD, type WorldIndicator } from "../data/worldview";
import { StatCard, type StatCardData } from "./StatCard";
import { useTokens } from "./DataExplorer";

const COLOR = "#ef4444";

const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : a >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US");
};
const print = (ind: WorldIndicator, v: number) => (ind.format === "count" ? compact(v) : Math.round(v).toLocaleString("en-US"));
/** "Uppsala Conflict Data Program (via Our World in Data)" → "Uppsala Conflict Data Program". */
const publisher = (label: string) => label.split(/ \(| — /)[0];

/** A world series as a card: its latest count, what it counts, its series, and its change on the year before - two published counts. */
function cardOf(id: string): StatCardData | null {
  const ind = WORLD[id];
  if (!ind || ind.series.length < 3) return null;
  const s = ind.series;
  const [year, value] = s[s.length - 1];
  const [prevYear, prev] = s[s.length - 2];
  const d = value - prev;
  return {
    label: ind.label,
    value: print(ind, value),
    sub: `${publisher(ind.source.label)} · ${year}`,
    about: ind.note,
    series: s,
    fmt: (v) => print(ind, v),
    color: COLOR,
    source: ind.source,
    // More conflict, more deaths or more people displaced is for the worse.
    change: d === 0 ? { chip: "no change", caption: `on ${prevYear}`, dir: "flat" } : { chip: `${d > 0 ? "+" : "−"}${print(ind, Math.abs(d))}`, caption: `on ${prevYear}`, dir: d > 0 ? "up" : "down", verdict: d > 0 ? "worse" : "better" },
  };
}

export function ConflictFigures() {
  const t = useTokens();
  const navigate = useNavigate();
  const cards = ["conflicts", "conflictDeaths", "displaced"].map(cardOf).filter((c): c is StatCardData => !!c);
  if (!cards.length) return null;
  return (
    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Crosshair size={16} weight="fill" style={{ color: COLOR }} aria-hidden />
          <h2 className="text-base font-bold font-sans" style={{ color: t.headText }}>
            Conflict and displacement
          </h2>
        </div>
        <button type="button" onClick={() => navigate("/dashboard/humanitarian")} className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: COLOR }}>
          Humanitarian <ArrowRight size={10} weight="bold" aria-hidden />
        </button>
      </div>
      <p className="text-[11px] font-sans leading-snug mb-3" style={{ color: t.mutedText }}>
        The world's counts as the bodies that keep them publish them, each for its latest year. A card opens to its full series.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3">
        {cards.map((c) => (
          <StatCard key={c.label} s={c} />
        ))}
      </div>
    </div>
  );
}
