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
 *   Leaders     Wikidata's heads of state (P35) and of government (P6), each term kept only where two records of it agree:
 *               the country's own statement naming the person, and the person's own "position held" (P39) of the
 *               country's office (P1906, P1313) - the same person, starting the same year. A day is given where both give
 *               the same day, else the year; an end only where both give one and they agree. A term neither record ends
 *               is said to be current only where the site's checked list of heads (data/representatives.ts, three records)
 *               names the same person; otherwise its end is "not recorded".
 *
 * Nothing is estimated or worked out but runs of V-Dem's own years.
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
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX pqv: <http://www.wikidata.org/prop/qualifier/value/>
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

  /* ── Heads of state and of government, where the country's record and the person's agree ── */
  const leaderRows = await qlever(
    "leaders.json",
    `SELECT ?cc ?role ?person ?name ?start ?startPrec ?end ?pstart ?pstartPrec ?pend WHERE {
  ?country wdt:P297 ?cc .
  { ?country p:P35 ?st . ?st ps:P35 ?person . ?country wdt:P1906 ?office . BIND("state" AS ?role) }
  UNION
  { ?country p:P6 ?st . ?st ps:P6 ?person . ?country wdt:P1313 ?office . BIND("government" AS ?role) }
  ?st pqv:P580 ?sv . ?sv wikibase:timeValue ?start ; wikibase:timePrecision ?startPrec .
  OPTIONAL { ?st pq:P582 ?end }
  ?person p:P39 ?ps . ?ps ps:P39 ?office . ?ps pqv:P580 ?psv . ?psv wikibase:timeValue ?pstart ; wikibase:timePrecision ?pstartPrec .
  OPTIONAL { ?ps pq:P582 ?pend }
  ?person rdfs:label ?name . FILTER(LANG(?name) = "en")
}`,
  );
  // The site's checked heads now (three records): a term no record ends is current only where its person is among them.
  const fold = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const nowHeads = new Map();
  {
    const src = fs.readFileSync(path.join(__dirname, "src/data/representatives.ts"), "utf8");
    const body = src.slice(src.indexOf("export const NATIONAL_HEADS"));
    for (const m of body.matchAll(/\["([A-Z]{2})","[^"]*",[-\d.]+,[-\d.]+,(\[\[.*?\]\])\]/g)) {
      const heads = JSON.parse(m[2]);
      nowHeads.set(m[1], heads.map((h) => fold(String(h[1]).split(" – ").pop()).split(" ").filter((w) => w.length > 1)));
    }
  }
  /* The same person where every word of the site's name for them (initials aside) is in Wikidata's, or every word of Wikidata's in the site's. */
  const isNow = (cc, name) => {
    const words = fold(name).split(" ").filter((w) => w.length > 1);
    return (nowHeads.get(cc) ?? []).some((h) => h.length > 1 && (h.every((w) => words.includes(w)) || words.every((w) => h.includes(w))));
  };
  const leadersByCountry = new Map();
  const y = (d) => d.slice(0, 4);
  for (const b of leaderRows) {
    const cc = b.cc.value;
    if (!SITE.has(cc)) continue;
    const s = b.start.value;
    const ps = b.pstart.value;
    if (y(s) !== y(ps) || +b.startPrec.value < 9 || +b.pstartPrec.value < 9) continue;
    const day = +b.startPrec.value >= 11 && +b.pstartPrec.value >= 11 && s.slice(0, 10) === ps.slice(0, 10);
    const e = b.end?.value;
    const pe = b.pend?.value;
    const to = e && pe && y(e) === y(pe) ? (e.slice(0, 10) === pe.slice(0, 10) ? e.slice(0, 10) : y(e)) : undefined;
    const open = !e && !pe;
    const id = b.person.value.split("/").pop();
    const list = leadersByCountry.get(cc) ?? [];
    const key = `${b.role.value}|${id}|${y(s)}`;
    if (list.some((l) => l.key === key)) continue;
    list.push({
      key,
      role: b.role.value,
      name: b.name.value,
      id,
      from: day ? s.slice(0, 10) : y(s),
      ...(to ? { to } : {}),
      ...(open && isNow(cc, b.name.value) ? { now: true } : {}),
      ...(!to && !(open && isNow(cc, b.name.value)) ? { end: open ? "not recorded" : "the records differ" } : {}),
    });
    leadersByCountry.set(cc, list);
  }

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
    const leaders = (leadersByCountry.get(cc) ?? []).map(({ key, ...l }) => l).sort((a, b) => a.from.localeCompare(b.from) || a.role.localeCompare(b.role));
    if (!elections.length && !regimes.length && !cabinets.length && !leaders.length) continue;
    fs.writeFileSync(path.join(OUT_DIR, `${cc}.json`), JSON.stringify({ cc, elections, cabinets, regimes, leaders }));
    index.push([cc, elections.filter((e) => e.date <= today).length, elections.filter((e) => e.date > today).length, cabinets.length, regimes.length ? regimes[0][0] : null, regimes.length ? regimes[regimes.length - 1][1] : null, leaders.length]);
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
/** [code, elections held, elections to come, cabinets, first and last year of V-Dem's regimes, leaders' terms]. */
export const ELECTION_HISTORY_INDEX: [cc: string, held: number, coming: number, cabinets: number, from: number | null, to: number | null, leaders: number][] = ${JSON.stringify(index)};
`;
  fs.writeFileSync(META, ts);
  const tot = index.reduce((s, r) => s + r[1] + r[2], 0);
  console.log(`leaders: ${index.reduce((s, r) => s + r[6], 0)} terms agreed of ${leaderRows.length} rows read, ${index.filter((r) => r[6]).length} countries`);
  console.log(`wrote ${index.length} countries: ${tot} elections (${national.length} national from Wikidata of ${els.size} read), ${index.reduce((s, r) => s + r[3], 0)} cabinets, regimes for ${index.filter((r) => r[4]).length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
