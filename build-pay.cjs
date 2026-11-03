#!/usr/bin/env node
/**
 * Builds static/pay/ and src/data/payMeta.ts - what each job pays, as asked: for the United States, each state and
 * territory, and each metropolitan and nonmetropolitan area.
 *
 *   US Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), May 2025 estimates, released
 *   15 May 2026 (public domain): for each occupation, the people employed in it (wage and salary jobs; the self-employed
 *   are not counted), the mean wage, and the wage at the 10th, 25th, 50th (the median), 75th and 90th percentiles - a
 *   year's pay, or for the few jobs BLS gives by the hour only (actors, dancers, musicians), an hour's.
 *   BLS's marks are kept: "#" a wage of $115.00 an hour or $239,200 a year or more, which BLS gives no closer, is written
 *   -1; "*" and "**", an estimate BLS does not publish, are null.
 *   Its area definitions say which area each county is in.
 *
 * The all-occupations total, the 22 major groups and the 830 detailed occupations are kept; the minor and broad groups
 * between them are left out.
 *
 *   static/pay/us.json          the occupations and major groups, and the nation's figures
 *   static/pay/areas.json       each area's name, state and kind, and each county's area
 *   static/pay/state/{AB}.json  a state's or territory's figures
 *   static/pay/area/{code}.json an area's figures
 *   static/pay/occ/{code}.json  one occupation in every state and area, for ranking them
 *
 *   node build-pay.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const CACHE = path.join(os.tmpdir(), "commonsphere-oews");
const OUT = path.join(__dirname, "static/pay");
const META = path.join(__dirname, "src/data/payMeta.ts");
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const YEAR = "M2025";
fs.mkdirSync(CACHE, { recursive: true });

function get(url, name) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file)) execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "600", "-A", UA, "-o", file, url]);
  return file;
}
function unzipped(zip, inner) {
  const file = path.join(CACHE, inner);
  if (!fs.existsSync(file)) execFileSync("unzip", ["-o", "-q", zip, "-d", CACHE]);
  if (!fs.existsSync(file)) throw new Error(`${inner} not in ${zip}`);
  return file;
}
const sheet = (file) => readXlsx(file, readXlsx(file).sheets[0]).rows;

const nat = sheet(unzipped(get("https://www.bls.gov/oes/special-requests/oesm25nat.zip", "oesm25nat.zip"), `oesm25nat/national_${YEAR}_dl.xlsx`));
const st = sheet(unzipped(get("https://www.bls.gov/oes/special-requests/oesm25st.zip", "oesm25st.zip"), `oesm25st/state_${YEAR}_dl.xlsx`));
const maZip = get("https://www.bls.gov/oes/special-requests/oesm25ma.zip", "oesm25ma.zip");
const msa = sheet(unzipped(maZip, `oesm25ma/MSA_${YEAR}_dl.xlsx`));
const bos = sheet(unzipped(maZip, `oesm25ma/BOS_${YEAR}_dl.xlsx`));
const defs = sheet(get("https://www.bls.gov/oes/area_definitions_m2025.xlsx", "area_definitions_m2025.xlsx"));

const HEAD = nat[0];
for (const [name, rows] of [["state", st], ["metro", msa], ["nonmetro", bos]]) if (rows[0].join() !== HEAD.join()) throw new Error(`${name} file's columns differ from the national file's`);
const col = (name) => {
  const i = HEAD.indexOf(name);
  if (i < 0) throw new Error(`no column ${name}`);
  return i;
};
const C = Object.fromEntries(["AREA", "AREA_TITLE", "AREA_TYPE", "PRIM_STATE", "NAICS", "OWN_CODE", "OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", "A_MEAN", "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90", "H_MEAN", "H_PCT10", "H_PCT25", "H_MEDIAN", "H_PCT75", "H_PCT90", "HOURLY"].map((n) => [n, col(n)]));
const KEEP = new Set(["total", "major", "detailed"]);

// ── The occupations, by the national file ──
const OCC = [];
const occIdx = new Map();
const MAJORS = [];
for (const r of nat.slice(1)) {
  if (r[C.NAICS] !== "000000" || !KEEP.has(r[C.O_GROUP])) continue;
  const code = r[C.OCC_CODE];
  if (r[C.O_GROUP] === "major") MAJORS.push([code, r[C.OCC_TITLE]]);
}
const majorOf = (code) => MAJORS.findIndex(([m]) => m.slice(0, 2) === code.slice(0, 2));
for (const r of nat.slice(1)) {
  if (r[C.NAICS] !== "000000" || !KEEP.has(r[C.O_GROUP])) continue;
  const code = r[C.OCC_CODE];
  occIdx.set(code, OCC.length);
  OCC.push([code, r[C.OCC_TITLE].trim(), r[C.O_GROUP] === "detailed" ? majorOf(code) : -1, r[C.HOURLY] === "TRUE" ? 1 : 0]);
}
if (OCC.length !== 1 + 22 + 830) throw new Error(`expected 853 occupations, read ${OCC.length}`);

/** A wage cell: a number, -1 for BLS's "#" (at or above its top figure), null where BLS publishes none. */
const wage = (v, hourly) => {
  const s = String(v ?? "").trim();
  if (s === "#") return -1;
  if (s === "" || s.startsWith("*")) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`a wage of ${s}`);
  return hourly ? Math.round(n * 100) / 100 : Math.round(n);
};
const emp = (v) => {
  const s = String(v ?? "").trim();
  if (s === "" || s.startsWith("*")) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`employment of ${s}`);
  return n;
};
/** A row: [occupation, employed, mean, 10th, 25th, median, 75th, 90th] - a year's pay, or an hour's for a job BLS gives by the hour only. */
function rowOf(r) {
  const i = occIdx.get(r[C.OCC_CODE]);
  if (i === undefined) return null;
  const hourly = OCC[i][3] === 1;
  const k = hourly ? ["H_MEAN", "H_PCT10", "H_PCT25", "H_MEDIAN", "H_PCT75", "H_PCT90"] : ["A_MEAN", "A_PCT10", "A_PCT25", "A_MEDIAN", "A_PCT75", "A_PCT90"];
  return [i, emp(r[C.TOT_EMP]), ...k.map((n) => wage(r[C[n]], hourly))];
}

