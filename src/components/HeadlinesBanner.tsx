import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CaretDown, MagnifyingGlass, Pause, Play, Star, X } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { TONE } from "@/lib/chipTone";
import { BLUE_HUE } from "@/lib/blueHue";
import { countriesData } from "@/data/countriesData";
import { usStatesData } from "@/data/statesData";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { NEWS_SOURCES } from "@/data/newsSources";

/**
 * A page's news as a moving banner: the latest headlines from the desks of
 * established outlets that cover the page's subject, newest first. The
 * refresh-data Edge Function's news job reads the outlets' public feeds
 * every half hour and tags each headline with the places it names and the
 * pages its desk serves (supabase/functions/refresh-data/news.ts); only the
 * headline, link, outlet and time are kept, and each item links to the
 * outlet. "All … news sources" under it lists the outlets it reads, each
 * linking to the outlet's site.
 *
 * The banner carries the site's blue hue (lib/blueHue.ts) and opens: "All
 * headlines" shows, under the moving row, every headline that belongs to the
 * page in the banner's window - not only the thirty the row carries - by
 * day, newest first, with a filter. They are read when the list is opened.
 *
 * The banner stops under the pointer or keyboard focus and has a pause
 * button; with reduced motion it stands still and scrolls by hand. When its
 * headlines fit the width it stands still anyway, rather than loop round a
 * gap, and it stands still while its list is open. Without the news store,
 * or with nothing to show, it is left out.
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
    /\b(humanitarian|refugees?|asylum|displaced|displacement|famine|starvation|hunger|malnutrition|aid (workers?|convoys?|agencies)|food aid|evacuat(e|ed|ion|ions)|cholera|UNHCR|UNICEF|WFP|OCHA|Red Cross|Red Crescent|MSF|civilians?|human rights|rights (groups?|abuses?|violations?|defenders?)|war crimes?|crimes against humanity|genocide|torture|political prisoners?|death penalty)\b/i,
  economy:
    /\b(econom(y|ic|ies|ists?)|inflation|recession|GDP|tariffs?|trade (war|deal|talks|deficit|surplus)|stock markets?|stocks|central bank|interest rates?|Federal Reserve|ECB|budget|debt|unemployment|jobs report|wages?|oil prices?|currency|exports?|imports?|investment|bonds?|markets)\b/i,
  climate:
    /\b(climate|emissions?|carbon|CO2|greenhouse|heatwaves?|heat wave|wildfires?|bushfires?|droughts?|floods?|flooding|glaciers?|sea[- ]level|global warming|renewables?|solar (power|energy|farms?)|wind (power|farms?|energy)|fossil fuels?|coal|net[- ]zero|COP\d+|El Niño|La Niña|hurricanes?|typhoons?|cyclones?)\b/i,
} as const;
export type HeadlineTag = { text: string; tone: string };
/** A headline as the banner shows it; `star` marks one about a place the reader follows. */
export type Shown = { h: Headline; tag: HeadlineTag | null; star?: boolean };
/**
 * Which of the headlines read a banner shows, with their chips. Asked for
 * `all`, it gives every headline that belongs to the page, newest first,
 * with none of the caps that keep the moving row short and varied.
 */
export type HeadlinePick = (rows: Headline[], all?: boolean) => Shown[];

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

export function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** "BBC News, DW and The Guardian": the outlets of these headlines, the most frequent first. */
export function outletList(rows: { outlet: string }[], max = 5): string {
  const count = new Map<string, number>();
  for (const { outlet } of rows) count.set(outlet, (count.get(outlet) ?? 0) + 1);
  const names = [...count.keys()].sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0) || a.localeCompare(b));
  const others = names.length - max;
  if (others > 0) return `${names.slice(0, max).join(", ")} and ${others} other outlet${others === 1 ? "" : "s"}`;
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}

/** Headlines read per query, kept ten minutes, so moving between pages does not refetch. */
const cache = new Map<string, { at: number; rows: Headline[]; capped: boolean }>();

/** The most one request to the news store carries. */
const PAGE = 1000;

/** Fewer than this from a page's own desks, and a banner with a subject tops itself up. */
const TOP_UP_BELOW = 12;

