/**
 * Human rights, with a short humanitarian section, in the same card, tile
 * and chart language as the Worldview page.
 *
 * It was a humanitarian page with a rights section, and was turned round as
 * asked. It opens on how far people are free - their liberties, the checks
 * on those who govern them, the kind of government they live under, and the
 * bodies that watch over their rights - and closes on the need and the aid:
 * the crises under way and a card for each kind of figure. The long
 * humanitarian sections - aid and donors, conflict and disaster,
 * displacement, food, health - are folded away under that short one and
 * open with a press, so nothing the page held was lost.
 *
 * The rights figures are V-Dem's indices in worldview.ts (civil liberties and
 * their parts, expression, association, women's liberties, equality before
 * the law, the rule of law, academic freedom, and who lives under which kind
 * of government): expert ratings from 0 to 1 averaged across the world's
 * people, drawn on the whole of their scale. The human rights bodies are the
 * five in alliances.ts, each with the count and the account it gives of
 * itself and the day it was checked.
 *
 * The figures are gathered by category - aid, rights, conflict and disaster,
 * displacement, food, health - a card each in place of rows of figure cards:
 * the card lists its figures, and a window behind it describes and draws each
 * one, as a state's or a country's window does for a place. Each section
 * opens with its own; the six together were taken off the overview as asked.
 *
 * A yearly chart also names what its years hold (namedEvents.ts): under the
 * disaster deaths, the deadliest disaster of each year by name, with its
 * kind, place, date and death toll from Wikipedia's list, and an earthquake's
 * magnitude and damage from NOAA; under the conflict deaths, the countries
 * where most died each year, from the Uppsala data. Hovering a year on either
 * chart names it too. The event is a year's deadliest, not its whole toll.
 * The count of armed conflicts and the displacements by disasters have the
 * same list, by country (state-based deaths; the World Bank's rows of the
 * displacement centre's figures). Each list is folded away under its chart
 * until asked for, and closed it says its latest year in a line.
 * * Two kinds of figure are on the page, and it says which is which.
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
import { useId, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, CaretDown, Drop, ForkKnife, HandHeart, Scales, Users, Warning } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { SectionNav, type NavSection } from "../components/SectionNav";
import { StatCategoryCard, splitChange, type StatCardData, type StatCategoryData, type StatFact } from "../components/StatCard";
import { EXPLAIN } from "../data/worldviewExplain";
import { ALLIANCES, HUMAN_RIGHTS_CHECKED } from "../data/alliances";
import { DONOR_AID, DONOR_AID_SOURCE, DAC_TOTAL } from "../data/donorAid";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES, DISPLACED_BY_KIND, WORLD, WORLDVIEW_RETRIEVED, type WorldPoint } from "../data/worldview";
import { COUNTRY_PANELS, PANEL_SOURCES } from "../data/countryPanels";
import { CONFLICT_DEATHS_BY_PLACE, DEADLIEST_DISASTERS, DISASTER_DISPLACEMENT_BY_PLACE, NAMED_EVENTS_SOURCES, STATE_FIGHTING_BY_PLACE, type YearPlaces } from "../data/namedEvents";
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
    muted: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)",
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
      // Each line of a hover box takes its series' colour, recharts' default; the card is glass (index.css).
      labelStyle: { color: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)" },
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

/** A figure as the site's card data (StatCard): what it is, its value, whose it is and for when, its change, what it means, its series in its category's colour, and its source. */
function cardOf(s: Stat, color: string): StatCardData {
  return {
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
  };
}

/** The sections' colours, which their cards take. */
const TONE = { overview: "#10b981", aid: "#8b5cf6", rights: "#3b82f6", conflict: "#ef4444", displacement: "#f97316", food: "#eab308", health: "#06b6d4" };

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
function TrendChart({
  id,
  name,
  unit,
  color,
  height = 190,
  tick,
  named,
}: {
  id: string;
  name: string;
  unit: (v: number) => string;
  color: string;
  height?: number;
  tick?: (v: number) => string;
  /** What a year is known for, said when it is hovered. */
  named?: (year: number) => string | undefined;
}) {
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
            <Tooltip
              {...look.tooltip}
              formatter={(v: number) => [unit(v), name]}
              labelFormatter={(year: string) => {
                const what = named?.(Number(year));
                return what ? `${year} · ${what}` : year;
              }}
            />
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ color, label: `${name}, ${ly}`, value: unit(lv) }]} />
    </>
  );
}

/**
 * Several of V-Dem's indices as lines, on the whole of their scale of 0 to 1
 * so a small move is not drawn as a large one; each is named in the legend
 * with its latest reading.
 */
