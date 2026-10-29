/**
 * The News page's events over the years, by continent: what its tracker shows for now, as far back as the bodies that
 * record it publish it.
 *
 *   Deaths in armed conflict   UCDP, via Our World in Data (CC BY 4.0): each country's deaths in fighting involving
 *                              states, between other groups and against civilians, a year at a time from 1989, added
 *                              up here by the continent the country is in.
 *   Disaster alerts            GDACS - the European Commission's Joint Research Centre and the United Nations (CC BY
 *                              4.0): its orange and red alerts a year at a time from 2015, each counted once in each
 *                              continent it touched.
 *
 * Civil unrest, coups, terrorism and epidemics have no yearly record from a body whose terms let a commercial site use
 * it - the travel advisories and health notices the tracker reads are of today only - so none is built for them, and
 * the page says so. Nothing is estimated: a country or an alert with no continent the site knows is counted out and
 * printed.
 *
 *   node build-news-history.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/newsHistory.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-news-history");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const THIS_YEAR = new Date().getFullYear();
const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"];
const DISASTERS_FROM = 2015;

function get(url, name) {
  const at = path.join(CACHE, name);
  // GDACS can take a minute and more to answer for a year: given five minutes, and a second try.
  for (let i = 0; !fs.existsSync(at) || Date.now() - fs.statSync(at).mtimeMs > 24 * 3600e3; i++) {
    try {
      execFileSync("curl", ["-sL", "--fail", "--max-time", "300", "-A", UA, "-o", at, url], { stdio: "ignore" });
    } catch (e) {
      if (i >= 1) throw e;
    }
  }
  return fs.readFileSync(at, "utf8");
}

/* Each country's continent, as the site has it (countriesData.ts), by its ISO code. */
const continentOf = new Map();
{
  const src = fs.readFileSync(path.join(__dirname, "src/data/countriesData.ts"), "utf8");
  for (const m of src.matchAll(/\bcode:\s*"([A-Z]{2})"[^}]*?\bcontinent:\s*"([^"]+)"/gs)) if (CONTINENTS.includes(m[2])) continentOf.set(m[1], m[2]);
  if (continentOf.size < 190) throw new Error(`only ${continentOf.size} countries' continents were read`);
}
const missed = new Set();

