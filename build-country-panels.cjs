/**
 * Builds src/data/countryPanels.ts — the figures behind the Countries modal's
 * detail panels, each from the body that publishes it and each with its year.
 *
 * What this replaces. The panels were fed by tables written into
 * CountriesPage.tsx by hand - COUNTRY_EXTENDED, COUNTRY_AGE_DIST,
 * COUNTRY_GENDER_STATS, COUNTRY_INFRA_STATS, the crime table - with a single
 * "year" per country where there was one at all. Where those figures have a
 * publisher, this fetches them from it. Where they have none (composite
 * "infrastructure scores", "safety index", pay gaps written in for every
 * country) the page stops showing them; see the commit that introduced this
 * script for the list.
 *
 * Sources:
 *   World Bank WDI           most series below, by code
 *   UNDP HDR 2025            HDI and mean years of schooling, 2023
 *   UN WPP 2024 (via OWID)   median age, latest estimate year (not projection)
 *   IEA (via OWID)           electric cars' share of new car sales
 *   TI CPI (via OWID)        Corruption Perceptions Index. transparency.org
 *                            refuses automated requests, and is not worked
 *                            around; Our World in Data republishes the index
 *                            with TI's scores unchanged.
 *   UN WUP 2025 (via OWID)   urban share, where the World Bank has none
 *
 * Taiwan is not covered by the World Bank or UNDP. It gets the UN figures
 * above (the UN publishes Taiwan as TWN), plus two sources of its own: the
 * Ministry of the Interior's life table (life expectancy, overall and by
 * sex) and DGBAS's HDI, which DGBAS computes with UNDP's formula.
 *
 * Every figure is the latest year published for that country, and nothing
 * older than ten years is kept: several of these series are sparse (adult
 * literacy is rarely measured in high-income countries), and a 2006 figure
 * shown beside 2024 ones would read as current.
 *
 *   node build-country-panels.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/countryPanels.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-panels");
fs.mkdirSync(CACHE, { recursive: true });
const OLDEST = new Date().getFullYear() - 10;

/** field → World Bank series. `dp` is decimal places kept. */
const WB = {
  // Society
  urbanPct: { code: "SP.URB.TOTL.IN.ZS", dp: 1 },
  birthRate: { code: "SP.DYN.CBRT.IN", dp: 1 },
  deathRate: { code: "SP.DYN.CDRT.IN", dp: 1 },
  internetPct: { code: "IT.NET.USER.ZS", dp: 1 },
  gini: { code: "SI.POV.GINI", dp: 1 },
  // Age structure
  age0to14: { code: "SP.POP.0014.TO.ZS", dp: 1 },
  age15to64: { code: "SP.POP.1564.TO.ZS", dp: 1 },
  age65up: { code: "SP.POP.65UP.TO.ZS", dp: 1 },
  // Gender
  femalePct: { code: "SP.POP.TOTL.FE.ZS", dp: 1 },
  sexRatioAtBirth: { code: "SP.POP.BRTH.MF", dp: 3 },
  lifeExpMale: { code: "SP.DYN.LE00.MA.IN", dp: 1 },
  lifeExpFemale: { code: "SP.DYN.LE00.FE.IN", dp: 1 },
  literacyMale: { code: "SE.ADT.LITR.MA.ZS", dp: 1 },
  literacyFemale: { code: "SE.ADT.LITR.FE.ZS", dp: 1 },
  laborMale: { code: "SL.TLF.CACT.MA.ZS", dp: 1 },
  laborFemale: { code: "SL.TLF.CACT.FE.ZS", dp: 1 },
  parliamentFemale: { code: "SG.GEN.PARL.ZS", dp: 1 },
  maternalMortality: { code: "SH.STA.MMRT", dp: 0 },
  // Infrastructure
  electricityAccess: { code: "EG.ELC.ACCS.ZS", dp: 1 },
  safeWater: { code: "SH.H2O.SMDW.ZS", dp: 1 },
  safeSanitation: { code: "SH.STA.SMSS.ZS", dp: 1 },
  mobilePer100: { code: "IT.CEL.SETS.P2", dp: 1 },
  broadbandPer100: { code: "IT.NET.BBND.P2", dp: 1 },
  logisticsIndex: { code: "LP.LPI.OVRL.XQ", dp: 2 },
  hospitalBeds: { code: "SH.MED.BEDS.ZS", dp: 1 },
  physicians: { code: "SH.MED.PHYS.ZS", dp: 2 },
  railKm: { code: "IS.RRS.TOTL.KM", dp: 0 },
  // Education
  literacy: { code: "SE.ADT.LITR.ZS", dp: 1 },
  // Economy
  agriculturePct: { code: "NV.AGR.TOTL.ZS", dp: 1 },
  industryPct: { code: "NV.IND.TOTL.ZS", dp: 1 },
  manufacturingPct: { code: "NV.IND.MANF.ZS", dp: 1 },
  servicesPct: { code: "NV.SRV.TOTL.ZS", dp: 1 },
  tradeBalanceUSD: { code: "NE.RSB.GNFS.CD", dp: 0 },
};

