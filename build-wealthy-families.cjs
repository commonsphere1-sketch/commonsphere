/**
 * Builds src/data/wealthyFamilies.ts — the wealthiest families, each with a
 * published estimate of its combined wealth: the year of the estimate and
 * the publication that made it. Behind the families' cards on the World
 * Leaders page.
 *
 *   node build-wealthy-families.cjs
 *
 * From Wikipedia's "List of wealthiest families" (CC BY-SA 4.0), read at the
 * revision named in the output: its table of contemporary rankings, and its
 * list of the banking and merchant dynasties of the past. The table gathers
 * estimates made by Forbes, Bloomberg and others, in different years; each
 * row here keeps the year the table gives and the reference its figure
 * cites, so a reader can go to the publication itself. They are estimates,
 * and they are not one ranking: the page says so.
 *
 * Nothing is worked out. A row is taken only where its figure is cited to a
 * publication that draws up such estimates or to a newspaper of record
 * (PUBLICATIONS), and is not marked as doubtful by Wikipedia's editors. A row
 * whose wealth does not read as one figure in
 * billions of US dollars is left out and named when the build runs. The list
 * leaves out royal houses and ruling dynasties, so none of those has a
 * figure from it.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/wealthyFamilies.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-wealthy-families");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const TITLE = "List of wealthiest families";
/** The publications a figure may be cited to: the ones that draw up such estimates, and newspapers of record. A row cited to anything else is left out and named. */
const PUBLICATIONS = ["forbes.com", "forbesmiddleeast.com", "bloomberg.com", "fortune.com", "manager-magazin.de", "bilanz.ch", "canadianbusiness.com", "irishtimes.com", "dallasnews.com"];

