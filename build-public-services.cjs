#!/usr/bin/env node
/**
 * build-public-services.cjs
 *
 * What each country's people are given free or covered for, where a body
 * publishes it: free schooling, public health insurance, what health care
 * costs out of pocket - and universal basic income, which no country has.
 * Written to src/data/publicServices.ts, for the badges on a country's card
 * and the section in its window.
 *
 * SOURCES
 *   UNESCO Institute for Statistics (api.uis.unesco.org), SDG indicator 4.1.7
 *     YEARS.FC.FREE.1T3  years of free primary and secondary education
 *                        guaranteed in legal frameworks
 *     YEARS.FC.COMP.1T3  years of it that are compulsory
 *     YEARS.FC.FREE.02   years of free pre-primary education guaranteed
 *     This is what the law guarantees, not what families pay in practice.
 *   OECD Health Statistics (sdmx.oecd.org), healthcare coverage
 *     The share of the population covered by government or compulsory health
 *     insurance, for the OECD's members and the partners it reports. Outside
 *     those countries nothing comparable is published openly, so nothing is
 *     shown: the absence of a figure is not a finding that cover is absent.
 *   World Bank, World Development Indicators (from the WHO's Global Health
 *   Expenditure Database), SH.XPD.OOPC.CH.ZS
 *     Out-of-pocket spending as a share of all health spending: what care
 *     costs people at the point of use, for nearly every country.
 *   World Bank, Exploring Universal Basic Income (Gentilini, Grosh, Rigolini
 *   and Yemtsov, 2020)
 *     "Currently, no country has a UBI in place ... Only two countries -
 *     Mongolia and the Islamic Republic of Iran - had a national UBI in
 *     place for a short period of time." Recorded from the publication's
 *     page, which each run fetches; the run stops if the page no longer says
 *     so. No country is given a UBI badge, because the source finds none.
 *
 * Nothing is worked out or estimated. A country a source does not cover has
 * no entry for it.
 *
 * Usage:  node build-public-services.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/publicServices.ts");
const UA = "Mozilla/5.0 (compatible; commonsphere-data-build/1.0; +https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-public-services");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const THIS_YEAR = new Date().getFullYear();

function get(url, name, headers = []) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    let failure = "";
    for (let attempt = 1; attempt <= 3 && !fs.existsSync(at); attempt++) {
      try {
        execFileSync("curl", ["-sSfL", "-m", "180", "-A", UA, ...headers.flatMap((h) => ["-H", h]), "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        fs.rmSync(at, { force: true });
        failure = String(e.stderr || e.message).trim().split("\n")[0];
        execSync(process.platform === "win32" ? "ping -n 16 127.0.0.1 > NUL" : "sleep 15");
      }
    }
    if (!fs.existsSync(at)) throw new Error(`${url}: ${failure}`);
  }
  return fs.readFileSync(at, "utf8");
}

const WB_LIST = JSON.parse(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
/** Economies, as against aggregates: ISO3 → ISO2. */
const ISO2 = new Map(WB_LIST.filter((c) => c.region?.id && c.region.id !== "NA").map((c) => [c.id, c.iso2Code]));

const SOURCES = {
  school: { label: "UNESCO Institute for Statistics — years of free education guaranteed in law (SDG 4.1.7)", url: "https://databrowser.uis.unesco.org/" },
  health: { label: "OECD Health Statistics — healthcare coverage", url: "https://www.oecd.org/en/data/datasets/oecd-health-statistics.html" },
  pocket: { label: "World Bank — out-of-pocket health spending (WHO Global Health Expenditure Database)", url: "https://data.worldbank.org/indicator/SH.XPD.OOPC.CH.ZS" },
  ubi: { label: "World Bank — Exploring Universal Basic Income (2020)", url: "https://www.worldbank.org/en/topic/socialprotection/publication/exploring-universal-basic-income-a-guide-to-navigating-concepts-evidence-and-practices" },
};

