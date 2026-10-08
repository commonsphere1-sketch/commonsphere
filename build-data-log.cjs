#!/usr/bin/env node
/**
 * build-data-log.cjs
 *
 * The Dashboard's data log: which of the site's data files was read from
 * its sources when. Written to src/data/dataLog.ts.
 *
 * What this replaces. The Dashboard had an "Event Log" - five news events
 * typed by hand, the newest from July 2025, one of them wrong (a Federal
 * Reserve rate it did not hold that month). The site reads its headlines
 * live elsewhere; what it can keep a true log of is its own data.
 *
 * Each data file the site generates carries, in its header, the script that
 * built it and the day it was built - the day its sources were read. This
 * script reads that line from each file named below, so no date is typed
 * here; it stops if a file named has no such line. What each file holds,
 * who publishes it and which page shows it are described here, once, beside
 * the file's name, and a generated file missing from the list stops the run
 * too, so the log cannot quietly fall behind the data.
 *
 * Usage:  node build-data-log.cjs     (after any other build-*.cjs)
 */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "src/data");
const OUT = path.join(DATA, "dataLog.ts");

/**
 * The site's generated data, by file: what it holds, whose figures they are,
 * and the page that shows them. Files that hold one subject between them are
 * one line of the log, dated by the newest.
 */
