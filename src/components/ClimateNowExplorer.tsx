/**
 * The Climate page's explorer of what is happening now: the disasters under
 * an orange or red alert, the countries they struck, El Niño and La Niña,
 * the records in the measured series and the latest readings - as a list
 * beside a detail pane, in the pieces the site's other explorers are made of
 * (DataExplorer).
 *
 * It stands where the explorer of the page's boundaries, tipping points,
 * treaties and figure cards stood (ClimateExplorer, kept and not shown).
 * Every row is read from the page's data files, and nothing is typed in
 * here: the alerts are the Global Disaster Alert and Coordination System's,
 * the displacements the Internal Displacement Monitoring Centre's, the
 * Oceanic Niño Index NOAA's, the records ranked from NASA's, NSIDC's and
 * NOAA's series (climateWatch.ts), and the readings the agencies' latest
 * (climateIndicators.ts), each with what causes it and what it does
 * (climateCauses.ts). An alert is the system's estimate, as a disaster
 * happens, of whether international help will be needed: it is not a count
 * of the dead or of damage, and the detail says so.
 */
import { useMemo, useState } from "react";
import { ArrowSquareOut, MagnifyingGlass, Warning, X } from "@phosphor-icons/react";
import { CLIMATE_CAUSES } from "../data/climateCauses";
import { CLIMATE_INDICATORS, CLIMATE_RETRIEVED, type ClimateIndicator } from "../data/climateIndicators";
import {
  CLIMATE_RECORDS,
  CLIMATE_WATCH_NAMES,
  CLIMATE_WATCH_RETRIEVED,
  CLIMATE_WATCH_SOURCES as SRC,
  DISASTER_ALERTS,
  DISASTER_DISPLACED,
  DISASTER_EVENTS,
  DISASTER_RECENT_DAYS,
  ENSO,
  type DisasterEvent,
  type EnsoEpisode,
} from "../data/climateWatch";
import { regionName } from "../lib/regionName";
import { Block, Empty, Kpi, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const ACCENT = "#ef4444";
const ORANGE = "#ea580c";
const RED = "#e11d48";
const WARM = "#ea580c";
const COLD = "#0ea5e9";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const span = (e: { from: string; to: string }) => (e.from === e.to ? day(e.from) : `${day(e.from)} to ${day(e.to)}`);
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const signed = (v: number, dp = 2) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}`;
const nth = (n: number) => {
  const t = n % 100;
  return `${n}${t >= 11 && t <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};
const nameOf = (code: string) => regionName(code, CLIMATE_WATCH_NAMES[code]);
const places = (codes: string[]) => (codes.length ? codes.map(nameOf).join(", ") : "no country listed");
/** A reading as printed: to the precision the source gives it. */
const reading = (v: number) => (Math.abs(v) >= 100 ? v.toLocaleString("en-US", { maximumFractionDigits: 1 }) : String(v));

type Kind = "now" | "earlier" | "struck" | "season" | "record" | "measured";
const KINDS: { id: Kind; label: string; one: string; color: string }[] = [
  { id: "now", label: "Disasters now", one: "Disaster now", color: RED },
  { id: "earlier", label: "Earlier this year", one: "Disaster of the last twelve months", color: ORANGE },
  { id: "struck", label: "Countries struck", one: "Country struck", color: "#f59e0b" },
  { id: "season", label: "El Niño & La Niña", one: "El Niño and La Niña", color: COLD },
  { id: "record", label: "Records", one: "Record in the measured series", color: "#8b5cf6" },
  { id: "measured", label: "Readings now", one: "Measured now", color: "#10b981" },
];

type RecordRow = { value: string; sub: string; source: { label: string; url: string } };
type Item =
  | { key: string; kind: "now" | "earlier"; name: string; said: string; e: DisasterEvent }
  | { key: string; kind: "struck"; name: string; said: string; code: string }
  | { key: string; kind: "season"; name: string; said: string; episode: EnsoEpisode | null }
  | { key: string; kind: "record"; name: string; said: string; r: RecordRow }
  | { key: string; kind: "measured"; name: string; said: string; m: ClimateIndicator };

