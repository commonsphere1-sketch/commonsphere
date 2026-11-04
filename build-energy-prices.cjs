#!/usr/bin/env node
/**
 * Builds src/data/energyPrices.ts - what electricity, gas and fuel cost, as asked: each US state's, and each European
 * country's, by the bodies that publish them.
 *
 *   US Energy Information Administration (public domain):
 *     Electric Power Monthly, tables 5.6.A and 5.6.B - the average price of electricity to customers in each state, by
 *     sector, in cents a kilowatt-hour: the latest month beside the same month a year before, and the year to date.
 *     Weekly retail prices of regular gasoline and of diesel, dollars a gallon with taxes: the nation, its petroleum
 *     regions (PADDs), and the nine states EIA prices on their own. A state EIA does not price is given its region's,
 *     and said to be its region's.
 *   Eurostat (reuse allowed with acknowledgement): electricity and natural gas prices for households, euros a
 *     kilowatt-hour with all taxes and levies, for the middle band of use (electricity 2,500-4,999 kWh a year, band DC;
 *     gas 20-199 GJ, band D2), each half-year; and the European Union's average.
 *   European Commission, Weekly Oil Bulletin (reuse allowed with acknowledgement): the pump price of Euro-super 95 and
 *     of diesel in each EU country, with taxes, in euros.
 *
 * Every figure is the body's own; none is worked out here.
 *
 *   node build-energy-prices.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/energyPrices.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-energy");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
function get(url, name, hours = 20) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > hours * 3600e3) execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "900", "-A", UA, "-o", file, url]);
  return file;
}
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const ABBR = new Map([...read("src/data/statesData.ts").matchAll(/name:\s*"([^"]+)",\s*abbreviation:\s*"([A-Z]{2})"/g)].map((m) => [m[1], m[2]]));
ABBR.set("District of Columbia", "DC");
const num = (v) => {
  const s = String(v ?? "").trim();
  if (s === "" || s === "--" || s === "NM" || s === "W" || s === "*") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};

// ── EIA: electricity by state ──
function epm(table) {
  const file = get(`https://www.eia.gov/electricity/monthly/xls/${table}.xlsx`, `${table}.xlsx`);
  const rows = readXlsx(file, readXlsx(file).sheets[0]).rows;
  const title = rows.slice(0, 3).map((r) => r[0]).join(" ");
  // The row naming the columns' periods: its first cell is "Census Division and State".
  const head = rows.findIndex((r) => /^Census Division/.test(r[0] ?? ""));
  if (head < 0) throw new Error(`${table}: no header row`);
  const periods = [rows[head][1], rows[head][2]].map((s) => String(s).trim());
  const out = {};
  for (const r of rows.slice(head + 1)) {
    const name = String(r[0] ?? "").trim();
    const abbr = name === "U.S. Total" ? "US" : ABBR.get(name);
    if (!abbr) continue;
    // [residential, commercial, industrial, all sectors] for the latest period, then the one a year before.
    out[abbr] = [[num(r[1]), num(r[3]), num(r[5]), num(r[9])], [num(r[2]), num(r[4]), num(r[6]), num(r[10])]];
  }
  if (Object.keys(out).length !== 52) throw new Error(`${table}: ${Object.keys(out).length} states and the nation`);
  return { title, periods, out };
}
const month = epm("table_5_06_a");
const ytd = epm("table_5_06_b");

// ── EIA: weekly retail gasoline and diesel ──
const AREAS = { NUS: "United States", R10: "East Coast (PADD 1)", R1X: "New England (PADD 1A)", R1Y: "Central Atlantic (PADD 1B)", R1Z: "Lower Atlantic (PADD 1C)", R20: "Midwest (PADD 2)", R30: "Gulf Coast (PADD 3)", R40: "Rocky Mountain (PADD 4)", R50: "West Coast (PADD 5)", R5XCA: "West Coast (PADD 5) except California", SCA: "California", SCO: "Colorado", SFL: "Florida", SMA: "Massachusetts", SMN: "Minnesota", SNY: "New York", SOH: "Ohio", STX: "Texas", SWA: "Washington" };
// EIA's petroleum regions: the states of each, by EIA's own definition of the PADDs.
const PADD = {
  R1X: ["CT", "ME", "MA", "NH", "RI", "VT"],
  R1Y: ["DE", "DC", "MD", "NJ", "NY", "PA"],
  R1Z: ["FL", "GA", "NC", "SC", "VA", "WV"],
  R20: ["IL", "IN", "IA", "KS", "KY", "MI", "MN", "MO", "NE", "ND", "SD", "OH", "OK", "TN", "WI"],
  R30: ["AL", "AR", "LA", "MS", "NM", "TX"],
  R40: ["CO", "ID", "MT", "UT", "WY"],
  R50: ["AK", "AZ", "CA", "HI", "NV", "OR", "WA"],
};
const pet = get("https://www.eia.gov/opendata/bulk/PET.zip", "PET.zip", 24 * 6);
const want = new Map();
for (const a of Object.keys(AREAS)) {
  want.set(`PET.EMM_EPMR_PTE_${a}_DPG.W`, ["gasoline", a]);
  want.set(`PET.EMD_EPD2D_PTE_${a}_DPG.W`, ["diesel", a]);
}
const FUEL = { gasoline: {}, diesel: {} };
{
  const text = execFileSync("unzip", ["-p", pet], { maxBuffer: 2 ** 31 - 1 }).toString("utf8");
  for (const line of text.split("\n")) {
    const id = line.match(/"series_id":"([^"]+)"/)?.[1];
    if (!id || !want.has(id)) continue;
    const s = JSON.parse(line);
    const [fuel, area] = want.get(id);
    // The latest 53 weeks, oldest first: [YYYY-MM-DD, dollars a gallon].
    FUEL[fuel][area] = s.data
      .filter((d) => d[1] !== null)
      .slice(0, 53)
      .map(([d, v]) => [`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, Math.round(v * 1000) / 1000])
      .reverse();
  }
}
// EIA prices diesel for the nation, its regions and California only; gasoline for nine states besides.
for (const [f, n] of [["gasoline", 19], ["diesel", 11]]) if (!FUEL[f].NUS || Object.keys(FUEL[f]).length < n) throw new Error(`EIA ${f}: ${Object.keys(FUEL[f]).length} areas`);
const fuelWeek = FUEL.gasoline.NUS[FUEL.gasoline.NUS.length - 1][0];

// ── Eurostat: household electricity and gas ──
function eurostat(code, band) {
  const file = get(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${code}?format=JSON&lang=EN&nrg_cons=${band}&tax=I_TAX&currency=EUR&unit=KWH&sinceTimePeriod=2024-S1`, `${code}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const geos = j.dimension.geo.category.index;
  const times = Object.entries(j.dimension.time.category.index).sort((a, b) => b[0].localeCompare(a[0]));
  const nT = j.size[j.size.length - 1];
  const out = {};
  for (const [geo, g] of Object.entries(geos)) {
    const cc = geo === "EU27_2020" ? "EU" : geo === "EL" ? "GR" : geo === "UK" ? "GB" : geo;
    if (!/^[A-Z]{2}$/.test(cc)) continue;
    for (const [t, ti] of times) {
      const v = j.value[g * nT + ti];
      if (v !== undefined && v !== null) {
        out[cc] = [t, Math.round(v * 10000) / 10000];
        break;
      }
    }
  }
  return { out, updated: (j.updated ?? "").slice(0, 10) };
}
const elec = eurostat("nrg_pc_204", "KWH2500-4999");
const gas = eurostat("nrg_pc_202", "GJ20-199");
if (!elec.out.EU || Object.keys(elec.out).length < 25) throw new Error("Eurostat electricity: too few countries");

// ── The Weekly Oil Bulletin ──
const page = fs.readFileSync(get("https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en", "wob.html"), "utf8");
const link = page.match(/href="(\/document\/download\/[^"]+Weekly%20prices%20with%20Taxes[^"]*\.xlsx)"/i)?.[1];
if (!link) throw new Error("Weekly Oil Bulletin: no link to the prices with taxes");
const wobFile = get(`https://energy.ec.europa.eu${link}`, "wob.xlsx");
const wob = readXlsx(wobFile, readXlsx(wobFile).sheets[0]).rows;
if (!/Euro-super 95/.test(wob[0][1]) || !/automotive gas oil/i.test(wob[0][2]) || wob[1][1] !== "1000 l") throw new Error("Weekly Oil Bulletin: its layout changed");
// Its date, as Excel keeps one: days from 30 December 1899.
const wobDate = new Date(Date.UTC(1899, 11, 30) + Number(wob[1][0]) * 864e5).toISOString().slice(0, 10);
// The site's countries, a record each: its name and its code, in whichever order the record has them.
const COUNTRY = new Map(
  read("src/data/countriesData.ts")
    .split(/\n  \{\n/)
    .flatMap((rec) => {
      const name = rec.match(/^\s*name:\s*"([^"]+)"/m)?.[1];
      const code = rec.match(/^\s*code:\s*"([A-Z]{2})"/m)?.[1];
      return name && code ? [[name, code]] : [];
    }),
);
COUNTRY.set("Czechia", "CZ");
COUNTRY.set("Netherlands", "NL");
COUNTRY.set("Slovakia", "SK");
const PUMP = {};
for (const r of wob.slice(2)) {
  const name = String(r[0] ?? "").trim();
  const cc = COUNTRY.get(name);
  if (!cc) continue;
  const per = (v) => (num(v) === null ? null : Math.round(num(v)) / 1000); // euros a litre, from euros a thousand litres
  PUMP[cc] = [per(r[1]), per(r[2])];
}
if (Object.keys(PUMP).length < 25) throw new Error(`Weekly Oil Bulletin: ${Object.keys(PUMP).length} countries matched`);

fs.writeFileSync(
  OUT,
  `/**
 * What electricity, gas and fuel cost: each US state's, by the US Energy Information Administration (electricity ${month.periods[0]}, fuel the week of
 * ${fuelWeek}), and each European country's, by Eurostat (households, ${elec.out.EU[0]}) and the European Commission's Weekly Oil Bulletin
 * (${wobDate}). Each figure is the body's own.
 *
 * GENERATED by build-energy-prices.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const ENERGY_PRICE_SOURCES = {
  eiaElectricity: [{ label: "US Energy Information Administration — Electric Power Monthly, tables 5.6.A and 5.6.B: average price of electricity by state and sector", url: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a" }],
  eiaFuel: [
    { label: "US Energy Information Administration — Gasoline and diesel fuel update (weekly retail prices)", url: "https://www.eia.gov/petroleum/gasdiesel/" },
    { label: "US Energy Information Administration — Petroleum Administration for Defense Districts (PADDs)", url: "https://www.eia.gov/todayinenergy/detail.php?id=4890" },
  ],
  eurostat: [
    { label: "Eurostat — Electricity prices for household consumers (nrg_pc_204)", url: "https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_204/default/table" },
    { label: "Eurostat — Gas prices for household consumers (nrg_pc_202)", url: "https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_202/default/table" },
  ],
  oilBulletin: [{ label: "European Commission — Weekly Oil Bulletin: consumer prices of petroleum products, with taxes", url: "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en" }],
};
/** The periods of EIA's electricity tables: the latest month and the same month a year before; the year to date and the same months a year before. */
export const EIA_ELECTRICITY_PERIODS = { month: ${JSON.stringify(month.periods)}, ytd: ${JSON.stringify(ytd.periods)} };
/** Each state's (and US, the nation's) average price of electricity, cents a kWh: [[residential, commercial, industrial, all sectors] latest, [same] a year before]. */
export const EIA_ELECTRICITY: Record<string, { month: (number | null)[][]; ytd: (number | null)[][] }> = ${JSON.stringify(Object.fromEntries(Object.keys(month.out).map((k) => [k, { month: month.out[k], ytd: ytd.out[k] }])))};
/** The areas EIA prices fuel for each week, by its code. */
export const EIA_FUEL_AREAS: Record<string, string> = ${JSON.stringify(AREAS)};
/** EIA's petroleum regions, each with its states. */
export const EIA_PADD: Record<string, string[]> = ${JSON.stringify(PADD)};
/** Retail prices, dollars a gallon with taxes, each week of the past year, oldest first: regular gasoline and diesel, by area. */
export const EIA_FUEL: Record<"gasoline" | "diesel", Record<string, [week: string, dollars: number][]>> = ${JSON.stringify(FUEL)};
/** Households' electricity and gas, euros a kWh with all taxes and levies, each country's latest half-year (EU, the European Union's average): [half-year, euros]. */
export const EUROSTAT_HOUSEHOLD = { electricity: ${JSON.stringify(elec.out)} as Record<string, [string, number]>, gas: ${JSON.stringify(gas.out)} as Record<string, [string, number]>, updated: "${elec.updated}" };
/** The Weekly Oil Bulletin's pump prices, euros a litre with taxes: [Euro-super 95, diesel], of the week of OIL_BULLETIN_DATE. */
export const OIL_BULLETIN_DATE = "${wobDate}";
export const OIL_BULLETIN: Record<string, [petrol: number | null, diesel: number | null]> = ${JSON.stringify(PUMP)};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: EIA electricity ${month.periods.join(" / ")}, YTD ${ytd.periods.join(" / ")}; fuel to ${fuelWeek} (${Object.keys(FUEL.gasoline).length} areas); Eurostat ${Object.keys(elec.out).length} electricity, ${Object.keys(gas.out).length} gas (${elec.out.EU[0]}); oil bulletin ${Object.keys(PUMP).length} countries, ${wobDate}`);
console.log(`  samples: TX ${JSON.stringify(month.out.TX)} HI ${JSON.stringify(month.out.HI?.[0])} · US gasoline ${FUEL.gasoline.NUS.at(-1)} CA ${FUEL.gasoline.SCA?.at(-1)} · DE elec ${elec.out.DE} gas ${gas.out.DE} · pump DE ${PUMP.DE} FR ${PUMP.FR}`);
