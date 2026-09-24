/**
 * Sharper outlines for the smallest places on the country map.
 *
 * The focus map fits one place to a 960×560 canvas. Natural Earth 1:10m is
 * accurate to roughly a kilometre, which is invisible for a country and
 * obvious for a place a few kilometres across: fitted to the frame, the
 * British Virgin Islands came out as six straight-edged blocks, and a single
 * atoll as a smooth blob.
 *
 * For every place whose main landmass spans under MAX_SPAN_DEG, this replaces
 * static/geo/admin1/<code>.json with geoBoundaries (Runfola et al., 2020):
 * its whole-territory outline (ADM0) where Natural Earth records a single
 * division, its first-order divisions (ADM1) where it records several and
 * geoBoundaries publishes them (the whole outline otherwise). They are traced
 * from 10 m Sentinel-2 land cover, OpenStreetMap or national mapping.
 *
 * Each replacement is checked against two independent land areas - Natural
 * Earth's and the site's own areaKm2 - and refused if it is far larger
 * than both or far smaller than either. The first run needed it: the
 * Maldives, Marshall Islands and Palau files trace administrative lines
 * round whole atolls, sea and all (the Maldives at 30,328 km² against 298),
 * and the US Virgin Islands one is missing St Thomas and St John. A place
 * refused, or not in geoBoundaries, keeps Natural Earth.
 *
 * Each file is simplified to half a pixel at the size the map draws it -
 * on the topology, so neighbouring divisions still meet - and rewound so
 * every ring runs the way d3 expects. Sources and licences are written to
 * src/data/admin1Sources.ts for the page to credit, and the codes to
 * static/geo/admin1/hires.json so build-admin1.cjs leaves them alone.
 *
 *   node build-admin1.cjs        (Natural Earth, everything else)
 *   node build-hires-admin1.cjs  (then this)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { topology } = require("topojson-server");
const {
  presimplify,
  simplify,
  planarTriangleArea,
  planarRingArea,
  filter,
  filterWeight,
} = require("topojson-simplify");
const { quantize, feature, merge } = require("topojson-client");
const RAW_NE = path.join(__dirname, "admin1-10m-raw.geojson");

const OUT = path.join(__dirname, "static/geo/admin1");
const SOURCES_TS = path.join(__dirname, "src/data/admin1Sources.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-hires-admin1");
fs.mkdirSync(CACHE, { recursive: true });
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";

/** Below this span, in degrees, 1:10m detail shows at full frame. */
const MAX_SPAN_DEG = 1.0;
/** The drawn width of the focus map, in canvas units. */
const CANVAS = 900;

/**
 * Places whose Natural Earth divisions leave out land the place has, taken
 * from geoBoundaries instead whatever their span. Found by comparing the
 * land each file draws with the area the site lists for the place.
 *
 * Åland: Natural Earth has 11 of its 16 municipalities - Finström, Geta,
 * Hammarland, Saltvik and Sund, most of the main island, are not in it.
 * geoBoundaries has no Åland file of its own; Finland's municipalities
 * (ADM3) include all sixteen, traced to the shore. With `names`, every one
 * must be found, or the place keeps Natural Earth.
 *
 * Cyprus and Somalia: Natural Earth draws Northern Cyprus and Somaliland as
 * places of their own, so the Cyprus map stopped at the Green Line and the
 * Somalia map at Somaliland. The site lists both at their full, recognised
 * extent (9,251 km² and 637,657 km²), and geoBoundaries' districts and
 * regions cover it (8,983 km² without the British base areas; 638,082 km²).
 */
const SUBSETS = {
  AX: {
    iso3: "FIN",
    level: "ADM3",
    names: [
      "Brändö", "Eckerö", "Finström", "Föglö", "Geta", "Hammarland", "Jomala", "Kumlinge",
      "Kökar", "Lemland", "Lumparland", "Mariehamn", "Saltvik", "Sottunga", "Sund", "Vårdö",
    ],
  },
  CY: { iso3: "CYP", level: "ADM1" },
  SO: { iso3: "SOM", level: "ADM1" },
};

