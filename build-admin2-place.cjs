/**
 * The districts build-admin2.cjs could not place in a first-order division, placed where it is certain - so that the
 * maps can put each country's divisions together from its districts, and every border inside meets (lib/secondOrder.ts).
 *
 * build-admin2.cjs places a district in the Natural Earth division (static/geo/admin1) holding most of the points sampled
 * from it. A district none of whose points falls in any - an islet off the coast, a sliver along a border, a country of
 * one division, where nothing is sampled - is left with none, and a country with any such was drawn from Natural Earth's
 * outlines, with its districts' borders running beside their edges. Here such a district is given a division only by:
 *
 *   1. the country having one division only (Guam, Puerto Rico, Monaco);
 *   2. its name being, accents and case aside, that of exactly one of the country's divisions (Lakshadweep);
 *   3. every district it shares an edge with lying in one and the same division (Madre de Deus, an island of Bahia).
 *
 * None of these is tried for a district three in four of whose points lie in another country's divisions - Taiwan's
 * counties in China's file, Crimea's in Ukraine's, Western Sahara's in Morocco's: it stays unplaced, as Natural Earth
 * leaves it out of the country. Nothing is placed by distance: the nearest coast is not always the division's (Naoshima
 * lies nearer Okayama and is Kagawa's). What stays unplaced is listed.
 *
 *   node build-admin2-place.cjs          (after build-admin2.cjs; then build-admin2-tiling.cjs and build-admin2-borders.cjs)
 *   node build-admin2-place.cjs --dry    (says what it would place, and writes nothing)
 */
const fs = require("fs");
const path = require("path");
const WRITE = !process.argv.includes("--dry");
const { feature } = require("topojson-client");
const { geoContains, geoBounds, geoArea } = require("d3-geo");
// As the app does it: a ring wound backwards is everything but itself to d3, so anything over a hemisphere is reversed.
const rewound = (f) => {
  const fix = (rings) => { if (geoArea({ type: "Polygon", coordinates: rings }) > 2 * Math.PI) for (const r of rings) r.reverse(); };
  if (f.geometry.type === "Polygon") fix(f.geometry.coordinates);
  else if (f.geometry.type === "MultiPolygon") f.geometry.coordinates.forEach(fix);
  return f;
};
const GEO = path.join(__dirname, "static/geo");
const fold = (s) => String(s).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Every country's first-order outlines, with boxes, for "lies in another country".
const admin1 = {};
for (const f of fs.readdirSync(path.join(GEO, "admin1")).filter((x) => /^[A-Z]{2}\.json$/.test(x))) {
  const t = JSON.parse(fs.readFileSync(path.join(GEO, "admin1", f), "utf8"));
  admin1[f.slice(0, 2)] = feature(t, t.objects[Object.keys(t.objects)[0]]).features.map(rewound).map((ft) => ({ ft, n: ft.properties.n, box: geoBounds(ft) }));
}
const inBox = (b, [x, y]) => (b[0][0] <= b[1][0] ? x >= b[0][0] && x <= b[1][0] : x >= b[0][0] || x <= b[1][0]) && y >= b[0][1] && y <= b[1][1];
// Natural Earth carves some places out under their own code but keeps them in the parent's file too (admin1-carve.cjs): those are not "another country".
const CARVED = { FR: ["GF", "GP", "MQ", "RE", "YT"], NL: ["BQ"], NO: ["SJ", "BV"], AU: ["CX", "CC"] };

/** The middle of a district's largest ring (as build-admin2.cjs places a district). */
function middleOf(geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const area = (r) => r.reduce((s, p, i) => s + (i ? (r[i - 1][0] * p[1] - p[0] * r[i - 1][1]) : 0), 0) / 2;
  let best = polys[0][0];
  for (const p of polys) if (Math.abs(area(p[0])) > Math.abs(area(best))) best = p[0];
  let a = 0, x = 0, y = 0;
  for (let i = 1; i < best.length; i++) {
    const [x0, y0] = best[i - 1], [x1, y1] = best[i];
    const c = x0 * y1 - x1 * y0;
    a += c; x += (x0 + x1) * c; y += (y0 + y1) * c;
  }
  return a ? [x / (3 * a), y / (3 * a)] : best[0];
}

