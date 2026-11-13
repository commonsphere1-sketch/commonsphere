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
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { SourceLink } from "../components/SourceLink";
import { CountryFind } from "../components/OccurrencePanel";
import { countriesData } from "../data/countriesData";
import { ELECTION_HISTORY_INDEX, ELECTION_HISTORY_RETRIEVED, ELECTION_HISTORY_SOURCES } from "../data/electionHistory";
import { REGIME_TYPES } from "../data/regimes";
import { COUNTRY_POLITICS, COUNTRY_POLITICS_SOURCE } from "../data/countryPolitics";
import { LIVING_DARK, LIVING_LIGHT } from "../lib/livingScore";
import { useTheme } from "../contexts/ThemeContext";
import { downloadCsv, type CsvCell } from "../lib/csv";
import { lockScroll } from "../lib/scrollLock";
import { WindowTitle } from "../components/WindowTitle";
import { type Tip, TipCard } from "../components/TipCard";
import { CompassPlot, CompassPositions, inQuarter, type CompassDot, type Quarter } from "../components/PoliticalCompass";
import { ArrowsIn, ArrowsOut, X } from "@phosphor-icons/react";

/** A party's result: its share of the vote, its seats, and its place from left (0) to right (10) on ParlGov's scale. */
type Party = [name: string, vote: number | null, seats: number | null, leftRight?: number | null];
/** What a winner stood for, as Wikidata records it: a person's party at the election, and that party's - or a winning party's own - ideologies and alignment. */
type Stood = { party?: string; ideology?: string[]; position?: string };
type Election = { id?: string; date: string; name: string; kind: "Presidential" | "Legislative" | "General" | "Referendum" | "Conclave"; winners?: string[]; stood?: Record<string, Stood>; cited?: true; parlgovOnly?: true; results?: { seats?: number; parties: Party[] } };
/** A winner with what they stood for, in a line. */
const stoodSaid = (name: string, s?: Stood) => {
  if (!s) return name;
  const bits = [s.party, s.position, s.ideology?.join(", ")].filter(Boolean);
  return bits.length ? `${name} (${bits.join("; ")})` : name;
};
type Cabinet = { start: string; name: string; caretaker: boolean; parties: string[]; pmParty: string | null; /** The prime minister's party on ParlGov's scale, left (0) to right (10). */ pmLeftRight?: number };
/** A term of a head of state or of government: from (a day, or a year where the two records agree only on it), to where both records end it alike, `now` where the site's checked heads name the person, `end` where no end is agreed. */
type Leader = { role: "state" | "government" | "pope"; name: string; id: string; from: string; to?: string; now?: true; end?: string; /** The party at the start of the term, and its political alignment, as Wikidata records them. */ party?: string; align?: string };
/** V-Dem's indices, each [first year, a value (0 to 1) for each year on, null where none]. */
type Indices = Partial<Record<"civ" | "expr" | "women", (number | null)[]>>;
type History = { cc: string; elections: Election[]; cabinets: Cabinet[]; regimes: [from: number, to: number, type: 0 | 1 | 2 | 3][]; leaders?: Leader[]; indices?: Indices };

/** The three freedoms drawn, V-Dem's indices: what each is, and its colour. */
const FREEDOMS = [
  { key: "civ", name: "Civil liberties", ink: "#0d9488" },
  { key: "expr", name: "Freedom of expression", ink: "#2563eb" },
  { key: "women", name: "Women's political empowerment", ink: "#c026d3" },
] as const;
/** An index's value in a year, where V-Dem gives one. */
const indexAt = (s: (number | null)[] | undefined, y: number) => (s && y >= (s[0] as number) ? (s[1 + y - (s[0] as number)] ?? null) : null);
/** Wikidata's political alignment as a place from left to right, for drawing: its words, read one by one; a party given more than one is drawn at none. */
const ALIGN = ["far-left", "left-wing", "centre-left", "centrism", "centre-right", "right-wing", "far-right"];
const alignAt = (a?: string) => {
  if (!a || a.includes(",")) return null;
  const i = ALIGN.findIndex((w) => a.toLowerCase().startsWith(w.replace("centrism", "centr")));
  return i < 0 ? null : i;
};

/* The country's turning points, from the site's record of events (build-event-history.cjs): its revolutions, coups and wars,
   each as a whole - not a war's battles - by its record's own class. */
