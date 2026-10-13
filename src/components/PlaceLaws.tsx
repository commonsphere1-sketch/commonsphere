/**
 * The law a place is under, in its window's Laws tab: first what is illegal
 * and legal there, as the UK Foreign Office's travel advice tells a visitor
 * (LawAdvice), then its country's legal
 * system, its constitution and how it is amended, its courts, who is a
 * citizen, who may vote, and whether it accepts the two world courts
 * (static/law, built by build-country-law.cjs).
 *
 * They are the country's, and the tab says so: a city's own by-laws are not
 * gathered for the world's cities by any body, so none are given and none are
 * made up. Every line is the CIA World Factbook's own, from its final
 * edition; it is only set out - a line of clauses as a row for each clause.
 * The one figure is the World Bank's score for the rule of law, with its
 * year, which the site already holds.
 *
 * A country's file is fetched when the tab is opened. Where there is none,
 * or it cannot be read, the tab says so.
 */
import { Bank, Gavel, Globe, IdentificationCard, Scales, Scroll } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { COUNTRY_LAW_HELD, COUNTRY_LAW_SOURCES as SRC, type CountryLawFile } from "../data/countryLaw";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { inSentence } from "./CountryQuality";
import { LawAdvice } from "./LawAdvice";
import { ChartNote, MeasureBars } from "./ModalCharts";
import { Clauses } from "./SaidList";
import { SourceLink } from "./SourceLink";

const COLOR = "#6366f1";
const FILES = new Map<string, Promise<CountryLawFile | null>>();
const load = (code: string) => {
  if (!FILES.has(code))
    FILES.set(
      code,
      fetch(`/law/${code}.json`)
        // Only JSON is read: for a file that is not there, the dev server answers with the page itself.
        .then((r) => (r.ok && /json/.test(r.headers.get("content-type") ?? "") ? (r.json() as Promise<CountryLawFile>) : null))
        .catch(() => null),
    );
  return FILES.get(code)!;
};
/** A country's law: undefined while it is fetched, null where there is no file for it. */
function useLaw(code: string): CountryLawFile | null | undefined {
  const [got, setGot] = useState<{ code: string; file: CountryLawFile | null } | null>(null);
  const listed = COUNTRY_LAW_HELD.has(code);
  useEffect(() => {
    if (!listed) return;
    let off = false;
    load(code).then((file) => !off && setGot({ code, file }));
    return () => {
      off = true;
    };
  }, [code, listed]);
  if (!listed) return null;
  return got && got.code === code ? got.file : undefined;
}

