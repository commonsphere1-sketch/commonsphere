/**
 * What the Policy page's explorer shows beside a headline, under the link to
 * the story: where the headline came from, the published figures for the
 * place it is about, and the week's other policy headlines about that place.
 *
 * None of it is taken from the story. The news job keeps a story's headline,
 * link, outlet and time and never its text, so there is nothing of the story
 * here beyond its headline; what surrounds it is the place's own record, as
 * the site already builds it from each source - Freedom House, the World
 * Bank, the IMF's spending by function, SIPRI, the US EIA, the bodies' own
 * member lists, and for US states the Census Bureau, BEA, BLS, the FEC, the
 * Tax Foundation, the Department of Labor and Wikidata. Every figure has its
 * year, and a place a source does not cover has no figure for it rather than
 * an estimate. Government type and head of government are left out: the
 * site's country data has them written by hand, with no source.
 *
 * DataExplorer loads this lazily, on the Policy page only, so the
 * Dashboard's panel does not carry the data it draws on.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react";
import { supabase } from "../lib/supabase";
import { useLiveCountries, useLiveStates } from "../contexts/LiveDataContext";
import { useLiveStatus } from "../lib/liveFigures";
import type { Country, DataSource, ReferenceField } from "../data/countriesData";
import type { USState } from "../data/statesData";
import { COUNTRY_PANELS, panelSource } from "../data/countryPanels";
import { BUDGET_DIVISIONS, BUDGET_SOURCE, COUNTRY_BUDGET, type BudgetDivision } from "../data/countryBudget";
import { MILITARY_MEASURED, MILITARY_SOURCES, type MilitaryFigure } from "../data/militarySpending";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { COUNTRY_FIGURES, COUNTRY_FIGURE_SOURCES } from "../data/worldview";
import { ALLIANCES, ALLIANCES_CHECKED, HUMAN_RIGHTS_CHECKED, type AllianceKind } from "../data/alliances";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { STATE_ENERGY, STATE_ENERGY_SOURCE, STATE_ENERGY_YEAR } from "../data/stateEnergy";
import { NEWS_SOURCES } from "../data/newsSources";
import { has } from "../lib/na";
import { usdFromBillions } from "../lib/money";
import { SourceLink } from "./SourceLink";
import { ago, outletList, placeName, type Headline } from "./HeadlinesBanner";
import { Kpi, Label, type Tokens } from "./DataExplorer";

/** A policy topic whose words are in the headline, with the words found. */
export type TopicHit = { label: string; color: string; words: string[] };

/** The Policies colour: the one accent for this pane's marks. */
const ACCENT = "#a855f7";
const DAY = 86_400_000;

const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}`;
const compact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const twh = (v: number) => `${v >= 100 ? Math.round(v).toLocaleString("en-US") : v} TWh`;
const dayMonthYear = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
/** "the United States", "New Zealand". */
const the = (name: string) => (/^United /.test(name) ? `the ${name}` : name);
/** "rnz.co.nz/rss/political.xml". */
const feedName = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

// ── Pieces ──────────────────────────────────────────────────────────────────

function Section({ t, title, note, children }: { t: Tokens; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
      <div>
        <Label t={t}>{title}</Label>
        {note && (
          <p className="text-[10px] font-sans leading-snug mt-1" style={{ color: t.mutedText }}>
            {note}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

type Fact = { label: string; value: ReactNode };

function Facts({ t, rows }: { t: Tokens; rows: Fact[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map(({ label, value }, i) => (
        <div key={i} className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
          <dt className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
            {label}
          </dt>
          <dd className="text-[11px] font-sans font-semibold text-right min-w-0 break-words" style={{ color: t.headText }}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Out({ t, href, title, children }: { t: Tokens; href: string; title?: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:opacity-80" style={{ color: t.headText }}>
      {children}
      <ArrowSquareOut size={9} className="shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

type Fig = { label: string; value: string; sub?: string };

/** Figures as tiles, two or three to a row. */
function Figs({ t, figs }: { t: Tokens; figs: Fig[] }) {
  if (!figs.length) return null;
  return (
    <div className={`grid gap-1.5 ${figs.length === 3 ? "grid-cols-3" : figs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {figs.map((f) => (
        <Kpi key={f.label} t={t} label={f.label} value={f.value} sub={f.sub} color={t.headText} />
      ))}
    </div>
  );
}

type Bar = { key: string; label: string; value: number; text: string; strong?: boolean };

/** Shares as bars on one scale, the largest filling the track. */
function Bars({ t, rows }: { t: Tokens; rows: Bar[] }) {
  const top = Math.max(0, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2" title={`${r.label}: ${r.text}`}>
          <span className={`text-[10px] font-sans flex-1 min-w-0 truncate ${r.strong ? "font-bold" : ""}`} style={{ color: t.headText }}>
            {r.label}
          </span>
          <span className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }}>
            <span className="block h-full rounded-full" style={{ width: `${top > 0 ? (100 * r.value) / top : 0}%`, background: ACCENT, opacity: r.strong ? 1 : 0.55 }} />
          </span>
          <span className={`text-[10px] font-mono w-11 text-right shrink-0 ${r.strong ? "font-bold" : ""}`} style={{ color: r.strong ? t.headText : t.mutedText }}>
            {r.text}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A block of a place's figures: tiles, then bars, then where they come from. */
