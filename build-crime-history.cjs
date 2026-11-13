#!/usr/bin/env node
/**
 * Crime history, country by country, as asked: every year UNODC publishes (since 2003) for each kind of offence its three
 * crime files hold - victims of intentional homicide, and the offences police recorded: robbery, serious assault,
 * kidnapping, sexual violence and rape; burglary, theft, theft of a motor vehicle, fraud; corruption and bribery, money
 * laundering, smuggling of migrants, and unlawful access to a computer system - each the rate per 100,000 people UNODC
 * gives, for the whole population (both sexes, all ages). Nothing is worked out here.
 *
 * Writes the country into static/crime/history/<CC>.json (place-history-lib.cjs); the divisions' builds add theirs.
 *
 *   node build-crime-history.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readXlsx } = require("./xlsx-lite.cjs");
const { seriesOf, mergeCountry, writeIndex, siteCountries } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-crime-history");
fs.mkdirSync(CACHE, { recursive: true });
const PORTAL = "https://data.unodc.org";
const REPORTS = {
  homicide: { page: "/datareport/hom-victim", file: /data_cts_intentional_homicide\.xlsx/ },
  economic: { page: "/datareport/econ-corruption", file: /data_cts_corruption_and_economic_crime\.xlsx/ },
  violent: { page: "/datareport/violent-offences", file: /data_cts_violent_and_sexual_crime\.xlsx/ },
};

async function fetchTo(url, at, binary) {
  if (fs.existsSync(at)) return;
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  fs.writeFileSync(at, binary ? Buffer.from(await res.arrayBuffer()) : await res.text());
}
async function report(key) {
  const spec = REPORTS[key];
  const pageAt = path.join(CACHE, key + ".html");
  await fetchTo(PORTAL + spec.page, pageAt);
  const href = (fs.readFileSync(pageAt, "utf8").match(/\/sites\/[^"']+\.xlsx/g) || []).find((h) => spec.file.test(h));
  if (!href) throw new Error(`${key}: no download link on ${spec.page}`);
  const at = path.join(CACHE, path.basename(href));
  await fetchTo(PORTAL + href, at, true);
  return { at, url: PORTAL + href, release: (href.match(/files\/(\d{4}-\d{2})\//) || [])[1] };
}

const num = (s) => (s === undefined || s === "" ? NaN : Number(String(s).replace(/,/g, "")));
const isTotal = (r, c) => r[c.sex] === "Total" && r[c.age] === "Total";
const isRate = (r, c) => /^Rate per 100,000/.test(r[c.unit]);

/** iso3 → {year: rate} for the rows `pick` chooses; two rows for one country and year that differ are a stop. */
function byYear(file, pick) {
  const { rows } = readXlsx(file);
  const h = rows.findIndex((r) => r.includes("Iso3_code"));
  const H = rows[h];
  const ix = (k) => {
    const i = H.indexOf(k);
    if (i < 0) throw new Error(`${file}: no column ${k}`);
    return i;
  };
  const c = { iso: ix("Iso3_code"), ind: ix("Indicator"), dim: ix("Dimension"), cat: ix("Category"), sex: ix("Sex"), age: ix("Age"), year: ix("Year"), unit: ix("Unit of measurement"), v: ix("VALUE") };
  const out = {};
  for (const r of rows.slice(h + 1)) {
    if (!pick(r, c)) continue;
    const v = num(r[c.v]);
    const y = +r[c.year];
    if (!Number.isFinite(v) || !r[c.iso]) continue;
    const at = (out[r[c.iso]] ||= {});
    if (at[y] !== undefined && Math.abs(at[y] - v) > 1e-9) throw new Error(`${file}: ${r[c.iso]} ${y} has two values (${at[y]}, ${v})`);
    at[y] = v;
  }
  return out;
}

const DEFS = {
  homicide: { label: "Intentional homicide", unit: "per100k", say: "victims of intentional homicide per 100,000 people" },
  robbery: { label: "Robbery", unit: "per100k", say: "robberies recorded by the police per 100,000 people" },
  assault: { label: "Serious assault", unit: "per100k", say: "serious assaults recorded by the police per 100,000 people" },
  kidnapping: { label: "Kidnapping", unit: "per100k", say: "kidnappings recorded by the police per 100,000 people" },
  sexualViolence: { label: "Sexual violence", unit: "per100k", say: "offences of sexual violence recorded by the police per 100,000 people" },
  rape: { label: "Rape", unit: "per100k", say: "rapes recorded by the police per 100,000 people" },
  burglary: { label: "Burglary", unit: "per100k", say: "burglaries recorded by the police per 100,000 people" },
  theft: { label: "Theft", unit: "per100k", say: "thefts recorded by the police per 100,000 people" },
  vehicleTheft: { label: "Theft of a motor vehicle", unit: "per100k", say: "thefts of a motor vehicle recorded by the police per 100,000 people" },
  fraud: { label: "Fraud", unit: "per100k", say: "frauds recorded by the police per 100,000 people" },
  corruption: { label: "Corruption", unit: "per100k", say: "offences of corruption recorded by the police per 100,000 people" },
  bribery: { label: "Bribery", unit: "per100k", say: "offences of bribery recorded by the police per 100,000 people" },
  moneyLaundering: { label: "Money laundering", unit: "per100k", say: "offences of money laundering recorded by the police per 100,000 people" },
  migrantSmuggling: { label: "Smuggling of migrants", unit: "per100k", say: "offences of smuggling of migrants recorded by the police per 100,000 people" },
  computerAccess: { label: "Unlawful access to a computer", unit: "per100k", say: "offences of unlawful access to a computer system recorded by the police per 100,000 people" },
};

