#!/usr/bin/env node
/**
 * build-trend-details.cjs
 *
 * What stands behind each world figure of the Trends page: the same measure
 * by region, by income group and by country, its make-up by type, and - where
 * a body publishes it - the investment behind it. Written to
 * src/data/trendDetails.ts, for the window each trend card opens.
 *
 * Run it after build-worldview.cjs: it reads the world series that script
 * wrote (src/data/worldview.ts) for each figure's latest year and its source,
 * and it shares that script's download cache.
 *
 * SOURCES
 *   World Bank, World Development Indicators (api.worldbank.org)
 *     Every figure the World Bank publishes for the world it also publishes
 *     for its seven regions, its four income groups and each economy. The
 *     regions and groups are the Bank's own aggregates, not sums made here.
 *   Our World in Data's grapher files (ourworldindata.org/grapher/<slug>.csv)
 *     Ember (electricity by source and by region), the Energy Institute
 *     (fossil fuels' share by region), the IEA's Global EV Outlook (electric
 *     cars by kind and by market), the Global Carbon Budget (CO₂ by fuel),
 *     Frankfurt School-UNEP Centre/BNEF (investment in renewables by
 *     technology, to 2019 - the last year that file holds), Quid via the AI
 *     Index (private AI investment by place), the International Federation
 *     of Robotics, CSET (AI publications), the Uppsala Conflict Data Program
 *     (conflicts and deaths by region), and the Federation of American
 *     Scientists (warheads by country).
 *   UNHCR Refugee Data Finder (api.unhcr.org)
 *     The displaced by country of origin and by country of asylum.
 *
 * FIGURES OF ITS OWN
 *   Two world series the Worldview page does not carry are built here too,
 *   for the Trends page's research and development group, in the shape of
 *   worldview.ts's indicators: objects launched into space (UN Office for
 *   Outer Space Affairs), with what is in orbit (US Space Force), what a
 *   kilogram costs to launch by rocket and who has flown (CSIS Aerospace
 *   Security Project); and nuclear power's share of electricity (Ember),
 *   with who generates it. All are read from Our World in Data's files.
 *
 * RECORDED, AND CHECKED AGAINST ITS PAGE
 *   Fusion has no world series: it is still experiments. What the page says
 *   of ITER - who is building it and who pays what share, what it is
 *   designed to do, and when - is the ITER Organization's own account
 *   (iter.org/few-lines). It is written out below, and each run of this
 *   script fetches that page and stops if a figure quoted is no longer on
 *   it.
 *
 * WHAT IS WORKED OUT HERE
 *   Only shares: a part divided by the same source's total for the same
 *   year. A share is given only where the parts are parts of that total -
 *   where a source's parts do not add up to its total (a research paper
 *   counted for each of its authors' countries), the script gives the parts
 *   and no shares. Nothing is estimated or filled in: a region, group or
 *   country with no published value is left out.
 *
 * Usage:  node build-trend-details.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/trendDetails.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-worldview");
fs.mkdirSync(CACHE, { recursive: true });

function get(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    let failure = "";
    for (let attempt = 1; attempt <= 3 && !fs.existsSync(at); attempt++) {
      try {
        execFileSync("curl", ["-sSfL", "-m", "180", "-A", UA, "-H", "Accept-Language: en", "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        fs.rmSync(at, { force: true });
        failure = String(e.stderr || e.message).trim().split("\n")[0];
        execSync(process.platform === "win32" ? "ping -n 16 127.0.0.1 > NUL" : "sleep 15");
      }
    }
    if (!fs.existsSync(at)) throw new Error(`${url}: ${failure}`);
  }
  return fs.readFileSync(at, "utf8");
}

const round = (v, dp) => Number(Number(v).toFixed(dp));

// ── The world series this script adds to ──────────────────────────────────

const WORLDVIEW = fs.readFileSync(path.join(__dirname, "src/data/worldview.ts"), "utf8");
function world(id) {
  const m = new RegExp(`^  "${id}": (\\{.*\\}),?$`, "m").exec(WORLDVIEW);
  if (!m) throw new Error(`worldview.ts has no "${id}"`);
  return JSON.parse(m[1]);
}
const latest = (ind) => ind.series[ind.series.length - 1];

// ── Names ─────────────────────────────────────────────────────────────────

/** The site's own countries, for the names it calls them by. */
function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}
const SITE_NAME = new Map(loadCountries().map((c) => [c.code, c.name]));

