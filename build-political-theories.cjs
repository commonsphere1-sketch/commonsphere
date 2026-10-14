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
 * Beside its description, each has what three records state of it. An idea
 * with none of one kind has none shown.
 *
 *   its guide        Where the idea's Wikipedia article carries a sidebar of
 *   (Wikipedia,      its own - one whose title is the article itself, so the
 *   CC BY-SA)        sidebar of a wider subject is not taken - the parts of
 *                    it are read from the rendered page: its people, its
 *                    history, the countries and regions it has an article
 *                    for, its organizations, its works, its variants and its
 *                    principles, each under the sidebar's own heading. A
 *                    part of people is checked against Wikidata: only those
 *                    its record says are human and gives a date of death
 *                    for are kept, under the name it gives, the most widely
 *                    written-about first (by how many language editions of
 *                    Wikipedia have an article on them). No living person
 *                    is given an ideology on the strength of an editors'
 *                    list. A part is one of people where its heading says
 *                    so, or where nine in ten of its links are people; one
 *                    with no heading this script knows is otherwise not
 *                    taken. It is editors' own chosen list, and is said to
 *                    be.
 *   where it began   From its Wikidata record (CC0): its year of inception
 *                    where the record gives one to the year, its country or
 *                    place of origin, who founded it and what it is named
 *                    after.
 *   its parties      How many political parties' Wikidata records give it as
 *                    an ideology of theirs, past and present, and in how many
 *                    countries: a count of those records and no more,
 *                    given where there are ten at least.
 *   its countries    For a form of government the CIA World Factbook has a
 *                    word for (COUNTED): the countries and territories whose
 *                    type of government its final edition describes with
 *                    that word (static/law, built by build-country-law.cjs).
 *                    A count of wording, made here.
 *
 * Tried and left out: Wikidata's own lists of the people who hold an
 * ideology, of its movements, and of the states with a form of government.
 * They gave a living politician as a fascist and one country as the world's
 * only monarchy; no such list is shown.
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** A query of Wikidata, kept for a week; asked again a few times where the service is busy. */
async function sparql(key, query) {
  return cached(key, async () => {
    let last;
    for (let i = 0; i < 5; i++) {
      try {
        const t = await fetchText(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { Accept: "application/sparql-results+json" });
        await wait(350);
        return t;
      } catch (e) {
        last = e;
        await wait(4000 * (i + 1));
      }
    }
    throw last;
  });
}
/** A label that is a name, and not an item with no English label. */
const named = (b) => (b && !/^Q\d+$/.test(b.value) ? b.value : null);

/** What Wikidata records of each idea beyond its class: where it began, and how many parties' records give it as theirs. */
async function recordOf(ideas) {
  const out = new Map(ideas.map((e) => [e.id, {}]));
  // Its own statements, forty ideas a query. The year of its inception only where the record gives it to the year or closer.
  for (let i = 0; i < ideas.length; i += 40) {
    const ids = ideas.slice(i, i + 40).map((e) => `wd:${e.id}`).join(" ");
    const j = await sparql(
      `origin-${ids}`,
      `SELECT ?x ?k ?vLabel ?when ?precision WHERE { VALUES ?x { ${ids} }
  { ?x wdt:P112 ?v BIND("by" AS ?k) } UNION { ?x wdt:P138 ?v BIND("named" AS ?k) } UNION { ?x wdt:P495 ?v BIND("where" AS ?k) } UNION { ?x wdt:P740 ?v BIND("where" AS ?k) }
  UNION { ?x p:P571/psv:P571 [ wikibase:timeValue ?when ; wikibase:timePrecision ?precision ] BIND("when" AS ?k) }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`,
    );
    for (const b of j.results.bindings) {
      const m = out.get(b.x.value.split("/").pop());
      const k = b.k.value;
      if (k === "when") {
        const y = /^(-?)0*(\d+)-/.exec(b.when.value);
        if (y && Number(b.precision.value) >= 9) (m.when ||= new Set()).add(y[1] ? `${y[2]} BC` : y[2]);
        // "pan-" as what Pan-Africanism is named after is a prefix, not a namesake.
      } else if (named(b.vLabel) && !/-$/.test(b.vLabel.value)) (m[k] ||= new Set()).add(b.vLabel.value);
    }
  }
  for (const e of ideas) {
    // The parties whose record gives it as theirs, with the country of each: counted, and none named.
    const parties = await sparql(`parties-${e.id}`, `SELECT ?o ?oLabel ?n ?cLabel WHERE { ?o wdt:P1142 wd:${e.id} ; wdt:P31/wdt:P279* wd:Q7278 ; wikibase:sitelinks ?n . OPTIONAL { ?o wdt:P17 ?c } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`);
    const lands = new Set();
    const all = new Set();
    for (const b of parties.results.bindings) {
      all.add(b.o.value);
      if (named(b.cLabel)) lands.add(b.cLabel.value);
    }
    out.get(e.id).parties = { n: all.size, in: lands.size };
  }
  return out;
}

