/**
 * What a country's people are given free or covered for: badges for its card
 * and a section for its window, from publicServices.ts
 * (build-public-services.cjs).
 *
 * Three things are published and shown - the years of free schooling the law
 * guarantees (UNESCO), the share of people covered by government or
 * compulsory health insurance (OECD, for its members and partners), and how
 * much of health spending people pay out of pocket (WHO, via the World Bank).
 * A fourth is asked for and found nowhere: no country has a universal basic
 * income in place (World Bank), so no country is given a badge for one, and
 * the window says so.
 *
 * A badge is a statement, so each is tied to a published figure: free
 * schooling wherever the law guarantees any, with its years; public health
 * cover where the OECD's figure is 99% or more, with the figure. A country
 * the OECD does not report gets no health badge - which is not a finding that
 * it has no cover - and its window gives what it pays out of pocket instead.
 */
import type { ReactNode } from "react";
import { FirstAid, GraduationCap, HandCoins, Wallet } from "@phosphor-icons/react";
import { PUBLIC_SERVICES, PUBLIC_SERVICE_SOURCES, UNIVERSAL_BASIC_INCOME, type PublicServices } from "../data/publicServices";
import { SourceLink } from "./SourceLink";

/** Public health cover counts as universal for a badge at this share of the population or more. */
const UNIVERSAL = 99;
const pct = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
const years = (n: number) => `${n} year${n === 1 ? "" : "s"}`;
const of = (code: string): PublicServices | undefined => PUBLIC_SERVICES[code.toUpperCase()];

const BADGE = "inline-flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-full border text-success border-success/30 bg-success/10 whitespace-nowrap";

/** The badges for a country's card: free schooling, and public health cover where it is universal. Nothing where neither is published. */
export function ServiceBadges({ code, className = "" }: { code: string; className?: string }) {
  const s = of(code);
  const school = s?.freeSchool && s.freeSchool.years > 0 ? s.freeSchool : null;
  const health = s?.healthCover && s.healthCover.pct >= UNIVERSAL ? s.healthCover : null;
  if (!school && !health) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {school && (
        <span className={BADGE} title={`Free primary and secondary education guaranteed in law: ${years(school.years)} (UNESCO, ${school.year})`}>
          <GraduationCap size={11} weight="fill" aria-hidden />
          Free school · {school.years} yrs
        </span>
      )}
      {health && (
        <span className={BADGE} title={`${pct(health.pct)} of people are covered by government or compulsory health insurance (OECD, ${health.year})`}>
          <FirstAid size={11} weight="fill" aria-hidden />
          Public health cover · {pct(health.pct)}
        </span>
      )}
    </div>
  );
}

function Tile({ icon, label, value, lines, on }: { icon: ReactNode; label: string; value: string; lines: string[]; /** The service is there: the figure is in green. */ on?: boolean }) {
  return (
    <div className="modal-tile rounded-lg p-3 min-w-0">
      <p className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={`text-base font-bold font-mono leading-tight mt-1 ${on ? "text-success" : "text-foreground"}`}>{value}</p>
      {lines.map((l) => (
        <p key={l} className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">
          {l}
        </p>
      ))}
    </div>
  );
}

/** The section of a country's window: free schooling, public health insurance, out-of-pocket spending and universal basic income, each with its source. */
export function PublicServicesSection({ code, name }: { code: string; name: string }) {
  const s = of(code);
  if (!s) return null;
  const { freeSchool: school, healthCover: health, outOfPocket: pocket } = s;
  const had = (UNIVERSAL_BASIC_INCOME.had as readonly string[]).includes(code.toUpperCase());
  const sources = [...(school ? [PUBLIC_SERVICE_SOURCES.school] : []), ...(health ? [PUBLIC_SERVICE_SOURCES.health] : []), ...(pocket ? [PUBLIC_SERVICE_SOURCES.pocket] : []), PUBLIC_SERVICE_SOURCES.ubi];
  return (
    // A gap above as well as below: the panels before it end with no margin of their own, and it sat against the last of them.
    <div className="modal-tile rounded-lg p-4 mt-4 mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Public services</h4>
          <p className="text-[11px] font-sans text-muted-foreground mt-0.5">What people in {name} are given free or covered for, where a body publishes it</p>
        </div>
        <ServiceBadges code={code} className="justify-end shrink-0 max-w-[55%]" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Tile
          icon={<GraduationCap size={12} aria-hidden />}
          label="Free schooling"
          value={school ? years(school.years) : "Not published"}
          on={Boolean(school && school.years > 0)}
          lines={
            school
              ? [
                  `of primary and secondary school, free by law · UNESCO, ${school.year}`,
                  ...(school.compulsory !== undefined ? [`${years(school.compulsory)} of it compulsory`] : []),
                  ...(school.prePrimary !== undefined ? [school.prePrimary > 0 ? `${years(school.prePrimary)} of free pre-primary` : "No free pre-primary guaranteed"] : []),
                ]
              : ["UNESCO has no figure for it"]
          }
        />
        <Tile
          icon={<FirstAid size={12} aria-hidden />}
          label="Public health insurance"
          value={health ? pct(health.pct) : "Not published"}
          on={Boolean(health && health.pct >= UNIVERSAL)}
          lines={health ? [`of people covered by government or compulsory health insurance · OECD, ${health.year}`] : ["The OECD reports this for its members and partners only"]}
        />
        <Tile
          icon={<Wallet size={12} aria-hidden />}
          label="Paid out of pocket"
          value={pocket ? pct(pocket.pct) : "Not published"}
          lines={pocket ? [`of all health spending is paid by patients themselves · WHO, ${pocket.year}`] : ["The WHO has no figure for it"]}
        />
        <Tile
          icon={<HandCoins size={12} aria-hidden />}
          label="Universal basic income"
          value="None"
          lines={[UNIVERSAL_BASIC_INCOME.says, ...(had ? [`${name} had a national one for a short period.`] : []), "World Bank, 2020"]}
        />
      </div>
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
        Free schooling is what the law guarantees, not what families pay in practice. A figure not published is not a finding that the service is absent.
      </p>
      <SourceLink sources={sources} className="mt-1.5" />
    </div>
  );
}
