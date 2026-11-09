/**
 * The figures a country's map of its divisions - its states, provinces or regions - can be drawn by, as asked: on the
 * Worldview page's "Where it is" map, for every country they are held for.
 *
 *   Population  each division's own record (data/subnations.ts): its latest dated, referenced population - Wikidata's,
 *               citing the statistics office, or Wikipedia's where the record marks it so - each with its own year.
 *   Density     worked out here from that population and the division's area, and said to be.
 *
 * A division's figure is found by its record's outline (outlinesOf: its name, its other names and the table of names
 * the outlines spell another way); one whose record is not found on the map has none, and its outline is left plain.
 * Each is drawn by the sixth of its country's divisions it falls in: the more solid, the higher. Nothing is estimated.
 */
import { useEffect, useMemo, useState } from "react";
import type { Subnation } from "../data/subnations";
import { outlinesOf, useAdmin1, type Outline } from "./outlines";

export type DivisionMeasureId = "population" | "density";
export type DivisionFigure = { v: number; y: string; by: string };
export type DivisionMeasure = {
  id: DivisionMeasureId;
  chip: string;
  /** What its pop-up says of a division. */
  say: (f: DivisionFigure) => string;
  /** What is said under the map, of the years and sources held for this country. */
  note: (years: string, sources: string) => string;
};

export const DIVISION_MEASURES: DivisionMeasure[] = [
  {
    id: "population",
    chip: "Population",
    say: (f) => `${Math.round(f.v).toLocaleString("en-US")} people · ${f.y} · ${f.by}`,
    note: (years, sources) =>
      `Each division's population, as its own record gives it - ${sources} - for ${years}: each division's year is in its pop-up, and the years are not all one. The more solid, the more people: each division is drawn by the sixth of the country's divisions it falls in. A division with no population held is left plain.`,
  },
  {
    id: "density",
    chip: "Density",
    say: (f) => `${f.v >= 100 ? Math.round(f.v).toLocaleString("en-US") : f.v.toFixed(1)} people to a km² · ${f.y} · worked out here`,
    note: (years, sources) =>
      `People to a km² of each division: worked out here from its population (${sources}) for ${years} and its area as its record gives it, inland water and all where the record counts it. The more solid, the denser: each division is drawn by the sixth of the country's divisions it falls in. A division with no population or area held is left plain.`,
  },
];

let SUBS: Promise<Subnation[]> | null = null;
const subnations = () => (SUBS ??= import("../data/subnations").then((m) => m.SUBNATIONS));

const BY = { wp: "Wikipedia", wpOnly: "Wikipedia", wikidata: "Wikidata, citing the statistics office" } as const;

export type DivisionFigures = Record<DivisionMeasureId, Map<string, DivisionFigure>>;

/** A country's divisions' figures, by the name each outline is drawn under: undefined while they are read, null where the country has no divisions drawn. */
export function useDivisionFigures(cc: string | null): DivisionFigures | null | undefined {
  const drawn = useAdmin1(cc);
  const [subs, setSubs] = useState<Subnation[] | null>(null);
  useEffect(() => {
    if (!cc) return;
    let live = true;
    void subnations().then((s) => live && setSubs(s));
    return () => {
      live = false;
    };
  }, [cc]);
  return useMemo(() => {
    if (!cc) return null;
    if (drawn === undefined || !subs) return undefined;
    if (!drawn || drawn.length < 2) return null;
    const own = subs.filter((s) => s.cc === cc);
    const population = new Map<string, DivisionFigure>();
    const density = new Map<string, DivisionFigure>();
    for (const s of own) {
      if (!s.pop) continue;
      const by = BY[s.popBy ?? "wikidata"];
      for (const o of outlinesOf(drawn, cc, s, own)) {
        const n = o.properties.n;
        if (!n || population.has(n)) continue;
        population.set(n, { v: s.pop[1], y: String(s.pop[0]), by });
        if (s.areaKm2 && s.areaKm2 > 0) density.set(n, { v: s.pop[1] / s.areaKm2, y: String(s.pop[0]), by });
      }
    }
    return { population, density };
  }, [cc, drawn, subs]);
}

/** The years and sources a country's figures are for, as the note under the map says them. */
export function yearsAndSources(m: Map<string, DivisionFigure>): { years: string; sources: string } {
  const ys = [...new Set([...m.values()].map((f) => f.y))].sort();
  const bs = [...new Set([...m.values()].map((f) => f.by))];
  return { years: ys.length > 1 ? `${ys[0]} to ${ys[ys.length - 1]}` : (ys[0] ?? ""), sources: bs.join("; or ") };
}

/** Where each figure falls among its country's: the sixth, 0 the lowest - by the values themselves, as the World Maps page draws a figure. */
export function sixthsOf(m: Map<string, DivisionFigure>): (v: number) => number {
  const sorted = [...m.values()].map((f) => f.v).sort((a, b) => a - b);
  const breaks = [1, 2, 3, 4, 5].map((i) => sorted[Math.floor((sorted.length * i) / 6)]);
  return (v) => breaks.filter((b) => v >= b).length;
}

/** A division's fill on the map: the map's ink, more solid for a higher sixth; none where it has no figure. */
export function figureFill(m: Map<string, DivisionFigure>, ink: string) {
  const step = sixthsOf(m);
  const ALPHA = ["2e", "52", "7a", "a3", "d1", "ff"];
  return (shape: Outline) => {
    const f = shape.properties.n ? m.get(shape.properties.n) : undefined;
    return f ? `${ink}${ALPHA[step(f.v)]}` : undefined;
  };
}
