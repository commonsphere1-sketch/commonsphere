/**
 * Every city the United Nations counts, under the Cities page's profiled
 * few - laid out as the Subnations page is: a card for each country, drawn
 * as the Countries page draws its own; a country's card opens a window
 * holding every one of its cities, a card each; and a city's card opens the
 * city's own window over it.
 *
 * The profiled cities above have a window of their own, written and sourced
 * city by city. These have what one body publishes for every city alike
 * (unCities.ts: the UN's World Urbanization Prospects, 2025 Revision): where
 * the city is, whether it is its country's capital, its population in 1975,
 * 2000 and 2025 and the UN's projection for 2050, its land area and its
 * density. A change is worked out here from two of those figures, and says
 * so. What the UN does not publish for every city is not shown, and the
 * window says which parts those are.
 *
 * A city's window is laid out as a profiled city's is: its country, continent
 * and rank at the head, the "see also" row, and three tabs - Overview,
 * History, Map. The Overview opens on its people and place, then its
 * country's economy and quality of life, named as the country's; the plain
 * record the window first held - identity, geography, demographics - is one
 * of the Overview's sections.
 *
 * A city is what the UN's method draws - built-up land of at least 1,500
 * people to a km² holding 50,000 or more - not the administrative city, so
 * its figure can differ from the one its own council gives.
 *
 * Loaded when the page reaches it: the list is some twelve thousand cities.
 * `openId` ("un-<country>-<code>") opens one city's window - the Dashboard's
 * map sends its presses here that way.
 */
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ArrowsIn, ArrowsOut, ClockCounterClockwise, ListBullets, MagnifyingGlass, MapPin, MapTrifold, X } from "@phosphor-icons/react";
import { ECONOMY_INDICATORS, ECONOMY_INDICATORS_SOURCE } from "../data/economyIndicators";
import { ECONOMY_OF } from "../data/placeIndex";
import { countriesData } from "../data/countriesData";
import { UN_CITIES, UN_CITIES_SOURCE, UN_CITY_YEARS, type UnCity } from "../data/unCities";
import { CHIP_TEXT, TONE } from "@/lib/chipTone";
import { flagColor } from "../lib/flagColor";
import { ChartNote, FigureRow } from "./ModalCharts";
import { SeeAlso } from "./SeeAlso";

/** The city's country's quality of life, as a profiled city's window gives it: loaded when a window opens. */
const CountryQuality = lazy(() => import("./CountryQuality"));
import { SourceLink } from "./SourceLink";

const COLOR = "#10b981";
const PAGE = 48;
const COUNTRY = new Map(countriesData.map((c) => [c.code, c]));
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : whole(v));
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(0)}%`;
const flag = (cc: string, w = 40) => `https://flagcdn.com/w${w}/${cc.toLowerCase()}.png`;
const coords = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
export const unCityId = (c: UnCity) => `un-${c[0]}-${c[1]}`;
/** Its place among all the UN's cities by 2025 population: the list is written largest first. */
const RANK = new Map(UN_CITIES.map((c, i) => [unCityId(c), i + 1]));
const BY_ID = new Map(UN_CITIES.map((c) => [unCityId(c), c]));
const COUNTRIES = [...new Set(UN_CITIES.map((c) => c[0]))].map((cc) => ({ cc, name: COUNTRY.get(cc)?.name ?? cc, count: UN_CITIES.filter((c) => c[0] === cc).length })).sort((a, b) => a.name.localeCompare(b.name));
const [Y0, Y1, Y2, Y3] = UN_CITY_YEARS;
/** A change between two of a city's populations, as a percentage of the earlier. */
const change = (from: number | null, to: number | null) => (from && to ? (100 * (to - from)) / from : null);

