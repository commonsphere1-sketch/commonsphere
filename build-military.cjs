/**
 * Builds src/data/militarySpending.ts — each country's military spending from
 * SIPRI, and its armed forces personnel from the World Bank, each figure with
 * the year it is for.
 *
 * What this replaces. militaryData.ts gave every country a defence budget, an
 * active and a reserve headcount, an "inventory" and a count of national and
 * overseas bases, all hand-written with no year and no source per figure. The
 * page cited SIPRI and Global Firepower for them. Checked against SIPRI's own
 * release, the budgets were a year or more stale (the United States at 916,
 * which is SIPRI's 2023 figure, against 954 for 2025; Germany at 90 against
 * 114). No public body publishes the inventory or base counts at all - Global
 * Firepower is a commercial ranking that does not publish its method - so
 * there is nothing to refresh them from, and they are dropped rather than kept
 * looking authoritative.
 *
 * SPENDING. SIPRI Military Expenditure Database, 1949–2025 release (April
 * 2026), sheets "Current US$", "Share of GDP" and "Share of Govt. spending".
 * SIPRI colours its own estimates blue and highly uncertain figures red; those
 * colours are read from the file and travel with the value, because an
 * estimate for China and a reported figure for Germany are not the same kind
 * of number and the page should not present them as though they were. ". ."
 * (unavailable) and "xxx" (did not exist) are absent, never zero.
 *
 * A figure more than ten years old is left out. SIPRI's latest number for a
 * few countries is from 1999 or 2008 - it keeps the row because the country
 * stopped reporting - and a quarter-century-old budget beside everyone else's
 * 2025 one reads as current however clearly it is dated.
 *
 * PERSONNEL. World Bank MS.MIL.TOTL.P1, which is the IISS Military Balance
 * series of active armed forces including paramilitary forces where they are
 * trained and equipped like the military. The World Bank has not extended it
 * past 2020, and the IISS's own current figures are not openly published, so
 * the year is shown with it rather than presented as today's number.
 *
 *   node build-military.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/militarySpending.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-military");
fs.mkdirSync(CACHE, { recursive: true });

const SIPRI_URL = "https://www.sipri.org/sites/default/files/SIPRI-Milex-data-1949-2025_v1.2.xlsx";
const SIPRI_PAGE = "https://www.sipri.org/databases/milex";

/** SIPRI's name → the site's, where they differ. */
const SIPRI_ALIAS = {
  "United States of America": "United States",
  "Trinidad and Tobago": "Trinidad & Tobago",
  Czechia: "Czech Republic",
  "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "Korea, South": "South Korea",
  "Korea, North": "North Korea",
  "Viet Nam": "Vietnam",
  "Kyrgyz Republic": "Kyrgyzstan",
  "Timor Leste": "Timor-Leste",
  "Congo, DR": "DR Congo",
  "Congo, Republic": "Republic of the Congo",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Gambia, The": "Gambia",
};

/** Sheets, by position in the workbook (checked against their titles below). */
const SHEETS = {
  usd: { file: "xl/worksheets/sheet6.xml", title: /in millions of US\$ at current prices/ },
  gdp: { file: "xl/worksheets/sheet7.xml", title: /percentage of gross domestic product/i },
  gov: { file: "xl/worksheets/sheet9.xml", title: /percentage of government spending/i },
};

/** SIPRI's font colours: blue is a SIPRI estimate, red is highly uncertain. */
const flagFor = (color) =>
  color === "indexed:12" ? "estimate" : color === "indexed:10" || color === "rgb:FFFF0000" ? "uncertain" : null;

async function download(url, to) {
  if (fs.existsSync(to)) return;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  fs.writeFileSync(to, Buffer.from(await res.arrayBuffer()));
}

/** Oldest year still worth showing; see the note at the top. */
const OLDEST = new Date().getFullYear() - 10;

/** name → { v, year, flag } for the latest year with a number. */
function latestBySheet(file, spec) {
  const { rows, colors } = readXlsx(file, spec.file);
  const title = rows.slice(0, 3).map((r) => r[0] || "").join(" ");
  if (!spec.title.test(title)) throw new Error(`${spec.file} is not the sheet expected: "${title.slice(0, 90)}"`);
  const head = rows.findIndex((r) => r[0] === "Country");
  if (head < 0) throw new Error(`${spec.file}: no header row`);
  const years = rows[head];
  const out = {};
  for (let i = head + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    for (let c = r.length - 1; c >= 2; c--) {
      if (!/^\d{4}$/.test(years[c] || "")) continue;
      const v = Number(r[c]);
      if (r[c] === undefined || r[c] === "" || !Number.isFinite(v)) continue;
      if (+years[c] >= OLDEST) out[SIPRI_ALIAS[r[0]] || r[0]] = { v, year: years[c], flag: flagFor(colors[i][c]) };
      break;
    }
  }
  return out;
}

