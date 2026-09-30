import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pause, Play, Star } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { TONE } from "@/lib/chipTone";
import { countriesData } from "@/data/countriesData";
import { usStatesData } from "@/data/statesData";
import { useWatchlist } from "@/contexts/WatchlistContext";

/**
 * A page's news as a moving banner: the latest headlines from the desks of
 * established outlets that cover the page's subject, newest first. The
 * refresh-data Edge Function's news job reads the outlets' public feeds
 * every half hour and tags each headline with the places it names and the
 * pages its desk serves (supabase/functions/refresh-data/news.ts); only the
 * headline, link, outlet and time are kept, and each item links to the
 * outlet.
 *
 * The banner stops under the pointer or keyboard focus and has a pause
 * button; with reduced motion it stands still and scrolls by hand. When its
 * headlines fit the width it stands still anyway, rather than loop round a
 * gap. Without the news store, or with nothing to show, it is left out.
 */

/** The pages a desk serves, as news.ts tags them. */
export type Topic = "world" | "us" | "economy" | "policy" | "humanitarian" | "climate" | "crime";
/** Every desk, for a banner that draws on all of them. */
export const ALL_TOPICS: Topic[] = ["world", "us", "economy", "policy", "humanitarian", "climate", "crime"];
/** `viaSubject` marks a headline from another desk, taken because its words are about the page's subject. */
export type Headline = { url: string; title: string; outlet: string; published_at: string; places: string[]; viaSubject?: boolean };

/**
 * The words that make a headline about a page's subject, for topping up a
 * banner whose own desks are quiet. Whole words, any case; the ambiguous are
 * left out ("relief" is also tax relief, "shares" also a verb).
 */
export const SUBJECT = {
  humanitarian:
    /\b(humanitarian|refugees?|asylum|displaced|displacement|famine|starvation|hunger|malnutrition|aid (workers?|convoys?|agencies)|food aid|evacuat(e|ed|ion|ions)|cholera|UNHCR|UNICEF|WFP|OCHA|Red Cross|Red Crescent|MSF|civilians?)\b/i,
  economy:
    /\b(econom(y|ic|ies|ists?)|inflation|recession|GDP|tariffs?|trade (war|deal|talks|deficit|surplus)|stock markets?|stocks|central bank|interest rates?|Federal Reserve|ECB|budget|debt|unemployment|jobs report|wages?|oil prices?|currency|exports?|imports?|investment|bonds?|markets)\b/i,
  climate:
    /\b(climate|emissions?|carbon|CO2|greenhouse|heatwaves?|heat wave|wildfires?|bushfires?|droughts?|floods?|flooding|glaciers?|sea[- ]level|global warming|renewables?|solar (power|energy|farms?)|wind (power|farms?|energy)|fossil fuels?|coal|net[- ]zero|COP\d+|El Niño|La Niña|hurricanes?|typhoons?|cyclones?)\b/i,
} as const;
export type HeadlineTag = { text: string; tone: string };
/** A headline as the banner shows it; `star` marks one about a place the reader follows. */
export type Shown = { h: Headline; tag: HeadlineTag | null; star?: boolean };

const COUNTRY_NAME = new Map(countriesData.map((c) => [`c:${c.code}`, c.name]));
const STATE_NAME = new Map(usStatesData.map((s) => [`s:${s.id}`, s.name]));
/** "c:JP" is Japan, "s:tx" is Texas. */
export const placeName = (p: string): string | null => COUNTRY_NAME.get(p) ?? STATE_NAME.get(p) ?? null;

/** A chip naming places: blue for one, violet for more than one (a story about their relations). */
export function namesTag(names: string[]): HeadlineTag | null {
  if (!names.length) return null;
  const text = names.length > 2 ? `${names.slice(0, 2).join(" · ")} +${names.length - 2}` : names.join(" · ");
  return { text, tone: names.length > 1 ? TONE.violet : TONE.blue };
}

/** The places a headline names or its desk covers; no chip when it names none. */
export const placeTag = (places: string[]): HeadlineTag | null =>
  namesTag(places.map(placeName).filter((n): n is string => !!n));

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** "BBC News, DW and The Guardian": the outlets in the banner, the most-shown first. */
function outletList(shown: Shown[], max = 5): string {
  const count = new Map<string, number>();
  for (const { h } of shown) count.set(h.outlet, (count.get(h.outlet) ?? 0) + 1);
  const names = [...count.keys()].sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0) || a.localeCompare(b));
  const others = names.length - max;
  if (others > 0) return `${names.slice(0, max).join(", ")} and ${others} other outlet${others === 1 ? "" : "s"}`;
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}

