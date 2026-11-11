/**
 * Under the Worldview page's map, as asked: the account of a conflict or a disaster pressed on it - the conflicts of UCDP's
 * latest monthly release and the disasters GDACS holds as going on now - with the deadliest places and the disasters by
 * alert listed beside it, each pressed to be told and shown on the map.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowSquareOut, MagnifyingGlass } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import type { Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import { CONFLICT_EVENTS_META, CONFLICT_KINDS, CONFLICT_SOURCES } from "../data/conflictEventsMeta";
import { GDACS_SOURCES, HAZARD_KINDS, HAZARD_PLURAL, type Hazard, type HazardAlert, type HazardKind } from "../lib/gdacsLive";
import {
  ALERT_SAID,
  CONFLICT_KIND_SAID,
  acrossBorder,
  involves,
  CONFLICT_PRECISION,
  alertInks,
  conflictInks,
  dayOf,
  daysOf,
  hazardSource,
  monthOf,
  sidesOf,
  type ConflictLayer,
} from "../lib/conflictEvents";

export type Occurrence = { kind: "conflict"; i: number } | { kind: "hazard"; id: string };
const ALERT_ORDER: HazardAlert[] = ["Red", "Orange", "Green"];
/** How closely UCDP placed a listed place's events, where not to the spot (its "where_prec", 3 to 7). */
const PLACED: Record<number, string> = { 3: "district only", 4: "province only", 5: "roughly", 6: "country only", 7: "at sea or in the air" };

const ROW = "w-full flex items-center gap-2 px-2 py-1.5 rounded-[0.5rem] text-left cursor-pointer transition-colors hover:bg-muted/60";

/** Every country the site holds, for the section's search: by name, with its continent. */
const COUNTRIES = countriesData.filter((c) => !c.uninhabited).map((c) => ({ code: c.code, name: c.name, continent: c.continent }));
/** Folded for matching: no case and no accents, so "turkiye" finds Türkiye. */
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** The section's search, as asked: any country, chosen to have its conflicts and disasters told - made as the Dashboard's place search is. */
export function CountryFind({ onPick, label = "Choose a country to see its conflicts and disasters" }: { onPick: (c: { code: string; name: string }) => void; /** What the search is for, said to a screen reader. */ label?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => {
    const f = fold(q.trim());
    if (!f) return [];
    // Names that begin with what is typed first, then those that hold it.
    const starts = COUNTRIES.filter((c) => fold(c.name).startsWith(f));
    const holds = COUNTRIES.filter((c) => !fold(c.name).startsWith(f) && fold(c.name).includes(f));
    return [...starts, ...holds].slice(0, 10);
  }, [q]);
  useEffect(() => setAt(0), [q]);
  useEffect(() => {
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);
  const go = (c: (typeof COUNTRIES)[number]) => {
    setOpen(false);
    setQ("");
    onPick({ code: c.code, name: c.name });
  };
  return (
    <div ref={box} className="relative w-48 sm:w-56 shrink-0">
      <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 transition-colors focus-within:border-foreground/40">
        <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
        <input
          type="search"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value.slice(0, 60));
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!hits.length) return;
            if (e.key === "ArrowDown") setAt((i) => Math.min(hits.length - 1, i + 1));
            else if (e.key === "ArrowUp") setAt((i) => Math.max(0, i - 1));
            else if (e.key === "Enter") go(hits[at]);
            else if (e.key === "Escape") setOpen(false);
            else return;
            e.preventDefault();
          }}
          placeholder="Search a country"
          aria-label={label}
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="occurrence-country-hits"
          className="flex-1 min-w-0 bg-transparent text-[11px] font-medium font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </label>
      {open && q.trim().length > 0 && (
        <ul id="occurrence-country-hits" role="listbox" className="absolute right-0 top-full mt-1.5 w-[min(18rem,calc(100vw-2rem))] max-h-80 overflow-y-auto modal-glass border rounded-xl shadow-lg py-1 z-30">
          {hits.map((c, i) => (
            <li key={c.code} role="option" aria-selected={i === at}>
              <button type="button" onClick={() => go(c)} onMouseEnter={() => setAt(i)} className={`w-full text-left px-3 py-1.5 flex items-baseline gap-2 cursor-pointer ${i === at ? "bg-muted/60" : ""}`}>
                <span className="text-[12px] font-semibold font-sans text-foreground truncate">{c.name}</span>
                <span className="text-[10px] font-sans text-muted-foreground truncate flex-1 min-w-0">{c.continent}</span>
              </button>
            </li>
          ))}
          {hits.length === 0 && <li className="px-3 py-2 text-[11px] font-sans text-muted-foreground">No country by that name.</li>}
        </ul>
      )}
    </div>
  );
}

