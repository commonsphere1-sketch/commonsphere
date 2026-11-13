/**
 * A place's history, year by year, as asked for the Climate and Crime pages: one country at a time, chosen by name as on
 * Polls & Elections, and within it each of its divisions the records hold - its states, provinces or regions, and within
 * those their counties and cities. Drawn as the pages' own charts are, as asked: a card for each of the page's kinds of
 * figure (`groups`), its lines over the years for the place chosen, its legend, its sources and a CSV.
 *
 * Reads static/<topic>/history/ (written by place-history-lib.cjs and the builds that use it): each country's file, and a
 * division's own parts from more/<id>.json when it is chosen. Every figure is the source's own; a year a source does not
 * give is a gap in its line.
 */
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CountryFind } from "./OccurrencePanel";
import { SourceLink } from "./SourceLink";
import { CsvButton } from "./ModalCharts";
import { countriesData } from "../data/countriesData";
import { useTokens, type Tokens } from "../lib/cardTokens";

type Def = { label: string; unit: string; say: string };
type Source = { label: string; url: string; note?: string };
/** [first year, a value for each year on, null where none]. */
type Series = (number | null)[];
type Place = { id: string; name: string; kind: string; parent?: string; series: Record<string, Series>; from: Record<string, string> };
type HistoryFile = { cc: string; of?: string; defs: Record<string, Def>; sources: Record<string, Source>; places: Place[]; more?: Record<string, number> };
/** One of the page's kinds of figure: a card, its title, the line over its title, and the figures drawn in it with their colours. */
export type HistoryGroup = { title: string; sub: string; lines: [key: string, colour: string][] };

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const PLURAL: Record<string, string> = { country: "Country", state: "States", province: "Provinces", territory: "Territories", region: "Regions", jurisdiction: "Jurisdictions", county: "Counties", municipality: "Municipalities", city: "Cities" };
const SINGULAR: Record<string, string> = { country: "country", state: "state", province: "province", territory: "territory", region: "region", jurisdiction: "jurisdiction", county: "county", municipality: "municipality", city: "city" };
const whole = (v: number) => v.toLocaleString("en-US");

/** A figure as the reader reads it: to the places that mean something at its size, with its unit. */
function said(v: number, unit: string) {
  const a = Math.abs(v);
  const n = a >= 100 ? Math.round(v).toLocaleString("en-US") : a >= 10 ? v.toFixed(1) : v.toFixed(2);
  const UNIT: Record<string, string> = { per100k: " per 100,000", degC: " °C", degF: " °F", mm: " mm", in: " in", mt: " million t", t: " t" };
  return unit === "count" ? Math.round(v).toLocaleString("en-US") : `${n}${UNIT[unit] ?? ""}`;
}
/** A scale's figure, short. */
const tick = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.abs(v) >= 10 ? `${Math.round(v)}` : `${Math.round(v * 10) / 10}`);
/** The unit in a heading. */
const UNIT_SAID: Record<string, string> = { per100k: "per 100,000 people", degC: "°C", degF: "°F", mm: "mm", in: "inches", mt: "million tonnes", t: "tonnes", index: "index", count: "number" };

const at = (s: Series, y: number) => (y >= (s[0] as number) ? (s[1 + y - (s[0] as number)] ?? null) : null);
const lastYear = (s: Series) => (s[0] as number) + s.length - 2;

export function PlaceHistory({
  topic,
  title,
  accent,
  groups,
  chooserLabel,
  notes,
  empty,
  className = "mb-6",
}: {
  topic: "climate" | "crime";
  title: string;
  /** The page's own colour, for the lines over the cards' titles. */
  accent: string;
  groups: HistoryGroup[];
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
  const kinds = useMemo(() => {
    const g = new Map<string, Place[]>();
    for (const p of file?.places ?? []) g.set(p.kind, [...(g.get(p.kind) ?? []), p]);
    return [...g.entries()];
  }, [file]);
  const idx = index[country.code];
  const cards = shown && shownFile ? groups.map((g) => ({ ...g, lines: g.lines.filter(([k]) => shown.series[k] && shownFile.defs[k]) })).filter((g) => g.lines.length) : [];
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
            {shown && shown.kind !== "country" ? `${shown.name}, ${country.name}` : country.name}
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
      </div>

      {shown && shownFile && cards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cards.map((g) => (
            <HistoryCard key={`${shown.id}-${g.title}`} t={t} accent={accent} group={g} place={shown} file={shownFile} />
          ))}
        </div>
      )}

      <div className="text-[10px] font-sans leading-snug space-y-1 px-1" style={{ color: t.mutedText }}>
        {notes}
      </div>
    </section>
  );
}

