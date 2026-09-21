import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { PRISON_RATES } from "../data/prisonRates";
import { STATE_INDICATORS as STATE_FIGURES } from "../data/stateIndicators";
import { COUNTRY_PANELS } from "../data/countryPanels";
import {
  Globe,
  Buildings,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  ChartBar,
  SortAscending,
  SortDescending,
  Star,
  CaretDown,
  CaretUp,
  X,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { CollapsibleFilters } from "../components/CollapsibleFilters";

// ─── Metric definitions ──────────────────────────────────────────────────────

type MetricId =
  | "composite"
  | "hdi"
  | "gdpPerCapita"
  | "gdpGrowth"
  | "unemployment"
  | "lifeExpectancy"
  | "inflation"
  | "incarceration"
  | "homelessness"
  | "tradeBalance";

/**
 * Categories are restricted to metrics held for every entity, country and US
 * state alike, so no column can render N/A.
 *
 * Measured coverage over the 204 countries and 50 states:
 *   hdi, gdpPerCapita, unemployment                     — complete
 *   incarceration      — all states; 187 countries (World Prison Brief, dated,
 *                        nothing over ten years old; WPB publishes no UK or
 *                        Bosnia total)
 *   lifeExpectancy, gdpGrowth, inflation, tradeBalance — countries only
 *   educationRank, healthcareRank, crimeIndex, homelessness — none: these
 *     were unsourced state composites and are blanked in statesData, which
 *     retired the Housing and Education tabs; HDI likewise covers countries
 *     only (states used a "quality of living" score in its place)
 *
 * Homelessness was "complete" for countries only because a rate had been
 * written in for every one. There is no international series behind such a
 * table - national definitions differ too much to compare - so the country
 * figures were removed and Housing now ranks US states.
 *
 * easeOfBusiness was removed. It was the World Bank's Doing Business rank,
 * typed in by hand for 29 countries with no source or year, and wrong where it
 * could be checked: the United States at 55th when Doing Business 2020 put it
 * 6th, Egypt at 93rd against 114th. The World Bank discontinued the index in
 * September 2021 after an external review found data irregularities in the
 * 2018 and 2020 editions, so there is no current series to correct it from.
 * It carried no composite weight, so no score moved.
 *
 * That retired four tabs. Life Exp. and Transport ranked countries against
 * states on data only one of them has, and Transport's primary metric was
 * missing for 86% of countries; Education and Crime were US-state-only, which
 * is how their leaderboards came to list countries showing "N/A" as the best
 * in the world.
 */
type CategoryTab =
  | "economy"
  | "hdi"
  | "housing"
  | "justice"
  | "health"
  | "education"
  | "infrastructure";

/**
 * Which pool a category can rank.
 *
 * Life expectancy exists for all 204 countries and no state; education rank
 * exists for all 50 states and no country. Rather than drop those subjects or
 * show half a table as N/A, a category declares the pool it applies to and
 * selecting it switches the entity filter to match. Every column stays
 * populated, and the page says which pool is being ranked.
 */
type CategoryPool = "all" | "country" | "state";

interface CategoryMetric {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
  color: string;
  accessor: (row: RankRow) => number;
}

interface MetricDef {
  id: MetricId;
  label: string;
  shortLabel: string;
  description: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
  color: string;
  weight: number;
}

const CATEGORY_TABS: {
  id: CategoryTab;
  label: string;
  icon: string;
  pool: CategoryPool;
}[] = [
  { id: "economy", label: "Economy", icon: "💹", pool: "all" },
  { id: "hdi", label: "Development", icon: "🌐", pool: "country" },
  { id: "justice", label: "Justice", icon: "⚖️", pool: "all" },
  { id: "health", label: "Health", icon: "❤️", pool: "country" },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: "🏗️",
    pool: "country",
  },
];

const M_GDP_PER_CAPITA: CategoryMetric = {
  id: "gdpPerCapita",
  label: "GDP per Capita",
  shortLabel: "GDP/cap",
  description: "Gross domestic product per person (USD)",
  higherIsBetter: true,
  format: (v) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
  color: "text-emerald-400",
  accessor: (r) => r.gdpPerCapita,
};

const M_UNEMPLOYMENT: CategoryMetric = {
  id: "unemployment",
  label: "Unemployment",
  shortLabel: "Unemploy.",
  description: "Share of the labour force out of work (%)",
  higherIsBetter: false,
  format: (v) => `${v.toFixed(1)}%`,
  color: "text-orange-400",
  accessor: (r) => r.unemployment,
};

const M_HDI: CategoryMetric = {
  id: "hdi",
  label: "HDI",
  shortLabel: "HDI",
  description: "UNDP composite of health, education and income (0–1)",
  higherIsBetter: true,
  format: (v) => v.toFixed(3),
  color: "text-violet-400",
  accessor: (r) => r.hdi,
};

const M_HOMELESSNESS: CategoryMetric = {
  id: "homelessness",
  label: "Homelessness Rate",
  shortLabel: "Homeless.",
  description: "Homeless persons per 100,000 residents",
  higherIsBetter: false,
  format: (v) => `${v.toFixed(0)}/100k`,
  color: "text-purple-400",
  accessor: (r) => r.homelessness,
};

const M_INCARCERATION: CategoryMetric = {
  id: "incarceration",
  label: "Incarceration Rate",
  shortLabel: "Incarcerat.",
  description: "Prison population per 100,000 residents",
  higherIsBetter: false,
  format: (v) => `${v.toFixed(0)}/100k`,
  color: "text-red-400",
  accessor: (r) => r.incarceration,
};

const M_SCORE: CategoryMetric = {
  id: "composite",
  label: "Score",
  shortLabel: "Score",
  description: "Overall composite score",
  higherIsBetter: true,
  format: (v) => v.toFixed(1),
  color: "text-yellow-400",
  accessor: (r) => r.composite,
};

/** Countries only — every country has it, no state does. */
const M_LIFE_EXPECTANCY: CategoryMetric = {
  id: "lifeExpectancy",
  label: "Life Expectancy",
  shortLabel: "Life Exp.",
  description: "Average years a newborn is expected to live",
  higherIsBetter: true,
  format: (v) => `${v.toFixed(1)} yrs`,
  color: "text-blue-400",
  accessor: (r) => r.lifeExpectancy,
};

/** US states only — a rank among the fifty, so it has no country analogue. */
const M_EDUCATION_RANK: CategoryMetric = {
  id: "educationRank",
  label: "Education Rank",
  shortLabel: "Edu. Rank",
  description: "Education quality rank among US states (lower = better)",
  higherIsBetter: false,
  format: (v) => `${Math.round(v)}`,
  color: "text-sky-400",
  accessor: (r) => r.educationRank,
};

/** US states only, on the same 1–50 scale as the education rank. */
const M_HEALTHCARE_RANK: CategoryMetric = {
  id: "healthcareRank",
  label: "Healthcare Rank",
  shortLabel: "Health Rank",
  description: "Healthcare system rank among US states (lower = better)",
  higherIsBetter: false,
  format: (v) => `${Math.round(v)}`,
  color: "text-rose-400",
  accessor: (r) => r.healthcareRank,
};

/**
 * Countries only. This is the dataset's one infrastructure signal — there is
 * no roads, rail, broadband or utilities measure for either pool — so the
 * category is built on generation capacity and labelled as energy output
 * rather than implying a broader infrastructure index.
 */
