/**
 * Builds the towns and villages of every country for the World Maps page's
 * explorer: static/places/<ISO code>.json, one file a country, fetched when
 * the country is picked; static/places/world.json, the larger places of the
 * whole world for the map before one is; and src/data/placesIndex.ts, which
 * says what there is.
 *
 *   GeoNames, "cities500"   every populated place with more than 500 people,
 *                           and every seat of an administrative division down
 *                           to the fourth order, in every country and
 *                           territory: its name, where it is, its population,
 *                           what kind of place GeoNames says it is, and the
 *                           first-order division it lies in. CC BY 4.0.
 *
 * That is GeoNames' own cut: a hamlet of fewer than 500 people that is no
 * seat of anything is not in it, and the page says so. Parts of a place
 * (GeoNames' "section of populated place") and places that no longer exist
 * are left out: they are not municipalities, towns or villages.
 *
 * Who leads a place is not here. GeoNames does not say, and no register of
 * the world's municipalities does: build-representatives.cjs keeps the heads
 * that three records agree on, each with its GeoNames id where Wikidata gives
 * one, and the explorer sets the two side by side.
 *
 *   node build-places.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { unzip } = require("./xlsx-lite.cjs");

const DIR = path.join(__dirname, "static/places");
const OUT = path.join(__dirname, "src/data/placesIndex.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-places");
fs.mkdirSync(CACHE, { recursive: true });
const BASE = "https://download.geonames.org/export/dump/";
/** The places of the whole world drawn before a country is picked: those of this many people or more. */
const WORLD_MIN = 15000;

function fetched(name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "600", "-A", UA, "-o", at, BASE + name], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${name}: could not be fetched from GeoNames`);
    }
  }
  return at;
}

/** What GeoNames' feature code says a place is. Codes not here are not towns or villages, and are left out. */
const KINDS = {
  PPLC: "Capital of the country",
  PPLG: "Seat of government",
  PPLA: "Seat of a first-order division",
  PPLA2: "Seat of a second-order division",
  PPLA3: "Seat of a third-order division",
  PPLA4: "Seat of a fourth-order division",
  PPLA5: "Seat of a fifth-order division",
  PPL: "Populated place",
  PPLL: "Populated locality",
  PPLS: "Populated places",
  PPLF: "Farm village",
  PPLR: "Religious community",
  STLMT: "Israeli settlement",
};
const CODES = Object.keys(KINDS);

const got = unzip(fetched("cities500.zip"));
const rows = got.get("cities500.txt").toString("utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));
if (rows.length < 150000) throw new Error(`only ${rows.length} places were read from cities500`);
// "US.CA <tab> California <tab> ..." - a first-order division's name, by country and code.
const regionName = new Map(fs.readFileSync(fetched("admin1CodesASCII.txt"), "utf8").split("\n").filter(Boolean).map((l) => l.split("\t")).map((r) => [r[0], r[1]]));
// "AD <tab> AND <tab> 020 <tab> AN <tab> Andorra <tab> ..." - a country's or territory's name, by code.
const countryName = new Map(fs.readFileSync(fetched("countryInfo.txt"), "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split("\t")).map((r) => [r[0], r[4]]));

const byCountry = new Map();
let left = 0;
let newest = "";
for (const r of rows) {
  const [id, name, , , lat, lon, cls, code, cc, , admin1, , , , population, , , , modified] = r;
  if (cls !== "P" || !CODES.includes(code) || !/^[A-Z]{2}$/.test(cc)) { left++; continue; }
  if (!Number.isFinite(+lat) || !Number.isFinite(+lon) || !/^\d+$/.test(id)) throw new Error(`cities500: a row was not read (${r.slice(0, 9).join(" | ")})`);
  if (modified > newest) newest = modified;
  (byCountry.get(cc) ?? byCountry.set(cc, []).get(cc)).push({ id: +id, name, lat: +(+lat).toFixed(3), lon: +(+lon).toFixed(3), pop: +population || 0, kind: CODES.indexOf(code), region: regionName.get(`${cc}.${admin1}`) ?? "" });
}

fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });
const counts = {};
const world = [];
let total = 0;
let bytes = 0;
for (const [cc, list] of [...byCountry].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (!countryName.has(cc)) throw new Error(`${cc}: GeoNames names no country or territory with this code`);
  // Largest first; the seats and capitals of no recorded population after those with one, by name.
  list.sort((a, b) => b.pop - a.pop || a.kind - b.kind || a.name.localeCompare(b.name));
  const regions = [...new Set(list.map((p) => p.region))].sort();
  const body = JSON.stringify({ regions, places: list.map((p) => [p.name, p.lat, p.lon, p.pop, regions.indexOf(p.region), p.kind, p.id]) });
  fs.writeFileSync(path.join(DIR, `${cc}.json`), body);
  bytes += body.length;
  counts[cc] = list.length;
  total += list.length;
  for (const p of list) if (p.pop >= WORLD_MIN) world.push(Math.round(p.lon * 100), Math.round(p.lat * 100));
}
fs.writeFileSync(path.join(DIR, "world.json"), JSON.stringify(world));

const today = new Date().toISOString().slice(0, 10);
const q = (v) => JSON.stringify(v);
fs.writeFileSync(
  OUT,
  `/**
 * The towns and villages of every country, for the World Maps page's
 * explorer: what the files under static/places hold.
 *
 * GENERATED by build-places.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * The places are GeoNames' "cities500": every populated place with more than
 * 500 people and every seat of an administrative division down to the fourth
 * order, in every country and territory. A hamlet smaller than that which is
 * the seat of nothing is not in it. Each country's places are in
 * /places/<code>.json - { regions, places: [name, latitude, longitude,
 * population or 0, index of its first-order division in regions, index of its
 * kind in PLACE_KINDS, GeoNames id] }, largest first - and /places/world.json
 * holds the positions (longitude and latitude, in hundredths of a degree) of
 * the ${whole(world.length / 2)} places of ${whole(WORLD_MIN)} people or more.
 *
 * GeoNames does not say who leads a place: the heads the explorer shows are
 * those build-representatives.cjs confirmed, set beside these by GeoNames id.
 */
