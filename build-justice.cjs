/**
 * Builds src/data/justice.ts — what the Crime page's Justice section stands
 * on: each country's legal system, the people who pass through its criminal
 * justice system at each stage, the people who staff it, and the Wikipedia
 * articles the section quotes to explain the kinds of justice, the legal
 * traditions and the steps of a case.
 *
 * Sources:
 *
 *   CIA World Factbook,        "Legal system" in each country's Government
 *     final edition (January   section, as written, and which of the four
 *     2026), public domain     traditions that line names (see TRADITIONS)
 *   UNODC Data Portal,         for each country and year, as it reported them
 *     access and functioning   to the UN Crime Trends Survey: people arrested,
 *     of justice (CTS)         cautioned or suspected; prosecuted; brought
 *                              before the criminal courts; convicted; and the
 *                              police, prosecutors, judges and prison staff
 *   World Bank, population     to set the staff beside the people they serve:
 *     (SP.POP.TOTL)            a count per 100,000 people is worked out here,
 *                              from UNODC's count and the population of the
 *                              same year. It is the only figure computed.
 *   Wikipedia                  only that each article named here exists, and
 *                              its title; the text is fetched by the page
 *                              when it is shown, under CC BY-SA 4.0
 *
 * A tradition is read off the Factbook's own words, before the first
 * semicolon of its line (what follows is about judicial review): "civil",
 * "Roman-Dutch" or "Napoleonic" is civil law; "common law" is common law;
 * "Islamic", "sharia", "religious", "canon", "Jewish", "Hindu", "Muslim" or
 * "Buddhist" is religious law; "customary", "traditional" or "tribal" is
 * customary law. A line naming several is a mixed system and is counted under
 * each. A line naming none - "the laws of France apply" - is kept as written
 * and counted under none.
 *
 * The stages are kept for one year per country: the latest of the last ten
 * for which it reported at least three of the four, or else two. They are
 * counts of people at each stage in that year, not one group followed
 * through: a person convicted this year may have been arrested in another.
 *
 *   node build-justice.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { readXlsx } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/justice.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CRIME = path.join(os.tmpdir(), "commonsphere-crime");
const FACTBOOK = path.join(os.tmpdir(), "commonsphere-geography");
const CACHE = path.join(os.tmpdir(), "commonsphere-justice");
for (const d of [CRIME, FACTBOOK, CACHE]) fs.mkdirSync(d, { recursive: true });

const PORTAL = "https://data.unodc.org";
const REPORT = { page: "/datareport/cjs-arrested", file: /data_cts_access_and_functioning_of_justice\.xlsx/ };
const REPO = "https://raw.githubusercontent.com/factbook/factbook.json/master";
const THIS_YEAR = new Date().getFullYear();
const OLDEST = THIS_YEAR - 10;

/** Factbook entries with no internet country code of their own (as in build-country-politics.cjs). */
const BY_PATH = { GB: "europe/uk", UM: "australia-oceania/um", GS: "south-america/sx", SJ: "europe/sv", XK: "europe/kv", EH: "africa/wi" };

