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
 * A row is a name and its figure on one line; under them what the figure is
 * counted in, its year, and the world's figure for the same measure and year
 * where the same publisher gives one. A figure with a scale of its own is
 * drawn on it - 0 to 100 for a share or a score, 1 to 5 for the logistics
 * index, or, where the world's figure is the only yardstick, the larger of
 * the two - with a tick where the world stands. A figure with neither a
 * scale nor a yardstick (kilometres of railway, dollars a person) is given
 * as a figure and not drawn against a ceiling made up for it. What a country
 * produces its energy from is a whole, so it is a ring.
 *
 * Commute is a subject of its own: the journey to work where an official
 * series has it (commute.ts). First the city's own, named as the city's -
 * the Census Bureau's for a city of the United States, Eurostat's city
 * statistics for a city of Europe - and beside it the country's: Eurostat's
 * mean one-way minutes for a European country and for the people living in
 * its cities, or the Census Bureau's for the United States. How people get
 * to work is a whole, so it is a ring. A place neither series covers has a
 * card that says "Not held" and is given no figure.
 *
 * The Dashboard gives a few of the same rows under each of its cities
 * (qualityHeadlines, drawn by CityQualityBars), so the two cannot disagree.
 *
 * It is loaded when a window opens, not with the page: the figures it reads
 * are the Countries page's, and large.
 */