const manifest = JSON.parse(fs.readFileSync(path.join(GEO, "admin2/manifest.json"), "utf8"));
const report = [];
let changed = 0;
for (const cc of Object.keys(manifest).sort()) {
  const file = path.join(GEO, "admin2", `${cc}.json`);
  if (!fs.existsSync(file) || !admin1[cc]) continue;
  const topo = JSON.parse(fs.readFileSync(file, "utf8"));
  const geos = topo.objects.a.geometries;
  const none = geos.map((g, i) => i).filter((i) => !geos[i].properties?.p && !geos[i].properties?.x);
  if (!none.length) continue;
  const shapes = feature(topo, topo.objects.a).features;
  const provinces = admin1[cc].filter((p) => p.n);
  const byName = new Map();
  for (const p of provinces) byName.set(fold(p.n), [...(byName.get(fold(p.n)) ?? []), p.n]);
  // Who touches whom, by shared arcs.
  const arcsOf = (g) => { const o = []; const w = (a) => a.forEach((x) => (typeof x === "number" ? o.push(x < 0 ? ~x : x) : w(x))); w(g.arcs); return o; };
  const users = new Map();
  geos.forEach((g, i) => arcsOf(g).forEach((a) => (users.get(a) ?? users.set(a, new Set()).get(a)).add(i)));
  const lines = [];
  // Rules 1-3 first; rule 4 (neighbours) is repeated so an enclave next to one just placed can follow, never across another country's ground.
  const decided = new Map();
  for (const i of none) {
    const g = geos[i];
    const n = g.properties?.n;
    if (provinces.length === 1) { decided.set(i, { p: provinces[0].n, why: "only division" }); continue; }
    // In another country's outline: three in four of its points (its middle five times, and up to sixteen of its edge) in that country's.
    const mid = middleOf(shapes[i].geometry);
    const polys = shapes[i].geometry.type === "Polygon" ? [shapes[i].geometry.coordinates] : shapes[i].geometry.coordinates;
    const ring = polys.map((p) => p[0]).reduce((a, b) => (b.length > a.length ? b : a));
    const step = Math.max(1, Math.ceil(ring.length / 16));
    const pts = [mid, mid, mid, mid, mid, ...ring.filter((_, k) => k % step === 0)];
    const votes = new Map();
    for (const pt of pts)
      for (const [k, list] of Object.entries(admin1))
        if (list.some((p) => inBox(p.box, pt) && geoContains(p.ft, pt))) { votes.set(k, (votes.get(k) ?? 0) + 1); break; }
    const top = [...votes].sort((a, b) => b[1] - a[1])[0];
    if (top && top[0] !== cc && !(CARVED[cc] ?? []).includes(top[0]) && top[1] >= 0.75 * pts.length) { decided.set(i, { x: top[0], why: `lies in ${top[0]} (${top[1]}/${pts.length})` }); continue; }
    const same = byName.get(fold(n)) ?? [];
    if (same.length === 1) { decided.set(i, { p: same[0], why: "same name" }); continue; }
  }
  for (let round = 0; round < 5; round++) {
    let more = false;
    for (const i of none) {
      if (decided.has(i)) continue;
      // Every neighbour placed, and all in one division: one neighbour unplaced, or in another, and it is left.
      const near = new Set();
      let touches = 0;
      let open = false;
      for (const a of arcsOf(geos[i])) for (const j of users.get(a)) {
        if (j === i) continue;
        const p = geos[j].properties?.p ?? decided.get(j)?.p;
        if (p) { near.add(p); touches++; }
        else open = true;
      }
      if (touches && !open && near.size === 1) { decided.set(i, { p: [...near][0], why: "its neighbours all in it" }); more = true; }
    }
    if (!more) break;
  }
  for (const i of none) {
    const d = decided.get(i);
    lines.push(`   ${geos[i].properties?.n} -> ${d ? `${d.p ?? "ABROAD " + d.x} (${d.why})` : "LEFT"}`);
    // Only a division is written: a district in another country's outline is left unplaced, as Natural Earth leaves it out.
    if (d?.p && WRITE) { geos[i].properties = { ...geos[i].properties, p: d.p }; changed++; }
  }
  report.push(`${cc} ${none.length}/${geos.length} placed ${[...decided.values()].filter((d) => d.p).length}\n${lines.join("\n")}`);
  if (WRITE && [...decided.values()].some((d) => d.p)) fs.writeFileSync(file, JSON.stringify(topo));
}
console.log(report.join("\n"));
console.log(WRITE ? `\nplaced and written: ${changed} districts` : "\n(dry run: nothing written)");
