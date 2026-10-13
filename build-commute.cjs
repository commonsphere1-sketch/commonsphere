/**
 * Builds src/data/commute.ts — how long people travel to work, and how, for
 * the Transportation panel of a city's window.
 *
 * No body publishes the journey to work for every country on one footing, and
 * the rankings that offer one for cities (traffic-app and survey indices) are
 * not open to reuse. So the file holds the two official series that are, each
 * for the places it covers, and nothing for the rest:
 *
 *   Eurostat, Labour Force        The mean time of the journey from home to
 *     Survey, 2019 module on      work, one way, in minutes, of employed
 *     work organisation           people aged 15 to 74 who travel at least a
 *     (table lfso_19plwk28)       minute - for each country, and for the
 *                                 people living in its cities, its towns and
 *                                 suburbs and its rural areas, as Eurostat's
 *                                 degree of urbanisation classes them. The
 *                                 module was run once, in 2019. A figure
 *                                 Eurostat marks as of low reliability or
 *                                 confidential is left out.
 *   US Census Bureau, American    For the United States and for the cities
 *     Community Survey 2024,      the Cities page has there: the minutes all
 *     1-year (tables B08013,      workers took to get to work (B08013), the
 *     B08301, B08303)             workers who travelled and how long they
 *                                 took (B08303), and how each worker got
 *                                 there (B08301). The mean is the Bureau's
 *                                 own: the aggregate minutes divided by the
 *                                 workers who did not work from home - 27.2
 *                                 minutes for the country, the figure the
 *                                 Bureau publishes. The shares are each
 *                                 count over its table's total. Nothing else
 *                                 is computed. A place is the city within its
 *                                 own boundary, not the metropolitan area.
 *
 *   The same survey, for the     Every city of the United States in the
 *     cities of the UN's list     UN's list (unCities.ts) is looked for among
 *                                 the Census places the 1-year survey covers,
 *                                 those of 65,000 people or more: the place
 *                                 that bears its name and whose internal
 *                                 point, in the Bureau's Gazetteer, lies
 *                                 within 40 km of the UN's centre for the
 *                                 city. One such place, or none is taken.
 *                                 The Bureau gives the ways to work in full
 *                                 (B08301) only for its larger places; a
 *                                 city without that table has the length
 *                                 of its journey and no ring of the ways.
 *   Eurostat, city statistics:    For a city of Europe: the average time of
 *     transport (urb_ctran)       the journey to work, and the share of
 *                                 journeys made by car, public transport,
 *                                 bicycle, on foot and by motorcycle - each
 *                                 of its latest year from 2011 on, the
 *                                 shares all of one year. The figures come
 *                                 from national censuses and surveys, of
 *                                 different years, and many are estimates,
 *                                 which is said. A figure marked of low
 *                                 reliability, confidential or of a
 *                                 differing definition is left out; so are
 *                                 shares that are not shares (above 100, or
 *                                 together under 90 or over 100.5). A city
 *                                 is matched to the UN's by its name within
 *                                 its country - one city each way, or none.
 *
 * The two are not the same measure - different years, different surveys, and
 * Eurostat counts the employed where the Census counts workers 16 and over -
 * so the panel gives each under its own name and does not rank across them.
 *
 *   node build-commute.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const { unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/commute.ts");
const REPORT = process.argv.includes("--report");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-commute");
fs.mkdirSync(CACHE, { recursive: true });

const EUROSTAT_TABLE = "lfso_19plwk28";
const EUROSTAT_URL = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${EUROSTAT_TABLE}?format=JSON&lang=EN`;
/** Eurostat's codes where they are not the ISO ones. */
const GEO_ISO = { EL: "GR", UK: "GB" };
const EU = "EU27_2020";
const AGGREGATES = new Set([EU, "EU28", "EA19"]);

const ACS_YEAR = 2024;
const ACS_DIR = `https://www2.census.gov/programs-surveys/acs/summary_file/${ACS_YEAR}/table-based-SF/data/1YRData/`;
const ACS_TABLES = ["b08013", "b08301", "b08303"];
const US = "0100000US";
/** The Cities page's cities in the United States, each as the Census place of its name: the city within its own boundary. */
const US_PLACES = {
  nyc26: ["1600000US3651000", "New York city"],
  sfo: ["1600000US0667000", "San Francisco city"],
};

