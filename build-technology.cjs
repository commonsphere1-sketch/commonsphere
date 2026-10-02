#!/usr/bin/env node
/**
 * build-technology.cjs
 *
 * The Trends page's section on technology: how far communication technology
 * has spread, what computing has come to cost and do, the emerging kinds -
 * 5G, generative AI, large AI systems, data centres, driverless taxis,
 * genome sequencing - what is invested in AI, the robots, and the countries
 * and companies behind them. Written to src/data/technology.ts.
 *
 * SOURCES - every figure is its publisher's, read from Our World in Data's
 * copy of the file named (ourworldindata.org/grapher/<slug>.csv)
 *   International Telecommunication Union, via the World Bank
 *     mobile, internet, fixed-broadband and landline take-up per 100 people;
 *     the number of people online, by country; and the share of people within
 *     range of each generation of mobile network (SDG indicator 9.c.1).
 *   Rupp (2022): transistors on a microprocessor.
 *   Dongarra et al. (2025), the TOP500 list: the fastest supercomputer.
 *   McCallum (2023): the price of computer memory and storage.
 *   U.S. National Human Genome Research Institute: the cost of a genome.
 *   Epoch AI: notable AI systems by who built them, and large-scale AI
 *     systems by country.
 *   Quid, via the AI Index Report: private investment in AI by place, and
 *     corporate deals involving AI companies by type.
 *   McKinsey & Company, via the AI Index Report: companies using AI.
 *   Microsoft (2026): working-age adults using generative AI, an estimate
 *     from usage of its own platforms.
 *   International Energy Agency; Ember: data centres' share of electricity.
 *   California Public Utilities Commission: passenger-kilometres in paid
 *     driverless taxis.
 *   International Federation of Robotics, via the AI Index Report:
 *     industrial robots installed by country, and professional service
 *     robots by what they do.
 *   NVIDIA Corporation and Taiwan Semiconductor Manufacturing Company:
 *     each company's own reported revenue.
 *
 * WHAT IS WORKED OUT HERE
 *   A country's share of a world total from the same source and year; a
 *   year's total of the months of driverless-taxi travel, for years with all
 *   twelve; and NVIDIA's revenue outside data centres, as its total less its
 *   data-centre segment. No projection is in this file: none of these
 *   sources publishes one that can be read openly.
 *
 * Usage:  node build-technology.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/technology.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-technology");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);

function get(url, name) {
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
  return fs.readFileSync(at, "utf8");
}
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
const ISO2 = new Map(WB_LIST.filter((c) => c.region?.id && c.region.id !== "NA").map((c) => [c.id, c.iso2Code]));
// Taiwan is not on the World Bank's list of economies; the sources here name it.
ISO2.set("TWN", "TW");
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

/** An OWID grapher file as rows of { column: text }, with its header. Time may be a year, a day, a month or a quarter. */
function owidRows(slug) {
  const lines = get(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `owid-${slug}-${TODAY}.csv`).trim().split(/\r?\n/);
  const head = splitCsvLine(lines[0]);
  if (head[0] !== "entity") throw new Error(`OWID ${slug}: ${lines[0].slice(0, 120)}`);
  return { slug, head, rows: lines.slice(1).map((l) => Object.fromEntries(splitCsvLine(l).map((c, i) => [head[i], c]))) };
}
const col = (file, name) => {
  if (!file.head.includes(name)) throw new Error(`OWID ${file.slug}: no column ${name} among ${file.head.join()}`);
  return name;
};
const num = (raw) => (raw === "" || raw === undefined || !Number.isFinite(Number(raw)) ? null : Number(raw));
const owidSource = (label, slug) => ({ label: `${label} (via Our World in Data)`, url: `https://ourworldindata.org/grapher/${slug}` });
/** An entity's yearly series of a column. */
function series(file, entity, column, dp, from = 0) {
  const c = col(file, column);
  const out = file.rows
    .filter((r) => r.entity === entity && num(r[c]) !== null && Number(r.year) >= from)
    .map((r) => [Number(r.year), round(num(r[c]), dp)])
    .sort((a, b) => a[0] - b[0]);
  if (out.length < 3) throw new Error(`OWID ${file.slug}: ${entity} ${column} has ${out.length} points`);
  return out;
}
const lastOf = (s) => s[s.length - 1];

