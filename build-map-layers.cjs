/**
 * Builds the world map's physical and infrastructure layers:
 *
 *   static/geo/rivers.json   rivers and lake centrelines   Natural Earth 1:10m
 *   static/geo/lakes.json    lakes and reservoirs          Natural Earth 1:10m
 *   static/geo/ports.json    ports                         Natural Earth 1:10m
 *   static/geo/mines.json    mineral sites                 USGS, two datasets
 *
 * Natural Earth is public domain. The two USGS datasets are US Government work
 * and likewise in the public domain; both are cited in the files they produce
 * and in the note the page prints under the map.
 *
 * A word on the mineral layer, because it is the one that can mislead. It
 * merges two datasets that answer different questions, and neither is current:
 *
 *   - "Mineral operations outside the United States" (USGS minfac) lists
 *     working mines, plants, refineries and smelters, surveyed 2003-2008. As
 *     the title says, it holds no US records at all.
 *   - "Major mineral deposits of the world" (USGS OFR 2005-1294) lists known
 *     deposits, which is a different thing from a working mine, and does cover
 *     the United States.
 *
 * They are kept apart by a `k` flag rather than merged into one count, because
 * a deposit and an operation at the same place are two different facts and
 * summing them would invent a total neither source reports. The US gap is
 * stated in the output and shown on the page, so an empty United States reads
 * as a gap in the source rather than as an absence of mines.
 *
 * Nothing here is estimated or interpolated. A record without usable
 * coordinates is dropped and counted, not placed.
 *
 *   node build-map-layers.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { topology } = require("topojson-server");
const { simplify, simplifyRing } = require("./geo-simplify.cjs");

const OUT_DIR = path.join(__dirname, "static/geo");
const CACHE = path.join(os.tmpdir(), "commonsphere-map-layers");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";

/* Same tolerance as the admin-1 border layer: under half a pixel at the map's
   deepest zoom, so simplification is never visible. */
const TOLERANCE = 0.02;
/* Coordinates are written to 4 decimal places, about 11 m at the equator. The
   map draws a port as a 2 px dot, so more precision would only add bytes. */
const COORD_DP = 4;

const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/";
const SOURCES = {
  rivers: { url: NE + "ne_10m_rivers_lake_centerlines.geojson", file: "ne_10m_rivers_lake_centerlines.geojson" },
  lakes: { url: NE + "ne_10m_lakes.geojson", file: "ne_10m_lakes.geojson" },
  ports: { url: NE + "ne_10m_ports.geojson", file: "ne_10m_ports.geojson" },
  minfac: { url: "https://mrdata.usgs.gov/mineral-operations/minfac-csv.zip", file: "minfac-csv.zip", binary: true },
  deposits: { url: "https://mrdata.usgs.gov/major-deposits/ofr20051294-csv.zip", file: "ofr20051294-csv.zip", binary: true },
};

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