/**
 * Five-year age bands, each as a share of that sex's population, for building
 * the 15–24, 25–54 and 55–64 groups. The World Bank publishes 0–14 and 65+
 * directly but not these, so they are summed from the bands, weighting male
 * and female shares by the male and female population of the same year.
 * That is arithmetic on published figures, not an estimate, and the result
 * is checked: all five groups must add to 100 within rounding.
 */
const BANDS = {
  age15to24: ["1519", "2024"],
  age25to54: ["2529", "3034", "3539", "4044", "4549", "5054"],
  age55to64: ["5559", "6064"],
};

const SOURCES = {
  wb: { label: "World Bank — World Development Indicators", url: "https://data.worldbank.org/" },
  wbDerived: { label: "World Bank — five-year age bands, summed", url: "https://data.worldbank.org/indicator/SP.POP.1519.FE.5Y" },
  hdr: { label: "UNDP — Human Development Report 2025", url: "https://hdr.undp.org/data-center/documentation-and-downloads" },
  wpp: { label: "UN — World Population Prospects 2024 (via Our World in Data)", url: "https://population.un.org/wpp/" },
  iea: { label: "IEA — Global EV Outlook (via Our World in Data)", url: "https://ourworldindata.org/grapher/electric-car-sales-share" },
  wup: { label: "UN — World Urbanization Prospects 2025 (via Our World in Data)", url: "https://ourworldindata.org/grapher/share-of-population-urban" },
  moi: { label: "Taiwan Ministry of the Interior — abridged life table", url: "https://www.moi.gov.tw/english/cl.aspx?n=7780" },
  dgbas: { label: "Taiwan DGBAS — HDI computed with UNDP's formula", url: "https://eng.stat.gov.tw/News_Content.aspx?n=4610&s=233232" },
  cpi: { label: "Transparency International — CPI (via Our World in Data)", url: "https://ourworldindata.org/grapher/ti-corruption-perception-index" },
};

const round = (v, dp) => Number(v.toFixed(dp));

async function cached(name, url, parse) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    fs.writeFileSync(at, await res.text());
  }
  return parse(fs.readFileSync(at, "utf8"));
}

/** iso3 → { v, y } for the latest year, from a World Bank series. */
async function worldBank(code) {
  return cached(code + ".json", `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=12&per_page=30000`, (t) => {
    const json = JSON.parse(t);
    if (!Array.isArray(json) || !json[1]) throw new Error(`${code}: no rows`);
    const out = {};
    for (const row of json[1]) {
      if (row.value === null || !Number.isFinite(row.value) || +row.date < OLDEST) continue;
      const id = row.countryiso3code;
      if (!id) continue;
      if (!out[id] || +row.date > +out[id].y) out[id] = { v: row.value, y: String(row.date) };
    }
    return out;
  });
}

/** Minimal CSV: these files quote only fields containing commas. */
function csvRows(t) {
  return t.trim().split(/\r?\n/).map((line) => {
    const out = [];
    let cur = "", q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  });
}