type Ev = { c: number; k: number; t: string; w?: string; y?: number; p?: string; s?: string; f?: 1; l?: [string, string][]; u?: number };
type EvFile = { kinds: string[]; events: Ev[] };
const EVENT_FILES = import.meta.glob<EvFile>("../data/eventHistory/*.json", { import: "default" });
const TURNING = new Set(["Revolution", "Coup d'état", "Attempted coup d'état", "Civil war", "War", "War of independence", "War of national liberation", "Invasion", "Military occupation", "Religious war", "War of succession", "Series of wars"]);
type Turning = { y: number; when?: string; title: string; kind: string; abroad?: true; desc?: string; sources: [string, string][] };
const yearOf = (d: string) => +d.slice(0, 4);
const termOf = (l: Leader) => `${l.from.length > 4 ? day(l.from) : l.from} to ${l.to ? (l.to.length > 4 ? day(l.to) : l.to) : l.now ? "now" : `- (end ${l.end})`}`;
const ROLE = { state: "Head of state", government: "Head of government", pope: "Pope" } as const;

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const INDEX = new Map(ELECTION_HISTORY_INDEX.map((r) => [r[0], r]));
const KIND_INK = { Presidential: "#a78bfa", Legislative: "#60a5fa", General: "#f472b6", Referendum: "#fbbf24", Conclave: "#b91c1c" } as const;
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
      {data && <Timeline key={country.code} data={data} today={today} regimeInk={regimeInk} turning={turning} country={country.name} />}
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
          of the site's record of events, each as a whole, with its sources. What a winner stood for is as the records give it: a person's party at the election, and that party's ideologies and political
          alignment, from Wikidata; and each party's place from left (0) to right (10) on ParlGov's scale, from expert surveys. Neither is a platform: the records of parties' manifestos that exist may
          not be used on a commercial site. Opinion polls and leaders' approval ratings are not held: they are published by polling firms under their own copyright, and no open record of them is
          published that the site may use. Freedoms are V-Dem's yearly indices, 0 (none) to 1 (fullest), as Our World in Data publishes them: civil liberties,
          freedom of expression, and women's political empowerment. A government's leaning is ParlGov's place for the prime minister's party, left (0) to right (10), where it holds the country,
          and elsewhere the political alignment Wikidata records for the head of government's party at the start of the term.
        </p>
        <SourceLink sources={[ELECTION_HISTORY_SOURCES.wikidata, ELECTION_HISTORY_SOURCES.parlgov, ELECTION_HISTORY_SOURCES.vdem, { label: COUNTRY_POLITICS_SOURCE.label, url: COUNTRY_POLITICS_SOURCE.url }]} />
      </div>
    </div>
  );
}

/**
 * The governments' leaning, as stretches of time, one way for the timeline and the compass alike. ParlGov's place for the
 * prime minister's party, left (0) to right (10), where ParlGov holds the country - each cabinet until the next, or until
 * a head of government it is not named after takes office (ParlGov's record ends before today: its last cabinet must not
 * run on past the government that followed it); after its last, and wherever ParlGov does not hold the country, the
 * political alignment Wikidata records for each head of government's party at the start of the term - or, where none is
 * recorded for a head of government, each head of state's. A party given more than one alignment is not placed.
 */
type LeanSpan = { from: string; to: string; open: boolean; across: number; who: string; lean: string; source: "ParlGov" | "Wikidata" };
/** A day from a date or a bare year. */
const dayOf = (d: string, end = false) => (d.length > 4 ? d : `${d}-${end ? "12-31" : "01-01"}`);
function leanSpans(data: History, today: string): LeanSpan[] {
  const leaders = data.leaders ?? [];
  const pg = data.cabinets.filter((c) => typeof c.pmLeftRight === "number");
  const govs = leaders.filter((l) => l.role === "government");
  const wd = (l: Leader): LeanSpan | null => {
    const step = alignAt(l.align);
    if (step === null) return null;
    const open = !l.to && Boolean(l.now);
    return { from: dayOf(l.from), to: l.to ? dayOf(l.to, true) : open ? today : dayOf(l.from), open, across: (2 * step) / (ALIGN.length - 1) - 1, who: l.name, lean: `${l.party}: ${l.align}`, source: "Wikidata" };
  };
  if (!pg.length) {
    const role: Leader["role"] = govs.some((l) => alignAt(l.align) !== null) ? "government" : "state";
    return leaders.filter((l) => l.role === role).flatMap((l) => wd(l) ?? []);
  }
  const surname = (n: string) => n.trim().split(/\s+/).pop()!.toLowerCase();
  const out: LeanSpan[] = [];
  let until = "";
  pg.forEach((c, i) => {
    let to = pg[i + 1]?.start ?? today;
    // A head of government the cabinet is not named after, taking office in its time: the cabinet's record ends there.
    const other = govs.find((l) => dayOf(l.from) > c.start && dayOf(l.from) < to && !c.name.toLowerCase().includes(surname(l.name)));
    if (other) to = dayOf(other.from);
    out.push({ from: c.start, to, open: !pg[i + 1] && !other, across: (2 * c.pmLeftRight!) / 10 - 1, who: `${c.name} cabinet`, lean: `${c.pmParty}: ${c.pmLeftRight} on ParlGov's scale, left (0) to right (10)`, source: "ParlGov" });
    until = to;
  });
  // After ParlGov's last cabinet, the heads of government Wikidata records, from where the cabinets end.
  if (until < today)
    for (const l of govs) {
      const s = wd(l);
      if (s && s.to > until) out.push({ ...s, from: s.from < until ? until : s.from });
    }
  return out;
}

/* ── The political compass, as asked ──────────────────────────────────────────
   Where the country stands in each year of the period chosen on the timeline: across, its government's leaning, left to
   right; up and down, how free its people are - V-Dem's civil liberties index - authoritarian at the top, libertarian at the
   foot. Two records set side by side, each with its source: not The Political Compass's own test, which scores a person's
   answers and not a government. A year without both is not drawn. The Dashboard's compass is the grid's legend: what each
   part means and the ideas it is read by (CompassLedger). */
type CompassPoint = { y: number; across: number; who: string; lean: string; source: string; civ: number };
function compassPoints(data: History, from: number, to: number, today: string): CompassPoint[] {
  const spans = leanSpans(data, today);
  const out: CompassPoint[] = [];
  for (let y = from; y <= to; y++) {
    const civ = indexAt(data.indices?.civ, y);
    if (civ == null) continue;
    // Who governed at the middle of the year: the last span begun by then that had not ended.
    const mid = `${y}-07-01`;
    const s = [...spans].reverse().find((x) => x.from <= mid && (x.to > mid || (x.open && mid <= today)));
    if (s) out.push({ y, across: s.across, who: s.who, lean: s.lean, source: s.source, civ });
  }
  return out;
}

