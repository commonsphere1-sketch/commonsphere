/**
 * The quality-of-life cards in a profiled city's window. The figures held for
 * a city itself - its journey to work - are kept by the UN's id for the city,
 * and a profile has an id of its own: this finds the one from the other
 * (lib/profiledCities.ts), where the UN's list of cities is loaded anyway,
 * and hands the cards the id they know. A profile given a Census place by
 * hand keeps its own.
 */
import { COMMUTE_US_CITIES } from "../data/commute";
import { UN_OF_PROFILE } from "../lib/profiledCities";
import CountryQuality from "./CountryQuality";

export default function ProfileQuality({ code, country, place, city }: { /** The country's ISO code. */ code: string; country: string; place: string; /** The profile's id on the Cities page. */ city: string }) {
  return <CountryQuality code={code} country={country} place={place} city={COMMUTE_US_CITIES[city] ? city : (UN_OF_PROFILE.get(city) ?? city)} />;
}
