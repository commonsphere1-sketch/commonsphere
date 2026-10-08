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
 * the site holds nothing for says "Not held" rather than being filled in or
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
 * ?open=<id> opens a division's window, ?open=county:<fips> a county's, and
 * ?country=<code>&name=<name> the division a map names - the Dashboard's map
 * sends its presses here that way.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowRight, MagnifyingGlass, MapPin, MapTrifold, TreeStructure, X } from "@phosphor-icons/react";
import { TONE } from "@/lib/chipTone";
import { flagColor } from "../lib/flagColor";
import { lockScroll } from "../lib/scrollLock";
import { inSentence, qualityOf } from "../components/CountryQuality";
import { DivisionPlaces, insideOf, usePlaces, type Inside } from "../components/DivisionPlaces";
import { FilterBar } from "../components/FilterBar";
import { FigureRow } from "../components/ModalCharts";
import { SourceLink } from "../components/SourceLink";
import { countriesData } from "../data/countriesData";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { REGIONAL_ASSEMBLIES, REPRESENTATIVES, REPRESENTATIVES_SOURCES } from "../data/representatives";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { usStatesData } from "../data/statesData";
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
const ownFlag = (s: Subnation, w: number) => (s.flag ? `https://commons.wikimedia.org/wiki/Special:FilePath/${commonsFile(s.flag)}?width=${w}` : null);

const COUNTRY = new Map(countriesData.map((c) => [c.code, c]));
/** The countries that have divisions, by name. */
const COUNTRIES = [...new Set(SUBNATIONS.map((s) => s.cc))]
  .map((cc) => ({ cc, name: COUNTRY.get(cc)?.name ?? cc, count: SUBNATIONS.filter((s) => s.cc === cc).length }))
  .sort((a, b) => a.name.localeCompare(b.name));
const BY_ID = new Map(SUBNATIONS.map((s) => [s.id, s]));
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
  headed: number;
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
    headed: divisions.filter((s) => headOf(s) || STATE_BY_CODE.has(s.code ?? "")).length,
    populous: most((s) => s.pop?.[1]),
    widest: most((s) => s.areaKm2),
  };
});
const ROW_OF = new Map(ROWS.map((r) => [r.cc, r]));

// ── A window's pieces ───────────────────────────────────────────────────────

