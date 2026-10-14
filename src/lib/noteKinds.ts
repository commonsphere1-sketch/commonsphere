/**
 * What a note can be about, and where on the site: one list for the note
 * popup, which tags a note, and the Notes page, which sorts them.
 *
 * A note was once about a country or a state, or about nothing. The site
 * now holds much more - municipalities, cities, economies, leaders, policy,
 * and whole pages on trends, rights, climate and crime - so a note can be
 * tagged with any of them. "Page" is a note about a whole page of the site
 * and not one place on it.
 *
 * The pages are the sidebar's own, by the same names.
 */
export const NOTE_KINDS = ["Country", "State", "Municipality", "City", "Economy", "Leader", "Policy", "Page"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

/** The pages of the site a note can be about, in the sidebar's order. */
export const SITE_SECTIONS: { to: string; label: string; holds: string }[] = [
  { to: "/dashboard", label: "Dashboard", holds: "the world at a glance" },
  { to: "/dashboard/states", label: "US States", holds: "the fifty states" },
  { to: "/dashboard/countries", label: "Countries", holds: "every country" },
  { to: "/dashboard/subnations", label: "Municipalities", holds: "states, provinces, counties, towns" },
  { to: "/dashboard/cities", label: "Cities", holds: "the world's cities" },
  { to: "/dashboard/economies", label: "Economies", holds: "output, tax, inflation, resources" },
  { to: "/dashboard/world-leaders", label: "World Leaders", holds: "who governs, and the royal houses" },
  { to: "/dashboard/policy", label: "Policy", holds: "what governments spend, by area" },
  { to: "/dashboard/rankings", label: "Compare", holds: "places side by side" },
  { to: "/dashboard/trends", label: "Developments", holds: "what is changing, field by field" },
  { to: "/dashboard/worldview", label: "Worldview", holds: "the world as a whole" },
  { to: "/dashboard/planetary-boundaries", label: "Climate", holds: "the climate and the living world" },
  { to: "/dashboard/crime", label: "Crime Statistics", holds: "crime and justice" },
  { to: "/dashboard/maps", label: "World Maps", holds: "the maps" },
];

/** The page a path is on: the longest of the pages' paths that it begins with. */
export function sectionOf(pathname: string) {
  return [...SITE_SECTIONS].sort((a, b) => b.to.length - a.to.length).find((s) => pathname === s.to || pathname.startsWith(`${s.to}/`)) ?? null;
}

/** What kind of place a followed id is, from the id's own form. */
export function followedKind(id: string): NoteKind {
  return /^(division|county|district|place):/.test(id) ? "Municipality" : "City";
}
/** Where a followed place opens, where its id alone says: a town's needs its country too, which the star keeps with its name. */
export function followedLink(id: string): string | null {
  if (id.startsWith("division:")) return `/dashboard/subnations?open=${encodeURIComponent(id.slice(9))}`;
  if (id.startsWith("county:") || id.startsWith("district:")) return `/dashboard/subnations?open=${encodeURIComponent(id)}`;
  if (id.startsWith("place:")) return null;
  return `/dashboard/cities?open=${encodeURIComponent(id)}`;
}
/** What a followed place is called where its name was not kept: the kind its id shows. */
export function followedFallback(id: string): string {
  return id.startsWith("division:") ? "A division" : id.startsWith("county:") ? "A county" : id.startsWith("district:") ? "A district" : id.startsWith("place:") ? "A town or village" : "A city";
}
