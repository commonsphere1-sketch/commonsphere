/**
 * Builds src/data/economyManufacturing.ts — each economy's manufacturing, from
 * the World Bank's World Development Indicators (CC BY 4.0), for the section
 * of that name in an economy's window.
 *
 *   node build-economy-manufacturing.cjs
 *
 * Series, each as the World Bank publishes it, with its year:
 *
 *   NV.IND.MANF.CD       manufacturing, value added (current US$)        every year from 2000
 *   NV.IND.MANF.ZS       manufacturing, value added (% of GDP)           every year from 2000
 *   NV.IND.MANF.KD.ZG    manufacturing, value added (annual % growth)    the last ten years held
 *   TX.VAL.MANF.ZS.UN    manufactures exports (% of merchandise exports) latest
 *   TM.VAL.MANF.ZS.UN    manufactures imports (% of merchandise imports) latest
 *   TX.VAL.TECH.MF.ZS    high-technology exports (% of manufactured exports) latest
 *   SL.IND.EMPL.ZS       employment in industry (% of employment; ILO modelled estimate) latest
 *
 * The last is industry as a whole - manufacturing with mining, construction
 * and utilities - since no employment series for manufacturing alone is in
 * the indicators; the window says so. The World Bank's breakdown of
 * manufacturing by branch (food, textiles, chemicals, machinery) is UNIDO's
 * and is left out: its terms for a commercial site were not confirmed.
 *
 * The world's own share of GDP is kept beside the economies', as the line a
 * chart measures against. An economy is matched as build-economy-indicators
 * matches it: by its own code, a named alias, or its name. Nothing is worked
 * out; each figure is rounded and no more.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/economyManufacturing.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-econ-manufacturing");
fs.mkdirSync(CACHE, { recursive: true });
const FROM = 2000;

/** Where the site's name differs from the World Bank's. null = not covered. */
const ALIAS = {
  "United States": "USA", "South Korea": "KOR", Russia: "RUS", Turkey: "TUR",
  Egypt: "EGY", Iran: "IRN", Venezuela: "VEN", Vietnam: "VNM", Slovakia: "SVK",
  "Hong Kong": "HKG", "European Union": "EUU", Czechia: "CZE", Taiwan: null,
};

