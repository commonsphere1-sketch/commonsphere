import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  HandHeart,
  Warning,
  Drop,
  Baby,
  HouseSimple,
  ForkKnife,
  Virus,
  ArrowUp,
  ArrowDown,
  Users,
  Info,
} from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "../components/SourceLink";

/* ─── Data ──────────────────────────────────────────────────────────────── */

// Refugees & Displaced Persons (UNHCR 2023, millions)
const DISPLACEMENT_TREND = [
  { year: "2015", refugees: 21.3, idps: 40.8, asylum: 3.2 },
  { year: "2016", refugees: 22.5, idps: 40.3, asylum: 3.5 },
  { year: "2017", refugees: 25.4, idps: 40.0, asylum: 3.1 },
  { year: "2018", refugees: 26.0, idps: 41.3, asylum: 3.5 },
  { year: "2019", refugees: 26.0, idps: 45.7, asylum: 4.2 },
  { year: "2020", refugees: 26.4, idps: 48.0, asylum: 4.1 },
  { year: "2021", refugees: 27.1, idps: 53.2, asylum: 4.6 },
  { year: "2022", refugees: 35.3, idps: 62.5, asylum: 5.4 },
  { year: "2023", refugees: 43.4, idps: 68.3, asylum: 6.1 },
];

// Top refugee-hosting countries (UNHCR 2023, millions)
const TOP_HOSTS = [
  { country: "Iran", flag: "🇮🇷", millions: 3.4, color: "#f97316" },
  { country: "Turkey", flag: "🇹🇷", millions: 3.3, color: "#f59e0b" },
  { country: "Colombia", flag: "🇨🇴", millions: 2.9, color: "#eab308" },
  { country: "Germany", flag: "🇩🇪", millions: 2.5, color: "#10b981" },
  { country: "Pakistan", flag: "🇵🇰", millions: 2.0, color: "#22d3ee" },
  { country: "Uganda", flag: "🇺🇬", millions: 1.6, color: "#6366f1" },
  { country: "Russia", flag: "🇷🇺", millions: 1.3, color: "#8b5cf6" },
  { country: "Ethiopia", flag: "🇪🇹", millions: 1.1, color: "#ec4899" },
];

// Top origin countries (UNHCR 2023, millions displaced)
const TOP_ORIGINS = [
  { country: "Syria", flag: "🇸🇾", millions: 13.8, color: "#ef4444" },
  { country: "Ukraine", flag: "🇺🇦", millions: 10.0, color: "#3b82f6" },
  { country: "Afghanistan", flag: "🇦🇫", millions: 9.1, color: "#f97316" },
  { country: "Venezuela", flag: "🇻🇪", millions: 7.7, color: "#f59e0b" },
  { country: "South Sudan", flag: "🇸🇸", millions: 2.2, color: "#10b981" },
  { country: "Myanmar", flag: "🇲🇲", millions: 2.0, color: "#8b5cf6" },
  { country: "DRC", flag: "🇨🇩", millions: 1.9, color: "#ec4899" },
  { country: "Somalia", flag: "🇸🇴", millions: 1.0, color: "#6366f1" },
];

// Global Food Security (FAO / WFP 2023)
const HUNGER_TREND = [
  { year: "2015", hungry: 607, acuteFoodInsec: 135 },
  { year: "2016", hungry: 613, acuteFoodInsec: 142 },
  { year: "2017", hungry: 624, acuteFoodInsec: 151 },
  { year: "2018", hungry: 633, acuteFoodInsec: 159 },
  { year: "2019", hungry: 650, acuteFoodInsec: 175 },
  { year: "2020", hungry: 768, acuteFoodInsec: 272 },
  { year: "2021", hungry: 828, acuteFoodInsec: 309 },
  { year: "2022", hungry: 865, acuteFoodInsec: 333 },
  { year: "2023", hungry: 733, acuteFoodInsec: 282 },
];

// Hunger by region 2023 (FAO, % undernourished population)
const HUNGER_REGIONS = [
  { region: "Sub-Saharan Africa", pct: 22.6, color: "#ef4444" },
  { region: "Southern Asia", pct: 15.9, color: "#f97316" },
  { region: "Caribbean", pct: 16.1, color: "#f59e0b" },
  { region: "Oceania", pct: 6.6, color: "#eab308" },
  { region: "Southeast Asia", pct: 8.1, color: "#22d3ee" },
  { region: "Western Asia", pct: 10.5, color: "#6366f1" },
  { region: "Latin America", pct: 6.5, color: "#10b981" },
  { region: "East Asia", pct: 1.9, color: "#a3e635" },
  { region: "Northern Africa", pct: 4.2, color: "#8b5cf6" },
];

