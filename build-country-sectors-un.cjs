/**
 * Builds src/data/countrySectorsUn.ts — the make-up of the economy for the
 * countries the World Bank publishes no sector split for, from the UN
 * Statistics Division's national accounts.
 *
 * The Countries modal draws "Economy by Sector" from the World Bank's value
 * added shares (countriesData.ts). For a dozen countries the World Bank has
 * none, and their chart was empty. The UN's "Percentage Distribution (Shares)
 * of GDP" table covers most of them. It is the same table build-economy-
 * sectors.cjs already uses for Venezuela on the Economies page, mapped to the
 * same three sectors the same way:
 *
 *   agriculture   ISIC A-B
 *   industry      ISIC C-E and F (mining, manufacturing, utilities, construction)
 *   services      ISIC G-H, I and J-P
 *   manufacturing ISIC D, shown as part of industry
 *
 * The UN's shares are of total value added, so they add up to 100 and include
 * no taxes-less-subsidies remainder; the page says so. The UN fills gaps in
 * countries' own reporting with its own estimates and does not flag which
 * figures those are, so the page says that too.
 *
 * All sectors for a country come from one year: the latest year every group
 * is reported. Nothing older than ten years is used.
 *
 *   node build-country-sectors-un.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/countrySectorsUn.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-country-sectors");
fs.mkdirSync(CACHE, { recursive: true });
const URL = "https://unstats.un.org/unsd/amaapi/api/file/22";
const OLDEST = new Date().getFullYear() - 10;

const AGRICULTURE = ["Agriculture, hunting, forestry, fishing (ISIC A-B)"];
const INDUSTRY = ["Mining, Manufacturing, Utilities (ISIC C-E)", "Construction (ISIC F)"];
const SERVICES = [
  "Wholesale, retail trade, restaurants and hotels (ISIC G-H)",
  "Transport, storage and communication (ISIC I)",
  "Other Activities (ISIC J-P)",
];
const MANUFACTURING = "Manufacturing (ISIC D)";

/** The UN's name where it differs from the site's. */
const UN_NAME = {
  "North Korea": "D.P.R. of Korea",
  Venezuela: "Venezuela (Bolivarian Republic of)",
};

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(
    `npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const at = path.join(CACHE, "un-shares.xlsx");
  if (!fs.existsSync(at)) {
    const res = await fetch(URL, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`UN shares: HTTP ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  const { rows } = readXlsx(at);
  const h = rows.findIndex((r) => (r[0] || "").trim() === "CountryID");
  if (h < 0) throw new Error("UN shares: header row not found");
  const years = rows[h].slice(3);
  const byCountry = new Map();
  for (const r of rows.slice(h + 1)) {
    const name = (r[1] || "").trim(), ind = (r[2] || "").trim();
    if (!name || !ind) continue;
    if (!byCountry.has(name)) byCountry.set(name, new Map());
    byCountry.get(name).set(ind, r.slice(3));
  }

  // Only the countries the World Bank split leaves empty.
  const countries = loadCountries().filter((c) => !(c.keyIndustries && c.keyIndustries.length));
  const out = [];
  const none = [];
  for (const c of countries.sort((a, b) => a.id.localeCompare(b.id))) {
    const table = byCountry.get(UN_NAME[c.name] ?? c.name);
    const needed = [...AGRICULTURE, ...INDUSTRY, ...SERVICES];
    if (!table || !needed.every((k) => table.has(k))) { none.push(c.name); continue; }
    let idx = -1;
    for (let i = years.length - 1; i >= 0; i--) {
      if (+years[i] < OLDEST) break;
      if (needed.every((k) => { const v = table.get(k)[i]; return v !== undefined && v !== "" && Number.isFinite(+v); })) { idx = i; break; }
    }
    if (idx < 0) { none.push(`${c.name} (nothing recent)`); continue; }
    const sum = (keys) => keys.reduce((n, k) => n + Number(table.get(k)[idx]), 0);
    const agriculture = sum(AGRICULTURE), industry = sum(INDUSTRY), services = sum(SERVICES);
    const total = agriculture + industry + services;
    if (Math.abs(total - 100) > 0.6) throw new Error(`${c.name}: UN shares sum to ${total.toFixed(2)}`);
    const m = table.get(MANUFACTURING)?.[idx];
    const manufacturing = m !== undefined && m !== "" && Number.isFinite(+m) ? +(+m).toFixed(1) : null;
    const r1 = (v) => Math.round(v * 10) / 10;
    out.push(`  ${JSON.stringify(c.id)}: { y: "${years[idx]}", agriculture: ${r1(agriculture)}, industry: ${r1(industry)}, services: ${r1(services)}, manufacturing: ${manufacturing} },`);
  }

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Economy by sector, as shares of total value added, for countries the World
 * Bank publishes no split for.
 *
 * GENERATED by build-country-sectors-un.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * UN Statistics Division, national accounts main aggregates, "Percentage
 * Distribution (Shares) of GDP". Shares of value added, so they sum to 100
 * with no taxes-less-subsidies remainder. The UN fills gaps in national
 * reporting with its own estimates without marking which.
 */
export const UN_SECTORS_SOURCE = {
  label: "UN Statistics Division — national accounts, shares of value added",
  url: "https://unstats.un.org/unsd/snaama/",
  retrieved: "${today}",
};

export interface UnSectors {
  y: string;
  agriculture: number;
  industry: number;
  services: number;
  /** Part of industry. */
  manufacturing: number | null;
}

export const UN_SECTORS: Record<string, UnSectors> = {
${out.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${out.length} countries`);
  console.log("  not covered by the UN table either: " + none.join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
