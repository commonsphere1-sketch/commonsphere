import { useEffect, useMemo, useState } from "react";
import { SiteMark } from "../components/SiteMark";
import { FilterBar } from "../components/FilterBar";
import { StyledSelect } from "../components/StyledSelect";
import { NewsTracker } from "../components/NewsTracker";
import { NewsDesks } from "../components/NewsDesks";
import { NewsHistory } from "../components/NewsHistory";
import { BLUE_HUE } from "../lib/blueHue";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import {
  ALL_READ,
  ALL_TOPICS,
  HeadlineCount,
  HeadlineList,
  ListToggle,
  SourcesList,
  allSourcesLabel,
  backTo,
  bannerSources,
  headlineItem,
  outletList,
  placeName,
  placeTag,
  useFollowedTags,
  useHeadlineRead,
  windowWords,
} from "../components/HeadlinesBanner";
import { CONTINENTS, EVENTS, SUBJECTS, inWhere, labelOf, wordsOf, type SubjectId, type Where } from "../lib/newsSubjects";

/**
 * The News page, as asked: every headline the news job has read from the
 * outlets' public feeds (supabase/functions/refresh-data/news.ts), for the
 * whole world, for stories between countries, or for one continent, country
 * or US state - by subject, or by the kind of event it reports - and, below
 * the list, the historic accounts of those events by country (NewsHistory)
 * and the events tracked by region (NewsTracker). Nothing here is
 * written by the site: each headline is the outlet's own, linking to it.
 * The places and subjects are set out in lib/newsSubjects.ts.
 */

/* A country or a state, for the picker: the countries by name, then the fifty states. */
const PLACE_OPTIONS = [
  { value: "none", label: "A country or US state" },
  ...countriesData
    .filter((c) => !c.uninhabited)
    .map((c) => ({ value: `c:${c.code}`, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label)),
  ...usStatesData.map((s) => ({ value: `s:${s.id}`, label: `${s.name} (US state)` })).sort((a, b) => a.label.localeCompare(b.label)),
];

/* ─── Remembered picks ──────────────────────────────────────────────────── */

/* The reader's last picks, kept in this browser only, so the page opens where they left it. */
const KEY = "cs.news";
type Saved = { where: Where; subject: SubjectId; days: number };
const DEFAULTS: Saved = { where: "global", subject: "all", days: 2 };
function readSaved(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Saved> | null;
    if (!s) return DEFAULTS;
    const where = typeof s.where === "string" && (s.where === "global" || s.where === "intl" || s.where.startsWith("cont:") || placeName(s.where)) ? s.where : DEFAULTS.where;
    const subject = s.subject && wordsOf(s.subject) ? s.subject : "all";
    const days = s.days === 1 || s.days === 2 || s.days === 7 ? s.days : DEFAULTS.days;
    return { where, subject, days };
  } catch {
    return DEFAULTS;
  }
}

const DAY_OPTIONS = [
  { value: "1", label: "The last day" },
  { value: "2", label: "The last two days" },
  { value: "7", label: "The last week" },
];

const chip = (on: boolean) =>
  `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
    on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
  }`;
const fmt = (n: number) => n.toLocaleString("en-US");

