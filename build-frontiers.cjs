/**
 * Builds src/data/frontiers.ts - the frontiers of invention the Innovations
 * page charts beside its own: artificial intelligence, clean energy, robots,
 * computing, the weapons that stand behind military power, and the
 * discoveries the Nobel committees have named.
 *
 *   Sources  Our World in Data's charts, each downloaded whole (CC BY 4.0;
 *            a chart Our World in Data may not redistribute answers 403 and
 *            is not used): Epoch AI's training compute of notable AI systems
 *            and its count of large-scale systems by country; IRENA's solar
 *            module prices and costs of electricity by technology; IRENA's
 *            installed solar and wind capacity; Ember's share of electricity
 *            from renewables; the IEA's electric car sales share; the
 *            International Federation of Robotics' robot installations; the
 *            TOP500 fastest supercomputer; the Federation of American
 *            Scientists' nuclear warhead inventories.
 *            The Nobel Prize's own API (Nobel Prize Outreach; its metadata
 *            is CC0): the prizes in physics, chemistry and medicine, with
 *            each laureate and the committee's own words for why.
 *
 *   node build-frontiers.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/frontiers.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-frontiers");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });
const get = (url, name) => {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) execFileSync("curl", ["-sL", "--fail", "-A", UA, "-o", at, url], { stdio: "ignore" });
  return fs.readFileSync(at, "utf8");
};
/** An Our World in Data chart's rows: { entity, code, year, ...columns }. */
function owid(slug) {
  const csv = get(`https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`, `${slug}.csv`);
  const [head, ...lines] = csv.trim().split("\n");
  const cols = head.split(",");
  return lines.map((line) => {
    const cells = [];
    let cell = "", q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) cells.push(cell), (cell = "");
      else cell += ch;
    }
    cells.push(cell);
    return Object.fromEntries(cols.map((c, i) => [c, i >= 2 && c !== "day" ? (cells[i] === "" ? null : Number(cells[i])) : cells[i]]));
  });
}
const r = (v, p = 2) => (v === null ? null : Math.round(v * 10 ** p) / 10 ** p);
const world = (rows, col) => rows.filter((x) => x.entity === "World" && x[col] !== null).map((x) => [x.year, r(x[col], 3)]);
const topLatest = (rows, col, n = 10) => {
  const countries = rows.filter((x) => /^[A-Z]{3}$/.test(x.code || "") && x[col] !== null);
  const last = Math.max(...countries.map((x) => x.year));
  return { year: last, rows: countries.filter((x) => x.year === last).sort((a, b) => b[col] - a[col]).slice(0, n).map((x) => [x.entity, r(x[col], 3)]) };
};

