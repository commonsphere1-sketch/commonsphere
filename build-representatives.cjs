/**
 * Builds src/data/representatives.ts — the heads of the world's regions and
 * municipalities that three records agree on, for the explorer on the World
 * Maps page.
 *
 * There is no register of the world's municipalities and who leads them. The
 * widest open one is Wikidata, and its "head of government" is not reliable
 * on its own: read on 7 October 2026 it still named governors of three US
 * states who had left office. So a place's head is kept only where three
 * records, kept by different hands, name the same person:
 *
 *   1  the place's own Wikidata record names one head of government with no
 *      end date, a living person
 *   2  the office's holders agree: of everyone Wikidata records as holding
 *      the place's office ("office held by head of government") with no end
 *      date, there is exactly one living person, and it is the same one
 *   3  the infobox of the place's English Wikipedia article names that
 *      person
 *
 * A country is not a region or a municipality, so the countries themselves
 * are left out: their leaders are on the World Leaders page. The year a head
 * took office is kept only where the place's record and the holder's give
 * the same year; Wikidata's two do not always agree, and then none is shown.
 *
 * A place that fails any of the three is left out, and counted: the file
 * says, for each country, how many places Wikidata records a head for and
 * how many were confirmed, so what is missing is not hidden. Nothing is
 * filled in or guessed.
 *
 * The build then scores itself against the two lists the site already holds
 * from Wikipedia - the fifty governors and the mayors of the fifty largest
 * US cities (stateOffices.ts) - and writes the result into the file, so the
 * page can say how often the rule was right where it could be checked. A
 * place those lists contradict is dropped.
 *
 *   node build-representatives.cjs     (cached between runs: a run that is cut short picks up where it stopped)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/representatives.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-representatives");
fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cached(name, load) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const got = await load();
  fs.writeFileSync(at, JSON.stringify(got));
  return got;
}
async function sparql(query) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
      body: "query=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(100000),
    }).catch((e) => ({ ok: false, status: String(e), text: async () => "" }));
    if (res.ok) {
      const rows = JSON.parse(await res.text()).results.bindings;
      await sleep(250);
      return rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.value])));
    }
    if (attempt >= 3) throw new Error(`Wikidata: ${res.status}`);
    await sleep(8000 * (attempt + 1));
  }
}
const qid = (uri) => uri.split("/").pop();
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
const wd = (ids) => ids.map((q) => "wd:" + q).join(" ");

/** A name as compared: without accents, case or punctuation; the words of three letters or more. */
const words = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^(jr|sr|iii|the|von|van|del|der|den|los|las|bin|ibn|dos|das)$/.test(w));