/** One list of the country picked: the first six, and the rest on asking. */
function Group({ t, title, sub, empty, items }: { t: Tokens; title: string; sub?: string; empty: string; items: ReactNode[] }) {
  const [all, setAll] = useState(false);
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold font-sans px-2" style={{ color: t.headText }}>
        {title}
      </p>
      {sub && (
        <p className="text-[10px] font-mono px-2 mt-0.5" style={{ color: t.mutedText }}>
          {sub}
        </p>
      )}
      <div className="mt-1">
        {items.length ? (
          (all ? items : items.slice(0, 6))
        ) : (
          <p className="text-[11px] font-sans px-2 leading-snug" style={{ color: t.mutedText }}>
            {empty}
          </p>
        )}
      </div>
      {items.length > 6 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="text-[10px] font-sans px-2 mt-1 cursor-pointer underline-offset-2 hover:underline" style={{ color: t.mutedText }}>
          {all ? "Fewer" : `All ${items.length}`}
        </button>
      )}
    </div>
  );
}

export function OccurrencePanel({
  t,
  show,
  conflicts,
  hazards,
  hazardsAt,
  hazardsFailed,
  occurrence,
  onSelect,
  countryAt,
  onPickCountry,
  picked,
}: {
  t: Tokens;
  /** The country picked on the map: its conflicts and disasters head the panel. */
  picked: { code: string; name: string };
  show: { conflicts: boolean; hazards: boolean };
  conflicts: ConflictLayer | null;
  hazards: Hazard[] | null;
  hazardsAt: Date | null;
  hazardsFailed: boolean;
  occurrence: Occurrence | null;
  onSelect: (o: Occurrence, lon: number, lat: number) => void;
  countryAt: (lon: number, lat: number) => { code: string; name: string } | null;
  onPickCountry: (code: string) => void;
}) {
  const cInk = conflictInks(t.isLight);
  const aInk = alertInks(t.isLight);
  /* The country told: the one picked on the map, or another searched for here; a new pick on the map is followed. */
  const [focus, setFocus] = useState(picked);
  useEffect(() => setFocus({ code: picked.code, name: picked.name }), [picked.code, picked.name]);
  const row = occurrence?.kind === "conflict" && conflicts ? conflicts.rows[occurrence.i] : undefined;
  const hazard = occurrence?.kind === "hazard" && hazards ? hazards.find((h) => h.id === occurrence.id) : undefined;
  const byAlert = hazards ? [...hazards].sort((a, b) => ALERT_ORDER.indexOf(a.alert) - ALERT_ORDER.indexOf(b.alert) || b.updated.localeCompare(a.updated)) : [];
  /* The country picked: the places inside its borders, those beyond them where its government is a side, and its disasters. */
  const mine = useMemo(() => {
    const rows = conflicts ? conflicts.rows.map((r, i) => [r, i] as const) : [];
    return {
      inside: rows.filter(([r]) => r[11] === focus.code),
      abroad: conflicts ? rows.filter(([r]) => r[11] !== focus.code && involves(r, conflicts.dyads, focus.code)) : [],
      disasters: hazards ? hazards.filter((h) => h.codes.includes(focus.code)).sort((a, b) => ALERT_ORDER.indexOf(a.alert) - ALERT_ORDER.indexOf(b.alert)) : [],
    };
  }, [conflicts, hazards, focus.code]);
  const conflictRow = (r: (typeof mine.inside)[number][0], i: number) => (
    <button
      key={`c${i}`}
      type="button"
      onClick={() => onSelect({ kind: "conflict", i }, r[0], r[1])}
      aria-pressed={occurrence?.kind === "conflict" && occurrence.i === i}
      className={`${ROW} ${occurrence?.kind === "conflict" && occurrence.i === i ? "bg-muted/60" : ""}`}
    >
      <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: cInk[r[2]] }} />
      <span className="text-[11px] font-sans flex-1 min-w-0 leading-snug" style={{ color: t.headText }}>
        {r[5]}
        {PLACED[r[10]] && <span style={{ color: t.mutedText }}> · {PLACED[r[10]]}</span>}
      </span>
      <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
        {r[4].toLocaleString("en")}
      </span>
    </button>
  );
  const hazardRow = (h: Hazard) => (
    <button
      key={h.id}
      type="button"
      onClick={() => onSelect({ kind: "hazard", id: h.id }, h.lon, h.lat)}
      aria-pressed={occurrence?.kind === "hazard" && occurrence.id === h.id}
      className={`${ROW} ${occurrence?.kind === "hazard" && occurrence.id === h.id ? "bg-muted/60" : ""}`}
    >
      <span aria-hidden className="w-2 h-2 rounded-full shrink-0 border-[1.5px]" style={{ borderColor: aInk[h.alert], background: `${aInk[h.alert]}33` }} />
      <span className="text-[11px] font-sans truncate flex-1" style={{ color: t.headText }}>
        {h.name}
      </span>
      <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
        {h.alert}
      </span>
    </button>
  );
  const killed = (rows: typeof mine.inside) => rows.reduce((a, [r]) => a + r[4], 0).toLocaleString("en");
  // Worked out for the one pressed only, not on every redrawing of the map above.
  const where = useMemo(() => (row ? countryAt(row[0], row[1]) : hazard ? countryAt(hazard.lon, hazard.lat) : null), [row, hazard, countryAt]);

  const countryButton = where && (
    <button
      type="button"
      onClick={() => onPickCountry(where.code)}
      className="mt-3 px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
    >
      {where.name}'s figures
    </button>
  );

  return (
    <section id="occurrences" className="scroll-mt-36 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }} aria-label="Conflicts and disasters going on">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest flex-1" style={{ color: t.mutedText }}>
          Conflicts and disasters going on
        </p>
        <CountryFind onPick={setFocus} />
      </div>
      {/* The country picked, as asked: what is going on inside its borders, what its government is a side to beyond them, and its disasters. */}
      <div key={focus.code} className="px-2 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <div className="flex flex-wrap items-center gap-2 px-2">
          <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
            {focus.name} · now
          </p>
          {focus.code !== picked.code && (
            <button
              type="button"
              onClick={() => setFocus({ code: picked.code, name: picked.name })}
              className="px-2 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              Back to {picked.name}, picked on the map
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {show.conflicts && conflicts && (
            <>
              <Group
                t={t}
                title="Inside its borders"
                sub={mine.inside.length ? `${mine.inside.length} place${mine.inside.length === 1 ? "" : "s"} · ${killed(mine.inside)} killed · ${monthOf(conflicts.month)}` : undefined}
                empty={`UCDP recorded no fatal event of organised violence in ${focus.name} in ${monthOf(conflicts.month)}.`}
                items={mine.inside.map(([r, i]) => conflictRow(r, i))}
              />
              <Group
                t={t}
                title="Its government, beyond them"
                sub={mine.abroad.length ? `${mine.abroad.length} place${mine.abroad.length === 1 ? "" : "s"} · ${killed(mine.abroad)} killed · ${monthOf(conflicts.month)}` : undefined}
                empty={`${focus.name}'s government is a side to no fatal event beyond its borders in ${monthOf(conflicts.month)}.`}
                items={mine.abroad.map(([r, i]) => conflictRow(r, i))}
              />
            </>
          )}
          {show.hazards && hazards && (
            <Group
              t={t}
              title="Its disasters now"
              sub={mine.disasters.length ? `${mine.disasters.length} current, by GDACS` : undefined}
              empty={`GDACS holds no current disaster in ${focus.name}.`}
              items={mine.disasters.map(hazardRow)}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* The account of the one pressed. */}
        <div className="p-4 min-w-0" aria-live="polite">
          {row && conflicts ? (
            <>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: cInk[row[2]] }}>
                Armed conflict · {CONFLICT_KINDS[row[2]]}
              </p>
              <h3 className="text-lg font-semibold font-sans leading-snug mt-0.5" style={{ color: t.headText }}>
                {row[5]}
              </h3>
              <p className="text-[13px] font-sans mt-1" style={{ color: t.bodyText }}>
                <span className="font-mono font-semibold" style={{ color: t.headText }}>
                  {row[4].toLocaleString("en")}
                </span>{" "}
                killed, UCDP's best estimate, in {row[3]} event{row[3] === 1 ? "" : "s"} · {daysOf(row[7], row[8])}
              </p>
              <p className="text-[11px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
                {CONFLICT_KIND_SAID[row[2]]}
                {CONFLICT_PRECISION[row[10]] ? ` ${CONFLICT_PRECISION[row[10]]}.` : ""}
                {row[9] ? ` UCDP is still checking ${row[9] === row[3] ? (row[3] === 1 ? "this event" : "these events") : `${row[9]} of these events`}, and may revise ${row[9] === 1 ? "it" : "them"}.` : ""}
              </p>
              {/* A government fighting outside its own country: an incursion, a strike or a deployment across a border. */}
              {acrossBorder(row, conflicts.dyads).length > 0 && (
                <p className="text-[11px] font-sans font-medium leading-snug mt-1.5" style={{ color: t.headText }}>
                  Across a border: {acrossBorder(row, conflicts.dyads).map((g) => `the ${g.name}`).join(" and ")}, fighting in {row[5].split(", ").pop()}.
                </p>
              )}
              {/* Each pair of sides fighting here: its conflict, its deaths, and who they were, as UCDP splits them. */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {row[6].map((part) => {
                  const d = conflicts.dyads[part[0]];
                  const split = part.length > 3 ? ([[d[1], part[3]], [d[2], part[4]], ["Civilians", part[5]], ["Not known", part[6]]] as [string, number][]).filter(([, n]) => n > 0) : [];
                  return (
                    <div key={part[0]} className="rounded-xl border p-3" style={{ borderColor: t.gridLine }}>
                      <p className="text-[12px] font-semibold font-sans leading-snug" style={{ color: t.headText }}>
                        {sidesOf(d)}
                      </p>
                      <p className="text-[10px] font-sans mt-0.5" style={{ color: t.mutedText }}>
                        {d[0]} · {CONFLICT_KINDS[d[3]]}
                      </p>
                      <p className="text-[11px] font-sans mt-1.5" style={{ color: t.bodyText }}>
                        <span className="font-mono font-semibold">{part[2].toLocaleString("en")}</span> killed in {part[1]} event{part[1] === 1 ? "" : "s"}
                      </p>
                      {split.length > 0 && (
                        <p className="text-[10px] font-sans mt-1 leading-snug" style={{ color: t.mutedText }}>
                          The dead, by side: {split.map(([who, n]) => `${who} ${n.toLocaleString("en")}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {countryButton}
              <SourceLink sources={CONFLICT_SOURCES} className="mt-3" />
            </>
          ) : hazard ? (
            <>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: aInk[hazard.alert] }}>
                {HAZARD_KINDS[hazard.kind]} · {hazard.alert} alert
              </p>
              <h3 className="text-lg font-semibold font-sans leading-snug mt-0.5" style={{ color: t.headText }}>
                {hazard.name}
              </h3>
              {hazard.severity && (
                <p className="text-[13px] font-sans mt-1" style={{ color: t.bodyText }}>
                  {hazard.severity}
                </p>
              )}
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[11px] font-sans">
                <dt style={{ color: t.mutedText }}>When</dt>
                <dd style={{ color: t.bodyText }}>{daysOf(hazard.from, hazard.to || hazard.from)}</dd>
                {(hazard.affected.length > 0 || hazard.country) && (
                  <>
                    <dt style={{ color: t.mutedText }}>{hazard.affected.length > 1 ? "Countries" : "Country"}</dt>
                    <dd style={{ color: t.bodyText }}>{hazard.affected.length ? hazard.affected.join(", ") : hazard.country}</dd>
                  </>
                )}
                {hazard.source && (
                  <>
                    <dt style={{ color: t.mutedText }}>From</dt>
                    <dd style={{ color: t.bodyText }}>{hazardSource(hazard.kind, hazard.source).replace(/^the /, "The ")}, by way of GDACS</dd>
                  </>
                )}
                {hazard.updated && (
                  <>
                    <dt style={{ color: t.mutedText }}>Updated</dt>
                    <dd style={{ color: t.bodyText }}>
                      {dayOf(hazard.updated)} {hazard.updated.slice(11, 16)} UTC
                    </dd>
                  </>
                )}
              </dl>
              <p className="text-[11px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
                {ALERT_SAID[hazard.alert]}
                {hazard.kind === "EQ" || hazard.kind === "TC" ? " The alert comes from GDACS's models and was not reviewed by people before it was issued." : ""} Local and national
                authorities' warnings come before GDACS's.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={hazard.report}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors inline-flex items-center gap-1.5"
                >
                  GDACS's report <ArrowSquareOut size={11} aria-hidden />
                </a>
                {countryButton}
              </div>
              <SourceLink sources={GDACS_SOURCES} className="mt-3" />
            </>
          ) : occurrence?.kind === "hazard" ? (
            <p className="text-[12px] font-sans" style={{ color: t.mutedText }}>
              That disaster is no longer among GDACS's current ones.
            </p>
          ) : (
            <p className="text-[12px] font-sans" style={{ color: t.mutedText }}>
              Press a pin on the map for its account, or one of those listed.
            </p>
          )}
        </div>

        {/* The deadliest places, and the disasters by alert: each pressed to be told and shown. */}
        <div className="p-3 border-t lg:border-t-0 lg:border-l min-w-0 flex flex-col gap-4" style={{ borderColor: t.gridLine }}>
          {show.conflicts && conflicts && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest px-2 mb-1" style={{ color: t.mutedText }}>
                The deadliest places · {monthOf(conflicts.month)}
              </p>
              {conflicts.rows.slice(0, 8).map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelect({ kind: "conflict", i }, r[0], r[1])}
                  aria-pressed={occurrence?.kind === "conflict" && occurrence.i === i}
                  className={`${ROW} ${occurrence?.kind === "conflict" && occurrence.i === i ? "bg-muted/60" : ""}`}
                >
                  <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: cInk[r[2]] }} />
                  <span className="text-[11px] font-sans truncate flex-1" style={{ color: t.headText }}>
                    {r[5]}
                    {/* A place can come twice - its events pinned exactly, and those UCDP could place only roughly in it. */}
                    {PLACED[r[10]] && <span style={{ color: t.mutedText }}> · {PLACED[r[10]]}</span>}
                  </span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                    {r[4].toLocaleString("en")}
                  </span>
                </button>
              ))}
            </div>
          )}
          {show.hazards && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest px-2 mb-1" style={{ color: t.mutedText }}>
                Disasters now · by alert
              </p>
              {hazards ? (
                <>
                  {byAlert.slice(0, 8).map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => onSelect({ kind: "hazard", id: h.id }, h.lon, h.lat)}
                      aria-pressed={occurrence?.kind === "hazard" && occurrence.id === h.id}
                      className={`${ROW} ${occurrence?.kind === "hazard" && occurrence.id === h.id ? "bg-muted/60" : ""}`}
                    >
                      <span aria-hidden className="w-2 h-2 rounded-full shrink-0 border-[1.5px]" style={{ borderColor: aInk[h.alert], background: `${aInk[h.alert]}33` }} />
                      <span className="text-[11px] font-sans truncate flex-1" style={{ color: t.headText }}>
                        {h.name}
                      </span>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
                        {h.alert}
                      </span>
                    </button>
                  ))}
                  {byAlert.length > 8 && (
                    <p className="text-[10px] font-sans px-2 mt-1" style={{ color: t.mutedText }}>
                      and {(byAlert.length - 8).toLocaleString("en")} more on the map
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] font-sans px-2" style={{ color: t.mutedText }}>
                  {hazardsFailed ? "GDACS could not be reached just now; the map tries again in ten minutes." : "Reading GDACS…"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* What the two are, and whose. */}
      <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: t.gridLine }}>
        {show.conflicts && (
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <p className="text-[10px] font-sans flex-1 min-w-[12rem] leading-snug" style={{ color: t.mutedText }}>
              Conflicts: every event of organised violence in which someone was killed in {monthOf(CONFLICT_EVENTS_META.month)}, as the Uppsala Conflict Data
              Program recorded it - {CONFLICT_EVENTS_META.events.toLocaleString("en")} events at {CONFLICT_EVENTS_META.places.toLocaleString("en")} places - from
              its monthly Candidate Events release {CONFLICT_EVENTS_META.version}
              {CONFLICT_EVENTS_META.released ? ` of ${dayOf(CONFLICT_EVENTS_META.released)}` : ""}. UCDP releases a month at a time, not more than a month behind,
              so this is the latest month there is, not today. A pin is a place and its size the deaths there, UCDP's best estimate; who they were is UCDP's
              split of it. The events are candidates, which UCDP may still revise, add to or drop, and {CONFLICT_EVENTS_META.unchecked.toLocaleString("en")} of
              them it is still checking. {CONFLICT_KINDS.map((k, i) => `${k}: ${CONFLICT_EVENTS_META.deaths[i].toLocaleString("en")} killed`).join("; ")}. A
              government's incursions and strikes across a border are among them where someone was killed, and so are armed groups' attacks on civilians - UCDP
              has no class called terrorism - but an incident in which no one died, a ship seized or an airspace crossed, is not in UCDP's records, and no open,
              checked source of those is held. UCDP files the Gaza Strip and the West Bank under Israel; they are set here under Palestine, as the site holds it.
            </p>
            <SourceLink sources={CONFLICT_SOURCES} />
          </div>
        )}
        {show.hazards && (
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <p className="text-[10px] font-sans flex-1 min-w-[12rem] leading-snug" style={{ color: t.mutedText }}>
              Disasters: every disaster GDACS - the Global Disaster Alert and Coordination System of the United Nations and the European Commission - holds as
              going on now
              {hazards
                ? `: ${(Object.keys(HAZARD_KINDS) as HazardKind[])
                    .map((k) => [k, hazards.filter((h) => h.kind === k).length] as const)
                    .filter(([, n]) => n > 0)
                    .map(([k, n]) => `${n} ${n === 1 ? HAZARD_KINDS[k].toLowerCase() : HAZARD_PLURAL[k]}`)
                    .join(", ")}`
                : ""}
              {hazardsAt ? `, read from it live at ${hazardsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""} and read again every ten
              minutes. A ring's colour is GDACS's alert level. Its earthquake and cyclone alerts come from its models and are not reviewed by people before they are
              issued.
            </p>
            <SourceLink sources={GDACS_SOURCES} />
          </div>
        )}
      </div>
    </section>
  );
}
