/**
 * Builds src/data/worldview.ts — the world as a whole, in the figures the
 * bodies that measure it publish, for the Worldview page.
 *
 * Every figure is a published world total or world share, with its year and
 * its source, and a series back to 1990 where the source has one (for the
 * trend line and the ten-years-ago comparison). Nothing is estimated here:
 *
 *   World Bank WDI          the world aggregate ("WLD") of each indicator,
 *                           as the Bank computes it; external debt for low-
 *                           and middle-income countries ("LMY")
 *   IMF World Economic      general government gross debt, world aggregate
 *     Outlook               ("WEOWORLD"). The current year and later are
 *                           projections and are left out; the latest year
 *                           kept may still be an IMF estimate.
 *   UCDP (via Our World     armed conflicts and the deaths in them, by type
 *     in Data)
 *   V-Dem Regimes of the    how many people live under each kind of regime
 *     World (via OWID)
 *   V-Dem indices (OWID)    civil liberties and freedom of expression, as
 *                           OWID's population-weighted world average (its
 *                           plain "World" is an unweighted mean of countries)
 *   Freedom House (OWID)    each country's political rights and civil
 *                           liberties scores; Free / Partly Free / Not Free
 *                           assigned by Freedom House's published rules
 *   Global Terrorism        attacks and deaths; the public release ends in
 *     Database (OWID)       2021, and the page says so
 *   UN Tourism (OWID)       each country's international arrivals and its
 *                           residents' trips abroad (per resident, with the
 *                           World Bank's population for the same year), all
 *                           for one year so the rankings compare like with
 *                           like - see TOURISM_YEAR
 *   UNHCR                   refugees, asylum-seekers, internally displaced
 *                           people and others it counts, and Palestine
 *                           refugees under UNRWA's mandate
 *   World Bank income       the four income groups (high, upper-middle,
 *     groups                lower-middle, low) as the Bank aggregates them,
 *                           and which group each economy is in now - the
 *                           page's comparison of developed and developing
 *                           economies
 *   UN World Population     the medium-variant projection, for the page's
 *     Prospects 2024 (OWID) population clock - the one place the page shows
 *                           a projection, and it says so
 *   V-Dem indices (OWID)    electoral democracy, rule of law, the courts'
 *                           and legislature's checks on the executive,
 *                           academic freedom, political polarization,
 *                           freedom from torture and political killing,
 *                           equality before the law, private liberties,
 *                           freedom of association, and women's civil
 *                           liberties and political empowerment, as
 *                           population-weighted world averages
 *   UNDP Human Development  the world's Human Development Index
 *     Report (OWID)
 *   Federation of American  the world's nuclear warheads, as estimated from
 *     Scientists (OWID)     public information
 *   World Bank WDI, from    broadband (ITU), secure servers (Netcraft),
 *     other bodies          researchers (UNESCO), scientific articles (NSF),
 *                           high-tech exports (UN Comtrade), payments for
 *                           intellectual property and government revenue
 *                           (IMF), armed forces (IISS), arms transfers
 *                           (SIPRI), sanitation (WHO/UNICEF), jobs by
 *                           sector and wage work (ILO), output by sector,
 *                           output per person at purchasing power (ICP),
 *                           clean cooking (Tracking SDG 7), energy and
 *                           electricity use (IEA)
 *   Pew Research Center     the world's religious makeup in 2020 and its
 *                           change from 2010, recorded from the report (see
 *                           PEW), since its site does not serve scripts
 *
 * A series that fails to download stops the build rather than being left
 * out quietly.
 *
 *   node build-worldview.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/worldview.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-worldview");
fs.mkdirSync(CACHE, { recursive: true });
const THIS_YEAR = new Date().getFullYear();
const FROM = 1990;

async function get(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    fs.writeFileSync(at, await res.text());
  }
  return fs.readFileSync(at, "utf8");
}

// ── Sources ───────────────────────────────────────────────────────────────

const WB = (code, area = "1W") => ({
  label: "World Bank — World Development Indicators",
  url: `https://data.worldbank.org/indicator/${code}?locations=${area}`,
});
const SRC = {
  imf: { label: "IMF — World Economic Outlook, general government gross debt", url: "https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO/WEOWORLD" },
  ucdp: { label: "Uppsala Conflict Data Program (via Our World in Data)", url: "https://ourworldindata.org/grapher/number-of-armed-conflicts" },
  ucdpDeaths: { label: "Uppsala Conflict Data Program (via Our World in Data)", url: "https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type" },
  vdem: { label: "V-Dem Regimes of the World (via Our World in Data)", url: "https://ourworldindata.org/grapher/people-living-in-democracies-autocracies" },
  unhcr: { label: "UNHCR Refugee Data Finder", url: "https://www.unhcr.org/refugee-statistics/" },
  vdemCivil: { label: "V-Dem civil liberties index (via Our World in Data)", url: "https://ourworldindata.org/grapher/human-rights-index-vdem" },
  vdemExpr: { label: "V-Dem freedom of expression index (via Our World in Data)", url: "https://ourworldindata.org/grapher/freedom-of-expression-index" },
  gtd: { label: "Global Terrorism Database, START (via Our World in Data)", url: "https://ourworldindata.org/grapher/terrorist-attacks" },
  schooling: { label: "UNDP Human Development Report, mean years of schooling (via Our World in Data)", url: "https://ourworldindata.org/grapher/average-years-of-schooling" },
  fh: { label: "Freedom House — Freedom in the World (scores via Our World in Data)", url: "https://freedomhouse.org/report/freedom-world" },
  arrivals: { label: "UN Tourism — international overnight arrivals (via Our World in Data)", url: "https://ourworldindata.org/grapher/international-tourist-trips" },
  departures: { label: "UN Tourism — trips abroad by residents (via Our World in Data), per resident with World Bank population", url: "https://ourworldindata.org/grapher/international-tourist-departures" },
  wpp: { label: "UN World Population Prospects 2024, medium variant (via Our World in Data)", url: "https://population.un.org/wpp/" },
  vdemElect: { label: "V-Dem electoral democracy index (via Our World in Data)", url: "https://ourworldindata.org/grapher/electoral-democracy-index" },
  vdemLaw: { label: "V-Dem rule of law index (via Our World in Data)", url: "https://ourworldindata.org/grapher/rule-of-law-index" },
  vdemJudicial: { label: "V-Dem judicial constraints on the executive index (via Our World in Data)", url: "https://ourworldindata.org/grapher/judicial-constraints-on-the-executive-index" },
  vdemLegis: { label: "V-Dem legislative constraints on the executive index (via Our World in Data)", url: "https://ourworldindata.org/grapher/legislative-constraints-on-the-executive-index" },
  vdemAcademic: { label: "V-Dem academic freedom index (via Our World in Data)", url: "https://ourworldindata.org/grapher/academic-freedom-index" },
  vdemPolar: { label: "V-Dem political polarization (via Our World in Data)", url: "https://ourworldindata.org/grapher/political-polarization-score" },
  vdemPhys: { label: "V-Dem physical violence index (via Our World in Data)", url: "https://ourworldindata.org/grapher/physical-integrity-rights-index-vdem" },
  vdemWomenCiv: { label: "V-Dem women's civil liberties index (via Our World in Data)", url: "https://ourworldindata.org/grapher/women-civil-liberties-index" },
  vdemEquality: { label: "V-Dem equality before the law and individual liberty index (via Our World in Data)", url: "https://ourworldindata.org/grapher/individual-liberties-and-equality-before-the-law-index" },
  vdemPrivate: { label: "V-Dem private civil liberties index (via Our World in Data)", url: "https://ourworldindata.org/grapher/private-civil-liberties-index" },
  vdemAssoc: { label: "V-Dem freedom of association index (via Our World in Data)", url: "https://ourworldindata.org/grapher/freedom-of-association-index" },
  vdemWomenEmp: { label: "V-Dem women's political empowerment index (via Our World in Data)", url: "https://ourworldindata.org/grapher/women-political-empowerment-index" },
  hdi: { label: "UNDP Human Development Report (via Our World in Data)", url: "https://ourworldindata.org/grapher/human-development-index" },
  vdemLiberal: { label: "V-Dem liberal democracy index (via Our World in Data)", url: "https://ourworldindata.org/grapher/liberal-democracy-index" },
  vdemParticip: { label: "V-Dem participatory democracy index (via Our World in Data)", url: "https://ourworldindata.org/grapher/participatory-democracy-index" },
  vdemDelib: { label: "V-Dem deliberative democracy index (via Our World in Data)", url: "https://ourworldindata.org/grapher/deliberative-democracy-index-vdem" },
  vdemEgal: { label: "V-Dem egalitarian democracy index (via Our World in Data)", url: "https://ourworldindata.org/grapher/egalitarian-democracy-index-vdem" },
  vdemPolLib: { label: "V-Dem political civil liberties index (via Our World in Data)", url: "https://ourworldindata.org/grapher/political-civil-liberties-index" },
  vdemCivSoc: { label: "V-Dem civil society participation index (via Our World in Data)", url: "https://ourworldindata.org/grapher/civil-society-participation-index" },
  emdat: { label: "EM-DAT, CRED / UCLouvain (via Our World in Data)", url: "https://ourworldindata.org/grapher/number-of-deaths-from-natural-disasters" },
  fas: { label: "Federation of American Scientists — estimated nuclear warhead inventories (via Our World in Data)", url: "https://ourworldindata.org/grapher/nuclear-warhead-stockpiles" },
  pew: { label: "Pew Research Center — How the Global Religious Landscape Changed From 2010 to 2020 (2025)", url: "https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/" },
};

/**
 * Religion, as Pew Research Center's report "How the Global Religious
 * Landscape Changed From 2010 to 2020" (9 June 2025) states it: each
 * group's share of the world's people in 2020, and the change from 2010 in
 * the report's own words. Recorded here rather than fetched, because Pew's
 * site answers scripts with a browser check; read from the report's text on
 * PEW_CHECKED, and each line quotes it. A 2010 share is kept only where the
 * report gives one (the unaffiliated, "from 23.3%"); a change it gives only
 * in words stays in words, rather than being turned into a 2010 figure.
 */
