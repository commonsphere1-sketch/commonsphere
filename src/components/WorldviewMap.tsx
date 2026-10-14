/**
 * The Worldview page's map: the world, country by country, across the top of
 * the page - as the reference design the page was set after has its map, in
 * the site's own colours. A measure is picked from the chips; each country is
 * shaded by which fifth of the countries with the figure it falls in, and the
 * column beside the map lists the highest and the lowest, with their bars.
 *
 * Every figure is its publisher's, read from data the site already holds,
 * each with its year: Freedom House's scores, the World Bank's deaths before
 * age five and migrants' share of people, UN Tourism's arrivals, and the World
 * Bank's PM2.5 exposure. The fifths are worked out here from those figures.
 * A country with no figure is left grey and counted.
 *
 * It zooms as the Dashboard's map does: the wheel or a pinch draws it closer
 * about the pointer (a turn that would change nothing scrolls the page), a
 * drag moves it, the buttons step it in and out and back to the whole, and
 * pressing a country glides to it.
 *
 * Beside the map, the headline figures of the country picked, as asked -
 * where the measure's highest and lowest stood; the bars under the map's
 * panels still rank every country on the measure.
 *
 * A country pressed on the map fills the panels
 * under the map with its own figures (CountryDashboard), as asked; the page
 * opens on the United States.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, Minus, Plus } from "@phosphor-icons/react";
import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES } from "../data/worldview";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { countryForFeature } from "../data/mapJoin";
import { useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import CountryDashboard, { headlineOf } from "./CountryDashboard";

type Reading = { v: number; y: string };
type Measure = {
  id: string;
  label: string;
  unit: string;
  color: string;
  /** Which way is better, where one is: the list says "highest" and "lowest" either way. */
  better: "high" | "low" | null;
  read: (cc: string) => Reading | null;
  fmt: (v: number) => string;
  source: { label: string; url: string };
};
const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : String(Math.round(v)));
const pair = (r: [number, number] | undefined): Reading | null => (r ? { v: r[1], y: String(r[0]) } : null);
const MEASURES: Measure[] = [
  {
    id: "freedom",
    label: "Freedom",
    unit: "score out of 100, Freedom House",
    color: "#2a78d6",
    better: "high",
    read: (cc) => {
      const f = COUNTRY_FIGURES.freedom[cc];
      return f ? { v: f[1], y: String(f[0]) } : null;
    },
    fmt: (v) => String(Math.round(v)),
    source: COUNTRY_FIGURE_SOURCES.freedom,
  },
  {
    id: "childMortality",
    label: "Deaths before five",
    unit: "per 1,000 live births, World Bank",
    color: "#ef4444",
    better: "low",
    read: (cc) => pair(COUNTRY_FIGURES.childMortality[cc]),
    fmt: (v) => v.toFixed(1),
    source: COUNTRY_FIGURE_SOURCES.childMortality,
  },
  {
    id: "migrantShare",
    label: "Migrants",
    unit: "% of people born in another country, World Bank",
    color: "#8b5cf6",
    better: null,
    read: (cc) => pair(COUNTRY_FIGURES.migrantShare[cc]),
    fmt: (v) => `${v.toFixed(1)}%`,
    source: COUNTRY_FIGURE_SOURCES.migrantShare,
  },
  {
    id: "arrivals",
    label: "Tourist arrivals",
    unit: "international overnight arrivals, UN Tourism",
    color: "#f59e0b",
    better: null,
    read: (cc) => pair(COUNTRY_FIGURES.arrivals[cc]),
    fmt: compact,
    source: COUNTRY_FIGURE_SOURCES.arrivals,
  },
  {
    id: "pm25",
    label: "Air pollution",
    unit: "PM2.5, µg/m³ breathed on average, World Bank",
    color: "#10b981",
    better: "low",
    read: (cc) => {
      const a = AIR_QUALITY[cc];
      return a ? { v: a.pm25, y: String(a.year) } : null;
    },
    fmt: (v) => String(Math.round(v)),
    source: { label: AIR_QUALITY_SOURCE.label, url: AIR_QUALITY_SOURCE.url },
  },
];

