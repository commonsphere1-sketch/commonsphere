/**
 * The 2026 midterms on the United States map, as asked (elections2026.ts): each state in the colour of the party that has
 * won its race for the Senate or governor - or, for the House, most of its districts - as news organisations have called
 * them, in full; or, where nothing is called, of the party leading the state's own count, lighter. Under the map each
 * state's race: the call, with whether the seat was held or gained, and the state's count beside it where it is read.
 *
 * A call is Wikipedia's record of the news organisations' calls, kept only where two of its articles agree, and linked
 * at the revision read. A count is the state's own, from its official results site, unofficial until it certifies.
 * Shares and margins are worked out here from the state's votes, and said to be.
 */
import { useMemo, useState } from "react";
import { usStatesData } from "../data/statesData";
import type { Outline } from "../lib/outlines";
import { OTHER_INK, RACES_2026, holderOf, partyInk, standingOf, type Contest, type Midterms, type Office } from "../lib/elections2026";

type Tokens = { headText: string; mutedText: string; gridLine: string };

const NAME_OF = new Map([...usStatesData.map((s) => [s.abbreviation, s.name] as const), ["DC", "District of Columbia"] as const]);
const CODE_OF = new Map([...usStatesData.map((s) => [s.name, s.abbreviation] as const), ["District of Columbia", "DC"] as const]);
const OFFICES: [Office, string][] = [
  ["senate", "Senate"],
  ["governor", "Governor"],
  ["house", "House"],
];
const total = (c: Contest) => c.cands.reduce((a, x) => a + x[2], 0);
const pct = (v: number, of: number) => (of ? `${((100 * v) / of).toFixed(1)}%` : "—");
const wiki = (title: string, rev?: number) => (rev ? `https://en.wikipedia.org/w/index.php?oldid=${rev}` : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`);

/** A state's House districts known here: called, or in its count. */
function districtsOf(data: Midterms | null | undefined, st: string): number[] {
  const called = Object.keys(data?.calls?.house[st] ?? {}).map(Number);
  const counted = (data?.states[st]?.contests ?? []).filter((c) => c.office === "house").map((c) => c.district!);
  return [...new Set([...called, ...counted])].sort((a, b) => a - b);
}

/** The party a state is coloured by for a race, and whether that is a call or only a lead in the count. */
export function stateLead(data: Midterms | null | undefined, st: string, office: Office): { party: string; called: boolean } | null {
  if (office !== "house") {
    const s = standingOf(data, st, office);
    return s.called ? { party: s.called.party, called: true } : s.lead ? { party: s.lead[1], called: false } : null;
  }
  const n = new Map<string, number>();
  let calls = 0;
  let known = 0;
  for (const d of districtsOf(data, st)) {
    const s = standingOf(data, st, "house", d);
    const p = s.called?.party ?? s.lead?.[1];
    if (!p) continue;
    known++;
    if (s.called) calls++;
    n.set(p, (n.get(p) ?? 0) + 1);
  }
  const top = [...n].sort((a, b) => b[1] - a[1]);
  if (!top.length) return null;
  return { party: top.length === 1 || top[0][1] > top[1][1] ? top[0][0] : "tie", called: calls === known };
}

/** The map's fill for a state's outline: the party's colour in full where called, lighter where it only leads the count. */
export function midtermFill(data: Midterms | null | undefined, office: Office) {
  return (shape: Outline) => {
    const st = CODE_OF.get(shape.properties.n ?? "");
    const l = st ? stateLead(data, st, office) : null;
    if (!l) return undefined;
    const ink = l.party === "tie" ? OTHER_INK : partyInk(l.party);
    return l.called ? ink : `${ink}80`;
  };
}

function CallLine({ t, data, st, office, district }: { t: Tokens; data: Midterms; st: string; office: Office; district?: number }) {
  const s = standingOf(data, st, office, district);
  if (!s.called) return null;
  const article = s.called.article ?? (office === "house" ? `2026 United States House of Representatives elections in ${NAME_OF.get(st)}` : "");
  return (
    <p className="text-[11px] font-sans leading-snug" style={{ color: t.headText }}>
      <span aria-hidden className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: partyInk(s.called.party) }} />
      Called for <span className="font-semibold">{s.called.winner}</span> ({s.called.party}){s.called.status ? ` · ${s.called.status}` : ""}
      <span style={{ color: t.mutedText }}>
        {" · "}
        <a href={wiki(article, data.calls?.revisions[article])} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
          per Wikipedia
        </a>
      </span>
    </p>
  );
}

function CountLines({ t, st, c }: { t: Tokens; st: string; c: Contest }) {
  const all = total(c);
  const [first, second] = c.cands;
  const held = holderOf(st, c);
  if (!first || all === 0) return <p className="text-[10px] font-mono" style={{ color: t.mutedText }}>The state&apos;s count: no votes counted yet.</p>;
  return (
    <>
      <p className="text-[10px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
        The state&apos;s count: {c.cands.slice(0, 3).map(([n, p, v]) => `${n} (${p}) ${v.toLocaleString("en-US")} · ${pct(v, all)}`).join(" · ")}
        {second ? ` · margin ${(first[2] - second[2]).toLocaleString("en-US")}` : ""}
        {c.reporting ? ` · ${c.reporting[0].toLocaleString("en-US")} of ${c.reporting[1].toLocaleString("en-US")} reporting` : ""}
      </p>
      {held && (
        <p className="text-[10px] font-sans leading-snug" style={{ color: held[1] !== first[1] ? t.headText : t.mutedText }}>
          {held[1] !== first[1] ? `Its leader would change the seat's party: held now by ${held[0]} (${held[1]}).` : `Held now by ${held[0]} (${held[1]}).`}
        </p>
      )}
    </>
  );
}

