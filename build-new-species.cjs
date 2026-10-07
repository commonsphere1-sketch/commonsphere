/**
 * Builds src/data/newSpecies.ts — species described by science in the last
 * few years, each with what its Wikipedia article says of it and where it was
 * found.
 *
 * No body keeps an open list of every new species with an account of each;
 * some sixteen thousand are described a year. What is read is the part of
 * them that has been written up in the open:
 *
 *   Wikipedia (CC BY-SA)   The articles filed under "Species described in"
 *                          each of the last three years, group by group
 *                          (mammals, birds, fish, plants, fungi...), with the
 *                          opening of each article - which is where the page
 *                          says what the species is, what sets it apart and
 *                          where it lives. Categories of fossils are not
 *                          walked, and an article that calls its subject
 *                          extinct or a fossil is left out.
 *   Wikidata (CC0)         The article's item: it must be a taxon of the
 *                          rank of species, with a scientific name; and
 *                          where the item dates the name, the year must be
 *                          the category's. An article that fails either is
 *                          left out and counted.
 *
 * So a species is here when two records agree that it is a species named in
 * that year. What is said of it is the article's own opening, cut at the end
 * of a sentence; "where" is the article's own clause ("endemic to...", "found
 * in..."), quoted, and left blank where the opening has none. The longest
 * accounts are kept, a few to a group and year, so the list is a sample of
 * what has been written up - not a count of what was discovered.
 *
 *   node build-new-species.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/newSpecies.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-new-species");
fs.mkdirSync(CACHE, { recursive: true });

const NOW = new Date().getFullYear();
const YEARS = [NOW, NOW - 1, NOW - 2];
/** How many of a group are kept for a year, and the least an account must say. */
const PER_GROUP = 6;
const MIN_CHARS = 220;
const MAX_CHARS = 520;
const SPECIES = "Q7432";
const NOT_LIVING = /\b(extinct|fossils?|prehistoric|pal(a)?eonto\w*|Formation|Cambrian|Ordovician|Silurian|Devonian|Carboniferous|Permian|Triassic|Jurassic|Cretaceous|Paleocene|Eocene|Oligocene|Miocene|Pliocene|Pleistocene|Holocene subfossil)\b/i;

const api = (host, params) => `https://${host}/w/api.php?format=json&formatversion=2&${new URLSearchParams(params)}`;
let n = 0;
async function get(host, params) {
  const key = require("crypto").createHash("md5").update(host + JSON.stringify(params)).digest("hex");
  const at = path.join(CACHE, `${key}.json`);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return JSON.parse(fs.readFileSync(at, "utf8"));
  const res = await fetch(api(host, params), { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${host}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  if (++n % 20 === 0) await new Promise((r) => setTimeout(r, 400));
  return JSON.parse(text);
}

/** Every member of a category, of one type. */
async function members(title, type) {
  const out = [];
  let cont;
  do {
    const j = await get("en.wikipedia.org", { action: "query", list: "categorymembers", cmtitle: title, cmtype: type, cmlimit: "500", ...(cont ? { cmcontinue: cont } : {}) });
    out.push(...(j.query?.categorymembers ?? []).map((m) => m.title));
    cont = j.continue?.cmcontinue;
  } while (cont);
  return out;
}

/** The articles under a year's category, each with the narrowest group it is filed in. */
async function articlesOf(year) {
  const found = new Map();
  const walk = async (cat, depth) => {
    const group = cat.replace(/^Category:/, "").replace(new RegExp(` described in ${year}$`), "");
    for (const title of await members(cat, "page")) found.set(title, group);
    if (depth >= 4) return;
    for (const sub of await members(cat, "subcat")) {
      if (NOT_LIVING.test(sub) || !new RegExp(`described in ${year}$`).test(sub)) continue;
      await walk(sub, depth + 1);
    }
  };
  await walk(`Category:Species described in ${year}`, 0);
  return found;
}

/** The opening of an article, cut at the end of a sentence. */
function opening(extract) {
  const text = extract.replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").trim();
  if (text.length <= MAX_CHARS) return text;
  const cut = text.slice(0, MAX_CHARS);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".) "));
  return end > MIN_CHARS ? cut.slice(0, end + 1) : null;
}

/** Where the opening says the species lives or was found: its own clause, to the end of its sentence. */
function whereOf(text) {
  const m = text.match(/\b(endemic to|native to|found only (?:in|on|at)|found (?:in|on|at|off)|known only from|known from|discovered (?:in|on|at|off)|described from|occurs (?:in|on)|lives (?:in|on)|inhabits|collected (?:in|on|from))\s+([^.;()]{3,110})/i);
  if (!m) return undefined;
  const clause = `${m[1]} ${m[2]}`.replace(/\s+/g, " ").replace(/,?\s+(where|which|and (?:is|was|has)|but|based on|by)\b.*$/i, "").trim();
  return clause.length >= 12 && clause.length <= 120 ? clause.charAt(0).toUpperCase() + clause.slice(1) : undefined;
}

