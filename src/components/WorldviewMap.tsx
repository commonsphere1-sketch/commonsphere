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
 * languages and resources (PickedColumn); the rest opens on a press. Drawn
 * closer, the country picked can be pressed by its states, provinces and
 * regions; closer still by its counties, districts and municipalities, and
 * the cities by their points - and the column then gives that place's own
 * record first.
 *
 * A country pressed on the map fills the panels
 * under the map with its own figures (CountryDashboard), as asked; the page
 * opens on the United States.
 */
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { flagColor } from "../lib/flagColor";
import { geoArea, geoContains, geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import type { Subnation } from "../data/subnations";
import { ADMIN2_SOURCE, loadAdmin2, useAdmin2Manifest } from "../lib/admin2";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES } from "../data/worldview";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { countryForFeature } from "../data/mapJoin";
import { NATIONAL_HEADS, REPRESENTATIVES_SOURCES } from "../data/representatives";
import { COUNTRY_LAW_HELD, COUNTRY_LAW_SOURCES, type CountryLawFile } from "../data/countryLaw";
import { COUNTRY_PEOPLE, COUNTRY_PEOPLE_SOURCES } from "../data/countryPeople";
import { RESOURCE_PRODUCERS, type Share } from "../data/resourceProducers";
import { ENERGY_PRODUCERS } from "../data/energyProducers";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import CountryDashboard, { headlineOf } from "./CountryDashboard";
import PlaceFigures, { type PressedPlace } from "./PlaceFigures";
import { Link } from "react-router-dom";
import { usStatesData } from "../data/statesData";
import { citiesData } from "../data/citiesData";
import { MapLabels, anchorOf, placeLabels, type LabelCandidate } from "./MapLabels";

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
/** Five measures the map was once shaded by, and the panel under it ranked: kept, not drawn. */
export const MEASURES: Measure[] = [
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
  return [{ name: c?.name ?? f.properties.name, code: c?.code ?? null, d, b: PATH.bounds(f as never), a: anchorOf(PATH, f) }];
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
/** Drawn this close, the country picked can be pressed by its states, provinces and regions: as close as a press on a country draws it. */
const REGIONS_FROM = 1.3;
/** Drawn this close, the country picked is pressed by its counties, districts and municipalities instead, where their outlines are held. */
const COUNTIES_PICK_FROM = 3;
type Src = { label: string; url: string };
/** A county or a city pressed on the map: what the column says of it, every line its publisher's. */
type Pressed = { kind: "county" | "city"; key: string; name: string; sub: string; rows: [string, string][]; sources: Src[]; note?: string; parent?: string; people?: number; /** The windows other pages have for the same place. */ links?: { label: string; to: string }[] };
const US_COUNTY_LINES: Src = { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" };
const GEONAMES: Src = { label: "GeoNames — cities of 100,000 or more (CC BY 4.0)", url: "https://www.geonames.org/" };
type Geo = { type: string; properties: { n?: string }; geometry: { type: string; coordinates: unknown } };
/** A division's rings turned the way d3 reads them, where its file has them the other way round (they would cover the globe). */
function rewind(f: Geo): Geo {
  const fix = (rings: number[][][]) => {
    if (geoArea({ type: "Polygon", coordinates: rings } as never) > 2 * Math.PI) for (const ring of rings) ring.reverse();
  };
  if (f.geometry.type === "Polygon") fix(f.geometry.coordinates as number[][][]);
  else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates as number[][][][]) fix(p);
  return f;
}
/** The outline map's round buttons, for its zoom. */
const TOOL = "w-7 h-7 rounded-full border border-border bg-background/70 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default";

/** A share of world output as its publisher bounds it. */
const shareText = (s: Share) => `${s.bound === "atMost" ? "<" : s.bound === "atLeast" ? ">" : ""}${s.pct < 1 ? s.pct.toFixed(1) : Math.round(s.pct)}%`;
/** The commodities whose producers the site holds - USGS's minerals and the EIA's and OPEC's fuels - by name. */
const PRODUCED = Object.entries({ ...RESOURCE_PRODUCERS, ...ENERGY_PRODUCERS });

/**
 * The place picked, beside the map: what it is and who leads it, as asked - its type of government, its leaders, its GDP,
 * life expectancy, inflation and human development, the languages spoken in it, what it digs and pumps from the ground,
 * the rest - any further resources and the sources - opening on a press, as asked. Every line is its publisher's: the CIA World Factbook's words for its government and its
 * languages; Wikipedia's list of current heads of state and government, which the site's World Leaders audit checks
 * (the page's own leaders explorer reads the same list); the World Bank's and UNDP's figures; the USGS's, the EIA's and
 * OPEC's tables of the largest producers. A line with nothing held is left out.
 */
function PickedColumn({ code, name, t, region, onClearRegion, pressed, onClearPressed }: { code: string; name: string; t: Tokens; region: string | null; onClearRegion: () => void; pressed: Pressed | null; onClearPressed: () => void }) {
  // The divisions' records - Natural Earth's divisions, each with its own Wikidata record - read when a division is first pressed.
  const [subs, setSubs] = useState<{ list: Subnation[]; sources: Record<string, { label: string; url: string }> } | null>(null);
  useEffect(() => {
    if (!region || subs) return;
    let off = false;
    import("../data/subnations").then((m) => !off && setSubs({ list: m.SUBNATIONS, sources: m.SUBNATIONS_SOURCES }));
    return () => {
      off = true;
    };
  }, [region, subs]);
  const rec = region && subs ? subs.list.find((x) => x.cc === code && x.name === region) : undefined;
  const usState = region && code === "US" ? usStatesData.find((s) => s.name === region) : undefined;
  const regionLinks = region
    ? [
        { label: "Its record on the Municipalities page", to: `/dashboard/subnations?country=${code}&name=${encodeURIComponent(region)}` },
        ...(usState ? [{ label: "On the US States page", to: `/dashboard/states?open=${usState.id}` }] : []),
      ]
    : [];
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
  // The column ends at its resources; the rest opens on a press.
  const [more, setMore] = useState(false);
  const SHOWN = 3;
  const sources = [
    ...(govType ? [COUNTRY_LAW_SOURCES.factbook] : []),
    ...(tongues ? [COUNTRY_PEOPLE_SOURCES.factbook] : []),
    ...head.sources,
    ...resources.flatMap((r) => r.sources),
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
      {/* A county or a city pressed on the map: its own record, and the country's figures below it. */}
      {pressed && (
        <div className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-sans font-semibold leading-tight" style={{ color: t.headText }}>
                {pressed.name}
              </p>
              <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                {pressed.sub}
              </p>
            </div>
            <button type="button" onClick={onClearPressed} aria-label={`Back to the whole of ${name}`} title={`Back to ${name}`} className="px-2 h-6 rounded-full border border-border bg-background/70 text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0">
              Back
            </button>
          </div>
          {pressed.rows.length > 0 && (
            <ul className="flex flex-col">
              {pressed.rows.map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest shrink-0" style={{ color: t.mutedText }}>
                    {k}
                  </span>
                  <span className="text-[11px] font-sans font-semibold text-right" style={{ color: t.headText }}>
                    {v}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {pressed.note && (
            <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
              {pressed.note}
            </p>
          )}
          {pressed.links?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {pressed.links.map((l) => (
                <Link key={l.to} to={l.to} className="inline-flex items-center px-2.5 h-6 rounded-full border border-border bg-background/70 text-[10px] font-sans text-muted-foreground hover:text-foreground transition-colors">
                  {l.label} →
                </Link>
              ))}
            </div>
          ) : null}
          <SourceLink sources={pressed.sources} />
        </div>
      )}
      {/* The division pressed on the map: its own record, and the country's figures below it. */}
      {region && !pressed && (
        <div className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-sans font-semibold leading-tight" style={{ color: t.headText }}>
                {region}
              </p>
              <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                {rec?.kind ? `${rec.kind}, ${name}` : `a division of ${name}`}
              </p>
            </div>
            <button type="button" onClick={onClearRegion} aria-label={`Back to the whole of ${name}`} title={`Back to ${name}`} className="px-2 h-6 rounded-full border border-border bg-background/70 text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0">
              Back
            </button>
          </div>
          {rec ? (
            <ul className="flex flex-col">
              {[
                ...(rec.capital ? [["Capital", rec.capital]] : []),
                ...(rec.pop ? [["People", `${rec.pop[1].toLocaleString("en-US")} · ${rec.pop[0]}`]] : []),
                ...(rec.areaKm2 ? [["Area", `${rec.areaKm2.toLocaleString("en-US")} km²`]] : []),
                ...(rec.legislature ? [["Legislature", rec.legislature]] : []),
                ...(rec.founded ? [["Formed", String(rec.founded)]] : []),
              ].map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest shrink-0" style={{ color: t.mutedText }}>
                    {k}
                  </span>
                  <span className="text-[11px] font-sans font-semibold text-right" style={{ color: t.headText }}>
                    {v}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            subs && (
              <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                No record of it is held.
              </p>
            )
          )}
          {rec && subs && (
            <SourceLink
              sources={[
                subs.sources.naturalEarth,
                subs.sources.wikidata,
                ...(rec.capitalBy === "gn" ? [subs.sources.geonames] : []),
                ...(rec.capitalBy === "wp" || rec.areaBy === "wp" || rec.popBy ? [subs.sources.wikipedia] : []),
              ]}
            />
          )}
          <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            Below, {name}'s own figures: the site holds them for the country.
          </p>
          {regionLinks?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {regionLinks.map((l) => (
                <Link key={l.to} to={l.to} className="inline-flex items-center px-2.5 h-6 rounded-full border border-border bg-background/70 text-[10px] font-sans text-muted-foreground hover:text-foreground transition-colors">
                  {l.label} →
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
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
              {resources.slice(0, more ? resources.length : SHOWN).map((r) => (
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
      </div>
      {/* The resources past the first three, on a press; where every line is from, folded under its own pill. */}
      {resources.length > SHOWN && (
        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          aria-expanded={more}
          className="self-start px-2.5 h-7 rounded-full border border-border bg-background/70 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          {more ? "Fewer" : `${resources.length - SHOWN} more resources`}
        </button>
      )}
      {sources.length > 0 && <SourceLink sources={sources} />}
    </div>
  );
}

export default function WorldviewMap() {
  const t = useTokens();
  const [hover, setHover] = useState<string | null>(null);
  /** The country whose figures fill the panels under the map. */
  const [picked, setPicked] = useState("US");
  /* The divisions of the country picked - its states, provinces, regions - as the World Maps page's files draw them; the one pressed, and the one pointed at. */
  const [regions, setRegions] = useState<{ code: string; list: { name: string; d: string; geo: Geo; a?: ReturnType<typeof anchorOf> }[] } | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  const [pressed, setPressed] = useState<Pressed | null>(null);
  useEffect(() => {
    setRegion(null);
    setPressed(null);
    setHoverRegion(null);
    let off = false;
    fetch(`/geo/admin1/${picked}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((topo: Topology) => {
        if (off) return;
        const key = Object.keys(topo.objects)[0];
        const list = (feature(topo, topo.objects[key] as never) as unknown as { features: Geo[] }).features.flatMap((f) => {
          const d = f.properties.n ? PATH(rewind(f) as never) : null;
          return d ? [{ name: f.properties.n!, d, geo: f, a: anchorOf(PATH, f) }] : [];
        });
        setRegions({ code: picked, list });
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [picked]);
  /* How close the map is drawn and where its middle is, in the map's own units - 1 is the whole of it - as the Dashboard's map does. */
  const [view, setView] = useState({ k: 1, x: W / 2, y: H / 2 });
  /* The counties, districts and municipalities of the country picked, fetched once it is drawn close enough to press them: the
     United States' are the Census Bureau's, by us-atlas; every other country's geoBoundaries', as the World Maps page draws them. */
  type County = { name: string; parent?: string; id: string; d: string; b: [[number, number], [number, number]]; geo: unknown; at?: number; a?: ReturnType<typeof anchorOf> };
  const [counties, setCounties] = useState<{ code: string; list: County[] } | null>(null);
  const admin2 = useAdmin2Manifest();
  const wantCounties = view.k >= COUNTIES_PICK_FROM;
  useEffect(() => {
    if (!wantCounties || counties?.code === picked) return;
    let off = false;
    const shape = (f: { id?: string | number; geometry: unknown }, name: string, parent?: string, at?: number): County[] => {
      const d = PATH(f as never);
      return d ? [{ name, parent, id: String(f.id ?? name), d, b: PATH.bounds(f as never) as County["b"], geo: f, at, a: anchorOf(PATH, f) }] : [];
    };
    if (picked === "US") {
      import("us-atlas/counties-10m.json").then((m) => {
        if (off) return;
        const topo = (m.default ?? m) as unknown as Topology;
        type F = { id?: string | number; properties: { name: string }; geometry: unknown };
        const states = new Map((feature(topo, topo.objects.states as never) as unknown as { features: F[] }).features.map((f) => [String(f.id), f.properties.name]));
        const list = (feature(topo, topo.objects.counties as never) as unknown as { features: F[] }).features.flatMap((f) => shape(f, f.properties.name, states.get(String(f.id).slice(0, 2))));
        setCounties({ code: "US", list });
      });
    } else {
      loadAdmin2(picked).then((file) => {
        if (off) return;
        setCounties({ code: picked, list: file ? file.shapes.flatMap((f, i) => shape({ ...f, id: f.id ?? `${f.properties.n}-${i}` }, f.properties.n, f.properties.p, i)) : [] });
      });
    }
    return () => {
      off = true;
    };
  }, [wantCounties, picked, counties?.code]);
  const countiesShown = wantCounties && counties?.code === picked && counties.list.length > 0;
  /** A county pressed: the Census Bureau's record of it in the United States; elsewhere what its boundaries' publisher records. */
  const pressCounty = (c: County) => {
    setRegion(null);
    const country = SHAPES.find((s) => s.code === picked)?.name ?? picked;
    if (picked === "US") {
      import("../data/usCounties").then((m) => {
        const r = m.US_COUNTIES.find((x) => x[0] === c.id);
        const years = m.US_COUNTY_YEARS;
        const people = r?.[7] ?? [];
        const st = usStatesData.find((s) => s.name === c.parent);
        setPressed({
          kind: "county",
          key: c.id,
          links: [
            { label: "Its window on the Municipalities page", to: `/dashboard/subnations?open=county:${c.id}` },
            ...(st ? [{ label: `${st.name} on the US States page`, to: `/dashboard/states?open=${st.id}` }] : []),
          ],
          name: r?.[1] ?? c.name,
          sub: `${c.parent ? `${c.parent}, ` : ""}${country}`,
          parent: c.parent,
          rows: r
            ? [
                ...(people.length ? [["People", `${people[people.length - 1].toLocaleString("en-US")} · ${years[years.length - 1]}`] as [string, string]] : []),
                ...(people.length > 1 ? [[`Since ${years[0]}`, `${people[people.length - 1] >= people[0] ? "+" : ""}${(people[people.length - 1] - people[0]).toLocaleString("en-US")}`] as [string, string]] : []),
                ...(r[5] !== null ? [["Land", `${r[5].toLocaleString("en-US")} km²`] as [string, string]] : []),
                ...(r[6] !== null ? [["Water", `${r[6].toLocaleString("en-US")} km²`] as [string, string]] : []),
                ["Births, the year", r[8].toLocaleString("en-US")],
                ["Deaths, the year", r[9].toLocaleString("en-US")],
              ]
            : [],
          note: r ? `Births and deaths in the year to 1 July ${years[years.length - 1]}; the change since ${years[0]} is worked out here.` : "No record of it is held.",
          sources: [m.US_COUNTY_SOURCES.estimates, m.US_COUNTY_SOURCES.gazetteer, US_COUNTY_LINES],
        });
      });
      return;
    }
    const info = admin2?.[picked];
    // What can be measured and counted of it from its outline: its area, and the cities of 100,000 or more inside it.
    const area = Math.round(geoArea(c.geo as never) * 6371.0088 * 6371.0088);
    const big = cities.filter((x) => x.cc === picked && geoContains(c.geo as never, [x.lon, x.lat])).sort((a, b) => b.people - a.people);
    const base: [string, string][] = [
      ["Area", `${area.toLocaleString("en-US")} km², from its outline`],
      ...(c.parent ? [["In", c.parent] as [string, string]] : []),
      ["Cities of 100,000+", big.length ? `${big.length} · ${big[0].name}, ${big[0].people.toLocaleString("en-US")}` : "none"],
    ];
    const card = (rows: [string, string][], counted: boolean) =>
      setPressed({
        kind: "county",
        key: c.id,
        name: c.name,
        parent: c.parent,
        links: [
          ...(c.at !== undefined ? [{ label: "Its window on the Municipalities page", to: `/dashboard/subnations?open=district:${picked}:${c.at}` }] : []),
          ...(c.parent ? [{ label: `${c.parent}'s record`, to: `/dashboard/subnations?country=${picked}&name=${encodeURIComponent(c.parent)}` }] : []),
        ],
        sub: `${info?.kind ? `${info.kind.charAt(0).toUpperCase()}${info.kind.slice(1)}` : "A division"}${c.parent ? ` in ${c.parent}` : ""}, ${country}`,
        rows: [...rows, ...(info ? [["Boundaries", `${info.by}, ${info.year}`] as [string, string]] : [])],
        note: counted
          ? "Measured and counted here from its outline: GeoNames' places inside it, each its own people. No body publishes this division's own figures. Below, all of it in depth."
          : "Measured here from its outline; counting its towns and villages…",
        sources: [ADMIN2_SOURCE, { label: "GeoNames — cities500 (CC BY 4.0)", url: "https://download.geonames.org/export/dump/" }],
      });
    card(base, false);
    // Its towns and villages: GeoNames' places of more than 500 people inside its outline.
    fetch(`/places/${picked}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((file: { places: [string, number, number, number][] } | null) => {
        const inside = (file?.places ?? []).filter((p) => geoContains(c.geo as never, [p[2], p[1]]));
        const peopled = inside.filter((p) => p[3] > 0).sort((a, b) => b[3] - a[3]);
        card(
          [
            ...base,
            ["Towns and villages", inside.length.toLocaleString("en-US")],
            ...(peopled[0] ? [["The largest", `${peopled[0][0]}, ${peopled[0][3].toLocaleString("en-US")}`] as [string, string]] : []),
            ...(peopled.length ? [["People in them", `${peopled.reduce((n, p) => n + p[3], 0).toLocaleString("en-US")}, added here`] as [string, string]] : []),
          ],
          true,
        );
      })
      .catch(() => card(base, true));
  };
  /** A city pressed: GeoNames' count of its people. */
  const pressCity = (c: { name: string; country: string; people: number }) => {
    setRegion(null);
    const profile = citiesData.find((x) => x.countryCode === picked && x.name === c.name);
    const base = { kind: "city" as const, key: `${c.name}-${c.country}`, name: c.name, people: c.people, sub: `City, ${c.country}`, rows: [["People", c.people.toLocaleString("en-US")]] as [string, string][], note: "GeoNames' count of its people, of the city itself.", sources: [GEONAMES] };
    const links = profile ? [{ label: "Its profile on the Cities page", to: `/dashboard/cities?open=${profile.id}` }] : [];
    setPressed({ ...base, links });
    // Its place's window on the Municipalities page, by the GeoNames id its row in the country's list of places carries.
    fetch(`/places/${picked}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((file: { places: [string, number, number, number, number, number, number][] } | null) => {
        const row = file?.places.filter((p) => p[0] === c.name).sort((a, b) => b[3] - a[3])[0];
        if (row) setPressed((p) => (p?.key === base.key ? { ...p, links: [...links, { label: "Its window on the Municipalities page", to: `/dashboard/subnations?open=place:${picked}:${row[6]}` }] } : p));
      })
      .catch(() => {});
  };
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
  const [cities, setCities] = useState<{ name: string; country: string; cc: string | null; people: number; x: number; y: number; lon: number; lat: number }[]>([]);
  // The largest first, sorted once: not at every step of a pan.
  const citiesByPeople = useMemo(() => [...cities].sort((a, b) => b.people - a.people), [cities]);
  /* The names on the map, as asked: the countries' at every zoom; drawn closer, the picked country's divisions, then its
     counties and districts; and the cities once they show - as many as fit in view without meeting (MapLabels). */
  const labels = useMemo(() => {
    const cands: LabelCandidate[] = [];
    for (const s of SHAPES) if (s.code && s.a) cands.push({ key: `c-${s.name}`, text: s.name, ...s.a, size: 10, weight: 700, rank: 1 });
    if (!countiesShown && view.k >= REGIONS_FROM && regions?.code === picked)
      for (const r of regions.list) if (r.a) cands.push({ key: `r-${r.name}`, text: r.name, ...r.a, size: 8.5, weight: 500, rank: 3 });
    if (countiesShown) for (const c of counties!.list) if (c.a) cands.push({ key: `k-${c.id}`, text: c.name, ...c.a, size: 8, weight: 500, rank: 4 });
    if (view.k >= CITIES_FROM)
      for (const c of citiesByPeople)
        cands.push({ key: `t-${c.name}-${c.country}-${c.x}`, text: c.name, x: c.x + (c.people >= 1e6 ? 2.6 : 1.6) / view.k, y: c.y, size: 8.5, rank: 2, town: true });
    return placeLabels(cands, { x0: view.x - W / (2 * view.k), y0: view.y - H / (2 * view.k), x1: view.x + W / (2 * view.k), y1: view.y + H / (2 * view.k), k: view.k });
  }, [view, regions, picked, counties, countiesShown, citiesByPeople]);
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
            return p ? [{ name, country, cc: countryForFeature(country)?.code ?? null, people, x: p[0], y: p[1], lon, lat }] : [];
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
            <path strokeWidth={1 / view.k} d={SPHERE} fill={t.isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.015)"} stroke={t.gridLine} />
            <path d={GRID} fill="none" stroke={t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"} strokeWidth={(0.6) / view.k} />
            {SHAPES.map((s, i) => {
              const on = (hover !== null && hover === s.code) || s.code === picked;
              return (
                <path
                  key={`${s.name}-${i}`}
                  d={s.d}
                  className={s.code ? "cursor-pointer" : undefined}
                  onClick={() => {
                    if (dragged.current) return;
                    if (s.code) pick(s.code);
                  }}
                  // Translucent inside a bright edge of its own colour, as the World Maps page draws; a little more solid when picked or pointed at.
                  fill={s.code ? inkOf(s.code) : t.isLight ? "#e5e7eb" : "#1a1a20"}
                  fillOpacity={s.code ? (on ? FILL_ON : FILL) : 1}
                  stroke={s.code ? inkOf(s.code) : t.isLight ? "#cbd5e1" : "#3a3a44"}
                  strokeWidth={0.7 / view.k}
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
                inner.two.map((l, i) => <path key={`b2-${i}`} d={l.d} stroke={inkOf(l.c)} strokeOpacity={Math.min(0.75, 0.3 + 0.05 * view.k)} strokeWidth={(0.35) / view.k} />)}
              {inner.one.map((l, i) => (
                <path key={`b1-${i}`} d={l.d} stroke={inkOf(l.c)} strokeOpacity={0.6} strokeWidth={(0.5) / view.k} />
              ))}
            </g>
            {/* The country picked, by its divisions, once drawn closer: each lit when pointed at and pressed. */}
            {/* Closer still, the country picked by its counties, districts and municipalities, where they are held: those in view. */}
            {countiesShown && (
              <g>
                {counties!.list.map((c) => {
                  const hw = W / (2 * view.k);
                  const hh = H / (2 * view.k);
                  if (c.b[1][0] < view.x - hw || c.b[0][0] > view.x + hw || c.b[1][1] < view.y - hh || c.b[0][1] > view.y + hh) return null;
                  const on = pressed?.kind === "county" && pressed.key === c.id;
                  return (
                    <path
                      key={c.id}
                      d={c.d}
                      className="cursor-pointer"
                      fill={inkOf(picked)}
                      fillOpacity={on ? 0.6 : hoverRegion === c.id ? 0.32 : 0}
                      stroke={on ? inkOf(picked) : "none"}
                      strokeWidth={(1.4) / view.k}
                      onClick={() => {
                        if (!dragged.current) pressCounty(c);
                      }}
                      onMouseEnter={() => setHoverRegion(c.id)}
                      onMouseLeave={() => setHoverRegion(null)}
                    >
                      <title>{c.parent ? `${c.name}, ${c.parent}` : c.name}</title>
                    </path>
                  );
                })}
              </g>
            )}
            {!countiesShown && view.k >= REGIONS_FROM && regions?.code === picked && (
              <g>
                {regions.list.map((r, i) => (
                  <path
                    key={`${r.name}-${i}`}
                    d={r.d}
                    className="cursor-pointer"
                    fill={inkOf(picked)}
                    fillOpacity={region === r.name ? 0.6 : hoverRegion === r.name ? 0.32 : 0}
                    stroke={region === r.name ? inkOf(picked) : "none"}
                    strokeWidth={(1.4) / view.k}
                    onClick={() => {
                      if (dragged.current) return;
                      setPressed(null);
                      setRegion(r.name);
                    }}
                    onMouseEnter={() => setHoverRegion(r.name)}
                    onMouseLeave={() => setHoverRegion(null)}
                  >
                    <title>{r.name}</title>
                  </path>
                ))}
              </g>
            )}
            {/* The cities, as points named on pointing at them, once the map is drawn close enough to tell them apart. */}
            {view.k >= CITIES_FROM &&
              cities.map((c) => {
                // Only those in view, so that a close map draws few.
                const hw = W / (2 * view.k);
                const hh = H / (2 * view.k);
                if (Math.abs(c.x - view.x) > hw || Math.abs(c.y - view.y) > hh) return null;
                return (
                  <circle key={`${c.name}-${c.country}-${c.x}`} cx={c.x} cy={c.y} r={((c.people >= 1e6 ? 2.6 : 1.6) * (pressed?.kind === "city" && pressed.key === `${c.name}-${c.country}` ? 1.8 : 1)) / view.k} fill={pressed?.kind === "city" && pressed.key === `${c.name}-${c.country}` ? inkOf(picked) : t.headText} fillOpacity={0.9} stroke={t.cardBg} strokeWidth={0.6 / view.k} className={c.cc === picked ? "cursor-pointer" : undefined} onClick={() => c.cc === picked && !dragged.current && pressCity(c)} onMouseEnter={() => c.cc === picked && setHoverRegion(`city:${c.name}`)} onMouseLeave={() => setHoverRegion(null)}>
                    <title>{`${c.name}, ${c.country}: ${c.people.toLocaleString("en-US")} people (GeoNames)`}</title>
                  </circle>
                );
              })}
            {/* The names of the places on it, as asked. */}
            <MapLabels labels={labels} k={view.k} />
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
            {hoverRegion && view.k >= REGIONS_FROM ? (
              <>
                <span className="font-sans font-semibold text-foreground truncate">{hoverRegion.startsWith("city:") ? hoverRegion.slice(5) : countiesShown ? (counties!.list.find((c) => c.id === hoverRegion)?.name ?? hoverRegion) : hoverRegion}</span>
                <span>press for its record</span>
              </>
            ) : shown ? (
              <>
                <span className="font-sans font-semibold text-foreground truncate">{shown.name}</span>
                <span>press for its figures</span>
              </>
            ) : (
              <span className="truncate">Scroll to zoom, drag to move · press a country for its figures, then its states, counties and cities</span>
            )}
          </div>
        </div>
        {/* The place picked, beside the map: what it is and who leads it, as asked. */}
        <PickedColumn code={picked} name={pickedName} t={t} region={region} onClearRegion={() => setRegion(null)} pressed={pressed} onClearPressed={() => setPressed(null)} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-sans flex-1 min-w-[12rem]" style={{ color: t.mutedText }}>
          Each country in its flag's colour; press one for its own figures, beside the map and under it. The {DRAWN} countries the map draws; the smallest islands are too small to draw at this scale.
        </p>
        <SourceLink sources={[{ label: "Natural Earth, via world-atlas — country outlines (public domain)", url: "https://github.com/topojson/world-atlas" }, { label: "geoBoundaries (gbOpen, each country's under its publisher's open licence) and Natural Earth (public domain) — state, province, county and district borders", url: "https://www.geoboundaries.org/" }, { label: "GeoNames — cities of 100,000 or more (CC BY 4.0)", url: "https://www.geonames.org/" }]} />
      </div>
    </section>
    {/* The country picked: its own figures, filled in under the map. */}
    {/* The state, county or city pressed on the map: its own figures, above its country's, as asked. */}
    {(() => {
      // What lies in a shape, and how large it is: the cities of 100,000 or more inside its outline (GeoNames'), and its area worked out from the outline.
      const inside = (geo: unknown) =>
        cities
          .filter((c) => c.cc === picked && geoContains(geo as never, [c.lon, c.lat]))
          .sort((a, b) => b.people - a.people)
          .slice(0, 10)
          .map((c) => ({ name: c.name, people: c.people }));
      const km2 = (geo: unknown) => Math.round(geoArea(geo as never) * 6371.0088 * 6371.0088);
      const countyShape = pressed?.kind === "county" ? counties?.list.find((c) => c.id === pressed.key) : undefined;
      const regionShape = region ? regions?.list.find((r) => r.name === region) : undefined;
      const cityAt = pressed?.kind === "city" ? cities.find((c) => `${c.name}-${c.country}` === pressed.key) : undefined;
      const cityRegion = cityAt && regions?.code === picked ? regions.list.find((r) => geoContains(r.geo as never, [cityAt.lon, cityAt.lat]))?.name : undefined;
      const place: PressedPlace | null = pressed
        ? pressed.kind === "county"
          ? { kind: "county", cc: picked, id: pressed.key, name: pressed.name, parent: pressed.parent, sub: pressed.sub, cities: countyShape ? inside(countyShape.geo) : [], areaKm2: countyShape ? km2(countyShape.geo) : undefined, geo: countyShape?.geo }
          : { kind: "city", cc: picked, name: pressed.name, people: pressed.people ?? 0, region: cityRegion }
        : region
          ? { kind: "region", cc: picked, name: region, cities: regionShape ? inside(regionShape.geo) : [], geo: regionShape?.geo }
          : null;
      return place ? <PlaceFigures key={`${place.kind}-${place.name}`} place={place} country={pickedName} /> : null;
    })()}
    <CountryDashboard code={picked} name={pickedName} />
    </>
  );
}
