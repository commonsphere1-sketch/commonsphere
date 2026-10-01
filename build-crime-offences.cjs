/**
 * Builds src/data/crimeOffences.ts — what UNODC publishes on crime beyond
 * homicide, for the Crime page: offences recorded by the police in each
 * country, people detected as trafficked, firearms seized, people held in
 * prison without a sentence, and wildlife seized.
 *
 * build-crime.cjs covers the five offences the Countries page shows. This is
 * the wider set, and it reads the same portal the same way: each report page
 * is fetched to find its current download, because the download paths carry
 * the release month.
 *
 * Source files (UNODC Data Portal, data.unodc.org):
 *   corruption & economic crime   theft, burglary, vehicle theft, corruption,
 *                                 bribery, fraud, money laundering, computer
 *                                 offences, smuggling of migrants, and acts
 *                                 against the environment
 *   violent & sexual crime        kidnapping, sexual violence, rape, sexual
 *                                 exploitation, serious assault, robbery
 *   trafficking in persons        detected victims, by sex, age and form of
 *                                 exploitation; persons convicted (GLOTIP)
 *   firearms                      arms seized, by type (IAFQ)
 *   prisons                       share of people held who are unsentenced
 *   wildlife                      seizures by region and by year (World WISE)
 *
 * Nothing is computed: every rate is the rate UNODC publishes, every count the
 * count it publishes, each with its year. Only the latest year in the last
 * ten is kept for a place. Where UNODC withholds a small trafficking count it
 * prints "<5", and that is kept as "<5".
 *
 * Left out, because the file does not hold one figure for them: trafficking
 * victims under "other forms of exploitation" (several rows per country and
 * year, for sub-forms the file does not name) and convictions by form.
 *
 * UNODC cautions that recorded offences depend on each country's definitions,
 * on what its police count, and on how willing people are to report, so a
 * high rate may mean more crime or better recording. The page says so.
 *
 *   node build-crime-offences.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/crimeOffences.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-crime");
fs.mkdirSync(CACHE, { recursive: true });
const PORTAL = "https://data.unodc.org";
const OLDEST = new Date().getFullYear() - 10;

const REPORTS = {
  economic: { page: "/datareport/econ-corruption", file: /data_cts_corruption_and_economic_crime\.xlsx/ },
  violent: { page: "/datareport/violent-offences", file: /data_cts_violent_and_sexual_crime\.xlsx/ },
  trafficking: { page: "/datareport/tip-victims", file: /data_glotip\.xlsx/ },
  firearms: { page: "/datareport/firearm-seizures", file: /data_iafq_firearms_trafficking\.xlsx/ },
  prisons: { page: "/datareport/prison-held", file: /data_cts_prisons_and_prisoners\.xlsx/ },
  wildlife: { page: "/datareport/wildlife-seizures", file: /data_wildlife_trafficking\.xlsx/ },
};

/** The offences kept, in the order the page lists them. `cat` is UNODC's own name for the category. */
const OFFENCES = [
  { key: "kidnapping", group: "violence", file: "violent", label: "Kidnapping", cat: "Kidnapping" },
  { key: "sexualViolence", group: "violence", file: "violent", label: "Sexual violence", cat: "Sexual violence" },
  { key: "rape", group: "violence", file: "violent", label: "Rape", cat: "Sexual violence: Rape" },
  { key: "sexualExploitation", group: "violence", file: "violent", label: "Sexual exploitation", cat: "Sexual Exploitation" },
  { key: "assault", group: "violence", file: "violent", label: "Serious assault", cat: "Serious assault" },
  { key: "robbery", group: "violence", file: "violent", label: "Robbery", cat: "Robbery" },
  { key: "theft", group: "property", file: "economic", label: "Theft", cat: "Theft" },
  { key: "burglary", group: "property", file: "economic", label: "Burglary", cat: "Burglary" },
  { key: "vehicleTheft", group: "property", file: "economic", label: "Vehicle theft", cat: "Theft: of a motorized vehicle" },
  { key: "corruption", group: "corruption", file: "economic", label: "Corruption", cat: "Corruption" },
  { key: "bribery", group: "corruption", file: "economic", label: "Bribery", cat: "Corruption: Bribery" },
  { key: "fraud", group: "corruption", file: "economic", label: "Fraud", cat: "Fraud" },
  { key: "moneyLaundering", group: "corruption", file: "economic", label: "Money laundering", cat: "Money laundering" },
  { key: "computerAccess", group: "cyber", file: "economic", label: "Unlawful access to a computer system", cat: "Unlawful access to a computer system" },
  { key: "computerInterference", group: "cyber", file: "economic", label: "Interference with a computer system or data", cat: "Unlawful interference with a computer system or computer data" },
  { key: "cyberFraud", group: "cyber", file: "economic", label: "Cyber-related fraud", cat: "Fraud: Cyber-related (Cy)" },
  { key: "migrantSmuggling", group: "borders", file: "economic", label: "Smuggling of migrants", cat: "Smuggling of migrants" },
  { key: "pollution", group: "environment", file: "economic", label: "Pollution or degradation of the environment", cat: "Acts that cause environmental pollution or degradation" },
  { key: "resourceDepletion", group: "environment", file: "economic", label: "Depletion of natural resources", cat: "Acts that result in the depletion of degradation of natural resources" },
  { key: "waste", group: "environment", file: "economic", label: "Movement or dumping of waste", cat: "Acts involving the movement of dumping of waste" },
  { key: "protectedSpecies", group: "environment", file: "economic", label: "Trade in protected species", cat: "Trade or possession of protected or prohibited species of faune and flora" },
];

