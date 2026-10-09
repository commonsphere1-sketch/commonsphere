/**
 * Subnations: the first-order divisions of every country - states, provinces,
 * regions, departments - and the counties of the United States.
 *
 * The page is a card for each country, drawn as the Countries page draws its
 * own. A country's card opens a window holding every one of its divisions, a
 * card each; a division's card opens the division's own window over it. The
 * United States' window also lists a state's counties, each with a window.
 *
 * A window is laid out as asked, in eight parts: Identity, Geography,
 * Government, Demographics, Economy, Society, Political data, Historical
 * trends. Each part lists the same fields for every division, and a field
 * the site holds nothing for is left out - it once said "Not held", and the
 * blank lines were taken off as asked - rather than being filled in or
 * left out, so a reader can see what is missing.
 *
 * Whose figure each one is, is said beside it:
 *
 *   the division's own   its names, code, kind, capital, area, borders,
 *                        legislature and population (subnations.ts: Natural
 *                        Earth, and its own Wikidata record); its head, only
 *                        where three records agree (representatives.ts); for
 *                        a US state, the Census Bureau's, the BEA's and the
 *                        BLS's figures the US States page shows; for a
 *                        county, the Census Bureau's.
 *   its country's        the economy and the measures of health, schooling
 *                        and poverty of a division outside the United
 *                        States. No body publishes them for every division
 *                        on one footing, so the country's stand in, named
 *                        as the country's - as a city's window does.
 *
 * A division's card also counts what lies inside it, and its window lists
 * it: its counties or districts, and its towns, cities and villages, as
 * GeoNames files them (DivisionPlaces - the places the World Maps page's
 * explorer lists).
 *
 * A change over time is worked out here from two published figures, and says
 * so. Nothing is estimated.
 *
 * A division's, a county's and a district's window is read in three parts,
 * chosen from a bar at its head: Overview, which is all about the place
 * itself; History, its article's; and Municipalities, the towns, cities and
 * villages inside it, a card each. The last stays in place behind the others,
 * so a search made in it is still there on the way back.
 *
 * Every window opens on a small map (components/OutlineMap): the place's
 * outline as the site's maps draw it, with the places listed inside it as
 * dots - a country's divisions, a division, a county, a district - and what
 * can be said of those places together (their largest as bars, their kinds).
 * A county adds what follows from its own Census figures: its density, its
 * share of its state and its rank. A district adds its own record where one
 * can be told to be its own (lib/liveRecord), and the figures of the
 * division and the country it lies in, named as theirs.
 *
 * A second-order division outside the United States - a county, district or
 * municipality - has a window too, reached from the Dashboard's map
 * (?open=district:<country>:<its place in the country's file>). The site
 * holds no figures for one: its window gives its name, the word its
 * publisher has for it, the first-order division it lies in, whose its
 * boundary is, and the places of GeoNames' list whose point lies inside its
 * outline - worked out here - each with a window of its own.
 *
 * A dot on any of these maps, pressed, goes straight to the place's own
 * window; from another page's map it comes here by a link
 * (?open=place:<country>:<its GeoNames id>), which opens the country's window
 * and the place's over it.
 *
 * ?open=<id> opens a division's window, ?open=county:<fips> a county's, and
 * ?country=<code>&name=<name> the division a map names - the Dashboard's map
 * sends its presses here that way.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowRight, Buildings, ClockCounterClockwise, ListBullets, MagnifyingGlass, MapPin, MapTrifold, TreeStructure, X } from "@phosphor-icons/react";
import { TONE } from "@/lib/chipTone";
import { ADMIN2_SOURCE, useAdmin2, useAdmin2Manifest } from "../lib/admin2";
import { DIVISION_DETAILS_SOURCES, useDivisionDetails, type DivisionDetails, type Money } from "../lib/divisionDetails";
import { liveRecord, type LiveRecord } from "../lib/liveRecord";
import { framed, placesWithin, useAdmin1, useCountyOutline } from "../lib/outlines";
import { flagColor } from "../lib/flagColor";
import { byPeople, countryPeople, peopleSource, peopleSources } from "../lib/countryPeople";
import { lockScroll } from "../lib/scrollLock";
import CountryQuality, { inSentence, qualityOf } from "../components/CountryQuality";
import { DivisionPlaces, PlaceHost, PlacesAnalysis, PlacesInside, insideOf, usePlaces, type Inside } from "../components/DivisionPlaces";
import { FilterBar } from "../components/FilterBar";
import { ArticlePanel } from "../components/HistoryPanel";
import { ChartNote, ChartTitle, FigureRow, MeasureBars, PartsBar, PartsDonut } from "../components/ModalCharts";
import { OutlineMap, placeDots, type MapDot } from "../components/OutlineMap";
import { SourceLink } from "../components/SourceLink";
import { countriesData } from "../data/countriesData";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { PLACES_SOURCE, type PlaceRow } from "../data/placesIndex";
import { REGIONAL_ASSEMBLIES, REPRESENTATIVES, REPRESENTATIVES_SOURCES } from "../data/representatives";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { usStatesData } from "../data/statesData";
import { SUBNATION_FLAG_FILE } from "../data/subnationFlagFiles";
import { SUBNATIONS, SUBNATIONS_RETRIEVED, SUBNATIONS_SOURCES, type Subnation } from "../data/subnations";
import type { UsCounty } from "../data/usCounties";

type Source = { label: string; url: string };
type CountyData = typeof import("../data/usCounties");
/** A field of a window: what it is, its value where one is held, and whose it is or for when. */
type Field = { label: string; value?: string | null; sub?: string };
type Part = { title: string; note?: string; fields: Field[]; extra?: ReactNode };

const COLOR = "#0ea5e9";
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : whole(v));
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const usd = (v: number) => `$${whole(v)}`;
/** An amount held in billions of dollars. */
const billions = (bn: number) => (bn >= 1000 ? `$${(bn / 1000).toFixed(2)}T` : bn >= 1 ? `$${bn.toFixed(1)}bn` : `$${Math.round(bn * 1000)}M`);
const coords = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
const flag = (cc: string, w = 40) => `https://flagcdn.com/w${w}/${cc.toLowerCase()}.png`;
/** A division's own flag, from Wikimedia Commons at a width: the file its Wikidata record names, kept only under a licence the site can use. */
const commonsFile = (file: string) => encodeURIComponent(file.replace(/ /g, "_"));
const commonsFlag = (s: Subnation, w: number) => (s.flag ? `https://commons.wikimedia.org/wiki/Special:FilePath/${commonsFile(s.flag)}?width=${w}` : null);
/** The flag as it is drawn: the copy saved with the site where there is one (static/flags/divisions, by build-subnation-flag-files.cjs), so that it comes with the page, and otherwise Commons' own. */
const ownFlag = (s: Subnation, w: number) => (s.flag ? (SUBNATION_FLAG_FILE[s.id] ? `/flags/divisions/${SUBNATION_FLAG_FILE[s.id]}` : commonsFlag(s, w)) : null);

const COUNTRY = new Map(countriesData.map((c) => [c.code, c]));
/** The countries that have divisions, by name. */
const COUNTRIES = [...new Set(SUBNATIONS.map((s) => s.cc))]
  .map((cc) => ({ cc, name: COUNTRY.get(cc)?.name ?? cc, count: SUBNATIONS.filter((s) => s.cc === cc).length }))
  .sort((a, b) => a.name.localeCompare(b.name));
const BY_ID = new Map(SUBNATIONS.map((s) => [s.id, s]));
/** Whose figures the countries' own populations are: what the page's first order goes by. */
const POP_SOURCES = peopleSources(COUNTRIES.map((c) => c.cc));

/** The heads three records agree on, by the place's Wikidata record and by its ISO 3166-2 code. */
const HEAD_BY_QID = new Map(REPRESENTATIVES.map((r) => [r[9], r]));
const HEAD_BY_CODE = new Map(REPRESENTATIVES.filter((r) => r[2]).map((r) => [r[2], r]));
const STATE_BY_CODE = new Map(usStatesData.map((s) => [`US-${s.abbreviation}`, s]));
const headOf = (s: Subnation) => (s.qid && HEAD_BY_QID.get(s.qid)) || (s.code && HEAD_BY_CODE.get(s.code)) || undefined;
/** A continent's chip, in the tones the Countries page gives them. */
const CONTINENT_TONE: Record<string, string> = { "North America": TONE.blue, Asia: TONE.amber, Europe: TONE.violet, "South America": TONE.emerald, Africa: TONE.orange, Oceania: TONE.teal, Antarctica: TONE.sky };

/** A country as the page lists it: its divisions, and what can be said of them together. */
type CountryRow = {
  cc: string;
  name: string;
  continent: string;
  capital: string;
  divisions: Subnation[];
  /** The kinds of division it has, the commonest first. */
  kinds: string[];
  /** How many have a dated, referenced population, and how many a head who is named. */
  counted: number;

  populous?: Subnation;
  widest?: Subnation;
};
const ROWS: CountryRow[] = COUNTRIES.map(({ cc, name }) => {
  const c = COUNTRY.get(cc);
  const divisions = SUBNATIONS.filter((s) => s.cc === cc).sort((a, b) => a.name.localeCompare(b.name));
  const tally = new Map<string, number>();
  for (const d of divisions) if (d.kind) tally.set(d.kind, (tally.get(d.kind) ?? 0) + 1);
  const most = (get: (s: Subnation) => number | undefined) => divisions.reduce<Subnation | undefined>((best, s) => (get(s) !== undefined && (best === undefined || get(s)! > get(best)!) ? s : best), undefined);
  return {
    cc,
    name,
    continent: c?.continent ?? "",
    capital: c?.capital && c.capital !== "None" ? c.capital : "",
    divisions,
    kinds: [...tally].sort((a, b) => b[1] - a[1]).map(([k]) => k),
    counted: divisions.filter((s) => s.pop).length,

    populous: most((s) => s.pop?.[1]),
    widest: most((s) => s.areaKm2),
  };
});
const ROW_OF = new Map(ROWS.map((r) => [r.cc, r]));

// ── A window's pieces ───────────────────────────────────────────────────────

/** The mark a category carries at its head, as the categories of the US States window's overview carry theirs. */
const PART_MARKS: [RegExp, string][] = [
  [/^Identity/, "🪪"],
  [/^Codes/, "🔢"],
  [/^Geography/, "🗺️"],
  [/^Government/, "🏛️"],
  [/^Demographics/, "👥"],
  [/^Economy/, "📊"],
  [/^Society/, "🎓"],
  [/^Political/, "🗳️"],
  [/^Historical/, "📈"],
  [/^Analysed/, "🧮"],
  [/^Its own record/, "📋"],
  [/^Its boundary/, "🧭"],
  [/^The division/, "🏷️"],
  [/^The country/, "🌍"],
];

/**
 * A category of a window's overview, laid out as the US States window lays its own out: its name with its mark, and its
 * figures as tiles, four across. Only what is held is set out, as asked: a field with nothing behind it is left out, and
 * a category with nothing in it is not shown at all. A short figure is a tile of its own; a longer one - a name, a list -
 * takes two tiles' width, and a long one the whole row, so that nothing is cut off.
 */
function Section({ part }: { part: Part }) {
  const fields = part.fields.filter((f) => f.value);
  if (!fields.length && !part.extra) return null;
  const mark = PART_MARKS.find(([re]) => re.test(part.title))?.[1];
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
          {mark ? `${mark} ` : ""}
          {part.title}
        </h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {part.note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">{part.note}</p>}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {fields.map((f) => {
            const long = f.value!.length;
            return (
              <div key={f.label} className={`modal-tile rounded-lg p-4 flex flex-col gap-1 min-w-0 ${long > 80 ? "col-span-2 sm:col-span-4" : long > 8 ? "col-span-2" : ""}`}>
                <p className="text-xs text-muted-foreground font-sans">{f.label}</p>
                <p className={`font-bold text-foreground break-words ${long > 34 ? "text-sm font-sans leading-snug" : long > 8 ? "text-base font-sans leading-snug" : "text-xl font-mono"}`}>{f.value}</p>
                {f.sub && <p className="text-xs text-muted-foreground font-sans leading-snug">{f.sub}</p>}
              </div>
            );
          })}
        </div>
      )}
      {part.extra}
    </section>
  );
}

