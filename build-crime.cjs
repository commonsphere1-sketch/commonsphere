/**
 * Builds src/data/countryCrime.ts — police-recorded crime per country from
 * UNODC's crime and criminal justice statistics, each figure with its year.
 *
 * What this replaces. CountriesPage.tsx carried COUNTRY_CRIME_STATS: homicide,
 * robbery, assault, burglary, vehicle theft and drug-offence rates for every
 * country, plus a 0–100 "safety index" and "crime index", with one year per
 * country and a citation to UNODC and Numbeo. The indices are Numbeo's -
 * crowd-sourced perception surveys, not measurements - and the page cannot
 * say which Numbeo release they came from, so they are dropped. Drug-offence
 * rates are not in any of the UNODC files used here, and nothing recorded
 * where the written ones came from, so they are dropped too. The rest is
 * rebuilt from UNODC.
 *
 * Source files (UNODC Data Portal, data.unodc.org). Their download paths
 * carry the release month, so the script reads each report page to find the
 * current file rather than hard-coding one:
 *   intentional homicide           rate per 100,000, as published
 *   corruption & economic crime    burglary, motor-vehicle theft: rates as published
 *   violent & sexual crime         robbery, serious assault: published as counts
 *                                  only, so the rate is the count over the
 *                                  World Bank's population for the same year
 *                                  and is marked `derived`.
 *
 * UNODC itself cautions that police-recorded offences depend on each
 * country's definitions and on how willing people are to report, so these
 * compare a country with itself over time far better than with other
 * countries. The page says so.
 *
 * Only figures from the last ten years are kept.
 *
 *   node build-crime.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/countryCrime.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-crime");
fs.mkdirSync(CACHE, { recursive: true });
const PORTAL = "https://data.unodc.org";
const OLDEST = new Date().getFullYear() - 10;

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

/** Find the report's current download on its page, fetch it, and return its path and URL. */
async function report(key) {
  const spec = REPORTS[key];
  const pageAt = path.join(CACHE, key + ".html");
  await fetchTo(PORTAL + spec.page, pageAt);
  const hrefs = fs.readFileSync(pageAt, "utf8").match(/\/sites\/[^"']+\.xlsx/g) || [];
  const href = hrefs.find((h) => spec.file.test(h));
  if (!href) throw new Error(`${key}: no download link on ${spec.page}`);
  const at = path.join(CACHE, path.basename(href));
  await fetchTo(PORTAL + href, at, true);
  return { at, url: PORTAL + href, release: (href.match(/files\/(\d{4}-\d{2})\//) || [])[1] };
}

const num = (s) => (s === undefined || s === "" ? NaN : Number(String(s).replace(/,/g, "")));

/** Long-format files: iso3 → latest { v, y } for rows matching `pick`. */
function longFormat(file, pick) {
  const { rows } = readXlsx(file);
  const h = rows.findIndex((r) => r.includes("Iso3_code"));
  if (h < 0) throw new Error(`${file}: no header`);
  const H = rows[h];
  const ix = (k) => {
    const i = H.indexOf(k);
    if (i < 0) throw new Error(`${file}: no column ${k}`);
    return i;
  };
  const col = { iso: ix("Iso3_code"), country: ix("Country"), ind: ix("Indicator"), dim: ix("Dimension"), cat: ix("Category"), sex: ix("Sex"), age: ix("Age"), year: ix("Year"), unit: ix("Unit of measurement"), v: ix("VALUE") };
  const out = {};
  const names = {};
  for (const r of rows.slice(h + 1)) {
    if (r[col.iso]) names[r[col.country]] = r[col.iso];
    if (!pick(r, col)) continue;
    const v = num(r[col.v]), y = r[col.year];
    if (!Number.isFinite(v) || +y < OLDEST) continue;
    const id = r[col.iso];
    if (!out[id] || +y > +out[id].y) out[id] = { v, y: String(y) };
  }
  return { out, names };
}

const isTotal = (r, c) => r[c.sex] === "Total" && r[c.age] === "Total";
const isRate = (r, c) => /^Rate per 100,000/.test(r[c.unit]);

async function population() {
  const at = path.join(CACHE, "SP.POP.TOTL.json");
  await fetchTo(`https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=${OLDEST}:${new Date().getFullYear()}&per_page=30000`, at);
  const out = {};
  for (const row of JSON.parse(fs.readFileSync(at, "utf8"))[1] || []) {
    if (row.value === null) continue;
    (out[row.countryiso3code] ||= {})[row.date] = row.value;
  }
  return out;
}

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(
    `npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const hom = await report("homicide");
  const eco = await report("economic");
  const vio = await report("violent");

  const homicide = longFormat(hom.at, (r, c) =>
    r[c.ind] === "Victims of intentional homicide" && r[c.dim] === "Total" && r[c.cat] === "Total" && isTotal(r, c) && isRate(r, c));
  const burglary = longFormat(eco.at, (r, c) => r[c.cat] === "Burglary" && isTotal(r, c) && isRate(r, c));
  const vehicle = longFormat(eco.at, (r, c) => r[c.cat] === "Theft: of a motorized vehicle" && isTotal(r, c) && isRate(r, c));

  // The violent-crime file is wide and names countries without codes; take
  // codes from the other two files, which carry both.
  const nameToIso = { ...homicide.names, ...burglary.names };
  const { rows } = readXlsx(vio.at);
  const vh = rows.findIndex((r) => r[2] === "Country" && r[3] === "Category");
  if (vh < 0 || rows[vh][4] !== "variable" || rows[vh][5] !== "value") throw new Error("violent file layout changed");
  const pop = await population();
  const counts = { Robbery: {}, "Serious assault": {} };
  const unnamed = new Set();
  for (const r of rows.slice(vh + 1)) {
    if (!(r[3] in counts)) continue;
    const v = num(r[5]), y = r[4];
    if (!Number.isFinite(v) || +y < OLDEST) continue;
    const iso = nameToIso[r[2]];
    if (!iso) { unnamed.add(r[2]); continue; }
    const p = pop[iso]?.[y];
    if (!p) continue;
    const bucket = counts[r[3]];
    if (!bucket[iso] || +y > +bucket[iso].y) bucket[iso] = { v: (v / p) * 1e5, y: String(y) };
  }

  const iso3 = {};
  {
    const at = path.join(CACHE, "wb-countries.json");
    await fetchTo("https://api.worldbank.org/v2/country?format=json&per_page=400", at);
    for (const c of JSON.parse(fs.readFileSync(at, "utf8"))[1]) iso3[c.iso2Code] = c.id;
  }

  const r1 = (v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
  const lit = (x, derived) => (x ? `{ v: ${r1(x.v)}, y: "${x.y}"${derived ? ", derived: true" : ""} }` : null);
  const out = [];
  const tally = { homicide: 0, robbery: 0, assault: 0, burglary: 0, vehicleTheft: 0 };
  for (const c of loadCountries().sort((a, b) => a.id.localeCompare(b.id))) {
    const i = iso3[c.code];
    if (!i) continue;
    const f = {
      homicide: lit(homicide.out[i]),
      robbery: lit(counts.Robbery[i], true),
      assault: lit(counts["Serious assault"][i], true),
      burglary: lit(burglary.out[i]),
      vehicleTheft: lit(vehicle.out[i]),
    };
    const parts = Object.entries(f).filter(([, v]) => v).map(([k, v]) => { tally[k]++; return `${k}: ${v}`; });
    if (parts.length) out.push(`  ${JSON.stringify(c.id)}: { ${parts.join(", ")} },`);
  }

  // Check the one well-known figure: the US homicide rate has been 5–7 per
  // 100,000 throughout the last decade.
  const us = homicide.out.USA;
  if (!us || us.v < 4 || us.v > 8) throw new Error(`US homicide rate ${us && us.v}: wrong series?`);

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Police-recorded crime per country, per 100,000 people, each with its year.
 *
 * GENERATED by build-crime.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * UNODC crime and criminal justice statistics (data.unodc.org):
 *   homicide, burglary, vehicleTheft  rates as UNODC publishes them
 *   robbery, assault (serious)        UNODC counts over World Bank population
 *                                     for the same year (\`derived: true\`)
 * UNODC cautions that recorded offences reflect each country's definitions
 * and reporting rates, so cross-country comparison is weak.
 */
export const CRIME_SOURCE = {
  label: "UNODC — crime and criminal justice statistics",
  url: "${PORTAL}/",
  release: "${hom.release}",
  retrieved: "${today}",
};

export type CrimeFigure = { v: number; y: string; derived?: boolean };

export interface CountryCrime {
  homicide?: CrimeFigure;
  robbery?: CrimeFigure;
  assault?: CrimeFigure;
  burglary?: CrimeFigure;
  vehicleTheft?: CrimeFigure;
}

export const COUNTRY_CRIME: Record<string, CountryCrime> = {
${out.join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${out.length} countries; releases ${hom.release}/${eco.release}/${vio.release}`);
  console.log("  coverage: " + Object.entries(tally).map(([k, n]) => `${k} ${n}`).join(", "));
  if (unnamed.size) console.log("  violent-crime rows with no code match: " + [...unnamed].join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
