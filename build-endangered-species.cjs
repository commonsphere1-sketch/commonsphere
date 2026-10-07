/**
 * Builds src/data/endangeredSpecies.ts — endangered and critically endangered
 * mammals and birds, with about how many of each are left.
 *
 * The IUCN Red List is the list of record, but its data are licensed for
 * non-commercial use and its site turns a build away, so it is not read here.
 * What is read is open:
 *
 *   Wikipedia, "Lists of        The lists of mammals and of birds by
 *     organisms by population"  population, order by order: each row a
 *     (CC BY-SA)                species or subspecies with its scientific
 *                               name, an estimate of its numbers, its Red
 *                               List category and whether it is growing or
 *                               shrinking, cited there to the Red List
 *                               assessment or a survey. The revision of each
 *                               list read is recorded.
 *   Wikidata (CC0)              The Red List category it holds for the same
 *                               scientific name (P225, P141).
 *
 * A row is kept only where the two agree: the list calls it Endangered or
 * Critically Endangered, and Wikidata holds the same category for that
 * scientific name. A row whose category differs, or that Wikidata has no
 * category for (most subspecies), is left out and counted. So the list is
 * short of the whole - it is what two open records agree on, not every
 * endangered species - and it says so.
 *
 * The number left is the list's own words ("20-30", "fewer than 250"): an
 * estimate, often of mature animals only, and of the year its source gives.
 * The lowest figure in it is taken only to put the rows in order.
 *
 *   node build-endangered-species.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/endangeredSpecies.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-endangered-species");
fs.mkdirSync(CACHE, { recursive: true });

const WIKI = "https://en.wikipedia.org/w/api.php";
const SPARQL = "https://query.wikidata.org/sparql";
/** The lists read, and the group each is shown under. */
const LISTS = [
  ["Primates", "List of primates by population"],
  ["Carnivores", "List of carnivorans by population"],
  ["Whales and dolphins", "List of cetaceans by population"],
  ["Hoofed mammals", "List of even-toed ungulates by population"],
  ["Hoofed mammals", "List of odd-toed ungulates by population"],
  ["Elephants", "List of elephant species by population"],
  ["Marsupials", "List of marsupials by population"],
  ["Bats", "List of bats by population"],
  ...[
    "Anseriformes",
    "Apodiformes",
    "Caprimulgiformes",
    "Charadriiformes",
    "Ciconiiformes",
    "Columbiformes",
    "Coraciiformes",
    "Cuculiformes",
    "Falconiformes",
    "Galliformes",
    "Gaviiformes",
    "Gruiformes",
    "Passeriformes",
    "Pelecaniformes",
    "Phoenicopteriformes",
    "Piciformes",
    "Podicipediformes",
    "Procellariiformes",
    "Psittaciformes",
    "Sphenisciformes",
    "Strigiformes",
    "Struthioniformes",
    "Tinamiformes",
    "Trogoniformes",
  ].map((order) => ["Birds", `List of ${order} by population`]),
];
/** Wikidata's items for the Red List's categories. */
const CATEGORY = { Q219127: "CR", Q96377276: "EN", Q11394: "EN", Q278113: "VU", Q719675: "NT", Q211005: "LC", Q239509: "EW", Q237350: "EX", Q3245245: "DD" };

async function cached(name, get) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return fs.readFileSync(at, "utf8");
  const text = await get();
  fs.writeFileSync(at, text);
  return text;
}
const fetchText = async (url, init) => {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`${url.slice(0, 90)}: HTTP ${res.status}`);
  return res.text();
};

