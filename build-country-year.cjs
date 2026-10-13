/**
 * Builds static/year/CC.json and src/data/countryYear.ts — the year so far
 * in each country, for the Political climate panel of a country's window:
 * what has happened there this year, day by day, each with the report it
 * rests on.
 *
 * The site does not write these. They are the entries of Wikipedia's own
 * article for the year in the country ("2026 in France"), in its editors'
 * words, under CC BY-SA 4.0: the dated lines of the article's Events
 * section, with links and notes removed. Beside each is the first report the
 * line cites - the outlet and the address - so that a reader goes to the
 * report, and to Wikipedia only after it. The revision each file was read
 * from is recorded, and linked.
 *
 * Only what can be read whole is kept: a line with a date at its head, on or
 * before today, whose text is left with no markup once the known forms are
 * taken out, and which cites a report with an address. A line that is not
 * is dropped and counted, never mended. What
 * the article lists as scheduled or predicted is not taken. The newest
 * forty are kept for each country.
 *
 * A country whose article is not found under its name has no file, and the
 * panel says so. The article is found by its title alone - "2026 in" and the
 * country's name as Wikipedia writes it - and a redirect is followed only to
 * another article of the same year.
 *
 *   node build-country-year.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT_DIR = path.join(__dirname, "static/year");
const OUT = path.join(__dirname, "src/data/countryYear.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-country-year");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = Number(TODAY.slice(0, 4));
/** How many of a country's entries are kept: the newest. */
const KEEP = 40;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* The country's name as the title of Wikipedia's article has it, where that is not "2026 in" and the site's name for it. */
const TITLES = {
  US: "the United States",
  GB: "the United Kingdom",
  GE: "Georgia (country)",
  NL: "the Netherlands",
  PH: "the Philippines",
  AE: "the United Arab Emirates",
  CZ: "the Czech Republic",
  BS: "the Bahamas",
  GM: "the Gambia",
  MV: "the Maldives",
  DO: "the Dominican Republic",
  CF: "the Central African Republic",
  KM: "the Comoros",
  SB: "the Solomon Islands",
  MH: "the Marshall Islands",
  CG: "the Republic of the Congo",
  CD: "the Democratic Republic of the Congo",
  CI: "Ivory Coast",
  TL: "Timor-Leste",
  MM: "Myanmar",
  TR: "Turkey",
  PS: "the State of Palestine",
  KP: "North Korea",
  KR: "South Korea",
  CV: "Cape Verde",
  ST: "São Tomé and Príncipe",
  FM: "the Federated States of Micronesia",
  VA: "Vatican City",
  SC: "Seychelles",
  IE: "Ireland",
  RU: "Russia",
  SY: "Syria",
  IR: "Iran",
  LA: "Laos",
  VN: "Vietnam",
  BN: "Brunei",
  MD: "Moldova",
  TZ: "Tanzania",
  BO: "Bolivia",
  VE: "Venezuela",
  SZ: "Eswatini",
  MK: "North Macedonia",
};

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** The article of a title: its wikitext, its revision and the title it resolved to; null where there is none. */
async function article(title) {
  const at = path.join(CACHE, `${title.replace(/[^A-Za-z0-9]+/g, "_")}.json`);
  let text;
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) text = fs.readFileSync(at, "utf8");
  else {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title.replace(/ /g, "_"))}&prop=wikitext%7Crevid&redirects=1&format=json&formatversion=2`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    text = await res.text();
    fs.writeFileSync(at, text);
    await sleep(120);
  }
  const d = JSON.parse(text);
  if (d.error) return null;
  return { title: d.parse.title, revid: d.parse.revid, wikitext: d.parse.wikitext };
}

const entities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
/** A line of wikitext as plain text, or null where something is left in it that is not text. */
function plain(line) {
  let s = line
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{\s*(snd|spaced ndash|spnd|ndash|–)\s*\}\}/gi, " – ")
    .replace(/\{\{\s*(nbsp|sp|space)\s*\}\}/gi, " ")
    .replace(/\{\{\s*'\s*\}\}/g, "'")
    .replace(/\{\{\s*(?:lang|transl|transliteration)\s*\|[^|{}]*\|([^|{}]*)\}\}/gi, "$1")
    .replace(/\{\{\s*(?:ill|interlanguage link)\s*\|([^|{}]*)(?:\|[^{}]*)?\}\}/gi, "$1")
    .replace(/\{\{\s*(?:nowrap|nobr|small|abbr)\s*\|([^|{}]*)(?:\|[^{}]*)?\}\}/gi, "$1")
    .replace(/\{\{\s*(?:flagicon|flagdeco|flagu?)\s*\|[^{}]*\}\}/gi, "")
    .replace(/\{\{\s*(?:citation needed|cn|better source needed|clarify|when|update inline|dead link|full citation needed|verify source|failed verification)[^{}]*\}\}/gi, "");
  if (/\{\{|\}\}/.test(s)) return null;
  s = s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]|]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/[^\s\]]+\s+([^\]]+)\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<\/?(?:small|sup|sub|nowiki|span|i|b|u|s)(?:\s[^>]*)?>/gi, "")
    .replace(/<br\s*\/?>/gi, " ");
  s = entities(s).replace(/\s+/g, " ").replace(/ ([,.;:])/g, "$1").trim();
  if (/[<>[\]{}|]/.test(s) || /https?:\/\//.test(s)) return null;
  return s;
}
/** The first report a line cites: the outlet's name, and the address. */
function reportOf(refs) {
  for (const ref of refs) {
    const url = (ref.match(/\|\s*url\s*=\s*(https?:\/\/[^\s|}<]+)/i) || ref.match(/\[(https?:\/\/[^\s\]]+)/) || [])[1];
    if (!url) continue;
    let host;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    const named = (ref.match(/\|\s*(?:website|work|newspaper|publisher|agency|magazine|journal)\s*=\s*([^|}]+)/i) || [])[1];
    const label = named ? plain(named.trim()) : null;
    return [label && label.length <= 60 && !/\./.test(label) ? label : host, url];
  }
  return null;
}
const MONTH = MONTHS.join("|");
const DAY_FIRST = new RegExp(`^(\\d{1,2})(?:\\s*[–-]\\s*(?:\\d{1,2}\\s+(?:${MONTH})|\\d{1,2}))?\\s+(${MONTH})\\b(?:\\s*[–-]\\s*\\d{1,2}\\s+(?:${MONTH}))?\\s*[–—:-]?\\s*(.*)$`);
const MONTH_FIRST = new RegExp(`^(${MONTH})\\s+(\\d{1,2})(?:\\s*[–-]\\s*(?:(?:${MONTH})\\s+)?\\d{1,2})?\\b\\s*[–—:-]?\\s*(.*)$`);

/** The dated lines of the article's Events section, newest first; null where it has no such section. */
function eventsOf(wikitext) {
  const head = wikitext.match(/^==\s*Events(?: by month)?\s*==\s*$/m);
  if (!head) return null;
  const rest = wikitext.slice(head.index + head[0].length);
  const end = rest.search(/^==[^=]/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const out = [];
  let dropped = 0;
  let skip = false;
  let day = null;
  for (const raw of body.split("\n")) {
    const h = raw.match(/^(={3,5})\s*(.*?)\s*\1\s*$/);
    if (h) {
      // What is to come, and what goes on all year, is not what has happened.
      skip = /scheduled|predicted|upcoming|future|ongoing|holiday|unknown|expected/i.test(h[2]);
      day = null;
      continue;
    }
    if (skip) continue;
    const b = raw.match(/^(\*+)\s*(.*)$/);
    if (!b) continue;
    const refs = [...b[2].matchAll(/<ref[^>/]*>([\s\S]*?)<\/ref>/gi)].map((m) => m[1]);
    const bare = plain(b[2].replace(/<ref[^>/]*>[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, ""));
    if (bare === null) {
      dropped++;
      continue;
    }
    let text = bare;
    const d1 = bare.match(DAY_FIRST);
    const d2 = d1 ? null : bare.match(MONTH_FIRST);
    if (d1 || d2) {
      const dd = Number(d1 ? d1[1] : d2[2]);
      const mm = MONTHS.indexOf(d1 ? d1[2] : d2[1]) + 1;
      const iso = `${YEAR}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      const real = new Date(`${iso}T00:00:00Z`);
      day = real.getUTCDate() === dd && real.getUTCMonth() + 1 === mm ? iso : null;
      text = (d1 ? d1[3] : d2[3]).trim();
    } else if (b[1].length === 1) day = null;
    if (!text) continue; // A date alone: the lines under it are its events.
    if (!day || day > TODAY || text.length < 20 || text.length > 700 || !/[A-Za-z]/.test(text[0])) {
      dropped++;
      continue;
    }
    // A line that cites no report a reader can open would rest on Wikipedia alone: it is not kept.
    const report = reportOf(refs);
    if (!report) {
      dropped++;
      continue;
    }
    out.push([day, text.replace(/^[a-z]/, (c) => c.toUpperCase()), ...report]);
  }
  // Newest first; the article's own order within a day.
  const ordered = out.map((e, i) => [e, i]).sort((a, b) => b[0][0].localeCompare(a[0][0]) || a[1] - b[1]).map(([e]) => e);
  return { events: ordered.slice(0, KEEP), all: ordered.length, dropped };
}

