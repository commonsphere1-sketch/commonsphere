/**
 * The figures a country's map of its divisions - its states, provinces or regions, and the counties inside them where
 * figures are held for those - can be drawn by, as asked: on the Worldview page's "Where it is" map, for every country
 * they are held for.
 *
 *   Population        each division's own record (data/subnations.ts): its latest dated, referenced population -
 *                     Wikidata's, citing the statistics office, or Wikipedia's where the record marks it so - each with
 *                     its own year. The United States' counties: the Census Bureau's Vintage 2025 estimates (data/usCounties.ts).
 *   Density           worked out here from that population and the division's area, and said to be: a county's land
 *                     area is the Census Bureau's 2025 Gazetteer's.
 *   Household income  the United States' states and counties: the Census Bureau's Small Area Income and Poverty
 *   Poverty           Estimates (static/us/place-figures.json, build-us-place-figures.cjs).
 *   Homicide          the United States' states and counties: the CDC's deaths to 100,000 residents (the same file).
 *
 * A division's figure is found by its record's outline (outlinesOf: its name, its other names and the table of names
 * the outlines spell another way); one whose record is not found on the map has none, and its outline is left plain.
 * A county's is found by its FIPS code, which is its outline's. Where a country's counties hold a figure, they are what
 * is drawn, its divisions' edges over them. Each is drawn by the sixth of its kind it falls in: the more solid, the
 * higher. Nothing is estimated.
 */
import { useEffect, useMemo, useState } from "react";
import type { Subnation } from "../data/subnations";
import type { UsCounty } from "../data/usCounties";
import { usStatesData } from "../data/statesData";
import { outlinesOf, useAdmin1, type Outline } from "./outlines";

export type DivisionMeasureId = "population" | "density" | "income" | "poverty" | "homicide";
/** A figure: its value, its year, whose it is, and whether the CDC modelled it (a county of 1 to 9 homicides). */
export type DivisionFigure = { v: number; y: string; by: string; modelled?: boolean };
type Source = { label: string; url: string };
/** A measure's figures for one country: by the name each division's outline is drawn under, or by each county's FIPS code. */
export type HeldFigures = {
  by: Map<string, DivisionFigure>;
  /** What they are held for: the country's divisions, or its counties - drawn at every distance, the divisions' edges over them. */
  level: "divisions" | "counties";
  sources: Source[];
  /** Which of those the map draws are left plain, and why, where that is known: a sentence of its own. */
  plain?: string;
};
export type DivisionMeasure = {
  id: DivisionMeasureId;
  chip: string;
  /** What its pop-up says of a division or a county. */
  say: (f: DivisionFigure) => string;
  /** What is said under the map, of the years and sources held, and of what they are held for ("divisions", "counties"). */
  note: (years: string, sources: string, are: string) => string;
};

const SIXTHS = (are: string, more: string) =>
  `The more solid, ${more}: each is drawn by the sixth of the ${are} it falls in${are === "counties" ? ", the states' edges over them" : ""}.`;
const MANY_YEARS = (years: string) => (years.includes(" to ") ? ": each one's year is in its pop-up, and the years are not all one" : "");

export const DIVISION_MEASURES: DivisionMeasure[] = [
  {
    id: "population",
    chip: "Population",
    say: (f) => `${Math.round(f.v).toLocaleString("en-US")} people · ${f.y} · ${f.by}`,
    note: (years, sources, are) => `The population of each of its ${are} - ${sources} - for ${years}${MANY_YEARS(years)}. ${SIXTHS(are, "the more people")} One with no population held is left plain.`,
  },
  {
    id: "density",
    chip: "Density",
    say: (f) => `${f.v >= 100 ? Math.round(f.v).toLocaleString("en-US") : f.v.toFixed(1)} people to a km² · ${f.y} · worked out here`,
    note: (years, sources, are) =>
      `People to a km² of each of its ${are}: worked out here from its population (${sources}) for ${years} and its area - ${
        are === "counties" ? "its land area in the Census Bureau's 2025 Gazetteer, inland water left out" : "as its record gives it, inland water and all where the record counts it"
      }. ${SIXTHS(are, "the denser")} One with no population or area held is left plain.`,
  },
  {
    id: "income",
    chip: "Household income",
    say: (f) => `$${Math.round(f.v).toLocaleString("en-US")} median household income · ${f.y} · ${f.by}`,
    note: (years, _sources, are) =>
      `Median household income in ${years}: half the households of each of its ${are} take in more, half less. The Census Bureau's Small Area Income and Poverty Estimates, which model every state and county alike from its surveys, tax returns and the programmes' own counts. ${SIXTHS(are, "the higher")} One with no figure held is left plain.`,
  },
  {
    id: "poverty",
    chip: "Poverty",
    say: (f) => `${f.v.toFixed(1)}% of people in poverty · ${f.y} · ${f.by}`,
    note: (years, _sources, are) =>
      `The share of the people of each of its ${are}, of all ages, below the official poverty line in ${years}: the Census Bureau's Small Area Income and Poverty Estimates. ${SIXTHS(are, "the higher the share")} One with no figure held is left plain.`,
  },
  {
    id: "homicide",
    chip: "Homicide",
    say: (f) => `${f.v.toFixed(1)} deaths by homicide to 100,000 people · ${f.y} · ${f.by}${f.modelled ? " · modelled by the CDC: 1 to 9 deaths" : ""}`,
    note: (years, _sources, are) =>
      `Deaths by homicide in ${years} to 100,000 residents, by where the dead lived: the CDC's count from death certificates (National Vital Statistics System). Where a county had 1 to 9 deaths the CDC gives a rate from a statistical model in place of the count, and its pop-up says so; where the CDC withholds the rate, the county is left plain. ${SIXTHS(are, "the more deaths")}`,
  },
];

