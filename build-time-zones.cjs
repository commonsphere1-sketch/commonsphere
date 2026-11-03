#!/usr/bin/env node
/**
 * Builds src/data/timeZones.ts and static/tz/{CC}.json - the time zone of every place the site has a window for, so its
 * window can tell the time there now, as asked.
 *
 *   The IANA time zone database (public domain): zone.tab, every zone each country has. The time a zone shows now, and
 *   whether it keeps summer time, is worked out in the reader's browser from its own copy of the same database, so the
 *   clocks change with no rebuild.
 *
 *   timezone-boundary-builder (Evan Siroky, from OpenStreetMap; ODbL), through the geo-tz package: the zone a point lies
 *   in, for the countries whose zones do not all keep the same time - the United States, Canada, Russia, Brazil,
 *   Australia and the rest. A country whose zones all keep the same time all year needs no point looked up: every place
 *   in it has its zone.
 *
 * China keeps one official time, Beijing's, across the country; the database's zone for Xinjiang, Asia/Urumqi, is the
 * local time some there keep, not the official one, and is not used. A point that falls in no country's zone (out at sea)
 * or in a zone keeping another time than any of its own country's is left with none, and its window shows no time.
 *
 *   node build-time-zones.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { find } = require("geo-tz");
const { feature } = require("topojson-client");
const { geoArea, geoBounds, geoCentroid, geoContains } = require("d3-geo");

const OUT = path.join(__dirname, "src/data/timeZones.ts");
const DIR = path.join(__dirname, "static/tz");
const CACHE = path.join(os.tmpdir(), "commonsphere-tz");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(DIR, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";

function get(url, name) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > 20 * 3600e3) execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "120", "-A", UA, "-o", file, url]);
  return fs.readFileSync(file, "utf8");
}
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

// ── The zones of each country, from the database ──
const TZDB = get("https://data.iana.org/time-zones/data/version", "version").trim();
const TAB = new Map(); // cc -> zones, in zone.tab's order
for (const line of get("https://data.iana.org/time-zones/data/zone.tab", "zone.tab").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const [cc, , zone] = line.split("\t");
  if (!TAB.has(cc)) TAB.set(cc, []);
  TAB.get(cc).push(zone);
}
const OFFICIAL = { CN: "Asia/Shanghai" };

// What a zone's clocks show through the coming year: two zones keep the same time if these agree.
const Y = new Date().getUTCFullYear();
const INSTANTS = [];
for (let m = 0; m < 12; m++) for (const d of [1, 15]) INSTANTS.push(new Date(Date.UTC(Y + (m < new Date().getUTCMonth() ? 1 : 0), m, d, 12)));
const SIG = new Map();
const sig = (zone) => {
  if (!SIG.has(zone)) {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" });
    SIG.set(zone, INSTANTS.map((t) => f.formatToParts(t).find((p) => p.type === "timeZoneName").value).join(","));
  }
  return SIG.get(zone);
};
/** A country's zones that keep different times: one of each, in zone.tab's order. */
const distinct = (zones) => {
  const seen = new Map();
  for (const z of zones) if (!seen.has(sig(z))) seen.set(sig(z), z);
  return [...seen.values()];
};
const zonesOf = (cc) => (OFFICIAL[cc] ? [OFFICIAL[cc]] : TAB.get(cc) ?? []);
let MULTI = [...TAB.keys()].filter((cc) => distinct(zonesOf(cc)).length > 1).sort();

// ── Every zone named, a number each ──
const ZONES = [];
const idx = (z) => {
  let i = ZONES.indexOf(z);
  if (i < 0) i = ZONES.push(z) - 1;
  return i;
};

