/**
 * The rows of the "Against the average" panel for each kind of place: its figures, the average of every place of its kind,
 * who measured the figure here and when, and how the figure is gathered - where places differ in gathering it.
 *
 * Every figure is the site's own, from the same tables its windows read; the averages and medians are worked out here, each
 * place counted once.
 */
import type { AvgRow } from "../components/AgainstAverage";
import { stats } from "../components/AgainstAverage";
import { COUNTRY_INDICATORS, type CountryIndicators } from "../data/countryIndicators";
import { countriesData } from "../data/countriesData";
import { STATE_INDICATORS } from "../data/stateIndicators";
import { ECONOMY_INDICATORS, type EconomyIndicators } from "../data/economyIndicators";
import { economiesData } from "../data/economiesData";
import { MORE_ECONOMIES } from "../data/economiesMore";
import { REMAINING_ECONOMIES } from "../data/economiesRemaining";

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : whole(v));
const usdB = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : v >= 1 ? `$${v.toFixed(v < 10 ? 2 : 0)}B` : `$${Math.round(v * 1000)}M`);
const usd = (v: number) => `$${whole(v)}`;
const pct = (v: number) => `${v.toFixed(1)}%`;
const years = (v: number) => `${v.toFixed(1)} yrs`;

/* How each figure is gathered, and where places differ in gathering it. */
const HOW = {
  population: "People living there at mid-year, whatever their citizenship. Each country counts them in its own census, taken in a different year - most every ten years, some long ago - and the UN and the World Bank carry the count forward to the year given.",
  gdp: "Everything produced in a year, in current US dollars at that year's exchange rate. Each statistics office compiles its own accounts to the UN's System of National Accounts - some to its 1993 edition, some to 2008's - and how much of the informal economy they reach differs.",
  gdpPerCapita: "GDP divided by the mid-year population, in current US dollars. Converted at exchange rates, it does not allow for prices, which are lower in poorer countries.",
  growth: "The rise in GDP on the year before at constant prices, each country taking out price rises by its own measures.",
  life: "The years a child born that year would live if that year's death rates held for life. Where not every death is registered it is estimated from surveys and models, as the UN's World Population Prospects does.",
  unemployment: "The share of the labour force without work, available and looking for it, as the International Labour Organization defines it. National definitions differ - in age limits and in what counts as looking - so the World Bank gives the ILO's modelled estimates, made comparable, and modelled outright where a country runs no labour survey.",
  inflation: "The yearly change in consumer prices. Every country prices its own basket of goods, weighted to what its people buy, so the same rate can mean different things in different places.",
  debt: "What general government owes, as a share of GDP, as the IMF compiles it; countries differ in which levels of government and which debts they count.",
  fdi: "Net inflows of foreign direct investment in the year, in US dollars, from the balance of payments each country's central bank compiles.",
};
/** Who measured a country's figure, from the table's note of where it came from. */
const WHO: Record<string, string> = { imf: "IMF", wpp: "UN population estimates", spc: "Pacific Community", adb: "Asian Development Bank", factbook: "CIA World Factbook", wikidata: "its statistics office, via Wikidata" };

/* ── Countries ── */
const SOVEREIGN = countriesData.filter((c) => !c.territory && !c.uninhabited).map((c) => c.code);
type CountryField = keyof CountryIndicators;
const COUNTRY_FIELDS: [CountryField, string, (v: number) => string, string][] = [
  ["population", "Population", people, HOW.population],
  ["gdp", "GDP", usdB, HOW.gdp],
  ["gdpPerCapita", "GDP per person", usd, HOW.gdpPerCapita],
  ["gdpGrowth", "Real GDP growth", pct, HOW.growth],
  ["lifeExpectancy", "Life expectancy", years, HOW.life],
  ["unemploymentRate", "Unemployment", pct, HOW.unemployment],
  ["inflationRate", "Inflation", pct, HOW.inflation],
];
const COUNTRY_STATS = Object.fromEntries(COUNTRY_FIELDS.map(([f]) => [f, stats(SOVEREIGN.map((cc) => COUNTRY_INDICATORS[cc]?.[f]?.v))])) as Record<CountryField, ReturnType<typeof stats>>;
export function countryAverageRows(code: string): AvgRow[] {
  const ci = COUNTRY_INDICATORS[code] ?? {};
  return COUNTRY_FIELDS.map(([f, label, fmt, how]) => {
    const m = ci[f];
    return { key: f, label, value: m?.v, fmt, here: m ? `${m.s ? WHO[m.s] : "World Bank"} · ${m.y}` : undefined, ...COUNTRY_STATS[f], how };
  });
}
export const COUNTRY_PEERS = "the countries that have the figure";

