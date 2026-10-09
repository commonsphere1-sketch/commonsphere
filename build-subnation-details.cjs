/**
 * Builds static/divisions/<country>.json — what more is held of each division
 * beyond its record in subnations.ts: its postal codes, its other codes, its
 * languages and names, and its own economy and people where a dated, sourced
 * figure exists. A division's window fetches its country's file when it opens.
 *
 *   node build-subnations.cjs            (first: this reads what it writes)
 *   node build-subnation-details.cjs     (cached between runs in the system's temp folder)
 *
 * Two sources, each named beside what it gives:
 *
 *   GeoNames, postal codes (CC BY 4.0)
 *     https://download.geonames.org/export/zip/ - every postal code it lists,
 *     with the point it places the code at. A code is counted to the division
 *     whose outline, as the site's maps draw it (static/geo/admin1), holds
 *     that point - by place, not by name. For each division: how many codes,
 *     in how many places, and the first and the last in order. GeoNames' list
 *     is not whole in every country (Brazil's holds each municipality's main
 *     code, Canada's the first three characters of each), and says so itself.
 *
 *   Wikidata (CC0), the division's own record
 *     Its codes (postal, dialling, vehicle plate, FIPS 10-4, NUTS, HASC, its
 *     OpenStreetMap relation), time zone, official language, demonym, motto,
 *     nickname, what it is named after, elevation, highest point, share of
 *     water, the office of its head, how many divisions it contains, and its
 *     twinned places - as the record states them, without a statement that
 *     has ended or is deprecated. And its own figures - GDP, GDP per person,
 *     median income, unemployment, life expectancy, fertility, literacy,
 *     households, men, women, urban and rural population - each kept only
 *     where its statement is dated and cites a source of its own, the latest
 *     such; one outside what the measure can be (a rate over 100%) is dropped.
 *
 * Nothing is worked out beyond counting the postal codes and putting them in
 * order. A field with nothing behind it is left out, and the window says so.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");
const { execFileSync } = require("child_process");
const { feature } = require("topojson-client");

const OUT = path.join(__dirname, "static/divisions");
const ADMIN1 = path.join(__dirname, "static/geo/admin1");
const CACHE = path.join(os.tmpdir(), "commonsphere-subnation-details");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

async function cached(name, make) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const got = await make();
  fs.writeFileSync(at, JSON.stringify(got));
  return got;
}
async function wikidata(params) {
  // No "maxlag": these are under a hundred reads, a quarter of a second apart, and with it the servers' own lag held each one back by a minute.
  const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ format: "json", ...params })}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(90000) }).catch((e) => ({ ok: false, status: String(e), headers: new Map() }));
    if (res.ok) {
      const j = await res.json();
      if (!j.error) return j;
      if (j.error.code !== "maxlag" && attempt >= 2) throw new Error(`Wikidata: ${j.error.info}`);
    } else if (attempt >= 5) throw new Error(`Wikidata: ${res.status}`);
    await sleep(1000 * Math.max(Number(res.headers?.get?.("retry-after")) || 0, 3 * (attempt + 1)));
  }
}

/* ── Reading a record ── */
/** What a reference may hold and still not be a source: "imported from", its URL, the day it was read, and "based on heuristic". */
const NOT_A_SOURCE = new Set(["P143", "P4656", "P813", "P887"]);
const valued = (claims) => (claims ?? []).filter((c) => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value" && c.mainsnak.datavalue);
/** The statements that stand now: not ended, and the preferred ones where any are preferred. */
const current = (claims) => {
  const live = valued(claims).filter((c) => !c.qualifiers?.P582);
  const preferred = live.filter((c) => c.rank === "preferred");
  return preferred.length ? preferred : live;
};
const yearOf = (v) => {
  const m = v?.time ? /^\+(\d{4})-/.exec(v.time) : null;
  return m && (v.precision ?? 0) >= 9 ? Number(m[1]) : undefined;
};
const strings = (e, p) => [...new Set(current(e.claims?.[p]).map((c) => c.mainsnak.datavalue.value).filter((v) => typeof v === "string" && v.trim()))];
const english = (e, p) => [...new Set(current(e.claims?.[p]).map((c) => c.mainsnak.datavalue.value).filter((v) => v?.language === "en" && v.text).map((v) => v.text.trim()))];
const things = (e, p) => [...new Set(current(e.claims?.[p]).map((c) => c.mainsnak.datavalue.value?.id).filter(Boolean))];
const unitOf = (v) => (v?.unit && v.unit !== "1" ? v.unit.split("/").pop() : null);
/** The latest figure whose statement is dated and cites a source of its own: [year, amount, its unit's record]. */
function dated(e, p, ok = () => true) {
  let best = null;
  for (const c of valued(e.claims?.[p])) {
    const year = yearOf(c.qualifiers?.P585?.[0]?.datavalue?.value);
    const amount = Number(c.mainsnak.datavalue.value?.amount);
    const sourced = (c.references ?? []).some((r) => Object.keys(r.snaks).some((k) => !NOT_A_SOURCE.has(k)));
    if (!year || !Number.isFinite(amount) || !sourced || !ok(amount)) continue;
    if (!best || year > best[0] || (year === best[0] && c.rank === "preferred")) best = [year, amount, unitOf(c.mainsnak.datavalue.value)];
  }
  return best;
}

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
const holds = (d, pt) => d.polys.some((b) => pt[0] >= b.x0 && pt[0] <= b.x1 && pt[1] >= b.y0 && pt[1] <= b.y1 && inRing(pt, b.poly[0]) && !b.poly.slice(1).some((hole) => inRing(pt, hole)));

(async () => {
  const rows = fs
    .readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8")
    .split("\n")
    .filter((l) => /^  "\{/.test(l))
    .map((l) => JSON.parse(JSON.parse(l.trim().replace(/,$/, ""))));
  const out = new Map(rows.map((r) => [r.id, {}]));
  const idOf = new Map(rows.map((r) => [`${r.cc}|${r.name}`, r.id]));

  /* ── GeoNames' postal codes, each counted to the division whose outline holds its point ── */
  const zipDir = path.join(CACHE, "geonames-postal");
  const zipTxt = path.join(zipDir, "allCountries.txt");
  if (!fs.existsSync(zipTxt)) {
    fs.mkdirSync(zipDir, { recursive: true });
    const zip = path.join(zipDir, "allCountries.zip");
    execFileSync("curl", ["-sSfL", "-m", "1800", "-A", UA, "-o", zip, "https://download.geonames.org/export/zip/allCountries.zip"], { stdio: ["ignore", "ignore", "pipe"] });
    // Unpacked where it was put, in a folder of its own; only the one text file is read.
    // Run from inside the folder, by the file's bare name: a tar that reads "C:" as a host is not confused by it. unzip where there is one, and otherwise the system's own tar, which reads zip files.
    try {
      execFileSync("unzip", ["-o", "-q", "allCountries.zip"], { cwd: zipDir, stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      execFileSync(path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe"), ["-xf", "allCountries.zip"], { cwd: zipDir, stdio: ["ignore", "ignore", "pipe"] });
    }
  }
  const outlines = new Map();
  const outlinesOf = (cc) => {
    if (!outlines.has(cc)) {
      const at = path.join(ADMIN1, `${cc}.json`);
      let list = [];
      if (fs.existsSync(at)) {
        const topo = JSON.parse(fs.readFileSync(at, "utf8"));
        list = feature(topo, topo.objects[Object.keys(topo.objects)[0]]).features.filter((f) => f.properties.n).map(boxed);
      }
      outlines.set(cc, list);
    }
    return outlines.get(cc);
  };
  const postal = new Map(); // division id → { codes:Set, places:Set }
  let read = 0;
  let placed = 0;
  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(zipTxt), crlfDelay: Infinity });
    rl.on("line", (line) => {
      const f = line.split("\t");
      const cc = f[0];
      const code = (f[1] ?? "").trim();
      const lat = Number(f[9]);
      const lon = Number(f[10]);
      if (!cc || !code || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
      read++;
      const list = outlinesOf(cc);
      const hit = list.find((d) => holds(d, [lon, lat]) || holds(d, [lon + 360, lat]));
      const id = hit && idOf.get(`${cc}|${hit.n}`);
      if (!id) return;
      placed++;
      if (!postal.has(id)) postal.set(id, { codes: new Set(), places: new Set() });
      postal.get(id).codes.add(code);
      if (f[2]) postal.get(id).places.add(f[2]);
    });
    rl.on("close", resolve);
    rl.on("error", reject);
  });
  console.log(`postal codes read: ${read}, placed in a division: ${placed}, divisions with any: ${postal.size}`);
  if (read < 500000) throw new Error("GeoNames lists over a million postal codes");
  for (const [id, p] of postal) {
    const codes = [...p.codes].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    out.get(id).postal = { n: codes.length, places: p.places.size, from: codes[0], to: codes[codes.length - 1] };
  }

  /* ── Each division's own Wikidata record ── */
  const withRecord = rows.filter((r) => r.qid);
  const entities = {};
  for (let i = 0; i < withRecord.length; i += 50) {
    const batch = withRecord.slice(i, i + 50).map((r) => r.qid);
    const got = await cached(`claims-${hash(batch.join(" "))}.json`, async () => {
      const res = await wikidata({ action: "wbgetentities", ids: batch.join("|"), props: "claims" });
      await sleep(250);
      return res.entities ?? {};
    });
    Object.assign(entities, got);
    if ((i / 50) % 20 === 0) console.log(`records ${Math.min(i + 50, withRecord.length)} of ${withRecord.length}…`);
  }
  const wantLabel = new Set();
  const pct = (v) => v >= 0 && v <= 100;
  for (const r of withRecord) {
    const e = entities[r.qid];
    if (!e?.claims) continue;
    const d = out.get(r.id);
    const one = (key, list, most = 1) => {
      if (list.length) d[key] = most === 1 ? list[0] : list.slice(0, most);
    };
    // A postal code is digits, Latin letters and the marks between them: a statement with words of another script in it - "78000-000 по 78890-000" - is not kept.
    one("postalOwn", strings(e, "P281").filter((v) => /^[0-9A-Za-z \-–—,.;:/()]+$/.test(v)), 3);
    one("dial", strings(e, "P473"), 3);
    one("plate", strings(e, "P395"), 3);
    one("fips", strings(e, "P901"));
    one("nuts", strings(e, "P605"));
    one("hasc", strings(e, "P8119"));
    one("osm", strings(e, "P402"));
    one("demonym", english(e, "P1549"), 2);
    one("motto", english(e, "P1451"));
    one("nickname", english(e, "P1449"), 2);
    for (const [key, p, most] of [["tz", "P421", 3], ["langs", "P37", 6], ["highest", "P610", 1], ["namedAfter", "P138", 2], ["headOffice", "P1313", 1], ["twins", "P190", 12]]) {
      const ids = things(e, p).slice(0, most);
      if (ids.length) {
        d[key] = ids;
        ids.forEach((q) => wantLabel.add(q));
      }
    }
    const height = current(e.claims.P2044).map((c) => c.mainsnak.datavalue.value).find((v) => unitOf(v) === "Q11573");
    if (height && Number.isFinite(Number(height.amount))) d.elevation = Math.round(Number(height.amount));
    const water = current(e.claims.P2927).map((c) => Number(c.mainsnak.datavalue.value?.amount)).find((v) => pct(v));
    if (water !== undefined) d.water = Number(water.toFixed(2));
    const inside = current(e.claims.P150).length;
    if (inside) d.parts = inside;
    for (const [key, p, ok] of [
      ["gdp", "P2131", (v) => v > 0],
      ["gdpPc", "P2132", (v) => v > 0],
      ["income", "P3529", (v) => v > 0],
      ["unemployment", "P1198", pct],
      ["lifeExp", "P2250", (v) => v >= 20 && v <= 100],
      ["fertility", "P4841", (v) => v > 0 && v <= 10],
      ["literacy", "P6897", pct],
      ["households", "P1538", (v) => v > 0],
      ["women", "P1539", (v) => v > 0],
      ["men", "P1540", (v) => v > 0],
      ["urban", "P6343", (v) => v >= 0],
      ["rural", "P6344", (v) => v >= 0],
    ]) {
      const hit = dated(e, p, ok);
      if (!hit) continue;
      // Money needs its currency: a figure with none is not kept.
      if (["gdp", "gdpPc", "income"].includes(key)) {
        if (!hit[2]) continue;
        wantLabel.add(hit[2]);
        d[key] = [hit[0], hit[1], hit[2]];
      } else d[key] = [hit[0], hit[1]];
    }
  }

  /* ── The names of what the records point at ── */
  const labels = {};
  const need = [...wantLabel].sort();
  for (let i = 0; i < need.length; i += 50) {
    const batch = need.slice(i, i + 50);
    const got = await cached(`labels-${hash(batch.join(" "))}.json`, async () => {
      const res = await wikidata({ action: "wbgetentities", ids: batch.join("|"), props: "labels", languages: "en" });
      await sleep(250);
      return Object.fromEntries(Object.entries(res.entities ?? {}).map(([q, e]) => [q, e.labels?.en?.value ?? null]));
    });
    Object.assign(labels, got);
    if ((i / 50) % 40 === 0) console.log(`names ${Math.min(i + 50, need.length)} of ${need.length}…`);
  }
  const named = (ids) => ids.map((q) => labels[q]).filter(Boolean);
  for (const d of out.values()) {
    for (const key of ["tz", "langs", "namedAfter", "twins"]) if (d[key]) (d[key] = named(d[key])), d[key].length || delete d[key];
    for (const key of ["highest", "headOffice"]) if (d[key]) (d[key] = named(d[key])[0]), d[key] || delete d[key];
    for (const key of ["gdp", "gdpPc", "income"]) if (d[key]) labels[d[key][2]] ? (d[key][2] = labels[d[key][2]]) : delete d[key];
  }

  /* ── One file a country ── */
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const byCountry = new Map();
  const tally = {};
  for (const r of rows) {
    const d = out.get(r.id);
    if (!Object.keys(d).length) continue;
    for (const k of Object.keys(d)) tally[k] = (tally[k] ?? 0) + 1;
    if (!byCountry.has(r.cc)) byCountry.set(r.cc, {});
    byCountry.get(r.cc)[r.id] = d;
  }
  let total = 0;
  for (const [cc, list] of byCountry) {
    const json = JSON.stringify(list);
    fs.writeFileSync(path.join(OUT, `${cc}.json`), json);
    total += json.length;
  }
  console.log(`wrote ${byCountry.size} countries, ${(total / 1048576).toFixed(2)} MB`);
  console.log("divisions with each field:", JSON.stringify(tally));
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
