/**
 * What is being reported about a place now, in its window: the latest
 * headlines that name it, from the outlets the site reads, sorted by the desk
 * each came through - policy, the economy, climate, crime and so on.
 *
 * The site has no record of "the topics a country is debating", and does not
 * write one: nobody publishes such a list for every country and state, and one
 * typed in would be an opinion that dates within the week. What can be shown
 * truthfully is what outlets are reporting about the place today, which is
 * where its debates surface. Each headline is the outlet's own, links to it,
 * and carries its time; the count beside a desk is a count of headlines, not
 * a measure of importance.
 *
 * The headlines are the news store's (the same rows the headline banners
 * read), asked for by the place's tag: "c:DE" for a country, "s:oh" for a
 * state.
 */
import { ChipRow } from "./ChipRow";
import { useEffect, useState } from "react";
import { ChatsCircle } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { ago, type Topic } from "./HeadlinesBanner";

type Row = { url: string; title: string; outlet: string; published_at: string; topics: string[] };

const DESK: Record<Topic, string> = {
  policy: "Policy and government",
  economy: "The economy",
  world: "World affairs",
  us: "United States",
  humanitarian: "Humanitarian",
  climate: "Climate and environment",
  crime: "Crime and justice",
};
/** The order the desks are offered in: the ones a debate is likeliest to run through first. */
const ORDER: Topic[] = ["policy", "economy", "crime", "climate", "humanitarian", "world", "us"];

const cache = new Map<string, { at: number; rows: Row[] }>();

/** The newest headlines naming a place over the last `days`, each once. */
function usePlaceHeadlines(tag: string, days: number): { rows: Row[]; done: boolean } {
  const key = `${tag}|${days}`;
  const [rows, setRows] = useState<Row[]>(() => cache.get(key)?.rows ?? []);
  const [done, setDone] = useState(() => cache.has(key));
  useEffect(() => {
    const db = supabase;
    const hit = cache.get(key);
    if (!db || (hit && Date.now() - hit.at < 10 * 60_000)) {
      setRows(hit?.rows ?? []);
      setDone(true);
      return;
    }
    let live = true;
    setDone(false);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    db.from("news_items")
      .select("url, title, outlet, published_at, topics")
      .contains("places", [tag])
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(120)
      .then(({ data, error }) => {
        // A wire story runs under one headline at several outlets: the newest copy is enough.
        const titles = new Set<string>();
        const clean = (error || !data ? [] : (data as Row[])).filter((r) => {
          if (typeof r.title !== "string" || !/^https:\/\//.test(r.url)) return false;
          const t = r.title.toLowerCase().replace(/\s+/g, " ").trim();
          if (titles.has(t)) return false;
          titles.add(t);
          return true;
        });
        if (!error) cache.set(key, { at: Date.now(), rows: clean });
        if (live) {
          setRows(clean);
          setDone(true);
        }
      });
    return () => {
      live = false;
    };
  }, [key, tag, days]);
  return { rows, done };
}

export function PlaceTopics({ tag, name, days = 14, className = "mb-4" }: { /** The place's tag in the news store: "c:DE", "s:oh". */ tag: string; name: string; days?: number; className?: string }) {
  const { rows, done } = usePlaceHeadlines(tag, days);
  const [desk, setDesk] = useState<Topic | "all">("all");
  const [all, setAll] = useState(false);
  const desks = ORDER.map((t) => ({ t, n: rows.filter((r) => Array.isArray(r.topics) && r.topics.includes(t)).length })).filter((d) => d.n > 0);
  const shown = desk === "all" ? rows : rows.filter((r) => r.topics?.includes(desk));
  const list = all ? shown : shown.slice(0, 8);
  const chip = (on: boolean) =>
    `text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${on ? "chip-selected" : "border-border text-foreground hover:bg-muted/60"}`;
  return (
    <div className={`modal-tile rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-2 mb-3">
        <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">
          <ChatsCircle size={13} weight="fill" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">Current Topics</h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            What outlets are reporting about {name} now · the last {days} days' headlines naming it, by the desk each came through
          </p>
        </div>
      </div>

      {!done ? (
        <p className="text-[11px] font-sans text-muted-foreground">Reading the headlines…</p>
      ) : rows.length === 0 ? (
        <p className="text-[11px] font-sans text-muted-foreground leading-relaxed">
          No headline in the last {days} days names {name} among the outlets the site reads. That is a count of its coverage here, not a sign that nothing is being
          debated.
        </p>
      ) : (
        <>
          <ChipRow className="mb-3" label="Show the headlines of one desk">
            <button type="button" onClick={() => setDesk("all")} aria-pressed={desk === "all"} className={chip(desk === "all")}>
              All <span className="font-mono font-normal opacity-70">{rows.length}</span>
            </button>
            {desks.map((d) => (
              <button key={d.t} type="button" onClick={() => setDesk(d.t)} aria-pressed={desk === d.t} className={chip(desk === d.t)}>
                {DESK[d.t]} <span className="font-mono font-normal opacity-70">{d.n}</span>
              </button>
            ))}
          </ChipRow>
          <ul className="flex flex-col">
            {list.map((r) => (
              <li key={r.url} className="border-b border-border last:border-b-0">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="group block py-2">
                  <span className="block text-[12px] font-sans text-foreground leading-snug group-hover:underline">{r.title}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                    {r.outlet} · {ago(r.published_at)}
                    {desk === "all" && r.topics?.length ? ` · ${r.topics.filter((t): t is Topic => t in DESK).map((t) => DESK[t]).join(", ")}` : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {shown.length > 8 && (
            <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="show-more mt-2 text-[11px] font-semibold font-sans text-secondary hover:opacity-70 transition-opacity cursor-pointer">
              {all ? "Show the newest eight" : `Show all ${shown.length}`}
            </button>
          )}
          <p className="text-[10px] font-sans text-muted-foreground leading-relaxed mt-3">
            Each headline is its outlet's and links to it. The site keeps no list of the questions a place is debating and does not write one; this is what is being
            reported about it, where those debates surface. A desk's number is a count of headlines, not a measure of how much the subject matters.
          </p>
        </>
      )}
    </div>
  );
}
