import { useEffect, useState } from "react";
import { Star } from "@phosphor-icons/react";
import { useLiveStatus, type UpcomingEvent } from "@/lib/liveFigures";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { supabase } from "@/lib/supabase";
import { usStatesData } from "@/data/statesData";
import { TONE } from "@/lib/chipTone";
import {
  ListToggle,
  SourcesList,
  Ticker,
  allSourcesLabel,
  bannerSources,
  headlineItem,
  namesTag,
  outletList,
  placeTag,
  spread,
  useHeadlines,
  type Headline,
  type TickerItem,
} from "@/components/HeadlinesBanner";

/**
 * The States page's news banner: the US desks' latest national headlines,
 * stories naming a state from any desk the site reads, and what is coming
 * up - the elections Wikidata lists for each state and the BEA releases that
 * carry state GDP and income. All of it is refreshed on the server (news
 * every half hour, calendars twice a day), so the banner keeps itself
 * current; nothing in it is written by hand.
 *
 * States the reader follows come first, starred; then a story naming a
 * state, a national headline and a date in turn, so none crowds the others
 * out. Every item links to its source. Under it, "All … upcoming dates"
 * opens the full calendar and "All … news sources" the outlets read.
 */

const STATE_KEYS = usStatesData.map((s) => `s:${s.id}`);
const STATE_NAME = new Map(usStatesData.map((s) => [s.id, s.name]));
const stateName = (id: string | null) => (id ? (STATE_NAME.get(id) ?? id.toUpperCase()) : "");
/** The states a headline names: "tx" for Texas. */
const statesOf = (h: Headline) => h.places.filter((p) => p.startsWith("s:")).map((p) => p.slice(2));

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

/** BEA's release names are long; the part about the states, with its period. */
function shortRelease(title: string): string {
  const t = title.replace(/^BEA: /, "");
  const quarter = /(\d)(?:st|nd|rd|th) Quarter (\d{4})/.exec(t);
  if (/State GDP/.test(t) && /State Personal Income/.test(t))
    return `State GDP and personal income${quarter ? `, Q${quarter[1]} ${quarter[2]}` : ""}`;
  return t.length > 70 ? `${t.slice(0, 68)}…` : t;
}

/** The latest headlines naming a US state, from any desk, fetched once per ten minutes. */
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
      .limit(30)
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

/** Of each kind - stories naming a state, national headlines, dates - at most this many in the moving row. */
const EACH = 15;

export function UpcomingStates() {
  const { events, lastChecked } = useLiveStatus();
  const nationalRows = useHeadlines(["us"], 2, 150, false);
  const stateRows = useStateHeadlines();
  const watch = useWatchlist();
  const [showDates, setShowDates] = useState(false);
  const [showSources, setShowSources] = useState(false);

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

  const eventItem = (e: UpcomingEvent): TickerItem => ({
    key: e.id,
    href: e.source_url,
    title: `${e.title} - ${fmtDate(e.event_date)} (source: ${e.source === "bea" ? "BEA release schedule" : "Wikidata"})`,
    tag: {
      text: e.kind === "Data release" ? `BEA · ${fmtDate(e.event_date, false)}` : fmtDate(e.event_date, false),
      tone: KIND_TONE[e.kind] ?? TONE.zinc,
    },
    text: e.kind === "Data release" ? shortRelease(e.title) : `${stateName(e.area)} · ${e.kind} election`,
    star: followed.has(e.area ?? ""),
  });

  // A wire story runs under the same headline at several outlets: the newest copy is enough.
  const seen = new Set<string>();
  const firstCopy = (h: Headline) => {
    const t = h.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  };
  const mine = (h: Headline) => statesOf(h).some((s) => followed.has(s));
  // Stories naming a state, the followed states' first; then the US desks'
  // other headlines, the ones naming no state. Five at most from one outlet.
  const stateNews = spread([...stateRows.filter(mine), ...stateRows.filter((h) => !mine(h))].filter(firstCopy), 5, EACH);
  const nationalNews = spread(
    nationalRows.filter((h) => !h.places.some((p) => p.startsWith("s:")) && firstCopy(h)),
    5,
    EACH,
  );
  const headlines = [...stateNews, ...nationalNews];
  const sources = bannerSources(["us"], headlines.map((h) => h.outlet));

  // A story naming a state is tagged with its states; a national one "National",
  // or with the countries it names when it names another.
  const stateItems = stateNews.map((h) => {
    const states = statesOf(h);
    return headlineItem({ h, tag: namesTag(states.map(stateName)), star: states.some((s) => followed.has(s)) });
  });
  const nationalItems = nationalNews.map((h) =>
    headlineItem({ h, tag: h.places.some((p) => p !== "c:US") ? placeTag(h.places) : { text: "National", tone: TONE.blue } }),
  );
  const dates = upcoming.map(eventItem);

  // Followed states first; then a story naming a state, a national headline and a date in turn.
  const items: TickerItem[] = [...stateItems.filter((i) => i.star), ...dates.filter((i) => i.star).slice(0, EACH)];
  const streams = [stateItems.filter((i) => !i.star), nationalItems, dates.filter((i) => !i.star).slice(0, EACH)];
  for (let k = 0; streams.some((s) => k < s.length); k++) for (const s of streams) if (k < s.length) items.push(s[k]);

  const link = "underline hover:text-foreground";
  return (
    <Ticker label="US headlines and dates to watch" items={items} className="mb-6">
      {showDates && (
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
                className={`inline-flex items-center gap-1 max-w-full text-[10px] font-sans px-2.5 py-1 rounded-full hover:underline ${it.tag?.tone ?? ""}`}
              >
                {it.star && <Star size={10} weight="fill" className="text-amber-500 shrink-0" />}
                <span className="truncate">
                  {it.text} · {fmtDate(e.event_date)}
                </span>
              </a>
            );
          })}
        </div>
      )}
      {showSources && <SourcesList {...sources} othersLabel="Also in the banner now, with stories naming a state:" />}

      <p className="mt-2 text-[10px] font-sans text-muted-foreground leading-snug">
        {upcoming.length > 0 && (
          <>
            <ListToggle
              open={showDates}
              onToggle={() => setShowDates((v) => !v)}
              show={upcoming.length === 1 ? "The upcoming date" : `All ${upcoming.length} upcoming dates`}
              hide="Hide the dates"
            />
            {" · "}
          </>
        )}
        {headlines.length > 0 && (
          <>
            <ListToggle
              open={showSources}
              onToggle={() => setShowSources((v) => !v)}
              show={allSourcesLabel(sources)}
              hide="Hide the sources"
            />
            {" · "}The last two days' national headlines and three days' stories naming a state, from {outletList(headlines)} (five at
            most from each), refreshed every half hour.{" "}
          </>
        )}
        Elections as{" "}
        <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer" className={link}>
          Wikidata
        </a>{" "}
        lists them (most contests, not every one) and state data releases on{" "}
        <a href="https://www.bea.gov/news/schedule" target="_blank" rel="noopener noreferrer" className={link}>
          BEA's release schedule
        </a>
        , read twice a day
        {lastChecked &&
          ` - last checked ${lastChecked.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        .{headlines.length > 0 && ` A headline's tag is the state or country it names, violet for more than one, or "National" for the country as a whole.`}{" "}
        Each links to its source.
      </p>
    </Ticker>
  );
}
