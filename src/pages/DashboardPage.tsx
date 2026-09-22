import { na, has, sortKey } from "../lib/na";
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
  ArrowLeft,
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
  Users,
  Newspaper,
  Bank,
  Handshake,
  Sparkle,
  Info,
  Target,
  ChartLineUp,
  MapPin,
  MagnifyingGlass,
  X,
  CheckCircle,
  Heart,
  ChartDonut,
} from "@phosphor-icons/react";
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
import { useLiveCountries } from "../contexts/LiveDataContext";
import { usStatesData } from "../data/statesData";
import { STATE_INDICATORS as STATE_FIGURES } from "../data/stateIndicators";
import { economiesData } from "../data/economiesData";
import { SourceLink } from "../components/SourceLink";
import { Figures, COUNTER_FIGURES, COUNTER_UNIT } from "../components/Figures";
import {
  CALENDAR_2026,
  CALENDAR_CHECKED,
  CALENDAR_YEAR,
  eventQuarter,
  type CalendarEvent,
} from "../data/calendar2026";

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
  const liveCountries = useLiveCountries();
  const sorted = React.useMemo(
    () => [...liveCountries].sort((a, b) => sortKey(b.gdp, "desc") - sortKey(a.gdp, "desc")),
    [liveCountries],
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

  const fmtGDPShort = (b: number) =>
    b >= 1000 ? `$${(b / 1000).toFixed(1)}T` : `$${Math.round(b)}B`;

  const fmtPopShort = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
    return `${Math.round(n / 1000)}K`;
  };

  const hdiColor = (h: number) =>
    !has(h) ? "#9ca3af" : h >= 0.8 ? "#10b981" : h >= 0.65 ? "#f59e0b" : "#ef4444";

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
              background: `linear-gradient(to right, var(--color-background), transparent)`,
            }}
          />
          {/* Right fade mask */}
          <div
            className="absolute inset-y-0 right-0 pointer-events-none z-10"
            style={{
              width: 28,
              background: `linear-gradient(to left, var(--color-background), transparent)`,
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
                  onClick={() =>
                    onNav(`/dashboard/countries?open=${country.id}`)
                  }
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
                        HDI {na(country.humanDevelopmentIndex, (v) => String(v))}
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
                        {na(country.gdp, fmtGDPShort)}
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
                        {na(country.gdpGrowth, (v) => `${v}%`)}
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
              background: `linear-gradient(to right, var(--color-background), transparent)`,
            }}
          />
          {/* Right fade */}
          <div
            className="absolute inset-y-0 right-0 pointer-events-none z-10"
            style={{
              width: 28,
              background: `linear-gradient(to left, var(--color-background), transparent)`,
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
                  onClick={() => onNav(`/dashboard/states?open=${state.id}`)}
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
// World Bank, GDP (current US$), world aggregate, in trillions. The series
// this replaced understated every year - 2024 read 105.4 against the Bank's
// 111.7 - and ended a year early.
const WORLD_GDP_SERIES = [
  { year: "2018", gdp: 87.3 },
  { year: "2019", gdp: 88.8 },
  { year: "2020", gdp: 86.4 },
  { year: "2021", gdp: 98.8 },
  { year: "2022", gdp: 102.9 },
  { year: "2023", gdp: 107.3 },
  { year: "2024", gdp: 111.7 },
  { year: "2025", gdp: 118.4 },
];

// IMF World Economic Outlook, April 2026 (PCPIPCH, consumer prices, annual
// %): the world aggregate and advanced economies. 2026 is a projection.
const INFLATION_DATA = [
  { year: "2022", world: 8.7, adv: 7.3 },
  { year: "2023", world: 6.7, adv: 4.6 },
  { year: "2024", world: 5.8, adv: 2.6 },
  { year: "2025", world: 4.1, adv: 2.5 },
  { year: "2026", world: 4.4, adv: 2.8 },
];

/**
 * Newest "Mon YYYY" date in a curated feed.
 *
 * These feeds are hand-authored and cannot refresh themselves — GDELT and
 * NewsAPI both block browser requests, so there is no client-side source to
 * wire them to. Deriving the label from the entries means the UI states the
 * period it is actually showing instead of asserting it is live, and it stays
 * correct whenever the entries are next edited.
 */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function feedLatestLabel(items: { date: string }[]): string {
  let best = -Infinity;
  let label = "";
  for (const it of items) {
    const m = /^([A-Za-z]{3})\s+(\d{4})$/.exec(it.date.trim());
    if (!m) continue;
    const mi = MONTHS.indexOf(m[1]);
    if (mi < 0) continue;
    const key = Number(m[2]) * 12 + mi;
    if (key > best) {
      best = key;
      label = it.date.trim();
    }
  }
  return label;
}

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

// IMF World Economic Outlook, April 2026 (NGDPD, GDP at current prices),
// world aggregate, in trillions. What this replaced put 2024 at 105.4
// against the IMF's 111.6, and projected 2025 at 107.1 - a projection below
// what that year actually came in at, 118.2.
const GDP_PROJECTION_COMBINED = [
  { year: "2020", gdp: 86.2, type: "actual" },
  { year: "2021", gdp: 98.4, type: "actual" },
  { year: "2022", gdp: 102.7, type: "actual" },
  { year: "2023", gdp: 107.2, type: "actual" },
  { year: "2024", gdp: 111.6, type: "actual" },
  { year: "2025", gdp: 118.2, type: "actual" },
  { year: "2026", gdp: 126.3, type: "projected" },
  { year: "2027", gdp: 131.9, type: "projected" },
  { year: "2028", gdp: 138.1, type: "projected" },
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
    delta: "-0.3pp vs 2025",
    up: false,
    color: "#6366f1",
  },
  {
    label: "Advanced Econ. Inflation",
    value: "2.8%",
    delta: "+0.3pp vs 2025",
    up: true,
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
    value: "+2.1pp",
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
                World GDP — actual vs IMF projection · WEO April 2026 (USD
                trillions)
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


/* ─── Pinned Dashboard logic ────────────────────────────────────────────── */


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
    // ACS 2024; replaced a "Quality of Life" score with no source.
    label: "Bachelor's+",
    unit: "%",
    get: (s: (typeof usStatesData)[0]) => `${STATE_FIGURES[s.id]?.education.bachelorsOrHigherPct ?? "—"}%`,
    raw: (s: (typeof usStatesData)[0]) => STATE_FIGURES[s.id]?.education.bachelorsOrHigherPct ?? 0,
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

const COMPARE_METRICS = [
  {
    label: "GDP",
    unit: "",
    get: (c: (typeof countriesData)[0]) =>
      c.gdp >= 1000
        ? `${(c.gdp / 1000).toFixed(1)}T`
        : has(c.gdp) ? `${Math.round(c.gdp)}B` : "—",
    raw: (c: (typeof countriesData)[0]) => c.gdp,
    higherBetter: true,
    color: "#6366f1",
  },
  {
    label: "GDP / Capita",
    unit: "",
    get: (c: (typeof countriesData)[0]) =>
      na(c.gdpPerCapita, (v) => `${v.toLocaleString()}`),
    raw: (c: (typeof countriesData)[0]) => c.gdpPerCapita,
    higherBetter: true,
    color: "#8b5cf6",
  },
  {
    label: "GDP Growth",
    unit: "%",
    get: (c: (typeof countriesData)[0]) =>
      na(c.gdpGrowth, (v) => `${v >= 0 ? "+" : ""}${v}%`),
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
    get: (c: (typeof countriesData)[0]) => na(c.unemploymentRate, (v) => `${v.toFixed(1)}%`),
    raw: (c: (typeof countriesData)[0]) => c.unemploymentRate,
    higherBetter: false,
    color: "#f59e0b",
  },
  {
    label: "Inflation",
    unit: "%",
    get: (c: (typeof countriesData)[0]) => na(c.inflationRate, (v) => `${v}%`),
    raw: (c: (typeof countriesData)[0]) => c.inflationRate,
    higherBetter: false,
    color: "#ef4444",
  },
  {
    label: "Life Expectancy",
    unit: "yrs",
    get: (c: (typeof countriesData)[0]) => na(c.lifeExpectancy, (v) => `${v} yrs`),
    raw: (c: (typeof countriesData)[0]) => c.lifeExpectancy,
    higherBetter: true,
    color: "#06b6d4",
  },
  {
    label: "HDI",
    unit: "",
    get: (c: (typeof countriesData)[0]) =>
      na(c.humanDevelopmentIndex, (v) => v.toFixed(3)),
    raw: (c: (typeof countriesData)[0]) => c.humanDevelopmentIndex,
    higherBetter: true,
    color: "#a855f7",
  },
  {
    label: "Trade Balance",
    unit: "B",
    get: (c: (typeof countriesData)[0]) =>
      Number.isFinite(c.tradeBalance)
        ? `${c.tradeBalance >= 0 ? "+" : ""}$${c.tradeBalance}B`
        : "No data",
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

  const liveCountries = useLiveCountries();
  const selectedCountries = useMemo(
    () => liveCountries.filter((c) => selectedCountryIds.includes(c.id)),
    [liveCountries, selectedCountryIds],
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
        {/* Hands this card's pins to the rankings page, which is the same
            comparison with every indicator and each figure's rank — and which
            can hold countries and states at once, as this card cannot. */}
        <button
          onClick={() => {
            const ids = (
              tab === "countries"
                ? selectedCountryIds.map((id) => `country-${id}`)
                : selectedStateIds.map((id) => `state-${id}`)
            ).join(",");
            onNav(`/dashboard/rankings${ids ? `?compare=${ids}` : ""}`);
          }}
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
                    aria-label={`Unpin ${c.name}`}
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
                  // Only countries with a figure can be best or worst; subtracting
                  // a missing value (NaN) would scramble the sort.
                  const ranked = selectedCountries.filter((c) =>
                    Number.isFinite(m.raw(c)),
                  );
                  const bestId =
                    ranked.length >= 2
                      ? [...ranked].sort((a, b) =>
                          m.higherBetter
                            ? m.raw(b) - m.raw(a)
                            : m.raw(a) - m.raw(b),
                        )[0].id
                      : null;
                  const worstId =
                    ranked.length >= 2
                      ? [...ranked].sort((a, b) =>
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
                    aria-label={`Unpin ${s.name}`}
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
                    label: "Lowest Unemployment",
                    entity: [...selectedStates].sort(
                      (a, b) => a.unemploymentRate - b.unemploymentRate,
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
  const liveCountries = useLiveCountries();
  const allByGDP = useMemo(
    () => [...liveCountries].sort((a, b) => sortKey(b.gdp, "desc") - sortKey(a.gdp, "desc")),
    [liveCountries],
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
                  ? ([...liveCountries].sort((a, b) => b.gdp - a.gdp)[0] ??
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
                  World GDP Trend · World Bank
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
                        {na(c.gdp, fmtGDPShort)}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: gdpUp ? "#10b981" : "#ef4444" }}
                      >
                        {gdpUp ? "+" : ""}
                        {na(c.gdpGrowth, (v) => `${v}%`)}
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
                        n === "world" ? "World" : "Advanced",
                      ]}
                      labelStyle={{ color: mutedText }}
                    />
                    <Line
                      type="monotone"
                      dataKey="world"
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
                    { label: "World", color: "#f59e0b" },
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
                        {na(c.gdpGrowth, (v) => `${v}%`)}
                      </span>
                    </div>
                  </div>

                  {/* Primary KPI grid — 3 cols */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        label: "GDP",
                        value: na(c.gdp, fmtGDPShort),
                        color: "#6366f1",
                      },
                      {
                        label: "Growth",
                        value: na(c.gdpGrowth, (v) => `${gdpUp ? "+" : ""}${v}%`),
                        color: gdpUp ? "#10b981" : "#ef4444",
                      },
                      {
                        label: "GDP/Cap",
                        value: na(c.gdpPerCapita, (v) => `${v.toLocaleString()}`),
                        color: "#3b82f6",
                      },
                      {
                        label: "Inflation",
                        value: na(c.inflationRate, (v) => `${v}%`),
                        color: c.inflationRate > 6 ? "#ef4444" : "#f59e0b",
                      },
                      {
                        label: "Unemp.",
                        value: na(c.unemploymentRate, (v) => `${v.toFixed(1)}%`),
                        color: c.unemploymentRate < 5 ? "#10b981" : "#f59e0b",
                      },
                      {
                        label: "HDI",
                        value: na(c.humanDevelopmentIndex, (v) => v.toFixed(3)),
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
                        value: na(c.lifeExpectancy, (v) => `${v} yrs`),
                        icon: <Heart size={10} weight="fill" />,
                        color: "#ec4899",
                      },
                      {
                        label: "Trade Balance",
                        value: Number.isFinite(c.tradeBalance)
                          ? `${c.tradeBalance >= 0 ? "+" : ""}$${c.tradeBalance}B`
                          : "No data",
                        icon: <Scales size={10} weight="fill" />,
                        color: !Number.isFinite(c.tradeBalance)
                          ? mutedText
                          : c.tradeBalance >= 0 ? "#10b981" : "#ef4444",
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
                        GDP Trend · World Bank
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
                          {na(c.gdp, fmtGDPShort)}
                        </span>
                        <span
                          className="text-[10px] font-mono shrink-0 w-10 text-right"
                          style={{
                            color: c.gdpGrowth >= 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {na(c.gdpGrowth, (v) => `${v >= 0 ? "+" : ""}${v}%`)}
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
  // Hover is tracked in state rather than with a :hover class because the row's
  // background is an inline style keyed to accentColor, and a Tailwind hover
  // variant cannot override an inline background.
  const [hover, setHover] = useState(false);

  // The row previously only had hover:opacity-90, which fades it — reading as
  // disabled rather than clickable. It now warms toward the card's accent
  // colour on hover, and a little further again when already open.
  //
  // The tints were far too weak to see: on the light theme a hovered row came
  // out at rgba(59,130,246,0.008), which is no change at all. They are now
  // strong enough to read as a hover state while still being a tint - roughly
  // 9% of the accent on the light theme and 16% on the dark one, deepening
  // again when the card is already open.
  const headerBg = open
    ? isLight
      ? accentColor + (hover ? "24" : "12")
      : accentColor + (hover ? "33" : "1a")
    : hover
      ? isLight
        ? accentColor + "17"
        : accentColor + "29"
      : "transparent";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder }}
    >
      {/* Header / toggle row */}
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-150 cursor-pointer"
        style={{
          borderBottom: open ? `1px solid ${gridLine}` : "none",
          background: headerBg,
          // A bar in the accent colour on hover or while open, so the row
          // reads as interactive even where a tint is hard to see.
          boxShadow: hover || open ? `inset 3px 0 0 0 ${accentColor}` : "none",
        }}
      >
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150"
          style={{
            background: accentColor + (hover ? "26" : "15"),
            border: `1px solid ${accentColor}${hover ? "45" : "25"}`,
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
          className="shrink-0 transition-all duration-200"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: hover ? accentColor : mutedText,
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


// Helper to convert lon/lat → SVG x/y (equirectangular, 1000×500)

// Build simplified country outlines as SVG path strings from bounding-box rectangles
// For each country we use a rough polygon approximation



// Which countries to show labels for (to avoid clutter)


/* ─── Reusable Section Header ───────────────────────────────────────────── */
function SectionHeader({
  icon,
  label,
  badge,
  badgeColor,
  cta,
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
// ─── Quarter tracker ─────────────────────────────────────────────────────────
/**
 * Where the year is, by quarter.
 *
 * Two calendars, because a dashboard carrying US federal figures needs both
 * and they disagree by a quarter: the calendar year runs January to December,
 * while the US federal fiscal year runs 1 October to 30 September and is named
 * for the year it ends in, so 20 September 2026 is calendar Q3 and federal
 * FY2026 Q4.
 *
 * Everything is computed from the clock rather than written down, so nothing
 * here can go stale. Dates are local-time midnights; a quarter ends the instant
 * the next one begins, which is what the countdown counts to.
 */
type QuarterInfo = {
  label: string;
  start: Date;
  /** Exclusive: the first instant of the next quarter. */
  end: Date;
  index: number;
};

/** The four calendar quarters of the year `now` falls in. */
function calendarQuarters(now: Date): QuarterInfo[] {
  const y = now.getFullYear();
  return [0, 1, 2, 3].map((i) => ({
    label: `Q${i + 1}`,
    start: new Date(y, i * 3, 1),
    end: new Date(y, i * 3 + 3, 1),
    index: i,
  }));
}

/**
 * The four quarters of the US federal fiscal year `now` falls in. FY quarters
 * start in October, and the fiscal year is named for the calendar year it ends
 * in: October to December 2025 is FY2026 Q1.
 */
function fiscalQuarters(now: Date): { fy: number; quarters: QuarterInfo[] } {
  const m = now.getMonth();
  const startYear = m >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  const quarters = [0, 1, 2, 3].map((i) => ({
    label: `Q${i + 1}`,
    start: new Date(startYear, 9 + i * 3, 1),
    end: new Date(startYear, 9 + (i + 1) * 3, 1),
    index: i,
  }));
  return { fy: startYear + 1, quarters };
}

const QUARTER_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long" });
const range = (q: QuarterInfo) =>
  `${QUARTER_FMT.format(q.start)} – ${QUARTER_FMT.format(new Date(q.end.getTime() - 1))}`;

/**
 * A colour per quarter, taken from the northern-hemisphere season it mostly
 * covers: winter blue, spring green, summer gold, autumn rust.
 *
 * `accent` draws the borders, the progress bar and the fills. Text is never
 * the accent itself — on a tinted fill that is the pair most likely to fail
 * contrast — so each season also carries the ink to write on it: a dark shade
 * for the light theme, a pale one for the dark theme. The tint is the accent
 * at roughly 12% on light and 20% on dark, which keeps the four quarters
 * distinguishable without turning the card into a paintbox.
 */
const SEASONS = [
  // bright: a clearer, more saturated version of the accent, for the
  // progress bar, where the muted accents ran together into a muddy brown.
  { name: "Winter", accent: "#4f83cc", bright: "#6fa8ff", inkLight: "#1b3a63", inkDark: "#cfe2ff" },
  { name: "Spring", accent: "#4f9d69", bright: "#4cc48a", inkLight: "#17402d", inkDark: "#cfeddb" },
  { name: "Summer", accent: "#c79232", bright: "#f6c343", inkLight: "#54390a", inkDark: "#f7e4b6" },
  { name: "Autumn", accent: "#c0653c", bright: "#f27a54", inkLight: "#5b2811", inkDark: "#f8d8c6" },
] as const;

/** Local midnight for an ISO yyyy-mm-dd, so nothing shifts by a time zone. */
function isoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** How an entry reads as a date: a day, a span of days, or a bare month. */
function eventDateLabel(e: CalendarEvent): string {
  const start = isoDate(e.start);
  if (e.monthOnly) return MONTH_FMT.format(start);
  if (!e.end) return QUARTER_FMT.format(start);
  const end = isoDate(e.end);
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${start.getDate()}–${QUARTER_FMT.format(end)}`
    : `${QUARTER_FMT.format(start)} – ${QUARTER_FMT.format(end)}`;
}

/** Where an entry sits relative to the clock. A month-only entry uses its month. */
function eventState(e: CalendarEvent, now: Date): { kind: "past" | "now" | "ahead"; days: number } {
  const start = isoDate(e.start);
  const last = e.monthOnly
    ? new Date(start.getFullYear(), start.getMonth() + 1, 0)
    : isoDate(e.end ?? e.start);
  const endOfLast = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  if (now >= endOfLast) return { kind: "past", days: 0 };
  if (now >= start) return { kind: "now", days: 0 };
  return { kind: "ahead", days: Math.ceil((start.getTime() - now.getTime()) / 86400000) };
}

/** "past", "under way", or how long until it starts. */
function statusLabel(st: { kind: "past" | "now" | "ahead"; days: number }): string {
  if (st.kind === "past") return "past";
  if (st.kind === "now") return "under way";
  return st.days === 1 ? "tomorrow" : `in ${st.days} days`;
}

const THEME_FILTERS = ["All", "Political", "Economic", "Social"] as const;
const SCOPE_FILTERS = ["All", "National", "International"] as const;

/** The row dates stay monospaced: they sit in a list, and they do not tick. */
const ROW_FIGURES: React.CSSProperties = {
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "0.035em",
};

/* The reader's chosen country or state, kept beside the pins in
   localStorage so a guest session keeps it and an account on the same
   device inherits it - the same device-local approach ProfileContext and
   PinnedStrip already take. Locking one in also pins it, so the rest of the
   site (the pinned strip) reflects the choice rather than holding a second,
   private idea of what the reader follows. */
const LS_FOCUS = "cs_focus";
const LS_PINNED_COUNTRIES = "cs_pinned_countries";
const LS_PINNED_STATES = "cs_pinned_states";

type Focus = { kind: "country" | "state"; id: string };

function readFocus(): Focus | null {
  try {
    const raw = localStorage.getItem(LS_FOCUS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id && (parsed.kind === "country" || parsed.kind === "state")
      ? (parsed as Focus)
      : null;
  } catch {
    return null;
  }
}

function pinAlso(key: string, id: string) {
  try {
    const stored = localStorage.getItem(key);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    if (!ids.includes(id)) localStorage.setItem(key, JSON.stringify([...ids, id]));
  } catch {
    /* A browser with storage blocked still gets the carousel; it just
       cannot remember the choice. */
  }
}

/**
 * One card at a time: page through countries or US states and lock one in as
 * the place you follow.
 *
 * Kept to a single card rather than a row because the point is to choose,
 * not to browse - a row invites scanning, one card invites a decision. The
 * choice is stored on the device, so it survives a guest session and is
 * there when an account is made on the same browser.
 */
function FocusCarousel({
  mutedText,
  headText,
  isLight,
  onOpen,
}: {
  mutedText: string;
  headText: string;
  isLight: boolean;
  onOpen: (path: string) => void;
}) {
  const fmtPeople = (n: number) =>
    n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString();
  const saved = readFocus();
  const [kind, setKind] = useState<"country" | "state">(saved?.kind ?? "country");
  /* The card tracks WHICH place is showing, not its position in the list.
     Other pages sort the shared countriesData/usStatesData arrays for their
     own use, so a stored index quietly comes to point at a different place;
     an id does not. It also opens on the reader's own choice rather than at
     the top of the alphabet. */
  const [curId, setCurId] = useState<string | null>(saved?.id ?? null);
  const [focus, setFocus] = useState<Focus | null>(saved);

  /* Alphabetical, so paging through has an order the reader can predict. */
  const countries = useMemo(
    () => [...countriesData].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const states = useMemo(
    () => [...usStatesData].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const list = kind === "country" ? countries : states;
  const at = Math.max(0, list.findIndex((x) => x.id === curId));
  const item = list[at];
  const isLocked = focus?.kind === kind && focus.id === item.id;

  const step = (d: number) => {
    const n = (((at + d) % list.length) + list.length) % list.length;
    setCurId(list[n].id);
  };
  const switchKind = (k: "country" | "state") => {
    setKind(k);
    setCurId(focus?.kind === k ? focus.id : null);
  };

  const lockIn = () => {
    const next: Focus = { kind, id: item.id };
    setFocus(next);
    try {
      localStorage.setItem(LS_FOCUS, JSON.stringify(next));
    } catch {
      /* ignored: see pinAlso */
    }
    pinAlso(kind === "country" ? LS_PINNED_COUNTRIES : LS_PINNED_STATES, item.id);
  };

  const openItem = () =>
    onOpen(
      kind === "country"
        ? `/dashboard/countries?open=${item.id}`
        : `/dashboard/states?open=${item.id}`,
    );

  const line = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)";
  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-sans transition-colors cursor-pointer ${
      on ? "chip-selected" : "hover:opacity-80"
    }`;

  const fmtGDPShort = (b: number) =>
    b >= 1000 ? `$${(b / 1000).toFixed(1)}T` : `$${Math.round(b)}B`;
  const hdiColor = (h: number) =>
    !has(h) ? "#9ca3af" : h >= 0.8 ? "#10b981" : h >= 0.65 ? "#f59e0b" : "#ef4444";

  /* One card in the deck. The centre one is the choice; the two beside it
     are the neighbours in the list, drawn smaller and behind so the deck
     reads as a strip you can page through rather than three equal options. */
  const Card = ({ entry, role }: { entry: typeof item; role: "prev" | "cur" | "next" }) => {
    const isCountry = kind === "country";
    const c = entry as (typeof countries)[number];
    const st = entry as (typeof states)[number];
    const growth = isCountry ? c.gdpGrowth : undefined;
    const rows: [string, string, string?][] = isCountry
      ? [
          ["GDP", na(c.gdp, fmtGDPShort)],
          [
            "Growth",
            `${has(growth) && growth > 0 ? "+" : ""}${na(growth, (v) => `${v}%`)}`,
            has(growth) && growth >= 0 ? "#10b981" : "#ef4444",
          ],
          ["Population", fmtPeople(c.population)],
        ]
      : [
          ["GDP", fmtGDPShort(st.gdp)],
          ["Capital", st.capital],
          ["Population", fmtPeople(st.population)],
        ];

    return (
      <div
        className="rounded-xl overflow-hidden w-[210px] shrink-0"
        style={{
          background: isLight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${line}`,
          boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
        }}
      >
        {/* Banner: the flag for a country, the abbreviation for a state. */}
        <div className="relative h-20 overflow-hidden" style={{ background: isLight ? "#f3f4f6" : "#1a1a1f" }}>
          {isCountry ? (
            <img
              src={`https://flagcdn.com/w320/${c.code.toLowerCase()}.png`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-3xl font-bold font-mono"
              style={{ color: isLight ? "#0f172a" : "#e5e7eb" }}
            >
              {st.abbreviation}
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)" }}
          />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <span className="text-white text-xs font-bold font-sans leading-tight drop-shadow truncate">
              {entry.name}
            </span>
            {isCountry && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                style={{
                  background: hdiColor(c.humanDevelopmentIndex) + "33",
                  color: hdiColor(c.humanDevelopmentIndex),
                  border: `1px solid ${hdiColor(c.humanDevelopmentIndex)}44`,
                }}
              >
                HDI {na(c.humanDevelopmentIndex, (v) => String(v))}
              </span>
            )}
          </div>
        </div>

        <div className="px-3 py-2.5 flex flex-col gap-1.5">
          {rows.map(([label, value, colour]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-sans" style={{ color: mutedText }}>
                {label}
              </span>
              <span
                className="text-[11px] font-bold font-mono truncate"
                style={{ color: colour ?? headText }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {role === "cur" && (
          <button
            type="button"
            onClick={lockIn}
            disabled={isLocked}
            className={`w-full py-1.5 text-[11px] font-semibold font-sans ${
              isLocked ? "cursor-default" : "chip-selected cursor-pointer"
            }`}
            style={
              isLocked
                ? { borderTop: `1px solid ${line}`, color: mutedText }
                : { borderRadius: 0 }
            }
          >
            {isLocked ? "Following — you're set" : "Follow this one"}
          </button>
        )}
      </div>
    );
  };

  const prev = list[(((at - 1) % list.length) + list.length) % list.length];
  const next = list[(at + 1) % list.length];

  return (
    <div className="shrink-0 self-center w-full lg:w-[400px]">
      <div className="flex items-center gap-1.5 mb-2 justify-center">
        {(["country", "state"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => switchKind(k)}
            className={chip(kind === k)}
            style={kind === k ? undefined : { border: `1px solid ${line}`, color: mutedText }}
          >
            {k === "country" ? "Countries" : "US states"}
          </button>
        ))}
      </div>

      {/* The deck: neighbours sit behind the centre card and half under it,
          so paging feels like moving along a strip. They are buttons, so a
          click on either side steps the deck that way. */}
      <div className="relative h-[190px] flex items-center justify-center">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={kind === "country" ? "Previous country" : "Previous state"}
          className="absolute left-0 top-1/2 -translate-y-1/2 origin-center cursor-pointer"
          style={{ transform: "translate(-18%, -50%) scale(0.82)", opacity: 0.45, zIndex: 0 }}
        >
          <Card entry={prev} role="prev" />
        </button>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label={kind === "country" ? "Next country" : "Next state"}
          className="absolute right-0 top-1/2 -translate-y-1/2 origin-center cursor-pointer"
          style={{ transform: "translate(18%, -50%) scale(0.82)", opacity: 0.45, zIndex: 0 }}
        >
          <Card entry={next} role="next" />
        </button>

        <div
          className="relative cursor-pointer"
          style={{ zIndex: 1 }}
          onClick={(e) => {
            /* The Follow button lives inside the card and stops here. */
            if ((e.target as HTMLElement).closest("button")) return;
            openItem();
          }}
        >
          <Card entry={item} role="cur" />
        </div>
      </div>

      <p className="text-[10px] font-sans mt-2 text-center" style={{ color: mutedText }}>
        {focus
          ? "Saved on this device — it carries over when you make an account."
          : "Pick the place you care about and it stays on your dashboard."}
      </p>
    </div>
  );
}

function QuarterTracker({
  isLight,
  cardBg,
  cardBorder,
  headText,
  mutedText,
  gridLine,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  headText: string;
  mutedText: string;
  gridLine: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const calendar = calendarQuarters(now);
  const fiscal = fiscalQuarters(now);
  const current = calendar.find((q) => now >= q.start && now < q.end)!;
  const currentFiscal = fiscal.quarters.find((q) => now >= q.start && now < q.end)!;

  // The quarter whose diary is on show; the current one until the reader picks
  // another. Kept in state, so the once-a-second clock tick does not reset it.
  const [selected, setSelected] = useState(current.index);
  const [themeFilter, setThemeFilter] = useState<(typeof THEME_FILTERS)[number]>("All");
  const [scopeFilter, setScopeFilter] = useState<(typeof SCOPE_FILTERS)[number]>("All");
  // One entry open at a time: the detail is a few lines, and an accordion
  // keeps the quarter readable as a list of dates.
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  // Hover is state, not a :hover class: the row's background is an inline
  // style keyed to the quarter's colour, and a Tailwind hover variant cannot
  // override an inline background.
  const [hoverEvent, setHoverEvent] = useState<string | null>(null);
  // The diary as a whole folds away, and starts folded: the tracker leads
  // with the countdown, and the header still says how many entries the
  // quarter holds. It opens on its own if a quarter is picked, since picking
  // one is a request to see it.
  const [diaryOpen, setDiaryOpen] = useState(false);

  const season = SEASONS[selected];
  const accent = season.accent;
  const ink = isLight ? season.inkLight : season.inkDark;
  const tint = (a: string) => a + (isLight ? "1f" : "33");

  const span = current.end.getTime() - current.start.getTime();
  const elapsed = now.getTime() - current.start.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / span) * 100));

  // Countdown to the first instant of the next quarter.
  const left = current.end.getTime() - now.getTime();
  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const state = (q: QuarterInfo) =>
    now >= q.end ? "done" : now >= q.start ? "current" : "ahead";

  // Entries in the chosen quarter, in date order, after the two filters.
  const byQuarter = useMemo(() => {
    const out: CalendarEvent[][] = [[], [], [], []];
    for (const e of CALENDAR_2026) out[eventQuarter(e)].push(e);
    for (const list of out) list.sort((a, b) => a.start.localeCompare(b.start));
    return out;
  }, []);
  const shown = byQuarter[selected].filter(
    (e) =>
      (themeFilter === "All" || e.theme === themeFilter) &&
      (scopeFilter === "All" || e.scope === scopeFilter),
  );

  /**
   * A quarter button. Three things have to read at a glance and they are
   * carried by three different signals, so none of them has to fight the
   * seasonal colour: the season is the fill, selection is the ring, and where
   * the year actually is ("now", "done", "ahead") is the word on the right.
   */
  const chipStyle = (i: number): React.CSSProperties => {
    const s = state(calendar[i]);
    const c = SEASONS[i].accent;
    const isSel = i === selected;
    return {
      background: s === "ahead" && !isSel ? "transparent" : tint(c),
      border: `1px ${s === "ahead" && !isSel ? "dashed" : "solid"} ${isSel ? c : s === "current" ? c : gridLine}`,
      color: s === "ahead" && !isSel ? mutedText : isLight ? SEASONS[i].inkLight : SEASONS[i].inkDark,
      // A ring is the obvious signal for "this is the one you are reading",
      // but every rounded clickable element on the site already carries an
      // !important box-shadow (index.css), so an inline one never lands. An
      // outline is not in that fight.
      outline: isSel ? `2px solid ${c}` : "none",
      outlineOffset: "1px",
      opacity: s === "done" && !isSel ? 0.75 : 1,
    };
  };

  // An unselected filter is still a control, so it keeps the body's text
  // colour rather than the muted one used for captions — at 10px the muted
  // grey is too faint to read on the dark theme.
  const filterStyle = (on: boolean): React.CSSProperties =>
    on
      ? { background: tint(accent), border: `1px solid ${accent}`, color: ink }
      : { background: "transparent", border: `1px solid ${gridLine}`, color: headText };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: cardBorder }}>
      <div
        className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-sans" style={{ color: headText }}>
            Quarter Tracker
          </span>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: tint(SEASONS[current.index].accent), color: isLight ? SEASONS[current.index].inkLight : SEASONS[current.index].inkDark }}
          >
            {current.label} {current.start.getFullYear()}
          </span>
        </div>
        <p className="text-[10px] font-sans" style={{ color: mutedText }}>
          Calendar quarter {current.label}, {range(current)} · US federal fiscal year {fiscal.fy}, {currentFiscal.label}
        </p>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Countdown to the next quarter */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-sans uppercase tracking-widest mb-1" style={{ color: mutedText }}>
              {current.label} ends in
            </p>
            <p className="text-[32px] leading-none" style={{ ...COUNTER_FIGURES, color: headText }}>
              <Figures value={String(days)} />
              <span style={COUNTER_UNIT}>d</span>{" "}
              <Figures value={`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-sans uppercase tracking-widest mb-1" style={{ color: mutedText }}>
              Elapsed
            </p>
            <p className="text-[32px] leading-none" style={{ ...COUNTER_FIGURES, color: headText }}>
              <Figures value={pct.toFixed(1)} />
              <span style={COUNTER_UNIT}>%</span>
            </p>
          </div>
          <p className="text-[10px] font-sans" style={{ color: mutedText }}>
            {current.label} runs to {QUARTER_FMT.format(new Date(current.end.getTime() - 1))}; Q
            {((current.index + 1) % 4) + 1} begins {QUARTER_FMT.format(current.end)}
          </p>
        </div>

        {/* Progress through the current quarter.
            A gradient, like the hero above it, and one that means something:
            it runs from this season's colour into the next one, so the bar
            hands over to the quarter it is counting down to as it fills. */}
        <div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${SEASONS[current.index].bright} 0%, ${
                  SEASONS[(current.index + 1) % 4].bright
                } 100%)`,
                boxShadow: `0 0 10px ${SEASONS[(current.index + 1) % 4].bright}55`,
              }}
            />
          </div>
        </div>

        {/* The four quarters of this calendar year, each one selectable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {calendar.map((q) => {
            const s = state(q);
            const count = byQuarter[q.index].length;
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  setSelected(q.index);
                  setDiaryOpen(true);
                }}
                aria-pressed={q.index === selected}
                className="rounded-xl px-3 py-2 text-left transition-all cursor-pointer"
                style={chipStyle(q.index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold font-mono">
                    {q.label} <span className="font-sans font-normal opacity-70">{SEASONS[q.index].name}</span>
                  </span>
                  <span className="text-[9px] font-sans uppercase tracking-wider">
                    {s === "current" ? "now" : s === "done" ? "done" : "ahead"}
                  </span>
                </div>
                <p className="text-[10px] font-sans mt-0.5">{range(q)}</p>
                <p className="text-[10px] font-sans opacity-80">
                  {count} {count === 1 ? "entry" : "entries"}
                </p>
              </button>
            );
          })}
        </div>

        {/* The chosen quarter's diary. The whole section folds away from its
            own header, so the tracker can go back to being a countdown. */}
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${gridLine}` }}>
          <button
            type="button"
            onClick={() => setDiaryOpen((v) => !v)}
            aria-expanded={diaryOpen}
            className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2 cursor-pointer"
            style={{
              borderBottom: diaryOpen ? `1px solid ${gridLine}` : "none",
            }}
          >
            <span className="text-sm font-bold font-sans" style={{ color: headText }}>
              Q{selected + 1} {CALENDAR_YEAR} · scheduled conferences and events
            </span>
            <span className="text-[11px] font-sans" style={{ color: mutedText }}>
              {diaryOpen
                ? `${shown.length} of ${byQuarter[selected].length} shown`
                : `${byQuarter[selected].length} entries`}
            </span>
            <span
              className="text-[10px] font-sans uppercase tracking-wider ml-auto"
              style={{ color: mutedText }}
            >
              {diaryOpen ? "Hide" : "Show"}
            </span>
          </button>

          {diaryOpen && (
          <>
          <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-sans uppercase tracking-widest mr-0.5" style={{ color: mutedText }}>
                Theme
              </span>
              {THEME_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setThemeFilter(t)}
                  aria-pressed={themeFilter === t}
                  className="text-[11px] font-sans px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  style={filterStyle(themeFilter === t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-sans uppercase tracking-widest mr-0.5" style={{ color: mutedText }}>
                Scope
              </span>
              {SCOPE_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setScopeFilter(t)}
                  aria-pressed={scopeFilter === t}
                  className="text-[11px] font-sans px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  style={filterStyle(scopeFilter === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-col gap-2">
            {shown.map((e) => {
              const st = eventState(e, now);
              const isOpen = openEvent === e.id;
              const hovered = hoverEvent === e.id;
              // The same hover the dashboard's expandable rows use: the row
              // warms toward the quarter's colour rather than fading, and
              // takes a bar in that colour down its leading edge, which is
              // what carries the state where the tint is hard to see. A past
              // row also comes back to full strength under the cursor, so it
              // does not read as disabled.
              const rowBg = isOpen
                ? accent + (isLight ? (hovered ? "29" : "1f") : hovered ? "3d" : "33")
                : hovered
                  ? accent + (isLight ? "17" : "29")
                  : st.kind === "now"
                    ? tint(accent)
                    : "transparent";
              return (
                <div
                  key={e.id}
                  onMouseEnter={() => setHoverEvent(e.id)}
                  onMouseLeave={() => setHoverEvent(null)}
                  className="rounded-lg overflow-hidden transition-all duration-150"
                  style={{
                    border: `1px solid ${isOpen || hovered ? accent : gridLine}`,
                    background: rowBg,
                    opacity: st.kind === "past" && !isOpen && !hovered ? 0.62 : 1,
                  }}
                >
                  {/* Collapsed, a row is the date, where it sits in the year,
                      and what it is called. The rest waits for a click, so
                      eleven entries stay a list rather than a wall. */}
                  <button
                    type="button"
                    onClick={() => setOpenEvent(isOpen ? null : e.id)}
                    onFocus={() => setHoverEvent(e.id)}
                    onBlur={() => setHoverEvent(null)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 cursor-pointer transition-all duration-150"
                    style={{
                      boxShadow: hovered || isOpen ? `inset 3px 0 0 0 ${accent}` : "none",
                    }}
                  >
                    <span className="sm:w-28 shrink-0 block">
                      <span
                        className="text-xs font-mono block"
                        style={{ ...ROW_FIGURES, color: headText }}
                      >
                        {eventDateLabel(e)}
                      </span>
                      <span
                        className="text-[10px] font-sans uppercase tracking-wider block"
                        style={{ color: mutedText }}
                      >
                        {statusLabel(st)}
                      </span>
                    </span>
                    <span
                      className="text-[13px] font-semibold font-sans min-w-0 flex-1"
                      style={{ color: headText }}
                    >
                      {e.name}
                    </span>
                    <span
                      className="text-[10px] font-sans uppercase tracking-wider shrink-0"
                      style={{ color: mutedText }}
                    >
                      {isOpen ? "Close" : "Details"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 sm:pl-[7.75rem]">
                      <p className="text-[11px] font-sans" style={{ color: mutedText }}>
                        {e.org} · {e.city}
                        {e.city !== e.country && `, ${e.country}`}
                      </p>
                      <p className="text-[11px] font-sans mt-1" style={{ color: mutedText }}>
                        {e.what}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span
                          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                          style={{ border: `1px solid ${gridLine}`, color: mutedText }}
                        >
                          {e.scope}
                        </span>
                        <span
                          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                          style={{ background: tint(accent), color: ink }}
                        >
                          {e.theme}
                        </span>
                        {e.monthOnly && (
                          <span
                            className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                            style={{ border: `1px dashed ${gridLine}`, color: mutedText }}
                          >
                            days to be confirmed
                          </span>
                        )}
                      </div>
                      <SourceLink sources={[e.source]} />
                    </div>
                  )}
                </div>
              );
            })}
            {shown.length === 0 && (
              <p className="text-xs font-sans" style={{ color: mutedText }}>
                Nothing in Q{selected + 1} matches those filters.
              </p>
            )}
            <p className="text-[10px] font-sans mt-1" style={{ color: mutedText }}>
              Each entry is taken from the convening body's own page and was checked on {CALENDAR_CHECKED}.
              Scheduled dates can move; the source link is the place to confirm one.
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight
    ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)"
    : "var(--card-glow)";
  const mutedText = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.38)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const liveCountries = useLiveCountries();
  const topCountries = useMemo(
    () => [...liveCountries].sort((a, b) => sortKey(b.gdp, "desc") - sortKey(a.gdp, "desc")).slice(0, 6),
    [liveCountries],
  );
  const topStates = useMemo(
    () => [...usStatesData].sort((a, b) => b.gdp - a.gdp).slice(0, 6),
    [],
  );

  return (
    <div
      className="min-h-screen w-full animate-fade-in"
      style={{ background: "var(--color-background)", color: bodyText }}
    >
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl relative overflow-hidden"
          /* Black and white in both themes: the flags are the only colour
             here, and a tinted card was competing with them. */
          style={{
            background: isLight ? "#ffffff" : "#0b0b0d",
            border: isLight
              ? "1px solid rgba(0,0,0,0.12)"
              : "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* dot-grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(circle, ${isLight ? "#000000" : "#ffffff"} 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Text row. The flags sit beside it on a wide screen and wrap
              under it on a narrow one. */}
          <div className="relative px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
            <div>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: mutedText }}
            >
              CommonSphere · Global Intelligence
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold font-sans"
              style={{ color: headText }}
            >
              Welcome to CommonSphere
            </h1>
            <p
              className="text-sm font-sans mt-1.5 max-w-xl"
              style={{ color: mutedText }}
            >
              A free atlas of how the world is doing — countries, economies,
              climate and conflict, side by side. Start anywhere below.
            </p>

            {/* What is actually in here, counted from the data rather than
                claimed, so the welcome cannot drift from the site. */}
            <p
              className="text-[11px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              {countriesData.length} countries · {usStatesData.length} US states ·{" "}
              {economiesData.length} economies · every figure carries its source
              and the year it refers to
            </p>

            </div>

            {/* A face for the catalogue: flags from every inhabited
                continent, circling the site's own globe, so the welcome shows
                the community it covers rather than only naming a count.
                Images from flagcdn, which the rest of the site already uses -
                the regional-indicator emoji render as bare letters on
                Windows. The ring turns once a minute and each flag turns back
                the other way at the same rate, so they orbit without ever
                tipping over; it holds still for a reader who has asked for
                reduced motion. */}
            <FocusCarousel mutedText={mutedText} headText={headText} isLight={isLight} onOpen={(p) => navigate(p)} />
          </div>
        </div>

        {/* ── QUARTER TRACKER ────────────────────────────────────────────── */}
        <QuarterTracker
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          headText={headText}
          mutedText={mutedText}
          gridLine={gridLine}
        />

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
                    Event Log
                  </h2>
                </div>
                {/* Was "Live Feed" with a pulsing Live badge over entries dated
                    Jul 2025. The badge now reports the newest entry, so the
                    section cannot claim to be live when it is not. */}
                <span
                  className="text-[9px] font-mono px-2 py-1 rounded-full"
                  style={{ background: "#94a3b815", color: "#94a3b8" }}
                  title="These entries are curated, not fetched live"
                >
                  To {feedLatestLabel(RECENT_EVENTS)}
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
                Domestic Highlights · to {feedLatestLabel(NATIONAL_HIGHLIGHTS)}
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
                      name === "world" ? "World" : "Advanced",
                    ]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Line
                    type="monotone"
                    dataKey="world"
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
                  { label: "World", color: "#f59e0b" },
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
            © {new Date().getFullYear()} CommonSphere · Dashboard · Data updated
            Q2 2025
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