const W = 960;
const H = 470;
const topo = worldTopo as unknown as Topology;
const WORLD = feature(topo, topo.objects.countries as never) as unknown as { features: { properties: { name: string } }[] };
const PROJECTION = geoEqualEarth().fitExtent(
  [
    [6, 6],
    [W - 6, H - 6],
  ],
  { type: "Sphere" } as never,
);
const PATH = geoPath(PROJECTION);
const SPHERE = PATH({ type: "Sphere" } as never) ?? "";
const GRID = PATH(geoGraticule10() as never) ?? "";
/** Each shape once: its outline, and the country of the site's it is. */
const SHAPES = WORLD.features.flatMap((f) => {
  const d = PATH(f as never);
  if (!d || f.properties.name === "Antarctica") return [];
  const c = countryForFeature(f.properties.name);
  return [{ name: c?.name ?? f.properties.name, code: c?.code ?? null, d, b: PATH.bounds(f as never) }];
});
/** How many countries the map draws: small islands are too small to draw at this scale, and are not counted. */
const DRAWN = new Set(SHAPES.flatMap((s) => (s.code ? [s.code] : []))).size;
/** As close as the map is drawn: twelve times the whole. */
const MAX_K = 12;
/** How strongly each fifth is shaded, the lowest figures first. */
const STEPS = [0.18, 0.34, 0.52, 0.72, 0.95];

