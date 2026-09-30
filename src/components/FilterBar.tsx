import type { ReactNode } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { ChipRow } from "./ChipRow";

/**
 * A page's sticky search and filters, in the same shape as the section bar
 * (SectionNav): one row of chips (ChipRow) that scrolls sideways when it
 * runs out of room, with the search in the space to their right. On a phone
 * the search sits above the chips, where it has the width to be typed into.
 *
 * It replaced a two-row bar - a full-width search, then the chips folded
 * behind a "Filters" toggle - which took twice the height on every scroll.
 */
export function FilterBar({
  label,
  search,
  status,
  children,
  className = "",
}: {
  /** Names the bar for screen readers: "Country filters". */
  label: string;
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  /** A short count beside the search, on wide screens: "212 entities". */
  status?: ReactNode;
  /** The chips, dividers and selects. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`search-sticky sticky top-16 z-30 border border-border/60 rounded-2xl px-3 py-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {children && <ChipRow className="order-2 sm:order-1 sm:flex-1">{children}</ChipRow>}
        {status && <span className="order-3 hidden lg:block text-[10px] font-sans text-muted-foreground shrink-0 whitespace-nowrap">{status}</span>}
        {search && (
          <label className="order-1 sm:order-3 sm:ml-auto flex items-center gap-1.5 sm:w-56 lg:w-64 shrink-0 rounded-full border border-border px-3 py-1 transition-colors focus-within:border-foreground/40">
            <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
            <input
              type="text"
              aria-label={search.placeholder}
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[11px] font-medium font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search.value && (
              <button
                type="button"
                onClick={() => search.onChange("")}
                aria-label="Clear the search"
                className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
