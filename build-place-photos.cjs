#!/usr/bin/env node
/**
 * Builds the place windows' ground-level photos, as asked: for each country, state or division, US county and town the
 * site holds, the photo its Wikidata record names (P18, "image") and its gallery on Wikimedia Commons (P373, "Commons
 * category") - static/photos/<kind>.json, and static/photos/places/<CC>.json for each country's towns.
 *
 * Wikimedia Commons takes only licences that allow any use, commercial too, with credit (public domain, CC0, CC BY,
 * CC BY-SA): each photo's author and licence are read from Commons itself when its window shows it (components/
 * PlacePhoto), and said under it. Read through QLever (the University of Freiburg's SPARQL engine over Wikidata's data,
 * CC0). A place is found by the code the site holds it under - its ISO 3166 code, its Wikidata record, its county's FIPS
 * code (P882), its town's GeoNames id (P1566) - never by its name. A place whose record names no photo has none.
 *
 *   node build-place-photos.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const OUT = path.join(__dirname, "static/photos");
const CACHE = path.join(os.tmpdir(), "commonsphere-place-photos");
fs.mkdirSync(path.join(OUT, "places"), { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const PREFIX = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;
/** A query to QLever, sent in the body, kept for a day, asked again after a pause where it has had too many. */
async function qlever(name, query) {
  const file = path.join(CACHE, name);
  if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3)) {
    for (let tries = 1; ; tries++) {
      const res = await fetch("https://qlever.cs.uni-freiburg.de/api/wikidata", {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
        body: `query=${encodeURIComponent(PREFIX + query)}`,
      });
      if (res.status === 429 && tries < 6) {
        console.log(`QLever: too many requests - asking again in ${tries} min`);
        await new Promise((r) => setTimeout(r, tries * 60e3));
        continue;
      }
      if (!res.ok) throw new Error(`QLever ${name}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      fs.writeFileSync(file, await res.text());
      break;
    }
  }
  return JSON.parse(fs.readFileSync(file, "utf8")).results.bindings;
}

/** A Commons file's name from Wikidata's link to it. */
const fileOf = (url) => decodeURIComponent(url.split("/Special:FilePath/").pop()).replace(/_/g, " ");
/* A photograph taken on the ground, as asked: a JPEG or WebP, and not one its name says is a map, a flag, arms or a seal -
   a country's record often names its location map (the United States' is an SVG of one) - nor, being at ground level, as
   asked, a picture from the air or from space (Japan's record names a satellite's, Los Angeles County's one from the air). */
const NOT_A_PHOTO = /\b(map|maps|locator|location|flag|coat of arms|arms|emblem|seal|logo|insignia|diagram|chart|satellite|aerial|from the air|from space|from above|landsat|modis|sentinel|orbit|iss)\b/i;
const isPhoto = (f) => /\.(jpe?g|webp)$/i.test(f) && !NOT_A_PHOTO.test(f);
/** [file, category] - the first photograph a record names, in a steady order, and its gallery. */
function collect(rows, keyOf) {
  const out = new Map();
  for (const b of rows) {
    const k = keyOf(b);
    if (!k) continue;
    const was = out.get(k) ?? [null, null];
    if (b.img) {
      const f = fileOf(b.img.value);
      if (isPhoto(f) && (!was[0] || f < was[0])) was[0] = f;
    }
    if (b.cat && !was[1]) was[1] = b.cat.value;
    out.set(k, was);
  }
  return out;
}
const write = (file, map) => {
  const obj = Object.fromEntries([...map].filter(([, v]) => v[0] || v[1]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([k, [f, c]]) => [k, c ? [f, c] : [f]]));
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj));
  return Object.keys(obj).length;
};

(async () => {
  /* Countries, by their ISO code. */
  const countries = collect(await qlever("countries.json", `SELECT ?cc ?img ?cat WHERE { ?c wdt:P297 ?cc . OPTIONAL { ?c wdt:P18 ?img } OPTIONAL { ?c wdt:P373 ?cat } }`), (b) => b.cc.value);
  console.log(`countries: ${write("countries.json", countries)}`);

  /* Divisions - states, provinces, regions - by their ISO 3166-2 code, and by the Wikidata record the site holds for them. */
  const byCode = collect(await qlever("iso3166-2.json", `SELECT ?code ?img ?cat WHERE { ?d wdt:P300 ?code . OPTIONAL { ?d wdt:P18 ?img } OPTIONAL { ?d wdt:P373 ?cat } }`), (b) => b.code.value);
  const subs = fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8");
  const qids = [...new Set([...subs.matchAll(/\\"qid\\":\\"(Q\d+)\\"/g)].map((m) => m[1]))];
  const byQid = new Map();
  for (let i = 0; i < qids.length; i += 2000) {
    const part = collect(
      await qlever(`subnations-${i}.json`, `SELECT ?d ?img ?cat WHERE { VALUES ?d { ${qids.slice(i, i + 2000).map((q) => `wd:${q}`).join(" ")} } OPTIONAL { ?d wdt:P18 ?img } OPTIONAL { ?d wdt:P373 ?cat } }`),
      (b) => b.d.value.split("/").pop(),
    );
    for (const [k, v] of part) byQid.set(k, v);
  }
  // Each division of the site's: its record's photo, else its ISO code's.
  const divisions = new Map();
  // Each division is a line of the file, a JSON string of its record: read as such.
  for (const line of subs.split(/\r?\n/)) {
    const s = line.trim().replace(/,$/, "");
    if (!s.startsWith('"{')) continue;
    const rec = JSON.parse(JSON.parse(s));
    const { id, code, qid } = rec;
    const hit = (qid && byQid.get(qid)) || (code && byCode.get(code));
    if (hit && (hit[0] || hit[1])) divisions.set(id, hit);
  }
  // The US states, by their ISO code, as the States page names them.
  for (const [code, v] of byCode) if (code.startsWith("US-") && !divisions.has(code)) divisions.set(code, v);
  console.log(`divisions: ${write("divisions.json", divisions)} (of ${qids.length} records held)`);

  /* US counties, by their FIPS code. */
  const counties = collect(await qlever("counties.json", `SELECT ?fips ?img ?cat WHERE { ?c wdt:P882 ?fips . FILTER(STRLEN(?fips) = 5) OPTIONAL { ?c wdt:P18 ?img } OPTIONAL { ?c wdt:P373 ?cat } }`), (b) => b.fips.value);
  console.log(`counties: ${write("counties.json", counties)}`);

  /* Towns, by their GeoNames id - only those the site's places hold, a file a country. */
  const towns = collect(await qlever("towns.json", `SELECT ?gn ?img ?cat WHERE { ?p wdt:P1566 ?gn ; wdt:P18 ?img . OPTIONAL { ?p wdt:P373 ?cat } }`), (b) => b.gn.value);
  let total = 0;
  for (const f of fs.readdirSync(path.join(__dirname, "static/places")).filter((x) => /^[A-Z]{2}\.json$/.test(x))) {
    const file = JSON.parse(fs.readFileSync(path.join(__dirname, "static/places", f), "utf8"));
    const mine = new Map();
    for (const p of file.places ?? []) {
      const hit = towns.get(String(p[6]));
      if (hit) mine.set(String(p[6]), hit);
    }
    if (mine.size) total += write(path.join("places", f), mine);
  }
  console.log(`towns: ${total} with a photo, of ${towns.size} GeoNames records with one`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
