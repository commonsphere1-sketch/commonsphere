/**
 * The Dashboard's map to any place: press a country and the map opens on its
 * divisions; press a division and the site goes to its record. In the United
 * States a state opens on its counties, and a county goes to its record.
 *
 *   World            every country (Natural Earth 1:110m, by world-atlas)
 *   A country        its first-order divisions - states, provinces, regions,
 *                    departments - from the files the World Maps page draws
 *                    (static/geo/admin1, one fetched when its country is
 *                    pressed)
 *   The United       its states, and under a state its counties (the US
 *     States         Census Bureau's boundaries, by us-atlas)
 *
 * At each step the place the map is on can be opened as well: the country on
 * the Countries page, the state on the US States page. A list beside the map
 * holds the same places by name, for a place too small to press and for a
 * keyboard: the 1:110m world has no shape at all for some thirty small
 * countries, and they are in the list.
 *
 * The map is a way in and shades nothing: every place is one tone, and the
 * one under the pointer another.
 *
 * Loaded when the Dashboard reaches it: the boundary files are large.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { geoAlbersUsa, geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoEqualEarth, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import statesTopo from "us-atlas/states-10m.json";
import { CaretRight, MapTrifold } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { countryForFeature, stateForFeature } from "../data/mapJoin";
import { usStatesData } from "../data/statesData";
import { Card, Go, Head } from "./DashboardCitiesSectors";
import { useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const W = 960;
const H = 480;
const BOX: [[number, number], [number, number]] = [
  [6, 6],
  [W - 6, H - 6],
];
const COLOR = "#3b82f6";

type Geo = { type: string; id?: string | number; properties: Record<string, string>; geometry: { type: string; coordinates: unknown[] } };
type Level = { kind: "world" } | { kind: "country"; code: string } | { kind: "state"; abbr: string; fips: string };
/** A shape on the map: its name, its outline, and what a press on it does. */
type Shape = { key: string; name: string; d: string; go: () => void };

/* As the World Maps page does it: a ring wound backwards is "everything but this island" to d3, so anything over a hemisphere is reversed. */
function rewind(f: Geo): Geo {
  const fix = (rings: number[][][]) => {
    if (geoArea({ type: "Polygon", coordinates: rings } as never) > 2 * Math.PI) for (const ring of rings) ring.reverse();
  };
  if (f.geometry.type === "Polygon") fix(f.geometry.coordinates as number[][][]);
  else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates as number[][][][]) fix(p);
  return f;
}
/* As the World Maps page does it: the place turned to the centre, so one across 180° is not split to both edges; azimuthal near a pole. */
function fitTo(geo: unknown): GeoProjection {
  const [lon, lat] = geoCentroid(geo as never);
  const l = Number.isFinite(lon) ? lon : 0;
  if (Number.isFinite(lat) && Math.abs(lat) >= 70) return geoAzimuthalEqualArea().rotate([-l, -lat]).fitExtent(BOX, geo as never);
  return geoEqualEarth().rotate([-l, 0]).fitExtent(BOX, geo as never);
}
const collection = (features: Geo[]) => ({ type: "FeatureCollection", features });
const middle = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
/**
 * The divisions a country's map is framed on. A few far-off ones - France's overseas departments, Spain's Canaries,
 * Ecuador's Galápagos - would shrink the rest to a speck, so where no more than one in seven lies over twenty degrees
 * from the middle of them all, the frame is the rest. Those left outside it are still in the list by name.
 */
function framed(features: Geo[]): Geo[] {
  if (features.length < 4) return features;
  const at = features.map((f) => geoCentroid(f as never));
  const mid: [number, number] = [middle(at.map((c) => c[0])), middle(at.map((c) => c[1]))];
  const near = features.filter((_, i) => geoDistance(at[i], mid) < (20 * Math.PI) / 180);
  return near.length < features.length && features.length - near.length <= features.length / 7 ? near : features;
}
const featuresOf = (topo: Topology, key: string) => (feature(topo, topo.objects[key]) as unknown as { features: Geo[] }).features;

const WORLD = featuresOf(worldTopo as unknown as Topology, "countries");
const STATES = featuresOf(statesTopo as unknown as Topology, "states").flatMap((f) => {
  const state = stateForFeature(f.properties.name);
  return state ? [{ f, state }] : [];
});
/** The countries, by name: every one the site holds, drawn at 1:110m or not. */
const COUNTRIES = countriesData.filter((c) => !c.uninhabited).sort((a, b) => a.name.localeCompare(b.name));

