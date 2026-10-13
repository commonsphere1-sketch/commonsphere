/**
 * Builds src/data/earthStatus.ts — for the Climate page: the state of the
 * world's fresh water, its forests, its wildfires and its wildlife, each
 * from the newest figures an open source publishes.
 *
 *   Fresh water      World Bank, World Development Indicators (CC BY 4.0),
 *                    which carries the FAO's AQUASTAT and the WHO/UNICEF
 *                    monitoring programme: the renewable fresh water there is
 *                    for each person in the world, year by year; how much of
 *                    it is withdrawn; each country's level of water stress -
 *                    withdrawals as a share of what is available - and the
 *                    share of people with safely managed drinking water.
 *   Forests          World Bank (CC BY 4.0), carrying the FAO's forest area:
 *                    the world's, and each country's, with the change over
 *                    the last ten years worked out here. And Global Forest
 *                    Watch's tree cover loss by year (CC BY 4.0), read
 *                    through Our World in Data.
 *   Wildfire         The Global Wildfire Information System's area burnt by
 *                    year and country (European Commission, CC BY 4.0), read
 *                    through Our World in Data; the current year is to date.
 *   Wildlife         NOAA Coral Reef Watch (public domain): the share of the
 *                    world's reef area under bleaching-level heat in the
 *                    global bleaching event now going on, as its report
 *                    states it. The two measures most often quoted for
 *                    wildlife as a whole are not here: the IUCN Red List's
 *                    terms do not allow a site that takes payment to
 *                    republish it, and the terms of the Living Planet Index
 *                    could not be confirmed. Nothing is put in their place.
 *
 * Tree cover loss is not deforestation: it counts trees lost to fire,
 * forestry and storms as well as land cleared for good, and the page says so.
 * A rank, a change between two years and a share of a total are worked out
 * here from the source's figures and are said to be.
 *
 *   node build-earth-status.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/earthStatus.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-earth-status");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const THIS_YEAR = Number(TODAY.slice(0, 4));

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return fs.readFileSync(at, "utf8");
  let last;
  // The World Bank's service is slow to answer some days: three tries, a minute each.
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.writeFileSync(at, text);
      return text;
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`${url}: ${last.message}`);
}
const round = (v, dp = 1) => Number(v.toFixed(dp));

/* ── The World Bank's countries, and a series for the world or for every country ── */
async function countryCodes() {
  const list = JSON.parse(await cached("wb-countries.json", "https://api.worldbank.org/v2/country?format=json&per_page=400"))[1];
  const real = list.filter((c) => c.region && c.region.id !== "NA");
  if (real.length < 200) throw new Error(`World Bank: only ${real.length} countries are listed`);
  return { iso2: new Map(real.map((c) => [c.id, c.iso2Code])), name: new Map(real.map((c) => [c.iso2Code, c.name])) };
}
async function world(indicator) {
  const rows = JSON.parse(await cached(`wld-${indicator}.json`, `https://api.worldbank.org/v2/country/WLD/indicator/${indicator}?format=json&per_page=200`))[1] ?? [];
  const got = rows.filter((r) => r.value !== null).map((r) => [Number(r.date), r.value]).sort((a, b) => a[0] - b[0]);
  if (!got.length) throw new Error(`World Bank: no world figure for ${indicator}`);
  return got;
}
/** Every country's figures for an indicator: by ISO code, the years it has, oldest first. */
async function countries(indicator, codes, from = 2000) {
  const rows = JSON.parse(await cached(`all-${indicator}.json`, `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=20000&date=${from}:${THIS_YEAR}`))[1] ?? [];
  const out = {};
  for (const r of rows) {
    const code = codes.iso2.get(r.countryiso3code);
    if (code && r.value !== null) (out[code] ??= []).push([Number(r.date), r.value]);
  }
  for (const v of Object.values(out)) v.sort((a, b) => a[0] - b[0]);
  if (Object.keys(out).length < 100) throw new Error(`World Bank: only ${Object.keys(out).length} countries have ${indicator}`);
  return out;
}
const latest = (series) => series[series.length - 1];

