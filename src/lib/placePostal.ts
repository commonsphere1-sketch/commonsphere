/**
 * The postal codes of the places below a country's first-order divisions -
 * its towns and villages, its districts, the counties of the United States
 * and the cities the United Nations lists - one file a country
 * (static/postal/<country>.json, built by build-place-postal.cjs from
 * GeoNames' postal codes, CC BY 4.0). A country's file is fetched when one
 * of its places' windows opens. A division's own codes are with its other
 * details (divisionDetails.ts).
 *
 * How a code is put with a place is a reading of GeoNames' own record, and
 * each window says which: a county by the county GeoNames files the code
 * under; a district by the outline that holds the code's point; a town by
 * its name, its district and how near the code's point is. A place with no
 * code has no entry, and nothing is shown for it.
 */
import { useEffect, useState } from "react";

/** How many codes, the first and the last in order, and the codes themselves where there are no more than twenty. */
export type PostalEntry = [n: number, from: string, to: string, codes?: string[]];

export type PostalFile = {
  /** By GeoNames id. */
  places?: Record<string, PostalEntry>;
  /** By the district's place in the country's file of outlines (static/geo/admin2). */
  districts?: Record<string, PostalEntry>;
  /** The United States' counties, by FIPS code. */
  counties?: Record<string, PostalEntry>;
  /** The United Nations' cities, by its code for the city: the GeoNames id of the place whose codes are the city's. */
  cities?: Record<string, number>;
};

export const POSTAL_SOURCE = { label: "GeoNames — postal codes (CC BY 4.0)", url: "https://download.geonames.org/export/zip/" };

/** What GeoNames does not hold in full, as its own readme for the postal codes says: given beside a count for the country. */
export const POSTAL_PARTIAL: Record<string, string> = {
  AR: "GeoNames holds the first five characters of Argentina's codes, not the codes in full.",
  BR: "GeoNames holds only Brazil's major codes - those ending -000 and the main code of each municipality - so most places have one.",
  CA: "GeoNames holds only the first part of Canada's codes here, not the codes in full.",
  CL: "GeoNames holds only the first digits of Chile's codes.",
  CN: "GeoNames holds only China's codes that end in 00.",
  GB: "GeoNames holds only the first part of the United Kingdom's codes here - the outward code, as OX1 - not the codes in full.",
  IE: "GeoNames holds only the first letters of Ireland's codes.",
  MT: "GeoNames holds only the first letters of Malta's codes.",
  NL: "GeoNames holds only the first part of the Netherlands' codes here, not the codes in full.",
};

const FILES = new Map<string, Promise<PostalFile | null>>();
const load = (cc: string) => {
  if (!FILES.has(cc))
    FILES.set(
      cc,
      fetch(`/postal/${cc}.json`)
        // A country GeoNames lists no codes for has no file, and the dev server answers with the page itself: only JSON is read.
        .then((r) => (r.ok && /json/.test(r.headers.get("content-type") ?? "") ? (r.json() as Promise<PostalFile>) : null))
        .catch(() => null),
    );
  return FILES.get(cc)!;
};

/** A country's places' postal codes: undefined while they are fetched, null where GeoNames lists none for the country. Nothing is fetched for a null country. */
export function usePlacePostal(cc: string | null): PostalFile | null | undefined {
  const [got, setGot] = useState<{ cc: string; file: PostalFile | null } | null>(null);
  useEffect(() => {
    if (!cc) return;
    let off = false;
    load(cc).then((file) => !off && setGot({ cc, file }));
    return () => {
      off = true;
    };
  }, [cc]);
  if (!cc) return null;
  return got && got.cc === cc ? got.file : undefined;
}

/** A United Nations city's codes: those of the GeoNames place of its name. */
export const cityPostal = (file: PostalFile | null | undefined, unCode: number): PostalEntry | undefined => {
  const id = file?.cities?.[unCode];
  return id == null ? undefined : file?.places?.[id];
};
