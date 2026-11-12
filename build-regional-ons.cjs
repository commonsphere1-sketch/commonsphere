#!/usr/bin/env node
/**
 * Builds static/regional/ons.json - the UK's local authorities' own output and well-being, as asked: the Office for
 * National Statistics, under the Open Government Licence v3.0 (any use, commercial included, with the source credited),
 * from its dataset API with no key.
 *
 *   gdp-by-local-authority      GDP per head at current market prices (the latest year this release holds)
 *   wellbeing-local-authority   Life satisfaction, average (mean) on a scale of 0 to 10, Annual Population Survey
 *
 * Only local authorities' own codes (E06-E09, W06, S12, N09) are read, never a region's or a country's. A local authority
 * is matched to the site's division by its name, exactly ("Bristol, City of" is Bristol); a division drawn on older lines
 * (Northern Ireland's districts before 2015, Bournemouth before 2019) answers to no authority of today's, and is left out.
 * A value ONS marks - not available, low reliability, suppressed - is left out.
 *
 *   node build-regional-ons.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-ons");
const OUT = path.join(__dirname, "static/regional/ons.json");
fs.mkdirSync(CACHE, { recursive: true });

/** A dataset's latest version, as CSV rows with its header. */
function dataset(id) {
  const meta = JSON.parse(execFileSync("curl", ["-sL", "--max-time", "60", "-A", UA, `https://api.beta.ons.gov.uk/v1/datasets/${id}`]).toString());
  const latest = JSON.parse(execFileSync("curl", ["-sL", "--max-time", "60", "-A", UA, meta.links.latest_version.href]).toString());
  const file = path.join(CACHE, `${id}.csv`);
  if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3)) execFileSync("curl", ["-sL", "--fail", "--max-time", "300", "-A", UA, "-o", file, latest.downloads.csv.href]);
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
  return { head: rows[0], rows: rows.slice(1).filter((r) => r.length >= rows[0].length - 1), release: latest.release_date };
}

const LA = /^(E06|E07|E08|E09|W06|S12|N09)/;
const DEFS = {
  gdpPerHead: { label: "GDP per person", part: "Economy", unit: "gbp", say: "at current market prices" },
  lifeSatisfaction: { label: "Well-being: life satisfaction", part: "Society", unit: "score10", say: "on average, on a scale of 0 to 10, in the Annual Population Survey's year to March" },
};
const best = new Map(); // code -> { name, figures }
const put = (code, name, key, y, v) => {
  const e = best.get(code) ?? best.set(code, { name, figures: {} }).get(code);
  if (!e.figures[key] || y > e.figures[key][0]) e.figures[key] = [y, v];
};

{
  const { head, rows } = dataset("gdp-by-local-authority");
  const ix = (h) => head.indexOf(h);
  const [cV, cM, cY, cG, cN, cP] = [0, ix("Data Marking"), ix("calendar-years"), ix("administrative-geography"), ix("geography"), ix("type-of-prices")];
  for (const r of rows) {
    if (r[cP] !== "gross-domestic-product-per-head-at-current-market-prices" || !LA.test(r[cG] ?? "") || (r[cM] ?? "").trim()) continue;
    const v = Number(r[cV]);
    if (r[cV] !== "" && Number.isFinite(v)) put(r[cG], r[cN], "gdpPerHead", +r[cY], v);
  }
}
{
  const { head, rows } = dataset("wellbeing-local-authority");
  const ix = (h) => head.indexOf(h);
  const [cV, cM, cY, cG, cN, cW, cE] = [0, ix("Data marking"), ix("yyyy-yy"), ix("administrative-geography"), ix("Geography"), ix("measure-of-wellbeing"), ix("wellbeing-estimate")];
  for (const r of rows) {
    if (r[cW] !== "life-satisfaction" || r[cE] !== "average-mean" || !LA.test(r[cG] ?? "") || (r[cM] ?? "").trim()) continue;
    const v = Number(r[cV]);
    // "2022-23": the year to March 2023.
    const y = 2000 + parseInt((r[cY] ?? "").split("-")[1], 10);
    if (r[cV] !== "" && Number.isFinite(v) && Number.isFinite(y)) put(r[cG], r[cN], "lifeSatisfaction", y, v);
  }
}

const fold = (s) =>
  String(s)
    .replace(/,\s*(City|County) of$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const byName = new Map();
for (const [code, e] of best) (byName.get(fold(e.name)) ?? byName.set(fold(e.name), []).get(fold(e.name))).push([code, e]);
const out = {};
const missed = [];
for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
  const s = line.trim().replace(/,$/, "");
  if (!s.startsWith('"{')) continue;
  const d = JSON.parse(JSON.parse(s));
  if (d.cc !== "GB") continue;
  const hits = byName.get(fold(d.name)) ?? [];
  if (hits.length !== 1) {
    missed.push(d.name);
    continue;
  }
  out[d.id] = { code: hits[0][0], name: hits[0][1].name, figures: hits[0][1].figures };
}
fs.writeFileSync(
  OUT,
  JSON.stringify({
    agency: "the Office for National Statistics",
    source: { label: "Office for National Statistics — GDP by local authority, and personal well-being by local authority (Open Government Licence v3.0)", url: "https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossdomesticproductlocalauthorities" },
    flags: {},
    defs: DEFS,
    divisions: out,
  }),
);
console.log(`ONS: ${Object.keys(out).length} of the site's UK divisions; not matched (${missed.length}): ${missed.slice(0, 25).join(", ")}`);
for (const id of Object.keys(out).slice(0, 5)) console.log(id, JSON.stringify(out[id]));
