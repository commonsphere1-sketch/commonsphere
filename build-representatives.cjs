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
 * Every country is in the file all the same, by its head of state and of
 * government: those are read from Wikipedia's "List of current heads of state
 * and government", the list the World Leaders page is audited against, with
 * the revision it was read at. That is one curated list, not three records,
 * and the file says so.
 *
 * Each country's and territory's legislature is there too, by who presides
 * over each chamber: Wikipedia's "List of current presidents of
 * legislatures", read the same way. And a territory that is not a state of
 * the first list - Hong Kong, Curacao, Greenland - has its head where the
 * three records agree on one.
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

/** The opening of each English Wikipedia article named, by title: where its infobox is. */
async function articleLeads(titles) {
  const out = new Map();
  const want = [...new Set(titles.filter(Boolean))].sort();
  for (let i = 0; i < want.length; i += 20) {
    const batch = want.slice(i, i + 20);
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
    for (const [t, text] of pages) out.set(t, text);
  }
  return out;
}
/** The first infobox of an article's opening, braces balanced, without its references. */
function firstInfobox(text) {
  const start = text.search(/\{\{\s*Infobox/i);
  if (start < 0) return "";
  let depth = 0;
  let end = text.length;
  for (let i = start; i < text.length - 1; i++) {
    if (text.startsWith("{{", i)) { depth++; i++; } else if (text.startsWith("}}", i)) { depth--; i++; if (depth === 0) { end = i + 1; break; } }
  }
  return text.slice(start, end).replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, " ");
}

// ── The countries themselves: Wikipedia's list of current heads of state and government ──
const LIST = "List of current heads of state and government";
/** A state as the site names it, where the list's link says more than the name. */
const SHOWN_AS = { "Georgia (country)": "Georgia", "Kingdom of the Netherlands": "Netherlands", "Federated States of Micronesia": "Micronesia" };
/** A state's Wikidata label, where it is not the list's name. */
const LABELLED = { Bahamas: "The Bahamas", Gambia: "The Gambia", China: "People's Republic of China", "Georgia (country)": "Georgia", "Kingdom of the Netherlands": "Netherlands", Palestine: "State of Palestine" };
async function nationalHeads(countries) {
  const page = await cached("hosg.json", async () => {
    const res = await fetch("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", prop: "revisions", rvprop: "content|ids|timestamp", rvslots: "main", format: "json", formatversion: "2", titles: LIST }), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`Wikipedia: ${res.status} for the list of heads of state and government`);
    const rev = (await res.json()).query.pages[0].revisions[0];
    return { revid: rev.revid, timestamp: rev.timestamp, text: rev.slots.main.content };
  });
  /** What stands between a template's opening at `from` and its closing braces. */
  const inside = (text, from) => {
    let depth = 0;
    for (let i = from; i < text.length - 1; i++) {
      if (text.startsWith("{{", i)) { depth++; i++; } else if (text.startsWith("}}", i)) { depth--; i++; if (depth === 0) return i + 1; }
    }
    return text.length;
  };
  // A body's members are a folded list or a flat one, set over several lines: each is made one line, "Members: A; B".
  let text = page.text.replace(/<!--[\s\S]*?-->/g, "").replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  for (let at; (at = text.search(/\{\{\s*Collapsible list/i)) >= 0; ) {
    const end = inside(text, at);
    // Links first: a link's own bar is not one of the template's.
    const parts = text.slice(at + 2, end - 2).replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").split("|").map((x) => x.trim());
    const title = (parts.find((x) => /^title\s*=/.test(x)) || "").replace(/^title\s*=\s*/, "");
    const members = parts.slice(1).filter((x) => !/^(title|hlist|frame_style|list_style|title_style|expand|bullets)\s*=/.test(x)).map((x) => x.replace(/^\d+\s*=\s*/, "")).filter(Boolean);
    text = text.slice(0, at) + `${title} ${members.join("; ")}` + text.slice(end);
  }
  text = text.replace(/\{\{flatlist[^}]*\}\}([\s\S]*?)\{\{endflatlist\}\}/gi, (_, list) => list.split(/\n?\s*\*\s*/).map((x) => x.trim()).filter(Boolean).join("; "));
  const unwrap = (s) => {
    for (let prev = null; s !== prev; ) {
      prev = s;
      s = s.replace(/\{\{(?:small|smalldiv|nowrap)\|(?:1=)?((?:[^{}]|\{\{[^{}]*\}\})*)\}\}/gi, "$1").replace(/\{\{ill\|([^|{}]*)\|[^{}]*\}\}/gi, "$1").replace(/\{\{efn[^{}]*(?:\{\{[^{}]*\}\}[^{}]*)*\}\}/gi, "");
    }
    return s;
  };
  const plainCell = (s) =>
    unwrap(s)
      .replace(/\{\{(?:success|operational)\|(?:align=left\|)?/g, "")
      .replace(/\}\}/g, "")
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
      .replace(/&nbsp;/g, " ")
      .replace(/'''?/g, "")
      .replace(/<br\s*\/?>/gi, "; ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([;,)])/g, "$1")
      .replace(/[;\s]+$/, "")
      .trim();
  const body = text.slice(text.indexOf("==Member and observer states"), text.indexOf("==See also=="));
  if (body.length < 20000) throw new Error("the list of heads of state and government was not read: its sections were not found");
  const states = [];
  let cur = null;
  let spanLeft = [0, 0];
  for (const chunk of body.split(/\n\|-[^\n]*/)) {
    // A table's last row runs on into the prose after it.
    const row = chunk.split("\n|}")[0];
    const lines = row.split("\n");
    const hi = lines.findIndex((l) => /^!/.test(l) && /scope="?row"?/.test(l));
    let rest = row;
    if (hi >= 0) {
      const head = lines[hi].slice(lines[hi].indexOf("|") + 1);
      const flag = /\{\{flag(?:country|icon|deco)?\|([^}|]+)/.exec(head);
      // A rival government is listed under its state's flag with its own name after it; it is not a state.
      const rival = /flagdeco|flagicon/.test(head);
      cur = { name: flag ? flag[1].trim() : plainCell(head), rival, lines: [] };
      states.push(cur);
      spanLeft = [0, 0];
      rest = lines.slice(hi + 1).join("\n");
    }
    if (!cur) continue;
    const cells = ("\n" + rest).split(/\n\|(?!\}|-)/).slice(1).filter((c) => c.trim());
    if (!cells.length) continue;
    // Which column a cell is in: the first is the head of state's, the second the head of government's, unless a cell above still spans one.
    const free = [0, 1].filter((k) => spanLeft[k] === 0);
    spanLeft = spanLeft.map((n) => Math.max(0, n - 1));
    cells.forEach((cell, i) => {
      const attrs = /^((?:\s*(?:rowspan|colspan|align|style)="[^"]*")*)\s*\|?/.exec(cell);
      const rowspan = +(/rowspan="(\d+)"/.exec(attrs[1]) || [0, 1])[1];
      const both = /colspan="2"/.test(attrs[1]);
      const col = both ? 0 : free[Math.min(i, free.length - 1)] ?? 0;
      if (rowspan > 1) for (const k of both ? [0, 1] : [col]) spanLeft[k] = rowspan - 1;
      const said = plainCell(cell.slice(attrs[0].length));
      if (said) cur.lines.push([both ? "both" : col === 0 ? "state" : "government", said, /\{\{success\|/.test(cell) ? 1 : 0]);
    });
  }
  const kept = states.filter((s) => !s.rival && !/^European Union$|Order of Malta/.test(s.name));
  if (kept.length < 200 || kept.length > 212) throw new Error(`${kept.length} states were read from the list of heads of state and government`);
  for (const s of kept) if (!s.lines.length || s.lines.some(([, said]) => /[{}[\]|<>]/.test(said))) throw new Error(`${s.name}: not read cleanly - ${JSON.stringify(s.lines).slice(0, 300)}`);

  // Each state's ISO code and where it is: by its Wikidata label, or - for a state with no code - by its Wikipedia article.
  const byLabel = new Map([...countries].map(([id, c]) => [c.name, { id, code: c.code }]));
  const labelled = (s) => byLabel.get(s.name) ?? byLabel.get(LABELLED[s.name]);
  const noCode = kept.filter((s) => !labelled(s));
  const articles = noCode.length
    ? await cached(`hosg-items-${hash(noCode.map((s) => s.name).join("|"))}.json`, async () => {
        const res = await fetch("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", prop: "pageprops", ppprop: "wikibase_item", redirects: "1", format: "json", formatversion: "2", titles: noCode.map((s) => s.name).join("|") }), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
        const j = await res.json();
        const to = new Map([...(j.query.normalized || []), ...(j.query.redirects || [])].map((n) => [n.from, n.to]));
        const item = new Map(j.query.pages.map((p) => [p.title, p.pageprops?.wikibase_item ?? null]));
        return noCode.map((s) => [s.name, item.get(to.get(s.name) ?? s.name) ?? null]);
      })
    : [];
  const itemOf = new Map(articles);
  for (const s of kept) {
    const c = labelled(s);
    s.code = c?.code ?? "";
    s.id = c?.id ?? itemOf.get(s.name);
    if (!s.id) throw new Error(`${s.name}: no Wikidata item was found for the state`);
  }
  const ids = kept.map((s) => s.id).sort();
  const where = new Map((await cached(`hosg-where-${hash(ids.join(" "))}.json`, () => sparql(`SELECT ?item ?coord WHERE { VALUES ?item { ${wd(ids)} } ?item wdt:P625 ?coord }`))).map((r) => [qid(r.item), r.coord]));
  for (const s of kept) {
    const at = /^Point\((-?[\d.]+) (-?[\d.]+)\)$/.exec(where.get(s.id) || "");
    if (!at) throw new Error(`${s.name}: no position in Wikidata`);
    s.lon = +(+at[1]).toFixed(2);
    s.lat = +(+at[2]).toFixed(2);
    s.shown = SHOWN_AS[s.name] ?? s.name;
  }
  return { revid: page.revid, timestamp: page.timestamp, states: kept.sort((a, b) => a.shown.localeCompare(b.shown)) };
}

// ── Who presides over each legislature: Wikipedia's list of current presidents of legislatures ──
const CHAMBERS = "List of current presidents of legislatures";
/** A state or territory as that list names it, where the first list or Wikidata names it otherwise. */
const CHAMBER_NAMES = { "The Bahamas": "Bahamas", "The Gambia": "Gambia", "Micronesia": "Federated States of Micronesia", "Netherlands": "Kingdom of the Netherlands", "East Timor": "Timor-Leste", "Georgia": "Georgia (country)", "Czechia": "Czech Republic", "Congo": "Republic of the Congo", "DR Congo": "Democratic Republic of the Congo", "Sahrawi Republic": "Sahrawi Arab Democratic Republic", "Western Sahara": "Sahrawi Arab Democratic Republic", "Congo-Brazzaville": "Republic of the Congo", "Congo-Kinshasa": "Democratic Republic of the Congo", "Republic of China": "Taiwan" };
/** A territory the list names otherwise than Wikidata does, by its ISO code. */
const CHAMBER_CODES = { "Saint Helena": "SH", "Saint Martin": "MF", "U.S. Virgin Islands": "VI", "Åland": "AX", "Curaçao": "CW", "Macau": "MO", "Réunion": "RE", "Saint Barthélemy": "BL", "Pitcairn Islands": "PN", "Falkland Islands": "FK", "Faroe Islands": "FO" };
async function legislaturePresidents(countries, national) {
  const page = await cached("legislatures.json", async () => {
    const res = await fetch("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", prop: "revisions", rvprop: "content|ids|timestamp", rvslots: "main", format: "json", formatversion: "2", titles: CHAMBERS }), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`Wikipedia: ${res.status} for the list of presidents of legislatures`);
    const rev = (await res.json()).query.pages[0].revisions[0];
    return { revid: rev.revid, timestamp: rev.timestamp, text: rev.slots.main.content };
  });
  const text = page.text.replace(/<!--[\s\S]*?-->/g, "").replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  const from = text.indexOf("== States recognised by the United Nations");
  const to = text.search(/==\s*\[\[Sui generis\]\] entities\s*==/);
  if (from < 0 || to < from) throw new Error("the list of presidents of legislatures was not read: its sections were not found");
  const said = (s) => {
    let x = s;
    for (let prev = null; x !== prev; ) {
      prev = x;
      x = x
        .replace(/\{\{efn[^{}]*\}\}/gi, "")
        .replace(/\{\{sortname\|([^|{}]*)\|([^|{}]*)(?:\|[^{}]*)?\}\}/gi, "$1 $2")
        .replace(/\{\{dts\|(?:format=\w+\|)?(\d{4})\|(\d{1,2})\|(\d{1,2})[^{}]*\}\}/gi, (_, y, m, d) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`)
        .replace(/\{\{dts\|(?:format=\w+\|)?(\d{4})[^{}]*\}\}/gi, "$1")
        // A flag alone is followed by the name in a link of its own; a flag with a name is the name.
        .replace(/\{\{flag(?:icon|deco)\|[^{}]*\}\}/gi, "")
        .replace(/\{\{flag(?:country)?\|([^|{}]*)((?:\|[^{}]*)?)\}\}/gi, (_, first, rest) => /\|name=([^|]*)/.exec(rest)?.[1] ?? first)
        .replace(/\{\{(?:nowrap|small|abbr)\|([^|{}]*)(?:\|[^{}]*)?\}\}/gi, "$1")
        .replace(/\{\{[^{}]*\}\}/g, "");
    }
    return x.replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "").replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/'''?/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  };
  // Each row has six columns, less those a cell above still spans. A table of states has state, assembly, title, name,
  // party, day; the table of regions and territories has the region, its country, assembly, title, name, day.
  const rows = [];
  let span = [0, 0, 0, 0, 0, 0];
  let kept = ["", "", "", "", "", ""];
  let keptRaw = ["", "", "", "", "", ""];
  let regional = false;
  for (const chunk of text.slice(from, to).split(/\n\|-[^\n]*/)) {
    // A table's heading says which of the two it is.
    if (/\n!\s*Region or territory/.test(chunk)) regional = true;
    else if (/\n!\s*State\b/.test(chunk)) regional = false;
    const row = chunk.split("\n|}")[0];
    if (/\n!/.test("\n" + row) && !/\n\|[^}-]/.test("\n" + row)) { span = [0, 0, 0, 0, 0, 0]; continue; }
    const cells = ("\n" + row).split(/\n\|(?!\}|-)/).slice(1).flatMap((c) => c.split(/\s\|\|\s/));
    if (!cells.length) continue;
    let next = 0;
    const line = [];
    const raw = [];
    for (let col = 0; col < 6; col++) {
      if (span[col] > 0) { span[col]--; line.push(kept[col]); raw.push(keptRaw[col]); continue; }
      const cell = cells[next++] ?? "";
      const attrs = /^\s*((?:(?:rowspan|colspan|style|align|class|data-sort-value|scope)="[^"]*"\s*)+)\|/.exec(cell);
      const n = +(/rowspan="(\d+)"/.exec(attrs?.[1] ?? "") || [0, 1])[1];
      kept[col] = said(cell.slice(attrs ? attrs[0].length : 0));
      keptRaw[col] = cell;
      if (n > 1) span[col] = n - 1;
      line.push(kept[col]);
      raw.push(cell);
    }
    kept = [...line];
    keptRaw = [...raw];
    const [state, second, third, fourth, fifth] = line;
    const r = regional ? { state, parent: second, assembly: third, title: fourth, name: fifth, party: "" } : { state, parent: "", assembly: second, title: third, name: fourth, party: fifth };
    if (!r.state || !r.name) continue;
    // The assembly's own article: what the row's link to it names.
    const article = /\[\[([^\]|#]+)/.exec(raw[regional ? 2 : 1])?.[1].trim() ?? "";
    rows.push({ ...r, state: r.state.replace(/\s*\([^)]*\)\s*$/, "").trim(), article });
  }
  if (rows.length < 250) throw new Error(`only ${rows.length} presiding officers were read`);
  for (const r of rows) if (Object.values(r).some((v) => /[{}[\]|<>]/.test(v))) throw new Error(`a row of the list of presidents of legislatures was not read cleanly: ${JSON.stringify(r)}`);

  // The list is one record, and read on 7 October 2026 it still named a president of Puerto Rico's Senate who had left
  // office. A row is kept only where the infobox of the assembly's own article names the same person.
  const leads = await articleLeads(rows.map((r) => r.article));
  const confirmed = rows.filter((r) => {
    const box = new Set(words(firstInfobox(leads.get(r.article) ?? "")));
    const name = words(r.name);
    return name.length >= 2 && name.every((w) => box.has(w));
  });

  // By the state's key in the first list - its ISO code, or its name where it has none - or the territory's ISO code.
  // A region with no code of its own - Scotland, Catalonia, Bavaria - is kept under the country the list files it with.
  const stateKey = new Map(national.states.flatMap((s) => [[s.name, s.code || s.shown], [s.shown, s.code || s.shown]]));
  const byLabel = new Map([...countries.values()].map((c) => [c.name, c.code]));
  const keyOf = (name) => stateKey.get(CHAMBER_NAMES[name] ?? name) ?? stateKey.get(name) ?? byLabel.get(name) ?? byLabel.get(CHAMBER_NAMES[name] ?? name) ?? CHAMBER_CODES[name];
  const by = {};
  const regions = {};
  const unplaced = new Set();
  for (const r of confirmed) {
    const key = keyOf(r.state);
    if (key) (by[key] ??= []).push([r.assembly, r.title, r.name, r.party]);
    else if (r.parent && keyOf(r.parent)) (regions[keyOf(r.parent)] ??= []).push([r.state, r.assembly, r.title, r.name]);
    else unplaced.add(r.state);
  }
  return { revid: page.revid, timestamp: page.timestamp, by, regions, rows: rows.length, confirmed: confirmed.length, leftOut: rows.filter((r) => !confirmed.includes(r)).map((r) => `${r.state}: ${r.name}`), unplaced: [...unplaced] };
}

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
  // A confirmed place that has an ISO country code of its own is a country or a territory: its head is kept for the territories.
  const coded = confirmed.flatMap((p) => (countries.get(p.id)?.code ? [{ code: countries.get(p.id).code, office: p.officeName, head: p.head, since: p.since ?? "" }] : []));
  why.aCountry = 0;
  for (let i = confirmed.length - 1; i >= 0; i--) if (confirmed[i].isCountry) { confirmed.splice(i, 1); why.aCountry++; }
  // ── Each confirmed place's GeoNames id, where Wikidata gives one: the explorer sets the head beside GeoNames' own row by it ──
  for (let i = 0; i < confirmed.length; i += 200) {
    const batch = confirmed.slice(i, i + 200);
    const got = await cached(`geonames-${hash(batch.map((p) => p.id).join(" "))}.json`, () => sparql(`SELECT ?item ?gn WHERE { VALUES ?item { ${wd(batch.map((p) => p.id))} } ?item wdt:P1566 ?gn }`));
    const by = new Map();
    for (const r of got) if (!by.has(qid(r.item)) && /^\d+$/.test(r.gn)) by.set(qid(r.item), +r.gn);
    for (const p of batch) p.geo = by.get(p.id) ?? 0;
  }
  console.log(`${confirmed.filter((p) => p.geo).length} of them have a GeoNames id`);
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

  // ── Every country, by its head of state and of government ──
  const national = await nationalHeads(countries);
  const chambers = await legislaturePresidents(countries, national);
  console.log(`${chambers.confirmed} of the ${chambers.rows} presiding officers in Wikipedia's list (revision ${chambers.revid}) are named by the assembly's own article: ${Object.keys(chambers.by).length} states and territories, ${Object.keys(chambers.regions).length} countries' regions${chambers.unplaced.length ? `; not placed: ${chambers.unplaced.join(", ")}` : ""}`);
  console.log(`  left out (${chambers.leftOut.length}): ${chambers.leftOut.slice(0, 60).join("; ")}`);
  // A territory is a place with a code of its own that is not a state of the list of heads.
  const stateCodes = new Set(national.states.map((s) => s.code).filter(Boolean));
  const territoryHeads = Object.fromEntries(coded.filter((x) => !stateCodes.has(x.code)).sort((a, b) => a.code.localeCompare(b.code)).map((x) => [x.code, [x.office, x.head, x.since]]));
  console.log(`${Object.keys(territoryHeads).length} territories' heads that three records agree on: ${Object.entries(territoryHeads).map(([k, v]) => `${k} ${v[1]}`).join(", ")}`);
  console.log(`${national.states.length} states and their heads, from Wikipedia's list at revision ${national.revid} (${national.timestamp})`);

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
  /** The list every country's own heads are read from, at the revision read. */
  list: { label: "Wikipedia — List of current heads of state and government (revision ${national.revid}, ${national.timestamp.slice(0, 10)})", url: "https://en.wikipedia.org/w/index.php?title=${LIST.replace(/ /g, "_")}&oldid=${national.revid}" },
  /** The list each legislature's presiding officers are read from, at the revision read. */
  chambers: { label: "Wikipedia — List of current presidents of legislatures (revision ${chambers.revid}, ${chambers.timestamp.slice(0, 10)})", url: "https://en.wikipedia.org/w/index.php?title=${CHAMBERS.replace(/ /g, "_")}&oldid=${chambers.revid}" },
  /** The presiding officers the list names, and those the assembly's own article names too: only these are kept. */
  chambersRead: ${chambers.rows},
  chambersConfirmed: ${chambers.confirmed},
  retrieved: "${today}",
  /** Where the rule could be checked against the lists the site holds from Wikipedia: how many of the heads it confirmed were the same. A place the lists contradict is not shown. */
  check: ${q(check)},
  /** Places Wikidata records an office and a head for, and those confirmed. */
  recorded: ${places.size},
  confirmed: ${confirmed.length},
};

