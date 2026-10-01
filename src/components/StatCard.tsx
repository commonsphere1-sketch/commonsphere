import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ArrowsIn, ArrowsOut, Minus, TrendDown, TrendUp, X } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "./SourceLink";

/**
 * A figure as a card, the way the Economies page shows a commodity: what it
 * is, the figure, how it has moved (as a chip, with an arrow), a line or two
 * saying what it measures, its series as a filled line in the card's own
 * colour, two or three facts read off that series, and - where there is a
 * series - a window behind it with the full chart and the facts in full:
 * what the figure measures and why it matters, the figure by region, group,
 * country and type where the page has those, and the figures beside it.
 *
 * Shared by the Trends, Humanitarian and Worldview pages, whose tiles were
 * three copies of one plainer design. Nothing here computes a figure the page
 * did not give it, except to read the highest, the lowest and the reading ten
 * years back off the series it is handed.
 */

export type StatPoint = [year: number, value: number];

export interface StatFact {
  label: string;
  value: string;
  sub?: string;
}

/** A row of a breakdown: a region, a group, a country or a type, with its figure as printed and the length of its bar. */
export interface StatTableRow {
  name: string;
  /** What the bar is drawn from; the longest row fills the track. */
  value: number;
  text: string;
  /** Its share of the total, its reading ten years before, or what sets it apart. */
  note?: string;
  /** ISO2, for a country's flag. */
  code?: string;
}

/** The figure broken down one way: by region, by income group, by country, by type. */
export interface StatTable {
  key: string;
  title: string;
  kicker?: string;
  rows: StatTableRow[];
  note?: string;
  source?: { label: string; url: string };
}

/** How a figure has moved: the amount for the chip, what it is measured against, and whether that is for the better. */
export interface StatChange {
  chip: string;
  caption?: string;
  dir: "up" | "down" | "flat";
  verdict?: "better" | "worse" | null;
}

export interface StatCardData {
  label: string;
  value: string;
  /** Whose figure it is and for when: "World Bank · 2025". */
  sub: string;
  change?: StatChange | null;
  /** What the figure measures. */
  about?: string;
  /** What its series shows, where the page says so. */
  story?: string;
  series?: StatPoint[];
  /** The first year of the series that is a projection; drawn dashed from there. */
  split?: number;
  /** The card's colour: its dot and its line. The figures stay in ink. */
  color?: string;
  /** A value of the series, printed as the figure is. Needed for facts read off the series. */
  fmt?: (v: number) => string;
  /** Facts to show in place of those read off the series. */
  facts?: StatFact[];
  source?: { label: string; url: string } | { label: string; url: string }[];
  // ── For the window only ──
  /** What the figure counts and how it is measured, at length. */
  what?: string;
  /** Why it matters. */
  why?: string;
  /** Facts beside those read off the series. */
  moreFacts?: StatFact[];
  /** The figure broken down: by region, group, country, type. */
  tables?: StatTable[];
  /** The figures that sit beside this one on the page. */
  related?: { title: string; rows: StatFact[] };
  notes?: string[];
}

const DEFAULT_COLOR = "#3987e5";
const lastOf = (s: StatPoint[]) => s[s.length - 1];

/** "+10.8 points since 2015" as a chip ("+10.8 pts") and what it is measured against ("since 2015"). */
export function splitChange(text: string, dir: StatChange["dir"], verdict?: StatChange["verdict"]): StatChange {
  const m = /^(.*?)\s+(since|on|from)\s+(.+)$/.exec(text);
  if (!m) return { chip: text, dir, verdict };
  return { chip: m[1].replace(/ points$/, " pts"), caption: `${m[2]} ${m[3]}`, dir, verdict };
}

/** The reading about ten years before the latest, where the series has one. */
function decadeBefore(s: StatPoint[]): StatPoint | null {
  const [ly] = lastOf(s);
  const earlier = s.filter(([y]) => y <= ly - 10);
  const p = earlier[earlier.length - 1];
  return p && ly - 10 - p[0] <= 2 ? p : null;
}

/** Facts read off the series: for a measured series, ten years back and its high and low; for a projected one, where the estimates end and where the projection does. */
function seriesFacts(s: StatCardData, full = false): StatFact[] {
  const { series, fmt, split } = s;
  if (!series || series.length < 3 || !fmt) return [];
  const [ly, lv] = lastOf(series);
  const hi = series.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lo = series.reduce((a, b) => (b[1] < a[1] ? b : a));
  const out: StatFact[] = [];
  if (split && split <= ly) {
    const est = series.filter(([y]) => y < split).pop();
    if (est) out.push({ label: "Latest estimate", value: fmt(est[1]), sub: `${est[0]}` });
    out.push({ label: "Projected", value: fmt(lv), sub: `${ly}` });
    if (hi[0] !== ly && hi[0] !== est?.[0]) out.push({ label: hi[0] >= split ? "Projected peak" : "Highest", value: fmt(hi[1]), sub: `${hi[0]}` });
  } else {
    const prev = decadeBefore(series);
    if (full) out.push({ label: "Latest", value: fmt(lv), sub: `${ly}` });
    if (prev) out.push({ label: "Ten years before", value: fmt(prev[1]), sub: `${prev[0]}` });
    out.push({ label: "Highest", value: fmt(hi[1]), sub: `${hi[0]}` }, { label: "Lowest", value: fmt(lo[1]), sub: `${lo[0]}` });
  }
  if (full) out.push({ label: "Years covered", value: `${series[0][0]}–${ly}`, sub: `${series.length} readings` });
  return out;
}