/** The countries with the most of a column in a year, each a part of the world's figure for it. */
function leaders(file, column, year, total, dp, n = 8) {
  const c = col(file, column);
  const rows = file.rows
    .filter((r) => ISO2.has(r.code) && Number(r.year) === year && num(r[c]) > 0)
    .map((r) => ({ n: nameOf(r.code, r.entity), c: ISO2.get(r.code), v: round(num(r[c]), dp) }))
    .sort((a, b) => b.v - a.v);
  if (rows.length < Math.min(n, 5)) throw new Error(`OWID ${file.slug}: only ${rows.length} countries for ${year}`);
  if (total !== null && rows[0].v > total) throw new Error(`OWID ${file.slug}: ${rows[0].n} has more than the world`);
  return { year, total, countries: rows.length, rows: rows.slice(0, n) };
}

// ── Build ─────────────────────────────────────────────────────────────────

function main() {
  // Take-up per 100 people (ITU).
  const ict = owidRows("ict-adoption-per-100-people");
  const itu = (slug) => owidSource("International Telecommunication Union, via the World Bank", slug);
  const TAKE_UP = [
    ["mobile", "it_cel_sets_p2"],
    ["internet", "it_net_user_zs"],
    ["broadband", "it_net_bbnd_p2"],
    ["landline", "it_mlt_main_p2"],
  ];
  const takeUpSeries = Object.fromEntries(TAKE_UP.map(([k, c]) => [k, series(ict, "World", c, 1, 1990)]));
  const takeUpYears = [...new Set(Object.values(takeUpSeries).flatMap((s) => s.map(([y]) => y)))].sort((a, b) => a - b);
  const takeUp = takeUpYears.map((y) => ({ year: y, ...Object.fromEntries(TAKE_UP.map(([k]) => [k, takeUpSeries[k].find(([x]) => x === y)?.[1] ?? null])) }));

  const users = owidRows("number-of-internet-users");
  const usersWorld = series(users, "World", "it_net_user_zs_number", 0, 1990);
  const online = { series: usersWorld, ...leaders(users, "it_net_user_zs_number", lastOf(usersWorld)[0] - 1, null, 0), source: itu("number-of-internet-users") };
  // Countries report a year behind the world estimate: their year's world figure is what they are shares of.
  online.total = usersWorld.find(([y]) => y === online.year)?.[1] ?? null;
  if (!online.total) throw new Error("Internet users: no world figure for the countries' year");

  const cover = owidRows("population-covered-by-mobile-network-by-network-capability");
  const GENERATIONS = [
    ["2G", "_9_c_1__it_mob_2gntwk"],
    ["3G", "_9_c_1__it_mob_3gntwk"],
    ["4G", "_9_c_1__it_mob_4gntwk"],
    ["5G", "_9_c_1__it_mob_5gntwk"],
  ];
  const coverage = { generations: GENERATIONS.map(([name, c]) => ({ name, series: series(cover, "World", c, 1) })), source: owidSource("International Telecommunication Union — SDG indicator 9.c.1", "population-covered-by-mobile-network-by-network-capability") };

  // Computing: what it does and what it costs.
  const world = (slug, column, dp, label) => {
    const f = owidRows(slug);
    return { series: series(f, "World", column, dp), source: owidSource(label, slug) };
  };
  const transistors = world("transistors-per-microprocessor", "transistors", 0, "Rupp (2022)");
  const supercomputer = world("supercomputer-power-flops", "computational_capacity_fastest_supercomputer", 0, "Dongarra et al. (2025), the TOP500 list");
  const disk = world("historical-cost-of-computer-memory-and-storage", "ddrives", 2, "John C. McCallum (2023)");
  const genome = world("cost-of-sequencing-a-full-human-genome", "cost_per_genome", 0, "U.S. National Human Genome Research Institute");
  if (!(lastOf(transistors.series)[1] > 1e9 && transistors.series[0][1] < 1e5)) throw new Error("Transistors: not a count per chip since the 1970s");
  if (!(lastOf(disk.series)[1] < 100 && disk.series[0][1] > 1e6)) throw new Error("Disk storage: not dollars a terabyte");
  if (!(lastOf(genome.series)[1] < 5000 && genome.series[0][1] > 1e6)) throw new Error("Genome: not dollars a genome");

  // AI.
  const built = owidRows("affiliation-researchers-building-artificial-intelligence-systems-all");
  const BUILDERS = [
    ["industry", "Industry"],
    ["collaboration", "Academia and industry collaboration"],
    ["academia", "Academia"],
    ["other", "Other"],
  ];
  const builtYears = [...new Set(built.rows.map((r) => Number(r.year)))].filter((y) => y >= 2010).sort((a, b) => a - b);
  const count = (entity, y) => num(built.rows.find((r) => r.entity === entity && Number(r.year) === y)?.yearly_count) ?? 0;
  // "Not specified" is the source's own category; it is counted with "Other" so the bars add up to every system.
  const models = builtYears.map((y) => ({ year: y, ...Object.fromEntries(BUILDERS.map(([k, e]) => [k, count(e, y) + (k === "other" ? count("Not specified", y) : 0)])) }));
  // A year still under way would read as a fall: the last year kept is the last full one.
  while (models.length && lastOf(models).year >= new Date().getFullYear()) models.pop();
  const epoch = (slug) => owidSource("Epoch AI", slug);

  const large = owidRows("cumulative-number-of-large-scale-ai-systems-by-country");
  const largeAll = series(large, "All large-scale AI systems", "cumulative_count", 0).filter(([y]) => y < new Date().getFullYear());
  const largeSystems = { series: largeAll, ...leaders(large, "cumulative_count", lastOf(largeAll)[0], lastOf(largeAll)[1], 0), source: epoch("cumulative-number-of-large-scale-ai-systems-by-country") };

  const quid = owidRows("private-investment-in-artificial-intelligence");
  const PLACES = [
    ["china", "China"],
    ["us", "United States"],
    ["europe", "Europe"],
    ["world", "World"],
  ];
  const placeSeries = Object.fromEntries(PLACES.map(([k, e]) => [k, series(quid, e, "private_investment", 0)]));
  const aiInvestment = placeSeries.world.map(([y]) => ({ year: y, ...Object.fromEntries(PLACES.map(([k]) => [k, round((placeSeries[k].find(([x]) => x === y)?.[1] ?? 0) / 1e9, 1)])) }));
  const deals = owidRows("corporate-investment-in-artificial-intelligence-by-type");
  const DEALS = [
    ["private", "Private investment"],
    ["merger", "Merger/acquisition"],
    ["minority", "Minority stake"],
    ["offering", "Public offering"],
  ];
  const dealYears = [...new Set(deals.rows.map((r) => Number(r.year)))].sort((a, b) => a - b);
  const deal = (e, y) => (num(deals.rows.find((r) => r.entity === e && Number(r.year) === y)?.corporate_investment) ?? 0) / 1e9;
  const aiDeals = dealYears.map((y) => ({ year: y, ...Object.fromEntries(DEALS.map(([k, e]) => [k, round(deal(e, y), 1)])), total: round(deal("Total", y), 1) }));
  const lastDeal = lastOf(aiDeals);
  if (Math.abs(DEALS.reduce((t, [k]) => t + lastDeal[k], 0) - lastDeal.total) > 1) throw new Error("AI deals: the types do not add up to the source's total");
  const quidSource = (slug) => owidSource("Quid, via the AI Index Report", slug);

  const firms = owidRows("share-companies-using-artificial-intelligence");
  const firmsAll = series(firms, "All geographies", "pct_of_respondents", 0);
  const firmsYear = lastOf(firmsAll)[0];
  const companiesUsing = {
    series: firmsAll,
    year: firmsYear,
    regions: firms.rows.filter((r) => r.entity !== "All geographies" && Number(r.year) === firmsYear && num(r.pct_of_respondents) !== null).map((r) => ({ n: r.entity, v: num(r.pct_of_respondents) })).sort((a, b) => b.v - a.v),
    source: owidSource("McKinsey & Company, via the AI Index Report", "share-companies-using-artificial-intelligence"),
  };

  const gen = owidRows("estimated-share-people-generative-ai");
  const genWorld = gen.rows.filter((r) => r.entity === "World" && num(r.ai_user_share) !== null).map((r) => [r.day, round(num(r.ai_user_share), 1)]).sort((a, b) => a[0].localeCompare(b[0]));
  if (genWorld.length < 2) throw new Error("Generative AI: too few world readings");
  const genDay = lastOf(genWorld)[0];
  const genAi = {
    readings: genWorld,
    day: genDay,
    rows: gen.rows.filter((r) => ISO2.has(r.code) && r.day === genDay && num(r.ai_user_share) !== null).map((r) => ({ n: nameOf(r.code, r.entity), c: ISO2.get(r.code), v: round(num(r.ai_user_share), 1) })).sort((a, b) => b.v - a.v),
    source: owidSource("Microsoft (2026)", "estimated-share-people-generative-ai"),
  };
  genAi.countries = genAi.rows.length;
  genAi.rows = genAi.rows.slice(0, 8);

  const dc = owidRows("data-centers-share-electricity-demand");
  const dcCol = dc.head[3];
  const dcWorld = series(dc, "World", dcCol, 2);
  const dcYear = lastOf(dcWorld)[0];
  const dataCentres = {
    series: dcWorld,
    year: dcYear,
    places: dc.rows.filter((r) => !r.entity.startsWith("World") && Number(r.year) === dcYear && num(r[dcCol]) !== null).map((r) => ({ n: r.entity.replace(" (IEA)", ""), v: round(num(r[dcCol]), 2), ...(ISO2.has(r.code) ? { c: ISO2.get(r.code) } : {}) })).sort((a, b) => b.v - a.v),
    source: owidSource("International Energy Agency; Ember", "data-centers-share-electricity-demand"),
  };

  const taxi = owidRows("passenger-kilometers-traveled-self-driving-taxis");
  const months = taxi.rows.filter((r) => num(r.totalpmt) !== null).map((r) => [r.month, num(r.totalpmt)]).sort((a, b) => a[0].localeCompare(b[0]));
  const byYear = {};
  for (const [m, v] of months) (byYear[m.slice(0, 4)] ||= []).push(v);
  const taxis = {
    // A year's total only where all twelve of its months are in the file.
    series: Object.entries(byYear).filter(([, v]) => v.length === 12).map(([y, v]) => [Number(y), Math.round(v.reduce((a, b) => a + b, 0))]),
    first: [months[0][0], Math.round(months[0][1])],
    latest: [lastOf(months)[0], Math.round(lastOf(months)[1])],
    source: owidSource("California Public Utilities Commission", "passenger-kilometers-traveled-self-driving-taxis"),
  };
  if (taxis.series.length < 2) throw new Error("Driverless taxis: fewer than two full years");

  // Robots (IFR).
  const robots = owidRows("annual-industrial-robots-installed");
  const MAKERS = [
    ["china", "China"],
    ["japan", "Japan"],
    ["us", "United States"],
    ["korea", "South Korea"],
    ["germany", "Germany"],
    ["world", "World"],
  ];
  const robotSeries = Object.fromEntries(MAKERS.map(([k, e]) => [k, series(robots, e, "industrial_robot_installations", 0)]));
  const robotInstalls = robotSeries.world.map(([y]) => ({ year: y, ...Object.fromEntries(MAKERS.map(([k]) => [k, robotSeries[k].find(([x]) => x === y)?.[1] ?? null])) }));
  const ifr = (slug) => owidSource("International Federation of Robotics, via the AI Index Report", slug);
  const service = owidRows("annual-professional-service-robots-installed-by-area");
  const serviceYear = Math.max(...service.rows.map((r) => Number(r.year)));
  const firstService = Math.min(...service.rows.map((r) => Number(r.year)));
  const serviceRobots = {
    year: serviceYear,
    rows: service.rows.filter((r) => Number(r.year) === serviceYear).map((r) => {
      const was = num(service.rows.find((x) => x.entity === r.entity && Number(x.year) === firstService)?.number_of_professional_robots_installed);
      return { n: r.entity, v: num(r.number_of_professional_robots_installed), ...(was !== null ? { was: [firstService, was] } : {}) };
    }).sort((a, b) => b.v - a.v),
    source: ifr("annual-professional-service-robots-installed-by-area"),
  };

  // Two companies' own reported revenue.
  const nv = owidRows("nvidia-quarterly-revenue-segment");
  const quarters = [...new Set(nv.rows.map((r) => r.quarter))].sort();
  const seg = (e, q) => num(nv.rows.find((r) => r.entity === e && r.quarter === q)?.revenue);
  const nvidia = quarters.filter((q) => seg("Total", q) !== null && seg("Data centers and AI", q) !== null).map((q) => ({ quarter: q, dataCentres: round(seg("Data centers and AI", q) / 1e9, 2), other: round((seg("Total", q) - seg("Data centers and AI", q)) / 1e9, 2) }));
  if (nvidia.length < 20 || nvidia.some((q) => q.other < 0)) throw new Error("NVIDIA: segments do not sit inside the total");
  const tsmc = { series: series(owidRows("tsmc-annual-revenue"), "Taiwan", "revenue_usd", 0).map(([y, v]) => [y, round(v / 1e9, 1)]), source: owidSource("Taiwan Semiconductor Manufacturing Company; Central Bank of the Republic of China (Taiwan)", "tsmc-annual-revenue") };

  const j = (v) => JSON.stringify(v);
  fs.writeFileSync(
    OUT,
    `/**
 * Technology, for the Trends page: how far communication technology has
 * spread, what computing has come to cost and do, the emerging kinds, what
 * is invested in AI, the robots, and the countries and companies behind them.
 *
 * GENERATED by build-technology.cjs on ${TODAY} — do not edit by hand; change
 * the script and re-run it. The script lists every source.
 */
import type { Leader, Source, YearValue } from "./renewables";

export const TECHNOLOGY_RETRIEVED = "${TODAY}";

/** Take-up in the world per 100 people: mobile subscriptions, people using the internet, fixed-broadband subscriptions, landlines. */
export const TECH_TAKE_UP: { year: number; mobile: number | null; internet: number | null; broadband: number | null; landline: number | null }[] = ${j(takeUp)};
export const TECH_TAKE_UP_SOURCE: Source = ${j(itu("ict-adoption-per-100-people"))};

/** People using the internet: the world year by year, and the countries with most in the latest year they report. */
export const PEOPLE_ONLINE: { series: YearValue[]; year: number; total: number; countries: number; rows: Leader[]; source: Source } = ${j(online)};

/** The share of the world's people within range of each generation of mobile network, %. */
export const MOBILE_COVERAGE: { generations: { name: string; series: YearValue[] }[]; source: Source } = ${j(coverage)};

/** Computing, each a world series with its source. */
export const TRANSISTORS: { series: YearValue[]; source: Source } = ${j(transistors)};
/** The fastest supercomputer's speed, gigaflops (10⁹ operations a second). */
export const SUPERCOMPUTER: { series: YearValue[]; source: Source } = ${j(supercomputer)};
/** The price of disk storage, constant 2020 US dollars a terabyte: the cheapest recorded up to each year. */
export const DISK_PRICE: { series: YearValue[]; source: Source } = ${j(disk)};
/** The cost of sequencing a human genome, current US dollars. */
export const GENOME_COST: { series: YearValue[]; source: Source } = ${j(genome)};

/** Notable AI systems published in the year, by who built them. */
export const AI_MODELS: { year: number; industry: number; collaboration: number; academia: number; other: number }[] = ${j(models)};
export const AI_MODELS_SOURCE: Source = ${j(epoch("affiliation-researchers-building-artificial-intelligence-systems-all"))};
/** AI systems trained with more than 10²³ operations, counted from 2019: the world's running total, and by country. */
export const LARGE_AI_SYSTEMS: { series: YearValue[]; year: number; total: number; countries: number; rows: Leader[]; source: Source } = ${j(largeSystems)};

/** Private investment in AI by place, US$ billions at 2021 prices. Europe is the European Union and the United Kingdom. */
export const AI_INVESTMENT_PLACES: { year: number; china: number; us: number; europe: number; world: number }[] = ${j(aiInvestment)};
export const AI_INVESTMENT_PLACES_SOURCE: Source = ${j(quidSource("private-investment-in-artificial-intelligence"))};
/** Corporate deals involving AI companies by type, US$ billions at 2021 prices. */
export const AI_DEALS: { year: number; private: number; merger: number; minority: number; offering: number; total: number }[] = ${j(aiDeals)};
export const AI_DEALS_SOURCE: Source = ${j(quidSource("corporate-investment-in-artificial-intelligence-by-type"))};

/** The share of companies surveyed that use AI, %: all of them year by year, and by region. */
export const COMPANIES_USING_AI: { series: YearValue[]; year: number; regions: { n: string; v: number }[]; source: Source } = ${j(companiesUsing)};
/** The share of working-age adults who used a generative AI tool, %: the world at each date estimated, and the countries highest at the latest. */
export const GENERATIVE_AI_USERS: { readings: [day: string, pct: number][]; day: string; countries: number; rows: Leader[]; source: Source } = ${j(genAi)};

/** Data centres' share of electricity demand, %: the world, and by place. */
export const DATA_CENTRES: { series: YearValue[]; year: number; places: { n: string; v: number; c?: string }[]; source: Source } = ${j(dataCentres)};
/** Passenger-kilometres in California's paid driverless taxis: full years, and the first and latest months. */
export const DRIVERLESS_TAXIS: { series: YearValue[]; first: [month: string, km: number]; latest: [month: string, km: number]; source: Source } = ${j(taxis)};

/** Industrial robots installed in the year, by country. */
export const ROBOT_INSTALLS: { year: number; china: number | null; japan: number | null; us: number | null; korea: number | null; germany: number | null; world: number | null }[] = ${j(robotInstalls)};
export const ROBOT_INSTALLS_SOURCE: Source = ${j(ifr("annual-industrial-robots-installed"))};
/** Professional service robots installed in the year, by what they do. */
export const SERVICE_ROBOTS: { year: number; rows: { n: string; v: number; was?: [year: number, value: number] }[]; source: Source } = ${j(serviceRobots)};

/** NVIDIA's revenue by quarter, US$ billions: its data-centre and AI segment, and everything else. */
export const NVIDIA_REVENUE: { quarter: string; dataCentres: number; other: number }[] = ${j(nvidia)};
export const NVIDIA_REVENUE_SOURCE: Source = ${j(owidSource("NVIDIA Corporation", "nvidia-quarterly-revenue-segment"))};
/** TSMC's revenue by year, US$ billions. */
export const TSMC_REVENUE: { series: YearValue[]; source: Source } = ${j(tsmc)};
`,
  );
  const l = lastOf(takeUp);
  console.log(`Take-up ${takeUp[0].year}–${l.year}: mobile ${l.mobile}, internet ${l.internet}, broadband ${l.broadband}, landline ${l.landline} per 100`);
  console.log(`Online ${lastOf(usersWorld)[1]} in ${lastOf(usersWorld)[0]}; countries ${online.year}: ${online.rows.slice(0, 3).map((r) => `${r.n} ${r.v}`).join(", ")}`);
  console.log(`Coverage ${coverage.generations.map((g) => `${g.name} ${lastOf(g.series)[1]}%`).join(", ")}`);
  console.log(`Transistors ${transistors.series[0][1]} (${transistors.series[0][0]}) → ${lastOf(transistors.series)[1]} (${lastOf(transistors.series)[0]}); disk $${disk.series[0][1]} → $${lastOf(disk.series)[1]}; genome $${genome.series[0][1]} → $${lastOf(genome.series)[1]}`);
  console.log(`AI models ${models[0].year}–${lastOf(models).year}: ${JSON.stringify(lastOf(models))}; large systems ${lastOf(largeAll)[1]} by ${lastOf(largeAll)[0]}, ${largeSystems.rows[0].n} ${largeSystems.rows[0].v}`);
  console.log(`AI investment ${JSON.stringify(lastOf(aiInvestment))}; deals ${JSON.stringify(lastDeal)}`);
  console.log(`Firms using AI ${lastOf(firmsAll)[1]}% (${firmsYear}); gen AI ${lastOf(genWorld)[1]}% on ${genDay}, top ${genAi.rows[0].n} ${genAi.rows[0].v}%; data centres ${lastOf(dcWorld)[1]}% (${dcYear})`);
  console.log(`Taxis ${JSON.stringify(taxis.series)} latest ${taxis.latest}; robots ${JSON.stringify(lastOf(robotInstalls))}; service ${serviceRobots.rows.map((r) => `${r.n} ${r.v}`).join(", ")}`);
  console.log(`NVIDIA ${nvidia.length} quarters to ${lastOf(nvidia).quarter}: ${JSON.stringify(lastOf(nvidia))}; TSMC $${lastOf(tsmc.series)[1]}bn (${lastOf(tsmc.series)[0]})`);
  console.log(`Wrote ${path.relative(__dirname, OUT)}`);
}

main();