/** A subject of the law, in a tile of its own. */
function Card({ icon, title, sub, children }: { icon: ReactNode; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="modal-tile rounded-xl p-4 min-w-0">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ color: COLOR, background: `color-mix(in srgb, ${COLOR} 16%, transparent)` }}>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-wide leading-tight">{title}</h3>
          {sub && <p className="text-[10px] font-sans text-muted-foreground leading-snug">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
/** One thing the Factbook says under a subject, with what it is said of over it. */
function Said({ label, text }: { label?: string; text: string }) {
  return (
    <div className="min-w-0">
      {label && <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</p>}
      <Clauses text={text} />
    </div>
  );
}
/** A short answer - "no", "5 years" - in a tile, as a figure is. */
function Answer({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-sans text-muted-foreground leading-snug">{label}</p>
      <p className={`font-sans text-foreground leading-snug mt-0.5 ${text.length <= 24 ? "text-sm font-bold" : "text-xs"}`}>{text}</p>
    </div>
  );
}

export default function PlaceLaws({ code, country, place }: { /** The country's ISO 3166-1 code. */ code: string; country: string; /** The place whose window this is, where it is not the country itself. */ place?: string }) {
  const law = useLaw(code);
  const land = inSentence(country);
  const rule = PUBLIC_SECURITY[code]?.ruleOfLaw;
  if (law === undefined) return <p className="text-xs font-sans text-muted-foreground py-6 text-center">Fetching the law of {land}…</p>;
  if (!law && !rule)
    return (
      <p className="text-xs font-sans text-muted-foreground py-6 text-center">
        No account of the law of {land} is held{place ? `, or of ${place}'s own` : ""}, so none is shown.
      </p>
    );
  const c = law?.citizenship;
  return (
    <div className="animate-fade-in space-y-4">
      {place && (
        <p className="text-[11px] font-sans text-muted-foreground leading-snug">
          This is the law of {land}, which {place} is under, and not {place}'s own: no body gathers the by-laws of the world's cities, so none are given. What is illegal and legal is the UK Foreign Office's account; the rest is the CIA World Factbook's, each in its own words.
        </p>
      )}

      {/* What is illegal and what is legal there: first, as it is what a reader comes to the tab for. */}
      {law?.local ? (
        <LawAdvice advice={law.local} country={land} place={place} />
      ) : (
        <p className="modal-tile rounded-xl p-4 text-xs font-sans text-muted-foreground leading-relaxed">
          What is illegal and legal in {land}: not held. The account the site gives is the UK Foreign Office's travel advice, and it publishes none with a part on laws for {land}.
        </p>
      )}

      {(law?.system || rule) && (
        <Card icon={<Scales size={15} weight="fill" />} title="Legal system" sub={`The kind of law ${land} has`}>
          {law?.system && <Said text={law.system} />}
          {rule && (
            <div className={law?.system ? "mt-3 pt-3 border-t border-border/50" : ""}>
              <MeasureBars max={100} color={COLOR} label={`The World Bank's score for the rule of law in ${land}, ${rule.y}`} rows={[{ label: "Rule of law", value: rule.v, text: `${rule.v} of 100`, sub: `World Bank score · ${rule.y}` }]} />
              <ChartNote className="mt-1.5">How far people trust and keep to the rules of society - contracts, property, the police and the courts - as the World Bank scores it from surveys, 0 to 100.</ChartNote>
            </div>
          )}
        </Card>
      )}

      {law?.constitution && (
        <Card icon={<Scroll size={15} weight="fill" />} title="Constitution" sub="When it was made, and how it may be changed">
          <div className="space-y-3">
            {law.constitution.history && <Said label="Its history" text={law.constitution.history} />}
            {law.constitution.amend && <Said label="How it is amended" text={law.constitution.amend} />}
          </div>
          {law.constitution.note && <ChartNote className="mt-2.5">The Factbook's note: {law.constitution.note}.</ChartNote>}
        </Card>
      )}

      {law?.courts && (
        <Card icon={<Gavel size={15} weight="fill" />} title="Courts" sub="Who judges, and how they come to the bench">
          <div className="space-y-3">
            {law.courts.highest && <Said label="Highest court" text={law.courts.highest} />}
            {law.courts.judges && <Said label="How judges are chosen, and for how long" text={law.courts.judges} />}
            {law.courts.lower && <Said label="The courts under it" text={law.courts.lower} />}
          </div>
          {law.courts.note && <ChartNote className="mt-2.5">The Factbook's note: {law.courts.note}.</ChartNote>}
        </Card>
      )}

      {(c || law?.suffrage) && (
        <Card icon={<IdentificationCard size={15} weight="fill" />} title="Citizens and voters" sub="Who is a citizen, and who may vote">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {c?.birth && <Answer label="Citizen by being born there" text={c.birth} />}
            {c?.descent && <Answer label="Citizen by descent" text={c.descent} />}
            {c?.dual && <Answer label="Dual citizenship recognized" text={c.dual} />}
            {c?.residency && <Answer label="Years lived there before naturalization" text={c.residency} />}
            {law?.suffrage && <Answer label="Who may vote" text={law.suffrage} />}
          </div>
          {c?.note && <ChartNote className="mt-2.5">The Factbook's note: {c.note}.</ChartNote>}
        </Card>
      )}

      {law?.world && (
        <Card icon={<Globe size={15} weight="fill" />} title="The world's courts" sub="Whether it answers to them">
          <Said text={law.world} />
          <ChartNote className="mt-2.5">
            ICJ is the International Court of Justice, which hears disputes between states that accept its jurisdiction; ICCt is the International Criminal Court, which tries people for the gravest crimes where a state is
            party to its statute. Both lists change, and are linked below.
          </ChartNote>
        </Card>
      )}

      <div className="flex items-start gap-2 text-[10px] font-sans text-muted-foreground leading-snug">
        <Bank size={12} className="shrink-0 mt-px" aria-hidden />
        <span>The Factbook's last edition was January 2026: a law made or a court changed since is not in it.</span>
      </div>
      <SourceLink sources={[...(law?.local ? [SRC.advice, SRC.state] : []), ...(law && (law.system || law.constitution || law.courts || law.citizenship || law.suffrage || law.world) ? [SRC.factbook] : []), ...(rule ? [{ label: PUBLIC_SECURITY_SOURCES.wgi.label, url: PUBLIC_SECURITY_SOURCES.wgi.url }] : []), ...(law?.world ? [SRC.icj, SRC.icc] : [])]} />
    </div>
  );
}
