/**
 * Builds src/data/stateFinance.ts — what each US state government spends, by
 * function, and what it raises in taxes, from the Census Bureau's Annual
 * Survey of State Government Finances.
 *
 * What this is for. The Policy page showed, on every state's cards, an
 * "allocated" amount, a share and a score that a random-number function
 * produced. These are the published figures that take their place: a state
 * government's general expenditure on education, public welfare, hospitals,
 * health, highways, police, correction, natural resources, parks and
 * administration, in thousands of dollars as the Bureau publishes them.
 *
 * Source: the survey's "State Totals" table (one workbook, a column a
 * state). The Bureau has not published a later year than the one in URL;
 * when it does, change the year here and re-run. An "X" in the table is a
 * figure the Bureau does not have, and is left out rather than read as zero.
 *
 * State government only: spending by counties, cities and school districts
 * is not in it, which matters most for education and police, where local
 * government spends much of the money. The page says so.
 *
 *   node build-state-finance.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const YEAR = 2023;
const URL = `https://www2.census.gov/programs-surveys/state/tables/${YEAR}/${YEAR}%20ASFIN%20State%20Totals.xlsx`;
const PAGE = "https://www.census.gov/programs-surveys/state.html";
const OUT = path.join(__dirname, "src/data/stateFinance.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-statefin");
fs.mkdirSync(CACHE, { recursive: true });

/** The rows read, by the label the table gives them: the first match after `after`, where a label repeats. */
const ROWS = [
  ["totalExpenditure", "Total expenditure"],
  ["generalExpenditure", "General expenditure"],
  ["education", "Education"],
  ["publicWelfare", "Public welfare"],
  ["hospitals", "Hospitals"],
  ["health", "Health"],
  ["highways", "Highways"],
  ["police", "Police protection"],
  ["correction", "Correction"],
  ["naturalResources", "Natural resources"],
  ["parks", "Parks and recreation"],
  ["administration", "Governmental administration"],
  ["interest", "Interest on general debt"],
  ["other", "Other and unallocable"],
  ["totalTaxes", "Total Taxes"],
  ["salesTaxes", "General Sales and Gross Receipts Taxes"],
  ["individualIncomeTaxes", "Individual Income Taxes"],
  ["corporateIncomeTaxes", "Corporations Net Income Taxes"],
  ["federalAndLocalGrants", "Intergovernmental revenue"],
  ["debt", "Debt at end of fiscal year"],
];