/* ── Fresh water ── */
async function water(codes) {
  const perHead = await world("ER.H2O.INTR.PC");
  const withdrawn = await world("ER.H2O.FWTL.ZS");
  const drinking = await world("SH.H2O.SMDW.ZS");
  const stress = await countries("ER.H2O.FWST.ZS", codes);
  // Each country's newest level of stress, and the year most of them are of.
  const now = Object.entries(stress).map(([code, s]) => ({ code, y: latest(s)[0], v: latest(s)[1] }));
  const year = Math.max(...now.map((r) => r.y));
  const of = now.filter((r) => r.y === year).sort((a, b) => b.v - a.v);
  if (of.length < 120) throw new Error(`water stress: only ${of.length} countries have ${year}`);
  // Every tenth year of the world's water per person, and the newest.
  const first = perHead[0];
  const last = latest(perHead);
  const steps = perHead.filter(([y]) => y === first[0] || y === last[0] || y % 10 === 0);
  return {
    perHead: { first: [first[0], Math.round(first[1])], latest: [last[0], Math.round(last[1])], steps: steps.map(([y, v]) => [y, Math.round(v)]) },
    withdrawn: { y: latest(withdrawn)[0], v: round(latest(withdrawn)[1]) },
    drinking: { first: [drinking[0][0], round(drinking[0][1])], latest: [latest(drinking)[0], round(latest(drinking)[1])] },
    stress: {
      year,
      countries: of.length,
      // Withdrawing more fresh water than is renewed, and at least a quarter of it.
      over100: of.filter((r) => r.v > 100).length,
      over25: of.filter((r) => r.v > 25).length,
      top: of.slice(0, 12).map((r) => [r.code, codes.name.get(r.code), round(r.v)]),
    },
  };
}

/* ── Forests ── */
async function owid(slug) {
  const lines = (await cached(`owid-${slug}.csv`, `https://ourworldindata.org/grapher/${slug}.csv?csvType=full&useColumnShortNames=true`)).trim().split(/\r?\n/);
  const head = lines[0].split(",");
  if (head.slice(0, 3).join() !== "entity,code,year" || head.length < 4) throw new Error(`${slug}: its columns are ${lines[0]}`);
  // A name with a comma in it is quoted: the code, the year and the figure are the last three cells of a line.
  return lines.slice(1).map((l) => {
    const c = l.split(",");
    return { code: c[c.length - 3], year: Number(c[c.length - 2]), v: Number(c[c.length - 1]) };
  }).filter((r) => Number.isFinite(r.year) && Number.isFinite(r.v));
}
async function forests(codes) {
  const area = await world("AG.LND.FRST.K2");
  const share = await world("AG.LND.FRST.ZS");
  const by = await countries("AG.LND.FRST.K2", codes, 1990);
  const [y1, a1] = latest(area);
  const before = area.find(([y]) => y === y1 - 10);
  if (!before) throw new Error(`forests: no world figure for ${y1 - 10}`);
  // Each country's forest ten years before the newest year, and in it.
  const moved = Object.entries(by)
    .map(([code, s]) => {
      const a = s.find(([y]) => y === y1 - 10);
      const b = s.find(([y]) => y === y1);
      return a && b ? { code, change: Math.round(b[1] - a[1]) } : null;
    })
    .filter(Boolean);
  if (moved.length < 150) throw new Error(`forests: only ${moved.length} countries have both years`);
  const lost = [...moved].sort((a, b) => a.change - b.change).filter((r) => r.change < 0).slice(0, 8);
  const gained = [...moved].sort((a, b) => b.change - a.change).filter((r) => r.change > 0).slice(0, 8);
  const loss = await owid("tree-cover-loss");
  const lossWorld = loss.filter((r) => r.code === "OWID_WRL").sort((a, b) => a.year - b.year);
  if (lossWorld.length < 20) throw new Error(`tree cover loss: only ${lossWorld.length} years for the world`);
  const lossYear = latest(lossWorld).year;
  const lossTop = loss
    .filter((r) => r.year === lossYear && codes.iso2.has(r.code))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8)
    .map((r) => [codes.iso2.get(r.code), codes.name.get(codes.iso2.get(r.code)), Math.round(r.v)]);
  const most = lossWorld.reduce((b, r) => (r.v > b.v ? r : b));
  return {
    area: { latest: [y1, Math.round(a1)], before: [before[0], Math.round(before[1])], first: [area[0][0], Math.round(area[0][1])] },
    share: { latest: [latest(share)[0], round(latest(share)[1])], first: [share[0][0], round(share[0][1])] },
    lost: lost.map((r) => [r.code, codes.name.get(r.code), r.change]),
    gained: gained.map((r) => [r.code, codes.name.get(r.code), r.change]),
    treeLoss: { years: lossWorld.map((r) => [r.year, Math.round(r.v)]), most: [most.year, Math.round(most.v)], top: lossTop, year: lossYear },
  };
}

