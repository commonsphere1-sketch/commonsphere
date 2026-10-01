/**
 * Humanitarian: displacement, hunger, health and water, and the aid that
 * answers them - as a hero, a row of headline tiles, and a section each,
 * in the same card, tile and chart language as the Worldview page.
 *
 * Two kinds of figure are on the page, and it says which is which.
 *
 * Built from source (worldview.ts, countryPanels.ts, donorAid.ts - each by
 * its own build script, with its year): the displaced and their make-up
 * year by year (UNHCR), undernourishment, food insecurity and stunting
 * (FAO, UNICEF/WHO), child and maternal mortality (UN estimates), water and
 * sanitation (WHO/UNICEF), each country's child mortality and water access
 * (World Bank), and official aid by donor (OECD).
 *
 * Recorded from the agencies' reports, with the report and year shown on
 * each: people in need by crisis and appeals against funding (UN OCHA),
 * the countries hosting and producing most refugees (UNHCR 2023), hunger by
 * region (FAO 2023), deaths from six diseases and people without essential
 * health care (WHO). These are not refreshed by a build.
 *
 * One accent for data marks and a three-step ramp of it for the parts of a
 * whole; better and worse appear only as an arrow and a word, never colour
 * alone. Charts do not animate.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Drop, ForkKnife, HandHeart, Users, Warning } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { SectionNav, type NavSection } from "../components/SectionNav";
import { DONOR_AID, DONOR_AID_SOURCE, DAC_TOTAL } from "../data/donorAid";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES, DISPLACED_BY_KIND, WORLD, WORLDVIEW_RETRIEVED, type WorldPoint } from "../data/worldview";
import { COUNTRY_PANELS, PANEL_SOURCES } from "../data/countryPanels";
import { countriesData } from "../data/countriesData";

// ── Recorded from the agencies' reports ────────────────────────────────────

/** UN OCHA, Global Humanitarian Overview 2024: people in need, millions. */
const ACTIVE_CRISES: { name: string; code: string; inNeed: number; kind: string; severity: "Critical" | "Serious" }[] = [
  { name: "Gaza / Palestine", code: "PS", inNeed: 2.2, kind: "Conflict", severity: "Critical" },
  { name: "Sudan", code: "SD", inNeed: 18.0, kind: "Conflict and famine", severity: "Critical" },
  { name: "Ukraine", code: "UA", inNeed: 14.6, kind: "Conflict", severity: "Critical" },
  { name: "Yemen", code: "YE", inNeed: 21.6, kind: "Conflict and food", severity: "Critical" },
  { name: "Ethiopia", code: "ET", inNeed: 15.8, kind: "Conflict and climate", severity: "Serious" },
  { name: "Syria", code: "SY", inNeed: 16.7, kind: "Conflict", severity: "Serious" },
  { name: "DR Congo", code: "CD", inNeed: 23.4, kind: "Conflict and disease", severity: "Serious" },
  { name: "Somalia", code: "SO", inNeed: 7.1, kind: "Drought and conflict", severity: "Serious" },
  { name: "Haiti", code: "HT", inNeed: 5.5, kind: "Instability and food", severity: "Serious" },
  { name: "Afghanistan", code: "AF", inNeed: 23.7, kind: "Governance and food", severity: "Serious" },
];

/** UN OCHA Financial Tracking Service: coordinated appeals, US$ billions. */
const AID_FUNDING: { year: number; required: number; funded: number }[] = [
  { year: 2015, required: 19.9, funded: 12.1 },
  { year: 2016, required: 22.1, funded: 13.4 },
  { year: 2017, required: 22.2, funded: 14.5 },
  { year: 2018, required: 24.7, funded: 16.5 },
  { year: 2019, required: 28.0, funded: 19.0 },
  { year: 2020, required: 35.2, funded: 21.4 },
  { year: 2021, required: 39.8, funded: 22.2 },
  { year: 2022, required: 49.0, funded: 27.9 },
  { year: 2023, required: 55.8, funded: 26.2 },
];

/** UNHCR Global Trends 2023: refugees hosted, millions. */
const TOP_HOSTS: [name: string, code: string, millions: number][] = [
  ["Iran", "IR", 3.4],
  ["Türkiye", "TR", 3.3],
  ["Colombia", "CO", 2.9],
  ["Germany", "DE", 2.5],
  ["Pakistan", "PK", 2.0],
  ["Uganda", "UG", 1.6],
  ["Russia", "RU", 1.3],
  ["Ethiopia", "ET", 1.1],
];

/** UNHCR Global Trends and IDMC, 2023: people displaced from each country, millions. */
const TOP_ORIGINS: [name: string, code: string, millions: number][] = [
  ["Syria", "SY", 13.8],
  ["Ukraine", "UA", 10.0],
  ["Afghanistan", "AF", 9.1],
  ["Venezuela", "VE", 7.7],
  ["South Sudan", "SS", 2.2],
  ["Myanmar", "MM", 2.0],
  ["DR Congo", "CD", 1.9],
  ["Somalia", "SO", 1.0],
];

/** FAO, The State of Food Security and Nutrition in the World: % undernourished, 2023. */
const HUNGER_REGIONS: [region: string, pct: number][] = [
  ["Sub-Saharan Africa", 22.6],
  ["Caribbean", 16.1],
  ["Southern Asia", 15.9],
  ["Western Asia", 10.5],
  ["Southeast Asia", 8.1],
  ["Oceania", 6.6],
  ["Latin America", 6.5],
  ["Northern Africa", 4.2],
  ["East Asia", 1.9],
];

