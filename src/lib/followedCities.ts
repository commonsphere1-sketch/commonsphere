/**
 * The cities a reader follows: the star on a city's card and in its window.
 *
 * Countries and states are followed through the watch list
 * (contexts/WatchlistContext), which is the account's when signed in and
 * alerts on figures that change. A city has no place there yet: the watch
 * list's table accepts only countries and states, and a city's figures - the
 * UN's - change only when the site's data is rebuilt, so there is nothing to
 * alert on. Until the table is widened, a followed city is kept in this
 * browser, for everyone, signed in or not, and the star says so.
 *
 * One list for the whole app: every star reads it and is told when it
 * changes, in this tab or another.
 *
 * Beside the list is each place's name and where it opens, kept when it is
 * followed: an id alone does not say what a town is called, and the Notes
 * page and the note popup list the followed places by name. A place followed
 * before names were kept has none, and is listed by its kind.
 */
import { useSyncExternalStore } from "react";

const KEY = "cs-followed-cities";

function read(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? [...new Set(raw.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 120))].slice(0, 200) : [];
  } catch {
    return [];
  }
}

const NAMES = "cs-followed-names";
/** What is kept of a followed place beside its id: its name, and the path its window opens at. */
export type FollowedAbout = { name: string; to?: string };
function readNames(): Record<string, FollowedAbout> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(NAMES) ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, FollowedAbout> = {};
    for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
      const a = v as { name?: unknown; to?: unknown };
      // Only a name of a sane length, and a path of the site's own, are read back.
      if (a && typeof a.name === "string" && a.name.length > 0 && a.name.length <= 160) out[id] = { name: a.name, ...(typeof a.to === "string" && /^\/dashboard\//.test(a.to) && a.to.length <= 240 ? { to: a.to } : {}) };
    }
    return out;
  } catch {
    return {};
  }
}
let names: Record<string, FollowedAbout> = readNames();

let ids: string[] = read();
const listeners = new Set<() => void>();
const tell = () => listeners.forEach((l) => l());

function write(next: string[], about?: [id: string, about: FollowedAbout]) {
  ids = next;
  // The names follow the list: one is kept when its place is followed, and dropped when it is not.
  names = Object.fromEntries(Object.entries({ ...names, ...(about ? { [about[0]]: about[1] } : {}) }).filter(([id]) => next.includes(id)));
  try {
    localStorage.setItem(NAMES, JSON.stringify(names));
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: the list lasts for this visit */
  }
  tell();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY && e.key !== NAMES) return;
    ids = read();
    names = readNames();
    tell();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const snapshot = () => ids;

/** The followed places as they stand now, each with what is kept of it: for what reads the list once, outside a component's render. */
export const followedNow = (): { id: string; about?: FollowedAbout }[] => ids.map((id) => ({ id, about: names[id] }));

/** The followed cities, whether one is followed, and a one-call follow / unfollow. */
export function useFollowedCities() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    ids: list,
    isFollowed: (id: string) => list.includes(id),
    /** Follows or unfollows a place. Its name, and where it opens, are kept with it when it is followed. */
    toggle: (id: string, about?: FollowedAbout) => (list.includes(id) ? write(list.filter((x) => x !== id)) : write([...list, id], about ? [id, about] : undefined)),
    /** What is kept of a followed place: undefined where it was followed before names were kept. */
    about: (id: string): FollowedAbout | undefined => names[id],
  };
}