type Block = { key: string; title: string; note?: ReactNode; figs: Fig[]; bars?: { caption: string; rows: Bar[] }; sources: DataSource[] };

function BlockView({ t, b }: { t: Tokens; b: Block }) {
  return (
    <Section t={t} title={b.title} note={b.note}>
      <Figs t={t} figs={b.figs} />
      {b.bars && (
        <>
          <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            {b.bars.caption}
          </p>
          <Bars t={t} rows={b.bars.rows} />
        </>
      )}
      <SourceLink sources={b.sources} />
    </Section>
  );
}

function ProfileButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold transition-opacity hover:opacity-80 cursor-pointer"
      style={{ background: ACCENT + "18", color: ACCENT, border: `1px solid ${ACCENT}25` }}
    >
      {children} <ArrowRight size={11} weight="bold" />
    </button>
  );
}

// ── A country's record ──────────────────────────────────────────────────────

const FREEDOM_STATUS = { F: "Free", PF: "Partly Free", NF: "Not Free" } as const;

/** The spending function nearest a topic, where one plainly is. */
const TOPIC_FUNCTION: Record<string, BudgetDivision> = { Defence: "GF02", Climate: "GF05", "Jobs & pay": "GF10" };

const KINDS: [kind: AllianceKind, label: string][] = [
  ["Security alliance", "Security"],
  ["Political & regional bloc", "Political"],
  ["Economic & trade bloc", "Economic"],
  ["International agency", "Agencies"],
  ["Human rights body", "Human rights"],
];

/** The year a cited figure is for: the end of its source's label. */
const yearOf = (s: DataSource | undefined) => /, (\d{4})$/.exec(s?.label ?? "")?.[1];

