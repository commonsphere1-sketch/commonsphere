/**
 * Builds src/data/commodityPrices.ts — a published monthly price for each of
 * the twelve commodities on the Economies page, with ten years of history.
 *
 * What this replaces. The resource cards carried a price and a percentage
 * change typed into the page under the heading "Aug 2026": gold at $2,341 an
 * ounce, copper at $9,280 a tonne, silver at $29.4. Nothing recorded where
 * they came from, and against the published averages for that month they were
 * far out - gold was $4,411, copper $14,326, silver $65.4. They are gone; the
 * cards and the detail window now read from this file.
 *
 * Sources. Each price is a monthly average in nominal US dollars, exactly as
 * its publisher gives it - nothing is converted into another unit:
 *
 *   World Bank Commodity      crude oil (Brent), natural gas (Henry Hub),
 *     Price Data ("Pink       coal (Australian thermal), iron ore, copper,
 *     Sheet"), monthly        aluminum, gold, silver, wheat (US hard red
 *                             winter) - and, as further benchmarks for the
 *                             same commodity, WTI and Dubai crude, European
 *                             and Japanese gas, South African coal and soft
 *                             red winter wheat
 *   IMF Primary Commodity     uranium, lithium and rare earths, which the
 *     Prices                  Pink Sheet does not carry
 *
 * The Pink Sheet's download address changes with each year's edition, so the
 * World Bank's commodity page is read to find the current file. What each
 * price is a price OF comes from the publishers' own series descriptions and
 * is carried into the file, because "the price of coal" means nothing until
 * it says which coal, where, and on what terms.
 *
 * The changes the page shows - on the month before, on a year before - are
 * worked out on the page from two of these published figures, and say which
 * two.
 *
 *   node build-commodity-prices.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/commodityPrices.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-commodities");
fs.mkdirSync(CACHE, { recursive: true });
/** Months of history kept: ten years and the month they are measured from. */
const MONTHS = 121;

const WB_PAGE = "https://www.worldbank.org/en/research/commodity-markets";
const IMF_DATA = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/PCPS/+/";
const IMF_STRUCTURE = "https://api.imf.org/external/sdmx/3.0/structure/dataflow/IMF.RES/PCPS/+?references=descendants";
const IMF_PAGE = "https://www.imf.org/en/Research/commodity-prices";

/**
 * The page's commodities and the series that prices each. `benchmark` is the
 * short name the card prints; `about` finds the publisher's description of the
 * series; `also` are other published benchmarks for the same commodity.
 */
const WB_SERIES = {
  "Crude Oil": { col: "Crude oil, Brent", benchmark: "Brent", about: /^Crude oil, UK Brent/, also: [["Crude oil, WTI", "West Texas Intermediate"], ["Crude oil, Dubai", "Dubai"]] },
  "Natural Gas": { col: "Natural gas, US", benchmark: "Henry Hub, United States", about: /^Natural Gas \(U\.S\.\)/, also: [["Natural gas, Europe", "Europe"], ["Liquefied natural gas, Japan", "Japan, liquefied"]] },
  Coal: { col: "Coal, Australian", benchmark: "Australian thermal, Newcastle", about: /^Coal \(Australia\)/, also: [["Coal, South African", "South African thermal, Richards Bay"]] },
  "Iron Ore": { col: "Iron ore, cfr spot", benchmark: "62% iron fines, delivered to China", about: /^Iron ore \(any origin\)/ },
  Copper: { col: "Copper", benchmark: "London Metal Exchange, grade A", about: /^Copper \(LME\)/ },
  Aluminum: { col: "Aluminum", benchmark: "London Metal Exchange, high grade", about: /^Aluminum \(LME\)/ },
  Gold: { col: "Gold", benchmark: "Spot", about: /^Gold, spot/ },
  Silver: { col: "Silver", benchmark: "London fixing", about: /^Silver \(UK\)/ },
  Wheat: { col: "Wheat, US HRW", benchmark: "US hard red winter, Gulf export", about: /^Wheat \(U\.S\.\), no\. 2 hard red winter/, also: [["Wheat, US SRW", "US soft red winter"]] },
};
const IMF_SERIES = {
  Uranium: { code: "PURAN", benchmark: "Nuexco spot", unit: "$/lb" },
  Lithium: { code: "PLITH", benchmark: "Lithium metal, battery grade", unit: "$/tonne" },
  "Rare Earth": { code: "PREODOM", benchmark: "Rare earth carbonate, 42-45% oxide", unit: "$/tonne" },
};
/** The Pink Sheet's units, as the page prints them. A unit not listed here stops the build. */
const WB_UNITS = { "($/bbl)": "$/bbl", "($/mmbtu)": "$/MMBtu", "($/mt)": "$/tonne", "($/dmtu)": "$/dmtu", "($/troy oz)": "$/troy oz" };
const ORDER = ["Crude Oil", "Natural Gas", "Gold", "Coal", "Iron Ore", "Copper", "Lithium", "Wheat", "Rare Earth", "Uranium", "Aluminum", "Silver"];

