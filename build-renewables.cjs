#!/usr/bin/env node
/**
 * build-renewables.cjs
 *
 * The Trends page's section on renewable power: what each kind generates and
 * how much of it is installed, what it has come to cost, what is invested in
 * it, what is projected for it, and which countries lead. Written to
 * src/data/renewables.ts.
 *
 * SOURCES - every figure is its publisher's, read from the file named
 *   Ember, yearly electricity data (via Our World in Data)
 *     electricity generated in the world by source, year by year, and the
 *     countries that generate most from the sun and the wind.
 *   IRENA, Renewable Capacity Statistics (via Our World in Data)
 *     installed capacity by technology - solar photovoltaic, concentrated
 *     solar, onshore and offshore wind, hydropower, bioenergy, geothermal,
 *     marine - and by country for solar, wind and geothermal.
 *   IRENA, Renewable Power Generation Costs (via Our World in Data)
 *     the levelised cost of electricity from a new plant, by technology.
 *   IRENA; Nemet (2009); Farmer and Lafond (2016) (via Our World in Data)
 *     the price of solar modules since 1975.
 *   Way (2026), on Ziegler and Trancik (2021), BloombergNEF and Avicenne
 *   Energy (via Our World in Data): the price of lithium-ion battery cells.
 *   Frankfurt School-UNEP Centre / BloombergNEF, Global Trends in Renewable
 *   Energy Investment 2020 (via Our World in Data)
 *     new investment by technology, 2004 to 2019 - the last year its file has.
 *   OECD and IRENA, SDG indicator 7.a.1 (via Our World in Data)
 *     international public finance to developing countries for clean energy.
 *   U.S. Energy Information Administration, International Energy Outlook 2023
 *     (eia.gov/outlooks/ieo, the figures file of its narrative)
 *     the world's electricity generation and generating capacity by type in
 *     2022 and as EIA projects them for 2050, in its Reference case and its
 *     six side cases. The lowest and highest of the seven cases are given as
 *     the range; EIA puts no probability on any of them, and nor does this.
 *
 * WHAT IS WORKED OUT HERE
 *   A country's share of the world's total (a part over the same source's
 *   total for the same year); small hydro, geothermal and marine investment
 *   added together as "other"; and 2050 generation as EIA's 2022 figure plus
 *   the change it publishes - checked against its own 2050 total.
 *
 * Usage:  node build-renewables.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");
const { readXlsx, unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/renewables.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-renewables");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);

function fetchTo(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    let failure = "";
    for (let attempt = 1; attempt <= 3 && !fs.existsSync(at); attempt++) {
      try {
        execFileSync("curl", ["-sSfL", "-m", "180", "-A", UA, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        fs.rmSync(at, { force: true });
        failure = String(e.stderr || e.message).trim().split("\n")[0];
        execSync(process.platform === "win32" ? "ping -n 16 127.0.0.1 > NUL" : "sleep 15");
      }
    }
    if (!fs.existsSync(at)) throw new Error(`${url}: ${failure}`);
  }
  return at;
}
const get = (url, name) => fs.readFileSync(fetchTo(url, name), "utf8");
const round = (v, dp) => Number(Number(v).toFixed(dp));

// ── Names ─────────────────────────────────────────────────────────────────

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}
const SITE_NAME = new Map(loadCountries().map((c) => [c.code, c.name]));
const WB_LIST = JSON.parse(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
/** Economies, as against aggregates: ISO3 → ISO2. */
const ISO2 = new Map(WB_LIST.filter((c) => c.region?.id && c.region.id !== "NA").map((c) => [c.id, c.iso2Code]));
const nameOf = (iso3, fallback) => SITE_NAME.get(ISO2.get(iso3)) ?? fallback;

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

