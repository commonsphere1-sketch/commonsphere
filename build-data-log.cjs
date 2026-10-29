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
  { files: ["newsHistory.ts", "newsCountryHistory.ts"], what: "Conflict deaths and disaster alerts by continent and by country, year by year", from: "UCDP (via Our World in Data), GDACS", page: "/dashboard/news", where: "News" },
  { files: ["admin2Untiled.ts"], what: "Which countries' district boundaries do not fit together, measured", from: "geoBoundaries, Natural Earth", page: "/dashboard/maps", where: "World Maps" },
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
  { files: ["countryBudget.ts"], what: "What governments spend, by function", from: "IMF", page: "/dashboard/economies", where: "Economies" },
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
  { files: ["subnations.ts"], what: "The first-order divisions of every country - states, provinces, regions, departments - with each one's names, code, capital, area, borders and dated population", from: "Natural Earth, Wikidata", page: "/dashboard/subnations", where: "Municipalities" },
  { files: ["subnationFlagColors.ts"], what: "One colour for each division that has a flag, read off the flag", from: "Wikimedia Commons", page: "/dashboard", where: "Dashboard" },
  { files: ["subnationFlagFiles.ts"], what: "Which divisions' flags are saved with the site, and under what file name", from: "Wikimedia Commons", page: "/dashboard/subnations", where: "Municipalities" },
  { files: ["stateHealthSafety.ts"], what: "Each US state's life expectancy at birth and its deaths by homicide to 100,000 residents", from: "CDC (National Center for Health Statistics; National Center for Injury Prevention and Control)", page: "/dashboard/maps", where: "World maps" },
  { files: ["statePeople.ts"], what: "A state's people: the languages spoken at home, and how household income is shared", from: "US Census Bureau", page: "/dashboard/states", where: "US States" },
  { files: ["countryPeople.ts"], what: "A country's people: its languages, religions, peoples and ages, how its income is shared, and how many are poor", from: "CIA World Factbook, World Bank", page: "/dashboard/countries", where: "Countries" },
  { files: ["taxHistory.ts"], what: "Taxation over the years: corporate rates of central and sub-central government, the top income tax rate, and tax revenue", from: "OECD, World Bank", page: "/dashboard/economies", where: "Economies" },
  { files: ["countryLaw.ts"], what: "The law a place is under and how its country is governed: what is illegal and legal there, its legal system, constitution, courts, executive, legislature, citizenship and vote", from: "UK Foreign, Commonwealth & Development Office, CIA World Factbook", page: "/dashboard/cities", where: "Cities" },
  { files: ["countryYear.ts"], what: "The year so far in each country: the dated events of Wikipedia's article for the year, each with the report it cites", from: "Wikipedia", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryStatus.ts"], what: "What is being warned of in each country now: travel advisories, outbreaks of disease and disaster alerts", from: "US Department of State, UK Foreign Office, US CDC, GDACS", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryUn.ts"], what: "Each country's place in the United Nations: its date of admission, its regional group, and its seat and past terms on the Security Council", from: "United Nations", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryTax.ts"], what: "Each country's tax revenue and what its government's revenue is made of, its statutory corporate and top personal income tax rates, and what its employees are paid", from: "World Bank (IMF Government Finance Statistics), OECD, ILO", page: "/dashboard/countries", where: "Countries" },
  { files: ["countryIndexes.ts"], what: "The composite indexes each country is scored on: human development and its adjusted forms, gender, inequality and poverty, the six governance scores, human capital, logistics and statistics", from: "UNDP (Human Development Report), World Bank", page: "/dashboard/subnations", where: "Municipalities" },
  { files: ["economyManufacturing.ts"], what: "Each economy's manufacturing: value added, share of GDP, growth, manufactures in trade, high-technology exports, jobs in industry", from: "World Bank", page: "/dashboard/economies", where: "Economies" },


  { files: ["unCities.ts"], what: "Every city the United Nations counts: where it is, its population in 1975, 2000 and 2025 and projected for 2050, its area and density", from: "United Nations", page: "/dashboard/cities", where: "Global cities" },
  { files: ["usCounties.ts"], what: "The counties of the United States: population by year, births, deaths and migration, land and water area", from: "US Census Bureau", page: "/dashboard/subnations", where: "Municipalities" },
  { files: ["cityKnownFor.ts"], what: "What each profiled city is and is known for, with its official website and Britannica entry", from: "Wikipedia, Wikidata", page: "/dashboard", where: "Dashboard" },
  { files: ["cityFigures.ts"], what: "Each city's population, land and built-up area, 1975 to 2050", from: "United Nations (World Urbanization Prospects), Wikidata", page: "/dashboard/cities", where: "Cities" },
  { files: ["airQuality.ts"], what: "The air people breathe: PM2.5 exposure by country", from: "World Bank", page: "/dashboard/maps", where: "World maps" },
  { files: ["economyMarkets.ts"], what: "Growth, prices and jobs, the stock market and the cost of borrowing, year by year, by country", from: "World Bank", page: "/dashboard/economies", where: "Economies" },
  { files: ["civicCalendar.ts"], what: "Elections by country and US state, and US city council meetings, for the calendar", from: "Wikidata (with the page each date cites); US Code, US Senate, National Governors Association; cities' Legistar calendars", page: "/dashboard", where: "Calendar" },
  { files: ["frontiers2.ts"], what: "Satellites and probes working in space, by owner, class and use; government research budgets by objective; MRI, CT and PET scanners per million people", from: "GCAT; OECD GBARD; OECD Health Statistics", page: "/dashboard/trends", where: "Developments" },
  { files: ["frontiers.ts"], what: "The frontiers of invention: AI training compute, clean energy costs and capacity, electric cars, robots, supercomputers, nuclear arsenals, the Nobel Prizes in the sciences", from: "Epoch AI, IRENA, Ember, IEA, IFR, TOP500, FAS via Our World in Data; the Nobel Prize", page: "/dashboard/trends", where: "Developments" },
  { files: ["topExports.ts"], what: "What each country sells abroad: its largest goods exports by HS chapter, with their value", from: "UN Comtrade", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["usCountyEcon.ts"], what: "How the people of every US county work and live: unemployment since 2000, median household income, poverty, schooling, rural or urban", from: "USDA Economic Research Service (BLS, Census Bureau)", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["rights.ts"], what: "How far each kind of right is respected: civil, political and private liberties, expression, association, academic freedom, the rule of law, women's political empowerment", from: "V-Dem Institute, via Our World in Data", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["innovation.ts"], what: "The space race, science and invention, and new medicines: orbital launches by year and by agency, objects launched, R&D spending, researchers, journal articles, patents, novel drug approvals", from: "GCAT; UNOOSA via Our World in Data; World Bank; US FDA", page: "/dashboard/trends", where: "Developments" },
  { files: ["surveillance.ts"], what: "How far each government watches and restricts its people online: social media monitoring, filtering, shutdowns, arrests, privacy law", from: "V-Dem Institute, Digital Society Project", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["politicalTheories.ts"], what: "Political theories and forms of governance, each described and with works to read; where each began, its figures, history, countries and parties", from: "Wikidata, CIA World Factbook, Wikipedia; links to Britannica, the Stanford and Internet encyclopedias of philosophy", page: "/dashboard/worldview", where: "Worldview" },
  { files: ["topCompanies.ts"], what: "The largest companies based in each country, as the world's and each region's rankings name them", from: "Wikipedia", page: "/dashboard/economies", where: "Economies" },
  { files: ["unrest.ts"], what: "Revolutions, protests, boycotts and internal conflicts, each with its cause, what it cost and how it ended", from: "Wikipedia", page: "/dashboard/crime", where: "Crime stats" },
  { files: ["endangeredSpecies.ts"], what: "Endangered and critically endangered mammals and birds, with about how many of each are left", from: "Wikipedia, Wikidata", page: "/dashboard/planetary-boundaries", where: "Climate" },
  { files: ["newSpecies.ts"], what: "Species described in the last three years, with what is known of each and where it was found", from: "Wikipedia, Wikidata", page: "/dashboard/planetary-boundaries", where: "Climate" },
  { files: ["commute.ts"], what: "The journey to work: how long it takes, and how people make it", from: "Eurostat, US Census Bureau", page: "/dashboard/cities", where: "Cities" },
  { files: ["earthStatus.ts"], what: "The state of the world's fresh water, forests, wildfires and coral reefs", from: "World Bank, Global Forest Watch, GWIS, NOAA", page: "/dashboard/planetary-boundaries", where: "Climate" },
  { files: ["climateWatch.ts"], what: "El Niño and La Niña, the records in the measured series, disasters by country, erosion, and projected warming by country", from: "NOAA, NASA GISS, NSIDC, IDMC, GDACS, World Bank", page: "/dashboard/planetary-boundaries", where: "Climate" },
  { files: ["climateIndicators.ts"], what: "The measured state of the climate", from: "NOAA, NASA GISS, NSIDC", page: "/dashboard/planetary-boundaries", where: "Climate" },
];
/** Generated files that are indexes of the site's own content - names, places, feeds - not readings of figures. */
// wealthyFamilies.ts is held and no page draws it: the Richest Families tab was taken off the World Leaders page, and the log lists what the site shows.
const NOT_DATA = new Set(["dataLog.ts", "leaderIndex.ts", "newsSources.ts", "wikiArticles.ts", "admin1Sources.ts", "cityPlaces.ts", "placeIndex.ts", "wealthyFamilies.ts"]);

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
