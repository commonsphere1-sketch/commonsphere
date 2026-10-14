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
 * A country pressed on the map, or in the lists beside it, fills the panels
 * under the map with its own figures (CountryDashboard), as asked; the page
 * opens on the United States.
 */
import { useMemo, useState } from "react";
import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES } from "../data/worldview";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { countryForFeature } from "../data/mapJoin";
import { useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import CountryDashboard from "./CountryDashboard";

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
  return [{ name: c?.name ?? f.properties.name, code: c?.code ?? null, d }];
});
/** How many countries the map draws: small islands are too small to draw at this scale, and are not counted. */
const DRAWN = new Set(SHAPES.flatMap((s) => (s.code ? [s.code] : []))).size;
/** How strongly each fifth is shaded, the lowest figures first. */
const STEPS = [0.18, 0.34, 0.52, 0.72, 0.95];

export default function WorldviewMap() {
  const t = useTokens();
  const [id, setId] = useState(MEASURES[0].id);
  const [hover, setHover] = useState<string | null>(null);
  /** The country whose figures fill the panels under the map. */
  const [picked, setPicked] = useState("US");
  const m = MEASURES.find((x) => x.id === id)!;
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
  const top = ranked[0]?.v ?? 1;
  const List = ({ title, rows }: { title: string; rows: typeof ranked }) => (
    <div>
      <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li
            key={r.code}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 cursor-pointer rounded px-1 -mx-1"
            style={{ background: r.code === picked ? t.tile : undefined }}
            onMouseEnter={() => setHover(r.code)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setPicked(r.code)}
          >
            <span className="text-[11px] font-sans truncate" style={{ color: t.headText }}>
              {r.name}
            </span>
            <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color: t.headText }}>
              {m.fmt(r.v)}
            </span>
            <span className="col-span-2 h-1 rounded-full overflow-hidden" style={{ background: t.gridLine }} aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${Math.max(2, (r.v / top) * 100)}%`, background: m.color }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
  const pickedName = SHAPES.find((s) => s.code === picked)?.name ?? picked;
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
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`World map shaded by ${m.label.toLowerCase()}, ${m.unit}`}>
            <path d={SPHERE} fill={t.isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.015)"} stroke={t.gridLine} />
            <path d={GRID} fill="none" stroke={t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"} strokeWidth={0.6} />
            {SHAPES.map((s, i) => {
              const r = s.code ? shaded.get(s.code) : undefined;
              const on = (hover !== null && hover === s.code) || s.code === picked;
              return (
                <path
                  key={`${s.name}-${i}`}
                  d={s.d}
                  className={s.code ? "cursor-pointer" : undefined}
                  onClick={() => s.code && setPicked(s.code)}
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
          {/* What the pointer is on, in the map's corner. */}
          <div className="absolute left-4 bottom-4 rounded-lg px-3 py-2 text-[11px] font-sans" style={{ background: t.tooltipBg, border: t.cardBorder, color: t.headText }}>
            {shown ? (
              <>
                <span className="font-semibold">{shown.name}</span>{" "}
                <span className="font-mono">{shownReading ? `${m.fmt(shownReading.v)} · ${shownReading.y}` : "no figure held"}</span>
              </>
            ) : (
              <span style={{ color: t.mutedText }}>Point at a country · press it to fill the panels below</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4 border-t lg:border-t-0 lg:border-l" style={{ borderColor: t.gridLine }}>
          <div>
            <p className="text-sm font-bold font-sans" style={{ color: t.headText }}>
              {m.label}
            </p>
            <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
              {m.unit} · {held} of the {DRAWN} countries drawn have a figure
            </p>
          </div>
          <List title={m.better === "low" ? "Highest - worst" : m.better === "high" ? "Highest - best" : "Highest"} rows={ranked.slice(0, 6)} />
          <List title={m.better === "low" ? "Lowest - best" : m.better === "high" ? "Lowest - worst" : "Lowest"} rows={ranked.slice(-6).reverse()} />
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
          Each country's latest figure, with its year on pointing at it; the shading is which fifth of the {held} countries with a figure it falls in, worked out here. The smallest islands are too small to draw at this scale.
        </p>
        <SourceLink sources={[m.source, { label: "Natural Earth, via world-atlas — country outlines (public domain)", url: "https://github.com/topojson/world-atlas" }]} />
      </div>
    </section>
    {/* The country picked: its own figures, filled in under the map. */}
    <CountryDashboard code={picked} name={pickedName} measure={m} ranked={ranked} />
    </>
  );
}
