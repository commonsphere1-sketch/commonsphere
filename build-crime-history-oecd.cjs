#!/usr/bin/env node
/**
 * Crime history of regions, as asked: the OECD's regional homicide rate - intentional homicides per 100,000 people - for
 * each large region (TL2: a state, province or region) of the countries its Regions and Cities database holds, every
 * year it gives, from each country's own statistics as the OECD gathers them. A value the OECD marks as estimated is left
 * out, as in build-regional-oecd.cjs. Nothing is worked out here.
 *
 * Writes each country's regions into static/crime/history/<CC>.json beside UNODC's country (place-history-lib.cjs).
 *
 *   node build-crime-history-oecd.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { mergeCountry, seriesOf, writeIndex } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-crime-history");
fs.mkdirSync(CACHE, { recursive: true });

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
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

// What each country calls its large regions, for the chooser; "region" elsewhere.
const KIND = { US: "state", MX: "state", AU: "state", DE: "state", AT: "state", BR: "state", IN: "state", CA: "province", AR: "province", ZA: "province", NL: "province", BE: "province", TR: "region", JP: "region", KR: "region" };

(async () => {
  const file = path.join(CACHE, "oecd-reg-soc.csv");
  if (!fs.existsSync(file)) execFileSync("curl", ["-sL", "--fail", "--max-time", "900", "-A", UA, "-o", file, "https://sdmx.oecd.org/public/rest/data/OECD.CFE.EDS,DSD_REG_SOC@DF_INCOME_INEQ,/all?startPeriod=1990&format=csvfilewithlabels"]);
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const head = rows[0];
  const ix = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const k of ["REF_AREA", "Reference area", "COUNTRY", "TERRITORIAL_LEVEL", "MEASURE", "UNIT_MEASURE", "TIME_PERIOD", "OBS_VALUE", "OBS_STATUS"]) if (ix[k] === undefined) throw new Error(`no column ${k}`);
  const wb = JSON.parse(execFileSync("curl", ["-s", "-L", "--max-time", "120", "-A", UA, "https://api.worldbank.org/v2/country?format=json&per_page=400"]).toString())[1];
  const iso2 = Object.fromEntries(wb.map((c) => [c.id, c.iso2Code]));

  const regions = new Map(); // code -> { cc, name, years: {y: v} }
  let estimated = 0;
  for (const r of rows.slice(1)) {
    if (r.length < head.length) continue;
    if (r[ix.MEASURE] !== "HOMIC" || r[ix.UNIT_MEASURE] !== "CS_10P5PS" || r[ix.TERRITORIAL_LEVEL] !== "TL2") continue;
    if (r[ix.OBS_VALUE] === "") continue;
    if (/E/.test(r[ix.OBS_STATUS] ?? "")) {
      estimated++;
      continue;
    }
    const cc = iso2[r[ix.COUNTRY]];
    if (!cc) continue;
    const reg = regions.get(r[ix.REF_AREA]) ?? regions.set(r[ix.REF_AREA], { cc, name: r[ix["Reference area"]], years: {} }).get(r[ix.REF_AREA]);
    const y = +r[ix.TIME_PERIOD];
    const v = Math.round(Number(r[ix.OBS_VALUE]) * 100) / 100;
    if (reg.years[y] !== undefined && reg.years[y] !== v) throw new Error(`${r[ix.REF_AREA]} ${y}: two values`);
    reg.years[y] = v;
  }

  const source = {
    label: "OECD - Regions and Cities databases: regional well-being (safety)",
    url: "https://data-explorer.oecd.org/?fs[0]=Topic%2C1%7CRegional%252C%20rural%20and%20urban%20development%23GEO%23%7CRegions%23GEO_REG%23",
    note: "Intentional homicides per 100,000 people in each large region (TL2), from each country's own statistics as the OECD gathers them; values the OECD marks as estimated are left out.",
  };
  const defs = { homicide: { label: "Intentional homicide", unit: "per100k", say: "victims of intentional homicide per 100,000 people" } };
  const byCc = {};
  for (const [code, reg] of regions) {
    const s = seriesOf(reg.years);
    if (!s) continue;
    (byCc[reg.cc] ||= []).push({ id: `OECD-${code}`, name: reg.name, kind: KIND[reg.cc] ?? "region", parent: reg.cc, series: { homicide: s } });
  }
  for (const [cc, places] of Object.entries(byCc)) mergeCountry("crime", cc, { source, sourceId: "oecd", defs, places });
  writeIndex("crime");
  const n = Object.values(byCc).reduce((a, p) => a + p.length, 0);
  const us = byCc.US?.find((p) => /California/.test(p.name));
  console.log(`OECD regional homicide: ${n} regions in ${Object.keys(byCc).length} countries (${estimated} estimated values left out); California ${us ? `${us.series.homicide[0]}+${us.series.homicide.length - 1}, last ${us.series.homicide[us.series.homicide.length - 1]}` : "none"}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
