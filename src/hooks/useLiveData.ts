/**
 * useLiveData.ts
 *
 * The countries and states the pages read, brought up to date by the
 * scheduled refresh (see lib/liveFigures.ts).
 *
 * It used to pull World Bank indicators from the browser on every page load
 * and patch them over the bundled data, which went wrong twice over: the
 * World Bank stopped answering this origin (CORS), and the patch replaced
 * dated figures with undated ones. The refresh now runs on the server, on a
 * schedule, and a refreshed figure is used only when it is for the same or
 * a later period than the built one, with its period on it.
 *
 * `countries` and `states` are new arrays whenever the data changes, so
 * memoised views recompute; the objects in them are the shared ones.
 */
import { useMemo } from "react";
import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";
import { refreshLive, useLiveStatus } from "../lib/liveFigures";

export interface UseLiveDataReturn {
  countries: Country[];
  states: USState[];
  isRefreshing: boolean;
  /** When the sources were last checked for new figures. */
  lastUpdated: Date | null;
  /** How many figures differ from the ones the site was built with. */
  patchedCount: number;
  source: string;
  refresh: () => void;
}

export function useLiveData(): UseLiveDataReturn {
  const status = useLiveStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const countries = useMemo(() => [...countriesData], [status.version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const states = useMemo(() => [...usStatesData], [status.version]);
  return {
    countries,
    states,
    isRefreshing: status.refreshing,
    lastUpdated: status.lastChecked,
    patchedCount: status.patched,
    source: "Built-in data, each figure dated, refreshed from its source twice a day",
    refresh: () => void refreshLive(true),
  };
}