/** A population over the years, as a line with its years and its figures. */
function SeriesChart({ points, label }: { points: [number, number][]; label: string }) {
  return (
    <div className="modal-tile rounded-xl p-3 mt-2" role="img" aria-label={`${label}: ${points.map(([y, v]) => `${y} ${people(v)}`).join(", ")}.`}>
      <ResponsiveContainer width="100%" height={170}>
        <AreaChart data={points.map(([year, v]) => ({ year, v }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="subnation-series" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tick={{ fontSize: 9, fontFamily: "monospace", fill: "currentColor" }} axisLine={false} tickLine={false} tickCount={6} />
          <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "currentColor" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => people(v)} domain={[0, "auto"]} />
          <Tooltip formatter={(v: number) => [whole(v), "People"]} labelFormatter={(y) => String(y)} contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 11 }} />
          <Area type="monotone" dataKey="v" stroke={COLOR} strokeWidth={1.75} fill="url(#subnation-series)" dot={{ r: 2, fill: COLOR }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * The shell of a window, as a city's and a country's is drawn. A division's window opens over its country's, so only
 * the one on top answers Escape, and each puts the page's scrolling back as it found it.
 */
function Window({
  title,
  kicker,
  flagSrc,
  chips,
  onClose,
  onBack,
  children,
  wide = false,
  top = true,
  hidden = false,
}: {
  title: string;
  kicker: string;
  /** The flag at its head: the place's own. */
  flagSrc: string;
  chips: string[];
  /** Out of every window, back to the page. */
  onClose: () => void;
  /** Back to the window this one was opened from, where there is one. */
  onBack?: () => void;
  children: ReactNode;
  wide?: boolean;
  top?: boolean;
  /** Out of sight while a window opened from it is the one being read: one window at a time, as asked. It keeps its place for the way back. */
  hidden?: boolean;
}) {
  useEffect(() => {
    if (!top) return;
    // Escape goes back one window, as the back button does.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (onBack ?? onClose)();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onBack, top]);
  useEffect(() => lockScroll(), []);
  return (
    <div className={`fixed inset-0 z-50 items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in ${hidden ? "hidden" : "flex"}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative z-10 rounded-2xl w-full max-h-[90vh] shadow-2xl modal-glass border overflow-y-auto ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={flagSrc} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{kicker}</p>
                <h2 className="text-2xl font-bold font-sans text-foreground leading-tight">{title}</h2>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {chips.map((c) => (
                    <span key={c} className="text-[11px] font-sans border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onBack && (
                <button onClick={onBack} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Back to the window before" title="Back">
                  <ArrowLeft size={18} />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close" title="Close">
                <X size={18} />
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const LinkButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
    {children} <ArrowRight size={11} weight="bold" aria-hidden />
  </button>
);

/** The parts a place's window is read in: the place itself, its history, and the towns inside it. */
type WinTab = "overview" | "history" | "municipalities";
/** The bar at the head of a place's window, drawn as a town's and a city's windows draw theirs. */
function TabBar({ tab, onTab, count }: { tab: WinTab; onTab: (t: WinTab) => void; /** How many places the Municipalities part lists, where that is known. */ count?: number }) {
  const tabs = [
    { key: "overview", label: "Overview", icon: <ListBullets size={14} /> },
    { key: "history", label: "History", icon: <ClockCounterClockwise size={14} /> },
    { key: "municipalities", label: count != null ? `Municipalities · ${whole(count)}` : "Municipalities", icon: <Buildings size={14} /> },
  ] as const;
  return (
    <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 modal-tabs" role="group" aria-label="The parts of this window">
      {tabs.map((x) => (
        <button
          key={x.key}
          type="button"
          onClick={() => onTab(x.key)}
          aria-pressed={tab === x.key}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-all duration-200 cursor-pointer ${tab === x.key ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}
        >
          {x.icon}
          {x.label}
        </button>
      ))}
    </div>
  );
}
const noHistory = (name: string) => <p className="text-xs font-sans text-muted-foreground py-6 text-center">Not held: no article is recorded for {name}, so no history is shown rather than another place's.</p>;

// ── A division's window ─────────────────────────────────────────────────────

/** An amount of money as it is printed: the amount, in words where it is large, and its currency. */
const money = (m: Money) => `${m[1] >= 1e12 ? `${(m[1] / 1e12).toFixed(2)} trillion` : m[1] >= 1e9 ? `${(m[1] / 1e9).toFixed(2)} billion` : m[1] >= 1e6 ? `${(m[1] / 1e6).toFixed(2)} million` : whole(m[1])} ${m[2]}`;
/** A field that is there only where something is held for it: what more a division's record gives is not the same from one division to the next. */
const held = (label: string, value: string | undefined | null | false, sub?: string): Field[] => (value ? [{ label, value, sub }] : []);

function partsOf(s: Subnation, d?: DivisionDetails): { parts: Part[]; sources: Source[] } {
  const c = COUNTRY.get(s.cc);
  const country = c?.name ?? s.cc;
  const state = STATE_BY_CODE.get(s.code ?? "");
  const m = state ? STATE_INDICATORS[state.id] : undefined;
  const head = headOf(s);
  const sources = new Map<string, Source>();
  const cite = (x: Source) => sources.set(x.label, { label: x.label, url: x.url });
  cite(SUBNATIONS_SOURCES.naturalEarth);
  if (s.qid) cite({ label: `Wikidata (CC0) — ${s.name}'s record, ${s.qid}`, url: `https://www.wikidata.org/wiki/${s.qid}` });
  const wd = "its Wikidata record";

  // Growth over about ten years: the latest figure on the earliest one within ten years of it, or on the one before it where the counts are further apart.
  const earlier = s.pop && s.series ? (s.series.find(([y]) => y >= s.pop![0] - 10 && y < s.pop![0]) ?? s.series[s.series.length - 2]) : undefined;
  const growth = s.pop && earlier && earlier[0] < s.pop[0] && earlier[1] > 0 ? { pct: (100 * (s.pop[1] - earlier[1])) / earlier[1], from: earlier, to: s.pop } : null;

  // Its economy and society: its own for a US state, and its country's - said to be so - for any other.
  const ci = COUNTRY_INDICATORS[s.cc];
  const quality = m ? null : qualityOf(s.cc, country);
  const theirs = `${country}, the country`;
  const row = (group: string, label: string): Field => {
    const r = quality?.groups.find((g) => g.title === group)?.rows.find((x) => x.label === label);
    if (r?.from) cite(r.from);
    return { label, value: r?.value, sub: r ? `${theirs} · ${r.sub}` : undefined };
  };
  if (m) [STATE_SOURCES.population, STATE_SOURCES.acs, STATE_SOURCES.bea, STATE_SOURCES.bls, STATE_SOURCES.fec, STATE_SOURCES.congress].forEach(cite);
  else if (ci) cite({ label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url });
  if (head) cite(REPRESENTATIVES_SOURCES.wikidata), cite(REPRESENTATIVES_SOURCES.wikipedia);
  if (s.flag) cite(SUBNATIONS_SOURCES.commons);
  if (d?.postal) cite(DIVISION_DETAILS_SOURCES.postal);
  /** Said beside a figure that is the division's own, from its record: its year, and that the record cites a source for it. */
  const own = (year: number) => `${year} · its own · a dated, sourced figure in ${wd}`;
  const ownMoney = Boolean(d?.gdp || d?.gdpPc || d?.income || d?.unemployment);

  /* ── Its charts, each in the category it belongs to and drawn with the site's own: parts of a whole as one bar, one measure across things as bars on a shared scale. Each is there only where its figures are. ── */
  const tone = flagColor(s.cc) ?? COLOR;
  const chartTile = "modal-tile rounded-xl p-4 mt-2 flex flex-col gap-4";
  const share = (a: number, b: number) => Number(((100 * a) / (a + b)).toFixed(1));
  const sexes = d?.women && d?.men && d.women[0] === d.men[0] ? { year: d.women[0], women: d.women[1], men: d.men[1] } : null;
  const settled = d?.urban && d?.rural && d.urban[0] === d.rural[0] && d.urban[1] + d.rural[1] > 0 ? { year: d.urban[0], urban: d.urban[1], rural: d.rural[1] } : null;
  const countryPop = countryPeople(s.cc);
  const ofCountry = !m && s.pop && countryPop && s.pop[1] < countryPop.v ? Number(((100 * s.pop[1]) / countryPop.v).toFixed(s.pop[1] / countryPop.v < 0.01 ? 2 : 1)) : null;
  const peopleCharts =
    m || sexes || settled || ofCountry !== null ? (
      <div className={chartTile}>
        {m && (
          <div>
            <ChartTitle>
              Age · % of people · {m.ageGroups.y}
            </ChartTitle>
            <PartsBar label={`The people of ${s.name} by age, ${m.ageGroups.y}`} parts={m.ageGroups.groups.map((g) => ({ label: g.group, value: g.pct, text: `${g.pct}%` }))} columns={3} />
          </div>
        )}
        {m && (
          <div>
            <ChartTitle>
              Origins · % of people · {m.ethnicity.y}
            </ChartTitle>
            <PartsDonut label={`The people of ${s.name} by origin, ${m.ethnicity.y}`} parts={m.ethnicity.groups.map((g) => ({ label: g.group, value: g.pct, text: `${g.pct}%` }))} />
          </div>
        )}
        {sexes && (
          <div>
            <ChartTitle>Women and men · {sexes.year}</ChartTitle>
            <PartsBar
              label={`The people of ${s.name} by sex, ${sexes.year}`}
              parts={[
                { label: "Women", value: sexes.women, text: `${share(sexes.women, sexes.men)}% · ${whole(sexes.women)}`, color: "#ec4899" },
                { label: "Men", value: sexes.men, text: `${share(sexes.men, sexes.women)}% · ${whole(sexes.men)}`, color: "#3b82f6" },
              ]}
            />
          </div>
        )}
        {settled && (
          <div>
            <ChartTitle>In towns and in the country · {settled.year}</ChartTitle>
            <PartsBar
              label={`The people of ${s.name} by where they live, ${settled.year}`}
              parts={[
                { label: "Urban", value: settled.urban, text: `${share(settled.urban, settled.rural)}% · ${whole(settled.urban)}` },
                { label: "Rural", value: settled.rural, text: `${share(settled.rural, settled.urban)}% · ${whole(settled.rural)}` },
              ]}
            />
          </div>
        )}
        {ofCountry !== null && (
          <div>
            <ChartTitle>Of {inSentence(country)}'s people</ChartTitle>
            <PartsBar
              label={`${s.name}'s share of the people of ${country}`}
              parts={[
                { label: s.name, value: ofCountry, text: `${ofCountry}%`, color: tone },
                { label: `The rest of ${inSentence(country)}`, value: Number((100 - ofCountry).toFixed(2)), text: `${(100 - ofCountry).toFixed(ofCountry < 1 ? 2 : 1)}%`, color: "#94a3b8" },
              ]}
            />
            <ChartNote>
              Worked out here: its {people(s.pop![1])} people in {s.pop![0]}, over {inSentence(country)}'s {people(countryPop!.v)} in {countryPop!.y}. The two are not of one year or one source, so the share is near and not exact.
            </ChartNote>
          </div>
        )}
        {(sexes || settled) && <ChartNote>The shares are worked out here from the two figures its Wikidata record gives for the year.</ChartNote>}
      </div>
    ) : undefined;
  /** One measure, the division's own beside its country's: two bars on one scale, each with its year. */
  const beside = (title: string, mine: [number, number] | undefined, theirsOf: { v: number; y: string } | undefined, unit: string, max?: number) =>
    !m && mine && theirsOf ? (
      <div>
        <ChartTitle>{title}</ChartTitle>
        <MeasureBars
          max={max}
          label={`${title}: ${s.name} beside ${country}`}
          rows={[
            { key: "own", label: `${s.name} · its own`, value: mine[1], text: `${mine[1]}${unit}`, sub: String(mine[0]), color: tone },
            { key: "theirs", label: country, value: theirsOf.v, text: `${theirsOf.v}${unit}`, sub: theirsOf.y, color: "#94a3b8" },
          ]}
        />
      </div>
    ) : null;
  const workChart = beside("Unemployment · % of the labour force", d?.unemployment, ci?.unemploymentRate, "%", undefined);
  const lifeChart = beside("Life expectancy · years", d?.lifeExp, ci?.lifeExpectancy, " years", undefined);
  const readers = quality?.groups.find((g) => g.title === "Education")?.rows.find((x) => x.label === "Adults who can read");
  const readChart = beside("Adults who can read · %", d?.literacy, readers && Number.isFinite(parseFloat(readers.value)) ? { v: parseFloat(readers.value), y: readers.sub } : undefined, "%", 100);
  const voteChart = m ? (
    <div className={chartTile}>
      <div>
        <ChartTitle>The 2024 presidential vote · % · {m.voterShare.y}</ChartTitle>
        <PartsBar
          label={`The 2024 presidential vote in ${s.name}`}
          parts={m.voterShare.groups.map((g) => ({ label: g.party, value: g.pct, text: `${g.pct}%`, color: /democrat/i.test(g.party) ? "#3b82f6" : /republican/i.test(g.party) ? "#ef4444" : undefined }))}
        />
      </div>
    </div>
  ) : undefined;
  if (s.capitalBy === "gn") cite(SUBNATIONS_SOURCES.geonames);
  if (s.popBy || s.areaBy || s.flagBy || s.capitalBy === "wp") cite(SUBNATIONS_SOURCES.wikipedia);
  /** Said beside a value that is the infobox's and not the record's. */
  const box = "the infobox of its Wikipedia article";
  const poor = m?.poverty.groups.find((g) => g.label === "Below poverty line")?.pct;
  // The list names a region in English; Natural Earth may name it in its own language, so its article's title is tried too.
  const chair = (REGIONAL_ASSEMBLIES[s.cc] ?? []).find((a) => a[0] === s.name || a[0] === s.article);
  if (chair) cite(REPRESENTATIVES_SOURCES.chambers);

  const parts: Part[] = [
    {
      title: "Identity",
      fields: [
        { label: "Common name", value: s.name },
        { label: "Official name", value: s.official, sub: wd },
        { label: "Name in its own language", value: s.native, sub: wd },
        { label: "ISO 3166-2 code", value: s.code },
        { label: "Country", value: country, sub: `ISO 3166-1: ${s.cc}` },
        { label: "Flag", value: s.flag ? "Shown above" : null, sub: s.flag ? `Wikimedia Commons · ${s.flagLicence}${s.flagBy ? ` · the one ${box} shows` : ""}` : undefined },
        { label: "Political status", value: s.kind ? `${s.kind} of ${country}` : null, sub: "as Natural Earth names it" },
        { label: "Founded", value: s.founded ? (s.founded < 0 ? `${-s.founded} BC` : String(s.founded)) : null, sub: wd },
        ...held("Named after", d?.namedAfter?.join(", "), wd),
        ...held("Demonym", d?.demonym?.join(", "), wd),
        ...held("Nickname", d?.nickname?.join(", "), wd),
        ...held("Motto", d?.motto, wd),
        ...held("Twinned with", d?.twins?.join(", "), wd),
      ],
    },
    {
      title: "Codes",
      note: "Its postal codes are the ones GeoNames lists at a point inside its outline, counted here and put in order - GeoNames' list is not whole in every country, and says so. Its other codes are as its Wikidata record states them.",
      fields: [
        {
          label: "Postal codes",
          value: d?.postal ? (d.postal.n > 1 ? `${d.postal.from} to ${d.postal.to}` : d.postal.from) : null,
          sub: d?.postal ? `${whole(d.postal.n)} ${d.postal.n === 1 ? "code" : "codes"} in ${whole(d.postal.places)} ${d.postal.places === 1 ? "place" : "places"}, as GeoNames lists them · the first and the last in order` : undefined,
        },
        ...held("Postal codes, as its record states them", d?.postalOwn?.join(", "), wd),
        { label: "ISO 3166-2 code", value: s.code },
        ...held("Dialling code", d?.dial?.join(", "), wd),
        ...held("Vehicle registration code", d?.plate?.join(", "), wd),
        ...held("Time zone", d?.tz?.join(", "), wd),
        ...held("FIPS 10-4 code", d?.fips, wd),
        ...held("NUTS code", d?.nuts, wd),
        ...held("HASC code", d?.hasc, wd),
        ...held("OpenStreetMap relation", d?.osm, wd),
      ],
    },
    {
      title: "Geography",
      fields: [
        { label: "Continent", value: c?.continent },
        { label: `Region of ${country}`, value: s.region },
        { label: "Capital", value: s.capital, sub: s.capitalBy === "gn" ? "the seat GeoNames marks for it" : s.capitalBy === "wp" ? `its seat, as ${box} names it` : wd },
        { label: "Area", value: s.areaKm2 ? `${whole(s.areaKm2)} km²` : null, sub: s.areaBy ? `as ${box} gives it` : wd },
        { label: "Borders", value: s.borders?.join(", "), sub: undefined },
        { label: "Coordinates", value: coords(s.lat, s.lon), sub: "its label point" },
        ...held("Elevation", d?.elevation != null && `${whole(d.elevation)} m`, wd),
        ...held("Highest point", d?.highest, wd),
        ...held("Water", d?.water != null && `${d.water}% of its area`, wd),
      ],
    },
    {
      title: "Government",

      fields: [
        { label: "System", value: c?.governmentType, sub: theirs },
        // Its head is named only where one is confirmed - a US state's governor, or a person three records agree on. The line is left out otherwise, as asked, and not shown as "Not held".
        ...(m
          ? [{ label: "Head of government", value: m.governor.name, sub: `Governor · ${m.governor.party} · since ${m.governor.since.slice(0, 4)}` }]
          : head
            ? [{ label: "Head of government", value: head[3], sub: `${head[4]}${head[5] ? ` · since ${head[5]}` : ""} · three records agree` }]
            : []),

        { label: "Legislature", value: s.legislature, sub: wd },
        { label: "Judiciary", value: null },
        { label: "Administrative structure", value: s.kind ? `${s.kind}${s.within ? `, within ${s.within}` : ""}` : null },
        { label: "Electoral system", value: null },
        ...held("The office of its head", d?.headOffice, wd),
        ...held("Official language", d?.langs?.join(", "), wd),
        ...held("Divisions inside it", d?.parts != null && whole(d.parts), `as ${wd} lists them`),
      ],
    },
    {
      title: "Demographics",
      fields: [
        m
          ? { label: "Population", value: people(m.population.v), sub: `Census Bureau · ${m.population.y}` }
          : {
              label: "Population",
              value: s.pop ? people(s.pop[1]) : null,
              sub: s.pop
                ? s.popBy === "wp"
                  ? `${s.pop[0]} · dated in ${wd}, which cites no source for it; ${box} gives the same figure`
                  : s.popBy === "wpOnly"
                    ? `${s.pop[0]} · as ${box} gives it, with that year; ${wd} holds no dated figure`
                    : `${s.pop[0]} · a dated, referenced figure in ${wd}`
                : undefined,
            },
        {
          label: "Population growth",
          value: growth ? signed(growth.pct) : null,
          sub: growth ? `${people(growth.to[1])} in ${growth.to[0]} on ${people(growth.from[1])} in ${growth.from[0]} · worked out here from the two figures in ${wd}` : undefined,
        },
        { label: "Age", value: m ? `${m.medianAge.v} years` : null, sub: m ? `median age · ${m.medianAge.y}` : undefined },
        { label: "Urbanization", value: null },
        { label: "Migration", value: null },
        ...held("Women", d?.women && whole(d.women[1]), d?.women && own(d.women[0])),
        ...held("Men", d?.men && whole(d.men[1]), d?.men && own(d.men[0])),
        ...held("Households", d?.households && whole(d.households[1]), d?.households && own(d.households[0])),
        ...held("Urban population", d?.urban && whole(d.urban[1]), d?.urban && own(d.urban[0])),
        ...held("Rural population", d?.rural && whole(d.rural[1]), d?.rural && own(d.rural[0])),
        ...held("Fertility", d?.fertility && `${d.fertility[1]} children a woman`, d?.fertility && own(d.fertility[0])),
      ],
      extra: peopleCharts,
    },
    {
      title: "Economy",
      note: m
        ? undefined
        : ownMoney
          ? `No body publishes these for every division on one footing. The ones marked its own are from ${wd}, each dated and sourced there; the rest are ${country}'s.`
          : `No body publishes these for every division on one footing. The figures are ${country}'s.`,
      fields: m
        ? [
            { label: "GDP", value: billions(m.gdp.v), sub: `Bureau of Economic Analysis · ${m.gdp.y}` },
            { label: "Personal income per person", value: usd(m.averageIncome.v), sub: `a year · ${m.averageIncome.y}` },
            { label: "Median household income", value: usd(m.medianIncome.v), sub: `a year · ${m.medianIncome.y}` },
            { label: "Inflation", value: null },
            { label: "Unemployment", value: `${m.unemploymentRate.v}%`, sub: `Bureau of Labor Statistics · ${m.unemploymentRate.y}${m.unemploymentRate.prelim ? " (preliminary)" : ""}` },
            { label: "Trade", value: null },
          ]
        : [
            ...held("GDP · its own", d?.gdp && money(d.gdp), d?.gdp && own(d.gdp[0])),
            ...held("GDP per person · its own", d?.gdpPc && money(d.gdpPc), d?.gdpPc && own(d.gdpPc[0])),
            ...held("Median income · its own", d?.income && money(d.income), d?.income && own(d.income[0])),
            ...held("Unemployment · its own", d?.unemployment && `${d.unemployment[1]}%`, d?.unemployment && own(d.unemployment[0])),
            { label: "GDP", value: ci?.gdp ? billions(ci.gdp.v) : null, sub: ci?.gdp ? `${theirs} · ${ci.gdp.y}` : undefined },
            { label: "GDP per person", value: ci?.gdpPerCapita ? usd(ci.gdpPerCapita.v) : null, sub: ci?.gdpPerCapita ? `${theirs} · ${ci.gdpPerCapita.y}` : undefined },
            { label: "Inflation", value: ci?.inflationRate ? `${ci.inflationRate.v}%` : null, sub: ci?.inflationRate ? `${theirs} · ${ci.inflationRate.y}` : undefined },
            { label: "Unemployment", value: ci?.unemploymentRate ? `${ci.unemploymentRate.v}%` : null, sub: ci?.unemploymentRate ? `${theirs} · ${ci.unemploymentRate.y}` : undefined },
            { label: "Trade", value: null },
          ],
      extra: workChart ? <div className={chartTile}>{workChart}</div> : undefined,
    },
    {
      title: "Society",
      note: m ? undefined : `As with its economy, these are ${country}'s.`,
      fields: m
        ? [
            { label: "Education: a bachelor's degree or higher", value: `${m.education.bachelorsOrHigherPct}%`, sub: `of people 25 and over · ${m.education.y}` },
            { label: "Education: finished high school", value: `${m.education.highSchoolOrHigherPct}%`, sub: `of people 25 and over · ${m.education.y}` },
            { label: "Health", value: null },
            { label: "Inequality", value: null },
            { label: "Poverty: below the poverty line", value: poor != null ? `${poor}%` : null, sub: `of people · ${m.poverty.y}` },
            { label: "Development: homes lived in by their owner", value: `${m.housing.homeOwnershipPct}%`, sub: `of occupied homes · ${m.housing.y}` },
          ]
        : [
            ...held("Education: adults who can read · its own", d?.literacy && `${d.literacy[1]}%`, d?.literacy && own(d.literacy[0])),
            ...held("Health: life expectancy · its own", d?.lifeExp && `${d.lifeExp[1]} years`, d?.lifeExp && own(d.lifeExp[0])),
            { ...row("Education", "Adults who can read"), label: "Education: adults who can read" },
            { ...row("Education", "Years of schooling"), label: "Education: years of schooling" },
            { ...row("Health", "Life expectancy"), label: "Health: life expectancy" },
            { label: "Inequality", value: null },
            { ...row("Economy", "Below the national poverty line"), label: "Poverty: below the national poverty line" },
            { ...row("Business", "People using the internet"), label: "Development: people using the internet" },
          ],
      extra:
        lifeChart || readChart ? (
          <div className={chartTile}>
            {readChart}
            {lifeChart}
          </div>
        ) : undefined,
    },
    {
      title: "Political data",
      fields: m
        ? [
            { label: "Elections: the 2024 presidential vote", value: m.voterShare.groups.map((g) => `${g.party} ${g.pct}%`).join(" · "), sub: `Federal Election Commission · ${m.voterShare.y}` },
            { label: "Parties: the governor's", value: m.governor.party },
            { label: "Representatives: senators", value: m.senators.map((x) => `${x.name} (${x.party[0]})`).join(" · "), sub: "US Senate" },
            { label: "Representatives: seats in the House", value: String(m.houseSeats.v), sub: m.houseSeats.y },

            { label: "Political institutions", value: s.legislature, sub: wd },
          ]
        : [
            { label: "Elections", value: null },
            { label: "Parties", value: null },
            { label: "Representatives", value: chair ? chair[3] : null, sub: chair ? `${chair[2]} of the ${chair[1]} · named by the list and by the assembly's own article` : undefined },
            { label: "Political institutions", value: s.legislature, sub: wd },
          ],
      extra: voteChart,
    },
    {
      title: "Historical trends",
      note: s.series ? `Its population in every year ${wd} holds a dated, referenced figure for.` : undefined,
      fields: s.series ? [] : [{ label: "Population over the years", value: null }],
      extra: s.series ? <SeriesChart points={s.series} label={`${s.name}'s population`} /> : undefined,
    },
  ];
  return { parts, sources: [...sources.values()] };
}

function SubnationWindow({ s, onBack, onClose, onCounties }: { s: Subnation; /** Back to its country's window. */ onBack: () => void; onClose: () => void; onCounties: (abbr: string) => void }) {
  /** Whether one of its places has its window open: this one is then out of sight, until the reader comes back. */
  const [placeOpen, setPlaceOpen] = useState(false);
  const navigate = useNavigate();
  const c = COUNTRY.get(s.cc);
  const state = STATE_BY_CODE.get(s.code ?? "");
  /* What more is held of it - its postal and other codes, its languages, its own economy and people - fetched with its country's file. */
  const details = useDivisionDetails(s.cc)?.[s.id];
  const { parts, sources } = useMemo(() => partsOf(s, details), [s, details]);

  /* Its outline, among the ones the site's maps draw for its country, and the places GeoNames lists in it: the map at the head of its window. */
  const drawn = useAdmin1(s.cc);
  const outline = useMemo(() => (drawn ? drawn.filter((f) => f.properties.n === s.name) : []), [drawn, s.name]);
  const listed = usePlaces(s.cc);
  const within = useMemo(() => (listed ? insideOf(listed, s) : null), [listed, s]);
  const dots = useMemo(() => placeDots(within?.rows ?? [], 300, listed), [within, listed]);
  const [tab, setTab] = useState<WinTab>("overview");
  /** The place whose dot on the map was pressed: its window opens over this one. */
  const [picked, setPicked] = useState<PlaceRow | null>(null);
  const pick = (d: MapDot) => setPicked(listed?.places.find((p) => p[6] === d.id) ?? null);
  /* Where it stands among its country's divisions, by the latest population and the area each one's record holds: counted here. */
  const peers = useMemo(() => SUBNATIONS.filter((x) => x.cc === s.cc), [s.cc]);
  const byPeople = useMemo(() => peers.filter((x) => x.pop).sort((a, b) => b.pop![1] - a.pop![1]), [peers]);
  const byArea = useMemo(() => peers.filter((x) => x.areaKm2).sort((a, b) => b.areaKm2! - a.areaKm2!), [peers]);
  const peopleAt = byPeople.findIndex((x) => x.id === s.id) + 1;
  const areaAt = byArea.findIndex((x) => x.id === s.id) + 1;
  /** The five at the head of a list, and this one after them where it is not among them. */
  const beside = (list: Subnation[], at: number) => [...list.slice(0, 5), ...(at > 5 ? [s] : [])];
  /* Where a reader can check it: its own site first, then the reference records, Wikipedia last. */
  const read: Source[] = [
    ...(s.site ? [{ label: `${s.name} — official website`, url: s.site }] : []),
    ...(s.qid ? [{ label: "Wikidata record", url: `https://www.wikidata.org/wiki/${s.qid}` }] : []),
    ...(s.gn ? [{ label: "GeoNames", url: `https://www.geonames.org/${s.gn}` }] : []),
    ...(s.flag ? [{ label: `Its flag on Wikimedia Commons (${s.flagLicence}), with its author`, url: `https://commons.wikimedia.org/wiki/File:${commonsFile(s.flag)}` }] : []),
    { label: `ISO 3166 — ${c?.name ?? s.cc} and its subdivisions`, url: `https://www.iso.org/obp/ui/#iso:code:3166:${s.cc}` },
    ...(s.article ? [{ label: `Wikipedia — ${s.article}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.article.replace(/ /g, "_"))}` }] : []),
  ];
  return (
    <Window wide top={!placeOpen} hidden={placeOpen} onBack={onBack} title={s.name} kicker={`${s.kind || "Division"} · ${c?.name ?? s.cc}`} flagSrc=
{ownFlag(s, 250) ?? flag(s.cc, 160)} chips={[...(s.code ? [s.code] : []), ...(s.capital ? [`Capital: ${s.capital}`] : []), ...(s.region ? [s.region] : [])]} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {c && <LinkButton onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}>Open {c.name}</LinkButton>}
        {state && <LinkButton onClick={() => navigate(`/dashboard/states?open=${state.id}`)}>Open {state.name} on the US States page</LinkButton>}
        {state && <LinkButton onClick={() => onCounties(state.abbreviation)}>Its counties</LinkButton>}
        <LinkButton onClick={() => navigate(`/dashboard/maps?country=${s.cc}`)}>
          <MapTrifold size={12} aria-hidden /> On the map
        </LinkButton>
      </div>
      <TabBar tab={tab} onTab={setTab} count={within?.rows.length} />
      {tab === "overview" && outline.length > 0 && (
        <div>
          <OutlineMap shapes={outline} dots={dots} color={flagColor(s.cc) ?? COLOR} label={`The outline of ${s.name}, with ${dots.length} of the places listed in it`} onDot={pick} />
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
            {s.name} as the site's maps draw it{dots.length ? `, with ${within!.rows.length > dots.length ? `the ${dots.length} largest of the ${whole(within!.rows.length)}` : `the ${dots.length}`} places GeoNames lists in it as dots` : ""}.
          </p>
        </div>
      )}
      {/* Overview: all about the division itself - where it stands among its country's, and its own record in its eight parts. */}
      {tab === "overview" && (
        <>
          {!state && peers.length > 1 && (peopleAt > 0 || areaAt > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Among {inSentence(c?.name ?? s.cc)}'s divisions</h3>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-1.5">
                Its place among the {peers.length} divisions held for {inSentence(c?.name ?? s.cc)}, counted here from the population and the area each one's record holds. Each population is the
                latest its record gives, so the years are not all one: each is beside its figure.
              </p>
              <div className="modal-tile rounded-xl px-4 py-1.5">
                {peopleAt > 0 && <FigureRow label="By population" value={`${peopleAt} of ${byPeople.length}`} sub="among those with a population held, the largest first" />}
                {areaAt > 0 && <FigureRow label="By area" value={`${areaAt} of ${byArea.length}`} sub="among those with an area held, the widest first" />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {peopleAt > 0 && (
                  <div className="modal-tile rounded-xl p-4">
                    <ChartTitle>Beside the most populous · people</ChartTitle>
                    <MeasureBars
                      label={`${s.name} beside the most populous divisions of ${c?.name ?? s.cc}`}
                      rows={beside(byPeople, peopleAt).map((x) => ({ key: x.id, label: x.id === s.id ? `${x.name} · this one` : x.name, value: x.pop![1], text: people(x.pop![1]), sub: String(x.pop![0]), color: x.id === s.id ? (flagColor(s.cc) ?? COLOR) : undefined }))}
                    />
                  </div>
                )}
                {areaAt > 0 && (
                  <div className="modal-tile rounded-xl p-4">
                    <ChartTitle>Beside the widest · km²</ChartTitle>
                    <MeasureBars
                      label={`${s.name} beside the widest divisions of ${c?.name ?? s.cc}`}
                      rows={beside(byArea, areaAt).map((x) => ({ key: x.id, label: x.id === s.id ? `${x.name} · this one` : x.name, value: x.areaKm2!, text: whole(x.areaKm2!), color: x.id === s.id ? (flagColor(s.cc) ?? COLOR) : undefined }))}
                    />
                  </div>
                )}
              </div>
            </section>
          )}
          {/* Its largest places, as bars: the head of the list the Municipalities part holds whole. */}
          {within && within.rows.filter((p) => p[3] > 0).length > 1 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🏙️ Its largest places</h3>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="modal-tile rounded-xl p-4">
                <ChartTitle>People, as GeoNames has them · undated</ChartTitle>
                <MeasureBars
                  color={flagColor(s.cc) ?? COLOR}
                  label={`The largest places of ${s.name} by their people`}
                  rows={within.rows
                    .filter((p) => p[3] > 0)
                    .slice(0, 6)
                    .map((p) => ({ key: String(p[6]), label: p[0], value: p[3], text: whole(p[3]) }))}
                />
              </div>
              <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
                The first of the {whole(within.rows.length)} places GeoNames lists in {s.name}; all of them, a card each, are under Municipalities.
              </p>
            </section>
          )}
          {parts.map((p) => (
            <Section key={p.title} part={p} />
          ))}
          <div>
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1">Where to read more</p>

            <SourceLink sources={read} />
          </div>
        </>
      )}
      {/* History: its article's, as the other pages' windows tell a place's. */}
      {tab === "history" && (
        <>
          {s.founded && (
            <div className="modal-tile rounded-xl px-4 py-1.5">
              <FigureRow label="Founded" value={String(s.founded)} sub="as its Wikidata record gives it" />
            </div>
          )}
          {s.article ? <ArticlePanel title={s.article} name={s.name} mode="history" /> : noHistory(s.name)}
        </>
      )}
      {/* Municipalities: what lies inside it - its counties or districts, and its towns, cities and villages, a card each with a window of its own. Kept in place behind the other parts. */}
      <div className={tab === "municipalities" ? "flex flex-col gap-5" : "hidden"}>
        <DivisionPlaces s={s} country={c?.name ?? s.cc} onPlace={setPlaceOpen} onCloseAll={onClose} />
        {within && <PlacesAnalysis rows={within.rows} name={s.name} />}
      </div>
      <SourceLink sources={sources} />
      {picked && listed && <PlaceHost place={picked} file={listed} division={() => s} country={c?.name ?? s.cc} onPlace={setPlaceOpen} onDone={() => setPicked(null)} onCloseAll={onClose} />}
    </Window>
  );
}

// ── A county's window ───────────────────────────────────────────────────────

function CountyWindow({ county, data, onBack, onClose }: { county: UsCounty; data: CountyData; /** Back to the list of its state's counties. */ onBack: () => void; onClose: () => void }) {
  const navigate = useNavigate();
  const [fips, name, abbr, lat, lon, land, water, pops, births, deaths, international, domestic] = county;
  const years = data.US_COUNTY_YEARS;
  const state = usStatesData.find((s) => s.abbreviation === abbr);
  const last = years[years.length - 1];
  const now = pops[pops.length - 1];
  const change = pops[0] > 0 ? (100 * (now - pops[0])) / pops[0] : null;
  const year = `the year to 1 July ${last}`;
  /** Whether one of its places has its window open: this one is then out of sight, until the reader comes back. */
  const [placeOpen, setPlaceOpen] = useState(false);
  const [tab, setTab] = useState<WinTab>("overview");
  /** The place whose dot on the map was pressed: its window opens over this one. */
  const [picked, setPicked] = useState<PlaceRow | null>(null);
  /* Its outline, and the places of GeoNames' list whose point lies inside it. */
  const outline = useCountyOutline(fips);
  const shapes = useMemo(() => (outline ? [outline] : []), [outline]);
  const listed = usePlaces("US");
  const rows = useMemo(() => (outline && listed ? placesWithin(outline, listed.places) : null), [outline, listed]);
  const dots = useMemo(() => placeDots(rows ?? [], 300, listed), [rows, listed]);
  const stateRecord = useMemo(() => SUBNATIONS.find((s) => s.code === `US-${abbr}`), [abbr]);
  /* Where it stands among its state's counties and the country's, by the same year's population: counted here from the Census Bureau's figures. */
  const end = (x: UsCounty) => x[7][x[7].length - 1];
  const peers = useMemo(() => data.US_COUNTIES.filter((x) => x[2] === abbr).sort((a, b) => b[7][b[7].length - 1] - a[7][a[7].length - 1]), [data, abbr]);
  const statePeople = peers.reduce((t, x) => t + end(x), 0);
  const inState = peers.findIndex((x) => x[0] === fips) + 1;
  const inCountry = useMemo(() => data.US_COUNTIES.filter((x) => x[7][x[7].length - 1] > now).length + 1, [data, now]);
  const plusMinus = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${whole(Math.abs(v))}`;
  /* Its state's five largest counties, and this one after them where it is not among them. */
  const beside = [...peers.slice(0, 5), ...(inState > 5 ? [county] : [])];
  const analysed: Part = {
    title: "Analysed",
    note: `Worked out here from the Census Bureau's figures above: its people on 1 July ${last}, and its births, deaths and moves in the year to that day.`,
    fields: [
      { label: "Density", value: land ? `${(now / land).toFixed(now / land < 10 ? 2 : 1)} people per km² of land` : null, sub: "its people over its land area" },
      { label: "Natural change", value: plusMinus(births - deaths), sub: `births less deaths, ${year}` },
      { label: "Net migration", value: plusMinus(international + domestic), sub: `from abroad and from other counties, ${year}` },
      { label: `Share of ${state?.name ?? abbr}'s people`, value: statePeople > 0 ? `${((100 * now) / statePeople).toFixed(now / statePeople < 0.01 ? 2 : 1)}%` : null, sub: `of the ${whole(statePeople)} in its ${peers.length} counties` },
      { label: `Rank in ${state?.name ?? abbr}`, value: inState ? `${inState} of ${peers.length}` : null, sub: "by population, the largest first" },
      { label: "Rank in the United States", value: `${whole(inCountry)} of ${whole(data.US_COUNTIES.length)}`, sub: "among counties and their equivalents" },
    ],
    extra: (
      <div className="modal-tile rounded-xl p-4 mt-2">
        <ChartTitle>
          Beside {state?.name ?? abbr}'s largest counties · people, 1 July {last}
        </ChartTitle>
        <MeasureBars
          label={`${name} beside the largest counties of ${state?.name ?? abbr} by population`}
          rows={beside.map((x) => ({ key: x[0], label: x[0] === fips ? `${x[1]} · this county` : x[1], value: end(x), text: whole(end(x)), color: x[0] === fips ? COLOR : undefined }))}
        />
      </div>
    ),
  };
  const parts: Part[] = [
    {
      title: "Identity",
      fields: [
        { label: "Common name", value: name },
        { label: "FIPS code", value: fips, sub: "the Census Bureau's code for it" },
        { label: "State", value: state?.name ?? abbr },
        { label: "Country", value: "United States", sub: "ISO 3166-1: US" },
        { label: "Political status", value: "County or its equivalent", sub: "a parish, borough, census area, independent city or planning region is counted as one" },
      ],
    },
    {
      title: "Geography",
      fields: [
        { label: "Continent", value: "North America" },
        { label: "Land area", value: land != null ? `${whole(land)} km²` : null, sub: `${last} Gazetteer` },
        { label: "Water area", value: water != null ? `${whole(water)} km²` : null, sub: `${last} Gazetteer` },
        { label: "Coordinates", value: lat != null && lon != null ? coords(lat, lon) : null, sub: "its internal point" },
        { label: "Borders", value: null },
      ],
    },
    {
      title: "Demographics",
      fields: [
        { label: "Population", value: whole(now), sub: `1 July ${last}` },
        { label: "Population growth", value: change !== null ? signed(change) : null, sub: `on ${whole(pops[0])} in ${years[0]} · worked out here from the two figures` },
        { label: "Births", value: whole(births), sub: year },
        { label: "Deaths", value: whole(deaths), sub: year },
        { label: "Migration: from abroad, net", value: whole(international), sub: year },
        { label: "Migration: within the United States, net", value: whole(domestic), sub: year },
        { label: "Age", value: null },
        { label: "Urbanization", value: null },
      ],
    },
    analysed,
    {
      title: "Government · Economy · Society · Political data",
      note: `The site holds none of these for a county. ${state?.name ?? "The state"}'s are in its own window.`,
      fields: [],
    },
    {
      title: "Historical trends",
      note: `Its population on 1 July of each year, ${years[0]} to ${last}.`,
      fields: [],
      extra: <SeriesChart points={years.map((y, i) => [y, pops[i]])} label={`${name}'s population`} />,
    },
  ];
  return (
    <Window wide top={!placeOpen} hidden={placeOpen} onBack={onBack} title={name} kicker={`County · ${state?.name ?? abbr}`} flagSrc={flag("US", 160)} chips={[`FIPS ${fips}`, state?.name ?? abbr, ...(rows ? [`${whole(rows.length)} places listed`] : [])]} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {state && <LinkButton onClick={() => navigate(`/dashboard/subnations?open=US-${state.abbreviation}`)}>{state.name}'s record</LinkButton>}
        {state && <LinkButton onClick={() => navigate(`/dashboard/states?open=${state.id}`)}>Open {state.name} on the US States page</LinkButton>}
      </div>
      <TabBar tab={tab} onTab={setTab} count={rows?.length} />
      {tab === "overview" && shapes.length > 0 && (
        <div>
          <OutlineMap shapes={shapes} dots={dots} color={(stateRecord && flagColor("US")) ?? COLOR} label={`The outline of ${name}, with the ${dots.length} places listed inside it`} onDot={(d) => setPicked(rows?.find((p) => p[6] === d.id) ?? null)} />
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
            {name} as the Census Bureau's boundary files draw it{rows ? `, with the ${rows.length > dots.length ? `${dots.length} largest of the ${whole(rows.length)}` : whole(rows.length)} places GeoNames lists inside it as dots` : ""}.
          </p>
        </div>
      )}
      {tab === "overview" && parts.map((p) => <Section key={p.title} part={p} />)}
      {/* History: the article of its name and its state's - "Pulaski County, Arkansas" - as Wikipedia titles a county's. */}
      {tab === "history" && (state ? <ArticlePanel title={`${name}, ${state.name}`} name={name} mode="history" /> : noHistory(name))}
      <section className={tab === "municipalities" ? "" : "hidden"}>
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Towns, cities and villages</h3>
          <div className="flex-1 h-px bg-border/60" />
        </div>
        {outline === undefined || listed === undefined ? (
          <p className="text-[11px] font-sans text-muted-foreground">Loading its places…</p>
        ) : !rows || !listed ? (
          <p className="text-[11px] font-sans text-muted-foreground leading-snug">Not held: the boundary files the site draws from have no outline under this county's code, so its places are not picked out rather than guessed at.</p>
        ) : rows.length === 0 ? (
          <p className="text-[11px] font-sans text-muted-foreground">GeoNames lists no place of more than 500 people inside its outline.</p>
        ) : (
          <>
            <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
              The places of GeoNames' list - every town, city and village of more than 500 people, and every seat of a county - whose point lies inside the outline of {name}. That
              is worked out here, from the outline as it is drawn, so a place at its very edge can fall on the other side.
            </p>
            <PlacesAnalysis rows={rows} name={name} />
            <PlacesInside
              rows={rows}
              file={listed}
              division={(p) => stateRecord ?? { id: "", cc: "US", name: state?.name ?? abbr, lat: p[1], lon: p[2] }}
              country="United States"
              outline={outline ? { shape: outline, name } : undefined}
              onPlace={setPlaceOpen}
              onCloseAll={onClose}
            />
          </>
        )}
      </section>
      {picked && listed && (
        <PlaceHost
          place={picked}
          file={listed}
          division={(p) => stateRecord ?? { id: "", cc: "US", name: state?.name ?? abbr, lat: p[1], lon: p[2] }}
          country="United States"
          outline={outline ? { shape: outline, name } : undefined}
          onPlace={setPlaceOpen}
          onDone={() => setPicked(null)}
          onCloseAll={onClose}
        />
      )}
      <SourceLink sources={[data.US_COUNTY_SOURCES.estimates, data.US_COUNTY_SOURCES.gazetteer, { label: "US Census Bureau — cartographic boundary files, via us-atlas", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html" }, { label: PLACES_SOURCE.geonames.label, url: PLACES_SOURCE.geonames.url }]} />
    </Window>
  );
}

// ── A district's window: a second-order division outside the United States ──

function DistrictWindow({
  cc,
  index,
  onBack,
  onClose,
  onDivision,
}: {
  cc: string;
  /** Its place in the country's file of boundaries. */
  index: number;
  /** Back to its country's window, where that is open behind it. */
  onBack?: () => void;
  onClose: () => void;
  /** To the window of the first-order division it lies in. */
  onDivision: (s: Subnation) => void;
}) {
  const navigate = useNavigate();
  /** Whether one of its places has its window open: this one is then out of sight, until the reader comes back. */
  const [placeOpen, setPlaceOpen] = useState(false);
  const c = COUNTRY.get(cc);
  const country = c?.name ?? cc;
  const info = useAdmin2Manifest()?.[cc];
  const second = useAdmin2(cc);
  const file = usePlaces(cc);
  const shape = second ? second.shapes[index] : undefined;
  const name = shape?.properties.n ?? "";
  const parentName = shape?.properties.p;
  const parent = useMemo(() => (parentName ? SUBNATIONS.find((s) => s.cc === cc && s.name === parentName) : undefined), [cc, parentName]);
  /* The places of GeoNames' list whose point lies inside its outline, in the list's order: largest first. */
  const rows = useMemo(() => {
    return shape && file ? placesWithin(shape, file.places) : null;
  }, [shape, file]);
  const shapes = useMemo(() => (shape ? [shape] : []), [shape]);
  const dots = useMemo(() => placeDots(rows ?? [], 300, file), [rows, file]);
  /* The division a place's window names for it: the one the district lies in, or, where none was found, the one GeoNames files the place under. */
  const division = (p: PlaceRow): Subnation => parent ?? { id: "", cc, name: file?.regions[p[4]] || name, lat: p[1], lon: p[2] };
  const color = flagColor(cc) ?? COLOR;
  /* Its own record, looked for live and taken only where its name, its place and its size all agree (lib/liveRecord): undefined while it is looked for, null where none passes. */
  const [live, setLive] = useState<LiveRecord | null | undefined>(undefined);
  const [tab, setTab] = useState<WinTab>("overview");
  /** The place whose dot on the map was pressed: its window opens over this one. */
  const [picked, setPicked] = useState<PlaceRow | null>(null);
  useEffect(() => {
    if (!shape) return;
    let off = false;
    setLive(undefined);
    liveRecord(`${cc}:${index}`, [name, ...(parentName ? [`${name}, ${parentName}`] : []), `${name}, ${country}`], shape).then((r) => !off && setLive(r));
    return () => {
      off = true;
    };
  }, [shape, cc, index, name, parentName, country]);

  if (second === undefined)
    return (
      <Window onBack={onBack} title="Loading…" kicker={`Second-order division · ${country}`} flagSrc={flag(cc, 160)} chips={[]} onClose={onClose}>
        <p className="text-[12px] font-sans text-muted-foreground">Loading the boundaries of {inSentence(country)}…</p>
      </Window>
    );
  if (!shape)
    return (
      <Window onBack={onBack} title={country} kicker="Second-order division" flagSrc={flag(cc, 160)} chips={[]} onClose={onClose}>
        <p className="text-[12px] font-sans text-foreground">No second-order division is held under that link for {inSentence(country)}.</p>
      </Window>
    );

  const peopled = rows?.filter((p) => p[3] > 0) ?? [];
  const earliest = live?.pop[0];
  const latest = live?.pop[live.pop.length - 1];
  const density = live && latest ? latest[1] / live.areaKm2 : null;
  const ci = COUNTRY_INDICATORS[cc];
  /* Its own record: what Wikidata gives for it, where a record can be told to be its own. */
  const record: Part =
    live === undefined
      ? { title: "Its own record", note: "Looking for its record…", fields: [] }
      : live === null
        ? {
            title: "Its own record",
            note: `Not held. The site keeps no figures for a second-order division outside the United States, so its record is looked for on Wikidata when its window opens, and taken only where an article of its name gives a point inside this outline and the record's area agrees with the outline's to within a fifth. None passed for ${name}, so nothing is shown - rather than a town's figures under a district's name.`,
            fields: [
              { label: "Population", value: null },
              { label: "Area", value: null },
            ],
          }
        : {
            title: "Its own record",
            note: "Read from its Wikidata record as the window opened. The record was taken as this district's because an article of its name gives a point inside this outline, and the area the record gives agrees with the outline's to within a fifth.",
            fields: [
              { label: "Population", value: latest ? whole(latest[1]) : null, sub: latest ? `${latest[0]} · the latest dated figure its record cites a source for` : undefined },
              { label: "Area", value: `${live.areaKm2 < 100 ? live.areaKm2.toFixed(1) : whole(live.areaKm2)} km²`, sub: "as its record gives it" },
              { label: "Density", value: density ? `${density < 10 ? density.toFixed(1) : whole(density)} people per km²` : null, sub: "worked out here from the two figures" },
              {
                label: "Population change",
                value: earliest && latest && earliest[0] !== latest[0] ? signed((100 * (latest[1] - earliest[1])) / earliest[1]) : null,
                sub: earliest ? `on ${whole(earliest[1])} in ${earliest[0]} · worked out here from the two figures` : undefined,
              },
              { label: "Founded", value: live.founded ? String(live.founded) : null },
            ],
            extra: (
              <>
                {live.pop.length > 1 && <SeriesChart points={live.pop} label={`${name}'s population`} />}
                <SourceLink
                  sources={[
                    ...(live.site ? [{ label: `${name} — official website`, url: live.site }] : []),
                    { label: "Its Wikidata record (CC0)", url: `https://www.wikidata.org/wiki/${live.qid}` },
                    { label: `Wikipedia — ${live.title}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(live.title.replace(/ /g, "_"))}` },
                  ]}
                  className="mt-2"
                />
              </>
            ),
          };
  const parts: Part[] = [
    {
      title: "Identity",
      fields: [
        { label: "Common name", value: name },
        { label: "Kind", value: info?.kind ?? null, sub: "the word the publisher of its boundary has for the country's second order" },
        { label: "Political status", value: "Second-order division", sub: "as geoBoundaries orders the country's divisions" },
        { label: "Division", value: parentName ?? null, sub: "the first-order division most of its outline lies in · worked out here" },
        { label: "Country", value: country, sub: `ISO 3166-1: ${cc}` },
        { label: "Continent", value: c?.continent || null },
      ],
    },
    {
      title: "Its boundary",
      note: "The outline drawn for it, and the one its places are found by. It has been simplified for the map.",
      fields: [
        { label: "Publisher", value: info?.by ?? null },
        { label: "The year it shows", value: info?.year ?? null },
        { label: "Licence", value: info?.licence ?? null },
        { label: "Gathered by", value: "geoBoundaries", sub: "its gbOpen release, second order" },
      ],
    },
    ...(parent
      ? [
          {
            title: `The division it lies in · ${parent.name}`,
            note: `${parent.name}'s own figures, not ${name}'s.`,
            fields: [
              { label: "Kind", value: parent.kind ?? null },
              { label: "Population", value: parent.pop ? people(parent.pop[1]) : null, sub: parent.pop ? String(parent.pop[0]) : undefined },
              { label: "Area", value: parent.areaKm2 ? `${whole(parent.areaKm2)} km²` : null },
              { label: "Capital", value: parent.capital ?? null },
            ],
          },
        ]
      : []),
    {
      title: `The country it lies in · ${country}`,
      note: `${country}'s own figures, each with its year - not ${name}'s.`,
      fields: [
        { label: "Population", value: ci?.population ? people(ci.population.v) : null, sub: ci?.population?.y },
        { label: "GDP per person", value: ci?.gdpPerCapita ? usd(ci.gdpPerCapita.v) : null, sub: ci?.gdpPerCapita?.y },
        { label: "Life expectancy", value: ci?.lifeExpectancy ? `${ci.lifeExpectancy.v} years` : null, sub: ci?.lifeExpectancy?.y },
      ],
    },
  ];
  return (
    <Window
      wide
      top={!placeOpen}
      hidden={placeOpen}
      onBack={onBack}
      title={name}
      kicker={`${info?.kind ?? "Second-order division"} · ${[parentName, country].filter(Boolean).join(" · ")}`}
      flagSrc={(parent && ownFlag(parent, 250)) ?? flag(cc, 160)}
      chips={[...(parentName ? [parentName] : []), country, ...(rows ? [`${whole(rows.length)} ${rows.length === 1 ? "place" : "places"} listed`] : [])]}
      onClose={onClose}
    >
      <div className="flex flex-wrap gap-2">
        {parent && <LinkButton onClick={() => onDivision(parent)}>{parent.name}'s record</LinkButton>}
        {c && <LinkButton onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}>Open {c.name}</LinkButton>}
        <LinkButton onClick={() => navigate(`/dashboard/maps?country=${cc}`)}>
          <MapTrifold size={12} aria-hidden /> On the map
        </LinkButton>
      </div>

      <TabBar tab={tab} onTab={setTab} count={rows?.length} />
      <div className={tab === "overview" ? "" : "hidden"}>
        <OutlineMap shapes={shapes} dots={dots} color={color} label={`The outline of ${name}, with the ${dots.length} places listed inside it`} onDot={(d) => setPicked(rows?.find((p) => p[6] === d.id) ?? null)} />
        <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
          {name} as the map draws it{rows ? `, with the ${rows.length > dots.length ? `${dots.length} largest of the ${whole(rows.length)}` : whole(rows.length)} ${rows.length === 1 ? "place" : "places"} GeoNames lists inside it as ${rows.length === 1 ? "a dot" : "dots"}` : ""}.
        </p>
      </div>

      {tab === "overview" && <Section part={record} />}
      {/* History: the article its record was found by - the one of its name whose point lies inside its outline and whose area agrees with it. */}
      {tab === "history" &&
        (live === undefined ? (
          <p className="text-xs font-sans text-muted-foreground py-6 text-center">Looking for the article on {name}…</p>
        ) : live ? (
          <ArticlePanel title={live.title} name={name} mode="history" />
        ) : (
          <p className="text-xs font-sans text-muted-foreground py-6 text-center">
            Not held: no article of the name of {name} was found that lies inside this outline and agrees with it in area, so no history is shown rather than another place's.
          </p>
        ))}

      <section className={tab === "municipalities" ? "" : "hidden"}>
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Towns, cities and villages</h3>
          <div className="flex-1 h-px bg-border/60" />
        </div>
        {file === undefined ? (
          <p className="text-[11px] font-sans text-muted-foreground">Loading the places of {inSentence(country)}…</p>
        ) : !file || !rows ? (
          <p className="text-[11px] font-sans text-muted-foreground">Not held: the site has no list of places for {inSentence(country)}.</p>
        ) : (
          <>
            <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
              The places of GeoNames' list - every town, city and village of more than 500 people, and every seat of a county or district - whose point lies inside the outline
              of {name}. That is worked out here, from the outline as the map draws it, so a place at its very edge can fall on the other side.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="modal-tile rounded-lg p-3 min-w-0">
                <p className="text-xs text-muted-foreground font-sans">Towns, cities and villages</p>
                <p className="text-base font-bold font-mono text-foreground">{whole(rows.length)}</p>
                <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">listed by GeoNames inside its outline</p>
              </div>
              {peopled[0] && (
                <div className="modal-tile rounded-lg p-3 min-w-0">
                  <p className="text-xs text-muted-foreground font-sans">Largest</p>
                  <p className="text-base font-bold font-sans truncate text-foreground" title={peopled[0][0]}>
                    {peopled[0][0]}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">{whole(peopled[0][3])} people, as GeoNames has it</p>
                </div>
              )}
            </div>
            <PlacesAnalysis rows={rows} name={name} />
            {rows.length > 0 ? (
              <PlacesInside rows={rows} file={file} division={division} country={country} outline={{ shape, name }} onPlace={setPlaceOpen} onCloseAll={onClose} />
            ) : (
              <p className="text-[11px] font-sans text-muted-foreground">GeoNames lists no place of more than 500 people inside its outline.</p>
            )}
            <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">A population is GeoNames' own for the place, undated; the largest first.</p>
          </>
        )}
      </section>

      {tab === "overview" && (
        <>
          {parts.map((p) => (
            <Section key={p.title} part={p} />
          ))}
          {/* The indexes the site holds are the country's: shown as the country's, as a town's window shows them. */}
          <CountryQuality code={cc} country={country} place={name} />
        </>
      )}

      {picked && file && <PlaceHost place={picked} file={file} division={division} country={country} outline={{ shape, name }} onPlace={setPlaceOpen} onDone={() => setPicked(null)} onCloseAll={onClose} />}
      <SourceLink
        sources={[
          ADMIN2_SOURCE,
          { label: PLACES_SOURCE.geonames.label, url: PLACES_SOURCE.geonames.url },
          SUBNATIONS_SOURCES.naturalEarth,
          SUBNATIONS_SOURCES.wikidata,
          { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url },
        ]}
      />
    </Window>
  );
}

// ── The page ────────────────────────────────────────────────────────────────

type Sort = "name" | "population" | "area";
const field = "bg-transparent border border-border rounded-full px-3 py-1.5 text-[12px] font-sans text-foreground focus:outline-none focus:border-foreground/40";
/** Whether a division answers a search: by its name, its code or its capital. */
const answers = (s: Subnation, q: string) => s.name.toLowerCase().includes(q) || (s.code ?? "").toLowerCase() === q || (s.capital ?? "").toLowerCase().includes(q);

/** A division's card, inside its country's window. */
function DivisionCard({ s, inside, onOpen }: { s: Subnation; /** What GeoNames lists inside it: undefined while its country's places are fetched, null where it has none by the division's name. */ inside: Inside | null | undefined; onOpen: () => void }) {
  // A US state's population is the one its window gives: the Census Bureau's. The "Head" line the card had was taken off as asked: it said "Not held" for nearly every division.
  const state = STATE_BY_CODE.get(s.code ?? "");
  const m = state ? STATE_INDICATORS[state.id] : undefined;
  const facts: [string, string | undefined][] = [
    ["Population", m ? `${people(m.population.v)} · ${m.population.y}` : s.pop ? `${people(s.pop[1])} · ${s.pop[0]}` : undefined],
    ["Area", s.areaKm2 ? `${whole(s.areaKm2)} km²` : undefined],
    ["Capital", s.capital],

    // What lies inside it, as GeoNames lists it: the counties or districts with a listed place, and the towns, cities and villages of more than 500 people.
    ["Counties or districts", inside === undefined ? "…" : inside && inside.order === 1 && inside.districts.length ? whole(inside.districts.length) : undefined],
    ["Towns and villages", inside === undefined ? "…" : inside ? whole(inside.rows.length) : undefined],
  ];
  return (
    <button type="button" onClick={onOpen} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2 min-w-0">
      <span className="flex items-center gap-2.5 min-w-0">
        {/* The division's own flag, where one is held under a licence the site can use: the copy saved with the site, and Commons' own if that does not come. Where none is held - many divisions have no flag - its country's stands in, paler, and is said to be the country's. */}
        <span
          className="w-9 h-6 rounded-[3px] overflow-hidden shrink-0 border border-border/60 bg-muted/40"
          title={s.flag ? `${s.name}'s flag · Wikimedia Commons, ${s.flagLicence}` : `No flag of its own is held for ${s.name}: ${COUNTRY.get(s.cc)?.name ?? s.cc}'s is shown, paler`}
        >
          {s.flag ? (
            <img
              src={ownFlag(s, 120)!}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                // The saved copy did not come: Commons is asked once, and the frame is left empty only if that fails too.
                const el = e.currentTarget;
                const again = commonsFlag(s, 120);
                if (again && el.dataset.again !== "1") {
                  el.dataset.again = "1";
                  el.src = again;
                } else el.style.visibility = "hidden";
              }}
            />
          ) : (
            <img src={flag(s.cc, 80)} alt="" loading="lazy" className="w-full h-full object-cover opacity-40" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold font-sans text-foreground truncate">{s.name}</span>
          <span className="block text-[10px] font-mono text-muted-foreground truncate">{s.kind || "Division"}</span>
        </span>
        {s.code && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">{s.code}</span>}
      </span>
      <span className="flex flex-col border-t border-border/40 pt-1.5">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
          <span key={k} className="flex items-baseline justify-between gap-2 py-0.5 min-w-0">
            <span className="text-[11px] font-sans text-muted-foreground shrink-0">{k}</span>
            <span className={`text-[11px] font-mono truncate ${v ? "font-bold text-foreground" : "text-muted-foreground"}`}>{v ?? "Not held"}</span>
          </span>
        ))}
      </span>
    </button>
  );
}

/** A country's card, drawn as the Countries page draws a country: its flag behind its name, four facts, a bar and its chips. */
function CountryCard({ row, matching, onOpen }: { row: CountryRow; /** How many of its divisions answer the search, where it is they and not its name that do. */ matching: number; onOpen: () => void }) {
  const slots: { label: string; value: string; text?: boolean }[] = [
    { label: "Divisions", value: String(row.divisions.length) },
    { label: "Kind", value: row.kinds.length ? `${row.kinds[0]}${row.kinds.length > 1 ? ` +${row.kinds.length - 1}` : ""}` : "Not held", text: true },
    { label: "Most populous", value: row.populous?.name ?? "Not held", text: true },
    { label: "Largest", value: row.widest?.name ?? "Not held", text: true },
  ];
  const pop = countryPeople(row.cc);
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${row.name}: its ${row.divisions.length} divisions`}
      className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40"
    >
      {/* Card header with flag background */}
      <div className="relative flex items-start justify-between gap-2 mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
        <img src={flag(row.cc, 320)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 select-none pointer-events-none" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="relative flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md bg-muted">
            <img src={flag(row.cc, 80)} alt={`${row.name} flag`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold font-sans text-foreground text-sm">{row.name}</h3>
            <p className="text-xs text-muted-foreground font-sans flex items-center gap-1">
              <MapPin size={10} />
              {[row.capital, row.continent].filter(Boolean).join(" · ")}
            </p>
            {matching > 0 && (
              <span className="inline-block mt-1 text-[10px] font-sans px-2 py-0.5 rounded-full border border-amber-600/40 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                {matching} of its divisions {matching === 1 ? "matches" : "match"}
              </span>
            )}
          </div>
        </div>
        <span className="relative shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-background/60 text-foreground">{row.cc}</span>
      </div>

      {/* Key facts: the same four slots for every country. */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {slots.map(({ label, value, text }) => (
          <div key={label} className="min-w-0">
            <p className="text-xs text-muted-foreground font-sans">{label}</p>
            <p className={`text-sm font-bold text-foreground truncate ${text ? "font-sans leading-snug" : "font-mono"}`} title={value}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* How many of its divisions have a dated, referenced population: out of all of them, in the country's own colour. */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground font-sans">With a dated population</span>
          <span className="font-mono font-semibold text-foreground">
            {row.counted} of {row.divisions.length}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(100 * row.counted) / row.divisions.length}%`, background: flagColor(row.cc) ?? COLOR }} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {row.continent && <span className={`text-[10px] border px-2 py-0.5 rounded-full font-sans ${CONTINENT_TONE[row.continent] ?? "text-muted-foreground border-border bg-muted"}`}>{row.continent}</span>}
        {/* The country's own population, which the page's first order goes by. */}
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-foreground" title={pop ? `${row.name}'s population, ${pop.y} · ${peopleSource(pop).label}` : `No population is held for ${row.name}`}>
          {pop ? `${people(pop.v)} people · ${pop.y}` : "Population not held"}
        </span>

      </div>
    </article>
  );
}

/** A country's window: every one of its divisions, a card each - and, for the United States, a state's counties. */
function CountryWindow({
  row,
  top,
  asked,
  notice,
  countyState,
  onCountyState,
  countyData,
  onOpen,
  onOpenCounty,
  onClose,
  openPlace,
  onPlaceOpened,
}: {
  row: CountryRow;
  top: boolean;
  /** The search the page was on when the window was opened. */
  asked: string;
  notice: string | null;
  countyState: string;
  onCountyState: (abbr: string) => void;
  countyData: CountyData | null;
  onOpen: (s: Subnation) => void;
  onOpenCounty: (fips: string) => void;
  onClose: () => void;
  /** A place another page's map named, by its GeoNames id: its window opens over this one once the country's places are in. */
  openPlace: number | null;
  onPlaceOpened: () => void;
}) {
  const navigate = useNavigate();
  const c = COUNTRY.get(row.cc);
  const [query, setQuery] = useState(asked);
  const [sort, setSort] = useState<Sort>("name");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const by: Record<Sort, (a: Subnation, b: Subnation) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      population: (a, b) => (b.pop?.[1] ?? -1) - (a.pop?.[1] ?? -1),
      area: (a, b) => (b.areaKm2 ?? -1) - (a.areaKm2 ?? -1),
    };
    return (q ? row.divisions.filter((s) => answers(s, q)) : [...row.divisions]).sort(by[sort]);
  }, [row, query, sort]);
  /* What lies inside each division, counted from the country's places once they are fetched. */
  const places = usePlaces(row.cc);
  const insides = useMemo(() => (places ? new Map(row.divisions.map((d) => [d.id, insideOf(places, d)])) : null), [places, row]);
  /* The map at the head of its window: its divisions as the site's maps draw them, framed without its far-off parts, with its largest listed places as dots. */
  const drawn = useAdmin1(row.cc);
  const frame = useMemo(() => (drawn ? framed(drawn) : undefined), [drawn]);
  const dots = useMemo(() => placeDots(places?.places ?? [], 150, places), [places]);
  /** The place whose dot on the map was pressed, or that a link named: its window opens over this one, which steps out of sight. */
  const [picked, setPicked] = useState<PlaceRow | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);
  useEffect(() => {
    if (openPlace === null || places === undefined) return;
    const hit = places?.places.find((p) => p[6] === openPlace);
    if (hit) setPicked(hit);
    onPlaceOpened();
  }, [openPlace, places, onPlaceOpened]);
  /* The division a place's window names for it: the one of the country's whose places GeoNames lists it among, or, where none is, the one GeoNames files it under. */
  const divisionOf = (p: PlaceRow): Subnation => row.divisions.find((d) => insides?.get(d.id)?.rows.includes(p)) ?? { id: "", cc: row.cc, name: places?.regions[p[4]] || row.name, lat: p[1], lon: p[2] };

  const counties = useMemo(() => (countyData && countyState ? countyData.US_COUNTIES.filter((x) => x[2] === countyState) : []), [countyData, countyState]);
  const stateName = usStatesData.find((s) => s.abbreviation === countyState)?.name ?? countyState;
  return (
    <Window wide top={top && !placeOpen} hidden={!top || placeOpen} title={row.name} kicker="Country · its divisions" flagSrc={flag(row.cc, 160)} chips={[`${row.divisions.length} divisions`, ...row.kinds.slice(0, 3), ...(row.continent ? [row.continent] : [])]} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2">
        {c && <LinkButton onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}>Open {c.name} on the Countries page</LinkButton>}
        <LinkButton onClick={() => navigate(`/dashboard/maps?country=${row.cc}`)}>
          <MapTrifold size={12} aria-hidden /> On the map
        </LinkButton>
      </div>
      {notice && <p className="text-[12px] font-sans text-foreground rounded-xl border border-border px-4 py-2.5">{notice}</p>}

      {drawn && drawn.length > 0 && (
        <div>
          <OutlineMap shapes={drawn} frame={frame} dots={dots} color={flagColor(row.cc) ?? COLOR} label={`${row.name} and its ${drawn.length} divisions, with its ${dots.length} largest listed places`} onDot={(d) => setPicked(places?.places.find((p) => p[6] === d.id) ?? null)} onShape={(f) => { const hit = row.divisions.find((x) => x.name === f.properties.n); if (hit) onOpen(hit); }} />

          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
            {row.name}'s divisions as the site's maps draw them{dots.length ? `, with the ${dots.length} largest places GeoNames lists for it as dots` : ""}
            {frame && frame.length < drawn.length ? " - framed without its far-off parts, which are in the list below" : ""}.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!countyState && (

          <>
            <label className={`flex items-center gap-1.5 ${field} focus-within:border-foreground/40`}>
              <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search its divisions" aria-label={`Search the divisions of ${row.name} by name, code or capital`} className="bg-transparent w-44 sm:w-56 focus:outline-none placeholder:text-muted-foreground" />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="The order of the divisions" className={field}>
              <option value="name">By name</option>
              <option value="population">By population</option>
              <option value="area">By area</option>
            </select>
          </>
        )}
        {row.cc === "US" && (
          <select value={countyState} onChange={(e) => onCountyState(e.target.value)} aria-label="The state whose counties are listed" className={field}>
            <option value="">Counties of…</option>
            {[...usStatesData]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <option key={s.abbreviation} value={s.abbreviation}>
                  {s.name}
                </option>
              ))}
          </select>
        )}
        {countyState && (
          <button type="button" onClick={() => onCountyState("")} className="text-[11px] font-sans font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
            Back to the states
          </button>
        )}
      </div>

      {countyState ? (
        <section aria-label="Counties">
          <h3 className="text-sm font-bold font-sans text-foreground mb-3">{countyData ? `The ${counties.length} counties of ${stateName}` : "Loading the counties…"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {counties.map((x) => (
              <button key={x[0]} type="button" onClick={() => onOpenCounty(x[0])} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold font-sans text-foreground truncate">{x[1]}</span>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">FIPS {x[0]}</span>
                </span>
                <span className="flex items-baseline justify-between gap-2 text-[11px] font-sans text-muted-foreground">
                  Population · {countyData?.US_COUNTY_YEARS[countyData.US_COUNTY_YEARS.length - 1]}
                  <span className="text-[12px] font-mono font-bold text-foreground">{whole(x[7][x[7].length - 1])}</span>
                </span>
                <span className="flex items-baseline justify-between gap-2 text-[11px] font-sans text-muted-foreground">
                  Land area
                  <span className="text-[12px] font-mono font-bold text-foreground">{x[5] != null ? `${whole(x[5])} km²` : "Not held"}</span>
                </span>
              </button>
            ))}
          </div>
          {countyData && <SourceLink sources={[countyData.US_COUNTY_SOURCES.estimates, countyData.US_COUNTY_SOURCES.gazetteer]} className="mt-3" />}
        </section>
      ) : (
        <section aria-label="Divisions">
          <h3 className="text-sm font-bold font-sans text-foreground mb-3">
            {query.trim() ? `${shown.length} of its ${row.divisions.length} divisions ${shown.length === 1 ? "matches" : "match"} "${query.trim()}"` : `The ${row.divisions.length} divisions of ${inSentence(row.name)}`}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((s) => (
              <DivisionCard key={s.id} s={s} inside={places === undefined ? undefined : (insides?.get(s.id) ?? null)} onOpen={() => onOpen(s)} />

            ))}
          </div>
          {shown.length === 0 && <p className="text-[12px] font-sans text-muted-foreground">Nothing matches.</p>}
        </section>
      )}
      <SourceLink sources={[SUBNATIONS_SOURCES.naturalEarth, SUBNATIONS_SOURCES.wikidata, SUBNATIONS_SOURCES.commons, SUBNATIONS_SOURCES.geonames, REPRESENTATIVES_SOURCES.wikidata]} />
      {picked && places && <PlaceHost place={picked} file={places} division={divisionOf} country={row.name} onPlace={setPlaceOpen} onDone={() => setPicked(null)} onCloseAll={onClose} />}
    </Window>
  );
}

