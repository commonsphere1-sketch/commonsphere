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
import { type ReactNode, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteLoading } from "./SiteLoading";
import { ArrowCounterClockwise, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { CountryHoverCard, type CountryHoverHandle } from "./CountryHoverCard";
import PlaceSearch, { type Hit, type Locate } from "./PlaceSearch";
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
import { NewsHistory } from "./NewsHistory";
import { MidtermsPanel, midtermFill } from "./MidtermsPanel";
import { DIVISION_MEASURES, figureFill, partKeyOf, useDivisionFigures, yearsAndSources, type DivisionMeasureId } from "../lib/divisionFigures";
import { useSecondOrder } from "../lib/secondOrder";
import { useMidterms, type Office } from "../lib/elections2026";
import { useElectionSeason } from "../lib/electionSeason";
import { OccurrencePanel, type Occurrence } from "./OccurrencePanel";
import { useGdacsLive, type HazardAlert } from "../lib/gdacsLive";
import { alertInks, conflictInks, useConflictEvents } from "../lib/conflictEvents";
import { criticalRows, namedBy, useCriticalZones } from "../lib/criticalZones";
import { conflictPinRows, conflictsByCountry, countryConflictRow, countryDisastersRow, disastersByCountry, hazardName, hazardPinRows } from "../lib/layerSaid";
import { HAZARD_KINDS } from "../lib/gdacsLive";
import { CONFLICT_KINDS } from "../data/conflictEventsMeta";
import { CriticalZonesPanel } from "./CriticalZonesPanel";
import { Link } from "react-router-dom";
import { usStatesData } from "../data/statesData";
import { citiesData } from "../data/citiesData";
import { MapLabels, anchorOf, placeLabels, type LabelCandidate } from "./MapLabels";
import { CountryOutline, DivisionOutline } from "./PlaceOutlines";
import { OutlineMap } from "./OutlineMap";
import type { Outline } from "../lib/outlines";

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
  return [{ name: c?.name ?? f.properties.name, code: c?.code ?? null, d, b: PATH.bounds(f as never), a: anchorOf(PATH, f), area: PATH.area(f as never) }];
});
type Shape = (typeof SHAPES)[number];
/** The Policy page's policy areas, as asked, for the country picked: fetched with that page's code when first shown. */
const CountryPolicyAreas = lazy(() => import("../pages/countiresPolicyPage").then((m) => ({ default: m.CountryPolicyAreas })));

/** A country's name, as the map draws it, or as the browser's own list of regions has it where the map draws none. */
const REGION_NAMES = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
const nameOfCode = (code: string) => SHAPES.find((s) => s.code === code)?.name ?? REGION_NAMES?.of(code) ?? code;
/** The red the critical zones are drawn in: apart from the conflicts' and the disasters' own. */
const criticalInk = (isLight: boolean) => (isLight ? "#be123c" : "#fb7185");
/** The country of the site's a point lies in, by the outlines the map draws; none at sea or on a shape too small to draw. */
const countryAt = (lon: number, lat: number) => {
  const f = WORLD.features.find((x) => geoContains(x as never, [lon, lat]));
  const c = f ? countryForFeature(f.properties.name) : null;
  return c ? { code: c.code, name: c.name } : null;
};
/** As close as the map is drawn: twelve times the whole. */
const MAX_K = 12;
/** How solid a country is drawn, and the one picked or pointed at: the World Maps page's middle neon step, and a step up. */
const FILL = 0.42;
const FILL_ON = 0.6;
/* Every country in one colour, as asked: the slate blue Australia was drawn in. The one picked or pointed at is told apart by
   being drawn more solid (FILL_ON), and its divisions, districts and cities light in the same colour. */
const MAP_INK = "#6275a2";
/** A country's ink on this map: the one colour for all. */
const inkOf = (_code: string | null) => MAP_INK;
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

/**
 * A miniature map of what is picked on the Worldview map, as asked, set above its figures: the country with its divisions
 * (its far-off parts a swipe away), or the state or province pressed with its counties or districts, or the county itself,
 * or the city marked on its country - as the windows draw their maps, in this map's one colour.
 */
