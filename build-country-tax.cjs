/**
 * Builds src/data/countryTax.ts - what each country's government takes in
 * tax, the rates it sets, and what its employees are paid: behind the "Tax
 * and wages" panel of a country's window and of the windows of the places
 * in it.
 *
 *   node build-country-tax.cjs
 *
 * Sources - each one's licence allows a site that sells memberships and
 * carries advertising to show its figures, with the credit given here:
 *
 *   World Bank, World Development Indicators (CC BY 4.0), from the IMF's
 *   Government Finance Statistics
 *     Tax revenue as a share of GDP (GC.TAX.TOTL.GD.ZS), and what the
 *     central government's revenue is made of: taxes on income, profits and
 *     capital gains; on goods and services; on international trade; other
 *     taxes; social contributions; grants and other revenue (the GC.TAX.*
 *     and GC.REV.* shares of revenue).
 *
 *   OECD, Tax Database (CC BY 4.0)
 *     The combined statutory corporate income tax rate (central and
 *     sub-central government together), for the jurisdictions it covers, and
 *     the top statutory personal income tax rate, for its members.
 *
 *   OECD, average annual wages (CC BY 4.0)
 *     For its members: in US dollars at purchasing power parity, at constant
 *     prices.
 *
 *   International Labour Organization, ILOSTAT (CC BY 4.0, as its datasets
 *   are from 3 May 2023)
 *     Average monthly earnings of employees, in US dollars at the year's
 *     exchange rate (EAR_EMTA_SEX_CUR_NB_A, both sexes). A figure the ILO
 *     marks unreliable is left out.
 *
 * Each figure is the last one published for the country, with its year; a
 * country a body does not cover has none. What revenue is made of is taken
 * for one year - the last for which the four kinds of tax are all given -
 * and kept only where the parts given come to the whole (95 to 105 in a
 * hundred): a set of shares that does not is not drawn as a whole. Nothing
 * is worked out.
 *
 * Not here, and why: the Tax Foundation's tables of rates, which are licensed
 * for non-commercial use only; and the World Bank's Doing Business "total tax
 * and contribution rate", which the Bank has withdrawn.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryTax.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-country-tax");
fs.mkdirSync(CACHE, { recursive: true });
const THIS_YEAR = new Date().getFullYear();

function fetchText(url, name, headers = []) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "300", "-A", UA, ...headers.flatMap((h) => ["-H", h]), "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${url}: could not be fetched`);
    }
  }
  return fs.readFileSync(at, "utf8");
}
const round = (v, dp) => Number(Number(v).toFixed(dp));

/* ── Which ISO3 code is which ISO2, and which World Bank "countries" are aggregates ── */
const wbCountries = JSON.parse(fetchText("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
const iso2Of = {};
for (const c of wbCountries) if (c.region && c.region.id !== "NA" && /^[A-Z]{2}$/.test(c.iso2Code)) iso2Of[c.id] = c.iso2Code;
if (Object.keys(iso2Of).length < 200) throw new Error(`only ${Object.keys(iso2Of).length} World Bank economies were read`);

const out = {};
const of = (iso2) => (out[iso2] ||= {});
const count = {};
const tally = (k) => (count[k] = (count[k] || 0) + 1);

/* ── World Bank: every year of the last twelve, a country and a year at a time ── */
function wb(code) {
  const rows = JSON.parse(fetchText(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=12&per_page=30000`, `${code}-mrv12.json`))[1] || [];
  const by = {}; // iso2 → { year → value }
  for (const r of rows) {
    const iso2 = iso2Of[r.countryiso3code];
    if (!iso2 || r.value == null) continue;
    (by[iso2] ||= {})[Number(r.date)] = r.value;
  }
  if (Object.keys(by).length < 60) throw new Error(`${code}: only ${Object.keys(by).length} countries have a value`);
  return by;
}
const revenue = wb("GC.TAX.TOTL.GD.ZS");
for (const [iso2, years] of Object.entries(revenue)) {
  const y = Math.max(...Object.keys(years).map(Number));
  const v = round(years[y], 1);
  if (v < 0 || v > 100) throw new Error(`tax revenue of ${iso2}: ${v}% of GDP is not a share`);
  of(iso2).revenue = { v, y };
  tally("revenue");
}
const PARTS = [
  ["income", "GC.TAX.YPKG.RV.ZS", true],
  ["goods", "GC.TAX.GSRV.RV.ZS", true],
  ["trade", "GC.TAX.INTT.RV.ZS", true],
  ["other", "GC.TAX.OTHR.RV.ZS", true],
  ["social", "GC.REV.SOCL.ZS", false],
  ["grants", "GC.REV.GOTR.ZS", false],
];
const series = Object.fromEntries(PARTS.map(([k, code]) => [k, wb(code)]));
for (const iso2 of Object.keys(series.income)) {
  // The last year for which the four kinds of tax are all given.
  const years = Object.keys(series.income[iso2])
    .map(Number)
    .filter((y) => PARTS.every(([k, , needed]) => !needed || series[k][iso2]?.[y] != null))
    .sort((a, b) => b - a);
  if (!years.length) continue;
  const y = years[0];
  const mix = { y };
  let sum = 0;
  for (const [k] of PARTS) {
    const v = series[k][iso2]?.[y];
    if (v == null) continue;
    // A part a little below nothing is a refund netted off: it is not a share of a whole, and the set is not kept.
    if (v < -0.5) {
      sum = NaN;
      break;
    }
    mix[k] = round(Math.max(0, v), 1);
    sum += Math.max(0, v);
  }
  if (!(sum >= 95 && sum <= 105)) continue;
  of(iso2).mix = mix;
  tally("mix");
}

/* ── OECD: a table by its codes, as rows of named fields ── */
function oecd(flow, name, from) {
  const text = fetchText(`https://sdmx.oecd.org/public/rest/data/${flow},/all?startPeriod=${from}&dimensionAtObservation=AllDimensions`, name, ["Accept: application/vnd.sdmx.data+csv; charset=utf-8"]);
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => {
    const f = l.split(",");
    if (f.length !== cols.length) throw new Error(`${flow}: a row has ${f.length} fields, not ${cols.length}`);
    return Object.fromEntries(cols.map((c, i) => [c, f[i]]));
  });
}
/** The last year's value for each country among the rows kept, no later than this year: a rate announced for a year to come is not yet the rate. */
function latest(rows, key, dp, lo, hi) {
  const by = {};
  for (const r of rows) {
    const iso2 = iso2Of[r.REF_AREA];
    const y = Number(r.TIME_PERIOD);
    const v = Number(r.OBS_VALUE);
    if (!iso2 || r.OBS_VALUE === "" || !Number.isFinite(v) || y > THIS_YEAR) continue;
    if (v < lo || v > hi) throw new Error(`${key} of ${r.REF_AREA}: ${v} is out of range`);
    if (!by[iso2] || y > by[iso2].y) by[iso2] = { v: round(v, dp), y };
  }
  for (const [iso2, f] of Object.entries(by)) {
    of(iso2)[key] = f;
    tally(key);
  }
  return Object.keys(by).length;
}
const cit = oecd("OECD.CTP.TPS,DSD_TAX_CIT@DF_CIT", "oecd-cit.csv", THIS_YEAR - 3).filter((r) => r.MEASURE === "CIT_C" && r.TARGETING === "ST" && r.SECTOR === "S13");
if (latest(cit, "corporate", 1, 0, 80) < 100) throw new Error("the OECD's corporate rates cover over a hundred jurisdictions");
const pit = oecd("OECD.CTP.TPS,DSD_TAX_PIT@DF_PIT_TOP_EARN_THRESH", "oecd-pit.csv", THIS_YEAR - 4).filter((r) => r.MEASURE === "TS_PIT");
if (latest(pit, "topIncome", 1, 0, 80) < 30) throw new Error("the OECD's top income tax rates cover its members");
const wage = oecd("OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE", "oecd-wage.csv", THIS_YEAR - 4).filter((r) => r.UNIT_MEASURE === "USD_PPP" && r.PRICE_BASE === "Q");
if (latest(wage, "wageYear", 0, 1000, 500000) < 30) throw new Error("the OECD's average wages cover its members");
// The year the constant prices are of, as the table itself gives it.
const wageBase = [...new Set(wage.map((r) => r.BASE_PER).filter(Boolean))];
if (wageBase.length !== 1) throw new Error(`the OECD's wages are in the prices of ${wageBase.length} years, not one`);

/* ── ILO: average monthly earnings of employees, in US dollars ── */
{
  const text = fetchText("https://rplumber.ilo.org/data/indicator/?id=EAR_EMTA_SEX_CUR_NB_A&sex=SEX_T&classif1=CUR_TYPE_USD&timefrom=2015&format=.csv", "ilo-earnings-usd.csv").replace(/^﻿/, "");
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",").map((c) => c.replace(/"/g, ""));
  const at = (name) => cols.indexOf(name);
  const by = {};
  for (const l of lines) {
    // The first seven fields hold no comma: the notes after them may, and are not read.
    const f = l.split(",").map((x) => x.replace(/"/g, ""));
    const iso2 = iso2Of[f[at("ref_area")]];
    const y = Number(f[at("time")]);
    const v = Number(f[at("obs_value")]);
    if (!iso2 || f[at("sex")] !== "SEX_T" || f[at("classif1")] !== "CUR_TYPE_USD" || !Number.isFinite(v) || !Number.isInteger(y)) continue;
    if (f[at("obs_status")] === "U") continue; // unreliable, as the ILO marks it
    if (v <= 0 || v > 30000) throw new Error(`ILO earnings of ${f[at("ref_area")]}: ${v} US dollars a month is out of range`);
    if (!by[iso2] || y > by[iso2].y) by[iso2] = { v: round(v, 0), y };
  }
  if (Object.keys(by).length < 100) throw new Error(`the ILO's earnings cover only ${Object.keys(by).length} countries`);
  for (const [iso2, f] of Object.entries(by)) {
    of(iso2).wageMonth = f;
    tally("wageMonth");
  }
}

const today = new Date().toISOString().slice(0, 10);
const dated = (f) => `{v:${f.v},y:${f.y}}`;
const body = Object.keys(out)
  .sort()
  .map((cc) => {
    const c = out[cc];
    const fields = [];
    if (c.revenue) fields.push(`revenue:${dated(c.revenue)}`);
    if (c.mix) fields.push(`mix:{${Object.entries(c.mix).map(([k, v]) => `${k}:${v}`).join(",")}}`);
    if (c.corporate) fields.push(`corporate:${dated(c.corporate)}`);
    if (c.topIncome) fields.push(`topIncome:${dated(c.topIncome)}`);
    if (c.wageMonth) fields.push(`wageMonth:${dated(c.wageMonth)}`);
    if (c.wageYear) fields.push(`wageYear:${dated(c.wageYear)}`);
    return `  ${cc}: {${fields.join(",")}},`;
  })
  .join("\n");

fs.writeFileSync(
  OUT,
  `/**
 * What each country's government takes in tax, the rates it sets, and what
 * its employees are paid: behind the "Tax and wages" panel.
 *
 * GENERATED by build-country-tax.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each figure is the last one its source publishes for the country, with its
 * year; a country a source does not cover has none. Nothing is worked out.
 */
export const COUNTRY_TAX_RETRIEVED = "${today}";

export const COUNTRY_TAX_SOURCES = {
  revenue: { label: "World Bank — World Development Indicators: tax revenue and what revenue is made of, from the IMF's Government Finance Statistics (CC BY 4.0)", url: "https://data.worldbank.org/indicator/GC.TAX.TOTL.GD.ZS" },
  rates: { label: "OECD — Tax Database: statutory corporate and top personal income tax rates (CC BY 4.0)", url: "https://www.oecd.org/en/data/datasets/oecd-tax-database.html" },
  wageYear: { label: "OECD — average annual wages (CC BY 4.0)", url: "https://www.oecd.org/en/data/indicators/average-annual-wages.html" },
  wageMonth: { label: "ILO — ILOSTAT: average monthly earnings of employees (CC BY 4.0)", url: "https://ilostat.ilo.org/topics/wages/" },
};
/** The year whose prices the OECD's average wages are in. */
export const WAGE_PRICES_OF = ${JSON.stringify(wageBase[0])};

/** A figure with its year. */
export type Taxed = { v: number; y: number };
export type CountryTax = Partial<{
  /** Tax revenue, % of GDP. */
  revenue: Taxed;
  /** What the central government's revenue is made of, % of revenue, for one year: the parts given come to the whole. */
  mix: { y: number; income: number; goods: number; trade: number; other: number; social?: number; grants?: number };
  /** The combined statutory corporate income tax rate, %. */
  corporate: Taxed;
  /** The top statutory personal income tax rate, %. */
  topIncome: Taxed;
  /** Average monthly earnings of employees, US dollars at the year's exchange rate. */
  wageMonth: Taxed;
  /** Average annual wage, US dollars at purchasing power parity, constant prices. */
  wageYear: Taxed;
}>;

export const COUNTRY_TAX: Record<string, CountryTax> = {
${body}
};
`,
);
console.log(`countries: ${Object.keys(out).length}`);
for (const [k, n] of Object.entries(count)) console.log(`  ${k}: ${n}`);
