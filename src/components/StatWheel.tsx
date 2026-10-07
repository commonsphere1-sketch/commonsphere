/**
 * A set of categories as a wheel, in the manner of the Worldview page's wheel
 * of pillars and the Climate page's planetary boundaries: each category a
 * wedge, filled from the centre with its measures that moved for the better
 * (green), then those that moved for the worse (red); the grey that remains
 * is its measures with no verdict - where neither way is plainly better, or
 * the series is too short to say. Every wedge holds all of its category's
 * measures and each part's area matches its count, so a category with few
 * judged measures is not drawn as all good or all bad.
 *
 * The wheel counts verdicts the page has already given its figures (each
 * figure's change, and whether it is for the better); it works nothing out of
 * its own, and it is not an index: it adds no scores and weighs nothing.
 * Hovering a wedge, here or in the list beside, reads it out in the centre;
 * picking one opens the category's window, where each figure is described
 * and drawn.
 */
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { StatCategoryWindow, type StatCategoryData } from "./StatCard";

const WHEEL = { cx: 260, cy: 260, core: 70, edge: 198 };
/** The radius that encloses a share `f` of a wedge, from the core out, by area. */
const areaRadius = (f: number) => Math.sqrt(WHEEL.core ** 2 + Math.max(0, Math.min(1, f)) * (WHEEL.edge ** 2 - WHEEL.core ** 2));

