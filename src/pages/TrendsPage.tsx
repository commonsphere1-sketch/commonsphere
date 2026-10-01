/**
 * Trends & Projections: where the world has been heading and where the
 * bodies that publish projections put it next - as a hero, a row of headline
 * tiles, and a section each, in the card, tile and chart language of the
 * Humanitarian and Worldview pages.
 *
 * Every figure is published. The projections are the IMF's World Economic
 * Outlook (the economy, to five years out) and the UN's World Population
 * Prospects (people, to 2100), from projections.ts, built by
 * build-projections.cjs; the trends are the world series in worldview.ts.
 * In each chart the publisher's estimates of the past are a solid line and
 * its projections a dashed one, and the page says where one becomes the
 * other.
 *
 * What is not here: a probability, a "confidence", or a forecast for a
 * sector. The page this replaces gave all three, written by hand; no body
 * publishes them, so the scenarios shown are the ones a body does publish -
 * the UN's low and high variants - with no likelihood put on either.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartLineUp, Globe, Lightning, Target, TrendUp, Users } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { SectionNav, type NavSection } from "../components/SectionNav";
import { StyledSelect } from "../components/StyledSelect";
import { usdFromBillions } from "../lib/money";
import { WORLD, WORLDVIEW_RETRIEVED, type WorldIndicator } from "../data/worldview";
import {
  POPULATION_OUTLOOK,
  POPULATION_VARIANTS,
  PROJECTIONS_RETRIEVED,
  PROJECTION_SOURCES,
  WEO_COUNTRIES,
  WEO_GROUPS,
  type CountryOutlook,
  type Point,
} from "../data/projections";

// ── Look ───────────────────────────────────────────────────────────────────

function useLook() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const head = isLight ? "#0f172a" : "#f1f0ff";
  const muted = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.5)";
  return {
    isLight,
    head,
    muted,
    card: {
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
      border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    },
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    track: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)",
    /** The wash over the years that are projections. */
    ahead: isLight ? "rgba(99,102,241,0.07)" : "rgba(129,140,248,0.10)",
    accent: isLight ? "#2a78d6" : "#3987e5",
    tooltip: {
      contentStyle: {
        background: isLight ? "#ffffff" : "#15151a",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        fontSize: 11,
        fontFamily: "monospace",
        color: head,
      },
      // The lines of a hover box are in ink, not in their series' colour.
      itemStyle: { color: head },
      labelStyle: { color: muted },
    },
  };
}
type Look = ReturnType<typeof useLook>;

/** The series of the charts, by what they are. The same in both themes. */
const SERIES = {
  world: "#6366f1",
  advanced: "#0ea5e9",
  emerging: "#f59e0b",
  low: "#10b981",
  medium: "#6366f1",
  high: "#ef4444",
  people: "#8b5cf6",
};
const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"];

// ── Figures ────────────────────────────────────────────────────────────────

const WEO = PROJECTION_SOURCES.weo;
const WPP = PROJECTION_SOURCES.wpp;
const THIS_YEAR = new Date().getFullYear();

const at = (s: Point[] | undefined, year: number) => s?.find(([y]) => y === year)?.[1];
const last = (s: Point[]) => s[s.length - 1];
const people = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}bn` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : Math.round(n).toLocaleString("en-US"));
const pct = (v: number, dp = 1) => `${v.toFixed(dp)}%`;
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}`;
const flagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const WORLD_POP = POPULATION_OUTLOOK[0];
const POP_PEAK = WORLD_POP.population.reduce((a, b) => (b[1] > a[1] ? b : a));