async function worldBank(code) {
  const at = path.join(CACHE, code + ".json");
  if (fs.existsSync(at)) return JSON.parse(fs.readFileSync(at, "utf8"));
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=10&per_page=25000`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const json = await res.json();
  const out = {};
  for (const row of json[1] || []) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    const id = row.country.id;
    if (+row.date < OLDEST) continue;
    if (!out[id] || +row.date > +out[id].year) out[id] = { v: row.value, year: String(row.date) };
  }
  fs.writeFileSync(at, JSON.stringify(out));
  return out;
}

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(
    `npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

const lit = (x) => (x ? `{ v: ${x.v}, y: "${x.year}"${x.flag ? `, flag: "${x.flag}"` : ""} }` : "null");

(async () => {
  const xlsx = path.join(CACHE, path.basename(SIPRI_URL));
  await download(SIPRI_URL, xlsx);
  const usd = latestBySheet(xlsx, SHEETS.usd);
  const gdp = latestBySheet(xlsx, SHEETS.gdp);
  const gov = latestBySheet(xlsx, SHEETS.gov);
  const pers = await worldBank("MS.MIL.TOTL.P1");

  const countries = loadCountries();
  const rows = [];
  const years = {};
  const flags = { estimate: 0, uncertain: 0 };
  const missing = [];
  for (const c of [...countries].sort((a, b) => a.id.localeCompare(b.id))) {
    const s = usd[c.name];
    const spend = s ? { v: Math.round(s.v * 10) / 10, year: s.year, flag: s.flag } : null;
    const share = gdp[c.name] ? { ...gdp[c.name], v: Math.round(gdp[c.name].v * 1000) / 10 } : null;
    const ofGov = gov[c.name] ? { ...gov[c.name], v: Math.round(gov[c.name].v * 1000) / 10 } : null;
    const p = pers[c.code] ? { v: Math.round(pers[c.code].v), year: pers[c.code].year } : null;
    if (!spend && !share && !p) { missing.push(c.name); continue; }
    if (spend) {
      years[spend.year] = (years[spend.year] || 0) + 1;
      if (spend.flag) flags[spend.flag]++;
    }
    rows.push(`  ${JSON.stringify(c.id)}: { spendUSDm: ${lit(spend)}, shareOfGDP: ${lit(share)}, shareOfGovt: ${lit(ofGov)}, personnel: ${lit(p)} },`);
  }

  // SIPRI publishes share of GDP as a fraction; check the scaling on one
  // country before trusting it for all of them.
  const us = gdp["United States"];
  if (!us || us.v < 0.02 || us.v > 0.06) throw new Error(`share-of-GDP scaling looks wrong: US = ${us && us.v}`);

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Military spending and armed forces personnel per country, each with the
 * year it is for.
 *
 * GENERATED by build-military.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * Spending, share of GDP and share of government spending: SIPRI Military
 * Expenditure Database, 1949–2025 release. Spending is in millions of US$ at
 * current prices and exchange rates. \`flag: "estimate"\` marks a figure SIPRI
 * itself estimated (shown in blue in its file); \`flag: "uncertain"\` one it
 * marks highly uncertain (red). Where SIPRI has no figure there is none here.
 *
 * Personnel: World Bank MS.MIL.TOTL.P1 (from the IISS Military Balance) —
 * active armed forces, including paramilitary forces trained and equipped like
 * the military. The World Bank has not extended the series past 2020.
 */
export const MILITARY_SOURCES = {
  sipri: { label: "SIPRI Military Expenditure Database (2025 release)", url: "${SIPRI_PAGE}" },
  personnel: { label: "World Bank / IISS — armed forces personnel", url: "https://data.worldbank.org/indicator/MS.MIL.TOTL.P1" },
  retrieved: "${today}",
};

export type MilitaryFigure = { v: number; y: string; flag?: "estimate" | "uncertain" };

export interface MilitaryMeasured {
  /** Military spending, US$ millions, current prices */
  spendUSDm: MilitaryFigure | null;
  /** Military spending as % of GDP */
  shareOfGDP: MilitaryFigure | null;
  /** Military spending as % of general government spending */
  shareOfGovt: MilitaryFigure | null;
  /** Armed forces personnel, including paramilitary */
  personnel: MilitaryFigure | null;
}

export const MILITARY_MEASURED: Record<string, MilitaryMeasured> = {
${rows.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} countries`);
  console.log("  spending year: " + Object.entries(years).map(([y, n]) => `${y}=${n}`).join("  "));
  console.log(`  SIPRI estimates: ${flags.estimate}, highly uncertain: ${flags.uncertain}`);
  console.log(`  no figure from either source: ${missing.join(", ")}`);
})().catch((e) => { console.error(e); process.exit(1); });
