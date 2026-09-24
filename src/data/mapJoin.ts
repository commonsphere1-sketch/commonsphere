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
 * drawn: 175 of 177 country features match at 1:110m; the two that do not,
 * Northern Cyprus and Somaliland, are entities the dataset does not treat as
 * states. The 1:50m file draws 236 of the dataset's 250 places. The other 14
 * have no shape of their own in it: France's overseas regions, Svalbard and
 * the Caribbean Netherlands are drawn inside France, Norway and the
 * Netherlands; Christmas and Cocos share one "Indian Ocean Ter." shape; and
 * Tuvalu, Gibraltar, Tokelau, Bouvet and the US minor islands are absent.
 * Each still has its own 1:10m file for the focus map. All 50
 * states match; the atlas additionally carries DC and five territories the
 * state dataset omits.
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
  // Abbreviated in the 1:50m file only, which the focus map and the zoomed
  // world map draw from. Without these the eight were unselectable.
  "Cabo Verde": "Cape Verde",
  "São Tomé and Principe": "São Tomé & Príncipe",
  "Marshall Is.": "Marshall Islands",
  "Faeroe Is.": "Faroe Islands",
  "Antigua and Barb.": "Antigua & Barbuda",
  "St. Vin. and Gren.": "Saint Vincent & the Grenadines",
  "St. Kitts and Nevis": "Saint Kitts & Nevis",
  "Cook Is.": "Cook Islands",
  // Territories added to the dataset with the Economies expansion.
  Vatican: "Vatican City",
  "N. Mariana Is.": "Northern Mariana Islands",
  "U.S. Virgin Is.": "US Virgin Islands",
  "Cayman Is.": "Cayman Islands",
  "British Virgin Is.": "British Virgin Islands",
  "Turks and Caicos Is.": "Turks and Caicos Islands",
  "St-Martin": "Saint Martin",
  "Fr. Polynesia": "French Polynesia",
  Macao: "Macau",
  // The rest of the ISO 3166 list, added with the territories.
  "Falkland Is.": "Falkland Islands",
  "Fr. S. Antarctic Lands": "French Southern and Antarctic Lands",
  "S. Geo. and the Is.": "South Georgia and the South Sandwich Islands",
  "Br. Indian Ocean Ter.": "British Indian Ocean Territory",
  "Saint Helena": "Saint Helena, Ascension and Tristan da Cunha",
  "Pitcairn Is.": "Pitcairn Islands",
  "St. Pierre and Miquelon": "Saint Pierre and Miquelon",
  "Wallis and Futuna Is.": "Wallis and Futuna",
  "St-Barthélemy": "Saint Barthélemy",
  "Heard I. and McDonald Is.": "Heard Island and McDonald Islands",
};

/** Atlas features with no counterpart in the dataset, on purpose. */
export const UNMATCHED_BY_DESIGN = new Set([
  "N. Cyprus",
  "Somaliland",
  // 1:50m only. Christmas and Cocos are one shape here, so it cannot be
  // either; the other two belong to no place in the dataset.
  "Indian Ocean Ter.",
  "Ashmore and Cartier Is.",
  "Siachen Glacier",
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
