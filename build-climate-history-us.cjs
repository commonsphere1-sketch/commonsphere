#!/usr/bin/env node
/**
 * Climate history of the United States' states and counties, as asked: NOAA's nClimDiv, each state's and each county's
 * temperature - the mean, the mean of the days' highs and of their lows - and precipitation, every month since 1895, from
 * station records set on a 5 km grid and averaged over the place. NOAA publishes them by the month; the year's figure is
 * worked out here from the twelve: the temperatures' average, and the precipitation's sum - only for a year with all
 * twelve months. In NOAA's own units, degrees Fahrenheit and inches. County names are the Census Bureau's (2020 codes,
 * those nClimDiv uses).
 *
 * Writes the states into static/climate/history/US.json and each state's counties into more/US-<SS>.json
 * (place-history-lib.cjs).
 *
 *   node build-climate-history-us.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { seriesOf, mergeCountry, mergeMore, writeIndex } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-climate-us");
fs.mkdirSync(CACHE, { recursive: true });
const BASE = "https://www.ncei.noaa.gov/monitoring-content/data/us/climdiv/monthly/current/";
const COUNTIES = "https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt";

// nClimDiv's state codes: the 48 contiguous states in alphabetical order, then Hawaii (49) and Alaska (50).
const STATES = ["AL", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "HI", "AK"];

async function get(url, at) {
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const t = await res.text();
      fs.writeFileSync(at, t);
      return t;
    }
    if (i >= 2) throw new Error(`${url}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

/** Each place's years from a file: {code: {year: [12 monthly values, null where missing]}}. */
function monthly(text, codeLen) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (line.length < 10 + codeLen) continue;
    const code = line.slice(0, codeLen);
    const year = +line.slice(codeLen + 2, codeLen + 6);
    const vals = line.slice(codeLen + 6).trim().split(/\s+/).map(Number);
    if (vals.length !== 12) throw new Error(`bad line: ${line}`);
    (out[code] ||= {})[year] = vals.map((v) => (v <= -9.99 ? null : v));
  }
  return out;
}
/** The year's figure from its twelve months: their average or sum, only where all twelve are given. */
const yearly = (byYear, how) => {
  const out = {};
  for (const [y, ms] of Object.entries(byYear)) {
    if (ms.some((m) => m === null)) continue;
    const sum = ms.reduce((a, m) => a + m, 0);
    out[y] = Math.round((how === "sum" ? sum : sum / 12) * 100) / 100;
  }
  return out;
};

const DEFS = {
  tempF: { label: "Mean temperature", unit: "degF", say: "the mean temperature of the year, the average of NOAA's twelve monthly means (worked out here)" },
  tempMaxF: { label: "Mean daily high", unit: "degF", say: "the mean of the days' highest temperatures in the year, the average of NOAA's twelve monthly means (worked out here)" },
  tempMinF: { label: "Mean daily low", unit: "degF", say: "the mean of the days' lowest temperatures in the year, the average of NOAA's twelve monthly means (worked out here)" },
  precipIn: { label: "Precipitation", unit: "in", say: "rain and snow in the year, in inches of water: the sum of NOAA's twelve monthly totals (worked out here)" },
};
const ELEMENTS = [
  ["tempF", "tmpc", "mean"],
  ["tempMaxF", "tmax", "mean"],
  ["tempMinF", "tmin", "mean"],
  ["precipIn", "pcpn", "sum"],
];