export const PLACES_SOURCE = {
  geonames: { label: "GeoNames — cities500: populated places of more than 500 people and seats of administrative divisions (CC BY 4.0)", url: "https://download.geonames.org/export/dump/" },
  retrieved: "${today}",
  /** The newest change among the rows read. */
  updated: ${q(newest)},
};

/** What GeoNames says a place is, by the index its row carries. */
export const PLACE_KINDS: string[] = ${q(CODES.map((c) => KINDS[c]))};

/** A row of a country's file: [name, latitude, longitude, population or 0, index into the file's regions, index into PLACE_KINDS, GeoNames id]. */
export type PlaceRow = [name: string, lat: number, lon: number, population: number, region: number, kind: number, id: number];
export type PlacesFile = { regions: string[]; places: PlaceRow[] };

/** Every place there is a row for, and those of ${whole(WORLD_MIN)} people or more that world.json draws. */
export const PLACES_TOTAL = ${total};
export const PLACES_WORLD = { atLeast: ${WORLD_MIN}, count: ${world.length / 2} };

/** [the country's or territory's name as GeoNames gives it, how many of its places there are], by ISO code. */
export const PLACE_COUNTRIES: Record<string, [name: string, places: number]> = ${q(Object.fromEntries(Object.keys(counts).map((cc) => [cc, [countryName.get(cc), counts[cc]]])))};
`,
);
function whole(n) {
  return n.toLocaleString("en-US");
}
console.log(`wrote ${Object.keys(counts).length} files under static/places (${(bytes / 1e6).toFixed(1)} MB) and world.json (${whole(world.length / 2)} places of ${whole(WORLD_MIN)} or more, ${Math.round(fs.statSync(path.join(DIR, "world.json")).size / 1024)} KB)`);
console.log(`  ${whole(total)} places in ${Object.keys(counts).length} countries and territories; ${whole(left)} rows left out (parts of places, places that no longer exist); newest row ${newest}`);
console.log("  most:", Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${whole(v)}`).join(", "), "| largest file:", Object.keys(counts).map((cc) => [cc, fs.statSync(path.join(DIR, `${cc}.json`)).size]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(", "));
