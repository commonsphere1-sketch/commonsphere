/**
 * The Dashboard's map to any place: press a country and the map opens on its
 * divisions; press a division and the site goes to its record. Where a county
 * is what a press selects, a country opens on its second order instead - its
 * counties, districts or municipalities - and each is pressed for itself.
 *
 *   World            every country (Natural Earth 1:110m, by world-atlas)
 *   A country        its first-order divisions - states, provinces, regions,
 *                    departments - from the files the World Maps page draws
 *                    (static/geo/admin1, one fetched when its country is
 *                    pressed)
 *   The United       its states, and its counties (the US Census Bureau's
 *     States         boundaries, by us-atlas)
 *   A country's      its second-order divisions, where their boundaries are
 *     second order   published openly (static/geo/admin2, from geoBoundaries,
 *                    one fetched when its country is pressed; lib/admin2)
 *
 * What a press selects is the reader's to choose: the whole country, a state
 * or division of it, a county, or a city. On "the country" a press opens the
 * country itself; on "a state or division" it opens the map on a country and
 * then goes to the division pressed; on "a county" the country's counties or
 * districts are the shapes; on "a city" the cities the United Nations counts are drawn as
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
 * In the dark theme the map is drawn as the windows' own maps are
 * (components/OutlineMap): the land a wash of one colour on black -
 * the slate blue of the map the look was asked for from, on the world and on
 * every country alike - with its borders in the colour itself; a place still
 * lights in its own flag's colour when it is pointed at. In the light theme
 * the land is drawn raised off the card: a darker slab under it, set a little
 * down, and a shadow under that - a look, and no more; it says nothing about
 * height. On the map of the United States the county lines are drawn too,
 * fine, under the states' own. Where the counties or districts are the
 * shapes, the heavier lines over them are the first-order divisions' borders.
 * Where a city is what a press selects, the same counties or districts lie
 * under the dots, so that a city can be told from the ground around it.
 *
 * Under the map, what the site holds of the place last pointed at - on the
 * map or in the list - is set out: a country's capital, people and income;
 * a division's kind, capital, people and area; a US county's people and
 * land; a city's people, land and crowding; and, for a district outside the
 * United States, the division it lies in and whose its boundary is, with its
 * people and area said to be not held. Each figure carries whose it is or
 * its year. How the map is drawn is kept under it, folded away.
 *
 * The bar that says what a press selects stays at the head of the card while
 * the card is on the screen, and no longer.
 *
 * A place pointed at is picked out as the World Maps page picks one out:
 * filled in its colour over the land, with a casing so that its edge reads
 * on any ground, and an outline in the colour itself; a city, with a ring.
 *
 * The map can be drawn closer by every means a reader may have: the wheel
 * or a trackpad, two fingers pinched on a touch screen, the buttons above
 * it, and the + and - keys (the number pad's too). Closer in, it is moved by
 * dragging - a finger or the mouse - or with the arrow keys, and 0 puts it
 * back. So that the map does not trap a reader passing over it, a turn of
 * the wheel that would change nothing - further out when it is already
 * whole - is left to scroll the page, and one finger still scrolls the page
 * over a map that is whole.
 *
 * Drawn closer, the world fills in of itself: its countries from a finer
 * tracing, then the borders of their states and provinces, then those of
 * their counties and districts, then the cities - the largest first, and
 * more of them the closer it is drawn. Each is fetched when the map first
 * comes near enough to draw it. On a country's own map the cities come in
 * the same way.
 *
 * Loaded when the Dashboard reaches it: the boundary files are large.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { geoAlbersUsa, geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoEqualEarth, geoPath, type GeoProjection } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import statesTopo from "us-atlas/states-10m.json";
import { CaretRight, MagnifyingGlass, MagnifyingGlassMinus, MagnifyingGlassPlus, MapTrifold } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { COUNTRY_INDICATORS } from "../data/countryIndicators";
import { STATE_INDICATORS } from "../data/stateIndicators";
import { SUBNATION_FLAG_FILE } from "../data/subnationFlagFiles";
import { countryPeople } from "../lib/countryPeople";
import { countryForFeature, stateForFeature } from "../data/mapJoin";
import { SUBNATION_FLAG_COLOR } from "../data/subnationFlagColors";
import { ADMIN2_SOURCE, useAdmin2, useAdmin2Manifest } from "../lib/admin2";
import { flagColor, seen, shade } from "../lib/flagColor";
import { firstBorders, inView, useFiner, usePlacesOf, type Bounds, type Finer } from "../lib/finerShapes";
import { COUNTRY_LIVING, LIVING_DARK, LIVING_LIGHT, STATE_LIVING, UNSCORED, sixths, stepOf } from "../lib/livingScore";
import type { PlaceRow } from "../data/placesIndex";
import { Card, Go, Head } from "./DashboardCitiesSectors";
import { useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import PlaceSearch from "./PlaceSearch";

const W = 960;
const H = 480;
const BOX: [[number, number], [number, number]] = [
  [6, 6],
  [W - 6, H - 6],
];
const COLOR = "#3b82f6";
/* Where the six steps of living conditions fall, as the World Maps page cuts them: among the countries scored, and among the states. */
const COUNTRY_BREAKS = sixths(countriesData.flatMap((c) => (COUNTRY_LIVING[c.code] ? [COUNTRY_LIVING[c.code].score] : [])));
const STATE_BREAKS = sixths(Object.values(STATE_LIVING).map((s) => s.score));
/** How close the map can be drawn: enough, on the world, to tell one village from the next. */
const MAX_K = 200;
/* How close the world must be drawn for each finer thing to come in. */
const FINER_FROM = 2.5; // its countries from the 1:50m tracing
const STATES_FROM = 2; // the borders of states and provinces
const COUNTIES_FROM = 5; // those of counties and districts
const CITIES_FROM = 8; // the cities of a million people or more; more of them further in
const TOWNS_FROM = 14; // the towns and villages
/** The projection of the world's map: the whole globe in the card. */
const WORLD_PROJECTION = geoEqualEarth().fitExtent(BOX, { type: "Sphere" } as never);


type Geo = { type: string; id?: string | number; properties: Record<string, string>; geometry: { type: string; coordinates: unknown[] } };
type Level = { kind: "world" } | { kind: "country"; code: string };
/** What a press selects. */
type Pick = "country" | "state" | "county" | "city";
const PICKS: [Pick, string, string][] = [
  ["country", "Country", "A press opens the whole country"],
  ["state", "State", "A press goes to a state, province or other division"],
  ["county", "County", "A press goes to a county, district or municipality"],
  ["city", "City / Town", "A press goes to a city, a town or a village"],
];
type CityModule = typeof import("../data/unCities");
/** A city on the map: a dot where its people are centred, sized by how many they are. */
type Dot = { key: string; name: string; x: number; y: number; r: number; hot: string; go: () => void; ref: Ref };
/** What a place on the map is, so that what the site holds of it can be looked up when it is pointed at. */
type Ref =
  | { kind: "country"; code: string }
  | { kind: "state"; fips: string; name: string }
  | { kind: "division"; name: string; /** Its country, where the map is not on that country alone. */ cc?: string }
  | { kind: "county"; fips: string }
  | { kind: "district"; name: string; parent?: string; cc?: string }
  | { kind: "place"; cc: string; row: PlaceRow; region: string; district: string }
  | { kind: "city"; c: CityModule["UN_CITIES"][number] };