/** A world series' value as its own format prints it. */
function fmtWorld(ind: WorldIndicator, v: number): string {
  if (ind.format === "pct") return `${v.toFixed(ind.dp)}%`;
  if (ind.format === "usd") return v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${Math.round(v / 1e6).toLocaleString("en-US")}M`;
  if (ind.format === "count") return v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : Math.round(v).toLocaleString("en-US");
  return v >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(ind.dp);
}

/** A world series' reading about ten years before its latest, where it has one. */
function decadeBefore(s: Point[]): Point | null {
  const [ly] = last(s);
  const earlier = s.filter(([y]) => y <= ly - 10);
  const p = earlier[earlier.length - 1];
  return p && ly - 10 - p[0] <= 2 ? p : null;
}

// ── Pieces ─────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { card } = useLook();
  return (
    <div className={`rounded-2xl p-5 min-w-0 ${className}`} style={card}>
      {children}
    </div>
  );
}

function CardHead({ title, kicker }: { title: string; kicker: string }) {
  const { head, muted } = useLook();
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold font-sans" style={{ color: head }}>
        {title}
      </h3>
      <p className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: muted }}>
        {kicker}
      </p>
    </div>
  );
}

function SectionHead({ icon, color, title, kicker }: { icon: ReactNode; color: string; title: string; kicker: string }) {
  const { head, muted } = useLook();
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-bold font-sans leading-tight" style={{ color: head }}>
          {title}
        </h2>
        <p className="text-xs font-sans" style={{ color: muted }}>
          {kicker}
        </p>
      </div>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  const { muted } = useLook();
  return (
    <p className="text-[10px] font-sans leading-relaxed mt-3 max-w-4xl" style={{ color: muted }}>
      {children}
    </p>
  );
}

function Legend({ items }: { items: { color: string; label: string; value?: string; dashed?: boolean }[] }) {
  const { head, muted } = useLook();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3">
      {items.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="w-4 h-0 border-t-2" style={{ borderColor: l.color, borderStyle: l.dashed ? "dashed" : "solid" }} aria-hidden />
          <span className="text-[10px] font-sans" style={{ color: muted }}>
            {l.label}
          </span>
          {l.value && (
            <span className="text-[10px] font-mono font-bold" style={{ color: head }}>
              {l.value}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** A series' trend across the foot of a tile: grey to where the estimates end, dashed from there, the last point in the accent. */
function TileTrend({ series, split, accent }: { series: Point[]; split?: number; accent: string }) {
  if (series.length < 3) return null;
  const x0 = series[0][0];
  const x1 = last(series)[0];
  const ys = series.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (x: number) => 3 + ((x - x0) / (x1 - x0 || 1)) * 94;
  const py = (y: number) => 86 - ((y - lo) / (hi - lo || 1)) * 72;
  const path = (pts: Point[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("");
  const past = split ? series.filter(([y]) => y < split) : series;
  const ahead = split ? series.filter(([y]) => y >= split - 1) : [];
  const [lx, ly] = last(series);
  return (
    <span className="relative block h-7 w-full text-muted-foreground" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {past.length > 1 && <path d={path(past)} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
        {ahead.length > 1 && <path d={path(ahead)} fill="none" stroke={accent} strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
      </svg>
      <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${px(lx)}%`, top: `${py(ly)}%`, background: accent }} />
    </span>
  );
}

type Stat = { key: string; label: string; value: string; sub: string; move?: { text: string; dir: "up" | "down" | "flat" }; about: string; series?: Point[]; split?: number };

/** A headline figure as a tile: what it is, the figure, whose it is and for when, where it has come from, what it means, and its line. */
function StatTile({ s }: { s: Stat }) {
  const { head, muted, accent } = useLook();
  const Icon = s.move?.dir === "up" ? ArrowUpRight : s.move?.dir === "down" ? ArrowDownRight : ArrowRight;
  return (
    <div className="modal-tile h-full rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
      <p className="text-[10px] font-sans uppercase tracking-wider leading-snug" style={{ color: muted }}>
        {s.label}
      </p>
      <p className="text-xl font-bold font-mono leading-tight" style={{ color: head }}>
        {s.value}
      </p>
      <p className="text-[10px] font-mono leading-snug" style={{ color: muted }}>
        {s.sub}
      </p>
      {s.move && (
        <p className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground">
          <Icon size={10} weight="bold" aria-hidden />
          <span>{s.move.text}</span>
        </p>
      )}
      <p className="text-[11px] font-sans leading-snug mt-1" style={{ color: muted }}>
        {s.about}
      </p>
      {s.series && (
        <span className="mt-auto block w-full pt-2">
          <TileTrend series={s.series} split={s.split} accent={accent} />
        </span>
      )}
    </div>
  );
}

const axis = (look: Look) => ({ tick: { fontSize: 9, fill: look.muted, fontFamily: "monospace" }, axisLine: false, tickLine: false });

// ── Charts ─────────────────────────────────────────────────────────────────

/**
 * One series as an area, solid to where the publisher's estimates end and
 * dashed from there. Recharts cannot change a line's stroke part-way, so the
 * series is two keys; the dashed one also carries the last estimate, so the
 * two join.
 */
