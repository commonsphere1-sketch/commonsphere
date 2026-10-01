/**
 * Builds src/data/projections.ts — the published projections behind the
 * Trends & Projections page.
 *
 * What this replaces. The dashboard's Trends & Projections panel, and an
 * unrouted page behind its "Full Analysis" link, were written by hand: sector
 * "outlooks" with a "confidence" beside them, risk scenarios with a
 * probability each, country GDP for 2028. None named a source, and no body
 * publishes such figures. The page is built instead on projections that are
 * published, each by the body that makes it:
 *
 *   IMF World Economic       GDP in current US dollars, real GDP growth,
 *     Outlook (DataMapper)   inflation, government debt and unemployment, for
 *                            the world, the advanced and the emerging and
 *                            developing economies, and every country it
 *                            covers - its estimates for past years and its
 *                            projections to five years out. The edition
 *                            (April or October, and the year) is read from
 *                            the API, and the first projected year follows
 *                            from it.
 *   UN World Population      the medium variant for the world and its six
 *     Prospects              regions to 2100 - population, median age,
 *                            fertility and life expectancy - and the world's
 *                            population under the low and high variants: the
 *                            UN's own scenarios, half a child fewer or more
 *                            per woman than the medium.
 *
 * Nothing is computed here beyond rounding and picking years. A figure the
 * publisher does not give for a place is absent, not filled in.
 *
 *   node build-projections.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/projections.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-projections");
fs.mkdirSync(CACHE, { recursive: true });
const THIS_YEAR = new Date().getFullYear();

const IMF = "https://www.imf.org/external/datamapper/api/v1/";
/** The WEO series kept, by the name the page uses. */
const WEO = { gdp: "NGDPD", growth: "NGDP_RPCH", inflation: "PCPIPCH", debt: "GGXWDG_NGDP", unemployment: "LUR" };
const GROUPS = { world: "WEOWORLD", advanced: "ADVEC", emerging: "OEMDC" };
/** Years kept: far enough back to see the projection against its past. */
const WEO_FROM = 2010;
const COUNTRY_FROM = 2019;

const WPP_FIRST = 2024;
const wppFile = (rev, which) => `https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP${rev}_Demographic_Indicators_${which}.csv.gz`;
/** The world and the UN's six regions, by its location code. */
const REGIONS = { 900: "World", 903: "Africa", 935: "Asia", 908: "Europe", 904: "Latin America and the Caribbean", 905: "Northern America", 909: "Oceania" };

function fetchTo(url, at, headers = []) {
  if (fs.existsSync(at)) return true;
  try {
    execFileSync("curl", ["-sSfL", "-m", "900", "-A", UA, ...headers.flatMap((h) => ["-H", h]), "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
    return true;
  } catch {
    fs.rmSync(at, { force: true });
    return false;
  }
}
const json = (url, name) => {
  const at = path.join(CACHE, name);
  if (!fetchTo(url, at)) throw new Error(`${url}: could not be fetched`);
  return JSON.parse(fs.readFileSync(at, "utf8"));
};
const round = (v, dp) => Number(Number(v).toFixed(dp));

/** RFC 4180 line: quoted fields, embedded commas, doubled quotes. */
function splitCsvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** The rows of a gzipped CSV that `keep` wants, read as a stream so a file of hundreds of megabytes never sits in memory. */
function gzRows(file, keep) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let header = null;
    const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
    rl.on("line", (line) => {
      if (!header) { header = splitCsvLine(line.replace(/^﻿/, "")); return; }
      if (!keep(line)) return;
      rows.push(splitCsvLine(line));
    });
    rl.on("close", () => resolve({ header, rows }));
    rl.on("error", reject);
  });
}