/* ── UCDP via Our World in Data ── */
function conflict() {
  const wb = JSON.parse(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
  const iso2Of = {};
  for (const c of wb) if (c.region && c.region.id !== "NA" && /^[A-Z]{2}$/.test(c.iso2Code)) iso2Of[c.id] = c.iso2Code;
  const csv = get("https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type.csv?v=1&csvType=full&useColumnShortNames=true", "ucdp.csv");
  const [head, ...lines] = csv.trim().split("\n");
  const cols = head.split(",");
  const k = "number_deaths_ongoing_conflicts__conflict_type_";
  const kinds = ["one_sided_violence", "non_state_conflict", "intrastate", "interstate", "extrasystemic"];
  for (const c of kinds) if (!cols.includes(k + c)) throw new Error(`UCDP: no "${c}" column`);
  const by = {};
  let last = 0;
  for (const l of lines) {
    const f = l.startsWith('"') ? [l.slice(1, l.indexOf('",')), ...l.slice(l.indexOf('",') + 2).split(",")] : l.split(",");
    const r = Object.fromEntries(cols.map((c, i) => [c, f[i]]));
    const iso2 = iso2Of[r.code];
    if (!iso2) continue;
    const cont = continentOf.get(iso2);
    if (!cont) {
      missed.add(`UCDP: ${r.entity}`);
      continue;
    }
    const y = +r.year;
    const deaths = kinds.reduce((s, c) => s + Math.round(+r[k + c] || 0), 0);
    ((by[y] ||= {})[cont] ||= 0), (by[y][cont] += deaths);
    last = Math.max(last, y);
  }
  const years = Object.keys(by).map(Number).filter((y) => y >= 1989).sort((a, b) => a - b);
  if (years.length < 30) throw new Error(`UCDP: only ${years.length} years`);
  return { years, byContinent: Object.fromEntries(CONTINENTS.map((c) => [c, years.map((y) => by[y][c] ?? 0)])) };
}

/* ── GDACS ── */
function disasters() {
  const years = [];
  for (let y = DISASTERS_FROM; y < THIS_YEAR; y++) years.push(y);
  const by = Object.fromEntries(CONTINENTS.map((c) => [c, years.map(() => 0)]));
  years.forEach((y, yi) => {
    const seen = new Set();
    for (let page = 1; page < 40; page++) {
      const d = JSON.parse(get(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=orange;red&fromDate=${y}-01-01&toDate=${y}-12-31&pageSize=100&pageNumber=${page}`, `gdacs-${y}-${page}.json`));
      const list = Array.isArray(d.features) ? d.features : [];
      let fresh = 0;
      for (const f of list) {
        const p = f.properties;
        const id = `${p.eventtype}-${p.eventid}`;
        if (seen.has(id) || !/^(Orange|Red)$/.test(p.alertlevel) || String(p.fromdate).slice(0, 4) !== String(y)) continue;
        seen.add(id);
        fresh++;
        const touched = new Set();
        for (const c of p.affectedcountries ?? []) {
          const cont = continentOf.get(c.iso2);
          if (cont) touched.add(cont);
          else if (c.countryname) missed.add(`GDACS: ${c.countryname}`);
        }
        for (const cont of touched) by[cont][yi]++;
      }
      if (list.length < 100 || !fresh) break;
    }
    if (!seen.size) throw new Error(`GDACS: no alerts read for ${y}`);
  });
  return { years, byContinent: by };
}

const C = conflict();
const D = disasters();
const J = (x) => JSON.stringify(x);
fs.writeFileSync(
  OUT,
  `/**
 * The News page's events over the years, by continent: deaths in armed conflict a year (UCDP) and orange and red
 * disaster alerts a year (GDACS).
 *
 * GENERATED by build-news-history.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 *
 * Deaths are each country's in fighting involving states, between other groups and against civilians, UCDP's best
 * estimates, added up here by the continent the country is in. Alerts are GDACS's orange and red, each counted once in
 * each continent it touched; GDACS has added hazards over the years, so a later year can count kinds an earlier one did
 * not. Civil unrest, coups, terrorism and epidemics have no yearly record from a body a commercial site may use.
 */
export const NEWS_HISTORY_RETRIEVED = "${TODAY}";
export const NEWS_HISTORY_SOURCES = {
  ucdp: { label: "Uppsala Conflict Data Program (via Our World in Data, CC BY 4.0)", url: "https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type" },
  gdacs: { label: "Global Disaster Alert and Coordination System — European Commission Joint Research Centre and the United Nations (CC BY 4.0)", url: "https://www.gdacs.org/" },
};
/** Deaths in armed conflict each year, by continent: years, and a figure for each year in each continent. */
export const CONFLICT_HISTORY: { years: number[]; byContinent: Record<string, number[]> } = ${J(C)};
/** Orange and red disaster alerts each year, by continent: each alert counted once in each continent it touched. */
export const DISASTER_HISTORY: { years: number[]; byContinent: Record<string, number[]> } = ${J(D)};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: conflict ${C.years[0]}-${C.years[C.years.length - 1]}, disasters ${D.years[0]}-${D.years[D.years.length - 1]}`);
console.log("  conflict last year", J(Object.fromEntries(Object.entries(C.byContinent).map(([k, v]) => [k, v[v.length - 1]]))));
console.log("  disasters by year (world-touching sum)", J(D.years.map((y, i) => [y, CONTINENTS.reduce((s, c) => s + D.byContinent[c][i], 0)])));
if (missed.size) console.log("  counted out:", [...missed].slice(0, 20).join("; "));