const ACS_GEOS = `https://www2.census.gov/programs-surveys/acs/summary_file/${ACS_YEAR}/table-based-SF/documentation/Geos${ACS_YEAR}1YR.txt`;
const GAZ_YEAR = 2024;
const GAZ_URL = `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/${GAZ_YEAR}_Gazetteer/${GAZ_YEAR}_Gaz_place_national.zip`;
/** How far a Census place's internal point may lie from the UN's centre for the city of its name. */
const US_REACH_KM = 40;

const CITY_TABLE = "urb_ctran";
const CITY_URL = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${CITY_TABLE}?format=JSON&lang=EN`;
/** Nothing older is taken for a city: the table reaches back to 1989. */
const CITY_FROM = 2011;
const CITY_MINUTES = "TT1019V";
const CITY_WAYS = [
  ["Car", "TT1003V", true],
  ["Public transport", "TT1010V", true],
  ["Bicycle", "TT1007V", true],
  ["On foot", "TT1008V", true],
  ["Motorcycle", "TT1006V", false],
];
/**
 * Eurostat writes a city's name as its country does; the UN's list writes some in English. Each pair here is one city
 * under its two names, by country - nothing else is assumed to be the same place.
 */
const CITY_ENGLISH = {
  AT: { wien: "vienna" },
  BE: { antwerpen: "antwerp", gent: "ghent", brugge: "bruges", oostende: "ostend" },
  BG: { sofiya: "sofia" },
  CH: { geneve: "geneva", luzern: "lucerne" },
  CZ: { plzen: "pilsen" },
  DE: {
    munchen: "munich",
    koln: "cologne",
    nurnberg: "nuremberg",
    hannover: "hanover",
    "frankfurt am main": "frankfurt",
    braunschweig: "brunswick",
    "halle an der saale": "halle",
    saarbrucken: "saarbruecken",
    "oldenburg oldenburg": "oldenburg",
    konstanz: "constance",
    "kempten allgau": "kempten",
  },
  ES: { sevilla: "seville", "jerez de la frontera": "jerez" },
  FR: { dunkerque: "dunkirk" },
  GB: { "kingston upon hull": "hull", "brighton and hove": "brighton", "dundee city": "dundee" },
  GR: { athina: "athens" },
  IT: { napoli: "naples", milano: "milan", torino: "turin", genova: "genoa", firenze: "florence", venezia: "venice", padova: "padua", "reggio di calabria": "reggio calabria", siracusa: "syracuse" },
  NL: { "s gravenhage": "the hague" },
  PL: { warszawa: "warsaw" },
  RO: { bucuresti: "bucharest" },
  SE: { goteborg: "gothenburg" },
};

/** The UN's cities, read from the file its own build writes: [cc, code, name, lat, lon, ...]. */
function unCities() {
  const src = fs.readFileSync(path.join(__dirname, "src/data/unCities.ts"), "utf8");
  const from = src.indexOf("export const UN_CITIES: UnCity[] = [");
  if (from < 0) throw new Error("unCities.ts: the list was not found");
  const open = src.indexOf("[", src.indexOf("=", from));
  const close = src.indexOf("\n];", open);
  const rows = JSON.parse(src.slice(open, close).replace(/,\s*$/, "") + "]");
  if (rows.length < 10000) throw new Error(`unCities.ts: only ${rows.length} cities were read`);
  return rows;
}
const plain = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    // "Saint Petersburg" in one list is "St. Petersburg" in the other.
    .replace(/\bsaint\b/g, "st")
    .replace(/\s+/g, " ")
    .trim();
/** The names a city goes by in the UN's list: "Roma (Rome)" is Roma and Rome, "Minneapolis [Saint Paul]" Minneapolis and Saint Paul, "Bolzano - Bozen" Bolzano and Bozen. */
const unNames = (name) => name.split(/[()[\]/]|\s-\s/).map(plain).filter(Boolean);
const km = (a, b) => {
  const rad = Math.PI / 180;
  const h = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

async function cachedFile(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return at;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  return at;
}

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}

/** Eurostat's mean minutes, by country and by where people live. */
async function europe() {
  const d = JSON.parse(await cached("eurostat.json", EUROSTAT_URL));
  const index = (k) => d.dimension[k].category.index;
  const at = (sel) => d.id.reduce((i, k, n) => i * d.size[n] + index(k)[sel[k]], 0);
  const year = Object.keys(index("time"))[0];
  // The mean is given once: in minutes, for those who travel a minute or more.
  const base = { freq: "A", isced11: "TOTAL", duration: "MN_GE1", age: "Y15-74", sex: "T", unit: "MN", time: year };
  const read = (geo, deg) => {
    const p = at({ ...base, geo, deg_urb: deg });
    const v = d.value[p];
    // A flagged figure - low reliability, confidential - is not taken.
    return typeof v === "number" && !(d.status && d.status[p]) ? v : null;
  };
  const row = (geo) => ({ all: read(geo, "TOTAL"), cities: read(geo, "DEG1"), towns: read(geo, "DEG2"), rural: read(geo, "DEG3") });
  const countries = {};
  for (const geo of Object.keys(index("geo"))) {
    if (AGGREGATES.has(geo)) continue;
    const r = row(geo);
    if (r.all !== null) countries[GEO_ISO[geo] ?? geo] = r;
  }
  const eu = row(EU);
  if (eu.all === null) throw new Error("Eurostat: no figure for the EU");
  return { year, countries, eu, updated: String(d.updated).slice(0, 10) };
}

/** One Census table as rows by GEO_ID. */
async function acsTable(table) {
  const lines = (await cached(`acs-${ACS_YEAR}-${table}.dat`, `${ACS_DIR}acsdt1y${ACS_YEAR}-${table}.dat`)).trim().split(/\r?\n/);
  const head = lines[0].split("|");
  const rows = new Map();
  for (const line of lines.slice(1)) {
    const cells = line.split("|");
    rows.set(cells[0], Object.fromEntries(head.map((k, i) => [k, cells[i]])));
  }
  return rows;
}

async function unitedStates() {
  const [minutes, means, times] = await Promise.all(ACS_TABLES.map(acsTable));
  const of = (geo, name, waysOptional = false) => {
    const m = minutes.get(geo);
    const w = means.get(geo);
    const t = times.get(geo);
    if (!m || !t || (!w && !waysOptional)) throw new Error(`ACS: ${name} (${geo}) is not in all three tables`);
    const num = (row, col) => {
      const v = Number(row[col]);
      if (!Number.isFinite(v) || v < 0) throw new Error(`ACS: ${name} ${col} is "${row[col]}"`);
      return v;
    };
    const travelled = num(t, "B08303_E001");
    const share = (n, total) => Number(((100 * n) / total).toFixed(1));
    const length = {
      place: name,
      minutes: Number((num(m, "B08013_E001") / travelled).toFixed(1)),
      // 60 to 89 minutes, and 90 or more.
      hourPlusPct: share(num(t, "B08303_E012") + num(t, "B08303_E013"), travelled),
    };
    // The Bureau gives the ways to work in full only for its larger places: without that table, the journey's length alone.
    if (!w) return { ...length, modes: [] };
    const workers = num(w, "B08301_E001");
    // The Bureau's two tables must describe the same workers: all of them, less those who worked from home.
    if (workers - num(w, "B08301_E021") !== travelled) throw new Error(`ACS: ${name}: the tables disagree on who travelled`);
    const modes = [
      ["Drove alone", num(w, "B08301_E003")],
      ["Carpooled", num(w, "B08301_E004")],
      ["Public transport", num(w, "B08301_E010")],
      ["Walked", num(w, "B08301_E019")],
      ["Cycled", num(w, "B08301_E018")],
      ["Taxi, motorcycle or other", num(w, "B08301_E016") + num(w, "B08301_E017") + num(w, "B08301_E020")],
      ["Worked from home", num(w, "B08301_E021")],
    ];
    if (modes.reduce((a, [, n]) => a + n, 0) !== workers) throw new Error(`ACS: ${name}: the ways of getting to work do not add up to the workers`);
    return { ...length, modes: modes.map(([label, n]) => [label, share(n, workers)]) };
  };
  const country = of(US, "United States");
  const cities = Object.fromEntries(Object.entries(US_PLACES).map(([id, [geo, name]]) => [id, of(geo, name)]));

  // The UN's cities in the United States, each as the Census place that bears its name near where the UN centres it.
  const named = new Map();
  const geoLines = (await cached(`acs-${ACS_YEAR}-geos.txt`, ACS_GEOS)).trim().split(/\r?\n/);
  const geoCol = geoLines[0].split("|");
  const [gLevel, gPart, gId, gName] = ["SUMLEVEL", "COMPONENT", "GEO_ID", "NAME"].map((h) => {
    const i = geoCol.indexOf(h);
    if (i < 0) throw new Error(`ACS: the list of geographies has no column ${h}`);
    return i;
  });
  for (const line of geoLines.slice(1)) {
    const c = line.split("|");
    if (c[gLevel] === "160" && c[gPart] === "00") named.set(c[gId], c[gName]);
  }
  const gaz = unzip(await cachedFile(`gaz-place-${GAZ_YEAR}.zip`, GAZ_URL));
  const gazText = [...gaz.entries()].find(([n]) => /Gaz_place_national\.txt$/.test(n));
  if (!gazText) throw new Error("Gazetteer: the list of places is not in the archive");
  const gazLines = gazText[1].toString("utf8").trim().split(/\r?\n/);
  const col = gazLines[0].split("\t").map((h) => h.trim());
  const [iGeo, iName, iLat, iLon] = ["GEOID", "NAME", "INTPTLAT", "INTPTLONG"].map((h) => {
    const i = col.indexOf(h);
    if (i < 0) throw new Error(`Gazetteer: no column ${h}`);
    return i;
  });
  // What kind of place it is follows its name: "New York city", "Urban Honolulu CDP", "Nashville-Davidson metropolitan government (balance)".
  const KIND = / (city and borough|consolidated government|metropolitan government|metro government|unified government|urban county|municipality|borough|village|city|town|CDP)$/;
  const places = [];
  for (const line of gazLines.slice(1)) {
    const c = line.split("\t").map((x) => x.trim());
    const geo = `1600000US${c[iGeo]}`;
    // Only a place the survey gives the journey's length for can be a city's.
    if (!minutes.has(geo) || !times.has(geo) || !named.has(geo)) continue;
    const base = c[iName].replace(/ \(balance\)$/, "").replace(KIND, "");
    // "Nashville-Davidson" is Nashville, "San Buenaventura (Ventura)" Ventura, "Urban Honolulu" Honolulu, "Boise City" Boise.
    const names = new Set([plain(base), ...base.split(/[-/()]/).map(plain), plain(base.replace(/^Urban /, "")), plain(base.replace(/ City$/, ""))].filter(Boolean));
    places.push({ geo, label: named.get(geo), names, at: [Number(c[iLat]), Number(c[iLon])] });
  }
  if (places.length < 500) throw new Error(`Gazetteer: only ${places.length} places of the survey were placed`);
  const un = {};
  const missed = [];
  for (const u of unCities().filter((u) => u[0] === "US" && u[3] !== null && u[4] !== null)) {
    // Its name as the UN writes it; then without what follows a comma ("Washington, D.C."); then without "City" ("New York City").
    const tries = unNames(u[2]);
    for (const part of u[2].split(/[()[\]/]/)) {
      const head = plain(part.split(",")[0]);
      if (head && !tries.includes(head)) tries.push(head);
    }
    for (const nm of [...tries]) if (/ city$/.test(nm) && !tries.includes(nm.replace(/ city$/, ""))) tries.push(nm.replace(/ city$/, ""));
    let got = null;
    let why = "no Census place of its name";
    for (const nm of tries) {
      const near = places.filter((p) => p.names.has(nm) && km(p.at, [u[3], u[4]]) <= US_REACH_KM);
      if (near.length === 1) {
        got = near[0];
        break;
      }
      if (near.length > 1) why = `${near.length} Census places of its name within ${US_REACH_KM} km`;
    }
    if (got) un[`un-US-${u[1]}`] = { ...of(got.geo, got.label, true), km: Math.round(km(got.at, [u[3], u[4]])) };
    else missed.push(`${u[2]}: ${why}`);
  }
  // No place may answer for two cities.
  const seen = new Map();
  for (const [id, c] of Object.entries(un)) {
    if (seen.has(c.place)) throw new Error(`ACS: ${c.place} answers for two cities, ${seen.get(c.place)} and ${id}`);
    seen.set(c.place, id);
  }
  return { country, cities, un, missed };
}

/** Eurostat's city statistics: the journey to work in a city of Europe, for the UN's city of the same name. */
async function europeCities() {
  const d = JSON.parse(await cached("urb_ctran.json", CITY_URL));
  if (d.id.join() !== "freq,indic_ur,cities,time") throw new Error(`${CITY_TABLE}: its dimensions are ${d.id.join()}`);
  const index = (k) => d.dimension[k].category.index;
  const label = d.dimension.cities.category.label;
  const years = Object.keys(index("time")).map(Number).filter((y) => y >= CITY_FROM).sort((a, b) => b - a);
  const cell = (ind, city, year) => {
    if (!(ind in index("indic_ur"))) throw new Error(`${CITY_TABLE}: no indicator ${ind}`);
    const p = (index("indic_ur")[ind] * d.size[2] + index("cities")[city]) * d.size[3] + index("time")[String(year)];
    const v = d.value[p];
    const flag = (d.status && d.status[p]) || "";
    // Low reliability, confidential, or a definition that differs: not taken.
    if (typeof v !== "number" || /[ucd]/i.test(flag)) return null;
    return { v, est: /e/.test(flag) };
  };
  const found = {};
  for (const code of Object.keys(index("cities"))) {
    if (!/^[A-Z]{2}\d{3}C$/.test(code)) continue;
    const row = { code, cc: GEO_ISO[code.slice(0, 2)] ?? code.slice(0, 2), place: label[code] };
    for (const y of years) {
      const m = cell(CITY_MINUTES, code, y);
      if (m && m.v > 0) {
        row.minutes = { v: Number(m.v.toFixed(1)), y, ...(m.est ? { est: true } : {}) };
        break;
      }
    }
    for (const y of years) {
      const got = CITY_WAYS.map(([way, ind, needed]) => [way, cell(ind, code, y), needed]);
      if (got.some(([, c, needed]) => needed && !c)) continue;
      const parts = got.filter(([, c]) => c).map(([way, c]) => [way, Number(c.v.toFixed(1))]);
      const sum = parts.reduce((a, [, v]) => a + v, 0);
      // Shares of the journeys to work: each within the whole, and together about the whole.
      if (parts.some(([, v]) => v < 0 || v > 100) || sum < 90 || sum > 100.5) continue;
      const rest = Number((100 - sum).toFixed(1));
      row.modes = { y, ...(got.some(([, c]) => c && c.est) ? { est: true } : {}), parts: parts.filter(([, v]) => v > 0), ...(rest >= 0.5 ? { rest } : {}) };
      break;
    }
    if (row.minutes || row.modes) (found[row.cc] ??= []).push(row);
  }
  const uns = unCities();
  const out = {};
  const missed = [];
  for (const [cc, rows] of Object.entries(found)) {
    const english = CITY_ENGLISH[cc] ?? {};
    const mine = uns.filter((u) => u[0] === cc);
    const namesOf = (r) =>
      r.place
        .replace(/\s*\(greater city\)\s*$/i, "")
        // "Palmas de Gran Canaria, Las" is Las Palmas de Gran Canaria.
        .replace(/^(.+), (El|La|Las|Los|Le|Les)$/, "$2 $1")
        // "Elche/Elx" is one city under two names; "North Lanarkshire (Airdrie/Bellshill/Coatbridge/Motherwell)" is a district, and none of its towns.
        .split(/\/(?![^(]*\))/)
        .map(plain)
        .filter(Boolean)
        .flatMap((nm) => (english[nm] ? [nm, english[nm]] : [nm]));
    for (const r of rows) {
      const names = namesOf(r);
      const hits = mine.filter((u) => unNames(u[2]).some((nm) => names.includes(nm)));
      // One city each way: the UN's only city of the name, and Eurostat's only city of the name.
      const rivals = hits.length === 1 ? rows.filter((o) => namesOf(o).some((nm) => unNames(hits[0][2]).includes(nm))) : [];
      if (hits.length === 1 && rivals.length === 1) {
        const id = `un-${cc}-${hits[0][1]}`;
        if (out[id]) throw new Error(`${CITY_TABLE}: two cities answer for ${id}`);
        out[id] = { place: r.place, code: r.code, ...(r.minutes ? { minutes: r.minutes } : {}), ...(r.modes ? { modes: r.modes } : {}) };
      } else missed.push(`${cc} ${r.place}${hits.length > 1 ? ` (${hits.length} of the UN's cities)` : rivals.length > 1 ? " (two of Eurostat's cities)" : ""}`);
    }
  }
  return { cities: out, missed, updated: String(d.updated).slice(0, 10) };
}

(async () => {
  const eur = await europe();
  const usa = await unitedStates();
  const eurCities = await europeCities();
  if (REPORT) {
    console.log(`United States, not matched (${usa.missed.length}):\n  ${usa.missed.join("\n  ")}`);
    console.log(`Europe, not matched (${eurCities.missed.length}):\n  ${eurCities.missed.join("\n  ")}`);
    console.log(Object.entries(usa.un).map(([id, c]) => `${id} ${c.place} ${c.km} km`).join("\n"));
    console.log(Object.entries(eurCities.cities).map(([id, c]) => `${id} ${c.code} ${c.place} ${JSON.stringify(c.minutes ?? null)} ${JSON.stringify(c.modes ?? null)}`).join("\n"));
  }
  const today = new Date().toISOString().slice(0, 10);
  const opt = (k, v) => (v === null ? "" : `, ${k}: ${v}`);
  const europeBody = Object.keys(eur.countries)
    .sort()
    .map((code) => {
      const r = eur.countries[code];
      return `  ${code}: { all: ${r.all}${opt("cities", r.cities)}${opt("towns", r.towns)}${opt("rural", r.rural)} },`;
    })
    .join("\n");
  const us = (c) => `{ place: ${JSON.stringify(c.place)}, minutes: ${c.minutes}, hourPlusPct: ${c.hourPlusPct}, modes: ${JSON.stringify(c.modes)} }`;

  fs.writeFileSync(
    OUT,
    `/**
 * The journey to work: how long it takes, and how people make it.
 *
 * GENERATED by build-commute.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * Two official series, each for the places it covers, and nothing for the
 * rest - no body publishes the journey to work for every country on one
 * footing. They are not the same measure and are not ranked against each
 * other: Eurostat's is the mean one-way journey of employed people aged 15 to
 * 74 who travel at least a minute, from the Labour Force Survey's ${eur.year} module;
 * the Census Bureau's is of workers 16 and over who did not work from home,
 * from the American Community Survey ${ACS_YEAR}. The Bureau's mean is its own
 * calculation - aggregate minutes over the workers who travelled - and each
 * share is a count over its table's total.
 */
