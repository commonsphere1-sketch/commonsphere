/**
 * The site's bar chart for things set side by side - countries, regions,
 * kinds of crime, fifths of the people: each a slim rounded bar on a faint
 * track the width of the scale, filled in a gradient of its colour, its name
 * to its left on one line and its figure at the end of the bar. It was first
 * drawn for the births and deaths of the place picked on the Worldview page,
 * and every chart of its kind on the site was made like it, as asked.
 *
 * It draws what it is given: the figures are the caller's, with their
 * sources beside the chart. The scale runs from nothing to a round number
 * at or above the largest figure, so that bars are measured from zero.
 */
import { useId, type ReactNode } from "react";
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";

export type SlimRow = {
  /** Unique among the rows. */
  key: string;
  /** Its name, to the left of its bar. */
  label: ReactNode;
  v: number;
  color: string;
  /** What pointing at it says, where more than the figure is to be said. */
  tip?: string;
  /** Drawn fainter: a figure that is projected, estimated, or otherwise apart. */
  faint?: boolean;
};

/** A round number at or above the largest figure: 1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 times a power of ten. */
function roundUp(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

export default function SlimBars({
  rows,
  fmt,
  labelWidth = "5.5rem",
  max,
  className = "",
  label,
  dense = false,
}: {
  rows: SlimRow[];
  /** How a figure is written at the end of its bar. */
  fmt: (v: number) => string;
  /** How wide the names' column is. */
  labelWidth?: string;
  /** The top of the scale, where the caller has one (a share out of 100); otherwise a round number above the largest. */
  max?: number;
  className?: string;
  /** What the chart is, for a screen reader. */
  label?: string;
  /** Set closer, for a long list in a small card. */
  dense?: boolean;
}) {
  const top = max ?? roundUp(Math.max(0, ...rows.map((r) => r.v)));
  return (
    <ul className={`flex flex-col ${dense ? "gap-1.5" : "gap-3"} py-1 text-foreground ${className}`} aria-label={label}>
      {rows.map((r) => {
        const w = Math.max(0, Math.min(100, (r.v / top) * 100));
        return (
          <li key={r.key} className="grid items-center gap-x-3" style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr)` }} title={r.tip ?? `${typeof r.label === "string" ? r.label : ""}: ${fmt(r.v)}`.replace(/^: /, "")}>
            <span className={`${dense ? "text-[10px]" : "text-[11px]"} font-sans leading-tight text-right truncate opacity-80`}>{r.label}</span>
            {/* The track leaves room at its right for the figure at the end of the longest bar. */}
            <span className="relative flex items-center h-4 pr-12">
              <span className={`relative block w-full ${dense ? "h-2" : "h-2.5"} rounded-full`} style={{ background: "color-mix(in srgb, currentColor 7%, transparent)" }}>
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${w}%`,
                    minWidth: r.v > 0 ? "0.625rem" : 0,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${r.color} 35%, transparent), ${r.color})`,
                    opacity: r.faint ? 0.45 : 1,
                  }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 pl-1.5 text-[11px] font-mono font-semibold tabular-nums whitespace-nowrap" style={{ left: `${w}%` }}>
                  {fmt(r.v)}
                </span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The slim bars stood upright, for a figure year by year that can fall as well as rise: each year a slim rounded
 * column on a faint track, in a gradient of its colour - one colour for a rise, another for a fall - with its figure at
 * its end and a line at nothing.
 */
export function SlimColumns({
  rows,
  fmt,
  up = "#10b981",
  down = "#ef4444",
  height = 170,
  label,
}: {
  rows: { key: string; label: string; v: number }[];
  fmt: (v: number) => string;
  up?: string;
  down?: string;
  height?: number;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const tick = { fontSize: 9, fontFamily: "monospace", fill: "currentColor", fillOpacity: 0.6 };
  return (
    <div className="text-foreground" role="img" aria-label={label ?? rows.map((r) => `${r.label} ${fmt(r.v)}`).join(", ")}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 16, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
          <defs>
            <linearGradient id={`${id}-up`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up} stopOpacity={1} />
              <stop offset="100%" stopColor={up} stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id={`${id}-down`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={down} stopOpacity={1} />
              <stop offset="100%" stopColor={down} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
          <YAxis hide domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
          <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.25} />
          <Bar dataKey="v" maxBarSize={14} radius={7} background={{ fill: "currentColor", fillOpacity: 0.06, radius: 7 }} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.key} fill={`url(#${id}-${r.v >= 0 ? "up" : "down"})`} />
            ))}
            <LabelList dataKey="v" position="top" formatter={(v: number) => fmt(v)} style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 600, fill: "currentColor" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
