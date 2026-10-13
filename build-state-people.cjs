/**
 * Builds src/data/statePeople.ts — for each state of the United States, the
 * languages its people speak at home and how its households' income is
 * shared: what a state's window, and the window of a place in it, gives of
 * the state's own beside the country's.
 *
 * From the US Census Bureau's American Community Survey, 1-year (public
 * domain), three tables read from its summary file:
 *
 *   C16001   The language spoken at home by people aged 5 and over: English
 *            only, Spanish, and eleven other languages or groups of them.
 *            Each is given as a share of those people, worked out here from
 *            the table's counts; the build stops unless they add to its
 *            total.
 *   B19082   The share of all household income that goes to each fifth of
 *            households, lowest to highest, and to the top 5 per cent.
 *   B19083   The Gini index of household income inequality, 0 to 1.
 *
 * Nothing else is worked out. Religion is not here: the Census Bureau does
 * not ask it, and no survey of it by state is published under terms the
 * site can use.
 *
 *   node build-state-people.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/statePeople.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-state-people");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = 2024;
const BASE = `https://www2.census.gov/programs-surveys/acs/summary_file/${YEAR}/table-based-SF`;
/** The table's columns, each a language or a group of them as the Bureau names it. */
const LANGUAGES = [
  ["English only", "E002"],
  ["Spanish", "E003"],
  ["French, Haitian or Cajun", "E006"],
  ["German or other West Germanic", "E009"],
  ["Russian, Polish or other Slavic", "E012"],
  ["Other Indo-European", "E015"],
  ["Korean", "E018"],
  ["Chinese", "E021"],
  ["Vietnamese", "E024"],
  ["Tagalog", "E027"],
  ["Other Asian and Pacific Island", "E030"],
  ["Arabic", "E033"],
  ["Other and unspecified", "E036"],
];

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 7 * 24 * 3600e3) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}
async function table(id) {
  const lines = (await cached(`${id}.dat`, `${BASE}/data/1YRData/acsdt1y${YEAR}-${id}.dat`)).trim().split(/\r?\n/);
  const head = lines[0].split("|");
  const rows = new Map();
  for (const line of lines.slice(1)) {
    if (!line.startsWith("0400000US")) continue;
    const cells = line.split("|");
    rows.set(cells[0], Object.fromEntries(head.map((k, i) => [k, cells[i]])));
  }
  return rows;
}

(async () => {
  // Each state's postal abbreviation, by its geography's id: what the site's own id for a state is, in lower case.
  const geos = (await cached("geos.txt", `${BASE}/documentation/Geos${YEAR}1YR.txt`)).trim().split(/\r?\n/);
  const col = geos[0].split("|");
  const [iLevel, iPart, iAbbr, iGeo, iName] = ["SUMLEVEL", "COMPONENT", "STUSAB", "GEO_ID", "NAME"].map((h) => {
    const i = col.indexOf(h);
    if (i < 0) throw new Error(`the list of geographies has no column ${h}`);
    return i;
  });
  const states = new Map();
  for (const line of geos.slice(1)) {
    const c = line.split("|");
    if (c[iLevel] === "040" && c[iPart] === "00") states.set(c[iGeo], { id: c[iAbbr].toLowerCase(), name: c[iName] });
  }
  const [spoken, shares, gini] = await Promise.all([table("c16001"), table("b19082"), table("b19083")]);
  const num = (row, k, what) => {
    const v = Number(row?.[k]);
    if (!Number.isFinite(v) || v < 0) throw new Error(`${what}: ${k} is "${row?.[k]}"`);
    return v;
  };
  const out = {};
  for (const [geo, s] of states) {
    // The fifty states: the District of Columbia and Puerto Rico are not states of the site's list.
    if (s.id === "dc" || s.id === "pr") continue;
    const l = spoken.get(geo);
    const f = shares.get(geo);
    const g = gini.get(geo);
    if (!l || !f || !g) throw new Error(`${s.name} is not in all three tables`);
    const total = num(l, "C16001_E001", s.name);
    const counts = LANGUAGES.map(([name, k]) => [name, num(l, `C16001_${k}`, s.name)]);
    if (counts.reduce((a, [, n]) => a + n, 0) !== total) throw new Error(`${s.name}: the languages do not add up to the people asked`);
    const fifths = [1, 2, 3, 4, 5].map((i) => num(f, `B19082_E00${i}`, s.name));
    const sum = fifths.reduce((a, v) => a + v, 0);
    if (sum < 99.5 || sum > 100.5) throw new Error(`${s.name}: the fifths come to ${sum}`);
    out[s.id] = {
      languages: counts.map(([name, n]) => [name, Number(((100 * n) / total).toFixed(1))]),
      fifths,
      top5: num(f, "B19082_E006", s.name),
      gini: num(g, "B19083_E001", s.name),
    };
  }
  const ids = Object.keys(out).sort();
  if (ids.length !== 50) throw new Error(`${ids.length} states were read, not 50`);

  fs.writeFileSync(
    OUT,
    `/**
 * A state's people: the languages they speak at home, and how its
 * households' income is shared.
 *
 * GENERATED by build-state-people.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * From the US Census Bureau's American Community Survey ${YEAR}, 1-year (public
 * domain): languages as a share of people aged 5 and over, worked out here
 * from table C16001's counts; the share of household income that goes to
 * each fifth of households and to the top 5 per cent (B19082); and the Gini
 * index of household income, 0 to 1 (B19083). Religion is not asked by the
 * Bureau, and is not here.
 */
export const STATE_PEOPLE_YEAR = ${YEAR};
export const STATE_PEOPLE_RETRIEVED = "${TODAY}";
export const STATE_PEOPLE_SOURCES = {
  languages: { label: "US Census Bureau — American Community Survey ${YEAR}, 1-year: language spoken at home (C16001)", url: "https://data.census.gov/table/ACSDT1Y${YEAR}.C16001" },
  income: { label: "US Census Bureau — American Community Survey ${YEAR}, 1-year: shares of household income by fifth, and the Gini index (B19082, B19083)", url: "https://data.census.gov/table/ACSDT1Y${YEAR}.B19082" },
};

export type StatePeople = {
  /** Each language, or group of them, as a share of people aged 5 and over: in the table's own order. */
  languages: [name: string, pct: number][];
  /** The share of household income that goes to each fifth of households, lowest first. */
  fifths: number[];
  /** And to the top 5 per cent of them. */
  top5: number;
  /** The Gini index of household income: 0 every household alike, 1 one household with all of it. */
  gini: number;
};

/** By the site's id for a state: its postal abbreviation in lower case. */
export const STATE_PEOPLE: Record<string, StatePeople> = {
${ids.map((id) => `  ${id}: ${JSON.stringify(out[id])},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${ids.length} states`);
  console.log(`  California: ${out.ca.languages.slice(0, 3).map(([n, v]) => `${n} ${v}%`).join(", ")}; fifths ${out.ca.fifths.join(" ")}; top 5% ${out.ca.top5}; Gini ${out.ca.gini}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
