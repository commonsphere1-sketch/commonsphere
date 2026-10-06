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
 */
import { useSyncExternalStore } from "react";

const KEY = "cs-followed-cities";

function read(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? [...new Set(raw.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 40))].slice(0, 200) : [];
  } catch {
    return [];
  }
}

let ids: string[] = read();
const listeners = new Set<() => void>();
const tell = () => listeners.forEach((l) => l());

function write(next: string[]) {
  ids = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: the list lasts for this visit */
  }
  tell();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    ids = read();
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

/** The followed cities, whether one is followed, and a one-call follow / unfollow. */
export function useFollowedCities() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    ids: list,
    isFollowed: (id: string) => list.includes(id),
    toggle: (id: string) => write(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]),
  };
}
