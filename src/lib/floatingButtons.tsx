/**
 * The two round buttons at the edge of every page - the calendar's at the top right, the notes' at the bottom right - each
 * shown unless the reader takes it off, as asked: with the × that shows on the button when it is pointed at, or with its
 * switch in Settings, which brings it back. Kept in this browser; every button and switch hears a change at once.
 *
 * Taking the notes button off does not take notes away: a note can still be opened from a place's window, a comparison or
 * My Notes, and the popup opens where the button stood.
 */
import { useSyncExternalStore } from "react";
import { X } from "@phosphor-icons/react";

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

/** The small × on a round button, shown when the button is pointed at or reached by the keyboard: it takes the button off. */
export function HideFab({ what, onHide }: { what: string; onHide: () => void }) {
  return (
    <button
      type="button"
      onClick={onHide}
      aria-label={`Hide the ${what} button - Settings brings it back`}
      title={`Hide the ${what} button - Settings brings it back`}
      className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
    >
      <X size={8} weight="bold" aria-hidden />
    </button>
  );
}
