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

(async () => {
  const bundle = path.join(OWN, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  const countries = require(bundle).countriesData;

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
  const count = { system: 0, constitution: 0, courts: 0, citizenship: 0, suffrage: 0, world: 0 };
  for (const old of fs.readdirSync(OUT_DIR)) if (/^[A-Z]{2}\.json$/.test(old)) fs.unlinkSync(path.join(OUT_DIR, old));
  for (const c of countries) {
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    if (!p) continue;
    const g = JSON.parse(await cached(CACHE, `${p.replace("/", "__")}.json`, `${REPO}/${p}.json`)).Government ?? {};
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
    if (!Object.keys(entry).length) continue;
    fs.writeFileSync(path.join(OUT_DIR, `${c.code}.json`), JSON.stringify(entry));
    held.push(c.code);
  }
  held.sort();
  if (count.system < 200 || count.constitution < 180) throw new Error(`too few countries: ${JSON.stringify(count)}`);

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
 * may vote, and whether it accepts the two world courts. Nothing is worked
 * out or reworded.
 */
export const COUNTRY_LAW_RETRIEVED = "${TODAY}";
export const COUNTRY_LAW_SOURCES = {
  factbook: { label: "CIA World Factbook, final edition (January 2026) — Government (public domain)", url: "https://github.com/factbook/factbook.json" },
  /** Where what the Factbook says of the two world courts can be checked. */
  icj: { label: "International Court of Justice — declarations recognizing the Court's jurisdiction as compulsory", url: "https://www.icj-cij.org/declarations" },
  icc: { label: "International Criminal Court — the states parties to the Rome Statute", url: "https://asp.icc-cpi.int/states-parties" },
};

/** A country's file. Every part is the Factbook's own words; a part it leaves empty is not there. */
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
};

/** The countries with a file, by ISO code. */
export const COUNTRY_LAW_HELD: ReadonlySet<string> = new Set(${JSON.stringify(held)});
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} and ${held.length} files in static/law`);
  console.log(`  ${JSON.stringify(count)}`);
  console.log(`  Ethiopia: ${fs.readFileSync(path.join(OUT_DIR, "ET.json"), "utf8").slice(0, 400)}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
