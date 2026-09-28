import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, Star } from "@phosphor-icons/react";
import { useLiveStatus, type UpcomingEvent } from "@/lib/liveFigures";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { supabase } from "@/lib/supabase";
import { usStatesData } from "@/data/statesData";
import { TONE } from "@/lib/chipTone";

/**
 * "Upcoming to Watch" on the States page, as a moving news banner: the
 * latest state headlines from established outlets and what is coming up -
 * the elections Wikidata lists for each state and the BEA releases that
 * carry state GDP and income. All of it is refreshed on the server (news
 * every half hour, calendars twice a day), so the banner keeps itself
 * current; nothing in it is written by hand.
 *
 * States the reader follows come first. Every item links to its source.
 * The banner stops under the pointer or keyboard focus and has a pause
 * button; with reduced motion it stands still and scrolls by hand. "All"
 * opens the full list as plain chips.
 */

type Headline = { url: string; title: string; outlet: string; published_at: string; places: string[] };

const STATE_KEYS = usStatesData.map((s) => `s:${s.id}`);
const stateName = (id: string | null) => (id ? (usStatesData.find((s) => s.id === id)?.name ?? id.toUpperCase()) : "");

const KIND_ORDER = [
  "Governor",
  "US Senate",
  "US House",
  "Lieutenant Governor",
  "Attorney General",
  "Secretary of State",
  "State legislature",
  "Ballot measure",
  "Special election",
  "Election",
  "Data release",
];

const KIND_TONE: Record<string, string> = {
  Governor: TONE.amber,
  "US Senate": TONE.blue,
  "US House": TONE.indigo,
  "Lieutenant Governor": TONE.orange,
  "Attorney General": TONE.rose,
  "Secretary of State": TONE.violet,
  "State legislature": TONE.teal,
  "Ballot measure": TONE.pink,
  "Special election": TONE.fuchsia,
  "Data release": TONE.cyan,
};

const fmtDate = (iso: string, year = true) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** BEA's release names are long; the part about the states, with its period. */
function shortRelease(title: string): string {
  const t = title.replace(/^BEA: /, "");
  const quarter = /(\d)(?:st|nd|rd|th) Quarter (\d{4})/.exec(t);
  if (/State GDP/.test(t) && /State Personal Income/.test(t))
    return `State GDP and personal income${quarter ? `, Q${quarter[1]} ${quarter[2]}` : ""}`;
  return t.length > 70 ? `${t.slice(0, 68)}…` : t;
}

/** Latest headlines naming a US state, fetched once per ten minutes. */
let headlineCache: { at: number; rows: Headline[] } | null = null;
function useStateHeadlines(): Headline[] {
  const [rows, setRows] = useState<Headline[]>(headlineCache?.rows ?? []);
  useEffect(() => {
    if (!supabase || (headlineCache && Date.now() - headlineCache.at < 10 * 60_000)) return;
    let live = true;
    supabase
      .from("news_items")
      .select("url, title, outlet, published_at, places")
      .overlaps("places", STATE_KEYS)
      .gte("published_at", new Date(Date.now() - 3 * 86_400_000).toISOString())
      .order("published_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!live || !data) return;
        const clean = data.filter(
          (r): r is Headline => typeof r.title === "string" && /^https:\/\//.test(r.url) && Array.isArray(r.places),
        );
        headlineCache = { at: Date.now(), rows: clean };
        setRows(clean);
      });
    return () => {
      live = false;
    };
  }, []);
  return rows;
}

type Item = { key: string; href: string; tag: string; tone: string; text: string; meta: string; followed: boolean; title: string };

