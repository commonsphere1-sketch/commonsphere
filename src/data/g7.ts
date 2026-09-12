import { countriesData, type Country } from "./countriesData";

/**
 * G7 membership.
 *
 * Seven states: Canada, France, Germany, Italy, Japan, the United Kingdom and
 * the United States. The European Union attends every summit and is represented
 * by the Presidents of the European Council and the Commission, but it is not
 * counted among the members and has no country row in this dataset — the same
 * arrangement the G20 file describes for the EU and the African Union.
 *
 * Matched on ISO 3166-1 alpha-2 rather than name, because codes do not drift
 * when a country is renamed. All seven were confirmed present in the dataset
 * before this file was written.
 */

export const G7_MEMBER_CODES = [
  "CA", // Canada
  "FR", // France
  "DE", // Germany
  "IT", // Italy
  "JP", // Japan
  "GB", // United Kingdom
  "US", // United States
] as const;

/** Takes part in every summit, but is not a member state. Named for the UI. */
export const G7_PARTICIPANTS = ["European Union"] as const;

const codeSet = new Set<string>(G7_MEMBER_CODES);

export function isG7(country: Country): boolean {
  return codeSet.has(country.code);
}

/** The seven member states, in dataset order. */
export const g7Countries: Country[] = countriesData.filter(isG7);
