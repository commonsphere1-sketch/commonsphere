/**
 * Builds src/data/economyIndicators.ts — the headline figures on each economy,
 * from the World Bank and the IMF, each carrying the year it is for.
 *
 * The same problem as countriesData, in milder form: audit-economies.cjs
 * matched 72 of 76 GDP figures and 75 of 76 growth rates to a year one of
 * these bodies published, so the numbers were real but spread across 2018 to
 * 2025 with nothing saying which.
 *
 * Debt comes from the IMF, not the World Bank. General government gross debt
 * as a share of GDP is the IMF's series; the World Bank's central-government
 * debt is a narrower measure, and mixing the two would put a definitional
 * difference on the page as though it were a change in the figure.
 *
 * Taiwan is in neither, so it keeps what it had and is reported at the end.
 *
 *   node build-economy-indicators.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/economyIndicators.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-econ-indicators");
fs.mkdirSync(CACHE, { recursive: true });

/** Where the site's name differs from the World Bank's. null = not covered. */
const ALIAS = {
  "United States": "USA", "South Korea": "KOR", Russia: "RUS", Turkey: "TUR",
  Egypt: "EGY", Iran: "IRN", Venezuela: "VEN", Vietnam: "VNM", Slovakia: "SVK",
  "Hong Kong": "HKG", "European Union": "EUU", Czechia: "CZE", Taiwan: null,
};

const WB = {
  gdpTrillions: { code: "NY.GDP.MKTP.CD", conv: (v) => round(v / 1e12, 3) },
  gdpPerCapita: { code: "NY.GDP.PCAP.CD", conv: (v) => Math.round(v) },
  gdpGrowthRate: { code: "NY.GDP.MKTP.KD.ZG", conv: (v) => round(v, 1) },
  inflationRate: { code: "FP.CPI.TOTL.ZG", conv: (v) => round(v, 1) },
  unemploymentRate: { code: "SL.UEM.TOTL.ZS", conv: (v) => round(v, 1) },
};

const round = (v, dp) => Number(v.toFixed(dp));

function loadEconomies() {
  const bundle = path.join(CACHE, "economiesData.cjs");
  execSync(
    `npx esbuild src/data/economiesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).economiesData;
}

async function latest(code) {
  const at = path.join(CACHE, code + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=8&per_page=25000`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || !json[1]) throw new Error(`${code}: no rows`);
  const out = {};
  for (const row of json[1]) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    if (!/^\d{4}$/.test(String(row.date))) continue;
    const id = row.countryiso3code || row.country.id;
    if (!id) continue;
    if (!out[id] || +row.date > +out[id].year) out[id] = { v: row.value, year: String(row.date) };
  }
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

/**
 * IMF general government gross debt, percent of GDP.
 *
 * The WEO carries projections alongside outturns and the datamapper does not
 * flag which is which, so the current year and everything after it is skipped:
 * a first pass took the 2026 column and would have published 72 forecasts as
 * though they were measurements. What is left is still not pure outturn - the
 * IMF revises its most recent year for a while - and the generated file says
 * so rather than implying otherwise.
 */
