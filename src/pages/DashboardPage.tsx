import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  Globe,
  Buildings,
  MapTrifold,
  ChartBar,
  Scales,
  Crosshair,
  ArrowRight,
  TrendUp,
  TrendDown,
  ArrowUp,
  ArrowDown,
  Fire,
  Warning,
  Lightning,
  Atom,
  Flag,
  ShareNetwork,
  Users,  Newspaper,
  Bank,
  Handshake,
  Sparkle,
  Info,
  Target,ChartLineUp,
  MapPin,MagnifyingGlass,
  X,  CheckCircle,
  Heart,Planet,
  ChartDonut,} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { economiesData } from "../data/economiesData";
import { SourceLink } from "../components/SourceLink";

const SRC_DASH_ECONOMY = [
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
  { label: "IMF WEO", url: "https://www.imf.org/en/Publications/WEO" },
];
const SRC_DASH_STATES = [
  {
    label: "Bureau of Economic Analysis",
    url: "https://www.bea.gov/data/gdp/gdp-state",
  },
  { label: "Bureau of Labor Statistics", url: "https://www.bls.gov/data/" },
];
const SRC_DASH_CITIES = [
  {
    label: "Numbeo City Rankings",
    url: "https://www.numbeo.com/city-rankings/",
  },
];
const SRC_DASH_CONFLICTS = [
  { label: "ACLED Conflict Data", url: "https://acleddata.com/" },
  { label: "Uppsala Conflict Data Program", url: "https://ucdp.uu.se/" },
];
const SRC_DASH_POLICIES = [
  {
    label: "OECD Policy Observatory",
    url: "https://www.oecd.org/gov/regulatory-policy/",
  },
];