type Order = "people" | "name" | "divisions";

export function SubnationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("");
  const [order, setOrder] = useState<Order>("people");
  /** The country whose window is open, and the division whose window is open over it. */
  const [country, setCountry] = useState<string | null>(null);
  const [open, setOpen] = useState<Subnation | null>(null);
  /** The US state whose counties are listed, and the county whose window is open. */
  const [countyState, setCountyState] = useState("");
  const [openCounty, setOpenCounty] = useState<string | null>(null);
  /** The second-order division, outside the United States, whose window is open: its country, and its place in the country's file. */
  const [district, setDistrict] = useState<{ cc: string; index: number } | null>(null);
  /** A place another page's map named: its country, and its GeoNames id. Its country's window opens it. */
  const [placeLink, setPlaceLink] = useState<{ cc: string; id: number } | null>(null);
  const clearPlaceLink = useCallback(() => setPlaceLink(null), []);
  const [countyData, setCountyData] = useState<CountyData | null>(null);
  /** Said on the page, and said in a country's window. */
  const [notice, setNotice] = useState<string | null>(null);
  const [inside, setInside] = useState<string | null>(null);

  /* The counties are loaded when first asked for: the list of them is large. */
  const wantCounties = countyState !== "" || openCounty !== null;
  useEffect(() => {
    if (!wantCounties || countyData) return;
    let off = false;
    import("../data/usCounties").then((m) => !off && setCountyData(m));
    return () => {
      off = true;
    };
  }, [wantCounties, countyData]);

  /* A link to a division, a county, a country, or the division a map names. Read from the router, and the address
     tidied through it, so the same link works a second time. A value is only ever matched against the lists. */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get("open");
    const cc = q.get("country");
    const name = q.get("name");
    if (!id && !cc) return;
    setNotice(null);
    setInside(null);
    setDistrict(null);
    if (id?.startsWith("district:")) {
      // A district the Dashboard's map names: its country's two letters and a whole number, looked up in the country's file and nowhere else.
      const [, dcc = "", at = ""] = id.split(":");
      setOpen(null);
      setOpenCounty(null);
      setCountyState("");
      setCountry(ROW_OF.has(dcc) ? dcc : null);
      if (/^[A-Z]{2}$/.test(dcc) && /^\d{1,5}$/.test(at)) setDistrict({ cc: dcc, index: Number(at) });
      else setNotice("No second-order division is held under that link.");
    } else if (id?.startsWith("place:")) {
      // A place a map on another page names: its country's two letters and its GeoNames id, looked up in the country's list of places and nowhere else.
      const [, pcc = "", pid = ""] = id.split(":");
      setOpen(null);
      setOpenCounty(null);
      setCountyState("");
      if (ROW_OF.has(pcc) && /^\d{1,10}$/.test(pid)) {
        setCountry(pcc);
        setPlaceLink({ cc: pcc, id: Number(pid) });
      } else setNotice("No place is held under that link.");
    } else if (id?.startsWith("county:")) {
      setCountry("US");
      setOpen(null);
      setOpenCounty(id.slice(7));
    } else if (id) {
      const found = BY_ID.get(id) ?? SUBNATIONS.find((s) => s.code === id);
      setOpenCounty(null);
      setCountyState("");
      if (found) setCountry(found.cc), setOpen(found);
      else setNotice(`No division is held under "${id}".`);
    } else if (cc && ROW_OF.has(cc)) {
      setCountry(cc);
      setCountyState("");
      setOpenCounty(null);
      const found = name ? SUBNATIONS.find((s) => s.cc === cc && s.name === name) : undefined;
      setOpen(found ?? null);
      if (name && !found) setInside(`No record is held under the name "${name}". These are the divisions of ${inSentence(ROW_OF.get(cc)!.name)} that are.`);

    } else if (cc) setNotice(`No divisions are held for ${COUNTRY.get(cc)?.name ?? cc}.`);
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, navigate]);

  const county = countyData && openCounty ? (countyData.US_COUNTIES.find((x) => x[0] === openCounty) ?? null) : null;
  /* A county reached by a link: its state's counties are the ones listed behind its window. */
  useEffect(() => {
    if (county && !countyState) setCountyState(county[2]);
  }, [county, countyState]);

  /* The countries that answer: by their own name, or by a division's name, code or capital. */
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ROWS.filter((r) => !continent || r.continent === continent).flatMap((r) => {
      if (!q) return [{ row: r, matching: 0 }];
      if (r.name.toLowerCase().includes(q)) return [{ row: r, matching: 0 }];
      const matching = r.divisions.filter((s) => answers(s, q)).length;
      return matching ? [{ row: r, matching }] : [];
    });
    // The most populated country first, down to the least; one with no population held comes after them, by name.
    if (order === "people") return [...list].sort((a, b) => byPeople(a.row.cc, b.row.cc) || a.row.name.localeCompare(b.row.name));
    return order === "divisions" ? [...list].sort((a, b) => b.row.divisions.length - a.row.divisions.length || a.row.name.localeCompare(b.row.name)) : list;
  }, [query, continent, order]);
  const continents = useMemo(() => [...new Set(ROWS.map((r) => r.continent).filter(Boolean))].sort(), []);
  const openRow = country ? (ROW_OF.get(country) ?? null) : null;
  /** Out of every window, back to the page: what a window's X does, where its back arrow goes back one. */
  const closeAll = () => {
    setOpen(null);
    setOpenCounty(null);
    setDistrict(null);
    setCountry(null);
    setCountyState("");
    setInside(null);
  };

  /** A division's search carried into its country's window, where it was the divisions and not the country's name that answered. */
  const carried = openRow && rows.find((r) => r.row.cc === openRow.cc)?.matching ? query.trim() : "";

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* ── Hero ── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">CommonSphere · Municipalities</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-foreground flex items-center gap-2.5">
              <TreeStructure size={24} weight="fill" style={{ color: COLOR }} aria-hidden /> Municipalities
            </h1>
            <p className="text-sm font-sans text-muted-foreground mt-1.5">
              Every country, and inside each the states, provinces, regions or departments it is divided into - with the counties of the United States under its states. Open a
              country for its divisions; open a division for its own window, in eight parts: identity, geography, government, demographics, economy, society, political data and
              historical trends. Each part says what is held for it and what is not.
            </p>
            <p className="text-[11px] font-sans text-muted-foreground mt-2">Natural Earth · Wikidata · US Census Bureau · figures read {SUBNATIONS_RETRIEVED}</p>
          </div>
          <div className="lg:text-right shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Divisions held</p>
            <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1 text-foreground">{SUBNATIONS.length.toLocaleString("en-US")}</p>
            <p className="text-[11px] font-sans text-muted-foreground mt-2">
              in {ROWS.length} countries and territories, {SUBNATIONS.filter((s) => s.pop).length.toLocaleString("en-US")} of them with a dated, referenced population
            </p>
          </div>
        </div>

        {/* ── Which countries are listed: the sticky bar every other page has, continents as its chips ── */}
        <FilterBar label="Subnation filters" search={{ value: query, onChange: setQuery, placeholder: "Search a country, a division or a capital…" }} status={`${rows.length} countries`}>
          {["", ...continents].map((x) => (
            <button
              key={x || "all"}
              onClick={() => setContinent(x)}
              aria-pressed={continent === x}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                continent === x ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {x || "All"}
            </button>
          ))}
          <div className="w-px h-4 bg-border shrink-0" />
          <select
            aria-label="The order of the countries"
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
            className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
          >
            <option value="people">Sort: Most populated</option>
            <option value="name">Sort: Name</option>
            <option value="divisions">Sort: Number of divisions</option>
          </select>
        </FilterBar>

        {notice && <p className="text-[12px] font-sans text-foreground rounded-xl border border-border px-4 py-2.5">{notice}</p>}

        {/* ── COUNTRY CARDS GRID: as the Countries page lays its own out ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rows.map(({ row, matching }) => (
            <CountryCard
              key={row.cc}
              row={row}
              matching={matching}
              onOpen={() => {
                setInside(null);
                setCountyState("");
                setCountry(row.cc);
              }}
            />
          ))}
        </div>
        {rows.length === 0 && <p className="text-[12px] font-sans text-muted-foreground">Nothing matches.</p>}

        <p className="text-[10px] font-sans leading-relaxed text-muted-foreground">
          Which divisions a country has, and their names, kinds, codes and label points, are Natural Earth's: the ones the site's maps draw, which for some countries are a second
          order (France's departments, not its regions). Everything else about a division is its own Wikidata record's, read by the id Natural Earth gives it. A population is kept
          only where its statement is dated and cites a reference of its own - or, where it cites none, where the infobox of the division's Wikipedia article gives the same figure. A
          capital its record does not name is the one place GeoNames marks as its seat. What is still missing is then read from the infobox of the division's Wikipedia article, where the infobox states it plainly - a population with its year, an area, a flag named for the division - and is marked as the infobox's. A flag is the one its record or its article names on Wikimedia Commons,
 shown only under a licence the site
          can use, which its window names with a link to the file and its author. A head is named only where three records agree, or, for a US state, as the US States page names
          its governor. A field the site holds nothing for says so.
        </p>
        <SourceLink sources={[SUBNATIONS_SOURCES.naturalEarth, SUBNATIONS_SOURCES.wikidata, SUBNATIONS_SOURCES.commons, SUBNATIONS_SOURCES.geonames, SUBNATIONS_SOURCES.wikipedia, SUBNATIONS_SOURCES.iso, REPRESENTATIVES_SOURCES.wikidata]} />
        <p className="text-[10px] font-sans leading-relaxed text-muted-foreground">
          The countries are in order of their own population, the most populated first: the World Bank's latest figure for each, with its year on the card, or, where the World Bank
          reports none, the figure of the source the card names. A country or territory with no population held comes after the rest, by name.
        </p>
        <SourceLink sources={POP_SOURCES} />

      </div>

      {openRow && (
        <CountryWindow
          key={openRow.cc}
          row={openRow}
          top={!open && !county && !district}
          asked={carried}
          notice={inside}
          countyState={countyState}
          onCountyState={setCountyState}
          countyData={countyData}
          onOpen={setOpen}
          onOpenCounty={setOpenCounty}
          openPlace={placeLink && placeLink.cc === openRow.cc ? placeLink.id : null}
          onPlaceOpened={clearPlaceLink}
          onClose={() => {
            setCountry(null);
            setCountyState("");
            setInside(null);
          }}
        />
      )}
      {open && (
        <SubnationWindow
          s={open}
          onBack={() => setOpen(null)}
          onClose={closeAll}
          onCounties={(abbr) => {
            setOpen(null);
            setCountry("US");
            setCountyState(abbr);
          }}
        />
      )}
      {county && countyData && <CountyWindow county={county} data={countyData} onBack={() => setOpenCounty(null)} onClose={closeAll} />}
      {district && (
        <DistrictWindow
          key={`${district.cc}-${district.index}`}
          cc={district.cc}
          index={district.index}
          onBack={openRow ? () => setDistrict(null) : undefined}
          onClose={closeAll}
          onDivision={(s) => {
            setDistrict(null);
            setCountry(s.cc);
            setOpen(s);
          }}
        />
      )}

    </div>
  );
}

