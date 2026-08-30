/**
 * useResourceRents.ts
 * Loads World Bank natural-resource rents once per mount and exposes them by
 * economy id. Failures are silent by design — callers fall back to the curated
 * ECONOMY_RESOURCES data, so a blocked or slow upstream degrades to the old
 * behaviour rather than an empty section.
 */
import { useState, useEffect, useRef } from "react";
import { fetchResourceRents, type EconomyRents } from "../data/resourceRents";

export interface UseResourceRentsReturn {
  rents: Record<string, EconomyRents>;
  isLoading: boolean;
  /** True once a response has been processed, successful or not. */
  loaded: boolean;
}

export function useResourceRents(): UseResourceRentsReturn {
  const [rents, setRents] = useState<Record<string, EconomyRents>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const data = await fetchResourceRents();
        if (mounted.current) setRents(data);
      } catch {
        // keep the empty map; callers use curated data
      } finally {
        if (mounted.current) {
          setIsLoading(false);
          setLoaded(true);
        }
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  return { rents, isLoading, loaded };
}
