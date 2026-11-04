/**
 * What the site shows while a page or a panel is being fetched, as asked, in the site's own manner rather than a bare
 * "Loading…": its globe, breathing; what is being fetched, in the small mono capitals its charts are titled in; and the
 * site's slim track with a gradient running along it, as its bars are drawn. A reader who asks for less motion gets the
 * same, still.
 */
import { SiteMark } from "./SiteMark";

export function SiteLoading({ label = "Loading", size = "panel", className = "" }: { /** What is being fetched, said under the globe. */ label?: string; /** A whole page, or a panel in a window. */ size?: "page" | "panel"; className?: string }) {
  const page = size === "page";
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 text-center ${page ? "min-h-[40vh]" : "py-8"} ${className}`}>
      <SiteMark className={`site-loading-mark ${page ? "" : "!w-7 !h-7"}`} />
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground leading-snug max-w-xs">{label}</p>
      <span aria-hidden className={`site-loading-track relative block h-1.5 rounded-full overflow-hidden text-foreground ${page ? "w-40" : "w-28"}`} style={{ background: "color-mix(in srgb, currentColor 7%, transparent)" }}>
        <span className="site-loading-run absolute inset-y-0 left-0 w-2/5 rounded-full" />
      </span>
    </div>
  );
}
