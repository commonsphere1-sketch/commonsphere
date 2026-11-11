/**
 * Polls & Elections, as asked: one country at a time, its history on a timeline - its political regime year by year since
 * 1789 (V-Dem), its national elections (Wikidata) with their results where ParlGov has them, and its changes of
 * government (ParlGov's cabinets) - and the same, year by year, under it, newest first, each with its source. The CIA World
 * Factbook's most recent election for each chamber stands beside it.
 *
 * Opinion polls are not held: no open record of them is published that the site may use. Nothing here is estimated.
 */
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { SourceLink } from "../components/SourceLink";
import { CountryFind } from "../components/OccurrencePanel";
import { countriesData } from "../data/countriesData";
import { ELECTION_HISTORY_INDEX, ELECTION_HISTORY_RETRIEVED, ELECTION_HISTORY_SOURCES } from "../data/electionHistory";
import { REGIME_TYPES } from "../data/regimes";
import { COUNTRY_POLITICS, COUNTRY_POLITICS_SOURCE } from "../data/countryPolitics";
import { LIVING_DARK, LIVING_LIGHT } from "../lib/livingScore";
import { useTheme } from "../contexts/ThemeContext";

type Party = [name: string, vote: number | null, seats: number | null];
type Election = { id?: string; date: string; name: string; kind: "Presidential" | "Legislative" | "General" | "Referendum"; winners?: string[]; cited?: true; parlgovOnly?: true; results?: { seats?: number; parties: Party[] } };
type Cabinet = { start: string; name: string; caretaker: boolean; parties: string[]; pmParty: string | null };
type History = { cc: string; elections: Election[]; cabinets: Cabinet[]; regimes: [from: number, to: number, type: 0 | 1 | 2 | 3][] };

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const INDEX = new Map(ELECTION_HISTORY_INDEX.map((r) => [r[0], r]));
const KIND_INK = { Presidential: "#a78bfa", Legislative: "#60a5fa", General: "#f472b6", Referendum: "#fbbf24" } as const;
const day = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const whole = (v: number) => v.toLocaleString("en-US");

/** What happened in a year, for the list under the timeline. */
type Event = { date: string; what: "election" | "cabinet" | "regime"; election?: Election; cabinet?: Cabinet; regime?: { type: number; prev?: { type: number; from: number } } };

