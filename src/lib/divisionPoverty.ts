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

/**
 * A European division's share of people at risk of poverty: Eurostat's, from the EU survey of income and living conditions
 * (static/poverty/eurostat.json, built by build-division-eurostat.cjs). Matched by the division's NUTS code, and only where
 * that code's name is the division's. At risk of poverty is relative: household income, for its size, under 60% of the
 * country's median - how far below the rest of the country, not a fixed line.
 */
export type EuFigure = [year: number, pct: number, flag?: string];
export type EuPoverty = {
  /** The NUTS code the figures are published under. */
  code: string;
  /** At risk of poverty: under 60% of the national median income (ilc_li41). */
  arop?: EuFigure;
  /** At risk of poverty or social exclusion (ilc_peps11n). */
  arope?: EuFigure;
};
type EuFile = { sources: { arop: { label: string; url: string }; arope: { label: string; url: string } }; divisions: Record<string, EuPoverty> };
export const EU_POVERTY_SOURCES = {
  arop: { label: "Eurostat — At-risk-of-poverty rate by NUTS region (ilc_li41), EU-SILC", url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_li41/default/table" },
  arope: { label: "Eurostat — People at risk of poverty or social exclusion by NUTS region (ilc_peps11n), EU-SILC", url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_peps11n/default/table" },
};
/** What Eurostat's flag beside a figure says. */
export const EU_FLAG: Record<string, string> = { b: "a break in the series", p: "provisional", e: "estimated by Eurostat", d: "its definition differs" };

let euFile: Promise<Record<string, EuPoverty> | null> | null = null;
const loadEu = () =>
  (euFile ??= fetch("/poverty/eurostat.json")
    .then((r) => (r.ok ? (r.json() as Promise<EuFile>) : null))
    .then((j) => j?.divisions ?? null)
    .catch(() => null));

/** Every European division's at-risk-of-poverty figures held, by division id: undefined while fetched, null where the file did not come. */
export function useDivisionEuPoverty(): Record<string, EuPoverty> | null | undefined {
  const [got, setGot] = useState<Record<string, EuPoverty> | null | undefined>(undefined);
  useEffect(() => {
    let off = false;
    loadEu().then((f) => !off && setGot(f));
    return () => {
      off = true;
    };
  }, []);
  return got;
}
