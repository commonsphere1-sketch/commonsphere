/**
 * Builds static/us/place-figures.json - the figures the World Maps page's map of the United States can be drawn by, as
 * asked: the richest and poorest states and counties, how many of their people are poor, how many die by homicide, and
 * the states' crime. Fetched by the page only when one of them is chosen.
 *
 *   node build-us-place-figures.cjs
 *
 * Sources - all works of the United States government, in the public domain:
 *
 *   Census Bureau, Small Area Income and Poverty Estimates (SAIPE), 2024
 *     https://www2.census.gov/programs-surveys/saipe/datasets/2024/2024-state-and-county/est24all.txt
 *     median household income and the share of people of all ages in poverty, for every state and all 3,143 counties:
 *     one model for all of them, so a county's figure stands beside its state's. (A state's window gives the American
 *     Community Survey's median income, a survey figure: the two differ a little, and each says whose it is.)
 *
 *   CDC, National Center for Injury Prevention and Control - Mapping Injury, Overdose, and Violence
 *     https://data.cdc.gov/d/fpsi-y8tj (states), https://data.cdc.gov/d/psx4-wq38 (counties)
 *     deaths by homicide to 100,000 residents, by state and county of residence, from the National Vital Statistics
 *     System. The last whole year is kept, not the running twelve months, which are provisional. Where a county had 1-9
 *     deaths the CDC publishes a rate from a Bayesian model instead of the count (marked m here); where it withholds the
 *     rate, there is none.
 *
 *   FBI, Uniform Crime Reporting Program - Summary Reporting System, estimated crimes 1979 onward
 *     the FBI's estimated violent and property crimes and population for each state, from the Crime Data Explorer's
 *     downloads (estimated_crimes_1979_<year>.csv). A program can read it only with an api.data.gov key, which this
 *     build does not hold; a person can download it from https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/downloads
 *     ("Summary Reporting System (SRS)"). Put it at data-raw/estimated_crimes_*.csv and it is read; without it the
 *     states' crime is left out, and said to be. The rates are worked out here from the FBI's counts and population,
 *     to 100,000 people, as the FBI gives them.
 */
const fs = require("fs");
const path = require("path");
const { syncClock, nowIso } = require("./build-clock.cjs");

const OUT = path.join(__dirname, "static/us/place-figures.json");
const UA = { "User-Agent": "CommonSphere-build/1.0 (https://commonsphere.vercel.app)" };
const SAIPE = "https://www2.census.gov/programs-surveys/saipe/datasets/2024/2024-state-and-county/est24all.txt";
const CDC = (id, where) => `https://data.cdc.gov/resource/${id}.json?$limit=50000&$where=${encodeURIComponent(where)}`;

const get = async (url, tries = 3) => {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r;
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((res) => setTimeout(res, 2000 * i));
    }
  }
};