/** The change as a chip: an arrow and the amount, green where the move is for the better, red where for the worse, plain where neither is said. */
function ChangeChip({ c }: { c: StatChange }) {
  const Icon = c.dir === "up" ? TrendUp : c.dir === "down" ? TrendDown : Minus;
  const tone =
    c.verdict === "better"
      ? "bg-success/10 text-success border-success/20"
      : c.verdict === "worse"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-muted text-foreground border-border";
  return (
    <span className="flex flex-col items-end gap-0.5 shrink-0 max-w-[55%]">
      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${tone}`} title={c.verdict ? `For the ${c.verdict}` : undefined}>
        <Icon size={10} weight="bold" aria-hidden />
        <span className="truncate">{c.chip}</span>
      </span>
      {c.caption && <span className="text-[9px] font-sans text-muted-foreground text-right leading-tight">{c.caption}</span>}
    </span>
  );
}

/** A series as a filled line in the card's colour: solid over what has happened, dashed over what is projected, its last point marked. */
export function StatSparkline({ series, color, split, height = "h-9" }: { series: StatPoint[]; color: string; split?: number; height?: string }) {
  if (series.length < 3) return null;
  const x0 = series[0][0];
  const x1 = lastOf(series)[0];
  const ys = series.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (x: number) => 2 + ((x - x0) / (x1 - x0 || 1)) * 96;
  const py = (y: number) => 90 - ((y - lo) / (hi - lo || 1)) * 80;
  const path = (pts: StatPoint[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("");
  const past = split ? series.filter(([y]) => y < split) : series;
  const ahead = split ? series.filter(([y]) => y >= split - 1) : [];
  const [lx, ly] = lastOf(series);
  return (
    <span className={`relative block ${height} w-full`} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={`${path(series)}L${px(x1).toFixed(1)},100L${px(x0).toFixed(1)},100Z`} fill={color} fillOpacity={0.14} />
        {past.length > 1 && <path d={path(past)} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
        {ahead.length > 1 && <path d={path(ahead)} fill="none" stroke={color} strokeWidth={1.75} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
      </svg>
      <span className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card" style={{ left: `${px(lx)}%`, top: `${py(ly)}%`, background: color }} />
    </span>
  );
}

const flagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

/**
 * A breakdown as bars: each row's name and its figure in ink, a bar against
 * the longest row in the card's colour, and under it the row's share or its
 * reading ten years before. One colour throughout - the bars show size, and
 * the names say which is which.
 */
function TableCard({ t, color, wide }: { t: StatTable; color: string; wide: boolean }) {
  const top = Math.max(...t.rows.map((r) => r.value), 0) || 1;
  return (
    <div className={`modal-tile rounded-xl p-3 min-w-0 flex flex-col ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-[12px] font-bold font-sans text-foreground leading-snug">{t.title}</p>
      {t.kicker && <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5 leading-snug">{t.kicker}</p>}
      <ul className={`mt-2.5 grid gap-x-5 gap-y-2 ${wide ? "sm:grid-cols-2" : ""}`} aria-label={t.title}>
        {t.rows.map((r) => (
          <li key={r.name} className="min-w-0">
            <span className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                {r.code && <img src={flagUrl(r.code)} alt="" width={16} height={12} loading="lazy" className="rounded-[2px] shrink-0 self-center" />}
                <span className="text-[11px] font-sans text-foreground truncate" title={r.name}>
                  {r.name}
                </span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-foreground shrink-0">{r.text}</span>
            </span>
            <span className="block h-1.5 rounded-full bg-muted overflow-hidden mt-1" aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * Math.max(0, r.value)) / top)}%`, background: color }} />
            </span>
            {r.note && <span className="block text-[9px] font-mono text-muted-foreground mt-0.5 leading-snug">{r.note}</span>}
          </li>
        ))}
      </ul>
      {t.note && <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2.5">{t.note}</p>}
      {t.source && <SourceLink sources={t.source} className="mt-auto pt-2" />}
    </div>
  );
}

function FactRow({ f }: { f: StatFact }) {
  return (
    <span className="flex justify-between items-baseline gap-2">
      <span className="text-[10px] text-muted-foreground font-sans shrink-0">{f.label}</span>
      <span className="text-[10px] font-semibold font-mono text-foreground text-right truncate">
        {f.value}
        {f.sub && <span className="font-normal text-muted-foreground"> · {f.sub}</span>}
      </span>
    </span>
  );
}

/**
 * The card. With `onOpen` it opens whatever the page opens (the Worldview
 * page's own window); without it, a card that has a series opens the window
 * below; a card with neither is not a button.
 */
export function StatCard({ s, onOpen, more }: { s: StatCardData; onOpen?: () => void; more?: string }) {
  const [open, setOpen] = useState(false);
  const color = s.color ?? DEFAULT_COLOR;
  const facts = (s.facts ?? seriesFacts(s)).slice(0, 3);
  const hasWindow = Boolean(s.series && s.series.length > 2);
  const act = onOpen ?? (hasWindow ? () => setOpen(true) : undefined);
  const body: ReactNode = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="flex items-start gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0 mt-[3px]" style={{ background: color }} aria-hidden />
          <span className="text-[10px] font-sans uppercase tracking-wider leading-snug text-muted-foreground">{s.label}</span>
        </span>
        {s.change && <ChangeChip c={s.change} />}
      </span>
      <span className="block text-xl font-bold font-mono leading-tight text-foreground mt-1">{s.value}</span>
      <span className="block text-[10px] font-mono leading-snug text-muted-foreground">{s.sub}</span>
      {(s.about || s.story) && (
        <span className="block text-[11px] font-sans leading-snug mt-1.5 line-clamp-4">
          {s.about && <span className="text-muted-foreground">{s.about} </span>}
          {s.story && <span className="text-foreground/85">{s.story}</span>}
        </span>
      )}
      <span className="mt-auto block w-full">
        {s.series && s.series.length > 2 && (
          <span className="block pt-2">
            <StatSparkline series={s.series} color={color} split={s.split} />
            <span className="flex justify-between text-[9px] font-mono text-muted-foreground mt-0.5">
              <span>{s.series[0][0]}</span>
              {s.split && s.split <= lastOf(s.series)[0] && <span>projected from {s.split}</span>}
              <span>{lastOf(s.series)[0]}</span>
            </span>
          </span>
        )}
        {facts.length > 0 && (
          <span className="mt-2 pt-2 border-t border-border/40 flex flex-col gap-1">
            {facts.map((f) => (
              <FactRow key={f.label} f={f} />
            ))}
          </span>
        )}
        {act && (
          <span className="flex items-center gap-1 text-[10px] font-sans text-secondary mt-2">
            {more ?? "The full series and its figures"}
            <ArrowRight size={10} weight="bold" aria-hidden />
          </span>
        )}
      </span>
    </>
  );
  const shell = "modal-tile h-full w-full rounded-xl px-3 py-2.5 flex flex-col text-left";
  return (
    <>
      {act ? (
        <button type="button" onClick={act} aria-haspopup="dialog" className={`${shell} cursor-pointer transition-colors hover:border-secondary/60`}>
          {body}
        </button>
      ) : (
        <div className={shell}>{body}</div>
      )}
      {open && createPortal(<StatWindow s={s} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

/**
 * The window behind a card: the figure, what it measures and why it matters,
 * its series as a chart with its axes, the facts in full, the figure broken
 * down by region, group, country and type, the figures beside it, and its
 * sources.
 */
function StatWindow({ s, onClose }: { s: StatCardData; onClose: () => void }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isExpanded, setIsExpanded] = useState(false);
  const id = useId().replace(/:/g, "");
  const color = s.color ?? DEFAULT_COLOR;
  const series = s.series ?? [];
  const fmt = s.fmt ?? ((v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }));
  const split = s.split && series.length && s.split <= lastOf(series)[0] ? s.split : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const muted = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.5)";
  const ink = isLight ? "#0f172a" : "#f1f0ff";
  const data = series.map(([y, v]) => ({ year: String(y), a: !split || y < split ? v : null, p: split && y >= split - 1 ? v : null }));
  const given = [...(s.facts ?? []), ...(s.moreFacts ?? [])];
  const facts = s.facts && s.facts.length > 3 ? given : [...(s.facts ?? []), ...seriesFacts(s, true).filter((f) => !given.some((x) => x.label === f.label)), ...(s.moreFacts ?? [])];
  const tables = s.tables ?? [];
  // The figure's own source, then each breakdown's, once each.
  const sources = [...(s.source ? (Array.isArray(s.source) ? s.source : [s.source]) : []), ...tables.flatMap((t) => (t.source ? [t.source] : []))].filter(
    (x, i, all) => all.findIndex((o) => o.label === x.label && o.url === x.url) === i,
  );
  const worked = tables.some((t) => t.rows.some((r) => r.note?.includes("% of")));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${s.label} in detail`}
    >
      <div className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : `${tables.length ? "max-w-4xl" : "max-w-2xl"} max-h-[90vh]`}`}>
        <div className="p-6">
          <div className="relative flex items-start justify-between -mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(90deg, ${color}33, ${color}14, ${color}26)` }} />
            <div className="relative min-w-0">
              <h2 className="text-xl font-bold font-sans text-foreground leading-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} aria-hidden />
                {s.label}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-2xl font-bold font-mono text-foreground leading-none">{s.value}</span>
                {s.change && <ChangeChip c={s.change} />}
              </div>
              <p className="text-[11px] font-sans text-muted-foreground mt-1.5">{s.sub}</p>
            </div>
            <div className="relative flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label={isExpanded ? "Collapse modal" : "Expand modal to full screen"}
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                {isExpanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
              </button>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          {(s.about || s.story) && (
            <p className="text-[13px] font-sans leading-relaxed mt-5">
              {s.about && <span className="text-muted-foreground">{s.about} </span>}
              {s.story && <span className="text-foreground/90">{s.story}</span>}
            </p>
          )}

          {(s.what || s.why) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {s.what && (
                <div className="modal-tile rounded-xl p-3">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">What it measures</p>
                  <p className="text-[12px] font-sans leading-relaxed text-foreground/90">{s.what}</p>
                </div>
              )}
              {s.why && (
                <div className="modal-tile rounded-xl p-3">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Why it matters</p>
                  <p className="text-[12px] font-sans leading-relaxed text-foreground/90">{s.why}</p>
                </div>
              )}
            </div>
          )}

          {series.length > 2 && (
            <>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                The series · {series[0][0]}–{lastOf(series)[0]}
                {split ? ` · projected from ${split}` : ""}
              </p>
              <div className="modal-tile rounded-xl p-3" role="img" aria-label={`${s.label}, ${series[0][0]} to ${lastOf(series)[0]}: ${fmt(series[0][1])} to ${fmt(lastOf(series)[1])}.`}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`stat-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 9, fill: muted, fontFamily: "monospace" }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis width={56} tick={{ fontSize: 9, fill: muted, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} domain={["auto", "auto"]} />
                    {split && <ReferenceArea x1={String(split)} x2={String(lastOf(series)[0])} fill={isLight ? "rgba(99,102,241,0.07)" : "rgba(129,140,248,0.10)"} fillOpacity={1} ifOverflow="visible" />}
                    <Tooltip
                      contentStyle={{ background: isLight ? "#ffffff" : "#15151a", border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11, fontFamily: "monospace", color: ink }}
                      itemStyle={{ color: ink }}
                      labelStyle={{ color: muted }}
                      formatter={(v: number, k: string) => [fmt(v), k === "p" ? `${s.label}, projected` : s.label]}
                    />
                    <Area type="monotone" dataKey="a" stroke={color} strokeWidth={2} fill={`url(#stat-${id})`} isAnimationActive={false} />
                    <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2} strokeDasharray="5 4" fill={`url(#stat-${id})`} fillOpacity={0.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {facts.length > 0 && (
            <>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">In figures</p>
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${tables.length ? "md:grid-cols-4" : ""}`}>
                {facts.map((f) => (
                  <div key={f.label} className="modal-tile rounded-xl p-3 min-w-0">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{f.label}</p>
                    <p className="text-sm font-bold font-mono text-foreground leading-tight break-words">{f.value}</p>
                    {f.sub && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{f.sub}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {tables.length > 0 && (
            <>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                Broken down · {tables.map((t) => t.title.toLowerCase()).join(" · ")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tables.map((t, i) => (
                  // An odd one out takes the full width, its rows in two columns.
                  <TableCard key={t.key} t={t} color={color} wide={tables.length % 2 === 1 && i === 0} />
                ))}
              </div>
            </>
          )}

          {s.related && s.related.rows.length > 0 && (
            <>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">{s.related.title}</p>
              <div className="modal-tile rounded-xl px-3 py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {s.related.rows.map((f) => (
                  <FactRow key={f.label} f={f} />
                ))}
              </div>
            </>
          )}

          <div className="text-[9px] font-sans text-muted-foreground mt-5 pt-3 border-t border-border/40 space-y-1 leading-relaxed">
            {(s.notes ?? []).map((n) => (
              <p key={n}>{n}</p>
            ))}
            <p>
              The highest, the lowest and the reading ten years back are read off the series shown
              {worked ? "; a share is a part over its source's total for the same year" : ""}. Nothing else here is worked out.
            </p>
          </div>
          {sources.length > 0 && <SourceLink sources={sources} className="mt-1" />}
        </div>
      </div>
    </div>
  );
}