/* The publishers named are those each file itself cites in its sources; where a file cites more than fit, the line ends "and others". */
const SETS = [
  { files: ["worldview.ts", "regionSeries.ts"], what: "The world's figures, year by year, and by region", from: "World Bank, V-Dem, UNDP, IMF, UCDP and others", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["projections.ts"], what: "Projections: the economy to five years out, people to 2100", from: "IMF World Economic Outlook, UN World Population Prospects", page: "/dashboard/trends", where: "Trends" },
  { files: ["renewables.ts"], what: "Renewable power: generation, capacity, cost and investment", from: "IRENA, Ember, U.S. EIA, OECD", page: "/dashboard/trends", where: "Trends" },
  { files: ["technology.ts", "trendDetails.ts"], what: "Technology and the trends, by region, country and name", from: "World Bank, ITU, Epoch AI, OpenAlex and others", page: "/dashboard/trends", where: "Trends" },
  { files: ["commodityPrices.ts"], what: "Commodity prices, month by month", from: "World Bank, IMF", page: "/dashboard/economies?view=resources", where: "Resources" },
  { files: ["resourceProducers.ts", "energyProducers.ts", "otherProducers.ts", "criticalMinerals.ts"], what: "Who produces and holds each commodity", from: "USGS, U.S. EIA, OPEC, USDA and others", page: "/dashboard/economies?view=resources", where: "Resources" },
  { files: ["countryIndicators.ts", "gdpHistory.ts", "developmentStatus.ts"], what: "Each country's headline figures and GDP history", from: "World Bank, IMF, UN", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryPanels.ts", "landUse.ts", "countryEnergy.ts", "militarySpending.ts"], what: "Each country's people, health, schooling, land, energy and forces", from: "World Bank, UN, UNDP, FAO, U.S. EIA, SIPRI", page: "/dashboard/countries", where: "Countries" },
  { files: ["publicServices.ts"], what: "Free schooling, public health cover and what care costs", from: "UNESCO, OECD, WHO (via the World Bank)", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryGeography.ts", "countryReference.ts", "dependencies.ts"], what: "Geography, languages, religions, heritage sites and dependencies", from: "CIA World Factbook (final edition), Wikidata, UNESCO", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryBudget.ts", "donorAid.ts"], what: "What governments spend, by function, and what they give in aid", from: "IMF, OECD", page: "/dashboard/economies", where: "Economies" },
  { files: ["economyIndicators.ts", "economySectors.ts", "countrySectorsUn.ts", "economiesMore.ts", "economiesRemaining.ts"], what: "Every economy's figures and what it is made of", from: "World Bank, IMF, UN Statistics Division, Eurostat and others", page: "/dashboard/economies", where: "Economies" },
  { files: ["countryCrime.ts", "crimeOffences.ts", "prisonRates.ts"], what: "Recorded crime and prison populations", from: "UNODC, World Prison Brief", page: "/dashboard/crime", where: "Crime statistics" },
  { files: ["stateIndicators.ts", "stateFinance.ts", "stateEnergy.ts"], what: "The fifty states: people, incomes, budgets and power", from: "US Census Bureau, BEA, BLS, BJS, U.S. EIA and others", page: "/dashboard/states", where: "US states" },
  { files: ["countryPolitics.ts"], what: "Each country's political parties and the seats they hold", from: "CIA World Factbook (final edition)", page: "/dashboard/countries", where: "Countries" },
  { files: ["modernSlavery.ts"], what: "Modern slavery: the world's and the regions' estimates, and the forms it takes", from: "ILO, Walk Free and IOM (Global Estimates), Walk Free (Global Slavery Index), ILO (main figures on forced labour)", page: "/dashboard/crime", where: "Crime statistics" },
  { files: ["economyDetails.ts"], what: "Each economy's inflation, deficits and tariffs, with the IMF's projections", from: "IMF (World Economic Outlook, Fiscal Monitor), World Bank", page: "/dashboard/economies", where: "Economies" },
  { files: ["countryReports.ts"], what: "Each country's sovereignty, and its death rates, disaster displacements and natural hazards", from: "CIA World Factbook (final edition), World Bank (WHO, IDMC)", page: "/dashboard/countries", where: "Countries" },
  { files: ["universities.ts"], what: "The universities and colleges of each city and country", from: "Wikidata", page: "/dashboard/cities", where: "Cities" },
  { files: ["stateUniversities.ts"], what: "What each university named in a state's window is, and the year it was founded", from: "Wikidata, Wikipedia", page: "/dashboard/states", where: "US states" },
  { files: ["flagColors.ts"], what: "One colour for each country, read off its flag", from: "flagcdn.com flag images", page: "/dashboard/countries", where: "Countries" },
  { files: ["militaryBases.ts"], what: "Which countries keep military bases abroad, and where", from: "Wikipedia (List of countries with overseas military bases)", page: "/dashboard/countries", where: "Countries" },
  { files: ["justice.ts"], what: "Legal systems, the stages of criminal justice and the people who staff it", from: "CIA World Factbook (final edition), UNODC, World Bank", page: "/dashboard/crime", where: "Crime statistics" },
  { files: ["stateOffices.ts"], what: "When each state's senators', representatives' and governor's terms end", from: "congress-legislators, Wikipedia (citing the National Governors Association)", page: "/dashboard/states", where: "US states" },
  { files: ["placesIndex.ts"], what: "The towns and villages of every country: each place of more than 500 people and each seat of local government", from: "GeoNames", page: "/dashboard/maps", where: "World maps" },
  { files: ["representatives.ts"], what: "The heads of regions and municipalities that three records agree on, with where each place is", from: "Wikidata, Wikipedia", page: "/dashboard/maps", where: "World maps" },
  { files: ["officialProfiles.ts"], what: "Each elected official's education and career, a member of Congress's voting score, and the money the campaign reports", from: "Wikipedia, congress-legislators, Voteview, Federal Election Commission", page: "/dashboard/states", where: "US states" },
  { files: ["publicSecurity.ts"], what: "Public security: stability, conflict deaths, terrorism and displacement, by country", from: "World Bank (Worldwide Governance Indicators), UCDP, Global Terrorism Database, UNHCR, IDMC", page: "/dashboard/countries", where: "Countries" },
  { files: ["subnations.ts"], what: "The first-order divisions of every country - states, provinces, regions, departments - with each one's names, code, capital, area, borders and dated population", from: "Natural Earth, Wikidata", page: "/dashboard/subnations", where: "Subnations" },
  { files: ["usCounties.ts"], what: "The counties of the United States: population by year, births, deaths and migration, land and water area", from: "US Census Bureau", page: "/dashboard/subnations", where: "Subnations" },
  { files: ["cityKnownFor.ts"], what: "What each profiled city is and is known for, with its official website and Britannica entry", from: "Wikipedia, Wikidata", page: "/dashboard", where: "Dashboard" },
  { files: ["cityFigures.ts"], what: "Each city's population, land and built-up area, 1975 to 2050", from: "United Nations (World Urbanization Prospects), Wikidata", page: "/dashboard/cities", where: "Cities" },
  { files: ["airQuality.ts"], what: "The air people breathe: PM2.5 exposure by country", from: "World Bank", page: "/dashboard/maps", where: "World maps" },
  { files: ["economyMarkets.ts"], what: "Growth, prices and jobs, the stock market and the cost of borrowing, year by year, by country", from: "World Bank", page: "/dashboard/economies", where: "Economies" },
  { files: ["politicalTheories.ts"], what: "Political theories and forms of governance, each described and with works to read", from: "Wikidata, Wikipedia; links to Britannica, the Stanford and Internet encyclopedias of philosophy", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["topCompanies.ts"], what: "The largest companies based in each country, as the world's and each region's rankings name them", from: "Wikipedia", page: "/dashboard/economies", where: "Economies" },
  { files: ["unrest.ts"], what: "Revolutions, protests, boycotts and internal conflicts, each with its cause, what it cost and how it ended", from: "Wikipedia", page: "/dashboard/crime", where: "Crime stats" },
  { files: ["endangeredSpecies.ts"], what: "Endangered and critically endangered mammals and birds, with about how many of each are left", from: "Wikipedia, Wikidata", page: "/dashboard/planetary-boundaries", where: "Climate" },
  { files: ["newSpecies.ts"], what: "Species described in the last three years, with what is known of each and where it was found", from: "Wikipedia, Wikidata", page: "/dashboard/planetary-boundaries", where: "Climate" },
  { files: ["namedEvents.ts"], what: "The deadliest natural disaster of each year by name, and where most died in armed conflict", from: "Wikipedia, NOAA, UCDP", page: "/dashboard/humanitarian", where: "Humanitarian" },
  { files: ["commute.ts"], what: "The journey to work: how long it takes, and how people make it", from: "Eurostat, US Census Bureau", page: "/dashboard/cities", where: "Cities" },
  { files: ["climateIndicators.ts"], what: "The measured state of the climate", from: "NOAA, NASA GISS, NSIDC", page: "/dashboard/planetary-boundaries", where: "Climate" },
];
/** Generated files that are indexes of the site's own content - names, places, feeds - not readings of figures. */
const NOT_DATA = new Set(["dataLog.ts", "leaderIndex.ts", "newsSources.ts", "wikiArticles.ts", "admin1Sources.ts", "cityPlaces.ts", "placeIndex.ts"]);

