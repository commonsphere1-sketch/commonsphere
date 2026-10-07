/**
 * Builds src/data/stateUniversities.ts — what each university named in a
 * state's window is: Wikidata's one-line description of it, the year it was
 * founded and its English Wikipedia article, so the window can say what a
 * school is about and known for the way a country's window does
 * (components/UniversityList).
 *
 * The schools themselves are the site's own list (STATE_EDUCATION in
 * src/pages/StatesPage.tsx); this adds no school to it and takes none away.
 * A name is not an article ("SMU (Southern Methodist University)"), so each
 * is looked up and then checked against something Wikidata holds:
 *
 *   found    the article of that title - the name as written, the name
 *            without what is in brackets, or what is in the brackets where
 *            that is the fuller name - following redirects; failing that,
 *            Wikipedia's search for the name and the state
 *   checked  Wikidata must class the article's subject as a higher education
 *            institution and place it in that state. No match on both, no
 *            description - a wrong school's is worse than none - unless
 *            OVERRIDES names the article.
 *   what     Wikidata's description (CC0), and the earliest founding date it
 *            gives where the article's own infobox gives the same year. The
 *            two differ for a school that was chartered in one year and
 *            opened in another, or that came of a merger (Wikidata dates
 *            Washington State University from 1959, the year it took the
 *            name); a year the two do not agree on is left out.
 *
 * Every choice is printed, and the schools left without one are listed at
 * the end. The description itself is short; what a school is known for is
 * not stored: the window quotes the opening of its Wikipedia article when a
 * reader opens the row, under CC BY-SA 4.0.
 *
 *   node build-state-universities.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const PAGE = path.join(__dirname, "src/pages/StatesPage.tsx");
const STATES = path.join(__dirname, "src/data/statesData.ts");
const OUT = path.join(__dirname, "src/data/stateUniversities.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-state-universities");
fs.mkdirSync(CACHE, { recursive: true });
/** Wikidata's class: a higher education institution. */
const HIGHER_ED = "Q38723";
const THIS_YEAR = new Date().getFullYear();

/**
 * Schools the lookup does not settle: the article, by state and by the name
 * as the window lists it. Each was checked by hand. The check that Wikidata
 * classes it as a place of higher education and puts it in the state is
 * skipped for these, which is why each says what the article is.
 */
const OVERRIDES = {
  // A private university in Salt Lake City (Westminster College until 2023). Wikidata places it in Utah but classes it
  // as an educational institution, not under higher education.
  ut: { "Westminster University": "Westminster University (Utah)" },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, accept = "application/json") {
  const at = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, signal: AbortSignal.timeout(75_000) }).catch((e) => ({ ok: false, status: String(e) }));
    if (res.ok) {
      const body = await res.text();
      JSON.parse(body);
      fs.writeFileSync(at, body);
      await sleep(200);
      return JSON.parse(body);
    }
    if (attempt >= 3) throw new Error(`${url.slice(0, 120)}: ${res.status}`);
    await sleep(res.status === 429 ? 30_000 : 4000 * (attempt + 1));
  }
}
const WP = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2";
const sparql = (query) => getJson("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), "application/sparql-results+json");
const qidOf = (uri) => uri.split("/").pop();

/** Each title's article and Wikidata item, following redirects; a title with no article, or a disambiguation page, has none. */
async function itemsOf(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const j = (await getJson(`${WP}&action=query&prop=pageprops&ppprop=wikibase_item|disambiguation&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`)).query ?? {};
    const step = new Map([...(j.normalized ?? []), ...(j.redirects ?? [])].map((r) => [r.from, r.to]));
    const page = new Map((j.pages ?? []).filter((p) => p.pageprops?.wikibase_item && p.pageprops.disambiguation === undefined).map((p) => [p.title, p.pageprops.wikibase_item]));
    for (const t of batch) {
      let final = t;
      for (let k = 0; k < 4 && step.has(final); k++) final = step.get(final);
      if (page.has(final)) out.set(t, { title: final, qid: page.get(final) });
    }
  }
  return out;
}
/** Wikipedia's search: the titles of the first results. */
async function search(q) {
  const j = await getJson(`${WP}&action=query&list=search&srnamespace=0&srlimit=5&srsearch=${encodeURIComponent(q)}`);
  return (j.query?.search ?? []).map((r) => r.title);
}

// ── The states, and the schools each window lists ───────────────────────────

