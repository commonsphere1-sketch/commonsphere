/**
 * Builds src/data/innovation.ts - the figures the Developments page's
 * innovation sections draw: the space race, science and invention, and new
 * medicines.
 *
 *   Space      Jonathan McDowell's General Catalog of Artificial Space Objects
 *              (GCAT, CC BY 4.0): every orbital launch attempt, by year and by
 *              the launch agency GCAT gives it; and the United Nations Office
 *              for Outer Space Affairs' count of objects launched into space,
 *              as Our World in Data republishes it (CC BY 4.0).
 *   Science    The World Bank's World Development Indicators (CC BY 4.0):
 *              research and development spending as a share of GDP
 *              (UNESCO's), researchers per million people, scientific and
 *              technical journal articles (the NSF's), and patent
 *              applications by residents and non-residents (WIPO's).
 *   Medicine   The US Food and Drug Administration's yearly lists of novel
 *              drug approvals (public domain): the count of rows in each
 *              year's table.
 *
 * Every figure is its publisher's; a year still under way is marked so.
 *
 *   node build-innovation.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/innovation.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-innovation");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });

function get(url, name, { browser = false } = {}) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) execFileSync("curl", ["-sL", "--fail", "-A", browser ? `Mozilla/5.0 ${UA}` : UA, "-o", at, url], { stdio: "ignore" });
  return fs.readFileSync(at, "utf8");
}
const r1 = (v) => Math.round(v * 10) / 10;

/* ── Space: GCAT ── */
function launches() {
  const tsv = get("https://planet4589.org/space/gcat/tsv/launch/launch.tsv", "launch.tsv");
  const orgs = get("https://planet4589.org/space/gcat/tsv/tables/orgs.tsv", "orgs.tsv");
  const updated = (tsv.match(/^# Updated (.+)$/m) || [])[1]?.trim();
  const orgName = new Map();
  for (const line of orgs.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const c = line.split("\t");
    orgName.set(c[0].trim(), { name: c[7].trim(), state: c[2].trim() });
  }
  const byYear = {};
  const agencies = {};
  for (const line of tsv.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const c = line.split("\t");
    const code = (c[26] || "").trim();
    if (code[0] !== "O") continue; // an orbital launch attempt
    const y = Number(c[2].slice(0, 4));
    const ag = (c[25] || "").trim();
    const e = (byYear[y] ||= { total: 0, ok: 0, spacex: 0 });
    e.total++;
    if (code[1] === "S") e.ok++;
    if (ag === "SPX") e.spacex++;
    ((agencies[y] ||= {})[ag] ||= 0), agencies[y][ag]++;
  }
  const thisYear = new Date().getFullYear();
  const lastFull = thisYear - 1;
  const top = Object.entries(agencies[lastFull] || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code, n]) => [orgName.get(code)?.name ?? code, orgName.get(code)?.state ?? "", n]);
  const series = Object.keys(byYear)
    .map(Number)
    .filter((y) => y >= 1957)
    .sort((a, b) => a - b)
    .map((y) => [y, byYear[y].total, byYear[y].ok, byYear[y].spacex]);
  return { series, top, lastFull, thisYear, updated };
}

