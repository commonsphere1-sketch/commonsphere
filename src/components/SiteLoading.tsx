/**
 * What the site shows while a page or a panel is being fetched, as asked, in the site's own manner rather than a bare
 * "Loading…": its globe, breathing, with a circular track round it and an arc running along it, as asked - a page's
 * larger, in the middle of the screen; and what is being fetched, in the small mono capitals its charts are titled in.
 * In the foreground's own ink, so it suits both themes; a reader who asks for less motion gets the same, still.
 */
import { SiteMark } from "./SiteMark";

export function SiteLoading({ label = "Loading", size = "panel", className = "" }: { /** What is being fetched, said under the globe. */ label?: string; /** A whole page, or a panel in a window. */ size?: "page" | "panel"; className?: string }) {
  const page = size === "page";
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-4 text-center ${page ? "min-h-[100dvh]" : "py-8"} ${className}`}>
      {/* The globe, inside a ring: a faint track all the way round, and an arc of it going round and round. */}
      <span className={`relative grid place-items-center text-foreground ${page ? "w-28 h-28" : "w-14 h-14"}`}>
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 w-full h-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={page ? 3 : 4} />
          <circle
            className="site-loading-arc"
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.75}
            strokeWidth={page ? 3 : 4}
            strokeLinecap="round"
            // A quarter of the way round (the ring is 2π·46 ≈ 289 long).
            strokeDasharray="72 217"
          />
        </svg>
        <SiteMark className={`site-loading-mark ${page ? "!w-16 !h-16" : "!w-8 !h-8"}`} />
      </span>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground leading-snug max-w-xs">{label}</p>
    </div>
  );
}