/** The states' ids and names, read from the head of each entry in statesData.ts. */
function statesOf() {
  const src = fs.readFileSync(STATES, "utf8");
  const out = {};
  for (const m of src.matchAll(/\bid: "([a-z]{2})",\s*name: "([^"]+)",\s*abbreviation: "([A-Z]{2})"/g)) out[m[1]] = { name: m[2], iso: `US-${m[3]}` };
  return out;
}
/** The schools written into the page for each state, in the page's order. */
function schoolsOf() {
  const src = fs.readFileSync(PAGE, "utf8").replace(/\r\n/g, "\n");
  const start = src.indexOf("const STATE_EDUCATION: Record<string, StateEducationData> = {");
  const end = src.indexOf("\n};", start);
  if (start < 0 || end < 0) throw new Error("STATE_EDUCATION was not found in the page");
  const out = {};
  let state = null;
  for (const line of src.slice(start, end).split("\n")) {
    const s = /^  ([a-z]{2}): \{$/.exec(line);
    if (s) state = s[1];
    const n = /\bname: "((?:[^"\\]|\\.)*)"/.exec(line);
    if (n && state) (out[state] ||= []).push(JSON.parse(`"${n[1]}"`));
  }
  return out;
}

/** The titles a written name may be filed under, the likeliest first. */
function titlesFor(name) {
  const inner = [...name.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
  const bare = name.replace(/\s*\([^)]*\)/g, "").trim();
  const full = inner.filter((x) => /\b(University|College|Institute|School|Academy)\b/.test(x));
  return [...new Set([...full, bare, name])];
}