let unplaced = 0;
const misses = [];
/** The zone a point lies in, as its own country names it; null out at sea or where no zone of its country keeps that time. */
function zoneAt(lat, lon, cc, what) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const own = zonesOf(cc);
  const hits = find(lat, lon).filter((z) => !z.startsWith("Etc/"));
  const mine = hits.find((z) => own.includes(z));
  if (mine) return mine;
  // A zone the boundaries name for a stretch its country lists under another name keeping the same time, or a point a
  // little over a border: the country's own zone that keeps that time.
  for (const h of hits) {
    const same = own.find((z) => sig(z) === sig(h));
    if (same) return same;
  }
  unplaced++;
  if (misses.length < 40) misses.push(`${cc} ${what} (${lat}, ${lon}): ${hits.join(" ") || "none"}`);
  return null;
}

// ── The places the site holds ──
const SITE_CODES = new Set([...read("src/data/countriesData.ts").matchAll(/\bcode:\s*"([A-Z]{2})"/g)].map((m) => m[1]));
const CAPITAL = new Map([...read("src/data/countriesData.ts").matchAll(/\bcode:\s*"([A-Z]{2})"[\s\S]{0,400}?\bcapital:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
for (const m of read("src/data/countriesData.ts").matchAll(/\bcapital:\s*"([^"]+)"[\s\S]{0,400}?\bcode:\s*"([A-Z]{2})"/g)) if (!CAPITAL.has(m[2])) CAPITAL.set(m[2], m[1]);
const UN = [...read("src/data/unCities.ts").matchAll(/^\s*\["([A-Z]{2})",(\d+),"((?:[^"\\]|\\.)*)",(-?[\d.]+|null),(-?[\d.]+|null),/gm)].map((m) => ({ cc: m[1], code: +m[2], name: m[3], lat: +m[4], lon: +m[5] }));
const PLACES_AT = Object.fromEntries([...read("src/data/cityPlaces.ts").matchAll(/"([^"]+)":\s*\{\s*wiki:\s*"(?:[^"\\]|\\.)*",\s*lon:\s*(-?[\d.]+),\s*lat:\s*(-?[\d.]+)/g)].map((m) => [m[1], { lon: +m[2], lat: +m[3] }]));
const PROFILED = [...read("src/data/citiesData.ts").matchAll(/id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*country:\s*"[^"]*",\s*countryCode:\s*"([A-Z]{2})"/g)].map((m) => ({ id: m[1], name: m[2], cc: m[3] }));
const COUNTIES = [...read("src/data/usCounties.ts").matchAll(/^\s*\["(\d{5})","((?:[^"\\]|\\.)*)","([A-Z]{2})",(-?[\d.]+|null),(-?[\d.]+|null),/gm)].map((m) => ({ fips: m[1], name: m[2], state: m[3], lat: +m[4], lon: +m[5] }));
const STATE_ABBR = new Map([...read("src/data/statesData.ts").matchAll(/name:\s*"([^"]+)",\s*abbreviation:\s*"([A-Z]{2})"/g)].map((m) => [m[1], m[2]]));
STATE_ABBR.set("District of Columbia", "DC");
const DIVISIONS = read("src/data/subnations.ts")
  .split("\n")
  .filter((l) => l.startsWith('  "{'))
  .map((l) => JSON.parse(JSON.parse(l.trim().replace(/,$/, ""))));
if (UN.length < 10000 || COUNTIES.length < 3000 || DIVISIONS.length < 3000 || PROFILED.length < 20) throw new Error(`read too few: ${UN.length} UN cities, ${COUNTIES.length} counties, ${DIVISIONS.length} divisions, ${PROFILED.length} profiled cities`);

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

// ── Each country: the zone at its capital, and its zones that keep different times ──
const COUNTRY = {};
const placesOf = (cc) => {
  const f = path.join(__dirname, "static/places", `${cc}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
};
const codes = [...new Set([...TAB.keys(), ...SITE_CODES])].sort();
const noTab = [];
for (const cc of codes) {
  const own = zonesOf(cc);
  if (!own.length) {
    // A country the database lists under none of its own zones (Kosovo): the zone at its capital.
    const file = placesOf(cc);
    const cap = file?.places.find((p) => p[5] === 0);
    const hit = cap && find(cap[1], cap[2]).find((z) => !z.startsWith("Etc/"));
    if (!hit) {
      noTab.push(cc);
      continue;
    }
    COUNTRY[cc] = [idx(hit), [idx(hit)]];
    continue;
  }
  const kinds = distinct(own);
  if (kinds.length === 1) {
    COUNTRY[cc] = [idx(own[0]), [idx(own[0])]];
    continue;
  }
  // Its capital, by the place GeoNames marks as the country's capital - the one by the site's name for it, where it marks two.
  const file = placesOf(cc);
  const caps = file ? file.places.filter((p) => p[5] === 0) : [];
  const want = fold(CAPITAL.get(cc) ?? "");
  const cap = caps.find((p) => want && (fold(p[0]).includes(want) || want.includes(fold(p[0])))) ?? caps[0];
  const at = cap ? zoneAt(cap[1], cap[2], cc, `capital ${cap[0]}`) : null;
  if (!at) {
    // Antarctica and the like: no capital, no people the site follows.
    if (SITE_CODES.has(cc)) throw new Error(`${cc}: no zone found at its capital`);
    noTab.push(cc);
    continue;
  }
  COUNTRY[cc] = [idx(at), kinds.map(idx)];
}

MULTI = MULTI.filter((cc) => COUNTRY[cc]);
/** A shape's centre, or where that falls outside it (a crescent, a coast of islands) the point inside it nearest the centre. */
function inside(f) {
  const c = geoCentroid(f);
  if (geoContains(f, c)) return c;
  const [[x0, y0], [b1, y1]] = geoBounds(f);
  // A shape across the 180th meridian has its east edge west of its west one.
  const x1 = b1 < x0 ? b1 + 360 : b1;
  let best = null;
  for (let i = 0; i <= 24; i++)
    for (let j = 0; j <= 24; j++) {
      const x = x0 + ((x1 - x0) * i) / 24;
      const p = [x > 180 ? x - 360 : x, y0 + ((y1 - y0) * j) / 24];
      const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
      if ((!best || d < best[1]) && geoContains(f, p)) best = [p, d];
    }
  return best?.[0] ?? null;
}

/** Places by what they lie in: the zone most of each group's keep, and each keeping another time (-1, none found) by its key. */
function grouped(rows) {
  const groups = new Map();
  for (const [g, key, z] of rows) {
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push([key, z]);
  }
  const out = {};
  for (const [g, list] of groups) {
    const n = new Map();
    for (const [, z] of list) if (z) n.set(sig(z), (n.get(sig(z)) ?? 0) + 1);
    const top = [...n].sort((a, b) => b[1] - a[1])[0];
    const m = top ? list.find(([, z]) => z && sig(z) === top[0])[1] : null;
    const ex = {};
    for (const [key, z] of list) if (!z || !m || sig(z) !== sig(m)) ex[key] = z ? idx(z) : -1;
    out[g] = [m ? idx(m) : -1, ex];
  }
  return out;
}

// ── The countries whose zones keep different times: each place's zone, in a file of its own ──
const written = [];
for (const cc of MULTI) {
  const out = {};
  const file = placesOf(cc);
  if (file) {
    // Each place GeoNames lists, by its first-order division: the time most of them keep, the division's seat's, and every time
    // kept in it; a place keeping another time than most in its division is listed by its id.
    const byRegion = file.regions.map(() => []);
    const zoneOf = new Map();
    for (const p of file.places) {
      const z = zoneAt(p[1], p[2], cc, `place ${p[0]}`);
      zoneOf.set(p[6], z);
      if (z && byRegion[p[4]]) byRegion[p[4]].push(z);
    }
    const majority = byRegion.map((zs) => {
      const n = new Map();
      for (const z of zs) n.set(sig(z), (n.get(sig(z)) ?? 0) + 1);
      const top = [...n].sort((a, b) => b[1] - a[1])[0];
      return top ? zs.find((z) => sig(z) === top[0]) : null;
    });
    out.rm = majority.map((z) => (z ? idx(z) : -1));
    out.ex = {};
    for (const p of file.places) {
      const z = zoneOf.get(p[6]);
      const m = majority[p[4]];
      if (!z) out.ex[p[6]] = -1;
      else if (!m || sig(z) !== sig(m)) out.ex[p[6]] = idx(z);
    }
    // Each division's seat and the seat's zone; and for a state of the United States, every time kept in it - by its places
    // and by its counties, which between them cover it (the Aleutians' county has a time its few listed places do not). Elsewhere
    // the places GeoNames lists may leave out a thinly peopled stretch keeping another time, so no count of a division's
    // times is given.
    out.regions = {};
    file.regions.forEach((name, r) => {
      if (!name || !byRegion[r].length) return;
      const seat = file.places.find((p) => p[4] === r && p[5] === 2 && zoneOf.get(p[6]));
      const entry = [seat ? seat[0] : "", seat ? idx(zoneOf.get(seat[6])) : -1];
      if (cc === "US") {
        const abbr = STATE_ABBR.get(name);
        if (!abbr) throw new Error(`no code for the state ${name}`);
        const zs = [...byRegion[r], ...COUNTIES.filter((c) => c.state === abbr).map((c) => zoneAt(c.lat, c.lon, cc, `county ${c.name}`)).filter(Boolean)];
        // Most kept first.
        const n = new Map();
        for (const z of zs) n.set(sig(z), [z, (n.get(sig(z))?.[1] ?? 0) + 1]);
        entry.push([...n.values()].sort((a, b) => b[1] - a[1]).map(([z]) => idx(z)));
      }
      out.regions[name] = entry;
    });
  }
  const un = UN.filter((c) => c.cc === cc);
  if (un.length) out.un = Object.fromEntries(un.map((c) => [c.code, zoneAt(c.lat, c.lon, cc, `UN city ${c.name}`)]).filter(([, z]) => z).map(([k, z]) => [k, idx(z)]));
  const prof = PROFILED.filter((c) => c.cc === cc && PLACES_AT[c.id]);
  if (prof.length) out.cities = Object.fromEntries(prof.map((c) => [c.id, zoneAt(PLACES_AT[c.id].lat, PLACES_AT[c.id].lon, cc, `city ${c.name}`)]).filter(([, z]) => z).map(([k, z]) => [k, idx(z)]));
  if (cc === "US") out.counties = grouped(COUNTIES.map((c) => [c.state, c.fips, zoneAt(c.lat, c.lon, cc, `county ${c.name}`)]));
  const div = DIVISIONS.filter((s) => s.cc === cc);
  if (div.length) out.divisions = Object.fromEntries(div.map((s) => [s.id, zoneAt(s.lat, s.lon, cc, `division ${s.name}`)]).filter(([, z]) => z).map(([k, z]) => [k, idx(z)]));
  // Second-order divisions: the zone at the centre of each, where the centre lies inside it.
  const a2 = path.join(__dirname, "static/geo/admin2", `${cc}.json`);
  if (fs.existsSync(a2)) {
    const topo = JSON.parse(fs.readFileSync(a2, "utf8"));
    const rows = [];
    const seen = new Set();
    for (const f of feature(topo, topo.objects.a).features) {
      // Wound the way d3 reads a shape, as src/lib/admin2.ts does: a ring the wrong way round is the whole globe but it.
      const fix = (rings) => geoArea({ type: "Polygon", coordinates: rings }) > 2 * Math.PI && rings.forEach((r) => r.reverse());
      if (f.geometry?.type === "Polygon") fix(f.geometry.coordinates);
      else if (f.geometry?.type === "MultiPolygon") f.geometry.coordinates.forEach(fix);
      const key = `${f.properties.p ?? ""}|${f.properties.n}`;
      const c = inside(f);
      const z = c ? zoneAt(c[1], c[0], cc, `district ${key}`) : null;
      // Two districts of one name in one division keeping different times: neither is given one.
      // Two districts of one name in one division: neither is given a zone, rather than one the other's.
      rows.push([f.properties.p ?? "", f.properties.n, seen.has(key) ? null : z]);
      if (seen.has(key)) for (const r of rows) if (r[0] === (f.properties.p ?? "") && r[1] === f.properties.n) r[2] = null;
      seen.add(key);
    }
    out.admin2 = grouped(rows);
  }
  fs.writeFileSync(path.join(DIR, `${cc}.json`), JSON.stringify(out));
  written.push(`${cc} ${(fs.statSync(path.join(DIR, `${cc}.json`)).size / 1024).toFixed(0)}k`);
}
// A file from an earlier build for a country that now keeps one time is taken away.
for (const f of fs.readdirSync(DIR)) if (!MULTI.includes(f.replace(/\.json$/, ""))) fs.unlinkSync(path.join(DIR, f));

fs.writeFileSync(
  OUT,
  `/**
 * The time zone of every country, and of every place in the ${MULTI.length} whose zones keep different times, so a place's window can
 * tell the time there now: the IANA time zone database ${TZDB} (public domain), and, for where a point lies, the zone
 * boundaries of timezone-boundary-builder (Evan Siroky, from OpenStreetMap; ODbL). The time a zone shows is worked out in
 * the reader's browser from its own copy of the database. China's one official time, Beijing's, is used across China.
 *
 * GENERATED by build-time-zones.cjs on ${TODAY} — do not edit by hand; change the script and re-run it. The places of the
 * countries in TZ_MULTI are in static/tz/{CC}.json, fetched when a window there opens.
 */
export const TIME_ZONES_RETRIEVED = "${TODAY}";
export const TIME_ZONE_SOURCES = [
  { label: "IANA — Time Zone Database ${TZDB} (public domain)", url: "https://www.iana.org/time-zones" },
  { label: "timezone-boundary-builder — time zone boundaries from OpenStreetMap (ODbL)", url: "https://github.com/evansiroky/timezone-boundary-builder" },
];
/** Every zone named here, by its IANA name. */
export const ZONES: string[] = ${JSON.stringify(ZONES)};
/** Each country's zone at its capital, and one of each of its zones that keep different times (indexes into ZONES). */
export const COUNTRY_ZONES: Record<string, [capital: number, kinds: number[]]> = ${JSON.stringify(COUNTRY)};
/** The countries whose zones do not all keep the same time: their places' zones are in /tz/{CC}.json. */
export const TZ_MULTI: string[] = ${JSON.stringify(MULTI)};
/**
 * A file of /tz/: rm, the zone most places of each first-order division (by GeoNames' order of them) keep; ex, a place
 * keeping another, by its GeoNames id (-1, none found); regions, each division by GeoNames' name - its seat and the seat's
 * zone, and for a state of the United States every zone kept in it, most kept first; and the zone of each UN city by its code, each profiled city by its
 * id and each division by its id; and each US county by its state and FIPS code, and each second-order division by its
 * parent and name - the zone most in the state or the parent keep, and each keeping another time (-1, none found).
 */
export type TzFile = {
  rm?: number[];
  ex?: Record<string, number>;
  regions?: Record<string, [seat: string, seatZone: number, kept?: number[]]>;
  un?: Record<string, number>;
  cities?: Record<string, number>;
  counties?: Record<string, [most: number, others: Record<string, number>]>;
  divisions?: Record<string, number>;
  admin2?: Record<string, [most: number, others: Record<string, number>]>;
};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(COUNTRY).length} countries, ${ZONES.length} zones, tzdb ${TZDB}`);
console.log(`  keeping different times (${MULTI.length}): ${written.join(", ")}`);
if (noTab.length) console.log(`  no zone found: ${noTab.join(" ")}`);
console.log(`  points with no zone of their country: ${unplaced}${misses.length ? "\n    " + misses.join("\n    ") : ""}`);
