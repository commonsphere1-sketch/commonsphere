/**
 * A place's living conditions as one number, worked out here from the
 * figures the site already holds for it: what the maps colour a country or a
 * US state by. It is not a published index and is never shown as one - every
 * place it is drawn or quoted says it is worked out here, and how.
 *
 * How it is worked out, the same way for countries and for states:
 *
 *   1. Each measure is turned into a standing: the share of the places
 *      holding that measure that this place does better than, 0 to 100 (a
 *      tie counts half). "Better" is more of it - years of life, schooling,
 *      income - or less: homicides, deaths in childbirth, dirty air, people
 *      out of work or poor. Standing, not the raw figure, so that no one
 *      measure's unit or outlier outweighs the rest.
 *   2. The measures are grouped into parts - health, safety, schooling,
 *      income and work, and so on - and a part's score is the mean of the
 *      standings of its measures that the place holds.
 *   3. The score is the mean of the parts, each counted once, so that a part
 *      with four measures weighs no more than a part with one.
 *
 * A place is scored only where it holds most of the parts (five of a
 * country's seven; all five of a state's); otherwise it has no score, and
 * the maps hatch it rather than guess. Nothing is carried over, estimated or
 * filled in: a measure a place does not hold is left out of its part.
 *
 * The figures are each their source's own, with its year, as the place's
 * windows show them (countryPanels, countryIndicators, countryCrime,
 * airQuality, countryIndexes; stateIndicators, stateHealthSafety). They are
 * not all of one year, so the score is a reading of the latest figures held
 * and not of any one year.
 */
import { AIR_QUALITY } from "../data/airQuality";
import { COUNTRY_CRIME } from "../data/countryCrime";
import { COUNTRY_INDEXES } from "../data/countryIndexes";
import { COUNTRY_INDICATORS } from "../data/countryIndicators";
import { COUNTRY_PANELS } from "../data/countryPanels";
import { COUNTRY_OF } from "../data/placeIndex";
import { STATE_HOMICIDE, STATE_LIFE_EXPECTANCY } from "../data/stateHealthSafety";
import { STATE_INDICATORS } from "../data/stateIndicators";
import { usStatesData } from "../data/statesData";

export type LivingPart = { name: string; score: number; /** How many of the part's measures the place holds, and how many there are. */ held: number; of: number };
export type Living = { /** 0 to 100. */ score: number; parts: LivingPart[] };

type Measure<K> = { name: string; better: "more" | "less"; get: (key: K) => number | null | undefined };
type Part<K> = { name: string; measures: Measure<K>[] };

/** Every place's score, from its parts' measures: null where it holds fewer than `least` of the parts. */
function scoreAll<K extends string>(keys: K[], parts: Part<K>[], least: number): Record<string, Living> {
  // Each measure's values across the places that hold it, sorted, to stand a place among.
  const standing = (m: Measure<K>) => {
    const held = keys.flatMap((k) => {
      const v = m.get(k);
      return v != null && Number.isFinite(v) ? [v] : [];
    });
    return (v: number) => {
      const below = held.filter((x) => (m.better === "more" ? x < v : x > v)).length;
      const same = held.filter((x) => x === v).length;
      return (100 * (below + 0.5 * same)) / held.length;
    };
  };
  const stand = new Map<Measure<K>, (v: number) => number>(parts.flatMap((p) => p.measures.map((m) => [m, standing(m)] as const)));
  const out: Record<string, Living> = {};
  for (const k of keys) {
    const scored: LivingPart[] = [];
    for (const p of parts) {
      const got = p.measures.flatMap((m) => {
        const v = m.get(k);
        return v != null && Number.isFinite(v) ? [stand.get(m)!(v)] : [];
      });
      if (got.length) scored.push({ name: p.name, score: got.reduce((a, b) => a + b, 0) / got.length, held: got.length, of: p.measures.length });
    }
    if (scored.length < least) continue;
    out[k] = { score: Number((scored.reduce((a, p) => a + p.score, 0) / scored.length).toFixed(1)), parts: scored };
  }
  return out;
}

