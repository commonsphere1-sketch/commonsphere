/**
 * Builds src/data/frontiers2.ts - more of the Developments page's figures:
 * the satellites working in orbit, what governments budget for research and
 * on what, and the scanners hospitals have.
 *
 *   Satellites  Jonathan McDowell's General Catalog of Artificial Space Objects
 *               (GCAT, CC BY 4.0): every payload whose operations GCAT gives as
 *               still under way, by the state that owns it, by its class
 *               (commercial, civil, military, amateur) and by what it does; and
 *               the payloads working at the end of each year, counted here from
 *               GCAT's launch and end-of-operations dates.
 *   Budgets     The OECD's Government budget allocations for R&D (GBARD), by
 *               socio-economic objective (NABS 2007), in US dollars converted at
 *               purchasing power parity, current prices (CC BY 4.0).
 *   Scanners    The OECD's Health Statistics, medical technology availability:
 *               MRI units, CT scanners, PET scanners, mammographs and radiation
 *               therapy equipment per million inhabitants, all providers
 *               (CC BY 4.0).
 *
 * Every figure is its publisher's; a count or a sum made here says so.
 *
 *   node build-frontiers2.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/frontiers2.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-frontiers2");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });

function get(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) execFileSync("curl", ["-sL", "--fail", "-A", UA, "-o", at, url], { stdio: "ignore", timeout: 600000 });
  return fs.readFileSync(at, "utf8");
}
const tsvRows = (text) => text.split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split("\t").map((c) => c.trim()));
function csvRows(text) {
  const lines = text.trim().split(/\r?\n/);
  const parse = (l) => {
    const c = [];
    let s = "";
    let q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) c.push(s), (s = "");
      else s += ch;
    }
    c.push(s);
    return c;
  };
  const head = parse(lines[0]);
  return lines.slice(1).map((l) => {
    const c = parse(l);
    return Object.fromEntries(head.map((h, i) => [h, c[i]]));
  });
}

/* ── Satellites: GCAT ── */
const CLASS = { B: "Commercial", C: "Civil", D: "Military", A: "Amateur" };
// GCAT's categories of what a payload does, in words; any other is "Other".
const CATEGORY = {
  COM: "Communications",
  IMG: "Imaging the Earth",
  "IMG-R": "Radar imaging",
  TECH: "Technology test",
  NAV: "Navigation",
  SIG: "Signals intelligence",
  MET: "Weather",
  SCI: "Science",
  EOSCI: "Earth science",
  CAL: "Calibration",
  EW: "Early warning",
  AST: "Astronomy",
  PLAN: "Planetary",
  SS: "Space station",
};
function satellites() {
  const ps = get("https://planet4589.org/space/gcat/tsv/cat/psatcat.tsv", "psatcat.tsv");
  const sc = get("https://planet4589.org/space/gcat/tsv/cat/satcat.tsv", "satcat.tsv");
  const orgs = tsvRows(get("https://planet4589.org/space/gcat/tsv/tables/orgs.tsv", "orgs.tsv"));
  const updated = (ps.match(/^# Updated (.+)$/m) || [])[1]?.trim();
  // GCAT's short English name for each state, with the two it abbreviates written out.
  const PLAIN = { USA: "United States", UK: "United Kingdom" };
  const stateName = new Map(orgs.map((c) => [c[0], PLAIN[c[14]] || c[14] || c[7]]));
  const owner = new Map(tsvRows(sc).map((c) => [c[0], c[15]]));
  const year = (s) => (/^\d{4}/.test(s) ? Number(s.slice(0, 4)) : null);
  const active = [];
  const spans = [];
  for (const c of tsvRows(ps)) {
    const [jcat, , name, ldate, , top, , , program, , , , cls, cat] = c;
    const from = year(ldate);
    if (from === null) continue;
    const working = top === "*";
    const to = working ? Infinity : year(top);
    if (to !== null) spans.push([from, to]);
    if (working) active.push({ jcat, name, program, cls: cls[0], cat: cat.replace(/[*?]$/, "").split("/")[0], state: owner.get(jcat) || "?" });
  }
  const count = (key, of = active) => {
    const m = {};
    for (const a of of) m[key(a)] = (m[key(a)] || 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const thisYear = new Date().getFullYear();
  // Working at the end of a year: launched by then, its operations ended in a later year or not at all.
  const series = [];
  for (let y = 1990; y < thisYear; y++) series.push([y, spans.filter(([a, b]) => a <= y && b > y).length]);
  const starlink = active.filter((a) => /^Starlink/i.test(a.program)).length;
  const byState = count((a) => a.state).slice(0, 12).map(([s, n]) => [stateName.get(s) || s, s, n]);
  const byClass = count((a) => CLASS[a.cls] || "Other");
  // What they do, "Other" last: of all of them, and of the military's alone.
  const uses = (of) => count((a) => CATEGORY[a.cat] || "Other", of).sort((a, b) => (a[0] === "Other") - (b[0] === "Other") || b[1] - a[1]);
  const byCat = uses(active);
  const militaryUse = uses(active.filter((a) => a.cls === "D"));
  return { updated, total: active.length, starlink, byState, byClass, byCat, militaryUse, series };
}

/* ── Government budgets for R&D: the OECD's GBARD ── */
const NABS = {
  NABS01: "Exploring the Earth",
  NABS02: "Environment",
  NABS03: "Space",
  NABS04: "Transport, telecoms, infrastructure",
  NABS05: "Energy",
  NABS06: "Industry and technology",
  NABS07: "Health",
  NABS08: "Agriculture",
  NABS09: "Education",
  NABS10: "Culture, recreation, media",
  NABS11: "Political and social systems",
  NABS12: "General knowledge (university funds)",
  NABS13: "General knowledge (other funds)",
  NABS14: "Defence",
};
function gbard() {
  const rows = csvRows(get("https://sdmx.oecd.org/public/rest/data/OECD.STI.STP,DSD_RDS_GOV@DF_GBARD_NABS07,1.0/all?startPeriod=2015&format=csvfilewithlabels", "gbard.csv")).filter(
    (r) => r.MEASURE === "C" && r.FUNDMODE === "_T" && r.UNIT_MEASURE === "USD_PPP" && r.PRICE_BASE === "V" && r.OBS_VALUE !== "" && r.UNIT_MULT === "6",
  );
  // Each place's latest year with a total, and its objectives in that year.
  const by = {};
  for (const r of rows) ((by[r.REF_AREA] ||= { name: r["Reference area"], years: {} }).years[r.TIME_PERIOD] ||= {})[r.SEO] = Number(r.OBS_VALUE);
  const places = [];
  const totals = {};
  for (const [code, p] of Object.entries(by)) {
    const years = Object.keys(p.years).filter((y) => p.years[y]._T !== undefined).sort();
    if (!years.length) continue;
    const y = years[years.length - 1];
    const v = p.years[y];
    const parts = Object.keys(NABS).filter((k) => v[k] !== undefined && v[k] > 0).map((k) => [k, Math.round(v[k])]);
    places.push({ code, name: p.name, year: Number(y), total: Math.round(v._T), parts });
    totals[code] = years.map((yy) => [Number(yy), Math.round(p.years[yy]._T)]);
  }
  // Groups of countries the OECD adds up (the OECD, the EU) are kept apart from the countries.
  const countries = places.filter((p) => /^[A-Z]{3}$/.test(p.code)).sort((a, b) => b.total - a.total);
  return { countries, totals };
}

/* ── Scanners: the OECD's medical technology availability ── */
const TECH = { MRI: "MRI units", CT_SCAN: "CT scanners", PET_SCAN: "PET scanners", MAMM: "Mammographs", RT: "Radiation therapy equipment" };
function scanners() {
  const rows = csvRows(get("https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_HEALTH_REAC_HOSP@DF_MED_TECH,1.1/all?startPeriod=2015&format=csvfilewithlabels", "medtech.csv")).filter(
    (r) => r.UNIT_MEASURE === "10P6HB" && r.HEALTH_CARE_PROVIDER === "_T" && r.OBS_VALUE !== "" && TECH[r.MEDICAL_TECH],
  );
  const out = {};
  for (const k of Object.keys(TECH)) {
    const latest = {};
    for (const r of rows.filter((x) => x.MEDICAL_TECH === k)) {
      const y = Number(r.TIME_PERIOD);
      if (!latest[r.REF_AREA] || latest[r.REF_AREA].year < y) latest[r.REF_AREA] = { name: r["Reference area"], year: y, v: Math.round(Number(r.OBS_VALUE) * 10) / 10 };
    }
    out[k] = Object.entries(latest)
      // Countries only, and only a reading from the last six years, so that no old count is ranked beside a new one.
      .filter(([c, o]) => /^[A-Z]{3}$/.test(c) && o.year >= new Date().getFullYear() - 6)
      .map(([code, o]) => [o.name, code, o.v, o.year])
      .sort((a, b) => b[2] - a[2]);
  }
  return out;
}

const S = satellites();
const G = gbard();
const M = scanners();

// Checks against figures known before the build: SpaceX's Starlink is most of the satellites working; the US government's R&D budget is the largest the OECD records.
if (S.starlink < S.total / 3) throw new Error(`Starlink ${S.starlink} of ${S.total}: the program column was not read right`);
if (G.countries[0]?.code !== "USA") throw new Error(`largest GBARD ${G.countries[0]?.code}: the filter is wrong`);
if (!M.MRI.length || M.MRI[0][2] < 20) throw new Error("MRI per million not read right");

const today = new Date().toISOString().slice(0, 10);
const J = (x) => JSON.stringify(x);
fs.writeFileSync(
  OUT,
  `/**
 * More of the Developments page's figures: the satellites working in orbit,
 * what governments budget for research and on what, and the scanners
 * hospitals have.
 *
 * GENERATED by build-frontiers2.cjs on ${today} - do not edit by hand; change
 * the script and re-run it.
 *
 * Satellites are the payloads GCAT gives as still operating (updated
 * ${S.updated}); the year-by-year line is counted here from its launch and
 * end-of-operations dates. Budgets are the OECD's GBARD in millions of US
 * dollars at purchasing power parity, current prices, each country's latest
 * year. Scanners are per million inhabitants, all providers, each country's
 * latest year from the last six.
 */
export const FRONTIERS2_RETRIEVED = "${today}";
export const FRONTIER2_SOURCES = {
  satellites: { label: "Jonathan McDowell — General Catalog of Artificial Space Objects (GCAT), payload catalogue (CC BY 4.0)", url: "https://planet4589.org/space/gcat/" },
  gbard: { label: "OECD — Government budget allocations for R&D (GBARD), by socio-economic objective (CC BY 4.0)", url: "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_RDS_GOV%40DF_GBARD_NABS07&df[ag]=OECD.STI.STP" },
  scanners: { label: "OECD — Health Statistics: medical technology availability (CC BY 4.0)", url: "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_HEALTH_REAC_HOSP%40DF_MED_TECH&df[ag]=OECD.ELS.HD" },
};

/** The payloads working in orbit as GCAT gives them: the total, Starlink's, by owning state [name, GCAT code, n], by class and by what they do, all of them and the military's. */
export const SATELLITES: { updated: string; total: number; starlink: number; byState: [name: string, code: string, n: number][]; byClass: [kind: string, n: number][]; byUse: [use: string, n: number][]; militaryUse: [use: string, n: number][] } = ${J({
    updated: S.updated,
    total: S.total,
    starlink: S.starlink,
    byState: S.byState,
    byClass: S.byClass,
    byUse: S.byCat,
    militaryUse: S.militaryUse,
  })};
/** Payloads working at the end of each year, counted here from GCAT's launch and end-of-operations dates. */
export const SATELLITES_WORKING: [year: number, n: number][] = ${J(S.series)};

/** The socio-economic objectives of the OECD's GBARD, by code. */
export const RD_OBJECTIVES: Record<string, string> = ${J(NABS)};
/** Each country's government R&D budget in its latest year: millions of US dollars at PPP, current prices, and its objectives [code, millions]. */
export const RD_BUDGETS: { code: string; name: string; year: number; total: number; parts: [objective: string, millions: number][] }[] = ${J(G.countries)};
/** Each country's total government R&D budget year by year, millions of US dollars at PPP, current prices. */
export const RD_BUDGET_SERIES: Record<string, [year: number, millions: number][]> = ${J(G.totals)};

/** The medical technologies counted, by code. */
export const SCANNER_KINDS: Record<string, string> = ${J(TECH)};
/** Each technology per million inhabitants, each country's latest year: [name, ISO3, per million, year], highest first. */
export const SCANNERS: Record<string, [name: string, iso3: string, perMillion: number, year: number][]> = ${J(M)};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}`);
console.log("satellites", S.updated, S.total, "starlink", S.starlink, J(S.byState.slice(0, 6)), J(S.byClass), J(S.byCat));
console.log("working", J(S.series.slice(-6)));
console.log("gbard", G.countries.length, J(G.countries.slice(0, 8).map((c) => [c.code, c.year, c.total])));
console.log("usa", J(G.countries[0]));
console.log("scanners", Object.entries(M).map(([k, v]) => `${k}:${v.length} ${J(v.slice(0, 3))}`).join("\n"));
