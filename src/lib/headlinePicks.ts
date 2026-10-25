import { placeName, placeTag, type Headline, type Shown } from "@/components/HeadlinesBanner";

/**
 * Which headlines a banner shows, where more than one page shows the same banner: the Worldview page's world banner is
 * also the News page's.
 */

/**
 * The world desks' latest headlines naming a country other than the United
 * States. A US-only story is domestic news - it has its own banner on the
 * States page - and a world banner of them was obituaries and state
 * politics. The chip names the countries. The newest thirty, or all of them.
 */
export const pickWorld = (rows: Headline[], all = false): Shown[] =>
  rows
    .filter((h) => h.places.some((p) => p !== "c:US" && p.startsWith("c:") && placeName(p)))
    .slice(0, all ? undefined : 30)
    .map((h) => ({ h, tag: placeTag(h.places.filter((p) => p.startsWith("c:"))) }));
