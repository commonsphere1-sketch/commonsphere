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
import type { PlaceRow, PlacesFile } from "../data/placesIndex";

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

/** A group of outlines that lie together: a country's main body, or one of its far-off parts - Alaska, Hawaii, the Azores. */
export type OutlinePart<T extends Outline = Outline> = { features: T[]; label: string };

/** How wide a stretch of open sea, in degrees, parts one group of outlines from another: wider than the Corsica or Bass straits, narrower than the sea between Alaska and Washington. */
const PART_GAP = 2;

/**
 * The outlines of a map in the groups that lie together, as asked: the largest by area first - the map opens on it -
 * then the far-off ones, largest first, each a swipe away. Two outlines are of one group where the boxes round them
 * come within PART_GAP degrees of each other, or of another outline of the group. A map whose outlines all lie
 * together is one group.
 */
export function outlineParts<T extends Outline>(features: T[]): OutlinePart<T>[] {
  if (features.length < 2) return [{ features, label: features[0]?.properties.n ?? "" }];
  const box = features.map((f) => {
    const [[w, s], [e, n]] = geoBounds(f as never);
    return { w, e: e < w ? e + 360 : e, s, n };
  });
  const gap = (a: (typeof box)[number], b: (typeof box)[number]) => {
    const lat = Math.max(0, Math.max(a.s, b.s) - Math.min(a.n, b.n));
    // Across 180°, a box can be met from either side.
    const lon = Math.min(...[-360, 0, 360].map((k) => Math.max(0, Math.max(a.w, b.w + k) - Math.min(a.e, b.e + k))));
    const mid = Math.min(70, Math.abs((Math.max(a.s, b.s) + Math.min(a.n, b.n)) / 2));
    return Math.hypot(lon * Math.cos((mid * Math.PI) / 180), lat);
  };
  const root = features.map((_, i) => i);
  const find = (i: number): number => (root[i] === i ? i : (root[i] = find(root[i])));
  for (let i = 0; i < features.length; i++) for (let j = i + 1; j < features.length; j++) if (find(i) !== find(j) && gap(box[i], box[j]) < PART_GAP) root[find(i)] = find(j);
  const groups = new Map<number, number[]>();
  features.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]));
  const area = (ix: number[]) => ix.reduce((s, i) => s + geoArea(features[i] as never), 0);
  const sorted = [...groups.values()].sort((a, b) => area(b) - area(a));
  return sorted.map((ix, n) => {
    const names = ix.map((i) => features[i].properties.n ?? features[i].properties.name).filter((x): x is string => !!x);
    const named = names.length && names.length <= 3 ? names.join(" · ") : `${ix.length} divisions`;
    return { features: ix.map((i) => features[i]), label: n === 0 && sorted.length > 1 ? `Main part · ${named}` : named };
  });
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

/* ── Which outline is a division's ─────────────────────────────────────────
   The outlines are Natural Earth's and carry its names; the divisions are the site's and carry theirs. Most agree to
   the letter. Where they do not, a division is matched by any of its own names with accents, marks and case taken
   away ("Sant Julià de Lòria" and "Sant Julia de Loria"), and then by the table below. */

/** A name as compared: without accents, marks or case. */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * A division whose outline is drawn under another name altogether: by country, the division's name on the site and
 * the outline's in Natural Earth. Each is the same place in another language or spelling - Malta's localities in
 * Maltese and in English, Somalia's regions in Somali and in English, French Polynesia's island groups in English and
 * in French - and each was checked on 13 October 2026 against where the division lies: but for the three marked, the
 * division's own coordinates fall inside that outline and no other unmatched division's do. Nothing is paired on
 * position alone: a division that merely lies inside a larger outline (a parish of Anguilla inside "Anguilla") has no
 * outline of its own, and is told so.
 */
