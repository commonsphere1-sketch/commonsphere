import { useMemo, type ReactNode } from "react";
import { SLIM_TRACK, slimFill } from "./SlimBars";
import { placeName, type Headline } from "./HeadlinesBanner";
import { COUNTRY_STATUS, COUNTRY_STATUS_RETRIEVED, COUNTRY_STATUS_SOURCES, WORLD_HEALTH_NOTICES, type CountryStatus } from "../data/countryStatus";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { CONTINENTS, CONTINENT_OF_CODE, EVENTS, inWhere, type Continent, type EventId, type Where } from "../lib/newsSubjects";

/**
 * Occurrences by region, as asked: for each kind of event - civil unrest,
 * revolutions and coups, wars, terrorism, natural disasters and epidemics -
 * what the public bodies that record it have on file for each continent,
 * beside the headlines about it there in the window the reader picked.
 *
 * Nothing is estimated. Each record is the body's own: the State
 * Department's travel advisories (the reasons its summary sentence names),
 * UCDP's deaths in armed conflict, GDACS's orange and red disaster alerts,
 * and the CDC's travel health notices. A body's figures for a continent are
 * its figures for the continent's countries added up here, each alert or
 * notice counted once however many countries it names. Revolutions and
 * coups have no running count that a commercial site may use, and the
 * terrorism database that has one is not used, so those are headlines and
 * advisories alone - and a headline count is of headlines, not of events.
 */

type Row = { value: number; text: string; detail?: string };
type Official = {
  /** What the bars measure: "Countries whose US travel advisory names unrest". */
  measure: string;
  rows: Map<Continent, Row>;
  world: string;
  /** A second record, in words under each row's figure. */
  also?: { label: string; rows: Map<Continent, string> };
  /** `read` is the day a body's notices were read, for those that go out of date. */
  sources: { label: string; url: string; read?: string }[];
};

const fmt = (n: number) => n.toLocaleString("en-US");
const STATUS = Object.entries(COUNTRY_STATUS) as [string, CountryStatus][];
const inContinent = (c: Continent) => STATUS.filter(([cc]) => CONTINENT_OF_CODE.get(cc) === c);
const nameOf = (cc: string) => placeName(`c:${cc}`) ?? cc;
const STATE_DEPT = { label: COUNTRY_STATUS_SOURCES.us.label, url: COUNTRY_STATUS_SOURCES.us.url, read: COUNTRY_STATUS_RETRIEVED };

/** The countries whose State Department advisory gives this as a reason, of those with an advisory. */
function advisories(re: RegExp): { rows: Map<Continent, Row>; world: string; words: Map<Continent, string> } {
  const rows = new Map<Continent, Row>();
  const words = new Map<Continent, string>();
  let named = 0;
  let held = 0;
  for (const c of CONTINENTS) {
    const withOne = inContinent(c).filter(([, s]) => s.us?.length);
    const naming = withOne.filter(([, s]) => s.us!.some((a) => re.test(a.why ?? "")));
    named += naming.length;
    held += withOne.length;
    const text = `${naming.length} of ${withOne.length} countries`;
    rows.set(c, { value: naming.length, text, detail: naming.map(([cc]) => nameOf(cc)).join(", ") || undefined });
    words.set(c, `${naming.length} of ${withOne.length}`);
  }
  return { rows, words, world: `${named} of the ${held} countries with an advisory` };
}

const UNREST = advisories(/\b(unrest|political violence)\b/i);
const TERROR = advisories(/\bterrorism\b/i);
const ARMED = advisories(/\barmed conflict\b/i);