(async () => {
  // ── The countries: every one with an ISO code that still exists ──
  const countries = new Map(
    (await cached("countries.json", () => sparql(`SELECT ?country ?code ?countryLabel WHERE { ?country wdt:P297 ?code . FILTER NOT EXISTS { ?country wdt:P576 ?gone } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`)))
      .filter((r) => /^[A-Z]{2}$/.test(r.code))
      .map((r) => [qid(r.country), { code: r.code, name: r.countryLabel }]),
  );
  if (countries.size < 200) throw new Error(`only ${countries.size} countries were read`);

  // ── 1. Every place whose record names an office and a head with no end date ──
  const rows = await cached("global.json", () =>
    sparql(`SELECT ?place ?office ?head ?start ?country WHERE {
      ?place wdt:P1313 ?office ; p:P6 ?st ; wdt:P17 ?country .
      ?st ps:P6 ?head .
      FILTER NOT EXISTS { ?st pq:P582 ?end }
      OPTIONAL { ?st pq:P580 ?start }
    }`),
  );
  if (rows.length < 10000) throw new Error(`only ${rows.length} rows of places and heads were read`);
  const places = new Map();
  for (const r of rows) {
    const c = countries.get(qid(r.country));
    if (!c) continue; // a state that no longer exists, or a place in none
    const id = qid(r.place);
    // A place two countries claim is kept under the first that names it.
    const p = places.get(id) ?? places.set(id, { id, country: c.code, heads: new Map(), offices: new Set() }).get(id);
    p.offices.add(qid(r.office));
    p.heads.set(qid(r.head), r.start ?? null);
  }
  const recorded = {};
  for (const p of places.values()) recorded[p.country] = (recorded[p.country] || 0) + 1;
  console.log(`${places.size} places name an office and a head`);

  // ── 2. Who holds each of those offices, by the holders' own records ──
  const single = [...places.values()].filter((p) => p.heads.size === 1 && p.offices.size === 1);
  const offices = [...new Set(single.map((p) => [...p.offices][0]))].sort();
  const holders = new Map();
  for (let i = 0; i < offices.length; i += 100) {
    const batch = offices.slice(i, i + 100);
    const got = await cached(`holders-${hash(batch.join(" "))}.json`, () =>
      sparql(`SELECT ?office ?holder WHERE { VALUES ?office { ${wd(batch)} } ?holder p:P39 ?ps . ?ps ps:P39 ?office . FILTER NOT EXISTS { ?ps pq:P582 ?end } FILTER NOT EXISTS { ?holder wdt:P570 ?died } }`),
    );
    for (const r of got) (holders.get(qid(r.office)) ?? holders.set(qid(r.office), new Set()).get(qid(r.office))).add(qid(r.holder));
    if ((i / 100) % 25 === 0) console.log(`  holders of ${i} of ${offices.length} offices`);
  }
  const why = { severalHeads: places.size - single.length, officeSilent: 0, officeDisagrees: 0, notAPerson: 0, noName: 0, gone: 0, noPlace: 0, future: 0, notInInfobox: 0, contradicted: 0 };
  const agreed = [];
  for (const p of single) {
    const [headId, start] = [...p.heads][0];
    const office = [...p.offices][0];
    const h = holders.get(office);
    if (!h || h.size === 0) { why.officeSilent++; continue; }
    if (h.size !== 1 || !h.has(headId)) { why.officeDisagrees++; continue; }
    agreed.push({ id: p.id, country: p.country, headId, office, start });
  }
  console.log(`${agreed.length} places where the place's record and the office's holders name the same single person`);

  // ── What each of those places, people and offices is called, and where the place is ──
  const today = new Date().toISOString().slice(0, 10);
  const named = [];
  for (let i = 0; i < agreed.length; i += 80) {
    const batch = agreed.slice(i, i + 80);
    const got = await cached(`names-${hash(batch.map((p) => p.id).join(" "))}.json`, () =>
      sparql(`SELECT ?place ?placeLabel ?head ?headLabel ?office ?officeLabel ?human ?died ?gone ?iso ?pop ?coord ?article WHERE {
        VALUES (?place ?head ?office) { ${batch.map((p) => `(wd:${p.id} wd:${p.headId} wd:${p.office})`).join(" ")} }
        OPTIONAL { ?head wdt:P31 ?human . FILTER(?human = wd:Q5) }
        OPTIONAL { ?head wdt:P570 ?died }
        OPTIONAL { ?place wdt:P576 ?gone }
        OPTIONAL { ?place wdt:P300 ?iso }
        OPTIONAL { ?place wdt:P1082 ?pop }
        OPTIONAL { ?place wdt:P625 ?coord }
        OPTIONAL { ?article schema:about ?place ; schema:isPartOf <https://en.wikipedia.org/> }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
      }`),
    );
    const by = new Map();
    for (const r of got) {
      const x = by.get(qid(r.place)) ?? by.set(qid(r.place), { name: r.placeLabel, head: r.headLabel, officeName: r.officeLabel, human: false, died: false, gone: false, iso: null, pop: 0, coord: null, article: null }).get(qid(r.place));
      x.human ||= !!r.human;
      x.died ||= !!r.died;
      x.gone ||= !!r.gone;
      x.iso ??= r.iso ?? null;
      x.pop = Math.max(x.pop, +r.pop || 0);
      x.coord ??= r.coord ?? null;
      x.article ??= r.article ?? null;
    }
    for (const p of batch) {
      const x = by.get(p.id);
      if (!x || !x.human || x.died) { why.notAPerson++; continue; }
      if (x.gone) { why.gone++; continue; }
      // A label Wikidata could not give comes back as the id.
      if ([x.name, x.head, x.officeName].some((s) => !s || /^Q\d+$/.test(s))) { why.noName++; continue; }
      const at = /^Point\((-?[\d.]+) (-?[\d.]+)\)$/.exec(x.coord || "");
      if (!at || !x.article) { why.noPlace++; continue; }
      if (p.start && p.start.slice(0, 10) > today) { why.future++; continue; }
      // Wikidata writes some offices with a capital and some without: each is given one.
      named.push({ ...p, ...x, officeName: x.officeName[0].toUpperCase() + x.officeName.slice(1), since: p.start ? p.start.slice(0, 10) : null, lon: +(+at[1]).toFixed(3), lat: +(+at[2]).toFixed(3), title: decodeURIComponent(x.article.split("/wiki/")[1]).replace(/_/g, " ") });
    }
    if ((i / 80) % 20 === 0) console.log(`  names of ${i} of ${agreed.length} places`);
  }
  console.log(`${named.length} of them are a living person's, in a place that exists, has a position and an English Wikipedia article`);

  // ── 3. The infobox of the place's Wikipedia article names the same person ──
  const leads = new Map();
  const titles = [...new Set(named.map((p) => p.title))].sort();
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20);
    const pages = await cached(`wp-${hash(batch.join("|"))}.json`, async () => {
      for (let attempt = 0; ; attempt++) {
        const url = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", prop: "revisions", rvprop: "content", rvslots: "main", rvsection: "0", redirects: "1", format: "json", formatversion: "2", titles: batch.join("|") });
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) }).catch((e) => ({ ok: false, status: String(e) }));
        if (res.ok) {
          const j = await res.json();
          await sleep(120);
          const to = new Map([...(j.query.normalized || []), ...(j.query.redirects || [])].map((n) => [n.from, n.to]));
          const byTitle = new Map((j.query.pages || []).map((pg) => [pg.title, pg.revisions?.[0]?.slots?.main?.content ?? ""]));
          return batch.map((t) => {
            let at = t;
            for (let hop = 0; hop < 3 && to.has(at); hop++) at = to.get(at);
            return [t, byTitle.get(at) ?? ""];
          });
        }
        if (attempt >= 3) throw new Error(`Wikipedia: ${res.status}`);
        await sleep(5000 * (attempt + 1));
      }
    });
    for (const [t, text] of pages) leads.set(t, text);
    if ((i / 20) % 50 === 0) console.log(`  articles ${i} of ${titles.length}`);
  }
  /** The first infobox of an article's opening, braces balanced. */
  const infobox = (text) => {
    const start = text.search(/\{\{\s*Infobox/i);
    if (start < 0) return "";
    let depth = 0;
    for (let i = start; i < text.length - 1; i++) {
      if (text.startsWith("{{", i)) { depth++; i++; } else if (text.startsWith("}}", i)) { depth--; i++; if (depth === 0) return text.slice(start, i + 1); }
    }
    return text.slice(start);
  };
  const confirmed = [];
  for (const p of named) {
    const box = new Set(words(infobox(leads.get(p.title) ?? "").replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, " ")));
    const name = words(p.head);
    // Every word of the name, and at least two of them: a single shared surname is not a match.
    if (name.length >= 2 && name.every((w) => box.has(w))) confirmed.push(p);
    else why.notInInfobox++;
  }
  console.log(`${confirmed.length} of them are named in the infobox of the place's Wikipedia article`);

  // ── The countries themselves are not regions; and a start year must be the holder's record's too ──
  for (let i = 0; i < confirmed.length; i += 80) {
    const batch = confirmed.slice(i, i + 80);
    const got = await cached(`verify-${hash(batch.map((p) => p.id).join(" "))}.json`, () =>
      sparql(`SELECT ?place ?hstart ?state WHERE {
        VALUES (?place ?head ?office) { ${batch.map((p) => `(wd:${p.id} wd:${p.headId} wd:${p.office})`).join(" ")} }
        ?head p:P39 ?ps . ?ps ps:P39 ?office .
        FILTER NOT EXISTS { ?ps pq:P582 ?end }
        OPTIONAL { ?ps pq:P580 ?hstart }
        OPTIONAL { ?place wdt:P31 ?state . FILTER(?state IN (wd:Q3624078, wd:Q6256)) }
      }`),
    );
    const by = new Map();
    for (const r of got) {
      const x = by.get(qid(r.place)) ?? by.set(qid(r.place), { starts: new Set(), state: false }).get(qid(r.place));
      if (r.hstart) x.starts.add(r.hstart.slice(0, 4));
      x.state ||= !!r.state;
    }
    for (const p of batch) {
      const x = by.get(p.id);
      p.isCountry = !!x?.state || countries.get(p.id)?.code === p.country;
      // The year, where the holder's own record gives the same one; otherwise none.
      p.since = p.since && x?.starts.size === 1 && x.starts.has(p.since.slice(0, 4)) ? p.since.slice(0, 4) : null;
    }
    if ((i / 80) % 20 === 0) console.log(`  checked ${i} of ${confirmed.length}`);
  }
  // --countries prints the countries' own heads the rule confirmed, to set beside the World Leaders page.
  if (process.argv.includes("--countries")) fs.writeFileSync(path.join(CACHE, "country-heads.json"), JSON.stringify(confirmed.filter((p) => p.isCountry).map((p) => [p.country, p.name, p.head, p.officeName])));
  why.aCountry = 0;
  for (let i = confirmed.length - 1; i >= 0; i--) if (confirmed[i].isCountry) { confirmed.splice(i, 1); why.aCountry++; }
  console.log(`${confirmed.length} of them are regions or municipalities, not the country itself; ${confirmed.filter((p) => p.since).length} have a start year both records give`);

  // ── How often the rule is right where the site can check it ──
  const src = fs.readFileSync(path.join(__dirname, "src/data/stateOffices.ts"), "utf8").replace(/\r\n/g, "\n");
  const govs = new Map([...src.matchAll(/\n  ([a-z]{2}): \{\n[^\n]*\n[^\n]*\n    governor: \{ name: "([^"]+)"/g)].map((m) => ["US-" + m[1].toUpperCase(), m[2]]));
  const mayors = src.slice(src.indexOf("export const BIG_CITY_MAYORS")).split("\n").filter((l) => l.startsWith('  {"name":')).map((l) => JSON.parse(l.replace(/,$/, "")));
  if (govs.size !== 50 || mayors.length !== 50) throw new Error(`stateOffices.ts: ${govs.size} governors and ${mayors.length} mayors to check against`);
  const surname = (s) => words(s).pop();
  const us = confirmed.filter((p) => p.country === "US");
  const g = us.filter((p) => p.iso && govs.has(p.iso));
  const gWrong = g.filter((p) => surname(p.head) !== surname(govs.get(p.iso)));
  // A big city is matched by its name and its size: names alone would take Portland, Maine for Portland, Oregon.
  const m = mayors.flatMap((mm) => {
    const p = us.find((x) => !x.iso && x.name.replace(/ City$/, "") === mm.city.replace(/ City$/, "") && Math.abs(x.pop - mm.population) / mm.population < 0.15);
    return p ? [{ p, mm }] : [];
  });
  const mWrong = m.filter(({ p, mm }) => surname(p.head) !== surname(mm.name));
  const check = { governors: { checked: g.length, agree: g.length - gWrong.length }, mayors: { checked: m.length, agree: m.length - mWrong.length } };
  console.log(`  against the site's lists: governors ${check.governors.agree} of ${check.governors.checked} agree${gWrong.length ? " — " + gWrong.map((p) => `${p.iso}: ${p.head} / ${govs.get(p.iso)}`).join("; ") : ""}`);
  console.log(`  mayors of the largest US cities ${check.mayors.agree} of ${check.mayors.checked} agree${mWrong.length ? " — " + mWrong.map(({ p, mm }) => `${mm.city}: ${p.head} / ${mm.name}`).join("; ") : ""}`);
  const bad = new Set([...gWrong.map((p) => p.id), ...mWrong.map(({ p }) => p.id)]);
  for (let i = confirmed.length - 1; i >= 0; i--) if (bad.has(confirmed[i].id)) { confirmed.splice(i, 1); why.contradicted++; }
  console.log("  left out, by reason:", JSON.stringify(why));
  if (confirmed.length < 500) throw new Error(`only ${confirmed.length} places were confirmed`);

  // ── The file ──
  confirmed.sort((a, b) => a.country.localeCompare(b.country) || Number(!!b.iso) - Number(!!a.iso) || b.pop - a.pop || a.name.localeCompare(b.name));
  const counts = {};
  for (const c of [...countries.values()].sort((a, b) => a.code.localeCompare(b.code))) {
    const n = confirmed.filter((p) => p.country === c.code).length;
    if (recorded[c.code] || n) counts[c.code] = [c.name, recorded[c.code] || 0, n];
  }
  const q = (v) => JSON.stringify(v);
  fs.writeFileSync(
    OUT,
    `/**
 * The heads of regions and municipalities that three records agree on: for
 * the explorer on the World Maps page.
 *
 * GENERATED by build-representatives.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * There is no register of the world's municipalities and who leads them, and
 * Wikidata's "head of government" is not reliable on its own. A place is here
 * only where its own Wikidata record, the records of the office's holders,
 * and the infobox of its English Wikipedia article all name the same living
 * person as its head, with no end date. Every other place is left out - not
 * filled in - and REPRESENTATIVE_COUNTRIES says how many that is for each
 * country. The countries themselves are not here: their leaders are on the
 * World Leaders page. Even three records can be out of date together after an election:
 * each row links to the place's article and record so that it can be checked.
 */
export const REPRESENTATIVES_SOURCES = {
  wikidata: { label: "Wikidata — each place's head of government and its office's holders", url: "https://www.wikidata.org/wiki/Property:P6" },
  wikipedia: { label: "Wikipedia — the infobox of each place's article", url: "https://en.wikipedia.org/" },
  retrieved: "${today}",
  /** Where the rule could be checked against the lists the site holds from Wikipedia: how many of the heads it confirmed were the same. A place the lists contradict is not shown. */
  check: ${q(check)},
  /** Places Wikidata records an office and a head for, and those confirmed. */
  recorded: ${places.size},
  confirmed: ${confirmed.length},
};

/** [country's name, places Wikidata records an office and a head for, places confirmed], by ISO code. */
export const REPRESENTATIVE_COUNTRIES: Record<string, [name: string, recorded: number, confirmed: number]> = ${q(counts)};

/**
 * A confirmed place: [ISO country code, the place, its ISO 3166-2 code where it has one (a state, province or
 * other subdivision) or "", the head, the office, the year the head took office where the place's record and the
 * holder's give the same one or "", latitude, longitude, population or 0,
 * the place's Wikidata id, its English Wikipedia article].
 */
export type RepresentativeRow = [country: string, place: string, region: string, head: string, office: string, since: string, lat: number, lon: number, population: number, id: string, article: string];

/** By country, then the subdivisions with an ISO 3166-2 code first, then by population. */
export const REPRESENTATIVES: RepresentativeRow[] = [
${confirmed.map((p) => `  ${q([p.country, p.name, p.iso ?? "", p.head, p.officeName, p.since ?? "", p.lat, p.lon, p.pop, p.id, p.title])},`).join("\n")}
];
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB): ${confirmed.length} places in ${Object.values(counts).filter((c) => c[2] > 0).length} countries`);
  const top = Object.entries(counts).sort((a, b) => b[1][2] - a[1][2]).slice(0, 25);
  console.log("  most confirmed:", top.map(([k, v]) => `${k} ${v[2]}/${v[1]}`).join(", "));
})().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