export default function PlaceAtlas() {
  const t = useTokens();
  const navigate = useNavigate();
  const [level, setLevel] = useState<Level>({ kind: "world" });
  const [hover, setHover] = useState<string | null>(null);
  /** How many divisions each country's file holds: which countries the map can open. */
  const [manifest, setManifest] = useState<Record<string, number> | null>(null);
  const [divisions, setDivisions] = useState<{ code: string; features: Geo[] } | "failed" | null>(null);
  const [counties, setCounties] = useState<Geo[] | null>(null);

  useEffect(() => {
    let off = false;
    fetch("/geo/admin1/manifest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Record<string, number>) => !off && setManifest(m))
      .catch(() => !off && setManifest({}));
    return () => {
      off = true;
    };
  }, []);

  const code = level.kind === "country" ? level.code : null;
  useEffect(() => {
    if (!code || code === "US") return;
    let off = false;
    setDivisions(null);
    fetch(`/geo/admin1/${code}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((topo: Topology) => !off && setDivisions({ code, features: featuresOf(topo, Object.keys(topo.objects)[0]).map(rewind) }))
      .catch(() => !off && setDivisions("failed"));
    return () => {
      off = true;
    };
  }, [code]);

  const inState = level.kind === "state";
  useEffect(() => {
    if (!inState || counties) return;
    let off = false;
    import("us-atlas/counties-10m.json").then((m) => !off && setCounties(featuresOf((m.default ?? m) as unknown as Topology, "counties")));
    return () => {
      off = true;
    };
  }, [inState, counties]);

  const country = code ? (countriesData.find((c) => c.code === code) ?? null) : null;
  const state = level.kind === "state" ? (usStatesData.find((s) => s.abbreviation === level.abbr) ?? null) : null;

  /** The shapes of the level the map is on, each with what a press does. */
  const shapes = useMemo<Shape[]>(() => {
    const draw = (features: Geo[], projection: GeoProjection, name: (f: Geo) => string, go: (f: Geo) => () => void): Shape[] => {
      const path = geoPath(projection);
      return features.flatMap((f, i) => {
        const d = path(f as never);
        return d ? [{ key: `${f.id ?? ""}-${i}`, name: name(f), d, go: go(f) }] : [];
      });
    };
    if (level.kind === "world")
      return draw(
        WORLD,
        geoEqualEarth().fitExtent(BOX, { type: "Sphere" } as never),
        (f) => countryForFeature(f.properties.name)?.name ?? f.properties.name,
        (f) => () => {
          const c = countryForFeature(f.properties.name);
          if (c) setLevel({ kind: "country", code: c.code });
        },
      );
    if (level.kind === "country" && level.code === "US")
      return draw(
        STATES.map((s) => s.f),
        geoAlbersUsa().fitExtent(BOX, collection(STATES.map((s) => s.f)) as never),
        (f) => f.properties.name,
        (f) => () => {
          const s = stateForFeature(f.properties.name);
          if (s) setLevel({ kind: "state", abbr: s.abbreviation, fips: String(f.id) });
        },
      );
    if (level.kind === "country") {
      if (!divisions || divisions === "failed" || divisions.code !== level.code) return [];
      return draw(
        divisions.features,
        fitTo(collection(framed(divisions.features))),
        (f) => f.properties.n,
        (f) => () => navigate(`/dashboard/subnations?country=${level.code}&name=${encodeURIComponent(f.properties.n)}`),
      );
    }
    if (!counties) return [];
    const own = counties.filter((f) => String(f.id).startsWith(level.fips));
    return draw(
      own,
      geoAlbersUsa().fitExtent(BOX, collection(own) as never),
      (f) => f.properties.name,
      (f) => () => navigate(`/dashboard/subnations?open=county:${f.id}`),
    );
  }, [level, divisions, counties, navigate]);

  /** The same places by name, for the list: at the world, every country the site holds. */
  const listed: { key: string; name: string; go: () => void }[] =
    level.kind === "world"
      ? COUNTRIES.map((c) => ({ key: c.code, name: c.name, go: () => setLevel({ kind: "country", code: c.code }) }))
      : [...new Map(shapes.map((s) => [s.name, s])).values()].sort((a, b) => a.name.localeCompare(b.name));

  const loading = (level.kind === "country" && level.code !== "US" && divisions === null) || (level.kind === "state" && !counties);
  const none = level.kind === "country" && level.code !== "US" && (divisions === "failed" || (manifest !== null && !manifest[level.code] && shapes.length === 0 && !loading));
  const what =
    level.kind === "world"
      ? "Press a country to open the map on its states, provinces or regions."
      : level.kind === "state"
        ? `Press a county of ${state?.name ?? "the state"} to go to its record.`
        : level.code === "US"
          ? "Press a state to open the map on its counties."
          : `Press a division of ${country?.name ?? "the country"} to go to its record.`;
  const land = t.isLight ? "#dfe3ea" : "#2b2b36";
  const edge = t.isLight ? "#ffffff" : "#0b0b0d";
  const crumb = "text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer";

  return (
    <Card t={t}>
      <Head t={t} icon={<MapTrifold size={16} weight="fill" />} label="Find a place" badge="countries · states · divisions · counties" color={COLOR} cta="World Maps" to="/dashboard/maps" />

      {/* Where the map is, each step a way back; and the place it is on, to open. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 -mt-1 mb-2">
        <nav aria-label="Where the map is" className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setLevel({ kind: "world" })} className={crumb} style={{ background: level.kind === "world" ? COLOR : t.tile, color: level.kind === "world" ? "#ffffff" : t.bodyText, border: `1px solid ${level.kind === "world" ? COLOR : t.gridLine}` }}>
            World
          </button>
          {level.kind !== "world" && (
            <>
              <CaretRight size={10} weight="bold" style={{ color: t.mutedText }} aria-hidden />
              <button
                type="button"
                onClick={() => setLevel({ kind: "country", code: level.kind === "state" ? "US" : level.code })}
                className={crumb}
                style={{ background: level.kind === "country" ? COLOR : t.tile, color: level.kind === "country" ? "#ffffff" : t.bodyText, border: `1px solid ${level.kind === "country" ? COLOR : t.gridLine}` }}
              >
                {level.kind === "state" ? "United States" : (country?.name ?? level.code)}
              </button>
            </>
          )}
          {level.kind === "state" && (
            <>
              <CaretRight size={10} weight="bold" style={{ color: t.mutedText }} aria-hidden />
              <span className={crumb.replace(" cursor-pointer", "")} style={{ background: COLOR, color: "#ffffff", border: `1px solid ${COLOR}` }}>
                {state?.name ?? level.abbr}
              </span>
            </>
          )}
        </nav>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {level.kind === "country" && country && (
            <Go color={COLOR} onClick={() => navigate(`/dashboard/countries?open=${country.id}`)}>
              Open {country.name}
            </Go>
          )}
          {level.kind === "country" && (
            <Go color={COLOR} onClick={() => navigate(`/dashboard/subnations?country=${level.code}`)}>
              All its divisions
            </Go>
          )}
          {level.kind === "state" && state && (
            <>
              <Go color={COLOR} onClick={() => navigate(`/dashboard/states?open=${state.id}`)}>
                Open {state.name}
              </Go>
              <Go color={COLOR} onClick={() => navigate(`/dashboard/subnations?open=US-${state.abbreviation}`)}>
                Its record and counties
              </Go>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem] gap-4">
        <div className="min-w-0">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl" style={{ background: t.tile, border: `1px solid ${t.gridLine}`, ["--atlas-land" as string]: land, ["--atlas-hot" as string]: COLOR }} role="group" aria-label={`A map to press. ${what}`}>
            {shapes.map((s) => (
              <path
                key={s.key}
                d={s.d}
                className="cursor-pointer fill-[var(--atlas-land)] hover:fill-[var(--atlas-hot)] focus:fill-[var(--atlas-hot)] outline-none transition-colors"
                stroke={edge}
                strokeWidth={0.6}
                strokeLinejoin="round"
                onClick={s.go}
                onMouseEnter={() => setHover(s.name)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{s.name}</title>
              </path>
            ))}
            {(loading || none) && (
              <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={15} fill={t.mutedText} fontFamily="sans-serif">
                {loading ? "Loading the boundaries…" : `No divisions are drawn for ${country?.name ?? "this country"}.`}
              </text>
            )}
          </svg>
          <p className="text-[11px] font-sans mt-2 min-h-[1.25rem]" style={{ color: hover ? t.headText : t.mutedText }} aria-live="polite">
            {hover ? <span className="font-semibold">{hover}</span> : what}
          </p>
        </div>

        {/* The same places by name: for one too small to press, and for a keyboard. */}
        <div className="min-w-0 flex flex-col">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
            {level.kind === "world" ? `${listed.length} countries` : level.kind === "state" ? `${listed.length} counties` : level.code === "US" ? `${listed.length} states` : `${listed.length} divisions`} · by name
          </p>
          <ul className="flex flex-col overflow-y-auto rounded-xl h-40 lg:h-auto lg:flex-1 lg:max-h-[22rem]" style={{ border: `1px solid ${t.gridLine}` }}>
            {listed.map((x) => (
              <li key={x.key} style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <button type="button" onClick={x.go} onFocus={() => setHover(x.name)} onBlur={() => setHover(null)} className="w-full text-left text-[11px] font-sans px-3 py-1.5 truncate hover:opacity-70 cursor-pointer" style={{ color: t.bodyText }}>
                  {x.name}
                </button>
              </li>
            ))}
            {listed.length === 0 && (
              <li className="text-[11px] font-sans px-3 py-2" style={{ color: t.mutedText }}>
                {loading ? "Loading…" : "None drawn."}
              </li>
            )}
          </ul>
        </div>
      </div>

      <p className="text-[9px] font-sans leading-snug mt-3" style={{ color: t.mutedText }}>
        The map is a way in and shades nothing. A country opens on the divisions Natural Earth draws for it - states, provinces, regions or departments, whichever its
        first order is there; the United States opens on its states, and a state on its counties. A division or a county goes to its record on the Subnations page; the
        country or the state the map is on can be opened from above it. The world here is drawn at 1:110 million and has no shape for some small countries: they are in the
        list, as are a country's far-off divisions - France's overseas departments, Spain's Canaries - which the map leaves out of its frame so that the rest can be seen.
      </p>

      <SourceLink
        sources={[
          { label: "Natural Earth — countries and admin-1 divisions (public domain)", url: "https://www.naturalearthdata.com/" },
          { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" },
        ]}
        className="mt-1"
      />
    </Card>
  );
}
