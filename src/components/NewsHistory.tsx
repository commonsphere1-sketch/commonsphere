import { useEffect, useMemo, useState } from "react";
import { StyledSelect } from "./StyledSelect";
import { countriesData } from "../data/countriesData";
import type { UnrestEvent } from "../data/unrest";

/**
 * The historic accounts of the News page's events, country by country, as asked: under the headline list, each kind of event
 * the tracker follows as the records hold it for the country picked - its deaths in armed conflict year by year (UCDP),
 * each disaster alert that touched it (GDACS), and the protests, boycotts, revolutions and internal conflicts of the
 * site's record of them, each with its account and the works it cites. Terrorism and epidemics have no record a
 * commercial site may use, and say so. The records are read when the section is first shown.
 */
type Data = {
  conflict: Record<string, [number, number][]>;
  disasters: Record<string, [string, string, string, string][]>;
  unrest: Record<string, number[]>;
  events: UnrestEvent[];
  ucdp: { label: string; url: string };
  gdacs: { label: string; url: string };
  ucdpTo: number;
};
let loading: Promise<Data> | null = null;
const load = () =>
  (loading ??= Promise.all([import("../data/newsCountryHistory"), import("../data/unrest"), import("../data/newsHistory")]).then(([h, u, s]) => ({
    conflict: h.COUNTRY_CONFLICT,
    disasters: h.COUNTRY_DISASTERS,
    unrest: h.COUNTRY_UNREST,
    events: u.UNREST_EVENTS,
    ucdp: s.NEWS_HISTORY_SOURCES.ucdp,
    gdacs: s.NEWS_HISTORY_SOURCES.gdacs,
    ucdpTo: s.CONFLICT_HISTORY.years[s.CONFLICT_HISTORY.years.length - 1],
  })));

const fmt = (n: number) => n.toLocaleString("en-US");
const COUNTRIES = countriesData.filter((c) => !c.uninhabited).sort((a, b) => a.name.localeCompare(b.name));
const OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const ALERT_INK: Record<string, string> = { Red: "#e11d48", Orange: "#f59e0b" };

type Kind = "unrest" | "revolutions" | "war" | "terror" | "disaster" | "epidemic";
const chip = (on: boolean) =>
  `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
    on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
  }`;