/** An OWID grapher file as { entity: { code, cols: { column: { year: value } } } }; some files have no code column. */
function owid(slug) {
  const lines = get(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `owid-${slug}-${TODAY}.csv`).trim().split(/\r?\n/);
  const head = splitCsvLine(lines[0]);
  const coded = head[1] === "code";
  const at = coded ? 3 : 2;
  if (head[0] !== "entity" || head[at - 1] !== "year") throw new Error(`OWID ${slug}: columns are ${head.join()}`);
  const entities = {};
  for (const l of lines.slice(1)) {
    const cells = splitCsvLine(l);
    const e = (entities[cells[0]] ||= { code: coded ? cells[1] : "", cols: {} });
    const y = Number(cells[at - 1]);
    head.slice(at).forEach((h, i) => {
      const raw = cells[i + at];
      if (raw === "" || raw === undefined || !Number.isFinite(Number(raw))) return;
      (e.cols[h] ||= {})[y] = Number(raw);
    });
  }
  return { slug, head: head.slice(at), entities };
}
const col = (file, name) => {
  if (!file.head.includes(name)) throw new Error(`OWID ${file.slug}: no column ${name} among ${file.head.join()}`);
  return name;
};
const owidSource = (label, slug) => ({ label: `${label} (via Our World in Data)`, url: `https://ourworldindata.org/grapher/${slug}` });
/** An entity's series of a column, from a year on. */
function series(file, entity, column, dp, from = 0) {
  const years = file.entities[entity]?.cols[col(file, column)];
  if (!years) throw new Error(`OWID ${file.slug}: no ${column} for ${entity}`);
  const out = Object.entries(years)
    .map(([y, v]) => [Number(y), round(v, dp)])
    .filter(([y]) => y >= from)
    .sort((a, b) => a[0] - b[0]);
  if (out.length < 5) throw new Error(`OWID ${file.slug}: ${entity} ${column} has ${out.length} points`);
  return out;
}
const lastOf = (s) => s[s.length - 1];

/** The countries with the most of a column in the world's latest year, each with its share of the world's. */
function leaders(file, column, dp, n = 8) {
  const c = col(file, column);
  const world = file.entities.World?.cols[c];
  if (!world) throw new Error(`OWID ${file.slug}: no world ${column}`);
  const year = Math.max(...Object.keys(world).map(Number));
  const rows = Object.entries(file.entities)
    .filter(([, e]) => ISO2.has(e.code) && e.cols[c]?.[year] > 0)
    .map(([name, e]) => ({ n: nameOf(e.code, name), c: ISO2.get(e.code), v: round(e.cols[c][year], dp) }))
    .sort((a, b) => b.v - a.v);
  const total = round(world[year], dp);
  if (rows.length < n) throw new Error(`OWID ${file.slug}: only ${rows.length} countries for ${year}`);
  if (rows[0].v > total) throw new Error(`OWID ${file.slug}: ${rows[0].n} has more than the world`);
  return { year, total, countries: rows.length, rows: rows.slice(0, n) };
}

// ── EIA's International Energy Outlook ────────────────────────────────────

const EIA = { label: "U.S. Energy Information Administration — International Energy Outlook 2023", url: "https://www.eia.gov/outlooks/ieo/" };
const EIA_CASES = ["Ref", "HM", "LM", "HP", "LP", "HZ", "LZ"];