/* ── Countries, by ISO 3166-1 code ── */
const panel = (code: string) => COUNTRY_PANELS[COUNTRY_OF[code]] ?? {};
const index = (code: string) => COUNTRY_INDEXES[code] ?? {};
export const COUNTRY_LIVING_PARTS: Part<string>[] = [
  {
    name: "Health",
    measures: [
      { name: "life expectancy", better: "more", get: (c) => panel(c).lifeExpectancy?.v ?? COUNTRY_INDICATORS[c]?.lifeExpectancy?.v },
      { name: "deaths in childbirth", better: "less", get: (c) => panel(c).maternalMortality?.v },
      { name: "physicians to 1,000 people", better: "more", get: (c) => panel(c).physicians?.v },
    ],
  },
  {
    name: "Safety",
    measures: [
      { name: "homicides to 100,000 people", better: "less", get: (c) => COUNTRY_CRIME[COUNTRY_OF[c]]?.homicide?.v },
      { name: "political stability and absence of violence", better: "more", get: (c) => index(c).stability?.v },
      { name: "rule of law", better: "more", get: (c) => index(c).ruleOfLaw?.v },
    ],
  },
  {
    name: "Schooling",
    measures: [
      { name: "years of schooling", better: "more", get: (c) => panel(c).schoolingYears?.v },
      { name: "adults who can read", better: "more", get: (c) => panel(c).literacy?.v },
    ],
  },
  {
    name: "Income and work",
    measures: [
      { name: "GDP per person", better: "more", get: (c) => COUNTRY_INDICATORS[c]?.gdpPerCapita?.v },
      { name: "unemployment", better: "less", get: (c) => COUNTRY_INDICATORS[c]?.unemploymentRate?.v },
    ],
  },
  {
    name: "Services",
    measures: [
      { name: "safely managed drinking water", better: "more", get: (c) => panel(c).safeWater?.v },
      { name: "safely managed sanitation", better: "more", get: (c) => panel(c).safeSanitation?.v },
      { name: "people with electricity", better: "more", get: (c) => panel(c).electricityAccess?.v },
      { name: "people using the internet", better: "more", get: (c) => panel(c).internetPct?.v },
    ],
  },
  { name: "Air", measures: [{ name: "fine-particle pollution", better: "less", get: (c) => AIR_QUALITY[c]?.pm25 }] },
  {
    name: "Government",
    measures: [
      { name: "control of corruption", better: "more", get: (c) => index(c).corruption?.v },
      { name: "government effectiveness", better: "more", get: (c) => index(c).effectiveness?.v },
    ],
  },
];
/** How many of its seven parts a country must hold to be scored. */
export const COUNTRY_LIVING_LEAST = 5;
export const COUNTRY_LIVING: Record<string, Living> = scoreAll(Object.keys(COUNTRY_OF), COUNTRY_LIVING_PARTS, COUNTRY_LIVING_LEAST);

/* ── The states of the United States, by the state's name ── */
const state = new Map(usStatesData.map((s) => [s.name, STATE_INDICATORS[s.id]]));
export const STATE_LIVING_PARTS: Part<string>[] = [
  { name: "Health", measures: [{ name: "life expectancy", better: "more", get: (n) => STATE_LIFE_EXPECTANCY[n] }] },
  { name: "Safety", measures: [{ name: "deaths by homicide to 100,000 residents", better: "less", get: (n) => STATE_HOMICIDE[n] }] },
  {
    name: "Schooling",
    measures: [
      { name: "adults with a high school diploma", better: "more", get: (n) => state.get(n)?.education?.highSchoolOrHigherPct },
      { name: "adults with a bachelor's degree", better: "more", get: (n) => state.get(n)?.education?.bachelorsOrHigherPct },
    ],
  },
  {
    name: "Income and work",
    measures: [
      { name: "median household income", better: "more", get: (n) => state.get(n)?.medianIncome?.v },
      { name: "people below the poverty line", better: "less", get: (n) => state.get(n)?.poverty?.groups.find((g) => g.label === "Below poverty line")?.pct },
      { name: "unemployment", better: "less", get: (n) => state.get(n)?.unemploymentRate?.v },
    ],
  },
  { name: "Housing", measures: [{ name: "renters paying 30% or more of income in rent", better: "less", get: (n) => state.get(n)?.housing?.rentBurdenPct }] },
];
export const STATE_LIVING: Record<string, Living> = scoreAll(
  usStatesData.map((s) => s.name),
  STATE_LIVING_PARTS,
  STATE_LIVING_PARTS.length,
);

/** The parts and their measures, as a sentence for a note under a map. */
export const partsSaid = (parts: Part<string>[]) => parts.map((p) => `${p.name.toLowerCase()} (${p.measures.map((m) => m.name).join(", ")})`).join("; ");