// Child mortality (UNICEF 2023, per 1000 live births, under-5)
const CHILD_MORTALITY = [
  { country: "Somalia", rate: 115, flag: "🇸🇴", region: "Africa" },
  { country: "Chad", rate: 107, flag: "🇹🇩", region: "Africa" },
  { country: "Nigeria", rate: 104, flag: "🇳🇬", region: "Africa" },
  { country: "CAR", rate: 99, flag: "🇨🇫", region: "Africa" },
  { country: "Sierra Leone", rate: 93, flag: "🇸🇱", region: "Africa" },
  { country: "Mali", rate: 91, flag: "🇲🇱", region: "Africa" },
  { country: "S. Sudan", rate: 90, flag: "🇸🇸", region: "Africa" },
  { country: "DRC", rate: 85, flag: "🇨🇩", region: "Africa" },
  { country: "Afghanistan", rate: 58, flag: "🇦🇫", region: "Asia" },
  { country: "Yemen", rate: 52, flag: "🇾🇪", region: "Middle East" },
  { country: "USA", rate: 6, flag: "🇺🇸", region: "Americas" },
  { country: "UK", rate: 4, flag: "🇬🇧", region: "Europe" },
  { country: "Japan", rate: 2, flag: "🇯🇵", region: "Asia" },
  { country: "Finland", rate: 2, flag: "🇫🇮", region: "Europe" },
];

// Global child mortality trend (UNICEF, deaths per 1000 live births, world avg)
const CHILD_MORTALITY_TREND = [
  { year: "2000", rate: 76 },
  { year: "2005", rate: 65 },
  { year: "2010", rate: 51 },
  { year: "2015", rate: 43 },

  { year: "2018", rate: 38 },
  { year: "2020", rate: 37 },
  { year: "2021", rate: 38 },
  { year: "2022", rate: 37 },
  { year: "2023", rate: 36 },
];

// Humanitarian Aid Funding (UN OCHA FTS 2023, $bn)
const AID_FUNDING = [
  { year: "2015", required: 19.9, funded: 12.1 },
  { year: "2016", required: 22.1, funded: 13.4 },
  { year: "2017", required: 22.2, funded: 14.5 },
  { year: "2018", required: 24.7, funded: 16.5 },
  { year: "2019", required: 28.0, funded: 19.0 },
  { year: "2020", required: 35.2, funded: 21.4 },
  { year: "2021", required: 39.8, funded: 22.2 },
  { year: "2022", required: 49.0, funded: 27.9 },
  { year: "2023", required: 55.8, funded: 26.2 },
];

// Top humanitarian donor countries 2023 ($bn, OECD DAC)
const TOP_DONORS = [
  { country: "USA", flag: "🇺🇸", bn: 18.0, pctGni: 0.24, color: "#3b82f6" },
  { country: "Germany", flag: "🇩🇪", bn: 5.8, pctGni: 0.66, color: "#10b981" },
  { country: "Japan", flag: "🇯🇵", bn: 4.5, pctGni: 0.34, color: "#f97316" },
  { country: "UK", flag: "🇬🇧", bn: 4.0, pctGni: 0.5, color: "#8b5cf6" },
  { country: "France", flag: "🇫🇷", bn: 3.9, pctGni: 0.5, color: "#6366f1" },
  { country: "Sweden", flag: "🇸🇪", bn: 2.1, pctGni: 0.9, color: "#22d3ee" },
  {
    country: "Netherlands",
    flag: "🇳🇱",
    bn: 1.9,
    pctGni: 0.67,
    color: "#f59e0b",
  },
  { country: "Norway", flag: "🇳🇴", bn: 1.6, pctGni: 1.1, color: "#ec4899" },
];

// Active crises & affected populations (OCHA 2024)
const ACTIVE_CRISES = [
  {
    name: "Gaza / Palestine",
    affected: 2.2,
    type: "Conflict",
    severity: "Critical",
    color: "#ef4444",
    flag: "🇵🇸",
  },
  {
    name: "Sudan",
    affected: 18.0,
    type: "Conflict + Famine",
    severity: "Critical",
    color: "#ef4444",
    flag: "🇸🇩",
  },
  {
    name: "Ukraine",
    affected: 14.6,
    type: "Conflict",
    severity: "Critical",
    color: "#ef4444",
    flag: "🇺🇦",
  },
  {
    name: "Yemen",
    affected: 21.6,
    type: "Conflict + Food",
    severity: "Critical",
    color: "#ef4444",
    flag: "🇾🇪",
  },
  {
    name: "Ethiopia",
    affected: 15.8,
    type: "Conflict + Climate",
    severity: "Serious",
    color: "#f97316",
    flag: "🇪🇹",
  },
  {
    name: "Syria",
    affected: 16.7,
    type: "Conflict",
    severity: "Serious",
    color: "#f97316",
    flag: "🇸🇾",
  },
  {
    name: "DRC",
    affected: 23.4,
    type: "Conflict + Disease",
    severity: "Serious",
    color: "#f97316",
    flag: "🇨🇩",
  },
  {
    name: "Somalia",
    affected: 7.1,
    type: "Drought + Conflict",
    severity: "Serious",
    color: "#f97316",
    flag: "🇸🇴",
  },
  {
    name: "Haiti",
    affected: 5.5,
    type: "Instability + Food",
    severity: "Serious",
    color: "#f97316",
    flag: "🇭🇹",
  },
  {
    name: "Afghanistan",
    affected: 23.7,
    type: "Governance + Food",
    severity: "Serious",
    color: "#f97316",
    flag: "🇦🇫",
  },
];

