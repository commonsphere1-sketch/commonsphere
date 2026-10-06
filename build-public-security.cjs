/**
 * Builds src/data/publicSecurity.ts — how secure the public is in each
 * country, as the bodies that measure it publish it. It is behind the
 * "Public security" panel of a country's window.
 *
 * No body publishes one "security status" for every country, and the site
 * does not make one up. The panel sets out the published measures side by
 * side, each with its year:
 *
 *   World Bank, Worldwide      Political Stability and Absence of
 *     Governance Indicators    Violence/Terrorism, and Rule of Law: the score
 *     (2026 Update)            on the Bank's absolute 0-100 scale, with the
 *                              lower and upper bound it gives for it, read
 *                              from its Data360 service. A country's place
 *                              among the economies scored that year is
 *                              counted here from those scores.
 *   Uppsala Conflict Data      deaths in armed conflict that took place in
 *     Program (via Our World   the country, latest year: in state-based
 *     in Data)                 conflict, in conflict between non-state
 *                              groups, and of civilians in one-sided
 *                              violence. Our World in Data places each
 *                              event UCDP records in the country its
 *                              coordinates fall in.
 *   Global Terrorism           terrorist attacks and the deaths in them,
 *     Database, START (via     latest year the database runs to.
 *     Our World in Data)
 *   UNHCR (via the World       refugees who have left the country, and
 *     Bank)                    refugees it hosts.
 *   IDMC (via the World        new displacements within the country
 *     Bank)                    associated with conflict and violence.
 *
 * The homicide rate is UNODC's and is already in countryCrime.ts.
 *
 * Nothing is estimated. A measure a body does not give for a country is
 * absent, and a displacement figure more than five years old is not kept.
 *
 *   node build-public-security.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/publicSecurity.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-public-security");
fs.mkdirSync(CACHE, { recursive: true });
const THIS_YEAR = new Date().getFullYear();

function fetchText(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "180", "-A", UA, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${url}: could not be fetched`);
    }
  }
  return fs.readFileSync(at, "utf8");
}
const json = (url, name) => JSON.parse(fetchText(url, name));
const round = (v, dp) => Number(Number(v).toFixed(dp));

// ── Which ISO3 code is which ISO2, and which World Bank "countries" are aggregates ──
const wbCountries = json("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json")[1];
const iso2Of = {};
for (const c of wbCountries) if (c.region && c.region.id !== "NA" && /^[A-Z]{2}$/.test(c.iso2Code)) iso2Of[c.id] = c.iso2Code;
if (Object.keys(iso2Of).length < 200) throw new Error(`only ${Object.keys(iso2Of).length} World Bank economies were read`);

const out = {};
const of = (iso2) => (out[iso2] ||= {});

// ── Worldwide Governance Indicators: the 0-100 score and its bounds ──
function wgi(indicator, tag) {
  const rows = [];
  for (const part of ["WGI_SC", "WGI_SC_LB", "WGI_SC_UB"]) {
    for (let skip = 0; ; skip += 1000) {
      const page = json(`https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WGI&INDICATOR=${indicator}&COMP_BREAKDOWN_1=${part}&skip=${skip}`, `wgi-${tag}-${part}-${skip}.json`);
      for (const r of page.value) rows.push({ iso3: r.REF_AREA, year: +r.TIME_PERIOD, part, v: +r.OBS_VALUE });
      if (page.value.length < 1000) break;
    }
  }
  if (rows.length < 3000) throw new Error(`${indicator}: only ${rows.length} rows`);
  const edition = Math.max(...rows.map((r) => r.year));
  const byCountry = {};
  for (const r of rows) if (r.year === edition && Number.isFinite(r.v)) (byCountry[r.iso3] ||= {})[r.part] = r.v;
  const scored = Object.entries(byCountry).filter(([, p]) => p.WGI_SC != null && p.WGI_SC_LB != null && p.WGI_SC_UB != null);
  if (scored.length < 180) throw new Error(`${indicator}: ${scored.length} economies scored for ${edition}`);
  const scores = scored.map(([, p]) => p.WGI_SC).sort((a, b) => b - a);
  for (const [iso3, p] of scored) {
    if (p.WGI_SC < 0 || p.WGI_SC > 100 || p.WGI_SC_LB > p.WGI_SC || p.WGI_SC_UB < p.WGI_SC) throw new Error(`${indicator} ${iso3}: score ${p.WGI_SC} outside its own bounds`);
    const iso2 = iso2Of[iso3];
    if (!iso2) continue;
    of(iso2)[tag] = { y: edition, v: round(p.WGI_SC, 1), lo: round(p.WGI_SC_LB, 1), hi: round(p.WGI_SC_UB, 1), rank: scores.findIndex((s) => s <= p.WGI_SC) + 1 };
  }
  return { edition, economies: scored.length };
}
const stability = wgi("GOV_WGI_PV", "stability");
const ruleOfLaw = wgi("GOV_WGI_RL", "ruleOfLaw");
if (stability.edition !== ruleOfLaw.edition) throw new Error("the two governance indicators are for different years");

// ── Our World in Data's country tables: entity, ISO3 code, year, then the figures ──
function owid(slug) {
  const text = fetchText(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `${slug}.csv`);
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => {
    // No field in these tables is quoted except a name with a comma in it, which is the first.
    const f = l.startsWith('"') ? [l.slice(1, l.indexOf('",')), ...l.slice(l.indexOf('",') + 2).split(",")] : l.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, f[i]]));
  });
}

// UCDP: deaths in armed conflict, by where it took place.
{
  const rows = owid("deaths-in-armed-conflicts-by-type");
  const k = "number_deaths_ongoing_conflicts__conflict_type_";
  for (const c of ["one_sided_violence", "non_state_conflict", "intrastate", "interstate", "extrasystemic"]) if (!(k + c in rows[0])) throw new Error(`UCDP: no "${c}" column`);
  const latest = Math.max(...rows.map((r) => +r.year));
  let n = 0;
  for (const r of rows) {
    const iso2 = iso2Of[r.code];
    if (+r.year !== latest || !iso2) continue;
    const num = (c) => Math.round(+r[k + c] || 0);
    const stateBased = num("intrastate") + num("interstate") + num("extrasystemic");
    of(iso2).conflict = { y: latest, stateBased, nonState: num("non_state_conflict"), oneSided: num("one_sided_violence") };
    n++;
  }
  if (n < 150) throw new Error(`UCDP: only ${n} countries for ${latest}`);
  out.__ucdpYear = latest;
}

// GTD: attacks and the deaths in them.
{
  const deaths = owid("terrorism-deaths");
  const attacks = owid("terrorist-attacks");
  const latest = Math.max(...deaths.map((r) => +r.year));
  const attacksOf = new Map(attacks.filter((r) => +r.year === latest).map((r) => [r.code, +r.total_incident_counts]));
  let n = 0;
  for (const r of deaths) {
    const iso2 = iso2Of[r.code];
    if (+r.year !== latest || !iso2 || !attacksOf.has(r.code)) continue;
    of(iso2).terror = { y: latest, attacks: Math.round(attacksOf.get(r.code)), deaths: Math.round(+r.total_killed) };
    n++;
  }
  if (n < 150) throw new Error(`GTD: only ${n} countries for ${latest}`);
  out.__gtdYear = latest;
}

// World Bank: refugees by origin and by asylum (UNHCR), and new conflict displacements (IDMC).
function wb(code, tag, oldest) {
  const rows = json(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrnev=1&per_page=1000`, `${code}.json`)[1] || [];
  let n = 0;
  for (const r of rows) {
    const iso2 = iso2Of[r.countryiso3code];
    if (!iso2 || r.value == null || +r.date < oldest) continue;
    of(iso2)[tag] = { y: +r.date, v: Math.round(r.value) };
    n++;
  }
  if (n < 40) throw new Error(`${code}: only ${n} countries`);
}
wb("SM.POP.RHCR.EO", "refugeesFrom", THIS_YEAR - 5);
wb("SM.POP.RHCR.EA", "refugeesHosted", THIS_YEAR - 5);
wb("VC.IDP.NWCV", "newDisplacements", THIS_YEAR - 5);

const ucdpYear = out.__ucdpYear, gtdYear = out.__gtdYear;
delete out.__ucdpYear;
delete out.__gtdYear;

const today = new Date().toISOString().slice(0, 10);
const obj = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(", ")} }`;
const row = (iso2) => `  ${iso2}: { ${Object.entries(out[iso2]).map(([k, v]) => `${k}: ${obj(v)}`).join(", ")} },`;
fs.writeFileSync(
  OUT,
  `/**
 * How secure the public is in each country, as the bodies that measure it
 * publish it: behind the "Public security" panel of a country's window.
 *
 * GENERATED by build-public-security.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * There is no single published "security status", and none is made up here.
 * These are the measures, each with its year: the World Bank's governance
 * scores for political stability and absence of violence and for the rule
 * of law (0-100, with the bounds the Bank gives), the deaths UCDP records in
 * armed conflict in the country, the attacks and deaths the Global Terrorism
 * Database records, and the refugees and displacements UNHCR and IDMC count.
 * A measure a body does not give for a country is absent.
 */
