/**
 * upcomingToWatch.ts
 *
 * Backs the "Upcoming to Watch" strip on the economies, cities and states
 * pages. Previously each page carried its own hardcoded JSX array, so the
 * lists went stale silently — an item stayed on the page forever, even
 * years after the event it pointed at had happened.
 *
 * Each entry now carries a `until` date. `getUpcoming()` drops anything
 * whose window has closed and sorts what is left soonest-first, so the
 * strip keeps itself current with no code change. Adding a new item is a
 * single line here rather than an edit in three files.
 *
 * NOTE: these are curated editorial forecasts, not fetched data. Nothing
 * here can invent genuinely new entries on its own — that would need a
 * news/events feed to be chosen and keyed. What is automatic is that the
 * list never shows something whose date has passed.
 */

export type UpcomingScope = "economies" | "cities" | "states";

export type UpcomingTone =
  | "orange"
  | "purple"
  | "red"
  | "green"
  | "amber"
  | "yellow"
  | "secondary";

export interface UpcomingItem {
  /** Stable key — also lets an item be referenced without matching on prose. */
  id: string;
  scope: UpcomingScope;
  label: string;
  /**
   * ISO date (YYYY-MM-DD) after which the item stops being "upcoming".
   * Use the end of the stated window: "Q4 2026" -> 2026-12-31.
   */
  until: string;
  tone: UpcomingTone;
}

const TONE_CLASS: Record<UpcomingTone, string> = {
  orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  red: "text-red-400 border-red-500/30 bg-red-500/10",
  green: "text-green-400 border-green-500/30 bg-green-500/10",
  amber: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  secondary: "text-secondary border-secondary/30 bg-secondary/10",
};

export const UPCOMING_ITEMS: UpcomingItem[] = [
  // ── Economies ──
  {
    id: "eco-india-3rd",
    scope: "economies",
    label: "India overtaking Japan as 3rd largest economy · ~2027",
    until: "2027-12-31",
    tone: "orange",
  },
  {
    id: "eco-fed-pivot",
    scope: "economies",
    label: "Fed pivot probability rising · Sep 2026 FOMC meeting",
    until: "2026-09-30",
    tone: "purple",
  },
  {
    id: "eco-brics-currency",
    scope: "economies",
    label: "BRICS common currency proposal — summit Oct 2026",
    until: "2026-10-31",
    tone: "red",
  },
  {
    id: "eco-eu-cbam",
    scope: "economies",
    label: "EU Carbon Border Adjustment — full enforcement 2026",
    until: "2026-12-31",
    tone: "green",
  },
  {
    id: "eco-argentina",
    scope: "economies",
    label: "Argentina economic stabilization · Milei Year 3 review",
    until: "2026-12-31",
    tone: "amber",
  },
  {
    id: "eco-aramco",
    scope: "economies",
    label: "Saudi Aramco dividend policy revision · Q4 2026",
    until: "2026-12-31",
    tone: "yellow",
  },

  // ── Cities ──
  {
    id: "cit-riyadh-tower",
    scope: "cities",
    label: "Riyadh skyscraper boom — world's tallest by 2030",
    until: "2030-12-31",
    tone: "amber",
  },
  {
    id: "cit-nyc-congestion",
    scope: "cities",
    label: "NYC congestion pricing impact on commute data · 2026",
    until: "2026-12-31",
    tone: "secondary",
  },
  {
    id: "cit-changi-t5",
    scope: "cities",
    label: "Singapore Changi T5 opening — aviation hub status",
    until: "2030-12-31",
    tone: "purple",
  },
  {
    id: "cit-lagos-digital",
    scope: "cities",
    label: "Lagos digital economy: Africa's Silicon Lagoon scaling",
    until: "2027-12-31",
    tone: "green",
  },
  {
    id: "cit-dubai-15min",
    scope: "cities",
    label: "Dubai 15-minute city policy rollout · 2026–2030",
    until: "2030-12-31",
    tone: "orange",
  },

  // ── States ──
  {
    id: "st-texas-ev",
    scope: "states",
    label: "Texas EV manufacturing boom — 2026 Tesla & Toyota expansions",
    until: "2026-12-31",
    tone: "amber",
  },
  {
    id: "st-ca-budget",
    scope: "states",
    label: "California budget gap $45B — fiscal reckoning 2026",
    until: "2026-12-31",
    tone: "red",
  },
  {
    id: "st-fl-gambling",
    scope: "states",
    label: "Florida gambling expansion ballot · Nov 2026",
    until: "2026-11-30",
    tone: "purple",
  },
  {
    id: "st-ny-congestion",
    scope: "states",
    label: "NY congestion pricing impact data · mid-2026",
    until: "2026-07-31",
    tone: "secondary",
  },
  {
    id: "st-ai-jobs",
    scope: "states",
    label: "AI job market shift hitting tech states — 2026 BLS report",
    until: "2026-12-31",
    tone: "green",
  },
];

export interface ResolvedUpcoming {
  id: string;
  label: string;
  className: string;
  until: string;
}

/**
 * Items for a page that are still ahead of `now`, soonest first.
 *
 * @param scope which page is asking
 * @param now   injectable so this is testable and so a long-lived tab can
 *              re-evaluate against the current date rather than load time
 * @param limit maximum chips to show
 */
export function getUpcoming(
  scope: UpcomingScope,
  now: Date = new Date(),
  limit = 8,
): ResolvedUpcoming[] {
  // Compare date-only, so an item stays visible for the whole of its last day.
  const today = now.toISOString().slice(0, 10);
  return UPCOMING_ITEMS.filter((i) => i.scope === scope && i.until >= today)
    .sort((a, b) => a.until.localeCompare(b.until))
    .slice(0, limit)
    .map((i) => ({
      id: i.id,
      label: i.label,
      className: TONE_CLASS[i.tone],
      until: i.until,
    }));
}
