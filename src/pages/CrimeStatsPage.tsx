import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";
import {
  ShieldCheck,
  TrendUp,
  TrendDown,
  ArrowUp,
  ArrowDown,
  Info,
  MagnifyingGlass,
  Skull,
  Lock,
  Flame,
  Link,
  Users,
  Briefcase,
  House,
  Heart,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from "recharts";

/* ─── Data ────────────────────────────────────────────────────────────── */

/**
 * Intentional homicides per 100,000 people.
 *
 * Every figure is the latest World Bank value for indicator VC.IHR.PSRC.P5,
 * which carries the UNODC series; `year` records which year each one is from,
 * because reporting countries are years apart. The World Bank database was
 * refreshed 2026-07-13 and its newest homicide year is still 2023 — this
 * statistic genuinely lags, so 2023 is the current status, not a stale label.
 *
 * Two of the previous values were badly wrong rather than merely old: Nigeria
 * read 34.5 against an actual 15.7, and Venezuela 40.9 against 12.6. Both were
 * more than double the reported rate and put those countries near the top of
 * the chart.
 */
const HOMICIDE_RATES = [
  {
    country: "El Salvador",
    rate: 7.9,
    year: 2022,
    region: "Americas",
    flag: "🇸🇻",
  },
  {
    country: "Honduras",
    rate: 31.4,
    year: 2023,
    region: "Americas",
    flag: "🇭🇳",
  },
  {
    country: "Jamaica",
    rate: 49.4,
    year: 2023,
    region: "Americas",
    flag: "🇯🇲",
  },
  {
    country: "South Africa",
    rate: 43.7,
    year: 2022,
    region: "Africa",
    flag: "🇿🇦",
  },
  { country: "Brazil", rate: 19.3, year: 2023, region: "Americas", flag: "🇧🇷" },
  { country: "Mexico", rate: 24.9, year: 2023, region: "Americas", flag: "🇲🇽" },
  {
    country: "Colombia",
    rate: 24.9,
    year: 2023,
    region: "Americas",
    flag: "🇨🇴",
  },
  { country: "Nigeria", rate: 15.7, year: 2023, region: "Africa", flag: "🇳🇬" },
  {
    country: "Venezuela",
    rate: 12.6,
    year: 2022,
    region: "Americas",
    flag: "🇻🇪",
  },
  { country: "Russia", rate: 6.8, year: 2021, region: "Europe", flag: "🇷🇺" },
  { country: "USA", rate: 5.8, year: 2023, region: "Americas", flag: "🇺🇸" },
  { country: "India", rate: 2.8, year: 2022, region: "Asia", flag: "🇮🇳" },
  { country: "China", rate: 0.5, year: 2020, region: "Asia", flag: "🇨🇳" },
  { country: "Germany", rate: 0.9, year: 2023, region: "Europe", flag: "🇩🇪" },
  { country: "France", rate: 1.3, year: 2023, region: "Europe", flag: "🇫🇷" },
  { country: "UK", rate: 1.1, year: 2021, region: "Europe", flag: "🇬🇧" },
  { country: "Japan", rate: 0.2, year: 2023, region: "Asia", flag: "🇯🇵" },
  {
    country: "Australia",
    rate: 0.9,
    year: 2023,
    region: "Oceania",
    flag: "🇦🇺",
  },
  { country: "Canada", rate: 2.0, year: 2023, region: "Americas", flag: "🇨🇦" },
  { country: "Sweden", rate: 1.1, year: 2023, region: "Europe", flag: "🇸🇪" },
];

// Sorted top 12 highest + lowest for bar chart
const TOP_HIGH = [...HOMICIDE_RATES]
  .sort((a, b) => b.rate - a.rate)
  .slice(0, 10);
const TOP_SAFE = [...HOMICIDE_RATES]
  .sort((a, b) => a.rate - b.rate)
  .slice(0, 10);

// Global crime trends 2015–2023 (index score, 100=baseline)
const CRIME_TREND = [
  { year: "2015", violent: 100, property: 100, cyber: 100, drug: 100 },
  { year: "2016", violent: 97, property: 96, cyber: 118, drug: 103 },
  { year: "2017", violent: 94, property: 91, cyber: 138, drug: 106 },
  { year: "2018", violent: 92, property: 87, cyber: 162, drug: 108 },
  { year: "2019", violent: 90, property: 83, cyber: 191, drug: 110 },
  { year: "2020", violent: 86, property: 79, cyber: 234, drug: 113 },
  { year: "2021", violent: 89, property: 81, cyber: 271, drug: 117 },
  { year: "2022", violent: 91, property: 83, cyber: 305, drug: 120 },
  { year: "2023", violent: 93, property: 85, cyber: 348, drug: 122 },
];

// Safety index (higher = safer, 0-100) — Numbeo / EIU composite
const SAFETY_INDEX = [
  { country: "Iceland", score: 84.2, flag: "🇮🇸", change: +0.4, rank: 1 },
  { country: "Ireland", score: 81.8, flag: "🇮🇪", change: +0.2, rank: 2 },
  { country: "Denmark", score: 80.5, flag: "🇩🇰", change: +0.6, rank: 3 },
  { country: "Austria", score: 79.3, flag: "🇦🇹", change: -0.1, rank: 4 },
  { country: "New Zealand", score: 78.9, flag: "🇳🇿", change: +0.3, rank: 5 },
  { country: "Portugal", score: 78.1, flag: "🇵🇹", change: +0.8, rank: 6 },
  { country: "Singapore", score: 77.8, flag: "🇸🇬", change: +0.5, rank: 7 },
  { country: "Japan", score: 77.1, flag: "🇯🇵", change: +0.2, rank: 8 },
  { country: "Norway", score: 76.6, flag: "🇳🇴", change: -0.2, rank: 9 },
  { country: "Switzerland", score: 76.2, flag: "🇨🇭", change: +0.1, rank: 10 },
  { country: "Canada", score: 68.4, flag: "🇨🇦", change: -0.3, rank: 11 },
  { country: "Germany", score: 66.8, flag: "🇩🇪", change: -0.5, rank: 12 },
  { country: "Australia", score: 65.1, flag: "🇦🇺", change: -0.2, rank: 13 },
  { country: "UK", score: 61.3, flag: "🇬🇧", change: -0.8, rank: 14 },
  { country: "France", score: 57.9, flag: "🇫🇷", change: -1.1, rank: 15 },
  { country: "USA", score: 52.6, flag: "🇺🇸", change: -0.7, rank: 16 },
  { country: "India", score: 44.2, flag: "🇮🇳", change: +0.5, rank: 17 },
  { country: "Brazil", score: 32.1, flag: "🇧🇷", change: +0.3, rank: 18 },
  { country: "Mexico", score: 28.7, flag: "🇲🇽", change: -0.4, rank: 19 },
  { country: "South Africa", score: 22.4, flag: "🇿🇦", change: -0.9, rank: 20 },
];

// Crime categories by region (per 100k population, UNODC)
const REGIONAL_CRIME = [
  {
    region: "W. Europe",
    homicide: 1.1,
    robbery: 38,
    burglary: 410,
    carTheft: 94,
    drugOffense: 310,
  },
  {
    region: "N. America",
    homicide: 5.8,
    robbery: 82,
    burglary: 360,
    carTheft: 290,
    drugOffense: 680,
  },
  {
    region: "E. Europe",
    homicide: 4.1,
    robbery: 61,
    burglary: 280,
    carTheft: 122,
    drugOffense: 190,
  },
  {
    region: "L. America",
    homicide: 23.6,
    robbery: 410,
    burglary: 620,
    carTheft: 580,
    drugOffense: 290,
  },
  {
    region: "E. Asia",
    homicide: 0.8,
    robbery: 11,
    burglary: 95,
    carTheft: 31,
    drugOffense: 95,
  },
  {
    region: "S. Asia",
    homicide: 2.7,
    robbery: 45,
    burglary: 180,
    carTheft: 72,
    drugOffense: 110,
  },
  {
    region: "Sub-Saharan",
    homicide: 36.8,
    robbery: 310,
    burglary: 490,
    carTheft: 380,
    drugOffense: 180,
  },
  {
    region: "Mid. East",
    homicide: 4.3,
    robbery: 29,
    burglary: 120,
    carTheft: 48,
    drugOffense: 230,
  },
];

// Cybercrime losses by region ($B USD, 2023)
const CYBERCRIME_LOSSES = [
  { region: "North America", loss: 27.6, color: "#3b82f6" },
  { region: "Europe", loss: 18.3, color: "#6366f1" },
  { region: "Asia-Pacific", loss: 22.1, color: "#f59e0b" },
  { region: "Latin America", loss: 8.4, color: "#10b981" },
  { region: "Middle East", loss: 5.2, color: "#f97316" },
  { region: "Africa", loss: 4.1, color: "#ef4444" },
];

// Incarceration rates per 100k (World Prison Brief 2023)
const INCARCERATION = [
  { country: "USA", rate: 531, flag: "🇺🇸" },
  { country: "El Salvador", rate: 564, flag: "🇸🇻" },
  { country: "Turkmenistan", rate: 522, flag: "🇹🇲" },
  { country: "Cuba", rate: 794, flag: "🇨🇺" },
  { country: "Russia", rate: 316, flag: "🇷🇺" },
  { country: "Brazil", rate: 381, flag: "🇧🇷" },
  { country: "South Africa", rate: 280, flag: "🇿🇦" },
  { country: "Mexico", rate: 168, flag: "🇲🇽" },
  { country: "Australia", rate: 167, flag: "🇦🇺" },
  { country: "Canada", rate: 104, flag: "🇨🇦" },
  { country: "UK", rate: 131, flag: "🇬🇧" },
  { country: "France", rate: 93, flag: "🇫🇷" },
  { country: "Germany", rate: 68, flag: "🇩🇪" },
  { country: "Japan", rate: 37, flag: "🇯🇵" },
  { country: "India", rate: 33, flag: "🇮🇳" },
];

/* ─── Terrorism Data ─────────────────────────────────────────────────── */

// Global terrorism incidents & deaths per year (GTD / IEP Global Terrorism Index)
const TERRORISM_TREND = [
  { year: "2010", incidents: 4765, deaths: 7928 },
  { year: "2011", incidents: 5067, deaths: 7473 },
  { year: "2012", incidents: 6771, deaths: 11133 },
  { year: "2013", incidents: 9707, deaths: 17958 },
  { year: "2014", incidents: 13463, deaths: 32765 },
  { year: "2015", incidents: 11774, deaths: 29376 },
  { year: "2016", incidents: 13488, deaths: 25673 },
  { year: "2017", incidents: 10900, deaths: 18814 },
  { year: "2018", incidents: 9132, deaths: 15952 },
  { year: "2019", incidents: 8494, deaths: 13826 },
  { year: "2020", incidents: 7267, deaths: 10721 },
  { year: "2021", incidents: 7400, deaths: 10900 },
  { year: "2022", incidents: 6700, deaths: 9800 },
  { year: "2023", incidents: 6381, deaths: 8534 },
];

// Deaths from terrorism by region (IEP GTI 2024)
const TERRORISM_BY_REGION = [
  {
    region: "Sub-Saharan Africa",
    deaths: 4203,
    incidents: 1830,
    color: "#ef4444",
  },
  { region: "South Asia", deaths: 1941, incidents: 1621, color: "#f97316" },
  {
    region: "Middle East & N.Africa",
    deaths: 1109,
    incidents: 841,
    color: "#f59e0b",
  },
  {
    region: "W. & Central Africa",
    deaths: 3812,
    incidents: 1540,
    color: "#dc2626",
  },
  { region: "Southeast Asia", deaths: 418, incidents: 368, color: "#a855f7" },
  { region: "Europe", deaths: 233, incidents: 481, color: "#6366f1" },
  { region: "Americas", deaths: 312, incidents: 362, color: "#22d3ee" },
  { region: "Russia & C. Asia", deaths: 178, incidents: 213, color: "#64748b" },
];

// Most active terrorist groups by total deaths caused (GTD cumulative)
const TOP_TERROR_GROUPS = [
  {
    group: "ISIS / ISIL",
    deaths: 62000,
    region: "Global",
    active: true,
    color: "#ef4444",
  },
  {
    group: "Al-Shabaab",
    deaths: 14800,
    region: "East Africa",
    active: true,
    color: "#f97316",
  },
  {
    group: "JNIM",
    deaths: 9200,
    region: "West Africa",
    active: true,
    color: "#f59e0b",
  },
  {
    group: "Taliban",
    deaths: 31000,
    region: "South Asia",
    active: true,
    color: "#dc2626",
  },
  {
    group: "Boko Haram / ISWAP",
    deaths: 28400,
    region: "W. Africa",
    active: true,
    color: "#ef4444",
  },
  {
    group: "TTP (Pakistan)",
    deaths: 12600,
    region: "South Asia",
    active: true,
    color: "#a855f7",
  },
  {
    group: "NPA (Philippines)",
    deaths: 4200,
    region: "SE Asia",
    active: true,
    color: "#6366f1",
  },
  {
    group: "Al-Qaeda (AQ)",
    deaths: 8100,
    region: "Global",
    active: true,
    color: "#b45309",
  },
];

// Terrorism attack types (% of all attacks, GTD 2023)
const ATTACK_TYPES = [
  { type: "Bombing/Explosion", pct: 43, color: "#ef4444" },
  { type: "Armed Assault", pct: 28, color: "#f97316" },
  { type: "Assassination", pct: 12, color: "#f59e0b" },
  { type: "Kidnapping", pct: 9, color: "#a855f7" },
  { type: "Facility Attack", pct: 5, color: "#6366f1" },
  { type: "Other", pct: 3, color: "#64748b" },
];

/* ─── Modern Slavery Data ─────────────────────────────────────────────── */

// Global Slavery Index 2023 — victims by region (millions) and prevalence per 1,000
const SLAVERY_BY_REGION = [
  {
    region: "Asia & Pacific",
    victims: 29.3,
    prevalence: 6.6,
    color: "#f59e0b",
    flag: "🌏",
  },
  {
    region: "Africa",
    victims: 9.8,
    prevalence: 7.6,
    color: "#ef4444",
    flag: "🌍",
  },
  {
    region: "Europe & C. Asia",
    victims: 2.1,
    prevalence: 2.2,
    color: "#6366f1",
    flag: "🌍",
  },
  {
    region: "Americas",
    victims: 1.8,
    prevalence: 1.7,
    color: "#3b82f6",
    flag: "🌎",
  },
  {
    region: "Arab States",
    victims: 0.9,
    prevalence: 5.3,
    color: "#a855f7",
    flag: "🌍",
  },
];

// Countries with highest estimated modern slavery victims (millions)
const SLAVERY_HIGH_COUNTRIES = [
  {
    country: "India",
    victims: 11.0,
    prevalence: 8.0,
    flag: "🇮🇳",
    region: "Asia",
  },
  {
    country: "China",
    victims: 5.8,
    prevalence: 4.0,
    flag: "🇨🇳",
    region: "Asia",
  },
  {
    country: "North Korea",
    victims: 2.7,
    prevalence: 104.6,
    flag: "🇰🇵",
    region: "Asia",
  },
  {
    country: "Pakistan",
    victims: 2.3,
    prevalence: 10.6,
    flag: "🇵🇰",
    region: "Asia",
  },
  {
    country: "Russia",
    victims: 1.9,
    prevalence: 13.3,
    flag: "🇷🇺",
    region: "Europe",
  },
  {
    country: "Indonesia",
    victims: 1.8,
    prevalence: 6.7,
    flag: "🇮🇩",
    region: "Asia",
  },
  {
    country: "Nigeria",
    victims: 1.6,
    prevalence: 7.8,
    flag: "🇳🇬",
    region: "Africa",
  },
  {
    country: "D.R. Congo",
    victims: 1.0,
    prevalence: 11.1,
    flag: "🇨🇩",
    region: "Africa",
  },
  {
    country: "Ethiopia",
    victims: 1.0,
    prevalence: 8.8,
    flag: "🇪🇹",
    region: "Africa",
  },
  {
    country: "Bangladesh",
    victims: 1.0,
    prevalence: 6.1,
    flag: "🇧🇩",
    region: "Asia",
  },
];

// Countries taking least action — GSI Government Response Score (0–100, lower = worse)
const WORST_RESPONDERS = [
  { country: "North Korea", score: 0, flag: "🇰🇵" },
  { country: "Eritrea", score: 4, flag: "🇪🇷" },
  { country: "Equatorial Guinea", score: 12, flag: "🇬🇶" },
  { country: "Somalia", score: 17, flag: "🇸🇴" },
  { country: "Central African Rep.", score: 18, flag: "🇨🇫" },
  { country: "South Sudan", score: 19, flag: "🇸🇸" },
  { country: "Yemen", score: 21, flag: "🇾🇪" },
  { country: "Turkmenistan", score: 22, flag: "🇹🇲" },
];

// Countries with best government response
const BEST_RESPONDERS = [
  { country: "Netherlands", score: 88, flag: "🇳🇱" },
  { country: "UK", score: 85, flag: "🇬🇧" },
  { country: "USA", score: 83, flag: "🇺🇸" },
  { country: "Australia", score: 82, flag: "🇦🇺" },
  { country: "Portugal", score: 81, flag: "🇵🇹" },
  { country: "Croatia", score: 79, flag: "🇭🇷" },
  { country: "Spain", score: 78, flag: "🇪🇸" },
  { country: "Belgium", score: 77, flag: "🇧🇪" },
];

// Slavery form breakdown (% of all modern slavery victims)
const SLAVERY_FORMS = [
  { form: "Forced Labour", pct: 63.5, color: "#f97316", icon: "⚒️" },
  { form: "Forced Marriage", pct: 23.5, color: "#ef4444", icon: "💍" },
  { form: "Sexual Exploitation", pct: 6.5, color: "#a855f7", icon: "⚠️" },
  { form: "State-Imposed Labour", pct: 4.0, color: "#6366f1", icon: "🏛️" },
  { form: "Forced Criminality", pct: 2.5, color: "#f59e0b", icon: "🔗" },
];

// Annual forced labour profit by sector ($B USD, ILO 2024)
const FORCED_LABOUR_ECONOMY = [
  { sector: "Sex Trafficking", value: 99.2, color: "#ef4444" },
  { sector: "Services", value: 63.8, color: "#f59e0b" },
  { sector: "Manufacturing", value: 35.0, color: "#a855f7" },
  { sector: "Construction", value: 34.8, color: "#f97316" },
  { sector: "Agriculture / Fishing", value: 9.0, color: "#10b981" },
  { sector: "Private households", value: 8.0, color: "#3b82f6" },
];

// GTI Score 2024 — top 10 most affected countries (0-10, higher = worse)
const GTI_SCORES = [
  { country: "Burkina Faso", score: 8.64, flag: "🇧🇫", change: +0.41 },
  { country: "Mali", score: 8.46, flag: "🇲🇱", change: +0.12 },
  { country: "Syria", score: 8.06, flag: "🇸🇾", change: -0.23 },
  { country: "Somalia", score: 7.96, flag: "🇸🇴", change: -0.08 },
  { country: "Nigeria", score: 7.91, flag: "🇳🇬", change: +0.19 },
  { country: "Pakistan", score: 7.62, flag: "🇵🇰", change: +0.44 },
  { country: "DRC", score: 7.41, flag: "🇨🇩", change: +0.38 },
  { country: "Niger", score: 7.29, flag: "🇳🇪", change: +0.62 },
  { country: "Iraq", score: 7.18, flag: "🇮🇶", change: -0.15 },
  { country: "Mozambique", score: 6.92, flag: "🇲🇿", change: +0.55 },
];

/** 0–1 alpha as the two hex digits an 8-digit colour needs. */
const hex = (a: number) =>
  Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");

/** Columns for the regional crime matrix, in reading order. */
const CRIME_COLUMNS = [
  { key: "homicide", short: "Homi", label: "Homicide" },
  { key: "robbery", short: "Robb", label: "Robbery" },
  { key: "burglary", short: "Burg", label: "Burglary" },
  { key: "carTheft", short: "Theft", label: "Car theft" },
  { key: "drugOffense", short: "Drug", label: "Drug offences" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  homicide: "#ef4444",
  robbery: "#f97316",
  burglary: "#f59e0b",
  carTheft: "#6366f1",
  drugOffense: "#a855f7",
};

/* ─── Sub-components ──────────────────────────────────────────────────── */

function SectionHeader({
  title,
  sub,
  badge,
  isLight,
}: {
  title: string;
  sub?: string;
  badge?: string;
  isLight: boolean;
}) {
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  return (
    <div className="mb-4">
      {sub && (
        <p
          className="text-[10px] font-mono uppercase tracking-widest mb-1"
          style={{ color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)" }}
        >
          {sub}
        </p>
      )}
      <h2
        className="text-base font-bold font-sans flex items-center gap-2"
        style={{ color: headText }}
      >
        {title}
        {badge && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
            {badge}
          </span>
        )}
      </h2>
    </div>
  );
}

function SafetyBar({ score, isLight }: { score: number; isLight: boolean }) {
  const color =
    score >= 75
      ? "#10b981"
      : score >= 60
        ? "#22d3ee"
        : score >= 45
          ? "#f59e0b"
          : score >= 30
            ? "#f97316"
            : "#ef4444";
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden w-full"
      style={{
        background: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function CrimeStatsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [homicideView, setHomicideView] = useState<"highest" | "safest">(
    "highest",
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const homicideData = homicideView === "highest" ? TOP_HIGH : TOP_SAFE;

  return (
    <div
      className="min-h-screen w-full animate-fade-in"
      style={{ background: isLight ? "#f8fafc" : "#0b0b14", color: bodyText }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 flex flex-col gap-4">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative"
          style={{
            background: isLight
              ? "linear-gradient(130deg, #fee2e2 0%, #fef3c7 60%, #fde8d8 100%)"
              : "linear-gradient(130deg, #3b0a0a 0%, #1c0e00 50%, #1a0a1e 100%)",
            border: isLight
              ? "1px solid rgba(239,68,68,0.2)"
              : "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, ${isLight ? "#dc2626" : "#ef4444"} 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck
                size={12}
                weight="fill"
                style={{ color: isLight ? "#dc2626" : "#f87171" }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: isLight ? "#dc2626" : "#f87171" }}
              >
                UNODC · Numbeo · World Prison Brief
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold font-sans leading-tight"
              style={{ color: headText }}
            >
              International Crime Statistics
            </h1>
            <p
              className="text-xs font-sans mt-1 max-w-lg"
              style={{ color: mutedText }}
            >
              Homicide rates, safety indices, incarceration, cybercrime, and
              crime category breakdowns across 190+ countries. Data from UNODC,
              Numbeo, and World Prison Brief. Homicide figures are the latest
              reported year per country, 2020 to 2023.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2 shrink-0">
            {[
              { v: "190+", l: "Countries" },
              { v: "6", l: "Categories" },
              { v: "2023", l: "Latest Data" },
              { v: "UNODC", l: "Primary Source" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl px-3 py-1.5 text-center"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.08)",
                  border: isLight
                    ? "1px solid rgba(239,68,68,0.18)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: headText }}
                >
                  {s.v}
                </p>
                <p
                  className="text-[10px] font-sans"
                  style={{ color: mutedText }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI PILLS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Global Homicide Rate",
              // World Bank world aggregate, VC.IHR.PSRC.P5: 5.20 in 2023
              // against 5.90 in 2015, a fall of 12%. Read 5.8 and "–8%",
              // neither of which matched the series.
              value: "5.2",
              unit: "/100k",
              delta: "–12% since 2015",
              positive: true,
              icon: Skull,
              color: "#ef4444",
            },
            {
              label: "Cybercrime Losses 2023",
              value: "$8T",
              unit: "USD",
              delta: "+15% YoY",
              positive: false,
              icon: MagnifyingGlass,
              color: "#6366f1",
            },
            {
              label: "Safest Country",
              value: "Iceland",
              unit: "Score 84.2",
              delta: "GPI #1 2023",
              positive: true,
              icon: ShieldCheck,
              color: "#10b981",
            },
            {
              label: "Highest Incarceration",
              value: "Cuba",
              unit: "794/100k",
              delta: "World Prison Brief",
              positive: false,
              icon: Lock,
              color: "#f59e0b",
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-2xl px-5 py-4 flex flex-col gap-1.5"
                style={{
                  background: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-[11px] font-sans uppercase tracking-widest leading-tight"
                    style={{ color: mutedText }}
                  >
                    {k.label}
                  </p>
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: k.color + "18" }}
                  >
                    <Icon size={14} weight="fill" style={{ color: k.color }} />
                  </div>
                </div>
                <p
                  className="text-2xl font-bold font-mono"
                  style={{ color: headText }}
                >
                  {k.value}
                  <span
                    className="text-sm font-normal ml-1"
                    style={{ color: mutedText }}
                  >
                    {k.unit}
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  {k.positive ? (
                    <ArrowDown size={11} weight="bold" color="#10b981" />
                  ) : (
                    <ArrowUp size={11} weight="bold" color="#ef4444" />
                  )}
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: k.positive ? "#10b981" : "#ef4444" }}
                  >
                    {k.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── ROW 1: Homicide Rates + Crime Trends ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Homicide Rates Bar Chart */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-end justify-between mb-4">
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-1"
                  style={{
                    color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)",
                  }}
                >
                  Homicide Rate per 100,000
                </p>
                <h2
                  className="text-base font-bold font-sans"
                  style={{ color: headText }}
                >
                  Murder &amp; Homicide Rates
                </h2>
              </div>
              <div
                className="flex rounded-lg overflow-hidden text-[10px] font-semibold"
                style={{
                  border: isLight
                    ? "1px solid rgba(0,0,0,0.1)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {(["highest", "safest"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setHomicideView(v)}
                    className="px-2.5 py-1 transition-colors capitalize"
                    style={{
                      background:
                        homicideView === v ? "#ef4444" : "transparent",
                      color: homicideView === v ? "#fff" : mutedText,
                    }}
                  >
                    {v === "highest" ? "Highest" : "Safest"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={homicideData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                barSize={10}
              >
                <CartesianGrid
                  stroke={gridLine}
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  tick={{
                    fontSize: 9,
                    fill: headText,
                    fontFamily: "sans-serif",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  tickFormatter={(v) => {
                    const item = HOMICIDE_RATES.find((r) => r.country === v);
                    return item ? `${item.flag} ${v}` : v;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, _name: string, entry: any) => [
                    `${v} per 100k`,
                    entry.payload.country,
                  ]}
                  labelFormatter={() => "Homicide Rate"}
                  cursor={{
                    fill: isLight
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(255,255,255,0.04)",
                  }}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {homicideData.map((entry, idx) => (
                    <Cell
                      key={entry.country}
                      fill={
                        homicideView === "highest"
                          ? `hsl(${Math.max(0, 10 - idx * 1.2)}, 85%, 52%)`
                          : `hsl(${142 + idx * 4}, 70%, 42%)`
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <SourceLink
              sources={[
                {
                  label: "UNODC Global Study on Homicide",
                  url: "https://unodc.org/unodc/en/data-and-analysis/homicide.html",
                },
                {
                  label: "World Bank Crime Data",
                  url: "https://data.worldbank.org/indicator/VC.IHR.PSRC.P5",
                },
              ]}
              className="mt-3"
            />
          </div>

          {/* Crime Trends Line Chart */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <SectionHeader
              title="Global Crime Trends by Category"
              sub="Index: 2015 = 100"
              badge="2015–2023"
              isLight={isLight}
            />
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={CRIME_TREND}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                  domain={[60, 380]}
                />
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, name: string) => [
                    `${v} (index)`,
                    name === "violent"
                      ? "Violent Crime"
                      : name === "property"
                        ? "Property Crime"
                        : name === "cyber"
                          ? "Cybercrime"
                          : "Drug Offenses",
                  ]}
                  labelStyle={{ color: mutedText, marginBottom: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="violent"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="property"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cyber"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: "#6366f1", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="drug"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="5 2"
                  dot={{ fill: "#a855f7", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center flex-wrap gap-4 mt-2 justify-center">
              {[
                { label: "Violent Crime", color: "#ef4444" },
                { label: "Property Crime", color: "#f59e0b" },
                { label: "Cybercrime ↑", color: "#6366f1" },
                { label: "Drug Offenses", color: "#a855f7" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div
                    className="w-3 h-0.5 rounded-full"
                    style={{ background: l.color }}
                  />
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: mutedText }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "UNODC Crime Trends",
                  url: "https://dataunodc.un.org/dp-crime-total-persons",
                },
                {
                  label: "INTERPOL Cybercrime Report",
                  url: "https://interpol.int/en/Crimes/Cybercrime",
                },
              ]}
              className="mt-3"
            />
          </div>
        </div>

        {/* ── ROW 2: Safety Ranking + Regional Crime Categories ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Safety Index Ranking */}
          <div
            className="lg:col-span-4 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <SectionHeader
              title="Global Safety Index"
              sub="Peace & Safety Score"
              badge="Top 20"
              isLight={isLight}
            />
            <div className="flex flex-col gap-2.5">
              {SAFETY_INDEX.map((item) => (
                <div key={item.country} className="flex items-center gap-2.5">
                  <span
                    className="text-[10px] font-mono w-5 text-right shrink-0"
                    style={{ color: mutedText }}
                  >
                    {item.rank}
                  </span>
                  <span className="text-base shrink-0">{item.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[11px] font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {item.country}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {item.change >= 0 ? (
                          <TrendUp size={10} weight="fill" color="#10b981" />
                        ) : (
                          <TrendDown size={10} weight="fill" color="#ef4444" />
                        )}
                        <span
                          className="text-[9px] font-mono"
                          style={{
                            color: item.change >= 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {item.change >= 0 ? "+" : ""}
                          {item.change}
                        </span>
                        <span
                          className="text-[10px] font-mono font-semibold ml-1"
                          style={{
                            color:
                              item.score >= 75
                                ? "#10b981"
                                : item.score >= 60
                                  ? "#22d3ee"
                                  : item.score >= 45
                                    ? "#f59e0b"
                                    : item.score >= 30
                                      ? "#f97316"
                                      : "#ef4444",
                          }}
                        >
                          {item.score}
                        </span>
                      </div>
                    </div>
                    <SafetyBar score={item.score} isLight={isLight} />
                  </div>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "Numbeo Crime Index",
                  url: "https://numbeo.com/crime/rankings_by_country.jsp",
                },
                {
                  label: "GPI 2023 - Institute for Economics & Peace",
                  url: "https://visionofhumanity.org/maps/#/",
                },
              ]}
              className="mt-4"
            />
          </div>

          {/* Regional Crime Categories */}
          <div
            className="lg:col-span-5 rounded-2xl p-5 flex flex-col"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <SectionHeader
              title="Crime Categories by Region"
              sub="Per 100,000 Population"
              isLight={isLight}
            />
            {/* Legend */}
            {/* Per-100k matrix.
                This replaced stacked proportion bars. Those normalised each
                row to 100%, which had two problems: homicide became a
                sub-pixel sliver (1.1 against a row total of 853 in W. Europe)
                even though it is the headline figure in the badge, and
                magnitude vanished entirely — L. America totals 1,924 and E.
                Asia 233, yet both drew a full-width bar. Thirty-two of the
                forty numbers were also hidden behind a click.

                A matrix shows every value at once and reads down a column as
                well as across a row. Shading is scaled within each column, not
                across the table, because a burglary rate of 620 and a homicide
                rate of 36.8 are not on the same scale and colouring them
                against one range would wash homicide out again. */}
            <div className="overflow-x-auto -mx-1 px-1 flex-1">
              <table className="w-full h-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-1.5 pr-2 sticky left-0">
                      <span
                        className="text-[9px] font-mono uppercase tracking-wider"
                        style={{ color: mutedText }}
                      >
                        Region
                      </span>
                    </th>
                    {CRIME_COLUMNS.map((c) => (
                      <th key={c.key} className="pb-2 px-1">
                        <span
                          className="text-[9px] font-mono uppercase tracking-wider"
                          style={{ color: CATEGORY_COLORS[c.key] }}
                        >
                          {c.short}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGIONAL_CRIME.map((region) => {
                    const dimmed =
                      selectedRegion !== null &&
                      selectedRegion !== region.region;
                    return (
                      <tr
                        key={region.region}
                        onClick={() =>
                          setSelectedRegion(
                            selectedRegion === region.region
                              ? null
                              : region.region,
                          )
                        }
                        className="cursor-pointer transition-opacity"
                        style={{ opacity: dimmed ? 0.4 : 1 }}
                      >
                        <td className="py-0.5 pr-2 whitespace-nowrap">
                          <span
                            className="text-[11px] font-semibold font-sans"
                            style={{ color: headText }}
                          >
                            {region.region}
                          </span>
                        </td>
                        {CRIME_COLUMNS.map((c) => {
                          const val = region[c.key];
                          const max = Math.max(
                            ...REGIONAL_CRIME.map((r) => r[c.key]),
                          );
                          // Floor the alpha so the lowest value in a column is
                          // still legible rather than fading to the card.
                          const alpha = 0.1 + (val / max) * 0.55;
                          return (
                            <td key={c.key} className="py-0.5 px-1">
                              <div
                                className="rounded-lg text-center py-1.5 transition-colors"
                                style={{
                                  background: `${CATEGORY_COLORS[c.key]}${hex(
                                    alpha,
                                  )}`,
                                  border: `1px solid ${CATEGORY_COLORS[c.key]}${hex(
                                    0.18 + (val / max) * 0.3,
                                  )}`,
                                }}
                                title={`${c.label}: ${val} per 100,000`}
                              >
                                <span
                                  className="text-[10px] font-mono font-semibold"
                                  style={{ color: headText }}
                                >
                                  {val}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <SourceLink
              sources={{
                label: "UNODC Crime Statistics",
                url: "https://dataunodc.un.org",
              }}
              className="mt-4"
            />
          </div>

          {/* Cybercrime + Incarceration */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Cybercrime Losses */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="Cybercrime Losses 2023"
                sub="Estimated USD Billions"
                isLight={isLight}
              />
              <div className="flex flex-col gap-2.5">
                {CYBERCRIME_LOSSES.map((item) => {
                  const maxLoss = Math.max(
                    ...CYBERCRIME_LOSSES.map((c) => c.loss),
                  );
                  return (
                    <div key={item.region} className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-sans w-24 shrink-0 truncate"
                        style={{ color: headText }}
                      >
                        {item.region}
                      </span>
                      <div
                        className="flex-1 h-3 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.06)"
                            : "rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.loss / maxLoss) * 100}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-mono w-10 text-right shrink-0"
                        style={{ color: item.color }}
                      >
                        ${item.loss}B
                      </span>
                    </div>
                  );
                })}
              </div>
              <div
                className="mt-3 rounded-xl p-3 flex items-start gap-2"
                style={{
                  background: isLight
                    ? "rgba(99,102,241,0.06)"
                    : "rgba(99,102,241,0.1)",
                  border: isLight
                    ? "1px solid rgba(99,102,241,0.15)"
                    : "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <Info
                  size={12}
                  weight="fill"
                  style={{ color: "#6366f1", flexShrink: 0, marginTop: 1 }}
                />
                <p
                  className="text-[10px] font-sans leading-relaxed"
                  style={{ color: mutedText }}
                >
                  Global cybercrime costs expected to reach{" "}
                  <strong style={{ color: headText }}>$10.5T</strong> annually
                  by 2025 — fastest growing crime category worldwide.
                </p>
              </div>
              <SourceLink
                sources={{
                  label: "Cybersecurity Ventures / IC3 Report",
                  url: "https://cybersecurityventures.com/cybercrime-damage-costs-10-trillion-by-2025",
                }}
                className="mt-3"
              />
            </div>

            {/* Incarceration Rates */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="Incarceration Rates"
                sub="Per 100,000 Population"
                isLight={isLight}
              />
              <div
                className="flex flex-col gap-2 overflow-y-auto"
                style={{ maxHeight: 260 }}
              >
                {[...INCARCERATION]
                  .sort((a, b) => b.rate - a.rate)
                  .map((item, idx) => {
                    const maxRate = Math.max(
                      ...INCARCERATION.map((i) => i.rate),
                    );
                    const color =
                      item.rate >= 400
                        ? "#ef4444"
                        : item.rate >= 200
                          ? "#f97316"
                          : item.rate >= 100
                            ? "#f59e0b"
                            : "#10b981";
                    return (
                      <div
                        key={item.country}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="text-[9px] font-mono w-4 text-right shrink-0"
                          style={{ color: mutedText }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm shrink-0">{item.flag}</span>
                        <span
                          className="text-[10px] font-sans w-24 truncate"
                          style={{ color: headText }}
                        >
                          {item.country}
                        </span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{
                            background: isLight
                              ? "rgba(0,0,0,0.06)"
                              : "rgba(255,255,255,0.07)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(item.rate / maxRate) * 100}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <span
                          className="text-[9px] font-mono w-8 text-right shrink-0"
                          style={{ color }}
                        >
                          {item.rate}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <SourceLink
                sources={{
                  label: "World Prison Brief 2023",
                  url: "https://prisonstudies.org/highest-to-lowest/prison_population_rate",
                }}
                className="mt-3"
              />
            </div>
          </div>
        </div>

        {/* ── TERRORISM SECTION ──────────────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-4 flex items-center gap-3"
          style={{
            background: isLight
              ? "linear-gradient(130deg, #fef2f2 0%, #fff7ed 100%)"
              : "linear-gradient(130deg, #2d0a0a 0%, #1c0800 100%)",
            border: isLight
              ? "1px solid rgba(239,68,68,0.2)"
              : "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{
              background: isLight
                ? "rgba(239,68,68,0.12)"
                : "rgba(239,68,68,0.2)",
            }}
          >
            <Flame size={18} weight="fill" style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: isLight ? "#dc2626" : "rgba(248,113,113,0.8)" }}
            >
              GTD · IEP Global Terrorism Index · START Program
            </p>
            <h2
              className="text-base font-bold font-sans"
              style={{ color: headText }}
            >
              Global Terrorism Statistics
            </h2>
            <p
              className="text-[11px] font-sans mt-0.5"
              style={{ color: mutedText }}
            >
              Incidents, casualties, most active groups, attack methods, and
              regional impact — 2010–2023
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 shrink-0">
            {[
              { v: "8,534", l: "Deaths 2023" },
              { v: "↓38%", l: "from 2014 peak" },
              { v: "Burkina Faso", l: "GTI #1 2024" },
              { v: "ISIS", l: "Most deadly" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl px-3 py-1.5 text-center hidden sm:block"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.07)",
                  border: isLight
                    ? "1px solid rgba(239,68,68,0.15)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: headText }}
                >
                  {s.v}
                </p>
                <p
                  className="text-[10px] font-sans"
                  style={{ color: mutedText }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── TERRORISM ROW 1: Trend + Regional Deaths ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Terrorism Incidents & Deaths Trend */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)" }}
              >
                Global Terrorism Trends · 2010–2023
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Incidents &amp; Deaths per Year
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={TERRORISM_TREND}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="terrorDeaths" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="terrorIncidents"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, name: string) => [
                    v.toLocaleString(),
                    name === "deaths" ? "Deaths" : "Incidents",
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="deaths"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#terrorDeaths)"
                  dot={{ fill: "#ef4444", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="incidents"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 2"
                  fill="url(#terrorIncidents)"
                  dot={{ fill: "#f97316", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center flex-wrap gap-4 mt-2 justify-center">
              {[
                { label: "Deaths (left axis)", color: "#ef4444", dash: false },
                {
                  label: "Incidents (right axis)",
                  color: "#f97316",
                  dash: true,
                },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div
                    className="w-5 h-0.5 rounded-full"
                    style={{
                      background: l.color,
                      backgroundImage: l.dash
                        ? `repeating-linear-gradient(to right, ${l.color} 0, ${l.color} 5px, transparent 5px, transparent 7px)`
                        : undefined,
                    }}
                  />
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: mutedText }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "Global Terrorism Database (GTD)",
                  url: "https://www.start.umd.edu/gtd/",
                },
                {
                  label: "IEP Global Terrorism Index 2024",
                  url: "https://www.visionofhumanity.org/maps/#/",
                },
              ]}
              className="mt-3"
            />
          </div>

          {/* Deaths by Region bar chart */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)" }}
              >
                Deaths by Region · 2023
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Regional Terrorism Impact
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[...TERRORISM_BY_REGION].sort(
                  (a, b) => b.deaths - a.deaths,
                )}
                layout="vertical"
                margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
                barSize={12}
              >
                <CartesianGrid
                  stroke={gridLine}
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  tick={{
                    fontSize: 9,
                    fill: headText,
                    fontFamily: "sans-serif",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, _name: string, entry: any) => [
                    `${v.toLocaleString()} deaths · ${entry.payload.incidents.toLocaleString()} incidents`,
                    entry.payload.region,
                  ]}
                  labelFormatter={() => "Terrorism 2023"}
                  cursor={{
                    fill: isLight
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(255,255,255,0.04)",
                  }}
                />
                <Bar dataKey="deaths" radius={[0, 4, 4, 0]}>
                  {[...TERRORISM_BY_REGION]
                    .sort((a, b) => b.deaths - a.deaths)
                    .map((entry) => (
                      <Cell key={entry.region} fill={entry.color} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <SourceLink
              sources={{
                label: "IEP Global Terrorism Index 2024",
                url: "https://www.visionofhumanity.org/maps/#/",
              }}
              className="mt-3"
            />
          </div>
        </div>

        {/* ── TERRORISM ROW 2: Groups + Attack Types + GTI ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Most deadly groups */}
          <div
            className="lg:col-span-5 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)" }}
              >
                Cumulative Deaths Caused · GTD
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Most Deadly Terrorist Groups
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[...TOP_TERROR_GROUPS].sort(
                  (a, b) => b.deaths - a.deaths,
                )}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                barSize={11}
              >
                <CartesianGrid
                  stroke={gridLine}
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="group"
                  tick={{
                    fontSize: 9,
                    fill: headText,
                    fontFamily: "sans-serif",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, _name: string, entry: any) => [
                    `${v.toLocaleString()} total deaths`,
                    `${entry.payload.group} · ${entry.payload.region}`,
                  ]}
                  labelFormatter={() => "Cumulative deaths caused"}
                  cursor={{
                    fill: isLight
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(255,255,255,0.04)",
                  }}
                />
                <Bar dataKey="deaths" radius={[0, 4, 4, 0]}>
                  {[...TOP_TERROR_GROUPS]
                    .sort((a, b) => b.deaths - a.deaths)
                    .map((entry) => (
                      <Cell key={entry.group} fill={entry.color} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <SourceLink
              sources={{
                label: "START Global Terrorism Database",
                url: "https://www.start.umd.edu/gtd/",
              }}
              className="mt-3"
            />
          </div>

          {/* Attack types donut + GTI ranking */}
          <div
            className="lg:col-span-3 rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)" }}
              >
                Attack Methods · GTD 2023
              </p>
              <h3
                className="text-sm font-bold font-sans"
                style={{ color: headText }}
              >
                Attack Type Breakdown
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={ATTACK_TYPES}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="pct"
                  nameKey="type"
                >
                  {ATTACK_TYPES.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {ATTACK_TYPES.map((a) => (
                <div key={a.type} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: a.color }}
                  />
                  <span
                    className="text-[10px] font-sans flex-1"
                    style={{ color: headText }}
                  >
                    {a.type}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: a.color }}
                  >
                    {a.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* GTI Rankings */}
          <div
            className="lg:col-span-4 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#ef4444" : "rgba(248,113,113,0.7)" }}
              >
                Global Terrorism Index 2024
              </p>
              <h3
                className="text-sm font-bold font-sans"
                style={{ color: headText }}
              >
                Most Impacted Countries
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {GTI_SCORES.map((item, idx) => (
                <div key={item.country} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono w-4 text-right shrink-0"
                    style={{ color: mutedText }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm shrink-0">{item.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[11px] font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {item.country}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {item.change > 0 ? (
                          <ArrowUp size={9} weight="bold" color="#ef4444" />
                        ) : (
                          <ArrowDown size={9} weight="bold" color="#10b981" />
                        )}
                        <span
                          className="text-[9px] font-mono font-bold"
                          style={{
                            color:
                              item.score >= 8
                                ? "#ef4444"
                                : item.score >= 7
                                  ? "#f97316"
                                  : "#f59e0b",
                          }}
                        >
                          {item.score}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.score / 10) * 100}%`,
                          background:
                            item.score >= 8
                              ? "#ef4444"
                              : item.score >= 7
                                ? "#f97316"
                                : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <SourceLink
              sources={{
                label: "IEP Global Terrorism Index 2024",
                url: "https://www.visionofhumanity.org/maps/#/",
              }}
              className="mt-4"
            />
          </div>
        </div>

        {/* ── MODERN SLAVERY SECTION HEADER ─────────────────────── */}
        <div
          className="rounded-2xl px-6 py-4 flex items-center gap-3"
          style={{
            background: isLight
              ? "linear-gradient(130deg, #fdf2ff 0%, #fff0fa 100%)"
              : "linear-gradient(130deg, #1e0a2e 0%, #1a0014 100%)",
            border: isLight
              ? "1px solid rgba(168,85,247,0.2)"
              : "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{
              background: isLight
                ? "rgba(168,85,247,0.12)"
                : "rgba(168,85,247,0.2)",
            }}
          >
            <Link size={18} weight="fill" style={{ color: "#a855f7" }} />
          </div>
          <div>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: isLight ? "#7c3aed" : "rgba(192,132,252,0.8)" }}
            >
              Walk Free Foundation · ILO · UNODC · Global Slavery Index 2023
            </p>
            <h2
              className="text-base font-bold font-sans"
              style={{ color: headText }}
            >
              Modern Slavery Statistics
            </h2>
            <p
              className="text-[11px] font-sans mt-0.5"
              style={{ color: mutedText }}
            >
              Forced labour, human trafficking, forced marriage, and government
              response scores across 160+ countries — 2023
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 shrink-0">
            {[
              { v: "49.6M", l: "Victims 2023" },
              { v: "63.5%", l: "Forced Labour" },
              { v: "N. Korea", l: "Highest Prevalence" },
              { v: "$236B", l: "Annual Profit" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl px-3 py-1.5 text-center hidden sm:block"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.07)",
                  border: isLight
                    ? "1px solid rgba(168,85,247,0.15)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: headText }}
                >
                  {s.v}
                </p>
                <p
                  className="text-[10px] font-sans"
                  style={{ color: mutedText }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SLAVERY KPIs ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "People in Modern Slavery",
              value: "49.6M",
              unit: "worldwide",
              delta: "+10M since 2016",
              positive: false,
              icon: Users,
              color: "#a855f7",
            },
            {
              label: "Forced Labour Victims",
              value: "27.6M",
              unit: "workers",
              delta: "$236B annual profit",
              positive: false,
              icon: Briefcase,
              color: "#f97316",
            },
            {
              label: "Forced Marriages",
              value: "22M",
              unit: "worldwide",
              delta: "Over half under 18",
              positive: false,
              icon: Heart,
              color: "#ef4444",
            },
            {
              label: "Trafficking Survivors ID\'d",
              value: "~50k",
              unit: "per year",
              delta: "Vast majority unreported",
              positive: false,
              icon: House,
              color: "#6366f1",
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-2xl px-5 py-4 flex flex-col gap-1.5"
                style={{
                  background: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-[11px] font-sans uppercase tracking-widest leading-tight"
                    style={{ color: mutedText }}
                  >
                    {k.label}
                  </p>
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: k.color + "18" }}
                  >
                    <Icon size={14} weight="fill" style={{ color: k.color }} />
                  </div>
                </div>
                <p
                  className="text-2xl font-bold font-mono"
                  style={{ color: headText }}
                >
                  {k.value}
                  <span
                    className="text-sm font-normal ml-1"
                    style={{ color: mutedText }}
                  >
                    {k.unit}
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUp size={11} weight="bold" color="#ef4444" />
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: "#ef4444" }}
                  >
                    {k.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SLAVERY ROW 1: Forms + Regional distribution ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Forms of Modern Slavery */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#7c3aed" : "rgba(192,132,252,0.7)" }}
              >
                ILO / Walk Free 2023
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Forms of Modern Slavery
              </h3>
            </div>
            <div className="space-y-3 mb-4">
              {SLAVERY_FORMS.map((f) => (
                <div key={f.form}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{f.icon}</span>
                      <span
                        className="text-[11px] font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {f.form}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: f.color }}
                    >
                      {f.pct}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.06)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.pct}%`, background: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background: isLight
                  ? "rgba(168,85,247,0.06)"
                  : "rgba(168,85,247,0.1)",
                border: isLight
                  ? "1px solid rgba(168,85,247,0.15)"
                  : "1px solid rgba(168,85,247,0.2)",
              }}
            >
              <Info
                size={12}
                weight="fill"
                style={{ color: "#a855f7", flexShrink: 0, marginTop: 1 }}
              />
              <p
                className="text-[10px] font-sans leading-relaxed"
                style={{ color: mutedText }}
              >
                Forced labour generates an estimated{" "}
                <strong style={{ color: headText }}>$236 billion</strong> in
                illegal profits per year globally (ILO 2024). Commercial sexual
                exploitation accounts for{" "}
                <strong style={{ color: headText }}>$99.2B</strong> alone.
              </p>
            </div>
            <SourceLink
              sources={[
                {
                  label: "ILO Global Estimates of Modern Slavery 2022",
                  url: "https://www.ilo.org/global/topics/forced-labour/WCMS_854733/lang--en/index.htm",
                },
                {
                  label: "Walk Free Global Slavery Index 2023",
                  url: "https://www.walkfree.org/global-slavery-index/",
                },
              ]}
              className="mt-3"
            />
          </div>

          {/* Regional Distribution */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#7c3aed" : "rgba(192,132,252,0.7)" }}
              >
                Victims by World Region · 2023
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Regional Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={SLAVERY_BY_REGION}
                layout="vertical"
                margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid
                  stroke={gridLine}
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}M`}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  tick={{
                    fontSize: 9,
                    fill: headText,
                    fontFamily: "sans-serif",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, _name: string, entry: any) => [
                    `${v}M victims · ${entry.payload.prevalence} per 1,000`,
                    entry.payload.region,
                  ]}
                  labelFormatter={() => "Modern Slavery"}
                  cursor={{
                    fill: isLight
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(255,255,255,0.04)",
                  }}
                />
                <Bar dataKey="victims" radius={[0, 4, 4, 0]}>
                  {SLAVERY_BY_REGION.map((entry) => (
                    <Cell key={entry.region} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Region cards */}
            <div className="grid grid-cols-5 gap-2 mt-3">
              {SLAVERY_BY_REGION.map((r) => (
                <div
                  key={r.region}
                  className="rounded-lg p-2 text-center"
                  style={{
                    background: r.color + "15",
                    border: `1px solid ${r.color}30`,
                  }}
                >
                  <p className="text-base mb-0.5">{r.flag}</p>
                  <p
                    className="text-[10px] font-bold font-mono"
                    style={{ color: r.color }}
                  >
                    {r.victims}M
                  </p>
                  <p
                    className="text-[8px] font-sans leading-tight mt-0.5"
                    style={{ color: mutedText }}
                  >
                    {r.prevalence}/1k
                  </p>
                </div>
              ))}
            </div>
            <SourceLink
              sources={{
                label: "Walk Free Global Slavery Index 2023",
                url: "https://www.walkfree.org/global-slavery-index/",
              }}
              className="mt-3"
            />
          </div>
        </div>

        {/* ── SLAVERY ROW 2: Countries + Forced Labour Economy + Government Response ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Highest victim countries */}
          <div
            className="lg:col-span-4 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#7c3aed" : "rgba(192,132,252,0.7)" }}
              >
                Absolute Victims (Millions) · GSI 2023
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Countries with Most Victims
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {SLAVERY_HIGH_COUNTRIES.map((item, idx) => {
                const maxV = SLAVERY_HIGH_COUNTRIES[0].victims;
                return (
                  <div key={item.country} className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-mono w-4 text-right shrink-0"
                      style={{ color: mutedText }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-base shrink-0">{item.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[11px] font-semibold font-sans truncate"
                          style={{ color: headText }}
                        >
                          {item.country}
                        </span>
                        <span
                          className="text-[10px] font-mono font-bold shrink-0 ml-1"
                          style={{ color: "#a855f7" }}
                        >
                          {item.victims}M
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.victims / maxV) * 100}%`,
                            background: "#a855f7",
                          }}
                        />
                      </div>
                      <p
                        className="text-[9px] font-mono mt-0.5"
                        style={{ color: mutedText }}
                      >
                        {item.prevalence} per 1,000 pop.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <SourceLink
              sources={{
                label: "Walk Free Global Slavery Index 2023",
                url: "https://www.walkfree.org/global-slavery-index/",
              }}
              className="mt-3"
            />
          </div>

          {/* Forced Labour by Sector economy */}
          <div
            className="lg:col-span-4 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="mb-4">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#7c3aed" : "rgba(192,132,252,0.7)" }}
              >
                Annual Illegal Profit ($B USD) · ILO 2024
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Forced Labour by Sector
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={FORCED_LABOUR_ECONOMY}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="sector"
                >
                  {FORCED_LABOUR_ECONOMY.map((entry) => (
                    <Cell key={entry.sector} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isLight ? "#fff" : "#1a1730",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.1)"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: headText,
                  }}
                  formatter={(v: number, name: string) => [
                    `$${v}B annual profit`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-1">
              {FORCED_LABOUR_ECONOMY.map((entry) => (
                <div key={entry.sector} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: entry.color }}
                  />
                  <span
                    className="text-[10px] font-sans flex-1"
                    style={{ color: headText }}
                  >
                    {entry.sector}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold shrink-0"
                    style={{ color: entry.color }}
                  >
                    ${entry.value}B
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 rounded-xl p-3 flex items-start gap-2"
              style={{
                background: isLight
                  ? "rgba(239,68,68,0.06)"
                  : "rgba(239,68,68,0.1)",
                border: isLight
                  ? "1px solid rgba(239,68,68,0.15)"
                  : "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <Info
                size={12}
                weight="fill"
                style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
              />
              <p
                className="text-[10px] font-sans leading-relaxed"
                style={{ color: mutedText }}
              >
                Sexual exploitation accounts for just 4.6% of victims but
                generates{" "}
                <strong style={{ color: headText }}>
                  42% of all illegal profits
                </strong>{" "}
                from forced labour.
              </p>
            </div>
            <SourceLink
              sources={{
                label:
                  "ILO Profits and Poverty: Economics of Forced Labour 2024",
                url: "https://www.ilo.org/global/topics/forced-labour/WCMS_854733/lang--en/index.htm",
              }}
              className="mt-3"
            />
          </div>

          {/* Government Response */}
          <div
            className="lg:col-span-4 rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: isLight ? "#7c3aed" : "rgba(192,132,252,0.7)" }}
              >
                GSI Government Response Score · 0–100
              </p>
              <h3
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Government Response
              </h3>
            </div>
            {/* Best responders */}
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-2"
                style={{ color: "#10b981" }}
              >
                ✅ Best Responders
              </p>
              <div className="flex flex-col gap-1.5">
                {BEST_RESPONDERS.map((item) => (
                  <div key={item.country} className="flex items-center gap-2">
                    <span className="text-sm shrink-0">{item.flag}</span>
                    <span
                      className="text-[10px] font-sans w-24 truncate"
                      style={{ color: headText }}
                    >
                      {item.country}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.06)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.score}%`,
                          background: "#10b981",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right shrink-0"
                      style={{ color: "#10b981" }}
                    >
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="h-px"
              style={{
                background: isLight
                  ? "rgba(0,0,0,0.08)"
                  : "rgba(255,255,255,0.08)",
              }}
            />
            {/* Worst responders */}
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-2"
                style={{ color: "#ef4444" }}
              >
                ❌ Weakest Responders
              </p>
              <div className="flex flex-col gap-1.5">
                {WORST_RESPONDERS.map((item) => (
                  <div key={item.country} className="flex items-center gap-2">
                    <span className="text-sm shrink-0">{item.flag}</span>
                    <span
                      className="text-[10px] font-sans w-24 truncate"
                      style={{ color: headText }}
                    >
                      {item.country}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.06)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(item.score, 2)}%`,
                          background: "#ef4444",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right shrink-0"
                      style={{ color: "#ef4444" }}
                    >
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <SourceLink
              sources={{
                label: "Walk Free GSI Government Response 2023",
                url: "https://www.walkfree.org/global-slavery-index/findings/government-response/",
              }}
              className="mt-auto"
            />
          </div>
        </div>

        {/* ── METHODOLOGY NOTE ──────────────────────────────────── */}
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: isLight
              ? "rgba(239,68,68,0.04)"
              : "rgba(239,68,68,0.08)",
            border: isLight
              ? "1px solid rgba(239,68,68,0.12)"
              : "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <Info
            size={14}
            weight="fill"
            style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
          />
          <div>
            <p
              className="text-[11px] font-bold font-sans mb-1"
              style={{ color: isLight ? "#dc2626" : "#f87171" }}
            >
              Data Methodology &amp; Limitations
            </p>
            <p
              className="text-[10px] font-sans leading-relaxed"
              style={{ color: mutedText }}
            >
              Crime statistics reflect official national records submitted to
              UNODC (latest reported year per country, 2020–2023). Reporting
              standards and definitions vary significantly across jurisdictions
              — homicide data is generally the most reliable, while property and
              drug offenses are heavily underreported in many nations. Safety
              index scores are composite metrics from Numbeo surveys and the
              Global Peace Index (Institute for Economics &amp; Peace).
              Cybercrime estimates (Cybersecurity Ventures) include direct
              costs, data breach recovery, and productivity losses. All
              per-capita figures use UN 2023 population estimates.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-3">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Crime Statistics · Data:
            UNODC 2023, Numbeo, GPI, World Prison Brief
          </p>
        </div>
      </div>
    </div>
  );
}