(async () => {
  const states = statesOf();
  const schools = schoolsOf();
  const ids = Object.keys(schools);
  const count = ids.reduce((n, id) => n + schools[id].length, 0);
  if (ids.length < 50 || count < 150 || ids.some((id) => !states[id])) throw new Error(`read ${count} schools in ${ids.length} states, ${Object.keys(states).length} states named`);

  // ── Each school's candidate articles: by title first, then by search ──
  const wanted = [];
  for (const id of ids) for (const name of schools[id]) wanted.push({ id, name, titles: OVERRIDES[id]?.[name] ? [OVERRIDES[id][name]] : titlesFor(name) });
  const direct = await itemsOf([...new Set(wanted.flatMap((w) => w.titles))]);
  for (const w of wanted) {
    w.candidates = w.titles.map((t) => direct.get(t)).filter(Boolean);
    if (OVERRIDES[w.id]?.[w.name]) continue;
    const found = await search(`${w.titles[0]} ${states[w.id].name}`);
    const items = await itemsOf(found);
    for (const t of found) if (items.has(t)) w.candidates.push(items.get(t));
    w.candidates = w.candidates.filter((c, i, all) => all.findIndex((x) => x.qid === c.qid) === i);
  }

  // ── What Wikidata says of each candidate: a place of higher education, and the states it is in ──
  const qids = [...new Set(wanted.flatMap((w) => w.candidates.map((c) => c.qid)))].sort();
  const higher = new Set();
  const inState = new Map();
  for (let i = 0; i < qids.length; i += 60) {
    const values = qids.slice(i, i + 60).map((q) => "wd:" + q).join(" ");
    const a = await sparql(`SELECT DISTINCT ?u WHERE { VALUES ?u { ${values} } ?u wdt:P31/wdt:P279* wd:${HIGHER_ED} }`);
    for (const b of a.results.bindings) higher.add(qidOf(b.u.value));
    // Located in the state through any number of steps, or headquartered in a place that is.
    const s = await sparql(`SELECT DISTINCT ?u ?iso WHERE { VALUES ?u { ${values} } { ?u wdt:P131+ ?s } UNION { ?u wdt:P159/wdt:P131* ?s } ?s wdt:P300 ?iso . FILTER(STRSTARTS(?iso, "US-")) }`);
    for (const b of s.results.bindings) (inState.get(qidOf(b.u.value)) ?? inState.set(qidOf(b.u.value), new Set()).get(qidOf(b.u.value))).add(b.iso.value);
  }

  const missing = [];
  for (const w of wanted) {
    w.hit = OVERRIDES[w.id]?.[w.name] ? w.candidates[0] : w.candidates.find((c) => higher.has(c.qid) && inState.get(c.qid)?.has(states[w.id].iso));
    if (!w.hit) missing.push(`${states[w.id].name}: ${w.name} - found ${w.candidates.map((c) => `${c.title}${higher.has(c.qid) ? "" : " (not higher education)"}${inState.get(c.qid)?.has(states[w.id].iso) ? "" : ` (in ${[...(inState.get(c.qid) ?? [])].join(", ") || "no state"})`}`).slice(0, 4).join("; ") || "nothing"}`);
  }

  // ── The chosen articles' descriptions and founding dates ──
  const chosen = [...new Set(wanted.filter((w) => w.hit).map((w) => w.hit.qid))].sort();
  const detail = {};
  for (let i = 0; i < chosen.length; i += 50) {
    const batch = chosen.slice(i, i + 50);
    const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=descriptions|sitelinks|claims&languages=en&sitefilter=enwiki&ids=${batch.join("|")}`);
    for (const [qid, e] of Object.entries(j.entities || {})) {
      const wiki = e.sitelinks?.enwiki?.title;
      if (!wiki) continue;
      const about = (e.descriptions?.en?.value ?? "").replace(/\s+/g, " ").trim();
      // The earliest founding date Wikidata gives.
      const years = (e.claims?.P571 ?? []).map((s) => Number(/^\+(\d{4})-/.exec(s.mainsnak?.datavalue?.value?.time ?? "")?.[1])).filter((y) => y > 800 && y <= THIS_YEAR);
      const u = { wiki };
      if (about && !/^wiki(media|pedia)/i.test(about)) u.about = about.length > 170 ? about.slice(0, about.lastIndexOf(" ", 167)) + "…" : about;
      if (years.length) u.founded = Math.min(...years);
      detail[qid] = u;
    }
  }

  // ── The founding year each article's own infobox gives: Wikidata's is kept only where the two agree ──
  const unconfirmed = [];
  for (const d of Object.values(detail)) {
    if (!d.founded) continue;
    const j = await getJson(`${WP}&action=parse&prop=wikitext&section=0&redirects=1&page=${encodeURIComponent(d.wiki)}`);
    const field = /^\s*\|\s*(?:established|founded)\s*=\s*(.*)$/im.exec(j.parse?.wikitext ?? "")?.[1] ?? "";
    const year = Number(/\b(1[5-9]\d\d|20[0-2]\d)\b/.exec(field)?.[1]);
    if (year !== d.founded) {
      unconfirmed.push(`${d.wiki}: Wikidata ${d.founded}, the article ${year || "no year read"}`);
      delete d.founded;
    }
  }

  const out = {};
  let n = 0;
  for (const w of wanted) {
    const d = w.hit && detail[w.hit.qid];
    if (!d) continue;
    (out[w.id] ||= {})[w.name] = d;
    n++;
    console.log(`${w.id}  ${w.name}  →  ${d.wiki}${d.founded ? `  (${d.founded})` : ""}${d.about ? `  · ${d.about}` : ""}`);
  }
  if (n < count * 0.8) throw new Error(`only ${n} of ${count} schools were settled`);

  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  fs.writeFileSync(
    OUT,
    `/**
 * What each university named in a state's window is: Wikidata's one-line
 * description of it, the year it was founded, and its English Wikipedia
 * article.
 *
 * GENERATED by build-state-universities.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * The schools are the site's own list (STATE_EDUCATION in
 * src/pages/StatesPage.tsx). Each was matched to an article that Wikidata
 * (CC0) classes as a higher education institution and places in that state;
 * a school that could not be matched on both is not here, and its row in
 * the window is its name alone. The founding year is Wikidata's, given only
 * where the article's own infobox has the same year.
 *
 * What each is about and known for is not stored here: the window quotes
 * the opening of its Wikipedia article when a reader opens the row.
 */
export const STATE_UNIVERSITIES_SOURCE = {
  label: "Wikidata — each school's description and founding year (CC0)",
  url: "https://www.wikidata.org/wiki/${HIGHER_ED}",
  retrieved: "${today}",
};

export interface SchoolArticle {
  /** Its English Wikipedia article. */
  wiki: string;
  /** Wikidata's one-line description. */
  about?: string;
  /** The year it was founded, where Wikidata gives one and the article's infobox agrees. */
  founded?: number;
}

/** Keyed by the state id used in statesData.ts, then by the school's name as the window lists it. */
export const STATE_UNIVERSITIES: Record<string, Record<string, SchoolArticle>> = {
${Object.entries(out)
  .map(([id, m]) => `  ${id}: {\n${Object.entries(m).map(([name, d]) => `    ${q(name)}: ${q(d)},`).join("\n")}\n  },`)
  .join("\n")}
};
`,
  );
  console.log(`\nwrote ${path.relative(__dirname, OUT)}: ${n} of ${count} schools in ${Object.keys(out).length} states`);
  if (unconfirmed.length) console.log(`\nNo founding year given for ${unconfirmed.length}, where Wikidata and the article differ:\n  ${unconfirmed.join("\n  ")}`);
  if (missing.length) console.log(`\nNo article settled for ${missing.length}:\n  ${missing.join("\n  ")}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
