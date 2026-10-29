import { useEffect, useMemo, useState } from "react";
import { CaretDown, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { StyledSelect } from "./StyledSelect";
import { countriesData } from "../data/countriesData";

/**
 * The historic accounts of the News page's events, country by country, as asked: under the headline list, every event
 * of each kind the page follows - civil unrest, revolutions and coups, wars and conflicts, terrorism, natural disasters
 * and epidemics - past and present, as the records a commercial site may use hold them for the country picked:
 * Wikidata, UCDP's armed conflicts, NOAA's significant earthquakes, tsunamis and eruptions, GDACS's alerts and the
 * site's record of events with the works each account cites (build-event-history.cjs). One kind is shown at a time;
 * an event a record holds as part of another - a war's battles, the counties' accounts of an outbreak - is listed
 * within it. Each country's list is read when it is first picked.
 */
type Ev = {
  /** Its kind, by its place in EVENT_KINDS. */ c: number;
  /** Its record's class, by its place in the file's kinds. */ k: number;
  t: string;
  /** When, at the precision the record gives. */ w?: string;
  /** The year it is sorted by. */ y?: number;
  /** Where. */ p?: string;
  /** Deaths, as the record gives them. */ d?: string;
  /** The record's description. */ s?: string;
  /** The account of the site's record of events. */ x?: string;
  /** The event it is part of. */ o?: string;
  /** Set where the country took part in it rather than its being fought there. */ f?: 1;
  /** Its sources, Wikipedia last. */ l?: [string, string][];
  /** The event it is listed within, by its place in the file. */ u?: number;
};
type File = { kinds: string[]; events: Ev[] };

const FILES = import.meta.glob<File>("../data/eventHistory/*.json", { import: "default" });
const files = new Map<string, Promise<File | null>>();
const loadCountry = (code: string) => {
  if (!files.has(code)) files.set(code, FILES[`../data/eventHistory/${code}.json`]?.() ?? Promise.resolve(null));
  return files.get(code)!;
};

type Extra = {
  conflict: Record<string, [number, number][]>;
  ucdp: { label: string; url: string };
  ucdpTo: number;
  sources: { label: string; url: string }[];
  kinds: readonly string[];
};
let loadingExtra: Promise<Extra> | null = null;
const loadExtra = () =>
  (loadingExtra ??= Promise.all([import("../data/newsCountryHistory"), import("../data/newsHistory"), import("../data/eventHistoryIndex")]).then(([h, s, x]) => ({
    conflict: h.COUNTRY_CONFLICT,
    ucdp: s.NEWS_HISTORY_SOURCES.ucdp,
    ucdpTo: s.CONFLICT_HISTORY.years[s.CONFLICT_HISTORY.years.length - 1],
    sources: x.EVENT_SOURCES,
    kinds: x.EVENT_KINDS,
  })));

const fmt = (n: number) => n.toLocaleString("en-US");
const COUNTRIES = countriesData.filter((c) => !c.uninhabited).sort((a, b) => a.name.localeCompare(b.name));
const OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const PAGE = 40;

type Kind = "unrest" | "revolutions" | "war" | "terror" | "disaster" | "epidemic";
/* The tabs, in the page's order; each kind's words are what its records list. */
const TABS: { id: Kind; title: string; color: string; what: string }[] = [
  { id: "unrest", title: "Civil unrest", color: "#f59e0b", what: "protests, demonstrations, riots, strikes and boycotts" },
  { id: "revolutions", title: "Revolutions and coups", color: "#8b5cf6", what: "revolutions, coups and attempted coups, rebellions and uprisings" },
  { id: "war", title: "Wars and conflicts", color: "#ef4444", what: "wars, armed conflicts, battles, sieges, invasions and air strikes" },
  { id: "terror", title: "Terrorism", color: "#f97316", what: "terrorist attacks" },
  { id: "disaster", title: "Natural disasters", color: "#14b8a6", what: "earthquakes, tsunamis, eruptions, storms, floods, fires, droughts and the alerts issued for them" },
  { id: "epidemic", title: "Epidemics", color: "#0ea5e9", what: "epidemics, pandemics and outbreaks of disease" },
];
const chip = (on: boolean) =>
  `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
    on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
  }`;
const field = "bg-transparent border border-border rounded-full px-3 py-1.5 text-[12px] font-sans text-foreground focus:outline-none focus:border-foreground/40";
const moreButton = "show-more self-start text-[11px] font-semibold font-sans px-4 py-1.5 rounded-full border border-border text-foreground hover:bg-muted/60 cursor-pointer";

/** One event: its name and date, what kind it is and where, its deaths, its account and its sources. */
function Row({ e, kinds, within, open, onToggle, children }: { e: Ev; kinds: string[]; within: number; open: boolean; onToggle: () => void; children?: React.ReactNode }) {
  const meta = [kinds[e.k], e.p, e.o && `part of ${e.o}`].filter(Boolean).join(" · ");
  return (
    <li className="px-3 py-2 flex flex-col gap-0.5 min-w-0">
      <p className="text-xs font-sans text-foreground flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold min-w-0">
          {e.t}
          {e.f && <span className="ml-2 align-middle text-[9px] font-mono uppercase tracking-wider px-1.5 py-px rounded-full border border-border text-muted-foreground">took part</span>}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{e.w || "date not recorded"}</span>
      </p>
      {meta && <p className="text-[10px] font-sans text-muted-foreground">{meta}</p>}
      {e.d && <p className="text-[10px] font-sans text-foreground">Deaths: {e.d}</p>}
      {(e.s || e.x) && (
        <p className="text-[11px] font-sans text-muted-foreground leading-snug">
          {e.x || e.s}
          {e.x && e.s && !e.x.toLowerCase().includes(e.s.toLowerCase()) ? ` (${e.s})` : ""}
        </p>
      )}
      {e.l && e.l.length > 0 && (
        <p className="text-[10px] font-sans text-muted-foreground">
          {e.l.map(([label, url], i) => (
            <span key={url + i}>
              {i > 0 && " · "}
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                {label}
              </a>
            </span>
          ))}
        </p>
      )}
      {within > 0 && (
        <button type="button" onClick={onToggle} aria-expanded={open} className="mt-1 self-start flex items-center gap-1 text-[10px] font-semibold font-sans text-foreground hover:underline cursor-pointer">
          {open ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />}
          {fmt(within)} {within === 1 ? "account" : "accounts"} within it
        </button>
      )}
      {open && children}
    </li>
  );
}

/** The events listed within one, a page at a time. */
function Within({ ids, file }: { ids: number[]; file: File }) {
  const [shown, setShown] = useState(PAGE);
  return (
    <div className="mt-1.5 ml-2 pl-2 border-l border-border flex flex-col gap-1.5">
      <ul className="divide-y divide-border">
        {ids.slice(0, shown).map((i) => (
          <Row key={i} e={file.events[i]} kinds={file.kinds} within={0} open={false} onToggle={() => {}} />
        ))}
      </ul>
      {ids.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className={moreButton}>
          Show more · {fmt(shown)} of {fmt(ids.length)} shown
        </button>
      )}
    </div>
  );
}