function AreaMiniMap({ t, code, country, place, city }: { t: Tokens; code: string; country: string; place: PressedPlace | null; city?: { name: string; lon: number; lat: number } }) {
  const what =
    place?.kind === "region" ? place.name : place?.kind === "county" ? [place.name, place.parent].filter(Boolean).join(", ") : place?.kind === "city" ? place.name : country;
  const countyGeo = place?.kind === "county" ? (place.geo as { geometry?: Outline["geometry"] } | undefined) : undefined;
  /* The 2026 midterms on the United States, as asked: each state in the colour of whoever leads its count, the counts under the map. */
  const usWhole = code === "US" && !place;
  // On while election season is on (Settings), and pressed on or off here for this map.
  const [season] = useElectionSeason();
  const [midterms, setMidterms] = useState(season);
  const [office, setOffice] = useState<Office>("senate");
  const counts = useMidterms(usWhole && midterms);
  /* The figures the country's divisions - and its counties, where those hold them, as asked - can be drawn by: one at a time, pressed again for the plain map. */
  const whole = !place;
  const figures = useDivisionFigures(whole ? code : null);
  const [measure, setMeasure] = useState<DivisionMeasureId | null>(null);
  useEffect(() => setMeasure(null), [code]);
  const measures = DIVISION_MEASURES.filter((m) => (figures?.[m.id]?.by.size ?? 0) >= 2);
  const shown = whole && measure && (figures?.[measure]?.by.size ?? 0) >= 2 ? DIVISION_MEASURES.find((m) => m.id === measure)! : null;
  const held = shown ? (figures?.[shown.id] ?? null) : null;
  /* Where the counties hold the figure, they are drawn - every one at every distance, the states' edges over them - and found by their FIPS codes. */
  const second = useSecondOrder(whole ? code : null);
  const partKey = partKeyOf(code);
  const byCounty = held?.level === "counties" && partKey ? partKey : null;
  const drawnCounties = byCounty && second ? second.lines.filter((l) => /^(0\d|[1-4]\d|5[0-6])/.test(byCounty(l) ?? "")) : null;
  const countiesHeld = byCounty && held && drawnCounties ? drawnCounties.filter((l) => held.by.has(byCounty(l) ?? "")).length : 0;
  const ys = held ? yearsAndSources(held.by) : null;
  const chip = (on: boolean) => ({ borderColor: on ? t.headText : t.gridLine, color: on ? t.headText : t.mutedText });
  return (
    <section className="rounded-xl flex flex-col min-w-0" style={{ background: t.cardBg, border: t.cardBorder }} aria-label={`Where ${what} is`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 px-3.5 pt-3 pb-2 border-b" style={{ borderColor: t.gridLine }}>
        <h3 className="text-[10px] font-mono uppercase tracking-widest flex-1 min-w-0 truncate" style={{ color: t.headText }}>
          Where it is · {what}
        </h3>
        {/* The figures its divisions can be drawn by, as asked: a chip each, beside the midterms on the United States. */}
        {whole &&
          measures.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMeasure((v) => (v === m.id ? null : m.id));
                setMidterms(false);
              }}
              aria-pressed={measure === m.id}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer shrink-0"
              style={chip(measure === m.id)}
              title={`Draw ${country}'s divisions by ${m.chip.toLowerCase()}`}
            >
              {m.chip}
            </button>
          ))}
        {usWhole && (
          <button
            type="button"
            onClick={() => {
              setMidterms((v) => !v);
              setMeasure(null);
            }}
            aria-pressed={midterms}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer shrink-0"
            style={{ borderColor: midterms ? t.headText : t.gridLine, color: midterms ? t.headText : t.mutedText }}
          >
            Midterms 2026
          </button>
        )}
      </div>
      <div className="p-3.5 w-full max-w-2xl mx-auto">
        {place?.kind === "region" ? (
          <DivisionOutline code={code} name={place.name} color={MAP_INK} className="" />
        ) : place?.kind === "county" && countyGeo?.geometry ? (
          <OutlineMap shapes={[{ type: "Feature", properties: { n: place.name }, geometry: countyGeo.geometry }]} color={MAP_INK} label={`The outline of ${what}`} />
        ) : (
          <CountryOutline code={code} name={country} color={MAP_INK} className="" fillOf={shown && held && !byCounty ? figureFill(held.by, MAP_INK) : usWhole && midterms ? midtermFill(counts, office) : undefined} figureOf={shown && held && !byCounty ? (s) => { const fg = s.properties.n ? held.by.get(s.properties.n) : undefined; return fg ? shown.say(fg) : "not held"; } : undefined} partFillOf={shown && held && byCounty ? figureFill(held.by, MAP_INK, byCounty) : undefined} partFigureOf={shown && held && byCounty ? (s) => { const k = byCounty(s); const fg = k ? held.by.get(k) : undefined; return fg ? shown.say(fg) : "not held"; } : undefined} mark={place?.kind === "city" && city ? { id: city.name, name: city.name, lon: city.lon, lat: city.lat } : undefined} />
        )}
        {usWhole && midterms && <MidtermsPanel t={t} data={counts} office={office} onOffice={setOffice} />}
        {/* What the map is drawn by: its years and sources, how the shading is read, and how many divisions or counties hold it. */}
        {shown && held && ys && (
          <div className="mt-2">
            <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
              {shown.note(ys.years, ys.sources, byCounty ? "counties" : "divisions")}{" "}
              {byCounty
                ? drawnCounties
                  ? `${countiesHeld.toLocaleString("en-US")} of the ${drawnCounties.length.toLocaleString("en-US")} counties and county equivalents of the states and the District of Columbia on this map hold it.${held.plain && countiesHeld < drawnCounties.length ? ` ${held.plain}` : ""}`
                  : ""
                : `${held.by.size} of ${country}'s divisions on this map hold it.`}
            </p>
            <SourceLink sources={held.sources} className="mt-1" />
          </div>
        )}
      </div>
    </section>
  );
}