const M_ENERGY_OUTPUT: CategoryMetric = {
  id: "energyOutputTWh",
  label: "Energy Output",
  shortLabel: "Energy",
  description: "Annual primary energy production (TWh)",
  higherIsBetter: true,
  format: (v) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k TWh` : `${v.toFixed(0)} TWh`,
  color: "text-yellow-400",
  accessor: (r) => r.energyOutputTWh,
};

const M_SELF_SUFFICIENCY: CategoryMetric = {
  id: "energySelfSufficiency",
  label: "Energy Self-Sufficiency",
  shortLabel: "Self-Suff.",
  description:
    "Production as a share of consumption — over 100% is a net exporter",
  higherIsBetter: true,
  format: (v) => `${v.toFixed(0)}%`,
  color: "text-teal-400",
  accessor: (r) => r.energySelfSufficiency,
};

const CATEGORY_METRICS: Record<CategoryTab, CategoryMetric[]> = {
  economy: [M_GDP_PER_CAPITA, M_UNEMPLOYMENT, M_SCORE],
  hdi: [M_HDI, M_GDP_PER_CAPITA, M_SCORE],
  housing: [M_HOMELESSNESS, M_UNEMPLOYMENT, M_GDP_PER_CAPITA, M_SCORE],
  justice: [M_INCARCERATION, M_SCORE],
  health: [M_LIFE_EXPECTANCY, M_HDI, M_GDP_PER_CAPITA, M_SCORE],
  education: [M_EDUCATION_RANK, M_HEALTHCARE_RANK, M_GDP_PER_CAPITA, M_SCORE],
  infrastructure: [
    M_ENERGY_OUTPUT,
    M_SELF_SUFFICIENCY,
    M_GDP_PER_CAPITA,
    M_SCORE,
  ],
};

const METRICS: MetricDef[] = [
  {
    id: "composite",
    label: "Composite Score",
    shortLabel: "Score",
    description: "Weighted composite of all 9 indexes",
    higherIsBetter: true,
    format: (v) => v.toFixed(1),
    color: "text-yellow-400",
    weight: 0,
  },
  {
    id: "hdi",
    label: "Human Development Index",
    shortLabel: "HDI",
    description:
      "UNDP composite of life expectancy, education, and income (0–1)",
    higherIsBetter: true,
    format: (v) => v.toFixed(3),
    color: "text-rose-400",
    weight: 3,
  },
  {
    id: "gdpPerCapita",
    label: "GDP per Capita",
    shortLabel: "GDP/cap",
    description: "Gross domestic product per person (USD)",
    higherIsBetter: true,
    format: (v) =>
      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
    color: "text-emerald-400",
    weight: 2.5,
  },
  {
    id: "gdpGrowth",
    label: "GDP Growth Rate",
    shortLabel: "Growth",
    description: "Year-on-year real GDP growth (%)",
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
    color: "text-teal-400",
    weight: 1.5,
  },
  {
    id: "unemployment",
    label: "Unemployment Rate",
    shortLabel: "Unemploy.",
    description: "Share of labor force unemployed (%)",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(1)}%`,
    color: "text-orange-400",
    weight: 1.5,
  },
  {
    id: "lifeExpectancy",
    label: "Life Expectancy",
    shortLabel: "Life Exp.",
    description: "Average years a newborn is expected to live",
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)} yrs`,
    color: "text-blue-400",
    weight: 2,
  },
  {
    id: "inflation",
    label: "Inflation Rate",
    shortLabel: "Inflation",
    description: "Annual consumer price index change (%)",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(1)}%`,
    color: "text-amber-400",
    weight: 1,
  },
  {
    id: "incarceration",
    label: "Incarceration Rate",
    shortLabel: "Incarcerat.",
    description: "Prison population per 100,000 residents",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(0)}/100k`,
    color: "text-red-400",
    weight: 1.5,
  },
  {
    id: "homelessness",
    label: "Homelessness Rate",
    shortLabel: "Homeless.",
    description: "Homeless persons per 100,000 residents",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(0)}/100k`,
    color: "text-purple-400",
    weight: 1,
  },
  {
    id: "tradeBalance",
    label: "Trade Balance",
    shortLabel: "Trade Bal.",
    description: "Exports minus imports (positive = surplus)",
    higherIsBetter: true,
    format: (v) => {
      const s = Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(0);
      return v >= 0 ? `+${s}` : s;
    },
    color: "text-cyan-400",
    weight: 1,
  },
];


interface RankRow {
  id: string;
  name: string;
  type: "country" | "state";
  flag: string;
  hdi: number;
  gdpPerCapita: number;
  gdpGrowth: number;
  unemployment: number;
  lifeExpectancy: number;
  inflation: number;
  incarceration: number;
  homelessness: number;
  tradeBalance: number;
  composite: number;
  educationRank: number;
  healthcareRank: number;
  crimeIndex: number;
  /**
   * The measures the dashboard's compare card carries that the ranking never
   * did. They are here to be compared, not ranked: none is in METRICS, so
   * none is a sort key, a category tab or a composite input. Size measures
   * especially — a country is not better for being large or populous, and
   * ranking on them would say it was.
   */
  population: number;
  /** Total GDP, billions USD. */
  gdpTotal: number;
  areaKm2: number;
  /**
   * Held for both kinds. Median age is the only one of these the two sides
   * publish on the same basis, so it compares directly.
   */
  medianAge: number;
  /**
   * Share of the population aged 65 and over, also held for both on the same
   * definition: the World Bank's SP.POP.65UP.TO.ZS for countries, the Census
   * Bureau's age groups for states.
   */
  age65Pct: number;
  /** Countries only, from countryPanels.ts (World Bank, UN, Transparency Intl). */
  urbanPct: number;
  internetPct: number;
  gini: number;
  cpiScore: number;
  physicians: number;
  maternalMortality: number;
  electricityAccess: number;
  parliamentFemale: number;
  /** US states only; countries have no equivalent series here. */
  medianIncome: number;
  povertyPct: number;
  medianHomeValue: number;
  medianRent: number;
  homeOwnershipPct: number;
  rentBurdenPct: number;
  meanCommuteMin: number;
  workFromHomePct: number;
  transitPct: number;
  walkBikePct: number;
  vehiclePct: number;
  vacancyPct: number;
  highSchoolPct: number;
  averageIncome: number;
  stateTaxRate: number;
  salesTaxRate: number;
  minimumWage: number;
  bachelorsPct: number;
  /** Annual electricity/primary energy output, TWh. Countries only. */
  energyOutputTWh: number;
  /** Production as a share of consumption, %. Over 100 = net exporter. */
  energySelfSufficiency: number;
}

function buildCountryRows(): RankRow[] {
  return countriesData.map((c) => {
    const p = COUNTRY_PANELS[c.id];
    return {
      id: `country-${c.id}`,
      name: c.name,
      type: "country",
      flag: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`,
      hdi: c.humanDevelopmentIndex,
      gdpPerCapita: c.gdpPerCapita,
      gdpGrowth: c.gdpGrowth,
      unemployment: c.unemploymentRate,
      lifeExpectancy: c.lifeExpectancy,
      inflation: c.inflationRate,
      // World Prison Brief, dated; missing where WPB has no national rate.
      incarceration: PRISON_RATES[c.id]?.v ?? NaN,
      homelessness: NaN,
      tradeBalance: c.tradeBalance,
      // Not tracked per country in this dataset. These were 0, and because
      // education and crime rank ascending ("lower is better"), every country
      // tied at 0 and the Crime and Education leaderboards presented missing
      // data as the best in the world.
      educationRank: NaN,
      healthcareRank: NaN,
      crimeIndex: NaN,
      population: c.population,
      gdpTotal: c.gdp,
      areaKm2: c.areaKm2,
      // Already built and sourced in countryPanels.ts — World Bank indicators,
      // the UN's population prospects and Transparency International's CPI,
      // each figure carrying the year it is for. Nothing new is asserted here;
      // these were simply not being offered for comparison.
      medianAge: p?.medianAge?.v ?? NaN,
      age65Pct: p?.age65up?.v ?? NaN,
      urbanPct: p?.urbanPct?.v ?? NaN,
      internetPct: p?.internetPct?.v ?? NaN,
      gini: p?.gini?.v ?? NaN,
      cpiScore: p?.cpiScore?.v ?? NaN,
      physicians: p?.physicians?.v ?? NaN,
      maternalMortality: p?.maternalMortality?.v ?? NaN,
      electricityAccess: p?.electricityAccess?.v ?? NaN,
      parliamentFemale: p?.parliamentFemale?.v ?? NaN,
      // State fiscal, housing, commute and education series with no
      // country-level equivalent in this dataset. Left unavailable rather
      // than approximated.
      medianIncome: NaN,
      povertyPct: NaN,
      medianHomeValue: NaN,
      medianRent: NaN,
      homeOwnershipPct: NaN,
      rentBurdenPct: NaN,
      meanCommuteMin: NaN,
      workFromHomePct: NaN,
      transitPct: NaN,
      walkBikePct: NaN,
      vehiclePct: NaN,
      vacancyPct: NaN,
      highSchoolPct: NaN,
      averageIncome: NaN,
      stateTaxRate: NaN,
      salesTaxRate: NaN,
      minimumWage: NaN,
      bachelorsPct: NaN,
      energyOutputTWh: c.energy?.totalProductionTWh ?? NaN,
      energySelfSufficiency:
        c.energy && c.energy.totalUseTWh > 0
          ? (c.energy.totalProductionTWh / c.energy.totalUseTWh) * 100
          : NaN,
    } as Omit<RankRow, "composite"> & { composite: 0 };
  }) as RankRow[];
}

function buildStateRows(): RankRow[] {
  return usStatesData.map((s) => {
    const gdpPerCap = s.gdp > 0 ? Math.round((s.gdp * 1e9) / s.population) : 0;
    const f = STATE_FIGURES[s.id];
    return {
      id: `state-${s.id}`,
      name: s.name,
      type: "state",
      // Each state's own flag. This was the US national flag for all fifty,
      // and was never rendered anyway — the table only drew an <img> for
      // countries. State ids are the lowercase two-letter codes flagcdn
      // expects, and all 50 were confirmed to resolve.
      flag: `https://flagcdn.com/w40/us-${s.id}.png`,
      // States have no HDI. This used an unsourced "quality of living" score
      // scaled to 0–1 as a stand-in, which ranked states against countries'
      // real UNDP figures on a different measure entirely.
      hdi: NaN,
      gdpPerCapita: gdpPerCap,
      // gdpGrowth, lifeExpectancy and inflation are not in statesData. They
      // were previously hardcoded to 2.4 / 78.5 / 3.2 for every state, which
      // put an identical invented number in the table for all fifty and fed
      // roughly a third of each state's composite. They are now marked
      // unavailable via UNAVAILABLE_METRICS and excluded from scoring.
      gdpGrowth: NaN,
      unemployment: s.unemploymentRate,
      lifeExpectancy: NaN,
      inflation: NaN,
      // BJS 2023 imprisonment rate (statesData, from build-states.cjs).
      incarceration: s.incarcerationRate,
      // HUD's counts could not be fetched; see build-states.cjs.
      homelessness: NaN,
      tradeBalance: NaN,
      educationRank: s.educationRank ?? NaN,
      healthcareRank: s.healthcareRank ?? NaN,
      crimeIndex: s.crimeIndex ?? NaN,
      population: s.population,
      gdpTotal: s.gdp,
      areaKm2: s.areaKm2,
      // From stateIndicators.ts (build-states.cjs): Census ACS for age,
      // income, poverty, housing, commuting and schooling.
      medianAge: f?.medianAge.v ?? NaN,
      age65Pct: f?.ageGroups.groups.find((g) => g.group === "65+")?.pct ?? NaN,
      // Countries have these from the World Bank; states do not, and the ACS
      // publishes nothing equivalent, so they stay unavailable.
      urbanPct: NaN,
      internetPct: NaN,
      gini: NaN,
      cpiScore: NaN,
      physicians: NaN,
      maternalMortality: NaN,
      electricityAccess: NaN,
      parliamentFemale: NaN,
      povertyPct:
        f?.poverty.groups.find((g) => g.label === "Below poverty line")?.pct ??
        NaN,
      medianHomeValue: f?.housing.medianHomeValue ?? NaN,
      medianRent: f?.housing.medianRent ?? NaN,
      homeOwnershipPct: f?.housing.homeOwnershipPct ?? NaN,
      rentBurdenPct: f?.housing.rentBurdenPct ?? NaN,
      meanCommuteMin: f?.commute.meanCommuteMin ?? NaN,
      workFromHomePct: f?.commute.workFromHomePct ?? NaN,
      transitPct: f?.commute.transitPct ?? NaN,
      walkBikePct: f?.commute.walkBikePct ?? NaN,
      vehiclePct: f?.commute.householdsWithVehiclePct ?? NaN,
      vacancyPct: f?.housing.vacancyPct ?? NaN,
      highSchoolPct: f?.education.highSchoolOrHigherPct ?? NaN,
      medianIncome: s.medianIncome,
      averageIncome: s.averageIncome,
      stateTaxRate: s.stateTaxRate,
      salesTaxRate: s.salesTaxRate,
      // 0 means the state follows the federal floor rather than setting one,
      // which is a real answer, not a gap.
      minimumWage: s.minimumWage,
      bachelorsPct: STATE_FIGURES[s.id]?.education.bachelorsOrHigherPct ?? NaN,
      // statesData carries an energy mix as percentages only, with no absolute
      // output, so there is nothing comparable to a country's TWh figure.
      energyOutputTWh: NaN,
      energySelfSufficiency: NaN,
    } as Omit<RankRow, "composite"> & { composite: 0 };
  }) as RankRow[];
}

