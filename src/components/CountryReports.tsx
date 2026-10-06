/**
 * Two reports in a country's window: its sovereignty, and how safe it is.
 *
 * Sovereignty is set out in the CIA World Factbook's own words - whether the
 * place is independent and since when, whose it is if it is not, its
 * constitution, the international courts it answers to, who is a citizen,
 * the places it holds and its forces abroad - with the alliances and blocs it
 * has joined from the site's own list. The Factbook closed in January 2026;
 * the report says so.
 *
 * Safety gathers every published measure the site holds that bears on it,
 * in five groups: violence and conflict, the crime police record, the police,
 * courts and prisons, deaths from accidents and the environment, and
 * disasters. Where the World Bank publishes the world's figure for the same
 * year, the two are drawn on one scale. No body publishes a single safety
 * score for every country, and the report does not make one: it counts how
 * many of its rates are below the world's and how many above, and says that.
 */
import { GlobeHemisphereWest, ShieldCheck } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { ALLIANCES, ALLIANCES_CHECKED, type AllianceKind } from "../data/alliances";
import type { Country } from "../data/countriesData";
import { COUNTRY_CRIME, CRIME_SOURCE } from "../data/countryCrime";
import { COUNTRY_REPORT_SOURCES as SRC, SAFETY, SAFETY_WORLD, SOVEREIGNTY, type SafetyKey } from "../data/countryReports";
import { OFFENCE_RATES, OFFENCE_SOURCES, UNSENTENCED, type OffenceKey } from "../data/crimeOffences";
import { JUSTICE_SOURCES, JUSTICE_STAFF } from "../data/justice";
import { PRISON_RATES, PRISON_RATES_SOURCE } from "../data/prisonRates";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { ACCENT, ChartNote, ChartTitle, worldFor } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const n = (v: number, dp = 0) => v.toLocaleString("en-US", { maximumFractionDigits: dp });