/** Wikitext as plain words: references and templates out, a link as its label. */
function plain(cell) {
  let s = cell.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (let before = ""; before !== s; ) {
    before = s;
    s = s.replace(/\{\{[^{}]*\}\}/g, "");
  }
  return s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/'{2,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The rows of a list that are Endangered or Critically Endangered and give a number. */
function rowsOf(group, title, wikitext) {
  const out = [];
  // References hold pipes of their own; they go before the row is cut into cells.
  const text = wikitext.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
  // Which column holds what, from the table's own heading: the lists do not all keep one order.
  let at = { name: 0, scientific: 1, left: 2 };
  for (const raw of text.split(/\n\|-[^\n]*\n/)) {
    const row = raw.split(/\n\|\}/)[0];
    // A heading may open the table with no row mark before it, after the page's prose.
    const headLines = row.split("\n").filter((l) => l.startsWith("!"));
    if (headLines.length >= 3) {
      const heads = headLines
        .join("\n")
        .replace(/^!/, "")
        .split(/!!|\n!/)
        .map((h) => plain(h.replace(/^[^|\[]*\|/, "")).toLowerCase());
      const find = (re) => heads.findIndex((h) => re.test(h));
      const found = { name: find(/^(common )?name|species/), scientific: find(/binomial|scientific/), left: find(/population|estimate/) };
      if (found.scientific >= 0 && found.left >= 0) at = { name: found.name >= 0 ? found.name : 0, scientific: found.scientific, left: found.left };
      continue;
    }
    const status = (row.match(/\{\{\s*IUCN[ -]?(?:status\s*\|\s*)?(CR|EN)\b/i) || [])[1];
    if (!status) continue;
    const cells = row
      .replace(/^[\s|]+/, "")
      .split(/\|\||\n\|/)
      .map((c) => c.replace(/^\s*(?:[a-z-]+\s*=\s*"?[^|"]*"?\s*)+\|/i, "").trim());
    if (cells.length <= Math.max(at.name, at.scientific, at.left)) continue;
    const article = (cells[at.name].match(/\[\[([^\]|#]+)/) || [])[1];
    // The common name is the row's first line; other names follow it in brackets.
    const name = plain(cells[at.name].split("\n")[0]).replace(/\s*\(.*\)\s*$/, "");
    // The scientific name is what is in italics; who named it, and when, may follow in small type.
    const scientific = plain((cells[at.scientific].match(/''([^']+)''/) || [, cells[at.scientific]])[1]);
    // A year or a note in small type after the figure is not part of it.
    const left = plain(cells[at.left].replace(/<small>[\s\S]*?<\/small>/gi, "")).replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
    const counts = (left.match(/\d[\d,]*/g) || []).map((n) => Number(n.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
    if (!article || !name || !/^[A-Z][a-z]+ [a-z-]+( [a-z-]+)?$/.test(scientific) || !counts.length) continue;
    const trend = (row.match(/\{\{\s*(decrease|increase|steady)\b/i) || [])[1];
    out.push({ group, list: title, name, article: article.trim(), scientific, status: status.toUpperCase(), left, low: Math.min(...counts), ...(trend ? { trend: trend.toLowerCase() } : {}) });
  }
  return out;
}

/** Wikidata's Red List category for each scientific name. */
async function categories(names) {
  const got = new Map();
  for (let i = 0; i < names.length; i += 80) {
    const batch = names.slice(i, i + 80);
    const query = `SELECT ?name ?status WHERE { VALUES ?name { ${batch.map((n) => JSON.stringify(n)).join(" ")} } ?taxon wdt:P225 ?name ; wdt:P141 ?status . }`;
    // The answer is kept under the names asked for, so a changed list asks again.
    const text = await cached(`wd-${crypto.createHash("md5").update(batch.join("|")).digest("hex")}.json`, () => fetchText(`${SPARQL}?format=json&query=${encodeURIComponent(query)}`, { headers: { Accept: "application/sparql-results+json" } }));
    for (const b of JSON.parse(text).results.bindings) {
      const id = b.status.value.split("/").pop();
      const set = got.get(b.name.value) ?? new Set();
      set.add(CATEGORY[id] ?? id);
      got.set(b.name.value, set);
    }
  }
  return got;
}

(async () => {
  const read = [];
  const all = [];
  for (const [group, title] of LISTS) {
    const j = JSON.parse(await cached(`${title.replace(/[^a-z0-9]+/gi, "_")}.json`, () => fetchText(`${WIKI}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|revid&redirects=1&format=json&formatversion=2`)));
    if (!j.parse) {
      read.push({ title, group, revision: null, rows: 0 });
      continue;
    }
    const rows = rowsOf(group, j.parse.title, j.parse.wikitext);
    read.push({ title: j.parse.title, group, revision: j.parse.revid, rows: rows.length });
    all.push(...rows);
  }
  // A species two lists hold is taken once, from the first.
  const seen = new Set();
  const listed = all.filter((r) => (seen.has(r.scientific) ? false : seen.add(r.scientific)));
  const held = await categories(listed.map((r) => r.scientific));
  const kept = [];
  const dropped = { none: 0, differs: 0 };
  for (const r of listed) {
    const cats = held.get(r.scientific);
    if (!cats) dropped.none++;
    else if (cats.size !== 1 || !cats.has(r.status)) dropped.differs++;
    else kept.push(r);
  }
  if (kept.length < 100) throw new Error(`only ${kept.length} species agree: a list or the query has changed`);
  kept.sort((a, b) => a.low - b.low || a.name.localeCompare(b.name));
  const today = new Date().toISOString().slice(0, 10);
  const lists = read.filter((l) => l.revision !== null);

  fs.writeFileSync(
    OUT,
    `/**
 * Endangered and critically endangered mammals and birds, with about how many
 * of each are left - fewest first.
 *
 * GENERATED by build-endangered-species.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each row is a row of one of Wikipedia's lists of mammals and birds by
 * population: the name, the scientific name, the number left in the list's
 * own words, the Red List category and the trend. It is here only because
 * Wikidata holds the same Red List category for that scientific name. ${listed.length}
 * rows of the lists were Endangered or Critically Endangered with a number;
 * ${kept.length} are kept, ${dropped.none} are left out because Wikidata has no category for the
 * name (most are subspecies) and ${dropped.differs} because its category differs. So this
 * is what two open records agree on, not every endangered species: the IUCN
 * Red List, the list of record, is not open to this site.
 *
 * A number is an estimate, often of mature animals only, from the year its
 * source gives; \`low\` is its lowest figure, for putting rows in order.
 */
export const ENDANGERED_SOURCES = {
  hub: { label: "Wikipedia — Lists of organisms by population", url: "https://en.wikipedia.org/wiki/Lists_of_organisms_by_population" },
  wikidata: { label: "Wikidata — IUCN conservation status (P141) by taxon name (P225)", url: "https://www.wikidata.org/wiki/Property:P141" },
  redList: { label: "IUCN Red List of Threatened Species", url: "https://www.iucnredlist.org/" },
  retrieved: "${today}",
  /** Rows of the lists that were Endangered or Critically Endangered with a number, and what became of them. */
  listed: ${listed.length},
  kept: ${kept.length},
  noCategory: ${dropped.none},
  categoryDiffers: ${dropped.differs},
};

/** The lists read, each with its revision and the rows it gave. */
export const ENDANGERED_LISTS: { title: string; group: string; revision: number; rows: number }[] = ${JSON.stringify(lists.filter((l) => l.rows > 0))};

export type EndangeredSpecies = {
  name: string;
  /** The title of its Wikipedia article. */
  article: string;
  scientific: string;
  group: string;
  /** CR: Critically Endangered. EN: Endangered. */
  status: "CR" | "EN";
  /** About how many are left, as the list words it. */
  left: string;
  low: number;
  trend?: "decrease" | "increase" | "steady";
};

export const ENDANGERED_SPECIES: EndangeredSpecies[] = [
${kept.map((r) => `  { name: ${JSON.stringify(r.name)}, article: ${JSON.stringify(r.article)}, scientific: ${JSON.stringify(r.scientific)}, group: ${JSON.stringify(r.group)}, status: "${r.status}", left: ${JSON.stringify(r.left)}, low: ${r.low}${r.trend ? `, trend: "${r.trend}"` : ""} },`).join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  lists read ${lists.length} of ${LISTS.length}; missing: ${read.filter((l) => l.revision === null).map((l) => l.title).join(", ") || "none"}`);
  console.log(`  rows by list: ${read.filter((l) => l.rows).map((l) => `${l.title.replace(/^List of | by population$/g, "")} ${l.rows}`).join(", ")}`);
  console.log(`  no rows read from: ${read.filter((l) => l.revision !== null && !l.rows).map((l) => l.title.replace(/^List of | by population$/g, "")).join(", ") || "none"}`);
  console.log(`  listed ${listed.length}; kept ${kept.length}; no category ${dropped.none}; differs ${dropped.differs}`);
  const by = (k) => Object.entries(kept.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {})).map(([a, n]) => `${a} ${n}`).join(", ");
  console.log(`  ${by("group")} · ${by("status")}`);
  for (const r of kept.slice(0, 25)) console.log(`    ${r.left.padEnd(22)} ${r.status} ${r.name} (${r.scientific}) ${r.trend ?? ""}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
