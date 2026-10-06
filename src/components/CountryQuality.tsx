/**
 * Quality of life, in a city's window: water, energy, transport, crime and
 * safety, health, education, air, business and the economy - for the country
 * the city is in.
 *
 * The city windows once had these headings filled with figures typed in for
 * each city - a "transit score", rent, an "index" of safety, GDP - that no
 * body publishes for cities the world over, so they could not be kept. No
 * body does publish them city by city on one footing; they are published
 * country by country. So the headings are back with the country's figures
 * under them, each from the body that measures it and each with its year, and
 * the section says plainly that they are the country's and not the city's.
 *
 * A row is a name and its figure on one line, and under them what the figure
 * is counted in, its year, and the world's figure for the same measure and
 * year where the same publisher gives one. The unit used to share the line
 * with the name and the figure, and in a narrow tile the three ran into one
 * another.
 *
 * It is loaded when a window opens, not with the page: the figures it reads
 * are the Countries page's, and large.
 */
import { BookOpen, CurrencyDollar, Drop, FirstAid, Lightning, ShieldCheck, Storefront, Train, Wind } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { COUNTRY_OF, ECONOMY_OF } from "../data/placeIndex";
import { COUNTRY_PANELS, panelSource, type PanelFigure } from "../data/countryPanels";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { COUNTRY_CRIME, CRIME_SOURCE } from "../data/countryCrime";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { ECONOMY_INDICATORS, ECONOMY_INDICATORS_SOURCE } from "../data/economyIndicators";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { worldFor } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Row = { label: string; value: string; sub: string; world?: string | null };
type Source = { label: string; url: string };

const n = (v: number, dp = 0) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const twh = (v: number) => `${v >= 100 ? n(v) : n(v, 1)} TWh`;
const pct = (v: number) => `${v}%`;
/** A country's name as it reads in a sentence: "the United States", "the Netherlands", "France". */
const inSentence = (name: string) => (/^(United |Netherlands$|Philippines$|Bahamas$|Maldives$|Czech Republic$|Dominican Republic$|Central African Republic$)/.test(name) ? `the ${name}` : name);

/** A figure, what it is counted in and for when, and the world's beside it. The name may run to two lines; nothing shares a line with it but its figure. */
function QualityRow({ r }: { r: Row }) {
  return (
    <div className="py-1.5 border-b border-border last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-sans text-foreground min-w-0 leading-snug">{r.label}</span>
        <span className="text-[12px] font-mono font-semibold text-foreground text-right shrink-0">{r.value}</span>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground leading-snug mt-0.5">
        {r.sub}
        {r.world ? ` · world ${r.world}` : ""}
      </p>
    </div>
  );
}