/** What is said of a place under the map: what it is, its flag, and a few of its figures - each with whose it is or its year; null where none is held. */
type About = { kicker: string; flag?: string; pale?: boolean; facts: [label: string, value: string | null, sub?: string][] };
type SubModule = typeof import("../data/subnations");
type CountyModule = typeof import("../data/usCounties");
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : whole(v));
const countryFlag = (cc: string) => `https://flagcdn.com/w80/${cc.toLowerCase()}.png`;
const COUNTRY_BY_CODE = new Map(countriesData.map((c) => [c.code, c]));
/** A shape on the map: its name, its outline, and what a press on it does. */
type Shape = { key: string; name: string; d: string; go: () => void; /** The colour it lights in when pointed at. */ hot: string; ref: Ref };
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
/** A US state by the two digits its counties' codes begin with. */
const STATE_OF_FIPS = new Map(STATES.map((s) => [String(s.f.id), s.state]));
/** The lines between the states, for the map whose shapes are the counties. */
const STATE_LINES = mesh(statesTopo as unknown as Topology, (statesTopo as unknown as Topology).objects.states as never, (a, b) => a !== b);
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
  /** The counties' file whole, for the lines between them on the map of the United States. */
  const [countyTopo, setCountyTopo] = useState<Topology | null>(null);
  /* How close the map is drawn, and where its middle is, in the map's own units: 1 is the whole of it. */
  const [view, setView] = useState({ k: 1, x: W / 2, y: H / 2 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** Kept on the map: no closer than twelve times, no further out than the whole, and never past an edge. */
  const held = (k: number, x: number, y: number) => {
    const z = Math.max(1, Math.min(MAX_K, k));
    const hw = W / (2 * z);
    const hh = H / (2 * z);
    return { k: z, x: Math.max(hw, Math.min(W - hw, x)), y: Math.max(hh, Math.min(H - hh, y)) };
  };
  const panBy = useCallback((dx: number, dy: number) => setView((v) => held(v.k, v.x + dx, v.y + dy)), []);
  const resetView = useCallback(() => setView({ k: 1, x: W / 2, y: H / 2 }), []);
  /* A glide: from where the map is to where it is asked to be, over a fifth of a second, eased - closer and further by
     equal steps of scale, so that it does not rush at the start. In a tab that is not being drawn it goes there at once. */
  const viewRef = useRef(view);
  viewRef.current = view;
  const gliding = useRef<number | null>(null);
  const glideTo = useCallback((to: { k: number; x: number; y: number }) => {
    if (gliding.current !== null) cancelAnimationFrame(gliding.current);
    const from = viewRef.current;
    const target = held(to.k, to.x, to.y);
    if (typeof document === "undefined" || document.hidden) {
      setView(target);
      return;
    }
    let began: number | null = null;
    const tick = (now: number) => {
      if (began === null) began = now;
      const p = Math.min(1, (now - began) / 220);
      const e = 1 - Math.pow(1 - p, 3);
      const k = Math.exp(Math.log(from.k) + (Math.log(target.k) - Math.log(from.k)) * e);
      setView(held(k, from.x + (target.x - from.x) * e, from.y + (target.y - from.y) * e));
      gliding.current = p < 1 ? requestAnimationFrame(tick) : null;
    };
    gliding.current = requestAnimationFrame(tick);
  }, []);
  const glideBy = useCallback((factor: number) => glideTo({ ...viewRef.current, k: viewRef.current.k * factor }), [glideTo]);
  const glideHome = useCallback(() => glideTo({ k: 1, x: W / 2, y: H / 2 }), [glideTo]);
  useEffect(() => () => void (gliding.current !== null && cancelAnimationFrame(gliding.current)), []);
  /* A new map starts whole. */
  useEffect(() => resetView(), [level, resetView]);
  /* The wheel, and a trackpad's pinch (which arrives as a wheel with Ctrl held), draw the map closer or further about the
     pointer. A turn that would change nothing - further out when the map is whole, closer when it is as close as it goes -
     is left alone, so that it scrolls the page and the map does not hold a reader who is only passing over it. */
  const kRef = useRef(1);
  kRef.current = view.k;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      const closer = e.deltaY < 0;
      if (e.deltaY === 0 || (closer ? kRef.current >= MAX_K : kRef.current <= 1)) return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      // A notch of a wheel, a line or a page of one, and the many small steps of a trackpad, each to its own measure.
      const notches = Math.min(4, Math.abs(e.deltaY) * (e.deltaMode === 1 ? 1 / 3 : e.deltaMode === 2 ? 1 : 1 / 100));
      const factor = Math.pow(1.25, closer ? notches : -notches);
      setView((v) => {
        const k = Math.max(1, Math.min(MAX_K, v.k * factor));
        const px = v.x - W / (2 * v.k) + ((e.clientX - r.left) / r.width) * (W / v.k);
        const py = v.y - H / (2 * v.k) + ((e.clientY - r.top) / r.height) * (H / v.k);
        return held(k, px - (px - v.x) * (v.k / k), py - (py - v.y) * (v.k / k));
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);
  /* The fingers, or the mouse, that are down on the map: one moves it, two pinch it closer or further about the point between them. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const between = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };
  /* Where the pointer is over the map, for the pop-up that names the place it is on: kept out of the component's state,
     and written straight to the pop-up, so that moving the pointer does not redraw the map. */
  const tipAt = useRef({ x: 0, y: 0, w: 1, h: 1 });
  const tipRef = useRef<HTMLDivElement | null>(null);
  // Above the pointer, turned to the side that keeps it on the map; under it near the top.
  const tipPlace = () => {
    const { x, y, w } = tipAt.current;
    return `translate(${x}px, ${y}px) translate(${x < 150 ? "0%" : x > w - 150 ? "-100%" : "-50%"}, ${y < 70 ? "18px" : "calc(-100% - 12px)"})`;
  };
  /* Dragging moves a map that is drawn closer. A drag is not a press: the press that ends one is dropped. */
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [find, setFind] = useState("");
  /* What a press selects follows how close the map is drawn: a country from far out, then a state, a county, a city and
     a town as it closes in. A reader can still choose for themselves; the choice holds until the map is drawn to another
     step, and across a move from the world to a country's own map. */
  const [manual, setManual] = useState<Pick | null>(null);
  const auto: Pick =
    level.kind === "world"
      ? view.k >= CITIES_FROM
        ? "city"
        : view.k >= COUNTIES_FROM
          ? "county"
          : view.k >= STATES_FROM
            ? "state"
            : "country"
      : view.k >= 5
        ? "city"
        : view.k >= 2.5
          ? "county"
          : "state";
  const pick: Pick = manual ?? auto;
  const step = useRef({ on: level.kind === "world" ? "" : level.code, auto });
  useEffect(() => {
    const on = level.kind === "world" ? "" : level.code;
    if (step.current.on === on && step.current.auto !== auto) setManual(null);
    step.current = { on, auto };
  }, [level, auto]);
  const [cityData, setCityData] = useState<CityModule | null>(null);
  const setPick = (p: Pick) => {
    setManual(p);
    const world = level.kind === "world";
    // The whole country is chosen from the world, with the whole of it in view.
    if (p === "country") {
      if (world) glideHome();
      else setLevel({ kind: "world" });
      return;
    }
    /* The map is drawn to where that kind of place is what a press selects: to where its step begins, about the middle of
       what is in view, and left as it is where it is already at that step. */
    const steps: Record<Exclude<Pick, "country">, [from: number, to: number]> = world
      ? { state: [STATES_FROM, COUNTIES_FROM], county: [COUNTIES_FROM, CITIES_FROM], city: [CITIES_FROM, Infinity] }
      : { state: [1, 2.5], county: [2.5, 5], city: [5, Infinity] };
    const [from, to] = steps[p];
    const now = viewRef.current;
    if (now.k < from || now.k >= to) glideTo({ ...now, k: from });
  };
  /* What the map fills in with as it is drawn closer. On the world: its countries from a finer tracing, the states' and
     provinces' borders, the counties' and districts', and the cities - those of a million people first, then of 300,000,
     then every one the United Nations counts. On a country's own map: its cities. */
  const onWorld = level.kind === "world";
  const worldFloor = view.k >= 24 ? 0 : view.k >= 14 ? 3e5 : 1e6;
  /* Where a city is what a press selects, the towns and villages take the cities' place once the map is close enough to tell them apart. */
  const showTowns = pick === "city" && (onWorld ? view.k >= TOWNS_FROM : view.k >= 4);
  const onTowns = showTowns;
  const showCities = !showTowns && (pick === "city" || (onWorld ? view.k >= CITIES_FROM : view.k >= 3));
  /* The cities are loaded when they are first to be drawn: there are some twelve thousand. */
  useEffect(() => {
    if (!showCities || cityData) return;
    let off = false;
    import("../data/unCities").then((m) => !off && setCityData(m));
    return () => {
      off = true;
    };
  }, [showCities, cityData]);
  /* Each of the world's finer layers is fetched a little before the map is close enough to draw it, and kept. */
  const [fineWorld, setFineWorld] = useState<Geo[] | null>(null);
  const [stateLines, setStateLines] = useState<unknown | null>(null);
  const [countyLines, setCountyLines] = useState<unknown | null>(null);
  const near = (from: number) => onWorld && view.k >= from * 0.8;
  const wantFiner = near(FINER_FROM) && !fineWorld;
  const wantStates = near(STATES_FROM) && !stateLines;
  const wantCountyLines = near(COUNTIES_FROM) && !countyLines;
  useEffect(() => {
    if (!wantFiner) return;
    let off = false;
    import("world-atlas/countries-50m.json").then((m) => !off && setFineWorld(featuresOf((m.default ?? m) as unknown as Topology, "countries")));
    return () => {
      off = true;
    };
  }, [wantFiner]);
  useEffect(() => {
    if (!wantStates && !wantCountyLines) return;
    let off = false;
    const lines = (url: string, set: (g: unknown) => void) =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((topo: Topology) => !off && set(feature(topo, topo.objects.b)))
        // Without them the map still draws what it has.
        .catch(() => undefined);
    if (wantStates) lines("/geo/admin1-borders.json", setStateLines);
    if (wantCountyLines) lines("/geo/admin2-borders.json", setCountyLines);
    return () => {
      off = true;
    };
  }, [wantStates, wantCountyLines]);
  const worldPath = useMemo(() => geoPath(WORLD_PROJECTION), []);
  const stateLinesD = useMemo(() => (stateLines ? (worldPath(stateLines as never) ?? "") : ""), [stateLines, worldPath]);
  /* The file of the districts' lines holds two sets a country: the borders between districts of one division, and those
     between its divisions - the states' borders from the districts' own tracing. Once the map is close enough for the
     districts, a country's states' borders are drawn from that set, so that they meet the districts', and Natural
     Earth's are kept only for the countries that have no districts held. */
  const countySets = useMemo(() => {
    const features = (countyLines as { features?: { properties: { c: string; o: 1 | 2 } }[] } | null)?.features ?? [];
    const of = (o: 1 | 2) => worldPath({ type: "FeatureCollection", features: features.filter((f) => f.properties.o === o) } as never) ?? "";
    return { inner: features.length ? of(2) : "", first: features.length ? of(1) : "", held: new Set(features.map((f) => f.properties.c)) };
  }, [countyLines, worldPath]);
  const countyLinesD = countySets.inner;
  const stateLinesRestD = useMemo(() => {
    const features = (stateLines as { features?: { properties: { c: string } }[] } | null)?.features ?? [];
    return features.length && countySets.held.size ? (worldPath({ type: "FeatureCollection", features: features.filter((f) => !countySets.held.has(f.properties.c)) } as never) ?? "") : "";
  }, [stateLines, countySets, worldPath]);
  /** The world's countries as they are drawn: from the finer tracing once the map is close enough for the coarser to show its corners. */
  const worldDrawn = onWorld && view.k >= FINER_FROM && fineWorld ? fineWorld : WORLD;

  /* The world, drawn closer, is pressed by smaller places: the states and provinces of the countries in view, then their
     counties and districts. Which, is the order the map is close enough for and the press is on; the countries in view
     are asked for a few at a time, the nearest the middle first. */
  const order: 0 | 1 | 2 = !onWorld || pick === "country" ? 0 : pick === "state" ? (view.k >= STATES_FROM ? 1 : 0) : view.k >= COUNTIES_FROM ? 2 : pick === "county" ? 0 : view.k >= STATES_FROM ? 1 : 0;
  const worldBounds = useMemo<Bounds[]>(
    () =>
      worldDrawn.flatMap((f) => {
        const c = countryForFeature(f.properties.name);
        if (!c) return [];
        // A piece at a time: a country with land on both sides of 180° would otherwise be "in view" from anywhere.
        const pieces = f.geometry.type === "MultiPolygon" ? (f.geometry.coordinates as unknown[]).map((p) => ({ type: "Polygon", coordinates: p })) : [f.geometry];
        return pieces.flatMap((g) => {
          const [[x0, y0], [x1, y1]] = worldPath.bounds(g as never);
          return Number.isFinite(x0) && Number.isFinite(x1) ? [{ code: c.code, x0, y0, x1, y1 }] : [];
        });
      }),
    [worldDrawn, worldPath],
  );
  const viewCodes = useMemo(
    () => (onWorld && (order || showTowns) ? inView(worldBounds, { x: view.x, y: view.y, w: W / view.k, h: H / view.k }, order === 1 ? 40 : 12) : []),
    [onWorld, order, showTowns, worldBounds, view],
  );
  const finer = useFiner(viewCodes, order);
  /* A country with no second order held is pressed by its first. */
  const without = useMemo(() => (order === 2 ? viewCodes.filter((c) => finer.get(c)?.length === 0) : []), [order, viewCodes, finer]);
  const finerFirst = useFiner(without, order === 2 ? 1 : 0);
  /** Each country's shapes, drawn once and kept, with where each lies on the map. */
  const built = useRef(new Map<string, { s: Shape; x0: number; y0: number; x1: number; y1: number }[]>());
  const finerShapes = useMemo<Shape[]>(() => {
    if (!order) return [];
    const shapeOf = (f: Finer, i: number, d: string): Shape => {
      const land = COUNTRY_BY_CODE.get(f.code)?.name ?? f.code;
      const base = flagColor(f.code) ?? COLOR;
      if (f.order === 1)
        return {
          key: `1-${f.code}-${f.index}`,
          name: `${f.name}, ${land}`,
          d,
          go: () => navigate(`/dashboard/subnations?country=${f.code}&name=${encodeURIComponent(f.name)}`),
          hot: ownColor(f.code, f.name) ?? tint(base, i),
          ref: { kind: "division", name: f.name, cc: f.code },
        };
      if (f.fips)
        return {
          key: `2-US-${f.fips}`,
          name: [f.name, f.parent, land].filter(Boolean).join(", "),
          d,
          go: () => navigate(`/dashboard/subnations?open=county:${f.fips}`),
          hot: tint(ownColor("US", f.parent ?? "") ?? base, i),
          ref: { kind: "county", fips: f.fips },
        };
      return {
        key: `2-${f.code}-${f.index}`,
        name: [f.name, f.parent, land].filter(Boolean).join(", "),
        d,
        go: () => navigate(`/dashboard/subnations?open=district:${f.code}:${f.index}`),
        hot: tint(ownColor(f.code, f.parent ?? "") ?? base, i),
        ref: { kind: "district", name: f.name, parent: f.parent, cc: f.code },
      };
    };
    const x0 = view.x - W / (2 * view.k);
    const x1 = view.x + W / (2 * view.k);
    const y0 = view.y - H / (2 * view.k);
    const y1 = view.y + H / (2 * view.k);
    const out: Shape[] = [];
    for (const code of viewCodes) {
      const own = finer.get(code);
      const list = own && own.length ? own : finerFirst.get(code);
      if (!list || !list.length) continue;
      const key = `${list[0].order}:${code}`;
      if (!built.current.has(key))
        built.current.set(
          key,
          list.flatMap((f, i) => {
            const d = worldPath(f.geo as never);
            if (!d) return [];
            const [[a, b], [c, e]] = worldPath.bounds(f.geo as never);
            return [{ s: shapeOf(f, i, d), x0: a, y0: b, x1: c, y1: e }];
          }),
        );
      // Only those in view are drawn: a large country has thousands.
      for (const b of built.current.get(key)!) if (b.x1 >= x0 && b.x0 <= x1 && b.y1 >= y0 && b.y0 <= y1) out.push(b.s);
    }
    return out;
  }, [order, viewCodes, finer, finerFirst, view, worldPath, navigate]);

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

  /* The counties are fetched when the map is first on the United States: their lines are drawn there, and they are its shapes where a county is what a press selects. */
  const wantCounties = level.kind === "country" && level.code === "US";
  useEffect(() => {
    if (!wantCounties || counties) return;
    let off = false;
    import("us-atlas/counties-10m.json").then((m) => {
      if (off) return;
      const topo = (m.default ?? m) as unknown as Topology;
      setCountyTopo(topo);
      setCounties(featuresOf(topo, "counties"));
    });
    return () => {
      off = true;
    };
  }, [wantCounties, counties]);

  const country = code ? (countriesData.find((c) => c.code === code) ?? null) : null;
  const named = country?.name ?? "the country";

  /* A country's second order, fetched where a county is what a press selects: undefined while it is, null where none is held. The United States' own are the Census Bureau's, above. */
  const manifest2 = useAdmin2Manifest();
  /** Whether the map is drawn at a country's second order: where a county is what a press selects, and under the dots where a city is. */
  const fine = pick === "county" || pick === "city";
  const second = useAdmin2(fine && code && code !== "US" ? code : null);
  const secondInfo = code && manifest2 ? manifest2[code] : undefined;
  /** Whether the shapes on the map are a country's second order. */
  const onSecond = fine && level.kind === "country" && (level.code === "US" || Boolean(second));
  /** Whether the map is on a country other than the United States. */
  const abroadNow = level.kind === "country" && level.code !== "US";

  /** The shapes of the level the map is on, each with what a press does. */
  const { shapes, project, lines, bold } = useMemo<{
    shapes: Shape[];
    /** Where a longitude and latitude fall on the map it is on. */
    project: ((lon: number, lat: number) => [number, number] | null) | null;
    /** The lines drawn over the shapes: the counties' on the map of the states, the first-order divisions' on a map of counties or districts. */
    lines: string;
    /** Whether those lines are the heavier ones, of the order above the shapes. */
    bold: boolean;
  }>(() => {
    const empty = { shapes: [], project: null, lines: "", bold: false };
    const draw = (features: Geo[], projection: GeoProjection, name: (f: Geo) => string, go: (f: Geo, i: number) => () => void, hot: (f: Geo, i: number) => string, ref: (f: Geo) => Ref) => {
      const path = geoPath(projection);
      return {
        shapes: features.flatMap((f, i): Shape[] => {
          const d = path(f as never);
          return d ? [{ key: `${f.id ?? ""}-${i}`, name: name(f), d, go: go(f, i), hot: hot(f, i), ref: ref(f) }] : [];
        }),
        project: (lon: number, lat: number) => projection([lon, lat]),
        lines: "",
        bold: false,
      };
    };
    if (level.kind === "world")
      return draw(
        worldDrawn,
        WORLD_PROJECTION,
        (f) => countryForFeature(f.properties.name)?.name ?? f.properties.name,
        (f) => () => {
          const c = countryForFeature(f.properties.name);
          if (!c) return;
          // The whole country: it is opened. Anything smaller: the map opens on it.
          if (pick === "country") navigate(`/dashboard/countries?open=${c.id}`);
          else setLevel({ kind: "country", code: c.code });
        },
        (f) => flagColor(countryForFeature(f.properties.name)?.code ?? "") ?? COLOR,
        (f) => ({ kind: "country", code: countryForFeature(f.properties.name)?.code ?? "" }),
      );
    if (level.code === "US") {
      const base = flagColor("US") ?? COLOR;
      const projection = geoAlbersUsa().fitExtent(BOX, collection(STATES.map((s) => s.f)) as never);
      // Where a county is what a press selects, the counties are the shapes, each pressed for itself, and the states' borders are the lines over them.
      if (fine) {
        if (!counties) return empty;
        const stateOf = (f: Geo) => STATE_OF_FIPS.get(String(f.id).slice(0, 2));
        const drawn = draw(
          counties,
          projection,
          // A county's name is not its own alone - there are thirty Washingtons - so its state goes with it.
          (f) => (stateOf(f) ? `${f.properties.name}, ${stateOf(f)!.abbreviation}` : f.properties.name),
          (f) => () => navigate(`/dashboard/subnations?open=county:${f.id}`),
          // A county has no flag the site holds: shades of its state's flag's colour, or of the country's.
          (f, i) => tint(ownColor("US", stateOf(f)?.name ?? "") ?? base, i),
          (f) => ({ kind: "county", fips: String(f.id) }),
        );
        return { ...drawn, lines: geoPath(projection)(STATE_LINES as never) ?? "", bold: true };
      }
      const drawn = draw(
        STATES.map((s) => s.f),
        projection,
        (f) => f.properties.name,
        (f) => () => {
          const s = stateForFeature(f.properties.name);
          if (s) navigate(`/dashboard/subnations?open=US-${s.abbreviation}`);
        },
        (f, i) => ownColor("US", f.properties.name) ?? tint(base, i),
        (f) => ({ kind: "state", fips: String(f.id), name: f.properties.name }),
      );
      // The lines between counties, once their file is in: one path, under the states' own borders.
      const between = countyTopo ? mesh(countyTopo, countyTopo.objects.counties as never, (a, b) => a !== b) : null;
      return { ...drawn, lines: between ? (geoPath(projection)(between as never) ?? "") : "", bold: false };
    }
    const base = flagColor(level.code) ?? COLOR;
    // Its second order, where a county is what a press selects and its boundaries are held: each shape goes to a window of its own, by its place in the file.
    if (fine && second === undefined) return empty;
    if (fine && second) {
      const own = second.shapes as unknown as Geo[];
      const projection = fitTo(collection(framed(own)));
      const drawn = draw(
        own,
        projection,
        // A district's name is not always its own alone, so the division it lies in goes with it.
        (f) => (f.properties.p ? `${f.properties.n}, ${f.properties.p}` : f.properties.n),
        (_, i) => () => navigate(`/dashboard/subnations?open=district:${level.code}:${i}`),
        // Shades of the flag's colour of the division it lies in, or of the country's.
        (f, i) => tint(ownColor(level.code, f.properties.p ?? "") ?? base, i),
        (f) => ({ kind: "district", name: f.properties.n, parent: f.properties.p }),
      );
      type Placed = { properties?: { p?: string } };
      const between = mesh(second.topo, second.topo.objects.a as never, (a, b) => (a as Placed).properties?.p !== (b as Placed).properties?.p);
      return { ...drawn, lines: geoPath(projection)(between as never) ?? "", bold: true };
    }
    if (!divisions || divisions === "failed" || divisions.code !== level.code) return empty;
    return draw(
      divisions.features,
      fitTo(collection(framed(divisions.features))),
      (f) => f.properties.n,
      (f) => () => navigate(`/dashboard/subnations?country=${level.code}&name=${encodeURIComponent(f.properties.n)}`),
      (f, i) => ownColor(level.code, f.properties.n) ?? tint(base, i),
      (f) => ({ kind: "division", name: f.properties.n }),
    );
  }, [level, divisions, counties, countyTopo, second, navigate, pick, fine, worldDrawn]);

  /** The cities, where a city is what a press selects: those of a million or more on the world, and every one of the country the map is on. */
  const cityDots = useMemo<Dot[]>(() => {
    if (!showCities || !cityData || !project) return [];
    const world = level.kind === "world";
    const list = world ? cityData.UN_CITIES.filter((c) => c[8] >= worldFloor) : cityData.UN_CITIES.filter((c) => c[0] === level.code);
    return list.flatMap((c): Dot[] => {
      const xy = c[3] !== null && c[4] !== null ? project(c[4], c[3]) : null;
      if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1]) || xy[0] < 0 || xy[0] > W || xy[1] < 0 || xy[1] > H) return [];
      // A dot's area grows with its people: its radius with their square root, within bounds that keep a small city pressable and a large one from covering its neighbours.
      const r = Math.max(2.8, Math.min(world ? 8 : 10, Math.sqrt(c[8] / (world ? 1e6 : 2e5)) * 1.6));
      return [{ key: `${c[0]}-${c[1]}`, name: world ? `${c[2]}, ${COUNTRY_BY_CODE.get(c[0])?.name ?? c[0]}` : c[2], x: xy[0], y: xy[1], r, hot: flagColor(c[0]) ?? COLOR, go: () => navigate(`/dashboard/cities?open=un-${c[0]}-${c[1]}`), ref: { kind: "city", c } }];
    });
  }, [showCities, worldFloor, cityData, project, level, navigate]);
  /* The towns and villages GeoNames lists - of the countries in view on the world, of the country itself on its own map:
     those in the part of the map that is in view, the largest first, and no more than can be told apart. */
  const townCodes = useMemo(() => (showTowns ? (level.kind === "world" ? viewCodes.slice(0, 8) : [level.code]) : []), [showTowns, level, viewCodes]);
  const townFiles = usePlacesOf(townCodes);
  const townAt = useRef<{ project: unknown; by: Map<string, { x: number; y: number; row: PlaceRow }[]> }>({ project: null, by: new Map() });
  const towns = useMemo<Dot[]>(() => {
    if (!showTowns || !project) return [];
    // Where each town falls is worked out once for a map, and again when the map changes.
    if (townAt.current.project !== project) townAt.current = { project, by: new Map() };
    const hw = W / (2 * view.k) + 6;
    const hh = H / (2 * view.k) + 6;
    const seen: { cc: string; x: number; y: number; row: PlaceRow }[] = [];
    for (const cc of townCodes) {
      const file = townFiles.get(cc);
      if (!file) continue;
      if (!townAt.current.by.has(cc))
        townAt.current.by.set(
          cc,
          file.places.flatMap((row) => {
            const xy = project(row[2], row[1]);
            return xy && Number.isFinite(xy[0]) && Number.isFinite(xy[1]) && xy[0] >= 0 && xy[0] <= W && xy[1] >= 0 && xy[1] <= H ? [{ x: xy[0], y: xy[1], row }] : [];
          }),
        );
      for (const p of townAt.current.by.get(cc)!) if (Math.abs(p.x - view.x) <= hw && Math.abs(p.y - view.y) <= hh) seen.push({ cc, ...p });
    }
    seen.sort((a, b) => b.row[3] - a.row[3]);
    return seen.slice(0, 600).map(({ cc, x, y, row }): Dot => {
      const file = townFiles.get(cc)!;
      const region = file.regions[row[4]] ?? "";
      return {
        key: `t-${cc}-${row[6]}`,
        name: [row[0], region, COUNTRY_BY_CODE.get(cc)?.name ?? cc].filter(Boolean).join(", "),
        x,
        y,
        // Its area grows with its people, within bounds that keep a village pressable.
        r: Math.max(2.6, Math.min(7, Math.sqrt(row[3] / 5e4) * 2)),
        hot: flagColor(cc) ?? COLOR,
        go: () => navigate(`/dashboard/subnations?open=place:${cc}:${row[6]}`),
        ref: { kind: "place", cc, row, region, district: file.districts[row[7]] ?? "" },
      };
    });
  }, [showTowns, project, townCodes, townFiles, view, navigate]);
  const dots = showTowns ? towns : cityDots;
  /** The cities that are drawn: those in the part of the map that is in view, once it is drawn closer - there may be thousands off it. */
  const dotsInView = useMemo(() => {
    if (view.k <= 1) return dots;
    const hw = W / (2 * view.k) + 10;
    const hh = H / (2 * view.k) + 10;
    return dots.filter((d) => Math.abs(d.x - view.x) <= hw && Math.abs(d.y - view.y) <= hh);
  }, [dots, view]);
  const onCities = pick === "city";

  /* Where the counties themselves are the shapes, the states' borders over them are cut from the very file the shapes
     are from - not the lighter file of lines above - so that at any closeness they lie on the counties' own edges. */
  const firstsBuilt = useRef(new Map<string, string>());
  const exactFirstsD = useMemo(() => {
    if (order !== 2) return "";
    let d = "";
    for (const c of viewCodes) {
      if (!finer.get(c)?.length) continue;
      if (!firstsBuilt.current.has(c)) {
        const g = firstBorders(c);
        if (!g) continue;
        firstsBuilt.current.set(c, worldPath(g as never) ?? "");
      }
      d += firstsBuilt.current.get(c);
    }
    return d;
  }, [order, viewCodes, finer, worldPath]);

  /** The same places by name, for the list: at the world, every country the site holds. */
  const listed: { key: string; name: string; go: () => void; ref: Ref }[] = onCities || onTowns
    ? dots
    : level.kind === "world"
      ? COUNTRIES.map((c) => ({ key: c.code, name: c.name, ref: { kind: "country", code: c.code } as Ref, go: () => (pick === "country" ? navigate(`/dashboard/countries?open=${c.id}`) : setLevel({ kind: "country", code: c.code })) }))
      : [...new Map(shapes.map((s) => [s.name, s])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const listLabel = onTowns
    ? `${listed.length.toLocaleString("en-US")} towns and villages in view · largest first`
    : onCities
    ? `${listed.length.toLocaleString("en-US")} cities · largest first`
    : `${level.kind === "world" ? `${listed.length} countries` : onSecond ? `${listed.length.toLocaleString("en-US")} ${level.code === "US" ? "counties" : "counties or districts"}` : level.code === "US" ? `${listed.length} states` : `${listed.length} divisions`} · by name`;

  const abroad = level.kind === "country" && level.code !== "US";
  const loading = abroad ? (fine && second === undefined) || (!second && divisions === null) : level.kind === "country" && fine && !counties;
  /* The place pointed at, on the map or in the list: a city before the ground it stands on. */
  const litDot = hover ? dots.find((d) => d.name === hover) : undefined;
  const litShape = hover && !litDot ? (finerShapes.find((s) => s.name === hover) ?? shapes.find((s) => s.name === hover)) : undefined;

  /* What is set out under the map: the place last pointed at, on the map or in the list. It stays when the pointer leaves, and goes when the map changes. */
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    if (hover) setLast(hover);
  }, [hover]);
  useEffect(() => setLast(null), [level, pick]);
  /* The records the details are read from, fetched when the map first needs them: the divisions' once it is on a country, the counties' once the United States' are its shapes. */
  const [subs, setSubs] = useState<SubModule | null>(null);
  const [usc, setUsc] = useState<CountyModule | null>(null);
  useEffect(() => {
    if (!(abroadNow || (onWorld && order > 0)) || subs) return;
    let off = false;
    import("../data/subnations").then((m) => !off && setSubs(m));
    return () => {
      off = true;
    };
  }, [abroadNow, onWorld, order, subs]);
  useEffect(() => {
    if (!((wantCounties && fine) || (onWorld && order === 2)) || usc) return;
    let off = false;
    import("../data/usCounties").then((m) => !off && setUsc(m));
    return () => {
      off = true;
    };
  }, [wantCounties, fine, onWorld, order, usc]);
  const item = last ? (dots.find((d) => d.name === last) ?? finerShapes.find((s) => s.name === last) ?? shapes.find((s) => s.name === last) ?? listed.find((x) => x.name === last)) : undefined;
  /** What the site holds of a place: looked up for the one place that is set out, when it is. */
  const describe = (ref: Ref): About => {
    if (ref.kind === "country") {
      const c = COUNTRY_BY_CODE.get(ref.code);
      const pop = countryPeople(ref.code);
      const ci = COUNTRY_INDICATORS[ref.code];
      return {
        kicker: ["Country", c?.continent].filter(Boolean).join(" · "),
        flag: ref.code ? countryFlag(ref.code) : undefined,
        facts: [
          ["Capital", c?.capital && c.capital !== "None" ? c.capital : null],
          ["Population", pop ? people(pop.v) : null, pop?.y],
          ["GDP per person", ci?.gdpPerCapita ? `$${whole(ci.gdpPerCapita.v)}` : null, ci?.gdpPerCapita?.y],
          ["Life expectancy", ci?.lifeExpectancy ? `${ci.lifeExpectancy.v} years` : null, ci?.lifeExpectancy?.y],
          ["Divisions drawn", manifest?.[ref.code] ? whole(manifest[ref.code]) : null],
          ["Counties or districts", ref.code === "US" ? "3,142" : manifest2?.[ref.code] ? whole(manifest2[ref.code].n) : null, ref.code === "US" ? "drawn, of the Census Bureau's" : manifest2?.[ref.code]?.kind],
        ],
      };
    }
    if (ref.kind === "state") {
      const s = STATE_OF_FIPS.get(ref.fips);
      const m = s ? STATE_INDICATORS[s.id] : undefined;
      const saved = s ? SUBNATION_FLAG_FILE[`US-${s.abbreviation}`] : undefined;
      return {
        kicker: ["State", s?.region, "United States"].filter(Boolean).join(" · "),
        flag: saved ? `/flags/divisions/${saved}` : countryFlag("US"),
        pale: !saved,
        facts: [
          ["Capital", s?.capital ?? null],
          ["Population", m ? people(m.population.v) : null, m ? `Census Bureau · ${m.population.y}` : undefined],
          ["Governor", m?.governor.name ?? null],
          ["Counties", counties ? whole(counties.filter((f) => String(f.id).startsWith(ref.fips)).length) : null, counties ? "drawn" : undefined],
        ],
      };
    }
    if (ref.kind === "division") {
      const cc = ref.cc ?? code;
      const s = subs?.SUBNATIONS.find((x) => x.cc === cc && x.name === ref.name);
      const saved = s ? SUBNATION_FLAG_FILE[s.id] : undefined;
      return {
        kicker: [s?.kind ?? "Division", ref.cc ? (COUNTRY_BY_CODE.get(ref.cc)?.name ?? ref.cc) : named].join(" · "),
        flag: saved ? `/flags/divisions/${saved}` : cc ? countryFlag(cc) : undefined,
        pale: !saved,
        facts: [
          ["Capital", s?.capital ?? null],
          ["Population", s?.pop ? people(s.pop[1]) : null, s?.pop ? String(s.pop[0]) : undefined],
          ["Area", s?.areaKm2 ? `${whole(s.areaKm2)} km²` : null],
          ["Code", s?.code ?? null],
        ],
      };
    }
    if (ref.kind === "county") {
      const row = usc?.US_COUNTIES.find((x) => x[0] === ref.fips);
      const s = STATE_OF_FIPS.get(ref.fips.slice(0, 2));
      const years = usc?.US_COUNTY_YEARS;
      return {
        kicker: ["County", s?.name, "United States"].filter(Boolean).join(" · "),
        flag: countryFlag("US"),
        pale: true,
        facts: [
          ["State", s?.name ?? null],
          ["Population", row ? whole(row[7][row[7].length - 1]) : null, row && years ? `Census Bureau · 1 July ${years[years.length - 1]}` : undefined],
          ["Land area", row && row[5] != null ? `${whole(row[5])} km²` : null],
          ["FIPS code", ref.fips],
        ],
      };
    }
    if (ref.kind === "district") {
      const cc = ref.cc ?? code;
      const info = ref.cc ? manifest2?.[ref.cc] : secondInfo;
      return {
        kicker: [info?.kind ?? "Second-order division", ref.cc ? (COUNTRY_BY_CODE.get(ref.cc)?.name ?? ref.cc) : named].join(" · "),
        flag: cc ? countryFlag(cc) : undefined,
        pale: true,
        facts: [
          ["Division", ref.parent ?? null, ref.parent ? "the one most of its outline lies in" : undefined],
          ["Boundary", info?.by ?? null, info?.year],
          ["Population", null],
          ["Area", null],
        ],
      };
    }
    if (ref.kind === "place") {
      const [, lat, lon, pop] = ref.row;
      return {
        // A city, a town or a village by its people, as the Municipalities page calls it: from 50,000, from 5,000, below.
        kicker: [pop >= 50000 ? "City" : pop >= 5000 ? "Town" : pop > 0 ? "Village" : "Populated place", ref.region, COUNTRY_BY_CODE.get(ref.cc)?.name ?? ref.cc].filter(Boolean).join(" · "),
        flag: countryFlag(ref.cc),
        pale: true,
        facts: [
          ["People", pop > 0 ? whole(pop) : null, pop > 0 ? "GeoNames, undated" : undefined],
          ["County or district", ref.district || null],
          ["Division", ref.region || null],
          ["Coordinates", `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`, "where GeoNames places it"],
        ],
      };
    }
    const c = ref.c;
    const year = cityData?.UN_CITY_YEARS[2];
    return {
      kicker: ["City", COUNTRY_BY_CODE.get(c[0])?.name ?? c[0], c[5] ? "its capital" : ""].filter(Boolean).join(" · "),
      flag: countryFlag(c[0]),
      facts: [
        ["Population", whole(c[8]), `UN estimate, ${year}`],
        ["Land area", c[10] != null ? `${c[10] < 100 ? c[10].toFixed(1) : whole(c[10])} km²` : null, c[10] != null ? String(year) : undefined],
        ["People to a km²", c[11] != null ? whole(c[11]) : null, c[11] != null ? String(year) : undefined],
        [`Projected for ${cityData?.UN_CITY_YEARS[3]}`, c[9] != null ? whole(c[9]) : null, c[9] != null ? "the UN's projection" : undefined],
      ],
    };
  };
  const about = item ? describe(item.ref) : null;
  /** What the bar says while nothing is pointed at: as asked, that any area can be selected or hovered over - after anything the reader has to be told first. */
  const hint = loading
    ? "Loading the boundaries…"
    : onTowns
      ? "Select or hover over any city, town or village."
      : onCities
        ? cityData
          ? "Select or hover over any city. Zoom in for its towns and villages."
          : "Loading the cities…"
        : `${abroad && fine && second === null ? `No counties or districts are held for ${named}, so its divisions are shown. ` : ""}Select or hover over any area.${onWorld ? " Zoom in to select states, then counties, then cities and towns." : ""}`;
  const none = abroad && !second && (divisions === "failed" || (manifest !== null && !manifest[level.code] && shapes.length === 0 && !loading));

  const what = onTowns
    ? "Press a city, a town or a village to go to its window: the largest of those in view are shown."
    : onCities
    ? !cityData
      ? "Loading the cities…"
      : level.kind === "world"
        ? `Press a city to go to its window. The ${dots.length.toLocaleString("en-US")} ${worldFloor >= 1e6 ? "of a million people or more" : worldFloor > 0 ? "of 300,000 people or more" : "the United Nations counts"} are shown here; draw the map closer for more, or press a country for every one of its cities.`
        : `Press a city of ${named} to go to its window: the ${dots.length.toLocaleString("en-US")} the United Nations counts there.`
    : level.kind === "world"
      ? order === 2
        ? "Press a county or a district to go to its window."
        : order === 1
          ? "Press a state, a province or a region to go to its record."
          : pick === "country"
        ? "Press a country to open it."
        : pick === "county"
          ? "Press a country to open the map on its counties, districts or municipalities."
          : "Press a country to open the map on its states, provinces or regions."
      : level.code === "US"
        ? pick === "county"
          ? "Press a county to go to its record. The heavier lines are the states'."
          : "Press a state to go to its record."
        : pick === "county" && second
          ? `Press one of the ${second.shapes.length.toLocaleString("en-US")} second-order divisions of ${named}${secondInfo?.kind ? ` - "${secondInfo.kind}", as their publisher has it -` : ""} to go to its window. The heavier lines are its first-order divisions'.`
          : `${pick === "county" && second === null ? `No second-order boundaries are held for ${named}, so its first-order divisions are shown. ` : ""}Press a division of ${named} to go to its record.`;
  /* The map is drawn as the World Maps page draws its own, in both themes: each country in the colour of its living
     conditions - the sixth of the scored countries it falls in - translucent inside an edge of the same colour, and grey
     where it has no score. A country's states, counties and districts are in its colour, since no figures are held for
     them; on the United States' own map each state, and the counties in it, is in the colour of its own score among the states. */
  const ramp = t.isLight ? LIVING_LIGHT : LIVING_DARK;
  const countryInk = (cc: string | null | undefined) => (cc && COUNTRY_LIVING[cc] ? ramp[stepOf(COUNTRY_LIVING[cc].score, COUNTRY_BREAKS)] : UNSCORED);
  const stateInk = (name: string | undefined) => (name && STATE_LIVING[name] ? ramp[stepOf(STATE_LIVING[name].score, STATE_BREAKS)] : UNSCORED);
  const inkOf = (ref: Ref): string =>
    ref.kind === "country"
      ? countryInk(ref.code)
      : ref.kind === "state"
        ? stateInk(ref.name)
        : ref.kind === "county"
          ? onWorld
            ? countryInk("US")
            : stateInk(STATE_OF_FIPS.get(ref.fips.slice(0, 2))?.name)
          : ref.kind === "city"
            ? countryInk(ref.c[0])
            : ref.kind === "place"
              ? countryInk(ref.cc)
              : countryInk(ref.cc ?? code);
  /** The finer borders drawn over the whole world: light on the dark card, dark on the light one. */
  const inner = t.isLight ? "#0f172a" : "#ffffff";
  /** The casing round a place that is picked out, so that its edge reads on any ground. */
  const halo = t.isLight ? "#ffffff" : "#000000";
  /** The dots, the largest first, so that a small one is never under a large one and can always be pressed. */
  const dotsDrawn = [...dotsInView].sort((a, b) => b.r - a.r);
  const chip = (on: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`;
  const shownList = find.trim() ? listed.filter((x) => x.name.toLowerCase().includes(find.trim().toLowerCase())) : listed;
  const tool = "w-8 h-8 rounded-full inline-flex items-center justify-center border border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted transition-colors cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-default";
  const crumb = "text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer";

  return (
    <Card t={t}>
      <Head t={t} icon={<MapTrifold size={16} weight="fill" />} label="Find a place" badge="countries · states · counties · cities · towns" color={COLOR} cta="World Maps" to="/dashboard/maps" />

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
                onClick={() => setLevel({ kind: "country", code: level.code })}
                className={crumb}
                style={{ background: level.kind === "country" ? COLOR : t.tile, color: level.kind === "country" ? "#ffffff" : t.bodyText, border: `1px solid ${level.kind === "country" ? COLOR : t.gridLine}` }}
              >
                {country?.name ?? level.code}
              </button>
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
        </div>
      </div>

      {/* What a press selects: the whole country, a state or division of it, a county, or a city. */}
      {/* Drawn as the bar at the head of the other pages is - its chips and its ground - and it sticks as theirs do, but only over this card: once the card has gone up the screen, the bar goes with it. */}
      <div className="search-sticky sticky top-16 z-20 border border-border/60 rounded-2xl px-3 py-2 mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="What a press on the map selects">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">A press selects</span>
        {PICKS.map(([id, label, says]) => (
          <button key={id} type="button" aria-pressed={pick === id} onClick={() => setPick(id)} className={chip(pick === id)} title={says} aria-label={`${label}: ${says}`}>
            {label}
          </button>
        ))}
        {/* What a press does now, and the name of the place pointed at: on the bar, as asked, a little larger than it was under the map. One line, so that the bar - and the map under it - keeps its place as the words change; the whole of it is in its title. A row of its own on a narrow screen. */}
        <p
          className="order-last basis-full lg:order-none lg:basis-0 lg:flex-1 min-w-0 truncate text-[13px] font-sans h-5 leading-5 px-1"
          style={{ color: hover ? t.headText : t.bodyText }}
          title={hover ?? what}
          aria-live="polite"
        >
          {hover ? (
            <span className="flex items-center gap-1.5 font-semibold h-5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: (litDot ?? litShape)?.hot ?? "transparent" }} aria-hidden />
              <span className="truncate">{hover}</span>
            </span>
          ) : (
            hint
          )}
        </p>
        {/* A search of every place the site holds, as asked: a result opens its window. */}
        <PlaceSearch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_14rem] xl:grid-cols-[14rem_minmax(0,1fr)_14rem] gap-3">
        {/* The map in the middle, the place picked on its left and the list on its right, as the Worldview page sets its column beside its map. */}
        <div className="min-w-0 relative order-1 xl:order-2">
          <svg
            ref={svgRef}
            viewBox={`${view.x - W / (2 * view.k)} ${view.y - H / (2 * view.k)} ${W / view.k} ${H / view.k}`}
            className="w-full h-auto rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
            // The ground under the map is plain, as asked: black in the dark theme, white in the light.
            style={{ background: t.isLight ? "#ffffff" : "#000000", border: `1px solid ${t.isLight ? t.gridLine : "rgba(255,255,255,0.12)"}`, cursor: view.k > 1 ? "grab" : undefined, touchAction: view.k > 1 ? "none" : "pan-y" }}
            role="group"
            tabIndex={0}
            aria-label={`A map to press. ${what} The wheel or a pinch draws it closer and further, and a drag moves it; with the map in focus, plus and minus do the same, the arrow keys move it and 0 puts it back.`}
            onKeyDown={(e) => {
              // The number pad's keys carry the same characters, so they are answered too.
              const step = 60 / view.k;
              if (e.key === "+" || e.key === "=") glideBy(1.6);
              else if (e.key === "-" || e.key === "_") glideBy(1 / 1.6);
              else if (e.key === "0") glideHome();
              else if (e.key === "ArrowLeft") panBy(-step, 0);
              else if (e.key === "ArrowRight") panBy(step, 0);
              else if (e.key === "ArrowUp") panBy(0, -step);
              else if (e.key === "ArrowDown") panBy(0, step);
              else return;
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.currentTarget.focus({ preventScroll: true });
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              // A second finger down begins a pinch; whatever follows it is not a press.
              if (pointers.current.size === 2) {
                pinch.current = between();
                drag.current = { x: e.clientX, y: e.clientY, moved: true };
              } else drag.current = { x: e.clientX, y: e.clientY, moved: false };
            }}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              tipAt.current = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
              if (tipRef.current) tipRef.current.style.transform = tipPlace();
            }}
            onPointerUp={(e) => {
              pointers.current.delete(e.pointerId);
              pinch.current = null;
              // The finger left down goes on from where it is, so the map does not jump to it.
              const rest = [...pointers.current.values()][0];
              if (rest) drag.current = { x: rest.x, y: rest.y, moved: true };
            }}
            onPointerCancel={(e) => {
              pointers.current.delete(e.pointerId);
              pinch.current = null;
              drag.current = null;
            }}
            onPointerMove={(e) => {
              if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              // Two fingers: closer or further by how far apart they have moved, with the point between them kept under them.
              if (pinch.current && pointers.current.size === 2) {
                const was = pinch.current;
                const now = between();
                if (was.dist > 0 && now.dist > 0) {
                  const r = e.currentTarget.getBoundingClientRect();
                  setView((v) => {
                    const k = Math.max(1, Math.min(MAX_K, v.k * (now.dist / was.dist)));
                    const px = v.x - W / (2 * v.k) + ((was.cx - r.left) / r.width) * (W / v.k);
                    const py = v.y - H / (2 * v.k) + ((was.cy - r.top) / r.height) * (H / v.k);
                    return held(k, px - ((now.cx - r.left) / r.width - 0.5) * (W / k), py - ((now.cy - r.top) / r.height - 0.5) * (H / k));
                  });
                }
                pinch.current = now;
                return;
              }
              const d = drag.current;
              if (!d || view.k <= 1 || e.buttons === 0) return;
              const dx = e.clientX - d.x;
              const dy = e.clientY - d.y;
              if (!d.moved && Math.hypot(dx, dy) < 4) return;
              const r = e.currentTarget.getBoundingClientRect();
              panBy((-dx * (W / view.k)) / r.width, (-dy * (H / view.k)) / r.height);
              drag.current = { x: e.clientX, y: e.clientY, moved: true };
            }}
            onPointerLeave={(e) => {
              pointers.current.delete(e.pointerId);
              pinch.current = null;
              drag.current = null;
            }}
            onClickCapture={(e) => {
              if (drag.current?.moved) e.stopPropagation();
              drag.current = null;
            }}
          >
            {shapes.map((s) => (
              <path
                key={s.key}
                d={s.d}
                // Translucent inside a bright edge of the same colour, and fuller when it is pointed at: as the World Maps page draws a place.
                className="cursor-pointer outline-none [fill-opacity:0.36] hover:[fill-opacity:0.6] transition-[fill-opacity]"
                // Where the cities are what is pressed, a country still opens the map on itself; a division under the dots does nothing.
                style={{ pointerEvents: onCities && level.kind !== "world" ? "none" : undefined }}
                fill={inkOf(s.ref)}
                stroke={inkOf(s.ref)}
                // Finer where the shapes are counties or districts: there are thousands of them.
                strokeWidth={onSecond ? 0.45 : 0.9}
                strokeOpacity={onSecond ? 0.75 : 1}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                onClick={s.go}
                onMouseEnter={() => setHover(s.name)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{s.name}</title>
              </path>
            ))}
            {/* The world's smaller places, once it is drawn close enough for them: over their countries and in their countries' colour, a little dimmer at the edge, each pressed for itself. */}
            {finerShapes.map((s) => (
              <path
                key={s.key}
                d={s.d}
                className="cursor-pointer outline-none [fill-opacity:0] hover:[fill-opacity:0.3] transition-[fill-opacity]"
                fill={inkOf(s.ref)}
                stroke={inkOf(s.ref)}
                strokeOpacity={order === 2 ? 0.6 : 0.8}
                strokeWidth={order === 2 ? 0.45 : 0.7}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                onClick={s.go}
                onMouseEnter={() => setHover(s.name)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{s.name}</title>
              </path>
            ))}
            {/* The lines over the shapes, never pressed: the counties', fine, on the map of the states; the first-order divisions', heavier, on a map of counties or districts - in the country's own colour. */}
            {lines && (
              <path d={lines} fill="none" stroke={bold ? countryInk(code) : inner} strokeOpacity={bold ? 1 : 0.3} strokeWidth={bold ? 1.4 : 0.45} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />
            )}
            {/* The world, drawn closer: the borders of its states and provinces, and closer still those of its counties and districts - fainter than the countries' own, clearer the closer the map is, and never pressed. */}
            {/* Natural Earth's states' borders: for every country until the map is close enough for the districts, and after that only for the countries with no districts held. */}
            {onWorld && stateLinesD && view.k >= STATES_FROM && order !== 1 && (
              <path d={view.k >= COUNTIES_FROM && stateLinesRestD ? stateLinesRestD : stateLinesD} fill="none" stroke={inner} strokeOpacity={Math.min(0.5, 0.16 + 0.04 * view.k)} strokeWidth={0.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />
            )}
            {/* The states' borders from the districts' own tracing, once the districts are drawn: from the very shapes where the counties are the shapes, and from the file of lines otherwise. */}
            {onWorld && view.k >= COUNTIES_FROM && order !== 1 && (order === 2 ? exactFirstsD : countySets.first) && (
              <path d={order === 2 ? exactFirstsD : countySets.first} fill="none" stroke={inner} strokeOpacity={Math.min(0.7, 0.3 + 0.03 * view.k)} strokeWidth={0.9} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />
            )}
            {onWorld && countyLinesD && view.k >= COUNTIES_FROM && order !== 2 && (
              <path d={countyLinesD} fill="none" stroke={inner} strokeOpacity={Math.min(0.4, 0.1 + 0.02 * view.k)} strokeWidth={0.35} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />
            )}
            {/* The place pointed at, picked out as the World Maps page and the windows' maps pick one out: filled in its colour over the land, a casing so that its edge reads on any ground, and an outline in the colour itself. */}
            {litShape && (
              <g pointerEvents="none">
                <path d={litShape.d} fill={inkOf(litShape.ref)} fillOpacity={0.62} stroke={halo} strokeOpacity={0.55} strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path d={litShape.d} fill="none" stroke={inkOf(litShape.ref)} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </g>
            )}
            {/* The cities and towns. Each is the same size on the screen however close the map is drawn, so that they part
                as it closes in; a little see-through, so that one under another still shows; and drawn the largest first,
                with a wider ground round each to be pressed by, so that a small one beside a large one can still be chosen. */}
            {dotsDrawn.map((d) => (
              <g key={d.key} className="cursor-pointer" onClick={d.go} onMouseEnter={() => setHover(d.name)} onMouseLeave={() => setHover(null)}>
                <circle cx={d.x} cy={d.y} r={Math.max(d.r + 2, 7) / view.k} fill="transparent" />
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={d.r / view.k}
                  // Pale on the dark card and dark on the light one, with an edge of the other tone, so that it shows on any colour of land.
                  fill={t.isLight ? "#0f172a" : "#ffffff"}
                  fillOpacity={0.78}
                  stroke={halo}
                  strokeOpacity={0.85}
                  strokeWidth={0.9}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
                <title>{d.name}</title>
              </g>
            ))}
            {/* The one pointed at: filled in its country's colour, with a ring round it, cased the same way - as the windows' maps ring a dot. */}
            {litDot && (
              <g pointerEvents="none">
                {/* The dot itself solid, and the ring in the dot's own tone - pale on the dark card, dark on the light - inside a casing of the other, so that it stands off land of any colour, its own country's included. */}
                <circle cx={litDot.x} cy={litDot.y} r={(litDot.r + 1.5) / view.k} fill={inner} stroke={halo} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
                <circle cx={litDot.x} cy={litDot.y} r={(litDot.r + 7) / view.k} fill="none" stroke={halo} strokeOpacity={0.7} strokeWidth={4.2} vectorEffect="non-scaling-stroke" />
                <circle cx={litDot.x} cy={litDot.y} r={(litDot.r + 7) / view.k} fill="none" stroke={inner} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              </g>
            )}
            {(loading || none) && (
              <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={15} fill={t.mutedText} fontFamily="sans-serif">
                {loading ? "Loading the boundaries…" : `No divisions are drawn for ${country?.name ?? "this country"}.`}
              </text>
            )}
          </svg>
          {/* Closer and further, at the map's own corner where they are seen with it: the same as the wheel, a pinch and the + and - keys, and they glide. */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <button type="button" onClick={() => glideBy(1 / 1.6)} disabled={view.k <= 1} aria-label="Draw the map further out" title="Further out ( - )" className={tool}>
              <MagnifyingGlassMinus size={15} aria-hidden />
            </button>
            <button type="button" onClick={() => glideBy(1.6)} disabled={view.k >= MAX_K} aria-label="Draw the map closer" title="Closer ( + )" className={tool}>
              <MagnifyingGlassPlus size={15} aria-hidden />
            </button>
            <button type="button" onClick={glideHome} disabled={view.k === 1} className="px-3 h-8 rounded-full text-[10px] font-mono uppercase tracking-wider border border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted transition-colors cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-default" title="The whole map ( 0 )" aria-live="polite">
              {view.k === 1 ? "1.0×" : `Reset · ${view.k.toFixed(1)}×`}
            </button>
          </div>
          {/* The place pointed at, named beside the pointer as the windows' maps name theirs: its name, what it is, and that a press opens it. */}
          {hover && (litShape || litDot) && (
            <div ref={tipRef} role="status" className="absolute left-0 top-0 z-10 pointer-events-none modal-glass border rounded-lg px-2.5 py-1.5 shadow-lg max-w-[16rem]" style={{ transform: tipPlace() }}>
              <p className="text-[12px] font-bold font-sans text-foreground leading-tight">{hover}</p>
              <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">{about && item?.name === hover ? `${about.kicker} · press it to open` : "Press it to open"}</p>
            </div>
          )}

          {/* What the colours are: the scale the World Maps page has under its own map, and where it is explained. */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2">
            <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
              Lower
            </span>
            <span className="flex rounded-full overflow-hidden" aria-hidden>
              {ramp.map((c) => (
                <span key={c} className="w-6 h-2" style={{ background: c }} />
              ))}
            </span>
            <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
              Higher
            </span>
            <span className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
              · living conditions, a score worked out here from the figures the site holds and published by no body: World Maps sets out how. Grey where too few figures are held.
            </span>
          </div>
          {/* Whose the boundaries on the map are, where they are a country's second order: each country's are its own publisher's, under its own licence. */}
          {abroad && fine && second && secondInfo && (
            <p className="text-[10px] font-mono leading-snug mt-2" style={{ color: t.mutedText }}>
              Boundaries: {secondInfo.by} · {secondInfo.year} · {secondInfo.licence} · gathered by geoBoundaries
            </p>
          )}
        </div>

        {/* The same places by name: for one too small to press, and for a keyboard. */}
        {/* Beside the map, on its right, as tall as it is and scrolled within; under it on a phone. */}
        <div className="min-w-0 order-2 xl:order-3 lg:relative">
         <div className="flex flex-col lg:absolute lg:inset-0">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
            {listLabel}
          </p>
          <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 mb-1.5 transition-colors focus-within:border-foreground/40">
            <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
            <input type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find one by name" aria-label="Find a place in the list by name" className="flex-1 min-w-0 bg-transparent text-[11px] font-medium font-sans text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </label>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 content-start overflow-y-auto rounded-xl max-h-44 lg:max-h-none lg:flex-1 lg:min-h-0" style={{ border: `1px solid ${t.gridLine}` }}>
            {shownList.map((x) => (
              <li key={x.key} style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <button type="button" onClick={x.go} onFocus={() => setHover(x.name)} onBlur={() => setHover(null)} onMouseEnter={() => setHover(x.name)} onMouseLeave={() => setHover(null)} className="w-full text-left text-[11px] font-sans px-3 py-1.5 truncate hover:opacity-70 cursor-pointer" style={{ color: t.bodyText }}>
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

          {/* The place last pointed at, on the map or in the list, set out: on the map's left on a wide screen, as asked, and under the map and the list on a smaller one. */}
        <div className="rounded-xl p-4 order-3 lg:col-span-2 xl:col-span-1 xl:order-1 self-start" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }} aria-live="polite">
          {item && about ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {about.flag && (
                  <span className="w-11 h-7 rounded-[4px] overflow-hidden shrink-0" style={{ border: `1px solid ${t.gridLine}` }} title={about.pale ? "It has no flag of its own held: its country's is shown, paler" : undefined}>
                    <img src={about.flag} alt="" className={`w-full h-full object-cover ${about.pale ? "opacity-45" : ""}`} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest truncate" style={{ color: t.mutedText }}>
                    {about.kicker}
                  </p>
                  <p className="text-base font-bold font-sans leading-tight truncate" style={{ color: t.headText }}>
                    {item.name}
                  </p>
                </div>
                <Go color={COLOR} onClick={item.go}>
                  Open
                </Go>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {about.facts
                  .filter(([, value], i) => value !== null || i < 4)
                  .map(([label, value, sub]) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                        {label}
                      </p>
                      <p className={`text-[13px] font-mono truncate ${value === null ? "" : "font-bold"}`} style={{ color: value === null ? t.mutedText : t.headText }} title={value ?? undefined}>
                        {value ?? "Not held"}
                      </p>
                      {value !== null && sub && (
                        <p className="text-[9px] font-sans leading-snug truncate" style={{ color: t.mutedText }} title={sub}>
                          {sub}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <p className="text-[12px] font-sans" style={{ color: t.mutedText }}>
              Select or hover over any area - on the map or in the list - and what the site holds of it is set out here.
            </p>
          )}
        </div>
      </div>

      {/* How the map is drawn, folded away: the place under the map is the selected area's now. */}
      <details className="mt-3">
        <summary className="text-[10px] font-mono uppercase tracking-widest cursor-pointer select-none" style={{ color: t.mutedText }}>
          How this map is drawn
        </summary>
      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        The map is drawn closer with the wheel or a trackpad, two fingers pinched on a touch screen, the buttons at its corner and the + and - keys; it is moved by dragging or the
        arrow keys once it is closer, and put back with 0. What a press selects follows how close it is drawn - the whole country, then a state or division, a county, and a city, town
        or village - and can be chosen by hand above the map. It is drawn as the World Maps page draws its own: each country in the colour of its living conditions - a score worked
        out here from the figures the site holds, shown as the sixth of the scored countries it falls in, red the lowest and teal the highest - and grey where too few figures are
        held; that page sets out how the score is worked out. A country's states, counties and districts are in its colour, since no figures are held for them; on the United States'
        own map each state is in the colour of its own score among the states. The cities are those the United Nations counts, as dots sized by their people; closer in, the towns and
        villages GeoNames lists take their place - the largest of those in view. A place pointed at is filled in its colour with a casing and an outline, and a dot with a ring. On "State" a country opens on the divisions Natural Earth draws for it - states, provinces, regions or
        departments, whichever its first order is there. On "County" it opens on its second order - counties, districts, municipalities, whatever its publisher calls them: the
        Census Bureau's counties for the United States, and for other countries the boundaries geoBoundaries gathers from each country's own publisher, kept only under a licence
        the site can use and named under the map. Which first-order division a district lies in is worked out here, from where most of its outline falls. A country with no
        second-order boundaries held shows its first order instead, and says so. A division, a county or a district goes to its record on the Municipalities page; the country
        the map is on can be opened from above it. The world here is drawn at 1:110 million and has no shape for some small countries: they are in the list, as are a country's
        far-off divisions - France's overseas departments, Spain's Canaries - which the map leaves out of its frame so that the rest can be seen.
      </p>
      </details>


      <SourceLink
        sources={[
          { label: "Natural Earth — countries and admin-1 divisions (public domain)", url: "https://www.naturalearthdata.com/" },
          { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" },
          ADMIN2_SOURCE,

          { label: "United Nations — World Urbanization Prospects: The 2025 Revision (the cities)", url: "https://population.un.org/wup/" },
        ]}
        className="mt-1"
      />
    </Card>
  );
}
