/**
 * A country's population as the site holds it, for the pages that list
 * countries in order of it: the World Bank's latest figure, or, where the
 * World Bank reports none, the one from the source the figure itself names.
 * A country with no figure held has none here, and is listed after those
 * that have one.
 */
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE, COUNTRY_INDICATOR_FALLBACKS, type Measured } from "../data/countryIndicators";

type Source = { label: string; url: string };

/** The population held for a country, with its year. */
export const countryPeople = (cc: string): Measured | undefined => COUNTRY_INDICATORS[cc]?.population;

/** Whose figure a population is. */
export const peopleSource = (m: Measured): Source => (m.s ? COUNTRY_INDICATOR_FALLBACKS[m.s] : { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url });

/** Every source the populations of these countries come from, the World Bank first. */
export function peopleSources(codes: string[]): Source[] {
  const seen = new Map<string, Source>([[COUNTRY_INDICATORS_SOURCE.label, { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url }]]);
  for (const cc of codes) {
    const m = countryPeople(cc);
    if (m) seen.set(peopleSource(m).label, peopleSource(m));
  }
  return [...seen.values()];
}

/** Most people first; a country with no figure held goes after those that have one. */
export const byPeople = (a: string, b: string) => (countryPeople(b)?.v ?? -1) - (countryPeople(a)?.v ?? -1);
