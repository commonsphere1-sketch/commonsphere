/**
 * useLiveData.ts
 *
 * The countries and states the pages read. It no longer fetches anything.
 *
 * It used to pull World Bank indicators from the browser on every page load
 * and patch them over the bundled data. Two things are wrong with that now:
 *
 *  - The request is blocked. The World Bank API no longer sends an
 *    Access-Control-Allow-Origin header to this origin, so every page load
 *    produced a row of CORS errors in the console and the fetch always failed.
 *  - Even when it worked, it defeated the point of the data build. Every
 *    figure on the site is now built from a named source and carries the year
 *    it is for (countryIndicators.ts, stateIndicators.ts and the rest). A
 *    silent patch replaced those with undated numbers, so a country could show
 *    a 2025 GDP labelled as a 2021 one.
 *
 * Refreshing from upstream belongs in the build scripts, which record the
 * source and year with each figure; run those and commit the result.
 *
 * The hook keeps its shape so callers need no changes: `isRefreshing` is
 * always false, `lastUpdated` always null, and `refresh` does nothing.
 */
import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";

export interface UseLiveDataReturn {
  countries: Country[];
  states: USState[];
  isRefreshing: boolean;
  lastUpdated: Date | null;
  patchedCount: number;
  source: string;
  refresh: () => void;
}

const STATIC: UseLiveDataReturn = {
  countries: countriesData,
  states: usStatesData,
  isRefreshing: false,
  lastUpdated: null,
  patchedCount: 0,
  source: "Built-in data, each figure dated",
  refresh: () => {},
};

export function useLiveData(): UseLiveDataReturn {
  return STATIC;
}
