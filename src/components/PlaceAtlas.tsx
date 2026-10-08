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
 * What a press selects is the reader's to choose: the whole country, a state
 * or division of it, a county, or a city. On "the country" a press opens the
 * country itself; on "a state or division" it opens the map on a country and
 * then goes to the division pressed; on "a county" a US state opens on its
 * counties; on "a city" the cities the United Nations counts are drawn as
 * dots - those of a million people or more on the world, every one of a
 * country's once the map is on it - and a dot goes to the city's window on
 * the Cities page (unCities.ts, loaded when that choice is first made).
 *
 * At each step the place the map is on can be opened as well: the country on
 * the Countries page, the state on the US States page. A list beside the map
 * holds the same places by name, for a place too small to press and for a
 * keyboard: the 1:110m world has no shape at all for some thirty small
 * countries, and they are in the list.
 *
 * The map is a way in and shades nothing by any figure: every place is one
 * tone until it is pointed at, and then it lights in its flag's colour - a
 * country in its own (flagColors.ts), a division in its own flag's where it
 * has one (subnationFlagColors.ts), and a division or a county with no flag
 * of its own in a shade of the colour of the place it belongs to, so that
 * neighbours can still be told apart.
 *
 * The map can be drawn closer: with the + and - keys (the number pad's too),
 * the buttons above it, or a pinch; closer in, it is moved by dragging or
 * with the arrow keys, and 0 puts it back. A turn of the wheel alone still
 * scrolls the page, so the map does not trap a reader passing over it.
 *
 * Loaded when the Dashboard reaches it: the boundary files are large.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { geoAlbersUsa, geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoEqualEarth, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import statesTopo from "us-atlas/states-10m.json";
import { CaretRight, MagnifyingGlass, MagnifyingGlassMinus, MagnifyingGlassPlus, MapTrifold } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { countryForFeature, stateForFeature } from "../data/mapJoin";
import { SUBNATION_FLAG_COLOR } from "../data/subnationFlagColors";
import { flagColor, seen, shade } from "../lib/flagColor";
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
/** What a press selects. */
type Pick = "country" | "state" | "county" | "city";
const PICKS: [Pick, string][] = [
  ["country", "The country"],
  ["state", "A state or division"],
  ["county", "A county"],
  ["city", "A city"],
];
type CityModule = typeof import("../data/unCities");
/** A city on the map: a dot where its people are centred, sized by how many they are. */
type Dot = { key: string; name: string; x: number; y: number; r: number; hot: string; go: () => void };
/** A shape on the map: its name, its outline, and what a press on it does. */
type Shape = { key: string; name: string; d: string; go: () => void; /** The colour it lights in when pointed at. */ hot: string };
/** The shades the places that share one flag are told apart by, in turn: the colour itself, lighter, darker, lighter still, darker still. */
const STEPS = [0, 0.22, -0.18, 0.38, -0.32];
const tint = (base: string, i: number) => shade(base, STEPS[i % STEPS.length]);
/** A division's own flag's colour, where it has a flag. */
const ownColor = (cc: string, name: string) => {
  const raw = SUBNATION_FLAG_COLOR[cc]?.[name];
  return raw ? seen(raw) : null;
};

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
  /* How close the map is drawn, and where its middle is, in the map's own units: 1 is the whole of it. */
  const [view, setView] = useState({ k: 1, x: W / 2, y: H / 2 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** Kept on the map: no closer than twelve times, no further out than the whole, and never past an edge. */
  const held = (k: number, x: number, y: number) => {
    const z = Math.max(1, Math.min(12, k));
    const hw = W / (2 * z);
    const hh = H / (2 * z);
    return { k: z, x: Math.max(hw, Math.min(W - hw, x)), y: Math.max(hh, Math.min(H - hh, y)) };
  };
  /** Closer or further by a factor, about a point of the map - its middle unless one is given - which stays where it is. */
  const zoomBy = useCallback((factor: number, at?: { x: number; y: number }) => {
    setView((v) => {
      const k = Math.max(1, Math.min(12, v.k * factor));
      const p = at ?? { x: v.x, y: v.y };
      return held(k, p.x - (p.x - v.x) * (v.k / k), p.y - (p.y - v.y) * (v.k / k));
    });
  }, []);
  const panBy = useCallback((dx: number, dy: number) => setView((v) => held(v.k, v.x + dx, v.y + dy)), []);
  const resetView = useCallback(() => setView({ k: 1, x: W / 2, y: H / 2 }), []);
  /* A new map starts whole. */
  useEffect(() => resetView(), [level, resetView]);
  /* A pinch arrives as a wheel with Ctrl held: it draws the map closer about the pointer. A plain wheel is left to scroll the page. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      setView((v) => {
        const k = Math.max(1, Math.min(12, v.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2)));
        const px = v.x - W / (2 * v.k) + ((e.clientX - r.left) / r.width) * (W / v.k);
        const py = v.y - H / (2 * v.k) + ((e.clientY - r.top) / r.height) * (H / v.k);
        return held(k, px - (px - v.x) * (v.k / k), py - (py - v.y) * (v.k / k));
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);
  /* Dragging moves a map that is drawn closer. A drag is not a press: the press that ends one is dropped. */
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [find, setFind] = useState("");
  const [pick, setPickOnly] = useState<Pick>("state");
  const [cityData, setCityData] = useState<CityModule | null>(null);
  const setPick = (p: Pick) => {
    setPickOnly(p);
    // The whole country is chosen from the world, and a state's counties are on the map for no other choice.
    if (p === "country") setLevel({ kind: "world" });
    else if (p !== "county" && level.kind === "state") setLevel({ kind: "country", code: "US" });
  };
  /* The cities are loaded when a city is first what a press selects: there are some twelve thousand. */
  useEffect(() => {
    if (pick !== "city" || cityData) return;
    let off = false;
    import("../data/unCities").then((m) => !off && setCityData(m));
    return () => {
      off = true;
    };
  }, [pick, cityData]);

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
  const { shapes, project } = useMemo<{ shapes: Shape[]; /** Where a longitude and latitude fall on the map it is on. */ project: ((lon: number, lat: number) => [number, number] | null) | null }>(() => {
    const draw = (features: Geo[], projection: GeoProjection, name: (f: Geo) => string, go: (f: Geo) => () => void, hot: (f: Geo, i: number) => string) => {
      const path = geoPath(projection);
      return {
        shapes: features.flatMap((f, i): Shape[] => {
          const d = path(f as never);
          return d ? [{ key: `${f.id ?? ""}-${i}`, name: name(f), d, go: go(f), hot: hot(f, i) }] : [];
        }),
        project: (lon: number, lat: number) => projection([lon, lat]),
      };
    };
    if (level.kind === "world")
      return draw(
        WORLD,
        geoEqualEarth().fitExtent(BOX, { type: "Sphere" } as never),
        (f) => countryForFeature(f.properties.name)?.name ?? f.properties.name,
        (f) => () => {
          const c = countryForFeature(f.properties.name);
          if (!c) return;
          // The whole country: it is opened. Anything smaller: the map opens on it.
          if (pick === "country") navigate(`/dashboard/countries?open=${c.id}`);
          else setLevel({ kind: "country", code: c.code });
        },
        (f) => flagColor(countryForFeature(f.properties.name)?.code ?? "") ?? COLOR,
      );
    if (level.kind === "country" && level.code === "US") {
      const base = flagColor("US") ?? COLOR;
      return draw(
        STATES.map((s) => s.f),
        geoAlbersUsa().fitExtent(BOX, collection(STATES.map((s) => s.f)) as never),
        (f) => f.properties.name,
        (f) => () => {
          const s = stateForFeature(f.properties.name);
          if (!s) return;
          // A county is chosen inside its state; a state is gone to.
          if (pick === "county") setLevel({ kind: "state", abbr: s.abbreviation, fips: String(f.id) });
          else navigate(`/dashboard/subnations?open=US-${s.abbreviation}`);
        },
        (f, i) => ownColor("US", f.properties.name) ?? tint(base, i),
      );
    }
    if (level.kind === "country") {
      if (!divisions || divisions === "failed" || divisions.code !== level.code) return { shapes: [], project: null };
      const base = flagColor(level.code) ?? COLOR;
      return draw(
        divisions.features,
        fitTo(collection(framed(divisions.features))),
        (f) => f.properties.n,
        (f) => () => navigate(`/dashboard/subnations?country=${level.code}&name=${encodeURIComponent(f.properties.n)}`),
        (f, i) => ownColor(level.code, f.properties.n) ?? tint(base, i),
      );
    }
    if (!counties) return { shapes: [], project: null };
    const own = counties.filter((f) => String(f.id).startsWith(level.fips));
    // A county has no flag the site holds: shades of its state's flag's colour, or of the country's.
    const base = ownColor("US", usStatesData.find((s) => s.abbreviation === level.abbr)?.name ?? "") ?? flagColor("US") ?? COLOR;
    return draw(
      own,
      geoAlbersUsa().fitExtent(BOX, collection(own) as never),
      (f) => f.properties.name,
      (f) => () => navigate(`/dashboard/subnations?open=county:${f.id}`),
      (_, i) => tint(base, i),
    );
  }, [level, divisions, counties, navigate, pick]);

  /** The cities, where a city is what a press selects: those of a million or more on the world, and every one of the country the map is on. */
  const dots = useMemo<Dot[]>(() => {
    if (pick !== "city" || !cityData || !project || level.kind === "state") return [];
    const world = level.kind === "world";
    const list = world ? cityData.UN_CITIES.filter((c) => c[8] >= 1e6) : cityData.UN_CITIES.filter((c) => c[0] === level.code);
    return list.flatMap((c): Dot[] => {
      const xy = c[3] !== null && c[4] !== null ? project(c[4], c[3]) : null;
      if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1]) || xy[0] < 0 || xy[0] > W || xy[1] < 0 || xy[1] > H) return [];
      // A dot's area grows with its people: its radius with their square root, within bounds that keep a small city pressable and a large one from covering its neighbours.
      const r = Math.max(world ? 1.8 : 2.2, Math.min(world ? 7 : 10, Math.sqrt(c[8] / (world ? 1e6 : 2e5)) * 1.5));
      return [{ key: `${c[0]}-${c[1]}`, name: c[2], x: xy[0], y: xy[1], r, hot: flagColor(c[0]) ?? COLOR, go: () => navigate(`/dashboard/cities?open=un-${c[0]}-${c[1]}`) }];
    });
  }, [pick, cityData, project, level, navigate]);
  const onCities = pick === "city" && level.kind !== "state";

  /** The same places by name, for the list: at the world, every country the site holds. */
  const listed: { key: string; name: string; go: () => void }[] = onCities
    ? dots
    : level.kind === "world"
      ? COUNTRIES.map((c) => ({ key: c.code, name: c.name, go: () => (pick === "country" ? navigate(`/dashboard/countries?open=${c.id}`) : setLevel({ kind: "country", code: c.code })) }))
      : [...new Map(shapes.map((s) => [s.name, s])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const listLabel = onCities
    ? `${listed.length.toLocaleString("en-US")} cities · largest first`
    : `${level.kind === "world" ? `${listed.length} countries` : level.kind === "state" ? `${listed.length} counties` : level.code === "US" ? `${listed.length} states` : `${listed.length} divisions`} · by name`;

  const loading = (level.kind === "country" && level.code !== "US" && divisions === null) || (level.kind === "state" && !counties);
  const none = level.kind === "country" && level.code !== "US" && (divisions === "failed" || (manifest !== null && !manifest[level.code] && shapes.length === 0 && !loading));
  const named = country?.name ?? "the country";
  const what = onCities
    ? !cityData
      ? "Loading the cities…"
      : level.kind === "world"
        ? `Press a city to go to its window. The ${dots.length.toLocaleString("en-US")} of a million people or more are shown here; press a country for every one of its cities.`
        : `Press a city of ${named} to go to its window: the ${dots.length.toLocaleString("en-US")} the United Nations counts there.`
    : level.kind === "world"
      ? pick === "country"
        ? "Press a country to open it."
        : pick === "county"
          ? "Press the United States, and then a state, for its counties. Counties are held for the United States only."
          : "Press a country to open the map on its states, provinces or regions."
      : level.kind === "state"
        ? `Press a county of ${state?.name ?? "the state"} to go to its record.`
        : level.code === "US"
          ? pick === "county"
            ? "Press a state to open the map on its counties."
            : "Press a state to go to its record."
          : `${pick === "county" ? "Counties are held for the United States only. " : ""}Press a division of ${named} to go to its record.`;
  // In the dark theme the land is a dark grey again, as asked - but a step lighter than it first was, so that it stands clear of the card behind it.
  const land = t.isLight ? "#dfe3ea" : "#4e5262";
  const edge = t.isLight ? "#ffffff" : "#0b0b0d";
  const chip = (on: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`;
  const shownList = find.trim() ? listed.filter((x) => x.name.toLowerCase().includes(find.trim().toLowerCase())) : listed;
  const tool = "w-7 h-7 rounded-full inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default";
  const crumb = "text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer";

  return (
    <Card t={t}>
      <Head t={t} icon={<MapTrifold size={16} weight="fill" />} label="Find a place" badge="countries · states · counties · cities" color={COLOR} cta="World Maps" to="/dashboard/maps" />

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

      {/* What a press selects: the whole country, a state or division of it, a county, or a city. */}
      {/* Drawn as the bar at the head of the other pages is - its chips and its ground - but it does not stick: it belongs to this card. */}
      <div className="search-sticky border border-border/60 rounded-2xl px-3 py-2 mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="What a press on the map selects">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">A press selects</span>
        {PICKS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={pick === id} onClick={() => setPick(id)} className={chip(pick === id)}>
            {label}
          </button>
        ))}
        {/* Closer and further, beside the choice: the same as the + and - keys. */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button type="button" onClick={() => zoomBy(1 / 1.5)} disabled={view.k <= 1} aria-label="Draw the map further out" title="Further out ( - )" className={tool}>
            <MagnifyingGlassMinus size={13} aria-hidden />
          </button>
          <button type="button" onClick={() => zoomBy(1.5)} disabled={view.k >= 12} aria-label="Draw the map closer" title="Closer ( + )" className={tool}>
            <MagnifyingGlassPlus size={13} aria-hidden />
          </button>
          <button type="button" onClick={resetView} disabled={view.k === 1} className="px-2.5 h-7 rounded-full text-[10px] font-mono uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default" title="The whole map ( 0 )">
            Reset
          </button>
          <span className="text-[10px] font-mono text-muted-foreground w-9 text-right" aria-live="polite">
            {view.k.toFixed(1)}×
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_14rem] gap-4">
        <div className="min-w-0">
          <svg
            ref={svgRef}
            viewBox={`${view.x - W / (2 * view.k)} ${view.y - H / (2 * view.k)} ${W / view.k} ${H / view.k}`}
            className="w-full h-auto rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
            style={{ background: t.tile, border: `1px solid ${t.gridLine}`, ["--atlas-land" as string]: land, ["--atlas-hot" as string]: COLOR, cursor: view.k > 1 ? "grab" : undefined, touchAction: view.k > 1 ? "none" : undefined }}
            role="group"
            tabIndex={0}
            aria-label={`A map to press. ${what} With the map in focus, plus and minus draw it closer and further, the arrow keys move it and 0 puts it back.`}
            onKeyDown={(e) => {
              // The number pad's keys carry the same characters, so they are answered too.
              const step = 60 / view.k;
              if (e.key === "+" || e.key === "=") zoomBy(1.5);
              else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.5);
              else if (e.key === "0") resetView();
              else if (e.key === "ArrowLeft") panBy(-step, 0);
              else if (e.key === "ArrowRight") panBy(step, 0);
              else if (e.key === "ArrowUp") panBy(0, -step);
              else if (e.key === "ArrowDown") panBy(0, step);
              else return;
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.currentTarget.focus({ preventScroll: true });
              drag.current = { x: e.clientX, y: e.clientY, moved: false };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || view.k <= 1 || e.buttons === 0) return;
              const dx = e.clientX - d.x;
              const dy = e.clientY - d.y;
              if (!d.moved && Math.hypot(dx, dy) < 4) return;
              const r = e.currentTarget.getBoundingClientRect();
              panBy((-dx * (W / view.k)) / r.width, (-dy * (H / view.k)) / r.height);
              drag.current = { x: e.clientX, y: e.clientY, moved: true };
            }}
            onPointerLeave={() => (drag.current = null)}
            onClickCapture={(e) => {
              if (drag.current?.moved) e.stopPropagation();
              drag.current = null;
            }}
          >
            {shapes.map((s) => (
              <path
                key={s.key}
                d={s.d}
                className="cursor-pointer fill-[var(--atlas-land)] hover:fill-[var(--atlas-hot)] focus:fill-[var(--atlas-hot)] outline-none transition-colors"
                // Where the cities are what is pressed, a country still opens the map on itself; a division under the dots does nothing.
                style={{ ["--atlas-hot" as string]: s.hot, pointerEvents: onCities && level.kind !== "world" ? "none" : undefined }}
                stroke={edge}
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                onClick={s.go}
                onMouseEnter={() => setHover(s.name)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{s.name}</title>
              </path>
            ))}
            {dots.map((d) => (
              <circle
                key={d.key}
                cx={d.x}
                cy={d.y}
                // The same size on the screen however close the map is drawn, so that cities part as it closes in.
                r={d.r / view.k}
                className="cursor-pointer fill-[var(--atlas-dot)] hover:fill-[var(--atlas-hot)] transition-colors"
                // A dot is dark on the light theme's land and pale on the dark theme's, with an edge of the other tone, so that it shows on both.
                style={{ ["--atlas-hot" as string]: d.hot, ["--atlas-dot" as string]: t.isLight ? "rgba(15,23,42,0.72)" : "rgba(241,240,255,0.9)" }}
                stroke={edge}
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
                onClick={d.go}
                onMouseEnter={() => setHover(d.name)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{d.name}</title>
              </circle>
            ))}
            {(loading || none) && (
              <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={15} fill={t.mutedText} fontFamily="sans-serif">
                {loading ? "Loading the boundaries…" : `No divisions are drawn for ${country?.name ?? "this country"}.`}
              </text>
            )}
          </svg>
          <p className="text-[11px] font-sans mt-2 min-h-[1.25rem]" style={{ color: hover ? t.headText : t.mutedText }} aria-live="polite">
            {hover ? (
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: (dots.find((d) => d.name === hover) ?? shapes.find((s) => s.name === hover))?.hot ?? "transparent" }} aria-hidden />
                {hover}
              </span>
            ) : (
              what
            )}
          </p>
        </div>

        {/* The same places by name: for one too small to press, and for a keyboard. */}
        {/* Beside the map from a middling width up, the height of the map; under it on a phone. */}
        <div className="min-w-0 relative md:min-h-[12rem]">
         <div className="flex flex-col md:absolute md:inset-0">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
            {listLabel}
          </p>
          <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 mb-1.5 transition-colors focus-within:border-foreground/40">
            <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
            <input type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find one by name" aria-label="Find a place in the list by name" className="flex-1 min-w-0 bg-transparent text-[11px] font-medium font-sans text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </label>
          <ul className="flex flex-col overflow-y-auto rounded-xl h-40 md:h-auto md:flex-1 md:min-h-0" style={{ border: `1px solid ${t.gridLine}` }}>
            {shownList.map((x) => (
              <li key={x.key} style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <button type="button" onClick={x.go} onFocus={() => setHover(x.name)} onBlur={() => setHover(null)} className="w-full text-left text-[11px] font-sans px-3 py-1.5 truncate hover:opacity-70 cursor-pointer" style={{ color: t.bodyText }}>
                  {x.name}
                </button>
              </li>
            ))}
            {shownList.length === 0 && (
              <li className="text-[11px] font-sans px-3 py-2" style={{ color: t.mutedText }}>
                {loading ? "Loading…" : listed.length ? "None by that name." : "None drawn."}
              </li>
            )}
          </ul>
         </div>
        </div>
      </div>

      <p className="text-[9px] font-sans leading-snug mt-3" style={{ color: t.mutedText }}>
        The map is drawn closer with the + and - keys, the buttons above it or a pinch, moved by dragging or the arrow keys once it is closer, and put back with 0. What a press
        selects is chosen above the map:
 the whole country, a state or division, a county (held for the United States), or a city - the cities the United Nations
        counts, drawn as dots sized by their people, those of a million or more on the world and every one of a country's once the map is on it. The map is a way in and
        shades nothing by any figure.
 A place lights in its flag's colour when it is pointed at: a country in its own flag's, a division in its own
        flag's where it has one, and a division or a county with no flag of its own in a shade of the colour of the country or state it belongs to. A country opens on
 the divisions Natural Earth draws for it - states, provinces, regions or departments, whichever its
        first order is there; the United States opens on its states, and a state on its counties. A division or a county goes to its record on the Subnations page; the
        country or the state the map is on can be opened from above it. The world here is drawn at 1:110 million and has no shape for some small countries: they are in the
        list, as are a country's far-off divisions - France's overseas departments, Spain's Canaries - which the map leaves out of its frame so that the rest can be seen.
      </p>

      <SourceLink
        sources={[
          { label: "Natural Earth — countries and admin-1 divisions (public domain)", url: "https://www.naturalearthdata.com/" },
          { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" },
          { label: "United Nations — World Urbanization Prospects: The 2025 Revision (the cities)", url: "https://population.un.org/wup/" },
        ]}
        className="mt-1"
      />
    </Card>
  );
}
