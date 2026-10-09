/**
 * The second-order divisions of every country that has them published openly
 * - counties, districts, municipalities, whatever its second order is - as one
 * simplified, quantised TopoJSON per country, with a manifest that says whose
 * each country's boundaries are and under which licence.
 *
 *   node build-admin2.cjs
 *
 * Source: geoBoundaries (William & Mary geoLab), its gbOpen release, level
 * ADM2: https://www.geoboundaries.org/ . gbOpen gathers each country's
 * boundaries from its own publisher - a statistics office, a mapping agency,
 * OCHA, OpenStreetMap - and records the licence of each. A country is kept
 * only where that licence allows use on a commercial site: public domain,
 * CC0, CC BY, CC BY-SA, the Open Database License, or a government's open
 * licence that asks for attribution and no more. One given to geoBoundaries
 * by direct permission is left out: the permission was theirs.
 *
 * The United States is not taken from here: its counties are the Census
 * Bureau's, by us-atlas, and each has a record of its own on the site.
 *
 * Each division carries its name as geoBoundaries has it, and the first-order
 * division it lies in: the one of the country's Natural Earth divisions
 * (static/geo/admin1) that holds most of the points sampled from its outline
 * and its middle. Nothing else is worked out: no area is measured from an
 * outline that has been simplified.
 *
 * The outlines are for a map a country wide, drawn up to twelve times closer:
 * points that close a triangle too small to see there are dropped, with the
 * borders divisions share kept shared, and so is an islet too small to see -
 * never a division's largest piece, so every division keeps an outline.
 *
 * Downloads are cached in the system's temporary folder
 * (commonsphere-admin2), so a second run reads no network.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { topology } = require("topojson-server");
const { presimplify, simplify } = require("topojson-simplify");
const { feature, quantize } = require("topojson-client");

const OUT = path.join(__dirname, "static/geo/admin2");
const ADMIN1 = path.join(__dirname, "static/geo/admin1");
const CACHE = path.join(os.tmpdir(), "commonsphere-admin2");
const UA = { "User-Agent": "commonsphere-build (admin2)" };
/** How fine an outline is kept: the smallest triangle a point may close, as a share of the country's longer side, squared. */
const DETAIL = Number(process.env.ADMIN2_DETAIL || 1500);
/** The smallest piece of a division that is kept beside its largest: its area, as a share of the country's longer side, squared. */
const ISLET = Number(process.env.ADMIN2_ISLET || 800);

/** The licences a commercial site can use, as geoBoundaries names them. */
const USABLE = [
  /^Public Domain$/i,
  /CC0/i,
  /Public Domain Dedication/i,
  /^Creative Commons Attribution[- ](\d|Share|International)/i,
  /^Creative Commons Attribution \d/i,
  /^Open Data Commons Open Database License/i,
  /^Open Government/i,
  /^Etalab Open License/i,
  /^Data license Germany - Attribution/i,
  /^Federal Office of Topography swisstopo License$/i,
  /^National Institute of Statistics \(INE\) Data License$/i,
  /^Singapore Open Data License/i,
];
const usable = (licence) => !/non-?commercial|direct permission/i.test(licence) && USABLE.some((r) => r.test(licence));

/** Codes the World Bank's list does not carry, three letters to two. */
const EXTRA = {
  TWN: "TW", ESH: "EH", COK: "CK", NIU: "NU", JEY: "JE", GGY: "GG", VAT: "VA", AIA: "AI", MSR: "MS", FLK: "FK", SHN: "SH", PCN: "PN",
  TKL: "TK", WLF: "WF", SPM: "PM", BLM: "BL", BES: "BQ", ALA: "AX", SJM: "SJ", NFK: "NF", CXR: "CX", CCK: "CC", GUF: "GF", GLP: "GP",
  MTQ: "MQ", REU: "RE", MYT: "YT", XKX: "XK", PSE: "PS",
};

async function cached(name, url, check) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && fs.statSync(at).size > 0) return fs.readFileSync(at, "utf8");
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: UA, redirect: "follow" });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      const text = await r.text();
      if (check && !check(text)) throw new Error(`unexpected body from ${url}: ${text.slice(0, 80)}`);
      fs.writeFileSync(at, text);
      return text;
    } catch (e) {
      if (attempt >= 4) throw e;
      await new Promise((ok) => setTimeout(ok, 1500 * attempt));
    }
  }
}

