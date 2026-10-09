/**
 * The outlines the windows of the Municipalities page draw: a country's
 * first-order divisions (static/geo/admin1, Natural Earth), a US county's
 * (the Census Bureau's, by us-atlas), and which of a country's listed places
 * lie inside one. A country's second order is in lib/admin2.
 *
 * Each is fetched when a window first asks for it and kept for the next.
 */
import { useEffect, useState } from "react";
import { geoArea, geoBounds, geoCentroid, geoContains, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { PlaceRow } from "../data/placesIndex";

export type Outline = { type: string; id?: string | number; properties: Record<string, string | undefined>; geometry: { type: string; coordinates: unknown[] } };

/* As the maps do it: a ring wound backwards is "everything but this island" to d3, so anything over a hemisphere is reversed. */
export function rewind<T extends { geometry: { type: string; coordinates: unknown[] } }>(f: T): T {
  const fix = (rings: number[][][]) => {
    if (geoArea({ type: "Polygon", coordinates: rings } as never) > 2 * Math.PI) for (const ring of rings) ring.reverse();
  };
  if (f.geometry.type === "Polygon") fix(f.geometry.coordinates as number[][][]);
  else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates as number[][][][]) fix(p);
  return f;
}

const middle = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
/**
 * The outlines a map of several is framed on, as the Dashboard's map frames a country: a few far-off ones - France's
 * overseas departments, Spain's Canaries - would shrink the rest to a speck, so where no more than one in seven lies
 * over twenty degrees from the middle of them all, the frame is the rest.
 */
export function framed<T extends Outline>(features: T[]): T[] {
  if (features.length < 4) return features;
  const at = features.map((f) => geoCentroid(f as never));
  const mid: [number, number] = [middle(at.map((c) => c[0])), middle(at.map((c) => c[1]))];
  const near = features.filter((_, i) => geoDistance(at[i], mid) < (20 * Math.PI) / 180);
  return near.length < features.length && features.length - near.length <= features.length / 7 ? near : features;
}

/** The places of a list whose point lies inside an outline, in the list's own order. */
export function placesWithin(shape: Outline, places: PlaceRow[]): PlaceRow[] {
  const [[w, s], [e, n]] = geoBounds(shape as never);
  // The box first: most of a country's places are nowhere near.
  const near = (lon: number, lat: number) => lat >= s && lat <= n && (w <= e ? lon >= w && lon <= e : lon >= w || lon <= e);
  return places.filter((p) => near(p[2], p[1]) && geoContains(shape as never, [p[2], p[1]]));
}

/** The area of an outline in km², on a sphere of the Earth's mean radius. Used only to tell whether a record is of the same place - never shown as the place's area. */
export const outlineKm2 = (shape: Outline) => geoArea(shape as never) * 6371.0088 ** 2;

const ADMIN1 = new Map<string, Promise<Outline[] | null>>();
const admin1 = (cc: string) => {
  if (!ADMIN1.has(cc))
    ADMIN1.set(
      cc,
      fetch(`/geo/admin1/${cc}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<Topology>) : Promise.reject(new Error(String(r.status)))))
        .then((topo) => (feature(topo, topo.objects[Object.keys(topo.objects)[0]]) as unknown as { features: Outline[] }).features.map(rewind))
        .catch(() => null),
    );
  return ADMIN1.get(cc)!;
};

/** A country's first-order divisions, each named in `properties.n`: undefined while they are fetched, null where none are drawn. */
export function useAdmin1(cc: string | null): Outline[] | null | undefined {
  const [got, setGot] = useState<{ cc: string; list: Outline[] | null } | null>(null);
  useEffect(() => {
    if (!cc) return;
    let off = false;
    admin1(cc).then((list) => !off && setGot({ cc, list }));
    return () => {
      off = true;
    };
  }, [cc]);
  if (!cc) return null;
  return got && got.cc === cc ? got.list : undefined;
}

let COUNTIES: Promise<Map<string, Outline>> | null = null;
const counties = () =>
  (COUNTIES ??= import("us-atlas/counties-10m.json").then((m) => {
    const topo = (m.default ?? m) as unknown as Topology;
    return new Map((feature(topo, topo.objects.counties) as unknown as { features: Outline[] }).features.map((f) => [String(f.id), rewind(f)]));
  }));

/** A US county's outline, by its FIPS code: undefined while the counties are loaded, null where there is none by that code. */
export function useCountyOutline(fips: string | null): Outline | null | undefined {
  const [got, setGot] = useState<{ fips: string; shape: Outline | null } | null>(null);
  useEffect(() => {
    if (!fips) return;
    let off = false;
    counties()
      .then((all) => !off && setGot({ fips, shape: all.get(fips) ?? null }))
      .catch(() => !off && setGot({ fips, shape: null }));
    return () => {
      off = true;
    };
  }, [fips]);
  if (!fips) return null;
  return got && got.fips === fips ? got.shape : undefined;
}
