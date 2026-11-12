#!/usr/bin/env node
/**
 * Builds static/us/bea/<state FIPS>.json - the income and output of every US county, its state and the nation, as asked: the
 * Bureau of Economic Analysis's regional accounts (public domain, a work of the US Government).
 *
 *   CAINC1  County and metropolitan area personal income summary: personal income, population, per capita personal income.
 *           https://apps.bea.gov/regional/zip/CAINC1.zip
 *   CAGDP1  County and metropolitan area GDP summary: real GDP (chained 2017 dollars) and current-dollar GDP.
 *           https://apps.bea.gov/regional/zip/CAGDP1.zip
 *
 * The bulk files BEA publishes for anyone to download, no key: fetched to data-raw/bea/ (kept out of the repository) and
 * read as they are. A county is kept by its five-digit FIPS code; where BEA gives one figure for a Virginia county and the
 * independent cities inside it together, it is under BEA's own code for the pair, which no county of the site has, and so is
 * left out - never split. "(NA)", "(D)" (withheld to keep a business's figures private) and the like are left as gaps.
 *
 *   node build-county-bea.cjs
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const RAW = path.join(__dirname, "data-raw/bea");
const OUT_DIR = path.join(__dirname, "static/us/bea");
fs.mkdirSync(RAW, { recursive: true });

/** A BEA bulk file's main CSV: downloaded once, unpacked, and the one CSV covering all areas read. */
function table(name) {
  const zip = path.join(RAW, `${name}.zip`);
  if (!fs.existsSync(zip)) execFileSync("curl", ["-sL", "--fail", "--max-time", "300", "-A", UA, "-o", zip, `https://apps.bea.gov/regional/zip/${name}.zip`]);
  const dir = path.join(RAW, name);
  if (!fs.existsSync(dir)) execFileSync("unzip", ["-o", "-q", zip, "-d", dir]);
  const file = fs.readdirSync(dir).find((f) => new RegExp(`^${name}__ALL_AREAS_\\d{4}_\\d{4}\\.csv$`).test(f));
  if (!file) throw new Error(`${name}: no ALL_AREAS file in ${dir}`);
  return fs.readFileSync(path.join(dir, file), "latin1");
}

/** A CSV's rows, quotes and all. */
function parseCsv(text) {
  const rows = [];
  let row = [],
    cell = "",
    q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") row.push(cell), (cell = "");
    else if (c === "\n") row.push(cell), rows.push(row), (row = []), (cell = "");
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
}

/** Each area's series for each line of a table: { fips: { line: [values by year] } }, and the table's years. */
function read(name, lines) {
  const rows = parseCsv(table(name));
  const head = rows[0].map((h) => h.trim());
  const yearCols = head.map((h, i) => (/^\d{4}$/.test(h) ? i : -1)).filter((i) => i >= 0);
  const years = yearCols.map((i) => +head[i]);
  const at = (h) => head.indexOf(h);
  const [cF, cL, cU, cD] = [at("GeoFIPS"), at("LineCode"), at("Unit"), at("Description")];
  const out = {};
  const units = {};
  for (const r of rows.slice(1)) {
    const fips = (r[cF] ?? "").replace(/[^0-9]/g, "");
    const line = +(r[cL] ?? "").trim();
    if (fips.length !== 5 || !lines.includes(line)) continue;
    units[line] = `${(r[cD] ?? "").trim()} (${(r[cU] ?? "").trim()})`;
    const vals = yearCols.map((i) => {
      const v = (r[i] ?? "").trim();
      return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null;
    });
    (out[fips] ??= {})[line] = vals;
  }
  return { years, out, units };
}

const income = read("CAINC1", [1, 2, 3]);
const gdp = read("CAGDP1", [1, 3]);
console.log("CAINC1 lines:", JSON.stringify(income.units), income.years[0], "to", income.years.at(-1));
console.log("CAGDP1 lines:", JSON.stringify(gdp.units), gdp.years[0], "to", gdp.years.at(-1));
if (!/per capita personal income/i.test(income.units[3] ?? "") || !/^personal income/i.test(income.units[1] ?? "")) throw new Error("CAINC1: its lines are not as expected");
if (!/real gdp/i.test(gdp.units[1] ?? "") || !/current-dollar gdp/i.test(gdp.units[3] ?? "")) throw new Error("CAGDP1: its lines are not as expected");

// Per capita personal income from the year GDP begins, so the two run side by side; personal income and population for the latest year.
const from = income.years.indexOf(gdp.years[0]);
const pick = (a) => (a ? a.slice(from) : undefined);
const latest = (a) => (a ? a[a.length - 1] : null);
const areas = {};
let both = 0;
for (const fips of new Set([...Object.keys(income.out), ...Object.keys(gdp.out)])) {
  const i = income.out[fips];
  const g = gdp.out[fips];
  const pc = pick(i?.[3]);
  const row = {
    ...(pc && pc.some((v) => v !== null) ? { pc } : {}),
    ...(latest(i?.[1]) !== null && latest(i?.[1]) !== undefined ? { pi: latest(i[1]) } : {}),
    ...(g?.[1]?.some((v) => v !== null) ? { real: g[1] } : {}),
    ...(latest(g?.[3]) !== null && latest(g?.[3]) !== undefined ? { gdp: latest(g[3]) } : {}),
  };
  if (Object.keys(row).length) areas[fips] = row;
  if (row.pc && row.real) both++;
}
// The site's counties, to say how many are held.
const site = new Set([...fs.readFileSync(path.join(__dirname, "src/data/usCounties.ts"), "utf8").matchAll(/^\s*\["(\d{5})"/gm)].map((m) => m[1]));
const held = [...site].filter((f) => areas[f]);
// One file a state - its counties, the state and the nation - fetched when one of its counties' windows opens.
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
const states = [...new Set(Object.keys(areas).map((f) => f.slice(0, 2)))].filter((s) => s !== "00" && +s < 60);
let biggest = 0;
for (const st of states) {
  const mine = Object.fromEntries(Object.entries(areas).filter(([f]) => f.startsWith(st) || f === "00000"));
  const file = path.join(OUT_DIR, `${st}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify({
      sources: {
        income: { label: "Bureau of Economic Analysis — CAINC1, county personal income summary (public domain)", url: "https://apps.bea.gov/regional/downloadzip.htm" },
        gdp: { label: "Bureau of Economic Analysis — CAGDP1, county GDP summary (public domain)", url: "https://apps.bea.gov/regional/downloadzip.htm" },
      },
      years: gdp.years,
      incomeYear: income.years.at(-1),
      gdpYear: gdp.years.at(-1),
      areas: mine,
    }),
  );
  biggest = Math.max(biggest, fs.statSync(file).size);
}
const missing = [...site].filter((f) => !areas[f]);
console.log(`BEA: ${Object.keys(areas).length} areas (${both} with both series); ${held.length} of the site's ${site.size} counties held; not held: ${missing.length} e.g. ${missing.slice(0, 15).join(", ")}`);
console.log(`Wrote ${states.length} files to ${OUT_DIR}, the largest ${(biggest / 1024).toFixed(0)} KB`);
