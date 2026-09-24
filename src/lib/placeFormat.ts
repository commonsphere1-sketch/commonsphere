import { has } from "./na";

/* Shared by the Countries page, the States page and the followed-places cards,
   so a figure reads the same wherever it appears. */

/* GDP: trillions, billions, or millions.
   Small economies are the reason for the last case - the Cook Islands'
   $0.409bn rounded to "$0B" and Niue's to nothing at all, which reads as no
   economy rather than a small one. */
export function fmtGDP(billionsUSD: number): string {
  if (billionsUSD >= 1000)
    return `$${(billionsUSD / 1000).toFixed(2).replace(/\.?0+$/, "")}T`;
  if (billionsUSD >= 1) return `$${Math.round(billionsUSD)}B`;
  if (billionsUSD >= 0.001) return `$${Math.round(billionsUSD * 1000)}M`;
  return `$${Math.round(billionsUSD * 1e9).toLocaleString()}`;
}

/* Area in whichever unit keeps it readable. Fixed at millions, every small
   country read "0.00M km²": the Cook Islands' 236 km² and Monaco's 2 are not
   the same as nothing. */
export function fmtArea(km2: number): string {
  if (!has(km2)) return "—";
  if (km2 >= 1e6) return `${(km2 / 1e6).toFixed(2)}M km²`;
  // Vatican City is 0.44 km²: whole numbers would call it 0.
  if (km2 < 10) return `${km2 < 1 ? km2.toFixed(2) : km2.toFixed(1)} km²`;
  return `${Math.round(km2).toLocaleString()} km²`;
}

/* Population: K under a million, M from a million, B from a billion. */
export function fmtPop(n: number): string {
  if (!has(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n.toLocaleString()}`;
}