/** WHO Global Health Observatory, 2023: deaths per 100,000 people, for the region named. */
const DISEASE_BURDEN: [disease: string, per100k: number, region: string][] = [
  ["Malaria", 19.4, "Sub-Saharan Africa"],
  ["Tuberculosis", 14.5, "World"],
  ["HIV/AIDS", 11.2, "World"],
  ["COVID-19", 9.1, "World"],
  ["Cholera", 1.4, "South Asia and Africa"],
  ["Measles", 0.6, "Africa and Asia"],
];

/** The countries whose child mortality the page sets side by side: the highest, and four of the lowest. */
const CHILD_MORTALITY_COUNTRIES: [name: string, code: string][] = [
  ["Somalia", "SO"],
  ["Chad", "TD"],
  ["Nigeria", "NG"],
  ["Central African Republic", "CF"],
  ["Sierra Leone", "SL"],
  ["Mali", "ML"],
  ["South Sudan", "SS"],
  ["DR Congo", "CD"],
  ["Afghanistan", "AF"],
  ["Yemen", "YE"],
  ["United States", "US"],
  ["United Kingdom", "GB"],
  ["Japan", "JP"],
  ["Finland", "FI"],
];

/** The countries whose access to safely managed drinking water the page sets side by side. */
const WATER_COUNTRIES: [name: string, code: string][] = [
  ["Norway", "NO"],
  ["Germany", "DE"],
  ["United States", "US"],
  ["Brazil", "BR"],
  ["India", "IN"],
  ["Nigeria", "NG"],
  ["Ethiopia", "ET"],
  ["DR Congo", "CD"],
  ["Chad", "TD"],
  ["Somalia", "SO"],
];

const SRC = {
  ocha: { label: "UN OCHA — Global Humanitarian Overview", url: "https://www.unocha.org/global-humanitarian-overview" },
  fts: { label: "UN OCHA — Financial Tracking Service", url: "https://fts.unocha.org" },
  unhcrTrends: { label: "UNHCR — Global Trends 2023", url: "https://www.unhcr.org/global-trends" },
  idmc: { label: "IDMC — Global Report on Internal Displacement", url: "https://www.internal-displacement.org/global-report" },
  sofi: { label: "FAO — The State of Food Security and Nutrition in the World", url: "https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world" },
  gho: { label: "WHO — Global Health Observatory", url: "https://www.who.int/data/gho" },
  uhc: { label: "WHO and World Bank — Tracking Universal Health Coverage, 2023", url: "https://www.who.int/publications/i/item/9789240080379" },
};

// ── Look ───────────────────────────────────────────────────────────────────

const BETTER = "text-emerald-700 dark:text-emerald-400";
const WORSE = "text-red-600 dark:text-red-400";

function useLook() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return {
    isLight,
    card: {
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
      border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    },
    muted: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.46)",
    head: isLight ? "#0f172a" : "#f1f0ff",
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    track: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)",
    /** The one accent for data marks, as on the Worldview page. */
    accent: isLight ? "#2a78d6" : "#3987e5",
    /** The same blue in three steps, for the parts of a whole; the first stands out most against the page. */
    ramp: isLight ? ["#0d366b", "#3987e5", "#86b6ef"] : ["#b7d3f6", "#2a78d6", "#184f95"],
    tooltip: {
      contentStyle: {
        background: isLight ? "#ffffff" : "#15151a",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        fontSize: 11,
        fontFamily: "monospace",
        color: isLight ? "#0f172a" : "#f1f0ff",
      },
      labelStyle: { color: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.46)" },
    },
  };
}
type Look = ReturnType<typeof useLook>;

// ── Figures ────────────────────────────────────────────────────────────────

