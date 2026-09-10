import { countriesData, type Country } from "./countriesData";

/**
 * G20 membership.
 *
 * The group has 21 members: 19 states, the European Union, and the African
 * Union, which joined at the 2023 summit in New Delhi — the first addition
 * since the group was founded in 1999.
 *
 * Only the 19 states appear below, because the EU and AU are organisations
 * rather than countries and have no row in the country dataset. The page says
 * so rather than quietly presenting 19 as the whole membership.
 *
 * Matched on ISO 3166-1 alpha-2 rather than name: codes do not drift when a
 * country is renamed, which is how Türkiye would otherwise have gone missing.
 * All 19 were confirmed present in the dataset before this file was written.
 */

export const G20_MEMBER_CODES = [
  "AR", // Argentina
  "AU", // Australia
  "BR", // Brazil
  "CA", // Canada
  "CN", // China
  "FR", // France
  "DE", // Germany
  "IN", // India
  "ID", // Indonesia
  "IT", // Italy
  "JP", // Japan
  "MX", // Mexico
  "RU", // Russia
  "SA", // Saudi Arabia
  "ZA", // South Africa
  "KR", // South Korea
  "TR", // Türkiye
  "GB", // United Kingdom
  "US", // United States
] as const;

/** The two members that are unions rather than countries, named for the UI. */
export const G20_UNION_MEMBERS = ["European Union", "African Union"] as const;

const codeSet = new Set<string>(G20_MEMBER_CODES);

export function isG20(country: Country): boolean {
  return codeSet.has(country.code);
}

/** The 19 member states, in dataset order. */
export const g20Countries: Country[] = countriesData.filter(isG20);