export function UpcomingStates() {
  const { events, lastChecked } = useLiveStatus();
  const headlines = useStateHeadlines();
  const watch = useWatchlist();
  const [paused, setPaused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(120);

  const followed = new Set(watch.items.filter((i) => i.type === "state").map((i) => i.id));
  const rank = (k: string) => {
    const i = KIND_ORDER.indexOf(k);
    return i < 0 ? KIND_ORDER.length : i;
  };
  const upcoming = events
    .filter((e) => e.scope === "states")
    .sort(
      (a, b) =>
        Number(followed.has(b.area ?? "")) - Number(followed.has(a.area ?? "")) ||
        a.event_date.localeCompare(b.event_date) ||
        rank(a.kind) - rank(b.kind) ||
        stateName(a.area).localeCompare(stateName(b.area)),
    );

  const eventItem = (e: UpcomingEvent): Item => ({
    key: e.id,
    href: e.source_url,
    tag: e.kind === "Data release" ? `BEA · ${fmtDate(e.event_date, false)}` : fmtDate(e.event_date, false),
    tone: KIND_TONE[e.kind] ?? TONE.zinc,
    text: e.kind === "Data release" ? shortRelease(e.title) : `${stateName(e.area)} · ${e.kind} election`,
    meta: "",
    followed: followed.has(e.area ?? ""),
    title: `${e.title} - ${fmtDate(e.event_date)} (source: ${e.source === "bea" ? "BEA release schedule" : "Wikidata"})`,
  });
  const newsItem = (h: Headline): Item => {
    const states = h.places.filter((p) => p.startsWith("s:")).map((p) => p.slice(2));
    return {
      key: h.url,
      href: h.url,
      tag: "News",
      tone: TONE.red,
      text: h.title,
      meta: `${h.outlet} · ${ago(h.published_at)}`,
      followed: states.some((s) => followed.has(s)),
      title: `${h.title} - ${h.outlet}`,
    };
  };

  // Followed states first; then headlines and dates in turn, one headline to
  // two dates, so neither crowds the other out.
  const news = headlines.map(newsItem);
  const dates = upcoming.slice(0, 40).map(eventItem);
  const first = [...news.filter((i) => i.followed), ...dates.filter((i) => i.followed)];
  const restNews = news.filter((i) => !i.followed);
  const restDates = dates.filter((i) => !i.followed);
  const items: Item[] = [...first];
  for (let n = 0, d = 0; n < restNews.length || d < restDates.length; ) {
    if (n < restNews.length) items.push(restNews[n++]);
    if (d < restDates.length) items.push(restDates[d++]);
    if (d < restDates.length) items.push(restDates[d++]);
  }

  // A steady reading speed, whatever the length: about 40 px a second.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setDuration(Math.max(30, el.scrollWidth / 2 / 40));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  if (!items.length) return null;

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
        {it.followed && <Star size={11} weight="fill" className="text-amber-500 shrink-0" />}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.tone}`}>{it.tag}</span>
        <span className="group-hover:underline">{it.text}</span>
        {it.meta && <span className="text-[10px] text-muted-foreground">{it.meta}</span>}
        <span aria-hidden className="text-muted-foreground/60 pl-4">•</span>
      </a>
    ));

  return (
    <section aria-label="Upcoming to watch" className="mb-6 bg-card border border-border rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
            🔥 Upcoming to Watch
          </p>
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
        </div>
        <div className="cs-ticker-viewport flex-1 min-w-0 py-1" data-paused={paused}>
          <div
            ref={trackRef}
            className="cs-ticker-track flex w-max"
            style={{ ["--cs-ticker-duration" as string]: `${duration}s` }}
          >
            <div className="flex">{renderItems(false)}</div>
            {/* The second copy, for a seamless loop; hidden from screen readers. */}
            <div className="cs-ticker-copy flex" aria-hidden>
              {renderItems(true)}
            </div>
          </div>
        </div>
      </div>

      {showAll && (
        <div className="mt-3 flex flex-wrap gap-2">
          {upcoming.map((e) => {
            const it = eventItem(e);
            return (
              <a
                key={`all-${e.id}`}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                title={it.title}
                className={`inline-flex items-center gap-1 max-w-full text-[10px] font-sans px-2.5 py-1 rounded-full hover:underline ${it.tone}`}
              >
                {it.followed && <Star size={10} weight="fill" className="text-amber-500 shrink-0" />}
                <span className="truncate">
                  {it.text} · {fmtDate(e.event_date)}
                </span>
              </a>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[10px] font-sans text-muted-foreground leading-snug">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="font-semibold text-foreground/80 underline hover:text-foreground cursor-pointer"
          aria-expanded={showAll}
        >
          {showAll ? "Hide the list" : `All ${upcoming.length} upcoming dates`}
        </button>
        {" · "}Headlines from established outlets' public feeds, every half hour; elections as{" "}
        <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Wikidata
        </a>{" "}
        lists them (most contests, not every one) and{" "}
        <a href="https://www.bea.gov/news/schedule" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          BEA's release schedule
        </a>
        , twice a day
        {lastChecked &&
          ` - last checked ${lastChecked.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        .
      </p>
    </section>
  );
}