function SplitArea({ series, split, color, name, fmt, tick, height = 250, mark, ticks }: { series: Point[]; split: number; color: string; name: string; fmt: (v: number) => string; tick: (v: number) => string; height?: number; mark?: { year: number; label: string }; ticks?: number[] }) {
  const look = useLook();
  const data = series.map(([y, v]) => ({ year: String(y), a: y < split ? v : null, p: y >= split - 1 ? v : null }));
  const id = `fill-${name.replace(/\W+/g, "")}`;
  return (
    <div role="img" aria-label={`${name}, ${series[0][0]} to ${last(series)[0]}: ${fmt(series[0][1])} to ${fmt(last(series)[1])}. Projections from ${split}.`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 14, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" {...axis(look)} minTickGap={22} ticks={ticks?.map(String)} />
          <YAxis {...axis(look)} width={48} tickFormatter={tick} domain={[0, "auto"]} />
          <ReferenceArea x1={String(split)} x2={String(last(series)[0])} fill={look.ahead} fillOpacity={1} ifOverflow="visible" />
          {mark && <ReferenceLine x={String(mark.year)} stroke={look.muted} strokeDasharray="2 3" label={{ value: mark.label, position: "top", fontSize: 9, fill: look.muted, fontFamily: "monospace" }} />}
          <Tooltip {...look.tooltip} formatter={(v: number, k: string) => [fmt(v), k === "p" ? `${name}, projected` : name]} />
          <Area type="monotone" dataKey="a" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} connectNulls={false} />
          <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2} strokeDasharray="5 4" fill={`url(#${id})`} fillOpacity={0.5} isAnimationActive={false} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type LineSpec = { key: string; label: string; color: string; series: Point[] };

/** Several series on one axis, with the projected years washed. A line is dashed over its projected years. */
function OutlookLines({ lines, split, fmt, height = 230, from, tick }: { lines: LineSpec[]; split: number; fmt: (v: number) => string; height?: number; from?: number; tick?: (v: number) => string }) {
  const look = useLook();
  const years = [...new Set(lines.flatMap((l) => l.series.map(([y]) => y)))].filter((y) => !from || y >= from).sort((a, b) => a - b);
  if (years.length < 2) return null;
  const data = years.map((y) => {
    const row: Record<string, string | number | null> = { year: String(y) };
    for (const l of lines) {
      const v = at(l.series, y) ?? null;
      row[`${l.key}A`] = y < split ? v : null;
      row[`${l.key}P`] = y >= split - 1 ? v : null;
    }
    return row;
  });
  const lastYear = years[years.length - 1];
  const nameOf = (k: string) => {
    const l = lines.find((x) => k.startsWith(x.key));
    return `${l?.label ?? k}${k.endsWith("P") ? ", projected" : ""}`;
  };
  return (
    <div role="img" aria-label={`${lines.map((l) => l.label).join(", ")}, ${years[0]} to ${lastYear}. Projections from ${split}; the latest figures are in the legend below.`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" {...axis(look)} minTickGap={18} />
          <YAxis {...axis(look)} width={44} tickFormatter={(v: number) => (tick ?? fmt)(v)} />
          {lastYear >= split && <ReferenceArea x1={String(split)} x2={String(lastYear)} fill={look.ahead} fillOpacity={1} ifOverflow="visible" />}
          <ReferenceLine y={0} stroke={look.grid} />
          <Tooltip {...look.tooltip} formatter={(v: number, k: string) => [fmt(v), nameOf(k)]} />
          {lines.flatMap((l) => [
            <Line key={`${l.key}A`} type="monotone" dataKey={`${l.key}A`} stroke={l.color} strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key={`${l.key}P`} type="monotone" dataKey={`${l.key}P`} stroke={l.color} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />,
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A row of a ranked list: a flag and a name, a bar in the row's own colour, and its figure in ink. */
function RankRow({ name, code, value, top, text, sub, color, min = 0 }: { name: string; code: string | null; value: number; top: number; text: string; sub?: string; color: string; min?: number }) {
  const { head, muted, track } = useLook();
  const width = top === min ? 0 : ((value - min) / (top - min)) * 100;
  return (
    <li className="grid grid-cols-[minmax(6.5rem,10rem)_1fr_auto] items-center gap-x-3">
      <span className="flex items-center gap-2 min-w-0">
        {code ? <img src={flagUrl(code)} alt="" width={18} height={13} loading="lazy" className="rounded-[2px] shrink-0" /> : <span className="w-[18px] shrink-0" />}
        <span className="block text-[11px] font-sans truncate" style={{ color: head }} title={name}>
          {name}
        </span>
      </span>
      <span className="h-2.5 rounded-full overflow-hidden" style={{ background: track }} aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, Math.min(100, width))}%`, background: color }} />
      </span>
      <span className="text-right">
        <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color: head }}>
          {text}
        </span>
        {sub && (
          <span className="text-[10px] font-mono tabular-nums" style={{ color: muted }}>
            {" "}
            {sub}
          </span>
        )}
      </span>
    </li>
  );
}

// ── One economy ────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = WEO_COUNTRIES.map((c) => ({ value: c.iso3, label: c.name }));

/** One economy's outlook, picked from every economy the IMF covers: its figures for this year and the last projected, and each series as a line. */
function CountryOutlookCard() {
  const { head, muted } = useLook();
  const [iso3, setIso3] = useState("USA");
  const c: CountryOutlook = WEO_COUNTRIES.find((x) => x.iso3 === iso3) ?? WEO_COUNTRIES[0];
  const first = WEO.firstProjected;
  const end = WEO.lastYear;
  /* An axis label for an amount in billions: short enough to fit beside a small chart. */
  const shortUsd = (v: number) => (v === 0 ? "$0" : v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}T` : v >= 1 ? `$${Math.round(v)}B` : `$${Math.round(v * 1000)}M`);
  const charts: { key: keyof CountryOutlook; label: string; color: string; fmt: (v: number) => string; tick?: (v: number) => string }[] = [
    { key: "gdp", label: "GDP, current US$", color: SERIES.world, fmt: (v) => usdFromBillions(v), tick: shortUsd },
    { key: "growth", label: "Real GDP growth", color: "#10b981", fmt: (v) => pct(v) },
    { key: "inflation", label: "Inflation", color: "#f59e0b", fmt: (v) => pct(v) },
    { key: "debt", label: "Government debt, % of GDP", color: "#ef4444", fmt: (v) => pct(v) },
    { key: "unemployment", label: "Unemployment", color: "#8b5cf6", fmt: (v) => pct(v) },
  ];
  const have = charts.filter((ch) => Array.isArray(c[ch.key]) && (c[ch.key] as Point[]).length > 1);
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold font-sans flex items-center gap-2" style={{ color: head }}>
            {c.code && <img src={flagUrl(c.code)} alt="" width={20} height={14} className="rounded-[2px]" />}
            {c.name}: the IMF's outlook
          </h3>
          <p className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: muted }}>
            {WEO.edition} · estimates to {first - 1}, projections {first}–{end}
          </p>
        </div>
        <StyledSelect value={iso3} onValueChange={setIso3} ariaLabel="Choose an economy" options={COUNTRY_OPTIONS} triggerClassName="chip-selected px-3 py-1.5 rounded-full font-medium" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        {have.map((ch) => {
          const s = c[ch.key] as Point[];
          const now = at(s, first);
          const then = at(s, end) ?? last(s)[1];
          const thenYear = at(s, end) !== undefined ? end : last(s)[0];
          return (
            <div key={ch.key} className="modal-tile rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-sans uppercase tracking-wider leading-snug" style={{ color: muted }}>
                {ch.label}
              </p>
              <p className="text-base font-bold font-mono leading-tight mt-0.5" style={{ color: head }}>
                {now !== undefined ? ch.fmt(now) : "—"}
              </p>
              <p className="text-[10px] font-mono" style={{ color: muted }}>
                {first} → {ch.fmt(then)} in {thenYear}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {have.map((ch) => (
          <div key={ch.key} className="min-w-0">
            <p className="text-[11px] font-semibold font-sans mb-1" style={{ color: head }}>
              {ch.label}
            </p>
            <OutlookLines lines={[{ key: "v", label: ch.label, color: ch.color, series: c[ch.key] as Point[] }]} split={first} fmt={ch.fmt} tick={ch.tick} height={150} />
          </div>
        ))}
      </div>
      {have.length < charts.length && (
        <Note>
          The IMF publishes no {charts.filter((ch) => !have.includes(ch)).map((ch) => ch.label.toLowerCase()).join(" or ")} series for {c.name}, so none is shown.
        </Note>
      )}
      <SourceLink sources={[WEO]} className="mt-3" />
    </Card>
  );
}

// ── Trends ─────────────────────────────────────────────────────────────────

/** The measures the Trends section follows, by the part of the world they describe. Each is a world series in worldview.ts. */
const TREND_GROUPS: { title: string; color: string; ids: string[] }[] = [
  { title: "Energy", color: "#10b981", ids: ["renewableElectricity", "fossilShare", "evSalesShare", "co2"] },
  { title: "Technology", color: "#8b5cf6", ids: ["internet", "aiInvestment", "robotInstalls", "research"] },
  { title: "Industry and trade", color: "#f59e0b", ids: ["trade", "manufacturingVA", "servicesVA", "highTechExports"] },
  { title: "People", color: "#3b82f6", ids: ["lifeExpectancy", "extremePoverty", "urban", "aged65"] },
];

/** A world series as a tile: its latest reading, its move on about ten years before in its own terms, and its line. */
function TrendTile({ id }: { id: string }) {
  const ind = WORLD[id];
  if (!ind || ind.series.length < 2) return null;
  const [year, v] = last(ind.series);
  const prev = decadeBefore(ind.series);
  const diff = prev ? v - prev[1] : 0;
  const move = !prev
    ? undefined
    : {
        dir: (Math.abs(diff) < 10 ** -ind.dp / 2 ? "flat" : diff > 0 ? "up" : "down") as "up" | "down" | "flat",
        text:
          ind.format === "pct"
            ? `${signed(diff, ind.dp)} points since ${prev[0]}`
            : `${signed((100 * diff) / prev[1], Math.abs((100 * diff) / prev[1]) < 10 ? 1 : 0)}% since ${prev[0]}`,
      };
  return (
    <StatTile
      s={{
        key: id,
        label: ind.label,
        value: fmtWorld(ind, v),
        sub: `${ind.unit} · ${year}`,
        move,
        about: ind.note ?? "",
        series: ind.series,
      }}
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "economy", label: "World economy" },
  { id: "countries", label: "Countries" },
  { id: "population", label: "Population" },
  { id: "scenarios", label: "Scenarios" },
  { id: "trends", label: "Trends" },
];

export function TrendsPage() {
  const look = useLook();
  const { isLight, head, muted } = look;
  const first = WEO.firstProjected;
  const end = WEO.lastYear;
  const { world, advanced, emerging } = WEO_GROUPS;
  const gdp = world.gdp ?? [];
  const gdpBase = at(gdp, first - 1) ?? 0;
  const gdpEnd = at(gdp, end) ?? 0;

  const stats = useMemo<Stat[]>(() => {
    const w = WEO_GROUPS.world;
    const line = (s: Point[] | undefined, label: string, fmt: (v: number) => string, about: string, key: string): Stat => {
      const now = at(s, first) ?? 0;
      const then = at(s, end) ?? 0;
      return {
        key,
        label,
        value: fmt(now),
        sub: `IMF projection · ${first}`,
        move: { dir: then > now ? "up" : then < now ? "down" : "flat", text: `${fmt(at(s, first - 1) ?? 0)} in ${first - 1} · ${fmt(then)} projected for ${end}` },
        about,
        series: s,
        split: first,
      };
    };
    const pop = WORLD_POP.population;
    const age = WORLD_POP.medianAge;
    const lex = WORLD_POP.lifeExpectancy;
    return [
      {
        key: "gdp",
        label: `World GDP in ${end}`,
        value: usdFromBillions(at(w.gdp, end) ?? 0),
        sub: `IMF projection · ${end}`,
        move: { dir: "up", text: `${usdFromBillions(at(w.gdp, first - 1) ?? 0)} in ${first - 1}` },
        about: "Everything the world's economies produce in a year, in current US dollars, so it includes price rises.",
        series: w.gdp,
        split: first,
      },
      line(w.growth, "Real growth", (v) => pct(v), "How much more the world produces than the year before, with price rises taken out.", "growth"),
      line(w.inflation, "Inflation", (v) => pct(v), "The rise in consumer prices over the year, averaged across the world's economies.", "inflation"),
      line(w.debt, "Government debt", (v) => `${pct(v)} of GDP`, "What the world's governments owe, against the size of the world economy.", "debt"),
      {
        key: "pop2050",
        label: "World population in 2050",
        value: people(at(pop, 2050) ?? 0),
        sub: "UN medium variant · 2050",
        move: { dir: "up", text: `${people(at(pop, THIS_YEAR) ?? 0)} in ${THIS_YEAR}` },
        about: "People alive on 1 July, on the UN's central projection of births, deaths and migration.",
        series: pop.filter(([y]) => y >= 1990 && y <= 2060),
        split: WPP.firstProjected,
      },
      {
        key: "peak",
        label: "Population peaks",
        value: String(POP_PEAK[0]),
        sub: `UN medium variant · at ${people(POP_PEAK[1])}`,
        move: { dir: "down", text: `${people(at(pop, 2100) ?? 0)} by 2100` },
        about: "The year the world's population is projected to be at its largest, before it begins to fall.",
        series: pop.filter(([y]) => y >= 2000),
        split: WPP.firstProjected,
      },
      {
        key: "age",
        label: "Median age in 2050",
        value: `${(at(age, 2050) ?? 0).toFixed(1)} years`,
        sub: "UN medium variant · 2050",
        move: { dir: "up", text: `${(at(age, THIS_YEAR) ?? 0).toFixed(1)} in ${THIS_YEAR} · ${(at(age, 2100) ?? 0).toFixed(1)} by 2100` },
        about: "Half the world's people are older than this and half younger.",
        series: age,
        split: WPP.firstProjected,
      },
      {
        key: "lex",
        label: "Life expectancy in 2050",
        value: `${(at(lex, 2050) ?? 0).toFixed(1)} years`,
        sub: "UN medium variant · 2050",
        move: { dir: "up", text: `${(at(lex, THIS_YEAR) ?? 0).toFixed(1)} in ${THIS_YEAR} · ${(at(lex, 2100) ?? 0).toFixed(1)} by 2100` },
        about: "The years a child born in that year would live if its death rates held for life.",
        series: lex,
        split: WPP.firstProjected,
      },
    ];
  }, [first, end]);

  /* The largest economies in the last projected year, with where each stands now. */
  const largest = useMemo(
    () =>
      WEO_COUNTRIES.map((c) => ({ c, now: at(c.gdp, first - 1), then: at(c.gdp, end) }))
        .filter((r): r is { c: CountryOutlook; now: number; then: number } => r.now !== undefined && r.then !== undefined)
        .sort((a, b) => b.then - a.then)
        .slice(0, 15),
    [first, end],
  );
  /* Growth projected for the first projected year, both ends of the list. */
  const growth = useMemo(() => {
    const all = WEO_COUNTRIES.map((c) => ({ c, v: at(c.growth, first) }))
      .filter((r): r is { c: CountryOutlook; v: number } => r.v !== undefined)
      .sort((a, b) => b.v - a.v);
    return { fastest: all.slice(0, 10), slowest: all.slice(-10).reverse(), of: all.length };
  }, [first]);

  const regions = POPULATION_OUTLOOK.slice(1);
  const regionTop = Math.max(...regions.flatMap((r) => [at(r.population, THIS_YEAR) ?? 0, at(r.population, 2050) ?? 0, at(r.population, 2100) ?? 0]));
  const med = WORLD_POP.population.filter(([y]) => y >= WPP.firstProjected);
  const variantRows = [
    { key: "low", label: "Low variant", color: SERIES.low, series: POPULATION_VARIANTS.low },
    { key: "medium", label: "Medium variant", color: SERIES.medium, series: med },
    { key: "high", label: "High variant", color: SERIES.high, series: POPULATION_VARIANTS.high },
  ];

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── Hero ── */}
        <div className="rounded-2xl relative overflow-hidden" style={{ background: isLight ? "#ffffff" : "#0b0b0d", border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.12)" }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle, ${isLight ? "#000000" : "#ffffff"} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
          <div className="relative px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: muted }}>
                CommonSphere · Trends &amp; Projections
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans" style={{ color: head }}>
                Where the world is heading
              </h1>
              <p className="text-sm font-sans mt-1.5" style={{ color: muted }}>
                The world economy to {end} as the IMF projects it, the world's people to 2100 as the UN does, and the trends behind both - each projection from the body
                that publishes it, with the year its estimates end and its projections begin.
              </p>
              <p className="text-[11px] font-sans mt-2" style={{ color: muted }}>
                IMF World Economic Outlook, {WEO.edition} · UN World Population Prospects {WPP.revision} · World Bank · retrieved {PROJECTIONS_RETRIEVED}
              </p>
            </div>
            <div className="lg:text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
                World GDP · IMF projection for {end}
              </p>
              <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1" style={{ color: head }}>
                {usdFromBillions(gdpEnd)}
              </p>
              <p className="mt-2 text-[11px] font-mono" style={{ color: muted }}>
                from <span style={{ color: head }}>{usdFromBillions(gdpBase)}</span> in {first - 1} · {signed(((gdpEnd - gdpBase) / (gdpBase || 1)) * 100, 0)}% in current dollars
              </p>
              <p className="mt-1 text-[10px] font-sans max-w-sm lg:ml-auto" style={{ color: muted }}>
                A projection, not a forecast with a probability: the IMF's central case, revised twice a year.
              </p>
            </div>
          </div>
        </div>

        <SectionNav label="Trends and projections sections" sections={SECTIONS} />

        <HeadlinesBanner
          label="Economy headlines"
          topics={["economy"]}
          subject={SUBJECT.economy}
          days={7}
          note={(outlets) => (
            <>
              The last week's economic news - {outlets}, five at most from each - refreshed every half hour. The tag is the place a story is about, violet for more than
              one. Each links to its source.
            </>
          )}
        />

        {/* ══ Overview ══ */}
        <section id="overview" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="overview-title">
          <SectionHead icon={<ChartLineUp size={18} weight="fill" />} color="#6366f1" title="At a glance" kicker="The headline projections: the economy from the IMF, people from the UN" />
          <h2 id="overview-title" className="sr-only">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <StatTile key={s.key} s={s} />
            ))}
          </div>
          <Note>
            In each tile's line, grey is what the publisher estimates has happened and the dashed part is what it projects. The IMF's estimates run to {first - 1} and its
            projections from {first}; the UN's projections begin in {WPP.firstProjected}.
          </Note>
        </section>

        {/* ══ World economy ══ */}
        <section id="economy" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="economy-title">
          <SectionHead icon={<TrendUp size={18} weight="fill" />} color="#6366f1" title="World economy" kicker={`The IMF's outlook to ${end}: output, growth, prices and debt`} />
          <h2 id="economy-title" className="sr-only">
            World economy
          </h2>
          <Card>
            <CardHead title="World GDP, and where the IMF projects it" kicker={`Current US dollars · IMF World Economic Outlook, ${WEO.edition} · ${gdp[0]?.[0]}–${end}`} />
            <SplitArea series={gdp} split={first} color={SERIES.world} name="World GDP" fmt={(v) => usdFromBillions(v)} tick={(v) => `$${Math.round(v / 1000)}T`} />
            <Legend
              items={[
                { color: SERIES.world, label: `Estimated, ${first - 1}`, value: usdFromBillions(gdpBase) },
                { color: SERIES.world, label: `Projected, ${end}`, value: usdFromBillions(gdpEnd), dashed: true },
              ]}
            />
            <Note>
              In current dollars, so the rise is part growth and part price rises and exchange rates. The shaded years are projections; the line is dashed through them.
            </Note>
            <SourceLink sources={[WEO]} className="mt-3" />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(
              [
                { key: "growth", title: "Real GDP growth", kicker: "% a year" },
                { key: "inflation", title: "Inflation", kicker: "Consumer prices, % a year" },
                { key: "debt", title: "Government debt", kicker: "% of GDP" },
              ] as const
            ).map((m) => {
              const lines: LineSpec[] = [
                { key: "w", label: "World", color: SERIES.world, series: world[m.key] ?? [] },
                { key: "a", label: "Advanced economies", color: SERIES.advanced, series: advanced[m.key] ?? [] },
                { key: "e", label: "Emerging and developing", color: SERIES.emerging, series: emerging[m.key] ?? [] },
              ].filter((l) => l.series.length > 1);
              return (
                <Card key={m.key}>
                  <CardHead title={m.title} kicker={`${m.kicker} · IMF · to ${end}`} />
                  <OutlookLines lines={lines} split={first} fmt={(v) => pct(v, m.key === "debt" ? 0 : 1)} from={2015} />
                  <Legend items={lines.map((l) => ({ color: l.color, label: `${l.label}, ${first}`, value: pct(at(l.series, first) ?? 0) }))} />
                  <SourceLink sources={[WEO]} className="mt-3" />
                </Card>
              );
            })}
          </div>
        </section>

        {/* ══ Countries ══ */}
        <section id="countries" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="countries-title">
          <SectionHead icon={<Globe size={18} weight="fill" />} color="#3b82f6" title="Countries" kicker={`${WEO_COUNTRIES.length} economies, as the IMF projects each`} />
          <h2 id="countries-title" className="sr-only">
            Countries
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title={`The fifteen largest economies in ${end}`} kicker={`GDP, current US dollars · IMF projection · with the change on ${first - 1}`} />
              <ul className="flex flex-col gap-2.5" aria-label={`Largest economies projected for ${end}`}>
                {largest.map(({ c, now, then }, i) => (
                  <RankRow key={c.iso3} name={c.name} code={c.code} value={then} top={largest[0].then} text={usdFromBillions(then)} sub={`${signed(((then - now) / now) * 100, 0)}%`} color={PALETTE[i % PALETTE.length]} />
                ))}
              </ul>
              <Note>
                The percentage is the change in current dollars from the IMF's {first - 1} estimate to its {end} projection - growth, price rises and exchange rates together -
                worked out here from the two published figures.
              </Note>
              <SourceLink sources={[WEO]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title={`Growth projected for ${first}`} kicker={`Real GDP, % · IMF · the ten fastest and ten slowest of ${growth.of}`} />
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: muted }}>
                Fastest
              </p>
              <ul className="flex flex-col gap-2" aria-label="Fastest growth projected">
                {growth.fastest.map(({ c, v }) => (
                  <RankRow key={c.iso3} name={c.name} code={c.code} value={v} top={growth.fastest[0].v} text={`${signed(v)}%`} color="#10b981" />
                ))}
              </ul>
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2" style={{ color: muted }}>
                Slowest
              </p>
              <ul className="flex flex-col gap-2" aria-label="Slowest growth projected">
                {growth.slowest.map(({ c, v }) => (
                  <RankRow key={c.iso3} name={c.name} code={c.code} value={Math.abs(v)} top={Math.max(...growth.slowest.map((r) => Math.abs(r.v)), 1)} text={`${signed(v)}%`} color={v < 0 ? "#ef4444" : "#f59e0b"} />
                ))}
              </ul>
              <Note>Small economies lead both ends: one mine, one harvest or one conflict moves a small economy's year a long way.</Note>
              <SourceLink sources={[WEO]} className="mt-3" />
            </Card>
          </div>
          <CountryOutlookCard />
        </section>

        {/* ══ Population ══ */}
        <section id="population" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="population-title">
          <SectionHead icon={<Users size={18} weight="fill" />} color="#8b5cf6" title="Population" kicker="The UN's medium variant to 2100: how many people, how old, and where" />
          <h2 id="population-title" className="sr-only">
            Population
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHead title="World population, 1950 to 2100" kicker={`People on 1 July · UN World Population Prospects ${WPP.revision}, medium variant`} />
              <SplitArea
                series={WORLD_POP.population}
                split={WPP.firstProjected}
                color={SERIES.people}
                name="World population"
                fmt={people}
                tick={(v) => `${(v / 1e9).toFixed(0)}bn`}
                height={280}
                ticks={[1950, 1975, 2000, 2025, 2050, 2075, 2100]}
                mark={{ year: POP_PEAK[0], label: `peak ${POP_PEAK[0]}` }}
              />
              <Legend
                items={[
                  { color: SERIES.people, label: `Now, ${THIS_YEAR}`, value: people(at(WORLD_POP.population, THIS_YEAR) ?? 0) },
                  { color: SERIES.people, label: `Peak, ${POP_PEAK[0]}`, value: people(POP_PEAK[1]), dashed: true },
                  { color: SERIES.people, label: "2100", value: people(at(WORLD_POP.population, 2100) ?? 0), dashed: true },
                ]}
              />
              <SourceLink sources={[WPP]} className="mt-3" />
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {[
                { label: "Median age", s: WORLD_POP.medianAge, fmt: (v: number) => `${v.toFixed(1)} years`, about: "Half the world is older than this." },
                { label: "Births per woman", s: WORLD_POP.fertility, fmt: (v: number) => v.toFixed(2), about: "About 2.1 keeps a population level over time." },
                { label: "Life expectancy", s: WORLD_POP.lifeExpectancy, fmt: (v: number) => `${v.toFixed(1)} years`, about: "At birth, for the year's death rates." },
              ].map((m) => (
                <StatTile
                  key={m.label}
                  s={{
                    key: m.label,
                    label: m.label,
                    value: m.fmt(at(m.s, THIS_YEAR) ?? 0),
                    sub: `UN · ${THIS_YEAR}`,
                    move: { dir: (at(m.s, 2100) ?? 0) > (at(m.s, THIS_YEAR) ?? 0) ? "up" : "down", text: `${m.fmt(at(m.s, 2050) ?? 0)} in 2050 · ${m.fmt(at(m.s, 2100) ?? 0)} in 2100` },
                    about: m.about,
                    series: m.s,
                    split: WPP.firstProjected,
                  }}
                />
              ))}
            </div>
          </div>
          <Card>
            <CardHead title="Where the people will be" kicker={`Population by region · UN medium variant · ${THIS_YEAR}, 2050 and 2100`} />
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4" aria-label="Population by region">
              {regions.map((r, i) => {
                const pts = [THIS_YEAR, 2050, 2100].map((y) => ({ y, v: at(r.population, y) ?? 0 }));
                const color = PALETTE[(i * 2) % PALETTE.length];
                return (
                  <li key={r.name}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold font-sans" style={{ color: head }}>
                        {r.name}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: muted }}>
                        {signed(((pts[2].v - pts[0].v) / (pts[0].v || 1)) * 100, 0)}% by 2100
                      </span>
                    </div>
                    {pts.map((p, k) => (
                      <div key={p.y} className="grid grid-cols-[2.5rem_1fr_3.5rem] items-center gap-x-2 mb-1">
                        <span className="text-[10px] font-mono" style={{ color: muted }}>
                          {p.y}
                        </span>
                        <span className="h-2 rounded-full overflow-hidden" style={{ background: look.track }}>
                          <span className="block h-full rounded-full" style={{ width: `${Math.max(1, (100 * p.v) / regionTop)}%`, background: color, opacity: k === 0 ? 1 : k === 1 ? 0.7 : 0.45 }} />
                        </span>
                        <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: head }}>
                          {people(p.v)}
                        </span>
                      </div>
                    ))}
                  </li>
                );
              })}
            </ul>
            <Note>A region's three bars are on one scale across all six, so they can be compared; the lighter the bar, the further ahead the year.</Note>
            <SourceLink sources={[WPP]} className="mt-3" />
          </Card>
        </section>

        {/* ══ Scenarios ══ */}
        <section id="scenarios" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="scenarios-title">
          <SectionHead icon={<Target size={18} weight="fill" />} color="#f97316" title="Scenarios" kicker="The UN's own: what the world's population does if families are a little smaller or larger" />
          <h2 id="scenarios-title" className="sr-only">
            Scenarios
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHead title="Three variants of the world's population" kicker={`People on 1 July · UN World Population Prospects ${WPP.revision} · ${WPP.firstProjected}–2100`} />
              <OutlookLines lines={variantRows.map((v) => ({ key: v.key, label: v.label, color: v.color, series: v.series }))} split={WPP.firstProjected} fmt={(v) => `${(v / 1e9).toFixed(1)}bn`} height={280} />
              <Legend items={variantRows.map((v) => ({ color: v.color, label: `${v.label}, 2100`, value: people(at(v.series, 2100) ?? 0), dashed: true }))} />
              <Note>
                The low and high variants assume half a child fewer or more per woman than the medium, everywhere and throughout. The UN gives neither a likelihood, and
                nor does this page: they mark out how much rests on fertility, which is the least certain part of the projection.
              </Note>
              <SourceLink sources={[WPP]} className="mt-3" />
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {variantRows.map((v) => (
                <div key={v.key} className="modal-tile rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-sans uppercase tracking-wider flex items-center gap-1.5" style={{ color: muted }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: v.color }} aria-hidden />
                    {v.label}
                  </p>
                  <p className="text-xl font-bold font-mono leading-tight mt-0.5" style={{ color: head }}>
                    {people(at(v.series, 2100) ?? 0)}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: muted }}>
                    in 2100 · {people(at(v.series, 2050) ?? 0)} in 2050
                  </p>
                  <p className="text-[11px] font-sans leading-snug mt-1" style={{ color: muted }}>
                    {v.key === "low" ? "Half a child fewer per woman than the medium." : v.key === "high" ? "Half a child more per woman than the medium." : "The UN's central projection, used everywhere else on this page."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Trends ══ */}
        <section id="trends" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="trends-title">
          <SectionHead icon={<Lightning size={18} weight="fill" />} color="#10b981" title="Trends" kicker="What has been moving: the latest reading of each measure, and its change on about ten years before" />
          <h2 id="trends-title" className="sr-only">
            Trends
          </h2>
          {TREND_GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} aria-hidden />
                <span className="text-[10px] font-bold font-sans uppercase tracking-widest" style={{ color: muted }}>
                  {g.title}
                </span>
                <div className="flex-1 h-px" style={{ background: look.grid }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {g.ids.map((id) => (
                  <TrendTile key={id} id={id} />
                ))}
              </div>
              <SourceLink sources={g.ids.flatMap((id) => (WORLD[id] ? [WORLD[id].source] : []))} />
            </div>
          ))}
          <Note>These are measured, not projected: each is a published world series to its latest year. The Worldview page has all of them, with what each means.</Note>
        </section>

        <p className="text-[10px] font-sans leading-relaxed max-w-4xl px-1" style={{ color: muted }}>
          Every projection on this page is its publisher's own: the economy from the IMF's World Economic Outlook ({WEO.edition}; estimates to {first - 1}, projections{" "}
          {first}–{end}) and people from the UN's World Population Prospects {WPP.revision} (projections from {WPP.firstProjected}), retrieved {PROJECTIONS_RETRIEVED}.
          The trends are world series retrieved {WORLDVIEW_RETRIEVED}. The page gives no probabilities, confidence scores or sector forecasts, because no body publishes
          them; a change given as a percentage between two years is worked out here from the two published figures.
        </p>
      </div>
    </div>
  );
}
