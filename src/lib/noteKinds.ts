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
 *
 * "Comparison" is a note about places set side by side, as asked: taken from
 * the Compare page or the Dashboard's Compare card, it names the places and
 * keeps a link that opens the same comparison again (comparisonNote).
 */
export const NOTE_KINDS = ["Country", "State", "Municipality", "City", "Economy", "Leader", "Policy", "Comparison", "Page"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

/** A note's name holds at most this many characters, as the notes table allows. */
const NAME_MAX = 120;
/** How the places of a comparison are set apart in its note's name. */
export const COMPARISON_JOIN = " · ";

/**
 * What a note about a comparison is opened with: the places by name, and a link to the Compare page with the same places
 * pinned (its ids as the page's ?compare= has them) and, for the systems of government, that view. Names that would not fit
 * the name's 120 characters are counted instead ("and 2 more").
 */
export function comparisonNote(names: string[], ids: string[], view: "figures" | "systems" = "figures") {
  let entityName = names.join(COMPARISON_JOIN);
  for (let n = names.length - 1; entityName.length > NAME_MAX && n > 0; n--) entityName = `${names.slice(0, n).join(COMPARISON_JOIN)}${COMPARISON_JOIN}and ${names.length - n} more`;
  const url = new URL("/dashboard/rankings", window.location.origin);
  url.searchParams.set("compare", ids.join(","));
  if (view === "systems") url.searchParams.set("compareView", "systems");
  return { entityName: entityName.slice(0, NAME_MAX), entityType: "Comparison" as NoteKind, links: [url.toString()] };
}

/** The place a link on this site opens - its path and query - or null for a link elsewhere. */
export function sitePath(link: string): string | null {
  try {
    const u = new URL(link);
    return u.origin === window.location.origin ? `${u.pathname}${u.search}` : null;
  } catch {
    return null;
  }
}

/** The pages of the site a note can be about, in the sidebar's order. */
/* Each page as the side menu names it; a page renamed keeps its old name in `was`, so the notes taken under it still count. */
export const SITE_SECTIONS: { to: string; label: string; holds: string; was?: string[] }[] = [
  { to: "/dashboard", label: "Dashboard", holds: "the world at a glance" },
  { to: "/dashboard/states", label: "US States", holds: "the fifty states" },
  { to: "/dashboard/countries", label: "Countries", holds: "every country" },
  { to: "/dashboard/subnations", label: "Municipalities", holds: "states, provinces, counties, towns" },
  { to: "/dashboard/cities", label: "Cities", holds: "the world's cities" },
  { to: "/dashboard/economies", label: "Economies", holds: "output, tax, inflation, resources" },
  { to: "/dashboard/world-leaders", label: "World Leaders", holds: "who governs, and the royal houses" },
  { to: "/dashboard/policy", label: "Policy", holds: "what governments spend, by area" },
  { to: "/dashboard/rankings", label: "Compare", holds: "places side by side" },
  { to: "/dashboard/worldview", label: "Worldview", holds: "the world as a whole" },
  { to: "/dashboard/maps", label: "World Maps", holds: "the maps" },
  { to: "/dashboard/news", label: "News", holds: "every headline, and each country's history" },
];

/** The page a path is on: the longest of the pages' paths that it begins with. */
export function sectionOf(pathname: string) {
  return [...SITE_SECTIONS].sort((a, b) => b.to.length - a.to.length).find((s) => pathname === s.to || pathname.startsWith(`${s.to}/`)) ?? null;
}

/** What kind of place a followed id is, from the id's own form. */
export function followedKind(id: string): NoteKind {
  if (id.startsWith("leader:")) return "Leader";
  if (id.startsWith("economy:")) return "Economy";
  return /^(division|county|district|place):/.test(id) ? "Municipality" : "City";
}
/** Where a followed place opens, where its id alone says: a town's needs its country too, which the star keeps with its name. */
export function followedLink(id: string): string | null {
  if (id.startsWith("leader:")) return `/dashboard/world-leaders?open=${encodeURIComponent(id.slice(7))}`;
  if (id.startsWith("economy:")) return `/dashboard/economies?open=${encodeURIComponent(id.slice(8))}`;
  if (id.startsWith("division:")) return `/dashboard/subnations?open=${encodeURIComponent(id.slice(9))}`;
  if (id.startsWith("county:") || id.startsWith("district:")) return `/dashboard/subnations?open=${encodeURIComponent(id)}`;
  if (id.startsWith("place:")) return null;
  return `/dashboard/cities?open=${encodeURIComponent(id)}`;
}
/** What a followed place is called where its name was not kept: the kind its id shows. */
export function followedFallback(id: string): string {
  return id.startsWith("leader:") ? "A leader" : id.startsWith("economy:") ? "An economy" : id.startsWith("division:") ? "A division" : id.startsWith("county:") ? "A county" : id.startsWith("district:") ? "A district" : id.startsWith("place:") ? "A town or village" : "A city";
}
