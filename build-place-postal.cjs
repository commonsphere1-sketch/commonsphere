/**
 * Builds static/postal/<CC>.json - the postal codes of the places below a
 * country's first-order divisions: its towns and villages, its districts,
 * the counties of the United States, and the cities the United Nations
 * lists. A division's own postal codes are in static/divisions (see
 * build-subnation-details.cjs); these are for the windows that open inside it.
 *
 *   node build-place-postal.cjs
 *
 * Source:
 *
 *   GeoNames, postal codes (CC BY 4.0)
 *     https://download.geonames.org/export/zip/ - every postal code it lists,
 *     each with the name of the place it is filed under, the divisions it is
 *     in, and a point. The file is the one build-subnation-details.cjs
 *     fetches and keeps; this build reads the same copy.
 *
 * How a code is put with a place - each is a reading of GeoNames' own record,
 * and said to be wherever it is shown:
 *
 *   a county of the United States   by the county GeoNames files the code
 *     under (its state and its county's code, which together are the
 *     county's FIPS code). Nothing is worked out.
 *   a district                      by the outline that holds the code's
 *     point (static/geo/admin2).
 *   a town or a village             by its name, its district and how near
 *     it is. A code counts for a place where GeoNames files it under that
 *     place's name - the name the gazetteer gives it, or one of the other
 *     names the gazetteer lists for it; where the code's second-order
 *     division is the place's own, by GeoNames' code for it or by its name;
 *     and where its point is near the place: within 10 km of a place of
 *     fewer than 5,000 people, 20 km of one of fewer than 50,000, 40 km of a
 *     larger one. Where GeoNames names no second-order division for the code
 *     or for the place, the two cannot be compared, and the code must be
 *     nearer still: half those distances. Where two places of the same name
 *     both qualify, the code goes to the nearer. So a quarter that only
 *     shares a town's name, in the next district, is not counted to the
 *     town, and nor is a code filed under the name of a suburb: the count is
 *     of the codes filed under the place's own name in its own district,
 *     which for a large city is fewer than every code in use there.
 *   a city of the United Nations'   the codes of the gazetteer's place of
 *     the same name within 40 km of where the United Nations puts the city -
 *     the most populous, where more than one is.
 *
 * A code of France's with the word CEDEX after it - "69998 CEDEX 07", a
 * code for the post of one large body - is counted by the code itself.
 *
 * What is kept for each: how many codes, the first and the last in order,
 * and the codes themselves where there are no more than twenty. A place with
 * no code has no entry: nothing is filled in.
 *
 * GeoNames does not hold every country's codes in full - only the first part
 * for Canada, the Netherlands and the United Kingdom, and so on - and the
 * site says so beside the figure (src/lib/placePostal.ts, from GeoNames' own
 * readme).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { feature } = require("topojson-client");

const OUT = path.join(__dirname, "static/postal");
const ADMIN2 = path.join(__dirname, "static/geo/admin2");
const PLACES = path.join(__dirname, "static/places");
const ZIP = path.join(os.tmpdir(), "commonsphere-subnation-details", "geonames-postal", "allCountries.txt");
const GAZETTEER = path.join(os.tmpdir(), "commonsphere-places", "cities500.txt");
const SECOND = path.join(os.tmpdir(), "commonsphere-places", "admin2Codes.txt");
for (const [at, by] of [[ZIP, "build-subnation-details.cjs"], [GAZETTEER, "build-places.cjs"], [SECOND, "build-places.cjs"]]) {
  if (!fs.existsSync(at)) throw new Error(`${at} is not there: run ${by} first, which fetches it`);
}

/** A name as it is compared: lower case, without accents, with every run of marks and spaces as one space. */
const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const km = (aLat, aLon, bLat, bLon) => {
  const r = Math.PI / 180;
  const h = Math.sin(((bLat - aLat) * r) / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLon - aLon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
/** How near a code's point must be to a place to count for it, by the place's people. */
const reach = (people) => (people >= 50000 ? 40 : people >= 5000 ? 20 : 10);
/** One name is the other, or holds it as whole words: "Harris" and "Harris County". */
const sameName = (a, b) => a === b || ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `);
const sameCode = (a, b) => a === b || a.replace(/^0+/, "") === b.replace(/^0+/, "");
const LIST = 20;

/* ── A point in an outline, on the plane ── */
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
const boxed = (f, i) => ({
  i,
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
const holds = (d, pt) => d.polys.some((b) => pt[0] >= b.x0 && pt[0] <= b.x1 && pt[1] >= b.y0 && pt[1] <= b.y1 && inRing(pt, b.poly[0]) && !b.poly.slice(1).some((hole) => inRing(pt, hole)));

(async () => {
  /* ── The site's places, a country at a time, by each of their names ── */
  const onSite = new Map(); // cc → Map(geonameId → people)
  for (const f of fs.readdirSync(PLACES).filter((x) => /^[A-Z]{2}\.json$/.test(x))) {
    const file = JSON.parse(fs.readFileSync(path.join(PLACES, f), "utf8"));
    onSite.set(f.slice(0, 2), new Map(file.places.map((p) => [p[6], p[3]])));
  }
  const second = new Map(); // "CC.admin1.admin2" → its names, as compared
  for (const l of fs.readFileSync(SECOND, "utf8").split("\n")) {
    const f = l.split("\t");
    if (f[0]) second.set(f[0], [fold(f[1]), fold(f[2])].filter(Boolean));
  }
  const named = new Map(); // cc → { own: Map(name → place[]), other: Map(name → place[]) }
  let places = 0;
  for (const line of fs.readFileSync(GAZETTEER, "utf8").split("\n")) {
    if (!line) continue;
    const r = line.split("\t");
    const cc = r[8];
    const id = Number(r[0]);
    const here = onSite.get(cc);
    if (!here || !here.has(id)) continue;
    places++;
    const place = { id, lat: Number(r[4]), lon: Number(r[5]), people: here.get(id), code2: r[11] || "", names2: second.get(`${cc}.${r[10]}.${r[11]}`) ?? [] };
    if (!named.has(cc)) named.set(cc, { own: new Map(), other: new Map() });
    const book = named.get(cc);
    const put = (map, name) => {
      const k = fold(name);
      if (!k) return;
      if (!map.has(k)) map.set(k, []);
      if (!map.get(k).includes(place)) map.get(k).push(place);
    };
    put(book.own, r[1]);
    put(book.own, r[2]);
    for (const alt of (r[3] || "").split(",")) put(book.other, alt);
  }
  console.log(`places on the site found in the gazetteer: ${places}`);
  if (places < 200000) throw new Error("the site holds over 200,000 places");

  /**
   * The place a code counts for: of the places of the name it is filed under, the nearest that is in the code's own
   * second-order division and within reach - or, where the two divisions cannot be compared, within half that reach.
   * By a place's own name before any other name the gazetteer lists for it.
   */
  const placeFor = (cc, name, code2, name2, lat, lon) => {
    const book = named.get(cc);
    if (!book) return null;
    const k = fold(name);
    const rowName2 = fold(name2);
    for (const map of [book.own, book.other]) {
      let best = null;
      let bestKm = Infinity;
      for (const p of map.get(k) ?? []) {
        const d = km(lat, lon, p.lat, p.lon);
        const comparable = (code2 || rowName2) && p.code2;
        const agree = comparable && ((code2 && sameCode(code2, p.code2)) || (rowName2 && p.names2.some((n) => sameName(n, rowName2))));
        if (comparable && !agree) continue;
        if (d <= (comparable ? reach(p.people) : reach(p.people) / 2) && d < bestKm) {
          best = p;
          bestKm = d;
        }
      }
      if (best) return best;
    }
    return null;
  };

  /* ── The districts' outlines, read when a country's first code comes ── */
  const outlines = new Map();
  const outlinesOf = (cc) => {
    if (!outlines.has(cc)) {
      const at = path.join(ADMIN2, `${cc}.json`);
      let list = [];
      if (cc !== "US" && fs.existsSync(at)) {
        const topo = JSON.parse(fs.readFileSync(at, "utf8"));
        list = feature(topo, topo.objects[Object.keys(topo.objects)[0]]).features.map(boxed);
      }
      outlines.set(cc, list);
    }
    return outlines.get(cc);
  };

  /* ── The counties of the United States, by the state's letters and the county's code ── */
  const stateFips = new Map();
  for (const l of fs.readFileSync(path.join(__dirname, "src/data/usCounties.ts"), "utf8").split("\n")) {
    const m = /^  \["(\d{2})(\d{3})","[^"]*","([A-Z]{2})"/.exec(l);
    if (m) stateFips.set(m[3], m[1]);
  }
  if (stateFips.size < 50) throw new Error("the counties' file was not read");
  const countyIds = new Set(
    fs
      .readFileSync(path.join(__dirname, "src/data/usCounties.ts"), "utf8")
      .split("\n")
      .map((l) => /^  \["(\d{5})"/.exec(l)?.[1])
      .filter(Boolean),
  );

  /* ── Every code, put where it belongs ── */
  const sets = new Map(); // cc → { places: Map, districts: Map, counties: Map } of Set(code)
  const of = (cc) => {
    if (!sets.has(cc)) sets.set(cc, { places: new Map(), districts: new Map(), counties: new Map() });
    return sets.get(cc);
  };
  const add = (map, key, code) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(code);
  };
  const districtAt = new Map(); // "cc|lon|lat" → index or -1: many codes share a point
  let read = 0;
  const count = { places: 0, districts: 0, counties: 0 };
  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(ZIP), crlfDelay: Infinity });
    rl.on("line", (line) => {
      const f = line.split("\t");
      const cc = f[0];
      const code = (f[1] ?? "").trim().replace(/\s+CEDEX\b.*$/i, "");
      if (!cc || !code) return;
      read++;
      if (cc === "US") {
        const fips = stateFips.get(f[4]) && /^\d{3}$/.test(f[6] ?? "") ? stateFips.get(f[4]) + f[6] : null;
        if (fips && countyIds.has(fips)) {
          add(of(cc).counties, fips, code);
          count.counties++;
        }
      }
      const lat = Number(f[9]);
      const lon = Number(f[10]);
      if (f[9] === "" || f[10] === "" || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
      const place = placeFor(cc, f[2], (f[6] ?? "").trim(), f[5], lat, lon);
      if (place) {
        add(of(cc).places, place.id, code);
        count.places++;
      }
      const list = outlinesOf(cc);
      if (list.length) {
        const key = `${cc}|${f[10]}|${f[9]}`;
        if (!districtAt.has(key)) {
          const hit = list.find((d) => holds(d, [lon, lat]));
          districtAt.set(key, hit ? hit.i : -1);
        }
        const i = districtAt.get(key);
        if (i >= 0) {
          add(of(cc).districts, i, code);
          count.districts++;
        }
      }
    });
    rl.on("close", resolve);
    rl.on("error", reject);
  });
  console.log(`postal codes read: ${read}; put with a place ${count.places}, a district ${count.districts}, a US county ${count.counties}`);
  if (read < 500000) throw new Error("GeoNames lists over a million postal codes");

  /* ── The United Nations' cities, each by the gazetteer's place of its name ── */
  const cities = new Map(); // cc → Map(UN code → place id)
  let unRead = 0;
  for (const l of fs.readFileSync(path.join(__dirname, "src/data/unCities.ts"), "utf8").split("\n")) {
    if (!/^  \["[A-Z]{2}",\d+,/.test(l)) continue;
    const c = JSON.parse(l.trim().replace(/,$/, ""));
    unRead++;
    if (c[3] == null || c[4] == null) continue;
    const book = named.get(c[0]);
    if (!book) continue;
    let best = null;
    for (const map of [book.own, book.other]) {
      for (const p of map.get(fold(c[2])) ?? []) {
        if (km(c[3], c[4], p.lat, p.lon) <= 40 && (!best || p.people > best.people)) best = p;
      }
      if (best) break;
    }

    if (!best) continue;
    if (!cities.has(c[0])) cities.set(c[0], new Map());
    cities.get(c[0]).set(c[1], best.id);
  }
  if (unRead < 5000) throw new Error("the United Nations' cities were not read");

  /* ── Written, a country a file ── */
  const entry = (set) => {
    const codes = [...set].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    return codes.length <= LIST ? [codes.length, codes[0], codes[codes.length - 1], codes] : [codes.length, codes[0], codes[codes.length - 1]];
  };
  const table = (map) => Object.fromEntries([...map].sort((a, b) => String(a[0]).localeCompare(String(b[0]), "en", { numeric: true })).map(([k, set]) => [k, entry(set)]));
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {};
  const total = { places: 0, districts: 0, counties: 0, cities: 0, bytes: 0 };
  for (const cc of [...sets.keys()].sort()) {
    const s = sets.get(cc);
    const file = {};
    if (s.places.size) file.places = table(s.places);
    if (s.districts.size) file.districts = table(s.districts);
    if (s.counties.size) file.counties = table(s.counties);
    const ofCities = [...(cities.get(cc) ?? [])].filter(([, id]) => s.places.has(id));
    if (ofCities.length) file.cities = Object.fromEntries(ofCities.sort((a, b) => a[0] - b[0]).map(([code, id]) => [code, id]));
    if (!Object.keys(file).length) continue;
    const text = JSON.stringify(file);
    fs.writeFileSync(path.join(OUT, `${cc}.json`), text);
    manifest[cc] = [s.places.size, s.districts.size, s.counties.size, ofCities.length];
    total.places += s.places.size;
    total.districts += s.districts.size;
    total.counties += s.counties.size;
    total.cities += ofCities.length;
    total.bytes += text.length;
  }
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), countries: manifest }));
  console.log(`countries: ${Object.keys(manifest).length}; places ${total.places}, districts ${total.districts}, US counties ${total.counties}, UN cities ${total.cities}; ${(total.bytes / 1e6).toFixed(1)} MB`);
})();