export default function ElectionsPage() {
  const { theme } = useTheme();
  const ramp = theme === "light" ? LIVING_LIGHT : LIVING_DARK;
  const regimeInk = (r: number) => ramp[[0, 2, 4, 5][r]];
  const [country, setCountry] = useState<{ code: string; name: string }>({ code: "US", name: NAME.get("US") ?? "United States" });
  const [data, setData] = useState<History | null | undefined>(undefined);
  const [show, setShow] = useState<"all" | "election" | "cabinet" | "regime">("all");
  const [all, setAll] = useState(false);
  useEffect(() => {
    let live = true;
    setData(undefined);
    setAll(false);
    if (!INDEX.has(country.code)) {
      setData(null);
      return;
    }
    fetch(`/elections/history/${country.code}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<History>) : null))
      .then((j) => live && setData(j))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [country.code]);

  const today = new Date().toISOString().slice(0, 10);
  const events = useMemo<Event[]>(() => {
    if (!data) return [];
    const out: Event[] = [];
    for (const e of data.elections) out.push({ date: e.date, what: "election", election: e });
    for (const c of data.cabinets) out.push({ date: c.start, what: "cabinet", cabinet: c });
    data.regimes.forEach(([from, , type], i) => {
      const prev = data.regimes[i - 1];
      out.push({ date: `${from}-01-01`, what: "regime", regime: { type, ...(prev ? { prev: { type: prev[2], from: prev[0] } } : {}) } });
    });
    return out.sort((a, b) => b.date.localeCompare(a.date) || (a.what === "regime" ? 1 : -1));
  }, [data]);
  const shown = events.filter((e) => show === "all" || e.what === show);
  const politics = COUNTRY_POLITICS[country.code];
  const idx = INDEX.get(country.code);

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto">
      <PageHeader title="Polls & Elections" className="mb-6" />

      {/* The country, and what its history holds. */}
      <section className="modal-tile rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CountryFind onPick={setCountry} />
        <h2 className="text-lg font-semibold font-sans text-foreground">{country.name}</h2>
        {idx && (
          <p className="text-[11px] font-mono text-muted-foreground">
            {whole(idx[1])} elections on record{idx[2] ? ` · ${idx[2]} to come` : ""}
            {idx[3] ? ` · ${whole(idx[3])} governments` : ""}
            {idx[4] ? ` · regimes ${idx[4]} to ${idx[5]}` : ""}
          </p>
        )}
      </section>

      {data === undefined && <p className="text-[11px] font-sans text-muted-foreground px-1">Reading its history…</p>}
      {data === null && <p className="text-[11px] font-sans text-muted-foreground px-1">No elections, governments or regimes are held for {country.name}.</p>}
      {data && <Timeline data={data} today={today} regimeInk={regimeInk} />}

      {/* The Factbook's most recent election for each chamber, beside the history. */}
      {politics && politics.chambers.some((c) => c.lastElection) && (
        <section className="modal-tile rounded-xl px-4 py-3 mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">The most recent election, as the CIA World Factbook gives it</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {politics.chambers
              .filter((c) => c.lastElection)
              .map((c) => (
                <div key={c.name} className="min-w-0">
                  <p className="text-[12px] font-semibold font-sans text-foreground">{c.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {/^\d{4}-\d{2}-\d{2}$/.test(c.lastElection!) ? day(c.lastElection!) : c.lastElection}
                    {c.seats ? ` · ${c.seats}` : ""}
                    {c.nextElection ? ` · next: ${c.nextElection}` : ""}
                  </p>
                  {/* A chamber renewed in part: the seats are those won at the election, not the whole chamber's. */}
                  {c.scope === "partial renewal" && c.parties?.length ? <p className="text-[10px] font-sans text-muted-foreground">Seats won at that election, of those contested; the chamber is renewed in part.</p> : null}
                  {c.parties?.length ? (
                    <ul className="mt-1 space-y-0.5">
                      {c.parties.map(([p, s]) => (
                        <li key={p} className="flex justify-between gap-2 text-[11px] font-sans">
                          <span className="text-foreground truncate">{p}</span>
                          <span className="font-mono text-muted-foreground shrink-0">{s} seats</span>
                        </li>
                      ))}
                    </ul>
                  ) : c.partiesText ? (
                    <p className="text-[11px] font-sans text-muted-foreground mt-1">{c.partiesText}</p>
                  ) : null}
                </div>
              ))}
          </div>
          <SourceLink sources={[{ label: COUNTRY_POLITICS_SOURCE.label, url: COUNTRY_POLITICS_SOURCE.url }]} className="mt-2" />
        </section>
      )}

      {/* Year by year, newest first. */}
      {data && (
        <section className="modal-tile rounded-xl px-4 py-3 mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex-1">Its history, newest first</p>
            {(
              [
                ["all", "All"],
                ["election", "Elections"],
                ["cabinet", "Governments"],
                ["regime", "Regime changes"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setShow(id)}
                aria-pressed={show === id}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${show === id ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {shown.length ? (
            <ul className="divide-y divide-border/50">
              {(all ? shown : shown.slice(0, 40)).map((e, i) => (
                <li key={`${e.what}-${e.date}-${i}`} className="py-2">
                  <EventRow e={e} today={today} regimeInk={regimeInk} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] font-sans text-muted-foreground">None held for {country.name}.</p>
          )}
          {!all && shown.length > 40 && (
            <button type="button" onClick={() => setAll(true)} className="mt-2 text-[11px] font-sans text-muted-foreground hover:text-foreground cursor-pointer">
              Show all {whole(shown.length)}
            </button>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-1">
        <p className="text-[10px] font-sans text-muted-foreground leading-snug flex-1 min-w-[14rem]">
          Elections are Wikidata's records of each national general, presidential and legislative election and referendum, dated to the day - read on {day(ELECTION_HISTORY_RETRIEVED)} - each linked to
          its record, and marked where its date cites a source. Results and governments are ParlGov's, for the 37 European and OECD democracies it holds: each party's share of the vote and seats, and
          each cabinet, its parties and the prime minister's party. Regimes are V-Dem's Regimes of the World, a research classification of each year since 1789: no government publishes a history of
          its own regime. Opinion polls are not held: no open record of them is published that the site may use.
        </p>
        <SourceLink sources={[ELECTION_HISTORY_SOURCES.wikidata, ELECTION_HISTORY_SOURCES.parlgov, ELECTION_HISTORY_SOURCES.vdem, { label: COUNTRY_POLITICS_SOURCE.label, url: COUNTRY_POLITICS_SOURCE.url }]} />
      </div>
    </div>
  );
}

/** The timeline: the regime as coloured runs of years, each election a dot (hollow where it is still to come), each government a tick. */
function Timeline({ data, today, regimeInk }: { data: History; today: string; regimeInk: (r: number) => string }) {
  const year = +today.slice(0, 4);
  const firsts = [data.regimes[0]?.[0], data.elections[0] ? +data.elections[0].date.slice(0, 4) : undefined, data.cabinets[0] ? +data.cabinets[0].start.slice(0, 4) : undefined].filter((v): v is number => typeof v === "number");
  const y0 = Math.min(...firsts, year - 10);
  const lastElection = data.elections.length ? +data.elections[data.elections.length - 1].date.slice(0, 4) : year;
  const y1 = Math.max(year + 1, lastElection + 1);
  const W = 1000;
  const L = 8;
  const R = 8;
  const x = (y: number) => L + ((y - y0) / (y1 - y0)) * (W - L - R);
  const xd = (d: string) => x(+d.slice(0, 4) + (Date.parse(`${d}T00:00:00Z`) - Date.parse(`${d.slice(0, 4)}-01-01T00:00:00Z`)) / (365.25 * 864e5));
  const span = y1 - y0;
  const step = span > 150 ? 25 : span > 60 ? 10 : 5;
  const ticks: number[] = [];
  for (let t = Math.ceil(y0 / step) * step; t <= y1; t += step) ticks.push(t);
  return (
    <section className="modal-tile rounded-xl px-4 py-3 mb-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        The timeline · {y0} to {y1}
      </p>
      <svg viewBox={`0 0 ${W} 150`} className="w-full h-auto" role="img" aria-label={`Timeline from ${y0} to ${y1}: regime, elections and governments`}>
        {/* Regime */}
        <text x={L} y={14} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
          REGIME (V-DEM)
        </text>
        {data.regimes.map(([from, to, type]) => (
          <rect key={from} x={x(from)} y={20} width={Math.max(1, x(to + 1) - x(from))} height={22} fill={regimeInk(type)} fillOpacity={0.75}>
            <title>{`${from} to ${to}: ${REGIME_TYPES[type].name} - ${REGIME_TYPES[type].said}`}</title>
          </rect>
        ))}
        {/* Elections */}
        <text x={L} y={62} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
          ELECTIONS
        </text>
        <line x1={L} x2={W - R} y1={80} y2={80} className="stroke-border" strokeWidth={1} />
        {data.elections.map((e, i) => {
          const coming = e.date > today;
          return (
            <circle key={`${e.date}-${i}`} cx={xd(e.date)} cy={80} r={4} fill={coming ? "none" : KIND_INK[e.kind]} stroke={KIND_INK[e.kind]} strokeWidth={1.5} fillOpacity={0.85}>
              <title>{`${day(e.date)}: ${e.name}${e.winners ? ` - successful, as Wikidata records it: ${e.winners.join(", ")}` : ""}${coming ? " (to come)" : ""}`}</title>
            </circle>
          );
        })}
        {/* Governments */}
        <text x={L} y={102} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
          GOVERNMENTS (PARLGOV)
        </text>
        {data.cabinets.map((c, i) => (
          <line key={`${c.start}-${i}`} x1={xd(c.start)} x2={xd(c.start)} y1={108} y2={124} className="stroke-foreground" strokeOpacity={0.6} strokeWidth={1.2}>
            <title>{`${day(c.start)}: ${c.name}${c.caretaker ? " (caretaker)" : ""}${c.parties.length ? ` - ${c.parties.join(", ")}` : ""}`}</title>
          </line>
        ))}
        {!data.cabinets.length && (
          <text x={L} y={120} className="fill-muted-foreground" fontSize={10} fontFamily="ui-sans-serif, sans-serif">
            Not held: ParlGov holds 37 European and OECD democracies
          </text>
        )}
        {/* Years */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={128} y2={132} className="stroke-border" />
            <text x={x(t)} y={145} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
              {t}
            </text>
          </g>
        ))}
        <line x1={x(year)} x2={x(year)} y1={18} y2={128} className="stroke-foreground" strokeDasharray="2 3" strokeOpacity={0.5}>
          <title>Today</title>
        </line>
      </svg>
      {/* The key. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
        {REGIME_TYPES.map((r, i) => (
          <span key={r.name} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground" title={r.said}>
            <span className="w-3 h-2 rounded-sm" style={{ background: regimeInk(i), opacity: 0.75 }} />
            {r.name}
          </span>
        ))}
        {(Object.keys(KIND_INK) as (keyof typeof KIND_INK)[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: KIND_INK[k] }} />
            {k}
          </span>
        ))}
        <span className="text-[10px] font-sans text-muted-foreground">a hollow dot is still to come</span>
      </div>
    </section>
  );
}

/** One line of the history: an election with its result, a government taking office, or the regime changing. */
function EventRow({ e, today, regimeInk }: { e: Event; today: string; regimeInk: (r: number) => string }) {
  const [open, setOpen] = useState(false);
  if (e.what === "regime" && e.regime) {
    const r = e.regime;
    return (
      <p className="text-[11px] font-sans text-foreground flex items-center gap-2">
        <span className="font-mono text-muted-foreground w-24 shrink-0">{e.date.slice(0, 4)}</span>
        <span className="w-3 h-2 rounded-sm shrink-0" style={{ background: regimeInk(r.type), opacity: 0.75 }} />
        <span>
          {r.prev ? "Became " : "V-Dem's record begins: "}
          <b>{REGIME_TYPES[r.type].name.toLowerCase()}</b>
          {r.prev ? `, after ${REGIME_TYPES[r.prev.type].name.toLowerCase()} from ${r.prev.from}` : ""}
          <span className="text-muted-foreground"> · V-Dem</span>
        </span>
      </p>
    );
  }
  if (e.what === "cabinet" && e.cabinet) {
    const c = e.cabinet;
    return (
      <p className="text-[11px] font-sans text-foreground flex items-start gap-2">
        <span className="font-mono text-muted-foreground w-24 shrink-0">{day(c.start)}</span>
        <span>
          Government: <b>{c.name}</b>
          {c.caretaker ? " (caretaker)" : ""}
          {c.parties.length ? ` - ${c.parties.join(", ")}` : ""}
          {c.pmParty ? `; the prime minister's party: ${c.pmParty}` : ""}
          <span className="text-muted-foreground"> · ParlGov</span>
        </span>
      </p>
    );
  }
  const el = e.election!;
  const coming = el.date > today;
  const parties = el.results?.parties ?? [];
  return (
    <div className="text-[11px] font-sans text-foreground">
      <div className="flex items-start gap-2">
        <span className="font-mono text-muted-foreground w-24 shrink-0">{day(el.date)}</span>
        <span className="min-w-0">
          <span className="px-1.5 py-px rounded-full text-[9px] border mr-1.5" style={{ borderColor: `${KIND_INK[el.kind]}88`, color: KIND_INK[el.kind] }}>
            {el.kind}
          </span>
          {el.id ? (
            <a href={`https://www.wikidata.org/wiki/${el.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              {el.name}
            </a>
          ) : (
            <b>{el.name}</b>
          )}
          {coming && <span className="text-muted-foreground"> · to come</span>}
          {/* Wikidata's "successful candidate": the winner of a presidential vote, and every party that won seats in a parliamentary one - said as it records it. */}
          {el.winners && <span> · successful, as Wikidata records it: {el.winners.join(", ")}</span>}
          <span className="text-muted-foreground">
            {" "}
            · {el.parlgovOnly ? "ParlGov" : `Wikidata${el.cited ? ", its date citing a source" : ""}`}
            {el.results && !el.parlgovOnly ? "; results ParlGov" : ""}
          </span>
          {parties.length > 0 && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer" aria-expanded={open}>
              {open ? "Hide the results" : `The results (${parties.length} parties)`}
            </button>
          )}
        </span>
      </div>
      {open && parties.length > 0 && (
        <table className="mt-1 ml-26 text-[10px] font-mono">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal pr-4">Party</th>
              <th className="text-right font-normal pr-4">Vote</th>
              <th className="text-right font-normal">Seats{el.results?.seats ? ` of ${el.results.seats}` : ""}</th>
            </tr>
          </thead>
          <tbody>
            {parties.map(([p, v, s]) => (
              <tr key={p}>
                <td className="pr-4 font-sans">{p}</td>
                <td className="text-right pr-4">{v === null ? "-" : `${v.toFixed(1)}%`}</td>
                <td className="text-right">{s === null ? "-" : s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