function loadStates() {
  const bundle = path.join(CACHE, "statesData.cjs");
  execSync(`npx esbuild src/data/statesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).usStatesData;
}

(async () => {
  const at = path.join(CACHE, `asfin${YEAR}.xlsx`);
  if (!fs.existsSync(at)) {
    const res = await fetch(URL, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${URL}: HTTP ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  const { rows } = readXlsx(at);
  if (!new RegExp(`State Government Finances by State: ${YEAR}`).test(rows[0]?.[0] ?? "")) throw new Error(`not the ${YEAR} table: ${rows[0]?.[0]}`);
  const head = rows.findIndex((r) => r[1] === "United States" && r[2] === "Alabama");
  if (head < 0) throw new Error("no header row of states");
  const revised = (rows.find((r) => /^Last Revised/.test(r[0] ?? ""))?.[0] ?? "").replace(/^Last Revised:\s*/, "");

  // The table sets its labels with non-breaking spaces, inside them as well as before.
  const label = (r) => (r[0] ?? "").replace(/\s+/g, " ").trim();
  const find = (name) => {
    const hits = rows.filter((r) => label(r) === name);
    if (!hits.length) throw new Error(`no row "${name}"`);
    // "Total expenditure" and "General expenditure" appear twice with the same figures; every other label once.
    if (hits.length > 1 && hits.some((h) => h.slice(1).join("|") !== hits[0].slice(1).join("|"))) throw new Error(`"${name}" appears ${hits.length} times with different figures`);
    return hits[0];
  };
  const num = (v) => (v === undefined || v === "" || v === "X" ? null : Number(String(v).replace(/,/g, "")));

  const states = loadStates();
  const byName = new Map(states.map((s) => [s.name, s.id]));
  const out = {};
  const picked = ROWS.map(([key, name]) => [key, find(name)]);
  rows[head].forEach((raw, col) => {
    if (col === 0) return;
    const name = String(raw).replace(/\s+/g, " ").trim();
    const id = name === "United States" ? "us" : byName.get(name);
    if (!id) throw new Error(`no state called "${name}"`);
    const e = {};
    for (const [key, row] of picked) {
      const v = num(row[col]);
      if (v !== null) {
        if (!Number.isFinite(v) || v < 0) throw new Error(`${name} ${key}: ${row[col]}`);
        e[key] = v;
      }
    }
    out[id] = e;
  });
  if (Object.keys(out).length !== 51) throw new Error(`${Object.keys(out).length} columns, expected the United States and 50 states`);

  // The functions must add to general expenditure: the table is read right only if they do.
  const FUNCTIONS = ["education", "publicWelfare", "hospitals", "health", "highways", "police", "correction", "naturalResources", "parks", "administration", "interest", "other"];
  for (const [id, e] of Object.entries(out)) {
    const sum = FUNCTIONS.reduce((t, k) => t + (e[k] ?? 0), 0);
    if (Math.abs(sum - e.generalExpenditure) > Math.max(2, e.generalExpenditure * 1e-6)) throw new Error(`${id}: functions sum to ${sum}, general expenditure is ${e.generalExpenditure}`);
  }

  fs.writeFileSync(
    OUT,
    `/**
 * What each US state government spends, by function, and what it raises in
 * taxes: fiscal year ${YEAR}, in thousands of dollars, as the Census Bureau
 * publishes them.
 *
 * GENERATED by build-state-finance.cjs on ${new Date().toISOString().slice(0, 10)} — do not edit by hand;
 * change the script and re-run it. See that script for the source and what
 * it does and does not cover: state government only, not counties, cities or
 * school districts. A figure the Bureau marks as not available is absent.
 * The twelve functions add up to \`generalExpenditure\` (checked by the script).
 */
export const STATE_FINANCE_YEAR = ${YEAR};
export const STATE_FINANCE_SOURCE = {
  label: "US Census Bureau — ${YEAR} Annual Survey of State Government Finances${revised ? `, revised ${revised}` : ""}",
  url: "${PAGE}",
};
export const STATE_FINANCE_RETRIEVED = "${new Date().toISOString().slice(0, 10)}";

export type StateFinanceKey =
${ROWS.map(([k]) => `  | "${k}"`).join("\n")};

/** By lowercase state code, as statesData.ts keys them; "us" is all fifty states together. Thousands of dollars. */
export const STATE_FINANCE: Record<string, Partial<Record<StateFinanceKey, number>>> = {
${Object.entries(out)
  .map(([id, e]) => `  ${JSON.stringify(id)}: ${JSON.stringify(e)},`)
  .join("\n")}
};
`,
  );
  const ca = out.ca;
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length - 1} states and the US, FY${YEAR}${revised ? `, revised ${revised}` : ""}`);
  console.log(`  CA: general $${(ca.generalExpenditure / 1e6).toFixed(1)}bn; education $${(ca.education / 1e6).toFixed(1)}bn (${((100 * ca.education) / ca.generalExpenditure).toFixed(1)}%); welfare $${(ca.publicWelfare / 1e6).toFixed(1)}bn; highways $${(ca.highways / 1e6).toFixed(1)}bn`);
  const gaps = Object.entries(out).flatMap(([id, e]) => ROWS.filter(([k]) => e[k] === undefined).map(([k]) => `${id}.${k}`));
  console.log(`  not available: ${gaps.length ? gaps.join(", ") : "none"}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
