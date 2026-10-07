/**
 * Builds src/data/wikiArticles.ts — the Wikipedia article for each person,
 * family and organisation on the World Leaders page, and each person's date
 * of birth, so their windows can show the article's opening and its history
 * (components/HistoryPanel) and an age that is counted, not typed.
 *
 * How an article is found. The page's own data names each entry; a name is
 * not an article ("Prince William" is "William, Prince of Wales"), so each
 * is looked up and then checked against something the page already holds:
 *
 *   people     Wikipedia's search for the name and country; of the results,
 *              the first whose title carries the name and that Wikidata says
 *              is a human born in the year the page gives. No match on both,
 *              no article - a wrong biography is worse than none - unless
 *              OVERRIDES names one.
 *   alliances  Wikipedia's search for the organisation's full name; the first
 *              result whose Wikidata item was founded in the year the page
 *              gives, or, where the page gives no year, whose title carries
 *              the organisation's name.
 *   families   Wikipedia's search for the family's name; the first result
 *              whose title carries the family's surname.
 *
 * Every choice is printed, and the entries with no article are listed at the
 * end. The date of birth is Wikidata's (P569) where it is given to the day.
 *
 * The text itself is not stored: the page fetches it from Wikipedia when a
 * window opens, so it is the article as it stands, under CC BY-SA 4.0.
 *
 *   node build-wiki-articles.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/wikiArticles.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-wiki-articles");
fs.mkdirSync(CACHE, { recursive: true });

/**
 * Entries the search does not settle: the article, by the page's id. Each was
 * checked by hand.
 *
 * The leaders are here because the year of birth the page gives is not the
 * one Wikidata has - a year or three out, or left over from the person who
 * held the office before - so the check on the year fails though the name is
 * exact. Their dates of birth are taken from Wikidata, as everyone's are.
 *
 * The organisations are ones whose name also begins longer titles ("Member
 * states of the African Union"). The families are ones with no article of
 * their own: the article is the family's house or holding, or the company
 * the fortune comes from, and the window names the article it shows.
 */
const OVERRIDES = {
  ciolacu: "Marcel Ciolacu", // the search gave Marcel Boloș, born in the year the page gives Ciolacu
  kim: "Kim Jong Un",
  christodoulides: "Nikos Christodoulides",
  "lee-jm": "Lee Jae Myung",
  zhelyazkov: "Rosen Zhelyazkov",
  frieden: "Luc Frieden",
  silina: "Evika Siliņa",
  becirovic: "Denis Bećirović",
  mickoski: "Hristijan Mickoski",
  frostadottir: "Kristrún Frostadóttir",
  chaves: "Rodrigo Chaves",
  chapo: "Daniel Chapo",
  simina: "Wesley Simina",
  meleshanu: "Mark Brown (Cook Islands politician)",
  marape: "James Marape",
  henry: "Alix Didier Fils-Aimé",
  ngirente: "Édouard Ngirente",
  sogavare: "Jeremiah Manele",
  nguema: "Brice Oligui Nguema",
  tchiani: "Abdourahamane Tiani",
  // The successors added in October 2026, each by the article its entry was written from.
  burnham: "Andy Burnham",
  takaichi: "Sanae Takaichi",
  tariquerahman: "Tarique Rahman",
  anutin: "Anutin Charnvirakul",
  espriella: "Abelardo de la Espriella",
  keikofujimori: "Keiko Fujimori",
  leminhhung: "Lê Minh Hưng",
  magyar: "Péter Magyar",
  kast: "José Antonio Kast",
  lecornu: "Sébastien Lecornu",
  stocker: "Christian Stocker",
  babis: "Andrej Babiš",
  jetten: "Rob Jetten",
  iotova: "Iliana Iotova",
  kulbergs: "Andris Kulbergs",
  jansa: "Janez Janša",
  kavelashvili: "Mikheil Kavelashvili",
  mutharika: "Peter Mutharika",
  dewever: "Bart De Wever",
  bolojan: "Ilie Bolojan",
  laurafernandez: "Laura Fernández",
  elmansouri: "Fatima Ezzahra El Mansouri",
  persadbissessar: "Kamla Persad-Bissessar",
  nsengiyumva: "Justin Nsengiyumva",
  asfura: "Nasry Asfura",
  wale: "Matthew Wale",
  alzaidi: "Ali al-Zaidi",
  wadagni: "Romuald Wadagni",
  tasoulas: "Konstantinos Tasoulas",
  nawrocki: "Karol Nawrocki",
  herminie: "Patrick Herminie",
  mojtabakhamenei: "Mojtaba Khamenei",
  delcyrodriguez: "Delcy Rodríguez",
  brnabic: "Ana Brnabić",
  karan: "Siniša Karan",
  csto: "Collective Security Treaty Organization",
  au: "African Union",
  oecd: "OECD",
  eaeu: "Eurasian Economic Union",
  sadc: "Southern African Development Community",
  rcep: "Regional Comprehensive Economic Partnership",
  thomson: "The Woodbridge Company",
  ambani: "Reliance Industries",
  wertheimer: "Chanel",
  hermes: "Hermès",
  arnault: "LVMH",
  "al-thani-qatar": "House of Thani",
  "al-nahyan-abu-dhabi": "House of Nahyan",
  mulliez: "Association Familiale Mulliez",
  "azim-premji": "Wipro",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const at = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(45_000) }).catch((e) => ({ ok: false, status: String(e) }));
    if (res.ok) {
      const body = await res.text();
      fs.writeFileSync(at, body);
      await sleep(120);
      return JSON.parse(body);
    }
    if (attempt >= 3) throw new Error(`${url}: ${res.status}`);
    await sleep(2000 * (attempt + 1));
  }
}