/** Headlines read per query, kept ten minutes, so moving between pages does not refetch. */
const cache = new Map<string, { at: number; rows: Headline[] }>();

/** Fewer than this from a page's own desks, and a banner with a subject tops itself up. */
const TOP_UP_BELOW = 12;

function useHeadlines(topics: Topic[], days: number, read: number, untagged: boolean, subject?: RegExp): Headline[] {
  const key = `${topics.join(",")}|${days}|${read}|${untagged}|${subject?.source ?? ""}`;
  const [rows, setRows] = useState<Headline[]>(() => cache.get(key)?.rows ?? []);
  useEffect(() => {
    const db = supabase;
    const hit = cache.get(key);
    if (!db || (hit && Date.now() - hit.at < 10 * 60_000)) return;
    let live = true;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const query = (byTopic: boolean, limit = read) => {
      let q = db.from("news_items").select("url, title, outlet, published_at, places").gte("published_at", since);
      if (byTopic) q = untagged ? q.or(`topics.ov.{${topics.join(",")}},topics.eq.{}`) : q.overlaps("topics", topics);
      return q.order("published_at", { ascending: false }).limit(limit);
    };
    (async () => {
      let { data, error } = await query(true);
      // A store from before headlines carried topics holds only the world and US desks' headlines.
      if (error && untagged) ({ data, error } = await query(false));
      let found: Headline[] = error || !data ? [] : (data as Headline[]);
      // Too few from the page's own desks - they are quiet, or not read yet:
      // headlines from any desk whose words are about the subject fill in.
      if (subject && found.length < TOP_UP_BELOW) {
        const { data: more } = await query(false, 300);
        const have = new Set(found.map((r) => r.url));
        const extra = ((more ?? []) as Headline[])
          .filter((r) => !have.has(r.url) && typeof r.title === "string" && subject.test(r.title))
          .map((r) => ({ ...r, viaSubject: true }));
        found = [...found, ...extra].sort((a, b) => b.published_at.localeCompare(a.published_at));
      }
      if (!found.length && (error || !data)) return;
      // A wire story runs under the same headline at several outlets: the newest copy is enough.
      const titles = new Set<string>();
      const clean = found.filter((r): r is Headline => {
        if (typeof r.title !== "string" || !/^https:\/\//.test(r.url) || !Array.isArray(r.places)) return false;
        const t = r.title.toLowerCase().replace(/\s+/g, " ").trim();
        if (titles.has(t)) return false;
        titles.add(t);
        return true;
      });
      cache.set(key, { at: Date.now(), rows: clean });
      if (live) setRows(clean);
    })();
    return () => {
      live = false;
    };
    // The key spells out topics, days, read, untagged and subject.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return rows;
}

/** The newest thirty, at most `each` from one outlet, so the busiest desks do not fill the banner. */
export function spread(rows: Headline[], each = 5, max = 30): Headline[] {
  const n = new Map<string, number>();
  const out: Headline[] = [];
  for (const h of rows) {
    const k = n.get(h.outlet) ?? 0;
    if (k >= each) continue;
    n.set(h.outlet, k + 1);
    out.push(h);
    if (out.length === max) break;
  }
  return out;
}

const newestSpread = (rows: Headline[]): Shown[] => spread(rows).map((h) => ({ h, tag: placeTag(h.places) }));

/** Names a country or US state the site knows. */
export const namesPlace = (h: Headline) => h.places.some((p) => placeName(p) !== null);
/** Names a country other than the United States - the US desks tag every story with the US. */
export const namesAbroad = (h: Headline) => h.places.some((p) => p.startsWith("c:") && p !== "c:US" && placeName(p) !== null);
/** Names two places or more: a story about their relations. */
export const namesTwo = (h: Headline) => h.places.filter((p) => placeName(p) !== null).length >= 2;

/** The newest thirty that pass `keep`, five at most from one outlet, tagged with their places. */
export const pickWhere =
  (keep: (h: Headline) => boolean) =>
  (rows: Headline[]): Shown[] =>
    spread(rows.filter(keep)).map((h) => ({ h, tag: placeTag(h.places) }));

/** As pickWhere, with the headlines about a place the reader follows first, starred. */
export const followedFirst =
  (followed: Set<string>, keep: (h: Headline) => boolean) =>
  (rows: Headline[]): Shown[] => {
    const mine = (h: Headline) => h.places.some((p) => followed.has(p));
    return spread([...rows.filter(mine), ...rows.filter((h) => !mine(h) && keep(h))]).map((h) => ({
      h,
      tag: placeTag(h.places),
      star: mine(h),
    }));
  };

const CODE_OF = new Map(countriesData.map((c) => [c.id, c.code]));
/** The places the reader follows, as headlines tag them: "c:JP", "s:tx". */
export function useFollowedTags(): Set<string> {
  const { items } = useWatchlist();
  return useMemo(
    () => new Set(items.map((i) => (i.type === "state" ? `s:${i.id}` : `c:${CODE_OF.get(i.id) ?? i.id.toUpperCase()}`))),
    [items],
  );
}

export function HeadlinesBanner({
  label,
  topics,
  days,
  read = 80,
  untagged = false,
  pick = newestSpread,
  subject,
  note,
  className = "",
}: {
  /** The heading: "World headlines". */
  label: string;
  /** The desks to read, by the pages they serve. */
  topics: Topic[];
  /** How many days back to look. */
  days: number;
  /** How many of the newest to read before picking. */
  read?: number;
  /** Also headlines stored before desks were tagged with topics. */
  untagged?: boolean;
  /**
   * Which to show, with their chips: a module-level function, so it is not
   * rerun on every render. By default the newest, five at most from one
   * outlet, tagged with their places.
   */
  pick?: (rows: Headline[]) => Shown[];
  /** The page's subject (see SUBJECT), for topping up when its own desks give fewer than a dozen. */
  subject?: RegExp;
  /** The line under the banner, given the outlets it is showing. */
  note: (outlets: string) => ReactNode;
  className?: string;
}) {
  const rows = useHeadlines(topics, days, read, untagged, subject);
  const shown = useMemo(() => pick(rows), [pick, rows]);
  const toppedUp = shown.some((s) => s.h.viaSubject);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [duration, setDuration] = useState(120);
  const viewRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const view = viewRef.current;
    const copy = copyRef.current;
    if (!view || !copy) return;
    // A steady reading speed, whatever the length: about 40 px a second.
    const measure = () => {
      setDuration(Math.max(30, copy.scrollWidth / 40));
      setStill(copy.scrollWidth <= view.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    ro.observe(copy);
    return () => ro.disconnect();
  }, [shown.length]);
  if (!shown.length) return null;

  const renderItems = (copy: boolean): ReactNode =>
    shown.map(({ h, tag, star }) => (
      <a
        key={`${copy ? "b" : "a"}-${h.url}`}
        href={h.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${h.title} - ${h.outlet}`}
        tabIndex={copy ? -1 : undefined}
        className="group inline-flex items-center gap-2 shrink-0 whitespace-nowrap pr-6 text-xs font-sans text-foreground/90"
      >
        {star && <Star size={11} weight="fill" className="text-amber-500 shrink-0" aria-label="A place you follow" />}
        {tag && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tag.tone}`}>{tag.text}</span>}
        <span className="group-hover:underline">{h.title}</span>
        <span className="text-[10px] text-muted-foreground">
          {h.outlet} · {ago(h.published_at)}
        </span>
        <span aria-hidden className="text-muted-foreground/60 pl-4">
          •
        </span>
      </a>
    ));

  return (
    <section aria-label={label} className={`bg-card border border-border rounded-2xl p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{label}</p>
          {!still && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              aria-label={paused ? "Play the banner" : "Pause the banner"}
              title={paused ? "Play" : "Pause"}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              {paused ? <Play size={12} weight="fill" /> : <Pause size={12} weight="fill" />}
            </button>
          )}
        </div>
        <div ref={viewRef} className="cs-ticker-viewport flex-1 min-w-0 py-1" data-paused={paused} data-still={still}>
          <div className="cs-ticker-track flex w-max" style={{ ["--cs-ticker-duration" as string]: `${duration}s` }}>
            <div ref={copyRef} className="flex">
              {renderItems(false)}
            </div>
            {/* The second copy, for a seamless loop; hidden from screen readers. */}
            <div className="cs-ticker-copy flex" aria-hidden>
              {renderItems(true)}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-sans text-muted-foreground leading-snug">
        {note(outletList(shown))}
        {toppedUp && " These desks have been quiet, so headlines from other desks that are about the same subject fill in."}
      </p>
    </section>
  );
}
