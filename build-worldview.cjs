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
  wpp: { label: "UN World Population Prospects 2024, medium variant (via Our World in Data)", url: "https://population.un.org/wpp/" },
};

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

function csvRows(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(",");
  return lines.slice(1).map((l) => {
    // OWID's entity names can contain commas in quotes; World never does.
    const cells = l.split(",");
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}

async function owidWorld(slug) {
  const t = await get(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `owid-${slug}.csv`);
  const rows = csvRows(t).filter((r) => r.entity === "World");
  if (!rows.length) throw new Error(`OWID ${slug}: no World rows`);
  return rows.map((r) => ({ ...r, year: Number(r.year) })).sort((a, b) => a.year - b.year);
}

/** The column whose name ends with a given conflict type. */
const col = (row, suffix) => {
  const k = Object.keys(row).find((c) => c.endsWith(suffix));
  if (!k) throw new Error(`OWID: no column ending ${suffix} in ${Object.keys(row).join(",")}`);
  return k;
};

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
}

export const WORLD: Record<string, WorldIndicator> = {
${lines.join("\n")}
};

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
  for (const r of byIncome) console.log(`    ${r.id.padEnd(18)} ${["WLD", "HIC", "UMC", "LMC", "LIC"].map((a) => (r.values[a] ? r.values[a][1] : "-")).join(" | ")}`);
  console.log(`  population clock: ${wppPop.map(([y, v]) => `${y}:${v}`).join(" ")}; births ${births}, deaths ${deaths} (${THIS_YEAR})`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