/** A disaster's name: its kind, the name it was given where it has one, and otherwise where it struck. */
const eventName = (e: DisasterEvent) => `${e.kind}${e.name ? ` ${e.name}` : e.countries.length ? ` · ${e.countries.slice(0, 2).map(nameOf).join(", ")}${e.countries.length > 2 ? ` and ${e.countries.length - 2} more` : ""}` : ""}`;
const eventKey = (e: DisasterEvent) => `e-${e.url}`;
const eventItem = (e: DisasterEvent): Item => ({ key: eventKey(e), kind: e.recent ? "now" : "earlier", name: eventName(e), said: `${e.alert} alert · ${e.current ? "going on · since " + day(e.from) : span(e)}`, e });

const T = CLIMATE_RECORDS.temperature;
const RECORDS: [string, RecordRow][] = [
  ["Warmest year on record", { value: String(T.warmest[0][0]), sub: `${signed(T.warmest[0][1])} °C against ${T.baseline} · the record begins in ${T.first}`, source: SRC.gistemp }],
  [`Where ${T.latestYear.y} stands`, { value: `${nth(T.latestYear.rank)} warmest`, sub: `${signed(T.latestYear.v)} °C · of ${T.latestYear.of} years · counted here from the series`, source: SRC.gistemp }],
  ...(T.latestMonth ? [[`Where ${T.latestMonth.month} stands`, { value: `${nth(T.latestMonth.rank)} warmest ${T.latestMonth.name}`, sub: `${signed(T.latestMonth.v)} °C · of ${T.latestMonth.of} · counted here from the series`, source: SRC.gistemp }] as [string, RecordRow]] : []),
  ["Highest carbon dioxide", { value: `${CLIMATE_RECORDS.co2.high.v} ppm`, sub: `${CLIMATE_RECORDS.co2.high.month} · the highest monthly mean at Mauna Loa since ${CLIMATE_RECORDS.co2.first}`, source: SRC.co2 }],
  ["Lowest Arctic sea ice", { value: `${CLIMATE_RECORDS.arctic.lowest[0][1]} million km²`, sub: `September ${CLIMATE_RECORDS.arctic.lowest[0][0]} · September ${CLIMATE_RECORDS.arctic.latest.y} was ${CLIMATE_RECORDS.arctic.latest.v}, the ${nth(CLIMATE_RECORDS.arctic.latest.rank)} lowest of ${CLIMATE_RECORDS.arctic.latest.of}`, source: SRC.seaIce }],
  ["Lowest Antarctic sea ice", { value: `${CLIMATE_RECORDS.antarctic.lowest[0][1]} million km²`, sub: `February ${CLIMATE_RECORDS.antarctic.lowest[0][0]} · February ${CLIMATE_RECORDS.antarctic.latest.y} was ${CLIMATE_RECORDS.antarctic.latest.v}, the ${nth(CLIMATE_RECORDS.antarctic.latest.rank)} lowest of ${CLIMATE_RECORDS.antarctic.latest.of}`, source: SRC.seaIce }],
];
const struck = Object.entries(DISASTER_ALERTS.byCountry).sort((a, b) => b[1].orange + b[1].red - (a[1].orange + a[1].red) || b[1].red - a[1].red || nameOf(a[0]).localeCompare(nameOf(b[0])));

