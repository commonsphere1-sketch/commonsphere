/**
 * The charts inside a country's window, in one style: the site's.
 *
 * The window's panels each drew their own - a bar here capped at a number
 * picked to make it look right, a donut there, the same shares drawn twice,
 * every figure in the colour of its bar, and green, amber or red by
 * thresholds of the site's own choosing. These are the pieces that replace
 * them, and the rules they keep:
 *
 *   - a bar is drawn on a scale that means something: 0 to 100 for a share,
 *     or the largest of the things compared. A rate with no natural ceiling
 *     is given as a figure, not as a bar against an invented one;
 *   - the parts of a whole are drawn once - as one bar, or as a ring where
 *     the window's owner asked for one (land use) - each part in its own
 *     colour with a gap between, and a legend that carries every figure; they
 *     are not drawn a second time as separate bars;
 *   - figures are in ink. Colour says which part is which, never whether a
 *     figure is good or bad: the site has no source for where good ends;
 *   - a figure says what it measures, its unit and its year, and - where the
 *     World Bank or the body that publishes it gives the world's figure for
 *     the same indicator and the same year - the world's, as a tick on the
 *     bar and in words;
 *   - nothing moves: a bar is where its figure puts it.
 *
 * The colours of parts are the fixed order the palette validator passed on
 * the light and the dark surface (the one the Worldview and Trends charts
 * use); ordered parts - ages - take one hue, light to dark.
 */
import { useState, type ReactNode } from "react";
import { WORLD } from "../data/worldview";

/** The colours of the parts of a whole, in the order they are assigned. */
export const PART_COLORS = ["#d97706", "#2563eb", "#0d9488", "#c026d3", "#65a30d", "#7c3aed", "#b45309"];
/** The one colour of a chart that sets a single measure side by side: the Countries explorer's. */
export const ACCENT = "#6366f1";
/** One hue from light to dark, for parts that are in order: n steps of the accent. */
export const rampOf = (n: number) => Array.from({ length: n }, (_, i) => `${ACCENT}${Math.round(255 * (0.4 + (0.6 * i) / Math.max(1, n - 1))).toString(16).padStart(2, "0")}`);

/** The world's figure for an indicator in a given year, where worldview.ts holds that series and that year. */
export function worldFor(id: string, year: string | number | undefined): number | null {
  const s = WORLD[id]?.series;
  if (!s || year == null) return null;
  return s.find(([y]) => String(y) === String(year))?.[1] ?? null;
}

/** What a chart shows, its unit and its year: the line over it. */
export function ChartTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] font-mono uppercase tracking-widest text-muted-foreground leading-snug mb-2 ${className}`}>{children}</p>;
}

/** A sentence under a chart: how to read it, or what it leaves out. */
export function ChartNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] font-sans text-muted-foreground leading-relaxed ${className}`}>{children}</p>;
}

/** A figure as a tile: what it is, the figure in ink, then its unit, its year and the world's where there is one. */
export function FigureTile({ label, value, sub, world }: { label: string; value: ReactNode; sub?: ReactNode; /** The world's figure for the same indicator and year, as printed. */ world?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-sans text-muted-foreground leading-snug">{label}</p>
      <p className="text-base font-bold font-mono text-foreground leading-tight mt-0.5">{value}</p>
      {(sub || world) && (
        <p className="text-[9px] font-mono text-muted-foreground leading-snug mt-0.5">
          {sub}
          {sub && world ? " · " : ""}
          {world ? `world ${world}` : ""}
        </p>
      )}
    </div>
  );
}

export interface MeasureRow {
  key?: string;
  label: string;
  /** Where the bar ends, on the chart's scale. Left out, the row is a figure with no bar. */
  value?: number;
  /** The figure as printed. */
  text: string;
  /** Its unit or year, after the figure. */
  sub?: string;
  /** The world's figure on the same scale: a tick on the bar, and said after the figure. */
  world?: { value: number; text: string } | null;
}

/**
 * One measure across several things: each a name and its figure in ink, with
 * a thin bar under it on a scale all the rows share. `max` is that scale's
 * end - 100 for shares; left out, it is the largest figure shown.
 */
