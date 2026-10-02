#!/usr/bin/env node
/**
 * build-region-series.cjs
 *
 * The world's figures by region, year by year, for the charts the Worldview
 * and Trends pages draw for each of their categories. Written to
 * src/data/regionSeries.ts.
 *
 * Run it after build-worldview.cjs: it reads the world series that script
 * wrote (src/data/worldview.ts) to learn which World Bank series each figure
 * is, and how many decimal places its source supports.
 *
 * SOURCE
 *   World Bank, World Development Indicators (api.worldbank.org)
 *     For each figure the Bank publishes for the world it also publishes
 *     one for each of its seven regions - East Asia & Pacific, Europe &
 *     Central Asia, Latin America & Caribbean, Middle East, North Africa,
 *     Afghanistan & Pakistan, North America, South Asia, Sub-Saharan Africa.
 *     The regional figures are the Bank's own aggregates, not sums or
 *     averages made here.
 *
 * Nothing is worked out: a region's year with no published figure is left
 * out of its line, and a figure with fewer than five regions reporting ten
 * years each is left out of the file altogether.
 *
 * Usage:  node build-region-series.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/regionSeries.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-worldview");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const FROM = 1990;

function get(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    let failure = "";
    for (let attempt = 1; attempt <= 3 && !fs.existsSync(at); attempt++) {
      try {
        execFileSync("curl", ["-sSfL", "-m", "180", "-A", UA, "-H", "Accept-Language: en", "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        fs.rmSync(at, { force: true });
        failure = String(e.stderr || e.message).trim().split("\n")[0];
        execSync(process.platform === "win32" ? "ping -n 16 127.0.0.1 > NUL" : "sleep 15");
      }
    }
    if (!fs.existsSync(at)) throw new Error(`${url}: ${failure}`);
  }
  return fs.readFileSync(at, "utf8");
}

const WORLDVIEW = fs.readFileSync(path.join(__dirname, "src/data/worldview.ts"), "utf8");
function world(id) {
  const m = new RegExp(`^  "${id}": (\\{.*\\}),?$`, "m").exec(WORLDVIEW);
  if (!m) throw new Error(`worldview.ts has no "${id}"`);
  return JSON.parse(m[1]);
}

/** The Bank's regions, in the order the charts colour them. */
const REGIONS = [
  ["EAS", "East Asia and Pacific"],
  ["ECS", "Europe and Central Asia"],
  ["LCN", "Latin America and Caribbean"],
  ["MEA", "Middle East, North Africa, Afghanistan and Pakistan"],
  ["NAC", "North America"],
  ["SAS", "South Asia"],
  ["SSF", "Sub-Saharan Africa"],
];

/** The figures charted by region: each is a World Bank series in worldview.ts. */
const IDS = [
  // Society
  "lifeExpectancy", "childMortality", "fertility", "urban", "aged65",
  // Economy
  "gdp", "extremePoverty", "unemployment", "trade",
  // Development
  "gdpPerCapitaPpp", "vulnerableWork",
  // Industry
  "manufacturingVA", "servicesVA", "resourceRents", "highTechExports",
  // Energy
  "electricity", "renewables",
  // Technology and research
  "internet", "broadband", "mobile", "research", "sciArticles", "patents",
  // Politics and governance
  "womenParliament", "taxRevenue",
  // Security
  "militaryGdp", "homicide",
  // Ecology
  "forest", "co2", "co2PerPerson",
];

function main() {
  const out = {};
  const left = [];
  for (const id of IDS) {
    const ind = world(id);
    const code = /indicator\/([A-Z0-9.]+)/.exec(ind.source.url)?.[1];
    if (!code) throw new Error(`${id}: not a World Bank series`);
    const j = JSON.parse(get(`https://api.worldbank.org/v2/country/${REGIONS.map((r) => r[0]).join(";")}/indicator/${code}?format=json&per_page=2000&date=${FROM}:${new Date().getFullYear()}`, `wb-regions-${code}-${TODAY}.json`));
    if (!Array.isArray(j) || !j[1]) throw new Error(`World Bank ${code}: no regional data`);
    if (j[0].pages > 1) throw new Error(`World Bank ${code}: more than one page`);
    // Money and counts are whole; rates keep the decimals their source supports.
    const dp = ind.format === "usd" || ind.format === "count" ? 0 : ind.dp;
    const lastYear = ind.series[ind.series.length - 1][0];
    const regions = REGIONS.map(([iso, name]) => ({
      code: iso,
      name,
      series: j[1]
        .filter((r) => r.countryiso3code === iso && r.value !== null && Number.isFinite(r.value) && Number(r.date) <= lastYear)
        .map((r) => [Number(r.date), Number(r.value.toFixed(dp))])
        .sort((a, b) => a[0] - b[0]),
    })).filter((r) => r.series.length >= 10);
    if (regions.length < 5) {
      left.push(`${id} (${regions.length} regions with ten years)`);
      continue;
    }
    out[id] = { regions, source: { label: "World Bank — World Development Indicators", url: `https://data.worldbank.org/indicator/${code}` } };
    const ends = regions.map((r) => r.series[r.series.length - 1][0]);
    console.log(`${id.padEnd(18)} ${regions.length} regions, ${Math.min(...regions.map((r) => r.series[0][0]))}–${Math.max(...ends)}${Math.min(...ends) < Math.max(...ends) ? ` (some end ${Math.min(...ends)})` : ""}`);
  }
  if (left.length) console.log(`Left out: ${left.join("; ")}`);
  if (Object.keys(out).length < 20) throw new Error(`Only ${Object.keys(out).length} figures have regional series`);

  fs.writeFileSync(
    OUT,
    `/**
 * The world's figures by region, year by year: the World Bank's own regional
 * aggregates for figures the Worldview and Trends pages chart.
 *
 * GENERATED by build-region-series.cjs on ${TODAY} — do not edit by hand; change
 * the script and re-run it.
 *
 * Keyed by the figure's id in worldview.ts, which has its unit and format. A
 * year a region has no published figure for is not in its series.
 */
export const REGION_SERIES_RETRIEVED = "${TODAY}";

export interface RegionLine {
  /** The World Bank's code for the region. */
  code: string;
  name: string;
  series: [year: number, value: number][];
}

export interface RegionSeries {
  regions: RegionLine[];
  source: { label: string; url: string };
}

export const REGION_SERIES: Record<string, RegionSeries> = {
${Object.entries(out)
  .map(([id, d]) => `  ${JSON.stringify(id)}: ${JSON.stringify(d)},`)
  .join("\n")}
};
`,
  );
  console.log(`\nWrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} figures.`);
}

main();
