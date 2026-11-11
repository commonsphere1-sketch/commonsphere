/**
 * Polls & Elections, as asked: one country at a time, its history on a timeline - its political regime year by year since
 * 1789 (V-Dem), its national elections (Wikidata) with their results where ParlGov has them, and its changes of
 * government (ParlGov's cabinets), its heads of state and of government (Wikidata, each term kept where the country's record
 * and the person's agree) and its turning points - revolutions, coups and wars, from the site's record of events - with,
 * under each regime, the leaders and turning points of its years; and the same, year by year, newest first, each with its
 * source. The CIA World Factbook's most recent election for each chamber stands beside it.
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
/** A term of a head of state or of government: from (a day, or a year where the two records agree only on it), to where both records end it alike, `now` where the site's checked heads name the person, `end` where no end is agreed. */
type Leader = { role: "state" | "government"; name: string; id: string; from: string; to?: string; now?: true; end?: string };
type History = { cc: string; elections: Election[]; cabinets: Cabinet[]; regimes: [from: number, to: number, type: 0 | 1 | 2 | 3][]; leaders?: Leader[] };

/* The country's turning points, from the site's record of events (build-event-history.cjs): its revolutions, coups and wars,
   each as a whole - not a war's battles - by its record's own class. */
type Ev = { c: number; k: number; t: string; w?: string; y?: number; p?: string; s?: string; f?: 1; l?: [string, string][]; u?: number };
type EvFile = { kinds: string[]; events: Ev[] };
const EVENT_FILES = import.meta.glob<EvFile>("../data/eventHistory/*.json", { import: "default" });
const TURNING = new Set(["Revolution", "Coup d'état", "Attempted coup d'état", "Civil war", "War", "War of independence", "War of national liberation", "Invasion", "Military occupation", "Religious war", "War of succession", "Series of wars"]);
type Turning = { y: number; when?: string; title: string; kind: string; abroad?: true; desc?: string; sources: [string, string][] };
const yearOf = (d: string) => +d.slice(0, 4);
const termOf = (l: Leader) => `${l.from.length > 4 ? day(l.from) : l.from} to ${l.to ? (l.to.length > 4 ? day(l.to) : l.to) : l.now ? "now" : `- (end ${l.end})`}`;
const ROLE = { state: "Head of state", government: "Head of government" } as const;

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const INDEX = new Map(ELECTION_HISTORY_INDEX.map((r) => [r[0], r]));
const KIND_INK = { Presidential: "#a78bfa", Legislative: "#60a5fa", General: "#f472b6", Referendum: "#fbbf24" } as const;
const day = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const whole = (v: number) => v.toLocaleString("en-US");

/** What happened in a year, for the list under the timeline. */
type Event = { date: string; what: "election" | "cabinet" | "regime" | "leader" | "turning"; election?: Election; cabinet?: Cabinet; regime?: { type: number; prev?: { type: number; from: number } }; leader?: Leader; turning?: Turning };

