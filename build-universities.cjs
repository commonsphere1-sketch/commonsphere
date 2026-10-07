/**
 * Builds src/data/universities.ts — the universities and colleges of each
 * city and each country the site profiles.
 *
 * The country window listed "major universities" typed by hand, some with a
 * rank nobody published beside them; the city window had none. This is the
 * list from Wikidata (CC0), by a rule that can be stated:
 *
 *   which     every institution Wikidata classes as a higher education
 *             institution (university, college, institute, grande école and
 *             their kinds) that it places in the country, or - for a city -
 *             in the city, in a part of it, or headquartered there; that has
 *             not been dissolved; and that has an article in the English
 *             Wikipedia, so the page can quote what it is and is known for
 *   how many  the twelve with articles in the most language editions of
 *             Wikipedia, in that order. That count is how widely an
 *             institution is written about, not how good it is: the list is
 *             no ranking, and the page says so.
 *   what      its name, Wikidata's one-line description, the year it was
 *             founded where Wikidata gives one, and its article's title
 *
 * The description of each - what it is about and known for - is not stored:
 * the page fetches the opening of its Wikipedia article when a reader opens
 * it, under CC BY-SA 4.0.
 *
 * How it is read. One query lists every such institution with its country
 * and its count of editions; one query a city lists those in the city (a
 * city is found by its Wikipedia article, cityPlaces.ts). The name,
 * description, founding date and article of the candidates are then read
 * from Wikidata's entity API. Every answer is cached.
 *
 *   node build-universities.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/universities.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-universities");
fs.mkdirSync(CACHE, { recursive: true });
const KEEP = 12;
/** How many candidates are looked up for a place: some have no English article or have been dissolved. */
const CANDIDATES = 30;
/** Wikidata's class: a higher education institution. */
const HIGHER_ED = "Q38723";
const THIS_YEAR = new Date().getFullYear();

/**
 * A "city" on the site that is a region of several places: the places whose
 * institutions it takes, each checked by name before it is used.
 */
const PARTS = {
  // A city whose institutions Wikidata places in the municipality of the same name, a separate item from the city's.
  ams26: { Q9899: /Amsterdam/ },
  cph26: { Q504125: /Copenhagen/ },
  sfo: { Q62: /San Francisco/, Q107146: /Alameda County/, Q110739: /Santa Clara County/, Q108101: /San Mateo County/, Q108058: /Contra Costa County/, Q108117: /Marin County/ },
};

/** A city whose institutions Wikidata files under another country's code: Hong Kong's are under China's. */
const QUERY_CODE = { hk26: "CN" };
/**
 * A country whose institutions Wikidata files under an item that does not carry its ISO code: the Netherlands' are
 * under the country (Q55), and the code is on the Kingdom.
 */