/** OWID grapher CSV → iso3 → { v, y } for the latest year in `column`. */
async function owid(slug, column) {
  return cached(slug + ".csv", `https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, (t) => {
    const rows = csvRows(t);
    const head = rows[0];
    const ci = head.indexOf("code"), yi = head.indexOf("year"), vi = head.indexOf(column);
    if (ci < 0 || yi < 0 || vi < 0) throw new Error(`${slug}: column ${column} not found in ${head.join(",")}`);
    const out = {};
    for (const r of rows.slice(1)) {
      const code = r[ci], y = r[yi], v = Number(r[vi]);
      if (!code || code.startsWith("OWID_") || r[vi] === "" || !Number.isFinite(v) || +y < OLDEST) continue;
      if (!out[code] || +y > +out[code].y) out[code] = { v, y };
    }
    return out;
  });
}

/** OWID grapher CSV → iso3 → { y, v: {column: value} } for the latest year
 *  in which every one of `columns` has a value. */
async function owidMulti(slug, columns) {
  return cached(slug + ".csv", `https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, (t) => {
    const rows = csvRows(t);
    const head = rows[0];
    const ci = head.indexOf("code"), yi = head.indexOf("year");
    const idx = columns.map((c) => head.indexOf(c));
    if (ci < 0 || yi < 0 || idx.some((i) => i < 0)) throw new Error(`${slug}: columns not found in ${head.join(",")}`);
    const out = {};
    for (const r of rows.slice(1)) {
      const code = r[ci], y = r[yi];
      if (!code || code.startsWith("OWID_") || +y < OLDEST) continue;
      const vals = idx.map((i) => Number(r[i]));
      if (idx.some((i) => r[i] === "") || vals.some((v) => !Number.isFinite(v))) continue;
      if (!out[code] || +y > +out[code].y) out[code] = { y, v: Object.fromEntries(columns.map((c, k) => [c, vals[k]])) };
    }
    return out;
  });
}

/** UNDP HDR 2025 → iso3 → { hdi, mys } for the latest year present. */
async function hdr() {
  return cached("hdr25.csv", "https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv", (t) => {
    const rows = csvRows(t);
    const head = rows[0];
    const latest = (r, prefix) => {
      let best = null;
      head.forEach((h, i) => {
        const m = h.match(new RegExp(`^${prefix}_(\\d{4})$`));
        if (m && r[i] !== "" && Number.isFinite(Number(r[i])) && (!best || +m[1] > +best.y)) best = { v: Number(r[i]), y: m[1] };
      });
      return best && +best.y >= OLDEST ? best : null;
    };
    const out = {};
    for (const r of rows.slice(1)) {
      const iso = r[0];
      if (!/^[A-Z]{3}$/.test(iso)) continue; // skips regional aggregates ("ZZA.VHHD" etc.)
      out[iso] = { hdi: latest(r, "hdi"), mys: latest(r, "mys") };
    }
    return out;
  });
}

/**
 * Taiwan's HDI. UNDP leaves Taiwan out; its statistics office (DGBAS) computes
 * the index with UNDP's formula from Taiwan's own data and publishes the
 * series as an OpenDocument sheet. The latest year in the current (2014)
 * method's column is used.
 */