export default function ElectionsPage() {
  const { theme } = useTheme();
  const ramp = theme === "light" ? LIVING_LIGHT : LIVING_DARK;
  const regimeInk = (r: number) => ramp[[0, 2, 4, 5][r]];
  const [country, setCountry] = useState<{ code: string; name: string }>({ code: "US", name: NAME.get("US") ?? "United States" });
  const [data, setData] = useState<History | null | undefined>(undefined);
  const [show, setShow] = useState<"all" | "election" | "cabinet" | "regime" | "leader" | "turning">("all");
  const [turning, setTurning] = useState<Turning[]>([]);
  useEffect(() => {
    let live = true;
    setTurning([]);
    const load = EVENT_FILES[`../data/eventHistory/${country.code}.json`];
    if (!load) return;
    void load().then((file) => {
      if (!live || !file) return;
      setTurning(
        file.events
          .filter((e) => e.u === undefined && typeof e.y === "number" && TURNING.has(file.kinds[e.k]))
          .map((e) => ({ y: e.y!, when: e.w, title: e.t, kind: file.kinds[e.k], ...(e.f ? { abroad: true as const } : {}), ...(e.s ? { desc: e.s } : {}), sources: e.l ?? [] }))
          .sort((a, b) => a.y - b.y),
      );
    });
    return () => {
      live = false;
    };
  }, [country.code]);
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
    for (const l of data.leaders ?? []) out.push({ date: l.from.length > 4 ? l.from : `${l.from}-01-01`, what: "leader", leader: l });
    for (const tp of turning) out.push({ date: `${tp.y}-01-01`, what: "turning", turning: tp });
    data.regimes.forEach(([from, , type], i) => {
      const prev = data.regimes[i - 1];
      out.push({ date: `${from}-01-01`, what: "regime", regime: { type, ...(prev ? { prev: { type: prev[2], from: prev[0] } } : {}) } });
    });
    return out.sort((a, b) => b.date.localeCompare(a.date) || (a.what === "regime" ? 1 : -1));
  }, [data, turning]);
  const shown = events.filter((e) => show === "all" || e.what === show);
  const politics = COUNTRY_POLITICS[country.code];
  const idx = INDEX.get(country.code);

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto">
      <PageHeader title="Polls & Elections" className="mb-6" />

      {/* The country, and what its history holds. */}
      <section className="modal-tile rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CountryFind onPick={setCountry} label="Choose a country to see its elections, leaders and regimes" />
        <h2 className="text-lg font-semibold font-sans text-foreground">{country.name}</h2>
        {idx && (
          <p className="text-[11px] font-mono text-muted-foreground">
            {whole(idx[1])} elections on record{idx[2] ? ` · ${idx[2]} to come` : ""}
            {idx[3] ? ` · ${whole(idx[3])} governments` : ""}
            {idx[6] ? ` · ${whole(idx[6])} leaders' terms` : ""}
            {idx[4] ? ` · regimes ${idx[4]} to ${idx[5]}` : ""}
          </p>
        )}
      </section>

      {data === undefined && <p className="text-[11px] font-sans text-muted-foreground px-1">Reading its history…</p>}
      {data === null && <p className="text-[11px] font-sans text-muted-foreground px-1">No elections, governments or regimes are held for {country.name}.</p>}
      {data && <Timeline data={data} today={today} regimeInk={regimeInk} turning={turning} />}
      {data && data.regimes.length > 0 && <RegimeBreakdown data={data} turning={turning} today={today} regimeInk={regimeInk} />}

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
                ["leader", "Leaders"],
                ["turning", "Turning points"],
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
          its own regime. Leaders are Wikidata's heads of state and of government, each term kept only where the country's own record and the person's agree on who and the year it began; an end
          is given where both give it alike, and a term is said to be current only where the site's checked list of heads names the same person. Turning points are the revolutions, coups and wars
          of the site's record of events, each as a whole, with its sources. Opinion polls are not held: no open record of them is published that the site may use.
        </p>
        <SourceLink sources={[ELECTION_HISTORY_SOURCES.wikidata, ELECTION_HISTORY_SOURCES.parlgov, ELECTION_HISTORY_SOURCES.vdem, { label: COUNTRY_POLITICS_SOURCE.label, url: COUNTRY_POLITICS_SOURCE.url }]} />
      </div>
    </div>
  );
}

