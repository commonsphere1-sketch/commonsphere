/**
 * A place for an advertising banner, as asked, ready for when the site carries ads. It shows nothing until ads are
 * switched on - VITE_ADS_ENABLED=true in the environment (see .env.example) - so the site never shows an empty box.
 *
 * Switched on, it is a labelled frame at the standard banner sizes - 320 by 100 on a phone, 728 by 90 (the leaderboard)
 * wider - with an element of its own (id "ad-<slot>", data-ad-slot "<slot>") for an ad network's script to fill.
 */
const ADS_ON = import.meta.env.VITE_ADS_ENABLED === "true";

export function AdSlot({ slot, className = "" }: { /** The slot's name, unique on the site: "dashboard-about". */ slot: string; className?: string }) {
  if (!ADS_ON) return null;
  return (
    <aside aria-label="Advertisement" className={`w-full flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Advertisement</span>
      <div id={`ad-${slot}`} data-ad-slot={slot} className="w-full max-w-[320px] h-[100px] md:max-w-[728px] md:h-[90px] rounded-lg border border-dashed border-border" />
    </aside>
  );
}
