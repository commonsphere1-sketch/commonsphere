/**
 * Builds src/data/climateWatch.ts — for the Climate page: the seasonal swing
 * of El Niño and La Niña, the records in the measured series, which
 * countries disasters struck and how hard, what is published on erosion, and
 * how much warmer each country is projected to be.
 *
 * Every figure is read from its source when this runs, and each part says
 * what is the source's and what is counted here:
 *
 *   NOAA Climate Prediction      The Oceanic Niño Index: the three-month
 *     Center, ONI (public         mean sea-surface temperature anomaly in
 *     domain)                     the Niño 3.4 region, every overlapping
 *                                 season since 1950. NOAA calls it El Niño
 *                                 or La Niña when the index is at or beyond
 *                                 +0.5 or -0.5 for five overlapping seasons
 *                                 running; the episodes are counted here by
 *                                 that rule, and a run that has not reached
 *                                 five seasons is said not to have.
 *   NASA GISTEMP v4 (public      The global mean surface temperature
 *     domain)                     anomaly against 1951-1980, by year and
 *                                 month: the warmest and coldest years, and
 *                                 where the latest year and month stand,
 *                                 ranked here from the series.
 *   NSIDC Sea Ice Index v4       Arctic sea-ice extent in September and
 *     (public domain: NOAA)       Antarctic in February - the months of each
 *                                 one's yearly low - ranked here.
 *   NOAA Global Monitoring       Carbon dioxide at Mauna Loa, by month: the
 *     Laboratory (public domain)  highest monthly mean in the record.
 *   Internal Displacement        New displacements of people within their
 *     Monitoring Centre, via      country associated with disasters, by
 *     the World Bank (CC BY 4.0)  country, for the latest year published. A
 *                                 displacement is a movement, not a person:
 *                                 one person forced out twice is two.
 *   Global Disaster Alert and    The orange and red alerts of the last
 *     Coordination System        twelve months, by kind of disaster and by
 *     (CC BY 4.0, under the       the countries listed as affected: counted
 *     European Commission's       here. An alert says a disaster is likely
 *     notice)                     to need international help; it is not a
 *                                 count of damage, which nobody publishes
 *                                 for every country under terms that allow
 *                                 it here (EM-DAT's do not).
 *   Luijendijk et al. 2018,      Two findings on erosion, each quoted from
 *     Scientific Reports;        its paper's abstract and checked against
 *     Borrelli et al. 2017,      the page when this runs: if the abstract no
 *     Nature Communications      longer says it, the build stops. The
 *     (both CC BY 4.0)            abstracts are read from Europe PMC.
 *   World Bank Climate Change    Projected change in mean annual
 *     Knowledge Portal, CMIP6     temperature for each country in 2040-2059
 *     (CC BY 4.0)                 and 2080-2099, against the Portal's
 *                                 reference period 1995-2014: the median of
 *                                 the multi-model ensemble, under four of
 *                                 the IPCC's scenarios. A projection is not
 *                                 a forecast: it is what the models give if
 *                                 emissions follow that scenario.
 *
 * Left out, because no source could be read for them under terms that allow
 * a site that takes payment: the money cost of disasters country by country
 * (EM-DAT), and each country's all-time highest and lowest temperature
 * (the WMO's archive is not published as a table that can be read here).
 *
 *   node build-climate-watch.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/climateWatch.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-climate-watch");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

const URLS = {
  oni: "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt",
  gistemp: "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv",
  arctic: "https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv",
  antarctic: "https://noaadata.apps.nsidc.org/NOAA/G02135/south/monthly/data/S_02_extent_v4.0.csv",
  co2: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt",
  countries: "https://api.worldbank.org/v2/country?format=json&per_page=400",
  displaced: "https://api.worldbank.org/v2/country/all/indicator/VC.IDP.NWDS?format=json&per_page=20000&date=2015:2030",
  beaches: "https://doi.org/10.1038/s41598-018-24630-6",
  soil: "https://doi.org/10.1038/s41467-017-02142-7",
};
/** A paper's record at Europe PMC, by its DOI: its abstract and its licence. */
const epmc = (doi) => `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:%22${doi}%22&resultType=core&format=json`;
/** A thin or a no-break space, and a curled apostrophe: written plainly before an abstract is compared. */
const THIN = new RegExp("[" + String.fromCharCode(0x2009, 0xa0) + "]", "g");
const CURLED = new RegExp(String.fromCharCode(0x2019), "g");
const SCENARIOS = [
  ["ssp126", "SSP1-2.6", "emissions cut hard, to net zero after 2050"],
  ["ssp245", "SSP2-4.5", "emissions stay near today's until mid-century, then fall"],
  ["ssp370", "SSP3-7.0", "emissions keep rising, roughly doubling by 2100"],
  ["ssp585", "SSP5-8.5", "emissions rise fast, doubling by 2050"],
];
const PERIODS = ["2040-2059", "2080-2099"];
const cckp = (scenario, period) => `https://cckpapi.worldbank.org/cckp/v1/cmip6-x0.25_climatology_tas_anomaly_annual_${period}_median_${scenario}_ensemble_all_mean/all_countries?_format=json`;

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 12 * 3600e3) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}
const round = (v, dp) => Number(v.toFixed(dp));

