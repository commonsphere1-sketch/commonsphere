/**
 * The star that follows a city or a municipality: on its card and in its
 * window, as a country's and a state's have it.
 *
 * A country or a state is followed through the watch list, which is the
 * account's when signed in. A city, a town or a village has no place there:
 * the watch list's table takes only countries and states. So the star keeps
 * the place in this browser (lib/followedCities.ts), for everyone, signed in
 * or not - and says so when it is pointed at.
 *
 * A place the watch list does take - a country, or a state of the United
 * States met as a division - is followed through it all the same: whoever
 * draws the star says whether it is on and what a press does, and the star is
 * then the very one its country's or its state's own card carries.
 *
 * On a card it is drawn inside the card, which is itself a button: there it
 * is a span that acts as a button, and a press on it stays its own - it does
 * not open the card. In a window it is a button among the window's others.
 */
import { Star } from "@phosphor-icons/react";
import { useFollowedCities } from "../lib/followedCities";

/** What a municipality is followed by: its GeoNames id, which no other place shares. */
export const placeFollowId = (geonameId: number | string) => `place:${geonameId}`;

export function FollowStar({
  id,
  name,
  where = "card",
  watched,
  to,
}: {
  /** What the place is followed by: a city's id, placeFollowId of a municipality's, or a division's, a county's or a district's own. */
  id: string;
  name: string;
  where?: "card" | "window";
  /** The path its window opens at, where its id alone does not say - a town's needs its country. Kept with its name when it is followed. */
  to?: string;
  /** For a place the watch list takes: whether it is followed there, and what a press does. Given, the star is the watch list's and not this browser's. */
  watched?: { on: boolean; toggle: () => void };
}) {
  const local = useFollowedCities();
  // Followed in this browser, its name and where it opens are kept with it.
  const follow = watched ? { isFollowed: () => watched.on, toggle: () => watched.toggle() } : { isFollowed: local.isFollowed, toggle: (x: string) => local.toggle(x, { name, to }) };
  const on = follow.isFollowed(id);
  const label = on ? `Unfollow ${name}` : `Follow ${name}`;
  const title = on ? "Following · press to stop" : watched ? "Follow" : "Follow · saved in this browser";
  if (where === "window")
    return (
      <button onClick={() => follow.toggle(id)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-pressed={on} aria-label={label} title={title}>
        <Star size={18} weight={on ? "fill" : "regular"} className={on ? "text-amber-500" : undefined} />
      </button>
    );
  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={label}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        follow.toggle(id);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        follow.toggle(id);
      }}
      // The card's own press must not follow from a key let go over the star.
      onKeyUp={(e) => (e.key === "Enter" || e.key === " ") && e.preventDefault()}
      className="relative shrink-0 p-1.5 rounded-full bg-background/60 hover:bg-background/90 transition-colors cursor-pointer"
    >
      <Star size={16} weight={on ? "fill" : "regular"} className={on ? "text-amber-500" : "text-foreground/70"} />
    </span>
  );
}
