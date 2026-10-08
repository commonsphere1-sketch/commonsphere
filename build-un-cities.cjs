/**
 * Builds src/data/unCities.ts — every city the United Nations counts, for the
 * Cities page's full list and for the Dashboard's map.
 *
 * The Cities page profiles a few dozen cities by hand. This is all of them:
 * each city in the United Nations' World Urbanization Prospects: The 2025
 * Revision - the same file build-city-figures.cjs reads for the profiled
 * cities - with its name, country, where it is, whether it is its country's
 * capital, its population in 1975, 2000 and 2025 and the UN's projection for
 * 2050, and its land area and density in 2025.
 *
 * A city here is what the UN's Degree of Urbanization method draws:
 * contiguous 1 km² cells of at least 1,500 people each, holding 50,000 people
 * or more. It is not the administrative city and not the metropolitan area.
 * 2025 is the UN's last estimate; 2050 is its projection, and is named as one.
 *
 * Nothing is computed here beyond rounding. The cities are written largest
 * first by their 2025 population, so a city's place in the file is its rank.
 *
 *   node build-un-cities.cjs     (the UN's file is cached in the system's temp folder, shared with build-city-figures.cjs)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/unCities.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-city-figures");
fs.mkdirSync(CACHE, { recursive: true });
const WUP = "https://population.un.org/wup/";
const WUP_FILE = `${WUP}assets/Download/Cities/WUP2025-DB-DEGURBA-Cities-Population-Surface-Data.csv.gz`;
const YEARS = [1975, 2000, 2025, 2050];
const BASE_YEAR = 2025;

/** RFC 4180 line: quoted fields, embedded commas, doubled quotes. */
function splitCsvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

(async () => {
  const file = path.join(CACHE, "WUP2025-cities.csv.gz");
  if (!fs.existsSync(file)) execFileSync("curl", ["-sSfL", "-m", "1800", "-A", UA, "-o", file, WUP_FILE], { stdio: ["ignore", "ignore", "pipe"] });
  let header = null;
  const col = {};
  const byCity = new Map();
  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
    rl.on("line", (line) => {
      if (!header) {
        header = splitCsvLine(line.replace(/^﻿/, ""));
        header.forEach((h, i) => (col[h] = i));
        for (const need of ["ISO2_Code", "City_Code", "City_Name", "Capital", "Year", "PWCent_Latitude", "PWCent_Longitude", "Pop", "AREA_km2", "Pop_density"]) if (!(need in col)) throw new Error(`the UN's file no longer has a "${need}" column`);
        return;
      }
      const f = splitCsvLine(line);
      const year = +f[col.Year];
      if (!YEARS.includes(year)) return;
      const key = `${f[col.ISO2_Code]}:${f[col.City_Code]}`;
      if (!byCity.has(key)) byCity.set(key, { cc: f[col.ISO2_Code], code: +f[col.City_Code], rows: {} });
      byCity.get(key).rows[year] = f;
    });
    rl.on("close", resolve);
    rl.on("error", reject);
  });

  const num = (f, name, dp, times = 1) => (f && f[col[name]] !== "" && Number.isFinite(+f[col[name]]) ? Number((+f[col[name]] * times).toFixed(dp)) : null);
  const capitals = new Map();
  const cities = [];
  for (const c of byCity.values()) {
    const now = c.rows[BASE_YEAR];
    const pop = num(now, "Pop", 0, 1000);
    if (!/^[A-Z]{2}$/.test(c.cc) || !now || !pop) continue;
    const capital = now[col.Capital];
    capitals.set(capital, (capitals.get(capital) ?? 0) + 1);
    cities.push({ ...c, name: now[col.City_Name], capital, lat: num(now, "PWCent_Latitude", 3), lon: num(now, "PWCent_Longitude", 3), pop, then: num(c.rows[1975], "Pop", 0, 1000), turn: num(c.rows[2000], "Pop", 0, 1000), ahead: num(c.rows[2050], "Pop", 0, 1000), area: num(now, "AREA_km2", 1), density: num(now, "Pop_density", 0) });
  }
  console.log(`cities with a ${BASE_YEAR} population: ${cities.length} in ${new Set(cities.map((c) => c.cc)).size} countries`);
  console.log("the Capital column's values:", JSON.stringify([...capitals]));
  if (cities.length < 10000) throw new Error("the UN counts over 12,000 cities");
  // The column is 1 for a national capital and 0 for any other city: checked, since a change in how it is written would mark every city or none.
  const isCapital = (v) => v === "1";
  const marked = cities.filter((c) => isCapital(c.capital)).length;
  if ([...capitals.keys()].some((v) => v !== "0" && v !== "1") || marked < 150 || marked > 260) throw new Error(`the Capital column marks ${marked} capitals; about 200 were expected`);
  cities.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name));
  console.log("largest:", cities.slice(0, 5).map((c) => `${c.name} ${c.pop}`).join(" · "), "· capitals:", cities.filter((c) => isCapital(c.capital)).length);

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Every city the United Nations counts, largest first by its ${BASE_YEAR} population.
 *
 * GENERATED by build-un-cities.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * United Nations, World Urbanization Prospects: The 2025 Revision. A city is
 * what its Degree of Urbanization method draws - contiguous 1 km² cells of at
 * least 1,500 people each, holding 50,000 people or more - which is not the
 * administrative city and not the metropolitan area. ${BASE_YEAR} is the UN's last
 * estimate; 2050 is its projection.
 */
export const UN_CITIES_RETRIEVED = "${today}";
export const UN_CITIES_SOURCE = { label: "United Nations — World Urbanization Prospects: The 2025 Revision", url: "${WUP}" };
/** The years a city's population is given for: three estimates and, last, the UN's projection. */
export const UN_CITY_YEARS = ${JSON.stringify(YEARS)};

/**
 * [its country's ISO code, the UN's code for the city, its name, latitude and longitude of where its people are
 * centred, 1 if it is its country's capital, its population in each of UN_CITY_YEARS (null where the UN gives none),
 * its land area in km² and its people to a km² in ${BASE_YEAR}]. A city's place in the list is its rank by ${BASE_YEAR} population.
 */
export type UnCity = [cc: string, code: number, name: string, lat: number | null, lon: number | null, capital: 0 | 1, p1975: number | null, p2000: number | null, p2025: number, p2050: number | null, areaKm2: number | null, density: number | null];

export const UN_CITIES: UnCity[] = [
${cities.map((c) => "  " + JSON.stringify([c.cc, c.code, c.name, c.lat, c.lon, isCapital(c.capital) ? 1 : 0, c.then, c.turn, c.pop, c.ahead, c.area, c.density]) + ",").join("\n")}
];
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${cities.length} cities`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