const lastOf = (s: WorldPoint[]) => s[s.length - 1];
const millions = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}bn` : `${(n / 1e6).toFixed(1)}M`);
const flagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

/** The reading about ten years before the latest, where the series has one. */
function decadeBefore(s: WorldPoint[]): WorldPoint | null {
  const [ly] = lastOf(s);
  const earlier = s.filter(([y]) => y <= ly - 10);
  const p = earlier[earlier.length - 1];
  return p && ly - 10 - p[0] <= 2 ? p : null;
}

type Change = { text: string; dir: "up" | "down" | "flat"; verdict: "better" | "worse" | null };

/** A figure's change on about ten years before, in its own terms; a rise is worse for every measure here that has a verdict. */
function changeOf(series: WorldPoint[], kind: "count" | "pct" | "num", dp: number, upIsGood: boolean): Change | null {
  const prev = decadeBefore(series);
  if (!prev) return null;
  const [, now] = lastOf(series);
  const diff = now - prev[1];
  if (Math.abs(diff) < 10 ** -dp / 2) return { text: `level with ${prev[0]}`, dir: "flat", verdict: null };
  const sign = diff > 0 ? "+" : "";
  const amount =
    kind === "count"
      ? `${sign}${((100 * diff) / prev[1]).toFixed(Math.abs((100 * diff) / prev[1]) < 10 ? 1 : 0)}%`
      : `${sign}${diff.toFixed(dp)}${kind === "pct" ? " points" : ""}`;
  return { text: `${amount} since ${prev[0]}`, dir: diff > 0 ? "up" : "down", verdict: diff > 0 === upIsGood ? "better" : "worse" };
}

type Stat = {
  key: string;
  label: string;
  value: string;
  unit: string;
  sub: string;
  about: string;
  change: Change | null;
  series?: WorldPoint[];
  source: { label: string; url: string };
};

/**
 * A tile for a world series in worldview.ts: its latest value, its change on
 * ten years before, and its trend. `agency` is who produces the figure - the
 * World Bank republishes most of these, and the tile names the body behind it.
 */
function worldStat(id: string, label: string, agency: string, about: string, upIsGood: boolean, o: { complement?: boolean } = {}): Stat {
  const ind = WORLD[id];
  const series: WorldPoint[] = o.complement ? ind.series.map(([y, v]) => [y, Number((100 - v).toFixed(ind.dp))]) : ind.series;
  const [year, v] = lastOf(series);
  const kind = ind.format === "count" ? "count" : ind.format === "pct" ? "pct" : "num";
  return {
    key: id,
    label,
    value: kind === "count" ? millions(v) : kind === "pct" ? `${v.toFixed(ind.dp)}%` : v.toFixed(ind.dp),
    unit: kind === "count" ? "people" : ind.unit,
    sub: `${agency} · ${year}`,
    about,
    change: changeOf(series, kind, ind.dp, upIsGood),
    series,
    source: ind.source,
  };
}

/** The displaced by kind, year by year, in millions; "refugees" as UNHCR's headline counts them. */
const DISPLACED = DISPLACED_BY_KIND.map((d) => ({
  year: d.year,
  idps: d.idps,
  refugees: d.refugees + d.unrwa + d.others,
  asylum: d.asylumSeekers,
}));

/** A country's figure and name by ISO2, where its source publishes one. */
const COUNTRY_BY_CODE = new Map(countriesData.map((c) => [c.code, c]));

// ── Pieces ─────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { card } = useLook();
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={card}>
      {children}
    </div>
  );
}

/** A card's heading: what it shows, and in small type whose figures they are. */
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

/** A section's heading, as the Worldview page heads its pillars. */
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

function DeltaLine({ d }: { d: Change }) {
  const Icon = d.dir === "up" ? ArrowUpRight : d.dir === "down" ? ArrowDownRight : ArrowRight;
  const tone = d.verdict === "better" ? BETTER : d.verdict === "worse" ? WORSE : "text-muted-foreground";
  return (
    <p className={`flex items-center gap-1 font-sans text-[10px] ${tone}`}>
      <Icon size={10} weight="bold" aria-hidden />
      <span>
        {d.text}
        {d.verdict && <span className="font-semibold">{` · ${d.verdict}`}</span>}
      </span>
    </p>
  );
}

/** A figure's trend across the foot of its tile: a grey line, the latest point in the accent. */
function TileTrend({ series, accent }: { series: WorldPoint[]; accent: string }) {
  if (series.length < 3) return null;
  const x0 = series[0][0];
  const x1 = lastOf(series)[0];
  const ys = series.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (x: number) => 3 + ((x - x0) / (x1 - x0 || 1)) * 94;
  const py = (y: number) => 86 - ((y - lo) / (hi - lo || 1)) * 72;
  const d = series.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("");
  const [lx, ly] = lastOf(series);
  return (
    <span className="relative block h-7 w-full text-muted-foreground" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${px(lx)}%`, top: `${py(ly)}%`, background: accent }} />
    </span>
  );
}

/** A headline figure as a tile: what it is, its value, whose it is and for when, its change, what it means, and its trend. */
function StatTile({ s }: { s: Stat }) {
  const { head, muted, accent } = useLook();
  return (
    <div className="modal-tile h-full rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
      <p className="text-[10px] font-sans uppercase tracking-wider leading-snug" style={{ color: muted }}>
        {s.label}
      </p>
      <p className="text-xl font-bold font-mono leading-tight" style={{ color: head }}>
        {s.value}
      </p>
      <p className="text-[10px] font-mono leading-snug" style={{ color: muted }}>
        {s.unit} · {s.sub}
      </p>
      {s.change && <DeltaLine d={s.change} />}
      <p className="text-[11px] font-sans leading-snug mt-1" style={{ color: muted }}>
        {s.about}
      </p>
      {s.series && (
        <span className="mt-auto block w-full pt-2">
          <TileTrend series={s.series} accent={accent} />
        </span>
      )}
    </div>
  );
}

type BarRow = { key: string; name: string; code?: string; value: number | null; text: string; note?: string };

/**
 * A ranked list as bars, longest first as given: a name, its bar against the
 * longest, and its figure in ink - one accent throughout, since the bars
 * differ in length, not in kind. A row with no published figure says so.
 */