/* ── A point in a polygon, on the plane: enough to say which division a district lies in. ── */
const inRing = (pt, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const polysOf = (g) => (!g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const inGeometry = (pt, g) => polysOf(g).some((poly) => inRing(pt, poly[0]) && !poly.slice(1).some((hole) => inRing(pt, hole)));
/** A first-order division as it is searched: each of its polygons with the box around it, so that a point far from it costs nothing. */
const boxed = (f) => ({
  n: f.properties.n,
  polys: polysOf(f.geometry).map((poly) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of poly[0]) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    return { poly, x0, y0, x1, y1 };
  }),
});
const holds = (parent, pt) =>
  parent.polys.some((b) => pt[0] >= b.x0 && pt[0] <= b.x1 && pt[1] >= b.y0 && pt[1] <= b.y1 && inRing(pt, b.poly[0]) && !b.poly.slice(1).some((hole) => inRing(pt, hole)));
const ringArea = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return a / 2;
};
const ringMiddle = (ring) => {
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    x += (ring[j][0] + ring[i][0]) * f;
    y += (ring[j][1] + ring[i][1]) * f;
    a += f;
  }
  return a ? [x / (3 * a), y / (3 * a)] : ring[0];
};
/** The points a district is placed by: the middle of its largest ring, counted five times, and up to sixteen points of that ring. */
function samples(g) {
  const rings = polysOf(g).map((p) => p[0]);
  if (!rings.length) return [];
  const largest = rings.reduce((best, r) => (Math.abs(ringArea(r)) > Math.abs(ringArea(best)) ? r : best));
  const mid = ringMiddle(largest);
  const step = Math.max(1, Math.ceil(largest.length / 16));
  return [mid, mid, mid, mid, mid, ...largest.filter((_, i) => i % step === 0)];
}