/* ─── Country Carousel ──────────────────────────────────────────────────── */
function CountryCarousel({
  isLight,
  cardBg,
  cardBorder,
  headText,
  mutedText,
  gridLine,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  headText: string;
  mutedText: string;
  gridLine: string;
  onNav: (path: string) => void;
}) {
  const sorted = React.useMemo(
    () => [...countriesData].sort((a, b) => b.gdp - a.gdp),
    [],
  );

  // Duplicate list so the loop is seamless
  const items = [...sorted, ...sorted];

  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const [cardWidth, setCardWidth] = useState(0);
  const GAP = 12; // gap-3 = 12px
  const VISIBLE = 5;
  const SPEED = 0.9; // px per frame

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const step = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) {
          posRef.current -= halfWidth;
        }
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Measure actual rendered card width
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const firstCard = track.querySelector<HTMLElement>(
        "[data-carousel-card]",
      );
      if (firstCard) {
        setCardWidth(firstCard.offsetWidth + GAP);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Viewport width = exactly 5 cards + 4 gaps (subtract last extra gap)
  const viewportWidth = cardWidth > 0 ? cardWidth * VISIBLE - GAP : null;
  // Marker positions: left pillar at right edge of card 5, right pillar symmetric
  const markerLeft = viewportWidth !== null ? viewportWidth - 1 : null;
  const markerRight = 0;

  const fmtGDPShort = (b: number) =>
    b >= 1000 ? `$${(b / 1000).toFixed(1)}T` : `$${Math.round(b)}B`;

  const fmtPopShort = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
    return `${Math.round(n / 1000)}K`;
  };

  const hdiColor = (h: number) =>
    h >= 0.8 ? "#10b981" : h >= 0.65 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="rounded-2xl"
      style={{
        background: cardBg,
        border: cardBorder,
        overflow: "hidden",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#6366f112", border: "1px solid #6366f122" }}
          >
            <Globe size={13} weight="fill" style={{ color: "#6366f1" }} />
          </div>
          <span
            className="text-sm font-bold font-sans"
            style={{ color: headText }}
          >
            Countries
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "#6366f114", color: "#6366f1" }}
          >
            {sorted.length} tracked
          </span>
        </div>
        <button
          onClick={() => onNav("/dashboard/countries")}
          className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#6366f1" }}
        >
          All Countries <ArrowRight size={10} weight="bold" />
        </button>
      </div>

      {/* Outer wrapper: full width, centers the fixed-5-card viewport */}
      <div className="relative py-4 flex justify-center px-4">
        {/* Fixed viewport: clips to exactly 5 cards wide */}
        <div
          className="relative overflow-hidden"
          style={{
            width: viewportWidth !== null ? viewportWidth : "100%",
            maxWidth: "100%",
          }}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          {/* Left fade mask */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none z-10"
            style={{
              width: 28,
              background: `linear-gradient(to right, ${isLight ? "#f8fafc" : "#0b0b14"}, transparent)`,
            }}
          />
          {/* Right fade mask */}
          <div
            className="absolute inset-y-0 right-0 pointer-events-none z-10"
            style={{
              width: 28,
              background: `linear-gradient(to left, ${isLight ? "#f8fafc" : "#0b0b14"}, transparent)`,
            }}
          />

          {/* Scrolling track */}
          <div
            ref={trackRef}
            className="flex gap-3"
            style={{ willChange: "transform", width: "max-content" }}
          >
            {items.map((country, idx) => {
              const gdpGrowthUp = country.gdpGrowth >= 0;
              // Each card = (100vw - padding) / 5
              return (
                <div
                  key={`${country.id}-${idx}`}
                  data-carousel-card
                  onClick={() => onNav("/dashboard/countries")}
                  className="rounded-xl overflow-hidden cursor-pointer transition-opacity duration-200 hover:opacity-90 shrink-0"
                  style={{
                    width: "calc((100vw - 260px - 56px) / 5)",
                    minWidth: 140,
                    maxWidth: 230,
                    background: isLight
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${gridLine}`,
                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
                  }}
                >
                  {/* Flag banner */}
                  <div className="relative h-20 overflow-hidden">
                    <img
                      src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                      alt={`${country.name} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)",
                      }}
                    />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <span className="text-white text-xs font-bold font-sans leading-tight drop-shadow">
                        {country.name}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background:
                            hdiColor(country.humanDevelopmentIndex) + "33",
                          color: hdiColor(country.humanDevelopmentIndex),
                          border: `1px solid ${hdiColor(country.humanDevelopmentIndex)}44`,
                        }}
                      >
                        HDI {country.humanDevelopmentIndex}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-3 py-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        GDP
                      </span>
                      <span
                        className="text-[11px] font-bold font-mono"
                        style={{ color: headText }}
                      >
                        {fmtGDPShort(country.gdp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        Growth
                      </span>
                      <span
                        className="text-[11px] font-bold font-mono"
                        style={{ color: gdpGrowthUp ? "#10b981" : "#ef4444" }}
                      >
                        {gdpGrowthUp ? "+" : ""}
                        {country.gdpGrowth}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        Population
                      </span>
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: headText }}
                      >
                        {fmtPopShort(country.population)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── States Carousel ───────────────────────────────────────────────────── */
function StatesCarousel({
  isLight,
  cardBg,
  cardBorder,
  headText,
  mutedText,
  gridLine,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  headText: string;
  mutedText: string;
  gridLine: string;
  onNav: (path: string) => void;
}) {
  const sorted = React.useMemo(
    () => [...usStatesData].sort((a, b) => b.gdp - a.gdp),
    [],
  );

  const items = [...sorted, ...sorted];

  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const [cardWidth, setCardWidth] = useState(0);
  const GAP = 12;
  const VISIBLE = 5;
  const SPEED = 0.7;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) posRef.current -= halfWidth;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const firstCard = track.querySelector<HTMLElement>("[data-state-card]");
      if (firstCard) setCardWidth(firstCard.offsetWidth + GAP);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const viewportWidth = cardWidth > 0 ? cardWidth * VISIBLE - GAP : null;

  const fmtGDP = (b: number) =>
    b >= 1000 ? `$${(b / 1000).toFixed(1)}T` : `$${Math.round(b)}B`;

  const fmtPop = (n: number) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    return `${Math.round(n / 1000)}K`;
  };

  const STATE_COLORS = [
    "#3b82f6",
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#a855f7",
    "#ef4444",
    "#06b6d4",
    "#f97316",
    "#84cc16",
    "#ec4899",
  ];

  return (
    <div
      className="rounded-2xl"
      style={{
        background: cardBg,
        border: cardBorder,
        overflow: "hidden",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#3b82f612", border: "1px solid #3b82f622" }}
          >
            <MapTrifold size={13} weight="fill" style={{ color: "#3b82f6" }} />
          </div>
          <span
            className="text-sm font-bold font-sans"
            style={{ color: headText }}
          >
            US States
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "#3b82f614", color: "#3b82f6" }}
          >
            {sorted.length} tracked
          </span>
        </div>
        <button
          onClick={() => onNav("/dashboard/states")}
          className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#3b82f6" }}
        >
          All States <ArrowRight size={10} weight="bold" />
        </button>
      </div>

      {/* Carousel */}
      <div className="relative py-4 flex justify-center px-4">
        <div
          className="relative overflow-hidden"
          style={{
            width: viewportWidth !== null ? viewportWidth : "100%",
            maxWidth: "100%",
          }}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          {/* Left fade */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none z-10"
            style={{
              width: 28,
              background: `linear-gradient(to right, ${isLight ? "#f8fafc" : "#0b0b14"}, transparent)`,
            }}
          />
          {/* Right fade */}
          <div
            className="absolute inset-y-0 right-0 pointer-events-none z-10"
            style={{
              width: 28,
              background: `linear-gradient(to left, ${isLight ? "#f8fafc" : "#0b0b14"}, transparent)`,
            }}
          />

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-3"
            style={{ willChange: "transform", width: "max-content" }}
          >
            {items.map((state, idx) => {
              const color = STATE_COLORS[idx % STATE_COLORS.length];
              return (
                <div
                  key={`${state.id}-${idx}`}
                  data-state-card
                  onClick={() => onNav("/dashboard/states")}
                  className="rounded-xl overflow-hidden cursor-pointer transition-opacity duration-200 hover:opacity-90 shrink-0"
                  style={{
                    width: "calc((100vw - 260px - 56px) / 5)",
                    minWidth: 140,
                    maxWidth: 230,
                    background: isLight
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${gridLine}`,
                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
                  }}
                >
                  {/* Flag banner with actual state flag */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      height: 64,
                      borderBottom: `1px solid ${gridLine}`,
                      background: isLight ? "#e8eaf0" : "#1a1a2e",
                    }}
                  >
                    <img
                      src={`https://flagcdn.com/us-${state.id}.svg`}
                      alt={`${state.name} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    {/* Fallback: colored gradient with abbreviation */}
                    <div
                      className="absolute inset-0 items-center justify-center"
                      style={{
                        display: "none",
                        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                      }}
                    >
                      <span
                        className="text-2xl font-black font-mono"
                        style={{ color, letterSpacing: "-0.03em" }}
                      >
                        {state.abbreviation}
                      </span>
                    </div>
                    {/* Dark overlay + region badge */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.48) 100%)",
                      }}
                    />
                    <div
                      className="absolute bottom-1.5 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
                    >
                      {state.region}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-3 py-2.5 flex flex-col gap-1.5">
                    <p
                      className="text-[11px] font-bold font-sans truncate"
                      style={{ color: headText }}
                    >
                      {state.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        GDP
                      </span>
                      <span
                        className="text-[11px] font-bold font-mono"
                        style={{ color: headText }}
                      >
                        {fmtGDP(state.gdp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        Pop.
                      </span>
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: headText }}
                      >
                        {fmtPop(state.population)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        Unemp.
                      </span>
                      <span
                        className="text-[11px] font-bold font-mono"
                        style={{
                          color:
                            state.unemploymentRate < 4
                              ? "#10b981"
                              : state.unemploymentRate < 6
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      >
                        {state.unemploymentRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const fmtB = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}T` : `$${n.toFixed(0)}B`;

/* ─── Static data ──────────────────────────────────────────────────────── */
const WORLD_GDP_SERIES = [
  { year: "2018", gdp: 85.8 },
  { year: "2019", gdp: 87.6 },
  { year: "2020", gdp: 84.9 },
  { year: "2021", gdp: 96.1 },
  { year: "2022", gdp: 100.6 },
  { year: "2023", gdp: 104.5 },
  { year: "2024", gdp: 105.4 },
];

const INFLATION_DATA = [
  { year: "2022", g20: 8.7, adv: 7.3 },
  { year: "2023", g20: 6.1, adv: 4.6 },
  { year: "2024", g20: 4.8, adv: 3.2 },
  { year: "2025", g20: 3.9, adv: 2.6 },
  { year: "2026", g20: 3.2, adv: 2.2 },
];

const RECENT_EVENTS = [
  {
    tag: "Conflict",
    color: "#ef4444",
    icon: <Warning size={12} weight="fill" />,
    title: "Red Sea shipping disruptions continue",
    date: "Jul 2025",
  },
  {
    tag: "Economy",
    color: "#f59e0b",
    icon: <ChartBar size={12} weight="fill" />,
    title: "Fed holds interest rate at 5.25%",
    date: "Jun 2025",
  },
  {
    tag: "Climate",
    color: "#10b981",
    icon: <Atom size={12} weight="fill" />,
    title: "G7 pledges $50B clean energy fund",
    date: "Jun 2025",
  },
  {
    tag: "Geopolitics",
    color: "#6366f1",
    icon: <Globe size={12} weight="fill" />,
    title: "BRICS+ summit opens in Kazan",
    date: "May 2025",
  },
  {
    tag: "Trade",
    color: "#a855f7",
    icon: <Scales size={12} weight="fill" />,
    title: "US-EU tariff truce extended 6 months",
    date: "May 2025",
  },
];

const NATIONAL_HIGHLIGHTS = [
  {
    tag: "Economy",
    color: "#3b82f6",
    icon: <Bank size={12} weight="fill" />,
    title: "US GDP growth revised up to 2.8% for Q2 2025",
    sub: "Bureau of Economic Analysis",
    date: "Jul 2025",
  },
  {
    tag: "Policy",
    color: "#6366f1",
    icon: <Scales size={12} weight="fill" />,
    title: "Senate passes infrastructure spending package",
    sub: "Congress · Domestic",
    date: "Jun 2025",
  },
  {
    tag: "Labor",
    color: "#10b981",
    icon: <Buildings size={12} weight="fill" />,
    title: "Unemployment holds at 3.9% — 3rd consecutive month",
    sub: "Bureau of Labor Statistics",
    date: "Jun 2025",
  },
  {
    tag: "Energy",
    color: "#f59e0b",
    icon: <Lightning size={12} weight="fill" />,
    title: "Federal clean energy tax credits extended through 2032",
    sub: "Department of Energy",
    date: "May 2025",
  },
];

const INTERNATIONAL_EVENTS = [
  {
    tag: "Diplomacy",
    color: "#6366f1",
    icon: <Handshake size={12} weight="fill" />,
    title: "G20 summit reaches consensus on AI governance framework",
    region: "Global",
    date: "Jul 2025",
  },
  {
    tag: "Trade",
    color: "#3b82f6",
    icon: <Newspaper size={12} weight="fill" />,
    title: "EU-Mercosur trade deal enters ratification phase",
    region: "Europe · S. America",
    date: "Jun 2025",
  },
  {
    tag: "Security",
    color: "#ef4444",
    icon: <Warning size={12} weight="fill" />,
    title: "NATO defence spending pledges hit record €1.1T",
    region: "NATO Alliance",
    date: "Jun 2025",
  },
  {
    tag: "Climate",
    color: "#10b981",
    icon: <Atom size={12} weight="fill" />,
    title: "COP30 pre-summit: 47 nations pledge net-zero by 2045",
    region: "UN Framework",
    date: "May 2025",
  },
];

const REGION_STATS = [
  { region: "North America", gdp: "$29.1T", growth: "+2.4%", up: true },
  { region: "European Union", gdp: "$18.4T", growth: "+1.1%", up: true },
  { region: "Asia-Pacific", gdp: "$38.7T", growth: "+4.3%", up: true },
  { region: "Middle East", gdp: "$4.2T", growth: "+1.8%", up: true },
  { region: "Sub-Saharan Africa", gdp: "$2.1T", growth: "+3.6%", up: true },
  { region: "Latin America", gdp: "$5.8T", growth: "-0.4%", up: false },
];

const CONFLICTS_DATA = [
  {
    name: "Gaza / Israel",
    intensity: 92,
    type: "Armed Conflict",
    color: "#ef4444",
  },
  {
    name: "Ukraine / Russia",
    intensity: 88,
    type: "Interstate War",
    color: "#ef4444",
  },
  {
    name: "Sudan Civil War",
    intensity: 74,
    type: "Civil Conflict",
    color: "#f97316",
  },
  {
    name: "Myanmar Junta",
    intensity: 68,
    type: "Civil Conflict",
    color: "#f97316",
  },
  {
    name: "Sahel Insurgency",
    intensity: 61,
    type: "Terrorism",
    color: "#f59e0b",
  },
];

const CITIES_DATA = [
  {
    city: "New York",
    country: "USA",
    flag: "🇺🇸",
    pop: "8.4M",
    gdpPerCapita: 92,
    gdpLabel: "$92k",
    growth: "+1.2%",
    up: true,
    color: "#6366f1",
  },
  {
    city: "San Francisco",
    country: "USA",
    flag: "🇺🇸",
    pop: "4.8M",
    gdpPerCapita: 141,
    gdpLabel: "$141k",
    growth: "+2.1%",
    up: true,
    color: "#8b5cf6",
  },
  {
    city: "Zurich",
    country: "Switzerland",
    flag: "🇨🇭",
    pop: "435k",
    gdpPerCapita: 120,
    gdpLabel: "$120k",
    growth: "+1.6%",
    up: true,
    color: "#3b82f6",
  },
  {
    city: "London",
    country: "UK",
    flag: "🇬🇧",
    pop: "9.8M",
    gdpPerCapita: 76,
    gdpLabel: "$76k",
    growth: "+1.4%",
    up: true,
    color: "#06b6d4",
  },
  {
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    pop: "13.8M",
    gdpPerCapita: 43,
    gdpLabel: "$43k",
    growth: "+0.8%",
    up: true,
    color: "#10b981",
  },
  {
    city: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    pop: "6.0M",
    gdpPerCapita: 87,
    gdpLabel: "$87k",
    growth: "+3.2%",
    up: true,
    color: "#f59e0b",
  },
  {
    city: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    pop: "3.8M",
    gdpPerCapita: 46,
    gdpLabel: "$46k",
    growth: "+3.7%",
    up: true,
    color: "#f97316",
  },
  {
    city: "Shanghai",
    country: "China",
    flag: "🇨🇳",
    pop: "25.0M",
    gdpPerCapita: 31,
    gdpLabel: "$31k",
    growth: "+4.9%",
    up: true,
    color: "#ef4444",
  },
  {
    city: "Sydney",
    country: "Australia",
    flag: "🇦🇺",
    pop: "5.5M",
    gdpPerCapita: 65,
    gdpLabel: "$65k",
    growth: "+2.3%",
    up: true,
    color: "#a855f7",
  },
  {
    city: "Paris",
    country: "France",
    flag: "🇫🇷",
    pop: "2.2M",
    gdpPerCapita: 60,
    gdpLabel: "$60k",
    growth: "+1.1%",
    up: true,
    color: "#ec4899",
  },
];

const CITIES_CHART_DATA = [
  { name: "SFO", gdp: 141 },
  { name: "ZRH", gdp: 120 },
  { name: "NYC", gdp: 92 },
  { name: "SGP", gdp: 87 },
  { name: "SYD", gdp: 65 },
  { name: "LDN", gdp: 76 },
  { name: "PAR", gdp: 60 },
  { name: "TYO", gdp: 43 },
  { name: "DXB", gdp: 46 },
  { name: "SHA", gdp: 31 },
];

const POLICY_FEED = [
  {
    tag: "Climate",
    color: "#10b981",
    title: "EU Carbon Border Adjustment Mechanism enters full enforcement",
    date: "Jul 2025",
    description:
      "The CBAM imposes a carbon price on imports of steel, cement, aluminium, fertilisers, electricity, and hydrogen from countries with lower or no carbon pricing. Importers must purchase CBAM certificates matching the carbon price that would have been paid under EU ETS rules. The mechanism is designed to prevent carbon leakage and incentivise global trading partners to adopt equivalent climate standards. Full enforcement began July 2025 after a transitional reporting-only phase that started October 2023.",
  },
  {
    tag: "Tech",
    color: "#6366f1",
    title: "US AI Executive Order requires federal agency compliance audits",
    date: "Jun 2025",
    description:
      "Building on the October 2023 Executive Order on Safe, Secure, and Trustworthy AI, the updated directive mandates that all federal agencies complete internal audits of AI systems used in consequential decision-making — including benefits determinations, hiring, and law enforcement. Agencies must publish audit results and remediation plans by Q4 2025. The order also directs NIST to release updated AI Risk Management Framework guidelines and extends export controls on advanced AI chips to additional destinations.",
  },
  {
    tag: "Trade",
    color: "#3b82f6",
    title: "WTO rules in favour of India on steel tariff dispute",
    date: "Jun 2025",
    description:
      "The WTO Dispute Settlement Body upheld India's challenge against US Section 232 steel and aluminium tariffs imposed in 2018, ruling them inconsistent with GATT Article XI and the Safeguards Agreement. The panel found the US failed to demonstrate a genuine national security justification under GATT Article XXI. The US has 60 days to appeal to the Appellate Body or negotiate a bilateral solution. India has indicated it may reintroduce retaliatory tariffs on US goods worth $2.4B if no agreement is reached.",
  },
  {
    tag: "Defense",
    color: "#ef4444",
    title: "UK-France joint defense procurement framework signed",
    date: "May 2025",
    description:
      "The Lancaster House Defense Procurement Treaty, a successor to the 2010 Lancaster House Treaties, establishes a shared procurement office in London for joint acquisition of long-range strike munitions, naval vessels, and next-generation combat aircraft components. The framework enables joint competitive tenders, shared intellectual property agreements, and pooled maintenance contracts projected to save £3.2B over ten years. The agreement also includes a joint AI and autonomous systems research programme with a combined £800M initial investment.",
  },
];

const SECTOR_OUTLOOK = [
  {
    sector: "Defense",
    outlook: "+18%",
    confidence: 88,
    up: true,
    color: "#ef4444",
  },
  {
    sector: "Renewables",
    outlook: "+24%",
    confidence: 76,
    up: true,
    color: "#10b981",
  },
  {
    sector: "Semiconductors",
    outlook: "+31%",
    confidence: 71,
    up: true,
    color: "#6366f1",
  },
  {
    sector: "AI Infrastructure",
    outlook: "+42%",
    confidence: 83,
    up: true,
    color: "#a855f7",
  },
  {
    sector: "Commodities",
    outlook: "-6%",
    confidence: 62,
    up: false,
    color: "#f59e0b",
  },
  {
    sector: "EM Debt",
    outlook: "-11%",
    confidence: 69,
    up: false,
    color: "#ef4444",
  },
  {
    sector: "Biotech",
    outlook: "+19%",
    confidence: 67,
    up: true,
    color: "#06b6d4",
  },
  {
    sector: "Real Estate",
    outlook: "-4%",
    confidence: 58,
    up: false,
    color: "#f97316",
  },
];

const MACRO_SIGNALS = [
  { label: "Fed Funds Rate", value: "5.25%", delta: "hold", neutral: true },
  { label: "US 10Y Yield", value: "4.31%", delta: "+12bps", up: true },
  { label: "USD Index (DXY)", value: "104.6", delta: "-0.4%", up: false },
  { label: "Brent Crude", value: "$83.2", delta: "+1.8%", up: true },
  { label: "Gold (XAU)", value: "$2,341", delta: "+0.6%", up: true },
];

/* ─── US States panel static data ─────────────────────────────────────── */
const US_UPCOMING_INDUSTRIES = [
  { name: "Quantum Computing", growth: "+68%", color: "#a855f7", pct: 68 },
  { name: "Space Tech", growth: "+54%", color: "#3b82f6", pct: 54 },
  { name: "Green Hydrogen", growth: "+47%", color: "#10b981", pct: 47 },
  { name: "Biotech / mRNA", growth: "+43%", color: "#06b6d4", pct: 43 },
  { name: "AI Chips", growth: "+61%", color: "#6366f1", pct: 61 },
];

const US_FUNDING_DATA = [
  { sector: "AI / ML", raised: "$94B", color: "#6366f1", pct: 94 },
  { sector: "Clean Energy", raised: "$61B", color: "#10b981", pct: 61 },
  { sector: "Biotech", raised: "$48B", color: "#06b6d4", pct: 48 },
  { sector: "Space", raised: "$31B", color: "#3b82f6", pct: 31 },
  { sector: "Quantum", raised: "$18B", color: "#a855f7", pct: 18 },
];

const US_ALLIANCES = [
  {
    name: "AUKUS",
    partners: "UK · Australia",
    tag: "Defense",
    color: "#ef4444",
    project: "Nuclear-powered submarines + AI warfare",
  },
  {
    name: "Quad",
    partners: "Japan · India · AU",
    tag: "Geopolitics",
    color: "#6366f1",
    project: "Indo-Pacific stability + tech supply chains",
  },
  {
    name: "Five Eyes",
    partners: "UK · CA · AU · NZ",
    tag: "Intelligence",
    color: "#f59e0b",
    project: "Signals intelligence & cyber threat sharing",
  },
  {
    name: "NATO DIANA",
    partners: "31 Nations",
    tag: "Innovation",
    color: "#3b82f6",
    project: "Deep-tech accelerator for dual-use R&D",
  },
  {
    name: "Clean Power Alliance",
    partners: "IEA + G7",
    tag: "Climate",
    color: "#10b981",
    project: "100% clean grid targets by 2035",
  },
];

const US_RD_BREAKTHROUGHS = [
  {
    title: "DARPA AI pilot outperforms human in dogfight",
    field: "Defense AI",
    date: "Jun 2025",
    color: "#ef4444",
    agency: "DARPA",
  },
  {
    title: "NIH announces CRISPR cure for sickle-cell disease",
    field: "Biotech",
    date: "May 2025",
    color: "#06b6d4",
    agency: "NIH",
  },
  {
    title: "NIST certifies post-quantum encryption standard",
    field: "Cybersecurity",
    date: "Apr 2025",
    color: "#a855f7",
    agency: "NIST",
  },
  {
    title: "NASA Artemis II crew completes lunar orbit",
    field: "Space",
    date: "Mar 2025",
    color: "#3b82f6",
    agency: "NASA",
  },
  {
    title: "DOE achieves net energy gain in fusion reaction",
    field: "Energy",
    date: "Feb 2025",
    color: "#10b981",
    agency: "DOE / NIF",
  },
];

/* ─── Trends & Projections static data ────────────────────────────────── */
const GDP_PROJECTION_DATA = [
  { year: "2023", actual: 104.5, projected: null },
  { year: "2024", actual: 105.4, projected: null },
  { year: "2025", actual: null, projected: 107.1 },
  { year: "2026", actual: null, projected: 109.8 },
  { year: "2027", actual: null, projected: 113.2 },
  { year: "2028", actual: null, projected: 116.9 },
];

const GDP_PROJECTION_COMBINED = [
  { year: "2020", gdp: 84.9, type: "actual" },
  { year: "2021", gdp: 96.1, type: "actual" },
  { year: "2022", gdp: 100.6, type: "actual" },
  { year: "2023", gdp: 104.5, type: "actual" },
  { year: "2024", gdp: 105.4, type: "actual" },
  { year: "2025", gdp: 107.1, type: "projected" },
  { year: "2026", gdp: 109.8, type: "projected" },
  { year: "2027", gdp: 113.2, type: "projected" },
  { year: "2028", gdp: 116.9, type: "projected" },
];

// Recharts cannot vary stroke style within a single <Area>, so the series is
// split into two data keys and drawn as two Areas. The projected key also
// carries the last actual point so the two segments join without a gap.
const GDP_PROJECTION_CHART = GDP_PROJECTION_COMBINED.map((d, i, arr) => ({
  ...d,
  gdpActual: d.type === "actual" ? d.gdp : null,
  gdpProjected:
    d.type === "projected" || arr[i + 1]?.type === "projected" ? d.gdp : null,
}));

const RISK_SCENARIOS = [
  {
    title: "US-China Decoupling Accelerates",
    probability: 64,
    impact: "High",
    impactColor: "#ef4444",
    tag: "Trade",
    color: "#ef4444",
    desc: "Full semiconductor + EV supply chain separation by 2027. Est. $2.1T drag on global trade.",
  },
  {
    title: "AI Productivity Boom (Base Case)",
    probability: 71,
    impact: "Positive",
    impactColor: "#10b981",
    tag: "Tech",
    color: "#a855f7",
    desc: "Generative AI raises productivity 1.5–2.9 pp/yr in advanced economies. McKinsey estimates $4.4T annual value.",
  },
  {
    title: "Climate Tipping Point: Coral Collapse",
    probability: 48,
    impact: "Severe",
    impactColor: "#ef4444",
    tag: "Climate",
    color: "#10b981",
    desc: "90% coral bleaching triggers fisheries collapse affecting 600M people in coastal Southeast Asia.",
  },
  {
    title: "Fed Soft Landing Achieved",
    probability: 58,
    impact: "Positive",
    impactColor: "#10b981",
    tag: "Macro",
    color: "#3b82f6",
    desc: "Inflation converges to 2.1% by Q4 2025 without recession. Rate cuts commence Q1 2026.",
  },
  {
    title: "Middle East Conflict Expands",
    probability: 37,
    impact: "High",
    impactColor: "#ef4444",
    tag: "Conflict",
    color: "#f97316",
    desc: "Regional escalation drives Brent Crude above $110/bbl, adding 1.2 pp to global inflation.",
  },
];

const MACRO_FORECAST_2026 = [
  {
    label: "World GDP Growth",
    value: "+3.1%",
    delta: "+0.3pp vs 2025",
    up: true,
    color: "#6366f1",
  },
  {
    label: "G20 Inflation",
    value: "2.8%",
    delta: "-1.1pp",
    up: false,
    color: "#10b981",
  },
  {
    label: "Global Trade Vol.",
    value: "+3.7%",
    delta: "+1.4pp",
    up: true,
    color: "#3b82f6",
  },
  {
    label: "EM Growth Premium",
    value: "+2.4pp",
    delta: "over advanced",
    up: true,
    color: "#f59e0b",
  },
];

const SECTOR_FORECAST_DETAIL = [
  {
    sector: "AI Infrastructure",
    outlook2025: "+42%",
    outlook2026: "+38%",
    color: "#a855f7",
    drivers: "Hyperscaler capex, sovereign AI funds",
  },
  {
    sector: "Defense & Security",
    outlook2025: "+18%",
    outlook2026: "+14%",
    color: "#ef4444",
    drivers: "NATO spending pledges, Indo-Pacific arms",
  },
  {
    sector: "Renewable Energy",
    outlook2025: "+24%",
    outlook2026: "+29%",
    color: "#10b981",
    drivers: "IRA incentives, EU Green Deal",
  },
  {
    sector: "Semiconductors",
    outlook2025: "+31%",
    outlook2026: "+22%",
    color: "#6366f1",
    drivers: "CHIPS Act, AI chip demand, reshoring",
  },
  {
    sector: "Biotech / Pharma",
    outlook2025: "+19%",
    outlook2026: "+23%",
    color: "#06b6d4",
    drivers: "GLP-1 drugs, cancer vaccines, mRNA",
  },
];

const COUNTRY_GDP_PROJECTIONS = [
  {
    country: "USA",
    flag: "🇺🇸",
    gdp2025: 29.2,
    gdp2028: 33.1,
    cagr: "+4.3%",
    color: "#6366f1",
  },
  {
    country: "China",
    flag: "🇨🇳",
    gdp2025: 19.5,
    gdp2028: 23.4,
    cagr: "+6.2%",
    color: "#ef4444",
  },
  {
    country: "India",
    flag: "🇮🇳",
    gdp2025: 4.1,
    gdp2028: 5.8,
    cagr: "+12.2%",
    color: "#f59e0b",
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    gdp2025: 4.7,
    gdp2028: 5.0,
    cagr: "+2.1%",
    color: "#10b981",
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    gdp2025: 4.3,
    gdp2028: 4.4,
    cagr: "+0.8%",
    color: "#3b82f6",
  },
];

/* ─── Trends & Projections Panel ───────────────────────────────────────── */
type TrendsTab = "macro" | "sectors" | "scenarios" | "countries";

function TrendsProjectionsPanel({
  isLight,
  cardBg,
  cardBorder,
  cardShadow,
  gridLine,
  headText,
  mutedText,
  bodyText,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  gridLine: string;
  headText: string;
  mutedText: string;
  bodyText: string;
  onNav: (path: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TrendsTab>("macro");

  const TABS: {
    id: TrendsTab;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      id: "macro",
      label: "Macro Outlook",
      icon: <ChartLineUp size={12} weight="fill" />,
      color: "#6366f1",
      badge: "2025–28",
    },
    {
      id: "sectors",
      label: "Sectors",
      icon: <ChartBar size={12} weight="fill" />,
      color: "#10b981",
      badge: "5 key",
    },
    {
      id: "scenarios",
      label: "Scenarios",
      icon: <Target size={12} weight="fill" />,
      color: "#f97316",
      badge: `${RISK_SCENARIOS.length}`,
    },
    {
      id: "countries",
      label: "Country GDP",
      icon: <Globe size={12} weight="fill" />,
      color: "#3b82f6",
      badge: "Forecast",
    },
  ];

  const curColor = TABS.find((t) => t.id === activeTab)?.color ?? "#6366f1";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#6366f112", border: "1px solid #6366f122" }}
          >
            <TrendUp size={13} weight="fill" style={{ color: "#6366f1" }} />
          </div>
          <span
            className="text-sm font-bold font-sans"
            style={{ color: headText }}
          >
            Trends &amp; Projections
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "#6366f114", color: "#6366f1" }}
          >
            2025 – 2028
          </span>
        </div>
        <button
          onClick={() => onNav("/dashboard/trends")}
          className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#6366f1" }}
        >
          Full Analysis <ArrowRight size={10} weight="bold" />
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center gap-0 border-b"
        style={{ borderColor: gridLine }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold font-sans transition-all"
            style={{
              color: activeTab === tab.id ? tab.color : mutedText,
              background:
                activeTab === tab.id
                  ? isLight
                    ? "rgba(0,0,0,0.03)"
                    : "rgba(255,255,255,0.04)"
                  : "transparent",
              borderBottom:
                activeTab === tab.id
                  ? `2px solid ${tab.color}`
                  : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <span style={{ color: tab.color }}>{tab.icon}</span>
            {tab.label}
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
              style={{ background: tab.color + "15", color: tab.color }}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {/* ── MACRO OUTLOOK ─────────────────────────────────────────────── */}
        {activeTab === "macro" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: World GDP projection chart */}
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                World GDP — Actual vs IMF Projection (USD Trillions)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={GDP_PROJECTION_CHART}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="gdpActualGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="gdpProjGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke={gridLine}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
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
                    domain={[80, 120]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: `1px solid ${gridLine}`,
                      borderRadius: 8,
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number, n: string) => [`$${v}T`, n]}
                    labelStyle={{ color: mutedText }}
                  />
                  <ReferenceLine
                    x="2024"
                    stroke={gridLine}
                    strokeDasharray="4 4"
                    label={{ value: "Now", fill: mutedText, fontSize: 9 }}
                  />
                  {/* Actual: solid line, indigo fill */}
                  <Area
                    type="monotone"
                    dataKey="gdpActual"
                    name="Actual"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gdpActualGrad)"
                    connectNulls={false}
                    dot={{ r: 3, fill: "#6366f1", stroke: "none" }}
                    activeDot={{ r: 4, fill: "#6366f1" }}
                  />
                  {/* Projection: dashed line, purple fill, no dots */}
                  <Area
                    type="monotone"
                    dataKey="gdpProjected"
                    name="Projected"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    fill="url(#gdpProjGrad)"
                    connectNulls={false}
                    dot={false}
                    activeDot={{ r: 4, fill: "#a855f7" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "Actual", color: "#6366f1", dash: false },
                  { label: "Projected (IMF)", color: "#a855f7", dash: true },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <svg width="20" height="8" viewBox="0 0 20 8">
                      {l.dash ? (
                        <line
                          x1="0"
                          y1="4"
                          x2="20"
                          y2="4"
                          stroke={l.color}
                          strokeWidth="2"
                          strokeDasharray="4 3"
                        />
                      ) : (
                        <line
                          x1="0"
                          y1="4"
                          x2="20"
                          y2="4"
                          stroke={l.color}
                          strokeWidth="2"
                        />
                      )}
                    </svg>
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: mutedText }}
                    >
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 2026 macro forecasts + signals */}
            <div className="flex flex-col gap-4">
              <div>
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-2.5"
                  style={{ color: mutedText }}
                >
                  2026 Consensus Forecasts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {MACRO_FORECAST_2026.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl px-3 py-2.5"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.03)"
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${gridLine}`,
                      }}
                    >
                      <p
                        className="text-[9px] font-sans"
                        style={{ color: mutedText }}
                      >
                        {m.label}
                      </p>
                      <p
                        className="text-lg font-bold font-mono"
                        style={{ color: m.color }}
                      >
                        {m.value}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {m.up ? (
                          <TrendUp
                            size={9}
                            weight="fill"
                            style={{ color: "#10b981" }}
                          />
                        ) : (
                          <TrendDown
                            size={9}
                            weight="fill"
                            style={{ color: "#10b981" }}
                          />
                        )}
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: "#10b981" }}
                        >
                          {m.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key macro signals */}
              <div>
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: mutedText }}
                >
                  Live Macro Signals
                </p>
                <div className="flex flex-col gap-1.5">
                  {MACRO_SIGNALS.map((m) => (
                    <div
                      key={m.label}
                      className="flex items-center justify-between py-1"
                      style={{ borderBottom: `1px solid ${gridLine}` }}
                    >
                      <span
                        className="text-[10px] font-sans"
                        style={{ color: mutedText }}
                      >
                        {m.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-mono font-bold"
                          style={{ color: headText }}
                        >
                          {m.value}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{
                            color: m.neutral
                              ? mutedText
                              : m.up
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        >
                          {m.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTORS ───────────────────────────────────────────────────── */}
        {activeTab === "sectors" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: bar chart comparison */}
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Sector Outlook — 2025 vs 2026 Projected Growth
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={SECTOR_FORECAST_DETAIL.map((s) => ({
                    name: s.sector.split(" ")[0],
                    "2025": parseInt(s.outlook2025),
                    "2026": parseInt(s.outlook2026),
                    color: s.color,
                  }))}
                  margin={{ top: 4, right: 4, left: -14, bottom: 0 }}
                  barSize={10}
                  barGap={3}
                >
                  <CartesianGrid
                    stroke={gridLine}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `+${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: `1px solid ${gridLine}`,
                      borderRadius: 8,
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number, n: string) => [`+${v}%`, n]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Bar
                    dataKey="2025"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                    fillOpacity={0.85}
                  />
                  <Bar
                    dataKey="2026"
                    fill="#a855f7"
                    radius={[3, 3, 0, 0]}
                    fillOpacity={0.55}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "2025", color: "#6366f1" },
                  { label: "2026 (proj.)", color: "#a855f7" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-2 rounded-sm"
                      style={{ background: l.color }}
                    />
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: mutedText }}
                    >
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: sector detail list */}
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Key Growth Drivers
              </p>
              <div className="flex flex-col gap-0">
                {SECTOR_FORECAST_DETAIL.map((s, i) => (
                  <div
                    key={s.sector}
                    className="py-3"
                    style={{
                      borderBottom:
                        i < SECTOR_FORECAST_DETAIL.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: s.color }}
                      />
                      <span
                        className="text-xs font-bold font-sans flex-1 truncate"
                        style={{ color: headText }}
                      >
                        {s.sector}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] font-mono font-bold"
                          style={{ color: "#6366f1" }}
                        >
                          {s.outlook2025}
                        </span>
                        <ArrowRight
                          size={8}
                          weight="bold"
                          style={{ color: mutedText }}
                        />
                        <span
                          className="text-[10px] font-mono font-bold"
                          style={{ color: "#a855f7" }}
                        >
                          {s.outlook2026}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden mb-1.5"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.06)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.abs(parseInt(s.outlook2025)))}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                    <p
                      className="text-[10px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {s.drivers}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCENARIOS ─────────────────────────────────────────────────── */}
        {activeTab === "scenarios" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {RISK_SCENARIOS.map((s, _i) => (
              <div
                key={s.title}
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{
                  background: s.color + "08",
                  border: `1px solid ${s.color}20`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: s.color + "18", color: s.color }}
                    >
                      {s.tag}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        background: s.impactColor + "15",
                        color: s.impactColor,
                      }}
                    >
                      {s.impact} Impact
                    </span>
                  </div>
                  <span
                    className="text-[13px] font-bold font-mono shrink-0"
                    style={{ color: s.probability >= 60 ? s.color : mutedText }}
                  >
                    {s.probability}%
                  </span>
                </div>
                <p
                  className="text-xs font-bold font-sans leading-snug"
                  style={{ color: headText }}
                >
                  {s.title}
                </p>
                {/* Probability bar */}
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
                    style={{ width: `${s.probability}%`, background: s.color }}
                  />
                </div>
                <p
                  className="text-[10px] font-sans leading-snug"
                  style={{ color: mutedText }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
            {/* Attribution note */}
            <div
              className="lg:col-span-2 rounded-xl px-4 py-3 flex items-start gap-3"
              style={{
                background: isLight
                  ? "rgba(0,0,0,0.025)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${gridLine}`,
              }}
            >
              <Info
                size={13}
                weight="fill"
                style={{ color: mutedText, marginTop: 1, flexShrink: 0 }}
              />
              <p
                className="text-[10px] font-sans leading-relaxed"
                style={{ color: mutedText }}
              >
                Scenario probabilities are consensus estimates derived from IMF
                World Economic Outlook, World Bank Global Economic Prospects,
                and Goldman Sachs Research. All projections carry significant
                uncertainty and should not be used as financial advice.
              </p>
            </div>
          </div>
        )}

        {/* ── COUNTRY GDP FORECAST ──────────────────────────────────────── */}
        {activeTab === "countries" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: projected growth bar chart */}
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                GDP 2025 → 2028 Projection (USD Trillions)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={COUNTRY_GDP_PROJECTIONS.map((c) => ({
                    name: c.flag + " " + c.country,
                    "2025": c.gdp2025,
                    "2028": c.gdp2028,
                    color: c.color,
                  }))}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                  barSize={14}
                  barGap={4}
                >
                  <CartesianGrid
                    stroke={gridLine}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 8,
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
                      border: `1px solid ${gridLine}`,
                      borderRadius: 8,
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number, n: string) => [`$${v}T`, n]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Bar
                    dataKey="2025"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                    fillOpacity={0.7}
                  />
                  <Bar
                    dataKey="2028"
                    fill="#a855f7"
                    radius={[3, 3, 0, 0]}
                    fillOpacity={0.45}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "2025 (est.)", color: "#6366f1" },
                  { label: "2028 (proj.)", color: "#a855f7" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-2 rounded-sm"
                      style={{ background: l.color }}
                    />
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: mutedText }}
                    >
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: country detail rows */}
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                3-Year GDP CAGR Projection
              </p>
              <div className="flex flex-col gap-0">
                {COUNTRY_GDP_PROJECTIONS.map((c, i) => (
                  <div
                    key={c.country}
                    className="flex items-center gap-3 py-3"
                    style={{
                      borderBottom:
                        i < COUNTRY_GDP_PROJECTIONS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <span className="text-xl w-7 shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold font-sans"
                        style={{ color: headText }}
                      >
                        {c.country}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          ${c.gdp2025}T → ${c.gdp2028}T
                        </span>
                      </div>
                      <div
                        className="w-full h-1 rounded-full overflow-hidden mt-1.5"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (c.gdp2025 / 33) * 100)}%`,
                            background: c.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="text-sm font-bold font-mono"
                        style={{ color: c.color }}
                      >
                        {c.cagr}
                      </p>
                      <p
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        CAGR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Source note */}
              <p
                className="text-[9px] font-sans mt-3"
                style={{ color: mutedText }}
              >
                Source: IMF World Economic Outlook (Apr 2025), World Bank
                projections. Figures in current USD trillions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SECTOR_SPARKLINES: Record<string, { v: number }[]> = {
  "AI Infrastructure": [
    { v: 22 },
    { v: 28 },
    { v: 31 },
    { v: 27 },
    { v: 35 },
    { v: 39 },
    { v: 42 },
  ],
  Renewables: [
    { v: 14 },
    { v: 18 },
    { v: 17 },
    { v: 22 },
    { v: 20 },
    { v: 23 },
    { v: 24 },
  ],
  Semiconductors: [
    { v: 18 },
    { v: 22 },
    { v: 19 },
    { v: 26 },
    { v: 30 },
    { v: 28 },
    { v: 31 },
  ],
};

const QUICK_STATS = [
  {
    label: "Countries Tracked",
    value: "195",
    icon: <Globe size={18} weight="fill" />,
    color: "#6366f1",
  },
  {
    label: "US States",
    value: "50",
    icon: <MapTrifold size={18} weight="fill" />,
    color: "#3b82f6",
  },
  {
    label: "Global Cities",
    value: "500+",
    icon: <Buildings size={18} weight="fill" />,
    color: "#10b981",
  },
  {
    label: "Active Conflicts",
    value: "42",
    icon: <Crosshair size={18} weight="fill" />,
    color: "#ef4444",
  },
];

/* ─── Pinned Dashboard logic ────────────────────────────────────────────── */
const LS_KEY_COUNTRIES = "cs_pinned_countries";
const LS_KEY_STATES = "cs_pinned_states";

function usePinned(key: string, defaultIds: string[]) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultIds;
    } catch {
      return defaultIds;
    }
  });

  const toggle = (id: string) =>
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });

  return { ids, toggle };
}

/* ─── State Comparison Metrics ─────────────────────────────────────────── */
const STATE_COMPARE_METRICS = [
  {
    label: "GDP",
    unit: "",
    get: (s: (typeof usStatesData)[0]) =>
      s.gdp >= 1000
        ? `$${(s.gdp / 1000).toFixed(1)}T`
        : `$${Math.round(s.gdp)}B`,
    raw: (s: (typeof usStatesData)[0]) => s.gdp,
    higherBetter: true,
    color: "#6366f1",
  },
  {
    label: "Population",
    unit: "",
    get: (s: (typeof usStatesData)[0]) => {
      const n = s.population;
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
      return `${Math.round(n / 1000)}K`;
    },
    raw: (s: (typeof usStatesData)[0]) => s.population,
    higherBetter: true,
    color: "#3b82f6",
  },
  {
    label: "Unemployment",
    unit: "%",
    get: (s: (typeof usStatesData)[0]) => `${s.unemploymentRate.toFixed(1)}%`,
    raw: (s: (typeof usStatesData)[0]) => s.unemploymentRate,
    higherBetter: false,
    color: "#f59e0b",
  },
  {
    label: "Median Income",
    unit: "",
    get: (s: (typeof usStatesData)[0]) => `$${s.medianIncome.toLocaleString()}`,
    raw: (s: (typeof usStatesData)[0]) => s.medianIncome,
    higherBetter: true,
    color: "#10b981",
  },
  {
    label: "Avg Income",
    unit: "",
    get: (s: (typeof usStatesData)[0]) =>
      `$${s.averageIncome.toLocaleString()}`,
    raw: (s: (typeof usStatesData)[0]) => s.averageIncome,
    higherBetter: true,
    color: "#06b6d4",
  },
  {
    label: "State Tax",
    unit: "%",
    get: (s: (typeof usStatesData)[0]) =>
      s.stateTaxRate === 0 ? "None" : `${s.stateTaxRate.toFixed(2)}%`,
    raw: (s: (typeof usStatesData)[0]) => s.stateTaxRate,
    higherBetter: false,
    color: "#ef4444",
  },
  {
    label: "Sales Tax",
    unit: "%",
    get: (s: (typeof usStatesData)[0]) => `${s.salesTaxRate.toFixed(2)}%`,
    raw: (s: (typeof usStatesData)[0]) => s.salesTaxRate,
    higherBetter: false,
    color: "#f97316",
  },
  {
    label: "Min Wage",
    unit: "$/hr",
    get: (s: (typeof usStatesData)[0]) => `$${s.minimumWage.toFixed(2)}`,
    raw: (s: (typeof usStatesData)[0]) => s.minimumWage,
    higherBetter: true,
    color: "#a855f7",
  },
  {
    label: "Quality of Life",
    unit: "/100",
    get: (s: (typeof usStatesData)[0]) => `${s.qualityOfLiving}/100`,
    raw: (s: (typeof usStatesData)[0]) => s.qualityOfLiving,
    higherBetter: true,
    color: "#14b8a6",
  },
  {
    label: "Area (km²)",
    unit: "km²",
    get: (s: (typeof usStatesData)[0]) =>
      s.areaKm2 >= 100_000
        ? `${(s.areaKm2 / 1_000).toFixed(0)}k`
        : `${s.areaKm2.toLocaleString()}`,
    raw: (s: (typeof usStatesData)[0]) => s.areaKm2,
    higherBetter: true,
    color: "#84cc16",
  },
];

/* ─── Country Comparison Tool ──────────────────────────────────────────── */
const COUNTRY_FLAGS: Record<string, string> = Object.fromEntries(
  countriesData.map((c) => [c.id, (c as any).flag ?? c.code]),
);

const COMPARE_METRICS = [
  {
    label: "GDP",
    unit: "",
    get: (c: (typeof countriesData)[0]) =>
      c.gdp >= 1000
        ? `$${(c.gdp / 1000).toFixed(1)}T`
        : `$${Math.round(c.gdp)}B`,
    raw: (c: (typeof countriesData)[0]) => c.gdp,
    higherBetter: true,
    color: "#6366f1",
  },
  {
    label: "GDP / Capita",
    unit: "",
    get: (c: (typeof countriesData)[0]) =>
      `$${c.gdpPerCapita.toLocaleString()}`,
    raw: (c: (typeof countriesData)[0]) => c.gdpPerCapita,
    higherBetter: true,
    color: "#8b5cf6",
  },
  {
    label: "GDP Growth",
    unit: "%",
    get: (c: (typeof countriesData)[0]) =>
      `${c.gdpGrowth >= 0 ? "+" : ""}${c.gdpGrowth}%`,
    raw: (c: (typeof countriesData)[0]) => c.gdpGrowth,
    higherBetter: true,
    color: "#10b981",
  },
  {
    label: "Population",
    unit: "",
    get: (c: (typeof countriesData)[0]) => {
      const n = c.population;
      if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
      return `${Math.round(n / 1000)}K`;
    },
    raw: (c: (typeof countriesData)[0]) => c.population,
    higherBetter: true,
    color: "#3b82f6",
  },
  {
    label: "Unemployment",
    unit: "%",
    get: (c: (typeof countriesData)[0]) => `${c.unemploymentRate.toFixed(1)}%`,
    raw: (c: (typeof countriesData)[0]) => c.unemploymentRate,
    higherBetter: false,
    color: "#f59e0b",
  },
  {
    label: "Inflation",
    unit: "%",
    get: (c: (typeof countriesData)[0]) => `${c.inflationRate}%`,
    raw: (c: (typeof countriesData)[0]) => c.inflationRate,
    higherBetter: false,
    color: "#ef4444",
  },
  {
    label: "Life Expectancy",
    unit: "yrs",
    get: (c: (typeof countriesData)[0]) => `${c.lifeExpectancy} yrs`,
    raw: (c: (typeof countriesData)[0]) => c.lifeExpectancy,
    higherBetter: true,
    color: "#06b6d4",
  },
  {
    label: "HDI",
    unit: "",
    get: (c: (typeof countriesData)[0]) =>
      `${c.humanDevelopmentIndex.toFixed(3)}`,
    raw: (c: (typeof countriesData)[0]) => c.humanDevelopmentIndex,
    higherBetter: true,
    color: "#a855f7",
  },
  {
    label: "Trade Balance",
    unit: "B",
    get: (c: (typeof countriesData)[0]) =>
      `${c.tradeBalance >= 0 ? "+" : ""}$${c.tradeBalance}B`,
    raw: (c: (typeof countriesData)[0]) => c.tradeBalance,
    higherBetter: true,
    color: "#14b8a6",
  },
  {
    label: "Area (km²)",
    unit: "km²",
    get: (c: (typeof countriesData)[0]) =>
      c.areaKm2 >= 1_000_000
        ? `${(c.areaKm2 / 1_000_000).toFixed(1)}M`
        : `${c.areaKm2.toLocaleString()}`,
    raw: (c: (typeof countriesData)[0]) => c.areaKm2,
    higherBetter: true,
    color: "#84cc16",
  },
];

function CompareCountriesTool({
  isLight,
  cardBg,
  cardBorder,
  gridLine,
  headText,
  mutedText,
  bodyText,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  gridLine: string;
  headText: string;
  mutedText: string;
  bodyText: string;
  onNav: (path: string) => void;
}) {
  const accent = "#6366f1";
  const stateAccent = "#3b82f6";

  const [tab, setTab] = useState<"countries" | "states">("countries");

  // Countries state
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([
    "us",
    "cn",
    "de",
  ]);
  const [countryDropOpen, setCountryDropOpen] = useState(false);
  const countryDropRef = useRef<HTMLDivElement>(null);

  // States state
  const [stateSearch, setStateSearch] = useState("");
  const [selectedStateIds, setSelectedStateIds] = useState<string[]>([
    "ca",
    "tx",
    "ny",
  ]);
  const [stateDropOpen, setStateDropOpen] = useState(false);
  const stateDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        countryDropRef.current &&
        !countryDropRef.current.contains(e.target as Node)
      ) {
        setCountryDropOpen(false);
      }
      if (
        stateDropRef.current &&
        !stateDropRef.current.contains(e.target as Node)
      ) {
        setStateDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCountries = useMemo(
    () =>
      countriesData
        .filter(
          (c) =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.code.toLowerCase().includes(countrySearch.toLowerCase()),
        )
        .slice(0, 60),
    [countrySearch],
  );

  const filteredStates = useMemo(
    () =>
      usStatesData
        .filter(
          (s) =>
            s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
            s.abbreviation.toLowerCase().includes(stateSearch.toLowerCase()),
        )
        .slice(0, 60),
    [stateSearch],
  );

  const selectedCountries = useMemo(
    () => countriesData.filter((c) => selectedCountryIds.includes(c.id)),
    [selectedCountryIds],
  );

  const selectedStates = useMemo(
    () => usStatesData.filter((s) => selectedStateIds.includes(s.id)),
    [selectedStateIds],
  );

  const toggleCountry = (id: string) => {
    setSelectedCountryIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    );
  };

  const toggleState = (id: string) => {
    setSelectedStateIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    );
  };

  const curAccent = tab === "countries" ? accent : stateAccent;
  const pillBg =
    tab === "countries"
      ? isLight
        ? "rgba(99,102,241,0.07)"
        : "rgba(99,102,241,0.12)"
      : isLight
        ? "rgba(59,130,246,0.07)"
        : "rgba(59,130,246,0.12)";
  const pillBorder =
    tab === "countries"
      ? isLight
        ? "rgba(99,102,241,0.22)"
        : "rgba(99,102,241,0.28)"
      : isLight
        ? "rgba(59,130,246,0.22)"
        : "rgba(59,130,246,0.28)";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: curAccent + "12",
              border: `1px solid ${curAccent}22`,
            }}
          >
            <ChartDonut size={13} weight="fill" style={{ color: curAccent }} />
          </div>
          <span
            className="text-sm font-bold font-sans"
            style={{ color: headText }}
          >
            Compare
          </span>
          {/* Tab toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: `1px solid ${gridLine}` }}
          >
            {(["countries", "states"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 text-[10px] font-bold font-mono transition-all"
                style={{
                  background:
                    tab === t
                      ? (t === "countries" ? accent : stateAccent) + "18"
                      : "transparent",
                  color:
                    tab === t
                      ? t === "countries"
                        ? accent
                        : stateAccent
                      : mutedText,
                  borderRight:
                    t === "countries" ? `1px solid ${gridLine}` : "none",
                }}
              >
                {t === "countries" ? "Countries" : "US States"}
              </button>
            ))}
          </div>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: curAccent + "14", color: curAccent }}
          >
            up to 4
          </span>
        </div>
        <button
          onClick={() =>
            onNav(
              tab === "countries"
                ? "/dashboard/countries"
                : "/dashboard/states",
            )
          }
          className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: curAccent }}
        >
          Full explorer <ArrowRight size={10} weight="bold" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* ── COUNTRIES TAB ─────────────────────────────────────────────── */}
        {tab === "countries" && (
          <>
            {/* Selector row */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedCountries.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold font-sans"
                  style={{
                    background: accent + "12",
                    border: `1px solid ${accent}30`,
                    color: headText,
                  }}
                >
                  <span className="text-sm leading-none">
                    {(c as any).flag ?? c.code}
                  </span>
                  <span className="truncate max-w-[80px]">{c.name}</span>
                  <button
                    onClick={() => toggleCountry(c.id)}
                    className="ml-0.5 hover:opacity-60 transition-opacity"
                    style={{ color: mutedText }}
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              ))}

              {selectedCountryIds.length < 4 && (
                <div className="relative" ref={countryDropRef}>
                  <button
                    onClick={() => setCountryDropOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{
                      background: pillBg,
                      border: `1px dashed ${pillBorder}`,
                      color: accent,
                    }}
                  >
                    <MagnifyingGlass size={11} weight="bold" />
                    Add country
                  </button>
                  {countryDropOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50"
                      style={{
                        background: isLight ? "#fff" : "#1a1730",
                        border: `1px solid ${gridLine}`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        width: 220,
                      }}
                    >
                      <div
                        className="p-2"
                        style={{ borderBottom: `1px solid ${gridLine}` }}
                      >
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search countries…"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-transparent text-[11px] font-sans outline-none border-none px-2 py-1"
                          style={{ color: bodyText }}
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredCountries.map((c) => {
                          const isSel = selectedCountryIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                toggleCountry(c.id);
                                setCountrySearch("");
                                if (selectedCountryIds.length >= 3)
                                  setCountryDropOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:opacity-75 transition-opacity"
                              style={{
                                background: isSel
                                  ? accent + "12"
                                  : "transparent",
                                borderBottom: `1px solid ${gridLine}`,
                              }}
                            >
                              <span className="text-base w-6 shrink-0">
                                {(c as any).flag ?? c.code}
                              </span>
                              <span
                                className="flex-1 text-[11px] font-sans truncate"
                                style={{ color: headText }}
                              >
                                {c.name}
                              </span>
                              {isSel && (
                                <CheckCircle
                                  size={12}
                                  weight="fill"
                                  style={{ color: accent }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedCountryIds.length > 0 && (
                <button
                  onClick={() => setSelectedCountryIds([])}
                  className="text-[10px] font-mono transition-opacity hover:opacity-60 ml-auto"
                  style={{ color: mutedText }}
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedCountries.length === 0 && (
              <div
                className="rounded-xl px-4 py-6 text-center"
                style={{
                  background: isLight
                    ? "rgba(0,0,0,0.025)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px dashed ${gridLine}`,
                }}
              >
                <Globe
                  size={24}
                  weight="duotone"
                  style={{ color: mutedText, margin: "0 auto 8px" }}
                />
                <p
                  className="text-[12px] font-sans"
                  style={{ color: mutedText }}
                >
                  Add countries above to compare metrics side-by-side
                </p>
              </div>
            )}

            {selectedCountries.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${gridLine}` }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `clamp(100px,28%,160px) repeat(${selectedCountries.length}, 1fr)`,
                    background: isLight
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(255,255,255,0.04)",
                    borderBottom: `1px solid ${gridLine}`,
                  }}
                >
                  <div className="px-3 py-2.5 flex items-center">
                    <span
                      className="text-[9px] font-mono uppercase tracking-widest"
                      style={{ color: mutedText }}
                    >
                      Metric
                    </span>
                  </div>
                  {selectedCountries.map((c) => (
                    <div
                      key={c.id}
                      className="px-2 py-2.5 text-center flex flex-col items-center gap-0.5"
                    >
                      <span className="text-lg leading-none">
                        {(c as any).flag ?? c.code}
                      </span>
                      <p
                        className="text-[10px] font-bold font-sans truncate w-full text-center"
                        style={{ color: headText }}
                      >
                        {c.name.length > 12
                          ? c.name.slice(0, 11) + "…"
                          : c.name}
                      </p>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {c.continent}
                      </span>
                    </div>
                  ))}
                </div>
                {COMPARE_METRICS.map((m, ri) => {
                  const bestId =
                    selectedCountries.length >= 2
                      ? [...selectedCountries].sort((a, b) =>
                          m.higherBetter
                            ? m.raw(b) - m.raw(a)
                            : m.raw(a) - m.raw(b),
                        )[0].id
                      : null;
                  const worstId =
                    selectedCountries.length >= 2
                      ? [...selectedCountries].sort((a, b) =>
                          m.higherBetter
                            ? m.raw(a) - m.raw(b)
                            : m.raw(b) - m.raw(a),
                        )[0].id
                      : null;
                  return (
                    <div
                      key={m.label}
                      className="grid"
                      style={{
                        gridTemplateColumns: `clamp(100px,28%,160px) repeat(${selectedCountries.length}, 1fr)`,
                        background:
                          ri % 2 === 0
                            ? "transparent"
                            : isLight
                              ? "rgba(0,0,0,0.018)"
                              : "rgba(255,255,255,0.022)",
                        borderBottom:
                          ri < COMPARE_METRICS.length - 1
                            ? `1px solid ${gridLine}`
                            : "none",
                      }}
                    >
                      <div
                        className="px-3 py-2.5 flex items-center gap-2"
                        style={{ borderRight: `1px solid ${gridLine}` }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: m.color }}
                        />
                        <span
                          className="text-[10px] font-mono font-semibold uppercase tracking-wide"
                          style={{ color: mutedText }}
                        >
                          {m.label}
                        </span>
                      </div>
                      {selectedCountries.map((c) => {
                        const isBest = bestId === c.id;
                        const isWorst =
                          worstId === c.id &&
                          selectedCountries.length >= 2 &&
                          bestId !== worstId;
                        const rawVal = m.raw(c);
                        const max = Math.max(
                          ...selectedCountries.map((x) => Math.abs(m.raw(x))),
                        );
                        const barPct = max > 0 ? Math.abs(rawVal) / max : 0;
                        return (
                          <div
                            key={c.id}
                            className="px-2 py-2 flex flex-col items-center justify-center gap-1"
                          >
                            <span
                              className="text-[12px] font-mono font-bold leading-tight"
                              style={{
                                color: isBest
                                  ? m.color
                                  : isWorst
                                    ? isLight
                                      ? "rgba(30,41,59,0.45)"
                                      : "rgba(255,255,255,0.35)"
                                    : headText,
                              }}
                            >
                              {m.get(c)}
                              {isBest && selectedCountries.length >= 2 && (
                                <span
                                  className="ml-0.5 text-[8px]"
                                  style={{ color: m.color }}
                                >
                                  ▲
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedCountries.length >= 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: "Highest GDP",
                    entity: [...selectedCountries].sort(
                      (a, b) => b.gdp - a.gdp,
                    )[0],
                    color: "#6366f1",
                  },
                  {
                    label: "Fastest Growing",
                    entity: [...selectedCountries].sort(
                      (a, b) => b.gdpGrowth - a.gdpGrowth,
                    )[0],
                    color: "#10b981",
                  },
                  {
                    label: "Lowest Unemployment",
                    entity: [...selectedCountries].sort(
                      (a, b) => a.unemploymentRate - b.unemploymentRate,
                    )[0],
                    color: "#f59e0b",
                  },
                  {
                    label: "Highest HDI",
                    entity: [...selectedCountries].sort(
                      (a, b) =>
                        b.humanDevelopmentIndex - a.humanDevelopmentIndex,
                    )[0],
                    color: "#a855f7",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                    style={{
                      background: s.color + "10",
                      border: `1px solid ${s.color}20`,
                    }}
                  >
                    <span className="text-xl leading-none shrink-0">
                      {(s.entity as any).flag ?? s.entity.code}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-[9px] font-mono uppercase tracking-wide"
                        style={{ color: s.color }}
                      >
                        {s.label}
                      </p>
                      <p
                        className="text-[11px] font-bold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {s.entity.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── US STATES TAB ─────────────────────────────────────────────── */}
        {tab === "states" && (
          <>
            {/* Selector row */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedStates.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold font-sans"
                  style={{
                    background: stateAccent + "12",
                    border: `1px solid ${stateAccent}30`,
                    color: headText,
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold px-1 rounded"
                    style={{
                      background: stateAccent + "20",
                      color: stateAccent,
                    }}
                  >
                    {s.abbreviation}
                  </span>
                  <span className="truncate max-w-[80px]">{s.name}</span>
                  <button
                    onClick={() => toggleState(s.id)}
                    className="ml-0.5 hover:opacity-60 transition-opacity"
                    style={{ color: mutedText }}
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              ))}

              {selectedStateIds.length < 4 && (
                <div className="relative" ref={stateDropRef}>
                  <button
                    onClick={() => setStateDropOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{
                      background: pillBg,
                      border: `1px dashed ${pillBorder}`,
                      color: stateAccent,
                    }}
                  >
                    <MagnifyingGlass size={11} weight="bold" />
                    Add state
                  </button>
                  {stateDropOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50"
                      style={{
                        background: isLight ? "#fff" : "#1a1730",
                        border: `1px solid ${gridLine}`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        width: 220,
                      }}
                    >
                      <div
                        className="p-2"
                        style={{ borderBottom: `1px solid ${gridLine}` }}
                      >
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search states…"
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          className="w-full bg-transparent text-[11px] font-sans outline-none border-none px-2 py-1"
                          style={{ color: bodyText }}
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredStates.map((st) => {
                          const isSel = selectedStateIds.includes(st.id);
                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                toggleState(st.id);
                                setStateSearch("");
                                if (selectedStateIds.length >= 3)
                                  setStateDropOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:opacity-75 transition-opacity"
                              style={{
                                background: isSel
                                  ? stateAccent + "12"
                                  : "transparent",
                                borderBottom: `1px solid ${gridLine}`,
                              }}
                            >
                              <span
                                className="text-[10px] font-mono font-bold w-7 shrink-0 text-center rounded"
                                style={{
                                  background: stateAccent + "15",
                                  color: stateAccent,
                                }}
                              >
                                {st.abbreviation}
                              </span>
                              <span
                                className="flex-1 text-[11px] font-sans truncate"
                                style={{ color: headText }}
                              >
                                {st.name}
                              </span>
                              {isSel && (
                                <CheckCircle
                                  size={12}
                                  weight="fill"
                                  style={{ color: stateAccent }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedStateIds.length > 0 && (
                <button
                  onClick={() => setSelectedStateIds([])}
                  className="text-[10px] font-mono transition-opacity hover:opacity-60 ml-auto"
                  style={{ color: mutedText }}
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedStates.length === 0 && (
              <div
                className="rounded-xl px-4 py-6 text-center"
                style={{
                  background: isLight
                    ? "rgba(0,0,0,0.025)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px dashed ${gridLine}`,
                }}
              >
                <MapTrifold
                  size={24}
                  weight="duotone"
                  style={{ color: mutedText, margin: "0 auto 8px" }}
                />
                <p
                  className="text-[12px] font-sans"
                  style={{ color: mutedText }}
                >
                  Add US states above to compare metrics side-by-side
                </p>
              </div>
            )}

            {selectedStates.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${gridLine}` }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `clamp(100px,28%,160px) repeat(${selectedStates.length}, 1fr)`,
                    background: isLight
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(255,255,255,0.04)",
                    borderBottom: `1px solid ${gridLine}`,
                  }}
                >
                  <div className="px-3 py-2.5 flex items-center">
                    <span
                      className="text-[9px] font-mono uppercase tracking-widest"
                      style={{ color: mutedText }}
                    >
                      Metric
                    </span>
                  </div>
                  {selectedStates.map((s) => (
                    <div
                      key={s.id}
                      className="px-2 py-2.5 text-center flex flex-col items-center gap-0.5"
                    >
                      <span
                        className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: stateAccent + "18",
                          color: stateAccent,
                        }}
                      >
                        {s.abbreviation}
                      </span>
                      <p
                        className="text-[10px] font-bold font-sans truncate w-full text-center"
                        style={{ color: headText }}
                      >
                        {s.name.length > 12
                          ? s.name.slice(0, 11) + "…"
                          : s.name}
                      </p>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {s.region}
                      </span>
                    </div>
                  ))}
                </div>
                {STATE_COMPARE_METRICS.map((m, ri) => {
                  const bestId =
                    selectedStates.length >= 2
                      ? [...selectedStates].sort((a, b) =>
                          m.higherBetter
                            ? m.raw(b) - m.raw(a)
                            : m.raw(a) - m.raw(b),
                        )[0].id
                      : null;
                  const worstId =
                    selectedStates.length >= 2
                      ? [...selectedStates].sort((a, b) =>
                          m.higherBetter
                            ? m.raw(a) - m.raw(b)
                            : m.raw(b) - m.raw(a),
                        )[0].id
                      : null;
                  return (
                    <div
                      key={m.label}
                      className="grid"
                      style={{
                        gridTemplateColumns: `clamp(100px,28%,160px) repeat(${selectedStates.length}, 1fr)`,
                        background:
                          ri % 2 === 0
                            ? "transparent"
                            : isLight
                              ? "rgba(0,0,0,0.018)"
                              : "rgba(255,255,255,0.022)",
                        borderBottom:
                          ri < STATE_COMPARE_METRICS.length - 1
                            ? `1px solid ${gridLine}`
                            : "none",
                      }}
                    >
                      <div
                        className="px-3 py-2.5 flex items-center gap-2"
                        style={{ borderRight: `1px solid ${gridLine}` }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: m.color }}
                        />
                        <span
                          className="text-[10px] font-mono font-semibold uppercase tracking-wide"
                          style={{ color: mutedText }}
                        >
                          {m.label}
                        </span>
                      </div>
                      {selectedStates.map((s) => {
                        const isBest = bestId === s.id;
                        const isWorst =
                          worstId === s.id &&
                          selectedStates.length >= 2 &&
                          bestId !== worstId;
                        const rawVal = m.raw(s);
                        const max = Math.max(
                          ...selectedStates.map((x) => Math.abs(m.raw(x))),
                        );
                        const barPct = max > 0 ? Math.abs(rawVal) / max : 0;
                        return (
                          <div
                            key={s.id}
                            className="px-2 py-2 flex flex-col items-center justify-center gap-1"
                          >
                            <span
                              className="text-[12px] font-mono font-bold leading-tight"
                              style={{
                                color: isBest
                                  ? m.color
                                  : isWorst
                                    ? isLight
                                      ? "rgba(30,41,59,0.45)"
                                      : "rgba(255,255,255,0.35)"
                                    : headText,
                              }}
                            >
                              {m.get(s)}
                              {isBest && selectedStates.length >= 2 && (
                                <span
                                  className="ml-0.5 text-[8px]"
                                  style={{ color: m.color }}
                                >
                                  ▲
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedStates.length >= 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: "Highest GDP",
                    entity: [...selectedStates].sort(
                      (a, b) => b.gdp - a.gdp,
                    )[0],
                    color: "#6366f1",
                  },
                  {
                    label: "Lowest Unemp.",
                    entity: [...selectedStates].sort(
                      (a, b) => a.unemploymentRate - b.unemploymentRate,
                    )[0],
                    color: "#10b981",
                  },
                  {
                    label: "Highest Income",
                    entity: [...selectedStates].sort(
                      (a, b) => b.medianIncome - a.medianIncome,
                    )[0],
                    color: "#f59e0b",
                  },
                  {
                    label: "Best QoL",
                    entity: [...selectedStates].sort(
                      (a, b) => b.qualityOfLiving - a.qualityOfLiving,
                    )[0],
                    color: "#a855f7",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                    style={{
                      background: s.color + "10",
                      border: `1px solid ${s.color}20`,
                    }}
                  >
                    <span
                      className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: s.color + "20", color: s.color }}
                    >
                      {s.entity.abbreviation}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-[9px] font-mono uppercase tracking-wide"
                        style={{ color: s.color }}
                      >
                        {s.label}
                      </p>
                      <p
                        className="text-[11px] font-bold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {s.entity.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Pinned Section Component ─────────────────────────────────────────── */
function PinnedSection({
  isLight,
  cardBg,
  cardBorder,
  cardShadow,
  gridLine,
  headText,
  mutedText,
  bodyText,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  gridLine: string;
  headText: string;
  mutedText: string;
  bodyText: string;
  onNav: (path: string) => void;
}) {
  // Body was reduced to a pass-through; the former local state (pin editing,
  // country search, usePinned) is gone because nothing rendered it.
  return (
    <CompareCountriesTool
      isLight={isLight}
      cardBg={cardBg}
      cardBorder={cardBorder}
      gridLine={gridLine}
      headText={headText}
      mutedText={mutedText}
      bodyText={bodyText}
      onNav={onNav}
    />
  );
}

/* ─── Trending / Popular data ──────────────────────────────────────────── */
const TRENDING_STATS = [
  {
    rank: 1,
    label: "US GDP",
    value: "$27.4T",
    delta: "+2.8%",
    up: true,
    color: "#6366f1",
    tag: "Economy",
    views: "148k",
  },
  {
    rank: 2,
    label: "China GDP Growth",
    value: "+4.6%",
    delta: "vs 4.2% est.",
    up: true,
    color: "#ef4444",
    tag: "Economy",
    views: "134k",
  },
  {
    rank: 3,
    label: "Global Inflation",
    value: "3.9%",
    delta: "-0.7pp YoY",
    up: false,
    color: "#f59e0b",
    tag: "Macro",
    views: "121k",
  },
  {
    rank: 4,
    label: "Gaza Conflict",
    value: "Intensity 92",
    delta: "Escalating",
    up: false,
    color: "#ef4444",
    tag: "Conflict",
    views: "118k",
  },
  {
    rank: 5,
    label: "AI Infrastructure",
    value: "+42%",
    delta: "12-mo outlook",
    up: true,
    color: "#a855f7",
    tag: "Sector",
    views: "109k",
  },
  {
    rank: 6,
    label: "NATO Defense Spend",
    value: "€1.1T",
    delta: "Record high",
    up: true,
    color: "#3b82f6",
    tag: "Policy",
    views: "97k",
  },
  {
    rank: 7,
    label: "Brent Crude",
    value: "$83.2",
    delta: "+1.8%",
    up: true,
    color: "#f97316",
    tag: "Commodity",
    views: "93k",
  },
  {
    rank: 8,
    label: "India HDI",
    value: "0.644",
    delta: "+0.012 YoY",
    up: true,
    color: "#10b981",
    tag: "Development",
    views: "88k",
  },
];

const TRENDING_TOPICS = [
  { label: "US-China Trade", heat: 96, color: "#ef4444" },
  { label: "AI Regulation", heat: 91, color: "#a855f7" },
  { label: "Climate Finance", heat: 87, color: "#10b981" },
  { label: "Dollar Strength", heat: 83, color: "#6366f1" },
  { label: "Ukraine War", heat: 79, color: "#f97316" },
  { label: "Fed Rate Path", heat: 74, color: "#f59e0b" },
];

const MOST_VIEWED_COUNTRIES = [
  {
    code: "us",
    flag: "🇺🇸",
    name: "United States",
    views: "204k",
    color: "#6366f1",
  },
  { code: "cn", flag: "🇨🇳", name: "China", views: "187k", color: "#ef4444" },
  { code: "de", flag: "🇩🇪", name: "Germany", views: "143k", color: "#f59e0b" },
  { code: "in", flag: "🇮🇳", name: "India", views: "138k", color: "#10b981" },
  {
    code: "gb",
    flag: "🇬🇧",
    name: "United Kingdom",
    views: "121k",
    color: "#3b82f6",
  },
];

/* ─── Interactive Data Panel (Countries / Economies / Policies tabs) ──── */
type DataTab = "countries" | "economies" | "policies";

function InteractiveDataPanel({
  isLight,
  cardBg,
  cardBorder,
  cardShadow,
  gridLine,
  headText,
  mutedText,
  bodyText,
  topCountries,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  gridLine: string;
  headText: string;
  mutedText: string;
  bodyText: string;
  topCountries: typeof countriesData;
  onNav: (path: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<DataTab>("countries");
  const [search, setSearch] = useState("");

  // sorted all countries by GDP desc
  const allByGDP = useMemo(
    () => [...countriesData].sort((a, b) => b.gdp - a.gdp),
    [],
  );

  const [selectedCountry, setSelectedCountry] = useState<
    (typeof countriesData)[0] | null
  >(() => [...countriesData].sort((a, b) => b.gdp - a.gdp)[0] ?? null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(
    REGION_STATS[0]?.region ?? null,
  );
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(0);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase();
    return allByGDP
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.continent.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [search, allByGDP]);

  const filteredRegions = useMemo(() => {
    const q = search.toLowerCase();
    return REGION_STATS.filter((r) => r.region.toLowerCase().includes(q));
  }, [search]);

  const filteredPolicies = useMemo(() => {
    const q = search.toLowerCase();
    return POLICY_FEED.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q),
    );
  }, [search]);

  const TAB_CONFIG: {
    id: DataTab;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      id: "countries",
      label: "Countries",
      icon: <Globe size={12} weight="fill" />,
      color: "#6366f1",
      badge: `${allByGDP.length}`,
    },
    {
      id: "economies",
      label: "Economies",
      icon: <ChartBar size={12} weight="fill" />,
      color: "#f59e0b",
      badge: "Blocs",
    },
    {
      id: "policies",
      label: "Policies",
      icon: <Scales size={12} weight="fill" />,
      color: "#a855f7",
      badge: "1,200+",
    },
  ];

  const curColor =
    TAB_CONFIG.find((t) => t.id === activeTab)?.color ?? "#6366f1";

  const fmtGDPShort = (b: number) =>
    b >= 1000 ? `$${(b / 1000).toFixed(1)}T` : `$${Math.round(b)}B`;

  return (
    <div
      className="flex flex-col gap-0 rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
    >
      {/* ── Tab Bar ── */}
      <div
        className="flex items-center gap-0 border-b"
        style={{ borderColor: gridLine }}
      >
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearch("");
              setSelectedCountry(
                tab.id === "countries"
                  ? ([...countriesData].sort((a, b) => b.gdp - a.gdp)[0] ??
                      null)
                  : null,
              );
              setSelectedRegion(
                tab.id === "economies"
                  ? (REGION_STATS[0]?.region ?? null)
                  : null,
              );
              setSelectedPolicy(tab.id === "policies" ? 0 : null);
            }}
            className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold font-sans transition-all relative"
            style={{
              color: activeTab === tab.id ? tab.color : mutedText,
              background:
                activeTab === tab.id
                  ? isLight
                    ? "rgba(0,0,0,0.03)"
                    : "rgba(255,255,255,0.04)"
                  : "transparent",
              borderBottom:
                activeTab === tab.id
                  ? `2px solid ${tab.color}`
                  : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <span style={{ color: tab.color }}>{tab.icon}</span>
            {tab.label}
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
              style={{ background: tab.color + "15", color: tab.color }}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-2"
        style={{ borderColor: gridLine }}
      >
        <MagnifyingGlass size={13} style={{ color: mutedText }} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedCountry(null);
            setSelectedRegion(null);
            setSelectedPolicy(null);
          }}
          placeholder={
            activeTab === "countries"
              ? "Search countries, continents…"
              : activeTab === "economies"
                ? "Search regions…"
                : "Search policies, tags…"
          }
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: bodyText }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ color: mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex" style={{ height: 520, overflow: "hidden" }}>
        {/* List column — fixed height, internal scroll */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{
            width: "44%",
            borderRight: `1px solid ${gridLine}`,
            height: "100%",
          }}
        >
          {/* ── COUNTRIES tab ── */}
          {activeTab === "countries" && (
            <>
              {/* World GDP sparkline mini */}
              <div className="px-4 pt-3 pb-1">
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-1.5"
                  style={{ color: mutedText }}
                >
                  World GDP Trend
                </p>
                <ResponsiveContainer width="100%" height={52}>
                  <AreaChart
                    data={WORLD_GDP_SERIES}
                    margin={{ top: 2, right: 2, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="miniWorldGdp"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6366f1"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="year"
                      tick={{
                        fontSize: 8,
                        fill: mutedText,
                        fontFamily: "monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isLight ? "#fff" : "#1a1730",
                        border: `1px solid ${gridLine}`,
                        borderRadius: 8,
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: headText,
                      }}
                      formatter={(v: number) => [`$${v}T`, "GDP"]}
                      labelStyle={{ color: mutedText }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gdp"
                      stroke="#6366f1"
                      fill="url(#miniWorldGdp)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <SourceLink sources={SRC_DASH_ECONOMY} className="mt-1" />
              </div>
              <div className="px-4 pt-2 pb-1">
                <p
                  className="text-[9px] font-mono uppercase tracking-widest"
                  style={{ color: mutedText }}
                >
                  {search
                    ? `${filteredCountries.length} results`
                    : "Top countries by GDP"}
                </p>
              </div>
              {filteredCountries.map((c, _i) => {
                const isSelected = selectedCountry?.id === c.id;
                const gdpUp = c.gdpGrowth >= 0;
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      setSelectedCountry(
                        selectedCountry?.id === c.id ? null : c,
                      )
                    }
                    className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-all hover:opacity-90"
                    style={{
                      borderBottom: `1px solid ${gridLine}`,
                      background: isSelected
                        ? isLight
                          ? "rgba(99,102,241,0.07)"
                          : "rgba(99,102,241,0.12)"
                        : "transparent",
                    }}
                  >
                    <span className="text-base w-6 shrink-0">
                      {(c as any).flag ?? c.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {c.name}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {c.continent}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="text-[11px] font-mono font-bold"
                        style={{ color: headText }}
                      >
                        {fmtGDPShort(c.gdp)}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: gdpUp ? "#10b981" : "#ef4444" }}
                      >
                        {gdpUp ? "+" : ""}
                        {c.gdpGrowth}%
                      </p>
                    </div>
                    <ArrowRight
                      size={10}
                      weight="bold"
                      style={{
                        color: isSelected ? curColor : mutedText,
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
              {filteredCountries.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p
                    className="text-[11px] font-sans"
                    style={{ color: mutedText }}
                  >
                    No countries match &#34;{search}&#34;
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── ECONOMIES tab ── */}
          {activeTab === "economies" && (
            <>
              <div className="grid grid-cols-2 gap-2 p-4">
                {[
                  {
                    label: "World GDP",
                    value: "$105.4T",
                    delta: "+1.8%",
                    color: "#6366f1",
                  },
                  {
                    label: "Trade Volume",
                    value: "$32.1T",
                    delta: "+2.3%",
                    color: "#10b981",
                  },
                  {
                    label: "FDI Flows",
                    value: "$1.37T",
                    delta: "-4.1%",
                    color: "#ef4444",
                  },
                  {
                    label: "Debt/GDP",
                    value: "93.4%",
                    delta: "+0.6pp",
                    color: "#f59e0b",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.03)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                    </p>
                    <p
                      className="text-base font-bold font-mono"
                      style={{ color: headText }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[10px] font-mono"
                      style={{ color: m.color }}
                    >
                      {m.delta}
                    </p>
                  </div>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_ECONOMY} className="px-4 mb-2" />
              <div className="px-4 pb-1">
                <p
                  className="text-[9px] font-mono uppercase tracking-widest"
                  style={{ color: mutedText }}
                >
                  Regional GDP
                </p>
              </div>
              {filteredRegions.map((r, _i) => {
                const isSelected = selectedRegion === r.region;
                return (
                  <button
                    key={r.region}
                    onClick={() => setSelectedRegion(r.region)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-all hover:opacity-90"
                    style={{
                      borderBottom: `1px solid ${gridLine}`,
                      background: isSelected
                        ? isLight
                          ? "rgba(245,158,11,0.07)"
                          : "rgba(245,158,11,0.12)"
                        : "transparent",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: r.up ? "#10b981" : "#ef4444" }}
                    />
                    <p
                      className="flex-1 text-xs font-semibold font-sans truncate"
                      style={{ color: headText }}
                    >
                      {r.region}
                    </p>
                    <span
                      className="text-[11px] font-mono shrink-0"
                      style={{ color: headText }}
                    >
                      {r.gdp}
                    </span>
                    <span
                      className="text-[11px] font-mono shrink-0 w-12 text-right"
                      style={{ color: r.up ? "#10b981" : "#ef4444" }}
                    >
                      {r.growth}
                    </span>
                    <ArrowRight
                      size={10}
                      weight="bold"
                      style={{
                        color: isSelected ? "#f59e0b" : mutedText,
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
              {filteredRegions.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p
                    className="text-[11px] font-sans"
                    style={{ color: mutedText }}
                  >
                    No regions match &#34;{search}&#34;
                  </p>
                </div>
              )}
              {/* Inflation chart */}
              <div className="px-4 pt-4 pb-2">
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: mutedText }}
                >
                  Inflation Trend
                </p>
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart
                    data={INFLATION_DATA}
                    margin={{ top: 2, right: 4, left: -22, bottom: 0 }}
                  >
                    <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tick={{
                        fontSize: 8,
                        fill: mutedText,
                        fontFamily: "monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 8,
                        fill: mutedText,
                        fontFamily: "monospace",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isLight ? "#fff" : "#1a1730",
                        border: `1px solid ${gridLine}`,
                        borderRadius: 8,
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: headText,
                      }}
                      formatter={(v: number, n: string) => [
                        `${v}%`,
                        n === "g20" ? "G20" : "Advanced",
                      ]}
                      labelStyle={{ color: mutedText }}
                    />
                    <Line
                      type="monotone"
                      dataKey="g20"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="adv"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-1">
                  {[
                    { label: "G20", color: "#f59e0b" },
                    { label: "Advanced", color: "#3b82f6" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div
                        className="w-3 h-0.5 rounded-full"
                        style={{ background: l.color }}
                      />
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── POLICIES tab ── */}
          {activeTab === "policies" && (
            <>
              <div className="grid grid-cols-3 gap-2 p-4">
                {[
                  { label: "Climate", count: "312", color: "#10b981" },
                  { label: "Trade", count: "248", color: "#3b82f6" },
                  { label: "Defense", count: "189", color: "#ef4444" },
                  { label: "Tech", count: "142", color: "#6366f1" },
                  { label: "Energy", count: "98", color: "#f59e0b" },
                  { label: "Labor", count: "211", color: "#a855f7" },
                ].map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setSearch(c.label)}
                    className="rounded-xl px-2 py-2 text-center transition-all hover:opacity-80"
                    style={{
                      background: c.color + "10",
                      border: `1px solid ${c.color}20`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: c.color }}
                    >
                      {c.count}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {c.label}
                    </p>
                  </button>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_POLICIES} className="px-4 mb-2" />
              <div className="px-4 pb-1">
                <p
                  className="text-[9px] font-mono uppercase tracking-widest"
                  style={{ color: mutedText }}
                >
                  {search
                    ? `${filteredPolicies.length} results`
                    : "Recent policies"}
                </p>
              </div>
              {filteredPolicies.map((p, i) => {
                const isSelected = selectedPolicy === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPolicy(i)}
                    className="flex items-start gap-3 px-4 py-3 text-left transition-all hover:opacity-90"
                    style={{
                      borderBottom: `1px solid ${gridLine}`,
                      background: isSelected
                        ? isLight
                          ? "rgba(168,85,247,0.06)"
                          : "rgba(168,85,247,0.1)"
                        : "transparent",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: p.color + "18", color: p.color }}
                    >
                      <Scales size={11} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: p.color + "15", color: p.color }}
                        >
                          {p.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {p.date}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={10}
                      weight="bold"
                      style={{
                        color: isSelected ? "#a855f7" : mutedText,
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  </button>
                );
              })}
              {filteredPolicies.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p
                    className="text-[11px] font-sans"
                    style={{ color: mutedText }}
                  >
                    No policies match &#34;{search}&#34;
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel — fixed height, internal scroll */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 animate-fade-in"
          style={{ height: "100%" }}
        >
          {/* ── Country detail ── */}
          {activeTab === "countries" &&
            selectedCountry &&
            (() => {
              const c = selectedCountry;
              const gdpUp = c.gdpGrowth >= 0;
              const fmtPop = (n: number) => {
                if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
                if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                return `${Math.round(n / 1000)}K`;
              };
              return (
                <>
                  {/* Flag banner — hero image with country name overlay */}
                  <div
                    className="rounded-xl overflow-hidden relative flex-shrink-0"
                    style={{
                      height: 96,
                      background: `linear-gradient(135deg, #1e2040 0%, #0f1535 100%)`,
                    }}
                  >
                    {/* Actual flag image */}
                    <img
                      src={`https://flagcdn.com/w320/${c.code.toLowerCase()}.png`}
                      alt={`${c.name} flag`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    {/* Dark gradient overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.65) 100%)",
                      }}
                    />
                    {/* Country name + subtitle at bottom-left */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 20, lineHeight: 1 }}>
                          {(c as any).flag ?? c.code}
                        </span>
                        <div>
                          <p
                            className="font-bold font-sans drop-shadow"
                            style={{
                              color: "#fff",
                              fontSize: 13,
                              lineHeight: 1.2,
                            }}
                          >
                            {c.name}
                          </p>
                          <p
                            className="font-mono drop-shadow"
                            style={{
                              color: "rgba(255,255,255,0.75)",
                              fontSize: 9,
                            }}
                          >
                            {c.continent} · {c.governmentType}
                          </p>
                        </div>
                      </div>
                      <span
                        className="font-mono font-bold"
                        style={{
                          fontSize: 9,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: gdpUp
                            ? "rgba(16,185,129,0.3)"
                            : "rgba(239,68,68,0.3)",
                          color: gdpUp ? "#6ee7b7" : "#fca5a5",
                          border: `1px solid ${gdpUp ? "#10b98155" : "#ef444455"}`,
                        }}
                      >
                        GDP {gdpUp ? "+" : ""}
                        {c.gdpGrowth}%
                      </span>
                    </div>
                  </div>

                  {/* Primary KPI grid — 3 cols */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        label: "GDP",
                        value: fmtGDPShort(c.gdp),
                        color: "#6366f1",
                      },
                      {
                        label: "Growth",
                        value: `${gdpUp ? "+" : ""}${c.gdpGrowth}%`,
                        color: gdpUp ? "#10b981" : "#ef4444",
                      },
                      {
                        label: "GDP/Cap",
                        value: `$${c.gdpPerCapita.toLocaleString()}`,
                        color: "#3b82f6",
                      },
                      {
                        label: "Inflation",
                        value: `${c.inflationRate}%`,
                        color: c.inflationRate > 6 ? "#ef4444" : "#f59e0b",
                      },
                      {
                        label: "Unemp.",
                        value: `${c.unemploymentRate.toFixed(1)}%`,
                        color: c.unemploymentRate < 5 ? "#10b981" : "#f59e0b",
                      },
                      {
                        label: "HDI",
                        value: c.humanDevelopmentIndex.toFixed(3),
                        color:
                          c.humanDevelopmentIndex >= 0.8
                            ? "#10b981"
                            : c.humanDevelopmentIndex >= 0.65
                              ? "#f59e0b"
                              : "#ef4444",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg px-2 py-2"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.03)"
                            : "rgba(255,255,255,0.04)",
                          border: `1px solid ${gridLine}`,
                        }}
                      >
                        <p
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {m.label}
                        </p>
                        <p
                          className="text-sm font-bold font-mono"
                          style={{ color: m.color }}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Secondary stats row */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      {
                        label: "Population",
                        value: fmtPop(c.population),
                        icon: <Users size={10} weight="fill" />,
                        color: "#06b6d4",
                      },
                      {
                        label: "Life Expectancy",
                        value: `${c.lifeExpectancy} yrs`,
                        icon: <Heart size={10} weight="fill" />,
                        color: "#ec4899",
                      },
                      {
                        label: "Trade Balance",
                        value: `${c.tradeBalance >= 0 ? "+" : ""}$${c.tradeBalance}B`,
                        icon: <Scales size={10} weight="fill" />,
                        color: c.tradeBalance >= 0 ? "#10b981" : "#ef4444",
                      },
                      {
                        label: "Area",
                        value:
                          c.areaKm2 >= 1_000_000
                            ? `${(c.areaKm2 / 1_000_000).toFixed(1)}M km²`
                            : `${c.areaKm2.toLocaleString()} km²`,
                        icon: <MapPin size={10} weight="fill" />,
                        color: "#a855f7",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg px-2.5 py-2 flex items-center gap-2"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.025)"
                            : "rgba(255,255,255,0.03)",
                          border: `1px solid ${gridLine}`,
                        }}
                      >
                        <span style={{ color: m.color }}>{m.icon}</span>
                        <div className="min-w-0">
                          <p
                            className="text-[9px] font-mono truncate"
                            style={{ color: mutedText }}
                          >
                            {m.label}
                          </p>
                          <p
                            className="text-[12px] font-bold font-mono"
                            style={{ color: m.color }}
                          >
                            {m.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* GDP trend sparkline */}
                  {c.trends && c.trends.length > 0 && (
                    <>
                      <p
                        className="text-[9px] font-mono uppercase tracking-widest"
                        style={{ color: mutedText }}
                      >
                        GDP Trend
                      </p>
                      <ResponsiveContainer width="100%" height={72}>
                        <AreaChart
                          data={c.trends}
                          margin={{ top: 2, right: 2, left: -28, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id={`ctrySpark-${c.id}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#6366f1"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="100%"
                                stopColor="#6366f1"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="year"
                            tick={{
                              fontSize: 8,
                              fill: mutedText,
                              fontFamily: "monospace",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 8,
                              fill: mutedText,
                              fontFamily: "monospace",
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) =>
                              `$${v >= 1000 ? (v / 1000).toFixed(0) + "T" : v + "B"}`
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              background: isLight ? "#fff" : "#1a1730",
                              border: `1px solid ${gridLine}`,
                              borderRadius: 8,
                              fontSize: 10,
                              color: headText,
                            }}
                            formatter={(v: number) => [
                              v >= 1000
                                ? `$${(v / 1000).toFixed(1)}T`
                                : `$${v}B`,
                              "GDP",
                            ]}
                            labelStyle={{ color: mutedText }}
                          />
                          <Area
                            type="monotone"
                            dataKey="gdp"
                            stroke="#6366f1"
                            fill={`url(#ctrySpark-${c.id})`}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  )}

                  {/* Key Industries */}
                  {c.keyIndustries && c.keyIndustries.length > 0 && (
                    <>
                      <p
                        className="text-[9px] font-mono uppercase tracking-widest"
                        style={{ color: mutedText }}
                      >
                        Key Industries
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {c.keyIndustries.slice(0, 5).map((ind) => (
                          <div
                            key={ind.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: ind.color }}
                            />
                            <span
                              className="text-[10px] font-sans truncate flex-1"
                              style={{ color: headText }}
                            >
                              {ind.name}
                            </span>
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
                                  width: `${ind.gdpShare}%`,
                                  background: ind.color,
                                }}
                              />
                            </div>
                            <span
                              className="text-[9px] font-mono w-6 text-right shrink-0"
                              style={{ color: mutedText }}
                            >
                              {ind.gdpShare}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Divider */}
                  <div style={{ borderTop: `1px solid ${gridLine}` }} />

                  {/* Political & Social facts */}
                  <p
                    className="text-[9px] font-mono uppercase tracking-widest"
                    style={{ color: mutedText }}
                  >
                    Political &amp; Social
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: "Government", value: c.governmentType },
                      { label: "Head of State", value: c.headOfState },
                      { label: "Capital", value: c.capital },
                      { label: "Continent", value: c.continent },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-1"
                        style={{ borderBottom: `1px solid ${gridLine}` }}
                      >
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {row.label}
                        </span>
                        <span
                          className="text-[11px] font-sans font-semibold text-right max-w-[55%] truncate"
                          style={{ color: headText }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Macro health bar */}
                  <div
                    className="rounded-xl px-3 py-3"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.025)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    <p
                      className="text-[9px] font-mono uppercase tracking-widest mb-2"
                      style={{ color: mutedText }}
                    >
                      Macro Health Score
                    </p>
                    {(() => {
                      const hdiScore = c.humanDevelopmentIndex * 40;
                      const growthScore = Math.min(
                        20,
                        Math.max(0, (c.gdpGrowth + 2) * 4),
                      );
                      const inflScore = Math.max(0, 20 - c.inflationRate * 2);
                      const unempScore = Math.max(
                        0,
                        20 - c.unemploymentRate * 2,
                      );
                      const total = Math.round(
                        hdiScore + growthScore + inflScore + unempScore,
                      );
                      const scoreColor =
                        total >= 75
                          ? "#10b981"
                          : total >= 50
                            ? "#f59e0b"
                            : "#ef4444";
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-[10px] font-mono"
                              style={{ color: mutedText }}
                            >
                              Overall
                            </span>
                            <span
                              className="text-[13px] font-bold font-mono"
                              style={{ color: scoreColor }}
                            >
                              {total}/100
                            </span>
                          </div>
                          <div
                            className="w-full h-2.5 rounded-full overflow-hidden"
                            style={{
                              background: isLight
                                ? "rgba(0,0,0,0.07)"
                                : "rgba(255,255,255,0.08)",
                            }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${total}%`,
                                background: `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})`,
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-4 gap-1 mt-2">
                            {[
                              {
                                label: "HDI",
                                score: Math.round(hdiScore),
                                color: "#a855f7",
                              },
                              {
                                label: "Growth",
                                score: Math.round(growthScore),
                                color: "#10b981",
                              },
                              {
                                label: "Inflation",
                                score: Math.round(inflScore),
                                color: "#f59e0b",
                              },
                              {
                                label: "Employ.",
                                score: Math.round(unempScore),
                                color: "#3b82f6",
                              },
                            ].map((sub) => (
                              <div key={sub.label} className="text-center">
                                <p
                                  className="text-[10px] font-bold font-mono"
                                  style={{ color: sub.color }}
                                >
                                  {sub.score}
                                </p>
                                <p
                                  className="text-[8px] font-mono"
                                  style={{ color: mutedText }}
                                >
                                  {sub.label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    onClick={() => onNav("/dashboard/countries")}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                    style={{
                      background: "#6366f118",
                      color: "#6366f1",
                      border: "1px solid #6366f125",
                    }}
                  >
                    Full Country Profile <ArrowRight size={11} weight="bold" />
                  </button>
                </>
              );
            })()}

          {/* ── Region detail ── */}
          {activeTab === "economies" &&
            selectedRegion !== null &&
            (() => {
              const r = REGION_STATS.find((x) => x.region === selectedRegion);
              if (!r) return null;
              const regionMap: Record<string, string[]> = {
                "North America": ["North America"],
                "European Union": ["Europe"],
                "Asia-Pacific": ["Asia", "Oceania"],
                "Middle East": ["Asia"],
                "Sub-Saharan Africa": ["Africa"],
                "Latin America": ["South America"],
              };
              const topInRegion = countriesData
                .filter((c) => regionMap[r.region]?.includes(c.continent))
                .sort((a, b) => b.gdp - a.gdp)
                .slice(0, 5);

              // Pull economies data for this region's countries to aggregate upcoming industries + funding
              const ecoIds = topInRegion.map((c) => c.id);
              const regionEconomies = economiesData.filter((e) =>
                ecoIds.some(
                  (id) =>
                    e.id.startsWith(id.replace(/-/g, "").toLowerCase()) ||
                    e.name
                      .toLowerCase()
                      .includes(
                        topInRegion
                          .find((x) => x.id === id)
                          ?.name.toLowerCase() ?? "",
                      ),
                ),
              );
              // Collect all upcoming industries across region economies
              const allUpcoming = regionEconomies
                .flatMap((e) => e.upcomingIndustries ?? [])
                .reduce<
                  {
                    name: string;
                    growth: string;
                    color: string;
                    pct: number;
                  }[]
                >((acc, ind) => {
                  const existing = acc.find((x) => x.name === ind.name);
                  const pct =
                    parseInt(ind.growth.replace(/[^0-9]/g, ""), 10) || 0;
                  if (!existing) acc.push({ ...ind, pct });
                  else if (pct > existing.pct) {
                    existing.growth = ind.growth;
                    existing.pct = pct;
                    existing.color = ind.color;
                  }
                  return acc;
                }, [])
                .sort((a, b) => b.pct - a.pct)
                .slice(0, 4);

              const totalFunding = regionEconomies.reduce(
                (s, e) => s + (e.fundingRaisedB ?? 0),
                0,
              );

              return (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm font-bold font-sans"
                        style={{ color: headText }}
                      >
                        {r.region}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: mutedText }}
                      >
                        Regional Economy
                      </p>
                    </div>
                    <div />
                  </div>

                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Total GDP", value: r.gdp, color: "#f59e0b" },
                      {
                        label: "Growth",
                        value: r.growth,
                        color: r.up ? "#10b981" : "#ef4444",
                      },
                      {
                        label: "Funding Raised",
                        value:
                          totalFunding > 0
                            ? `$${totalFunding.toFixed(0)}B`
                            : "N/A",
                        color: "#6366f1",
                      },
                      {
                        label: "Top Economies",
                        value: `${topInRegion.length}`,
                        color: "#3b82f6",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg px-2.5 py-2"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.03)"
                            : "rgba(255,255,255,0.04)",
                          border: `1px solid ${gridLine}`,
                        }}
                      >
                        <p
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {m.label}
                        </p>
                        <p
                          className="text-sm font-bold font-mono"
                          style={{ color: m.color }}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Up-and-coming industries */}
                  {allUpcoming.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Sparkle
                          size={11}
                          weight="fill"
                          style={{ color: "#f97316" }}
                        />
                        <p
                          className="text-[9px] font-mono uppercase tracking-widest"
                          style={{ color: mutedText }}
                        >
                          Up-and-coming Industries
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {allUpcoming.map((ind) => (
                          <div
                            key={ind.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: ind.color }}
                            />
                            <span
                              className="text-[11px] font-sans font-semibold flex-1 truncate"
                              style={{ color: headText }}
                            >
                              {ind.name}
                            </span>
                            <div
                              className="w-14 h-1.5 rounded-full overflow-hidden shrink-0"
                              style={{
                                background: isLight
                                  ? "rgba(0,0,0,0.07)"
                                  : "rgba(255,255,255,0.08)",
                              }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ind.pct)}%`,
                                  background: ind.color,
                                }}
                              />
                            </div>
                            <span
                              className="text-[10px] font-mono font-bold w-9 text-right shrink-0"
                              style={{ color: ind.color }}
                            >
                              {ind.growth}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Top economies list */}
                  <p
                    className="text-[9px] font-mono uppercase tracking-widest"
                    style={{ color: mutedText }}
                  >
                    Top economies in region
                  </p>
                  {topInRegion.map((c, i) => {
                    const eco = economiesData.find(
                      (e) =>
                        e.name.toLowerCase() === c.name.toLowerCase() ||
                        e.id.startsWith(c.id.replace(/-/g, "")),
                    );
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 py-1.5"
                        style={{
                          borderBottom:
                            i < topInRegion.length - 1
                              ? `1px solid ${gridLine}`
                              : "none",
                        }}
                      >
                        <span className="text-sm w-6">
                          {(c as any).flag ?? c.code}
                        </span>
                        <span
                          className="flex-1 text-[11px] font-sans font-semibold truncate"
                          style={{ color: headText }}
                        >
                          {c.name}
                        </span>
                        <span
                          className="text-[11px] font-mono shrink-0"
                          style={{ color: headText }}
                        >
                          {fmtGDPShort(c.gdp)}
                        </span>
                        <span
                          className="text-[10px] font-mono shrink-0 w-10 text-right"
                          style={{
                            color: c.gdpGrowth >= 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {c.gdpGrowth >= 0 ? "+" : ""}
                          {c.gdpGrowth}%
                        </span>
                        {eco?.fundingRaisedB !== undefined && (
                          <span
                            className="text-[9px] font-mono shrink-0 w-10 text-right"
                            style={{ color: "#6366f1" }}
                          >
                            ${eco.fundingRaisedB}B
                          </span>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => onNav("/dashboard/economies")}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                    style={{
                      background: "#f59e0b18",
                      color: "#f59e0b",
                      border: "1px solid #f59e0b25",
                    }}
                  >
                    Full Explorer <ArrowRight size={11} weight="bold" />
                  </button>
                </>
              );
            })()}

          {/* ── Policy detail ── */}
          {activeTab === "policies" &&
            selectedPolicy !== null &&
            (() => {
              const p = filteredPolicies[selectedPolicy];
              if (!p) return null;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: p.color + "18", color: p.color }}
                      >
                        <Scales size={14} weight="fill" />
                      </div>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{ background: p.color + "15", color: p.color }}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <div />
                  </div>
                  <div
                    className="rounded-xl px-3 py-3"
                    style={{
                      background: p.color + "08",
                      border: `1px solid ${p.color}18`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-sans leading-snug"
                      style={{ color: headText }}
                    >
                      {p.title}
                    </p>
                    <p
                      className="text-[10px] font-mono mt-1"
                      style={{ color: mutedText }}
                    >
                      {p.date}
                    </p>
                  </div>
                  <div
                    className="rounded-xl px-3 py-3"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.03)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    <p
                      className="text-[9px] font-mono uppercase tracking-widest mb-1"
                      style={{ color: mutedText }}
                    >
                      Category
                    </p>
                    <p
                      className="text-[11px] font-sans"
                      style={{ color: headText }}
                    >
                      {p.tag} Policy
                    </p>
                  </div>
                  {(p as any).description && (
                    <div
                      className="rounded-xl px-3 py-3"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.025)"
                          : "rgba(255,255,255,0.035)",
                        border: `1px solid ${gridLine}`,
                      }}
                    >
                      <p
                        className="text-[9px] font-mono uppercase tracking-widest mb-2"
                        style={{ color: mutedText }}
                      >
                        Description
                      </p>
                      <p
                        className="text-[11px] font-sans leading-relaxed"
                        style={{ color: bodyText }}
                        dangerouslySetInnerHTML={{
                          __html: (p as any).description,
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => onNav("/dashboard/policy")}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                    style={{
                      background: "#a855f718",
                      color: "#a855f7",
                      border: "1px solid #a855f725",
                    }}
                  >
                    Policy Hub <ArrowRight size={11} weight="bold" />
                  </button>
                </>
              );
            })()}
        </div>
      </div>

      {/* ── Footer nav ── */}
      <div
        className="px-4 py-2.5 border-t flex items-center justify-between"
        style={{ borderColor: gridLine }}
      >
        <span className="text-[10px] font-mono" style={{ color: mutedText }}>
          {activeTab === "countries"
            ? `${filteredCountries.length} of ${allByGDP.length} countries`
            : activeTab === "economies"
              ? `${filteredRegions.length} regions`
              : `${filteredPolicies.length} policies`}
        </span>
        <button
          onClick={() =>
            onNav(
              activeTab === "countries"
                ? "/dashboard/countries"
                : activeTab === "economies"
                  ? "/dashboard/economies"
                  : "/dashboard/policy",
            )
          }
          className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: curColor }}
        >
          View all <ArrowRight size={10} weight="bold" />
        </button>
      </div>
    </div>
  );
}

