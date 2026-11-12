#!/usr/bin/env node
/**
 * Builds static/regional/statcan.json - Canada's provinces' and territories' own poverty, inequality, income and output,
 * as asked: Statistics Canada's tables, under the Statistics Canada Open Licence (any use, commercial included, with the
 * source credited). The full tables are fetched through its Web Data Service with no key, to data-raw/statcan/.
 *
 *   11-10-0135-01  Low income statistics: % of all persons below the Market Basket Measure (2023 base) - Canada's
 *                  Official Poverty Line
 *   11-10-0134-01  Gini coefficients of adjusted after-tax income
 *   11-10-0190-01  Median after-tax income, economic families and persons not in an economic family (constant dollars)
 *   36-10-0222-01  Gross domestic product at market prices, current prices (expenditure-based, provincial and territorial)
 *
 * A province is matched to the site's division by its name, exactly. For each figure, the latest year; a value Statistics
 * Canada marks too unreliable to publish ("F") has no value and is left out, and one it marks "E" is said to be for use
 * with caution, as it says.
 *
 *   node build-regional-statcan.cjs
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const RAW = path.join(__dirname, "data-raw/statcan");
const OUT = path.join(__dirname, "static/regional/statcan.json");
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

function table(id) {
  const zip = path.join(RAW, `${id}.zip`);
  if (!fs.existsSync(zip) || Date.now() - fs.statSync(zip).mtimeMs > 20 * 3600e3) {
    const meta = JSON.parse(execFileSync("curl", ["-s", "--max-time", "120", "-A", UA, `https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/${id}/en`]).toString());
    if (meta.status !== "SUCCESS") throw new Error(`${id}: ${JSON.stringify(meta).slice(0, 200)}`);
    execFileSync("curl", ["-sL", "--fail", "--max-time", "300", "-A", UA, "-o", zip, meta.object]);
  }
  const dir = path.join(RAW, id);
  execFileSync("unzip", ["-o", "-q", zip, "-d", dir]);
  const text = fs.readFileSync(path.join(dir, `${id}.csv`), "utf8").replace(/^﻿/, "");
  const rows = [];
  let row = [],
    cell = "",
    q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") row.push(cell), (cell = "");
    else if (c === "\n") row.push(cell), rows.push(row), (row = []), (cell = "");
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 5).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const DEFS = {
  poverty: { label: "Poverty: below Canada's official poverty line", part: "Society", unit: "pct", say: "of all people, below the Market Basket Measure (2023 base)" },
  gini: { label: "Inequality (Gini)", part: "Society", unit: "gini", say: "of adjusted after-tax income; it gives it from 0 to 1, shown here out of 100" },
  income: { label: "Median after-tax income", part: "Economy", unit: "cad", say: "of families and people on their own, in constant dollars of the latest year" },
  gdp: { label: "GDP", part: "Economy", unit: "cad_millions", say: "at market prices, current dollars" },
};
const TAKE = [
  ["11100135", "poverty", (r) => r["Persons in low income"] === "All persons" && r["Low income lines"] === "Market basket measure, 2023 base" && r.Statistics === "Percentage of persons in low income"],
  ["11100134", "gini", (r) => r["Income concept"] === "Adjusted after-tax income"],
  ["11100190", "income", (r) => r["Income concept"] === "Median after-tax income" && r["Economic family type"] === "Economic families and persons not in an economic family"],
  ["36100222", "gdp", (r) => r.Prices === "Current prices" && r.Estimates === "Gross domestic product at market prices"],
];
const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const sites = [];
for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
  const s = line.trim().replace(/,$/, "");
  if (!s.startsWith('"{')) continue;
  const d = JSON.parse(JSON.parse(s));
  if (d.cc === "CA") sites.push(d);
}
const out = {};
const notes = [];
for (const [id, key, take] of TAKE) {
  const best = new Map();
  for (const r of table(id)) {
    if (!take(r) || r.VALUE === "" || /F/.test(r.STATUS ?? "")) continue;
    const y = parseInt(r.REF_DATE, 10);
    const v = Number(r.VALUE);
    if (!Number.isFinite(y) || !Number.isFinite(v)) continue;
    const was = best.get(r.GEO);
    if (!was || y > was[0]) best.set(r.GEO, [y, v, ...(/E/.test(r.STATUS ?? "") ? ["E"] : [])]);
  }
  for (const d of sites) {
    const hits = [...best.keys()].filter((g) => fold(g) === fold(d.name));
    if (hits.length !== 1) {
      notes.push(`${key}: ${d.name} ${hits.length ? "twice" : "not published"}`);
      continue;
    }
    const e = (out[d.id] ??= { code: hits[0], name: hits[0], figures: {} });
    e.figures[key] = best.get(hits[0]);
  }
}
fs.writeFileSync(
  OUT,
  JSON.stringify({
    agency: "Statistics Canada",
    source: { label: "Statistics Canada — tables 11-10-0135-01, 11-10-0134-01, 11-10-0190-01 and 36-10-0222-01 (Statistics Canada Open Licence)", url: "https://www150.statcan.gc.ca/n1/en/type/data" },
    flags: { E: "to be used with caution, as Statistics Canada marks it" },
    defs: DEFS,
    divisions: out,
  }),
);
console.log(`Statistics Canada: ${Object.keys(out).length} of ${sites.length} divisions`);
for (const [id, e] of Object.entries(out)) console.log(id, JSON.stringify(e.figures));
console.log("Not held:", notes.join("; "));
