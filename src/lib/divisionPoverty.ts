/**
 * Poverty and inequality of a division outside the United States, where the World Bank publishes them for the division
 * itself: its Subnational Poverty and Inequality Database (SPID), from household surveys (static/poverty/divisions.json,
 * built by build-division-poverty.cjs). A division is in the file only where the survey's region is the division - the
 * same name on the same map, and nothing in its Wikidata record saying the land has changed between the two - so many
 * are not. Fetched once, when the first division card or window that can show it opens.
 */
import { useEffect, useState } from "react";

export type DivisionPoverty = {
  /** The survey's year. */
  y: number;
  /** The survey, by the World Bank's short name for it (e.g. "PNADC-E1", "HCES"). */
  s: string;
  /** The region's name as the survey gives it. */
  n: string;
  /** What the survey measures each person's living by. */
  w: "income" | "consumption";
  /** The share of people under $3.00, $4.20 and $8.30 a day (2021 PPP), per cent. */
  p300?: number;
  p420?: number;
  p830?: number;
  /** The Gini index, 0 to 100. */
  gini?: number;
};

export const DIVISION_POVERTY_SOURCE = {
  label: "World Bank — Subnational Poverty and Inequality Database (SPID), Fall 2026 (CC BY 4.0)",
  url: "https://datacatalog.worldbank.org/search/dataset/0064796",
};

let file: Promise<Record<string, DivisionPoverty> | null> | null = null;
const load = () =>
  (file ??= fetch("/poverty/divisions.json")
    .then((r) => (r.ok ? (r.json() as Promise<{ divisions: Record<string, DivisionPoverty> }>) : null))
    .then((j) => j?.divisions ?? null)
    .catch(() => null));

/** Every division's poverty and inequality held, by division id: undefined while fetched, null where the file did not come. */
export function useDivisionPoverty(): Record<string, DivisionPoverty> | null | undefined {
  const [got, setGot] = useState<Record<string, DivisionPoverty> | null | undefined>(undefined);
  useEffect(() => {
    let off = false;
    load().then((f) => !off && setGot(f));
    return () => {
      off = true;
    };
  }, []);
  return got;
}
