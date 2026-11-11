#!/usr/bin/env node
/**
 * Builds the Polls & Elections page's history, as asked: each country's national elections, their results where a record
 * gives them, its changes of government, and its political regime year by year - static/elections/history/<CC>.json, one
 * file a country, and src/data/electionHistory.ts, the list of countries and what each holds.
 *
 *   Elections   Wikidata (CC0), read through QLever (the University of Freiburg's SPARQL engine over Wikidata's own data):
 *               every election of a national kind - general, presidential, legislative, a referendum - in the country,
 *               dated to the day, that is not a part of another (a first round, one state's share of a federal vote),
 *               applies to no smaller place than the country, and is not a by-election, a primary or a recall. Each with its own Wikidata record, its winners where the
 *               record names them, and whether its date cites a source.
 *   Results     ParlGov (Döring and Manow, Release 2024, Harvard Dataverse; CC0): every party's share of the vote and
 *   and         seats at each parliamentary election in 37 European and OECD democracies, and each cabinet - its name,
 *   cabinets    the day it took office, its parties, the prime minister's party, and whether it was a caretaker. A
 *               ParlGov election is set beside Wikidata's of the same day; one Wikidata does not hold is given alone.
 *   Regimes     V-Dem's Regimes of the World (Lührmann, Tannenberg and Lindberg, 2018), as Our World in Data publishes it
 *               (V-Dem 2026, CC BY-SA; Our World in Data's processing CC BY): the country's type each year since 1789,
 *               as runs of years. A change is a year whose type is not the year before's.
 *
 * Nothing is estimated or worked out but runs of V-Dem's own years. Changes of head of state and government worldwide,
 * kept where the records agree, are a later step; ParlGov's cabinets stand for them where it has them.
 *
 *   node build-election-history.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { syncClock, nowIso } = require("./build-clock.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const OUT_DIR = path.join(__dirname, "static/elections/history");
const META = path.join(__dirname, "src/data/electionHistory.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-election-history");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

async function cached(name, url, hours = 20, init) {
  const file = path.join(CACHE, name);
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < hours * 3600e3) return fs.readFileSync(file, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA, ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`${url.slice(0, 120)}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(file, text);
  return text;
}

/* The site's countries, by their codes and names. */
const SITE = new Map();
{
  const src = fs.readFileSync(path.join(__dirname, "src/data/countriesData.ts"), "utf8");
  for (const m of src.matchAll(/name:\s*"([^"]+)",[^}]*?\bcode:\s*"([A-Z]{2})"/gs)) SITE.set(m[2], m[1]);
}

