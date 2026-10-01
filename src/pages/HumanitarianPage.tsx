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
 * (World Bank), official aid by donor (OECD), armed conflicts and the deaths
 * in them (Uppsala Conflict Data Program), deaths in natural disasters
 * (EM-DAT), displacement by disasters (IDMC), and extreme poverty, HIV, hand
 * washing and life expectancy (World Bank).
 *
 * Recorded from the agencies' reports, with the report and year shown on
 * each: people in need by crisis and appeals against funding (UN OCHA),
 * the countries hosting and producing most refugees (UNHCR 2023), hunger by
 * region (FAO 2023), deaths from six diseases and people without essential
 * health care (WHO). These are not refreshed by a build.
 *
 * Bars and series take the site's several colours, a row or a series each,
 * as its other pages do; a figure is always beside its bar in ink, and every
 * series is named in a legend, so nothing is told by colour alone. Better
 * and worse appear as an arrow and a word. Charts do not animate.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Drop, ForkKnife, HandHeart, Users, Warning } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { SectionNav, type NavSection } from "../components/SectionNav";
import { StatCard, splitChange, type StatFact } from "../components/StatCard";
import { EXPLAIN } from "../data/worldviewExplain";
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
    /** The accent for a tile's latest point, as on the Worldview page. */
    accent: isLight ? "#2a78d6" : "#3987e5",
    tooltip: {
      contentStyle: {
        background: isLight ? "#ffffff" : "#15151a",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        fontSize: 11,
        fontFamily: "monospace",
        color: isLight ? "#0f172a" : "#f1f0ff",
      },
      // The lines of a hover box are in ink, not in their series' colour: amber on white cannot be read.
      itemStyle: { color: isLight ? "#0f172a" : "#f1f0ff" },
      labelStyle: { color: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.46)" },
    },
  };
}
type Look = ReturnType<typeof useLook>;

/**
 * The site's colours for bars and series, in the order a list takes them: a
 * row each, round again after the twelfth. The same in both themes.
 */
const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"];
const colourOf = (i: number) => PALETTE[i % PALETTE.length];
/** The series of each chart, by what they are. */
const SERIES = {
  idps: "#f97316",
  refugees: "#3b82f6",
  asylum: "#8b5cf6",
  hungry: "#ef4444",
  insecure: "#f59e0b",
  funded: "#10b981",
  gap: "#ef4444",
};

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
  /** A value of the series, printed as the figure is: the card reads its facts off the series with it. */
  fmt?: (v: number) => string;
  /** Facts in place of those read off the series. */
  facts?: StatFact[];
  /** What the figure counts and why it matters, for the card's window. */
  what?: string;
  why?: string;
  source: { label: string; url: string };
};

/**
 * A tile for a world series in worldview.ts: its latest value, its change on
 * ten years before, and its trend. `agency` is who produces the figure - the
 * World Bank republishes most of these, and the tile names the body behind it.
 */
function worldStat(
  id: string,
  label: string,
  agency: string,
  about: string,
  upIsGood: boolean,
  /** `whole` prints the number in full; `neutral` gives the change without calling it better or worse. */
  o: { complement?: boolean; whole?: boolean; unit?: string; neutral?: boolean } = {},
): Stat {
  const ind = WORLD[id];
  const series: WorldPoint[] = o.complement ? ind.series.map(([y, v]) => [y, Number((100 - v).toFixed(ind.dp))]) : ind.series;
  const [year, v] = lastOf(series);
  const kind = ind.format === "count" ? "count" : ind.format === "pct" ? "pct" : "num";
  const fmt = (x: number) => (o.whole ? x.toLocaleString("en-US") : kind === "count" ? millions(x) : kind === "pct" ? `${x.toFixed(ind.dp)}%` : x.toFixed(ind.dp));
  // The source's own account of the measure - not for a figure turned round to its complement.
  const explain = o.complement ? undefined : EXPLAIN[id];
  return {
    key: id,
    label,
    value: fmt(v),
    unit: o.unit ?? (kind === "count" ? "people" : ind.unit),
    sub: `${agency} · ${year}`,
    about,
    change: o.neutral ? unjudged(changeOf(series, kind, ind.dp, upIsGood)) : changeOf(series, kind, ind.dp, upIsGood),
    series,
    fmt,
    what: explain?.what,
    why: explain?.why,
    source: ind.source,
  };
}
const unjudged = (c: Change | null): Change | null => (c ? { ...c, verdict: null } : null);