/* ── Wildfire ── */
async function wildfire(codes) {
  const rows = await owid("annual-area-burnt-by-wildfires");
  const w = rows.filter((r) => r.code === "OWID_WRL").sort((a, b) => a.year - b.year);
  if (w.length < 10) throw new Error(`wildfire: only ${w.length} years for the world`);
  // The current year is still being added to: it is given apart, as the year to date.
  const whole = w.filter((r) => r.year < THIS_YEAR);
  const now = w.find((r) => r.year === THIS_YEAR) ?? null;
  const year = latest(whole).year;
  const most = whole.reduce((b, r) => (r.v > b.v ? r : b));
  const top = rows
    .filter((r) => r.year === year && codes.iso2.has(r.code))
    .sort((a, b) => b.v - a.v)
    .slice(0, 10)
    .map((r) => [codes.iso2.get(r.code), codes.name.get(codes.iso2.get(r.code)), Math.round(r.v)]);
  return { years: whole.map((r) => [r.year, Math.round(r.v)]), year, most: [most.year, Math.round(most.v)], toDate: now ? [now.year, Math.round(now.v)] : null, top };
}

/* ── Wildlife: the world's coral reefs, as NOAA's report states it ── */
async function reefs() {
  const html = await cached("coral.html", "https://coralreefwatch.noaa.gov/satellite/research/coral_bleaching_report.php");
  const plain = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const now = plain.match(/From (\d{1,2} \w+ \d{4}) to (\d{1,2} \w+ \d{4}), bleaching-level heat stress has impacted ~?([\d.]+)% of the world.s coral reef area and mass coral bleaching has been documented in at least (\d+) countries and territories/);
  const before = plain.match(/3rd global coral bleaching event, which occurred from (\d{4})-(\d{4}), when ([\d.]+)% of the world.s reef area experienced bleaching-level heat stress/);
  if (!now || !before) throw new Error("NOAA Coral Reef Watch: its report no longer states the two shares in the words read here");
  return { from: now[1], to: now[2], share: Number(now[3]), places: Number(now[4]), before: { from: Number(before[1]), to: Number(before[2]), share: Number(before[3]) } };
}