function IndexChart({ lines, label, height = 230 }: { lines: [id: string, name: string, color: string][]; label: string; height?: number }) {
  const look = useLook();
  const years = WORLD[lines[0][0]].series.map(([y]) => y);
  const data = years.map((y) => {
    const row: Record<string, number | string> = { year: String(y) };
    for (const [id] of lines) {
      const p = WORLD[id].series.find(([py]) => py === y);
      if (p) row[id] = p[1];
    }
    return row;
  });
  const latest = (id: string) => lastOf(WORLD[id].series);
  return (
    <>
      <div
        role="img"
        aria-label={`${label}, ${years[0]} to ${years[years.length - 1]}, each from 0 to 1: ${lines.map(([id, name]) => `${name} ${latest(id)[1].toFixed(2)} in ${latest(id)[0]}`).join("; ")}.`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis(look)} minTickGap={18} />
            <YAxis {...axis(look)} domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} />
            <Tooltip {...look.tooltip} formatter={(v: number, n: string) => [v.toFixed(2), lines.find(([id]) => id === n)?.[1] ?? n]} />
            {lines.map(([id, , color]) => (
              <Line key={id} type="monotone" dataKey={id} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend items={lines.map(([id, name, color]) => ({ color, label: `${name}, ${latest(id)[0]}`, value: latest(id)[1].toFixed(2) }))} />
    </>
  );
}

/** A list that runs down one column inside its card, with its own scroll once it is long. */
function Scroller({ label, children }: { label: string; children: ReactNode }) {
  const { track } = useLook();
  return (
    <ul className="flex flex-col max-h-[26rem] overflow-y-auto pr-2 rounded-lg" style={{ borderTop: `1px solid ${track}`, borderBottom: `1px solid ${track}` }} aria-label={label} tabIndex={0}>
      {children}
    </ul>
  );
}

/** A two-way choice of order, as plain buttons. */
function OrderToggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const { head, muted, track } = useLook();
  return (
    <span className="inline-flex rounded-full p-0.5" style={{ background: track }}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className="text-[10px] font-sans font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
          style={{ color: value === v ? head : muted, background: value === v ? "var(--color-background)" : "transparent" }}
        >
          {text}
        </button>
      ))}
    </span>
  );
}

type Order = "year" | "toll";
const ORDERS: [Order, string][] = [
  ["year", "Newest first"],
  ["toll", "Largest first"],
];

/**
 * A year-by-year list under a chart, folded away until asked for: its heading
 * opens and closes it, and closed it says its latest year in a line, so the
 * card stays short and the list is one press away.
 */
function YearFold({ title, latest, order, onOrder, children, note }: { title: string; latest: string; order: Order; onOrder: (o: Order) => void; children: ReactNode; note: ReactNode }) {
  const { head, muted, isLight } = useLook();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* A button that reads as one on the light page and the dark: its own ground and edge, and a filled word saying what a press does. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left cursor-pointer min-w-0 rounded-full pl-3 pr-1.5 py-1 transition-opacity hover:opacity-80"
          style={{ color: head, background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.09)", border: isLight ? "1px solid rgba(15,23,42,0.28)" : "1px solid rgba(255,255,255,0.32)" }}
        >
          <CaretDown size={11} weight="bold" className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
          <span className="text-[10px] font-mono uppercase tracking-widest min-w-0">{title}</span>
          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">{open ? "Hide" : "Show"}</span>
        </button>
        {open && <OrderToggle value={order} onChange={onOrder} options={ORDERS} />}
      </div>
      {open ? (
        <div id={id} className="mt-2">
          {children}
          <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
            {note}
          </p>
        </div>
      ) : (
        <p id={id} className="text-[11px] font-sans leading-snug mt-1.5 pl-3" style={{ color: head }}>
          {latest}
        </p>
      )}
    </div>
  );
}

/**
 * The long humanitarian sections, folded away under the short one. Closed, the page stays a page about rights;
 * a press opens every chart and list the humanitarian page held.
 */
function FullFold({ title, children }: { title: string; children: ReactNode }) {
  const { head, isLight } = useLook();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-left cursor-pointer max-w-full rounded-full pl-3 pr-1.5 py-1 transition-opacity hover:opacity-80"
        style={{ color: head, background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.09)", border: isLight ? "1px solid rgba(15,23,42,0.28)" : "1px solid rgba(255,255,255,0.32)" }}
      >
        <CaretDown size={11} weight="bold" className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
        <span className="text-[10px] font-mono uppercase tracking-widest min-w-0">{title}</span>
        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div id={id} className="flex flex-col gap-6 mt-6">
          {children}
        </div>
      )}
    </div>
  );
}

