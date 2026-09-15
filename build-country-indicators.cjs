/**
 * Builds src/data/countryIndicators.ts — the measured figures on each country,
 * from the World Bank, each one carrying the year it is for.
 *
 * Why this exists. The figures in countriesData.ts were written by hand, and
 * audit-vintage.cjs showed they are very largely real: 186 of 200 populations
 * match a year the World Bank published to within 2%, 179 of 199 GDP figures
 * to within 6%. What they are not is one year. The best-fitting vintage runs
 * from 2018 to 2025 depending on the country, and nothing on the page says so,
 * which means a comparison between two countries can quietly be a comparison
 * between two different years. That is the defect this fixes: not invention,
 * but a table that looks like a snapshot and is not one.
 *
 * So every figure here is the most recent year the World Bank reports for that
 * country, and the year travels with the value rather than being dropped. Two
 * countries may still be on different years - the World Bank does not publish
 * every country at the same time - but now the page can say which, instead of
 * implying they match.
 *
 * Nothing is estimated. Where the World Bank reports nothing, this writes
 * nothing, and countriesData keeps the value it already had.
 *
 *   node build-country-indicators.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryIndicators.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-indicators");
fs.mkdirSync(CACHE, { recursive: true });

/**
 * The site's field, and the World Bank series that measures the same thing.
 *
 * Area is deliberately absent. The World Bank's surface area includes inland
 * water and is not the total area the site lists - it puts Canada at 15.6m km2
 * against the standard 9,984,670 - so refreshing from it would replace correct
 * figures with ones that answer a different question.
 *
 * Human development index is absent too: it is UNDP's, not the World Bank's.
 */
const FIELDS = {
  population: { code: "SP.POP.TOTL", conv: (v) => Math.round(v) },
  gdp: { code: "NY.GDP.MKTP.CD", conv: (v) => round(v / 1e9) },
  gdpPerCapita: { code: "NY.GDP.PCAP.CD", conv: (v) => Math.round(v) },
  gdpGrowth: { code: "NY.GDP.MKTP.KD.ZG", conv: (v) => round(v) },
  lifeExpectancy: { code: "SP.DYN.LE00.IN", conv: (v) => round(v) },
  unemploymentRate: { code: "SL.UEM.TOTL.ZS", conv: (v) => round(v) },
  inflationRate: { code: "FP.CPI.TOTL.ZG", conv: (v) => round(v) },
};

const round = (v) => {
  const a = Math.abs(v);
  if (a >= 100) return Math.round(v);
  if (a >= 10) return Number(v.toFixed(1));
  if (a >= 1) return Number(v.toFixed(2));
  return Number(v.toFixed(4));
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
    const id = row.country.id;
    if (!out[id] || +row.date > +out[id].year) out[id] = { v: row.value, year: String(row.date) };
  }
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

(async () => {
  const countries = loadCountries();
  const series = {};
  for (const [field, spec] of Object.entries(FIELDS)) series[field] = await latest(spec.code);

  const rows = [];
  const yearTally = {};
  const coverage = {};
  let changed = 0, same = 0;
  const bigMoves = [];

  for (const c of [...countries].sort((a, b) => a.code.localeCompare(b.code))) {
    const parts = [];
    for (const [field, spec] of Object.entries(FIELDS)) {
      const hit = series[field][c.code];
      if (!hit) continue;
      const value = spec.conv(hit.v);
      if (!Number.isFinite(value)) continue;
      parts.push(`${field}: { v: ${value}, y: "${hit.year}" }`);
      coverage[field] = (coverage[field] || 0) + 1;
      yearTally[hit.year] = (yearTally[hit.year] || 0) + 1;

      const before = c[field];
      if (typeof before === "number" && Number.isFinite(before)) {
        const rel = before === 0 ? (value === 0 ? 0 : 1) : Math.abs(value - before) / Math.abs(before);
        if (rel < 0.005) same++;
        else {
          changed++;
          if (rel > 0.5) bigMoves.push({ name: c.name, field, before, value, year: hit.year, rel });
        }
      }
    }
    if (parts.length) rows.push(`  ${c.code}: { ${parts.join(", ")} },`);
  }

  const years = Object.entries(yearTally).sort((a, b) => b[1] - a[1]);
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Measured figures per country, from the World Bank, each with its own year.
 *
 * GENERATED by build-country-indicators.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Every value is the most recent year the World Bank reports for that country,
 * so the year is part of the value rather than an assumption. Countries are not
 * all on the same year - the World Bank does not publish them together - and
 * the page shows the year alongside the figure instead of implying they match.
 *
 * Series used:
${Object.entries(FIELDS)
  .map(([f, s]) => ` *   ${f.padEnd(18)} ${s.code}`)
  .join("\n")}
 *
 * Area is deliberately not here. The World Bank's surface area includes inland
 * water and answers a different question from the total area the site lists —
 * it puts Canada at 15.6m km² against the standard 9,984,670 — so refreshing
 * from it would replace correct figures with wrong ones. Human development
 * index is UNDP's, not the World Bank's, and is likewise left alone.
 *
 * Where the World Bank reports nothing, there is no entry and countriesData
 * keeps whatever it had.
 */
export const COUNTRY_INDICATORS_SOURCE = {
  label: "World Bank — World Development Indicators",
  url: "https://data.worldbank.org/",
  retrieved: "${today}",
};

/** A figure and the year it is for. */
export type Measured = { v: number; y: string };

export type CountryIndicators = Partial<{
${Object.keys(FIELDS)
  .map((f) => `  ${f}: Measured;`)
  .join("\n")}
}>;

export const COUNTRY_INDICATORS: Record<string, CountryIndicators> = {
${rows.join("\n")}
};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} countries`);
  console.log("  coverage: " + Object.entries(coverage).map(([f, n]) => `${f} ${n}`).join(", "));
  console.log("  years across all figures: " + years.slice(0, 8).map(([y, n]) => `${y}=${n}`).join("  "));
  console.log(`  unchanged (within 0.5%): ${same}; refreshed: ${changed}`);
  if (bigMoves.length) {
    bigMoves.sort((a, b) => b.rel - a.rel);
    console.log(`\n  figures that move by more than half — worth an eye:`);
    for (const m of bigMoves.slice(0, 15)) {
      console.log(
        `    ${m.name.padEnd(24)} ${m.field.padEnd(17)} ${String(m.before).padStart(14)} -> ${String(m.value).padStart(14)} (${m.year})`,
      );
    }
    if (bigMoves.length > 15) console.log(`    ... and ${bigMoves.length - 15} more`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