/**
 * Island places that geoBoundaries does not publish (or publishes wrongly)
 * and Natural Earth draws with a few dozen points - the Minor Outlying
 * Islands came out as rectangles and wedges. Built instead from the
 * coastline mapped in OpenStreetMap (ODbL), fetched from the Overpass API
 * one island group at a time: every closed coastline ring whose centre falls
 * in the box is land. `split` cuts a shared island along a place's own
 * OpenStreetMap boundary (Saint Martin and Sint Maarten).
 */
const COASTS = {
  UM: [
    { n: "Baker Island", bbox: [0.18, -176.49, 0.21, -176.46] },
    { n: "Howland Island", bbox: [0.79, -176.63, 0.82, -176.61] },
    { n: "Jarvis Island", bbox: [-0.39, -160.03, -0.36, -159.98] },
    { n: "Johnston Atoll", bbox: [16.7, -169.56, 16.78, -169.49] },
    { n: "Kingman Reef", bbox: [6.37, -162.46, 6.44, -162.33] },
    { n: "Midway Atoll", bbox: [28.18, -177.43, 28.29, -177.3] },
    { n: "Navassa Island", bbox: [18.38, -75.04, 18.42, -74.99] },
    { n: "Palmyra Atoll", bbox: [5.86, -162.14, 5.9, -162.0] },
    { n: "Wake Island", bbox: [19.27, 166.59, 19.32, 166.66] },
  ],
  JE: [{ n: "Jersey", bbox: [49.15, -2.27, 49.27, -2.0] }],
  PM: [
    // Saint-Pierre with Grand Colombier and Île aux Marins; Langlade reaches
    // south to 46.75, and the box stops short of Saint-Pierre's centre.
    { n: "Saint-Pierre", bbox: [46.74, -56.25, 46.83, -56.13] },
    { n: "Miquelon-Langlade", bbox: [46.73, -56.45, 47.15, -56.215] },
  ],
  NF: [{ n: "Norfolk Island", bbox: [-29.14, 167.9, -28.99, 168.0] }],
  CX: [{ n: "Christmas Island", bbox: [-10.58, 105.52, -10.4, 105.73] }],
  CC: [{ n: "Cocos (Keeling) Islands", bbox: [-12.22, 96.8, -11.8, 96.95] }],
  BV: [{ n: "Bouvet Island", bbox: [-54.47, 3.28, -54.38, 3.45] }],
  HM: [
    { n: "Heard Island", bbox: [-53.21, 73.2, -52.94, 73.85] },
    { n: "McDonald Islands", bbox: [-53.07, 72.55, -53.0, 72.65] },
  ],
  IO: [{ n: "Chagos Archipelago", bbox: [-7.5, 70.8, -4.9, 72.6] }],
  VI: [
    { n: "Saint Thomas", bbox: [18.28, -65.1, 18.41, -64.83] },
    { n: "Saint John", bbox: [18.3, -64.81, 18.37, -64.66] },
    { n: "Saint Croix", bbox: [17.66, -64.92, 17.8, -64.55] },
  ],
  MP: [
    { n: "Saipan", bbox: [15.09, 145.68, 15.3, 145.84] },
    { n: "Tinian", bbox: [14.84, 145.53, 15.08, 145.68] },
    { n: "Rota", bbox: [14.1, 145.1, 14.22, 145.3] },
    { n: "Northern Islands", bbox: [15.5, 145.1, 20.6, 146.1] },
  ],
  MF: [{ n: "Saint-Martin", bbox: [18.0, -63.16, 18.13, -62.96], split: "MF" }],
  SX: [{ n: "Sint Maarten", bbox: [18.0, -63.16, 18.13, -62.96], split: "SX" }],
};
/* Two public Overpass servers, tried in turn: the main one answers 504 when
   it is busy. */
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

