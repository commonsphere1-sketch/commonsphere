import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

const STORAGE_KEY = "cs-filters-open";

/**
 * Wraps a page's filter pills in a collapsible section.
 *
 * The filter rows run to two lines on narrower screens and sit inside a
 * sticky bar, so they cost the same vertical space on every scroll. Being
 * able to fold them away buys that space back.
 *
 * The choice is stored rather than held per page: these bars are the same
 * control on eight pages, so collapsing one collapses them all, and the
 * preference survives a reload.
 */
export function CollapsibleFilters({
  children,
  label = "Filters",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  // Read on the first render rather than in an effect: applying the stored
  // value afterwards renders the filters open for a frame, so a collapsed bar
  // visibly flashes its pills on every page load. Defaults to open, so nobody
  // who has not chosen to hide them ever finds them hidden.
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "closed";
    } catch {
      return true; // storage blocked
    }
  });

  const toggle = () =>
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
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
