#!/usr/bin/env node
/**
 * Builds static/housing/ and src/data/housingMeta.ts - what homes rent and sell for, as asked: rents and house prices for
 * each US state and county.
 *
 *   US Department of Housing and Urban Development, Fair Market Rents, fiscal year 2026 (public domain), from HUD's open
 *   data service: for each of its rent areas, the rent with essential utilities a home of each size typically rents for,
 *   which HUD sets at the 40th percentile of recent movers' rents. A county's area is the one HUD draws around the point at
 *   its centre - in New England, where HUD draws its areas by town, a county may lie partly in another, and the window says so.
 *   The year is HUD's FY2026, checked against HUD's published FY2026 figures; the service does not name it.
 *   Federal Housing Finance Agency, House Price Index (public domain): each state's index of the prices of homes bought
 *   with mortgages it tracks (purchase-only, seasonally adjusted), and each metropolitan area's (all transactions), each
 *   quarter.
 *   US Census Bureau, core-based statistical area delineations (2023): which metropolitan area and division each county is in.
 *
 * Every figure is the body's own; a change over a year or five is worked out in the window, and said to be.
 *
 *   node build-housing.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "static/housing");
const META = path.join(__dirname, "src/data/housingMeta.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-housing");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const FMR_YEAR = 2026;
function get(url, name, hours = 20) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > hours * 3600e3) execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "300", "-A", UA, "-o", file, url]);
  return file;
}
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

// ── HUD Fair Market Rents, with each area's outline ──
const FMR_LAYER = "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Fair_Market_Rents/FeatureServer/0/query";
const fmr = [];
for (let off = 0; ; off += 1000) {
  const page = JSON.parse(fs.readFileSync(get(`${FMR_LAYER}?where=1%3D1&outFields=FMR_CODE,FMR_AREANAME,FMR_0BDR,FMR_1BDR,FMR_2BDR,FMR_3BDR,FMR_4BDR&returnGeometry=true&maxAllowableOffset=0.005&outSR=4326&orderByFields=OBJECTID&resultOffset=${off}&resultRecordCount=1000&f=json`, `fmr-${off}.json`), "utf8"));
  if (page.error) throw new Error(`HUD: ${JSON.stringify(page.error)}`);
  fmr.push(...page.features);
  if (page.features.length < 1000) break;
}
const count = JSON.parse(fs.readFileSync(get(`${FMR_LAYER}?where=1%3D1&returnCountOnly=true&f=json`, "fmr-count.json"), "utf8")).count;
if (fmr.length !== count) throw new Error(`HUD: read ${fmr.length} areas of ${count}`);
// The check of the year: El Paso's FY2026 rents, as HUD published them.
const ep = fmr.find((f) => f.attributes.FMR_CODE === "METRO21340M21340")?.attributes;
if (!ep || [ep.FMR_0BDR, ep.FMR_1BDR, ep.FMR_2BDR, ep.FMR_3BDR, ep.FMR_4BDR].join() !== "821,1013,1191,1633,1998") throw new Error(`HUD: the service no longer holds FY${FMR_YEAR}'s rents (El Paso ${JSON.stringify(ep)}) - check the year and change FMR_YEAR`);

/** Whether a point lies inside an outline's rings, by the even-odd rule: holes and all, whichever way each ring runs. */
function inside([x, y], rings) {
  let inOut = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inOut = !inOut;
    }
  return inOut;
}
const boxes = fmr.map((f) => {
  const pts = (f.geometry?.rings ?? []).flat();
  return pts.length ? [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))] : null;
});

