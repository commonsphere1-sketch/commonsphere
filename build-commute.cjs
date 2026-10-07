/**
 * Builds src/data/commute.ts — how long people travel to work, and how, for
 * the Transportation panel of a city's window.
 *
 * No body publishes the journey to work for every country on one footing, and
 * the rankings that offer one for cities (traffic-app and survey indices) are
 * not open to reuse. So the file holds the two official series that are, each
 * for the places it covers, and nothing for the rest:
 *
 *   Eurostat, Labour Force        The mean time of the journey from home to
 *     Survey, 2019 module on      work, one way, in minutes, of employed
 *     work organisation           people aged 15 to 74 who travel at least a
 *     (table lfso_19plwk28)       minute - for each country, and for the
 *                                 people living in its cities, its towns and
 *                                 suburbs and its rural areas, as Eurostat's
 *                                 degree of urbanisation classes them. The
 *                                 module was run once, in 2019. A figure
 *                                 Eurostat marks as of low reliability or
 *                                 confidential is left out.
 *   US Census Bureau, American    For the United States and for the cities
 *     Community Survey 2024,      the Cities page has there: the minutes all
 *     1-year (tables B08013,      workers took to get to work (B08013), the
 *     B08301, B08303)             workers who travelled and how long they
 *                                 took (B08303), and how each worker got
 *                                 there (B08301). The mean is the Bureau's
 *                                 own: the aggregate minutes divided by the
 *                                 workers who did not work from home - 27.2
 *                                 minutes for the country, the figure the
 *                                 Bureau publishes. The shares are each
 *                                 count over its table's total. Nothing else
 *                                 is computed. A place is the city within its
 *                                 own boundary, not the metropolitan area.
 *
 * The two are not the same measure - different years, different surveys, and
 * Eurostat counts the employed where the Census counts workers 16 and over -
 * so the panel gives each under its own name and does not rank across them.
 *
 *   node build-commute.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/commute.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-commute");
fs.mkdirSync(CACHE, { recursive: true });

const EUROSTAT_TABLE = "lfso_19plwk28";
const EUROSTAT_URL = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${EUROSTAT_TABLE}?format=JSON&lang=EN`;
/** Eurostat's codes where they are not the ISO ones. */
const GEO_ISO = { EL: "GR", UK: "GB" };
const EU = "EU27_2020";
const AGGREGATES = new Set([EU, "EU28", "EA19"]);

const ACS_YEAR = 2024;
const ACS_DIR = `https://www2.census.gov/programs-surveys/acs/summary_file/${ACS_YEAR}/table-based-SF/data/1YRData/`;
const ACS_TABLES = ["b08013", "b08301", "b08303"];
const US = "0100000US";
/** The Cities page's cities in the United States, each as the Census place of its name: the city within its own boundary. */
const US_PLACES = {
  nyc26: ["1600000US3651000", "New York city"],
  sfo: ["1600000US0667000", "San Francisco city"],
};

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}

/** Eurostat's mean minutes, by country and by where people live. */
async function europe() {
  const d = JSON.parse(await cached("eurostat.json", EUROSTAT_URL));
  const index = (k) => d.dimension[k].category.index;
  const at = (sel) => d.id.reduce((i, k, n) => i * d.size[n] + index(k)[sel[k]], 0);
  const year = Object.keys(index("time"))[0];
  // The mean is given once: in minutes, for those who travel a minute or more.
  const base = { freq: "A", isced11: "TOTAL", duration: "MN_GE1", age: "Y15-74", sex: "T", unit: "MN", time: year };
  const read = (geo, deg) => {
    const p = at({ ...base, geo, deg_urb: deg });
    const v = d.value[p];
    // A flagged figure - low reliability, confidential - is not taken.
    return typeof v === "number" && !(d.status && d.status[p]) ? v : null;
  };
  const row = (geo) => ({ all: read(geo, "TOTAL"), cities: read(geo, "DEG1"), towns: read(geo, "DEG2"), rural: read(geo, "DEG3") });
  const countries = {};
  for (const geo of Object.keys(index("geo"))) {
    if (AGGREGATES.has(geo)) continue;
    const r = row(geo);
    if (r.all !== null) countries[GEO_ISO[geo] ?? geo] = r;
  }
  const eu = row(EU);
  if (eu.all === null) throw new Error("Eurostat: no figure for the EU");
  return { year, countries, eu, updated: String(d.updated).slice(0, 10) };
}

/** One Census table as rows by GEO_ID. */
async function acsTable(table) {
  const lines = (await cached(`acs-${ACS_YEAR}-${table}.dat`, `${ACS_DIR}acsdt1y${ACS_YEAR}-${table}.dat`)).trim().split(/\r?\n/);
  const head = lines[0].split("|");
  const rows = new Map();
  for (const line of lines.slice(1)) {
    const cells = line.split("|");
    rows.set(cells[0], Object.fromEntries(head.map((k, i) => [k, cells[i]])));
  }
  return rows;
}

