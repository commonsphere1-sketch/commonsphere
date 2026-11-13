/**
 * A place's history, year by year, as asked for the Climate and Crime pages: one country at a time, chosen by name as on
 * Polls & Elections, and within it each of its divisions the records hold - its states, provinces or regions, and within
 * those their counties and cities. Drawn with the site's own range of charts, as the Worldview page and the Countries
 * windows are (as asked): figure tiles of the latest year against ten years before; for each of the page's kinds of
 * figure (`groups`) the chart that suits it - an area, lines, bars by the year, a band from the days' lows to their
 * highs, a strip of the years in colour, or slim bars of the latest year against ten years before; and the place's own
 * parts ranked. Each card has its legend, its sources and a CSV.
 *
 * Reads static/<topic>/history/ (written by place-history-lib.cjs and the builds that use it): each country's file, and a
 * division's own parts from more/<id>.json when it is chosen. Every figure is the source's own; a year a source does not
 * give is a gap in its line. The changes in the tiles are the two figures set side by side, not worked into a rate.
 */
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CountryFind } from "./OccurrencePanel";
import { SourceLink } from "./SourceLink";
import { CsvButton, FigureTile, MeasureBars } from "./ModalCharts";
import { type Tip, TipCard } from "./TipCard";
import { countriesData } from "../data/countriesData";
import { useTokens, type Tokens } from "../lib/cardTokens";

type Def = { label: string; unit: string; say: string };
type Source = { label: string; url: string; note?: string };
/** [first year, a value for each year on, null where none]. */
type Series = (number | null)[];
type Place = { id: string; name: string; kind: string; parent?: string; series: Record<string, Series>; from: Record<string, string> };
type HistoryFile = { cc: string; of?: string; defs: Record<string, Def>; sources: Record<string, Source>; places: Place[]; more?: Record<string, number> };
/** How a kind of figure is drawn. */
export type HistoryKind = "lines" | "area" | "bars" | "band" | "stripes" | "thenNow" | "records" | "stack";
/** One of the page's kinds of figure: a card, its title, the line over its title, the figures drawn in it with their colours, and how. */
export type HistoryGroup = { title: string; sub: string; lines: [key: string, colour: string][]; kind?: HistoryKind; /** The section it is read under: Temperature, Rain and drought... */ section?: string };

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const PLURAL: Record<string, string> = { country: "Country", state: "States", province: "Provinces", territory: "Territories", region: "Regions", jurisdiction: "Jurisdictions", county: "Counties", municipality: "Municipalities", city: "Cities" };
const SINGULAR: Record<string, string> = { country: "country", state: "state", province: "province", territory: "territory", region: "region", jurisdiction: "jurisdiction", county: "county", municipality: "municipality", city: "city" };
const whole = (v: number) => v.toLocaleString("en-US");

/** A figure as the reader reads it: to the places that mean something at its size, with its unit. */
function said(v: number, unit: string) {
  const a = Math.abs(v);
  const n = a >= 100 ? Math.round(v).toLocaleString("en-US") : a >= 10 ? v.toFixed(1) : v.toFixed(2);
  const UNIT: Record<string, string> = { per100k: " per 100,000", degC: " °C", degF: " °F", mm: " mm", in: " in", mt: " million t", t: " t", days: " days", dd: " degree-days", months: " months", ugm3: " µg/m³", pct: "%" };
  if (unit === "magnitude") return `M${v.toFixed(1)}`;
  if (unit === "aqi") return `AQI ${Math.round(v)}`;
  return unit === "count" ? Math.round(v).toLocaleString("en-US") : `${n}${UNIT[unit] ?? ""}`;
}
/** A scale's figure, short. */
const tick = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.abs(v) >= 10 ? `${Math.round(v)}` : `${Math.round(v * 10) / 10}`);
/** The unit in a heading. */
const UNIT_SAID: Record<string, string> = { per100k: "per 100,000 people", degC: "°C", degF: "°F", mm: "mm", in: "inches", mt: "million tonnes", t: "tonnes", index: "index", count: "number", days: "days a year", dd: "degree-days, °F", months: "months a year", ugm3: "micrograms per cubic metre", pct: "% of people", aqi: "Air Quality Index", magnitude: "magnitude" };
const isTemperature = (unit: string) => unit === "degC" || unit === "degF";

const at = (s: Series, y: number) => (y >= (s[0] as number) ? (s[1 + y - (s[0] as number)] ?? null) : null);
const lastYear = (s: Series) => (s[0] as number) + s.length - 2;
/** A series' latest year with a figure, and the figure. */
function latest(s: Series): [number, number] | null {
  for (let y = lastYear(s); y >= (s[0] as number); y--) {
    const v = at(s, y);
    if (v != null) return [y, v];
  }
  return null;
}
/** Its figure ten years before its latest - or the nearest year after that it gives, or its first. */
function before(s: Series): [number, number] | null {
  const l = latest(s);
  if (!l) return null;
  for (let y = Math.max(s[0] as number, l[0] - 10); y < l[0]; y++) {
    const v = at(s, y);
    if (v != null) return [y, v];
  }
  return null;
}
/** The years the keys span, each a row: {year, key: value}. */
function rowsOf(place: Place, keys: string[]) {
  let lo = Infinity, hi = -Infinity;
  for (const k of keys) {
    lo = Math.min(lo, place.series[k][0] as number);
    hi = Math.max(hi, lastYear(place.series[k]));
  }
  const data: Record<string, number | null>[] = [];
  for (let y = lo; y <= hi; y++) data.push({ year: y, ...Object.fromEntries(keys.map((k) => [k, at(place.series[k], y)])) });
  return { data, lo, hi };
}