function loadEconomies() {
  const bundle = path.join(CACHE, "economiesData.cjs");
  execSync(`npx esbuild src/data/economiesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).economiesData;
}

/** A series for every economy: code → [[year, value], …], the earliest year first. */
async function series(code) {
  const at = path.join(CACHE, `${code}.json`);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&date=${FROM}:${new Date().getFullYear()}&per_page=20000`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || !json[1]) throw new Error(`${code}: no rows`);
  if (json[0].pages > 1) throw new Error(`${code}: more rows than one page holds`);
  const out = {};
  for (const row of json[1]) {
    if (row.value === null || !Number.isFinite(row.value) || !/^\d{4}$/.test(String(row.date))) continue;
    const id = row.countryiso3code || row.country.id;
    if (!id) continue;
    (out[id] ??= []).push([Number(row.date), row.value]);
  }
  for (const list of Object.values(out)) list.sort((a, b) => a[0] - b[0]);
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

(async () => {
  const economies = loadEconomies();
  const cRes = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=500", { headers: { "User-Agent": UA } });
  const byName = new Map(((await cRes.json())[1] || []).map((c) => [c.name.toLowerCase(), c.id]));

  const value = await series("NV.IND.MANF.CD");
  const share = await series("NV.IND.MANF.ZS");
  const growth = await series("NV.IND.MANF.KD.ZG");
  const exportsShare = await series("TX.VAL.MANF.ZS.UN");
  const importsShare = await series("TM.VAL.MANF.ZS.UN");
  const highTech = await series("TX.VAL.TECH.MF.ZS");
  const jobs = await series("SL.IND.EMPL.ZS");
  if (!share.WLD || !value.USA || !value.CHN) throw new Error("the World Bank's series no longer carry the world, the United States or China");

  const round = (v, dp) => Number(v.toFixed(dp));
  const points = (list, dp, times = 1) => (list ? list.map(([y, v]) => [y, round(v * times, dp)]) : undefined);
  const latest = (list, dp) => (list && list.length ? [list[list.length - 1][0], round(list[list.length - 1][1], dp)] : undefined);
  const rows = [];
  const uncovered = [];
  for (const e of economies) {
    const code = e.iso3 ?? (ALIAS[e.name] !== undefined ? ALIAS[e.name] : byName.get(e.name.toLowerCase()));
    if (!code) {
      uncovered.push(e.name);
      continue;
    }
    const d = {
      // Value added in billions of current US dollars, to three decimals: a small economy's is millions.
      value: points(value[code], 3, 1e-9),
      share: points(share[code], 2),
      growth: growth[code] ? points(growth[code].slice(-10), 2) : undefined,
      exportsShare: latest(exportsShare[code], 1),
      importsShare: latest(importsShare[code], 1),
      highTech: latest(highTech[code], 1),
      industryJobs: latest(jobs[code], 1),
    };
    for (const k of Object.keys(d)) if (d[k] === undefined || (Array.isArray(d[k]) && d[k].length === 0)) delete d[k];
    if (Object.keys(d).length) rows.push([e.id, d]);
  }
  console.log(`economies: ${economies.length}, with manufacturing figures: ${rows.length}, with value added: ${rows.filter(([, d]) => d.value).length}`);
  console.log(`not matched to a World Bank code: ${uncovered.length ? uncovered.join(", ") : "none"}`);
  const us = rows.find(([id]) => id === "usa-eco")?.[1];
  console.log("United States, latest:", JSON.stringify({ value: us?.value?.at(-1), share: us?.share?.at(-1), exportsShare: us?.exportsShare, highTech: us?.highTech, industryJobs: us?.industryJobs }));
  if (rows.length < 150) throw new Error("fewer than 150 economies have a manufacturing figure");

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Each economy's manufacturing, from the World Bank's World Development
 * Indicators, by the economy's id.
 *
 * GENERATED by build-economy-manufacturing.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Every figure is as the World Bank publishes it, rounded, with its year. A
 * series runs from ${FROM}; a year the World Bank gives no figure for is not
 * there. "Jobs in industry" is industry as a whole - manufacturing with
 * mining, construction and utilities - the ILO's modelled estimate.
 */
export const ECONOMY_MANUFACTURING_RETRIEVED = "${today}";
export const ECONOMY_MANUFACTURING_SOURCE = {
  label: "World Bank — World Development Indicators: manufacturing value added, manufactures trade, high-technology exports, employment in industry (CC BY 4.0)",
  url: "https://data.worldbank.org/indicator/NV.IND.MANF.ZS",
};

/** A figure with its year. */
export type Latest = [year: number, value: number];
export type EconomyManufacturing = {
  /** Manufacturing value added, in billions of current US dollars, year by year. */
  value?: Latest[];
  /** Manufacturing value added as a share of GDP, %, year by year. */
  share?: Latest[];
  /** Real growth of manufacturing value added, % a year: the last ten years held. */
  growth?: Latest[];
  /** Manufactures as a share of merchandise exports, %. */
  exportsShare?: Latest;
  /** Manufactures as a share of merchandise imports, %. */
  importsShare?: Latest;
  /** High-technology exports as a share of manufactured exports, %. */
  highTech?: Latest;
  /** Employment in industry as a share of all employment, %. */
  industryJobs?: Latest;
};

/** The world's manufacturing value added as a share of its GDP, %, year by year: the line an economy's is measured against. */
export const WORLD_MANUFACTURING_SHARE: Latest[] = ${JSON.stringify(points(share.WLD, 2))};

export const ECONOMY_MANUFACTURING: Record<string, EconomyManufacturing> = {
${rows.map(([id, d]) => `  ${JSON.stringify(id)}: ${JSON.stringify(d)},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