/* ── US states ── */
type StateRow = (typeof STATE_INDICATORS)[string];
const STATE_FIELDS: [string, string, (s: StateRow) => { v: number; y: string } | undefined, (v: number) => string, string, string][] = [
  ["population", "Population", (s) => s.population, people, "Census Bureau", "Residents on 1 July, from the Census Bureau's estimates: the 2020 census carried forward with births, deaths and moves - the same method for every state."],
  ["gdp", "GDP", (s) => s.gdp, usdB, "BEA", "The value of what is produced in the state in a year, in current dollars, by the Bureau of Economic Analysis - one method for every state."],
  ["medianIncome", "Median household income", (s) => s.medianIncome, usd, "Census Bureau, ACS", "The middle household's income, from the American Community Survey - a sample survey, so each state's figure carries a margin of error, wider for the smaller states."],
  ["medianAge", "Median age", (s) => s.medianAge, years, "Census Bureau, ACS", "The middle resident's age, from the American Community Survey, a sample survey of households."],
  ["unemploymentRate", "Unemployment", (s) => s.unemploymentRate, pct, "BLS", "The share of the labour force without work and looking for it, from the Bureau of Labor Statistics' model for each state, drawing on the national household survey, payroll counts and jobless claims; the latest month is preliminary."],
  ["bachelors", "Bachelor's degree or more", (s) => (s.education ? { v: s.education.bachelorsOrHigherPct, y: s.education.y } : undefined), pct, "Census Bureau, ACS", "Adults 25 and over with a bachelor's degree or higher, from the American Community Survey."],
  ["homeValue", "Median home value", (s) => (s.housing ? { v: s.housing.medianHomeValue, y: s.housing.y } : undefined), usd, "Census Bureau, ACS", "The middle owner-occupied home's value as its owner estimates it, from the American Community Survey."],
];
const STATE_LIST = Object.values(STATE_INDICATORS);
const STATE_STATS = Object.fromEntries(STATE_FIELDS.map(([k, , get]) => [k, stats(STATE_LIST.map((s) => get(s)?.v))]));
export function stateAverageRows(id: string): AvgRow[] {
  const s = STATE_INDICATORS[id];
  if (!s) return [];
  return STATE_FIELDS.map(([k, label, get, fmt, who, how]) => {
    const m = get(s);
    return { key: k, label, value: m?.v, fmt, here: m ? `${who} · ${m.y}` : undefined, ...STATE_STATS[k], how };
  });
}
export const STATE_PEERS = `the ${STATE_LIST.length} states`;

/* ── Economies: the countries among them, not the blocs or the territories ── */
const ECON_COUNTRIES = [...economiesData, ...MORE_ECONOMIES, ...REMAINING_ECONOMIES].filter((e) => e.entityType === "Country").map((e) => e.id);
type EconField = keyof EconomyIndicators;
const ECON_FIELDS: [EconField, string, (v: number) => string, string, string][] = [
  ["gdpTrillions", "GDP", (v) => usdB(v * 1000), "World Bank", HOW.gdp],
  ["gdpPerCapita", "GDP per person", usd, "World Bank", HOW.gdpPerCapita],
  ["gdpGrowthRate", "Real GDP growth", pct, "World Bank", HOW.growth],
  ["inflationRate", "Inflation", pct, "World Bank", HOW.inflation],
  ["unemploymentRate", "Unemployment", pct, "World Bank", HOW.unemployment],
  ["debtToGDPRatio", "Government debt, of GDP", pct, "IMF", HOW.debt],
  ["fdiInflowBillions", "Foreign direct investment in", (v) => usdB(v), "World Bank", HOW.fdi],
];
const ECON_STATS = Object.fromEntries(ECON_FIELDS.map(([f]) => [f, stats(ECON_COUNTRIES.map((id) => ECONOMY_INDICATORS[id]?.[f]?.v))])) as Record<EconField, ReturnType<typeof stats>>;
export function economyAverageRows(id: string): AvgRow[] {
  const e = ECONOMY_INDICATORS[id] ?? {};
  return ECON_FIELDS.map(([f, label, fmt, who, how]) => {
    const m = e[f];
    return { key: f, label, value: m?.v, fmt, here: m ? `${who} · ${m.y}` : undefined, ...ECON_STATS[f], how };
  });
}
export const ECONOMY_PEERS = "the countries' economies that have the figure";