async function grab(key) {
  const { url, file, binary } = SOURCES[key];
  const at = path.join(CACHE, file);
  if (!fs.existsSync(at)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${key}: HTTP ${res.status} from ${url}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  return binary ? fs.readFileSync(at) : fs.readFileSync(at, "utf8");
}

/**
 * Reads one entry out of a ZIP. Node ships no unzip, and the alternative -
 * shelling out to a platform's own archiver - would make this script run on
 * Windows only. Handles stored (0) and deflated (8) entries, which is what the
 * two USGS archives use.
 */
function unzip(buf, wanted) {
  // Walk back from the end for the end-of-central-directory record.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a ZIP: no end-of-central-directory record");
  let off = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("ZIP central directory is malformed");
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    if (name.toLowerCase().endsWith(wanted.toLowerCase())) {
      if (buf.readUInt32LE(localOff) !== 0x04034b50) throw new Error("ZIP local header is malformed");
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(start, start + compSize);
      if (method === 0) return raw.toString("utf8");
      if (method === 8) return zlib.inflateRawSync(raw).toString("utf8");
      throw new Error(`ZIP entry ${name} uses unsupported compression ${method}`);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`ZIP has no entry ending in ${wanted}`);
}

/** RFC 4180 CSV: quoted fields, embedded commas, doubled quotes, CRLF. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.length === head.length)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const round = (n) => Number(n.toFixed(COORD_DP));
const usable = (lon, lat) =>
  Number.isFinite(lon) && Number.isFinite(lat) &&
  Math.abs(lat) <= 90 && Math.abs(lon) <= 180 &&
  // A record defaulted to the origin is a missing coordinate, not the Gulf of
  // Guinea; both USGS files use 0,0 that way.
  !(lon === 0 && lat === 0);

/** Interns strings into a table so the row arrays carry indices, not repeats. */
function interner() {
  const table = [];
  const seen = new Map();
  return {
    table,
    idx(v) {
      const s = (v ?? "").trim();
      if (!s) return -1;
      if (!seen.has(s)) { seen.set(s, table.length); table.push(s); }
      return seen.get(s);
    },
  };
}

const written = [];
function write(name, data, note) {
  const at = path.join(OUT_DIR, name);
  fs.writeFileSync(at, JSON.stringify(data));
  const kb = fs.statSync(at).size / 1024;
  const gz = zlib.gzipSync(fs.readFileSync(at)).length / 1024;
  written.push({ name, kb, gz });
  console.log(`  ${name.padEnd(12)} ${kb.toFixed(0).padStart(5)} KB  (${gz.toFixed(0)} KB gzipped)  ${note}`);
}

(async () => {
  const today = new Date().toISOString().slice(0, 10);

  /* ── Rivers ───────────────────────────────────────────────────────────── */
  console.log("rivers");
  {
    const gj = JSON.parse(await grab("rivers"));
    let before = 0, after = 0, dropped = 0;
    const features = [];
    for (const f of gj.features) {
      const g = f.geometry;
      if (!g) continue;
      const lines = g.type === "LineString" ? [g.coordinates] : g.coordinates;
      before += lines.reduce((n, l) => n + l.length, 0);
      const kept = lines.map((l) => simplify(l, TOLERANCE)).filter((l) => l.length > 1);
      after += kept.reduce((n, l) => n + l.length, 0);
      if (!kept.length) { dropped++; continue; }
      features.push({
        type: "Feature",
        // s is scalerank: 1 is the Amazon, 10 a minor tributary. The page draws
        // the major rivers at world view and the rest only once zoomed in.
        properties: { n: f.properties.name || f.properties.name_en || "", s: f.properties.scalerank ?? 10 },
        geometry: { type: "MultiLineString", coordinates: kept },
      });
    }
    write("rivers.json", topology({ r: { type: "FeatureCollection", features } }, 1e5),
      `${features.length} rivers, ${before} -> ${after} points${dropped ? `, ${dropped} collapsed` : ""}`);
  }

  /* ── Lakes ────────────────────────────────────────────────────────────── */
  console.log("lakes");
  {
    const gj = JSON.parse(await grab("lakes"));
    let before = 0, after = 0, dropped = 0;
    const features = [];
    for (const f of gj.features) {
      const g = f.geometry;
      if (!g) continue;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      const kept = [];
      for (const rings of polys) {
        before += rings.reduce((n, r) => n + r.length, 0);
        // The outer ring decides whether the polygon survives; a hole that
        // collapses is simply dropped, which cannot open the shape.
        const outer = simplifyRing(rings[0], TOLERANCE);
        if (!outer.length) continue;
        const holes = rings.slice(1).map((r) => simplifyRing(r, TOLERANCE)).filter((r) => r.length);
        const ring = [outer, ...holes];
        after += ring.reduce((n, r) => n + r.length, 0);
        kept.push(ring);
      }
      if (!kept.length) { dropped++; continue; }
      features.push({
        type: "Feature",
        properties: { n: f.properties.name || f.properties.name_en || "", s: f.properties.scalerank ?? 10 },
        geometry: kept.length === 1
          ? { type: "Polygon", coordinates: kept[0] }
          : { type: "MultiPolygon", coordinates: kept },
      });
    }
    write("lakes.json", topology({ l: { type: "FeatureCollection", features } }, 1e5),
      `${features.length} lakes, ${before} -> ${after} points${dropped ? `, ${dropped} too small to keep` : ""}`);
  }

  /* ── Ports ────────────────────────────────────────────────────────────── */
  console.log("ports");
  {
    const gj = JSON.parse(await grab("ports"));
    const rows = [];
    let skipped = 0;
    for (const f of gj.features) {
      const c = f.geometry && f.geometry.coordinates;
      if (!c || !usable(+c[0], +c[1])) { skipped++; continue; }
      rows.push([f.properties.name || "", round(+c[0]), round(+c[1]), f.properties.scalerank ?? 10]);
    }
    rows.sort((a, b) => a[3] - b[3] || a[0].localeCompare(b[0]));
    write("ports.json", {
      source: { label: "Natural Earth 1:10m ports", url: "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/", retrieved: today, licence: "public domain" },
      fields: ["name", "lon", "lat", "scalerank"],
      rows,
    }, `${rows.length} ports${skipped ? `, ${skipped} without coordinates` : ""}`);
  }

  /* ── Mineral sites ────────────────────────────────────────────────────── */
  console.log("mineral sites");
  {
    const commodity = interner();
    const country = interner();
    const kind = interner(); // Mine, Plant, Refinery, deposit type, ...
    const rows = [];
    let noCoords = 0;

    // Operating facilities, everywhere except the United States.
    const minfac = parseCsv(unzip(await grab("minfac"), "minfac.csv"));
    let ops = 0;
    for (const r of minfac) {
      const lon = +r.longitude, lat = +r.latitude;
      if (!usable(lon, lat)) { noCoords++; continue; }
      rows.push([
        r.fac_name || r.location || "",
        // The source writes "Cement" and "cement" for the same thing; the table
        // would otherwise carry both.
        commodity.idx(titleCase(r.commodity)),
        country.idx(r.country),
        kind.idx(titleCase(r.fac_type)),
        0, // operation
        round(lon), round(lat),
      ]);
      ops++;
    }

    // Known deposits, worldwide, including the United States.
    const deposits = parseCsv(unzip(await grab("deposits"), "deposit.csv"));
    let deps = 0;
    for (const r of deposits) {
      const lon = +r.longitude, lat = +r.latitude;
      if (!usable(lon, lat)) { noCoords++; continue; }
      rows.push([
        r.dep_name || "",
        commodity.idx(titleCase(r.commodity)),
        country.idx(r.country),
        kind.idx(titleCase(r.dep_type)),
        1, // deposit
        round(lon), round(lat),
      ]);
      deps++;
    }

    const usOps = minfac.filter((r) => /united states/i.test(r.country)).length;
    write("mines.json", {
      sources: [
        { label: "USGS — Mineral operations outside the United States", url: "https://mrdata.usgs.gov/mineral-operations/", surveyed: "2003-2008", retrieved: today, licence: "public domain (US Government work)", covers: "operating mines, plants, refineries and smelters; no United States records" },
        { label: "USGS — Major mineral deposits of the world (OFR 2005-1294)", url: "https://mrdata.usgs.gov/major-deposits/", retrieved: today, licence: "public domain (US Government work)", covers: "known deposits worldwide, including the United States" },
      ],
      fields: ["name", "commodity", "country", "kind", "record", "lon", "lat"],
      // record: 0 = operating facility (minfac), 1 = known deposit (OFR 2005-1294)
      commodities: commodity.table,
      countries: country.table,
      kinds: kind.table,
      rows,
    }, `${ops} operations + ${deps} deposits = ${rows.length}${noCoords ? `, ${noCoords} without coordinates` : ""}`);

    console.log(`    US records in the operations file: ${usOps} (the file excludes the United States by design)`);
    console.log(`    commodities ${commodity.table.length}, countries ${country.table.length}, site kinds ${kind.table.length}`);
  }

  const total = written.reduce((n, w) => n + w.kb, 0);
  const totalGz = written.reduce((n, w) => n + w.gz, 0);
  console.log(`\ntotal ${(total / 1024).toFixed(2)} MB on disk, ${(totalGz / 1024).toFixed(2)} MB gzipped over the wire`);
  console.log("each layer is fetched only when its toggle is first switched on");
})().catch((e) => { console.error(e); process.exit(1); });

/** "Iron and steel: CRUDE steel" -> "Iron and steel: crude steel". */
function titleCase(s) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
