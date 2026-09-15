/**
 * Cross-references the numbers in countriesData.ts against the World Bank.
 *
 * This does not change anything. It reads what the site claims, fetches the
 * same measure from a body that publishes it, and prints where the two
 * disagree by more than a tolerance chosen per field. The point is to find out
 * which hand-written figures are wrong, and by how much, before deciding what
 * to do about them.
 *
 * Tolerances are deliberately generous. These fields move year to year and the
 * site does not say which year it means, so anything within the band is
 * treated as plausibly a different vintage rather than an error. What the
 * report is for is the rest: figures that no recent year would support.
 *
 *   node audit-countries.cjs            # summary
 *   node audit-countries.cjs --all      # every mismatch, not just the worst
 *   node audit-countries.cjs --field=gdp
 */
const os = require("os");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-audit");
fs.mkdirSync(CACHE, { recursive: true });

/**
 * Each field: the World Bank series that measures the same thing, how to get
 * from their unit to the site's, and how far apart the two may be before it is
 * worth reporting.
 *
 * `tol` is a fraction for ratio comparisons, `abs` an absolute difference for
 * fields where a ratio is meaningless near zero (growth, inflation).
 */
const FIELDS = {
  population: { code: "SP.POP.TOTL", conv: (v) => v, tol: 0.05, label: "population" },
  gdp: { code: "NY.GDP.MKTP.CD", conv: (v) => v / 1e9, tol: 0.15, label: "GDP (US$bn)" },
  gdpPerCapita: { code: "NY.GDP.PCAP.CD", conv: (v) => v, tol: 0.2, label: "GDP per capita (US$)" },
  gdpGrowth: { code: "NY.GDP.MKTP.KD.ZG", conv: (v) => v, abs: 3, label: "GDP growth (%)" },
  lifeExpectancy: { code: "SP.DYN.LE00.IN", conv: (v) => v, abs: 3, label: "life expectancy (yrs)" },
  unemploymentRate: { code: "SL.UEM.TOTL.ZS", conv: (v) => v, abs: 4, label: "unemployment (%)" },
  inflationRate: { code: "FP.CPI.TOTL.ZG", conv: (v) => v, abs: 5, label: "inflation (%)" },
  areaKm2: { code: "AG.SRF.TOTL.K2", conv: (v) => v, tol: 0.1, label: "area (km2)" },
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

async function series(code) {
  const at = path.join(CACHE, code + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=6&per_page=25000`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || !json[1]) throw new Error(`${code}: no rows`);
  const out = {};
  for (const row of json[1]) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    const id = row.country.id;
    if (!out[id] || +row.date > +out[id].year) out[id] = { v: row.value, year: row.date };
  }
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

(async () => {
  const args = process.argv.slice(2);
  const showAll = args.includes("--all");
  const only = (args.find((a) => a.startsWith("--field=")) || "").split("=")[1];

  const countries = loadCountries();
  const report = [];
  const summary = [];

  for (const [field, spec] of Object.entries(FIELDS)) {
    if (only && field !== only) continue;
    const wb = await series(spec.code);

    let checked = 0, missingSite = 0, missingWb = 0;
    const bad = [];
    for (const c of countries) {
      const mine = c[field];
      if (typeof mine !== "number" || !Number.isFinite(mine)) { missingSite++; continue; }
      const theirs = wb[c.code];
      if (!theirs) { missingWb++; continue; }
      checked++;
      const ref = spec.conv(theirs.v);
      const diff = mine - ref;
      const off =
        spec.abs !== undefined
          ? Math.abs(diff) > spec.abs
          : ref === 0
            ? mine !== 0
            : Math.abs(diff / ref) > spec.tol;
      if (off) {
        bad.push({
          name: c.name,
          code: c.code,
          mine,
          ref,
          year: theirs.year,
          ratio: ref ? mine / ref : Infinity,
          diff,
        });
      }
    }
    bad.sort((a, b) =>
      spec.abs !== undefined ? Math.abs(b.diff) - Math.abs(a.diff) : Math.abs(Math.log(b.ratio || 1)) - Math.abs(Math.log(a.ratio || 1)),
    );
    summary.push({ field, label: spec.label, checked, bad: bad.length, missingSite, missingWb });
    report.push({ field, spec, bad });
  }

  console.log("\n=== cross-reference: countriesData.ts vs World Bank ===\n");
  console.log("  field".padEnd(24) + "checked".padStart(8) + "outside band".padStart(14) + "  no site value  no WB value");
  for (const s of summary) {
    console.log(
      "  " + s.label.padEnd(22) +
      String(s.checked).padStart(8) +
      String(s.bad).padStart(14) +
      String(s.missingSite).padStart(15) +
      String(s.missingWb).padStart(13),
    );
  }

  for (const { field, spec, bad } of report) {
    if (!bad.length) continue;
    const show = showAll ? bad : bad.slice(0, 12);
    console.log(`\n--- ${spec.label} — ${bad.length} outside the band (${spec.abs !== undefined ? `>${spec.abs} apart` : `>${Math.round(spec.tol * 100)}% apart`})`);
    for (const b of show) {
      const fmt = (v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : +v.toFixed(2));
      console.log(
        `  ${b.name.padEnd(26)} site ${String(fmt(b.mine)).padStart(14)}   WB ${String(fmt(b.ref)).padStart(14)} (${b.year})` +
        (spec.abs !== undefined ? `   diff ${b.diff > 0 ? "+" : ""}${b.diff.toFixed(1)}` : `   ${b.ratio.toFixed(2)}x`),
      );
    }
    if (!showAll && bad.length > show.length) console.log(`  ... and ${bad.length - show.length} more (--all to list)`);
  }
  console.log("\nNothing was changed. This only reports.");
})().catch((e) => { console.error(e); process.exit(1); });