(async () => {
  const counted = { articles: 0, notLiving: 0, short: 0, noItem: 0, notSpecies: 0, yearDiffers: 0 };
  const rows = [];
  for (const year of YEARS) {
    const found = await articlesOf(year);
    const titles = [...found.keys()];
    counted.articles += titles.length;
    for (let i = 0; i < titles.length; i += 20) {
      const batch = titles.slice(i, i + 20);
      const j = await get("en.wikipedia.org", { action: "query", prop: "extracts|pageprops", exintro: "1", explaintext: "1", exlimit: "20", ppprop: "wikibase_item", titles: batch.join("|") });
      for (const p of j.query?.pages ?? []) {
        const extract = p.extract ?? "";
        if (NOT_LIVING.test(extract)) {
          counted.notLiving++;
          continue;
        }
        const said = extract.length >= MIN_CHARS ? opening(extract) : null;
        if (!said) {
          counted.short++;
          continue;
        }
        if (!p.pageprops?.wikibase_item) {
          counted.noItem++;
          continue;
        }
        rows.push({ year, group: found.get(p.title) ?? "", article: p.title, item: p.pageprops.wikibase_item, said, where: whereOf(said), length: extract.length });
      }
    }
  }

  // Wikidata's word on each: a species, its scientific name, and the year the name was published.
  const items = [...new Set(rows.map((r) => r.item))];
  const taxon = new Map();
  for (let i = 0; i < items.length; i += 50) {
    const j = await get("www.wikidata.org", { action: "wbgetentities", ids: items.slice(i, i + 50).join("|"), props: "claims" });
    for (const [id, e] of Object.entries(j.entities ?? {})) {
      const name = e.claims?.P225?.[0];
      const rank = e.claims?.P105?.[0]?.mainsnak?.datavalue?.value?.id;
      const date = name?.qualifiers?.P574?.[0]?.datavalue?.value?.time;
      taxon.set(id, { scientific: name?.mainsnak?.datavalue?.value, rank, named: date ? Number(date.slice(1, 5)) : null });
    }
  }
  const agreed = [];
  for (const r of rows) {
    const t = taxon.get(r.item);
    if (!t?.scientific || t.rank !== SPECIES) counted.notSpecies++;
    else if (t.named !== null && t.named !== r.year) counted.yearDiffers++;
    else agreed.push({ ...r, scientific: t.scientific });
  }

  // The fullest accounts, a few to a group and year.
  const kept = [];
  const taken = new Map();
  for (const r of agreed.sort((a, b) => b.year - a.year || b.length - a.length)) {
    const key = `${r.year}|${r.group}`;
    const have = taken.get(key) ?? 0;
    if (have >= PER_GROUP) continue;
    taken.set(key, have + 1);
    kept.push(r);
  }
  if (kept.length < 30) throw new Error(`only ${kept.length} species: the categories or the checks have changed`);
  kept.sort((a, b) => b.year - a.year || a.group.localeCompare(b.group) || b.length - a.length);
  const today = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(
    OUT,
    `/**
 * Species described by science in ${YEARS[YEARS.length - 1]}–${YEARS[0]}, each with what its Wikipedia
 * article says of it and where it was found.
 *
 * GENERATED by build-new-species.cjs on ${today} — do not edit by hand; change
 * the script and re-run it.
 *
 * Read from the articles Wikipedia files under "Species described in" each
 * year: ${counted.articles} articles. Left out: ${counted.notLiving} that are of fossils or extinct forms,
 * ${counted.short} whose opening says too little, ${counted.noItem} with no Wikidata item, ${counted.notSpecies} that Wikidata
 * does not hold as a species with a scientific name, and ${counted.yearDiffers} whose name
 * Wikidata dates to another year. Of the ${agreed.length} left, the ${kept.length} with the fullest
 * accounts are kept, up to ${PER_GROUP} to a group and year.
 *
 * \`said\` is the article's own opening, cut at the end of a sentence; \`where\`
 * is its own clause on where the species lives, and absent where the opening
 * has none. This is a sample of what has been written up, not a count of what
 * was discovered: some sixteen thousand species are described a year.
 */
export const NEW_SPECIES_SOURCES = {
  wikipedia: { label: "Wikipedia — Species described in ${YEARS[YEARS.length - 1]}, ${YEARS[1]} and ${YEARS[0]} (each article's opening)", url: "https://en.wikipedia.org/wiki/Category:Species_described_in_${YEARS[1]}" },
  wikidata: { label: "Wikidata — taxon name, rank and year of naming (P225, P105, P574)", url: "https://www.wikidata.org/wiki/Property:P574" },
  retrieved: "${today}",
  articles: ${counted.articles},
  agreed: ${agreed.length},
};

export type NewSpecies = {
  /** The year the species was described. */
  year: number;
  /** The group Wikipedia files it under: Mammals, Beetles, Plants... */
  group: string;
  /** The title of its Wikipedia article, and its scientific name. */
  article: string;
  scientific: string;
  /** What the article's opening says of it. */
  said: string;
  /** Where it lives or was found, in the article's own words. */
  where?: string;
};

export const NEW_SPECIES: NewSpecies[] = [
${kept.map((r) => `  { year: ${r.year}, group: ${JSON.stringify(r.group)}, article: ${JSON.stringify(r.article)}, scientific: ${JSON.stringify(r.scientific)}, said: ${JSON.stringify(r.said)}${r.where ? `, where: ${JSON.stringify(r.where)}` : ""} },`).join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  ${JSON.stringify(counted)} · agreed ${agreed.length} · kept ${kept.length} · with a place ${kept.filter((r) => r.where).length}`);
  const by = (k) => Object.entries(kept.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {})).map(([a, c]) => `${a} ${c}`).join(", ");
  console.log(`  ${by("year")}\n  ${by("group")}`);
  for (const r of kept.slice(0, 12)) console.log(`    ${r.year} ${r.group} · ${r.article} (${r.scientific}) · ${r.where ?? "-"}\n       ${r.said.slice(0, 200)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
