/**
 * Election season, as asked: one switch, in Settings and on the results bar itself, that shows the 2026 midterm counts
 * across the site - the bar at the head of every page and the layer on the map. Kept in this browser; on until the reader
 * turns it off. Every place that reads it hears a change at once.
 */
import { useSyncExternalStore } from "react";

const KEY = "cs-election-season";
const EVENT = "cs-election-season";

const read = () => {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
};
const subscribe = (on: () => void) => {
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
};

/** Whether the midterm counts are shown across the site, and the switch. */
export function useElectionSeason(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => true);
  const set = (v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      // A browser that keeps nothing: the switch holds for this page only.
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, set];
}
