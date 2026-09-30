import { decodeEntities } from "../lib/security";
import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { HeadlinesBanner } from "../components/HeadlinesBanner";
import {
  CLIMATE_INDICATORS,
  CLIMATE_RETRIEVED,
  type ClimateIndicator,
} from "../data/climateIndicators";
import {
  BOUNDARIES,
  PHC_2026,
  TRANSGRESSED,
  position,
  type ControlVariable,
  type PlanetaryBoundary,
  type Zone,
} from "../data/planetaryBoundaries";
import { FLASHPOINTS, TIPPING_POINTS, TREATIES, TREATIES_CHECKED, type ContextItem } from "../data/climateContext";
import {
  Leaf,
  Info,
  Globe,
  Drop,
  Wind,
  Atom,
  Fish,
  Tree,
  CloudSlash,
  Flask,
  CaretDown,
} from "@phosphor-icons/react";

/* ─── Zones, as the Planetary Health Check names them ───────────────────── */
const ZONE: Record<Zone, { label: string; color: string }> = {
  safe: { label: "Within the boundary", color: "#22c55e" },
  increasing: { label: "Zone of increasing risk", color: "#f59e0b" },
  high: { label: "High-risk zone", color: "#ef4444" },
};

const ICON: Record<string, React.ReactNode> = {
  climate: <CloudSlash size={16} weight="fill" />,
  novel_entities: <Flask size={16} weight="fill" />,
  ozone: <Atom size={16} weight="fill" />,
  aerosol: <Wind size={16} weight="fill" />,
  ocean: <Drop size={16} weight="fill" />,
  biogeochemical: <Leaf size={16} weight="fill" />,
  freshwater: <Drop size={16} weight="fill" />,
  land: <Tree size={16} weight="fill" />,
  biosphere: <Fish size={16} weight="fill" />,
};

/** "426 ppm", "64% of potential", "0.07". */
const withUnit = (n: string, unit: string) => (!unit ? n : unit.startsWith("%") ? `${n}${unit}` : `${n} ${unit}`);

/** Decimal places the report writes a unit's figures to: "+1.0 W/m²", "0.10", "2.50 Ω". */
const DECIMALS: Record<string, number> = { "W/m²": 1, "": 2, "Ω": 2 };

/** Shows a boundary or high-risk figure the way the report writes it; `unit` overrides the variable's own. */
const fmt = (n: number, v: ControlVariable, unit = v.unit) =>
  withUnit(
    `${v.unit === "W/m²" && n > 0 ? "+" : ""}${n.toLocaleString("en-US", {
      minimumFractionDigits: DECIMALS[v.unit] ?? 0,
      maximumFractionDigits: 2,
    })}`,
    unit,
  );

/** In the narrow list, "% of ice-free land" is just "%". */
const shortUnit = (unit: string) => (unit.startsWith("%") ? "%" : unit);

/**
 * The global control variable furthest past its boundary: the one a wedge
 * reaches to and the list shows. Novel entities has no number; the report
 * places it in the high-risk zone, so it counts as sitting on that line.
 */
function headline(b: PlanetaryBoundary): ControlVariable {
  const vs = b.variables.filter((v) => !v.regional);
  return vs.reduce((m, v) => ((position(v) ?? 2) > (position(m) ?? 2) ? v : m), vs[0]);
}

/* ─── The wheel ─────────────────────────────────────────────────────────── */

/** Clockwise from the top, as the Planetary Health Check draws it. */
const ORDER = ["novel_entities", "ozone", "aerosol", "ocean", "biogeochemical", "freshwater", "land", "biosphere", "climate"];
const WHEEL = { cx: 260, cy: 260, core: 72, boundary: 128, highRisk: 176, edge: 204 };

/** Radius for a position: the core's edge at 0, the boundary ring at 1, the high-risk ring at 2, the chart's edge from 3 on. */
function radius(p: number): number {
  if (p <= 1) return WHEEL.core + (WHEEL.boundary - WHEEL.core) * Math.max(0, p);
  if (p <= 2) return WHEEL.boundary + (WHEEL.highRisk - WHEEL.boundary) * (p - 1);
  return WHEEL.highRisk + (WHEEL.edge - WHEEL.highRisk) * Math.min(1, p - 2);
}