// ── The counties, at the points the Census Bureau sets inside each ──
const COUNTIES = [...read("src/data/usCounties.ts").matchAll(/^\s*\["(\d{5})","((?:[^"\\]|\\.)*)","([A-Z]{2})",(-?[\d.]+|null),(-?[\d.]+|null),/gm)].map((m) => ({ fips: m[1], name: m[2], state: m[3], lat: +m[4], lon: +m[5] }));
const NEW_ENGLAND = new Set(["CT", "ME", "MA", "NH", "RI", "VT"]);
// The towns GeoNames lists, largest first, by the county (its district) and state they are in.
const US_PLACES = JSON.parse(read("static/places/US.json"));
const STATE_NAME = new Map([...read("src/data/statesData.ts").matchAll(/name:\s*"([^"]+)",\s*abbreviation:\s*"([A-Z]{2})"/g)].map((m) => [m[2], m[1]]));
/** A county's largest listed town, [longitude, latitude]: the one GeoNames files under a district of the county's name in its state. */
const townOf = (c) => {
  const r = US_PLACES.regions.indexOf(STATE_NAME.get(c.state) ?? "");
  // GeoNames names some counties its own way: "Saint" for "St.", "City and County of San Francisco".
  const names = [c.name, c.name.replace(/^St\. /, "Saint "), `City and County of ${c.name.replace(/ County$/, "")}`];
  const ds = names.map((n) => US_PLACES.districts.indexOf(n)).filter((d) => d >= 0);
  const p = US_PLACES.places.find((x) => x[4] === r && ds.includes(x[7]));
  return p ? [p[2], p[1]] : null;
};

// ── Census delineations: each county's metropolitan area and division ──
const delin = (() => {
  const file = get("https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/2023/delineation-files/list1_2023.xlsx", "list1_2023.xlsx", 24 * 30);
  const rows = readXlsx(file, readXlsx(file).sheets[0]).rows;
  const h = rows.findIndex((r) => r.includes("CBSA Code"));
  const head = rows[h];
  const at = (n) => head.indexOf(n);
  const out = new Map();
  for (const r of rows.slice(h + 1)) {
    if (!r[at("FIPS State Code")]) continue;
    if (!/Metropolitan/.test(r[at("Metropolitan/Micropolitan Statistical Area")])) continue;
    out.set(`${r[at("FIPS State Code")].padStart(2, "0")}${r[at("FIPS County Code")].padStart(3, "0")}`, { cbsa: r[at("CBSA Code")], division: r[at("Metropolitan Division Code")] || null });
  }
  return out;
})();

// ── FHFA House Price Index ──
const po = fs.readFileSync(get("https://www.fhfa.gov/hpi/download/quarterly_datasets/hpi_po_state.txt", "hpi_po_state.txt"), "utf8").trim().split(/\r?\n/);
const STATES = {};
for (const line of po.slice(1)) {
  const [st, yr, qtr, , sa] = line.split("\t");
  if (+yr < 2000 || !sa || !Number.isFinite(+sa)) continue;
  (STATES[st] ??= []).push([+yr, +qtr, +(+sa).toFixed(2)]);
}
if (Object.keys(STATES).length < 51) throw new Error(`FHFA states: ${Object.keys(STATES).length}`);
// The nation's, from FHFA's file of the nation and its census divisions: kept as US.
for (const line of fs.readFileSync(get("https://www.fhfa.gov/hpi/download/quarterly_datasets/hpi_po_us_and_census.txt", "hpi_po_us.txt"), "utf8").trim().split(/\r?\n/).slice(1)) {
  const [div, yr, qtr, , sa] = line.split("\t");
  if (div === "USA" && +yr >= 2000 && Number.isFinite(+sa)) (STATES.US ??= []).push([+yr, +qtr, +(+sa).toFixed(2)]);
}
if (!STATES.US) throw new Error("FHFA: no national index");
const lastQ = STATES.US?.at(-1) ?? STATES.CA.at(-1);
const metro = fs.readFileSync(get("https://www.fhfa.gov/hpi/download/quarterly_datasets/hpi_at_metro.csv", "hpi_at_metro.csv"), "utf8").trim().split(/\r?\n/);
const METROS = {};
for (const line of metro) {
  const m = line.match(/^"([^"]+)",(\d{5}),(\d{4}),(\d),([^,]*),/);
  if (!m || +m[3] < 2000) continue;
  const v = Number(m[5]);
  if (!Number.isFinite(v) || m[5].trim() === "-") continue;
  (METROS[m[2]] ??= [m[1], []])[1].push([+m[3], +m[4], v]);
}