function BarList({ rows, max, label }: { rows: BarRow[]; max?: number; label: string }) {
  const { head, muted, track, accent } = useLook();
  const top = max ?? Math.max(...rows.map((r) => r.value ?? 0), 1);
  return (
    <ul className="flex flex-col gap-2.5" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(7rem,11rem)_1fr_auto] items-center gap-x-3">
          <span className="flex items-center gap-2 min-w-0">
            {r.code && <img src={flagUrl(r.code)} alt="" width={18} height={13} loading="lazy" className="rounded-[2px] shrink-0" />}
            <span className="min-w-0">
              <span className="block text-[11px] font-sans truncate" style={{ color: head }}>
                {r.name}
              </span>
              {r.note && (
                <span className="block text-[9px] font-mono truncate" style={{ color: muted }}>
                  {r.note}
                </span>
              )}
            </span>
          </span>
          <span className="h-2.5 rounded-full overflow-hidden" style={{ background: track }} aria-hidden>
            {r.value !== null && <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, Math.min(100, (100 * r.value) / top))}%`, background: accent }} />}
          </span>
          <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: r.value === null ? muted : head }}>
            {r.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A chart's legend: a swatch, the series' name, and its latest figure, so no series is told by colour alone. */
function Legend({ items }: { items: { color: string; label: string; value?: string }[] }) {
  const { head, muted } = useLook();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3">
      {items.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: l.color }} aria-hidden />
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

/** The displaced, year by year, by kind: the internally displaced, refugees and asylum-seekers, stacked. */
function DisplacementChart() {
  const look = useLook();
  const data = DISPLACED.map((d) => ({ year: String(d.year), idps: +(d.idps / 1e6).toFixed(1), refugees: +(d.refugees / 1e6).toFixed(1), asylum: +(d.asylum / 1e6).toFixed(1) }));
  const last = DISPLACED[DISPLACED.length - 1];
  const first = DISPLACED[0];
  const names: Record<string, string> = { idps: "Internally displaced", refugees: "Refugees", asylum: "Asylum-seekers" };
  return (
    <>
      <div
        role="img"
        aria-label={`People forcibly displaced, ${first.year} to ${last.year}: from ${millions(first.idps + first.refugees + first.asylum)} to ${millions(last.idps + last.refugees + last.asylum)}. The latest year is in the legend below.`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis(look)} minTickGap={18} />
            <YAxis {...axis(look)} tickFormatter={(v: number) => `${v}M`} />
            <Tooltip {...look.tooltip} formatter={(v: number, n: string) => [`${v}M people`, names[n] ?? n]} />
            {(["idps", "refugees", "asylum"] as const).map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stackId="displaced" stroke={look.ramp[i]} strokeWidth={2} fill={look.ramp[i]} fillOpacity={0.55} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: look.ramp[0], label: `Internally displaced, ${last.year}`, value: millions(last.idps) },
          { color: look.ramp[1], label: "Refugees", value: millions(last.refugees) },
          { color: look.ramp[2], label: "Asylum-seekers", value: millions(last.asylum) },
        ]}
      />
    </>
  );
}

/** Two shares of the world's people on one percentage axis: the undernourished, and the moderately or severely food insecure. */
function HungerChart() {
  const look = useLook();
  const hungry = WORLD.undernourished.series;
  const insecure = WORLD.foodInsecure.series;
  const years = [...new Set([...hungry, ...insecure].map(([y]) => y))].sort((a, b) => a - b);
  const at = (s: WorldPoint[], y: number) => s.find(([x]) => x === y)?.[1] ?? null;
  const data = years.map((y) => ({ year: String(y), hungry: at(hungry, y), insecure: at(insecure, y) }));
  const [hy, hv] = lastOf(hungry);
  const [iy, iv] = lastOf(insecure);
  return (
    <>
      <div role="img" aria-label={`Undernourishment, ${hungry[0][0]} to ${hy}, and food insecurity, ${insecure[0][0]} to ${iy}, as shares of the world's people. The latest figures are in the legend below.`}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis(look)} minTickGap={18} />
            <YAxis {...axis(look)} tickFormatter={(v: number) => `${v}%`} domain={[0, "auto"]} />
            <Tooltip {...look.tooltip} formatter={(v: number, n: string) => [`${v}%`, n === "hungry" ? "Undernourished" : "Food insecure"]} />
            <Line type="monotone" dataKey="insecure" stroke={look.ramp[0]} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="hungry" stroke={look.accent} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: look.accent, label: `Undernourished, ${hy}`, value: `${hv.toFixed(1)}%` },
          { color: look.ramp[0], label: `Moderately or severely food insecure, ${iy}`, value: `${iv.toFixed(1)}%` },
        ]}
      />
    </>
  );
}

/** One world series as a line, with its latest reading in the legend. */
function TrendChart({ id, name, unit, height = 190 }: { id: string; name: string; unit: (v: number) => string; height?: number }) {
  const look = useLook();
  const s = WORLD[id].series;
  const data = s.map(([y, v]) => ({ year: String(y), v }));
  const [ly, lv] = lastOf(s);
  return (
    <>
      <div role="img" aria-label={`${name}, ${s[0][0]} to ${ly}: from ${unit(s[0][1])} to ${unit(lv)}.`}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis(look)} minTickGap={18} />
            <YAxis {...axis(look)} domain={[0, "auto"]} />
            <Tooltip {...look.tooltip} formatter={(v: number) => [unit(v), name]} />
            <Line type="monotone" dataKey="v" stroke={look.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ color: look.accent, label: `${name}, ${ly}`, value: unit(lv) }]} />
    </>
  );
}

