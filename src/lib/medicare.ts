/**
 * How many of a US county's or state's people are on Medicare: the Centers for Medicare & Medicaid Services' Medicare
 * Monthly Enrollment for the latest month (public domain; static/us/medicare.json, built by build-medicare-enrollment.cjs).
 * Fetched once, when the first county or state window opens.
 */
import { useEffect, useState } from "react";

/** Everyone on Medicare, those in Original Medicare, those in Medicare Advantage or another plan, and those also on Medicaid: null where CMS suppresses a count. */
export type MedicareRow = [total: number | null, original: number | null, advantage: number | null, dual: number | null];
export type MedicareFile = {
  source: { label: string; url: string };
  month: string;
  nation: MedicareRow;
  /** By the state's two-letter abbreviation. */
  states: Record<string, MedicareRow>;
  /** By the county's five-digit FIPS code. */
  counties: Record<string, MedicareRow>;
};

let file: Promise<MedicareFile | null> | null = null;
const load = () =>
  (file ??= fetch("/us/medicare.json")
    .then((r) => (r.ok ? (r.json() as Promise<MedicareFile>) : null))
    .catch(() => null));

/** The file: undefined while it is fetched, null where it did not come. */
export function useMedicare(): MedicareFile | null | undefined {
  const [got, setGot] = useState<MedicareFile | null | undefined>(undefined);
  useEffect(() => {
    let off = false;
    load().then((f) => !off && setGot(f));
    return () => {
      off = true;
    };
  }, []);
  return got;
}
