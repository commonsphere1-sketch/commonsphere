/**
 * The places inside a country, for a map that is drawn closer: its
 * first-order divisions, its second-order ones, and its towns. A map of the
 * world asks for them a country at a time - only for the countries that are
 * in view - so that pointing at the map picks out a state where it picked
 * out a country, and a county where it picked out a state, the closer it is
 * drawn.
 *
 * Nothing is held here: each is the file the rest of the site draws from,
 * fetched once and kept.
 *   first order   static/geo/admin1/<country>.json  (Natural Earth, with the
 *                 finer tracings build-admin1.cjs notes)
 *   second order  static/geo/admin2/<country>.json  (geoBoundaries, see
 *                 lib/admin2.ts); the United States' counties from us-atlas
 *   towns         static/places/<country>.json      (GeoNames)
 * A country with no file for an order has none: nothing stands in for it.
 */
import { useEffect, useState } from "react";
import { geoArea } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { PlacesFile } from "../data/placesIndex";
import { loadAdmin2 } from "./admin2";

export type FinerGeo = { type: string; id?: string | number; properties: Record<string, string | undefined>; geometry: { type: string; coordinates: unknown[] } };
/** One of a country's divisions, of the first order or the second. */
export type Finer = {
  code: string;
  order: 1 | 2;
  name: string;
  /** The first-order division a second-order one lies in. */
  parent?: string;
  /** Its place in the country's file: what a district's window is opened by. */
  index: number;
  /** A county of the United States: its FIPS code, which its window is opened by. */
  fips?: string;
  geo: FinerGeo;
};

/* As the maps do it: a ring wound backwards is "everything but this island" to d3, so anything over a hemisphere is reversed. */
function rewind(f: FinerGeo): FinerGeo {
  const fix = (rings: number[][][]) => {
    if (geoArea({ type: "Polygon", coordinates: rings } as never) > 2 * Math.PI) for (const ring of rings) ring.reverse();
  };
  if (f.geometry.type === "Polygon") fix(f.geometry.coordinates as number[][][]);
  else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates as number[][][][]) fix(p);
  return f;
}

/* A country's first-order borders, cut from its second order: the lines between two districts of different divisions.
   Kept when the districts are fetched, for a map that draws them to draw the states' borders from the same tracing. */
const FIRSTS = new Map<string, unknown>();
/** A country's first-order borders from its districts' own tracing, once its districts are in: undefined until then, or where it has none. */
export const firstBorders = (code: string): unknown | undefined => FIRSTS.get(code);

const FILES = new Map<string, Promise<Finer[]>>();
/** A country's divisions of one order: an empty list where none are held. */
export function loadFiner(code: string, order: 1 | 2): Promise<Finer[]> {
  const key = `${order}:${code}`;
  if (!FILES.has(key)) {
    const got: Promise<Finer[]> =
      order === 1
        ? fetch(`/geo/admin1/${code}.json`)
            .then((r) => (r.ok && /json/.test(r.headers.get("content-type") ?? "") ? (r.json() as Promise<Topology>) : Promise.reject(new Error(String(r.status)))))
            .then((topo) =>
              (feature(topo, topo.objects[Object.keys(topo.objects)[0]]) as unknown as { features: FinerGeo[] }).features.flatMap((f, index): Finer[] =>
                f.properties.n ? [{ code, order, name: f.properties.n, index, geo: rewind(f) }] : [],
              ),
            )
        : code === "US"
          ? import("us-atlas/counties-10m.json").then((m) => {
              const topo = (m.default ?? m) as unknown as Topology;
              const states = new Map((feature(topo, topo.objects.states) as unknown as { features: FinerGeo[] }).features.map((s) => [String(s.id), s.properties.name]));
              const stateOf = (g: unknown) => String((g as { id?: string | number }).id).padStart(5, "0").slice(0, 2);
              FIRSTS.set(code, mesh(topo, topo.objects.counties as never, (a, b) => a !== b && stateOf(a) !== stateOf(b)));
              return (feature(topo, topo.objects.counties) as unknown as { features: FinerGeo[] }).features.map((f, index): Finer => {
                const fips = String(f.id).padStart(5, "0");
                return { code, order, name: f.properties.name ?? "", parent: states.get(fips.slice(0, 2)), index, fips, geo: rewind(f) };
              });
            })
          : loadAdmin2(code).then((file) => {
              if (!file) return [];
              const parent = (g: unknown) => (g as { properties?: { p?: string } }).properties?.p ?? g;
              FIRSTS.set(code, mesh(file.topo, file.topo.objects.a as never, (a, b) => a !== b && parent(a) !== parent(b)));
              return file.shapes.map((s, index): Finer => ({ code, order, name: s.properties.n, parent: s.properties.p, index, geo: s as unknown as FinerGeo }));
            });
    FILES.set(
      key,
      got.catch(() => []),
    );
  }
  return FILES.get(key)!;
}

