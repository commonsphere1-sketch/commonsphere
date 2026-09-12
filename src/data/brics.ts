import { countriesData, type Country } from "./countriesData";

/**
 * BRICS membership.
 *
 * Ten member states: Brazil, Russia, India and China, joined by South Africa in
 * 2010, by Egypt, Ethiopia, Iran and the United Arab Emirates on 1 January
 * 2024, and by Indonesia in January 2025.
 *
 * Saudi Arabia is deliberately not counted. It was invited in the 2023
 * Johannesburg expansion and takes part in BRICS meetings, but has not
 * confirmed accession, and published lists disagree about whether to include
 * it. Counting a country that has not joined and dropping one that has are both
 * errors, so this file states the position rather than leaving it implied.
 *
 * BRICS also runs a separate "partner country" tier, agreed at the 2024 Kazan
 * summit. Partners are not members and are not included here.
 *
 * Sourcing, honestly: the primary sources were not reachable when this was
 * written. Brazil's 2025 chair site and the Itamaraty mirror would not connect,
 * India's 2026 chair site served an empty page, the Chinese foreign ministry's
 * copy of the Rio declaration was down for maintenance, and neither South
 * Africa's DIRCO page nor India's MEA page enumerates the membership. The list
 * below is therefore cited to a secondary source — English Wikipedia's BRICS
 * article, retrieved 2026-09-12, which gives the same ten and likewise excludes
 * Saudi Arabia — and is worth re-checking against a summit declaration. Every
 * code was confirmed present in this dataset before this file was written.
 *
 * Matched on ISO 3166-1 alpha-2 rather than name, as the other group files are.
 */

export const BRICS_MEMBER_CODES = [
  "BR", // Brazil — founding
  "RU", // Russia — founding
  "IN", // India — founding
  "CN", // China — founding
  "ZA", // South Africa — 2010
  "EG", // Egypt — 2024
  "ET", // Ethiopia — 2024
  "IR", // Iran — 2024
  "AE", // United Arab Emirates — 2024
  "ID", // Indonesia — 2025
] as const;

/**
 * Shown in the map's group panel, so the caveats travel with the figures rather
 * than living only in this comment.
 */
export const BRICS_MEMBERSHIP_NOTE =
  "The ten member states are mapped: Brazil, Russia, India and China, joined by " +
  "South Africa in 2010, by Egypt, Ethiopia, Iran and the United Arab Emirates " +
  "in 2024, and by Indonesia in 2025. Saudi Arabia was invited in 2023 and takes " +
  "part, but has not confirmed accession, so it is not counted here. BRICS also " +
  "has a separate partner-country tier, which is not included. Membership has " +
  "changed repeatedly since 2024; this list was checked on 12 September 2026.";

const codeSet = new Set<string>(BRICS_MEMBER_CODES);

export function isBrics(country: Country): boolean {
  return codeSet.has(country.code);
}

/** The ten member states, in dataset order. */
export const bricsCountries: Country[] = countriesData.filter(isBrics);