export function NewsHistory({ initial }: { /** The country the page has picked, where it has one. */ initial?: string }) {
  const [code, setCode] = useState(initial && COUNTRIES.some((c) => c.code === initial) ? initial : "US");
  useEffect(() => {
    if (initial && COUNTRIES.some((c) => c.code === initial)) setCode(initial);
  }, [initial]);
  const [kind, setKind] = useState<Kind>("unrest");
  const [query, setQuery] = useState("");
  const [sub, setSub] = useState("all");
  const [oldest, setOldest] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [extra, setExtra] = useState<Extra | null>(null);
  const [file, setFile] = useState<{ code: string; f: File | null } | null>(null);
  useEffect(() => {
    let off = false;
    loadExtra().then((d) => !off && setExtra(d));
    return () => {
      off = true;
    };
  }, []);
  useEffect(() => {
    let off = false;
    loadCountry(code).then((f) => !off && setFile({ code, f }));
    return () => {
      off = true;
    };
  }, [code]);
  // A new country or kind starts from the top, unfiltered.
  useEffect(() => {
    setQuery("");
    setSub("all");
    setShown(PAGE);
    setOpen(new Set());
  }, [code, kind]);

  const name = COUNTRIES.find((c) => c.code === code)?.name ?? code;
  const ready = extra && file && file.code === code ? file.f : undefined;
  const kindIndex = useMemo(() => new Map((extra?.kinds ?? []).map((k, i) => [k, i])), [extra]);

  // Each kind's events: all of them, the top level, and what is listed within each.
  const of = useMemo(() => {
    if (!ready) return null;
    const by = new Map<number, { all: number[]; top: number[]; within: Map<number, number[]> }>();
    ready.events.forEach((e, i) => {
      const g = by.get(e.c) ?? by.set(e.c, { all: [], top: [], within: new Map() }).get(e.c)!;
      g.all.push(i);
      if (e.u == null) g.top.push(i);
      else (g.within.get(e.u) ?? g.within.set(e.u, []).get(e.u)!).push(i);
    });
    return by;
  }, [ready]);
  const g = of?.get(kindIndex.get(kind) ?? -1);
  const count = (k: Kind) => of?.get(kindIndex.get(k) ?? -1)?.all.length ?? 0;

  // What this kind's records call its events, with how many of each, for the filter.
  const subOptions = useMemo(() => {
    if (!ready || !g) return [];
    const n = new Map<number, number>();
    for (const i of g.all) n.set(ready.events[i].k, (n.get(ready.events[i].k) ?? 0) + 1);
    return [
      { value: "all", label: `Every kind · ${fmt(g.all.length)}` },
      ...[...n].sort((a, b) => b[1] - a[1]).map(([k, c]) => ({ value: String(k), label: `${ready.kinds[k] || "Not classed"} · ${fmt(c)}` })),
    ];
  }, [ready, g]);

  // A search or a filter lists every match, those within others too; otherwise the top level, with what is within each.
  const list = useMemo(() => {
    if (!ready || !g) return [];
    const q = query.trim().toLowerCase();
    const flat = q !== "" || sub !== "all";
    let ids = flat
      ? g.all.filter((i) => {
          const e = ready.events[i];
          if (sub !== "all" && String(e.k) !== sub) return false;
          return !q || `${e.t} ${e.p ?? ""} ${e.s ?? ""} ${e.o ?? ""} ${e.w ?? ""}`.toLowerCase().includes(q);
        })
      : g.top;
    if (oldest) ids = [...ids.filter((i) => ready.events[i].y != null).reverse(), ...ids.filter((i) => ready.events[i].y == null)];
    return ids;
  }, [ready, g, query, sub, oldest]);
  const flat = query.trim() !== "" || sub !== "all";
  const tab = TABS.find((t) => t.id === kind)!;
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (!n.delete(i)) n.add(i);
      return n;
    });

  return (
    <section aria-labelledby="news-history" className="mt-8 mb-6">
      <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
        <h2 id="news-history" className="text-sm font-bold font-sans text-foreground">
          Historic accounts
        </h2>
        <span className="text-[10px] font-sans text-muted-foreground">each kind of event in one country, as the records hold it</span>
        <span className="flex-1 h-px bg-border" aria-hidden />
        <StyledSelect
          value={code}
          onValueChange={setCode}
          options={OPTIONS}
          ariaLabel="The country whose history is shown"
          triggerClassName="px-3 py-1.5 rounded-full border border-foreground/30 bg-muted/60 hover:bg-muted hover:border-foreground/50 text-foreground font-semibold shadow-sm"
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 min-w-0">
        <div role="tablist" aria-label="The kind of event" className="flex flex-wrap items-center gap-1.5">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === kind} onClick={() => setKind(t.id)} className={chip(t.id === kind)}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} aria-hidden />
              {t.title}
              {of && <> · {fmt(count(t.id))}</>}
            </button>
          ))}
        </div>
        {ready === undefined ? (
          <p className="text-[11px] font-sans text-muted-foreground">Reading the records…</p>
        ) : (
          <div role="tabpanel" aria-label={tab.title} className="flex flex-col gap-2.5 min-w-0">
            <p className="text-[10px] font-sans text-muted-foreground leading-snug">
              The {tab.what} the records hold for {name}: {fmt(g?.all.length ?? 0)}
              {g && g.all.length > g.top.length ? `, ${fmt(g.all.length - g.top.length)} of them listed within the events they are part of` : ""}.
            </p>
            {kind === "war" && extra && (extra.conflict[code]?.length ? (
              <>
                <ConflictYears rows={extra.conflict[code]} name={name} to={extra.ucdpTo} />
                <p className="text-[10px] font-sans text-muted-foreground">
                  <a href={extra.ucdp.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    {extra.ucdp.label}
                  </a>
                </p>
              </>
            ) : (
              <p className="text-[11px] font-sans text-muted-foreground">UCDP records no deaths in armed conflict in {name} since 1989.</p>
            ))}
            {g && g.all.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`flex items-center gap-1.5 ${field} focus-within:border-foreground/40`}>
                    <MagnifyingGlass size={13} className="text-muted-foreground shrink-0" aria-hidden />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShown(PAGE);
                      }}
                      placeholder="Search these events"
                      aria-label={`Search the ${tab.title.toLowerCase()} of ${name}`}
                      className="bg-transparent w-44 sm:w-56 focus:outline-none placeholder:text-muted-foreground"
                    />
                  </label>
                  {subOptions.length > 2 && (
                    <StyledSelect
                      value={sub}
                      onValueChange={(v) => {
                        setSub(v);
                        setShown(PAGE);
                      }}
                      options={subOptions}
                      ariaLabel="The kind of event, as its record calls it"
                      triggerClassName={`px-3 py-1.5 rounded-full border border-border ${sub !== "all" ? "text-foreground font-semibold" : ""}`}
                    />
                  )}
                  <div className="flex items-center gap-1" role="group" aria-label="The order">
                    <button type="button" aria-pressed={!oldest} onClick={() => setOldest(false)} className={chip(!oldest)}>
                      Newest first
                    </button>
                    <button type="button" aria-pressed={oldest} onClick={() => setOldest(true)} className={chip(oldest)}>
                      Oldest first
                    </button>
                  </div>
                </div>
                {flat && (
                  <p className="text-[11px] font-sans text-foreground">
                    {fmt(list.length)} of {fmt(g.all.length)} {list.length === 1 ? "matches" : "match"}.
                  </p>
                )}
                {list.length > 0 ? (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {list.slice(0, shown).map((i) => {
                      const within = flat ? [] : (g.within.get(i) ?? []);
                      return (
                        <Row key={i} e={ready!.events[i]} kinds={ready!.kinds} within={within.length} open={open.has(i)} onToggle={() => toggle(i)}>
                          <Within ids={within} file={ready!} />
                        </Row>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[11px] font-sans text-muted-foreground">Nothing matches.</p>
                )}
                {list.length > shown && (
                  <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className={moreButton}>
                    Show more · {fmt(shown)} of {fmt(list.length)} shown
                  </button>
                )}
              </>
            ) : (
              <p className="text-[11px] font-sans text-muted-foreground">The records hold none for {name}.</p>
            )}
            {extra && (
              <p className="text-[10px] font-sans text-muted-foreground">
                {extra.sources.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && " · "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      {s.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 px-1 text-[10px] font-sans text-muted-foreground leading-snug">
        Every event here is one a record holds: Wikidata&#39;s items of each kind, UCDP&#39;s armed conflicts since 1946, NOAA&#39;s significant earthquakes, tsunamis (those it
        grades probable or definite) and volcanic eruptions, GDACS&#39;s orange and red alerts since 2015, and the site&#39;s record of revolutions, protests and conflicts with the
        works each account cites. An event is placed in the present-day country its record names; failing that, the country of the place it names; failing that, the point it
        gives, inside the country&#39;s outline - so an event in a state that no longer exists is listed under the country where it took place, and a war under each country its
        record names as a party, marked &quot;took part&quot;. Dates are given at the precision the record holds them, in the calendar of the time; where a record gives an event
        several dates, only what they agree on is shown. Records the site may not use - the Global Terrorism Database, ACLED, EM-DAT, WHO&#39;s outbreak news - are left out.
        These are the events the records hold, not a census: an event with no record, or none placed in a country, is not here.
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
