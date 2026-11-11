/**
 * The critical zones, under the Worldview map while its chip is pressed, as asked: every country one or more of four
 * public bodies names - a travel ban, deadly conflict, a red disaster alert, a UN humanitarian appeal - with what each
 * says and a link to it, those named by the most first. Pressing a country picks it on the map.
 */
import type { Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import { CONFLICT_SOURCES } from "../data/conflictEventsMeta";
import { GDACS_SOURCES } from "../lib/gdacsLive";
import { HUMANITARIAN_PLANS_RETRIEVED, HUMANITARIAN_PLANS_SOURCE } from "../data/humanitarianPlans";
import { CRITICAL_BY, namedBy, type CriticalZones } from "../lib/criticalZones";
import { CONFLICT_KIND_SAID, dayOf, monthOf } from "../lib/conflictEvents";
import { CONFLICT_KINDS } from "../data/conflictEventsMeta";

export function CriticalZonesPanel({ t, data, ink, nameOf, onPick }: { t: Tokens; data: CriticalZones; ink: string; nameOf: (code: string) => string; onPick: (code: string) => void }) {
  const rows = [...data.zones.entries()].map(([cc, rs]) => ({ cc, rs, n: namedBy(rs), name: nameOf(cc) })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const count = (by: string) => rows.filter((r) => r.rs.some((x) => x.by === by)).length;
  const waiting = CRITICAL_BY.filter((b) => !data.read[b.id]);
  return (
    <section id="critical-zones" className="scroll-mt-36 rounded-2xl overflow-hidden" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }} aria-label="Critical zones">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 border-b" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
          Critical zones · {rows.length} countries
        </p>
        <p className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {CRITICAL_BY.map((b) => (data.read[b.id] ? `${b.chip} ${count(b.id)}` : `${b.chip} …`)).join(" · ")}
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 px-2 py-2">
        {rows.map((r) => (
          <li key={r.cc} className="px-2 py-2 border-b min-w-0" style={{ borderColor: t.gridLine }}>
            <div className="flex items-center gap-2 min-w-0">
              {/* How many of the four name it: as many dots, in the layer's red. */}
              <span className="flex gap-0.5 shrink-0" title={`Named by ${r.n} of the four`} aria-label={`Named by ${r.n} of the four`}>
                {CRITICAL_BY.map((b, i) => (
                  <span key={b.id} className="w-1.5 h-1.5 rounded-full" style={{ background: ink, opacity: i < r.n ? 1 : 0.18 }} />
                ))}
              </span>
              <button type="button" onClick={() => onPick(r.cc)} className="text-[12px] font-semibold font-sans truncate cursor-pointer hover:underline text-left" style={{ color: t.headText }} title={`Pick ${r.name} on the map`}>
                {r.name}
              </button>
              <span className="flex flex-wrap gap-1 ml-auto shrink-0">
                {CRITICAL_BY.filter((b) => r.rs.some((x) => x.by === b.id)).map((b) => (
                  <span key={b.id} className="px-1.5 py-px rounded-full text-[9px] font-sans border" style={{ borderColor: `${ink}66`, color: ink }}>
                    {b.chip}
                  </span>
                ))}
              </span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {r.rs.map((x, i) => (
                <li key={i} className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                  {x.url ? (
                    <a href={x.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {x.said}
                    </a>
                  ) : (
                    x.said
                  )}
                  {/* The kind of disturbance it is, in the body's own terms. */}
                  {x.what && (
                    <span className="block" style={{ color: t.headText }}>
                      {x.what}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
        <p className="text-[10px] font-sans flex-1 min-w-[12rem] leading-snug" style={{ color: t.mutedText }}>
          A country is drawn here where one or more of four public bodies names it: {CRITICAL_BY.map((b) => `${b.chip.toLowerCase()} - ${b.is}`).join("; ")}. The more of the four that name it, the more solid its red,
          and the dots beside its name say how many. The travel advice was read on {data.advisedOn ? dayOf(data.advisedOn) : "…"}, and is governments' advice to their own citizens; the conflicts are{" "}
          {data.month ? monthOf(data.month) : "…"}'s, the latest month UCDP has released, not today's; the red alerts are GDACS's now; the UN's plans were read on {dayOf(HUMANITARIAN_PLANS_RETRIEVED)}, its
          regional refugee plans left out, as they name the countries hosting people who fled, not where the crisis is. Each is its body's own word, of the day it was read; none is a finding of the site's,
          and a country none of them names is not found to be safe.
          {" "}The kinds of violence are UCDP's: {CONFLICT_KINDS.map((k, i) => `${k.toLowerCase()} - ${CONFLICT_KIND_SAID[i]}`).join(" ")}
          {waiting.length ? ` Still being read: ${waiting.map((b) => b.chip.toLowerCase()).join(", ")}.` : ""}
        </p>
        <SourceLink
          sources={[
            ...(data.status ? [data.status.COUNTRY_STATUS_SOURCES.us, data.status.COUNTRY_STATUS_SOURCES.uk] : []),
            ...CONFLICT_SOURCES,
            ...GDACS_SOURCES,
            HUMANITARIAN_PLANS_SOURCE,
          ]}
        />
      </div>
    </section>
  );
}
