#!/usr/bin/env node
/**
 * Builds static/regional/oecd.json - each division's own figures from the OECD's regional statistics, as asked: OECD
 * Regions and Cities databases, read from its SDMX API with no key. OECD data may be used for any purpose, commercial use
 * included, with the OECD credited (OECD Terms and Conditions).
 *
 *   DSD_REG_ECO@DF_INC        household disposable income per person, US dollars at purchasing power parity (B6N)
 *   DSD_REG_LAB@DF_RATES      unemployment rate, ages 15-64 (UNE_RATE)
 *   DSD_REG_DEMO@DF_LIFE_EXP  life expectancy at birth (LFEXP)
 *   DSD_REG_SOC               homicides per 100,000 people (HOMIC); turnout at general elections (VOTERS_RATE);
 *                             households with broadband (BB_ACC); housing costs, % of disposable income (HOUSE_COST)
 *
 * The OECD publishes no regional Gini index in these databases, so none is held - nothing stands in for it.
 *
 * A division is matched to an OECD region (large, TL2, or small, TL3) of its own country only where the region's name is
 * the division's - the same once accents, case and words such as "province" or "region" are set aside - or one of the
 * names of the division's own Wikidata record, where that record is itself called by the division's name; and only where
 * exactly one region answers to it, and no other division answers to that region. Where a large and a small region of
 * the same name both answer (Berlin, and Berlin), the large one is taken. The United States is left out: its states hold
 * the Census Bureau's and the BEA's own. For each figure, the latest year; a value the OECD marks as its own estimate ("E")
 * is left out, and a break in the series ("B") or a provisional value ("P") is said to be one.
 *
 *   node build-regional-oecd.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-oecd-regional");
const OUT = path.join(__dirname, "static/regional/oecd.json");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

/** A CSV's rows, quotes and all. */
function parseCsv(text) {
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
  return rows;
}
/** An OECD dataflow's rows since 2015, with labels, kept for a day. */
function flow(id) {
  const file = path.join(CACHE, `${id.replace(/[^A-Za-z0-9]+/g, "_")}.csv`);
  if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3))
    execFileSync("curl", ["-sL", "--fail", "--max-time", "600", "-A", UA, "-o", file, `https://sdmx.oecd.org/public/rest/data/OECD.CFE.EDS,${id},/all?startPeriod=2015&format=csvfilewithlabels`]);
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 10).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

/* What is taken: each figure's key, where it is read from, and which rows are it. */
const DEFS = {
  income: { label: "Household income per person", part: "Economy", unit: "usd_ppp", say: "after taxes and transfers, in US dollars at purchasing power parity" },
  unemployment: { label: "Unemployment", part: "Economy", unit: "pct", say: "of the labour force aged 15 to 64" },
  housing: { label: "Housing costs", part: "Economy", unit: "pct", say: "of households' disposable income" },
  lifeExp: { label: "Health: life expectancy", part: "Society", unit: "years", say: "at birth" },
  homicide: { label: "Safety: homicides", part: "Society", unit: "per100k", say: "intentional homicides a year" },
  broadband: { label: "Development: homes with broadband", part: "Society", unit: "pct", say: "of households" },
  turnout: { label: "Elections: turnout", part: "Political data", unit: "pct", say: "at general elections, of those who may vote" },
};
const TAKE = [
  ["DSD_REG_ECO@DF_INC", (r) => r.MEASURE === "B6N" && r.UNIT_MEASURE === "USD_PPP_PS" && "income"],
  ["DSD_REG_LAB@DF_RATES", (r) => r.MEASURE === "UNE_RATE" && r.SEX === "_T" && r.AGE === "Y15T64" && "unemployment"],
  ["DSD_REG_DEMO@DF_LIFE_EXP", (r) => r.MEASURE === "LFEXP" && r.SEX === "_T" && r.AGE === "Y0" && "lifeExp"],
  [
    "DSD_REG_SOC@DF_INCOME_INEQ",
    (r) =>
      (r.MEASURE === "HOMIC" && r.UNIT_MEASURE === "CS_10P5PS" && "homicide") ||
      (r.MEASURE === "VOTERS_RATE" && "turnout") ||
      (r.MEASURE === "BB_ACC" && "broadband") ||
      (r.MEASURE === "HOUSE_COST" && "housing"),
  ],
];