(async () => {
  const countries = loadCountries();
  const pages = {};
  const none = [];
  let entries = 0;
  let dropped = 0;
  for (const f of fs.readdirSync(OUT_DIR)) if (/^[A-Z]{2}\.json$/.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
  for (const c of countries) {
    // The site writes "Trinidad & Tobago"; the article's title has "and".
    const written = c.name.replace(/ & /g, " and ");
    const names = TITLES[c.code] ? [TITLES[c.code]] : [written, `the ${written}`];
    let got = null;
    for (const name of names) {
      const a = await article(`${YEAR} in ${name}`);
      // A redirect is followed only to another article of the year: never to a list, a region or another country's page.
      if (a && new RegExp(`^${YEAR} in `).test(a.title) && (TITLES[c.code] || a.title === `${YEAR} in ${name}`)) {
        got = a;
        break;
      }
    }
    const read = got && eventsOf(got.wikitext);
    if (!read || !read.events.length) {
      none.push(`${c.name}${got ? (read ? " (no dated line could be read)" : " (no Events section)") : ""}`);
      continue;
    }
    fs.writeFileSync(path.join(OUT_DIR, `${c.code}.json`), JSON.stringify({ t: got.title, r: got.revid, e: read.events }));
    pages[c.code] = { title: got.title, revid: got.revid, n: read.events.length, of: read.all };
    entries += read.events.length;
    dropped += read.dropped;
  }
  const codes = Object.keys(pages).sort();
  if (codes.length < 100) throw new Error(`only ${codes.length} countries have a year that could be read`);

  fs.writeFileSync(
    OUT,
    `/**
 * The year so far in each country: which countries have a file of the
 * year's events (static/year/CC.json), and the revision of Wikipedia's
 * article each was read from.
 *
 * GENERATED by build-country-year.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * The entries are Wikipedia's, in its editors' words (CC BY-SA 4.0): the
 * dated lines of the Events section of "${YEAR} in" the country, the newest
 * ${KEEP} of them, each with the first report it cites. A line that could not
 * be read whole, or that cites no report, was dropped, ${dropped.toLocaleString("en-US")} in all; ${none.length} countries have no file.
 */
export const COUNTRY_YEAR = ${YEAR};
export const COUNTRY_YEAR_RETRIEVED = "${TODAY}";
export const COUNTRY_YEAR_KEPT = ${KEEP};
export const COUNTRY_YEAR_LICENCE = { label: "Creative Commons Attribution-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" };

/** A file of a country's year: the article's title, its revision, and the entries newest first - the day, the line, and the outlet and address of the first report it cites. */
export type CountryYearFile = { t: string; r: number; e: [day: string, text: string, outlet: string, url: string][] };

/** By ISO code: the article, the revision read, how many entries are in the file and how many dated lines the article had. */
export const COUNTRY_YEAR_PAGES: Record<string, { title: string; revid: number; n: number; of: number }> = {
${codes.map((c) => `  ${c}: ${JSON.stringify(pages[c])},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} and ${codes.length} files in static/year`);
  console.log(`  ${entries} entries kept, ${dropped} lines dropped`);
  console.log(`  no file (${none.length}): ${none.join("; ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
