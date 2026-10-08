/**
 * Subnations: the first-order divisions of every country - states, provinces,
 * regions, departments - and the counties of the United States.
 *
 *   node build-subnations.cjs     (cached between runs in the system's temp folder)
 *
 * Writes src/data/subnations.ts and src/data/usCounties.ts.
 *
 * WHICH DIVISIONS. The ones the site's maps draw: Natural Earth's 1:10m
 * admin-1 file (public domain), the same file static/geo/admin1 is cut from,
 * so a division pressed on a map and its record here are one thing. Natural
 * Earth gives each its name, its country, its ISO 3166-2 code where it has
 * one, what kind of division it is, the region it sits in, a label point, and
 * the id of its Wikidata record.
 *
 * WHAT IS SAID OF EACH. From that Wikidata record (CC0), read by id and not
 * by name: its official name where the record gives one in English, its name
 * in its own language, capital, legislature, the year it was founded, its
 * area, the other divisions it borders, its official website, and its
 * population.
 *
 *   A population is kept only where the statement is dated and cites a
 *   reference of its own - not one that only says it was imported from a
 *   Wikipedia. The latest such figure is the division's population; all of
 *   them, a year each, are its series.
 *
 *   The head of a division is NOT read here. Wikidata's "head of government"
 *   is not reliable on its own; the page takes heads from representatives.ts,
 *   which keeps only those three records agree on.
 *
 * Nothing is estimated or filled in: a field Wikidata does not hold is left
 * out, and the page says it is not held.
 *
 * COUNTIES. The US Census Bureau's own files (public domain): the Vintage
 * 2025 county population estimates, 2020 to 2025, with the latest year's
 * births, deaths and migration; and the 2025 Gazetteer for each county's land
 * and water area and its internal point.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-subnations");
fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
const TODAY = new Date().toISOString().slice(0, 10);

const NE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const EST_URL = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv";
const GAZ_URL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_counties_national.zip";

async function cached(name, load) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const got = await load();
  fs.writeFileSync(at, JSON.stringify(got));
  return got;
}
async function download(name, url) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  return fs.readFileSync(at);
}
async function wikidata(params) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://www.wikidata.org/w/api.php?" + new URLSearchParams({ format: "json", ...params }), {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(120000),
    }).catch((e) => ({ ok: false, status: String(e) }));
    if (res.ok) {
      const got = await res.json();
      if (!got.error) {
        await sleep(150);
        return got;
      }
    }
    if (attempt >= 4) throw new Error(`Wikidata: ${res.status}`);
    await sleep(6000 * (attempt + 1));
  }
}
const batches = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

// ── Reading a Wikidata record ───────────────────────────────────────────────

/** The statements that stand: with a value, not deprecated; the preferred ones where any is preferred. */
const standing = (claims) => {
  const live = (claims || []).filter((c) => c.rank !== "deprecated" && c.mainsnak.snaktype === "value");
  const preferred = live.filter((c) => c.rank === "preferred");
  return preferred.length ? preferred : live;
};
/** Still so: no end date on it. */
const current = (claims) => standing(claims).filter((c) => !c.qualifiers?.P582);
const yearOf = (time) => (time ? Number(time.slice(0, 1) === "-" ? "-" + time.slice(1, 5) : time.slice(1, 5)) : null);
const itemOf = (c) => c?.mainsnak.datavalue.value.id;
/** A reference of its own: something other than "imported from a Wikimedia project", its import URL, or a bare retrieval date. */
const sourced = (c) => (c.references || []).some((r) => Object.keys(r.snaks).some((p) => !["P143", "P4656", "P813"].includes(p)));
const KM2 = { Q712226: 1, Q35852: 0.01, Q232291: 2.589988, Q25343: 1e-6 };