const builtOn = (file) => {
  const head = fs.readFileSync(path.join(DATA, file), "utf8").slice(0, 2500);
  return /GENERATED by ([\w.-]+) on (\d{4}-\d{2}-\d{2})/.exec(head);
};

function main() {
  const listed = new Set(SETS.flatMap((s) => s.files));
  for (const file of fs.readdirSync(DATA).filter((f) => f.endsWith(".ts"))) {
    if (listed.has(file) || NOT_DATA.has(file)) continue;
    if (builtOn(file)) throw new Error(`${file} is generated from a source and is not in the log: add it to SETS`);
  }
  const log = SETS.map((s) => {
    const builds = s.files.map((file) => {
      const m = builtOn(file);
      if (!m) throw new Error(`${file}: no "GENERATED by … on …" line in its header`);
      return { file, script: m[1], on: m[2] };
    });
    const newest = builds.reduce((a, b) => (b.on > a.on ? b : a));
    return { what: s.what, from: s.from, page: s.page, where: s.where, read: newest.on, files: builds.length };
  }).sort((a, b) => b.read.localeCompare(a.read) || a.what.localeCompare(b.what));

  fs.writeFileSync(
    OUT,
    `/**
 * The site's data log: when each of its data sets was last read from its
 * sources, newest first.
 *
 * GENERATED by build-data-log.cjs — do not edit by hand; run it after any
 * other build script. Each date is read from the header of the data file
 * itself; nothing here is typed in.
 */
export interface DataLogEntry {
  /** What the data set holds. */
  what: string;
  /** Whose figures they are. */
  from: string;
  /** The page that shows them, and its name. */
  page: string;
  where: string;
  /** The day its sources were last read, ISO. */
  read: string;
  /** How many of the site's data files it is. */
  files: number;
}

export const DATA_LOG: DataLogEntry[] = ${JSON.stringify(log, null, 2)};

/** How many data files the log covers. */
export const DATA_LOG_FILES = ${log.reduce((n, e) => n + e.files, 0)};
`,
  );
  console.log(`Wrote src/data/dataLog.ts: ${log.length} data sets from ${log.reduce((n, e) => n + e.files, 0)} files.`);
  for (const e of log) console.log(`  ${e.read}  ${e.what}  [${e.where}]`);
}

main();