/** The years as the compass's dots: each in amber, the last the solid one. */
const dotsOf = (points: CompassPoint[]): CompassDot[] =>
  points.map((p, i) => {
    const last = i === points.length - 1;
    return { key: p.y, across: p.across, civ: p.civ, r: last ? 5.5 : 3, fill: last ? "currentColor" : "#f59e0b", fillOpacity: last ? 1 : 0.75, stroke: last ? "#f59e0b" : "none" };
  });

/** Where the country stood in the last year drawn, in words. */
const standing = (p: CompassPoint) =>
  `${p.across < -0.15 ? "left of centre" : p.across > 0.15 ? "right of centre" : "near the centre"}, ${p.civ >= 0.66 ? "toward the libertarian end" : p.civ <= 0.33 ? "toward the authoritarian end" : "between the two ends"}`;

/**
 * The political compass, as asked: a card under the timeline - the compass small, and where the country stood in the last
 * year drawn - that opens a window of its own, in the site's style, with the compass drawn large, each year's place in a
 * table, and what it is made of. It follows what the page shows: the country chosen, and the period chosen on the timeline.
 */
function Compass({ data, from, to, country, today }: { data: History; from: number; to: number; country: string; today: string }) {
  const points = useMemo(() => compassPoints(data, from, to, today), [data, from, to, today]);
  const [open, setOpen] = useState(false);
  const last = points[points.length - 1];
  const label = `${country} on the political compass, ${from} to ${to}`;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!points.length}
        className="modal-tile rounded-xl px-4 py-3 mb-4 w-full text-left flex items-center gap-4 cursor-pointer disabled:cursor-default transition-colors hover:border-foreground/30"
        aria-label={points.length ? `Open ${label}` : `${country} on the political compass: not held for these years`}
      >
        <span className="w-24 shrink-0 text-foreground">{points.length ? <CompassPlot dots={dotsOf(points)} label={label} path tag={{ key: last.y, text: String(last.y) }} /> : null}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            The political compass · {from} to {to}
          </span>
          {last ? (
            <>
              <span className="block text-[13px] font-semibold font-sans text-foreground mt-1">
                In {last.y}, {country} stood {standing(last)}
              </span>
              <span className="block text-[11px] font-sans text-muted-foreground mt-0.5">
                Its government's leaning across ({last.source}), its civil liberties up and down (V-Dem) · {points.length} {points.length === 1 ? "year" : "years"} drawn · open for each year and
                what it is made of
              </span>
            </>
          ) : (
            <span className="block text-[11px] font-sans text-muted-foreground mt-1">
              Not held for {country} in these years: a place on the compass needs both a government's leaning and V-Dem's civil liberties for the same year.
            </span>
          )}
        </span>
      </button>
      {open && points.length > 0 && <CompassWindow points={points} data={data} from={from} to={to} country={country} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}