/* As build-admin1.cjs does it: a country across 180° is unwrapped, so that it is one piece and not two at the map's edges. */
function unwrapAntimeridian(features) {
  let hasEast = false, hasWest = false, min = Infinity, max = -Infinity;
  const each = (fn) => {
    for (const f of features) for (const poly of polysOf(f.geometry)) for (const ring of poly) for (const pt of ring) fn(pt);
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

/** The word a publisher has for its second order, where geoBoundaries records one that is a word for it. */
const kindOf = (raw, country) => {
  const k = String(raw ?? "").trim();
  // Some records carry the country's own name, or its style, where the word should be.
  if (!k || /^(unknown|nan|gbopen)$/i.test(k) || /republic|kingdom|schedule/i.test(k) || k.length > 40 || k.toLowerCase() === String(country ?? "").trim().toLowerCase()) return undefined;
  return k;
};

(async () => {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const meta = JSON.parse(await cached("meta-ADM2.json", "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM2/", (t) => t.trim().startsWith("[")));
  const wb = JSON.parse(await cached("wb-countries.json", "https://api.worldbank.org/v2/country?format=json&per_page=400", (t) => t.trim().startsWith("[")))[1];
  const iso2 = { ...EXTRA };
  for (const c of wb) if (c.iso2Code && c.id && !iso2[c.id]) iso2[c.id] = c.iso2Code;

  const manifest = {};
  const left = [];
  let total = 0;
  let units = 0;
  let placed = 0;
  let islets = 0;
  let biggest = { code: "", kb: 0 };
  for (const m of [...meta].sort((a, b) => a.boundaryISO.localeCompare(b.boundaryISO))) {
    const iso = m.boundaryISO;
    const code = iso2[iso];
    if (iso === "USA") continue; // the Census Bureau's counties, by us-atlas
    if (!code) {
      left.push(`${iso}: no two-letter code`);
      continue;
    }
    if (!usable(m.boundaryLicense)) {
      left.push(`${iso}: ${m.boundaryLicense}`);
      continue;
    }
    let url = m.simplifiedGeometryGeoJSON;
    let text = await cached(`${iso}.geojson`, url, (t) => t.trim().startsWith("{") || t.startsWith("version https://git-lfs"));
    if (text.startsWith("version https://git-lfs")) {
      // The file is kept in Git's large-file store: asked for there.
      fs.unlinkSync(path.join(CACHE, `${iso}.geojson`));
      url = url.replace("https://github.com/wmgeolab/geoBoundaries/raw/", "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/");
      text = await cached(`${iso}.geojson`, url, (t) => t.trim().startsWith("{"));
    }
    process.stdout.write(`${iso}… `);
    const src = JSON.parse(text);

    const features = src.features
      .filter((f) => f.geometry && polysOf(f.geometry).length && String(f.properties.shapeName ?? "").trim())
      .map((f) => ({ type: "Feature", properties: { n: String(f.properties.shapeName).trim() }, geometry: f.geometry }));
    if (!features.length) {
      left.push(`${iso}: no named outlines`);
      continue;
    }

    // The first-order division each lies in, among the ones the site's maps draw for the country.
    const a1 = path.join(ADMIN1, `${code}.json`);
    if (fs.existsSync(a1)) {
      const topo = JSON.parse(fs.readFileSync(a1, "utf8"));
      const parents = feature(topo, topo.objects[Object.keys(topo.objects)[0]]).features.filter((f) => f.properties.n).map(boxed);
      if (parents.length > 1)
        for (const f of features) {
          const votes = new Map();
          for (const pt of samples(f.geometry))
            for (const p of parents)
              if (holds(p, pt) || holds(p, [pt[0] + 360, pt[1]])) {
                votes.set(p.n, (votes.get(p.n) ?? 0) + 1);
                break;
              }
          const best = [...votes].sort((x, y) => y[1] - x[1])[0];
          if (best) {
            f.properties.p = best[0];
            placed++;
          }
        }
    }

    unwrapAntimeridian(features);
    let lo = [Infinity, Infinity];
    let hi = [-Infinity, -Infinity];
    for (const f of features) for (const poly of polysOf(f.geometry)) for (const pt of poly[0]) {
      lo = [Math.min(lo[0], pt[0]), Math.min(lo[1], pt[1])];
      hi = [Math.max(hi[0], pt[0]), Math.max(hi[1], pt[1])];
    }
    const side = Math.max(hi[0] - lo[0], hi[1] - lo[1]) || 1;
    // An islet too small to see goes; a division's largest piece never does.
    for (const f of features) {
      if (f.geometry.type !== "MultiPolygon") continue;
      const sized = f.geometry.coordinates.map((poly) => ({ poly, a: Math.abs(ringArea(poly[0])) }));
      const most = Math.max(...sized.map((x) => x.a));
      const keep = sized.filter((x) => x.a === most || x.a >= (side / ISLET) ** 2).map((x) => x.poly);
      islets += sized.length - keep.length;
      f.geometry = keep.length === 1 ? { type: "Polygon", coordinates: keep[0] } : { type: "MultiPolygon", coordinates: keep };
    }
    // Simplifying leaves the points as plain longitudes and latitudes: they are put back on a grid, a hundred thousand steps to the side, which is what keeps the file small.
    const topo = quantize(simplify(presimplify(topology({ a: { type: "FeatureCollection", features } }, 1e5)), (side / DETAIL) ** 2), 1e5);

    // Every division must still have an outline once the small points are gone.
    const kept = topo.objects.a.geometries.filter((g) => g.type && g.arcs && g.arcs.length).length;
    if (kept !== features.length) throw new Error(`${iso}: ${features.length - kept} divisions lost their outline`);
    const json = JSON.stringify(topo);
    fs.writeFileSync(path.join(OUT, `${code}.json`), json);
    total += json.length;
    units += features.length;
    if (json.length / 1024 > biggest.kb) biggest = { code, kb: json.length / 1024 };
    manifest[code] = {
      n: features.length,
      ...(kindOf(m.boundaryCanonical, m.boundaryName) ? { kind: kindOf(m.boundaryCanonical, m.boundaryName) } : {}),

      by: String(m.boundarySource).trim(),
      licence: String(m.boundaryLicense).trim(),
      year: String(m.boundaryYearRepresented).trim(),
    };
    process.stdout.write(`${code} ${features.length} ${(json.length / 1024).toFixed(0)}KB  `);
  }
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  console.log(`\n\ncountries written: ${Object.keys(manifest).length}`);
  console.log(`divisions:         ${units}, ${placed} of them placed in a first-order division`);
  console.log(`islets dropped:    ${islets}`);
  console.log(`total on disk:     ${(total / 1048576).toFixed(1)} MB`);

  console.log(`largest:           ${biggest.code} at ${biggest.kb.toFixed(0)} KB`);
  console.log(`left out:          ${left.length ? left.join("; ") : "none"}`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