const ITEMS: Item[] = [
  ...DISASTER_EVENTS.map(eventItem),
  ...struck.map(([code, v]): Item => ({ key: `c-${code}`, kind: "struck", name: nameOf(code), said: `${v.orange + v.red} ${v.orange + v.red === 1 ? "alert" : "alerts"} in twelve months${v.red ? ` · ${v.red} red` : ""}`, code })),
  { key: "s-now", kind: "season", name: `Now: ${ENSO.state}`, said: `${ENSO.latest.season} · ${signed(ENSO.latest.anom)} °C on the Oceanic Niño Index`, episode: null },
  ...ENSO.episodes.filter((e) => !e.ongoing).slice(0, 12).map((e): Item => ({ key: `s-${e.from}`, kind: "season", name: `${e.kind} · ${e.from} to ${e.to}`, said: `peak ${signed(e.peak, 1)} °C in ${e.peakAt} · ${e.seasons} seasons`, episode: e })),
  ...RECORDS.map(([name, r]): Item => ({ key: `r-${name}`, kind: "record", name, said: r.value, r })),
  ...CLIMATE_INDICATORS.map((m): Item => ({ key: `m-${m.id}`, kind: "measured", name: m.label, said: `${reading(m.value)} ${m.unit} · ${m.period}`, m })),
];