/** The four traditions, and the words in the Factbook's line that name each. */
const TRADITIONS = [
  { id: "civil", name: "Civil law", re: /\bcivil\b|roman-dutch|napoleonic/i },
  { id: "common", name: "Common law", re: /common[- ]law/i },
  { id: "religious", name: "Religious law", re: /islamic|sharia|shari['’]a|religious|canon|jewish|hindu|muslim|buddhist/i },
  { id: "customary", name: "Customary law", re: /customary|traditional|tribal/i },
];

/** UNODC's four stages, by its own indicator names, in the order a case runs. */
const STAGES = [
  { id: "suspected", ind: "Persons arrested/cautioned/suspected" },
  { id: "prosecuted", ind: "Persons prosecuted" },
  { id: "courts", ind: "Persons brought before criminal courts" },
  { id: "convicted", ind: "Persons convicted" },
];
/** UNODC's four kinds of staff, by its own category names (its spelling). */
const STAFF = [
  { id: "police", cat: "Police personel" },
  { id: "prosecutors", cat: "Prosecution personnel" },
  { id: "judges", cat: "Professional Judges or Magistrate" },
  { id: "prisonStaff", cat: "Prison Staff" },
];

/**
 * The Wikipedia articles the section quotes. `title` is the article asked
 * for; the build checks it exists and keeps the title Wikipedia gives it.
 */
const ARTICLES = [
  // The branches of a justice system
  { id: "criminal", group: "branch", label: "Criminal justice", title: "Criminal justice" },
  { id: "civil", group: "branch", label: "Civil justice", title: "Civil law (common law)" },
  { id: "administrative", group: "branch", label: "Administrative justice", title: "Administrative law" },
  { id: "juvenile", group: "branch", label: "Juvenile justice", title: "Juvenile court" },
  { id: "military", group: "branch", label: "Military justice", title: "Military justice" },
  { id: "international", group: "branch", label: "International criminal justice", title: "International criminal law" },
  // The ideas of what justice is for
  { id: "retributive", group: "idea", label: "Retributive", title: "Retributive justice" },
  { id: "restorative", group: "idea", label: "Restorative", title: "Restorative justice" },
  { id: "distributive", group: "idea", label: "Distributive", title: "Distributive justice" },
  { id: "procedural", group: "idea", label: "Procedural", title: "Procedural justice" },
  { id: "transitional", group: "idea", label: "Transitional", title: "Transitional justice" },
  { id: "social", group: "idea", label: "Social", title: "Social justice" },
  // The legal traditions, and how each tries a case
  { id: "civil-tradition", group: "tradition", label: "Civil law", title: "Civil law (legal system)" },
  { id: "common-tradition", group: "tradition", label: "Common law", title: "Common law" },
  { id: "religious-tradition", group: "tradition", label: "Religious law", title: "Religious law" },
  { id: "customary-tradition", group: "tradition", label: "Customary law", title: "Customary law" },
  { id: "inquisitorial", group: "trial", label: "The inquisitorial system", title: "Inquisitorial system" },
  { id: "adversarial", group: "trial", label: "The adversarial system", title: "Adversarial system" },
  { id: "sharia", group: "trial", label: "Sharia", title: "Sharia" },
  // The steps of a criminal case
  { id: "investigation", group: "step", label: "Investigation", title: "Criminal investigation" },
  { id: "arrest", group: "step", label: "Arrest", title: "Arrest" },
  { id: "charge", group: "step", label: "Charge", title: "Criminal charge" },
  { id: "bail", group: "step", label: "Bail", title: "Bail" },
  { id: "plea", group: "step", label: "Plea", title: "Plea bargain" },
  { id: "trial", group: "step", label: "Trial", title: "Trial" },
  { id: "verdict", group: "step", label: "Verdict", title: "Verdict" },
  { id: "sentence", group: "step", label: "Sentence", title: "Sentence (law)" },
  { id: "appeal", group: "step", label: "Appeal", title: "Appeal" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchTo(url, at, binary) {
  if (fs.existsSync(at)) return;
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(at, binary ? Buffer.from(await res.arrayBuffer()) : await res.text());
      return;
    } catch (e) {
      if (i === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}
const readJson = async (url, at) => (await fetchTo(url, at), JSON.parse(fs.readFileSync(at, "utf8")));

const entities = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ndash;|&mdash;/g, "-");
const plain = (v) => entities(String((v && typeof v === "object" ? v.text : v) ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const num = (s) => (s === undefined || s === null || s === "" ? NaN : Number(String(s).replace(/,/g, "")));

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const countries = loadCountries();

  // ── Legal systems: the Factbook's line for each country ─────────────────
  const tree = await readJson("https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1", path.join(FACTBOOK, "tree.json"));
  const files = tree.tree.filter((x) => x.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(x.path)).map((x) => x.path.replace(/\.json$/, ""));
  const entry = async (f) => readJson(`${REPO}/${f}.json`, path.join(FACTBOOK, f.replace("/", "__") + ".json"));
  const byTld = new Map();
  for (const f of files) {
    const m = /\.([a-z]{2})\b/.exec(plain((await entry(f)).Communications?.["Internet country code"]));
    if (!m) continue;
    const code = m[1].toUpperCase() === "UK" ? "GB" : m[1].toUpperCase();
    (byTld.get(code) || byTld.set(code, []).get(code)).push(f);
  }
  const legal = {};
  for (const c of countries) {
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    if (!p) continue;
    const line = plain((await entry(p)).Government?.["Legal system"]);
    if (!line) continue;
    const first = line.split(";")[0];
    legal[c.id] = { traditions: TRADITIONS.filter((t) => t.re.test(first)).map((t) => t.id), text: line.length > 260 ? line.slice(0, line.lastIndexOf(" ", 257)) + "…" : line };
  }
  const nLegal = Object.keys(legal).length;
  const classed = Object.values(legal).filter((l) => l.traditions.length).length;
  if (nLegal < 200 || classed < 180) throw new Error(`legal systems: ${nLegal} countries read, ${classed} placed in a tradition`);

  // ── The stages and the staff: UNODC ─────────────────────────────────────
  const pageAt = path.join(CRIME, "page-cjs-arrested.html");
  await fetchTo(PORTAL + REPORT.page, pageAt);
  const href = (fs.readFileSync(pageAt, "utf8").match(/\/sites\/[^"']+\.xlsx/g) || []).find((h) => REPORT.file.test(h));
  if (!href) throw new Error(`no download link on ${REPORT.page}`);
  const xlsx = path.join(CRIME, path.basename(href));
  await fetchTo(PORTAL + href, xlsx, true);
  const release = (href.match(/files\/(\d{4}-\d{2})\//) || [])[1];

  const { rows } = readXlsx(xlsx);
  const h = rows.findIndex((r) => r.includes("Iso3_code"));
  if (h < 0) throw new Error("UNODC file: no header");
  const col = (k) => {
    const i = rows[h].indexOf(k);
    if (i < 0) throw new Error(`UNODC file: no column ${k}`);
    return i;
  };
  const c = { iso: col("Iso3_code"), ind: col("Indicator"), dim: col("Dimension"), cat: col("Category"), sex: col("Sex"), age: col("Age"), year: col("Year"), unit: col("Unit of measurement"), v: col("VALUE") };
  const stamp = (rows.slice(0, h).flat().find((x) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(x))) || "").split("/").reverse().join("-");

  const wb = await readJson("https://api.worldbank.org/v2/country?format=json&per_page=400", path.join(CRIME, "wb-countries.json"));
  const iso3Of = {};
  for (const x of wb[1]) iso3Of[x.iso2Code] = x.id;
  const siteOf = {};
  for (const x of countries) if (iso3Of[x.code]) siteOf[iso3Of[x.code]] = x.id;

  // iso3 → year → field → value. Two rows for one thing is no single figure, so none is kept.
  const at = {};
  const put = (r, field) => {
    const v = num(r[c.v]), y = +r[c.year];
    if (!Number.isFinite(v) || v < 0 || y < OLDEST || !siteOf[r[c.iso]]) return;
    const slot = ((at[siteOf[r[c.iso]]] ||= {})[y] ||= {});
    slot[field] = field in slot && slot[field] !== v ? null : Math.round(v);
  };
  for (const r of rows.slice(h + 1)) {
    if (r[c.unit] !== "Counts" || r[c.age] !== "Total") continue;
    if (r[c.ind] === "Criminal Justice Personnel") {
      const s = STAFF.find((x) => x.cat === r[c.cat]);
      if (!s || r[c.dim] !== "by type of personnel") continue;
      if (r[c.sex] === "Total") put(r, s.id);
      else if (r[c.sex] === "Female") put(r, s.id + "Women");
    } else if (r[c.dim] === "Total" && r[c.cat] === "Total" && r[c.sex] === "Total") {
      const s = STAGES.find((x) => x.ind === r[c.ind]);
      if (s) put(r, s.id);
    }
  }

  // ── What becomes of each kind of offence: the people convicted of it, and the people held in prison for it ──
  // UNODC publishes no sentence a court passed or a law sets. What it publishes by kind of offence is these two
  // counts, under its own categories; the page's offences are matched to the category that holds them.
  const KINDS = [
    { id: "homicide", dim: "by selected crime", cat: /^intentional homicide$/i },
    { id: "violentProperty", dim: "by type of criminal acts", cat: /^acts against property involving violence$/i },
    { id: "harm", dim: "by type of criminal acts", cat: /^acts leading to harm or intending to cause harm to the person$/i },
    { id: "property", dim: "by type of criminal acts", cat: /^acts against property only$/i },
  ];
  const outcomes = {};
  const outcome = (iso, kind, what, y, v) => {
    const id = siteOf[iso];
    if (!id || y < OLDEST || !Number.isFinite(v) || v < 0) return;
    const slot = ((outcomes[id] ||= {})[kind] ||= {});
    if (!slot[what] || y > slot[what][1]) slot[what] = [Math.round(v), y];
  };
  const kindOf = (r, cols) => KINDS.find((k) => k.dim === r[cols.dim] && k.cat.test(String(r[cols.cat] ?? "").trim()));
  for (const r of rows.slice(h + 1)) {
    if (r[c.unit] !== "Counts" || r[c.age] !== "Total" || r[c.sex] !== "Total" || r[c.ind] !== "Persons convicted") continue;
    const k = kindOf(r, c);
    if (k) outcome(r[c.iso], k.id, "convicted", +r[c.year], num(r[c.v]));
  }
  {
    const prisonPage = path.join(CRIME, "page-prison-held.html");
    await fetchTo(PORTAL + "/datareport/prison-held", prisonPage);
    const link = (fs.readFileSync(prisonPage, "utf8").match(/\/sites\/[^"']+\.xlsx/g) || []).find((x) => /data_cts_prisons_and_prisoners\.xlsx/.test(x));
    if (!link) throw new Error("no download link on /datareport/prison-held");
    const file = path.join(CRIME, path.basename(link));
    await fetchTo(PORTAL + link, file, true);
    const p = readXlsx(file).rows;
    const ph = p.findIndex((r) => r.includes("Iso3_code"));
    const pc = Object.fromEntries(["Iso3_code", "Indicator", "Dimension", "Category", "Sex", "Age", "Year", "Unit of measurement", "VALUE"].map((k) => [k, p[ph].indexOf(k)]));
    if (Object.values(pc).some((i) => i < 0)) throw new Error("UNODC prisons file: a column is missing");
    const cols = { dim: pc.Dimension, cat: pc.Category };
    for (const r of p.slice(ph + 1)) {
      if (r[pc["Unit of measurement"]] !== "Counts" || r[pc.Age] !== "Total" || r[pc.Sex] !== "Total" || r[pc.Indicator] !== "Persons held") continue;
      const k = kindOf(r, cols);
      if (k) outcome(r[pc.Iso3_code], k.id, "held", +r[pc.Year], num(r[pc.VALUE]));
    }
  }
  const nOutcomes = Object.keys(outcomes).length;
  if (nOutcomes < 60) throw new Error(`UNODC: only ${nOutcomes} countries with convictions or prisoners by offence`);

  // Population, for the staff per 100,000 people: the World Bank's, for the same year.
  const popRows = await readJson(`https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=20000&date=${OLDEST}:${THIS_YEAR}`, path.join(CACHE, `population-${OLDEST}-${THIS_YEAR}.json`));
  if (popRows[0].pages !== 1) throw new Error("population: more than one page");
  const pop = {};
  for (const x of popRows[1]) if (x.value && siteOf[x.countryiso3code]) (pop[siteOf[x.countryiso3code]] ||= {})[+x.date] = x.value;

  const process = {};
  const staff = {};
  for (const [id, years] of Object.entries(at)) {
    const ys = Object.keys(years).map(Number).sort((a, b) => b - a);
    const have = (y) => STAGES.filter((s) => years[y][s.id] != null);
    const y = ys.find((y) => have(y).length >= 3) ?? ys.find((y) => have(y).length >= 2);
    if (y !== undefined) process[id] = { y, ...Object.fromEntries(have(y).map((s) => [s.id, years[y][s.id]])) };

    const e = {};
    for (const s of STAFF) {
      const sy = ys.find((y) => years[y][s.id] != null && years[y][s.id] > 0);
      if (sy === undefined) continue;
      const n = years[sy][s.id];
      const people = pop[id]?.[sy];
      const women = years[sy][s.id + "Women"];
      // [count, year, per 100,000 people where the year's population is known, women where reported and no more than the count]
      e[s.id] = [n, sy, people ? +((n / people) * 1e5).toFixed(n / people < 1e-4 ? 2 : 1) : null, women != null && women <= n ? women : null];
    }
    if (Object.keys(e).length) staff[id] = e;
  }
  const nProcess = Object.keys(process).length, nStaff = Object.keys(staff).length;
  const nJudges = Object.values(staff).filter((s) => s.judges).length;
  if (nProcess < 50 || nStaff < 80 || nJudges < 60) throw new Error(`UNODC: ${nProcess} countries with stages, ${nStaff} with staff, ${nJudges} with judges - indicator renamed?`);

  // ── The articles: each must exist ───────────────────────────────────────
  const wiki = await readJson(
    `https://en.wikipedia.org/w/api.php?action=query&redirects=1&format=json&prop=info&titles=${encodeURIComponent(ARTICLES.map((a) => a.title).join("|"))}`,
    path.join(CACHE, "articles.json"),
  );
  const moved = Object.fromEntries([...(wiki.query.normalized || []), ...(wiki.query.redirects || [])].map((x) => [x.from, x.to]));
  const found = new Set(Object.values(wiki.query.pages).filter((p) => p.missing === undefined && p.invalid === undefined).map((p) => p.title));
  const articles = ARTICLES.map((a) => {
    let t = a.title;
    for (let i = 0; i < 3 && moved[t]; i++) t = moved[t];
    if (!found.has(t)) throw new Error(`Wikipedia has no article "${a.title}"`);
    return { ...a, title: t };
  });

  // ── Write ───────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  const obj = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k}: ${q(v)}`).join(", ")} }`;
  fs.writeFileSync(
    OUT,
    `/**
 * Justice: each country's legal system, the people at each stage of its
 * criminal justice system, the people who staff it, and the Wikipedia
 * articles the Crime page quotes to explain them.
 *
 * GENERATED by build-justice.cjs on ${today} — do not edit by hand; change
 * the script and re-run it. The script says how each part is read.
 *
 * The legal systems are the CIA World Factbook's lines, as written (final
 * edition, January 2026); the traditions are which of four that line names.
 * The stages and the staff are counts each country reported to UNODC. A
 * count per 100,000 people is the one figure worked out: UNODC's count over
 * the World Bank's population for the same year.
 */
export const JUSTICE_SOURCES = {
  legal: { label: "CIA World Factbook, final edition (January 2026) — Government: legal system (public domain)", url: "https://github.com/factbook/factbook.json" },
  unodc: { label: "UNODC — access and functioning of justice (UN Crime Trends Survey)", url: ${q(PORTAL + REPORT.page)} },
  population: { label: "World Bank — population, total (SP.POP.TOTL)", url: "https://data.worldbank.org/indicator/SP.POP.TOTL" },
  wikipedia: { label: "Wikipedia (CC BY-SA 4.0)", url: "https://en.wikipedia.org/" },
  /** UNODC's release of the file, and the date it stamps on it. */
  release: ${q(release ?? "")},
  stamped: ${q(stamp)},
  retrieved: "${today}",
};

export type Tradition = ${TRADITIONS.map((t) => q(t.id)).join(" | ")};
/** The four legal traditions, as the section names them. */
export const TRADITIONS: { id: Tradition; name: string }[] = [
${TRADITIONS.map((t) => `  { id: ${q(t.id)}, name: ${q(t.name)} },`).join("\n")}
];

/** Each country's legal system: the traditions the Factbook's line names (none, one or several), and the line. Keyed by the site's country id. */
export const LEGAL_SYSTEMS: Record<string, { traditions: Tradition[]; text: string }> = {
${Object.entries(legal).map(([id, l]) => `  ${q(id)}: { traditions: ${q(l.traditions)}, text: ${q(l.text)} },`).join("\n")}
};

export type Stage = ${STAGES.map((s) => q(s.id)).join(" | ")};
/** People at each stage of the criminal justice system in one year, as the country reported them to UNODC: those of the four stages it reported. */
export const JUSTICE_PROCESS: Record<string, { y: number } & Partial<Record<Stage, number>>> = {
${Object.entries(process).map(([id, p]) => `  ${q(id)}: ${obj(p)},`).join("\n")}
};

/** UNODC's kinds of offence the page's offences fall under: intentional homicide; robbery (acts against property involving violence); assault (acts leading to harm); burglary and theft (acts against property only). */
export type OffenceKind = "homicide" | "violentProperty" | "harm" | "property";
/** [people, year] */
export type Counted = [people: number, year: number];
/**
 * What becomes of each kind of offence, as the country reported it: the people convicted of it in a year, and the
 * people held in prison for it. UNODC publishes no sentence, so none is here.
 */
export const JUSTICE_OUTCOMES: Record<string, Partial<Record<OffenceKind, { convicted?: Counted; held?: Counted }>>> = {
${Object.entries(outcomes).map(([id, o]) => `  ${q(id)}: ${q(o)},`).join("\n")}
};

export type StaffKind = ${STAFF.map((s) => q(s.id)).join(" | ")};
/** [count, year, per 100,000 people (null where the year's population is not known), women among them (null where not reported)] */
export type StaffFigure = [count: number, year: number, per100k: number | null, women: number | null];
/** The people who staff each country's criminal justice system, each for the latest year reported. */
export const JUSTICE_STAFF: Record<string, Partial<Record<StaffKind, StaffFigure>>> = {
${Object.entries(staff).map(([id, s]) => `  ${q(id)}: { ${Object.entries(s).map(([k, v]) => `${k}: ${q(v)}`).join(", ")} },`).join("\n")}
};

export type ArticleGroup = "branch" | "idea" | "tradition" | "trial" | "step";
/** The Wikipedia articles the section quotes, each checked to exist on ${today}. */
export const JUSTICE_ARTICLES: { id: string; group: ArticleGroup; label: string; title: string }[] = [
${articles.map((a) => `  ${obj(a)},`).join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  const tally = {};
  for (const l of Object.values(legal)) tally[l.traditions.join("+") || "none"] = (tally[l.traditions.join("+") || "none"] || 0) + 1;
  console.log(`  legal systems: ${nLegal} countries, ${classed} placed in a tradition`);
  console.log("   ", Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));
  for (const t of TRADITIONS) console.log(`    ${t.name}: ${Object.values(legal).filter((l) => l.traditions.includes(t.id)).length} (alone ${Object.values(legal).filter((l) => l.traditions.length === 1 && l.traditions[0] === t.id).length})`);
  console.log("    none:", Object.entries(legal).filter(([, l]) => !l.traditions.length).map(([id, l]) => `${id} "${l.text.slice(0, 50)}"`).join("; "));
  console.log(`  UNODC ${release} (stamped ${stamp}): ${nProcess} countries with stages, ${nStaff} with staff (${nJudges} with judges)`);
  for (const s of STAGES) console.log(`    ${s.id}: ${Object.values(process).filter((p) => p[s.id] != null).length}`);
  for (const s of STAFF) console.log(`    ${s.id}: ${Object.values(staff).filter((x) => x[s.id]).length}, per 100k for ${Object.values(staff).filter((x) => x[s.id]?.[2] != null).length}, women for ${Object.values(staff).filter((x) => x[s.id]?.[3] != null).length}`);
  for (const id of ["us", "de", "jp", "in", "br"]) console.log(`    ${id}:`, q(process[id]), q(staff[id]));
  console.log(`  articles: ${articles.map((a) => (a.title === ARTICLES.find((x) => x.id === a.id).title ? a.title : `${ARTICLES.find((x) => x.id === a.id).title} → ${a.title}`)).join("; ")}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
