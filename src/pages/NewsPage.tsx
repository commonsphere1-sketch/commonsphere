import { useEffect, useMemo, useState } from "react";
import { SiteMark } from "../components/SiteMark";
import { FilterBar } from "../components/FilterBar";
import { StyledSelect } from "../components/StyledSelect";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import {
  ALL_READ,
  ALL_TOPICS,
  HeadlineCount,
  HeadlineList,
  ListToggle,
  SourcesList,
  SUBJECT,
  allSourcesLabel,
  backTo,
  bannerSources,
  headlineItem,
  namesAbroad,
  outletList,
  placeName,
  placeTag,
  useFollowedTags,
  useHeadlineRead,
  windowWords,
  type Headline,
} from "../components/HeadlinesBanner";

/**
 * The News page, as asked: every headline the news job has read from the
 * outlets' public feeds (supabase/functions/refresh-data/news.ts), for the
 * whole world, for stories between countries, or for one continent, country
 * or US state - and by subject. Nothing here is written by the site: each
 * headline is the outlet's own, linking to it. The places are those the news
 * job tags a headline with; a subject is a match of the headline's words, so
 * one headline can sit under several subjects, or none.
 */

/* ─── Where ─────────────────────────────────────────────────────────────── */

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const;
const CONTINENT_OF = new Map(countriesData.map((c) => [`c:${c.code}`, c.continent]));
const countriesNamed = (h: Headline) => h.places.filter((p) => p.startsWith("c:") && placeName(p) !== null);

/** "global", "intl", "cont:Asia", "c:JP" or "s:tx". */
type Where = string;
const inWhere = (where: Where) => (h: Headline): boolean => {
  if (where === "global") return true;
  // Between countries: it names two or more, one of them not the United States - the US desks tag every story with the US.
  if (where === "intl") return countriesNamed(h).length >= 2 && namesAbroad(h);
  if (where.startsWith("cont:")) {
    const c = where.slice(5);
    return h.places.some((p) => CONTINENT_OF.get(p) === c || (c === "North America" && p.startsWith("s:") && placeName(p) !== null));
  }
  return h.places.includes(where);
};