export function PlaceHistory({
  topic,
  title,
  accent,
  groups,
  tiles = [],
  compare = [],
  onPlace,
  events = false,
  chooserLabel,
  notes,
  empty,
  className = "mb-6",
}: {
  /** Whether the country's alerted disasters are listed (static/<topic>/disasters/<CC>.json). */
  events?: boolean;
  topic: "climate" | "crime";
  title: string;
  /** The page's own colour, for the lines over the cards' titles. */
  accent: string;
  groups: HistoryGroup[];
  /** The figures for the tiles at the head, in order: the first four the place has are shown. */
  tiles?: string[];
  /** The figures to rank the place's parts by, where three or more of them have it. */
  compare?: string[];
  /** Told the place chosen - its country, and the divisions within it chosen, the nearest first - for the rest of the page to follow. */
  onPlace?: (where: { cc: string; country: string; divisions: string[] }) => void;
  chooserLabel: string;
  notes: ReactNode;
  /** Said where a country has no history held ("{country}" is its name). */
  empty: string;
  className?: string;
}) {
  const t = useTokens();
  const [country, setCountry] = useState<{ code: string; name: string }>({ code: "US", name: NAME.get("US") ?? "United States" });
  const [index, setIndex] = useState<Record<string, [number, number, number]>>({});
  const [file, setFile] = useState<HistoryFile | null | undefined>(undefined);
  const [placeId, setPlaceId] = useState("");
  const [parts, setParts] = useState<HistoryFile | null>(null);
  const [partId, setPartId] = useState("");

  useEffect(() => {
    let live = true;
    fetch(`/${topic}/history/index.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => live && setIndex(j))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [topic]);

  useEffect(() => {
    let live = true;
    setFile(undefined);
    setPlaceId("");
    fetch(`/${topic}/history/${country.code}.json`)
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? (r.json() as Promise<HistoryFile>) : null))
      .then((j) => {
        if (!live) return;
        setFile(j);
        if (j?.places.length) setPlaceId((j.places.find((p) => p.kind === "country") ?? j.places[0]).id);
      })
      .catch(() => live && setFile(null));
    return () => {
      live = false;
    };
  }, [topic, country.code]);

  // A division's own parts - its counties or cities - read when it is chosen.
  useEffect(() => {
    let live = true;
    setParts(null);
    setPartId("");
    if (!file?.more?.[placeId]) return;
    fetch(`/${topic}/history/more/${placeId}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<HistoryFile>) : null))
      .then((j) => live && setParts(j))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [topic, file, placeId]);

  const place = file?.places.find((p) => p.id === placeId);
  const part = parts?.places.find((p) => p.id === partId);
  const shown = part ?? place;
  const shownFile = part ? parts! : file;
  // The place it is part of: a county's state, a state's country.
  const above = part ? place : shown?.parent ? file?.places.find((q) => q.id === shown.parent) : undefined;
  useEffect(() => {
    onPlace?.({ cc: country.code, country: country.name, divisions: [part?.name, place && place.kind !== "country" ? place.name : undefined].filter((n): n is string => Boolean(n)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country.code, country.name, part?.id, place?.id]);
  const kinds = useMemo(() => {
    const g = new Map<string, Place[]>();
    for (const p of file?.places ?? []) g.set(p.kind, [...(g.get(p.kind) ?? []), p]);
    return [...g.entries()];
  }, [file]);
  const idx = index[country.code];
  const cards = shown && shownFile ? groups.map((g) => ({ ...g, lines: g.lines.filter(([k]) => shown.series[k] && shownFile.defs[k]) })).filter((g) => g.lines.length) : [];
  // The parts ranked: a country's divisions, a division's counties or cities, a county among its state's.
  const among = !shown || !file ? [] : shown.kind === "country" ? file.places.filter((p) => p.kind !== "country") : (parts?.places ?? []);
  const amongFile = shown && shown.kind !== "country" && parts ? parts : file;
  const ranks = amongFile ? compare.filter((k) => amongFile.defs[k] && among.filter((p) => p.series[k]).length >= 3) : [];
  const tileKeys = shown && shownFile ? tiles.filter((k) => shown.series[k] && shownFile.defs[k] && latest(shown.series[k])).slice(0, 4) : [];
  const card = { background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow };
  const selectClass = "rounded-lg border border-border bg-background/60 px-2 py-1.5 text-[12px] font-sans text-foreground cursor-pointer min-w-0 max-w-full sm:max-w-[18rem]";

  return (
    <section aria-label={title} className={`flex flex-col gap-4 ${className}`}>
      {/* The country, and within it the place. */}
      <div className="rounded-2xl p-5" style={card}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: t.isLight ? accent : `${accent}bb` }}>
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <CountryFind onPick={setCountry} label={chooserLabel} />
          <h2 className="text-base font-bold font-sans" style={{ color: t.headText }}>
            {part && place ? `${part.name}, ${place.name}` : shown && shown.kind !== "country" ? `${shown.name}, ${country.name}` : country.name}
            {shown && shown.kind !== "country" && <span className="font-normal text-[12px]" style={{ color: t.mutedText }}> · {SINGULAR[shown.kind] ?? shown.kind}</span>}
          </h2>
          {idx && (
            <p className="text-[10px] font-mono" style={{ color: t.mutedText }}>
              {idx[0]} to {idx[1]}
              {idx[2] ? ` · ${whole(idx[2])} ${idx[2] === 1 ? "division" : "divisions"} held` : " · the country as a whole"}
            </p>
          )}
        </div>
        {file && (file.places.length > 1 || file.more) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <select value={placeId} onChange={(e) => setPlaceId(e.target.value)} aria-label={`A place in ${country.name}`} className={selectClass}>
              {kinds.map(([kind, ps]) => (
                <optgroup key={kind} label={PLURAL[kind] ?? kind}>
                  {ps.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {file.more?.[p.id] ? ` (${whole(file.more[p.id])} parts)` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {parts && parts.places.length > 0 && (
              <select value={partId} onChange={(e) => setPartId(e.target.value)} aria-label={`A part of ${place?.name}`} className={selectClass}>
                <option value="">All of {place?.name}</option>
                {[...new Set(parts.places.map((p) => p.kind))].map((kind) => (
                  <optgroup key={kind} label={PLURAL[kind] ?? kind}>
                    {parts.places
                      .filter((p) => p.kind === kind)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
        )}
        {file === undefined && (
          <p className="text-[11px] font-sans mt-2" style={{ color: t.mutedText }}>
            Reading its history…
          </p>
        )}
        {(file === null || (file && !file.places.length)) && (
          <p className="text-[11px] font-sans mt-2" style={{ color: t.mutedText }}>
            {empty.replace("{country}", country.name)}
          </p>
        )}
        {/* The latest year of its main figures, each against ten years before and, for a part, the place it is part of. */}
        {shown && shownFile && tileKeys.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {tileKeys.map((k) => {
              const d = shownFile.defs[k];
              const [y, v] = latest(shown.series[k])!;
              const b = before(shown.series[k]);
              const up = above && above.series[k] && above.from[k] === shown.from[k] ? at(above.series[k], y) : null;
              return (
                <FigureTile
                  key={k}
                  label={d.label}
                  value={said(v, d.unit)}
                  sub={[String(y), b ? `${said(b[1], d.unit)} in ${b[0]}` : null, up != null && above ? `${above.name} ${said(up, d.unit)}` : null].filter(Boolean).join(" · ")}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* The figures in their sections, as asked for a clearer history: a bar that keeps the place in view and leads to each
          section; the years in colour and the records first, across the whole width; then each section under its heading, its
          sources' notes said once at its foot; the place's parts ranked; and its disasters. */}
      {shown && shownFile && cards.length > 0 && (
        <HistorySections
          t={t}
          accent={accent}
          placeName={part && place ? `${part.name}, ${place.name}` : shown.kind !== "country" ? `${shown.name}, ${country.name}` : country.name}
          cards={cards}
          card={(g, quiet) => <HistoryCard key={`${shown.id}-${g.title}`} t={t} accent={accent} group={g} place={shown} file={shownFile} above={above} quiet={quiet} />}
          notesOf={(g) =>
            [...new Set(g.lines.map(([k]) => shown.from[k]))].flatMap((src) => {
              const so = shownFile.sources[src];
              return so?.note ? [[so.label, so.note] as [string, string]] : [];
            })
          }
          ranked={
            amongFile && ranks.length
              ? ranks.map((k) => <RankCard key={`rank-${k}`} t={t} accent={accent} k={k} places={among} file={amongFile} shown={shown} whole={shown.kind === "country" || !part ? shown : above} />)
              : []
          }
          events={events ? <EventsCard key={`events-${country.code}`} t={t} accent={accent} topic={topic} cc={country.code} country={country.name} /> : null}
        />
      )}

      <div className="text-[10px] font-sans leading-snug space-y-1 px-1" style={{ color: t.mutedText }}>
        {notes}
      </div>
    </section>
  );
}

/** A card as the pages' chart cards are: the line over its title, its title and years, the chart, a legend, sources, a CSV. */
function ChartCard({ t, accent, title, sub, years, legend, sources, csv, notes, children }: { t: Tokens; accent: string; title: string; sub: string; years: string; legend?: [string, string, string?][]; sources: Source[]; csv: { name: string; header: string[]; rows: (string | number | null)[][] }; notes?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl p-5 min-w-0" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: t.isLight ? accent : `${accent}bb` }}>
          {sub}
        </p>
        <h3 className="text-base font-bold font-sans flex items-center gap-2" style={{ color: t.headText }}>
          {title}
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${accent}26`, color: accent }}>
            {years}
          </span>
        </h3>
      </div>
      {children}
      {legend && legend.length > 0 && (
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
          {legend.map(([name, colour, dash]) => (
            <div key={name} className="flex items-center gap-1">
              <div className="w-3 h-0.5 rounded-full" style={{ background: dash ? undefined : colour, borderTop: dash ? `1.5px dashed ${colour}` : undefined }} />
              <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mt-3">
        <SourceLink sources={sources.map((s) => ({ label: s.label, url: s.url }))} />
        <CsvButton name={csv.name} header={csv.header} rows={csv.rows} />
      </div>
      {notes && (
        <p className="text-[10px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
          {notes}
        </p>
      )}
    </div>
  );
}

/** The frosted card by the pointer, for the charts' own tooltips. */
function Frosted({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <div className="rounded-lg border border-border bg-background/70 backdrop-blur-md backdrop-saturate-150 shadow-lg px-2.5 py-2 max-w-[18rem]">
      <p className="text-[11px] font-semibold font-sans text-foreground leading-snug">{title}</p>
      {rows.map(([name, colour, text]) => (
        <p key={name} className="text-[10px] font-mono leading-snug mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block w-2.5 h-0.5 rounded-full shrink-0" style={{ background: colour }} />
          {name}: {text}
        </p>
      ))}
    </div>
  );
}

/** One kind of figure for the place, in the chart that suits it. */
function HistoryCard({ t, accent, group, place, file, above, quiet = false }: { t: Tokens; accent: string; group: HistoryGroup; place: Place; file: HistoryFile; above?: Place; /** Its sources' notes said once for its section, not on the card. */ quiet?: boolean }) {
  const keys = group.lines.map(([k]) => k);
  const colourOf = Object.fromEntries(group.lines);
  const unit = file.defs[keys[0]].unit;
  const { data, lo, hi } = rowsOf(place, keys);
  const sources = [...new Set(keys.map((k) => place.from[k]))].map((s) => file.sources[s]).filter(Boolean);
  const label = (k: string) => file.defs[k].label;
  const kind = group.kind ?? "lines";
  const many = data.length > 40;
  const fromZero = !isTemperature(unit);
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false };
  const yAxis = <YAxis {...axis} tickFormatter={tick} domain={fromZero ? [(m: number) => Math.min(0, Math.floor(m)), "auto"] : [(m: number) => Math.floor(m - 0.5), (m: number) => Math.ceil(m + 0.5)]} width={44} />;
  const tip = (extra?: (year: number) => [string, string, string][]) => (
    <Tooltip
      cursor={{ stroke: t.mutedText, strokeOpacity: 0.4, fill: t.mutedText, fillOpacity: 0.08 }}
      content={({ active, label: y }) =>
        active && y != null ? (
          <Frosted
            title={`${place.name}, ${y}`}
            rows={[
              ...group.lines.map(([k, c]) => {
                const v = at(place.series[k], Number(y));
                return [label(k), c, v == null ? "not held" : said(v, file.defs[k].unit)] as [string, string, string];
              }),
              ...(extra ? extra(Number(y)) : []),
            ]}
          />
        ) : null
      }
    />
  );
  const csv = { name: `${place.name} - ${group.title}`, header: ["year", ...keys.map((k) => `${label(k)} (${UNIT_SAID[file.defs[k].unit] ?? file.defs[k].unit})`)], rows: [...data].reverse().map((r) => [r.year, ...keys.map((k) => r[k])]) };
  const notes = sources.map((s) => s.note).filter(Boolean).join(" ");
  const years = lo === hi ? String(lo) : `${lo}–${hi}`;
  const common = { t, accent, title: group.title, sub: group.sub, years, sources, csv, notes: quiet ? undefined : notes };

  // The place it is part of, drawn behind where the same source gives the same figure.
  const k0 = keys[0];
  const behind = above && above.series[k0] && above.from[k0] === place.from[k0] ? above : undefined;

  if (kind === "area") {
    const rows = data.map((r) => ({ ...r, above: behind ? at(behind.series[k0], r.year as number) : null }));
    const c = colourOf[k0];
    return (
      <ChartCard {...common} legend={[[label(k0), c], ...(behind ? ([[`${behind.name}, for comparison`, t.mutedText, "dash"]] as [string, string, string][]) : [])]}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={rows} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${k0}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                <stop offset="100%" stopColor={c} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" />
            <XAxis dataKey="year" {...axis} minTickGap={18} />
            {yAxis}
            {tip((y) => (behind ? [[behind.name, t.mutedText, ((v) => (v == null ? "not held" : said(v, unit)))(at(behind.series[k0], y))]] : []))}
            {behind && <Line type="monotone" dataKey="above" stroke={t.mutedText} strokeDasharray="4 3" strokeWidth={1.4} dot={false} connectNulls={false} isAnimationActive={false} />}
            <Area type="monotone" dataKey={k0} stroke={c} strokeWidth={2} fill={`url(#fill-${k0})`} connectNulls={false} isAnimationActive={false} dot={many ? false : { r: 2.2, fill: c, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if (kind === "bars") {
    return (
      <ChartCard {...common} legend={group.lines.length > 1 ? group.lines.map(([k, c]) => [label(k), c] as [string, string]) : undefined}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis} minTickGap={18} />
            {yAxis}
            {tip()}
            {group.lines.map(([k, c]) => (
              <Bar key={k} dataKey={k} fill={c} fillOpacity={0.85} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if (kind === "band" && keys.length >= 3) {
    // The days' highs and lows as a band, the year's mean as a line through it.
    const [hiK, meanK, loK] = keys;
    const rows = data.map((r) => ({ ...r, band: r[hiK] != null && r[loK] != null ? [r[loK], r[hiK]] : null }));
    return (
      <ChartCard {...common} legend={[[`${label(loK)} to ${label(hiK).toLowerCase()}`, colourOf[hiK]], [label(meanK), colourOf[meanK]]]}>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={rows} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" />
            <XAxis dataKey="year" {...axis} minTickGap={18} />
            {yAxis}
            {tip()}
            <Area type="monotone" dataKey="band" stroke="none" fill={colourOf[hiK]} fillOpacity={0.18} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={hiK} stroke={colourOf[hiK]} strokeOpacity={0.55} strokeWidth={1} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={loK} stroke={colourOf[loK]} strokeOpacity={0.55} strokeWidth={1} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={meanK} stroke={colourOf[meanK]} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if (kind === "stripes") return <StripesCard common={common} place={place} k={k0} def={file.defs[k0]} lo={lo} hi={hi} />;

  if (kind === "records") return <RecordsCard common={common} place={place} file={file} keys={keys} />;

  if (kind === "stack") {
    // Parts of a whole by the year - the kinds of a count - one bar on another.
    return (
      <ChartCard {...common} legend={group.lines.map(([k, c]) => [label(k), c] as [string, string])}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...axis} minTickGap={18} />
            {yAxis}
            {tip()}
            {group.lines.map(([k, c]) => (
              <Bar key={k} dataKey={k} stackId="parts" fill={c} fillOpacity={0.88} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if (kind === "thenNow") {
    // Each figure's latest year, its bar, and a tick where it stood ten years before.
    const rows = keys.flatMap((k) => {
      const l = latest(place.series[k]);
      if (!l) return [];
      const b = before(place.series[k]);
      return [{ key: k, label: label(k), value: l[1], text: said(l[1], file.defs[k].unit), sub: String(l[0]), color: colourOf[k], world: b ? { value: b[1], text: `${said(b[1], file.defs[k].unit)} in ${b[0]}` } : null }];
    });
    return (
      <ChartCard {...common} sub={`${group.sub} · the latest year, the tick ten years before`}>
        <MeasureBars rows={rows} label={`${place.name} - ${group.title}`} refName="then" csv={false} />
      </ChartCard>
    );
  }

  // Lines: several figures over the years.
  return (
    <ChartCard {...common} legend={group.lines.map(([k, c], i) => [label(k), c, i === 3 ? "dash" : undefined] as [string, string, string?])}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" />
          <XAxis dataKey="year" {...axis} minTickGap={18} />
          {yAxis}
          {tip()}
          {group.lines.map(([k, c], i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={c}
              strokeWidth={2}
              strokeDasharray={i === 3 ? "5 2" : undefined}
              connectNulls={false}
              isAnimationActive={false}
              // A dot for each year where the years are few; where they are many, only for a year standing alone between gaps.
              dot={(p: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
                const lone = p.index !== undefined && (data[p.index - 1]?.[k] ?? null) == null && (data[p.index + 1]?.[k] ?? null) == null;
                return p.value != null && p.cx != null && p.cy != null && (!many || lone) ? <circle key={`${k}-${p.index}`} cx={p.cx} cy={p.cy} r={2.5} fill={c} /> : <g key={`${k}-${p.index}`} />;
              }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Each year as a stripe, from the place's coolest year in its record (blue) to its warmest (red): the shape of its record at a glance. */
function StripesCard({ common, place, k, def, lo, hi }: { common: Omit<Parameters<typeof ChartCard>[0], "children">; place: Place; k: string; def: Def; lo: number; hi: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [tipAt, setTipAt] = useState<Tip | null>(null);
  const s = place.series[k];
  const vals = s.slice(1).filter((v): v is number => v != null);
  const min = Math.min(...vals), max = Math.max(...vals);
  const n = hi - lo + 1;
  const colour = (v: number) => {
    const f = max === min ? 0.5 : (v - min) / (max - min);
    // Blue through a pale middle to red.
    const mix = (a: number[], b: number[], u: number) => a.map((x, i) => Math.round(x + (b[i] - x) * u));
    const [r, g, b] = f < 0.5 ? mix([29, 78, 216], [226, 232, 240], f * 2) : mix([226, 232, 240], [220, 38, 38], (f - 0.5) * 2);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <ChartCard {...common} sub={`${common.sub} · its coolest year blue, its warmest red`}>
      <div
        ref={box}
        className="relative"
        onMouseMove={(e) => {
          const r = box.current!.getBoundingClientRect();
          const y = lo + Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
          const v = at(s, y);
          setTipAt({ x: e.clientX - r.left, y: e.clientY - r.top, title: `${place.name}, ${y}`, lines: [`${def.label}: ${v == null ? "not held" : said(v, def.unit)}`] });
        }}
        onMouseLeave={() => setTipAt(null)}
      >
        <svg viewBox={`0 0 ${n} 40`} preserveAspectRatio="none" className="w-full h-40 block rounded-lg" role="img" aria-label={`${def.label}, ${place.name}, each year from ${lo} to ${hi} in colour`}>
          {Array.from({ length: n }, (_, i) => {
            const v = at(s, lo + i);
            return v == null ? null : <rect key={i} x={i} y={0} width={1.02} height={40} fill={colour(v)} />;
          })}
        </svg>
        <div className="flex justify-between text-[9px] font-mono mt-1" style={{ color: common.t.mutedText }}>
          <span>{lo}</span>
          <span>
            {said(min, def.unit)} to {said(max, def.unit)}
          </span>
          <span>{hi}</span>
        </div>
        {tipAt && <TipCard tip={tipAt} room={box.current?.clientWidth ?? 300} />}
      </div>
    </ChartCard>
  );
}

/** The place's parts ranked by one figure, each in its latest year; the place being read marked, and the whole's figure ticked where the same source gives it. */
function RankCard({ t, accent, k, places, file, shown, whole: total }: { t: Tokens; accent: string; k: string; places: Place[]; file: HistoryFile; shown: Place; whole?: Place }) {
  const d = file.defs[k];
  // One source's figures only, so that the bars are alike: the source most of the parts have.
  const counts = new Map<string, number>();
  for (const p of places) if (p.series[k]) counts.set(p.from[k], (counts.get(p.from[k]) ?? 0) + 1);
  const src = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  // One kind of place only - counties with counties, cities with cities: the kind being read, or the commonest.
  const kinds = new Map<string, number>();
  for (const p of places) if (p.series[k] && p.from[k] === src) kinds.set(p.kind, (kinds.get(p.kind) ?? 0) + 1);
  const kindPick = kinds.has(shown.kind) ? shown.kind : [...kinds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const list = places
    .filter((p) => p.series[k] && p.from[k] === src && p.kind === kindPick)
    .flatMap((p) => {
      const l = latest(p.series[k]);
      return l ? [{ p, y: l[0], v: l[1] }] : [];
    })
    .sort((a, b) => b.v - a.v);
  const ref = total && total.series[k] && total.from[k] === src ? latest(total.series[k]) : null;
  const rows = list.map(({ p, y, v }) => ({
    key: p.id,
    label: p.id === shown.id ? `${p.name} ◂` : p.name,
    // A figure that runs below nought (a drought index) is ranked by its figures alone: a bar from nought would hide it.
    value: list.some((x) => x.v < 0) ? undefined : v,
    text: said(v, d.unit),
    sub: String(y),
    color: p.id === shown.id ? accent : `${accent}88`,
    world: ref ? { value: ref[1], text: said(ref[1], d.unit) } : null,
  }));
  const years = list.length ? `${Math.min(...list.map((x) => x.y))}${Math.min(...list.map((x) => x.y)) === Math.max(...list.map((x) => x.y)) ? "" : `–${Math.max(...list.map((x) => x.y))}`}` : "";
  const kindWord = (PLURAL[list[0]?.p.kind ?? "region"] ?? "Parts").toLowerCase();
  return (
    <ChartCard
      t={t}
      accent={accent}
      title={`${d.label}, its ${kindWord} ranked`}
      sub={`${UNIT_SAID[d.unit] ?? d.unit} · each in its latest year`}
      years={years}
      sources={src ? [file.sources[src]].filter(Boolean) : []}
      csv={{ name: `${d.label} - ${kindWord} ranked`, header: ["place", "year", `${d.label} (${UNIT_SAID[d.unit] ?? d.unit})`], rows: list.map(({ p, y, v }) => [p.name, y, v]) }}
      notes={ref && total ? `The tick on each bar is ${total.name}'s own figure, ${said(ref[1], d.unit)} in ${ref[0]}.` : undefined}
    >
      <div className="max-h-80 overflow-y-auto pr-1">
        <MeasureBars rows={rows} max={Math.max(...list.map((x) => x.v), ref?.[1] ?? 0)} label={`${d.label}, ranked`} refName={total?.name ?? ""} csv={false} />
      </div>
    </ChartCard>
  );
}

/**
 * The place's records, as asked: for each figure, its highest and its lowest year in the record - worked out here from the
 * source's own series, the year said with each - as rows, the way the site's figure rows are.
 */
function RecordsCard({ common, place, file, keys }: { common: Omit<Parameters<typeof ChartCard>[0], "children">; place: Place; file: HistoryFile; keys: string[] }) {
  const rows = keys.flatMap((k) => {
    const s = place.series[k];
    let hi: [number, number] | null = null;
    let lo: [number, number] | null = null;
    for (let y = s[0] as number; y <= lastYear(s); y++) {
      const v = at(s, y);
      if (v == null) continue;
      if (!hi || v > hi[1]) hi = [y, v];
      if (!lo || v < lo[1]) lo = [y, v];
    }
    return hi && lo ? [{ k, def: file.defs[k], hi, lo, span: `${s[0]}–${lastYear(s)}` }] : [];
  });
  const t = common.t;
  return (
    <ChartCard
      {...common}
      sub={`${common.sub} · worked out here from each series`}
      csv={{ name: `${place.name} - records`, header: ["figure", "unit", "highest", "in", "lowest", "in", "years read"], rows: rows.map((r) => [r.def.label, UNIT_SAID[r.def.unit] ?? r.def.unit, r.hi[1], r.hi[0], r.lo[1], r.lo[0], r.span]) }}
    >
      {/* Across the whole width, as asked: the rows in two halves side by side on a wide screen, each with its head. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
        {[rows.slice(0, Math.ceil(rows.length / 2)), rows.slice(Math.ceil(rows.length / 2))].map((half, n) => (
          <div key={n} className="flex flex-col min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 pb-1.5 text-[9px] font-mono uppercase tracking-wider" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
              <span>Figure</span>
              <span className="text-right">Highest</span>
              <span className="text-right">Lowest</span>
            </div>
            {half.map((r) => (
              <div key={r.k} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 py-1.5 items-baseline" style={{ borderBottom: `1px solid ${t.gridLine}` }} title={r.def.say}>
                <span className="min-w-0">
                  <span className="block text-[11px] font-sans truncate" style={{ color: t.headText }}>
                    {r.def.label}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {r.span}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[11px] font-mono font-bold" style={{ color: "#ef4444" }}>
                    {said(r.hi[1], r.def.unit)}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {r.hi[0]}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[11px] font-mono font-bold" style={{ color: "#3b82f6" }}>
                    {said(r.lo[1], r.def.unit)}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {r.lo[0]}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

type AlertedEvent = { date: string; to?: string; kind: string; name: string; alert: "Orange" | "Red"; scale: string; url?: string };
const ALERT_INK = { Red: "#ef4444", Orange: "#f59e0b" } as const;
const dayOf = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * The country's alerted disasters, newest first, as asked: each event GDACS raised an orange or red alert for, its date,
 * kind, alert and scale in GDACS's own words, and its report; narrowed by kind, the first fifteen and the rest on asking.
 */
function EventsCard({ t, accent, topic, cc, country }: { t: Tokens; accent: string; topic: string; cc: string; country: string }) {
  const [file, setFile] = useState<{ source: Source; events: AlertedEvent[] } | null | undefined>(undefined);
  const [kind, setKind] = useState("all");
  const [all, setAll] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`/${topic}/disasters/${cc}.json`)
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
      .then((j) => live && setFile(j))
      .catch(() => live && setFile(null));
    return () => {
      live = false;
    };
  }, [topic, cc]);
  if (file === undefined) return null;
  const list = (file?.events ?? []).filter((e) => kind === "all" || e.kind === kind);
  const kinds = [...new Set((file?.events ?? []).map((e) => e.kind))];
  const years = file?.events.length ? `${file.events[file.events.length - 1].date.slice(0, 4)}–${file.events[0].date.slice(0, 4)}` : "since 2000";
  return (
    <div className="lg:col-span-2">
      <ChartCard
        t={t}
        accent={accent}
        title="Disasters alerted, newest first"
        sub="GDACS's orange and red alerts · its scale in its own words"
        years={years}
        sources={file ? [file.source] : [{ label: "GDACS - Global Disaster Alert and Coordination System", url: "https://www.gdacs.org/" }]}
        csv={{ name: `${country} - disasters alerted`, header: ["from", "to", "kind", "name", "alert", "scale"], rows: list.map((e) => [e.date, e.to ?? e.date, e.kind, e.name, e.alert, e.scale]) }}
        notes="An orange alert is GDACS's judgement that international help may be needed, a red that it is; an event that struck several countries is listed under each. A green alert - little impact expected - is not listed."
      >
        {!file || !file.events.length ? (
          <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
            No orange or red alert is on GDACS's record for {country} since 2000.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {["all", ...kinds].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${kind === k ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {k === "all" ? `All · ${file.events.length}` : `${k} · ${file.events.filter((e) => e.kind === k).length}`}
                </button>
              ))}
            </div>
            <ul className="divide-y" style={{ borderColor: t.gridLine }}>
              {(all ? list : list.slice(0, 15)).map((e, i) => (
                <li key={`${e.date}-${e.name}-${i}`} className="flex items-start gap-2.5 py-1.5" style={{ borderTop: i ? `1px solid ${t.gridLine}` : "none" }}>
                  <span className="w-1.5 h-8 rounded-full shrink-0 mt-0.5" style={{ background: ALERT_INK[e.alert] }} title={`${e.alert} alert`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold font-sans truncate" style={{ color: t.headText }}>
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {e.name || e.kind}
                        </a>
                      ) : (
                        e.name || e.kind
                      )}
                    </span>
                    <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                      {dayOf(e.date)}
                      {e.to ? ` to ${dayOf(e.to)}` : ""} · {e.kind} · {e.alert} alert{e.scale ? ` · ${e.scale}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {!all && list.length > 15 && (
              <button type="button" onClick={() => setAll(true)} className="mt-2 text-[11px] font-sans cursor-pointer hover:underline" style={{ color: t.mutedText }}>
                Show all {list.length}
              </button>
            )}
          </>
        )}
      </ChartCard>
    </div>
  );
}

/** A county's name without its kind ("Baldwin County" - "Baldwin"), for matching the map's names to the records'. */
const bareName = (n: string) => n.replace(/ (County|Parish|Borough|Census Area|City and Borough|Municipality|city)$/i, "").trim();

/**
 * Each year in colour for a place chosen elsewhere on the site, as asked for the Worldview page: the place's own mean
 * temperature record - its country's, or the division's or county's the map names where the records hold it - across the
 * whole width, as the Climate page's history draws it.
 */
export function PlaceStripes({ where }: { where?: { cc: string; country: string; divisions: string[] } }) {
  const t = useTokens();
  const [found, setFound] = useState<{ place: Place; file: HistoryFile } | null>(null);
  useEffect(() => {
    let live = true;
    setFound(null);
    if (!where) return;
    (async () => {
      const r = await fetch(`/climate/history/${where.cc}.json`);
      if (!r.ok || !r.headers.get("content-type")?.includes("json")) return;
      const file = (await r.json()) as HistoryFile;
      const match = (p: Place, d: string) => p.name === d || bareName(p.name) === bareName(d);
      // The nearest division the record holds, and within it the county the map names, where its parts are held.
      let place = file.places.find((p) => p.kind === "country");
      let from = file;
      for (const d of [...where.divisions].reverse()) {
        const hit = from.places.find((p) => p.kind !== "country" && match(p, d));
        if (!hit) continue;
        place = hit;
        if (from === file && file.more?.[hit.id]) {
          const m = await fetch(`/climate/history/more/${hit.id}.json`);
          if (m.ok) {
            const parts = (await m.json()) as HistoryFile;
            const county = where.divisions.map((x) => parts.places.find((p) => match(p, x))).find(Boolean);
            if (county) {
              place = county;
              from = parts;
            }
          }
        }
        if (from !== file) break;
      }
      if (live && place) setFound({ place, file: from });
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [where?.cc, where?.divisions.join("|")]);
  if (!found) return null;
  const k = ["temp", "tempF"].find((x) => found.place.series[x] && found.file.defs[x]);
  if (!k) return null;
  const s = found.place.series[k];
  const lo = s[0] as number;
  const hi = lastYear(s);
  const def = found.file.defs[k];
  const source = found.file.sources[found.place.from[k]];
  const name = found.place.kind === "country" ? found.place.name : `${found.place.name}, ${where?.country}`;
  return (
    <StripesCard
      common={{
        t,
        accent: "#06b6d4",
        title: `Each Year in Colour · ${name}`,
        sub: "The year's mean temperature",
        years: `${lo}–${hi}`,
        sources: source ? [source] : [],
        csv: { name: `${name} - each year in colour`, header: ["year", `${def.label} (${UNIT_SAID[def.unit] ?? def.unit})`], rows: Array.from({ length: hi - lo + 1 }, (_, i) => [hi - i, at(s, hi - i)]) },
        notes: source?.note,
      }}
      place={found.place}
      k={k}
      def={def}
      lo={lo}
      hi={hi}
    />
  );
}

/** A heading's anchor on the page. */
const slug = (s: string) => `history-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * The history's figures in their sections, as asked: a bar across the top that stays in view as the page scrolls - the
 * place being read, and a press to each section - then the years in colour and the records, then each section in turn
 * under its heading with its sources' notes once at its foot, the place's parts ranked, and its disasters.
 */
function HistorySections({ t, accent, placeName, cards, card, notesOf, ranked, events }: { t: Tokens; accent: string; placeName: string; cards: HistoryGroup[]; card: (g: HistoryGroup, quiet: boolean) => ReactNode; notesOf: (g: HistoryGroup) => [string, string][]; ranked: ReactNode[]; events: ReactNode | null }) {
  const top = cards.filter((g) => g.kind === "stripes" || g.kind === "records").sort((a, b) => (a.kind === "stripes" ? -1 : 0) - (b.kind === "stripes" ? -1 : 0));
  const rest = cards.filter((g) => g.kind !== "stripes" && g.kind !== "records");
  const order: string[] = [];
  for (const g of rest) if (!order.includes(g.section ?? "Figures")) order.push(g.section ?? "Figures");
  if (events && !order.includes("Disasters")) order.push("Disasters");
  const sections = [...(top.some((g) => g.kind === "records") ? ["Records"] : []), ...order, ...(ranked.length ? ["Compared with its parts"] : [])];
  const go = (name: string) => document.getElementById(slug(name))?.scrollIntoView({ behavior: "smooth", block: "start" });
  const heading = (name: string) => (
    <div id={slug(name)} className="flex items-center gap-3 scroll-mt-32 pt-2">
      <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: t.isLight ? accent : `${accent}cc` }}>
        {name}
      </span>
      <div className="flex-1 h-px" style={{ background: t.gridLine }} />
    </div>
  );
  return (
    <>
      {/* The place being read, kept in view, and the way to each section. */}
      <nav aria-label="The history's sections" className="sticky top-16 z-20 modal-glass border rounded-2xl px-3 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[12px] font-semibold font-sans text-foreground shrink-0 pr-1">{placeName}</span>
        <span className="w-px h-4 bg-border shrink-0" aria-hidden />
        {sections.map((n) => (
          <button key={n} type="button" onClick={() => go(n)} className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0 whitespace-nowrap">
            {n}
          </button>
        ))}
      </nav>
      {top.map((g) => (
        <div key={g.title} id={g.kind === "records" ? slug("Records") : undefined} className="scroll-mt-32">
          {card(g, false)}
        </div>
      ))}
      {order.map((name) => {
        const inIt = rest.filter((g) => (g.section ?? "Figures") === name);
        const notes = new Map<string, string>();
        for (const g of inIt) for (const [label, note] of notesOf(g)) notes.set(label, note);
        return (
          <section key={name} aria-label={name} className="flex flex-col gap-4">
            {heading(name)}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inIt.map((g) => card(g, true))}
              {name === "Disasters" && events}
            </div>
            {notes.size > 0 && (
              <div className="text-[10px] font-sans leading-snug space-y-0.5 px-1" style={{ color: t.mutedText }}>
                {[...notes].map(([label, note]) => (
                  <p key={label}>
                    <span className="font-semibold">{label}.</span> {note}
                  </p>
                ))}
              </div>
            )}
          </section>
        );
      })}
      {ranked.length > 0 && (
        <section aria-label="Compared with its parts" className="flex flex-col gap-4">
          {heading("Compared with its parts")}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{ranked}</div>
        </section>
      )}
    </>
  );
}
