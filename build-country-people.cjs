/**
 * Builds src/data/countryPeople.ts — a country's people, for the People and
 * society panel every place's window carries: the languages they speak,
 * what they believe, the peoples they are, their ages and where they live;
 * how the country's income is shared out among them; and how many are poor.
 *
 *   CIA World Factbook, final     Languages, religions, ethnic groups, the
 *     edition, January 2026       age structure and where the population is
 *     (public domain), from the   concentrated - each as the Factbook writes
 *     factbook.json mirror        it, with the year it gives. A line of
 *                                 names and shares ("Muslim 87.4%, Protestant
 *                                 7.5%, ...") is read into its parts only
 *                                 where every item of it reads as a name and
 *                                 a share; otherwise it is kept as the
 *                                 Factbook's sentence. Shares that come to
 *                                 about a whole are marked as one - a ring
 *                                 can be drawn of them; shares that do not
 *                                 (people who gave two languages) are not.
 *   World Bank, World             The share of the country's income or
 *     Development Indicators      spending that goes to each fifth of its
 *     (CC BY 4.0), from its       people, poorest to richest, and to the
 *     Poverty and Inequality      richest and the poorest tenth - all of one
 *     Platform                    survey year, the latest that has the five
 *                                 fifths; the share of people living on less
 *                                 than the international poverty line of
 *                                 $3.00 a day (2021 PPP), and below the
 *                                 country's own poverty line.
 *
 * These are a country's figures. Nobody publishes them on one footing for
 * every state, district, town and city, so a place's window gives its
 * country's and says so. Nothing is worked out here but whether shares make
 * a whole; the panel that draws them says what else it works out.
 *
 *   node build-country-people.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryPeople.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
// The Factbook's files are shared with the builds that already read them.
const CACHE = path.join(os.tmpdir(), "commonsphere-geography");
const WB_CACHE = path.join(os.tmpdir(), "commonsphere-country-people");
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(WB_CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const THIS_YEAR = Number(TODAY.slice(0, 4));
const REPO = "https://raw.githubusercontent.com/factbook/factbook.json/master";
/** Where a country's file is not found by its internet code. */
const BY_PATH = { GB: "europe/uk", UM: "australia-oceania/um", GS: "south-america/sx", SJ: "europe/sv", XK: "europe/kv", EH: "africa/wi" };

