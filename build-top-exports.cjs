/**
 * Builds src/data/topExports.ts - what each country sells abroad: its largest
 * goods exports by HS chapter, with their value, for the latest year it has
 * reported to UN Comtrade.
 *
 *   Source   UN Comtrade, through its public preview API: exports to the
 *            world by HS 2-digit chapter, for the latest of 2024 to 2020 a
 *            country reports. Chapter names are the site's short forms, as
 *            build-more-economies.cjs gives them.
 *
 * Values are Comtrade's, in US dollars. The share of all goods exports is
 * worked out here from Comtrade's total for the same report.
 *
 *   node build-top-exports.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/topExports.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-exports");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The chapter names, as the economies build writes them.
const src = fs.readFileSync(path.join(__dirname, "build-more-economies.cjs"), "utf8");
const HS2 = Function(`return ${src.slice(src.indexOf("const HS2 = {") + "const HS2 = ".length, src.indexOf("};", src.indexOf("const HS2 = {")) + 1)}`)();

async function getJson(url, name) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  // The preview answers 429 or 403 when asked too often: wait and ask again, longer each time.
  for (let tries = 0; tries < 6; tries++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 || res.status === 403) {
      await sleep(30000 * (tries + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const json = await res.json();
    fs.writeFileSync(at, JSON.stringify(json));
    return json;
  }
  throw new Error(`${url}: rate-limited`);
}
let last = 0;
async function comtrade(params, name) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const wait = 1300 - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const q = new URLSearchParams({ ...params, customsCode: "C00", motCode: "0", partner2Code: "0" });
  const json = await getJson(`https://comtradeapi.un.org/public/v1/preview/C/A/HS?${q}`, name);
  if (json.error) throw new Error(`Comtrade ${name}: ${json.error}`);
  return json;
}

(async () => {
  const wb = (await getJson("https://api.worldbank.org/v2/country?format=json&per_page=500", "wb-countries.json"))[1].filter((c) => c.region.value !== "Aggregates");
  const reporters = (await getJson("https://comtradeapi.un.org/files/v1/app/reference/Reporters.json", "ct-reporters.json")).results;
  const ctCode = new Map(reporters.filter((r) => !r.isGroup && r.reporterCodeIsoAlpha3 && !r.entryExpiredDate).map((r) => [r.reporterCodeIsoAlpha3, r.reporterCode]));
  const iso2Of = new Map(wb.map((c) => [c.id, c.iso2Code]));
  const targets = [...ctCode.entries()].filter(([iso3]) => iso2Of.has(iso3));

  // The latest year each reports: newest first, twenty reporters a call.
  const year = {};
  const total = {};
  const pending = new Set(targets.map(([, rc]) => rc));
  for (const y of [2024, 2023, 2022, 2021, 2020]) {
    const codes = [...pending];
    for (let i = 0; i < codes.length; i += 20) {
      const chunk = codes.slice(i, i + 20);
      const json = await comtrade({ reporterCode: chunk.join(","), period: String(y), partnerCode: "0", flowCode: "X", cmdCode: "TOTAL" }, `probe-${y}-${crypto.createHash("md5").update(chunk.join(",")).digest("hex")}.json`);
      for (const row of json.data || []) {
        if (row.primaryValue > 0 && !year[row.reporterCode]) {
          year[row.reporterCode] = y;
          total[row.reporterCode] = row.primaryValue;
          pending.delete(row.reporterCode);
        }
      }
    }
  }
  const out = {};
  let n = 0;
  let stopped = null;
  for (const [iso3, rc] of targets) {
    const y = year[rc];
    if (!y) continue;
    let json;
    try {
      json = await comtrade({ reporterCode: String(rc), period: String(y), partnerCode: "0", flowCode: "X", cmdCode: "AG2" }, `ex-${rc}-${y}.json`);
    } catch (e) {
      // The preview's quota for the day is spent: write what has been read; a later run adds the rest from where this stopped.
      stopped = String(e.message || e).slice(0, 80);
      break;
    }
    const rows = (json.data || [])
      .filter((r) => HS2[r.cmdCode] && r.primaryValue > 0)
      .sort((a, b) => b.primaryValue - a.primaryValue)
      .slice(0, 8)
      .map((r) => [HS2[r.cmdCode], Math.round(r.primaryValue), Math.round((r.primaryValue / total[rc]) * 1000) / 10]);
    if (rows.length) out[iso2Of.get(iso3)] = { y, total: Math.round(total[rc]), rows };
    if (++n % 25 === 0) console.log(`  ${n} of ${targets.length}`);
  }
  // A check against what is known: China is the world's largest goods exporter, above $3 trillion a year.
  if (out.CN && !(out.CN.total > 3e12)) throw new Error(`China's exports ${out.CN.total}: wrong series?`);
  if (stopped) console.log(`  stopped at ${n} of ${targets.length}: ${stopped}`);
  const today = new Date().toISOString().slice(0, 10);
  const lines = Object.keys(out).sort().map((cc) => `  ${cc}: ${JSON.stringify(out[cc]).replace(/"(\w+)":/g, "$1:")},`);
  fs.writeFileSync(
    OUT,
    `/**
 * What each country sells abroad: its largest goods exports by HS chapter, with
 * their value in US dollars, for the latest year it has reported to UN Comtrade.
 *
 * GENERATED by build-top-exports.cjs on ${today} - do not edit by hand; change
 * the script and re-run it.
 *
 * The share of all its goods exports is worked out here from Comtrade's total
 * for the same report. ${Object.keys(out).length} countries${stopped ? ` - the API's daily quota ended the read early; a later run adds the rest` : ""}.
 */
export const TOP_EXPORTS_SOURCE = {
  label: "UN Comtrade — exports to the world by HS chapter",
  url: "https://comtradeplus.un.org/",
  retrieved: "${today}",
};

/** By ISO code: the report's year, all its goods exports, and its largest chapters [name, US$, % of all]. */
export const TOP_EXPORTS: Record<string, { y: number; total: number; rows: [chapter: string, usd: number, pct: number][] }> = {
${lines.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} countries`);
  console.log("US", JSON.stringify(out.US), "CN", JSON.stringify(out.CN?.rows.slice(0, 3)));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
