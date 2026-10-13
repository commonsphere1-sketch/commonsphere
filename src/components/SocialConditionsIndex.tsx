/**
 * The social conditions index, on the Human Rights page: twenty published
 * measures of how people live in each country - their health, schooling,
 * water, power and connection, their safety, their liberty and their say,
 * how equal they are and how they are governed - weighed by the reader into
 * one score (IndexBuilder).
 *
 * It holds no figures of its own. Each measure is one the site already
 * holds, from the body that publishes it: the World Bank's development
 * indicators and governance indicators, the UNDP's indices, and the life
 * expectancy the Countries page gives. The builder says under each whose it
 * is, and how many countries have it.
 *
 * It opens with every measure counted once, but for three: the two
 * development indices, which are themselves made of health, schooling and
 * income and would count those twice, and the poverty measure, which the
 * World Bank gives for too few countries to weigh on all of them. They can
 * be given a weight like any other.
 *
 * Housing is not among the measures: no figure for it is held for every
 * country. Nor are earlier years - each measure is its latest - so a
 * country cannot be compared with itself over time here. Both are said on
 * the page. The score is arithmetic on published figures, by a rule set out
 * in full; it is not a published index and makes no claim to be one.
 */
import { COUNTRY_INDEXES, INDEX_DEFS, type IndexId } from "../data/countryIndexes";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { COUNTRY_PANELS, PANEL_SOURCES, type PanelField } from "../data/countryPanels";
import { countriesData } from "../data/countriesData";
import IndexBuilder, { type IndexEntity, type IndexMeasure } from "./IndexBuilder";
import { SourceLink } from "./SourceLink";

const pct = (v: number) => `${Number(v.toFixed(1))}%`;
const WB = "World Bank";

/** A figure of the Countries page's panels, as a measure. */
const panel = (id: PanelField, group: string, label: string, higherIsBetter: boolean, format: (v: number) => string, scale?: [number, number]): IndexMeasure & { from: "panel" } => ({ id, group, label, higherIsBetter, format, scale, by: WB, from: "panel" });
/** A published index, as a measure: on its maker's own scale. */
const index = (id: IndexId, group: string): (IndexMeasure & { from: "index" })[] => {
  const d = INDEX_DEFS.find((x) => x.id === id);
  if (!d || !d.better) return [];
  return [{ id, group, label: d.name, higherIsBetter: d.better === "higher", format: (v) => String(v), scale: d.scale ?? undefined, by: `${d.by} · ${d.years}`, from: "index" }];
};

const MEASURES: (IndexMeasure & { from: "panel" | "index" | "life" })[] = [
  { id: "lifeExpectancy", group: "Health", label: "Life expectancy at birth", higherIsBetter: true, format: (v) => `${v.toFixed(1)} yrs`, by: WB, from: "life" },
  panel("physicians", "Health", "Physicians per 1,000 people", true, (v) => v.toFixed(2)),
  panel("hospitalBeds", "Health", "Hospital beds per 1,000 people", true, (v) => v.toFixed(1)),
  panel("maternalMortality", "Health", "Maternal deaths per 100,000 live births", false, (v) => Math.round(v).toLocaleString("en-US")),
  panel("literacy", "Education", "Adults who can read", true, pct, [0, 100]),
  panel("upperSecondaryPct", "Education", "Finished upper secondary school, people 25 and over", true, pct, [0, 100]),
  ...index("hci", "Education"),
  panel("safeWater", "Water, power and connection", "Safely managed drinking water", true, pct, [0, 100]),
  panel("safeSanitation", "Water, power and connection", "Safely managed sanitation", true, pct, [0, 100]),
  panel("electricityAccess", "Water, power and connection", "People with electricity", true, pct, [0, 100]),
  panel("internetPct", "Water, power and connection", "People using the internet", true, pct, [0, 100]),
  ...index("stability", "Safety and the rule of law"),
  ...index("ruleOfLaw", "Safety and the rule of law"),
  ...index("voice", "Liberty and participation"),
  panel("parliamentFemale", "Liberty and participation", "Seats in parliament held by women", true, pct, [0, 100]),
  ...index("gini", "Equality and inclusion"),
  ...index("gii", "Equality and inclusion"),
  ...index("mpm", "Equality and inclusion"),
  ...index("corruption", "How it is governed"),
  ...index("effectiveness", "How it is governed"),
  ...index("hdi", "Development, all told"),
  ...index("ihdi", "Development, all told"),
];
/** Left at 0 to begin with: the development indices are made of the measures above them, and the poverty measure covers few countries. */
const UNWEIGHED = new Set(["hdi", "ihdi", "mpm"]);
const DEFAULTS = Object.fromEntries(MEASURES.filter((m) => !UNWEIGHED.has(m.id)).map((m) => [m.id, 1]));

const ENTITIES: IndexEntity[] = countriesData.flatMap((c) => {
  const p = COUNTRY_PANELS[c.id] ?? {};
  const x = COUNTRY_INDEXES[c.code] ?? {};
  const values: Record<string, number> = {};
  for (const m of MEASURES) {
    const v = m.from === "panel" ? p[m.id as PanelField]?.v : m.from === "index" ? x[m.id as IndexId]?.v : (COUNTRY_INDICATORS[c.code]?.lifeExpectancy?.v ?? p.lifeExpectancy?.v);
    if (typeof v === "number" && Number.isFinite(v)) values[m.id] = v;
  }
  return Object.keys(values).length ? [{ id: c.id, name: c.name, type: "country" as const, flag: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`, values }] : [];
});

const SOURCES = [
  { label: PANEL_SOURCES.wb.label, url: PANEL_SOURCES.wb.url },
  { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url },
  ...MEASURES.flatMap((m) => {
    const d = m.from === "index" ? INDEX_DEFS.find((x) => x.id === m.id) : undefined;
    return d ? [d.source] : [];
  }),
];

export default function SocialConditionsIndex({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <IndexBuilder
        entities={ENTITIES}
        measures={MEASURES}
        defaults={DEFAULTS}
        title="Social conditions index"
        tag={`${ENTITIES.length} countries · ${MEASURES.length} measures`}
        lead="How people live, country by country, on the measures you choose to weigh: health, schooling, water, power and connection, safety, liberty and say, equality, and how they are governed. Every figure is a published one, named under its measure; the score made of them is worked out here, by the rule given below the weights, and is not a published index."
        defaultsLabel="Each counted once"
        defaultsNote="It opens with each measure counted once - but the two development indices, which are made of health, schooling and income and would count them twice, and the poverty measure, which few countries have."
        otherNote="The first button counts each measure once again."
      />
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-2">
        Not held, and so not among the measures: housing, for which no figure covers every country; and states, cities and municipalities, for which these measures are not published on one footing. A US state can be weighed on its own
        measures on the Rankings page.
      </p>
      <SourceLink sources={SOURCES} className="mt-2" />
    </div>
  );
}