/* ── The idea's own sidebar in Wikipedia ── */
const ENTITY = { amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", ndash: "–", mdash: "—" };
const plain = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(\w+);/g, (m, n) => ENTITY[n] ?? m)
    .replace(/\s+/g, " ")
    .trim();
/** The sidebars of a page's HTML: each table of class "sidebar", whole, with the tables inside it. */
function sidebars(html) {
  const out = [];
  const open = /<table class="sidebar[ "]/g;
  let m;
  while ((m = open.exec(html))) {
    let depth = 0;
    const tag = /<table\b|<\/table>/g;
    tag.lastIndex = m.index;
    let t;
    while ((t = tag.exec(html))) {
      depth += t[0] === "</table>" ? -1 : 1;
      if (depth === 0) break;
    }
    if (!t) break;
    out.push(html.slice(m.index, t.index));
    open.lastIndex = t.index;
  }
  return out;
}
/** What a part of a sidebar holds, by its heading: the first that fits. A heading none fits is not taken, unless the part is of people. */
const KINDS = [
  ["skip", /\brelated\b|\bsee also\b|\blists?\b/i],
  ["people", /\b(people|persons?|thinkers|theorists|philosophers|intellectuals|politicians|figures|proponents|leaders|activists|writers|commentators|theologians|economists|ideologues|pioneers|individuals|advocates|personalities|scholars|authors|founders|statesmen|heads of state|presidents|prime ministers|jurists|journalists|theoreticians|historians)\b/i],
  ["places", /\b(by (country|region|state|continent|location|nation)|countries|regional|regions|national variants|worldwide|around the world)\b/i],
  ["history", /\b(history|origins?|events|timelines?)\b/i],
  ["groups", /\b(organi[sz]ations?|parties|movements|groups|internationals|institutions|unions|think tanks)\b/i],
  ["works", /\b(works|literature|texts|books|writings|publications|documents)\b/i],
  ["variants", /\b(schools|variants|types|branches|forms|tendencies|currents|traditions|ideologies|strands|factions|varieties)\b/i],
  ["ideas", /\b(principles|concepts|ideas|themes|tenets|theory|theories|core|values|topics|philosophy|aspects|issues|policies|thought|ideology|economics)\b/i],
];
/** How many of a part are kept, the first the sidebar lists - or, of people, the most widely written-about. */
const KEEP = { people: 12, places: 100, history: 12, groups: 12, works: 10, variants: 14, ideas: 14 };
/** The sidebar of an article that is the article's own - its title is the article - as its headed parts, each with its links. */
function sidebarOf(title, html) {
  for (const table of sidebars(html)) {
    const head = /<t[hd] class="sidebar-title[^"]*"[^>]*>([\s\S]*?)<\/t[hd]>/.exec(table);
    if (!head) continue;
    const own = /mw-selflink/.test(head[1]) || plain(head[1]).toLowerCase() === title.replace(/ \(.*\)$/, "").toLowerCase();
    if (!own) continue;
    // The template it is: the "view" link of the bar at its foot.
    const from = /href="\/wiki\/(Template:[^"]+)"[^>]*><abbr title="View this template"/.exec(table);
    const marks = [...table.matchAll(/<(div|th) class="(?:sidebar-list-title|sidebar-heading)[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)];
    const parts = [];
    marks.forEach((m, i) => {
      const body = table.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : table.length);
      const seen = new Set();
      const links = [...body.matchAll(/<a href="\/wiki\/([^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)]
        .map((a) => ({ to: decodeURIComponent(a[1]).replace(/_/g, " "), label: plain(a[2]) }))
        .filter((a) => a.label && !/^(Template|Template talk|Category|File|Portal|Help|Wikipedia|Special|Talk):/.test(a.to) && !seen.has(a.to) && seen.add(a.to));
      const heading = plain(m[2]);
      if (links.length && heading) parts.push({ title: heading, kind: KINDS.find(([, re]) => re.test(heading))?.[0] ?? null, links });
    });
    if (parts.length) return { from: from ? decodeURIComponent(from[1]).replace(/_/g, " ") : null, parts };
  }
  return null;
}
/** The people among Wikipedia's articles, by title: each one Wikidata's record says is human, with the name it gives, how many language editions write of them, and whether it gives a date of death. */
async function humansOf(titles) {
  const item = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const j = await cached(`items-${batch.join("|")}`, () => fetchText(`https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`));
    // A title as it was asked for, through its normalized form and what it redirects to.
    const step = new Map([...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])].map((r) => [r.from, r.to]));
    const got = new Map((j.query?.pages ?? []).map((p) => [p.title, p.pageprops?.wikibase_item]));
    for (const t of batch) {
      let to = t;
      for (let hop = 0; hop < 4 && step.has(to); hop++) to = step.get(to);
      if (got.get(to)) item.set(t, got.get(to));
    }
  }
  const ids = [...new Set(item.values())];
  const human = new Map();
  for (let i = 0; i < ids.length; i += 150) {
    const batch = ids.slice(i, i + 150);
    const j = await sparql(`humans-${batch.join(" ")}`, `SELECT ?p ?pLabel ?n ?dead WHERE { VALUES ?p { ${batch.map((q) => `wd:${q}`).join(" ")} } ?p wdt:P31 wd:Q5 ; wikibase:sitelinks ?n . BIND(EXISTS { ?p wdt:P570 ?died } AS ?dead) SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`);
    for (const b of j.results.bindings) if (named(b.pLabel)) human.set(b.p.value.split("/").pop(), { name: b.pLabel.value, n: Number(b.n.value), dead: b.dead.value === "true" });
  }
  return new Map([...item].flatMap(([t, q]) => (human.has(q) ? [[t, human.get(q)]] : [])));
}