const PEW_CHECKED = "2026-09-30";
const PEW_NOTE =
  "Pew Research Center's estimates for 201 countries and territories, home to 99.98% of the world's people, from more than 2,700 censuses and surveys, with 2010 and 2020 estimated the same way.";
const PEW = [
  // "Christians fell 1.8 percentage points, to 28.8%."
  ["christians", "Christians", [[2020, 28.8]], { text: "-1.8 points since 2010", dir: "down" }],
  // "The share of the world's population that is Muslim rose by 1.8 points, to 25.6%."
  ["muslims", "Muslims", [[2020, 25.6]], { text: "+1.8 points since 2010", dir: "up" }],
  // "The share of 'nones' climbed nearly a full percentage point, to 24.2%." ... "(from 23.3%)"
  ["unaffiliated", "No religion", [[2010, 23.3], [2020, 24.2]], null],
  // "Hindus held steady at 14.9%."
  ["hindus", "Hindus", [[2020, 14.9]], { text: "held steady since 2010", dir: "flat" }],
  // "Buddhists slipped by 0.8 points, to 4.1%."
  ["buddhists", "Buddhists", [[2020, 4.1]], { text: "-0.8 points since 2010", dir: "down" }],
  // "Jews also held steady as a share of the world's population." ... "about 0.2%"
  ["jews", "Jews", [[2020, 0.2]], { text: "held steady since 2010", dir: "flat" }],
  // "All other religions combined ... Their share of the global population held steady at 2.2%."
  ["otherReligions", "Other religions", [[2020, 2.2]], { text: "held steady since 2010", dir: "flat" }],
];

// ── World Bank ────────────────────────────────────────────────────────────

async function wbSeries(code, area = "WLD") {
  const t = await get(
    `https://api.worldbank.org/v2/country/${area}/indicator/${code}?format=json&per_page=200&date=${FROM}:${THIS_YEAR}`,
    `wb-${area}-${code}.json`,
  );
  const j = JSON.parse(t);
  if (!Array.isArray(j) || !j[1]) throw new Error(`World Bank ${code} (${area}): no data`);
  const pts = j[1]
    .filter((r) => r.value !== null && Number.isFinite(r.value) && /^\d{4}$/.test(r.date))
    .map((r) => [Number(r.date), r.value])
    .sort((a, b) => a[0] - b[0]);
  if (pts.length < 5) throw new Error(`World Bank ${code} (${area}): only ${pts.length} points`);
  return pts;
}

// ── IMF ───────────────────────────────────────────────────────────────────

async function imfWorldDebt() {
  const j = JSON.parse(await get("https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP", "imf-debt.json"));
  const w = j?.values?.GGXWDG_NGDP?.WEOWORLD;
  if (!w) throw new Error("IMF: no WEOWORLD debt");
  const pts = Object.entries(w)
    .map(([y, v]) => [Number(y), v])
    .filter(([y, v]) => y >= FROM && y < THIS_YEAR && Number.isFinite(v))
    .sort((a, b) => a[0] - b[0]);
  if (pts.length < 5) throw new Error("IMF: too few debt points");
  return pts;
}

// ── Our World in Data ─────────────────────────────────────────────────────

function splitCsvLine(line) {
  const cells = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells;
}

function csvRows(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = splitCsvLine(l);
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}

const owidCsv = async (slug) =>
  csvRows(await get(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `owid-${slug}.csv`));

async function owidWorld(slug, entity = "World") {
  const rows = (await owidCsv(slug)).filter((r) => r.entity === entity);
  if (!rows.length) throw new Error(`OWID ${slug}: no "${entity}" rows`);
  return rows.map((r) => ({ ...r, year: Number(r.year) })).sort((a, b) => a.year - b.year);
}

/** A single-value OWID series for the world, as [year, value] points from FROM on. */
async function owidWorldSeries(slug, column, entity = "World") {
  const rows = await owidWorld(slug, entity);
  const k = col(rows[0], column);
  return rows.filter((r) => r.year >= FROM && r[k] !== "" && Number.isFinite(Number(r[k]))).map((r) => [r.year, Number(r[k])]);
}

/** Each country's latest value of an OWID series, by ISO2 (OWID codes are ISO3). */
async function owidByCountry(slug, column, iso2Of) {
  const rows = await owidCsv(slug);
  const k = col(rows[0], column);
  const out = {};
  for (const r of rows) {
    const iso2 = iso2Of[r.code];
    const v = Number(r[k]);
    const y = Number(r.year);
    if (!iso2 || r[k] === "" || !Number.isFinite(v) || y > THIS_YEAR || y < THIS_YEAR - 8) continue;
    if (!out[iso2] || y > out[iso2][0]) out[iso2] = [y, v];
  }
  return out;
}

/**
 * Tourism rankings compare every country in the same year. Countries report
 * to UN Tourism late and unevenly - 174 reported arrivals for 2019, 69 for
 * 2023 - and 2020-21 were shut by the pandemic, so a "latest year each"
 * ranking would set one country's 2024 against another's 2021 lockdown.
 * 2019 is the last year before the pandemic that most countries reported.
 */
const TOURISM_YEAR = 2019;

/** Each country's value of an OWID series in one year, by ISO2. */
async function owidByCountryInYear(slug, column, iso2Of, year) {
  const rows = await owidCsv(slug);
  const k = col(rows[0], column);
  const out = {};
  for (const r of rows) {
    const iso2 = iso2Of[r.code];
    const v = Number(r[k]);
    if (!iso2 || Number(r.year) !== year || r[k] === "" || !Number.isFinite(v)) continue;
    out[iso2] = [year, v];
  }
  return out;
}

