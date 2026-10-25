/**
 * Builds two of the world map's infrastructure layers from OpenStreetMap:
 *
 *   static/geo/cables.json      undersea communication cables   ways tagged communication=line and submarine=yes or
 *                                                               location=underwater - most of them fibre-optic
 *   static/geo/pipelines.json   oil pipelines                   ways tagged man_made=pipeline and substance=oil
 *
 * OpenStreetMap is © OpenStreetMap contributors, under the Open Database Licence (ODbL), which lets a commercial site use
 * it with that credit; these files are derived from it and are under the same licence. They are read through QLever's
 * copy of the whole planet (qlever.dev/api/osm-planet), as the Overpass servers could not be reached.
 *
 * They are what the volunteers who map OpenStreetMap have mapped - not every cable or pipeline is there, and some
 * mapped ones are planned or disused - so the page says so under the map. Nothing is drawn that is not in it: each way
 * is kept as traced, simplified for the map's scale, and one that simplifies to nothing is counted and left out.
 *
 *   node build-osm-lines.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { topology } = require("topojson-server");
const { simplify } = require("./geo-simplify.cjs");

const OUT_DIR = path.join(__dirname, "static/geo");
const CACHE = path.join(os.tmpdir(), "commonsphere-osm-lines");
const ENDPOINT = "https://qlever.dev/api/osm-planet";
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
/* As the trunk roads are simplified: a reference mark at world scale, not a route to follow. */
const TOLERANCE = 0.02;
fs.mkdirSync(CACHE, { recursive: true });

const PREFIX = `PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
`;
const LAYERS = {
  cables: {
    file: "cables.json",
    query: `${PREFIX}SELECT DISTINCT ?w ?wkt WHERE { ?w osmkey:communication "line" . { ?w osmkey:submarine "yes" } UNION { ?w osmkey:location "underwater" } ?w geo:hasGeometry/geo:asWKT ?wkt . }`,
    label: "OpenStreetMap - undersea communication cables",
    covers: "ways tagged communication=line and submarine=yes or location=underwater: the undersea cables mapped, most of them fibre-optic",
    min: 300,
  },
  pipelines: {
    file: "pipelines.json",
    query: `${PREFIX}SELECT ?w ?wkt WHERE { ?w osmkey:man_made "pipeline" . ?w osmkey:substance "oil" . ?w geo:hasGeometry/geo:asWKT ?wkt . }`,
    label: "OpenStreetMap - oil pipelines",
    covers: "ways tagged man_made=pipeline and substance=oil: the oil pipelines mapped, crude and products",
    min: 10000,
  },
};

async function rows(key, query) {
  const at = path.join(CACHE, `${key}.tsv`);
  if (!fs.existsSync(at) || Date.now() - fs.statSync(at).mtimeMs > 24 * 3600e3) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/tab-separated-values", "User-Agent": UA },
      body: new URLSearchParams({ query, send: "1000000" }),
      signal: AbortSignal.timeout(600000),
    });
    if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
    fs.writeFileSync(at, await res.text());
  }
  return fs.readFileSync(at, "utf8").split("\n").slice(1).filter(Boolean).map((l) => l.split("\t"));
}

/* A WKT LINESTRING or MULTILINESTRING as lists of [lon, lat]. Anything else - a polygon mapped round a facility - is not a line, and is left out. */
function linesOf(wkt) {
  const s = wkt.replace(/^"|"(\^\^.*)?$/g, "").trim();
  const m = s.match(/^(MULTI)?LINESTRING\s*\((.*)\)$/i);
  if (!m) return null;
  const parts = m[1] ? m[2].replace(/^\(|\)$/g, "").split(/\)\s*,\s*\(/) : [m[2]];
  return parts.map((p) => p.split(",").map((xy) => xy.trim().split(/\s+/).map(Number)).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
}

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [key, L] of Object.entries(LAYERS)) {
    const got = await rows(key, L.query);
    const seen = new Set();
    let ways = 0, notLines = 0, dropped = 0, before = 0, after = 0;
    const coordinates = [];
    for (const [id, wkt] of got) {
      if (!wkt || seen.has(id)) continue;
      seen.add(id);
      const lines = linesOf(wkt);
      if (!lines) { notLines++; continue; }
      ways++;
      for (const l of lines) {
        before += l.length;
        const kept = simplify(l, TOLERANCE).map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
        if (kept.length > 1) { coordinates.push(kept); after += kept.length; } else dropped++;
      }
    }
    if (ways < L.min) throw new Error(`${key}: only ${ways} ways were read`);
    const topo = topology({ l: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates } }] } }, 1e5);
    const out = path.join(OUT_DIR, L.file);
    fs.writeFileSync(out, JSON.stringify({
      sources: [{ label: L.label, url: "https://www.openstreetmap.org/copyright", retrieved: today, licence: "© OpenStreetMap contributors, ODbL", covers: L.covers }],
      ways,
      ...topo,
    }));
    const kb = fs.statSync(out).size / 1024;
    const gz = zlib.gzipSync(fs.readFileSync(out)).length / 1024;
    console.log(`${L.file}: ${ways} ways (${notLines} not lines, ${dropped} pieces too short), ${before} -> ${after} points, ${kb.toFixed(0)} KB (${gz.toFixed(0)} KB gzipped)`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