const WP = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2";
const WD = "https://www.wikidata.org/w/api.php?format=json";

/** Wikipedia's search: the titles of the first results. */
async function search(q, limit = 6) {
  const j = await getJson(`${WP}&action=query&list=search&srnamespace=0&srlimit=${limit}&srsearch=${encodeURIComponent(q)}`);
  return (j.query?.search ?? []).map((r) => r.title);
}

/** Each title's Wikidata item, following redirects. */
async function itemsOf(titles) {
  if (!titles.length) return new Map();
  const j = await getJson(`${WP}&action=query&prop=pageprops&ppprop=wikibase_item|disambiguation&redirects=1&titles=${encodeURIComponent(titles.join("|"))}`);
  const to = new Map((j.query?.redirects ?? []).map((r) => [r.from, r.to]));
  const by = new Map();
  for (const p of j.query?.pages ?? []) if (p.pageprops?.wikibase_item && p.pageprops.disambiguation === undefined) by.set(p.title, p.pageprops.wikibase_item);
  const out = new Map();
  for (const t of titles) {
    const final = to.get(t) ?? t;
    if (by.has(final)) out.set(t, { title: final, qid: by.get(final) });
  }
  return out;
}

/** The claims this script reads from each item. */
async function claimsOf(qids) {
  const out = new Map();
  for (let i = 0; i < qids.length; i += 40) {
    const j = await getJson(`${WD}&action=wbgetentities&props=claims|sitelinks&sitefilter=enwiki&ids=${qids.slice(i, i + 40).join("|")}`);
    for (const [id, e] of Object.entries(j.entities ?? {})) {
      const ids = (p) => (e.claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
      const time = (p) => {
        // The preferred statement if there is one, else the first.
        const all = (e.claims?.[p] ?? []).filter((c) => c.mainsnak?.datavalue?.value?.time);
        const c = all.find((x) => x.rank === "preferred") ?? all[0];
        const v = c?.mainsnak.datavalue.value;
        return v ? { iso: v.time.replace(/^\+/, "").slice(0, 10), precision: v.precision } : null;
      };
      out.set(id, { instance: ids("P31"), born: time("P569"), inception: time("P571"), family: ids("P53"), enwiki: e.sitelinks?.enwiki?.title ?? null });
    }
  }
  return out;
}

// ── The page's entries ──────────────────────────────────────────────────────

function bundle(file, name) {
  const at = path.join(CACHE, name + ".cjs");
  execSync(`npx esbuild ${file} --bundle --format=cjs --platform=node --log-level=error --outfile="${at}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[at];
  return require(at);
}

/** The leaders and the families are written inside the page: their fields are read from its text. */
function fromPage() {
  const src = fs.readFileSync(path.join(__dirname, "src/pages/WorldleadersPage.tsx"), "utf8");
  const block = (start, end) => src.slice(src.indexOf(start), src.indexOf(end));
  const entries = (text, fields) => {
    const out = [];
    const re = /\n    id: "([^"]+)",/g;
    const at = [];
    let m;
    while ((m = re.exec(text))) at.push([m.index, m[1]]);
    at.forEach(([i, id], k) => {
      const body = text.slice(i, k + 1 < at.length ? at[k + 1][0] : text.length);
      const e = { id };
      for (const f of fields) {
        const s = new RegExp(`\\n    ${f}:\\s*(?:"([^"]*)"|(-?\\d+))`).exec(body);
        if (s) e[f] = s[1] !== undefined ? s[1] : Number(s[2]);
      }
      out.push(e);
    });
    return out;
  };
  return {
    leaders: entries(block("const LEADERS: Leader[] = [", "const IDEOLOGY_COLORS"), ["name", "country", "countryCode", "title", "birthYear"]),
    families: entries(block("const RICHEST_FAMILIES: RichFamily[] = [", "function RichestFamiliesView"), ["family", "country", "source", "founded"]),
  };
}

