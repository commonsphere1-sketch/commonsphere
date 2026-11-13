#!/usr/bin/env node
/**
 * Climate history, country by country, as asked: each year since 1901 of the country's climate - its mean temperature,
 * its mean daily highs and lows, and the precipitation of the year - as the World Bank's Climate Change Knowledge Portal
 * gives them from CRU TS 4.09 (the Climatic Research Unit's gridded record of weather stations, averaged over the
 * country); and each year's emissions of carbon dioxide from fossil fuels and industry, the country's total and per
 * person, from the Global Carbon Budget as Our World in Data publishes it; and, since 1950, the year's extremes from ERA5 as the
 * portal gives them - the hottest day and coldest night, days above 35 °C, nights above 20 °C, frost days, the wettest day,
 * days of heavy rain and the longest dry spell - each place's own, averaged over the country. Nothing is worked out here.
 *
 * Writes the country into static/climate/history/<CC>.json (place-history-lib.cjs); the divisions' builds add theirs.
 *
 *   node build-climate-history.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { seriesOf, mergeCountry, writeIndex, siteCountries } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-climate-history");
fs.mkdirSync(CACHE, { recursive: true });
const CCKP = "https://cckpapi.worldbank.org/cckp/v1";
const CRU = (v) => `cru-x0.5_timeseries_${v}_timeseries_annual_1901-2024_mean_historical_cru_ts4.09_mean`;
const OWID = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

async function fetchTo(url, at) {
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const t = await res.text();
      fs.writeFileSync(at, t);
      return t;
    }
    if (i >= 2) throw new Error(`${url}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
}

/** A CSV line into its cells, quotes kept apart. */
function cells(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") out.push(cur), (cur = "");
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const DEFS = {
  temp: { label: "Mean temperature", unit: "degC", say: "the mean temperature of the year, averaged over the place" },
  tempMax: { label: "Mean daily high", unit: "degC", say: "the mean of each day's highest temperature in the year" },
  tempMin: { label: "Mean daily low", unit: "degC", say: "the mean of each day's lowest temperature in the year" },
  precip: { label: "Precipitation", unit: "mm", say: "rain and snow in the year, in millimetres of water" },
  co2: { label: "CO₂ emitted", unit: "mt", say: "carbon dioxide emitted from fossil fuels and industry in the year, in millions of tonnes" },
  co2PerHead: { label: "CO₂ per person", unit: "t", say: "carbon dioxide emitted from fossil fuels and industry in the year, in tonnes per person" },
  // The year's extremes, from ERA5: each place's own figure for the year, averaged over the country.
  hottestDay: { label: "Hottest day", unit: "degC", say: "the year's highest daily temperature at each place, averaged over the country" },
  coldestNight: { label: "Coldest night", unit: "degC", say: "the year's lowest daily temperature at each place, averaged over the country" },
  hotDays: { label: "Days above 35 °C", unit: "days", say: "days in the year whose high passed 35 °C, at each place, averaged over the country" },
  tropicalNights: { label: "Nights above 20 °C", unit: "days", say: "nights in the year whose low stayed above 20 °C, at each place, averaged over the country" },
  frostDays: { label: "Frost days", unit: "days", say: "days in the year whose low fell below 0 °C, at each place, averaged over the country" },
  wettestDay: { label: "Wettest day", unit: "mm", say: "the year's most rain in one day at each place, averaged over the country" },
  heavyRainDays: { label: "Days of 20 mm or more", unit: "days", say: "days in the year with 20 mm of rain or more, at each place, averaged over the country" },
  drySpell: { label: "Longest dry spell", unit: "days", say: "the year's longest run of days with under 1 mm of rain, at each place, averaged over the country" },
};
// ERA5's index codes on the portal, for each.
const ERA5 = [
  ["hottestDay", "txx"],
  ["coldestNight", "tnn"],
  ["hotDays", "hd35"],
  ["tropicalNights", "tr"],
  ["frostDays", "fd"],
  ["wettestDay", "rx1day"],
  ["heavyRainDays", "r20mm"],
  ["drySpell", "cdd"],
];
const ERA5_SERIES = (v) => `era5-x0.25_timeseries_${v}_timeseries_annual_1950-2024_mean_historical_era5_x0.25_mean`;

(async () => {
  const wb = JSON.parse(await fetchTo("https://api.worldbank.org/v2/country?format=json&per_page=400", path.join(CACHE, "wb-countries.json")));
  const iso3 = {};
  for (const c of wb[1]) iso3[c.iso2Code] = c.id;
  iso3.XK = "XKX";

  // The portal's annual series for every country, one variable at a time.
  const cru = {};
  for (const [key, v] of [["temp", "tas"], ["tempMax", "tasmax"], ["tempMin", "tasmin"], ["precip", "pr"]]) {
    const j = JSON.parse(await fetchTo(`${CCKP}/${CRU(v)}/all_countries?_format=json`, path.join(CACHE, `cru-${v}.json`)));
    cru[key] = j.data;
  }

  // The year's extremes from ERA5, each index for every country.
  const era5 = {};
  for (const [key, v] of ERA5) {
    const j = JSON.parse(await fetchTo(`${CCKP}/${ERA5_SERIES(v)}/all_countries?_format=json`, path.join(CACHE, `era5-${v}.json`)));
    era5[key] = j.data;
  }

  // The Global Carbon Budget's national emissions, as Our World in Data publishes them.
  const lines = (await fetchTo(OWID, path.join(CACHE, "owid-co2.csv"))).split(/\r?\n/);
  const H = cells(lines[0]);
  const col = (k) => {
    const i = H.indexOf(k);
    if (i < 0) throw new Error(`owid: no column ${k}`);
    return i;
  };
  const ci = { iso: col("iso_code"), year: col("year"), co2: col("co2"), per: col("co2_per_capita") };
  const owid = {};
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const r = cells(line);
    if (!/^[A-Z]{3}$/.test(r[ci.iso])) continue;
    const at = (owid[r[ci.iso]] ||= { co2: {}, co2PerHead: {} });
    if (r[ci.co2] !== "") at.co2[+r[ci.year]] = Math.round(+r[ci.co2] * 1000) / 1000;
    if (r[ci.per] !== "") at.co2PerHead[+r[ci.year]] = Math.round(+r[ci.per] * 1000) / 1000;
  }

  const cruSource = {
    label: "World Bank - Climate Change Knowledge Portal (CRU TS 4.09)",
    url: "https://climateknowledgeportal.worldbank.org/",
    note: "The Climatic Research Unit's gridded record of the world's weather stations, half a degree square, averaged over the country by the World Bank.",
  };
  const gcbSource = {
    label: "Global Carbon Budget, via Our World in Data",
    url: "https://github.com/owid/co2-data",
    note: "Emissions from burning fossil fuels and from industry (cement); not from land use. Where the emissions are produced, not where the goods are used.",
  };
  const era5Source = {
    label: "World Bank - Climate Change Knowledge Portal (ERA5 extremes)",
    url: "https://climateknowledgeportal.worldbank.org/",
    note: "ERA5, the Copernicus Climate Change Service's reanalysis of the world's weather since 1950, a quarter of a degree square: each place's own extreme for the year - its hottest day, its frost days - averaged over the country by the World Bank. Not the single hottest reading anywhere in it.",
  };
  const fromEra5 = {};
  const fromCru = {};
  const fromGcb = {};
  for (const c of siteCountries(CACHE)) {
    const i = iso3[c.code];
    if (!i) continue;
    const a = {};
    for (const key of ["temp", "tempMax", "tempMin", "precip"]) {
      const d = cru[key][i];
      if (!d) continue;
      const s = seriesOf(Object.fromEntries(Object.entries(d).map(([k, v]) => [+k.slice(0, 4), v])));
      if (s) a[key] = s;
    }
    if (Object.keys(a).length) fromCru[c.code] = { id: c.code, name: c.name, kind: "country", series: a };
    const e = {};
    for (const [key] of ERA5) {
      const d = era5[key][i];
      if (!d) continue;
      const s = seriesOf(Object.fromEntries(Object.entries(d).map(([k, v]) => [+k.slice(0, 4), v])));
      if (s) e[key] = s;
    }
    if (Object.keys(e).length) fromEra5[c.code] = { id: c.code, name: c.name, kind: "country", series: e };
    const g = owid[i];
    if (g) {
      const b = { co2: seriesOf(g.co2), co2PerHead: seriesOf(g.co2PerHead) };
      if (b.co2 || b.co2PerHead) fromGcb[c.code] = { id: c.code, name: c.name, kind: "country", series: b };
    }
  }
  const ccs = new Set([...Object.keys(fromCru), ...Object.keys(fromGcb), ...Object.keys(fromEra5)]);
  for (const cc of ccs) {
    const defs = DEFS;
    if (fromCru[cc]) mergeCountry("climate", cc, { source: cruSource, sourceId: "cru", defs, places: [fromCru[cc]] });
    if (fromEra5[cc]) mergeCountry("climate", cc, { source: era5Source, sourceId: "era5", defs, places: [fromEra5[cc]] });
    if (fromGcb[cc]) mergeCountry("climate", cc, { source: gcbSource, sourceId: "gcb", defs, places: [fromGcb[cc]] });
  }

  // Checks against figures known well: the UK's mean temperature near 9 °C in the 2020s, its rain near 1,100 mm; US
  // emissions some 5,000 million tonnes.
  const gb = JSON.parse(fs.readFileSync(path.join(__dirname, "static/climate/history/GB.json"), "utf8")).places[0].series;
  const us = JSON.parse(fs.readFileSync(path.join(__dirname, "static/climate/history/US.json"), "utf8")).places[0].series;
  const lastOf = (s) => s[s.length - 1];
  if (!(lastOf(gb.temp) > 7.5 && lastOf(gb.temp) < 11)) throw new Error(`GB temperature ${lastOf(gb.temp)}`);
  if (!(lastOf(gb.precip) > 800 && lastOf(gb.precip) < 1600)) throw new Error(`GB precipitation ${lastOf(gb.precip)}`);
  if (!(lastOf(us.co2) > 4000 && lastOf(us.co2) < 6000)) throw new Error(`US CO2 ${lastOf(us.co2)}`);
  const index = writeIndex("climate");
  console.log(`climate history: ${Object.keys(fromCru).length} countries with CRU, ${Object.keys(fromGcb).length} with emissions; index ${Object.keys(index).length}; GB ${gb.temp[0]}-${gb.temp[0] + gb.temp.length - 2} last ${lastOf(gb.temp)} °C; US CO2 last ${lastOf(us.co2)} Mt (${us.co2[0] + us.co2.length - 2})`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
