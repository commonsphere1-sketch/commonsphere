/**
 * Builds static/law/CC.json and src/data/countryLaw.ts — the law a place is
 * under: its country's legal system, its constitution and how it is amended,
 * its courts, who is a citizen, who may vote, and whether it accepts the two
 * world courts. What the Laws tab of a city's window gives, said to be its
 * country's.
 *
 * From the CIA World Factbook's final edition (January 2026, public domain),
 * the Government part of each country's entry, read from the factbook.json
 * mirror: "Legal system", "Constitution", "Judicial branch", "Citizenship",
 * "Suffrage" and "International law organization participation". Each is
 * kept as the Factbook wrote it. Nothing is worked out, shortened or
 * reworded; a field the Factbook leaves empty or marks NA is left out.
 *
 * And how it is governed, for the systems comparator: the Factbook's
 * "Government type", how its executive is chosen and its cabinet formed, its
 * legislature - its name, whether it is of one chamber or two, and for each
 * chamber its seats, electoral system, term and share of women - and the
 * count of its administrative divisions (the Factbook's line up to its list
 * of their names). Who holds an office is not kept: the Factbook's final
 * edition is of January 2026 and an office-holder may have changed since.
 *
 * And what is illegal and legal there, as a visitor is told it: the "Laws
 * and cultural differences" part of the UK Foreign, Commonwealth &
 * Development Office's travel advice for the country (Open Government
 * Licence v3.0), read from GOV.UK's content API - every heading of it and
 * every paragraph and list under each, in the Office's own words, with the
 * day the advice was last updated and its page. The page of each country is
 * the one the status report already names (src/data/countryStatus.ts). It
 * is advice written for British travellers and is not the whole of a
 * country's law; the tab says so. The build stops if any of the part's
 * words would be dropped in the reading.
 *
 * A country's file is fetched when the tab is opened, so the page does not
 * carry every country's law; src/data/countryLaw.ts lists which countries
 * have a file.
 *
 *   node build-country-law.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryLaw.ts");
const OUT_DIR = path.join(__dirname, "static/law");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
// The Factbook's files are shared with the builds that already read them.
const CACHE = path.join(os.tmpdir(), "commonsphere-geography");
const OWN = path.join(os.tmpdir(), "commonsphere-country-law");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OWN, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const REPO = "https://raw.githubusercontent.com/factbook/factbook.json/master";
/** Where a country's file is not found by its internet code. */
const BY_PATH = { GB: "europe/uk", UM: "australia-oceania/um", GS: "south-america/sx", SJ: "europe/sv", XK: "europe/kv", EH: "africa/wi" };