/** Every country's value of a World Bank series by year: { ISO2: { year: value } }. */
async function wbAllCountries(code, from = THIS_YEAR - 10) {
  const t = await get(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=${from}:${THIS_YEAR}`, `wb-all-${code}-${from}.json`);
  const j = JSON.parse(t);
  if (!Array.isArray(j) || !j[1]) throw new Error(`World Bank ${code} (all countries): no data`);
  const out = {};
  for (const r of j[1]) {
    if (r.value === null || !Number.isFinite(r.value)) continue;
    (out[r.country.id] ||= {})[Number(r.date)] = r.value;
  }
  return out;
}

/**
 * Freedom House's published rules: each score becomes a 1-7 rating, and the
 * average of the two ratings decides the status - 1.0 to 2.5 Free, 3.0 to
 * 5.0 Partly Free, 5.5 to 7.0 Not Free.
 */
function freedomStatus(pr, cl) {
  const prRating = pr >= 36 ? 1 : pr >= 30 ? 2 : pr >= 24 ? 3 : pr >= 18 ? 4 : pr >= 12 ? 5 : pr >= 6 ? 6 : 7;
  const clRating = cl >= 53 ? 1 : cl >= 44 ? 2 : cl >= 35 ? 3 : cl >= 26 ? 4 : cl >= 17 ? 5 : cl >= 8 ? 6 : 7;
  const avg = (prRating + clRating) / 2;
  return avg <= 2.5 ? "F" : avg <= 5 ? "PF" : "NF";
}

/** The column whose name ends with a given suffix. */
function col(row, suffix) {
  const k = Object.keys(row).find((c) => c.endsWith(suffix));
  if (!k) throw new Error(`OWID: no column ending ${suffix} in ${Object.keys(row).join(",")}`);
  return k;
}

// ── UNHCR ─────────────────────────────────────────────────────────────────

async function unhcr() {
  const j = JSON.parse(await get(`https://api.unhcr.org/population/v1/population/?yearFrom=2000&yearTo=${THIS_YEAR}&limit=100`, "unhcr.json"));
  const u = JSON.parse(await get(`https://api.unhcr.org/population/v1/unrwa/?yearFrom=2000&yearTo=${THIS_YEAR}&limit=100`, "unrwa.json"));
  const unrwa = new Map((u.items || []).map((r) => [Number(r.year), Number(r.total) || 0]));
  const rows = (j.items || [])
    .map((r) => {
      const n = (k) => Number(r[k]) || 0;
      return {
        year: Number(r.year),
        refugees: n("refugees"),
        asylumSeekers: n("asylum_seekers"),
        idps: n("idps"),
        oip: n("oip"),
        unrwa: unrwa.get(Number(r.year)) ?? 0,
        stateless: n("stateless"),
      };
    })
    .filter((r) => r.year >= 2000)
    .sort((a, b) => a.year - b.year);
  if (rows.length < 5) throw new Error("UNHCR: too few years");
  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const round = (v, dp) => Number(v.toFixed(dp));
const pts = (series, dp) => series.map(([y, v]) => [y, round(v, dp)]);

function indicator(id, o) {
  return { id, ...o };
}

(async () => {
  const W = {};
  const add = (id, o) => (W[id] = indicator(id, o));

  // Population.
  add("population", { label: "World population", unit: "people", format: "count", dp: 0, upIsGood: null, series: pts(await wbSeries("SP.POP.TOTL"), 0), source: WB("SP.POP.TOTL") });
  add("popGrowth", { label: "Population growth", unit: "% a year", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("SP.POP.GROW"), 2), source: WB("SP.POP.GROW") });
  add("fertility", { label: "Births per woman", unit: "births", format: "num", dp: 2, upIsGood: null, series: pts(await wbSeries("SP.DYN.TFRT.IN"), 2), source: WB("SP.DYN.TFRT.IN") });
  add("urban", { label: "Living in cities", unit: "% of people", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("SP.URB.TOTL.IN.ZS"), 1), source: WB("SP.URB.TOTL.IN.ZS") });

  // Peace and conflict. UCDP's state-based conflicts are within a state
  // (civil, including those other states join), between states, and
  // extrasystemic (a state against a group outside its territory).
  {
    const rows = (await owidWorld("number-of-armed-conflicts")).filter((r) => r.year >= FROM);
    const k = {
      intra: col(rows[0], "conflict_type_intrastate"),
      inter: col(rows[0], "conflict_type_interstate"),
      extra: col(rows[0], "conflict_type_extrasystemic"),
      nonState: col(rows[0], "conflict_type_non_state_conflict"),
      oneSided: col(rows[0], "conflict_type_one_sided_violence"),
    };
    const state = (r) => Number(r[k.intra]) + Number(r[k.inter]) + Number(r[k.extra]);
    const last = rows.at(-1);
    add("conflicts", {
      label: "State-based armed conflicts", unit: "conflicts", format: "num", dp: 0, upIsGood: false,
      series: rows.map((r) => [r.year, state(r)]).filter(([, v]) => Number.isFinite(v)),
      source: SRC.ucdp,
      note: "Conflicts in which at least one side is a government and at least 25 people die in battle in the year.",
      breakdownYear: last.year,
      breakdown: [
        ["Within a state (civil)", Number(last[k.intra])],
        ["Between states", Number(last[k.inter])],
        ["Also: fighting between non-state groups", Number(last[k.nonState])],
        ["Also: campaigns of violence against civilians", Number(last[k.oneSided])],
      ],
    });
  }
  {
    const rows = (await owidWorld("deaths-in-armed-conflicts-by-type")).filter((r) => r.year >= FROM);
    const k = {
      intra: col(rows[0], "conflict_type_intrastate"),
      inter: col(rows[0], "conflict_type_interstate"),
      extra: col(rows[0], "conflict_type_extrasystemic"),
      nonState: col(rows[0], "conflict_type_non_state_conflict"),
      oneSided: col(rows[0], "conflict_type_one_sided_violence"),
    };
    const n = (r, c) => Number(r[c]) || 0;
    const total = (r) => n(r, k.intra) + n(r, k.inter) + n(r, k.extra) + n(r, k.nonState) + n(r, k.oneSided);
    const last = rows.at(-1);
    add("conflictDeaths", {
      label: "Deaths in armed conflicts", unit: "deaths", format: "count", dp: 0, upIsGood: false,
      series: rows.map((r) => [r.year, total(r)]).filter(([, v]) => Number.isFinite(v) && v > 0),
      source: SRC.ucdpDeaths,
      note: "UCDP's best estimate of deaths in fighting involving states, fighting between non-state groups, and violence against civilians.",
      breakdownYear: last.year,
      breakdown: [
        ["In wars between states", n(last, k.inter)],
        ["In civil conflicts", n(last, k.intra) + n(last, k.extra)],
        ["In violence against civilians", n(last, k.oneSided)],
        ["In fighting between non-state groups", n(last, k.nonState)],
      ],
    });
  }
  {
    const rows = (await unhcr());
    const total = (r) => r.refugees + r.asylumSeekers + r.idps + r.oip + r.unrwa;
    const last = rows.at(-1);
    add("displaced", {
      label: "People forcibly displaced", unit: "people", format: "count", dp: 0, upIsGood: false,
      series: rows.map((r) => [r.year, total(r)]),
      source: SRC.unhcr,
      note: "UNHCR's count: refugees and others in need of international protection, asylum-seekers, internally displaced people, and Palestine refugees under UNRWA's mandate.",
      breakdownYear: last.year,
      breakdown: [
        ["Internally displaced", last.idps],
        ["Refugees (UNHCR mandate)", last.refugees],
        ["Asylum-seekers", last.asylumSeekers],
        ["Others in need of international protection", last.oip],
        ["Palestine refugees (UNRWA)", last.unrwa],
      ],
    });
  }
  add("militaryGdp", { label: "Military spending", unit: "% of world GDP", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("MS.MIL.XPND.GD.ZS"), 2), source: WB("MS.MIL.XPND.GD.ZS") });
  add("militaryUsd", { label: "Military spending", unit: "US$", format: "usd", dp: 0, upIsGood: null, series: pts(await wbSeries("MS.MIL.XPND.CD"), 0), source: WB("MS.MIL.XPND.CD") });
  add("homicide", { label: "Intentional homicides", unit: "per 100,000 people", format: "num", dp: 1, upIsGood: false, series: pts(await wbSeries("VC.IHR.PSRC.P5"), 1), source: WB("VC.IHR.PSRC.P5") });

  // Geopolitics: regimes.
  {
    const rows = (await owidWorld("people-living-in-democracies-autocracies")).filter((r) => r.year >= FROM);
    const k = {
      closed: col(rows[0], "category_closed_autocracy"),
      electoralAut: col(rows[0], "category_electoral_autocracy"),
      electoralDem: col(rows[0], "category_electoral_democracy"),
      liberal: col(rows[0], "category_liberal_democracy"),
    };
    const share = (r) => {
      const d = Number(r[k.electoralDem]) + Number(r[k.liberal]);
      const all = d + Number(r[k.closed]) + Number(r[k.electoralAut]);
      return (100 * d) / all;
    };
    const last = rows.at(-1);
    add("democracyShare", {
      label: "Living in a democracy", unit: "% of people", format: "pct", dp: 1, upIsGood: null,
      series: rows.map((r) => [r.year, round(share(r), 1)]),
      source: SRC.vdem,
      note: "Share of the world's people in countries V-Dem classes as electoral or liberal democracies; the rest live in electoral or closed autocracies. Countries V-Dem does not classify are left out of both.",
      breakdownYear: last.year,
      breakdown: [
        ["Liberal democracy", Number(last[k.liberal])],
        ["Electoral democracy", Number(last[k.electoralDem])],
        ["Electoral autocracy", Number(last[k.electoralAut])],
        ["Closed autocracy", Number(last[k.closed])],
      ],
    });
  }

  // Economy and debt.
  add("gdp", { label: "World GDP", unit: "US$", format: "usd", dp: 0, upIsGood: null, series: pts(await wbSeries("NY.GDP.MKTP.CD"), 0), source: WB("NY.GDP.MKTP.CD") });
  add("gdpGrowth", { label: "Real GDP growth", unit: "% a year", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("NY.GDP.MKTP.KD.ZG"), 2), source: WB("NY.GDP.MKTP.KD.ZG") });
  add("inflation", { label: "Inflation", unit: "% a year", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("FP.CPI.TOTL.ZG"), 2), source: WB("FP.CPI.TOTL.ZG") });
  add("unemployment", { label: "Unemployment", unit: "% of the labour force", format: "pct", dp: 2, upIsGood: false, series: pts(await wbSeries("SL.UEM.TOTL.ZS"), 2), source: WB("SL.UEM.TOTL.ZS"), note: "ILO modelled estimate." });
  add("govDebt", { label: "Government debt", unit: "% of world GDP", format: "pct", dp: 1, upIsGood: false, series: pts(await imfWorldDebt(), 1), source: SRC.imf, note: "General government gross debt. The latest year may be an IMF estimate; later years are projections and are not shown." });
  add("extDebt", { label: "External debt of developing countries", unit: "% of their GNI", format: "pct", dp: 1, upIsGood: false, series: pts(await wbSeries("DT.DOD.DECT.GN.ZS", "LMY"), 1), source: WB("DT.DOD.DECT.GN.ZS", "XO"), note: "Low- and middle-income countries' debt owed abroad, public and private." });
  add("extDebtUsd", { label: "External debt of developing countries", unit: "US$", format: "usd", dp: 0, upIsGood: false, series: pts(await wbSeries("DT.DOD.DECT.CD", "LMY"), 0), source: WB("DT.DOD.DECT.CD", "XO") });
  add("trade", { label: "Trade", unit: "% of world GDP", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("NE.TRD.GNFS.ZS"), 1), source: WB("NE.TRD.GNFS.ZS") });

  // Climate (the atmosphere itself is in climateIndicators.ts).
  add("co2", { label: "CO₂ emissions", unit: "Mt CO₂ a year", format: "num", dp: 0, upIsGood: false, series: pts(await wbSeries("EN.GHG.CO2.MT.CE.AR5"), 0), source: WB("EN.GHG.CO2.MT.CE.AR5"), note: "Excluding land use, land-use change and forestry." });
  add("ghg", { label: "All greenhouse gas emissions", unit: "Mt CO₂e a year", format: "num", dp: 0, upIsGood: false, series: pts(await wbSeries("EN.GHG.ALL.MT.CE.AR5"), 0), source: WB("EN.GHG.ALL.MT.CE.AR5"), note: "Excluding land use, land-use change and forestry." });
  add("renewables", { label: "Renewable energy", unit: "% of final energy use", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("EG.FEC.RNEW.ZS"), 1), source: WB("EG.FEC.RNEW.ZS") });
  add("forest", { label: "Forest cover", unit: "% of land", format: "pct", dp: 2, upIsGood: true, series: pts(await wbSeries("AG.LND.FRST.ZS"), 2), source: WB("AG.LND.FRST.ZS") });

  // Development and equality.
  add("lifeExpectancy", { label: "Life expectancy", unit: "years", format: "num", dp: 1, upIsGood: true, series: pts(await wbSeries("SP.DYN.LE00.IN"), 1), source: WB("SP.DYN.LE00.IN") });
  add("childMortality", { label: "Deaths before age 5", unit: "per 1,000 births", format: "num", dp: 1, upIsGood: false, series: pts(await wbSeries("SH.DYN.MORT"), 1), source: WB("SH.DYN.MORT") });
  add("extremePoverty", { label: "In extreme poverty", unit: "% of people", format: "pct", dp: 1, upIsGood: false, series: pts(await wbSeries("SI.POV.DDAY"), 1), source: WB("SI.POV.DDAY"), note: "Living on less than $3.00 a day (2021 purchasing power)." });
  add("poverty830", { label: "Below $8.30 a day", unit: "% of people", format: "pct", dp: 1, upIsGood: false, series: pts(await wbSeries("SI.POV.UMIC"), 1), source: WB("SI.POV.UMIC"), note: "The World Bank's poverty line for upper-middle-income countries (2021 purchasing power)." });
  add("literacy", { label: "Adults who can read", unit: "% of people 15+", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SE.ADT.LITR.ZS"), 1), source: WB("SE.ADT.LITR.ZS") });
  add("primaryCompletion", { label: "Finishing primary school", unit: "% of the age group", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SE.PRM.CMPT.ZS"), 1), source: WB("SE.PRM.CMPT.ZS") });
  add("womenParliament", { label: "Parliament seats held by women", unit: "%", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SG.GEN.PARL.ZS"), 1), source: WB("SG.GEN.PARL.ZS") });
  {
    const f = new Map(await wbSeries("SL.TLF.CACT.FE.ZS"));
    const m = await wbSeries("SL.TLF.CACT.MA.ZS");
    add("workGap", {
      label: "Gender gap in paid work", unit: "points", format: "num", dp: 1, upIsGood: false,
      series: m.filter(([y]) => f.has(y)).map(([y, v]) => [y, round(v - f.get(y), 1)]),
      source: WB("SL.TLF.CACT.FE.ZS"),
      note: "Men's labour force participation minus women's, in percentage points (ILO modelled estimates).",
      breakdownYear: m.at(-1)[0],
      breakdown: [
        ["Men in the labour force", round(m.at(-1)[1], 1)],
        ["Women in the labour force", round(f.get(m.at(-1)[0]), 1)],
      ],
      breakdownUnit: "%",
    });
  }
  add("electricity", { label: "Have electricity", unit: "% of people", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("EG.ELC.ACCS.ZS"), 1), source: WB("EG.ELC.ACCS.ZS") });
  add("water", { label: "Safely managed drinking water", unit: "% of people", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SH.H2O.SMDW.ZS"), 1), source: WB("SH.H2O.SMDW.ZS") });

  // Food security.
  add("undernourished", { label: "Undernourished", unit: "% of people", format: "pct", dp: 1, upIsGood: false, series: pts(await wbSeries("SN.ITK.DEFC.ZS"), 1), source: WB("SN.ITK.DEFC.ZS"), note: "FAO: people whose habitual food intake is too little for a normal, active, healthy life." });
  add("foodInsecure", { label: "Moderately or severely food insecure", unit: "% of people", format: "pct", dp: 1, upIsGood: false, series: pts(await wbSeries("SN.ITK.MSFI.ZS"), 1), source: WB("SN.ITK.MSFI.ZS"), note: "FAO: people who had to reduce the quality or quantity of food, or went without, during the year." });

  // Advancement.
  add("internet", { label: "Use the internet", unit: "% of people", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("IT.NET.USER.ZS"), 1), source: WB("IT.NET.USER.ZS") });
  add("mobile", { label: "Mobile subscriptions", unit: "per 100 people", format: "num", dp: 1, upIsGood: null, series: pts(await wbSeries("IT.CEL.SETS.P2"), 1), source: WB("IT.CEL.SETS.P2") });
  add("research", { label: "Research and development", unit: "% of world GDP", format: "pct", dp: 2, upIsGood: true, series: pts(await wbSeries("GB.XPD.RSDV.GD.ZS"), 2), source: WB("GB.XPD.RSDV.GD.ZS") });
  add("patents", { label: "Patent applications", unit: "a year, by residents", format: "count", dp: 0, upIsGood: null, series: pts(await wbSeries("IP.PAT.RESD"), 0), source: WB("IP.PAT.RESD") });

  // Technology: connection, research and invention, and the trade in both.
  add("broadband", { label: "Fixed broadband", unit: "subscriptions per 100 people", format: "num", dp: 1, upIsGood: true, series: pts(await wbSeries("IT.NET.BBND.P2"), 1), source: WB("IT.NET.BBND.P2"), note: "ITU: fixed connections to the internet at 256 kbit/s or faster - cable, DSL, fibre, satellite and fixed wireless. Mobile data is not counted." });
  add("secureServers", { label: "Secure internet servers", unit: "per million people", format: "num", dp: 0, upIsGood: null, series: pts(await wbSeries("IT.NET.SECR.P6"), 0), source: WB("IT.NET.SECR.P6"), note: "Netcraft's Secure Server Survey: distinct, publicly trusted TLS/SSL certificates, by the country that hosts them." });
  add("researchers", { label: "Researchers", unit: "per million people", format: "num", dp: 0, upIsGood: true, series: pts(await wbSeries("SP.POP.SCIE.RD.P6"), 0), source: WB("SP.POP.SCIE.RD.P6"), note: "UNESCO Institute for Statistics: people working in basic research, applied research and experimental development. The world figure is published only every few years." });
  add("sciArticles", { label: "Scientific articles", unit: "published in the year", format: "count", dp: 0, upIsGood: null, series: pts(await wbSeries("IP.JRN.ARTC.SC"), 0), source: WB("IP.JRN.ARTC.SC"), note: "US National Science Foundation, from Scopus: peer-reviewed journal articles and selected conference papers in science and engineering." });
  add("highTechExports", { label: "High-tech exports", unit: "% of manufactured exports", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("TX.VAL.TECH.MF.ZS"), 1), source: WB("TX.VAL.TECH.MF.ZS"), note: "UN Comtrade: products with high research and development intensity, such as aircraft, computers, medicines, scientific instruments and electrical machinery." });
  add("ipReceipts", { label: "Paid for intellectual property", unit: "US$ a year", format: "usd", dp: 0, upIsGood: null, series: pts(await wbSeries("BX.GSR.ROYL.CD"), 0), source: WB("BX.GSR.ROYL.CD"), note: "IMF balance of payments: what countries receive from abroad for the use of patents, trademarks, copyrights, designs and franchises, and for licences to copy or distribute software, films and recordings." });

  // Security: armed forces, the arms trade and nuclear weapons.
  add("armedForces", { label: "Armed forces", unit: "active personnel", format: "count", dp: 0, upIsGood: null, series: pts(await wbSeries("MS.MIL.TOTL.P1"), 0), source: WB("MS.MIL.TOTL.P1"), note: "IISS, The Military Balance: active-duty personnel, including paramilitary forces trained, equipped and controlled so that they could support or replace the regular military." });
  add("armedForcesShare", { label: "Armed forces", unit: "% of the labour force", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("MS.MIL.TOTL.TF.ZS"), 2), source: WB("MS.MIL.TOTL.TF.ZS") });
  add("armsTransfers", { label: "Arms transfers", unit: "SIPRI trend-indicator value", format: "count", dp: 0, upIsGood: null, series: pts(await wbSeries("MS.MIL.XPRT.KD"), 0), source: WB("MS.MIL.XPRT.KD"), note: "SIPRI: the volume of major conventional weapons - aircraft, armoured vehicles, artillery, radar, missiles and ships - sold, given or built under licence across borders, counted by exporters. A trend-indicator value stands for the military resources transferred, not the price paid." });
  add("nuclearWarheads", { label: "Nuclear warheads", unit: "warheads", format: "count", dp: 0, upIsGood: null, series: await owidWorldSeries("nuclear-warhead-stockpiles", "number_of_warheads"), source: SRC.fas, note: "The Federation of American Scientists' estimate from public information: warheads in the nuclear powers' stockpiles, and retired ones awaiting dismantlement. The exact numbers are secret." });

  // Institutions: the law, the checks on power, and what states raise.
  const vdemWorld = async (slug) => pts(await owidWorldSeries(slug, "estimate_best", "World (population-weighted)"), 2);
  add("electoralDemocracy", { label: "Electoral democracy", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("electoral-democracy-index"), source: SRC.vdemElect, note: "V-Dem's index of how far leaders are chosen in free and fair elections with universal suffrage, and people can organise and speak freely, averaged across the world's people (population-weighted). 1 is most democratic." });
  add("ruleOfLaw", { label: "Rule of law", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("rule-of-law-index"), source: SRC.vdemLaw, note: "V-Dem's index of how far government complies with the law, the courts are independent, laws are clear, justice is accessible, corruption is absent and officials are impartial, averaged across the world's people (population-weighted). 1 is the strongest rule of law." });
  add("judicialConstraints", { label: "Courts' check on the executive", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("judicial-constraints-on-the-executive-index"), source: SRC.vdemJudicial, note: "V-Dem's index of how far the executive respects the constitution and obeys the courts, and the courts are independent, averaged across the world's people (population-weighted). 1 is the strongest check." });
  add("legislativeConstraints", { label: "Legislature's check on the executive", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("legislative-constraints-on-the-executive-index"), source: SRC.vdemLegis, note: "V-Dem's index of how far the legislature, the opposition included, questions, oversees and investigates the executive, averaged across the world's people (population-weighted). 1 is the strongest check." });
  add("taxRevenue", { label: "Tax revenue", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("GC.TAX.TOTL.GD.ZS"), 1), source: WB("GC.TAX.TOTL.GD.ZS"), note: "IMF Government Finance Statistics: compulsory payments to government, in cash or in kind." });
  add("govRevenue", { label: "Government revenue", unit: "% of GDP, excluding grants", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("GC.REV.XGRT.GD.ZS"), 1), source: WB("GC.REV.XGRT.GD.ZS"), note: "IMF Government Finance Statistics: taxes, social contributions and other revenue, not counting grants." });

  // Ideas and belief: freedom of thought, political division, religion.
  add("academicFreedom", { label: "Academic freedom", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("academic-freedom-index"), source: SRC.vdemAcademic, note: "V-Dem's index of how freely academics can research, teach, publish and speak, and how far universities govern themselves, averaged across the world's people (population-weighted). 1 is most free." });
  {
    // V-Dem's polarization is on its model's open scale, not 0 to 1, so the
    // note gives the range countries span in the latest year to read it by.
    const rows = await owidCsv("political-polarization-score");
    const k = col(rows[0], "estimate_best");
    const series = rows
      .filter((r) => r.entity === "World (population-weighted)" && Number(r.year) >= FROM && r[k] !== "")
      .map((r) => [Number(r.year), round(Number(r[k]), 2)])
      .sort((a, b) => a[0] - b[0]);
    const lastYear = series.at(-1)[0];
    const countries = rows
      .filter((r) => /^[A-Z]{3}$/.test(r.code) && Number(r.year) === lastYear && r[k] !== "")
      .map((r) => [r.entity, Number(r[k])])
      .sort((a, b) => a[1] - b[1]);
    if (series.length < 5 || countries.length < 100) throw new Error("V-Dem polarization: too little data");
    const [lo, hi] = [countries[0], countries.at(-1)];
    add("polarization", {
      label: "Political polarization", unit: "V-Dem score, higher is more divided", format: "num", dp: 2, upIsGood: null, series, source: SRC.vdemPolar,
      note: `V-Dem's experts' estimate of how far society is split into hostile political camps, averaged across the world's people (population-weighted). It is on V-Dem's own scale rather than 0 to 1: in ${lastYear} countries ran from ${lo[1].toFixed(1)} (${lo[0]}) to ${hi[1].toFixed(1)} (${hi[0]}).`,
    });
  }
  for (const [id, label, series, stated] of PEW) {
    add(id, { label, unit: "% of people", format: "pct", dp: 1, upIsGood: null, series, source: SRC.pew, note: PEW_NOTE, ...(stated ? { stated } : {}) });
  }

  // Civic: rights, justice and freedom, as V-Dem's experts rate them.
  add("physicalIntegrity", { label: "Freedom from torture and political killing", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("physical-integrity-rights-index-vdem"), source: SRC.vdemPhys, note: "V-Dem's physical violence index: how far people are free from torture and political killings by the government, averaged across the world's people (population-weighted). 1 is most free." });
  add("womenCivilLiberties", { label: "Women's civil liberties", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("women-civil-liberties-index"), source: SRC.vdemWomenCiv, note: "V-Dem's index of how far women are free from forced labour, have property rights and access to the courts, and can move freely, averaged across the world's people (population-weighted). 1 is most free." });
  add("equalityBeforeLaw", { label: "Equality before the law", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("individual-liberties-and-equality-before-the-law-index"), source: SRC.vdemEquality, note: "V-Dem's index of equality before the law and individual liberty: freedom from torture and political killing, freedom of religion and movement, freedom from forced labour, access to justice, transparent laws and impartial administration, averaged across the world's people (population-weighted). 1 is the strongest." });
  add("privateLiberties", { label: "Private liberties", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("private-civil-liberties-index"), source: SRC.vdemPrivate, note: "V-Dem's index of freedom from forced labour, property rights, and freedom of movement and religion, averaged across the world's people (population-weighted). 1 is most free." });
  add("freeAssociation", { label: "Freedom of association", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("freedom-of-association-index"), source: SRC.vdemAssoc, note: "V-Dem's index of how far parties, the opposition included, can form and take part in elections, and civil society groups can form and operate freely, averaged across the world's people (population-weighted). 1 is most free." });
  add("womenEmpowerment", { label: "Women's political empowerment", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("women-political-empowerment-index"), source: SRC.vdemWomenEmp, note: "V-Dem's index of how far women enjoy civil liberties, take part in civil society and are represented in politics, averaged across the world's people (population-weighted). 1 is the most empowered." });

  // Development: human development, the shift of work and output from the
  // land, and the energy people use.
  add("hdi", { label: "Human Development Index", unit: "index, 0 to 1", format: "num", dp: 3, upIsGood: true, series: pts(await owidWorldSeries("human-development-index", "hdi__sex_total"), 3), source: SRC.hdi, note: "UNDP's summary of a long and healthy life, a good education and a decent standard of living, for the world as a whole." });
  add("gdpPerCapitaPpp", { label: "Output per person", unit: "2021 international $, at purchasing power", format: "usd", dp: 0, upIsGood: true, series: pts(await wbSeries("NY.GDP.PCAP.PP.KD"), 0), source: WB("NY.GDP.PCAP.PP.KD"), note: "GDP per person in constant 2021 international dollars, converted at purchasing power parities, which allow for different price levels across countries (World Bank International Comparison Program)." });
  add("agEmployment", { label: "Working in farming", unit: "% of employment", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("SL.AGR.EMPL.ZS"), 1), source: WB("SL.AGR.EMPL.ZS"), note: "ILO modelled estimate: agriculture, hunting, forestry and fishing." });
  add("industryEmployment", { label: "Working in industry", unit: "% of employment", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("SL.IND.EMPL.ZS"), 1), source: WB("SL.IND.EMPL.ZS"), note: "ILO modelled estimate: mining and quarrying, manufacturing, construction and public utilities." });
  add("servicesEmployment", { label: "Working in services", unit: "% of employment", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("SL.SRV.EMPL.ZS"), 1), source: WB("SL.SRV.EMPL.ZS"), note: "ILO modelled estimate: trade, restaurants and hotels, transport and communications, finance, real estate and business services, and community, social and personal services." });
  add("wageWorkers", { label: "Paid a wage or salary", unit: "% of employment", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("SL.EMP.WORK.ZS"), 1), source: WB("SL.EMP.WORK.ZS"), note: "ILO modelled estimate: employees, whose basic pay does not depend directly on the revenue of the business they work for." });
  add("agricultureVA", { label: "Farming's share of output", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("NV.AGR.TOTL.ZS"), 1), source: WB("NV.AGR.TOTL.ZS"), note: "Value added by agriculture, forestry and fishing." });
  add("manufacturingVA", { label: "Manufacturing's share of output", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("NV.IND.MANF.ZS"), 1), source: WB("NV.IND.MANF.ZS"), note: "Value added by manufacturing: turning materials or components into new products." });
  add("servicesVA", { label: "Services' share of output", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, series: pts(await wbSeries("NV.SRV.TOTL.ZS"), 1), source: WB("NV.SRV.TOTL.ZS"), note: "Value added by services: trade, hotels and restaurants, transport and communication, finance, real estate, business services, public administration, education, health and other services." });
  add("cleanCooking", { label: "Cooking with clean fuels", unit: "% of people", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("EG.CFT.ACCS.ZS"), 1), source: WB("EG.CFT.ACCS.ZS"), note: "Tracking SDG 7: people who mainly cook with clean fuels and technologies; under WHO guidelines kerosene does not count as clean." });
  add("energyPerPerson", { label: "Energy use", unit: "kg of oil equivalent per person", format: "num", dp: 0, upIsGood: null, series: pts(await wbSeries("EG.USE.PCAP.KG.OE"), 0), source: WB("EG.USE.PCAP.KG.OE"), note: "IEA: primary energy - what is produced, plus imports and stock changes, minus exports and fuel for international shipping and aviation." });
  add("electricityPerPerson", { label: "Electricity use", unit: "kWh per person", format: "num", dp: 0, upIsGood: null, series: pts(await wbSeries("EG.USE.ELEC.KH.PC"), 0), source: WB("EG.USE.ELEC.KH.PC"), note: "IEA: what power plants produce, less the losses in transmission, distribution and transformation and the plants' own use." });

  // The fuller picture: more of what each pillar covers, where a body
  // publishes the world figure.
  const wb = async (id, code, o) => add(id, { ...o, series: pts(await wbSeries(code), o.dp), source: WB(code) });
  // Society: age, health, hygiene.
  await wb("aged65", "SP.POP.65UP.TO.ZS", { label: "Aged 65 and over", unit: "% of people", format: "pct", dp: 1, upIsGood: null, note: "UN World Population Prospects." });
  await wb("under15", "SP.POP.0014.TO.ZS", { label: "Aged under 15", unit: "% of people", format: "pct", dp: 1, upIsGood: null, note: "UN World Population Prospects." });
  await wb("maternalMortality", "SH.STA.MMRT", { label: "Maternal deaths", unit: "per 100,000 live births", format: "num", dp: 0, upIsGood: false, note: "WHO modelled estimate: women who die from pregnancy-related causes while pregnant or within 42 days of the pregnancy's end." });
  await wb("measles", "SH.IMM.MEAS", { label: "Vaccinated against measles", unit: "% of children aged 1", format: "pct", dp: 1, upIsGood: true, note: "WHO and UNICEF: children aged 12-23 months who had a measles vaccination before their first birthday or before the survey." });
  await wb("stunting", "SH.STA.STNT.ME.ZS", { label: "Stunted children", unit: "% of children under 5", format: "pct", dp: 1, upIsGood: false, note: "UNICEF, WHO and World Bank joint estimates: children under five whose height for their age is more than two standard deviations below the international reference." });
  await wb("healthSpend", "SH.XPD.CHEX.GD.ZS", { label: "Health spending", unit: "% of GDP", format: "pct", dp: 2, upIsGood: null, note: "WHO Global Health Expenditure Database: the health goods and services consumed in the year, not buildings or equipment." });
  await wb("hiv", "SH.DYN.AIDS.ZS", { label: "Living with HIV", unit: "% of people aged 15-49", format: "pct", dp: 1, upIsGood: false, note: "UNAIDS estimates." });
  await wb("suicide", "SH.STA.SUIC.P5", { label: "Suicides", unit: "per 100,000 people", format: "num", dp: 1, upIsGood: false, note: "WHO: suicide deaths in the year, not adjusted for age." });
  await wb("roadDeaths", "SH.STA.TRAF.P5", { label: "Road deaths", unit: "per 100,000 people", format: "num", dp: 1, upIsGood: false, note: "WHO estimate of deaths from road traffic injuries; the world figure was last published for 2019." });
  await wb("handwashing", "SH.STA.HYGN.ZS", { label: "Can wash hands with soap", unit: "% of people", format: "pct", dp: 1, upIsGood: true, note: "WHO/UNICEF: people whose home has a handwashing facility with soap and water." });
  // Economy: work, investment, money flows, poverty.
  await wb("youthUnemployment", "SL.UEM.1524.ZS", { label: "Youth unemployment", unit: "% of the labour force aged 15-24", format: "pct", dp: 1, upIsGood: false, note: "ILO modelled estimate: young people without work who are available for it and looking." });
  await wb("labourForce", "SL.TLF.CACT.ZS", { label: "In the labour force", unit: "% of people aged 15+", format: "pct", dp: 1, upIsGood: null, note: "ILO modelled estimate: people working or looking for work." });
  await wb("investment", "NE.GDI.TOTL.ZS", { label: "Investment", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, note: "Gross capital formation: what is spent on buildings, machinery, infrastructure and other lasting assets, and on stocks." });
  await wb("savings", "NY.GNS.ICTR.ZS", { label: "Savings", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, note: "Gross savings: national income less consumption, plus net transfers." });
  await wb("remittances", "BX.TRF.PWKR.CD.DT", { label: "Remittances", unit: "US$ received a year", format: "usd", dp: 0, upIsGood: null, note: "IMF balance of payments: money people working abroad send home, and the pay of people working across a border." });
  await wb("poverty420", "SI.POV.LMIC", { label: "Below $4.20 a day", unit: "% of people", format: "pct", dp: 1, upIsGood: false, note: "The World Bank's poverty line for lower-middle-income countries (2021 purchasing power)." });
  await wb("marketCap", "CM.MKT.LCAP.GD.ZS", { label: "Stock market value", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, note: "World Federation of Exchanges: listed domestic companies' shares times their price, at the end of the year." });
  // Development: money and mobility, and the kind of work.
  await wb("accounts", "FX.OWN.TOTL.ZS", { label: "Have a bank or mobile-money account", unit: "% of people aged 15+", format: "pct", dp: 1, upIsGood: true, note: "World Bank Global Findex: surveyed every few years." });
  await wb("vulnerableWork", "SL.EMP.VULN.ZS", { label: "In vulnerable work", unit: "% of employment", format: "pct", dp: 1, upIsGood: false, note: "ILO modelled estimate: people working for themselves without employees, or unpaid in a family business - work the ILO counts as vulnerable." });
  await wb("airPassengers", "IS.AIR.PSGR", { label: "Air passengers", unit: "carried a year", format: "count", dp: 0, upIsGood: null, note: "ICAO: passengers carried by the world's airlines, domestic and international." });
  // Technology: the trade in digital goods and services, and the landline.
  await wb("ictServiceExports", "BX.GSR.CCIS.ZS", { label: "Digital service exports", unit: "% of service exports", format: "pct", dp: 1, upIsGood: null, note: "IMF balance of payments: computer, telecommunications and information services." });
  await wb("ictGoodsExports", "TX.VAL.ICTG.ZS.UN", { label: "Digital goods exports", unit: "% of goods exports", format: "pct", dp: 1, upIsGood: null, note: "UNCTAD: computers, communication and consumer electronics, electronic components and other information technology goods." });
  await wb("landlines", "IT.MLT.MAIN.P2", { label: "Landline subscriptions", unit: "per 100 people", format: "num", dp: 1, upIsGood: null, note: "ITU: fixed telephone lines." });
  // Institutions and security: what governments spend, and the share on arms.
  await wb("govExpense", "GC.XPN.TOTL.GD.ZS", { label: "Government spending", unit: "% of GDP", format: "pct", dp: 1, upIsGood: null, note: "IMF Government Finance Statistics: government expense, not counting the purchase of lasting assets." });
  await wb("militaryShare", "MS.MIL.XPND.ZS", { label: "Military share of government spending", unit: "% of government spending", format: "pct", dp: 2, upIsGood: null, note: "SIPRI Military Expenditure Database." });
  // Ecology: emissions per person and methane, protection, air, water, land, disasters.
  await wb("methane", "EN.GHG.CH4.MT.CE.AR5", { label: "Methane emissions", unit: "Mt CO₂e a year", format: "num", dp: 0, upIsGood: false, note: "EDGAR (European Commission): methane from farming, energy, waste and industry, in CO₂ equivalents (IPCC AR5), excluding land use, land-use change and forestry." });
  await wb("co2PerPerson", "EN.GHG.CO2.PC.CE.AR5", { label: "CO₂ per person", unit: "tonnes a year", format: "num", dp: 2, upIsGood: false, note: "Excluding land use, land-use change and forestry." });
  await wb("protectedLand", "ER.LND.PTLD.ZS", { label: "Protected land", unit: "% of land", format: "pct", dp: 1, upIsGood: true, note: "UNEP-WCMC Protected Planet: land in protected areas and other effective area-based conservation." });
  await wb("protectedSea", "ER.MRN.PTMR.ZS", { label: "Protected waters", unit: "% of territorial waters", format: "pct", dp: 1, upIsGood: true, note: "UNEP-WCMC Protected Planet: marine areas reserved by law or other effective means." });
  await wb("pm25", "EN.ATM.PM25.MC.M3", { label: "Fine-particle air pollution", unit: "µg/m³, average exposure", format: "num", dp: 1, upIsGood: false, note: "Global Burden of Disease: the PM2.5 concentration the average person breathes over the year." });
  await wb("waterWithdrawals", "ER.H2O.FWTL.ZS", { label: "Freshwater withdrawn", unit: "% of internal resources", format: "pct", dp: 1, upIsGood: null, note: "FAO AQUASTAT: water taken from rivers, lakes and aquifers, including desalinated water where it matters, against the renewable water that arises within countries." });
  await wb("renewableElectricity", "EG.ELC.RNEW.ZS", { label: "Renewable electricity", unit: "% of electricity generated", format: "pct", dp: 1, upIsGood: true, note: "IEA: electricity from renewable power plants." });
  await wb("farmland", "AG.LND.AGRI.ZS", { label: "Farmland", unit: "% of land", format: "pct", dp: 1, upIsGood: null, note: "FAO: land that is arable, under permanent crops, or permanent pasture." });
  await wb("disasterDisplacement", "VC.IDP.NWDS", { label: "Displaced by disasters", unit: "new displacements a year", format: "count", dp: 0, upIsGood: null, note: "Internal Displacement Monitoring Centre: people forced from their homes by disasters within their own country, counted each time they are displaced." });
  {
    // Disaster deaths swing with single great events, so no better or worse
    // is drawn; the note says what the latest year records.
    const rows = (await owidWorld("number-of-deaths-from-natural-disasters")).filter((r) => r.year >= FROM);
    const k = (suffix) => col(rows[0], suffix);
    const total = k("total_dead_all_disasters_yearly");
    const types = [
      ["Earthquakes", "total_dead_earthquake_yearly"],
      ["Floods", "total_dead_flood_yearly"],
      ["Storms and other extreme weather", "total_dead_extreme_weather_yearly"],
      ["Extreme temperatures", "total_dead_extreme_temperature_yearly"],
      ["Landslides", "total_dead_landslide_yearly"],
      ["Droughts", "total_dead_drought_yearly"],
      ["Wildfires", "total_dead_wildfire_yearly"],
      ["Volcanoes", "total_dead_volcanic_activity_yearly"],
    ];
    const last = rows.at(-1);
    add("disasterDeaths", {
      label: "Deaths in natural disasters", unit: "dead and missing", format: "count", dp: 0, upIsGood: null,
      series: rows.filter((r) => r[total] !== "").map((r) => [r.year, Number(r[total])]),
      source: SRC.emdat,
      note: `EM-DAT counts confirmed deaths and missing people in disasters that overwhelm local capacity. The toll swings from year to year with single great events, so no better or worse is drawn. Its ${last.year} figures record ${(Number(last[k("total_dead_extreme_temperature_yearly")]) || 0).toLocaleString("en-US")} deaths from extreme temperatures.`,
      breakdownYear: last.year,
      breakdown: types.map(([label, suffix]) => [label, Number(last[k(suffix)]) || 0]),
    });
  }
  // Politics and civic life: V-Dem's other measures of democracy, political
  // liberties and civil society.
  add("liberalDemocracy", { label: "Liberal democracy", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("liberal-democracy-index"), source: SRC.vdemLiberal, note: "V-Dem's index of electoral democracy with the rule of law, checks on the executive and protected liberties, averaged across the world's people (population-weighted). 1 is most democratic." });
  add("participatoryDemocracy", { label: "Participatory democracy", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("participatory-democracy-index"), source: SRC.vdemParticip, note: "V-Dem's index of electoral democracy with citizens taking part beyond elections - in civil society, direct democracy and local government - averaged across the world's people (population-weighted). 1 is most democratic." });
  add("deliberativeDemocracy", { label: "Deliberative democracy", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("deliberative-democracy-index-vdem"), source: SRC.vdemDelib, note: "V-Dem's index of electoral democracy with decisions reached by reasoned public debate rather than by emotional appeals, bargaining or coercion, averaged across the world's people (population-weighted). 1 is most democratic." });
  add("egalitarianDemocracy", { label: "Egalitarian democracy", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("egalitarian-democracy-index-vdem"), source: SRC.vdemEgal, note: "V-Dem's index of electoral democracy with rights, freedoms and power spread equally across social groups, averaged across the world's people (population-weighted). 1 is most democratic." });
  add("politicalLiberties", { label: "Political liberties", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("political-civil-liberties-index"), source: SRC.vdemPolLib, note: "V-Dem's index of freedom of expression and of association, averaged across the world's people (population-weighted). 1 is most free." });
  add("civilSociety", { label: "Civil society participation", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null, series: await vdemWorld("civil-society-participation-index"), source: SRC.vdemCivSoc, note: "V-Dem's index of how far major civil society groups are consulted by policymakers and people take part in civil society, averaged across the world's people (population-weighted). 1 is the most participation." });

  // Sanitation, beside water and electricity.
  add("sanitation", { label: "Safely managed sanitation", unit: "% of people", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SH.STA.SMSS.ZS"), 1), source: WB("SH.STA.SMSS.ZS"), note: "WHO/UNICEF: a toilet or latrine not shared with other households, from which waste is safely disposed of on site or taken away and treated." });

  // Rights and liberties: V-Dem, weighted by population.
  add("civilLiberties", {
    label: "Civil liberties", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null,
    series: pts(await owidWorldSeries("human-rights-index-vdem", "estimate_best", "World (population-weighted)"), 2),
    source: SRC.vdemCivil,
    note: "V-Dem's civil liberties index - freedom from government violence, private liberties and political liberties - averaged across the world's people (population-weighted). 1 is most free.",
  });
  add("freeExpression", {
    label: "Freedom of expression", unit: "index, 0 to 1", format: "num", dp: 2, upIsGood: null,
    series: pts(await owidWorldSeries("freedom-of-expression-index", "estimate_best", "World (population-weighted)"), 2),
    source: SRC.vdemExpr,
    note: "V-Dem's index of free speech, a free press and alternative sources of information, averaged across the world's people (population-weighted). 1 is most free.",
  });

  // Terrorism: the Global Terrorism Database's public release ends in 2021.
  add("terrorAttacks", {
    label: "Terrorist attacks", unit: "attacks", format: "count", dp: 0, upIsGood: false,
    series: await owidWorldSeries("terrorist-attacks", "total_incident_counts"),
    source: SRC.gtd,
    note: "The Global Terrorism Database's public release ends in 2021, so this is its latest year.",
  });
  add("terrorDeaths", {
    label: "Deaths from terrorism", unit: "deaths", format: "count", dp: 0, upIsGood: false,
    series: await owidWorldSeries("fatalities-from-terrorism", "total_killed"),
    source: { ...SRC.gtd, url: "https://ourworldindata.org/grapher/fatalities-from-terrorism" },
    note: "Including perpetrators. The Global Terrorism Database's public release ends in 2021.",
  });

  // Education.
  add("schoolingYears", { label: "Years of schooling", unit: "average, adults 25+", format: "num", dp: 1, upIsGood: true, series: pts(await owidWorldSeries("average-years-of-schooling", "mys__sex_total"), 1), source: SRC.schooling });
  add("lowerSecondary", { label: "Finishing lower secondary school", unit: "% of the age group", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SE.SEC.CMPT.LO.ZS"), 1), source: WB("SE.SEC.CMPT.LO.ZS") });
  add("secondaryEnrol", { label: "Enrolled in secondary school", unit: "gross, % of the age group", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SE.SEC.ENRR"), 1), source: WB("SE.SEC.ENRR") });
  add("tertiaryEnrol", { label: "Enrolled in university or college", unit: "gross, % of the age group", format: "pct", dp: 1, upIsGood: true, series: pts(await wbSeries("SE.TER.ENRR"), 1), source: WB("SE.TER.ENRR") });
  add("eduSpend", { label: "Public spending on education", unit: "% of world GDP", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("SE.XPD.TOTL.GD.ZS"), 2), source: WB("SE.XPD.TOTL.GD.ZS") });

  // Cosmopolitanism: people and money across borders.
  add("migrantShare", { label: "International migrants", unit: "% of world population", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("SM.POP.TOTL.ZS"), 2), source: WB("SM.POP.TOTL.ZS"), note: "People living in a country other than the one they were born in (UN DESA estimates, every five years)." });
  add("migrants", { label: "International migrants", unit: "people", format: "count", dp: 0, upIsGood: null, series: pts(await wbSeries("SM.POP.TOTL"), 0), source: WB("SM.POP.TOTL") });
  add("fdi", { label: "Foreign direct investment", unit: "% of world GDP, net inflows", format: "pct", dp: 2, upIsGood: null, series: pts(await wbSeries("BX.KLT.DINV.WD.GD.ZS"), 2), source: WB("BX.KLT.DINV.WD.GD.ZS") });

  // Per-country figures for the rankings.
  const wbList = JSON.parse(await get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
  const iso2Of = Object.fromEntries(wbList.map((c) => [c.id, c.iso2Code]));
  // Codes the World Bank's list does not carry, as OWID writes them.
  Object.assign(iso2Of, { TWN: "TW", OWID_KOS: "XK", XKX: "XK" });
  delete iso2Of[""];

  const arrivals = await owidByCountryInYear("international-tourist-trips", "in_tour_arrivals_trips_total_overnight_vis_tourists", iso2Of, TOURISM_YEAR);
  const departuresRaw = await owidByCountryInYear("international-tourist-departures", "out_tour_departures_trips_total_overnight_vis_tourists", iso2Of, TOURISM_YEAR);
  const popAll = await wbAllCountries("SP.POP.TOTL", TOURISM_YEAR);
  const tripsAbroad = {};
  for (const [iso2, [y, trips]] of Object.entries(departuresRaw)) {
    const pop = popAll[iso2]?.[y];
    if (pop > 50000 && trips > 0) tripsAbroad[iso2] = [y, Number((trips / pop).toFixed(3))];
  }
  const migAll = await wbAllCountries("SM.POP.TOTL.ZS");
  const migrantShareBy = {};
  for (const [iso2, byYear] of Object.entries(migAll)) {
    const y = Math.max(...Object.keys(byYear).map(Number));
    migrantShareBy[iso2] = [y, Number(byYear[y].toFixed(1))];
  }
  const pr = await owidByCountry("political-rights-score-fh", "polrights_score", iso2Of);
  const cl = await owidByCountry("civil-liberties-score-fh", "civlibs_score", iso2Of);
  const freedom = {};
  for (const [iso2, [y, p]] of Object.entries(pr)) {
    const c = cl[iso2];
    if (!c || c[0] !== y) continue;
    freedom[iso2] = [y, p + c[1], p, c[1], freedomStatus(p, c[1])];
  }
  if (Object.keys(arrivals).length < 100 || Object.keys(tripsAbroad).length < 50 || Object.keys(freedom).length < 150)
    throw new Error("per-country figures: too few countries");

  // The population clock: the UN's medium projection for this year and the
  // next few, and births and deaths projected for this year.
  const wppPop = (await owidWorld("population-with-un-projections"))
    .map((r) => [r.year, Number(r[col(r, "variant_medium__projected")])])
    .filter(([y, v]) => y >= THIS_YEAR - 1 && y <= THIS_YEAR + 5 && Number.isFinite(v));
  const bd = (await owidWorld("births-and-deaths-projected-to-2100")).find((r) => r.year === THIS_YEAR);
  const births = Number(bd?.[col(bd, "births__sex_all__age_all__variant_medium__projected")]);
  const deaths = Number(bd?.[col(bd, "deaths__sex_all__age_all__variant_medium__projected")]);
  if (wppPop.length < 3 || !(births > 0) || !(deaths > 0)) throw new Error("WPP: projections missing");

  // Income groups: the Bank's own aggregates for each group, and the
  // current classification of every economy.
  const GROUPS = [
    ["HIC", "High income"],
    ["UMC", "Upper-middle income"],
    ["LMC", "Lower-middle income"],
    ["LIC", "Low income"],
  ];
  const countryList = JSON.parse(await get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
  const incomeOf = {};
  for (const c of countryList) if (GROUPS.some(([g]) => g === c.incomeLevel?.id)) incomeOf[c.iso2Code] = c.incomeLevel.id;
  const groupCount = Object.fromEntries(GROUPS.map(([g]) => [g, Object.values(incomeOf).filter((x) => x === g).length]));
  if (Object.values(groupCount).some((n) => n < 10)) throw new Error("income groups: a group has fewer than 10 economies");
  const COMPARE = [
    ["population", "People", "SP.POP.TOTL", "count", 0, null],
    ["gdp", "GDP", "NY.GDP.MKTP.CD", "usd", 0, null],
    ["gdpPerCapita", "GDP per person", "NY.GDP.PCAP.CD", "usd", 0, true],
    ["lifeExpectancy", "Life expectancy (years)", "SP.DYN.LE00.IN", "num", 1, true],
    ["childMortality", "Deaths before age 5, per 1,000 births", "SH.DYN.MORT", "num", 1, false],
    ["extremePoverty", "In extreme poverty (under $3 a day)", "SI.POV.DDAY", "pct", 1, false],
    ["undernourished", "Undernourished", "SN.ITK.DEFC.ZS", "pct", 1, false],
    ["water", "Safely managed drinking water", "SH.H2O.SMDW.ZS", "pct", 1, true],
    ["electricity", "Have electricity", "EG.ELC.ACCS.ZS", "pct", 1, true],
    ["internet", "Use the internet", "IT.NET.USER.ZS", "pct", 1, true],
    ["primaryCompletion", "Finish primary school", "SE.PRM.CMPT.ZS", "pct", 1, true],
    ["fertility", "Births per woman", "SP.DYN.TFRT.IN", "num", 2, null],
    ["co2PerPerson", "CO₂ per person (tonnes a year)", "EN.GHG.CO2.PC.CE.AR5", "num", 2, null],
  ];
  const byIncome = [];
  for (const [id, label, code, format, dp, upIsGood] of COMPARE) {
    const values = {};
    for (const area of ["WLD", ...GROUPS.map(([g]) => g)]) {
      const series = await wbSeries(code, area).catch(() => null);
      const last = series?.at(-1);
      // A group aggregate the Bank stopped computing years ago is not shown
      // beside current ones.
      values[area] = last && last[0] >= THIS_YEAR - 6 ? [last[0], Number(last[1].toFixed(format === "usd" || format === "count" ? 0 : dp))] : null;
    }
    byIncome.push({ id, label, format, dp, upIsGood, values, source: WB(code, "XD") });
  }

  const today = new Date().toISOString().slice(0, 10);
  const lines = Object.values(W).map((o) => `  ${JSON.stringify(o.id)}: ${JSON.stringify(o)},`);
  fs.writeFileSync(
    OUT,
    `/**
 * The world as a whole, in published figures, for the Worldview page.
 *
 * GENERATED by build-worldview.cjs on ${today} — do not edit by hand; change
 * the script and re-run it. The script lists every source.
 *
 * Each indicator is a world total or world share as its source publishes it,
 * with a series back to ${FROM} where the source reaches that far: the last
 * point is the latest year, and the trend line and ten-year comparison come
 * from the rest. Nothing is estimated, with one labelled exception: the
 * population clock, which moves along the UN's medium-variant projection.
 */
export const WORLDVIEW_RETRIEVED = "${today}";

export type WorldPoint = [year: number, value: number];

export interface WorldIndicator {
  id: string;
  label: string;
  unit: string;
  format: "pct" | "num" | "usd" | "count";
  /** Decimal places the source's precision supports. */
  dp: number;
  /** Whether a rise is an improvement, a deterioration, or neither. */
  upIsGood: boolean | null;
  series: WorldPoint[];
  source: { label: string; url: string };
  note?: string;
  /** The latest year split into its parts, where the source gives them. */
  breakdownYear?: number;
  breakdown?: [label: string, value: number][];
  breakdownUnit?: string;
  /** A change as the source states it in words, where it publishes no earlier figure to set beside the latest. */
  stated?: { text: string; dir: "up" | "down" | "flat" };
}

export const WORLD: Record<string, WorldIndicator> = {
${lines.join("\n")}
};

/** When Pew's religion figures, recorded in build-worldview.cjs, were last read from the report. */
export const PEW_CHECKED = "${PEW_CHECKED}";

/** The UN's projection of world population on 1 July each year, medium variant. */
export const POPULATION_PROJECTION = {
  source: ${JSON.stringify(SRC.wpp)},
  midYear: ${JSON.stringify(wppPop)} as WorldPoint[],
  year: ${THIS_YEAR},
  births: ${Math.round(births)},
  deaths: ${Math.round(deaths)},
};

export type IncomeGroup = "HIC" | "UMC" | "LMC" | "LIC";

/** The World Bank's four income groups, richest first, and how many economies each has now. */
export const INCOME_GROUPS: { id: IncomeGroup; label: string; economies: number }[] = ${JSON.stringify(
    GROUPS.map(([id, label]) => ({ id, label, economies: groupCount[id] })),
  )};

export const INCOME_SOURCE = {
  label: "World Bank — income classification and group aggregates",
  url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups",
};

/** Each economy's current income group, by ISO 3166 alpha-2 code. */
export const INCOME_OF: Record<string, IncomeGroup> = ${JSON.stringify(incomeOf)};

/** Per-country figures the rankings use, by ISO2: [year, value]. */
export const COUNTRY_FIGURES: {
  arrivals: Record<string, [year: number, value: number]>;
  tripsAbroad: Record<string, [year: number, value: number]>;
  migrantShare: Record<string, [year: number, value: number]>;
  /** [year, total 0-100, political rights 0-40, civil liberties 0-60, status] */
  freedom: Record<string, [year: number, total: number, pr: number, cl: number, status: "F" | "PF" | "NF"]>;
} = ${JSON.stringify({ arrivals, tripsAbroad, migrantShare: migrantShareBy, freedom })};

export const COUNTRY_FIGURE_SOURCES = ${JSON.stringify({
    arrivals: SRC.arrivals,
    tripsAbroad: SRC.departures,
    migrantShare: WB("SM.POP.TOTL.ZS", "1W"),
    freedom: SRC.fh,
  })};

/** The same measures for the world and each income group, from the Bank's own aggregates. */
export const BY_INCOME: {
  id: string;
  label: string;
  format: "pct" | "num" | "usd" | "count";
  dp: number;
  upIsGood: boolean | null;
  values: Record<"WLD" | IncomeGroup, [year: number, value: number] | null>;
  source: { label: string; url: string };
}[] = ${JSON.stringify(byIncome)};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(W).length} indicators`);
  for (const o of Object.values(W)) {
    const last = o.series.at(-1);
    console.log(`  ${o.id.padEnd(18)} ${String(last[1]).padStart(16)} (${last[0]})  ${o.series.length} pts`);
  }
  console.log(`  income groups: ${JSON.stringify(groupCount)}`);
  const tally = { F: 0, PF: 0, NF: 0 };
  for (const f of Object.values(freedom)) tally[f[4]]++;
  console.log(`  per country: arrivals ${Object.keys(arrivals).length}, trips abroad ${Object.keys(tripsAbroad).length}, migrants ${Object.keys(migrantShareBy).length}, freedom ${Object.keys(freedom).length} ${JSON.stringify(tally)}`);
  for (const r of byIncome) console.log(`    ${r.id.padEnd(18)} ${["WLD", "HIC", "UMC", "LMC", "LIC"].map((a) => (r.values[a] ? r.values[a][1] : "-")).join(" | ")}`);
  console.log(`  population clock: ${wppPop.map(([y, v]) => `${y}:${v}`).join(" ")}; births ${births}, deaths ${deaths} (${THIS_YEAR})`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