/** Appeals year by year: what was funded, and on top of it what was asked for and not met. */
function AidChart() {
  const look = useLook();
  const data = AID_FUNDING.map((a) => ({ year: String(a.year), funded: a.funded, gap: +(a.required - a.funded).toFixed(1), required: a.required }));
  const last = AID_FUNDING[AID_FUNDING.length - 1];
  return (
    <>
      <div
        role="img"
        aria-label={`Humanitarian appeals, ${AID_FUNDING[0].year} to ${last.year}. In ${last.year}, $${last.funded} billion of the $${last.required} billion asked for was funded.`}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis(look)} />
            <YAxis {...axis(look)} tickFormatter={(v: number) => `$${v}bn`} />
            <Tooltip
              {...look.tooltip}
              cursor={{ fill: look.grid }}
              formatter={(v: number, n: string, e: { payload?: { required: number; funded: number } }) =>
                n === "funded" ? [`$${v}bn · ${e.payload ? Math.round((100 * e.payload.funded) / e.payload.required) : 0}% of what was asked`, "Funded"] : [`$${v}bn`, "Not funded"]
              }
            />
            <Bar dataKey="funded" stackId="aid" fill={look.accent} isAnimationActive={false} />
            <Bar dataKey="gap" stackId="aid" fill={look.ramp[2]} fillOpacity={0.55} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: look.accent, label: `Funded, ${last.year}`, value: `$${last.funded}bn` },
          { color: look.ramp[2], label: "Asked for and not funded", value: `$${(last.required - last.funded).toFixed(1)}bn` },
        ]}
      />
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "displacement", label: "Displacement" },
  { id: "food", label: "Food & hunger" },
  { id: "health", label: "Health & water" },
  { id: "aid", label: "Aid & donors" },
];