const Section = ({ title, note, children }: { title: string; note?: string; children?: ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-1.5">
      <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-border/60" />
    </div>
    {note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-1.5">{note}</p>}
    {children}
  </section>
);
const none = <span className="font-normal text-muted-foreground">Not held</span>;

const nth = (n: number) => `${n.toLocaleString("en-US")}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
/** A figure in a tile, with a line under it saying whose it is and for when: as a profiled city's window draws them. */
const Tile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="modal-tile rounded-lg p-3 min-w-0">
    <p className="text-xs text-muted-foreground font-sans">{label}</p>
    <p className="text-base font-bold font-mono text-foreground">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">{sub}</p>}
  </div>
);
type Tab = "overview" | "history" | "map";

function CityWindow({ c, onClose }: { c: UnCity; onClose: () => void }) {
  const navigate = useNavigate();
  const [cc, code, name, lat, lon, capital, p0, p1, p2, p3, area, density] = c;
  const country = COUNTRY.get(cc);
  const land = country?.name ?? cc;
  const rank = RANK.get(unCityId(c))!;
  const since = change(p1, p2);
  const ahead = change(p2, p3);
  const points = ([[Y0, p0], [Y1, p1], [Y2, p2], [Y3, p3]] as [number, number | null][]).filter((x): x is [number, number] => x[1] !== null);
  /** The economy of the country the city is in: what stands in for a city's own, which nobody publishes. */
  const eco = ECONOMY_OF[cc] ? ECONOMY_INDICATORS[ECONOMY_OF[cc]] : undefined;
  const tone = CONTINENT_TONE[country?.continent ?? ""] ?? "text-muted-foreground border-border bg-muted";
  const [tab, setTab] = useState<Tab>("overview");
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const before = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [onClose]);
  const chart = (
    <div className="modal-tile rounded-lg p-4" role="img" aria-label={`${name}'s population: ${points.map(([y, v]) => `${y} ${people(v)}`).join(", ")}.`}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={points.map(([year, v]) => ({ year, v }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="year" type="number" domain={[Y0, Y3]} ticks={[...UN_CITY_YEARS]} tick={{ fontSize: 9, fontFamily: "monospace", fill: "currentColor" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "currentColor" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => people(v)} domain={[0, "auto"]} />
          <Tooltip formatter={(v: number) => [whole(v), "People"]} labelFormatter={(y) => (y === Y3 ? `${y} (projected)` : String(y))} contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 11 }} />
          <Area type="linear" dataKey="v" stroke={flagColor(cc) ?? COLOR} strokeWidth={1.75} fill={flagColor(cc) ?? COLOR} fillOpacity={0.12} dot={{ r: 2.5 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={name} className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${wide ? "max-w-full max-h-full m-0" : "max-w-2xl max-h-[90vh]"}`}>
        <div className="p-6">
          {/* Header: as a profiled city's */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={flag(cc, 160)} alt={`${land} flag`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold font-sans text-foreground">{name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`flex items-center gap-1 ${CHIP_TEXT}`}>
                    <MapPin size={12} weight="fill" /> {land}
                  </span>
                  {country?.continent && <span className={`text-xs border px-2 py-0.5 rounded-full font-sans ${tone}`}>{country.continent}</span>}
                  {capital ? <span className={CHIP_TEXT}>Capital</span> : null}
                  <span className={CHIP_TEXT} title={`By population in ${Y2}, among the ${UN_CITIES.length.toLocaleString("en-US")} cities the United Nations counts`}>
                    {nth(rank)} largest city in the world
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setWide((v) => !v)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label={wide ? "Collapse the window" : "Expand the window to full screen"} title={wide ? "Collapse" : "Expand to full screen"}>
                {wide ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
              </button>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Through to the same place on the other pages, as every window offers; and to its country's divisions. */}
          <SeeAlso code={cc} name={land} className="mb-2" />
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => navigate(`/dashboard/subnations?country=${cc}`)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
              {land} · its divisions <ArrowRight size={11} weight="bold" aria-hidden />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 mb-5">
            {(
              [
                { key: "overview", label: "Overview", icon: <ListBullets size={14} /> },
                { key: "history", label: "History", icon: <ClockCounterClockwise size={14} /> },
                { key: "map", label: "Map", icon: <MapTrifold size={14} /> },
              ] as const
            ).map((x) => (
              <button
                key={x.key}
                onClick={() => setTab(x.key)}
                aria-pressed={tab === x.key}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${tab === x.key ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}
              >
                {x.icon}
                {x.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-4">
              <Section title="👥 People & place" note="A city, to the UN, is contiguous 1 km² cells of at least 1,500 people each, holding 50,000 people or more - one rule for every city, whatever its boundary. That is why its figure and the city's own differ.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Tile label="Population" value={whole(p2)} sub={`UN estimate, ${Y2}`} />
                  <Tile label="Country" value={land} sub={country?.continent} />
                  <Tile label="Among the UN's cities" value={`#${rank.toLocaleString("en-US")}`} sub={`of ${UN_CITIES.length.toLocaleString("en-US")}, by ${Y2} population`} />
                </div>
              </Section>

              {eco && (
                <Section title="💰 Economy & institutions" note={`These are ${land}'s figures, not ${name}'s: no body publishes them city by city.`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {eco.gdpPerCapita && <Tile label="GDP per person" value={`$${eco.gdpPerCapita.v.toLocaleString("en-US")}`} sub={`${land}, current US$, ${eco.gdpPerCapita.y}`} />}
                    {eco.gdpGrowthRate && <Tile label="Real GDP growth" value={`${eco.gdpGrowthRate.v > 0 ? "+" : ""}${eco.gdpGrowthRate.v}%`} sub={`${land}, ${eco.gdpGrowthRate.y}`} />}
                    {eco.unemploymentRate && <Tile label="Unemployment" value={`${eco.unemploymentRate.v}%`} sub={`${land}, of the labour force, ${eco.unemploymentRate.y}`} />}
                    {eco.inflationRate && <Tile label="Inflation" value={`${eco.inflationRate.v}%`} sub={`${land}, consumer prices, ${eco.inflationRate.y}`} />}
                  </div>
                  <SourceLink sources={[ECONOMY_INDICATORS_SOURCE.worldBank, ECONOMY_INDICATORS_SOURCE.imf]} className="mt-2" />
                </Section>
              )}

              {/* The plain record the window first held: one of the Overview's sections. */}
              <Section title="📋 Its record" note="What the United Nations publishes for every city alike. A change is worked out here from two of its figures.">
                <div className="flex flex-col gap-3">
                  <div className="modal-tile rounded-xl px-4 py-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground pt-1.5">Identity</p>
                    <FigureRow label="Name" value={name} sub="as the United Nations writes it" />
                    <FigureRow label="Country" value={land} sub={`ISO 3166-1: ${cc}`} />
                    <FigureRow label="Its country's capital" value={capital ? "Yes" : "No"} />
                    <FigureRow label="The UN's code for it" value={String(code)} />
                  </div>
                  <div className="modal-tile rounded-xl px-4 py-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground pt-1.5">Geography</p>
                    <FigureRow label="Coordinates" value={lat !== null && lon !== null ? coords(lat, lon) : none} sub={lat !== null ? "where its people are centred" : undefined} />
                    <FigureRow label="Land area" value={area !== null ? `${whole(area)} km²` : none} sub={area !== null ? String(Y2) : undefined} />
                    <FigureRow label="People to a km²" value={density !== null ? whole(density) : none} sub={density !== null ? String(Y2) : undefined} />
                  </div>
                  <div className="modal-tile rounded-xl px-4 py-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground pt-1.5">Demographics</p>
                    <FigureRow label={`Population, ${Y2}`} value={whole(p2)} sub="the UN's last estimate" />
                    <FigureRow label={`Population, ${Y1}`} value={p1 !== null ? whole(p1) : none} />
                    <FigureRow label={`Population, ${Y0}`} value={p0 !== null ? whole(p0) : none} />
                    <FigureRow label={`Change, ${Y1} to ${Y2}`} value={since !== null ? signed(since) : none} sub={since !== null ? "worked out here from the two figures" : undefined} />
                    <FigureRow label={`Projected for ${Y3}`} value={p3 !== null ? whole(p3) : none} sub={ahead !== null ? `the UN's projection · ${signed(ahead)} on ${Y2}, worked out here` : undefined} />
                  </div>
                </div>
                <SourceLink sources={[UN_CITIES_SOURCE]} className="mt-2" />
              </Section>

              <Section title={`📈 Population, ${Y0} to ${Y3}`} note={`The UN's figures for ${Y0}, ${Y1} and ${Y2}, and its projection for ${Y3}, on an axis from zero.`}>
                {chart}
              </Section>

              {/* Quality of life: its country's, said to be so - as a profiled city's window gives it. */}
              <Suspense fallback={<p className="text-xs font-sans text-muted-foreground">Loading {land}'s figures…</p>}>
                <CountryQuality code={cc} country={land} place={name} />
              </Suspense>
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-4">
              <Section title={`📈 Its population, ${Y0} to ${Y3}`} note={`What is held of ${name}'s past is its population as the United Nations counts it: three estimates and a projection. No account of its history is recorded here.`}>
                {chart}
              </Section>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Tile label={String(Y0)} value={p0 !== null ? people(p0) : "Not held"} />
                <Tile label={String(Y1)} value={p1 !== null ? people(p1) : "Not held"} />
                <Tile label={String(Y2)} value={people(p2)} sub="the UN's last estimate" />
                <Tile label={String(Y3)} value={p3 !== null ? people(p3) : "Not held"} sub="the UN's projection" />
              </div>
              <SourceLink sources={[UN_CITIES_SOURCE]} />
            </div>
          )}

          {tab === "map" && (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 flex items-center gap-4 border ${tone}`}>
                <div>
                  <p className="text-xs font-semibold font-sans uppercase tracking-wide opacity-80">{country?.continent}</p>
                  <p className="font-bold font-sans text-lg leading-tight">{name}</p>
                  <p className="text-xs font-sans opacity-80">{land}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-sans opacity-80">Population</p>
                  <p className="font-mono font-bold text-sm">{people(p2)}</p>
                  <p className="font-mono text-xs opacity-80">UN estimate, {Y2}</p>
                </div>
              </div>
              {lat !== null && lon !== null ? (
                <div className="rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
                  <iframe title={`Map of ${name}`} width="100%" height="100%" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${lat},${lon}&z=11&output=embed`} />
                </div>
              ) : (
                <p className="text-xs font-sans text-muted-foreground py-6 text-center">No position is held for {name}.</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Land area", value: area !== null ? `${whole(area)} km²` : "Not held" },
                  { label: "Density", value: density !== null ? `${whole(density)}/km²` : "Not held" },
                  { label: "A capital", value: capital ? "Yes" : "No" },
                  { label: "Coordinates", value: lat !== null && lon !== null ? coords(lat, lon) : "Not held" },
                ].map((f) => (
                  <div key={f.label} className="modal-tile rounded-lg p-3 text-center min-w-0">
                    <p className="text-xs text-muted-foreground font-sans">{f.label}</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5 break-words">{f.value}</p>
                  </div>
                ))}
              </div>
              <ChartNote>
                The city as the United Nations draws it, {Y2}. The map is Google's and is opened on the point where the UN centres the city's people, not on the UN's outline.
              </ChartNote>
              <SourceLink sources={[UN_CITIES_SOURCE]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/** A continent's chip, in the tones the Countries page gives them. */
const CONTINENT_TONE: Record<string, string> = { "North America": TONE.blue, Asia: TONE.amber, Europe: TONE.violet, "South America": TONE.emerald, Africa: TONE.orange, Oceania: TONE.teal, Antarctica: TONE.sky };
const field = "bg-transparent border border-border rounded-full px-3 py-1.5 text-[12px] font-sans text-foreground focus:outline-none focus:border-foreground/40";

/** A country as the list has it: its cities, largest first, and what can be said of them together. */
type Row = { cc: string; name: string; continent: string; cities: UnCity[]; /** The people of all its cities, added up here. */ people: number; capital?: UnCity; /** How many hold a million people or more. */ big: number };
const ROWS: Row[] = COUNTRIES.map(({ cc, name }) => {
  const cities = UN_CITIES.filter((c) => c[0] === cc);
  return { cc, name, continent: COUNTRY.get(cc)?.continent ?? "", cities, people: cities.reduce((t, c) => t + c[8], 0), capital: cities.find((c) => c[5] === 1), big: cities.filter((c) => c[8] >= 1e6).length };
});
const ROW_OF = new Map(ROWS.map((r) => [r.cc, r]));

/** A city's card, inside its country's window. */
function CityCard({ c, onOpen }: { c: UnCity; onOpen: () => void }) {
  const since = change(c[7], c[8]);
  return (
    <button type="button" onClick={onOpen} className="modal-tile rounded-xl p-4 text-left cursor-pointer transition-colors hover:border-secondary/40 flex flex-col gap-2 min-w-0">
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold font-sans text-foreground truncate">{c[2]}</span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground truncate">
            <MapPin size={9} aria-hidden /> {c[5] ? "The capital" : "City"}
          </span>
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0" title="Its place among all the UN's cities, by population">
          #{RANK.get(unCityId(c))!.toLocaleString("en-US")}
        </span>
      </span>
      <span className="flex flex-col border-t border-border/40 pt-1.5">
        {(
          [
            [`Population · ${Y2}`, people(c[8])],
            [`Since ${Y1}`, since !== null ? signed(since) : undefined],
            ["Land area", c[10] !== null ? `${whole(c[10])} km²` : undefined],
            ["People to a km²", c[11] !== null ? whole(c[11]) : undefined],
          ] as [string, string | undefined][]
        ).map(([k, v]) => (
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
function CountryCard({ row, matching, onOpen }: { row: Row; /** How many of its cities answer the search, where it is they and not its name that do. */ matching: number; onOpen: () => void }) {
  const largest = row.cities[0];
  const slots: { label: string; value: string; text?: boolean }[] = [
    { label: "Cities", value: row.cities.length.toLocaleString("en-US") },
    { label: "People in them", value: people(row.people) },
    { label: "Largest", value: largest[2], text: true },
    { label: "Capital", value: row.capital?.[2] ?? "Not among them", text: true },
  ];
  const share = (100 * largest[8]) / row.people;
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
      aria-label={`${row.name}: its ${row.cities.length} cities`}
      className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40"
    >
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
              {[COUNTRY.get(row.cc)?.capital, row.continent].filter((x) => x && x !== "None").join(" · ")}
            </p>
            {matching > 0 && (
              <span className="inline-block mt-1 text-[10px] font-sans px-2 py-0.5 rounded-full border border-amber-600/40 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                {matching} of its cities {matching === 1 ? "matches" : "match"}
              </span>
            )}
          </div>
        </div>
        <span className="relative shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-background/60 text-foreground">{row.cc}</span>
      </div>
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
      {/* How much of the people of its cities live in the largest: out of all of them, in the country's own colour. Worked out here from the UN's figures. */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground font-sans">In its largest city</span>
          <span className="font-mono font-semibold text-foreground">{share.toFixed(0)}% of its cities' people</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${share}%`, background: flagColor(row.cc) ?? COLOR }} />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {row.continent && <span className={`text-[10px] border px-2 py-0.5 rounded-full font-sans ${CONTINENT_TONE[row.continent] ?? "text-muted-foreground border-border bg-muted"}`}>{row.continent}</span>}
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-foreground">{row.big} of a million or more</span>
      </div>
    </article>
  );
}

type Sort = "population" | "name" | "growth";

/** A country's window: every one of its cities, a card each. */
function CountryWindow({ row, top, asked, onOpen, onClose }: { row: Row; /** Whether it is the window on top: a city's opens over it. */ top: boolean; asked: string; onOpen: (c: UnCity) => void; onClose: () => void }) {
  const navigate = useNavigate();
  const country = COUNTRY.get(row.cc);
  const [query, setQuery] = useState(asked);
  const [sort, setSort] = useState<Sort>("population");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    if (!top) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, top]);
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);
  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? row.cities.filter((c) => c[2].toLowerCase().includes(q)) : [...row.cities];
    if (sort === "name") list.sort((a, b) => a[2].localeCompare(b[2]));
    if (sort === "growth") list.sort((a, b) => (change(b[7], b[8]) ?? -Infinity) - (change(a[7], a[8]) ?? -Infinity));
    return list;
  }, [row, query, sort]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`${row.name}: its cities`} className="relative z-10 rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl modal-glass border overflow-y-auto">
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={flag(row.cc, 160)} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Country · its cities</p>
                <h2 className="text-2xl font-bold font-sans text-foreground leading-tight">{row.name}</h2>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[`${row.cities.length.toLocaleString("en-US")} cities`, `${people(row.people)} people in them`, ...(row.continent ? [row.continent] : [])].map((x) => (
                    <span key={x} className="text-[11px] font-sans border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {country && (
              <button type="button" onClick={() => navigate(`/dashboard/countries?open=${country.id}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                Open {country.name} on the Countries page <ArrowRight size={11} weight="bold" aria-hidden />
              </button>
            )}
            <button type="button" onClick={() => navigate(`/dashboard/subnations?country=${row.cc}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold font-sans px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
              Its divisions <ArrowRight size={11} weight="bold" aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`flex items-center gap-1.5 ${field} focus-within:border-foreground/40`}>
              <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE);
                }}
                placeholder="Search its cities"
                aria-label={`Search the cities of ${row.name}`}
                className="bg-transparent w-44 sm:w-56 focus:outline-none placeholder:text-muted-foreground"
              />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="The order of the cities" className={field}>
              <option value="population">By population</option>
              <option value="name">By name</option>
              <option value="growth">By growth since {Y1}</option>
            </select>
          </div>
          <section aria-label="Cities">
            <h3 className="text-sm font-bold font-sans text-foreground mb-3">
              {query.trim() ? `${cities.length.toLocaleString("en-US")} of its ${row.cities.length.toLocaleString("en-US")} cities ${cities.length === 1 ? "matches" : "match"} "${query.trim()}"` : `The ${row.cities.length.toLocaleString("en-US")} cities the United Nations counts there`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cities.slice(0, shown).map((c) => (
                <CityCard key={unCityId(c)} c={c} onOpen={() => onOpen(c)} />
              ))}
            </div>
            {cities.length === 0 && <p className="text-[12px] font-sans text-muted-foreground">Nothing matches.</p>}
            {cities.length > shown && (
              <button type="button" onClick={() => setShown((n) => n + PAGE * 4)} className="mt-4 text-[11px] font-semibold font-sans px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer">
                Show more · {Math.min(shown, cities.length).toLocaleString("en-US")} of {cities.length.toLocaleString("en-US")} shown
              </button>
            )}
          </section>
          <SourceLink sources={[UN_CITIES_SOURCE]} />
        </div>
      </div>
    </div>
  );
}

type Order = "name" | "cities" | "people";

export default function AllCities({ openId, onOpened }: { /** A city to open, as a link names it. */ openId: string | null; onOpened: () => void }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>("name");
  /** The country whose window is open, and the city whose window is open over it. */
  const [country, setCountry] = useState<string | null>(null);
  const [open, setOpen] = useState<UnCity | null>(null);
  useEffect(() => {
    if (!openId) return;
    const found = BY_ID.get(openId);
    if (found) setCountry(found[0]), setOpen(found);
    onOpened();
  }, [openId, onOpened]);

  /* The countries that answer: by their own name, or by a city's. */
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ROWS.flatMap((r) => {
      if (!q || r.name.toLowerCase().includes(q)) return [{ row: r, matching: 0 }];
      const matching = r.cities.filter((c) => c[2].toLowerCase().includes(q)).length;
      return matching ? [{ row: r, matching }] : [];
    });
    if (order === "cities") return [...list].sort((a, b) => b.row.cities.length - a.row.cities.length);
    if (order === "people") return [...list].sort((a, b) => b.row.people - a.row.people);
    return list;
  }, [query, order]);
  const openRow = country ? (ROW_OF.get(country) ?? null) : null;
  /** A city's search carried into its country's window, where it was the cities and not the country's name that answered. */
  const carried = openRow && rows.find((r) => r.row.cc === openRow.cc)?.matching ? query.trim() : "";
  return (
    <section id="all-cities" aria-label="Every city the United Nations counts" className="mt-10 scroll-mt-32">
      <h2 className="text-lg font-bold font-sans text-foreground">Every city the United Nations counts</h2>
      <p className="text-[12px] font-sans text-muted-foreground mt-1 max-w-3xl">
        {UN_CITIES.length.toLocaleString("en-US")} cities in {ROWS.length} countries. Open a country for its cities, and a city for its own window. A city here is what the UN's method draws
        - built-up land of at least 1,500 people to a km² holding 50,000 or more - not the administrative city, so its figure can differ from the one its own council gives.
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
        <label className={`flex items-center gap-1.5 ${field} focus-within:border-foreground/40`}>
          <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a country, or any city" aria-label="Search the countries by name, or by the name of a city" className="bg-transparent w-52 sm:w-64 focus:outline-none placeholder:text-muted-foreground" />
        </label>
        <select value={order} onChange={(e) => setOrder(e.target.value as Order)} aria-label="The order of the countries" className={field}>
          <option value="name">By name</option>
          <option value="cities">By number of cities</option>
          <option value="people">By people in their cities</option>
        </select>
        <span className="text-[11px] font-mono text-muted-foreground">{rows.length} countries</span>
      </div>
      {/* COUNTRY CARDS GRID: as the Countries page and the Subnations page lay theirs out */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rows.map(({ row, matching }) => (
          <CountryCard key={row.cc} row={row} matching={matching} onOpen={() => setCountry(row.cc)} />
        ))}
      </div>
      {rows.length === 0 && <p className="text-[12px] font-sans text-muted-foreground">Nothing matches.</p>}
      <p className="text-[10px] font-sans leading-relaxed text-muted-foreground mt-4">
        The people in a country's cities, and its largest city's share of them, are added up and worked out here from the UN's figure for each city. A capital is "not among them"
        where the UN counts no city of 50,000 or more as the country's capital.
      </p>
      <SourceLink sources={[UN_CITIES_SOURCE]} className="mt-1" />
      {openRow && <CountryWindow key={openRow.cc} row={openRow} top={!open} asked={carried} onOpen={setOpen} onClose={() => setCountry(null)} />}
      {open && <CityWindow c={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

