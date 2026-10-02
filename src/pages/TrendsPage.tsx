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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLineUp, Cpu, Globe, Leaf, Lightning, Target, TrendUp, Users } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { SectionNav, type NavSection } from "../components/SectionNav";
import { StyledSelect } from "../components/StyledSelect";
import { StatExplorer, type StatGroup } from "../components/StatExplorer";
import { StatCard, splitChange, type StatCardData, type StatFact, type StatTable } from "../components/StatCard";
import { usdFromBillions } from "../lib/money";
import { WORLD, WORLDVIEW_RETRIEVED, type WorldIndicator } from "../data/worldview";
import { EXPLAIN } from "../data/worldviewExplain";
import { TREND_BRIEFS, TREND_DETAILS, TREND_EXPLAIN, TREND_EXTRAS, type DetailAs } from "../data/trendDetails";
import {
  BATTERY_CELL_PRICE,
  CLEAN_ENERGY_FINANCE,
  RENEWABLES_RETRIEVED,
  RENEWABLE_CAPACITY_TOTAL,
  RENEWABLE_COSTS,
  RENEWABLE_COSTS_SOURCE,
  RENEWABLE_GENERATION,
  RENEWABLE_GENERATION_SOURCE,
  RENEWABLE_GENERATORS,
  RENEWABLE_INVESTMENT,
  RENEWABLE_INVESTMENT_SOURCE,
  RENEWABLE_KINDS,
  RENEWABLE_OUTLOOK,
  SOLAR_MODULE_PRICE,
  WORLD_GENERATION,
  type Leaders,
  type YearValue,
} from "../data/renewables";
import {
  AI_DEALS,
  AI_DEALS_SOURCE,
  AI_INVESTMENT_PLACES,
  AI_INVESTMENT_PLACES_SOURCE,
  AI_MODELS,
  AI_MODELS_SOURCE,
  COMPANIES_USING_AI,
  DATA_CENTRES,
  DISK_PRICE,
  DRIVERLESS_TAXIS,
  GENERATIVE_AI_USERS,
  GENOME_COST,
  LARGE_AI_SYSTEMS,
  MOBILE_COVERAGE,
  NVIDIA_REVENUE,
  NVIDIA_REVENUE_SOURCE,
  PEOPLE_ONLINE,
  ROBOT_INSTALLS,
  ROBOT_INSTALLS_SOURCE,
  SERVICE_ROBOTS,
  SUPERCOMPUTER,
  TECHNOLOGY_RETRIEVED,
  TECH_TAKE_UP,
  TECH_TAKE_UP_SOURCE,
  TRANSISTORS,
  TSMC_REVENUE,
} from "../data/technology";
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
const OF_THE_TOTAL = new Set(["types", "investment", "origins", "hosts", "people", "who-launchers"]);

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
      // The tables of names - launch providers, model makers, institutions, companies, funders - have their own heading.
      section: t.key.startsWith("who-") ? "who" : undefined,
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
function trendCard(id: string, color: string, group: string, beside: string[]): StatCardData | null {
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
  return {
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
  };
}

/** Every trend as its card's data, by group: what the cards and the explorer are both drawn from. Built once - nothing in it changes. */
const TREND_CARDS: StatGroup[] = TREND_GROUPS.map((g) => ({ title: g.title, color: g.color, items: g.ids.flatMap((id) => trendCard(id, g.color, g.title, g.ids) ?? []) }));

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

// ── Renewable power ────────────────────────────────────────────────────────

/**
 * The colours of the kinds of power, the same wherever a kind appears. Each
 * chart's set was run through the palette validator in the order it is
 * drawn, on the light and the dark surface; every line is also named in a
 * legend with its figure, so nothing is told by colour alone.
 */
const POWER = {
  solar: "#d97706",
  hydro: "#2563eb",
  wind: "#0d9488",
  other: "#c026d3",
  bioenergy: "#65a30d",
  geothermal: "#7c3aed",
  csp: "#b45309",
  offshore: "#c026d3",
  marine: "#0e7490",
  fossil: "#64748b",
};
const KIND_COLOR: Record<string, string> = {
  solarPv: POWER.solar,
  onshoreWind: POWER.wind,
  offshoreWind: POWER.offshore,
  hydro: POWER.hydro,
  bioenergy: POWER.bioenergy,
  geothermal: POWER.geothermal,
  csp: POWER.csp,
  marine: POWER.marine,
};

const twh = (v: number) => `${Math.round(v).toLocaleString("en-US")} TWh`;
const gw = (v: number) => `${v >= 100 ? Math.round(v).toLocaleString("en-US") : v >= 10 ? v.toFixed(1) : v.toFixed(2)} GW`;
const cents = (v: number) => `${(v * 100).toFixed(1)}¢`;
const usdBn = (v: number) => `$${v >= 100 ? Math.round(v) : v.toFixed(1)}bn`;
const lastPoint = (p: YearValue[]) => p[p.length - 1];
/** The reading ten years before a series' latest, where it has that year. */
const decadeAgo = (p: YearValue[]) => p.find(([y]) => y === lastPoint(p)[0] - 10);
/** "+312% since 2015" as a card's chip; a fall where falling is the point (a price) is for the better. */
function decadeChange(p: YearValue[], fallIsGood = false) {
  const was = decadeAgo(p);
  if (!was || was[1] === 0) return null;
  const move = (100 * (lastPoint(p)[1] - was[1])) / was[1];
  return splitChange(`${signed(move, Math.abs(move) < 10 ? 1 : 0)}% since ${was[0]}`, move > 0 ? "up" : "down", move > 0 === !fallIsGood ? "better" : "worse");
}
/** A ranking as a table for a card's window: each country with its share of the world's. */
const leadersTable = (key: string, title: string, l: Leaders, fmt: (v: number) => string): StatTable => ({
  key,
  title,
  kicker: `Of ${l.countries} countries with a figure · ${l.year}`,
  rows: l.rows.map((r) => ({ name: r.n, code: r.c, value: r.v, text: fmt(r.v), note: `${shareText(r.v, l.total)} of the world's` })),
  source: l.source,
});

/** Several series against the years, a line each, named in the hover box. */
function MultiLine({ data, lines, fmt, tick, label, height = 250 }: { data: Record<string, number | string | null>[]; lines: { key: string; label: string; color: string }[]; fmt: (v: number) => string; tick?: (v: number) => string; label: string; height?: number }) {
  const look = useLook();
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" {...axis(look)} minTickGap={18} />
          <YAxis {...axis(look)} width={50} tickFormatter={(v: number) => (tick ?? fmt)(v)} />
          <Tooltip {...look.tooltip} formatter={(v: number, k: string) => [fmt(v), lines.find((l) => l.key === k)?.label ?? k]} />
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A ranking of countries or organisations as bars in one colour, each with its figure and what it is a share of. */
function LeaderList({ label, rows, color }: { label: string; rows: { name: string; code?: string; value: number; text: string; sub?: string }[]; color: string }) {
  const top = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-2.5" aria-label={label}>
      {rows.map((r) => (
        <RankRow key={r.name} name={r.name} code={r.code ?? null} value={r.value} top={top} text={r.text} sub={r.sub} color={color} />
      ))}
    </ul>
  );
}

/**
 * The generation chart, explained under it: each source's latest figure and
 * its move in ten years, what the lines are, what they show, why sun and
 * wind have risen, and how the five stand against all electricity. Every
 * number is read off Ember's series or IRENA's costs in renewables.ts; a
 * multiple or a percentage between two years is worked out from the two.
 */