async function cached(dir, name, url, days = 30) {
  const at = path.join(dir, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < days * 24 * 3600e3) return fs.readFileSync(at, "utf8");
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.writeFileSync(at, text);
      return text;
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`${url}: ${last.message}`);
}
/** The mark an entity's name puts on its letter: "&iacute;" is i with an acute. */
const mark = (n) => String.fromCharCode(n);
const MARKS = { acute: mark(0x301), grave: mark(0x300), circ: mark(0x302), tilde: mark(0x303), uml: mark(0x308), cedil: mark(0x327), ring: mark(0x30a), caron: mark(0x30c) };
const entities = (s) =>
  s
    .replace(/&([A-Za-z])(acute|grave|circ|tilde|uml|cedil|ring|caron);/g, (_, letter, m) => (letter + MARKS[m]).normalize("NFC"))
    .replace(/&szlig;/g, "ß")
    .replace(/&oslash;/g, "ø")
    .replace(/&Oslash;/g, "Ø")
    .replace(/&aelig;/g, "æ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
/** A field's words, without its markup: null where it is empty, or says only that nothing is known. */
function said(v) {
  const text = entities(String((v && typeof v === "object" ? (v.text ?? "") : v) ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^note\s*\d*\s*[:-]\s*/i, "");
  if (!text || /^(NA|N\/A|none|not applicable)$/i.test(text)) return null;
  // An entity the table above does not know is a mistake waiting to be shown: the build stops on it.
  const left = text.match(/&[A-Za-z]+;|&#\d+;/);
  if (left) throw new Error(`an entity was not read: ${left[0]} in "${text.slice(0, 80)}"`);
  return text;
}
/** The named parts of a field, each under the key the file gives it. */
function parts(field, keys) {
  if (!field || typeof field !== "object") return null;
  const out = {};
  for (const [from, to] of Object.entries(keys)) {
    const v = said(field[from]);
    if (v) out[to] = v;
  }
  return Object.keys(out).length ? out : null;
}

/** A chamber of a legislature, or the whole of one that has a single chamber: the Factbook's own words for each thing it gives. */
function chamberOf(field, which) {
  const c = parts(field, { "chamber name": "name", "legislature name": "name", "number of seats": "seats", "electoral system": "system", "scope of elections": "scope", "term in office": "term", "percentage of women in chamber": "women" });
  // A chamber is kept where the Factbook says something of it beyond its name.
  return c && Object.keys(c).some((k) => k !== "name") ? { which, ...c } : null;
}
/** How a country is governed, read from the Government part of its entry. */
function governedOf(g) {
  const out = {};
  const type = said(g["Government type"]);
  if (type) out.type = type;
  const executive = parts(g["Executive branch"], { "election/appointment process": "chosen", cabinet: "cabinet" });
  if (executive) out.executive = executive;
  const whole = g["Legislative branch"];
  const legislature = parts(whole, { "legislature name": "name", "legislative structure": "structure" }) ?? {};
  const chambers = [chamberOf(g["Legislative branch - lower chamber"], "lower"), chamberOf(g["Legislative branch - upper chamber"], "upper")].filter(Boolean);
  // A legislature of one chamber has its seats and its elections on the legislature itself.
  const only = chambers.length ? null : chamberOf(whole, "only");
  if (only) chambers.push(only);
  if (chambers.length) legislature.chambers = chambers;
  if (Object.keys(legislature).length) out.legislature = legislature;
  // Its divisions: the line up to the list of their names.
  const raw = g["Administrative divisions"]?.text;
  if (typeof raw === "string") {
    // The marks that point to a note under the list of names go with the list; a space left where a word was set in italics is closed.
    const head = said(raw.split(/;|<br|<p>|<strong>/)[0])
      ?.replace(/\*/g, "")
      .replace(/\(\s+/g, "(")
      .replace(/\s+([),])/g, "$1")
      .trim();
    if (head && head.length <= 320) out.divisions = head;
  }
  return Object.keys(out).length ? out : null;
}

/* ── The UK Foreign Office's advice ── */
const NAMED = { amp: "&", nbsp: " ", quot: '"', apos: "'", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…", pound: "£", euro: "€", deg: "°", lt: "<", gt: ">", eacute: "é", egrave: "è", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", times: "×", frac12: "½" };
/** A piece of the advice's markup as plain words. An entity that is not known stops the build. */
function words(html) {
  return html
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([A-Za-z0-9]+);/g, (m, n) => {
      if (!(n in NAMED)) throw new Error(`an entity was not read: ${m}`);
      return NAMED[n];
    })
    .replace(/\s+/g, " ")
    .trim();
}
/**
 * The "Laws and cultural differences" part of a country's advice, read: a list of its headings, each with the
 * paragraphs, lists and smaller headings under it. Null where the advice has no such part.
 */
function lawsOf(advice, name) {
  const part = (advice.details?.parts ?? []).find((p) => /safety-and-security$/.test(p.slug));
  const body = part?.body ?? "";
  const open = /<h2[^>]*>\s*Laws and cultural differences\s*<\/h2>/i.exec(body);
  if (!open) return null;
  const rest = body.slice(open.index + open[0].length);
  const end = rest.search(/<h2[\s>]/);
  // Wrappers hold no words of their own: what is inside them is read as if they were not there.
  const html = (end < 0 ? rest : rest.slice(0, end)).replace(/<\/?(?:div|section|aside|blockquote|span)\b[^>]*>/g, "");
  const items = [];
  let cur = null;
  const into = () => cur ?? (items.push((cur = { h: "", b: [] })), cur);
  let left = html;
  for (const m of html.matchAll(/<(h3|h4|h5|p|ul|ol|table)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    left = left.replace(m[0], " ");
    const [, tag, inner] = m;
    if (tag === "h3") items.push((cur = { h: words(inner), b: [] }));
    else if (tag === "h4" || tag === "h5") words(inner) && into().b.push({ sub: words(inner) });
    else if (tag === "p") words(inner) && into().b.push(words(inner));
    else if (tag === "table") {
      const rows = [...inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => words(c[1])).filter(Boolean).join(" · ")).filter(Boolean);
      if (rows.length) into().b.push(rows);
    } else {
      if (/<(?:ul|ol)\b/.test(inner)) throw new Error(`${name}: a list inside a list is not read`);
      const list = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((x) => words(x[1])).filter(Boolean);
      if (list.length) into().b.push(list);
    }
  }
  // Nothing of the part may fall between the pieces that were read.
  const dropped = words(left);
  if (dropped) throw new Error(`${name}: words of the advice were not read: "${dropped.slice(0, 120)}"`);
  const kept = items.filter((it) => it.b.length);
  return kept.length ? kept : null;
}

(async () => {
  const bundle = path.join(OWN, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  const countries = require(bundle).countriesData;
  // The Foreign Office's page for each country: the one the status report names.
  const statusBundle = path.join(OWN, "countryStatus.cjs");
  execSync(`npx esbuild src/data/countryStatus.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${statusBundle}"`, { cwd: __dirname, stdio: "inherit" });
  const STATUS = require(statusBundle).COUNTRY_STATUS;

  // The Factbook's file for each country, found by its internet code.
  const tree = JSON.parse(await cached(CACHE, "tree.json", "https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1"));
  const files = tree.tree.filter((x) => x.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(x.path)).map((x) => x.path.replace(/\.json$/, ""));
  const byTld = new Map();
  for (const f of files) {
    const j = JSON.parse(await cached(CACHE, `${f.replace("/", "__")}.json`, `${REPO}/${f}.json`));
    const m = /\.([a-z]{2})\b/.exec(said(j.Communications?.["Internet country code"]) ?? "");
    if (!m) continue;
    const code = m[1].toUpperCase() === "UK" ? "GB" : m[1].toUpperCase();
    (byTld.get(code) || byTld.set(code, []).get(code)).push(f);
  }

  const held = [];
  const count = { system: 0, constitution: 0, courts: 0, citizenship: 0, suffrage: 0, world: 0, local: 0, gov: 0 };
  for (const old of fs.readdirSync(OUT_DIR)) if (/^[A-Z]{2}\.json$/.test(old)) fs.unlinkSync(path.join(OUT_DIR, old));
  for (const c of countries) {
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    const g = p ? (JSON.parse(await cached(CACHE, `${p.replace("/", "__")}.json`, `${REPO}/${p}.json`)).Government ?? {}) : {};
    const entry = {};
    const put = (key, v) => {
      if (!v) return;
      entry[key] = v;
      count[key]++;
    };
    put("system", said(g["Legal system"]));
    put("constitution", parts(g.Constitution, { history: "history", "amendment process": "amend", note: "note" }));
    put("courts", parts(g["Judicial branch"], { "highest court(s)": "highest", "judge selection and term of office": "judges", "subordinate courts": "lower", note: "note" }));
    put("citizenship", parts(g.Citizenship, { "citizenship by birth": "birth", "citizenship by descent only": "descent", "dual citizenship recognized": "dual", "residency requirement for naturalization": "residency", note: "note" }));
    put("suffrage", said(g.Suffrage));
    put("world", said(g["International law organization participation"]));
    put("gov", governedOf(g));
    const uk = STATUS[c.code]?.uk;
    if (uk) {
      const slug = /\/foreign-travel-advice\/([a-z0-9-]+)$/.exec(uk.url)?.[1];
      if (!slug) throw new Error(`${c.name}: the Foreign Office's page is not a page of its travel advice: ${uk.url}`);
      const advice = JSON.parse(await cached(OWN, `uk-${slug}.json`, `https://www.gov.uk/api/content/foreign-travel-advice/${slug}`, 1));
      const items = lawsOf(advice, c.name);
      if (items) put("local", { name: uk.name, updated: new Date(advice.public_updated_at).toISOString().slice(0, 10), url: `https://www.gov.uk${advice.base_path}/safety-and-security`, items });
    }
    if (!Object.keys(entry).length) continue;
    fs.writeFileSync(path.join(OUT_DIR, `${c.code}.json`), JSON.stringify(entry));
    held.push(c.code);
  }
  held.sort();
  if (count.system < 200 || count.constitution < 180 || count.local < 150) throw new Error(`too few countries: ${JSON.stringify(count)}`);

  fs.writeFileSync(
    OUT,
    `/**
 * The law a place is under: which countries have a file of it
 * (static/law/CC.json), and where it is from.
 *
 * GENERATED by build-country-law.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each file is the Government part of the CIA World Factbook's entry for the
 * country, as its final edition (January 2026) wrote it: its legal system,
 * its constitution and how it is amended, its courts, who is a citizen, who
 * may vote, and whether it accepts the two world courts. With it, what is
 * illegal and legal there as the UK Foreign Office's travel advice tells a
 * visitor. Nothing is worked out or reworded.
 */
export const COUNTRY_LAW_RETRIEVED = "${TODAY}";
export const COUNTRY_LAW_SOURCES = {
  factbook: { label: "CIA World Factbook, final edition (January 2026) — Government (public domain)", url: "https://github.com/factbook/factbook.json" },
  advice: { label: "UK Foreign, Commonwealth & Development Office — Foreign travel advice: laws and cultural differences (contains public sector information licensed under the Open Government Licence v3.0)", url: "https://www.gov.uk/foreign-travel-advice" },
  /** A second government's account of the same, to check the first against. */
  state: { label: "US Department of State — country information: local laws and special circumstances", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages.html" },
  /** Where what the Factbook says of the two world courts can be checked. */
  icj: { label: "International Court of Justice — declarations recognizing the Court's jurisdiction as compulsory", url: "https://www.icj-cij.org/declarations" },
  icc: { label: "International Criminal Court — the states parties to the Rome Statute", url: "https://asp.icc-cpi.int/states-parties" },
};

/** A chamber of a legislature - or the whole of one with a single chamber - as the Factbook describes it. */
export type Chamber = { which: "lower" | "upper" | "only"; name?: string; seats?: string; system?: string; scope?: string; term?: string; women?: string };
/** How a country is governed, in the Factbook's words. */
export type CountryGoverned = {
  /** Its type of government. */
  type?: string;
  /** How its chief of state and head of government are chosen, and how its cabinet is formed. */
  executive?: { chosen?: string; cabinet?: string };
  legislature?: { name?: string; structure?: string; chambers?: Chamber[] };
  /** Its administrative divisions: how many, of what kinds. */
  divisions?: string;
};

/** A paragraph of the advice, a list in it, or a smaller heading. */
export type AdviceBlock = string | string[] | { sub: string };
/** The "Laws and cultural differences" part of the UK Foreign Office's advice for a country. */
export type CountryLawAdvice = {
  /** The country as the Office names it. */
  name: string;
  /** The day the advice was last updated. */
  updated: string;
  url: string;
  /** Its headings, each with what is under it; a heading of "" is what stands before the first. */
  items: { h: string; b: AdviceBlock[] }[];
};

/** A country's file. Every part is its source's own words; a part the source leaves empty is not there. */
export type CountryLawFile = {
  /** Its legal system. */
  system?: string;
  constitution?: { history?: string; amend?: string; note?: string };
  courts?: { highest?: string; judges?: string; lower?: string; note?: string };
  citizenship?: { birth?: string; descent?: string; dual?: string; residency?: string; note?: string };
  /** Who may vote. */
  suffrage?: string;
  /** Whether it accepts the International Court of Justice's jurisdiction and is party to the International Criminal Court. */
  world?: string;
  /** How it is governed: the Factbook's own words. Who holds an office is not kept. */
  gov?: CountryGoverned;
  /** What is illegal and legal there, as the UK Foreign Office's travel advice tells a visitor: its own words. */
  local?: CountryLawAdvice;
};

/** The countries with a file, by ISO code. */
export const COUNTRY_LAW_HELD: ReadonlySet<string> = new Set(${JSON.stringify(held)});
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} and ${held.length} files in static/law`);
  console.log(`  ${JSON.stringify(count)}`);
  console.log(`  Germany, how it is governed: ${JSON.stringify(JSON.parse(fs.readFileSync(path.join(OUT_DIR, "DE.json"), "utf8")).gov).slice(0, 900)}`);
  console.log(`  India, the advice: ${JSON.stringify(JSON.parse(fs.readFileSync(path.join(OUT_DIR, "IN.json"), "utf8")).local).slice(0, 500)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