/** One kind of figure for the place, drawn as the page's line charts are: lines, a dashed grid, a legend, its sources, a CSV. */
function HistoryCard({ t, accent, group, place, file }: { t: Tokens; accent: string; group: HistoryGroup; place: Place; file: HistoryFile }) {
  const keys = group.lines.map(([k]) => k);
  const unit = file.defs[keys[0]].unit;
  let lo = Infinity, hi = -Infinity;
  for (const k of keys) {
    lo = Math.min(lo, place.series[k][0] as number);
    hi = Math.max(hi, lastYear(place.series[k]));
  }
  const data: Record<string, number | null>[] = [];
  for (let y = lo; y <= hi; y++) data.push({ year: y, ...Object.fromEntries(keys.map((k) => [k, at(place.series[k], y)])) });
  const many = data.length > 40;
  // Amounts from nought; temperatures from near their own lowest (nought on a temperature scale is no amount).
  const fromZero = unit !== "degC" && unit !== "degF";
  const sources = [...new Set(keys.map((k) => place.from[k]))].map((s) => file.sources[s]).filter(Boolean);
  const label = (k: string) => file.defs[k].label;
  return (
    <div className="rounded-2xl p-5 min-w-0" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: t.isLight ? accent : `${accent}bb` }}>
          {group.sub}
        </p>
        <h3 className="text-base font-bold font-sans flex items-center gap-2" style={{ color: t.headText }}>
          {group.title}
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${accent}26`, color: accent }}>
            {lo === hi ? lo : `${lo}–${hi}`}
          </span>
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} minTickGap={18} />
          <YAxis
            tick={{ fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={tick}
            domain={fromZero ? [0, "auto"] : [(m: number) => Math.floor(m - 0.5), (m: number) => Math.ceil(m + 0.5)]}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: t.mutedText, strokeOpacity: 0.4 }}
            content={({ active, payload, label: year }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-border bg-background/70 backdrop-blur-md backdrop-saturate-150 shadow-lg px-2.5 py-2 max-w-[18rem]">
                  <p className="text-[11px] font-semibold font-sans text-foreground leading-snug">
                    {place.name}, {year}
                  </p>
                  {group.lines.map(([k, colour]) => {
                    const v = payload.find((p) => p.dataKey === k)?.value as number | null | undefined;
                    return (
                      <p key={k} className="text-[10px] font-mono leading-snug mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                        <span className="inline-block w-2.5 h-0.5 rounded-full shrink-0" style={{ background: colour }} />
                        {label(k)}: {v == null ? "not held" : said(v, file.defs[k].unit)}
                      </p>
                    );
                  })}
                </div>
              ) : null
            }
          />
          {group.lines.map(([k, colour], i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={colour}
              strokeWidth={2}
              strokeDasharray={i === 3 ? "5 2" : undefined}
              connectNulls={false}
              isAnimationActive={false}
              // A dot for each year where the years are few; where they are many, only for a year standing alone between gaps.
              dot={(p: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
                const lone = p.index !== undefined && (data[p.index - 1]?.[k] ?? null) == null && (data[p.index + 1]?.[k] ?? null) == null;
                return p.value != null && p.cx != null && p.cy != null && (!many || lone) ? <circle key={`${k}-${p.index}`} cx={p.cx} cy={p.cy} r={2.5} fill={colour} /> : <g key={`${k}-${p.index}`} />;
              }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
        {group.lines.map(([k, colour]) => (
          <div key={k} className="flex items-center gap-1" title={file.defs[k].say}>
            <div className="w-3 h-0.5 rounded-full" style={{ background: colour }} />
            <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
              {label(k)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-sans mt-2 text-center" style={{ color: t.mutedText }}>
        {UNIT_SAID[unit] ?? unit}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3">
        <SourceLink sources={sources.map((s) => ({ label: s.label, url: s.url }))} />
        <CsvButton name={`${place.name} - ${group.title}`} header={["year", ...keys.map((k) => `${label(k)} (${UNIT_SAID[file.defs[k].unit] ?? file.defs[k].unit})`)]} rows={[...data].reverse().map((r) => [r.year, ...keys.map((k) => r[k])])} />
      </div>
      {sources.some((s) => s.note) && (
        <p className="text-[10px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
          {sources.map((s) => s.note).filter(Boolean).join(" ")}
        </p>
      )}
    </div>
  );
}