// ── Each county: its rent area, and its metropolitan area's house prices ──
const COUNTY = {};
let unplaced = 0;
const misses = [];
for (const c of COUNTIES) {
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
  const areaAt = (p) => fmr.findIndex((f, k) => boxes[k] && p[0] >= boxes[k][0] && p[0] <= boxes[k][2] && p[1] >= boxes[k][1] && p[1] <= boxes[k][3] && inside(p, f.geometry.rings));
  let i = areaAt([c.lon, c.lat]);
  // A county whose centre point is out in the water (San Francisco's, with the Farallon Islands): the area of its largest town.
  if (i < 0) {
    const town = townOf(c);
    if (town) i = areaAt(town);
  }
  const d = delin.get(c.fips);
  const hpi = d ? (d.division && METROS[d.division] ? d.division : METROS[d.cbsa] ? d.cbsa : null) : null;
  if (i < 0) {
    unplaced++;
    if (misses.length < 15) misses.push(`${c.fips} ${c.name}, ${c.state}`);
  }
  if (i >= 0 || hpi) COUNTY[c.fips] = [i >= 0 ? fmr[i].attributes.FMR_CODE : null, hpi, NEW_ENGLAND.has(c.state) ? 1 : 0];
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "metro"), { recursive: true });
fs.writeFileSync(path.join(OUT, "fmr.json"), JSON.stringify({ areas: Object.fromEntries(fmr.map((f) => [f.attributes.FMR_CODE, [f.attributes.FMR_AREANAME, f.attributes.FMR_0BDR, f.attributes.FMR_1BDR, f.attributes.FMR_2BDR, f.attributes.FMR_3BDR, f.attributes.FMR_4BDR]])), counties: COUNTY }));
fs.writeFileSync(path.join(OUT, "hpi-states.json"), JSON.stringify(STATES));
for (const [code, m] of Object.entries(METROS)) fs.writeFileSync(path.join(OUT, "metro", `${code}.json`), JSON.stringify(m));
fs.writeFileSync(
  META,
  `/**
 * What homes rent and sell for: HUD's Fair Market Rents for fiscal year ${FMR_YEAR} (${fmr.length} rent areas; each of ${Object.values(COUNTY).filter((c) => c[0]).length} counties in one), and FHFA's
 * House Price Index to ${lastQ[0]} Q${lastQ[1]}, for each state and ${Object.keys(METROS).length} metropolitan areas and divisions. The figures are in static/housing/,
 * fetched when a window shows them.
 *
 * GENERATED by build-housing.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const HOUSING_SOURCES = {
  fmr: [
    { label: "US Department of Housing and Urban Development — Fair Market Rents, FY${FMR_YEAR} (HUD open data)", url: "https://hudgis-hud.opendata.arcgis.com/datasets/HUD::fair-market-rents" },
    { label: "HUD User — Fair Market Rents: what they are and how they are set", url: "https://www.huduser.gov/portal/datasets/fmr.html" },
  ],
  hpi: [
    { label: "Federal Housing Finance Agency — House Price Index datasets (states purchase-only, metro areas all-transactions)", url: "https://www.fhfa.gov/data/hpi/datasets" },
    { label: "US Census Bureau — core-based statistical area delineation files (July 2023)", url: "https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html" },
  ],
};
export const FMR_YEAR = ${FMR_YEAR};
export const HPI_LATEST = { year: ${lastQ[0]}, quarter: ${lastQ[1]} };
/** fmr.json: each rent area by HUD's code, [its name, the rent of a home with 0, 1, 2, 3 and 4 bedrooms]; each county by FIPS code, [its rent area, its metro area's or division's FHFA code (null outside one), 1 if in New England]. */
export type FmrFile = { areas: Record<string, [name: string, r0: number, r1: number, r2: number, r3: number, r4: number]>; counties: Record<string, [fmr: string | null, hpi: string | null, newEngland: 0 | 1]> };
/** A state's index each quarter from 2000, [year, quarter, index] (1991 Q1 = 100), in hpi-states.json by postal code; a metro area's [name, the same] in metro/{code}.json (1995 Q1 = 100). */
export type HpiPoint = [year: number, quarter: number, index: number];
`,
);
console.log(`wrote static/housing: ${fmr.length} rent areas, ${Object.keys(COUNTY).length} counties (${unplaced} in no rent area${misses.length ? `: ${misses.join("; ")}` : ""}), FHFA ${Object.keys(STATES).length} states to ${lastQ[0]} Q${lastQ[1]} and ${Object.keys(METROS).length} metro areas`);
