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
 *                               age groups for its latest estimate year, and
 *                               life expectancy at birth.
 *   Pacific Community (SPC)     GDP, GDP per capita, real growth (ADB Key
 *                               Indicators) and inflation, as the Pacific
 *                               statistics offices publish them (see spcFigures).
 *   CIA World Factbook          GDP at the official exchange rate, real growth
 *                               and inflation, for the few places no
 *                               statistical agency covers (see FACTBOOK).
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

/** UN WPP 2024 life expectancy at birth, both sexes, iso3 → { v, year }. */
async function wppLifeExpectancy() {
  const at = path.join(CACHE, "wpp-life.csv");
  if (!fs.existsSync(at)) {
    const res = await fetch("https://ourworldindata.org/grapher/life-expectancy.csv?v=1&csvType=full&useColumnShortNames=true", { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error("OWID life expectancy: HTTP " + res.status);
    fs.writeFileSync(at, await res.text());
  }
  const lines = fs.readFileSync(at, "utf8").trim().split(/\r?\n/).map((l) => l.split(","));
  const head = lines[0];
  const ci = head.indexOf("code"), yi = head.indexOf("year");
  const vi = head.findIndex((h) => /life_expectancy/.test(h));
  if (ci < 0 || yi < 0 || vi < 0) throw new Error("OWID life expectancy: unexpected columns " + head.join("|"));
  const out = {};
  for (const r of lines.slice(1)) {
    if (!r[ci] || r[ci].startsWith("OWID_") || r[vi] === "") continue;
    if (!out[r[ci]] || +r[yi] > +out[r[ci]].year) out[r[ci]] = { v: Number(r[vi]), year: r[yi] };
  }
  return out;
}

/**
 * The Pacific Community's Pacific Data Hub (SPC .Stat), for Pacific island
 * states the World Bank and the IMF leave out - Niue, the Cook Islands.
 *
 * These are the national statistics offices' own figures, collected by SPC,
 * so they rank above the Factbook's estimates. Only series that measure the
 * same thing as the site's field are taken:
 *   gdp, gdpPerCapita  DF_NATIONAL_ACCOUNTS GDPC / GDPCPC in current US$.
 *   gdpGrowth          ADB Key Indicators NGDP_R_PTX_PS, "at constant prices,
 *                      growth of output" - real growth, as the World Bank's
 *                      series is. SPC's own GDPCVR is the change in
 *                      current-price GDP, i.e. nominal, and in US$ it also
 *                      moves with the exchange rate, so it is not used.
 *   inflationRate      DF_CPI annual inflation, all items.
 * The current year and later are skipped, as for the IMF.
 */
const SPC_BASE = "https://stats-sdmx-disseminate.pacificdata.org/rest/data/SPC,";

function parseCsv(text) {
  const rows = [];
  for (const line of text.trim().split(/\r?\n/)) {
    const cells = [];
    let cur = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const head = rows.shift();
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

async function spcDataset(flow) {
  const at = path.join(CACHE, `spc-${flow}.csv`);
  if (!fs.existsSync(at)) {
    const res = await fetch(`${SPC_BASE}${flow},/all`, {
      /* Node's fetch sends "Accept-Language: *" unless told otherwise, and
         the hub answers that with HTTP 500. A named language is accepted. */
      headers: {
        "User-Agent": UA,
        Accept: "application/vnd.sdmx.data+csv;version=1.0.0",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) throw new Error(`SPC ${flow}: HTTP ${res.status}`);
    fs.writeFileSync(at, await res.text());
  }
  return parseCsv(fs.readFileSync(at, "utf8"));
}

/** iso2 → { field → { v, year, s } } from the Pacific Data Hub. */
async function spcFigures() {
  const thisYear = new Date().getFullYear();
  const out = {};
  const keep = (iso2, field, v, year, s) => {
    if (!Number.isFinite(v) || !/^\d{4}$/.test(year) || +year >= thisYear || +year < thisYear - 10) return;
    const cur = (out[iso2] ||= {})[field];
    if (!cur || +year > +cur.year) out[iso2][field] = { v, year, s };
  };
  for (const r of await spcDataset("DF_NATIONAL_ACCOUNTS")) {
    if (r.CURRENCY !== "USD") continue;
    const scale = 10 ** Number(r.UNIT_MULT || 0);
    const v = Number(r.OBS_VALUE) * scale;
    if (r.INDICATOR === "GDPC") keep(r.GEO_PICT, "gdp", v / 1e9, r.TIME_PERIOD, "spc");
    if (r.INDICATOR === "GDPCPC") keep(r.GEO_PICT, "gdpPerCapita", v, r.TIME_PERIOD, "spc");
  }
  for (const r of await spcDataset("DF_ADBKI")) {
    if (r.INDICATOR === "NGDP_R_PTX_PS") keep(r.GEO_PICT, "gdpGrowth", Number(r.OBS_VALUE), r.TIME_PERIOD, "adb");
  }
  for (const r of await spcDataset("DF_CPI")) {
    if (r.FREQ === "A" && r.INDICATOR === "INF" && r.COMMODITY === "_T")
      keep(r.GEO_PICT, "inflationRate", Number(r.OBS_VALUE), r.TIME_PERIOD, "spc");
  }
  return out;
}

/**
 * The CIA World Factbook, for the few places no statistical agency covers.
 *
 * The Factbook is public domain and is already this site's source for
 * religions and languages. It is tried last, because its figures are
 * estimates rather than national accounts, and only for the fields where it
 * states a basis the site can use as-is: GDP at the official exchange rate
 * (not the PPP series, which is in 2015 dollars and would not compare with
 * the World Bank's current-dollar GDP for every other country), the real
 * growth rate, and consumer price inflation.
 *
 * Paths are the Factbook's own GEC codes, which are not ISO: Cook Islands is
 * "cw" and Cocos (Keeling) Islands is "ck". Each file is checked to name the
 * country expected before anything is taken from it.
 */
const FACTBOOK = {
  CK: { path: "australia-oceania/cw", name: "Cook Islands" },
  NU: { path: "australia-oceania/ne", name: "Niue" },
  KP: { path: "east-n-southeast-asia/kn", name: "North Korea" },
  // The World Bank reports Jersey and Guernsey only as one "Channel Islands".
  JE: { path: "europe/je", name: "Jersey" },
  GG: { path: "europe/gk", name: "Guernsey" },
  VA: { path: "europe/vt", name: "Holy See (Vatican City)" },
};

const money = (t) => {
  const m = /\$([\d.,]+)\s*(trillion|billion|million)?/i.exec(t);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || "").toLowerCase();
  return unit === "trillion" ? n * 1000 : unit === "billion" ? n : unit === "million" ? n / 1000 : n / 1e9;
};
const pct = (t) => {
  const m = /(-?[\d.]+)\s*%/.exec(t);
  return m ? Number(m[1]) : null;
};
const yearOf = (t) => {
  const m = /\((\d{4})/.exec(t);
  return m ? m[1] : null;
};
/** The most recent "Field YYYY" sub-entry the Factbook lists. */
const latestSub = (node) => {
  if (!node) return null;
  if (node.text) return node.text;
  const keys = Object.keys(node).filter((k) => /\d{4}$/.test(k)).sort().reverse();
  return keys.length ? node[keys[0]].text : null;
};

async function factbookFigures() {
  const out = {};
  for (const [code, spec] of Object.entries(FACTBOOK)) {
    const at = path.join(CACHE, `factbook-${code}.json`);
    if (!fs.existsSync(at)) {
      const res = await fetch(`https://raw.githubusercontent.com/factbook/factbook.json/master/${spec.path}.json`, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`Factbook ${code}: HTTP ${res.status}`);
      fs.writeFileSync(at, await res.text());
    }
    const j = JSON.parse(fs.readFileSync(at, "utf8"));
    const got = j?.Government?.["Country name"]?.["conventional short form"]?.text;
    if (got !== spec.name) throw new Error(`Factbook ${code}: file names "${got}", expected "${spec.name}"`);
    const E = j.Economy || {};
    const take = (node, parse) => {
      /* A figure for more than this place - Jersey's and Guernsey's GDP
         entries are both the Channel Islands total, noted "entry includes
         Jersey and Guernsey" - is not this place's figure. */
      if (/entry includes/i.test(JSON.stringify(node?.note ?? ""))) return null;
      const text = latestSub(node);
      if (!text) return null;
      const v = parse(text), y = yearOf(text);
      return v !== null && y ? { v, year: y } : null;
    };
    const fig = {
      gdp: take(E["GDP (official exchange rate)"], money),
      gdpGrowth: take(E["Real GDP growth rate"], pct),
      inflationRate: take(E["Inflation rate (consumer prices)"], pct),
    };
    out[code] = Object.fromEntries(Object.entries(fig).filter(([, v]) => v));
  }
  return out;
}

/** Codes the World Bank's country list does not carry, as the IMF and UN write them. */
const EXTRA_ISO3 = { TW: "TWN", EH: "ESH", CK: "COK", NU: "NIU", JE: "JEY", GG: "GGY", VA: "VAT" };

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
  const wppLife = await wppLifeExpectancy();
  const spc = await spcFigures();
  const factbook = await factbookFigures();
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
      if (!has("lifeExpectancy") && wppLife[i3]) {
        parts.push(`lifeExpectancy: { v: ${round(wppLife[i3].v)}, y: "${wppLife[i3].year}", s: "wpp" }`);
        fallbacks.push(`${c.code} lifeExpectancy WPP ${wppLife[i3].year}`);
      }
    }
    /* National statistics offices via the Pacific Community, before the Factbook. */
    for (const [field, hit] of Object.entries(spc[c.code] || {})) {
      if (has(field)) continue;
      parts.push(`${field}: { v: ${round(hit.v)}, y: "${hit.year}", s: "${hit.s}" }`);
      fallbacks.push(`${c.code} ${field} ${hit.s.toUpperCase()} ${hit.year}`);
    }
    /* Last resort, and only for the handful in FACTBOOK. */
    for (const [field, hit] of Object.entries(factbook[c.code] || {})) {
      if (has(field)) continue;
      parts.push(`${field}: { v: ${round(hit.v)}, y: "${hit.year}", s: "factbook" }`);
      fallbacks.push(`${c.code} ${field} Factbook ${hit.year}`);
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
  spc: { label: "Pacific Community (SPC) — Pacific Data Hub", url: "https://stats.pacificdata.org/" },
  adb: { label: "Asian Development Bank — Key Indicators (via Pacific Data Hub)", url: "https://kidb.adb.org/" },
  factbook: { label: "CIA World Factbook (public domain)", url: "https://www.cia.gov/the-world-factbook/" },
};

export const COUNTRY_INDICATORS_SOURCE = {
  label: "World Bank — World Development Indicators",
  url: "https://data.worldbank.org/",
  retrieved: "${today}",
};

/** A figure and the year it is for. */
export type Measured = { v: number; y: string; s?: "imf" | "wpp" | "spc" | "adb" | "factbook" };

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