const usdShort = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)}bn` : `$${Math.round(v / 1e6)}m`);
/** The colour of a disaster's kind, by the first kind the list gives it. */
const KIND_COLOR: [RegExp, string][] = [
  [/earthquake|tsunami/i, "#f59e0b"],
  [/cyclone|hurricane|typhoon|storm/i, "#3b82f6"],
  [/heat/i, "#ef4444"],
  [/flood/i, "#06b6d4"],
  [/landslide|mudslide/i, "#84cc16"],
];
const kindColor = (kind: string) => KIND_COLOR.find(([re]) => re.test(kind))?.[1] ?? "#8b5cf6";

/**
 * The deadliest natural disaster of each year, by name: its kind, where and
 * when, the death toll as the list gives it (a range where the counts
 * differ), and how hard it struck - an earthquake's magnitude, and the damage
 * where a figure is published. The bar is the toll's lower figure against the
 * largest in the list; the year's whole toll, EM-DAT's, is beside it and is a
 * different count.
 */
function NamedDisasters() {
  const { head, muted, track } = useLook();
  const [order, setOrder] = useState<Order>("year");
  const rows = [...DEADLIEST_DISASTERS].sort((a, b) => (order === "year" ? b.year - a.year : b.low - a.low));
  const top = Math.max(...DEADLIEST_DISASTERS.map((e) => e.low));
  const yearTotal = new Map(WORLD.disasterDeaths.series);
  const last = DEADLIEST_DISASTERS[DEADLIEST_DISASTERS.length - 1];
  return (
    <YearFold
      title={`The deadliest disaster of each year, by name · ${DEADLIEST_DISASTERS.length} years`}
      latest={`${last.year}: ${last.name} - ${last.deaths} dead${last.magnitude != null ? `, magnitude ${last.magnitude}` : ""}.`}
      order={order}
      onOrder={setOrder}
      note={
        <>
          Each is the single deadliest disaster of its year, epidemics and famines apart, as Wikipedia's list of natural disasters by death toll names it; the toll is the list's, a
          range where the counts differ, and the bar is its lower figure. An earthquake's magnitude and damage are NOAA's, and NOAA's own count of the dead is given beside the
          list's. EM-DAT's yearly total covers every disaster of the year under its own rules, so it can be smaller than one event's highest estimate.
        </>
      }
    >
      <Scroller label="The deadliest natural disaster of each year">
        {rows.map((e) => {
          const color = kindColor(e.kind);
          const all = yearTotal.get(e.year);
          const impact = [
            e.magnitude != null ? `magnitude ${e.magnitude}` : null,
            e.damageUsd != null ? `damage ${usdShort(e.damageUsd)}, in the year's dollars (${e.damageFrom})` : null,
            e.noaaDeaths != null ? `NOAA counts ${e.noaaDeaths.toLocaleString("en-US")} dead` : null,
          ].filter(Boolean);
          return (
            <li key={e.year} className="py-2.5" style={{ borderBottom: `1px solid ${track}` }}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest min-w-0" style={{ color: muted }}>
                  <span className="font-bold" style={{ color: head }}>
                    {e.year}
                  </span>{" "}
                  · <span style={{ color }}>{e.kind}</span>
                </p>
                <p className="text-[12px] font-mono font-bold tabular-nums shrink-0" style={{ color: head }}>
                  {e.deaths}{" "}
                  <span className="font-normal font-sans text-[10px]" style={{ color: muted }}>
                    dead
                  </span>
                </p>
              </div>
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(e.article.replace(/ /g, "_"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] font-sans font-bold leading-snug mt-0.5 hover:underline"
                style={{ color: head }}
              >
                {e.name}
              </a>
              <span className="block h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: track }} aria-hidden>
                <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * e.low) / top)}%`, background: color }} />
              </span>
              <p className="text-[10px] font-sans leading-relaxed mt-1.5" style={{ color: muted }}>
                {e.where} · {e.when}
                {impact.length > 0 && ` · ${impact.join(" · ")}`}
                {all != null && ` · all disasters that year, by EM-DAT's count: ${all.toLocaleString("en-US")}`}
              </p>
            </li>
          );
        })}
      </Scroller>
    </YearFold>
  );
}

/**
 * Where a year's figure was: for each year the place with the most of it, as
 * a share of the world's, and the two after it. The bar is against the
 * largest in the list.
 */
