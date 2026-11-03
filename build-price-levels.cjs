#!/usr/bin/env node
/**
 * Builds src/data/priceLevels.ts and static/prices/metros.json - what things cost in a place against elsewhere, as asked:
 * the cost of living, by the bodies that measure it.
 *
 *   World Bank, International Comparison Program 2021 (published 2024, CC BY 4.0): each country's price level - what the
 *   same goods and services cost there at market exchange rates, the world's average 100 - for all a household consumes
 *   (actual individual consumption) and for food, housing and the rest. 2021 is the ICP's latest benchmark year.
 *   Eurostat, purchasing power parities (prc_ppp_ind; reuse allowed with acknowledgement): the same for the countries of
 *   Europe it covers, the European Union's average 100, to a later year.
 *   US Bureau of Economic Analysis, Regional Price Parities 2024 (released 19 February 2026, public domain): each state's
 *   and each metropolitan area's prices against the nation's 100 - all items, goods, housing rents, utilities and other
 *   services.
 *
 * Every figure is the body's own; none is worked out here.
 *
 *   node build-price-levels.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/priceLevels.ts");
const METROS = path.join(__dirname, "static/prices/metros.json");
const CACHE = path.join(os.tmpdir(), "commonsphere-prices");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(path.dirname(METROS), { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
function get(url, name) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > 20 * 3600e3) execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "300", "-A", UA, "-o", file, url]);
  return file;
}
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const SITE = new Set([...read("src/data/countriesData.ts").matchAll(/\bcode:\s*"([A-Z]{2})"/g)].map((m) => m[1]));
const round1 = (v) => Math.round(v * 10) / 10;

// ── The ICP's categories, and Eurostat's for the same things ──
const PARTS = [
  ["all", "All a household consumes", "9020000", "A01"],
  ["food", "Food and non-alcoholic drinks", "1101000", "A0101"],
  ["housing", "Housing, water, electricity and fuel", "9060000", "A0104"],
  ["transport", "Transport", "1107000", "A0107"],
  ["health", "Health", "9080000", "A0106"],
  ["education", "Education", "9120000", "A0110"],
  ["restaurants", "Restaurants and hotels", "1111000", "A0111"],
  ["clothing", "Clothing and footwear", "1103000", "A0103"],
  ["communication", "Communication", "1108000", "A0108"],
  ["recreation", "Recreation and culture", "9110000", "A0109"],
  ["furnishings", "Furnishings and household goods", "1105000", "A0105"],
  ["alcohol", "Alcohol and tobacco", "1102000", "A0102"],
];

// ── World Bank ICP 2021 ──
const wb = JSON.parse(fs.readFileSync(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"), "utf8"))[1];
const iso2 = new Map(wb.map((c) => [c.id, c.iso2Code]));
iso2.set("XKX", "XK");
iso2.set("TWN", "TW");
const icpUrl = `https://api.worldbank.org/v2/sources/90/country/all/series/${PARTS.map((p) => p[2]).join(";")}/classification/PX.WL/time/YR2021?format=json&per_page=20000`;
const icp = JSON.parse(fs.readFileSync(get(icpUrl, "icp2021-pli.json"), "utf8"));
if (icp.source?.id !== "90") throw new Error("ICP: an unexpected answer");
const ICP = {};
for (const d of icp.source.data) {
  if (d.value === null) continue;
  const v = Object.fromEntries(d.variable.map((x) => [x.concept, x.id]));
  const cc = iso2.get(v.Country);
  if (!cc || !SITE.has(cc)) continue;
  const part = PARTS.findIndex((p) => p[2] === v.Series);
  if (part < 0) continue;
  (ICP[cc] ??= PARTS.map(() => null))[part] = round1(d.value);
}
for (const cc of Object.keys(ICP)) if (ICP[cc][0] === null) delete ICP[cc];
if (Object.keys(ICP).length < 150) throw new Error(`ICP: only ${Object.keys(ICP).length} countries`);

// ── Eurostat ──
const esUrl = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_ppp_ind?format=JSON&lang=EN&na_item=PLI_EU27_2020&${PARTS.map((p) => `ppp_cat=${p[3]}`).join("&")}&sinceTimePeriod=2018`;
const es = JSON.parse(fs.readFileSync(get(esUrl, "eurostat-pli.json"), "utf8"));
const dim = (k) => es.dimension[k].category.index;
const [cats, geos, times] = [dim("ppp_cat"), dim("geo"), dim("time")];
const size = es.size;
const order = es.id;
const at = (pos) => {
  // The flat index of a cell, by each dimension's position.
  let i = 0;
  for (let k = 0; k < order.length; k++) i = i * size[k] + pos[order[k]];
  return i;
};
const EU_GEO = { EL: "GR", UK: "GB" };
const ES = {};
let esYear = 0;
for (const [geo, g] of Object.entries(geos)) {
  const cc = EU_GEO[geo] ?? geo;
  if (!/^[A-Z]{2}$/.test(cc) || !SITE.has(cc)) continue;
  // Its latest year with a figure for all it consumes.
  const years = Object.entries(times).sort((a, b) => b[0].localeCompare(a[0]));
  for (const [year, t] of years) {
    const all = es.value[at({ freq: 0, na_item: 0, ppp_cat: cats.A01, geo: g, time: t })];
    if (all === undefined || all === null) continue;
    ES[cc] = [+year, PARTS.map((p) => {
      const v = es.value[at({ freq: 0, na_item: 0, ppp_cat: cats[p[3]], geo: g, time: t })];
      return v === undefined || v === null ? null : v;
    })];
    esYear = Math.max(esYear, +year);
    break;
  }
}
if (Object.keys(ES).length < 30) throw new Error(`Eurostat: only ${Object.keys(ES).length} countries`);
const esUpdated = es.updated?.slice(0, 10) ?? "";

// ── BEA Regional Price Parities ──
function bea(zipName, csvPrefix) {
  const zip = get(`https://apps.bea.gov/regional/zip/${zipName}.zip`, `${zipName}.zip`);
  const dir = path.join(CACHE, zipName);
  execFileSync("unzip", ["-o", "-q", zip, "-d", dir]);
  const file = fs.readdirSync(dir).find((f) => f.startsWith(csvPrefix) && f.endsWith(".csv"));
  const lines = fs.readFileSync(path.join(dir, file), "utf8").split(/\r?\n/);
  const head = lines[0].split(",");
  const year = head[head.length - 1].trim();
  const updated = (lines.find((l) => l.includes("Last updated")) ?? "").replace(/"/g, "").trim();
  const rows = new Map(); // fips -> { name, lines: [all, goods, housing, utilities, other] }
  for (const l of lines.slice(1)) {
    const m = l.match(/^\s*"(\d{5})","([^"]+)",[^,]*,\w+,(\d),"[^"]*","\s*RPPs: ([^"]+?)\s*","Index",(.*)$/);
    if (!m) continue;
    const v = m[5].split(",").pop().trim();
    const n = Number(v);
    if (!rows.has(m[1])) rows.set(m[1], { name: m[2].replace(/ \(Metropolitan Statistical Area\)$/, ""), lines: [null, null, null, null, null] });
    rows.get(m[1]).lines[+m[3] - 1] = Number.isFinite(n) && v !== "" ? round1(n) : null;
  }
  return { year, updated, rows };
}
const sa = bea("SARPP", "SARPP_STATE");
const ma = bea("MARPP", "MARPP_MSA");
const ABBR = new Map([...read("src/data/statesData.ts").matchAll(/name:\s*"([^"]+)",\s*abbreviation:\s*"([A-Z]{2})"/g)].map((m) => [m[1], m[2]]));
ABBR.set("District of Columbia", "DC");
const STATES = {};
for (const [fips, r] of sa.rows) {
  if (fips === "00000") continue;
  const abbr = ABBR.get(r.name);
  if (!abbr) throw new Error(`BEA: no code for ${r.name}`);
  STATES[abbr] = r.lines;
}
if (Object.keys(STATES).length !== 51) throw new Error(`BEA: ${Object.keys(STATES).length} states`);
const metros = Object.fromEntries([...ma.rows].filter(([f]) => f !== "00000").map(([f, r]) => [f, [r.name, ...r.lines]]));
fs.writeFileSync(METROS, JSON.stringify(metros));
// How many of BLS's areas BEA has prices for: their codes are the same OMB ones.
const payAreas = fs.existsSync(path.join(__dirname, "static/pay/areas.json")) ? JSON.parse(read("static/pay/areas.json")).areas : {};
const blsMetros = Object.entries(payAreas).filter(([, a]) => a[2] === 4).map(([c]) => c);
const matched = blsMetros.filter((c) => metros[c]).length;

fs.writeFileSync(
  OUT,
  `/**
 * What things cost in a place against elsewhere - the cost of living, by the bodies that measure it: the World Bank's
 * International Comparison Program 2021 (${Object.keys(ICP).length} countries, the world's average 100), Eurostat (${Object.keys(ES).length} countries of Europe, the
 * EU's average 100, to ${esYear}), and the US Bureau of Economic Analysis's Regional Price Parities ${sa.year} (the states; the metro areas
 * are in static/prices/metros.json), the nation's 100. Each figure is the body's own.
 *
 * GENERATED by build-price-levels.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const PRICE_SOURCES = {
  icp: [
    { label: "World Bank — International Comparison Program 2021: price level indexes (World = 100)", url: "https://www.worldbank.org/en/programs/icp" },
    { label: "World Bank — ICP 2021 database (DataBank)", url: "https://databank.worldbank.org/source/icp-2021" },
  ],
  eurostat: [{ label: "Eurostat — Purchasing power parities: price level indices (prc_ppp_ind)", url: "https://ec.europa.eu/eurostat/databrowser/view/prc_ppp_ind/default/table" }],
  bea: [{ label: "US Bureau of Economic Analysis — Regional Price Parities by state and metro area, ${sa.year}", url: "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area" }],
};
/** The parts of what a household consumes each price level is given for, the first all of it: [key, what it is]. */
export const PRICE_PARTS: [key: string, label: string][] = ${JSON.stringify(PARTS.map((p) => [p[0], p[1]]))};
export const ICP_YEAR = 2021;
/** Each country's ICP 2021 price level for each of PRICE_PARTS, the world's average 100 (null where the ICP gives none). */
export const ICP_PRICES: Record<string, (number | null)[]> = ${JSON.stringify(ICP)};
/** Eurostat's: [the year, each of PRICE_PARTS], the European Union's average (27 countries) 100. Updated ${esUpdated}. */
export const EUROSTAT_PRICES: Record<string, [year: number, values: (number | null)[]]> = ${JSON.stringify(ES)};
export const BEA_YEAR = ${sa.year};
/** What BEA's lines are: all items, then four parts of them. */
export const BEA_PARTS = ["All items", "Goods", "Housing rents", "Utilities", "Other services"];
/** Each state's Regional Price Parities, ${sa.year}, by its postal code: each of BEA_PARTS, the nation's 100. ${sa.updated}. */
export const BEA_STATES: Record<string, (number | null)[]> = ${JSON.stringify(STATES)};
/** A metro area's, in static/prices/metros.json by its OMB code (BLS's area code): [name, each of BEA_PARTS]. */
export type BeaMetros = Record<string, [name: string, ...values: (number | null)[]]>;
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: ICP ${Object.keys(ICP).length} countries, Eurostat ${Object.keys(ES).length} (to ${esYear}), BEA ${Object.keys(STATES).length} states ${sa.year} and ${Object.keys(metros).length} metro areas`);
console.log(`  BLS metro areas with BEA prices: ${matched} of ${blsMetros.length}`);
console.log(`  samples: JP ${ICP.JP?.[0]} US ${ICP.US?.[0]} CH ${ICP.CH?.[0]} IN ${ICP.IN?.[0]} · Eurostat DE ${ES.DE?.[1][0]} (${ES.DE?.[0]}) BG ${ES.BG?.[1][0]} · BEA TX ${STATES.TX?.[0]} CA ${STATES.CA?.[0]} El Paso ${metros["21340"]?.[1]}`);