const KINDS = { Q858439: "Presidential", Q15283424: "Legislative", Q1076105: "General", Q43109: "Referendum" };
const PREFIX = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;
/** A query to QLever, sent in the body as its API asks of long ones, and kept for a day. */
async function qlever(name, query) {
  const file = path.join(CACHE, name);
  if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3)) {
    // Asked again after a pause where QLever says it has had too many requests: a minute, then two, then three, five times at most.
    for (let tries = 1; ; tries++) {
      const res = await fetch("https://qlever.cs.uni-freiburg.de/api/wikidata", {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
        body: `query=${encodeURIComponent(PREFIX + query)}`,
      });
      if (res.status === 429 && tries < 5) {
        console.log(`QLever: too many requests - asking again in ${tries} min`);
        await new Promise((r) => setTimeout(r, tries * 60e3));
        continue;
      }
      if (!res.ok) throw new Error(`QLever: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      fs.writeFileSync(file, await res.text());
      break;
    }
  }
  return JSON.parse(fs.readFileSync(file, "utf8")).results.bindings;
}

(async () => {
  await syncClock();
  const today = nowIso().slice(0, 10);

  /* ── Wikidata's national elections ── */
  const rows = await qlever(
    "elections.json",
    `SELECT ?e ?name ?date ?cc ?country ?base ?jur ?parent ?winner ?cited WHERE {
  VALUES ?base { ${Object.keys(KINDS).map((q) => `wd:${q}`).join(" ")} }
  ?type wdt:P279* ?base .
  ?e wdt:P31 ?type ; wdt:P17 ?country .
  ?country wdt:P297 ?cc .
  ?e p:P585 ?st . ?st psv:P585 ?dv . ?dv wikibase:timeValue ?date ; wikibase:timePrecision 11 .
  ?e rdfs:label ?name . FILTER(LANG(?name) = "en")
  OPTIONAL { ?e wdt:P1001 ?jur }
  OPTIONAL { ?e wdt:P361 ?parent }
  OPTIONAL { ?e wdt:P991 ?w . ?w rdfs:label ?winner . FILTER(LANG(?winner) = "en") }
  OPTIONAL { ?st prov:wasDerivedFrom ?cited }
}`,
  );
  const els = new Map();
  for (const b of rows) {
    const id = b.e.value.split("/").pop();
    const e = els.get(id) ?? { id, name: b.name.value, date: b.date.value.slice(0, 10), cc: b.cc.value, country: b.country.value, kinds: new Set(), jurs: new Set(), parents: new Set(), winners: new Set(), cited: false };
    e.kinds.add(KINDS[b.base.value.split("/").pop()]);
    if (b.jur) e.jurs.add(b.jur.value);
    if (b.parent) e.parents.add(b.parent.value.split("/").pop());
    if (b.winner) e.winners.add(b.winner.value);
    if (b.cited) e.cited = true;
    els.set(id, e);
  }
  // National: applying to no place but the country, and no part of another election held.
  // By-elections, primaries and recalls are not a national vote, though Wikidata files some under the national kinds.
  const NOT_NATIONAL = /by-?election|bye-election|primar(y|ies)|recall|caucus|leadership/i;
  const national = [...els.values()].filter((e) => [...e.jurs].every((j) => j === e.country) && ![...e.parents].some((p) => els.has(p)) && SITE.has(e.cc) && !NOT_NATIONAL.test(e.name));
  const kindOf = (e) => (e.kinds.has("Presidential") ? (e.kinds.has("Legislative") || e.kinds.has("General") ? "General" : "Presidential") : e.kinds.has("Legislative") ? "Legislative" : e.kinds.has("Referendum") ? "Referendum" : "General");

  /* ── ParlGov ── */
  const wbCountries = JSON.parse(await cached("wb-countries.json", "https://api.worldbank.org/v2/country?format=json&per_page=400", 24 * 30))[1];
  const iso2 = new Map(wbCountries.map((c) => [c.id, c.iso2Code]));
  const tab = (text) => {
    const [head, ...lines] = text.trim().split(/\r?\n/);
    const cols = head.split("\t");
    return lines.map((l) => Object.fromEntries(l.split("\t").map((v, i) => [cols[i], v.replace(/^"|"$/g, "")])));
  };
  const pgElections = tab(await cached("parlgov-election.tab", "https://dataverse.harvard.edu/api/access/datafile/10437092", 24 * 30));
  const pgCabinets = tab(await cached("parlgov-cabinet.tab", "https://dataverse.harvard.edu/api/access/datafile/10437088", 24 * 30));
  const pgByCountry = new Map();
  for (const r of pgElections) {
    if (r.election_type !== "parliament") continue;
    const cc = iso2.get(r.country_name_short);
    if (!cc) continue;
    const at = pgByCountry.get(cc) ?? new Map();
    const el = at.get(r.election_id) ?? { date: r.election_date, seats: Number(r.seats_total) || undefined, parties: [] };
    const vote = r.vote_share === "" ? undefined : Number(r.vote_share);
    const seats = r.seats === "" ? undefined : Number(r.seats);
    el.parties.push([r.party_name_english || r.party_name, Number.isFinite(vote) ? vote : null, Number.isFinite(seats) ? seats : null]);
    at.set(r.election_id, el);
    pgByCountry.set(cc, at);
  }
  const cabByCountry = new Map();
  for (const r of pgCabinets) {
    const cc = iso2.get(r.country_name_short);
    if (!cc) continue;
    const at = cabByCountry.get(cc) ?? new Map();
    const cab = at.get(r.cabinet_id) ?? { start: r.start_date, name: r.cabinet_name, caretaker: r.caretaker === "1", parties: [], pmParty: null };
    if (r.cabinet_party === "1") cab.parties.push(r.party_name_english || r.party_name);
    if (r.prime_minister === "1") cab.pmParty = r.party_name_english || r.party_name;
    at.set(r.cabinet_id, cab);
    cabByCountry.set(cc, at);
  }

  /* ── V-Dem's regimes, year by year ── */
  const csv = await cached("political-regime.csv", "https://ourworldindata.org/grapher/political-regime.csv?v=1&csvType=full&useColumnShortNames=true", 24 * 7);
  const [head, ...lines] = csv.trim().split(/\r?\n/);
  if (!/code,year,regime_row_owid$/.test(head)) throw new Error(`Our World in Data's columns: ${head}`);
  const TYPES = ["Closed autocracy", "Electoral autocracy", "Electoral democracy", "Liberal democracy"];
  const years = new Map();
  iso2.set("OWID_KOS", "XK");
  iso2.set("TWN", "TW");
  for (const line of lines) {
    const f = line.split(",");
    const cc = iso2.get(f[f.length - 3]);
    const y = +f[f.length - 2];
    const v = f[f.length - 1];
    if (!cc || !SITE.has(cc) || v === "") continue;
    // Our World in Data writes each type by its name now ("Closed autocracy"), where it wrote 0 to 3: either is read, and anything else stops the build.
    const r = /^[0-3]$/.test(v) ? +v : TYPES.indexOf(v);
    if (r < 0) throw new Error(`V-Dem type not known: ${f.join(",")}`);
    (years.get(cc) ?? years.set(cc, []).get(cc)).push([y, r]);
  }
  const runs = (ys) => {
    const out = [];
    for (const [y, v] of ys.sort((a, b) => a[0] - b[0])) {
      const last = out[out.length - 1];
      if (last && last[2] === v && last[1] === y - 1) last[1] = y;
      else out.push([y, y, v]);
    }
    return out;
  };

  /* ── One file a country ── */
  const index = [];
  for (const [cc, name] of [...SITE].sort((a, b) => a[1].localeCompare(b[1]))) {
    const own = national.filter((e) => e.cc === cc).sort((a, b) => a.date.localeCompare(b.date));
    const pg = [...(pgByCountry.get(cc)?.values() ?? [])];
    const used = new Set();
    const elections = own.map((e) => {
      const match = pg.find((p) => p.date === e.date && (e.kinds.has("Legislative") || e.kinds.has("General")));
      if (match) used.add(match);
      return {
        id: e.id,
        date: e.date,
        name: e.name,
        kind: kindOf(e),
        ...(e.winners.size ? { winners: [...e.winners].sort() } : {}),
        ...(e.cited ? { cited: true } : {}),
        ...(match ? { results: { seats: match.seats, parties: match.parties.sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1)) } } : {}),
      };
    });
    for (const p of pg)
      if (!used.has(p))
        elections.push({ date: p.date, name: `Parliamentary election, ${p.date.slice(0, 4)}`, kind: "Legislative", parlgovOnly: true, results: { seats: p.seats, parties: p.parties.sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1)) } });
    elections.sort((a, b) => a.date.localeCompare(b.date));
    const cabinets = [...(cabByCountry.get(cc)?.values() ?? [])].sort((a, b) => a.start.localeCompare(b.start));
    const regimes = years.has(cc) ? runs(years.get(cc)) : [];
    if (!elections.length && !regimes.length && !cabinets.length) continue;
    fs.writeFileSync(path.join(OUT_DIR, `${cc}.json`), JSON.stringify({ cc, elections, cabinets, regimes }));
    index.push([cc, elections.filter((e) => e.date <= today).length, elections.filter((e) => e.date > today).length, cabinets.length, regimes.length ? regimes[0][0] : null, regimes.length ? regimes[regimes.length - 1][1] : null]);
  }

  const ts = `/**
 * The Polls & Elections page's countries: what each one's history holds - static/elections/history/<CC>.json.
 *
 * GENERATED by build-election-history.cjs on ${today} — do not edit by hand; change the script and re-run it.
 *
 * Elections are Wikidata's (CC0), read through QLever: every national general, presidential and legislative election and
 * referendum dated to the day; results and cabinets are ParlGov's (Release 2024, CC0) for 37 European and OECD
 * democracies; regimes are V-Dem's Regimes of the World, each year since 1789, via Our World in Data.
 */
export const ELECTION_HISTORY_RETRIEVED = "${today}";
export const ELECTION_HISTORY_SOURCES = {
  wikidata: { label: "Wikidata (CC0) — each national election's own record, read through QLever (University of Freiburg)", url: "https://www.wikidata.org/" },
  parlgov: { label: "ParlGov — Döring & Manow, Parliaments and governments database, Release 2024 (Harvard Dataverse, CC0)", url: "https://doi.org/10.7910/DVN/2VZ5ZC" },
  vdem: { label: "V-Dem — Regimes of the World (Lührmann, Tannenberg & Lindberg), via Our World in Data (CC BY-SA)", url: "https://ourworldindata.org/grapher/political-regime" },
};
/** [code, elections held, elections to come, cabinets, first and last year of V-Dem's regimes]. */
export const ELECTION_HISTORY_INDEX: [cc: string, held: number, coming: number, cabinets: number, from: number | null, to: number | null][] = ${JSON.stringify(index)};
`;
  fs.writeFileSync(META, ts);
  const tot = index.reduce((s, r) => s + r[1] + r[2], 0);
  console.log(`wrote ${index.length} countries: ${tot} elections (${national.length} national from Wikidata of ${els.size} read), ${index.reduce((s, r) => s + r[3], 0)} cabinets, regimes for ${index.filter((r) => r[4]).length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
