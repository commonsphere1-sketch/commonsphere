/**
 * The Worldview page's map: the world, country by country, across the top of
 * the page - as the reference design the page was set after has its map, in
 * the site's own colours. It once had chips of measures to shade it by; they
 * and the shading were taken off, as asked, and every country is drawn alike.
 * The five measures stay, for the panel under the map that places the country
 * picked on each of them.
 *
 * Every figure is its publisher's, read from data the site already holds,
 * each with its year: Freedom House's scores, the World Bank's deaths before
 * age five and migrants' share of people, UN Tourism's arrivals, and the World
 * Bank's PM2.5 exposure. The places among the countries are worked out here.
 *
 * It is drawn as the World Maps page draws its maps: each country in its
 * flag's colour, translucent inside a bright edge of the same colour; with its states' and
 * provinces' borders, its counties' and districts' once the map is drawn
 * closer, and the cities - every one of 100,000 or more, GeoNames' - as
 * named points closer still.
 *
 * It zooms as the Dashboard's map does: the wheel or a pinch draws it closer
 * about the pointer (a turn that would change nothing scrolls the page), a
 * drag moves it, the buttons step it in and out and back to the whole, and
 * pressing a country glides to it.
 *
 * Beside the map, the country picked, as asked: its type of government, its
 * leaders, GDP, life expectancy, inflation and human development, its
 * languages, resources and energy (PickedColumn).
 *
 * A country pressed on the map fills the panels
 * under the map with its own figures (CountryDashboard), as asked; the page
 * opens on the United States.
 */
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { flagColor } from "../lib/flagColor";
import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES } from "../data/worldview";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { countryForFeature } from "../data/mapJoin";
import { NATIONAL_HEADS, REPRESENTATIVES_SOURCES } from "../data/representatives";
import { COUNTRY_LAW_HELD, COUNTRY_LAW_SOURCES, type CountryLawFile } from "../data/countryLaw";
import { COUNTRY_PEOPLE, COUNTRY_PEOPLE_SOURCES } from "../data/countryPeople";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { RESOURCE_PRODUCERS, type Share } from "../data/resourceProducers";
import { ENERGY_PRODUCERS } from "../data/energyProducers";
import { useTokens, type Tokens } from "./DataExplorer";
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
/** How solid a country is drawn, and the one picked or pointed at: the World Maps page's middle neon step, and a step up. */
const FILL = 0.42;
const FILL_ON = 0.6;
/** A country's ink: its flag's colour, or the page's accent where none is held. */
const inkOf = (code: string | null) => (code && flagColor(code)) || "#22d3ee";
/** Drawn this close, the counties' and districts' borders show; this close, the cities. */
const COUNTIES_FROM = 2.5;
const CITIES_FROM = 4;
/** The outline map's round buttons, for its zoom. */
const TOOL = "w-7 h-7 rounded-full border border-border bg-background/70 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default";

/** A share of world output as its publisher bounds it. */
const shareText = (s: Share) => `${s.bound === "atMost" ? "<" : s.bound === "atLeast" ? ">" : ""}${s.pct < 1 ? s.pct.toFixed(1) : Math.round(s.pct)}%`;
/** The commodities whose producers the site holds - USGS's minerals and the EIA's and OPEC's fuels - by name. */
const PRODUCED = Object.entries({ ...RESOURCE_PRODUCERS, ...ENERGY_PRODUCERS });

/**
 * The place picked, beside the map: what it is and who leads it, as asked - its type of government, its leaders, its GDP,
 * life expectancy, inflation and human development, the languages spoken in it, what it digs and pumps from the ground,
 * and the energy it makes. Every line is its publisher's: the CIA World Factbook's words for its government and its
 * languages; Wikipedia's list of current heads of state and government, which the site's World Leaders audit checks
 * (the page's own leaders explorer reads the same list); the World Bank's and UNDP's figures; the USGS's, the EIA's and
 * OPEC's tables of the largest producers; and the EIA's energy figures. A line with nothing held is left out.
 */