export const COMMUTE_SOURCES = {
  eurostat: {
    label: "Eurostat — commuting time of employed persons, Labour Force Survey ${eur.year} module (${EUROSTAT_TABLE})",
    url: "https://ec.europa.eu/eurostat/databrowser/view/${EUROSTAT_TABLE}/default/table",
    year: "${eur.year}",
    updated: "${eur.updated}",
  },
  acs: {
    label: "US Census Bureau — American Community Survey ${ACS_YEAR}, 1-year: travel time and means of transportation to work (B08013, B08301, B08303)",
    url: "https://data.census.gov/table/ACSDT1Y${ACS_YEAR}.B08301",
    year: "${ACS_YEAR}",
  },
  cities: {
    label: "Eurostat — city statistics: transport, the journey to work by city (${CITY_TABLE})",
    url: "https://ec.europa.eu/eurostat/databrowser/view/${CITY_TABLE}/default/table",
    updated: "${eurCities.updated}",
  },
  gazetteer: {
    label: "US Census Bureau — Gazetteer files ${GAZ_YEAR}: places, with each one's internal point",
    url: "https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html",
  },
  retrieved: "${today}",
};

/** Mean minutes, one way: for the country, and for the people living in its cities, its towns and suburbs, and its rural areas. */
export type EuropeCommute = { all: number; cities?: number; towns?: number; rural?: number };