const plain = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
/** A name without the style in front of it: "King Charles III" is searched as "Charles III". */
const bare = (name) =>
  name
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/^(King|Queen|Prince|Princess|Emperor|Empress|Sultan|Emir|Grand Duke|Crown Prince|President|Sheikh|Pope)\s+/i, "")
    .replace(/^(Sheikh)\s+/i, "")
    .trim();

(async () => {
  const { leaders, families } = fromPage();
  const royals = bundle("src/data/royalFamiliesData.ts", "royals").ROYAL_FAMILIES;
  const alliances = bundle("src/data/alliances.ts", "alliances").ALLIANCES;
  if (leaders.length < 150 || families.length < 10 || royals.length < 20 || alliances.length < 20) throw new Error(`read ${leaders.length} leaders, ${families.length} families, ${royals.length} royals, ${alliances.length} alliances`);

  const out = {};
  const missing = [];

  // People: a human born in the year the page gives.
  const people = [
    ...leaders.map((l) => ({ id: l.id, name: l.name, country: l.country, year: l.birthYear, kind: "leader" })),
    ...royals.map((r) => ({ id: r.id, name: r.name, country: r.country, year: r.born, kind: "royal" })),
  ];
  for (const p of people) {
    let titles = OVERRIDES[p.id] ? [OVERRIDES[p.id]] : [...new Set([...(await search(`${bare(p.name)} ${p.country}`)), ...(await search(bare(p.name), 4))])];
    const items = await itemsOf(titles);
    const claims = await claimsOf([...new Set([...items.values()].map((x) => x.qid))]);
    let hit = null;
    for (const t of titles) {
      const it = items.get(t);
      const c = it && claims.get(it.qid);
      if (!c || !c.instance.includes("Q5")) continue;
      // The year alone is not enough: a search for one politician returns others of the same age. The title must carry
      // a word of the name too (not its first, which a namesake shares).
      const words = plain(bare(p.name)).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const carries = words.slice(words.length > 1 ? 1 : 0).some((w) => plain(it.title).includes(w));
      if (OVERRIDES[p.id] || (carries && c.born && Number(c.born.iso.slice(0, 4)) === p.year)) {
        hit = { it, c };
        break;
      }
    }
    if (!hit) {
      const seen = titles
        .map((t) => items.get(t))
        .filter(Boolean)
        .map((it) => `${it.title}${claims.get(it.qid)?.born ? ` (b. ${claims.get(it.qid).born.iso.slice(0, 4)})` : ""}`)
        .slice(0, 4);
      missing.push(`${p.kind} ${p.id}: ${p.name}, b. ${p.year} - found ${seen.join("; ") || "nothing"}`);
      continue;
    }
    const day = hit.c.born && hit.c.born.precision >= 11 ? hit.c.born.iso : undefined;
    out[p.id] = { title: hit.it.title, ...(day ? { born: day } : {}) };
    // A royal's house, where Wikidata names the family and it has an article.
    if (p.kind === "royal" && hit.c.family.length) {
      const fam = await claimsOf(hit.c.family);
      const house = hit.c.family.map((q) => fam.get(q)?.enwiki).find(Boolean);
      if (house) out[p.id].house = house;
    }
    console.log(`${p.kind.padEnd(7)} ${p.id.padEnd(22)} ${p.name}  →  ${hit.it.title}${day ? `  (${day})` : ""}${out[p.id].house ? `  [${out[p.id].house}]` : ""}`);
  }

  // Organisations: founded in the year the page gives, or named as the page names them.
  for (const a of alliances) {
    const titles = OVERRIDES[a.id] ? [OVERRIDES[a.id]] : [...new Set([...(await search(a.name, 5)), ...(await search(a.short, 3))])];
    const items = await itemsOf(titles);
    const claims = await claimsOf([...new Set([...items.values()].map((x) => x.qid))]);
    // The title is the organisation's own name, in full or as it is known: a longer title that carries the name is about something else.
    const named = (t) => plain(t) === plain(a.name) || plain(t) === plain(a.short);
    let hit = null;
    for (const t of titles) {
      const it = items.get(t);
      const c = it && claims.get(it.qid);
      if (!c || c.instance.includes("Q5")) continue;
      const year = c.inception ? Number(c.inception.iso.slice(0, 4)) : null;
      if (OVERRIDES[a.id] || (named(it.title) && (!a.founded || !year || year === a.founded)) || (a.founded && year === a.founded && named(t))) {
        hit = it;
        break;
      }
    }
    if (!hit) {
      missing.push(`alliance ${a.id}: ${a.name} (${a.short}), founded ${a.founded ?? "?"} - found ${titles.slice(0, 4).join("; ") || "nothing"}`);
      continue;
    }
    out[a.id] = { title: hit.title };
    console.log(`alliance ${a.id.padEnd(22)} ${a.short}  →  ${hit.title}`);
  }

  // Families: an article that carries the family's name.
  for (const f of families) {
    const surname = plain(f.family.replace(/\b(family|dynasty|house of|the)\b/gi, "").trim().split(/\s+/)[0] ?? "");
    const titles = OVERRIDES[f.id] ? [OVERRIDES[f.id]] : [...new Set([...(await search(f.family, 5)), ...(await search(`${f.family} ${f.country}`, 3))])];
    const items = await itemsOf(titles);
    const claims = await claimsOf([...new Set([...items.values()].map((x) => x.qid))]);
    let hit = null;
    for (const t of titles) {
      const it = items.get(t);
      const c = it && claims.get(it.qid);
      if (!c) continue;
      const isFamily = c.instance.some((q) => ["Q8436", "Q13417114", "Q164950", "Q171541"].includes(q)) || /\b(family|dynasty|house of)\b/i.test(it.title);
      if (OVERRIDES[f.id] || (isFamily && surname && plain(it.title).includes(surname))) {
        hit = it;
        break;
      }
    }
    if (!hit) {
      missing.push(`family ${f.id}: ${f.family} (${f.source}) - found ${titles.slice(0, 5).join("; ") || "nothing"}`);
      continue;
    }
    out[f.id] = { title: hit.title };
    console.log(`family  ${f.id.padEnd(22)} ${f.family}  →  ${hit.title}`);
  }

  const ids = Object.keys(out);
  fs.writeFileSync(
    OUT,
    `/**
 * The Wikipedia article for each person, family and organisation on the
 * World Leaders page, by the page's own id, and each person's date of birth.
 *
 * GENERATED by build-wiki-articles.cjs on ${new Date().toISOString().slice(0, 10)} — do not edit by hand;
 * change the script and re-run it. See that script for how each article is
 * found and checked (a person's by the year of birth the page gives).
 *
 * \`born\` is Wikidata's date of birth (P569), given to the day; \`house\` is
 * the article of the family Wikidata gives a royal (P53). An entry the
 * search did not settle has no article here, and its window says so.
 */
export const WIKI_ARTICLES_RETRIEVED = "${new Date().toISOString().slice(0, 10)}";

export type WikiArticle = { title: string; born?: string; house?: string };

export const WIKI_ARTICLES: Record<string, WikiArticle> = {
${ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(out[id])},`).join("\n")}
};
`,
  );
  console.log(`\nwrote ${path.relative(__dirname, OUT)}: ${ids.length} of ${people.length + alliances.length + families.length} entries`);
  if (missing.length) console.log(`\nNo article settled for ${missing.length}:\n  ${missing.join("\n  ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
