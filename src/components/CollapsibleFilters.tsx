import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

const STORAGE_PREFIX = "cs-filters-open:";

/**
 * Wraps a page's filter pills in a collapsible section.
 *
 * The filter rows run to two lines on narrower screens and sit inside a
 * sticky bar, so they cost the same vertical space on every scroll. Being
 * able to fold them away buys that space back.
 *
 * The choice is stored per page, under the page's own `id`, and survives a
 * reload. It used to be one key for all of them, so folding the filters away
 * on one page folded them on the other six - these bars look alike but they
 * hold different controls, and a reader who hides the economy filters has said
 * nothing about the ones on the countries page.
 *
 * `id` is required rather than defaulted for that reason: a new page that
 * forgot to pass one would silently share another page's setting.
 */
export function CollapsibleFilters({
  id,
  children,
  label = "Filters",
}: {
  /** Unique per page. Names the stored preference; never shown. */
  id: string;
  children: React.ReactNode;
  label?: string;
}) {
  // Read on the first render rather than in an effect: applying the stored
  // value afterwards renders the filters open for a frame, so a collapsed bar
  // visibly flashes its pills on every page load. Defaults to open, so nobody
  // who has not chosen to hide them ever finds them hidden.
  const storageKey = STORAGE_PREFIX + id;

  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== "closed";
    } catch {
      return true; // storage blocked
    }
  });

  const toggle = () =>
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "open" : "closed");
      } catch {
        // the choice still applies for this session
      }
      return next;
    });

  return (
    <div className="pt-2 mt-1 border-t border-border/60">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center gap-1.5 px-1 py-0.5 -ml-1 rounded text-[11px] font-medium font-sans text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <CaretDown
          size={11}
          weight="bold"
          className={`transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
        {label}
      </button>
      {open && (
        <div className="flex flex-wrap items-center gap-2 mt-2">{children}</div>
      )}
    </div>
  );
}