async function cached(dir, name, url, days = 7) {
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
const MARKS = { acute: "\u0301", grave: "\u0300", circ: "\u0302", tilde: "\u0303", uml: "\u0308", cedil: "\u0327", ring: "\u030a", caron: "\u030c" };
const entities = (s) => s.replace(/&([A-Za-z])(acute|grave|circ|tilde|uml|cedil|ring|caron);/g, (_, letter, mark) => (letter + MARKS[mark]).normalize("NFC")).replace(/&szlig;/g, "ß").replace(/&oslash;/g, "ø").replace(/&Oslash;/g, "Ø").replace(/&aelig;/g, "æ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ndash;|&mdash;/g, "-").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const plain = (v) => entities(String((v && typeof v === "object" ? (v.text ?? "") : v) ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** A line split at its commas and semicolons, but not at those inside brackets. */
function items(line) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of line) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
/**
 * A line of names and shares, read: its parts where every item is a name and a share, the year it gives, and whether
 * the shares make about a whole. Where it does not read so, the Factbook's own sentence, kept short.
 */
function shares(field) {
  // A field may be the line alone, or the line beside a sample and a note: the line is what is read.
  const raw = field && typeof field === "object" && !("text" in field) ? plain(Object.values(field)[0]) : plain(field);
  if (!raw || /^(NA|none)$/i.test(raw)) return null;
  const note = field && typeof field === "object" && field.note ? plain(field.note).replace(/^note\s*\d*\s*:\s*/i, "") : "";
  const when = raw.match(/\((\d{4}(?:[-/]\d{2,4})?)(?:\s+(?:est\.?|census))?\)\s*$/);
  const line = when ? raw.slice(0, when.index).trim() : raw;
  const parts = [];
  let reads = true;
  for (const it of items(line)) {
    const m = it.replace(/^and\s+/i, "").match(/^(.*?[^\s<])\s*(<|less than )?\s*(?:about |approximately |nearly |over |more than )?(\d*\.?\d+)%(?:\s*\(.*\))?$/);
    if (!m || m[1].length > 80 || /\d%/.test(m[1]) || /[&<>]/.test(m[1])) {
      reads = false;
      break;
    }
    // "<0.1%" is under a tenth of one per cent: the figure is kept, and that it is a ceiling is kept with it.
    parts.push(m[2] ? [m[1].replace(/\s+/g, " "), Number(m[3]), 1] : [m[1].replace(/\s+/g, " "), Number(m[3])]);
  }
  const base = { ...(when ? { year: when[1] } : {}), ...(note && note.length <= 320 ? { note } : {}) };
  if (reads && parts.length >= 2) {
    const sum = parts.reduce((a, [, v]) => a + v, 0);
    return { parts, ...(sum >= 97 && sum <= 101.5 ? { whole: true } : {}), ...base };
  }
  // The sentence as written, to the end of a clause, where it is not a list of shares.
  const said = line.length <= 420 ? line : `${line.slice(0, 420).replace(/[,;][^,;]*$/, "")} …`;
  return { text: said, ...base };
}
function ages(field) {
  if (!field || typeof field !== "object") return null;
  const bands = [];
  let year;
  for (const [label, v] of Object.entries(field)) {
    const t = plain(v);
    const m = t.match(/^(\d+(?:\.\d+)?)%/);
    if (!m || !/years/.test(label)) continue;
    bands.push([label.replace(/ years/, "").replace(" and over", " and over"), Number(m[1])]);
    year ??= (t.match(/\((\d{4})\s+est\.?\)/) || [])[1];
  }
  const sum = bands.reduce((a, [, v]) => a + v, 0);
  return bands.length === 3 && sum >= 99 && sum <= 101 ? { bands, ...(year ? { year } : {}) } : null;
}

/* ── The World Bank's distribution and poverty figures ── */
async function series(indicator, iso2) {
  const rows = JSON.parse(await cached(WB_CACHE, `${indicator}.json`, `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=20000&date=2000:${THIS_YEAR}`, 2))[1] ?? [];
  const out = {};
  for (const r of rows) {
    const code = iso2.get(r.countryiso3code);
    if (code && r.value !== null) (out[code] ??= new Map()).set(Number(r.date), r.value);
  }
  return out;
}
const FIFTHS = ["SI.DST.FRST.20", "SI.DST.02ND.20", "SI.DST.03RD.20", "SI.DST.04TH.20", "SI.DST.05TH.20"];

(async () => {
  const bundle = path.join(WB_CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  const countries = require(bundle).countriesData;

  // The Factbook's file for each country, found by its internet code.
  const tree = JSON.parse(await cached(CACHE, "tree.json", "https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1", 30));
  const files = tree.tree.filter((x) => x.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(x.path)).map((x) => x.path.replace(/\.json$/, ""));
  const byTld = new Map();
  for (const f of files) {
    const j = JSON.parse(await cached(CACHE, `${f.replace("/", "__")}.json`, `${REPO}/${f}.json`, 30));
    const m = /\.([a-z]{2})\b/.exec(plain(j.Communications?.["Internet country code"]));
    if (!m) continue;
    const code = m[1].toUpperCase() === "UK" ? "GB" : m[1].toUpperCase();
    (byTld.get(code) || byTld.set(code, []).get(code)).push(f);
  }

  const wbCountries = JSON.parse(await cached(WB_CACHE, "wb-countries.json", "https://api.worldbank.org/v2/country?format=json&per_page=400", 30))[1];
  const iso2 = new Map(wbCountries.filter((c) => c.region && c.region.id !== "NA").map((c) => [c.id, c.iso2Code]));
  const fifths = [];
  for (const ind of FIFTHS) fifths.push(await series(ind, iso2));
  const top10 = await series("SI.DST.10TH.10", iso2);
  const bottom10 = await series("SI.DST.FRST.10", iso2);
  const poorWorld = await series("SI.POV.DDAY", iso2);
  const poorOwn = await series("SI.POV.NAHC", iso2);
  const round = (v) => Number(v.toFixed(1));
  const newest = (m) => (m ? [...m.entries()].sort((a, b) => b[0] - a[0])[0] : null);

  const out = {};
  const count = { languages: 0, religions: 0, ethnic: 0, ages: 0, income: 0, poor: 0, poorOwn: 0 };
  for (const c of countries) {
    const entry = {};
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    if (p) {
      const people = JSON.parse(await cached(CACHE, `${p.replace("/", "__")}.json`, `${REPO}/${p}.json`, 30))["People and Society"] ?? {};
      const put = (key, v) => {
        if (!v) return;
        entry[key] = v;
        count[key]++;
      };
      put("languages", shares(people.Languages));
      put("religions", shares(people.Religions));
      put("ethnic", shares(people["Ethnic groups"]));
      put("ages", ages(people["Age structure"]));
      const where = plain(people["Population distribution"]).replace(/,? as shown in this population distribution map/i, "");
      if (where && where.length <= 520) entry.where = where;
    }
    // The newest year in which the survey gives all five fifths: the tenths are taken of the same year.
    const years = [...(fifths[0][c.code]?.keys() ?? [])].filter((y) => fifths.every((f) => f[c.code]?.has(y))).sort((a, b) => b - a);
    if (years.length) {
      const y = years[0];
      const five = fifths.map((f) => round(f[c.code].get(y)));
      const sum = five.reduce((a, v) => a + v, 0);
      if (sum >= 99 && sum <= 101) {
        entry.income = { y, fifths: five, ...(top10[c.code]?.has(y) ? { top10: round(top10[c.code].get(y)) } : {}), ...(bottom10[c.code]?.has(y) ? { bottom10: round(bottom10[c.code].get(y)) } : {}) };
        count.income++;
      }
    }
    const pw = newest(poorWorld[c.code]);
    if (pw) {
      entry.poor = { y: pw[0], v: round(pw[1]) };
      count.poor++;
    }
    const po = newest(poorOwn[c.code]);
    if (po) {
      entry.poorOwn = { y: po[0], v: round(po[1]) };
      count.poorOwn++;
    }
    if (Object.keys(entry).length) out[c.code] = entry;
  }
  const codes = Object.keys(out).sort();
  if (count.religions < 180 || count.income < 120) throw new Error(`too few countries: ${JSON.stringify(count)}`);

  fs.writeFileSync(
    OUT,
    `/**
 * A country's people: the languages they speak, what they believe, the
 * peoples they are, their ages and where they live; how the country's income
 * is shared among them; and how many are poor.
 *
 * GENERATED by build-country-people.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * The first are the CIA World Factbook's, as its final edition (January
 * 2026) wrote them, each with the year it gives; the shares of income and
 * the poverty rates are the World Bank's, each with its survey year. They
 * are a country's figures: a place inside it is given them as its country's.
 */
export const COUNTRY_PEOPLE_RETRIEVED = "${TODAY}";
export const COUNTRY_PEOPLE_SOURCES = {
  factbook: { label: "CIA World Factbook, final edition (January 2026) — People and Society (public domain)", url: "https://github.com/factbook/factbook.json" },
  income: { label: "World Bank — Poverty and Inequality Platform: income shares by fifth and tenth of the population (CC BY 4.0)", url: "https://data.worldbank.org/indicator/SI.DST.05TH.20" },
  poverty: { label: "World Bank — Poverty and Inequality Platform: poverty headcount ratios (CC BY 4.0)", url: "https://data.worldbank.org/indicator/SI.POV.DDAY" },
};
/** The line the World Bank counts extreme poverty by, as its indicator states it. */
export const POVERTY_LINE = "$3.00 a day, 2021 PPP";

/**
 * A line of the Factbook's read into names and shares - \`whole\` where they come to about a hundred, so that a ring may
 * be drawn of them - or, where it does not read so, the Factbook's own sentence. \`year\` is the year it gives.
 */
export type Shares = { parts?: [name: string, pct: number, /** 1 where the Factbook gives the share as "less than" the figure. */ under?: 1][]; whole?: true; text?: string; year?: string; note?: string };
export type CountryPeople = {
  languages?: Shares;
  religions?: Shares;
  ethnic?: Shares;
  /** The share of its people in each of three ages. */
  ages?: { bands: [label: string, pct: number][]; year?: string };
  /** Where its people are concentrated, in the Factbook's words. */
  where?: string;
  /** The share of income or spending that goes to each fifth of its people, poorest first, and to the richest and poorest tenth: all of one survey year. */
  income?: { y: number; fifths: number[]; top10?: number; bottom10?: number };
  /** The share of its people living below the international line, and below the country's own. */
  poor?: { y: number; v: number };
  poorOwn?: { y: number; v: number };
};

/** By ISO code. */
export const COUNTRY_PEOPLE: Record<string, CountryPeople> = {
${codes.map((c) => `  ${c}: ${JSON.stringify(out[c])},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${codes.length} countries ${JSON.stringify(count)}`);
  const kinds = { parts: 0, whole: 0, text: 0 };
  for (const c of codes) for (const k of ["languages", "religions", "ethnic"]) if (out[c][k]) kinds[out[c][k].parts ? (out[c][k].whole ? "whole" : "parts") : "text"]++;
  console.log(`  lines read as shares that make a whole ${kinds.whole}, as shares that do not ${kinds.parts}, kept as the Factbook's sentence ${kinds.text}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