/* ─── Expandable Info Card ──────────────────────────────────────────────── */
function ExpandableCard({
  icon,
  title,
  badge,
  badgeColor,
  description,
  accentColor,
  isLight,
  cardBg,
  cardBorder,
  gridLine,
  headText,
  mutedText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  accentColor: string;
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  gridLine: string;
  headText: string;
  mutedText: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder }}
    >
      {/* Header / toggle row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all hover:opacity-90"
        style={{
          borderBottom: open ? `1px solid ${gridLine}` : "none",
          background: open
            ? isLight
              ? accentColor + "06"
              : accentColor + "10"
            : "transparent",
        }}
      >
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: accentColor + "15",
            border: `1px solid ${accentColor}25`,
          }}
        >
          {icon}
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-bold font-sans"
              style={{ color: headText }}
            >
              {title}
            </span>
            {badge && (
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: accentColor + "15", color: accentColor }}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className="text-[10px] font-sans mt-0.5 leading-snug pr-4"
            style={{ color: mutedText }}
          >
            {description}
          </p>
        </div>

        {/* Chevron */}
        <div
          className="shrink-0 transition-transform duration-200"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: mutedText,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 5l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {open && <div className="px-5 py-4 animate-fade-in">{children}</div>}
    </div>
  );
}

/* ─── Global North / South Map ─────────────────────────────────────────── */
// Country paths are simplified SVG shapes on a 1000×500 equirectangular projection
// Each country has: id, name, path, lat (rough centroid), lon, isNorth (Global North = true)
type CountryShape = {
  id: string;
  name: string;
  d: string;
  cx: number; // label x
  cy: number; // label y
  isNorth: boolean;
};