export const PUBLIC_SECURITY_SOURCES = {
  wgi: {
    label: "World Bank — Worldwide Governance Indicators, 2026 Update",
    url: "https://www.worldbank.org/en/publication/worldwide-governance-indicators",
    /** The year the scores are for, and how many economies have one. */
    year: ${stability.edition},
    economies: ${stability.economies},
  },
  ucdp: { label: "Uppsala Conflict Data Program (via Our World in Data)", url: "https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type", year: ${ucdpYear} },
  gtd: { label: "Global Terrorism Database, START (via Our World in Data)", url: "https://ourworldindata.org/grapher/terrorism-deaths", year: ${gtdYear} },
  unhcr: { label: "UNHCR, via the World Bank", url: "https://data.worldbank.org/indicator/SM.POP.RHCR.EO" },
  idmc: { label: "Internal Displacement Monitoring Centre, via the World Bank", url: "https://data.worldbank.org/indicator/VC.IDP.NWCV" },
  retrieved: "${today}",
};

/** A governance score on the World Bank's absolute 0-100 scale: higher is better governed. */
export type GovernanceScore = {
  y: number;
  v: number;
  /** The lower and upper bound the Bank gives for the score. */
  lo: number;
  hi: number;
  /** Its place among the economies scored that year, 1st the highest: counted from the scores. */
  rank: number;
};
export type Counted = { y: number; v: number };