/** The timeline: the regime as coloured runs of years, each election a dot (hollow where it is still to come), each government a tick. */
function Timeline({ data, today, regimeInk, turning }: { data: History; today: string; regimeInk: (r: number) => string; turning: Turning[] }) {
  const leaders = data.leaders ?? [];
  const year = +today.slice(0, 4);
  const firsts = [data.regimes[0]?.[0], data.elections[0] ? +data.elections[0].date.slice(0, 4) : undefined, data.cabinets[0] ? +data.cabinets[0].start.slice(0, 4) : undefined, leaders[0] ? yearOf(leaders[0].from) : undefined].filter((v): v is number => typeof v === "number");
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
      <svg viewBox={`0 0 ${W} 210`} className="w-full h-auto" role="img" aria-label={`Timeline from ${y0} to ${y1}: regime, turning points, elections, leaders and governments`}>
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
        {/* Turning points: revolutions, coups and wars, each a diamond in its year. */}
        <text x={L} y={56} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
          TURNING POINTS
        </text>
        {turning
          .filter((tp) => tp.y >= y0)
          .map((tp, i) => {
            const cx = x(tp.y + 0.5);
            return (
              <path key={`tp-${i}`} d={`M${cx},60 l4,5 l-4,5 l-4,-5 z`} className="fill-foreground" fillOpacity={tp.abroad ? 0.35 : 0.75}>
                <title>{`${tp.y}: ${tp.title} - ${tp.kind}${tp.abroad ? ", taken part in" : ""}`}</title>
              </path>
            );
          })}
        <text x={L} y={86} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
          ELECTIONS
        </text>
        <line x1={L} x2={W - R} y1={100} y2={100} className="stroke-border" strokeWidth={1} />
        {data.elections.map((e, i) => {
          const coming = e.date > today;
          return (
            <circle key={`${e.date}-${i}`} cx={xd(e.date)} cy={100} r={4} fill={coming ? "none" : KIND_INK[e.kind]} stroke={KIND_INK[e.kind]} strokeWidth={1.5} fillOpacity={0.85}>
              <title>{`${day(e.date)}: ${e.name}${e.winners ? ` - successful, as Wikidata records it: ${e.winners.join(", ")}` : ""}${coming ? " (to come)" : ""}`}</title>
            </circle>
          );
        })}
        {/* Governments */}
        {/* The heads of state and of government: each term a bar from its start to its end - to today where it is current - and only a mark at its start where no end is agreed. */}
        {(["state", "government"] as const).map((role, r) => {
          const top = 122 + r * 22;
          return (
            <g key={role}>
              <text x={L} y={top - 4} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
                {role === "state" ? "HEADS OF STATE" : "HEADS OF GOVERNMENT"}
              </text>
              {leaders
                .filter((l) => l.role === role)
                .map((l, i) => {
                  const a = l.from.length > 4 ? xd(l.from) : x(yearOf(l.from));
                  const b = l.to ? (l.to.length > 4 ? xd(l.to) : x(yearOf(l.to) + 1)) : l.now ? xd(today) : a + 2;
                  return (
                    <rect key={`${role}-${i}`} x={a} y={top} width={Math.max(2, b - a)} height={8} rx={2} className="fill-foreground" fillOpacity={i % 2 ? 0.35 : 0.6}>
                      <title>{`${l.name}: ${termOf(l)}`}</title>
                    </rect>
                  );
                })}
            </g>
          );
        })}
        <text x={L} y={170} className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
          GOVERNMENTS (PARLGOV)
        </text>
        {data.cabinets.map((c, i) => (
          <line key={`${c.start}-${i}`} x1={xd(c.start)} x2={xd(c.start)} y1={174} y2={186} className="stroke-foreground" strokeOpacity={0.6} strokeWidth={1.2}>
            <title>{`${day(c.start)}: ${c.name}${c.caretaker ? " (caretaker)" : ""}${c.parties.length ? ` - ${c.parties.join(", ")}` : ""}`}</title>
          </line>
        ))}
        {!data.cabinets.length && (
          <text x={L + 150} y={170} className="fill-muted-foreground" fontSize={10} fontFamily="ui-sans-serif, sans-serif">
            not held: ParlGov holds 37 European and OECD democracies
          </text>
        )}
        {/* Years */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={190} y2={194} className="stroke-border" />
            <text x={x(t)} y={206} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontFamily="ui-monospace, monospace">
              {t}
            </text>
          </g>
        ))}
        <line x1={x(year)} x2={x(year)} y1={18} y2={190} className="stroke-foreground" strokeDasharray="2 3" strokeOpacity={0.5}>
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

/**
 * Each regime of the country's, newest first, as asked: its years and V-Dem's type, the heads of state and of government in
 * office in those years, and its turning points - revolutions, coups and wars - each with its source.
 */