(async () => {
  // Artificial intelligence.
  const ai = owid("exponential-growth-of-computation-in-the-training-of-notable-ai-systems").filter((x) => x.training_computation_petaflop !== null && !/x\/year|×\/year|\/year between/i.test(x.entity));
  const byYear = {};
  for (const x of ai) {
    const y = Number(x.day.slice(0, 4));
    if (y >= 2010 && (!byYear[y] || x.training_computation_petaflop > byYear[y][1])) byYear[y] = [x.entity, x.training_computation_petaflop];
  }
  const aiMax = Object.keys(byYear).sort().map((y) => [Number(y), byYear[y][0], byYear[y][1]]);
  const aiLatest = [...ai].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 10).map((x) => [x.entity, x.day, x.training_computation_petaflop]);
  const aiCountries = owid("cumulative-number-of-large-scale-ai-systems-by-country");
  const aiTop = topLatest(aiCountries.map((x) => ({ ...x, code: x.entity === "All large-scale AI systems" ? "" : x.code || (x.entity.length > 2 ? "XXX" : "") })), "cumulative_count");

  // Clean energy.
  const solarPrice = owid("solar-pv-prices").filter((x) => x.cost !== null).map((x) => [x.year, r(x.cost, 3)]);
  const solar = owid("installed-solar-pv-capacity");
  const wind = owid("cumulative-installed-wind-energy-capacity-gigawatts");
  const renew = owid("share-of-electricity-production-from-renewable-sources");
  // Each kind of renewable electricity, the world's share from each: in the latest year and in 2000, the first year of Ember's own figures.
  const bySource = owid("share-elec-by-source").filter((x) => x.entity === "World");
  const KINDS = [
    ["Hydropower", "hydro_share_of_electricity__pct"],
    ["Solar", "solar_share_of_electricity__pct"],
    ["Wind", "wind_share_of_electricity__pct"],
    ["Bioenergy", "bioenergy_share_of_electricity__pct"],
    ["Geothermal, wave and tidal", "other_renewables_excluding_bioenergy_share_of_electricity__pct"],
  ];
  const kindsLast = Math.max(...bySource.filter((x) => KINDS.every(([, c]) => x[c] !== null)).map((x) => x.year));
  const kindsAt = (y) => bySource.find((x) => x.year === y) || {};
  const renewKinds = KINDS.map(([n, c]) => [n, r(kindsAt(kindsLast)[c] ?? null, 2), r(kindsAt(2000)[c] ?? null, 2)]);
  // A check: the kinds add up to the renewable share the other series gives, within rounding.
  const renewLast = world(renew, "renewable_share_of_electricity__pct").find(([y]) => y === kindsLast)?.[1];
  const kindsSum = renewKinds.reduce((n, [, v]) => n + (v ?? 0), 0);
  if (renewLast !== undefined && Math.abs(kindsSum - renewLast) > 0.2) throw new Error(`renewable kinds add to ${kindsSum}, the share is ${renewLast}`);
  const lcoe = owid("levelized-cost-of-energy");
  const techs = ["solar_photovoltaic", "onshore_wind", "offshore_wind", "hydropower", "geothermal", "bioenergy", "concentrated_solar_power"];
  const lcoeWorld = lcoe.filter((x) => x.entity === "World");
  const lcoeLast = lcoeWorld.length ? Math.max(...lcoeWorld.map((x) => x.year)) : null;
  // The first year the world's figures cover solar power, so that every technology is set beside the same year.
  const withSolar = lcoeWorld.filter((x) => x.solar_photovoltaic !== null);
  const lcoeFirst = withSolar.length ? Math.min(...withSolar.map((x) => x.year)) : null;
  const lcoeAt = (y) => lcoeWorld.find((x) => x.year === y) || {};
  const lcoeRows = techs.map((t) => [t, r(lcoeAt(lcoeFirst)[t] ?? null, 3), r(lcoeAt(lcoeLast)[t] ?? null, 3)]).filter(([, a, b]) => a !== null || b !== null);
  const ev = owid("electric-car-sales-share");

  // Robots and computing.
  const robots = owid("annual-industrial-robots-installed");
  const robotsWorld = world(robots, "industrial_robot_installations");
  const robotsTop = topLatest(robots, "industrial_robot_installations");
  const flops = owid("supercomputer-power-flops").filter((x) => x.computational_capacity_fastest_supercomputer !== null).map((x) => [x.year, x.computational_capacity_fastest_supercomputer]);

  // Nuclear weapons.
  const nukes = owid("nuclear-warhead-inventories");
  const nukesYear = Math.max(...nukes.map((x) => x.year));
  const nukesRows = nukes
    .filter((x) => x.year === nukesYear && /^[A-Z]{3}$/.test(x.code || ""))
    .map((x) => [x.entity, x.deployed_strategic ?? 0, x.deployed_nonstrategic ?? 0, x.reserve_nondeployed ?? 0, x.retired ?? 0])
    .sort((a, b) => b[1] + b[2] + b[3] - (a[1] + a[2] + a[3]));

  // The Nobel Prizes in the sciences, the last ten years the API has.
  const thisYear = new Date().getFullYear();
  const nobel = [];
  for (const [cat, name] of [["phy", "Physics"], ["che", "Chemistry"], ["med", "Physiology or Medicine"]]) {
    const j = JSON.parse(get(`https://api.nobelprize.org/2.1/nobelPrizes?nobelPrizeYear=${thisYear - 10}&yearTo=${thisYear}&nobelPrizeCategory=${cat}&limit=50`, `nobel-${cat}.json`));
    for (const p of j.nobelPrizes || []) {
      // Names and words tidied of the stray spaces the record has in a few.
      const laureates = (p.laureates || []).map((l) => (l.knownName?.en || l.orgName?.en || l.fullName?.en || "").replace(/\s+/g, " ").trim()).filter(Boolean);
      const why = [...new Set((p.laureates || []).map((l) => (l.motivation?.en || "").replace(/\s+/g, " ").trim()).filter(Boolean))];
      if (laureates.length) nobel.push([Number(p.awardYear), name, laureates, why]);
    }
  }
  nobel.sort((a, b) => b[0] - a[0] || a[1].localeCompare(b[1]));

  // Checks against what is known: solar module prices fell by more than 90% since 1975; the CRISPR prize was chemistry in 2020.
  if (!(solarPrice[solarPrice.length - 1][1] < solarPrice[0][1] * 0.1)) throw new Error("solar prices: wrong column?");
  if (!nobel.some(([y, c, , w]) => y === 2020 && c === "Chemistry" && w.join(" ").includes("genome editing"))) throw new Error("Nobel 2020 chemistry not found: wrong query?");

  const today = new Date().toISOString().slice(0, 10);
  const J = (x) => JSON.stringify(x);
  const evWorld = world(ev, "ev_sales_share");
  fs.writeFileSync(
    OUT,
    `/**
 * The frontiers of invention the Innovations page charts: artificial
 * intelligence, clean energy, robots, computing, nuclear weapons, and the
 * Nobel Prizes in the sciences.
 *
 * GENERATED by build-frontiers.cjs on ${today} - do not edit by hand; change
 * the script and re-run it.
 *
 * Every figure is its publisher's, as Our World in Data republishes it, or
 * the Nobel Prize's own record; each with its year.
 */
const owid = (slug: string, by: string) => ({ label: \`\${by}, via Our World in Data (CC BY 4.0)\`, url: \`https://ourworldindata.org/grapher/\${slug}\` });
export const FRONTIER_SOURCES = {
  aiCompute: owid("exponential-growth-of-computation-in-the-training-of-notable-ai-systems", "Epoch AI — training computation of notable AI systems"),
  aiCountries: owid("cumulative-number-of-large-scale-ai-systems-by-country", "Epoch AI — large-scale AI systems by country"),
  solarPrice: owid("solar-pv-prices", "IRENA and Nemet — solar photovoltaic module prices"),
  solar: owid("installed-solar-pv-capacity", "IRENA — installed solar capacity"),
  wind: owid("cumulative-installed-wind-energy-capacity-gigawatts", "IRENA — installed wind capacity"),
  renew: owid("share-of-electricity-production-from-renewable-sources", "Ember and the Energy Institute — share of electricity from renewables"),
  renewKinds: owid("share-elec-by-source", "Ember and the Energy Institute — share of electricity by source"),
  lcoe: owid("levelized-cost-of-energy", "IRENA — levelized cost of electricity by technology"),
  ev: owid("electric-car-sales-share", "IEA — Global EV Outlook, electric car sales share"),
  robots: owid("annual-industrial-robots-installed", "International Federation of Robotics — industrial robot installations"),
  flops: owid("supercomputer-power-flops", "TOP500 — the fastest supercomputer"),
  nukes: owid("nuclear-warhead-inventories", "Federation of American Scientists — nuclear warhead inventories"),
  nobel: { label: "Nobel Prize Outreach — the Nobel Prize API (metadata CC0)", url: "https://www.nobelprize.org/" },
};

/** The most compute used to train any notable AI system each year: [year, system, petaFLOP]. */
export const AI_COMPUTE_MAX: [year: number, system: string, petaflop: number][] = ${J(aiMax)};
/** The ten most recent notable AI systems Epoch AI records: [system, day published, petaFLOP]. */
export const AI_LATEST: [system: string, day: string, petaflop: number][] = ${J(aiLatest)};
/** Large-scale AI systems, counted to date, by country. */
export const AI_COUNTRIES: { year: number; rows: [country: string, n: number][] } = ${J(aiTop)};

/** Solar photovoltaic module prices, US$ per watt (2024 dollars): the world's. */
export const SOLAR_PRICE: [year: number, usdPerWatt: number][] = ${J(solarPrice)};
/** Installed capacity, gigawatts: the world's, and the ten largest countries'. */
export const SOLAR_GW: { world: [year: number, v: number][]; top: { year: number; rows: [country: string, v: number][] } } = { world: ${J(world(solar, "solar__total_gw"))}, top: ${J(topLatest(solar, "solar__total_gw"))} };
export const WIND_GW: { world: [year: number, v: number][]; top: { year: number; rows: [country: string, v: number][] } } = { world: ${J(world(wind, "wind__total_gw"))}, top: ${J(topLatest(wind, "wind__total_gw"))} };
/** The share of the world's electricity made from renewable sources, %. */
export const RENEWABLE_SHARE: [year: number, pct: number][] = ${J(world(renew, "renewable_share_of_electricity__pct"))};
/** Each kind of renewable electricity: its share of the world's electricity, %, in ${kindsLast} and in 2000. */
export const RENEWABLE_KINDS: { year: number; first: number; rows: [kind: string, pct: number | null, pct2000: number | null][] } = { year: ${kindsLast}, first: 2000, rows: ${J(renewKinds)} };
/** What a kilowatt-hour of electricity costs to make, US$, by technology: [technology, ${lcoeFirst}, ${lcoeLast}], the world's. */
export const LCOE: { first: number | null; last: number | null; rows: [tech: string, first: number | null, last: number | null][] } = { first: ${lcoeFirst}, last: ${lcoeLast}, rows: ${J(lcoeRows)} };
/** The share of new cars sold that are electric, %: the world's, and the ten highest countries'. */
export const EV_SHARE: { world: [year: number, v: number][]; top: { year: number; rows: [country: string, v: number][] } } = { world: ${J(evWorld)}, top: ${J(topLatest(ev, "ev_sales_share"))} };

/** Industrial robots installed each year: the world's, and the ten countries installing the most. */
export const ROBOTS: { world: [year: number, v: number][]; top: { year: number; rows: [country: string, v: number][] } } = { world: ${J(robotsWorld)}, top: ${J(robotsTop)} };
/** The computing power of the world's fastest supercomputer, gigaFLOPS. */
export const FASTEST_SUPERCOMPUTER: [year: number, gigaflops: number][] = ${J(flops)};

/** Nuclear warheads in ${nukesYear}, by country: [country, deployed strategic, deployed non-strategic, in reserve, retired]. */
export const NUCLEAR_WARHEADS: { year: number; rows: [country: string, strategic: number, nonStrategic: number, reserve: number, retired: number][] } = { year: ${nukesYear}, rows: ${J(nukesRows)} };

/** The Nobel Prizes in physics, chemistry and medicine: [year, field, laureates, the committee's words]. */
export const NOBEL_SCIENCE: [year: number, field: string, laureates: string[], why: string[]][] = ${J(nobel)};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log("ai max", J(aiMax.slice(-3)), "latest", J(aiLatest.slice(0, 2)), "countries", J(aiTop.rows.slice(0, 3)));
  console.log("solar", J(solarPrice.slice(-1)), "lcoe", lcoeFirst, lcoeLast, J(lcoeRows.slice(0, 2)), "ev", J(evWorld.slice(-1)), "robots", J(robotsWorld.slice(-1)), J(robotsTop.rows.slice(0, 2)));
  console.log("nukes", nukesYear, J(nukesRows.slice(0, 3)), "nobel", nobel.length, J(nobel[0]).slice(0, 200));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
