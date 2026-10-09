/**
 * Builds static/cities/<country>.json — every city the United Nations counts,
 * year by year: its population, its land area and the land that is built on,
 * for every fifth year from 1975 to 2050. A city's window on the Cities page
 * fetches its country's file when it opens.
 *
 *   node build-un-city-series.cjs
 *
 * Source: United Nations, World Urbanization Prospects: The 2025 Revision -
 * the file build-un-cities.cjs reads (cached in the system's temp folder,
 * shared with it). The UN's file has a row for every year, but its figures
 * are set at every fifth year and the years between are a straight line
 * from one to the next; so the fifth years are what is kept, and that the
 * years between are a straight line is checked here before anything is
 * written. Years to 2025 are the UN's estimates; later ones its projections.
 *
 * Each figure is as the UN gives it, rounded: people to the whole person (the
 * file is in thousands), land area to a tenth of a km², built-up land to a
 * hundredth. With each year's population goes the UN's own rating of how
 * plausible the figure is - High, Moderate or Low - as it stands in the file.
 * Nothing is worked out here. Only the cities with a 2025 population are
 * written: the ones the Cities page lists.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "static/cities");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-city-figures");
fs.mkdirSync(CACHE, { recursive: true });
const WUP_FILE = "https://population.un.org/wup/assets/Download/Cities/WUP2025-DB-DEGURBA-Cities-Population-Surface-Data.csv.gz";
const YEARS = Array.from({ length: 16 }, (_, i) => 1975 + 5 * i);
const BASE_YEAR = 2025;
const RATING = { Low: 0, Moderate: 1, High: 2 };

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
  /** country:code → year → [people in thousands, land km², built-up km², rating] */
  const byCity = new Map();
  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
    rl.on("line", (line) => {
      if (!header) {
        header = splitCsvLine(line.replace(/^﻿/, ""));
        header.forEach((h, i) => (col[h] = i));
        for (const need of ["ISO2_Code", "City_Code", "Year", "Pop", "AREA_km2", "BU_km2", "Pop_plausibility"]) if (!(need in col)) throw new Error(`the UN's file no longer has a column ${need}`);
        return;
      }
      if (!line) return;
      const f = splitCsvLine(line);
      const key = `${f[col.ISO2_Code]}:${f[col.City_Code]}`;
      if (!byCity.has(key)) byCity.set(key, new Map());
      const n = (name) => (f[col[name]] !== "" && Number.isFinite(+f[col[name]]) ? +f[col[name]] : null);
      byCity.get(key).set(+f[col.Year], [n("Pop"), n("AREA_km2"), n("BU_km2"), f[col.Pop_plausibility]]);
    });
    rl.on("close", resolve);
    rl.on("error", reject);
  });

  // The years between the fifth years are a straight line from one to the next: checked on every city, since the fifth years are kept on that ground.
  let spans = 0;
  let straight = 0;
  for (const rows of byCity.values())
    for (let i = 0; i + 1 < YEARS.length; i++) {
      const a = rows.get(YEARS[i])?.[0];
      const b = rows.get(YEARS[i + 1])?.[0];
      if (a == null || b == null) continue;
      for (let k = 1; k < 5; k++) {
        const mid = rows.get(YEARS[i] + k)?.[0];
        if (mid == null) continue;
        spans++;
        if (Math.abs(mid - (a + ((b - a) * k) / 5)) <= 0.002 + 1e-6 * Math.abs(b)) straight++;
      }
    }
  console.log(`years between the fifth years: ${straight} of ${spans} lie on the straight line between them`);
  if (spans === 0 || straight / spans < 0.999) throw new Error("the years between the fifth years are no longer a straight line: the fifth years alone would lose something");

  const ratings = new Map();
  const byCountry = new Map();
  let cities = 0;
  for (const [key, rows] of byCity) {
    const [cc, code] = key.split(":");
    const now = rows.get(BASE_YEAR);
    if (!/^[A-Z]{2}$/.test(cc) || !now || !now[0] || Math.round(now[0] * 1000) <= 0) continue;
    const at = (i, dp, times = 1) => YEARS.map((y) => (rows.get(y)?.[i] == null ? null : Number((rows.get(y)[i] * times).toFixed(dp))));
    for (const y of YEARS) if (rows.get(y)) ratings.set(rows.get(y)[3], (ratings.get(rows.get(y)[3]) ?? 0) + 1);
    if (!byCountry.has(cc)) byCountry.set(cc, {});
    byCountry.get(cc)[code] = { p: at(0, 0, 1000), a: at(1, 1), b: at(2, 2), q: YEARS.map((y) => (rows.get(y) ? (RATING[rows.get(y)[3]] ?? null) : null)) };
    cities++;
  }
  console.log("the ratings of the kept years:", JSON.stringify([...ratings]));
  if ([...ratings.keys()].some((k) => !(k in RATING))) throw new Error("the UN's plausibility column holds a value other than Low, Moderate and High");
  if (cities < 10000) throw new Error("the UN counts over 12,000 cities");

  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  let biggest = { cc: "", kb: 0 };
  for (const [cc, list] of byCountry) {
    const json = JSON.stringify({ years: YEARS, base: BASE_YEAR, cities: list });
    fs.writeFileSync(path.join(OUT, `${cc}.json`), json);
    total += json.length;
    if (json.length / 1024 > biggest.kb) biggest = { cc, kb: json.length / 1024 };
  }
  console.log(`wrote ${byCountry.size} countries, ${cities} cities, ${(total / 1048576).toFixed(1)} MB; largest ${biggest.cc} at ${biggest.kb.toFixed(0)} KB`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