function countryBlocks(c: Country, topics: string[]): Block[] {
  const p = COUNTRY_PANELS[c.id] ?? {};
  const budget = COUNTRY_BUDGET[c.code];
  const energy = COUNTRY_ENERGY[c.id];
  const out: Block[] = [];
  // The energy mix is drawn once, under whichever of energy and climate comes first.
  let mixDrawn = false;
  const mix = () => {
    if (!energy || mixDrawn) return undefined;
    mixDrawn = true;
    return {
      caption: `What its energy production is made of, ${energy.y}`,
      rows: [...energy.mix].sort((a, b) => b.pct - a.pct).map((m) => ({ key: m.source, label: m.source, value: m.pct, text: `${m.pct}%` })),
    };
  };

  for (const topic of topics) {
    const figs: Fig[] = [];
    const sources: DataSource[] = [];
    if (topic === "Defence") {
      const m = MILITARY_MEASURED[c.id];
      const yr = (f: MilitaryFigure) => `${f.y}${f.flag === "estimate" ? " · SIPRI's estimate" : f.flag === "uncertain" ? " · highly uncertain" : ""}`;
      if (m?.spendUSDm) figs.push({ label: "Military spending", value: usdFromBillions(m.spendUSDm.v / 1000), sub: yr(m.spendUSDm) });
      if (m?.shareOfGDP) figs.push({ label: "As a share of GDP", value: `${m.shareOfGDP.v}%`, sub: yr(m.shareOfGDP) });
      if (m?.shareOfGovt) figs.push({ label: "Of government spending", value: `${m.shareOfGovt.v}%`, sub: yr(m.shareOfGovt) });
      if (m?.spendUSDm || m?.shareOfGDP || m?.shareOfGovt) sources.push(MILITARY_SOURCES.sipri);
      if (m?.personnel) {
        figs.push({ label: "Armed forces", value: compact(m.personnel.v), sub: `${m.personnel.y} · with paramilitary` });
        sources.push(MILITARY_SOURCES.personnel);
      }
      if (figs.length) out.push({ key: topic, title: `Defence in ${the(c.name)}`, figs, sources });
    } else if (topic === "Trade") {
      if (p.tradeBalanceUSD) {
        figs.push({ label: "Trade balance", value: usdFromBillions(p.tradeBalanceUSD.v / 1e9, true), sub: `${p.tradeBalanceUSD.y} · goods and services` });
        sources.push(panelSource(p.tradeBalanceUSD));
      }
      if (p.logisticsIndex) {
        figs.push({ label: "Logistics performance", value: `${p.logisticsIndex.v} of 5`, sub: p.logisticsIndex.y });
        sources.push(panelSource(p.logisticsIndex));
      }
      if (figs.length) out.push({ key: topic, title: `Trade in ${the(c.name)}`, figs, sources });
    } else if (topic === "Energy") {
      if (energy) {
        figs.push({ label: "Energy used", value: twh(energy.totalUseTWh), sub: energy.y }, { label: "Energy produced", value: twh(energy.totalProductionTWh), sub: energy.y });
        sources.push(ENERGY_SOURCE);
      }
      if (p.electricityAccess) {
        figs.push({ label: "People with electricity", value: `${p.electricityAccess.v}%`, sub: p.electricityAccess.y });
        sources.push(panelSource(p.electricityAccess));
      }
      const bars = mix();
      if (figs.length || bars) out.push({ key: topic, title: `Energy in ${the(c.name)}`, figs, bars, sources });
    } else if (topic === "Climate") {
      if (p.evSalesShare) {
        figs.push({ label: "Electric share of new cars", value: `${p.evSalesShare.v}%`, sub: p.evSalesShare.y });
        sources.push(panelSource(p.evSalesShare));
      }
      if (budget && budget.shares.GF05 > 0) {
        figs.push({ label: "Environmental protection", value: `${budget.shares.GF05.toFixed(1)}%`, sub: `of government spending · ${budget.y}` });
        sources.push(BUDGET_SOURCE);
      }
      const bars = mix();
      if (bars) sources.push(ENERGY_SOURCE);
      if (figs.length || bars) out.push({ key: topic, title: `Climate in ${the(c.name)}`, figs, bars, sources });
    } else if (topic === "Tech") {
      if (p.internetPct) figs.push({ label: "Using the internet", value: `${p.internetPct.v}%`, sub: p.internetPct.y });
      if (p.mobilePer100) figs.push({ label: "Mobile subscriptions", value: `${Math.round(p.mobilePer100.v)}`, sub: `per 100 people · ${p.mobilePer100.y}` });
      if (p.broadbandPer100) figs.push({ label: "Fixed broadband", value: `${p.broadbandPer100.v}`, sub: `per 100 people · ${p.broadbandPer100.y}` });
      for (const f of [p.internetPct, p.mobilePer100, p.broadbandPer100]) if (f) sources.push(panelSource(f));
      if (figs.length) out.push({ key: topic, title: `Technology in ${the(c.name)}`, figs, sources });
    } else if (topic === "Jobs & pay") {
      if (p.laborMale && p.laborFemale && p.laborMale.y === p.laborFemale.y) {
        figs.push({ label: "In the labour force: men · women", value: `${p.laborMale.v}% · ${p.laborFemale.v}%`, sub: `of those 15 and over · ${p.laborMale.y}` });
        sources.push(panelSource(p.laborMale));
      }
      if (p.minimumWageMonthlyUSD) {
        figs.push({ label: "Minimum wage", value: `$${p.minimumWageMonthlyUSD.v.toLocaleString("en-US")}`, sub: `a month · ${p.minimumWageMonthlyUSD.y}` });
        sources.push(panelSource(p.minimumWageMonthlyUSD));
      }
      if (p.medianDailyIncome) {
        figs.push({ label: "Median income or spending", value: `$${p.medianDailyIncome.v.toFixed(2)}`, sub: `a person a day, 2021 PPP · ${p.medianDailyIncome.y}` });
        sources.push(panelSource(p.medianDailyIncome));
      }
      if (budget && budget.shares.GF10 > 0) {
        figs.push({ label: "Social protection", value: `${budget.shares.GF10.toFixed(1)}%`, sub: `of government spending · ${budget.y}` });
        sources.push(BUDGET_SOURCE);
      }
      if (figs.length) out.push({ key: topic, title: `Work and pay in ${the(c.name)}`, figs, sources });
    }
  }
  return out;
}

