/**
 * Builds src/data/economiesRemaining.ts — an economy card for every place on
 * the site that neither economiesData.ts nor build-more-economies.cjs covers,
 * because the World Bank publishes no GDP for it. Before this, 37 of the
 * site's 250 places had no card on the Economies page at all.
 *
 * Each card holds what an official body publishes for that place and
 * nothing else, as the generated cards do: a figure no source reports is NaN
 * (the page's "not published"), and a place no source covers says so rather
 * than showing an estimate.
 *
 * Sources, in the order they are tried, each figure with its year:
 *   UN Statistics Division  National Accounts Main Aggregates: GDP, GDP per
 *                           head, exports + imports, all in current US
 *                           dollars; real growth is the change in its GDP at
 *                           constant 2020 prices. North Korea, Eritrea, the
 *                           Cook Islands, Anguilla, the British Virgin
 *                           Islands, Montserrat.
 *   Pacific Community (SPC) GDP and GDP per head in US dollars, as SPC
 *                           converts them. Niue, Tokelau, Wallis and Futuna.
 *   Eurostat                regional GDP and GDP per head in euros, and the
 *                           unemployment rate. The five French overseas
 *                           departments and Åland.
 *   Statistics Netherlands  GDP (in US dollars, the currency there), its
 *                           volume change, and GDP per head. The Caribbean
 *                           Netherlands.
 *   Statistics Jersey       GDP, its real change and GDP per head (open data).
 *   Official publications   read and entered by hand in OFFICIAL below, each
 *                           with its URL: Guernsey, Gibraltar, the Falkland
 *                           Islands, St Helena, Saint-Pierre-et-Miquelon and
 *                           Saint-Barthélemy.
 * Figures in euros or pounds are converted at the World Bank's average
 * exchange rate for the same year (PA.NUS.FCRF: France for the euro, the
 * United Kingdom for sterling), and the card says so.
 *
 *   node build-remaining-economies.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/economiesRemaining.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-remaining-economies");
fs.mkdirSync(CACHE, { recursive: true });

const SOURCES = {
  unsd: {
    label: "UN Statistics Division — National Accounts Main Aggregates",
    url: "https://unstats.un.org/unsd/snaama/",
  },
  spc: {
    label: "Pacific Community (SPC) — Gross Domestic Product for Pacific Island Countries and Territories",
    url: "https://stats.pacificdata.org/vis?df[ds]=SPC2&df[id]=DF_NATIONAL_ACCOUNTS&df[ag]=SPC",
  },
  eurostat: {
    label: "Eurostat — regional GDP (nama_10r_2gdp) and unemployment (lfst_r_lfu3rt)",
    url: "https://ec.europa.eu/eurostat/databrowser/view/nama_10r_2gdp/default/table",
  },
  cbs: {
    label: "Statistics Netherlands (CBS) — Caribbean Netherlands GDP (84789NED, 85251NED)",
    url: "https://opendata.cbs.nl/statline/#/CBS/nl/dataset/84789NED/table",
  },
  jersey: {
    label: "Statistics Jersey — National accounts: GVA and GDP (open data)",
    url: "https://opendata.gov.je/dataset/national-accounts",
  },
  fx: {
    label: "World Bank — official exchange rate, period average (PA.NUS.FCRF)",
    url: "https://data.worldbank.org/indicator/PA.NUS.FCRF",
  },
};

/**
 * Figures read from official publications, entered by hand because they are
 * published only as a web page or a PDF. `lcu` values are in the local
 * currency, millions for GDP; `rateYear` is the calendar year whose average
 * exchange rate converts them (a financial year April to March takes the year
 * it starts in, which holds nine of its months).
 */