/* ── El Niño and La Niña ── */
const SEASONS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"];
async function enso() {
  const rows = (await cached("oni.txt", URLS.oni))
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .map(([s, y, , a]) => ({ s: SEASONS.indexOf(s), y: Number(y), a: Number(a) }));
  if (rows.length < 900 || rows.some((r) => r.s < 0 || !Number.isFinite(r.a) || !Number.isFinite(r.y))) throw new Error("ONI: the table could not be read");
  // NOAA's rule: five overlapping seasons running at or beyond the threshold make an episode.
  const side = (a) => (a >= 0.5 ? 1 : a <= -0.5 ? -1 : 0);
  const runs = [];
  for (let i = 0; i < rows.length; ) {
    const k = side(rows[i].a);
    let j = i;
    while (j + 1 < rows.length && side(rows[j + 1].a) === k) j++;
    if (k !== 0) runs.push({ k, from: i, to: j });
    i = j + 1;
  }
  const said = (r) => `${SEASONS[r.s]} ${r.y}`;
  const episode = (run) => {
    const part = rows.slice(run.from, run.to + 1);
    const peak = part.reduce((b, r) => (Math.abs(r.a) > Math.abs(b.a) ? r : b));
    return { kind: run.k > 0 ? "El Niño" : "La Niña", from: said(rows[run.from]), to: said(rows[run.to]), seasons: part.length, peak: peak.a, peakAt: said(peak) };
  };
  const last = rows[rows.length - 1];
  const open = runs.length && runs[runs.length - 1].to === rows.length - 1 ? runs[runs.length - 1] : null;
  const episodes = runs.filter((r) => r.to - r.from + 1 >= 5).map((r) => ({ ...episode(r), ...(r === open ? { ongoing: true } : {}) }));
  return {
    latest: { season: said(last), anom: last.a },
    // What the index says now: an episode, a run short of one, or neither.
    state: open ? (open.to - open.from + 1 >= 5 ? (open.k > 0 ? "El Niño" : "La Niña") : open.k > 0 ? "El Niño conditions" : "La Niña conditions") : "Neutral",
    run: open ? episode(open) : null,
    // Every season since 2000, for the chart: the year, the season's place in the year, the index.
    since: 2000,
    seasons: rows.filter((r) => r.y >= 2000).map((r) => [r.y, r.s, r.a]),
    episodes: episodes.filter((e) => Number(e.to.slice(-4)) >= 1990).reverse(),
    strongest: {
      warm: episodes.filter((e) => e.kind === "El Niño").sort((a, b) => b.peak - a.peak).slice(0, 5),
      cold: episodes.filter((e) => e.kind === "La Niña").sort((a, b) => a.peak - b.peak).slice(0, 5),
    },
    first: rows[0].y,
  };
}

