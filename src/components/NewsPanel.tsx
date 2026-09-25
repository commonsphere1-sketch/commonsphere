import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, Spinner } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { countriesData } from "@/data/countriesData";
import { usStatesData } from "@/data/statesData";

/**
 * Headlines about one country or state, and who it is in the news with.
 *
 * The refresh-data function reads established outlets' public RSS feeds
 * every half hour and tags each headline with the places it names (see
 * supabase/functions/refresh-data/news.ts). Only the headline, outlet, time
 * and link are kept; every headline links to the publisher. A headline that
 * names other places is about relations with them, shown as chips; the
 * "In the news with" row counts them and filters the list.
 */

type Headline = { url: string; title: string; outlet: string; published_at: string; places: string[] };

const cache = new Map<string, { at: number; rows: Headline[] }>();
const FRESH_MS = 10 * 60_000;

/** "c:JP" → "Japan", "s:tx" → "Texas". */
function placeName(key: string): string {
  const [kind, id] = key.split(":");
  if (kind === "c") return countriesData.find((c) => c.code === id)?.name ?? id;
  return usStatesData.find((s) => s.id === id)?.name ?? id.toUpperCase();
}

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

const OUTLETS =
  "BBC News, Al Jazeera, NPR, DW, France 24, The Guardian, UN News, PBS NewsHour, Foreign Policy, The Diplomat, ABC News (Australia), Euronews, the South China Morning Post, The Japan Times, The Straits Times, CNA, Africanews, The Hindu, MercoPress, Politico, The Hill, Stateline and CalMatters";

/** Whether the News tab has anything to read from. */
export const newsAvailable = !!supabase;

export function NewsPanel({ place, name }: { place: string; name: string }) {
  const [rows, setRows] = useState<Headline[] | null>(cache.get(place)?.rows ?? null);
  const [error, setError] = useState("");
  const [only, setOnly] = useState<string | null>(null);

  useEffect(() => {
    setOnly(null);
    const hit = cache.get(place);
    if (hit && Date.now() - hit.at < FRESH_MS) {
      setRows(hit.rows);
      return;
    }
    if (!supabase) return;
    let live = true;
    setRows(hit?.rows ?? null);
    setError("");
    supabase
      .from("news_items")
      .select("url, title, outlet, published_at, places")
      .contains("places", [place])
      .order("published_at", { ascending: false })
      .limit(40)
      .then(({ data, error: e }) => {
        if (!live) return;
        if (e) {
          setError("The headlines could not be loaded. Try again in a moment.");
          return;
        }
        const clean = (data ?? []).filter(
          (r): r is Headline =>
            typeof r.title === "string" && /^https:\/\//.test(r.url) && Array.isArray(r.places),
        );
        cache.set(place, { at: Date.now(), rows: clean });
        setRows(clean);
      });
    return () => {
      live = false;
    };
  }, [place]);

  // Who this place is in the news with, most often first.
  const partners = useMemo(() => {
    const n = new Map<string, number>();
    for (const r of rows ?? []) for (const p of r.places) if (p !== place) n.set(p, (n.get(p) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [rows, place]);

  const shown = (rows ?? []).filter((r) => !only || r.places.includes(only));

  if (!supabase) {
    return <p className="text-xs font-sans text-muted-foreground py-6 text-center">News is not available on this copy of the site.</p>;
  }

  return (
    <div className="animate-fade-in space-y-4">
      {partners.length > 0 && (
        <div className="modal-tile rounded-xl p-3">
          <p className="text-[10px] font-bold font-sans uppercase tracking-widest text-muted-foreground mb-2">
            In the news with
          </p>
          <div className="flex flex-wrap gap-1.5">
            {partners.map(([p, count]) => (
              <button
                key={p}
                type="button"
                onClick={() => setOnly((v) => (v === p ? null : p))}
                aria-pressed={only === p}
                className={`text-[11px] font-sans px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  only === p
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-foreground/80 hover:border-secondary/60"
                }`}
              >
                {placeName(p)} <span className={`font-mono ${only === p ? "opacity-70" : "text-muted-foreground"}`}>{count}</span>
              </button>
            ))}
          </div>
          {only && (
            <p className="mt-2 text-[10px] font-sans text-muted-foreground">
              Showing headlines naming both {name} and {placeName(only)}.{" "}
              <button type="button" onClick={() => setOnly(null)} className="underline hover:text-foreground">
                Show all
              </button>
            </p>
          )}
        </div>
      )}

      {rows === null && !error ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Spinner size={16} className="animate-spin" />
          <span className="text-xs font-sans">Loading headlines…</span>
        </div>
      ) : error ? (
        <p className="text-xs font-sans text-destructive py-4">{error}</p>
      ) : shown.length === 0 ? (
        <p className="text-xs font-sans text-muted-foreground py-6 text-center leading-relaxed">
          No headlines naming {name} in the last two weeks from the outlets followed here.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.url} className="modal-tile rounded-xl p-3">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-sm font-semibold font-sans text-foreground leading-snug hover:underline"
              >
                <span className="flex-1">{r.title}</span>
                <ArrowSquareOut size={13} className="mt-1 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </a>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[11px] font-sans text-muted-foreground">
                  {r.outlet} · {ago(r.published_at)}
                </span>
                {r.places
                  .filter((p) => p !== place)
                  .slice(0, 6)
                  .map((p) => (
                    <span key={p} className="text-[10px] font-sans px-1.5 py-0.5 rounded-full border border-border text-foreground/70">
                      {placeName(p)}
                    </span>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] font-sans text-muted-foreground leading-snug">
        Headlines from the public news feeds of {OUTLETS}, matched to the places they name and updated every half
        hour. Only the headline is shown here; each links to the publisher.
      </p>
    </div>
  );
}