export default function CountryQuality({ code, country, place }: { /** The country's ISO code. */ code: string; country: string; /** The city whose window this is. */ place: string }) {
  const id = COUNTRY_OF[code];
  const p = (id && COUNTRY_PANELS[id]) || {};
  const energy = id ? COUNTRY_ENERGY[id] : undefined;
  const crime = id ? COUNTRY_CRIME[id] : undefined;
  const sec = PUBLIC_SECURITY[code];
  const eco = ECONOMY_OF[code] ? ECONOMY_INDICATORS[ECONOMY_OF[code]] : undefined;
  const air = AIR_QUALITY[code];

  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.label, s);
  /** The world's figure for a measure in the same year, printed the same way, where worldview.ts holds that series and year. */
  const world = (worldId: string | undefined, year: string | number, print: (v: number) => string) => {
    const w = worldId ? worldFor(worldId, year) : null;
    return w == null ? null : print(w);
  };
  /** A row from one of the country panels' figures, citing where it is from. */
  const panel = (label: string, f: PanelFigure | undefined, print: (v: number) => string, unit: string, worldId?: string): Row[] => {
    if (!f) return [];
    const s = panelSource(f);
    cite({ label: s.label.replace(/, \d{4}.*$/, ""), url: s.url });
    return [{ label, value: print(f.v), sub: `${unit} · ${f.y}`, world: world(worldId, f.y, print) }];
  };

  const topFuel = energy?.mix.length ? energy.mix.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  if (energy) cite({ label: ENERGY_SOURCE.label, url: ENERGY_SOURCE.url });
  if (crime?.homicide) cite(CRIME_SOURCE);
  if (sec?.stability) cite({ label: PUBLIC_SECURITY_SOURCES.wgi.label, url: PUBLIC_SECURITY_SOURCES.wgi.url });
  if (sec?.conflict) cite({ label: PUBLIC_SECURITY_SOURCES.ucdp.label, url: PUBLIC_SECURITY_SOURCES.ucdp.url });
  if (eco) cite({ label: ECONOMY_INDICATORS_SOURCE.worldBank.label, url: ECONOMY_INDICATORS_SOURCE.worldBank.url });
  if (air) cite({ label: AIR_QUALITY_SOURCE.label, url: AIR_QUALITY_SOURCE.url });
  const conflictDeaths = sec?.conflict ? sec.conflict.stateBased + sec.conflict.nonState + sec.conflict.oneSided : null;
  const one = (v: number) => n(v, 1);
  const signedPct = (v: number) => `${v > 0 ? "+" : ""}${v}%`;

  const groups: { title: string; icon: ReactNode; rows: Row[] }[] = [
    {
      title: "Water",
      icon: <Drop size={13} weight="fill" />,
      rows: [...panel("Safely managed drinking water", p.safeWater, pct, "of people", "water"), ...panel("Safely managed sanitation", p.safeSanitation, pct, "of people", "sanitation")],
    },
    {
      title: "Energy",
      icon: <Lightning size={13} weight="fill" />,
      rows: [
        ...panel("People with electricity", p.electricityAccess, pct, "of people", "electricity"),
        ...(energy
          ? [
              { label: "Energy used", value: twh(energy.totalUseTWh), sub: `primary energy · ${energy.y}` },
              { label: "Energy produced", value: twh(energy.totalProductionTWh), sub: `primary energy · ${energy.y}` },
              ...(topFuel ? [{ label: "Largest source of what it produces", value: topFuel.source, sub: `${topFuel.pct}% of production · ${energy.y}` }] : []),
            ]
          : []),
      ],
    },
    {
      title: "Transportation",
      icon: <Train size={13} weight="fill" />,
      rows: [
        ...panel("Railway lines", p.railKm, (v) => `${n(v)} km`, "route length"),
        ...panel("Logistics Performance Index", p.logisticsIndex, (v) => `${v}`, "World Bank index, 1 to 5"),
        ...panel("Electric cars' share of new car sales", p.evSalesShare, pct, "of new cars sold", "evSalesShare"),
      ],
    },
    {
      title: "Crime & safety",
      icon: <ShieldCheck size={13} weight="fill" />,
      rows: [
        ...(crime?.homicide
          ? [{ label: "Intentional homicides", value: one(crime.homicide.v), sub: `per 100,000 people · ${crime.homicide.y}`, world: world("homicide", crime.homicide.y, one) }]
          : []),
        ...(sec?.stability ? [{ label: "Political stability and absence of violence", value: `${sec.stability.v}`, sub: `World Bank score, 0 to 100 · ${sec.stability.y}` }] : []),
        ...(sec?.ruleOfLaw ? [{ label: "Rule of law", value: `${sec.ruleOfLaw.v}`, sub: `World Bank score, 0 to 100 · ${sec.ruleOfLaw.y}` }] : []),
        ...(sec?.conflict ? [{ label: "Deaths in armed conflict in the country", value: conflictDeaths === 0 ? "None recorded" : n(conflictDeaths!), sub: `Uppsala Conflict Data Program · ${sec.conflict.y}` }] : []),
      ],
    },
    {
      title: "Health",
      icon: <FirstAid size={13} weight="fill" />,
      rows: [
        ...panel("Life expectancy", p.lifeExpectancy, (v) => `${one(v)} yrs`, "at birth", "lifeExpectancy"),
        ...panel("Physicians", p.physicians, (v) => `${v}`, "per 1,000 people"),
        ...panel("Hospital beds", p.hospitalBeds, (v) => `${v}`, "per 1,000 people"),
        ...panel("Maternal deaths", p.maternalMortality, (v) => n(v), "per 100,000 live births", "maternalMortality"),
      ],
    },
    {
      title: "Education",
      icon: <BookOpen size={13} weight="fill" />,
      rows: [
        ...panel("Adults who can read", p.literacy, pct, "of people 15 and over", "literacy"),
        ...panel("Years of schooling", p.schoolingYears, (v) => `${one(v)} yrs`, "average, adults 25 and over", "schoolingYears"),
        ...panel("Finished upper secondary school", p.upperSecondaryPct, pct, "of people 25 and over"),
        ...panel("Hold a bachelor's degree or higher", p.bachelorsPct, pct, "of people 25 and over"),
      ],
    },
    {
      title: "Air",
      icon: <Wind size={13} weight="fill" />,
      rows: air ? [{ label: "Fine-particle pollution people breathe", value: `${one(air.pm25)} µg/m³`, sub: `PM2.5, mean annual exposure · ${air.year}`, world: world("pm25", air.year, (v) => `${one(v)} µg/m³`) }] : [],
    },
    {
      title: "Business",
      icon: <Storefront size={13} weight="fill" />,
      rows: [
        ...panel("Corruption Perceptions Index", p.cpiScore, (v) => `${v}`, "0 to 100, higher is cleaner"),
        ...panel("People using the internet", p.internetPct, pct, "of people", "internet"),
        ...panel("Fixed broadband subscriptions", p.broadbandPer100, (v) => `${v}`, "per 100 people", "broadband"),
        ...panel("Mobile subscriptions", p.mobilePer100, (v) => `${v}`, "per 100 people", "mobile"),
        ...panel("Statutory minimum wage", p.minimumWageMonthlyUSD, (v) => `$${n(v)}`, "US dollars a month"),
      ],
    },
    {
      title: "Economy",
      icon: <CurrencyDollar size={13} weight="fill" />,
      rows: [
        ...(eco?.gdpPerCapita ? [{ label: "GDP per person", value: `$${n(eco.gdpPerCapita.v)}`, sub: `current US dollars · ${eco.gdpPerCapita.y}` }] : []),
        ...(eco?.gdpGrowthRate ? [{ label: "Real GDP growth", value: signedPct(eco.gdpGrowthRate.v), sub: `a year · ${eco.gdpGrowthRate.y}`, world: world("gdpGrowth", eco.gdpGrowthRate.y, signedPct) }] : []),
        ...(eco?.unemploymentRate ? [{ label: "Unemployment", value: pct(eco.unemploymentRate.v), sub: `of the labour force · ${eco.unemploymentRate.y}`, world: world("unemployment", eco.unemploymentRate.y, pct) }] : []),
        ...(eco?.inflationRate ? [{ label: "Inflation", value: pct(eco.inflationRate.v), sub: `consumer prices, a year · ${eco.inflationRate.y}`, world: world("inflation", eco.inflationRate.y, pct) }] : []),
        ...panel("Median income or spending a person", p.medianDailyIncome, (v) => `$${n(v, 2)}`, "a day, 2021 PPP dollars"),
        ...panel("Below the national poverty line", p.povertyNationalPct, pct, "of people"),
        ...panel("Households that own their home", p.homeOwnershipPct, pct, "of households"),
      ],
    },
  ].filter((g) => g.rows.length > 0);
  if (!groups.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🧭 Quality of life · {country}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
        These figures are for {inSentence(country)}, not for {place}. No body publishes water, energy, transport, safety, health, schooling, business and the economy city by city on
        one footing, so they are given for the country {place} is in, each from the body that measures it and for its latest year, with the world's figure for the
        same year where there is one.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups.map((g) => (
          <div key={g.title} className="modal-tile rounded-lg p-4 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">{g.icon}</div>
              <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">{g.title}</h3>
            </div>
            <div className="flex flex-col">
              {g.rows.map((r) => (
                <QualityRow key={r.label} r={r} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SourceLink sources={[...sources.values()]} className="mt-2" />
    </div>
  );
}