const DGBAS_HDI = "https://ws.dgbas.gov.tw/001/Upload/464/relfile/11760/233232/%E4%BA%BA%E9%A1%9E%E7%99%BC%E5%B1%95%E6%8C%87%E6%95%B8.ods";
async function taiwanHdi() {
  const at = path.join(CACHE, "dgbas-hdi.ods");
  if (!fs.existsSync(at)) {
    const res = await fetch(DGBAS_HDI, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`DGBAS HDI: HTTP ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  const x = unzip(at).get("content.xml").toString("utf8");
  let best = null;
  for (const m of x.matchAll(/<table:table-row[^>]*>([\s\S]*?)<\/table:table-row>/g)) {
    const cells = [...m[1].matchAll(/<table:table-cell([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)].flatMap((c) => {
      const rep = Math.min(+((c[1].match(/number-columns-repeated="(\d+)"/) || [])[1] || 1), 20);
      const v = (c[1].match(/office:value="([^"]+)"/) || [])[1] ?? (c[2] || "").replace(/<[^>]+>/g, "").trim();
      return Array(rep).fill(v);
    });
    // Year, then (old, 2010, 2014, current) value/rank pairs; current is column 7.
    if (/^(19|20)\d\d$/.test(cells[0]) && Number.isFinite(Number(cells[7])) && cells[7] !== "")
      if (!best || +cells[0] > +best.y) best = { v: Number(cells[7]), y: cells[0] };
  }
  if (!best || best.v < 0.8 || best.v > 1) throw new Error(`DGBAS HDI: unexpected ${JSON.stringify(best)}`);
  return best;
}

/**
 * Taiwan's official life expectancy, from the Ministry of the Interior's
 * abridged life table. The page lists one .ods per year, newest first; the
 * first is used and its year read from the file. In Table 1 the Total, Male
 * and Female sections each have an age "0" row whose last column is e0.
 * Newer and official, so it is preferred over the UN estimate for Taiwan.
 */
const MOI_LIFE = "https://www.moi.gov.tw/english/cl.aspx?n=7780";
async function taiwanLifeTable() {
  const page = path.join(CACHE, "moi-life.html");
  if (!fs.existsSync(page)) {
    const res = await fetch(MOI_LIFE, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`MOI life table page: HTTP ${res.status}`);
    fs.writeFileSync(page, await res.text());
  }
  const link = (fs.readFileSync(page, "utf8").match(/href="(https:\/\/ws\.moi\.gov\.tw\/Download\.ashx\?[^"]+)"[^>]*title="Abridged life table in Republic of China Area, (\d{4})\.ods"/) || []);
  if (!link[1]) throw new Error("MOI life table: no .ods link found");
  const at = path.join(CACHE, `moi-life-${link[2]}.ods`);
  if (!fs.existsSync(at)) {
    const res = await fetch(link[1].replace(/&amp;/g, "&"), { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`MOI life table: HTTP ${res.status}`);
    fs.writeFileSync(at, Buffer.from(await res.arrayBuffer()));
  }
  const x = unzip(at).get("content.xml").toString("utf8");
  const t = (x.match(/<table:table table:name="Table_1"[\s\S]*?<\/table:table>/) || [])[0];
  if (!t) throw new Error("MOI life table: no Table_1");
  const out = {};
  let sec = null;
  for (const m of t.matchAll(/<table:table-row[^>]*>([\s\S]*?)<\/table:table-row>/g)) {
    const r = [...m[1].matchAll(/<table:table-cell([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)].map(
      (c) => (c[1].match(/office:value="([^"]+)"/) || [])[1] ?? (c[2] || "").replace(/<[^>]+>/g, "").trim(),
    );
    if (/^(Total|Male|Female)$/.test(r[0])) sec = r[0];
    if (r[0] === "0" && sec) { out[sec] = { v: Number(r[6]), y: link[2] }; sec = null; }
  }
  for (const k of ["Total", "Male", "Female"])
    if (!(out[k]?.v > 60 && out[k].v < 95)) throw new Error(`MOI life table: ${k} = ${out[k] && out[k].v}`);
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

(async () => {
  // iso2 → iso3, from the World Bank's own country list.
  const iso3 = await cached("countries.json", "https://api.worldbank.org/v2/country?format=json&per_page=400", (t) => {
    const m = {};
    for (const c of JSON.parse(t)[1]) m[c.iso2Code] = c.id;
    return m;
  });
  // Kosovo is XK to the site and XKX to the World Bank; both lists agree.
  // Taiwan, Western Sahara, Cook Islands and Niue are not on the World
  // Bank list at all, but the UN, TI and EIA publish them under these codes.
  Object.assign(iso3, { TW: "TWN", EH: "ESH", CK: "COK", NU: "NIU", ...iso3 });
  const series = {};
  for (const [f, spec] of Object.entries(WB)) series[f] = await worldBank(spec.code);
  const bandSeries = {};
  for (const b of [...new Set(Object.values(BANDS).flat())])
    for (const sex of ["MA", "FE"]) bandSeries[b + sex] = await worldBank(`SP.POP.${b}.${sex}.5Y`);
  const popM = await worldBank("SP.POP.TOTL.MA.IN");
  const popF = await worldBank("SP.POP.TOTL.FE.IN");
  // UN fallbacks, used only where the World Bank has no figure for a country
  // (in practice Taiwan). All UN WPP 2024 estimates, or UN WUP for urban share.
  const wppBirth = await owid("crude-birth-rate", "birth_rate__sex_all__age_all__variant_estimates");
  const wppDeath = await owid("crude-death-rate", "death_rate__sex_all__age_all__variant_estimates");
  const wppSexRatio = await owid("sex-ratio-at-birth", "sex_ratio__sex_all__age_0__variant_estimates");
  const wupUrban = await owid("share-of-population-urban", "share__area_type_urban__data_type_estimates");
  const wppLife = await owidMulti("life-expectancy-of-women-vs-life-expectancy-of-men", [
    "life_expectancy__sex_female__age_0__variant_estimates",
    "life_expectancy__sex_male__age_0__variant_estimates",
  ]);
  const BAND_COLS = ["0_4", "5_9", "10_14", "15_19", "20_24", "25_29", "30_34", "35_39", "40_44", "45_49", "50_54", "55_59", "60_64", "65_69", "70_74", "75_79", "80_84", "85_89", "90_94", "95_99", "100plus"].map(
    (b) => `population__sex_all__age_${b}__variant_estimates`,
  );
  const wppBands = await owidMulti("population-by-five-year-age-group", BAND_COLS);
  const median = await owid("median-age", "median_age__sex_all__age_all__variant_estimates");
  const cpi = await owid("ti-corruption-perception-index", "cpi_score");
  const ev = await owid("electric-car-sales-share", "ev_sales_share");
  const undp = await hdr();
  const twHdi = await taiwanHdi();
  const twLife = await taiwanLifeTable();

  const countries = loadCountries();
  const rows = [];
  const coverage = {};
  const years = {};
  const note = (f, y) => {
    coverage[f] = (coverage[f] || 0) + 1;
    (years[f] ||= {})[y] = (years[f][y] || 0) + 1;
  };

  for (const c of [...countries].sort((a, b) => a.id.localeCompare(b.id))) {
    const i3 = iso3[c.code];
    if (!i3) continue;
    const parts = [];
    const put = (f, hit, dp, src) => {
      if (!hit || !Number.isFinite(hit.v)) return;
      parts.push(`${f}: { v: ${round(hit.v, dp)}, y: "${hit.y}"${src ? `, s: "${src}"` : ""} }`);
      note(f, hit.y);
    };
    for (const [f, spec] of Object.entries(WB)) put(f, series[f][i3], spec.dp);
    // UN fallbacks where the World Bank has nothing for this country.
    const has = (f) => parts.some((p) => p.startsWith(f + ":"));
    if (!has("birthRate")) put("birthRate", wppBirth[i3], 1, "wpp");
    if (!has("deathRate")) put("deathRate", wppDeath[i3], 1, "wpp");
    if (!has("sexRatioAtBirth") && wppSexRatio[i3]) put("sexRatioAtBirth", { v: wppSexRatio[i3].v / 100, y: wppSexRatio[i3].y }, 3, "wpp");
    if (!has("urbanPct")) put("urbanPct", wupUrban[i3], 1, "wup");
    if (c.code === "TW") {
      put("lifeExpectancy", twLife.Total, 1, "moi");
      put("lifeExpMale", twLife.Male, 1, "moi");
      put("lifeExpFemale", twLife.Female, 1, "moi");
    }
    if (!has("lifeExpFemale") && wppLife[i3]) {
      put("lifeExpFemale", { v: wppLife[i3].v.life_expectancy__sex_female__age_0__variant_estimates, y: wppLife[i3].y }, 1, "wpp");
      put("lifeExpMale", { v: wppLife[i3].v.life_expectancy__sex_male__age_0__variant_estimates, y: wppLife[i3].y }, 1, "wpp");
    }
    if (!has("age0to14") && wppBands[i3]) {
      const b = wppBands[i3].v, yy = wppBands[i3].y;
      const sum = (from, to) => BAND_COLS.slice(from, to).reduce((a, c) => a + b[c], 0);
      const total = sum(0, BAND_COLS.length);
      const pct = (from, to) => ({ v: (sum(from, to) / total) * 100, y: yy });
      put("age0to14", pct(0, 3), 1, "wpp");
      put("age15to24", pct(3, 5), 1, "wpp");
      put("age25to54", pct(5, 11), 1, "wpp");
      put("age55to64", pct(11, 13), 1, "wpp");
      put("age65up", pct(13, BAND_COLS.length), 1, "wpp");
    }
    // Derived age groups, only when every input is for the same year as the
    // directly published 0–14 share.
    const y = series.age0to14[i3]?.y;
    const m = popM[i3], fe = popF[i3];
    if (y && m?.y === y && fe?.y === y) {
      const groups = {};
      for (const [g, bands] of Object.entries(BANDS)) {
        let sum = 0, ok = true;
        for (const b of bands) {
          const bm = bandSeries[b + "MA"][i3], bf = bandSeries[b + "FE"][i3];
          if (!bm || !bf || bm.y !== y || bf.y !== y) { ok = false; break; }
          sum += (bm.v * m.v + bf.v * fe.v) / (m.v + fe.v);
        }
        if (!ok) { Object.keys(groups).forEach((k) => delete groups[k]); break; }
        groups[g] = sum;
      }
      const total = series.age0to14[i3].v + series.age65up[i3]?.v + Object.values(groups).reduce((a, b) => a + b, 0);
      if (Object.keys(groups).length === 3 && series.age65up[i3]?.y === y) {
        if (Math.abs(total - 100) > 0.6) throw new Error(`${c.name}: age groups sum to ${total.toFixed(2)}`);
        for (const [g, v] of Object.entries(groups)) put(g, { v, y }, 1, "wbDerived");
      }
    }
    put("medianAge", median[i3], 1, "wpp");
    put("cpiScore", cpi[i3], 0, "cpi");
    put("evSalesShare", ev[i3], 1, "iea");
    put("hdi", undp[i3]?.hdi ?? (c.code === "TW" ? twHdi : undefined), 3, undp[i3]?.hdi ? "hdr" : "dgbas");
    put("schoolingYears", undp[i3]?.mys, 1, "hdr");
    if (parts.length) rows.push(`  ${JSON.stringify(c.id)}: { ${parts.join(", ")} },`);
  }

  // Sanity checks on scaling and meaning, against figures that are well known
  // and stable, so a changed series definition fails loudly instead of quietly.
  const us = Object.fromEntries(
    rows.find((r) => r.startsWith('  "us"')).match(/(\w+): \{ v: (-?[\d.e+]+)/g).map((s) => {
      const [, k, v] = s.match(/(\w+): \{ v: (-?[\d.e+]+)/);
      return [k, +v];
    }),
  );
  const expect = (k, lo, hi) => {
    if (!(us[k] >= lo && us[k] <= hi)) throw new Error(`US ${k} = ${us[k]}, expected ${lo}–${hi}; series changed?`);
  };
  expect("hdi", 0.9, 0.96);
  expect("medianAge", 35, 42);
  expect("femalePct", 49, 51.5);
  expect("sexRatioAtBirth", 1.0, 1.1);
  expect("cpiScore", 55, 80);
  expect("age65up", 14, 22);

  const fields = [...Object.keys(WB), ...Object.keys(BANDS), "lifeExpectancy", "medianAge", "cpiScore", "evSalesShare", "hdi", "schoolingYears"];
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Figures for the Countries modal's detail panels, each with its year.
 *
 * GENERATED by build-country-panels.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * World Bank WDI unless \`s\` names another source (see PANEL_SOURCES). Each
 * value is the latest year published for that country; nothing older than ten
 * years is kept. A country a source does not cover has no value for it.
 *
 * World Bank series:
${Object.entries(WB).map(([f, s]) => ` *   ${f.padEnd(18)} ${s.code}`).join("\n")}
 *
 * sexRatioAtBirth is the World Bank's males per female (e.g. 1.05), not per
 * 100. tradeBalanceUSD is exports less imports of goods and services, current
 * US$.
 */
export const PANEL_SOURCES = ${JSON.stringify(SOURCES, null, 2)} as const;

export const PANELS_RETRIEVED = "${today}";

export type PanelFigure = { v: number; y: string; s?: keyof typeof PANEL_SOURCES };

export type PanelField =
${fields.map((f) => `  | "${f}"`).join("\n")};

export const COUNTRY_PANELS: Record<string, Partial<Record<PanelField, PanelFigure>>> = {
${rows.join("\n")}
};

/** The source a figure came from. */
export function panelSource(f: PanelFigure) {
  const s = PANEL_SOURCES[f.s ?? "wb"];
  return { label: \`\${s.label}, \${f.y}\`, url: s.url };
}
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} countries`);
  for (const f of fields) {
    const ys = Object.entries(years[f] || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([y, n]) => `${y}:${n}`).join(" ");
    console.log(`  ${f.padEnd(18)} ${String(coverage[f] || 0).padStart(4)}  ${ys}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
