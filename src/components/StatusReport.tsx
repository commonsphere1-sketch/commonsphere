/**
 * A country's status report, in its window: what public bodies are warning
 * of there now - conflict and unrest, outbreaks of disease, disasters - and
 * the last counts of the dead in its armed conflicts and of the people
 * driven from their homes (data/countryStatus.ts, data/publicSecurity.ts).
 *
 * The site gives the country no rating of its own. Each notice is its
 * body's, under its name, with its date and a link to it: the two travel
 * advisories are what the United States and the United Kingdom tell their
 * own citizens, and are set side by side so that neither stands alone. A
 * body with no notice for the country is said to have none, which is not a
 * finding that all is well. Everything here is of the day it was read.
 */
import type { ReactNode } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { COUNTRY_STATUS, COUNTRY_STATUS_RETRIEVED, COUNTRY_STATUS_SOURCES, HAZARD_DAYS, WORLD_HEALTH_NOTICES, type HealthNotice } from "../data/countryStatus";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { inSentence } from "./CountryQuality";
import { ChartNote, ChartTitle } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Tile = { label: string; value: string; sub: string; level?: number };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
/** A level's colour, 1 the mildest and 4 the gravest: the bodies' own four steps, and their orange and red. */
const LEVEL = ["#16a34a", "#d97706", "#ea580c", "#e11d48"];
const UK_SAID: Record<string, string> = {
  avoid_all_travel_to_whole_country: "against all travel",
  avoid_all_but_essential_travel_to_whole_country: "against all but essential travel",
  avoid_all_travel_to_parts: "against all travel to parts of it",
  avoid_all_but_essential_travel_to_parts: "against all but essential travel to parts of it",
};
/** How grave the Foreign Office's advice is, on the same four steps, for its mark alone. */
const ukStep = (status: string[]) => (status.includes("avoid_all_travel_to_whole_country") ? 4 : status.includes("avoid_all_but_essential_travel_to_whole_country") ? 3 : status.length ? 2 : 1);

function Mark({ level }: { level: number }) {
  return <span aria-hidden className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: LEVEL[level - 1] }} />;
}
function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline decoration-border underline-offset-2 hover:decoration-secondary">
      {children} <ArrowSquareOut size={10} aria-hidden />
    </a>
  );
}