/* UCDP's deaths in armed conflict in the year it last gives, by where they took place. */
const UCDP_YEAR = PUBLIC_SECURITY_SOURCES.ucdp.year;
const CONFLICT: Official = (() => {
  const rows = new Map<Continent, Row>();
  let all = 0;
  let places = 0;
  for (const c of CONTINENTS) {
    const hit = Object.entries(PUBLIC_SECURITY)
      .filter(([cc, p]) => CONTINENT_OF_CODE.get(cc) === c && p.conflict?.y === UCDP_YEAR)
      .map(([cc, p]) => ({ cc, n: p.conflict!.stateBased + p.conflict!.nonState + p.conflict!.oneSided }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n);
    const deaths = hit.reduce((s, x) => s + x.n, 0);
    all += deaths;
    places += hit.length;
    rows.set(c, {
      value: deaths,
      text: `${fmt(deaths)} in ${hit.length} ${hit.length === 1 ? "country" : "countries"}`,
      detail: hit.map((x) => `${nameOf(x.cc)} ${fmt(x.n)}`).join(", ") || undefined,
    });
  }
  return {
    measure: `Deaths in armed conflict, ${UCDP_YEAR}: in fighting involving states, between other armed groups, and of civilians targeted - UCDP's best estimates, added up here by where they took place`,
    rows,
    world: `${fmt(all)} in ${places} countries`,
    also: { label: "US advisories naming armed conflict", rows: ARMED.words },
    sources: [{ label: PUBLIC_SECURITY_SOURCES.ucdp.label, url: PUBLIC_SECURITY_SOURCES.ucdp.url }, STATE_DEPT],
  };
})();

/* GDACS's orange and red alerts, current or ended in the last 30 days: each counted once, however many countries it names. */
const DISASTERS: Official = (() => {
  const rows = new Map<Continent, Row>();
  const every = new Set<string>();
  for (const c of CONTINENTS) {
    const by = new Map<string, { kind: string; name?: string; alert: string; current?: true; where: string[] }>();
    for (const [cc, s] of inContinent(c))
      for (const h of s.hazards ?? []) {
        const e = by.get(h.url) ?? { kind: h.kind, name: h.name, alert: h.alert, current: h.current, where: [] };
        e.where.push(nameOf(cc));
        by.set(h.url, e);
        every.add(h.url);
      }
    const list = [...by.values()];
    const now = list.filter((e) => e.current).length;
    rows.set(c, {
      value: list.length,
      text: `${list.length} alert${list.length === 1 ? "" : "s"}${now ? `, ${now} still in force` : ""}`,
      detail: list.map((e) => `${e.kind}${e.name ? `, ${e.name}` : ""} (${e.alert}): ${e.where.join(", ")}`).join("; ") || undefined,
    });
  }
  return {
    measure: "Orange and red disaster alerts - earthquakes, cyclones, floods, eruptions, droughts and fires - in force or ended within the last 30 days, each counted once",
    rows,
    world: `${every.size} alerts`,
    sources: [{ label: COUNTRY_STATUS_SOURCES.gdacs.label, url: COUNTRY_STATUS_SOURCES.gdacs.url, read: COUNTRY_STATUS_RETRIEVED }],
  };
})();

/* The CDC's travel health notices in force: each counted once, however many countries it names. */
const EPIDEMICS: Official = (() => {
  const rows = new Map<Continent, Row>();
  const every = new Set<string>();
  for (const c of CONTINENTS) {
    const by = new Map<string, string>();
    for (const [, s] of inContinent(c))
      for (const n of s.health ?? []) {
        by.set(n.url, `${n.title} (level ${n.level})`);
        every.add(n.url);
      }
    rows.set(c, { value: by.size, text: `${by.size} notice${by.size === 1 ? "" : "s"}`, detail: [...by.values()].join("; ") || undefined });
  }
  const world = WORLD_HEALTH_NOTICES.map((n) => n.title).join(", ");
  return {
    measure: `Travel health notices in force for an outbreak or a health risk, each counted once${world ? `; besides them, for the whole world: ${world}` : ""}`,
    rows,
    world: `${every.size} notices`,
    sources: [{ label: COUNTRY_STATUS_SOURCES.cdc.label, url: COUNTRY_STATUS_SOURCES.cdc.url, read: COUNTRY_STATUS_RETRIEVED }],
  };
})();

const OFFICIAL: Partial<Record<EventId, Official>> = {
  unrest: { measure: "Countries whose US travel advisory gives unrest or political violence as a reason", rows: UNREST.rows, world: UNREST.world, sources: [STATE_DEPT] },
  war: CONFLICT,
  terror: { measure: "Countries whose US travel advisory gives terrorism as a reason", rows: TERROR.rows, world: TERROR.world, sources: [STATE_DEPT] },
  disaster: DISASTERS,
  epidemic: EPIDEMICS,
};

const COLOR: Record<EventId, string> = {
  unrest: "#f59e0b",
  revolution: "#8b5cf6",
  war: "#ef4444",
  terror: "#f97316",
  disaster: "#14b8a6",
  epidemic: "#0ea5e9",
};

/** A picked country's own record of the event; a US state's is its country's. */
function ownRecord(id: EventId, cc: string): ReactNode {
  const s = COUNTRY_STATUS[cc];
  const advisory = (re: RegExp) => {
    const a = s?.us?.find((x) => re.test(x.why ?? "")) ?? s?.us?.[0];
    if (!a) return "No US advisory held.";
    return re.test(a.why ?? "") ? `Its US advisory (level ${a.level}, ${a.issued}) names it.` : `Its US advisory (level ${a.level}) does not name it.`;
  };
  if (id === "unrest") return advisory(/\b(unrest|political violence)\b/i);
  if (id === "terror") return advisory(/\bterrorism\b/i);
  if (id === "war") {
    const c = PUBLIC_SECURITY[cc]?.conflict;
    const deaths = c && c.y === UCDP_YEAR ? c.stateBased + c.nonState + c.oneSided : null;
    return `${deaths === null ? `No UCDP figure for ${UCDP_YEAR}.` : `${fmt(deaths)} deaths in armed conflict in ${UCDP_YEAR} (UCDP).`} ${advisory(/\barmed conflict\b/i)}`;
  }
  if (id === "disaster") {
    const h = s?.hazards ?? [];
    return h.length ? h.map((x) => `${x.kind}${x.name ? `, ${x.name}` : ""} (${x.alert}${x.current ? ", in force" : ""})`).join("; ") : "No orange or red alert in the last 30 days.";
  }
  if (id === "epidemic") {
    const n = s?.health ?? [];
    return n.length ? n.map((x) => `${x.title} (level ${x.level})`).join("; ") : "No CDC notice for it alone.";
  }
  return "No body's record is used for these; headlines only.";
}

function Bar({ share, color }: { share: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: SLIM_TRACK }} aria-hidden>
      {share > 0 && <div className="h-full rounded-full" style={{ width: `${Math.max(3, share * 100)}%`, background: slimFill(color) }} />}
    </div>
  );
}