// ── Each area's rows ──
const AREAS = new Map(); // code -> { title, state, type, rows }
for (const rows of [nat, st, msa, bos])
  for (const r of rows.slice(1)) {
    if (r[C.NAICS] !== "000000" || !KEEP.has(r[C.O_GROUP])) continue;
    const code = r[C.AREA];
    if (!AREAS.has(code)) AREAS.set(code, { title: r[C.AREA_TITLE].trim(), state: r[C.PRIM_STATE], type: +r[C.AREA_TYPE], rows: [] });
    const row = rowOf(r);
    if (row) AREAS.get(code).rows.push(row);
  }
const us = AREAS.get("99");
if (!us || us.rows.length !== OCC.length) throw new Error("the nation's rows are not all there");
const states = [...AREAS].filter(([, a]) => a.type === 2 || a.type === 3);
const metros = [...AREAS].filter(([, a]) => a.type === 4 || a.type === 6);
if (states.length < 50 || metros.length < 500) throw new Error(`read ${states.length} states and ${metros.length} areas`);

// ── Each county's area ──
const dh = defs[0];
const at = (n) => {
  const i = dh.findIndex((h) => h.trim() === n);
  if (i < 0) throw new Error(`area definitions: no column ${n}`);
  return i;
};
const [dFips, dCounty, dArea] = [at("FIPS Code"), at("County Code"), at("May 2025 Area Code")];
const COUNTY = {};
for (const r of defs.slice(1)) {
  if (!r[dFips] || !r[dCounty]) continue;
  const area = String(r[dArea]).trim();
  if (!AREAS.has(area)) throw new Error(`county ${r[dFips]}${r[dCounty]} in area ${area}, which has no figures`);
  COUNTY[`${String(r[dFips]).padStart(2, "0")}${String(r[dCounty]).padStart(3, "0")}`] = area;
}