export default function WorldviewMap() {
  const t = useTokens();
  const [hover, setHover] = useState<string | null>(null);
  /** The country whose figures fill the panels under the map. */
  const [picked, setPicked] = useState("US");
  /* The small countries the coarse world leaves out - island nations of the Pacific and the Caribbean, Malta, Singapore and
     the like - as asked: from Natural Earth's finer 1:50m tracing, fetched once the map is drawn, each drawn, pointed at and
     pressed as every other country is. */
  const [isles, setIsles] = useState<Shape[]>([]);
  useEffect(() => {
    let off = false;
    import("world-atlas/countries-50m.json")
      .then((m) => {
        if (off) return;
        const fine = (m.default ?? m) as unknown as Topology;
        const have = new Set(WORLD.features.map((f) => f.properties.name));
        const features = (feature(fine, fine.objects.countries as never) as unknown as { features: { properties: { name: string } }[] }).features;
        setIsles(
          features.flatMap((f) => {
            if (have.has(f.properties.name) || f.properties.name === "Antarctica") return [];
            const d = PATH(f as never);
            if (!d) return [];
            const c = countryForFeature(f.properties.name);
            return [{ name: c?.name ?? f.properties.name, code: c?.code ?? null, d, b: PATH.bounds(f as never), a: anchorOf(PATH, f as never), area: PATH.area(f as never) }];
          }),
        );
      })
      // Without them the map still draws every country the coarse world holds.
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);
  /** Every country drawn: the coarse world's, and the small ones from the finer tracing. */
  const shapes = useMemo(() => [...SHAPES, ...isles], [isles]);
  const shapeOf = (code: string | null) => (code ? shapes.find((s) => s.code === code) : undefined);
  /* The divisions of the country picked - its states, provinces, regions - as the World Maps page's files draw them; the one pressed, and the one pointed at. */
  const [regions, setRegions] = useState<{ code: string; list: { name: string; d: string; geo: Geo; a?: ReturnType<typeof anchorOf> }[] } | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  const [pressed, setPressed] = useState<Pressed | null>(null);
  /* The conflicts and the disasters going on, as asked: each on the map while its chip is pressed, and the one pressed told under it. */
  const [live, setLive] = useState({ conflicts: false, hazards: false, critical: false });
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null);
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  // The critical zones read the conflicts and the disasters too, without pinning them.
  const conflictData = useConflictEvents(live.conflicts || live.critical);
  const gdacs = useGdacsLive(live.hazards || live.critical);
  const critical = useCriticalZones(live.critical, conflictData.data, gdacs.events);
  /* Each country's conflicts and disasters, for the card by the pointer, as asked: said while their layers - or the critical zones - are on. */
  const conflictOf = useMemo(() => (conflictData.data ? conflictsByCountry(conflictData.data) : null), [conflictData.data]);
  const disastersOf = useMemo(() => (gdacs.events ? disastersByCountry(gdacs.events) : null), [gdacs.events]);
  const layerRows = (code: string): [string, string][] => {
    const named = live.critical ? critical?.zones.get(code) : undefined;
    const rows: [string, string][] = named ? criticalRows(named).slice(0, 1) : [];
    const c = conflictOf?.get(code);
    if (c && conflictData.data && (live.conflicts || named?.some((r) => r.by === "conflict"))) rows.push(countryConflictRow(c, conflictData.data.month));
    const hs = disastersOf?.get(code);
    if (hs && live.hazards) rows.push(countryDisastersRow(hs));
    if (named) rows.push(...criticalRows(named).slice(1).filter(([label]) => !(live.hazards && hs && label === "Disaster")));
    return rows;
  };
  const panelRef = useRef<HTMLDivElement | null>(null);
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
    const country = shapeOf(picked)?.name ?? picked;
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
  /* The card by the pointer over a country, as asked: its name, its time and zone, and the point under the pointer. */
  const card = useRef<CountryHoverHandle>(null);
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
    const s = shapeOf(code);
    if (!s) return;
    const [[x0, y0], [x1, y1]] = s.b;
    const k = Math.min(MAX_K, 0.8 * Math.min(W / Math.max(1, x1 - x0), H / Math.max(1, y1 - y0)));
    glideTo({ k: Math.max(1.4, k), x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
  };
  /* A place found by the search on the map's bar, as asked: the map drawn to it, centred - a country picked, as a press
     on it picks it; a state or province picked out in its country, its details beside the map; a county pressed once its
     country's counties are drawn, its record beside the map; a city drawn to where the United Nations has its people
     centred - with a ring round where it lies. A place near the map's edge (Japan) is drawn as close as centring it needs.
     Where a place cannot be found on this map, its own page opens instead. */
  const [found, setFound] = useState<{ x: number; y: number } | null>(null);
  const [toFind, setToFind] = useState<{ cc: string; kind: "region" | "county"; name?: string; fips?: string; at?: { x: number; y: number } } | null>(null);
  /** As close as a place at x, y must be drawn for the map, which is never moved past its edge, to be centred on it. */
  const centred = (k: number, x: number, y: number) => Math.min(MAX_K, Math.max(k, W / (2 * Math.max(1e-6, Math.min(x, W - x))), H / (2 * Math.max(1e-6, Math.min(y, H - y)))));
  const pointOf = (lon: number, lat: number) => {
    const p = PROJECTION([lon, lat]);
    return p && Number.isFinite(p[0]) && Number.isFinite(p[1]) ? { x: p[0], y: p[1] } : null;
  };
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  const findPlace = async (h: Hit & { at: Locate }): Promise<boolean> => {
    const a = h.at;
    const glideOn = (k: number, p: { x: number; y: number }) => {
      glideTo({ k: centred(k, p.x, p.y), x: p.x, y: p.y });
      setFound(p);
    };
    if (a.kind === "country") {
      const s = shapeOf(a.cc);
      if (!s?.a) return false;
      setToFind(null);
      setPicked(a.cc);
      // Sized to the whole country, as a press on it draws it; centred on its mainland.
      const [[x0, y0], [x1, y1]] = s.b;
      glideOn(Math.max(1.4, Math.min(MAX_K, 0.8 * Math.min(W / Math.max(1, x1 - x0), H / Math.max(1, y1 - y0)))), s.a);
      return true;
    }
    if (a.kind === "state" || a.kind === "division") {
      const cc = a.kind === "state" ? "US" : a.cc;
      const s = shapeOf(cc);
      if (!s?.a) return false;
      setPicked(cc);
      // Drawn first to its point where its record gives one, else to its country, until its country's divisions are in to draw it to its own outline.
      const at = a.kind === "division" ? (pointOf(a.lon, a.lat) ?? undefined) : undefined;
      if (at) glideOn(2.2, at);
      else glideOn(Math.max(1.4, Math.min(MAX_K, 0.7 * Math.min(W / Math.max(1, s.a.w), H / Math.max(1, s.a.h)))), s.a);
      setToFind({ cc, kind: "region", name: a.name, at });
      return true;
    }
    if (a.kind === "county") {
      const p = pointOf(a.lon, a.lat);
      if (!p) return false;
      setPicked("US");
      glideOn(5, p);
      setToFind({ cc: "US", kind: "county", fips: a.fips });
      return true;
    }
    const m = await import("../data/unCities");
    const c = m.UN_CITIES.find((r) => r[0] === a.cc && fold(r[2]) === fold(a.name)) ?? m.UN_CITIES.find((r) => r[0] === a.cc && fold(r[2]).startsWith(fold(a.name)));
    const p = c && c[3] !== null && c[4] !== null ? pointOf(c[4], c[3]) : null;
    if (!p) return false;
    setToFind(null);
    setPicked(a.cc);
    glideOn(6, p);
    return true;
  };

  /* A pin pressed, on the map or in the list under it: told under the map, and the map drawn to it when pressed in the list.
     Pressed on the map with the account out of sight below, the page moves just far enough to show the account's head. */
  const choose = (o: Occurrence, lon?: number, lat?: number) => {
    setOccurrence(o);
    if (lon !== undefined && lat !== undefined) {
      const p = PROJECTION([lon, lat]);
      if (p) glideTo({ k: Math.max(viewRef.current.k, 3), x: p[0], y: p[1] });
      return;
    }
    const top = panelRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top > window.innerHeight - 160) window.scrollBy({ top: top - (window.innerHeight - 280), behavior: "smooth" });
  };
  /* The pins, made once for a scale so the map's redrawing on hover passes over them; the biggest first, so none hides a smaller. */
  const pins = useMemo(() => {
    const z = view.k;
    const halo = t.isLight ? "#ffffff" : "#000000";
    const cInk = conflictInks(t.isLight);
    const aInk = alertInks(t.isLight);
    const conflicts =
      live.conflicts && conflictData.data
        ? conflictData.data.rows.map((r, i) => {
            const p = PROJECTION([r[0], r[1]]);
            if (!p) return null;
            return (
              <circle
                key={`c${i}`}
                cx={p[0]}
                cy={p[1]}
                r={Math.min(14, 1.6 + Math.sqrt(r[4]) * 0.35) / z}
                fill={cInk[r[2]]}
                fillOpacity={0.85}
                stroke={halo}
                strokeWidth={1 / z}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragged.current) choose({ kind: "conflict", i });
                }}
                onMouseEnter={() => setHoverPin(`${r[5]}: ${r[4].toLocaleString("en")} killed`)}
                // Described in the card by the pointer, as asked: its deaths, its kind of violence, its sides.
                onMouseMove={(e) => conflictData.data && card.current?.show(e, { name: r[5], kicker: `${CONFLICT_KINDS[r[2]]} · ${shapeOf(r[11])?.name ?? r[11]}`, zone: { kind: "country", cc: r[11] }, figures: conflictPinRows(conflictData.data, r) }, PROJECTION)}
                onMouseLeave={() => {
                  setHoverPin(null);
                  card.current?.hide();
                }}
              />
            );
          })
        : null;
    const order: HazardAlert[] = ["Green", "Orange", "Red"];
    const hazards =
      live.hazards && gdacs.events
        ? [...gdacs.events]
            .sort((a, b) => order.indexOf(a.alert) - order.indexOf(b.alert))
            .map((h) => {
              const p = PROJECTION([h.lon, h.lat]);
              if (!p) return null;
              const r = (h.alert === "Red" ? 6.2 : h.alert === "Orange" ? 4.6 : 3.2) / z;
              return (
                <g
                  key={h.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!dragged.current) choose({ kind: "hazard", id: h.id });
                  }}
                  onMouseEnter={() => setHoverPin(`${h.name}: ${h.alert} alert`)}
                  // Described in the card by the pointer, as asked: what its alert means, its severity, its days, where it reaches.
                  onMouseMove={(e) => card.current?.show(e, { name: hazardName(h), kicker: `${HAZARD_KINDS[h.kind]} · ${h.alert} alert`, zone: { kind: "country", cc: h.codes[0] ?? "" }, figures: hazardPinRows(h) }, PROJECTION)}
                  onMouseLeave={() => {
                    setHoverPin(null);
                    card.current?.hide();
                  }}
                >
                  <circle cx={p[0]} cy={p[1]} r={r} fill="none" stroke={halo} strokeWidth={2.6 / z} />
                  <circle cx={p[0]} cy={p[1]} r={r} fill={aInk[h.alert]} fillOpacity={0.25} stroke={aInk[h.alert]} strokeWidth={1.3 / z} />
                </g>
              );
            })
        : null;
    return { conflicts, hazards };
    // The inks follow the theme, so the theme stands for them here.
  }, [view.k, live.conflicts, live.hazards, conflictData.data, gdacs.events, t.isLight]);
  /* The one pressed, ringed in the map's ink over the pins. */
  const chosenAt = (() => {
    if (occurrence?.kind === "conflict" && live.conflicts && conflictData.data) {
      const r = conflictData.data.rows[occurrence.i];
      const p = r && PROJECTION([r[0], r[1]]);
      return p ? { p, r: Math.min(14, 1.6 + Math.sqrt(r[4]) * 0.35) } : null;
    }
    if (occurrence?.kind === "hazard" && live.hazards && gdacs.events) {
      const h = gdacs.events.find((x) => x.id === occurrence.id);
      const p = h && PROJECTION([h.lon, h.lat]);
      return p ? { p, r: h.alert === "Red" ? 6.2 : h.alert === "Orange" ? 4.6 : 3.2 } : null;
    }
    return null;
  })();
  /* A state, province or county found by the search, once its country's divisions or counties are in: drawn to its own
     outline and picked out, or pressed. */
  useEffect(() => {
    if (!toFind || picked !== toFind.cc) return;
    if (toFind.kind === "region") {
      if (regions?.code !== toFind.cc) return;
      const r = regions.list.find((x) => fold(x.name) === fold(toFind.name ?? ""));
      if (r?.a) {
        const k = Math.min(COUNTIES_PICK_FROM - 0.05, Math.max(REGIONS_FROM + 0.1, 0.6 * Math.min(W / Math.max(1e-6, r.a.w), H / Math.max(1e-6, r.a.h))));
        glideTo({ k: centred(k, r.a.x, r.a.y), x: r.a.x, y: r.a.y });
        setFound({ x: r.a.x, y: r.a.y });
        setPressed(null);
        setRegion(r.name);
      }
      setToFind(null);
    } else if (countiesShown && counties?.code === "US") {
      const c = counties.list.find((x) => x.id === toFind.fips);
      if (c) pressCounty(c);
      setToFind(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toFind, picked, regions, counties, countiesShown]);
  const shown = hover ? shapeOf(hover) : null;
  const pickedName = shapeOf(picked)?.name ?? picked;
  return (
    <>
    <CountryHoverCard ref={card} />
    <section id="world-map" className="scroll-mt-36 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }} aria-label="The world, country by country">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
          The world, country by country
        </p>
        {/* A search of every place the site holds, as asked: a place chosen is found on the map. */}
        <PlaceSearch onPlace={findPlace} />
        {/* The conflicts and the disasters going on, as asked: each switched on and off here, in the layers' own chip. */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["conflicts", "Conflicts", conflictInks(t.isLight)[0], conflictData, "Pin the armed conflicts of the latest month: every event in which someone was killed, as the Uppsala Conflict Data Program recorded it"],
              ["hazards", "Disasters", alertInks(t.isLight).Red, gdacs, "Pin the disasters going on now - earthquakes, cyclones, floods, volcanoes, droughts, forest fires - read live from GDACS"],
              [
                "critical",
                "Critical zones",
                criticalInk(t.isLight),
                { loading: live.critical && (!critical?.read.travel || conflictData.loading || gdacs.loading), failed: false },
                "Draw in red every country a travel ban, deadly conflict, a red disaster alert or a UN humanitarian appeal names - each its body's own word, listed under the map",
              ],
            ] as const
          ).map(([id, label, ink, state, title]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setLive((l) => ({ ...l, [id]: !l[id] }));
                setOccurrence((o) => (o && (o.kind === "conflict" ? "conflicts" : "hazards") === id ? null : o));
              }}
              aria-pressed={live[id]}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                live[id] ? "border-transparent" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              style={live[id] ? { background: `${ink}26`, borderColor: `${ink}66`, color: ink } : undefined}
              title={title}
            >
              <span aria-hidden className="shrink-0 w-2 h-2 rounded-full" style={{ background: live[id] ? ink : "currentColor", opacity: live[id] ? 1 : 0.45 }} />
              {label}
              {/* Only the chip pressed says it is reading: the critical zones read the conflicts and the disasters without their chips. */}
              {live[id] && state.loading && <span className="font-mono opacity-70">…</span>}
              {live[id] && state.failed && <span className="font-mono opacity-70">unavailable</span>}
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
            {shapes.map((s, i) => {
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
                  // A country too small to see at this distance has a heavier edge, so that its islands' own shapes show; every other the usual.
                  strokeWidth={(s.area * view.k * view.k < 6 ? 1.6 : 0.7) / view.k}
                  onMouseEnter={() => s.code && setHover(s.code)}
                  onMouseMove={(e) => s.code && !drag.current?.moved && card.current?.show(e, { name: s.name, zone: { kind: "country", cc: s.code }, ...(live.critical || live.conflicts || live.hazards ? { figures: layerRows(s.code) } : {}) }, PROJECTION)}
                  onMouseLeave={() => {
                    setHover(null);
                    card.current?.hide();
                  }}
                />
              );
            })}
            {/* The critical zones, as asked: each country named drawn in red over its own colour - the more of the four that name it, the more solid - and not pressed itself. */}
            {live.critical && critical && (
              <g pointerEvents="none" aria-hidden>
                {shapes.map((s, i) => {
                  const rs = s.code ? critical.zones.get(s.code) : undefined;
                  if (!rs) return null;
                  const n = namedBy(rs);
                  // Named by one of the four, a faint red; by each more, more solid and a heavier edge.
                  return <path key={`crit-${i}`} d={s.d} fill={criticalInk(t.isLight)} fillOpacity={0.06 + 0.13 * (n - 1)} stroke={criticalInk(t.isLight)} strokeOpacity={0.45 + 0.18 * (n - 1)} strokeWidth={(0.6 + 0.5 * (n - 1)) / view.k} strokeLinejoin="round" />;
                })}
              </g>
            )}
            {/* The borders inside each country, in its own colour and dimmer than its edge, kept inside the land as drawn here. */}
            <defs>
              <clipPath id="worldview-land">
                {shapes.map((s, i) => (
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
                      // The card by the pointer, as for a country: its name, what it lies in, its time and zone, and the point.
                      onMouseMove={(e) =>
                        !drag.current?.moved &&
                        card.current?.show(
                          e,
                          { name: c.name, kicker: [c.parent, pickedName].filter(Boolean).join(", "), zone: picked === "US" ? { kind: "county", state: c.parent ?? "", fips: c.id } : { kind: "district", cc: picked, parent: c.parent, name: c.name } },
                          PROJECTION,
                        )
                      }
                      onMouseLeave={() => {
                        setHoverRegion(null);
                        card.current?.hide();
                      }}
                    />
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
                    onMouseMove={(e) => !drag.current?.moved && card.current?.show(e, { name: r.name, kicker: pickedName, zone: { kind: "division", cc: picked, name: r.name } }, PROJECTION)}
                    onMouseLeave={() => {
                      setHoverRegion(null);
                      card.current?.hide();
                    }}
                  />
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
            {/* The conflicts and the disasters going on, as asked: over the countries and under the names. */}
            {pins.conflicts && <g>{pins.conflicts}</g>}
            {pins.hazards && <g>{pins.hazards}</g>}
            {chosenAt && (
              <circle cx={chosenAt.p[0]} cy={chosenAt.p[1]} r={(chosenAt.r + 3) / view.k} fill="none" stroke={t.headText} strokeWidth={1.6 / view.k} pointerEvents="none" />
            )}
            {/* The place the search found: a ring round where it lies, until another is found. */}
            {found && (
              <g pointerEvents="none" aria-hidden>
                <circle cx={found.x} cy={found.y} r={10 / view.k} fill="none" stroke={t.headText} strokeWidth={1.6 / view.k}>
                  <animate attributeName="r" values={`${7 / view.k};${15 / view.k};${7 / view.k}`} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle cx={found.x} cy={found.y} r={2.4 / view.k} fill={t.headText} stroke={t.isLight ? "#ffffff" : "#000000"} strokeWidth={0.8 / view.k} />
              </g>
            )}
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
            {hoverPin ? (
              <>
                <span className="font-sans font-semibold text-foreground truncate">{hoverPin}</span>
                <span>press for its account</span>
              </>
            ) : hoverRegion && view.k >= REGIONS_FROM ? (
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
          Every country in one colour, the one picked drawn more solid; press one for its own figures, beside the map and under it. The {new Set(shapes.flatMap((s) => (s.code ? [s.code] : []))).size} countries the map draws; the smallest, the island nations among them, from a finer tracing, each with a heavier edge so that it shows.
        </p>
        <SourceLink sources={[{ label: "Natural Earth, via world-atlas — country outlines (public domain)", url: "https://github.com/topojson/world-atlas" }, { label: "geoBoundaries (gbOpen, each country's under its publisher's open licence) and Natural Earth (public domain) — state, province, county and district borders", url: "https://www.geoboundaries.org/" }, { label: "GeoNames — cities of 100,000 or more (CC BY 4.0)", url: "https://www.geonames.org/" }]} />
      </div>
    </section>
    {/* The account of the conflict or disaster pressed, as asked: under the map, while either is on it. */}
    {/* The critical zones listed, as asked: under the map while their chip is pressed. */}
    {live.critical && critical && (
      <CriticalZonesPanel
        t={t}
        data={critical}
        ink={criticalInk(t.isLight)}
        nameOf={nameOfCode}
        onPick={(code) => {
          pick(code);
          document.getElementById("world-map")?.scrollIntoView({ block: "start", behavior: "smooth" });
        }}
      />
    )}
    {(live.conflicts || live.hazards) && (
      <div ref={panelRef} className="scroll-mt-36">
        <OccurrencePanel
          t={t}
          show={live}
          conflicts={live.conflicts ? conflictData.data : null}
          hazards={live.hazards ? gdacs.events : null}
          hazardsAt={gdacs.at}
          hazardsFailed={gdacs.failed}
          occurrence={occurrence}
          onSelect={(o, lon, lat) => choose(o, lon, lat)}
          countryAt={countryAt}
          picked={{ code: picked, name: pickedName }}
          onPickCountry={(code) => {
            pick(code);
            document.getElementById("world-map")?.scrollIntoView({ block: "start", behavior: "smooth" });
          }}
        />
      </div>
    )}
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
      return (
        <>
          {/* A miniature map of what is picked, as asked, above its figures: the country, or the state, county or city pressed in it. */}
          <AreaMiniMap t={t} code={picked} country={pickedName} place={place} city={cityAt ? { name: cityAt.name, lon: cityAt.lon, lat: cityAt.lat } : undefined} />
          {place && <PlaceFigures key={`${place.kind}-${place.name}`} place={place} country={pickedName} />}
        </>
      );
    })()}
    <CountryDashboard code={picked} name={pickedName} />
    {/* The country's policy areas, as the Policy page draws them, as asked: its cards, sideways, and what it spends on each. */}
    <section id="policy-areas" className="scroll-mt-36 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }} aria-label={`${pickedName}'s policy areas`}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest flex-1" style={{ color: t.mutedText }}>
          Policy areas · {pickedName}
        </p>
        <Link to="/dashboard/policy" className="text-[10px] font-sans hover:underline" style={{ color: t.mutedText }}>
          Every country's, on the Policy page
        </Link>
      </div>
      <div className="px-4 pb-4 pt-1 min-w-0">
        <Suspense fallback={<SiteLoading label="Loading its policy areas" />}>
          <CountryPolicyAreas key={picked} code={picked} />
        </Suspense>
      </div>
    </section>
    {/* The News page's historic accounts, for the country picked here, as asked: its unrest, revolutions, wars, terrorism, disasters and epidemics as the records hold them. */}
    <NewsHistory id="place-history" initial={picked} under='nav[aria-label="Worldview sections"]' />
    </>
  );
}