/** The compass's window: the site's window, as every place's and figure's is - its title bar, expanded or not, and closed by Escape or a press beside it. */
function CompassWindow({ points, data, from, to, country, label, onClose }: { points: CompassPoint[]; data: History; from: number; to: number; country: string; label: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);
  const last = points[points.length - 1];
  const sources = [...new Set(points.map((p) => p.source))];
  const show = (e: React.MouseEvent, p: CompassPoint) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title: `${country}, ${p.y}`, lines: [`Governing: ${p.who}`, `Leaning: ${p.lean} (${p.source})`, `Civil liberties: ${p.civ.toFixed(3)} (V-Dem, 0 to 1)`] });
  };
  const here = (Q: Quarter) => points.filter((p) => inQuarter(p.across, p.civ, Q)).length;
  const showQuarter = (e: React.MouseEvent, Q: Quarter) => {
    const r = box.current?.getBoundingClientRect();
    const n = here(Q);
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title: Q.name, lines: [Q.say, n ? `${country} stood here in ${n} of the ${points.length} years drawn.` : `${country} stood here in none of the years drawn.`] });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={label}>
      <div className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${expanded ? "max-w-full max-h-full m-0" : "max-w-4xl max-h-[90vh]"}`}>
        <div className="p-6">
          <WindowTitle title={`${country} · the political compass`} note={`${from} to ${to}`}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label={expanded ? "Collapse the window" : "Expand the window to the whole screen"}
              title={expanded ? "Collapse" : "Expand to the whole screen"}
            >
              {expanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </WindowTitle>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,22rem)_1fr] gap-6 mt-4 items-start">
            <div ref={box} className="relative text-foreground">
              <CompassPlot dots={dotsOf(points)} label={label} path tag={{ key: last.y, text: String(last.y) }} onDot={(e, i) => show(e, points[i])} onLeave={() => setTip(null)} onQuarter={showQuarter} />
              {tip && <TipCard tip={tip} room={box.current?.clientWidth ?? 300} />}
            </div>
            <div className="min-w-0 space-y-3">
              <p className="text-[13px] font-sans text-foreground leading-snug">
                In {last.y}, {country} stood {standing(last)}: its government {last.who} - {last.lean} - and civil liberties of {last.civ.toFixed(3)}.
              </p>
              {/* Each year's place, the latest first. */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60">
                <table className="w-full text-[11px] font-sans">
                  <thead className="sticky top-0 bg-background/90 backdrop-blur-sm">
                    <tr className="text-left text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-1.5 font-normal">Year</th>
                      <th className="px-2 py-1.5 font-normal">Governing</th>
                      <th className="px-2 py-1.5 font-normal">Leaning</th>
                      <th className="px-2 py-1.5 font-normal text-right">Civil liberties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.y} className="border-t border-border/40">
                        <td className="px-2 py-1 font-mono">{p.y}</td>
                        <td className="px-2 py-1 text-foreground">{p.who}</td>
                        <td className="px-2 py-1 text-muted-foreground">{p.lean}</td>
                        <td className="px-2 py-1 font-mono text-right">{p.civ.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] font-sans text-muted-foreground leading-snug">
                Across, the government's leaning:{" "}
                {sources.includes("ParlGov")
                  ? "ParlGov's place for the prime minister's party, left (0) to right (10), from experts' surveys"
                  : "the political alignment Wikidata records for the head of government's party, its seven steps from far-left to far-right set evenly across"}
                . Up and down, how free its people are: V-Dem's civil liberties index, 0 to 1, the most free at the foot. Each dot is a year of the period chosen on the timeline, the
                government the one in office at its middle; a year without both - a party given more than one alignment, a year V-Dem has not scored - is not drawn. The two are set
                side by side, not combined into one measure: this is not The Political Compass's own test, which places a person by their answers.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(`${data.cc}-political-compass-${from}-${to}.csv`, ["year", "governing", "leaning", "leaning source", "left (-1) to right (1)", "civil liberties (V-Dem, 0 to 1)"], points.map((p) => [p.y, p.who, p.lean, p.source, p.across.toFixed(3), p.civ]))
                  }
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Each year's place on the compass, with what it is made of, as a spreadsheet"
                >
                  Download CSV
                </button>
                <SourceLink
                  sources={[
                    ...(sources.includes("ParlGov") ? [ELECTION_HISTORY_SOURCES.parlgov] : []),
                    ...(sources.includes("Wikidata") ? [ELECTION_HISTORY_SOURCES.wikidata] : []),
                    ELECTION_HISTORY_SOURCES.vdemIndices,
                  ]}
                />
              </div>
            </div>
          </div>

          {/* The positions on the compass, as asked: each quarter, what puts a government there, and the years drawn in it. */}
          <CompassPositions count={(Q) => `${here(Q)} of ${points.length} ${points.length === 1 ? "year" : "years"}`} />
        </div>
      </div>
    </div>
  );
}

type Row = { key: string; label: string; source: string; height: number; draw: (top: number) => ReactNode };

/**
 * The timeline, made for research, as asked: each row named in a column of its own with its source, the years in a grid
 * under all of them, a period to look at, the details of anything pointed at in a card, and the whole of it to download.
 *
 *   Regime          V-Dem's type for each run of years
 *   Turning points  revolutions, coups and wars, a diamond each (fainter where the country took part abroad)
 *   Elections       a row for each kind held: presidential, legislative and general, referendums (hollow: still to come)
 *   Heads           of state and of government: each term a bar, named where the name fits, overlapping terms on lines of
 *                   their own; a term whose end the records do not agree on is a mark at its start
 *   Governments     ParlGov's cabinets, where it holds the country
 */
function Timeline({ data, today, regimeInk, turning, country }: { data: History; today: string; regimeInk: (r: number) => string; turning: Turning[]; country: string }) {
  const year = +today.slice(0, 4);
  const leaders = data.leaders ?? [];
  // The years the country's own records cover - its regimes, elections, leaders and governments - open the timeline;
  // a turning point from before them (a war of the eleventh century) is a button away, not the whole width.
  const firsts = [data.regimes[0]?.[0], data.elections[0] ? yearOf(data.elections[0].date) : undefined, data.cabinets[0] ? yearOf(data.cabinets[0].start) : undefined, leaders[0] ? yearOf(leaders[0].from) : undefined].filter(
    (v): v is number => typeof v === "number",
  );
  const coreY = Math.min(...firsts, year - 10);
  const minY = Math.min(coreY, turning[0]?.y ?? coreY);
  const lastElection = data.elections.length ? yearOf(data.elections[data.elections.length - 1].date) : year;
  const maxY = Math.max(year + 1, lastElection + 1);
  /* The period looked at: all of it, or from a year on - each offered only where the record reaches further back. */
  // "All" is every record, back to the earliest turning point; the country's own records' first year where it is later; the last 25 years open it, as asked.
  const presets = (
    [
      ["All", minY],
      ...(coreY > minY ? ([[`From ${coreY}`, coreY]] as const) : []),
      ["Since 1900", 1900],
      ["Since 1945", 1945],
      ["Since 1990", 1990],
      ["Last 25 years", year - 25],
    ] as const
  ).filter(([, y], i, all) => i === 0 || (y > minY && all.findIndex(([, z]) => z === y) === i));
  const [from, setFrom] = useState(year - 25);
  useEffect(() => setFrom(year - 25), [coreY, year]);
  const y0 = from;
  const y1 = maxY;
  const [tip, setTip] = useState<Tip | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const W = 1000;
  const G = 176; // the column the rows are named in
  const R = 12;
  const x = (y: number) => G + ((y - y0) / (y1 - y0)) * (W - G - R);
  const xd = (d: string) => x(yearOf(d) + (Date.parse(`${d}T00:00:00Z`) - Date.parse(`${d.slice(0, 4)}-01-01T00:00:00Z`)) / (365.25 * 864e5));
  const xs = (s: string) => (s.length > 4 ? xd(s) : x(yearOf(s)));
  const spanY = y1 - y0;
  // About a dozen years labelled, whatever the period.
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => spanY / s <= 12) ?? 1000;
  const ticks: number[] = [];
  for (let t = Math.ceil(y0 / step) * step; t <= y1; t += step) ticks.push(t);

  /* The card by the pointer, placed in the timeline's box. */
  const show = (e: React.MouseEvent, title: string, lines: string[]) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title, lines: lines.filter(Boolean) });
  };
  const hover = (title: string, lines: string[]) => ({
    onMouseMove: (e: React.MouseEvent) => show(e, title, lines),
    onMouseLeave: () => setTip(null),
  });

  /* Terms on lines of their own where they overlap, so none is hidden under another. */
  const lanes = (role: Leader["role"]) => {
    const ends: number[] = [];
    return leaders
      .filter((l) => l.role === role)
      .map((l) => {
        const a = xs(l.from);
        const b = l.to ? (l.to.length > 4 ? xd(l.to) : x(yearOf(l.to) + 1)) : l.now ? xd(today) : a;
        let lane = ends.findIndex((end) => end <= a - 1);
        if (lane < 0) lane = ends.push(b) - 1;
        else ends[lane] = b;
        return { l, a, b, lane };
      });
  };
  const electionRows = [
    { key: "presidential", label: "Presidential elections", kinds: ["Presidential"] },
    { key: "legislative", label: "Legislative & general", kinds: ["Legislative", "General"] },
    { key: "referendum", label: "Referendums", kinds: ["Referendum"] },
    { key: "conclave", label: "Papal conclaves", kinds: ["Conclave"] },
  ].filter((r) => data.elections.some((e) => r.kinds.includes(e.kind)));

  /* The governments' leaning, as the compass reads it too. */
  const spans = leanSpans(data, today);
  const freedoms = FREEDOMS.filter((fr) => data.indices?.[fr.key]);
  /* The year under the pointer, from where it is across the timeline. */
  const yearAtPointer = (e: React.MouseEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return null;
    const sx = ((e.clientX - r.left) / r.width) * W;
    return Math.round(y0 + ((sx - G) / (W - G - R)) * (y1 - y0) - 0.5);
  };

  const rows: Row[] = [
    {
      key: "regime",
      label: "Regime",
      source: "V-Dem",
      height: 26,
      draw: (top) =>
        data.regimes.map(([a, b, type]) => {
          const left = Math.max(x(a), G);
          const w = x(b + 1) - left;
          if (w <= 0) return null;
          return (
            <g key={a} {...hover(REGIME_TYPES[type].name, [`${a} to ${b}`, REGIME_TYPES[type].said, "V-Dem, Regimes of the World"])}>
              <rect x={left} y={top + 4} width={w} height={18} rx={Math.min(9, w / 2)} fill={regimeInk(type)} fillOpacity={0.8} />
              {w > REGIME_TYPES[type].name.length * 5.6 + 8 && (
                <text x={left + 4} y={top + 16.5} fontSize={9.5} className="fill-white" fontFamily="ui-sans-serif, sans-serif" pointerEvents="none">
                  {REGIME_TYPES[type].name}
                </text>
              )}
            </g>
          );
        }),
    },
    {
      key: "turning",
      label: "Turning points",
      source: "site's record of events",
      height: 20,
      draw: (top) =>
        turning
          .filter((tp) => tp.y >= y0)
          .map((tp, i) => {
            const cx = x(tp.y + 0.5);
            return (
              <path
                key={`tp-${i}`}
                d={`M${cx},${top + 4} l5,6 l-5,6 l-5,-6 z`}
                className="fill-foreground"
                fillOpacity={tp.abroad ? 0.35 : 0.8}
                {...hover(tp.title, [`${tp.when ?? tp.y}`, `${tp.kind}${tp.abroad ? ", taken part in abroad" : ""}`, tp.desc ?? "", tp.sources.map((s) => s[0]).join(", ")])}
              />
            );
          }),
    },
    ...electionRows.map((er) => ({
      key: er.key,
      label: er.label,
      source: data.elections.some((e) => e.parlgovOnly) ? "Wikidata, ParlGov" : "Wikidata",
      height: 20,
      draw: (top: number) => (
        <>
          <line x1={G} x2={W - R} y1={top + 10} y2={top + 10} className="stroke-border" strokeWidth={0.8} />
          {data.elections
            .filter((e) => er.kinds.includes(e.kind) && yearOf(e.date) >= y0)
            .map((e, i) => {
              const coming = e.date > today;
              const top3 = (e.results?.parties ?? []).slice(0, 3).map(([p, v, s]) => `${p}${v !== null ? ` ${v.toFixed(1)}%` : ""}${s !== null ? `, ${s} seats` : ""}`);
              return (
                <circle
                  key={`${e.date}-${i}`}
                  cx={xd(e.date)}
                  cy={top + 10}
                  r={4.2}
                  fill={coming ? "none" : KIND_INK[e.kind]}
                  stroke={KIND_INK[e.kind]}
                  strokeWidth={1.5}
                  fillOpacity={0.9}
                  {...hover(e.name, [
                    `${day(e.date)}${coming ? " · still to come" : ""}`,
                    e.kind,
                    e.winners ? `Successful, as Wikidata records it: ${e.winners.slice(0, 4).map((w) => stoodSaid(w, e.stood?.[w])).join(", ")}${e.winners.length > 4 ? ` and ${e.winners.length - 4} more` : ""}` : "",
                    ...top3,
                    e.parlgovOnly ? "ParlGov" : `Wikidata${e.results ? "; results ParlGov" : ""}`,
                  ])}
                />
              );
            })}
        </>
      ),
    })),
    ...(["pope", "state", "government"] as const)
      .filter((role) => leaders.some((l) => l.role === role))
      .map((role) => {
        const terms = lanes(role);
        const n = Math.max(1, ...terms.map((t) => t.lane + 1));
        return {
          key: role,
          label: role === "pope" ? "Popes" : role === "state" ? "Heads of state" : "Heads of government",
          source: role === "pope" ? "Wikidata, pope & conclave" : "Wikidata, two records",
          height: 6 + n * 14,
          draw: (top: number) =>
            terms
              .filter((t) => t.b >= G)
              .map(({ l, a, b, lane }, i) => {
                const left = Math.max(a, G);
                const w = Math.max(3, b - left);
                const yy = top + 4 + lane * 14;
                return (
                  <g key={`${role}-${i}`} {...hover(l.name, [ROLE[l.role], termOf(l), l.role === "pope" ? "Wikidata: the pope's own record and the conclave that elected him agree on the year it began" : "Wikidata: the country's record and the person's agree"])}>
                    <rect x={left} y={yy} width={w} height={11} rx={Math.min(5.5, w / 2)} className="fill-foreground" fillOpacity={l.to || l.now ? (i % 2 ? 0.42 : 0.62) : 0.3} />
                    {w > l.name.length * 5.1 + 6 && (
                      <text x={left + 3} y={yy + 8.5} fontSize={8.5} className="fill-background" fontFamily="ui-sans-serif, sans-serif" pointerEvents="none">
                        {l.name}
                      </text>
                    )}
                  </g>
                );
              }),
        };
      }),
    ...(freedoms.length
      ? [
          {
            key: "freedoms",
            label: "Freedoms",
            source: "V-Dem, 0 to 1",
            height: 44,
            draw: (top: number) => (
              <g
                onMouseMove={(e) => {
                  const y = yearAtPointer(e);
                  if (y === null) return;
                  show(e, `${y}`, [...freedoms.map((fr) => `${fr.name}: ${indexAt(data.indices![fr.key], y)?.toFixed(3) ?? "none"}`), "V-Dem's indices, 0 (none) to 1 (fullest)"]);
                }}
                onMouseLeave={() => setTip(null)}
              >
                <rect x={G} y={top} width={W - G - R} height={44} fill="transparent" />
                {[0, 0.5, 1].map((v) => (
                  <line key={v} x1={G} x2={W - R} y1={top + 40 - v * 36} y2={top + 40 - v * 36} className="stroke-border" strokeOpacity={0.5} strokeWidth={0.5} strokeDasharray={v === 0.5 ? "2 3" : undefined} />
                ))}
                {freedoms.map((fr) => {
                  const s = data.indices![fr.key]!;
                  const first = s[0] as number;
                  const pts: string[] = [];
                  const parts: string[] = [];
                  for (let i = 1; i < s.length; i++) {
                    const y = first + i - 1;
                    const v = s[i];
                    if (y < y0 || v === null) {
                      if (pts.length) parts.push(pts.splice(0).join(" "));
                      continue;
                    }
                    pts.push(`${x(y + 0.5).toFixed(1)},${(top + 40 - v * 36).toFixed(1)}`);
                  }
                  if (pts.length) parts.push(pts.join(" "));
                  return parts.map((p, i) => <polyline key={`${fr.key}-${i}`} points={p} fill="none" stroke={fr.ink} strokeWidth={1.4} strokeLinejoin="round" pointerEvents="none" />);
                })}
              </g>
            ),
          },
        ]
      : []),
    ...(spans.length
      ? [
          {
            key: "leaning",
            label: "Government's leaning",
            source: [...new Set(spans.map((s) => s.source))].length > 1 ? "ParlGov, then Wikidata" : spans[0].source === "ParlGov" ? "ParlGov, PM's party 0–10" : "Wikidata, head's party",
            height: 40,
            draw: (top: number) => {
              // Left (-1) at the foot, right (1) at the head.
              const yOf = (across: number) => top + 34 - ((across + 1) / 2) * 28;
              return (
                <>
                  <text x={G - 4} y={top + 10} textAnchor="end" fontSize={7.5} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">right</text>
                  <text x={G - 4} y={top + 37} textAnchor="end" fontSize={7.5} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">left</text>
                  <line x1={G} x2={W - R} y1={yOf(0)} y2={yOf(0)} className="stroke-border" strokeOpacity={0.6} strokeDasharray="2 3" strokeWidth={0.6} />
                  {spans.map((s, i) => {
                    const a = xd(s.from);
                    const b = xd(s.to);
                    const yy = yOf(s.across);
                    return (
                      <g
                        key={`${s.from}-${i}`}
                        {...hover(s.who, [
                          `${day(s.from)} to ${s.open ? "now or its end" : day(s.to)}`,
                          s.lean,
                          s.source === "ParlGov" ? "ParlGov: the prime minister's party, from experts' surveys" : "Wikidata: the party at the start of the term, and its political alignment",
                        ])}
                      >
                        <line x1={a} x2={Math.max(a + 2, b)} y1={yy} y2={yy} className="stroke-foreground" strokeWidth={2.4} strokeOpacity={0.75} strokeLinecap="round" />
                        <circle cx={a} cy={yy} r={2.2} className="fill-foreground" />
                      </g>
                    );
                  })}
                </>
              );
            },
          },
        ]
      : []),
    ...(data.cabinets.length
      ? [
          {
            key: "cabinets",
            label: "Governments",
            source: "ParlGov",
            height: 20,
            draw: (top: number) =>
              data.cabinets
                .filter((c) => yearOf(c.start) >= y0)
                .map((c, i) => (
                  <line
                    key={`${c.start}-${i}`}
                    x1={xd(c.start)}
                    x2={xd(c.start)}
                    y1={top + 3}
                    y2={top + 17}
                    className="stroke-foreground"
                    strokeOpacity={0.65}
                    strokeWidth={1.6}
                    {...hover(`${c.name} cabinet`, [day(c.start), c.caretaker ? "Caretaker" : "", c.parties.join(", "), c.pmParty ? `Prime minister's party: ${c.pmParty}` : "", "ParlGov"])}
                  />
                )),
          },
        ]
      : []),
  ];
  const tops: number[] = [];
  let h = 8;
  for (const r of rows) {
    tops.push(h);
    h += r.height + 6;
  }
  const axis = h + 4;
  const H = axis + 22;

  /* The whole of it, for a reader's own work: one row a thing, with its source and its link. */
  const download = () => {
    const out: CsvCell[][] = [];
    for (const [a, b, type] of data.regimes) out.push(["regime", a, b, REGIME_TYPES[type].name, REGIME_TYPES[type].said, "V-Dem, Regimes of the World (via Our World in Data)", "https://ourworldindata.org/grapher/political-regime"]);
    for (const tp of turning) out.push(["turning point", tp.when ?? tp.y, "", tp.title, `${tp.kind}${tp.abroad ? ", taken part in abroad" : ""}`, tp.sources.map((s) => s[0]).join("; "), tp.sources[0]?.[1]]);
    for (const e of data.elections)
      out.push([
        `${e.kind.toLowerCase()} election`,
        e.date,
        "",
        e.name,
        [e.winners ? `successful (Wikidata): ${e.winners.map((w) => stoodSaid(w, e.stood?.[w])).join("; ")}` : "", ...(e.results?.parties ?? []).map(([p, v, s, lr]) => `${p}: ${v ?? "-"}% ${s ?? "-"} seats${lr != null ? `, left-right ${lr}` : ""}`)].filter(Boolean).join(" | "),
        e.parlgovOnly ? "ParlGov" : `Wikidata${e.results ? "; ParlGov" : ""}`,
        e.id ? `https://www.wikidata.org/wiki/${e.id}` : "https://doi.org/10.7910/DVN/2VZ5ZC",
      ]);
    for (const l of leaders) out.push([l.role === "pope" ? "pope" : l.role === "state" ? "head of state" : "head of government", l.from, l.to ?? (l.now ? "now" : ""), l.name, [l.end ? `end ${l.end}` : "", l.party ? `party: ${l.party}${l.align ? ` (${l.align})` : ""}` : ""].filter(Boolean).join(" | "), "Wikidata (two records agreeing)", `https://www.wikidata.org/wiki/${l.id}`]);
    for (const c of data.cabinets) out.push(["government", c.start, "", c.name, [c.caretaker ? "caretaker" : "", c.parties.join("; "), c.pmParty ? `PM's party: ${c.pmParty}${c.pmLeftRight != null ? ` (${c.pmLeftRight} on ParlGov's 0-10 left-right scale)` : ""}` : ""].filter(Boolean).join(" | "), "ParlGov", "https://doi.org/10.7910/DVN/2VZ5ZC"]);
    for (const fr of FREEDOMS) {
      const s = data.indices?.[fr.key];
      if (!s) continue;
      for (let i = 1; i < s.length; i++) if (s[i] !== null) out.push([`${fr.name.toLowerCase()} index`, (s[0] as number) + i - 1, "", fr.name, String(s[i]), "V-Dem, via Our World in Data", "https://ourworldindata.org/grapher/human-rights-index-vdem"]);
    }
    // Through the site's one CSV writer, as every chart's is.
    downloadCsv(`${data.cc}-political-history-${today}.csv`, ["type", "start", "end", "name", "detail", "source", "link"], out);
  };

  return (
    <>
    <section className="modal-tile rounded-xl px-4 py-3 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex-1 min-w-[12rem]">
          The timeline · {y0 < 0 ? `−${-y0}` : y0} to {y1}
        </p>
        {presets.length > 1 &&
          presets.map(([label, y]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFrom(y)}
              aria-pressed={y0 === y}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${y0 === y ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        <button type="button" onClick={download} className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground hover:text-foreground cursor-pointer" title="Every row of the timeline, with its source and link, as a spreadsheet">
          Download CSV
        </button>
      </div>
      <div ref={box} className="relative" onMouseLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${country}'s timeline from ${y0} to ${y1}: ${rows.map((r) => r.label.toLowerCase()).join(", ")}`}>
          <defs>
            <clipPath id="timeline-plot">
              <rect x={G} y={0} width={W - G - R + 6} height={H} />
            </clipPath>
          </defs>
          {/* Each row on a faint band of its own, named with its source in the column at the left. */}
          {rows.map((r, i) => (
            <g key={r.key}>
              {i % 2 === 0 && <rect x={0} y={tops[i] - 3} width={W} height={r.height + 6} className="fill-foreground" fillOpacity={0.025} />}
              <text x={4} y={tops[i] + Math.min(r.height, 22) / 2 + 2} fontSize={10.5} className="fill-foreground" fontFamily="ui-sans-serif, sans-serif">
                {r.label}
              </text>
              <text x={4} y={tops[i] + Math.min(r.height, 22) / 2 + 13} fontSize={8} className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
                {r.source}
              </text>
            </g>
          ))}
          {/* The years: a line under every row at each, and the axis. */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={4} y2={axis} className="stroke-border" strokeOpacity={0.6} strokeWidth={0.6} />
              {Math.abs(x(t) - xd(today)) > 34 && (
                <text x={x(t)} y={axis + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={9.5} fontFamily="ui-monospace, monospace">
                  {t < 0 ? `−${-t}` : t}
                </text>
              )}
            </g>
          ))}
          <line x1={G} x2={W - R} y1={axis} y2={axis} className="stroke-border" />
          <g clipPath="url(#timeline-plot)">{rows.map((r, i) => <g key={r.key}>{r.draw(tops[i])}</g>)}</g>
          {/* Today. */}
          <line x1={xd(today)} x2={xd(today)} y1={4} y2={axis} className="stroke-foreground" strokeDasharray="3 3" strokeOpacity={0.55} />
          <text x={xd(today) - 3} y={axis + 14} textAnchor="end" className="fill-foreground" fontSize={8.5} fontFamily="ui-monospace, monospace">
            today
          </text>
        </svg>
        {tip && <TipCard tip={tip} room={box.current?.clientWidth ?? 600} />}
      </div>
      {/* The key, and how to cite it. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
        {REGIME_TYPES.map((r, i) => (
          <span key={r.name} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground" title={r.said}>
            <span className="inline-block w-2 h-2 min-w-2 min-h-2 aspect-square rounded-full shrink-0" style={{ background: regimeInk(i), opacity: 0.85 }} aria-hidden />
            {r.name}
          </span>
        ))}
        {(Object.keys(KIND_INK) as (keyof typeof KIND_INK)[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground">
            <span className="inline-block w-2 h-2 min-w-2 min-h-2 aspect-square rounded-full shrink-0" style={{ background: KIND_INK[k] }} aria-hidden />
            {k}
          </span>
        ))}
        {freedoms.map((fr) => (
          <span key={fr.key} className="inline-flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground">
            <span className="inline-block w-2 h-2 min-w-2 min-h-2 aspect-square rounded-full shrink-0" style={{ background: fr.ink }} aria-hidden />
            {fr.name}
          </span>
        ))}
        <span className="text-[10px] font-sans text-muted-foreground">hollow: still to come · faint bar: end not agreed · faint diamond: taken part in abroad</span>
      </div>
      <p className="text-[10px] font-sans text-muted-foreground mt-1.5 leading-snug">
        Point at anything for its details and source. To cite: CommonSphere, "Polls & Elections: {country}", read {day(today)} - from V-Dem's Regimes of the World, Wikidata, ParlGov and the records of events each row
        names.
      </p>
    </section>
    {/* The political compass, as asked: where the country stood in each year of the period chosen above. */}
    <Compass data={data} from={y0} to={Math.min(year, y1)} country={country} today={today} />
    </>
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
          const moved = FREEDOMS.flatMap((fr) => {
            const a = indexAt(data.indices?.[fr.key], from);
            const b = indexAt(data.indices?.[fr.key], to);
            return a !== null && b !== null ? [`${fr.name.toLowerCase()} ${a.toFixed(2)} → ${b.toFixed(2)}`] : [];
          });
          const leanings = inOffice
            .filter((l) => l.role === "government" && l.align)
            .reverse()
            .reduce<string[]>((acc, l) => (acc[acc.length - 1] === l.align ? acc : [...acc, l.align!]), []);
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
              {(moved.length > 0 || leanings.length > 0) && (
                <p className="text-[10px] font-sans text-muted-foreground mt-1 leading-snug">
                  {moved.length > 0 && <>From {from} to {to}, V-Dem's indices: {moved.join("; ")}. </>}
                  {leanings.length > 0 && <>Its heads of government's parties, in turn: {leanings.slice(-5).join(" → ")} (Wikidata).</>}
                </p>
              )}
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
                          <span className="text-muted-foreground"> · {l.role === "pope" ? "pope" : l.role === "state" ? "state" : "government"} · {termOf(l)}</span>
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
            // Its record, and every source it is from, said when it is pointed at.
            <a href={tp.sources[0][1]} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" title={`From ${tp.sources.map((s) => s[0]).join(", ")}`}>
              {tp.title}
            </a>
          ) : (
            <b>{tp.title}</b>
          )}
          {tp.when && tp.when !== String(tp.y) ? <span className="text-muted-foreground"> · {tp.when}</span> : null}
          {/* What it was, in a line, as asked: its record's own short description (Wikidata), in place of the names of its sources. */}
          {tp.desc ? <span className="text-muted-foreground"> - {tp.desc.charAt(0).toUpperCase() + tp.desc.slice(1)}</span> : null}
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
          {el.winners && <span> · successful, as Wikidata records it: {el.winners.map((w) => stoodSaid(w, el.stood?.[w])).join(", ")}</span>}
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
              <th className="text-right font-normal pr-4">Seats{el.results?.seats ? ` of ${el.results.seats}` : ""}</th>
              <th className="text-right font-normal" title="ParlGov's place for the party, from 0 (left) to 10 (right), from expert surveys">Left–right (0–10)</th>
            </tr>
          </thead>
          <tbody>
            {parties.map(([p, v, s, lr]) => (
              <tr key={p}>
                <td className="pr-4 font-sans">{p}</td>
                <td className="text-right pr-4">{v === null ? "-" : `${v.toFixed(1)}%`}</td>
                <td className="text-right pr-4">{s === null ? "-" : s}</td>
                <td className="text-right">{lr == null ? "-" : lr.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
