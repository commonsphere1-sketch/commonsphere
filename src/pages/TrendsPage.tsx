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
import { ChartLineUp, Globe, Lightning, Target, TrendUp, Users } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { SectionNav, type NavSection } from "../components/SectionNav";
import { StyledSelect } from "../components/StyledSelect";
import { StatCard, splitChange, type StatCardData, type StatFact, type StatTable } from "../components/StatCard";
import { usdFromBillions } from "../lib/money";
import { WORLD, WORLDVIEW_RETRIEVED, type WorldIndicator } from "../data/worldview";
import { EXPLAIN } from "../data/worldviewExplain";
import { TREND_BRIEFS, TREND_DETAILS, TREND_EXPLAIN, TREND_EXTRAS, type DetailAs } from "../data/trendDetails";
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
  if (ind.format === "count") return v >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : Math.round(v).toLocaleString("en-US");
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

/**
 * The measures the Trends section follows, by the part of the world they
 * describe. Each is a world series in worldview.ts, with its own source.
 */
const TREND_GROUPS: { id: string; nav: string; title: string; kicker: string; color: string; ids: string[] }[] = [
  { id: "trend-energy", nav: "Energy", title: "Energy", kicker: "What the world runs on", color: "#10b981", ids: ["renewableElectricity", "fossilShare", "evSalesShare", "co2"] },
  { id: "trend-technology", nav: "Technology", title: "Technology", kicker: "What people and firms are taking up", color: "#8b5cf6", ids: ["internet", "broadband", "mobile", "secureServers", "aiInvestment", "genAiInvestment", "robotInstalls", "robotStock"] },
  { id: "trend-research", nav: "Research & development", title: "Research and development", kicker: "What is spent on finding things out, and what comes of it", color: "#06b6d4", ids: ["research", "researchers", "sciArticles", "aiPublications", "patents", "ipReceipts", "spaceLaunches", "nuclearElectricity"] },
  {
    id: "trend-relations",
    nav: "International relations",
    title: "International relations",
    kicker: "War and peace, arms, movement and money between countries",
    color: "#ef4444",
    ids: ["conflicts", "conflictDeaths", "militaryUsd", "militaryGdp", "armsTransfers", "nuclearWarheads", "displaced", "remittances"],
  },
  { id: "trend-industry", nav: "Industry & trade", title: "Industry and trade", kicker: "What the world makes and sells", color: "#f59e0b", ids: ["trade", "manufacturingVA", "servicesVA", "highTechExports"] },
  { id: "trend-people", nav: "People", title: "People", kicker: "How long people live, where, and on what", color: "#3b82f6", ids: ["lifeExpectancy", "extremePoverty", "urban", "aged65"] },
];

/** A trend's world series: one of the Worldview page's, or one of the two trendDetails.ts builds for this page. */
const figureOf = (id: string): WorldIndicator | undefined => WORLD[id] ?? TREND_EXTRAS[id];