function CountryRecord({ t, c, topics }: { t: Tokens; c: Country; topics: string[] }) {
  const navigate = useNavigate();
  const p = COUNTRY_PANELS[c.id] ?? {};
  const blocks = countryBlocks(c, topics);

  // Rights and representation.
  const fh = COUNTRY_FIGURES.freedom[c.code];
  const rights: Fig[] = [];
  const rightsSources: DataSource[] = [];
  if (fh) {
    rights.push({ label: "Freedom score", value: `${fh[1]}/100`, sub: `${FREEDOM_STATUS[fh[4]]} · ${fh[0]}` });
    rightsSources.push(COUNTRY_FIGURE_SOURCES.freedom);
  }
  if (p.parliamentFemale) {
    rights.push({ label: "Women in parliament", value: `${p.parliamentFemale.v}%`, sub: p.parliamentFemale.y });
    rightsSources.push(panelSource(p.parliamentFemale));
  }
  if (p.cpiScore) {
    rights.push({ label: "Corruption index", value: `${p.cpiScore.v}/100`, sub: p.cpiScore.y });
    rightsSources.push(panelSource(p.cpiScore));
  }
  const rightsNote = [
    fh ? `Freedom House gives ${the(c.name)} ${fh[2]} of 40 for political rights and ${fh[3]} of 60 for civil liberties.` : "",
    p.cpiScore ? "Transparency International's index runs from 0, highly corrupt, to 100, very clean." : "",
  ]
    .filter(Boolean)
    .join(" ");

  // What its government spends, by function.
  // A function reported as zero is left out of the bars and named instead, as the Economies page leaves it out of its pie:
  // the figure does not say whether nothing is spent or the spending is filed under another function.
  const budget = COUNTRY_BUDGET[c.code];
  const marked = new Set(topics.map((x) => TOPIC_FUNCTION[x]).filter((id) => id && budget && budget.shares[id] > 0));
  const spending: Bar[] = budget
    ? BUDGET_DIVISIONS.filter((d) => budget.shares[d.id] > 0)
        .map((d) => ({ key: d.id, label: d.label, value: budget.shares[d.id], text: `${budget.shares[d.id].toFixed(1)}%`, strong: marked.has(d.id) }))
        .sort((a, b) => b.value - a.value)
    : [];
  if (budget?.unclassified) spending.push({ key: "none", label: "Not classified by function", value: budget.unclassified, text: `${budget.unclassified.toFixed(1)}%` });
  const unreported = budget ? BUDGET_DIVISIONS.filter((d) => budget.shares[d.id] === 0).map((d) => d.label.toLowerCase()) : [];

  // The economy: only figures that carry a source.
  const cited = (f: ReferenceField) => (c.sources?.[f] && has(c[f as "gdp"]) ? c.sources[f] : undefined);
  const economy: Fig[] = [];
  const economySources: DataSource[] = [];
  const add = (f: ReferenceField, label: string, value: (v: number) => string, sub = "") => {
    const src = cited(f);
    if (!src) return;
    const y = yearOf(src);
    economy.push({ label, value: value(c[f as "gdp"]), sub: [y, sub].filter(Boolean).join(" · ") || undefined });
    economySources.push(src);
  };
  add("gdp", "GDP", (v) => usdFromBillions(v));
  add("gdpGrowth", "Growth", (v) => `${signed(v)}%`, "real");
  add("inflationRate", "Inflation", (v) => `${v.toFixed(1)}%`, "consumer prices");
  add("unemploymentRate", "Unemployment", (v) => `${v.toFixed(1)}%`);

  const blocs = ALLIANCES.filter((a) => a.members?.includes(c.code));

  return (
    <>
      {blocks.map((b) => (
        <BlockView key={b.key} t={t} b={b} />
      ))}

      {rights.length > 0 && (
        <Section t={t} title="Rights and representation" note={rightsNote || undefined}>
          <Figs t={t} figs={rights} />
          <SourceLink sources={rightsSources} />
        </Section>
      )}

      {budget && (
        <Section
          t={t}
          title="What its government spends"
          note={
            <>
              {budget.spendingPctGdp !== undefined && (
                <>
                  Government spending came to <strong style={{ color: t.headText }}>{budget.spendingPctGdp}% of GDP</strong> in {budget.y}.{" "}
                </>
              )}
              Each function's share of it, for {budget.basis === "general" ? "central, state and local government together" : "central government alone"}
              {marked.size > 0 ? "; in bold, the function nearest the headline's topic" : ""}.
              {unreported.length > 0 && ` It reports nothing under ${unreported.join(" or ")}.`}
            </>
          }
        >
          <Bars t={t} rows={spending} />
          <SourceLink sources={{ label: `${BUDGET_SOURCE.label}, ${budget.y}`, url: BUDGET_SOURCE.url }} />
        </Section>
      )}

      {economy.length > 0 && (
        <Section t={t} title="Its economy">
          <Figs t={t} figs={economy} />
          <SourceLink sources={economySources} />
        </Section>
      )}

      {blocs.length > 0 && (
        <Section t={t} title="Blocs and alliances" note={`Membership as each body lists it, checked ${ALLIANCES_CHECKED} - the human rights bodies on ${HUMAN_RIGHTS_CHECKED}; a seat on the UN Human Rights Council is for this year. Bodies nearly every country belongs to are left out.`}>
          <div className="flex flex-col gap-1.5">
            {KINDS.map(([kind, label]) => {
              const mine = blocs.filter((a) => a.kind === kind);
              if (!mine.length) return null;
              return (
                <div key={kind} className="flex items-baseline gap-2">
                  <span className="text-[10px] font-mono w-16 shrink-0" style={{ color: t.mutedText }}>
                    {label}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {mine.map((a) => (
                      <a
                        key={a.id}
                        href={a.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${a.name} - ${a.source.label}`}
                        className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-md hover:opacity-80"
                        style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}
                      >
                        {a.short}
                      </a>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <ProfileButton onClick={() => navigate(`/dashboard/countries?open=${c.id}`)}>Full profile: {c.name}</ProfileButton>
    </>
  );
}

// ── A US state's record ─────────────────────────────────────────────────────

const PARTY_COLOR: Record<string, string> = { Democrat: "#3b82f6", Republican: "#ef4444" };

function StateRecord({ t, s, topics }: { t: Tokens; s: USState; topics: string[] }) {
  const navigate = useNavigate();
  const { events } = useLiveStatus();
  const built = STATE_INDICATORS[s.id];
  const y = s.figureYears ?? {};

  // Who governs.
  const since = built && built.governor.name === s.governor ? new Date(`${built.governor.since}T00:00:00`) : null;
  const house = new Map<string, number>();
  for (const r of s.representatives) house.set(r.party, (house.get(r.party) ?? 0) + 1);
  const unlisted = s.houseSeats - s.representatives.length;
  const houseText = [...house.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([party, n]) => `${n} ${party}`)
    .concat(unlisted > 0 ? [`${unlisted} vacant`] : [])
    .join(", ");
  const governs: Fact[] = [
    { label: "Governor", value: `${s.governor} (${s.party})${since ? `, since ${dayMonthYear(since)}` : ""}` },
    ...s.senators.map((sen, i) => ({ label: i === 0 ? "US senators" : "", value: `${sen.name} (${sen.party}), to ${sen.termEnd}` })),
    { label: "US House", value: `${s.houseSeats} seat${s.houseSeats === 1 ? "" : "s"}: ${houseText}` },
  ];
  const ahead = events
    .filter((e) => e.scope === "states" && e.area === s.id && e.kind !== "Data release")
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Taxes and pay.
  const taxes: Fig[] = [
    { label: "Top income tax rate", value: s.stateTaxRate > 0 ? `${s.stateTaxRate}%` : "None", sub: built?.stateTaxRate.note ?? y.stateTaxRate },
    { label: "Sales tax", value: `${s.salesTaxRate}%`, sub: `with local · ${y.salesTaxRate ?? ""}` },
    s.minimumWage > 0
      ? { label: "Minimum wage", value: `$${s.minimumWage.toFixed(2)}`, sub: `an hour · ${y.minimumWage ?? ""}` }
      : { label: "Minimum wage", value: "Federal", sub: `no higher state rate · ${y.minimumWage ?? ""}` },
  ];

  // Its economy.
  const poor = s.wealthPoverty.find((g) => g.label === "Below poverty line");
  const economy: Fig[] = [
    { label: "GDP", value: usdFromBillions(s.gdp), sub: y.gdp },
    { label: "Unemployment", value: `${s.unemploymentRate}%`, sub: y.unemploymentRate },
    { label: "Median household income", value: `$${Math.round(s.medianIncome).toLocaleString("en-US")}`, sub: y.medianIncome },
    ...(poor ? [{ label: "Below the poverty line", value: `${poor.pct}%`, sub: y.wealthPoverty }] : []),
  ];

  // Energy, where the headline is about energy or the climate.
  const power = STATE_ENERGY[s.id];
  const energy: Block | null =
    topics.includes("Energy") || topics.includes("Climate")
      ? {
          key: "energy",
          title: `Energy in ${s.name}`,
          figs: power
            ? [
                { label: "Energy used", value: twh(power.totalUseTWh), sub: `${STATE_ENERGY_YEAR}` },
                { label: "Energy produced", value: twh(power.totalProductionTWh), sub: `${STATE_ENERGY_YEAR}` },
              ]
            : [],
          bars: s.energyMix.length
            ? {
                caption: `What its electricity is generated from, ${y.energyMix ?? ""}`,
                rows: s.energyMix
                  .filter((m) => m.pct > 0)
                  .sort((a, b) => b.pct - a.pct)
                  .map((m) => ({ key: m.source, label: m.source, value: m.pct, text: `${m.pct}%` })),
              }
            : undefined,
          sources: [...(power ? [STATE_ENERGY_SOURCE] : []), ...(s.energyMix.length ? [STATE_SOURCES.eia] : [])],
        }
      : null;

  return (
    <>
      {energy && <BlockView t={t} b={energy} />}

      <Section t={t} title="Who governs">
        <Facts t={t} rows={governs} />
        {s.voterShare.length > 0 && (
          <div>
            <p className="text-[10px] font-sans mb-1" style={{ color: t.mutedText }}>
              How it voted for president, {y.voterShare}
            </p>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5" role="img" aria-label={s.voterShare.map((v) => `${v.party} ${v.pct}%`).join(", ")}>
              {s.voterShare.map((v) => (
                <span key={v.party} style={{ width: `${v.pct}%`, background: PARTY_COLOR[v.party] ?? (t.isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.3)") }} />
              ))}
            </div>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {s.voterShare.map((v) => (
                <span key={v.party} className="flex items-center gap-1 text-[10px] font-mono" style={{ color: t.headText }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: PARTY_COLOR[v.party] ?? (t.isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.3)") }} aria-hidden />
                  {v.party} {v.pct}%
                </span>
              ))}
            </p>
          </div>
        )}
        <SourceLink sources={[STATE_SOURCES.governors, STATE_SOURCES.congress, STATE_SOURCES.apportionment, STATE_SOURCES.fec]} />
      </Section>

      {ahead.length > 0 && (
        <Section t={t} title="Elections ahead">
          <div className="flex flex-col">
            {ahead.map((e) => {
              const d = new Date(`${e.event_date}T00:00:00`);
              const days = Math.round((d.getTime() - today.getTime()) / DAY);
              return (
                <div key={e.id} className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                  <span className="text-[11px] font-sans font-semibold min-w-0">
                    <Out t={t} href={e.source_url} title="Open its Wikidata entry">
                      {e.title}
                    </Out>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 text-right" style={{ color: t.mutedText }}>
                    {dayMonthYear(d)}
                    <br />
                    {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
                  </span>
                </div>
              );
            })}
          </div>
          <SourceLink sources={{ label: "Wikidata — scheduled elections", url: "https://www.wikidata.org/" }} />
        </Section>
      )}

      <Section t={t} title="Taxes and pay">
        <Figs t={t} figs={taxes} />
        <SourceLink sources={[STATE_SOURCES.taxIncome, STATE_SOURCES.taxSales, STATE_SOURCES.dol]} />
      </Section>

      <Section t={t} title="Its economy">
        <Figs t={t} figs={economy} />
        <SourceLink sources={[STATE_SOURCES.bea, STATE_SOURCES.bls, STATE_SOURCES.acs]} />
      </Section>

      <ProfileButton onClick={() => navigate(`/dashboard/states?open=${s.id}`)}>Full profile: {s.name}</ProfileButton>
    </>
  );
}

// ── The week's other headlines about a place ────────────────────────────────

/** The most headlines read for one place: more than a week's policy desks carry for any. */
const WEEK_READ = 500;
/**
 * `readSince` is when the policy desks are first known to have been read.
 * A day before that holds only what the feeds still carried when reading
 * began, so its count is a floor, and the bars say so. Null when the store
 * does not show it, and then no bars are drawn.
 */
type Week = { rows: Headline[]; capped: boolean; readSince: Date | null };
/** A place's week, kept ten minutes, as the explorer's own read is. */
const weekCache = new Map<string, { at: number; week: Week }>();

/**
 * When the policy desks were first read, as far as the store shows: the
 * earliest time any headline of theirs was last fetched. Reading began then
 * or before, never after. Asked once.
 */
let desksReadSince: Promise<Date | null> | null = null;
function policyDesksReadSince(db: NonNullable<typeof supabase>): Promise<Date | null> {
  desksReadSince ??= (async () => {
    const { data, error } = await db.from("news_items").select("fetched_at").overlaps("topics", ["policy"]).order("fetched_at", { ascending: true }).limit(1);
    const at = error || !data?.[0] ? NaN : Date.parse(data[0].fetched_at);
    if (Number.isFinite(at)) return new Date(at);
    // Not answered: ask again next time rather than remember the failure.
    desksReadSince = null;
    return null;
  })();
  return desksReadSince;
}

/** Local midnight six days ago to now: seven days, today among them. */
function lastSevenDays(): Date[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)));
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** The policy desks' headlines of the last seven days that are about this place, newest first. */
function usePlaceWeek(place: string | null): Week | null {
  const [week, setWeek] = useState<Week | null>(() => (place ? (weekCache.get(place)?.week ?? null) : null));
  useEffect(() => {
    const db = supabase;
    const hit = place ? weekCache.get(place) : undefined;
    setWeek(hit?.week ?? null);
    if (!place || !db || (hit && Date.now() - hit.at < 10 * 60_000)) return;
    let live = true;
    (async () => {
      const [{ data, error }, readSince] = await Promise.all([
        db
          .from("news_items")
          .select("url, title, outlet, published_at, places")
          .gte("published_at", lastSevenDays()[0].toISOString())
          .overlaps("topics", ["policy"])
          .contains("places", [place])
          .order("published_at", { ascending: false })
          .limit(WEEK_READ),
        policyDesksReadSince(db),
      ]);
      if (error || !data) return;
      // A wire story runs under the same headline at several outlets: the newest copy is enough.
      const titles = new Set<string>();
      const rows = (data as Headline[]).filter((r) => {
        if (typeof r.title !== "string" || !/^https:\/\//.test(r.url) || !Array.isArray(r.places)) return false;
        const k = r.title.toLowerCase().replace(/\s+/g, " ").trim();
        if (titles.has(k)) return false;
        titles.add(k);
        return true;
      });
      const found = { rows, capped: data.length >= WEEK_READ, readSince };
      weekCache.set(place, { at: Date.now(), week: found });
      if (live) setWeek(found);
    })();
    return () => {
      live = false;
    };
  }, [place]);
  return week;
}

/** The days, of the last seven, on which the policy desks were not yet read from the start. */
const daysBeforeReading = (readSince: Date) => lastSevenDays().filter((d) => readSince.getTime() > d.getTime());

/**
 * Headlines a day, as seven bars with their counts. A day the desks were not
 * yet read from its start is outlined, not filled: what it holds is what the
 * feeds still carried, a floor rather than the day's count.
 */
function Days({ t, rows, readSince }: { t: Tokens; rows: Headline[]; readSince: Date }) {
  const days = lastSevenDays();
  const count = new Map<string, number>();
  for (const r of rows) {
    const k = dayKey(new Date(r.published_at));
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  const n = days.map((d) => count.get(dayKey(d)) ?? 0);
  const floor = days.map((d) => readSince.getTime() > d.getTime());
  const top = Math.max(1, ...n);
  const name = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short" });
  const said = (i: number) => (floor[i] ? (n[i] ? `at least ${n[i]}` : "not read yet") : `${n[i]}`);
  return (
    <div className="flex items-end gap-1.5" role="img" aria-label={`Headlines a day: ${days.map((d, i) => `${name(d)} ${said(i)}`).join(", ")}`}>
      {days.map((d, i) => (
        <div key={dayKey(d)} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}: ${said(i)}`}>
          <span className="text-[9px] font-mono" style={{ color: n[i] ? t.headText : t.mutedText }}>
            {floor[i] && !n[i] ? "–" : n[i]}
          </span>
          <span className="w-full flex items-end" style={{ height: 32 }}>
            <span
              className="w-full rounded-t"
              style={
                n[i]
                  ? {
                      height: Math.max(3, Math.round((32 * n[i]) / top)),
                      background: floor[i] ? "transparent" : ACCENT,
                      border: floor[i] ? `1px dashed ${ACCENT}` : undefined,
                      opacity: 0.8,
                    }
                  : { height: 1, background: t.gridLine }
              }
            />
          </span>
          <span className="text-[9px] font-mono" style={{ color: t.mutedText }}>
            {i === days.length - 1 ? "Today" : name(d)}
          </span>
        </div>
      ))}
    </div>
  );
}

function OtherHeadlines({ t, rows, onOpen }: { t: Tokens; rows: Headline[]; onOpen: (h: Headline) => void }) {
  return (
    <div className="flex flex-col">
      {rows.map((r) => (
        <button
          key={r.url}
          type="button"
          onClick={() => onOpen(r)}
          className="flex items-start gap-2 py-2 text-left transition-opacity hover:opacity-80 cursor-pointer"
          style={{ borderBottom: `1px solid ${t.gridLine}` }}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] font-semibold font-sans leading-snug" style={{ color: t.headText }}>
              {r.title}
            </span>
            <span className="block text-[10px] font-mono mt-0.5" style={{ color: t.mutedText }}>
              {r.outlet} · {ago(r.published_at)}
            </span>
          </span>
          <ArrowRight size={10} weight="bold" style={{ color: t.mutedText, flexShrink: 0, marginTop: 3 }} aria-hidden />
        </button>
      ))}
    </div>
  );
}

function ListButton({ t, onClick, children }: { t: Tokens; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] font-sans font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
      style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}
    >
      {children}
    </button>
  );
}

// ── The pane ────────────────────────────────────────────────────────────────

type Place = { key: string; name: string; country?: Country; state?: USState };

export default function PolicyContext({
  t,
  h,
  hits,
  headlines,
  onOpen,
  onTopic,
  onOutlet,
}: {
  t: Tokens;
  h: Headline;
  /** The topics whose words are in the headline. */
  hits: TopicHit[];
  /** The policy headlines the explorer has read, newest first. */
  headlines: Headline[];
  /** Shows another headline in this pane. */
  onOpen: (h: Headline) => void;
  /** Narrows the list to a topic, or to an outlet. */
  onTopic: (label: string) => void;
  onOutlet: (outlet: string) => void;
}) {
  const countries = useLiveCountries();
  const states = useLiveStates();
  const places = useMemo(() => {
    const out: Place[] = [];
    for (const key of h.places) {
      const country = key.startsWith("c:") ? countries.find((c) => c.code === key.slice(2)) : undefined;
      const state = key.startsWith("s:") ? states.find((s) => s.id === key.slice(2)) : undefined;
      if (country) out.push({ key, name: country.name, country });
      else if (state) out.push({ key, name: state.name, state });
    }
    return out;
  }, [h.places, countries, states]);
  // The most particular place first: a state, then a country other than the United States.
  const first = places.find((p) => p.state) ?? places.find((p) => p.key !== "c:US") ?? places[0] ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const place = places.find((p) => p.key === picked) ?? first;
  const topics = hits.map((x) => x.label);

  // Where the headline came from.
  const desks = NEWS_SOURCES.filter((s) => s.outlet === h.outlet && s.topics.includes("policy"));
  const site = (desks[0] ?? NEWS_SOURCES.find((s) => s.outlet === h.outlet))?.site;
  const when = new Date(h.published_at);
  const home = desks.length === 1 ? desks[0].home : undefined;
  const homeName = home ? placeName(home) : null;
  const filedByDesk = !!homeName && h.places.length === 1 && h.places[0] === home && !h.title.toLowerCase().includes(homeName.toLowerCase());
  const story: Fact[] = [
    {
      label: "Outlet",
      value: site ? (
        <Out t={t} href={site} title={`Open ${h.outlet}`}>
          {h.outlet}
        </Out>
      ) : (
        h.outlet
      ),
    },
  ];
  if (desks.length)
    story.push({
      label: desks.length === 1 ? "Feed read" : "Feeds read",
      value: (
        <span className="flex flex-col items-end">
          {desks.map((d) => (
            <Out key={d.feed} t={t} href={d.feed} title="Open the feed the headline was read from">
              {feedName(d.feed)}
            </Out>
          ))}
        </span>
      ),
    });
  story.push(
    {
      label: "Published",
      value: (
        <span title={when.toISOString()}>
          {when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, {when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      label: "Filed under",
      value: places.length ? places.map((p) => p.name).join(", ") : h.places.length ? "A place the site holds no record for" : "No place: the headline names none",
    },
    {
      label: "Topics",
      value: hits.length ? hits.map((x) => `${x.label} (${x.words.map((w) => `“${w}”`).join(", ")})`).join(" · ") : "None of the six: their words are not in the headline",
    },
  );

  // The week's other headlines about the place; or, with no place, the outlet's others among those read.
  const week = usePlaceWeek(place?.key ?? null);
  const others = week ? week.rows.filter((r) => r.url !== h.url).slice(0, 5) : [];
  const early = week?.readSince ? daysBeforeReading(week.readSince) : [];
  const fromOutlet = headlines.filter((r) => r.outlet === h.outlet && r.url !== h.url);

  return (
    <>
      <Section
        t={t}
        title="The story"
        note={filedByDesk ? `${h.outlet}'s feed covers ${the(homeName!)}: a headline of its that names no place is filed under ${the(homeName!)}.` : undefined}
      >
        <Facts t={t} rows={story} />
      </Section>

      {place && (
        <section className="flex flex-col gap-2 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
          <Label t={t}>{places.length > 1 ? "The places it is about" : "The place it is about"}</Label>
          {places.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show the figures for">
              {places.map((p) => {
                const on = p.key === place.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPicked(p.key)}
                    aria-pressed={on}
                    className="text-[10px] font-sans font-semibold px-2 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ background: on ? ACCENT + "26" : t.tile, border: `1px solid ${on ? ACCENT + "66" : t.gridLine}`, color: on ? ACCENT : t.headText }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            {place.country && (
              <img
                src={`https://flagcdn.com/w40/${place.country.code.toLowerCase()}.png`}
                alt=""
                width={20}
                height={15}
                loading="lazy"
                className="rounded-sm shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <p className="text-sm font-bold font-sans leading-tight" style={{ color: t.headText }}>
              {place.name}
            </p>
            <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
              {place.country ? place.country.continent : `US state · ${place.state!.abbreviation}`}
            </span>
          </div>
          <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            Published figures for {the(place.name)}, each with its year and source. None is taken from the story.
          </p>
        </section>
      )}
      {place?.country && <CountryRecord t={t} c={place.country} topics={topics} />}
      {place?.state && <StateRecord t={t} s={place.state} topics={topics} />}

      {place && week && week.rows.length > 0 && (
        <Section
          t={t}
          title="In policy news this week"
          note={
            `${week.capped ? `The newest ${week.rows.length}` : week.rows.length} headline${week.rows.length === 1 ? "" : "s"} about ${the(place.name)} from the policy desks in the last seven days, from ${outletList(week.rows, 3)}.` +
            (week.readSince && early.length
              ? ` The desks have been read since ${week.readSince.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}: the outlined days hold only what their feeds still carried then.`
              : "")
          }
        >
          {week.readSince && <Days t={t} rows={week.rows} readSince={week.readSince} />}
          {others.length > 0 && <OtherHeadlines t={t} rows={others} onOpen={onOpen} />}
        </Section>
      )}
      {!place && fromOutlet.length > 0 && (
        <Section t={t} title={`More from ${h.outlet}`} note={`Among the newest ${headlines.length} policy headlines read.`}>
          <OtherHeadlines t={t} rows={fromOutlet.slice(0, 5)} onOpen={onOpen} />
        </Section>
      )}

      <div className="flex flex-wrap gap-1.5">
        {hits.map((x) => (
          <ListButton key={x.label} t={t} onClick={() => onTopic(x.label)}>
            All {x.label} headlines
          </ListButton>
        ))}
        <ListButton t={t} onClick={() => onOutlet(h.outlet)}>
          All from {h.outlet}
        </ListButton>
      </div>

      <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
        The story is the outlet's: CommonSphere keeps its headline, link, outlet and time, never its text, and adds nothing to it.
        {hits.length ? " Its topics come from the words in the headline." : ""}
        {place ? " The figures are the place's published record, from the sources named under them." : ""}
      </p>
    </>
  );
}
