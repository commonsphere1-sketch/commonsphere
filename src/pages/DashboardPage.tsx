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
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { useLiveCountries } from "../contexts/LiveDataContext";
import { usStatesData } from "../data/statesData";
import { STATE_INDICATORS as STATE_FIGURES } from "../data/stateIndicators";
import { SourceLink } from "../components/SourceLink";
import { DataExplorer } from "../components/DataExplorer";
import { DashboardDrops } from "../components/DashboardDrops";
import { hdiHex } from "../lib/hdiTier";
import { CommodityMovers } from "../components/CommodityMovers";
import { GlobalAnalytics } from "../components/DashboardGlobal";
import { CitiesContainer, SectorOutlook } from "../components/DashboardCitiesSectors";
import { StatesContainer } from "../components/DashboardStates";
import { CountryLeaders, PlanetNow, WorldLiving } from "../components/DashboardSignals";

/** Energy to 2050, the panel kept of the Trends & Projections desk, with the projections it draws on: loaded after the page. */
const EnergyOutlook = lazy(() => import("../components/EnergyOutlook"));
/** The map to any place - a country, its divisions, a US state's counties - with the boundary files it draws: loaded after the page. */
const PlaceAtlas = lazy(() => import("../components/PlaceAtlas"));
import { WORLD } from "../data/worldview";

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
/** A push given the marquee by hand, in pixels: `ease` is spread over the next frames (an arrow), `now` is taken at once (a drag). */
export type MarqueePush = { ease: number; now: number };