function Panel({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children: ReactNode }) {
  return (
    <div className="modal-tile rounded-lg p-4 mt-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">{title}</h3>
          <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-0.5">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/** A fact in words: what it is, then the source's wording of it. */
function Told({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2 border-b border-border last:border-b-0">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="text-[12px] font-sans text-foreground leading-relaxed mt-0.5">{children}</div>
    </div>
  );
}

// ── Sovereignty ─────────────────────────────────────────────────────────────

const KINDS: [AllianceKind, string][] = [
  ["Security alliance", "Security"],
  ["Political & regional bloc", "Political"],
  ["Economic & trade bloc", "Economic"],
  ["International agency", "Agencies"],
  ["Human rights body", "Human rights"],
];

export function SovereigntyReport({ country }: { country: Country }) {
  const s = SOVEREIGNTY[country.code];
  if (!s) return null;
  const blocs = ALLIANCES.filter((a) => a.members?.includes(country.code));
  const status = s.dependency ?? country.sovereignStatus ?? country.governmentType;
  const z = s.citizenship;
  return (
    <Panel icon={<GlobeHemisphereWest size={13} weight="fill" />} title="Sovereignty" sub="Whether it governs itself and since when, the courts and bodies it answers to, and what it holds abroad">
      <p className="text-[12px] font-sans text-foreground/90 leading-relaxed mb-2">
        {s.dependency
          ? `${country.name} is not an independent state: the Factbook gives it a dependency status, below.`
          : s.un
            ? `${country.name} is a member state of the United Nations${s.organisations ? `, one of ${s.organisations} international bodies the Factbook lists it as taking part in` : ""}.`
            : `The Factbook does not list the United Nations among the bodies ${country.name} takes part in${s.organisations ? `; it lists ${s.organisations} others` : ""}.`}
      </p>
      <div className="flex flex-col">
        <Told label="Status">{status}</Told>
        {s.independence && <Told label="Independence">{s.independence}</Told>}
        {s.constitution && (
          <Told label="Constitution">
            {s.constitution}
            {s.amendment && <span className="block text-[11px] text-muted-foreground mt-1">Amended: {s.amendment}</span>}
          </Told>
        )}
        {s.internationalLaw && (
          <Told label="International courts">
            {s.internationalLaw}
            <span className="block text-[10px] font-mono text-muted-foreground mt-1">ICJ: the International Court of Justice · ICCt: the International Criminal Court</span>
          </Told>
        )}
        {(z || s.citizenshipNote) && (
          <Told label="Who is a citizen">
            {z ? (
              <ul className="flex flex-col gap-0.5">
                {z.birth && <li>By birth in the country: {z.birth}</li>}
                {z.descent && <li>By descent: {z.descent}</li>}
                {z.dual && <li>Dual citizenship recognised: {z.dual}</li>}
                {z.residency && <li>Residence before naturalisation: {z.residency}</li>}
              </ul>
            ) : (
              s.citizenshipNote
            )}
          </Told>
        )}
        {blocs.length > 0 && (
          <Told label="Alliances and blocs it has joined">
            <div className="flex flex-col gap-1.5 mt-1">
              {KINDS.map(([kind, label]) => {
                const mine = blocs.filter((a) => a.kind === kind);
                if (!mine.length) return null;
                return (
                  <div key={kind} className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">{label}</span>
                    <span className="flex flex-wrap gap-1">
                      {mine.map((a) => (
                        <a
                          key={a.id}
                          href={a.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${a.name} - ${a.source.label}`}
                          className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-md border border-border bg-muted text-foreground hover:opacity-80"
                        >
                          {a.short}
                        </a>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </Told>
        )}
        {s.dependentAreas && <Told label="Places it holds">{s.dependentAreas}</Told>}
        {s.deployments && <Told label="Its forces abroad">{s.deployments}</Told>}
        {s.holiday && <Told label="National day">{s.holiday}</Told>}
      </div>
      <ChartNote className="mt-3">
        Each line is the CIA World Factbook's, as written, from its final edition of January 2026: a change of status, a new constitution or a treaty joined since
        is not in it. The alliances and blocs are the site's own list, each membership checked against the body's page on {ALLIANCES_CHECKED}.
      </ChartNote>
      <SourceLink sources={[SRC.factbook]} className="mt-2" />
    </Panel>
  );
}

// ── Safety ──────────────────────────────────────────────────────────────────

type Rate = { label: string; value: number; text: string; sub: string; world?: { value: number; text: string } | null; /** The top of the bar's scale, where it is not the larger of the two figures. */ max?: number; lowerIsSafer?: boolean };

/** A rate with its bar: on the scale of the larger of the country's figure and the world's, or 0 to `max`. The tick is the world. */
function RateRow({ r }: { r: Rate }) {
  const top = r.max ?? (Math.max(r.value, r.world?.value ?? 0) * 1.1 || 1);
  const at = (v: number) => `${Math.min(100, Math.max(0, (100 * v) / top))}%`;
  return (
    <li className="py-1.5 border-b border-border last:border-b-0">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-sans text-foreground min-w-0 leading-snug">{r.label}</span>
        <span className="text-[12px] font-mono font-semibold text-foreground text-right shrink-0">{r.text}</span>
      </span>
      {/* A bar needs a scale: the world's figure, or a score's 0 to 100. With neither, the figure stands alone. */}
      {(r.world || r.max) && (
        <span className="relative block h-1.5 rounded-full bg-muted mt-1" aria-hidden>
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at(r.value), minWidth: r.value > 0 ? 2 : 0, background: ACCENT }} />
          {r.world && <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full bg-foreground" style={{ left: at(r.world.value) }} title={`World: ${r.world.text}`} />}
        </span>
      )}
      <p className="text-[10px] font-mono text-muted-foreground leading-snug mt-1">
        {r.sub}
        {r.world ? ` · world ${r.world.text}` : ""}
      </p>
    </li>
  );
}

/** A count or a rate with no bar: what it is, the figure, and its year. */
function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5 border-b border-border last:border-b-0">
      <span className="text-[11px] font-sans text-foreground min-w-0 leading-snug">{label}</span>
      <span className="text-[11px] font-mono font-semibold text-foreground text-right shrink-0">
        {value}
        <span className="font-normal text-muted-foreground"> · {sub}</span>
      </span>
    </li>
  );
}

const DEATHS: [SafetyKey, string][] = [
  ["roadDeaths", "Deaths on the roads"],
  ["suicide", "Deaths by suicide"],
  ["airPollutionDeaths", "Deaths from air pollution"],
  ["unsafeWaterDeaths", "Deaths from unsafe water and sanitation"],
  ["poisoning", "Deaths from unintentional poisoning"],
];
const OFFENCES: [OffenceKey, string][] = [
  ["kidnapping", "Kidnapping"],
  ["sexualViolence", "Sexual violence"],
  ["theft", "Theft"],
  ["fraud", "Fraud"],
];

export function SafetyReport({ country }: { country: Country }) {
  const safe = SAFETY[country.code];
  const crime = COUNTRY_CRIME[country.id];
  const sec = PUBLIC_SECURITY[country.code];
  const staff = JUSTICE_STAFF[country.id];
  const prison = PRISON_RATES[country.id];
  const unsentenced = UNSENTENCED[country.id];
  const air = AIR_QUALITY[country.code];
  if (!safe && !crime && !sec && !staff && !prison) return null;

  // ── Rates that have, or may have, the world's beside them: lower is safer on each ──
  const rates: Rate[] = [];
  if (crime?.homicide) {
    const w = worldFor("homicide", crime.homicide.y);
    rates.push({ label: "Intentional homicides", value: crime.homicide.v, text: n(crime.homicide.v, 1), sub: `per 100,000 people · ${crime.homicide.y}`, world: w !== null ? { value: w, text: n(w, 1) } : null, lowerIsSafer: true });
  }
  for (const [k, label] of DEATHS) {
    const f = safe?.[k];
    if (!f) continue;
    const w = SAFETY_WORLD[k][f[0]];
    rates.push({ label, value: f[1], text: n(f[1], 1), sub: `per 100,000 people · ${f[0]}`, world: w !== undefined ? { value: w, text: n(w, 1) } : null, lowerIsSafer: true });
  }
  if (air) {
    const w = worldFor("pm25", air.year);
    rates.push({ label: "Fine particles in the air people breathe", value: air.pm25, text: `${n(air.pm25, 1)} µg/m³`, sub: `PM2.5, average exposure · ${air.year}`, world: w !== null ? { value: w, text: `${n(w, 1)} µg/m³` } : null, lowerIsSafer: true });
  }
  const compared = rates.filter((r) => r.world);
  const below = compared.filter((r) => r.value < r.world!.value).length;
  const above = compared.filter((r) => r.value > r.world!.value).length;

  // ── The World Bank's two governance scores, each 0 to 100 ──
  const scores: Rate[] = [];
  if (sec?.stability) scores.push({ label: "Political stability and absence of violence", value: sec.stability.v, text: `${sec.stability.v} of 100`, sub: `World Bank score, higher is steadier · ${sec.stability.y}`, max: 100 });
  if (sec?.ruleOfLaw) scores.push({ label: "Rule of law", value: sec.ruleOfLaw.v, text: `${sec.ruleOfLaw.v} of 100`, sub: `World Bank score, higher is better governed · ${sec.ruleOfLaw.y}`, max: 100 });

  const conflict = sec?.conflict ? sec.conflict.stateBased + sec.conflict.nonState + sec.conflict.oneSided : null;
  const recorded = (
    [
      ["Robbery", crime?.robbery],
      ["Serious assault", crime?.assault],
      ["Burglary", crime?.burglary],
      ["Vehicle theft", crime?.vehicleTheft],
    ] as [string, { v: number; y: string } | undefined][]
  ).filter((r): r is [string, { v: number; y: string }] => !!r[1]);
  const more = OFFENCES.flatMap(([k, label]) => {
    const f = OFFENCE_RATES[k]?.[country.id];
    return f ? [[label, f] as const] : [];
  });

  return (
    <Panel icon={<ShieldCheck size={13} weight="fill" />} title="Safety report" sub="Every published measure of how safe people are here, in one place: violence, crime, policing, accidents, the environment and disasters">
      {compared.length > 0 && (
        <p className="text-[12px] font-sans text-foreground/90 leading-relaxed mb-3">
          Of the {compared.length} rates below that have the world's figure for the same year, {country.name} is below the world on {below} and above it on {above}
          {compared.length - below - above > 0 ? `, and level on ${compared.length - below - above}` : ""}. On each of them, lower is safer.
        </p>
      )}

      {rates.length > 0 && (
        <>
          <ChartTitle>Deaths and exposure · each against the world for the same year</ChartTitle>
          <ul className="flex flex-col mb-4" aria-label={`Rates of death and exposure in ${country.name}, each beside the world's`}>
            {rates.map((r) => (
              <RateRow key={r.label} r={r} />
            ))}
          </ul>
        </>
      )}

      {(scores.length > 0 || conflict !== null || sec?.terror) && (
        <>
          <ChartTitle>Conflict, terrorism and order</ChartTitle>
          <ul className="flex flex-col mb-4">
            {scores.map((r) => (
              <RateRow key={r.label} r={r} />
            ))}
            {conflict !== null && <Figure label="Deaths in armed conflict in the country" value={conflict === 0 ? "None recorded" : n(conflict)} sub={`${sec!.conflict!.y} · UCDP`} />}
            {sec?.terror && <Figure label="Terrorist attacks" value={sec.terror.attacks === 0 ? "None recorded" : `${n(sec.terror.attacks)}, ${n(sec.terror.deaths)} deaths`} sub={`${sec.terror.y}, the database's last year`} />}
          </ul>
        </>
      )}

      {(recorded.length > 0 || more.length > 0) && (
        <>
          <ChartTitle>Crime the police recorded · per 100,000 people</ChartTitle>
          <ul className="flex flex-col mb-4">
            {recorded.map(([label, f]) => (
              <Figure key={label} label={label} value={n(f.v, 1)} sub={f.y} />
            ))}
            {more.map(([label, f]) => (
              <Figure key={label} label={label} value={n(f[0], 1)} sub={`${f[1]}`} />
            ))}
          </ul>
        </>
      )}

      {(staff?.police || staff?.judges || prison || unsentenced) && (
        <>
          <ChartTitle>Police, courts and prisons</ChartTitle>
          <ul className="flex flex-col mb-4">
            {staff?.police && <Figure label="Police" value={staff.police[2] !== null ? `${n(staff.police[2], 1)} per 100,000` : n(staff.police[0])} sub={`${n(staff.police[0])} in ${staff.police[1]}`} />}
            {staff?.judges && <Figure label="Judges and magistrates" value={staff.judges[2] !== null ? `${n(staff.judges[2], 1)} per 100,000` : n(staff.judges[0])} sub={`${n(staff.judges[0])} in ${staff.judges[1]}`} />}
            {prison && <Figure label="People in prison" value={`${prison.approx ? "c. " : ""}${n(prison.v)} per 100,000`} sub={`count at ${prison.at}`} />}
            {unsentenced && <Figure label="Prisoners with no sentence yet" value={`${unsentenced[0]}%`} sub={`${unsentenced[1]}`} />}
          </ul>
        </>
      )}

      {(safe?.disasterDisplaced || safe?.hazards) && (
        <>
          <ChartTitle>Disasters</ChartTitle>
          <ul className="flex flex-col">{safe.disasterDisplaced && <Figure label="People newly displaced by disasters" value={n(safe.disasterDisplaced[1])} sub={`${safe.disasterDisplaced[0]} · IDMC`} />}</ul>
          {safe.hazards && (
            <p className="text-[12px] font-sans text-foreground/90 leading-relaxed mt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Natural hazards · Factbook · </span>
              {safe.hazards}
            </p>
          )}
        </>
      )}

      <ChartNote className="mt-3">
        No body publishes one safety score for every country, and none is made here. A bar and its tick - the world - share a scale: the larger of the two figures,
        or 0 to 100 for a score. The death rates are the WHO's estimates, some several years old. Recorded crime depends on each country's laws and on how
        much is reported, so it is given as figures and not set against the world. A count per 100,000 for police and judges is UNODC's count over the World
        Bank's population for that year.
      </ChartNote>
      <SourceLink
        sources={[
          SRC.worldBank,
          ...(crime ? [CRIME_SOURCE] : []),
          ...(more.length ? [OFFENCE_SOURCES.violent, OFFENCE_SOURCES.economic] : []),
          ...(sec?.stability || sec?.ruleOfLaw ? [{ label: PUBLIC_SECURITY_SOURCES.wgi.label, url: PUBLIC_SECURITY_SOURCES.wgi.url }] : []),
          ...(sec?.conflict ? [{ label: PUBLIC_SECURITY_SOURCES.ucdp.label, url: PUBLIC_SECURITY_SOURCES.ucdp.url }] : []),
          ...(sec?.terror ? [{ label: PUBLIC_SECURITY_SOURCES.gtd.label, url: PUBLIC_SECURITY_SOURCES.gtd.url }] : []),
          ...(staff ? [JUSTICE_SOURCES.unodc] : []),
          ...(prison ? [PRISON_RATES_SOURCE] : []),
          ...(unsentenced ? [OFFENCE_SOURCES.prisons] : []),
          ...(air ? [AIR_QUALITY_SOURCE] : []),
          ...(safe?.hazards ? [SRC.factbook] : []),
        ]}
        className="mt-2"
      />
    </Panel>
  );
}