let SUBS: Promise<Subnation[]> | null = null;
const subnations = () => (SUBS ??= import("../data/subnations").then((m) => m.SUBNATIONS));

type UsFigure = { i?: number; p?: number; h?: number; hm?: 1 };
type UsFile = { years: Record<string, string>; sources: Record<string, Source>; states: Record<string, UsFigure>; counties: Record<string, UsFigure> };
type UsHeld = { counties: UsCounty[]; place: UsFile | null };
let US: Promise<UsHeld> | null = null;
/* The United States' counties' population, and its states' and counties' income, poverty and homicide: read when first wanted. A file not read leaves its figures out. */
const usHeld = () =>
  (US ??= Promise.all([
    import("../data/usCounties").then((m) => m.US_COUNTIES),
    fetch("/us/place-figures.json")
      .then((r) => (r.ok ? (r.json() as Promise<UsFile>) : null))
      .catch(() => null),
  ]).then(([counties, place]) => ({ counties, place })));

const BY = { wp: "Wikipedia", wpOnly: "Wikipedia", wikidata: "Wikidata, citing the statistics office" } as const;
const WIKIDATA: Source = { label: "Wikidata (CC0) — each division's population, citing its statistics office", url: "https://www.wikidata.org/" };
const WIKIPEDIA: Source = { label: "Wikipedia — a division's population where its Wikidata record has none", url: "https://en.wikipedia.org/" };
const ESTIMATES: Source = { label: "US Census Bureau — Vintage 2025 county population estimates", url: "https://www.census.gov/data/tables/time-series/demo/popest/2020s-counties-total.html" };
const GAZETTEER: Source = { label: "US Census Bureau — 2025 Gazetteer files, counties (land area)", url: "https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html" };
/* The counties the map draws on older lines than the figures are counted on, and so left plain - from matching the map's
   counties (us-atlas) to each file by FIPS code: Connecticut's eight, Valdez-Cordova, and for SAIPE Kalawao too. */
const OLD_LINES =
  "The map draws some counties on older lines than the figures are counted on, and those are left plain: Connecticut's eight counties, which the Census Bureau has counted as nine planning regions since 2022, and Alaska's Valdez-Cordova, divided in 2019.";
const STATE_NAME = new Map([...usStatesData.map((s) => [s.abbreviation, s.name] as const), ["DC", "District of Columbia"] as const]);

export type DivisionFigures = Partial<Record<DivisionMeasureId, HeldFigures>>;

/** A county's key among its country's held figures: its FIPS code, where it is one of the United States' counties. */
export function partKeyOf(cc: string | null): ((part: Outline) => string | undefined) | null {
  return cc === "US" ? (part) => (part.id === undefined ? undefined : String(part.id).padStart(5, "0")) : null;
}

