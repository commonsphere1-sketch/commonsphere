import React, { useState, useMemo,} from "react";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import {
  COUNTRY_SOCIAL_STATS,
  STATE_SOCIAL_STATS,
} from "../data/socialStatsData";
import {
  Globe,
  Buildings,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  ChartBar,
  Funnel,
  SortAscending,
  SortDescending,
  Star,
  CaretDown,
  CaretUp,
  X,
MagnifyingGlass,
} from "@phosphor-icons/react";

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
  | "tradeBalance"
  | "easeOfBusiness";

type CategoryTab =
  | "housing"
  | "transportation"
  | "lifeExpectancy"
  | "economy"
  | "hdi"
  | "education"
  | "crime";

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

const CATEGORY_TABS: { id: CategoryTab; label: string; icon: string }[] = [
  { id: "housing", label: "Housing", icon: "🏠" },
  { id: "transportation", label: "Transport", icon: "🚆" },
  { id: "lifeExpectancy", label: "Life Exp.", icon: "❤️" },
  { id: "economy", label: "Economy", icon: "💹" },
  { id: "hdi", label: "HDI", icon: "🌐" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "crime", label: "Crime", icon: "🔒" },
];

const CATEGORY_METRICS: Record<CategoryTab, CategoryMetric[]> = {
  housing: [
    {
      id: "homelessness",
      label: "Homelessness Rate",
      shortLabel: "Homeless.",
      description: "Homeless persons per 100,000 residents",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(0)}/100k`,
      color: "text-purple-400",
      accessor: (r) => r.homelessness,
    },
    {
      id: "inflation",
      label: "Inflation Rate",
      shortLabel: "Inflation",
      description: "High inflation erodes housing affordability",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-amber-400",
      accessor: (r) => r.inflation,
    },
    {
      id: "gdpPerCapita",
      label: "GDP per Capita",
      shortLabel: "GDP/cap",
      description: "Income level determines housing purchasing power",
      higherIsBetter: true,
      format: (v) =>
        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
      color: "text-emerald-400",
      accessor: (r) => r.gdpPerCapita,
    },
    {
      id: "unemployment",
      label: "Unemployment",
      shortLabel: "Unemploy.",
      description: "Unemployment drives housing insecurity",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-orange-400",
      accessor: (r) => r.unemployment,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
  ],
  transportation: [
    {
      id: "easeOfBusiness",
      label: "Ease of Business",
      shortLabel: "Bus. Rank",
      description:
        "World Bank rank — logistics & infrastructure (lower=better)",
      higherIsBetter: false,
      format: (v) => (v > 0 ? `#${Math.round(v)}` : "N/A"),
      color: "text-lime-400",
      accessor: (r) => r.easeOfBusiness,
    },
    {
      id: "tradeBalance",
      label: "Trade Balance",
      shortLabel: "Trade Bal.",
      description: "Strong trade surplus → robust transport networks",
      higherIsBetter: true,
      format: (v) => (v >= 0 ? `+${v.toFixed(0)}` : `${v.toFixed(0)}`),
      color: "text-cyan-400",
      accessor: (r) => r.tradeBalance,
    },
    {
      id: "gdpPerCapita",
      label: "GDP per Capita",
      shortLabel: "GDP/cap",
      description: "Income correlates with transport infrastructure",
      higherIsBetter: true,
      format: (v) =>
        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
      color: "text-emerald-400",
      accessor: (r) => r.gdpPerCapita,
    },
    {
      id: "gdpGrowth",
      label: "GDP Growth",
      shortLabel: "Growth",
      description: "Economic growth drives infrastructure expansion",
      higherIsBetter: true,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-teal-400",
      accessor: (r) => r.gdpGrowth,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
  ],
  lifeExpectancy: [
    {
      id: "lifeExpectancy",
      label: "Life Expectancy",
      shortLabel: "Life Exp.",
      description: "Average years a newborn is expected to live",
      higherIsBetter: true,
      format: (v) => `${v.toFixed(1)} yrs`,
      color: "text-blue-400",
      accessor: (r) => r.lifeExpectancy,
    },
    {
      id: "hdi",
      label: "HDI",
      shortLabel: "HDI",
      description: "UNDP composite including health & longevity (0–1)",
      higherIsBetter: true,
      format: (v) => v.toFixed(3),
      color: "text-violet-400",
      accessor: (r) => r.hdi,
    },
    {
      id: "healthcareRank",
      label: "Healthcare Rank",
      shortLabel: "Health Rank",
      description: "Healthcare system quality ranking (lower=better)",
      higherIsBetter: false,
      format: (v) => (v > 0 ? `#${Math.round(v)}` : "N/A"),
      color: "text-rose-400",
      accessor: (r) => r.healthcareRank,
    },
    {
      id: "gdpPerCapita",
      label: "GDP per Capita",
      shortLabel: "GDP/cap",
      description: "Higher income enables better health outcomes",
      higherIsBetter: true,
      format: (v) =>
        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
      color: "text-emerald-400",
      accessor: (r) => r.gdpPerCapita,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
  ],
  economy: [
    {
      id: "gdpPerCapita",
      label: "GDP per Capita",
      shortLabel: "GDP/cap",
      description: "Gross domestic product per person (USD)",
      higherIsBetter: true,
      format: (v) =>
        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
      color: "text-emerald-400",
      accessor: (r) => r.gdpPerCapita,
    },
    {
      id: "gdpGrowth",
      label: "Growth",
      shortLabel: "Growth",
      description: "Year-on-year real GDP growth (%)",
      higherIsBetter: true,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-teal-400",
      accessor: (r) => r.gdpGrowth,
    },
    {
      id: "unemployment",
      label: "Unemployment",
      shortLabel: "Unemploy.",
      description: "Share of labor force unemployed (%)",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-orange-400",
      accessor: (r) => r.unemployment,
    },
    {
      id: "inflation",
      label: "Inflation",
      shortLabel: "Inflation",
      description: "Annual consumer price index change (%)",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-amber-400",
      accessor: (r) => r.inflation,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
  ],
  hdi: [
    {
      id: "hdi",
      label: "HDI",
      shortLabel: "HDI",
      description: "UNDP composite of life expectancy, education, income (0–1)",
      higherIsBetter: true,
      format: (v) => v.toFixed(3),
      color: "text-violet-400",
      accessor: (r) => r.hdi,
    },
    {
      id: "lifeExpectancy",
      label: "Life Expectancy",
      shortLabel: "Life Exp.",
      description: "Longevity component of HDI",
      higherIsBetter: true,
      format: (v) => `${v.toFixed(1)} yrs`,
      color: "text-blue-400",
      accessor: (r) => r.lifeExpectancy,
    },
    {
      id: "educationRank",
      label: "Education Rank",
      shortLabel: "Edu. Rank",
      description: "Education quality ranking (lower=better)",
      higherIsBetter: false,
      format: (v) => (v > 0 ? `#${Math.round(v)}` : "N/A"),
      color: "text-blue-400",
      accessor: (r) => r.educationRank,
    },
    {
      id: "gdpPerCapita",
      label: "GDP per Capita",
      shortLabel: "GDP/cap",
      description: "Income component of HDI",
      higherIsBetter: true,
      format: (v) =>
        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
      color: "text-emerald-400",
      accessor: (r) => r.gdpPerCapita,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
  ],
  education: [
    {
      id: "educationRank",
      label: "Education Rank",
      shortLabel: "Edu. Rank",
      description: "National/state education quality ranking (lower=better)",
      higherIsBetter: false,
      format: (v) => (v > 0 ? `#${Math.round(v)}` : "N/A"),
      color: "text-blue-400",
      accessor: (r) => r.educationRank,
    },
    {
      id: "hdi",
      label: "HDI",
      shortLabel: "HDI",
      description: "UNDP composite including education component (0–1)",
      higherIsBetter: true,
      format: (v) => v.toFixed(3),
      color: "text-violet-400",
      accessor: (r) => r.hdi,
    },
    {
      id: "gdpPerCapita",
      label: "GDP per Capita",
      shortLabel: "GDP/cap",
      description: "Income level correlates with education investment",
      higherIsBetter: true,
      format: (v) =>
        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`,
      color: "text-emerald-400",
      accessor: (r) => r.gdpPerCapita,
    },
    {
      id: "unemployment",
      label: "Unemployment",
      shortLabel: "Unemploy.",
      description: "Education outcomes correlate with employment",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-orange-400",
      accessor: (r) => r.unemployment,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
  ],
  crime: [
    {
      id: "crimeIndex",
      label: "Crime Index",
      shortLabel: "Crime Idx",
      description: "Composite crime index — higher = more crime",
      higherIsBetter: false,
      format: (v) => (v > 0 ? v.toFixed(0) : "N/A"),
      color: "text-red-400",
      accessor: (r) => r.crimeIndex,
    },
    {
      id: "incarceration",
      label: "Incarceration",
      shortLabel: "Incarcerat.",
      description: "Prison population per 100,000 residents",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(0)}/100k`,
      color: "text-red-400",
      accessor: (r) => r.incarceration,
    },
    {
      id: "homelessness",
      label: "Homelessness",
      shortLabel: "Homeless.",
      description: "Homelessness strongly correlates with crime rates",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(0)}/100k`,
      color: "text-purple-400",
      accessor: (r) => r.homelessness,
    },
    {
      id: "unemployment",
      label: "Unemployment",
      shortLabel: "Unemploy.",
      description: "Unemployment correlates with public safety outcomes",
      higherIsBetter: false,
      format: (v) => `${v.toFixed(1)}%`,
      color: "text-orange-400",
      accessor: (r) => r.unemployment,
    },
    {
      id: "composite",
      label: "Score",
      shortLabel: "Score",
      description: "Overall composite score",
      higherIsBetter: true,
      format: (v) => v.toFixed(1),
      color: "text-yellow-400",
      accessor: (r) => r.composite,
    },
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
    format: (v) => (v >= 0 ? `+${v.toFixed(0)}` : `${v.toFixed(0)}`),
    color: "text-cyan-400",
    weight: 1,
  },
  {
    id: "easeOfBusiness",
    label: "Ease of Business",
    shortLabel: "Bus. Rank",
    description: "World Bank Ease of Doing Business rank — lower = better",
    higherIsBetter: false,
    format: (v) => (v > 0 ? `#${Math.round(v)}` : "N/A"),
    color: "text-lime-400",
    weight: 0,
  },
];

// ─── Ease-of-business data ─────────────────────────────────────────────────
const EASE_OF_BUSINESS: Record<string, number> = {
  us: 55,
  cn: 31,
  de: 22,
  gb: 8,
  fr: 32,
  jp: 29,
  in: 63,
  br: 124,
  ru: 28,
  au_oc: 14,
  kr: 5,
  ca: 23,
  sa: 62,
  ae: 16,
  sg: 2,
  mx: 60,
  za: 84,
  ng: 131,
  eg: 93,
  il_as: 35,
  ar: 126,
  tr: 33,
  id: 73,
  my: 12,
  th: 21,
  vn: 70,
  ph: 95,
  pk: 108,
  bd: 168,
};

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
  easeOfBusiness: number;
  composite: number;
  educationRank: number;
  healthcareRank: number;
  crimeIndex: number;
}

function buildCountryRows(): RankRow[] {
  return countriesData.map((c) => {
    const social = COUNTRY_SOCIAL_STATS[c.id];
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
      incarceration: social?.incarcerationRate ?? 0,
      homelessness: social?.homelessnessRate ?? 0,
      tradeBalance: c.tradeBalance,
      easeOfBusiness: EASE_OF_BUSINESS[c.id] ?? 0,
      educationRank: 0,
      healthcareRank: 0,
      crimeIndex: 0,
    } as Omit<RankRow, "composite"> & { composite: 0 };
  }) as RankRow[];
}

function buildStateRows(): RankRow[] {
  return usStatesData.map((s) => {
    const gdpPerCap = s.gdp > 0 ? Math.round((s.gdp * 1e9) / s.population) : 0;
    const normalizedHdi = Math.min(
      1,
      Math.max(0, (s.qualityOfLiving ?? 50) / 100),
    );
    const social = STATE_SOCIAL_STATS[s.id];
    return {
      id: `state-${s.id}`,
      name: s.name,
      type: "state",
      flag: `https://flagcdn.com/w40/us.png`,
      hdi: normalizedHdi,
      gdpPerCapita: gdpPerCap,
      gdpGrowth: 2.4,
      unemployment: s.unemploymentRate,
      lifeExpectancy: 78.5,
      inflation: 3.2,
      incarceration: social?.incarcerationRate ?? s.incarcerationRate,
      homelessness: social?.homelessnessRate ?? s.homelessnessRate,
      tradeBalance: 0,
      easeOfBusiness: 0,
      educationRank: s.educationRank ?? 0,
      healthcareRank: s.healthcareRank ?? 0,
      crimeIndex: s.crimeIndex ?? 0,
    } as Omit<RankRow, "composite"> & { composite: 0 };
  }) as RankRow[];
}

function percentile(
  value: number,
  allValues: number[],
  higherIsBetter: boolean,
): number {
  const valid = allValues.filter((v) => isFinite(v));
  if (valid.length === 0) return 50;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max === min) return 50;
  const raw = ((value - min) / (max - min)) * 100;
  return higherIsBetter ? raw : 100 - raw;
}