/**
 * The forms of government the CIA World Factbook has a word for, and the word: a country is counted under one where
 * the first clause of its "government type" has it. Only those whose word the Factbook uses for every state of the
 * kind: it calls North Korea alone a "single-party" state and forty-five places a "democracy", so neither is counted.
 */
const COUNTED = {
  Monarchy: ["monarchy", /\bmonarch/i],
  Republic: ["republic", /\brepublic\b/i],
  Federation: ["federal", /\bfederal|\bfederation\b/i],
  "Parliamentary system": ["parliamentary", /\bparliamentary\b/i],
  Theocracy: ["theocratic", /\btheocra/i],
  Dictatorship: ["dictatorship", /\bdictatorship\b/i],
  "Military government": ["military", /\bmilitary\b/i],
  Communism: ["communist", /\bcommunist\b/i],
};
/** Each country's type of government, in the Factbook's words, from the files build-country-law.cjs wrote. */
function governmentTypes() {
  const dir = path.join(__dirname, "static/law");
  return fs.readdirSync(dir).flatMap((f) => {
    const type = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).gov?.type;
    return type ? [[f.slice(0, 2), type.split(";")[0]]] : [];
  });
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
    kept.push({ kind: e.kind, name: e.title.charAt(0).toUpperCase() + e.title.slice(1), classed: e.classed, said, sources, id: e.id, title: e.title });
  }
  if (kept.length < 80) throw new Error(`only ${kept.length} entries kept`);
  // Where each began and how many parties are of it, from Wikidata; its guide, from its own sidebar in Wikipedia; its countries, from the Factbook's wording.
  const record = await recordOf(kept);
  const guides = new Map();
  for (const e of kept) {
    const j = await cached(`lead-${e.title}`, () => fetchText(`https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=parse&prop=text&section=0&redirects=1&page=${encodeURIComponent(e.title)}`));
    const g = sidebarOf(e.title, j.parse?.text ?? "");
    if (g) guides.set(e.id, g);
  }
  // Every article a part links to, asked of Wikidata at once: a part may be of people whatever it is headed.
  const asked = new Set();
  for (const g of guides.values()) for (const p of g.parts) if (p.kind !== "skip" && p.kind !== "places") for (const l of p.links) asked.add(l.to);
  const humans = await humansOf([...asked]);
  const types = governmentTypes();
  const tally = { origin: 0, parties: 0, guide: 0, people: 0, places: 0, states: 0 };
  const list = (s) => (s?.size ? [...s].sort() : undefined);
  for (const e of kept) {
    const m = record.get(e.id);
    const origin = JSON.parse(JSON.stringify({ when: list(m.when)?.[0], where: list(m.where), by: list(m.by), named: list(m.named) }));
    if (Object.keys(origin).length) (e.origin = origin), tally.origin++;
    // A count of parties where the record lists ten at least: one party of "monarchy" says nothing of monarchy.
    if (m.parties.n >= 10) (e.parties = m.parties), tally.parties++;
    const counted = COUNTED[e.name];
    if (counted) {
      const codes = types.filter(([, type]) => counted[1].test(type)).map(([cc]) => cc).sort();
      if (codes.length) (e.states = { word: counted[0], codes }), tally.states++;
    }
    const g = guides.get(e.id);
    if (g) {
      const parts = [];
      /** Everyone in its parts of people, by name. */
      const names = new Map();
      for (const p of g.parts) {
        const people = p.links.flatMap((l) => (humans.has(l.to) ? [humans.get(l.to)] : []));
        // A part is of people where its heading says so, or where nine in ten of it are and it has three at least: a sidebar may head its thinkers "Philosophy" or by their school.
        const kind = p.kind === "skip" || p.kind === "places" || p.kind === "people" ? p.kind : people.length >= 3 && people.length >= p.links.length * 0.9 ? "people" : p.kind;
        if (!kind || kind === "skip") continue;
        if (kind === "people") {
          // Those no longer living: no living person is given an ideology on the strength of an editors' list.
          const byName = new Map(people.filter((h) => h.dead).map((h) => [h.name, h]));
          const ranked = [...byName.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
          for (const h of ranked) names.set(h.name, h);
          if (ranked.length) parts.push({ kind, title: p.title, items: ranked.map((h) => h.name), of: ranked.length });
          // A country or region is given as the sidebar words it ("Egypt"); anything else by its article's title ("Classical liberalism", not "Classical").
        } else {
          const items = [...new Set(p.links.map((l) => (kind === "places" ? l.label.charAt(0).toUpperCase() + l.label.slice(1) : l.to)))];
          parts.push({ kind, title: p.title, items, of: items.length });
        }
      }
      // More than three parts of people - a sidebar that sets its thinkers out by school - are given as one.
      const people = parts.filter((p) => p.kind === "people");
      if (people.length > 3) {
        const ranked = [...names.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
        const at = parts.indexOf(people[0]);
        const others = parts.filter((p) => p.kind !== "people");
        others.splice(Math.min(at, others.length), 0, { kind: "people", title: "People", items: ranked.map((h) => h.name), of: ranked.length });
        parts.length = 0;
        parts.push(...others);
      }
      for (const p of parts) p.items = p.items.slice(0, KEEP[p.kind]);
      if (parts.length) {
        e.guide = { from: g.from ?? undefined, parts };
        tally.guide++;
        if (parts.some((p) => p.kind === "people")) tally.people++;
        if (parts.some((p) => p.kind === "places")) tally.places++;
      }
    }
    // What the added detail stands on, before the Wikipedia article: the list ends with Wikipedia.
    const added = [];
    if (e.states) added.push({ label: "CIA World Factbook, final edition (January 2026) — Government type (public domain)", url: "https://github.com/factbook/factbook.json" });
    if (e.origin || e.parties) added.push({ label: `Wikidata — its record, ${e.id} (CC0)`, url: `https://www.wikidata.org/wiki/${e.id}` });
    const wiki = e.sources.findIndex((s) => s.label.startsWith("Wikipedia"));
    e.sources.splice(wiki, 0, ...added);
    if (e.guide?.from) e.sources.push({ label: `Wikipedia — its sidebar on the subject (${e.guide.from})`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(e.guide.from.replace(/ /g, "_"))}` });
    delete e.id;
    delete e.title;
  }
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
 *
 * Beside the description, what three records state, each said to be whose:
 * ${tally.guide} have a guide - the parts of the idea's own sidebar in Wikipedia: its
 * people (${tally.people}; each one Wikidata's record says is human and no longer living,
 * the most widely written-about first), its history, the countries it has an article for
 * (${tally.places}), its organizations, works, variants and principles; ${tally.origin} have an
 * origin and ${tally.parties} a count of parties, from the idea's Wikidata record (CC0);
 * and ${tally.states} have the countries whose type of government the CIA World Factbook
 * describes with the idea's word. A count is of what the record lists, not
 * of every party there has been.
 */
export const POLITICAL_THEORIES_RETRIEVED = "${today}";

export type PoliticalIdea = {
  kind: "theory" | "governance";
  name: string;
  /** What Wikidata classes it as. */
  classed: string;
  said: string;
  sources: { label: string; url: string }[];
  /** Where it began, as its Wikidata record states it: the year, the country or place, who founded it, what it is named after. */
  origin?: { when?: string; where?: string[]; by?: string[]; named?: string[] };
  /** How many political parties' Wikidata records give it as an ideology of theirs, past and present, and in how many countries. */
  parties?: { n: number; in: number };
  /** The countries and territories whose type of government the CIA World Factbook describes with this word, by ISO 3166-1 code. */
  states?: { word: string; codes: string[] };
  /** The parts of its own sidebar in Wikipedia, each under the sidebar's heading: its items are the first it lists - of people, the most widely written-about - and "of" is how many it lists in all. */
  guide?: { from?: string; parts: PoliticalGuidePart[] };
};
export type PoliticalGuidePart = { kind: "people" | "places" | "history" | "groups" | "works" | "variants" | "ideas"; title: string; items: string[]; of: number };

export const POLITICAL_IDEAS: PoliticalIdea[] = [
${kept.map((e) => `  ${JSON.stringify(e)},`).join("\n")}
];
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  classed ${all.length}; kept ${kept.length} (theories ${count("theory")}, governance ${count("governance")}); dropped ${JSON.stringify(dropped)}`);
  console.log(`  with a guide ${tally.guide} (people ${tally.people}, places ${tally.places}), an origin ${tally.origin}, parties ${tally.parties}, states ${tally.states}`);
  for (const name of ["Marxism", "Liberalism", "Fascism", "Monarchy"]) {
    const e = kept.find((x) => x.name === name);
    if (!e) continue;
    console.log(`  ${name}: ${JSON.stringify({ origin: e.origin, parties: e.parties, states: e.states && { word: e.states.word, n: e.states.codes.length } })}`);
    for (const p of e.guide?.parts ?? []) console.log(`     [${p.kind}] ${p.title} · ${p.items.length} of ${p.of}: ${p.items.slice(0, 12).join("; ")}`);
  }
  console.log(`  with Stanford ${kept.filter((e) => e.sources.some((s) => /Stanford/.test(s.label))).length}, IEP ${kept.filter((e) => e.sources.some((s) => /Internet Enc/.test(s.label))).length}, Britannica ${kept.filter((e) => e.sources.some((s) => /Britannica/.test(s.label))).length}`);
  console.log(`  theories: ${kept.filter((e) => e.kind === "theory").map((e) => e.name).join(", ").slice(0, 1100)}`);
  console.log(`  governance: ${kept.filter((e) => e.kind === "governance").map((e) => e.name).join(", ").slice(0, 700)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