const OUTLINE_ALIASES: Record<string, Record<string, string>> = {
  BH: { "Al Manāmah": "Capital Governorate" },
  GD: { "Carriacou and Petite Martinique": "Southern Grenadine Islands" },
  KN: { "Saint John Capesterre": "Saint John Capisterre", "Saint Paul Capesterre": "Saint Paul Capisterre" },
  LC: { "Anse-la-Raye": "Anse la Raya" },
  MF: { "St. Martin": "Saint-Martin" },
  MT: {
    "Fontana, Gozo": "Fontana",
    Għajnsielem: "Ghajnsielem",
    Għarb: "Gharb",
    Għasri: "Ghasri",
    "San Giljan": "Saint Julian's",
    "San Ġwann": "Saint John",
    "San Lawrenz": "Saint Lawerence",
    "San Pawl il-Bahar": "Saint Paul's Bay",
    Victoria: "Rabat Gozo",
  },
  MU: { "Rivière Noire": "Black River" },
  // The last three by their names alone, which are each other's translation: their coordinates fall in the sea between their islands.
  PF: { "Marquesas Islands": "Îles Marquises", "Windward Islands": "Îles du Vent", "Leeward Islands": "Îles Sous-le-Vent", "Austral Islands": "Îles Australes", "Tuamotu-Gambier": "Îles Tuamotu-Gambier" },
  SC: { "English River": "La Rivière Anglaise" },
  SO: { Banaadir: "Banadir", Galguduud: "Galgaduud", "Shabeellaha Dhexe": "Middle Shebelle", "Shabeellaha Hoose": "Lower Shebelle" },
  ST: { Príncipe: "Príncipe Province", "São Tomé": "São Tomé Province" },
  VA: { Vatican: "Vatican City" },
  WS: { "Fa'asaleleaga": "Fa'asaleleage" },
};

/** What a division is known by: its name on the site, and the other names its record holds. */
export type Named = { name: string; article?: string; official?: string; native?: string };

/**
 * The outlines that are a division's, among its country's: by its name; else by the table of other names; else by any
 * of its names without accents and marks - but never an outline that is another division's by name.
 */
export function outlinesOf(drawn: Outline[], cc: string, s: Named, all: Named[] = []): Outline[] {
  const exact = drawn.filter((f) => f.properties.n === s.name);
  if (exact.length) return exact;
  const alias = OUTLINE_ALIASES[cc]?.[s.name];
  if (alias) return drawn.filter((f) => f.properties.n === alias);
  const others = new Set(all.filter((d) => d !== s).map((d) => d.name));
  const names = new Set([s.name, s.article, s.official, s.native].filter((x): x is string => Boolean(x)).map(fold));
  return drawn.filter((f) => f.properties.n && !others.has(f.properties.n) && names.has(fold(f.properties.n)));
}
/** The outlines of a country that are no division's: each drawn on the maps, with no record on the site behind it. */
export function spareOutlines(drawn: Outline[], cc: string, all: Named[]): Outline[] {
  const taken = new Set(all.flatMap((s) => outlinesOf(drawn, cc, s, all)));
  return drawn.filter((f) => f.properties.n && !taken.has(f));
}

const PLACES = new Map<string, Promise<PlacesFile | null>>();
const placesFile = (cc: string) => {
  if (!PLACES.has(cc))
    PLACES.set(
      cc,
      fetch(`/places/${cc}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<PlacesFile>) : null))
        .catch(() => null),
    );
  return PLACES.get(cc)!;
};

/** A country's listed places, largest first, for a map's dots: undefined while they are fetched, null where there is no list. Nothing is fetched for a null country. */
export function usePlacesFile(cc: string | null): PlacesFile | null | undefined {
  const [got, setGot] = useState<{ cc: string; file: PlacesFile | null } | null>(null);
  useEffect(() => {
    if (!cc) return;
    let off = false;
    placesFile(cc).then((file) => !off && setGot({ cc, file }));
    return () => {
      off = true;
    };
  }, [cc]);
  if (!cc) return null;
  return got && got.cc === cc ? got.file : undefined;
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
