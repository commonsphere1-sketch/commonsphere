/**
 * Builds src/data/countryIndexes.ts - the composite indexes a country is
 * scored on, each as the body that makes it publishes it: behind the
 * "Indexes" panel of a place's window, where they are given as the
 * country's, since none of them is published for a town or a district.
 *
 *   node build-country-indexes.cjs
 *
 * Sources - each one's licence allows a site that sells memberships and
 * carries advertising to show its figures, with the credit given here:
 *
 *   United Nations Development Programme, Human Development Report 2025
 *   (CC BY 3.0 IGO)
 *     https://hdr.undp.org/data-center/documentation-and-downloads - the
 *     "composite indices, complete time series" file: the Human Development
 *     Index, the same adjusted for inequality and for planetary pressures,
 *     the Gender Development Index and the Gender Inequality Index, with the
 *     ranks UNDP gives for the first and the last.
 *
 *   World Bank (CC BY 4.0)
 *     Worldwide Governance Indicators - its six dimensions, each on the
 *     Bank's absolute 0-100 scale - from its Data360 service; and from its
 *     World Development Indicators the Human Capital Index, the Statistical
 *     Performance Indicators' overall score, the Logistics Performance
 *     Index, the Gini index and its Multidimensional Poverty Measure.
 *
 * Each figure is the last one published for the country, with its year. A
 * country a body does not score has no figure for that index: nothing is
 * carried over from a neighbour or filled in. The one thing worked out is a
 * country's place among those scored, where the body gives no rank of its
 * own: it is counted from the scores of the same year, and marked so.
 *
 * Indexes that are not here, and why: those whose makers do not license
 * them for commercial reuse (the IMD World Competitiveness Ranking, the
 * university rankings, the World Economic Forum's indexes, Harvard's
 * Economic Complexity Index, the Climate Change Performance Index), and
 * sites that only repeat other bodies' figures (IndexMundi and the like),
 * which are not sources.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryIndexes.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-country-indexes");
fs.mkdirSync(CACHE, { recursive: true });

function fetchText(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "240", "-A", UA, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${url}: could not be fetched`);
    }
  }
  return fs.readFileSync(at, "utf8");
}
const json = (url, name) => JSON.parse(fetchText(url, name));
const round = (v, dp) => Number(Number(v).toFixed(dp));

/* ── Which ISO3 code is which ISO2, and which World Bank "countries" are aggregates ── */
const wbCountries = json("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json")[1];
const iso2Of = {};
for (const c of wbCountries) if (c.region && c.region.id !== "NA" && /^[A-Z]{2}$/.test(c.iso2Code)) iso2Of[c.id] = c.iso2Code;
if (Object.keys(iso2Of).length < 200) throw new Error(`only ${Object.keys(iso2Of).length} World Bank economies were read`);

const out = {};
const of = (iso2) => (out[iso2] ||= {});
const made = {}; // id → { scored, years:Set }
const note = (id, y) => {
  made[id] ||= { scored: 0, years: new Set() };
  made[id].scored++;
  made[id].years.add(y);
};

