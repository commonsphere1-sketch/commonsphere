/**
 * The States page's explorer of elected officials: the senators, the
 * representatives, the governors and the mayors of the fifty largest cities,
 * a list beside a detail pane - the card the World Leaders page has for its
 * politicians, in the same pieces (DataExplorer).
 *
 * Every row is read from stateOffices.ts (build-state-offices.cjs): the
 * members of Congress and their terms from the congress-legislators data,
 * the governors from Wikipedia's list of current governors, which cites the
 * National Governors Association, and the mayors from Wikipedia's list of the
 * mayors of the fifty largest cities. Nothing is typed in here.
 *
 * The list is by office, each row the person, the place and the party; it is
 * searched by name, state, city, district or party, and narrowed by office
 * from the counts over it or by party. The detail is the office at a glance -
 * the party, when the term began or ends, the seat's class or district, the
 * city's size and form of government - with the member's own site, the rest
 * of the state's officials, and the state's window a click away. A count is
 * the only thing worked out, and the pane says what of.
 */
import { useMemo, useState, type ReactNode } from "react";
import { ArrowSquareOut, MagnifyingGlass, UsersThree, X } from "@phosphor-icons/react";
import { BIG_CITY_MAYORS, STATE_OFFICES, STATE_OFFICES_SOURCES } from "../data/stateOffices";
import { usStatesData } from "../data/statesData";
import { Block, Empty, GoButton, Kpi, Label, Row, useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Kind = "senator" | "representative" | "governor" | "mayor";
interface Official {
  id: string;
  kind: Kind;
  name: string;
  party: string;
  /** The state's id, or null for a mayor of a city in none of the fifty. */
  state: string | null;
  stateName: string;
  /** What the person holds, in full: "Senator for Ohio", "Mayor of Chicago". */
  office: string;
  /** The place as the list writes it: "Ohio", "Ohio · district 3", "Chicago, Illinois". */
  place: string;
  /** The day a governor or a mayor took office. */
  since?: string;
  /** The end of the term: a day for a member of Congress, the list's own words for a governor. */
  termEnds?: string;
  url?: string;
  facts: [label: string, value: string][];
}

const KINDS: { id: Kind; label: string; one: string; color: string }[] = [
  { id: "senator", label: "Senators", one: "Senator", color: "#6366f1" },
  { id: "representative", label: "Representatives", one: "Representative", color: "#0ea5e9" },
  { id: "governor", label: "Governors", one: "Governor", color: "#f59e0b" },
  { id: "mayor", label: "Mayors", one: "Mayor", color: "#10b981" },
];
const PARTY_COLOR: Record<string, string> = { Democrat: "#3b82f6", Republican: "#ef4444", Independent: "#94a3b8" };
const partyColor = (p: string) => PARTY_COLOR[p] ?? "#94a3b8";
const ACCENT = "#6366f1";
/** How many rows of each office are drawn while nothing narrows the list: picking the office, a party or searching shows them all. */
const SHOWN = 25;

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const whole = (n: number) => n.toLocaleString("en-US");
/** A Senate class in words: which of the three election cycles the seat is in. */
const CLASS_NOTE: Record<number, string> = { 1: "Class 1", 2: "Class 2", 3: "Class 3" };

/** Every official the page holds, in the order the offices are listed: senators, representatives, governors, mayors. */
const OFFICIALS: Official[] = (() => {
  const out: Official[] = [];
  const states = usStatesData.flatMap((s) => (STATE_OFFICES[s.id] ? [{ s, o: STATE_OFFICES[s.id] }] : []));
  for (const { s, o } of states)
    for (const p of o.senators)
      out.push({
        id: `sen-${s.id}-${p.name}`,
        kind: "senator",
        name: p.name,
        party: p.party,
        state: s.id,
        stateName: s.name,
        office: `Senator for ${s.name}`,
        place: s.name,
        termEnds: p.termEnd,
        url: p.url,
        facts: [
          ["Seat", `${CLASS_NOTE[p.class]} · one of ${s.name}'s two`],
          ["Term ends", day(p.termEnd)],
        ],
      });
  for (const { s, o } of states)
    for (const p of o.representatives)
      out.push({
        id: `rep-${s.id}-${p.district}-${p.name}`,
        kind: "representative",
        name: p.name,
        party: p.party,
        state: s.id,
        stateName: s.name,
        office: `Representative for ${s.name}${p.district === "At Large" ? ", at large" : `, district ${p.district}`}`,
        place: `${s.name} · ${p.district === "At Large" ? "at large" : `district ${p.district}`}`,
        termEnds: p.termEnd,
        url: p.url,
        facts: [
          ["District", p.district === "At Large" ? "At large: the whole state" : `${p.district} of ${o.representatives.length}`],
          ["Term ends", day(p.termEnd)],
        ],
      });
  for (const { s, o } of states)
    out.push({
      id: `gov-${s.id}`,
      kind: "governor",
      name: o.governor.name,
      party: o.governor.party,
      state: s.id,
      stateName: s.name,
      office: `Governor of ${s.name}`,
      place: s.name,
      since: o.governor.since,
      termEnds: o.governor.termEnds,
      url: o.governor.nga,
      facts: [
        ["In office since", day(o.governor.since)],
        ["Term ends", o.governor.termEnds],
      ],
    });
  for (const m of BIG_CITY_MAYORS)
    out.push({
      id: `mayor-${m.rank}`,
      kind: "mayor",
      name: m.name,
      party: m.party,
      state: m.state,
      stateName: m.stateName,
      office: `Mayor of ${m.city}`,
      place: `${m.city}, ${m.stateName}`,
      since: m.since,
      termEnds: m.nextElection ? `next election ${m.nextElection}` : undefined,
      facts: [
        ["City", `${m.city} · ${whole(m.population)} people · ${m.rank === 1 ? "the largest" : `${m.rank}${["th", "st", "nd", "rd"][m.rank % 100 > 10 && m.rank % 100 < 14 ? 0 : m.rank % 10] ?? "th"} largest`} US city`],
        ["In office since", day(m.since)],
        ...(m.nextElection ? ([["Next election", String(m.nextElection)]] as [string, string][]) : []),
        ...(m.form ? ([["Form of government", m.form]] as [string, string][]) : []),
        ["Ballot", m.nonpartisan ? `Nonpartisan in law; ${m.party} is the party the list gives` : "Partisan"],
      ],
    });
  return out;
})();

function Fact({ t, label, value }: { t: Tokens; label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
      <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
        {label}
      </span>
      <span className="text-[11px] font-sans font-semibold text-right min-w-0" style={{ color: t.headText }}>
        {value}
      </span>
    </div>
  );
}

export function OfficialsExplorer({ onOpenState }: { /** Opens a state's window. */ onOpenState: (stateId: string) => void }) {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [party, setParty] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const q = search.trim().toLowerCase();
  const list = useMemo(
    () => OFFICIALS.filter((x) => (!kind || x.kind === kind) && (!party || x.party === party) && (!q || [x.name, x.place, x.office, x.party].some((s) => s.toLowerCase().includes(q)))),
    [q, kind, party],
  );
  const shown = (pickedId ? OFFICIALS.find((x) => x.id === pickedId) : null) ?? list[0] ?? null;
  const parties = useMemo(() => [...new Set(OFFICIALS.map((x) => x.party))].sort((a, b) => OFFICIALS.filter((x) => x.party === b).length - OFFICIALS.filter((x) => x.party === a).length), []);
  // Each office's rows. With nothing narrowing the list, each office shows its first SHOWN and says so.
  const narrowed = !!kind || !!party || !!q;
  const groups = KINDS.map((k) => {
    const rows = list.filter((x) => x.kind === k.id);
    return { k, rows, drawn: narrowed ? rows : rows.slice(0, SHOWN) };
  }).filter((g) => g.rows.length > 0);

  return (
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full max-w-6xl mx-auto mb-6" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: ACCENT }}>
        <UsersThree size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Elected officials</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {OFFICIALS.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search elected officials"
          placeholder="Search names, states, cities, districts, parties…"
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      {/* List beside detail; stacked on a phone */}
      <div className="explorer-panes flex flex-col md:flex-row md:h-[520px]">
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[320px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          {/* How many of each office are held: pick one to see only those. */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-3">
            {KINDS.map((k) => {
              const on = kind === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setKind(on ? null : k.id);
                    setPickedId(null);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: on ? k.color + "22" : t.tile, border: `1px solid ${on ? k.color + "88" : t.gridLine}` }}
                >
                  <span className="block text-sm font-bold font-mono" style={{ color: k.color }}>
                    {OFFICIALS.filter((x) => x.kind === k.id).length}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {k.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* By party, counted over the offices picked. */}
          <div className="flex flex-wrap gap-1.5 px-4 pt-2" role="group" aria-label="Party">
            {parties.map((p) => {
              const on = party === p;
              const n = OFFICIALS.filter((x) => x.party === p && (!kind || x.kind === kind)).length;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setParty(on ? null : p);
                    setPickedId(null);
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-sans font-semibold px-2 py-1 rounded-full cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: on ? partyColor(p) + "22" : t.tile, border: `1px solid ${on ? partyColor(p) + "88" : t.gridLine}`, color: t.headText }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: partyColor(p) }} aria-hidden />
                  {p} · {n}
                </button>
              );
            })}
          </div>
          <p className="px-4 pt-2 text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
            Seats as they are held now: a vacant seat is not listed. Pick an office or a party to see only those.
          </p>
          {groups.map((g) => (
            <div key={g.k.id} className="flex flex-col">
              <div className="px-4 pt-3 pb-1">
                <Label t={t}>
                  {g.k.label} · {g.rows.length}
                  {g.drawn.length < g.rows.length ? ` · the first ${g.drawn.length} shown; pick the office or search to see all` : ""}
                </Label>
              </div>
              {g.drawn.map((x) => (
                <Row key={x.id} t={t} selected={shown?.id === x.id} color={g.k.color} onClick={() => setPickedId(x.id)}>
                  <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: partyColor(x.party) }} aria-hidden />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                      {x.name}
                    </span>
                    <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                      {x.place}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] font-mono font-bold" style={{ color: t.headText }}>
                      {x.party}
                    </span>
                    <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                      {g.k.one}
                    </span>
                  </span>
                </Row>
              ))}
            </div>
          ))}
          {list.length === 0 && <Empty t={t}>No official matches the search.</Empty>}
        </div>

        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {shown ? (
            (() => {
              const k = KINDS.find((x) => x.id === shown.kind)!;
              const beside = shown.state ? OFFICIALS.filter((x) => x.state === shown.state && x.id !== shown.id) : [];
              const count = (kd: Kind) => beside.filter((x) => x.kind === kd).length + (shown.kind === kd ? 1 : 0);
              const source = shown.kind === "governor" ? STATE_OFFICES_SOURCES.governors : shown.kind === "mayor" ? STATE_OFFICES_SOURCES.mayors : STATE_OFFICES_SOURCES.congress;
              return (
                <>
                  <Block>
                    <div className="min-w-0">
                      <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: k.color }}>
                        {k.one}
                      </p>
                      <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                        {shown.name}
                      </p>
                      <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                        {shown.office}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full mt-1.5" style={{ background: partyColor(shown.party) + "22", color: t.headText }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: partyColor(shown.party) }} aria-hidden />
                        {shown.party}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {shown.facts.map(([label, value]) => (
                        <Fact key={label} t={t} label={label} value={value} />
                      ))}
                    </div>
                    {shown.url && (
                      <a href={shown.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold font-sans hover:opacity-70 transition-opacity" style={{ color: k.color }}>
                        {shown.kind === "governor" ? "The National Governors Association's page" : "The member's own site"} <ArrowSquareOut size={11} aria-hidden />
                      </a>
                    )}
                  </Block>

                  {shown.state && (
                    <Block>
                      <Label t={t}>{shown.stateName}'s officials here</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {KINDS.map((x) => (
                          <Kpi key={x.id} t={t} label={x.label} value={String(count(x.id))} color={t.headText} sub={x.id === "mayor" ? "of the 50 largest cities" : undefined} />
                        ))}
                      </div>
                      <div className="flex flex-col">
                        {beside
                          .filter((x) => x.kind !== "representative" || shown.kind === "representative")
                          .slice(0, 12)
                          .map((x) => (
                            <button
                              key={x.id}
                              type="button"
                              onClick={() => setPickedId(x.id)}
                              className="flex items-baseline justify-between gap-3 py-1.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ borderBottom: `1px solid ${t.gridLine}` }}
                            >
                              <span className="text-[11px] font-sans font-semibold min-w-0" style={{ color: t.headText }}>
                                {x.name}
                                <span className="font-normal" style={{ color: t.mutedText }}>
                                  {" "}
                                  · {x.office}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: partyColor(x.party) }} aria-hidden />
                                {x.party}
                              </span>
                            </button>
                          ))}
                      </div>
                    </Block>
                  )}

                  <SourceLink sources={[source]} />
                  {shown.state && (
                    <GoButton color={ACCENT} onClick={() => onOpenState(shown.state!)}>
                      Open {shown.stateName}'s window
                    </GoButton>
                  )}
                </>
              );
            })()
          ) : (
            <Empty t={t}>No official to show.</Empty>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {OFFICIALS.length} officials · members of Congress, governors and mayors as read on {STATE_OFFICES_SOURCES.retrieved}
        </span>
      </div>
    </div>
  );
}

export default OfficialsExplorer;
