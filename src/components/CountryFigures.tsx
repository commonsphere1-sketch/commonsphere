/**
 * Every subject the site holds official figures on for a country, as charts:
 * what fills the Worldview page under the map's panels when a country is
 * picked, as asked - economics, policy and tax, demographics, health and
 * public services, education, security, crime and justice, infrastructure
 * and energy, governance and standing, and its place in the world and its
 * law. Each panel is a chart of its own kind - a ring, stacked shares, bars,
 * a range, a ladder of counts - with the figures written out, each with its
 * year, and its publisher under it.
 *
 * Nothing is typed in here: every figure is read from data the site already
 * holds, each set built from its publisher (the World Bank, UNDP, UNODC, the
 * World Prison Brief, SIPRI, the US EIA, FAO, the IMF, the OECD, UNESCO,
 * UNHCR, Uppsala, the CIA World Factbook, the UN, Freedom House). A share
 * worked out here says so. A panel the country has no figures for says so.
 * Disease outbreaks are not given: the WHO's figures are for non-commercial
 * use only, and no other body publishes them for every country.
 *
 * Surveillance of the public is the V-Dem Institute's Digital Society Project:
 * how far the government watches, filters, shuts down and arrests for what
 * people say online, and whether the law protects their data.
 */
import { Children, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COUNTRY_PANELS, PANEL_SOURCES, type PanelField } from "../data/countryPanels";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES } from "../data/worldview";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { COUNTRY_CRIME, CRIME_SOURCE } from "../data/countryCrime";
import { PRISON_RATES, PRISON_RATES_SOURCE } from "../data/prisonRates";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { PUBLIC_SERVICES, PUBLIC_SERVICE_SOURCES } from "../data/publicServices";
import { MILITARY_MEASURED, MILITARY_SOURCES } from "../data/militarySpending";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { COUNTRY_INDEXES, INDEX_DEFS } from "../data/countryIndexes";
import { COUNTRY_UN, COUNTRY_UN_SOURCES, UN_GROUPS } from "../data/countryUn";
import { LAND_USE, LAND_USE_SOURCE } from "../data/landUse";
import { COUNTRY_TAX, COUNTRY_TAX_SOURCES } from "../data/countryTax";
import { JUSTICE_PROCESS, JUSTICE_SOURCES, LEGAL_SYSTEMS } from "../data/justice";
import { COUNTRY_PEOPLE, COUNTRY_PEOPLE_SOURCES, type Shares as PeopleShares } from "../data/countryPeople";
import { economyForCountry } from "../data/economiesData";
import { COUNTRY_REFERENCE } from "../data/countryReference";
import { ECONOMY_MANUFACTURING, ECONOMY_MANUFACTURING_SOURCE, MANUFACTURING_BRANCHES, WORLD_MANUFACTURING_SHARE } from "../data/economyManufacturing";
import { RESOURCE_PRODUCERS, type Share } from "../data/resourceProducers";
import { ENERGY_PRODUCERS } from "../data/energyProducers";
import { CRITICAL_MINERALS, CRITICAL_MINERALS_SOURCE } from "../data/criticalMinerals";
import { countryForFeature } from "../data/mapJoin";
import { ALLIANCES, ALLIANCE_KIND_PLURAL } from "../data/alliances";
import { SURVEILLANCE, SURVEILLANCE_SCALES, SURVEILLANCE_SOURCE, type SurveillanceMeasure } from "../data/surveillance";
import { COUNTRY_LAW_HELD, COUNTRY_LAW_SOURCES, type CountryLawAdvice, type CountryLawFile } from "../data/countryLaw";
import { AdviceLists } from "./LawAdvice";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import SlimBars, { SlimColumns, gradId } from "./SlimBars";

/** The site's colours for the panels, in turn. */
export const INK = ["#2a78d6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"];
type Src = { label: string; url: string };
/** A country's entry in a map keyed by its code, whichever case the map keys it in. */
function pick<T>(m: Record<string, T>, cc: string): T | undefined {
  return m[cc] ?? m[cc.toLowerCase()];
}
const big = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}K` : Math.round(v).toLocaleString("en-US"));
const pct = (v: number) => `${v.toFixed(1)}%`;
const usdBn = (bn: number) => (bn >= 1000 ? `$${(bn / 1000).toFixed(2)}T` : bn >= 1 ? `$${bn.toFixed(bn >= 100 ? 0 : 1)}B` : `$${Math.round(bn * 1000)}M`);
/** A share of world output as its publisher bounds it. */
const shareOf = (s: Share) => `${s.bound === "atMost" ? "<" : s.bound === "atLeast" ? ">" : ""}${s.pct < 1 ? s.pct.toFixed(1) : s.pct.toFixed(s.pct < 10 ? 1 : 0)}%`;
/** The tables of the largest producers the site holds - USGS's minerals, and the EIA's and OPEC's fuels - by commodity. */
const PRODUCED = Object.entries({ ...RESOURCE_PRODUCERS, ...ENERGY_PRODUCERS });

/** A panel: its heading in capitals, a line beside it, and what it holds - as tall as the others in its row. */
export function Panel({ t, title, meta, children, className = "" }: { t: Tokens; title: string; meta?: string; children: ReactNode; className?: string }) {
  // Nothing held: the panel is left out rather than left saying so, as asked - no gaps.
  if (empty(children)) return null;
  return (
    <section className={`rounded-xl flex flex-col min-w-0 grow basis-full md:basis-[calc(50%-0.375rem)] xl:basis-[calc(33.333%-0.5rem)] ${className}`} style={{ background: t.cardBg, border: t.cardBorder }}>
      <div className="flex items-baseline gap-2 px-3.5 pt-3 pb-2 border-b" style={{ borderColor: t.gridLine }}>
        <h3 className="text-[10px] font-mono uppercase tracking-widest flex-1 min-w-0 truncate" style={{ color: t.headText }}>
          {title}
        </h3>
        {meta && (
          <span className="text-[9px] font-mono shrink-0" style={{ color: t.mutedText }}>
            {meta}
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">{children}</div>
    </section>
  );
}
/** Whether a panel's content is the line saying nothing is held - first, with at most its sources after it. */
const empty = (children: ReactNode) => {
  const first = Children.toArray(children)[0];
  return isValidElement(first) && first.type === None;
};
export const None = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[11px] font-sans py-6 text-center my-auto" style={{ color: t.mutedText }}>
    {children}
  </p>
);
export const Note = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
    {children}
  </p>
);
/** The sources of a panel, at its foot. */
export const Foot = ({ sources }: { sources: (Src | undefined)[] }) => {
  const list = [...new Map(sources.filter((s): s is Src => !!s).map((s) => [s.url + s.label, s])).values()];
  return list.length ? <SourceLink sources={list} className="mt-auto pt-1" /> : null;
};

/** Rows of bars, each its figure and year: `share` is the bar's length out of 100. */
function Bars({ t, rows, wide = false }: { t: Tokens; rows: { label: string; text: string; y?: string | number; share: number; color?: string }[]; /** Two across, for a panel the width of its row. */ wide?: boolean }) {
  return (
    <ul className={wide ? "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5" : "flex flex-col gap-2"}>
      {rows.map((r, i) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 items-baseline">
          <span className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
            {r.label}
          </span>
          <span className="text-[11px] font-mono font-semibold tabular-nums text-right" style={{ color: t.headText }}>
            {r.text}
            {r.y !== undefined && <span className="font-normal" style={{ color: t.mutedText }}> · {r.y}</span>}
          </span>
          <span className="col-span-2 h-2 rounded-full overflow-hidden mt-1" style={{ background: t.gridLine }} aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${Math.max(1, Math.min(100, r.share))}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${r.color ?? INK[i % INK.length]} 35%, transparent), ${r.color ?? INK[i % INK.length]})` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
