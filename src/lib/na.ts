/**
 * Helpers for figures that may be unpublished.
 *
 * A country's headline figure is NaN when no body the site uses publishes it
 * (see the end of countriesData.ts); it used to be a hand-written number.
 * These keep NaN from reaching the page as "NaN%" and from breaking sorts
 * and sums.
 */

/** True when the value is a real, published number. */
export const has = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** Format a figure, or "—" when it is not published. */
export function na(v: number | null | undefined, fmt: (v: number) => string): string {
  return has(v) ? fmt(v) : "—";
}

/** The value, or 0 when unpublished — for sums only, never for display. */
export const orZero = (v: number | null | undefined): number => (has(v) ? v : 0);

/**
 * Sort key that puts unpublished values last whichever way the list is
 * sorted: pass the direction you sort in.
 */
export function sortKey(v: number | null | undefined, dir: "asc" | "desc"): number {
  if (has(v)) return v;
  return dir === "desc" ? -Infinity : Infinity;
}