/* ── Records in the measured series ── */
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
async function records() {
  // Temperature.
  const lines = (await cached("gistemp.csv", URLS.gistemp)).trim().split(/\r?\n/);
  const head = lines.findIndex((l) => /^Year,Jan,/.test(l));
  if (head < 0) throw new Error("GISTEMP: the table's header was not found");
  const cols = lines[head].split(",");
  const iYear = cols.indexOf("J-D");
  const rows = lines.slice(head + 1).map((l) => l.split(","));
  const num = (c) => (c === undefined || /\*/.test(c) || c.trim() === "" ? null : Number(c));
  const years = rows.map((r) => ({ y: Number(r[0]), v: num(r[iYear]) })).filter((r) => r.v !== null && Number.isFinite(r.v));
  if (years.length < 140) throw new Error(`GISTEMP: only ${years.length} whole years were read`);
  const warm = [...years].sort((a, b) => b.v - a.v);
  const latestYear = years[years.length - 1];
  // The latest month with a figure, and where it stands among the same month of every year.
  let month = null;
  for (let i = rows.length - 1; i >= 0 && !month; i--)
    for (let m = 12; m >= 1; m--) {
      const v = num(rows[i][m]);
      if (v !== null) {
        const same = rows.map((r) => num(r[m])).filter((x) => x !== null);
        month = { y: Number(rows[i][0]), m, v, rank: same.filter((x) => x > v).length + 1, of: same.length };
        break;
      }
    }
  // Sea ice: year, month, source, region, extent, area.
  const ice = async (name, url) => {
    const r = (await cached(name, url))
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.split(",").map((c) => c.trim()))
      .map((c) => ({ y: Number(c[0]), v: Number(c[4]) }))
      .filter((x) => Number.isFinite(x.v) && x.v > 0);
    if (r.length < 40) throw new Error(`${name}: only ${r.length} years were read`);
    const low = [...r].sort((a, b) => a.v - b.v);
    const latest = r[r.length - 1];
    return { lowest: low.slice(0, 5).map((x) => [x.y, x.v]), latest: { y: latest.y, v: latest.v, rank: low.findIndex((x) => x.y === latest.y) + 1, of: r.length }, first: r[0].y };
  };
  // Carbon dioxide: year, month, decimal date, monthly mean, ...
  const co2 = (await cached("co2.txt", URLS.co2))
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.trim().split(/\s+/).map(Number))
    .filter((c) => c[3] > 0)
    .map((c) => ({ y: c[0], m: c[1], v: c[3] }));
  if (co2.length < 700) throw new Error(`CO2: only ${co2.length} months were read`);
  const high = co2.reduce((b, r) => (r.v > b.v ? r : b));
  return {
    temperature: {
      baseline: "1951–1980",
      first: years[0].y,
      warmest: warm.slice(0, 10).map((r) => [r.y, r.v]),
      coldest: [warm[warm.length - 1].y, warm[warm.length - 1].v],
      latestYear: { y: latestYear.y, v: latestYear.v, rank: warm.findIndex((r) => r.y === latestYear.y) + 1, of: years.length },
      latestMonth: month && { month: `${MONTH_NAMES[month.m - 1]} ${month.y}`, name: MONTH_NAMES[month.m - 1], v: month.v, rank: month.rank, of: month.of },
    },
    arctic: await ice("arctic.csv", URLS.arctic),
    antarctic: await ice("antarctic.csv", URLS.antarctic),
    co2: { high: { month: `${MONTH_NAMES[high.m - 1]} ${high.y}`, v: high.v }, first: co2[0].y, latest: { month: `${MONTH_NAMES[co2[co2.length - 1].m - 1]} ${co2[co2.length - 1].y}`, v: co2[co2.length - 1].v } },
  };
}