/** [country's name, places Wikidata records an office and a head for, places confirmed], by ISO code. */
export const REPRESENTATIVE_COUNTRIES: Record<string, [name: string, recorded: number, confirmed: number]> = ${q(counts)};

/** A line of the list for a state: whose column it stands in, the line as the list writes it ("President – X"), and 1 where the list marks it as holding executive power. */
export type NationalLine = [role: "state" | "government" | "both", said: string, executive: 0 | 1];
/**
 * Every state in Wikipedia's list of current heads of state and government - the UN's members and observers, the Cook
 * Islands and Niue, and the states with limited recognition it lists - with its ISO code where it has one, where it is,
 * and the list's lines for it. One curated list, read at the revision the sources name; not the three-record rule.
 */
export type NationalRow = [code: string, name: string, lat: number, lon: number, lines: NationalLine[]];
export const NATIONAL_HEADS: NationalRow[] = [
${national.states.map((s) => `  ${q([s.code, s.shown, s.lat, s.lon, s.lines])},`).join("\n")}
];

/** Who presides over a chamber: [the assembly, the title, the holder, the party as the list gives it or ""]. */
export type ChamberRow = [assembly: string, title: string, name: string, party: string];
/**
 * Each state's and territory's legislature by its presiding officers, as Wikipedia's list of current presidents of
 * legislatures gives them: by ISO code, or by name for a state with none. The list is read at the revision the sources
 * name, and a row is kept only where the infobox of the assembly's own Wikipedia article names the same person: the
 * rest are left out, and the sources say how many. The list's dates are not kept: some were found a holder behind.
 */
