/**
 * Builds src/data/politicalTheories.ts — political theories and ideologies,
 * and forms of governance, each described and each with works to read.
 *
 * There is no one official register of political ideas. The set here is
 * drawn so that every entry stands on more than one work of reference:
 *
 *   Wikidata (CC0)        What is classed as a political ideology or a
 *                         political philosophy (the theories), and as a form
 *                         of government or a political system (governance) -
 *                         kept only where it has an article in the English
 *                         Wikipedia AND an entry in at least one of the
 *                         Encyclopaedia Britannica, the Stanford Encyclopedia
 *                         of Philosophy and the Internet Encyclopedia of
 *                         Philosophy, by the identifiers Wikidata holds.
 *   Wikipedia (CC BY-SA)  The opening of the article: the description shown.
 *                         It is the one of these works whose words are open
 *                         to reuse; the others are linked to be read and
 *                         cited, and none of their text is taken.
 *
 * An entry whose opening does not say that it is an ideology, a philosophy,
 * a doctrine, a theory, a movement or a system or form of government is left
 * out and counted: Wikidata classes some events and nicknames as ideologies,
 * and this is the check against them. So the list is what several reference
 * works agree is a political theory or a form of governance - wide, but not
 * "all" of them, and it says so.
 *
 *   node build-political-theories.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/politicalTheories.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-political-theories");
fs.mkdirSync(CACHE, { recursive: true });

const CLASSES = [
  ["theory", "Q12909644", "political ideology"],
  ["theory", "Q179805", "political philosophy"],
  ["governance", "Q1307214", "form of government"],
  ["governance", "Q28108", "political system"],
];
const IS_ONE = {
  theory: /\b(ideolog|philosoph|doctrine|theor|movement|school of thought|worldview|belief|principle|stance|position|tradition|political|policy)/i,
  governance: /\b(form of government|system of government|government|political system|regime|rule|state|system|polity|governance)/i,
};
const MAX = 620;

async function cached(key, get) {
  const at = path.join(CACHE, `${crypto.createHash("md5").update(key).digest("hex")}.json`);
  // A list of ideas does not change by the day, and the query service is slow on the largest class: a week.
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 7 * 24 * 3600e3) return JSON.parse(fs.readFileSync(at, "utf8"));
  const text = await get();
  fs.writeFileSync(at, text);
  return JSON.parse(text);
}
const fetchText = async (url, headers = {}) => {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
  if (!res.ok) throw new Error(`${url.slice(0, 80)}: HTTP ${res.status}`);
  return res.text();
};

/** The opening of an article, cut at the end of a sentence. */
function opening(extract) {
  const text = (extract ?? "").replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").trim();
  if (text.length <= MAX) return text.length >= 80 ? text : null;
  const cut = text.slice(0, MAX);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".) "));
  return end > 120 ? cut.slice(0, end + 1) : null;
}

