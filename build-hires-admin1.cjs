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
const { presimplify, simplify, planarTriangleArea } = require("topojson-simplify");
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

/** Codes the World Bank country list does not carry. */
const EXTRA_ISO3 = { TW: "TWN", EH: "ESH", CK: "COK", NU: "NIU", JE: "JEY", GG: "GGY", VA: "VAT", XK: "XKX", PS: "PSE" };

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
  for (const f of JSON.parse(fs.readFileSync(RAW_NE, "utf8")).features) {
    const code = f.properties.iso_a2 && f.properties.iso_a2 !== "-99" ? f.properties.iso_a2 : null;
    if (!code) continue;
    if (!neByCode.has(code)) neByCode.set(code, []);
    neByCode.get(code).push(f.geometry);
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
    const span = mainSpan(neMerged);
    if (!(span < MAX_SPAN_DEG)) continue;
    const neArea = areaKm2(neGeoms);

    const iso3 = iso3Of.get(c.code);
    if (!iso3) { skipped.push(`${c.name} (no ISO3)`); continue; }

    // From Natural Earth's source, not the manifest a previous run changed.
    const neDivisions = ne.length;
    let level = neDivisions > 1 ? "ADM1" : "ADM0";
    let meta = await gbMeta(iso3, level);
    /* No divisions published: the whole-territory outline instead. For a
       place this small the coastline is what reads; Natural Earth's internal
       lines here are drawn to the same coarse 1:10m as its coast. */
    if (!meta && level === "ADM1") {
      level = "ADM0";
      meta = await gbMeta(iso3, level);
    }
    if (!meta) { skipped.push(c.name); continue; }

    const ref = Number.isFinite(c.areaKm2) && c.areaKm2 > 0 ? c.areaKm2 : neArea;
    const load = async (lvl, m) => {
      const gj = JSON.parse(await getText(m.gjDownloadURL, `${iso3}-${lvl}.geojson`));
      const fs2 = gj.features
        .filter((f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"))
        .map((f) => ({
          type: "Feature",
          properties: { n: lvl === "ADM0" ? c.name : f.properties.shapeName || "" },
          geometry: f.geometry,
        }));
      for (const f of fs2) rewind(f.geometry);
      const km2 = areaKm2(fs2.map((f) => f.geometry));
      const ok = km2 >= 0.75 * Math.min(neArea, ref) && km2 <= 1.5 * Math.max(neArea, ref);
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
    const features = got.features;

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
    topo = quantize(topo, 1e5);

    // The rewind has to survive simplification: check the result.
    const check = feature(topo, topo.objects.a);
    for (const f of check.features)
      for (const poly of polysOf(f.geometry))
        if (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI)
          throw new Error(`${c.code}: a ring is still backwards after simplifying`);

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
    level: "ADM0" | "ADM1";
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
