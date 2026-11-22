/**
 * The two round buttons at the edge of every page - the calendar's at the top right, the notes' at the bottom right - each
 * shown unless the reader takes it off, as asked: with its switch in Settings, which brings it back too. Only there - the
 * buttons themselves carry no × (they did, and it was taken off, as asked). Kept in this browser; every button and switch
 * hears a change at once.
 *
 * Taking the notes button off does not take notes away: a note can still be opened from a place's window, a comparison or
 * My Notes, and the popup opens where the button stood.
 */
import { useSyncExternalStore } from "react";

export type FloatingButton = "calendar" | "notes";

const key = (b: FloatingButton) => `cs-hide-${b}-button`;
const EVENT = "cs-floating-buttons";

const subscribe = (on: () => void) => {
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
};

/** Whether the button is shown, and the switch. */
export function useFloatingButton(b: FloatingButton): [boolean, (shown: boolean) => void] {
  const shown = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key(b)) !== "1";
      } catch {
        return true;
      }
    },
    () => true,
  );
  const set = (v: boolean) => {
    try {
      if (v) localStorage.removeItem(key(b));
      else localStorage.setItem(key(b), "1");
    } catch {
      // A browser that keeps nothing: the choice holds for this page only.
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [shown, set];
}
