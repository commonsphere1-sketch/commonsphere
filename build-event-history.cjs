#!/usr/bin/env node
/**
 * build-event-history.cjs
 *
 * Each country's historic accounts for the News page, as asked - every event of the six kinds the page follows
 * (civil unrest, revolutions and coups, wars and conflicts, terrorism, natural disasters, epidemics), past and
 * present, from every record a commercial site may use:
 *
 *   Wikidata (CC0)          every item that is an instance of each kind's classes, or of a class under them, with
 *                           its English name and description, its dates, its deaths, its place, the event it is part
 *                           of, and its Encyclopaedia Britannica and English Wikipedia articles where it has them.
 *   UCDP/PRIO Armed Conflict Dataset (CC BY 4.0)   every armed conflict since 1946, by the country it was fought in.
 *   NOAA NCEI Global Significant Earthquake, Tsunami and Volcanic Eruption databases (US public domain).
 *   GDACS (CC BY 4.0)       each orange or red alert since 2015, from newsCountryHistory.ts (build-news-history.cjs).
 *   The site's record of revolutions, protests, boycotts and internal conflicts (unrest.ts), each with its account
 *                           and the works it cites, laid onto the Wikidata item for the same article where there is one.
 *
 * An event is the kind it is first found in, in this order: terrorism, revolutions and coups, civil unrest, epidemics,
 * natural disasters, wars and conflicts - so a coup that is also an armed conflict is a coup, once. It is placed in
 * a country by the first of these its record gives: the present-day country it names; failing that, the country of
 * the place or district it names; failing that, the point it gives, inside the country's outline (Natural Earth
 * 1:50m, the site's own map) or within about ten kilometres of its coast where no other country is that near. A war is also listed for each present-day country its record names as a party to it,
 * marked so. An event a record holds as part of another listed for the same country and kind is listed within it,
 * so the counties' accounts of an outbreak sit inside the country's, and a war's battles inside the war.
 *
 * Dates are as Wikidata holds them, at the precision it gives - a year is a year, not the first of January. Its
 * export turns dates kept in the Julian calendar into Gregorian ones and counts the years before Christ from a year
 * nought; both are turned back, so the Battle of Hastings is 14 October 1066 and Marathon 490 BC. Where the record
 * gives an event more than one date, only what they agree on is shown.
 *
 * Nothing is added that a record does not hold. What no record holds for a country is not there, and the page says
 * that the lists are what the records hold, not a census. Records the site may not use (the Global Terrorism
 * Database, ACLED, EM-DAT, WHO's Disease Outbreak News) are left out.
 *
 * Writes src/data/eventHistory/<code>.json for each country, and src/data/eventHistoryIndex.ts.
 *
 *   node build-event-history.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const TODAY = new Date().toISOString().slice(0, 10);
const CACHE = path.join(os.tmpdir(), "cs-event-history");
fs.mkdirSync(CACHE, { recursive: true });
const OUT_DIR = path.join(__dirname, "src/data/eventHistory");

/* ─── Fetching ───────────────────────────────────────────────────────────── */

function curl(args, name) {
  const file = path.join(CACHE, name);
  if (fs.existsSync(file) && fs.statSync(file).size > 0 && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3) return fs.readFileSync(file);
  for (let attempt = 1; ; attempt++) {
    try {
      execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "300", "-o", file, ...args], { stdio: "inherit" });
      return fs.readFileSync(file);
    } catch (e) {
      if (attempt >= 3) throw e;
      console.log(`  retrying ${name}`);
    }
  }
}

