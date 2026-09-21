/**
 * build-other-producers.cjs
 *
 * Country tables for the two commodity cards that neither USGS nor the energy
 * sources cover — Uranium and Wheat — in the shared shape
 * (resourceProducerTypes.ts). Written to src/data/otherProducers.ts.
 *
 * Uranium.
 *   production  World Nuclear Association, "World Uranium Mining Production",
 *               tonnes of uranium by country, latest year. WNA marks some
 *               countries' figures "(est.)"; that mark is kept.
 *   resources   the same association's "Supply of Uranium" page, which
 *               reproduces the OECD NEA / IAEA "Red Book" (Uranium 2024:
 *               Resources, Production and Demand): identified recoverable
 *               resources to $130/kgU at 1 January 2023.
 *   Both are read from the pages' HTML tables, row by row.
 *
 * Wheat. US Department of Agriculture, Foreign Agricultural Service,
 *   Production, Supply and Distribution database (PSD), bulk file
 *   psd_grains_pulses_csv.zip: production and exports, in thousand tonnes,
 *   for the latest completed marketing year — the one before the newest,
 *   which is still a projection. There is no world row; the world is the sum
 *   of every country USDA lists. USDA counts the European Union as one.
 *   Wheat has no reserves in the mining sense, so its second column is
 *   exports, which is what the card's headline measures.
 *
 *   node build-other-producers.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/otherProducers.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-other-producers");
fs.mkdirSync(CACHE, { recursive: true });

const WNA_PROD = "https://world-nuclear.org/information-library/nuclear-fuel-cycle/mining-of-uranium/world-uranium-mining-production";
const WNA_SUPPLY = "https://world-nuclear.org/information-library/nuclear-fuel-cycle/uranium-resources/supply-of-uranium";
const PSD = "https://apps.fas.usda.gov/psdonline/downloads/psd_grains_pulses_csv.zip";
const TOP = 20;

async function get(url, file) {
  const at = path.join(CACHE, file);
  if (fs.existsSync(at)) return fs.readFileSync(at);
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(at, buf);
  return buf;
}

/** An HTML page as "|"-separated cells, tags removed. */
const cells = (html) =>
  html
    .replace(/<[^>]+>/g, "|")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c !== "");

const num = (c) => /^[\d,]+$/.test(c);
const n = (c) => Number(c.replace(/,/g, ""));
const share = (v, w) => ({ pct: Math.round((v / w) * 1000) / 10, bound: "exact" });

const NAME = { USA: "United States" };

async function uranium() {
  // Production: the header row "Country|2015|...|<latest>", then one row per
  // country with the same number of years, ending at "World total tU".
  const p = cells((await get(WNA_PROD, "wna-production.html")).toString("utf8"));
  const h = p.indexOf("Country");
  let years = [];
  for (let i = h + 1; /^\d{4}$/.test(p[i]); i++) years.push(p[i]);
  if (years.length < 5) throw new Error("WNA production: header not found");
  const latestYear = years[years.length - 1];
  const prod = {};
  const estimated = [];
  let worldProd = null;
  for (let i = h + 1 + years.length; i < p.length; i++) {
    const label = p[i];
    const vals = p.slice(i + 1, i + 1 + years.length);
    if (vals.length < years.length || !vals.every(num)) continue;
    const v = n(vals[vals.length - 1]);
    if (/^World total/.test(label)) {
      worldProd = v;
      break;
    }
    const est = /\(est\.\)/.test(label);
    const name = NAME[label.replace(/\s*\(est\.\)\s*/, "")] || label.replace(/\s*\(est\.\)\s*/, "");
    if (name !== "Others") {
      prod[name] = v;
      if (est) estimated.push(name);
    }
    i += years.length;
  }
  if (!worldProd || Object.keys(prod).length < 8) throw new Error("WNA production: table incomplete");

  // Resources: "tonnes U|percentage of world" then "Name|value|pct%" rows to
  // "World total".
  const s = cells((await get(WNA_SUPPLY, "wna-supply.html")).toString("utf8"));
  const r0 = s.findIndex((c, i) => c === "tonnes U" && s[i + 1] === "percentage of world");
  if (r0 < 0) throw new Error("WNA supply: resources table not found");
  const res = {};
  let worldRes = null;
  for (let i = r0 + 2; i < s.length - 1; i++) {
    if (!num(s[i + 1])) continue;
    const label = s[i];
    const v = n(s[i + 1]);
    if (/^World total/.test(label)) {
      worldRes = v;
      break;
    }
    if (label !== "Other") res[NAME[label] || label] = v;
  }
  if (!worldRes || Object.keys(res).length < 8) throw new Error("WNA supply: table incomplete");
  // The note under the table names the Red Book edition and the date.
  const note = s.find((c) => /Identified resources recoverable/.test(c)) || "";
  const asAt = (/(\d{1,2}\/\d{1,2}\/\d{2})/.exec(note) || [])[1];
  if (!asAt) throw new Error("WNA supply: resources date not found");

  const names = new Set([...Object.keys(prod), ...Object.keys(res)]);
  const countries = [...names]
    .map((name) => ({
      name,
      production: prod[name] !== undefined ? { value: prod[name], lowerBound: false } : null,
      productionShare: prod[name] !== undefined ? share(prod[name], worldProd) : null,
      reserves: res[name] !== undefined ? { value: res[name], lowerBound: false } : null,
      reservesShare: res[name] !== undefined ? share(res[name], worldRes) : null,
    }))
    .sort((a, b) => (b.production?.value ?? -1) - (a.production?.value ?? -1) || (b.reserves?.value ?? 0) - (a.reserves?.value ?? 0));

  return {
    measure: "Uranium mine production, tonnes of uranium (World Nuclear Association); identified recoverable resources to $130/kgU (OECD NEA & IAEA Red Book)",
    productionYear: latestYear,
    reservesYear: `1 Jan 20${asAt.slice(-2)}`,
    productionUnit: "t",
    reservesUnit: "t",
    reservesLabel: "Resources",
    worldProduction: { value: worldProd, lowerBound: false },
    worldReserves: { value: worldRes, lowerBound: false },
    countries,
    estimated,
    sources: [
      { label: "World Nuclear Association — World Uranium Mining Production", url: WNA_PROD },
      { label: "OECD NEA & IAEA — Uranium 2024 (Red Book), via World Nuclear Association", url: WNA_SUPPLY },
    ],
    notes: [
      "Resources are what is identified and recoverable at up to $130 per kilogram of uranium; at up to $260/kg the world figure is larger.",
      ...(estimated.length ? [`Production figures for ${estimated.join(", ")} are the World Nuclear Association's estimates.`] : []),
    ],
  };
}