(async () => {
  const found = new Map();
  for (const [kind, cls, label] of CLASSES) {
    const query = `SELECT ?x ?article ?brit ?sep ?iep WHERE {
  { ?x wdt:P31 wd:${cls} } UNION { ?x wdt:P279 wd:${cls} }
  ?article schema:about ?x ; schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL { ?x wdt:P1417 ?brit } OPTIONAL { ?x wdt:P3123 ?sep } OPTIONAL { ?x wdt:P5088 ?iep }
  FILTER(BOUND(?brit) || BOUND(?sep) || BOUND(?iep))
}`;
    const j = await cached(`sparql-${cls}`, () => fetchText(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { Accept: "application/sparql-results+json" }));
    for (const b of j.results.bindings) {
      const id = b.x.value.split("/").pop();
      const title = decodeURIComponent(b.article.value.split("/wiki/").pop()).replace(/_/g, " ");
      const e = found.get(id) ?? { id, kind, classed: label, title, brit: new Set(), sep: new Set(), iep: new Set() };
      if (b.brit) e.brit.add(b.brit.value);
      if (b.sep) e.sep.add(b.sep.value);
      if (b.iep) e.iep.add(b.iep.value);
      found.set(id, e);
    }
  }
  const all = [...found.values()];
  // The opening of each article.
  const titles = all.map((e) => e.title);
  const intro = new Map();
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20);
    const j = await cached(`intro-${batch.join("|")}`, () =>
      fetchText(`https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&prop=extracts&exintro=1&explaintext=1&exlimit=20&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`),
    );
    const back = new Map([...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])].map((r) => [r.to, r.from]));
    for (const p of j.query?.pages ?? []) {
      intro.set(p.title, p.extract);
      if (back.has(p.title)) intro.set(back.get(p.title), p.extract);
    }
  }
  const kept = [];
  const dropped = { noOpening: 0, notOne: 0 };
  for (const e of all) {
    const said = opening(intro.get(e.title));
    if (!said) {
      dropped.noOpening++;
      continue;
    }
    if (!IS_ONE[e.kind].test(said.split(/(?<=[.!?])\s/).slice(0, 2).join(" "))) {
      dropped.notOne++;
      continue;
    }
    const one = (set) => [...set].sort()[0];
    const sources = [];
    if (e.sep.size && /^[\w-]+$/.test(one(e.sep))) sources.push({ label: "Stanford Encyclopedia of Philosophy", url: `https://plato.stanford.edu/entries/${one(e.sep)}/` });
    if (e.iep.size && /^[\w-]+$/.test(one(e.iep))) sources.push({ label: "Internet Encyclopedia of Philosophy", url: `https://iep.utm.edu/${one(e.iep)}/` });
    if (e.brit.size && /^[\w\-/]+$/.test(one(e.brit))) sources.push({ label: "Encyclopaedia Britannica", url: `https://www.britannica.com/${one(e.brit)}` });
    if (!sources.length) continue;
    sources.push({ label: `Wikipedia — ${e.title}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(e.title.replace(/ /g, "_"))}` });
    kept.push({ kind: e.kind, name: e.title.charAt(0).toUpperCase() + e.title.slice(1), classed: e.classed, said, sources });
  }
  if (kept.length < 80) throw new Error(`only ${kept.length} entries kept`);
  kept.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  const today = new Date().toISOString().slice(0, 10);
  const count = (k) => kept.filter((e) => e.kind === k).length;

  fs.writeFileSync(
    OUT,
    `/**
 * Political theories and ideologies, and forms of governance: each described,
 * and each with works to read.
 *
 * GENERATED by build-political-theories.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * ${count("theory")} theories and ${count("governance")} forms of governance: what Wikidata classes as a political
 * ideology or philosophy, or as a form of government or political system, and
 * that has both an English Wikipedia article and an entry in the Encyclopaedia
 * Britannica, the Stanford Encyclopedia of Philosophy or the Internet
 * Encyclopedia of Philosophy. ${dropped.notOne} were left out because their article's opening
 * does not say they are one, and ${dropped.noOpening} for want of an opening.
 *
 * \`said\` is the opening of the Wikipedia article, the one of these works
 * whose words are open to reuse. \`sources\` lists the others first, to be read
 * and cited; none of their text is taken. Wide, but not every political idea:
 * one that no second reference work has an entry for is not here.
 */
export const POLITICAL_THEORIES_RETRIEVED = "${today}";

export type PoliticalIdea = {
  kind: "theory" | "governance";
  name: string;
  /** What Wikidata classes it as. */
  classed: string;
  said: string;
  sources: { label: string; url: string }[];
};

export const POLITICAL_IDEAS: PoliticalIdea[] = [
${kept.map((e) => `  ${JSON.stringify(e)},`).join("\n")}
];
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  classed ${all.length}; kept ${kept.length} (theories ${count("theory")}, governance ${count("governance")}); dropped ${JSON.stringify(dropped)}`);
  console.log(`  with Stanford ${kept.filter((e) => e.sources.some((s) => /Stanford/.test(s.label))).length}, IEP ${kept.filter((e) => e.sources.some((s) => /Internet Enc/.test(s.label))).length}, Britannica ${kept.filter((e) => e.sources.some((s) => /Britannica/.test(s.label))).length}`);
  console.log(`  theories: ${kept.filter((e) => e.kind === "theory").map((e) => e.name).join(", ").slice(0, 1100)}`);
  console.log(`  governance: ${kept.filter((e) => e.kind === "governance").map((e) => e.name).join(", ").slice(0, 700)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