// Access to clean water (WHO/UNICEF 2022, % population)
const WATER_ACCESS = [
  { country: "Norway", safe: 100, flag: "🇳🇴" },
  { country: "Germany", safe: 100, flag: "🇩🇪" },
  { country: "USA", safe: 99, flag: "🇺🇸" },
  { country: "Brazil", safe: 88, flag: "🇧🇷" },
  { country: "India", safe: 73, flag: "🇮🇳" },
  { country: "Nigeria", safe: 43, flag: "🇳🇬" },
  { country: "Ethiopia", safe: 42, flag: "🇪🇹" },
  { country: "DRC", safe: 34, flag: "🇨🇩" },
  { country: "Chad", safe: 30, flag: "🇹🇩" },
  { country: "Somalia", safe: 27, flag: "🇸🇴" },
];

// Global disease burden / epidemic data (WHO 2023)
const DISEASE_BURDEN = [
  {
    disease: "Malaria",
    deathsPer100k: 19.4,
    region: "Sub-Saharan Africa",
    color: "#ef4444",
  },
  {
    disease: "HIV/AIDS",
    deathsPer100k: 11.2,
    region: "Global",
    color: "#f97316",
  },
  { disease: "TB", deathsPer100k: 14.5, region: "Global", color: "#f59e0b" },
  {
    disease: "COVID-19",
    deathsPer100k: 9.1,
    region: "Global",
    color: "#8b5cf6",
  },
  {
    disease: "Cholera",
    deathsPer100k: 1.4,
    region: "South Asia / Africa",
    color: "#22d3ee",
  },
  {
    disease: "Measles",
    deathsPer100k: 0.6,
    region: "Africa / Asia",
    color: "#10b981",
  },
];

// World Leader commentary on humanitarian issues (static)
const LEADER_STATEMENTS = [
  {
    leader: "António Guterres",
    title: "UN Secretary-General",
    flag: "🇺🇳",
    color: "#3b82f6",
    initials: "AG",
    statement:
      "The world is failing humanity's most vulnerable. With 117 million people forcibly displaced and 733 million going hungry, we face a humanitarian crisis of unprecedented scale. Global solidarity — not nationalism — is the only answer.",
    date: "Feb 2024",
    topic: "Global Displacement & Hunger",
  },
  {
    leader: "Volodymyr Zelensky",
    title: "President of Ukraine",
    flag: "🇺🇦",
    color: "#f59e0b",
    initials: "VZ",
    statement:
      "Ten million Ukrainians have been forced from their homes. Every day of war prolongs this humanitarian catastrophe. We call on partners to maintain support not just militarily, but for the civilians caught in the crossfire.",
    date: "Jan 2024",
    topic: "Ukraine Displacement Crisis",
  },
  {
    leader: "Narendra Modi",
    title: "Prime Minister of India",
    flag: "🇮🇳",
    color: "#f97316",
    initials: "NM",
    statement:
      "India has always stood by those in need. We have committed $1 billion in humanitarian assistance across South Asia and Africa. But international institutions must reform to reflect the weight developing nations carry in responding to these crises.",
    date: "Sep 2023",
    topic: "G20 & Development Aid",
  },
  {
    leader: "Tedros Adhanom",
    title: "WHO Director-General",
    flag: "🇺🇳",
    color: "#10b981",
    initials: "TA",
    statement:
      "Health is a human right, not a privilege. Yet 4.5 billion people lack access to essential health services. Cholera, malaria, and measles are surging in conflict zones. The next pandemic will find us no more prepared unless we invest now.",
    date: "Mar 2024",
    topic: "Global Health Access",
  },
  {
    leader: "Samantha Power",
    title: "USAID Administrator",
    flag: "🇺🇸",
    color: "#6366f1",
    initials: "SP",
    statement:
      "The Sudan crisis is the world's largest displacement emergency and yet it remains chronically underfunded. The international community must stop treating African crises as second-tier. A child in Darfur has the same rights as a child in Warsaw.",
    date: "Apr 2024",
    topic: "Sudan & Africa Funding Gap",
  },
  {
    leader: "Filippo Grandi",
    title: "UNHCR High Commissioner",
    flag: "🇺🇳",
    color: "#8b5cf6",
    initials: "FG",
    statement:
      "117 million people forcibly displaced is not just a statistic — it represents the failure of conflict prevention. We must address root causes: climate change, governance collapse, and impunity for atrocity crimes.",
    date: "Jun 2024",
    topic: "Forced Displacement Record",
  },
];