const ARM_TYPES = {
  pistol: "pistol",
  revolver: "revolver",
  "rifle (Inlcuding Carbine)": "rifle",
  "shotgun (Including Short Carbine)": "shotgun",
  "machine gun": "machineGun",
  "submachine gun": "submachineGun",
  "other weapons": "other",
  "Unknown status on type": "unknown",
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
  return { at, page: PORTAL + spec.page, url: PORTAL + href, release: (href.match(/files\/(\d{4}-\d{2})\//) || [])[1] };
}

const num = (s) => (s === undefined || s === null || s === "" ? NaN : Number(String(s).replace(/,/g, "")));
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** A long-format file: its rows, its columns by name, and the date UNODC stamps on it. */
function longFile(file, value = "VALUE") {
  const { rows } = readXlsx(file);
  const h = rows.findIndex((r) => r.includes("Iso3_code"));
  if (h < 0) throw new Error(`${file}: no header`);
  const ix = (k) => {
    const i = rows[h].indexOf(k);
    if (i < 0) throw new Error(`${file}: no column ${k}`);
    return i;
  };
  const c = { iso: ix("Iso3_code"), country: ix("Country"), ind: ix("Indicator"), dim: ix("Dimension"), cat: ix("Category"), sex: ix("Sex"), age: ix("Age"), year: ix("Year"), unit: ix("Unit of measurement"), v: ix(value) };
  const stamp = (rows.slice(0, h).flat().find((x) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(x))) || "").split("/").reverse().join("-");
  return { rows: rows.slice(h + 1), c, stamp };
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
  const src = {};
  for (const k of Object.keys(REPORTS)) src[k] = await report(k);

  // Places. The site keys countries by its own id; UNODC by ISO3, with a few
  // places of its own (the three jurisdictions of the United Kingdom, parts of
  // Iraq). A place on the site takes the site's id and name; any other keeps
  // UNODC's code and name.
  const siteOf = {};
  {
    const at = path.join(CACHE, "wb-countries.json");
    await fetchTo("https://api.worldbank.org/v2/country?format=json&per_page=400", at);
    const iso3 = {};
    for (const c of JSON.parse(fs.readFileSync(at, "utf8"))[1]) iso3[c.iso2Code] = c.id;
    for (const c of loadCountries()) if (iso3[c.code]) siteOf[iso3[c.code]] = { id: c.id, name: c.name };
  }
  const places = {};
  const placeOf = (iso, name) => {
    const s = siteOf[iso];
    const id = s ? s.id : iso.toLowerCase();
    places[id] ??= s ? s.name : clean(name);
    return id;
  };

  // ── Offences recorded by the police ────────────────────────────────────
  const files = { economic: longFile(src.economic.at), violent: longFile(src.violent.at) };
  const rates = {};
  for (const o of OFFENCES) {
    const { rows, c } = files[o.file];
    const latest = {}, counts = {};
    for (const r of rows) {
      if (r[c.cat] !== o.cat || r[c.dim] !== "by type of offence" || r[c.sex] !== "Total" || r[c.age] !== "Total") continue;
      const v = num(r[c.v]), y = +r[c.year];
      if (!Number.isFinite(v) || y < OLDEST) continue;
      if (/^Rate per 100,000/.test(r[c.unit])) {
        if (!latest[r[c.iso]] || y > latest[r[c.iso]].y) latest[r[c.iso]] = { v, y, name: r[c.country] };
      } else if (r[c.unit] === "Counts") (counts[r[c.iso]] ||= {})[y] = v;
    }
    rates[o.key] = {};
    for (const [iso, x] of Object.entries(latest)) {
      const n = counts[iso]?.[x.y];
      // A rate without the count behind it is kept; a count is never made up for it.
      rates[o.key][placeOf(iso, x.name)] = Number.isFinite(n) ? [rate(x.v), x.y, Math.round(n)] : [rate(x.v), x.y];
    }
    if (Object.keys(rates[o.key]).length < 40) throw new Error(`${o.key}: only ${Object.keys(rates[o.key]).length} places - category renamed?`);
  }

  // ── Trafficking in persons ─────────────────────────────────────────────
  const tip = longFile(src.trafficking.at, "txtVALUE");
  const count = (s) => (clean(s) === "<5" ? "<5" : Number.isFinite(num(s)) ? Math.round(num(s)) : undefined);
  const trafficking = {};
  {
    const { rows, c } = tip;
    const at = {}; // iso → year → field → value
    const names = {};
    const put = (r, field) => {
      const v = count(r[c.v]);
      if (v === undefined) return;
      const slot = ((at[r[c.iso]] ||= {})[+r[c.year]] ||= {});
      // More than one row for the same thing: no single figure, so none is kept.
      slot[field] = field in slot ? null : v;
      names[r[c.iso]] = r[c.country];
    };
    for (const r of rows) {
      if (+r[c.year] < OLDEST) continue;
      const sex = r[c.sex], age = r[c.age], total = sex === "Total" && age === "Total";
      if (r[c.ind] === "Detected trafficking victims") {
        if (r[c.dim] === "Total") {
          if (total) put(r, "victims");
          else if (sex === "Female" && age === "18 years or over") put(r, "women");
          else if (sex === "Male" && age === "18 years or over") put(r, "men");
          else if (sex === "Female" && age === "0 to 17 years") put(r, "girls");
          else if (sex === "Male" && age === "0 to 17 years") put(r, "boys");
        } else if (r[c.dim] === "by form of exploitation" && total) {
          if (r[c.cat] === "Sexual exploitation") put(r, "sexual");
          else if (r[c.cat] === "Forced labour") put(r, "labour");
        }
      } else if (r[c.dim] === "Total" && total) {
        if (r[c.ind] === "Persons convicted") put(r, "convicted");
        else if (r[c.ind] === "Persons prosecuted") put(r, "prosecuted");
      }
    }
    const latestWith = (years, field) => {
      const y = Object.keys(years).map(Number).filter((y) => years[y][field] != null).sort((a, b) => b - a)[0];
      return y === undefined ? undefined : [years[y][field], y];
    };
    for (const [iso, years] of Object.entries(at)) {
      const v = latestWith(years, "victims");
      const conv = latestWith(years, "convicted"), pros = latestWith(years, "prosecuted");
      if (!v && !conv && !pros) continue;
      const e = {};
      if (v) {
        e.y = v[1];
        e.victims = v[0];
        for (const f of ["women", "men", "girls", "boys", "sexual", "labour"]) if (years[v[1]][f] != null) e[f] = years[v[1]][f];
      }
      if (pros) e.prosecuted = pros;
      if (conv) e.convicted = conv;
      trafficking[placeOf(iso, names[iso])] = e;
    }
    if (Object.keys(trafficking).length < 100) throw new Error("trafficking: too few places");
  }

  // ── Firearms seized ────────────────────────────────────────────────────
  const arms = {};
  {
    const { rows, c } = longFile(src.firearms.at);
    const at = {}, names = {};
    for (const r of rows) {
      if (r[c.ind] !== "Arms seized" || +r[c.year] < OLDEST) continue;
      const v = num(r[c.v]);
      if (!Number.isFinite(v)) continue;
      const slot = ((at[r[c.iso]] ||= {})[+r[c.year]] ||= { types: {} });
      names[r[c.iso]] = r[c.country];
      if (r[c.dim] === "Total" && r[c.cat] === "Total") slot.total = Math.round(v);
      else if (r[c.dim] === "by type" && ARM_TYPES[r[c.cat]]) slot.types[ARM_TYPES[r[c.cat]]] = Math.round(v);
    }
    for (const [iso, years] of Object.entries(at)) {
      const y = Object.keys(years).map(Number).filter((y) => years[y].total !== undefined).sort((a, b) => b - a)[0];
      if (y === undefined) continue;
      const e = { y, total: years[y].total };
      if (Object.keys(years[y].types).length) e.types = years[y].types;
      arms[placeOf(iso, names[iso])] = e;
    }
    if (Object.keys(arms).length < 60) throw new Error("firearms: too few places");
  }

  // ── Held without a sentence ────────────────────────────────────────────
  const unsentenced = {};
  const prisons = longFile(src.prisons.at);
  {
    const { rows, c } = prisons;
    const latest = {};
    for (const r of rows) {
      if (r[c.ind] !== "Persons held unsentenced" || r[c.dim] !== "Total" || r[c.unit] !== "Percentage of total persons held") continue;
      if (r[c.sex] !== "Total" || r[c.age] !== "Total") continue;
      const v = num(r[c.v]), y = +r[c.year];
      if (!Number.isFinite(v) || y < OLDEST) continue;
      if (!latest[r[c.iso]] || y > latest[r[c.iso]].y) latest[r[c.iso]] = { v, y, name: r[c.country] };
    }
    // The file has a few shares above 100% (Jordan's unsentenced count is
    // several times its prison population). A place whose latest figure cannot
    // be true is left out, not given an older one in its stead.
    const impossible = [];
    for (const [iso, x] of Object.entries(latest)) {
      if (x.v < 0 || x.v > 100) { impossible.push(`${x.name} ${x.y} (${Math.round(x.v)}%)`); continue; }
      unsentenced[placeOf(iso, x.name)] = [Math.round(x.v * 10) / 10, x.y];
    }
    if (impossible.length > 3) throw new Error(`unsentenced: ${impossible.length} impossible shares - wrong series?`);
    if (impossible.length) console.log("  left out, share of prisoners above 100%: " + impossible.join(", "));
    if (Object.keys(unsentenced).length < 100) throw new Error("unsentenced: too few places");
  }

  // ── Wildlife seized ────────────────────────────────────────────────────
  const wildlife = [];
  let wildlifeStamp = "";
  {
    const { rows } = readXlsx(src.wildlife.at);
    const h = rows.findIndex((r) => r[0] === "geo" && r[1] === "year");
    if (h < 0 || rows[h][4] !== "taxonomic group" || rows[h][5] !== "unit_measure" || rows[h][6] !== "value") throw new Error("wildlife file layout changed");
    wildlifeStamp = (rows.slice(0, h).flat().find((x) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(x))) || "").split("/").reverse().join("-");
    const groups = {};
    for (const r of rows.slice(h + 1)) {
      const v = num(r[6]);
      if (!r[0] || !Number.isFinite(v)) continue;
      const g = (groups[clean(r[4])] ||= { group: clean(r[4]), unit: clean(r[5]), world: [], regions: [], span: "" });
      if (g.unit !== clean(r[5])) throw new Error(`wildlife ${g.group}: two units`);
      if (r[0] === "World") g.world.push([+r[1], round3(v)]);
      else { g.regions.push([clean(r[0]), round3(v)]); g.span = clean(r[1]); }
    }
    for (const g of Object.values(groups)) {
      g.world.sort((a, b) => a[0] - b[0]);
      g.regions.sort((a, b) => b[1] - a[1]);
      wildlife.push(g);
    }
    if (!wildlife.length) throw new Error("wildlife: nothing read");
  }

  // Checks against figures that are well known or that the file states twice.
  const us = trafficking[siteOf.USA.id];
  if (!us || typeof us.victims !== "number" || us.victims < 1000) throw new Error("US trafficking victims: wrong series?");
  for (const [id, e] of Object.entries(arms)) {
    const sum = Object.values(e.types || {}).reduce((a, b) => a + b, 0);
    if (e.types && Object.keys(e.types).length === 8 && Math.abs(sum - e.total) > Math.max(2, e.total * 0.01)) console.warn(`  note: ${places[id]} ${e.y}: arms by type add to ${sum}, total ${e.total}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const obj = (o) => JSON.stringify(o).replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, "$1:");
  const byName = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => a[0].localeCompare(b[0])));
  const lines = (o) => Object.entries(byName(o)).map(([k, v]) => `  ${JSON.stringify(k)}: ${obj(v)},`).join("\n");
  const source = (k, label, extra = "") => `  ${k}: { label: ${JSON.stringify(label)}, url: "${src[k].page}", release: "${src[k].release}"${extra} },`;

  fs.writeFileSync(
    OUT,
    `/**
 * Crime beyond homicide, as UNODC publishes it: offences recorded by the
 * police, people detected as trafficked, firearms seized, people held without
 * a sentence, and wildlife seized.
 *
 * GENERATED by build-crime-offences.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Every figure is UNODC's own, for the latest year in the last ten that the
 * place reported; nothing here is computed. UNODC cautions that recorded
 * offences reflect each country's definitions, what its police count and how
 * readily people report, so a high rate can mean more crime or better
 * recording.
 */
export const OFFENCE_SOURCES = {
${source("economic", "UNODC — corruption and economic crime", `, updated: "${files.economic.stamp}"`)}
${source("violent", "UNODC — violent and sexual crime", `, updated: "${files.violent.stamp}"`)}
${source("trafficking", "UNODC — trafficking in persons (GLOTIP)", `, updated: "${tip.stamp}"`)}
${source("firearms", "UNODC — firearms trafficking (IAFQ)")}
${source("prisons", "UNODC — prisons and prisoners", `, updated: "${prisons.stamp}"`)}
${source("wildlife", "UNODC — wildlife seizures (World WISE)", `, updated: "${wildlifeStamp}"`)}
} as const;
export const OFFENCES_RETRIEVED = "${today}";

export type OffenceGroup = "violence" | "property" | "corruption" | "cyber" | "borders" | "environment";
export type OffenceKey =
${OFFENCES.map((o) => `  | "${o.key}"`).join("\n")};

export interface OffenceDef {
  key: OffenceKey;
  group: OffenceGroup;
  label: string;
  /** UNODC's own name for the category. */
  unodc: string;
  /** Which of OFFENCE_SOURCES it is from. */
  source: "economic" | "violent";
}

export const OFFENCES: OffenceDef[] = [
${OFFENCES.map((o) => `  { key: "${o.key}", group: "${o.group}", label: ${JSON.stringify(o.label)}, unodc: ${JSON.stringify(o.cat)}, source: "${o.file}" },`).join("\n")}
];

/** Place id → name. The site's own id and name where the place is on the
 *  site; UNODC's code and name otherwise (it reports the United Kingdom as
 *  three jurisdictions). */
export const OFFENCE_PLACES: Record<string, string> = {
${lines(places)}
};

/** [rate per 100,000 people, year, offences recorded that year]. The count is
 *  absent where UNODC gives the rate without it. */
export type OffenceFigure = [number, number, number?];

export const OFFENCE_RATES: Record<OffenceKey, Record<string, OffenceFigure>> = {
${OFFENCES.map((o) => `  ${o.key}: ${obj(byName(rates[o.key]))},`).join("\n")}
};

/** A count UNODC withholds because it is small is "<5". */
export type SmallCount = number | "<5";

export interface TraffickingFigures {
  /** Year of the victim figures. */
  y?: number;
  /** People detected as victims of trafficking that year. */
  victims?: SmallCount;
  women?: SmallCount;
  men?: SmallCount;
  girls?: SmallCount;
  boys?: SmallCount;
  /** Of the victims: trafficked for sexual exploitation, for forced labour. */
  sexual?: SmallCount;
  labour?: SmallCount;
  /** [people, year] */
  prosecuted?: [SmallCount, number];
  convicted?: [SmallCount, number];
}

export const TRAFFICKING: Record<string, TraffickingFigures> = {
${lines(trafficking)}
};

export type ArmType = "pistol" | "revolver" | "rifle" | "shotgun" | "machineGun" | "submachineGun" | "other" | "unknown";

/** Firearms seized in a year, and by type where the country gave types. */
export const ARMS_SEIZED: Record<string, { y: number; total: number; types?: Partial<Record<ArmType, number>> }> = {
${lines(arms)}
};

/** [percent of people held who have not been sentenced, year] */
export const UNSENTENCED: Record<string, [number, number]> = {
${lines(unsentenced)}
};

export interface WildlifeSeizures {
  group: string;
  /** "Kilogram equivalent" or "Number". */
  unit: string;
  /** [year, seized worldwide] */
  world: [number, number][];
  /** [region, seized over \`span\`], largest first. */
  regions: [string, number][];
  span: string;
}

export const WILDLIFE_SEIZED: WildlifeSeizures[] = [
${wildlife.map((g) => `  ${obj(g)},`).join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB): ${Object.keys(places).length} places`);
  console.log("  offences: " + OFFENCES.map((o) => `${o.key} ${Object.keys(rates[o.key]).length}`).join(", "));
  console.log(`  trafficking ${Object.keys(trafficking).length}, arms ${Object.keys(arms).length}, unsentenced ${Object.keys(unsentenced).length}, wildlife groups ${wildlife.map((g) => g.group).join("/")}`);
  console.log("  releases: " + Object.entries(src).map(([k, s]) => `${k} ${s.release}`).join(", "));
})().catch((e) => { console.error(e); process.exit(1); });

/** A rate as published, to the precision that is worth printing. */
function rate(v) {
  return v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}
function round3(v) {
  return v >= 100 ? Math.round(v) : Math.round(v * 100) / 100;
}
