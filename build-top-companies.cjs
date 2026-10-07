/**
 * Builds src/data/topCompanies.ts — the largest companies based in each
 * country, by name, for the Resources tab of an economy's window.
 *
 * No open register ranks every country's companies. The rankings that exist
 * (Fortune, Forbes) are their publishers' own; Wikidata's revenue records are
 * too thin and too mixed in currency to rank from, and its query service
 * times out on them. What is read is what Wikipedia has set down from the
 * published rankings (CC BY-SA), list by list:
 *
 *   List of largest companies by revenue          the world's fifty largest
 *   List of largest companies in Europe by revenue
 *   List of largest companies in Asia
 *   List of largest companies in Africa by revenue
 *   (and the lists for the Americas and Oceania, where Wikipedia has them)
 *
 * From each table, as written: the company, the country it is based in, its
 * industry, and its revenue in the unit the table's heading gives. A row
 * whose country cannot be read is left out and counted; the revision of each
 * list is recorded. A company in more than one list is taken once, from the
 * first that has it.
 *
 * So a country's companies here are those large enough to be in a world or a
 * regional ranking - not a ranking made for the country, and not every large
 * company it has. A country no list names is absent, and the page says that
 * none of its companies is in these lists rather than naming any.
 *
 *   node build-top-companies.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/topCompanies.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-top-companies");
fs.mkdirSync(CACHE, { recursive: true });

/** The lists, the widest first: a company is taken from the first that has it. */
const LISTS = [
  "List of largest companies by revenue",
  "List of largest companies in Europe by revenue",
  "List of largest companies in Asia",
  "List of largest companies in Africa by revenue",
  "List of largest companies in Latin America",
  "List of largest companies in South America",
  "List of largest companies in Oceania",
  "List of largest companies in the United States by revenue",
  "List of largest companies in Canada",
];
/** A list of one country's companies, whose table gives a state or a city and not the country. */
const COUNTRY_OF_LIST = { "List of largest companies in the United States by revenue": "United States", "List of largest companies in Canada": "Canada" };
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

/** A cell as plain words: a number template as its number, a flag as nothing, a link as its label. */
function plain(cell) {
  let s = cell.replace(/<!--[\s\S]*?-->/g, "").replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "").replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "");
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
    const headCells = heads.join("\n").replace(/^!/, "").split(/!!|\n!/).map((h) => plain(h.replace(/^[^|\[]*\|/, "").replace(/<br\s*\/?>/gi, " ")));
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
      const found = { name: find(/^(name|company|corporation)/), country: find(/headquarter|country|nation|location/), revenue: find(/revenue|sales/), industry: find(/industry|sector/), rank: find(/^rank|^no\b|^#/) };
      at = found.name >= 0 && (found.country >= 0 || forced) ? found : null;
      // A revenue is kept only where the heading says what it is counted in.
      unit = at && at.revenue >= 0 && /\$|usd|eur|€|£|billion|million|bn\b|mil\b/i.test(cells[at.revenue]) ? cells[at.revenue] : "";
      continue;
    }
    if (!at) continue;
    // A row may open with its rank as a heading cell of its own. A cell that spans rows is not written again in the rows under it: it is carried down to them.
    const written = row.replace(/^[\s|!]+/, "").split(/\|\||\n[|!]/);
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
    out.push({ name, article, country, ...(industry && industry.length <= 60 ? { industry } : {}), ...(unit && /\d/.test(revenue) && revenue.length <= 24 ? { revenue, unit } : {}), ...(/^\d+$/.test(rank) ? { rank: Number(rank) } : {}) });
  }
  return { rows: out, skipped };
}

(async () => {
  const lists = [];
  const byCountry = new Map();
  const seen = new Set();
  let skipped = 0;
  for (const title of LISTS) {
    const j = await page(title);
    if (!j.parse) continue;
    const { rows, skipped: s } = rowsOf(j.parse.wikitext, COUNTRY_OF_LIST[title]);
    if (!rows.length) continue;
    skipped += s;
    const index = lists.length;
    lists.push({ title: j.parse.title, revision: j.parse.revid, rows: rows.length });
    for (const r of rows) {
      const key = (r.article ?? r.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const { country, ...rest } = r;
      const list = byCountry.get(country) ?? [];
      list.push({ ...rest, list: index });
      byCountry.set(country, list);
    }
  }
  if (lists.length < 2 || byCountry.size < 20) throw new Error(`only ${lists.length} lists and ${byCountry.size} countries read`);
  const today = new Date().toISOString().slice(0, 10);
  const countries = [...byCountry.keys()].sort();
  const total = [...byCountry.values()].reduce((n, l) => n + l.length, 0);

  fs.writeFileSync(
    OUT,
    `/**
 * The largest companies based in each country, as Wikipedia's lists of the
 * world's and each region's largest companies name them.
 *
 * GENERATED by build-top-companies.cjs on ${today} — do not edit by hand; change
 * the script and re-run it.
 *
 * ${total} companies in ${countries.length} countries, from ${lists.length} lists. Each is given as its list
 * writes it: its name, its industry, and its revenue in the unit the list's
 * heading gives; \`list\` says which list, and \`rank\` its place in that list.
 * A company in more than one list is taken once, from the widest. ${skipped} rows
 * whose country could not be read were left out.
 *
 * These are the companies large enough for a world or a regional ranking -
 * not a ranking made for the country, and not all its large companies. A
 * country that is not here has no company in these lists.
 */
export const TOP_COMPANY_LISTS: { title: string; revision: number; rows: number; url: string }[] = ${JSON.stringify(lists.map((l) => ({ ...l, url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(l.title.replace(/ /g, "_"))}&oldid=${l.revision}` })))};
export const TOP_COMPANIES_RETRIEVED = "${today}";

export type TopCompany = {
  name: string;
  /** The title of its Wikipedia article, where the list links one. */
  article?: string;
  industry?: string;
  /** Its revenue as the list writes it, and the unit the list's heading gives. */
  revenue?: string;
  unit?: string;
  /** Which list it is from (an index into TOP_COMPANY_LISTS), and its place there. */
  list: number;
  rank?: number;
};

/** By the country's name. */
export const TOP_COMPANIES: Record<string, TopCompany[]> = {
${countries.map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(byCountry.get(c))},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  lists: ${lists.map((l) => `${l.title.replace(/^List of largest companies /, "")} ${l.rows}`).join("; ")} · rows without a country ${skipped}`);
  console.log(`  ${countries.length} countries: ${countries.map((c) => `${c} ${byCountry.get(c).length}`).join(", ")}`);
  for (const c of ["United States", "Germany", "Nigeria", "Brazil"]) console.log(`  ${c}: ${(byCountry.get(c) ?? []).slice(0, 4).map((x) => `${x.name} [${x.industry ?? "-"}] ${x.revenue ?? "-"} ${x.unit ?? ""} #${x.rank ?? "-"}/${x.list}`).join(" | ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