function read(e) {
  const c = e.claims || {};
  const out = {};
  const pops = new Map();
  for (const s of (c.P1082 || []).filter((x) => x.rank !== "deprecated" && x.mainsnak.snaktype === "value")) {
    const year = yearOf(s.qualifiers?.P585?.[0]?.datavalue?.value?.time);
    const v = Number(s.mainsnak.datavalue.value.amount);
    if (!year || !Number.isFinite(v) || v <= 0 || !sourced(s)) continue;
    // One figure a year: a preferred statement over another, and otherwise the one read last.
    if (!pops.has(year) || s.rank === "preferred" || pops.get(year).rank !== "preferred") pops.set(year, { v: Math.round(v), rank: s.rank });
  }
  if (pops.size) out.series = [...pops].map(([y, p]) => [y, p.v]).sort((a, b) => a[0] - b[0]);
  const area = standing(c.P2046)[0];
  if (area) {
    const k = KM2[area.mainsnak.datavalue.value.unit.split("/").pop()];
    const v = Number(area.mainsnak.datavalue.value.amount);
    if (k && v > 0) out.areaKm2 = Number((v * k).toPrecision(6));
  }
  out.capital = itemOf(current(c.P36)[0]);
  out.legislature = itemOf(current(c.P194)[0]);
  out.within = itemOf(current(c.P131)[0]);
  out.borders = current(c.P47).map(itemOf);
  out.founded = yearOf(standing(c.P571)[0]?.mainsnak.datavalue.value.time);
  out.site = standing(c.P856)[0]?.mainsnak.datavalue.value;
  // An official name is kept where the record gives one in English: one in another language is the native name's business.
  out.official = current(c.P1448)
    .map((x) => x.mainsnak.datavalue.value)
    .filter((v) => v.language === "en")
    .pop()?.text;
  out.native = standing(c.P1705)[0]?.mainsnak.datavalue.value.text;
  out.iso = standing(c.P300)[0]?.mainsnak.datavalue.value;
  out.gn = standing(c.P1566)[0]?.mainsnak.datavalue.value;
  out.label = e.labels?.en?.value;
  out.article = e.sitelinks?.enwiki?.title;
  return out;
}

// ── A zip with one file in it ───────────────────────────────────────────────

function unzipFirst(buf) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("not a zip");
  const dir = buf.readUInt32LE(end + 16);
  if (buf.readUInt32LE(dir) !== 0x02014b50) throw new Error("no central directory");
  const method = buf.readUInt16LE(dir + 10);
  const size = buf.readUInt32LE(dir + 20);
  const local = buf.readUInt32LE(dir + 42);
  const from = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const data = buf.subarray(from, from + size);
  return method === 0 ? data : zlib.inflateRawSync(data);
}
/** A line of a CSV, quoted fields allowed. */
function csvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") out.push(cur), (cur = "");
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const tidy = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)));