function main() {
  const out = {};
  const entry = (iso3) => {
    const iso2 = ISO2.get(iso3);
    return iso2 ? (out[iso2] ||= {}) : null;
  };

  // ── Free schooling (UNESCO) ──
  const uis = JSON.parse(get(`https://api.uis.unesco.org/api/public/data/indicators?indicator=YEARS.FC.FREE.1T3&indicator=YEARS.FC.COMP.1T3&indicator=YEARS.FC.FREE.02&start=${THIS_YEAR - 6}&end=${THIS_YEAR}`, `uis-free-${TODAY}.json`));
  if (!Array.isArray(uis.records) || uis.records.length < 500) throw new Error("UNESCO: too few records");
  const latest = {};
  for (const r of uis.records) {
    if (r.value === null || !Number.isFinite(r.value)) continue;
    const k = `${r.indicatorId}|${r.geoUnit}`;
    if (!latest[k] || r.year > latest[k].year) latest[k] = r;
  }
  const uisAt = (id, iso3) => latest[`${id}|${iso3}`];
  let schools = 0;
  for (const iso3 of ISO2.keys()) {
    const free = uisAt("YEARS.FC.FREE.1T3", iso3);
    if (!free) continue;
    const e = entry(iso3);
    const comp = uisAt("YEARS.FC.COMP.1T3", iso3);
    const pre = uisAt("YEARS.FC.FREE.02", iso3);
    e.freeSchool = { years: free.value, year: free.year, ...(comp ? { compulsory: comp.value } : {}), ...(pre ? { prePrimary: pre.value } : {}) };
    schools++;
  }
  if (schools < 150) throw new Error(`UNESCO: only ${schools} countries`);

  // ── Public health insurance (OECD) ──
  const csv = get(
    `https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HEALTH_PROT@DF_HEALTH_PROT,1.1/all?startPeriod=${THIS_YEAR - 8}&dimensionAtObservation=AllDimensions`,
    `oecd-health-cover-${TODAY}.csv`,
    ["Accept: application/vnd.sdmx.data+csv; charset=utf-8"],
  ).trim().split(/\r?\n/);
  const head = csv[0].split(",");
  const at = (n) => {
    const i = head.indexOf(n);
    if (i < 0) throw new Error(`OECD: no column ${n} among ${head.join()}`);
    return i;
  };
  const [cArea, cUnit, cType, cTime, cValue] = ["REF_AREA", "UNIT_MEASURE", "INSURANCE_TYPE", "TIME_PERIOD", "OBS_VALUE"].map(at);
  const cover = {};
  for (const line of csv.slice(1)) {
    const c = line.split(",");
    // Government or compulsory health insurance, as a share of the population.
    if (c[cType] !== "COVGCMED" || c[cUnit] !== "PT_POP" || c[cValue] === "") continue;
    const y = Number(c[cTime]);
    const v = Number(c[cValue]);
    if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error(`OECD: ${c[cArea]} ${y} is ${c[cValue]}`);
    if (!cover[c[cArea]] || y > cover[c[cArea]][0]) cover[c[cArea]] = [y, v];
  }
  let covered = 0;
  for (const [iso3, [year, pct]] of Object.entries(cover)) {
    const e = entry(iso3);
    if (!e) continue;
    e.healthCover = { pct: Number(pct.toFixed(1)), year };
    covered++;
  }
  if (covered < 30) throw new Error(`OECD: only ${covered} countries`);

  // ── Out-of-pocket health spending (World Bank, from the WHO) ──
  const wb = JSON.parse(get(`https://api.worldbank.org/v2/country/all/indicator/SH.XPD.OOPC.CH.ZS?format=json&per_page=20000&date=${THIS_YEAR - 10}:${THIS_YEAR}`, `wb-oop-${TODAY}.json`));
  if (!Array.isArray(wb) || !wb[1] || wb[0].pages > 1) throw new Error("World Bank: out-of-pocket spending did not come back whole");
  let pockets = 0;
  const seen = {};
  for (const r of wb[1]) {
    if (r.value === null || !ISO2.has(r.countryiso3code)) continue;
    const y = Number(r.date);
    if (!seen[r.countryiso3code] || y > seen[r.countryiso3code][0]) seen[r.countryiso3code] = [y, r.value];
  }
  for (const [iso3, [year, pct]] of Object.entries(seen)) {
    entry(iso3).outOfPocket = { pct: Number(pct.toFixed(1)), year };
    pockets++;
  }
  if (pockets < 150) throw new Error(`World Bank: only ${pockets} countries`);

  // ── Universal basic income: what the World Bank's study says, checked against its page ──
  const page = get(SOURCES.ubi.url, `wb-ubi-page-${TODAY}.html`).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  for (const says of ["no country has a UBI in place", "Mongolia and the Islamic Republic of Iran", "had a national UBI in place for a short period of time"]) {
    if (!page.includes(says)) throw new Error(`The World Bank's page no longer says "${says}" - read it again and update what is recorded`);
  }

  const full = Object.values(out).filter((e) => e.healthCover && e.healthCover.pct >= 99).length;
  fs.writeFileSync(
    OUT,
    `/**
 * What each country's people are given free or covered for, where a body
 * publishes it: free schooling (UNESCO), public health insurance (OECD) and
 * what health care costs out of pocket (World Bank, from the WHO).
 *
 * GENERATED by build-public-services.cjs on ${TODAY} — do not edit by hand; change
 * the script and re-run it. The script lists every source.
 *
 * Keyed by ISO 3166-1 alpha-2 code. A country a source does not cover has no
 * entry for it, which is not a finding that it lacks the service.
 */
export const PUBLIC_SERVICES_RETRIEVED = "${TODAY}";

export interface PublicServices {
  /** Years of free primary and secondary education guaranteed in law; how many are compulsory; years of free pre-primary. */
  freeSchool?: { years: number; year: number; compulsory?: number; prePrimary?: number };
  /** Share of the population covered by government or compulsory health insurance, %. */
  healthCover?: { pct: number; year: number };
  /** Out-of-pocket spending as a share of all health spending, %. */
  outOfPocket?: { pct: number; year: number };
}

export const PUBLIC_SERVICE_SOURCES = ${JSON.stringify(SOURCES, null, 2)} as const;

/**
 * Universal basic income, as the World Bank's study of it finds: no country
 * has one in place, and two had one nationally for a short time. Recorded
 * from the study's page and checked against it on each build.
 */
export const UNIVERSAL_BASIC_INCOME = {
  says: "No country has a universal basic income in place.",
  /** The two countries that had a national one for a short period. */
  had: ["MN", "IR"],
  checked: "${TODAY}",
} as const;

export const PUBLIC_SERVICES: Record<string, PublicServices> = {
${Object.keys(out)
  .sort()
  .map((k) => `  ${k}: ${JSON.stringify(out[k])},`)
  .join("\n")}
};
`,
  );
  console.log(`Free schooling: ${schools} countries; public health insurance: ${covered} (${full} at 99% or more); out-of-pocket: ${pockets}.`);
  for (const k of ["US", "DE", "GB", "CN", "IN", "FI", "MX", "BR"]) console.log(`  ${k} ${JSON.stringify(out[k])}`);
  console.log(`Wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} countries.`);
}

main();