export default function ClimateNowExplorer() {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const q = search.trim().toLowerCase();
  const list = useMemo(
    () => ITEMS.filter((x) => (!kind || x.kind === kind) && (!q || [x.name, x.said, "e" in x ? places(x.e.countries) : ""].some((s) => s.toLowerCase().includes(q)))),
    [q, kind],
  );
  const shown = (pickedKey ? ITEMS.find((x) => x.key === pickedKey) : null) ?? list[0] ?? null;
  const groups = KINDS.map((k) => ({ k, rows: list.filter((x) => x.kind === k.id) })).filter((g) => g.rows.length > 0);
  const toneOf = (x: Item, fallback: string) => ("e" in x ? (x.e.alert === "Red" ? RED : ORANGE) : x.kind === "season" ? ((x.episode?.kind ?? (ENSO.latest.anom >= 0.5 ? "El Niño" : ENSO.latest.anom <= -0.5 ? "La Niña" : "")) === "El Niño" ? WARM : x.episode || Math.abs(ENSO.latest.anom) >= 0.5 ? COLD : "#94a3b8") : fallback);
  const out = (href: string, text: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-sans underline underline-offset-2" style={{ color: t.headText }}>
      {text} <ArrowSquareOut size={10} aria-hidden />
    </a>
  );
  const body = (text: string) => (
    <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
      {text}
    </p>
  );

  return (
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full mb-6" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: ACCENT }}>
        <Warning size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Climate crises, natural disasters and events now</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {ITEMS.length}
        </span>
      </div>

      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search the disasters, countries, seasons, records and readings"
          placeholder="Search disasters, countries, El Niño, records…"
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      <div className="explorer-panes flex flex-col md:flex-row md:h-[520px]">
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[320px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {/* How many of each kind there are: pick one to see only those. */}
          <div className="grid grid-cols-3 gap-2 px-4 pt-3">
            {KINDS.map((k) => {
              const on = kind === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setKind(on ? null : k.id);
                    setPickedKey(null);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: on ? k.color + "22" : t.tile, border: `1px solid ${on ? k.color + "88" : t.gridLine}` }}
                >
                  <span className="block text-sm font-bold font-mono" style={{ color: k.color }}>
                    {ITEMS.filter((x) => x.kind === k.id).length}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {k.label}
                  </span>
                </button>
              );
            })}
          </div>
          {groups.map((g) => (
            <div key={g.k.id} className="flex flex-col">
              <div className="px-4 pt-3 pb-1">
                <Label t={t}>
                  {g.k.label} · {g.rows.length}
                </Label>
              </div>
              {g.rows.map((x) => (
                <Row key={x.key} t={t} selected={shown?.key === x.key} color={g.k.color} onClick={() => setPickedKey(x.key)}>
                  <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: toneOf(x, g.k.color) }} aria-hidden />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                      {x.name}
                    </span>
                    <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                      {x.said}
                    </span>
                  </span>
                </Row>
              ))}
            </div>
          ))}
          {list.length === 0 && <Empty t={t}>Nothing here matches the search.</Empty>}
        </div>

        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {shown ? (
            <>
              <Block>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: KINDS.find((k) => k.id === shown.kind)!.color }}>
                    {KINDS.find((k) => k.id === shown.kind)!.one}
                  </p>
                  <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                    {shown.name}
                  </p>
                  <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                    {shown.said}
                  </p>
                </div>
              </Block>

              {"e" in shown && (
                <Block>
                  <div className="grid grid-cols-2 gap-2">
                    <Kpi t={t} label="Alert" value={shown.e.alert} color={shown.e.alert === "Red" ? RED : ORANGE} sub={shown.e.alert === "Red" ? "international help likely to be needed" : "international help possibly needed"} />
                    <Kpi t={t} label={shown.e.current ? "Going on since" : "When"} value={shown.e.current ? day(shown.e.from) : span(shown.e)} color={t.headText} sub={shown.e.current ? `last report ${day(shown.e.to)}` : undefined} />
                  </div>
                  <div>
                    <Label t={t}>Countries listed as affected</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {shown.e.countries.length ? (
                        shown.e.countries.map((c) => (
                          <button key={c} type="button" onClick={() => setPickedKey(`c-${c}`)} className="px-2 py-0.5 rounded-full text-[11px] font-sans cursor-pointer hover:opacity-80" style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}>
                            {nameOf(c)}
                          </button>
                        ))
                      ) : (
                        <span className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                          none listed
                        </span>
                      )}
                    </div>
                  </div>
                  {shown.e.said && body(`As the system describes it: ${shown.e.said}.`)}
                  {body("An alert is the system's estimate, made as a disaster happens, of whether international help will be needed. It is not a count of the dead or of damage.")}
                  {out(shown.e.url, "The system's own report of it")}
                  <SourceLink sources={[{ label: `${SRC.alerts.label} · read on ${CLIMATE_WATCH_RETRIEVED}`, url: SRC.alerts.url }]} />
                </Block>
              )}

              {shown.kind === "struck" &&
                (() => {
                  const v = DISASTER_ALERTS.byCountry[shown.code];
                  const moved = DISASTER_DISPLACED.byCountry[shown.code];
                  const its = DISASTER_EVENTS.filter((e) => e.countries.includes(shown.code));
                  return (
                    <Block>
                      <div className="grid grid-cols-2 gap-2">
                        <Kpi t={t} label="Alerts in twelve months" value={String(v.orange + v.red)} color={t.headText} sub={`${v.orange} orange · ${v.red} red · counted here`} />
                        <Kpi
                          t={t}
                          label={`Displacements by disasters, ${DISASTER_DISPLACED.year}`}
                          value={moved ? whole(moved) : "none recorded"}
                          color={t.headText}
                          sub={moved ? "movements within the country, not people" : undefined}
                        />
                      </div>
                      <div>
                        <Label t={t}>The alerts that list it · newest first</Label>
                        <div className="flex flex-col mt-1">
                          {its.map((e) => (
                            <button key={e.url} type="button" onClick={() => setPickedKey(eventKey(e))} className="flex items-baseline gap-2 py-1 text-left cursor-pointer hover:opacity-80">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 self-center" style={{ background: e.alert === "Red" ? RED : ORANGE }} aria-hidden />
                              <span className="text-[11px] font-sans flex-1 min-w-0 truncate" style={{ color: t.headText }}>
                                {e.kind}
                                {e.name ? ` ${e.name}` : ""}
                              </span>
                              <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                                {e.current ? "going on" : day(e.to)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {body("An alert lists a country when the disaster reached it; it may have touched only a part of it. The displacements are the latest the World Bank carries, and are a year behind the alerts.")}
                      <SourceLink sources={[SRC.alerts, SRC.displaced]} />
                    </Block>
                  );
                })()}

              {shown.kind === "season" && (
                <Block>
                  {shown.episode ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Kpi t={t} label="Its peak" value={`${signed(shown.episode.peak)} °C`} color={shown.episode.kind === "El Niño" ? WARM : COLD} sub={shown.episode.peakAt} />
                      <Kpi t={t} label="How long it ran" value={`${shown.episode.seasons} seasons`} color={t.headText} sub={`${shown.episode.from} to ${shown.episode.to} · overlapping three-month seasons`} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Kpi t={t} label={ENSO.latest.season} value={`${signed(ENSO.latest.anom)} °C`} color={ENSO.latest.anom >= 0.5 ? WARM : ENSO.latest.anom <= -0.5 ? COLD : t.headText} sub="the index: sea-surface temperature against the season's average" />
                      <Kpi
                        t={t}
                        label="What that makes it"
                        value={ENSO.state}
                        color={t.headText}
                        sub={ENSO.run ? `${ENSO.run.seasons} seasons at or beyond ${ENSO.run.kind === "El Niño" ? "+0.5" : "−0.5"} since ${ENSO.run.from}${ENSO.run.seasons < 5 ? "; five running make an episode" : ""}` : "the index is inside ±0.5"}
                      />
                    </div>
                  )}
                  {body(
                    "The Oceanic Niño Index is NOAA's: the three-month mean sea-surface temperature in the Niño 3.4 region of the equatorial Pacific, against the average for the season. NOAA counts an El Niño or a La Niña once the index has stayed at or beyond +0.5 or −0.5 for five overlapping seasons running; the episodes are counted here from the index by that rule.",
                  )}
                  <SourceLink sources={[{ label: `${SRC.oni.label} · read on ${CLIMATE_WATCH_RETRIEVED}`, url: SRC.oni.url }]} />
                </Block>
              )}

              {shown.kind === "record" && (
                <Block>
                  <Kpi t={t} label={shown.name} value={shown.r.value} color={t.headText} sub={shown.r.sub} />
                  {body("A record of the whole globe's measured series, ranked here from the agency's own figures.")}
                  <SourceLink sources={[{ label: `${shown.r.source.label} · read on ${CLIMATE_WATCH_RETRIEVED}`, url: shown.r.source.url }]} />
                </Block>
              )}

              {shown.kind === "measured" && (
                <Block>
                  <div className="grid grid-cols-2 gap-2">
                    <Kpi t={t} label={shown.m.period} value={`${reading(shown.m.value)} ${shown.m.unit}`} color={t.headText} sub="the latest reading" />
                    <Kpi
                      t={t}
                      label="Ten years before"
                      value={shown.m.decadeAgo === null ? "not in the series" : `${reading(shown.m.decadeAgo)} ${shown.m.unit}`}
                      color={t.headText}
                      sub={shown.m.decadeAgo === null ? undefined : `a change of ${shown.m.value - shown.m.decadeAgo >= 0 ? "+" : "−"}${reading(+Math.abs(shown.m.value - shown.m.decadeAgo).toFixed(2))}`}
                    />
                  </div>
                  {shown.m.note && body(shown.m.note)}
                  <SourceLink sources={[{ label: `${shown.m.source} · read on ${CLIMATE_RETRIEVED}`, url: shown.m.url }]} />
                  {CLIMATE_CAUSES[shown.m.id] && (
                    <>
                      <div>
                        <Label t={t}>What raises it</Label>
                        <p className="text-[11px] font-sans leading-snug mt-1" style={{ color: t.bodyText }}>
                          {CLIMATE_CAUSES[shown.m.id].cause}
                        </p>
                      </div>
                      <div>
                        <Label t={t}>What it does</Label>
                        <p className="text-[11px] font-sans leading-snug mt-1" style={{ color: t.bodyText }}>
                          {CLIMATE_CAUSES[shown.m.id].effect}
                        </p>
                      </div>
                      <SourceLink sources={CLIMATE_CAUSES[shown.m.id].sources} />
                    </>
                  )}
                </Block>
              )}
            </>
          ) : (
            <Empty t={t}>Nothing to show.</Empty>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {ITEMS.length} · alerts of the twelve months to {day(DISASTER_ALERTS.to)}, “now” being still going or ended within {DISASTER_RECENT_DAYS} days · read on {CLIMATE_WATCH_RETRIEVED}
        </span>
      </div>
    </div>
  );
}
