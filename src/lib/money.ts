/**
 * A dollar amount given in billions, scaled so it always reads as a real
 * figure: $30.77T, $259B, $4.5B, $66M, $420K. The smallest economies are
 * measured in millions, and rounding them to whole billions printed "$0B".
 *
 * `signed` puts a "+" on positive values, for balances.
 */
export function usdFromBillions(b: number, signed = false): string {
  const sign = b < 0 ? "-" : signed && b > 0 ? "+" : "";
  const a = Math.abs(b);
  if (a >= 1000) return `${sign}$${(a / 1000).toFixed(2)}T`;
  if (a >= 1) return `${sign}$${a >= 100 ? a.toFixed(0) : a.toFixed(1)}B`;
  if (a >= 0.001) return `${sign}$${Math.round(a * 1000).toLocaleString()}M`;
  return `${sign}$${Math.round(a * 1e6).toLocaleString()}K`;
}