const OFFICIAL = {
  GG: {
    currency: "GBP",
    year: "2023",
    rateYear: 2023,
    gdp: 3488,
    perCapita: 54463,
    growth: -2,
    source: { label: "States of Guernsey — Annual GVA and GDP Bulletin 2023", url: "https://www.gov.gg/gdp" },
    note: "Real change as the States publish it, deflated by Guernsey's Retail Price Index and rounded to the whole per cent.",
  },
  GI: {
    currency: "GBP",
    year: "2023/24",
    rateYear: 2023,
    gdp: 2901.24,
    perCapita: 75957,
    trends: [
      ["2019/20", 2568.19, 2019],
      ["2020/21", 2416.6, 2020],
      ["2021/22", 2539.47, 2021],
      ["2022/23", 2749.25, 2022],
      ["2023/24", 2901.24, 2023],
    ],
    source: {
      label: "HM Government of Gibraltar — National Income, 2010/11 to 2024/25",
      url: "https://www.gibraltar.gov.gi/uploads/statistics/2025/National%20Accounts/GDP%20Estimates%202010%20-%2011%20-%202024-25.pdf",
    },
    note: "GDP at factor cost for the financial year April 2023 to March 2024, a preliminary estimate. The 2024/25 figure is a forecast and is left out.",
  },
  FK: {
    currency: "GBP",
    year: "2024",
    rateYear: 2024,
    gdp: 288.0,
    perCapita: 86050,
    growth: 3.6,
    trends: [
      ["2020", 257.9, 2020, -8.4],
      ["2021", 276.7, 2021, 5.0],
      ["2022", 278.6, 2022, 0.6],
      ["2023", 280.4, 2023, 1.1],
      ["2024", 288.0, 2024, 3.6],
    ],
    source: {
      label: "Falkland Islands Government — National Accounts 2014–2024",
      url: "https://www.falklands.gov.fk/policy/downloads?task=download.send&id=290%3Afalkland-islands-national-accounts-2014-2024&catid=9",
    },
    note: "GDP at current and basic prices; growth at constant 2012 prices. The Falkland pound is at par with sterling.",
  },
  SH: {
    currency: "GBP",
    year: "2023/24",
    rateYear: 2023,
    gdp: 39.4,
    perCapita: 9210,
    growth: -3.7,
    source: {
      label: "St Helena Government — Statistical Update: Gross Domestic Product",
      url: "https://www.sainthelena.gov.sh/statistical-update-gross-domestic-product-2/",
    },
    note: "GDP at market prices for the financial year 2023/24, a provisional estimate. The St Helena pound is at par with sterling.",
  },
  PM: {
    currency: "EUR",
    year: "2015",
    rateYear: 2015,
    gdp: 240,
    perCapita: 39778,
    source: {
      label: "IEDOM — Tableau de bord économique des Outre-mer, April 2026",
      url: "https://www.iedom.fr/IMG/pdf/tdb_om_2025_iedom__ieom_avril2026.pdf",
    },
    note: "The latest estimate published, by IEDOM and CEROM for 2015.",
  },
  BL: {
    currency: "EUR",
    year: "2023",
    rateYear: 2023,
    gdp: 960.5,
    perCapita: 90103,
    source: {
      label: "CEROM — Estimation du PIB de Saint-Barthélemy, June 2026",
      url: "https://www.cerom-outremer.fr/IMG/pdf/pib_bl_2023_cp_vf.pdf",
    },
    note: "CEROM notes that GDP per resident overstates income: seasonal workers help produce it but are not counted as residents.",
  },
};

/** Eurostat NUTS 2 regions for the places it covers. */
const EUROSTAT_GEO = { GP: "FRY1", MQ: "FRY2", GF: "FRY3", RE: "FRY4", YT: "FRY5", AX: "FI20" };
/** SPC's codes for the places it covers. */
const SPC_GEO = ["NU", "TK", "WF"];
/** UN Statistics Division country names for the places it covers. */
const UNSD_NAME = {
  KP: "D.P.R. of Korea",
  ER: "Eritrea",
  CK: "Cook Islands",
  AI: "Anguilla",
  VG: "British Virgin Islands",
  MS: "Montserrat",
};
/** Places with no permanent population: no economy of their own to measure. */
const UNINHABITED = new Set(["AQ", "BV", "HM", "GS", "TF", "IO", "UM"]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, name, { binary = false, headers = {} } = {}) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return binary ? fs.readFileSync(at) : fs.readFileSync(at, "utf8");
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
      fs.writeFileSync(at, body);
      return body;
    } catch (e) {
      if (i === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(3000 * (i + 1));
    }
  }
}