async function wheat() {
  const csv = unzip(await (async () => {
    const at = path.join(CACHE, "psd_grains_pulses_csv.zip");
    await get(PSD, "psd_grains_pulses_csv.zip");
    return at;
  })())
    .get("psd_grains_pulses.csv")
    .toString("utf8");
  const rows = csv
    .split(/\r?\n/)
    .slice(1)
    .map((l) => (l.match(/("[^"]*"|[^,]+)/g) || []).map((c) => c.replace(/^"|"$/g, "")))
    .filter((r) => r[1] === "Wheat");
  const years = [...new Set(rows.map((r) => Number(r[4])))].sort((a, b) => a - b);
  // The newest marketing year is USDA's projection; the one before it is the
  // latest estimate of a harvest that has happened.
  const my = years[years.length - 2];
  const at = rows.filter((r) => Number(r[4]) === my);
  const pick = (attr) => {
    const o = {};
    for (const r of at) if (r[8] === attr) o[r[3]] = Number(r[11]) * 1000; // thousand t -> t
    return o;
  };
  const prod = pick("Production");
  const exp = pick("Exports");
  const worldP = Object.values(prod).reduce((a, b) => a + b, 0);
  const worldE = Object.values(exp).reduce((a, b) => a + b, 0);
  if (Object.keys(prod).length < 50) throw new Error("USDA PSD: wheat table incomplete");

  const all = [...new Set([...Object.keys(prod), ...Object.keys(exp)])].map((name) => ({
    name,
    p: prod[name] ?? 0,
    e: exp[name] ?? 0,
  }));
  const keep = new Set([
    ...[...all].sort((a, b) => b.p - a.p).slice(0, TOP).map((c) => c.name),
    ...[...all].sort((a, b) => b.e - a.e).slice(0, TOP).map((c) => c.name),
  ]);
  const countries = all
    .filter((c) => keep.has(c.name))
    .sort((a, b) => b.p - a.p)
    .map((c) => ({
      name: c.name,
      production: c.p > 0 ? { value: c.p, lowerBound: false } : null,
      productionShare: c.p > 0 ? share(c.p, worldP) : null,
      reserves: c.e > 0 ? { value: c.e, lowerBound: false } : null,
      reservesShare: c.e > 0 ? share(c.e, worldE) : null,
    }));

  const label = `${my}/${String(my + 1).slice(-2)}`;
  return {
    measure: `Wheat production and exports, marketing year ${label} (USDA estimate)`,
    productionYear: label,
    reservesYear: label,
    productionUnit: "t",
    reservesUnit: "t",
    reservesLabel: "Exports",
    worldProduction: { value: worldP, lowerBound: false },
    worldReserves: { value: worldE, lowerBound: false },
    countries,
    sources: [{ label: "USDA FAS — Production, Supply and Distribution (PSD)", url: "https://apps.fas.usda.gov/psdonline/app/index.html" }],
    notes: [
      "USDA counts the European Union as a single producer and exporter.",
      "World figures are the sum of every country USDA lists.",
    ],
  };
}

(async () => {
  const out = { Uranium: await uranium(), Wheat: await wheat() };
  const retrieved = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Producing countries for the uranium and wheat cards.
 *
 * GENERATED by build-other-producers.cjs on ${retrieved} — do not edit by
 * hand; change the script and re-run it. See that script for the sources.
 */
import type { ResourceProducers } from "./resourceProducerTypes";

export const OTHER_PRODUCERS: Record<string, ResourceProducers> = ${JSON.stringify(out, null, 2)};
`,
  );
  console.log(`wrote ${OUT}`);
  for (const [k, v] of Object.entries(out)) {
    const tp = v.countries[0];
    const tr = [...v.countries].sort((a, b) => (b.reserves?.value ?? 0) - (a.reserves?.value ?? 0))[0];
    console.log(`  ${k}: ${v.countries.length} countries, ${v.productionYear}; world ${Math.round(v.worldProduction.value).toLocaleString()} t; top ${tp.name} ${tp.productionShare.pct}%; ${v.reservesLabel} top ${tr.name} ${tr.reservesShare.pct}%${v.estimated?.length ? "; est: " + v.estimated.join(", ") : ""}`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
