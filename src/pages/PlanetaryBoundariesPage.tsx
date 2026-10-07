import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
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
import { FIGURE_CARDS, type FigureCard } from "../data/climateFigures";
import { LIFE_CARDS, LIFE_CHECKED } from "../data/lifeOnEarth";
import { EndangeredSpeciesList, NewSpeciesList } from "../components/SpeciesLists";
import { ClimateExplorer } from "../components/ClimateExplorer";
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

/* ─── Figure card ───────────────────────────────────────────────────────── */
function FigureCardView({
  card,
  isLight,
  headText,
  mutedText,
  gridLine,
}: {
  card: FigureCard;
  isLight: boolean;
  headText: string;
  mutedText: string;
  gridLine: string;
}) {
  const tile = isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.04)";
  const track = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
      <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: mutedText }}>
        {card.kicker}
      </p>
      <h3 className="text-sm font-bold font-sans mb-3" style={{ color: headText }}>
        {card.title}
      </h3>

      {card.figures && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {card.figures.map((f) => (
            <div key={f.label} className="rounded-xl px-3 py-2.5" style={{ background: tile, border: `1px solid ${gridLine}` }}>
              <p className="text-[15px] font-bold font-mono leading-tight" style={{ color: headText }}>
                {f.value}
              </p>
              <p className="text-[9px] font-sans leading-tight mt-0.5" style={{ color: mutedText }}>
                {f.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {card.bars && (
        <div className="mb-3">
          <div className="flex flex-col gap-2">
            {card.bars.rows.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-[9px] font-sans w-28 shrink-0 font-semibold leading-tight" style={{ color: headText }}>
                  {r.label}
                </span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: track }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (r.value / card.bars!.max) * 100)}%`, background: r.color }} />
                </div>
                <span className="text-[10px] font-bold font-mono text-right shrink-0 whitespace-nowrap" style={{ color: headText }}>
                  {r.display}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-sans mt-2" style={{ color: mutedText }}>
            {card.bars.caption}
          </p>
        </div>
      )}

      {card.events && (
        <div className="flex flex-col gap-0 mb-3">
          {card.events.map((e, i) => (
            <div
              key={e.title}
              className="py-2"
              style={{ borderBottom: i < card.events!.length - 1 ? `1px solid ${gridLine}` : "none" }}
            >
              <p className="text-[10px] font-bold font-sans" style={{ color: headText }}>
                {e.title}
              </p>
              <p className="text-[9px] font-sans" style={{ color: mutedText }}>
                {e.detail}
              </p>
            </div>
          ))}
        </div>
      )}

      {card.callout && (
        <div className="rounded-xl px-3 py-2.5 mb-1" style={{ background: card.callout.color + "12", border: `1px solid ${card.callout.color}25` }}>
          <p className="text-[10px] font-bold font-sans" style={{ color: card.callout.color }}>
            {card.callout.title}
          </p>
          <p className="text-[9px] font-sans mt-0.5" style={{ color: mutedText }}>
            {card.callout.body}
          </p>
        </div>
      )}

      <p className="text-[9px] font-sans mt-auto pt-3" style={{ color: mutedText }}>
        Source:{" "}
        {card.sources.map((src, k) => (
          <span key={src.url}>
            {k > 0 && " · "}
            <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:opacity-80">
              {src.label}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export function PlanetaryBoundariesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedId, setSelectedId] = useState<string>("climate");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleNote = (key: string) =>
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const mutedText = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
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
          subject={SUBJECT.climate}
          days={5}
          className="mb-6"
          note={(outlets) => (
            <>
              The last five days' climate headlines from {outlets} (five at most from each), refreshed every half hour. The tag is the
              place a story is about, violet for more than one. Each links to the outlet.
            </>
          )}
        />

        {/* ── The page's explorer: everything it holds, as a list beside a detail ── */}
        <ClimateExplorer
          onOpenBoundary={(id) => {
            setSelectedId(id);
            document.getElementById("boundaries")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
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
        <div id="boundaries" className="bg-card border border-border rounded-2xl p-4 mb-6 scroll-mt-24">
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

        {/* ── LIFE ON EARTH ────────────────────────────────────────────────
            Species found and lost, ecosystems recovering and dying, and what
            ecological projects have done; see data/lifeOnEarth.ts. */}
        <div id="life" className="flex items-center gap-3 mb-2 scroll-mt-24">
          <Leaf size={16} weight="fill" className="text-emerald-500" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-500">Life on Earth: species, ecosystems and ecological projects</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <p className="text-[11px] font-sans mb-4 max-w-4xl" style={{ color: mutedText }}>
          Species discovered and species lost, ecosystems that are recovering and ecosystems that are dying, and what the projects meant to protect them have done. Each
          figure is from the source its card links to, read on {LIFE_CHECKED}; where a source gives no figure, the card says so.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {LIFE_CARDS.map((card) => (
            <FigureCardView key={card.id} card={card} isLight={isLight} headText={headText} mutedText={mutedText} gridLine={gridLine} />
          ))}
          {/* The species themselves: those newly named, and those endangered with about how many are left. */}
          <NewSpeciesList />
          <EndangeredSpeciesList />
        </div>

        {/* ── PUBLIC ENVIRONMENTAL DATA ────────────────────────────────────
            Twelve cards of the figures people look up most, each from the
            source it links to; see data/climateFigures.ts. */}
        <div className="flex items-center gap-3 mb-4">
          <Globe size={16} weight="fill" className="text-sky-500" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-500">
            Most Publicly Inquired Environmental Data
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {FIGURE_CARDS.map((card) => (
            <FigureCardView key={card.id} card={card} isLight={isLight} headText={headText} mutedText={mutedText} gridLine={gridLine} />
          ))}
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
            every figure links to its source
          </p>
        </div>
      </div>
    </div>
  );
}
