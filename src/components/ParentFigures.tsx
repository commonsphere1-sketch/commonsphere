/**
 * The headline figures of the country a place is in - and, in the United
 * States, of its state - as tiles, the way that country's or state's own
 * window opens: its development index, its people, how long they live, how
 * many are online, and the rest. They stand at the foot of a town's window,
 * under what is the town's own, and each panel says whose they are: no body
 * publishes them town by town.
 *
 * Nothing is held here. The country's are the figures its panels and
 * indicators already hold (countryPanels.ts, countryIndicators.ts,
 * countryIndexes.ts); the state's are the Census Bureau's, the Bureau of
 * Economic Analysis's and the Bureau of Labor Statistics's
 * (stateIndicators.ts). A figure that is not held is left out, and the tiles
 * that are there fill their line.
 */
import { COUNTRY_INDEXES, INDEX_DEFS } from "../data/countryIndexes";
import { COUNTRY_INDICATORS } from "../data/countryIndicators";
import { COUNTRY_PANELS, panelSource, type PanelFigure } from "../data/countryPanels";
import { COUNTRY_OF } from "../data/placeIndex";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { countryPeople, peopleSource } from "../lib/countryPeople";
import { inSentence } from "./CountryQuality";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Figure = { label: string; value: string; sub: string };

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : whole(v));

/** The tiles, as a country's window draws its own: what it is, the figure in ink, its unit and year. */
function Tiles({ title, note, figures, sources }: { title: string; note: string; figures: Figure[]; sources: Source[] }) {
  if (!figures.length) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">{note}</p>
      <div className="tile-fill gap-2">
        {figures.map((f) => (
          <div key={f.label} className="modal-tile rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-sans">{f.label}</p>
            <p className="text-lg font-bold font-mono text-foreground">{f.value}</p>
            <p className="text-xs text-muted-foreground font-sans">{f.sub}</p>
          </div>
        ))}
      </div>
      <SourceLink sources={sources} className="mt-2" />
    </section>
  );
}

/** The country's: the nine figures its own window opens on, where each is held. */
export function CountryFigures({ code, country, place }: { /** ISO 3166-1. */ code: string; country: string; /** The place whose window this is. */ place: string }) {
  const id = COUNTRY_OF[code];
  const p = (id && COUNTRY_PANELS[id]) || {};
  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.label, s);
  const figures: Figure[] = [];
  /** A figure from the country's panels, citing where it is from. */
  const panel = (label: string, f: PanelFigure | undefined, print: (v: number) => string, sub: (y: string) => string) => {
    if (!f) return;
    const s = panelSource(f);
    cite({ label: s.label.replace(/, \d{4}.*$/, ""), url: s.url });
    figures.push({ label, value: print(f.v), sub: sub(f.y) });
  };

  const hdi = COUNTRY_INDEXES[code]?.hdi;
  if (hdi) {
    figures.push({ label: "HDI Score", value: String(hdi.v), sub: `UNDP index, 0 to 1, ${hdi.y}` });
    cite(INDEX_DEFS.find((d) => d.id === "hdi")!.source);
  }
  // Life expectancy is the panels' where they hold it, and the country's headline indicator otherwise: as its quality panels below read it.
  const life = COUNTRY_INDICATORS[code]?.lifeExpectancy;
  if (p.lifeExpectancy) panel("Life Expectancy", p.lifeExpectancy, (v) => `${v} yrs`, (y) => `at birth, ${y}`);
  else if (life) {
    figures.push({ label: "Life Expectancy", value: `${life.v} yrs`, sub: `at birth, ${life.y}` });
    cite(peopleSource(life));
  }
  const pop = countryPeople(code);
  if (pop) {
    figures.push({ label: "Population", value: people(pop.v), sub: `people, ${pop.y}` });
    cite(peopleSource(pop));
  }
  panel("Median Age", p.medianAge, (v) => `${v} yrs`, (y) => `half are older, half younger, ${y}`);
  panel("Urban Population", p.urbanPct, (v) => `${v}%`, (y) => `of people live in towns and cities, ${y}`);
  panel("Birth Rate", p.birthRate, (v) => `${v}/1k`, (y) => `per 1,000 people, ${y}`);
  panel("Internet Access", p.internetPct, (v) => `${v}%`, (y) => `of people online, ${y}`);
  panel("Gini Index", p.gini, (v) => `${v}`, (y) => `inequality (0–100), ${y}`);
  panel("Corruption Index", p.cpiScore, (v) => `${v}/100`, (y) => `TI CPI ${y}, higher = cleaner`);

  return (
    <Tiles
      title={`🌍 ${country} in figures`}
      note={`The figures ${inSentence(country)}${country.endsWith("s") ? "'" : "'s"} own window opens on. They are the country's, not ${place}'s: no body publishes them town by town.`}
      figures={figures}
      sources={[...sources.values()]}
    />
  );
}

