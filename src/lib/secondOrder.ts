/**
 * The second-order divisions of a place - the counties of a US state, the
 * districts of another country's province - for the map at the head of its
 * window: the borders inside it, each district as a place to point at, and
 * the place's own outline cut from the same tracing.
 *
 * Why the outline comes from here too. The site's first-order outlines are
 * Natural Earth's, and its second-order ones are geoBoundaries' (lib/admin2)
 * - two publishers, each tracing the same border its own way and each
 * simplified for the web, so a district's edge ran beside its province's and
 * not along it: drawn closer, the two plainly did not meet. Where a place's
 * districts are held, its outline is therefore put together from those
 * districts - a province is the union of its districts, a country's
 * provinces each the union of theirs - so that every border on the map is
 * one line from one tracing. The United States' are the Census Bureau's
 * states and counties, which are one tracing already (us-atlas).
 *
 * A country's provinces are put together this way only where every district
 * says which province it lies in, and only where every province the site
 * lists comes out of it (alignedTo): otherwise some ground, or some
 * province, would be left out, and Natural Earth's outlines are kept, with
 * the districts' borders over them as before. A country with no districts
 * held draws none.
 */
import { useEffect, useMemo, useState } from "react";
import { feature, merge, mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import { ADMIN2_SOURCE, useAdmin2, type Admin2File } from "./admin2";
import { rewind, type Outline } from "./outlines";
import { ADMIN2_UNTILED } from "../data/admin2Untiled";

type Source = { label: string; url: string };
const US_SOURCE: Source = { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" };

export type SecondOrder = {
  /** Each second-order division, as a place to point at: its name in properties.n, the division it lies in in properties.p. */
  lines: Outline[];
  /** Where a second-order division's own window is, by its place in `lines`. */
  open: (i: number) => string;
  /** The borders between the second-order divisions of one first-order division, as lines: what is drawn inside outlines put together from them. */
  inner: unknown;
  /** Every border between two second-order divisions, as lines: what is drawn over Natural Earth's outlines, where those are kept. */
  innerAll: unknown;
  /** The place itself from the same tracing - one outline for a division, one for each division of a country - where it can be put together whole. */
  outline?: Outline[];
  /** What they are called in a caption. */
  are: string;
  source: Source;
};

type Named = { id?: string | number; properties?: { n?: string; p?: string; name?: string } };
const asOutline = (geometry: unknown, n: string): Outline => rewind({ type: "Feature", properties: { n }, geometry: geometry as Outline["geometry"] });

/* The counties' file, whole, with each state's name by the two digits its counties' codes begin with: fetched once. */
let COUNTIES: Promise<{ topo: Topology; state: Map<string, string> }> | null = null;
const counties = () =>
  (COUNTIES ??= import("us-atlas/counties-10m.json").then((m) => {
    const topo = (m.default ?? m) as unknown as Topology;
    const states = (topo.objects.states as unknown as { geometries: Named[] }).geometries;
    return { topo, state: new Map(states.map((s) => [String(s.id).padStart(2, "0"), s.properties?.name ?? ""])) };
  }));

/* Worked out once for a place, and kept: a large country's divisions are thousands of outlines to put together. */
const MADE = new Map<string, SecondOrder | null>();

function ofUnitedStates({ topo, state }: { topo: Topology; state: Map<string, string> }, division?: string): SecondOrder | null {
  const stateOf = (g: Named) => state.get(String(g.id).padStart(5, "0").slice(0, 2)) ?? "";
  const all = (topo.objects.counties as unknown as { geometries: Named[] }).geometries;
  const kept = division ? all.filter((g) => stateOf(g) === division) : all;
  if (!kept.length) return null;
  const collection = { type: "GeometryCollection", geometries: kept };
  const lines = (feature(topo, collection as never) as unknown as { features: Outline[] }).features.map((f, i) => rewind({ ...f, properties: { n: f.properties.name ?? "", p: stateOf(kept[i]) } }));
  const names = division ? [division] : [...new Set(kept.map(stateOf))].filter(Boolean);
  return {
    lines,
    open: (i) => `/dashboard/subnations?open=county:${String(kept[i].id).padStart(5, "0")}`,
    inner: mesh(topo, collection as never, (a, b) => a !== b && stateOf(a as Named) === stateOf(b as Named)),
    innerAll: mesh(topo, collection as never, (a, b) => a !== b),
    outline: names.map((n) => asOutline(merge(topo, kept.filter((g) => stateOf(g) === n) as never), n)),
    are: "counties",
    source: US_SOURCE,
  };
}

function ofCountry(cc: string, second: Admin2File, division?: string): SecondOrder | null {
  const all = (second.topo.objects.a as unknown as { geometries: Named[] }).geometries;
  const at = all.map((g, i) => ({ g, i })).filter(({ g }) => !division || g.properties?.p === division);
  if (!at.length) return null;
  const kept = at.map((x) => x.g);
  const collection = { type: "GeometryCollection", geometries: kept };
  const parent = (g: Named) => g.properties?.p;
  /* A file whose districts do not share their edges (admin2Untiled) gives its borders in scraps: every edge of its districts is
     drawn instead, and its divisions are not put together from them - Natural Earth's outlines stand. */
  const loose = cc in ADMIN2_UNTILED;
  // A country's divisions are put together only where every district says which it lies in: otherwise ground would be left out.
  const whole = !loose && (Boolean(division) || kept.every((g) => parent(g)));
  const names = division ? [division] : [...new Set(kept.map((g) => parent(g) ?? ""))].filter(Boolean);
  return {
    lines: at.map(({ i }) => second.shapes[i] as unknown as Outline),
    open: (i) => `/dashboard/subnations?open=district:${cc}:${at[i].i}`,
    inner: loose ? mesh(second.topo, collection as never) : mesh(second.topo, collection as never, (a, b) => a !== b && parent(a as Named) === parent(b as Named)),
    innerAll: loose ? mesh(second.topo, collection as never) : mesh(second.topo, collection as never, (a, b) => a !== b),
    outline: whole ? names.map((n) => asOutline(merge(second.topo, kept.filter((g) => parent(g) === n) as never), n)) : undefined,
    are: "districts",
    source: ADMIN2_SOURCE,
  };
}

/**
 * The second-order divisions of a country, or of one of its first-order divisions where that is named: undefined while
 * they are fetched, null where none are held. Nothing is fetched for a null country.
 */
export function useSecondOrder(cc: string | null, division?: string): SecondOrder | null | undefined {
  const us = cc === "US";
  const [usa, setUsa] = useState<{ topo: Topology; state: Map<string, string> } | null>(null);
  useEffect(() => {
    if (!us) return;
    let off = false;
    counties().then((c) => !off && setUsa(c));
    return () => {
      off = true;
    };
  }, [us]);
  const second = useAdmin2(cc && !us ? cc : null);
  return useMemo(() => {
    if (!cc) return null;
    if (us ? !usa : second === undefined) return undefined;
    const key = `${cc}|${division ?? ""}`;
    if (!MADE.has(key)) MADE.set(key, us ? ofUnitedStates(usa!, division) : second ? ofCountry(cc, second, division) : null);
    return MADE.get(key)!;
  }, [cc, us, usa, second, division]);
}

/**
 * The outlines put together from the second order, where they can stand for the ones the site lists: every division
 * listed must be among them by name, or one would go missing from the map. Null where they cannot.
 */
/**
 * The listed outlines with each division that the second order holds put together from its own districts, the rest as
 * listed: where not every division can be, those that can still meet their districts' borders. Null where none can.
 */
export function matchedTo(second: SecondOrder | null | undefined, listed: Outline[] | null | undefined): Outline[] | null {
  if (!second?.outline?.length || !listed?.length) return null;
  const by = new Map(second.outline.map((o) => [o.properties.n, o]));
  let hit = 0;
  const out = listed.map((f) => {
    const own = f.properties.n ? by.get(f.properties.n) : undefined;
    if (!own) return f;
    hit++;
    return own;
  });
  return hit ? out : null;
}

export function alignedTo(second: SecondOrder | null | undefined, listed: Outline[] | null | undefined): Outline[] | null {
  if (!second?.outline?.length || !listed?.length) return null;
  const have = new Set(second.outline.map((o) => o.properties.n));
  return listed.every((f) => f.properties.n && have.has(f.properties.n)) ? second.outline : null;
}
