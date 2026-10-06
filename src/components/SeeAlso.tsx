/**
 * "See also": from a place's window on one page to the same place's windows
 * on the others - its country profile, its economy, its leaders, its cities,
 * the states for the United States, and the map.
 *
 * Each window had its own row or none: a country's named its leaders and
 * nothing else, a city's and a leader's went to the country and the map, an
 * economy's and a state's went nowhere. This is the one row, built from the
 * place's ISO code, so every window offers the same ways out and a link is
 * only drawn where the other page holds a window to open.
 *
 * It reads indexes, not the pages' data: placeIndex.ts for the country and
 * the economy, leaderIndex.ts for the leaders, and the cities list.
 */
import { useNavigate } from "react-router-dom";
import { Buildings, CurrencyDollar, Flag, Globe, MapTrifold, UserCircle } from "@phosphor-icons/react";
import { COUNTRY_OF, ECONOMY_OF } from "../data/placeIndex";
import { LEADERS_BY_COUNTRY } from "../data/leaderIndex";
import { citiesData } from "../data/citiesData";

export type SeeAlsoKind = "country" | "economy" | "leaders" | "cities" | "states" | "map";

const CHIP =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer";

export function SeeAlso({
  code,
  name,
  omit = [],
  cityId,
  leaderId,
  mapTo,
  className = "mb-4",
}: {
  /** The place's country, by ISO 3166-1 alpha-2 code. */
  code: string;
  /** The country's name, as the links say it. */
  name: string;
  /** Kinds of link to leave out: the window's own, or ones it already draws elsewhere. */
  omit?: SeeAlsoKind[];
  /** The city whose window this is, left out of the cities. */
  cityId?: string;
  /** The leader whose window this is, left out of the leaders. */
  leaderId?: string;
  /** Where "On the map" goes, when not to the country: a city's or a state's place on it. */
  mapTo?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const has = (k: SeeAlsoKind) => !omit.includes(k);
  const country = has("country") ? COUNTRY_OF[code] : undefined;
  const economy = has("economy") ? ECONOMY_OF[code] : undefined;
  const leaders = has("leaders") ? (LEADERS_BY_COUNTRY[code] ?? []).filter((l) => l.id !== leaderId) : [];
  const cities = has("cities") ? citiesData.filter((c) => c.countryCode === code && c.id !== cityId) : [];
  const states = has("states") && code === "US";
  const map = has("map");
  if (!country && !economy && !leaders.length && !cities.length && !states && !map) return null;
  return (
    <nav className={`flex flex-wrap items-center gap-2 ${className}`} aria-label={`More on ${name}`}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">See also</span>
      {country && (
        <button type="button" onClick={() => navigate(`/dashboard/countries?open=${country}`)} className={CHIP} title={`Open ${name}'s country profile: its economy, government, people and history`}>
          <Globe size={12} weight="fill" aria-hidden />
          {name} · country profile
        </button>
      )}
      {economy && (
        <button type="button" onClick={() => navigate(`/dashboard/economies?open=${economy}`)} className={CHIP} title={`Open ${name} on the Economies page: its output, trade, prices and debt`}>
          <CurrencyDollar size={12} weight="fill" aria-hidden />
          {country ? "Economy" : `${name} · economy`}
        </button>
      )}
      {leaders.map((l) => (
        <button key={l.id} type="button" onClick={() => navigate(`/dashboard/world-leaders?open=${l.id}`)} className={CHIP} title={`Open ${l.name}'s profile on the World Leaders page`}>
          <UserCircle size={12} weight="fill" aria-hidden />
          {l.name}
          <span className="text-muted-foreground font-normal">· {l.title}</span>
        </button>
      ))}
      {cities.map((c) => (
        <button key={c.id} type="button" onClick={() => navigate(`/dashboard/cities?open=${c.id}`)} className={CHIP} title={`Open ${c.name} on the Cities page`}>
          <Buildings size={12} weight="fill" aria-hidden />
          {c.name}
        </button>
      ))}
      {states && (
        <button type="button" onClick={() => navigate("/dashboard/states")} className={CHIP} title="The fifty states, each with its own window">
          <Flag size={12} weight="fill" aria-hidden />
          The fifty states
        </button>
      )}
      {map && (
        <button type="button" onClick={() => navigate(mapTo ?? `/dashboard/maps?country=${code}`)} className={CHIP} title="Show it on the map">
          <MapTrifold size={12} weight="fill" aria-hidden />
          On the map
        </button>
      )}
    </nav>
  );
}