async function imfDebt() {
  const at = path.join(CACHE, "imf-debt.json");
  let series;
  if (fs.existsSync(at)) series = JSON.parse(fs.readFileSync(at, "utf8"));
  else {
    const res = await fetch("https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP", { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error("IMF: HTTP " + res.status);
    const json = await res.json();
    series = json?.values?.GGXWDG_NGDP ?? {};
    fs.writeFileSync(at, JSON.stringify(series));
  }
  const thisYear = new Date().getFullYear();
  const out = {};
  for (const [code, years] of Object.entries(series)) {
    let best = null;
    for (const [y, v] of Object.entries(years)) {
      if (!Number.isFinite(v) || +y >= thisYear) continue;
      if (!best || +y > +best.year) best = { v, year: y };
    }
    if (best) out[code] = { v: round(best.v, 1), year: best.year };
  }
  return out;
}

(async () => {
  const economies = loadEconomies();
  const cRes = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=500", { headers: { "User-Agent": UA } });
  const cJson = await cRes.json();
  const byName = new Map();
  for (const c of cJson[1] || []) byName.set(c.name.toLowerCase(), c.id);

  const series = {};
  for (const [f, spec] of Object.entries(WB)) series[f] = await latest(spec.code);
  const debt = await imfDebt();

  const rows = [];
  const yearTally = {};
  const uncovered = [];
  let fields = 0, moved = 0;
  const bigMoves = [];

  for (const e of economies) {
    const code = ALIAS[e.name] !== undefined ? ALIAS[e.name] : byName.get(e.name.toLowerCase());
    if (!code) { uncovered.push(e.name); continue; }
    const parts = [];
    const add = (field, hit) => {
      if (!hit || !Number.isFinite(hit.v)) return;
      parts.push(`${field}: { v: ${hit.v}, y: "${hit.year}" }`);
      yearTally[hit.year] = (yearTally[hit.year] || 0) + 1;
      fields++;
      const before = e[field];
      if (typeof before === "number" && Number.isFinite(before) && before !== 0) {
        const rel = Math.abs(hit.v - before) / Math.abs(before);
        if (rel >= 0.005) {
          moved++;
          if (rel > 0.5) bigMoves.push({ name: e.name, field, before, after: hit.v, year: hit.year, rel });
        }
      }
    };
    for (const [f, spec] of Object.entries(WB)) {
      const hit = series[f][code];
      add(f, hit ? { v: spec.conv(hit.v), year: hit.year } : null);
    }
    add("debtToGDPRatio", debt[code]);
    if (parts.length) rows.push(`  "${e.id}": { ${parts.join(", ")} },`);
  }

  const years = Object.entries(yearTally).sort((a, b) => b[1] - a[1]);
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Headline figures per economy, each with the year it is for.
 *
 * GENERATED by build-economy-indicators.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * GDP, GDP per capita, growth, inflation and unemployment are the World Bank's
 * most recent year for that economy. Debt is the IMF's general government
 * gross debt as a share of GDP, which is the measure that series reports.
 * The current year and later are skipped because the WEO publishes projections
 * for them; even the latest year kept may still be an IMF estimate rather than
 * a final outturn, which is why the year is shown with the figure.
 *
 * Note that the IMF's general government measure is wider than a
 * central-government one, so some economies move a long way - Switzerland from
 * 18 to 38.5 - because the measure changed, not the country.
 *
 * Keyed by the economy id used in economiesData.ts. An economy neither body
 * covers has no entry and keeps the figure it had.
 */
export const ECONOMY_INDICATORS_SOURCE = {
  worldBank: { label: "World Bank — World Development Indicators", url: "https://data.worldbank.org/" },
  imf: { label: "IMF — World Economic Outlook, general government gross debt", url: "https://www.imf.org/external/datamapper/GGXWDG_NGDP" },
  retrieved: "${today}",
};

/** A figure and the year it is for. */
export type MeasuredEconomy = { v: number; y: string };

export type EconomyIndicators = Partial<{
${[...Object.keys(WB), "debtToGDPRatio"].map((f) => `  ${f}: MeasuredEconomy;`).join("\n")}
}>;

export const ECONOMY_INDICATORS: Record<string, EconomyIndicators> = {
${rows.join("\n")}
};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} economies, ${fields} figures`);
  console.log("  years: " + years.slice(0, 8).map(([y, n]) => `${y}=${n}`).join("  "));
  console.log(`  figures that moved by 0.5% or more: ${moved}`);
  if (uncovered.length) console.log(`  not covered by either body (keeping their own figures): ${uncovered.join(", ")}`);
  if (bigMoves.length) {
    bigMoves.sort((a, b) => b.rel - a.rel);
    console.log("\n  largest moves — worth an eye:");
    for (const m of bigMoves.slice(0, 12))
      console.log(`    ${m.name.padEnd(20)} ${m.field.padEnd(18)} ${String(m.before).padStart(10)} -> ${String(m.after).padStart(10)} (${m.year})`);
    if (bigMoves.length > 12) console.log(`    ... and ${bigMoves.length - 12} more`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
