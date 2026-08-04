/**
 * useLiveData.ts
 * React hook that fetches live country data on mount and returns the merged
 * dataset alongside refresh metadata.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchLiveCountryData, type LiveDataResult } from "../lib/liveData";
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

export function useLiveData(): UseLiveDataReturn {
  const [result, setResult] = useState<LiveDataResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchLiveCountryData();
      setResult(data);
    } catch {
      // silently fall back to static data
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