/** The latest year of a world series split into its parts, as bars; a part of zero is named by `noneOf`, not drawn. */
function partsOf(id: string, text: (v: number) => string): BarRow[] {
  return (WORLD[id].breakdown ?? [])
    .filter(([, v]) => v > 0)
    .map(([label, v]) => {
      const apart = label.startsWith("Also: ");
      const name = apart ? label.slice(6, 7).toUpperCase() + label.slice(7) : label;
      return { key: label, name, value: v, text: text(v), note: apart ? "counted apart" : undefined };
    });
}
const noneOf = (id: string) => (WORLD[id].breakdown ?? []).filter(([, v]) => v === 0).map(([label]) => label.toLowerCase());

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

/**
 * A headline figure as the site's card (StatCard): what it is, its value,
 * whose it is and for when, its change as a chip, what it means, its trend in
 * its section's colour, and facts read off its series; a figure with a series
 * opens a window with the full chart.
 */
function StatTile({ s, color }: { s: Stat; color: string }) {
  return (
    <StatCard
      s={{
        label: s.label,
        value: s.value,
        sub: `${s.unit} · ${s.sub}`,
        change: s.change ? splitChange(s.change.text, s.change.dir, s.change.verdict) : null,
        about: s.about,
        series: s.series,
        color,
        fmt: s.fmt,
        facts: s.facts,
        what: s.what,
        why: s.why,
        source: s.source,
      }}
    />
  );
}

/** The sections' colours, which their cards take. */
const TONE = { overview: "#10b981", conflict: "#ef4444", displacement: "#f97316", food: "#eab308", health: "#06b6d4" };
/** The headline cards take the colour of the section each belongs to. */
const HEADLINE_TONE: Record<string, string> = {
  displaced: TONE.displacement,
  idps: TONE.displacement,
  refugees: TONE.displacement,
  undernourished: TONE.food,
  childMortality: TONE.health,
  water: TONE.health,
  health: TONE.health,
  aid: TONE.overview,
};

type BarRow = { key: string; name: string; code?: string; value: number | null; text: string; note?: string };

/**
 * A ranked list as bars, longest first as given: a name, its bar against the
 * longest in the row's own colour, and its figure in ink. A row with no
 * published figure says so.
 */
