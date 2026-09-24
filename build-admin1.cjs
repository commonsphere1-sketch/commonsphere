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

// Group by ISO alpha-2, which is the key the app already joins on; a
// feature carved out for a territory (see admin1-carve.cjs) is in both.
const { codesOf } = require("./admin1-carve.cjs");
const groups = new Map();
for (const f of src.features) {
  const p = f.properties;
  const name = p.name || p.name_en || p.woe_name || p.gn_name || "";
  for (const code of codesOf(p)) {
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push({
      type: "Feature",
      properties: { n: name },   // the country code is the filename
      // Its own copy: the antimeridian unwrap below edits coordinates.
      geometry: JSON.parse(JSON.stringify(f.geometry)),
    });
  }
}

/* Morocco and Western Sahara. The site lists them as two places (446,550 km²
   and 266,000 km²), as ISO 3166 and the UN do. Natural Earth draws the de
   facto line instead: three Moroccan regions run south into Western Sahara,
   and the feature it files as Western Sahara is only the strip east of the
   berm, so Morocco's map drew about 592,000 km² and Western Sahara's about
   91,000. The boundary between the two is the parallel 27°40′N, from the
   Atlantic to Algeria - the old northern border of Spanish Sahara - and all
   of Morocco lies north of it. So Morocco's regions are cut at that line,
   and everything south of it, with the strip, is Western Sahara: one
   outline, without divisions, since the divisions are what is disputed. */
const polygonClipping = require("polygon-clipping");
const coordsOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
/* polygon-clipping winds outer rings counter-clockwise (the GeoJSON rule);
   d3 reads a ring by its direction on the sphere and takes that as "the rest
   of the world", so each polygon is turned to run clockwise, as Natural
   Earth's own rings do. Its holes turn with it and stay opposite. */
const clockwise = (multi) =>
  multi.map((poly) => {
    const ring = poly[0];
    let twice = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
      twice += (ring[i][0] - ring[j][0]) * (ring[i][1] + ring[j][1]);
    // twice > 0 is clockwise with longitude east and latitude north.
    return twice > 0 ? poly : poly.map((r) => [...r].reverse());
  });
const LAT_27_40 = 27 + 40 / 60;
const NORTH = [[[[-20, LAT_27_40], [0, LAT_27_40], [0, 37], [-20, 37], [-20, LAT_27_40]]]];
const SOUTH = [[[[-20, 20], [0, 20], [0, LAT_27_40], [-20, LAT_27_40], [-20, 20]]]];
{
  const morocco = [];
  const sahara = (groups.get("EH") ?? []).map((f) => coordsOf(f.geometry));
  for (const f of groups.get("MA") ?? []) {
    const north = polygonClipping.intersection(coordsOf(f.geometry), NORTH);
    const south = polygonClipping.intersection(coordsOf(f.geometry), SOUTH);
    if (north.length) morocco.push({ ...f, geometry: { type: "MultiPolygon", coordinates: clockwise(north) } });
    if (south.length) sahara.push(south);
  }
  if (!morocco.length || !sahara.length) throw new Error("Morocco / Western Sahara split found nothing");
  groups.set("MA", morocco);
  groups.set("EH", [
    {
      type: "Feature",
      properties: { n: "Western Sahara" },
      geometry: { type: "MultiPolygon", coordinates: clockwise(polygonClipping.union(...sahara)) },
    },
  ]);
}

/* Codes given on the command line rebuild just those files and leave every
   other file, and its manifest entry, as it is:
     node build-admin1.cjs FJ KI NZ RU */
const only = new Set(process.argv.slice(2).map((c) => c.toUpperCase()));
const manifest = only.size
  ? JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"))
  : {};
let written = 0, totalBytes = 0, biggest = { code: "", kb: 0 };
/* Files build-hires-admin1.cjs has replaced with geoBoundaries are left
   alone on a full run, and kept in the manifest; name one to rebuild it. */
const hiresAt = path.join(OUT, "hires.json");
const hires = new Set(fs.existsSync(hiresAt) ? JSON.parse(fs.readFileSync(hiresAt, "utf8")) : []);
if (!only.size && hires.size) {
  const previous = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
  for (const c of hires) manifest[c] = previous[c];
}
const codes = [...groups.keys()]
  .sort()
  .filter((c) => (only.size ? only.has(c) : !hires.has(c)));
if (only.size && codes.length !== only.size) {
  throw new Error("not in the source: " + [...only].filter((c) => !groups.has(c)).join(", "));
}

/* A place that straddles 180° - Fiji, Kiribati, New Zealand with the
   Chathams, Russia with Chukotka - spans the whole 360° of longitude as
   stored, and quantising to 1e4 steps across that made each step about 4 km:
   Kiribati's atolls came out as staircases. Its western longitudes are moved
   up by 360° so the extent is only what the place covers; d3 reads 190° as
   -170°, so nothing downstream changes. Only done when it shrinks the span. */
function unwrapAntimeridian(features) {
  let min = Infinity, max = -Infinity, hasEast = false, hasWest = false;
  const each = (fn) => {
    for (const f of features) {
      const g = f.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      for (const poly of polys) for (const ring of poly) for (const pt of ring) fn(pt);
    }
  };
  each(([lon]) => {
    if (lon > 90) hasEast = true;
    if (lon < -90) hasWest = true;
    min = Math.min(min, lon);
    max = Math.max(max, lon);
  });
  if (!hasEast || !hasWest) return false;
  let min2 = Infinity, max2 = -Infinity;
  each(([lon]) => {
    const l = lon < 0 ? lon + 360 : lon;
    min2 = Math.min(min2, l);
    max2 = Math.max(max2, l);
  });
  if (max2 - min2 >= max - min) return false;
  each((pt) => { if (pt[0] < 0) pt[0] += 360; });
  return true;
}

for (const code of codes) {
  const features = groups.get(code);
  if (unwrapAntimeridian(features)) console.log(`unwrapped across 180°: ${code}`);
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