(async () => {
  const index = await get(BASE, path.join(CACHE, "index.html"));
  const fileOf = (el, kind) => {
    const m = index.match(new RegExp(`climdiv-${el}${kind}-v[0-9.]+-\\d{8}`));
    if (!m) throw new Error(`no ${el}${kind} file`);
    return m[0];
  };
  const stamp = fileOf("tmpc", "cy").slice(-8);

  // County names, by state and county code.
  const names = {};
  const stateName = {};
  for (const line of (await get(COUNTIES, path.join(CACHE, "counties2020.txt"))).split(/\r?\n/).slice(1)) {
    const [st, stfp, cofp, , name] = line.split("|");
    if (!name) continue;
    names[`${st}-${cofp}`] = name;
    stateName[st] ||= stfp;
  }
  const usStates = JSON.parse(fs.readFileSync(path.join(__dirname, "static/divisions/US.json"), "utf8"));
  const STATE_NAMES = {
    AL: "Alabama", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", HI: "Hawaii", AK: "Alaska",
  };
  for (const s of STATES) if (!usStates[`US-${s}`]) throw new Error(`US-${s} not among the site's states`);

  const stateSeries = {};
  const countySeries = {};
  for (const [key, el, how] of ELEMENTS) {
    // The state files: its code (3), a division of 0 (1), the element (2), the year (4).
    const st = monthly(await get(BASE + fileOf(el, "st"), path.join(CACHE, `${el}st.txt`)), 4);
    for (const [code, byYear] of Object.entries(st)) {
      const n = +code.slice(0, 3);
      if (n < 1 || n > 50) continue; // regions (101-109) and the nation (110) are not states
      const s = STATES[n - 1];
      (stateSeries[s] ||= {})[key] = seriesOf(yearly(byYear, how));
    }
    const cy = monthly(await get(BASE + fileOf(el, "cy"), path.join(CACHE, `${el}cy.txt`)), 5);
    for (const [code, byYear] of Object.entries(cy)) {
      const s = STATES[+code.slice(0, 2) - 1];
      if (!s) throw new Error(`county ${code}: no state`);
      (countySeries[`${s}-${code.slice(2)}`] ||= {})[key] = seriesOf(yearly(byYear, how));
    }
  }

  const source = {
    label: "NOAA National Centers for Environmental Information - nClimDiv",
    url: "https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/",
    note: `Release of ${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6)}. Station records set on a 5 km grid and averaged over the state or county, by the month; the year's figure is worked out here from its twelve months, in NOAA's own units (°F, inches).`,
  };
  const states = Object.entries(stateSeries).map(([s, series]) => ({ id: `US-${s}`, name: STATE_NAMES[s], kind: "state", parent: "US", series }));
  const byState = {};
  const unnamed = [];
  for (const [k, series] of Object.entries(countySeries)) {
    const [s, co] = k.split("-");
    const name = names[`${s}-${co}`];
    if (!name) {
      unnamed.push(k);
      continue;
    }
    (byState[s] ||= []).push({ id: `US-${s}-${co}`, name, kind: "county", parent: `US-${s}`, series });
  }
  const more = {};
  for (const [s, places] of Object.entries(byState)) {
    mergeMore("climate", "US", `US-${s}`, { source, sourceId: "noaa", defs: DEFS, places });
    more[`US-${s}`] = places.length;
  }
  mergeCountry("climate", "US", { source, sourceId: "noaa", defs: DEFS, places: states, more });

  // Checks against figures known well: Florida's mean near 71 °F, Alaska's near 27 °F, Seattle's King County rain of 40-60 in.
  const fl = stateSeries.FL.tempF;
  const lastOf = (s) => s[s.length - 1];
  if (!(lastOf(fl) > 68 && lastOf(fl) < 75)) throw new Error(`FL ${lastOf(fl)}`);
  const ak = stateSeries.AK?.tempF;
  if (ak && !(lastOf(ak) > 20 && lastOf(ak) < 35)) throw new Error(`AK ${lastOf(ak)}`);
  const king = countySeries["WA-033"].precipIn;
  if (!(lastOf(king) > 30 && lastOf(king) < 75)) throw new Error(`King County ${lastOf(king)}`);
  writeIndex("climate");
  const nCounties = Object.values(byState).reduce((a, p) => a + p.length, 0);
  console.log(`US climate: ${states.length} states, ${nCounties} counties (${unnamed.length} without a Census name: ${unnamed.slice(0, 8).join(", ")}); FL ${fl[0]}-${fl[0] + fl.length - 2} last ${lastOf(fl)} °F; King County last ${lastOf(king)} in`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
