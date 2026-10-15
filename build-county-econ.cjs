/**
 * Builds src/data/usCountyEcon.ts - how the people of every US county work
 * and live: the US Department of Agriculture's Economic Research Service
 * county-level data sets, for every county, every state and the nation.
 *
 *   Source   USDA ERS, County-level Data Sets (public domain): unemployment
 *            (the BLS's Local Area Unemployment Statistics), 2000 to the
 *            latest year; poverty and median household income (the Census
 *            Bureau's Small Area Income and Poverty Estimates); educational
 *            attainment of adults 25 and over (the Census Bureau's American
 *            Community Survey, 5-year); and the rural-urban continuum code.
 *
 *   node build-county-econ.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/usCountyEcon.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-ers");
fs.mkdirSync(CACHE, { recursive: true });
const BASE = "https://www.ers.usda.gov";
const PAGE = `${BASE}/data-products/county-level-data-sets/county-level-data-sets-download-data`;
const get = (url, name) => {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) execFileSync("curl", ["-sL", "--fail", "-A", "Mozilla/5.0 commonsphere-data-build/1.0", "-o", at, url], { stdio: "ignore" });
  return fs.readFileSync(at, "utf8");
};

/** A CSV's rows, quotes and all. */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") row.push(cell), (cell = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell), rows.push(row), (row = []), (cell = "");
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
}
/** FIPS code → attribute → value. */
function longFile(csv) {
  const out = {};
  for (const r of parseCsv(csv).slice(1)) {
    if (r.length < 5) continue;
    const fips = r[0].padStart(5, "0");
    (out[fips] ||= {})[r[3]] = Number(r[4]);
  }
  return out;
}

