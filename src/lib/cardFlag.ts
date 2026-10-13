/**
 * What a card does when the flag behind it does not load.
 *
 * A division's own flag is asked of Wikimedia Commons at a width that fills
 * the card, so that it is sharp; the copy saved with the site is small, and
 * stretched across a card it is soft. If the larger image does not come, the
 * card draws the saved copy - named in the image's data-fallback - and if
 * that does not come either, or there is none, the flag is left out and the
 * card stands as it is without it.
 */
import type { SyntheticEvent } from "react";

export function flagFallback(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  const saved = img.dataset.fallback;
  if (saved) {
    // Asked for once: taken off before it is tried, so a saved copy that fails too does not ask again.
    delete img.dataset.fallback;
    img.src = saved;
  } else {
    img.style.display = "none";
  }
}
