/**
 * Builds the world map's internal-border layer from the per-country admin-1
 * files that build-admin1.cjs writes.
 *
 * The world map draws every country at once, so it cannot fetch 241 files
 * totalling 7.8 MB. It needs only the lines, not the divisions: for each
 * country this keeps the borders its divisions share with one another
 * (mesh with a !== b), which drops coastlines and the country's own outline,
 * then simplifies them for world scale and writes one quantised TopoJSON.
 *
 * Simplification is Douglas-Peucker at TOLERANCE degrees, from
 * geo-simplify.cjs, which build-map-layers.cjs shares.
 *
 * Run after build-admin1.cjs:  node build-admin1-borders.cjs
 */
const fs = require("fs");
const path = require("path");
const { mesh } = require("topojson-client");
const { topology } = require("topojson-server");
const { simplify } = require("./geo-simplify.cjs");

const SRC = path.join(__dirname, "static/geo/admin1");
const OUT = path.join(__dirname, "static/geo/admin1-borders.json");
const TOLERANCE = 0.02;

const features = [];
let before = 0;
let after = 0;
for (const file of fs.readdirSync(SRC).sort()) {
  // The manifest is not geometry; "-1" holds divisions with no country.
  if (file === "manifest.json" || file === "-1.json") continue;
  const topo = JSON.parse(fs.readFileSync(path.join(SRC, file), "utf8"));
  const obj = topo.objects[Object.keys(topo.objects)[0]];
  const lines = mesh(topo, obj, (a, b) => a !== b).coordinates;
  if (!lines.length) continue;
  before += lines.reduce((n, l) => n + l.length, 0);
  const simplified = lines.map((l) => simplify(l, TOLERANCE)).filter((l) => l.length > 1);
  after += simplified.reduce((n, l) => n + l.length, 0);
  features.push({
    type: "Feature",
    properties: { c: file.replace(/\.json$/, "") }, // ISO alpha-2, as the app joins on
    geometry: { type: "MultiLineString", coordinates: simplified },
  });
}

const topo = topology({ b: { type: "FeatureCollection", features } }, 1e5);
fs.writeFileSync(OUT, JSON.stringify(topo));
console.log(
  `${features.length} countries with internal borders; ${before} -> ${after} points; ` +
    `${(fs.statSync(OUT).size / 1024).toFixed(0)} KB written to ${path.relative(__dirname, OUT)}`,
);