(async () => {
  const page = get(PAGE, "page.html");
  const link = (re) => {
    const m = page.match(new RegExp(`href="(/media/[^"]*${re}[^"]*\\.csv[^"]*)"`, "i"));
    if (!m) throw new Error(`no download for ${re} on the ERS page`);
    return BASE + m[1].replace(/&amp;/g, "&");
  };
  const unemp = longFile(get(link("unemployment-and-median-household-income"), "unemployment.csv"));
  const pov = longFile(get(link("poverty-estimates"), "poverty.csv"));
  const edu = longFile(get(link("educational-attainment"), "education.csv"));

  // The years the unemployment file runs over, and the latest each of the others gives.
  const years = [...new Set(Object.keys(unemp["00000"] || {}).flatMap((k) => (k.match(/^Unemployment_rate_(\d{4})$/) || []).slice(1)))].map(Number).sort();
  const lastU = years[years.length - 1];
  const povYear = Math.max(...Object.keys(pov["00000"] || {}).flatMap((k) => (k.match(/^PCTPOVALL_(\d{4})$/) || []).slice(1)).map(Number));
  // The latest five-year span the education file gives.
  const eduSpan = Object.keys(edu["00000"] || {})
    .flatMap((k) => (/^Percent of adults with a bachelor's degree or higher, (\d{4}-\d{2})$/i.exec(k) || []).slice(1))
    .sort()
    .pop();
  if (!lastU || !povYear || !eduSpan) throw new Error(`years not found: ${lastU} ${povYear} ${eduSpan}`);
  const pick = (o, k) => (o && Number.isFinite(o[k]) ? o[k] : null);
  const row = (f) => {
    const u = unemp[f], p = pov[f], e = edu[f];
    return {
      // Unemployment, % of the labour force, each year from the first.
      u: years.map((y) => pick(u, `Unemployment_rate_${y}`)),
      lf: pick(u, `Civilian_labor_force_${lastU}`),
      inc: pick(p, `MEDHHINC_${povYear}`),
      pov: pick(p, `PCTPOVALL_${povYear}`),
      child: pick(p, `PCTPOV017_${povYear}`),
      // Adults 25 and over by their highest schooling, %: none, high school, some college, a degree.
      edu: [
        pick(e, `Percent of adults who are not high school graduates, ${eduSpan}`),
        pick(e, `Percent of adults who are high school graduates (or equivalent), ${eduSpan}`),
        pick(e, `Percent of adults completing some college or associate degree, ${eduSpan}`),
        pick(e, `Percent of adults with a bachelor's degree or higher, ${eduSpan}`),
      ].map((v) => (v === null ? null : Math.round(v * 10) / 10)),
      rucc: pick(u, "Rural_Urban_Continuum_Code_2023") ?? pick(p, "Rural_Urban_Continuum_Code_2023"),
    };
  };
  const all = new Set([...Object.keys(unemp), ...Object.keys(pov)]);
  const counties = [...all].filter((f) => !f.endsWith("000")).sort();
  const states = [...all].filter((f) => f.endsWith("000") && f !== "00000").sort();
  const us = row("00000");
  // Checks against what is known: the nation's unemployment rate in 2009 was over 9%; Los Angeles County's poverty rate is near 14%.
  const u2009 = us.u[years.indexOf(2009)];
  if (!(u2009 > 9)) throw new Error(`US unemployment 2009 ${u2009}: wrong column?`);
  const la = row("06037");
  if (!(la.pov > 10 && la.pov < 18)) throw new Error(`Los Angeles poverty ${la.pov}: wrong column?`);
  const today = new Date().toISOString().slice(0, 10);
  const lit = (r) => JSON.stringify([r.u, r.lf, r.inc, r.pov, r.child, r.edu, r.rucc]);
  fs.writeFileSync(
    OUT,
    `/**
 * How the people of every US county work and live: the USDA Economic Research
 * Service's county-level data sets.
 *
 * GENERATED by build-county-econ.cjs on ${today} - do not edit by hand; change
 * the script and re-run it.
 *
 * Each row is [unemployment % for each of COUNTY_ECON.years, labour force ${lastU},
 * median household income ${povYear} ($), poverty ${povYear} (% of all people), child poverty
 * ${povYear} (% under 18), the schooling of adults 25 and over ${eduSpan} (% with none, high school,
 * some college, a degree), the 2023 rural-urban continuum code]; null where none is given.
 */
export const COUNTY_ECON_SOURCES = {
  unemployment: { label: "USDA Economic Research Service — county-level data: unemployment (BLS Local Area Unemployment Statistics), ${years[0]}-${lastU}", url: "${PAGE}" },
  poverty: { label: "USDA Economic Research Service — county-level data: poverty and median household income (Census Bureau SAIPE), ${povYear}", url: "${PAGE}" },
  education: { label: "USDA Economic Research Service — county-level data: educational attainment (Census Bureau ACS 5-year), ${eduSpan}", url: "${PAGE}" },
  rucc: { label: "USDA Economic Research Service — Rural-Urban Continuum Codes, 2023", url: "https://www.ers.usda.gov/data-products/rural-urban-continuum-codes" },
};
export const COUNTY_ECON = { years: ${JSON.stringify(years)}, povertyYear: ${povYear}, schooling: "${eduSpan}", laborYear: ${lastU} };
export type CountyEcon = [u: (number | null)[], labourForce: number | null, income: number | null, poverty: number | null, childPoverty: number | null, schooling: (number | null)[], rucc: number | null];
/** What each rural-urban continuum code means, as the ERS describes it. */
export const RUCC: Record<number, string> = {
  1: "Metro: counties in metro areas of 1 million people or more",
  2: "Metro: counties in metro areas of 250,000 to 1 million people",
  3: "Metro: counties in metro areas of fewer than 250,000 people",
  4: "Nonmetro: urban population of 20,000 or more, next to a metro area",
  5: "Nonmetro: urban population of 20,000 or more, not next to a metro area",
  6: "Nonmetro: urban population of 5,000 to 20,000, next to a metro area",
  7: "Nonmetro: urban population of 5,000 to 20,000, not next to a metro area",
  8: "Nonmetro: urban population of fewer than 5,000, next to a metro area",
  9: "Nonmetro: urban population of fewer than 5,000, not next to a metro area",
};
export const NATION_ECON: CountyEcon = ${lit(us)};
/** Each state's, by its two-digit FIPS code. */
export const STATE_ECON: Record<string, CountyEcon> = {${states.map((f) => `"${f.slice(0, 2)}":${lit(row(f))}`).join(",")}};
/** Each county's, by its five-digit FIPS code. */
export const COUNTY_ECON_ROWS: Record<string, CountyEcon> = {
${counties.map((f) => `"${f}":${lit(row(f))}`).join(",\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${counties.length} counties, ${states.length} states; unemployment ${years[0]}-${lastU}, poverty ${povYear}, schooling ${eduSpan}`);
  console.log("LA", lit(la));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
