/**
 * Builds the world map's finer-border layer - counties and districts - from
 * the per-country second-order files build-admin2.cjs writes, and the
 * United States' counties from us-atlas.
 *
 * The world map draws every country at once, so it cannot fetch 179 files
 * totalling 20 MB. It needs only the lines: for each country this keeps the
 * borders its second-order divisions share with one another (mesh with
 * a !== b), which drops coastlines and the country's own outline, simplifies
 * them for world scale and writes one quantised TopoJSON, as
 * build-admin1-borders.cjs does for the first-order borders.
 *
 * Whose the boundaries are is as for the files they come from: geoBoundaries'
 * gbOpen, each country's under its own publisher's open licence
 * (static/geo/admin2/manifest.json), and the US Census Bureau's cartographic
 * boundary files through us-atlas for the United States.
 *
 * Simplification is Douglas-Peucker at TOLERANCE degrees, from
 * geo-simplify.cjs. A line that simplifies to nothing is left out.
 *
 * Run after build-admin2.cjs:  node build-admin2-borders.cjs
 */
const fs = require("fs");
const path = require("path");
const { mesh } = require("topojson-client");
const { topology } = require("topojson-server");
const { simplify } = require("./geo-simplify.cjs");

const SRC = path.join(__dirname, "static/geo/admin2");
const OUT = path.join(__dirname, "static/geo/admin2-borders.json");
const TOLERANCE = 0.03;

const features = [];
let before = 0;
let after = 0;
const add = (code, topo, obj) => {
  const lines = mesh(topo, obj, (a, b) => a !== b).coordinates;
  if (!lines.length) return;
  before += lines.reduce((n, l) => n + l.length, 0);
  const simplified = lines.map((l) => simplify(l, TOLERANCE)).filter((l) => l.length > 1);
  after += simplified.reduce((n, l) => n + l.length, 0);
  if (simplified.length) features.push({ type: "Feature", properties: { c: code }, geometry: { type: "MultiLineString", coordinates: simplified } });
};

for (const file of fs.readdirSync(SRC).sort()) {
  if (!/^[A-Z]{2}\.json$/.test(file)) continue; // the manifest is not geometry
  const topo = JSON.parse(fs.readFileSync(path.join(SRC, file), "utf8"));
  add(file.replace(/\.json$/, ""), topo, topo.objects[Object.keys(topo.objects)[0]]);
}
// The United States' counties, which are not among those files: the site draws them from us-atlas.
{
  const topo = require("us-atlas/counties-10m.json");
  add("US", topo, topo.objects.counties);
}
if (features.length < 150) throw new Error(`only ${features.length} countries have finer borders`);

const topo = topology({ b: { type: "FeatureCollection", features } }, 1e5);
fs.writeFileSync(OUT, JSON.stringify(topo));
console.log(`${features.length} countries with finer borders; ${before} -> ${after} points; ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB written to ${path.relative(__dirname, OUT)}`);
