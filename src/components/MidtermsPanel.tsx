/**
 * The 2026 midterms on the United States map, as asked (elections2026.ts): each state in the colour of the party leading
 * its count for the race chosen - the Senate, governor, or the House by the party leading most of its districts - and under
 * the map each state's count: who leads, by how much, how much of the count is in, and whether the seat would change party
 * if the count holds.
 *
 * Every count is the state's own, from its official results site, unofficial until it certifies. No race is called here.
 * The shares and margins are worked out from the state's votes, and said to be. A state with a race not yet read here,
 * or whose site refuses a program, is named so.
 */
import { useMemo, useState } from "react";
import { usStatesData } from "../data/statesData";
import type { Outline } from "../lib/outlines";
import { OTHER_INK, PARTY_NAME, RACES_2026, holderOf, partyInk, type Contest, type Midterms, type Office } from "../lib/elections2026";

type Tokens = { headText: string; mutedText: string; gridLine: string };

const NAME_OF = new Map(usStatesData.map((s) => [s.abbreviation, s.name]));
const CODE_OF = new Map(usStatesData.map((s) => [s.name, s.abbreviation]));
CODE_OF.set("District of Columbia", "DC");
const OFFICES: [Office, string][] = [
  ["senate", "Senate"],
  ["governor", "Governor"],
  ["house", "House"],
];

const total = (c: Contest) => c.cands.reduce((a, x) => a + x[2], 0);
const lead = (c: Contest) => (total(c) > 0 ? c.cands[0] : null);
const pct = (v: number, of: number) => (of ? `${((100 * v) / of).toFixed(1)}%` : "—");

/** The party a state is coloured by for a race: its leader's; for the House, the party leading most of its districts (a tie, neither). */
export function stateLead(data: Midterms | null | undefined, st: string, office: Office): string | null {
  const s = data?.states[st];
  if (!s) return null;
  const cs = s.contests.filter((c) => c.office === office);
  if (!cs.length) return null;
  if (office !== "house") return lead(cs[0])?.[1] ?? null;
  const n = new Map<string, number>();
  for (const c of cs) {
    const l = lead(c);
    if (l) n.set(l[1], (n.get(l[1]) ?? 0) + 1);
  }
  const top = [...n].sort((a, b) => b[1] - a[1]);
  return top.length && (top.length === 1 || top[0][1] > top[1][1]) ? top[0][0] : top.length ? "tie" : null;
}

/** The map's fill for a state's outline: its leading party's colour, where its count is held. */
export function midtermFill(data: Midterms | null | undefined, office: Office) {
  return (shape: Outline) => {
    const st = CODE_OF.get(shape.properties.n ?? "");
    const p = st ? stateLead(data, st, office) : null;
    return p ? (p === "tie" ? OTHER_INK : partyInk(p)) : undefined;
  };
}

