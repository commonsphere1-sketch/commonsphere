/**
 * Builds src/data/economiesMore.ts — an economy card for every country (and
 * territory) on the site that economiesData.ts does not already cover, made
 * only from figures an international body publishes.
 *
 * The 77 hand-built economies carry a credit rating, a maritime profile and
 * forecast years that no open dataset supplies for everyone. Rather than
 * invent those for the rest, each card here holds what is published and
 * nothing else: a figure no source reports is NaN (the site's "not
 * published"), a list no source reports is empty, and the page hides the
 * section instead of filling it. Every entry is flagged limitedData so the
 * page can say so.
 *
 * Sources, each figure with the year it is for:
 *   World Bank WDI  GDP, GDP per capita, growth, inflation, unemployment, CPI,
 *                   exports + imports of goods and services (trade volume),
 *                   FDI net inflows, listed-company market capitalisation,
 *                   lending interest rate, and the five-year trend
 *   UN Comtrade     top exports and imports by HS chapter, and the top
 *                   trading partners by total goods trade, from the latest
 *                   year the country reported
 *   Unicode CLDR    currency names, through Node's Intl.DisplayNames
 * IMF debt is added afterwards by build-economy-indicators.cjs, which covers
 * these entries through their iso3.
 *
 *   node build-more-economies.cjs
 *   node build-economy-indicators.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/economiesMore.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-more-economies");
fs.mkdirSync(CACHE, { recursive: true });

/** Economy names in economiesData.ts that differ from the site's country name. */
const ECONOMY_TO_SITE = {
  "European Union": null,
  "Hong Kong": "Hong Kong",
  Turkey: "Türkiye",
  Czechia: "Czech Republic",
};

const WB = {
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  unemployment: "SL.UEM.TOTL.ZS",
  cpi: "FP.CPI.TOTL",
  exports: "NE.EXP.GNFS.CD",
  imports: "NE.IMP.GNFS.CD",
  fdi: "BX.KLT.DINV.CD.WD",
  marketCap: "CM.MKT.LCAP.CD",
  lending: "FR.INR.LEND",
};

/**
 * Short names for the HS chapters. The official descriptions run to a
 * sentence ("Mineral fuels, mineral oils and products of their distillation;
 * bituminous substances; mineral waxes"), which does not fit a pill; these
 * name the same chapter, nothing more.
 */