function BarList({ rows, max, label, wide = false }: { rows: BarRow[]; max?: number; label: string; wide?: boolean }) {
  const { head, muted, track } = useLook();
  const top = max ?? Math.max(...rows.map((r) => r.value ?? 0), 1);
  return (
    <ul className="flex flex-col gap-2.5" aria-label={label}>
      {rows.map((r, i) => (
        <li key={r.key} className={`grid ${wide ? "grid-cols-[minmax(7rem,45%)_1fr_auto]" : "grid-cols-[minmax(7rem,11rem)_1fr_auto]"} items-center gap-x-3`}>
          <span className="flex items-center gap-2 min-w-0">
            {r.code && <img src={flagUrl(r.code)} alt="" width={18} height={13} loading="lazy" className="rounded-[2px] shrink-0" />}
            <span className="min-w-0">
              <span className="block text-[11px] font-sans truncate" style={{ color: head }} title={r.name}>
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
            {r.value !== null && <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, Math.min(100, (100 * r.value) / top))}%`, background: colourOf(i) }} />}
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
            {(["idps", "refugees", "asylum"] as const).map((k) => (
              <Area key={k} type="monotone" dataKey={k} stackId="displaced" stroke={SERIES[k]} strokeWidth={2} fill={SERIES[k]} fillOpacity={0.5} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: SERIES.idps, label: `Internally displaced, ${last.year}`, value: millions(last.idps) },
          { color: SERIES.refugees, label: "Refugees", value: millions(last.refugees) },
          { color: SERIES.asylum, label: "Asylum-seekers", value: millions(last.asylum) },
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
            <Line type="monotone" dataKey="insecure" stroke={SERIES.insecure} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="hungry" stroke={SERIES.hungry} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: SERIES.hungry, label: `Undernourished, ${hy}`, value: `${hv.toFixed(1)}%` },
          { color: SERIES.insecure, label: `Moderately or severely food insecure, ${iy}`, value: `${iv.toFixed(1)}%` },
        ]}
      />
    </>
  );
}

/** One world series as a line, with its latest reading in the legend. */
function TrendChart({ id, name, unit, color, height = 190, tick }: { id: string; name: string; unit: (v: number) => string; color: string; height?: number; tick?: (v: number) => string }) {
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
            <YAxis {...axis(look)} domain={[0, "auto"]} tickFormatter={tick} />
            <Tooltip {...look.tooltip} formatter={(v: number) => [unit(v), name]} />
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ color, label: `${name}, ${ly}`, value: unit(lv) }]} />
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
            <Bar dataKey="funded" stackId="aid" fill={SERIES.funded} isAnimationActive={false} />
            <Bar dataKey="gap" stackId="aid" fill={SERIES.gap} fillOpacity={0.45} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { color: SERIES.funded, label: `Funded, ${last.year}`, value: `$${last.funded}bn` },
          { color: SERIES.gap, label: "Asked for and not funded", value: `$${(last.required - last.funded).toFixed(1)}bn` },
        ]}
      />
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview" },
  { id: "conflict", label: "Conflict & disaster" },
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
      return { key, label, value: millions(v), unit: "people", sub: `UNHCR · ${year}`, about, change: changeOf(series, "count", 0, false), series, fmt: millions, source: WORLD.displaced.source };
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
        fmt: (v) => `$${v}bn`,
        facts: [
          { label: "Funded", value: `$${lastAid.funded}bn`, sub: `${Math.round((100 * lastAid.funded) / lastAid.required)}% of what was asked` },
          { label: "Not funded", value: `$${(lastAid.required - lastAid.funded).toFixed(1)}bn`, sub: `${lastAid.year}` },
          { label: "Asked for", value: `$${AID_FUNDING[0].required}bn`, sub: `${AID_FUNDING[0].year}` },
        ],
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
    worldStat("handwashing", "Can wash hands with soap", "WHO/UNICEF", "People whose home has a place to wash hands with soap and water.", true),
    // More people living with HIV is also what longer survival on treatment looks like, so no better or worse is drawn.
    worldStat("hiv", "Living with HIV", "UNAIDS", "People aged 15 to 49 who are living with HIV.", false, { neutral: true }),
    worldStat("lifeExpectancy", "Life expectancy", "World Bank", "The years a newborn would live if the death rates of the year of birth held for life.", true),
  ];
  const food = [
    worldStat("foodInsecure", "Food insecure", "FAO", "People who at times in the year ate worse or less, or went without, for lack of money.", false),
    worldStat("stunting", "Stunted children", "UNICEF/WHO", "Children under five too short for their age - the mark of long-term undernutrition.", false),
    worldStat("extremePoverty", "In extreme poverty", "World Bank", "People living on less than $3.00 a day, at 2021 purchasing power.", false),
  ];
  const drivers = [
    worldStat("conflicts", "Armed conflicts", "UCDP", "Conflicts in which at least one side is a government and at least 25 people die in battle in the year.", false),
    worldStat("conflictDeaths", "Deaths in armed conflicts", "UCDP", "The best estimate of deaths in fighting involving states, fighting between non-state groups, and violence against civilians.", false, { whole: true, unit: "deaths" }),
    worldStat("disasterDeaths", "Deaths in natural disasters", "EM-DAT", "Confirmed deaths and missing people in disasters that overwhelm local capacity. One great event moves a year's toll, so no better or worse is drawn.", false, {
      whole: true,
      unit: "dead and missing",
      neutral: true,
    }),
    worldStat("disasterDisplacement", "Displaced by disasters", "IDMC", "People forced from home by a disaster within their own country, counted each time they are displaced.", false, { unit: "displacements", neutral: true }),
  ];
  const span = (id: string) => `${WORLD[id].series[0][0]}–${lastOf(WORLD[id].series)[0]}`;
  const whole = (v: number) => v.toLocaleString("en-US");
  const thousands = (v: number) => (v === 0 ? "0" : v >= 1e6 ? `${v / 1e6}M` : `${Math.round(v / 1000)}k`);
  const noDisasterDeaths = noneOf("disasterDeaths");

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
                UNHCR · FAO · UNICEF · WHO · UN OCHA · OECD · World Bank · UCDP · EM-DAT · IDMC · figures retrieved {WORLDVIEW_RETRIEVED}
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
              <StatTile key={s.key} s={s} color={HEADLINE_TONE[s.key] ?? TONE.overview} />
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

        {/* ══ Conflict & disaster ══ */}
        <section id="conflict" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="conflict-title">
          <SectionHead icon={<Warning size={18} weight="fill" />} color="#ef4444" title="Conflict & disaster" kicker="What drives people from home and into need: wars, and floods, storms and earthquakes" />
          <h2 id="conflict-title" className="sr-only">
            Conflict and disaster
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {drivers.map((s) => (
              <StatTile key={s.key} s={s} color={TONE.conflict} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Armed conflicts, year by year" kicker={`Conflicts involving a state · Uppsala Conflict Data Program · ${span("conflicts")}`} />
              <TrendChart id="conflicts" name="State-based armed conflicts" unit={(v) => `${v} conflicts`} color="#8b5cf6" height={210} />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2.5" style={{ color: muted }}>
                By kind · {WORLD.conflicts.breakdownYear}
              </p>
              <BarList wide label="Armed conflicts by kind" rows={partsOf("conflicts", (v) => String(v))} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.conflicts.note} The kinds marked "counted apart" are ones the programme counts separately from those {lastOf(WORLD.conflicts.series)[1]}.
              </p>
              <SourceLink sources={[WORLD.conflicts.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Deaths in armed conflicts" kicker={`Deaths a year · Uppsala Conflict Data Program · ${span("conflictDeaths")}`} />
              <TrendChart id="conflictDeaths" name="Deaths in armed conflicts" unit={(v) => `${whole(v)} deaths`} color="#ef4444" height={210} tick={thousands} />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2.5" style={{ color: muted }}>
                By kind of violence · {WORLD.conflictDeaths.breakdownYear}
              </p>
              <BarList wide label="Deaths in armed conflicts by kind of violence" rows={partsOf("conflictDeaths", whole)} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.conflictDeaths.note}
              </p>
              <SourceLink sources={[WORLD.conflictDeaths.source]} className="mt-3" />
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Deaths in natural disasters" kicker={`Dead and missing a year · EM-DAT · ${span("disasterDeaths")}`} />
              <TrendChart id="disasterDeaths" name="Dead and missing in natural disasters" unit={(v) => whole(v)} color="#f59e0b" height={210} tick={thousands} />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2.5" style={{ color: muted }}>
                By kind of disaster · {WORLD.disasterDeaths.breakdownYear}
              </p>
              <BarList wide label="Deaths in natural disasters by kind" rows={partsOf("disasterDeaths", whole).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                EM-DAT counts confirmed deaths and missing people in disasters that overwhelm local capacity. The toll swings from year to year with single great events.
                {noDisasterDeaths.length > 0 && ` For ${WORLD.disasterDeaths.breakdownYear} it records no deaths from ${noDisasterDeaths.join(" or ")}.`}
              </p>
              <SourceLink sources={[WORLD.disasterDeaths.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Displaced by disasters" kicker={`New displacements a year · IDMC, via the World Bank · ${span("disasterDisplacement")}`} />
              <TrendChart id="disasterDisplacement" name="New displacements by disasters" unit={(v) => millions(v)} color="#06b6d4" height={210} tick={(v) => (v === 0 ? "0" : `${Math.round(v / 1e6)}M`)} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.disasterDisplacement.note} These are movements, not people: someone displaced twice in a year is counted twice. The figures of the Displacement section below count people displaced by
                conflict and persecution, and are a different measure.
              </p>
              <SourceLink sources={[WORLD.disasterDisplacement.source]} className="mt-3" />
            </Card>
          </div>
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
          <Card>
              <CardHead title="Hunger and food insecurity" kicker="Share of the world's people · FAO, via the World Bank" />
              <HungerChart />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                The undernourished are those whose usual diet gives too little energy for a normal, active life; the food insecure, many
                more, are those who at times ate worse or less, or went without, for lack of money. Both are FAO's current estimates,
                which revise earlier years as better data arrive.
              </p>
              <SourceLink sources={[WORLD.undernourished.source, WORLD.foodInsecure.source]} className="mt-3" />
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {food.map((s) => (
              <StatTile key={s.key} s={s} color={TONE.food} />
            ))}
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
              <TrendChart id="childMortality" name="Deaths before age five" unit={(v) => `${v.toFixed(1)} per 1,000`} color="#ef4444" height={230} />
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
              <StatTile key={s.key} s={s} color={TONE.health} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Safely managed drinking water, worldwide" kicker={`Share of people · WHO/UNICEF · ${WORLD.water.series[0][0]}–${lastOf(WORLD.water.series)[0]}`} />
              <TrendChart id="water" name="Safely managed drinking water" unit={(v) => `${v.toFixed(1)}%`} color="#06b6d4" height={230} />
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
          aid by donor (OECD), armed conflicts and the deaths in them (Uppsala Conflict Data Program), deaths in natural disasters
          (EM-DAT), displacement by disasters (IDMC), and extreme poverty, HIV, hand washing and life expectancy (World Bank). Recorded from the agencies' reports, for the year shown on each: people in need by crisis and appeals
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
  const { head, muted, track } = useLook();
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
        {shown.map((d, i) => {
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
                <div className="h-full rounded-full" style={{ width: `${Math.max(1, (d.usd / max) * 100)}%`, background: colourOf(i) }} />
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