/** Codes the World Bank country list does not carry. */
const EXTRA_ISO3 = {
  TW: "TWN", EH: "ESH", CK: "COK", NU: "NIU", JE: "JEY", GG: "GGY", VA: "VAT", XK: "XKX", PS: "PSE",
  AI: "AIA", MS: "MSR", FK: "FLK", SH: "SHN", PN: "PCN", TK: "TKL", WF: "WLF", PM: "SPM", BL: "BLM",
  BQ: "BES", AX: "ALA", SJ: "SJM", NF: "NFK", CX: "CXR", CC: "CCK", GF: "GUF", GP: "GLP", MQ: "MTQ",
  RE: "REU", YT: "MYT", AQ: "ATA", BV: "BVT", HM: "HMD", GS: "SGS", TF: "ATF", IO: "IOT", UM: "UMI",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** What the map caption shows: the source and licence in a few words. */
function shortSource(src, year) {
  if (/sentinel-?2/i.test(src)) return `Sentinel-2 10 m land cover${year ? ", " + year : ""}`;
  if (/openstreetmap/i.test(src)) return "OpenStreetMap";
  // geoBoundaries lists its sources comma-separated, sometimes with URL
  // fragments and repeats ("Digitizedhttps, Digitizedhttps"): keep the names.
  const names = [
    ...new Set(
      src
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x && !/https?|www\./i.test(x)),
    ),
  ];
  const text = names.join(", ") || "geoBoundaries";
  return text.length > 60 ? text.slice(0, 57).trimEnd() + "…" : text;
}
function shortLicense(l, src) {
  const cc = /\((CC[^)]*)\)/.exec(l);
  if (cc) return cc[1].trim();
  // OpenStreetMap's attribution is owed only where the data came from it.
  if (/Open Database License/i.test(l))
    return /openstreetmap/i.test(src) ? "ODbL 1.0 (© OpenStreetMap contributors)" : "ODbL 1.0";
  const sa = /Attribution-ShareAlike ([\d.]+)/i.exec(l);
  if (sa) return `CC BY-SA ${sa[1]}`;
  const by = /Attribution ([\d.]+)/i.exec(l);
  if (by) return `CC BY ${by[1]}`;
  return l;
}

async function getText(url, cacheName) {
  const at = path.join(CACHE, cacheName);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.writeFileSync(at, text);
      return text;
    } catch (e) {
      if (attempt === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(3000 * (attempt + 1));
    }
  }
}

async function gbMeta(iso3, level) {
  const text = await getText(`https://www.geoboundaries.org/api/current/gbOpen/${iso3}/${level}/`, `meta-${iso3}-${level}.json`);
  if (!text || text.trimStart().startsWith("<")) return null;
  return JSON.parse(text);
}

/** An Overpass query, cached like the rest; POSTed, as the API asks. */
async function overpass(query, cacheName) {
  const at = path.join(CACHE, cacheName);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(OVERPASS[attempt % OVERPASS.length], {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
      });
      const text = await res.text();
      if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(at, text);
      await sleep(1500); // one request at a time, gently
      return JSON.parse(text);
    } catch (e) {
      if (attempt === 7) throw new Error(`overpass ${cacheName}: ${e.message}`);
      await sleep(4000 * (attempt + 1));
    }
  }
}

/** Ways (with node ids and geometry) joined end to end into closed rings. */
function closedRings(ways) {
  const pending = ways.map((w) => ({ nodes: [...w.nodes], pts: w.geometry.map((g) => [g.lon, g.lat]) }));
  const rings = [];
  while (pending.length) {
    const cur = pending.pop();
    let guard = 0;
    while (cur.nodes[0] !== cur.nodes[cur.nodes.length - 1] && guard++ < 10000) {
      const last = cur.nodes[cur.nodes.length - 1];
      const i = pending.findIndex((w) => w.nodes[0] === last);
      if (i < 0) break; // runs out of the query: not a whole island
      const next = pending.splice(i, 1)[0];
      cur.nodes.push(...next.nodes.slice(1));
      cur.pts.push(...next.pts.slice(1));
    }
    if (cur.nodes[0] === cur.nodes[cur.nodes.length - 1] && cur.pts.length >= 4) rings.push(cur.pts);
  }
  return rings;
}