function PickedColumn({ code, name, t }: { code: string; name: string; t: Tokens }) {
  // Its type of government: the Factbook's words, from the law file the site keeps for each country.
  const [gov, setGov] = useState<{ code: string; type: string } | null>(null);
  useEffect(() => {
    let off = false;
    if (!COUNTRY_LAW_HELD.has(code)) return;
    fetch(`/law/${code}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: CountryLawFile) => {
        if (!off && j.gov?.type) setGov({ code, type: j.gov.type });
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [code]);
  const govType = gov?.code === code ? gov.type : null;
  // Each person once, with every office the list gives them (Saudi Arabia's crown prince is its prime minister too).
  const leaders = (NATIONAL_HEADS.find((r) => r[0] === code)?.[4] ?? []).reduce<{ who: string; titles: string[] }[]>((all, [, said]) => {
    const at = said.indexOf(" – ");
    const who = at < 0 ? said : said.slice(at + 3);
    const title = at < 0 ? "" : said.slice(0, at);
    const had = all.find((l) => l.who === who);
    if (had) had.titles.push(title);
    else all.push({ who, titles: [title] });
    return all;
  }, []);
  const head = headlineOf(code);
  const figures = head.rows.filter((r) => ["GDP", "Life expectancy", "Inflation", "Human development"].includes(r.label));
  const tongues = COUNTRY_PEOPLE[code]?.languages;
  const resources = PRODUCED.flatMap(([what, table]) => {
    const row = table.countries.find((c) => countryForFeature(c.name)?.code === code);
    return row?.productionShare && row.productionShare.pct > 0 ? [{ what, share: row.productionShare, year: table.productionYear, sources: table.sources }] : [];
  }).sort((a, b) => b.share.pct - a.share.pct);
  const energy = COUNTRY_ENERGY[code.toLowerCase()];
  const sources = [
    ...(govType ? [COUNTRY_LAW_SOURCES.factbook] : []),
    ...(tongues ? [COUNTRY_PEOPLE_SOURCES.factbook] : []),
    ...head.sources,
    ...resources.flatMap((r) => r.sources),
    ...(energy ? [{ label: ENERGY_SOURCE.label, url: ENERGY_SOURCE.url }] : []),
    ...(leaders.length ? [REPRESENTATIVES_SOURCES.list] : []),
  ].filter((s, i, a) => a.findIndex((x) => x.label === s.label) === i);
  const label = "text-[9px] font-mono uppercase tracking-widest";
  const Block = ({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1 py-2 border-b last:border-b-0" style={{ borderColor: t.gridLine }}>
      <p className={label} style={{ color: t.mutedText }}>
        {title}
        {meta && <span className="normal-case tracking-normal ml-1.5">{meta}</span>}
      </p>
      {children}
    </div>
  );
  return (
    <div className="flex flex-col gap-2 p-4 border-t lg:border-t-0 lg:border-l" style={{ borderColor: t.gridLine }}>
      <div className="flex items-center gap-2.5">
        <img src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`} alt="" className="w-9 h-6 rounded object-cover shrink-0" style={{ border: t.cardBorder }} />
        <div className="min-w-0">
          <p className="text-sm font-bold font-sans leading-tight truncate" style={{ color: t.headText }}>
            {name}
          </p>
          <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            picked on the map
          </p>
        </div>
      </div>
      <div className="flex flex-col">
        {govType && (
          <Block title="Government">
            <p className="text-[12px] font-sans font-semibold leading-snug first-letter:uppercase" style={{ color: t.headText }}>
              {govType}
            </p>
          </Block>
        )}
        {leaders.length > 0 && (
          <Block title="Leadership">
            {leaders.map((l) => (
              <p key={l.who} className="text-[12px] font-sans leading-snug">
                <span className="font-semibold" style={{ color: t.headText }}>
                  {l.who}
                </span>
                {l.titles.some(Boolean) && <span className="block text-[10px]" style={{ color: t.mutedText }}>{l.titles.filter(Boolean).join(" · ")}</span>}
              </p>
            ))}
          </Block>
        )}
        {figures.length > 0 && (
          <ul className="flex flex-col py-1 border-b" style={{ borderColor: t.gridLine }}>
            {figures.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-2 py-1">
                <span className={label} style={{ color: t.mutedText }}>
                  {r.label}
                </span>
                <span className="text-[12px] font-mono font-semibold text-right" style={{ color: t.headText }}>
                  {r.text}
                  {r.y && <span className="text-[9px] font-normal ml-1" style={{ color: t.mutedText }}>{r.y}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {tongues && (tongues.parts?.length || tongues.text) && (
          <Block title="Languages" meta={tongues.year}>
            <p className="text-[11px] font-sans leading-snug" style={{ color: t.headText }}>
              {tongues.parts?.length
                ? tongues.parts
                    .filter(([n]) => !/^(other|unspecified)/i.test(n))
                    .slice(0, 5)
                    .map(([n, pct, under]) => `${n} ${under ? "<" : ""}${pct}%`)
                    .join(" · ")
                : (() => {
                    const items = (tongues.text ?? "").split(";")[0].split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
                    return items.slice(0, 5).join(" · ") + (items.length > 5 ? " …" : "");
                  })()}
            </p>
          </Block>
        )}
        {resources.length > 0 && (
          <Block title="Resources" meta="share of world output">
            <ul className="flex flex-col gap-0.5">
              {resources.slice(0, 5).map((r) => (
                <li key={r.what} className="flex items-baseline justify-between gap-2 text-[11px] font-sans" style={{ color: t.headText }}>
                  <span>{r.what}</span>
                  <span className="font-mono font-semibold">
                    {shareText(r.share)}
                    <span className="text-[9px] font-normal ml-1" style={{ color: t.mutedText }}>{r.year}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}
        {energy && energy.mix.length > 0 && (
          <Block title="Energy produced" meta={energy.y}>
            <div className="flex h-1.5 rounded-full overflow-hidden" role="img" aria-label={`${name}'s energy production by source, ${energy.y}`}>
              {energy.mix.map((p) => (
                <span key={p.source} style={{ width: `${p.pct}%`, background: p.color }} />
              ))}
            </div>
            <ul className="flex flex-col gap-0.5">
              {[...energy.mix].sort((a, b) => b.pct - a.pct).map((p) => (
                <li key={p.source} className="flex items-center justify-between gap-2 text-[11px] font-sans" style={{ color: t.headText }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    {p.source}
                  </span>
                  <span className="font-mono font-semibold">{p.pct}%</span>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>
      {sources.length > 0 && <SourceLink sources={sources} />}
    </div>
  );
}

export default function WorldviewMap() {
  const t = useTokens();
  const [hover, setHover] = useState<string | null>(null);
  /** The country whose figures fill the panels under the map. */
  const [picked, setPicked] = useState("US");
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
  /* The borders inside the countries - states and provinces, then counties and districts - and the cities: the World Maps
     page's own files, fetched after the map is drawn. A file that does not come leaves the map without that layer. */
  const [inner, setInner] = useState<{ one: { c: string; d: string }[]; two: { c: string; d: string }[] }>({ one: [], two: [] });
  const [cities, setCities] = useState<{ name: string; country: string; people: number; x: number; y: number }[]>([]);
  useEffect(() => {
    let off = false;
    const lines = (url: string) =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((topo: Topology) =>
          (feature(topo, topo.objects.b as never) as unknown as { features: { properties: { c: string; o?: number } }[] }).features.flatMap((f) => {
            const d = PATH(f as never);
            return d ? [{ c: f.properties.c, o: f.properties.o ?? 1, d }] : [];
          }),
        )
        .catch(() => [] as { c: string; o: number; d: string }[]);
    Promise.all([lines("/geo/admin1-borders.json"), lines("/geo/admin2-borders.json")]).then(([a, b]) => {
      // The counties' file carries its states' borders too (o 1): the Natural Earth ones stand for every country it does not.
      if (!off) setInner({ one: a, two: b.filter((l) => l.o === 2) });
    });
    fetch("/geo/cities.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { rows: [string, string, number, number, number][] }) => {
        if (off) return;
        setCities(
          j.rows.flatMap(([name, country, people, lon, lat]) => {
            const p = PROJECTION([lon, lat]);
            return p ? [{ name, country, people, x: p[0], y: p[1] }] : [];
          }),
        );
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);
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
  /* Every country with a figure on each of the five measures, highest first: where the country picked stands, in the panel under the map. */
  const standings = useMemo(
    () =>
      MEASURES.map((x) => ({
        ...x,
        ranked: SHAPES.flatMap((s) => {
          const r = s.code ? x.read(s.code) : null;
          return s.code && r && Number.isFinite(r.v) ? [{ name: s.name, code: s.code, ...r }] : [];
        })
          .filter((r, i, a) => a.findIndex((y) => y.code === r.code) === i)
          .sort((a, b) => b.v - a.v),
      })),
    [],
  );
  const shown = hover ? SHAPES.find((s) => s.code === hover) : null;
  const pickedName = SHAPES.find((s) => s.code === picked)?.name ?? picked;
  return (
    <>
    <section id="world-map" className="scroll-mt-36 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }} aria-label="The world, country by country">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
          The world, country by country
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="relative p-3 min-w-0">
          <svg
            ref={svgRef}
            viewBox={`${view.x - W / (2 * view.k)} ${view.y - H / (2 * view.k)} ${W / view.k} ${H / view.k}`}
            className={`w-full h-auto block touch-none select-none ${view.k > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
            role="img"
            aria-label="World map, each country in its flag's colour. Scroll or pinch to zoom, drag to move, press a country for its figures."
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
                  // Translucent inside a bright edge of its own colour, as the World Maps page draws; a little more solid when picked or pointed at.
                  fill={s.code ? inkOf(s.code) : t.isLight ? "#e5e7eb" : "#1a1a20"}
                  fillOpacity={s.code ? (on ? FILL_ON : FILL) : 1}
                  stroke={s.code ? inkOf(s.code) : t.isLight ? "#cbd5e1" : "#3a3a44"}
                  strokeWidth={0.7}
                  onMouseEnter={() => s.code && setHover(s.code)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{s.name}</title>
                </path>
              );
            })}
            {/* The borders inside each country, in its own colour and dimmer than its edge, kept inside the land as drawn here. */}
            <defs>
              <clipPath id="worldview-land">
                {SHAPES.map((s, i) => (
                  <path key={i} d={s.d} />
                ))}
              </clipPath>
            </defs>
            <g clipPath="url(#worldview-land)" fill="none" strokeLinejoin="round" pointerEvents="none">
              {view.k >= COUNTIES_FROM &&
                inner.two.map((l, i) => <path key={`b2-${i}`} d={l.d} stroke={inkOf(l.c)} strokeOpacity={Math.min(0.75, 0.3 + 0.05 * view.k)} strokeWidth={0.35} vectorEffect="non-scaling-stroke" />)}
              {inner.one.map((l, i) => (
                <path key={`b1-${i}`} d={l.d} stroke={inkOf(l.c)} strokeOpacity={0.6} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            {/* The cities, as points named on pointing at them, once the map is drawn close enough to tell them apart. */}
            {view.k >= CITIES_FROM &&
              cities.map((c) => {
                // Only those in view, so that a close map draws few.
                const hw = W / (2 * view.k);
                const hh = H / (2 * view.k);
                if (Math.abs(c.x - view.x) > hw || Math.abs(c.y - view.y) > hh) return null;
                return (
                  <circle key={`${c.name}-${c.country}-${c.x}`} cx={c.x} cy={c.y} r={(c.people >= 1e6 ? 2.6 : 1.6) / view.k} fill={t.headText} fillOpacity={0.85} stroke={t.cardBg} strokeWidth={0.6} vectorEffect="non-scaling-stroke">
                    <title>{`${c.name}, ${c.country}: ${c.people.toLocaleString("en-US")} people (GeoNames)`}</title>
                  </circle>
                );
              })}
          </svg>
          {/* Closer and further, and the whole map again: the outline map's round buttons, at the map's corner. */}
          <div className="absolute top-5 right-5 flex items-center gap-1">
            <button type="button" onClick={() => glideTo({ ...viewRef.current, k: viewRef.current.k / 1.6 })} disabled={view.k <= 1} aria-label="Draw the map further out" title="Further out" className={TOOL}>
              <MagnifyingGlassMinus size={13} aria-hidden />
            </button>
            <button type="button" onClick={() => glideTo({ ...viewRef.current, k: viewRef.current.k * 1.6 })} disabled={view.k >= MAX_K} aria-label="Draw the map closer" title="Closer" className={TOOL}>
              <MagnifyingGlassPlus size={13} aria-hidden />
            </button>
            {view.k > 1 && (
              <button type="button" onClick={() => glideTo({ k: 1, x: W / 2, y: H / 2 })} aria-label="The whole map again" title="The whole map" className={TOOL}>
                <ArrowCounterClockwise size={13} aria-hidden />
              </button>
            )}
          </div>
          {/* What the pointer is on, in the map's corner: a pill of the same make as the zoom buttons, as asked. */}
          <div className="absolute left-5 bottom-5 max-w-[calc(100%-2.5rem)] h-7 px-3 rounded-full border border-border bg-background/70 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground truncate">
            {shown ? (
              <>
                <span className="font-sans font-semibold text-foreground truncate">{shown.name}</span>
                <span>press for its figures</span>
              </>
            ) : (
              <span className="truncate">Scroll to zoom, drag to move · press a country for its figures</span>
            )}
          </div>
        </div>
        {/* The place picked, beside the map: what it is and who leads it, as asked. */}
        <PickedColumn code={picked} name={pickedName} t={t} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-sans flex-1 min-w-[12rem]" style={{ color: t.mutedText }}>
          Each country in its flag's colour; press one for its own figures, beside the map and under it. The {DRAWN} countries the map draws; the smallest islands are too small to draw at this scale.
        </p>
        <SourceLink sources={[{ label: "Natural Earth, via world-atlas — country outlines (public domain)", url: "https://github.com/topojson/world-atlas" }, { label: "geoBoundaries (gbOpen, each country's under its publisher's open licence) and Natural Earth (public domain) — state, province, county and district borders", url: "https://www.geoboundaries.org/" }, { label: "GeoNames — cities of 100,000 or more (CC BY 4.0)", url: "https://www.geonames.org/" }]} />
      </div>
    </section>
    {/* The country picked: its own figures, filled in under the map. */}
    <CountryDashboard code={picked} name={pickedName} standings={standings} />
    </>
  );
}