function eiaOutlook() {
  const file = fetchTo("https://www.eia.gov/outlooks/ieo/excel/IEO2023_Narrative_AllFigures.xlsx", `ieo2023-figures-${TODAY}.xlsx`);
  const zip = unzip(file);
  const sheets = [...zip.get("xl/workbook.xml").toString("utf8").matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => [m[1], m[2]]);
  const rels = Object.fromEntries([...zip.get("xl/_rels/workbook.xml.rels").toString("utf8").matchAll(/<Relationship ([^>]*)\/>/g)].map((m) => [/Id="([^"]+)"/.exec(m[1])[1], /Target="([^"]+)"/.exec(m[1])[1]]));
  const rowsOf = (name) => {
    const s = sheets.find(([n]) => n === name);
    if (!s) throw new Error(`IEO2023: no sheet ${name}`);
    return readXlsx(file, `xl/${rels[s[1]]}`).rows.map((r) => r.map((c) => (c ?? "").toString().trim()));
  };
  /** A figure's table: the row that starts "Fuel", then a row a fuel until the first empty one. */
  const table = (name, title) => {
    const rows = rowsOf(name);
    if (!rows.some((r) => r.includes(title))) throw new Error(`IEO2023 ${name}: not "${title}"`);
    const h = rows.findIndex((r) => r.includes("Fuel"));
    const at = rows[h].indexOf("Fuel");
    const head = rows[h].slice(at);
    if (head.slice(1, 9).join() !== ["2022", ...EIA_CASES].join()) throw new Error(`IEO2023 ${name}: columns are ${head.join()}`);
    const out = {};
    for (const r of rows.slice(h + 1)) {
      const label = r[at];
      if (!label) break;
      out[label] = Object.fromEntries(head.slice(1, 9).map((k, i) => [k, Number(r[at + 1 + i])]));
    }
    return { out, differences: rows.some((r) => r.includes("Difference in 2050 from 2022")) };
  };

  const gen = table("fig_25", "Electricity generation by type, change in 2050 from 2022, world");
  if (!gen.differences) throw new Error("IEO2023 fig_25: no longer given as the change from 2022");
  const cap = table("fig_26", "Electricity generating capacity, world");
  if (cap.differences) throw new Error("IEO2023 fig_26: now given as a change");

  // 2050 generation is 2022's plus the change. EIA's own yearly series of the world total says whether that reading is right.
  const totals = rowsOf("fig_24");
  const t = totals.findIndex((r) => r.includes("World total generation"));
  const years = totals.slice(t).find((r) => r.includes("Case"));
  const ref = totals.slice(t).find((r) => r.includes("Ref"));
  const total2050 = Number(ref[years.indexOf("2050")]);
  const net = gen.out["Net generation to grid"];
  if (!(Math.abs(net["2022"] + net.Ref - total2050) < 1)) throw new Error(`IEO2023: 2022 + change is ${net["2022"] + net.Ref}, its 2050 total is ${total2050}`);

  const kinds = [
    ["Solar", "solar"],
    ["Wind", "wind"],
    ["Hydro", "hydro"],
    ["Other renewables", "other"],
    ["Nuclear", "nuclear"],
    ["Natural gas", "gas"],
    ["Coal", "coal"],
  ];
  const row = (t2, label, key, absolute) => {
    const r = t2[label];
    if (!r || !Number.isFinite(r["2022"]) || EIA_CASES.some((c) => !Number.isFinite(r[c]))) throw new Error(`IEO2023: no ${label}`);
    const at2050 = EIA_CASES.map((c) => (absolute ? r[c] : r["2022"] + r[c]));
    return { key, base: round(r["2022"], 0), ref: round(at2050[0], 0), low: round(Math.min(...at2050), 0), high: round(Math.max(...at2050), 0) };
  };
  return {
    base: 2022,
    year: 2050,
    generation: kinds.map(([label, key]) => row(gen.out, label, key, false)),
    capacity: [...kinds.map(([label, key]) => row(cap.out, label, key, true)), row(cap.out, "Battery storage", "battery", true)],
    source: EIA,
  };
}

// ── Build ─────────────────────────────────────────────────────────────────

