/**
 * Builds src/data/cityFigures.ts — the figures behind the Cities page.
 *
 * What this replaces. Every figure on the page was typed in: a population and
 * a "metro" population, GDP and GDP per person, cost-of-living, crime, safety
 * and air-quality "indices", a tourism rank, counts of headquarters and "tech
 * hubs", five years of "trends", and eighteen "urban statistics" a city, under
 * the names of two rankings that publish none of them as given. The page said
 * so itself: "entered from the sources named and not rebuilt from them".
 *
 * The page is built instead on the one body that measures every city the same
 * way:
 *
 *   United Nations, World      Each city's population, land area, built-up
 *     Urbanization Prospects:  area, density and built-up area per person,
 *     The 2025 Revision        year by year from 1975, and its share of the
 *                              people living in its country's cities -
 *                              estimates to 2025 and the UN's projections to
 *                              2050 - with the UN's own rating of how
 *                              plausible the population figure is. A city here is what the Degree of
 *                              Urbanization method draws: contiguous 1 km²
 *                              cells of at least 1,500 people each, holding
 *                              50,000 people or more. It is not the
 *                              administrative city and not the metropolitan
 *                              area, which is why the same rule can be put to
 *                              every city on Earth.
 *   Wikidata                   The population within the city's own boundary,
 *                              as the statement Wikidata ranks first gives it,
 *                              with its year - kept only where that statement
 *                              cites a reference. It is there to be read
 *                              beside the UN's figure, not in place of it.
 *
 * A city is matched to the UN's by name, in the same country, within 80 km of
 * its Wikipedia article's coordinates (cityPlaces.ts); the match must be the
 * only one. Nothing is computed here beyond rounding, and a rank by counting.
 *
 *   node build-city-figures.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/cityFigures.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-city-figures");
fs.mkdirSync(CACHE, { recursive: true });

const WUP = "https://population.un.org/wup/";
const WUP_FILE = `${WUP}assets/Download/Cities/WUP2025-DB-DEGURBA-Cities-Population-Surface-Data.csv.gz`;
/** The UN's estimates end here; the years after are its projections ("estimates for 1975-2025 and projections up to 2050"). */
const BASE_YEAR = 2025;
/** Within this of the article's coordinates, so a namesake elsewhere in the country cannot be taken. */
const NEAR_KM = 80;

/** Where the page's city and the UN's go by different names. The Bay Area is several UN cities; San Francisco is the one it is named for. */
const UN_NAMES = { sfo: "San Francisco" };