const PREFIX = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
`;
/** A query of Wikidata through QLever, cached a day; its rows as plain objects of strings. */
function sparql(label, q) {
  const name = `wd-${label}-${crypto.createHash("md5").update(q).digest("hex").slice(0, 10)}.json`;
  for (let attempt = 1; ; attempt++) {
    const buf = curl(["-H", "Accept: application/sparql-results+json", "--data-urlencode", "query=" + PREFIX + q, "https://qlever.dev/api/wikidata"], name);
    let j;
    try {
      j = JSON.parse(buf.toString());
    } catch {
      j = null;
    }
    if (j && j.results) {
      const rows = j.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
      console.log(`  ${label}: ${rows.length} rows`);
      return rows;
    }
    fs.rmSync(path.join(CACHE, name), { force: true });
    if (attempt >= 3) throw new Error(`${label}: ${buf.toString().slice(0, 300)}`);
    console.log(`  ${label}: no result, retrying`);
  }
}
const qid = (uri) => uri.slice(uri.lastIndexOf("/") + 1);

/* ─── The site's countries ──────────────────────────────────────────────── */

const SITE = new Map(); // code -> name
{
  const src = fs.readFileSync(path.join(__dirname, "src/data/countriesData.ts"), "utf8");
  for (const m of src.matchAll(/\bname:\s*"([^"]+)"[^}]*?\bcode:\s*"([A-Z]{2})"/gs)) if (!SITE.has(m[2])) SITE.set(m[2], m[1]);
}
if (SITE.size < 200) throw new Error(`countriesData.ts: only ${SITE.size} countries read`);

/* Names a record may give a country, for the records that name rather than code it. */
const nameToCode = new Map([...SITE].map(([c, n]) => [n, c]));
{
  const ALSO = {
    "United States of America": "US", USA: "US", "U.S.": "US", "United Kingdom": "GB", UK: "GB", Britain: "GB", "Great Britain": "GB", England: "GB", Scotland: "GB",
    Wales: "GB", "Northern Ireland": "GB", Turkey: "TR", Burma: "MM", "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "Cote d'Ivoire": "CI", "Czech Republic": "CZ",
    Czechia: "CZ", "Democratic Republic of the Congo": "CD", "DR Congo": "CD", "Congo, Democratic Republic of the": "CD", Zaire: "CD", "Republic of the Congo": "CG",
    Congo: "CG", "South Korea": "KR", "Korea, South": "KR", "North Korea": "KP", "Korea, North": "KP", Persia: "IR", Holland: "NL", "East Timor": "TL",
    Swaziland: "SZ", Eswatini: "SZ", "Cape Verde": "CV", "Cabo Verde": "CV", Macedonia: "MK", "North Macedonia": "MK", "Bosnia-Herzegovina": "BA",
    "Bosnia and Herzegovina": "BA", Russia: "RU", "Soviet Union": "RU", Kampuchea: "KH", Cambodia: "KH", Rhodesia: "ZW", "Yemen (North Yemen)": "YE",
    "Myanmar (Burma)": "MM", "Serbia (Yugoslavia)": "RS", Yugoslavia: "RS", "Sri Lanka": "LK", Laos: "LA", Syria: "SY", Iran: "IR", Vietnam: "VN",
    "Viet Nam": "VN", Taiwan: "TW", "Hong Kong": "HK", Palestine: "PS", Brunei: "BN", Moldova: "MD", Tanzania: "TZ", Bolivia: "BO", Venezuela: "VE",
    "Trinidad and Tobago": "TT", "Antigua and Barbuda": "AG", "Saint Kitts and Nevis": "KN", "Saint Vincent and the Grenadines": "VC", "Sao Tome and Principe": "ST",
    "São Tomé and Príncipe": "ST", "Micronesia": "FM", "Micronesia, Fed. States of": "FM", "Wallis and Futuna": "WF", Azores: "PT", "Madeira Islands": "PT",
    "Canary Islands": "ES", Kosovo: "XK", "Papua New Guinea": "PG", "Solomon Islands": "SB", "New Caledonia": "NC", "French Polynesia": "PF",
  };
  for (const [n, c] of Object.entries(ALSO)) if (SITE.has(c)) nameToCode.set(n, c);
}
const NAMES_LONGEST = [...nameToCode.keys()].sort((a, b) => b.length - a.length);
const lower = new Map(NAMES_LONGEST.map((n) => [n.toLowerCase(), nameToCode.get(n)]));
/** The countries a text names: the longest names first, each taken out of the text once found. */
function countriesIn(text) {
  let s = ` ${text} `;
  const found = new Set();
  for (const n of NAMES_LONGEST) {
    const re = new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "iu");
    if (re.test(s)) {
      found.add(nameToCode.get(n));
      s = s.replace(re, (m, pre) => pre + " ".repeat(m.length - pre.length));
    }
  }
  return [...found];
}

/* ─── Placing a point in a country, by the site's own map ───────────────── */

let pointIn = () => null;
async function loadOutlines() {
  const { geoContains, geoBounds } = await import("d3-geo");
  const { feature } = require("topojson-client");
  const topo = require("world-atlas/countries-50m.json");
  const join = fs.readFileSync(path.join(__dirname, "src/data/mapJoin.ts"), "utf8");
  const aliases = Object.fromEntries([...join.matchAll(/^\s*(?:"([^"]+)"|([A-Za-z]+)):\s*"([^"]+)",$/gm)].map((m) => [m[1] ?? m[2], m[3]]));
  const norm = (s) => s.toLowerCase().replace(/[‘’']/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  const byName = new Map([...SITE].map(([c, n]) => [norm(n), c]));
  const shapes = [];
  for (const f of feature(topo, topo.objects.countries).features) {
    // Somaliland and Northern Cyprus have outlines of their own on the map but are, as the site holds them, parts of Somalia and Cyprus.
    const code = byName.get(norm(aliases[f.properties.name] ?? f.properties.name)) ?? { Somaliland: "SO", "N. Cyprus": "CY" }[f.properties.name];
    if (code) shapes.push({ code, f, b: geoBounds(f) });
  }
  console.log(`  outlines: ${shapes.length} countries`);
  const inside = (lon, lat) => {
    for (const s of shapes) {
      const [[x0, y0], [x1, y1]] = s.b;
      if (lat < y0 || lat > y1) continue;
      if (x0 <= x1 ? lon < x0 || lon > x1 : lon < x0 && lon > x1) continue;
      if (geoContains(s.f, [lon, lat])) return s.code;
    }
    return null;
  };
  // A point just off an outline - a coastal city the 1:50m coast leaves in the sea - is the country within about ten
  // kilometres of it, where only one country is that near.
  pointIn = (lon, lat) => {
    const c = inside(lon, lat);
    if (c) return c;
    const near = new Set();
    const k = 1 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    for (const r of [0.03, 0.06, 0.09]) for (let a = 0; a < 16; a++) {
      const h = inside(lon + r * k * Math.cos((a * Math.PI) / 8), lat + r * Math.sin((a * Math.PI) / 8));
      if (h) near.add(h);
    }
    return near.size === 1 ? [...near][0] : null;
  };
}

/* ─── Dates ──────────────────────────────────────────────────────────────── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const JULIAN = "http://www.wikidata.org/entity/Q1985786";
/** A proleptic Gregorian date (astronomical year) as a Julian calendar date - the inverse of what the export did. */
function gregorianToJulian(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  const c = jdn + 32082;
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * dd) / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  return [dd - 4800 + Math.floor(m2 / 10), m2 + 3 - 12 * Math.floor(m2 / 10), e - Math.floor((153 * m2 + 2) / 5) + 1];
}
/** A Wikidata time as its parts in the calendar it was kept in: [year (astronomical), month, day, precision]. */
function timeParts(value, precision, calendar) {
  const m = /^(-?)(\d+)-(\d\d)-(\d\d)/.exec(value);
  if (!m) return null;
  let y = (m[1] ? -1 : 1) * +m[2];
  let mo = +m[3] || 1;
  let d = +m[4] || 1;
  const p = +precision;
  if (calendar === JULIAN && p >= 10) [y, mo, d] = gregorianToJulian(y, mo, d);
  else if (calendar === JULIAN && p === 9 && mo === 1 && d < 14) [y] = gregorianToJulian(y, mo, d);
  return [y, mo, d, p];
}
const yearWords = (y) => (y <= 0 ? `${1 - y} BC` : `${y}`);
/** A date's words at its precision: a day, a month, a year, a decade, a century or a millennium. */
function dateWords([y, mo, d, p]) {
  if (p >= 11) return `${d} ${MONTHS[mo - 1]} ${yearWords(y)}`;
  if (p === 10) return `${MONTHS[mo - 1]} ${yearWords(y)}`;
  if (p === 9) return yearWords(y);
  if (p === 8 && y > 0) return `${Math.floor(y / 10) * 10}s`;
  const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
  if (p === 7) return y > 0 ? `${ord(Math.floor((y - 1) / 100) + 1)} century` : `${ord(Math.floor(-y / 100) + 1)} century BC`;
  if (p <= 6) return y > 0 ? `${ord(Math.floor((y - 1) / 1000) + 1)} millennium` : `${ord(Math.floor(-y / 1000) + 1)} millennium BC`;
  return yearWords(y);
}
/** What several dates of one event agree on: their shared day, month or year, or the coarsest of them; null if they differ in year. */
function agreed(list) {
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const p = Math.min(...list.map((t) => t[3]));
  const [y, mo, d] = list[0];
  if (!list.every((t) => t[0] === y)) return null;
  if (p >= 11 && list.every((t) => t[1] === mo && t[2] === d)) return list[0];
  if (p >= 10 && list.every((t) => t[1] === mo)) return [y, mo, 1, 10];
  return [y, 1, 1, Math.min(p, 9)];
}
/** The best-ranked of a statement's values: preferred if any, else normal; deprecated ones never. */
function bestRanked(rows) {
  const ok = rows.filter((r) => !r.rank.endsWith("DeprecatedRank"));
  const pref = ok.filter((r) => r.rank.endsWith("PreferredRank"));
  return pref.length ? pref : ok;
}

/* ─── The kinds ──────────────────────────────────────────────────────────── */

/* In order of precedence: an event in two kinds is listed under the first. */
const KINDS = [
  { id: "terror", roots: ["Q2223653"] }, // terrorist attack
  { id: "revolutions", roots: ["Q45382", "Q10931", "Q124734"] }, // coup d'état, revolution, rebellion
  { id: "unrest", roots: ["Q273120", "Q175331", "Q124757", "Q49776", "Q179366", "Q686984"] }, // protest, demonstration, riot, strike, boycott, civil disorder
  { id: "epidemic", roots: ["Q44512", "Q3241045", "Q12184"] }, // epidemic, disease outbreak, pandemic
  {
    id: "disaster",
    // natural disaster, earthquake, tropical cyclone, flood, wildfire, volcanic eruption, tsunami, landslide, avalanche, drought, heat wave, cold wave, tornado
    roots: ["Q8065", "Q7944", "Q8092", "Q8068", "Q169950", "Q7692360", "Q8070", "Q167903", "Q7935", "Q43059", "Q215864", "Q642683", "Q8081"],
  },
  { id: "war", roots: ["Q350604", "Q198"] }, // armed conflict, war
];
const KIND_INDEX = Object.fromEntries(KINDS.map((k, i) => [k.id, i]));
/* Classes Wikidata files under those above that are not events of the kind: places (favelas, squats, lava flows, a
   planèze), state sanctions, lawsuits, works of art, school rallies, wars that never happened or are legend, police
   raids, and the persecution of the Jews filed under pogroms and round-ups. An item whose most particular class is one
   of these is left out. */
const NOT_EVENTS = /^(favela( in .*)?|squatting( in .*)?|embargo|arms embargo|disinvestment|nuclear plant-related lawsuits|protest art|pep rally|marathon speech|holocaust train journey|the holocaust( in .*)?|persecution of jews|aryanization|expulsions? (and exoduses )?of jews|deportation of jews|nazi roundup|roundup|planeze|lava flow|lava delta|hypothetical war|legendary battle|police raid|botched police raid|police raid of wrong address)$/i;

async function main() {
  await loadOutlines();

  /* ─── Wikidata ─── */
  console.log("Wikidata");
  const roots = KINDS.flatMap((k) => k.roots);
  for (const r of sparql("roots", `SELECT ?c ?l WHERE { VALUES ?c { ${roots.map((r) => "wd:" + r).join(" ")} } ?c rdfs:label ?l . FILTER(LANG(?l) = "en") }`)) console.log(`    ${qid(r.c)} ${r.l}`);

  const items = new Map(); // QID -> record
  const classOf = new Map(); // QID -> Set of direct classes in its kind
  for (const k of KINDS) {
    for (const r of sparql(`members-${k.id}`, `SELECT DISTINCT ?i ?c WHERE { VALUES ?root { ${k.roots.map((r) => "wd:" + r).join(" ")} } ?i wdt:P31 ?c . ?c wdt:P279* ?root . }`)) {
      const id = qid(r.i);
      if (!/^Q\d+$/.test(id)) continue;
      if (!items.has(id)) items.set(id, { id, kind: k.id });
      if (items.get(id).kind === k.id) (classOf.get(id) ?? classOf.set(id, new Set()).get(id)).add(qid(r.c));
    }
  }
  console.log(`  ${items.size} items in all`);
  const M = `VALUES ?root { ${roots.map((r) => "wd:" + r).join(" ")} } ?i wdt:P31 ?cls . ?cls wdt:P279* ?root .`;
  const each = (label, q, fn) => {
    for (const r of sparql(label, q)) {
      const it = items.get(qid(r.i));
      if (it) fn(it, r);
    }
  };
  // Class names, and the most particular class of each item (the one with fewest members).
  const classLabel = new Map(sparql("class-labels", `SELECT DISTINCT ?c ?l WHERE { VALUES ?root { ${roots.map((r) => "wd:" + r).join(" ")} } ?c wdt:P279* ?root . ?c rdfs:label ?l . FILTER(LANG(?l) = "en") }`).map((r) => [qid(r.c), r.l]));
  const classSize = new Map();
  for (const s of classOf.values()) for (const c of s) classSize.set(c, (classSize.get(c) ?? 0) + 1);
  for (const [id, s] of classOf) {
    const named = [...s].filter((c) => classLabel.has(c)).sort((a, b) => classSize.get(a) - classSize.get(b));
    const it = items.get(id);
    it.cls = named[0] ? classLabel.get(named[0]) : "";
  }
  each("label-en", `SELECT DISTINCT ?i ?l WHERE { ${M} ?i rdfs:label ?l . FILTER(LANG(?l) = "en") }`, (it, r) => (it.title ??= r.l));
  each("label-mul", `SELECT DISTINCT ?i ?l WHERE { ${M} ?i rdfs:label ?l . FILTER(LANG(?l) = "mul") }`, (it, r) => (it.titleMul ??= r.l));
  // An item with no English name keeps the name its record gives in another language, the most widely read first.
  const LANGS = ["fr", "de", "es", "it", "pt", "nl", "sv", "pl", "ru", "uk", "tr", "id", "zh", "ja", "ko", "ar", "fa", "hi"];
  const rankOf = (l) => (LANGS.includes(l) ? LANGS.indexOf(l) : LANGS.length);
  // QLever times out asking which items lack an English name, so their names are read from Wikidata's own API, fifty at a time.
  const nameless = [...items.values()].filter((it) => !it.title && !it.titleMul).map((it) => it.id);
  for (let i = 0; i < nameless.length; i += 50) {
    const ids = nameless.slice(i, i + 50);
    const j = JSON.parse(
      curl(["-A", "CommonSphere-build/1.0 (https://commonsphere.vercel.app)", `https://www.wikidata.org/w/api.php?action=wbgetentities&props=labels&format=json&ids=${ids.join("|")}`], `wd-api-labels-${ids[0]}-${ids.length}.json`).toString(),
    );
    for (const [id, e] of Object.entries(j.entities ?? {})) {
      const it = items.get(id);
      const labels = Object.values(e.labels ?? {});
      if (!it || !labels.length) continue;
      const best = labels.sort((a, b) => rankOf(a.language) - rankOf(b.language) || a.language.localeCompare(b.language))[0];
      it.titleOther = best.value;
      it.titleLang = best.language;
    }
  }
  console.log(`  names in another language: ${nameless.filter((id) => items.get(id).titleOther).length} of ${nameless.length}`);
  each("desc-en", `SELECT DISTINCT ?i ?d WHERE { ${M} ?i schema:description ?d . FILTER(LANG(?d) = "en") }`, (it, r) => (it.desc ??= r.d));
  each("country", `SELECT DISTINCT ?i ?iso WHERE { ${M} ?i wdt:P17 ?k . ?k wdt:P297 ?iso . }`, (it, r) => (it.p17 ??= new Set()).add(r.iso));
  each("place-country", `SELECT DISTINCT ?i ?iso WHERE { ${M} { ?i wdt:P276 ?l . } UNION { ?i wdt:P131 ?l . } ?l wdt:P17 ?k . ?k wdt:P297 ?iso . }`, (it, r) => (it.loc ??= new Set()).add(r.iso));
  each("party", `SELECT DISTINCT ?i ?iso WHERE { ${M} ?i wdt:P710 ?k . ?k wdt:P297 ?iso . }`, (it, r) => (it.party ??= new Set()).add(r.iso));
  each("coord", `SELECT DISTINCT ?i ?xy WHERE { ${M} ?i wdt:P625 ?xy . }`, (it, r) => (it.xy ??= r.xy));
  each("place-coord", `SELECT DISTINCT ?i ?xy WHERE { ${M} ?i wdt:P276 ?l . ?l wdt:P625 ?xy . }`, (it, r) => (it.locXy ??= r.xy));
  each("place-name", `SELECT DISTINCT ?i ?n WHERE { ${M} ?i wdt:P276 ?l . ?l rdfs:label ?n . FILTER(LANG(?n) = "en") }`, (it, r) => (it.where ??= []).length < 3 && !it.where.includes(r.n) && it.where.push(r.n));
  for (const [prop, key] of [["P585", "at"], ["P580", "from"], ["P582", "to"]]) {
    const by = new Map();
    each(`date-${prop}`, `SELECT DISTINCT ?i ?s ?t ?p ?cal ?rank WHERE { ${M} ?i p:${prop} ?s . ?s wikibase:rank ?rank . ?s psv:${prop} ?v . ?v wikibase:timeValue ?t ; wikibase:timePrecision ?p ; wikibase:timeCalendarModel ?cal . }`, (it, r) =>
      (by.get(it) ?? by.set(it, []).get(it)).push(r),
    );
    for (const [it, rows] of by) {
      const parts = bestRanked(rows).map((r) => timeParts(r.t, r.p, r.cal)).filter(Boolean);
      it[key] = agreed(parts);
      if (parts.length && !it[key]) it[`${key}Differ`] = true;
    }
  }
  each("deaths", `SELECT DISTINCT ?i ?d WHERE { ${M} ?i wdt:P1120 ?d . }`, (it, r) => (it.deaths ??= new Set()).add(Math.round(+r.d)));
  each("enwiki", `SELECT DISTINCT ?i ?a WHERE { ${M} ?a schema:about ?i ; schema:isPartOf <https://en.wikipedia.org/> . }`, (it, r) => (it.wiki ??= decodeURIComponent(r.a.replace("https://en.wikipedia.org/wiki/", "")).replace(/_/g, " ")));
  each("britannica", `SELECT DISTINCT ?i ?b WHERE { ${M} ?i wdt:P1417 ?b . }`, (it, r) => (it.brit ??= r.b));
  each("part-of", `SELECT DISTINCT ?i ?p ?l WHERE { ${M} ?i wdt:P361 ?p . OPTIONAL { ?p rdfs:label ?l . FILTER(LANG(?l) = "en") } }`, (it, r) => {
    (it.partOf ??= []).push(qid(r.p));
    if (r.l && !it.partOfName) it.partOfName = r.l;
  });

  /* ─── Each event placed ─── */
  const point = (wkt) => {
    const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/i.exec(wkt || "");
    return m ? pointIn(+m[1], +m[2]) : null;
  };
  const byCountry = new Map([...SITE.keys()].map((c) => [c, []]));
  const tally = { items: items.size, placed: 0, byP17: 0, byPlace: 0, byPoint: 0, unnamed: 0, notEvents: 0, unplaced: 0, partyOnly: 0 };
  const events = []; // every listed event, for the other records to be laid onto
  const unplaced = []; // what no record places, kept beside the build's cache for checking
  for (const it of items.values()) {
    if (!it.title && !it.titleMul && it.titleOther) it.lang = it.titleLang;
    it.title ??= it.titleMul ?? it.titleOther;
    if (!it.title) {
      tally.unnamed++;
      continue;
    }
    if (it.cls && NOT_EVENTS.test(it.cls)) {
      tally.notEvents++;
      continue;
    }
    const site = (set) => [...(set ?? [])].filter((c) => SITE.has(c));
    let inC = site(it.p17);
    if (inC.length) tally.byP17++;
    else if ((inC = site(it.loc)).length) tally.byPlace++;
    else {
      const c = point(it.xy) ?? point(it.locXy);
      inC = c ? [c] : [];
      if (c) tally.byPoint++;
    }
    const party = it.kind === "war" ? site(it.party).filter((c) => !inC.includes(c)) : [];
    if (!inC.length && !party.length) {
      tally.unplaced++;
      unplaced.push({ id: it.id, t: it.title, k: it.kind, c: it.cls, xy: it.xy ?? it.locXy ?? "", p17: [...(it.p17 ?? [])], loc: [...(it.loc ?? [])], where: it.where ?? [] });
      continue;
    }
    if (!inC.length) tally.partyOnly++;
    tally.placed++;
    const ev = toEvent(it);
    events.push(ev);
    for (const c of inC) byCountry.get(c).push({ ev, party: false });
    for (const c of party) byCountry.get(c).push({ ev, party: true });
  }
  console.log("  placed:", tally);
  fs.writeFileSync(path.join(CACHE, "unplaced.json"), JSON.stringify(unplaced));

  /* ─── The site's record of events (unrest.ts) ─── */
  const record = (() => {
    const src = fs.readFileSync(path.join(__dirname, "src/data/unrest.ts"), "utf8");
    const head = "export const UNREST_EVENTS: UnrestEvent[] = ";
    const body = src.slice(src.indexOf(head) + head.length).replace(/;\s*$/, "");
    return new Function(`return ${body}`)();
  })();
  if (record.length < 300) throw new Error(`unrest.ts: only ${record.length} events read`);
  const byWiki = new Map(events.filter((e) => e.wiki).map((e) => [e.wiki, e]));
  let laid = 0;
  let added = 0;
  const RECORD_KIND = { Protest: "unrest", Boycott: "unrest", Revolution: "revolutions", "Internal conflict": "war" };
  for (const r of record) {
    const account = [r.said, r.outcome ? `Outcome: ${r.outcome}.` : "", r.effect ? `Cost: ${r.effect}.` : ""].filter(Boolean).join(" ");
    const cited = (r.sources ?? []).map((s) => [s.label.split(" — ")[0], s.url]);
    const ev = r.article && byWiki.get(r.article.replace(/_/g, " "));
    if (ev) {
      ev.account ||= account;
      ev.links.push(...cited.filter(([, u]) => !ev.links.some(([, v]) => v === u)));
      if (!ev.when && r.when) ev.when = r.when;
      laid++;
      continue;
    }
    const codes = r.where && countriesIn(r.where).length ? countriesIn(r.where) : countriesIn(r.title);
    if (!codes.length || !RECORD_KIND[r.kind]) continue;
    const e2 = { kind: RECORD_KIND[r.kind], cls: r.kind, title: r.title, when: r.when || String(r.year), y: r.year, where: r.where || "", deaths: "", desc: "", q: "", wiki: r.article ? r.article.replace(/_/g, " ") : "", brit: "", links: cited, account, partOf: [] };
    for (const c of codes) byCountry.get(c).push({ ev: e2, party: false });
    added++;
  }
  console.log(`  the site's record: ${laid} laid onto Wikidata's events, ${added} added`);

  /* ─── UCDP/PRIO armed conflicts ─── */
  console.log("UCDP/PRIO Armed Conflict Dataset");
  let acdVersion = "26.1";
  let zip;
  try {
    zip = curl(["https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-261-csv.zip"], "acd-261.zip");
  } catch {
    acdVersion = "25.1";
    zip = curl(["https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-251-csv.zip"], "acd-251.zip");
  }
  const dir = path.join(CACHE, `acd-${acdVersion}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync("unzip", ["-o", "-q", path.join(CACHE, `acd-${acdVersion.replace(".", "")}.zip`), "-d", dir]);
  }
  const csvFile = fs.readdirSync(dir).find((f) => f.endsWith(".csv"));
  const rows = csvRows(fs.readFileSync(path.join(dir, csvFile), "utf8"));
  const [head, ...data] = rows;
  const col = Object.fromEntries(head.map((h, i) => [h, i]));
  const conflicts = new Map();
  for (const r of data) {
    if (r.length < head.length) continue;
    const id = r[col.conflict_id];
    const c = conflicts.get(id) ?? conflicts.set(id, { id, years: [], a: new Set(), b: new Set(), loc: new Set(), war: 0, type: r[col.type_of_conflict], inc: r[col.incompatibility], terr: new Set(), start: r[col.start_date] }).get(id);
    c.years.push(+r[col.year]);
    for (const s of r[col.side_a].split(",")) s.trim() && c.a.add(s.trim());
    for (const s of r[col.side_b].split(",")) s.trim() && c.b.add(s.trim());
    for (const s of r[col.location].split(",")) s.trim() && c.loc.add(s.trim());
    if (r[col.territory_name]) c.terr.add(r[col.territory_name]);
    if (r[col.intensity_level] === "2") c.war++;
    c.type = r[col.type_of_conflict];
  }
  const lastAcd = Math.max(...data.map((r) => +r[col.year]).filter(Boolean));
  const TYPE = { 1: "Extrasystemic", 2: "Interstate", 3: "Intrastate", 4: "Internationalised intrastate" };
  const INC = { 1: "over territory", 2: "over government", 3: "over government and territory" };
  let acdPlaced = 0;
  let acdMissed = [];
  for (const c of conflicts.values()) {
    const first = Math.min(...c.years);
    const last = Math.max(...c.years);
    const codes = [...new Set([...c.loc].flatMap((l) => countriesIn(l.replace(/\(([^)]+)\)/, " $1 "))))];
    if (!codes.length) {
      acdMissed.push([...c.loc].join(", "));
      continue;
    }
    acdPlaced++;
    const ev = {
      kind: "war",
      cls: "Armed conflict (UCDP)",
      title: `${[...c.a].join(", ")} – ${[...c.b].join(", ")}`,
      when: first === last ? String(first) : `${first}–${last}`,
      y: first,
      where: [...c.terr].join(", "),
      deaths: "",
      desc: `${TYPE[c.type] ?? ""} armed conflict ${INC[c.inc] ?? ""}, active in ${c.years.length} year${c.years.length === 1 ? "" : "s"} from ${first} to ${last}${last === lastAcd ? ` (the dataset's last year)` : ""}${c.war ? `; a war - 1,000 or more battle deaths - in ${c.war} of them` : ""}.`.replace(/\s+/g, " "),
      q: "",
      wiki: "",
      brit: "",
      links: [["UCDP", `https://ucdp.uu.se/conflict/${c.id}`]],
      account: "",
      partOf: [],
    };
    for (const code of codes) byCountry.get(code).push({ ev, party: false });
  }
  console.log(`  ${conflicts.size} conflicts, ${acdPlaced} placed; not placed: ${acdMissed.join("; ") || "none"}`);

  /* ─── NOAA NCEI significant earthquakes, tsunamis and eruptions ─── */
  console.log("NOAA NCEI");
  const ncei = (kind) => {
    const all = [];
    for (let page = 1; ; page++) {
      const j = JSON.parse(curl([`https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/${kind}?page=${page}`], `ncei-${kind.replace(/\//g, "-")}-${page}.json`).toString());
      all.push(...j.items);
      if (page >= j.totalPages) break;
    }
    console.log(`  ${kind}: ${all.length}`);
    return all;
  };
  const quakes = ncei("earthquakes");
  const tsunamis = ncei("tsunamis/events");
  const eruptions = ncei("volcanoes");
  const ORDER = { 1: "a few (about 1 to 50)", 2: "some (about 51 to 100)", 3: "many (about 101 to 1,000)", 4: "very many (about 1,001 or more)" };
  const nceiDeaths = (x) => (x.deathsTotal != null ? fmt(x.deathsTotal) : x.deaths != null ? fmt(x.deaths) : ORDER[x.deathsAmountOrderTotal ?? x.deathsAmountOrder] ?? "");
  const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(\-/,;:])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\s+/g, " ").trim();
  const nceiWhen = (x) => (x.day && x.month ? `${x.day} ${MONTHS[x.month - 1]} ${yearWords(x.year > 0 ? x.year : x.year + 1)}` : x.month ? `${MONTHS[x.month - 1]} ${yearWords(x.year > 0 ? x.year : x.year + 1)}` : yearWords(x.year > 0 ? x.year : x.year + 1));
  /* The country NOAA gives, and the others its place names where it names several ("INDIA: UTTAR PRADESH; NEPAL: ..."); failing those, its point. */
  const nceiCodes = (x, names) => {
    const fromNames = [...new Set([...countriesIn(titleCase(String(x.country || ""))), ...(names.length > 1 ? names.flatMap((n) => countriesIn(titleCase(n))) : [])])];
    if (fromNames.length) return fromNames;
    const c = x.latitude != null && x.longitude != null ? pointIn(+x.longitude, +x.latitude) : null;
    return c ? [c] : [];
  };
  const tsunamiOfQuake = new Map(tsunamis.filter((t) => t.earthquakeEventId).map((t) => [t.earthquakeEventId, t]));
  const ymd = (y, m, d) => `${y}-${m}-${d}`;
  // Wikidata's earthquakes and tsunamis by day and country, for NOAA's to be laid onto rather than listed twice.
  const wdByDay = new Map();
  for (const [code, list] of byCountry)
    for (const { ev } of list)
      if (ev.kind === "disaster" && ev.day && /earthquake|tsunami|eruption/i.test(`${ev.cls} ${ev.title}`)) wdByDay.set(`${code}|${ev.day}|${/eruption/i.test(`${ev.cls} ${ev.title}`) ? "v" : "q"}`, ev);
  let nceiLaid = 0;
  let nceiAdded = 0;
  let nceiUnplaced = 0;
  const addNcei = (x, codes, mk, sort) => {
    if (!codes.length) return nceiUnplaced++;
    let ev = null;
    for (const code of codes) {
      const hit = x.day && x.month ? wdByDay.get(`${code}|${ymd(x.year, x.month, x.day)}|${sort}`) : null;
      if (hit) {
        const made = mk();
        hit.links.splice(hit.links.length, 0, ...made.links.filter(([, u]) => !hit.links.some(([, v]) => v === u)));
        if (!hit.deaths && made.deaths) hit.deaths = made.deaths;
        if (made.extra && !hit.desc.includes(made.extra)) hit.desc = [hit.desc, made.extra].filter(Boolean).join(" · ");
        nceiLaid++;
        continue;
      }
      ev ??= mk();
      byCountry.get(code).push({ ev, party: false });
      nceiAdded++;
    }
  };
  for (const x of quakes) {
    const names = String(x.locationName || "").split(";").map((s) => s.split(":")[0]);
    const t = tsunamiOfQuake.get(x.id);
    addNcei(x, nceiCodes(x, names), () => {
      const mag = x.eqMagnitude != null ? `magnitude ${x.eqMagnitude}` : "";
      return {
        kind: "disaster",
        cls: "Earthquake (NOAA)",
        title: `Earthquake${mag ? `, ${mag}` : ""}`,
        when: nceiWhen(x),
        y: x.year > 0 ? x.year : x.year,
        where: titleCase(String(x.locationName || "")),
        deaths: nceiDeaths(x),
        desc: t ? "It caused a tsunami." : "",
        extra: [mag ? `NOAA: ${mag}` : "", t ? "it caused a tsunami" : ""].filter(Boolean).join(", "),
        q: "",
        wiki: "",
        brit: "",
        links: [["NOAA NCEI", `https://www.ngdc.noaa.gov/hazel/view/hazards/earthquake/event-more-info/${x.id}`], ...(t ? [["NOAA NCEI (tsunami)", `https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-more-info/${t.id}`]] : [])],
        account: "",
        partOf: [],
      };
    }, "q");
  }
  for (const t of tsunamis) {
    if (t.earthquakeEventId || !(t.eventValidity >= 3)) continue;
    addNcei(t, nceiCodes(t, []), () => ({
      kind: "disaster",
      cls: "Tsunami (NOAA)",
      title: "Tsunami",
      when: nceiWhen(t),
      y: t.year,
      where: titleCase(String(t.locationName || "")),
      deaths: nceiDeaths(t),
      desc: t.eventValidity === 4 ? "A definite tsunami, in NOAA's grading." : "A probable tsunami, in NOAA's grading.",
      q: "",
      wiki: "",
      brit: "",
      links: [["NOAA NCEI", `https://www.ngdc.noaa.gov/hazel/view/hazards/tsunami/event-more-info/${t.id}`]],
      account: "",
      partOf: [],
    }), "q");
  }
  for (const v of eruptions) {
    addNcei(v, nceiCodes(v, []), () => ({
      kind: "disaster",
      cls: "Volcanic eruption (NOAA)",
      title: `Eruption of ${v.name}`,
      when: nceiWhen(v),
      y: v.year,
      where: String(v.location || ""),
      deaths: nceiDeaths(v),
      desc: v.vei != null ? `Volcanic Explosivity Index ${v.vei}.` : "",
      extra: v.vei != null ? `NOAA: Volcanic Explosivity Index ${v.vei}` : "",
      q: "",
      wiki: "",
      brit: "",
      links: [["NOAA NCEI", `https://www.ngdc.noaa.gov/hazel/view/hazards/volcano/event-more-info/${v.id}`]],
      account: "",
      partOf: [],
    }), "v");
  }
  console.log(`  ${nceiLaid} laid onto Wikidata's events, ${nceiAdded} added, ${nceiUnplaced} not placed`);

  /* ─── GDACS alerts ─── */
  const gdacsSrc = fs.readFileSync(path.join(__dirname, "src/data/newsCountryHistory.ts"), "utf8");
  const gdacs = JSON.parse(/export const COUNTRY_DISASTERS[^=]*=\s*(\{.*\});/.exec(gdacsSrc)[1]);
  let gdacsN = 0;
  for (const [code, list] of Object.entries(gdacs)) {
    if (!byCountry.has(code)) continue;
    for (const [date, hazard, name, alert] of list) {
      const [y, m, d] = date.split("-").map(Number);
      byCountry.get(code).push({
        ev: { kind: "disaster", cls: `${alert} alert (GDACS)`, title: `${hazard}${name ? ` · ${name}` : ""}`, when: `${d} ${MONTHS[m - 1]} ${y}`, y, day: ymd(y, m, d), where: "", deaths: "", desc: `GDACS issued a${alert === "Orange" ? "n" : ""} ${alert.toLowerCase()} alert for it.`, q: "", wiki: "", brit: "", links: [["GDACS", "https://www.gdacs.org/"]], account: "", partOf: [] },
        party: false,
      });
      gdacsN++;
    }
  }
  console.log(`GDACS: ${gdacsN} alerts`);

  /* ─── Write each country ─── */
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = {};
  let bytes = 0;
  for (const [code, list] of byCountry) {
    // One entry per event per country.
    const seen = new Set();
    const rows = list.filter(({ ev }) => (seen.has(ev) ? false : seen.add(ev)));
    rows.sort((a, b) => (b.ev.y ?? -1e9) - (a.ev.y ?? -1e9) || a.ev.title.localeCompare(b.ev.title));
    // An event held as part of another listed here, of the same kind, is listed within the topmost of them.
    const pos = new Map(rows.map((r, i) => [r.ev.q, i]).filter(([q]) => q));
    const parentOf = (i, guard = 0) => {
      const ev = rows[i].ev;
      for (const p of ev.partOf ?? []) {
        const j = pos.get(p);
        if (j != null && j !== i && rows[j].ev.kind === ev.kind && guard < 12) return parentOf(j, guard + 1) ?? j;
      }
      return null;
    };
    const kinds = [...new Set(rows.map((r) => r.ev.cls || ""))].sort();
    const kIndex = new Map(kinds.map((k, i) => [k, i]));
    const out = rows.map((r, i) => {
      const e = r.ev;
      const o = { c: KIND_INDEX[e.kind], k: kIndex.get(e.cls || ""), t: e.title };
      if (e.when) o.w = e.when;
      if (e.y != null) o.y = e.y;
      if (e.where) o.p = e.where;
      if (e.deaths) o.d = e.deaths;
      if (e.desc) o.s = e.desc;
      if (e.account) o.x = e.account;
      if (e.partOfName) o.o = e.partOfName;
      if (r.party) o.f = 1;
      if (e.lang) o.n = e.lang;
      const links = [...(e.q ? [["Wikidata", `https://www.wikidata.org/wiki/${e.q}`]] : []), ...(e.brit ? [["Britannica", `https://www.britannica.com/${e.brit}`]] : []), ...e.links, ...(e.wiki ? [["Wikipedia", `https://en.wikipedia.org/wiki/${encodeURIComponent(e.wiki.replace(/ /g, "_"))}`]] : [])];
      const seenLabel = new Map();
      const copy = links.map((l) => [...l]);
      for (const l of copy) {
        const n = (seenLabel.get(l[0]) ?? 0) + 1;
        seenLabel.set(l[0], n);
        if (n > 1) l[0] = `${l[0]} (${n})`;
      }
      if (copy.length) o.l = copy;
      const parent = parentOf(i);
      if (parent != null) o.u = parent;
      return o;
    });
    const counts = KINDS.map((_, c) => out.filter((o) => o.c === c).length);
    index[code] = counts;
    const json = JSON.stringify({ kinds, events: out });
    bytes += json.length;
    fs.writeFileSync(path.join(OUT_DIR, `${code}.json`), json);
  }
  console.log(`wrote ${byCountry.size} countries, ${(bytes / 1e6).toFixed(1)} MB; the largest:`, Object.entries(index).map(([c, n]) => [c, n.reduce((s, x) => s + x, 0)]).sort((a, b) => b[1] - a[1]).slice(0, 6));

  fs.writeFileSync(
    path.join(__dirname, "src/data/eventHistoryIndex.ts"),
    `/**
 * How many events of each kind each country's historic accounts hold (src/data/eventHistory/<code>.json), and the
 * records they are drawn from: Wikidata, the UCDP/PRIO Armed Conflict Dataset ${acdVersion}, NOAA NCEI's significant
 * earthquake, tsunami and volcanic eruption databases, GDACS and the site's record of events (unrest.ts).
 *
 * GENERATED by build-event-history.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
/** The kinds, in the order of each country's counts. */
export const EVENT_KINDS = ${JSON.stringify(KINDS.map((k) => k.id))} as const;
/** Each country's count of events of each kind, in the order of EVENT_KINDS. */
export const EVENT_COUNTS: Record<string, number[]> = ${JSON.stringify(index)};
/** What the build placed, for the page's note. */
export const EVENT_TALLY = ${JSON.stringify({ wikidata: tally.items, wikidataPlaced: tally.placed, wikidataUnplaced: tally.unplaced + tally.unnamed, ucdp: conflicts.size, ucdpPlaced: acdPlaced, ucdpLast: lastAcd, noaa: quakes.length + tsunamis.length + eruptions.length, gdacs: gdacsN })};
/** The records, each with the page it is read from. */
export const EVENT_SOURCES = ${JSON.stringify([
      { label: "Wikidata (CC0)", url: "https://www.wikidata.org/" },
      { label: `UCDP/PRIO Armed Conflict Dataset ${acdVersion} (CC BY 4.0)`, url: "https://ucdp.uu.se/downloads/" },
      { label: "NOAA NCEI Natural Hazards (public domain)", url: "https://www.ngdc.noaa.gov/hazel/view/hazards" },
      { label: "GDACS (CC BY 4.0)", url: "https://www.gdacs.org/" },
    ])};
`,
  );
  console.log("ok");
}