(async () => {
  // ── IMF World Economic Outlook ─────────────────────────────────────────
  const meta = json(IMF + "indicators", "imf-indicators.json").indicators;
  const editions = new Set(Object.values(WEO).map((c) => meta[c]?.source));
  if (editions.size !== 1) throw new Error(`IMF: the series are from different editions: ${[...editions].join("; ")}`);
  const edition = ([...editions][0].match(/\(([A-Za-z]+ \d{4})\)/) || [])[1];
  if (!edition) throw new Error(`IMF: no edition in "${[...editions][0]}"`);
  // An edition's projections begin with the year it is published in.
  const firstProjected = Number(edition.slice(-4));
  if (Math.abs(firstProjected - THIS_YEAR) > 1) throw new Error(`IMF: the edition is ${edition} - is the API stale?`);

  const values = {};
  for (const [k, code] of Object.entries(WEO)) values[k] = json(IMF + code, `imf-${code}.json`).values[code];
  const series = (k, area, from) =>
    Object.entries(values[k][area] || {})
      .map(([y, v]) => [Number(y), v])
      .filter(([y, v]) => y >= from && Number.isFinite(v))
      .sort((a, b) => a[0] - b[0])
      .map(([y, v]) => [y, round(v, k === "gdp" ? (v >= 100 ? 0 : 2) : 1)]);

  const groups = {};
  for (const [name, code] of Object.entries(GROUPS)) {
    groups[name] = {};
    for (const k of ["gdp", "growth", "inflation", "debt"]) {
      const s = series(k, code, WEO_FROM);
      if (s.length) groups[name][k] = s;
    }
    if (!groups[name].growth) throw new Error(`IMF: no growth for ${code}`);
  }
  const lastYear = groups.world.gdp[groups.world.gdp.length - 1][0];
  if (lastYear < firstProjected + 3) throw new Error(`IMF: projections end in ${lastYear}`);

  // Countries: the IMF's own list (not its groups), with the site's two-letter code for the flag.
  const imfCountries = json(IMF + "countries", "imf-countries.json").countries;
  const wb = json("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json")[1];
  const iso2 = Object.fromEntries(wb.map((c) => [c.id, c.iso2Code]));
  const countries = [];
  for (const [iso3, c] of Object.entries(imfCountries)) {
    const gdp = series("gdp", iso3, COUNTRY_FROM);
    if (!gdp.length || !c.label) continue;
    const e = { iso3, code: iso2[iso3] ?? null, name: c.label, gdp };
    for (const k of ["growth", "inflation", "debt", "unemployment"]) {
      const s = series(k, iso3, COUNTRY_FROM);
      if (s.length) e[k] = s;
    }
    countries.push(e);
  }
  countries.sort((a, b) => a.name.localeCompare(b.name));
  if (countries.length < 150) throw new Error(`IMF: only ${countries.length} countries`);
  const us = countries.find((c) => c.iso3 === "USA");
  const usNow = us?.gdp.find(([y]) => y === firstProjected)?.[1];
  if (!usNow || usNow < 20000 || usNow > 60000) throw new Error(`IMF: US GDP ${usNow} - wrong series?`);

  // ── UN World Population Prospects ──────────────────────────────────────
  let revision = 0;
  for (let rev = THIS_YEAR; rev >= WPP_FIRST && !revision; rev--) {
    if (fetchTo(wppFile(rev, "Medium"), path.join(CACHE, `WPP${rev}_Medium.csv.gz`))) revision = rev;
  }
  if (!revision) throw new Error("WPP: no revision's file could be read");
  const medium = await gzRows(path.join(CACHE, `WPP${revision}_Medium.csv.gz`), (l) => /^\d+,(900|903|935|908|904|905|909),/.test(l));
  const col = (h, k) => {
    const i = h.indexOf(k);
    if (i < 0) throw new Error(`WPP: no column ${k}`);
    return i;
  };
  const H = medium.header;
  const c = { loc: col(H, "LocID"), variant: col(H, "Variant"), year: col(H, "Time"), pop: col(H, "TPopulation1July"), age: col(H, "MedianAgePop"), tfr: col(H, "TFR"), lex: col(H, "LEx") };
  const people = (v) => Math.round(Number(v) * 1000);
  const regions = {};
  for (const r of medium.rows) {
    if (r[c.variant] !== "Medium") continue;
    const y = Number(r[c.year]);
    const e = (regions[r[c.loc]] ||= { population: [], medianAge: [], fertility: [], lifeExpectancy: [] });
    // The world year by year from 1950; its regions and the slower measures every five years.
    const world = r[c.loc] === "900";
    if (y >= 1950 && (world || y % 5 === 0 || y === THIS_YEAR)) e.population.push([y, people(r[c.pop])]);
    if (y >= 1950 && (y % 5 === 0 || y === THIS_YEAR)) {
      e.medianAge.push([y, round(r[c.age], 1)]);
      e.fertility.push([y, round(r[c.tfr], 2)]);
      e.lifeExpectancy.push([y, round(r[c.lex], 1)]);
    }
  }
  for (const id of Object.keys(REGIONS)) {
    const e = regions[id];
    if (!e || !e.population.some(([y]) => y === 2100)) throw new Error(`WPP: ${REGIONS[id]} does not run to 2100`);
    for (const k of Object.keys(e)) e[k].sort((a, b) => a[0] - b[0]);
  }
  // The UN's estimates end the year before the revision; the rest is projection.
  const popFirstProjected = revision;

  // The low and high variants, for the world: the UN's scenarios either side of the medium.
  const variantsAt = path.join(CACHE, `WPP${revision}_variants-world.json`);
  if (!fs.existsSync(variantsAt)) {
    const big = path.join(CACHE, `WPP${revision}_OtherVariants.csv.gz`);
    if (!fetchTo(wppFile(revision, "OtherVariants"), big)) throw new Error("WPP: the other variants' file could not be fetched");
    const other = await gzRows(big, (l) => /^\d+,900,/.test(l));
    const oc = { variant: col(other.header, "Variant"), year: col(other.header, "Time"), pop: col(other.header, "TPopulation1July") };
    const out = {};
    for (const r of other.rows) (out[r[oc.variant]] ||= []).push([Number(r[oc.year]), people(r[oc.pop])]);
    fs.writeFileSync(variantsAt, JSON.stringify(out));
    fs.rmSync(big, { force: true }); // 75 MB, and only the world's rows are wanted again
  }
  const allVariants = JSON.parse(fs.readFileSync(variantsAt, "utf8"));
  const variant = (name) => {
    const s = (allVariants[name] || []).filter(([y]) => y >= popFirstProjected && y <= 2100).sort((a, b) => a[0] - b[0]);
    if (!s.some(([y]) => y === 2100)) throw new Error(`WPP: no "${name}" variant to 2100 (have ${Object.keys(allVariants).join(", ")})`);
    return s;
  };
  const variants = { low: variant("Low"), high: variant("High") };
  const at2100 = (s) => s.find(([y]) => y === 2100)[1];
  const med2100 = at2100(regions[900].population);
  if (!(at2100(variants.low) < med2100 && med2100 < at2100(variants.high))) throw new Error("WPP: the medium variant is not between the low and the high in 2100");

  const today = new Date().toISOString().slice(0, 10);
  const J = JSON.stringify;
  fs.writeFileSync(
    OUT,
    `/**
 * Published projections, for the Trends & Projections page: the IMF's World
 * Economic Outlook and the UN's World Population Prospects.
 *
 * GENERATED by build-projections.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Every figure is the publisher's own. In each series the years before
 * \`firstProjected\` are its estimates of what happened and the years from it
 * on are its projections.
 */
export type Point = [year: number, value: number];

export const PROJECTION_SOURCES = {
  weo: {
    label: "IMF — World Economic Outlook (${edition})",
    url: "https://www.imf.org/external/datamapper/datasets/WEO",
    edition: "${edition}",
    /** The first year that is a projection: the year the edition was published. */
    firstProjected: ${firstProjected},
    lastYear: ${lastYear},
  },
  wpp: {
    label: "UN — World Population Prospects ${revision}",
    url: "https://population.un.org/wpp/",
    revision: ${revision},
    firstProjected: ${popFirstProjected},
  },
} as const;
export const PROJECTIONS_RETRIEVED = "${today}";

/** One economy's or group's outlook. GDP is in billions of current US dollars; the rest are percentages. */
export interface Outlook {
  gdp?: Point[];
  /** Real GDP growth, % a year. */
  growth?: Point[];
  /** Consumer price inflation, annual average, %. */
  inflation?: Point[];
  /** General government gross debt, % of GDP. */
  debt?: Point[];
  /** Unemployment, % of the labour force. Published for countries only, and not for all. */
  unemployment?: Point[];
}

/** The world, and the IMF's two halves of it. */
export const WEO_GROUPS: Record<"world" | "advanced" | "emerging", Outlook> = {
  world: ${J(groups.world)},
  advanced: ${J(groups.advanced)},
  emerging: ${J(groups.emerging)},
};

export interface CountryOutlook extends Outlook {
  iso3: string;
  /** ISO 3166-1 alpha-2, for the flag; null where the IMF's economy has none. */
  code: string | null;
  name: string;
  gdp: Point[];
}

/** Every economy the IMF covers, by name. */
export const WEO_COUNTRIES: CountryOutlook[] = [
${countries.map((e) => `  ${J(e)},`).join("\n")}
];

export interface PopulationOutlook {
  name: string;
  /** People on 1 July. The world year by year; a region every five years and this year. */
  population: Point[];
  medianAge: Point[];
  /** Births per woman. */
  fertility: Point[];
  /** Life expectancy at birth, years. */
  lifeExpectancy: Point[];
}

/** The UN's medium variant: the world first, then its six regions. */
export const POPULATION_OUTLOOK: PopulationOutlook[] = [
${Object.entries(REGIONS).map(([id, name]) => `  ${J({ name, ...regions[id] })},`).join("\n")}
];

/**
 * The world's population under the UN's low and high variants: fertility half
 * a child lower or higher per woman than in the medium variant.
 */
export const POPULATION_VARIANTS: { low: Point[]; high: Point[] } = {
  low: ${J(variants.low)},
  high: ${J(variants.high)},
};
`,
  );
  const w = groups.world;
  const at = (s, y) => s.find(([yy]) => yy === y)?.[1];
  console.log(`wrote ${path.relative(__dirname, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
  console.log(`  IMF WEO ${edition}: projections ${firstProjected}-${lastYear}; ${countries.length} economies`);
  console.log(`  world GDP ${at(w.gdp, firstProjected)}bn in ${firstProjected} -> ${at(w.gdp, lastYear)}bn in ${lastYear}; growth ${at(w.growth, firstProjected)}%; inflation ${at(w.inflation, firstProjected)}%; debt ${at(w.debt, firstProjected)}%`);
  const wp = regions[900].population;
  const peak = wp.reduce((a, b) => (b[1] > a[1] ? b : a));
  console.log(`  UN WPP ${revision}: world ${at(wp, THIS_YEAR)} in ${THIS_YEAR}, peak ${peak[1]} in ${peak[0]}, ${med2100} in 2100 (low ${at2100(variants.low)}, high ${at2100(variants.high)})`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
