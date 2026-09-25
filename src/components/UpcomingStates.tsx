import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { useLiveStatus, type UpcomingEvent } from "@/lib/liveFigures";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { usStatesData } from "@/data/statesData";
import { TONE } from "@/lib/chipTone";

/**
 * "Upcoming to watch" on the States page, from published calendars rather
 * than written by hand: the elections Wikidata lists for each state, and
 * the BEA releases that carry state GDP and income. The refresh-data
 * function updates them twice a day, so the strip keeps itself current -
 * new contests appear as they are added, and past ones drop off.
 *
 * States the reader follows come first. Every chip links to its source.
 */

const KIND_ORDER = [
  "Governor",
  "US Senate",
  "US House",
  "Lieutenant Governor",
  "Attorney General",
  "Secretary of State",
  "State legislature",
  "Ballot measure",
  "Special election",
  "Election",
  "Data release",
];

const KIND_TONE: Record<string, string> = {
  Governor: TONE.amber,
  "US Senate": TONE.blue,
  "US House": TONE.indigo,
  "Lieutenant Governor": TONE.orange,
  "Attorney General": TONE.rose,
  "Secretary of State": TONE.violet,
  "State legislature": TONE.teal,
  "Ballot measure": TONE.pink,
  "Special election": TONE.fuchsia,
  "Data release": TONE.cyan,
};

const SHOWN = 8;

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const stateName = (id: string | null) => (id ? (usStatesData.find((s) => s.id === id)?.name ?? id.toUpperCase()) : "");

function label(e: UpcomingEvent): string {
  if (e.kind === "Data release") return `${e.title.replace(/^BEA: /, "BEA release: ")} · ${fmtDate(e.event_date)}`;
  return `${stateName(e.area)} · ${e.kind} · ${fmtDate(e.event_date)}`;
}

export function UpcomingStates() {
  const { events, lastChecked } = useLiveStatus();
  const watch = useWatchlist();
  const [showAll, setShowAll] = useState(false);
  const followed = new Set(watch.items.filter((i) => i.type === "state").map((i) => i.id));
  const rank = (k: string) => {
    const i = KIND_ORDER.indexOf(k);
    return i < 0 ? KIND_ORDER.length : i;
  };
  const list = events
    .filter((e) => e.scope === "states")
    .sort(
      (a, b) =>
        Number(followed.has(b.area ?? "")) - Number(followed.has(a.area ?? "")) ||
        a.event_date.localeCompare(b.event_date) ||
        rank(a.kind) - rank(b.kind) ||
        stateName(a.area).localeCompare(stateName(b.area)),
    );
  if (!list.length) return null;
  const shown = showAll ? list : list.slice(0, SHOWN);

  return (
    <div className="mb-6 bg-card border border-border rounded-2xl p-5">
      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
        🔥 Upcoming to Watch
      </p>
      <div className="flex flex-wrap gap-2">
        {shown.map((e) => (
          <a
            key={e.id}
            href={e.source_url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${e.title} - ${fmtDate(e.event_date)} (source: ${e.source === "bea" ? "BEA release schedule" : "Wikidata"})`}
            className={`inline-flex items-center gap-1 max-w-full text-[10px] font-sans px-2.5 py-1 rounded-full hover:underline ${KIND_TONE[e.kind] ?? TONE.zinc}`}
          >
            {followed.has(e.area ?? "") && <Star size={10} weight="fill" className="text-amber-500 shrink-0" />}
            <span className="truncate">{label(e)}</span>
          </a>
        ))}
        {list.length > SHOWN && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[10px] font-semibold font-sans px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            {showAll ? "Show fewer" : `Show all ${list.length}`}
          </button>
        )}
      </div>
      <p className="mt-3 text-[10px] font-sans text-muted-foreground leading-snug">
        Elections as{" "}
        <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Wikidata
        </a>{" "}
        lists them (it has most contests, not every one) and{" "}
        <a href="https://www.bea.gov/news/schedule" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          BEA's release schedule
        </a>
        , checked twice a day
        {lastChecked &&
          ` - last checked ${lastChecked.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        .
      </p>
    </div>
  );
}