export const LEGISLATURE_PRESIDENTS: Record<string, ChamberRow[]> = {
${Object.keys(chambers.by).sort().map((k) => `  ${q(k)}: ${q(chambers.by[k])},`).join("\n")}
};

/** The presiding officers of the assemblies of regions the same list files under a country - Scotland, Catalonia, Bavaria: [region, assembly, title, holder], by the country's key. Kept by the same check. */
export const REGIONAL_ASSEMBLIES: Record<string, [region: string, assembly: string, title: string, name: string][]> = {
${Object.keys(chambers.regions).sort().map((k) => `  ${q(k)}: ${q(chambers.regions[k])},`).join("\n")}
};

/** The head of a territory that is not a state of the list of heads, where the three records agree on one: [office, head, year or ""], by ISO code. */
export const TERRITORY_HEADS: Record<string, [office: string, head: string, since: string]> = ${q(territoryHeads)};

/**
 * A confirmed place: [ISO country code, the place, its ISO 3166-2 code where it has one (a state, province or
 * other subdivision) or "", the head, the office, the year the head took office where the place's record and the
 * holder's give the same one or "", latitude, longitude, population or 0,
 * the place's Wikidata id, its English Wikipedia article, its GeoNames id or 0].
 */
export type RepresentativeRow = [country: string, place: string, region: string, head: string, office: string, since: string, lat: number, lon: number, population: number, id: string, article: string, geonames: number];

/** By country, then the subdivisions with an ISO 3166-2 code first, then by population. */
export const REPRESENTATIVES: RepresentativeRow[] = [
${confirmed.map((p) => `  ${q([p.country, p.name, p.iso ?? "", p.head, p.officeName, p.since ?? "", p.lat, p.lon, p.pop, p.id, p.title, p.geo])},`).join("\n")}
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