/** The divisions of the countries asked for, of one order, as they come in: a country still being fetched is not yet in the map. Order 0 asks for nothing. */
export function useFiner(codes: string[], order: 0 | 1 | 2): Map<string, Finer[]> {
  const [got, setGot] = useState<{ order: number; by: Map<string, Finer[]> }>({ order: 0, by: new Map() });
  const key = codes.join(",");
  useEffect(() => {
    if (!order || !key) return;
    let off = false;
    for (const code of key.split(",")) {
      loadFiner(code, order).then((list) => {
        if (off) return;
        setGot((was) => {
          if (was.order === order && was.by.has(code)) return was;
          const by = new Map(was.order === order ? was.by : []);
          by.set(code, list);
          return { order, by };
        });
      });
    }
    return () => {
      off = true;
    };
  }, [key, order]);
  return got.order === order ? got.by : EMPTY;
}
const EMPTY = new Map<string, Finer[]>();

const PLACES = new Map<string, Promise<PlacesFile | null>>();
/** A country's towns, cities and villages, as GeoNames lists them: null where the site holds none. */
export function loadPlaces(code: string): Promise<PlacesFile | null> {
  if (!PLACES.has(code))
    PLACES.set(
      code,
      fetch(`/places/${code}.json`)
        .then((r) => (r.ok && /json/.test(r.headers.get("content-type") ?? "") ? (r.json() as Promise<PlacesFile>) : null))
        .catch(() => null),
    );
  return PLACES.get(code)!;
}

/** The towns of the countries asked for, as their files come in. */
export function usePlacesOf(codes: string[]): Map<string, PlacesFile> {
  const [got, setGot] = useState<Map<string, PlacesFile>>(new Map());
  const key = codes.join(",");
  useEffect(() => {
    if (!key) return;
    let off = false;
    for (const code of key.split(",")) {
      loadPlaces(code).then((file) => {
        if (off || !file) return;
        setGot((was) => (was.has(code) ? was : new Map(was).set(code, file)));
      });
    }
    return () => {
      off = true;
    };
  }, [key]);
  return got;
}

/** A place's bounds on a map, in the map's own units. */
export type Bounds = { code: string; x0: number; y0: number; x1: number; y1: number };
/**
 * The countries in the part of a map that is in view, the nearest its middle first, and no more than `most` of them:
 * a map drawn far out has too many in view to fetch every one's divisions, and is not asked to.
 */
export function inView(bounds: Bounds[], view: { x: number; y: number; w: number; h: number }, most: number): string[] {
  const x0 = view.x - view.w / 2;
  const x1 = view.x + view.w / 2;
  const y0 = view.y - view.h / 2;
  const y1 = view.y + view.h / 2;
  const seen = new Map<string, number>();
  for (const b of bounds) {
    if (b.x1 < x0 || b.x0 > x1 || b.y1 < y0 || b.y0 > y1) continue;
    // How far the nearest point of its box is from the middle of the view: a country the middle is in comes first.
    const dx = Math.max(b.x0 - view.x, 0, view.x - b.x1);
    const dy = Math.max(b.y0 - view.y, 0, view.y - b.y1);
    const d = Math.hypot(dx, dy);
    if (!seen.has(b.code) || d < seen.get(b.code)!) seen.set(b.code, d);
  }
  return [...seen]
    .sort((a, b) => a[1] - b[1])
    .slice(0, most)
    .map(([code]) => code);
}