/** A ring of shares, with its largest parts listed beside it. */
export function Ring({ t, slices, unit = "%" }: { t: Tokens; slices: { name: string; v: number; color?: string }[]; unit?: string }) {
  const parts = slices.map((s, i) => ({ ...s, color: s.color ?? INK[i % INK.length] }));
  const tip = { contentStyle: { background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }, itemStyle: { color: t.headText } };
  return (
    <div className="flex items-center gap-3">
      <div className="w-[120px] h-[120px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {[...new Set(parts.map((s) => s.color))].map((c) => (
                <linearGradient key={c} id={gradId(c)} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={c} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            <Pie data={[{ v: 1 }]} dataKey="v" innerRadius={45} outerRadius={56} fill={t.gridLine} stroke="none" isAnimationActive={false} tooltipType="none" />
            <Pie data={parts} dataKey="v" nameKey="name" innerRadius={45} outerRadius={56} paddingAngle={parts.length > 1 ? 2.5 : 0} stroke="none" cornerRadius={3} isAnimationActive={false}>
              {parts.map((s) => (
                <Cell key={s.name} fill={`url(#${gradId(s.color)})`} />
              ))}
            </Pie>
            <Tooltip {...tip} formatter={(v: number, k: string) => [`${v.toFixed(1)}${unit}`, k]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-1 min-w-0 flex-1">
        {[...parts].sort((a, b) => b.v - a.v).slice(0, 6).map((s) => (
          <li key={s.name} className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} aria-hidden />
            <span className="text-[10px] font-sans truncate flex-1" style={{ color: t.bodyText }}>
              {s.name}
            </span>
            <span className="text-[10px] font-mono" style={{ color: t.headText }}>
              {s.v.toFixed(1)}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
/** One whole, in its parts, across: with a key under it. */
export function Stack({ t, parts }: { t: Tokens; parts: { name: string; v: number; color?: string }[] }) {
  const shown = parts.filter((p) => p.v > 0).map((p, i) => ({ ...p, color: p.color ?? INK[i % INK.length] }));
  const total = shown.reduce((n, p) => n + p.v, 0) || 1;
  return (
    <>
      <div className="flex h-2.5 gap-[3px]" role="img" aria-label={shown.map((p) => `${p.name} ${p.v.toFixed(1)}%`).join(", ")}>
        {shown.map((p) => (
          <span key={p.name} className="rounded-full" style={{ width: `${(p.v / total) * 100}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${p.color} 35%, transparent), ${p.color})` }} title={`${p.name}: ${p.v.toFixed(1)}%`} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {shown.map((p) => (
          <li key={p.name} className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} aria-hidden />
            <span className="text-[10px] font-sans truncate flex-1" style={{ color: t.bodyText }}>
              {p.name}
            </span>
            <span className="text-[10px] font-mono" style={{ color: t.headText }}>
              {p.v.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
/**
 * A line of the Factbook's - a country's religions or languages: a ring where its shares make up a whole, bars where
 * they overlap (people speak more than one language), and where it gives a sentence rather than shares, the figures
 * the sentence writes read out of it - never added to - and the rest of it as it stands.
 */
function Shares({ t, of }: { t: Tokens; of: PeopleShares }) {
  let parts = of.parts ?? [];
  let words: string[] = [];
  let aside = of.note;
  if (!parts.length && of.text) {
    const [head, ...rest] = of.text.split(";");
    const items = head.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
    const read = items.map((s) => s.match(/^(.+?)\s+(less than\s+|<\s*)?([\d.]+)%$/));
    if (read.filter(Boolean).length >= 2) {
      parts = read.flatMap((m) => (m ? [[m[1], Number(m[3]), ...(m[2] ? [1 as const] : [])] as [string, number, 1?]] : []));
      words = items.filter((_, i) => !read[i]);
    } else words = items;
    const more = rest.join(";").trim();
    if (more) aside = aside ? `${more}; ${aside}` : more;
  }
  const named = parts.filter(([n]) => !/^(other|unspecified|none)\b/i.test(n));
  return (
    <>
      {parts.length > 0 &&
        (of.whole ? (
          <Ring t={t} slices={parts.slice(0, 8).map(([n, v]) => ({ name: n, v }))} />
        ) : (
          <Bars t={t} rows={named.slice(0, 7).map(([n, v, under]) => ({ label: n, text: `${under ? "<" : ""}${v}%`, share: v }))} />
        ))}
      {words.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <li key={w} className="text-[10px] font-sans px-2 py-0.5 rounded-full" style={{ color: t.bodyText, background: t.tile, border: `1px solid ${t.gridLine}` }}>
              {w}
            </li>
          ))}
        </ul>
      )}
      {aside && <Note t={t}>{(aside.charAt(0).toUpperCase() + aside.slice(1)).replace(/\.?$/, ".")}</Note>}
    </>
  );
}
/** Figures in tiles, two across. */
export function Tiles({ t, items }: { t: Tokens; items: { label: string; text: string; y?: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg px-2.5 py-2 min-w-0" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
          <p className="text-[9px] font-mono uppercase tracking-wider leading-tight" style={{ color: t.mutedText }}>
            {i.label}
          </p>
          <p className="text-sm font-bold font-mono leading-tight mt-0.5" style={{ color: t.headText }}>
            {i.text}
          </p>
          {i.y !== undefined && (
            <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
              {i.y}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
/** A score on its scale with the range its maker is sure of: the band is the range, the dot the score. */
function Range({ t, label, v, lo, hi, text, color }: { t: Tokens; label: string; v: number; lo: number; hi: number; text: string; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-sans" style={{ color: t.bodyText }}>
          {label}
        </span>
        <span className="text-[11px] font-mono font-semibold" style={{ color: t.headText }}>
          {text}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full mt-1" style={{ background: t.gridLine }} role="img" aria-label={`${label}: ${v} out of 100, likely between ${lo} and ${hi}`}>
        <span className="absolute top-0 bottom-0 rounded-full opacity-40" style={{ left: `${lo}%`, width: `${Math.max(1, hi - lo)}%`, background: color }} />
        <span className="absolute top-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full ring-2" style={{ left: `${v}%`, background: color, boxShadow: `0 0 0 2px ${t.cardBg}` }} />
      </div>
    </div>
  );
}
/** Whether a panel holds nothing: its whole content is the line that says so. */
const holdsNothing = (c: ReactNode) => isValidElement(c) && c.type === Panel && empty((c as ReactElement<{ children: ReactNode }>).props.children);
export function Section({ t, title, kicker, children }: { t: Tokens; title: string; kicker: string; children: ReactNode }) {
  const held = Children.toArray(children).filter((c) => !holdsNothing(c));
  if (!held.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3 px-1 pt-3">
        <h3 className="text-sm font-bold font-sans" style={{ color: t.headText }}>
          {title}
        </h3>
        <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
          {kicker}
        </span>
        <span className="flex-1 h-px" style={{ background: t.gridLine }} aria-hidden />
      </div>
      {/* Three across on a wide screen, two on a middling one, every panel in a row as tall as the tallest; a row with fewer panels widens them to fill it, so that none is left with a hole. */}
      <div className="flex flex-wrap gap-3 items-stretch">{held}</div>
    </div>
  );
}

export default function CountryFigures({ code, name }: { code: string; name: string }) {
  const t = useTokens();
  const P = COUNTRY_PANELS[code.toLowerCase()] ?? {};
  const wb = (f: PanelField) => PANEL_SOURCES[(P[f]?.s ?? "wb") as keyof typeof PANEL_SOURCES];
  const has = (...f: PanelField[]) => f.some((x) => P[x]);
  const ind = COUNTRY_INDICATORS[code] ?? {};
  const tax = pick(COUNTRY_TAX, code);
  const people = pick(COUNTRY_PEOPLE, code);
  // UNESCO's World Heritage sites, where the site has read them for the country.
  const heritage = COUNTRY_REFERENCE[code];
  const services = pick(PUBLIC_SERVICES, code);
  const crime = pick(COUNTRY_CRIME, code);
  const prison = pick(PRISON_RATES, code);
  const security = pick(PUBLIC_SECURITY, code);
  const justiceKey = Object.keys(JUSTICE_PROCESS).find((k) => k === code.toLowerCase() || k.startsWith(`${code.toLowerCase()}_`));
  const justice = justiceKey ? JUSTICE_PROCESS[justiceKey] : undefined;
  const legal = pick(LEGAL_SYSTEMS, code);
  const military = pick(MILITARY_MEASURED, code);
  const energy = pick(COUNTRY_ENERGY, code);
  const land = pick(LAND_USE, code);
  const indexes = pick(COUNTRY_INDEXES, code) ?? {};
  const un = pick(COUNTRY_UN, code);
  const blocs = ALLIANCES.filter((a) => a.members?.includes(code));
  const fr = COUNTRY_FIGURES.freedom[code];
  const cm = COUNTRY_FIGURES.childMortality[code];
  const air = AIR_QUALITY[code];
  const watch = pick(SURVEILLANCE, code);
  // What is illegal, restricted and legal there: the UK Foreign Office's advice, from the law file the site keeps for each country.
  const [advice, setAdvice] = useState<{ code: string; local: CountryLawAdvice } | null>(null);
  useEffect(() => {
    if (!COUNTRY_LAW_HELD.has(code)) return;
    let off = false;
    fetch(`/law/${code}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: CountryLawFile) => !off && j.local && setAdvice({ code, local: j.local }))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [code]);
  const local = advice?.code === code ? advice.local : null;
  const birthsDeaths = ([["birthRate", "Births", INK[1]], ["deathRate", "Deaths", INK[4]]] as [PanelField, string, string][]).flatMap(([f, n, color]) => (P[f] ? [{ n, v: P[f]!.v, color }] : []));
  // Its manufacturing, from the World Bank's figures for its economy.
  const econ = economyForCountry({ code, name });
  const mf = econ ? ECONOMY_MANUFACTURING[econ.id] : undefined;
  const mfValue = mf?.value?.[mf.value.length - 1];
  const mfShare = mf?.share?.[mf.share.length - 1];
  const worldShare = mfShare ? WORLD_MANUFACTURING_SHARE.find(([y]) => y === mfShare[0]) : undefined;
  // What it digs and pumps: its share of world output wherever a table of the largest producers names it; a mineral in two tables once, from the first.
  const produced = [
    ...PRODUCED.flatMap(([what, table]) => {
      const row = table.countries.find((c) => countryForFeature(c.name)?.code === code);
      return row?.productionShare && row.productionShare.pct > 0 ? [{ what, share: row.productionShare, year: table.productionYear, sources: table.sources }] : [];
    }),
    ...(econ ? (CRITICAL_MINERALS[econ.id] ?? []) : []).flatMap((m) => (m.productionShare && m.productionShare.pct > 0 ? [{ what: m.name, share: m.productionShare, year: CRITICAL_MINERALS_SOURCE.year, sources: [CRITICAL_MINERALS_SOURCE] }] : [])),
  ]
    .filter((r, i, all) => all.findIndex((x) => x.what.toLowerCase().replace(/s$/, "") === r.what.toLowerCase().replace(/s$/, "")) === i)
    .sort((x, y) => y.share.pct - x.share.pct);
  const producedSources = produced.slice(0, 8).flatMap((r) => r.sources);
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  const tip = { contentStyle: { background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }, labelStyle: { color: t.headText }, itemStyle: { color: t.headText } };
  // Every kind of offence UNODC records for it, in four groups; each group is drawn on its own scale, since a theft and a bribe are counted in very different numbers.
  const CRIME_GROUPS = [
    { name: "Violent", kinds: [["homicide", "Murders"], ["robbery", "Robberies"], ["assault", "Serious assaults"], ["kidnapping", "Kidnappings"], ["sexualViolence", "Sexual violence"], ["rape", "Rapes"]] },
    { name: "Property", kinds: [["theft", "Thefts"], ["burglary", "Burglaries"], ["vehicleTheft", "Vehicle thefts"], ["fraud", "Frauds"]] },
    { name: "Corruption and organised crime", kinds: [["corruption", "Corruption"], ["bribery", "Bribery"], ["moneyLaundering", "Money laundering"], ["migrantSmuggling", "Smuggling of migrants"]] },
    { name: "Cyber", kinds: [["computerAccess", "Unlawful access to a computer system"]] },
  ] as const;
  const crimeGroups = crime
    ? CRIME_GROUPS.map((g) => ({ name: g.name, rows: g.kinds.flatMap(([k, label]) => (crime[k] ? [{ label, v: crime[k]!.v, y: crime[k]!.y }] : [])) })).filter((g) => g.rows.length)
    : [];
  const indexRows = INDEX_DEFS.flatMap((d) => {
    const f = indexes[d.id];
    if (!f || !d.scale) return [];
    const [a, b] = d.scale;
    const share = ((f.v - a) / (b - a)) * 100;
    return [{ d, f, share: d.better === "lower" ? 100 - share : share }];
  });

  return (
    <div className="flex flex-col gap-2">
      {/* ── Economics and policy ── */}
      <Section t={t} title="Economics, tax and policy" kicker="what it makes, what it raises, what it pays">
        <Panel t={t} title="What its tax revenue is made of" meta={tax?.mix ? `% of revenue · ${tax.mix.y}` : undefined}>
          {tax?.mix ? (
            <>
              <Stack
                t={t}
                parts={[
                  { name: "Income and profits", v: tax.mix.income },
                  { name: "Goods and services", v: tax.mix.goods },
                  { name: "Social contributions", v: tax.mix.social ?? 0 },
                  { name: "Trade", v: tax.mix.trade },
                  { name: "Grants", v: tax.mix.grants ?? 0 },
                  { name: "Other", v: tax.mix.other },
                ]}
              />
              <Foot sources={[COUNTRY_TAX_SOURCES.revenue]} />
            </>
          ) : (
            <None t={t}>No breakdown of revenue is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Its tax rates and pay" meta="statutory rates">
          {tax && (tax.corporate || tax.topIncome || tax.revenue || tax.wageYear || tax.wageMonth) ? (
            <>
              <Bars
                t={t}
                rows={[
                  ...(tax.corporate ? [{ label: "Corporate income tax", text: pct(tax.corporate.v), y: tax.corporate.y, share: tax.corporate.v }] : []),
                  ...(tax.topIncome ? [{ label: "Top personal income tax", text: pct(tax.topIncome.v), y: tax.topIncome.y, share: tax.topIncome.v }] : []),
                  ...(tax.revenue ? [{ label: "Tax revenue, of GDP", text: pct(tax.revenue.v), y: tax.revenue.y, share: tax.revenue.v }] : []),
                ]}
              />
              <Tiles
                t={t}
                items={[
                  ...(tax.wageYear ? [{ label: "Average wage a year", text: `$${Math.round(tax.wageYear.v).toLocaleString("en-US")}`, y: tax.wageYear.y }] : []),
                  ...(tax.wageMonth ? [{ label: "Average wage a month", text: `$${Math.round(tax.wageMonth.v).toLocaleString("en-US")}`, y: tax.wageMonth.y }] : []),
                  ...(P.minimumWageMonthlyUSD ? [{ label: "Minimum wage a month", text: `$${Math.round(P.minimumWageMonthlyUSD.v).toLocaleString("en-US")}`, y: P.minimumWageMonthlyUSD.y }] : []),
                  ...(P.medianDailyIncome ? [{ label: "Median income a day", text: `$${P.medianDailyIncome.v.toFixed(2)}`, y: P.medianDailyIncome.y }] : []),
                ]}
              />
              <Foot sources={[tax.corporate || tax.topIncome ? COUNTRY_TAX_SOURCES.rates : undefined, tax.revenue ? COUNTRY_TAX_SOURCES.revenue : undefined, tax.wageYear ? COUNTRY_TAX_SOURCES.wageYear : undefined, tax.wageMonth ? COUNTRY_TAX_SOURCES.wageMonth : undefined, P.minimumWageMonthlyUSD ? wb("minimumWageMonthlyUSD") : undefined, P.medianDailyIncome ? wb("medianDailyIncome") : undefined]} />
            </>
          ) : (
            <None t={t}>No tax rates are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Work and inequality" meta="% of people">
          {has("laborMale", "laborFemale", "gini", "povertyNationalPct") || ind.unemploymentRate ? (
            <>
              <Bars
                t={t}
                rows={[
                  ...(P.laborMale ? [{ label: "Men in work or looking for it", text: pct(P.laborMale.v), y: P.laborMale.y, share: P.laborMale.v }] : []),
                  ...(P.laborFemale ? [{ label: "Women in work or looking for it", text: pct(P.laborFemale.v), y: P.laborFemale.y, share: P.laborFemale.v }] : []),
                  ...(ind.unemploymentRate ? [{ label: "Unemployed, of the labour force", text: pct(ind.unemploymentRate.v), y: ind.unemploymentRate.y, share: ind.unemploymentRate.v * 3 }] : []),
                  ...(P.povertyNationalPct ? [{ label: "Below the national poverty line", text: pct(P.povertyNationalPct.v), y: P.povertyNationalPct.y, share: P.povertyNationalPct.v }] : []),
                  ...(P.gini ? [{ label: "Inequality of income (Gini, 0 to 100)", text: P.gini.v.toFixed(1), y: P.gini.y, share: P.gini.v }] : []),
                ]}
              />
              {ind.unemploymentRate && <Note t={t}>The unemployment bar is drawn three times as long, so that a few per cent shows.</Note>}
              <Foot sources={[wb("laborMale"), ind.unemploymentRate ? { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url } : undefined, P.gini ? wb("gini") : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of work are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="How its income is shared" meta={people?.income ? `share by fifth · ${people.income.y}` : undefined}>
          {people?.income ? (
            <>
              <SlimBars
                label={`The share of income or spending of each fifth of the people of ${name}, ${people.income.y}`}
                labelWidth="4rem"
                rows={people.income.fifths.map((v, i) => ({ key: String(i), label: ["Poorest", "Second", "Middle", "Fourth", "Richest"][i], v, color: INK[i] }))}
                fmt={(v) => `${v.toFixed(1)}%`}
              />
              {people.income.top10 !== undefined && people.income.bottom10 !== undefined && (
                <Note t={t}>
                  The richest tenth has {pct(people.income.top10)} of income or spending; the poorest tenth {pct(people.income.bottom10)}.
                </Note>
              )}
              <Foot sources={[COUNTRY_PEOPLE_SOURCES.income]} />
            </>
          ) : (
            <None t={t}>No shares of income are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Defence" meta={military?.spendUSDm ? `SIPRI · ${military.spendUSDm.y}` : undefined}>
          {military && (military.spendUSDm || military.personnel) ? (
            <>
              <Tiles
                t={t}
                items={[
                  ...(military.spendUSDm ? [{ label: "Military spending", text: `$${big(military.spendUSDm.v * 1e6)}`, y: military.spendUSDm.y }] : []),
                  ...(military.personnel ? [{ label: "Armed forces", text: big(military.personnel.v), y: military.personnel.y }] : []),
                ]}
              />
              <Bars
                t={t}
                rows={[
                  ...(military.shareOfGDP ? [{ label: "Of GDP", text: pct(military.shareOfGDP.v), y: military.shareOfGDP.y, share: military.shareOfGDP.v * 10 }] : []),
                  ...(military.shareOfGovt ? [{ label: "Of government spending", text: pct(military.shareOfGovt.v), y: military.shareOfGovt.y, share: military.shareOfGovt.v * 4 }] : []),
                ]}
              />
              <Note t={t}>The bars are drawn ten and four times as long, so that small shares show.</Note>
              <Foot sources={[military.spendUSDm ? MILITARY_SOURCES.sipri : undefined, military.personnel ? MILITARY_SOURCES.personnel : undefined]} />
            </>
          ) : (
            <None t={t}>No defence figures are held for {name}.</None>
          )}
        </Panel>
      </Section>

      {/* ── Industry ── */}
      <Section t={t} title="Industry and resources" kicker="what it makes, what its factories turn out, what it digs and pumps">
        <Panel t={t} title="What its economy makes" meta="% of GDP">
          {has("agriculturePct", "industryPct", "servicesPct") ? (
            <>
              <Ring
                t={t}
                slices={(
                  [
                    ["agriculturePct", "Farming, forestry, fishing"],
                    ["industryPct", "Industry"],
                    ["servicesPct", "Services"],
                  ] as [PanelField, string][]
                ).flatMap(([f, n]) => (P[f] ? [{ name: n, v: P[f]!.v }] : []))}
              />
              {P.manufacturingPct && <Note t={t}>Manufacturing, part of industry, is {pct(P.manufacturingPct.v)} of GDP ({P.manufacturingPct.y}). The three need not sum to 100: taxes on products are counted apart.</Note>}
              <Foot sources={[wb("industryPct")]} />
            </>
          ) : (
            <None t={t}>No breakdown of output is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Manufacturing" meta={mfValue ? `World Bank · ${mfValue[0]}` : undefined}>
          {mf?.value?.length ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={mf.value.map(([y, v]) => ({ y: String(y), v }))} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`mf-${code}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INK[0]} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={INK[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={t.gridLine} vertical={false} />
                  <XAxis dataKey="y" {...axis} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis {...axis} width={44} tickFormatter={(v: number) => usdBn(v)} />
                  <Tooltip {...tip} formatter={(v: number) => [usdBn(v), "value added"]} />
                  <Area type="monotone" dataKey="v" stroke={INK[0]} strokeWidth={1.5} fill={`url(#mf-${code})`} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
              <Tiles
                t={t}
                items={[
                  ...(mfShare ? [{ label: "Of GDP", text: pct(mfShare[1]), y: worldShare ? `${mfShare[0]} · world ${pct(worldShare[1])}` : mfShare[0] }] : []),
                  ...(mf.industryJobs ? [{ label: "Jobs in industry", text: pct(mf.industryJobs[1]), y: mf.industryJobs[0] }] : []),
                  ...(mf.exportsShare ? [{ label: "Manufactures, of exports", text: pct(mf.exportsShare[1]), y: mf.exportsShare[0] }] : []),
                  ...(mf.highTech ? [{ label: "High-tech, of manufactured exports", text: pct(mf.highTech[1]), y: mf.highTech[0] }] : []),
                ]}
              />
              <Note t={t}>Value added by manufacturing, in billions of current US dollars, each year the World Bank gives. Jobs in industry count mining, building and utilities with the factories.</Note>
              <Foot sources={[ECONOMY_MANUFACTURING_SOURCE]} />
            </>
          ) : (
            <None t={t}>No figures of manufacturing are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="What its factories make" meta={mf?.branches ? `% of manufacturing · ${mf.branches[0]}` : undefined}>
          {mf?.branches ? (
            <>
              <Ring t={t} slices={MANUFACTURING_BRANCHES.map((b, i) => ({ name: b.name, v: mf.branches![i + 1] as number }))} />
              <Note t={t}>The World Bank's five branches of manufacturing (UNIDO's figures), each its share of the value manufacturing adds.</Note>
              <Foot sources={[ECONOMY_MANUFACTURING_SOURCE]} />
            </>
          ) : (
            <None t={t}>No breakdown of manufacturing is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Factory output, year on year" meta={mf?.growth?.length ? `real growth · ${mf.growth[0][0]}–${mf.growth[mf.growth.length - 1][0]}` : undefined}>
          {mf?.growth?.length ? (
            <>
              <SlimColumns height={150} label={`Real growth of manufacturing in ${name}, year by year`} rows={mf.growth.map(([y, v]) => ({ key: String(y), label: String(y), v }))} fmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}`} up={INK[1]} down={INK[4]} />
              <Note t={t}>How much manufacturing's value added grew or shrank each year, after prices: the World Bank's last ten years held.</Note>
              <Foot sources={[ECONOMY_MANUFACTURING_SOURCE]} />
            </>
          ) : (
            <None t={t}>No growth of manufacturing is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Minerals and fuels it produces" meta="share of world output">
          {produced.length ? (
            <>
              <Bars t={t} rows={produced.slice(0, 8).map((r, i) => ({ label: r.what, text: shareOf(r.share), y: r.year, share: Math.max(2, r.share.pct * 2), color: INK[(i + 2) % INK.length] }))} />
              <Note t={t}>
                Its share of the world's production of each, as the publisher's tables of the largest producers give it, the largest first; a country outside a table is not listed for it. The bars are drawn twice as long, so that small shares show.
              </Note>
              <Foot sources={producedSources} />
            </>
          ) : (
            <None t={t}>{name} is not among the largest producers of any mineral or fuel the site holds.</None>
          )}
        </Panel>
      </Section>

      {/* ── People ── */}
      <Section t={t} title="Demographics" kicker="who lives there">
        <Panel t={t} title="Births, deaths and the sexes" meta="a year">
          {has("birthRate", "deathRate", "femalePct") ? (
            <>
              {/* Slim bars on faint tracks, in a gradient of their colours, each with its figure at its end. */}
              <SlimBars label={`Births and deaths in ${name}, per 1,000 people`} labelWidth="3.5rem" rows={birthsDeaths.map((d) => ({ key: d.n, label: d.n, v: d.v, color: d.color }))} fmt={(v) => v.toFixed(1)} max={Math.max(10, Math.ceil(Math.max(...birthsDeaths.map((d) => d.v)) / 5) * 5)} />
              <Note t={t}>Births and deaths in a year, each per 1,000 people.</Note>
              <Tiles
                t={t}
                items={[
                  ...(P.femalePct ? [{ label: "Women, of all people", text: pct(P.femalePct.v), y: P.femalePct.y }] : []),
                  ...(P.sexRatioAtBirth ? [{ label: "Boys born for each girl", text: P.sexRatioAtBirth.v.toFixed(2), y: P.sexRatioAtBirth.y }] : []),
                  ...(P.medianAge ? [{ label: "Median age", text: `${P.medianAge.v.toFixed(1)} yrs`, y: P.medianAge.y }] : []),
                  ...(ind.population ? [{ label: "People", text: big(ind.population.v), y: ind.population.y }] : []),
                ]}
              />
              <Foot sources={[wb("birthRate"), P.medianAge ? wb("medianAge") : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of births and deaths are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Its people by age" meta="% of people">
          {has("age0to14", "age15to24", "age25to54", "age55to64", "age65up") ? (
            <>
              <Stack
                t={t}
                parts={(
                  [
                    ["age0to14", "Under 15"],
                    ["age15to24", "15 to 24"],
                    ["age25to54", "25 to 54"],
                    ["age55to64", "55 to 64"],
                    ["age65up", "65 and over"],
                  ] as [PanelField, string][]
                ).flatMap(([f, n]) => (P[f] ? [{ name: n, v: P[f]!.v }] : []))}
              />
              <Note t={t}>The World Bank's shares of the population in each band, each for its latest year.</Note>
              <Foot sources={[wb("age0to14"), P.age25to54 ? wb("age25to54") : undefined]} />
            </>
          ) : (
            <None t={t}>No age figures are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Religions" meta={people?.religions?.year ? `Factbook · ${people.religions.year}` : undefined}>
          {people?.religions && (people.religions.parts?.length || people.religions.text) ? (
            <>
              <Shares t={t} of={people.religions} />
              <Foot sources={[COUNTRY_PEOPLE_SOURCES.factbook]} />
            </>
          ) : (
            <None t={t}>No account of religion is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Languages and culture" meta={people?.languages?.year ? `Factbook · ${people.languages.year}` : undefined}>
          {(people?.languages && (people.languages.parts?.length || people.languages.text)) || people?.ethnic || heritage?.heritageSites?.length ? (
            <>
              {people?.languages && (people.languages.parts?.length || people.languages.text) ? (
                <>
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
                    Languages
                  </p>
                  <Shares t={t} of={people.languages} />
                </>
              ) : null}
              {people?.ethnic && (people.ethnic.parts?.length || people.ethnic.text) ? (
                <>
                  <p className="text-[9px] font-mono uppercase tracking-widest mt-1" style={{ color: t.mutedText }}>
                    Its peoples{people.ethnic.year ? ` · ${people.ethnic.year}` : ""}
                  </p>
                  <Shares t={t} of={people.ethnic} />
                </>
              ) : null}
              {heritage?.heritageSites?.length ? (
                <>
                  <p className="text-[9px] font-mono uppercase tracking-widest mt-1" style={{ color: t.mutedText }}>
                    World Heritage sites · {heritage.heritageSiteCount ?? heritage.heritageSites.length}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {heritage.heritageSites.map((s) => (
                      <li key={s} className="text-[11px] font-sans leading-snug pl-2 border-l-2" style={{ color: t.bodyText, borderColor: INK[2] }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                  {(heritage.heritageSiteCount ?? 0) > heritage.heritageSites.length && (
                    <Note t={t}>
                      The first {heritage.heritageSites.length} of its {heritage.heritageSiteCount}: those of {name} alone first, then by the year UNESCO inscribed them.
                    </Note>
                  )}
                </>
              ) : null}
              <Foot
                sources={[
                  people?.languages || people?.ethnic ? COUNTRY_PEOPLE_SOURCES.factbook : undefined,
                  heritage?.heritageSites?.length ? { label: "UNESCO World Heritage List (CC BY-SA 4.0)", url: "https://data.unesco.org/explore/dataset/whc001/" } : undefined,
                ]}
              />
            </>
          ) : (
            <None t={t}>No account of its languages or culture is held for {name}.</None>
          )}
        </Panel>
      </Section>

      {/* ── Health and public services ── */}
      <Section t={t} title="Health and public services" kicker="how long, how well, and what is covered">
        <Panel t={t} title="Life and death" meta="years, and deaths">
          {has("lifeExpMale", "lifeExpFemale", "maternalMortality") || cm ? (
            <>
              <Bars
                t={t}
                rows={[
                  ...(P.lifeExpFemale ? [{ label: "Life expectancy, women", text: `${P.lifeExpFemale.v.toFixed(1)} yrs`, y: P.lifeExpFemale.y, share: P.lifeExpFemale.v }] : []),
                  ...(P.lifeExpMale ? [{ label: "Life expectancy, men", text: `${P.lifeExpMale.v.toFixed(1)} yrs`, y: P.lifeExpMale.y, share: P.lifeExpMale.v }] : []),
                ]}
              />
              <Tiles
                t={t}
                items={[
                  ...(cm ? [{ label: "Children who die before five", text: `${cm[1].toFixed(1)} / 1,000`, y: cm[0] }] : []),
                  ...(P.maternalMortality ? [{ label: "Mothers who die giving birth", text: `${Math.round(P.maternalMortality.v)} / 100,000`, y: P.maternalMortality.y }] : []),
                ]}
              />
              <Note t={t}>A bar's length is the years out of 100.</Note>
              <Foot sources={[wb("lifeExpMale"), cm ? COUNTRY_FIGURE_SOURCES.childMortality : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of life and death are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Care and cover" meta="doctors, beds and insurance">
          {has("physicians", "hospitalBeds") || services?.healthCover || services?.outOfPocket ? (
            <>
              <Tiles
                t={t}
                items={[
                  ...(P.physicians ? [{ label: "Doctors per 1,000", text: P.physicians.v.toFixed(1), y: P.physicians.y }] : []),
                  ...(P.hospitalBeds ? [{ label: "Hospital beds per 1,000", text: P.hospitalBeds.v.toFixed(1), y: P.hospitalBeds.y }] : []),
                ]}
              />
              <Bars
                t={t}
                rows={[
                  ...(services?.healthCover ? [{ label: "Covered by public or compulsory insurance", text: pct(services.healthCover.pct), y: services.healthCover.year, share: services.healthCover.pct }] : []),
                  ...(services?.outOfPocket ? [{ label: "Health spending paid out of pocket", text: pct(services.outOfPocket.pct), y: services.outOfPocket.year, share: services.outOfPocket.pct }] : []),
                ]}
              />
              <Foot sources={[P.physicians ? wb("physicians") : undefined, services?.healthCover ? PUBLIC_SERVICE_SOURCES.health : undefined, services?.outOfPocket ? PUBLIC_SERVICE_SOURCES.pocket : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of care are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="The air, and outbreaks" meta={air ? `PM2.5 · ${air.year}` : undefined}>
          {air ? (
            <>
              <p className="text-2xl font-bold font-mono" style={{ color: t.headText }}>
                {air.pm25} <span className="text-xs font-normal">µg/m³</span>
              </p>
              <Bars t={t} rows={[{ label: "Fine particles in the air breathed, against 35 µg/m³", text: `${air.pm25}`, share: (air.pm25 / 35) * 100, color: air.pm25 > 10 ? INK[4] : INK[1] }]} />
              <Note t={t}>
                Population-weighted, as the World Bank gives it. The bar runs to 35 µg/m³, the WHO's first interim target; it is red above 10, the guideline as the World Bank states it.
              </Note>
            </>
          ) : (
            <None t={t}>No reading of the air is held for {name}.</None>
          )}
          <Note t={t}>
            Disease outbreaks and epidemics are not given: the WHO's figures may be used for non-commercial purposes only, which this site is not, and no other body
            publishes them for every country.
          </Note>
          <Foot sources={[air ? { label: AIR_QUALITY_SOURCE.label, url: AIR_QUALITY_SOURCE.url } : undefined]} />
        </Panel>
      </Section>

      {/* ── Education ── */}
      <Section t={t} title="Education" kicker="who can read, how far they go, what is free">
        <Panel t={t} title="Reading, by sex" meta="% of adults">
          {has("literacy", "literacyMale", "literacyFemale") ? (
            <>
              <SlimBars
                label={`Adults who can read in ${name}, by sex`}
                labelWidth="3.5rem"
                max={100}
                rows={(
                  [
                    ["literacy", "All", INK[0]],
                    ["literacyMale", "Men", INK[5]],
                    ["literacyFemale", "Women", INK[6]],
                  ] as [PanelField, string, string][]
                ).flatMap(([f, n, color]) => (P[f] ? [{ key: n, label: n, v: P[f]!.v, color, tip: `${n}: ${pct(P[f]!.v)} can read · ${P[f]!.y}` }] : []))}
                fmt={pct}
              />
              <Foot sources={[wb("literacy")]} />
            </>
          ) : (
            <None t={t}>No literacy figures are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="How far people go" meta="adults 25 and over">
          {has("upperSecondaryPct", "bachelorsPct", "schoolingYears") ? (
            <>
              <Bars
                t={t}
                rows={[
                  ...(P.upperSecondaryPct ? [{ label: "Finished upper secondary school", text: pct(P.upperSecondaryPct.v), y: P.upperSecondaryPct.y, share: P.upperSecondaryPct.v }] : []),
                  ...(P.bachelorsPct ? [{ label: "Hold a bachelor's degree", text: pct(P.bachelorsPct.v), y: P.bachelorsPct.y, share: P.bachelorsPct.v }] : []),
                ]}
              />
              {P.schoolingYears && <Tiles t={t} items={[{ label: "Years of schooling, on average", text: P.schoolingYears.v.toFixed(1), y: P.schoolingYears.y }]} />}
              <Foot sources={[P.upperSecondaryPct ? wb("upperSecondaryPct") : undefined, P.schoolingYears ? wb("schoolingYears") : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of schooling are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Free schooling, in law" meta={services?.freeSchool ? `UNESCO · ${services.freeSchool.year}` : undefined}>
          {services?.freeSchool ? (
            <>
              <Bars
                t={t}
                rows={[
                  { label: "Years of free primary and secondary school", text: `${services.freeSchool.years} yrs`, share: (services.freeSchool.years / 13) * 100 },
                  ...(services.freeSchool.compulsory !== undefined ? [{ label: "Years of school that are compulsory", text: `${services.freeSchool.compulsory} yrs`, share: (services.freeSchool.compulsory / 13) * 100 }] : []),
                  ...(services.freeSchool.prePrimary !== undefined ? [{ label: "Years of free pre-primary", text: `${services.freeSchool.prePrimary} yrs`, share: (services.freeSchool.prePrimary / 13) * 100 }] : []),
                ]}
              />
              <Note t={t}>What its law guarantees, as UNESCO records it; a bar runs to thirteen years.</Note>
              <Foot sources={[PUBLIC_SERVICE_SOURCES.school]} />
            </>
          ) : (
            <None t={t}>No record of free schooling is held for {name}.</None>
          )}
        </Panel>
      </Section>

      {/* ── Security, crime and justice ── */}
      <Section t={t} title="Security, crime and justice" kicker="how safe, how lawful, who is held">
        <Panel t={t} title="Crime by type" meta="recorded by the police, per 100,000 people" className={crimeGroups.length > 1 ? "md:!basis-full xl:!basis-full" : ""}>
          {crimeGroups.length ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {crimeGroups.map((g, gi) => (
                  <div key={g.name} className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
                      {g.name}
                    </p>
                    <SlimBars
                      label={`${g.name} offences recorded in ${name}, per 100,000 people`}
                      labelWidth="8rem"
                      rows={g.rows.map((r, i) => ({ key: r.label, label: r.label, v: r.v, color: INK[(gi * 3 + i + 4) % INK.length], tip: `${r.label}: ${r.v} per 100,000 · ${r.y}` }))}
                      fmt={(v) => (v >= 100 ? Math.round(v).toLocaleString("en-US") : v >= 1 ? v.toFixed(1) : v.toFixed(2))}
                    />
                    <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                      {[...new Set(g.rows.map((r) => r.y))].sort().join(", ")}
                    </p>
                  </div>
                ))}
              </div>
              <Note t={t}>
                Offences recorded by the police, as UNODC gathers them, each for the latest year it holds in the last ten. Each group is drawn on its own scale. Each country records by its own definitions and its people report
                crimes to the police at different rates, so a higher figure can mean more reporting as well as more crime: UNODC cautions against setting one country's against another's.
              </Note>
              <Foot sources={[CRIME_SOURCE]} />
            </>
          ) : (
            <None t={t}>No recorded crime is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Stability and the rule of law" meta={security?.ruleOfLaw ? `World Bank · ${security.ruleOfLaw.y}` : undefined}>
          {security?.stability || security?.ruleOfLaw ? (
            <>
              {security.stability && <Range t={t} label="Political stability, no violence" v={security.stability.v} lo={security.stability.lo} hi={security.stability.hi} text={`${security.stability.v} of 100`} color={INK[0]} />}
              {security.ruleOfLaw && <Range t={t} label="Rule of law" v={security.ruleOfLaw.v} lo={security.ruleOfLaw.lo} hi={security.ruleOfLaw.hi} text={`${security.ruleOfLaw.v} of 100`} color={INK[3]} />}
              <Note t={t}>The World Bank's percentile ranks: the dot is the country's, the band the range it is fairly sure of.</Note>
              {prison && <Tiles t={t} items={[{ label: "In prison, per 100,000", text: String(prison.v), y: prison.y }]} />}
              <Foot sources={[PUBLIC_SECURITY_SOURCES.wgi, prison ? PRISON_RATES_SOURCE : undefined]} />
            </>
          ) : (
            <None t={t}>No governance scores are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Through the courts" meta={justice ? `UNODC · ${justice.y}` : undefined}>
          {justice ? (
            <>
              <Bars
                t={t}
                rows={(
                  [
                    ["suspected", "Suspected or arrested"],
                    ["prosecuted", "Prosecuted"],
                    ["courts", "Brought before the courts"],
                    ["convicted", "Convicted"],
                  ] as const
                ).flatMap(([k, label]) => {
                  const v = justice[k];
                  const top = Math.max(justice.suspected ?? 0, justice.prosecuted ?? 0, justice.courts ?? 0, justice.convicted ?? 0) || 1;
                  return v !== undefined ? [{ label, text: big(v), share: (v / top) * 100 }] : [];
                })}
              />
              <Note t={t}>People counted at each stage in a year, as UNODC gathers them. The stages are counted apart and need not narrow.</Note>
              <Foot sources={[JUSTICE_SOURCES.unodc]} />
            </>
          ) : (
            <None t={t}>No counts of the courts are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Conflict and refuge" meta={security?.conflict ? `${security.conflict.y}` : undefined}>
          {security?.conflict || security?.refugeesFrom || security?.refugeesHosted || security?.newDisplacements ? (
            <>
              <Tiles
                t={t}
                items={[
                  ...(security.conflict ? [{ label: "Deaths in armed conflict", text: big(security.conflict.stateBased + security.conflict.nonState + security.conflict.oneSided), y: security.conflict.y }] : []),
                  ...(security.refugeesFrom ? [{ label: "Refugees who have left", text: big(security.refugeesFrom.v), y: security.refugeesFrom.y }] : []),
                  ...(security.refugeesHosted ? [{ label: "Refugees it hosts", text: big(security.refugeesHosted.v), y: security.refugeesHosted.y }] : []),
                  ...(security.newDisplacements ? [{ label: "Newly displaced at home", text: big(security.newDisplacements.v), y: security.newDisplacements.y }] : []),
                ]}
              />
              {security.conflict && <Note t={t}>Conflict deaths summed here from Uppsala's three kinds: between states and groups, between groups, and against civilians.</Note>}
              <Foot sources={[security.conflict ? PUBLIC_SECURITY_SOURCES.ucdp : undefined, security.refugeesFrom || security.refugeesHosted ? PUBLIC_SECURITY_SOURCES.unhcr : undefined, security.newDisplacements ? PUBLIC_SECURITY_SOURCES.idmc : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of conflict or refuge are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Its law" meta="legal system, and what is illegal, restricted and legal" className={local ? "md:!basis-full xl:!basis-full" : ""}>
          {legal || local ? (
            <>
              {legal && (
              <>
              <div className="flex flex-wrap gap-1.5">
                {legal.traditions.map((tr, i) => (
                  <span key={tr} className="text-[10px] font-sans px-2 py-0.5 rounded-full" style={{ background: `${INK[i]}22`, color: INK[i], border: `1px solid ${INK[i]}55` }}>
                    {tr} law
                  </span>
                ))}
              </div>
              <p className="text-[11px] font-sans leading-relaxed" style={{ color: t.bodyText }}>
                {legal.text}
              </p>
              <Note t={t}>Its legal system, in the Factbook's own words. Its constitution and courts are in the country's window, under Laws.</Note>
              </>
              )}
              {local && <AdviceLists advice={local} country={name} />}
              <Foot sources={[legal ? JUSTICE_SOURCES.legal : undefined, local ? COUNTRY_LAW_SOURCES.advice : undefined]} />
            </>
          ) : (
            <None t={t}>No account of its legal system is held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Surveillance of the public" meta={watch ? `V-Dem · ${watch.y}` : undefined}>
          {watch ? (
            <>
              <Bars
                t={t}
                rows={(Object.keys(SURVEILLANCE_SCALES) as SurveillanceMeasure[]).flatMap((k) => {
                  const v = watch[k];
                  if (v === undefined) return [];
                  const s = SURVEILLANCE_SCALES[k];
                  const top = s.points.length - 1;
                  const word = s.points[Math.max(0, Math.min(top, Math.round(v)))];
                  return [{ label: `${s.name}: ${word.toLowerCase()}`, text: `${v} of ${top}`, share: (v / top) * 100, color: v / top < 0.4 ? INK[4] : v / top < 0.7 ? INK[2] : INK[1] }];
                })}
              />
              <Note t={t}>
                Each the estimate of V-Dem's country experts on its question's scale: lower is more surveillance or restriction, and the words are its codebook's for the
                nearest point. The bar is red in the lowest two fifths of the scale, amber in the next, green above.
              </Note>
              <Foot sources={[SURVEILLANCE_SOURCE]} />
            </>
          ) : (
            <None t={t}>V-Dem gives no estimate of surveillance for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Freedom" meta={fr ? `Freedom House · ${fr[0]}` : undefined}>
          {fr ? (
            <>
              <p className="text-2xl font-bold font-mono" style={{ color: t.headText }}>
                {fr[1]} <span className="text-xs font-normal">of 100 · {({ F: "Free", PF: "Partly free", NF: "Not free" } as const)[fr[4]]}</span>
              </p>
              <Bars
                t={t}
                rows={[
                  { label: "Political rights, of 40", text: String(fr[2]), share: (fr[2] / 40) * 100 },
                  { label: "Civil liberties, of 60", text: String(fr[3]), share: (fr[3] / 60) * 100 },
                ]}
              />
              <Foot sources={[COUNTRY_FIGURE_SOURCES.freedom]} />
            </>
          ) : (
            <None t={t}>No Freedom House score is held for {name}.</None>
          )}
        </Panel>
      </Section>

      {/* ── Infrastructure, energy and land ── */}
      <Section t={t} title="Infrastructure, energy and land" kicker="what connects it, powers it and covers it">
        <Panel t={t} title="Energy it uses" meta={energy ? `US EIA · ${energy.y}` : undefined}>
          {energy ? (
            <>
              <Ring t={t} slices={energy.mix.map((m) => ({ name: m.source, v: m.pct, color: m.color }))} />
              <Bars
                t={t}
                rows={[
                  { label: "Produced", text: `${Math.round(energy.totalProductionTWh).toLocaleString("en-US")} TWh`, share: (energy.totalProductionTWh / Math.max(energy.totalProductionTWh, energy.totalUseTWh)) * 100, color: INK[1] },
                  { label: "Used", text: `${Math.round(energy.totalUseTWh).toLocaleString("en-US")} TWh`, share: (energy.totalUseTWh / Math.max(energy.totalProductionTWh, energy.totalUseTWh)) * 100, color: INK[2] },
                ]}
              />
              <Foot sources={[ENERGY_SOURCE]} />
            </>
          ) : (
            <None t={t}>No energy figures are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Connections and transport" meta="per 100 people">
          {has("mobilePer100", "broadbandPer100", "railKm", "logisticsIndex", "evSalesShare") ? (
            <>
              <Bars
                t={t}
                rows={[
                  ...(P.mobilePer100 ? [{ label: "Mobile subscriptions", text: P.mobilePer100.v.toFixed(0), y: P.mobilePer100.y, share: (P.mobilePer100.v / 150) * 100 }] : []),
                  ...(P.broadbandPer100 ? [{ label: "Fixed broadband", text: P.broadbandPer100.v.toFixed(1), y: P.broadbandPer100.y, share: P.broadbandPer100.v * 2 }] : []),
                  ...(P.evSalesShare ? [{ label: "Electric cars, of new sales", text: pct(P.evSalesShare.v), y: P.evSalesShare.y, share: P.evSalesShare.v }] : []),
                ]}
              />
              <Tiles
                t={t}
                items={[
                  ...(P.railKm ? [{ label: "Railway", text: `${Math.round(P.railKm.v).toLocaleString("en-US")} km`, y: P.railKm.y }] : []),
                  ...(P.logisticsIndex ? [{ label: "Logistics, 1 to 5", text: P.logisticsIndex.v.toFixed(2), y: P.logisticsIndex.y }] : []),
                ]}
              />
              <Note t={t}>Mobile bars run to 150 subscriptions per 100 people, broadband to 50.</Note>
              <Foot sources={[P.mobilePer100 ? wb("mobilePer100") : undefined, P.evSalesShare ? wb("evSalesShare") : undefined]} />
            </>
          ) : (
            <None t={t}>No figures of connection are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="How its land is used" meta={land ? `% of land · ${land.y}` : undefined}>
          {land ? (
            <>
              <Stack
                t={t}
                parts={[
                  { name: "Forest", v: land.forest, color: INK[1] },
                  { name: "Cropland", v: land.cropland, color: INK[2] },
                  { name: "Pasture", v: land.pasture, color: INK[7] },
                  { name: "Other", v: land.other, color: INK[9] },
                ]}
              />
              <Foot sources={[LAND_USE_SOURCE]} />
            </>
          ) : (
            <None t={t}>No figures of land use are held for {name}.</None>
          )}
        </Panel>
      </Section>

      {/* ── Standing and the world ── */}
      <Section t={t} title="Standing, relations and the world" kicker="how it is ranked, and whom it is allied with">
        <Panel t={t} title="Official indexes" meta={`${indexRows.length} held`} className="md:!basis-full xl:!basis-full">
          {indexRows.length ? (
            <>
              <Bars
                t={t}
                wide
                rows={indexRows.map(({ d, f, share }) => ({
                  label: `${d.name} (${d.by})`,
                  text: `${f.v}${f.rank ? ` · #${f.rank}` : f.place ? ` · ${f.place} of ${f.of}` : ""}`,
                  y: f.y,
                  share,
                }))}
              />
              <Note t={t}>Each index on its own scale, drawn so that a longer bar is the better end; a rank is its maker's, a place counted here among those scored.</Note>
              <Foot sources={indexRows.map((r) => r.d.source)} />
            </>
          ) : (
            <None t={t}>No published index scores are held for {name}.</None>
          )}
        </Panel>
        <Panel t={t} title="Alliances and blocs" meta={`${blocs.length} the site holds`} className="md:!basis-full xl:!basis-full order-last">
          {blocs.length ? (
            <>
              {/* Each grouping by its kind, and each body described: what it is, its founding, seat and members, and - on a press - what it is working on and what it has done. */}
              {[...new Set(blocs.map((b) => b.kind))].map((kind, i) => (
                <div key={kind} className="flex flex-col gap-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
                    {ALLIANCE_KIND_PLURAL[kind]}
                  </p>
                  <div className="flex flex-col">
                    {blocs
                      .filter((b) => b.kind === kind)
                      .map((b) => (
                        <div key={b.id} className="py-3 first:pt-1 border-b last:border-b-0 flex flex-col gap-1.5 min-w-0" style={{ borderColor: t.gridLine }}>
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${INK[i % INK.length]}1f`, color: t.headText, border: `1px solid ${INK[i % INK.length]}55` }}>
                              {b.short}
                            </span>
                            {b.name !== b.short && (
                              <span className="text-[11px] font-sans font-semibold leading-tight truncate" style={{ color: t.headText }} title={b.name}>
                                {b.name}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                            {[b.founded ? `founded ${b.founded}` : null, b.headquarters ? `seat ${b.headquarters}` : null, `${b.memberCount} members`].filter(Boolean).join(" · ")}
                          </p>
                          {b.what && (
                            <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                              {b.what}
                            </p>
                          )}
                          {b.note && (
                            <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                              {b.note}
                            </p>
                          )}
                          {!!(b.agenda?.length || b.impact?.length) && (
                            <details className="group">
                              <summary className="cursor-pointer list-none text-[9px] font-mono uppercase tracking-wider select-none" style={{ color: t.mutedText }}>
                                <span className="group-open:hidden">Its work and record +</span>
                                <span className="hidden group-open:inline">Its work and record −</span>
                              </summary>
                              {b.agenda?.length ? (
                                <>
                                  <p className="text-[9px] font-mono uppercase tracking-widest mt-1.5" style={{ color: t.mutedText }}>
                                    Working on
                                  </p>
                                  <ul className="list-disc pl-4 flex flex-col gap-0.5">
                                    {b.agenda.map((x) => (
                                      <li key={x} className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                                        {x}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              ) : null}
                              {b.impact?.length ? (
                                <>
                                  <p className="text-[9px] font-mono uppercase tracking-widest mt-1.5" style={{ color: t.mutedText }}>
                                    What it has done
                                  </p>
                                  <ul className="list-disc pl-4 flex flex-col gap-0.5">
                                    {b.impact.map((x) => (
                                      <li key={x} className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                                        {x}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              ) : null}
                            </details>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {un && (
                <Note t={t}>
                  A member of the United Nations since {un.admitted.slice(0, 4)} ({un.nth}
                  {["th", "st", "nd", "rd"][un.nth % 10 > 3 || [11, 12, 13].includes(un.nth % 100) ? 0 : un.nth % 10]} to join)
                  {un.group !== undefined ? `, in the ${UN_GROUPS[un.group]}` : ""}
                  {un.council === "permanent" ? "; a permanent member of the Security Council" : ""}.
                </Note>
              )}
              <Foot sources={[...blocs.map((b) => b.source), un ? COUNTRY_UN_SOURCES.members : undefined]} />
            </>
          ) : (
            <None t={t}>{name} belongs to none of the alliances and blocs the site holds.</None>
          )}
        </Panel>
      </Section>
    </div>
  );
}
