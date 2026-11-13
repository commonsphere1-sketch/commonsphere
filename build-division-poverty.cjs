#!/usr/bin/env node
/**
 * Builds static/poverty/divisions.json - poverty and inequality for the states, provinces and regions of every country the
 * World Bank's Subnational Poverty and Inequality Database covers, as asked - for the division cards and windows.
 *
 *   World Bank, Subnational Poverty and Inequality Database (SPID), Fall 2026 release (AM26), CC BY 4.0:
 *   https://datacatalog.worldbank.org/search/dataset/0064796 - the file "AM26 - SPID data.xlsx", downloaded to
 *   data-raw/spid/ (kept out of the repository) and unpacked there. Its own estimates from household surveys, for each
 *   region a survey can speak for: the share of people below $3.00, $4.20 and $8.30 a day (2021 PPP), and the Gini index,
 *   of income or of consumption as the survey measures it.
 *
 * A figure is held for a division only where the survey's region is that division - the same land - and nothing says
 * otherwise. So:
 *   - Only surveys that cover the whole country ("N"), never one of towns alone, and the whole population of each region.
 *   - A region is matched to the site's division by its name - the division's name, its official or native name, or its
 *     Wikipedia article's title, accents, case and words such as "province", "region" or "state" aside - and only where
 *     exactly one of the country's divisions answers to it.
 *   - A survey's split of the country is used only where it has as many regions as the site has divisions, and three in four
 *     or more answer to one each: the two are then the same map, a few names spelled apart. A split into fewer, larger
 *     regions ("District Tunis" is four governorates) or into more, smaller ones is not used - a name it shares with a
 *     division may not be the same land.
 *   - Of the splits that qualify, each country's latest survey year, and in it the split with the most matches.
 *   - The same name is not always the same land over time: a division is left out where its Wikidata record shows that
 *     the survey and the site's map stand on different sides of a change to it - a division separated from it (P807)
 *     that is on the one and not the other, one merged into it or replaced by it (P7888, P1366) likewise, or it was
 *     founded after the survey (P571) or ended before it (P576).
 *   - The United States is left out: its states' poverty and Gini are the Census Bureau's, held already.
 * Nothing is estimated: each figure is the World Bank's, rounded to one decimal place, with its survey and year.
 *
 *   node build-division-poverty.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const RAW = path.join(__dirname, "data-raw/spid");
const XLSX = path.join(RAW, "AM26-SPID-data.xlsx");
const DIR = path.join(RAW, "x");
const OUT_DIR = path.join(__dirname, "static/poverty");
const CACHE = path.join(os.tmpdir(), "commonsphere-division-poverty");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });
if (!fs.existsSync(XLSX)) throw new Error(`Put "AM26 - SPID data.xlsx" from https://datacatalog.worldbank.org/search/dataset/0064796 at ${XLSX}`);
if (!fs.existsSync(path.join(DIR, "xl/worksheets/sheet2.xml"))) execFileSync("unzip", ["-o", "-q", XLSX, "-d", DIR]);

const PREFIX = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
`;
/** A query to QLever, sent in the body as its API asks of long ones, and kept for a day. */
async function qlever(name, query) {
  // Kept under a name of what was asked, so a different question never gets an earlier answer.
  const file = path.join(CACHE, `${name}-${require("crypto").createHash("sha1").update(query).digest("hex").slice(0, 12)}.json`);
  if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3)) {
    // Asked again after a pause where QLever says it has had too many requests: a minute, then two, then three, five times at most.
    for (let tries = 1; ; tries++) {
      const res = await fetch("https://qlever.dev/api/wikidata", {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
        body: `query=${encodeURIComponent(PREFIX + query)}`,
      });
      // QLever says 429 also when a query runs past its time: that is not asked again, as it would only run out again.
      if (res.status === 429 && /timed out/i.test(await res.clone().text())) throw new Error(`QLever: the query ran out of time (${name})`);
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
const qid = (b) => b.value.split("/").pop();
const yearOf = (b) => parseInt(String(b.value).replace(/^\+/, "").slice(0, 5), 10);

(async () => {
  /* The workbook's shared strings, and its data sheet's rows, read from the XML. */
  const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const strings = [...fs.readFileSync(path.join(DIR, "xl/sharedStrings.xml"), "utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unescape([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));
  const sheet = fs.readFileSync(path.join(DIR, "xl/worksheets/sheet2.xml"), "utf8");
  let header = null;
  const rows = [];
  for (const m of sheet.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const c of m[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, col, attrs, inner] = c;
      const v = inner ? (inner.match(/<v>([\s\S]*?)<\/v>/) ?? [])[1] : undefined;
      cells[col] = /t="s"/.test(attrs) && v !== undefined ? strings[+v] : v;
    }
    if (!header) {
      header = Object.fromEntries(Object.entries(cells).map(([col, name]) => [name, col]));
      continue;
    }
    rows.push(cells);
  }
  const get = (r, name) => r[header[name]];
  for (const need of ["code", "year", "survname", "data", "data_group", "byvar", "sample", "survey_coverage", "welfaretype", "poor300", "poor420", "poor830", "gini", "mean2021"]) if (!header[need]) throw new Error(`SPID: no column ${need}`);

  /* The site's countries' codes, and its divisions with every name each answers to. */
  const wb = JSON.parse(execFileSync("curl", ["-s", "-L", "--max-time", "120", "-A", UA, "https://api.worldbank.org/v2/country?format=json&per_page=400"]).toString())[1];
  const iso2 = new Map(wb.map((c) => [c.id, c.iso2Code]));
  iso2.set("XKX", "XK");
  iso2.set("PSE", "PS");
  // Words that say what kind of division it is, not which: "Lagos State" is Lagos. Not "city", "capital" or "district": Mexico City is not the State of Mexico, nor District Tunis the governorate of Tunis.
  const SUFFIX = /\b(province|provincia|region|regione|state|estado|governorate|department|departamento|oblast|prefecture|county|division|municipality|territory|autonomous|of)\b/g;
  // "St." is "Saint": St. Peter is Saint Peter.
  const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\bst\b/g, "saint").replace(/\bste\b/g, "sainte").replace(SUFFIX, " ").replace(/\s+/g, " ").trim();
  const divisions = new Map();
  for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
    const s = line.trim().replace(/,$/, "");
    if (!s.startsWith('"{')) continue;
    const d = JSON.parse(JSON.parse(s));
    const names = new Set([d.name, d.official, d.native, d.article].filter(Boolean).map(fold).filter(Boolean));
    (divisions.get(d.cc) ?? divisions.set(d.cc, []).get(d.cc)).push({ id: d.id, qid: d.qid, name: d.name, names });
  }

  /* Every split of every national survey: its regions, each by the name it gives - and, where it names a region by the districts in it ("Chama & Chinsali & Mpika"), by each of those too. */
  const groups = new Map();
  for (const r of rows) {
    if (get(r, "data") !== "ALL" || get(r, "data_group") !== "ALL" || get(r, "survey_coverage") !== "N") continue;
    const cc = iso2.get(get(r, "code"));
    if (!cc || cc === "US" || !divisions.has(cc)) continue;
    const key = [cc, get(r, "year"), get(r, "survname"), get(r, "byvar")].join("|");
    const g = groups.get(key) ?? groups.set(key, { cc, y: +get(r, "year"), s: get(r, "survname"), by: get(r, "byvar"), rows: [], names: new Set() }).get(key);
    const raw = get(r, "sample") ?? "";
    const name = fold(raw);
    g.names.add(name);
    g.rows.push({ r, name, parts: [name, ...raw.split("&").map(fold)].filter(Boolean), div: null });
  }

  /* The other names of the divisions of each country a survey could be the map of - one with as many regions as the site has divisions - from their Wikidata records, in the languages the World Bank names regions in ("Orissa" is Odisha). */
  const pause = () => new Promise((r) => setTimeout(r, 1000));
  const byQid = new Map();
  for (const cc of new Set([...groups.values()].filter((g) => g.rows.length === divisions.get(g.cc).length).map((g) => g.cc))) for (const d of divisions.get(cc)) if (d.qid) byQid.set(d.qid, d);
  const askNames = [...byQid.keys()];
  for (let i = 0; i < askNames.length; i += 50) {
    if (i) await pause();
    const values = askNames.slice(i, i + 50).map((q) => `wd:${q}`).join(" ");
    for (const b of await qlever(
      "names",
      `SELECT ?d ?l WHERE { VALUES ?d { ${values} } { ?d rdfs:label ?l } UNION { ?d skos:altLabel ?l } FILTER(LANG(?l) = "en" || LANG(?l) = "fr" || LANG(?l) = "es" || LANG(?l) = "pt" || LANG(?l) = "de" || LANG(?l) = "id") }`,
    )) {
      const f = fold(b.l.value);
      if (f) byQid.get(qid(b.d))?.names.add(f);
    }
  }

  /* Each region matched to the one division that answers to its name; then the ones left on the two sides paired where they are the same name spelled apart - and only where every one pairs. */
  const lev = (a, b) => {
    const m = a.length;
    const n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  };
  // How alike two names are: 1 the same, less the more letters must change; a name standing whole inside the other ("Muang Nong Khai", "Nong Khai") counts as alike.
  const within = (a, b) => ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `);
  const like = (a, b) => (within(a, b) ? Math.max(0.85, 1 - lev(a, b) / Math.max(a.length, b.length)) : 1 - lev(a, b) / Math.max(a.length, b.length, 1));
  for (const g of groups.values()) {
    const list = divisions.get(g.cc);
    for (const row of g.rows) {
      const hits = list.filter((d) => d.names.has(row.name));
      row.div = hits.length === 1 ? hits[0] : null;
    }
    // No division twice: where two regions answer to one, neither is taken.
    const count = new Map();
    for (const row of g.rows) if (row.div) count.set(row.div.id, (count.get(row.div.id) ?? 0) + 1);
    for (const row of g.rows) if (row.div && count.get(row.div.id) > 1) row.div = null;
    g.byName = g.rows.filter((x) => x.div).length;
    g.unpaired = [];
    if (g.rows.length === list.length) {
      const taken = new Set(g.rows.filter((x) => x.div).map((x) => x.div.id));
      const restRows = g.rows.filter((x) => !x.div);
      const restDivs = list.filter((d) => !taken.has(d.id));
      const pairs = [];
      for (const row of restRows) for (const d of restDivs) pairs.push([Math.max(...[...d.names].flatMap((n) => row.parts.map((p) => like(p, n)))), row, d]);
      pairs.sort((a, b) => b[0] - a[0]);
      const usedR = new Set();
      const usedD = new Set();
      for (const [sc, row, d] of pairs) {
        if (sc < 0.75) break;
        if (usedR.has(row) || usedD.has(d)) continue;
        // As alike to another as to this one: not paired, as which it is cannot be told.
        if (pairs.some(([s2, r2, d2]) => s2 === sc && ((r2 === row && d2 !== d && !usedD.has(d2)) || (d2 === d && r2 !== row && !usedR.has(r2))))) continue;
        row.div = d;
        row.spelled = true;
        usedR.add(row);
        usedD.add(d);
      }
      g.unpaired = restRows.filter((x) => !x.div);
    }
    g.hits = g.rows.filter((x) => x.div).length;
  }
  // The splits that are the site's own map: as many regions as divisions, every region paired with one division, three in four or more by name alone.
  const same = (g) => g.rows.length === divisions.get(g.cc).length && g.unpaired.length === 0 && g.byName >= 0.75 * g.rows.length;
  const chosen = new Map();
  for (const g of groups.values()) {
    if (!same(g)) continue;
    const was = chosen.get(g.cc);
    if (!was || g.y > was.y || (g.y === was.y && g.hits > was.hits)) chosen.set(g.cc, g);
  }
  // What was close and not taken, for the record.
  const near = [...groups.values()].filter((g) => !chosen.has(g.cc) && g.hits >= 3 && g.y >= 2015).map((g) => `${g.cc} ${g.y} ${g.s}/${g.by} ${g.hits}/${g.rows.length} of ${divisions.get(g.cc).length}`);

  /* The changes Wikidata records to each matched division: who was separated from it, merged into it or replaced by it, and when it began and ended. */
  const qids = [...new Set([...chosen.values()].flatMap((g) => g.rows.filter((x) => x.div?.qid).map((x) => x.div.qid)))];
  const siteQids = new Map([...divisions].map(([cc, list]) => [cc, new Set(list.map((d) => d.qid).filter(Boolean))]));
  const events = new Map(); // div qid -> { founded:[], ended:[], classes:Set, others: Map<x qid, {how, labels:Set, classes:Set, began:[], ended:[]}> }
  const of = (q) => events.get(q) ?? events.set(q, { founded: [], ended: [], classes: new Set(), others: new Map() }).get(q);
  // Fifty at a time, a second apart, each question kept simple: QLever turns away a long or knotted one.
  for (let i = 0; i < qids.length; i += 50) {
    if (i) await pause();
    const values = qids.slice(i, i + 50).map((q) => `wd:${q}`).join(" ");
    // When it began and ended, and what kind of division it is.
    for (const b of await qlever(`own`, `SELECT ?div ?f ?e ?c WHERE { VALUES ?div { ${values} } OPTIONAL { ?div wdt:P571 ?f } OPTIONAL { ?div wdt:P576 ?e } OPTIONAL { ?div wdt:P31 ?c } }`)) {
      const e = of(qid(b.div));
      if (b.f && Number.isFinite(yearOf(b.f))) e.founded.push(yearOf(b.f));
      if (b.e && Number.isFinite(yearOf(b.e))) e.ended.push(yearOf(b.e));
      if (b.c) e.classes.add(qid(b.c));
    }
    // Who was separated from it, merged into it or replaced by it: when each began and ended, and what kind each is.
    for (const b of await qlever(
      `others`,
      `SELECT ?div ?x ?how ?xf ?xe ?c WHERE { VALUES ?div { ${values} }
        { ?x wdt:P807 ?div . BIND("split" AS ?how) } UNION { ?x wdt:P7888 ?div . BIND("merged" AS ?how) } UNION { ?x wdt:P1366 ?div . BIND("merged" AS ?how) }
        OPTIONAL { ?x wdt:P571 ?xf } OPTIONAL { ?x wdt:P576 ?xe } OPTIONAL { ?x wdt:P31 ?c } }`,
    )) {
      const e = of(qid(b.div));
      const x = qid(b.x);
      const o = e.others.get(x) ?? e.others.set(x, { how: b.how.value, labels: new Set(), classes: new Set(), began: [], ended: [] }).get(x);
      if (b.how.value === "split") o.how = "split";
      if (b.c) o.classes.add(qid(b.c));
      if (b.xf && Number.isFinite(yearOf(b.xf))) o.began.push(yearOf(b.xf));
      if (b.xe && Number.isFinite(yearOf(b.xe))) o.ended.push(yearOf(b.xe));
    }
  }
  // Only one of the same kind as it counts (a class in common): a district carved out of a province leaves the province's outline as it was.
  for (const e of events.values()) for (const [x, o] of e.others) if (![...o.classes].some((c) => e.classes.has(c))) e.others.delete(x);
  // The names of those that count, in every language Wikidata holds, to find them among a survey's regions.
  const xs = [...new Set([...events.values()].flatMap((e) => [...e.others.keys()]))];
  for (let i = 0; i < xs.length; i += 50) {
    await pause();
    for (const b of await qlever(`labels`, `SELECT ?x ?label WHERE { VALUES ?x { ${xs.slice(i, i + 50).map((q) => `wd:${q}`).join(" ")} } ?x rdfs:label ?label }`))
      for (const e of events.values()) e.others.get(qid(b.x))?.labels.add(fold(b.label.value));
  }
  /** Why a matched division's region may not be its land, or undefined where nothing says so. */
  const differs = (div, g) => {
    const e = events.get(div.qid);
    if (!e) return undefined;
    if (e.founded.some((y) => y > g.y)) return `founded ${Math.max(...e.founded)}, after the survey`;
    // Ended before the survey: its region in the survey may be what came after it - unless the survey's map is the site's, every region answering to one division.
    if (e.ended.some((y) => y <= g.y) && g.hits < g.rows.length) return `ended ${Math.min(...e.ended)}, before the survey`;
    const own = g.rows.find((row) => row.div === div);
    for (const [x, o] of e.others) {
      if (x === div.qid) continue;
      const onSite = siteQids.get(g.cc).has(x);
      // Whether the survey has it apart: one of its other regions answers to it.
      const apart = g.rows.some((row) => row !== own && (row.div?.qid === x || o.labels.has(fold(get(row.r, "sample") ?? ""))));
      if (o.how === "split") {
        // Separated from it: the site's map has it apart if it is on it; the survey has it apart if one of its regions is it, or if it was separated five years or more before the survey.
        const t = o.began.length ? Math.min(...o.began) : undefined;
        const surveyApart = apart || (t !== undefined && t <= g.y - 5);
        if (onSite !== surveyApart) return `${x} separated from it${t ? ` in ${t}` : ""}: ${onSite ? "apart on the site's map, not in the survey" : "apart in the survey, not on the site's map"}`;
      } else {
        // Merged into it: the site's map has it apart if it is on it; the survey has it apart if one of its regions is it, or if it ended after the survey.
        const t = o.ended.length ? Math.max(...o.ended) : undefined;
        const surveyApart = apart || (t !== undefined && t > g.y);
        if (onSite !== surveyApart) return `${x} merged into it${t ? ` in ${t}` : ""}: ${onSite ? "apart on the site's map, not in the survey" : "apart in the survey, not on the site's map"}`;
      }
    }
    return undefined;
  };

  const pct = (v) => (v === undefined || v === "" ? undefined : Math.round(Number(v) * 1000) / 10);
  const out = {};
  let matched = 0;
  let unmatched = 0;
  const dropped = [];
  const years = {};
  for (const g of chosen.values()) {
    for (const { r, div } of g.rows) {
      if (!div) {
        unmatched++;
        continue;
      }
      const why = div.qid ? differs(div, g) : undefined;
      if (why) {
        dropped.push(`${div.id} ${div.name} (${g.y}: ${why})`);
        continue;
      }
      matched++;
      years[g.y] = (years[g.y] ?? 0) + 1;
      const gini = get(r, "gini");
      // The survey's mean income or consumption per person a day (2021 PPP): how well off the region is, as the same survey measures it.
      const mean = get(r, "mean2021");
      out[div.id] = {
        y: g.y,
        s: g.s,
        n: get(r, "sample"),
        w: /cons/i.test(get(r, "welfaretype") ?? "") ? "consumption" : "income",
        p300: pct(get(r, "poor300")),
        p420: pct(get(r, "poor420")),
        p830: pct(get(r, "poor830")),
        ...(gini !== undefined && gini !== "" ? { gini: Math.round(Number(gini) * 1000) / 10 } : {}),
        ...(mean !== undefined && mean !== "" && Number.isFinite(Number(mean)) ? { mean: Math.round(Number(mean) * 100) / 100 } : {}),
      };
    }
  }
  fs.writeFileSync(
    path.join(OUT_DIR, "divisions.json"),
    JSON.stringify({ source: { label: "World Bank — Subnational Poverty and Inequality Database (SPID), Fall 2026 (CC BY 4.0)", url: "https://datacatalog.worldbank.org/search/dataset/0064796" }, divisions: out }),
  );
  console.log(`SPID: ${chosen.size} countries; ${matched} divisions held; ${unmatched} regions whose name no one division answers to; ${dropped.length} left out as the survey's land and the site's may differ.`);
  console.log("By survey year:", JSON.stringify(years));
  console.log("Left out:", dropped.join("; "));
  console.log("Chosen:", [...chosen.values()].map((g) => `${g.cc} ${g.y} ${g.s}/${g.by} ${g.hits}/${g.rows.length}`).join("; "));
  // The regions paired by spelling and not by name, to be read by eye.
  for (const g of chosen.values()) {
    const spelled = g.rows.filter((x) => x.spelled);
    if (spelled.length) console.log(`  ${g.cc}: ${spelled.map((x) => `${JSON.stringify(get(x.r, "sample"))} = ${JSON.stringify(x.div.name)}`).join(", ")}`);
  }
  // The countries with a survey of as many regions as divisions, not taken as one or more did not pair: what was left on each side.
  const pairedBy = new Set(chosen.keys());
  for (const g of groups.values()) {
    if (pairedBy.has(g.cc) || g.rows.length !== divisions.get(g.cc).length || !g.unpaired.length || g.y < 2010) continue;
    const taken = new Set(g.rows.filter((x) => x.div).map((x) => x.div.id));
    console.log(`  not ${g.cc} ${g.y} ${g.s}: survey ${g.unpaired.map((x) => JSON.stringify(get(x.r, "sample"))).join(", ")} | site ${divisions.get(g.cc).filter((d) => !taken.has(d.id)).map((d) => JSON.stringify(d.name)).join(", ")}`);
    pairedBy.add(g.cc);
  }
  console.log("Not taken (another map):", near.join("; "));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