/** A country's divisions' and counties' figures: undefined while they are read, null where the country has no divisions drawn. */
export function useDivisionFigures(cc: string | null): DivisionFigures | null | undefined {
  const drawn = useAdmin1(cc);
  const [subs, setSubs] = useState<Subnation[] | null>(null);
  const [us, setUs] = useState<UsHeld | null>(null);
  useEffect(() => {
    if (!cc) return;
    let live = true;
    void subnations().then((s) => live && setSubs(s));
    if (cc === "US") void usHeld().then((u) => live && setUs(u));
    return () => {
      live = false;
    };
  }, [cc]);
  return useMemo(() => {
    if (!cc) return null;
    if (drawn === undefined || !subs || (cc === "US" && !us)) return undefined;
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
    const recordSources = (m: Map<string, DivisionFigure>) => [
      ...([...m.values()].some((x) => x.by.startsWith("Wikidata")) ? [WIKIDATA] : []),
      ...([...m.values()].some((x) => x.by === "Wikipedia") ? [WIKIPEDIA] : []),
    ];
    const out: DivisionFigures = {
      population: { by: population, level: "divisions", sources: recordSources(population) },
      density: { by: density, level: "divisions", sources: recordSources(density) },
    };
    if (cc !== "US" || !us) return out;
    /* The United States: its counties, each by its FIPS code. Population and land area are the Census Bureau's; the year is the estimates' last. */
    const pop = new Map<string, DivisionFigure>();
    const dense = new Map<string, DivisionFigure>();
    for (const c of us.counties) {
      const people = c[7][c[7].length - 1];
      if (typeof people !== "number") continue;
      pop.set(c[0], { v: people, y: "2025", by: "US Census Bureau, Vintage 2025" });
      if (c[5] && c[5] > 0) dense.set(c[0], { v: people / c[5], y: "2025", by: "US Census Bureau, Vintage 2025" });
    }
    if (pop.size >= 2) out.population = { by: pop, level: "counties", sources: [ESTIMATES], plain: OLD_LINES };
    if (dense.size >= 2) out.density = { by: dense, level: "counties", sources: [ESTIMATES, GAZETTEER], plain: OLD_LINES };
    const f = us.place;
    if (!f) return out;
    const fromFile = (key: "i" | "p" | "h", year: string | undefined, src: Source | undefined, by: string, plain: string) => {
      if (!year || !src) return;
      const counties = new Map<string, DivisionFigure>();
      for (const [fips, x] of Object.entries(f.counties)) {
        const v = x[key];
        if (typeof v === "number") counties.set(fips, { v, y: year, by, ...(key === "h" && x.hm ? { modelled: true } : {}) });
      }
      if (counties.size >= 2) return { by: counties, level: "counties" as const, sources: [src], plain };
      const states = new Map<string, DivisionFigure>();
      for (const [abbr, x] of Object.entries(f.states)) {
        const v = x[key];
        const name = STATE_NAME.get(abbr);
        if (name && typeof v === "number") states.set(name, { v, y: year, by });
      }
      return states.size >= 2 ? { by: states, level: "divisions" as const, sources: [src] } : undefined;
    };
    const saipePlain = `${OLD_LINES} Kalawao, Hawaii, is left plain too: the estimates count it with Maui.`;
    const income = fromFile("i", f.years.income, f.sources.saipe, "Census Bureau, SAIPE", saipePlain);
    const poverty = fromFile("p", f.years.poverty, f.sources.saipe, "Census Bureau, SAIPE", saipePlain);
    const homicide = fromFile("h", f.years.homicide, f.sources.homicide, "CDC, National Vital Statistics System", OLD_LINES);
    if (income) out.income = income;
    if (poverty) out.poverty = poverty;
    if (homicide) out.homicide = homicide;
    return out;
  }, [cc, drawn, subs, us]);
}

/** The years and sources a country's figures are for, as the note under the map says them. */
export function yearsAndSources(m: Map<string, DivisionFigure>): { years: string; sources: string } {
  const ys = [...new Set([...m.values()].map((f) => f.y))].sort();
  const bs = [...new Set([...m.values()].map((f) => f.by))];
  return { years: ys.length > 1 ? `${ys[0]} to ${ys[ys.length - 1]}` : (ys[0] ?? ""), sources: bs.join("; or ") };
}

/**
 * Which of `steps` equal shares a figure falls in among all of its kind, 0 the lowest: by the share of them lower than it.
 * Places that tie fall together in the share their lowest would: the 1,246 counties with no homicide in 2024 - two in five -
 * are all in the lowest, where cutting at fixed places in the sorted list put them a third of the way up.
 */
export function stepAmong(values: number[], steps: number): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return sorted.length ? Math.min(steps - 1, Math.floor((steps * lo) / sorted.length)) : 0;
  };
}

/** Where each figure falls among its country's: the sixth, 0 the lowest. */
export function sixthsOf(m: Map<string, DivisionFigure>): (v: number) => number {
  return stepAmong(
    [...m.values()].map((f) => f.v),
    6,
  );
}

/** A division's or a county's fill on the map: the map's ink, more solid for a higher sixth; none where it has no figure. */
export function figureFill(m: Map<string, DivisionFigure>, ink: string, keyOf: (shape: Outline) => string | undefined = (s) => s.properties.n) {
  const step = sixthsOf(m);
  const ALPHA = ["2e", "52", "7a", "a3", "d1", "ff"];
  return (shape: Outline) => {
    const k = keyOf(shape);
    const f = k ? m.get(k) : undefined;
    return f ? `${ink}${ALPHA[step(f.v)]}` : undefined;
  };
}