/** An item of Wikidata as an event of the page. */
function toEvent(it) {
  const d = it.at ?? it.from;
  const words = it.at ? dateWords(it.at) : it.from && it.to ? `${dateWords(it.from)} – ${dateWords(it.to)}` : it.from ? `from ${dateWords(it.from)}` : it.to ? `to ${dateWords(it.to)}` : "";
  const deaths = it.deaths ? [...it.deaths].sort((a, b) => a - b) : [];
  return {
    kind: it.kind,
    cls: it.cls ? it.cls[0].toUpperCase() + it.cls.slice(1) : "",
    title: it.title,
    when: words || (it.atDiffer || it.fromDiffer ? "dates differ in the record" : ""),
    y: d ? startYear(d) : it.to ? startYear(it.to) : null,
    day: d && d[3] >= 11 ? `${d[0]}-${d[1]}-${d[2]}` : null,
    where: (it.where ?? []).join(", "),
    deaths: deaths.length === 1 ? fmt(deaths[0]) : deaths.length > 1 ? `${fmt(deaths[0])} to ${fmt(deaths[deaths.length - 1])} (the record gives several figures)` : "",
    desc: it.desc ?? "",
    q: it.id,
    wiki: it.wiki ?? "",
    brit: it.brit ?? "",
    links: [],
    account: "",
    partOf: it.partOf ?? [],
    partOfName: it.partOfName ?? "",
    lang: it.lang ?? "",
  };
}

/** The first year of the period a date names, at its precision, for sorting. */
function startYear([y, , , p]) {
  if (p >= 9) return y;
  if (p === 8) return Math.floor(y / 10) * 10;
  if (p === 7) return y > 0 ? Math.floor((y - 1) / 100) * 100 + 1 : -Math.floor(-y / 100) * 100 - 99;
  return y > 0 ? Math.floor((y - 1) / 1000) * 1000 + 1 : -Math.floor(-y / 1000) * 1000 - 999;
}

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

/** CSV rows, with quoted fields that may hold commas, quotes and line breaks. */
function csvRows(text) {
  const rows = [];
  let row = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') (f += '"'), i++;
      else if (ch === '"') q = false;
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") row.push(f), (f = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(f), rows.push(row), (row = []), (f = "");
    } else f += ch;
  }
  if (f || row.length) row.push(f), rows.push(row);
  return rows.filter((r) => r.length > 1 || r[0]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
