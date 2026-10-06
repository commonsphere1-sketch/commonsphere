/**
 * Quality of life, in a city's window: water, energy, transport, crime and
 * safety, business and the economy - for the country the city is in.
 *
 * The city windows once had these headings filled with figures typed in for
 * each city - a "transit score", rent, an "index" of safety, GDP - that no
 * body publishes for cities the world over, so they could not be kept. No
 * body does publish them city by city on one footing; they are published
 * country by country. So the headings are back with the country's figures
 * under them, each from the body that measures it and each with its year, and
 * the section says plainly that they are the country's and not the city's.
 *
 * It is loaded when a window opens, not with the page: the figures it reads
 * are the Countries page's, and large.
 */
import { CurrencyDollar, Drop, Lightning, ShieldCheck, Storefront, Train } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { COUNTRY_OF, ECONOMY_OF } from "../data/placeIndex";
import { COUNTRY_PANELS, panelSource, type PanelFigure } from "../data/countryPanels";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { COUNTRY_CRIME, CRIME_SOURCE } from "../data/countryCrime";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { ECONOMY_INDICATORS, ECONOMY_INDICATORS_SOURCE } from "../data/economyIndicators";
import { FigureRow } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Row = { label: string; value: string; sub: string };
type Source = { label: string; url: string };

const n = (v: number, dp = 0) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const twh = (v: number) => `${v >= 100 ? n(v) : n(v, 1)} TWh`;

export default function CountryQuality({ code, country, place }: { /** The country's ISO code. */ code: string; country: string; /** The city whose window this is. */ place: string }) {
  const id = COUNTRY_OF[code];
  const p = (id && COUNTRY_PANELS[id]) || {};
  const energy = id ? COUNTRY_ENERGY[id] : undefined;
  const crime = id ? COUNTRY_CRIME[id] : undefined;
  const sec = PUBLIC_SECURITY[code];
  const eco = ECONOMY_OF[code] ? ECONOMY_INDICATORS[ECONOMY_OF[code]] : undefined;

  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.label, s);
  /** A row from one of the country panels' figures, citing where it is from. */
  const panel = (label: string, f: PanelFigure | undefined, print: (v: number) => string, unit: string): Row[] => {
    if (!f) return [];
    const s = panelSource(f);
    cite({ label: s.label.replace(/, \d{4}.*$/, ""), url: s.url });
    return [{ label, value: print(f.v), sub: `${unit} · ${f.y}` }];
  };
  const pct = (v: number) => `${v}%`;

  const topFuel = energy?.mix.length ? energy.mix.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  if (energy) cite({ label: ENERGY_SOURCE.label, url: ENERGY_SOURCE.url });
  if (crime?.homicide) cite(CRIME_SOURCE);
  if (sec?.stability) cite({ label: PUBLIC_SECURITY_SOURCES.wgi.label, url: PUBLIC_SECURITY_SOURCES.wgi.url });
  if (sec?.conflict) cite({ label: PUBLIC_SECURITY_SOURCES.ucdp.label, url: PUBLIC_SECURITY_SOURCES.ucdp.url });
  if (eco) cite({ label: ECONOMY_INDICATORS_SOURCE.worldBank.label, url: ECONOMY_INDICATORS_SOURCE.worldBank.url });
  const conflictDeaths = sec?.conflict ? sec.conflict.stateBased + sec.conflict.nonState + sec.conflict.oneSided : null;

  const groups: { title: string; icon: ReactNode; rows: Row[] }[] = [
    {
      title: "Water",
      icon: <Drop size={13} weight="fill" />,
      rows: [...panel("Safely managed drinking water", p.safeWater, pct, "of people"), ...panel("Safely managed sanitation", p.safeSanitation, pct, "of people")],
    },
    {
      title: "Energy",
      icon: <Lightning size={13} weight="fill" />,
      rows: [
        ...panel("People with electricity", p.electricityAccess, pct, "of people"),
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
        ...panel("Electric cars' share of new car sales", p.evSalesShare, pct, "of new cars sold"),
      ],
    },
    {
      title: "Crime & safety",
      icon: <ShieldCheck size={13} weight="fill" />,
      rows: [
        ...(crime?.homicide ? [{ label: "Intentional homicides", value: n(crime.homicide.v, crime.homicide.v < 10 ? 1 : 0), sub: `per 100,000 people · ${crime.homicide.y}` }] : []),
        ...(sec?.stability ? [{ label: "Political stability and absence of violence", value: `${sec.stability.v}`, sub: `World Bank score, 0 to 100 · ${sec.stability.y}` }] : []),
        ...(sec?.conflict ? [{ label: "Deaths in armed conflict in the country", value: conflictDeaths === 0 ? "None recorded" : n(conflictDeaths!), sub: `${sec.conflict.y}` }] : []),
      ],
    },
    {
      title: "Business",
      icon: <Storefront size={13} weight="fill" />,
      rows: [
        ...panel("Corruption Perceptions Index", p.cpiScore, (v) => `${v}`, "0 to 100, higher is cleaner"),
        ...panel("People using the internet", p.internetPct, pct, "of people"),
        ...panel("Fixed broadband subscriptions", p.broadbandPer100, (v) => `${v}`, "per 100 people"),
        ...panel("Statutory minimum wage", p.minimumWageMonthlyUSD, (v) => `$${n(v)}`, "US dollars a month"),
      ],
    },
    {
      title: "Economy",
      icon: <CurrencyDollar size={13} weight="fill" />,
      rows: [
        ...(eco?.gdpPerCapita ? [{ label: "GDP per person", value: `$${n(eco.gdpPerCapita.v)}`, sub: `current US dollars · ${eco.gdpPerCapita.y}` }] : []),
        ...(eco?.gdpGrowthRate ? [{ label: "Real GDP growth", value: `${eco.gdpGrowthRate.v > 0 ? "+" : ""}${eco.gdpGrowthRate.v}%`, sub: `a year · ${eco.gdpGrowthRate.y}` }] : []),
        ...(eco?.unemploymentRate ? [{ label: "Unemployment", value: `${eco.unemploymentRate.v}%`, sub: `of the labour force · ${eco.unemploymentRate.y}` }] : []),
        ...(eco?.inflationRate ? [{ label: "Inflation", value: `${eco.inflationRate.v}%`, sub: `consumer prices, a year · ${eco.inflationRate.y}` }] : []),
        ...panel("Median income or spending a person", p.medianDailyIncome, (v) => `$${n(v, 2)}`, "a day, 2021 PPP dollars"),
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
        These are {country}'s figures, not {place}'s. No body publishes water, energy, transport, safety, business and the economy city by city on one footing,
        so they are given for the country {place} is in, each from the body that measures it and for its latest year.
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
                <FigureRow key={r.label} label={r.label} value={r.value} sub={r.sub} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SourceLink sources={[...sources.values()]} className="mt-2" />
    </div>
  );
}
