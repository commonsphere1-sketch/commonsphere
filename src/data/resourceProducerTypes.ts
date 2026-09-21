/**
 * The shape shared by the generated producer tables — resourceProducers.ts
 * (USGS minerals) and energyProducers.ts (oil, gas, coal) — so the resource
 * modal draws one table for all of them.
 *
 * Amounts carry their own unit rather than all being tonnes: oil is counted
 * in barrels, gas in cubic metres, and converting either to tonnes would put
 * a figure on the page that no source published.
 */

export type Amount = { value: number; lowerBound: boolean };
export type Share = { pct: number; bound: "exact" | "atMost" | "atLeast" };

/**
 * t       tonnes
 * kb/d    thousand barrels per day
 * mb      million barrels
 * bcm     billion cubic metres
 */
export type ProducerUnit = "t" | "kb/d" | "mb" | "bcm";

export interface ResourceProducer {
  name: string;
  production: Amount | null;
  /** The publisher withholds the figure to protect company data; not zero. */
  productionWithheld?: boolean;
  productionShare: Share | null;
  reserves: Amount | null;
  reservesShare: Share | null;
}

export interface ResourceProducers {
  /** What "production" means for this commodity, in the publisher's terms. */
  measure: string;
  productionYear: string;
  /** Null where no reserves are published for the commodity (aluminum). */
  reservesYear: string | null;
  productionUnit: ProducerUnit;
  reservesUnit: ProducerUnit | null;
  worldProduction: Amount;
  worldReserves: Amount | null;
  /** Largest producer first. */
  countries: ResourceProducer[];
  sources: { label: string; url: string }[];
  /** Caveats specific to this commodity's figures, shown under the table. */
  notes?: string[];
  /**
   * What the second column holds, where it is not reserves. Wheat has none —
   * a harvest is not a reserve — so its second column is exports.
   */
  reservesLabel?: string;
  /** Countries whose production figure the publisher marks as an estimate. */
  estimated?: string[];
}