const HS2 = {
  "01": "Live animals", "02": "Meat", "03": "Fish & seafood", "04": "Dairy, eggs & honey",
  "05": "Animal products", "06": "Plants & flowers", "07": "Vegetables", "08": "Fruit & nuts",
  "09": "Coffee, tea & spices", "10": "Cereals", "11": "Milled grains", "12": "Oil seeds",
  "13": "Gums & resins", "14": "Plaiting materials", "15": "Animal & vegetable oils",
  "16": "Prepared meat & fish", "17": "Sugar", "18": "Cocoa", "19": "Cereal preparations",
  "20": "Preserved fruit & veg", "21": "Food preparations", "22": "Beverages & spirits",
  "23": "Animal feed", "24": "Tobacco", "25": "Salt, stone & cement", "26": "Ores",
  "27": "Mineral fuels & oil", "28": "Inorganic chemicals", "29": "Organic chemicals",
  "30": "Pharmaceuticals", "31": "Fertilisers", "32": "Dyes & paints", "33": "Cosmetics & perfumes",
  "34": "Soaps & waxes", "35": "Proteins & glues", "36": "Explosives", "37": "Photographic goods",
  "38": "Chemical products", "39": "Plastics", "40": "Rubber", "41": "Hides & skins",
  "42": "Leather goods", "43": "Furskins", "44": "Wood", "45": "Cork", "46": "Basketwork",
  "47": "Wood pulp", "48": "Paper", "49": "Printed matter", "50": "Silk", "51": "Wool",
  "52": "Cotton", "53": "Vegetable fibres", "54": "Synthetic filaments", "55": "Synthetic fibres",
  "56": "Wadding & cordage", "57": "Carpets", "58": "Special fabrics", "59": "Coated fabrics",
  "60": "Knitted fabrics", "61": "Knitted clothing", "62": "Woven clothing",
  "63": "Textile articles", "64": "Footwear", "65": "Headgear", "66": "Umbrellas",
  "67": "Feathers & artificial flowers", "68": "Stone articles", "69": "Ceramics", "70": "Glass",
  "71": "Gems & precious metals", "72": "Iron & steel", "73": "Iron & steel articles",
  "74": "Copper", "75": "Nickel", "76": "Aluminium", "78": "Lead", "79": "Zinc", "80": "Tin",
  "81": "Other base metals", "82": "Tools", "83": "Metal articles", "84": "Machinery",
  "85": "Electrical & electronics", "86": "Railway equipment", "87": "Vehicles",
  "88": "Aircraft", "89": "Ships & boats", "90": "Optical & medical instruments",
  "91": "Clocks & watches", "92": "Musical instruments", "93": "Arms & ammunition",
  "94": "Furniture", "95": "Toys & games", "96": "Miscellaneous manufactures", "97": "Art & antiques",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sig = (v, n = 4) => Number(v.toPrecision(n));
const round = (v, dp) => Number(v.toFixed(dp));

function bundle(file, name) {
  const out = path.join(CACHE, name + ".cjs");
  execSync(
    `npx esbuild ${file} --bundle --format=cjs --platform=node --log-level=error --outfile="${out}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[out];
  return require(out);
}

async function getJson(url, cacheName) {
  const at = path.join(CACHE, cacheName);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    } catch {
      // A dropped connection or DNS failure: wait and try again.
      await sleep(5000 * (attempt + 1));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(4000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const json = await res.json();
    fs.writeFileSync(at, JSON.stringify(json));
    return json;
  }
  throw new Error(`${url}: gave up after retries`);
}

/** Every year of a WDI series for every economy: { ISO3: { year: value } }. */
async function wdi(code) {
  const json = await getJson(
    `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=12&per_page=30000`,
    `wdi-${code}.json`,
  );
  const out = {};
  for (const row of json[1] || []) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    const id = row.countryiso3code;
    if (!id || !/^\d{4}$/.test(String(row.date))) continue;
    (out[id] ||= {})[row.date] = row.value;
  }
  return out;
}

const latestOf = (byYear) => {
  if (!byYear) return null;
  const y = Object.keys(byYear).sort().pop();
  return y ? { v: byYear[y], y } : null;
};

/** Comtrade public preview; one period per call, as the preview requires. */
let lastCall = 0;
async function comtrade(params, cacheName) {
  const at = path.join(CACHE, cacheName);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  // COMTRADE_OFFLINE=1 uses only what is cached, for a quick rebuild.
  if (process.env.COMTRADE_OFFLINE) return { data: [] };
  const wait = 1300 - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const q = new URLSearchParams({ ...params, customsCode: "C00", motCode: "0", partner2Code: "0" });
  const json = await getJson(`https://comtradeapi.un.org/public/v1/preview/C/A/HS?${q}`, cacheName);
  if (json.error) throw new Error(`Comtrade ${cacheName}: ${json.error}`);
  return json;
}

(async () => {
  const { countriesData } = bundle("src/data/countriesData.ts", "countriesData");
  const { economiesData } = bundle("src/data/economiesData.ts", "economiesData");

  // Which site countries already have a hand-built economy.
  const siteByName = new Map(countriesData.map((c) => [c.name.toLowerCase(), c]));
  const covered = new Set();
  const unmatched = [];
  for (const e of economiesData) {
    if (e.limitedData) continue; // this script's own output from a previous run
    const mapped = ECONOMY_TO_SITE[e.name] === undefined ? e.name : ECONOMY_TO_SITE[e.name];
    if (mapped === null) continue;
    const c = siteByName.get(mapped.toLowerCase());
    if (c) covered.add(c.code);
    else if (e.name !== "Hong Kong") unmatched.push(e.name);
  }
  if (unmatched.length) {
    console.error("economies with no matching site country: " + unmatched.join(", "));
    process.exit(1);
  }

  const wbCountries = (await getJson("https://api.worldbank.org/v2/country?format=json&per_page=500", "wb-countries.json"))[1]
    .filter((c) => c.region.value !== "Aggregates");
  const iso3Of = new Map(wbCountries.map((c) => [c.iso2Code, c.id]));
  const siteByIso3 = new Map(countriesData.filter((c) => iso3Of.has(c.code)).map((c) => [iso3Of.get(c.code), c]));

  const series = {};
  for (const [k, code] of Object.entries(WB)) series[k] = await wdi(code);

  const reporters = (await getJson("https://comtradeapi.un.org/files/v1/app/reference/Reporters.json", "ct-reporters.json")).results;
  // Current reporters only. Several ISO codes also name a historical one -
  // "Panama, excl. Canal Zone (...1977)", "Sudan (...2011)" - and whichever
  // came last in the list used to win, which lost Panama's and Sudan's trade.
  const ctCode = new Map(
    reporters
      .filter((r) => !r.isGroup && r.reporterCodeIsoAlpha3 && !r.entryExpiredDate)
      .map((r) => [r.reporterCodeIsoAlpha3, r.reporterCode]),
  );
  const partners = (await getJson("https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json", "ct-partners.json")).results;
  const partnerIso3 = new Map(partners.map((p) => [p.id, p.PartnerCodeIsoAlpha3]));

  const targets = countriesData.filter((c) => !covered.has(c.code) && iso3Of.has(c.code));
  const skipped = countriesData.filter((c) => !covered.has(c.code) && !iso3Of.has(c.code)).map((c) => c.name);

  // Latest Comtrade year per reporter: probe years newest first, many
  // reporters per call.
  const tradeYear = {};
  const pending = new Set(targets.map((c) => ctCode.get(iso3Of.get(c.code))).filter(Boolean));
  for (const year of [2024, 2023, 2022, 2021, 2020]) {
    const codes = [...pending];
    for (let i = 0; i < codes.length; i += 20) {
      const chunk = codes.slice(i, i + 20);
      const json = await comtrade(
        { reporterCode: chunk.join(","), period: String(year), partnerCode: "0", flowCode: "X", cmdCode: "TOTAL" },
        // Keyed by every code in the batch: keyed by the first alone, a batch from
        // an earlier run with different members was read back as this one.
        `ct-probe-${year}-${require("crypto").createHash("md5").update(chunk.join(",")).digest("hex")}.json`,
      );
      for (const row of json.data || []) {
        if (row.primaryValue > 0 && !tradeYear[row.reporterCode]) {
          tradeYear[row.reporterCode] = year;
          pending.delete(row.reporterCode);
        }
      }
    }
  }

  const displayCurrency = new Intl.DisplayNames(["en"], { type: "currency" });
  const titleCase = (s) => s.replace(/\b\p{Ll}/gu, (m) => m.toUpperCase());
  const entries = [];
  const noTrade = [];

  for (const c of targets) {
    const iso3 = iso3Of.get(c.code);
    const gdp = latestOf(series.gdp[iso3]);
    if (!gdp) {
      skipped.push(`${c.name} (no GDP)`);
      continue;
    }
    const pick = (k, conv) => {
      const hit = latestOf(series[k][iso3]);
      return hit ? { v: conv(hit.v), y: hit.y } : null;
    };

    // Trade volume: exports plus imports from the same year, never mixed.
    let trade = null;
    const ex = series.exports[iso3] || {}, im = series.imports[iso3] || {};
    const both = Object.keys(ex).filter((y) => im[y] !== undefined).sort();
    if (both.length) {
      const y = both.pop();
      trade = { v: sig((ex[y] + im[y]) / 1e12), y };
    }

    // Five-year trend: the latest five years with a GDP figure.
    const gdpYears = Object.keys(series.gdp[iso3]).sort().slice(-5);
    const trends = gdpYears.map((y) => ({
      year: y,
      gdp: sig(series.gdp[iso3][y] / 1e12),
      growth: series.growth[iso3]?.[y] !== undefined ? round(series.growth[iso3][y], 1) : null,
      inflation: series.inflation[iso3]?.[y] !== undefined ? round(series.inflation[iso3][y], 1) : null,
    }));

    // Comtrade.
    let topExports = [], topImports = [], tradingPartners = [], tradeFrom = null;
    const rc = ctCode.get(iso3);
    const year = rc && tradeYear[rc];
    if (year) {
      const top = async (flow) => {
        const json = await comtrade(
          { reporterCode: String(rc), period: String(year), partnerCode: "0", flowCode: flow, cmdCode: "AG2" },
          `ct-${rc}-${year}-${flow}-AG2.json`,
        );
        return (json.data || [])
          .filter((r) => HS2[r.cmdCode] && r.primaryValue > 0)
          .sort((a, b) => b.primaryValue - a.primaryValue)
          .slice(0, 5)
          .map((r) => HS2[r.cmdCode]);
      };
      topExports = await top("X");
      topImports = await top("M");
      const json = await comtrade(
        { reporterCode: String(rc), period: String(year), flowCode: "X,M", cmdCode: "TOTAL" },
        `ct-${rc}-${year}-partners.json`,
      );
      const byPartner = {};
      for (const r of json.data || []) {
        if (!r.partnerCode) continue; // the world total
        const pIso3 = partnerIso3.get(r.partnerCode);
        // Comtrade reports Taiwan as "Other Asia, nes" (code 490).
        const name = r.partnerCode === 490 ? "Taiwan" : siteByIso3.get(pIso3)?.name;
        if (!name) continue; // bunkers, free zones, "areas nes"
        byPartner[name] = (byPartner[name] || 0) + r.primaryValue;
      }
      tradingPartners = Object.entries(byPartner).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n]) => n);
      tradeFrom = String(year);
    } else noTrade.push(c.name);

    const perCap = pick("gdpPerCapita", (v) => Math.round(v));
    const growth = pick("growth", (v) => round(v, 1));
    const inflation = pick("inflation", (v) => round(v, 1));
    const unemployment = pick("unemployment", (v) => round(v, 1));
    const cpi = pick("cpi", (v) => round(v, 1));
    // Significant figures, not decimals of a billion: a micro-state's FDI is
    // hundreds of thousands of dollars, which two decimals would round to 0.
    const fdi = pick("fdi", (v) => sig(v / 1e9, 3));
    const cap = pick("marketCap", (v) => sig(v / 1e12));
    const lending = pick("lending", (v) => round(v, 2));

    const years = {};
    const val = (hit, key) => {
      if (!hit) return NaN;
      years[key] = hit.y;
      return hit.v;
    };

    let currencyName = c.currency;
    try {
      currencyName = titleCase(displayCurrency.of(c.currency));
    } catch {}

    entries.push({
      id: c.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "") + "-eco",
      name: c.name,
      entityType: c.territory ? "Territory" : "Country",
      iso2: c.code,
      iso3,
      limitedData: true,
      gdpTrillions: val({ v: sig(gdp.v / 1e12), y: gdp.y }, "gdpTrillions"),
      gdpGrowthRate: val(growth, "gdpGrowthRate"),
      gdpPerCapita: val(perCap, "gdpPerCapita"),
      cpi: val(cpi, "cpi"),
      inflationRate: val(inflation, "inflationRate"),
      unemploymentRate: val(unemployment, "unemploymentRate"),
      debtToGDPRatio: NaN,
      tradeVolumeTrillions: val(trade, "tradeVolumeTrillions"),
      fdiInflowBillions: val(fdi, "fdiInflowBillions"),
      stockMarketCap: val(cap, "stockMarketCap"),
      interestRate: val(lending, "interestRate"),
      interestRateBasis: "lending",
      currencyCode: c.currency,
      currencyName,
      topExports,
      topImports,
      tradingPartners,
      tradeYear: tradeFrom,
      creditRating: "",
      trends,
      figureYears: years,
    });
  }

  const ids = new Set();
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error("duplicate id " + e.id);
    ids.add(e.id);
  }

  const lit = (v) =>
    typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v);
  const obj = (o) =>
    "{ " +
    Object.entries(o)
      .map(([k, v]) =>
        Array.isArray(v) && v.length && typeof v[0] === "object"
          ? `${k}: [${v.map(obj).join(", ")}]`
          : v && typeof v === "object" && !Array.isArray(v)
            ? `${k}: ${obj(v)}`
            : `${k}: ${lit(v)}`,
      )
      .join(", ") +
    " }";

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Economy cards for every country and territory on the site that
 * economiesData.ts does not cover by hand.
 *
 * GENERATED by build-more-economies.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Only published figures: World Bank WDI for the national accounts, prices,
 * trade volume, FDI, market capitalisation and lending rate, and UN Comtrade
 * for top exports, imports and partners (tradeYear is the year reported).
 * NaN is "not published" and an empty list is "not reported"; the page hides
 * what is missing rather than estimating it. figureYears gives the year of
 * each figure. Credit ratings and maritime profiles have no open source that
 * covers these economies, so they are not included.
 */
import type { Economy } from "./economiesData";

export const MORE_ECONOMIES_SOURCE = {
  worldBank: { label: "World Bank — World Development Indicators", url: "https://data.worldbank.org/" },
  comtrade: { label: "UN Comtrade — goods trade by HS chapter and partner", url: "https://comtradeplus.un.org/" },
  retrieved: "${today}",
};

export const MORE_ECONOMIES: Economy[] = [
${entries.map((e) => "  " + obj(e) + ",").join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}: ${entries.length} economies`);
  console.log(`  already hand-built: ${covered.size}`);
  if (skipped.length) console.log(`  not covered by the World Bank: ${skipped.join(", ")}`);
  if (noTrade.length) console.log(`  no Comtrade report 2020-2024 (${noTrade.length}): ${noTrade.join(", ")}`);
  const missing = (k) => entries.filter((e) => Number.isNaN(e[k])).length;
  for (const k of ["gdpGrowthRate", "gdpPerCapita", "inflationRate", "unemploymentRate", "cpi", "tradeVolumeTrillions", "fdiInflowBillions", "stockMarketCap", "interestRate"])
    console.log(`  ${k.padEnd(22)} published for ${entries.length - missing(k)}/${entries.length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
