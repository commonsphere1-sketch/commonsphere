/**
 * useLiveData.ts
 * React hook that fetches live country/state data and keeps it fresh.
 *
 * Refresh strategy — the upstream sources do not change second-by-second, so
 * polling aggressively would burn requests for nothing:
 *   - World Bank  : revised a few times a year
 *   - BLS         : monthly (state unemployment)
 *   - Census ACS  : annual
 * So we refresh on mount, again on a long interval, and opportunistically when
 * the tab regains focus after going stale. That keeps a long-lived tab current
 * without hammering the APIs.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchLiveCountryData, type LiveDataResult } from "../lib/liveData";
import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";

/** How often a mounted page re-pulls upstream data. */
export const LIVE_REFRESH_MS = 30 * 60 * 1000; // 30 minutes
/** Refetch on tab focus only if the data is at least this old. */
export const LIVE_STALE_MS = 5 * 60 * 1000; // 5 minutes

export interface UseLiveDataReturn {
  countries: Country[];
  states: USState[];
  isRefreshing: boolean;
  lastUpdated: Date | null;
  patchedCount: number;
  source: string;
  refresh: () => void;
}

export function useLiveData(
  refreshIntervalMs: number = LIVE_REFRESH_MS,
): UseLiveDataReturn {
  const [result, setResult] = useState<LiveDataResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Guards against overlapping fetches and against setting state after unmount.
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const lastAt = useRef<number>(0);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsRefreshing(true);
    try {
      const data = await fetchLiveCountryData();
      if (mounted.current) {
        setResult(data);
        lastAt.current = Date.now();
      }
    } catch {
      // Keep whatever we already have; the static data is the floor.
    } finally {
      inFlight.current = false;
      if (mounted.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, refreshIntervalMs);

    // A tab left open for hours should catch up as soon as it's looked at.
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastAt.current > LIVE_STALE_MS
      ) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      mounted.current = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh, refreshIntervalMs]);

  return {
    countries: result?.countries ?? countriesData,
    states: result?.states ?? usStatesData,
    isRefreshing,
    lastUpdated: result?.lastUpdated ?? null,
    patchedCount: result?.patchedCount ?? 0,
    source: result?.source ?? "Static data",
    refresh,
  };
}