function GenerationExplained({ lines }: { lines: readonly { key: "solar" | "hydro" | "wind" | "other" | "bioenergy"; label: string; color: string }[] }) {
  const gen = RENEWABLE_GENERATION;
  const first = gen[0];
  const now = gen[gen.length - 1];
  const then = gen.find((r) => r.year === now.year - 10);
  const sum = (r: (typeof gen)[number]) => lines.reduce((t, l) => t + r[l.key], 0);
  /** "×12.3" where it has more than doubled, a percentage otherwise. */
  const moved = (a: number, b: number) => (a > 0 && b / a >= 2 ? `×${(b / a).toFixed(b / a >= 10 ? 0 : 1)}` : `${signed((100 * (b - a)) / (a || 1), 0)}%`);
  // The first year the sun made more than the wind, and the two together more than hydropower.
  const sunPastWind = gen.find((r) => r.solar > r.wind)?.year;
  const bothPastHydro = gen.find((r) => r.solar + r.wind > r.hydro)?.year;
  const cost = (key: string) => RENEWABLE_COSTS.find((c) => c.key === key)?.series;
  const pv = cost("solarPv");
  const onshore = cost("onshoreWind");
  const points: { title: string; text: ReactNode }[] = [
    {
      title: "What the lines are",
      text: (
        <>
          Each line is the electricity the world generated from one renewable source in a year, in terawatt-hours, as Ember adds it up from countries' own statistics. Hydropower is dams and
          run-of-river plants; bioenergy is power from burning plant matter, biogas and waste; "geothermal and other" is geothermal, tidal and wave power together.
        </>
      ),
    },
    {
      title: "What it shows",
      text: (
        <>
          Hydropower is still the largest single source, at {twh(now.hydro)}, but it has grown slowly{then ? `: ${moved(then.hydro, now.hydro)} in ten years` : ""}. Solar and wind are what has changed
          {then ? `: solar ${moved(then.solar, now.solar)} and wind ${moved(then.wind, now.wind)} since ${then.year}` : ""}.
          {bothPastHydro ? ` From ${bothPastHydro} the two together made more than hydropower` : ""}
          {sunPastWind ? `${bothPastHydro ? ", and" : " "} in ${sunPastWind} solar made more than wind for the first time.` : bothPastHydro ? "." : ""}
        </>
      ),
    },
    {
      title: "Behind the rise of sun and wind",
      text: (
        <>
          Their cost fell.
          {pv && onshore
            ? ` A kilowatt-hour from a new solar farm cost ${cents(pv[0][1])} in ${pv[0][0]} and ${cents(lastPoint(pv)[1])} in ${lastPoint(pv)[0]}; from a new onshore wind farm, ${cents(onshore[0][1])} and ${cents(lastPoint(onshore)[1])} (IRENA, at 2025 prices).`
            : ""}{" "}
          The cards beside this chart give the price of solar modules and of battery cells, and the chart of costs below has every kind.
        </>
      ),
    },
    {
      title: "Against all electricity",
      text: (
        <>
          The five together made {twh(sum(now))} in {now.year} - {shareText(sum(now), WORLD_GENERATION.twh)} of the {twh(WORLD_GENERATION.twh)} the world generated - against {twh(sum(first))} in{" "}
          {first.year}. The rest came from coal, gas, oil and nuclear power. The share beside each name above is of all electricity, not of the renewables alone.
        </>
      ),
    },
  ];
  return (
    <div className="mt-5 pt-4 border-t border-border/40">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">The chart, explained</p>
      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {lines.map((l) => (
          <div key={l.key} className="modal-tile rounded-xl px-3 py-2.5 min-w-0">
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground leading-snug flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l.color }} aria-hidden />
              {l.label}
            </dt>
            <dd className="text-base font-bold font-mono text-foreground leading-tight mt-1">{Math.round(now[l.key]).toLocaleString("en-US")}</dd>
            <dd className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">
              TWh in {now.year}
              {then ? ` · ${moved(then[l.key], now[l.key])} on ${then.year}` : ""}
            </dd>
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

/**
 * Renewable power: what each kind generates, how much of each is installed,
 * what each has come to cost, what is invested, what the U.S. EIA projects,
 * and the countries and companies that lead. Every figure is from
 * renewables.ts (build-renewables.cjs) or, for the companies and funders,
 * trendDetails.ts.
 */
function RenewablesSection() {
  const look = useLook();
  const { head, muted, track } = look;
  const gen = RENEWABLE_GENERATION;
  const now = gen[gen.length - 1];
  const genLines = [
    { key: "solar", label: "Solar", color: POWER.solar },
    { key: "hydro", label: "Hydropower", color: POWER.hydro },
    { key: "wind", label: "Wind", color: POWER.wind },
    { key: "other", label: "Geothermal and other", color: POWER.other },
    { key: "bioenergy", label: "Bioenergy", color: POWER.bioenergy },
  ] as const;

  const costLines = RENEWABLE_COSTS.map((c) => ({ key: c.key, label: c.name, color: KIND_COLOR[c.key] }));
  const costYears = [...new Set(RENEWABLE_COSTS.flatMap((c) => c.series.map(([y]) => y)))].sort((a, b) => a - b);
  const costData = costYears.map((y) => ({ year: String(y), ...Object.fromEntries(RENEWABLE_COSTS.map((c) => [c.key, c.series.find(([x]) => x === y)?.[1] ?? null])) }));

  const invKeys = [
    { key: "solar", label: "Solar", color: POWER.solar },
    { key: "wind", label: "Wind", color: POWER.wind },
    { key: "biofuels", label: "Biofuels", color: POWER.other },
    { key: "biomass", label: "Biomass and waste", color: POWER.bioenergy },
    { key: "other", label: "Small hydropower, geothermal and marine", color: POWER.geothermal },
  ] as const;
  const inv = RENEWABLE_INVESTMENT;
  const invLast = inv[inv.length - 1];
  const invTotal = (r: (typeof inv)[number]) => invKeys.reduce((t, k) => t + r[k.key], 0);

  const modules = SOLAR_MODULE_PRICE.series;
  const cells = BATTERY_CELL_PRICE.series;
  const fall = (p: YearValue[]) => `${signed((100 * (lastPoint(p)[1] - p[0][1])) / p[0][1], 1)}%`;
  const finance = CLEAN_ENERGY_FINANCE;
  const breakthroughs: StatCardData[] = [
    {
      label: "Price of a solar module",
      value: `$${lastPoint(modules)[1].toFixed(2)} a watt`,
      sub: `constant 2025 US$ · ${lastPoint(modules)[0]}`,
      change: decadeChange(modules, true),
      about: "The average price of the panels themselves. Global estimates to 2009, European market benchmarks from 2010.",
      series: modules,
      color: POWER.solar,
      fmt: (v) => `$${v >= 10 ? v.toFixed(0) : v.toFixed(2)}`,
      facts: [
        { label: `In ${modules[0][0]}`, value: `$${modules[0][1].toFixed(2)}`, sub: "a watt" },
        { label: `Change since ${modules[0][0]}`, value: fall(modules), sub: "worked out here" },
        { label: "Ten years before", value: `$${(decadeAgo(modules)?.[1] ?? 0).toFixed(2)}`, sub: `${decadeAgo(modules)?.[0] ?? ""}` },
      ],
      source: SOLAR_MODULE_PRICE.source,
    },
    {
      label: "Price of a battery cell",
      value: `$${lastPoint(cells)[1]} a kWh`,
      sub: `lithium-ion · constant 2024 US$ · ${lastPoint(cells)[0]}`,
      change: decadeChange(cells, true),
      about: "A representative price of lithium-ion cells across the main chemistries: what storing electricity costs to build.",
      series: cells,
      color: POWER.geothermal,
      fmt: (v) => `$${Math.round(v).toLocaleString("en-US")}`,
      facts: [
        { label: `In ${cells[0][0]}`, value: `$${cells[0][1].toLocaleString("en-US")}`, sub: "a kWh" },
        { label: `Change since ${cells[0][0]}`, value: fall(cells), sub: "worked out here" },
        { label: "Ten years before", value: `$${(decadeAgo(cells)?.[1] ?? 0).toLocaleString("en-US")}`, sub: `${decadeAgo(cells)?.[0] ?? ""}` },
      ],
      source: BATTERY_CELL_PRICE.source,
    },
    {
      label: "Public finance for clean energy",
      value: usdBn(lastPoint(finance.series)[1]),
      sub: `to developing countries · ${lastPoint(finance.series)[0]}`,
      change: decadeChange(finance.series),
      about: "International public finance to developing countries for clean energy research and development and for renewable power, at constant prices.",
      series: finance.series,
      color: POWER.wind,
      fmt: usdBn,
      tables: [leadersTable("recipients", "Who received most", finance, usdBn)],
      source: finance.source,
    },
  ];

  const kinds: StatCardData[] = RENEWABLE_KINDS.map((k) => {
    const [year, v] = lastPoint(k.series);
    const c = k.countries;
    return {
      label: k.name,
      value: gw(v),
      sub: `installed in the world · IRENA · ${year}`,
      change: decadeChange(k.series),
      about: k.about,
      series: k.series,
      color: KIND_COLOR[k.key],
      fmt: gw,
      tables: c ? [leadersTable("countries", c.title, c, (x) => (c.unit === "MW" ? `${Math.round(x).toLocaleString("en-US")} MW` : gw(x)))] : undefined,
      moreFacts: [{ label: "Of all renewable capacity", value: shareText(v, lastPoint(RENEWABLE_CAPACITY_TOTAL)[1]), sub: `of ${gw(lastPoint(RENEWABLE_CAPACITY_TOTAL)[1])} · ${year}` }],
      source: k.source,
    };
  });

  const out = RENEWABLE_OUTLOOK;
  const OUTLOOK_NAME: Record<string, [string, string]> = {
    solar: ["Solar", POWER.solar],
    wind: ["Wind", POWER.wind],
    hydro: ["Hydropower", POWER.hydro],
    other: ["Other renewables", POWER.other],
    nuclear: ["Nuclear", POWER.fossil],
    gas: ["Natural gas", POWER.fossil],
    coal: ["Coal", POWER.fossil],
  };
  const outTop = Math.max(...out.generation.map((g) => g.high));
  const battery = out.capacity.find((r) => r.key === "battery");
  const solarCap = out.capacity.find((r) => r.key === "solar");
  const whoOf = (key: string) => TREND_DETAILS.renewableElectricity?.tables.find((t) => t.key === key);
  const companies = whoOf("who-companies");
  const funders = whoOf("who-funders");

  return (
    <section id="renewables" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="renewables-title">
      <SectionHead icon={<Leaf size={18} weight="fill" />} color="#10b981" title="Renewables" kicker="The kinds of renewable power: what each makes, what it costs, what is invested, what is projected, and who leads" />
      <h2 id="renewables-title" className="sr-only">
        Renewables
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHead title="Electricity from each renewable source" kicker={`TWh generated in the world a year · Ember · ${gen[0].year}–${now.year}`} />
          <MultiLine
            data={gen.map((r) => ({ ...r, year: String(r.year) }))}
            lines={[...genLines]}
            fmt={twh}
            tick={(v) => `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k`}
            height={270}
            label={`Electricity generated from renewable sources, ${gen[0].year} to ${now.year}. In ${now.year}: ${genLines.map((l) => `${l.label} ${twh(now[l.key])}`).join(", ")}.`}
          />
          <Legend items={genLines.map((l) => ({ color: l.color, label: `${l.label}, ${now.year}`, value: `${twh(now[l.key])} · ${shareText(now[l.key], WORLD_GENERATION.twh)}` }))} />
          <GenerationExplained lines={genLines} />
          <SourceLink sources={[RENEWABLE_GENERATION_SOURCE, RENEWABLE_COSTS_SOURCE]} className="mt-3" />
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {breakthroughs.map((b) => (
            <StatCard key={b.label} s={b} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} aria-hidden />
          <span className="text-[10px] font-bold font-sans uppercase tracking-widest" style={{ color: head }}>
            The kinds, by what is installed
          </span>
          <span className="text-[10px] font-sans hidden sm:inline" style={{ color: muted }}>
            Generating capacity in the world, and its change on ten years before
          </span>
          <div className="flex-1 h-px" style={{ background: look.grid }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kinds.map((k) => (
            <StatCard key={k.label} s={k} more="Its growth, year by year, and who has most" />
          ))}
        </div>
        <SourceLink sources={RENEWABLE_KINDS.map((k) => k.source)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="What a kilowatt-hour costs from a new plant" kicker={`Levelised cost, US cents at 2025 prices · IRENA · ${costYears[0]}–${costYears[costYears.length - 1]}`} />
          <MultiLine
            data={costData}
            lines={costLines}
            fmt={cents}
            tick={(v) => `${Math.round(v * 100)}¢`}
            label={`The levelised cost of electricity from new renewable plants, ${costYears[0]} to ${costYears[costYears.length - 1]}: ${RENEWABLE_COSTS.map((c) => `${c.name} from ${cents(c.series[0][1])} to ${cents(lastPoint(c.series)[1])}`).join("; ")}.`}
          />
          <Legend items={RENEWABLE_COSTS.map((c) => ({ color: KIND_COLOR[c.key], label: c.name, value: `${cents(c.series[0][1])} → ${cents(lastPoint(c.series)[1])}` }))} />
          <Note>
            The cost of building and running a plant spread over all the electricity it makes in its life, averaged over the plants that came into service in the year. Each figure is the
            cost in {costYears[0]}, then in {costYears[costYears.length - 1]}.
          </Note>
          <SourceLink sources={[RENEWABLE_COSTS_SOURCE]} className="mt-3" />
        </Card>
        <Card>
          <CardHead title={`Projected: the world's electricity in ${out.year}`} kicker={`TWh a year by type · U.S. EIA, International Energy Outlook 2023 · ${out.base} and ${out.year}`} />
          <ul className="flex flex-col gap-3" aria-label={`Electricity generation by type in ${out.base} and as projected for ${out.year}`}>
            {out.generation.map((g) => {
              const [name, color] = OUTLOOK_NAME[g.key];
              return (
                <li key={g.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold font-sans" style={{ color: head }}>
                      {name}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: head }}>
                      {Math.round(g.base).toLocaleString("en-US")} <span style={{ color: muted }}>→</span> <span className="font-bold">{twh(g.ref)}</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full mt-1" style={{ background: track }} aria-hidden>
                    {/* The projection, paler and behind; the year it starts from, solid; the reach of EIA's cases as a line. */}
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(100 * g.ref) / outTop}%`, background: color, opacity: 0.35 }} />
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(100 * g.base) / outTop}%`, background: color }} />
                    <span className="absolute top-1/2 h-0.5 -translate-y-1/2" style={{ left: `${(100 * g.low) / outTop}%`, width: `${(100 * (g.high - g.low)) / outTop}%`, background: head }} />
                  </div>
                  <p className="text-[9px] font-mono mt-0.5" style={{ color: muted }}>
                    {g.ref >= g.base ? `×${(g.ref / g.base).toFixed(1)}` : `${signed((100 * (g.ref - g.base)) / g.base, 0)}%`} on {out.base} · {Math.round(g.low).toLocaleString("en-US")}–{Math.round(g.high).toLocaleString("en-US")} across EIA's seven cases
                  </p>
                </li>
              );
            })}
          </ul>
          <Legend
            items={[
              { color: POWER.solar, label: `Generated in ${out.base}` },
              { color: `${POWER.solar}59`, label: `Projected for ${out.year}, Reference case` },
              { color: head, label: "Lowest to highest of the seven cases" },
            ]}
          />
          <Note>
            EIA's Reference case assumes the laws and policies in place when it was made, and its six other cases vary economic growth, oil prices and the cost of zero-carbon technology. It gives no
            likelihood to any of them, and nor does this page. This is its 2023 edition, the latest it has published.
            {battery && solarCap ? ` On the same projection battery storage grows from ${gw(battery.base)} to ${gw(battery.ref)} (${Math.round(battery.low)}–${Math.round(battery.high).toLocaleString("en-US")}), and solar capacity from ${gw(solarCap.base)} to ${gw(solarCap.ref)}.` : ""}
          </Note>
          <SourceLink sources={[out.source]} className="mt-3" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="What was invested, by technology" kicker={`New investment in renewable power, US$ billions a year · ${inv[0].year}–${invLast.year}`} />
          <div
            role="img"
            aria-label={`New investment in renewable power by technology, ${inv[0].year} to ${invLast.year}. In ${invLast.year}: ${invKeys.map((k) => `${k.label} ${usdBn(invLast[k.key])}`).join(", ")}.`}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={inv.map((r) => ({ ...r, year: String(r.year) }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" {...axis(look)} minTickGap={12} />
                <YAxis {...axis(look)} width={50} tickFormatter={(v: number) => `$${v}bn`} />
                <Tooltip {...look.tooltip} cursor={{ fill: look.grid }} formatter={(v: number, k: string) => [usdBn(v), invKeys.find((x) => x.key === k)?.label ?? k]} />
                {invKeys.map((k, i) => (
                  <Bar key={k.key} dataKey={k.key} stackId="inv" fill={k.color} stroke={look.card.background} strokeWidth={1} radius={i === invKeys.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={invKeys.map((k) => ({ color: k.color, label: `${k.label}, ${invLast.year}`, value: `${usdBn(invLast[k.key])} · ${shareText(invLast[k.key], invTotal(invLast))}` }))} />
          <Note>
            {usdBn(invTotal(invLast))} in {invLast.year}, against {usdBn(invTotal(inv[0]))} in {inv[0].year}; a share is of the technologies shown, added together here. {invLast.year} is the last year this source's
            file holds, and this page has found no later open series by technology. Of hydropower it counts small plants only.
          </Note>
          <SourceLink sources={[RENEWABLE_INVESTMENT_SOURCE]} className="mt-3" />
        </Card>
        <Card>
          <CardHead title="The countries that generate most" kicker={`TWh from the sun and from the wind · Ember · ${RENEWABLE_GENERATORS.solar.year}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {(
              [
                ["Solar", RENEWABLE_GENERATORS.solar, POWER.solar],
                ["Wind", RENEWABLE_GENERATORS.wind, POWER.wind],
              ] as const
            ).map(([name, l, color]) => (
              <div key={name}>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-2.5" style={{ color: muted }}>
                  {name} · world {twh(l.total)}
                </p>
                <LeaderList label={`Countries generating the most ${name.toLowerCase()} electricity`} color={color} rows={l.rows.map((r) => ({ name: r.n, code: r.c, value: r.v, text: Math.round(r.v).toLocaleString("en-US"), sub: shareText(r.v, l.total) }))} />
              </div>
            ))}
          </div>
          <Note>Each country's TWh, and its share of the world's from that source. The cards above give who has the most solar, wind and geothermal capacity installed.</Note>
          <SourceLink sources={[RENEWABLE_GENERATORS.solar.source, RENEWABLE_GENERATORS.wind.source]} className="mt-3" />
        </Card>
      </div>

      {(companies || funders) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[companies, funders].map(
            (t) =>
              t && (
                <Card key={t.key}>
                  <CardHead title={t.key === "who-companies" ? "The companies publishing most of the research" : "The funders named on most of the research"} kicker={t.kicker} />
                  <LeaderList label={t.title} color={t.key === "who-companies" ? POWER.solar : POWER.wind} rows={t.rows.map((r) => ({ name: r.n, code: r.c, value: r.v, text: r.v.toLocaleString("en-US") }))} />
                  {t.note && <Note>{t.note}</Note>}
                  <SourceLink sources={[t.source]} className="mt-3" />
                </Card>
              ),
          )}
        </div>
      )}
      <Note>
        What this section does not show, for want of an open source to read it from: investment by technology after {invLast.year}, makers of panels and turbines by what they ship, and a projection for each
        emerging kind - offshore wind, geothermal, marine - on its own. The companies above are named by the research they publish, which is what an open source counts. Figures retrieved {RENEWABLES_RETRIEVED}.
      </Note>
    </section>
  );
}

// ── Technology ─────────────────────────────────────────────────────────────

/**
 * The colours of a chart's series, in the order the palette validator passed
 * them on the light and the dark surface: a chart takes them from the first.
 * Every series is also named in a legend with its figure.
 */
const ORDERED = ["#d97706", "#2563eb", "#0d9488", "#c026d3", "#65a30d"];
const TECH_COLOR = "#8b5cf6";

/** A large count in words a card can hold: 58.2bn, 6.05bn, 77.6M. */
const big = (v: number) => (v >= 1e12 ? `${(v / 1e12).toFixed(2)}tn` : v >= 1e9 ? `${(v / 1e9).toFixed(v >= 1e10 ? 1 : 2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US"));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-06" or "2026-06-30" as "Jun 2026". */
const monthOf = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
/** "×25" where a figure has more than doubled between two readings, a percentage otherwise. */
const multiple = (a: number, b: number) => (a > 0 && b / a >= 2 ? `×${b / a >= 100 ? Math.round(b / a).toLocaleString("en-US") : (b / a).toFixed(b / a >= 10 ? 0 : 1)}` : `${signed((100 * (b - a)) / (a || 1), 0)}%`);

/**
 * The take-up chart, explained under it: each line's latest reading and its
 * reading ten years before, what the lines count, what they show, how many
 * people that is, and the networks behind it. Every number is read off the
 * ITU's series in technology.ts.
 */
function TakeUpExplained({ lines }: { lines: readonly { key: "mobile" | "internet" | "broadband" | "landline"; label: string; color: string }[] }) {
  const rows = TECH_TAKE_UP;
  const now = rows[rows.length - 1];
  const then = rows.find((r) => r.year === now.year - 10);
  const v = (r: (typeof rows)[number] | undefined, k: (typeof lines)[number]["key"]) => r?.[k] ?? null;
  // The year mobile subscriptions passed landlines, the year landlines were most common, the year half the world was online.
  const mobilePast = rows.find((r) => r.mobile !== null && r.landline !== null && r.mobile > r.landline)?.year;
  const landlinePeak = rows.reduce((a, b) => ((b.landline ?? 0) > (a.landline ?? 0) ? b : a));
  const halfOnline = rows.find((r) => (r.internet ?? 0) >= 50)?.year;
  const online = PEOPLE_ONLINE;
  const [onlineYear, onlineNow] = lastPoint(online.series);
  const onlineThen = online.series.find(([y]) => y === onlineYear - 10);
  const g = (name: string) => MOBILE_COVERAGE.generations.find((x) => x.name === name)?.series;
  const g5 = g("5G");
  const g4 = g("4G");
  const points: { title: string; text: ReactNode }[] = [
    {
      title: "What the lines are",
      text: (
        <>
          Each line is a count for every 100 people in the world, from the International Telecommunication Union's figures. Mobile, broadband and landline are subscriptions, so a person with two SIM
          cards is counted twice - which is how mobile passes 100. Internet is people: those who used it at all in the last three months.
        </>
      ),
    },
    {
      title: "What it shows",
      text: (
        <>
          {mobilePast ? `Mobile subscriptions passed landlines in ${mobilePast}. ` : ""}Landlines were most common in {landlinePeak.year}, at {landlinePeak.landline} for every 100 people, and have fallen to{" "}
          {now.landline}.{halfOnline ? ` Half the world was online by ${halfOnline}; ` : " "}
          {now.internet} in every 100 are now{then ? `, against ${then.internet} in ${then.year}` : ""}. Fixed broadband, which needs a cable to the home, has spread far more slowly than the phone in the pocket.
        </>
      ),
    },
    {
      title: "How many people",
      text: (
        <>
          {big(onlineNow)} people used the internet in {onlineYear}
          {onlineThen ? `, against ${big(onlineThen[1])} in ${onlineThen[0]}` : ""}. In {online.year}, the latest year countries report, {online.rows[0].n} had {big(online.rows[0].v)} of them, {online.rows[1].n}{" "}
          {big(online.rows[1].v)} and {online.rows[2].n} {big(online.rows[2].v)}.
        </>
      ),
    },
    {
      title: "The networks behind it",
      text: (
        <>
          {g4 && g5
            ? `In ${lastPoint(g5)[0]}, ${lastPoint(g4)[1]}% of the world's people lived within range of a 4G network and ${lastPoint(g5)[1]}% within range of 5G, whether or not they had a phone to use it; 5G reached ${g5[0][1]}% in ${g5[0][0]}.`
            : ""}{" "}
          The cards below take up 5G and the other emerging kinds one by one.
        </>
      ),
    },
  ];
  return (
    <div className="mt-5 pt-4 border-t border-border/40">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">The chart, explained</p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {lines.map((l) => (
          <div key={l.key} className="modal-tile rounded-xl px-3 py-2.5 min-w-0">
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground leading-snug flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l.color }} aria-hidden />
              {l.label}
            </dt>
            <dd className="text-base font-bold font-mono text-foreground leading-tight mt-1">{v(now, l.key)}</dd>
            <dd className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">
              per 100 people in {now.year}
              {v(then, l.key) !== null ? ` · ${v(then, l.key)} in ${then?.year}` : ""}
            </dd>
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

/**
 * Technology in charts: how far communication technology has spread, what
 * computing has come to do and cost, the emerging kinds as cards, where the
 * money for AI goes, the robots, and the countries and companies behind them.
 * Every figure is from technology.ts (build-technology.cjs) or, for the
 * makers of AI models and the companies publishing research, trendDetails.ts.
 */
function TechnologySection() {
  const look = useLook();
  const { head, muted } = look;

  const takeUpLines = [
    { key: "mobile", label: "Mobile subscriptions", color: ORDERED[0] },
    { key: "internet", label: "People using the internet", color: ORDERED[1] },
    { key: "broadband", label: "Fixed broadband", color: ORDERED[2] },
    { key: "landline", label: "Landlines", color: ORDERED[3] },
  ] as const;
  const takeUpNow = TECH_TAKE_UP[TECH_TAKE_UP.length - 1];

  /** A series' first reading and its latest, as two facts and the move between them. */
  const span = (p: YearValue[], fmt: (v: number) => string): StatFact[] => [
    { label: `In ${p[0][0]}`, value: fmt(p[0][1]) },
    { label: `Change since ${p[0][0]}`, value: multiple(p[0][1], lastPoint(p)[1]), sub: "worked out here" },
  ];
  const usd = (v: number) => (v >= 1e6 ? `$${big(v)}` : `$${v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(2)}`);
  const flops = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)} exaflops` : v >= 1e6 ? `${(v / 1e6).toFixed(1)} petaflops` : v >= 1e3 ? `${(v / 1e3).toFixed(1)} teraflops` : `${Math.round(v)} gigaflops`);
  const computing: StatCardData[] = [
    {
      label: "Transistors on a chip",
      value: big(lastPoint(TRANSISTORS.series)[1]),
      sub: `on a microprocessor · ${lastPoint(TRANSISTORS.series)[0]}`,
      change: decadeChange(TRANSISTORS.series),
      about: "The most transistors on one microprocessor - the count behind Moore's law, the observation that it doubles about every two years.",
      series: TRANSISTORS.series,
      color: ORDERED[1],
      fmt: big,
      facts: span(TRANSISTORS.series, big),
      source: TRANSISTORS.source,
    },
    {
      label: "The fastest supercomputer",
      value: flops(lastPoint(SUPERCOMPUTER.series)[1]),
      sub: `operations a second · ${lastPoint(SUPERCOMPUTER.series)[0]}`,
      change: decadeChange(SUPERCOMPUTER.series),
      about: "The speed of the fastest machine on the TOP500 list. An exaflop is a billion billion calculations a second.",
      series: SUPERCOMPUTER.series,
      color: ORDERED[2],
      fmt: flops,
      facts: span(SUPERCOMPUTER.series, flops),
      source: SUPERCOMPUTER.source,
    },
    {
      label: "Price of disk storage",
      value: `${usd(lastPoint(DISK_PRICE.series)[1])} a terabyte`,
      sub: `constant 2020 US$ · ${lastPoint(DISK_PRICE.series)[0]}`,
      change: decadeChange(DISK_PRICE.series, true),
      about: "The cheapest price recorded for a terabyte of magnetic disk storage up to each year.",
      series: DISK_PRICE.series,
      color: ORDERED[0],
      fmt: usd,
      facts: span(DISK_PRICE.series, usd),
      source: DISK_PRICE.source,
    },
  ];

  const g5 = MOBILE_COVERAGE.generations.find((x) => x.name === "5G")?.series ?? [];
  const gen = GENERATIVE_AI_USERS;
  const genFirst = gen.readings[0];
  const genLast = gen.readings[gen.readings.length - 1];
  const firms = COMPANIES_USING_AI;
  const modelsNow = AI_MODELS[AI_MODELS.length - 1];
  const modelKinds = [
    { key: "industry", label: "Industry", color: ORDERED[0] },
    { key: "collaboration", label: "Industry and academia together", color: ORDERED[1] },
    { key: "academia", label: "Academia", color: ORDERED[2] },
    { key: "other", label: "Other and not specified", color: ORDERED[3] },
  ] as const;
  const modelTotal = (r: (typeof AI_MODELS)[number]) => modelKinds.reduce((t, k) => t + r[k.key], 0);
  const modelSeries: YearValue[] = AI_MODELS.map((r) => [r.year, modelTotal(r)]);
  const large = LARGE_AI_SYSTEMS;
  const dc = DATA_CENTRES;
  const taxis = DRIVERLESS_TAXIS;
  const pctOf = (v: number, dp = 1) => `${v.toFixed(dp)}%`;
  const km = (v: number) => `${big(v)} km`;
  const kinds: StatCardData[] = [
    {
      label: "Within range of 5G",
      value: pctOf(lastPoint(g5)[1], 0),
      sub: `of the world's people · ITU · ${lastPoint(g5)[0]}`,
      change: { chip: `${signed(lastPoint(g5)[1] - g5[0][1], 0)} pts`, caption: `since ${g5[0][0]}`, dir: "up", verdict: "better" },
      about: "People living where a 5G signal reaches, whether or not they have a phone that uses it.",
      series: g5,
      color: ORDERED[1],
      fmt: (v) => pctOf(v, 1),
      tables: [
        {
          key: "generations",
          title: "By generation of network",
          kicker: `Share of the world's people within range · ${lastPoint(g5)[0]}`,
          rows: MOBILE_COVERAGE.generations.map((x) => ({ name: x.name, value: lastPoint(x.series)[1], text: pctOf(lastPoint(x.series)[1]), note: `${pctOf(x.series[0][1])} in ${x.series[0][0]}` })),
          note: "Coverage is cumulative: anyone within range of a newer generation is also counted in the older ones.",
          source: MOBILE_COVERAGE.source,
        },
      ],
      source: MOBILE_COVERAGE.source,
    },
    {
      label: "Using generative AI",
      value: pctOf(genLast[1]),
      sub: `of working-age adults · Microsoft's estimate · ${monthOf(gen.day)}`,
      change: { chip: `${signed(genLast[1] - genFirst[1])} pts`, caption: `since ${monthOf(genFirst[0])}`, dir: genLast[1] >= genFirst[1] ? "up" : "down", verdict: null },
      about: "People aged 15 to 64 who used a generative AI site or app at all in the period, estimated from use of Microsoft's own platforms. One visit counts.",
      color: ORDERED[3],
      facts: gen.readings.map(([d, v]) => ({ label: monthOf(d), value: pctOf(v) })),
      tables: [
        {
          key: "countries",
          title: "Where most people use it",
          kicker: `Share of working-age adults · of ${gen.countries} countries · ${monthOf(gen.day)}`,
          rows: gen.rows.map((r) => ({ name: r.n, code: r.c, value: r.v, text: pctOf(r.v) })),
          source: gen.source,
        },
      ],
      source: gen.source,
    },
    {
      label: "Companies using AI",
      value: pctOf(lastPoint(firms.series)[1], 0),
      sub: `of companies surveyed · McKinsey · ${firms.year}`,
      change: { chip: `${signed(lastPoint(firms.series)[1] - firms.series[0][1], 0)} pts`, caption: `since ${firms.series[0][0]}`, dir: "up", verdict: null },
      about: "The share of companies answering McKinsey's yearly survey that say they use AI.",
      series: firms.series,
      color: ORDERED[2],
      fmt: (v) => pctOf(v, 0),
      tables: [{ key: "regions", title: "By region", kicker: `Share of companies surveyed, as McKinsey groups them · ${firms.year}`, rows: firms.regions.map((r) => ({ name: r.n, value: r.v, text: pctOf(r.v, 0) })), source: firms.source }],
      source: firms.source,
    },
    {
      label: "Notable AI systems a year",
      value: String(modelTotal(modelsNow)),
      sub: `published in the year · Epoch AI · ${modelsNow.year}`,
      change: decadeChange(modelSeries),
      about: "AI systems Epoch AI lists as notable - for advancing the state of the art, being highly cited, widely used or historically significant - by the year they were published.",
      series: modelSeries,
      color: ORDERED[0],
      fmt: (v) => String(Math.round(v)),
      tables: [
        {
          key: "builders",
          title: "Who built them",
          kicker: `Notable systems by the team's affiliation · ${modelsNow.year}`,
          rows: modelKinds.map((k) => ({ name: k.label, value: modelsNow[k.key], text: String(modelsNow[k.key]), note: `${shareText(modelsNow[k.key], modelTotal(modelsNow))} of the year's` })),
          source: AI_MODELS_SOURCE,
        },
      ],
      source: AI_MODELS_SOURCE,
    },
    {
      label: "Large-scale AI systems",
      value: String(lastPoint(large.series)[1]),
      sub: `since 2019 · Epoch AI · to ${large.year}`,
      change: { chip: multiple(large.series[Math.max(0, large.series.length - 3)][1], lastPoint(large.series)[1]), caption: `on ${large.series[Math.max(0, large.series.length - 3)][0]}`, dir: "up", verdict: null },
      about: "A running count of AI systems whose training took more than 10²³ operations - the largest there are - by where the organisation that built each is based.",
      series: large.series,
      color: ORDERED[4],
      fmt: (v) => String(Math.round(v)),
      tables: [leadersTable("countries", "Where they were built", large, (x) => String(x))],
      source: large.source,
    },
    {
      label: "Data centres' electricity",
      value: pctOf(lastPoint(dc.series)[1], 2),
      sub: `of the world's electricity demand · IEA · ${dc.year}`,
      change: { chip: `${signed(lastPoint(dc.series)[1] - dc.series[0][1], 2)} pts`, caption: `since ${dc.series[0][0]}`, dir: "up", verdict: null },
      about: "Electricity used by data centres - which run streaming, messaging and cloud storage as well as AI - as a share of all the electricity used. The source cannot separate AI's part.",
      series: dc.series,
      color: ORDERED[1],
      fmt: (v) => pctOf(v, 2),
      tables: [{ key: "places", title: "By place", kicker: `Share of each place's electricity demand, as the IEA groups them · ${dc.year}`, rows: dc.places.map((r) => ({ name: r.n, code: r.c, value: r.v, text: pctOf(r.v, 2) })), source: dc.source }],
      source: dc.source,
    },
    {
      label: "Driverless taxi travel",
      value: km(lastPoint(taxis.series)[1]),
      sub: `passenger-km in California · ${lastPoint(taxis.series)[0]}`,
      change: { chip: multiple(taxis.series[taxis.series.length - 2][1], lastPoint(taxis.series)[1]), caption: `on ${taxis.series[taxis.series.length - 2][0]}`, dir: "up", verdict: null },
      about: "The distance passengers travelled in California's paid driverless taxis - the one place with a public monthly count. A year is the sum of its twelve months.",
      series: taxis.series,
      color: ORDERED[2],
      fmt: km,
      facts: [
        { label: `In ${monthOf(taxis.first[0])}`, value: km(taxis.first[1]), sub: "the first month counted" },
        { label: `In ${monthOf(taxis.latest[0])}`, value: km(taxis.latest[1]), sub: "the latest month" },
        { label: `In ${taxis.series[0][0]}`, value: km(taxis.series[0][1]), sub: "the first full year" },
      ],
      source: taxis.source,
    },
    {
      label: "Cost of a human genome",
      value: usd(lastPoint(GENOME_COST.series)[1]),
      sub: `to sequence one · current US$ · ${lastPoint(GENOME_COST.series)[0]}`,
      change: decadeChange(GENOME_COST.series, true),
      about: "What it costs to read the whole of one person's DNA, as the U.S. National Human Genome Research Institute tracks it.",
      series: GENOME_COST.series,
      color: ORDERED[3],
      fmt: usd,
      facts: span(GENOME_COST.series, usd),
      source: GENOME_COST.source,
    },
  ];

  const places = [
    { key: "china", label: "China", color: ORDERED[0] },
    { key: "us", label: "United States", color: ORDERED[1] },
    { key: "europe", label: "Europe (EU and UK)", color: ORDERED[2] },
  ] as const;
  const inv = AI_INVESTMENT_PLACES;
  const invNow = inv[inv.length - 1];
  const dealKinds = [
    { key: "private", label: "Private investment", color: ORDERED[0] },
    { key: "merger", label: "Mergers and acquisitions", color: ORDERED[1] },
    { key: "minority", label: "Minority stakes", color: ORDERED[2] },
    { key: "offering", label: "Public offerings", color: ORDERED[3] },
  ] as const;
  const dealNow = AI_DEALS[AI_DEALS.length - 1];
  const makers = [
    { key: "china", label: "China", color: ORDERED[0] },
    { key: "japan", label: "Japan", color: ORDERED[1] },
    { key: "us", label: "United States", color: ORDERED[2] },
    { key: "korea", label: "South Korea", color: ORDERED[3] },
    { key: "germany", label: "Germany", color: ORDERED[4] },
  ] as const;
  const robotsNow = ROBOT_INSTALLS[ROBOT_INSTALLS.length - 1];
  const nvNow = NVIDIA_REVENUE[NVIDIA_REVENUE.length - 1];
  const nvFirst = NVIDIA_REVENUE[0];
  const tsmc = TSMC_REVENUE.series;
  const whoOf = (key: string) => TREND_DETAILS.aiInvestment?.tables.find((t) => t.key === key);
  const stack = (i: number, n: number): [number, number, number, number] | number => (i === n - 1 ? [4, 4, 0, 0] : 0);

  return (
    <section id="emerging-tech" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="emerging-tech-title">
      <SectionHead icon={<Cpu size={18} weight="fill" />} color={TECH_COLOR} title="Technology in charts" kicker="How far it has spread, what computing can do and costs, the emerging kinds, the money, the robots, and who leads" />
      <h2 id="emerging-tech-title" className="sr-only">
        Technology in charts
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHead title="The spread of communication technology" kicker={`For every 100 people in the world · ITU · ${TECH_TAKE_UP[0].year}–${takeUpNow.year}`} />
          <MultiLine
            data={TECH_TAKE_UP.map((r) => ({ ...r, year: String(r.year) }))}
            lines={[...takeUpLines]}
            fmt={(v) => `${v.toFixed(1)} per 100`}
            tick={(v) => String(Math.round(v))}
            height={270}
            label={`Communication technology for every 100 people in the world, ${TECH_TAKE_UP[0].year} to ${takeUpNow.year}. In ${takeUpNow.year}: ${takeUpLines.map((l) => `${l.label} ${takeUpNow[l.key]}`).join(", ")}.`}
          />
          <Legend items={takeUpLines.map((l) => ({ color: l.color, label: `${l.label}, ${takeUpNow.year}`, value: `${takeUpNow[l.key]} per 100` }))} />
          <TakeUpExplained lines={takeUpLines} />
          <SourceLink sources={[TECH_TAKE_UP_SOURCE, PEOPLE_ONLINE.source, MOBILE_COVERAGE.source]} className="mt-3" />
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {computing.map((c) => (
            <StatCard key={c.label} s={c} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: TECH_COLOR }} aria-hidden />
          <span className="text-[10px] font-bold font-sans uppercase tracking-widest" style={{ color: head }}>
            The emerging kinds
          </span>
          <span className="text-[10px] font-sans hidden sm:inline" style={{ color: muted }}>
            What is newly taken up, each with where it stands and who is ahead
          </span>
          <div className="flex-1 h-px" style={{ background: look.grid }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kinds.map((k) => (
            <StatCard key={k.label} s={k} more="Its figures in full, and who is ahead" />
          ))}
        </div>
        <SourceLink sources={kinds.flatMap((k) => (k.source ? (Array.isArray(k.source) ? k.source : [k.source]) : []))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="Where the money for AI goes" kicker={`Private investment in AI, US$ billions at 2021 prices · Quid, via the AI Index · ${inv[0].year}–${invNow.year}`} />
          <MultiLine
            data={inv.map((r) => ({ ...r, year: String(r.year) }))}
            lines={[...places]}
            fmt={usdBn}
            tick={(v) => `$${Math.round(v)}bn`}
            label={`Private investment in AI by place, ${inv[0].year} to ${invNow.year}. In ${invNow.year}: ${places.map((p) => `${p.label} ${usdBn(invNow[p.key])}`).join(", ")}, of ${usdBn(invNow.world)} in the world.`}
          />
          <Legend items={places.map((p) => ({ color: p.color, label: `${p.label}, ${invNow.year}`, value: `${usdBn(invNow[p.key])} · ${shareText(invNow[p.key], invNow.world)}` }))} />
          <Note>
            Of {usdBn(invNow.world)} invested in the world in {invNow.year}, against {usdBn(inv[0].world)} in {inv[0].year}; each share is of the world's. Private investment is money put into AI companies by venture
            capital and other private investors - not what companies spend on their own AI.
          </Note>
          <SourceLink sources={[AI_INVESTMENT_PLACES_SOURCE]} className="mt-3" />
        </Card>
        <Card>
          <CardHead title="The deals behind AI, by type" kicker={`Corporate deals involving AI companies, US$ billions at 2021 prices · ${AI_DEALS[0].year}–${dealNow.year}`} />
          <div role="img" aria-label={`Corporate deals involving AI companies by type, ${AI_DEALS[0].year} to ${dealNow.year}. In ${dealNow.year}: ${dealKinds.map((k) => `${k.label} ${usdBn(dealNow[k.key])}`).join(", ")}.`}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={AI_DEALS.map((r) => ({ ...r, year: String(r.year) }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" {...axis(look)} minTickGap={12} />
                <YAxis {...axis(look)} width={50} tickFormatter={(v: number) => `$${v}bn`} />
                <Tooltip {...look.tooltip} cursor={{ fill: look.grid }} formatter={(v: number, k: string) => [usdBn(v), dealKinds.find((x) => x.key === k)?.label ?? k]} />
                {dealKinds.map((k, i) => (
                  <Bar key={k.key} dataKey={k.key} stackId="deals" fill={k.color} stroke={look.card.background} strokeWidth={1} radius={stack(i, dealKinds.length)} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={dealKinds.map((k) => ({ color: k.color, label: `${k.label}, ${dealNow.year}`, value: `${usdBn(dealNow[k.key])} · ${shareText(dealNow[k.key], dealNow.total)}` }))} />
          <Note>
            {usdBn(dealNow.total)} in {dealNow.year}, against {usdBn(AI_DEALS[0].total)} in {AI_DEALS[0].year}. Private investment here is the same figure as in the chart beside this one; the rest is companies
            buying AI companies, taking stakes in them, and AI companies listing their shares.
          </Note>
          <SourceLink sources={[AI_DEALS_SOURCE]} className="mt-3" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="Industrial robots installed, by country" kicker={`Robots installed in the year · International Federation of Robotics · ${ROBOT_INSTALLS[0].year}–${robotsNow.year}`} />
          <MultiLine
            data={ROBOT_INSTALLS.map((r) => ({ ...r, year: String(r.year) }))}
            lines={[...makers]}
            fmt={(v) => `${Math.round(v).toLocaleString("en-US")} robots`}
            tick={(v) => (v === 0 ? "0" : `${Math.round(v / 1000)}k`)}
            label={`Industrial robots installed by country, ${ROBOT_INSTALLS[0].year} to ${robotsNow.year}. In ${robotsNow.year}: ${makers.map((m) => `${m.label} ${(robotsNow[m.key] ?? 0).toLocaleString("en-US")}`).join(", ")}.`}
          />
          <Legend items={makers.map((m) => ({ color: m.color, label: `${m.label}, ${robotsNow.year}`, value: `${(robotsNow[m.key] ?? 0).toLocaleString("en-US")} · ${shareText(robotsNow[m.key] ?? 0, robotsNow.world ?? 1)}` }))} />
          <Note>
            Of {(robotsNow.world ?? 0).toLocaleString("en-US")} installed in the world in {robotsNow.year}; each share is of the world's. These five are the countries the source's file gives.
          </Note>
          <SourceLink sources={[ROBOT_INSTALLS_SOURCE]} className="mt-3" />
        </Card>
        <Card>
          <CardHead title="Service robots, by what they do" kicker={`Professional service robots installed in the year · International Federation of Robotics · ${SERVICE_ROBOTS.year}`} />
          <LeaderList
            label="Professional service robots installed, by application"
            color={TECH_COLOR}
            rows={SERVICE_ROBOTS.rows.map((r) => ({ name: r.n, value: r.v, text: r.v.toLocaleString("en-US"), sub: r.was ? `${r.was[1].toLocaleString("en-US")} in ${r.was[0]}` : undefined }))}
          />
          <Note>
            Robots sold to do a job outside a factory: moving goods in warehouses, serving in restaurants and hotels, cleaning, farming, and work in hospitals. The figure beside each is {SERVICE_ROBOTS.year}'s, then
            the first year the source gives.
          </Note>
          <SourceLink sources={[SERVICE_ROBOTS.source]} className="mt-3" />
          <p className="text-[10px] font-mono uppercase tracking-widest mt-5 mb-2.5" style={{ color: muted }}>
            The countries with most people online · {PEOPLE_ONLINE.year}
          </p>
          <LeaderList
            label="Countries with the most people using the internet"
            color={ORDERED[1]}
            rows={PEOPLE_ONLINE.rows.slice(0, 6).map((r) => ({ name: r.n, code: r.c, value: r.v, text: big(r.v), sub: shareText(r.v, PEOPLE_ONLINE.total) }))}
          />
          <SourceLink sources={[PEOPLE_ONLINE.source]} className="mt-3" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="The chips behind AI: NVIDIA's revenue" kicker={`US$ billions a quarter, as the company reports it · ${nvFirst.quarter} to ${nvNow.quarter}`} />
          <div
            role="img"
            aria-label={`NVIDIA's quarterly revenue, ${nvFirst.quarter} to ${nvNow.quarter}. In ${nvNow.quarter}: ${usdBn(nvNow.dataCentres)} from data centres and AI and ${usdBn(nvNow.other)} from everything else.`}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={NVIDIA_REVENUE} margin={{ top: 6, right: 8, left: 0, bottom: 0 }} barCategoryGap="12%">
                <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" {...axis(look)} minTickGap={28} tickFormatter={(q: string) => q.slice(0, 4)} />
                <YAxis {...axis(look)} width={50} tickFormatter={(v: number) => `$${v}bn`} />
                <Tooltip {...look.tooltip} cursor={{ fill: look.grid }} formatter={(v: number, k: string) => [usdBn(v), k === "dataCentres" ? "Data centres and AI" : "Everything else"]} />
                <Bar dataKey="dataCentres" stackId="nv" fill={ORDERED[0]} stroke={look.card.background} strokeWidth={1} isAnimationActive={false} />
                <Bar dataKey="other" stackId="nv" fill={ORDERED[1]} stroke={look.card.background} strokeWidth={1} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend
            items={[
              { color: ORDERED[0], label: `Data centres and AI, ${nvNow.quarter}`, value: `${usdBn(nvNow.dataCentres)} · ${shareText(nvNow.dataCentres, nvNow.dataCentres + nvNow.other)}` },
              { color: ORDERED[1], label: "Everything else", value: usdBn(nvNow.other) },
            ]}
          />
          <Note>
            NVIDIA makes most of the chips AI systems are trained on. In {nvFirst.quarter} its data-centre segment brought in {usdBn(nvFirst.dataCentres)} of {usdBn(nvFirst.dataCentres + nvFirst.other)}. "Everything
            else" is its total less that segment, worked out here. TSMC, which manufactures those chips and most other advanced ones, reported {usdBn(lastPoint(tsmc)[1])} of revenue in {lastPoint(tsmc)[0]}
            {decadeAgo(tsmc) ? `, against ${usdBn(decadeAgo(tsmc)?.[1] ?? 0)} in ${decadeAgo(tsmc)?.[0]}` : ""}.
          </Note>
          <SourceLink sources={[NVIDIA_REVENUE_SOURCE, TSMC_REVENUE.source]} className="mt-3" />
        </Card>
        <Card>
          <CardHead title="Who builds AI systems: industry and academia" kicker={`Notable AI systems published in the year, by who built them · Epoch AI · ${AI_MODELS[0].year}–${modelsNow.year}`} />
          <div role="img" aria-label={`Notable AI systems by who built them, ${AI_MODELS[0].year} to ${modelsNow.year}. In ${modelsNow.year}: ${modelKinds.map((k) => `${k.label} ${modelsNow[k.key]}`).join(", ")}.`}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={AI_MODELS.map((r) => ({ ...r, year: String(r.year) }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" {...axis(look)} minTickGap={12} />
                <YAxis {...axis(look)} width={36} allowDecimals={false} />
                <Tooltip {...look.tooltip} cursor={{ fill: look.grid }} formatter={(v: number, k: string) => [String(v), modelKinds.find((x) => x.key === k)?.label ?? k]} />
                {modelKinds.map((k, i) => (
                  <Bar key={k.key} dataKey={k.key} stackId="models" fill={k.color} stroke={look.card.background} strokeWidth={1} radius={stack(i, modelKinds.length)} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={modelKinds.map((k) => ({ color: k.color, label: `${k.label}, ${modelsNow.year}`, value: `${modelsNow[k.key]} · ${shareText(modelsNow[k.key], modelTotal(modelsNow))}` }))} />
          <Note>
            {modelTotal(modelsNow)} notable systems in {modelsNow.year}, against {modelTotal(AI_MODELS[0])} in {AI_MODELS[0].year}. Epoch AI's list is its own judgement of what is notable, and recent years fill in as it adds
            to it.
          </Note>
          <SourceLink sources={[AI_MODELS_SOURCE]} className="mt-3" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHead title="Where the largest AI systems are built" kicker={`Systems trained with over 10²³ operations, since 2019 · Epoch AI · to ${large.year}`} />
          <LeaderList label="Large-scale AI systems by country" color={ORDERED[4]} rows={large.rows.map((r) => ({ name: r.n, code: r.c, value: r.v, text: String(r.v), sub: shareText(r.v, large.total) }))} />
          <Note>
            Of {large.total} in all, by where the organisation that built each is based.
          </Note>
          <SourceLink sources={[large.source]} className="mt-3" />
        </Card>
        {[whoOf("who-models"), whoOf("who-companies")].map(
          (t) =>
            t && (
              <Card key={t.key}>
                <CardHead title={t.title} kicker={t.kicker} />
                <LeaderList label={t.title} color={t.key === "who-models" ? ORDERED[0] : ORDERED[1]} rows={t.rows.slice(0, 8).map((r) => ({ name: r.n, code: r.c, value: r.v, text: r.v.toLocaleString("en-US") }))} />
                {t.note && <Note>{t.note}</Note>}
                <SourceLink sources={[t.source]} className="mt-3" />
              </Card>
            ),
        )}
      </div>
      <Note>
        What this section does not show, for want of an open source to read it from: a projection for any of these - no body publishes one openly, as the IMF and the UN do for the economy and for people -
        and companies ranked by what they sell or spend on research. The companies here are named by their own reported revenue, by the AI systems they have built, and by the research they publish. Figures
        retrieved {TECHNOLOGY_RETRIEVED}.
      </Note>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "economy", label: "World economy" },
  { id: "countries", label: "Countries" },
  { id: "population", label: "Population" },
  { id: "scenarios", label: "Scenarios" },
  { id: "renewables", label: "Renewables" },
  { id: "emerging-tech", label: "Tech in charts" },
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

        {/* ── Explorer: every figure of the page, by group, beside its detail - as the
            Countries and Economies pages have their own ── */}
        <StatExplorer
          title="Trends & projections"
          icon={<ChartLineUp size={12} weight="fill" aria-hidden />}
          color="#6366f1"
          noun="figures"
          groups={[{ title: "Projections", color: "#6366f1", items: stats }, ...TREND_CARDS]}
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

        {/* ══ Renewables ══ */}
        <RenewablesSection />

        {/* ══ Technology in charts ══ */}
        <TechnologySection />

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
                {(TREND_CARDS.find((c) => c.title === g.title)?.items ?? []).map((s) => (
                  <StatCard key={`${s.label}·${s.sub}`} s={s} more="Regions, types, names and the full series" />
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