export function StatWheel({
  title,
  kicker,
  centre,
  categories,
  note,
}: {
  title: string;
  kicker: string;
  /** What the whole wheel is called in its centre: "Advancement", "Peace". */
  centre: string;
  categories: StatCategoryData[];
  /** How better and worse are judged here, and anything else to be said under the wheel. */
  note?: ReactNode;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<StatCategoryData | null>(null);
  const rows = categories
    .filter((c) => c.stats.length > 0)
    .map((c) => {
      const better = c.stats.filter((s) => s.change?.verdict === "better").length;
      const worse = c.stats.filter((s) => s.change?.verdict === "worse").length;
      return { c, better, worse, none: c.stats.length - better - worse, total: c.stats.length };
    });
  const all = rows.reduce((t, r) => ({ better: t.better + r.better, worse: t.worse + r.worse, none: t.none + r.none, total: t.total + r.total }), { better: 0, worse: 0, none: 0, total: 0 });
  const colors = { better: isLight ? "#059669" : "#10b981", worse: isLight ? "#dc2626" : "#ef4444", none: isLight ? "#d4d4d8" : "#52525b" };
  const muted = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const { cx, cy, core, edge } = WHEEL;
  const step = 360 / Math.max(1, rows.length);
  const polar = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const wedge = (start: number, end: number, inner: number, outer: number) => {
    if (outer - inner < 0.25) return "";
    const s = start + 0.9;
    const e = end - 0.9;
    const [p1, p2, p3, p4] = [polar(s, inner), polar(s, outer), polar(e, outer), polar(e, inner)];
    const large = e - s > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${outer} ${outer} 0 ${large} 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${inner} ${inner} 0 ${large} 0 ${p1.x} ${p1.y} Z`;
  };
  const shown = rows.find((r) => r.c.key === hover) ?? null;
  const read = shown ?? all;
  const describe = (r: (typeof rows)[number]) => `${r.c.title}: of ${r.total} measures, ${r.better} moved for the better and ${r.worse} for the worse; ${r.none} have no verdict. Opens the category.`;
  if (!rows.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {rows.length} categories · {all.total} measures
          </p>
          <h2 className="text-lg font-bold font-sans text-foreground">{title}</h2>
          <p className="text-xs font-sans text-muted-foreground max-w-2xl">{kicker}</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-muted/60 text-foreground/80">
          {all.better} better · {all.worse} worse · {all.none} no verdict
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-3 mb-3 border-b border-border">
        {[
          { key: "better" as const, label: "Moved for the better", Icon: ArrowUpRight },
          { key: "worse" as const, label: "Moved for the worse", Icon: ArrowDownRight },
          { key: "none" as const, label: "No verdict - neither way is plainly better, or too short a series", Icon: Minus },
        ].map((x) => (
          <span key={x.key} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[x.key] }} aria-hidden />
            <x.Icon size={10} weight="bold" aria-hidden />
            {x.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-7 flex items-center justify-center">
          <svg
            viewBox="0 0 520 520"
            width="100%"
            style={{ maxWidth: 440, overflow: "visible" }}
            role="img"
            aria-label={`${title}: of ${all.total} measures in ${rows.length} categories, ${all.better} moved for the better and ${all.worse} for the worse, and ${all.none} have no verdict.`}
          >
            {/* Half of a category's measures, by area. */}
            <circle cx={cx} cy={cy} r={areaRadius(0.5)} fill="none" stroke={isLight ? "#71717a" : "#a1a1aa"} strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
            {rows.map((r, i) => {
              const start = i * step;
              const f1 = r.better / r.total;
              const f2 = (r.better + r.worse) / r.total;
              const lit = hover === null || hover === r.c.key;
              return (
                <g
                  key={r.c.key}
                  role="button"
                  tabIndex={0}
                  aria-label={describe(r)}
                  aria-haspopup="dialog"
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpen(r.c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpen(r.c);
                    }
                  }}
                  onMouseEnter={() => setHover(r.c.key)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(r.c.key)}
                  onBlur={() => setHover(null)}
                  opacity={lit ? 1 : 0.4}
                  style={{ transition: "opacity 150ms" }}
                >
                  {/* The whole category: its measures with no verdict show as this grey. */}
                  <path d={wedge(start, start + step, core, edge)} fill={colors.none} opacity={0.55} />
                  <path d={wedge(start, start + step, core, areaRadius(f1))} fill={colors.better} opacity={0.9} />
                  <path d={wedge(start, start + step, areaRadius(f1), areaRadius(f2))} fill={colors.worse} opacity={0.85} />
                  {/* The category's own colour, as a band round the rim. */}
                  <path d={wedge(start, start + step, edge + 4, edge + 9)} fill={r.c.color} opacity={0.9} />
                  {hover === r.c.key && <path d={wedge(start, start + step, core, edge + 9)} fill="none" stroke={r.c.color} strokeWidth={2} />}
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={core} fill={isLight ? "#f4f4f5" : "#1f1f23"} stroke={isLight ? "#d4d4d8" : "#3f3f46"} />
            <text x={cx} y={cy - 22} textAnchor="middle" fontSize="9" fontFamily="monospace" letterSpacing="1" fill={shown ? shown.c.color : muted}>
              {(shown ? shown.c.title : centre).toUpperCase().slice(0, 22)}
            </text>
            <text x={cx} y={cy - 3} textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="700" fill={colors.better}>
              {read.better} better
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="700" fill={colors.worse}>
              {read.worse} worse
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill={muted}>
              {read.none} no verdict
            </text>
            <text x={cx + areaRadius(0.5) + 3} y={cy - 3} fontSize="7" fontFamily="monospace" fill={muted}>
              half
            </text>
            {rows.map((r, i) => {
              const mid = i * step + step / 2;
              const lp = polar(mid, edge + 26);
              const anchor = mid > 345 || mid < 15 || (mid > 165 && mid < 195) ? "middle" : mid < 180 ? "start" : "end";
              const lit = hover === r.c.key;
              return (
                <text
                  key={`lbl-${r.c.key}`}
                  x={lp.x}
                  y={lp.y + 3}
                  textAnchor={anchor}
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight={lit ? "700" : "600"}
                  fill={lit ? r.c.color : isLight ? "#334155" : "#cbd5e1"}
                  className="select-none cursor-pointer"
                  onClick={() => setOpen(r.c)}
                  onMouseEnter={() => setHover(r.c.key)}
                  onMouseLeave={() => setHover(null)}
                  aria-hidden
                >
                  {r.c.title}
                </text>
              );
            })}
          </svg>
        </div>

        {/* The same, as a list: each category's measures as a bar of its three parts, with their counts. */}
        <ul className="lg:col-span-5 flex flex-col" aria-label={`${title}, category by category`}>
          {rows.map((r) => (
            <li key={r.c.key}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpen(r.c)}
                onMouseEnter={() => setHover(r.c.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(r.c.key)}
                onBlur={() => setHover(null)}
                className={`w-full text-left py-2 border-b border-border/50 cursor-pointer transition-opacity ${hover === null || hover === r.c.key ? "" : "opacity-50"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.c.color }} aria-hidden />
                    <span className="text-[12px] font-sans font-semibold text-foreground truncate">{r.c.title}</span>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 text-muted-foreground">
                    <span style={{ color: colors.better }}>↗{r.better}</span> <span style={{ color: colors.worse }}>↘{r.worse}</span> –{r.none}
                  </span>
                </span>
                <span className="flex h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: colors.none }} aria-hidden>
                  <span style={{ width: `${(100 * r.better) / r.total}%`, background: colors.better }} />
                  <span style={{ width: `${(100 * r.worse) / r.total}%`, background: colors.worse }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {note && <p className="text-[10px] font-sans leading-relaxed text-muted-foreground mt-4 max-w-4xl">{note}</p>}
      {open && createPortal(<StatCategoryWindow c={open} onClose={() => setOpen(null)} />, document.body)}
    </div>
  );
}