(async () => {
  await syncClock();
  const states = {};
  const counties = {};
  const ST = {};

  // ── Census SAIPE 2024: fixed columns, as its record layout gives them ──
  const saipe = await (await get(SAIPE)).text();
  let sRows = 0;
  let cRows = 0;
  for (const line of saipe.split(/\r?\n/)) {
    if (line.length < 150) continue;
    const st = line.slice(0, 2);
    const co = line.slice(3, 6).trim();
    if (st === "00") continue;
    const poverty = Number(line.slice(34, 38));
    const income = Number(line.slice(133, 139));
    const abbr = line.slice(239, 241).trim();
    const fig = { ...(Number.isFinite(income) && income > 0 ? { i: income } : {}), ...(Number.isFinite(poverty) ? { p: poverty } : {}) };
    if (co === "0") {
      ST[st] = abbr;
      states[abbr] = { ...states[abbr], ...fig };
      sRows++;
    } else {
      counties[st + co.padStart(3, "0")] = { ...counties[st + co.padStart(3, "0")], ...fig };
      cRows++;
    }
  }
  if (sRows < 51 || cRows < 3100) throw new Error(`SAIPE: ${sRows} states, ${cRows} counties - the file is not as expected`);

  // ── CDC homicide, the last whole year in the files ──
  const years = (await (await get(CDC("fpsi-y8tj", "intent='All_Homicide'").replace("$limit=50000", "$select=period&$group=period&$limit=50"))).json()).map((r) => r.period).filter((p) => /^\d{4}$/.test(p));
  const year = String(Math.max(...years.map(Number)));
  const kept = (r) => {
    const rate = Number(r.rate);
    if (!Number.isFinite(rate) || rate < 0) return null; // withheld (-999)
    return { h: Math.round(rate * 10) / 10, ...(r.rate_m === "1" || Number(r.rate_m) === 1 ? { hm: 1 } : {}) };
  };
  const sh = await (await get(CDC("fpsi-y8tj", `intent='All_Homicide' AND period='${year}'`))).json();
  for (const r of sh) {
    const abbr = ST[String(r.st_geoid ?? r.geoid ?? "").padStart(2, "0")];
    const k = abbr && kept(r);
    if (k) states[abbr] = { ...states[abbr], ...k };
  }
  const ch = await (await get(CDC("psx4-wq38", `intent='All_Homicide' AND period='${year}'`))).json();
  let withheld = 0;
  for (const r of ch) {
    const k = kept(r);
    if (!k) {
      withheld++;
      continue;
    }
    const f = String(r.geoid).padStart(5, "0");
    counties[f] = { ...counties[f], ...k };
  }

  // ── FBI estimated crimes, where a copy of the FBI's file is held ──
  let crime = null;
  const rawDir = path.join(__dirname, "data-raw");
  const file = fs.existsSync(rawDir) ? fs.readdirSync(rawDir).filter((f) => /^estimated_crimes_1979_\d{4}\.csv$/.test(f)).sort().pop() : undefined;
  if (file) {
    const rows = fs.readFileSync(path.join(rawDir, file), "utf8").trim().split(/\r?\n/);
    const head = rows[0].split(",").map((h) => h.trim().toLowerCase());
    const col = (n) => head.indexOf(n);
    const [iY, iA, iP, iV, iPr] = [col("year"), col("state_abbr"), col("population"), col("violent_crime"), col("property_crime")];
    if ([iY, iA, iP, iV, iPr].some((i) => i < 0)) throw new Error(`${file}: columns not as expected: ${head.join(",")}`);
    const data = rows.slice(1).map((l) => l.split(","));
    const last = String(Math.max(...data.filter((c) => c[iA]).map((c) => +c[iY])));
    for (const c of data) {
      if (c[iY] !== last || !c[iA] || !states[c[iA]]) continue;
      const pop = +c[iP];
      if (!(pop > 0)) continue;
      states[c[iA]] = { ...states[c[iA]], v: Math.round((+c[iV] / pop) * 1e6) / 10, pr: Math.round((+c[iPr] / pop) * 1e6) / 10 };
    }
    crime = { year: last, file };
  }

  const out = {
    builtAt: nowIso(),
    years: { income: "2024", poverty: "2024", homicide: year, ...(crime ? { crime: crime.year } : {}) },
    sources: {
      saipe: { label: "US Census Bureau — Small Area Income and Poverty Estimates (SAIPE), 2024", url: "https://www.census.gov/programs-surveys/saipe.html" },
      homicide: { label: `CDC — Mapping Injury, Overdose, and Violence (National Vital Statistics System), ${year}`, url: "https://www.cdc.gov/injury-violence-data/" },
      ...(crime ? { crime: { label: `FBI — Uniform Crime Reporting Program, estimated crimes (${crime.file})`, url: "https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/downloads" } } : {}),
    },
    states,
    counties,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  const n = (o, k) => Object.values(o).filter((x) => x[k] !== undefined).length;
  console.log(`states: income ${n(states, "i")}, poverty ${n(states, "p")}, homicide ${n(states, "h")}, crime ${n(states, "v")}${crime ? ` (${crime.year})` : " - no FBI file in data-raw/, left out"}`);
  console.log(`counties: income ${n(counties, "i")}, poverty ${n(counties, "p")}, homicide ${n(counties, "h")} (${Object.values(counties).filter((x) => x.hm).length} modelled by the CDC, ${withheld} withheld) - ${year}`);
  console.log(`written ${path.relative(__dirname, OUT)}: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