/** A metric is unavailable for a row when its value is not a finite number. */
export function hasMetric(row: RankRow, id: keyof RankRow): boolean {
  const v = row[id];
  return typeof v === "number" && isFinite(v);
}

/**
 * Formats a metric value, rendering a missing one as N/A. Several of the
 * per-metric formatters call toFixed directly, which would print "NaN yrs".
 */
function fmtMetric(m: { format: (v: number) => string }, val: number): string {
  return isFinite(val) ? m.format(val) : "N/A";
}

function percentile(
  value: number,
  allValues: number[],
  higherIsBetter: boolean,
): number {
  const valid = allValues.filter((v) => isFinite(v));
  if (valid.length === 0 || !isFinite(value)) return 50;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max === min) return 50;
  const raw = ((value - min) / (max - min)) * 100;
  return higherIsBetter ? raw : 100 - raw;
}

/**
 * Scores a row over the metrics it actually has data for, renormalising the
 * weights across those metrics.
 *
 * Previously every metric was scored for every row, and rows without data
 * carried placeholder numbers — states got a constant 2.4% growth, 78.5 year
 * life expectancy, 3.2% inflation and a zero trade balance. Together those
 * carry 5.5 of the 15 total weight, so more than a third of each state's
 * composite came from invented figures. Skipping them means a state is
 * measured only on what is known about it, and compared on the same scale.
 */
function computeComposite(row: RankRow, allRows: RankRow[]): number {
  const weightedMetrics = METRICS.filter(
    (m) => m.id !== "composite" && m.weight > 0 && hasMetric(row, m.id),
  );
  const totalWeight = weightedMetrics.reduce((s, m) => s + m.weight, 0);
  if (totalWeight === 0) return 0;
  let score = 0;
  for (const m of weightedMetrics) {
    const allVals = allRows.map((r) => r[m.id] as number);
    const pct = percentile(row[m.id] as number, allVals, m.higherIsBetter);
    score += (pct * m.weight) / totalWeight;
  }
  return Math.round(score * 10) / 10;
}

// ─── Medal component ──────────────────────────────────────────────────────────
/** Colour for a podium position: 1 green, 2 amber, 3 red, then muted. */
function rankColor(rank: number): string {
  if (rank === 1) return "text-success";
  if (rank === 2) return "text-amber-400";
  if (rank === 3) return "text-destructive";
  return "text-muted-foreground";
}