export default function WorldviewMap() {
  const t = useTokens();
  const [id, setId] = useState(MEASURES[0].id);
  const [hover, setHover] = useState<string | null>(null);
  /** The country whose figures fill the panels under the map. */
  const [picked, setPicked] = useState("US");
  const m = MEASURES.find((x) => x.id === id)!;
  /* How close the map is drawn and where its middle is, in the map's own units - 1 is the whole of it - as the Dashboard's map does. */
  const [view, setView] = useState({ k: 1, x: W / 2, y: H / 2 });
  const keep = (k: number, x: number, y: number) => {
    const z = Math.max(1, Math.min(MAX_K, k));
    const hw = W / (2 * z);
    const hh = H / (2 * z);
    return { k: z, x: Math.max(hw, Math.min(W - hw, x)), y: Math.max(hh, Math.min(H - hh, y)) };
  };
  const viewRef = useRef(view);
  viewRef.current = view;
  const gliding = useRef<number | null>(null);
  /* A glide over a fifth of a second, eased, closer and further by equal steps of scale; at once in a tab not being drawn. */
  const glideTo = useCallback((to: { k: number; x: number; y: number }) => {
    if (gliding.current !== null) cancelAnimationFrame(gliding.current);
    const from = viewRef.current;
    const target = keep(to.k, to.x, to.y);
    if (document.hidden) return setView(target);
    let began: number | null = null;
    const tick = (now: number) => {
      if (began === null) began = now;
      const p = Math.min(1, (now - began) / 220);
      const e = 1 - Math.pow(1 - p, 3);
      const k = Math.exp(Math.log(from.k) + (Math.log(target.k) - Math.log(from.k)) * e);
      setView(keep(k, from.x + (target.x - from.x) * e, from.y + (target.y - from.y) * e));
      gliding.current = p < 1 ? requestAnimationFrame(tick) : null;
    };
    gliding.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => void (gliding.current !== null && cancelAnimationFrame(gliding.current)), []);
  const svgRef = useRef<SVGSVGElement | null>(null);
  /* The wheel and a pinch draw it closer or further about the pointer; a turn that would change nothing scrolls the page. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      const closer = e.deltaY < 0;
      const k0 = viewRef.current.k;
      if (e.deltaY === 0 || (closer ? k0 >= MAX_K : k0 <= 1)) return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const notches = Math.min(4, Math.abs(e.deltaY) * (e.deltaMode === 1 ? 1 / 3 : e.deltaMode === 2 ? 1 : 1 / 100));
      const factor = Math.pow(1.25, closer ? notches : -notches);
      setView((v) => {
        const k = Math.max(1, Math.min(MAX_K, v.k * factor));
        const px = v.x - W / (2 * v.k) + ((e.clientX - r.left) / r.width) * (W / v.k);
        const py = v.y - H / (2 * v.k) + ((e.clientY - r.top) / r.height) * (H / v.k);
        return keep(k, px - (px - v.x) * (v.k / k), py - (py - v.y) * (v.k / k));
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);
  /* A drag moves a map drawn closer; the press that ends a drag is not a press on a country. */
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  /** Picks a country, and glides to it. */
  const pick = (code: string) => {
    setPicked(code);
    const s = SHAPES.find((x) => x.code === code);
    if (!s) return;
    const [[x0, y0], [x1, y1]] = s.b;
    const k = Math.min(MAX_K, 0.8 * Math.min(W / Math.max(1, x1 - x0), H / Math.max(1, y1 - y0)));
    glideTo({ k: Math.max(1.4, k), x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
  };
  const { shaded, cuts, ranked, held } = useMemo(() => {
    const read = new Map<string, Reading>();
    for (const s of SHAPES) {
      if (!s.code) continue;
      const r = m.read(s.code);
      if (r && Number.isFinite(r.v)) read.set(s.code, r);
    }
    const values = [...read.values()].map((r) => r.v).sort((a, b) => a - b);
    // The four values that split the countries into fifths.
    const cuts = [1, 2, 3, 4].map((k) => values[Math.min(values.length - 1, Math.floor((values.length * k) / 5))]);
    const step = (v: number) => cuts.filter((c) => v >= c).length;
    const shaded = new Map([...read].map(([cc, r]) => [cc, { ...r, step: step(r.v) }]));
    const ranked = SHAPES.flatMap((s) => (s.code && read.has(s.code) ? [{ name: s.name, code: s.code, ...read.get(s.code)! }] : []))
      .filter((x, i, a) => a.findIndex((y) => y.code === x.code) === i)
      .sort((a, b) => b.v - a.v);
    return { shaded, cuts, ranked, held: read.size };
  }, [m]);
  const shown = hover ? SHAPES.find((s) => s.code === hover) : null;
  const shownReading = hover ? shaded.get(hover) : undefined;
  const pickedName = SHAPES.find((s) => s.code === picked)?.name ?? picked;
  const pickedReading = shaded.get(picked);
  const pickedRank = ranked.findIndex((r) => r.code === picked);
  const headline = headlineOf(picked);
  return (
    <>
    <section id="world-map" className="scroll-mt-36 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }} aria-label="The world, country by country">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
          The world, country by country
        </p>
        <div className="flex flex-wrap gap-1.5 ml-auto" role="group" aria-label="The measure the map is shaded by">
          {MEASURES.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === id}
              onClick={() => setId(x.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer ${x.id === id ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="relative p-3 min-w-0">
          <svg
            ref={svgRef}
            viewBox={`${view.x - W / (2 * view.k)} ${view.y - H / (2 * view.k)} ${W / view.k} ${H / view.k}`}
            className={`w-full h-auto block touch-none select-none ${view.k > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
            role="img"
            aria-label={`World map shaded by ${m.label.toLowerCase()}, ${m.unit}. Scroll or pinch to zoom, drag to move.`}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY, moved: false };
              dragged.current = false;
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || viewRef.current.k <= 1) return;
              const r = svgRef.current!.getBoundingClientRect();
              const dx = e.clientX - d.x;
              const dy = e.clientY - d.y;
              if (!d.moved && Math.hypot(dx, dy) < 4) return;
              d.moved = true;
              dragged.current = true;
              d.x = e.clientX;
              d.y = e.clientY;
              setView((v) => keep(v.k, v.x - (dx / r.width) * (W / v.k), v.y - (dy / r.height) * (H / v.k)));
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerLeave={() => {
              drag.current = null;
            }}
          >
            <path d={SPHERE} vectorEffect="non-scaling-stroke" fill={t.isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.015)"} stroke={t.gridLine} />
            <path d={GRID} vectorEffect="non-scaling-stroke" fill="none" stroke={t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"} strokeWidth={0.6} />
            {SHAPES.map((s, i) => {
              const r = s.code ? shaded.get(s.code) : undefined;
              const on = (hover !== null && hover === s.code) || s.code === picked;
              return (
                <path
                  key={`${s.name}-${i}`}
                  d={s.d}
                  className={s.code ? "cursor-pointer" : undefined}
                  vectorEffect="non-scaling-stroke"
                  onClick={() => {
                    if (dragged.current) return;
                    if (s.code) pick(s.code);
                  }}
                  fill={r ? m.color : t.isLight ? "#e5e7eb" : "#2a2a33"}
                  fillOpacity={r ? STEPS[r.step] : 1}
                  stroke={on ? t.headText : t.isLight ? "#ffffff" : "#0b0b0d"}
                  strokeWidth={on ? 1.2 : 0.4}
                  onMouseEnter={() => s.code && setHover(s.code)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{r ? `${s.name}: ${m.fmt(r.v)}, ${r.y}` : `${s.name}: no figure held`}</title>
                </path>
              );
            })}
          </svg>
          {/* Closer, further, and the whole map again - as the Dashboard's map has them. */}
          <div className="absolute right-4 top-4 flex flex-col gap-1">
            {(
              [
                ["Zoom in", <Plus key="p" size={13} weight="bold" />, () => glideTo({ ...viewRef.current, k: viewRef.current.k * 1.6 })],
                ["Zoom out", <Minus key="m" size={13} weight="bold" />, () => glideTo({ ...viewRef.current, k: viewRef.current.k / 1.6 })],
                ["The whole map", <ArrowCounterClockwise key="h" size={13} weight="bold" />, () => glideTo({ k: 1, x: W / 2, y: H / 2 })],
              ] as const
            ).map(([label, icon, act]) => (
              <button
                key={label}
                type="button"
                onClick={act}
                aria-label={label}
                title={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: t.tooltipBg, border: t.cardBorder, color: t.headText }}
              >
                {icon}
              </button>
            ))}
          </div>
          {/* What the pointer is on, in the map's corner. */}
          <div className="absolute left-4 bottom-4 rounded-lg px-3 py-2 text-[11px] font-sans" style={{ background: t.tooltipBg, border: t.cardBorder, color: t.headText }}>
            {shown ? (
              <>
                <span className="font-semibold">{shown.name}</span>{" "}
                <span className="font-mono">{shownReading ? `${m.fmt(shownReading.v)} · ${shownReading.y}` : "no figure held"}</span>
              </>
            ) : (
              <span style={{ color: t.mutedText }}>Scroll to zoom, drag to move · press a country for its figures</span>
            )}
          </div>
        </div>
        {/* The place picked, beside the map: its headline figures and where it stands on the measure. */}
        <div className="flex flex-col gap-3 p-4 border-t lg:border-t-0 lg:border-l" style={{ borderColor: t.gridLine }}>
          <div className="flex items-center gap-2.5">
            <img src={`https://flagcdn.com/w80/${picked.toLowerCase()}.png`} alt="" className="w-9 h-6 rounded object-cover shrink-0" style={{ border: t.cardBorder }} />
            <div className="min-w-0">
              <p className="text-sm font-bold font-sans leading-tight truncate" style={{ color: t.headText }}>
                {pickedName}
              </p>
              <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                picked on the map
              </p>
            </div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
              {m.label}
            </p>
            <p className="text-lg font-bold font-mono leading-tight" style={{ color: m.color }}>
              {pickedReading ? m.fmt(pickedReading.v) : "Not held"}
            </p>
            <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
              {pickedReading ? `${pickedReading.y} · ${pickedRank + 1} of ${held}, highest first` : m.unit}
            </p>
          </div>
          <ul className="flex flex-col">
            {headline.rows.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-2 py-1.5 border-b last:border-b-0" style={{ borderColor: t.gridLine }}>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: t.mutedText }}>
                  {r.label}
                </span>
                <span className="text-[12px] font-mono font-semibold text-right" style={{ color: t.headText }}>
                  {r.text}
                  {r.y && <span className="text-[9px] font-normal ml-1" style={{ color: t.mutedText }}>{r.y}</span>}
                </span>
              </li>
            ))}
          </ul>
          {headline.sources.length > 0 && <SourceLink sources={headline.sources} />}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t" style={{ borderColor: t.gridLine }}>
        <div className="flex items-center gap-1" aria-label="The fifths the map is shaded by">
          {STEPS.map((o, i) => (
            <span key={o} className="flex flex-col items-center gap-0.5">
              <span className="w-10 h-2 rounded-sm" style={{ background: m.color, opacity: o }} />
              <span className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                {i === 0 ? `< ${m.fmt(cuts[0])}` : i === 4 ? `≥ ${m.fmt(cuts[3])}` : `${m.fmt(cuts[i - 1])}+`}
              </span>
            </span>
          ))}
          <span className="flex flex-col items-center gap-0.5 ml-2">
            <span className="w-10 h-2 rounded-sm" style={{ background: t.isLight ? "#e5e7eb" : "#2a2a33" }} />
            <span className="text-[9px] font-mono" style={{ color: t.mutedText }}>
              none held
            </span>
          </span>
        </div>
        <p className="text-[10px] font-sans flex-1 min-w-[12rem]" style={{ color: t.mutedText }}>
          Each country's latest figure, with its year on pointing at it; the shading is which fifth of the {held} countries with a figure - of the {DRAWN} the map draws - it falls in, worked out here. The smallest islands are too small to draw at this scale.
        </p>
        <SourceLink sources={[m.source, { label: "Natural Earth, via world-atlas — country outlines (public domain)", url: "https://github.com/topojson/world-atlas" }]} />
      </div>
    </section>
    {/* The country picked: its own figures, filled in under the map. */}
    <CountryDashboard code={picked} name={pickedName} measure={m} ranked={ranked} />
    </>
  );
}