export function NewsPage() {
  const [saved] = useState(readSaved);
  const [where, setWhere] = useState<Where>(saved.where);
  const [subject, setSubject] = useState<SubjectId>(saved.subject);
  const [days, setDays] = useState(saved.days);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ where, subject, days }));
    } catch {
      /* A browser that keeps nothing opens the page on its defaults. */
    }
  }, [where, subject, days]);

  const { rows, done, capped } = useHeadlineRead(ALL_TOPICS, days, ALL_READ, true);
  const followed = useFollowedTags();

  // How many each place, subject and event holds, so a pick that would show nothing says so before it is pressed.
  const continentCount = useMemo(() => new Map(CONTINENTS.map((c) => [c, rows.filter(inWhere(`cont:${c}`)).length])), [rows]);
  const intlCount = useMemo(() => rows.filter(inWhere("intl")).length, [rows]);
  const here = useMemo(() => rows.filter(inWhere(where)), [rows, where]);
  const wordCount = useMemo(() => new Map([...SUBJECTS, ...EVENTS].map((s) => [s.id, here.filter((h) => s.re.test(h.title)).length])), [here]);
  const shown = useMemo(() => {
    const re = wordsOf(subject);
    return re ? here.filter((h) => re.test(h.title)) : here;
  }, [here, subject]);
  const items = useMemo(
    () => shown.map((h) => headlineItem({ h, tag: placeTag(h.places), star: h.places.some((p) => followed.has(p)) })),
    [shown, followed],
  );

  const sources = useMemo(() => bannerSources(ALL_TOPICS, shown.map((h) => h.outlet)), [shown]);
  const [showSources, setShowSources] = useState(false);
  // A read that stopped short does not reach the start of the window: the list says how far back it goes.
  const reach = capped && rows.length ? backTo(rows[rows.length - 1].published_at) : null;
  const picked = where.startsWith("c:") || where.startsWith("s:") ? where : "none";
  const whereWords =
    where === "global"
      ? "from anywhere"
      : where === "intl"
        ? "between countries"
        : where.startsWith("cont:")
          ? `about ${where.slice(5)}`
          : `about ${placeName(where) ?? where}`;
  const subjectWords = subject === "all" ? "" : ` on ${labelOf(subject)?.toLowerCase()}`;

  // A count pressed in the tracker lists those headlines.
  const pick = (w: Where, event: SubjectId) => {
    setWhere(w);
    setSubject(event);
    requestAnimationFrame(() => document.getElementById("news-list")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold font-sans text-foreground flex items-center gap-3">
            <SiteMark />
            News
          </h1>
        </div>

        {/* Every headline, by place, subject and event. */}
        <div className="flex items-baseline gap-3 px-1 pb-3">
          <h2 className="text-sm font-bold font-sans text-foreground">Every headline</h2>
          <span className="text-[10px] font-sans text-muted-foreground">by place, subject and event</span>
          <span className="flex-1 h-px bg-border" aria-hidden />
        </div>
        {/* Where: the whole world, between countries, a continent, or one country or US state. */}
        <FilterBar label="News by place" className="mb-4" status={done ? `${fmt(rows.length)} headlines read` : "Reading…"}>
          <button type="button" onClick={() => setWhere("global")} aria-pressed={where === "global"} className={chip(where === "global")}>
            Global
          </button>
          <button type="button" onClick={() => setWhere("intl")} aria-pressed={where === "intl"} className={chip(where === "intl")}>
            International · {fmt(intlCount)}
          </button>
          <div className="w-px h-4 bg-border shrink-0" />
          {CONTINENTS.map((c) => (
            <button key={c} type="button" onClick={() => setWhere(`cont:${c}`)} aria-pressed={where === `cont:${c}`} className={chip(where === `cont:${c}`)}>
              {c} · {fmt(continentCount.get(c) ?? 0)}
            </button>
          ))}
          <div className="w-px h-4 bg-border shrink-0" />
          <StyledSelect
            value={picked}
            onValueChange={(v) => setWhere(v === "none" ? "global" : v)}
            options={PLACE_OPTIONS}
            ariaLabel="A country or US state"
            triggerClassName={picked !== "none" ? "text-foreground font-semibold" : ""}
          />
          <div className="w-px h-4 bg-border shrink-0" />
          <StyledSelect value={String(days)} onValueChange={(v) => setDays(Number(v))} options={DAY_OPTIONS} ariaLabel="How far back" />
        </FilterBar>

        {/* What: the subject, or the kind of event, by the words of the headline. */}
        <div role="group" aria-label="News by subject" className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Subject</span>
          <button type="button" onClick={() => setSubject("all")} aria-pressed={subject === "all"} className={chip(subject === "all")}>
            All · {fmt(here.length)}
          </button>
          {SUBJECTS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSubject(s.id)} aria-pressed={subject === s.id} className={chip(subject === s.id)}>
              {s.label} · {fmt(wordCount.get(s.id) ?? 0)}
            </button>
          ))}
        </div>
        <div role="group" aria-label="News by event" className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Events</span>
          {EVENTS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSubject(s.id)} aria-pressed={subject === s.id} className={chip(subject === s.id)}>
              {s.label} · {fmt(wordCount.get(s.id) ?? 0)}
            </button>
          ))}
        </div>

        {/* The headlines in the blue hue of the site's banners, as asked. */}
        <section aria-label="Every headline" className={`cs-on-hue bg-card ${BLUE_HUE} border border-border rounded-2xl px-4 pb-4 pt-1`}>
        <HeadlineList
          id="news-list"
          label="News"
          items={items}
          scrollClass="max-h-[min(48rem,75vh)]"
          panelClass="bg-transparent"
          summary={
            <>
              <HeadlineCount n={items.length} /> {whereWords}
              {subjectWords}{" "}
              {reach ? `among the newest ${fmt(rows.length)} read, which go back to ${reach}` : `from ${windowWords(days)}`}, newest first.
              {!done && " Reading…"}
              {done && !rows.length && " The news store gave nothing back just now."}
            </>
          }
        />

        {showSources && <SourcesList {...sources} othersLabel="Also listed now:" />}
        <p className="mt-2 text-[10px] font-sans text-muted-foreground leading-snug">
          <ListToggle open={showSources} onToggle={() => setShowSources((v) => !v)} show={allSourcesLabel(sources)} hide="Hide the sources" />
          {shown.length > 0 && <> · These are from {outletList(shown)}.</>} Each headline is the outlet's own and links to it; the site
          reads the outlets' public feeds every half hour and keeps only the headline, link, outlet and time. A wire story run by
          several outlets is listed once. The places are those a headline names, as the news job tags them; International is a
          headline naming two countries or more, one of them not the United States, whose desks tag every story with it. A subject
          or an event is a match of the headline's words - "election", "tariffs", "riot", "coup", "earthquake", "outbreak" - so a
          headline can sit under more than one, or under none; words that mean something else, such as a trade war or an AI
          revolution, are kept out. ★ marks a place you follow.
        </p>
        </section>

        {/* The historic accounts of these events, country by country, under the headline list, as asked. */}
        <NewsHistory initial={where.startsWith("c:") ? where.slice(2) : where.startsWith("s:") ? "US" : undefined} />

        {/* The events tracked by region, below the news, as asked: the public bodies' records beside the headlines. */}
        <div className="mt-8">
          <NewsTracker rows={rows} days={days} where={where} onPick={pick} />
        </div>

        {/* Every headline banner on the site, each as its own page shows it, with a link to that page - at the foot of the page, as asked. */}
        <div className="mt-8">
          <NewsDesks />
        </div>
      </div>
    </div>
  );
}
