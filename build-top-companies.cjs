/**
 * Builds src/data/topCompanies.ts — the largest companies based in each
 * country, by name, for the Resources tab of an economy's window and the
 * Dashboard explorer's Industry tab.
 *
 * No open register ranks every country's companies. The rankings that exist
 * (Fortune, Forbes) are their publishers' own; Wikidata's revenue records are
 * too thin and too mixed in currency to rank from, and its query service
 * times out on them. What is read is what Wikipedia has set down from the
 * published rankings (CC BY-SA), one table at a time - each a ranking by
 * revenue, named by the section it sits under:
 *
 *   List of largest companies by revenue            the world's largest
 *   List of largest companies in the United States  the Fortune 500's first hundred
 *   List of largest companies in Asia               its thirty largest in the Fortune Global 500
 *   List of largest companies in Africa             Jeune Afrique's hundred largest
 *   each country's page that has a table of its companies in the Fortune Global 500
 *
 * A page's other tables are not read: a ranking by market value, by profit,
 * of private companies, or by another publisher ranks something else, and a
 * company's place in it is not its place by revenue. Of a country's page only
 * the table its own words say is from the Fortune Global 500 is read - not the
 * Fortune Europe, Southeast Asia or India rankings - and only where that table
 * gives each company's place in the Global 500, from the 2022 edition on; the
 * newest such table where a page has more than one.
 *
 * Each table is recorded with the words its page introduces it with, the
 * edition (the year its heading or those words name) and the fiscal year they
 * give. From each row, as written: the company, the country it is based in,
 * its industry, its revenue in the unit the table's heading gives, its rank in
 * the table and, where given, its rank in the Fortune Global 500. A company in
 * more than one table is taken once, from the newest edition (the widest of
 * those of one year). A row whose country cannot be read is left out and
 * counted.
 *
 * So a country's companies here are those large enough to be in one of these
 * rankings - not a ranking made for the country, and not every large company
 * it has. A country none names is absent, and the page says that none of its
 * companies is in these lists rather than naming any.
 *
 *   node build-top-companies.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/topCompanies.ts");
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-top-companies");
fs.mkdirSync(CACHE, { recursive: true });

/** The oldest edition of the Fortune Global 500 a country's table is read from. */
const OLDEST = 2022;
/** The tables read: the page, and the section its ranking by revenue sits under; for a page of one country's companies, that country. */
const TABLES = [
  { title: "List of largest companies by revenue", section: /^List$/ },
  { title: "List of largest companies in the United States by revenue", section: /^List of the largest public/i, country: "United States" },
  { title: "List of largest companies in Asia", section: /^By revenue$/i },
  { title: "List of largest companies in Africa by revenue", section: /^List$/ },
  // Each country's companies in the Fortune Global 500: the table of its page whose words say so.
  ...[
    ["List of largest companies in Canada", "Canada"],
    ["List of largest German companies", "Germany"],
    ["List of largest French companies", "France"],
    ["List of largest companies in the United Kingdom", "United Kingdom"],
    ["List of largest companies of the Netherlands", "Netherlands"],
    ["List of largest Spanish companies", "Spain"],
    ["List of largest Swedish companies", "Sweden"],
    ["List of largest Danish companies", "Denmark"],
    ["List of largest Polish companies", "Poland"],
    ["List of largest companies in Ireland", "Ireland"],
    ["List of largest Australian companies", "Australia"],
    ["List of largest Japanese companies", "Japan"],
    ["List of largest Chinese companies", "China"],
    ["List of largest companies of South Korea", "South Korea"],
    ["List of largest companies in Taiwan", "Taiwan"],
    ["List of largest companies of the United Arab Emirates", "United Arab Emirates"],
    ["List of largest Brazilian companies", "Brazil"],
    ["List of largest Mexican companies", "Mexico"],
  ].map(([title, country]) => ({ title, global500: true, country })),
];
/** Three-letter country codes as the names the site's economies go by: from its own tables, so a code is never guessed. */
const ISO3_NAME = (() => {
  const rents = fs.readFileSync(path.join(__dirname, "src/data/resourceRents.ts"), "utf8");
  const economies = fs.readFileSync(path.join(__dirname, "src/data/economiesData.ts"), "utf8");
  const nameOf = new Map([...economies.matchAll(/\bid:\s*"([^"]+)",\s*\n?\s*name:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const out = {};
  for (const m of rents.matchAll(/"?([a-z0-9-]+)"?:\s*"([A-Z]{3})"/g)) if (nameOf.has(m[1])) out[m[2]] = nameOf.get(m[1]);
  // The economies added later carry their code beside their name.
  const more = fs.readFileSync(path.join(__dirname, "src/data/economiesMore.ts"), "utf8");
  for (const m of more.matchAll(/name:\s*"([^"]+)"[^{}]{0,400}?iso3:\s*"([A-Z]{3})"/g)) out[m[2]] ??= m[1];
  for (const m of more.matchAll(/iso3:\s*"([A-Z]{3})"[^{}]{0,400}?name:\s*"([^"]+)"/g)) out[m[1]] ??= m[2];
  if (Object.keys(out).length < 70) throw new Error(`only ${Object.keys(out).length} three-letter codes read from the site's tables`);
  return out;
})();
/** The names a flag template is given, as the country's name. */
const ALIAS = {
  USA: "United States", US: "United States", "U.S.": "United States", UK: "United Kingdom", GBR: "United Kingdom", CHN: "China", PRC: "China", "People's Republic of China": "China", GER: "Germany", DEU: "Germany",
  JPN: "Japan", FRA: "France", NED: "Netherlands", NLD: "Netherlands", KOR: "South Korea", "Republic of Korea": "South Korea", SUI: "Switzerland", CHE: "Switzerland", ITA: "Italy", ESP: "Spain", IND: "India",
  RUS: "Russia", BRA: "Brazil", MEX: "Mexico", CAN: "Canada", AUS: "Australia", KSA: "Saudi Arabia", SAU: "Saudi Arabia", TWN: "Taiwan", "Republic of China": "Taiwan", ROC: "Taiwan", SGP: "Singapore", SIN: "Singapore",
  HKG: "Hong Kong", THA: "Thailand", MAS: "Malaysia", MYS: "Malaysia", IDN: "Indonesia", INA: "Indonesia", TUR: "Turkey", Türkiye: "Turkey", UAE: "United Arab Emirates", RSA: "South Africa", ZAF: "South Africa",
  EGY: "Egypt", NGA: "Nigeria", NGR: "Nigeria", ARG: "Argentina", CHL: "Chile", CHI: "Chile", COL: "Colombia", NOR: "Norway", SWE: "Sweden", DEN: "Denmark", DNK: "Denmark", FIN: "Finland", BEL: "Belgium", AUT: "Austria",
  IRL: "Ireland", IRE: "Ireland", LUX: "Luxembourg", POL: "Poland", POR: "Portugal", PRT: "Portugal", NZL: "New Zealand", VNM: "Vietnam", VIE: "Vietnam", PHI: "Philippines", PHL: "Philippines", ISR: "Israel",
  IRN: "Iran", QAT: "Qatar", KUW: "Kuwait", KWT: "Kuwait", MAR: "Morocco", ALG: "Algeria", DZA: "Algeria", ANG: "Angola", AGO: "Angola", VEN: "Venezuela", PER: "Peru",
};

async function page(title) {
  const at = path.join(CACHE, `${crypto.createHash("md5").update(title).digest("hex")}.json`);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return JSON.parse(fs.readFileSync(at, "utf8"));
  const res = await fetch(`https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=parse&prop=wikitext|revid&redirects=1&page=${encodeURIComponent(title)}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return JSON.parse(text);
}

/** Wikitext without its pictures: each [[File:...]] taken out whole, with the links its caption holds. */
function noFiles(s) {
  for (let at = s.search(/\[\[(?:File|Image):/i); at >= 0; at = s.search(/\[\[(?:File|Image):/i)) {
    let depth = 0;
    let end = at;
    for (; end < s.length; end++) {
      if (s.startsWith("[[", end)) {
        depth++;
        end++;
      } else if (s.startsWith("]]", end)) {
        depth--;
        end++;
        if (depth === 0) break;
      }
    }
    s = s.slice(0, at) + s.slice(end + 1);
  }
  return s;
}

/** A cell as plain words: a number template as its number, a flag as nothing, a link as its label. */
function plain(cell) {
  let s = noFiles(cell.replace(/<!--[\s\S]*?-->/g, "").replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, ""));
  for (let before = ""; before !== s; ) {
    before = s;
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body) => {
      const parts = body.split("|").map((p) => p.trim());
      const name = parts[0].toLowerCase();
      if (/^(nts|ntsh|formatnum|val|number table sorting|nowrap|small|sort|sortname|dts)$/.test(name)) return name === "sort" || name === "ntsh" ? (parts[2] ?? "") : (parts[1] ?? "");
      if (/^(us\$|usd|€|eur|gbp|£|increase|decrease|steady|profit|loss|gain)$/.test(name)) return parts[1] ?? "";
      return "";
    });
  }
  return s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/'{2,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The country a cell names: by its flag template, or else its words. */
function countryOf(cell) {
  const flag = cell.match(/\{\{\s*(?:flag|flagcountry|flagu|flagicon|flag icon|flagdeco)\s*\|\s*([^|}]+)/i);
  const three = cell.match(/\{\{\s*([A-Z]{3})\s*\}\}/);
  const raw = (flag ? flag[1] : three ? three[1] : plain(cell).split(",").pop()).trim();
  const name = ALIAS[raw] ?? ISO3_NAME[raw] ?? raw;
  return /^[A-Z][A-Za-z .'’-]{2,40}$/.test(name) ? name : null;
}

/** A page's tables, each with the section heading it sits under and the words between that heading and it. */
function tablesOf(wikitext) {
  const w = wikitext.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const heads = [...w.matchAll(/\n(==+)\s*([^=\n]+?)\s*\1[ \t]*(?=\n)/g)].map((m) => ({ at: m.index, end: m.index + m[0].length, text: plain(m[2]) }));
  const lead = w.slice(0, heads[0]?.at ?? w.length);
  const out = [];
  for (const m of w.matchAll(/(^|\n)\{\|/g)) {
    const start = m.index + m[1].length;
    const end = w.indexOf("\n|}", start);
    if (end < 0) continue;
    const head = heads.filter((h) => h.at < start).pop();
    // Its words: the paragraphs from its heading to it, without the templates and the tables of the page before it.
    const words = plain(w.slice(head ? head.end : 0, start).replace(/\{\|[\s\S]*?\n\|\}/g, ""));
    out.push({ section: head?.text ?? "", words, lead: plain(lead), text: w.slice(start, end + 3) });
  }
  return out;
}

/** The edition a table is of - the year its heading names, else the year its words give the ranking - and its fiscal year, in its words' own phrase. */
function datesOf(section, words) {
  const edition = Number((section.match(/\b(20\d\d)\b/) || words.match(/\b(20\d\d)\s+(?:edition of the\s+)?Fortune\b/i) || words.match(/\b(20\d\d) edition\b/i) || words.match(/\b(?:in|primarily)\s+(20\d\d)\b/i) || [])[1]) || null;
  const fiscal = (words.match(/((?:mostly for\s+)?(?:fiscal|financial) years?\s+(?:ending on or before\s+\d{1,2}\s+\w+\s+\d{4}|\d{4}(?:\/\d{2,4})?))/i) || [])[1] ?? null;
  return { edition, fiscal };
}

/** A company's name without the words that only say what kind of company it is, for telling one company in two tables of a country. */
function nameKey(name) {
  const words = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[.,'’&()]/g, " ").split(/\s+/).filter(Boolean);
  const kinds = new Set(["the", "group", "corporation", "corp", "company", "co", "inc", "incorporated", "ltd", "limited", "plc", "ag", "se", "sa", "s", "a", "nv", "n", "v", "holdings", "holding"]);
  while (words.length > 1 && kinds.has(words[words.length - 1])) words.pop();
  while (words.length > 1 && words[0] === "the") words.shift();
  return words.join(" ");
}

/** Each article title as the page it leads to, following Wikipedia's redirects: fifty titles a request. */
async function canonical(titles) {
  const out = new Map();
  const list = [...new Set(titles)];
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    const res = await fetch(`https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Wikipedia: HTTP ${res.status}`);
    const q = (await res.json()).query ?? {};
    const norm = new Map((q.normalized ?? []).map((n) => [n.from, n.to]));
    const redir = new Map((q.redirects ?? []).map((r) => [r.from, r.to]));
    for (const t of batch) {
      const n = norm.get(t) ?? t;
      out.set(t, redir.get(n) ?? n);
    }
  }
  return out;
}

function rowsOf(wikitext, forced) {
  const out = [];
  let at = null;
  let unit = "";
  let width = 0;
  let carry = [];
  let skipped = 0;
  const text = wikitext.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
  for (const raw of text.split(/\n\|-[^\n]*\n/)) {
    const row = raw.split(/\n\|\}/)[0];
    const lines = row.split("\n");
    const heads = lines.filter((l) => l.startsWith("!") && !/scope\s*=\s*"?row/.test(l));
    const headCells = heads.join("\n").replace(/^!/, "").split(/!!|\n!/).map((h) => plain(h.replace(/^[^|\[]*\|(?!\|)/, "").replace(/<br\s*\/?>/gi, " ")));
    // A heading is a line or lines of heading cells: at least three of them.
    // A second heading row under the first says what the revenue is counted in.
    if (heads.length && headCells.length < 3 && at && at.revenue >= 0 && !unit && /\$|usd|million|billion/i.test(headCells[0] ?? "")) {
      unit = `Revenue (${headCells[0]})`;
      continue;
    }
    if (heads.length && headCells.length >= 3) {
      const cells = headCells;
      width = cells.length;
      carry = [];
      const find = (re) => cells.findIndex((h) => re.test(h.toLowerCase()));
      const found = {
        name: find(/^(name|company|corporation)/),
        country: find(/headquarter|country|nation\b|location/),
        revenue: find(/revenue|sales/),
        industry: find(/industry|sector/),
        rank: find(/^(rank|no\b|#|national rank)/),
        // Its place in the Fortune Global 500, where the table gives it beside its own rank.
        g500: find(/^(fortune (global )?500 rank|global rank)/),
      };
      at = found.name >= 0 && (found.country >= 0 || forced) ? found : null;
      // A revenue is kept only where the heading says what it is counted in.
      unit = at && at.revenue >= 0 && /\$|usd|eur|€|£|billion|million|bn\b|mil\b/i.test(cells[at.revenue]) ? cells[at.revenue] : "";
      continue;
    }
    if (!at) continue;
    // A row may open with its rank as a heading cell of its own. A cell that spans rows is not written again in the rows under it: it is carried down to them.
    const written = row.replace(/^[\s|!]+/, "").split(/\|\||!!|\n[|!]/);
    const cells = [];
    for (let col = 0, next = 0; col < width; col++) {
      if (carry[col]?.left > 0) {
        cells.push(carry[col].text);
        carry[col].left--;
        continue;
      }
      if (next >= written.length) break;
      const rawCell = written[next++];
      const attrs = (rawCell.match(/^\s*((?:[a-z-]+\s*=\s*"?[^|"\n]*"?\s*)+)\|(?!\|)/i) || [])[1] ?? "";
      const text = rawCell.replace(/^\s*(?:[a-z-]+\s*=\s*"?[^|"\n]*"?\s*)+\|(?!\|)/i, "").trim();
      const span = Number((attrs.match(/rowspan\s*=\s*"?(\d+)/i) || [])[1] ?? 1);
      if (span > 1) carry[col] = { text, left: span - 1 };
      cells.push(text);
    }
    if (cells.length <= Math.max(at.name, forced ? 0 : at.country)) continue;
    const nameCell = cells[at.name];
    const name = plain(nameCell);
    const article = (nameCell.match(/\[\[([^\]|#]+)/) || [])[1]?.trim();
    const country = forced ?? countryOf(cells[at.country]);
    if (!name || name.length > 80) continue;
    if (!country) {
      skipped++;
      continue;
    }
    const revenue = at.revenue >= 0 ? plain(cells[at.revenue] ?? "") : "";
    const industry = at.industry >= 0 ? plain(cells[at.industry] ?? "") : "";
    const rank = at.rank >= 0 ? plain(cells[at.rank] ?? "") : "";
    const g500 = at.g500 >= 0 && at.g500 !== at.rank ? plain(cells[at.g500] ?? "") : "";
    out.push({
      name,
      article,
      country,
      ...(industry && industry.length <= 60 ? { industry } : {}),
      ...(unit && /\d/.test(revenue) && revenue.length <= 24 ? { revenue, unit } : {}),
      ...(/^\d+$/.test(rank) ? { rank: Number(rank) } : {}),
      ...(/^\d+$/.test(g500) ? { g500: Number(g500) } : {}),
    });
  }
  return { rows: out, skipped };
}

/** The table of a page to read: the one under the section asked for, or the newest of its Fortune Global 500 tables. */
function pick(spec, tables) {
  if (spec.section) return tables.find((t) => spec.section.test(t.section)) ?? null;
  const g = tables.filter((t) => {
    if (!/fortune/i.test(t.section)) return false;
    // Its own words name the Global 500, and no other of Fortune's rankings.
    if (!/Fortune Global 500/i.test(t.words) || /Fortune (Europe|Southeast Asia|India|China|Africa) 500/i.test(t.words)) return false;
    // It gives each company's place in the Global 500.
    const head = (t.text.match(/^[\s\S]*?\n\|-/) || [""])[0] + (t.text.split(/\n\|-[^\n]*\n/)[1] ?? "");
    return /(fortune\s*(global\s*)?500\s*rank|global rank)/i.test(plain(head.replace(/<br\s*\/?>/gi, " ")));
  });
  const dated = g.map((t) => ({ t, ...datesOf(t.section, t.words) })).filter((x) => x.edition && x.edition >= OLDEST);
  dated.sort((a, b) => b.edition - a.edition);
  return dated[0]?.t ?? null;
}

(async () => {
  const read = [];
  let skipped = 0;
  for (const [order, spec] of TABLES.entries()) {
    const j = await page(spec.title);
    if (!j.parse) {
      console.log(`  ${spec.title}: no such page`);
      continue;
    }
    const table = pick(spec, tablesOf(j.parse.wikitext));
    if (!table) {
      console.log(`  ${spec.title}: no table read`);
      continue;
    }
    const { rows, skipped: s } = rowsOf(table.text, spec.country);
    if (!rows.length) {
      console.log(`  ${spec.title}: no rows read from "${table.section}"`);
      continue;
    }
    skipped += s;
    // The words it is introduced with; where its heading has none, the page's opening words say what it is.
    const words = /\d{4}/.test(table.words) ? table.words : table.lead;
    const { edition, fiscal } = datesOf(table.section, words);
    read.push({ order, title: j.parse.title, section: table.section, about: words.slice(0, 600), edition, fiscal, global500: !!spec.global500, revision: j.parse.revid, rows });
  }
  // The newest edition first, and of one year the widest: a company in more than one is taken from the first. One company
  // in two tables is told by the page its article link leads to, or by its name in the same country without the words
  // that say what kind of company it is (Volkswagen Group and Volkswagen).
  read.sort((a, b) => (b.edition ?? 0) - (a.edition ?? 0) || a.order - b.order);
  const pageOf = await canonical(read.flatMap((t) => t.rows.flatMap((r) => (r.article ? [r.article] : []))));
  const lists = [];
  const byCountry = new Map();
  const seen = new Map();
  let twice = 0;
  for (const t of read) {
    const index = lists.length;
    lists.push({ title: t.title, section: t.section, about: t.about, edition: t.edition, fiscal: t.fiscal, global500: t.global500, revision: t.revision, rows: t.rows.length });
    for (const r of t.rows) {
      const keys = [...(r.article ? [`page:${(pageOf.get(r.article) ?? r.article).toLowerCase()}`] : []), `name:${r.country}:${nameKey(r.name)}`];
      const hit = keys.find((k) => seen.has(k));
      if (hit) {
        twice++;
        // Told apart by name alone: said, so that two companies taken for one would show.
        if (process.env.SHOW_TWICE && hit.startsWith("name:")) console.log(`  same name: ${r.name} (${r.article ?? "-"}) in ${t.title} = ${seen.get(hit)}`);
        continue;
      }
      for (const k of keys) seen.set(k, `${r.name} (${r.article ?? "-"}) in ${t.title}`);
      const { country, ...rest } = r;
      const list = byCountry.get(country) ?? [];
      list.push({ ...rest, list: index });
      byCountry.set(country, list);
    }
  }
  if (lists.length < 10 || byCountry.size < 30) throw new Error(`only ${lists.length} tables and ${byCountry.size} countries read`);
  const today = new Date().toISOString().slice(0, 10);
  const countries = [...byCountry.keys()].sort();
  const total = [...byCountry.values()].reduce((n, l) => n + l.length, 0);

  fs.writeFileSync(
    OUT,
    `/**
 * The largest companies based in each country, as Wikipedia's tables of the
 * world's, each region's and each country's largest companies by revenue
 * name them.
 *
 * GENERATED by build-top-companies.cjs on ${today} — do not edit by hand; change
 * the script and re-run it.
 *
 * ${total} companies in ${countries.length} countries, from ${lists.length} tables, each a ranking by
 * revenue: a page's tables of market value, profit, private companies or
 * another publisher's ranking are not read. Each company is given as its table
 * writes it: its name, its industry, its revenue in the unit the table's
 * heading gives, its place in the table and, where given, in the Fortune
 * Global 500. \`list\` says which table; each table has the words its page
 * introduces it with, its edition and the fiscal year those words give. A
 * company in more than one table is taken once, from the newest edition.
 * ${skipped} rows whose country could not be read were left out.
 *
 * These are the companies large enough for a world, regional or Global 500
 * ranking - not a ranking made for the country, and not all its large
 * companies. A country that is not here has no company in these tables.
 */
/** Each table: its page, its section, the words it is introduced with, its edition and fiscal year, and whether it is one country's companies in the Fortune Global 500. */
export const TOP_COMPANY_LISTS: { title: string; section: string; about: string; edition: number | null; fiscal: string | null; global500: boolean; revision: number; rows: number; url: string }[] = ${JSON.stringify(lists.map((l) => ({ ...l, url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(l.title.replace(/ /g, "_"))}&oldid=${l.revision}` })))};
export const TOP_COMPANIES_RETRIEVED = "${today}";

export type TopCompany = {
  name: string;
  /** The title of its Wikipedia article, where the table links one. */
  article?: string;
  industry?: string;
  /** Its revenue as the table writes it, and the unit the table's heading gives. */
  revenue?: string;
  unit?: string;
  /** Which table it is from (an index into TOP_COMPANY_LISTS), its place there, and its place in the Fortune Global 500 where the table gives it. */
  list: number;
  rank?: number;
  g500?: number;
};

/** By the country's name. */
export const TOP_COMPANIES: Record<string, TopCompany[]> = {
${countries.map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(byCountry.get(c))},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  for (const l of lists) console.log(`  [${l.edition ?? "-"} fy ${l.fiscal ?? "-"}] ${l.title} · "${l.section}" · ${l.rows} rows`);
  console.log(`  rows without a country ${skipped}; rows of a company already taken from a newer table ${twice}; ${countries.length} countries: ${countries.map((c) => `${c} ${byCountry.get(c).length}`).join(", ")}`);
  for (const c of ["United States", "Germany", "Nigeria", "Brazil", "South Korea", "China", "Poland"]) console.log(`  ${c}: ${(byCountry.get(c) ?? []).slice(0, 3).map((x) => `${x.name} [${x.industry ?? "-"}] ${x.revenue ?? "-"} ${x.unit ?? ""} #${x.rank ?? "-"} g${x.g500 ?? "-"}/${x.list}`).join(" | ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
