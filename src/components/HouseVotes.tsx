/**
 * How a member of the House voted, as asked: every recorded vote of the 119th Congress from the Clerk of the House's own
 * roll-call files (houseVotesMeta.ts, build-house-votes.cjs), in the member's profile.
 *
 * The votes they cast and missed, and how often they voted with most of their own party - both worked out here from the
 * Clerk's records and said to be; then their votes, the latest first, each with its question, the measure, the result and
 * the House's tally, the bills passed or failed on their own if asked, and a link to the Clerk's page for the roll call.
 * Nothing is scored or ranked beyond that.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { HOUSE_VOTES_SOURCES, HOUSE_VOTES_THROUGH, type HouseMemberVotes, type HouseVote } from "../data/houseVotesMeta";
import { Kpi, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const json = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));
let INDEX: Promise<{ congress: number; votes: HouseVote[] }> | null = null;
const index = () => (INDEX ??= json<{ congress: number; votes: HouseVote[] }>("/votes/house/index.json").catch((e) => ((INDEX = null), Promise.reject(e))));

const SAID: Record<string, string> = { Y: "Yea", N: "Nay", P: "Present", V: "Did not vote" };
const TONE: Record<string, string> = { Y: "#16a34a", N: "#dc2626", P: "#64748b", V: "#94a3b8" };
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : "—");
/** A vote that passes or fails a bill or resolution itself, not a motion on the way to it. */
const passing = (q: string) => /^On (Passage|Motion to Suspend the Rules and (Pass|Agree)|Agreeing to the (Resolution|Conference Report)|Motion to Concur in the Senate Amendment)/i.test(q);

export default function HouseVotes({ t, id, name, color }: { t: Tokens; /** The member's Biographical Directory id. */ id: string; name: string; color: string }) {
  const [votes, setVotes] = useState<HouseVote[] | null | undefined>(undefined);
  const [mine, setMine] = useState<HouseMemberVotes | null | undefined>(undefined);
  const [only, setOnly] = useState(false);
  const [shown, setShown] = useState(12);

  useEffect(() => {
    let live = true;
    index()
      .then((x) => live && setVotes(x.votes))
      .catch(() => live && setVotes(null));
    json<HouseMemberVotes>(`/votes/house/m/${id}.json`)
      .then((x) => live && setMine(x))
      .catch(() => live && setMine(null));
    return () => {
      live = false;
    };
  }, [id]);

  const stats = useMemo(() => {
    if (!votes || !mine) return null;
    let held = 0;
    let cast = 0;
    let missed = 0;
    let withParty = 0;
    let partyVotes = 0;
    votes.forEach((v, i) => {
      const c = mine.votes[i];
      if (!c || c === "-") return;
      held++;
      if (c === "V") missed++;
      else cast++;
      // Most of their party's yeas and nays, by the Clerk's totals; a party split evenly has no side.
      const [y, n] = mine.party === "D" ? [v[11], v[12]] : mine.party === "R" ? [v[13], v[14]] : [0, 0];
      if ((c === "Y" || c === "N") && y !== n) {
        partyVotes++;
        if ((c === "Y") === y > n) withParty++;
      }
    });
    return { held, cast, missed, withParty, partyVotes };
  }, [votes, mine]);

  if (votes === undefined || mine === undefined) return <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>Loading {name}&apos;s votes…</p>;
  if (!votes || !mine || !stats || stats.held === 0) return <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>No recorded vote is held for {name} in the Clerk&apos;s files for the 119th Congress.</p>;

  const list = votes
    .map((v, i) => [v, mine.votes[i]] as const)
    .filter(([v, c]) => c && c !== "-" && (!only || passing(v[4])))
    .reverse();
  const party = mine.party === "D" ? "Democrats" : mine.party === "R" ? "Republicans" : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Kpi t={t} label="Votes cast" value={stats.cast.toLocaleString("en-US")} color={t.headText} sub={`of ${stats.held.toLocaleString("en-US")} held while a member`} />
        <Kpi t={t} label="Missed" value={pct(stats.missed, stats.held)} color={t.headText} sub={`${stats.missed.toLocaleString("en-US")} votes · worked out here`} />
        <Kpi t={t} label={party ? `With most ${party}` : "With their party"} value={party ? pct(stats.withParty, stats.partyVotes) : "—"} color={t.headText} sub={party ? `of ${stats.partyVotes.toLocaleString("en-US")} yeas and nays · worked out here` : "no party tally for them"} />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Which votes">
        {([false, true] as const).map((o) => (
          <button
            key={String(o)}
            type="button"
            onClick={() => {
              setOnly(o);
              setShown(12);
            }}
            aria-pressed={only === o}
            className="px-2 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer"
            style={only === o ? { borderColor: color, color: t.headText } : { borderColor: t.gridLine, color: t.mutedText }}
          >
            {o ? "Bills and resolutions passed or failed" : "Every vote"}
          </button>
        ))}
      </div>

      <div>
        {list.slice(0, shown).map(([v, c]) => (
          <div key={`${v[0]}-${v[1]}`} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-sans min-w-0 leading-snug" style={{ color: t.headText }}>
                {v[6] || v[3] || v[4]}
              </p>
              <span className="text-[10px] font-mono font-semibold shrink-0 px-1.5 py-0.5 rounded" style={{ color: TONE[c], background: `${TONE[c]}1a` }}>
                {SAID[c]}
              </span>
            </div>
            <p className="text-[10px] font-mono mt-0.5 leading-snug" style={{ color: t.mutedText }}>
              {day(v[2])} · {v[3] && v[3] !== v[6] ? `${v[3]} · ` : ""}
              {v[4]} · {v[5]} {v[7]}–{v[8]}
              {v[9] ? `, ${v[9]} present` : ""} ·{" "}
              <a href={`https://clerk.house.gov/Votes/${v[0]}${v[1]}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:opacity-70" style={{ color }}>
                roll {v[1]} <ArrowSquareOut size={9} aria-hidden />
              </a>
            </p>
          </div>
        ))}
        {list.length > shown && (
          <button type="button" onClick={() => setShown((s) => s + 24)} className="text-[10px] font-sans mt-2 cursor-pointer underline-offset-2 hover:underline" style={{ color: t.mutedText }}>
            Show more · {(list.length - shown).toLocaleString("en-US")} older
          </button>
        )}
      </div>
      <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
        Every recorded vote of the 119th Congress to {day(HOUSE_VOTES_THROUGH)}, as the Clerk of the House records it; quorum calls and the elections of the Speaker are left out. &quot;With most {party ?? "of their party"}&quot; counts the yeas and nays where the member voted the way most of their party did, by the Clerk&apos;s party totals; a vote where the party split evenly is not counted.
      </p>
      <SourceLink sources={HOUSE_VOTES_SOURCES} />
    </div>
  );
}