/* ── UNDP: the last year of each index in the file, with its rank where UNDP gives one ── */
const HDR_URL = "https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv";
{
  const [head, ...lines] = fetchText(HDR_URL, "hdr.csv").trim().split(/\r?\n/);
  const cols = head.split(",");
  // No field is quoted except a name with a comma in it, which is the second.
  const split = (l) => {
    if (!l.includes('"')) return l.split(",");
    const m = /^([^,]*),"([^"]*)",(.*)$/.exec(l);
    if (!m) throw new Error(`UNDP: a row was not read (${l.slice(0, 60)})`);
    return [m[1], m[2], ...m[3].split(",")];
  };
  const lastYear = (key) => Math.max(...cols.flatMap((c) => (new RegExp(`^${key}_(\\d{4})$`).exec(c) ? [Number(RegExp.$1)] : [])));
  const kinds = [
    ["hdi", "hdi", "hdi_rank"],
    ["ihdi", "ihdi", null],
    ["phdi", "phdi", null],
    ["gdi", "gdi", null],
    ["gii", "gii", "gii_rank"],
  ];
  let countries = 0;
  for (const l of lines) {
    const f = split(l);
    if (f.length !== cols.length) throw new Error(`UNDP: a row has ${f.length} fields, not ${cols.length} (${f[0]})`);
    const iso2 = iso2Of[f[0]];
    if (!iso2) continue; // its groups of countries, and the few places the Bank does not list
    countries++;
    for (const [id, key, rankKey] of kinds) {
      const y = lastYear(key);
      const raw = f[cols.indexOf(`${key}_${y}`)];
      if (raw === "" || raw == null || !Number.isFinite(Number(raw))) continue;
      const v = round(raw, 3);
      if (v <= 0 || v > 1.5) throw new Error(`UNDP ${id} ${f[0]}: ${v} is not an index value`);
      const fig = { v, y };
      if (rankKey) {
        const r = Number(f[cols.indexOf(`${rankKey}_${y}`)]);
        if (Number.isInteger(r) && r > 0) fig.rank = r;
      }
      of(iso2)[id] = fig;
      note(id, y);
    }
  }
  if (countries < 180) throw new Error(`UNDP: only ${countries} countries were read`);
  // How many each rank is out of: UNDP ranks every country it scores for the year.
  for (const id of ["hdi", "gii"]) {
    const n = Object.values(out).filter((c) => c[id]?.rank).length;
    const top = Math.max(...Object.values(out).map((c) => c[id]?.rank ?? 0));
    for (const c of Object.values(out)) if (c[id]?.rank) c[id].of = Math.max(n, top);
  }
}

/* ── Worldwide Governance Indicators: the 0-100 score of each dimension, for the last year ── */
const place = (id, better) => {
  // A country's place among those scored for the same year, counted from the scores: ties share a place.
  const byYear = {};
  for (const c of Object.values(out)) if (c[id]) (byYear[c[id].y] ||= []).push(c[id].v);
  for (const c of Object.values(out)) {
    if (!c[id]) continue;
    const all = byYear[c[id].y];
    c[id].place = 1 + all.filter((v) => (better === "higher" ? v > c[id].v : v < c[id].v)).length;
    c[id].of = all.length;
  }
};
const WGI = [
  ["voice", "GOV_WGI_VA"],
  ["stability", "GOV_WGI_PV"],
  ["effectiveness", "GOV_WGI_GE"],
  ["regulation", "GOV_WGI_RQ"],
  ["ruleOfLaw", "GOV_WGI_RL"],
  ["corruption", "GOV_WGI_CC"],
];
let wgiYear = null;
for (const [id, indicator] of WGI) {
  const rows = [];
  for (let skip = 0; ; skip += 1000) {
    const page = json(`https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WGI&INDICATOR=${indicator}&COMP_BREAKDOWN_1=WGI_SC&skip=${skip}`, `wgi-${id}-${skip}.json`);
    for (const r of page.value) rows.push({ iso3: r.REF_AREA, year: +r.TIME_PERIOD, v: +r.OBS_VALUE });
    if (page.value.length < 1000) break;
  }
  if (rows.length < 3000) throw new Error(`${indicator}: only ${rows.length} rows`);
  const edition = Math.max(...rows.map((r) => r.year));
  if (wgiYear !== null && wgiYear !== edition) throw new Error("the governance indicators are for different years");
  wgiYear = edition;
  // A country's place is among every economy the Bank scores for the year - the few it scores that are not countries too -
  // counted from the scores as build-public-security.cjs counts it, so the two agree.
  const scored = rows.filter((r) => r.year === edition && Number.isFinite(r.v));
  const scores = scored.map((r) => r.v).sort((a, b) => b - a);
  for (const r of scored) {
    if (r.v < 0 || r.v > 100) throw new Error(`${indicator} ${r.iso3}: ${r.v} is off the 0-100 scale`);
    const iso2 = iso2Of[r.iso3];
    if (!iso2) continue;
    of(iso2)[id] = { v: round(r.v, 1), y: edition, place: scores.findIndex((s) => s <= r.v) + 1, of: scores.length };
    note(id, edition);
  }
  if (made[id].scored < 180) throw new Error(`${indicator}: ${made[id].scored} economies scored for ${edition}`);
}