/** The state's, for a place in the United States: its people, its economy and its households, each the federal bureau's own figure with its year. */
export function StateFigures({ stateId, name, place }: { /** The state's id on the US States page. */ stateId: string; name: string; place: string }) {
  const m = STATE_INDICATORS[stateId];
  if (!m) return null;
  const usd = (v: number) => `$${whole(v)}`;
  const poor = m.poverty?.groups.find((g) => g.label === "Below poverty line");
  const figures: Figure[] = [
    ...(m.population ? [{ label: "Population", value: people(m.population.v), sub: `people, Census Bureau estimate, ${m.population.y}` }] : []),
    ...(m.gdp ? [{ label: "GDP", value: m.gdp.v >= 1000 ? `$${(m.gdp.v / 1000).toFixed(2)}T` : `$${m.gdp.v}B`, sub: `current US dollars, ${m.gdp.y}` }] : []),
    ...(m.averageIncome ? [{ label: "Income Per Person", value: usd(m.averageIncome.v), sub: `personal income a year, ${m.averageIncome.y}` }] : []),
    ...(m.medianIncome ? [{ label: "Median Income", value: usd(m.medianIncome.v), sub: `a household a year, ${m.medianIncome.y}` }] : []),
    ...(m.medianAge ? [{ label: "Median Age", value: `${m.medianAge.v} yrs`, sub: `half are older, half younger, ${m.medianAge.y}` }] : []),
    ...(m.unemploymentRate ? [{ label: "Unemployment", value: `${m.unemploymentRate.v}%`, sub: `of the labour force, ${m.unemploymentRate.y}${m.unemploymentRate.prelim ? ", preliminary" : ""}` }] : []),
    ...(poor ? [{ label: "Below Poverty Line", value: `${poor.pct}%`, sub: `of people, ${m.poverty.y}` }] : []),
    ...(m.education ? [{ label: "Bachelor's Or Higher", value: `${m.education.bachelorsOrHigherPct}%`, sub: `of adults 25 and over, ${m.education.y}` }] : []),
    ...(m.housing ? [{ label: "Median Home Value", value: usd(m.housing.medianHomeValue), sub: `owner-occupied homes, ${m.housing.y}` }] : []),
    // A state with no minimum of its own, or one below the federal, is recorded as 0: the federal $7.25 is what applies there.
    ...(m.minimumWage ? [{ label: "Min Wage", value: m.minimumWage.v > 7.25 ? `$${m.minimumWage.v.toFixed(2)}` : "$7.25", sub: m.minimumWage.v > 7.25 ? `an hour, ${m.minimumWage.y}` : `an hour: the federal minimum applies, ${m.minimumWage.y}` }] : []),
  ];
  return (
    <Tiles
      title={`🏛 ${name} in figures`}
      note={`The headline figures of the state ${place} is in. They are ${name}'s, not ${place}'s own.`}
      figures={figures}
      sources={[STATE_SOURCES.population, STATE_SOURCES.bea, STATE_SOURCES.acs, STATE_SOURCES.bls, STATE_SOURCES.dol]}
    />
  );
}