function computeComposite(row: RankRow, allRows: RankRow[]): number {
  const weightedMetrics = METRICS.filter(
    (m) => m.id !== "composite" && m.weight > 0,
  );
  const totalWeight = weightedMetrics.reduce((s, m) => s + m.weight, 0);
  let score = 0;
  for (const m of weightedMetrics) {
    const allVals = allRows.map((r) => r[m.id] as number);
    const pct = percentile(row[m.id] as number, allVals, m.higherIsBetter);
    score += (pct * m.weight) / totalWeight;
  }
  return Math.round(score * 10) / 10;
}

// ─── Medal component ──────────────────────────────────────────────────────────
function MedalCell({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 text-base">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 text-base">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 text-base">🥉</span>;
  return (
    <span className="text-muted-foreground font-mono text-sm w-6 inline-block text-center">
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

// ─── Row Detail Panel ──────────────────────────────────────────────────────────
function RowDetailPanel({
  row,
  allValuesMap,
  rank,
  totalInPool,
  onClose,
}: {
  row: RankRow;
  allValuesMap: Partial<Record<string, number[]>>;
  rank: number;
  totalInPool: number;
  onClose: () => void;
}) {
  const metricsToShow = METRICS.filter((m) => m.id !== "composite");
  const topPercentile = Math.round((1 - (rank - 1) / totalInPool) * 100);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {row.type === "country" ? (
            <img
              src={row.flag}
              alt=""
              className="w-8 h-5 rounded object-cover border border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-5 rounded bg-muted flex items-center justify-center border border-border">
              <Buildings
                size={12}
                weight="fill"
                className="text-muted-foreground"
              />
            </div>
          )}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {metricsToShow.map((m) => {
          const val = row[m.id] as number;
          const allVals = allValuesMap[m.id] ?? [];
          const pct = percentile(val, allVals, m.higherIsBetter);
          const barColor =
            pct >= 66
              ? "bg-success"
              : pct >= 33
                ? "bg-amber-500"
                : "bg-destructive";
          const textColor =
            pct >= 66
              ? "text-success"
              : pct >= 33
                ? "text-amber-400"
                : "text-destructive";
          return (
            <div
              key={m.id}
              className="bg-background/60 border border-border/60 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-foreground truncate mr-1">
                  {m.shortLabel}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${textColor} shrink-0`}
                >
                  {m.format(val)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {pct.toFixed(0)}th pct
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile Card Row ───────────────────────────────────────────────────────────
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
        <div className="w-6 h-4 rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {row.type === "country" ? (
            <img
              src={row.flag}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Buildings
              size={10}
              weight="fill"
              className="text-muted-foreground"
            />
          )}
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
        {/* Primary metric */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className={`text-xs font-mono font-bold ${textColor}`}>
            {primary.format(primaryVal)}
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
export function RankingsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("economy");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [continentFilter, setContinentFilter] =
    useState<ContinentFilter>("all");
  const [sortMetric, setSortMetric] = useState<MetricId>("composite");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQ, setSearchQ] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
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
    housing: { metric: "homelessness", dir: "asc" },
    transportation: { metric: "easeOfBusiness", dir: "asc" },
    lifeExpectancy: { metric: "lifeExpectancy", dir: "desc" },
    economy: { metric: "gdpPerCapita", dir: "desc" },
    hdi: { metric: "hdi", dir: "desc" },
    education: { metric: "educationRank", dir: "asc" },
    crime: { metric: "crimeIndex", dir: "asc" },
  };

  const filteredRows = useMemo(() => {
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
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      const av =
        sortMetric === "composite" ? a.composite : (a[sortMetric] as number);
      const bv =
        sortMetric === "composite" ? b.composite : (b[sortMetric] as number);
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return rows;
  }, [allRows, entityFilter, continentFilter, searchQ, sortMetric, sortDir]);

  // The table rows are sorted by the category primary metric
  // IMPORTANT: declared before pageRows and totalPages
  const categoryTableRows = useMemo(() => {
    const primarySort = CATEGORY_PRIMARY_SORT[activeCategory];
    return [...filteredRows].sort((a, b) => {
      const getVal = (r: RankRow) => {
        if (primarySort.metric === "educationRank") return r.educationRank;
        if (primarySort.metric === "crimeIndex") return r.crimeIndex;
        if (primarySort.metric === "healthcareRank") return r.healthcareRank;
        return (r[primarySort.metric as keyof RankRow] as number) ?? 0;
      };
      const av = getVal(a);
      const bv = getVal(b);
      return primarySort.dir === "desc" ? bv - av : av - bv;
    });
  }, [filteredRows, activeCategory]);

  const totalPages = Math.ceil(categoryTableRows.length / PAGE_SIZE);
  const pageRows = useMemo(
    () => categoryTableRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [categoryTableRows, page],
  );

  // Category-specific sorted rows (used for the Top 5 leaderboard in the category panel)
  const categorySortedRows = useMemo(() => {
    const nonComposite = activeCategoryMetrics.filter(
      (m) => m.id !== "composite",
    );
    if (nonComposite.length === 0) return filteredRows;
    const primary = nonComposite[0];
    return [...filteredRows].sort((a, b) => {
      const av = primary.accessor(a);
      const bv = primary.accessor(b);
      return primary.higherIsBetter ? bv - av : av - bv;
    });
  }, [filteredRows, activeCategoryMetrics]);

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
            <div className="p-2 rounded-xl bg-yellow-500/10">
              <Trophy size={18} weight="fill" className="text-yellow-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Global Rankings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Composite index ranking of all countries and US states across 9
            societal and economic indicators.
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
                      {podiumRank === 1 ? "🥇" : podiumRank === 2 ? "🥈" : "🥉"}
                    </span>
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {row.type === "country" ? (
                        <img
                          src={row.flag}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <Buildings
                          size={12}
                          weight="fill"
                          className="text-muted-foreground"
                        />
                      )}
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
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setPage(0);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  activeCategory === tab.id
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-[11px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Top 5 leaderboard */}
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {CATEGORY_TABS.find((t) => t.id === activeCategory)?.icon} Top 5 —{" "}
            {CATEGORY_TABS.find((t) => t.id === activeCategory)?.label}
          </p>
          <div className="flex flex-col gap-1">
            {categorySortedRows.slice(0, 5).map((row, i) => {
              const primary =
                activeCategoryMetrics.find((m) => m.id !== "composite") ??
                activeCategoryMetrics[0];
              const val = primary.accessor(row);
              const allVals = categorySortedRows.map((r) =>
                primary.accessor(r),
              );
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
                    {i === 0 ? (
                      "🥇"
                    ) : i === 1 ? (
                      "🥈"
                    ) : i === 2 ? (
                      "🥉"
                    ) : (
                      <span className="text-muted-foreground font-mono text-xs">
                        {i + 1}
                      </span>
                    )}
                  </span>
                  <div className="w-5 h-3.5 rounded-sm overflow-hidden bg-muted shrink-0">
                    {row.type === "country" ? (
                      <img
                        src={row.flag}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Buildings
                        size={9}
                        weight="fill"
                        className="text-muted-foreground m-auto"
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground flex-1 truncate">
                    {row.name}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${primary.color} shrink-0`}
                  >
                    {primary.format(val)}
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

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Entity type */}
        <div className="flex bg-muted/50 border border-border rounded-xl p-0.5 gap-0.5">
          {(["all", "country", "state"] as EntityFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                entityFilter === f
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "country"
                  ? "Countries"
                  : "US States"}
            </button>
          ))}
        </div>

        {/* Sort metric */}
        <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-xl px-2.5 py-1.5 min-w-0">
          <Funnel size={12} className="text-muted-foreground shrink-0" />
          <select
            value={sortMetric}
            onChange={(e) => {
              setSortMetric(e.target.value as MetricId);
              setPage(0);
            }}
            className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer max-w-[110px]"
          >
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                Sort: {m.shortLabel}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {sortDir === "desc" ? (
              <SortDescending size={13} />
            ) : (
              <SortAscending size={13} />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-xl px-2.5 py-1.5 flex-1 min-w-[140px] max-w-xs">
          <MagnifyingGlass
            size={12}
            className="text-muted-foreground shrink-0"
          />
          <input
            type="text"
            placeholder="Search…"
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setPage(0);
            }}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1 min-w-0"
          />
          {searchQ && (
            <button
              onClick={() => {
                setSearchQ("");
                setPage(0);
              }}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X size={11} />
            </button>
          )}
        </div>
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
            {CATEGORY_TABS.find((t) => t.id === activeCategory)?.icon}{" "}
            {CATEGORY_TABS.find((t) => t.id === activeCategory)?.label} Rankings
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
                const globalRank = categoryTableRows.indexOf(row) + 1;
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
                          <div className="w-5 h-3.5 rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                            {row.type === "country" ? (
                              <img
                                src={row.flag}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <Buildings
                                size={9}
                                weight="fill"
                                className="text-muted-foreground"
                              />
                            )}
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
                                {m.format(val)}
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
                          colSpan={3 + tableColumns.length}
                          className="px-4 py-4"
                        >
                          <RowDetailPanel
                            row={row}
                            allValuesMap={allValuesMap}
                            rank={globalRank}
                            totalInPool={filteredRows.length}
                            onClose={() => setExpandedRowId(null)}
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
            const globalRank = categoryTableRows.indexOf(row) + 1;
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
                      totalInPool={filteredRows.length}
                      onClose={() => setExpandedRowId(null)}
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
