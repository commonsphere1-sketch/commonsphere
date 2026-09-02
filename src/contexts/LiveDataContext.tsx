import React, { createContext, useContext } from "react";
import { useLiveData, type UseLiveDataReturn } from "@/hooks/useLiveData";
import { countriesData, type Country } from "@/data/countriesData";
import { usStatesData, type USState } from "@/data/statesData";

/**
 * LiveDataContext
 *
 * One World Bank fetch shared across the app.
 *
 * The dashboard imported the static data files directly, so its figures were
 * frozen at whatever was authored into the repo while the countries and states
 * pages refreshed themselves. Anything reading through this context follows the
 * live values instead, and pages that already call useLiveData keep working
 * unchanged.
 *
 * The static files remain the floor: if the fetch fails or has not returned
 * yet, consumers get the authored data rather than an empty page.
 */
const LiveDataContext = createContext<UseLiveDataReturn>({
  countries: countriesData,
  states: usStatesData,
  isRefreshing: false,
  lastUpdated: null,
  patchedCount: 0,
  source: "static",
  refresh: () => {},
});

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const live = useLiveData();
  return (
    <LiveDataContext.Provider value={live}>{children}</LiveDataContext.Provider>
  );
}

export function useLiveDataContext(): UseLiveDataReturn {
  return useContext(LiveDataContext);
}

/** Convenience for the common case of just wanting the country rows. */
export function useLiveCountries(): Country[] {
  return useContext(LiveDataContext).countries;
}

/** Convenience for the common case of just wanting the state rows. */
export function useLiveStates(): USState[] {
  return useContext(LiveDataContext).states;
}
