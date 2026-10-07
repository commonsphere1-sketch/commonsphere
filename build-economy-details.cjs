/**
 * Builds src/data/economyDetails.ts — the three detail sections of an
 * economy's window: inflation, deficits and tariffs.
 *
 * The window had a figure for inflation and one for debt, a five-year chart,
 * and nothing on what a government borrows each year or what it charges at
 * its border. These are the published series behind each, with the
 * publisher's own description of what it measures:
 *
 *   IMF World Economic       inflation (average consumer prices), general
 *     Outlook (DataMapper)   government net lending or borrowing, general
 *                            government gross debt and the current account
 *                            balance, the last three as a share of GDP - for
 *                            every economy the IMF covers and for the world,
 *                            from 1990: its estimates for past years and its
 *                            projections to five years out. The edition is
 *                            read from the API and the first projected year
 *                            follows from it.
 *   IMF Fiscal Monitor       government revenue, expenditure and the primary
 *     (DataMapper)           balance, as a share of GDP - the latest year
 *                            that is not a projection
 *   World Bank, World        tariff rates - applied and most-favoured-nation,
 *     Development            weighted and simple means, on manufactured and
 *     Indicators             on primary products - and customs duties as a
 *                            share of tax revenue, from 1990 (the Bank's
 *                            series, from UNCTAD's TRAINS and the WTO)
 *
 * Nothing is computed beyond rounding. A year a publisher gives no figure
 * for is null, not filled in. The tariff series end where the World Bank's
 * do, a year or more behind: tariffs raised or cut since are not in them,
 * and the page says so.
 *
 *   node build-economy-details.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/economyDetails.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-economy-details");
fs.mkdirSync(CACHE, { recursive: true });
const THIS_YEAR = new Date().getFullYear();
const FROM = 1990;

const IMF = "https://www.imf.org/external/datamapper/api/v1/";
/** The outlook's series kept, by the name the page uses. */
const WEO = { inflation: "PCPIPCH", balance: "GGXCNL_NGDP", debt: "GGXWDG_NGDP", currentAccount: "BCA_NGDPD" };
/** The Fiscal Monitor's, kept for the latest year only. */
const FM = { revenue: "GGR_G01_GDP_PT", expenditure: "G_X_G01_GDP_PT", primaryBalance: "GGXONLB_G01_GDP_PT" };
/** The World Bank's tariff series: the first is kept year by year, the rest for the latest year. */
const TARIFF_SERIES = "TM.TAX.MRCH.WM.AR.ZS";
const TARIFF_LATEST = {
  simple: "TM.TAX.MRCH.SM.AR.ZS",
  mfn: "TM.TAX.MRCH.WM.FN.ZS",
  manufactures: "TM.TAX.MANF.WM.AR.ZS",
  primary: "TM.TAX.TCOM.WM.AR.ZS",
  dutiesOfTax: "GC.TAX.IMPT.ZS",
};
/** Where the IMF's code for an economy is not its ISO3 code. */
const IMF_CODE = { EUU: "EU" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    for (let i = 0; ; i++) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fs.writeFileSync(at, await res.text());
        break;
      } catch (e) {
        if (i === 4) throw new Error(`${url}: ${e.message}`);
        await sleep(2500 * (i + 1));
      }
    }
  }
  return JSON.parse(fs.readFileSync(at, "utf8"));
}
const round = (v, dp) => Number(Number(v).toFixed(dp));
const plain = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