async function page() {
  const at = path.join(CACHE, "list.json");
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return JSON.parse(fs.readFileSync(at, "utf8"));
  const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content|ids|timestamp&rvslots=main&format=json&formatversion=2&titles=${encodeURIComponent(TITLE)}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia: HTTP ${res.status}`);
  const rev = (await res.json()).query.pages[0].revisions[0];
  const got = { id: rev.revid, at: rev.timestamp.slice(0, 10), text: rev.slots.main.content };
  fs.writeFileSync(at, JSON.stringify(got));
  return got;
}

/** A cell's wikitext as plain words: its references and markup taken away, its links left as the words they show. */
function plain(w) {
  let s = w
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<\/?(?:small|sup|sub|span|nowiki|abbr)[^>]*>/gi, "");
  // Templates that stand for words: a flag is the country it names, a no-wrap is what it wraps.
  for (let i = 0; i < 4; i++)
    s = s
      .replace(/\{\{\s*(?:flag|flagu|flagcountry)\s*\|\s*([^|}]+)[^}]*\}\}/gi, "$1")
      .replace(/\{\{\s*(?:flagicon|flagdeco)\s*\|[^}]*\}\}/gi, "")
      .replace(/\{\{\s*(?:nowrap|nobr|small|abbr)\s*\|\s*([^|}]+)[^}]*\}\}/gi, "$1")
      .replace(/\{\{\s*(?:citation needed|cn|efn|refn|sfn|update inline|better source needed|when|as of)[^}]*\}\}/gi, "")
      .replace(/\{\{\s*(?:circa|c\.)\s*\}\}/gi, "c. ")
      .replace(/\{\{\s*sort\s*\|[^|}]*\|\s*([^|}]+)\}\}/gi, "$1")
      .replace(/\{\{\s*sortname\s*\|\s*([^|}]+)\|\s*([^|}]+)[^}]*\}\}/gi, "$1 $2")
      .replace(/\{\{\s*(?:ill|interlanguage link)\s*\|\s*([^|}]+)[^}]*\}\}/gi, "$1")
      .replace(/\{\{\s*(?:snd|spaced ndash)\s*\}\}/gi, " – ")
      .replace(/\{\{\s*(?:US\$|USD)\s*\|\s*([^|}]+)[^}]*\}\}/gi, "$1");
  s = s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.])/g, "$1")
    .trim();
  if (/\{\{|\}\}|<[a-z]/i.test(s)) throw new Error(`markup was not read: "${s.slice(0, 140)}"`);
  return s;
}
/** The reference a cell cites first: the publication, the title and the address, as its citation gives them. */
function cited(cell, text) {
  const m = /<ref(?:\s+name\s*=\s*"?([^">/]+)"?\s*)?(\/)?>/.exec(cell);
  if (!m) return null;
  let body;
  if (m[2]) {
    const def = new RegExp(`<ref\\s+name\\s*=\\s*"?${m[1].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"?\\s*>([\\s\\S]*?)</ref>`).exec(text);
    if (!def) return null;
    body = def[1];
  } else body = cell.slice(m.index + m[0].length, cell.indexOf("</ref>", m.index));
  // A bar written as a template is a bar in a title, not the end of a field.
  body = body.replace(/\{\{!\}\}/g, "-");
  const field = (k) => {
    const f = new RegExp(`\\|\\s*${k}\\s*=\\s*([^|}]*)`, "i").exec(body);
    return f ? plain(f[1]) : "";
  };
  const url = field("url") || (/\[(https?:\/\/\S+)/.exec(body) || [])[1] || (/(https?:\/\/[^\s|}\]]+)/.exec(body) || [])[1] || "";
  if (!/^https?:\/\//.test(url)) return null;
  const by = field("website") || field("work") || field("newspaper") || field("magazine") || field("publisher") || new URL(url).hostname.replace(/^www\./, "");
  const title = field("title");
  return { by, ...(title ? { title } : {}), url };
}

(async () => {
  const { id, at, text } = await page();

  /* ── The table of contemporary rankings ── */
  const open = text.indexOf('{| class="wikitable');
  const close = text.indexOf("\n|}", open);
  if (open < 0 || close < 0) throw new Error("the table was not found");
  // A reference written over several lines is put on one, so that its own bars are not read as the table's.
  const table = text.slice(open, close).replace(/<ref[^>/]*>[\s\S]*?<\/ref>/g, (m) => m.replace(/\n/g, " "));
  const head = [...table.matchAll(/^!\s*(?:[^|\n]*\|)?\s*(.+)$/gm)].map((m) => plain(m[1]).toLowerCase());
  const col = (re) => {
    const i = head.findIndex((h) => re.test(h));
    if (i < 0) throw new Error(`the table has no column ${re}: ${head.join(" | ")}`);
    return i;
  };
  const C = { name: col(/family/), members: col(/members/), wealth: col(/wealth/), from: col(/source/), country: col(/country/) };

  const families = [];
  const skipped = [];
  /** A cell that spans rows below it: how many more it spans, and what it holds. */
  const spans = [];
  for (const raw of table.split(/\n\|-[^\n]*/).slice(1)) {
    // A row's cells: each on a line that opens with a bar, or several on one line with two bars between; a line that opens with neither goes on from the cell before.
    const cells = [];
    for (const line of raw.split("\n")) {
      if (/^!/.test(line) || !line.trim()) continue;
      if (/^\|/.test(line)) for (const part of line.slice(1).split("||")) cells.push(part);
      else if (cells.length) cells[cells.length - 1] += "\n" + line;
    }
    if (!cells.length) continue;
    const row = [];
    let k = 0;
    for (let c = 0; c < head.length; c++) {
      if (spans[c]?.left > 0) {
        row[c] = spans[c].cell;
        spans[c].left--;
        continue;
      }
      let cell = cells[k++] ?? "";
      // What stands before a single bar is how the cell is drawn, not what it holds - unless the bar is inside a link or a template.
      const bar = /^\s*((?:[a-z-]+\s*=\s*"?[^"|]*"?\s*)+)\|(?!\|)/i.exec(cell);
      const span = bar ? /rowspan\s*=\s*"?(\d+)/i.exec(bar[1]) : null;
      if (bar) cell = cell.slice(bar[0].length);
      if (span) spans[c] = { left: Number(span[1]) - 1, cell };
      row[c] = cell;
    }
    // A figure Wikipedia's own editors have marked as unchecked or doubtful is not taken.
    const flag = /\{\{\s*(AI-retrieved source|citation needed|cn|better source needed|dubious|failed verification|unreliable source\??|verify source|self-published[^|}]*|disputed inline)\b[^}]*\}\}/i.exec(`${row[C.wealth]} ${row[C.name]}`);
    if (flag) {
      skipped.push(`${plain(row[C.name].replace(/\{\{[^}]*\}\}/g, ""))}: its figure is marked "${flag[1]}" by Wikipedia's editors`);
      continue;
    }
    const name = plain(row[C.name]);
    const w =/^[~≈]?\s*(?:US)?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:billion)?\s*(?:\(\s*(?:[A-Za-z]+\s+)?(\d{4})\s*\))?$/.exec(plain(row[C.wealth]));
    if (!name || !w) {
      skipped.push(`${name || "(no name)"}: "${plain(row[C.wealth]).slice(0, 40)}"`);
      continue;
    }
    const cite = cited(row[C.wealth], text) ?? cited(row[C.name], text);
    // Only a figure the list cites to a publication that itself draws up such estimates, or to a newspaper of record, is taken.
    const host = cite ? new URL(cite.url).hostname.replace(/^www\./, "") : null;
    if (!host || !PUBLICATIONS.includes(host)) {
      skipped.push(`${name}: ${host ? `its figure is cited to ${host}` : "its figure cites nothing that could be read"}`);
      continue;
    }
    families.push({
      name,
      wealth: Number(w[1].replace(",", ".")),
      ...(w[2] ? { year: Number(w[2]) } : {}),
      ...(plain(row[C.members]) ? { members: plain(row[C.members]) } : {}),
      ...(plain(row[C.from]) ? { from: plain(row[C.from]) } : {}),
      ...(plain(row[C.country]) ? { country: plain(row[C.country]) } : {}),
      ...(cite ? { cite } : {}),
    });
  }
  if (families.length < 100) throw new Error(`only ${families.length} families were read`);
  families.sort((a, b) => b.wealth - a.wealth);

  /* ── The dynasties of the past ── */
  const past = [];
  const hist = /==\s*Historical\s*==([\s\S]*?)\n==[^=]/.exec(text);
  if (!hist) throw new Error("the historical list was not found");
  for (const line of hist[1].split("\n")) {
    if (!/^\*/.test(line)) continue;
    const link = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/.exec(line);
    const said = plain(line.replace(/^\*\s*/, ""));
    if (!link || !said) continue;
    past.push({ name: plain(link[0]), said, article: link[1].split("#")[0] });
  }
  if (!past.some((p) => /Rothschild/.test(p.name))) throw new Error("the Rothschilds are not in the historical list");

  const withCite = families.filter((f) => f.cite).length;
  fs.writeFileSync(
    OUT,
    `/**
 * The wealthiest families: each with a published estimate of its combined
 * wealth, the year of the estimate and the publication it cites; and the
 * banking and merchant dynasties of the past.
 *
 * GENERATED by build-wealthy-families.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * From Wikipedia's "${TITLE}" (CC BY-SA 4.0), revision ${id} of
 * ${at}. The figures are estimates by the publications cited, made in
 * different years: they are not one ranking, and are given largest first
 * only to be found. The list leaves out royal houses and ruling dynasties.
 */
export const WEALTHY_FAMILIES_RETRIEVED = "${TODAY}";
export const WEALTHY_FAMILIES_SOURCE = {
  label: "Wikipedia — ${TITLE}, revision of ${at} (CC BY-SA 4.0), which cites the publication behind each figure",
  url: "https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(TITLE.replace(/ /g, "_"))}&oldid=${id}",
};

export type WealthyFamily = {
  name: string;
  /** Its combined wealth as estimated, in billions of US dollars. */
  wealth: number;
  /** The year of the estimate, where the list gives one. */
  year?: number;
  /** Its notable members, as the list names them. */
  members?: string;
  /** What its wealth is from. */
  from?: string;
  country?: string;
  /** The publication the list cites for the figure. */
  cite?: { by: string; title?: string; url: string };
};
/** Largest estimate first. */
export const WEALTHY_FAMILIES: WealthyFamily[] = ${JSON.stringify(families)};

/** A dynasty of the past, with what the list says of it and its article. No present-day estimate is given for these. */
export type PastDynasty = { name: string; said: string; article: string };
export const PAST_DYNASTIES: PastDynasty[] = ${JSON.stringify(past)};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${families.length} families (${withCite} with the publication cited), ${past.length} dynasties of the past; revision ${id} of ${at}`);
  console.log(`  left out: ${skipped.length ? skipped.join("; ") : "none"}`);
  for (const f of families.slice(0, 6)) console.log(`  ${f.name}: ${f.wealth} (${f.year ?? "no year"}) · ${f.from} · ${f.country} · ${f.cite ? f.cite.by : "no citation"}`);
  const find = (re) => families.find((f) => re.test(f.name));
  for (const re of [/Rockefeller/, /Ellison/, /Herm/]) console.log(`  ${JSON.stringify(find(re) ?? null).slice(0, 260)}`);
  const lands = {};
  for (const f of families) lands[f.country ?? "(none)"] = (lands[f.country ?? "(none)"] || 0) + 1;
  console.log(`  countries: ${Object.entries(lands).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  ${JSON.stringify(past.find((p) => /Rothschild/.test(p.name))).slice(0, 500)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