export function NewsTracker({
  rows,
  days,
  where,
  onPick,
}: {
  /** The headlines read for the page's window. */
  rows: Headline[];
  /** The window's length, for the headline counts' label. */
  days: number;
  /** The page's place, for a picked country's own record. */
  where: Where;
  /** Lists a continent's headlines about an event. */
  onPick: (where: Where, event: EventId) => void;
}) {
  // Headlines about each event in each continent, over the window: worked out here from the words of the headline.
  const counts = useMemo(() => {
    const out = new Map<EventId, Map<Continent, number>>();
    const byContinent = new Map(CONTINENTS.map((c) => [c, rows.filter(inWhere(`cont:${c}`))]));
    for (const e of EVENTS) out.set(e.id, new Map(CONTINENTS.map((c) => [c, byContinent.get(c)!.filter((h) => e.re.test(h.title)).length])));
    return out;
  }, [rows]);
  const picked = where.startsWith("c:") ? where.slice(2) : where.startsWith("s:") ? "US" : null;
  const pickedName = picked ? (where.startsWith("s:") ? `${placeName(where)} (the United States' record)` : nameOf(picked)) : null;
  const window = days === 1 ? "the last day" : days === 2 ? "the last two days" : "the last week";

  return (
    <section aria-labelledby="news-tracker" className="mb-6">
      <div className="flex items-baseline gap-3 px-1 pb-3">
        <h2 id="news-tracker" className="text-sm font-bold font-sans text-foreground">
          Tracked by region
        </h2>
        <span className="text-[10px] font-sans text-muted-foreground">public bodies' records, and the headlines of {window}</span>
        <span className="flex-1 h-px bg-border" aria-hidden />
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {EVENTS.map((e) => {
          const off = OFFICIAL[e.id];
          const heads = counts.get(e.id)!;
          const top = off ? Math.max(...[...off.rows.values()].map((r) => r.value), 0) : Math.max(...heads.values(), 0);
          const total = [...heads.values()].reduce((s, n) => s + n, 0);
          return (
            <div key={e.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5">
              <div>
                <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR[e.id] }} aria-hidden />
                  {e.label}
                </h3>
                <p className="mt-1 text-[10px] font-sans text-muted-foreground leading-snug">
                  {off ? off.measure : "The site holds no running count of these from a body whose terms let a commercial site use it, so the bars are headlines."}
                </p>
              </div>
              {pickedName && picked && (
                <p className="text-[11px] font-sans leading-snug rounded-lg px-2.5 py-1.5 bg-muted/60 text-foreground">
                  <span className="font-semibold">{pickedName}: </span>
                  {ownRecord(e.id, picked)}
                </p>
              )}
              <ul className="flex flex-col gap-1.5">
                {CONTINENTS.map((c) => {
                  const r = off?.rows.get(c);
                  const n = heads.get(c) ?? 0;
                  const value = off ? (r?.value ?? 0) : n;
                  return (
                    <li key={c} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-x-2 text-[11px] font-sans" title={r?.detail}>
                      <span className="text-foreground truncate">{c}</span>
                      <Bar share={top ? value / top : 0} color={COLOR[e.id]} />
                      <span className="flex items-center gap-2 justify-end whitespace-nowrap">
                        {off && <span className="text-foreground tabular-nums">{r?.text ?? "Not held"}</span>}
                        <button
                          type="button"
                          onClick={() => onPick(`cont:${c}`, e.id)}
                          disabled={!n}
                          className="text-[10px] tabular-nums text-muted-foreground underline decoration-dotted hover:text-foreground disabled:no-underline disabled:cursor-default cursor-pointer"
                          aria-label={`List the ${n} headlines about ${e.label.toLowerCase()} in ${c}`}
                        >
                          {fmt(n)} headline{n === 1 ? "" : "s"}
                        </button>
                      </span>
                      {off?.also && <span className="col-start-2 col-span-2 text-[10px] text-muted-foreground">{off.also.label}: {off.also.rows.get(c)}</span>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-auto pt-1 text-[10px] font-sans text-muted-foreground leading-snug">
                {off && <>World: {off.world}. </>}
                {fmt(total)} headlines name a continent's place in {window}; one naming two continents counts in both.{" "}
                {off && (
                  <>
                    {off.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && "; "}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                          {s.label}
                        </a>
                        {s.read && `, read ${s.read}`}
                      </span>
                    ))}
                    .
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[10px] font-sans text-muted-foreground leading-snug">
        A body's figure for a continent is its figures for the continent's countries added up here; hover a row for the countries,
        alerts or notices behind it. The State Department gives reasons only in the advisories above its first level, so a country
        whose advisory names none is not a finding that all is calm there. A headline count is of headlines that match the event's
        words, not of events: one event can make many headlines, and a quiet one none. Press a count to list those headlines below.
      </p>
    </section>
  );
}