export function MeasureBars({ rows, max, color = ACCENT, label }: { rows: MeasureRow[]; max?: number; color?: string; /** What the chart shows, for a screen reader. */ label?: string }) {
  const top = max ?? Math.max(0, ...rows.flatMap((r) => [r.value ?? 0, r.world?.value ?? 0]));
  const at = (v: number) => `${top > 0 ? Math.min(100, Math.max(0, (100 * v) / top)) : 0}%`;
  return (
    <ul className="flex flex-col gap-2" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key ?? r.label}>
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-sans text-foreground min-w-0">{r.label}</span>
            <span className="text-[11px] font-mono font-semibold text-foreground text-right shrink-0">
              {r.text}
              {(r.sub || r.world) && (
                <span className="font-normal text-muted-foreground">
                  {r.sub ? ` · ${r.sub}` : ""}
                  {r.world ? ` · world ${r.world.text}` : ""}
                </span>
              )}
            </span>
          </span>
          {r.value != null && (
            <span className="relative block h-1.5 rounded-full bg-muted mt-1" aria-hidden>
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at(r.value), minWidth: r.value > 0 ? 2 : 0, background: color }} />
              {r.world && <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full bg-foreground" style={{ left: at(r.world.value) }} title={`World: ${r.world.text}`} />}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface Part {
  label: string;
  value: number;
  /** The figure as printed: "30%". */
  text: string;
  /** The part's own colour, where it has one by convention - a party's. Otherwise it takes the next of the chart's. */
  color?: string;
  /** What the middle of a ring says for this part, where its printed figure or its name is too long to sit there. */
  mid?: { text: string; label: string };
}

/**
 * The parts of a whole as one bar - each part in its own colour, a gap
 * between - over a legend that names every part and gives its figure, so
 * nothing is told by colour alone. `colors` is the parts' colours in order:
 * the fixed order by default, a single-hue ramp for parts that are in order.
 */
export function PartsBar({ parts, colors = PART_COLORS, label, columns = 2 }: { parts: Part[]; colors?: string[]; /** What the bar shows, for a screen reader. */ label: string; columns?: 1 | 2 | 3 }) {
  const shown = parts.filter((p) => p.value > 0);
  const fill = (p: Part, i: number) => p.color ?? colors[i % colors.length];
  return (
    <div>
      <div className="flex h-2.5 gap-0.5" role="img" aria-label={`${label}: ${shown.map((p) => `${p.label} ${p.text}`).join(", ")}.`}>
        {shown.map((p, i) => (
          <span
            key={p.label}
            className={`h-full min-w-[2px] ${i === 0 ? "rounded-l-full" : ""} ${i === shown.length - 1 ? "rounded-r-full" : ""}`}
            style={{ flexGrow: p.value, flexBasis: 0, background: fill(p, i) }}
            title={`${p.label}: ${p.text}`}
          />
        ))}
      </div>
      {/* As many columns as fit with every name in full: a name cut short is no legend. */}
      <ul className="grid gap-x-4 gap-y-1 mt-2" style={{ gridTemplateColumns: columns === 1 ? "1fr" : `repeat(auto-fit, minmax(${columns === 3 ? "7.5rem" : "9rem"}, 1fr))` }}>
        {shown.map((p, i) => (
          <li key={p.label} className="flex items-baseline gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-sm shrink-0 translate-y-px" style={{ background: fill(p, i) }} aria-hidden />
            <span className="text-[11px] font-sans text-foreground min-w-0 leading-snug">{p.label}</span>
            <span className="text-[11px] font-mono font-semibold text-foreground ml-auto shrink-0">{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The parts of a whole as a ring - each part an arc in its own colour, a gap
 * between - beside the legend PartsBar has: every part named in full with its
 * figure in ink, so nothing is told by colour alone. The middle of the ring
 * names the largest part, or the part the pointer is on; pointing at a part,
 * on the ring or in the legend, dims the others. Nothing spins into place.
 */
export function PartsDonut({ parts, colors = PART_COLORS, label }: { parts: Part[]; colors?: string[]; /** What the ring shows, for a screen reader. */ label: string }) {
  const [on, setOn] = useState<string | null>(null);
  const shown = parts.filter((p) => p.value > 0);
  const total = shown.reduce((a, p) => a + p.value, 0);
  if (!shown.length || total <= 0) return null;
  const fill = (p: Part, i: number) => p.color ?? colors[i % colors.length];
  const R = 40;
  const C = 2 * Math.PI * R;
  const gap = shown.length > 1 ? 2.5 : 0;
  let run = 0;
  const arcs = shown.map((p, i) => {
    const len = (p.value / total) * C;
    const arc = { p, i, start: run, len: Math.max(1.5, len - gap) };
    run += len;
    return arc;
  });
  const largest = shown.reduce((a, p) => (p.value > a.value ? p : a));
  const part = shown.find((p) => p.label === on) ?? largest;
  const mid = part.mid ?? part;
  // The middle is about 60 units across: a line too long for it is set smaller, never run over the ring.
  const fit = (s: string, size: number, em: number) => Math.min(size, 60 / (em * Math.max(1, s.length)));
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0" role="img" aria-label={`${label}: ${shown.map((p) => `${p.label} ${p.text}`).join(", ")}.`}>
        <g transform="rotate(-90 50 50)">
          {arcs.map(({ p, i, start, len }) => (
            <circle
              key={p.label}
              cx={50}
              cy={50}
              r={R}
              fill="none"
              stroke={fill(p, i)}
              strokeWidth={13}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-start}
              opacity={on && on !== p.label ? 0.3 : 1}
              onMouseEnter={() => setOn(p.label)}
              onMouseLeave={() => setOn(null)}
            >
              <title>{`${p.label}: ${p.text}`}</title>
            </circle>
          ))}
        </g>
        <text x={50} y={49} textAnchor="middle" className="fill-foreground font-mono font-bold" style={{ fontSize: fit(mid.text, 13, 0.62) }}>
          {mid.text}
        </text>
        <text x={50} y={61} textAnchor="middle" className="fill-muted-foreground font-sans" style={{ fontSize: fit(mid.label, 7.5, 0.5) }}>
          {mid.label}
        </text>
      </svg>
      <ul className="flex-1 min-w-[8.5rem] flex flex-col gap-1">
        {shown.map((p, i) => (
          <li
            key={p.label}
            className="flex items-baseline gap-1.5 min-w-0 rounded-sm"
            style={{ opacity: on && on !== p.label ? 0.45 : 1 }}
            onMouseEnter={() => setOn(p.label)}
            onMouseLeave={() => setOn(null)}
          >
            <span className="w-2 h-2 rounded-full shrink-0 translate-y-px" style={{ background: fill(p, i) }} aria-hidden />
            <span className="text-[11px] font-sans text-foreground min-w-0 leading-snug">{p.label}</span>
            <span className="text-[11px] font-mono font-semibold text-foreground ml-auto shrink-0">{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A figure in a short table of them: what it is, the figure in ink, and its unit or year. */
export function FigureRow({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-border last:border-b-0">
      <span className="text-[11px] font-sans text-foreground min-w-0">{label}</span>
      <span className="text-[11px] font-mono font-semibold text-foreground text-right shrink-0">
        {value}
        {sub && <span className="font-normal text-muted-foreground"> · {sub}</span>}
      </span>
    </div>
  );
}

/** UNDP's four tiers of human development and the index value each starts at. */
const HDI_TIERS: [from: number, name: string][] = [
  [0.8, "Very high"],
  [0.7, "High"],
  [0.55, "Medium"],
  [0, "Low"],
];
/** The UNDP tier an index value falls in. */
export const hdiTier = (v: number) => HDI_TIERS.find(([from]) => v >= from)![1];

/**
 * The Human Development Index on its own scale, 0 to 1: the country's value
 * as a bar, UNDP's tier boundaries (0.550, 0.700, 0.800) marked where they
 * fall, and the world's value for the same year as a tick.
 */
export function HdiScale({ value, year, world }: { value: number; year?: string; world?: number | null }) {
  const at = (v: number) => `${Math.min(100, Math.max(0, v * 100))}%`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-sans text-foreground">Human Development Index</span>
        <span className="text-[11px] font-mono font-semibold text-foreground text-right">
          {value.toFixed(3)}
          <span className="font-normal text-muted-foreground">
            {" "}
            · {hdiTier(value).toLowerCase()} human development{year ? ` · ${year}` : ""}
            {world != null ? ` · world ${world.toFixed(3)}` : ""}
          </span>
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted mt-1" role="img" aria-label={`Human Development Index ${value.toFixed(3)} on a scale of 0 to 1: ${hdiTier(value).toLowerCase()} human development.`}>
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at(value), background: ACCENT }} />
        {[0.55, 0.7, 0.8].map((b) => (
          <span key={b} className="absolute -top-0.5 -bottom-0.5 w-px bg-muted-foreground opacity-70" style={{ left: at(b) }} aria-hidden />
        ))}
        {world != null && <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full bg-foreground" style={{ left: at(world) }} title={`World: ${world.toFixed(3)}`} />}
      </div>
      {/* The tiers, each labelled where it starts. */}
      <div className="relative h-3 mt-0.5" aria-hidden>
        {[
          [0, "Low"],
          [0.55, "Medium"],
          [0.7, "High"],
          [0.8, "Very high"],
        ].map(([from, name]) => (
          <span key={name} className="absolute text-[8px] font-mono text-muted-foreground whitespace-nowrap" style={{ left: at(from as number) }}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
