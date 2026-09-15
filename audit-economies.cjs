/**
 * Cross-references economiesData.ts against the World Bank and the IMF.
 *
 * Same idea as audit-countries.cjs, and the same rule: it changes nothing. For
 * each figure it asks whether ANY recent year from a body that publishes the
 * measure comes close, because that is what separates a stale number from an
 * invented one.
 *
 * Debt is taken from the IMF rather than the World Bank: general government
 * gross debt as a share of GDP is the IMF's series, and the World Bank's
 * central-government debt is a narrower measure that would flag differences
 * which are really definitional.
 *
 *   node audit-economies.cjs [--list]
 */
const os = require("os");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-audit");
fs.mkdirSync(CACHE, { recursive: true });

/** The site's own name for an economy, mapped to the World Bank's code. */
const ALIAS = {
  "United States": "USA", "South Korea": "KOR", Russia: "RUS", Turkey: "TUR",
  Egypt: "EGY", Iran: "IRN", Venezuela: "VEN", Vietnam: "VNM", Slovakia: "SVK",
  "Hong Kong": "HKG", "European Union": "EUU", Czechia: "CZE", Taiwan: null,
};

const WB_FIELDS = {
  gdpTrillions: { code: "NY.GDP.MKTP.CD", conv: (v) => v / 1e12, near: 0.08, label: "GDP (US$tn)" },
  gdpPerCapita: { code: "NY.GDP.PCAP.CD", conv: (v) => v, near: 0.08, label: "GDP per capita (US$)" },
  gdpGrowthRate: { code: "NY.GDP.MKTP.KD.ZG", conv: (v) => v, abs: 1.5, label: "GDP growth (%)" },
  inflationRate: { code: "FP.CPI.TOTL.ZG", conv: (v) => v, abs: 2, label: "inflation (%)" },
  unemploymentRate: { code: "SL.UEM.TOTL.ZS", conv: (v) => v, abs: 2, label: "unemployment (%)" },
};

function loadEconomies() {
  const bundle = path.join(CACHE, "economiesData.cjs");
  execSync(
    `npx esbuild src/data/economiesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).economiesData;
}

async function history(code) {
  const at = path.join(CACHE, "ehist-" + code + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const out = {};
  for (let page = 1; page <= 4; page++) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&date=2018:2025&per_page=15000&page=${page}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json) || !json[1] || !json[1].length) break;
    for (const row of json[1]) {
      if (row.value === null || !Number.isFinite(row.value)) continue;
      const id = row.countryiso3code || row.country.id;
      (out[id] ||= {})[row.date] = row.value;
    }
    if (page >= (json[0]?.pages ?? 1)) break;
  }
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

/** IMF general government gross debt, percent of GDP. */
async function imfDebt() {
  const at = path.join(CACHE, "imf-debt.json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const res = await fetch("https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP", { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("IMF: HTTP " + res.status);
  const json = await res.json();
  const series = json?.values?.GGXWDG_NGDP ?? {};
  fs.writeFileSync(at, JSON.stringify(series));
  return series;
}

(async () => {
  const list = process.argv.includes("--list");
  const economies = loadEconomies();
  const wbCodes = new Map();
  const cRes = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=500", { headers: { "User-Agent": UA } });
  const cJson = await cRes.json();
  for (const c of cJson[1] || []) wbCodes.set(c.name.toLowerCase(), c.id);

  console.log("\n=== cross-reference: economiesData.ts vs World Bank / IMF ===");

  for (const [field, spec] of Object.entries(WB_FIELDS)) {
    const hist = await history(spec.code);
    let checked = 0, matched = 0, noEntity = 0;
    const off = [];
    const years = {};
    for (const e of economies) {
      const wb = ALIAS[e.name] !== undefined ? ALIAS[e.name] : wbCodes.get(e.name.toLowerCase());
      if (!wb) { noEntity++; continue; }
      const mine = e[field];
      if (typeof mine !== "number" || !Number.isFinite(mine)) continue;
      const series = hist[wb];
      if (!series) { noEntity++; continue; }
      checked++;
      let best = null;
      for (const [y, raw] of Object.entries(series)) {
        const ref = spec.conv(raw);
        const d = spec.abs !== undefined ? Math.abs(mine - ref) : Math.abs(mine - ref) / (Math.abs(ref) || 1);
        if (!best || d < best.d) best = { y, d, ref };
      }
      const ok = spec.abs !== undefined ? best.d <= spec.abs : best.d <= spec.near;
      if (ok) { matched++; years[best.y] = (years[best.y] || 0) + 1; }
      else off.push({ name: e.name, mine, best });
    }
    off.sort((a, b) => b.best.d - a.best.d);
    console.log(`\n--- ${spec.label}: ${checked} checked, ${matched} match some year 2018-2025, ${off.length} match none` + (noEntity ? `, ${noEntity} not covered` : ""));
    console.log("    best-fitting years: " + Object.entries(years).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([y, n]) => `${y}=${n}`).join("  "));
    for (const o of (list ? off : off.slice(0, 8))) {
      const f = (v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : +v.toFixed(2));
      console.log(`      ${o.name.padEnd(22)} site ${String(f(o.mine)).padStart(12)}   closest ${String(f(o.best.ref)).padStart(12)} in ${o.best.y}`);
    }
    if (!list && off.length > 8) console.log(`      ... and ${off.length - 8} more (--list)`);
  }

  // Debt, from the IMF.
  const debt = await imfDebt();
  let checked = 0, matched = 0;
  const off = [];
  for (const e of economies) {
    const wb = ALIAS[e.name] !== undefined ? ALIAS[e.name] : wbCodes.get(e.name.toLowerCase());
    if (!wb || typeof e.debtToGDPRatio !== "number") continue;
    const series = debt[wb];
    if (!series) continue;
    checked++;
    let best = null;
    for (const [y, v] of Object.entries(series)) {
      if (+y < 2018 || +y > 2026 || !Number.isFinite(v)) continue;
      const d = Math.abs(e.debtToGDPRatio - v);
      if (!best || d < best.d) best = { y, d, ref: v };
    }
    if (best && best.d <= 8) matched++;
    else if (best) off.push({ name: e.name, mine: e.debtToGDPRatio, best });
  }
  off.sort((a, b) => b.best.d - a.best.d);
  console.log(`\n--- debt to GDP (%): ${checked} checked, ${matched} within 8 points of some IMF year, ${off.length} not`);
  for (const o of (list ? off : off.slice(0, 8)))
    console.log(`      ${o.name.padEnd(22)} site ${String(o.mine).padStart(6)}   closest ${String(Math.round(o.best.ref)).padStart(6)} in ${o.best.y}`);
  if (!list && off.length > 8) console.log(`      ... and ${off.length - 8} more (--list)`);

  console.log("\nNothing was changed. This only reports.");
})().catch((e) => { console.error(e); process.exit(1); });
