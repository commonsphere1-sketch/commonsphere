import { countriesData, type Country } from "./countriesData";
import { usStatesData, type USState } from "./statesData";

/**
 * Joins map geometry to the site's own datasets.
 *
 * Geometry comes from Natural Earth by way of world-atlas, and from the US
 * Census Bureau by way of us-atlas — both public domain. Neither carries the
 * codes this project uses, so features are matched on name.
 *
 * The alias table below exists because Natural Earth abbreviates ("Dem. Rep.
 * Congo") where the dataset spells out ("DR Congo"). Every pair was read off
 * both files rather than recalled. The join was measured before any of this was
 * drawn: 171 of 177 country features match, and the six that do not are listed
 * in UNMATCHED_BY_DESIGN — territories, Antarctica, and two entities the
 * dataset does not treat as sovereign states. All 50 states match; the atlas
 * additionally carries DC and five territories the state dataset omits.
 *
 * If either dataset is renamed, `auditMapJoin()` will report it rather than the
 * country quietly turning grey.
 */

const ALIASES: Record<string, string> = {
  "W. Sahara": "Western Sahara",
  "United States of America": "United States",
  "Dem. Rep. Congo": "DR Congo",
  "Dominican Rep.": "Dominican Republic",
  "Central African Rep.": "Central African Republic",
  Congo: "Republic of the Congo",
  "Eq. Guinea": "Equatorial Guinea",
  Turkey: "Türkiye",
  "Solomon Is.": "Solomon Islands",
  Czechia: "Czech Republic",
  "Bosnia and Herz.": "Bosnia & Herzegovina",
  Macedonia: "North Macedonia",
  "S. Sudan": "South Sudan",
};

/** Atlas features with no counterpart in the dataset, on purpose. */
export const UNMATCHED_BY_DESIGN = new Set([
  "Falkland Is.",
  "Fr. S. Antarctic Lands",
  "New Caledonia",
  "Antarctica",
  "N. Cyprus",
  "Somaliland",
]);

const normalise = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const countriesByName = new Map<string, Country>(
  countriesData.map((c) => [normalise(c.name), c]),
);

const statesByName = new Map<string, USState>(
  usStatesData.map((s) => [normalise(s.name), s]),
);

/** The country a map feature refers to, or null when there is none. */
export function countryForFeature(featureName: string): Country | null {
  return countriesByName.get(normalise(ALIASES[featureName] ?? featureName)) ?? null;
}

/** The state a map feature refers to. DC and the territories return null. */
export function stateForFeature(featureName: string): USState | null {
  return statesByName.get(normalise(featureName)) ?? null;
}

/**
 * Re-runs the join and reports anything unexpected.
 *
 * Called in development only. A silent join failure looks exactly like a
 * country with no data, so it is worth a console warning rather than a shrug.
 */
export function auditMapJoin(featureNames: string[]): {
  matched: number;
  unexpectedMisses: string[];
} {
  const unexpectedMisses: string[] = [];
  let matched = 0;
  for (const name of featureNames) {
    if (countryForFeature(name)) matched++;
    else if (!UNMATCHED_BY_DESIGN.has(name)) unexpectedMisses.push(name);
  }
  return { matched, unexpectedMisses };
}
