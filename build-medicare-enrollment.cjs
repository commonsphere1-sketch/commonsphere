#!/usr/bin/env node
/**
 * Builds static/us/medicare.json - how many of each US county's and state's people are on Medicare, as asked: the
 * Centers for Medicare & Medicaid Services' Medicare Monthly Enrollment (public domain), from data.cms.gov's API with no key.
 *
 * For the latest month published: everyone enrolled (TOT_BENES), those in Original Medicare (ORGNL_MDCR_BENES) and those
 * in Medicare Advantage or another health plan (MA_AND_OTH_BENES), and those also enrolled in Medicaid - "dual eligible"
 * (DUAL_TOT_BENES). CMS suppresses a small count, which is left out, not guessed.
 *
 *   node build-medicare-enrollment.cjs
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const OUT = path.join(__dirname, "static/us/medicare.json");
const API = "https://data.cms.gov/data-api/v1/dataset/d7fabe1e-d19b-4333-9eff-e80e0643f2fd/data";
const get = (q) => JSON.parse(execFileSync("curl", ["-s", "-g", "--fail", "--max-time", "300", "-A", UA, `${API}?${q}`], { maxBuffer: 256 * 1024 * 1024 }).toString());
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The latest month published, read from the nation's own rows.
const nation = get("filter[BENE_GEO_LVL]=National&size=5000");
const latest = nation
  .filter((r) => MONTHS.includes(r.MONTH))
  .sort((a, b) => +b.YEAR - +a.YEAR || MONTHS.indexOf(b.MONTH) - MONTHS.indexOf(a.MONTH))[0];
const year = latest.YEAR;
const month = latest.MONTH;
console.log(`Latest month: ${month} ${year}`);

const num = (v) => (v != null && /^\d+$/.test(String(v).trim()) ? Number(v) : null);
const row = (r) => [num(r.TOT_BENES), num(r.ORGNL_MDCR_BENES), num(r.MA_AND_OTH_BENES), num(r.DUAL_TOT_BENES)];
function level(lvl) {
  const out = [];
  for (let offset = 0; ; offset += 5000) {
    const page = get(`filter[BENE_GEO_LVL]=${lvl}&filter[YEAR]=${year}&filter[MONTH]=${month}&size=5000&offset=${offset}`);
    out.push(...page);
    if (page.length < 5000) break;
  }
  return out;
}
const counties = {};
for (const r of level("County")) if (/^\d{5}$/.test(r.BENE_FIPS_CD ?? "")) counties[r.BENE_FIPS_CD] = row(r);
const states = {};
for (const r of level("State")) if (r.BENE_STATE_ABRVTN) states[r.BENE_STATE_ABRVTN] = row(r);
fs.writeFileSync(
  OUT,
  JSON.stringify({
    source: { label: `Centers for Medicare & Medicaid Services — Medicare Monthly Enrollment, ${month} ${year} (public domain)`, url: "https://data.cms.gov/summary-statistics-on-beneficiary-enrollment/medicare-and-medicaid-reports/medicare-monthly-enrollment" },
    month: `${month} ${year}`,
    fields: ["total", "original", "advantage", "dual"],
    nation: row(latest),
    states,
    counties,
  }),
);
console.log(`Medicare: ${Object.keys(counties).length} counties, ${Object.keys(states).length} states; Montgomery MD ${JSON.stringify(counties["24031"])}; nation ${JSON.stringify(row(latest))}`);