function Section({ part }: { part: Part }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{part.title}</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {part.note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-1.5">{part.note}</p>}
      {part.fields.length > 0 && (
        <div className="modal-tile rounded-xl px-4 py-1.5">
          {part.fields.map((f) => (
            <FigureRow key={f.label} label={f.label} value={f.value ? f.value : <span className="font-normal text-muted-foreground">Not held</span>} sub={f.value ? f.sub : undefined} />
          ))}
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

// ── A division's window ─────────────────────────────────────────────────────

function partsOf(s: Subnation): { parts: Part[]; sources: Source[] } {
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
      ],
    },
    {
      title: "Government",
      note: head || m ? undefined : "A head is given only where the division's own record, the records of the office's holders and its Wikipedia article all name the same living person. None is confirmed for this one.",
      fields: [
        { label: "System", value: c?.governmentType, sub: theirs },
        m
          ? { label: "Head of government", value: m.governor.name, sub: `Governor · ${m.governor.party} · since ${m.governor.since.slice(0, 4)}` }
          : { label: "Head of government", value: head?.[3], sub: head ? `${head[4]}${head[5] ? ` · since ${head[5]}` : ""} · three records agree` : undefined },
        { label: "Legislature", value: s.legislature, sub: wd },
        { label: "Judiciary", value: null },
        { label: "Administrative structure", value: s.kind ? `${s.kind}${s.within ? `, within ${s.within}` : ""}` : null },
        { label: "Electoral system", value: null },
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
      ],
    },
    {
      title: "Economy",
      note: m ? undefined : `No body publishes these for every division on one footing. The figures are ${country}'s.`,
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
            { label: "GDP", value: ci?.gdp ? billions(ci.gdp.v) : null, sub: ci?.gdp ? `${theirs} · ${ci.gdp.y}` : undefined },
            { label: "GDP per person", value: ci?.gdpPerCapita ? usd(ci.gdpPerCapita.v) : null, sub: ci?.gdpPerCapita ? `${theirs} · ${ci.gdpPerCapita.y}` : undefined },
            { label: "Inflation", value: ci?.inflationRate ? `${ci.inflationRate.v}%` : null, sub: ci?.inflationRate ? `${theirs} · ${ci.inflationRate.y}` : undefined },
            { label: "Unemployment", value: ci?.unemploymentRate ? `${ci.unemploymentRate.v}%` : null, sub: ci?.unemploymentRate ? `${theirs} · ${ci.unemploymentRate.y}` : undefined },
            { label: "Trade", value: null },
          ],
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
            { ...row("Education", "Adults who can read"), label: "Education: adults who can read" },
            { ...row("Education", "Years of schooling"), label: "Education: years of schooling" },
            { ...row("Health", "Life expectancy"), label: "Health: life expectancy" },
            { label: "Inequality", value: null },
            { ...row("Economy", "Below the national poverty line"), label: "Poverty: below the national poverty line" },
            { ...row("Business", "People using the internet"), label: "Development: people using the internet" },
          ],
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
  const { parts, sources } = useMemo(() => partsOf(s), [s]);
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
      {/* What lies inside it comes first, as asked - its counties or districts, and its towns, cities and villages, a card each with a window of its own - and the division's own record after. */}
      <DivisionPlaces s={s} country={c?.name ?? s.cc} onPlace={setPlaceOpen} onCloseAll={onClose} />
      <div className="flex items-center gap-2 mt-2">
        <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-wide">{s.name} itself</h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      {parts.map((p) => (
        <Section key={p.title} part={p} />
      ))}
      <div>
        <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1">Where to read more</p>
        <SourceLink sources={read} />
      </div>
      <SourceLink sources={sources} />
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
    <Window onBack={onBack} title={name} kicker={`County · ${state?.name ?? abbr}`} flagSrc={flag("US", 160)} chips={[`FIPS ${fips}`, state?.name ?? abbr]} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {state && <LinkButton onClick={() => navigate(`/dashboard/subnations?open=US-${state.abbreviation}`)}>{state.name}'s record</LinkButton>}
        {state && <LinkButton onClick={() => navigate(`/dashboard/states?open=${state.id}`)}>Open {state.name} on the US States page</LinkButton>}
      </div>
      {parts.map((p) => (
        <Section key={p.title} part={p} />
      ))}
      <SourceLink sources={[data.US_COUNTY_SOURCES.estimates, data.US_COUNTY_SOURCES.gazetteer]} />
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
  // A US state's population and head are the ones its window gives: the Census Bureau's, and its governor.
  const state = STATE_BY_CODE.get(s.code ?? "");
  const m = state ? STATE_INDICATORS[state.id] : undefined;
  const facts: [string, string | undefined][] = [
    ["Population", m ? `${people(m.population.v)} · ${m.population.y}` : s.pop ? `${people(s.pop[1])} · ${s.pop[0]}` : undefined],
    ["Area", s.areaKm2 ? `${whole(s.areaKm2)} km²` : undefined],
    ["Capital", s.capital],
    ["Head", m ? m.governor.name : headOf(s)?.[3]],
    // What lies inside it, as GeoNames lists it: the counties or districts with a listed place, and the towns, cities and villages of more than 500 people.
    ["Counties or districts", inside === undefined ? "…" : inside && inside.order === 1 && inside.districts.length ? whole(inside.districts.length) : undefined],
    ["Towns and villages", inside === undefined ? "…" : inside ? whole(inside.rows.length) : undefined],
  ];
  return (
    <button type="button" onClick={onOpen} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2 min-w-0">
      <span className="flex items-center gap-2.5 min-w-0">
        {/* The division's own flag, where one is held under a licence the site can use; an empty frame where none is, not its country's. */}
        <span className="w-9 h-6 rounded-[3px] overflow-hidden shrink-0 border border-border/60 bg-muted/40" title={s.flag ? `${s.name}'s flag · Wikimedia Commons, ${s.flagLicence}` : "Its flag is not held"}>
          {s.flag && <img src={ownFlag(s, 120)!} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold font-sans text-foreground truncate">{s.name}</span>
          <span className="block text-[10px] font-mono text-muted-foreground truncate">{s.kind || "Division"}</span>
        </span>
        {s.code && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">{s.code}</span>}
      </span>
      <span className="flex flex-col border-t border-border/40 pt-1.5">
        {facts.map(([k, v]) => (
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
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-foreground" title="Divisions whose head is named: where three records agree, or, for a US state, its governor">
          {row.headed} heads named
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
  const counties = useMemo(() => (countyData && countyState ? countyData.US_COUNTIES.filter((x) => x[2] === countyState) : []), [countyData, countyState]);
  const stateName = usStatesData.find((s) => s.abbreviation === countyState)?.name ?? countyState;
  return (
    <Window wide top={top} hidden={!top} title={row.name} kicker="Country · its divisions" flagSrc={flag(row.cc, 160)} chips={[`${row.divisions.length} divisions`, ...row.kinds.slice(0, 3), ...(row.continent ? [row.continent] : [])]} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2">
        {c && <LinkButton onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}>Open {c.name} on the Countries page</LinkButton>}
        <LinkButton onClick={() => navigate(`/dashboard/maps?country=${row.cc}`)}>
          <MapTrifold size={12} aria-hidden /> On the map
        </LinkButton>
      </div>
      {notice && <p className="text-[12px] font-sans text-foreground rounded-xl border border-border px-4 py-2.5">{notice}</p>}

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
    </Window>
  );
}

type Order = "name" | "divisions";

export function SubnationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("");
  const [order, setOrder] = useState<Order>("name");
  /** The country whose window is open, and the division whose window is open over it. */
  const [country, setCountry] = useState<string | null>(null);
  const [open, setOpen] = useState<Subnation | null>(null);
  /** The US state whose counties are listed, and the county whose window is open. */
  const [countyState, setCountyState] = useState("");
  const [openCounty, setOpenCounty] = useState<string | null>(null);
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
    if (id?.startsWith("county:")) {
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
    return order === "divisions" ? [...list].sort((a, b) => b.row.divisions.length - a.row.divisions.length || a.row.name.localeCompare(b.row.name)) : list;
  }, [query, continent, order]);
  const continents = useMemo(() => [...new Set(ROWS.map((r) => r.continent).filter(Boolean))].sort(), []);
  const openRow = country ? (ROW_OF.get(country) ?? null) : null;
  /** Out of every window, back to the page: what a window's X does, where its back arrow goes back one. */
  const closeAll = () => {
    setOpen(null);
    setOpenCounty(null);
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

      </div>

      {openRow && (
        <CountryWindow
          key={openRow.cc}
          row={openRow}
          top={!open && !county}
          asked={carried}
          notice={inside}
          countyState={countyState}
          onCountyState={setCountyState}
          countyData={countyData}
          onOpen={setOpen}
          onOpenCounty={setOpenCounty}
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
    </div>
  );
}