import { BookOpen, Bus, CurrencyDollar, Drop, FirstAid, Lightning, ShieldCheck, Storefront, Train, Wind } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { COUNTRY_OF, ECONOMY_OF } from "../data/placeIndex";
import { COUNTRY_PANELS, panelSource, type PanelFigure } from "../data/countryPanels";
import { COUNTRY_INDICATOR_FALLBACKS, COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { COUNTRY_ENERGY, ENERGY_SOURCE } from "../data/countryEnergy";
import { COUNTRY_CRIME, CRIME_SOURCE } from "../data/countryCrime";
import { PUBLIC_SECURITY, PUBLIC_SECURITY_SOURCES } from "../data/publicSecurity";
import { ECONOMY_INDICATORS, ECONOMY_INDICATORS_SOURCE } from "../data/economyIndicators";
import { AIR_QUALITY, AIR_QUALITY_SOURCE } from "../data/airQuality";
import { COMMUTE_EU, COMMUTE_EUROPE, COMMUTE_SOURCES, COMMUTE_UN_CITIES, COMMUTE_US, COMMUTE_US_CITIES, type CityCommute, type UsCommute } from "../data/commute";
import { ChartTitle, PartsDonut, worldFor } from "./ModalCharts";
import { semanticColor } from "../lib/semanticColors";
import { SourceLink } from "./SourceLink";

/** Where a bar ends and where the world's tick sits, each as a percentage of the measure's scale. */
type Bar = { at: number; world?: number; scale: string };
type Source = { label: string; url: string };
/** A figure as a row, with where it is from, and whether it is the city's own and not its country's. */
export type Row = { label: string; value: string; sub: string; world?: string | null; bar?: Bar; from?: Source; own?: boolean };
/**
 * How a figure is drawn: "share" on 0 to 100; "world" on the larger of it and
 * the world's figure for the same year (and not at all without one); a pair
 * on the scale between them.
 */
type Scale = "share" | "world" | { from: number; to: number };

const n = (v: number, dp = 0) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const twh = (v: number) => `${v >= 100 ? n(v) : n(v, 1)} TWh`;
const pct = (v: number) => `${v}%`;
const clamp = (v: number) => Math.min(100, Math.max(0, v));
/** A country's name as it reads in a sentence: "the United States", "the Netherlands", "France". */
export const inSentence = (name: string) => (/^(United |Netherlands$|Philippines$|Bahamas$|Maldives$|Czech Republic$|Dominican Republic$|Central African Republic$)/.test(name) ? `the ${name}` : name);

/** The bar for a figure on its scale, with the world's tick where there is one; none where the scale has nothing to say. */
function barOf(v: number, w: number | null, scale: Scale | undefined): Bar | undefined {
  if (!scale || !Number.isFinite(v) || v < 0) return undefined;
  if (scale === "share") return { at: clamp(v), world: w != null ? clamp(w) : undefined, scale: "0 to 100" };
  if (scale === "world") {
    if (w == null || w < 0) return undefined;
    const top = Math.max(v, w);
    return top > 0 ? { at: (100 * v) / top, world: (100 * w) / top, scale: "the larger of the two" } : undefined;
  }
  const span = scale.to - scale.from;
  return span > 0 ? { at: clamp((100 * (v - scale.from)) / span), world: w != null ? clamp((100 * (w - scale.from)) / span) : undefined, scale: `${scale.from} to ${scale.to}` } : undefined;
}

/**
 * A figure as a tile: its name, the figure large, its bar where it has a scale - the tick on it the world's - and under
 * it what it is counted in, for when, and the world's figure. Where the world's is on the bar, the tile says which side
 * of it the figure falls: above or below, and nothing about which is the better.
 */
function QualityTile({ r, color }: { r: Row; /** The subject's colour: its bars are in it unless a figure names a thing with a colour of its own. */ color: string }) {
  const ink = semanticColor(r.label) ?? color;
  const side = r.bar && r.bar.world != null && r.world ? (Math.abs(r.bar.at - r.bar.world) < 0.5 ? "level with the world" : r.bar.at > r.bar.world ? "above the world" : "below the world") : null;
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 min-w-0 flex flex-col">
      <p className="text-[11px] font-sans text-muted-foreground leading-snug">{r.label}</p>
      <p className="text-lg font-bold font-mono text-foreground leading-tight mt-0.5">{r.value}</p>
      {r.bar && (
        <span
          className="relative block h-1.5 rounded-full bg-muted mt-1.5"
          role="img"
          aria-label={`${r.label}: ${r.value}${r.world ? `, against ${r.world} for the world` : ""}, on a scale of ${r.bar.scale}.`}
          title={`On a scale of ${r.bar.scale}${r.world ? ` · the tick is the world, ${r.world}` : ""}`}
        >
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${r.bar.at}%`, minWidth: r.bar.at > 0 ? 2 : 0, background: ink }} />
          {r.bar.world != null && <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full bg-foreground" style={{ left: `${r.bar.world}%` }} />}
        </span>
      )}
      <p className="text-[10px] font-mono text-muted-foreground leading-snug mt-1.5">
        {r.sub}
        {r.world ? ` · world ${r.world}` : ""}
      </p>
      {side && (
        <p className="text-[10px] font-sans font-semibold leading-snug mt-0.5" style={{ color: ink }}>
          {side}
        </p>
      )}
    </div>
  );
}

/**
 * The panels for a country - and, where a figure is held for the city itself, for the city - with where each is from.
 * The city's window lays all of them out; the Dashboard gives a few under each of its cities (qualityHeadlines).
 */
export function qualityOf(code: string, country: string, city?: string, commute = true) {
  const id = COUNTRY_OF[code];
  const p = (id && COUNTRY_PANELS[id]) || {};
  const energy = id ? COUNTRY_ENERGY[id] : undefined;
  const crime = id ? COUNTRY_CRIME[id] : undefined;
  const sec = PUBLIC_SECURITY[code];
  const eco = ECONOMY_OF[code] ? ECONOMY_INDICATORS[ECONOMY_OF[code]] : undefined;
  const air = AIR_QUALITY[code];

  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.label, s);
  /** A row: the figure, the world's for the same measure and year where worldview.ts holds it, and the bar its scale allows. */
  const row = (label: string, v: number, year: string | number, print: (v: number) => string, unit: string, worldId?: string, scale?: Scale): Row => {
    const w = worldId ? worldFor(worldId, year) : null;
    return { label, value: print(v), sub: `${unit} · ${year}`, world: w == null ? null : print(w), bar: barOf(v, w, scale) };
  };
  /** A row from one of the country panels' figures, citing where it is from. */
  const panel = (label: string, f: PanelFigure | undefined, print: (v: number) => string, unit: string, worldId?: string, scale?: Scale): Row[] => {
    if (!f) return [];
    const s = panelSource(f);
    const from = { label: s.label.replace(/, \d{4}.*$/, ""), url: s.url };
    cite(from);
    return [{ ...row(label, f.v, f.y, print, unit, worldId, scale), from }];
  };

  if (energy) cite({ label: ENERGY_SOURCE.label, url: ENERGY_SOURCE.url });
  if (crime?.homicide) cite(CRIME_SOURCE);
  if (sec?.stability) cite({ label: PUBLIC_SECURITY_SOURCES.wgi.label, url: PUBLIC_SECURITY_SOURCES.wgi.url });
  if (sec?.conflict) cite({ label: PUBLIC_SECURITY_SOURCES.ucdp.label, url: PUBLIC_SECURITY_SOURCES.ucdp.url });
  if (eco) cite({ label: ECONOMY_INDICATORS_SOURCE.worldBank.label, url: ECONOMY_INDICATORS_SOURCE.worldBank.url });
  if (air) cite({ label: AIR_QUALITY_SOURCE.label, url: AIR_QUALITY_SOURCE.url });
  // Life expectancy is not among the country panels' figures: it is held with the country's headline indicators, the World Bank's unless the figure names another.
  const life = COUNTRY_INDICATORS[code]?.lifeExpectancy;
  const lifeFrom = life ? (life.s ? COUNTRY_INDICATOR_FALLBACKS[life.s] : { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url }) : undefined;
  if (lifeFrom && !p.lifeExpectancy) cite(lifeFrom);
  // Where the rows that do not come from the country panels are from, for a row to carry.
  const worldBank = { label: ECONOMY_INDICATORS_SOURCE.worldBank.label, url: ECONOMY_INDICATORS_SOURCE.worldBank.url };
  const eurostat = { label: COMMUTE_SOURCES.eurostat.label, url: COMMUTE_SOURCES.eurostat.url };
  const acs = { label: COMMUTE_SOURCES.acs.label, url: COMMUTE_SOURCES.acs.url };
  const conflictDeaths = sec?.conflict ? sec.conflict.stateBased + sec.conflict.nonState + sec.conflict.oneSided : null;
  const one = (v: number) => n(v, 1);
  const signedPct = (v: number) => `${v > 0 ? "+" : ""}${v}%`;
  const score = { from: 0, to: 100 };

  // The journey to work, from whichever official series covers the country; the two are different measures and each is named.
  const min = (v: number) => `${v} min`;
  // A window that gives the journey to work in a panel of its own asks for it to be left out of this one.
  const eur = commute ? COMMUTE_EUROPE[code] : undefined;
  const usa = commute && code === "US" ? COMMUTE_US : undefined;
  // The city's own: the Census place a profile was given by hand, or the figures held by the UN's id for the city - the Census Bureau's or Eurostat's.
  const held: CityCommute | undefined = commute && city ? (COMMUTE_US_CITIES[city] ? { from: "acs", ...COMMUTE_US_CITIES[city] } : COMMUTE_UN_CITIES[city]) : undefined;
  const ownCity = held?.from === "acs" ? held : undefined;
  const ownEurope = held?.from === "eurostat" ? held : undefined;
  const cityStats = { label: COMMUTE_SOURCES.cities.label, url: COMMUTE_SOURCES.cities.url };
  if (eur) cite({ label: COMMUTE_SOURCES.eurostat.label, url: COMMUTE_SOURCES.eurostat.url });
  if (usa || ownCity) cite({ label: COMMUTE_SOURCES.acs.label, url: COMMUTE_SOURCES.acs.url });
  if (ownEurope) cite(cityStats);
  const eurRow = (label: string, v: number | undefined, eu: number | undefined, who: string): Row[] =>
    v == null ? [] : [{ label, value: min(v), sub: `${who} · ${COMMUTE_SOURCES.eurostat.year}${eu != null ? ` · European Union ${min(eu)}` : ""}`, from: eurostat }];
  const usRows = (c: UsCommute, own: boolean): Row[] => {
    const of = own ? `${c.place}: ` : "";
    const who = `${own ? "the city itself, not the country · " : ""}workers who travel to work · ${COMMUTE_SOURCES.acs.year}`;
    return [
      { label: `${of}${own ? "average" : "Average"} journey to work, one way`, value: min(c.minutes), sub: who, from: acs, own },
      { label: `${of}${own ? "journeys" : "Journeys"} to work of an hour or more`, value: pct(c.hourPlusPct), sub: who, bar: barOf(c.hourPlusPct, null, "share"), from: acs, own },
    ];
  };
  const commuteRows: Row[] = [
    // The city's own first, where an official series has it.
    ...(ownCity ? usRows(ownCity, true) : []),
    ...(ownEurope?.minutes
      ? [
          {
            label: `${ownEurope.place}: average journey to work`,
            value: min(ownEurope.minutes.v),
            sub: `the city itself, as Eurostat draws it · ${ownEurope.minutes.y}${ownEurope.minutes.est ? " · Eurostat's estimate" : ""}`,
            from: cityStats,
            own: true,
          },
        ]
      : []),
    ...(ownEurope?.modes
      ? ownEurope.modes.parts
          .filter(([way]) => way === "Public transport" || way === "Car")
          .map(([way, share]) => ({
            label: `${ownEurope.place}: journeys to work by ${way.toLowerCase()}`,
            value: pct(share),
            sub: `of journeys to work · ${ownEurope.modes!.y}${ownEurope.modes!.est ? " · Eurostat's estimate" : ""}`,
            bar: barOf(share, null, "share"),
            from: cityStats,
            own: true,
          }))
      : []),
    ...(eur
      ? [
          ...eurRow("Average journey to work, one way", eur.all, COMMUTE_EU.all, "employed people who travel to work"),
          ...eurRow("Average journey to work, people living in cities", eur.cities, COMMUTE_EU.cities, "one way, cities as Eurostat classes them"),
          ...eurRow("Average journey to work, people living in towns and suburbs", eur.towns, COMMUTE_EU.towns, "one way"),
          ...eurRow("Average journey to work, people living in rural areas", eur.rural, COMMUTE_EU.rural, "one way"),
        ]
      : []),
    ...(usa ? usRows(usa, false) : []),
  ];
  /** How journeys to work in a city of Europe are made: a ring, with what the shares leave of the whole said to be worked out here. */
  const waysEurope = ownEurope?.modes ? (
    <div className="mt-3" key="europe">
      <ChartTitle>
        How journeys to work in {ownEurope.place} are made · % of journeys · {ownEurope.modes.y}
      </ChartTitle>
      <PartsDonut
        label={`How journeys to work in ${ownEurope.place} are made, ${ownEurope.modes.y}`}
        parts={[
          ...ownEurope.modes.parts.map(([way, share]) => ({ label: way, value: share, text: `${share}%` })),
          ...(ownEurope.modes.rest ? [{ label: "Other ways, or not given · worked out here", value: ownEurope.modes.rest, text: `${ownEurope.modes.rest}%` }] : []),
        ]}
      />
    </div>
  ) : null;
  /** How people get to work is a whole: a ring, each way named with its share. */
  const ways = (c: UsCommute, own: boolean) => (
    <div className="mt-3" key={c.place}>
      <ChartTitle>
        How people {own ? `in ${c.place} ` : ""}get to work · % of workers · {COMMUTE_SOURCES.acs.year}
      </ChartTitle>
      <PartsDonut label={`How workers in ${own ? c.place : inSentence(country)} get to work, ${COMMUTE_SOURCES.acs.year}`} parts={c.modes.map(([way, share]) => ({ label: way, value: share, text: `${share}%` }))} />
    </div>
  );

  // Each panel has a colour that goes with its subject - water blue, energy yellow, safety red - for its mark and its bars.
  const groups: { title: string; icon: ReactNode; color: string; rows: Row[]; extra?: ReactNode; /** What its card says where it has no figure. */ none?: string }[] = [
    {
      title: "Water",
      color: "#0ea5e9",
      icon: <Drop size={13} weight="fill" />,
      rows: [...panel("Safely managed drinking water", p.safeWater, pct, "of people", "water", "share"), ...panel("Safely managed sanitation", p.safeSanitation, pct, "of people", "sanitation", "share")],
    },
    {
      title: "Energy",
      color: "#eab308",
      icon: <Lightning size={13} weight="fill" />,
      rows: [
        ...panel("People with electricity", p.electricityAccess, pct, "of people", "electricity", "share"),
        ...(energy
          ? [
              { label: "Energy used", value: twh(energy.totalUseTWh), sub: `primary energy · ${energy.y}` },
              { label: "Energy produced", value: twh(energy.totalProductionTWh), sub: `primary energy · ${energy.y}` },
            ]
          : []),
      ],
      // What it produces its energy from is a whole: a ring, each source named with its share.
      extra:
        energy && energy.mix.length > 0 ? (
          <div className="mt-3">
            <ChartTitle>What it produces its energy from · % of production · {energy.y}</ChartTitle>
            <PartsDonut label={`What ${country} produces its energy from, ${energy.y}`} parts={energy.mix.map((m) => ({ label: m.source, value: m.pct, text: `${m.pct}%` }))} />
          </div>
        ) : undefined,
    },
    {
      title: "Transportation",
      color: "#64748b",
      icon: <Train size={13} weight="fill" />,
      rows: [
        ...panel("Railway lines", p.railKm, (v) => `${n(v)} km`, "route length"),
        ...panel("Logistics Performance Index", p.logisticsIndex, (v) => `${v}`, "World Bank index, 1 to 5", undefined, { from: 1, to: 5 }),
        ...panel("Electric cars' share of new car sales", p.evSalesShare, pct, "of new cars sold", "evSalesShare", "share"),
      ],
    },
    // The journey to work, a subject of its own: the city's figures where an official series has them, its country's beside them.
    {
      title: "Commute",
      color: "#0891b2",
      icon: <Bus size={13} weight="fill" />,
      // Where no figure is held, its card says so and its panel says why.
      none: commute && commuteRows.length === 0 ? "Not held" : undefined,
      rows: commuteRows,
      extra: !commute ? undefined : usa || ownCity?.modes.length || waysEurope ? (
          <>
            {ownCity && ownCity.modes.length > 0 && ways(ownCity, true)}
            {waysEurope}
            {usa && ways(usa, false)}
            {ownCity && <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">The city's figures are the Census Bureau's for {ownCity.place}: the city within its own boundary, not the wider built-up area around it.</p>}
            {ownEurope && <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">The city's figures are Eurostat's, for the city it lists as {ownEurope.place}; they are gathered from national censuses and surveys, so their years differ from city to city, and from the country's own survey.</p>}
          </>
        ) : commuteRows.length === 0 ? (
          // No figure is better than one from a ranking that cannot be reused or checked.
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
            The journey to work: no figure is held for {inSentence(country)}, or for a city in it. No body publishes it for every country on one footing; the site has Eurostat's for{" "}
            {Object.keys(COMMUTE_EUROPE).length} European countries and the Census Bureau's for the United States, with {Object.keys(COMMUTE_UN_CITIES).length} of their cities - and puts no ranking from a traffic app or an
            opinion survey in their place.
          </p>
        ) : undefined,
    },
    {
      title: "Crime & safety",
      color: "#dc2626",
      icon: <ShieldCheck size={13} weight="fill" />,
      rows: [
        ...(crime?.homicide ? [{ ...row("Intentional homicides", crime.homicide.v, crime.homicide.y, one, "per 100,000 people", "homicide", "world"), from: CRIME_SOURCE }] : []),
        ...(sec?.stability ? [row("Political stability and absence of violence", sec.stability.v, sec.stability.y, (v) => `${v}`, "World Bank score, 0 to 100", undefined, score)] : []),
        ...(sec?.ruleOfLaw ? [row("Rule of law", sec.ruleOfLaw.v, sec.ruleOfLaw.y, (v) => `${v}`, "World Bank score, 0 to 100", undefined, score)] : []),
        ...(sec?.conflict ? [{ label: "Deaths in armed conflict in the country", value: conflictDeaths === 0 ? "None recorded" : n(conflictDeaths!), sub: `Uppsala Conflict Data Program · ${sec.conflict.y}` }] : []),
      ],
    },
    {
      title: "Health",
      color: "#ec4899",
      icon: <FirstAid size={13} weight="fill" />,
      rows: [
        ...(p.lifeExpectancy
          ? panel("Life expectancy", p.lifeExpectancy, (v) => `${one(v)} yrs`, "at birth", "lifeExpectancy", "world")
          : life
            ? [{ ...row("Life expectancy", life.v, life.y, (v) => `${one(v)} yrs`, "at birth", "lifeExpectancy", "world"), from: lifeFrom }]
            : []),

        ...panel("Physicians", p.physicians, (v) => `${v}`, "per 1,000 people"),
        ...panel("Hospital beds", p.hospitalBeds, (v) => `${v}`, "per 1,000 people"),
        ...panel("Maternal deaths", p.maternalMortality, (v) => n(v), "per 100,000 live births", "maternalMortality", "world"),
      ],
    },
    {
      title: "Education",
      color: "#8b5cf6",
      icon: <BookOpen size={13} weight="fill" />,
      rows: [
        ...panel("Adults who can read", p.literacy, pct, "of people 15 and over", "literacy", "share"),
        ...panel("Years of schooling", p.schoolingYears, (v) => `${one(v)} yrs`, "average, adults 25 and over", "schoolingYears", "world"),
        ...panel("Finished upper secondary school", p.upperSecondaryPct, pct, "of people 25 and over", undefined, "share"),
        ...panel("Hold a bachelor's degree or higher", p.bachelorsPct, pct, "of people 25 and over", undefined, "share"),
      ],
    },
    {
      title: "Air",
      color: "#14b8a6",
      icon: <Wind size={13} weight="fill" />,
      rows: air
        ? [{ ...row("Fine-particle pollution people breathe", air.pm25, air.year, (v) => `${one(v)} µg/m³`, "PM2.5, mean annual exposure", "pm25", "world"), from: { label: AIR_QUALITY_SOURCE.label, url: AIR_QUALITY_SOURCE.url } }]
        : [],
    },
    {
      title: "Business",
      color: "#f59e0b",
      icon: <Storefront size={13} weight="fill" />,
      rows: [
        ...panel("Corruption Perceptions Index", p.cpiScore, (v) => `${v}`, "0 to 100, higher is cleaner", undefined, score),
        ...panel("People using the internet", p.internetPct, pct, "of people", "internet", "share"),
        ...panel("Fixed broadband subscriptions", p.broadbandPer100, (v) => `${v}`, "per 100 people", "broadband", "world"),
        ...panel("Mobile subscriptions", p.mobilePer100, (v) => `${v}`, "per 100 people", "mobile", "world"),
        ...panel("Statutory minimum wage", p.minimumWageMonthlyUSD, (v) => `$${n(v)}`, "US dollars a month"),
      ],
    },
    {
      title: "Economy",
      color: "#10b981",
      icon: <CurrencyDollar size={13} weight="fill" />,
      rows: [
        ...(eco?.gdpPerCapita ? [{ label: "GDP per person", value: `$${n(eco.gdpPerCapita.v)}`, sub: `current US dollars · ${eco.gdpPerCapita.y}`, from: worldBank }] : []),
        // Growth can be negative, so it is a figure and not a length.
        ...(eco?.gdpGrowthRate ? [row("Real GDP growth", eco.gdpGrowthRate.v, eco.gdpGrowthRate.y, signedPct, "a year", "gdpGrowth")] : []),
        ...(eco?.unemploymentRate ? [{ ...row("Unemployment", eco.unemploymentRate.v, eco.unemploymentRate.y, pct, "of the labour force", "unemployment", "world"), from: worldBank }] : []),
        ...(eco?.inflationRate ? [row("Inflation", eco.inflationRate.v, eco.inflationRate.y, pct, "consumer prices, a year", "inflation", "world")] : []),
        ...panel("Median income or spending a person", p.medianDailyIncome, (v) => `$${n(v, 2)}`, "a day, 2021 PPP dollars"),
        ...panel("Below the national poverty line", p.povertyNationalPct, pct, "of people", undefined, "share"),
        ...panel("Households that own their home", p.homeOwnershipPct, pct, "of households", undefined, "share"),
      ],
    },
  ].filter((g) => g.rows.length > 0 || g.extra);
  return { groups, sources: [...sources.values()] };
}

/** The rows the Dashboard gives under a city: one or two from each panel, in this order. The rest are in the city's window. */
const HEADLINES = [
  "Life expectancy",
  "Safely managed drinking water",
  "Safely managed sanitation",
  "People with electricity",
  "Fine-particle pollution people breathe",
  "Intentional homicides",
  "Years of schooling",
  "People using the internet",
  "GDP per person",
  "Unemployment",
  "Average journey to work, one way",
  "Average journey to work, people living in cities",
];

/** A city's headline rows, each with its panel's colour: the city's own figures first, where any is held, then its country's. */
export function qualityHeadlines(code: string, country: string, city?: string): (Row & { color: string })[] {
  const rows = qualityOf(code, country, city).groups.flatMap((g) => g.rows.map((r) => ({ ...r, color: g.color })));
  return [...rows.filter((r) => r.own && / journey to work(, one way)?$/.test(r.label)), ...HEADLINES.flatMap((label) => rows.filter((r) => r.label === label))];
}

export default function CountryQuality({
  code,
  country,
  place,
  city,
  commute = true,
}: {
  /** The country's ISO code. */
  code: string;
  country: string;
  /** The city whose window this is. */
  place: string;
  /** The city's id - its profile's on the Cities page, or the UN's for it - for the figures held for the city itself. */
  city?: string;
  /** False where the journey to work is to be left out. */
  commute?: boolean;
}) {
  const { groups, sources } = qualityOf(code, country, city, commute);
  /** The subject whose figures are laid out: the first, until another's card is pressed. */
  const [picked, setPicked] = useState<string | null>(null);
  /** Every subject laid out at once, for a reader who wants the whole of it on the page. */
  const [all, setAll] = useState(false);
  // Another place's window: its own first subject, not the last one's choice.
  useEffect(() => setPicked(null), [code, city]);
  if (!groups.length) return null;
  const open = groups.find((g) => g.title === picked) ?? groups[0];
  const shown = all ? groups : [open];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🧭 Quality of life · {country}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
        These figures are for {inSentence(country)}, not for {place}. No body publishes water, energy, transport, safety, health, schooling, business and the economy
        city by city on one footing, so they are given for the country {place} is in, each from the body that measures it and for its latest year. Press a subject to
        see its figures. A bar is on the measure's own scale - 0 to 100 for a share or a score - or, where the world's figure is the only yardstick, on the larger of
        the two; the tick is the world, and “above” or “below” says only which side of it the figure falls.
      </p>
      {/* A card for each subject, all of them in view at once, each with its leading figure: a press lays that subject's
          figures out under them. The subjects stood one under another as nine long panels, and were set out this way when
          a better way to show them was asked for. */}
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,8.5rem),1fr))]" role="group" aria-label={`The subjects of ${country}'s figures`}>
        {groups.map((g) => {
          const on = !all && g.title === open.title;
          const lead = g.rows[0];
          return (
            <button
              key={g.title}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setAll(false);
                setPicked(g.title);
              }}
              className="rounded-xl px-3 py-2.5 text-left cursor-pointer transition-colors border min-w-0"
              style={{ borderColor: on ? g.color : "var(--color-border)", background: on ? `color-mix(in srgb, ${g.color} 16%, transparent)` : "color-mix(in srgb, var(--color-foreground) 5%, transparent)" }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0" style={{ color: g.color }}>
                  {g.icon}
                </span>
                <span className="text-[10px] font-bold font-sans text-foreground uppercase tracking-wide truncate">{g.title}</span>
              </span>
              {lead ? (
                <>
                  <span className="block text-base font-bold font-mono text-foreground leading-tight mt-1.5 truncate">{lead.value}</span>
                  <span className="block text-[10px] font-sans text-muted-foreground leading-snug truncate" title={lead.label}>
                    {lead.label}
                  </span>
                </>
              ) : g.none ? (
                <>
                  <span className="block text-base font-bold font-sans text-muted-foreground leading-tight mt-1.5 truncate">{g.none}</span>
                  <span className="block text-[10px] font-sans text-muted-foreground leading-snug truncate">no figure for {inSentence(country)}</span>
                </>
              ) : (
                <span className="block text-[10px] font-sans text-muted-foreground leading-snug mt-1.5">how it is made up</span>
              )}
              <span className="block text-[9px] font-mono text-muted-foreground mt-1">
                {g.rows.length} {g.rows.length === 1 ? "figure" : "figures"}
              </span>
            </button>
          );
        })}
      </div>

      {shown.map((g) => (
        <div key={g.title} className="modal-tile rounded-xl p-4 min-w-0 mt-3" style={{ borderColor: `color-mix(in srgb, ${g.color} 45%, var(--color-border))` }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="shrink-0" style={{ color: g.color }}>
              {g.icon}
            </span>
            <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-wide">{g.title}</h3>
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{country}</span>
          </div>
          {g.rows.length > 0 && (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,12.5rem),1fr))]">
              {g.rows.map((r) => (
                <QualityTile key={r.label} r={r} color={g.color} />
              ))}
            </div>
          )}
          {g.extra}
        </div>
      ))}
      {groups.length > 1 && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-pressed={all}
          className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-foreground hover:border-secondary/60 transition-colors cursor-pointer"
        >
          {all ? "Show one subject at a time" : `Show all ${groups.length} subjects at once`}
        </button>
      )}
      <SourceLink sources={sources} className="mt-2" />

    </div>
  );
}