/** The European Union's 27 members together, to read a country against. */
export const COMMUTE_EU: EuropeCommute = { all: ${eur.eu.all}${opt("cities", eur.eu.cities)}${opt("towns", eur.eu.towns)}${opt("rural", eur.eu.rural)} };

/** By ISO code: ${Object.keys(eur.countries).length} countries of the Labour Force Survey. */
export const COMMUTE_EUROPE: Record<string, EuropeCommute> = {
${europeBody}
};

/** Mean minutes one way, the share of journeys of an hour or more, and each way of getting to work as a share of all workers - none where the Bureau does not give the ways for the place. */
export type UsCommute = { place: string; minutes: number; hourPlusPct: number; modes: [way: string, pct: number][] };

export const COMMUTE_US: UsCommute = ${us(usa.country)};

/**
 * A city of the UN's list, by its id there ("un-US-8354").
 *
 * In the United States it is the Census place of 65,000 people or more that bears the city's name and whose internal
 * point lies within ${US_REACH_KM} km of the UN's centre for it - the city within its own boundary, which is smaller than the
 * built-up area the UN counts. In Europe it is the city of the same name in Eurostat's city statistics: the average
 * journey and the shares of journeys by each way, each of its latest year from ${CITY_FROM} on. "est" marks a figure Eurostat
 * gives as an estimate; "rest" is what the shares leave of the whole, worked out here.
 */
