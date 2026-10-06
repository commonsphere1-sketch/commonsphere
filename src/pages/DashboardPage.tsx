import { readPins, writePins } from "../lib/pins";
import { na, has, sortKey } from "../lib/na";
import { usdFromBillions } from "../lib/money";
import React, { lazy, Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { HeadlinesBanner, ALL_TOPICS } from "../components/HeadlinesBanner";
import {
  Globe,
  MapTrifold,
  Crosshair,
  ArrowRight,
  TrendUp,
  MagnifyingGlass,
  X,
  CheckCircle,
  ChartDonut,
} from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { useLiveCountries } from "../contexts/LiveDataContext";
import { usStatesData } from "../data/statesData";
import { STATE_INDICATORS as STATE_FIGURES } from "../data/stateIndicators";
import { economiesData } from "../data/economiesData";
import { SourceLink } from "../components/SourceLink";
import { DataExplorer } from "../components/DataExplorer";
import { DataLog } from "../components/DataLog";
import { CommodityMovers } from "../components/CommodityMovers";
import { ConflictFigures } from "../components/ConflictFigures";

/** The Trends & Projections desk, with the projections it draws on: loaded after the page. */
const ProjectionsDesk = lazy(() => import("../components/ProjectionsDesk"));
import { WORLD } from "../data/worldview";
import { Figures, COUNTER_FIGURES, COUNTER_UNIT } from "../components/Figures";
import {
  CALENDAR_2026,
  CALENDAR_CHECKED,
  CALENDAR_YEAR,
  eventQuarter,
  type CalendarEvent,
} from "../data/calendar2026";

const SRC_DASH_STATES = [
  {
    label: "Bureau of Economic Analysis",
    url: "https://www.bea.gov/data/gdp/gdp-state",
  },
  { label: "Bureau of Labor Statistics", url: "https://www.bls.gov/data/" },
];
/**
 * Slides a doubled track leftwards for ever, wrapping at its halfway point.
 *
 * It runs on elapsed time, so it moves at the same speed on any screen - it
 * used to move a fixed distance each frame, and so ran twice as fast at
 * 120 Hz - and it steps in whole device pixels, so the cards' text and flags
 * do not shimmer between pixels. It rests while paused, off screen or in a
 * hidden tab. For readers who ask for reduced motion it does not move at
 * all, and the strip scrolls by hand instead.
 */
function useMarquee(
  trackRef: React.RefObject<HTMLDivElement | null>,
  pausedRef: React.MutableRefObject<boolean>,
  pxPerSecond: number,
) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (track.parentElement) track.parentElement.style.overflowX = "auto";
      return;
    }
    let raf = 0;
    let last = 0;
    let pos = 0;
    let onScreen = true;
    let half = track.scrollWidth / 2;
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
    });
    io.observe(track);
    const ro = new ResizeObserver(() => {
      half = track.scrollWidth / 2;
    });
    ro.observe(track);
    const step = (now: number) => {
      // A long gap - a hidden tab, a stalled frame - is not made up in one jump.
      const dt = last ? Math.min(100, now - last) : 0;
      last = now;
      if (!pausedRef.current && onScreen && !document.hidden && half > 0) {
        pos = (pos + (pxPerSecond * dt) / 1000) % half;
        const dpr = window.devicePixelRatio || 1;
        track.style.transform = `translate3d(${-Math.round(pos * dpr) / dpr}px,0,0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [trackRef, pausedRef, pxPerSecond]);
}

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
  const pausedRef = useRef(false);
  const [cardWidth, setCardWidth] = useState(0);
  const GAP = 12; // gap-3 = 12px
  const VISIBLE = 5;
  useMarquee(trackRef, pausedRef, 54);

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
    b >= 1000 ? `${(b / 1000).toFixed(1)}T` : b >= 1 ? `${Math.round(b)}B` : `${Math.round(b * 1000)}M`;

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
  const pausedRef = useRef(false);
  const [cardWidth, setCardWidth] = useState(0);
  const GAP = 12;
  const VISIBLE = 5;
  useMarquee(trackRef, pausedRef, 42);

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
    b >= 1000 ? `${(b / 1000).toFixed(1)}T` : b >= 1 ? `${Math.round(b)}B` : `${Math.round(b * 1000)}M`;

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
  n >= 1000 ? `${(n / 1000).toFixed(1)}T` : n >= 1 ? `${n.toFixed(0)}B` : `${Math.round(n * 1000)}M`;

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
        ? usdFromBillions(c.tradeBalance, true)
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

/* Through the pins module, so a signed-in reader's account gets the pin
   too. A browser with storage blocked still gets the carousel; it just
   cannot remember the choice. */
function pinAlso(type: "country" | "state", id: string) {
  const ids = readPins(type) ?? [];
  if (!ids.includes(id)) writePins(type, [...ids, id]);
}

/**
 * One card at a time: page through countries or US states and lock one in as
 * the place you follow.
 *
 * Kept to a single card rather than a row because the point is to choose,
 * not to browse. It turns over by itself until a choice is made - a still
 * card of Afghanistan reads as a list that failed to load - and stops for
 * good once something is locked in, or for as long as the reader is
 * hovering, typing or tabbed into it. The choice is stored on the device, so
 * it survives a guest session and is there when an account is made in the
 * same browser.
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
     an id does not. */
  const [curId, setCurId] = useState<string | null>(saved?.id ?? null);
  const [focus, setFocus] = useState<Focus | null>(saved);
  const [paused, setPaused] = useState(false);
  const swipe = useRef(0);
  const touchX = useRef<number | null>(null);
  const [query, setQuery] = useState("");

  /* Alphabetical, so paging through has an order the reader can predict. */
  const countries = useMemo(
    // Places with no permanent population have nothing to follow.
    () =>
      countriesData
        .filter((c) => !c.uninhabited)
        .sort((a, b) => a.name.localeCompare(b.name)),
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
    setQuery("");
  };

  /* Turns over on its own until something is locked in. Reads the live list
     through a ref-free functional update so the interval never closes over a
     stale index. */
  useEffect(() => {
    if (focus || paused) return;
    const t = setInterval(() => {
      setCurId((id) => {
        const pos = Math.max(0, list.findIndex((x) => x.id === id));
        return list[(pos + 1) % list.length].id;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [focus, paused, list]);

  const lockIn = () => {
    const next: Focus = { kind, id: item.id };
    setFocus(next);
    try {
      localStorage.setItem(LS_FOCUS, JSON.stringify(next));
    } catch {
      /* ignored: see pinAlso */
    }
    pinAlso(kind, item.id);
  };

  const unlock = () => {
    setFocus(null);
    try {
      localStorage.removeItem(LS_FOCUS);
    } catch {
      /* ignored */
    }
  };

  const openItem = () =>
    onOpen(
      kind === "country"
        ? `/dashboard/countries?open=${item.id}`
        : `/dashboard/states?open=${item.id}`,
    );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = list.filter((x) => x.name.toLowerCase().startsWith(q));
    const rest = list.filter(
      (x) => !x.name.toLowerCase().startsWith(q) && x.name.toLowerCase().includes(q),
    );
    return [...starts, ...rest].slice(0, 6);
  }, [query, list]);

  const line = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)";
  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-sans transition-colors cursor-pointer ${
      on ? "chip-selected" : "hover:opacity-80"
    }`;

  const fmtGDPShort = (b: number) =>
    b >= 1000 ? `${(b / 1000).toFixed(1)}T` : b >= 1 ? `${Math.round(b)}B` : `${Math.round(b * 1000)}M`;
  const hdiColor = (h: number) =>
    !has(h) ? "#9ca3af" : h >= 0.8 ? "#10b981" : h >= 0.65 ? "#f59e0b" : "#ef4444";

  /* One card in the deck. The centre one is the choice; the two beside it
     are the neighbours in the list, drawn smaller and behind so the deck
     reads as a strip you can page through rather than three equal options. */
  /* The card's body and its Follow button are siblings, not one inside the
     other: a button inside a button is invalid, and a click on Follow also
     reached the card's own handler and opened the place. */
  /* A plain function, called for its markup - not a component. Defined in
     here as a component it was a new type on every render, so React threw
     away all five cards and built them again each time the deck turned or
     the pointer came or went, and their flags flashed as they reloaded. */
  const renderCard = ({
    entry,
    role,
    onActivate,
    label,
    tabIndex,
  }: {
    entry: typeof item;
    role: "prev" | "cur" | "next";
    onActivate: () => void;
    label: string;
    tabIndex: number;
  }) => {
    const isCountry = kind === "country";
    const c = entry as (typeof countries)[number];
    const st = entry as (typeof states)[number];
    const growth = isCountry ? c.gdpGrowth : undefined;
    /* Three rows from the figures the place has: GDP, growth and population
       where published, then life expectancy, GDP per capita, area or
       currency in place of any that are not, so a territory's card is not
       a column of dashes. Growth to two places: it read +0.7524%. */
    const rows: [string, string, string?][] = [];
    const add = (ok: boolean, label: string, value: () => string, colour?: string) => {
      if (ok && rows.length < 3) rows.push([label, value(), colour]);
    };
    if (isCountry) {
      add(has(c.gdp), "GDP", () => fmtGDPShort(c.gdp));
      add(has(growth), "Growth", () => `${growth! > 0 ? "+" : ""}${Number(growth!.toFixed(2))}%`, growth! >= 0 ? "#10b981" : "#ef4444");
      add(has(c.population), "Population", () => fmtPeople(c.population));
      add(has(c.lifeExpectancy), "Life expect.", () => `${c.lifeExpectancy} yrs`);
      add(has(c.gdpPerCapita), "Per capita", () => `${Math.round(c.gdpPerCapita).toLocaleString()}`);
      add(has(c.areaKm2), "Area", () => `${Math.round(c.areaKm2).toLocaleString()} km²`);
      add(!!c.currency && c.currency !== "None", "Currency", () => c.currency);
    } else {
      add(has(st.gdp), "GDP", () => fmtGDPShort(st.gdp));
      add(!!st.capital, "Capital", () => st.capital);
      add(has(st.population), "Population", () => fmtPeople(st.population));
      add(has(st.medianIncome), "Median income", () => `${Math.round(st.medianIncome).toLocaleString()}`);
    }

    return (
      <div
        className="rounded-xl overflow-hidden w-[210px] shrink-0"
        style={{
          background: isLight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${line}`,
          boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
        }}
      >
        <button
          type="button"
          onClick={onActivate}
          aria-label={label}
          tabIndex={tabIndex}
          className="block w-full text-left cursor-pointer"
        >
        {/* Banner: the flag, for a state as for a country. flagcdn serves the
            state flags as us-<code> (all fifty checked; see RankingsPage). A
            state's abbreviation sits underneath and shows only if its image
            fails to load. */}
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
            <>
              <div
                className="absolute inset-0 flex items-center justify-center text-3xl font-bold font-mono"
                style={{ color: isLight ? "#0f172a" : "#e5e7eb" }}
              >
                {st.abbreviation}
              </div>
              <img
                src={`https://flagcdn.com/w320/us-${st.id}.png`}
                alt=""
                className="relative w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)" }}
          />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <span className="text-white text-xs font-bold font-sans leading-tight drop-shadow truncate">
              {entry.name}
            </span>
            {isCountry && has(c.humanDevelopmentIndex) && (
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
        </button>

        {role === "cur" && (
          <button
            type="button"
            onClick={isLocked ? unlock : lockIn}
            className={`w-full py-1.5 text-[11px] font-semibold font-sans cursor-pointer ${
              isLocked ? "" : "chip-selected"
            }`}
            style={isLocked ? { borderTop: `1px solid ${line}`, color: mutedText } : { borderRadius: 0 }}
          >
            {isLocked ? "Following — tap to change" : "Follow this one"}
          </button>
        )}
      </div>
    );
  };


  return (
    <div
      className="shrink-0 self-center w-full lg:w-[400px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
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

        {/* Search sits with the tabs rather than under the deck: it is the
            other way of choosing, so the two belong on the same line. */}
        <div className="relative">
          <div
            className="flex items-center gap-1 pl-2 pr-1 rounded-full"
            style={{ border: `1px solid ${line}` }}
          >
            <MagnifyingGlass size={11} style={{ color: mutedText }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) {
                  setCurId(matches[0].id);
                  setQuery("");
                }
              }}
              placeholder="Search"
              aria-label={kind === "country" ? "Search countries" : "Search states"}
              className="w-20 focus:w-28 transition-[width] bg-transparent py-1 text-[11px] font-sans focus:outline-none"
              style={{ color: headText }}
            />
          </div>
          {matches.length > 0 && (
            <ul
              className="absolute z-20 left-0 mt-1 w-40 rounded-lg overflow-hidden py-1"
              style={{
                background: isLight ? "#fff" : "#15151a",
                border: `1px solid ${line}`,
                boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
              }}
            >
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurId(m.id);
                      setQuery("");
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-sans hover:opacity-80 cursor-pointer"
                    style={{ color: headText }}
                  >
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* The deck.

          Five cards are on stage at once - the choice, its two neighbours,
          and one more each side waiting in the wings - each keyed by id and
          placed by how far it is from the centre. Because the key follows
          the place rather than the slot, changing the choice hands each card
          a new offset and CSS slides it there, instead of the contents
          swapping under a card that never moves.

          It takes a trackpad swipe, a touch drag and the arrow keys, since
          the two side cards alone are a small target for something meant to
          be paged through. */}
      <div
        className="relative h-[190px] flex items-center justify-center outline-none overflow-hidden touch-pan-y"
        tabIndex={0}
        role="group"
        aria-label={kind === "country" ? "Choose a country to follow" : "Choose a state to follow"}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            lockIn();
          }
        }}
        onWheel={(e) => {
          /* Trackpads report a sideways flick as deltaX. Only a clearly
             horizontal gesture is taken, so an ordinary downward scroll
             still scrolls the page rather than flicking through countries.
             The accumulator makes one card per gesture, not one per event. */
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
          swipe.current += e.deltaX;
          if (Math.abs(swipe.current) < 60) return;
          step(swipe.current > 0 ? 1 : -1);
          swipe.current = 0;
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
      >
        {[-2, -1, 0, 1, 2].map((o) => {
          const entry = list[(((at + o) % list.length) + list.length) % list.length];
          const away = Math.abs(o);
          return (
            <div
              key={entry.id}
              aria-hidden={away === 2}
              className="absolute transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none"
              style={{
                transform: `translateX(${o * 172}px) scale(${o === 0 ? 1 : 0.82})`,
                opacity: away === 0 ? 1 : away === 1 ? 0.45 : 0,
                zIndex: 2 - away,
                pointerEvents: away === 2 ? "none" : undefined,
              }}
            >
              {renderCard({
                entry,
                role: o === 0 ? "cur" : o < 0 ? "prev" : "next",
                onActivate: () => (o === 0 ? openItem() : step(o)),
                label: o === 0 ? `Open ${entry.name}` : `Show ${entry.name}`,
                tabIndex: away === 2 ? -1 : 0,
              })}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-sans mt-2 text-center" style={{ color: mutedText }}>
        {focus
          ? "Saved on this device — it carries over when you make an account."
          : "Turning until you pick one · arrow keys to move faster"}
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

  const topStates = useMemo(
    () => [...usStatesData].sort((a, b) => b.gdp - a.gdp).slice(0, 8),
    [],
  );
  /* The states with the lowest and the highest unemployment rate, as the BLS has them. */
  const stateJobs = useMemo(() => {
    const byRate = [...usStatesData].sort((a, b) => a.unemploymentRate - b.unemploymentRate);
    return { low: byRate[0], high: byRate[byRate.length - 1] };
  }, []);
  /* UCDP's count of state-based armed conflicts for its latest year. */
  const [conflictYear, conflictCount] = WORLD.conflicts.series[WORLD.conflicts.series.length - 1];

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
              CommonSphere · The World in Evidence
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
              An atlas of the world as it stands. Nations, economies, climate
              and conflict, drawn from primary sources and set side by side,
              so the whole picture reads at a glance.
            </p>

            {/* What is actually in here, counted from the data rather than
                claimed, so the welcome cannot drift from the site. */}
            <p
              className="text-[11px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              {countriesData.filter((c) => !c.territory).length} countries ·{" "}
              {countriesData.filter((c) => c.territory).length} territories &amp; regions ·{" "}
              {usStatesData.length} US states ·{" "}
              {economiesData.length} economies · every figure cited to its source
              and the year it describes
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

        {/* ── LATEST HEADLINES: every desk the site reads ── */}
        <HeadlinesBanner
          label="Latest headlines"
          topics={ALL_TOPICS}
          days={2}
          read={150}
          untagged
          note={(outlets) => (
            <>
              The last two days' headlines from every desk the site reads - world affairs, US news, the economy, policy,
              humanitarian crises, the climate, crime and justice - from {outlets} (five at most from each), refreshed every
              half hour. The tag is the place a story is about, violet for more than one. Each links to the outlet.
            </>
          )}
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

        {/* ── HEADLINE COUNTS: counted from the site's own data. They were typed in - "195 countries",
            "42 active conflicts, 3 escalating", "1,200+ policies, +48 this month" - and matched nothing the site held. ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Countries and territories",
              value: `${countriesData.length}`,
              note: `${countriesData.filter((c) => c.territory).length} of them territories and dependencies`,
              icon: <Globe size={14} weight="fill" />,
            },
            {
              label: "Armed conflicts",
              value: `${conflictCount}`,
              note: `state-based, in ${conflictYear} · Uppsala Conflict Data Program`,
              icon: <Crosshair size={14} weight="fill" />,
            },
            {
              label: "World figures followed",
              value: `${Object.keys(WORLD).length}`,
              note: "each a published series, year by year",
              icon: <TrendUp size={14} weight="fill" />,
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
              <div className="flex items-center gap-1.5" style={{ color: mutedText }}>
                {k.icon}
                <span className="text-[11px] font-mono leading-snug">{k.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── INTERACTIVE DATA PANEL (standalone full-width) ─────────────── */}
        <DataExplorer />

        {/* ── TRENDS & PROJECTIONS PANEL ────────────────────────────────── */}
        {/* Every published projection the site holds - the IMF's, the UN's, the U.S. EIA's - in one panel.
            What stood here was typed by hand: sector outlooks with a confidence, scenarios with a probability. */}
        <Suspense
          fallback={
            <div className="rounded-2xl p-5 text-[11px] font-sans" style={{ background: cardBg, border: cardBorder, color: mutedText }}>
              Loading the projections…
            </div>
          }
        >
          <ProjectionsDesk action={{ label: "Full analysis", onClick: () => navigate("/dashboard/trends") }} />
        </Suspense>

        {/* ── MAIN GRID: the states, the world's conflicts, and the site's own data.
            Four cards stood in the first column that nothing published backs - "up-and-coming industries" with a
            growth rate each, "funding raised", alliances and "R&D breakthroughs" - and a Cities chart of GDP per
            head credited to a source that publishes no such figure. They are gone. ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            {/* US STATES: the largest economies, with each one's unemployment rate */}
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
              <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: mutedText }}>
                The {topStates.length} largest economies · GDP, {topStates[0].figureYears?.gdp} · unemployment, {topStates[0].figureYears?.unemploymentRate}
              </p>
              <div className="flex flex-col gap-0">
                {topStates.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/dashboard/states?open=${s.id}`)}
                    className="flex items-center gap-3 py-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
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
                      {/* On the scale of the largest state: a bar's length is its GDP. */}
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
                        className="text-[11px] font-mono font-bold w-14 text-right"
                        style={{ color: headText }}
                      >
                        {fmtB(s.gdp)}
                      </span>
                      <span
                        className="text-[10px] font-mono w-10 text-right"
                        style={{ color: mutedText }}
                        title={`Unemployment rate, ${s.figureYears?.unemploymentRate ?? ""}`}
                      >
                        {s.unemploymentRate}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_STATES} className="mt-2 mb-1" />

              {/* Three figures read off the fifty states. They were typed in - "top GDP $3.9T" against the $4.3T in the data. */}
              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {[
                  { label: "Largest economy", value: fmtB(topStates[0].gdp), note: topStates[0].name },
                  { label: "Lowest unemployment", value: `${stateJobs.low.unemploymentRate}%`, note: stateJobs.low.name },
                  { label: "Highest unemployment", value: `${stateJobs.high.unemploymentRate}%`, note: stateJobs.high.name },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-2 py-2 text-center"
                    style={{
                      background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: headText }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[9px] font-sans leading-snug"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                      <br />
                      {m.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* The world's published counts of conflict and displacement. A box of "intensity" scores stood here. */}
            <ConflictFigures />
          </div>

          <div className="flex flex-col gap-4">
            {/* The site's own log: when each of its data sets was last read from its sources.
                An "Event Log" of five hand-typed news items, the newest from July 2025, stood here. */}
            <DataLog />

            {/* Published commodity prices, each with its change on the year.
                A "Sector Outlook" of typed-in outlooks and confidences stood here. */}
            <CommodityMovers />
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

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 flex flex-col items-center gap-1">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Dashboard · each figure is dated where it appears; the data log
            above says when each source was last read
          </p>
          <SourceLink
            sources={[
              { label: "World Bank", url: "https://data.worldbank.org/" },
              { label: "IMF", url: "https://www.imf.org/en/Data" },
              { label: "UN", url: "https://population.un.org/wpp/" },
              { label: "BEA", url: "https://www.bea.gov/" },
              { label: "BLS", url: "https://www.bls.gov/data/" },
              { label: "Uppsala Conflict Data Program", url: "https://ucdp.uu.se/" },
              { label: "UNHCR", url: "https://www.unhcr.org/refugee-statistics/" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