/* ── Disasters ── */
async function countryCodes() {
  const list = JSON.parse(await cached("wb-countries.json", URLS.countries))[1];
  // An aggregate - the world, a region, an income group - is not a country.
  const real = list.filter((c) => c.region && c.region.id !== "NA");
  if (real.length < 200) throw new Error(`World Bank: only ${real.length} countries are listed`);
  return { iso2: new Map(real.map((c) => [c.id, c.iso2Code])), name: new Map(real.map((c) => [c.iso2Code, c.name])) };
}
async function displaced(codes) {
  const rows = JSON.parse(await cached("nwds.json", URLS.displaced))[1].filter((r) => r.value !== null);
  const year = rows.map((r) => r.date).sort().pop();
  const of = rows.filter((r) => r.date === year);
  const world = of.find((r) => r.countryiso3code === "WLD");
  const byCountry = {};
  for (const r of of) {
    const code = codes.iso2.get(r.countryiso3code);
    if (code && r.value > 0) byCountry[code] = r.value;
  }
  if (Object.keys(byCountry).length < 100) throw new Error(`IDMC: only ${Object.keys(byCountry).length} countries have a figure for ${year}`);
  const top = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([code, v]) => [code, codes.name.get(code), v]);
  return { year: Number(year), world: world ? world.value : null, countries: Object.keys(byCountry).length, top, byCountry };
}
/** How many days ago an alert may have ended and still count as happening now. */
const RECENT_DAYS = 30;
const HAZARDS = { EQ: "Earthquake", TC: "Tropical cyclone", FL: "Flood", VO: "Volcanic eruption", DR: "Drought", WF: "Wildfire", TS: "Tsunami" };
async function alerts(codes) {
  // A month at a time, so that no answer is cut short; an event is counted once, by its kind and number.
  const seen = new Map();
  for (let m = 12; m >= 1; m--) {
    const from = daysAgo(m * 31);
    const to = m === 1 ? TODAY : daysAgo((m - 1) * 31 - 1);
    const d = JSON.parse(await cached(`gdacs-${from}.json`, `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=orange;red&fromDate=${from}&toDate=${to}`));
    if (!d || !Array.isArray(d.features)) continue;
    if (d.features.length >= 100) throw new Error(`GDACS: ${d.features.length} events between ${from} and ${to} - the answer may be cut short`);
    for (const f of d.features) seen.set(`${f.properties.eventtype}-${f.properties.eventid}`, f.properties);
  }
  const since = daysAgo(365);
  const byKind = {};
  const byCountry = {};
  const reds = [];
  const events = [];
  const recentFrom = daysAgo(RECENT_DAYS);
  let n = 0;
  for (const p of seen.values()) {
    const kind = HAZARDS[p.eventtype];
    if (!kind) throw new Error(`GDACS: an event of a kind not known, ${p.eventtype}`);
    if (!/^(Orange|Red)$/.test(p.alertlevel) || String(p.todate).slice(0, 10) < since) continue;
    n++;
    const k = (byKind[kind] ??= { orange: 0, red: 0 });
    const level = p.alertlevel.toLowerCase();
    k[level]++;
    const listed = [...new Set((p.affectedcountries ?? []).map((c) => c.iso2).filter((c) => /^[A-Z]{2}$/.test(c ?? "") && codes.name.has(c)))];
    for (const c of listed) {
      const e = (byCountry[c] ??= { orange: 0, red: 0 });
      e[level]++;
    }
    const said = p.severitydata?.severitytext ? String(p.severitydata.severitytext).replace(/\s+/g, " ").trim() : "";
    const event = {
      kind,
      ...(p.eventname ? { name: String(p.eventname).trim() } : {}),
      from: String(p.fromdate).slice(0, 10),
      to: String(p.todate).slice(0, 10),
      countries: listed,
      // The system writes "Magnitude 0" for a flood it gives no size for: that is not a size, and is not kept.
      ...(said && said !== "Magnitude 0" ? { said } : {}),
      url: p.url.report,
    };
    if (p.alertlevel === "Red") reds.push(event);
    // Still going, or ended within the last ${RECENT_DAYS} days: what is happening now.
    events.push({ ...event, alert: p.alertlevel, ...(p.iscurrent === "true" ? { current: true } : {}), ...(p.iscurrent === "true" || event.to >= recentFrom ? { recent: true } : {}) });
  }
  if (n < 10) throw new Error(`GDACS: only ${n} alerts in twelve months`);
  reds.sort((a, b) => b.to.localeCompare(a.to));
  events.sort((a, b) => Number(Boolean(b.current)) - Number(Boolean(a.current)) || b.to.localeCompare(a.to) || b.from.localeCompare(a.from));
  const most = Object.entries(byCountry)
    .map(([code, v]) => [code, codes.name.get(code), v.orange, v.red])
    .sort((a, b) => b[2] + b[3] - (a[2] + a[3]) || b[3] - a[3])
    .slice(0, 15);
  return { from: since, to: TODAY, total: n, byKind, countries: Object.keys(byCountry).length, most, reds, byCountry, events };
}