// Helper to convert lon/lat → SVG x/y (equirectangular, 1000×500)
const ll2xy = (lon: number, lat: number): [number, number] => [
  ((lon + 180) / 360) * 1000,
  ((90 - lat) / 180) * 500,
];

// Build simplified country outlines as SVG path strings from bounding-box rectangles
// For each country we use a rough polygon approximation
const mkRect = (
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
): string => {
  const [x1, y1] = ll2xy(lon1, lat1);
  const [x2, y2] = ll2xy(lon2, lat2);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} L${x1.toFixed(1)},${y2.toFixed(1)} Z`;
};

const mkPath = (coords: [number, number][]): string => {
  return (
    coords
      .map(([lon, lat], i) => {
        const [x, y] = ll2xy(lon, lat);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
};

const COUNTRIES_MAP: CountryShape[] = [
  // ── NORTH AMERICA ──
  {
    id: "us",
    name: "United States",
    d: mkPath([
      [-124, 49],
      [-66, 49],
      [-66, 25],
      [-80, 25],
      [-87, 30],
      [-97, 26],
      [-117, 32],
      [-124, 38],
    ]),
    cx: ll2xy(-96, 38)[0],
    cy: ll2xy(-96, 38)[1],
    isNorth: true,
  },
  {
    id: "ca",
    name: "Canada",
    d: mkPath([
      [-141, 83],
      [-52, 83],
      [-52, 47],
      [-84, 46],
      [-95, 49],
      [-110, 49],
      [-123, 49],
      [-141, 60],
    ]),
    cx: ll2xy(-95, 62)[0],
    cy: ll2xy(-95, 62)[1],
    isNorth: true,
  },
  {
    id: "mx",
    name: "Mexico",
    d: mkPath([
      [-117, 32],
      [-97, 26],
      [-87, 16],
      [-89, 15],
      [-92, 18],
      [-90, 21],
      [-90, 22],
      [-87, 22],
      [-86, 23],
      [-86, 24],
      [-88, 27],
      [-97, 27],
      [-117, 32],
    ]),
    cx: ll2xy(-102, 23)[0],
    cy: ll2xy(-102, 23)[1],
    isNorth: false,
  },
  // ── SOUTH AMERICA ──
  {
    id: "br",
    name: "Brazil",
    d: mkPath([
      [-73, 5],
      [-35, 5],
      [-35, -5],
      [-34, -13],
      [-39, -16],
      [-44, -23],
      [-48, -28],
      [-53, -33],
      [-58, -34],
      [-65, -28],
      [-68, -20],
      [-73, -12],
      [-73, 0],
    ]),
    cx: ll2xy(-53, -10)[0],
    cy: ll2xy(-53, -10)[1],
    isNorth: false,
  },
  {
    id: "ar",
    name: "Argentina",
    d: mkPath([
      [-68, -22],
      [-53, -22],
      [-53, -34],
      [-58, -38],
      [-62, -42],
      [-66, -46],
      [-68, -54],
      [-72, -52],
      [-72, -40],
      [-68, -30],
    ]),
    cx: ll2xy(-64, -35)[0],
    cy: ll2xy(-64, -35)[1],
    isNorth: false,
  },
  {
    id: "co",
    name: "Colombia",
    d: mkPath([
      [-77, 8],
      [-67, 8],
      [-67, 1],
      [-72, -4],
      [-77, -2],
      [-79, 2],
      [-77, 8],
    ]),
    cx: ll2xy(-74, 4)[0],
    cy: ll2xy(-74, 4)[1],
    isNorth: false,
  },
  {
    id: "ve",
    name: "Venezuela",
    d: mkPath([
      [-73, 12],
      [-60, 12],
      [-60, 6],
      [-67, 2],
      [-73, 6],
    ]),
    cx: ll2xy(-66, 8)[0],
    cy: ll2xy(-66, 8)[1],
    isNorth: false,
  },
  {
    id: "pe",
    name: "Peru",
    d: mkPath([
      [-81, -4],
      [-74, -4],
      [-70, -10],
      [-68, -14],
      [-68, -18],
      [-75, -18],
      [-80, -10],
    ]),
    cx: ll2xy(-75, -10)[0],
    cy: ll2xy(-75, -10)[1],
    isNorth: false,
  },
  {
    id: "cl",
    name: "Chile",
    d: mkPath([
      [-70, -18],
      [-66, -18],
      [-66, -22],
      [-67, -28],
      [-69, -35],
      [-71, -42],
      [-72, -50],
      [-76, -52],
      [-72, -30],
      [-70, -22],
    ]),
    cx: ll2xy(-70, -33)[0],
    cy: ll2xy(-70, -33)[1],
    isNorth: false,
  },
  // ── EUROPE ──
  {
    id: "gb",
    name: "UK",
    d: mkPath([
      [-5, 58],
      [2, 58],
      [2, 51],
      [-3, 50],
      [-5, 53],
      [-5, 58],
    ]),
    cx: ll2xy(-2, 54)[0],
    cy: ll2xy(-2, 54)[1],
    isNorth: true,
  },
  {
    id: "fr",
    name: "France",
    d: mkPath([
      [-5, 51],
      [8, 51],
      [8, 44],
      [3, 43],
      [-2, 43],
      [-5, 47],
    ]),
    cx: ll2xy(2, 47)[0],
    cy: ll2xy(2, 47)[1],
    isNorth: true,
  },
  {
    id: "de",
    name: "Germany",
    d: mkPath([
      [6, 55],
      [15, 55],
      [15, 47],
      [6, 47],
    ]),
    cx: ll2xy(10, 51)[0],
    cy: ll2xy(10, 51)[1],
    isNorth: true,
  },
  {
    id: "es",
    name: "Spain",
    d: mkPath([
      [-9, 44],
      [3, 44],
      [3, 36],
      [-6, 36],
      [-9, 39],
    ]),
    cx: ll2xy(-4, 40)[0],
    cy: ll2xy(-4, 40)[1],
    isNorth: true,
  },
  {
    id: "it",
    name: "Italy",
    d: mkPath([
      [7, 44],
      [14, 44],
      [18, 40],
      [15, 37],
      [13, 38],
      [13, 41],
      [8, 44],
    ]),
    cx: ll2xy(13, 42)[0],
    cy: ll2xy(13, 42)[1],
    isNorth: true,
  },
  {
    id: "pl",
    name: "Poland",
    d: mkPath([
      [14, 55],
      [24, 55],
      [24, 49],
      [14, 49],
    ]),
    cx: ll2xy(20, 52)[0],
    cy: ll2xy(20, 52)[1],
    isNorth: true,
  },
  {
    id: "se",
    name: "Sweden",
    d: mkPath([
      [11, 69],
      [24, 69],
      [24, 55],
      [11, 55],
    ]),
    cx: ll2xy(17, 62)[0],
    cy: ll2xy(17, 62)[1],
    isNorth: true,
  },
  {
    id: "no",
    name: "Norway",
    d: mkPath([
      [4, 71],
      [30, 71],
      [30, 58],
      [4, 58],
    ]),
    cx: ll2xy(15, 65)[0],
    cy: ll2xy(15, 65)[1],
    isNorth: true,
  },
  {
    id: "fi",
    name: "Finland",
    d: mkPath([
      [20, 70],
      [30, 70],
      [30, 60],
      [20, 60],
    ]),
    cx: ll2xy(26, 65)[0],
    cy: ll2xy(26, 65)[1],
    isNorth: true,
  },
  {
    id: "nl",
    name: "Netherlands",
    d: mkRect(3.36, 53.55, 7.23, 50.75),
    cx: ll2xy(5.3, 52.3)[0],
    cy: ll2xy(5.3, 52.3)[1],
    isNorth: true,
  },
  {
    id: "ch",
    name: "Switzerland",
    d: mkRect(5.96, 47.8, 10.49, 45.82),
    cx: ll2xy(8.2, 46.8)[0],
    cy: ll2xy(8.2, 46.8)[1],
    isNorth: true,
  },
  // ── RUSSIA ──
  {
    id: "ru",
    name: "Russia",
    d: mkPath([
      [28, 72],
      [180, 72],
      [180, 50],
      [140, 43],
      [130, 42],
      [105, 51],
      [90, 51],
      [65, 51],
      [50, 45],
      [30, 45],
      [27, 55],
      [28, 60],
    ]),
    cx: ll2xy(100, 61)[0],
    cy: ll2xy(100, 61)[1],
    isNorth: true,
  },
  // ── MIDDLE EAST / CENTRAL ASIA ──
  {
    id: "sa",
    name: "Saudi Arabia",
    d: mkPath([
      [36, 32],
      [55, 32],
      [55, 22],
      [50, 16],
      [43, 15],
      [38, 22],
      [36, 28],
    ]),
    cx: ll2xy(45, 24)[0],
    cy: ll2xy(45, 24)[1],
    isNorth: false,
  },
  {
    id: "tr",
    name: "Turkey",
    d: mkPath([
      [26, 42],
      [45, 42],
      [45, 37],
      [36, 36],
      [26, 37],
    ]),
    cx: ll2xy(35, 39)[0],
    cy: ll2xy(35, 39)[1],
    isNorth: true,
  },
  {
    id: "ir",
    name: "Iran",
    d: mkPath([
      [44, 39],
      [63, 39],
      [63, 25],
      [56, 25],
      [48, 28],
      [44, 37],
    ]),
    cx: ll2xy(53, 33)[0],
    cy: ll2xy(53, 33)[1],
    isNorth: false,
  },
  // ── AFRICA ──
  {
    id: "ng",
    name: "Nigeria",
    d: mkPath([
      [3, 14],
      [15, 14],
      [15, 4],
      [3, 4],
    ]),
    cx: ll2xy(9, 9)[0],
    cy: ll2xy(9, 9)[1],
    isNorth: false,
  },
  {
    id: "et",
    name: "Ethiopia",
    d: mkPath([
      [33, 15],
      [48, 15],
      [48, 3],
      [38, -2],
      [36, 4],
      [33, 8],
    ]),
    cx: ll2xy(40, 9)[0],
    cy: ll2xy(40, 9)[1],
    isNorth: false,
  },
  {
    id: "eg",
    name: "Egypt",
    d: mkRect(25, 32, 37, 22),
    cx: ll2xy(30, 27)[0],
    cy: ll2xy(30, 27)[1],
    isNorth: false,
  },
  {
    id: "za",
    name: "South Africa",
    d: mkPath([
      [17, -29],
      [33, -29],
      [33, -35],
      [26, -35],
      [18, -33],
      [17, -31],
    ]),
    cx: ll2xy(25, -31)[0],
    cy: ll2xy(25, -31)[1],
    isNorth: false,
  },
  {
    id: "cd",
    name: "Congo (DRC)",
    d: mkPath([
      [12, -5],
      [30, -5],
      [30, -13],
      [24, -13],
      [18, -10],
      [12, -4],
    ]),
    cx: ll2xy(24, -4)[0],
    cy: ll2xy(24, -4)[1],
    isNorth: false,
  },
  {
    id: "dz",
    name: "Algeria",
    d: mkRect(-9, 37, 12, 20),
    cx: ll2xy(3, 28)[0],
    cy: ll2xy(3, 28)[1],
    isNorth: false,
  },
  {
    id: "sd",
    name: "Sudan",
    d: mkRect(22, 22, 38, 10),
    cx: ll2xy(30, 16)[0],
    cy: ll2xy(30, 16)[1],
    isNorth: false,
  },
  {
    id: "ma",
    name: "Morocco",
    d: mkRect(-13, 36, -2, 28),
    cx: ll2xy(-7, 32)[0],
    cy: ll2xy(-7, 32)[1],
    isNorth: false,
  },
  // ── SOUTH / SOUTHEAST ASIA ──
  {
    id: "cn",
    name: "China",
    d: mkPath([
      [73, 53],
      [134, 53],
      [134, 22],
      [110, 18],
      [105, 20],
      [100, 22],
      [98, 25],
      [92, 28],
      [78, 35],
      [73, 40],
      [73, 48],
    ]),
    cx: ll2xy(104, 37)[0],
    cy: ll2xy(104, 37)[1],
    isNorth: true,
  },
  {
    id: "in",
    name: "India",
    d: mkPath([
      [68, 37],
      [78, 36],
      [85, 27],
      [88, 22],
      [80, 8],
      [76, 8],
      [68, 20],
      [66, 24],
      [68, 37],
    ]),
    cx: ll2xy(78, 22)[0],
    cy: ll2xy(78, 22)[1],
    isNorth: false,
  },
  {
    id: "pk",
    name: "Pakistan",
    d: mkPath([
      [61, 37],
      [74, 37],
      [74, 27],
      [68, 24],
      [66, 25],
      [60, 30],
    ]),
    cx: ll2xy(68, 30)[0],
    cy: ll2xy(68, 30)[1],
    isNorth: false,
  },
  {
    id: "bd",
    name: "Bangladesh",
    d: mkRect(88, 26.5, 92.5, 20.7),
    cx: ll2xy(90.3, 23.5)[0],
    cy: ll2xy(90.3, 23.5)[1],
    isNorth: false,
  },
  {
    id: "id",
    name: "Indonesia",
    d: mkPath([
      [95, -5],
      [140, -5],
      [140, -8],
      [130, -8],
      [120, -9],
      [110, -8],
      [100, -6],
      [95, -5],
    ]),
    cx: ll2xy(118, -3)[0],
    cy: ll2xy(118, -3)[1],
    isNorth: false,
  },
  {
    id: "mm",
    name: "Myanmar",
    d: mkRect(92, 28, 101, 10),
    cx: ll2xy(96, 19)[0],
    cy: ll2xy(96, 19)[1],
    isNorth: false,
  },
  {
    id: "th",
    name: "Thailand",
    d: mkRect(98, 21, 106, 5),
    cx: ll2xy(102, 15)[0],
    cy: ll2xy(102, 15)[1],
    isNorth: false,
  },
  {
    id: "vn",
    name: "Vietnam",
    d: mkRect(102, 23, 110, 8),
    cx: ll2xy(106, 16)[0],
    cy: ll2xy(106, 16)[1],
    isNorth: false,
  },
  {
    id: "ph",
    name: "Philippines",
    d: mkRect(117, 21, 127, 5),
    cx: ll2xy(122, 13)[0],
    cy: ll2xy(122, 13)[1],
    isNorth: false,
  },
  {
    id: "jp",
    name: "Japan",
    d: mkPath([
      [130, 45],
      [142, 45],
      [142, 31],
      [130, 31],
    ]),
    cx: ll2xy(136, 38)[0],
    cy: ll2xy(136, 38)[1],
    isNorth: true,
  },
  {
    id: "kr",
    name: "South Korea",
    d: mkRect(125.7, 38.6, 129.6, 34.3),
    cx: ll2xy(128, 36.5)[0],
    cy: ll2xy(128, 36.5)[1],
    isNorth: true,
  },
  {
    id: "kp",
    name: "North Korea",
    d: mkRect(124, 43, 130, 38),
    cx: ll2xy(127, 40)[0],
    cy: ll2xy(127, 40)[1],
    isNorth: false,
  },
  // ── OCEANIA ──
  {
    id: "au",
    name: "Australia",
    d: mkPath([
      [114, -22],
      [154, -22],
      [154, -39],
      [146, -44],
      [137, -36],
      [128, -35],
      [114, -26],
    ]),
    cx: ll2xy(134, -27)[0],
    cy: ll2xy(134, -27)[1],
    isNorth: false,
  },
  {
    id: "nz",
    name: "New Zealand",
    d: mkPath([
      [172, -34],
      [178, -34],
      [178, -40],
      [174, -45],
      [169, -46],
      [169, -42],
      [172, -37],
    ]),
    cx: ll2xy(173, -41)[0],
    cy: ll2xy(173, -41)[1],
    isNorth: false,
  },
  // ── CENTRAL AMERICA / CARIBBEAN ──
  {
    id: "gt",
    name: "Guatemala",
    d: mkRect(-92, 17.8, -88.2, 13.7),
    cx: ll2xy(-90, 15.8)[0],
    cy: ll2xy(-90, 15.8)[1],
    isNorth: false,
  },
  {
    id: "hn",
    name: "Honduras",
    d: mkRect(-89.4, 16, -83.2, 13),
    cx: ll2xy(-86.5, 14.5)[0],
    cy: ll2xy(-86.5, 14.5)[1],
    isNorth: false,
  },
  {
    id: "cu",
    name: "Cuba",
    d: mkPath([
      [-85, 23],
      [-75, 23],
      [-74, 20],
      [-82, 20],
      [-85, 23],
    ]),
    cx: ll2xy(-79.5, 22)[0],
    cy: ll2xy(-79.5, 22)[1],
    isNorth: false,
  },
  // ── SCANDINAVIA extra ──
  {
    id: "dk",
    name: "Denmark",
    d: mkRect(8, 57.8, 12.7, 54.6),
    cx: ll2xy(10, 56)[0],
    cy: ll2xy(10, 56)[1],
    isNorth: true,
  },
  // ── UKRAINE ──
  {
    id: "ua",
    name: "Ukraine",
    d: mkRect(22, 52.5, 40.2, 44.4),
    cx: ll2xy(31, 49)[0],
    cy: ll2xy(31, 49)[1],
    isNorth: true,
  },
  // ── KAZAKHSTAN ──
  {
    id: "kz",
    name: "Kazakhstan",
    d: mkRect(50, 55, 87, 41),
    cx: ll2xy(68, 48)[0],
    cy: ll2xy(68, 48)[1],
    isNorth: true,
  },
  // ── MONGOLIA ──
  {
    id: "mn",
    name: "Mongolia",
    d: mkRect(87, 52, 120, 41),
    cx: ll2xy(103, 46)[0],
    cy: ll2xy(103, 46)[1],
    isNorth: true,
  },
  // ── GREENLAND ──
  {
    id: "gl",
    name: "Greenland",
    d: mkRect(-73, 84, -12, 60),
    cx: ll2xy(-42, 72)[0],
    cy: ll2xy(-42, 72)[1],
    isNorth: true,
  },
  // ── WEST AFRICA ──
  {
    id: "gh",
    name: "Ghana",
    d: mkRect(-3.3, 11.2, 1.2, 4.7),
    cx: ll2xy(-1.0, 8)[0],
    cy: ll2xy(-1.0, 8)[1],
    isNorth: false,
  },
  {
    id: "cm",
    name: "Cameroon",
    d: mkRect(8.5, 13, 16.2, 1.7),
    cx: ll2xy(12, 7)[0],
    cy: ll2xy(12, 7)[1],
    isNorth: false,
  },
  {
    id: "ke",
    name: "Kenya",
    d: mkRect(34, 5, 42, -4.7),
    cx: ll2xy(38, 1)[0],
    cy: ll2xy(38, 1)[1],
    isNorth: false,
  },
  {
    id: "tz",
    name: "Tanzania",
    d: mkRect(29.5, -1, 40.5, -11.7),
    cx: ll2xy(35, -6)[0],
    cy: ll2xy(35, -6)[1],
    isNorth: false,
  },
  {
    id: "mz",
    name: "Mozambique",
    d: mkRect(32.2, -10.5, 40.8, -26.9),
    cx: ll2xy(35.5, -18)[0],
    cy: ll2xy(35.5, -18)[1],
    isNorth: false,
  },
];

// Which countries to show labels for (to avoid clutter)
const LABELED_COUNTRIES = new Set([
  "us",
  "ca",
  "mx",
  "br",
  "ar",
  "gb",
  "fr",
  "de",
  "ru",
  "cn",
  "in",
  "jp",
  "au",
  "za",
  "ng",
  "et",
  "eg",
  "id",
  "tr",
  "sa",
  "kr",
  "vn",
  "th",
  "ph",
  "pe",
  "cl",
  "co",
  "ua",
  "kz",
  "gl",
  "ir",
  "pk",
]);

function GlobalNorthSouthMap({
  isLight,
  cardBg,
  cardBorder,
  cardShadow,
  gridLine,
  headText,
  mutedText,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  gridLine: string;
  headText: string;
  mutedText: string;
}) {
  const northColor = isLight ? "#6366f1" : "#818cf8";
  const southColor = isLight ? "#10b981" : "#34d399";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#6366f112", border: "1px solid #6366f122" }}
          >
            <Planet size={13} weight="fill" style={{ color: "#6366f1" }} />
          </div>
          <span
            className="text-sm font-bold font-sans"
            style={{ color: headText }}
          >
            Global North &amp; South
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "#6366f114", color: "#6366f1" }}
          >
            World Map
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: northColor, opacity: 0.9 }}
            />
            <span
              className="text-[10px] font-mono"
              style={{ color: mutedText }}
            >
              Global North
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: southColor, opacity: 0.9 }}
            />
            <span
              className="text-[10px] font-mono"
              style={{ color: mutedText }}
            >
              Global South
            </span>
          </div>
        </div>
      </div>

      {/* Map image */}
      <div
        className="relative"
        style={{ background: isLight ? "#dbeafe" : "#090f2a" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/2000px_Brandt_Line.svg/2000px-Brandt_Line.svg.png"
          alt="World map showing Global North (blue) and Global South (red) divided by the Brandt Line"
          style={{
            width: "100%",
            display: "block",
            objectFit: "cover",
            maxHeight: 480,
            filter: isLight ? "none" : "brightness(0.82) saturate(1.1)",
          }}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.src =
              "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/2560px-World_map_-_low_resolution.svg.png";
          }}
        />
        {/* Brandt Line label overlay */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: "38%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.55)",
            borderRadius: 6,
            padding: "2px 10px",
            whiteSpace: "nowrap",
          }}
        >
          <span
            className="text-[10px] font-mono"
            style={{ color: "#f87171", letterSpacing: "0.08em" }}
          >
            ─ ─ Brandt Line (approx. 30°N) ─ ─
          </span>
        </div>
      </div>

      {/* Footer stats */}
      <div
        className="px-5 py-3 flex items-center gap-6 flex-wrap"
        style={{ borderTop: `1px solid ${gridLine}` }}
      >
        {[
          { label: "Global North Countries", value: "~57", color: northColor },
          { label: "Global South Countries", value: "~138", color: southColor },
          { label: "North GDP Share", value: "~78%", color: northColor },
          { label: "South Population Share", value: "~85%", color: southColor },
          { label: "Divide", value: "Brandt Line ~30°N", color: mutedText },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono" style={{ color: mutedText }}>
              {s.label}
            </span>
            <span
              className="text-[12px] font-bold font-mono"
              style={{ color: s.color }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Reusable Section Header ───────────────────────────────────────────── */
function SectionHeader({
  icon,
  label,
  badge,
  badgeColor,
  cta,
  ctaTo,
  isLight,
  onNav,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  cta?: string;
  ctaTo?: string;
  isLight: boolean;
  onNav?: () => void;
}) {
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const accentColor = badgeColor ?? "#6366f1";
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span style={{ color: accentColor }}>{icon}</span>
        <h2
          className="text-base font-bold font-sans"
          style={{ color: headText }}
        >
          {label}
        </h2>
        {badge && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: accentColor + "15", color: accentColor }}
          >
            {badge}
          </span>
        )}
      </div>
      {cta && onNav && (
        <button
          onClick={onNav}
          className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: accentColor }}
        >
          {cta} <ArrowRight size={11} weight="bold" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const topCountries = useMemo(
    () => [...countriesData].sort((a, b) => b.gdp - a.gdp).slice(0, 6),
    [],
  );
  const topStates = useMemo(
    () => [...usStatesData].sort((a, b) => b.gdp - a.gdp).slice(0, 6),
    [],
  );

  return (
    <div
      className="min-h-screen w-full animate-fade-in"
      style={{ background: isLight ? "#f8fafc" : "#0b0b14", color: bodyText }}
    >
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            background: isLight
              ? "linear-gradient(130deg, #dbeafe 0%, #e0e7ff 60%, #d1fae5 100%)"
              : "linear-gradient(130deg, #0f1535 0%, #0b0b14 50%, #0c1a0e 100%)",
            border: isLight
              ? "1px solid rgba(99,102,241,0.18)"
              : "1px solid rgba(99,102,241,0.15)",
          }}
        >
          {/* dot-grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(circle, ${isLight ? "#4f46e5" : "#818cf8"} 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Text row */}
          <div className="relative px-5 py-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: isLight ? "#4f46e5" : "#818cf8" }}
            >
              CommonSphere · Global Intelligence
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold font-sans"
              style={{ color: headText }}
            >
              Dashboard
            </h1>
            <p
              className="text-sm font-sans mt-1 max-w-md"
              style={{ color: mutedText }}
            >
              Real-time data on countries, economies, conflicts, and policies
              across the world.
            </p>
          </div>
        </div>

        {/* ── COUNTRIES CAROUSEL ─────────────────────────────────────────── */}
        <CountryCarousel
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          headText={headText}
          mutedText={mutedText}
          gridLine={gridLine}
          onNav={navigate}
        />

        {/* ── PINNED / MY DASHBOARD ─────────────────────────────────────── */}
        <PinnedSection
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          cardShadow={cardShadow}
          gridLine={gridLine}
          headText={headText}
          mutedText={mutedText}
          bodyText={bodyText}
          onNav={navigate}
        />

        {/* ── KPI PILLS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Countries Tracked",
              value: "195",
              delta: "6 continents",
              positive: true,
              icon: <Globe size={14} weight="fill" />,
            },
            {
              label: "Active Conflicts",
              value: "42",
              delta: "3 escalating",
              positive: false,
              icon: <Crosshair size={14} weight="fill" />,
            },
            {
              label: "Policies Tracked",
              value: "1,200+",
              delta: "+48 this month",
              positive: true,
              icon: <Scales size={14} weight="fill" />,
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
                <span style={{ color: k.positive ? "#10b981" : "#ef4444" }}>
                  {k.icon}
                </span>
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

        {/* ── INTERACTIVE DATA PANEL (standalone full-width) ─────────────── */}
        <InteractiveDataPanel
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          cardShadow={cardShadow}
          gridLine={gridLine}
          headText={headText}
          mutedText={mutedText}
          bodyText={bodyText}
          topCountries={topCountries}
          onNav={navigate}
        />

        {/* ── TRENDS & PROJECTIONS PANEL ────────────────────────────────── */}
        <TrendsProjectionsPanel
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          cardShadow={cardShadow}
          gridLine={gridLine}
          headText={headText}
          mutedText={mutedText}
          bodyText={bodyText}
          onNav={navigate}
        />

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* COL 1: US States + Cities */}
          <div className="flex flex-col gap-4">
            {/* US STATES container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<MapTrifold size={16} weight="fill" />}
                label="US States"
                badge="50 states"
                badgeColor="#3b82f6"
                cta="All States"
                ctaTo="/dashboard/states"
                isLight={isLight}
                onNav={() => navigate("/dashboard/states")}
              />
              <div className="flex flex-col gap-0">
                {topStates.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => navigate("/dashboard/states")}
                    className="flex items-center gap-3 py-2.5 text-left hover:opacity-80 transition-opacity"
                    style={{
                      borderBottom:
                        i < topStates.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold w-7 shrink-0 text-center rounded-md py-0.5"
                      style={{
                        background: isLight
                          ? "rgba(59,130,246,0.1)"
                          : "rgba(147,197,253,0.1)",
                        color: isLight ? "#3b82f6" : "#93c5fd",
                      }}
                    >
                      {s.abbreviation}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {s.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="w-14 h-1.5 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (s.gdp / topStates[0].gdp) * 100)}%`,
                            background: "#3b82f6",
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-mono w-14 text-right"
                        style={{ color: headText }}
                      >
                        {fmtB(s.gdp)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_STATES} className="mt-2 mb-1" />

              {/* State snapshot grid */}
              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {[
                  { label: "Avg Unemp.", value: "3.9%", color: "#10b981" },
                  { label: "Top GDP", value: "$3.9T", color: "#3b82f6" },
                  { label: "Growth", value: "+2.1%", color: "#6366f1" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-2 py-2 text-center"
                    style={{
                      background: m.color + "10",
                      border: `1px solid ${m.color}20`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: m.color }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Up-and-coming Industries card ── */}
            <ExpandableCard
              icon={
                <Sparkle size={14} weight="fill" style={{ color: "#f97316" }} />
              }
              title="Up-and-coming Industries"
              badge="US 2025"
              badgeColor="#f97316"
              description="Fastest-growing emerging sectors by projected YoY investment growth inside the US economy."
              accentColor="#f97316"
              isLight={isLight}
              cardBg={cardBg}
              cardBorder={cardBorder}
              gridLine={gridLine}
              headText={headText}
              mutedText={mutedText}
            >
              <div className="flex flex-col gap-2.5">
                {US_UPCOMING_INDUSTRIES.map((ind) => (
                  <div key={ind.name}>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: ind.color }}
                      />
                      <span
                        className="text-[11px] font-sans font-semibold flex-1 truncate"
                        style={{ color: headText }}
                      >
                        {ind.name}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: ind.color }}
                      >
                        {ind.growth}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${ind.pct}%`, background: ind.color }}
                      />
                    </div>
                    <p
                      className="text-[10px] font-sans mt-1 leading-relaxed"
                      style={{ color: mutedText }}
                    >
                      {ind.name === "Quantum Computing" &&
                        "Backed by IBM, Google, and DARPA with $4.2B in federal investment pledged through 2030. Applications in cryptography, logistics, and drug discovery."}
                      {ind.name === "Space Tech" &&
                        "SpaceX, Blue Origin, and 40+ startups driving commercial launch, satellite broadband, and lunar logistics. NASA Artemis anchors public demand."}
                      {ind.name === "Green Hydrogen" &&
                        "DOE Hydrogen Hubs program allocating $7B to 7 regional hubs. Industrial decarbonization and long-haul transport key use cases."}
                      {ind.name === "Biotech / mRNA" &&
                        "Post-COVID mRNA platform expansion into cancer vaccines, rare diseases, and personalized medicine. NIH funding up 31% since 2022."}
                      {ind.name === "AI Chips" &&
                        "NVIDIA, Intel, and AMD racing to meet data-center demand. CHIPS Act directing $52B to domestic semiconductor fabs and R&D."}
                    </p>
                  </div>
                ))}
              </div>
            </ExpandableCard>

            {/* ── Funding Raised card ── */}
            <ExpandableCard
              icon={
                <Bank size={14} weight="fill" style={{ color: "#6366f1" }} />
              }
              title="Funding Raised"
              badge="$252B · 2025 YTD"
              badgeColor="#6366f1"
              description="Venture capital, private equity, and federal grants raised across major US innovation sectors year-to-date 2025."
              accentColor="#6366f1"
              isLight={isLight}
              cardBg={cardBg}
              cardBorder={cardBorder}
              gridLine={gridLine}
              headText={headText}
              mutedText={mutedText}
            >
              <div className="flex flex-col gap-3">
                {US_FUNDING_DATA.map((f) => (
                  <div key={f.sector}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[11px] font-sans font-semibold flex-1 truncate"
                        style={{ color: headText }}
                      >
                        {f.sector}
                      </span>
                      <span
                        className="text-[11px] font-mono font-bold"
                        style={{ color: f.color }}
                      >
                        {f.raised}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${f.pct}%`, background: f.color }}
                      />
                    </div>
                    <p
                      className="text-[10px] font-sans mt-1 leading-relaxed"
                      style={{ color: mutedText }}
                    >
                      {f.sector === "AI / ML" &&
                        "Largest single-sector raise on record. Led by OpenAI ($10B), Anthropic ($7.3B), and Cohere. Hyperscaler capex adds another $120B+ in infrastructure."}
                      {f.sector === "Clean Energy" &&
                        "IRA incentives driving solar, battery, and grid investment. Includes $18B in utility-scale solar and $14B in EV battery supply chains."}
                      {f.sector === "Biotech" &&
                        "mRNA, CRISPR, and oncology platforms dominate. Top rounds: Recursion Pharma ($850M), Generate Biomedicines ($754M), Flagship Pioneering ($3.5B fund)."}
                      {f.sector === "Space" &&
                        "SpaceX Starship program, lunar logistics, and satellite broadband. NASA CLPS contracts worth $2.6B. Commercial LEO station deals signed."}
                      {f.sector === "Quantum" &&
                        "IBM, IonQ, and PsiQuantum raising for error-corrected qubit milestones. NSF and DOE co-investing $1.8B via National Quantum Initiative."}
                    </p>
                  </div>
                ))}
              </div>
            </ExpandableCard>

            {/* ── Global Alliances card ── */}
            <ExpandableCard
              icon={
                <ShareNetwork
                  size={14}
                  weight="fill"
                  style={{ color: "#3b82f6" }}
                />
              }
              title="Global Alliances & Joint Projects"
              badge="5 active"
              badgeColor="#3b82f6"
              description="Key multilateral defense, intelligence, and technology alliances the US participates in, and their active joint programs."
              accentColor="#3b82f6"
              isLight={isLight}
              cardBg={cardBg}
              cardBorder={cardBorder}
              gridLine={gridLine}
              headText={headText}
              mutedText={mutedText}
            >
              <div className="flex flex-col gap-3">
                {US_ALLIANCES.map((a, _i) => (
                  <div
                    key={a.name}
                    className="rounded-xl px-3 py-3"
                    style={{
                      background: a.color + "0a",
                      border: `1px solid ${a.color}22`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-mono font-bold"
                          style={{ color: a.color }}
                        >
                          {a.name}
                        </span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: a.color + "18", color: a.color }}
                        >
                          {a.tag}
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {a.partners}
                      </span>
                    </div>
                    <p
                      className="text-[11px] font-sans font-semibold mb-1"
                      style={{ color: headText }}
                    >
                      {a.project}
                    </p>
                    <p
                      className="text-[10px] font-sans leading-relaxed"
                      style={{ color: mutedText }}
                    >
                      {a.name === "AUKUS" &&
                        "Trilateral security pact signed Sept 2021. Pillar I delivers SSN-AUKUS nuclear-powered submarines to Australia by mid-2030s. Pillar II covers AI, cyber, hypersonics, quantum, and undersea capabilities sharing."}
                      {a.name === "Quad" &&
                        "Quadrilateral Security Dialogue revived 2017, elevated to leaders-level 2021. Coordinates on COVID vaccines, climate, critical tech, and counter-China maritime strategy in the Indo-Pacific."}
                      {a.name === "Five Eyes" &&
                        "Oldest intelligence-sharing alliance (est. 1941). Covers SIGINT, HUMINT, and cyber threat intelligence. Expanded focus on CCP economic espionage and critical infrastructure protection since 2020."}
                      {a.name === "NATO DIANA" &&
                        "Defence Innovation Accelerator for the North Atlantic launched 2022. 1,000+ dual-use deep-tech startups targeted. Test centres in UK and Estonia. $1B+ in allied nation co-investment."}
                      {a.name === "Clean Power Alliance" &&
                        "G7 + IEA pledge framework to triple renewable capacity globally by 2030. US commits $20B via DFC for emerging-market clean energy financing. Includes Just Energy Transition Partnerships with South Africa, Vietnam, India."}
                    </p>
                  </div>
                ))}
              </div>
            </ExpandableCard>

            {/* ── R&D Breakthroughs card ── */}
            <ExpandableCard
              icon={
                <Atom size={14} weight="fill" style={{ color: "#a855f7" }} />
              }
              title="R&D Discoveries & Breakthroughs"
              badge="2025"
              badgeColor="#a855f7"
              description="Major US federal agency and national laboratory scientific discoveries and technology breakthroughs from the past 12 months."
              accentColor="#a855f7"
              isLight={isLight}
              cardBg={cardBg}
              cardBorder={cardBorder}
              gridLine={gridLine}
              headText={headText}
              mutedText={mutedText}
            >
              <div className="flex flex-col gap-0">
                {US_RD_BREAKTHROUGHS.map((r, i) => (
                  <div
                    key={r.title}
                    className="py-3"
                    style={{
                      borderBottom:
                        i < US_RD_BREAKTHROUGHS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div className="flex items-start gap-2.5 mb-1.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: r.color + "18", color: r.color }}
                      >
                        <Atom size={10} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] font-sans font-semibold leading-snug"
                          style={{ color: headText }}
                        >
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                            style={{
                              background: r.color + "15",
                              color: r.color,
                            }}
                          >
                            {r.field}
                          </span>
                          <span
                            className="text-[9px] font-mono"
                            style={{ color: mutedText }}
                          >
                            {r.agency} · {r.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p
                      className="text-[10px] font-sans leading-relaxed pl-8"
                      style={{ color: mutedText }}
                    >
                      {r.agency === "DARPA" &&
                        "DARPA's Air Combat Evolution (ACE) program pit an AI-controlled F-16 against a human pilot in a live dogfight. The AI won 5-0 using reinforcement learning trained on millions of simulated engagements. Marks a pivotal shift in autonomous combat doctrine."}
                      {r.agency === "NIH" &&
                        "FDA approved Casgevy — the world's first CRISPR-based therapy — for sickle-cell disease. NIH-funded research spanning 15 years enabled the breakthrough. Treatment edits patients' own stem cells to produce functional haemoglobin, potentially offering a functional cure."}
                      {r.agency === "NIST" &&
                        "NIST finalized three post-quantum cryptographic algorithms (CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+) as federal standards, hardening US government communications against future quantum decryption attacks. Implementation deadline for federal agencies set for 2030."}
                      {r.agency === "NASA" &&
                        "Artemis II carried four astronauts — including the first woman and first Canadian — on a 10-day lunar flyby at 8,900 km altitude. Validated Orion life-support and deep-space communications systems ahead of the Artemis III crewed lunar landing."}
                      {r.agency === "DOE / NIF" &&
                        "National Ignition Facility at Lawrence Livermore achieved ignition — releasing more fusion energy than laser energy delivered — for the third consecutive time, demonstrating repeatability. DOE's milestone roadmap now targets a 10× energy gain pilot plant by 2035."}
                    </p>
                  </div>
                ))}
              </div>
            </ExpandableCard>

            {/* CITIES container */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-0 flex-1"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<Buildings size={16} weight="fill" />}
                label="Cities"
                badge="500+ global"
                badgeColor="#10b981"
                cta="All Cities"
                ctaTo="/dashboard/cities"
                isLight={isLight}
                onNav={() => navigate("/dashboard/cities")}
              />

              {/* GDP per Capita bar chart */}
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-2"
                style={{ color: mutedText }}
              >
                GDP per Capita (USD k)
              </p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart
                  data={CITIES_CHART_DATA}
                  margin={{ top: 2, right: 4, left: -18, bottom: 0 }}
                  barSize={14}
                >
                  <defs>
                    <linearGradient
                      id="cityGdpGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#059669"
                        stopOpacity={0.5}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke={gridLine}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}k`}
                    domain={[0, 160]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: isLight
                        ? "1px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number) => [`$${v}k`, "GDP/capita"]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Bar
                    dataKey="gdp"
                    fill="url(#cityGdpGrad)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              <SourceLink sources={SRC_DASH_CITIES} className="mt-1 mb-1" />

              {/* City list */}
              <div
                className="flex flex-col gap-0 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {CITIES_DATA.map((c, i) => (
                  <button
                    key={c.city}
                    onClick={() => navigate("/dashboard/cities")}
                    className="flex items-center gap-2 py-2 text-left hover:opacity-80 transition-opacity"
                    style={{
                      borderBottom:
                        i < CITIES_DATA.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <span className="text-base w-6 shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {c.city}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {c.country} · {c.pop}
                      </p>
                    </div>
                    {/* Confidence bar */}
                    <div
                      className="w-12 h-1.5 rounded-full overflow-hidden shrink-0"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((c.gdpPerCapita / 141) * 100))}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                    <div className="text-right shrink-0 w-14">
                      <p
                        className="text-[11px] font-mono font-semibold"
                        style={{ color: headText }}
                      >
                        {c.gdpLabel}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: c.up ? "#10b981" : "#ef4444" }}
                      >
                        {c.growth}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Summary stats */}
              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {[
                  { label: "Avg GDP/cap", value: "$76k", color: "#10b981" },
                  { label: "Fastest Grow", value: "+4.9%", color: "#f59e0b" },
                  { label: "Cities Tracked", value: "500+", color: "#6366f1" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-2 py-2 text-center"
                    style={{
                      background: m.color + "10",
                      border: `1px solid ${m.color}20`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: m.color }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COL 2: Conflicts + Recent Events */}
          <div className="flex flex-col gap-4">
            {/* CONFLICTS container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<Crosshair size={16} weight="fill" />}
                label="Conflicts"
                badge="42 active"
                badgeColor="#ef4444"
                cta="View Conflicts"
                ctaTo="/dashboard/conflicts"
                isLight={isLight}
                onNav={() => navigate("/dashboard/conflicts")}
              />
              <div className="flex flex-col gap-2.5">
                {CONFLICTS_DATA.map((c) => (
                  <div key={c.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{ background: c.color + "15", color: c.color }}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.intensity}%`,
                            background: c.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-mono w-6 text-right shrink-0"
                        style={{ color: mutedText }}
                      >
                        {c.intensity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_CONFLICTS} className="mt-2 mb-1" />
              <div
                className="mt-2 pt-3 grid grid-cols-2 gap-2"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <div
                  className="rounded-xl px-3 py-2 text-center"
                  style={{
                    background: "#ef444410",
                    border: "1px solid #ef444420",
                  }}
                >
                  <p
                    className="text-base font-bold font-mono"
                    style={{ color: "#ef4444" }}
                  >
                    42
                  </p>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    Active
                  </p>
                </div>
                <div
                  className="rounded-xl px-3 py-2 text-center"
                  style={{
                    background: "#f5940010",
                    border: "1px solid #f5940020",
                  }}
                >
                  <p
                    className="text-base font-bold font-mono"
                    style={{ color: "#f59e0b" }}
                  >
                    18
                  </p>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    Monitored
                  </p>
                </div>
              </div>
            </div>

            {/* RECENT EVENTS container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Fire size={16} weight="fill" style={{ color: "#f97316" }} />
                  <h2
                    className="text-base font-bold font-sans"
                    style={{ color: headText }}
                  >
                    Live Feed
                  </h2>
                </div>
                <span
                  className="text-[9px] font-mono px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "#ef444415", color: "#ef4444" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />{" "}
                  Live
                </span>
              </div>
              <div className="flex flex-col gap-0">
                {RECENT_EVENTS.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < RECENT_EVENTS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: e.color + "18", color: e.color }}
                    >
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {e.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: e.color + "15", color: e.color }}
                        >
                          {e.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {e.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTOR OUTLOOK mini container */}
            <div
              className="rounded-2xl p-3 flex flex-col flex-1"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div className="mb-2">
                <SectionHeader
                  icon={<ChartLineUp size={14} weight="fill" />}
                  label="Sector Outlook"
                  badge="12-month"
                  badgeColor="#a855f7"
                  cta="Full Trends"
                  ctaTo="/dashboard/trends"
                  isLight={isLight}
                  onNav={() => navigate("/dashboard/trends")}
                />
              </div>

              {/* Sector rows */}
              <div className="flex flex-col gap-0">
                {SECTOR_OUTLOOK.map((s, i) => (
                  <div
                    key={s.sector}
                    className="flex items-center gap-2 py-1"
                    style={{
                      borderBottom:
                        i < SECTOR_OUTLOOK.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    {/* Left side: sector name + outlook value stacked */}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[11px] font-semibold font-sans truncate block"
                        style={{ color: headText }}
                      >
                        {s.sector}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {s.up ? (
                          <TrendUp
                            size={9}
                            weight="fill"
                            style={{ color: s.color }}
                          />
                        ) : (
                          <TrendDown
                            size={9}
                            weight="fill"
                            style={{ color: s.color }}
                          />
                        )}
                        <span
                          className="text-[10px] font-mono font-semibold"
                          style={{ color: s.color }}
                        >
                          {s.outlook}
                        </span>
                      </div>
                    </div>
                    {/* Right side: bar + confidence% */}
                    <div
                      className="w-10 h-1 rounded-full overflow-hidden shrink-0"
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
                      className="text-[9px] font-mono shrink-0 w-7 text-right"
                      style={{ color: mutedText }}
                    >
                      {s.confidence}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Top-3 sparklines */}
              <div
                className="mt-2 pt-2 flex flex-col gap-1"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-0.5"
                  style={{ color: mutedText }}
                >
                  Top Movers — 7-week
                </p>
                {Object.entries(SECTOR_SPARKLINES).map(([name, pts]) => {
                  const sData = SECTOR_OUTLOOK.find((s) => s.sector === name);
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-sans font-semibold truncate w-20 shrink-0"
                        style={{ color: headText }}
                      >
                        {name}
                      </span>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={22}>
                          <AreaChart
                            data={pts}
                            margin={{ top: 1, right: 0, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id={`spark-${name.replace(/\s/g, "")}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={sData?.color ?? "#a855f7"}
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={sData?.color ?? "#a855f7"}
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="v"
                              stroke={sData?.color ?? "#a855f7"}
                              strokeWidth={1.5}
                              fill={`url(#spark-${name.replace(/\s/g, "")})`}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <span
                        className="text-[9px] font-mono font-semibold shrink-0 w-7 text-right"
                        style={{ color: sData?.color ?? "#a855f7" }}
                      >
                        {sData?.outlook}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── US STATES CAROUSEL ────────────────────────────────────────── */}
        <StatesCarousel
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          headText={headText}
          mutedText={mutedText}
          gridLine={gridLine}
          onNav={navigate}
        />

        {/* ── NATIONAL SECTION ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <SectionHeader
            icon={<Flag size={16} weight="fill" />}
            label="National"
            badge="US Focus"
            badgeColor="#3b82f6"
            cta="View States"
            ctaTo="/dashboard/states"
            isLight={isLight}
            onNav={() => navigate("/dashboard/states")}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Domestic Highlights
              </p>
              <div className="flex flex-col gap-0">
                {NATIONAL_HIGHLIGHTS.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < NATIONAL_HIGHLIGHTS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: e.color + "18", color: e.color }}
                    >
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {e.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: e.color + "15", color: e.color }}
                        >
                          {e.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {e.sub} · {e.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                State GDP Snapshot
              </p>
              <div className="flex flex-col gap-0">
                {[
                  {
                    state: "CA",
                    label: "California",
                    gdp: "$3.9T",
                    change: "+2.1%",
                    up: true,
                    color: "#6366f1",
                  },
                  {
                    state: "TX",
                    label: "Texas",
                    gdp: "$2.6T",
                    change: "+3.4%",
                    up: true,
                    color: "#3b82f6",
                  },
                  {
                    state: "NY",
                    label: "New York",
                    gdp: "$2.1T",
                    change: "+1.8%",
                    up: true,
                    color: "#10b981",
                  },
                  {
                    state: "FL",
                    label: "Florida",
                    gdp: "$1.6T",
                    change: "+4.2%",
                    up: true,
                    color: "#f59e0b",
                  },
                  {
                    state: "WA",
                    label: "Washington",
                    gdp: "$800B",
                    change: "-0.3%",
                    up: false,
                    color: "#ef4444",
                  },
                  {
                    state: "IL",
                    label: "Illinois",
                    gdp: "$912B",
                    change: "+0.9%",
                    up: true,
                    color: "#a855f7",
                  },
                ].map((s, i) => (
                  <div
                    key={s.state}
                    className="flex items-center gap-2.5 py-2.5"
                    style={{
                      borderBottom: i < 5 ? `1px solid ${gridLine}` : "none",
                    }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold w-7 text-center rounded-md py-0.5 shrink-0"
                      style={{ background: s.color + "18", color: s.color }}
                    >
                      {s.state}
                    </span>
                    <p
                      className="text-xs font-semibold font-sans flex-1 truncate"
                      style={{ color: headText }}
                    >
                      {s.label}
                    </p>
                    <span
                      className="text-[11px] font-mono shrink-0"
                      style={{ color: headText }}
                    >
                      {s.gdp}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {s.up ? (
                        <ArrowUp size={10} weight="bold" color="#10b981" />
                      ) : (
                        <ArrowDown size={10} weight="bold" color="#ef4444" />
                      )}
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: s.up ? "#10b981" : "#ef4444" }}
                      >
                        {s.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERNATIONAL SECTION ─────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <SectionHeader
            icon={<Globe size={16} weight="fill" />}
            label="International"
            badge="Global"
            badgeColor="#6366f1"
            cta="View Countries"
            ctaTo="/dashboard/countries"
            isLight={isLight}
            onNav={() => navigate("/dashboard/countries")}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Global Developments
              </p>
              <div className="flex flex-col gap-0">
                {INTERNATIONAL_EVENTS.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < INTERNATIONAL_EVENTS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: e.color + "18", color: e.color }}
                    >
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {e.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: e.color + "15", color: e.color }}
                        >
                          {e.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {e.region} · {e.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Inflation Trend
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart
                  data={INFLATION_DATA}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
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
                  />
                  <ReferenceLine y={2} stroke="#10b981" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: isLight
                        ? "1px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number, name: string) => [
                      `${v}%`,
                      name === "g20" ? "G20" : "Advanced",
                    ]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Line
                    type="monotone"
                    dataKey="g20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 2.5, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="adv"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 2.5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "G20 Avg", color: "#f59e0b" },
                  { label: "Advanced", color: "#3b82f6" },
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
              <div
                className="mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: mutedText }}
                >
                  Regional GDP
                </p>
                {REGION_STATS.slice(0, 4).map((r, i) => (
                  <div
                    key={r.region}
                    className="flex items-center justify-between py-1.5"
                    style={{
                      borderBottom: i < 3 ? `1px solid ${gridLine}` : "none",
                    }}
                  >
                    <p
                      className="text-[11px] font-sans truncate flex-1"
                      style={{ color: headText }}
                    >
                      {r.region}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.up ? (
                        <TrendUp size={9} weight="fill" color="#10b981" />
                      ) : (
                        <TrendDown size={9} weight="fill" color="#ef4444" />
                      )}
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: r.up ? "#10b981" : "#ef4444" }}
                      >
                        {r.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 flex flex-col items-center gap-1">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Dashboard · Data
            updated Q2 2025
          </p>
          <SourceLink
            sources={[
              { label: "World Bank", url: "https://data.worldbank.org/" },
              { label: "IMF", url: "https://www.imf.org/en/Data" },
              { label: "BLS", url: "https://www.bls.gov/data/" },
              { label: "BEA", url: "https://www.bea.gov/" },
              { label: "ACLED", url: "https://acleddata.com/" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