/** The files in a .xlsx (a zip), read with zlib alone. */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--)
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  if (eocd < 0) throw new Error("not a zip file");
  const files = {};
  let p = buf.readUInt32LE(eocd + 16);
  for (let k = buf.readUInt16LE(eocd + 10); k > 0; k--) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip directory");
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const skip = nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    files[name] = method === 8 ? zlib.inflateRawSync(data) : data;
    p += 46 + skip;
  }
  return files;
}
const unxml = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
/** The first sheet of a .xlsx as rows of { column letter: value }. */
function sheetRows(buf) {
  const files = unzip(buf);
  const ss = files["xl/sharedStrings.xml"]?.toString("utf8") ?? "";
  const strings = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
  const sheet = files["xl/worksheets/sheet1.xml"].toString("utf8");
  const rows = [];
  for (const r of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = c[3] && /<v>([\s\S]*?)<\/v>/.exec(c[3]);
      if (v) cells[c[1]] = /t="s"/.test(c[2]) ? strings[+v[1]] : v[1];
    }
    rows.push(cells);
  }
  return rows;
}
/** { country name: { indicator: { year: value } } } from a UN main aggregates file. */
function unsdTable(buf) {
  const rows = sheetRows(buf);
  const header = rows.find((r) => r.A === "CountryID");
  const years = Object.entries(header).filter(([, v]) => /^\d{4}$/.test(v));
  const out = {};
  for (const r of rows) {
    if (!r.B || !r.C || r === header) continue;
    const series = {};
    for (const [col, y] of years) if (r[col] !== undefined && Number.isFinite(+r[col])) series[y] = +r[col];
    ((out[r.B] ??= {})[r.C] = series);
  }
  return out;
}

/** A quoted CSV line split into fields. */
function csvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Eurostat's JSON-stat as [{ ...dimension codes, time, value }]. */
function jsonStat(j) {
  const dims = j.id, size = j.size;
  const names = dims.map((d) =>
    Object.entries(j.dimension[d].category.index).sort((a, b) => a[1] - b[1]).map(([k]) => k),
  );
  return Object.entries(j.value).map(([k, value]) => {
    let n = +k;
    const row = { value };
    for (let i = dims.length - 1; i >= 0; i--) {
      row[dims[i]] = names[i][n % size[i]];
      n = Math.floor(n / size[i]);
    }
    return row;
  });
}

const sig = (v, n = 4) => Number(v.toPrecision(n));
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const latest = (series) => {
  const ys = Object.keys(series ?? {}).filter((y) => Number.isFinite(series[y])).sort();
  return ys.length ? { y: ys[ys.length - 1], v: series[ys[ys.length - 1]] } : null;
};