export default function StatusReport({ code, country, className = "" }: { /** The country's ISO code. */ code: string; country: string; className?: string }) {
  const s = COUNTRY_STATUS[code] ?? {};
  const sec = PUBLIC_SECURITY[code];
  const land = inSentence(country);
  const sources = new Map<string, Source>();
  const cite = (x: Source) => sources.set(x.url, x);

  const tiles: Tile[] = [];
  for (const u of s.us ?? []) {
    cite(COUNTRY_STATUS_SOURCES.us);
    tiles.push({ label: `US Travel Advisory${u.name !== country && (s.us?.length ?? 0) > 1 ? ` · ${u.name}` : ""}`, value: `Level ${u.level} of 4`, sub: `“${u.advice}” · issued ${day(u.issued)}`, level: u.level });
  }
  if (s.uk) {
    cite(COUNTRY_STATUS_SOURCES.uk);
    const said = s.uk.status.map((k) => UK_SAID[k] ?? k.replace(/_/g, " "));
    tiles.push({ label: "UK Travel Advice", value: said.length ? `Advises ${said.join(", and ")}` : "No advice against travel", sub: `last changed ${day(s.uk.updated)}`, level: ukStep(s.uk.status) });
  }
  const health = s.health ?? [];
  cite(COUNTRY_STATUS_SOURCES.cdc);
  tiles.push(
    health.length
      ? { label: "Health Notices In Force", value: String(health.length), sub: `the gravest at level ${health[0].level} of 4 · US CDC`, level: health[0].level }
      : { label: "Health Notices In Force", value: "None", sub: `the US CDC has no travel health notice naming ${land}` },
  );
  const hazards = s.hazards ?? [];
  cite(COUNTRY_STATUS_SOURCES.gdacs);
  tiles.push(
    hazards.length
      ? { label: "Disaster Alerts", value: String(hazards.length), sub: `orange or red · current or ended in the last ${HAZARD_DAYS} days`, level: hazards.some((h) => h.alert === "Red") ? 4 : 3 }
      : { label: "Disaster Alerts", value: "None", sub: `no orange or red alert lists ${land} in the last ${HAZARD_DAYS} days` },
  );
  if (sec?.conflict) {
    cite({ label: PUBLIC_SECURITY_SOURCES.ucdp.label, url: PUBLIC_SECURITY_SOURCES.ucdp.url });
    const dead = sec.conflict.stateBased + sec.conflict.nonState + sec.conflict.oneSided;
    tiles.push({ label: "Deaths In Armed Conflict", value: dead === 0 ? "None recorded" : whole(dead), sub: `in the country · ${sec.conflict.y} · Uppsala Conflict Data Program` });
  }
  if (sec?.newDisplacements) {
    cite({ label: PUBLIC_SECURITY_SOURCES.idmc.label, url: PUBLIC_SECURITY_SOURCES.idmc.url });
    tiles.push({ label: "Newly Displaced By Conflict", value: whole(sec.newDisplacements.v), sub: `displacements within the country · ${sec.newDisplacements.y} · IDMC` });
  }
  if (sec?.refugeesFrom) {
    cite({ label: PUBLIC_SECURITY_SOURCES.unhcr.label, url: PUBLIC_SECURITY_SOURCES.unhcr.url });
    tiles.push({ label: "Refugees Who Have Left", value: whole(sec.refugeesFrom.v), sub: `under UNHCR's mandate · ${sec.refugeesFrom.y}` });
  }

  const notice = (n: HealthNotice, world = false) => (
    <li key={n.url} className="flex items-start gap-2">
      <span className="mt-1">
        <Mark level={n.level} />
      </span>
      <span>
        <Out href={n.url}>{n.title}</Out> · level {n.level} of 4 · posted {day(n.issued)}
        {world ? ` · a notice for the world, naming ${n.among} countries` : n.among ? ` · ${land} is one of ${n.among} countries it names` : ""}
      </span>
    </li>
  );

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🚨 Status report</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
        What public bodies are warning of in {land} - conflict and unrest, outbreaks of disease, disasters - as read on {day(COUNTRY_STATUS_RETRIEVED)}. Each notice is its body's own; the site adds no rating of its own.
      </p>
      <div className="tile-fill gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`modal-tile rounded-lg p-3 ${t.value.length > 30 ? "tile-wide" : ""}`}>
            <p className="text-xs text-muted-foreground font-sans">{t.label}</p>
            <p className="text-base font-bold font-sans text-foreground leading-snug flex items-center gap-2">
              {t.level && <Mark level={t.level} />}
              {t.value}
            </p>
            <p className="text-xs text-muted-foreground font-sans leading-snug">{t.sub}</p>
          </div>
        ))}
      </div>

      {((s.us ?? []).some((u) => u.why) || s.uk?.change) && (
        <div className="mt-3">
          <ChartTitle>What the two governments tell their own citizens</ChartTitle>
          <ul className="space-y-1.5 text-[11px] font-sans text-muted-foreground leading-snug">
            {(s.us ?? []).map((u) => (
              <li key={u.url}>
                <span className="font-semibold text-foreground">US Department of State, {day(u.issued)}:</span> {u.why ? `“${u.why}”` : `“${u.advice}” in ${u.name}.`} <Out href={u.url}>the advisory</Out>
              </li>
            ))}
            {s.uk && (
              <li>
                <span className="font-semibold text-foreground">UK Foreign Office, {day(s.uk.updated)}:</span> {s.uk.change ? `its latest change - “${s.uk.change}”` : "no note of its latest change."} <Out href={s.uk.url}>the advice</Out>
              </li>
            )}
          </ul>
        </div>
      )}

      {(health.length > 0 || WORLD_HEALTH_NOTICES.length > 0) && (
        <div className="mt-3">
          <ChartTitle>Outbreaks and health risks · the US CDC's travel health notices</ChartTitle>
          <ul className="space-y-1 text-[11px] font-sans text-muted-foreground leading-snug">
            {health.map((n) => notice(n))}
            {WORLD_HEALTH_NOTICES.map((n) => notice(n, true))}
          </ul>
        </div>
      )}

      {hazards.length > 0 && (
        <div className="mt-3">
          <ChartTitle>Disasters · orange and red alerts of the Global Disaster Alert and Coordination System</ChartTitle>
          <ul className="space-y-1 text-[11px] font-sans text-muted-foreground leading-snug">
            {hazards.map((h) => (
              <li key={h.url} className="flex items-start gap-2">
                <span className="mt-1">
                  <Mark level={h.alert === "Red" ? 4 : 3} />
                </span>
                <span>
                  <Out href={h.url}>
                    {h.kind}
                    {h.name ? ` ${h.name}` : ""}
                  </Out>{" "}
                  · {h.alert.toLowerCase()} alert · {h.from === h.to ? day(h.from) : `${day(h.from)} to ${day(h.to)}`}
                  {h.current ? " · current" : ""}
                  {/* The system writes "Magnitude 0" for a flood it gives no size for: that is not a size, and is not shown. */}
                  {h.said && !/^Magnitude 0$/.test(h.said) ? ` · ${h.said}` : ""}
                  {h.among ? ` · ${land} is one of ${h.among} countries it lists` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ChartNote className="mt-2">
        A travel advisory is one government's advice to its own citizens, not a measure of the country, and the two do not always agree. An alert or a notice names a country; it may touch only a part of it. These are notices of the day and go out
        of date: each links to its own page, which is where to read what stands now.
      </ChartNote>
      <SourceLink sources={[...sources.values()]} className="mt-1" />
    </section>
  );
}
