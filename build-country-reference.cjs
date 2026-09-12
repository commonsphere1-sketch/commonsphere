/**
 * Builds src/data/countryReference.ts — religions, spoken languages and World
 * Heritage sites for countries whose entry in countriesData.ts has none.
 *
 * Sources, both free to reuse:
 *  - CIA World Factbook (public domain), via the factbook/factbook.json mirror
 *    of the CIA's pages: religions and languages, with the survey year.
 *  - UNESCO World Heritage List (whc.unesco.org/en/list/xml): inscribed sites.
 *
 * Nothing is inferred. Religion and language text is split into names in the
 * Factbook's own words and ordered by the share it gives; residual and
 * non-answer categories ("other", "unspecified", "no answer") are dropped, and
 * anything that reads as a sentence rather than a name is dropped, never
 * rewritten. Palestine has no single Factbook entry — West Bank and Gaza Strip
 * are listed separately with different figures — so it is left unfilled.
 *
 * Existing values in countriesData.ts are never replaced: a field is filled only
 * where it is empty, or where it was filled by an earlier run of this script.
 *
 *   node build-country-reference.cjs            writes the module
 *   node build-country-reference.cjs --review   also prints every entry
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryReference.ts");
const CACHE = path.join(os.tmpdir(), "country-reference-cache");
const REVIEW = process.argv.includes("--review");
// Identifies this script honestly; no source here needs anything else.
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });

async function cached(name, url, opts = {}) {
  const file = path.join(CACHE, name);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const text = await r.text();
  fs.writeFileSync(file, text);
  return text;
}

/* ── The dataset, as the app sees it ─────────────────────────────────────── */
function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}
// A field is a gap if it is empty, or if this script filled it last time.
const isGap = (c, field) => !(c[field] && c[field].length) || !!(c.sources && c.sources[field]);

/* ── CIA World Factbook ──────────────────────────────────────────────────── */
const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/&/g, "and").replace(/^the /, "").replace(/[^a-z0-9]+/g, " ").trim();
const ENT = { "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&apos;": "'", "&#39;": "'" };
const decode = (s) => (s || "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z])(acute|grave|circ|uml|tilde|cedil|ring|slash);/gi, (_, l, m) =>
    (l + ({ acute: "́", grave: "̀", circ: "̂", uml: "̈", tilde: "̃", cedil: "̧", ring: "̊", slash: "̸" })[m.toLowerCase()]).normalize("NFC"))
  .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENT[m] ?? " ")
  .replace(/\s+/g, " ").trim();

// Read off the Factbook files, never assumed.
const FACTBOOK_ALIAS = { MM: "bm", CD: "cg", CV: "cv", FM: "fm", TR: "tu" };