const COUNTRY_ITEM = { NL: "Q55" };
/** Not places of study, though Wikidata's classes put them under higher education: left out by their own description. */
const NOT_A_SCHOOL = /\b(learned society|academy of sciences|national academy|scientific society)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cached(url, name, accept = "application/json") {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, signal: AbortSignal.timeout(75000) });
      if (res.status === 429) {
        await sleep(1000 * Math.min(90, Number(res.headers.get("retry-after") || 30)));
        throw new Error("rate limited");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const j = JSON.parse(text);
      fs.writeFileSync(at, text);
      await sleep(400);
      return j;
    } catch (e) {
      if (i === 3) throw new Error(`${name}: ${e.message}`);
      await sleep(5000 * (i + 1));
    }
  }
}
const sparql = (query, name) => cached("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), name, "application/sparql-results+json");
const qid = (uri) => uri.split("/").pop();

function load(file, name) {
  const bundle = path.join(CACHE, name + ".cjs");
  execSync(`npx esbuild ${file} --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle);
}

(async () => {
  const cities = load("src/data/citiesData.ts", "citiesData").citiesData;
  const places = load("src/data/cityPlaces.ts", "cityPlaces").CITY_PLACES;
  const countries = load("src/data/countriesData.ts", "countriesData").countriesData;

  // ── Every higher education institution, with its country and its count of editions ──
  // With the optimizer off the query runs in the order written: the classes, their instances, then each one's country.
  const world = await sparql(
    `SELECT ?u ?code ?links WHERE {
  hint:Query hint:optimizer "None" .
  ?cls wdt:P279* wd:${HIGHER_ED} .
  ?u wdt:P31 ?cls ; wikibase:sitelinks ?links .
  FILTER(?links >= 2)
  ?u wdt:P17 ?c .
  { ?c wdt:P297 ?code } UNION { VALUES (?c ?code) { ${Object.entries(COUNTRY_ITEM).map(([code, item]) => `(wd:${item} "${code}")`).join(" ")} } }
}`,
    "world.json",
  );
  const byCode = {};
  for (const b of world.results.bindings) ((byCode[b.code.value] ||= new Map())).set(qid(b.u.value), Number(b.links.value));
  if (world.results.bindings.length < 8000 || !byCode.US || byCode.US.size < 800) throw new Error(`the world query returned ${world.results.bindings.length} rows`);
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, CANDIDATES).map(([id]) => id);

  // ── Each city: those of its country that Wikidata places in it ──
  const titles = cities.map((c) => places[c.id]?.wiki).filter(Boolean);
  const pp = (await cached("https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageprops&ppprop=wikibase_item&titles=" + encodeURIComponent(titles.join("|")), "city-items.json")).query;
  const moved = Object.fromEntries([...(pp.normalized || []), ...(pp.redirects || [])].map((x) => [x.from, x.to]));
  const itemOf = Object.fromEntries(pp.pages.map((p) => [p.title, p.pageprops?.wikibase_item]));

  const cityCandidates = {};
  const wanted = new Set();
  for (const c of cities) {
    const title = places[c.id]?.wiki;
    const item = title && (itemOf[title] ?? itemOf[moved[title]]);
    if (!/^Q\d+$/.test(item || "")) throw new Error(`${c.name}: no Wikidata item for its article`);
    let inPlace = [item];
    if (PARTS[c.id]) {
      const ids = Object.keys(PARTS[c.id]);
      const got = (await cached(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels&languages=en&ids=${ids.join("|")}`, `parts-${c.id}.json`)).entities;
      inPlace = [item, ...ids.filter((id) => PARTS[c.id][id].test(got[id]?.labels?.en?.value ?? ""))];
      if (inPlace.length < 2) throw new Error(`${c.name}: its parts could not be confirmed by name`);
    }
    const j = await sparql(
      // Located in the place, or in a part of it, or a part of that - three steps of "located in", each a plain join - or headquartered there.
      `SELECT DISTINCT ?u ?links WHERE {
  hint:Query hint:optimizer "None" .
  ${COUNTRY_ITEM[c.countryCode] ? `VALUES ?c { wd:${COUNTRY_ITEM[c.countryCode]} }` : `?c wdt:P297 "${QUERY_CODE[c.id] ?? c.countryCode}" .`}
  ?cls wdt:P279* wd:${HIGHER_ED} .
  ?u wdt:P31 ?cls ; wdt:P17 ?c ; wikibase:sitelinks ?links .
  VALUES ?place { ${inPlace.map((x) => "wd:" + x).join(" ")} }
  { ?u wdt:P131 ?place } UNION { ?u wdt:P131/wdt:P131 ?place } UNION { ?u wdt:P131/wdt:P131/wdt:P131 ?place } UNION { ?u wdt:P159 ?place }
}`,
      `city-${c.id}.json`,
    );
    const m = new Map();
    for (const b of j.results.bindings) m.set(qid(b.u.value), Number(b.links.value));
    // A city that is its own country (Singapore) is given the country's.
    const ids = m.size >= 3 ? top(m) : item && byCode[c.countryCode] && countries.find((x) => x.code === c.countryCode)?.name === c.name ? top(byCode[c.countryCode]) : top(m);
    cityCandidates[c.id] = ids;
    ids.forEach((id) => wanted.add(id));
    process.stdout.write(`  ${c.name}: ${m.size} placed in it\n`);
  }

  const countryCandidates = {};
  for (const c of countries) {
    if (!byCode[c.code]) continue;
    countryCandidates[c.code] = top(byCode[c.code]);
    countryCandidates[c.code].forEach((id) => wanted.add(id));
  }

  // ── The candidates' names, descriptions, founding dates and articles ──
  const ids = [...wanted].sort();
  const detail = {};
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const j = await cached(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=descriptions|sitelinks|claims&languages=en&sitefilter=enwiki&ids=${batch.join("|")}`, `entities-${batch[0]}-${batch.length}.json`);
    for (const [id, e] of Object.entries(j.entities || {})) {
      const wiki = e.sitelinks?.enwiki?.title;
      if (!wiki || e.claims?.P576) continue;
      const about = (e.descriptions?.en?.value ?? "").replace(/\s+/g, " ").trim();
      // The earliest founding date Wikidata gives.
      const years = (e.claims?.P571 ?? []).map((s) => Number(/^\+(\d{4})-/.exec(s.mainsnak?.datavalue?.value?.time ?? "")?.[1])).filter((y) => y > 800 && y <= THIS_YEAR);
      if (NOT_A_SCHOOL.test(about)) continue;
      const u = { name: wiki.replace(/ \([^)]*\)$/, ""), wiki };
      if (about && !/^wiki(media|pedia)/i.test(about)) u.about = about.length > 170 ? about.slice(0, about.lastIndexOf(" ", 167)) + "…" : about;
      if (years.length) u.founded = Math.min(...years);
      detail[id] = u;
    }
  }
  const editions = (code, id, m) => m?.get(id) ?? byCode[code]?.get(id) ?? 0;
  const listOf = (candidates, code) => candidates.filter((id) => detail[id]).slice(0, KEEP).map((id) => ({ ...detail[id], editions: editions(code, id) }));

  const byCity = {};
  for (const c of cities) {
    const l = listOf(cityCandidates[c.id], c.countryCode);
    if (l.length) byCity[c.id] = l;
  }
  const byCountry = {};
  for (const c of countries) {
    const l = countryCandidates[c.code] ? listOf(countryCandidates[c.code], c.code) : [];
    if (l.length) byCountry[c.code] = l;
  }
  const nCity = Object.keys(byCity).length, nCountry = Object.keys(byCountry).length;
  if (nCity < cities.length * 0.8 || nCountry < 170) throw new Error(`only ${nCity} of ${cities.length} cities and ${nCountry} countries have a list`);
  for (const code of ["US", "GB", "JP", "IN", "CN"]) if (!byCountry[code] || byCountry[code].length < KEEP) throw new Error(`no full list for ${code}`);
  if (byCountry.US[0].name !== "Harvard University") console.log(`  note: the United States' first is ${byCountry.US[0].name}`);

  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  const list = (l) => `[\n${l.map((u) => `    ${q(u)},`).join("\n")}\n  ]`;
  fs.writeFileSync(
    OUT,
    `/**
 * The universities and colleges of each city and each country the site
 * profiles.
 *
 * GENERATED by build-universities.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * From Wikidata (CC0): the institutions it classes as higher education that
 * it places in the city or the country, that have not been dissolved and
 * have an article in the English Wikipedia - the ${KEEP} with articles in the
 * most language editions of Wikipedia, in that order. That count is how
 * widely an institution is written about, not a ranking of it.
 *
 * What each is about and known for is not stored here: the page quotes the
 * opening of its Wikipedia article when a reader opens it.
 */
export const UNIVERSITIES_SOURCE = {
  label: "Wikidata — higher education institutions, by place (CC0)",
  url: "https://www.wikidata.org/wiki/${HIGHER_ED}",
  retrieved: "${today}",
  /** How many are kept for a place. */
  kept: ${KEEP},
};

export interface University {
  name: string;
  /** Its English Wikipedia article. */
  wiki: string;
  /** How many language editions of Wikipedia have an article on it. */
  editions: number;
  /** Wikidata's one-line description. */
  about?: string;
  /** The year it was founded, where Wikidata gives one. */
  founded?: number;
}

/** Keyed by the city id used in citiesData.ts. */
export const CITY_UNIVERSITIES: Record<string, University[]> = {
${Object.entries(byCity).map(([id, l]) => `  ${q(id)}: ${list(l)},`).join("\n")}
};

/** Keyed by ISO 3166-1 alpha-2 code. */
export const COUNTRY_UNIVERSITIES: Record<string, University[]> = {
${Object.entries(byCountry).map(([code, l]) => `  ${code}: ${list(l)},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  cities: ${nCity} of ${cities.length}; none for ${cities.filter((c) => !byCity[c.id]).map((c) => c.name).join(", ") || "-"}`);
  console.log(`  countries: ${nCountry} of ${countries.length}`);
  for (const code of ["US", "GB", "JP", "TH"]) console.log(`  ${code}: ${byCountry[code].slice(0, 6).map((u) => `${u.name} (${u.founded ?? "?"}, ${u.editions})`).join("; ")}`);
  for (const id of ["tok", "nyc", "sfo", "sgp"]) if (byCity[id]) console.log(`  ${id}: ${byCity[id].slice(0, 5).map((u) => `${u.name} (${u.editions})`).join("; ")}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