function fetchTo(url, at, headers = []) {
  if (fs.existsSync(at)) return;
  try {
    execFileSync("curl", ["-sSfL", "-m", "300", "-A", UA, ...headers.flatMap((h) => ["-H", h]), "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    fs.rmSync(at, { force: true });
    throw new Error(`${url}: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
  }
}

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/\s*\*+$/, "").trim();
/** As published, less the noise of binary fractions: 135.19999999999999 is 135.2. */
const tidy = (v) => (v >= 1000 ? Math.round(v) : v >= 100 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100);

function worldBank() {
  const pageAt = path.join(CACHE, "wb-commodity-markets.html");
  fetchTo(WB_PAGE, pageAt);
  const url = (fs.readFileSync(pageAt, "utf8").match(/https:\/\/thedocs\.worldbank\.org\/[^"']*CMO-Historical-Data-Monthly\.xlsx/) || [])[0];
  if (!url) throw new Error("World Bank: no link to the monthly file on " + WB_PAGE);
  const at = path.join(CACHE, "CMO-Historical-Data-Monthly.xlsx");
  fetchTo(url, at);

  let prices = null, about = null;
  for (const sheet of readXlsx(at).sheets) {
    const { rows } = readXlsx(at, sheet);
    const second = clean(rows[1]?.[0]);
    if (/^monthly prices in nominal US dollars/i.test(second)) prices = rows;
    if (clean(rows[1]?.[0]) === "Series Description") about = rows;
  }
  if (!prices || !about) throw new Error("World Bank: the prices or descriptions sheet was not found");
  const updated = clean(prices.find((r) => /^Updated on /.test(clean(r[0])))?.[0]).replace(/^Updated on /, "");
  const h = prices.findIndex((r) => clean(r[1]) === "Crude oil, average");
  if (h < 0 || !/^\d{4}M\d{2}$/.test(clean(prices[h + 2]?.[0]))) throw new Error("World Bank: the price sheet's layout changed");
  const names = prices[h].map(clean), units = prices[h + 1].map(clean);
  const column = (name) => {
    const i = names.indexOf(name);
    if (i < 0) throw new Error(`World Bank: no column "${name}"`);
    if (!WB_UNITS[units[i]]) throw new Error(`World Bank: "${name}" is in ${units[i]}, a unit this script does not know`);
    const series = [];
    for (const r of prices.slice(h + 2)) {
      const m = clean(r[0]).match(/^(\d{4})M(\d{2})$/);
      const v = Number(r[i]);
      if (m && r[i] !== "" && r[i] != null && Number.isFinite(v)) series.push([`${m[1]}-${m[2]}`, tidy(v)]);
    }
    return { unit: WB_UNITS[units[i]], series };
  };
  const described = about.map((r) => clean(r[1])).filter(Boolean);
  const out = {};
  for (const [name, spec] of Object.entries(WB_SERIES)) {
    const { unit, series } = column(spec.col);
    const text = described.find((d) => spec.about.test(d));
    if (!text) throw new Error(`World Bank: no description for ${spec.col}`);
    out[name] = {
      benchmark: spec.benchmark,
      about: text,
      unit,
      source: "wb",
      series: series.slice(-MONTHS),
      also: (spec.also || []).map(([col, label]) => {
        const a = column(col);
        const [month, price] = a.series[a.series.length - 1];
        return { label, unit: a.unit, month, price };
      }),
    };
  }
  return { out, url, updated };
}

function imf() {
  const structureAt = path.join(CACHE, "imf-pcps-structure.json");
  fetchTo(IMF_STRUCTURE, structureAt, ["Accept: application/json"]);
  const lists = JSON.parse(fs.readFileSync(structureAt, "utf8")).data.codelists;
  const commodities = lists.find((c) => c.id === "CL_COMMODITY");
  if (!commodities) throw new Error("IMF: no commodity code list");
  const out = {};
  for (const [name, spec] of Object.entries(IMF_SERIES)) {
    const at = path.join(CACHE, `imf-${spec.code}.json`);
    fetchTo(`${IMF_DATA}G001.${spec.code}.USD.M`, at, ["Accept: application/json"]);
    const j = JSON.parse(fs.readFileSync(at, "utf8")).data;
    const periods = j.structures[0].dimensions.observation[0].values.map((v) => v.id || v.value);
    const all = Object.values(j.dataSets[0].series || {});
    if (all.length !== 1) throw new Error(`IMF ${spec.code}: ${all.length} series, expected one`);
    const series = Object.entries(all[0].observations)
      .map(([i, o]) => [String(periods[+i]).replace(/^(\d{4})-M(\d{2})$/, "$1-$2"), Number(o[0])])
      .filter(([m, v]) => /^\d{4}-\d{2}$/.test(m) && Number.isFinite(v))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, v]) => [m, tidy(v)]);
    const code = commodities.codes.find((c) => c.id === spec.code);
    // The description ends with a paragraph about the IMF's datasets in general; the series is the first sentence.
    const text = clean(String(code?.description || "").split(" This indicator appears")[0]);
    if (!text) throw new Error(`IMF ${spec.code}: no description`);
    out[name] = { benchmark: spec.benchmark, about: text, unit: spec.unit, source: "imf", series: series.slice(-MONTHS), also: [] };
  }
  return out;
}

(() => {
  const wb = worldBank();
  const all = { ...wb.out, ...imf() };

  // Checks: every commodity is here with a long enough run that ends recently,
  // and two figures everyone knows the size of are the size they should be.
  const newest = new Date();
  const monthsAgo = (m) => (newest.getFullYear() - +m.slice(0, 4)) * 12 + (newest.getMonth() + 1 - +m.slice(5));
  for (const name of ORDER) {
    const p = all[name];
    if (!p) throw new Error(`${name}: no price series`);
    if (p.series.length < 100) throw new Error(`${name}: only ${p.series.length} months`);
    const [last] = p.series[p.series.length - 1];
    if (monthsAgo(last) > 4) throw new Error(`${name}: the latest month is ${last}`);
    if (p.series.some(([, v]) => !(v > 0))) throw new Error(`${name}: a price that is not above zero`);
  }
  const lastOf = (n) => all[n].series[all[n].series.length - 1][1];
  if (lastOf("Crude Oil") < 10 || lastOf("Crude Oil") > 300) throw new Error(`Brent at ${lastOf("Crude Oil")}: wrong series?`);
  if (lastOf("Gold") < 500 || lastOf("Gold") > 20000) throw new Error(`gold at ${lastOf("Gold")}: wrong series?`);

  const today = new Date().toISOString().slice(0, 10);
  const entry = (name) => {
    const p = all[name];
    return `  ${JSON.stringify(name)}: {
    benchmark: ${JSON.stringify(p.benchmark)},
    about: ${JSON.stringify(p.about)},
    unit: ${JSON.stringify(p.unit)},
    source: "${p.source}",
    also: ${JSON.stringify(p.also)},
    series: ${JSON.stringify(p.series)},
  },`;
  };
  fs.writeFileSync(
    OUT,
    `/**
 * A published monthly price for each commodity on the Economies page, with
 * ten years of history.
 *
 * GENERATED by build-commodity-prices.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each price is a monthly average in nominal US dollars, in the unit its
 * publisher uses - nothing is converted. \`about\` is the publisher's own
 * description of the series: which grade, where, on what terms.
 */
export const COMMODITY_PRICE_SOURCES = {
  wb: {
    label: "World Bank — Commodity Price Data (The Pink Sheet)",
    url: "${WB_PAGE}",
    file: "${wb.url}",
    updated: ${JSON.stringify(wb.updated)},
  },
  imf: {
    label: "IMF — Primary Commodity Prices",
    url: "${IMF_PAGE}",
  },
} as const;
export const COMMODITY_PRICES_RETRIEVED = "${today}";

export interface CommodityPrice {
  /** The short name of what is priced, as the card prints it. */
  benchmark: string;
  /** The publisher's own description of the series. */
  about: string;
  unit: string;
  source: keyof typeof COMMODITY_PRICE_SOURCES;
  /** Other published benchmarks for the same commodity, each at its latest month. */
  also: { label: string; unit: string; month: string; price: number }[];
  /** [month as YYYY-MM, average price], oldest first: ten years and the month before them. */
  series: [month: string, price: number][];
}

export const COMMODITY_PRICES: Record<string, CommodityPrice> = {
${ORDER.map(entry).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB); World Bank file updated ${wb.updated}`);
  for (const name of ORDER) {
    const p = all[name], s = p.series;
    console.log(`  ${name.padEnd(12)} ${String(s[s.length - 1][1]).padStart(8)} ${p.unit.padEnd(10)} ${s[s.length - 1][0]}  (${s.length} months from ${s[0][0]})  ${p.benchmark}`);
  }
})();