export type PublicSecurity = {
  /** Political Stability and Absence of Violence/Terrorism. */
  stability?: GovernanceScore;
  /** Rule of Law. */
  ruleOfLaw?: GovernanceScore;
  /** Deaths in armed conflict that took place in the country: in state-based conflict, between non-state groups, and of civilians in one-sided violence. */
  conflict?: { y: number; stateBased: number; nonState: number; oneSided: number };
  /** Terrorist attacks, and the deaths in them. */
  terror?: { y: number; attacks: number; deaths: number };
  /** Refugees under UNHCR's mandate who have left the country. */
  refugeesFrom?: Counted;
  /** Refugees under UNHCR's mandate whom the country hosts. */
  refugeesHosted?: Counted;
  /** New displacements within the country associated with conflict and violence, in the year. */
  newDisplacements?: Counted;
};

/** ISO 3166-1 alpha-2 code → the measures published for the country. */
export const PUBLIC_SECURITY: Record<string, PublicSecurity> = {
${Object.keys(out).sort().map(row).join("\n")}
};
`,
);
const n = (k) => Object.values(out).filter((o) => o[k]).length;
console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} countries`);
console.log(`  governance scores, ${stability.edition}: ${n("stability")} stability, ${n("ruleOfLaw")} rule of law (of ${stability.economies} economies scored)`);
console.log(`  conflict deaths, ${ucdpYear}: ${n("conflict")} · terrorism, ${gtdYear}: ${n("terror")}`);
console.log(`  refugees from ${n("refugeesFrom")}, hosted ${n("refugeesHosted")}, new displacements ${n("newDisplacements")}`);
for (const c of ["JP", "US", "UA", "NG", "MX", "SD"]) console.log(`  ${c}: ${JSON.stringify(out[c])}`);