/** Twice the signed planar area: positive when a ring runs anticlockwise. */
const signedArea = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return a;
};
const inRing = ([x, y], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/**
 * Land inside a box, as polygons wound anticlockwise (the GeoJSON rule,
 * which polygon-clipping also uses). OpenStreetMap draws coastline with the
 * land on its left, so an island's ring runs anticlockwise and an enclosed
 * lagoon's clockwise; each lagoon becomes a hole in the island around it.
 */
function landIn(rings, [s, w, n, e]) {
  const outers = [], holes = [];
  for (const r of rings) {
    const cx = r.reduce((t, p) => t + p[0], 0) / r.length;
    const cy = r.reduce((t, p) => t + p[1], 0) / r.length;
    if (cx < w || cx > e || cy < s || cy > n) continue;
    (signedArea(r) > 0 ? outers : holes).push(r);
  }
  const polys = outers.map((o) => [o]);
  for (const h of holes) {
    const owner = polys.find((p) => inRing(h[0], p[0]));
    if (owner) owner.push(h);
  }
  return polys;
}

/** A place's own boundary from OpenStreetMap, as polygons, to cut by. */
async function boundaryOf(iso) {
  const j = await overpass(
    `[out:json][timeout:90];relation["boundary"="administrative"]["ISO3166-1"="${iso}"];out geom;`,
    `osm-boundary-${iso}.json`,
  );
  const rel = j.elements.find((e) => e.type === "relation");
  if (!rel) throw new Error(`no OpenStreetMap boundary for ${iso}`);
  // Member ways carry coordinates but not node ids, so they join on points.
  const pending = rel.members
    .filter((m) => m.type === "way" && m.role === "outer" && m.geometry)
    .map((m) => ({ pts: m.geometry.map((g) => [g.lon, g.lat]) }));
  const key = (p) => `${p[1]},${p[0]}`;
  const rings = [];
  while (pending.length) {
    const cur = pending.pop();
    let guard = 0;
    while (key(cur.pts[0]) !== key(cur.pts[cur.pts.length - 1]) && guard++ < 10000) {
      const endKey = key(cur.pts[cur.pts.length - 1]);
      let i = pending.findIndex((w) => key(w.pts[0]) === endKey);
      if (i < 0) {
        i = pending.findIndex((w) => key(w.pts[w.pts.length - 1]) === endKey);
        if (i >= 0) pending[i].pts.reverse();
      }
      if (i < 0) break;
      cur.pts.push(...pending.splice(i, 1)[0].pts.slice(1));
    }
    if (key(cur.pts[0]) === key(cur.pts[cur.pts.length - 1])) rings.push(cur.pts);
  }
  if (!rings.length) throw new Error(`OpenStreetMap boundary for ${iso} does not close`);
  return rings.map((r) => [signedArea(r) > 0 ? r : [...r].reverse()]);
}

/** One feature per island group, from OpenStreetMap coastline. */
async function coastFeatures(code) {
  const polygonClipping = require("polygon-clipping");
  const out = [];
  for (const g of COASTS[code]) {
    const [s, w, n, e] = g.bbox;
    const j = await overpass(
      `[out:json][timeout:90];way["natural"="coastline"](${s},${w},${n},${e});out geom;`,
      // The box is in the name, so changing it cannot reuse an older answer.
      `osm-coast-${code}-${g.n.replace(/[^A-Za-z]+/g, "_")}-${g.bbox.join("_")}.json`,
    );
    const ways = j.elements.filter((x) => x.type === "way" && x.geometry && x.nodes);
    let polys = landIn(closedRings(ways), g.bbox);
    if (g.split && polys.length) polys = polygonClipping.intersection(polys, await boundaryOf(g.split));
    if (!polys.length) {
      console.log(`  ${code}: no coastline found for ${g.n}; left out`);
      continue;
    }
    out.push({
      type: "Feature",
      properties: { n: g.n },
      geometry: { type: "MultiPolygon", coordinates: polys },
      osmDate: (j.osm3s?.timestamp_osm_base || "").slice(0, 10),
    });
  }
  return out;
}

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(
    `npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const d3 = await import("d3-geo");
  const { geoArea, geoBounds } = d3;
  const polysOf = (g) =>
    g.type === "MultiPolygon" ? g.coordinates : g.type === "Polygon" ? [g.coordinates] : [];
  /** d3 reads a ring by its direction; one covering most of the globe is backwards. */
  const rewind = (g) => {
    for (const poly of polysOf(g))
      if (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI) for (const ring of poly) ring.reverse();
  };
  /** Span of the largest landmass: what the focus map is framed on. */
  const mainSpan = (g) => {
    const polys = polysOf(g).map((c) => ({ type: "Polygon", coordinates: c }));
    if (!polys.length) return Infinity;
    const big = polys.map((p) => [geoArea(p), p]).sort((a, b) => b[0] - a[0])[0][1];
    const [[x0, y0], [x1, y1]] = geoBounds(big);
    return Math.max((x1 < x0 ? x1 + 360 : x1) - x0, (y1 - y0) * 1.7);
  };

  const R = 6371.0088;
  /** Land area in km², whatever way each ring was wound. */
  const areaKm2 = (geoms) => {
    let sr = 0;
    for (const g of geoms)
      for (const poly of polysOf(g)) {
        const a = geoArea({ type: "Polygon", coordinates: poly });
        sr += a > 2 * Math.PI ? 4 * Math.PI - a : a;
      }
    return sr * R * R;
  };

  /* Targets and the area check are measured on Natural Earth's own source,
     not on whatever file is there now, so a re-run picks the same places. */
  if (!fs.existsSync(RAW_NE)) throw new Error("admin1-10m-raw.geojson is missing: see build-admin1.cjs");
  const neByCode = new Map();
  const { codesOf } = require("./admin1-carve.cjs");
  for (const f of JSON.parse(fs.readFileSync(RAW_NE, "utf8")).features) {
    for (const code of codesOf(f.properties)) {
      if (!neByCode.has(code)) neByCode.set(code, []);
      neByCode.get(code).push(f.geometry);
    }
  }
  const previous = new Set(
    fs.existsSync(path.join(OUT, "hires.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "hires.json"), "utf8")) : [],
  );
  const refused = [];

  const manifest = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
  const wb = JSON.parse(
    (await getText("https://api.worldbank.org/v2/country?format=json&per_page=500", "wb-countries.json")) || "[]",
  )[1] || [];
  const iso3Of = new Map(wb.map((c) => [c.iso2Code, c.id]));
  for (const [k, v] of Object.entries(EXTRA_ISO3)) iso3Of.set(k, v);

  const countries = loadCountries().filter((c) => c.code !== "US" && manifest[c.code]);
  const sources = {};
  const done = [];
  const skipped = [];
  const fellBack = [];

  for (const c of countries) {
    const ne = neByCode.get(c.code);
    if (!ne) continue;
    const neGeoms = ne.map((g) => JSON.parse(JSON.stringify(g)));
    neGeoms.forEach(rewind);
    // The divisions merged into the place itself: its largest landmass, not
    // its largest division, is what the map is framed on.
    const neTopo = topology({
      a: { type: "FeatureCollection", features: neGeoms.map((geometry) => ({ type: "Feature", properties: {}, geometry })) },
    });
    const neMerged = merge(neTopo, neTopo.objects.a.geometries);
    rewind(neMerged);
    const subset = SUBSETS[c.code];
    const coast = COASTS[c.code];
    let span = mainSpan(neMerged);
    if (!subset && !coast && !(span < MAX_SPAN_DEG)) continue;
    const neArea = areaKm2(neGeoms);
    // From Natural Earth's source, not the manifest a previous run changed.
    const neDivisions = ne.length;
    const ref = Number.isFinite(c.areaKm2) && c.areaKm2 > 0 ? c.areaKm2 : neArea;
    const inRange = (km2) => km2 >= 0.75 * Math.min(neArea, ref) && km2 <= 1.5 * Math.max(neArea, ref);

    let level, meta, features;
    if (coast) {
      /* A server that will not answer leaves the place as it was, rather
         than stopping every other place's build. */
      try {
        features = await coastFeatures(c.code);
      } catch (e) {
        refused.push(`${c.name} (OpenStreetMap did not answer: ${e.message})`);
        continue;
      }
      for (const f of features) rewind(f.geometry);
      const km2 = areaKm2(features.map((f) => f.geometry));
      if (!features.length || !inRange(km2)) {
        refused.push(`${c.name} (coastline ${km2.toFixed(0)} km² against ${neArea.toFixed(0)} Natural Earth, ${ref} listed)`);
        continue;
      }
      const date = features[0].osmDate || "";
      for (const f of features) delete f.osmDate;
      level = "OSM";
      meta = {
        boundarySource: "OpenStreetMap coastline",
        boundaryLicense: "Open Data Commons Open Database License 1.0",
        boundaryYearRepresented: date,
      };
    } else {
      const iso3 = subset ? subset.iso3 : iso3Of.get(c.code);
      if (!iso3) { skipped.push(`${c.name} (no ISO3)`); continue; }

      level = subset ? subset.level : neDivisions > 1 ? "ADM1" : "ADM0";
      meta = await gbMeta(iso3, level);
      /* No divisions published: the whole-territory outline instead. For a
         place this small the coastline is what reads; Natural Earth's internal
         lines here are drawn to the same coarse 1:10m as its coast. */
      if (!meta && level === "ADM1") {
        level = "ADM0";
        meta = await gbMeta(iso3, level);
      }
      if (!meta) { skipped.push(c.name); continue; }

      const load = async (lvl, m) => {
        const gj = JSON.parse(await getText(m.gjDownloadURL, `${iso3}-${lvl}.geojson`));
        const fs2 = gj.features
          .filter((f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"))
          // A subset keeps only its own divisions out of the country's file.
          .filter((f) => !subset?.names || subset.names.includes(f.properties.shapeName))
          .map((f) => ({
            type: "Feature",
            properties: { n: lvl === "ADM0" ? c.name : f.properties.shapeName || "" },
            geometry: f.geometry,
          }));
        for (const f of fs2) rewind(f.geometry);
        const km2 = areaKm2(fs2.map((f) => f.geometry));
        const ok = inRange(km2);
        return { features: fs2, km2, ok };
      };
      let got = await load(level, meta);
      /* Divisions drawn round whole atolls, sea and all, fail the check; the
         whole-territory outline may still be traced from the land. */
      if (!got.ok && level === "ADM1") {
        const m0 = await gbMeta(iso3, "ADM0");
        if (m0) {
          const g0 = await load("ADM0", m0);
          if (g0.ok) { level = "ADM0"; meta = m0; got = g0; }
        }
      }
      if (!got.ok) {
        refused.push(`${c.name} (${got.km2.toFixed(0)} km² against ${neArea.toFixed(0)} Natural Earth, ${ref} listed)`);
        continue;
      }
      features = got.features;
      if (subset) {
        const found = new Set(features.map((f) => f.properties.n));
        const missing = (subset.names ?? []).filter((n) => !found.has(n));
        if (missing.length) {
          refused.push(`${c.name} (not in ${iso3} ${level}: ${missing.join(", ")})`);
          continue;
        }
      }

    }
    /* Natural Earth's span is of the land it has, which for these places is
       the wrong land. Frame on the new outline's own main landmass. */
    if (subset || coast) {
      const t = topology({ a: { type: "FeatureCollection", features: JSON.parse(JSON.stringify(features)) } });
      const m = merge(t, t.objects.a.geometries);
      rewind(m);
      span = mainSpan(m);
    }

    /* Across 180° (Kiribati), longitudes west of it are moved up by 360° so
       quantisation spans the place, not the globe: across the globe each
       step was about 400 m and Tarawa drew as a staircase. d3 reads 190° as
       -170°, so nothing downstream changes. */
    let lo = Infinity, hi = -Infinity, lo2 = Infinity, hi2 = -Infinity, east = false, west = false;
    for (const ft of features)
      for (const poly of polysOf(ft.geometry))
        for (const ring of poly)
          for (const [l] of ring) {
            const l2 = l < 0 ? l + 360 : l;
            if (l < lo) lo = l;
            if (l > hi) hi = l;
            if (l2 < lo2) lo2 = l2;
            if (l2 > hi2) hi2 = l2;
            if (l > 90) east = true;
            if (l < -90) west = true;
          }
    if (east && west && hi2 - lo2 < hi - lo)
      for (const ft of features) for (const poly of polysOf(ft.geometry)) for (const ring of poly) for (const pt of ring) if (pt[0] < 0) pt[0] += 360;

    // Half a pixel at the size the map draws the main landmass.
    const tol = Math.max(span, 0.02) / CANVAS / 2;
    let topo = topology({ a: { type: "FeatureCollection", features } });
    topo = presimplify(topo, planarTriangleArea);
    topo = simplify(topo, tol * tol);
    /* Islets smaller than about two pixels are dropped: simplifying can
       collapse one to a sliver wound the wrong way (Saint Helena's did), and
       at this size nothing that small can be drawn anyway. */
    topo = filter(topo, filterWeight(topo, (2 * tol) * (2 * tol), planarRingArea));
    /* Quantised no coarser than the simplification. Across a scatter of
       islands - the Minor Outlying Islands span 120° - 1e5 steps is about
       130 m, several pixels of an island a kilometre wide. */
    let qx0 = Infinity, qx1 = -Infinity, qy0 = Infinity, qy1 = -Infinity;
    for (const ft of features)
      for (const poly of polysOf(ft.geometry))
        for (const ring of poly)
          for (const [x, y] of ring) {
            if (x < qx0) qx0 = x;
            if (x > qx1) qx1 = x;
            if (y < qy0) qy0 = y;
            if (y > qy1) qy1 = y;
          }
    const steps = Math.min(1e7, Math.max(1e5, Math.ceil(Math.max(qx1 - qx0, qy1 - qy0) / tol)));
    topo = quantize(topo, steps);

    // The rewind has to survive simplification: check the result, and keep
    // Natural Earth rather than ship a ring that draws inside out.
    const check = feature(topo, topo.objects.a);
    const backwards = check.features.some((f) =>
      polysOf(f.geometry).some((poly) => geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI),
    );
    if (backwards) {
      refused.push(`${c.name} (a ring still backwards after simplifying)`);
      continue;
    }

    const json = JSON.stringify(topo);
    fs.writeFileSync(path.join(OUT, `${c.code}.json`), json);
    manifest[c.code] = features.length;
    const year = String(meta.boundaryYearRepresented || "");
    sources[c.code] = {
      level,
      source: meta.boundarySource || "",
      license: meta.boundaryLicense || "",
      year,
      sourceShort: shortSource(meta.boundarySource || "", year),
      licenseShort: shortLicense(meta.boundaryLicense || "", meta.boundarySource || ""),
    };
    if (level === "ADM0" && neDivisions > 1) fellBack.push(c.name);
    done.push(`${c.code} ${level} ${features.length} feature(s), ${(json.length / 1024).toFixed(0)} KB — ${meta.boundaryLicense}`);
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(OUT, "hires.json"), JSON.stringify(Object.keys(sources).sort()));

  /* Anything replaced on an earlier run that is not replaced now goes back
     to Natural Earth, so no file is left from a source it no longer credits. */
  const restore = [...previous].filter((code) => !sources[code]);
  if (restore.length) {
    execSync(`node build-admin1.cjs ${restore.join(" ")}`, { cwd: __dirname, stdio: "inherit" });
    console.log(`restored Natural Earth for: ${restore.join(", ")}`);
  }
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    SOURCES_TS,
    `/**
 * Which focus-map outlines come from geoBoundaries rather than Natural Earth.
 *
 * GENERATED by build-hires-admin1.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * geoBoundaries (Runfola et al., 2020, "geoBoundaries: A global database of
 * political administrative boundaries", PLoS ONE 15(4)). Each entry keeps
 * the licence of its own source - CC BY 4.0 for the Sentinel-2 tracings, the
 * ODbL for OpenStreetMap, and CC BY-SA, CC BY, CC0 or public domain for
 * national mapping - and a share-alike file stays under its licence. The
 * page names the licence of the place in view.
 */
export const GEOBOUNDARIES_URL = "https://www.geoboundaries.org/";

export const ADMIN1_SOURCES: Record<
  string,
  {
    /** ADM3 where the place is a subset of its country's file (see SUBSETS in the script). */
    level: "ADM0" | "ADM1" | "ADM3" | "OSM";
    source: string;
    license: string;
    year: string;
    /** As the map caption shows them. */
    sourceShort: string;
    licenseShort: string;
  }
> = ${JSON.stringify(sources, null, 2)};
`,
  );

  console.log(`replaced ${done.length} file(s) with geoBoundaries:`);
  for (const d of done) console.log("  " + d);
  if (fellBack.length) console.log(`outline only (geoBoundaries has no divisions): ${fellBack.join(", ")}`);
  if (skipped.length) console.log(`kept Natural Earth for ${skipped.length} (not in geoBoundaries): ${skipped.join(", ")}`);
  if (refused.length) console.log(`kept Natural Earth for ${refused.length} (area check failed): ${refused.join("; ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
