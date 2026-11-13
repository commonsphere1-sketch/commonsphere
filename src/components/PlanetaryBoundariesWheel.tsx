/**
 * The planetary boundaries wheel, as asked moved from the Climate page to the Dashboard and merged there into its Climate card: the Planetary Health Check 2026's
 * nine boundaries, each wedge reaching as far as its most transgressed measure, with what the framework is and how the
 * wheel is drawn; a wedge pressed is read under the wheel - its verdict and measures in the report's own words.
 */
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { BOUNDARIES, PHC_2026, TRANSGRESSED, position, type ControlVariable, type PlanetaryBoundary, type Zone } from "../data/planetaryBoundaries";

/* ─── Zones, as the Planetary Health Check names them ───────────────────── */
const ZONE: Record<Zone, { label: string; color: string }> = {
  safe: { label: "Within the boundary", color: "#22c55e" },
  increasing: { label: "Zone of increasing risk", color: "#f59e0b" },
  high: { label: "High-risk zone", color: "#ef4444" },
};

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

/** The wheel, its zones and the boundary pressed on it - for a card to hold (the Dashboard's Climate card). */
export function BoundariesWheel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedId, setSelectedId] = useState<string>("climate");
  const chosen = BOUNDARIES.find((b) => b.id === selectedId) ?? BOUNDARIES[0];
  return (
    <div className="flex flex-col">
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
      Press one to read it below.
    </p>
    <PlanetaryBoundariesRadialChart selected={selectedId} onSelect={setSelectedId} isLight={isLight} />
    {/* The boundary chosen on the wheel: its verdict and its measures, in the report's words. */}
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-[12px] font-semibold font-sans text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ZONE[chosen.zone].color }} aria-hidden />
        {chosen.name}
        <span className="text-[10px] font-mono font-normal" style={{ color: ZONE[chosen.zone].color }}>
          {ZONE[chosen.zone].label}
        </span>
      </p>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-1">{chosen.verdict}</p>
      <ul className="mt-1.5 space-y-0.5">
        {chosen.variables.map((v) => (
          <li key={v.name} className="text-[10px] font-mono text-muted-foreground">
            {v.name}: <span className="text-foreground font-semibold">{v.current}{v.unit && !v.unit.startsWith("%") ? " " : ""}{v.unit}</span> · boundary {v.boundary}
            {v.highRisk != null ? ` · high risk ${v.highRisk}` : ""}
            {v.regional ? " · regional" : ""}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}

/** What the framework is, and how the wheel is drawn. */
export function BoundariesAbout() {
  return (
  <div className="flex flex-col gap-3 text-[11px] font-sans leading-relaxed text-muted-foreground">
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
  );
}
