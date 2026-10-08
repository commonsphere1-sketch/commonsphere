/**
 * Subnations: the first-order divisions of every country - states, provinces,
 * regions, departments - and the counties of the United States, each with a
 * card and a window.
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
import { ArrowRight, MagnifyingGlass, MapTrifold, TreeStructure, X } from "@phosphor-icons/react";
import { qualityOf } from "../components/CountryQuality";
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
/** The most populous divisions that have a dated, referenced population: what the page opens on. */
const LARGEST = [...SUBNATIONS].filter((s) => s.pop).sort((a, b) => b.pop![1] - a.pop![1]).slice(0, 24);

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

/** The shell of a window, as a city's and a country's is drawn. */
function Window({ title, kicker, flagCode, chips, onClose, children }: { title: string; kicker: string; flagCode: string; chips: string[]; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl modal-glass border overflow-y-auto">
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={flag(flagCode, 160)} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
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
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0" aria-label="Close">
              <X size={18} />
            </button>
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
  const head = (s.qid && HEAD_BY_QID.get(s.qid)) || (s.code && HEAD_BY_CODE.get(s.code)) || undefined;
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
        { label: "Political status", value: s.kind ? `${s.kind} of ${country}` : null, sub: "as Natural Earth names it" },
        { label: "Founded", value: s.founded ? (s.founded < 0 ? `${-s.founded} BC` : String(s.founded)) : null, sub: wd },
      ],
    },
    {
      title: "Geography",
      fields: [
        { label: "Continent", value: c?.continent },
        { label: `Region of ${country}`, value: s.region },
        { label: "Capital", value: s.capital, sub: wd },
        { label: "Area", value: s.areaKm2 ? `${whole(s.areaKm2)} km²` : null, sub: wd },
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
          : { label: "Population", value: s.pop ? people(s.pop[1]) : null, sub: s.pop ? `${s.pop[0]} · a dated, referenced figure in ${wd}` : undefined },
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

function SubnationWindow({ s, onClose, onCounties }: { s: Subnation; onClose: () => void; onCounties: (abbr: string) => void }) {
  const navigate = useNavigate();
  const c = COUNTRY.get(s.cc);
  const state = STATE_BY_CODE.get(s.code ?? "");
  const { parts, sources } = useMemo(() => partsOf(s), [s]);
  /* Where a reader can check it: its own site first, then the reference records, Wikipedia last. */
  const read: Source[] = [
    ...(s.site ? [{ label: `${s.name} — official website`, url: s.site }] : []),
    ...(s.qid ? [{ label: "Wikidata record", url: `https://www.wikidata.org/wiki/${s.qid}` }] : []),
    ...(s.gn ? [{ label: "GeoNames", url: `https://www.geonames.org/${s.gn}` }] : []),
    { label: `ISO 3166 — ${c?.name ?? s.cc} and its subdivisions`, url: `https://www.iso.org/obp/ui/#iso:code:3166:${s.cc}` },
    ...(s.article ? [{ label: `Wikipedia — ${s.article}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.article.replace(/ /g, "_"))}` }] : []),
  ];
  return (
    <Window title={s.name} kicker={`${s.kind || "Division"} · ${c?.name ?? s.cc}`} flagCode={s.cc} chips={[...(s.code ? [s.code] : []), ...(s.capital ? [`Capital: ${s.capital}`] : []), ...(s.region ? [s.region] : [])]} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {c && <LinkButton onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}>Open {c.name}</LinkButton>}
        {state && <LinkButton onClick={() => navigate(`/dashboard/states?open=${state.id}`)}>Open {state.name} on the US States page</LinkButton>}
        {state && <LinkButton onClick={() => onCounties(state.abbreviation)}>Its counties</LinkButton>}
        <LinkButton onClick={() => navigate(`/dashboard/maps?country=${s.cc}`)}>
          <MapTrifold size={12} aria-hidden /> On the map
        </LinkButton>
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

function CountyWindow({ county, data, onClose }: { county: UsCounty; data: CountyData; onClose: () => void }) {
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
    <Window title={name} kicker={`County · ${state?.name ?? abbr}`} flagCode="US" chips={[`FIPS ${fips}`, state?.name ?? abbr]} onClose={onClose}>
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
const PAGE = 60;

export function SubnationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cc, setCc] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<Subnation | null>(null);
  /** The US state whose counties are listed, and the county whose window is open. */
  const [countyState, setCountyState] = useState("");
  const [openCounty, setOpenCounty] = useState<string | null>(null);
  const [countyData, setCountyData] = useState<CountyData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  /* A link to a division, a county, or the division a map names. Read from the router, and the address tidied
     through it, so the same link works a second time. A value is only ever matched against the lists. */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get("open");
    const country = q.get("country");
    const name = q.get("name");
    if (!id && !country) return;
    setNotice(null);
    if (id?.startsWith("county:")) {
      setOpen(null);
      setOpenCounty(id.slice(7));
    } else if (id) {
      const found = BY_ID.get(id) ?? SUBNATIONS.find((s) => s.code === id);
      setOpenCounty(null);
      if (found) setOpen(found), setCc(found.cc);
    } else if (country && COUNTRIES.some((c) => c.cc === country)) {
      setCc(country);
      setCountyState("");
      setQuery("");
      if (name) {
        const found = SUBNATIONS.find((s) => s.cc === country && s.name === name);
        if (found) setOpen(found);
        else setNotice(`No record is held under the name "${name}". These are the divisions of ${COUNTRY.get(country)?.name ?? country} that are.`);
      }
    } else if (country) setNotice(`No divisions are held for ${COUNTRY.get(country)?.name ?? country}.`);
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, navigate]);

  const counties = useMemo(() => (countyData && countyState ? countyData.US_COUNTIES.filter((c) => c[2] === countyState) : []), [countyData, countyState]);
  const county = countyData && openCounty ? (countyData.US_COUNTIES.find((c) => c[0] === openCounty) ?? null) : null;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? SUBNATIONS.filter((s) => (!cc || s.cc === cc) && (s.name.toLowerCase().includes(q) || (s.code ?? "").toLowerCase() === q || (s.capital ?? "").toLowerCase().includes(q)))
      : cc
        ? SUBNATIONS.filter((s) => s.cc === cc)
        : LARGEST;
    if (!q && !cc) return list;
    const by: Record<Sort, (a: Subnation, b: Subnation) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      population: (a, b) => (b.pop?.[1] ?? -1) - (a.pop?.[1] ?? -1),
      area: (a, b) => (b.areaKm2 ?? -1) - (a.areaKm2 ?? -1),
    };
    return [...list].sort(by[sort]);
  }, [query, cc, sort]);
  const shown = all ? rows : rows.slice(0, PAGE);
  const heading = query.trim()
    ? `${rows.length.toLocaleString("en-US")} matching "${query.trim()}"${cc ? ` in ${COUNTRY.get(cc)?.name ?? cc}` : ""}`
    : cc
      ? `The ${rows.length} divisions of ${COUNTRY.get(cc)?.name ?? cc}`
      : "The most populous divisions with a dated, referenced population";
  const field = "bg-transparent border border-border rounded-full px-3 py-1.5 text-[12px] font-sans text-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* ── Hero ── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">CommonSphere · Subnations</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-foreground flex items-center gap-2.5">
              <TreeStructure size={24} weight="fill" style={{ color: COLOR }} aria-hidden /> Subnations
            </h1>
            <p className="text-sm font-sans text-muted-foreground mt-1.5">
              The states, provinces, regions and departments countries are divided into, and the counties of the United States. Each has a window in eight parts - identity,
              geography, government, demographics, economy, society, political data and historical trends - and each part says what is held for it and what is not.
            </p>
            <p className="text-[11px] font-sans text-muted-foreground mt-2">Natural Earth · Wikidata · US Census Bureau · figures read {SUBNATIONS_RETRIEVED}</p>
          </div>
          <div className="lg:text-right shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Divisions held</p>
            <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1 text-foreground">{SUBNATIONS.length.toLocaleString("en-US")}</p>
            <p className="text-[11px] font-sans text-muted-foreground mt-2">
              in {COUNTRIES.length} countries and territories, {SUBNATIONS.filter((s) => s.pop).length.toLocaleString("en-US")} of them with a dated, referenced population
            </p>
          </div>
        </div>

        {/* ── What to list ── */}
        <div className="flex flex-wrap items-center gap-2">
          <label className={`flex items-center gap-1.5 ${field} focus-within:border-foreground/40`}>
            <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAll(false);
                setCountyState("");
              }}
              placeholder="Search a division, its code or its capital"
              aria-label="Search the divisions by name, ISO code or capital"
              className="bg-transparent w-56 sm:w-72 focus:outline-none placeholder:text-muted-foreground"
            />
          </label>
          <select
            value={cc}
            onChange={(e) => {
              setCc(e.target.value);
              setAll(false);
              setCountyState("");
              setNotice(null);
            }}
            aria-label="The country whose divisions are listed"
            className={field}
          >
            <option value="">Every country</option>
            {COUNTRIES.map((c) => (
              <option key={c.cc} value={c.cc}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="The order of the list" className={field} disabled={!cc && !query.trim()}>
            <option value="name">By name</option>
            <option value="population">By population</option>
            <option value="area">By area</option>
          </select>
          {cc === "US" && (
            <select value={countyState} onChange={(e) => setCountyState(e.target.value)} aria-label="The state whose counties are listed" className={field}>
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
        </div>
        {notice && <p className="text-[12px] font-sans text-foreground rounded-xl border border-border px-4 py-2.5">{notice}</p>}

        {/* ── A state's counties ── */}
        {countyState && (
          <section aria-label="Counties">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-bold font-sans text-foreground">{countyData ? `The ${counties.length} counties of ${usStatesData.find((s) => s.abbreviation === countyState)?.name ?? countyState}` : "Loading the counties…"}</h2>
              <button type="button" onClick={() => setCountyState("")} className="text-[11px] font-sans font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                Back to the states
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {counties.map((c) => (
                <button key={c[0]} type="button" onClick={() => setOpenCounty(c[0])} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold font-sans text-foreground truncate">{c[1]}</span>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">FIPS {c[0]}</span>
                  </span>
                  <span className="flex items-baseline justify-between gap-2 text-[11px] font-sans text-muted-foreground">
                    Population · {countyData?.US_COUNTY_YEARS[countyData.US_COUNTY_YEARS.length - 1]}
                    <span className="text-[12px] font-mono font-bold text-foreground">{whole(c[7][c[7].length - 1])}</span>
                  </span>
                  <span className="flex items-baseline justify-between gap-2 text-[11px] font-sans text-muted-foreground">
                    Land area
                    <span className="text-[12px] font-mono font-bold text-foreground">{c[5] != null ? `${whole(c[5])} km²` : "Not held"}</span>
                  </span>
                </button>
              ))}
            </div>
            {countyData && <SourceLink sources={[countyData.US_COUNTY_SOURCES.estimates, countyData.US_COUNTY_SOURCES.gazetteer]} className="mt-3" />}
          </section>
        )}

        {/* ── The divisions ── */}
        {!countyState && (
          <section aria-label="Divisions">
            <h2 className="text-sm font-bold font-sans text-foreground mb-3">{heading}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {shown.map((s) => {
                const head = (s.qid && HEAD_BY_QID.get(s.qid)) || (s.code && HEAD_BY_CODE.get(s.code)) || undefined;
                const facts: [string, string | undefined][] = [
                  ["Population", s.pop ? `${people(s.pop[1])} · ${s.pop[0]}` : undefined],
                  ["Area", s.areaKm2 ? `${whole(s.areaKm2)} km²` : undefined],
                  ["Capital", s.capital],
                  ["Head", head?.[3]],
                ];
                return (
                  <button key={s.id} type="button" onClick={() => setOpen(s)} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2 min-w-0">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <img src={flag(s.cc)} alt="" width={22} height={16} loading="lazy" className="rounded-sm shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold font-sans text-foreground truncate">{s.name}</span>
                        <span className="block text-[10px] font-mono text-muted-foreground truncate">
                          {s.kind || "Division"} · {COUNTRY.get(s.cc)?.name ?? s.cc}
                        </span>
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
              })}
            </div>
            {rows.length === 0 && <p className="text-[12px] font-sans text-muted-foreground">Nothing matches.</p>}
            {rows.length > shown.length && (
              <button type="button" onClick={() => setAll(true)} className="mt-4 text-[11px] font-semibold font-sans px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer">
                Show all {rows.length.toLocaleString("en-US")}
              </button>
            )}
          </section>
        )}

        <p className="text-[10px] font-sans leading-relaxed text-muted-foreground">
          Which divisions there are, and their names, kinds, codes and label points, are Natural Earth's: the ones the site's maps draw, which for some countries are a second order
          (France's departments, not its regions). Everything else about a division is its own Wikidata record's, read by the id Natural Earth gives it. A population is kept only
          where its statement is dated and cites a reference of its own. A head is given only where three records agree. A field the site holds nothing for says so.
        </p>
        <SourceLink sources={[SUBNATIONS_SOURCES.naturalEarth, SUBNATIONS_SOURCES.wikidata, SUBNATIONS_SOURCES.iso, REPRESENTATIVES_SOURCES.wikidata]} />
      </div>

      {open && (
        <SubnationWindow
          s={open}
          onClose={() => setOpen(null)}
          onCounties={(abbr) => {
            setOpen(null);
            setCc("US");
            setQuery("");
            setCountyState(abbr);
          }}
        />
      )}
      {county && countyData && <CountyWindow county={county} data={countyData} onClose={() => setOpenCounty(null)} />}
    </div>
  );
}
