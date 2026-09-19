/**
 * Builds src/data/countryEnergy.ts — each country's total energy production
 * and consumption, and what its production is made of, from the US Energy
 * Information Administration's international energy statistics.
 *
 * What this replaces. countriesData.ts gave every country a consumption and a
 * production figure in TWh and a production mix, hand-written with no year.
 * Checked against EIA, the United States was shown consuming 25,700 TWh and
 * producing 24,900 - a net importer - when EIA has it producing 30,347 TWh
 * against 27,712 consumed in 2024: it has been a net energy exporter since
 * 2019. The written mix also split renewables into wind, solar and hydro,
 * which this series does not, so those slices had no source to check against;
 * the mix is now the five parts EIA publishes.
 *
 * Source. EIA International Energy Data, bulk file INTL.zip (no key needed).
 * Series, all in quadrillion Btu (the only unit EIA publishes the fuel split
 * in), converted at 293.07107 TWh per quad:
 *   INTL.44-1   total energy production
 *   INTL.44-2   total energy consumption
 *   INTL.4411-1 / 4413-1 / 4415-1 / 4417-1 / 4418-1
 *               production from coal / natural gas / petroleum and other
 *               liquids / nuclear / renewables and other
 * The five parts add up to the total; the script checks that they do, per
 * country, and leaves out any country where they do not. A year is used only
 * if production, consumption and all five parts are published for it, and
 * nothing more than ten years old is used.
 *
 *   node build-energy.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/countryEnergy.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-energy");
fs.mkdirSync(CACHE, { recursive: true });
const URL = "https://www.eia.gov/opendata/bulk/INTL.zip";
const OLDEST = new Date().getFullYear() - 10;
/** 1 quadrillion Btu = 1.055056e18 J = 293.07107 TWh. */
const QUAD_TWH = 293.07107;

const PARTS = {
  "4411": { source: "Coal", color: "hsl(220,20%,40%)" },
  "4413": { source: "Natural Gas", color: "hsl(45,90%,55%)" },
  "4415": { source: "Oil & other liquids", color: "hsl(30,70%,45%)" },
  "4417": { source: "Nuclear", color: "hsl(150,60%,45%)" },
  "4418": { source: "Renewables & other", color: "hsl(200,85%,55%)" },
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

(async () => {
  const zipAt = path.join(CACHE, "INTL.zip");
  if (!fs.existsSync(zipAt)) {
    const res = await fetch(URL, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) throw new Error(`${URL}: HTTP ${res.status}`);
    fs.writeFileSync(zipAt, Buffer.from(await res.arrayBuffer()));
  }
  const text = unzip(zipAt).get("INTL.txt").toString("utf8");

  // iso3 → series key → { year: TWh }
  const want = /^INTL\.(44|4411|4413|4415|4417|4418)-(1|2)-([A-Z]{3})-QBTU\.A$/;
  const data = {};
  let updated = "";
  for (const line of text.split("\n")) {
    if (!line.includes('-QBTU.A"') || !line.includes('"data"')) continue;
    const j = JSON.parse(line);
    const m = want.exec(j.series_id || "");
    if (!m) continue;
    if (m[1] !== "44" && m[2] !== "1") continue; // only production is split by fuel
    const byYear = {};
    for (const [y, v] of j.data || []) if (typeof v === "number" && Number.isFinite(v)) byYear[y] = v * QUAD_TWH;
    ((data[m[3]] ||= {})[`${m[1]}-${m[2]}`] = byYear);
    if ((j.last_updated || "") > updated) updated = j.last_updated;
  }

  const iso3 = {};
  {
    const res = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=400", { headers: { "User-Agent": UA } });
    for (const c of (await res.json())[1]) iso3[c.iso2Code] = c.id;
  }

  const rows = [];
  const years = {};
  const none = [];
  const mismatch = [];
  for (const c of loadCountries().sort((a, b) => a.id.localeCompare(b.id))) {
    const d = data[iso3[c.code]];
    if (!d || !d["44-1"] || !d["44-2"]) { none.push(c.name); continue; }
    const keys = ["44-1", "44-2", ...Object.keys(PARTS).map((k) => `${k}-1`)];
    const year = Object.keys(d["44-1"])
      .filter((y) => +y >= OLDEST && keys.every((k) => d[k] && y in d[k]))
      .sort()
      .pop();
    if (!year) { none.push(c.name); continue; }
    const prod = d["44-1"][year], use = d["44-2"][year];
    const parts = Object.entries(PARTS).map(([k, p]) => ({ ...p, twh: d[`${k}-1`][year] }));
    const sum = parts.reduce((a, p) => a + p.twh, 0);
    if (prod > 1 && Math.abs(sum - prod) / prod > 0.02) {
      mismatch.push(`${c.name} ${year}: parts ${sum.toFixed(0)} vs total ${prod.toFixed(0)} TWh`);
      continue;
    }
    years[year] = (years[year] || 0) + 1;
    const mix = parts
      .filter((p) => prod > 0 && p.twh / prod >= 0.005)
      .map((p) => `{ source: "${p.source}", pct: ${Math.round((p.twh / prod) * 1000) / 10}, color: "${p.color}" }`);
    const r = (v) => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
    rows.push(`  ${JSON.stringify(c.id)}: { y: "${year}", totalUseTWh: ${r(use)}, totalProductionTWh: ${r(prod)}, mix: [${mix.join(", ")}] },`);
  }

  // The US has been a net energy exporter since 2019; if this says otherwise
  // the series or the units have changed.
  const us = rows.find((r) => r.startsWith('  "us"'));
  const [, uUse, uProd] = us.match(/totalUseTWh: ([\d.]+), totalProductionTWh: ([\d.]+)/);
  if (!(+uProd > +uUse && +uUse > 20000 && +uUse < 35000)) throw new Error(`US check failed: use ${uUse}, production ${uProd}`);

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Total energy production and consumption per country, in TWh, with the
 * make-up of production, for one year.
 *
 * GENERATED by build-energy.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * US EIA International Energy Data (series last updated ${updated.slice(0, 10)}).
 * Primary energy, converted from quadrillion Btu at 293.07107 TWh per quad. The mix is
 * each fuel's share of production; parts under 0.5% are left out of the list.
 */
export const ENERGY_SOURCE = {
  label: "US EIA — International Energy Data",
  url: "https://www.eia.gov/international/data/world",
  retrieved: "${today}",
};

export interface CountryEnergy {
  y: string;
  totalUseTWh: number;
  totalProductionTWh: number;
  mix: { source: string; pct: number; color: string }[];
}

export const COUNTRY_ENERGY: Record<string, CountryEnergy> = {
${rows.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} countries (EIA updated ${updated.slice(0, 10)})`);
  console.log("  years: " + Object.entries(years).sort().map(([y, n]) => `${y}=${n}`).join("  "));
  if (mismatch.length) console.log("  left out, parts do not add up: " + mismatch.join("; "));
  console.log("  not covered: " + none.join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