function useMarquee(
  trackRef: React.RefObject<HTMLDivElement | null>,
  pausedRef: React.MutableRefObject<boolean>,
  pxPerSecond: number,
  pushRef?: React.MutableRefObject<MarqueePush>,
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
      let moved = false;
      // A push by hand moves it even while it is paused under the pointer: an arrow's a fifth a frame, a drag's at once.
      const push = pushRef?.current;
      if (push && half > 0 && (push.now || Math.abs(push.ease) > 0.5)) {
        const take = push.now + (Math.abs(push.ease) > 0.5 ? push.ease * 0.2 : push.ease);
        push.ease -= Math.abs(push.ease) > 0.5 ? push.ease * 0.2 : push.ease;
        push.now = 0;
        pos = (((pos + take) % half) + half) % half;
        moved = true;
      }
      if (!pausedRef.current && onScreen && !document.hidden && half > 0) {
        pos = (pos + (pxPerSecond * dt) / 1000) % half;
        moved = true;
      }
      if (moved) {
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
  }, [trackRef, pausedRef, pxPerSecond, pushRef]);
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
  /* Moved by hand as well as by itself, as asked: its arrows, a drag, or a sideways scroll. */
  const pushRef = useRef<MarqueePush>({ ease: 0, now: 0 });
  const drag = useRef<{ x: number; moved: number } | null>(null);
  /** Whether the last press was a drag, so that letting go does not open the card under the pointer. */
  const dragged = useRef(false);
  useMarquee(trackRef, pausedRef, 54, pushRef);

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

  /* The UNDP's tier for the index, not a cut-off of the page's own. */
  const hdiColor = (h: number) => hdiHex(h);

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
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
            drag.current = null;
          }}
          // A sideways scroll moves it; an up-and-down one is left to the page.
          onWheel={(e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pushRef.current.now += e.deltaX;
          }}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, moved: 0 };
            dragged.current = false;
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            d.x = e.clientX;
            d.moved += Math.abs(dx);
            if (d.moved > 5) dragged.current = true;
            pushRef.current.now -= dx;
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onClickCapture={(e) => {
            if (dragged.current) {
              e.stopPropagation();
              dragged.current = false;
            }
          }}
          style={{
            width: viewportWidth !== null ? viewportWidth : "100%",
            maxWidth: "100%",
            touchAction: "pan-y",
            userSelect: "none",
          }}
        >
          {/* Its arrows, over the fades at either end: a card's width each press. */}
          {([
            ["left", -1, "Move the countries left"],
            ["right", 1, "Move the countries right"],
          ] as const).map(([side, dir, label]) => (
            <button
              key={side}
              type="button"
              aria-label={label}
              title={label}
              onClick={(e) => {
                e.stopPropagation();
                pushRef.current.ease += dir * (cardWidth || 200);
              }}
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 ${side === "left" ? "left-1" : "right-1"}`}
              style={{
                background: isLight ? "rgba(255,255,255,0.92)" : "rgba(20,20,26,0.88)",
                border: `1px solid ${gridLine}`,
                color: headText,
                boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
              }}
            >
              {side === "left" ? <CaretLeft size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
            </button>
          ))}
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
                                      : "rgba(255,255,255,0.66)"
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
                                      : "rgba(255,255,255,0.66)"
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




/* ═══════════════════════════════════════════════════════════════════════ */
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
  /* The UNDP's tier for the index, not a cut-off of the page's own. */
  const hdiColor = (h: number) => hdiHex(h);

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
      className="shrink-0 self-center w-full"
      // A key on it holds it still. The pointer does on the middle card alone (below): the row is the page's width now, and
      // a pointer anywhere along it stopped the turning on a wide screen. Leaving the row always lets it turn again.
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
              onMouseEnter={o === 0 ? () => setPaused(true) : undefined}
              onMouseLeave={o === 0 ? () => setPaused(false) : undefined}
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

export function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.14)";
  const cardShadow = isLight
    ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)"
    : "var(--card-glow)";
  const mutedText = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)";

  /* UCDP's count of state-based armed conflicts for its latest year. */
  const [conflictYear, conflictCount] = WORLD.conflicts.series[WORLD.conflicts.series.length - 1];

  return (
    <div
      className="min-h-screen w-full animate-fade-in"
      style={{ background: "var(--color-background)", color: bodyText }}
    >
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        {/* The site's logo, centred, where a welcome heading stood. The flags that circle the site's globe are kept
            under it, centred on a wide screen as on a narrow one, as asked: they open the pages they stand for. */}
        <div className="flex flex-col gap-5">
          {/* The logo, centred, where the welcome heading and its line stood, as asked: the header's globe alone, larger, in the theme's own version - without the name. */}
          <h1 className="flex items-center justify-center pt-2" aria-label="CommonSphere">
            <span className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 relative overflow-hidden" aria-hidden>
              <img src="https://c.animaapp.com/mnv7exnwOzX3vX/img/uploaded-asset-1776467236633-0.jpeg" alt="" className="logo-light absolute inset-0 w-full h-full object-contain scale-[1.28]" />
              <img src="https://c.animaapp.com/mnv7exnwOzX3vX/img/uploaded-asset-1776467236635-1.jpeg" alt="" className="logo-dark absolute inset-0 w-full h-full object-contain scale-[1.28]" />
            </span>
          </h1>
          <div className="w-full flex justify-center">
            <FocusCarousel mutedText={mutedText} headText={headText} isLight={isLight} onOpen={(p) => navigate(p)} />
          </div>
        </div>

        {/* The Quarter Tracker stood here. It is the calendar button at the top right of every page now, as asked, with a full
            calendar beside it (CalendarPopup). */}

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

        {/* ── LATEST HEADLINES: every desk the site reads - under the Countries carousel, as asked ── */}
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

        {/* ── FIND A PLACE: a map to press. A country opens on its divisions, the United States on its states and a
            state on its counties; a division or a county goes to its record on the Subnations page. Above the comparison
            card, as asked. ── */}
        <Suspense
          fallback={
            <div className="rounded-2xl p-5 text-[11px] font-sans" style={{ background: cardBg, border: cardBorder, color: mutedText }}>
              Loading the map…
            </div>
          }
        >
          <PlaceAtlas />
        </Suspense>

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

        {/* The Trends & Projections desk stood here and was removed as asked; its energy panel is kept, lower on the
            page under the sectors and commodities. */}

        {/* ── MAIN GRID: the states, the world's conflicts, and the site's own data.
            Four cards stood in the first column that nothing published backs - "up-and-coming industries" with a
            growth rate each, "funding raised", alliances and "R&D breakthroughs" - and a Cities chart of GDP per
            head credited to a source that publishes no such figure. They are gone.

            The cards stand two to a row, each as tall as the one beside it. A card with a long list opens one of
            its rows at a time, so no card runs pages past its neighbour as the Cities and Commodity cards did. ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Places: the largest state economies and the largest cities, laid out alike. */}
          <StatesContainer />
          <CitiesContainer />

          {/* Markets: each sector's published series, back where it stood, and the published commodity prices. */}
          <SectorOutlook />
          <CommodityMovers />

          {/* The parts of the site the Dashboard did not show: the countries set against each other, the climate, and
              how the world lives. The card for the Human Rights page went with that page. */}
          <CountryLeaders />
          <PlanetNow />
          <WorldLiving />
        </div>


        {/* ── ENERGY TO 2050: the panel kept of the Trends & Projections desk, under the sectors and the commodity
            prices it belongs with. The U.S. EIA's projection of the world's electricity by type. ── */}
        <Suspense
          fallback={
            <div className="rounded-2xl p-5 text-[11px] font-sans" style={{ background: cardBg, border: cardBorder, color: mutedText }}>
              Loading the energy projections…
            </div>
          }
        >
          <EnergyOutlook />
        </Suspense>

        {/* The four drop-down cards - industries, funding, alliances, research - each the full width of the page.
            They open on published series; what they held was typed in. */}
        <div className="flex flex-col gap-4">
          <DashboardDrops />
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

        {/* ── GLOBAL & GEOPOLITICAL ANALYTICS: where the National and International cards stood, replaced as asked.
            The world's figures, how its people are governed, and its blocs side by side - each published. ── */}
        <GlobalAnalytics />

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 flex flex-col items-center gap-1">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Dashboard · each figure is dated where it appears, beside its source
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
