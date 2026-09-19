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
 * Nothing is estimated. Where the World Bank reports nothing, two other
 * publishers are tried, and each figure records which one it came from:
 *
 *   IMF World Economic Outlook  GDP, GDP per capita, growth, inflation and
 *                               unemployment. The current year and later are
 *                               projections and are skipped; the latest year
 *                               kept may still be an IMF estimate.
 *   UN World Population Prospects 2024 (via Our World in Data)
 *                               population, as the sum of the UN's five-year
 *                               age groups for its latest estimate year.
 *
 * Where none of the three publishes a figure, there is no entry and
 * countriesData blanks the field rather than keep a hand-written number.
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

/** The site's field → IMF WEO datamapper indicator, and unit conversion. */
const IMF = {
  gdp: { code: "NGDPD", conv: (v) => v }, // already US$ billions
  gdpPerCapita: { code: "NGDPDPC", conv: (v) => v },
  gdpGrowth: { code: "NGDP_RPCH", conv: (v) => v },
  inflationRate: { code: "PCPIPCH", conv: (v) => v },
  unemploymentRate: { code: "LUR", conv: (v) => v },
};

/** iso3 → { v, year } for the latest year before the current one. */
async function imf(code) {
  const at = path.join(CACHE, "imf-" + code + ".json");
  if (!fs.existsSync(at)) {
    const res = await fetch("https://www.imf.org/external/datamapper/api/v1/" + code, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`IMF ${code}: HTTP ${res.status}`);
    fs.writeFileSync(at, await res.text());
  }
  const series = JSON.parse(fs.readFileSync(at, "utf8"))?.values?.[code] ?? {};
  const thisYear = new Date().getFullYear();
  const out = {};
  for (const [iso, years] of Object.entries(series)) {
    let best = null;
    for (const [y, v] of Object.entries(years)) {
      if (v === null || !Number.isFinite(v) || +y >= thisYear || +y < thisYear - 10) continue;
      if (!best || +y > +best.year) best = { v, year: y };
    }
    if (best) out[iso] = best;
  }
  return out;
}

/** UN WPP 2024 total population, iso3 → { v, year }, summed from age groups. */
async function wppPopulation() {
  const at = path.join(CACHE, "wpp-age5.csv");
  if (!fs.existsSync(at)) {
    const res = await fetch("https://ourworldindata.org/grapher/population-by-five-year-age-group.csv?v=1&csvType=full&useColumnShortNames=true", { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error("OWID WPP: HTTP " + res.status);
    fs.writeFileSync(at, await res.text());
  }
  const lines = fs.readFileSync(at, "utf8").trim().split(/\r?\n/).map((l) => l.split(","));
  const head = lines[0];
  const ci = head.indexOf("code"), yi = head.indexOf("year");
  const cols = head.map((h, i) => [h, i]).filter(([h]) => /^population__sex_all__age_.*__variant_estimates$/.test(h)).map(([, i]) => i);
  if (cols.length !== 21) throw new Error(`WPP: expected 21 age groups, found ${cols.length}`);
  const out = {};
  for (const r of lines.slice(1)) {
    if (!r[ci] || r[ci].startsWith("OWID_") || cols.some((i) => r[i] === "")) continue;
    const v = cols.reduce((a, i) => a + Number(r[i]), 0);
    if (!out[r[ci]] || +r[yi] > +out[r[ci]].year) out[r[ci]] = { v, year: r[yi] };
  }
  return out;
}

/** Codes the World Bank's country list does not carry, as the IMF and UN write them. */
const EXTRA_ISO3 = { TW: "TWN", EH: "ESH", CK: "COK", NU: "NIU" };

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
  const imfSeries = {};
  for (const [field, spec] of Object.entries(IMF)) imfSeries[field] = await imf(spec.code);
  const wpp = await wppPopulation();
  const iso3 = { ...EXTRA_ISO3 };
  {
    const at = path.join(CACHE, "wb-countries.json");
    if (!fs.existsSync(at)) {
      const res = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=400", { headers: { "User-Agent": UA } });
      fs.writeFileSync(at, await res.text());
    }
    for (const c of JSON.parse(fs.readFileSync(at, "utf8"))[1]) iso3[c.iso2Code] = c.id;
  }
  // The IMF writes Kosovo as UVK where the World Bank writes XKX.
  const imfCode = (i3) => (i3 === "XKX" ? "UVK" : i3);
  const fallbacks = [];

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
    // Fallbacks where the World Bank has nothing.
    const i3 = iso3[c.code];
    const has = (f) => parts.some((p) => p.startsWith(f + ":"));
    if (i3) {
      for (const [field, spec] of Object.entries(IMF)) {
        if (has(field)) continue;
        const hit = imfSeries[field][imfCode(i3)];
        if (!hit) continue;
        parts.push(`${field}: { v: ${round(spec.conv(hit.v))}, y: "${hit.year}", s: "imf" }`);
        fallbacks.push(`${c.code} ${field} IMF ${hit.year}`);
      }
      if (!has("population") && wpp[i3]) {
        parts.push(`population: { v: ${Math.round(wpp[i3].v)}, y: "${wpp[i3].year}", s: "wpp" }`);
        fallbacks.push(`${c.code} population WPP ${wpp[i3].year}`);
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
/** Where a figure has an "s" field, it came from here rather than the World Bank. */
export const COUNTRY_INDICATOR_FALLBACKS = {
  imf: { label: "IMF — World Economic Outlook", url: "https://www.imf.org/external/datamapper/" },
  wpp: { label: "UN — World Population Prospects 2024 (via Our World in Data)", url: "https://population.un.org/wpp/" },
};

export const COUNTRY_INDICATORS_SOURCE = {
  label: "World Bank — World Development Indicators",
  url: "https://data.worldbank.org/",
  retrieved: "${today}",
};

/** A figure and the year it is for. */
export type Measured = { v: number; y: string; s?: "imf" | "wpp" };

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
  console.log(`  filled from IMF / UN where the World Bank has nothing (${fallbacks.length}):\n    ` + fallbacks.join("\n    "));
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