/* ── Space: UNOOSA via Our World in Data ── */
function objects() {
  const csv = get("https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space.csv?v=1&csvType=full&useColumnShortNames=true", "objects.csv");
  const rows = csv.trim().split("\n").slice(1).map((l) => {
    const m = l.match(/^("?)(.*?)\1,([A-Z_]*),(\d{4}),(\d+(?:\.\d+)?)$/);
    return m ? { entity: m[2], code: m[3], year: +m[4], v: +m[5] } : null;
  }).filter(Boolean);
  const world = rows.filter((r) => r.entity === "World").map((r) => [r.year, r.v]).sort((a, b) => a[0] - b[0]);
  const last = world[world.length - 1]?.[0];
  const top = rows.filter((r) => r.year === last && /^[A-Z]{3}$/.test(r.code)).sort((a, b) => b.v - a.v).slice(0, 10).map((r) => [r.entity, r.v]);
  return { world, top, last };
}

/* ── Science: the World Bank ── */
function wb(indicator, name) {
  const j = JSON.parse(get(`https://api.worldbank.org/v2/country/WLD/indicator/${indicator}?format=json&per_page=200`, `${name}-wld.json`));
  const world = (j[1] || []).filter((d) => d.value !== null).map((d) => [Number(d.date), d.value]).sort((a, b) => a[0] - b[0]);
  return world;
}
function wbTop(indicator, name, aggregates) {
  const j = JSON.parse(get(`https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrnev=1&per_page=400`, `${name}-all.json`));
  return (j[1] || [])
    .filter((d) => d.value !== null && !aggregates.has(d.countryiso3code) && d.countryiso3code)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((d) => [d.country.value, d.value, Number(d.date)]);
}

/* ── Medicine: the FDA ── */
function approvals() {
  const out = [];
  for (let y = 2018; y <= new Date().getFullYear(); y++) {
    let html = "";
    try {
      html = get(`https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-${y}`, `fda-${y}.html`, { browser: true });
    } catch {
      continue;
    }
    // The approvals are the rows of the page's one table, less its heading.
    const table = (html.match(/<table[\s\S]*?<\/table>/) || [""])[0];
    const rows = (table.match(/<tr[\s>]/g) || []).length - 1;
    if (rows > 0 && /Novel Drug Approvals for \d{4}/.test(html)) out.push([y, rows]);
  }
  return out;
}

(async () => {
  const countries = JSON.parse(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
  const aggregates = new Set(countries.filter((c) => c.region?.value === "Aggregates").map((c) => c.id));

  const L = launches();
  const O = objects();
  const rd = wb("GB.XPD.RSDV.GD.ZS", "rd");
  const rdTop = wbTop("GB.XPD.RSDV.GD.ZS", "rd", aggregates);
  const researchers = wb("SP.POP.SCIE.RD.P6", "researchers");
  const articles = wb("IP.JRN.ARTC.SC", "articles");
  const articlesTop = wbTop("IP.JRN.ARTC.SC", "articles", aggregates);
  const patRes = wb("IP.PAT.RESD", "patres");
  const patNon = wb("IP.PAT.NRES", "patnon");
  const patTop = wbTop("IP.PAT.RESD", "patres", aggregates);
  const fda = approvals();

  // Checks against figures known before the build: SpaceX launched more than 100 times in 2024; the FDA approved 50 novel drugs in 2024.
  const sx24 = L.series.find(([y]) => y === 2024);
  if (!sx24 || sx24[3] < 100) throw new Error(`SpaceX 2024 launches ${sx24 && sx24[3]}: wrong column?`);
  const f24 = fda.find(([y]) => y === 2024);
  if (f24 && f24[1] !== 50) throw new Error(`FDA 2024 approvals ${f24[1]}: the table was not read right`);

  const pat = patRes.map(([y, r]) => [y, r, patNon.find(([x]) => x === y)?.[1] ?? null]);
  const today = new Date().toISOString().slice(0, 10);
  const J = (x) => JSON.stringify(x);
  fs.writeFileSync(
    OUT,
    `/**
 * The figures of the Developments page's innovation sections: the space race,
 * science and invention, and new medicines.
 *
 * GENERATED by build-innovation.cjs on ${today} - do not edit by hand; change
 * the script and re-run it.
 *
 * Every figure is its publisher's. Orbital launches are every attempt GCAT
 * lists for a year, successful or not, by the launch agency it gives; ${L.thisYear} is
 * under way (GCAT updated ${L.updated}). The FDA's count is the rows of its
 * table of novel drug approvals for each year.
 */
export const INNOVATION_RETRIEVED = "${today}";
export const INNOVATION_SOURCES = {
  gcat: { label: "Jonathan McDowell — General Catalog of Artificial Space Objects (GCAT), orbital launch list (CC BY 4.0)", url: "https://planet4589.org/space/gcat/" },
  unoosa: { label: "UN Office for Outer Space Affairs — Online Index of Objects Launched into Outer Space, via Our World in Data (CC BY 4.0)", url: "https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space" },
  rd: { label: "World Bank — World Development Indicators: research and development expenditure, % of GDP (UNESCO Institute for Statistics), GB.XPD.RSDV.GD.ZS (CC BY 4.0)", url: "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS" },
  researchers: { label: "World Bank — World Development Indicators: researchers in R&D per million people (UNESCO Institute for Statistics), SP.POP.SCIE.RD.P6 (CC BY 4.0)", url: "https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6" },
  articles: { label: "World Bank — World Development Indicators: scientific and technical journal articles (National Science Foundation), IP.JRN.ARTC.SC (CC BY 4.0)", url: "https://data.worldbank.org/indicator/IP.JRN.ARTC.SC" },
  patents: { label: "World Bank — World Development Indicators: patent applications, residents and non-residents (WIPO), IP.PAT.RESD and IP.PAT.NRES (CC BY 4.0)", url: "https://data.worldbank.org/indicator/IP.PAT.RESD" },
  fda: { label: "US Food and Drug Administration — Novel Drug Approvals, by year (public domain)", url: "https://www.fda.gov/drugs/development-approval-process-drugs/novel-drug-approvals-fda" },
};

/** Orbital launch attempts by year: [year, all attempts, those that reached orbit, SpaceX's]. The last year is under way. */
export const ORBITAL_LAUNCHES: [year: number, total: number, success: number, spacex: number][] = ${J(L.series)};
export const LAUNCHES_PARTIAL_YEAR = ${L.thisYear};
/** The ten launch agencies with the most orbital launch attempts in ${L.lastFull}: [name, GCAT's state code, attempts]. */
export const LAUNCH_AGENCIES: { year: number; rows: [name: string, state: string, n: number][] } = { year: ${L.lastFull}, rows: ${J(L.top)} };

/** Objects launched into space each year, the world's; and the ten countries that launched the most in ${O.last}. */
export const SPACE_OBJECTS: { world: [year: number, n: number][]; year: number; top: [country: string, n: number][] } = { world: ${J(O.world)}, year: ${O.last}, top: ${J(O.top)} };

/** The world's research and development spending, % of GDP; and the ten countries that spend the largest share, each its latest year. */
export const RD_SHARE: { world: [year: number, pct: number][]; top: [country: string, pct: number, year: number][] } = { world: ${J(rd.map(([y, v]) => [y, Math.round(v * 100) / 100]))}, top: ${J(rdTop.map(([n, v, y]) => [n, Math.round(v * 100) / 100, y]))} };
/** Researchers in research and development per million people, the world's. */
export const RESEARCHERS: [year: number, perMillion: number][] = ${J(researchers.map(([y, v]) => [y, Math.round(v)]))};
/** Scientific and technical journal articles a year, the world's; and the ten countries that publish the most, each its latest year. */
export const ARTICLES: { world: [year: number, n: number][]; top: [country: string, n: number, year: number][] } = { world: ${J(articles.map(([y, v]) => [y, Math.round(v)]))}, top: ${J(articlesTop.map(([n, v, y]) => [n, Math.round(v), y]))} };
/** Patent applications a year, the world's: [year, by residents, by non-residents]; and the ten countries whose residents file the most, each its latest year. */
export const PATENTS: { world: [year: number, residents: number, nonResidents: number | null][]; top: [country: string, n: number, year: number][] } = { world: ${J(pat)}, top: ${J(patTop)} };

/** Novel drugs the FDA's Center for Drug Evaluation and Research approved each year. */
export const FDA_APPROVALS: [year: number, n: number][] = ${J(fda)};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log("launches:", J(L.series.slice(-5)), "top", J(L.top.slice(0, 4)));
  console.log("objects:", O.last, J(O.world.slice(-3)), J(O.top.slice(0, 3)));
  console.log("rd:", J(rd.slice(-2)), J(rdTop.slice(0, 3)));
  console.log("articles:", J(articles.slice(-2)), "patents:", J(pat.slice(-2)), "researchers:", J(researchers.slice(-2)));
  console.log("fda:", J(fda));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
