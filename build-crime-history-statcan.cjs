#!/usr/bin/env node
/**
 * Crime history of Canada's provinces, territories and cities, as asked: Statistics Canada's crime severity index -
 * police-reported crime weighted by each offence's seriousness (the sentences courts hand down for it), Canada in 2006 =
 * 100 - with its violent and non-violent parts, every year since 1998, for the country, each province and territory, and
 * each census metropolitan area (a city and the places around it that form one labour market). Table 35-10-0026-01, under
 * the Statistics Canada Open Licence. Nothing is worked out here.
 *
 * A province takes the same id as the OECD's region for it (build-crime-history-oecd.cjs; the OECD's codes are Statistics
 * Canada's), so that each province is one place with both records.
 *
 *   node build-crime-history-statcan.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { mergeCountry, seriesOf, writeIndex } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-crime-history", "statcan");
fs.mkdirSync(CACHE, { recursive: true });
const TABLE = "35100026";

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

const KEYS = { "Crime severity index": "csi", "Violent crime severity index": "violentCsi", "Non-violent crime severity index": "nonViolentCsi" };
const DEFS = {
  csi: { label: "Crime severity index", unit: "index", say: "police-reported crime weighted by each offence's seriousness; Canada in 2006 = 100" },
  violentCsi: { label: "Violent crime severity", unit: "index", say: "the crime severity index of violent offences alone; Canada in 2006 = 100" },
  nonViolentCsi: { label: "Non-violent crime severity", unit: "index", say: "the crime severity index of non-violent offences alone; Canada in 2006 = 100" },
};

(async () => {
  const zip = path.join(CACHE, `${TABLE}-eng.zip`);
  if (!fs.existsSync(zip)) execFileSync("curl", ["-sL", "--fail", "--max-time", "600", "-A", UA, "-o", zip, `https://www150.statcan.gc.ca/n1/tbl/csv/${TABLE}-eng.zip`]);
  execFileSync("unzip", ["-o", "-q", zip, "-d", CACHE]);
  const rows = parseCsv(fs.readFileSync(path.join(CACHE, `${TABLE}.csv`), "utf8"));
  const H = rows[0];
  const ix = Object.fromEntries(H.map((h, i) => [h, i]));
  for (const k of ["REF_DATE", "GEO", "DGUID", "Statistics", "VALUE", "STATUS"]) if (ix[k] === undefined) throw new Error(`no column ${k}`);

  const places = new Map(); // DGUID -> { geo, years: {key: {y: v}} }
  for (const r of rows.slice(1)) {
    const key = KEYS[r[ix.Statistics]];
    if (!key || r[ix.VALUE] === "") continue;
    const at = places.get(r[ix.DGUID]) ?? places.set(r[ix.DGUID], { geo: r[ix.GEO], years: {} }).get(r[ix.DGUID]);
    (at.years[key] ||= {})[+r[ix.REF_DATE]] = Number(r[ix.VALUE]);
  }

  // The level by the geography's code: 2021A000011124 Canada, 2021A0002<pp> a province, 2021A0035<pp><ccc> a metropolitan area (or its part in one province).
  const out = [];
  let country = null;
  for (const [dguid, p] of places) {
    const series = Object.fromEntries(Object.entries(p.years).map(([k, by]) => [k, seriesOf(by)]).filter(([, s]) => s));
    const name = p.geo.replace(/\s*\[[^\]]*\]$/, "");
    if (dguid === "2021A000011124") country = { id: "CA", name: "Canada", kind: "country", series };
    else if (/^2021A0002\d{2}$/.test(dguid)) out.push({ id: `OECD-CA${dguid.slice(-2)}`, name, kind: "province", parent: "CA", series });
    else if (/^2021A0035\d{5}$/.test(dguid)) {
      // "Toronto, Ontario": the city in its province, by the province code its own code begins with; the part of a city
      // across two provinces in each ("Ottawa-Gatineau, Ontario part").
      const [city, prov] = name.split(/,\s*/);
      out.push({ id: `CA-CMA-${dguid.slice(9)}`, name: / part$/.test(prov) ? `${city} (${prov})` : city, kind: "city", parent: `OECD-CA${dguid.slice(9, 11)}`, series });
    } else if (/^2021A0035\d{3}$/.test(dguid)) {
      // A city across two provinces, as a whole: under the country.
      out.push({ id: `CA-CMA-${dguid.slice(9)}`, name: name.split(/,\s*/)[0], kind: "city", parent: "CA", series });
    } else throw new Error(`what level is ${dguid} ${p.geo}?`);
  }
  if (!country) throw new Error("no Canada row");
  const source = {
    label: "Statistics Canada - Table 35-10-0026-01, crime severity index",
    url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3510002601",
    note: "Police-reported crime weighted by each offence's seriousness - the sentences courts hand down for it - so that a rise in serious crime counts for more than a rise in minor crime; Canada in 2006 = 100. A census metropolitan area is a city and the places around it that form one labour market. Statistics Canada Open Licence.",
  };
  mergeCountry("crime", "CA", { source, sourceId: "statcan", defs: DEFS, places: [country, ...out] });
  writeIndex("crime");
  const toronto = out.find((o) => o.name === "Toronto");
  const last = (s) => s[s.length - 1];
  console.log(`StatCan: Canada, ${out.filter((o) => o.kind === "province").length} provinces and territories, ${out.filter((o) => o.kind === "city").length} metropolitan areas; Canada CSI ${country.series.csi[0]}-${country.series.csi[0] + country.series.csi.length - 2} last ${last(country.series.csi)}; Toronto last ${toronto && last(toronto.series.csi)} (in ${toronto?.parent})`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
