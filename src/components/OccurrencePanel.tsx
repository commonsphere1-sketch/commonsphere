/**
 * Under the Worldview page's map, as asked: the account of a conflict or a disaster pressed on it - the conflicts of UCDP's
 * latest monthly release and the disasters GDACS holds as going on now - with the deadliest places and the disasters by
 * alert listed beside it, each pressed to be told and shown on the map.
 */
import { useMemo } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import type { Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import { CONFLICT_EVENTS_META, CONFLICT_KINDS, CONFLICT_SOURCES } from "../data/conflictEventsMeta";
import { GDACS_SOURCES, HAZARD_KINDS, HAZARD_PLURAL, type Hazard, type HazardAlert, type HazardKind } from "../lib/gdacsLive";
import {
  ALERT_SAID,
  CONFLICT_KIND_SAID,
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
}: {
  t: Tokens;
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
  const row = occurrence?.kind === "conflict" && conflicts ? conflicts.rows[occurrence.i] : undefined;
  const hazard = occurrence?.kind === "hazard" && hazards ? hazards.find((h) => h.id === occurrence.id) : undefined;
  const byAlert = hazards ? [...hazards].sort((a, b) => ALERT_ORDER.indexOf(a.alert) - ALERT_ORDER.indexOf(b.alert) || b.updated.localeCompare(a.updated)) : [];
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
              them it is still checking. {CONFLICT_KINDS.map((k, i) => `${k}: ${CONFLICT_EVENTS_META.deaths[i].toLocaleString("en")} killed`).join("; ")}.
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