(async () => {
  const codes = await countryCodes();
  const w = await water(codes);
  const f = await forests(codes);
  const fire = await wildfire(codes);
  const reef = await reefs();
  const j = (v) => JSON.stringify(v);
  fs.writeFileSync(
    OUT,
    `/**
 * The state of the world's fresh water, its forests, its wildfires and its
 * wildlife, for the Climate page: each from the newest figures an open
 * source publishes.
 *
 * GENERATED by build-earth-status.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * A rank, a change between two years and a share are worked out from the
 * source's own figures. Tree cover loss is not deforestation. The IUCN Red
 * List and the Living Planet Index are not here: the first's terms do not
 * allow it on a site that takes payment, and the second's could not be
 * confirmed.
 */
export const EARTH_STATUS_RETRIEVED = "${TODAY}";
export const EARTH_STATUS_SOURCES = {
  water: { label: "World Bank — World Development Indicators: fresh water, from FAO AQUASTAT and the WHO/UNICEF Joint Monitoring Programme (CC BY 4.0)", url: "https://data.worldbank.org/indicator/ER.H2O.FWST.ZS" },
  forest: { label: "World Bank — World Development Indicators: forest area, from the FAO (CC BY 4.0)", url: "https://data.worldbank.org/indicator/AG.LND.FRST.K2" },
  treeLoss: { label: "Global Forest Watch — tree cover loss, via Our World in Data (CC BY 4.0)", url: "https://ourworldindata.org/grapher/tree-cover-loss" },
  fire: { label: "Global Wildfire Information System — area burnt, via Our World in Data (CC BY 4.0)", url: "https://ourworldindata.org/grapher/annual-area-burnt-by-wildfires" },
  reefs: { label: "NOAA Coral Reef Watch — the fourth global coral bleaching event (public domain)", url: "https://coralreefwatch.noaa.gov/satellite/research/coral_bleaching_report.php" },
};

type Ranked = [code: string, name: string, value: number];

/** Fresh water. */
export const FRESH_WATER: {
  /** Renewable internal fresh water for each person in the world, cubic metres a year: the first and the newest year, and every tenth between. */
  perHead: { first: [year: number, m3: number]; latest: [year: number, m3: number]; steps: [year: number, m3: number][] };
  /** The world's withdrawals, as a share of its internal fresh water. */
  withdrawn: { y: number; v: number };
  /** The share of the world's people using safely managed drinking water. */
  drinking: { first: [year: number, pct: number]; latest: [year: number, pct: number] };
  /** Water stress: withdrawals as a share of the fresh water available. How many countries have a figure, how many withdraw more than a quarter and more than the whole of it, and the twelve highest. */
  stress: { year: number; countries: number; over100: number; over25: number; top: Ranked[] };
} = ${j(w)};

/** Forests. */
export const FORESTS: {
  /** The world's forest, square kilometres: the newest year, ten years before it, and the first in the series. */
  area: { latest: [year: number, km2: number]; before: [year: number, km2: number]; first: [year: number, km2: number] };
  /** As a share of the world's land. */
  share: { latest: [year: number, pct: number]; first: [year: number, pct: number] };
  /** The countries whose forest shrank and grew the most over those ten years, square kilometres: worked out here. */
  lost: Ranked[];
  gained: Ranked[];
  /** Tree cover loss, hectares a year: every year for the world, the year of the most, and the countries that lost the most in the newest year. */
  treeLoss: { years: [year: number, ha: number][]; most: [year: number, ha: number]; top: Ranked[]; year: number };
} = ${j(f)};

/** Wildfire: area burnt, hectares. Every whole year for the world, the year of the most, the current year to date, and the countries that burnt the most in the newest whole year. */
export const WILDFIRE: { years: [year: number, ha: number][]; year: number; most: [year: number, ha: number]; toDate: [year: number, ha: number] | null; top: Ranked[] } = ${j(fire)};

/** Wildlife: the world's coral reefs in the global bleaching event now going on, as NOAA's report states it, and in the one before. */
export const CORAL_REEFS: { from: string; to: string; share: number; places: number; before: { from: number; to: number; share: number } } = ${j(reef)};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  water per head ${w.perHead.first.join(": ")} -> ${w.perHead.latest.join(": ")} m3; withdrawn ${w.withdrawn.v}% (${w.withdrawn.y}); drinking ${w.drinking.latest[1]}% (${w.drinking.latest[0]}); stress ${w.stress.year}: ${w.stress.countries} countries, ${w.stress.over100} over 100%, top ${w.stress.top.slice(0, 3).map((t) => `${t[1]} ${t[2]}%`).join(", ")}`);
  console.log(`  forest ${f.area.latest.join(": ")} km2 (${f.share.latest[1]}%), ${f.area.before.join(": ")}; lost most ${f.lost.slice(0, 3).map((t) => `${t[1]} ${t[2]}`).join(", ")}; tree loss ${f.treeLoss.year}: ${f.treeLoss.years[f.treeLoss.years.length - 1][1]} ha, most ${f.treeLoss.most.join(": ")}`);
  console.log(`  fire ${fire.year}: ${fire.years[fire.years.length - 1][1]} ha; most ${fire.most.join(": ")}; to date ${fire.toDate?.join(": ")}; top ${fire.top.slice(0, 3).map((t) => `${t[1]} ${t[2]}`).join(", ")}`);
  console.log(`  reefs ${reef.share}% (${reef.from} to ${reef.to}), ${reef.places} places; before ${reef.before.share}%`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