const WB_LIST = JSON.parse(get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json"))[1];
/** Economies, as against the Bank's aggregates: ISO3 → ISO2. */
const ISO2 = new Map(WB_LIST.filter((c) => c.region?.id && c.region.id !== "NA").map((c) => [c.id, c.iso2Code]));
const WB_NAME = new Map(WB_LIST.map((c) => [c.id, c.name.trim()]));
/** The API leaves the ISO3 code of some aggregates (the income groups) blank on a data row, and gives only its two-character one. */
const WB_ID = new Map(WB_LIST.map((c) => [c.iso2Code, c.id]));
const nameOf = (iso3, fallback) => SITE_NAME.get(ISO2.get(iso3)) ?? fallback ?? WB_NAME.get(iso3) ?? iso3;

const WB_REGIONS = ["EAS", "ECS", "LCN", "MEA", "NAC", "SAS", "SSF"];
const WB_INCOMES = ["HIC", "UMC", "LMC", "LIC"];
const tidy = (s) => s.trim().replace(/ & /g, " and ");

// ── World Bank ────────────────────────────────────────────────────────────

/** Every economy's and aggregate's value of a series by year: { ISO3: { year: value } }. */
function wbAll(code) {
  const j = JSON.parse(get(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=20000&date=2005:${new Date().getFullYear()}`, `wb-detail-${code}.json`));
  if (!Array.isArray(j) || !j[1]) throw new Error(`World Bank ${code}: no data`);
  if (j[0].pages > 1) throw new Error(`World Bank ${code}: more than one page`);
  const out = {};
  for (const r of j[1]) {
    const id = r.countryiso3code || WB_ID.get(r.country?.id);
    if (r.value === null || !Number.isFinite(r.value) || !id) continue;
    (out[id] ||= {})[Number(r.date)] = r.value;
  }
  return out;
}

const POP = wbAll("SP.POP.TOTL");
const popOf = (iso3) => {
  const years = POP[iso3];
  return years ? years[Math.max(...Object.keys(years).map(Number))] : 0;
};
/** The ten economies with the most people, most first. */
const POPULOUS = [...ISO2.keys()].sort((a, b) => popOf(b) - popOf(a)).slice(0, 10);

const wbSource = (code) => ({ label: "World Bank — World Development Indicators", url: `https://data.worldbank.org/indicator/${code}` });

/** The latest year, from `y0` back six, in which at least `min` of `codes` have a value. */
function yearWith(data, codes, y0, min) {
  for (let y = y0; y >= y0 - 6; y--) if (codes.filter((c) => data[c]?.[y] !== undefined).length >= min) return y;
  return null;
}

/**
 * A World Bank figure by region, income group and country. `sum` says the
 * figure is a total (tonnes, dollars, articles), so its parts are given with
 * their share of the world's; otherwise it is a rate, and each part has its
 * own reading of the same measure.
 */
function wbDetail(id, { sum = false } = {}) {
  const ind = world(id);
  const code = /indicator\/([A-Z0-9.]+)/.exec(ind.source.url)?.[1];
  if (!code) throw new Error(`${id}: not a World Bank series`);
  const data = wbAll(code);
  const [y0] = latest(ind);
  const dp = sum ? (ind.format === "num" ? 1 : 0) : ind.dp;
  const source = wbSource(code);
  const tables = [];
  const facts = [];

  const aggregate = (key, title, what, codes, min) => {
    const y = yearWith(data, codes, y0, min);
    if (y === null) return;
    const rows = codes
      .filter((c) => data[c]?.[y] !== undefined)
      .map((c) => {
        const was = data[c][y - 10];
        return { n: tidy(WB_NAME.get(c)), v: round(data[c][y], dp), ...(was !== undefined ? { was: [y - 10, round(was, dp)] } : {}) };
      })
      .sort((a, b) => b.v - a.v);
    const table = { key, title, kicker: `${what} · ${y}`, kind: "rate", as: "figure", rows, source };
    if (sum && data.WLD?.[y] !== undefined && rows.length === codes.length) {
      const total = rows.reduce((t, r) => t + r.v, 0);
      // Parts of the world's total add up to no more than it (less, where some of it belongs to no region - fuel burnt
      // by ships and aircraft between countries); where a set's sum is more than the world's, no share is claimed.
      if (total <= data.WLD[y] * 1.005) Object.assign(table, { kind: "share", total: round(data.WLD[y], dp) });
      else console.warn(`  ${id}: ${key} add up to ${((100 * total) / data.WLD[y]).toFixed(0)}% of the world's - no shares given`);
      if (table.kind === "share" && total < data.WLD[y] * 0.97) table.note = `These add up to ${((100 * total) / data.WLD[y]).toFixed(0)}% of the world's total; the rest the source assigns to none of them.`;
    }
    tables.push(table);
  };
  aggregate("regions", "By region", "The World Bank's regions", WB_REGIONS, 5);
  aggregate("incomes", "By income group", "Countries grouped by income per person", WB_INCOMES, 3);

  // Countries: the year most of them have reported, not the newest one a few have.
  const economies = [...ISO2.keys()];
  const reported = (y) => economies.filter((c) => data[c]?.[y] !== undefined);
  const most = Math.max(...Array.from({ length: 7 }, (_, i) => reported(y0 - i).length));
  let yc = null;
  for (let y = y0; y >= y0 - 6 && yc === null; y--) if (reported(y).length >= 0.8 * most && reported(y).length >= 20) yc = y;
  if (yc !== null) {
    const row = (c) => ({ n: nameOf(c), c: ISO2.get(c), v: round(data[c][yc], dp) });
    if (sum) {
      const rows = reported(yc).map(row).sort((a, b) => b.v - a.v).slice(0, 8);
      const table = { key: "countries", title: "The largest", kicker: `Countries · ${yc}`, kind: "rate", as: "figure", rows, source };
      if (data.WLD?.[yc] !== undefined) Object.assign(table, { kind: "share", total: round(data.WLD[yc], dp) });
      tables.push(table);
    } else {
      const rows = POPULOUS.filter((c) => data[c]?.[yc] !== undefined).map(row).sort((a, b) => b.v - a.v);
      if (rows.length >= 5) tables.push({ key: "countries", title: "In the most populous countries", kicker: `The ten countries with the most people, where reported · ${yc}`, kind: "rate", as: "figure", rows, source });
      // Highest and lowest among countries of a million people or more: the smallest states swing widest.
      const sized = reported(yc).filter((c) => popOf(c) >= 1e6).sort((a, b) => data[b][yc] - data[a][yc]);
      if (sized.length >= 20) {
        // Where several countries share the highest or lowest reading, the fact says how many rather than naming one of them.
        const extreme = (label, c) => {
          const v = round(data[c][yc], dp);
          const tied = sized.filter((x) => round(data[x][yc], dp) === v);
          return { label, v, as: "figure", sub: `${tied.length > 1 ? `${tied.length} economies` : nameOf(c)} · ${yc}` };
        };
        facts.push(extreme("Highest economy", sized[0]), extreme("Lowest economy", sized[sized.length - 1]));
        facts.push({ label: "Economies reporting", v: reported(yc).length, as: "count", sub: `${yc}` });
      }
    }
  }
  return { tables, facts, notes: sum ? [] : facts.length ? ["The highest and lowest economies are among the World Bank's economies of a million people or more."] : [] };
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

/** An OWID grapher file as { entity: { code, [column]: { year: value } } }. */
function owid(slug) {
  const lines = get(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `owid-${slug}.csv`).trim().split(/\r?\n/);
  const head = splitCsvLine(lines[0]);
  // Most files are entity, code, year, then the figures; one about things that are not countries has no code.
  const coded = head[1] === "code";
  const at = coded ? 3 : 2;
  if (head[0] !== "entity" || head[at - 1] !== "year") throw new Error("OWID " + slug + ": columns are " + head.join());
  const out = {};
  for (const l of lines.slice(1)) {
    const cells = splitCsvLine(l);
    const e = (out[cells[0]] ||= { code: coded ? cells[1] : "", cols: {} });
    const y = Number(cells[at - 1]);
    head.slice(at).forEach((h, i) => {
      const raw = cells[i + at];
      if (raw === "" || raw === undefined || !Number.isFinite(Number(raw))) return;
      (e.cols[h] ||= {})[y] = Number(raw);
    });
  }
  return { head: head.slice(at), entities: out };
}
const owidSource = (label, slug) => ({ label: `${label} (via Our World in Data)`, url: `https://ourworldindata.org/grapher/${slug}` });
/** A column by the end of its name, as build-worldview.cjs finds them. */
const colOf = (file, suffix) => {
  const hit = file.head.filter((h) => h === suffix || h.endsWith(suffix));
  if (hit.length !== 1) throw new Error(`OWID: ${hit.length} columns end in ${suffix}`);
  return hit[0];
};
const valueOf = (file, entity, col, y) => file.entities[entity]?.cols[col]?.[y];

/** The named entities' values in a year, most first; each with its reading ten years before where the file has one. */
function entityRows(file, col, y, entities, dp, rename = (n) => n) {
  return entities
    .filter((e) => valueOf(file, e, col, y) !== undefined)
    .map((e) => {
      const was = valueOf(file, e, col, y - 10);
      return { n: rename(e), v: round(valueOf(file, e, col, y), dp), ...(was !== undefined ? { was: [y - 10, round(was, dp)] } : {}) };
    })
    .sort((a, b) => b.v - a.v);
}

/** The countries of a file (entities with an ISO3 code the site knows) with a value in a year. */
function countryRows(file, col, y, dp) {
  return Object.entries(file.entities)
    .filter(([, e]) => ISO2.has(e.code) && e.cols[col]?.[y] !== undefined)
    .map(([name, e]) => ({ n: nameOf(e.code, name), c: ISO2.get(e.code), v: round(e.cols[col][y], dp), iso3: e.code }));
}
const strip = ({ iso3, ...r }) => r;

/** Marks a table's rows as shares of `total` where they are parts of it: together no more than it. */
function shareOf(table, total, id) {
  const sumRows = table.rows.reduce((t, r) => t + r.v, 0);
  if (total > 0 && sumRows <= total * 1.005) return { ...table, kind: "share", total };
  console.warn(`  ${id}: ${table.key} add up to more than the world's ${total} - no shares given`);
  return table;
}

function owidDetails() {
  const out = {};

  // ── Electricity from renewables (Ember) ──
  {
    const ind = world("renewableElectricity");
    const [y0] = latest(ind);
    const share = owid("share-electricity-renewables");
    const col = colOf(share, "renewable_share_of_electricity__pct");
    const by = owid("share-elec-by-source");
    const src = (slug) => owidSource("Ember", slug);
    const part = (label, name) => {
      const v = valueOf(by, "World", name, y0);
      if (v === undefined) throw new Error(`share-elec-by-source: no ${name} for ${y0}`);
      return { n: label, v: round(v, 1) };
    };
    const types = [
      part("Hydropower", "hydro_share_of_electricity__pct"),
      part("Wind", "wind_share_of_electricity__pct"),
      part("Solar", "solar_share_of_electricity__pct"),
      part("Bioenergy", "bioenergy_share_of_electricity__pct"),
      part("Other renewables", "other_renewables_excluding_bioenergy_share_of_electricity__pct"),
      part("Coal", "coal_share_of_electricity__pct"),
      part("Gas", "gas_share_of_electricity__pct"),
      part("Nuclear", "nuclear_share_of_electricity__pct"),
      part("Oil", "oil_share_of_electricity__pct"),
    ];
    const whole = types.reduce((t, r) => t + r.v, 0);
    if (Math.abs(whole - 100) > 1.5) throw new Error(`Electricity by source adds up to ${whole}`);
    const regions = ["Africa (Ember)", "Asia (Ember)", "Europe (Ember)", "Latin America and Caribbean (Ember)", "Middle East (Ember)", "North America (Ember)", "Oceania (Ember)"];
    const countries = countryRows(share, col, y0, 1);
    const inv = owid("investment-in-renewable-energy-by-technology");
    const iy = Math.max(...Object.keys(inv.entities.World.cols.solar).map(Number));
    const tech = [["Solar", "solar"], ["Wind", "wind"], ["Biomass and waste", "biomass_and_waste"], ["Biofuels", "biofuels"], ["Small hydropower", "small_hydro"], ["Geothermal", "geothermal"], ["Marine", "marine"]];
    const invRows = tech.map(([n, c]) => ({ n, v: Math.round(valueOf(inv, "World", c, iy)), was: valueOf(inv, "World", c, iy - 10) !== undefined ? [iy - 10, Math.round(valueOf(inv, "World", c, iy - 10))] : undefined })).sort((a, b) => b.v - a.v);
    invRows.forEach((r) => r.was === undefined && delete r.was);
    out.renewableElectricity = {
      tables: [
        { key: "types", title: "Electricity by source", kicker: `Share of the world's electricity · ${y0}`, kind: "parts", as: "pct", rows: types, note: "Hydropower, wind, solar, bioenergy and the other renewables together are the renewable share.", source: src("share-elec-by-source") },
        { key: "regions", title: "By region", kicker: `Renewable share of electricity, as Ember groups countries · ${y0}`, kind: "rate", as: "figure", rows: entityRows(share, col, y0, regions, 1, (n) => n.replace(" (Ember)", "")), source: src("share-electricity-renewables") },
        { key: "countries", title: "In the most populous countries", kicker: `The ten countries with the most people, where reported · ${y0}`, kind: "rate", as: "figure", rows: countries.filter((r) => POPULOUS.includes(r.iso3)).sort((a, b) => b.v - a.v).map(strip), source: src("share-electricity-renewables") },
        {
          key: "investment",
          title: "Investment in renewables, by technology",
          kicker: `New investment a year, US$ · ${iy}, the last year this source's file holds`,
          kind: "share",
          as: "usd",
          total: invRows.reduce((t, r) => t + r.v, 0),
          rows: invRows,
          note: "Shares are of the technologies listed, added together here. The source lists small hydropower only.",
          source: owidSource("Frankfurt School-UNEP Centre / BloombergNEF, Global Trends in Renewable Energy Investment 2020", "investment-in-renewable-energy-by-technology"),
        },
      ],
      facts: [],
      notes: [],
    };
  }

  // ── Fossil fuels' share of energy (Energy Institute) ──
  {
    const ind = world("fossilShare");
    const [y0] = latest(ind);
    const f = owid("fossil-fuels-share-energy");
    const col = colOf(f, "fossil_fuels_share_pct");
    const src = owidSource("Energy Institute — Statistical Review of World Energy", "fossil-fuels-share-energy");
    const regions = ["Africa (EI)", "Asia Pacific (EI)", "CIS (EI)", "Europe (EI)", "Middle East (EI)", "North America (EI)", "South and Central America (EI)"];
    out.fossilShare = {
      tables: [
        { key: "regions", title: "By region", kicker: `Fossil fuels' share of energy supply, as the Energy Institute groups countries · ${y0}`, kind: "rate", as: "figure", rows: entityRows(f, col, y0, regions, 1, (n) => n.replace(" (EI)", "").replace("CIS", "Commonwealth of Independent States")), source: src },
        { key: "countries", title: "In the most populous countries", kicker: `The ten countries with the most people, where reported · ${y0}`, kind: "rate", as: "figure", rows: countryRows(f, col, y0, 1).filter((r) => POPULOUS.includes(r.iso3)).sort((a, b) => b.v - a.v).map(strip), source: src },
      ],
      facts: [],
      notes: [],
    };
  }

  // ── Electric cars (IEA Global EV Outlook) ──
  {
    const ind = world("evSalesShare");
    const [y0] = latest(ind);
    const f = owid("electric-car-sales-share");
    const col = colOf(f, "ev_sales_share");
    const kinds = owid("share-car-sales-battery-plugin");
    const sales = owid("car-sales");
    const iea = (slug) => owidSource("IEA Global EV Outlook 2025", slug);
    const bev = valueOf(kinds, "World", "bev_share_car_sales", y0);
    const phev = valueOf(kinds, "World", "phev_share_car_sales", y0);
    const tables = [];
    if (bev !== undefined && phev !== undefined)
      tables.push({
        key: "types",
        title: "By kind of electric car",
        kicker: `Share of new cars sold · ${y0}`,
        kind: "parts",
        as: "pct",
        rows: [{ n: "Battery-electric", v: round(bev, 1) }, { n: "Plug-in hybrid", v: round(phev, 1) }],
        note: "Battery-electric cars run on electricity alone; plug-in hybrids also have an engine.",
        source: iea("share-car-sales-battery-plugin"),
      });
    tables.push({ key: "markets", title: "By market", kicker: `Electric share of new cars, in the markets the IEA reports · ${y0}`, kind: "rate", as: "figure", rows: entityRows(f, col, y0, ["China", "Europe", "United States", "Rest of World"], 1, (n) => n.replace("Rest of World", "Rest of the world")), source: iea("electric-car-sales-share") });
    tables.push({ key: "countries", title: "The highest", kicker: `Countries · ${y0}`, kind: "rate", as: "figure", rows: countryRows(f, col, y0, 1).sort((a, b) => b.v - a.v).slice(0, 8).map(strip), source: iea("electric-car-sales-share") });
    const facts = [];
    const ev = valueOf(sales, "World", "ev_sales", y0);
    const other = valueOf(sales, "World", "non_ev_cars_sold", y0);
    if (ev !== undefined) facts.push({ label: "Electric cars sold", v: Math.round(ev), as: "count", sub: `${y0}` });
    if (other !== undefined) facts.push({ label: "Other cars sold", v: Math.round(other), as: "count", sub: `${y0}` });
    out.evSalesShare = { tables, facts, notes: [] };
  }

  // ── CO₂ by fuel (Global Carbon Budget), beside the World Bank's regions ──
  {
    const ind = world("co2");
    const [y0] = latest(ind);
    const f = owid("co2-by-source");
    const y = Math.min(y0, Math.max(...Object.keys(f.entities.World.cols.emissions_from_coal).map(Number)));
    const parts = [["Coal", "emissions_from_coal"], ["Oil", "emissions_from_oil"], ["Gas", "emissions_from_gas"], ["Cement", "emissions_from_cement"], ["Flaring", "emissions_from_flaring"], ["Other industry", "emissions_from_other_industry"]];
    const rows = parts.map(([n, c]) => ({ n, v: round(valueOf(f, "World", c, y) / 1e6, 0) })).sort((a, b) => b.v - a.v);
    out.co2 = wbDetail("co2", { sum: true });
    out.co2.tables.unshift({
      key: "types",
      title: "By fuel and industry",
      kicker: `Mt CO₂ · Global Carbon Budget · ${y}`,
      kind: "share",
      as: "figure",
      total: rows.reduce((t, r) => t + r.v, 0),
      rows,
      note: "The Global Carbon Budget's own estimate, by what is burnt or made; its total is not the World Bank's figure above, which is a separate estimate. Shares are of the Budget's parts, added together here.",
      source: owidSource("Global Carbon Budget (2025)", "co2-by-source"),
    });
  }

  // ── Private AI investment by place (Quid, via the AI Index) ──
  {
    const ind = world("aiInvestment");
    const [y0] = latest(ind);
    const f = owid("private-investment-in-artificial-intelligence");
    const col = colOf(f, "private_investment");
    const total = valueOf(f, "World", col, y0);
    const src = owidSource("Quid, via the AI Index Report", "private-investment-in-artificial-intelligence");
    const table = { key: "markets", title: "Where it is invested", kicker: `Private investment in AI, US$ at 2021 prices · ${y0}`, kind: "rate", as: "figure", rows: entityRows(f, col, y0, ["United States", "China", "Europe"], 0), note: "Europe here is the European Union and the United Kingdom together, as the AI Index reports it.", source: src };
    out.aiInvestment = { tables: [shareOf(table, Math.round(total), "aiInvestment")], facts: [], notes: [] };

    const gen = world("genAiInvestment");
    const [gy, gv] = latest(gen);
    const all = valueOf(f, "World", col, gy);
    out.genAiInvestment = {
      tables: [],
      facts: all !== undefined ? [{ label: "All private AI investment", v: Math.round(all), as: "figure", sub: `${gy}` }, { label: "Generative AI's share of it", v: round((100 * gv) / all, 1), as: "pct", sub: `${gy} · worked out here` }] : [],
      notes: [],
    };
  }

  // ── Industrial robots by country (IFR, via the AI Index) ──
  {
    const f = owid("industrial-robots-annual-installations-total-operational");
    const src = owidSource("International Federation of Robotics, via the AI Index Report", "industrial-robots-annual-installations-total-operational");
    for (const [id, column, what] of [["robotInstalls", "industrial_robot_installations", "Robots installed in the year"], ["robotStock", "industrial_robot_stock", "Robots in operation"]]) {
      const [y0] = latest(world(id));
      const col = colOf(f, column);
      const rows = countryRows(f, col, y0, 0).sort((a, b) => b.v - a.v).map(strip);
      const table = { key: "countries", title: "By country", kicker: `${what}, in the countries the source reports · ${y0}`, kind: "rate", as: "figure", rows, source: src };
      // The source's file gives the stock in operation for the world only.
      out[id] = { tables: rows.length ? [shareOf(table, Math.round(valueOf(f, "World", col, y0)), id)] : [], facts: [], notes: [] };
    }
  }

  // ── AI publications (CSET) ──
  {
    const [y0] = latest(world("aiPublications"));
    const f = owid("annual-scholarly-publications-on-artificial-intelligence");
    const col = colOf(f, "num_articles__field_all");
    const src = owidSource("Center for Security and Emerging Technology", "annual-scholarly-publications-on-artificial-intelligence");
    const total = Math.round(valueOf(f, "World", col, y0));
    const regions = ["Africa (CSET)", "Asia (CSET)", "Europe (CSET)", "North America and the Caribbean (CSET)", "Oceania (CSET)", "South and Central America (CSET)"];
    const regionRows = entityRows(f, col, y0, regions, 0, (n) => n.replace(" (CSET)", ""));
    const all = countryRows(f, col, y0, 0).sort((a, b) => b.v - a.v);
    const partsAdd = all.reduce((t, r) => t + r.v, 0) <= total * 1.005;
    const share = (t) => (partsAdd ? shareOf(t, total, "aiPublications") : t);
    out.aiPublications = {
      tables: [
        share({ key: "regions", title: "By region", kicker: `Publications, as CSET groups countries · ${y0}`, kind: "rate", as: "figure", rows: regionRows, source: src }),
        share({ key: "countries", title: "The largest", kicker: `Countries · ${y0}`, kind: "rate", as: "figure", rows: all.slice(0, 8).map(strip), source: src }),
      ],
      facts: [],
      notes: partsAdd ? [] : ["The countries' counts add up to more than the world's, so no shares of the world's are given."],
    };
  }

  // ── Conflicts and deaths by region (UCDP) ──
  {
    const UCDP = ["Africa", "Americas", "Asia and Oceania", "Europe", "Middle East"];
    {
      const [y0] = latest(world("conflicts"));
      const f = owid("number-of-armed-conflicts");
      const cols = ["conflict_type_intrastate", "conflict_type_interstate", "conflict_type_extrasystemic"].map((c) => colOf(f, c));
      const rows = UCDP.map((e) => {
        const at = (y) => (cols.every((c) => valueOf(f, e, c, y) !== undefined) ? cols.reduce((t, c) => t + valueOf(f, e, c, y), 0) : undefined);
        const was = at(y0 - 10);
        return { n: e, v: at(y0), ...(was !== undefined ? { was: [y0 - 10, was] } : {}) };
      }).filter((r) => r.v !== undefined).sort((a, b) => b.v - a.v);
      out.conflicts = {
        tables: [{ key: "regions", title: "By region", kicker: `State-based conflicts, as UCDP divides the world · ${y0}`, kind: "rate", as: "figure", rows, source: owidSource("Uppsala Conflict Data Program", "number-of-armed-conflicts") }],
        facts: [],
        notes: [],
      };
    }
    {
      const [y0, v0] = latest(world("conflictDeaths"));
      const f = owid("deaths-in-armed-conflicts-by-type");
      const cols = ["conflict_type_intrastate", "conflict_type_interstate", "conflict_type_extrasystemic", "conflict_type_non_state_conflict", "conflict_type_one_sided_violence"].map((c) => colOf(f, c));
      const total = (e, y) => {
        const vs = cols.map((c) => valueOf(f, e, c, y));
        return vs.every((v) => v === undefined) ? undefined : vs.reduce((t, v) => t + (v ?? 0), 0);
      };
      const src = owidSource("Uppsala Conflict Data Program", "deaths-in-armed-conflicts-by-type");
      const regions = UCDP.map((e) => {
        const was = total(e, y0 - 10);
        return { n: e, v: total(e, y0), ...(was !== undefined ? { was: [y0 - 10, was] } : {}) };
      }).filter((r) => r.v !== undefined).sort((a, b) => b.v - a.v);
      const countries = Object.entries(f.entities)
        .filter(([, e]) => ISO2.has(e.code))
        .map(([name, e]) => ({ n: nameOf(e.code, name), c: ISO2.get(e.code), v: total(name, y0) }))
        .filter((r) => r.v)
        .sort((a, b) => b.v - a.v)
        .slice(0, 8);
      out.conflictDeaths = {
        tables: [
          shareOf({ key: "regions", title: "By region", kicker: `Deaths, as UCDP divides the world · ${y0}`, kind: "rate", as: "figure", rows: regions, source: src }, v0, "conflictDeaths"),
          shareOf({ key: "countries", title: "Where most died", kicker: `Deaths in conflicts in each country · ${y0}`, kind: "rate", as: "figure", rows: countries, source: src }, v0, "conflictDeaths"),
        ],
        facts: [],
        notes: [],
      };
    }
  }

  // ── Nuclear warheads by country (FAS) ──
  {
    const [y0, v0] = latest(world("nuclearWarheads"));
    const f = owid("nuclear-warhead-stockpiles");
    const col = colOf(f, "number_of_warheads");
    const rows = countryRows(f, col, y0, 0).filter((r) => r.v > 0).sort((a, b) => b.v - a.v).map(strip);
    const table = { key: "countries", title: "By country", kicker: `Warheads in military stockpiles · ${y0}`, kind: "rate", as: "figure", rows, source: owidSource("Federation of American Scientists", "nuclear-warhead-stockpiles") };
    out.nuclearWarheads = { tables: [shareOf(table, v0, "nuclearWarheads")], facts: [{ label: "States with warheads", v: rows.length, as: "count", sub: `${y0}` }], notes: [] };
  }

  return out;
}

// ── Space and nuclear: figures of this file's own ─────────────────────────

const FROM = 1990;
const seriesOf = (file, entity, col, dp) =>
  Object.entries(file.entities[entity]?.cols[col] ?? {})
    .map(([y, v]) => [Number(y), round(v, dp)])
    .filter(([y]) => y >= FROM)
    .sort((a, b) => a[0] - b[0]);

/** The ITER Organization's page, and the words on it that each recorded figure rests on. */
const ITER_PAGE = "https://www.iter.org/few-lines";
const ITER_SAYS = [
  "34 nations",
  "China, the European Union, India, Japan, Korea, Russia and the United States",
  "Saint Paul-lez-Durance",
  "500 MW of fusion power from 50 MW of input heating power",
  "16 MW of fusion power from a total input heating power of 24 MW",
  "(45.6 percent)",
  "(9.1 percent each)",
  "full magnetic energy in 2036",
  "deuterium-tritium operation phase in 2039",
  "building has been underway since 2010",
];
function checkIter() {
  const today = new Date().toISOString().slice(0, 10);
  const text = get(ITER_PAGE, `iter-few-lines-${today}.html`)
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
  const missing = ITER_SAYS.filter((p) => !text.includes(p));
  if (missing.length) throw new Error(`iter.org no longer says: ${missing.join(" | ")} - read the page again and update what is recorded`);
  return today;
}

function extras() {
  const indicators = {};
  const details = {};
  const explain = {};
  const briefs = {};

  // ── Objects launched into space (UNOOSA) ──
  {
    const slug = "yearly-number-of-objects-launched-into-outer-space";
    const f = owid(slug);
    const col = colOf(f, "annual_launches");
    const series = seriesOf(f, "World", col, 0);
    const [y0, v0] = series[series.length - 1];
    const source = owidSource("UN Office for Outer Space Affairs — Online Index of Objects Launched into Outer Space", slug);
    indicators.spaceLaunches = {
      id: "spaceLaunches",
      label: "Objects launched into space",
      unit: "objects a year",
      format: "count",
      dp: 0,
      upIsGood: null,
      series,
      source,
      note: "UN Office for Outer Space Affairs: satellites, probes, landers, crewed spacecraft and space station parts put into Earth orbit or beyond, from the launches nations register with the UN.",
    };
    const every = f.entities.World.cols[col];
    const first = Math.min(...Object.keys(every).map(Number));
    const tables = [];

    // A launch made jointly is counted for each of its countries, so the countries can add up to more than the world.
    const everyone = Object.entries(f.entities)
      .filter(([name]) => name !== "World")
      .reduce((t, [, e]) => t + (e.cols[col]?.[y0] ?? 0), 0);
    const launchers = {
      key: "countries",
      title: "Who launched them",
      kicker: `Objects, for the country that commissioned the launch · ${y0}`,
      kind: "rate",
      as: "figure",
      rows: countryRows(f, col, y0, 0).sort((a, b) => b.v - a.v).slice(0, 8).map(strip),
      source,
    };
    if (everyone <= v0 * 1.005) Object.assign(launchers, { kind: "share", total: v0 });
    else launchers.note = "A launch made jointly by several countries is counted for each of them and once for the world, so no shares of the world's are given.";
    tables.push(launchers);

    const orbits = owid("space-objects-by-orbit");
    const ocol = colOf(orbits, "n_objects");
    const oy = Math.max(...Object.keys(orbits.entities["Low Earth orbit"].cols[ocol]).map(Number));
    const orbitRows = ["Low Earth orbit", "Medium Earth orbit", "Geostationary orbit", "High Earth orbit"].map((n) => {
      const was = valueOf(orbits, n, ocol, oy - 10);
      return { n, v: valueOf(orbits, n, ocol, oy), ...(was !== undefined ? { was: [oy - 10, was] } : {}) };
    });
    if (orbitRows.some((r) => r.v === undefined)) throw new Error("space-objects-by-orbit: an orbit has no value");
    tables.push({
      key: "types",
      title: "What is in orbit, by orbit",
      kicker: `Payloads and rocket bodies tracked in space · ${oy}`,
      kind: "share",
      as: "count",
      total: orbitRows.reduce((t, r) => t + r.v, 0),
      rows: orbitRows.sort((a, b) => b.v - a.v),
      note: "Low Earth orbit comes within 2,000 km of the Earth; medium Earth orbit lies above it, below geostationary orbit at about 35,786 km. Debris is not counted, and an object leaves the count when it re-enters the atmosphere. Shares are of the four orbits, added together here.",
      source: owidSource("United States Space Force — objects in space", "space-objects-by-orbit"),
    });

    // This file's columns are the vehicle, a year, the cost of a kilogram and the vehicle's class.
    const costLines = get("https://ourworldindata.org/grapher/cost-space-launches-low-earth-orbit.csv?v=1&csvType=full&useColumnShortNames=true", "owid-cost-space-launches-low-earth-orbit.csv")
      .trim()
      .split(/\r?\n/)
      .map(splitCsvLine);
    if (costLines[0].join() !== "entity,year,cost_per_kg,launch_class") throw new Error(`cost-space-launches: columns are ${costLines[0].join()}`);
    const rockets = costLines
      .slice(1)
      .map(([n, y, c, cls]) => ({ n, v: Number(c), d: `${cls.toLowerCase()} vehicle · ${y}`, y: Number(y) }))
      .filter((r) => Number.isFinite(r.v) && r.v > 0)
      .sort((a, b) => a.v - b.v);
    if (rockets.length < 30) throw new Error("cost-space-launches: too few rockets");
    const dearest = rockets[rockets.length - 1];
    tables.push({
      key: "rockets",
      title: "The cheapest rockets to orbit",
      kicker: "Cost of launching a kilogram to low Earth orbit, US$ at 2021 prices · the eight lowest, with the year the source gives each",
      kind: "rate",
      as: "usdPerKg",
      rows: rockets.slice(0, 8).map(({ y, ...r }) => r),
      note: `Of ${rockets.length} launch vehicles dated from ${Math.min(...rockets.map((r) => r.y))} to ${Math.max(...rockets.map((r) => r.y))}; the dearest, ${dearest.n}, cost $${dearest.v.toLocaleString("en-US")} a kilogram. Small vehicles carry up to 2,000 kg, medium ones up to 20,000 kg, heavy ones more.`,
      source: owidSource("CSIS Aerospace Security Project (2022) — cost of space launches", "cost-space-launches-low-earth-orbit"),
    });

    const people = owid("cumulative-people-space");
    const pcol = colOf(people, "n_cumulative_new_astronauts");
    const py = Math.max(...Object.keys(people.entities.World.cols[pcol]).map(Number));
    const flown = countryRows(people, pcol, py, 0).sort((a, b) => b.v - a.v);
    const everFlown = valueOf(people, "World", pcol, py);
    const flownTable = {
      key: "people",
      title: "Who has been to space",
      kicker: `People who have flown above 100 km, by nationality · to ${py}`,
      kind: "rate",
      as: "count",
      rows: flown.slice(0, 8).map(strip),
      note: `Each person is counted once, at their first flight. The source's file ends in ${py}.`,
      source: owidSource("CSIS Aerospace Security Project (2022) — International Astronaut Database", "cumulative-people-space"),
    };
    tables.push(flown.reduce((t, r) => t + r.v, 0) <= everFlown * 1.005 ? { ...flownTable, kind: "share", total: everFlown } : flownTable);

    details.spaceLaunches = {
      tables,
      facts: [
        { label: `Launched since ${first}`, v: Object.values(every).reduce((t, v) => t + v, 0), as: "count", sub: `${first}–${y0}, added up here` },
        { label: "People who have been to space", v: everFlown, as: "count", sub: `to ${py}` },
        { label: "Countries that have launched", v: Object.values(f.entities).filter((e) => ISO2.has(e.code)).length, as: "count", sub: `${first}–${y0}` },
      ],
      notes: ["The UN's count rests on the launches nations register with it; by its own estimate that is around 88% of all objects launched."],
    };
    explain.spaceLaunches = {
      what: "Every satellite, probe, lander, crewed spacecraft and space station part launched into Earth orbit or beyond in the year, from the launches nations register with the United Nations Office for Outer Space Affairs. A launch one country makes on behalf of another is counted for the country that commissioned it.",
      why: "It shows how fast activity in space is growing and which countries are behind it. More objects in orbit mean more of what space is used for - communications, navigation, watching the Earth - and more crowding in the orbits they share.",
    };
  }

  // ── Nuclear power's share of electricity (Ember), and fusion as ITER describes it ──
  {
    const slug = "share-electricity-nuclear";
    const f = owid(slug);
    const col = colOf(f, "nuclear_share_of_electricity__pct");
    const series = seriesOf(f, "World", col, 1);
    const [y0] = series[series.length - 1];
    const source = owidSource("Ember", slug);
    indicators.nuclearElectricity = {
      id: "nuclearElectricity",
      label: "Nuclear electricity",
      unit: "% of electricity generated",
      format: "pct",
      dp: 1,
      upIsGood: null,
      series,
      source,
      note: "Ember: electricity from nuclear power stations as a share of all electricity generated. Fusion supplies none of it yet - the window sets out where ITER, the largest fusion experiment, stands.",
    };
    const gen = owid("nuclear-energy-generation");
    const gcol = colOf(gen, "nuclear_generation__twh");
    const world = valueOf(gen, "World", gcol, y0);
    if (!(world > 0)) throw new Error(`nuclear-energy-generation: no world figure for ${y0}`);
    const generators = countryRows(gen, gcol, y0, 1).filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
    const checked = checkIter();
    const iter = { label: "ITER Organization — ITER in a few lines", url: ITER_PAGE };
    details.nuclearElectricity = {
      tables: [
        shareOf({ key: "countries", title: "The largest generators", kicker: `Nuclear electricity generated, TWh · ${y0}`, kind: "rate", as: "twh", rows: generators.slice(0, 8).map(strip), source: owidSource("Ember", "nuclear-energy-generation") }, round(world, 1), "nuclearElectricity"),
        { key: "highest", title: "Where its share is highest", kicker: `Nuclear share of the country's electricity · ${y0}`, kind: "rate", as: "figure", rows: countryRows(f, col, y0, 1).sort((a, b) => b.v - a.v).slice(0, 8).map(strip), source },
        {
          key: "iter",
          title: "Fusion: who pays for ITER's construction",
          kicker: `Share of construction costs, by member · ITER Organization, read ${checked}`,
          kind: "parts",
          as: "pct",
          rows: [{ n: "European Union", v: 45.6 }, ...["China", "India", "Japan", "Korea", "Russia", "United States"].map((n) => ({ n, v: 9.1 }))],
          note: "Nine-tenths of the project's value is delivered in kind, as finished components, systems or buildings.",
          source: iter,
        },
      ],
      facts: [
        { label: "Generated", v: round(world, 0), as: "twh", sub: `${y0}` },
        { label: "Countries generating it", v: generators.length, as: "count", sub: `${y0}` },
      ],
      notes: [],
    };
    explain.nuclearElectricity = {
      what: "Electricity generated by nuclear power stations - reactors that split heavy atoms, fission - as a share of all the electricity generated in the year, from Ember's yearly electricity data.",
      why: "Nuclear power makes electricity without burning fossil fuels, so its share is part of how clean the world's power is. Fusion, which joins light atoms instead, supplies none of it: it is still at the stage of experiments, and the largest of them, ITER, is described below.",
    };
    briefs.nuclearElectricity = [
      { title: "Fusion: what ITER is", text: "ITER is the world's largest tokamak, a magnetic fusion device, being built at Saint Paul-lez-Durance in southern France. Its seven members - China, the European Union, India, Japan, Korea, Russia and the United States - make 34 nations in all. The agreement was signed in 2006 and building has been under way since 2010.", source: iter, checked },
      { title: "Fusion: what ITER is designed to do", text: "To produce 500 MW of fusion power in its plasma from 50 MW of heating power - a ten-fold return (Q=10). The record for a magnetic fusion device is 16 MW from 24 MW of heating (Q=0.67), set by the European tokamak JET in 1997. ITER will not generate electricity: it is an experiment to prepare the way for machines that can.", source: iter, checked },
      { title: "Fusion: when", text: "Under the plan the ITER Organization presented to its Council in November 2024, the machine reaches full magnetic energy in 2036 and starts operating with deuterium-tritium fuel in 2039 - three and four years later than the plan of 2016.", source: iter, checked },
    ];
  }

  return { indicators, details, explain, briefs };
}

// ── UNHCR ─────────────────────────────────────────────────────────────────

function displacedDetail() {
  const [y0] = latest(world("displaced"));
  const src = { label: "UNHCR Refugee Data Finder", url: "https://www.unhcr.org/refugee-statistics/" };
  const n = (r, k) => Number(r[k]) || 0;
  const items = (which) => {
    const j = JSON.parse(get(`https://api.unhcr.org/population/v1/population/?yearFrom=${y0}&yearTo=${y0}&${which}_all=true&limit=400`, `unhcr-${which}-${y0}.json`));
    if (!j.items?.length || j.maxPages > 1) throw new Error(`UNHCR by ${which}: ${j.items?.length ?? 0} rows, ${j.maxPages} pages`);
    return j.items;
  };
  const top = (rows) => rows.filter((r) => r.v > 0 && ISO2.has(r.iso3)).sort((a, b) => b.v - a.v);
  const origins = top(items("coo").map((r) => ({ n: nameOf(r.coo_iso, r.coo_name), c: ISO2.get(r.coo_iso), iso3: r.coo_iso, v: n(r, "refugees") + n(r, "asylum_seekers") + n(r, "idps") + n(r, "oip") })));
  const hosts = top(items("coa").map((r) => ({ n: nameOf(r.coa_iso, r.coa_name), c: ISO2.get(r.coa_iso), iso3: r.coa_iso, v: n(r, "refugees") + n(r, "asylum_seekers") + n(r, "oip") })));
  if (origins.length < 50 || hosts.length < 50) throw new Error("UNHCR: too few countries");
  const sum = (rows) => rows.reduce((t, r) => t + r.v, 0);
  return {
    tables: [
      { key: "origins", title: "Where they are from", kicker: `Refugees, asylum-seekers, others needing protection and the internally displaced, by country of origin · ${y0}`, kind: "share", as: "figure", total: sum(origins), rows: origins.slice(0, 8).map(strip), note: "Shares are of everyone whose country of origin UNHCR records. Palestine refugees under UNRWA's mandate are counted in the world figure and not here.", source: src },
      { key: "hosts", title: "Where those who crossed a border are", kicker: `Refugees, asylum-seekers and others needing protection, by country of asylum · ${y0}`, kind: "share", as: "figure", total: sum(hosts), rows: hosts.slice(0, 8).map(strip), note: "The internally displaced are in their own countries and are not in this count.", source: src },
    ],
    facts: [{ label: "Countries people have fled", v: origins.length, as: "count", sub: `${y0}` }],
    notes: [],
  };
}

// ── Build ─────────────────────────────────────────────────────────────────

/** World Bank figures that are totals: their parts are shares of the world's. */
const WB_SUMS = ["sciArticles", "patents", "ipReceipts", "militaryUsd", "armsTransfers", "remittances"];
/** World Bank figures that are rates: each part has its own reading. */
const WB_RATES = ["internet", "broadband", "mobile", "secureServers", "research", "researchers", "militaryGdp", "trade", "manufacturingVA", "servicesVA", "highTechExports", "lifeExpectancy", "extremePoverty", "urban", "aged65"];

function main() {
  const details = owidDetails();
  for (const id of WB_SUMS) details[id] = wbDetail(id, { sum: true });
  for (const id of WB_RATES) details[id] = wbDetail(id);
  details.displaced = displacedDetail();
  const extra = extras();
  Object.assign(details, extra.details);

  let tables = 0;
  for (const [id, d] of Object.entries(details)) {
    for (const t of d.tables) {
      if (!t.rows.length) throw new Error(`${id}: ${t.key} has no rows`);
      for (const r of t.rows) if (!r.n || !Number.isFinite(r.v)) throw new Error(`${id}: ${t.key} has a bad row ${JSON.stringify(r)}`);
      if (t.kind === "share" && !(t.total > 0)) throw new Error(`${id}: ${t.key} has no total`);
      if (t.kind === "share" && t.rows.some((r) => r.v > t.total * 1.005)) throw new Error(`${id}: ${t.key} has a part larger than its total`);
      tables++;
    }
    d.tables = d.tables.filter((t) => t.rows.length >= 2);
    console.log(`${id.padEnd(22)} ${d.tables.map((t) => `${t.key}(${t.rows.length}${t.kind === "share" ? ", shares" : ""})`).join(" ") || "-"}${d.facts.length ? ` + ${d.facts.length} facts` : ""}`);
  }
  if (tables < 60) throw new Error(`Only ${tables} tables built`);
  for (const ind of Object.values(extra.indicators)) {
    if (ind.series.length < 10) throw new Error(`${ind.id}: only ${ind.series.length} points`);
    if (!extra.explain[ind.id]) throw new Error(`${ind.id}: no explanation`);
  }

  const body = Object.entries(details)
    .map(([id, d]) => `  ${JSON.stringify(id)}: ${JSON.stringify(d)},`)
    .join("\n");
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * What stands behind each world figure of the Trends page: the same measure
 * by region, income group and country, its make-up by type, and the
 * investment behind it where a body publishes that.
 *
 * GENERATED by build-trend-details.cjs on ${today} — do not edit by hand; change
 * the script and re-run it. The script lists every source.
 *
 * Every value is published by the source named on its table. The one thing
 * worked out is a share - a part over the same source's total for the same
 * year - and a table carries a total only where its rows are parts of it.
 */
import type { WorldIndicator } from "./worldview";

export const TREND_DETAILS_RETRIEVED = "${today}";

export interface DetailRow {
  /** The region, group, country or type. */
  n: string;
  v: number;
  /** ISO2, for a country's flag. */
  c?: string;
  /** The same reading ten years before, where the source has one. */
  was?: [year: number, value: number];
  /** What sets the row apart, in the source's terms: a rocket's class and year. */
  d?: string;
}

export interface DetailTable {
  key: string;
  title: string;
  kicker: string;
  /** "rate": each row is its own reading of the figure. "share": rows are parts of \`total\`. "parts": rows are percentages that make up a whole. */
  kind: "rate" | "share" | "parts";
  /** How a value prints: as the figure itself does, as a percentage, a whole number, US dollars, dollars a kilogram, or terawatt-hours. */
  as: DetailAs;
  total?: number;
  rows: DetailRow[];
  note?: string;
  source: { label: string; url: string };
}

export type DetailAs = "figure" | "pct" | "count" | "usd" | "usdPerKg" | "twh";

export interface DetailFact {
  label: string;
  v: number;
  as: DetailAs;
  sub: string;
}

/** What a programme says of itself, recorded from its own page and checked against it on each build. */
export interface TrendBrief {
  title: string;
  text: string;
  source: { label: string; url: string };
  /** The day the page was last read and found to say this. */
  checked: string;
}

export interface TrendDetail {
  tables: DetailTable[];
  facts: DetailFact[];
  notes: string[];
}

export const TREND_DETAILS: Record<string, TrendDetail> = {
${body}
};

/** World series the Worldview page does not carry, in the shape of its indicators: space launches and nuclear electricity. */
export const TREND_EXTRAS: Record<string, WorldIndicator> = {
${Object.entries(extra.indicators)
  .map(([id, d]) => `  ${JSON.stringify(id)}: ${JSON.stringify(d)},`)
  .join("\n")}
};

/** What each of those measures and why it matters, written from its source's own definition. */
export const TREND_EXPLAIN: Record<string, { what: string; why: string }> = ${JSON.stringify(extra.explain, null, 2)};

export const TREND_BRIEFS: Record<string, TrendBrief[]> = ${JSON.stringify(extra.briefs, null, 2)};
`,
  );
  console.log(`\nWrote ${path.relative(__dirname, OUT)}: ${Object.keys(details).length} figures, ${tables} tables.`);
}

main();
