/**
 * A US county's income and output: the Bureau of Economic Analysis's regional accounts (public domain) - per capita
 * personal income and real GDP year by year, and the latest personal income and current-dollar GDP - with its state's and
 * the nation's (static/us/bea/<state FIPS>.json, built by build-county-bea.cjs). A state's file is fetched when one of its
 * counties' windows opens. A county BEA counts together with the cities inside it (in Virginia, and Maui with Kalawao) is
 * not in the file.
 */
import { useEffect, useState } from "react";

export type BeaArea = {
  /** Per capita personal income, in dollars, for each of the file's years. */
  pc?: (number | null)[];
  /** Personal income in the latest year, in thousands of dollars. */
  pi?: number;
  /** Real GDP, in thousands of chained 2017 dollars, for each of the file's years. */
  real?: (number | null)[];
  /** Current-dollar GDP in the latest year, in thousands of dollars. */
  gdp?: number;
};
export type BeaFile = {
  sources: { income: { label: string; url: string }; gdp: { label: string; url: string } };
  years: number[];
  incomeYear: number;
  gdpYear: number;
  /** By five-digit FIPS code: the state's counties, the state (SS000) and the nation (00000). */
  areas: Record<string, BeaArea>;
};

const FILES = new Map<string, Promise<BeaFile | null>>();
const load = (st: string) => {
  if (!FILES.has(st))
    FILES.set(
      st,
      fetch(`/us/bea/${st}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<BeaFile>) : null))
        .catch(() => null),
    );
  return FILES.get(st)!;
};

/** A state's BEA file, by the state's two-digit FIPS code: undefined while fetched, null where none came. */
export function useCountyBea(st: string): BeaFile | null | undefined {
  const [got, setGot] = useState<{ st: string; file: BeaFile | null } | null>(null);
  useEffect(() => {
    let off = false;
    load(st).then((file) => !off && setGot({ st, file }));
    return () => {
      off = true;
    };
  }, [st]);
  return got && got.st === st ? got.file : undefined;
}