/* A country or a state, for the picker: the countries by name, then the fifty states. */
const PLACE_OPTIONS = [
  { value: "none", label: "A country or US state" },
  ...countriesData
    .filter((c) => !c.uninhabited)
    .map((c) => ({ value: `c:${c.code}`, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label)),
  ...usStatesData.map((s) => ({ value: `s:${s.id}`, label: `${s.name} (US state)` })).sort((a, b) => a.label.localeCompare(b.label)),
];

/* ─── Subjects ──────────────────────────────────────────────────────────── */

/*
 * The words that put a headline under a subject: whole words, any case. The
 * ambiguous are left out - "Labour" is also the labour market, "union" the
 * European Union, "rally" a market's, "mines" also landmines, "security"
 * also social security - and deaths are not counted as security, since
 * floods and earthquakes kill too.
 */
const SUBJECTS = [
  {
    id: "political",
    label: "Political",
    re: /\b(elections?|electoral|voters?|voting|votes?|ballots?|referendums?|parliament(ary)?|congress(ional)?|senate|senators?|lawmakers?|legislat(ure|ures|ion|ive|ors?)|presiden(t|ts|tial|cy)|prime ministers?|ministers?|ministry|cabinet|governments?|coalition|opposition (leader|party|parties)|political|politics|politicians?|impeach(ment|ed)?|governors?|mayors?|diplomats?|diplomacy|diplomatic|summit|treaty|embassy|White House|Kremlin|Downing Street|Democrats?|Republicans?|Tories|Supreme Court|constitution(al)?)\b/i,
  },
  {
    id: "social",
    label: "Sociological",
    re: /\b(protests?|protesters?|demonstrat(ion|ions|ors)|immigra(tion|nts?)|migrants?|migration|refugees?|asylum|education|schools?|teachers?|students?|universit(y|ies)|healthcare|health care|hospitals?|patients?|doctors?|nurses?|poverty|inequality|housing|homeless(ness)?|welfare|pensions?|religio(n|us)|church(es)?|mosques?|synagogues?|racism|racial|discrimination|gender|women|women's|LGBTQ?|transgender|abortion|same-sex|birth rates?|census|families|children|youth|communit(y|ies)|civil rights|human rights|free speech|social media)\b/i,
  },
  {
    id: "environmental",
    label: "Environmental",
    re: /\b(climate|emissions?|carbon|CO2|greenhouse|heatwaves?|heat wave|wildfires?|bushfires?|droughts?|floods?|flooding|glaciers?|sea[- ]level|global warming|renewables?|solar|wind (power|farms?|energy)|fossil fuels?|coal|net[- ]zero|COP\d+|El Niño|La Niña|hurricanes?|typhoons?|cyclones?|storms?|tornado(es)?|earthquakes?|quakes?|volcan(o|oes|ic)|eruptions?|tsunamis?|landslides?|pollution|polluted|air quality|smog|plastics?|wildlife|species|extinct(ion)?|endangered|biodiversity|deforestation|forests?|oceans?|coral|conservation|environment(al)?|recycling)\b/i,
  },
  { id: "economic", label: "Economic", re: SUBJECT.economy },
  {
    id: "security",
    label: "Security",
    re: /\b(wars?|warfare|military|militaries|troops|soldiers?|army|armies|navy|naval|air force|missiles?|drones?|air ?strikes?|shelling|bomb(s|ing|ings|ed)?|explosions?|attacks?|attacked|shootings?|gunman|gunmen|gunfire|terror(ism|ist|ists)?|ceasefire|truce|hostages?|invasion|invade[ds]?|rebels?|militants?|insurgents?|jihadists?|NATO|defen[cs]e|weapons?|cyber ?attacks?|hack(s|ers?|ed|ing)?|police|arrest(s|ed)?|crimes?|criminals?|murders?|gangs?|cartels?|security forces|national security|Security Council|border (guards?|patrol)|conflicts?|clashes|violence|coup)\b/i,
  },
  {
    id: "industrial",
    label: "Industrial",
    re: /\b(industr(y|ies|ial)|manufactur(ing|ers?)|factor(y|ies)|carmakers?|automakers?|car makers?|electric (cars?|vehicles?)|EVs?|chipmakers?|chips?|semiconductors?|steel|alumin(i)?um|copper|lithium|mining|miners?|oil|natural gas|gas (prices|supplies|supply|fields?)|refiner(y|ies)|pipelines?|shipping|shipbuild(ing|ers?)|airlines?|aerospace|aircraft|Boeing|Airbus|supply chains?|production|output|layoffs|job cuts|workers|trade unions?|labou?r unions?|construction|pharmaceuticals?|drugmakers?|tech (firms?|companies|giants?)|artificial intelligence|AI|data cent(re|er)s?|power plants?|utilities|telecoms?|start-?ups?|compan(y|ies)|firms?|corporat(e|ion|ions))\b/i,
  },
] as const;
type SubjectId = (typeof SUBJECTS)[number]["id"] | "all";

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
    const subject = SUBJECTS.some((x) => x.id === s.subject) ? (s.subject as SubjectId) : "all";
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

  // How many each place and subject holds, so a pick that would show nothing says so before it is pressed.
  const continentCount = useMemo(() => new Map(CONTINENTS.map((c) => [c, rows.filter(inWhere(`cont:${c}`)).length])), [rows]);
  const intlCount = useMemo(() => rows.filter(inWhere("intl")).length, [rows]);
  const here = useMemo(() => rows.filter(inWhere(where)), [rows, where]);
  const subjectCount = useMemo(() => new Map(SUBJECTS.map((s) => [s.id, here.filter((h) => s.re.test(h.title)).length])), [here]);
  const shown = useMemo(() => {
    const re = SUBJECTS.find((s) => s.id === subject)?.re;
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
  const subjectWords = subject === "all" ? "" : ` on ${SUBJECTS.find((s) => s.id === subject)?.label.toLowerCase()} subjects`;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold font-sans text-foreground flex items-center gap-3">
            <SiteMark />
            News
          </h1>
        </div>

        {/* Where: the whole world, between countries, a continent, or one country or US state. */}
        <FilterBar label="News by place" className="mb-3" status={done ? `${fmt(rows.length)} headlines read` : "Reading…"}>
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

        {/* What: the subject, by the words of the headline. */}
        <div role="group" aria-label="News by subject" className="flex flex-wrap gap-1.5 mb-1">
          <button type="button" onClick={() => setSubject("all")} aria-pressed={subject === "all"} className={chip(subject === "all")}>
            All subjects · {fmt(here.length)}
          </button>
          {SUBJECTS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSubject(s.id)} aria-pressed={subject === s.id} className={chip(subject === s.id)}>
              {s.label} · {fmt(subjectCount.get(s.id) ?? 0)}
            </button>
          ))}
        </div>

        <HeadlineList
          id="news-list"
          label="News"
          items={items}
          scrollClass="max-h-[min(48rem,75vh)]"
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
          is a match of the headline's words - "election", "tariffs", "wildfire", "missile", "factory" - so a headline can sit under
          more than one, or under none. ★ marks a place you follow.
        </p>
      </div>
    </div>
  );
}