export function HumanitarianPage() {
  const look = useLook();
  const { isLight, head, muted } = look;

  const stats = useMemo<Stat[]>(() => {
    const kind = (k: "idps" | "refugees"): WorldPoint[] => DISPLACED.map((d) => [d.year, d[k]]);
    const fromKind = (key: string, k: "idps" | "refugees", label: string, about: string): Stat => {
      const series = kind(k);
      const [year, v] = lastOf(series);
      return { key, label, value: millions(v), unit: "people", sub: `UNHCR · ${year}`, about, change: changeOf(series, "count", 0, false), series, source: WORLD.displaced.source };
    };
    const lastAid = AID_FUNDING[AID_FUNDING.length - 1];
    return [
      worldStat("displaced", "Forcibly displaced", "UNHCR", "People forced from their homes by persecution, conflict or violence, inside their country or across a border.", false),
      fromKind("idps", "idps", "Internally displaced", "People who have fled within their own country and are protected or assisted by UNHCR."),
      fromKind("refugees", "refugees", "Refugees", "Refugees under UNHCR's mandate, Palestine refugees under UNRWA's, and others in need of international protection."),
      worldStat("undernourished", "Undernourished", "FAO", "People whose usual food intake is too little for a normal, active and healthy life.", false),
      worldStat("childMortality", "Deaths before age five", "UN estimates", "Children who die before their fifth birthday, for every 1,000 born.", false),
      worldStat("water", "Without safely managed water", "WHO/UNICEF", "People whose drinking water is not at home, available when needed and free from contamination.", false, { complement: true }),
      {
        key: "aid",
        label: "Aid appealed for",
        value: `$${lastAid.required}bn`,
        unit: `${Math.round((100 * lastAid.funded) / lastAid.required)}% funded`,
        sub: `UN OCHA · ${lastAid.year}`,
        about: `What the UN's coordinated humanitarian appeals asked for, up from $${AID_FUNDING[0].required}bn in ${AID_FUNDING[0].year}; $${lastAid.funded}bn of it was funded.`,
        change: null,
        series: AID_FUNDING.map((a) => [a.year, a.required]),
        source: SRC.fts,
      },
      {
        key: "health",
        label: "Without essential health care",
        value: "4.5bn",
        unit: "people",
        sub: "WHO · 2023 report",
        about: "People not fully covered by essential health services, as the WHO and the World Bank track universal health coverage.",
        change: null,
        source: SRC.uhc,
      },
    ];
  }, []);

  const [dy, dv] = lastOf(WORLD.displaced.series);
  const peak = WORLD.displaced.series.reduce((a, b) => (b[1] > a[1] ? b : a));

  const childRows: BarRow[] = CHILD_MORTALITY_COUNTRIES.map(([name, code]) => {
    const f = COUNTRY_FIGURES.childMortality[code];
    return { key: code, name, code, value: f ? f[1] : null, text: f ? f[1].toFixed(1) : "Not published", note: f ? `${f[0]}` : undefined };
  }).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  const waterRows: BarRow[] = WATER_COUNTRIES.map(([name, code]) => {
    const c = COUNTRY_BY_CODE.get(code);
    const f = c ? COUNTRY_PANELS[c.id]?.safeWater : undefined;
    return { key: code, name, code, value: f ? f.v : null, text: f ? `${f.v.toFixed(1)}%` : "Not published", note: f ? f.y : undefined };
  }).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  const more = [
    worldStat("maternalMortality", "Maternal deaths", "WHO", "Women who die from causes related to pregnancy, for every 100,000 live births.", false),
    worldStat("measles", "Vaccinated against measles", "WHO/UNICEF", "One-year-olds who have had a measles vaccination.", true),
    worldStat("sanitation", "Safely managed sanitation", "WHO/UNICEF", "People with a toilet not shared with other households, whose waste is safely dealt with.", true),
  ];
  const food = [
    worldStat("foodInsecure", "Food insecure", "FAO", "People who at times in the year ate worse or less, or went without, for lack of money.", false),
    worldStat("stunting", "Stunted children", "UNICEF/WHO", "Children under five too short for their age - the mark of long-term undernutrition.", false),
  ];

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── Hero ── */}
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{ background: isLight ? "#ffffff" : "#0b0b0d", border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.12)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{ backgroundImage: `radial-gradient(circle, ${isLight ? "#000000" : "#ffffff"} 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
          />
          <div className="relative px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: muted }}>
                CommonSphere · Humanitarian
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans" style={{ color: head }}>
                Global Humanitarian Statistics
              </h1>
              <p className="text-sm font-sans mt-1.5" style={{ color: muted }}>
                Who has been forced from home, who goes hungry, how many children do not reach five, who lacks safe water and care - and
                the aid that is asked for and given. Each figure with its source and its year.
              </p>
              <p className="text-[11px] font-sans mt-2" style={{ color: muted }}>
                UNHCR · FAO · UNICEF · WHO · UN OCHA · OECD · World Bank · figures retrieved {WORLDVIEW_RETRIEVED}
              </p>
            </div>
            <div className="lg:text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
                People forcibly displaced · UNHCR · {dy}
              </p>
              <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1" style={{ color: head }}>
                {Math.round(dv).toLocaleString("en-US")}
              </p>
              <p className="mt-2 text-[11px] font-sans max-w-sm lg:ml-auto" style={{ color: muted }}>
                {peak[0] === dy ? `The most of any year since ${WORLD.displaced.series[0][0]}.` : `Down from ${millions(peak[1])} in ${peak[0]}, the most on record here.`}{" "}
                About one in every {Math.round(lastOf(WORLD.population.series)[1] / dv)} people alive.
              </p>
            </div>
          </div>
        </div>

        <SectionNav label="Humanitarian sections" sections={SECTIONS} />

        {/* ── Humanitarian headlines: the agencies' newsrooms and crisis desks ── */}
        <HeadlinesBanner
          label="Humanitarian headlines"
          topics={["humanitarian"]}
          subject={SUBJECT.humanitarian}
          days={7}
          note={(outlets) => (
            <>
              The last week's humanitarian news from aid agencies' own newsrooms and the outlets that cover crises - {outlets}, five at
              most from each - refreshed every half hour. The tag is the place a story is about, violet for more than one. Each links to
              its source.
            </>
          )}
        />

        {/* ══ Overview ══ */}
        <section id="overview" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="overview-title">
          <SectionHead icon={<HandHeart size={18} weight="fill" />} color="#10b981" title="At a glance" kicker="The headline figures, each with its change on about ten years before" />
          <h2 id="overview-title" className="sr-only">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <StatTile key={s.key} s={s} />
            ))}
          </div>

          <Card>
            <CardHead title="Active humanitarian crises" kicker="People in need, millions · UN OCHA, Global Humanitarian Overview 2024" />
            <BarList
              label="People in need by crisis"
              rows={[...ACTIVE_CRISES]
                .sort((a, b) => b.inNeed - a.inNeed)
                .map((c) => ({ key: c.name, name: c.name, code: c.code, value: c.inNeed, text: `${c.inNeed.toFixed(1)}M`, note: `${c.severity} · ${c.kind}` }))}
            />
            <p className="flex items-center gap-1.5 text-[10px] font-sans mt-3" style={{ color: muted }}>
              <Warning size={11} weight="fill" aria-hidden />
              OCHA rates {ACTIVE_CRISES.filter((c) => c.severity === "Critical").length} of these critical and the rest serious; together
              they count {ACTIVE_CRISES.reduce((t, c) => t + c.inNeed, 0).toFixed(1)} million people in need.
            </p>
            <SourceLink sources={[SRC.ocha]} className="mt-3" />
          </Card>
        </section>

        {/* ══ Displacement ══ */}
        <section id="displacement" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="displacement-title">
          <SectionHead icon={<Users size={18} weight="fill" />} color="#f97316" title="Displacement" kicker="Who has been forced from home, where they are, and where they came from" />
          <h2 id="displacement-title" className="sr-only">
            Displacement
          </h2>
          <Card>
            <CardHead
              title="The forcibly displaced, year by year"
              kicker={`Millions of people · UNHCR Refugee Data Finder · ${DISPLACED[0].year}–${DISPLACED[DISPLACED.length - 1].year}`}
            />
            <DisplacementChart />
            <p className="text-[10px] font-sans leading-relaxed mt-3 max-w-4xl" style={{ color: muted }}>
              Refugees here are those under UNHCR's mandate, Palestine refugees under UNRWA's, and others in need of international
              protection. The internally displaced are those UNHCR protects or assists; the Internal Displacement Monitoring Centre, which
              counts everyone displaced inside their country by conflict, reports more.
            </p>
            <SourceLink sources={[WORLD.displaced.source]} className="mt-3" />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Countries hosting the most refugees" kicker="Millions hosted · UNHCR Global Trends, end of 2023" />
              <BarList label="Refugees hosted by country" rows={TOP_HOSTS.map(([name, code, v]) => ({ key: code, name, code, value: v, text: `${v.toFixed(1)}M` }))} />
              <SourceLink sources={[SRC.unhcrTrends]} className="mt-4" />
            </Card>
            <Card>
              <CardHead title="Countries people have been displaced from" kicker="Millions displaced, in and out of the country · UNHCR and IDMC, 2023" />
              <BarList label="People displaced by country of origin" rows={TOP_ORIGINS.map(([name, code, v]) => ({ key: code, name, code, value: v, text: `${v.toFixed(1)}M` }))} />
              <SourceLink sources={[SRC.unhcrTrends, SRC.idmc]} className="mt-4" />
            </Card>
          </div>
        </section>

        {/* ══ Food & hunger ══ */}
        <section id="food" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="food-title">
          <SectionHead icon={<ForkKnife size={18} weight="fill" />} color="#eab308" title="Food & hunger" kicker="Who does not get enough to eat, and where" />
          <h2 id="food-title" className="sr-only">
            Food and hunger
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHead title="Hunger and food insecurity" kicker="Share of the world's people · FAO, via the World Bank" />
              <HungerChart />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                The undernourished are those whose usual diet gives too little energy for a normal, active life; the food insecure, many
                more, are those who at times ate worse or less, or went without, for lack of money. Both are FAO's current estimates,
                which revise earlier years as better data arrive.
              </p>
              <SourceLink sources={[WORLD.undernourished.source, WORLD.foodInsecure.source]} className="mt-3" />
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {food.map((s) => (
                <StatTile key={s.key} s={s} />
              ))}
            </div>
          </div>
          <Card>
            <CardHead title="Hunger by region" kicker="Share of each region's people undernourished · FAO, 2023" />
            <BarList label="Undernourishment by region" rows={HUNGER_REGIONS.map(([region, pct]) => ({ key: region, name: region, value: pct, text: `${pct.toFixed(1)}%` }))} />
            <SourceLink sources={[SRC.sofi]} className="mt-4" />
          </Card>
        </section>

        {/* ══ Health & water ══ */}
        <section id="health" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="health-title">
          <SectionHead icon={<Drop size={18} weight="fill" />} color="#06b6d4" title="Health & water" kicker="Children's survival, mothers', disease, and the water people drink" />
          <h2 id="health-title" className="sr-only">
            Health and water
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Deaths before age five, worldwide" kicker={`Per 1,000 live births · UN child mortality estimates · ${WORLD.childMortality.series[0][0]}–${lastOf(WORLD.childMortality.series)[0]}`} />
              <TrendChart id="childMortality" name="Deaths before age five" unit={(v) => `${v.toFixed(1)} per 1,000`} height={230} />
              <SourceLink sources={[WORLD.childMortality.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Deaths before age five, by country" kicker="Per 1,000 live births, each country's latest year · UN estimates, via the World Bank" />
              <BarList label="Child mortality by country" rows={childRows} />
              <SourceLink sources={[COUNTRY_FIGURE_SOURCES.childMortality]} className="mt-4" />
            </Card>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {more.map((s) => (
              <StatTile key={s.key} s={s} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Safely managed drinking water, worldwide" kicker={`Share of people · WHO/UNICEF · ${WORLD.water.series[0][0]}–${lastOf(WORLD.water.series)[0]}`} />
              <TrendChart id="water" name="Safely managed drinking water" unit={(v) => `${v.toFixed(1)}%`} height={230} />
              <SourceLink sources={[WORLD.water.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Safely managed drinking water, by country" kicker="Share of people, each country's latest year · WHO/UNICEF, via the World Bank" />
              <BarList label="Access to safely managed drinking water by country" rows={waterRows} max={100} />
              <SourceLink sources={[PANEL_SOURCES.wb]} className="mt-4" />
            </Card>
          </div>
          <Card>
            <CardHead title="Deaths from six diseases" kicker="Deaths per 100,000 people, in the region named · WHO, 2023" />
            <BarList label="Deaths per 100,000 by disease" rows={DISEASE_BURDEN.map(([disease, v, region]) => ({ key: disease, name: disease, value: v, text: v.toFixed(1), note: region }))} />
            <SourceLink sources={[SRC.gho]} className="mt-4" />
          </Card>
        </section>

        {/* ══ Aid & donors ══ */}
        <section id="aid" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="aid-title">
          <SectionHead icon={<HandHeart size={18} weight="fill" />} color="#8b5cf6" title="Aid & donors" kicker="What is asked for, what is given, and by whom" />
          <h2 id="aid-title" className="sr-only">
            Aid and donors
          </h2>
          <Card>
            <CardHead title="Humanitarian appeals: asked for and funded" kicker={`US$ billions · UN OCHA Financial Tracking Service · ${AID_FUNDING[0].year}–${AID_FUNDING[AID_FUNDING.length - 1].year}`} />
            <AidChart />
            <SourceLink sources={[SRC.fts]} className="mt-3" />
          </Card>
          <DonorAidCard />
        </section>

        <p className="text-[10px] font-sans leading-relaxed max-w-4xl px-1" style={{ color: muted }}>
          Two kinds of figure are on this page. Built from source and refreshed with it ({WORLDVIEW_RETRIEVED}): the displaced and their
          make-up year by year (UNHCR), undernourishment, food insecurity and stunting (FAO, UNICEF and the WHO), child and maternal
          mortality (the UN's estimates), water and sanitation (WHO/UNICEF), each country's child mortality and water access (World Bank),
          and aid by donor (OECD). Recorded from the agencies' reports, for the year shown on each: people in need by crisis and appeals
          against funding (UN OCHA), the countries hosting and producing the most refugees (UNHCR, 2023), hunger by region (FAO, 2023),
          deaths from six diseases and people without essential health care (WHO). Arrows compare with about ten years earlier; "better"
          and "worse" are given where one way plainly is.
        </p>
      </div>
    </div>
  );
}

// ── Countries providing aid ────────────────────────────────────────────────
/**
 * Who gives official development assistance, and how much, from the OECD's
 * DAC1 table (donorAid.ts, built by build-donor-aid.cjs).
 *
 * The amount is in current US dollars on the grant-equivalent basis the OECD
 * headlines. The change beside it is in real terms, as the OECD reports it —
 * which is why the DAC total reads −23.1% rather than the −19.0% the two dollar
 * figures would suggest. The share of national income is set against the UN's
 * long-standing 0.7% target.
 *
 * Only providers that report to the OECD are here. China, India, Russia and
 * others give aid but do not report to the DAC, so they are absent, not zero,
 * and the card says so.
 */
function DonorAidCard() {
  const { head, muted, track, accent } = useLook();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? DONOR_AID : DONOR_AID.slice(0, 15);
  const max = DONOR_AID[0]?.usd ?? 1;
  const fmtUsd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(1)}bn` : `$${Math.round(v / 1e6)}m`);
  const staleYears = DONOR_AID.filter((d) => d.year !== DAC_TOTAL.year);
  const tone = (v: number | null) => (v === null || v === 0 ? "text-muted-foreground" : v < 0 ? WORSE : BETTER);

  return (
    <Card>
      <CardHead title="Countries providing aid" kicker={`Official development assistance · OECD DAC · ${DAC_TOTAL.year}, preliminary`} />

      {/* The headline: the DAC total and how it moved. */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4">
        <p className="text-2xl font-bold font-mono" style={{ color: head }}>
          {fmtUsd(DAC_TOTAL.usd)}
          <span className="text-[11px] font-sans font-normal ml-2" style={{ color: muted }}>
            from DAC members in {DAC_TOTAL.year}
          </span>
        </p>
        {DAC_TOTAL.realChangePct !== null && (
          <p className={`flex items-center gap-1 text-[12px] font-mono ${tone(DAC_TOTAL.realChangePct)}`}>
            {DAC_TOTAL.realChangePct < 0 ? <ArrowDownRight size={12} weight="bold" aria-hidden /> : <ArrowUpRight size={12} weight="bold" aria-hidden />}
            {DAC_TOTAL.realChangePct > 0 ? "+" : ""}
            {DAC_TOTAL.realChangePct.toFixed(1)}%
            <span className="font-sans ml-1" style={{ color: muted }}>
              on {Number(DAC_TOTAL.year) - 1}, in real terms
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-[minmax(6rem,9rem)_1fr_4.5rem_4rem_4.5rem] gap-x-3 pb-1.5 mb-1 border-b" style={{ borderColor: track }}>
        {["Donor", "", "Aid", "Change", "% of GNI"].map((h, i) => (
          <span key={i} className={`text-[9px] font-sans uppercase tracking-widest ${i >= 2 ? "text-right" : ""}`} style={{ color: muted }}>
            {h}
          </span>
        ))}
      </div>

      <div className="flex flex-col">
        {shown.map((d) => {
          const meets = d.pctGni !== null && d.pctGni >= 0.7;
          return (
            <div key={d.iso3} className="grid grid-cols-[minmax(6rem,9rem)_1fr_4.5rem_4rem_4.5rem] gap-x-3 items-center py-1.5">
              <span className="text-[11px] font-sans truncate" style={{ color: head }} title={d.name}>
                {d.name}
                {d.year !== DAC_TOTAL.year && (
                  <span className="ml-1 text-[9px] font-mono" style={{ color: muted }}>
                    {d.year}
                  </span>
                )}
              </span>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: track }} aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${Math.max(1, (d.usd / max) * 100)}%`, background: accent }} />
              </div>
              <span className="text-[11px] font-mono font-bold text-right tabular-nums" style={{ color: head }}>
                {fmtUsd(d.usd)}
              </span>
              <span className={`text-[10px] font-mono text-right tabular-nums ${tone(d.realChangePct)}`}>
                {d.realChangePct === null ? "—" : `${d.realChangePct > 0 ? "+" : ""}${d.realChangePct.toFixed(1)}%`}
              </span>
              <span
                className={`text-[10px] font-mono text-right tabular-nums ${meets ? `font-bold ${BETTER}` : "text-muted-foreground"}`}
                title={meets ? "Meets the UN target of 0.7% of GNI" : undefined}
              >
                {d.pctGni === null ? "—" : `${d.pctGni.toFixed(2)}%${meets ? " ✓" : ""}`}
              </span>
            </div>
          );
        })}
      </div>

      {DONOR_AID.length > 15 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-[10px] font-sans uppercase tracking-wider cursor-pointer hover:underline"
          style={{ color: muted }}
        >
          {showAll ? "Show top 15" : `Show all ${DONOR_AID.length}`}
        </button>
      )}

      <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
        Aid is in current US dollars on the grant-equivalent basis the OECD uses for its headline; the change is in real terms, as the
        OECD reports it. A share of national income marked ✓ meets the UN target of 0.7%.
        {staleYears.length > 0 &&
          ` ${staleYears.map((d) => d.name).join(", ")} ${staleYears.length === 1 ? "has" : "have"} not reported ${DAC_TOTAL.year} yet, so the latest year reported is shown beside the name.`}{" "}
        Only providers that report to the OECD are listed: China, India, Russia and others give aid but do not report it there, so they
        are missing, not zero.
      </p>
      <SourceLink sources={[DONOR_AID_SOURCE]} className="mt-3" />
    </Card>
  );
}