// Analyst commentary
const ANALYST_COMMENTS = [
  {
    name: "Dr. Sarah Chen",
    role: "Senior Economist · CommonSphere",
    initials: "SC",
    color: "#6366f1",
    comment:
      "The humanitarian funding gap reached $29.6bn in 2023 — a record shortfall. Donor fatigue is real: Ukraine absorbed a disproportionate share of Western ODA, inadvertently squeezing allocations to Sudan, Yemen, and the Sahel. This geopolitical triage has quantifiable mortality consequences.",
    tags: ["Funding Gap", "ODA", "Donor Fatigue"],
  },
  {
    name: "Marcus Webb",
    role: "Geopolitical Analyst · CommonSphere",
    initials: "MW",
    color: "#10b981",
    comment:
      "The DRC situation is structurally under-reported. 23 million people face acute food insecurity, M23 control of Goma is reshaping regional power dynamics, and Rwanda's support for rebel factions creates a proxy war dynamic reminiscent of the 1998–2003 Congo War. Humanitarian access is the first casualty.",
    tags: ["DRC", "Conflict", "Access"],
  },
  {
    name: "Priya Nair",
    role: "Policy Strategist · CommonSphere",
    initials: "PN",
    color: "#f97316",
    comment:
      "Afghanistan's humanitarian model has no precedent: a de-facto government internationally unrecognized, operating with $4.4bn in annual aid dependence while systematically excluding half the population from education and employment. Aid architecture built for emergency is now load-bearing infrastructure.",
    tags: ["Afghanistan", "Policy", "Gender"],
  },
  {
    name: "James Okafor",
    role: "Defense & Security · CommonSphere",
    initials: "JO",
    color: "#ec4899",
    comment:
      "Sudan's RSF and SAF are both using starvation as a weapon of war — this is a documented violation of IHL Article 54. The Security Council's paralysis (Russia/China blocking resolutions) means accountability mechanisms are inoperative. Famine in North Darfur is not a natural disaster; it's engineered.",
    tags: ["Sudan", "IHL", "Accountability"],
  },
];