export type CityCommute =
  | ({ from: "acs" } & UsCommute)
  | { from: "eurostat"; place: string; minutes?: { v: number; y: number; est?: true }; modes?: { y: number; est?: true; parts: [way: string, pct: number][]; rest?: number } };

export const COMMUTE_UN_CITIES: Record<string, CityCommute> = {
${Object.entries(usa.un)
  .map(([id, c]) => `  "${id}": { from: "acs", place: ${JSON.stringify(c.place)}, minutes: ${c.minutes}, hourPlusPct: ${c.hourPlusPct}, modes: ${JSON.stringify(c.modes)} },`)
  .join("\n")}
${Object.entries(eurCities.cities)
  .map(([id, c]) => `  "${id}": { from: "eurostat", place: ${JSON.stringify(c.place)}${c.minutes ? `, minutes: ${JSON.stringify(c.minutes)}` : ""}${c.modes ? `, modes: ${JSON.stringify(c.modes)}` : ""} },`)
  .join("\n")}
};

/** By the Cities page's id: the city within its own boundary, as the Census place of its name. */
export const COMMUTE_US_CITIES: Record<string, UsCommute> = {
${Object.entries(usa.cities)
  .map(([id, c]) => `  ${id}: ${us(c)},`)
  .join("\n")}
};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  cities of the UN's list: ${Object.keys(usa.un).length} in the United States (${usa.missed.length} not matched), ${Object.keys(eurCities.cities).length} in Europe (${eurCities.missed.length} of Eurostat's not matched)`);
  console.log(`  Eurostat ${eur.year}: ${Object.keys(eur.countries).length} countries; EU ${eur.eu.all} min, in cities ${eur.eu.cities}`);
  console.log(`  ACS ${ACS_YEAR}: United States ${usa.country.minutes} min; ${Object.values(usa.cities).map((c) => `${c.place} ${c.minutes}`).join("; ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