export function MidtermsPanel({ t, data, office, onOffice }: { t: Tokens; data: Midterms | null | undefined; office: Office; onOffice: (o: Office) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const states = useMemo(() => {
    if (!data) return [];
    const all = office === "house" ? [...new Set([...Object.keys(data.calls?.house ?? {}), ...Object.keys(data.states)])] : RACES_2026[office];
    return all.filter((st) => (office === "house" ? districtsOf(data, st).length > 0 : !!stateLead(data, st, office))).sort((a, b) => (NAME_OF.get(a) ?? a).localeCompare(NAME_OF.get(b) ?? b));
  }, [data, office]);
  const missing = data && office !== "house" ? RACES_2026[office].filter((st) => !states.includes(st)) : [];
  const chip = (on: boolean) => ({ borderColor: on ? t.headText : t.gridLine, color: on ? t.headText : t.mutedText });

  if (data === undefined) return <p className="text-[10px] font-mono uppercase tracking-widest mt-3" style={{ color: t.mutedText }}>Reading the results…</p>;
  if (data === null) return <p className="text-[11px] font-sans mt-3" style={{ color: t.mutedText }}>The results could not be read just now.</p>;

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
            ["R", false, "Republican called"],
            ["D", false, "Democratic called"],
            ["R", true, "R leads the count"],
            ["D", true, "D leads the count"],
          ].map(([p, light, label]) => (
            <span key={String(label)} className="inline-flex items-center gap-1 text-[10px] font-sans" style={{ color: t.mutedText }}>
              <span aria-hidden className="w-2.5 h-2.5 rounded-sm" style={{ background: light ? `${partyInk(String(p))}80` : partyInk(String(p)) }} />
              {label}
            </span>
          ))}
        </span>
      </div>

      <div>
        {states.map((st) => {
          if (office !== "house") {
            const c = data.states[st]?.contests.find((x) => x.office === office);
            return (
              <div key={st} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <p className="text-[12px] font-semibold font-sans" style={{ color: t.headText }}>
                  {NAME_OF.get(st) ?? st}
                  {data.calls?.[office][st]?.special || c?.special ? <span className="font-normal" style={{ color: t.mutedText }}> · special election</span> : null}
                </p>
                <CallLine t={t} data={data} st={st} office={office} />
                {c ? <CountLines t={t} st={st} c={c} /> : <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>The state&apos;s own count is not read here yet.</p>}
                {data.states[st] && (
                  <p className="text-[10px] font-sans mt-0.5" style={{ color: t.mutedText }}>
                    <a href={data.states[st].url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                      {data.states[st].source}
                    </a>
                    {` · read ${new Date(data.states[st].readAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}`}
                  </p>
                )}
              </div>
            );
          }
          const ds = districtsOf(data, st);
          const tally = ds.reduce<Record<string, number>>((a, d) => {
            const s = standingOf(data, st, "house", d);
            const key = s.called ? `${s.called.party} called` : s.lead ? `${s.lead[1]} leads` : "";
            return key ? { ...a, [key]: (a[key] ?? 0) + 1 } : a;
          }, {});
          return (
            <div key={st} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
              <button type="button" onClick={() => setOpen((o) => (o === st ? null : st))} aria-expanded={open === st} className="w-full flex items-baseline justify-between gap-3 text-left cursor-pointer">
                <span className="text-[12px] font-semibold font-sans" style={{ color: t.headText }}>
                  {NAME_OF.get(st) ?? st} · {ds.length} districts known here
                </span>
                <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                  {Object.entries(tally)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, n]) => `${k} ${n}`)
                    .join(" · ")}{" "}
                  {open === st ? "▴" : "▾"}
                </span>
              </button>
              {open === st &&
                ds.map((d) => {
                  const c = data.states[st]?.contests.find((x) => x.office === "house" && x.district === d);
                  return (
                    <div key={d} className="pl-3 pt-1.5">
                      <p className="text-[11px] font-semibold font-sans" style={{ color: t.headText }}>
                        District {d}
                      </p>
                      <CallLine t={t} data={data} st={st} office="house" district={d} />
                      {c && <CountLines t={t} st={st} c={c} />}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {missing.length > 0 && (
        <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
          Not yet called here, and the state&apos;s count not read yet: {missing.map((st) => NAME_OF.get(st) ?? st).join(", ")}.
        </p>
      )}
      <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
        A call is the news organisations&apos;, as Wikipedia records it, shown only where Wikipedia&apos;s national article and the race&apos;s own article name the same winner and party; for a House district the second record is the state&apos;s House article, or the state&apos;s own count with every precinct in. A count is the state&apos;s own, from its official results site, and unofficial until the state certifies it. Shares and margins are worked out here from the state&apos;s votes. Who holds a seat now is by the congress-legislators data and the governors&apos; list; those elected take office in January 2027.
        {data.calls?.unagreed.length ? ` ${data.calls.unagreed.length} races Wikipedia calls are not shown as called, its two records not yet agreeing.` : ""}
      </p>
    </div>
  );
}