const fold = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(province|provincia|region|regione|state|estado|prefecture|county|department|departamento|oblast|of|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

(async () => {
  /* Each OECD region's latest figure for each key, and its name and level. */
  const regions = new Map(); // code -> { cc3, level, name, figures: {key: [y, v, flag?]} }
  for (const [id, pick] of TAKE) {
    for (const r of flow(id)) {
      const key = pick(r);
      if (!key || !["TL2", "TL3"].includes(r.TERRITORIAL_LEVEL)) continue;
      if (r.OBS_VALUE === "" || /E/.test(r.OBS_STATUS ?? "")) continue;
      const y = +r.TIME_PERIOD;
      const v = Number(r.OBS_VALUE);
      if (!Number.isFinite(y) || !Number.isFinite(v)) continue;
      const reg = regions.get(r.REF_AREA) ?? regions.set(r.REF_AREA, { cc3: r.COUNTRY, level: r.TERRITORIAL_LEVEL, name: r["Reference area"], figures: {} }).get(r.REF_AREA);
      const was = reg.figures[key];
      const flag = /[BP]/.test(r.OBS_STATUS ?? "") ? r.OBS_STATUS.replace(/[^BP]/g, "") : "";
      if (!was || y > was[0]) reg.figures[key] = [y, Math.round(v * 10) / 10, ...(flag ? [flag] : [])];
    }
  }
  console.log(`OECD: ${regions.size} regions with a figure`);

  /* The site's divisions, by country, with the names of their own Wikidata records. */
  const wb = JSON.parse(execFileSync("curl", ["-s", "-L", "--max-time", "120", "-A", UA, "https://api.worldbank.org/v2/country?format=json&per_page=400"]).toString())[1];
  const iso2 = new Map(wb.map((c) => [c.id, c.iso2Code]));
  const oecdCountries = new Set([...regions.values()].map((r) => iso2.get(r.cc3)).filter(Boolean));
  const divisions = [];
  for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
    const s = line.trim().replace(/,$/, "");
    if (!s.startsWith('"{')) continue;
    const d = JSON.parse(JSON.parse(s));
    if (d.cc !== "US" && oecdCountries.has(d.cc)) divisions.push(d);
  }
  const labels = new Map();
  const qids = [...new Set(divisions.map((d) => d.qid).filter(Boolean))];
  for (let i = 0; i < qids.length; i += 50) {
    const query = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?d ?l WHERE { VALUES ?d { ${qids.slice(i, i + 50).map((q) => `wd:${q}`).join(" ")} } ?d rdfs:label ?l }`;
    const file = path.join(CACHE, `labels-${crypto.createHash("sha1").update(query).digest("hex").slice(0, 12)}.json`);
    if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3)) {
      if (i) await new Promise((r) => setTimeout(r, 1000));
      const res = await fetch("https://qlever.dev/api/wikidata", {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
        body: `query=${encodeURIComponent(query)}`,
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`QLever: HTTP ${res.status} ${text.slice(0, 200)}`);
      fs.writeFileSync(file, text);
    }
    for (const b of JSON.parse(fs.readFileSync(file, "utf8")).results.bindings) {
      const q = b.d.value.split("/").pop();
      (labels.get(q) ?? labels.set(q, new Set()).get(q)).add(fold(b.l.value));
    }
  }

  /* Each division to the one region of its country that answers to its name. */
  const byCountry = new Map();
  for (const [code, r] of regions) {
    const cc = iso2.get(r.cc3);
    if (cc) (byCountry.get(cc) ?? byCountry.set(cc, []).get(cc)).push({ code, ...r, key: fold(r.name) });
  }
  const want = new Map(); // division id -> region
  const taken = new Map(); // region code -> division ids
  for (const d of divisions) {
    const own = fold(d.name);
    const recorded = d.qid ? labels.get(d.qid) : undefined;
    // Its record's names count only where the record is itself called by the division's name.
    const names = new Set([own, ...(recorded?.has(own) ? recorded : [])].filter(Boolean));
    let hits = (byCountry.get(d.cc) ?? []).filter((r) => names.has(r.key));
    if (hits.some((r) => r.level === "TL2") && hits.some((r) => r.level === "TL3")) hits = hits.filter((r) => r.level === "TL2");
    if (hits.length !== 1) continue;
    want.set(d.id, hits[0]);
    (taken.get(hits[0].code) ?? taken.set(hits[0].code, []).get(hits[0].code)).push(d.id);
  }
  const out = {};
  const shared = [];
  for (const [id, r] of want) {
    if (taken.get(r.code).length > 1) {
      shared.push(`${r.code} ${r.name} <- ${taken.get(r.code).join(", ")}`);
      continue;
    }
    out[id] = { code: r.code, name: r.name, figures: r.figures };
  }
  fs.writeFileSync(
    OUT,
    JSON.stringify({
      agency: "the OECD",
      source: { label: "OECD — Regions and Cities databases: regional income, labour, demography and well-being statistics", url: "https://data-explorer.oecd.org/?fs[0]=Topic%2C1%7CRegional%252C%20rural%20and%20urban%20development%23GEO%23%7CRegions%23GEO_REG%23" },
      defs: DEFS,
      divisions: out,
    }),
  );
  const byCc = {};
  for (const id of Object.keys(out)) byCc[id.split("-")[0]] = (byCc[id.split("-")[0]] ?? 0) + 1;
  console.log(`${Object.keys(out).length} divisions held: ${JSON.stringify(byCc)}`);
  console.log("Left out, as two divisions answer to one region:", shared.join("; "));
  for (const id of ["CA-ON", "AU-NSW", "JP-13", "DE-BE", "MX-JAL", "TR-34", "KR-11", "GB-BIR", "FR-75", "IT-MI"]) if (out[id]) console.log(id, JSON.stringify(out[id]));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