const usdShort = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${Math.round(v / 1e6).toLocaleString("en-US")}M`);
/** A value of a breakdown, printed as its table says: as the figure itself is, or as a percentage, a count or dollars. */
const printAs = (ind: WorldIndicator, as: DetailAs, v: number) =>
  as === "figure"
    ? fmtWorld(ind, v)
    : as === "pct"
      ? `${v.toFixed(1)}%`
      : as === "usd"
        ? usdShort(v)
        : as === "usdPerKg"
          ? `$${v.toLocaleString("en-US")}/kg`
          : as === "twh"
            ? `${v.toLocaleString("en-US")} TWh`
            : v.toLocaleString("en-US");
const shareText = (part: number, total: number) => {
  const p = (100 * part) / total;
  return p > 0 && p < 0.1 ? "under 0.1%" : `${p.toFixed(p < 10 ? 1 : 0)}%`;
};
/** Tables whose rows are parts of a total that is not the world figure on the card. */
const OF_THE_TOTAL = new Set(["types", "investment", "origins", "hosts", "people"]);

/**
 * A trend's breakdowns for its window: its make-up by kind, where
 * worldview.ts has it, then the tables build-trend-details.cjs wrote - by
 * region, income group and country, by type, and the investment behind it.
 * A row says its share of the total where its table has one, and its reading
 * ten years before where the source has that.
 */
function tablesOf(ind: WorldIndicator): StatTable[] {
  const out: StatTable[] = [];
  if (ind.breakdown?.length) {
    const shares = ind.breakdownUnit === "%";
    const [, total] = last(ind.series);
    // Parts that add up to the figure are given their share of it; kinds counted apart from it are not.
    const parts = ind.breakdown.filter(([label]) => !label.startsWith("Also: "));
    const whole = !shares && Math.abs(parts.reduce((t, [, v]) => t + v, 0) - total) <= Math.abs(total) * 0.005;
    out.push({
      key: "kinds",
      title: shares ? "By source" : "By kind",
      kicker: `${shares ? "Share of the whole" : ind.unit} · ${ind.breakdownYear}`,
      rows: ind.breakdown
        .filter(([, v]) => v > 0)
        .map(([label, v]) => {
          const apart = label.startsWith("Also: ");
          return {
            name: apart ? label.slice(6, 7).toUpperCase() + label.slice(7) : label,
            value: v,
            text: shares ? `${v.toFixed(1)}%` : fmtWorld(ind, v),
            note: apart ? "counted apart from the figure" : whole ? `${shareText(v, total)} of the total` : undefined,
          };
        }),
      source: ind.source,
    });
  }
  for (const t of TREND_DETAILS[ind.id]?.tables ?? []) {
    const of = OF_THE_TOTAL.has(t.key) ? "of the total" : "of the world's";
    out.push({
      key: t.key,
      title: t.title,
      kicker: t.kicker,
      rows: t.rows.map((r) => ({
        name: r.n,
        value: r.v,
        text: printAs(ind, t.as, r.v),
        code: r.c,
        note: [t.kind === "share" && t.total ? `${shareText(r.v, t.total)} ${of}` : "", r.was ? `${printAs(ind, t.as, r.was[1])} in ${r.was[0]}` : "", r.d ?? ""].filter(Boolean).join(" · ") || undefined,
      })),
      note: t.note,
      source: t.source,
    });
  }
  return out;
}

/** A world series' latest reading as a line for another card's window. */
function relatedFact(id: string, beside: string[]): StatFact | null {
  const ind = figureOf(id);
  if (!ind || !ind.series.length) return null;
  const [year, v] = last(ind.series);
  // Two figures of a group can share a name (military spending, in dollars and as a share of GDP): the unit tells them apart.
  const twin = beside.some((x) => x !== id && figureOf(x)?.label === ind.label);
  return { label: twin ? `${ind.label}, ${ind.unit}` : ind.label, value: fmtWorld(ind, v), sub: twin ? `${year}` : `${ind.unit} · ${year}` };
}

/**
 * A world series as a card: its latest reading, its move on about ten years
 * before in its own terms, what it measures, and its line. Its window adds
 * what it measures and why it matters, its move over the whole series, its
 * breakdowns, and the other figures of its group.
 */
function TrendTile({ id, color, group, beside }: { id: string; color: string; group: string; beside: string[] }) {
  const ind = figureOf(id);
  if (!ind || ind.series.length < 2) return null;
  const [year, v] = last(ind.series);
  const prev = decadeBefore(ind.series);
  const diff = prev ? v - prev[1] : 0;
  const flat = Math.abs(diff) < 10 ** -ind.dp / 2;
  const change = !prev
    ? null
    : splitChange(
        flat
          ? `level with ${prev[0]}`
          : ind.format === "pct"
            ? `${signed(diff, ind.dp)} points since ${prev[0]}`
            : `${signed((100 * diff) / prev[1], Math.abs((100 * diff) / prev[1]) < 10 ? 1 : 0)}% since ${prev[0]}`,
        flat ? "flat" : diff > 0 ? "up" : "down",
        // Better or worse only where the series itself says which way is which.
        flat || ind.upIsGood === null ? null : diff > 0 === ind.upIsGood ? "better" : "worse",
      );
  const detail = TREND_DETAILS[id];
  const explain = EXPLAIN[id] ?? TREND_EXPLAIN[id];
  const [y0, v0] = ind.series[0];
  const moved = v - v0;
  const moreFacts: StatFact[] = [
    ...(change ? [{ label: "Change in ten years", value: change.chip, sub: change.caption }] : []),
    ...(ind.series.length > 2 && Math.abs(moved) >= 10 ** -ind.dp / 2 && (ind.format === "pct" || v0 !== 0)
      ? [{ label: `Change since ${y0}`, value: ind.format === "pct" ? `${signed(moved, ind.dp)} pts` : `${signed((100 * moved) / Math.abs(v0), Math.abs((100 * moved) / v0) < 10 ? 1 : 0)}%`, sub: `from ${fmtWorld(ind, v0)}` }]
      : []),
    ...(detail?.facts ?? []).map((f) => ({ label: f.label, value: printAs(ind, f.as, f.v), sub: f.sub })),
  ];
  const related = beside.filter((x) => x !== id).flatMap((x) => relatedFact(x, beside) ?? []);
  return (
    <StatCard
      s={{
        label: ind.label,
        value: fmtWorld(ind, v),
        sub: `${ind.unit} · ${year}`,
        change,
        about: ind.note,
        series: ind.series,
        color,
        fmt: (x) => fmtWorld(ind, x),
        source: ind.source,
        what: explain?.what,
        why: explain?.why,
        moreFacts,
        tables: tablesOf(ind),
        briefs: TREND_BRIEFS[id],
        related: { title: `Beside it · ${group.toLowerCase()}`, rows: related },
        notes: detail?.notes,
      }}
      more="Regions, types, facts and the full series"
    />
  );
}

/**
 * The world population chart, explained under it: the milestones on the
 * line, what the solid and dashed parts are, how the UN makes the
 * projection, what it shows and what it rests on. Every number is read off
 * the UN's series in projections.ts; the account of the method is the UN's
 * own, from World Population Prospects' methodology.
 */
function PopulationExplained() {
  const pop = WORLD_POP.population;
  const now = at(pop, THIS_YEAR) ?? 0;
  const end = at(pop, 2100) ?? 0;
  const [peakYear, peak] = POP_PEAK;
  /** The first year from now in which the projection is at or past a number. */
  const passes = (n: number) => pop.find(([y, v]) => y >= THIS_YEAR && v >= n)?.[0];
  const fert = (y: number) => at(WORLD_POP.fertility, y);
  const age = (y: number) => at(WORLD_POP.medianAge, y);
  const lex = (y: number) => at(WORLD_POP.lifeExpectancy, y);
  const low = POPULATION_VARIANTS.low;
  const lowPeak = low.reduce((a, b) => (b[1] > a[1] ? b : a));
  const marks = [
    { label: `Now · ${THIS_YEAR}`, value: people(now), sub: "on the UN's medium variant" },
    ...[9e9, 10e9].flatMap((n) => {
      const y = passes(n);
      return y ? [{ label: `Passes ${n / 1e9} billion`, value: String(y), sub: `${y - THIS_YEAR} years from now` }] : [];
    }),
    { label: "Peaks", value: String(peakYear), sub: `at ${people(peak)}` },
    { label: "By 2100", value: people(end), sub: `${people(peak - end)} below the peak` },
  ];
  const points: { title: string; text: ReactNode }[] = [
    {
      title: "What the line is",
      text: (
        <>
          The solid line is the UN's estimate of everyone alive on 1 July of each year since 1950, built from censuses, registers of births and deaths, and surveys.
          From {WPP.firstProjected} the dashed line is a projection: the medium variant of World Population Prospects {WPP.revision}, which the UN revises every few
          years as new counts come in.
        </>
      ),
    },
    {
      title: "How the projection is made",
      text: (
        <>
          Country by country, the UN carries the population forward a year at a time, by age and sex: everyone grows a year older, some die, babies are born, and
          migrants come and go. What it has to assume is how many children women will have, how long people will live, and how many will move. The medium variant is
          the middle path of the range its models give for births and deaths.
        </>
      ),
    },
    {
      title: "What it shows",
      text: (
        <>
          From {people(now)} now the world adds {people(peak - now)} by {peakYear} - {((100 * (peak - now)) / now).toFixed(0)}% more - then slowly shrinks. Growth is
          already slowing: women have {fert(THIS_YEAR)?.toFixed(2)} children on average, against {fert(1950)?.toFixed(2)} in 1950, and the projection has{" "}
          {fert(2050)?.toFixed(2)} in 2050 and {fert(2100)?.toFixed(2)} in 2100; about 2.1 keeps a population level. People also live longer - {lex(THIS_YEAR)?.toFixed(1)}{" "}
          years at birth now, {lex(2100)?.toFixed(1)} projected for 2100 - so the world grows older: half are older than {age(THIS_YEAR)?.toFixed(1)} today, and half older than{" "}
          {age(2100)?.toFixed(1)} by 2100.
        </>
      ),
    },
    {
      title: "What it rests on",
      text: (
        <>
          Births are the least certain part. With half a child fewer per woman than the medium, the UN's low variant peaks at {people(lowPeak[1])} in {lowPeak[0]} and
          falls to {people(at(low, 2100) ?? 0)} by 2100; with half a child more, its high variant is still growing at {people(at(POPULATION_VARIANTS.high, 2100) ?? 0)}.
          The UN puts no probability on either, and nor does this page; the Scenarios section sets them side by side.
        </>
      ),
    },
  ];
  return (
    <div className="mt-5 pt-4 border-t border-border/40">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">The projection, explained</p>
      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {marks.map((m) => (
          <div key={m.label} className="modal-tile rounded-xl px-3 py-2.5 min-w-0">
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground leading-snug">{m.label}</dt>
            <dd className="text-base font-bold font-mono text-foreground leading-tight mt-1">{m.value}</dd>
            <dd className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">{m.sub}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {points.map((p) => (
          <div key={p.title} className="modal-tile rounded-xl p-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">{p.title}</p>
            <p className="text-[12px] font-sans leading-relaxed text-foreground/90">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "economy", label: "World economy" },
  { id: "countries", label: "Countries" },
  { id: "population", label: "Population" },
  { id: "scenarios", label: "Scenarios" },
  // The trends, a chip to each group of them; the first group sits under the section's heading, so its chip goes there.
  ...TREND_GROUPS.map((g, i) => ({ id: i === 0 ? "trends" : g.id, label: g.nav })),
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

  const stats = useMemo<StatCardData[]>(() => {
    const w = WEO_GROUPS.world;
    /* The ten largest economies by the IMF's latest estimate of their GDP:
       the countries a world figure is mostly made of. */
    const largest = [...WEO_COUNTRIES].sort((a, b) => (at(b.gdp, first - 1) ?? 0) - (at(a.gdp, first - 1) ?? 0)).slice(0, 10);
    const halves: [string, typeof w][] = [
      ["Advanced economies", WEO_GROUPS.advanced],
      ["Emerging and developing economies", WEO_GROUPS.emerging],
    ];
    /* One of the IMF's measures for its two halves of the world and for the
       ten largest economies, in the year named, each with the year before's. */
    const weoTables = (key: "growth" | "inflation" | "debt", fmt: (v: number) => string, year: number): StatTable[] => {
      const row = (name: string, o: { growth?: Point[]; inflation?: Point[]; debt?: Point[] }, code?: string | null) => {
        const v = at(o[key], year);
        const was = at(o[key], year - 1);
        return v === undefined ? [] : [{ name, value: v, text: fmt(v), code: code ?? undefined, note: was === undefined ? undefined : `${fmt(was)} in ${year - 1}` }];
      };
      return [
        { key: "halves", title: "Advanced and emerging", kicker: `The IMF's two groups of economies · ${year}`, rows: halves.flatMap(([name, o]) => row(name, o)), source: WEO },
        {
          key: "largest",
          title: "In the ten largest economies",
          kicker: `By the size of their economy in ${first - 1} · ${year}`,
          rows: largest.flatMap((c) => row(c.name, c, c.code)).sort((a, b) => b.value - a.value),
          source: WEO,
        },
      ].filter((t) => t.rows.length > 1);
    };
    /* One of the UN's measures by region in a year, each with this year's. */
    const regionTable = (key: "population" | "medianAge" | "lifeExpectancy", fmt: (v: number) => string, year: number, total?: number): StatTable[] => {
      const rows = POPULATION_OUTLOOK.slice(1).flatMap((r) => {
        const v = at(r[key], year);
        const now = at(r[key], THIS_YEAR);
        if (v === undefined) return [];
        const share = total ? `${((100 * v) / total).toFixed(1)}% of the world's` : "";
        return [{ name: r.name, value: v, text: fmt(v), note: [share, now === undefined ? "" : `${fmt(now)} in ${THIS_YEAR}`].filter(Boolean).join(" · ") || undefined }];
      });
      return rows.length > 1 ? [{ key: `regions-${year}`, title: `By region in ${year}`, kicker: `The UN's regions, medium variant · ${year}`, rows: rows.sort((a, b) => b.value - a.value), source: WPP }] : [];
    };
    /* One of the IMF's world series as a card: this year's projection, its
       move on last year's estimate, and where it stands at the end. */
    const line = (key: "growth" | "inflation" | "debt", label: string, fmt: (v: number) => string, about: string, color: string, upIsGood: boolean): StatCardData => {
      const series = w[key];
      const now = at(series, first) ?? 0;
      const before = at(series, first - 1) ?? 0;
      const diff = now - before;
      return {
        label,
        value: fmt(now),
        sub: `IMF projection · ${first}`,
        change: {
          chip: Math.abs(diff) < 0.05 ? "level" : `${signed(diff)} pts`,
          caption: `on ${first - 1}`,
          dir: Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "up" : "down",
          verdict: Math.abs(diff) < 0.05 ? null : diff > 0 === upIsGood ? "better" : "worse",
        },
        about,
        series,
        split: first,
        color,
        fmt,
        source: WEO,
        moreFacts: [{ label: `Projected for ${end}`, value: fmt(at(series, end) ?? 0), sub: `${end}` }],
        tables: weoTables(key, fmt, first),
        notes: [`A projection, not a forecast with a probability: the IMF's central case in its ${WEO.edition} edition, which it revises twice a year.`],
      };
    };
    const pop = WORLD_POP.population;
    const age = WORLD_POP.medianAge;
    const lex = WORLD_POP.lifeExpectancy;
    const years = (v: number) => `${v.toFixed(1)} years`;
    const popNow = at(pop, THIS_YEAR) ?? 0;
    const gdpNow = at(w.gdp, first - 1) ?? 0;
    const gdpThen = at(w.gdp, end) ?? 0;
    return [
      {
        label: `World GDP in ${end}`,
        value: usdFromBillions(gdpThen),
        sub: `IMF projection · ${end}`,
        change: { chip: `${signed(((gdpThen - gdpNow) / (gdpNow || 1)) * 100, 0)}%`, caption: `on ${first - 1}`, dir: "up", verdict: null },
        about: "Everything the world's economies produce in a year, in current US dollars, so it includes price rises.",
        series: w.gdp,
        split: first,
        color: SERIES.world,
        fmt: (v) => usdFromBillions(v),
        source: WEO,
        tables: [
          {
            key: "halves",
            title: "Advanced and emerging",
            kicker: `The IMF's two groups of economies · ${end}`,
            rows: halves.flatMap(([name, o]) => {
              const v = at(o.gdp, end);
              const was = at(o.gdp, first - 1);
              return v === undefined ? [] : [{ name, value: v, text: usdFromBillions(v), note: `${((100 * v) / (gdpThen || 1)).toFixed(1)}% of the world's${was === undefined ? "" : ` · ${usdFromBillions(was)} in ${first - 1}`}` }];
            }),
            source: WEO,
          },
          {
            key: "largest",
            title: `The largest economies in ${end}`,
            kicker: `GDP in current US dollars · IMF projection · ${end}`,
            rows: [...WEO_COUNTRIES]
              .flatMap((c) => {
                const v = at(c.gdp, end);
                const was = at(c.gdp, first - 1);
                return v === undefined ? [] : [{ name: c.name, value: v, text: usdFromBillions(v), code: c.code ?? undefined, note: `${((100 * v) / (gdpThen || 1)).toFixed(1)}% of the world's${was === undefined ? "" : ` · ${usdFromBillions(was)} in ${first - 1}`}` }];
              })
              .sort((a, b) => b.value - a.value)
              .slice(0, 10),
            source: WEO,
          },
        ],
        notes: [`A projection, not a forecast with a probability: the IMF's central case in its ${WEO.edition} edition, which it revises twice a year. Current dollars include price rises.`],
      },
      line("growth", "Real growth", (v) => pct(v), "How much more the world produces than the year before, with price rises taken out.", "#10b981", true),
      line("inflation", "Inflation", (v) => pct(v), "The rise in consumer prices over the year, averaged across the world's economies.", "#f59e0b", false),
      line("debt", "Government debt, % of GDP", (v) => pct(v), "What the world's governments owe, against the size of the world economy.", "#ef4444", false),
      {
        label: "World population in 2050",
        value: people(at(pop, 2050) ?? 0),
        sub: "UN medium variant · 2050",
        change: { chip: `${signed((((at(pop, 2050) ?? 0) - popNow) / (popNow || 1)) * 100, 0)}%`, caption: `on ${THIS_YEAR}`, dir: "up", verdict: null },
        about: "People alive on 1 July, on the UN's central projection of births, deaths and migration.",
        series: pop.filter(([y]) => y >= 1990 && y <= 2060),
        split: WPP.firstProjected,
        color: SERIES.people,
        fmt: people,
        facts: [
          { label: "Now", value: people(popNow), sub: `${THIS_YEAR}` },
          { label: "Projected", value: people(at(pop, 2050) ?? 0), sub: "2050" },
          { label: "By the century's end", value: people(at(pop, 2100) ?? 0), sub: "2100" },
        ],
        source: WPP,
        tables: regionTable("population", people, 2050, at(pop, 2050)),
      },
      {
        label: "Population peaks",
        value: String(POP_PEAK[0]),
        sub: `UN medium variant · at ${people(POP_PEAK[1])}`,
        change: null,
        about: "The year the world's population is projected to be at its largest, before it begins to fall.",
        series: pop.filter(([y]) => y >= 2000),
        split: WPP.firstProjected,
        color: SERIES.people,
        fmt: people,
        facts: [
          { label: "Now", value: people(popNow), sub: `${THIS_YEAR}` },
          { label: "At its peak", value: people(POP_PEAK[1]), sub: `${POP_PEAK[0]}` },
          { label: "By the century's end", value: people(at(pop, 2100) ?? 0), sub: "2100" },
        ],
        source: WPP,
        tables: regionTable("population", people, 2100, at(pop, 2100)),
      },
      {
        label: "Median age in 2050",
        value: years(at(age, 2050) ?? 0),
        sub: "UN medium variant · 2050",
        change: { chip: `${signed((at(age, 2050) ?? 0) - (at(age, THIS_YEAR) ?? 0))} years`, caption: `on ${THIS_YEAR}`, dir: "up", verdict: null },
        about: "Half the world's people are older than this and half younger.",
        series: age,
        split: WPP.firstProjected,
        color: "#06b6d4",
        fmt: years,
        facts: [
          { label: "Now", value: years(at(age, THIS_YEAR) ?? 0), sub: `${THIS_YEAR}` },
          { label: "Projected", value: years(at(age, 2050) ?? 0), sub: "2050" },
          { label: "By the century's end", value: years(at(age, 2100) ?? 0), sub: "2100" },
        ],
        source: WPP,
        tables: regionTable("medianAge", years, 2050),
      },
      {
        label: "Life expectancy in 2050",
        value: years(at(lex, 2050) ?? 0),
        sub: "UN medium variant · 2050",
        change: { chip: `${signed((at(lex, 2050) ?? 0) - (at(lex, THIS_YEAR) ?? 0))} years`, caption: `on ${THIS_YEAR}`, dir: "up", verdict: "better" },
        about: "The years a child born in that year would live if its death rates held for life.",
        series: lex,
        split: WPP.firstProjected,
        color: "#10b981",
        fmt: years,
        facts: [
          { label: "Now", value: years(at(lex, THIS_YEAR) ?? 0), sub: `${THIS_YEAR}` },
          { label: "Projected", value: years(at(lex, 2050) ?? 0), sub: "2050" },
          { label: "By the century's end", value: years(at(lex, 2100) ?? 0), sub: "2100" },
        ],
        source: WPP,
        tables: regionTable("lifeExpectancy", years, 2050),
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
              <StatCard key={s.label} s={s} />
            ))}
          </div>
          <Note>
            In each card's line the solid part is what the publisher estimates has happened and the dashed part is what it projects. The IMF's estimates run to{" "}
            {first - 1} and its projections from {first}; the UN's projections begin in {WPP.firstProjected}. A card opens to its full series; a chip is green or red only
            where one direction is plainly the better.
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
              <PopulationExplained />
              <SourceLink sources={[WPP]} className="mt-3" />
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {[
                { label: "Median age", s: WORLD_POP.medianAge, fmt: (v: number) => `${v.toFixed(1)} years`, about: "Half the world is older than this." },
                { label: "Births per woman", s: WORLD_POP.fertility, fmt: (v: number) => v.toFixed(2), about: "About 2.1 keeps a population level over time." },
                { label: "Life expectancy", s: WORLD_POP.lifeExpectancy, fmt: (v: number) => `${v.toFixed(1)} years`, about: "At birth, for the year's death rates." },
              ].map((m) => (
                <StatCard
                  key={m.label}
                  s={{
                    label: m.label,
                    value: m.fmt(at(m.s, THIS_YEAR) ?? 0),
                    sub: `UN · ${THIS_YEAR}`,
                    about: m.about,
                    series: m.s,
                    split: WPP.firstProjected,
                    color: SERIES.people,
                    fmt: m.fmt,
                    facts: [
                      { label: "Projected", value: m.fmt(at(m.s, 2050) ?? 0), sub: "2050" },
                      { label: "By the century's end", value: m.fmt(at(m.s, 2100) ?? 0), sub: "2100" },
                    ],
                    source: WPP,
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
            <div key={g.title} id={g.id} className="scroll-mt-36 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} aria-hidden />
                <span className="text-[10px] font-bold font-sans uppercase tracking-widest" style={{ color: head }}>
                  {g.title}
                </span>
                <span className="text-[10px] font-sans hidden sm:inline" style={{ color: muted }}>
                  {g.kicker}
                </span>
                <div className="flex-1 h-px" style={{ background: look.grid }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {g.ids.map((id) => (
                  <TrendTile key={id} id={id} color={g.color} group={g.title} beside={g.ids} />
                ))}
              </div>
              <SourceLink sources={g.ids.flatMap((id) => figureOf(id)?.source ?? [])} />
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