async function loadFactbook() {
  const tree = JSON.parse(await cached("factbook-tree.json", "https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1", { headers: { "User-Agent": UA } }));
  const files = tree.tree.map((x) => x.path).filter((p) => /^[a-z-]+\/[a-z0-9]{2}\.json$/.test(p) && !/^(oceans|world|antarctica)\//.test(p));
  const out = [];
  let i = 0;
  const worker = async () => {
    while (i < files.length) {
      const p = files[i++];
      const j = JSON.parse(await cached("fb-" + p.replace("/", "_"), "https://raw.githubusercontent.com/factbook/factbook.json/master/" + p));
      const n = (j.Government || {})["Country name"] || {};
      const ps = j["People and Society"] || {};
      out.push({
        gec: p.split("/")[1].replace(".json", ""),
        short: decode(n["conventional short form"] && n["conventional short form"].text),
        long: decode(n["conventional long form"] && n["conventional long form"].text),
        religions: decode(ps.Religions && ps.Religions.text),
        languages: decode(ps.Languages && (ps.Languages.Languages ? ps.Languages.Languages.text : ps.Languages.text)),
      });
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  const byGec = new Map(out.map((f) => [f.gec, f]));
  const byName = new Map();
  for (const f of out) for (const k of [f.short, f.long]) if (k && !/^none$/i.test(k)) byName.set(norm(k), f);
  return (c) => (FACTBOOK_ALIAS[c.code] ? byGec.get(FACTBOOK_ALIAS[c.code]) : byName.get(norm(c.name)));
}

// Split on commas and semicolons that are not inside parentheses.
function topLevel(text) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}
const outsideParens = (s) => { let d = 0, o = ""; for (const ch of s) { if (ch === "(") d++; else if (ch === ")") d = Math.max(0, d - 1); else if (!d) o += ch; } return o; };
const yearOf = (t) => { const m = t.match(/\b((?:19|20)\d\d)(?:-\d\d)?\s*(?:est\.?|census)/i); return m ? m[1] : null; };

const NON_ANSWER = /^(other|others|unknown|none of the above|mixed)\b|unspecified|refused|don't know|do not know|no response|no answer|not stated|not applicable|undeclared/i;
const NONE_RELIGION = /^(none|no religion|nonreligious|non-religious|non-believers?|nonbelievers?|atheists?|agnostics?|atheist or agnostic|agnostic or atheist|agnostic\/atheist|nonbeliever\/agnostic|non-believer\/agnostic|none or atheist)$/i;
const NOT_A_LANGUAGE = /not used|two languages|more than one language|multilingual|mother tongue|^none$/i;
const SENTENCE = /\b(dialects|spoken|widely|minorities|languages exist)\b/i;
const DESCRIPTOR = /^(creole|pidgin|patois|dialect|sign|based)\b/i;

function parseList(text, kind) {
  if (!text) return { items: [], year: null, dropped: [] };
  const year = yearOf(text);
  const body = text
    .replace(/\bnote\b\s*[:\-][\s\S]*$/i, "")
    .replace(/(\d)\/(\d)\s*%/g, "$1.$2%") // DR Congo's "Christian 93/1%": its breakdown sums to 93.1
    .replace(/(\d\s*%\)?)\s+(?=[A-Z])/g, "$1, ") // a share run into the next name: missing comma
    .replace(/\)\s+(?=[A-Za-z][^,()]*?\d+(?:\.\d+)?\s*%)/g, "), ");
  const items = [];
  const dropped = [];
  const seen = new Set();
  const parts = topLevel(body);
  for (let idx = 0; idx < parts.length; idx++) {
    const raw = parts[idx];
    const top = outsideParens(raw);
    const key = top.replace(/[\d.%<\s]+/g, " ").trim().toLowerCase();
    if (key && seen.has(key)) break; // a second survey begins: keep the first only
    seen.add(key);
    const pm = top.match(/(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\s*%/);
    let share = pm ? parseFloat(pm[1]) : null;
    let name = top
      .replace(/^(?:less than|more than)\b[^:]*:\s*/i, "")
      .replace(/^.*?\beach\s*:\s*/i, "")
      .replace(/\b(?:more than|less than|about|approximately|over|nearly|roughly|almost)\s+(?=\d)/gi, "")
      .replace(/\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*%/g, "")
      .replace(/\b(?:19|20)\d\d\b\s*(?:est\.?|census)?/gi, "");
    const bare = name.match(/\s(\d+(?:\.\d+)?)\s*$/); // "Christian 89.5": a share without its % sign
    if (bare) { if (share === null) share = parseFloat(bare[1]); name = name.slice(0, bare.index); }
    name = name
      .replace(/\b(?:more than|less than)\s*$/i, "")
      .replace(/^(?:traditionally|some|very small numbers of|small|mostly|predominantly|and|including|ethnic languages include)\s+/i, "")
      .replace(/\s+/g, " ").replace(/^[\s,.;:\/\-]+|[\s,.;:\/\-]+$/g, "").trim();
    if (!name) continue;
    const names = kind === "language" ? name.split(/\s+and\s+/i) : [name];
    for (let n of names) {
      // "Sami- and Finnish-speaking minorities" names two languages, Sami and Finnish.
      n = n.replace(/\bonly\b/gi, "").replace(/-speaking(?:\s+minorit(?:y|ies))?$/i, "").replace(/-$/, "").replace(/\s+/g, " ").trim();
      if (!n) continue;
      if (/^\d/.test(n) || NON_ANSWER.test(n)) { dropped.push(raw); continue; }
      if (kind === "language" && NOT_A_LANGUAGE.test(n)) { dropped.push(raw); continue; }
      if (kind === "religion" && NONE_RELIGION.test(n)) n = "No Religion";
      if (kind === "religion" && /^believers?$/i.test(n)) n = "Unaffiliated believer";
      if (n.split(" ").length > 6 || (kind === "language" && SENTENCE.test(n))) { dropped.push(raw); continue; }
      // "French Lingala": a language already listed, run into the next name.
      if (kind === "language") for (const it of items) {
        const rest = n.slice(it.name.length + 1);
        if (n.toLowerCase().startsWith(it.name.toLowerCase() + " ") && rest && !DESCRIPTOR.test(rest)) n = rest;
      }
      n = n.charAt(0).toUpperCase() + n.slice(1);
      const dup = items.find((o) => o.name.toLowerCase() === n.toLowerCase());
      if (dup) { if ((share ?? 0) > (dup.share ?? 0)) dup.share = share; continue; }
      items.push({ name: n, share, idx });
    }
  }
  // "Samoan/English" next to Samoan and English is a bilingual count, not a language.
  const kept = items.filter((o) => !(o.name.includes("/") && o.name.split("/").every((p) => items.some((q) => q !== o && q.name.toLowerCase() === p.trim().toLowerCase()))));
  kept.sort((a, b) => (b.share ?? -1) - (a.share ?? -1) || a.idx - b.idx);
  return { items: kept.slice(0, kind === "religion" ? 5 : 6).map((o) => o.name), year, dropped };
}

/* ── UNESCO World Heritage List ──────────────────────────────────────────── */
// UNESCO's open-data export (dataset whc001, CC BY-SA 4.0), which is published
// for programmatic use. The whc.unesco.org XML feed refuses scripted clients,
// so it is not used.
const WHC_EXPORT = "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/exports/json";
async function loadHeritage() {
  const records = JSON.parse(await cached("whc001.json", WHC_EXPORT, { headers: { "User-Agent": UA } }));
  const byIso = new Map();
  for (const r of records) {
    // iso_codes is a string ("FR" or "DE,PL") or, for a few records, a list.
    const iso = (Array.isArray(r.iso_codes) ? r.iso_codes : String(r.iso_codes || "").split(","))
      .map((x) => String(x).trim().toUpperCase())
      .filter(Boolean);
    const name = decode(r.name_en);
    if (!name || !iso.length) continue; // one record carries no state code; it is not assigned to one
    const site = { name, year: parseInt(r.date_inscribed, 10), shared: iso.length > 1 };
    for (const c of iso) { if (!byIso.has(c)) byIso.set(c, []); byIso.get(c).push(site); }
  }
  // A fixed, checkable order — single-country sites first, then by inscription
  // year, then name — rather than a judgement about which sites matter most.
  for (const list of byIso.values()) list.sort((a, b) => a.shared - b.shared || a.year - b.year || a.name.localeCompare(b.name));
  return byIso;
}

/* ── Build ───────────────────────────────────────────────────────────────── */
(async () => {
  const countries = loadCountries();
  const factbookFor = await loadFactbook();
  const heritage = await loadHeritage();
  const entries = {};
  const review = [];
  const counts = { religions: 0, spokenLanguages: 0, landmarks: 0 };

  for (const c of countries) {
    const e = {};
    const f = factbookFor(c);
    if (f && isGap(c, "religions")) {
      const r = parseList(f.religions, "religion");
      if (r.items.length) { e.religions = r.items; if (r.year) e.religionsYear = r.year; counts.religions++; }
      if (REVIEW) review.push(`${c.code} ${c.name}\n   R(${r.year}): ${r.items.join(" | ") || "-"}`);
    }
    if (f && isGap(c, "spokenLanguages")) {
      const l = parseList(f.languages, "language");
      if (l.items.length) { e.spokenLanguages = l.items; if (l.year) e.languagesYear = l.year; counts.spokenLanguages++; }
      if (REVIEW) review.push(`   L(${l.year}): ${l.items.join(" | ") || "-"}`);
    }
    const sites = heritage.get(c.code);
    if (sites && sites.length && isGap(c, "landmarks")) {
      e.heritageSites = sites.slice(0, 5).map((s) => s.name);
      e.heritageSiteCount = sites.length;
      counts.landmarks++;
      if (REVIEW) review.push(`   W(${sites.length}): ${e.heritageSites.join(" | ")}`);
    }
    if (Object.keys(e).length) entries[c.code] = e;
  }

  const today = new Date().toISOString().slice(0, 10);
  const body = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, e]) => `  ${code}: ${JSON.stringify(e)},`)
    .join("\n");
  fs.writeFileSync(OUT, `/**
 * Sourced reference data for countries whose entry in countriesData.ts has none.
 *
 * GENERATED by build-country-reference.cjs on ${today} — do not edit by hand;
 * change the script and re-run it. Religions and spoken languages are from the
 * CIA World Factbook (public domain), in its own words, ordered by the share it
 * gives, with the survey year where it states one. World Heritage sites are from
 * the UNESCO World Heritage List: single-country sites first, then by year of
 * inscription, at most five, with the full count.
 *
 * countriesData.ts applies these only to empty fields and records the source on
 * each field it fills, so an existing value is never replaced.
 */
export const REFERENCE_RETRIEVED = "${today}";

export interface CountryReference {
  religions?: string[];
  religionsYear?: string;
  spokenLanguages?: string[];
  languagesYear?: string;
  heritageSites?: string[];
  heritageSiteCount?: number;
}

export const COUNTRY_REFERENCE: Record<string, CountryReference> = {
${body}
};
`);
  if (REVIEW) console.log(review.join("\n"));
  console.log(`\nwrote ${path.relative(__dirname, OUT)}: ${Object.keys(entries).length} countries; religions ${counts.religions}, languages ${counts.spokenLanguages}, World Heritage ${counts.landmarks}`);
})().catch((e) => { console.error(e); process.exit(1); });
