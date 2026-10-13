/**
 * The second-order divisions of a place - the counties of a US state, the
 * districts of another country's province - as outlines, for the finer
 * borders an outline map draws inside the place it shows.
 *
 * The United States' are the Census Bureau's counties (us-atlas, the file
 * the county windows already draw from); every other country's are the ones
 * held in static/geo/admin2 (geoBoundaries, see lib/admin2.ts), for the
 * countries it has them for. A country with none draws no finer borders, and
 * nothing stands in for them.
 */
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import { ADMIN2_SOURCE, useAdmin2 } from "./admin2";
import type { Outline } from "./outlines";

type Source = { label: string; url: string };
const US_SOURCE: Source = { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" };

/** What is drawn: the outlines, what they are called in a caption, and whose they are. */
export type SecondOrder = { lines: Outline[]; are: string; source: Source };

/* The counties, a state's together, by the state's name as the Census Bureau writes it: fetched once, when first asked for. */
let COUNTIES: Promise<{ all: Outline[]; byState: Map<string, Outline[]> }> | null = null;
const counties = () =>
  (COUNTIES ??= import("us-atlas/counties-10m.json").then((m) => {
    const topo = (m.default ?? m) as unknown as Topology;
    const all = (feature(topo, topo.objects.counties) as unknown as { features: Outline[] }).features;
    const states = (feature(topo, topo.objects.states) as unknown as { features: Outline[] }).features;
    // A county's code begins with its state's two digits.
    const name = new Map(states.map((s) => [String(s.id), s.properties.name ?? ""]));
    const byState = new Map<string, Outline[]>();
    for (const c of all) {
      const n = name.get(String(c.id).padStart(5, "0").slice(0, 2));
      if (!n) continue;
      if (!byState.has(n)) byState.set(n, []);
      byState.get(n)!.push(c);
    }
    return { all, byState };
  }));

/**
 * The second-order divisions of a country, or of one of its first-order divisions where that is named: undefined while
 * they are fetched, null where none are held. Nothing is fetched for a null country.
 */
export function useSecondOrder(cc: string | null, division?: string): SecondOrder | null | undefined {
  const us = cc === "US";
  const [usa, setUsa] = useState<{ all: Outline[]; byState: Map<string, Outline[]> } | null>(null);
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
    if (us) {
      if (!usa) return undefined;
      const lines = division ? (usa.byState.get(division) ?? []) : usa.all;
      return lines.length ? { lines, are: "counties", source: US_SOURCE } : null;
    }
    if (second === undefined) return undefined;
    if (!second) return null;
    const lines = (division ? second.shapes.filter((s) => s.properties.p === division) : second.shapes) as unknown as Outline[];
    return lines.length ? { lines, are: "districts", source: ADMIN2_SOURCE } : null;
  }, [cc, us, usa, second, division]);
}