/**
 * The most headlines read for a banner's full list: three requests' worth,
 * which is more than any page's window holds today. A list that reaches it
 * says so, and how far back it goes, since older headlines of the window
 * are then left out.
 */
export const ALL_READ = 3000;

/**
 * A read of the headlines: the rows; whether the read has come back (with or
 * without any); and whether it was `capped` - it reached `read`, or failed
 * part of the way, so the window may hold older ones it did not take.
 * `enabled` false reads nothing: for a caller that shows headlines only some
 * of the time.
 */
export function useHeadlineRead(
  topics: Topic[],
  days: number,
  read: number,
  untagged: boolean,
  subject?: RegExp,
  enabled = true,
): { rows: Headline[]; done: boolean; capped: boolean } {
  const key = `${topics.join(",")}|${days}|${read}|${untagged}|${subject?.source ?? ""}`;
  const [rows, setRows] = useState<Headline[]>(() => cache.get(key)?.rows ?? []);
  const [done, setDone] = useState(() => cache.has(key));
  const [capped, setCapped] = useState(() => cache.get(key)?.capped ?? false);
  useEffect(() => {
    if (!enabled) return;
    const db = supabase;
    const hit = cache.get(key);
    if (!db || (hit && Date.now() - hit.at < 10 * 60_000)) {
      if (hit) {
        setRows(hit.rows);
        setCapped(hit.capped);
      }
      setDone(true);
      return;
    }
    let live = true;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const page = (byTopic: boolean, from: number, to: number) => {
      let q = db.from("news_items").select("url, title, outlet, published_at, places").gte("published_at", since);
      if (byTopic) q = untagged ? q.or(`topics.ov.{${topics.join(",")}},topics.eq.{}`) : q.overlaps("topics", topics);
      // The link breaks ties, so the pages of a long read do not overlap.
      return q.order("published_at", { ascending: false }).order("url").range(from, to);
    };
    /**
     * The newest `n`, a request at a time, and whether they are the `whole`
     * window - the store ran out before `n` did. Null when the first request
     * fails.
     */
    const newest = async (byTopic: boolean, n: number): Promise<{ rows: Headline[]; whole: boolean } | null> => {
      const out: Headline[] = [];
      for (let from = 0; from < n; from += PAGE) {
        const want = Math.min(PAGE, n - from);
        const { data, error } = await page(byTopic, from, from + want - 1);
        if (error || !data) return from === 0 ? null : { rows: out, whole: false };
        out.push(...(data as Headline[]));
        if (data.length < want) return { rows: out, whole: true };
      }
      return { rows: out, whole: false };
    };
    (async () => {
      let got = await newest(true, read);
      // A store from before headlines carried topics holds only the world and US desks' headlines.
      if (!got && untagged) got = await newest(false, read);
      let found: Headline[] = got?.rows ?? [];
      const full = !!got && !got.whole;
      // Too few from the page's own desks - they are quiet, or not read yet:
      // headlines from any desk whose words are about the subject fill in.
      if (subject && found.length < TOP_UP_BELOW) {
        const more = await newest(false, 300);
        const have = new Set(found.map((r) => r.url));
        const extra = (more?.rows ?? [])
          .filter((r) => !have.has(r.url) && typeof r.title === "string" && subject.test(r.title))
          .map((r) => ({ ...r, viaSubject: true }));
        found = [...found, ...extra].sort((a, b) => b.published_at.localeCompare(a.published_at));
      }
      if (!found.length && !got) {
        if (live) setDone(true);
        return;
      }
      // A wire story runs under the same headline at several outlets: the newest copy is enough.
      // A headline that arrives while a long read is under way can come in two of its pages: once is enough.
      const titles = new Set<string>();
      const urls = new Set<string>();
      const clean = found.filter((r): r is Headline => {
        if (typeof r.title !== "string" || !/^https:\/\//.test(r.url) || !Array.isArray(r.places)) return false;
        const t = r.title.toLowerCase().replace(/\s+/g, " ").trim();
        if (titles.has(t) || urls.has(r.url)) return false;
        titles.add(t);
        urls.add(r.url);
        return true;
      });
      cache.set(key, { at: Date.now(), rows: clean, capped: full });
      if (live) {
        setRows(clean);
        setCapped(full);
        setDone(true);
      }
    })();
    return () => {
      live = false;
    };
    // The key spells out topics, days, read, untagged and subject.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return { rows, done, capped };
}

/** The headlines of a read; see useHeadlineRead. */
export function useHeadlines(topics: Topic[], days: number, read: number, untagged: boolean, subject?: RegExp, enabled = true): Headline[] {
  return useHeadlineRead(topics, days, read, untagged, subject, enabled).rows;
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

const newestSpread: HeadlinePick = (rows, all) => (all ? rows : spread(rows)).map((h) => ({ h, tag: placeTag(h.places) }));

/** Names a country or US state the site knows. */
export const namesPlace = (h: Headline) => h.places.some((p) => placeName(p) !== null);
/** Names a country other than the United States - the US desks tag every story with the US. */
export const namesAbroad = (h: Headline) => h.places.some((p) => p.startsWith("c:") && p !== "c:US" && placeName(p) !== null);
/** Names two places or more: a story about their relations. */
export const namesTwo = (h: Headline) => h.places.filter((p) => placeName(p) !== null).length >= 2;

/** The newest thirty that pass `keep`, five at most from one outlet, tagged with their places; or all that pass. */
export const pickWhere =
  (keep: (h: Headline) => boolean): HeadlinePick =>
  (rows, all) =>
    (all ? rows.filter(keep) : spread(rows.filter(keep))).map((h) => ({ h, tag: placeTag(h.places) }));

/**
 * As pickWhere, with the headlines about a place the reader follows first,
 * starred. All of them come newest first, the followed among the rest, still
 * starred.
 */
export const followedFirst =
  (followed: Set<string>, keep: (h: Headline) => boolean): HeadlinePick =>
  (rows, all) => {
    const mine = (h: Headline) => h.places.some((p) => followed.has(p));
    const list = all
      ? rows.filter((h) => mine(h) || keep(h))
      : spread([...rows.filter(mine), ...rows.filter((h) => !mine(h) && keep(h))]);
    return list.map((h) => ({ h, tag: placeTag(h.places), star: mine(h) }));
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

// ─── Sources ──────────────────────────────────────────────────────────────────

/** An outlet the news job reads: its site, and the feeds - one to a desk - read from it. */
export type OutletSource = { outlet: string; site: string; feeds: string[] };
/** A banner's sources: the outlets whose desks serve its pages, then any other outlet it is showing now. */
export type BannerSources = { own: OutletSource[]; others: OutletSource[] };

const addFeed = (by: Map<string, OutletSource>, s: { outlet: string; site: string; feed: string }) => {
  const e = by.get(s.outlet) ?? { outlet: s.outlet, site: s.site, feeds: [] };
  e.feeds.push(s.feed);
  by.set(s.outlet, e);
};
/** Every outlet, with all its desks. */
const OUTLETS = new Map<string, OutletSource>();
for (const s of NEWS_SOURCES) addFeed(OUTLETS, s);
const byName = (a: OutletSource, b: OutletSource) => a.outlet.localeCompare(b.outlet);

/**
 * The outlets with desks serving these pages, with those desks' feeds; and
 * apart from them any other outlet among `showing` - a headline taken from
 * another desk (a subject top-up, a story naming a state, one kept from
 * before the desks were sorted by page) - with all its desks.
 */
export function bannerSources(topics: readonly string[], showing: string[]): BannerSources {
  const own = new Map<string, OutletSource>();
  for (const s of NEWS_SOURCES) if (s.topics.some((t) => topics.includes(t))) addFeed(own, s);
  const others = [...new Set(showing)]
    .filter((o) => !own.has(o))
    .map((o) => OUTLETS.get(o) ?? { outlet: o, site: "", feeds: [] });
  return { own: [...own.values()].sort(byName), others: others.sort(byName) };
}

/** "All 23 news sources". */
export function allSourcesLabel({ own, others }: BannerSources): string {
  const n = own.length + others.length;
  return n === 1 ? "The news source" : `All ${n} news sources`;
}

const feedName = (url: string) => url.replace(/^https?:\/\//, "");

function SourceChip({ s }: { s: OutletSource }) {
  const cls = "inline-flex items-center gap-1 text-[10px] font-sans px-2.5 py-1 rounded-full border border-border text-foreground/80";
  const body = (
    <>
      {s.outlet}
      {s.feeds.length > 1 && <span className="text-muted-foreground"> · {s.feeds.length} desks</span>}
    </>
  );
  if (!s.site) return <span className={cls}>{body}</span>;
  return (
    <a
      href={s.site}
      target="_blank"
      rel="noopener noreferrer"
      title={`Feeds read: ${s.feeds.map(feedName).join(", ")}`}
      className={`${cls} hover:text-foreground hover:bg-muted/60 transition-colors`}
    >
      {body}
    </a>
  );
}

/** A banner's sources as chips, each linking to the outlet's site and naming on hover the feeds read. */
export function SourcesList({
  own,
  others,
  othersLabel = "Also in the banner now, from other desks:",
}: BannerSources & { othersLabel?: string }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {own.map((s) => (
          <SourceChip key={s.outlet} s={s} />
        ))}
      </div>
      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-sans text-muted-foreground mr-0.5">{othersLabel}</span>
          {others.map((s) => (
            <SourceChip key={s.outlet} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The switch in a banner's note that opens one of its lists above it: "All 23 news sources". */
export function ListToggle({ open, onToggle, show, hide }: { open: boolean; onToggle: () => void; show: string; hide: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="font-semibold text-foreground/80 underline hover:text-foreground cursor-pointer"
    >
      {open ? hide : show}
    </button>
  );
}

// ─── The moving banner ────────────────────────────────────────────────────────

/**
 * One item of a moving banner: its chip, its words and a line of detail,
 * linking to its source. `at` is when a headline was published, for the full
 * list to set it under its day.
 */
export type TickerItem = { key: string; href: string; title: string; tag: HeadlineTag | null; text: string; meta?: string; star?: boolean; at?: string };

/** A headline as a banner item. */
export const headlineItem = ({ h, tag, star }: Shown): TickerItem => ({
  key: h.url,
  href: h.url,
  title: `${h.title} - ${h.outlet}`,
  tag,
  text: h.title,
  meta: `${h.outlet} · ${ago(h.published_at)}`,
  star,
  at: h.published_at,
});

/**
 * The banner itself, in the site's blue hue: its label and pause button, the
 * items looping round at a steady reading speed, and whatever goes under it
 * (`children`). With `expand` it has an "All headlines" switch for a full
 * list the caller puts among the children, and stands still while that list
 * is open. With no items it is left out.
 */
export function Ticker({
  label,
  items,
  className = "",
  expand,
  children,
}: {
  label: string;
  items: TickerItem[];
  className?: string;
  /** The full list: whether it is open, what opens and shuts it, and its id. */
  expand?: { open: boolean; onToggle: () => void; controls: string };
  children?: ReactNode;
}) {
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
  }, [items.length]);
  if (!items.length) return null;
  const open = !!expand?.open;

  const renderItems = (copy: boolean): ReactNode =>
    items.map((it) => (
      <a
        key={`${copy ? "b" : "a"}-${it.key}`}
        href={it.href}
        target="_blank"
        rel="noopener noreferrer"
        title={it.title}
        tabIndex={copy ? -1 : undefined}
        className="group inline-flex items-center gap-2 shrink-0 whitespace-nowrap pr-6 text-xs font-sans text-foreground/90"
      >
        {it.star && <Star size={11} weight="fill" className="text-amber-500 shrink-0" aria-label="A place you follow" />}
        {it.tag && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.tag.tone}`}>{it.tag.text}</span>}
        <span className="group-hover:underline">{it.text}</span>
        {it.meta && <span className="text-[10px] text-muted-foreground">{it.meta}</span>}
        <span aria-hidden className="text-muted-foreground/60 pl-4">
          •
        </span>
      </a>
    ));

  return (
    <section aria-label={label} className={`cs-on-hue bg-card ${BLUE_HUE} border border-border rounded-2xl p-4 ${className}`}>
      {/* In the page's order the switch comes before the moving row, so the keyboard reaches it without passing every
          headline; on a wide screen it is set after the row, at the banner's end. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="order-1 flex items-center gap-2 shrink-0">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{label}</p>
          {!still && !open && (
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
        {expand && (
          <button
            type="button"
            onClick={expand.onToggle}
            aria-expanded={open}
            aria-controls={expand.controls}
            className="order-2 ml-auto sm:order-3 sm:ml-0 inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold font-sans px-2.5 py-1 rounded-full border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {open ? "Hide the list" : "All headlines"}
            <CaretDown size={10} weight="bold" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
        )}
        <div ref={viewRef} className="cs-ticker-viewport order-3 basis-full sm:order-2 sm:flex-1 min-w-0 py-1" data-paused={paused || open} data-still={still}>
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
      {children}
    </section>
  );
}

// ─── The full list ────────────────────────────────────────────────────────────

/** "Today", "Yesterday", "Mon 28 Sept": the reader's own day. */
function dayLabel(d: Date): string {
  const now = new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** How many headlines the full list draws at a time: a list can run past a thousand. */
const LIST_STEP = 100;

/**
 * A banner's full list, under its moving row: every headline, set under its
 * day, each with its chip, outlet and age and linking to the outlet. A long
 * list can be narrowed by typing, and is drawn a hundred at a time - each
 * day's count is of the whole list, not of what is drawn. It scrolls within
 * itself, so opening it does not push the page away.
 */
export function HeadlineList({
  id,
  label,
  items,
  summary,
}: {
  /** The id the banner's switch points at. */
  id: string;
  /** The banner's label: "City headlines". */
  label: string;
  items: TickerItem[];
  /** The line above the list: how many, and from when. */
  summary: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [drawn, setDrawn] = useState(LIST_STEP);
  const filter = (text: string) => {
    setQ(text);
    setDrawn(LIST_STEP);
  };
  const needle = q.trim().toLowerCase();
  const shown = needle ? items.filter((it) => `${it.text} ${it.tag?.text ?? ""} ${it.meta ?? ""}`.toLowerCase().includes(needle)) : items;
  // The days in order, each with the count of all its headlines and those of them drawn so far.
  const groups: { key: string; label: string; count: number; items: TickerItem[] }[] = [];
  shown.forEach((it, i) => {
    const d = it.at ? new Date(it.at) : null;
    const key = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : "";
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) groups.push((g = { key, label: d ? dayLabel(d) : "", count: 0, items: [] }));
    g.count++;
    if (i < drawn) g.items.push(it);
  });
  const left = shown.length - Math.min(drawn, shown.length);
  return (
    <div id={id} role="region" aria-label={`All ${label.toLowerCase()}`} className="mt-3 rounded-xl overflow-hidden border border-border bg-background dark:bg-black/40">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 border-b border-border">
        <p className="text-[10px] font-sans text-muted-foreground leading-snug">
          {summary}
          {needle && ` ${shown.length.toLocaleString("en-US")} match.`}
        </p>
        {items.length > 12 && (
          <label className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
            <MagnifyingGlass size={11} className="text-muted-foreground shrink-0" aria-hidden />
            <input
              type="text"
              value={q}
              onChange={(e) => filter(e.target.value)}
              aria-label={`Filter ${label.toLowerCase()}`}
              placeholder="Filter by word, place or outlet…"
              className="w-44 bg-transparent text-[10px] font-sans text-foreground outline-none border-none placeholder:text-muted-foreground"
            />
            {q && (
              <button type="button" onClick={() => filter("")} aria-label="Clear the filter" className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={10} weight="bold" />
              </button>
            )}
          </label>
        )}
      </div>
      <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
        {groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <div key={g.key}>
              {g.label && (
                <p className="px-3 pt-2.5 pb-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                  {g.label} · {g.count.toLocaleString("en-US")}
                </p>
              )}
              <ul>
                {g.items.map((it) => (
                  <li key={it.key} className="border-b border-border last:border-b-0">
                    <a href={it.href} target="_blank" rel="noopener noreferrer" title={it.title} className="group flex flex-col gap-1 px-3 py-2 hover:bg-muted transition-colors">
                      <span className="text-xs font-sans text-foreground leading-snug group-hover:underline">{it.text}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {it.star && <Star size={11} weight="fill" className="text-amber-500 shrink-0" aria-label="A place you follow" />}
                        {it.tag && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.tag.tone}`}>{it.tag.text}</span>}
                        {it.meta && <span className="text-[10px] text-muted-foreground">{it.meta}</span>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        {left > 0 && (
          <button
            type="button"
            onClick={() => setDrawn((n) => n + LIST_STEP)}
            className="w-full px-3 py-2.5 border-t border-border text-[11px] font-semibold font-sans text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Show {Math.min(LIST_STEP, left)} more · {left.toLocaleString("en-US")} still to show
          </button>
        )}
        {shown.length === 0 && <p className="px-3 py-6 text-center text-[11px] font-sans text-muted-foreground">{needle ? "No headline matches." : "No headlines to list."}</p>}
      </div>
    </div>
  );
}

const NUMBER_WORD = ["no", "one", "two", "three", "four", "five", "six", "seven"];
/** "the last two days". */
export const windowWords = (days: number) => (days === 1 ? "the last day" : `the last ${NUMBER_WORD[days] ?? days} days`);

/** "yesterday, 09:40" or "Mon 28 Sept, 09:40": how far back a list goes, in the reader's own time. */
export function backTo(iso: string): string {
  const d = new Date(iso);
  const day = dayLabel(d);
  return `${day === "Today" || day === "Yesterday" ? day.toLowerCase() : day}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** "86 headlines", in the list's summary. */
export function HeadlineCount({ n }: { n: number }) {
  return (
    <strong className="font-semibold text-foreground">
      {n.toLocaleString("en-US")} headline{n === 1 ? "" : "s"}
    </strong>
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
   * outlet, tagged with their places. Asked for all, every one that belongs.
   */
  pick?: HeadlinePick;
  /** The page's subject (see SUBJECT), for topping up when its own desks give fewer than a dozen. */
  subject?: RegExp;
  /** The line under the banner, given the outlets it is showing. */
  note: (outlets: string) => ReactNode;
  className?: string;
}) {
  const own = useHeadlineRead(topics, days, read, untagged, subject);
  const rows = own.rows;
  const shown = useMemo(() => pick(rows), [pick, rows]);
  const toppedUp = shown.some((s) => s.h.viaSubject);
  const topicKey = topics.join(",");
  const sources = useMemo(
    () => bannerSources(topics, shown.map((s) => s.h.outlet)),
    // topicKey spells out the topics, which a page may pass as a new array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topicKey, shown],
  );
  const [showSources, setShowSources] = useState(false);

  // The full list: everything the page's desks carry in the window, read when
  // the list is opened. Until that read lands the banner's own stands in.
  const [showAll, setShowAll] = useState(false);
  const listId = useId();
  const deep = useHeadlineRead(topics, days, ALL_READ, untagged, subject, showAll);
  const from = deep.rows.length ? deep : own;
  const pool = from.rows;
  const all = useMemo(() => (showAll ? pick(pool, true).map(headlineItem) : []), [showAll, pick, pool]);
  // A read that stopped short does not reach the start of the window: the list says how far back it goes.
  const reach = from.capped && pool.length ? backTo(pool[pool.length - 1].published_at) : null;

  return (
    <Ticker
      label={label}
      items={shown.map(headlineItem)}
      className={className}
      expand={{ open: showAll, onToggle: () => setShowAll((v) => !v), controls: listId }}
    >
      {showAll && (
        <HeadlineList
          id={listId}
          label={label}
          items={all}
          summary={
            <>
              <HeadlineCount n={all.length} />{" "}
              {reach ? `among the newest ${pool.length.toLocaleString("en-US")} read, which go back to ${reach}` : `from ${windowWords(days)}`}, newest first.
              {!deep.done && " Reading the rest…"}
            </>
          }
        />
      )}
      {showSources && <SourcesList {...sources} />}
      <p className="mt-2 text-[10px] font-sans text-muted-foreground leading-snug">
        <ListToggle
          open={showSources}
          onToggle={() => setShowSources((v) => !v)}
          show={allSourcesLabel(sources)}
          hide="Hide the sources"
        />
        {" · "}
        {note(outletList(shown.map((s) => s.h)))}
        {toppedUp && " These desks have been quiet, so headlines from other desks that are about the same subject fill in."}
      </p>
    </Ticker>
  );
}
