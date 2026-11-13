/**
 * A place's history, year by year, as asked for the Climate and Crime pages - laid out as Polls & Elections is: one country
 * at a time, chosen by name, and within it each of its divisions the records hold - its states, provinces or regions, and
 * within those their counties and cities - each figure drawn over the years it is published for, and the same figures
 * year by year, newest first, with their sources and a CSV.
 *
 * Reads static/<topic>/history/ (written by place-history-lib.cjs and the builds that use it): each country's file, and a
 * division's own parts from more/<id>.json when it is chosen. Every figure is the source's own; a year a source does not
 * give is left out of the line and said "Not held" in the table.
 */
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CountryFind } from "./OccurrencePanel";
import { SourceLink } from "./SourceLink";
import { CsvButton } from "./ModalCharts";
import { type Tip, TipCard } from "./TipCard";
import { countriesData } from "../data/countriesData";

type Def = { label: string; unit: string; say: string };
type Source = { label: string; url: string; note?: string };
/** [first year, a value for each year on, null where none]. */
type Series = (number | null)[];
type Place = { id: string; name: string; kind: string; parent?: string; series: Record<string, Series>; from: Record<string, string> };
type HistoryFile = { cc: string; of?: string; defs: Record<string, Def>; sources: Record<string, Source>; places: Place[]; more?: Record<string, number> };

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const PLURAL: Record<string, string> = { country: "Country", state: "States", province: "Provinces", territory: "Territories", region: "Regions", jurisdiction: "Jurisdictions", county: "Counties", municipality: "Municipalities", city: "Cities" };
const whole = (v: number) => v.toLocaleString("en-US");

/** A figure as the reader reads it: to the places that mean something at its size, with its unit. */
function said(v: number, unit: string) {
  const a = Math.abs(v);
  const n = a >= 100 ? Math.round(v).toLocaleString("en-US") : a >= 10 ? v.toFixed(1) : a >= 1 ? v.toFixed(2) : v.toFixed(2);
  switch (unit) {
    case "per100k":
      return `${n} per 100,000`;
    case "degC":
      return `${n} °C`;
    case "degF":
      return `${n} °F`;
    case "mm":
      return `${n} mm`;
    case "in":
      return `${n} in`;
    case "mt":
      return `${n} million t`;
    case "t":
      return `${n} t`;
    case "index":
      return n;
    case "count":
      return Math.round(v).toLocaleString("en-US");
    default:
      return n;
  }
}
/** The unit in a heading. */
const UNIT_SAID: Record<string, string> = { per100k: "per 100,000 people", degC: "°C", degF: "°F", mm: "mm", in: "inches", mt: "million tonnes", t: "tonnes", index: "index", count: "number" };

const at = (s: Series, y: number) => (y >= (s[0] as number) ? (s[1 + y - (s[0] as number)] ?? null) : null);
const lastYear = (s: Series) => (s[0] as number) + s.length - 2;

