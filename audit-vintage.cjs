/**
 * Works out whether countriesData.ts is stale or invented.
 *
 * The first audit showed most figures disagreeing with the latest World Bank
 * values, many of them by about the same factor. That has two very different
 * explanations. Either the numbers are real but from an older year, in which
 * case they should be refreshed and dated; or they match no year the World
 * Bank ever published, in which case they came from nowhere and should be
 * replaced outright.
 *
 * So for each figure this asks the only question that separates the two: is
 * there ANY year in the World Bank's series that this value matches closely?
 * It reports the year that fits best, how well, and how many figures fit no
 * year at all.
 *
 *   node audit-vintage.cjs [--field=gdp] [--list]
 */
const os = require("os");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-audit");
fs.mkdirSync(CACHE, { recursive: true });

const FIELDS = {
  population: { code: "SP.POP.TOTL", conv: (v) => v, near: 0.02 },
  gdp: { code: "NY.GDP.MKTP.CD", conv: (v) => v / 1e9, near: 0.06 },
  gdpPerCapita: { code: "NY.GDP.PCAP.CD", conv: (v) => v, near: 0.06 },
  lifeExpectancy: { code: "SP.DYN.LE00.IN", conv: (v) => v, near: 0.02 },
  areaKm2: { code: "AG.SRF.TOTL.K2", conv: (v) => v, near: 0.02 },
};

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(
    `npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

/** Full history, not just the most recent value. */
async function history(code) {
  const at = path.join(CACHE, "hist-" + code + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const out = {};
  for (let page = 1; page <= 4; page++) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&date=2000:2025&per_page=15000&page=${page}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json) || !json[1] || !json[1].length) break;
    for (const row of json[1]) {
      if (row.value === null || !Number.isFinite(row.value)) continue;
      (out[row.country.id] ||= {})[row.date] = row.value;
    }
    if (page >= (json[0]?.pages ?? 1)) break;
  }
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

(async () => {
  const args = process.argv.slice(2);
  const only = (args.find((a) => a.startsWith("--field=")) || "").split("=")[1];
  const list = args.includes("--list");
  const countries = loadCountries();

  console.log("\n=== does each figure match ANY year the World Bank published? ===");

  for (const [field, spec] of Object.entries(FIELDS)) {
    if (only && field !== only) continue;
    const hist = await history(spec.code);
    const byYear = {};
    const noMatch = [];
    let checked = 0;

    for (const c of countries) {
      const mine = c[field];
      if (typeof mine !== "number" || !Number.isFinite(mine)) continue;
      const series = hist[c.code];
      if (!series) continue;
      checked++;

      let best = null;
      for (const [year, raw] of Object.entries(series)) {
        const ref = spec.conv(raw);
        if (!ref) continue;
        const rel = Math.abs(mine - ref) / Math.abs(ref);
        if (!best || rel < best.rel) best = { year, rel, ref };
      }
      if (best && best.rel <= spec.near) byYear[best.year] = (byYear[best.year] || 0) + 1;
      else noMatch.push({ name: c.name, mine, closest: best ? { year: best.year, ref: best.ref, rel: best.rel } : null });
    }

    const years = Object.entries(byYear).sort((a, b) => b[1] - a[1]);
    const matched = years.reduce((n, [, v]) => n + v, 0);
    console.log(`\n--- ${field}: ${checked} checked, ${matched} match some year within ${Math.round(spec.near * 100)}%, ${noMatch.length} match no year`);
    console.log("    best-fitting years: " + years.slice(0, 8).map(([y, n]) => `${y}=${n}`).join("  "));
    if (noMatch.length) {
      const show = list ? noMatch : noMatch.slice(0, 8);
      for (const n of show) {
        const c = n.closest;
        console.log(
          `      ${n.name.padEnd(24)} site ${String(Math.round(n.mine).toLocaleString()).padStart(14)}` +
          (c ? `   closest ${String(Math.round(c.ref).toLocaleString()).padStart(14)} in ${c.year} (off by ${(c.rel * 100).toFixed(0)}%)` : "   no series"),
        );
      }
      if (!list && noMatch.length > show.length) console.log(`      ... and ${noMatch.length - show.length} more (--list)`);
    }
  }
  console.log("\nNothing was changed. This only reports.");
})().catch((e) => { console.error(e); process.exit(1); });
