/**
 * The cities the site profiles by hand, each as the city it is in the United
 * Nations' list: the same name, in the same country, within 80 km of the
 * profile's article - one such city, or the profile is matched to none.
 *
 * The match is made once, here, for whatever needs it: the list of every
 * city, which marks the profiled ones and links through to the profile, and
 * the panels that hold a figure by the UN's id for the city.
 */
import { citiesData } from "../data/citiesData";
import { CITY_PLACES } from "../data/cityPlaces";
import { UN_CITIES, type UnCity } from "../data/unCities";

export const unCityId = (c: UnCity) => `un-${c[0]}-${c[1]}`;

/** A name as compared: without accents, case or punctuation. */
export const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** The names a city goes by in the UN's list: "Tōkyō (Tokyo)" is Tōkyō and Tokyo, "Takasaki [Maebashi]" Takasaki and Maebashi. */
export const namesOf = (name: string) => name.split(/[()[\]/]/).map(plain).filter(Boolean);
export const km = (a: [number, number], b: [number, number]) => {
  const rad = Math.PI / 180;
  const h = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

/** By the UN's id for the city: the profile's id on the Cities page, and its article. */
export const PROFILED = new Map<string, { id: string; wiki: string }>();
/** The other way: by the profile's id, the UN's id for the city. */
export const UN_OF_PROFILE = new Map<string, string>();
for (const p of citiesData) {
  const at = CITY_PLACES[p.id];
  if (!at) continue;
  const near = UN_CITIES.filter((c) => c[0] === p.countryCode && c[3] !== null && c[4] !== null && namesOf(c[2]).includes(plain(p.name)) && km([c[3]!, c[4]!], [at.lat, at.lon]) <= 80);
  if (near.length === 1) {
    PROFILED.set(unCityId(near[0]), { id: p.id, wiki: at.wiki });
    UN_OF_PROFILE.set(p.id, unCityId(near[0]));
  }
}
/** How many cities the site profiles by hand. */
export const PROFILES = citiesData.length;