/* ── Erosion: two findings, each as its paper's abstract states it ── */
async function erosion() {
  const abstract = async (name, url) => {
    const doi = url.replace("https://doi.org/", "");
    const found = JSON.parse(await cached(name, epmc(doi))).resultList?.result ?? [];
    const paper = found.find((r) => r.doi === doi);
    if (!paper || !paper.abstractText) throw new Error(`${doi}: no abstract was found at Europe PMC`);
    // The paper must still be under the licence that lets it be quoted here.
    if (paper.license !== "cc by") throw new Error(`${doi}: its licence is "${paper.license}", not CC BY`);
    return paper.abstractText.replace(/<[^>]+>/g, "").replace(THIN, " ").replace(CURLED, "'").replace(/\s+/g, " ");
  };
  const need = (text, re, what) => {
    if (!re.test(text)) throw new Error(`erosion: the abstract no longer says ${what}`);
  };
  const beaches = await abstract("beaches.json", URLS.beaches);
  need(beaches, /31% of the world.s ice-free shoreline are sandy/, "31% of the ice-free shoreline is sandy");
  need(beaches, /24% of the world.s sandy beaches are eroding at rates exceeding 0\.5 m\/yr, while 28% are accreting and 48% are stable/, "24% eroding, 28% accreting, 48% stable");
  need(beaches, /1984.2016/, "the years 1984 to 2016");
  const soil = await abstract("soil.json", URLS.soil);
  need(soil, /35\.9 Pg yr.1 of soil eroded in 2012/, "35.9 Pg of soil eroded in 2012");
  need(soil, /overall increase in global soil erosion driven by cropland expansion/, "an increase driven by cropland expansion");
  need(soil, /greatest increases are predicted to occur in Sub-Saharan Africa, South America and Southeast Asia/, "where the greatest increases are predicted");
  return true;
}

/* ── Projected warming, by country ── */
async function projected(codes) {
  const byCountry = {};
  for (const [s, [scenario]] of SCENARIOS.entries())
    for (const [p, period] of PERIODS.entries()) {
      const d = JSON.parse(await cached(`cckp-${scenario}-${period}.json`, cckp(scenario, period)));
      if (d.metadata?.status !== "success" || !d.data) throw new Error(`CCKP: ${scenario} ${period} did not answer`);
      for (const [iso3, byDate] of Object.entries(d.data)) {
        const code = codes.iso2.get(iso3);
        const v = Object.values(byDate)[0];
        if (!code || typeof v !== "number") continue;
        ((byCountry[code] ??= SCENARIOS.map(() => PERIODS.map(() => null)))[s])[p] = round(v, 2);
      }
    }
  // Only a country with every scenario and both periods is kept: a row with a gap could not be read across.
  for (const [code, rows] of Object.entries(byCountry)) if (rows.some((r) => r.some((v) => v === null))) delete byCountry[code];
  if (Object.keys(byCountry).length < 180) throw new Error(`CCKP: only ${Object.keys(byCountry).length} countries have every projection`);
  return byCountry;
}