/** The events of the record, newest first, each with its account and its sources - the works it cites, its article last. */
function Events({ list }: { list: UnrestEvent[] }) {
  if (!list.length) return <p className="text-[11px] font-sans text-muted-foreground">None in the record for this country.</p>;
  return (
    <ul className="max-h-[32rem] overflow-y-auto divide-y divide-border rounded-lg border border-border">
      {list.map((e) => {
        const links = [
          ...(e.sources ?? []),
          ...(e.article
            ? [
                {
                  label: "Wikipedia",
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(e.article.replace(/ /g, "_"))}`,
                },
              ]
            : []),
        ];
        return (
          <li key={`${e.title}-${e.year}`} className="px-3 py-2 flex flex-col gap-0.5">
            <p className="text-xs font-sans text-foreground flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-semibold min-w-0">{e.title}</span>
              <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{e.when || e.year}</span>
            </p>
            {e.where && <p className="text-[10px] font-sans text-muted-foreground">{e.where}</p>}
            {(e.said || e.outcome || e.effect) && (
              <p className="text-[11px] font-sans text-muted-foreground leading-snug">
                {e.said}
                {e.outcome ? ` Outcome: ${e.outcome}.` : ""}
                {e.effect ? ` Cost: ${e.effect}.` : ""}
              </p>
            )}
            {links.length > 0 && (
              <p className="text-[10px] font-sans text-muted-foreground">
                {links.slice(-4).map((l, i) => (
                  <span key={l.url}>
                    {i > 0 && " · "}
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      {l.label.split(" — ")[0]}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function NewsHistory({ initial }: { /** The country the page has picked, where it has one. */ initial?: string }) {
  const [code, setCode] = useState(initial && COUNTRIES.some((c) => c.code === initial) ? initial : "US");
  useEffect(() => {
    if (initial && COUNTRIES.some((c) => c.code === initial)) setCode(initial);
  }, [initial]);
  const [data, setData] = useState<Data | null>(null);
  const [kind, setKind] = useState<Kind>("unrest");
  useEffect(() => {
    let off = false;
    load().then((d) => !off && setData(d));
    return () => {
      off = true;
    };
  }, []);
  const name = COUNTRIES.find((c) => c.code === code)?.name ?? code;
  const of = useMemo(() => {
    if (!data) return null;
    const events = (data.unrest[code] ?? [])
      .map((i) => data.events[i])
      .filter(Boolean)
      .sort((a, b) => b.year - a.year);
    return {
      conflict: data.conflict[code] ?? [],
      disasters: data.disasters[code] ?? [],
      unrest: events.filter((e) => e.kind === "Protest" || e.kind === "Boycott"),
      revolutions: events.filter((e) => e.kind === "Revolution"),
      internal: events.filter((e) => e.kind === "Internal conflict"),
    };
  }, [data, code]);

  return (
    <section aria-labelledby="news-history" className="mt-8 mb-6">
      <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
        <h2 id="news-history" className="text-sm font-bold font-sans text-foreground">
          Historic accounts
        </h2>
        <span className="text-[10px] font-sans text-muted-foreground">each kind of event in one country, as the records hold it</span>
        <span className="flex-1 h-px bg-border" aria-hidden />
        <StyledSelect value={code} onValueChange={setCode} options={OPTIONS} ariaLabel="The country whose history is shown" triggerClassName="px-3 py-1.5 rounded-full border border-foreground/30 bg-muted/60 hover:bg-muted hover:border-foreground/50 text-foreground font-semibold shadow-sm" />
      </div>
      {!of ? (
        <p className="px-1 text-[11px] font-sans text-muted-foreground">Reading the records…</p>
      ) : (
        (() => {
          const kinds: {
            id: Kind;
            title: string;
            color: string;
            count: number | null;
            sub: string;
            body: React.ReactNode;
          }[] = [
            {
              id: "unrest",
              title: "Civil unrest",
              color: "#f59e0b",
              count: of.unrest.length,
              sub: `Protests, strikes, riots and boycotts in ${name} in the site's record of them: ${of.unrest.length}.`,
              body: (
                <>
                  <Events list={of.unrest} />
                </>
              ),
            },
            {
              id: "revolutions",
              title: "Revolutions and coups",
              color: "#8b5cf6",
              count: of.revolutions.length,
              sub: `Revolutions and rebellions in ${name} in the same record: ${of.revolutions.length}.`,
              body: (
                <>
                  <Events list={of.revolutions} />
                </>
              ),
            },
            {
              id: "war",
              title: "Wars and conflicts",
              color: "#ef4444",
              count: null,
              sub: `Deaths in armed conflict in ${name} each year from 1989, UCDP's best estimates; and its internal conflicts in the record.`,
              body: (
                <>
                  {of.conflict.length ? (
                    <>
                      <ConflictYears rows={of.conflict} name={name} to={data!.ucdpTo} />
                      <p className="text-[10px] font-sans text-muted-foreground">
                        <a href={data!.ucdp.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                          {data!.ucdp.label}
                        </a>
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] font-sans text-muted-foreground">UCDP records no deaths in armed conflict in {name} since 1989.</p>
                  )}
                  {of.internal.length > 0 && <Events list={of.internal} />}
                </>
              ),
            },
            {
              id: "terror",
              title: "Terrorism",
              color: "#f97316",
              count: null,
              sub: "Attacks year by year",
              body: (
                <>
                  <p className="text-[11px] font-sans text-muted-foreground leading-snug">
                    Not held: no body whose terms let a commercial site use its record publishes attacks country by country, year by year. Where a country&#39;s US travel advisory
                    gives terrorism as a reason now, the tracker below says so.
                  </p>
                </>
              ),
            },
            {
              id: "disaster",
              title: "Natural disasters",
              color: "#14b8a6",
              count: of.disasters.length,
              sub: `Each orange or red alert GDACS issued that touched ${name}, from 2015: ${of.disasters.length}.`,
              body: (
                <>
                  {of.disasters.length ? (
                    <ul className="max-h-[32rem] overflow-y-auto divide-y divide-border rounded-lg border border-border">
                      {of.disasters.map(([date, kind, nm, alert], i) => (
                        <li key={`${date}-${nm}-${i}`} className="px-3 py-1.5 flex items-center gap-2 text-[11px] font-sans">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: ALERT_INK[alert] ?? "#94a3b8",
                            }}
                            title={`${alert} alert`}
                            aria-label={`${alert} alert`}
                          />
                          <span className="text-foreground min-w-0 flex-1 truncate">
                            {kind}
                            {nm ? <span className="text-muted-foreground"> · {nm}</span> : null}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{date}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] font-sans text-muted-foreground">No orange or red alert touched {name} from 2015.</p>
                  )}
                  <p className="text-[10px] font-sans text-muted-foreground">
                    <a href={data!.gdacs.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      {data!.gdacs.label}
                    </a>
                  </p>
                </>
              ),
            },
            {
              id: "epidemic",
              title: "Epidemics",
              color: "#0ea5e9",
              count: null,
              sub: "Outbreaks year by year",
              body: (
                <>
                  <p className="text-[11px] font-sans text-muted-foreground leading-snug">
                    Not held: no body whose terms let a commercial site use its record publishes a country&#39;s outbreaks year by year. The CDC&#39;s travel health notices in
                    force now are in the tracker below.
                  </p>
                </>
              ),
            },
          ];
          const on = kinds.find((k) => k.id === kind) ?? kinds[0];
          return (
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 min-w-0">
              <div role="tablist" aria-label="The kind of event" className="flex flex-wrap items-center gap-1.5">
                {kinds.map((k) => (
                  <button key={k.id} type="button" role="tab" aria-selected={k.id === on.id} onClick={() => setKind(k.id)} className={chip(k.id === on.id)}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: k.color }} aria-hidden />
                    {k.title}
                    {k.count !== null && <> · {fmt(k.count)}</>}
                  </button>
                ))}
              </div>
              <div role="tabpanel" aria-label={on.title} className="flex flex-col gap-2.5 min-w-0">
                <p className="text-[10px] font-sans text-muted-foreground leading-snug">{on.sub}</p>
                {on.body}
              </div>
            </div>
          );
        })()
      )}
      <p className="mt-2 px-1 text-[10px] font-sans text-muted-foreground leading-snug">
        The record of revolutions, protests, boycotts and internal conflicts is the site&#39;s own selection from Wikipedia&#39;s lists of them, each event with the works its
        account cites: an event is placed in a country where its place names it, or failing that its title, so one in a place under another name can be missed. It is a selection,
        not a census - the absence of an event here does not mean none took place.
      </p>
    </section>
  );
}

