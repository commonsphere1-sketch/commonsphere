/**
 * What more is held of a division beyond its record in subnations.ts: its
 * postal codes, its other codes, its languages and names, and its own
 * economy and people where a dated, sourced figure exists
 * (static/divisions/<country>.json, built by build-subnation-details.cjs).
 * A country's file is fetched when one of its divisions' windows opens.
 *
 * Its postal codes are GeoNames' (CC BY 4.0), counted to the division whose
 * outline holds each code's point; everything else is its own Wikidata
 * record's (CC0). A field with nothing behind it is not there.
 */
import { useEffect, useState } from "react";

/** A figure with its year. */
export type Dated = [year: number, value: number];
/** An amount of money with its year and the currency it is in. */
export type Money = [year: number, amount: number, currency: string];

export type DivisionDetails = {
  /** GeoNames' postal codes inside its outline: how many, in how many places, and the first and the last in order. */
  postal?: { n: number; places: number; from: string; to: string };
  /** Its postal codes as its own record states them. */
  postalOwn?: string[];
  dial?: string[];
  plate?: string[];
  fips?: string;
  nuts?: string;
  hasc?: string;
  osm?: string;
  demonym?: string[];
  motto?: string;
  nickname?: string[];
  tz?: string[];
  langs?: string[];
  highest?: string;
  namedAfter?: string[];
  headOffice?: string;
  twins?: string[];
  /** In metres. */
  elevation?: number;
  /** Per cent of its area. */
  water?: number;
  /** How many divisions its record lists inside it. */
  parts?: number;
  gdp?: Money;
  gdpPc?: Money;
  income?: Money;
  unemployment?: Dated;
  lifeExp?: Dated;
  fertility?: Dated;
  literacy?: Dated;
  households?: Dated;
  women?: Dated;
  men?: Dated;
  urban?: Dated;
  rural?: Dated;
};

export const DIVISION_DETAILS_SOURCES = {
  postal: { label: "GeoNames — postal codes (CC BY 4.0)", url: "https://download.geonames.org/export/zip/" },
};

const FILES = new Map<string, Promise<Record<string, DivisionDetails> | null>>();
const load = (cc: string) => {
  if (!FILES.has(cc))
    FILES.set(
      cc,
      fetch(`/divisions/${cc}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<Record<string, DivisionDetails>>) : null))
        .catch(() => null),
    );
  return FILES.get(cc)!;
};

/** A country's divisions' details, by division id: undefined while they are fetched, null where there is no file. */
export function useDivisionDetails(cc: string): Record<string, DivisionDetails> | null | undefined {
  const [got, setGot] = useState<{ cc: string; file: Record<string, DivisionDetails> | null } | null>(null);
  useEffect(() => {
    let off = false;
    load(cc).then((file) => !off && setGot({ cc, file }));
    return () => {
      off = true;
    };
  }, [cc]);
  return got && got.cc === cc ? got.file : undefined;
}
