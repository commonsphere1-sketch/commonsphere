/**
 * Splits Natural Earth 1:10m admin-1 into one quantised TopoJSON per country.
 *
 * Shipping the source file is not an option — it is 38.8 MB, and a page that
 * shows one country at a time has no reason to download the other 240. Split
 * per country and served from /public, the browser fetches only what is on
 * screen, and the largest single file is a fraction of the whole.
 */
const fs = require("fs");
const path = require("path");
const { topology } = require("topojson-server");

const OUT = path.join(__dirname, "static/geo/admin1");
const src = JSON.parse(fs.readFileSync(path.join(__dirname, "admin1-10m-raw.geojson"), "utf8"));

// Group by ISO alpha-2, which is the key the app already joins on.
const groups = new Map();
for (const f of src.features) {
  const p = f.properties;
  const code = p.iso_a2 && p.iso_a2 !== "-99" ? p.iso_a2 : null;
  if (!code) continue;
  const name = p.name || p.name_en || p.woe_name || p.gn_name || "";
  if (!groups.has(code)) groups.set(code, []);
  groups.get(code).push({
    type: "Feature",
    properties: { n: name },   // the country code is the filename
    geometry: f.geometry,
  });
}

const manifest = {};
let written = 0, totalBytes = 0, biggest = { code: "", kb: 0 };
const codes = [...groups.keys()].sort();

for (const code of codes) {
  const features = groups.get(code);
  const topo = topology({ a: { type: "FeatureCollection", features } }, 1e4);
  const json = JSON.stringify(topo);
  fs.writeFileSync(path.join(OUT, `${code}.json`), json);
  const kb = json.length / 1024;
  totalBytes += json.length;
  if (kb > biggest.kb) biggest = { code, kb };
  manifest[code] = features.length;
  written++;
}

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
console.log(`countries written: ${written}`);
console.log(`total on disk:     ${(totalBytes / 1048576).toFixed(1)} MB`);
console.log(`largest:           ${biggest.code} at ${biggest.kb.toFixed(0)} KB`);
console.log(`median file:       ${(Object.values(manifest).length ? (totalBytes / written / 1024) : 0).toFixed(1)} KB avg`);