export function MidtermsPanel({ t, data, office, onOffice }: { t: Tokens; data: Midterms | null | undefined; office: Office; onOffice: (o: Office) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const read = data ? Object.keys(data.states).sort() : [];
  const withRace = office === "house" ? usStatesData.map((s) => s.abbreviation) : RACES_2026[office];
  const shown = read.filter((st) => data!.states[st].contests.some((c) => c.office === office));
  const unread = withRace.filter((st) => !shown.includes(st));
  const tally = useMemo(() => {
    const n: Record<string, number> = {};
    for (const st of shown)
      for (const c of data!.states[st].contests.filter((x) => x.office === office)) {
        const l = lead(c);
        if (l) n[l[1]] = (n[l[1]] ?? 0) + 1;
      }
    return Object.entries(n).sort((a, b) => b[1] - a[1]);
  }, [data, office, shown.join()]);

  const chip = (on: boolean) => ({ borderColor: on ? t.headText : t.gridLine, color: on ? t.headText : t.mutedText });
  if (data === undefined) return <p className="text-[10px] font-mono uppercase tracking-widest mt-3" style={{ color: t.mutedText }}>Reading the states&apos; counts…</p>;
  if (data === null) return <p className="text-[11px] font-sans mt-3" style={{ color: t.mutedText }}>The states&apos; counts could not be read just now.</p>;

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Which race">
        {OFFICES.map(([o, label]) => (
          <button key={o} type="button" onClick={() => onOffice(o)} aria-pressed={office === o} className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer" style={chip(office === o)}>
            {label}
          </button>
        ))}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto">
          {[
            ["R", "Republican leads"],
            ["D", "Democratic leads"],
            ["O", "Another leads, or a tie"],
          ].map(([p, label]) => (
            <span key={p} className="inline-flex items-center gap-1 text-[10px] font-sans" style={{ color: t.mutedText }}>
              <span aria-hidden className="w-2.5 h-2.5 rounded-sm" style={{ background: p === "O" ? OTHER_INK : partyInk(p) }} />
              {label}
            </span>
          ))}
        </span>
      </div>

      <p className="text-[11px] font-sans leading-snug" style={{ color: t.headText }}>
        {office === "house" ? "House districts" : `${office === "senate" ? "Senate" : "Governor's"} races`} read from the states&apos; own sites: <span className="font-mono font-semibold">{shown.length}</span>
        {office === "house" ? " states" : ` of the ${withRace.length} this year`}
        {tally.length ? " · leading in them: " : ""}
        {tally.map(([p, n], i) => (
          <span key={p}>
            {i ? ", " : ""}
            <span className="font-mono font-semibold" style={{ color: partyInk(p) }}>
              {PARTY_NAME[p] ?? p} {n}
            </span>
          </span>
        ))}
      </p>

      <div>
        {shown.map((st) => {
          const s = data.states[st];
          const cs = s.contests.filter((c) => c.office === office);
          const isOpen = open === st || office !== "house";
          return (
            <div key={st} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
              {office === "house" && (
                <button type="button" onClick={() => setOpen((o) => (o === st ? null : st))} aria-expanded={open === st} className="w-full flex items-baseline justify-between gap-3 text-left cursor-pointer">
                  <span className="text-[12px] font-semibold font-sans" style={{ color: t.headText }}>
                    {NAME_OF.get(st) ?? st} · {cs.length} districts
                  </span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                    {Object.entries(cs.reduce<Record<string, number>>((a, c) => (lead(c) ? { ...a, [lead(c)![1]]: (a[lead(c)![1]] ?? 0) + 1 } : a), {}))
                      .sort((a, b) => b[1] - a[1])
                      .map(([p, n]) => `${p} ${n}`)
                      .join(" · ")}{" "}
                    leading {open === st ? "▴" : "▾"}
                  </span>
                </button>
              )}
              {isOpen &&
                cs.map((c) => {
                  const all = total(c);
                  const [first, second] = c.cands;
                  const held = holderOf(st, c);
                  const flips = first && all > 0 && held && held[1] !== first[1];
                  return (
                    <div key={`${c.office}${c.district ?? ""}${c.special ? "s" : ""}`} className={office === "house" ? "pl-3 pt-1.5" : ""}>
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] font-sans min-w-0" style={{ color: t.headText }}>
                          <span className="font-semibold">{office === "house" ? `District ${c.district}` : NAME_OF.get(st) ?? st}</span>
                          {c.special ? " · special election" : ""}
                          {first && all > 0 ? (
                            <>
                              {" · "}
                              <span aria-hidden className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: partyInk(first[1]) }} />
                              {first[0]} ({first[1]}) leads
                            </>
                          ) : (
                            " · no votes counted yet"
                          )}
                        </span>
                        <span className="text-[11px] font-mono font-semibold shrink-0" style={{ color: t.headText }}>
                          {first && all > 0 ? pct(first[2], all) : ""}
                        </span>
                      </p>
                      <p className="text-[10px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
                        {c.cands
                          .slice(0, 3)
                          .map(([n, p, v]) => `${n} (${p}) ${v.toLocaleString("en-US")}`)
                          .join(" · ")}
                        {first && second && all > 0 ? ` · margin ${(first[2] - second[2]).toLocaleString("en-US")} votes, ${pct(first[2] - second[2], all)}` : ""}
                        {c.reporting ? ` · ${c.reporting[0].toLocaleString("en-US")} of ${c.reporting[1].toLocaleString("en-US")} reporting` : ""}
                      </p>
                      {held && first && all > 0 && (
                        <p className="text-[10px] font-sans leading-snug" style={{ color: flips ? t.headText : t.mutedText }}>
                          {flips ? `A change of party if the count holds: held now by ${held[0]} (${held[1]}).` : `Held now by ${held[0]} (${held[1]}).`}
                        </p>
                      )}
                    </div>
                  );
                })}
              <p className="text-[10px] font-sans mt-1" style={{ color: t.mutedText }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  {s.source}
                </a>
                {` · read ${new Date(s.readAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}`}
                {s.live ? " · read again every five minutes while open" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {unread.length > 0 && (
        <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
          Not held here yet, their sites still to be read: {unread.filter((st) => !data.refused[st]).map((st) => NAME_OF.get(st) ?? st).join(", ")}.
          {unread.some((st) => data.refused[st]) ? ` Not held, their official sites refusing a program: ${unread.filter((st) => data.refused[st]).map((st) => NAME_OF.get(st) ?? st).join(", ")}.` : ""}
        </p>
      )}
      <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
        Each count is the state&apos;s own, from its official results site, and unofficial until the state certifies it; no race is called here, and a state is coloured only by who leads its count. Shares and margins are worked out here from the state&apos;s votes. Who holds a seat now is by the congress-legislators data and the governors&apos; list; those elected take office in January 2027.
      </p>
    </div>
  );
}
