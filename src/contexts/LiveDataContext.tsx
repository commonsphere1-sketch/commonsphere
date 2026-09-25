import React, { createContext, useContext, useEffect } from "react";
import { useLiveData, type UseLiveDataReturn } from "@/hooks/useLiveData";
import { refreshLive } from "@/lib/liveFigures";
import { countriesData, type Country } from "@/data/countriesData";
import { usStatesData, type USState } from "@/data/statesData";

/**
 * LiveDataContext
 *
 * The site's countries and states, with the scheduled refresh applied (see
 * lib/liveFigures.ts). The provider fetches the latest refresh once when the
 * app starts; pages reading through this context re-render when it lands.
 *
 * The built data stays the floor: if the fetch fails or has not returned
 * yet, consumers get the figures the site was built with (or the last
 * refresh this browser saw) rather than an empty page.
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
  useEffect(() => {
    void refreshLive();
  }, []);
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