function RegimeBreakdown({ data, turning, today, regimeInk }: { data: History; turning: Turning[]; today: string; regimeInk: (r: number) => string }) {
  const [more, setMore] = useState<Set<number>>(new Set());
  const leaders = data.leaders ?? [];
  const now = +today.slice(0, 4);
  return (
    <section className="modal-tile rounded-xl px-4 py-3 mb-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Its regimes, with their leaders and turning points</p>
      <ol className="space-y-3">
        {[...data.regimes].reverse().map(([from, to, type]) => {
          const last = to >= data.regimes[data.regimes.length - 1][1];
          // Newest first, as its turning points are.
          const inOffice = [...leaders].reverse().filter((l) => {
            const a = yearOf(l.from);
            const b = l.to ? yearOf(l.to) : l.now ? now : a;
            return a <= to && b >= from;
          });
          const points = turning.filter((tp) => tp.y >= from && tp.y <= to).reverse();
          const open = more.has(from);
          const cut = (n: number) => (open ? n : Math.min(n, 8));
          return (
            <li key={from} className="border-t border-border/50 pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: regimeInk(type), opacity: 0.8 }} />
                <span className="text-[12px] font-semibold font-sans text-foreground">{REGIME_TYPES[type].name}</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {from} to {last ? `${to}, V-Dem's latest year` : to}
                </span>
                <span className="text-[10px] font-sans text-muted-foreground">· {REGIME_TYPES[type].said}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1.5">
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Leaders in office</p>
                  {inOffice.length ? (
                    <ul className="mt-0.5 space-y-0.5">
                      {inOffice.slice(0, cut(inOffice.length)).map((l, i) => (
                        <li key={`${l.id}-${l.from}-${i}`} className="text-[11px] font-sans text-foreground truncate" title={`${ROLE[l.role]} · ${termOf(l)}`}>
                          <a href={`https://www.wikidata.org/wiki/${l.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {l.name}
                          </a>
                          <span className="text-muted-foreground"> · {l.role === "state" ? "state" : "government"} · {termOf(l)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] font-sans text-muted-foreground">None whose two records agree.</p>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Turning points</p>
                  {points.length ? (
                    <ul className="mt-0.5 space-y-0.5">
                      {points.slice(0, cut(points.length)).map((tp, i) => (
                        <li key={`${tp.y}-${i}`} className="text-[11px] font-sans text-foreground truncate" title={tp.desc ?? tp.kind}>
                          <span className="font-mono text-muted-foreground">{tp.y} </span>
                          {tp.sources[0] ? (
                            <a href={tp.sources[0][1]} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {tp.title}
                            </a>
                          ) : (
                            tp.title
                          )}
                          <span className="text-muted-foreground"> · {tp.kind.toLowerCase()}{tp.abroad ? ", taken part in" : ""}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] font-sans text-muted-foreground">None in the record.</p>
                  )}
                </div>
              </div>
              {(inOffice.length > 8 || points.length > 8) && (
                <button
                  type="button"
                  onClick={() => setMore((m) => new Set(open ? [...m].filter((x) => x !== from) : [...m, from]))}
                  className="mt-1 text-[10px] font-sans text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {open ? "Fewer" : `All ${inOffice.length} leaders and ${points.length} turning points`}
                </button>
              )}
            </li>
          );
        })}
      </ol>
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
  if (e.what === "leader" && e.leader) {
    const l = e.leader;
    return (
      <p className="text-[11px] font-sans text-foreground flex items-start gap-2">
        <span className="font-mono text-muted-foreground w-24 shrink-0">{l.from.length > 4 ? day(l.from) : l.from}</span>
        <span>
          {ROLE[l.role]}:{" "}
          <a href={`https://www.wikidata.org/wiki/${l.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            {l.name}
          </a>
          <span className="text-muted-foreground"> · {termOf(l)} · Wikidata, two records agreeing</span>
        </span>
      </p>
    );
  }
  if (e.what === "turning" && e.turning) {
    const tp = e.turning;
    return (
      <p className="text-[11px] font-sans text-foreground flex items-start gap-2">
        <span className="font-mono text-muted-foreground w-24 shrink-0">{tp.y}</span>
        <span>
          <span className="text-muted-foreground">{tp.kind}{tp.abroad ? ", taken part in" : ""}: </span>
          {tp.sources[0] ? (
            <a href={tp.sources[0][1]} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              {tp.title}
            </a>
          ) : (
            <b>{tp.title}</b>
          )}
          {tp.when && tp.when !== String(tp.y) ? <span className="text-muted-foreground"> · {tp.when}</span> : null}
          {tp.sources.length ? <span className="text-muted-foreground"> · {tp.sources.map((s) => s[0]).join(", ")}</span> : null}
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