/* ─── Helper ─────────────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  sub,
  trend,
  cardBg,
  cardBorder,
  headText,
  mutedText,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  cardBg: string;
  cardBorder: string;
  headText: string;
  mutedText: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: cardBg, border: cardBorder }}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl" style={{ background: iconBg }}>
          <Icon size={16} weight="fill" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span
            className="flex items-center gap-0.5 text-[10px] font-mono font-semibold"
            style={{
              color:
                trend === "up"
                  ? "#ef4444"
                  : trend === "down"
                    ? "#10b981"
                    : "#f59e0b",
            }}
          >
            {trend === "up" ? (
              <ArrowUp size={10} weight="bold" />
            ) : trend === "down" ? (
              <ArrowDown size={10} weight="bold" />
            ) : null}
            {trend === "up"
              ? "worsening"
              : trend === "down"
                ? "improving"
                : "stable"}
          </span>
        )}
      </div>
      <p
        className="text-2xl font-bold font-mono leading-none"
        style={{ color: headText }}
      >
        {value}
      </p>
      <p
        className="text-[11px] font-semibold font-sans"
        style={{ color: headText }}
      >
        {label}
      </p>
      {sub && (
        <p className="text-[10px] font-sans" style={{ color: mutedText }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export function HumanitarianPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* theme tokens */
  const bg = isLight ? "#f8fafc" : "#0b0b14";
  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  return (
    <div
      className="min-h-screen animate-fade-in"
      style={{ background: bg, color: bodyText }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── HERO BANNER ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{
            background: isLight
              ? "linear-gradient(130deg,#fff7ed 0%,#fef3c7 50%,#ecfdf5 100%)"
              : "linear-gradient(130deg,#150a00 0%,#0d1a0d 50%,#00150d 100%)",
            border: isLight
              ? "1px solid rgba(16,185,129,0.2)"
              : "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div className="flex-1">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: isLight ? "#065f46" : "rgba(52,211,153,0.8)" }}
            >
              UNHCR · WFP · WHO · OCHA · UNICEF · World Bank · 2023–2024
            </p>
            <h1
              className="text-xl font-bold font-sans"
              style={{ color: headText }}
            >
              Global Humanitarian Statistics
            </h1>
            <p
              className="text-[12px] font-sans mt-1"
              style={{ color: mutedText }}
            >
              Displacement, food security, child mortality, aid funding, water
              access, disease burden — with commentary from world leaders and
              analysts.
            </p>
          </div>
          {/* KPI strip */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {[
              { v: "117M", l: "Displaced" },
              { v: "733M", l: "Hungry" },
              { v: "$29.6bn", l: "Funding Gap" },
              { v: "4.5bn", l: "No Health Access" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl px-3 py-2 text-center"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.06)",
                  border: isLight
                    ? "1px solid rgba(16,185,129,0.2)"
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
                  className="text-[9px] font-sans"
                  style={{ color: mutedText }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW                                                       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              iconColor="#ef4444"
              iconBg="rgba(239,68,68,0.12)"
              value="117M"
              label="Forcibly Displaced"
              sub="Highest ever recorded · UNHCR 2023"
              trend="up"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={ForkKnife}
              iconColor="#f97316"
              iconBg="rgba(249,115,22,0.12)"
              value="733M"
              label="Chronically Hungry"
              sub="9.2% of world population · FAO 2023"
              trend="up"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={Baby}
              iconColor="#8b5cf6"
              iconBg="rgba(139,92,246,0.12)"
              value="5M"
              label="Child Deaths U-5 / year"
              sub="Improving: was 12.4M in 2000 · UNICEF"
              trend="down"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={Drop}
              iconColor="#22d3ee"
              iconBg="rgba(34,211,238,0.12)"
              value="2.2bn"
              label="Lack Safe Drinking Water"
              sub="WHO/UNICEF JMP 2022"
              trend="down"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={HandHeart}
              iconColor="#10b981"
              iconBg="rgba(16,185,129,0.12)"
              value="$55.8bn"
              label="Aid Required in 2023"
              sub="UN OCHA FTS — only 47% funded"
              trend="up"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={Warning}
              iconColor="#f59e0b"
              iconBg="rgba(245,158,11,0.12)"
              value="43.4M"
              label="Refugees Worldwide"
              sub="Highest since WW2 · UNHCR 2023"
              trend="up"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={Virus}
              iconColor="#6366f1"
              iconBg="rgba(99,102,241,0.12)"
              value="4.5bn"
              label="Without Essential Health Care"
              sub="WHO 2023 universal health coverage"
              trend="neutral"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
            <StatCard
              icon={HouseSimple}
              iconColor="#ec4899"
              iconBg="rgba(236,72,153,0.12)"
              value="68.3M"
              label="Internally Displaced"
              sub="Within own borders · IDMC 2023"
              trend="up"
              cardBg={cardBg}
              cardBorder={cardBorder}
              headText={headText}
              mutedText={mutedText}
            />
          </div>

          {/* Active Crises */}
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
                style={{
                  color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                }}
              >
                UN OCHA 2024 · People In Need
              </p>
              <h2
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Active Humanitarian Crises
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ACTIVE_CRISES.map((c) => (
                <div
                  key={c.name}
                  className="rounded-xl p-3.5 flex flex-col gap-2"
                  style={{
                    background: c.color + "10",
                    border: `1px solid ${c.color}25`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{c.flag}</span>
                    <span
                      className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: c.color + "20", color: c.color }}
                    >
                      {c.severity}
                    </span>
                  </div>
                  <p
                    className="text-[11px] font-bold font-sans leading-tight"
                    style={{ color: headText }}
                  >
                    {c.name}
                  </p>
                  <p
                    className="text-lg font-bold font-mono leading-none"
                    style={{ color: c.color }}
                  >
                    {c.affected}M
                  </p>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    people in need
                  </p>
                  <p
                    className="text-[9px] font-mono"
                    style={{ color: mutedText }}
                  >
                    {c.type}
                  </p>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "UN OCHA Humanitarian Needs Overview",
                  url: "https://www.unocha.org/global-humanitarian-overview",
                },
              ]}
              className="mt-4"
            />
          </div>

          {/* Aid funding gap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{
                  color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                }}
              >
                UN OCHA FTS · $bn
              </p>
              <h3
                className="text-sm font-bold font-sans mb-4"
                style={{ color: headText }}
              >
                Humanitarian Aid: Required vs Funded (2015–2023)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={AID_FUNDING}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                  barGap={2}
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
                    tickFormatter={(v) => `$${v}bn`}
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
                      `$${v}bn`,
                      name === "required" ? "Required" : "Funded",
                    ]}
                  />
                  <Bar
                    dataKey="required"
                    fill={isLight ? "#fca5a5" : "#7f1d1d"}
                    radius={[4, 4, 0, 0]}
                    name="required"
                  />
                  <Bar
                    dataKey="funded"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="funded"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { c: isLight ? "#fca5a5" : "#7f1d1d", l: "Required" },
                  { c: "#10b981", l: "Funded" },
                ].map((l) => (
                  <div key={l.l} className="flex items-center gap-1">
                    <div
                      className="w-3 h-2 rounded-sm"
                      style={{ background: l.c }}
                    />
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: mutedText }}
                    >
                      {l.l}
                    </span>
                  </div>
                ))}
              </div>
              <SourceLink
                sources={[
                  { label: "UN OCHA FTS", url: "https://fts.unocha.org" },
                ]}
                className="mt-3"
              />
            </div>

            {/* Top donors */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{
                  color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                }}
              >
                OECD DAC 2023
              </p>
              <h3
                className="text-sm font-bold font-sans mb-4"
                style={{ color: headText }}
              >
                Top Humanitarian Donor Countries
              </h3>
              <div className="flex flex-col gap-3">
                {TOP_DONORS.map((d) => (
                  <div key={d.country} className="flex items-center gap-3">
                    <span className="text-base w-6 shrink-0">{d.flag}</span>
                    <span
                      className="text-[11px] font-sans w-24 shrink-0"
                      style={{ color: headText }}
                    >
                      {d.country}
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
                          width: `${(d.bn / 18) * 100}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold w-10 text-right shrink-0"
                      style={{ color: d.color }}
                    >
                      ${d.bn}bn
                    </span>
                    <span
                      className="text-[9px] font-mono w-12 text-right shrink-0"
                      style={{ color: mutedText }}
                    >
                      {d.pctGni}% GNI
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-3 rounded-xl p-3 flex items-start gap-2"
                style={{
                  background: isLight
                    ? "rgba(245,158,11,0.06)"
                    : "rgba(245,158,11,0.1)",
                  border: isLight
                    ? "1px solid rgba(245,158,11,0.15)"
                    : "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Info
                  size={12}
                  weight="fill"
                  style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}
                />
                <p
                  className="text-[10px] font-sans leading-relaxed"
                  style={{ color: mutedText }}
                >
                  The UN target is{" "}
                  <strong style={{ color: headText }}>0.7% of GNI</strong> for
                  official development assistance. Only Norway, Sweden,
                  Luxembourg, and a handful of others consistently meet this
                  target.
                </p>
              </div>
              <SourceLink
                sources={[
                  {
                    label: "OECD DAC Statistics",
                    url: "https://stats.oecd.org/Index.aspx?DataSetCode=TABLE1",
                  },
                ]}
                className="mt-3"
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* DISPLACEMENT                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl px-4 py-2 flex items-center gap-2"
            style={{
              background: isLight
                ? "rgba(239,68,68,0.07)"
                : "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Warning size={14} weight="fill" style={{ color: "#ef4444" }} />
            <span
              className="text-[11px] font-bold font-mono uppercase tracking-widest"
              style={{ color: "#ef4444" }}
            >
              Displacement
            </span>
          </div>
          {/* Trend chart */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: isLight ? "#065f46" : "rgba(52,211,153,0.7)" }}
            >
              UNHCR Global Trends · Millions of people · 2015–2023
            </p>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              Global Forced Displacement Trend
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={DISPLACEMENT_TREND}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad-idp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#ef4444"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="grad-ref" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#f97316"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="grad-asy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.02}
                    />
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
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}M`}
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
                    `${v}M people`,
                    name === "idps"
                      ? "IDPs"
                      : name === "refugees"
                        ? "Refugees"
                        : "Asylum Seekers",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="idps"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#grad-idp)"
                />
                <Area
                  type="monotone"
                  dataKey="refugees"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#grad-ref)"
                />
                <Area
                  type="monotone"
                  dataKey="asylum"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#grad-asy)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {[
                { c: "#ef4444", l: "Internally Displaced (IDPs)" },
                { c: "#f97316", l: "Refugees" },
                { c: "#8b5cf6", l: "Asylum Seekers" },
              ].map((l) => (
                <div key={l.l} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-0.5 rounded-full"
                    style={{ background: l.c }}
                  />
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: mutedText }}
                  >
                    {l.l}
                  </span>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "UNHCR Global Trends 2023",
                  url: "https://www.unhcr.org/global-trends",
                },
              ]}
              className="mt-3"
            />
          </div>

          {/* Host countries + Origins */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top hosting */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{
                  color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                }}
              >
                UNHCR 2023 · Millions
              </p>
              <h3
                className="text-sm font-bold font-sans mb-4"
                style={{ color: headText }}
              >
                Top Refugee Hosting Countries
              </h3>
              <div className="flex flex-col gap-3">
                {TOP_HOSTS.map((h) => (
                  <div key={h.country} className="flex items-center gap-2">
                    <span className="text-base w-6 shrink-0">{h.flag}</span>
                    <span
                      className="text-[11px] font-sans w-24 shrink-0"
                      style={{ color: headText }}
                    >
                      {h.country}
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
                          width: `${(h.millions / 3.4) * 100}%`,
                          background: h.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold w-10 text-right shrink-0"
                      style={{ color: h.color }}
                    >
                      {h.millions}M
                    </span>
                  </div>
                ))}
              </div>
              <SourceLink
                sources={[
                  {
                    label: "UNHCR Refugee Data Finder",
                    url: "https://www.unhcr.org/refugee-statistics",
                  },
                ]}
                className="mt-4"
              />
            </div>

            {/* Top origins */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{
                  color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                }}
              >
                UNHCR 2023 · Millions displaced
              </p>
              <h3
                className="text-sm font-bold font-sans mb-4"
                style={{ color: headText }}
              >
                Countries of Origin (Total Displaced)
              </h3>
              <div className="flex flex-col gap-3">
                {TOP_ORIGINS.map((o) => (
                  <div key={o.country} className="flex items-center gap-2">
                    <span className="text-base w-6 shrink-0">{o.flag}</span>
                    <span
                      className="text-[11px] font-sans w-24 shrink-0"
                      style={{ color: headText }}
                    >
                      {o.country}
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
                          width: `${(o.millions / 13.8) * 100}%`,
                          background: o.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold w-10 text-right shrink-0"
                      style={{ color: o.color }}
                    >
                      {o.millions}M
                    </span>
                  </div>
                ))}
              </div>
              <SourceLink
                sources={[
                  {
                    label: "UNHCR Global Trends",
                    url: "https://www.unhcr.org/global-trends",
                  },
                  {
                    label: "IDMC Global Report",
                    url: "https://www.internal-displacement.org/global-report",
                  },
                ]}
                className="mt-4"
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* FOOD & HUNGER                                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl px-4 py-2 flex items-center gap-2"
            style={{
              background: isLight
                ? "rgba(249,115,22,0.07)"
                : "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            <ForkKnife size={14} weight="fill" style={{ color: "#f97316" }} />
            <span
              className="text-[11px] font-bold font-mono uppercase tracking-widest"
              style={{ color: "#f97316" }}
            >
              Food &amp; Hunger
            </span>
          </div>
          {/* Hunger trend */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: isLight ? "#065f46" : "rgba(52,211,153,0.7)" }}
            >
              FAO / WFP · Millions of people · 2015–2023
            </p>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              Global Hunger Trend — COVID-19 Reversal
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart
                data={HUNGER_TREND}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad-hungry" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#f97316"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="grad-acute" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#ef4444"
                      stopOpacity={0.02}
                    />
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
                  tick={{
                    fontSize: 9,
                    fill: mutedText,
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}M`}
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
                    `${v}M people`,
                    name === "hungry"
                      ? "Chronically Undernourished"
                      : "Acute Food Insecurity",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="hungry"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#grad-hungry)"
                />
                <Area
                  type="monotone"
                  dataKey="acuteFoodInsec"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#grad-acute)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {[
                { c: "#f97316", l: "Chronically Undernourished" },
                { c: "#ef4444", l: "Acute Food Insecurity (IPC 3+)" },
              ].map((l) => (
                <div key={l.l} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-0.5 rounded-full"
                    style={{ background: l.c }}
                  />
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: mutedText }}
                  >
                    {l.l}
                  </span>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "FAO State of Food Security 2023",
                  url: "https://www.fao.org/state-of-food-security-nutrition",
                },
                {
                  label: "WFP Food Security Data",
                  url: "https://hungermap.wfp.org",
                },
              ]}
              className="mt-3"
            />
          </div>

          {/* Regional hunger bars */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: isLight ? "#065f46" : "rgba(52,211,153,0.7)" }}
            >
              FAO 2023 · % of regional population undernourished
            </p>
            <h3
              className="text-sm font-bold font-sans mb-5"
              style={{ color: headText }}
            >
              Hunger Rate by Region
            </h3>
            <div className="flex flex-col gap-3.5">
              {[...HUNGER_REGIONS]
                .sort((a, b) => b.pct - a.pct)
                .map((r) => (
                  <div key={r.region} className="flex items-center gap-3">
                    <span
                      className="text-[11px] font-sans w-44 shrink-0 truncate"
                      style={{ color: headText }}
                    >
                      {r.region}
                    </span>
                    <div
                      className="flex-1 h-4 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.06)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full flex items-center pl-2 transition-all"
                        style={{
                          width: `${(r.pct / 23) * 100}%`,
                          background: r.color,
                        }}
                      >
                        {r.pct > 10 && (
                          <span className="text-[8px] font-mono text-white font-bold">
                            {r.pct}%
                          </span>
                        )}
                      </div>
                    </div>
                    {r.pct <= 10 && (
                      <span
                        className="text-[10px] font-mono font-bold w-8 shrink-0"
                        style={{ color: r.color }}
                      >
                        {r.pct}%
                      </span>
                    )}
                  </div>
                ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "FAO SOFI 2023",
                  url: "https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world",
                },
              ]}
              className="mt-4"
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HEALTH & WATER                                                 */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl px-4 py-2 flex items-center gap-2"
            style={{
              background: isLight
                ? "rgba(34,211,238,0.07)"
                : "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <Drop size={14} weight="fill" style={{ color: "#22d3ee" }} />
            <span
              className="text-[11px] font-bold font-mono uppercase tracking-widest"
              style={{ color: "#22d3ee" }}
            >
              Health &amp; Water
            </span>
          </div>
          {/* Child mortality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{
                  color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                }}
              >
                UNICEF 2023 · Deaths per 1,000 live births (under-5)
              </p>
              <h3
                className="text-sm font-bold font-sans mb-4"
                style={{ color: headText }}
              >
                Child Mortality Rate — Global Comparison
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={[...CHILD_MORTALITY].sort((a, b) => b.rate - a.rate)}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
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
                    domain={[0, 125]}
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
                    width={80}
                    tickFormatter={(v) => {
                      const item = CHILD_MORTALITY.find((r) => r.country === v);
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
                      `${v} per 1,000`,
                      entry.payload.country,
                    ]}
                    labelFormatter={() => "Under-5 Mortality"}
                    cursor={{
                      fill: isLight
                        ? "rgba(0,0,0,0.03)"
                        : "rgba(255,255,255,0.04)",
                    }}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {[...CHILD_MORTALITY]
                      .sort((a, b) => b.rate - a.rate)
                      .map((entry) => (
                        <Cell
                          key={entry.country}
                          fill={
                            entry.rate > 80
                              ? "#ef4444"
                              : entry.rate > 40
                                ? "#f97316"
                                : entry.rate > 10
                                  ? "#f59e0b"
                                  : "#10b981"
                          }
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <SourceLink
                sources={[
                  {
                    label: "UNICEF Child Mortality",
                    url: "https://data.unicef.org/topic/child-survival/under-five-mortality/",
                  },
                ]}
                className="mt-3"
              />
            </div>

            {/* Child mortality trend */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-1"
                  style={{
                    color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                  }}
                >
                  World Average · 2000–2023
                </p>
                <h3
                  className="text-sm font-bold font-sans mb-4"
                  style={{ color: headText }}
                >
                  Child Mortality Has Halved Since 2000
                </h3>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart
                    data={CHILD_MORTALITY_TREND}
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
                      formatter={(v: number) => [
                        `${v} per 1,000`,
                        "Global Average",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Disease burden */}
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-3"
                  style={{
                    color: isLight ? "#065f46" : "rgba(52,211,153,0.7)",
                  }}
                >
                  Disease Burden · WHO 2023 · Deaths per 100k
                </p>
                <div className="flex flex-col gap-2.5">
                  {DISEASE_BURDEN.map((d) => (
                    <div key={d.disease} className="flex items-center gap-3">
                      <span
                        className="text-[11px] font-sans w-24 shrink-0"
                        style={{ color: headText }}
                      >
                        {d.disease}
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
                            width: `${(d.deathsPer100k / 20) * 100}%`,
                            background: d.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-mono font-bold w-8 text-right shrink-0"
                        style={{ color: d.color }}
                      >
                        {d.deathsPer100k}
                      </span>
                    </div>
                  ))}
                </div>
                <SourceLink
                  sources={[
                    {
                      label: "WHO Global Health Observatory",
                      url: "https://www.who.int/data/gho",
                    },
                  ]}
                  className="mt-3"
                />
              </div>
            </div>
          </div>

          {/* Water access */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: isLight ? "#065f46" : "rgba(52,211,153,0.7)" }}
            >
              WHO / UNICEF JMP 2022 · % with safely managed drinking water
            </p>
            <h3
              className="text-sm font-bold font-sans mb-5"
              style={{ color: headText }}
            >
              Safe Drinking Water Access by Country
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {WATER_ACCESS.map((w) => (
                <div key={w.country} className="flex items-center gap-3">
                  <span className="text-base w-6 shrink-0">{w.flag}</span>
                  <span
                    className="text-[11px] font-sans w-20 shrink-0"
                    style={{ color: headText }}
                  >
                    {w.country}
                  </span>
                  <div
                    className="flex-1 h-3.5 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.06)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${w.safe}%`,
                        background:
                          w.safe >= 90
                            ? "#10b981"
                            : w.safe >= 70
                              ? "#22d3ee"
                              : w.safe >= 50
                                ? "#f59e0b"
                                : "#ef4444",
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold w-8 text-right shrink-0"
                    style={{
                      color:
                        w.safe >= 90
                          ? "#10b981"
                          : w.safe >= 70
                            ? "#22d3ee"
                            : w.safe >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                    }}
                  >
                    {w.safe}%
                  </span>
                </div>
              ))}
            </div>
            <SourceLink
              sources={[
                {
                  label: "WHO/UNICEF JMP Water",
                  url: "https://washdata.org",
                },
              ]}
              className="mt-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
