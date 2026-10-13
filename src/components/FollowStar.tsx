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
 * On a card it is drawn inside the card, which is itself a button: there it
 * is a span that acts as a button, and a press on it stays its own - it does
 * not open the card. In a window it is a button among the window's others.
 */
import { Star } from "@phosphor-icons/react";
import { useFollowedCities } from "../lib/followedCities";

/** What a municipality is followed by: its GeoNames id, which no other place shares. */
export const placeFollowId = (geonameId: number | string) => `place:${geonameId}`;

export function FollowStar({ id, name, where = "card" }: { /** What the place is followed by: a city's id, or placeFollowId of a municipality's. */ id: string; name: string; where?: "card" | "window" }) {
  const follow = useFollowedCities();
  const on = follow.isFollowed(id);
  const label = on ? `Unfollow ${name}` : `Follow ${name}`;
  const title = on ? "Following · press to stop" : "Follow · saved in this browser";
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
