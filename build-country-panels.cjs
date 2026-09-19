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
  wpp: { label: "UN — World Population Prospects 2024 (via Our World in Data)", url: "https://ourworldindata.org/grapher/median-age" },
  iea: { label: "IEA — Global EV Outlook (via Our World in Data)", url: "https://ourworldindata.org/grapher/electric-car-sales-share" },
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
  const series = {};
  for (const [f, spec] of Object.entries(WB)) series[f] = await worldBank(spec.code);
  const bandSeries = {};
  for (const b of [...new Set(Object.values(BANDS).flat())])
    for (const sex of ["MA", "FE"]) bandSeries[b + sex] = await worldBank(`SP.POP.${b}.${sex}.5Y`);
  const popM = await worldBank("SP.POP.TOTL.MA.IN");
  const popF = await worldBank("SP.POP.TOTL.FE.IN");
  const median = await owid("median-age", "median_age__sex_all__age_all__variant_estimates");
  const cpi = await owid("ti-corruption-perception-index", "cpi_score");
  const ev = await owid("electric-car-sales-share", "ev_sales_share");
  const undp = await hdr();

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
    put("hdi", undp[i3]?.hdi, 3, "hdr");
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

  const fields = [...Object.keys(WB), ...Object.keys(BANDS), "medianAge", "cpiScore", "evSalesShare", "hdi", "schoolingYears"];
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