/* ── World Development Indicators: the last value published for each country ── */
const WDI = [
  ["hci", "HD.HCI.OVRL", 3, [0, 1], "higher", 150],
  ["spi", "IQ.SPI.OVRL", 1, [0, 100], "higher", 150],
  ["lpi", "LP.LPI.OVRL.XQ", 2, [1, 5], "higher", 120],
  ["gini", "SI.POV.GINI", 1, [0, 100], "lower", 120],
  ["mpm", "SI.POV.MDIM", 1, [0, 100], "lower", 40],
];
for (const [id, code, dp, [lo, hi], better, least] of WDI) {
  const rows = json(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrnev=1&per_page=1000`, `${code}.json`)[1] || [];
  for (const r of rows) {
    const iso2 = iso2Of[r.countryiso3code];
    if (!iso2 || r.value == null) continue;
    const v = round(r.value, dp);
    if (v < lo || v > hi) throw new Error(`${code} ${r.countryiso3code}: ${v} is off its scale`);
    of(iso2)[id] = { v, y: Number(r.date) };
    note(id, Number(r.date));
  }
  if ((made[id]?.scored ?? 0) < least) throw new Error(`${code}: only ${made[id]?.scored ?? 0} countries have a value`);
  // A place among the others only where every country's figure is of one year: the Gini index and the poverty measure are of whatever year each country was last surveyed, and are not ranked.
  if (made[id].years.size === 1) place(id, better);
}

const today = new Date().toISOString().slice(0, 10);
const years = (id) => {
  const ys = [...made[id].years].sort((a, b) => a - b);
  return ys.length === 1 ? String(ys[0]) : `${ys[0]}–${ys[ys.length - 1]}`;
};
const undp = `{ label: "UNDP — Human Development Report 2025, composite indices (CC BY 3.0 IGO)", url: "https://hdr.undp.org/data-center/documentation-and-downloads" }`;
const wgi = `{ label: "World Bank — Worldwide Governance Indicators (CC BY 4.0)", url: "https://www.worldbank.org/en/publication/worldwide-governance-indicators" }`;
const wdi = (code) => `{ label: "World Bank — World Development Indicators, ${code} (CC BY 4.0)", url: "https://data.worldbank.org/indicator/${code}" }`;
const DEFS = [
  ["hdi", "Human Development Index", "Development", "UNDP", [0, 1], "higher", "0 to 1 · health, schooling and income together", undp],
  ["ihdi", "Inequality-adjusted Human Development Index", "Development", "UNDP", [0, 1], "higher", "0 to 1 · the same, marked down for how unevenly each is shared", undp],
  ["phdi", "Planetary pressures-adjusted Human Development Index", "Development", "UNDP", [0, 1], "higher", "0 to 1 · the same, marked down for carbon emitted and materials used", undp],
  ["hci", "Human Capital Index", "Development", "World Bank", [0, 1], "higher", "0 to 1 · how productive a child born today can expect to be, against full health and schooling", wdi("HD.HCI.OVRL")],
  ["gdi", "Gender Development Index", "Equality", "UNDP", null, null, "women's Human Development Index over men's · 1 is parity", undp],
  ["gii", "Gender Inequality Index", "Equality", "UNDP", [0, 1], "lower", "0 to 1 · lower is more equal", undp],
  ["gini", "Gini index of income or spending", "Equality", "World Bank", [0, 100], "lower", "0 to 100 · lower is more evenly shared", wdi("SI.POV.GINI")],
  ["mpm", "Multidimensional Poverty Measure", "Equality", "World Bank", [0, 100], "lower", "% of people poor in money, schooling or basic services", wdi("SI.POV.MDIM")],
  ["voice", "Voice and accountability", "Governance", "World Bank", [0, 100], "higher", "governance score, 0 to 100", wgi],
  ["stability", "Political stability and absence of violence", "Governance", "World Bank", [0, 100], "higher", "governance score, 0 to 100", wgi],
  ["effectiveness", "Government effectiveness", "Governance", "World Bank", [0, 100], "higher", "governance score, 0 to 100", wgi],
  ["regulation", "Regulatory quality", "Governance", "World Bank", [0, 100], "higher", "governance score, 0 to 100", wgi],
  ["ruleOfLaw", "Rule of law", "Governance", "World Bank", [0, 100], "higher", "governance score, 0 to 100", wgi],
  ["corruption", "Control of corruption", "Governance", "World Bank", [0, 100], "higher", "governance score, 0 to 100", wgi],
  ["lpi", "Logistics Performance Index", "Economy & data", "World Bank", [1, 5], "higher", "1 to 5 · how well goods move through customs, ports and roads", wdi("LP.LPI.OVRL.XQ")],
  ["spi", "Statistical Performance Indicators", "Economy & data", "World Bank", [0, 100], "higher", "overall score, 0 to 100 · how good the country's own statistics are", wdi("IQ.SPI.OVRL")],
];
for (const [id] of DEFS) if (!made[id]) throw new Error(`${id}: no country has a figure`);

const body = Object.keys(out)
  .sort()
  .map((cc) => {
    const c = out[cc];
    const fields = DEFS.filter(([id]) => c[id]).map(([id]) => {
      const f = c[id];
      return `${id}:{v:${f.v},y:${f.y}${f.rank ? `,rank:${f.rank}` : ""}${f.place ? `,place:${f.place}` : ""}${f.of ? `,of:${f.of}` : ""}}`;
    });
    return `  ${cc}: {${fields.join(",")}},`;
  })
  .join("\n");

fs.writeFileSync(
  OUT,
  `/**
 * The composite indexes a country is scored on, each as the body that makes
 * it publishes it: behind the "Indexes" panel of a place's window. None of
 * them is published for a town, a district or a city, so a place's window
 * gives its country's and says so.
 *
 * GENERATED by build-country-indexes.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each figure is the last one published for the country, with its year; a
 * country a body does not score has none for that index. \`rank\` is the
 * body's own rank; \`place\` is the country's place among those scored for
 * the same year, counted here from the scores, where the body gives no rank.
 */
export const COUNTRY_INDEXES_RETRIEVED = "${today}";

export type IndexId = ${DEFS.map(([id]) => `"${id}"`).join(" | ")};

export type IndexFigure = {
  v: number;
  y: number;
  /** The rank its maker gives it. */
  rank?: number;
  /** Its place among those scored for the same year, counted here from the scores. */
  place?: number;
  /** How many the rank or the place is out of. */
  of?: number;
};

export type IndexDef = {
  id: IndexId;
  name: string;
  group: string;
  by: string;
  /** The two ends of its scale, where it has ends. */
  scale: [number, number] | null;
  /** Which end is the better. */
  better: "higher" | "lower" | null;
  /** What the figure is, in a few words. */
  what: string;
  /** The years the countries' figures are of. */
  years: string;
  /** How many countries have a figure. */
  scored: number;
  source: { label: string; url: string };
};

export const INDEX_DEFS: IndexDef[] = [
${DEFS.map(([id, name, group, by, scale, better, what, source]) => `  { id: "${id}", name: ${JSON.stringify(name)}, group: ${JSON.stringify(group)}, by: ${JSON.stringify(by)}, scale: ${scale ? JSON.stringify(scale) : "null"}, better: ${better ? `"${better}"` : "null"}, what: ${JSON.stringify(what)}, years: "${years(id)}", scored: ${made[id].scored}, source: ${source} },`).join("\n")}
];

export const COUNTRY_INDEXES: Record<string, Partial<Record<IndexId, IndexFigure>>> = {
${body}
};
`,
);
console.log(`countries: ${Object.keys(out).length}`);
for (const [id] of DEFS) console.log(`  ${id}: ${made[id].scored} scored, ${years(id)}`);