function PlacesByYear({
  title,
  label,
  rows,
  unit,
  color,
  fmt = (n) => n.toLocaleString("en-US"),
  beside,
  note,
}: {
  title: string;
  label: string;
  rows: YearPlaces[];
  /** What is counted, after the figure: "deaths", "displacements". */
  unit: string;
  color: string;
  fmt?: (n: number) => string;
  /** Something else to say of a year, after it: how many conflicts it had. */
  beside?: (year: number) => string | undefined;
  note: ReactNode;
}) {
  const { head, muted, track } = useLook();
  const [order, setOrder] = useState<Order>("year");
  const held = rows.filter((y) => y.top.length > 0);
  const list = [...held].sort((a, b) => (order === "year" ? b.year - a.year : b.top[0][1] - a.top[0][1]));
  const top = Math.max(...held.map((y) => y.top[0][1]));
  const share = (n: number, of: number) => `${Math.round((100 * n) / of)}%`;
  const last = held[held.length - 1];
  return (
    <YearFold
      title={`${title} · ${held.length} years`}
      latest={`${last.year}: ${last.top[0][0]} - ${fmt(last.top[0][1])} ${unit}, ${share(last.top[0][1], last.world)} of the world's ${fmt(last.world)}.`}
      order={order}
      onOrder={setOrder}
      note={note}
    >
      <Scroller label={label}>
        {list.map((y) => {
          const [[place, n], ...next] = y.top;
          const also = beside?.(y.year);
          return (
            <li key={y.year} className="py-2.5" style={{ borderBottom: `1px solid ${track}` }}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
                  <span className="font-bold" style={{ color: head }}>
                    {y.year}
                  </span>{" "}
                  {also && `· ${also} `}· {share(n, y.world)} of the world's {fmt(y.world)}
                </p>
                <p className="text-[12px] font-mono font-bold tabular-nums shrink-0" style={{ color: head }}>
                  {fmt(n)}{" "}
                  <span className="font-normal font-sans text-[10px]" style={{ color: muted }}>
                    {unit}
                  </span>
                </p>
              </div>
              <p className="text-[13px] font-sans font-bold leading-snug mt-0.5" style={{ color: head }}>
                {place}
              </p>
              <span className="block h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: track }} aria-hidden>
                <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * n) / top)}%`, background: color }} />
              </span>
              {next.length > 0 && (
                <p className="text-[10px] font-sans leading-relaxed mt-1.5" style={{ color: muted }}>
                  Then {next.map(([p, d]) => `${p}, ${fmt(d)} (${share(d, y.world)})`).join(" · ")}
                </p>
              )}
            </li>
          );
        })}
      </Scroller>
    </YearFold>
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
  { id: "rights", label: "Human rights" },
  { id: "liberties", label: "Liberties" },
  { id: "government", label: "Government" },
  { id: "bodies", label: "Rights bodies" },
  { id: "humanitarian", label: "Humanitarian" },
];

/** The human rights bodies the site holds, each with its own count and its own account of itself. */
const RIGHTS_BODIES = ALLIANCES.filter((a) => a.kind === "Human rights body");

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
      // Aid and rights lead; the need behind them follows.
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
        key: "oda",
        label: "Official aid given",
        value: `$${(DAC_TOTAL.usd / 1e9).toFixed(1)}bn`,
        unit: "from DAC members",
        sub: `OECD · ${DAC_TOTAL.year}, preliminary`,
        about: "Official development assistance from the members of the OECD's Development Assistance Committee, in current US dollars on the grant-equivalent basis. Providers that do not report to the OECD are not in it.",
        change: null,
        facts: [
          { label: "Of donors' income", value: `${DAC_TOTAL.pctGni}%`, sub: "the UN's target is 0.7%" },
          { label: `On ${Number(DAC_TOTAL.year) - 1}`, value: `${DAC_TOTAL.realChangePct > 0 ? "+" : ""}${DAC_TOTAL.realChangePct.toFixed(1)}%`, sub: "in real terms" },
          { label: "Largest donor", value: DONOR_AID[0].name, sub: `$${(DONOR_AID[0].usd / 1e9).toFixed(1)}bn · ${DONOR_AID[0].year}` },
        ],
        source: DONOR_AID_SOURCE,
      },
      worldStat("civilLiberties", "Civil liberties", "V-Dem", "How far people are free from the government's violence and free in their private and political lives, from 0 to 1, averaged across the world's people.", true),
      worldStat("physicalIntegrity", "Freedom from torture and political killing", "V-Dem", "How far people are free from torture and political killings by the government and its agents, from 0 to 1.", true),
      worldStat("freeExpression", "Freedom of expression", "V-Dem", "Freedom to discuss politics, a press free from censorship and harassment, and media that give a range of views, from 0 to 1.", true),
      worldStat("displaced", "Forcibly displaced", "UNHCR", "People forced from their homes by persecution, conflict or violence, inside their country or across a border.", false),
      fromKind("idps", "idps", "Internally displaced", "People who have fled within their own country and are protected or assisted by UNHCR."),
      fromKind("refugees", "refugees", "Refugees", "Refugees under UNHCR's mandate, Palestine refugees under UNRWA's, and others in need of international protection."),
      worldStat("undernourished", "Undernourished", "FAO", "People whose usual food intake is too little for a normal, active and healthy life.", false),
      worldStat("childMortality", "Deaths before age five", "UN estimates", "Children who die before their fifth birthday, for every 1,000 born.", false),
      worldStat("water", "Without safely managed water", "WHO/UNICEF", "People whose drinking water is not at home, available when needed and free from contamination.", false, { complement: true }),
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
  const rights = [
    worldStat("privateLiberties", "Private liberties", "V-Dem", "Freedom from forced labour, the right to own property, freedom to move at home and abroad, and freedom of religion.", true),
    worldStat("politicalLiberties", "Political liberties", "V-Dem", "Freedom of expression and freedom of association together: the liberties people need to take part in politics.", true),
    worldStat("freeAssociation", "Freedom of association", "V-Dem", "Whether parties, the opposition among them, and civil society organisations can form and work freely.", true),
    worldStat("womenCivilLiberties", "Women's civil liberties", "V-Dem", "How far women are free from forced labour, can own property and reach the courts, and can move freely.", true),
    worldStat("equalityBeforeLaw", "Equality before the law", "V-Dem", "Whether laws are clear and enforced alike for all, administration is impartial and people can reach justice.", true),
    worldStat("ruleOfLaw", "Rule of law", "V-Dem", "How far government keeps to the law, the courts are independent and officials are impartial and not corrupt.", true),
    worldStat("academicFreedom", "Academic freedom", "V-Dem", "Freedom to research, teach and exchange ideas, and the independence of universities.", true),
    worldStat("judicialConstraints", "Courts' check on the executive", "V-Dem", "How far the executive respects the constitution and obeys the courts, and the courts are independent.", true),
    worldStat("legislativeConstraints", "Legislature's check on the executive", "V-Dem", "How far the legislature, the opposition included, questions, oversees and investigates the executive.", true),
    worldStat("closedAutocracyShare", "Living in a closed autocracy", "V-Dem", "People in countries with no multiparty elections for the chief executive or the legislature.", false),
  ];
  // The world's people by the kind of government they live under, as V-Dem classes it; each share is of those it classifies.
  const regimeParts = WORLD.democracyShare.breakdown ?? [];
  const classified = regimeParts.reduce((t, [, v]) => t + v, 0);
  const regimeRows: BarRow[] = regimeParts.map(([label, v]) => ({ key: label, name: label, value: v, text: millions(v), note: `${((100 * v) / classified).toFixed(1)}% of the people classified` }));
  // The people V-Dem classes as living under an autocracy, electoral or closed: its two counts, added together here for the page's opening figure.
  const autocratic = regimeParts.filter(([label]) => /autocracy/i.test(label)).reduce((t, [, v]) => t + v, 0);
  const closed = regimeParts.find(([label]) => /closed/i.test(label))?.[1];
  // The figures by category: a card each in place of the rows of figure cards, with a window behind it.
  const pick = (...keys: string[]) => keys.map((k) => stats.find((x) => x.key === k)).filter((x): x is Stat => !!x);
  const category = (key: keyof typeof TONE, title: string, kicker: string, icon: ReactNode, list: Stat[]): StatCategoryData => ({
    key,
    title,
    kicker,
    color: TONE[key],
    icon,
    stats: list.map((x) => cardOf(x, TONE[key])),
  });
  const CATEGORY = {
    aid: category("aid", "Aid & donors", "What is asked for, what is given, and by whom", <HandHeart size={18} weight="fill" />, pick("aid", "oda")),
    rights: category(
      "rights",
      "Human rights",
      "How far people are free from the state's violence, and free to speak, to organise and to live as they choose",
      <Scales size={18} weight="fill" />,
      [...pick("civilLiberties", "physicalIntegrity", "freeExpression"), ...rights],
    ),
    conflict: category("conflict", "Conflict & disaster", "What drives people from home and into need: wars, and floods, storms and earthquakes", <Warning size={18} weight="fill" />, drivers),
    displacement: category("displacement", "Displacement", "Who has been forced from home, inside their country and across a border", <Users size={18} weight="fill" />, pick("displaced", "idps", "refugees")),
    food: category("food", "Food & hunger", "Who does not get enough to eat", <ForkKnife size={18} weight="fill" />, [...pick("undernourished"), ...food]),
    health: category("health", "Health & water", "Children's survival, mothers', disease, and the water people drink", <Drop size={18} weight="fill" />, [...pick("childMortality", "water", "health"), ...more]),
  };
  /** The world's count of state-based armed conflicts, by year. */
  const conflictCount = new Map(WORLD.conflicts.series);
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
                CommonSphere · Human rights
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans" style={{ color: head }}>
                Human Rights
              </h1>
              <p className="text-sm font-sans mt-1.5" style={{ color: muted }}>
                How far people are free from torture and political killing, and free to speak, to organise and to live as they choose.
                The courts and parliaments that can check those who govern them, the kind of government they live under, and the bodies
                that watch over their rights. Then, in short, the need and the aid: the crises under way, who has been forced from home
                and who goes hungry. Each figure with its source and its year.
              </p>
              <p className="text-[11px] font-sans mt-2" style={{ color: muted }}>
                V-Dem · the UN's and the regions' human rights bodies · UN OCHA · OECD · UNHCR · FAO · WHO · figures retrieved {WORLDVIEW_RETRIEVED}
              </p>
            </div>
            {autocratic > 0 && (
              <div className="lg:text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
                  People living under an autocracy · V-Dem · {WORLD.democracyShare.breakdownYear}
                </p>
                <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1" style={{ color: head }}>
                  {millions(autocratic)}
                </p>
                <p className="mt-2 text-[11px] font-sans max-w-sm lg:ml-auto" style={{ color: muted }}>
                  {((100 * autocratic) / classified).toFixed(1)}% of the people V-Dem classifies: its counts for electoral and closed autocracies, added together here
                  {closed ? `. ${millions(closed)} of them live in a closed autocracy, with no multiparty elections` : ""}.
                </p>
              </div>
            )}
          </div>
        </div>

        <SectionNav label="Human rights sections" sections={SECTIONS} />

        {/* ── Humanitarian headlines: the agencies' newsrooms and crisis desks ── */}
        <HeadlinesBanner
          label="Human rights and humanitarian headlines"
          topics={["humanitarian"]}
          subject={SUBJECT.humanitarian}
          days={7}
          note={(outlets) => (
            <>
              The last week's human rights and humanitarian news from aid agencies' own newsrooms and the outlets that cover crises -{" "}
              {outlets}, five at most from each - refreshed every half hour. The tag is the place a story is about, violet for more than
              one. Each links to its source.
            </>
          )}
        />

        {/* ══ Human rights ══ */}
        <section id="rights" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="rights-title">
          <SectionHead
            icon={<Scales size={18} weight="fill" />}
            color={TONE.rights}
            title="Human rights"
            kicker="How far people are free from the state's violence, and free to speak, to organise and to live as they choose"
          />
          <h2 id="rights-title" className="sr-only">
            Human rights
          </h2>
          <StatCategoryCard wide c={CATEGORY.rights} />
          <div id="liberties" className="scroll-mt-36 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Civil liberties and their three parts" kicker={`Index, 0 to 1 · V-Dem · ${span("civilLiberties")}`} />
              <IndexChart
                label="Civil liberties and their three parts"
                lines={[
                  ["civilLiberties", "Civil liberties", "#3b82f6"],
                  ["physicalIntegrity", "Freedom from torture and political killing", "#ef4444"],
                  ["privateLiberties", "Private liberties", "#10b981"],
                  ["politicalLiberties", "Political liberties", "#f59e0b"],
                ]}
              />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.civilLiberties.note} The indices are V-Dem's expert ratings, not counts of violations.
              </p>
              <SourceLink sources={[WORLD.civilLiberties.source, WORLD.physicalIntegrity.source, WORLD.privateLiberties.source, WORLD.politicalLiberties.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Free to speak, to organise and to study" kicker={`Index, 0 to 1 · V-Dem · ${span("freeExpression")}`} />
              <IndexChart
                label="Freedom of expression, of association and academic freedom"
                lines={[
                  ["freeExpression", "Freedom of expression", "#8b5cf6"],
                  ["freeAssociation", "Freedom of association", "#06b6d4"],
                  ["academicFreedom", "Academic freedom", "#ec4899"],
                ]}
              />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.freeExpression.note}
              </p>
              <SourceLink sources={[WORLD.freeExpression.source, WORLD.freeAssociation.source, WORLD.academicFreedom.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Women's liberties and the law" kicker={`Index, 0 to 1 · V-Dem · ${span("womenCivilLiberties")}`} />
              <IndexChart
                label="Women's civil liberties, equality before the law and the rule of law"
                lines={[
                  ["womenCivilLiberties", "Women's civil liberties", "#d946ef"],
                  ["equalityBeforeLaw", "Equality before the law", "#14b8a6"],
                  ["ruleOfLaw", "Rule of law", "#6366f1"],
                ]}
              />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.womenCivilLiberties.note}
              </p>
              <SourceLink sources={[WORLD.womenCivilLiberties.source, WORLD.equalityBeforeLaw.source, WORLD.ruleOfLaw.source]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="The checks on those who govern" kicker={`Index, 0 to 1 · V-Dem · ${span("judicialConstraints")}`} />
              <IndexChart
                label="How far the courts and the legislature check the executive"
                lines={[
                  ["judicialConstraints", "Courts' check on the executive", "#f97316"],
                  ["legislativeConstraints", "Legislature's check on the executive", "#0ea5e9"],
                ]}
              />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.judicialConstraints.note}
              </p>
              <SourceLink sources={[WORLD.judicialConstraints.source, WORLD.legislativeConstraints.source]} className="mt-3" />
            </Card>
          </div>
          <div id="government" className="scroll-mt-36">
            {regimeRows.length > 0 && (
              <Card>
                <CardHead title="Who lives under what kind of government" kicker={`People · V-Dem Regimes of the World · ${WORLD.democracyShare.breakdownYear}`} />
                <BarList wide label="The world's people by the kind of government they live under" rows={regimeRows} />
                <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                  {WORLD.democracyShare.note}
                </p>
                <SourceLink sources={[WORLD.democracyShare.source]} className="mt-3" />
              </Card>
            )}
          </div>
          <div id="bodies" className="scroll-mt-36">
          <Card>
            <CardHead title="The bodies that watch over human rights" kicker={`States, as each body counts its own · checked ${HUMAN_RIGHTS_CHECKED}`} />
            <div className="flex flex-col">
              {RIGHTS_BODIES.map((b, i) => (
                <article key={b.id} className={`flex flex-col gap-3 min-w-0 ${i > 0 ? "pt-5 mt-5" : ""}`} style={i > 0 ? { borderTop: `1px solid ${look.track}` } : undefined}>
                  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-sans font-bold leading-snug" style={{ color: head }}>
                        {b.name}
                      </h4>
                      <p className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: muted }}>
                        {[b.founded ? `Since ${b.founded}` : null, b.headquarters].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="text-2xl font-bold font-mono leading-none" style={{ color: head }}>
                      {b.memberCount}
                      <span className="text-[11px] font-sans font-normal ml-2" style={{ color: muted }}>
                        states
                      </span>
                    </p>
                  </div>
                  {b.what && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: TONE.rights }}>
                        Mission
                      </p>
                      <p className="text-[12px] font-sans leading-relaxed max-w-4xl" style={{ color: head }}>
                        {b.what}
                      </p>
                    </div>
                  )}
                  {b.agenda && b.agenda.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: TONE.rights }}>
                        How it works
                      </p>
                      <ul className="flex flex-col gap-1 list-disc pl-4 max-w-4xl">
                        {b.agenda.map((line) => (
                          <li key={line} className="text-[11px] font-sans leading-relaxed" style={{ color: head }}>
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {b.impact && b.impact.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: TONE.rights }}>
                        Impact
                      </p>
                      <ul className="flex flex-col gap-1 list-disc pl-4 max-w-4xl">
                        {b.impact.map((line) => (
                          <li key={line} className="text-[11px] font-sans leading-relaxed" style={{ color: head }}>
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {b.note && (
                    <p className="text-[10px] font-sans leading-relaxed max-w-4xl" style={{ color: muted }}>
                      {b.note}
                    </p>
                  )}
                  <SourceLink sources={[b.source]} />
                </article>
              ))}
            </div>
          </Card>
          </div>
        </section>

        {/* ══ Humanitarian: the short section. The crises under way and a card for each kind of figure; the long
            sections the page was made of are folded away under it. ══ */}
        <section id="humanitarian" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="humanitarian-title">
          <SectionHead icon={<HandHeart size={18} weight="fill" />} color={TONE.overview} title="Humanitarian need and aid" kicker="In short: the crises under way, and a card for each kind of figure" />
          <h2 id="humanitarian-title" className="sr-only">
            Humanitarian need and aid
          </h2>

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

          {/* As many to a row as there is room for, each growing to fill it, so five cards leave no gap in the last row. */}
          <div className="flex flex-wrap gap-4">
            {[CATEGORY.aid, CATEGORY.conflict, CATEGORY.displacement, CATEGORY.food, CATEGORY.health].map((c) => (
              <div key={c.key} className="flex-[1_1_17rem] min-w-0">
                <StatCategoryCard c={c} lead={4} />
              </div>
            ))}
          </div>

          <FullFold title="The humanitarian figures in full · aid, conflict and disaster, displacement, food, health">
        {/* ══ Aid & donors ══ */}
        <section id="aid" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="aid-title">
          <SectionHead icon={<HandHeart size={18} weight="fill" />} color={TONE.aid} title="Aid & donors" kicker="What is asked for, what is given, and by whom" />
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

        {/* ══ Conflict & disaster ══ */}

        <section id="conflict" className="scroll-mt-36 flex flex-col gap-6" aria-labelledby="conflict-title">
          <SectionHead icon={<Warning size={18} weight="fill" />} color="#ef4444" title="Conflict & disaster" kicker="What drives people from home and into need: wars, and floods, storms and earthquakes" />
          <h2 id="conflict-title" className="sr-only">
            Conflict and disaster
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Armed conflicts, year by year" kicker={`Conflicts involving a state · Uppsala Conflict Data Program · ${span("conflicts")}`} />
              <TrendChart
                id="conflicts"
                name="State-based armed conflicts"
                unit={(v) => `${v} conflicts`}
                color="#8b5cf6"
                height={210}
                named={(year) => {
                  const y = STATE_FIGHTING_BY_PLACE.find((p) => p.year === year);
                  return y?.top[0] ? `deadliest in ${y.top[0][0]}, ${whole(y.top[0][1])}` : undefined;
                }}
              />
              <PlacesByYear
                title="Where the fighting was deadliest, year by year"
                label="The countries where fighting involving a state killed most, year by year"
                rows={STATE_FIGHTING_BY_PLACE}
                unit="deaths"
                color="#8b5cf6"
                beside={(year) => {
                  const n = conflictCount.get(year);
                  return n != null ? `${n} conflicts` : undefined;
                }}
                note="Deaths in fighting in which a state is a party - within a state or between states - by the Uppsala programme's best estimate, counted in the country where they took place. The count of conflicts is the world's for the year; the programme does not give it here country by country, so the list shows where those conflicts killed most."
              />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2.5" style={{ color: muted }}>
                By kind · {WORLD.conflicts.breakdownYear}
              </p>
              <BarList wide label="Armed conflicts by kind" rows={partsOf("conflicts", (v) => String(v))} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.conflicts.note} The kinds marked "counted apart" are ones the programme counts separately from those {lastOf(WORLD.conflicts.series)[1]}.
              </p>
              <SourceLink sources={[WORLD.conflicts.source, NAMED_EVENTS_SOURCES.ucdp]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Deaths in armed conflicts" kicker={`Deaths a year · Uppsala Conflict Data Program · ${span("conflictDeaths")}`} />
              <TrendChart
                id="conflictDeaths"
                name="Deaths in armed conflicts"
                unit={(v) => `${whole(v)} deaths`}
                color="#ef4444"
                height={210}
                tick={thousands}
                named={(year) => {
                  const y = CONFLICT_DEATHS_BY_PLACE.find((p) => p.year === year);
                  return y?.top[0] ? `most in ${y.top[0][0]}, ${whole(y.top[0][1])}` : undefined;
                }}
              />
              <PlacesByYear
                title="Where most died, year by year"
                label="The countries where most died in armed conflict, year by year"
                rows={CONFLICT_DEATHS_BY_PLACE}
                unit="deaths"
                color="#ef4444"
                note="The Uppsala programme's best estimate of deaths in fighting involving a state, fighting between non-state groups and violence against civilians together, counted in the country where they took place. The programme records deaths by country and by conflict; this list names the country, not the war."
              />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2.5" style={{ color: muted }}>
                By kind of violence · {WORLD.conflictDeaths.breakdownYear}
              </p>
              <BarList wide label="Deaths in armed conflicts by kind of violence" rows={partsOf("conflictDeaths", whole)} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.conflictDeaths.note}
              </p>
              <SourceLink sources={[WORLD.conflictDeaths.source, NAMED_EVENTS_SOURCES.ucdp]} className="mt-3" />
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHead title="Deaths in natural disasters" kicker={`Dead and missing a year · EM-DAT · ${span("disasterDeaths")}`} />
              <TrendChart
                id="disasterDeaths"
                name="Dead and missing in natural disasters"
                unit={(v) => whole(v)}
                color="#f59e0b"
                height={210}
                tick={thousands}
                named={(year) => {
                  const e = DEADLIEST_DISASTERS.find((d) => d.year === year);
                  return e ? `deadliest: ${e.name}, ${e.deaths}` : undefined;
                }}
              />
              <NamedDisasters />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-4 mb-2.5" style={{ color: muted }}>
                By kind of disaster · {WORLD.disasterDeaths.breakdownYear}
              </p>
              <BarList wide label="Deaths in natural disasters by kind" rows={partsOf("disasterDeaths", whole).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))} />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                EM-DAT counts confirmed deaths and missing people in disasters that overwhelm local capacity. The toll swings from year to year with single great events.
                {noDisasterDeaths.length > 0 && ` For ${WORLD.disasterDeaths.breakdownYear} it records no deaths from ${noDisasterDeaths.join(" or ")}.`}
              </p>
              <SourceLink sources={[WORLD.disasterDeaths.source, NAMED_EVENTS_SOURCES.list, NAMED_EVENTS_SOURCES.noaa]} className="mt-3" />
            </Card>
            <Card>
              <CardHead title="Displaced by disasters" kicker={`New displacements a year · IDMC, via the World Bank · ${span("disasterDisplacement")}`} />
              <TrendChart
                id="disasterDisplacement"
                name="New displacements by disasters"
                unit={(v) => millions(v)}
                color="#06b6d4"
                height={210}
                tick={(v) => (v === 0 ? "0" : `${Math.round(v / 1e6)}M`)}
                named={(year) => {
                  const y = DISASTER_DISPLACEMENT_BY_PLACE.find((p) => p.year === year);
                  return y?.top[0] ? `most in ${y.top[0][0]}, ${millions(y.top[0][1])}` : undefined;
                }}
              />
              <PlacesByYear
                title="Where disasters displaced most, year by year"
                label="The countries where disasters displaced most people, year by year"
                rows={DISASTER_DISPLACEMENT_BY_PLACE}
                unit="displacements"
                color="#06b6d4"
                fmt={millions}
                note="New displacements by disasters within each country, the Internal Displacement Monitoring Centre's figures as the World Bank carries them. They are movements, not people, and the list names the country, not the flood, storm or earthquake: the Centre's records of single events are not in the World Bank's table."
              />
              <p className="text-[10px] font-sans leading-relaxed mt-3" style={{ color: muted }}>
                {WORLD.disasterDisplacement.note} These are movements, not people: someone displaced twice in a year is counted twice. The figures of the Displacement section below count people displaced by
                conflict and persecution, and are a different measure.
              </p>
              <SourceLink sources={[WORLD.disasterDisplacement.source, NAMED_EVENTS_SOURCES.idmc]} className="mt-3" />
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
          </FullFold>
        </section>


        <p className="text-[10px] font-sans leading-relaxed max-w-4xl px-1" style={{ color: muted }}>
          Two kinds of figure are on this page. Built from source and refreshed with it ({WORLDVIEW_RETRIEVED}): aid by donor (OECD),
          the rights indices and who lives under which kind of government (V-Dem, expert ratings from 0 to 1 averaged across the world's
          people), the displaced and their make-up year by year (UNHCR), undernourishment, food insecurity and stunting (FAO, UNICEF and
          the WHO), child and maternal mortality (the UN's estimates), water and sanitation (WHO/UNICEF), each country's child mortality
          and water access (World Bank), armed conflicts and the deaths in them (Uppsala Conflict Data Program), deaths in natural
          disasters (EM-DAT), displacement by disasters (IDMC), and extreme poverty, HIV, hand washing and life expectancy (World Bank).
          Recorded from the bodies' own pages and reports, for the year or day shown on each: the human rights bodies and their members
          (checked {HUMAN_RIGHTS_CHECKED}), people in need by crisis and appeals
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