function fetchTo(url, at) {
  if (fs.existsSync(at)) return;
  try {
    execFileSync("curl", ["-sSfL", "-m", "1800", "-A", UA, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    fs.rmSync(at, { force: true });
    throw new Error(`${url}: could not be fetched`);
  }
}
const api = (base, params) =>
  JSON.parse(
    execFileSync("curl", ["-sSfL", "-m", "120", "-A", UA, "-G", base, ...Object.entries({ format: "json", ...params }).flatMap(([k, v]) => ["--data-urlencode", `${k}=${v}`])], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    }),
  );

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

const plain = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const km = (a, b) => {
  const rad = Math.PI / 180, dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const round = (v, dp) => Number(Number(v).toFixed(dp));

// ── The page's cities, and where each one's article puts it ──
const src = fs.readFileSync(path.join(__dirname, "src/data/citiesData.ts"), "utf8");
const cities = [...src.matchAll(/id: "([^"]+)", name: "([^"]+)", country: "([^"]+)", countryCode: "([A-Z]{2})"/g)].map((m) => ({ id: m[1], name: m[2], country: m[3], cc: m[4] }));
const held = (src.match(/\n    id: "/g) || []).length;
if (!cities.length || cities.length !== held) throw new Error(`read ${cities.length} cities, but the list holds ${held}`);
const placesSrc = fs.readFileSync(path.join(__dirname, "src/data/cityPlaces.ts"), "utf8");
for (const c of cities) {
  const m = placesSrc.match(new RegExp(`"${c.id}": \\{ wiki: "([^"]+)", lon: (-?[\\d.]+), lat: (-?[\\d.]+) \\}`));
  if (!m) throw new Error(`${c.name}: no article and position in cityPlaces.ts - run build-city-places.cjs first`);
  Object.assign(c, { wiki: m[1], lon: +m[2], lat: +m[3] });
}
const wanted = new Set(cities.map((c) => c.cc));

(async () => {
  // ── The UN's database: one row a city a year. Read as a stream; the rows of the page's countries are kept. ──
  const file = path.join(CACHE, "WUP2025-cities.csv.gz");
  fetchTo(WUP_FILE, file);
  let header = null;
  /** `${ISO2}:${City_Code}` → the city's rows, by year. */
  const byCity = new Map();
  /** The population of every city the UN counts, in the base year: the field a rank is taken in. */
  const basePops = [];
  let firstYear = Infinity, lastYear = -Infinity;
  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
    rl.on("line", (line) => {
      if (!header) { header = splitCsvLine(line.replace(/^﻿/, "")); return; }
      const f = splitCsvLine(line);
      const o = {};
      for (let i = 0; i < header.length; i++) o[header[i]] = f[i];
      const year = +o.Year;
      if (year < firstYear) firstYear = year;
      if (year > lastYear) lastYear = year;
      if (year === BASE_YEAR && o.Pop !== "") basePops.push(+o.Pop);
      if (!wanted.has(o.ISO2_Code)) return;
      const key = `${o.ISO2_Code}:${o.City_Code}`;
      if (!byCity.has(key)) byCity.set(key, { cc: o.ISO2_Code, code: +o.City_Code, name: o.City_Name, rows: new Map() });
      byCity.get(key).rows.set(year, o);
    });
    rl.on("close", resolve);
    rl.on("error", reject);
  });
  for (const col of ["City_Name", "Capital", "Year", "PWCent_Latitude", "PWCent_Longitude", "Pop_plausibility", "Pop", "AREA_km2", "Pop_density", "BU_km2", "BU_m2_per_capita", "percPop"]) {
    if (!header.includes(col)) throw new Error(`the UN's file no longer has a "${col}" column`);
  }
  if (basePops.length < 10000) throw new Error(`only ${basePops.length} cities have a ${BASE_YEAR} population; the UN counts over 12,000`);
  basePops.sort((a, b) => b - a);
  const years = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  if (firstYear > 1980 || lastYear < 2040 || BASE_YEAR <= firstYear || BASE_YEAR >= lastYear) throw new Error(`the file runs ${firstYear}-${lastYear}; expected 1975-2050 around a ${BASE_YEAR} base`);

  // ── Each of the page's cities to the UN's ──
  const names = (un) => {
    const m = un.match(/^(.*?)\s*\((.*)\)\s*$/);
    return (m ? [m[1], m[2]] : [un]).map(plain);
  };
  const out = {};
  for (const c of cities) {
    const want = plain(UN_NAMES[c.id] ?? c.name);
    const hits = [...byCity.values()].filter((u) => {
      if (u.cc !== c.cc || !names(u.name).includes(want)) return false;
      const at = u.rows.get(BASE_YEAR);
      return at && km([c.lon, c.lat], [+at.PWCent_Longitude, +at.PWCent_Latitude]) <= NEAR_KM;
    });
    if (hits.length !== 1) throw new Error(`${c.name}: ${hits.length} UN cities named "${want}" in ${c.cc} within ${NEAR_KM} km`);
    const u = hits[0];
    // A year the UN gives no figure for is null: it is not filled in. The base year must be there.
    const col = (name, dp, scale = 1) =>
      years.map((y) => {
        const r = u.rows.get(y);
        const blank = !r || r[name] === "" || !Number.isFinite(+r[name]);
        if (blank && y === BASE_YEAR) throw new Error(`${c.name}: no ${name} for ${y}`);
        return blank ? null : round(+r[name] * scale, dp);
      });
    const base = u.rows.get(BASE_YEAR);
    const pop = col("Pop", 0, 1000);
    const area = col("AREA_km2", 1);
    // The UN's own density is its population over its land area: checked, so the page can say the one from the other two.
    const i = years.indexOf(BASE_YEAR);
    if (Math.abs(pop[i] / area[i] - +base.Pop_density) / +base.Pop_density > 0.01) throw new Error(`${c.name}: population over area is not the UN's density`);
    if (!["Low", "Moderate", "High"].includes(base.Pop_plausibility)) throw new Error(`${c.name}: plausibility "${base.Pop_plausibility}"`);
    out[c.id] = {
      un: u.name,
      code: u.code,
      capital: base.Capital === "1",
      plausibility: base.Pop_plausibility,
      rank: basePops.findIndex((p) => p <= +base.Pop) + 1,
      pop,
      area,
      built: col("BU_km2", 2),
      density: col("Pop_density", 0),
      builtPer: col("BU_m2_per_capita", 1),
      share: col("percPop", 2),
    };
  }

  // ── Wikidata: the population within the city's own boundary ──
  const pages = api("https://en.wikipedia.org/w/api.php", { action: "query", formatversion: "2", prop: "pageprops", ppprop: "wikibase_item", titles: cities.map((c) => c.wiki).join("|") }).query.pages;
  const itemOf = new Map(pages.map((p) => [p.title, p.pageprops && p.pageprops.wikibase_item]));
  for (const c of cities) {
    c.item = itemOf.get(c.wiki);
    if (!/^Q\d+$/.test(c.item || "")) throw new Error(`${c.name}: no Wikidata item for the article "${c.wiki}"`);
  }
  const entities = api("https://www.wikidata.org/w/api.php", { action: "wbgetentities", ids: cities.map((c) => c.item).join("|"), props: "claims" }).entities;
  let admin = 0;
  for (const c of cities) {
    const preferred = ((entities[c.item].claims || {}).P1082 || []).filter((s) => s.rank === "preferred" && s.mainsnak.datavalue);
    if (preferred.length !== 1) continue;
    const s = preferred[0];
    const when = s.qualifiers && s.qualifiers.P585 && s.qualifiers.P585[0].datavalue;
    const value = +s.mainsnak.datavalue.value.amount;
    // A figure nobody is cited for, or with no year to it, is left out.
    if (!when || !(s.references || []).length || !Number.isFinite(value) || value <= 0) continue;
    out[c.id].admin = { population: Math.round(value), year: +when.value.time.slice(1, 5), item: c.item };
    admin++;
  }

  const today = new Date().toISOString().slice(0, 10);
  // Written out one by one: join() prints a null as nothing, which would leave a hole in the array.
  const list = (a) => a.map((x) => (x === null ? "null" : String(x))).join(",");
  const row = (v) => `{ un: ${JSON.stringify(v.un)}, code: ${v.code}, capital: ${v.capital}, plausibility: "${v.plausibility}", rank: ${v.rank},${v.admin ? ` admin: ${JSON.stringify(v.admin).replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ")},` : ""}
    pop: [${list(v.pop)}],
    area: [${list(v.area)}],
    built: [${list(v.built)}],
    density: [${list(v.density)}],
    builtPer: [${list(v.builtPer)}],
    share: [${list(v.share)}] }`;
  const ts = `/**
 * The figures behind the Cities page.
 *
 * GENERATED by build-city-figures.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each city's population, land area, built-up area, density, built-up area per
 * person and share of the people living in its country's cities, a figure a
 * year from ${firstYear} to ${lastYear}, from the United Nations' World Urbanization
 * Prospects: The 2025 Revision. The years to ${BASE_YEAR} are the UN's estimates; the
 * years after are its projections.
 *
 * A city here is what the UN's Degree of Urbanization method draws: contiguous
 * 1 km² cells of at least 1,500 people each, holding 50,000 people or more. It
 * is not the administrative city and not the metropolitan area, so a figure
 * here will differ from the one a city government reports. The population
 * within the city's own boundary is given beside it where Wikidata's
 * first-ranked statement cites a reference (${admin} of the ${cities.length} cities).
 */
export const CITY_FIGURES_SOURCE = {
  label: "United Nations — World Urbanization Prospects: The 2025 Revision",
  url: "${WUP}",
  file: "${WUP_FILE}",
  retrieved: "${today}",
  /** The first year of the series. */
  firstYear: ${firstYear},
  /** The last year of the UN's estimates; later years are its projections. */
  baseYear: ${BASE_YEAR},
  lastYear: ${lastYear},
  /** How many cities the UN counts in the base year: the field each city's rank is taken in. */
  cities: ${basePops.length},
};

export const CITY_ADMIN_SOURCE = {
  label: "Wikidata — the population statement it ranks first for each city",
  url: "https://www.wikidata.org/",
  retrieved: "${today}",
};

export type CityFigures = {
  /** The city's name as the UN gives it. */
  un: string;
  /** The UN's code for the city, within its country. */
  code: number;
  /** Whether the country designates it a capital. */
  capital: boolean;
  /** The UN's rating of the population figure, from the age and resolution of the census data under it. */
  plausibility: "Low" | "Moderate" | "High";
  /** Its place among the UN's cities by population in the base year. */
  rank: number;
  /** Within the city's own boundary, as Wikidata's first-ranked statement has it. */
  admin?: { population: number; year: number; item: string };
  /** People, at mid-year; a figure a year from firstYear, null where the UN gives none. */
  pop: (number | null)[];
  /** Land area, km². */
  area: (number | null)[];
  /** Built-up area, km². */
  built: (number | null)[];
  /** People per km² of land. */
  density: (number | null)[];
  /** Built-up area per person, m². */
  builtPer: (number | null)[];
  /** The city's share of the people living in its country's cities, per cent. */
  share: (number | null)[];
};

/** City id → its figures. */
export const CITY_FIGURES: Record<string, CityFigures> = {
${cities.map((c) => `  ${JSON.stringify(c.id)}: ${row(out[c.id])},`).join("\n")}
};
`;
  fs.writeFileSync(OUT, ts);
  const at = years.indexOf(BASE_YEAR);
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${cities.length} cities, ${firstYear}-${lastYear}, ranked among ${basePops.length}; ${admin} with a boundary population`);
  for (const c of cities) {
    const v = out[c.id];
    const gaps = ["pop", "area", "built", "density", "builtPer", "share"].map((k) => [k, v[k].filter((x) => x === null).length]).filter(([, n]) => n);
    if (gaps.length) console.log(`    ${c.name}: years without a figure - ${gaps.map(([k, n]) => `${k} ${n}`).join(", ")}; population from ${years[v.pop.findIndex((x) => x !== null)]}`);
    console.log(`  ${c.name.padEnd(24)} ${v.un.padEnd(34)} ${String(v.pop[at]).padStart(9)}  ${String(v.area[at]).padStart(7)} km²  ${String(v.share[at]).padStart(6)}%  #${v.rank}  ${v.plausibility}${v.admin ? `  admin ${v.admin.population} (${v.admin.year})` : ""}`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