function bundle(file, name) {
  const out = path.join(CACHE, `${name}.cjs`);
  execSync(
    `npx esbuild ${file} --bundle --format=cjs --platform=node --log-level=error --alias:@=./src "--define:import.meta.env={}" --outfile="${out}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[out];
  return require(out);
}

(async () => {
  const { countriesData } = bundle("src/data/countriesData.ts", "countriesData");
  const { economiesData, economyForCountry } = bundle("src/data/economiesData.ts", "economiesData");
  // Places with no card yet, leaving out this script's own earlier output.
  const own = new Set(economiesData.filter((e) => e.dataSources || e.noFiguresReason).map((e) => e.iso2));
  const targets = countriesData.filter((c) => own.has(c.code) || !economyForCountry(c));

  // Exchange rates: local currency per US dollar, by year.
  const fx = { EUR: {}, GBP: {} };
  const wb = JSON.parse(
    await get("https://api.worldbank.org/v2/country/FRA;GBR/indicator/PA.NUS.FCRF?format=json&date=2010:2026&per_page=200", "wb-fx.json"),
  )[1];
  for (const r of wb) if (r.value !== null) fx[r.countryiso3code === "FRA" ? "EUR" : "GBP"][r.date] = r.value;
  const toUsd = (lcu, currency, year) => {
    if (currency === "USD") return lcu;
    const rate = fx[currency][String(year)];
    if (!rate) throw new Error(`no ${currency} rate for ${year}`);
    return lcu / rate;
  };

  // UN Statistics Division.
  const unsdGdp = unsdTable(await get("https://unstats.un.org/unsd/amaapi/api/file/2", "unsd-2.xlsx", { binary: true }));
  const unsdReal = unsdTable(await get("https://unstats.un.org/unsd/amaapi/api/file/6", "unsd-6.xlsx", { binary: true }));
  const unsdPerCap = unsdTable(await get("https://unstats.un.org/unsd/amaapi/api/file/9", "unsd-9.xlsx", { binary: true }));
  const GDP = "Gross Domestic Product (GDP)";

  // SPC.
  const spcCsv = await get(
    "https://stats-sdmx-disseminate.pacificdata.org/rest/data/SPC,DF_NATIONAL_ACCOUNTS,/all?startPeriod=2014",
    "spc-national-accounts.csv",
    // SPC's server answers 500 to Node's default "Accept-Language: *".
    { headers: { Accept: "application/vnd.sdmx.data+csv;version=2.0.0;labels=id", "Accept-Language": "en" } },
  );
  const spcLines = spcCsv.split(/\r?\n/).filter(Boolean);
  const spcHead = csvLine(spcLines[0]);
  const col = (n) => spcHead.findIndex((h) => h === n || h.startsWith(n + ":"));
  const spc = {};
  for (const line of spcLines.slice(1)) {
    const c = csvLine(line);
    if (c[col("CURRENCY")] !== "USD") continue;
    const geo = c[col("GEO_PICT")], ind = c[col("INDICATOR")];
    const mult = 10 ** Number(c[col("UNIT_MULT")] || 0);
    const v = Number(c[col("OBS_VALUE")]);
    if (!Number.isFinite(v)) continue;
    ((spc[geo] ??= {})[ind] ??= {})[c[col("TIME_PERIOD")]] = v * mult;
  }

  // Eurostat.
  const geoQuery = Object.values(EUROSTAT_GEO).map((g) => `geo=${g}`).join("&");
  const esGdp = jsonStat(
    JSON.parse(
      await get(
        `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10r_2gdp?${geoQuery}&unit=MIO_EUR&unit=EUR_HAB&sinceTimePeriod=2019`,
        "eurostat-gdp.json",
      ),
    ),
  );
  const esJobs = jsonStat(
    JSON.parse(
      await get(
        `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/lfst_r_lfu3rt?${geoQuery}&age=Y15-74&sex=T&isced11=TOTAL&unit=PC&sinceTimePeriod=2019`,
        "eurostat-unemployment.json",
      ),
    ),
  );

  // Statistics Netherlands: the Caribbean Netherlands as a whole.
  const cbsGdp = JSON.parse(
    await get("https://opendata.cbs.nl/ODataApi/odata/84789NED/TypedDataSet?$format=json", "cbs-84789.json"),
  ).value.filter((r) => r.CaribischNederland.trim() === "CN01");
  const cbsPerCap = JSON.parse(
    await get("https://opendata.cbs.nl/ODataApi/odata/85251NED/TypedDataSet?$format=json", "cbs-85251.json"),
  ).value.filter((r) => r.CaribischNederland.trim() === "CN01");

  // Statistics Jersey: GDP at constant 2024 values, which for 2024 is its value.
  const jeCsv = (text) =>
    Object.fromEntries(
      text
        .split(/\r?\n/)
        .map(csvLine)
        .filter((c) => /^\d{4}$/.test(c[0]))
        .map((c) => [c[0], c.slice(1).map(Number)]),
    );
  const jeGdp = jeCsv(
    await get(
      "https://opendata.gov.je/dataset/a8d377e2-a584-4f16-8d9f-8f26e6933b95/resource/ae620bf3-41be-4461-adb8-2220ab7cb000/download/gdp-in-real-terms-constant-2024-values-million.csv",
      "je-gdp.csv",
    ),
  );
  const jePerHead = jeCsv(
    await get(
      "https://opendata.gov.je/dataset/a8d377e2-a584-4f16-8d9f-8f26e6933b95/resource/827b9bad-8b78-42d7-8503-4b2414e32567/download/gdp-per-head-of-population-in-real-terms-constant-2024-values.csv",
      "je-gdp-per-head.csv",
    ),
  );

  const displayCurrency = new Intl.DisplayNames(["en"], { type: "currency" });
  const titleCase = (s) => s.replace(/\b\p{Ll}/gu, (m) => m.toUpperCase());
  const entries = [];
  const report = [];

  for (const c of targets) {
    const years = {};
    const e = {
      id: c.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "") + "-eco",
      name: c.name,
      entityType: c.territory ? "Territory" : "Country",
      iso2: c.code,
      limitedData: true,
      gdpTrillions: NaN,
      gdpGrowthRate: NaN,
      gdpPerCapita: NaN,
      inflationRate: NaN,
      unemploymentRate: NaN,
      debtToGDPRatio: NaN,
      tradeVolumeTrillions: NaN,
      fdiInflowBillions: NaN,
      stockMarketCap: NaN,
      interestRate: NaN,
      currencyCode: c.currency || "",
      currencyName: c.currency || "",
      topExports: [],
      topImports: [],
      tradingPartners: [],
      tradeYear: null,
      creditRating: "",
      trends: [],
      figureYears: years,
    };
    try {
      e.currencyName = titleCase(displayCurrency.of(c.currency));
    } catch {}
    const set = (field, v, y) => {
      if (!Number.isFinite(v)) return;
      e[field] = v;
      years[field] = String(y);
    };
    let sources = [];
    let note = "";

    if (UNSD_NAME[c.code]) {
      const n = UNSD_NAME[c.code];
      const gdp = unsdGdp[n]?.[GDP], real = unsdReal[n]?.[GDP];
      const per = Object.values(unsdPerCap[n] ?? {})[0];
      const g = latest(gdp);
      if (!g) throw new Error(`UNSD has no GDP for ${n}`);
      const growthOf = (y) =>
        real?.[y] !== undefined && real?.[String(+y - 1)] ? round((real[y] / real[String(+y - 1)] - 1) * 100, 1) : null;
      set("gdpTrillions", sig(g.v / 1e12), g.y);
      const gr = growthOf(g.y);
      if (gr !== null) set("gdpGrowthRate", gr, g.y);
      const p = latest(per);
      if (p) set("gdpPerCapita", Math.round(p.v), p.y);
      const ex = unsdGdp[n]["Exports of goods and services"]?.[g.y], im = unsdGdp[n]["Imports of goods and services"]?.[g.y];
      if (Number.isFinite(ex) && Number.isFinite(im)) set("tradeVolumeTrillions", sig((ex + im) / 1e12), g.y);
      e.trends = Object.keys(gdp).sort().slice(-5).map((y) => ({ year: y, gdp: sig(gdp[y] / 1e12), growth: growthOf(y), inflation: null }));
      sources = [SOURCES.unsd];
      note = "Real growth is the change in the UN's estimate of GDP at constant 2020 prices.";
    } else if (SPC_GEO.includes(c.code)) {
      const s = spc[c.code] ?? {};
      const g = latest(s.GDPC);
      if (!g) throw new Error(`SPC has no GDP for ${c.code}`);
      set("gdpTrillions", sig(g.v / 1e12), g.y);
      const p = latest(s.GDPCPC);
      if (p) set("gdpPerCapita", Math.round(p.v), p.y);
      e.trends = Object.keys(s.GDPC).sort().slice(-5).map((y) => ({ year: y, gdp: sig(s.GDPC[y] / 1e12), growth: null, inflation: null }));
      sources = [SOURCES.spc];
      note = "In US dollars as SPC converts them. SPC publishes growth only at current prices, so no real growth is shown.";
    } else if (EUROSTAT_GEO[c.code]) {
      const geo = EUROSTAT_GEO[c.code];
      const pick = (rows, unit) =>
        Object.fromEntries(rows.filter((r) => r.geo === geo && (!unit || r.unit === unit)).map((r) => [r.time, r.value]));
      const gdp = pick(esGdp, "MIO_EUR"), per = pick(esGdp, "EUR_HAB"), jobs = pick(esJobs);
      const g = latest(gdp);
      if (!g) throw new Error(`Eurostat has no GDP for ${geo}`);
      set("gdpTrillions", sig(toUsd(g.v, "EUR", g.y) / 1e6), g.y);
      const p = latest(per);
      if (p) set("gdpPerCapita", Math.round(toUsd(p.v, "EUR", p.y)), p.y);
      const u = latest(jobs);
      if (u) set("unemploymentRate", round(u.v, 1), u.y);
      e.trends = Object.keys(gdp).sort().slice(-5).map((y) => ({ year: y, gdp: sig(toUsd(gdp[y], "EUR", y) / 1e6), growth: null, inflation: null }));
      sources = [SOURCES.eurostat, SOURCES.fx];
      note = "Converted from euros at the World Bank's average rate for each year. Eurostat publishes no real growth for the region's GDP.";
    } else if (c.code === "BQ") {
      const rows = cbsGdp.map((r) => ({ y: r.Perioden.slice(0, 4), v: r.BbpWaardeInWerkelijkePrijzen_1, g: r.BbpVolumemutatie_4 }))
        .filter((r) => Number.isFinite(r.v))
        .sort((a, b) => a.y.localeCompare(b.y));
      const g = rows[rows.length - 1];
      set("gdpTrillions", sig(g.v / 1e6), g.y);
      if (Number.isFinite(g.g)) set("gdpGrowthRate", round(g.g, 1), g.y);
      const per = cbsPerCap.map((r) => ({ y: r.Perioden.slice(0, 4), v: r.BrutoBinnenlandsProductPerInwoner_1 })).filter((r) => Number.isFinite(r.v)).sort((a, b) => a.y.localeCompare(b.y));
      if (per.length) set("gdpPerCapita", Math.round(per[per.length - 1].v), per[per.length - 1].y);
      e.trends = rows.slice(-5).map((r) => ({ year: r.y, gdp: sig(r.v / 1e6), growth: Number.isFinite(r.g) ? round(r.g, 1) : null, inflation: null }));
      sources = [SOURCES.cbs];
      note = "Bonaire, Sint Eustatius and Saba together, in US dollars, their currency. Growth is CBS's volume change.";
    } else if (c.code === "JE") {
      const y = Object.keys(jeGdp).sort().pop();
      const [gdpLcu, growth] = jeGdp[y];
      set("gdpTrillions", sig(toUsd(gdpLcu, "GBP", y) / 1e6), y);
      if (Number.isFinite(growth)) set("gdpGrowthRate", round(growth, 1), y);
      const py = Object.keys(jePerHead).sort().pop();
      set("gdpPerCapita", Math.round(toUsd(jePerHead[py][0], "GBP", py)), py);
      sources = [SOURCES.jersey, SOURCES.fx];
      note = `GDP for ${y} from Statistics Jersey's series in constant ${y} values, which for ${y} is its value that year; converted from pounds at the World Bank's average rate.`;
    } else if (OFFICIAL[c.code]) {
      const o = OFFICIAL[c.code];
      set("gdpTrillions", sig(toUsd(o.gdp, o.currency, o.rateYear) / 1e6), o.year);
      set("gdpPerCapita", Math.round(toUsd(o.perCapita, o.currency, o.rateYear)), o.year);
      if (o.growth !== undefined) set("gdpGrowthRate", o.growth, o.year);
      if (o.trends)
        e.trends = o.trends.map(([year, lcu, rateYear, growth]) => ({
          year,
          gdp: sig(toUsd(lcu, o.currency, rateYear) / 1e6),
          growth: growth ?? null,
          inflation: null,
        }));
      sources = [o.source, SOURCES.fx];
      note = `${o.note} Converted from ${o.currency === "EUR" ? "euros" : "pounds"} at the World Bank's average rate for ${o.rateYear}.`;
    } else {
      e.noFiguresReason = UNINHABITED.has(c.code)
        ? `${c.name} has no permanent population, so there is no economy of its own to measure.`
        : `No GDP for ${c.name} is published by the international bodies or statistics offices this page draws on.`;
    }
    // A single year still goes in the series, so the card says it has one
    // year rather than that none is published.
    if (!e.trends.length && Number.isFinite(e.gdpTrillions))
      e.trends = [{ year: years.gdpTrillions, gdp: e.gdpTrillions, growth: Number.isFinite(e.gdpGrowthRate) ? e.gdpGrowthRate : null, inflation: null }];
    if (sources.length) e.dataSources = sources;
    if (note) e.figureNote = note;
    entries.push(e);
    report.push(
      `  ${c.code} ${c.name.padEnd(46)} ${e.noFiguresReason ? "no figures" : `GDP $${(e.gdpTrillions * 1000).toFixed(3)}B (${years.gdpTrillions}) · ${sources[0].label.split(" — ")[0]}`}`,
    );
  }

  const ids = new Set(economiesData.filter((x) => !x.dataSources && !x.noFiguresReason).map((x) => x.id));
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error("duplicate id " + e.id);
    ids.add(e.id);
  }

  const lit = (v) => (typeof v === "number" && Number.isNaN(v) ? "NaN" : JSON.stringify(v));
  const obj = (o) =>
    "{ " +
    Object.entries(o)
      .map(([k, v]) =>
        Array.isArray(v) && v.length && typeof v[0] === "object"
          ? `${k}: [${v.map(obj).join(", ")}]`
          : v && typeof v === "object" && !Array.isArray(v)
            ? `${k}: ${obj(v)}`
            : `${k}: ${lit(v)}`,
      )
      .join(", ") +
    " }";
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Economy cards for the places on the site the World Bank publishes no GDP
 * for, so neither economiesData.ts nor economiesMore.ts covers them.
 *
 * GENERATED by build-remaining-economies.cjs on ${today} — do not edit by
 * hand; change the script and re-run it.
 *
 * Each card holds what an official body publishes for the place - the UN
 * Statistics Division, the Pacific Community, Eurostat, Statistics
 * Netherlands, Statistics Jersey, or the place's own statistics office -
 * named in dataSources, with the year of each figure in figureYears. NaN is
 * "not published". A place no source covers carries noFiguresReason instead
 * of figures.
 */
import type { Economy } from "./economiesData";

export const REMAINING_ECONOMIES: Economy[] = [
${entries.map((e) => "  " + obj(e) + ",").join("\n")}
];
`,
  );
  console.log(`wrote ${entries.length} economies to ${path.relative(__dirname, OUT)}`);
  for (const r of report) console.log(r);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