(async () => {
  const codes = await countryCodes();
  const el = await enso();
  const rec = await records();
  const moved = await displaced(codes);
  const { events: disasterEvents, ...alerted } = await alerts(codes);
  await erosion();
  const warming = await projected(codes);
  const names = Object.fromEntries([...new Set([...Object.keys(warming), ...Object.keys(moved.byCountry), ...Object.keys(alerted.byCountry)])].sort().map((c) => [c, codes.name.get(c)]));
  const j = (v) => JSON.stringify(v);

  fs.writeFileSync(
    OUT,
    `/**
 * For the Climate page: El Niño and La Niña, the records in the measured
 * series, which countries disasters struck, what is published on erosion,
 * and how much warmer each country is projected to be.
 *
 * GENERATED by build-climate-watch.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * Every figure was read from its source on that day. What is counted here
 * from a source's own series - a rank, an episode, a tally of alerts - is
 * said to be; a projection is the models' answer under a scenario, not a
 * forecast.
 */
export const CLIMATE_WATCH_RETRIEVED = "${TODAY}";
export const CLIMATE_WATCH_SOURCES = {
  oni: { label: "NOAA Climate Prediction Center — Oceanic Niño Index (public domain)", url: "https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php" },
  gistemp: { label: "NASA GISS — GISTEMP v4, global mean surface temperature (public domain)", url: "https://data.giss.nasa.gov/gistemp/" },
  seaIce: { label: "NSIDC — Sea Ice Index, version 4 (public domain)", url: "https://nsidc.org/data/g02135" },
  co2: { label: "NOAA Global Monitoring Laboratory — carbon dioxide at Mauna Loa (public domain)", url: "https://gml.noaa.gov/ccgg/trends/" },
  displaced: { label: "Internal Displacement Monitoring Centre, via the World Bank — new displacements associated with disasters, VC.IDP.NWDS (CC BY 4.0)", url: "https://data.worldbank.org/indicator/VC.IDP.NWDS" },
  alerts: { label: "Global Disaster Alert and Coordination System — European Commission Joint Research Centre and the United Nations (CC BY 4.0)", url: "https://www.gdacs.org/" },
  beaches: { label: "Luijendijk et al. (2018), The State of the World's Beaches, Scientific Reports 8, 6641 (CC BY 4.0)", url: "${URLS.beaches}" },
  soil: { label: "Borrelli et al. (2017), An assessment of the global impact of 21st century land use change on soil erosion, Nature Communications 8, 2013 (CC BY 4.0)", url: "${URLS.soil}" },
  projected: { label: "World Bank — Climate Change Knowledge Portal, CMIP6 multi-model ensemble (CC BY 4.0)", url: "https://climateknowledgeportal.worldbank.org/" },
};

/** A country's name as the World Bank writes it, by ISO code: for the countries below. */
export const CLIMATE_WATCH_NAMES: Record<string, string> = ${j(names)};

/* ── El Niño and La Niña: NOAA's Oceanic Niño Index ── */
export type EnsoEpisode = { kind: "El Niño" | "La Niña"; from: string; to: string; seasons: number; /** The index at its furthest from zero, and the season it was. */ peak: number; peakAt: string; ongoing?: true };
export const ENSO_SEASONS = ${j(SEASONS)};
export const ENSO: {
  /** The newest season NOAA has published, and its index: degrees Celsius above or below the average for the season. */
  latest: { season: string; anom: number };
  /** By NOAA's rule, counted here: an episode once five overlapping seasons running are at or beyond +0.5 or -0.5; "conditions" while a run is shorter. */
  state: "El Niño" | "La Niña" | "El Niño conditions" | "La Niña conditions" | "Neutral";
  /** The run the newest season is part of, where it is in one. */
  run: EnsoEpisode | null;
  since: number;
  /** Every season since \`since\`: the year, the season's place in ENSO_SEASONS, the index. */
  seasons: [year: number, season: number, anom: number][];
  /** The episodes that ended in 1990 or later, newest first. */
  episodes: EnsoEpisode[];
  /** The five strongest of each kind since the index begins, by its peak. */
  strongest: { warm: EnsoEpisode[]; cold: EnsoEpisode[] };
  /** The year the index begins. */
  first: number;
} = ${j(el)};

/* ── Records in the measured series: each rank is counted here from the series ── */
export const CLIMATE_RECORDS: {
  temperature: {
    baseline: string;
    first: number;
    /** The ten warmest whole years: the year, and its anomaly in degrees Celsius. */
    warmest: [year: number, anom: number][];
    coldest: [year: number, anom: number];
    latestYear: { y: number; v: number; rank: number; of: number };
    /** The newest month with a figure, and where it stands among that month of every year, 1 the warmest. */
    latestMonth: { month: string; name: string; v: number; rank: number; of: number } | null;
  };
  /** Sea-ice extent in the month of its yearly low, million km²: the five lowest, and where the newest stands, 1 the lowest. */
  arctic: { lowest: [year: number, extent: number][]; latest: { y: number; v: number; rank: number; of: number }; first: number };
  antarctic: { lowest: [year: number, extent: number][]; latest: { y: number; v: number; rank: number; of: number }; first: number };
  /** Carbon dioxide at Mauna Loa, parts per million: the highest monthly mean in the record, and the newest. */
  co2: { high: { month: string; v: number }; first: number; latest: { month: string; v: number } };
} = ${j(rec)};

/* ── Disasters ── */
/** New displacements within a country associated with disasters, in the year: a count of movements, not of people. */
export const DISASTER_DISPLACED: { year: number; world: number | null; countries: number; top: [code: string, name: string, n: number][]; byCountry: Record<string, number> } = ${j(moved)};

export type RedAlert = { kind: string; name?: string; from: string; to: string; countries: string[]; said?: string; url: string };
/** The orange and red alerts of twelve months, counted here: by kind of disaster, and by the countries each alert lists as affected. */
export const DISASTER_ALERTS: {
  from: string;
  to: string;
  total: number;
  byKind: Record<string, { orange: number; red: number }>;
  countries: number;
  /** The fifteen countries most often listed. */
  most: [code: string, name: string, orange: number, red: number][];
  reds: RedAlert[];
  byCountry: Record<string, { orange: number; red: number }>;
} = ${j(alerted)};

/** An orange or red alert of the twelve months; "recent" marks one still going, or ended within the last ${RECENT_DAYS} days. */
export type DisasterEvent = RedAlert & { alert: "Orange" | "Red"; current?: true; recent?: true };
export const DISASTER_RECENT_DAYS = ${RECENT_DAYS};
/** Every one of them: those still going first, then the newest. */
export const DISASTER_EVENTS: DisasterEvent[] = ${j(disasterEvents)};

/* ── Erosion: each finding as its paper's abstract states it, checked against the page when the file was built ── */
export const EROSION = {
  beaches: { sandy: 31, eroding: 24, accreting: 28, stable: 48, rate: "more than 0.5 metres a year", years: "1984–2016" },
  soil: { eroded: 35.9, unit: "billion tonnes", year: 2012, driver: "cropland expansion", where: "Sub-Saharan Africa, South America and Southeast Asia" },
};

/* ── Projected warming: the change in mean annual temperature, in degrees Celsius against 1995-2014 ── */
export const WARMING_REFERENCE = "1995–2014";
export const WARMING_SCENARIOS: { id: string; label: string; said: string }[] = ${j(SCENARIOS.map(([id, label, said]) => ({ id, label, said })))};
export const WARMING_PERIODS = ${j(PERIODS.map((p) => p.replace("-", "–")))};
/** By ISO code: for each scenario in turn, the change in each period in turn. The median of the ensemble of models. */
export const WARMING_PROJECTED: Record<string, number[][]> = ${j(warming)};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  ONI ${el.latest.season} ${el.latest.anom}: ${el.state}; ${el.episodes.length} episodes since 1990`);
  console.log(`  warmest year ${rec.temperature.warmest[0].join(" +")}; ${rec.temperature.latestYear.y} ranks ${rec.temperature.latestYear.rank}; ${rec.temperature.latestMonth?.month} ranks ${rec.temperature.latestMonth?.rank}`);
  console.log(`  Arctic September low ${rec.arctic.lowest[0].join(" ")}, ${rec.arctic.latest.y} ranks ${rec.arctic.latest.rank}; Antarctic February low ${rec.antarctic.lowest[0].join(" ")}; CO2 high ${rec.co2.high.month} ${rec.co2.high.v}`);
  console.log(`  disaster displacements ${moved.year}: world ${moved.world}, ${moved.countries} countries, most ${moved.top.slice(0, 3).map((t) => `${t[1]} ${t[2]}`).join(", ")}`);
  console.log(`  alerts ${alerted.from} to ${alerted.to}: ${alerted.total} (${JSON.stringify(alerted.byKind)}), ${alerted.countries} countries, ${alerted.reds.length} red`);
  console.log(`  events: ${disasterEvents.length}, of them now ${disasterEvents.filter((e) => e.recent).length}`);
  console.log(`  projected warming: ${Object.keys(warming).length} countries`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
