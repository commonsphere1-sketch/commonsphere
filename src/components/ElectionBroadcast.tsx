/**
 * The 2026 midterms across the site, as asked: a bar at the head of every page while election season is on (Settings,
 * or the bar's own close) - the balance of the Senate, the governors and the House as the states' counts stand, each a
 * red and blue bar to its total with a mark where control lies; the states the reader follows first, each with who leads
 * its races; and the way to the map.
 *
 * The seats not up this year are drawn in full colour, the races a party leads in the count in a lighter one, and the
 * races not yet read in grey: a lead is not a win, and the bar says so. Every count is the state's own, unofficial until
 * it certifies; the balance is worked out here from those counts and the seats not up.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretDown, CaretUp, X } from "@phosphor-icons/react";
import { useWatchlist } from "../contexts/WatchlistContext";
import { usStatesData } from "../data/statesData";
import { balanceOf, partyInk, useMidterms, type Balance, type Midterms, type Office } from "../lib/elections2026";
import { useElectionSeason } from "../lib/electionSeason";

const D = "#3b82f6";
const R = "#ef4444";
const NAME_OF = new Map(usStatesData.map((s) => [s.abbreviation, s.name]));

/** One chamber's balance: the seats not up and the leads of each party from either end, the unread between, control marked. */
function PowerBar({ label, b }: { label: string; b: Balance }) {
  const at = (n: number) => `${(100 * n) / b.total}%`;
  const dAll = b.notUp.D + b.leads.D;
  const rAll = b.notUp.R + b.leads.R;
  const seg = (w: number, color: string, faint: boolean, title: string) =>
    w > 0 ? <span title={title} className="h-full" style={{ width: at(w), background: faint ? `color-mix(in srgb, ${color} 45%, transparent)` : color }} /> : null;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-[10px] font-mono">
        <span className="font-semibold" style={{ color: D }}>
          D {dAll}
        </span>
        <span className="uppercase tracking-widest text-muted-foreground truncate">{label}</span>
        <span className="font-semibold" style={{ color: R }}>
          R {rAll}
        </span>
      </div>
      <div className="relative mt-1">
        <div className="flex h-2.5 rounded-full overflow-hidden text-foreground" style={{ background: "color-mix(in srgb, currentColor 7%, transparent)" }} role="img" aria-label={`${label}: Democrats ${b.notUp.D} not up and ${b.leads.D} leading, Republicans ${b.notUp.R} not up and ${b.leads.R} leading, ${b.unread} not yet read; ${b.control} for control`}>
          {seg(b.notUp.D, D, false, `Democratic, not up this year: ${b.notUp.D}`)}
          {seg(b.leads.D, D, true, `Democratic leads in the count: ${b.leads.D}`)}
          {seg(b.unread + b.notUp.O + b.leads.O, "transparent", false, `Not yet read, or neither party: ${b.unread + b.notUp.O + b.leads.O}`)}
          {seg(b.leads.R, R, true, `Republican leads in the count: ${b.leads.R}`)}
          {seg(b.notUp.R, R, false, `Republican, not up this year: ${b.notUp.R}`)}
        </div>
        {/* Where control lies, from either end. */}
        <span aria-hidden className="absolute -top-0.5 -bottom-0.5 w-px bg-foreground" style={{ left: at(b.control) }} />
        <span aria-hidden className="absolute -top-0.5 -bottom-0.5 w-px bg-foreground" style={{ left: `calc(100% - ${at(b.control)})` }} />
      </div>
      <p className="text-[9px] font-mono text-muted-foreground mt-0.5 truncate">
        {b.unread} not yet read · {b.control} of {b.total} for control
      </p>
    </div>
  );
}

/** A followed state's races as its count stands: who leads each. */
function Followed({ data, st }: { data: Midterms | null | undefined; st: string }) {
  const s = data?.states[st];
  const lead = (o: Office) => {
    const c = s?.contests.find((x) => x.office === o);
    const total = c ? c.cands.reduce((a, x) => a + x[2], 0) : 0;
    return c && total ? c.cands[0] : null;
  };
  const races = (["senate", "governor"] as const).map((o) => [o, lead(o)] as const).filter(([, l]) => l);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border text-[10px] font-sans whitespace-nowrap">
      <span className="font-semibold text-foreground">{NAME_OF.get(st) ?? st}</span>
      {!s && <span className="text-muted-foreground">not read yet</span>}
      {s && !races.length && <span className="text-muted-foreground">its House districts</span>}
      {races.map(([o, l]) => (
        <span key={o} className="inline-flex items-center gap-1 text-muted-foreground">
          {o === "senate" ? "Sen" : "Gov"}
          <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: partyInk(l![1]) }} />
          <span className="text-foreground">{l![0].split(/\s+\/\s+| and /)[0].split(" ").slice(-1)[0]}</span>
        </span>
      ))}
    </span>
  );
}

export function ElectionBroadcast() {
  const [on, setOn] = useElectionSeason();
  const data = useMidterms(on);
  const watch = useWatchlist();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!on) return null;
  const read = data ? Object.keys(data.states).length : 0;
  const followed = watch.items.filter((i) => i.type === "state").map((i) => i.id.toUpperCase()).filter((st) => NAME_OF.has(st));
  return (
    <section aria-label="The 2026 midterms, as the states' counts stand" className="ml-3 sm:ml-6 mr-14 sm:mr-16 mt-3 modal-tile rounded-xl px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground shrink-0">
          <span aria-hidden className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: R }} />
            <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: R }} />
          </span>
          Midterms 2026 · the states&apos; counts
        </span>
        <span className="text-[10px] font-sans text-muted-foreground">
          {data === undefined ? "reading…" : data === null ? "could not be read just now" : `${read} states read so far, unofficial until certified`}
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <button type="button" onClick={() => navigate("/dashboard/worldview")} className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
            The map
          </button>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label={open ? "Fewer details" : "More details"} title={open ? "Fewer" : "More"}>
            {open ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </button>
          <button type="button" onClick={() => setOn(false)} className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Turn election season off" title="Turn off - back on in Settings">
            <X size={12} />
          </button>
        </span>
      </div>
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-2 mt-2">
          <PowerBar label="Senate" b={balanceOf(data, "senate")} />
          <PowerBar label="Governors" b={balanceOf(data, "governor")} />
          <PowerBar label="House" b={balanceOf(data, "house")} />
        </div>
      )}
      {data && followed.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mr-0.5">States you follow</span>
          {followed.map((st) => (
            <Followed key={st} data={data} st={st} />
          ))}
        </div>
      )}
      {open && (
        <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
          Each state&apos;s count is read from its own official results site and is unofficial until it certifies; no race is called here. On each bar the full colour is the seats not up this year, by the party their holder sits with; the lighter colour is the races a party leads in the count; grey is the races not yet read here, or held by neither party. The two marks are where control lies from either end - a 50-50 Senate is decided by the Vice President&apos;s vote. Worked out here from the states&apos; counts and the seats not up. Turn this off, or on again, in Settings.
        </p>
      )}
    </section>
  );
}