export function PlaceHistory({ topic, title, chooserLabel, notes, empty, className = "mb-6" }: { topic: "climate" | "crime"; title: string; chooserLabel: string; notes: ReactNode; /** Said where a country has no history held ("{country}" is its name). */ empty: string; className?: string }) {
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
    setParts(null);
    setPartId("");
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
  // The place it is part of, drawn behind it where the same source gives the same figure.
  const parentOf = (p?: Place): Place | undefined => (p === part ? place : p?.parent ? file?.places.find((q) => q.id === p.parent) : undefined);
  const parent = parentOf(shown);
  const groups = useMemo(() => {
    const g = new Map<string, Place[]>();
    for (const p of file?.places ?? []) g.set(p.kind, [...(g.get(p.kind) ?? []), p]);
    return [...g.entries()];
  }, [file]);
  const keys = shown ? Object.keys(shownFile?.defs ?? {}).filter((k) => shown.series[k]) : [];
  const idx = index[country.code];

  const rows = useMemo(() => {
    if (!shown) return [];
    let lo = Infinity, hi = -Infinity;
    for (const k of keys) {
      lo = Math.min(lo, shown.series[k][0] as number);
      hi = Math.max(hi, lastYear(shown.series[k]));
    }
    const out: [number, (number | null)[]][] = [];
    for (let y = hi; y >= lo; y--) out.push([y, keys.map((k) => at(shown.series[k], y))]);
    return out;
  }, [shown, keys.join()]);
  const [allYears, setAllYears] = useState(false);
  const usedSources = shown && shownFile ? [...new Set(keys.map((k) => shown.from[k]))].map((s) => shownFile.sources[s]).filter(Boolean) : [];

  return (
    <section aria-label={title} className={className}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 px-1">{title}</p>
      {/* The country, and within it the place. */}
      <div className="modal-tile rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CountryFind onPick={setCountry} label={chooserLabel} />
        <h2 className="text-lg font-semibold font-sans text-foreground">{country.name}</h2>
        {idx && (
          <p className="text-[11px] font-mono text-muted-foreground">
            years {idx[0]} to {idx[1]}
            {idx[2] ? ` · ${whole(idx[2])} ${idx[2] === 1 ? "division" : "divisions"} held` : " · the country as a whole"}
          </p>
        )}
        {file && (file.places.length > 1 || file.more) && (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              aria-label={`A place in ${country.name}`}
              className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-[12px] font-sans text-foreground cursor-pointer min-w-0 max-w-full sm:max-w-[18rem]"
            >
              {groups.map(([kind, ps]) => (
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
              <select
                value={partId}
                onChange={(e) => setPartId(e.target.value)}
                aria-label={`A part of ${place?.name}`}
                className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-[12px] font-sans text-foreground cursor-pointer min-w-0 max-w-full sm:max-w-[18rem]"
              >
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
      </div>

      {file === undefined && <p className="text-[11px] font-sans text-muted-foreground px-1 mb-3">Reading its history…</p>}
      {(file === null || (file && !file.places.length)) && <p className="text-[11px] font-sans text-muted-foreground px-1 mb-3">{empty.replace("{country}", country.name)}</p>}

      {shown && shownFile && (
        <>
          <div className="modal-tile rounded-xl px-4 py-3 mb-3">
            <p className="text-[12px] font-semibold font-sans text-foreground mb-2">
              {shown.name}
              {shown.kind !== "country" && <span className="font-normal text-muted-foreground"> · {(PLURAL[shown.kind] ?? shown.kind).replace(/ies$/, "y").replace(/s$/, "").toLowerCase()}</span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {keys.map((k) => {
                const behind = parent && parent.series[k] && parent.from[k] === shown.from[k] ? parent : undefined;
                return <HistoryChart key={k} def={shownFile.defs[k]} series={shown.series[k]} name={shown.name} behind={behind ? { name: behind.name, series: behind.series[k] } : undefined} source={shownFile.sources[shown.from[k]]?.label ?? ""} />;
              })}
            </div>
          </div>

          {/* Year by year, newest first. */}
          <div className="modal-tile rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex-1">Year by year, newest first</p>
              <CsvButton name={`${shown.name} - ${title}`} header={["year", ...keys.map((k) => `${shownFile.defs[k].label} (${UNIT_SAID[shownFile.defs[k].unit] ?? shownFile.defs[k].unit})`)]} rows={rows.map(([y, vs]) => [y, ...vs])} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-sans">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="font-normal font-mono pr-3 py-1">Year</th>
                    {keys.map((k) => (
                      <th key={k} className="font-normal pr-3 py-1 whitespace-nowrap" title={shownFile.defs[k].say}>
                        {shownFile.defs[k].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(allYears ? rows : rows.slice(0, 15)).map(([y, vs]) => (
                    <tr key={y}>
                      <td className="font-mono text-muted-foreground pr-3 py-1">{y}</td>
                      {vs.map((v, i) => (
                        <td key={keys[i]} className={`pr-3 py-1 whitespace-nowrap font-mono ${v == null ? "text-muted-foreground/60" : "text-foreground"}`}>
                          {v == null ? "Not held" : said(v, shownFile.defs[keys[i]].unit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!allYears && rows.length > 15 && (
              <button type="button" onClick={() => setAllYears(true)} className="mt-2 text-[11px] font-sans text-muted-foreground hover:text-foreground cursor-pointer">
                Show all {whole(rows.length)} years
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-1">
        <div className="text-[10px] font-sans text-muted-foreground leading-snug flex-1 min-w-[14rem] space-y-1">
          {notes}
          {usedSources.map((s) => s.note && <p key={s.label}>{s.label}: {s.note}</p>)}
        </div>
        <SourceLink sources={usedSources.map((s) => ({ label: s.label, url: s.url }))} />
      </div>
    </section>
  );
}

/**
 * One figure over the years: a line, its first and last years, and the scale's ends; amounts from nought, temperatures from
 * their own lowest (nought on the Celsius scale is no amount). Pointed at, the year and its figure in a frosted card.
 */
function HistoryChart({ def, series, name, behind, source }: { def: Def; series: Series; name: string; behind?: { name: string; series: Series }; source: string }) {
  const W = 300, H = 120, L = 40, R = 8, T = 8, B = 16;
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<(Tip & { year: number }) | null>(null);
  const first = Math.min(series[0] as number, behind ? (behind.series[0] as number) : Infinity);
  const last = Math.max(lastYear(series), behind ? lastYear(behind.series) : -Infinity);
  const values = [...series.slice(1), ...(behind ? behind.series.slice(1) : [])].filter((v): v is number => v != null);
  const fromZero = def.unit !== "degC" && def.unit !== "degF";
  let lo = fromZero ? 0 : Math.min(...values);
  let hi = Math.max(...values);
  if (hi === lo) hi = lo + 1;
  if (!fromZero) {
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
  }
  const xOf = (y: number) => L + (last === first ? (W - L - R) / 2 : ((y - first) / (last - first)) * (W - L - R));
  const yOf = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const path = (s: Series) => {
    let d = "";
    let pen = false;
    for (let i = 1; i < s.length; i++) {
      const v = s[i];
      if (v == null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${xOf((s[0] as number) + i - 1).toFixed(1)},${yOf(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  // A year standing alone between gaps is a dot, not a line.
  const dots = (s: Series) => s.slice(1).flatMap((v, i) => (v != null && s[i] == null && (s[i + 2] ?? null) == null ? [[(s[0] as number) + i, v] as const] : []));
  const latest = lastYear(series);
  const latestV = at(series, latest);
  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = Math.round(first + ((x - L) / (W - L - R)) * (last - first));
    if (y < first || y > last) return setTip(null);
    const v = at(series, y);
    const pv = behind ? at(behind.series, y) : null;
    const b = box.current!.getBoundingClientRect();
    setTip({
      x: e.clientX - b.left,
      y: e.clientY - b.top,
      year: y,
      title: `${name}, ${y}`,
      lines: [v == null ? `${def.label}: not held` : `${def.label}: ${said(v, def.unit)}`, ...(behind ? [pv == null ? `${behind.name}: not held` : `${behind.name}: ${said(pv, def.unit)}`] : []), source],
    });
  };
  return (
    <div ref={box} className="relative min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-sans text-foreground truncate" title={def.say}>
          {def.label}
        </p>
        {latestV != null && (
          <p className="text-[11px] font-mono text-foreground shrink-0">
            {said(latestV, def.unit)} <span className="text-muted-foreground">· {latest}</span>
          </p>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" onMouseMove={move} onMouseLeave={() => setTip(null)} role="img" aria-label={`${def.label}, ${name}, ${series[0]} to ${latest}`}>
        <line x1={L} x2={W - R} y1={yOf(lo)} y2={yOf(lo)} className="stroke-border" strokeWidth={0.8} />
        <text x={L - 4} y={yOf(hi) + 3} textAnchor="end" fontSize={8} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          {said(hi, def.unit === "per100k" ? "" : def.unit).replace(" million t", "M t")}
        </text>
        <text x={L - 4} y={yOf(lo) + 3} textAnchor="end" fontSize={8} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          {fromZero ? "0" : said(lo, def.unit)}
        </text>
        <text x={L} y={H - 3} fontSize={8} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          {first}
        </text>
        <text x={W - R} y={H - 3} textAnchor="end" fontSize={8} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          {last}
        </text>
        {behind && <path d={path(behind.series)} fill="none" className="stroke-muted-foreground" strokeWidth={1.1} strokeDasharray="3 3" strokeOpacity={0.8} />}
        <path d={path(series)} fill="none" className="stroke-foreground" strokeWidth={1.6} strokeLinejoin="round" />
        {dots(series).map(([y, v]) => (
          <circle key={y} cx={xOf(y)} cy={yOf(v)} r={1.8} className="fill-foreground" />
        ))}
        {tip && (
          <line x1={xOf(tip.year)} x2={xOf(tip.year)} y1={T} y2={H - B} className="stroke-foreground" strokeOpacity={0.35} strokeWidth={0.8} />
        )}
      </svg>
      {behind && (
        <p className="text-[9px] font-sans text-muted-foreground">
          <span className="inline-block w-3 border-t border-dashed border-muted-foreground align-middle mr-1" />
          {behind.name}, for comparison
        </p>
      )}
      {tip && <TipCard tip={tip} room={box.current?.clientWidth ?? 300} />}
    </div>
  );
}