(async () => {
  const hom = await report("homicide");
  const eco = await report("economic");
  const vio = await report("violent");
  const offence = (file, cat) => byYear(file, (r, c) => /ffences$/.test(r[c.ind]) && r[c.cat] === cat && isTotal(r, c) && isRate(r, c));
  const kinds = {
    homicide: byYear(hom.at, (r, c) => r[c.ind] === "Victims of intentional homicide" && r[c.dim] === "Total" && r[c.cat] === "Total" && isTotal(r, c) && isRate(r, c)),
    robbery: offence(vio.at, "Robbery"),
    assault: offence(vio.at, "Serious assault"),
    kidnapping: offence(vio.at, "Kidnapping"),
    sexualViolence: offence(vio.at, "Sexual violence"),
    rape: offence(vio.at, "Sexual violence: Rape"),
    burglary: offence(eco.at, "Burglary"),
    theft: offence(eco.at, "Theft"),
    vehicleTheft: offence(eco.at, "Theft: of a motorized vehicle"),
    fraud: offence(eco.at, "Fraud"),
    corruption: offence(eco.at, "Corruption"),
    bribery: offence(eco.at, "Corruption: Bribery"),
    moneyLaundering: offence(eco.at, "Money laundering"),
    migrantSmuggling: offence(eco.at, "Smuggling of migrants"),
    computerAccess: offence(eco.at, "Unlawful access to a computer system"),
  };

  const wbAt = path.join(CACHE, "wb-countries.json");
  await fetchTo("https://api.worldbank.org/v2/country?format=json&per_page=400", wbAt);
  const iso3 = {};
  for (const c of JSON.parse(fs.readFileSync(wbAt, "utf8"))[1]) iso3[c.iso2Code] = c.id;
  // Kosovo: the World Bank's code is XKX, UNODC's XKX too; the site's XK.
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const source = {
    label: "UNODC - crime and criminal justice statistics",
    url: `${PORTAL}/`,
    note: `Release ${hom.release}. Each country's own police and health records, as it reports them to UNODC; definitions and how much is reported differ from country to country.`,
  };
  let n = 0;
  const byCc = {};
  const add = (cc, place) => (byCc[cc] ||= []).push(place);
  for (const c of siteCountries(CACHE)) {
    const i = iso3[c.code] ?? (c.code === "XK" ? "XKX" : null);
    if (!i) continue;
    const series = {};
    for (const [k, by] of Object.entries(kinds)) {
      if (!by[i]) continue;
      const s = seriesOf(Object.fromEntries(Object.entries(by[i]).map(([y, v]) => [y, r3(v)])));
      if (s) series[k] = s;
    }
    if (!Object.keys(series).length) continue;
    add(c.code, { id: c.code, name: c.name, kind: "country", series });
    n++;
  }
  // The parts UNODC holds on their own: the United Kingdom's three jurisdictions (it holds no figure for the whole), and
  // Iraq's centre and its Kurdistan Region.
  const PARTS = {
    GBR_E_W: ["GB", "GB-EAW", "England and Wales", "jurisdiction"],
    GBR_S: ["GB", "GB-SCT", "Scotland", "jurisdiction"],
    GBR_NI: ["GB", "GB-NIR", "Northern Ireland", "jurisdiction"],
    IRQ_C: ["IQ", "IQ-C", "Central Iraq", "region"],
    IRQ_KRI: ["IQ", "IQ-KR", "Kurdistan Region", "region"],
  };
  for (const [code, [cc, id, name, kind]] of Object.entries(PARTS)) {
    const series = {};
    for (const [k, by] of Object.entries(kinds)) {
      const s = by[code] && seriesOf(Object.fromEntries(Object.entries(by[code]).map(([y, v]) => [y, r3(v)])));
      if (s) series[k] = s;
    }
    if (Object.keys(series).length) add(cc, { id, name, kind, parent: cc, series });
  }
  // One write to each country's file: a source's earlier places in it are taken off as it is written.
  for (const [cc, places] of Object.entries(byCc)) {
    mergeCountry("crime", cc, { source, sourceId: "unodc", defs: DEFS, places });
  }
  // The one well-known figure: the US homicide rate was 5 to 7 per 100,000 through the last decade.
  const us = JSON.parse(fs.readFileSync(path.join(__dirname, "static/crime/history/US.json"), "utf8")).places.find((p) => p.id === "US").series.homicide;
  const last = us[us.length - 1];
  if (!(last > 4 && last < 8)) throw new Error(`US homicide ${last}: wrong series?`);
  const index = writeIndex("crime");
  console.log(`crime history: ${n} countries (index ${Object.keys(index).length}); releases ${hom.release}/${eco.release}/${vio.release}; US homicide ${us[0]}-${us[0] + us.length - 2}, last ${last}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
