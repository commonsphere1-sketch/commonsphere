/**
 * Reading a city's figures (data/cityFigures.ts): what the United Nations
 * gives for it in a year, and how its population moved between two years.
 *
 * The figures are the UN's as published. What is worked out here is only the
 * change between two of them - a percentage, and the average rate a year that
 * would carry the one to the other.
 */
import { CITY_FIGURES, CITY_FIGURES_SOURCE } from "../data/cityFigures";

const { firstYear, baseYear, lastYear } = CITY_FIGURES_SOURCE;

/** Every year of the series, first to last. */
export const CITY_YEARS: number[] = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

export type CityYear = {
  year: number;
  /** People, at mid-year. */
  population: number;
  /** Land area, km². */
  area: number;
  /** Built-up area, km². */
  built: number;
  /** People per km² of land. */
  density: number;
  /** Built-up area per person, m². */
  builtPer: number;
  /** Share of the people living in its country's cities, per cent. */
  share: number;
};

/** A city's figures for a year - the UN's base year unless another is asked for - or null where the UN gives none. */
export function cityYear(id: string, year: number = baseYear): CityYear | null {
  const f = CITY_FIGURES[id];
  const i = year - firstYear;
  if (!f || i < 0 || i >= f.pop.length) return null;
  const population = f.pop[i], area = f.area[i], built = f.built[i], density = f.density[i], builtPer = f.builtPer[i], share = f.share[i];
  if (population == null || area == null || built == null || density == null || builtPer == null || share == null) return null;
  return { year, population, area, built, density, builtPer, share };
}

/** The first year the UN gives a population for the city. */
export function cityFirstYear(id: string): number | null {
  const i = CITY_FIGURES[id]?.pop.findIndex((v) => v != null) ?? -1;
  return i < 0 ? null : firstYear + i;
}

/** How a city's population moved from one year to another: the change in per cent, and the average rate a year. */
export function cityGrowth(id: string, from: number, to: number): { from: number; to: number; pct: number; perYear: number } | null {
  const a = cityYear(id, from)?.population;
  const b = cityYear(id, to)?.population;
  if (!a || !b || to <= from) return null;
  return { from, to, pct: (b / a - 1) * 100, perYear: (Math.pow(b / a, 1 / (to - from)) - 1) * 100 };
}