async function unitedStates() {
  const [minutes, means, times] = await Promise.all(ACS_TABLES.map(acsTable));
  const of = (geo, name) => {
    const m = minutes.get(geo);
    const w = means.get(geo);
    const t = times.get(geo);
    if (!m || !w || !t) throw new Error(`ACS: ${name} (${geo}) is not in all three tables`);
    const num = (row, col) => {
      const v = Number(row[col]);
      if (!Number.isFinite(v) || v < 0) throw new Error(`ACS: ${name} ${col} is "${row[col]}"`);
      return v;
    };
    const workers = num(w, "B08301_E001");
    const travelled = num(t, "B08303_E001");
    // The Bureau's two tables must describe the same workers: all of them, less those who worked from home.
    if (workers - num(w, "B08301_E021") !== travelled) throw new Error(`ACS: ${name}: the tables disagree on who travelled`);
    const share = (n, total) => Number(((100 * n) / total).toFixed(1));
    const modes = [
      ["Drove alone", num(w, "B08301_E003")],
      ["Carpooled", num(w, "B08301_E004")],
      ["Public transport", num(w, "B08301_E010")],
      ["Walked", num(w, "B08301_E019")],
      ["Cycled", num(w, "B08301_E018")],
      ["Taxi, motorcycle or other", num(w, "B08301_E016") + num(w, "B08301_E017") + num(w, "B08301_E020")],
      ["Worked from home", num(w, "B08301_E021")],
    ];
    if (modes.reduce((a, [, n]) => a + n, 0) !== workers) throw new Error(`ACS: ${name}: the ways of getting to work do not add up to the workers`);
    return {
      place: name,
      minutes: Number((num(m, "B08013_E001") / travelled).toFixed(1)),
      // 60 to 89 minutes, and 90 or more.
      hourPlusPct: share(num(t, "B08303_E012") + num(t, "B08303_E013"), travelled),
      modes: modes.map(([label, n]) => [label, share(n, workers)]),
    };
  };
  const country = of(US, "United States");
  const cities = Object.fromEntries(Object.entries(US_PLACES).map(([id, [geo, name]]) => [id, of(geo, name)]));
  return { country, cities };
}

(async () => {
  const eur = await europe();
  const usa = await unitedStates();
  const today = new Date().toISOString().slice(0, 10);
  const opt = (k, v) => (v === null ? "" : `, ${k}: ${v}`);
  const europeBody = Object.keys(eur.countries)
    .sort()
    .map((code) => {
      const r = eur.countries[code];
      return `  ${code}: { all: ${r.all}${opt("cities", r.cities)}${opt("towns", r.towns)}${opt("rural", r.rural)} },`;
    })
    .join("\n");
  const us = (c) => `{ place: ${JSON.stringify(c.place)}, minutes: ${c.minutes}, hourPlusPct: ${c.hourPlusPct}, modes: ${JSON.stringify(c.modes)} }`;

  fs.writeFileSync(
    OUT,
    `/**
 * The journey to work: how long it takes, and how people make it.
 *
 * GENERATED by build-commute.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * Two official series, each for the places it covers, and nothing for the
 * rest - no body publishes the journey to work for every country on one
 * footing. They are not the same measure and are not ranked against each
 * other: Eurostat's is the mean one-way journey of employed people aged 15 to
 * 74 who travel at least a minute, from the Labour Force Survey's ${eur.year} module;
 * the Census Bureau's is of workers 16 and over who did not work from home,
 * from the American Community Survey ${ACS_YEAR}. The Bureau's mean is its own
 * calculation - aggregate minutes over the workers who travelled - and each
 * share is a count over its table's total.
 */
export const COMMUTE_SOURCES = {
  eurostat: {
    label: "Eurostat — commuting time of employed persons, Labour Force Survey ${eur.year} module (${EUROSTAT_TABLE})",
    url: "https://ec.europa.eu/eurostat/databrowser/view/${EUROSTAT_TABLE}/default/table",
    year: "${eur.year}",
    updated: "${eur.updated}",
  },
  acs: {
    label: "US Census Bureau — American Community Survey ${ACS_YEAR}, 1-year: travel time and means of transportation to work (B08013, B08301, B08303)",
    url: "https://data.census.gov/table/ACSDT1Y${ACS_YEAR}.B08301",
    year: "${ACS_YEAR}",
  },
  retrieved: "${today}",
};

/** Mean minutes, one way: for the country, and for the people living in its cities, its towns and suburbs, and its rural areas. */
export type EuropeCommute = { all: number; cities?: number; towns?: number; rural?: number };

/** The European Union's 27 members together, to read a country against. */
export const COMMUTE_EU: EuropeCommute = { all: ${eur.eu.all}${opt("cities", eur.eu.cities)}${opt("towns", eur.eu.towns)}${opt("rural", eur.eu.rural)} };

/** By ISO code: ${Object.keys(eur.countries).length} countries of the Labour Force Survey. */
export const COMMUTE_EUROPE: Record<string, EuropeCommute> = {
${europeBody}
};

/** Mean minutes one way, the share of journeys of an hour or more, and each way of getting to work as a share of all workers. */
export type UsCommute = { place: string; minutes: number; hourPlusPct: number; modes: [way: string, pct: number][] };

export const COMMUTE_US: UsCommute = ${us(usa.country)};

/** By the Cities page's id: the city within its own boundary, as the Census place of its name. */
export const COMMUTE_US_CITIES: Record<string, UsCommute> = {
${Object.entries(usa.cities)
  .map(([id, c]) => `  ${id}: ${us(c)},`)
  .join("\n")}
};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  Eurostat ${eur.year}: ${Object.keys(eur.countries).length} countries; EU ${eur.eu.all} min, in cities ${eur.eu.cities}`);
  console.log(`  ACS ${ACS_YEAR}: United States ${usa.country.minutes} min; ${Object.values(usa.cities).map((c) => `${c.place} ${c.minutes}`).join("; ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