(async () => {
  // ── 1. The divisions the maps draw ────────────────────────────────────────
  const ne = JSON.parse((await download("admin1-10m-raw.geojson", NE_URL)).toString("utf8")).features;
  const base = [];
  const taken = new Set();
  for (const f of ne) {
    const p = f.properties;
    const cc = p.iso_a2;
    const name = p.name || p.name_en || p.woe_name || p.gn_name || "";
    if (!/^[A-Z]{2}$/.test(cc || "") || !name) continue;
    const code = /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(p.iso_3166_2 || "") && p.iso_3166_2.startsWith(cc + "-") ? p.iso_3166_2 : "";
    let id = code || `${cc}~${slug(name)}`;
    // Two shapes of one division (an island apart from its mainland) are one record.
    if (taken.has(id)) continue;
    taken.add(id);
    base.push({
      id,
      cc,
      name,
      code,
      kind: (p.type_en || p.type || "").trim(),
      region: (p.region || "").trim(),
      lat: Number(Number(p.latitude).toFixed(3)),
      lon: Number(Number(p.longitude).toFixed(3)),
      qid: /^Q\d+$/.test(p.wikidataid || "") ? p.wikidataid : "",
      local: (p.name_local || "").trim(),
    });
  }
  console.log(`Natural Earth: ${ne.length} shapes, ${base.length} divisions, ${base.filter((b) => b.qid).length} with a Wikidata record`);

  // ── 2. Each division's Wikidata record, by id ─────────────────────────────
  const qids = [...new Set(base.map((b) => b.qid).filter(Boolean))];
  const records = {};
  let done = 0;
  for (const batch of batches(qids, 40)) {
    const got = await cached(`wd2-${hash(batch.join(" "))}.json`, async () => {
      const res = await wikidata({ action: "wbgetentities", ids: batch.join("|"), props: "claims|labels|sitelinks", languages: "en", sitefilter: "enwiki" });
      return Object.fromEntries(Object.entries(res.entities).map(([q, e]) => [q, e.missing !== undefined ? null : read(e)]));
    });
    Object.assign(records, got);
    done += batch.length;
    if (done % 400 < 40) console.log(`  Wikidata records: ${done} of ${qids.length}`);
  }

  // ── 3. The names of what they point at: capitals, legislatures, the places they sit in and border ──
  const own = new Map(base.filter((b) => b.qid).map((b) => [b.qid, b.name]));
  const wanted = new Set();
  for (const r of Object.values(records)) {
    if (!r) continue;
    for (const q of [r.capital, r.legislature, r.within, ...(r.borders || [])]) if (q && !own.has(q)) wanted.add(q);
  }
  const names = new Map(own);
  done = 0;
  for (const batch of batches([...wanted], 50)) {
    const got = await cached(`labels-${hash(batch.join(" "))}.json`, async () => {
      const res = await wikidata({ action: "wbgetentities", ids: batch.join("|"), props: "labels", languages: "en" });
      return Object.fromEntries(Object.entries(res.entities).map(([q, e]) => [q, e.labels?.en?.value ?? null]));
    });
    for (const [q, label] of Object.entries(got)) if (label) names.set(q, label);
    done += batch.length;
    if (done % 1000 < 50) console.log(`  names: ${done} of ${wanted.size}`);
  }
  const named = (q) => (q ? names.get(q) : undefined);

  const rows = base.map((b) => {
    const r = (b.qid && records[b.qid]) || {};
    const latest = r.series?.[r.series.length - 1];
    // A code Natural Earth lacks, where the record has one for this country.
    const code = b.code || (r.iso && r.iso.startsWith(b.cc + "-") ? r.iso : "");
    return tidy({
      id: b.id,
      cc: b.cc,
      name: b.name,
      code,
      kind: b.kind,
      region: b.region,
      lat: b.lat,
      lon: b.lon,
      qid: b.qid,
      article: r.article,
      site: r.site,
      gn: r.gn ? Number(r.gn) : undefined,
      official: r.official && r.official !== b.name ? r.official : undefined,
      native: (r.native || b.local) && (r.native || b.local) !== b.name ? r.native || b.local : undefined,
      capital: named(r.capital),
      legislature: named(r.legislature),
      within: named(r.within),
      founded: r.founded ?? undefined,
      areaKm2: r.areaKm2,
      pop: latest,
      // A series is worth drawing from three years on.
      series: r.series && r.series.length >= 3 ? r.series : undefined,
      // The other divisions it borders: a record also lists every town and country along its edge, which is not what is asked.
      borders: [...new Set((r.borders || []).filter((q) => own.has(q)).map(named).filter(Boolean))].sort((x, y) => x.localeCompare(y)),
    });
  });
  rows.sort((a, b) => a.cc.localeCompare(b.cc) || a.name.localeCompare(b.name));

  // How many of the shapes the maps draw have a record under the same name.
  const key = new Set(rows.map((r) => `${r.cc}|${r.name}`));
  let shapes = 0;
  let matched = 0;
  const dirAt = path.join(__dirname, "static/geo/admin1");
  for (const file of fs.readdirSync(dirAt).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
    const topo = JSON.parse(fs.readFileSync(path.join(dirAt, file), "utf8"));
    for (const g of Object.values(topo.objects)[0].geometries) {
      shapes++;
      if (key.has(`${file.slice(0, 2)}|${g.properties.n}`)) matched++;
    }
  }
  const count = (k) => rows.filter((r) => r[k] !== undefined).length;
  console.log(`divisions ${rows.length} in ${new Set(rows.map((r) => r.cc)).size} countries · code ${count("code")} · capital ${count("capital")} · area ${count("areaKm2")} · population ${count("pop")} · series ${count("series")} · legislature ${count("legislature")} · site ${count("site")} · borders ${count("borders")}`);
  console.log(`map shapes ${shapes}, with a record of the same name ${matched}`);

  fs.writeFileSync(
    path.join(__dirname, "src/data/subnations.ts"),
    `/**
 * The first-order divisions of every country - states, provinces, regions,
 * departments - as the site's maps draw them.
 *
 * GENERATED by build-subnations.cjs on ${TODAY} — do not edit by hand; change the
 * script and re-run it.
 *
 * Which divisions, their names, kinds, codes and label points: Natural Earth's
 * 1:10m admin-1 file, the one the maps are cut from. Everything else: each
 * division's own Wikidata record, read by the id Natural Earth gives. A
 * population is kept only where its statement is dated and cites a reference
 * of its own. A field that is not held is left out, not filled in. Heads of
 * divisions are not here: see representatives.ts.
 */
export const SUBNATIONS_RETRIEVED = "${TODAY}";
export const SUBNATIONS_SOURCES = {
  naturalEarth: { label: "Natural Earth — 1:10m admin-1 states and provinces (public domain)", url: "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/" },
  wikidata: { label: "Wikidata (CC0) — each division's own record", url: "https://www.wikidata.org/" },
  iso: { label: "ISO 3166-2 — codes for the names of countries' subdivisions", url: "https://www.iso.org/obp/ui/#search/code/" },
};

export interface Subnation {
  /** Its ISO 3166-2 code where it has one, and otherwise its country's code and its name: what a link to it carries. */
  id: string;
  /** Its country's ISO code. */
  cc: string;
  name: string;
  /** ISO 3166-2. */
  code?: string;
  /** What kind of division it is, as Natural Earth names it. */
  kind?: string;
  /** The larger region of its country it sits in, where Natural Earth gives one. */
  region?: string;
  lat: number;
  lon: number;
  /** Its Wikidata record. */
  qid?: string;
  /** Its English Wikipedia article. */
  article?: string;
  /** Its official website. */
  site?: string;
  /** Its GeoNames id. */
  gn?: number;
  official?: string;
  native?: string;
  capital?: string;
  legislature?: string;
  /** The administrative unit it lies in. */
  within?: string;
  founded?: number;
  areaKm2?: number;
  /** Its latest dated, referenced population. */
  pop?: [year: number, people: number];
  /** Every dated, referenced population, a year each, where there are three or more. */
  series?: [year: number, people: number][];
  /** The places it shares a border with. */
  borders?: string[];
}

/* A record a line, as text: four thousand object literals of differing shapes are more than the compiler will type as one array. */
export const SUBNATIONS: Subnation[] = [
${rows.map((r) => "  " + JSON.stringify(JSON.stringify(r)) + ",").join("\n")}
].map((line) => JSON.parse(line) as Subnation);

`,
  );

  // ── 4. The counties of the United States ──────────────────────────────────
  const gaz = unzipFirst(await download("gaz-counties.zip", GAZ_URL)).toString("latin1").split(/\r?\n/).filter(Boolean);
  // Tab-separated to 2024, and separated by bars from 2025.
  const sep = gaz[0].includes("|") ? "|" : "\t";
  const gh = gaz[0].split(sep).map((h) => h.trim());
  const gcol = (n) => gh.indexOf(n);
  if (gcol("GEOID") < 0 || gcol("ALAND") < 0) throw new Error("the Gazetteer's columns were not found");
  const place = new Map();
  for (const line of gaz.slice(1)) {
    const c = line.split(sep).map((x) => x.trim());

    place.set(c[gcol("GEOID")], { usps: c[gcol("USPS")], land: Number(c[gcol("ALAND")]) / 1e6, water: Number(c[gcol("AWATER")]) / 1e6, lat: Number(c[gcol("INTPTLAT")]), lon: Number(c[gcol("INTPTLONG")]) });
  }
  const uspsOf = new Map([...place].map(([fips, p]) => [fips.slice(0, 2), p.usps]));
  const est = (await download("co-est-alldata.csv", EST_URL)).toString("latin1").split(/\r?\n/).filter(Boolean);
  const eh = csvLine(est[0]);
  const years = eh.filter((h) => /^POPESTIMATE\d{4}$/.test(h)).map((h) => Number(h.slice(-4)));
  const last = years[years.length - 1];
  const counties = [];
  for (const line of est.slice(1)) {
    const c = csvLine(line);
    const at = (n) => c[eh.indexOf(n)];
    if (at("SUMLEV") !== "050") continue;
    const fips = at("STATE") + at("COUNTY");
    const g = place.get(fips);
    const usps = g?.usps ?? uspsOf.get(at("STATE"));
    if (!usps) continue;
    const n = (k) => Number(at(k + last));
    counties.push([
      fips,
      at("CTYNAME"),
      usps,
      g ? Number(g.lat.toFixed(3)) : null,
      g ? Number(g.lon.toFixed(3)) : null,
      g ? Number(g.land.toFixed(1)) : null,
      g ? Number(g.water.toFixed(1)) : null,
      years.map((y) => Number(at("POPESTIMATE" + y))),
      n("BIRTHS"),
      n("DEATHS"),
      n("INTERNATIONALMIG"),
      n("DOMESTICMIG"),
    ]);
  }
  console.log(`counties ${counties.length} · with a place ${counties.filter((c) => c[3] !== null).length} · years ${years.join(" ")}`);
  fs.writeFileSync(
    path.join(__dirname, "src/data/usCounties.ts"),
    `/**
 * The counties of the United States, and what stands in for them - parishes,
 * boroughs, census areas, independent cities, Connecticut's planning regions.
 *
 * GENERATED by build-subnations.cjs on ${TODAY} — do not edit by hand; change the
 * script and re-run it.
 *
 * Both files are the US Census Bureau's own, and public domain: the Vintage
 * ${last} county population estimates (1 July of each year, ${years[0]} to ${last}, with the
 * births, deaths and migration of the year to 1 July ${last}), and the ${last}
 * Gazetteer (land and water area, and the county's internal point).
 */
export const US_COUNTIES_RETRIEVED = "${TODAY}";
export const US_COUNTY_YEARS = ${JSON.stringify(years)};
export const US_COUNTY_SOURCES = {
  estimates: { label: "US Census Bureau — Vintage ${last} county population estimates", url: "https://www.census.gov/data/tables/time-series/demo/popest/2020s-counties-total.html" },
  gazetteer: { label: "US Census Bureau — ${last} Gazetteer files, counties", url: "https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html" },
};

/**
 * [its FIPS code, its name, its state's postal code, latitude and longitude of its internal point, land and water
 * area in km², its population on 1 July of each of US_COUNTY_YEARS, and for the year to the last of them: births,
 * deaths, net international migration, net domestic migration].
 */
export type UsCounty = [fips: string, name: string, state: string, lat: number | null, lon: number | null, landKm2: number | null, waterKm2: number | null, people: number[], births: number, deaths: number, international: number, domestic: number];

export const US_COUNTIES: UsCounty[] = [
${counties.map((c) => "  " + JSON.stringify(c) + ",").join("\n")}
];
`,
  );
  console.log("wrote src/data/subnations.ts and src/data/usCounties.ts");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