function load(file, name) {
  const bundle = path.join(CACHE, name + ".cjs");
  execSync(`npx esbuild ${file} --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle);
}

(async () => {
  const economies = load("src/data/economiesData.ts", "economiesData").economiesData;
  const ISO3 = load("src/data/resourceRents.ts", "resourceRents").ECONOMY_ISO3;
  const iso3Of = (e) => e.iso3 ?? ISO3[e.id] ?? null;

  // ── IMF ──
  const indicators = (await json(IMF + "indicators", "imf-indicators.json")).indicators;
  const about = (code) => {
    const i = indicators[code];
    if (!i?.description) throw new Error(`IMF: no description for ${code}`);
    // The API serves the dash of "borrowing (–)" as the control character U+0096 - the en dash's place in Windows-1252,
    // not decoded - which a browser draws as an empty box. It is put back as a minus sign.
    const dash = (s) => s.replace(/\u0096/g, "−");
    return { label: dash(plain(i.label)), text: dash(plain(i.description)), unit: plain(i.unit) };
  };
  const edition = plain(indicators[WEO.inflation].source);
  const m = /\((April|October) (\d{4})\)/.exec(edition);
  if (!m) throw new Error(`IMF: cannot read the edition from "${edition}"`);
  // An April or October outlook's figure for its own year is a projection.
  const firstProjected = Number(m[2]);
  if (firstProjected < THIS_YEAR - 1 || firstProjected > THIS_YEAR) throw new Error(`IMF: edition ${edition} against ${THIS_YEAR}`);

  const values = {};
  for (const [k, code] of Object.entries({ ...WEO, ...FM })) values[k] = (await json(IMF + code, `imf-${code}.json`)).values?.[code] ?? {};
  /** A series from FROM as [first year, values], null where the IMF gives none; null if it gives none at all. */
  const series = (k, code, dp) => {
    const s = values[k][code];
    if (!s) return null;
    const years = Object.keys(s).map(Number).filter((y) => y >= FROM && Number.isFinite(Number(s[y])));
    if (years.length < 3) return null;
    const first = Math.min(...years), last = Math.max(...years);
    const out = [];
    for (let y = first; y <= last; y++) out.push(s[y] == null || !Number.isFinite(Number(s[y])) ? null : round(s[y], dp));
    return [first, out];
  };
  /** The latest year that is not a projection: [year, value]. */
  const latest = (k, code, dp) => {
    const s = values[k][code];
    if (!s) return null;
    const y = Object.keys(s).map(Number).filter((y) => y < firstProjected && Number.isFinite(Number(s[y]))).sort((a, b) => b - a)[0];
    return y === undefined ? null : [y, round(s[y], dp)];
  };

  // ── World Bank tariffs ──
  const wb = async (code) => {
    const j = await json(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=${FROM}:${THIS_YEAR}`, `wb-${code}.json`);
    if (j[0].pages !== 1) throw new Error(`World Bank ${code}: more than one page`);
    const by = {};
    for (const r of j[1]) if (r.value != null && r.countryiso3code) (by[r.countryiso3code] ||= {})[Number(r.date)] = r.value;
    return by;
  };
  const wbAbout = async (code) => {
    const j = await json(`https://api.worldbank.org/v2/indicator/${code}?format=json`, `wb-about-${code}.json`);
    const i = j[1]?.[0];
    if (!i?.sourceNote) throw new Error(`World Bank: no description for ${code}`);
    return { label: plain(i.name), text: plain(i.sourceNote), org: plain(i.sourceOrganization) };
  };
  const tariff = await wb(TARIFF_SERIES);
  const tariffLatest = {};
  for (const [k, code] of Object.entries(TARIFF_LATEST)) tariffLatest[k] = await wb(code);
  const wbSeries = (by, iso) => {
    const s = by[iso];
    if (!s) return null;
    const years = Object.keys(s).map(Number);
    if (years.length < 3) return null;
    const first = Math.min(...years), last = Math.max(...years);
    const out = [];
    for (let y = first; y <= last; y++) out.push(s[y] == null ? null : round(s[y], 2));
    return [first, out];
  };
  const wbLatest = (by, iso) => {
    const s = by[iso];
    if (!s) return null;
    const y = Math.max(...Object.keys(s).map(Number));
    return [y, round(s[y], 2)];
  };

  // ── Each economy ──
  const out = {};
  for (const e of economies) {
    const iso = iso3Of(e);
    if (!iso) continue;
    const imf = IMF_CODE[iso] ?? iso;
    const d = {};
    const put = (k, v) => {
      if (v) d[k] = v;
    };
    put("inflation", series("inflation", imf, 1));
    put("balance", series("balance", imf, 1));
    put("debt", series("debt", imf, 1));
    put("currentAccount", series("currentAccount", imf, 1));
    for (const k of Object.keys(FM)) put(k, latest(k, imf, 1));
    put("tariff", wbSeries(tariff, iso));
    for (const k of Object.keys(TARIFF_LATEST)) put(k === "dutiesOfTax" ? k : "tariff" + k[0].toUpperCase() + k.slice(1), wbLatest(tariffLatest[k], iso));
    if (Object.keys(d).length) out[e.id] = d;
  }
  const n = (k) => Object.values(out).filter((d) => d[k]).length;
  if (n("inflation") < 150 || n("balance") < 150 || n("tariff") < 120) throw new Error(`only ${n("inflation")} economies with inflation, ${n("balance")} with a balance, ${n("tariff")} with tariffs`);

  // The World Bank publishes no world aggregate of the applied tariff, so the world is given for inflation alone.
  const world = { inflation: series("inflation", "WEOWORLD", 1) };
  if (!world.inflation) throw new Error("IMF: no world series for inflation");
  // The outlook must run past this year: projections are what it is for.
  const worldEnd = world.inflation[0] + world.inflation[1].length - 1;
  if (worldEnd < firstProjected + 3) throw new Error(`IMF: the outlook ends in ${worldEnd}`);
  const us = out["usa-eco"];
  const usInfl = us?.inflation?.[1][2022 - us.inflation[0]];
  if (!(usInfl > 5 && usInfl < 12)) throw new Error(`IMF: US inflation for 2022 reads ${usInfl} - wrong series?`);

  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  const aboutOut = {
    inflation: about(WEO.inflation),
    balance: about(WEO.balance),
    debt: about(WEO.debt),
    currentAccount: about(WEO.currentAccount),
    tariff: await wbAbout(TARIFF_SERIES),
    tariffMfn: await wbAbout(TARIFF_LATEST.mfn),
  };
  fs.writeFileSync(
    OUT,
    `/**
 * An economy's inflation, deficits and tariffs: the published series behind
 * the three detail sections of its window.
 *
 * GENERATED by build-economy-details.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Inflation, the government's balance, its debt and the current account are
 * the IMF's, from its ${edition}: estimates for past years and, from
 * ${firstProjected}, its projections. Revenue, expenditure and the primary balance are
 * its Fiscal Monitor's, for the latest year that is not a projection. The
 * tariff rates are the World Bank's. Nothing is computed; a year with no
 * published figure is null.
 */
export const ECONOMY_DETAILS_SOURCES = {
  weo: { label: ${q(`IMF — ${edition}`)}, url: "https://www.imf.org/external/datamapper/datasets/WEO" },
  fiscalMonitor: { label: "IMF — Fiscal Monitor", url: "https://www.imf.org/external/datamapper/datasets/FM" },
  tariffs: { label: "World Bank — World Development Indicators, tariff rates (UNCTAD TRAINS and WTO)", url: "https://data.worldbank.org/indicator/${TARIFF_SERIES}" },
  /** The outlook's edition, and the first year whose figures are its projections. */
  edition: ${q(edition)},
  firstProjected: ${firstProjected},
  retrieved: "${today}",
};

/** What each measure is, in its publisher's own words. */
export const ECONOMY_DETAILS_ABOUT: Record<"inflation" | "balance" | "debt" | "currentAccount" | "tariff" | "tariffMfn", { label: string; text: string; unit?: string; org?: string }> = ${JSON.stringify(aboutOut, null, 2)};

/** A yearly series: the year of its first value, then a value a year, null where none is published. */
export type YearSeries = [from: number, values: (number | null)[]];
/** A figure and the year it is for. */
export type Dated = [year: number, value: number];

export interface EconomyDetail {
  /** Consumer-price inflation, % a year. */
  inflation?: YearSeries;
  /** General government net lending (+) or borrowing (-), % of GDP. */
  balance?: YearSeries;
  /** General government gross debt, % of GDP. */
  debt?: YearSeries;
  /** Current account balance, % of GDP. */
  currentAccount?: YearSeries;
  /** Government revenue, expenditure and primary balance, % of GDP: the latest year that is not a projection. */
  revenue?: Dated;
  expenditure?: Dated;
  primaryBalance?: Dated;
  /** Tariff rate, applied, weighted mean, all products, %. */
  tariff?: YearSeries;
  /** The latest year of: the simple mean; the most-favoured-nation weighted mean; the applied weighted mean on manufactured and on primary products, %. */
  tariffSimple?: Dated;
  tariffMfn?: Dated;
  tariffManufactures?: Dated;
  tariffPrimary?: Dated;
  /** Customs and other import duties, % of tax revenue. */
  dutiesOfTax?: Dated;
}

/** The world's inflation, for reference: the IMF's. The World Bank publishes no world aggregate of the applied tariff. */
export const WORLD_DETAIL: { inflation: YearSeries } = ${q(world)};

/** Keyed by the economy id used in economiesData.ts. */
export const ECONOMY_DETAILS: Record<string, EconomyDetail> = {
${Object.entries(out).map(([id, d]) => `  ${q(id)}: ${q(d)},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  ${edition}; projections from ${firstProjected} to ${worldEnd}`);
  for (const k of ["inflation", "balance", "debt", "currentAccount", "revenue", "expenditure", "primaryBalance", "tariff", "tariffSimple", "tariffMfn", "tariffManufactures", "tariffPrimary", "dutiesOfTax"]) console.log(`  ${k.padEnd(20)} ${n(k)} of ${economies.length} economies`);
  const jp = out["japan-eco"];
  console.log("  Japan:", q({ inflation: jp.inflation[1].slice(-8), balance: jp.balance[1].slice(-8), tariff: jp.tariff && [jp.tariff[0], jp.tariff[1].slice(-4)], mfn: jp.tariffMfn, primary: jp.primaryBalance, revenue: jp.revenue, duties: jp.dutiesOfTax }));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
