#!/usr/bin/env node
/**
 * Builds static/regional/abs.json - Australia's states' and territories' own income and housing figures, as asked: the
 * Australian Bureau of Statistics' "Data by region" (ABS_REGIONAL_ASGS2021), CC BY 4.0, from its data API with no key.
 *
 *   INCOME_2  Median employee income, a year (from tax returns)
 *   EQUIV_2   Median equivalised total household income, a week (Census)
 *   RENT_4    Median weekly household rent (Census)
 *   HOUSES_3  Median price of established house transfers
 *
 * ABS publishes no Gini index or poverty rate in these regional data, so none is held; unemployment is the OECD's, more
 * recent than the Census's. A state is matched to the site's division by its name, exactly. For each, the latest year.
 *
 *   node build-regional-abs.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-abs");
const OUT = path.join(__dirname, "static/regional/abs.json");
fs.mkdirSync(CACHE, { recursive: true });

const DEFS = {
  employeeIncome: { label: "Median employee income", part: "Economy", unit: "aud", say: "a year, of people earning a wage or salary, from their tax returns" },
  householdIncome: { label: "Median household income", part: "Economy", unit: "aud", say: "a week, for a household's size (equivalised), at the Census" },
  rent: { label: "Median rent", part: "Economy", unit: "aud", say: "a week, a household's, at the Census" },
  housePrice: { label: "Median house price", part: "Economy", unit: "aud", say: "of established houses sold in the year" },
};
const CODES = { INCOME_2: "employeeIncome", EQUIV_2: "householdIncome", RENT_4: "rent", HOUSES_3: "housePrice" };

const file = path.join(CACHE, "ste.csv");
if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3))
  execFileSync("curl", [
    "-sL",
    "--fail",
    "--max-time",
    "300",
    "-A",
    UA,
    "-H",
    "Accept: application/vnd.sdmx.data+csv;labels=both",
    "-o",
    file,
    `https://data.api.abs.gov.au/rest/data/ABS,ABS_REGIONAL_ASGS2021,1.7.0/${Object.keys(CODES).join("+")}.STE..A?startPeriod=2011`,
  ]);
const text = fs.readFileSync(file, "utf8");
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
  else if (c !== "\r" && c !== "﻿") cell += c;
}
if (cell || row.length) row.push(cell), rows.push(row);
const head = rows[0];
const col = (prefix) => head.findIndex((h) => h.startsWith(prefix));
const [cM, cR, cT, cV] = [col("MEASURE"), col("ASGS_2021"), col("TIME_PERIOD"), col("OBS_VALUE")];
if ([cM, cR, cT, cV].some((i) => i < 0)) throw new Error(`ABS: columns not as expected: ${head.join(",")}`);

const best = new Map(); // state name -> {key: [y, v]}
for (const r of rows.slice(1)) {
  if (r.length < head.length - 2) continue;
  const key = CODES[(r[cM] ?? "").split(":")[0]];
  const state = (r[cR] ?? "").replace(/^[^:]*:\s*/, "");
  const y = parseInt(r[cT], 10);
  const v = Number(r[cV]);
  if (!key || !state || r[cV] === "" || !Number.isFinite(y) || !Number.isFinite(v)) continue;
  const s = best.get(state) ?? best.set(state, {}).get(state);
  if (!s[key] || y > s[key][0]) s[key] = [y, v];
}

const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const out = {};
for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
  const s = line.trim().replace(/,$/, "");
  if (!s.startsWith('"{')) continue;
  const d = JSON.parse(JSON.parse(s));
  if (d.cc !== "AU") continue;
  const hits = [...best.keys()].filter((k) => fold(k) === fold(d.name));
  if (hits.length === 1) out[d.id] = { code: hits[0], name: hits[0], figures: best.get(hits[0]) };
  else console.log(`Not held: ${d.name}`);
}
fs.writeFileSync(
  OUT,
  JSON.stringify({
    agency: "the Australian Bureau of Statistics",
    source: { label: "Australian Bureau of Statistics — Data by region, ASGS Edition 3 (CC BY 4.0)", url: "https://www.abs.gov.au/methodologies/data-region-methodology/2011-25" },
    defs: DEFS,
    divisions: out,
  }),
);
console.log(`ABS: ${Object.keys(out).length} divisions`);
for (const [id, e] of Object.entries(out)) console.log(id, JSON.stringify(e.figures));
