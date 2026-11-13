#!/usr/bin/env node
/**
 * Pollution, place by place, as asked:
 *
 *   countries   the World Bank's mean annual exposure to fine-particle pollution (PM2.5, micrograms per cubic metre) and
 *               the share of people exposed above the World Health Organization's guideline, every year it gives
 *   US counties and metropolitan areas
 *               the Environmental Protection Agency's annual Air Quality Index summaries (AirData), every year since
 *               1980: the days of the year in each of the index's bands - good, moderate, unhealthy for sensitive groups,
 *               unhealthy, very unhealthy, hazardous - and the year's median and highest index
 *
 * A county is matched to the Census Bureau's county codes (the NOAA records' own) by its state and name; a metropolitan
 * area is put under the first state its name gives. Nothing is worked out here.
 *
 *   node build-climate-pollution.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { mergeCountry, mergeMore, seriesOf, writeIndex, siteCountries } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-pollution");
fs.mkdirSync(CACHE, { recursive: true });
const FIRST_AQI = 1980;
const STATES = { Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY" };
const STATE_CODES = new Set(Object.values(STATES));

function getTo(url, at, binary = false) {
  if (!fs.existsSync(at)) execFileSync("curl", ["-sL", "--fail", "--max-time", "600", "-A", UA, "-o", at, url]);
  return binary ? at : fs.readFileSync(at, "utf8");
}
function csvRows(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') (cur += '"'), i++;
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") out.push(cur), (cur = "");
      else cur += c;
    }
    out.push(cur);
    rows.push(out);
  }
  return rows;
}
/** A county's name for matching: its words alone, without "County", "Parish" and the like. */
const fold = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(city\)/g, "city")
    .replace(/\bsainte\b/g, "ste")
    .replace(/\bsaint\b/g, "st")
    .replace(/\b(county|parish|borough|census area|city and borough|municipality)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
/** The EPA's names that are another than the Census Bureau's, by state. */
const ALIAS = { "VA|charles": "charlescity" };

const AQI_KEYS = [
  ["aqiGood", "Good Days", "Good days", "days of the year the Air Quality Index was good (0-50)"],
  ["aqiModerate", "Moderate Days", "Moderate days", "days it was moderate (51-100)"],
  ["aqiSensitive", "Unhealthy for Sensitive Groups Days", "Unhealthy for sensitive groups", "days it was unhealthy for sensitive groups (101-150)"],
  ["aqiUnhealthy", "Unhealthy Days", "Unhealthy days", "days it was unhealthy (151-200)"],
  ["aqiVeryUnhealthy", "Very Unhealthy Days", "Very unhealthy days", "days it was very unhealthy (201-300)"],
  ["aqiHazardous", "Hazardous Days", "Hazardous days", "days it was hazardous (over 300)"],
];
const DEFS = {
  pm25: { label: "Fine-particle pollution (PM2.5)", unit: "ugm3", say: "people's mean exposure over the year to fine particles, PM2.5, in micrograms per cubic metre of air" },
  pm25AboveWho: { label: "People above the WHO guideline", unit: "pct", say: "the share of people exposed to more fine-particle pollution than the World Health Organization's guideline" },
  ...Object.fromEntries(AQI_KEYS.map(([k, , label, say]) => [k, { label, unit: "days", say }])),
  aqiMedian: { label: "Median Air Quality Index", unit: "aqi", say: "the median of the year's daily Air Quality Index readings" },
  aqiMax: { label: "Highest Air Quality Index", unit: "aqi", say: "the year's highest daily Air Quality Index reading" },
};

(async () => {
  // ── Countries: the World Bank's PM2.5 series.
  const wb = JSON.parse(getTo("https://api.worldbank.org/v2/country?format=json&per_page=400", path.join(CACHE, "wb-countries.json")))[1];
  const iso2 = Object.fromEntries(wb.map((c) => [c.id, c.iso2Code]));
  const byCc = {};
  for (const [key, ind] of [["pm25", "EN.ATM.PM25.MC.M3"], ["pm25AboveWho", "EN.ATM.PM25.MC.ZS"]]) {
    const rows = JSON.parse(getTo(`https://api.worldbank.org/v2/country/all/indicator/${ind}?format=json&per_page=20000&date=1990:2030`, path.join(CACHE, `${ind}.json`)))[1] ?? [];
    for (const r of rows) {
      if (r.value == null) continue;
      const cc = iso2[r.countryiso3code];
      if (!cc) continue;
      ((byCc[cc] ||= {})[key] ||= {})[+r.date] = Math.round(r.value * 100) / 100;
    }
  }
  const wbSource = { label: "World Bank - World Development Indicators (PM2.5 air pollution)", url: "https://data.worldbank.org/indicator/EN.ATM.PM25.MC.M3", note: "People's mean exposure over the year to fine particles, and the share above the WHO guideline, as the World Bank publishes them from the Global Burden of Disease's estimates." };
  const names = Object.fromEntries(siteCountries(CACHE).map((c) => [c.code, c.name]));
  let countries = 0;
  for (const [cc, keys] of Object.entries(byCc)) {
    if (!names[cc] || !fs.existsSync(path.join(__dirname, "static/climate/history", `${cc}.json`))) continue;
    const series = Object.fromEntries(Object.entries(keys).map(([k, by]) => [k, seriesOf(by)]).filter(([, s]) => s));
    mergeCountry("climate", cc, { source: wbSource, sourceId: "wbpm", defs: DEFS, places: [{ id: cc, name: names[cc], kind: "country", series }] });
    countries++;
  }

  // ── US counties and metropolitan areas: the EPA's annual AQI summaries.
  const census = getTo("https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt", path.join(CACHE, "counties2020.txt"));
  const fips = {}; // "AL|baldwin" -> "003"
  const countyName = {};
  for (const line of census.split(/\r?\n/).slice(1)) {
    const [st, , cofp, , name] = line.split("|");
    if (!name || !STATE_CODES.has(st)) continue;
    fips[`${st}|${fold(name)}`] = cofp;
    countyName[`${st}-${cofp}`] = name;
  }
  // The current year's file holds the year so far: its days would read as a cleaner year than it is, so it is left out.
  const last = new Date().getUTCFullYear() - 1;
  const county = {}; // "AL-003" -> {key: {y: v}}
  const metro = {}; // code -> {name, st, years}
  const unmatched = new Set();
  for (let y = FIRST_AQI; y <= last; y++) {
    for (const [kind, file] of [["county", `annual_aqi_by_county_${y}.zip`], ["metro", `annual_aqi_by_cbsa_${y}.zip`]]) {
      const at = path.join(CACHE, file);
      try {
        getTo(`https://aqs.epa.gov/aqsweb/airdata/${file}`, at, true);
      } catch {
        continue; // a year not yet published
      }
      const rows = csvRows(execFileSync("unzip", ["-p", at], { maxBuffer: 64 * 1024 * 1024 }).toString());
      const H = rows[0];
      const ix = (k) => H.indexOf(k);
      for (const r of rows.slice(1)) {
        let into;
        if (kind === "county") {
          const st = STATES[r[ix("State")]];
          if (!st) continue;
          const f = fold(r[ix("County")]);
          const code = fips[`${st}|${ALIAS[`${st}|${f}`] ?? f}`];
          if (!code) {
            unmatched.add(`${st} ${r[ix("County")].trim()}`);
            continue;
          }
          into = county[`${st}-${code}`] ||= {};
        } else {
          const name = r[ix("CBSA")];
          const st = (name.match(/,\s*([A-Z]{2})/) || [])[1];
          if (!st || !STATE_CODES.has(st)) continue;
          into = (metro[r[ix("CBSA Code")]] ||= { name, st, years: {} }).years;
        }
        const year = +r[ix("Year")];
        for (const [k, col] of AQI_KEYS) (into[k] ||= {})[year] = +r[ix(col)];
        (into.aqiMedian ||= {})[year] = +r[ix("Median AQI")];
        (into.aqiMax ||= {})[year] = +r[ix("Max AQI")];
      }
    }
    process.stdout.write(`${y} `);
  }
  console.log();
  const epaSource = { label: "US EPA - AirData, annual Air Quality Index summaries", url: "https://aqs.epa.gov/aqsweb/airdata/download_files.html", note: "The Environmental Protection Agency's yearly summaries of each county's and metropolitan area's daily Air Quality Index, from its monitors: a place with no monitor has no figure, and a year's days are those it was measured." };
  const byState = {};
  for (const [id, keys] of Object.entries(county)) {
    const [st, code] = id.split("-");
    (byState[st] ||= []).push({ id: `US-${st}-${code}`, name: countyName[id], kind: "county", parent: `US-${st}`, series: Object.fromEntries(Object.entries(keys).map(([k, by]) => [k, seriesOf(by)])) });
  }
  for (const [code, m] of Object.entries(metro)) (byState[m.st] ||= []).push({ id: `US-CBSA-${code}`, name: m.name, kind: "city", parent: `US-${m.st}`, series: Object.fromEntries(Object.entries(m.years).map(([k, by]) => [k, seriesOf(by)])) });
  for (const [st, places] of Object.entries(byState)) mergeMore("climate", "US", `US-${st}`, { source: epaSource, sourceId: "epa", defs: DEFS, places });
  // The states' part counts, for the chooser, now with their metropolitan areas.
  const usAt = path.join(__dirname, "static/climate/history/US.json");
  const us = JSON.parse(fs.readFileSync(usAt, "utf8"));
  for (const st of Object.keys(byState)) {
    const more = JSON.parse(fs.readFileSync(path.join(__dirname, "static/climate/history/more", `US-${st}.json`), "utf8"));
    (us.more ||= {})[`US-${st}`] = more.places.length;
  }
  fs.writeFileSync(usAt, JSON.stringify(us));
  writeIndex("climate");
  const la = Object.values(metro).find((m) => /^Los Angeles/.test(m.name));
  console.log(`pollution: ${countries} countries with PM2.5; ${Object.keys(county).length} counties and ${Object.keys(metro).length} metropolitan areas with AQI; ${unmatched.size} county names not matched: ${[...unmatched].slice(0, 12).join(", ")}; Los Angeles median AQI ${la && JSON.stringify(Object.entries(la.years.aqiMedian).slice(-3))}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