/** A country's deaths in armed conflict year by year, 1989 to the last year UCDP gives for any country, as slim columns with the peak named. */
function ConflictYears({ rows, name, to }: { rows: [number, number][]; name: string; /** The last year UCDP gives for any country. */ to: number }) {
  const from = 1989;
  const by = new Map(rows);
  const years = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const top = Math.max(...rows.map(([, v]) => v), 1);
  const peak = rows.reduce((b, r) => (r[1] > b[1] ? r : b));
  const total = rows.reduce((s, [, v]) => s + v, 0);
  return (
    <div>
      <div className="flex items-end gap-px h-16" role="img" aria-label={`Deaths in armed conflict in ${name}, ${from} to ${to}: the most ${fmt(peak[1])} in ${peak[0]}.`}>
        {years.map((y) => {
          const v = by.get(y) ?? 0;
          return (
            <span
              key={y}
              className="flex-1 rounded-t-sm min-w-0"
              title={`${y}: ${fmt(v)}`}
              style={{
                height: `${v ? Math.max(4, (v / top) * 100) : 2}%`,
                background: v ? "linear-gradient(0deg, color-mix(in srgb, #ef4444 35%, transparent), #ef4444)" : "color-mix(in srgb, currentColor 7%, transparent)",
              }}
            />
          );
        })}
      </div>
      <p className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{from}</span>
        <span>{to}</span>
      </p>
      <p className="text-[11px] font-sans text-foreground">
        {fmt(total)} in all, worked out here · the most {fmt(peak[1])} in {peak[0]} · {fmt(by.get(to) ?? 0)} in {to}
      </p>
    </div>
  );
}
