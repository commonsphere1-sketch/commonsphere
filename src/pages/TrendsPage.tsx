import React, { useState } from "react";
import { SourceLink } from "../components/SourceLink";
import { useTheme } from "../contexts/ThemeContext";
import {
  Sparkle,
  ArrowUp,
  ArrowDown,
  TrendUp,
  TrendDown,
  Warning,
  Info,
  CaretRight,
  Globe,
  Lightning,
  Target,
  Users,
  Leaf,
  Package,
  DeviceMobile,
  ShieldWarning,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

/* ─── Projection / Forecast Data ──────────────────────────────────────── */

const GDP_PROJECTION = [
  { year: "2024", world: 105.4, usa: 27.4, china: 18.5, eu: 17.9 },
  { year: "2025", world: 109.1, usa: 28.2, china: 19.8, eu: 18.3 },
  { year: "2026", world: 113.4, usa: 29.5, china: 21.2, eu: 18.9 },
  { year: "2027", world: 118.2, usa: 30.8, china: 22.8, eu: 19.4 },
  { year: "2028", world: 123.5, usa: 32.1, china: 24.6, eu: 20.0 },
  { year: "2029", world: 129.1, usa: 33.4, china: 26.5, eu: 20.6 },
  { year: "2030", world: 135.0, usa: 34.9, china: 28.6, eu: 21.3 },
];

const INFLATION_FORECAST = [
  { year: "2022", g20: 8.7, em: 9.8, adv: 7.3 },
  { year: "2023", g20: 6.1, em: 7.4, adv: 4.6 },
  { year: "2024", g20: 4.8, em: 6.2, adv: 3.2 },
  { year: "2025", g20: 3.9, em: 5.1, adv: 2.6 },
  { year: "2026", g20: 3.2, em: 4.3, adv: 2.2 },
  { year: "2027", g20: 2.8, em: 3.8, adv: 2.1 },
  { year: "2028", g20: 2.5, em: 3.4, adv: 2.0 },
];

const UNEMPLOYMENT_PROJ = [
  { year: "2022", rate: 3.6 },
  { year: "2023", rate: 3.8 },
  { year: "2024", rate: 4.1 },
  { year: "2025", rate: 4.3 },
  { year: "2026", rate: 4.1 },
  { year: "2027", rate: 3.9 },
  { year: "2028", rate: 3.7 },
  { year: "2029", rate: 3.6 },
  { year: "2030", rate: 3.5 },
];

const RISK_PROJECTIONS = [
  {
    region: "East Asia",
    current: 42,
    proj2027: 55,
    change: +13,
    direction: "up" as const,
    category: "Geopolitical",
  },
  {
    region: "Middle East",
    current: 78,
    proj2027: 71,
    change: -7,
    direction: "down" as const,
    category: "Conflict",
  },
  {
    region: "Sub-Saharan Africa",
    current: 61,
    proj2027: 58,
    change: -3,
    direction: "down" as const,
    category: "Economic",
  },
  {
    region: "Eastern Europe",
    current: 84,
    proj2027: 62,
    change: -22,
    direction: "down" as const,
    category: "Conflict",
  },
  {
    region: "Latin America",
    current: 49,
    proj2027: 52,
    change: +3,
    direction: "up" as const,
    category: "Political",
  },
  {
    region: "South Asia",
    current: 56,
    proj2027: 59,
    change: +3,
    direction: "up" as const,
    category: "Climate",
  },
];

const SCENARIOS = [
  {
    id: "s1",
    icon: <Target size={16} weight="fill" />,
    color: "#10b981",
    label: "Green Transition Acceleration",
    horizon: "2030",
    probability: 62,
    impact: "High",
    impactColor: "#10b981",
    summary:
      "Renewable energy reaches 45% of global electricity by 2030 if current policy trajectories hold.",
    drivers: ["EU Green Deal", "US IRA", "China net-zero pledges"],
  },
  {
    id: "s2",
    icon: <Lightning size={16} weight="fill" />,
    color: "#f59e0b",
    label: "AI Economic Disruption",
    horizon: "2028",
    probability: 74,
    impact: "Very High",
    impactColor: "#f59e0b",
    summary:
      "Automation displaces 14–20% of white-collar roles in advanced economies within 4 years.",
    drivers: ["LLM adoption", "Labor market shifts", "Regulatory lag"],
  },
  {
    id: "s3",
    icon: <Globe size={16} weight="fill" />,
    color: "#6366f1",
    label: "Multipolar Trade Realignment",
    horizon: "2027",
    probability: 81,
    impact: "High",
    impactColor: "#6366f1",
    summary:
      "Dollar&#39;s share of global reserves drops below 55% as BRICS+ nations build trade alternatives.",
    drivers: ["De-dollarization push", "BRICS expansion", "Sanctions blowback"],
  },
  {
    id: "s4",
    icon: <Warning size={16} weight="fill" />,
    color: "#ef4444",
    label: "Taiwan Strait Escalation",
    horizon: "2026–2028",
    probability: 31,
    impact: "Critical",
    impactColor: "#ef4444",
    summary:
      "Military incidents raise risk of full blockade, triggering $3T+ supply chain disruption.",
    drivers: ["PLA exercises", "US posture", "Taiwan elections"],
  },
];

const GROWTH_TRENDS = [
  {
    name: "India",
    color: "#f97316",
    data: [6.1, 6.5, 7.0, 6.8, 7.1, 7.3, 7.5],
    trend: "up",
  },
  {
    name: "USA",
    color: "#3b82f6",
    data: [2.5, 2.1, 2.8, 2.3, 2.6, 2.5, 2.7],
    trend: "stable",
  },
  {
    name: "China",
    color: "#ef4444",
    data: [5.2, 4.6, 4.9, 5.1, 5.2, 5.3, 5.4],
    trend: "stable",
  },
  {
    name: "Germany",
    color: "#6366f1",
    data: [1.8, -0.2, 0.3, 0.9, 1.2, 1.5, 1.7],
    trend: "up",
  },
  {
    name: "Brazil",
    color: "#10b981",
    data: [2.9, 3.1, 2.8, 3.0, 3.2, 3.1, 3.3],
    trend: "up",
  },
];

/* ─── Population & Demographics ─────────────────────────────────────── */
const POPULATION_TRENDS = [
  { year: "2020", world: 7.8, africa: 1.34, asia: 4.64, europe: 0.745 },
  { year: "2022", world: 7.95, africa: 1.39, asia: 4.72, europe: 0.744 },
  { year: "2024", world: 8.09, africa: 1.45, asia: 4.79, europe: 0.742 },
  { year: "2026", world: 8.22, africa: 1.51, asia: 4.85, europe: 0.74 },
  { year: "2028", world: 8.35, africa: 1.57, asia: 4.9, europe: 0.738 },
  { year: "2030", world: 8.47, africa: 1.64, asia: 4.95, europe: 0.736 },
];

const AGING_STATS = [
  { country: "Japan", over65Pct: 29.9, medianAge: 49.5, color: "#ef4444" },
  { country: "Italy", over65Pct: 24.1, medianAge: 47.7, color: "#f97316" },
  { country: "Germany", over65Pct: 22.7, medianAge: 46.8, color: "#6366f1" },
  { country: "USA", over65Pct: 17.3, medianAge: 38.9, color: "#3b82f6" },
  { country: "China", over65Pct: 14.2, medianAge: 38.4, color: "#ef4444" },
  { country: "India", over65Pct: 7.1, medianAge: 29.5, color: "#f59e0b" },
  { country: "Nigeria", over65Pct: 3.0, medianAge: 18.4, color: "#10b981" },
];

/* ─── Climate & Energy ───────────────────────────────────────────────── */
const RENEWABLE_CAPACITY = [
  { year: "2019", solar: 627, wind: 623, hydro: 1310 },
  { year: "2020", solar: 714, wind: 733, hydro: 1332 },
  { year: "2021", solar: 849, wind: 825, hydro: 1360 },
  { year: "2022", solar: 1053, wind: 899, hydro: 1392 },
  { year: "2023", solar: 1419, wind: 1017, hydro: 1421 },
  { year: "2024", solar: 1900, wind: 1150, hydro: 1445 },
  { year: "2025", solar: 2340, wind: 1280, hydro: 1460 },
];

const CLIMATE_INDICATORS = [
  {
    label: "Global Temp Anomaly",
    value: "+1.45°C",
    delta: "2024 vs pre-industrial",
    color: "#ef4444",
    up: true,
  },
  {
    label: "CO₂ Concentration",
    value: "422 ppm",
    delta: "+2.4 ppm/yr",
    color: "#f97316",
    up: true,
  },
  {
    label: "Arctic Sea Ice Loss",
    value: "-13%/decade",
    delta: "vs 1981–2010 avg",
    color: "#3b82f6",
    up: false,
  },
  {
    label: "Clean Energy Share",
    value: "30.3%",
    delta: "+4.1pp vs 2020",
    color: "#10b981",
    up: true,
  },
];

/* ─── Global Trade ───────────────────────────────────────────────────── */
const TRADE_DATA = [
  { year: "2019", volume: 19.0, fdi: 1.54 },
  { year: "2020", volume: 17.4, fdi: 0.99 },
  { year: "2021", volume: 22.3, fdi: 1.6 },
  { year: "2022", volume: 25.1, fdi: 1.3 },
  { year: "2023", volume: 24.2, fdi: 1.33 },
  { year: "2024", volume: 25.6, fdi: 1.45 },
  { year: "2025", volume: 26.8, fdi: 1.58 },
];

const TOP_TRADE_FLOWS = [
  { route: "China → USA", value: "$438B", share: 92, color: "#ef4444" },
  { route: "EU → USA", value: "$606B", share: 100, color: "#3b82f6" },
  { route: "China → EU", value: "$575B", share: 95, color: "#f97316" },
  { route: "USA → Mexico", value: "$323B", share: 53, color: "#10b981" },
  { route: "Japan → USA", value: "$148B", share: 24, color: "#a855f7" },
  { route: "India → EU", value: "$76B", share: 13, color: "#f59e0b" },
];

/* ─── Digital Economy ────────────────────────────────────────────────── */
const DIGITAL_METRICS = [
  { year: "2019", ecommerce: 3.5, aiMarket: 0.27, cloudSpend: 0.24 },
  { year: "2020", ecommerce: 4.3, aiMarket: 0.38, cloudSpend: 0.37 },
  { year: "2021", ecommerce: 5.2, aiMarket: 0.52, cloudSpend: 0.49 },
  { year: "2022", ecommerce: 5.8, aiMarket: 0.72, cloudSpend: 0.63 },
  { year: "2023", ecommerce: 6.3, aiMarket: 1.07, cloudSpend: 0.72 },
  { year: "2024", ecommerce: 6.9, aiMarket: 1.84, cloudSpend: 0.84 },
  { year: "2025", ecommerce: 7.6, aiMarket: 2.74, cloudSpend: 0.98 },
];

const INTERNET_ADOPTION = [
  { region: "North America", pct: 93, color: "#3b82f6" },
  { region: "Europe", pct: 89, color: "#6366f1" },
  { region: "Latin America", pct: 77, color: "#10b981" },
  { region: "East Asia", pct: 74, color: "#f97316" },
  { region: "Middle East", pct: 71, color: "#f59e0b" },
  { region: "Southeast Asia", pct: 67, color: "#a855f7" },
  { region: "South Asia", pct: 48, color: "#ef4444" },
  { region: "Sub-Saharan Africa", pct: 37, color: "#ec4899" },
];

/* ─── Geopolitical Risk Heat ─────────────────────────────────────────── */
const GEO_RISK_TABLE = [
  {
    region: "Taiwan Strait",
    risk: 87,
    trend: "up",
    category: "Military",
    color: "#ef4444",
  },
  {
    region: "Russia–Ukraine",
    risk: 82,
    trend: "stable",
    category: "Conflict",
    color: "#ef4444",
  },
  {
    region: "Middle East",
    risk: 74,
    trend: "down",
    category: "Multi-front",
    color: "#f97316",
  },
  {
    region: "Korean Peninsula",
    risk: 61,
    trend: "up",
    category: "Nuclear",
    color: "#f59e0b",
  },
  {
    region: "South China Sea",
    risk: 58,
    trend: "up",
    category: "Maritime",
    color: "#f59e0b",
  },
  {
    region: "Sahel Region",
    risk: 54,
    trend: "up",
    category: "Insurgency",
    color: "#f59e0b",
  },
  {
    region: "Venezuela",
    risk: 42,
    trend: "stable",
    category: "Political",
    color: "#10b981",
  },
  {
    region: "Western Balkans",
    risk: 31,
    trend: "down",
    category: "Ethnic",
    color: "#10b981",
  },
];

const SECTOR_PROJECTIONS = [
  {
    sector: "Defense",
    outlook: "+18%",
    confidence: 88,
    direction: "up",
    color: "#ef4444",
  },
  {
    sector: "Renewables",
    outlook: "+24%",
    confidence: 76,
    direction: "up",
    color: "#10b981",
  },
  {
    sector: "Semiconductors",
    outlook: "+31%",
    confidence: 71,
    direction: "up",
    color: "#6366f1",
  },
  {
    sector: "Commodities",
    outlook: "-6%",
    confidence: 62,
    direction: "down",
    color: "#f59e0b",
  },
  {
    sector: "EM Debt",
    outlook: "-11%",
    confidence: 69,
    direction: "down",
    color: "#ef4444",
  },
  {
    sector: "AI Infrastructure",
    outlook: "+42%",
    confidence: 83,
    direction: "up",
    color: "#a855f7",
  },
];

/* ─── Mini Sparkline ─────────────────────────────────────────────────── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const h = 28,
    w = 72;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`,
    )
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={points}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
      />
      <circle
        cx={((data.length - 1) / (data.length - 1)) * w}
        cy={h - ((data[data.length - 1] - min) / (max - min || 1)) * h}
        r={3}
        fill={color}
      />
    </svg>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────── */
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
          style={{ color: isLight ? "#6366f1" : "rgba(167,139,250,0.7)" }}
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
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
            {badge}
          </span>
        )}
      </h2>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function TrendsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [gdpView, setGdpView] = useState<"world" | "regions">("world");
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

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
              ? "linear-gradient(130deg, #e0e7ff 0%, #dbeafe 60%, #d1fae5 100%)"
              : "linear-gradient(130deg, #1e1b4b 0%, #0f0b1e 50%, #022c22 100%)",
            border: isLight
              ? "1px solid rgba(99,102,241,0.2)"
              : "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, ${isLight ? "#4f46e5" : "#7c3aed"} 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkle
                size={12}
                weight="fill"
                style={{ color: isLight ? "#4f46e5" : "#a78bfa" }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: isLight ? "#4f46e5" : "#a78bfa" }}
              >
                Forecasting &amp; Scenario Analysis
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold font-sans leading-tight"
              style={{ color: headText }}
            >
              Trends &amp; Projections
            </h1>
            <p
              className="text-xs font-sans mt-1 max-w-lg"
              style={{ color: mutedText }}
            >
              Forward-looking economic and geopolitical forecasts through 2030,
              built on IMF, World Bank, and consensus analyst data.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2 shrink-0">
            {[
              { v: "2026–30", l: "Horizon" },
              { v: "4", l: "Scenarios" },
              { v: "12", l: "Indicators" },
              { v: "IMF", l: "Source" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl px-3 py-1.5 text-center"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.08)",
                  border: isLight
                    ? "1px solid rgba(99,102,241,0.18)"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3">
          {[
            {
              label: "Global GDP 2030 (proj.)",
              value: "$135T",
              delta: "+28%",
              positive: true,
            },
            {
              label: "US Unemp. by 2030 (proj.)",
              value: "3.5%",
              delta: "-0.6pp",
              positive: true,
            },
            {
              label: "G20 Inflation 2028 (proj.)",
              value: "2.5%",
              delta: "-2.3pp",
              positive: true,
            },
            {
              label: "High-Risk Scenarios",
              value: "2 active",
              delta: "Critical",
              positive: false,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl px-5 py-4 flex flex-col gap-1.5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[11px] font-sans uppercase tracking-widest"
                style={{ color: mutedText }}
              >
                {k.label}
              </p>
              <p
                className="text-2xl font-bold font-mono"
                style={{ color: headText }}
              >
                {k.value}
              </p>
              <div className="flex items-center gap-1">
                {k.positive ? (
                  <ArrowUp size={11} weight="bold" color="#10b981" />
                ) : (
                  <Warning size={11} weight="fill" color="#ef4444" />
                )}
                <span
                  className="text-[11px] font-mono"
                  style={{ color: k.positive ? "#10b981" : "#ef4444" }}
                >
                  {k.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* COL 1-5: Charts */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* GDP Projection */}
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
                      color: isLight ? "#6366f1" : "rgba(167,139,250,0.7)",
                    }}
                  >
                    GDP Forecast
                  </p>
                  <h2
                    className="text-base font-bold font-sans"
                    style={{ color: headText }}
                  >
                    Global GDP Projections
                    <span
                      className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: "#6366f115", color: "#6366f1" }}
                    >
                      2024 – 2030
                    </span>
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
                  {(["world", "regions"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setGdpView(v)}
                      className="px-2.5 py-1 transition-colors capitalize"
                      style={{
                        background: gdpView === v ? "#6366f1" : "transparent",
                        color: gdpView === v ? "#fff" : mutedText,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={GDP_PROJECTION}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="tpGdpUsaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#3b82f6"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="tpGdpChinaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ef4444"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="tpGdpEuGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="tpGdpWorldGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
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
                    tickFormatter={(v) => `$${v}T`}
                  />
                  <ReferenceLine
                    x="2025"
                    stroke={mutedText}
                    strokeDasharray="4 2"
                    label={{
                      value: "Now",
                      position: "top",
                      fontSize: 9,
                      fill: mutedText,
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
                    formatter={(v: number, name: string) => [
                      `$${v}T`,
                      name.toUpperCase(),
                    ]}
                    labelStyle={{ color: mutedText, marginBottom: 2 }}
                  />
                  {gdpView === "world" ? (
                    <Area
                      type="monotone"
                      dataKey="world"
                      stroke="#a855f7"
                      fill="url(#tpGdpWorldGrad)"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="usa"
                        stroke="#3b82f6"
                        fill="url(#tpGdpUsaGrad)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="china"
                        stroke="#ef4444"
                        fill="url(#tpGdpChinaGrad)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="eu"
                        stroke="#10b981"
                        fill="url(#tpGdpEuGrad)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
              {gdpView === "regions" && (
                <div className="flex items-center gap-4 mt-2 justify-center">
                  {[
                    { label: "USA", color: "#3b82f6" },
                    { label: "China", color: "#ef4444" },
                    { label: "EU", color: "#10b981" },
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
              )}
              <SourceLink
                sources={[
                  {
                    label: "IMF World Economic Outlook",
                    url: "https://imf.org/en/Publications/WEO",
                  },
                  {
                    label: "World Bank GEP",
                    url: "https://worldbank.org/en/publication/global-economic-prospects",
                  },
                ]}
                className="mt-3"
              />
            </div>

            {/* Global Inflation Forecast */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="Global Inflation Forecast"
                sub="Monetary Outlook"
                badge="2022–2028"
                isLight={isLight}
              />
              <ResponsiveContainer width="100%" height={185}>
                <LineChart
                  data={INFLATION_FORECAST}
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
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, "auto"]}
                  />
                  <ReferenceLine
                    x="2025"
                    stroke={mutedText}
                    strokeDasharray="4 2"
                  />
                  <ReferenceLine
                    y={2}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: "2% target",
                      position: "right",
                      fontSize: 9,
                      fill: "#10b981",
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
                    formatter={(v: number, name: string) => [
                      `${v}%`,
                      name === "g20"
                        ? "G20"
                        : name === "em"
                          ? "Emerging Markets"
                          : "Advanced Economies",
                    ]}
                    labelStyle={{ color: mutedText, marginBottom: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="g20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="em"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 2"
                    dot={{ fill: "#ef4444", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="adv"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 justify-center">
                {[
                  { label: "G20 Avg", color: "#f59e0b" },
                  { label: "Emerging Markets", color: "#ef4444" },
                  { label: "Advanced Economies", color: "#3b82f6" },
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
                    label: "IMF World Economic Outlook",
                    url: "https://imf.org/en/Publications/WEO",
                  },
                  {
                    label: "World Bank GEP",
                    url: "https://worldbank.org/en/publication/global-economic-prospects",
                  },
                ]}
                className="mt-3"
              />
            </div>

            {/* US Unemployment Projection */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="US Unemployment Projection"
                sub="Labor Market"
                badge="2022–2030"
                isLight={isLight}
              />
              <ResponsiveContainer width="100%" height={175}>
                <AreaChart
                  data={UNEMPLOYMENT_PROJ}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="tpUnempProjGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
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
                    tickFormatter={(v) => `${v}%`}
                    domain={[2.5, 5]}
                  />
                  <ReferenceLine
                    x="2025"
                    stroke={mutedText}
                    strokeDasharray="4 2"
                    label={{
                      value: "Now",
                      position: "top",
                      fontSize: 9,
                      fill: mutedText,
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
                    formatter={(v: number) => [`${v}%`, "Unemployment Rate"]}
                    labelStyle={{ color: mutedText, marginBottom: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#6366f1"
                    fill="url(#tpUnempProjGrad)"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <SourceLink
                sources={{
                  label: "BLS Current Population Survey",
                  url: "https://bls.gov/cps",
                }}
                className="mt-3"
              />
            </div>
          </div>

          {/* COL 6-8: Risk + Sector */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Sector Outlook */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="Sector Outlook"
                sub="12-Month Projections"
                isLight={isLight}
              />
              <div className="flex flex-col gap-2">
                {SECTOR_PROJECTIONS.map((s) => (
                  <div
                    key={s.sector}
                    className="flex items-center gap-3 py-2"
                    style={{ borderBottom: `1px solid ${gridLine}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-xs font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {s.sector}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        {s.direction === "up" ? (
                          <TrendUp
                            size={12}
                            weight="fill"
                            style={{ color: s.color }}
                          />
                        ) : (
                          <TrendDown
                            size={12}
                            weight="fill"
                            style={{ color: s.color }}
                          />
                        )}
                        <span
                          className="text-[11px] font-mono font-semibold"
                          style={{ color: s.color }}
                        >
                          {s.outlook}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{
                            background: isLight
                              ? "rgba(0,0,0,0.07)"
                              : "rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.confidence}%`,
                              background: s.color,
                            }}
                          />
                        </div>
                        <span
                          className="text-[9px] font-mono w-6"
                          style={{ color: mutedText }}
                        >
                          {s.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <SourceLink
                sources={[
                  { label: "OECD Statistics", url: "https://stats.oecd.org" },
                  { label: "EIU Consensus", url: "https://eiu.com" },
                ]}
                className="mt-3"
              />
            </div>

            {/* Country Growth Trends */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="Country Growth Trends"
                sub="GDP YoY %"
                isLight={isLight}
              />
              <div className="flex flex-col gap-3">
                {GROWTH_TRENDS.map((g) => (
                  <div key={g.name} className="flex items-center gap-3">
                    <span
                      className="text-xs font-semibold font-sans w-16 shrink-0"
                      style={{ color: headText }}
                    >
                      {g.name}
                    </span>
                    <MiniSparkline data={g.data} color={g.color} />
                    <div className="flex flex-col items-end ml-auto">
                      <span
                        className="text-[11px] font-mono font-semibold"
                        style={{ color: g.color }}
                      >
                        {g.data[g.data.length - 1].toFixed(1)}%
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {g.trend === "up"
                          ? "↑ Rising"
                          : g.trend === "down"
                            ? "↓ Falling"
                            : "→ Stable"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <SourceLink
                sources={{
                  label: "World Bank Open Data",
                  url: "https://data.worldbank.org",
                }}
                className="mt-3"
              />
            </div>
          </div>

          {/* COL 9-12: Scenario Analysis */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Key Scenarios */}
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
                      color: isLight ? "#6366f1" : "rgba(167,139,250,0.7)",
                    }}
                  >
                    Scenario Analysis
                  </p>
                  <h2
                    className="text-base font-bold font-sans"
                    style={{ color: headText }}
                  >
                    Key Scenarios
                  </h2>
                </div>
                <span
                  className="text-[9px] font-mono px-2 py-1 rounded-full"
                  style={{ background: "#ef444415", color: "#ef4444" }}
                >
                  2 High-Risk
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {SCENARIOS.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl p-3 cursor-pointer transition-all"
                    onClick={() =>
                      setActiveScenario(activeScenario === s.id ? null : s.id)
                    }
                    style={{
                      background:
                        activeScenario === s.id
                          ? isLight
                            ? `${s.color}12`
                            : `${s.color}15`
                          : isLight
                            ? "rgba(0,0,0,0.025)"
                            : "rgba(255,255,255,0.035)",
                      border: `1px solid ${activeScenario === s.id ? s.color + "40" : isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    <div className="flex items-start gap-2.5 mb-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: s.color + "20", color: s.color }}
                      >
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-bold font-sans leading-snug"
                          style={{ color: headText }}
                        >
                          {s.label}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[9px] font-mono"
                            style={{ color: mutedText }}
                          >
                            {s.horizon}
                          </span>
                          <span
                            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: s.impactColor + "15",
                              color: s.impactColor,
                            }}
                          >
                            {s.impact}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: s.color }}
                        >
                          {s.probability}%
                        </span>
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          prob.
                        </span>
                      </div>
                    </div>
                    {activeScenario === s.id && (
                      <div
                        className="mt-2 pt-2"
                        style={{ borderTop: `1px solid ${gridLine}` }}
                      >
                        <p
                          className="text-[11px] font-sans leading-relaxed mb-2"
                          style={{ color: isLight ? "#475569" : "#cbd5e1" }}
                          dangerouslySetInnerHTML={{ __html: s.summary }}
                        />
                        <p
                          className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
                          style={{ color: mutedText }}
                        >
                          Key Drivers
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {s.drivers.map((d) => (
                            <span
                              key={d}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                              style={{
                                background: s.color + "15",
                                color: s.color,
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <SourceLink
                sources={[
                  {
                    label: "IMF WEO",
                    url: "https://imf.org/en/Publications/WEO",
                  },
                  { label: "EIU Risk Briefings", url: "https://eiu.com" },
                ]}
                className="mt-3"
              />
            </div>

            {/* Forecast Confidence */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                title="Forecast Confidence"
                sub="Model Quality"
                isLight={isLight}
              />
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "GDP Projections",
                    confidence: 78,
                    color: "#6366f1",
                  },
                  {
                    label: "Inflation Forecast",
                    confidence: 71,
                    color: "#f59e0b",
                  },
                  {
                    label: "Unemployment Path",
                    confidence: 82,
                    color: "#3b82f6",
                  },
                  { label: "Risk Index", confidence: 61, color: "#ef4444" },
                  { label: "Sector Outlook", confidence: 67, color: "#10b981" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span
                      className="text-[11px] font-sans flex-1"
                      style={{ color: headText }}
                    >
                      {f.label}
                    </span>
                    <div
                      className="w-20 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${f.confidence}%`,
                          background: f.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono w-8 text-right"
                      style={{ color: f.color }}
                    >
                      {f.confidence}%
                    </span>
                  </div>
                ))}
              </div>
              <SourceLink
                sources={{
                  label: "World Bank Global Prospects",
                  url: "https://worldbank.org/en/publication/global-economic-prospects",
                }}
                className="mt-3"
              />
            </div>

            {/* Methodology Note */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: isLight
                  ? "rgba(99,102,241,0.05)"
                  : "rgba(139,92,246,0.08)",
                border: isLight
                  ? "1px solid rgba(99,102,241,0.15)"
                  : "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <div className="flex items-start gap-2.5">
                <Info
                  size={14}
                  weight="fill"
                  style={{
                    color: isLight ? "#6366f1" : "#a78bfa",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />
                <div>
                  <p
                    className="text-[11px] font-bold font-sans mb-1"
                    style={{ color: isLight ? "#4f46e5" : "#a78bfa" }}
                  >
                    Methodology Note
                  </p>
                  <p
                    className="text-[10px] font-sans leading-relaxed"
                    style={{ color: mutedText }}
                  >
                    All projections combine IMF World Economic Outlook (Apr
                    2025), World Bank Global Economic Prospects, and Economist
                    Intelligence Unit consensus. Scenarios scored using Bayesian
                    probability updates from geopolitical risk models.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── POPULATION & DEMOGRAPHICS ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Population projection chart */}
          <div
            className="lg:col-span-5 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users
                size={13}
                weight="fill"
                style={{ color: isLight ? "#6366f1" : "#a78bfa" }}
              />
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: isLight ? "#6366f1" : "rgba(167,139,250,0.7)" }}
              >
                Population Trends
              </p>
            </div>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              World Population by Region
              <span
                className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "#6366f115", color: "#6366f1" }}
              >
                2020–2030
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={POPULATION_TRENDS}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="popWorldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="popAfricaGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="popAsiaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
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
                  tickFormatter={(v) => `${v}B`}
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
                    `${v}B`,
                    name === "world"
                      ? "World"
                      : name === "africa"
                        ? "Africa"
                        : name === "asia"
                          ? "Asia"
                          : "Europe",
                  ]}
                  labelStyle={{ color: mutedText }}
                />
                <Area
                  type="monotone"
                  dataKey="asia"
                  stroke="#f97316"
                  fill="url(#popAsiaGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="africa"
                  stroke="#10b981"
                  fill="url(#popAfricaGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="world"
                  stroke="#a855f7"
                  fill="url(#popWorldGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              {[
                { label: "World", color: "#a855f7" },
                { label: "Asia", color: "#f97316" },
                { label: "Africa", color: "#10b981" },
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
              sources={{
                label: "UN World Population Prospects 2024",
                url: "https://population.un.org/wpp/",
              }}
              className="mt-3"
            />
          </div>

          {/* Aging stats */}
          <div
            className="lg:col-span-3 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <SectionHeader
              title="Global Aging Index"
              sub="Demographics"
              isLight={isLight}
            />
            <div className="flex flex-col gap-2">
              {AGING_STATS.map((a) => (
                <div
                  key={a.country}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: `1px solid ${gridLine}` }}
                >
                  <span
                    className="text-xs font-semibold font-sans w-16 shrink-0"
                    style={{ color: headText }}
                  >
                    {a.country}
                  </span>
                  <div className="flex-1">
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(a.over65Pct / 32) * 100}%`,
                          background: a.color,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-mono w-10 text-right"
                    style={{ color: a.color }}
                  >
                    {a.over65Pct}%
                  </span>
                  <span
                    className="text-[9px] font-mono w-12 text-right"
                    style={{ color: mutedText }}
                  >
                    age {a.medianAge}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-mono mt-2"
              style={{ color: mutedText }}
            >
              % of population aged 65+
            </p>
            <SourceLink
              sources={{
                label: "UN DESA Population Division",
                url: "https://population.un.org",
              }}
              className="mt-2"
            />
          </div>

          {/* Climate indicators */}
          <div
            className="lg:col-span-4 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Leaf size={13} weight="fill" style={{ color: "#10b981" }} />
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "#10b981" }}
              >
                Climate &amp; Energy
              </p>
            </div>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              Key Climate Indicators 2025
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CLIMATE_INDICATORS.map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl p-3"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${c.color}25`,
                  }}
                >
                  <p
                    className="text-[9px] font-mono uppercase tracking-widest mb-1"
                    style={{ color: mutedText }}
                  >
                    {c.label}
                  </p>
                  <p
                    className="text-lg font-bold font-mono"
                    style={{ color: c.color }}
                  >
                    {c.value}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {c.up ? (
                      <ArrowUp size={9} weight="bold" color={c.color} />
                    ) : (
                      <ArrowDown size={9} weight="bold" color={c.color} />
                    )}
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: mutedText }}
                    >
                      {c.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <SectionHeader
              title="Renewable Capacity GW"
              sub="Solar · Wind · Hydro"
              isLight={isLight}
            />
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart
                data={RENEWABLE_CAPACITY}
                margin={{ top: 2, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
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
                  tickFormatter={(v) => `${v}`}
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
                    `${v} GW`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                  labelStyle={{ color: mutedText }}
                />
                <Area
                  type="monotone"
                  dataKey="hydro"
                  stroke="#6366f1"
                  fill="none"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                />
                <Area
                  type="monotone"
                  dataKey="wind"
                  stroke="#3b82f6"
                  fill="url(#windGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="solar"
                  stroke="#f59e0b"
                  fill="url(#solarGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              {[
                { label: "Solar", color: "#f59e0b" },
                { label: "Wind", color: "#3b82f6" },
                { label: "Hydro", color: "#6366f1" },
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
                { label: "IRENA Renewable Capacity", url: "https://irena.org" },
                {
                  label: "IEA World Energy Outlook",
                  url: "https://iea.org/weo",
                },
              ]}
              className="mt-3"
            />
          </div>
        </div>

        {/* ── TRADE & DIGITAL ECONOMY ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Global Trade Volume */}
          <div
            className="lg:col-span-4 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Package
                size={13}
                weight="fill"
                style={{ color: isLight ? "#f97316" : "#fb923c" }}
              />
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: isLight ? "#f97316" : "#fb923c" }}
              >
                Global Trade
              </p>
            </div>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              Trade Volume &amp; FDI Flows
              <span
                className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "#f9731615", color: "#f97316" }}
              >
                2019–2025
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart
                data={TRADE_DATA}
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
                  tickFormatter={(v) => `$${v}T`}
                />
                <ReferenceLine
                  x="2025"
                  stroke={mutedText}
                  strokeDasharray="4 2"
                  label={{
                    value: "Now",
                    position: "top",
                    fontSize: 9,
                    fill: mutedText,
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
                  formatter={(v: number, name: string) => [
                    `$${v}T`,
                    name === "volume" ? "Trade Volume" : "FDI Inflows",
                  ]}
                  labelStyle={{ color: mutedText }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: "#f97316", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="fdi"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 2"
                  dot={{ fill: "#6366f1", r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              {[
                { label: "Trade Volume", color: "#f97316" },
                { label: "FDI Inflows", color: "#6366f1" },
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
                { label: "WTO Statistics", url: "https://stats.wto.org" },
                {
                  label: "UNCTAD FDI Data",
                  url: "https://unctad.org/topic/investment/world-investment-report",
                },
              ]}
              className="mt-3"
            />
          </div>

          {/* Top Trade Flows */}
          <div
            className="lg:col-span-3 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <SectionHeader
              title="Top Bilateral Trade Flows"
              sub="2024 Estimates"
              isLight={isLight}
            />
            <div className="flex flex-col gap-2">
              {TOP_TRADE_FLOWS.map((t) => (
                <div
                  key={t.route}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: `1px solid ${gridLine}` }}
                >
                  <span
                    className="text-[11px] font-sans flex-1 min-w-0 truncate"
                    style={{ color: headText }}
                  >
                    {t.route}
                  </span>
                  <div
                    className="w-16 h-1.5 rounded-full overflow-hidden shrink-0"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${t.share}%`, background: t.color }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-mono w-12 text-right shrink-0"
                    style={{ color: t.color }}
                  >
                    {t.value}
                  </span>
                </div>
              ))}
            </div>
            <SourceLink
              sources={{
                label: "WTO Trade Profiles 2024",
                url: "https://stats.wto.org",
              }}
              className="mt-3"
            />
          </div>

          {/* Digital Economy */}
          <div
            className="lg:col-span-5 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <DeviceMobile
                size={13}
                weight="fill"
                style={{ color: "#a855f7" }}
              />
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "#a855f7" }}
              >
                Digital Economy
              </p>
            </div>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              E-Commerce · AI · Cloud Market Size ($T)
              <span
                className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "#a855f715", color: "#a855f7" }}
              >
                2019–2025
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart
                data={DIGITAL_METRICS}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ecomGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
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
                  tickFormatter={(v) => `$${v}T`}
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
                    `$${v}T`,
                    name === "ecommerce"
                      ? "E-Commerce"
                      : name === "aiMarket"
                        ? "AI Market"
                        : "Cloud Spend",
                  ]}
                  labelStyle={{ color: mutedText }}
                />
                <Area
                  type="monotone"
                  dataKey="cloudSpend"
                  stroke="#3b82f6"
                  fill="url(#cloudGrad)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="aiMarket"
                  stroke="#f59e0b"
                  fill="url(#aiGrad)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="ecommerce"
                  stroke="#a855f7"
                  fill="url(#ecomGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              {[
                { label: "E-Commerce", color: "#a855f7" },
                { label: "AI Market", color: "#f59e0b" },
                { label: "Cloud Spend", color: "#3b82f6" },
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
                  label: "Statista Digital Economy Report",
                  url: "https://statista.com",
                },
                { label: "IDC Cloud & AI Tracker", url: "https://idc.com" },
              ]}
              className="mt-3"
            />
          </div>
        </div>

        {/* ── GEOPOLITICAL RISK + INTERNET ADOPTION ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Geopolitical Risk Table */}
          <div
            className="lg:col-span-7 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldWarning
                size={13}
                weight="fill"
                style={{ color: "#ef4444" }}
              />
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "#ef4444" }}
              >
                Geopolitical Risk
              </p>
            </div>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              Global Risk Heat Map — 2025
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GEO_RISK_TABLE.map((r) => (
                <div
                  key={r.region}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.035)",
                    border: `1px solid ${r.color}22`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold font-sans leading-snug"
                      style={{ color: headText }}
                    >
                      {r.region}
                    </p>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                      style={{ background: r.color + "20", color: r.color }}
                    >
                      {r.category}
                    </span>
                  </div>
                  <div className="flex flex-col items-center shrink-0 w-16">
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden mb-1"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${r.risk}%`, background: r.color }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="text-sm font-bold font-mono"
                        style={{ color: r.color }}
                      >
                        {r.risk}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {r.trend === "up"
                          ? "↑"
                          : r.trend === "down"
                            ? "↓"
                            : "→"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-mono mt-2"
              style={{ color: mutedText }}
            >
              Risk score 0–100 composite index. ↑ Rising ↓ Falling → Stable
            </p>
            <SourceLink
              sources={[
                { label: "EIU Country Risk", url: "https://eiu.com" },
                {
                  label: "Control Risks GRRC",
                  url: "https://controlrisks.com",
                },
              ]}
              className="mt-2"
            />
          </div>

          {/* Internet Adoption */}
          <div
            className="lg:col-span-5 rounded-2xl p-5"
            style={{
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe size={13} weight="fill" style={{ color: "#3b82f6" }} />
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "#3b82f6" }}
              >
                Connectivity
              </p>
            </div>
            <h2
              className="text-base font-bold font-sans mb-4"
              style={{ color: headText }}
            >
              Internet Adoption by Region — 2025
            </h2>
            <div className="flex flex-col gap-3">
              {INTERNET_ADOPTION.map((r) => (
                <div key={r.region} className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-sans w-36 shrink-0"
                    style={{ color: headText }}
                  >
                    {r.region}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${r.pct}%`, background: r.color }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-mono w-9 text-right shrink-0"
                    style={{ color: r.color }}
                  >
                    {r.pct}%
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-4 p-3 rounded-xl"
              style={{
                background: isLight
                  ? "rgba(59,130,246,0.05)"
                  : "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.15)",
              }}
            >
              <p className="text-[10px] font-mono" style={{ color: mutedText }}>
                ~2.6B people remain offline globally. Africa and South Asia
                represent the largest unconnected populations, with mobile-first
                connectivity driving the fastest growth.
              </p>
            </div>
            <SourceLink
              sources={[
                {
                  label: "ITU Digital Development 2025",
                  url: "https://itu.int/en/ITU-D/Statistics",
                },
                {
                  label: "DataReportal Global Overview",
                  url: "https://datareportal.com",
                },
              ]}
              className="mt-3"
            />
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="text-center py-3">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Trends &amp;
            Projections · Data updated Q2 2025
          </p>
        </div>
      </div>
    </div>
  );
}