function PlanetaryBoundariesRadialChart({
  selected,
  onSelect,
  isLight,
}: {
  selected: string;
  onSelect: (id: string) => void;
  isLight: boolean;
}) {
  const { cx, cy } = WHEEL;
  const polar = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const wedge = (start: number, end: number, inner: number, outer: number) => {
    const gap = 1.5; // degrees between wedges
    const s = start + gap / 2;
    const e = end - gap / 2;
    const [p1, p2, p3, p4] = [polar(s, inner), polar(s, outer), polar(e, outer), polar(e, inner)];
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${outer} ${outer} 0 0 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${inner} ${inner} 0 0 0 ${p1.x} ${p1.y} Z`;
  };
  const coreText = isLight ? "#166534" : "#86efac";

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 520 520"
        width="100%"
        style={{ maxWidth: 400, overflow: "visible" }}
        role="img"
        aria-label={`Planetary boundaries wheel: ${TRANSGRESSED} of 9 transgressed`}
      >
        <defs>
          <radialGradient id="pbCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
            <stop offset="60%" stopColor="#16a34a" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#14532d" stopOpacity={0.5} />
          </radialGradient>
        </defs>

        {/* The safe operating space, out to the boundary ring. */}
        <circle cx={cx} cy={cy} r={WHEEL.boundary} fill={isLight ? "#f0fdf4" : "#052e16"} opacity={0.4} />
        <circle cx={cx} cy={cy} r={WHEEL.highRisk} fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.45} />
        <circle cx={cx} cy={cy} r={WHEEL.boundary} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />

        {ORDER.map((id, i) => {
          const b = BOUNDARIES.find((x) => x.id === id);
          if (!b) return null;
          const start = i * 40;
          const p = position(headline(b));
          const outer = radius(p ?? 2);
          const color = ZONE[b.zone].color;
          const isSelected = selected === b.id;
          return (
            <g key={b.id} onClick={() => onSelect(b.id)} className="cursor-pointer">
              <path d={wedge(start, start + 40, WHEEL.core, WHEEL.edge)} fill={color} opacity={0.06} />
              <path
                d={wedge(start, start + 40, WHEEL.core, outer)}
                fill={color}
                opacity={isSelected ? 0.85 : p === null ? 0.3 : 0.55}
                stroke={p === null ? color : "none"}
                strokeDasharray={p === null ? "4 3" : undefined}
                strokeWidth={p === null ? 1.5 : 0}
                className="transition-all duration-300"
                style={{ filter: isSelected ? `drop-shadow(0 0 8px ${color}80)` : undefined }}
              />
              <path
                d={wedge(start, start + 40, WHEEL.core, WHEEL.edge)}
                fill="transparent"
                stroke={isSelected ? color : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
              />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={WHEEL.core} fill="url(#pbCoreGrad)" />
        {["SAFE", "OPERATING", "SPACE"].map((w, i) => (
          <text key={w} x={cx} y={cy - 12 + i * 14} textAnchor="middle" fontSize="9" fontFamily="monospace" fill={coreText} opacity={0.85} letterSpacing="1">
            {w}
          </text>
        ))}
        <text x={cx + WHEEL.boundary + 4} y={cy - 2} fontSize="7" fontFamily="monospace" fill="#22c55e" opacity={0.8}>
          boundary
        </text>
        <text x={cx + WHEEL.highRisk + 4} y={cy - 2} fontSize="7" fontFamily="monospace" fill="#ef4444" opacity={0.8}>
          high risk
        </text>

        {ORDER.map((id, i) => {
          const b = BOUNDARIES.find((x) => x.id === id);
          if (!b) return null;
          const mid = i * 40 + 20;
          const lp = polar(mid, WHEEL.edge + 28);
          const anchor = mid > 315 || mid < 45 ? "middle" : mid < 180 ? "start" : mid > 180 ? "end" : "middle";
          const words = b.shortName.split(" ");
          const isSelected = selected === b.id;
          return (
            <g key={`lbl-${b.id}`} onClick={() => onSelect(b.id)} className="cursor-pointer">
              {words.map((word, wi) => (
                <text
                  key={wi}
                  x={lp.x}
                  y={lp.y - ((words.length - 1) * 11) / 2 + wi * 11}
                  textAnchor={anchor}
                  fontSize="8.5"
                  fontFamily="sans-serif"
                  fontWeight={isSelected ? "700" : "600"}
                  fill={isSelected ? ZONE[b.zone].color : isLight ? "#334155" : "#cbd5e1"}
                  opacity={isSelected ? 1 : 0.8}
                  className="select-none"
                >
                  {word}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Detail panel ──────────────────────────────────────────────────────── */
function BoundaryDetailPanel({
  boundary,
  isLight,
  headText,
  mutedText,
  gridLine,
}: {
  boundary: PlanetaryBoundary;
  isLight: boolean;
  headText: string;
  mutedText: string;
  gridLine: string;
}) {
  const z = ZONE[boundary.zone];
  const body = isLight ? "#475569" : "#94a3b8";
  const label = "text-[9px] font-mono uppercase tracking-widest mb-2";
  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-4 pb-4 mb-4 border-b" style={{ borderColor: gridLine }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: z.color + "18", color: z.color }}>
          {ICON[boundary.id]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold font-sans leading-snug" style={{ color: headText }}>
            {boundary.name}
          </h3>
          <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: z.color + "10", color: z.color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: z.color }} />
            {z.label} · {boundary.verdict}
          </span>
          <p className="mt-2 text-[11px] font-sans leading-relaxed" style={{ color: body }}>
            {boundary.summary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p className={label} style={{ color: mutedText }}>
            Control variables
          </p>
          <div className="flex flex-col gap-2">
            {boundary.variables.map((v) => (
              <div
                key={v.name}
                className="rounded-lg px-3 py-2.5"
                style={{ background: isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.04)", border: `1px solid ${gridLine}` }}
              >
                <p className="text-[10px] font-sans font-semibold leading-snug" style={{ color: headText }}>
                  {v.name}
                  {v.regional && (
                    <span className="ml-1.5 text-[8px] font-mono uppercase tracking-wider" style={{ color: mutedText }}>
                      regional
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[
                    { k: "Now", v: withUnit(v.current, v.value === null ? "" : v.unit), c: ZONE[v.zone].color },
                    { k: "Boundary", v: fmt(v.boundary, v), c: "#22c55e" },
                    {
                      k: v.highRiskProvisional ? "High risk (provisional)" : "High risk",
                      v: v.highRisk === null ? "Not defined" : fmt(v.highRisk, v),
                      c: v.highRisk === null ? mutedText : "#ef4444",
                    },
                  ].map((cell) => (
                    <div key={cell.k} className="min-w-0">
                      <p className="text-[8px] font-mono leading-tight" style={{ color: mutedText }}>
                        {cell.k}
                      </p>
                      <p className="text-[12px] font-bold font-mono leading-snug break-words" style={{ color: cell.c }}>
                        {cell.v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className={label} style={{ color: mutedText }}>
            What drives it
          </p>
          <ul className="flex flex-col gap-2">
            {boundary.drivers.map((d) => (
              <li key={d} className="flex gap-2.5">
                <span className="w-1 rounded-full shrink-0 mt-1" style={{ background: z.color, minHeight: 14 }} />
                <span className="text-[11px] font-sans leading-relaxed" style={{ color: body }}>
                  {d}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <p className={label} style={{ color: mutedText }}>
          What it is doing
        </p>
        <ul className="flex flex-col gap-2">
          {boundary.impacts.map((d) => (
            <li key={d} className="flex gap-2.5">
              <span className="w-1 rounded-full shrink-0 mt-1" style={{ background: z.color, minHeight: 14 }} />
              <span className="text-[11px] font-sans leading-relaxed" style={{ color: body }}>
                {d}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[9px] font-sans mt-4 pt-3 border-t" style={{ color: mutedText, borderColor: gridLine }}>
        Source:{" "}
        <a href={PHC_2026.summaryUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:opacity-80">
          {PHC_2026.title}
        </a>
        , summary p. {boundary.page} ({PHC_2026.publisher}).
      </p>
    </div>
  );
}

/* ─── Summary card ──────────────────────────────────────────────────────── */
function BoundarySummaryCard({
  boundary,
  selected,
  onSelect,
  headText,
  mutedText,
  gridLine,
}: {
  boundary: PlanetaryBoundary;
  selected: boolean;
  onSelect: () => void;
  headText: string;
  mutedText: string;
  gridLine: string;
}) {
  const z = ZONE[boundary.zone];
  const h = headline(boundary);
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left w-full transition-all hover:opacity-90"
      style={{
        background: selected ? z.color + "12" : "transparent",
        border: `1px solid ${selected ? z.color + "35" : gridLine}`,
        outline: "none",
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: z.color + "18", color: z.color }}>
        {ICON[boundary.id]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold font-sans truncate" style={{ color: headText }}>
          {boundary.shortName}
        </p>
        <p className="text-[9px] font-mono" style={{ color: z.color }}>
          {z.label}
        </p>
      </div>
      <div className="shrink-0 text-right max-w-[45%]">
        <p className="text-[10px] font-mono font-bold truncate" style={{ color: z.color }}>
          {h.value === null ? "Not quantified" : withUnit(h.current, shortUnit(h.unit))}
        </p>
        <p className="text-[8px] font-mono truncate" style={{ color: mutedText }}>
          boundary {fmt(h.boundary, h, shortUnit(h.unit))}
        </p>
      </div>
    </button>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export function PlanetaryBoundariesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedId, setSelectedId] = useState<string>("climate");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [expandedSeaLevel, setExpandedSeaLevel] = useState<Set<string>>(new Set());

  const toggleNote = (key: string) =>
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleSeaLevel = (key: string) => {
    setExpandedSeaLevel((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const mutedText = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.38)";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const selected = BOUNDARIES.find((b) => b.id === selectedId) ?? BOUNDARIES[0];
  const co2 = CLIMATE_INDICATORS.find((i) => i.id === "co2-global");
  const byId = (id: string) => BOUNDARIES.find((b) => b.id === id);
  const extinction = byId("biosphere")?.variables[0];
  const nitrogen = byId("biogeochemical")?.variables[1];

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* ── HERO HEADER ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Climate &amp; Planetary Boundaries
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              What the climate is measured at today, and the nine Earth-system
              processes that define the safe operating space for humanity
            </p>
          </div>
        </div>

        {/* ── CLIMATE HEADLINES: the climate desks' news, kept current ── */}
        <HeadlinesBanner
          label="Climate headlines"
          topics={["climate"]}
          days={5}
          className="mb-6"
          note={(outlets) => (
            <>
              The last five days' climate headlines from {outlets} (five at most from each), refreshed every half hour. The tag is the
              place a story is about, violet for more than one. Each links to the outlet.
            </>
          )}
        />

        {/* ── KPI STRIP ─────────────────────────────────────────────────── */}
        {/* Each figure is the source's own: the boundary count and the two
            boundary measures from the Planetary Health Check 2026, carbon
            dioxide from NOAA's latest global mean (the same reading as the
            "Measured now" table below). */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Boundaries transgressed",
              value: `${TRANSGRESSED} / 9`,
              color: "text-red-500",
              sub: "Planetary Health Check 2026",
              href: PHC_2026.summaryUrl,
            },
            co2 && {
              label: "Carbon dioxide, global mean",
              value: `${co2.value.toFixed(1)} ppm`,
              color: "text-orange-500",
              sub: `Boundary 350 ppm · NOAA, ${co2.period}`,
              href: co2.url,
            },
            extinction && {
              label: "Extinction rate",
              value: extinction.current,
              color: "text-red-600",
              sub: "per million species-years · boundary 10",
              href: PHC_2026.summaryUrl,
            },
            nitrogen && {
              label: "Nitrogen fixed for farming",
              value: `${nitrogen.current} Tg/yr`,
              color: "text-red-500",
              sub: "Boundary 62 Tg/yr · PHC 2026",
              href: PHC_2026.summaryUrl,
            },
          ]
            .filter((k): k is { label: string; value: string; color: string; sub: string; href: string } => !!k)
            .map((k) => (
              <div key={k.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-sans">{k.label}</p>
                <p className={`text-xl font-bold font-mono ${k.color}`}>{k.value}</p>
                <a
                  href={k.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-muted-foreground font-sans mt-0.5 underline decoration-dotted hover:text-foreground"
                >
                  {k.sub}
                </a>
              </div>
            ))}
        </div>

        {/* ── MAIN CONTENT GRID ─────────────────────────────────────────── */}
        {/* The nine boundaries and the one being read, side by side, so the
            choice stays in view next to what it opened. */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          {/* Splits at md, not lg: the app's own chrome eats ~230px of the
              window, so a 1024px breakpoint never fired on a laptop. */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 lg:col-span-4 md:border-r md:border-border md:pr-4">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2 text-muted-foreground">
                All Nine Boundaries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                {BOUNDARIES.map((b) => (
                  <BoundarySummaryCard
                    key={b.id}
                    boundary={b}
                    selected={selectedId === b.id}
                    onSelect={() => setSelectedId(b.id)}
                    headText={headText}
                    mutedText={mutedText}
                    gridLine={gridLine}
                  />
                ))}
              </div>
            </div>

            <div className="md:col-span-7 lg:col-span-8 min-w-0">
              <BoundaryDetailPanel
                boundary={selected}
                isLight={isLight}
                headText={headText}
                mutedText={mutedText}
                gridLine={gridLine}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* The wheel */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-green-500">
                    Earth System Status
                  </p>
                  <h2 className="text-sm font-bold font-sans text-foreground">
                    Planetary Boundaries Dashboard
                  </h2>
                </div>
                <span className="text-[9px] font-mono px-2 py-1 rounded-full bg-red-500/10 text-red-500">
                  {TRANSGRESSED} of 9 transgressed
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 pb-3 border-b border-border">
                {Object.values(ZONE).map((cfg) => (
                  <div key={cfg.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <span className="text-[10px] font-sans text-muted-foreground">{cfg.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-sans text-muted-foreground mb-2">
                Each wedge reaches as far as its most transgressed measure: the
                green ring is the boundary, the red ring the high-risk line.
                Click one to open it.
              </p>
              <PlanetaryBoundariesRadialChart selected={selectedId} onSelect={setSelectedId} isLight={isLight} />
            </div>
          </div>

          {/* About the framework and the wheel */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 flex-1">
              <div className="flex items-start gap-2.5">
                <Info size={14} weight="fill" className="text-green-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-3 text-[11px] font-sans leading-relaxed text-muted-foreground">
                  <p className="text-[11px] font-bold text-green-600 dark:text-green-400">About the planetary boundaries</p>
                  <p>
                    The framework was introduced by Johan Rockström and colleagues in{" "}
                    <a href="https://doi.org/10.1038/461472a" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-foreground">
                      2009
                    </a>{" "}
                    and updated in{" "}
                    <a href="https://doi.org/10.1126/science.1259855" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-foreground">
                      2015
                    </a>{" "}
                    and{" "}
                    <a href="https://doi.org/10.1126/sciadv.adh2458" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-foreground">
                      2023
                    </a>
                    . Each boundary is a level of a control variable - carbon dioxide, forest cover, nitrogen use - beyond which the risk of
                    destabilising the Earth system rises. Past it lies a zone of increasing risk, then a high-risk zone.
                  </p>
                  <p>
                    The{" "}
                    <a href={PHC_2026.summaryUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-foreground">
                      Planetary Health Check 2026
                    </a>
                    , the third annual assessment from the Potsdam Institute for Climate Impact Research, finds seven of the nine
                    transgressed. Only stratospheric ozone and, taken globally, aerosol loading are within their boundaries, and aerosols are
                    past a proposed regional boundary over South Asia.
                  </p>
                  <p>
                    How the wheel is drawn: a wedge starts at the pre-human baseline (the edge of the core) and runs to its measure's value,
                    reaching the green ring at the boundary and the red ring at the high-risk line. Nitrogen, phosphorus and radiative
                    forcing lie beyond the chart's edge. Novel entities has no single measure; it is drawn to the high-risk line, where the
                    report places it, with a dashed edge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTEXT: tipping points, treaties, flashpoints ──────────────
            Each item says what its source says; open it for the detail and
            the links. See data/climateContext.ts for what was removed. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {(
            [
              { title: "Tipping Points & Cascades", items: TIPPING_POINTS, note: null },
              { title: "International Treaties & Gaps", items: TREATIES, note: `Party counts: UN Treaty Collection, ${TREATIES_CHECKED}` },
              { title: "Ecological Security Flashpoints", items: FLASHPOINTS, note: null },
            ] as { title: string; items: ContextItem[]; note: string | null }[]
          ).map((section) => (
            <div key={section.title} className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: mutedText }}>
                {section.title}
              </p>
              <div className="flex flex-col gap-0">
                {section.items.map((item, i) => {
                  const open = expandedNotes.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="py-2.5"
                      style={{ borderBottom: i < section.items.length - 1 ? `1px solid ${gridLine}` : "none" }}
                    >
                      <button
                        onClick={() => toggleNote(item.id)}
                        aria-expanded={open}
                        className="flex items-start gap-2.5 w-full text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: item.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold font-sans" style={{ color: headText }}>
                            {item.label}
                          </p>
                          <p className="text-[10px] font-sans" style={{ color: mutedText }}>
                            {item.val}
                          </p>
                        </div>
                        <CaretDown
                          size={14}
                          weight="fill"
                          className="shrink-0 mt-0.5"
                          style={{ color: item.color, transition: "transform 200ms ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </button>
                      {open && (
                        <div
                          className="mt-2.5 text-[10px] font-sans leading-relaxed rounded-lg px-3 py-2.5 animate-fade-in"
                          style={{
                            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                            borderLeft: `3px solid ${item.color}`,
                            color: mutedText,
                          }}
                        >
                          <p>{item.summary}</p>
                          <p className="mt-1.5">
                            {item.sources.map((src, k) => (
                              <span key={src.url}>
                                {k > 0 && " · "}
                                <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:opacity-80">
                                  {src.label}
                                </a>
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {section.note && (
                <p className="text-[9px] font-sans mt-3" style={{ color: mutedText }}>
                  {section.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── PUBLIC ENVIRONMENTAL DATA ─────────────────────────────────── */}
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <Globe size={16} weight="fill" className="text-sky-500" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-500">
            Most Publicly Inquired Environmental Data
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Row 1 — Air Quality + Global Temp + Sea Level */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Air Quality Index — Global Cities */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Air Quality Index
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Major Cities — PM2.5 / AQI 2026
            </h3>
            <div className="flex flex-col gap-0">
              {[
                {
                  city: "Delhi, India",
                  aqi: 189,
                  pm25: 124,
                  cat: "Very Unhealthy",
                  color: "#dc2626",
                },
                {
                  city: "Lahore, Pakistan",
                  aqi: 168,
                  pm25: 108,
                  cat: "Unhealthy",
                  color: "#ef4444",
                },
                {
                  city: "Dhaka, Bangladesh",
                  aqi: 155,
                  pm25: 97,
                  cat: "Unhealthy",
                  color: "#ef4444",
                },
                {
                  city: "Beijing, China",
                  aqi: 102,
                  pm25: 58,
                  cat: "Moderate",
                  color: "#f59e0b",
                },
                {
                  city: "Jakarta, Indonesia",
                  aqi: 96,
                  pm25: 51,
                  cat: "Moderate",
                  color: "#f59e0b",
                },
                {
                  city: "Cairo, Egypt",
                  aqi: 88,
                  pm25: 44,
                  cat: "Moderate",
                  color: "#f59e0b",
                },
                {
                  city: "London, UK",
                  aqi: 42,
                  pm25: 12,
                  cat: "Good",
                  color: "#22c55e",
                },
                {
                  city: "New York, US",
                  aqi: 38,
                  pm25: 9,
                  cat: "Good",
                  color: "#22c55e",
                },
                {
                  city: "Sydney, Australia",
                  aqi: 22,
                  pm25: 5,
                  cat: "Good",
                  color: "#10b981",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.city}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: row.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold font-sans truncate"
                      style={{ color: headText }}
                    >
                      {row.city}
                    </p>
                    <p
                      className="text-[9px] font-mono"
                      style={{ color: row.color }}
                    >
                      {row.cat}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-[13px] font-bold font-mono"
                      style={{ color: row.color }}
                    >
                      {row.aqi}
                    </p>
                    <p
                      className="text-[8px] font-mono"
                      style={{ color: mutedText }}
                    >
                      AQI · {row.pm25} μg/m³
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: IQAir World Air Quality Report 2024 · WHO PM2.5 guideline:
              5 μg/m³
            </p>
          </div>

          {/* Global Temperature Anomaly */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Global Temperature
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Anomaly vs. 1850–1900 Baseline
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { year: "1980", anomaly: +0.27, bar: 17 },
                { year: "1990", anomaly: +0.44, bar: 27 },
                { year: "2000", anomaly: +0.42, bar: 26 },
                { year: "2010", anomaly: +0.63, bar: 39 },
                { year: "2015", anomaly: +0.87, bar: 54 },
                { year: "2020", anomaly: +1.02, bar: 63 },
                { year: "2022", anomaly: +1.15, bar: 71 },
                { year: "2023", anomaly: +1.45, bar: 90 },
                { year: "2024", anomaly: +1.54, bar: 96 },
                { year: "2025", anomaly: +1.58, bar: 98 },
                { year: "2026 (est.)", anomaly: +1.61, bar: 100 },
              ].map((row) => (
                <div key={row.year} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono w-20 shrink-0"
                    style={{ color: mutedText }}
                  >
                    {row.year}
                  </span>
                  <div
                    className="flex-1 h-3 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${row.bar}%`,
                        background:
                          row.anomaly > 1.0
                            ? "#ef4444"
                            : row.anomaly > 0.6
                              ? "#f97316"
                              : "#f59e0b",
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold font-mono w-12 text-right shrink-0"
                    style={{
                      color:
                        row.anomaly > 1.0
                          ? "#ef4444"
                          : row.anomaly > 0.6
                            ? "#f97316"
                            : "#f59e0b",
                    }}
                  >
                    +{row.anomaly}°C
                  </span>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl px-3 py-2.5 mt-2"
              style={{ background: "#ef444412", border: "1px solid #ef444425" }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: "#ef4444" }}
              >
                2024–2025 confirmed hottest consecutive years in recorded
                history
              </p>
              <p
                className="text-[9px] font-sans mt-0.5"
                style={{ color: mutedText }}
              >
                Paris Agreement 1.5°C limit officially breached as annual mean
                in 2024
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Copernicus C3S / NASA GISS / NOAA GlobalTemp 2026
            </p>
          </div>

          {/* Sea Level Rise */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Sea Level Rise
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Mean Sea Level (GMSL)
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {[
                {
                  label: "Rise since 1993 (satellite era)",
                  value: "+115 mm",
                  color: "#3b82f6",
                  sub: "Measured by altimetry",
                  id: "rise-since-1993",
                  summary: "Satellite altimetry from TOPEX/Poseidon and successor missions has tracked sea level with millimeter precision since 1993. The 115 mm rise reflects both thermal expansion (warming water) and ice sheet/glacier melt. This is the most accurate measurement period in human history; pre-satellite estimates rely on tide gauges and are less precise.",
                },
                {
                  label: "Current rate (2026)",
                  value: "+4.8 mm/yr",
                  color: "#ef4444",
                  sub: "Accelerating from 3.1 mm/yr in 1990s",
                  id: "current-rate",
                  summary: "Sea level rise is accelerating. The rate increased from 3.1 mm/yr in the 1990s to 4.8 mm/yr in 2026, a 55% increase. This acceleration is driven by ice sheet melt in Greenland and Antarctica exceeding previous decades. If acceleration continues, projections for 2100 may be underestimated.",
                },
                {
                  label: "Projected rise by 2050 (RCP4.5)",
                  value: "+25–30 cm",
                  color: "#f97316",
                  sub: "Above 2000 baseline",
                  id: "rise-2050",
                  summary: "RCP4.5 (Representative Concentration Pathway) assumes moderate emissions reductions. A 25–30 cm rise by 2050 is already locked in by existing atmospheric CO₂. This threatens coastal infrastructure, agriculture in river deltas (Nile, Ganges, Mekong), and low-lying island nations. Southeast Asia faces disproportionate impacts.",
                },
                {
                  label: "Projected rise by 2100 (RCP8.5)",
                  value: "+0.6–1.1 m",
                  color: "#dc2626",
                  sub: "High-end scenario",
                  id: "rise-2100",
                  summary: "The RCP8.5 high-end scenario (continued high emissions) projects 0.6–1.1 m rise by 2100, though some ice-sheet collapse models suggest 1.5–2 m is possible. A 1 m rise inundates 1–4 million km² of low-lying land, displacing up to 1 billion people. Bangladesh, Vietnam, and the Pacific are most vulnerable.",
                },
                {
                  label: "Thermal expansion contribution",
                  value: "~43%",
                  color: "#6366f1",
                  sub: "Of total GMSL rise",
                  id: "thermal-expansion",
                  summary: "Thermal expansion (water warming and expanding) accounts for ~43% of current sea-level rise. It occurs on decadal timescales as ocean heat penetrates deeper. Even if CO₂ emissions ceased today, thermal expansion would continue for 100+ years due to ocean heat inertia, committing future generations to additional rise.",
                },
                {
                  label: "Ice sheet melt contribution",
                  value: "~36%",
                  color: "#06b6d4",
                  sub: "Greenland + Antarctica",
                  id: "ice-melt",
                  summary: "Ice sheet melt from Greenland (11M km²) and Antarctica (14M km²) contributes ~36% of current GMSL rise. Greenland's mass loss accelerated from 34 Gt/yr (1990s) to 280 Gt/yr (2023). Antarctica's melt is accelerating exponentially. If West Antarctic Ice Sheet collapses, sea level could rise 3–4 m over centuries.",
                },
              ].map((row) => {
                const isExpanded = expandedSeaLevel.has(row.id);
                return (
                  <div
                    key={row.label}
                    className="rounded-lg px-3 py-2"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.025)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    <button
                      onClick={() => toggleSeaLevel(row.id)}
                      className="w-full text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[10px] font-sans font-semibold"
                            style={{ color: headText }}
                          >
                            {row.label}
                          </p>
                          <p
                            className="text-[9px] font-sans"
                            style={{ color: mutedText }}
                          >
                            {row.sub}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p
                            className="text-sm font-bold font-mono"
                            style={{ color: row.color }}
                          >
                            {row.value}
                          </p>
                          <CaretDown
                            size={12}
                            weight="fill"
                            style={{
                              color: row.color,
                              transition: "transform 200ms ease",
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          />
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div
                        className="mt-2.5 text-[9px] font-sans leading-relaxed rounded-lg px-2.5 py-2 animate-fade-in"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.03)"
                            : "rgba(255,255,255,0.05)",
                          borderLeft: `3px solid ${row.color}`,
                          color: mutedText,
                        }}
                      >
                        {row.summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: "#3b82f612", border: "1px solid #3b82f625" }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: "#3b82f6" }}
              >
                ~1 billion people live in low-elevation coastal zones
              </p>
              <p
                className="text-[9px] font-sans mt-0.5"
                style={{ color: mutedText }}
              >
                Bangladesh, Vietnam, Indonesia most exposed to inundation by
                2100
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: NASA Sea Level Change / IPCC SROCC / Copernicus 2026
            </p>
          </div>
        </div>

        {/* Row 2 — Arctic Ice + Deforestation + Plastic Pollution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Arctic & Antarctic Ice */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Polar Ice Coverage
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Arctic &amp; Antarctic Ice Extent 2026
            </h3>
            <div className="flex flex-col gap-3 mb-3">
              {[
                {
                  label: "Arctic Sea Ice (Sept 2023 minimum)",
                  value: "4.23 M km²",
                  prev: "Lowest on record",
                  color: "#06b6d4",
                  pct: 28,
                },
                {
                  label: "Arctic Sea Ice (1980s avg. minimum)",
                  value: "7.05 M km²",
                  prev: "Historical baseline",
                  color: "#22c55e",
                  pct: 47,
                },
                {
                  label: "Antarctic Sea Ice (Feb 2023)",
                  value: "1.91 M km²",
                  prev: "Record low — 1M below avg.",
                  color: "#ef4444",
                  pct: 13,
                },
                {
                  label: "Greenland Ice Mass Loss (2023)",
                  value: "−280 Gt/yr",
                  prev: "Accelerating since 2000s",
                  color: "#f97316",
                  pct: 65,
                },
                {
                  label: "Arctic warming rate",
                  value: "×3–4 faster",
                  prev: "Than global mean",
                  color: "#dc2626",
                  pct: 90,
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="text-[10px] font-sans font-semibold truncate pr-2"
                      style={{ color: headText }}
                    >
                      {row.label}
                    </p>
                    <p
                      className="text-[11px] font-bold font-mono shrink-0"
                      style={{ color: row.color }}
                    >
                      {row.value}
                    </p>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <p
                    className="text-[8px] font-mono mt-0.5"
                    style={{ color: mutedText }}
                  >
                    {row.prev}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-2"
              style={{ color: mutedText }}
            >
              Source: NSIDC / ESA CryoSat / NASA GRACE-FO 2026
            </p>
          </div>

          {/* Deforestation Tracker */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Deforestation
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Forest Loss Tracker 2025
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Tropical forest lost (2023)",
                  value: "3.7M ha",
                  color: "#ef4444",
                },
                {
                  label: "Brazil Amazon loss",
                  value: "1.1M ha",
                  color: "#f97316",
                },
                {
                  label: "DRC Congo Basin loss",
                  value: "0.49M ha",
                  color: "#f59e0b",
                },
                { label: "Bolivia loss", value: "0.39M ha", color: "#f97316" },
                {
                  label: "Trees lost per minute",
                  value: "~25 ha",
                  color: "#dc2626",
                },
                {
                  label: "Global tree cover (change)",
                  value: "−2.3%",
                  color: "#ef4444",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  region: "Southeast Asia",
                  driver: "Palm oil & pulpwood",
                  loss: 88,
                },
                {
                  region: "South America",
                  driver: "Cattle ranching & soy",
                  loss: 95,
                },
                {
                  region: "Central Africa",
                  driver: "Subsistence & logging",
                  loss: 72,
                },
                {
                  region: "South Asia",
                  driver: "Agriculture expansion",
                  loss: 61,
                },
              ].map((row, i, arr) => (
                <div
                  key={row.region}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.region}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.driver}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.loss}%`, background: "#ef4444" }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right"
                      style={{ color: "#ef4444" }}
                    >
                      {row.loss}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Global Forest Watch / Hansen et al. 2025 / PRODES/INPE
            </p>
          </div>

          {/* Plastic Pollution */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Plastic Pollution
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Plastic Waste 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Plastic produced annually",
                  value: "430 MT",
                  color: "#dc2626",
                },
                {
                  label: "Ocean plastic stock",
                  value: "~170 MT",
                  color: "#3b82f6",
                },
                {
                  label: "New ocean input per year",
                  value: "11 MT",
                  color: "#f97316",
                },
                {
                  label: "Recycling rate (global)",
                  value: "9%",
                  color: "#f59e0b",
                },
                {
                  label: "Single-use plastic share",
                  value: "36%",
                  color: "#ef4444",
                },
                {
                  label: "Microplastic in ocean",
                  value: "24.4 T",
                  color: "#6366f1",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  country: "Philippines",
                  share: 36,
                  note: "Top ocean polluter by mass",
                },
                {
                  country: "India",
                  share: 13,
                  note: "Ganges river plastic source",
                },
                {
                  country: "Malaysia",
                  share: 9,
                  note: "Import & domestic waste",
                },
                {
                  country: "China",
                  share: 8,
                  note: "Reduced from 28% in 2010",
                },
                {
                  country: "Indonesia",
                  share: 7,
                  note: "Java & Sumatra coastlines",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.country}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.country}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.share * 2.5}%`,
                          background: "#3b82f6",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right"
                      style={{ color: "#3b82f6" }}
                    >
                      {row.share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Our World in Data / UNEP 2025 / Science (Borrelle et al.)
            </p>
          </div>
        </div>

        {/* Row 3 — Renewable Energy + Extreme Weather + Water Stress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Renewable Energy Progress */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Clean Energy
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Renewable Energy Share by Country 2026
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {[
                {
                  country: "Iceland",
                  pct: 99,
                  source: "Geothermal + Hydro",
                  color: "#10b981",
                },
                {
                  country: "Norway",
                  pct: 98,
                  source: "Hydropower",
                  color: "#10b981",
                },
                {
                  country: "Denmark",
                  pct: 88,
                  source: "Wind dominant",
                  color: "#22c55e",
                },
                {
                  country: "Germany",
                  pct: 62,
                  source: "Wind + Solar",
                  color: "#84cc16",
                },
                {
                  country: "China",
                  pct: 38,
                  source: "Fastest growing",
                  color: "#f59e0b",
                },
                {
                  country: "USA",
                  pct: 28,
                  source: "Wind + Solar surge",
                  color: "#f59e0b",
                },
                {
                  country: "India",
                  pct: 27,
                  source: "Solar expansion",
                  color: "#f97316",
                },
                {
                  country: "Saudi Arabia",
                  pct: 6,
                  source: "Vision 2030 solar",
                  color: "#ef4444",
                },
                {
                  country: "World avg.",
                  pct: 34,
                  source: "IEA 2026",
                  color: "#3b82f6",
                },
              ].map((row) => (
                <div key={row.country} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-sans w-24 shrink-0 font-semibold truncate"
                    style={{ color: headText }}
                  >
                    {row.country}
                  </span>
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold font-mono w-8 text-right shrink-0"
                    style={{ color: row.color }}
                  >
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl px-3 py-2.5 mt-1"
              style={{ background: "#22c55e12", border: "1px solid #22c55e25" }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: "#22c55e" }}
              >
                Solar capacity has grown ×350 since 2010
              </p>
              <p
                className="text-[9px] font-sans mt-0.5"
                style={{ color: mutedText }}
              >
                Cost of solar PV fell 92% over the same period · IEA 2026
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: IEA World Energy Outlook 2026 / IRENA 2026
            </p>
          </div>

          {/* Extreme Weather Events */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Extreme Weather
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Climate Disaster Statistics 2025–2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Billion-dollar disasters (2025)",
                  value: "34",
                  color: "#ef4444",
                },
                {
                  label: "Economic losses (2025)",
                  value: "$320B",
                  color: "#dc2626",
                },
                {
                  label: "Flood events (2025)",
                  value: "198",
                  color: "#3b82f6",
                },
                {
                  label: "Wildfires (2025, global)",
                  value: "341K",
                  color: "#f97316",
                },
                {
                  label: "Extreme heat days (US 2026)",
                  value: "+18%",
                  color: "#f59e0b",
                },
                {
                  label: "Cat. 4–5 hurricanes (2025)",
                  value: "11",
                  color: "#dc2626",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  event: "Canada Wildfires 2023",
                  impact: "18.5M ha burned — largest ever",
                  color: "#f97316",
                },
                {
                  event: "Valencia Floods (Oct 2024)",
                  impact: "230+ dead — deadliest EU flood in decades",
                  color: "#3b82f6",
                },
                {
                  event: "LA Wildfires Jan 2025",
                  impact: "Palisades & Eaton fires — $135B damage",
                  color: "#ef4444",
                },
                {
                  event: "India Heat Wave 2026",
                  impact: "53.4°C in Rajasthan — new record",
                  color: "#f59e0b",
                },
                {
                  event: "Brazil Floods 2024",
                  impact: "Rio Grande do Sul — 150+ dead, 400K displaced",
                  color: "#06b6d4",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.event}
                  className="flex items-start gap-2.5 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ background: row.color }}
                  />
                  <div>
                    <p
                      className="text-[10px] font-bold font-sans"
                      style={{ color: headText }}
                    >
                      {row.event}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}>{decodeEntities(row.impact)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: NOAA NCEI / Munich Re NatCatSERVICE / EM-DAT 2026
            </p>
          </div>

          {/* Water Stress & Access */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Water Stress &amp; Access
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Global Freshwater Security 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "People under high water stress",
                  value: "3.6B",
                  color: "#ef4444",
                },
                {
                  label: "Without safe drinking water",
                  value: "2.2B",
                  color: "#dc2626",
                },
                {
                  label: "Without basic sanitation",
                  value: "3.5B",
                  color: "#f97316",
                },
                {
                  label: "Aquifers under depletion threat",
                  value: "~37",
                  color: "#f59e0b",
                },
                {
                  label: "Annual freshwater withdrawal",
                  value: "4,000 km³",
                  color: "#3b82f6",
                },
                {
                  label: "Ag share of water use",
                  value: "70%",
                  color: "#22c55e",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  country: "Qatar",
                  stress: 98,
                  note: "Extremely high baseline stress",
                },
                {
                  country: "Israel",
                  stress: 95,
                  note: "Desalination-dependent",
                },
                {
                  country: "Lebanon",
                  stress: 90,
                  note: "Infrastructure collapse",
                },
                { country: "India", stress: 83, note: "Groundwater crisis" },
                {
                  country: "South Africa",
                  stress: 72,
                  note: "Cape Town day-zero event",
                },
                { country: "USA", stress: 41, note: "West/Southwest critical" },
              ].map((row, i, arr) => (
                <div
                  key={row.country}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.country}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.stress}%`,
                          background:
                            row.stress > 80
                              ? "#ef4444"
                              : row.stress > 55
                                ? "#f97316"
                                : "#f59e0b",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-6 text-right"
                      style={{
                        color:
                          row.stress > 80
                            ? "#ef4444"
                            : row.stress > 55
                              ? "#f97316"
                              : "#f59e0b",
                      }}
                    >
                      {row.stress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: WRI Aqueduct 4.0 / WHO/UNICEF JMP 2026 / FAO AQUASTAT
            </p>
          </div>
        </div>

        {/* Row 4 — CO2 Emissions + Biodiversity + Soil Degradation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* CO2 Emissions by Country */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              CO₂ Emissions
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Top Emitters &amp; Per-Capita 2025
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {[
                {
                  country: "China",
                  total: 12.4,
                  perCap: 8.7,
                  pct: 31,
                  color: "#ef4444",
                },
                {
                  country: "USA",
                  total: 4.8,
                  perCap: 14.2,
                  pct: 12,
                  color: "#f97316",
                },
                {
                  country: "India",
                  total: 3.2,
                  perCap: 2.2,
                  pct: 8,
                  color: "#f59e0b",
                },
                {
                  country: "Russia",
                  total: 1.8,
                  perCap: 12.4,
                  pct: 4,
                  color: "#f97316",
                },
                {
                  country: "Japan",
                  total: 1.0,
                  perCap: 8.3,
                  pct: 3,
                  color: "#f59e0b",
                },
                {
                  country: "Germany",
                  total: 0.6,
                  perCap: 7.2,
                  pct: 2,
                  color: "#84cc16",
                },
                {
                  country: "Saudi Arabia",
                  total: 0.8,
                  perCap: 20.1,
                  pct: 2,
                  color: "#f59e0b",
                },
                {
                  country: "EU-27",
                  total: 2.4,
                  perCap: 5.4,
                  pct: 6,
                  color: "#22c55e",
                },
                {
                  country: "Indonesia",
                  total: 0.7,
                  perCap: 2.5,
                  pct: 2,
                  color: "#f59e0b",
                },
                {
                  country: "South Korea",
                  total: 0.6,
                  perCap: 11.8,
                  pct: 2,
                  color: "#f97316",
                },
                {
                  country: "Brazil",
                  total: 0.5,
                  perCap: 2.3,
                  pct: 1,
                  color: "#84cc16",
                },
                {
                  country: "Mexico",
                  total: 0.4,
                  perCap: 3.1,
                  pct: 1,
                  color: "#22c55e",
                },
              ].map((row) => (
                <div key={row.country} className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-sans w-24 shrink-0 font-semibold truncate"
                    style={{ color: headText }}
                  >
                    {row.country}
                  </span>
                  <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.07)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.pct * 3}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] font-mono w-14 text-right shrink-0"
                    style={{ color: row.color }}
                  >
                    {row.total} Gt
                  </span>
                </div>
              ))}
            </div>
            <div
              className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
              style={{
                background: isLight
                  ? "rgba(0,0,0,0.025)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${gridLine}`,
              }}
            >
              <p
                className="text-[10px] font-bold font-sans"
                style={{ color: headText }}
              >
                Global total 2025: 37.8 Gt CO₂ — new record
              </p>
              <p className="text-[9px] font-sans" style={{ color: mutedText }}>
                Carbon Budget: ~180 Gt remaining for 1.5°C (7 yrs at current
                pace)
              </p>
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: Global Carbon Project 2025 / IEA 2026
            </p>
          </div>

          {/* Biodiversity Loss */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Biodiversity
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Species Loss &amp; Ecosystem Health 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Species at risk of extinction",
                  value: "44,000+",
                  color: "#dc2626",
                },
                {
                  label: "Vertebrate pop. decline 1970–2020",
                  value: "−69%",
                  color: "#ef4444",
                },
                {
                  label: "Insect pop. decline (global)",
                  value: "−45%",
                  color: "#f97316",
                },
                {
                  label: "Coral reef loss since 1950s",
                  value: "−50%",
                  color: "#f59e0b",
                },
                {
                  label: "Wetlands lost since 1700",
                  value: "−35%",
                  color: "#3b82f6",
                },
                {
                  label: "Mangrove loss since 1980",
                  value: "−25%",
                  color: "#10b981",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                { group: "Amphibians", threatened: 41, color: "#ef4444" },
                { group: "Sharks & Rays", threatened: 37, color: "#f97316" },
                { group: "Freshwater fish", threatened: 33, color: "#3b82f6" },
                { group: "Mammals", threatened: 26, color: "#f59e0b" },
                { group: "Birds", threatened: 14, color: "#84cc16" },
              ].map((row, i, arr) => (
                <div
                  key={row.group}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-[10px] font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {row.group}
                      </p>
                      <p
                        className="text-[10px] font-bold font-mono"
                        style={{ color: row.color }}
                      >
                        {row.threatened}% threatened
                      </p>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.threatened * 2.4}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: IUCN Red List 2026 / WWF Living Planet Report 2024
            </p>
          </div>

          {/* Soil Degradation & Food Security */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-0.5"
              style={{ color: mutedText }}
            >
              Soil &amp; Food Security
            </p>
            <h3
              className="text-sm font-bold font-sans mb-3"
              style={{ color: headText }}
            >
              Land Degradation &amp; Hunger 2026
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Degraded land globally",
                  value: "3.2B ha",
                  color: "#a16207",
                },
                {
                  label: "Topsoil lost per year",
                  value: "24 Gt",
                  color: "#b45309",
                },
                {
                  label: "People facing food insecurity",
                  value: "733M",
                  color: "#ef4444",
                },
                {
                  label: "Undernourished globally",
                  value: "9.2%",
                  color: "#f97316",
                },
                {
                  label: "Loss from land degradation/yr",
                  value: "$6.3T",
                  color: "#dc2626",
                },
                {
                  label: "Soil carbon loss (est. historic)",
                  value: "~133 Gt",
                  color: "#78716c",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${gridLine}`,
                  }}
                >
                  <p
                    className="text-[16px] font-bold font-mono"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className="text-[9px] font-sans leading-tight"
                    style={{ color: mutedText }}
                  >
                    {kpi.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0">
              {[
                {
                  region: "Sub-Saharan Africa",
                  hunger: 22,
                  note: "Rising conflict + drought",
                },
                {
                  region: "South Asia",
                  hunger: 16,
                  note: "Climate-driven crop failures",
                },
                {
                  region: "SE Asia",
                  hunger: 9,
                  note: "Improving but vulnerable",
                },
                {
                  region: "Latin America",
                  hunger: 8,
                  note: "Inequality-driven",
                },
                {
                  region: "Near East/N. Africa",
                  hunger: 12,
                  note: "Water scarcity primary driver",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.region}
                  className="flex items-center gap-3 py-2"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${gridLine}` : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-semibold font-sans"
                      style={{ color: headText }}
                    >
                      {row.region}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {row.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.hunger * 4}%`,
                          background:
                            row.hunger > 15
                              ? "#ef4444"
                              : row.hunger > 10
                                ? "#f97316"
                                : "#f59e0b",
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono w-8 text-right"
                      style={{
                        color:
                          row.hunger > 15
                            ? "#ef4444"
                            : row.hunger > 10
                              ? "#f97316"
                              : "#f59e0b",
                      }}
                    >
                      {row.hunger}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="text-[9px] font-sans mt-3"
              style={{ color: mutedText }}
            >
              Source: FAO SOFO 2026 / UNCCD / WFP Global Report on Food Crises
              2026
            </p>
          </div>
        </div>

        {/* ── MEASURED NOW ──────────────────────────────────────────────
            The readings the monitoring agencies publish, each with the month
            it belongs to and the same measure ten years earlier. A figure like
            "429 ppm" says nothing on its own about which way it is going.

            It sits at the foot of the page, after the boundaries themselves:
            it is the evidence underneath them, not the headline. As twelve
            cards it ran to most of a screen, so it is a table now — one row
            per reading, the numbers in columns that line up down the page
            rather than restating "ppm" and "a decade earlier" twelve times. */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Measured now — greenhouse gases, warming and ice
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              retrieved {CLIMATE_RETRIEVED}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  {["Reading", "Latest", "Period", "vs a decade earlier", "Source"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`text-[9px] font-sans uppercase tracking-widest text-muted-foreground font-medium pb-1.5 ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {CLIMATE_INDICATORS.map((ind: ClimateIndicator) => {
                  const change =
                    ind.decadeAgo === null ? null : ind.value - ind.decadeAgo;
                  /* Less ice is the bad direction; for every other reading here
                     it is more. The colour follows the measure, not the sign. */
                  const worseWhenUp = ind.id !== "sea-ice";
                  const worse =
                    change === null ? null : worseWhenUp ? change > 0 : change < 0;
                  return (
                    <tr
                      key={ind.id}
                      className="border-b border-border/40 last:border-0 align-top"
                    >
                      <td className="py-2 pr-3">
                        <p className="text-[11px] font-sans text-foreground leading-snug">
                          {ind.label}
                        </p>
                        {ind.note && (
                          <p className="text-[9px] font-sans text-muted-foreground leading-snug mt-0.5 max-w-prose">
                            {ind.note}
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <span className="text-sm font-bold font-mono text-foreground">
                          {ind.value}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-1">
                          {ind.unit}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap text-[10px] font-mono text-muted-foreground">
                        {ind.period}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap text-[10px] font-mono">
                        {change === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            <span className={worse ? "text-red-500" : "text-emerald-500"}>
                              {change > 0 ? "+" : ""}
                              {Math.abs(change) < 1
                                ? change.toFixed(2)
                                : change.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground"> from {ind.decadeAgo}</span>
                          </>
                        )}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <a
                          href={ind.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-sans text-muted-foreground underline decoration-dotted hover:text-foreground"
                        >
                          {ind.source}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 border-t border-border mt-2">
          <p className="text-[11px] font-sans text-muted-foreground">
            © {new Date().getFullYear()} CommonSphere · Planetary Boundaries ·
            Sources: Rockström et al., IPCC, IPBES, Stockholm Resilience Centre
          </p>
        </div>
      </div>
    </div>
  );
}