function MedalCell({ rank }: { rank: number }) {
  return (
    <span
      className={`font-mono text-sm w-6 inline-block text-center ${rankColor(rank)} ${rank <= 3 ? "font-bold" : ""}`}
    >
      {rank}
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({
  value,
  allValues,
  higherIsBetter,
}: {
  value: number;
  allValues: number[];
  higherIsBetter: boolean;
  color?: string;
}) {
  // An empty track for a missing value. percentile() returns 50 for a
  // non-finite input, which would otherwise draw a half-full bar and read as
  // a middling score rather than as no data.
  if (!isFinite(value)) {
    return <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden" />;
  }
  const pct = percentile(value, allValues, higherIsBetter);
  const barColor =
    pct >= 66 ? "bg-success" : pct >= 33 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Flag for a row, country or state alike.
 *
 * Every site here previously drew an <img> only when the row was a country and
 * a generic building glyph for a state, so no US state ever showed a flag.
 * flagcdn serves state flags as us-<code>, and all fifty were verified to
 * resolve; the glyph is kept as the fallback if a request fails.
 */
function EntityFlag({
  row,
  imgClassName,
  iconSize,
  iconClassName = "text-muted-foreground",
}: {
  row: RankRow;
  imgClassName: string;
  iconSize: number;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <Buildings size={iconSize} weight="fill" className={iconClassName} />
    );
  }
  return (
    <img
      src={row.flag}
      alt=""
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Row Detail Panel ──────────────────────────────────────────────────────────
function RowDetailPanel({
  row,
  allValuesMap,
  rank,
  totalInPool,
  onClose,
  inCompare,
  compareFull,
  onToggleCompare,
}: {
  row: RankRow;
  allValuesMap: Partial<Record<string, number[]>>;
  rank: number;
  totalInPool: number;
  onClose: () => void;
  inCompare: boolean;
  compareFull: boolean;
  onToggleCompare: () => void;
}) {
  const topPercentile = Math.round((1 - (rank - 1) / totalInPool) * 100);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <EntityFlag
            row={row}
            imgClassName="w-12 h-8 rounded-md object-cover border border-border shadow-sm"
            iconSize={12}
          />
          <div>
            <h3 className="text-sm font-bold text-foreground">{row.name}</h3>
            <p className="text-[11px] text-muted-foreground">
              Rank #{rank} of {totalInPool} · Top {topPercentile}th percentile
            </p>
          </div>
          <div className="px-2.5 py-1 bg-yellow-500/15 rounded-lg">
            <span className="text-xs font-bold text-yellow-400">
              {row.composite.toFixed(1)}
            </span>
            <span className="text-[10px] text-yellow-400/70 ml-1">
              composite
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pinning from the row itself, so the comparison can be built while
              reading the table rather than only from the search at the top. */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            disabled={!inCompare && compareFull}
            title={
              !inCompare && compareFull
                ? `Remove one first — ${COMPARE_MAX} is the limit`
                : undefined
            }
            className={`px-2.5 py-1 rounded-lg text-[10px] font-sans border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              inCompare
                ? "border-border bg-muted text-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {inCompare ? "In comparison" : "Compare"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {/* The same strip the collapsed row carries, opened out: the figure
          above each bar and the measure's name below. */}
      <ProfileStrip row={row} allValuesMap={allValuesMap} />
      <p className="text-[9px] text-muted-foreground mt-2">
        Bar height is where this entity places among all those with the
        measure, not the value itself — so a short bar is a low placing, whether
        the measure counts up or down.
      </p>
    </div>
  );
}

// ─── Mobile Card Row ───────────────────────────────────────────────────────────
// ─── Profile strip ───────────────────────────────────────────────────────────
/**
 * An entity's whole profile as one row of standing bars, each one's height the
 * placing on that measure. The policy page carries the same strip on its rows,
 * where it summarises eight policy scores at a glance.
 *
 * Two sizes off one component. `bare` is what a collapsed row gets: bars only,
 * no figures or names, small enough to sit between the entity's name and its
 * score. Expanded, the same bars carry the figure above and the measure's name
 * below.
 *
 * The bar is the placing, never the value — a short bar means a low placing
 * whether the measure counts up (life expectancy) or down (unemployment), so
 * the strip reads the same way across all of them.
 */
function ProfileStrip({
  row,
  allValuesMap,
  bare = false,
}: {
  row: RankRow;
  allValuesMap: Partial<Record<string, number[]>>;
  bare?: boolean;
}) {
  const shown = METRICS.filter(
    (m) => m.id !== "composite" && hasMetric(row, m.id),
  );
  if (shown.length === 0) return null;

  return (
    <div
      className={
        bare
          ? "flex items-end gap-[3px]"
          : "flex items-end gap-1 overflow-x-auto pb-1"
      }
    >
      {shown.map((m) => {
        const val = row[m.id] as number;
        const allVals = allValuesMap[m.id] ?? [];
        const pct = percentile(val, allVals, m.higherIsBetter);
        const barColor =
          pct >= 66 ? "bg-success" : pct >= 33 ? "bg-amber-500" : "bg-destructive";
        const textColor =
          pct >= 66
            ? "text-success"
            : pct >= 33
              ? "text-amber-400"
              : "text-destructive";
        const title = `${m.label} — ${fmtMetric(m, val)}, ${pct.toFixed(0)}th percentile of ${allVals.filter((v) => isFinite(v)).length}`;

        if (bare) {
          return (
            <div
              key={m.id}
              title={title}
              className="w-[3px] h-5 bg-muted/60 rounded-full overflow-hidden flex items-end"
            >
              <div
                className={`w-full rounded-full ${barColor}`}
                style={{ height: `${Math.max(8, pct)}%` }}
              />
            </div>
          );
        }
        return (
          <div
            key={m.id}
            title={title}
            // Fixed narrow columns, not flex-1: an entity with three measures
            // would otherwise stretch three bars across the whole panel, which
            // reads as a chart of something rather than a profile.
            className="w-14 shrink-0 flex flex-col items-center gap-0.5"
          >
            <span
              className={`text-[10px] font-mono font-bold ${textColor} truncate max-w-full`}
            >
              {fmtMetric(m, val)}
            </span>
            <div className="w-1.5 h-10 bg-muted/60 rounded-full overflow-hidden flex items-end">
              <div
                className={`w-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ height: `${Math.max(4, pct)}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">
              {m.shortLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MobileCard({
  row,
  rank,
  activeMetrics,
  allValuesMap,
  isExpanded,
  onClick,
}: {
  row: RankRow;
  rank: number;
  activeMetrics: CategoryMetric[];
  allValuesMap: Partial<Record<string, number[]>>;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const primary =
    activeMetrics.find((m) => m.id !== "composite") ?? activeMetrics[0];
  const primaryVal = primary.accessor(row);
  const allPrimary = allValuesMap[primary.id] ?? [];
  const pct = percentile(primaryVal, allPrimary, primary.higherIsBetter);
  const barColor =
    pct >= 66 ? "bg-success" : pct >= 33 ? "bg-amber-500" : "bg-destructive";
  const textColor =
    pct >= 66
      ? "text-success"
      : pct >= 33
        ? "text-amber-400"
        : "text-destructive";

  return (
    <div
      className={`border-b border-border/50 cursor-pointer select-none transition-colors ${isExpanded ? "bg-muted/20" : "hover:bg-muted/20"}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Rank */}
        <div className="w-6 shrink-0 flex items-center justify-center">
          <MedalCell rank={rank} />
        </div>
        {/* Flag */}
        <div className="w-12 h-8 rounded overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
          <EntityFlag
            row={row}
            imgClassName="w-full h-full object-cover"
            iconSize={10}
          />
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {row.name}
          </p>
          <span
            className={`text-[9px] font-semibold uppercase tracking-wide ${row.type === "country" ? "text-blue-400" : "text-emerald-400"}`}
          >
            {row.type === "country" ? "Country" : "State"}
          </span>
        </div>
        {/* The whole profile at a glance, as on the policy rows. Not on a
            phone: the strip and the name cannot both have the width, and it
            was truncating "Luxembourg" to "Lu…" to make room. */}
        <div className="shrink-0 hidden sm:block">
          <ProfileStrip row={row} allValuesMap={allValuesMap} bare />
        </div>
        {/* Primary metric */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className={`text-xs font-mono font-bold ${textColor}`}>
            {fmtMetric(primary, primaryVal)}
          </span>
          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
        </div>
        {/* Score */}
        <div className="flex flex-col items-end gap-0.5 shrink-0 w-10">
          <span className="text-xs font-bold text-yellow-400 font-mono">
            {row.composite.toFixed(1)}
          </span>
          <span className="text-[9px] text-muted-foreground">score</span>
        </div>
        <div className="shrink-0 text-muted-foreground/40">
          {isExpanded ? <CaretUp size={10} /> : <CaretDown size={10} />}
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type EntityFilter = "all" | "country" | "state";
type ContinentFilter =
  | "all"
  | "North America"
  | "South America"
  | "Europe"
  | "Asia"
  | "Africa"
  | "Oceania";
type SortDir = "asc" | "desc";

// ─── Main page ────────────────────────────────────────────────────────────────
// ─── Comparison ──────────────────────────────────────────────────────────────
/**
 * The dashboard carries a compare card: pin up to four countries, or up to
 * four US states, and read their headline figures side by side. This is that
 * card's full form, and it does the three things the card cannot.
 *
 *  - Countries and states in one table. The card has a Countries tab and a
 *    States tab, so the two can never be set against each other; the ranking
 *    rows here are already one pool, so Norway and North Dakota line up in
 *    adjacent columns.
 *  - Every figure placed. The card marks whichever of the pinned few leads.
 *    Leading three pinned countries says nothing about whether that is a good
 *    figure, so each cell here carries its rank among all entities that
 *    publish the measure, and a bar for where it sits between the lowest and
 *    the highest.
 *  - The whole indicator set rather than the headline six, including the
 *    composite the rest of the page ranks on.
 *
 * Nothing is invented for a gap: an entity that does not publish a measure
 * gets "N/A" and no rank, and is skipped when the best of the set is marked.
 */
const COMPARE_MAX = 6;

/**
 * What the comparison shows, in reading order: the ranked indicators first,
 * then the measures the dashboard's compare card carries — size, income, tax,
 * schooling — which the ranking deliberately leaves alone.
 *
 * These extras are a separate list rather than additions to METRICS because
 * METRICS drives the sort menu, the category tabs and the composite. Ranking
 * on population or area would assert that bigger is better, and a state's tax
 * rate is not a score. They are worth putting side by side all the same, which
 * is what this page is for.
 */
interface CompareRow {
  id: keyof RankRow;
  label: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
  /** No better or worse direction — nothing is marked best on these. */
  neutral?: boolean;
}

const usd0 = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct1 = (v: number) => `${v.toFixed(1)}%`;

const COMPARE_EXTRAS: CompareRow[] = [
  {
    id: "gdpTotal",
    label: "GDP, total",
    higherIsBetter: true,
    format: (v) =>
      v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : `$${Math.round(v)}B`,
    neutral: true,
  },
  {
    id: "population",
    label: "Population",
    higherIsBetter: true,
    format: (v) =>
      v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`,
    neutral: true,
  },
  {
    id: "areaKm2",
    label: "Area",
    higherIsBetter: true,
    format: (v) =>
      v >= 1e6 ? `${(v / 1e6).toFixed(2)}M km²` : `${Math.round(v).toLocaleString()} km²`,
    neutral: true,
  },
  // Held on both sides, on the same basis, so it compares directly.
  {
    id: "medianAge",
    label: "Median age",
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)} yrs`,
    neutral: true,
  },
  {
    id: "age65Pct",
    label: "Aged 65 and over",
    higherIsBetter: true,
    format: pct1,
    neutral: true,
  },

  // Countries — from countryPanels.ts, each already sourced and dated.
  {
    id: "urbanPct",
    label: "Urban population",
    higherIsBetter: true,
    format: pct1,
    neutral: true,
  },
  { id: "internetPct", label: "Internet use", higherIsBetter: true, format: pct1 },
  {
    id: "gini",
    label: "Income inequality (Gini)",
    higherIsBetter: false,
    format: (v) => v.toFixed(1),
  },
  {
    id: "cpiScore",
    label: "Corruption Perceptions Index",
    higherIsBetter: true,
    format: (v) => `${Math.round(v)}/100`,
  },
  {
    id: "physicians",
    label: "Physicians per 1,000",
    higherIsBetter: true,
    format: (v) => v.toFixed(2),
  },
  {
    id: "maternalMortality",
    label: "Maternal deaths per 100,000 births",
    higherIsBetter: false,
    format: (v) => Math.round(v).toLocaleString(),
  },
  {
    id: "electricityAccess",
    label: "Electricity access",
    higherIsBetter: true,
    format: pct1,
  },
  {
    id: "parliamentFemale",
    label: "Women in parliament",
    higherIsBetter: true,
    format: pct1,
  },

  // US states — from stateIndicators.ts, Census ACS unless noted.
  { id: "medianIncome", label: "Median household income", higherIsBetter: true, format: usd0 },
  { id: "averageIncome", label: "Income per person", higherIsBetter: true, format: usd0 },
  { id: "povertyPct", label: "Below the poverty line", higherIsBetter: false, format: pct1 },
  {
    id: "medianHomeValue",
    label: "Median home value",
    higherIsBetter: true,
    format: usd0,
    neutral: true,
  },
  {
    id: "medianRent",
    label: "Median rent",
    higherIsBetter: false,
    format: (v) => `${usd0(v)}/mo`,
    neutral: true,
  },
  { id: "homeOwnershipPct", label: "Home ownership", higherIsBetter: true, format: pct1 },
  {
    id: "rentBurdenPct",
    label: "Renters paying over 30% of income",
    higherIsBetter: false,
    format: pct1,
  },
  {
    id: "meanCommuteMin",
    label: "Mean commute",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(1)} min`,
  },
  {
    id: "workFromHomePct",
    label: "Works from home",
    higherIsBetter: true,
    format: pct1,
    neutral: true,
  },
  {
    id: "transitPct",
    label: "Commutes by public transit",
    higherIsBetter: true,
    format: pct1,
    neutral: true,
  },
  {
    id: "walkBikePct",
    label: "Walks or cycles to work",
    higherIsBetter: true,
    format: pct1,
    neutral: true,
  },
  {
    id: "vehiclePct",
    label: "Households with a vehicle",
    higherIsBetter: true,
    format: pct1,
    neutral: true,
  },
  {
    id: "vacancyPct",
    label: "Housing vacancy rate",
    higherIsBetter: false,
    format: pct1,
    neutral: true,
  },
  {
    id: "highSchoolPct",
    label: "High school or higher",
    higherIsBetter: true,
    format: pct1,
  },
  {
    id: "stateTaxRate",
    label: "Top state income tax",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(1)}%`,
    neutral: true,
  },
  {
    id: "salesTaxRate",
    label: "Sales tax, with local",
    higherIsBetter: false,
    format: (v) => `${v.toFixed(2)}%`,
    neutral: true,
  },
  {
    id: "minimumWage",
    label: "Minimum wage",
    higherIsBetter: true,
    format: (v) => (v === 0 ? "federal $7.25" : `$${v.toFixed(2)}/hr`),
  },
  {
    id: "bachelorsPct",
    label: "Bachelor's degree or higher",
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)}%`,
  },
];

/** Every row the comparison table draws. */
const COMPARE_ROWS: CompareRow[] = [
  ...METRICS.map((m) => ({
    id: m.id as keyof RankRow,
    label: m.label,
    higherIsBetter: m.higherIsBetter,
    format: m.format,
  })),
  ...COMPARE_EXTRAS,
];

/** Rank of every entity on every metric, best = 1, over the rows that have it. */
function buildRankByMetric(rows: RankRow[]): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const m of COMPARE_ROWS) {
    const withData = rows.filter((r) => hasMetric(r, m.id));
    withData.sort((a, b) => {
      const av = a[m.id] as number;
      const bv = b[m.id] as number;
      return m.higherIsBetter ? bv - av : av - bv;
    });
    const ranks = new Map<string, number>();
    withData.forEach((r, i) => ranks.set(r.id, i + 1));
    out.set(m.id, ranks);
  }
  return out;
}

function ComparePicker({
  allRows,
  selectedIds,
  onAdd,
}: {
  allRows: RankRow[];
  selectedIds: string[];
  onAdd: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return allRows
      .filter(
        (r) =>
          r.name.toLowerCase().includes(needle) && !selectedIds.includes(r.id),
      )
      .slice(0, 8);
  }, [q, allRows, selectedIds]);

  const full = selectedIds.length >= COMPARE_MAX;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-border bg-transparent">
        <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={full}
          placeholder={full ? `${COMPARE_MAX} is the limit` : "Add a country or state…"}
          className="bg-transparent text-[11px] font-sans text-foreground placeholder:text-muted-foreground focus:outline-none w-44 disabled:cursor-not-allowed"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-40 mt-1 w-64 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          {matches.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onAdd(r.id);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <EntityFlag
                row={r}
                imgClassName="w-5 h-3.5 rounded-[2px] object-cover border border-border shrink-0"
                iconSize={9}
              />
              <span className="text-[11px] font-sans text-foreground truncate flex-1">
                {r.name}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground uppercase shrink-0">
                {r.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ComparisonPanel({
  selected,
  allRows,
  rankByMetric,
  selectedIds,
  onAdd,
  onRemove,
  onClear,
}: {
  selected: RankRow[];
  allRows: RankRow[];
  rankByMetric: Map<string, Map<string, number>>;
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold font-sans text-foreground">Compare</p>
          <p className="text-[11px] text-muted-foreground font-sans">
            Countries and US states together, each figure with its rank among
            the {allRows.length} entities that the page ranks.
          </p>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-sans text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Pinned entities */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-border">
        {selected.map((r) => (
          <span
            key={r.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 text-[11px] font-semibold font-sans text-foreground"
          >
            <EntityFlag
              row={r}
              imgClassName="w-4 h-3 rounded-[2px] object-cover border border-border shrink-0"
              iconSize={8}
            />
            <span className="truncate max-w-[9rem]">{r.name}</span>
            <button
              type="button"
              onClick={() => onRemove(r.id)}
              aria-label={`Remove ${r.name}`}
              className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={10} weight="bold" />
            </button>
          </span>
        ))}
        <ComparePicker allRows={allRows} selectedIds={selectedIds} onAdd={onAdd} />
      </div>

      {selected.length === 0 ? (
        <p className="px-4 py-6 text-[11px] font-sans text-muted-foreground">
          Nothing pinned. Search above, or open any row in the table below and
          add it from there.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[9px] font-sans uppercase tracking-widest text-muted-foreground font-medium px-4 py-2 sticky left-0 bg-card z-10">
                  Indicator
                </th>
                {selected.map((r) => (
                  <th key={r.id} className="px-3 py-2 min-w-[8.5rem]">
                    <span className="flex items-center gap-1.5">
                      <EntityFlag
                        row={r}
                        imgClassName="w-4 h-3 rounded-[2px] object-cover border border-border shrink-0"
                        iconSize={8}
                      />
                      <span className="text-[11px] font-semibold font-sans text-foreground truncate">
                        {r.name}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* A measure nobody in the pool publishes — homelessness, since
                  HUD's counts could not be fetched and there is no
                  comparable international series — would only ever be a
                  row of N/A, so it is not drawn. */}
              {COMPARE_ROWS.filter((m) => (rankByMetric.get(m.id)?.size ?? 0) > 0).map((m) => {
                // Best of the pinned set, among those that publish it. Size,
                // tax and total output have no better direction, so nothing is
                // marked on those — a bigger country is not a better one.
                const withData = selected.filter((r) => hasMetric(r, m.id));
                let best: RankRow | undefined;
                if (!m.neutral && withData.length > 1) {
                  for (const r of withData) {
                    if (!best) best = r;
                    else {
                      const better = m.higherIsBetter
                        ? (r[m.id] as number) > (best[m.id] as number)
                        : (r[m.id] as number) < (best[m.id] as number);
                      if (better) best = r;
                    }
                  }
                  // Nobody wins a tie. Electricity access is 100% for most of
                  // the rich world, and marking whichever happened to be
                  // pinned first as "best" claims a difference that is not
                  // there.
                  const bv = best![m.id] as number;
                  if (withData.filter((r) => (r[m.id] as number) === bv).length > 1) {
                    best = undefined;
                  }
                }
                const ranks = rankByMetric.get(m.id);
                // The rank map holds exactly the entities that publish the
                // measure, so its size is the pool. allValuesMap only covers
                // the ranked METRICS, so the compare-only rows read "of 0"
                // from it.
                const poolSize = ranks?.size ?? 0;

                return (
                  <tr key={m.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2 sticky left-0 bg-card z-10">
                      <p className="text-[11px] font-sans text-foreground leading-snug">
                        {m.label}
                      </p>
                      <p className="text-[9px] font-sans text-muted-foreground leading-snug">
                        {m.neutral
                          ? "no better direction"
                          : m.higherIsBetter
                            ? "higher is better"
                            : "lower is better"}
                        {poolSize > 0 && ` · ${poolSize} with data`}
                      </p>
                    </td>
                    {selected.map((r) => {
                      const val = r[m.id] as number;
                      const present = hasMetric(r, m.id);
                      const rank = present ? ranks?.get(r.id) : undefined;
                      // The bar is the share of ranked entities this one
                      // beats, not a min-max percentile. On a measure with a
                      // long tail — GDP per capita, where Monaco is three
                      // times the next entity — min-max squashes almost
                      // everyone into the same sliver, so the bar disagreed
                      // with the rank printed directly above it.
                      const pct =
                        rank && poolSize > 1
                          ? ((poolSize - rank) / (poolSize - 1)) * 100
                          : 0;
                      const isBest = best && r.id === best.id && withData.length > 1;
                      return (
                        <td key={r.id} className="px-3 py-2 align-top">
                          <p
                            className={`text-xs font-mono ${
                              present ? "text-foreground" : "text-muted-foreground"
                            } ${isBest ? "font-bold" : ""}`}
                          >
                            {fmtMetric(m, val)}
                            {isBest && (
                              <span className="ml-1 text-[9px] font-sans text-success">
                                best
                              </span>
                            )}
                          </p>
                          {present && rank && (
                            <>
                              <p className="text-[9px] font-mono text-muted-foreground">
                                #{rank} of {poolSize}
                              </p>
                              <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-secondary"
                                  style={{ width: `${Math.max(2, pct)}%` }}
                                />
                              </div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RankingsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("economy");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [continentFilter, setContinentFilter] =
    useState<ContinentFilter>("all");
  const [sortMetric, setSortMetric] = useState<MetricId>("composite");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQ, setSearchQ] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  /**
   * The pinned comparison, mirrored in ?compare= so a set can be linked and so
   * the dashboard's compare card can hand its own pins over when you follow
   * "Full explorer".
   */
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const raw = new URLSearchParams(window.location.search).get("compare");
    if (!raw) return [];
    return raw.split(",").filter(Boolean).slice(0, COMPARE_MAX);
  });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Build all rows once
  const allRows = useMemo<RankRow[]>(() => {
    const countryRows = buildCountryRows();
    const stateRows = buildStateRows();
    const combined = [...countryRows, ...stateRows];
    return combined.map((r) => ({
      ...r,
      composite: computeComposite(r, combined),
    }));
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (compareIds.length) url.searchParams.set("compare", compareIds.join(","));
    else url.searchParams.delete("compare");
    window.history.replaceState(null, "", url.toString());
  }, [compareIds]);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= COMPARE_MAX
          ? prev
          : [...prev, id],
    );
  }, []);

  // allValues per metric for percentile bars
  const allValuesMap = useMemo(() => {
    const map: Partial<Record<string, number[]>> = {};
    for (const m of METRICS) {
      if (m.id !== "composite") {
        map[m.id] = allRows.map((r) => r[m.id] as number);
      } else {
        map["composite"] = allRows.map((r) => r.composite);
      }
    }
    // also add category-specific fields
    map["educationRank"] = allRows.map((r) => r.educationRank);
    map["healthcareRank"] = allRows.map((r) => r.healthcareRank);
    map["crimeIndex"] = allRows.map((r) => r.crimeIndex);
    return map;
  }, [allRows]);

  const rankByMetric = useMemo(() => buildRankByMetric(allRows), [allRows]);

  /** The pinned rows, in the order they were pinned. */
  const compareRows = useMemo(
    () =>
      compareIds
        .map((id) => allRows.find((r) => r.id === id))
        .filter((r): r is RankRow => !!r),
    [compareIds, allRows],
  );

  // Summary stats
  const summaryStats = useMemo(() => {
    const countries = allRows.filter((r) => r.type === "country");
    const states = allRows.filter((r) => r.type === "state");
    const topCountry = [...countries].sort(
      (a, b) => b.composite - a.composite,
    )[0];
    const topState = [...states].sort((a, b) => b.composite - a.composite)[0];
    const avgComposite =
      Math.round(
        (allRows.reduce((s, r) => s + r.composite, 0) / allRows.length) * 10,
      ) / 10;
    const topHDI = [...allRows].sort((a, b) => b.hdi - a.hdi)[0];
    return {
      topCountry,
      topState,
      avgComposite,
      topHDI,
      total: allRows.length,
    };
  }, [allRows]);

  // Filter + sort
  // Active category metrics
  const activeCategoryMetrics = CATEGORY_METRICS[activeCategory];

  // Map from category tab → primary sort metric id + direction
  const CATEGORY_PRIMARY_SORT: Record<
    CategoryTab,
    { metric: string; dir: SortDir }
  > = {
    economy: { metric: "gdpPerCapita", dir: "desc" },
    hdi: { metric: "hdi", dir: "desc" },
    housing: { metric: "homelessness", dir: "asc" },
    justice: { metric: "incarceration", dir: "asc" },
    health: { metric: "lifeExpectancy", dir: "desc" },
    education: { metric: "educationRank", dir: "asc" },
    infrastructure: { metric: "energyOutputTWh", dir: "desc" },
  };

  /**
   * The ranking pool: entity and continent filters only.
   *
   * Those two are scope — they choose what an entity is ranked among. Search
   * is a lookup, so it must not change anyone's rank; it is applied after
   * ranking rather than before. Previously every rank was an index into the
   * post-search list, so searching "mexic" awarded Mexico a gold medal for
   * incarceration purely because it sorted first among the two matches.
   */
  const scopedRows = useMemo(() => {
    let rows = allRows;
    if (entityFilter !== "all")
      rows = rows.filter((r) => r.type === entityFilter);
    if (entityFilter !== "state" && continentFilter !== "all") {
      const countryMap: Record<string, string> = {};
      countriesData.forEach((c) => {
        countryMap[`country-${c.id}`] = c.continent;
      });
      rows = rows.filter(
        (r) => r.type === "state" || countryMap[r.id] === continentFilter,
      );
    }
    return rows;
  }, [allRows, entityFilter, continentFilter]);

  const searchTerm = searchQ.trim().toLowerCase();
  const matchesSearch = useCallback(
    (r: RankRow) => !searchTerm || r.name.toLowerCase().includes(searchTerm),
    [searchTerm],
  );

  const filteredRows = useMemo(() => {
    let rows = scopedRows.filter(matchesSearch);
    rows = [...rows].sort((a, b) => {
      const av =
        sortMetric === "composite" ? a.composite : (a[sortMetric] as number);
      const bv =
        sortMetric === "composite" ? b.composite : (b[sortMetric] as number);
      // Rows missing the sort metric go last in either direction. Subtracting
      // NaN yields NaN, which sort treats as 0, scattering them through the
      // results instead of keeping them out of the ranking.
      const aOk = isFinite(av);
      const bOk = isFinite(bv);
      if (aOk !== bOk) return aOk ? -1 : 1;
      if (!aOk) return 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return rows;
  }, [scopedRows, matchesSearch, sortMetric, sortDir]);

  /**
   * The full category ranking over the pool, before search. Ranks are read
   * from here so a searched entity shows the position it actually holds.
   */
  const categoryRankedAll = useMemo(() => {
    const primarySort = CATEGORY_PRIMARY_SORT[activeCategory];
    return [...scopedRows].sort((a, b) => {
      const av = (r: RankRow) =>
        r[primarySort.metric as keyof RankRow] as number;
      const x = av(a);
      const y = av(b);
      const xOk = isFinite(x);
      const yOk = isFinite(y);
      if (xOk !== yOk) return xOk ? -1 : 1;
      if (!xOk) return 0;
      return primarySort.dir === "desc" ? y - x : x - y;
    });
  }, [scopedRows, activeCategory]);

  const categoryRankById = useMemo(() => {
    const m = new Map<string, number>();
    categoryRankedAll.forEach((r, i) => m.set(r.id, i + 1));
    return m;
  }, [categoryRankedAll]);

  // Displayed table rows keep the ranked order and only drop non-matches.
  const categoryTableRows = useMemo(
    () => categoryRankedAll.filter(matchesSearch),
    [categoryRankedAll, matchesSearch],
  );

  const totalPages = Math.ceil(categoryTableRows.length / PAGE_SIZE);
  const pageRows = useMemo(
    () => categoryTableRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [categoryTableRows, page],
  );

  /** Leaderboard ranking over the pool, before search — same reasoning. */
  const leaderboardAll = useMemo(() => {
    const nonComposite = activeCategoryMetrics.filter(
      (m) => m.id !== "composite",
    );
    if (nonComposite.length === 0) return scopedRows;
    const primary = nonComposite[0];
    // Rows without a value for the primary metric sort last rather than
    // competing. With a "lower is better" metric such as crime or education
    // rank, missing data used to sort to the very top, so the Top 5 was a list
    // of entities with no data shown as "N/A".
    return [...scopedRows].sort((a, b) => {
      const av = primary.accessor(a);
      const bv = primary.accessor(b);
      const aOk = isFinite(av);
      const bOk = isFinite(bv);
      if (aOk !== bOk) return aOk ? -1 : 1;
      if (!aOk) return 0;
      return primary.higherIsBetter ? bv - av : av - bv;
    });
  }, [scopedRows, activeCategoryMetrics]);

  const leaderboardRankById = useMemo(() => {
    const m = new Map<string, number>();
    leaderboardAll.forEach((r, i) => m.set(r.id, i + 1));
    return m;
  }, [leaderboardAll]);

  const categorySortedRows = useMemo(
    () => leaderboardAll.filter(matchesSearch),
    [leaderboardAll, matchesSearch],
  );

  // The columns to show in the table = active category metrics
  const tableColumns = activeCategoryMetrics;

  function handleSortClick(metricId: MetricId) {
    if (sortMetric === metricId) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortMetric(metricId);
      const m = METRICS.find((x) => x.id === metricId);
      setSortDir(m?.higherIsBetter ? "desc" : "asc");
    }
    setPage(0);
  }

  function handleFilterChange(f: EntityFilter) {
    setEntityFilter(f);
    setContinentFilter("all");
    setPage(0);
  }

  /** The pool the active category can rank, or "all" if it is unrestricted. */
  const activePool: CategoryPool =
    CATEGORY_TABS.find((t) => t.id === activeCategory)?.pool ?? "all";

  /**
   * Selecting a pool-locked category moves the entity filter with it, so the
   * table is never asked to rank entities the category has no data for.
   */
  function selectCategory(id: CategoryTab) {
    const pool = CATEGORY_TABS.find((t) => t.id === id)?.pool ?? "all";
    setActiveCategory(id);
    if (pool !== "all") {
      setEntityFilter(pool);
      setContinentFilter("all");
    }
    setPage(0);
  }

  // Top 3 for podium
  const top3 = useMemo(
    () =>
      [...allRows]
        .filter(
          entityFilter === "all" ? () => true : (r) => r.type === entityFilter,
        )
        .sort((a, b) => b.composite - a.composite)
        .slice(0, 3),
    [allRows, entityFilter],
  );

  const CONTINENTS: ContinentFilter[] = [
    "all",
    "North America",
    "South America",
    "Europe",
    "Asia",
    "Africa",
    "Oceania",
  ];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-full font-sans">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Compare
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Pin any countries and US states together and read them against each
            other across every measure the site holds — the full form of the
            dashboard's compare card, with each figure placed among all{" "}
            {allRows.length} entities. The table below is the pool you pick
            from, ordered by a composite scored over whatever an entity
            actually has, up to 9 indicators for countries and 5 for states,
            with the weights renormalised across those so a missing one neither
            helps nor hurts.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono bg-muted/50 border border-border rounded-lg px-2.5 py-1 shrink-0 self-start">
          {filteredRows.length} entities
        </span>
      </div>

      {/* ── Summary stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Entities",
            value: summaryStats.total.toString(),
            sub: `${countriesData.length} countries · ${usStatesData.length} states`,
            icon: <Globe size={15} weight="fill" className="text-sky-400" />,
            accent: "bg-sky-500/10",
          },
          {
            label: "Top Country",
            value: summaryStats.topCountry?.name ?? "—",
            sub: `Score: ${summaryStats.topCountry?.composite.toFixed(1)}`,
            icon: (
              <Trophy size={15} weight="fill" className="text-yellow-400" />
            ),
            accent: "bg-yellow-500/10",
          },
          {
            label: "Top US State",
            value: summaryStats.topState?.name ?? "—",
            sub: `Score: ${summaryStats.topState?.composite.toFixed(1)}`,
            icon: (
              <Buildings size={15} weight="fill" className="text-emerald-400" />
            ),
            accent: "bg-emerald-500/10",
          },
          {
            label: "Avg Composite",
            value: summaryStats.avgComposite.toString(),
            sub: `Highest HDI: ${summaryStats.topHDI?.name}`,
            icon: (
              <ChartBar size={15} weight="fill" className="text-purple-400" />
            ),
            accent: "bg-purple-500/10",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex items-start gap-3"
          >
            <div className={`p-2 rounded-xl ${card.accent} shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">
                {card.label}
              </p>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {card.value}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column row: Podium + Category ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Podium */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} weight="fill" className="text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">
              Top Performers
            </span>
            <span className="text-xs text-muted-foreground">
              ({entityFilter === "all" ? "combined" : entityFilter + "s"})
            </span>
          </div>
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {[top3[1], top3[0], top3[2]].map((row, i) => {
              if (!row) return null;
              const podiumRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const heights = ["h-16", "h-24", "h-12"];
              const bgColors = [
                "bg-slate-500/20 border-slate-500/30",
                "bg-yellow-500/20 border-yellow-500/40",
                "bg-amber-700/20 border-amber-700/30",
              ];
              return (
                <div
                  key={row.id}
                  className="flex flex-col items-center gap-1.5 min-w-[70px] sm:min-w-[90px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">
                      <span className={`font-mono font-bold ${rankColor(podiumRank)}`}>{podiumRank}</span>
                    </span>
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-border shadow-sm bg-muted flex items-center justify-center">
                      <EntityFlag
                        row={row}
                        imgClassName="w-full h-full object-cover"
                        iconSize={12}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground text-center leading-tight max-w-[70px]">
                      {row.name}
                    </span>
                    <span className="text-[10px] font-mono text-yellow-400 font-bold">
                      {row.composite.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className={`w-16 rounded-t-lg border ${bgColors[i]} ${heights[i]}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Category panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChartBar size={14} weight="fill" className="text-secondary" />
            <span className="text-xs font-semibold text-foreground">
              View by Category
            </span>
          </div>
          {/* Tabs live in the sticky filter bar below, so they stay reachable
              while scrolling the table they drive. */}

          {/* Top 5 leaderboard */}
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {/* While searching this is no longer the top of the table, it is
                the matches with the ranks they actually hold — say so rather
                than labelling rank #133 as "Top 5". */}
            {searchTerm ? "Matches" : "Top 5"} —{" "}
            {CATEGORY_TABS.find((t) => t.id === activeCategory)?.label}
          </p>
          <div className="flex flex-col gap-1">
            {categorySortedRows.slice(0, 5).map((row) => {
              const rank = leaderboardRankById.get(row.id) ?? 0;
              const primary =
                activeCategoryMetrics.find((m) => m.id !== "composite") ??
                activeCategoryMetrics[0];
              const val = primary.accessor(row);
              // Scale the bar against the whole pool, not just the matches,
              // so a searched row keeps the same bar it has in the full list.
              const allVals = leaderboardAll.map((r) => primary.accessor(r));
              const pct = percentile(val, allVals, primary.higherIsBetter);
              const barColor =
                pct >= 66
                  ? "bg-success"
                  : pct >= 33
                    ? "bg-amber-500"
                    : "bg-destructive";
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm w-5 text-center shrink-0">
                    <span
                      className={`font-mono text-xs ${rankColor(rank)} ${rank <= 3 ? "font-bold" : ""}`}
                    >
                      {rank}
                    </span>
                  </span>
                  <div className="w-11 h-7 rounded overflow-hidden bg-muted border border-border shrink-0">
                    <EntityFlag
                      row={row}
                      imgClassName="w-full h-full object-cover"
                      iconSize={9}
                      iconClassName="text-muted-foreground m-auto"
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground flex-1 truncate">
                    {row.name}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${barColor.replace("bg-success", "text-success").replace("bg-amber-500", "text-amber-400").replace("bg-destructive", "text-destructive")} shrink-0`}
                  >
                    {fmtMetric(primary, val)}
                  </span>
                  <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Comparison ──────────────────────────────────────────────────── */}
      <ComparisonPanel
        selected={compareRows}
        allRows={allRows}
        rankByMetric={rankByMetric}
        selectedIds={compareIds}
        onAdd={toggleCompare}
        onRemove={toggleCompare}
        onClear={() => setCompareIds([])}
      />

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      {/* Search + filters. Same two-row shell the countries and states pages
          use: a full-width search row, then a rule and a row of pill filters
          ending in a bare sort select. */}
      <div className="search-sticky sticky top-16 z-30 flex flex-col border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
        {/* Row 1: Search */}
        <div className="flex items-center gap-2">
          <MagnifyingGlass
            size={16}
            className="text-muted-foreground shrink-0"
          />
          <input
            type="text"
            placeholder="Search countries or states…"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setPage(0);
            }}
            className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          />
          {searchQ && (
            <button
              onClick={() => {
                setSearchQ("");
                setPage(0);
              }}
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Row 2: category pills, entity pills, sort */}
        <CollapsibleFilters id="rankings">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectCategory(tab.id)}
              title={
                tab.pool === "country"
                  ? "Ranks countries — the underlying data is country-level"
                  : tab.pool === "state"
                    ? "Ranks US states — the underlying data is state-level"
                    : undefined
              }
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                activeCategory === tab.id
                  ? "bg-secondary/20 text-foreground border-secondary/40"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="w-px h-5 bg-border shrink-0" />

          {(["all", "country", "state"] as EntityFilter[]).map((f) => {
            // A pool-locked category fixes the entity filter, so offering the
            // other two here would be a control that silently does nothing.
            const locked = activePool !== "all";
            const disabled = locked && f !== activePool;
            return (
              <button
                key={f}
                onClick={() => !disabled && handleFilterChange(f)}
                disabled={disabled}
                title={
                  disabled
                    ? `${CATEGORY_TABS.find((t) => t.id === activeCategory)?.label} is ranked over ${activePool === "country" ? "countries" : "US states"} only`
                    : undefined
                }
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors shrink-0 ${
                  disabled
                    ? // opacity-40 rather than text-muted-foreground/40: the
                      // token is already declared with an alpha channel, so the
                      // slash modifier does not compose and the pill rendered
                      // at full brightness, looking enabled.
                      "bg-transparent border-border text-muted-foreground opacity-40 cursor-not-allowed"
                    : entityFilter === f
                      ? "bg-secondary/20 text-foreground border-secondary/40 cursor-pointer"
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "country"
                    ? "Countries"
                    : "US States"}
              </button>
            );
          })}

          <div className="w-px h-5 bg-border shrink-0" />

          <select
            value={sortMetric}
            onChange={(e) => {
              setSortMetric(e.target.value as MetricId);
              setPage(0);
            }}
            className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
          >
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                Sort: {m.shortLabel}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
            aria-label={
              sortDir === "desc" ? "Sort ascending" : "Sort descending"
            }
          >
            {sortDir === "desc" ? (
              <SortDescending size={13} />
            ) : (
              <SortAscending size={13} />
            )}
          </button>
        </CollapsibleFilters>
      </div>

      {/* Continent filter */}
      {entityFilter !== "state" && (
        <div className="flex items-center gap-2 flex-wrap -mt-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide shrink-0">
            Continent:
          </span>
          <div className="flex flex-wrap gap-1">
            {CONTINENTS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setContinentFilter(c);
                  setPage(0);
                }}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  continentFilter === c
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Table / Card list ──────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Column header — category label */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
          <span className="text-xs font-semibold text-foreground">
            Pick from all entities · ranked by{" "}
            {CATEGORY_TABS.find((t) => t.id === activeCategory)?.label.toLowerCase()}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {filteredRows.length} results
          </span>
        </div>

        {/* Desktop table — shows only active category columns */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="text-left pl-4 pr-2 py-2.5 text-muted-foreground font-semibold w-10 whitespace-nowrap">
                  #
                </th>
                <th className="text-left pr-3 py-2.5 text-muted-foreground font-semibold min-w-[150px]">
                  Entity
                </th>
                <th className="text-center px-2 py-2.5 text-muted-foreground font-semibold w-14 whitespace-nowrap">
                  Type
                </th>
                <th className="text-left px-2 py-2.5 text-muted-foreground font-semibold w-24 whitespace-nowrap">
                  Profile
                </th>
                {tableColumns.map((m) => (
                  <th
                    key={m.id}
                    onClick={() =>
                      m.id !== "educationRank" &&
                      m.id !== "healthcareRank" &&
                      m.id !== "crimeIndex"
                        ? handleSortClick(m.id as MetricId)
                        : undefined
                    }
                    className={`text-right px-3 py-2.5 select-none transition-colors whitespace-nowrap cursor-pointer ${
                      sortMetric === m.id
                        ? "text-foreground bg-secondary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    } ${m.id === "composite" ? "border-l border-border/60" : ""}`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className={m.id === "composite" ? m.color : ""}>
                        {m.shortLabel}
                      </span>
                      {sortMetric === m.id ? (
                        sortDir === "desc" ? (
                          <ArrowDown size={10} weight="bold" />
                        ) : (
                          <ArrowUp size={10} weight="bold" />
                        )
                      ) : (
                        <Minus size={10} className="opacity-0" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const globalRank = categoryRankById.get(row.id) ?? 0;
                const isExpanded = expandedRowId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() =>
                        setExpandedRowId((prev) =>
                          prev === row.id ? null : row.id,
                        )
                      }
                      className={`border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer select-none ${isExpanded ? "bg-muted/20" : ""}`}
                    >
                      {/* Rank */}
                      <td className="pl-4 pr-2 py-2.5">
                        <MedalCell rank={globalRank} />
                      </td>
                      {/* Name */}
                      <td className="pr-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-11 h-7 rounded overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                            <EntityFlag
                              row={row}
                              imgClassName="w-full h-full object-cover"
                              iconSize={9}
                            />
                          </div>
                          <span className="font-medium text-foreground leading-tight truncate">
                            {row.name}
                          </span>
                          <span className="ml-auto text-muted-foreground/40 shrink-0">
                            {isExpanded ? (
                              <CaretUp size={9} />
                            ) : (
                              <CaretDown size={9} />
                            )}
                          </span>
                        </div>
                      </td>
                      {/* Type badge */}
                      <td className="px-2 py-2.5 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
                            row.type === "country"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {row.type === "country" ? "Ctry" : "State"}
                        </span>
                      </td>
                      {/* Profile — every indicator this entity has, as a
                          bar each, the way the policy rows carry theirs. */}
                      <td className="px-2 py-2.5">
                        <ProfileStrip row={row} allValuesMap={allValuesMap} bare />
                      </td>
                      {/* Category metric columns */}
                      {tableColumns.map((m) => {
                        const val = m.accessor(row);
                        const allVals = allValuesMap[m.id] ?? [];
                        const pct = percentile(val, allVals, m.higherIsBetter);
                        const textColor =
                          pct >= 66
                            ? "text-success"
                            : pct >= 33
                              ? "text-amber-400"
                              : "text-destructive";
                        return (
                          <td
                            key={m.id}
                            className={`px-3 py-2.5 text-right ${m.id === "composite" ? "border-l border-border/40" : ""} ${sortMetric === m.id ? "bg-secondary/5" : ""}`}
                          >
                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={`font-mono ${m.id === "composite" ? "text-yellow-400 font-bold" : textColor}`}
                              >
                                {fmtMetric(m, val)}
                              </span>
                              <ScoreBar
                                value={val}
                                allValues={allVals}
                                higherIsBetter={m.higherIsBetter}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="border-b border-secondary/20 bg-secondary/5">
                        <td
                          // rank, entity, type, profile, then the metric columns
                          colSpan={4 + tableColumns.length}
                          className="px-4 py-4"
                        >
                          <RowDetailPanel
                            row={row}
                            allValuesMap={allValuesMap}
                            rank={globalRank}
                            totalInPool={scopedRows.length}
                            onClose={() => setExpandedRowId(null)}
                            inCompare={compareIds.includes(row.id)}
                            compareFull={compareIds.length >= COMPARE_MAX}
                            onToggleCompare={() => toggleCompare(row.id)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden">
          {pageRows.map((row) => {
            const globalRank = categoryRankById.get(row.id) ?? 0;
            const isExpanded = expandedRowId === row.id;
            return (
              <React.Fragment key={row.id}>
                <MobileCard
                  row={row}
                  rank={globalRank}
                  activeMetrics={activeCategoryMetrics}
                  allValuesMap={allValuesMap}
                  isExpanded={isExpanded}
                  onClick={() =>
                    setExpandedRowId((prev) =>
                      prev === row.id ? null : row.id,
                    )
                  }
                />
                {isExpanded && (
                  <div className="px-4 py-4 bg-secondary/5 border-b border-secondary/20">
                    <RowDetailPanel
                      row={row}
                      allValuesMap={allValuesMap}
                      rank={globalRank}
                      totalInPool={scopedRows.length}
                      onClose={() => setExpandedRowId(null)}
                      inCompare={compareIds.includes(row.id)}
                      compareFull={compareIds.length >= COMPARE_MAX}
                      onToggleCompare={() => toggleCompare(row.id)}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 flex-wrap gap-2">
            <span className="text-[11px] text-muted-foreground">
              {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filteredRows.length)} of{" "}
              {filteredRows.length}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum =
                  totalPages <= 7
                    ? i
                    : page < 4
                      ? i
                      : page > totalPages - 4
                        ? totalPages - 7 + i
                        : page - 3 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                      page === pageNum
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Composite scores are computed by normalizing each metric into a 0–100
        percentile, then weighting by significance.{" "}
        <span className="text-success font-semibold">Green</span> = top third,{" "}
        <span className="text-amber-400 font-semibold">amber</span> = middle,{" "}
        <span className="text-destructive font-semibold">red</span> = bottom
        third.
      </p>
    </div>
  );
}