function main() {
  const FROM = 2000;

  // Generation by source (Ember).
  const gen = owid("electricity-prod-source-stacked");
  const GEN = [
    ["solar", "solar_generation__twh"],
    ["hydro", "hydro_generation__twh"],
    ["wind", "wind_generation__twh"],
    ["other", "other_renewables_generation__twh"],
    ["bioenergy", "bioenergy_stacked_generation__twh"],
  ];
  const genSeries = Object.fromEntries(GEN.map(([k, c]) => [k, series(gen, "World", c, 0, FROM)]));
  const genYears = genSeries.solar.map(([y]) => y);
  const generation = genYears.map((y) => ({ year: y, ...Object.fromEntries(GEN.map(([k]) => [k, genSeries[k].find(([x]) => x === y)?.[1] ?? null])) }));
  const allColumns = gen.head.filter((h) => h.endsWith("generation__twh"));
  const everything = (y) => allColumns.reduce((t, c) => t + (gen.entities.World.cols[c]?.[y] ?? 0), 0);
  const genYear = lastOf(genYears);

  // Capacity by technology (IRENA).
  const cap = owid("installed-global-renewable-energy-capacity-by-technology");
  const solarCap = owid("installed-solar-pv-capacity");
  const windCap = owid("cumulative-installed-wind-energy-capacity-gigawatts");
  const geoCap = owid("installed-geothermal-capacity");
  const irena = (slug) => owidSource("IRENA — Renewable Capacity Statistics", slug);
  const kinds = [
    { key: "solarPv", name: "Solar photovoltaic", entity: "Solar photovoltaic", about: "Panels that turn sunlight straight into electricity, on roofs and in solar farms." },
    { key: "onshoreWind", name: "Onshore wind", entity: "Onshore wind", about: "Wind turbines on land." },
    { key: "offshoreWind", name: "Offshore wind", entity: "Offshore wind", about: "Wind turbines at sea, fixed to the seabed or floating." },
    { key: "hydro", name: "Hydropower", entity: "Hydropower", about: "Dams and run-of-river plants. Pumped storage, which stores power rather than making it, is not counted." },
    { key: "bioenergy", name: "Bioenergy", entity: "Bioenergy (total)", about: "Power from burning solid biofuels, biogas, liquid biofuels and renewable municipal waste." },
    { key: "geothermal", name: "Geothermal", entity: "Geothermal", about: "Power from the heat of the Earth's crust." },
    { key: "csp", name: "Concentrated solar power", entity: "Concentrated solar power", about: "Mirrors that focus sunlight to make heat, which drives a turbine." },
    { key: "marine", name: "Marine", entity: "Marine", about: "Power from tides, waves and ocean currents." },
  ].map((k) => ({ key: k.key, name: k.name, about: k.about, series: series(cap, k.entity, "capacity", 2, FROM), source: irena("installed-global-renewable-energy-capacity-by-technology") }));
  const totalCap = series(cap, "All renewables (total)", "capacity", 0, FROM);
  // By country, where IRENA's file gives it: solar and wind as totals, geothermal in megawatts.
  const solarLeaders = leaders(solarCap, "solar__total_gw", 1);
  const windLeaders = leaders(windCap, "wind__total_gw", 1);
  const geoLeaders = leaders(geoCap, "geothermal__total", 0);
  const withCountries = (key, title, l, unit, slug) => Object.assign(kinds.find((k) => k.key === key), { countries: { title, unit, ...l, source: irena(slug) } });
  withCountries("solarPv", "Solar capacity by country, photovoltaic and concentrated together", solarLeaders, "GW", "installed-solar-pv-capacity");
  withCountries("onshoreWind", "Wind capacity by country, onshore and offshore together", windLeaders, "GW", "cumulative-installed-wind-energy-capacity-gigawatts");
  withCountries("geothermal", "Geothermal capacity by country", geoLeaders, "MW", "installed-geothermal-capacity");

  // Who generates most from the sun and the wind (Ember).
  const solarGen = owid("solar-energy-consumption");
  const windGen = owid("wind-generation");
  const generators = {
    solar: { ...leaders(solarGen, "solar_generation__twh", 1), source: owidSource("Ember", "solar-energy-consumption") },
    wind: { ...leaders(windGen, "wind_generation__twh", 1), source: owidSource("Ember", "wind-generation") },
  };

  // Costs.
  const lcoe = owid("levelized-cost-of-energy");
  const COSTS = [
    ["solarPv", "Solar photovoltaic", "solar_photovoltaic"],
    ["hydro", "Hydropower", "hydropower"],
    ["onshoreWind", "Onshore wind", "onshore_wind"],
    ["offshoreWind", "Offshore wind", "offshore_wind"],
    ["bioenergy", "Bioenergy", "bioenergy"],
    ["geothermal", "Geothermal", "geothermal"],
    ["csp", "Concentrated solar power", "concentrated_solar_power"],
  ];
  const costs = COSTS.map(([key, name, c]) => ({ key, name, series: series(lcoe, "World", c, 3, 2010) }));
  const modules = series(owid("solar-pv-prices"), "World", "cost", 2);
  const cells = series(owid("price-of-lithium-ion-battery-cells"), "World", "price", 0);
  if (!(modules[0][1] > 50 && lastOf(modules)[1] < 1)) throw new Error("solar-pv-prices: not dollars a watt from the 1970s");
  if (!(cells[0][1] > 1000 && lastOf(cells)[1] < 500)) throw new Error("battery cells: not dollars a kilowatt-hour from the 1990s");

  // Investment.
  const inv = owid("investment-in-renewable-energy-by-technology");
  const invYears = Object.keys(inv.entities.World.cols[col(inv, "solar")]).map(Number).sort((a, b) => a - b);
  const bn = (c, y) => (inv.entities.World.cols[col(inv, c)]?.[y] ?? 0) / 1e9;
  const investment = invYears.map((y) => ({
    year: y,
    solar: round(bn("solar", y), 1),
    wind: round(bn("wind", y), 1),
    biofuels: round(bn("biofuels", y), 1),
    biomass: round(bn("biomass_and_waste", y), 1),
    other: round(bn("small_hydro", y) + bn("geothermal", y) + bn("marine", y), 1),
  }));
  if (!(lastOf(investment).solar > 50 && lastOf(investment).solar < 500)) throw new Error("renewables investment: not billions of dollars");

  const fin = owid("international-finance-clean-energy");
  const finCol = fin.head[0];
  const finance = { series: series(fin, "World", finCol, 0, FROM).map(([y, v]) => [y, round(v / 1e9, 2)]), ...leaders(fin, finCol, 0), source: owidSource("OECD and IRENA — SDG indicator 7.a.1", "international-finance-clean-energy") };
  finance.total = round(finance.total / 1e9, 2);
  finance.rows = finance.rows.map((r) => ({ ...r, v: round(r.v / 1e9, 2) }));

  const outlook = eiaOutlook();

  // Sanity: the figures are the size they should be.
  const solarNow = lastOf(genSeries.solar)[1];
  if (!(solarNow > 1500 && solarNow < 10000)) throw new Error(`Solar generation of ${solarNow} TWh`);
  const pv = kinds.find((k) => k.key === "solarPv");
  if (!(lastOf(pv.series)[1] > 1000)) throw new Error("Solar photovoltaic capacity under 1,000 GW");
  if (!(outlook.generation.find((g) => g.key === "solar").ref > outlook.generation.find((g) => g.key === "solar").base)) throw new Error("EIA: solar does not grow");

  const j = (v) => JSON.stringify(v);
  fs.writeFileSync(
    OUT,
    `/**
 * Renewable power, for the Trends page: what each kind generates, how much
 * of it is installed and where, what it costs, what is invested in it, and
 * what the U.S. EIA projects for it.
 *
 * GENERATED by build-renewables.cjs on ${TODAY} — do not edit by hand; change
 * the script and re-run it. The script lists every source.
 */
export const RENEWABLES_RETRIEVED = "${TODAY}";

export type YearValue = [year: number, value: number];
export interface Source {
  label: string;
  url: string;
}
/** A country in a ranking: its name on this site, its ISO2 code for the flag, and its figure. */
export interface Leader {
  n: string;
  c: string;
  v: number;
}
export interface Leaders {
  year: number;
  /** The world's total for the year, which the countries are shares of. */
  total: number;
  /** How many countries the source has a figure for. */
  countries: number;
  rows: Leader[];
  source: Source;
}

/** Electricity generated in the world from each renewable source, TWh a year. */
export const RENEWABLE_GENERATION: { year: number; solar: number; hydro: number; wind: number; other: number; bioenergy: number }[] = ${j(generation)};
/** All the electricity generated in the world in the latest of those years, TWh: what the sources are shares of. */
export const WORLD_GENERATION = { year: ${genYear}, twh: ${round(everything(genYear), 0)} };
export const RENEWABLE_GENERATION_SOURCE: Source = ${j(owidSource("Ember", "electricity-prod-source-stacked"))};

export interface RenewableKind {
  key: string;
  name: string;
  about: string;
  /** Installed capacity in the world, gigawatts. */
  series: YearValue[];
  source: Source;
  /** The countries with the most, where the source gives countries. */
  countries?: Leaders & { title: string; unit: string };
}
export const RENEWABLE_KINDS: RenewableKind[] = ${j(kinds)};
/** All renewable generating capacity in the world, gigawatts. */
export const RENEWABLE_CAPACITY_TOTAL: YearValue[] = ${j(totalCap)};

/** The countries generating the most electricity from the sun and from the wind, TWh. */
export const RENEWABLE_GENERATORS: { solar: Leaders; wind: Leaders } = ${j(generators)};

/** The levelised cost of electricity from a new plant, by technology: constant 2025 US dollars a kilowatt-hour. */
export const RENEWABLE_COSTS: { key: string; name: string; series: YearValue[] }[] = ${j(costs)};
export const RENEWABLE_COSTS_SOURCE: Source = ${j(owidSource("IRENA — Renewable Power Generation Costs", "levelized-cost-of-energy"))};
/** The price of solar modules, constant 2025 US dollars a watt. */
export const SOLAR_MODULE_PRICE: { series: YearValue[]; source: Source } = ${j({ series: modules, source: owidSource("IRENA; Nemet (2009); Farmer and Lafond (2016)", "solar-pv-prices") })};
/** The price of lithium-ion battery cells, constant 2024 US dollars a kilowatt-hour. */
export const BATTERY_CELL_PRICE: { series: YearValue[]; source: Source } = ${j({ series: cells, source: owidSource("Way (2026), on Ziegler and Trancik (2021), BloombergNEF and Avicenne Energy", "price-of-lithium-ion-battery-cells") })};

/** New investment in renewable power by technology, US$ billions a year. "Other" is small hydropower, geothermal and marine, added together. */
export const RENEWABLE_INVESTMENT: { year: number; solar: number; wind: number; biofuels: number; biomass: number; other: number }[] = ${j(investment)};
export const RENEWABLE_INVESTMENT_SOURCE: Source = ${j(owidSource("Frankfurt School-UNEP Centre / BloombergNEF, Global Trends in Renewable Energy Investment 2020", "investment-in-renewable-energy-by-technology"))};

/** International public finance to developing countries for clean energy, US$ billions at constant prices: the world year by year, and who received most. */
export const CLEAN_ENERGY_FINANCE: Leaders & { series: YearValue[] } = ${j(finance)};

/** One kind of power in EIA's outlook: 2022, and 2050 in its Reference case and at the lowest and highest of its seven cases. */
export interface OutlookRow {
  key: string;
  base: number;
  ref: number;
  low: number;
  high: number;
}
/** The world's electricity by type as the U.S. EIA projects it: generation in TWh, capacity in GW. */
export const RENEWABLE_OUTLOOK: { base: number; year: number; generation: OutlookRow[]; capacity: OutlookRow[]; source: Source } = ${j(outlook)};
`,
  );
  console.log(`Generation ${genYears[0]}–${genYear}: solar ${solarNow} TWh, wind ${lastOf(genSeries.wind)[1]}, hydro ${lastOf(genSeries.hydro)[1]} of ${round(everything(genYear), 0)}`);
  for (const k of kinds) console.log(`  ${k.name.padEnd(26)} ${String(lastOf(k.series)[1]).padStart(8)} GW in ${lastOf(k.series)[0]}${k.countries ? ` · ${k.countries.rows[0].n} leads` : ""}`);
  console.log(`Costs ${costs.map((c) => `${c.key} $${lastOf(c.series)[1]}`).join(", ")}`);
  console.log(`Modules $${modules[0][1]}/W in ${modules[0][0]} → $${lastOf(modules)[1]} in ${lastOf(modules)[0]}; cells $${cells[0][1]}/kWh in ${cells[0][0]} → $${lastOf(cells)[1]} in ${lastOf(cells)[0]}`);
  console.log(`Investment ${investment[0].year}–${lastOf(investment).year}; finance $${lastOf(finance.series)[1]}bn in ${lastOf(finance.series)[0]}, most to ${finance.rows[0].n}`);
  console.log(`EIA ${outlook.base}→${outlook.year}: ${outlook.generation.map((g) => `${g.key} ${g.base}→${g.ref} (${g.low}–${g.high})`).join("; ")}`);
  console.log(`Wrote ${path.relative(__dirname, OUT)}`);
}

main();