// ── Written ──
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ["state", "area", "occ"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
const write = (rel, v) => fs.writeFileSync(path.join(OUT, rel), JSON.stringify(v));
write("us.json", { occ: OCC, majors: MAJORS, rows: us.rows });
write("areas.json", { areas: Object.fromEntries(metros.map(([code, a]) => [code, [a.title, a.state, a.type]])), states: Object.fromEntries(states.map(([code, a]) => [a.state, [code, a.title, a.type]])), counties: COUNTY });
for (const [, a] of states) write(`state/${a.state}.json`, a.rows);
for (const [code, a] of metros) write(`area/${code}.json`, a.rows);
// One occupation everywhere: [state, employed, mean, median, 10th, 90th] and [area, employed, median].
for (let i = 0; i < OCC.length; i++) {
  const of = (list, full) => list.flatMap(([code, a]) => {
    const r = a.rows.find((x) => x[0] === i);
    return r && (r[5] !== null || r[2] !== null) ? [full ? [a.state, r[1], r[2], r[5], r[3], r[7]] : [code, r[1], r[5]]] : [];
  });
  write(`occ/${OCC[i][0]}.json`, { states: of(states, true), areas: of(metros, false) });
}

const size = (d) => fs.readdirSync(path.join(OUT, d)).reduce((s, f) => s + fs.statSync(path.join(OUT, d, f)).size, 0);
const total = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? total(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
fs.writeFileSync(
  META,
  `/**
 * What each job pays, from the US Bureau of Labor Statistics' Occupational Employment and Wage Statistics, May 2025
 * (public domain): ${OCC.length - 23} occupations, in the nation, ${states.length} states and territories and ${metros.length} metropolitan and
 * nonmetropolitan areas. The figures are in static/pay/, fetched when a window shows them.
 *
 * GENERATED by build-pay.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const PAY_SOURCES = [
  { label: "US Bureau of Labor Statistics — Occupational Employment and Wage Statistics, May 2025 (released 15 May 2026)", url: "https://www.bls.gov/oes/tables.htm" },
  { label: "US Bureau of Labor Statistics — OEWS area definitions, May 2025", url: "https://www.bls.gov/oes/2025/may/msa_def.htm" },
  { label: "US Bureau of Labor Statistics — OEWS technical notes", url: "https://www.bls.gov/oes/2025/may/oes_tec.htm" },
];
export const PAY_PERIOD = "May 2025";
export const PAY_RELEASED = "2026-05-15";
/** BLS's top figure: a wage it marks "#" is this or more, and is given no closer. */
export const PAY_TOP = { year: 239200, hour: 115 };
/** An occupation: [SOC code, title, its major group (index into the groups; -1 for the total and the groups), 1 if BLS gives it by the hour only]. */
export type PayOcc = [code: string, title: string, major: number, hourly: 0 | 1];
/** A row: [occupation (index), employed, mean, 10th percentile, 25th, median, 75th, 90th]; -1 BLS's "#", null not published. */
export type PayRow = [occ: number, employed: number | null, mean: number | null, p10: number | null, p25: number | null, median: number | null, p75: number | null, p90: number | null];
export type PayUs = { occ: PayOcc[]; majors: [code: string, title: string][]; rows: PayRow[] };
/** Areas by BLS's code: [name, primary state, 4 metropolitan or 6 nonmetropolitan]; states by their postal code: [BLS's code, name, 2 state or 3 territory]; counties by FIPS code: their area. */
export type PayAreas = { areas: Record<string, [title: string, state: string, type: 4 | 6]>; states: Record<string, [code: string, title: string, type: 2 | 3]>; counties: Record<string, string> };
/** One occupation: [state, employed, mean, median, 10th, 90th] in each state, and [area, employed, median] in each area. */
export type PayOccFile = { states: [state: string, employed: number | null, mean: number | null, median: number | null, p10: number | null, p90: number | null][]; areas: [area: string, employed: number | null, median: number | null][] };
`,
);
console.log(`wrote static/pay: ${OCC.length} occupations, ${states.length} states, ${metros.length} areas, ${Object.keys(COUNTY).length} counties`);
console.log(`  state ${(size("state") / 1e6).toFixed(1)} MB, area ${(size("area") / 1e6).toFixed(1)} MB, occ ${(size("occ") / 1e6).toFixed(1)} MB, all ${(total(OUT) / 1e6).toFixed(1)} MB`);
