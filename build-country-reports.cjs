/**
 * Builds src/data/countryReports.ts — what the country window's Sovereignty
 * and Safety reports stand on that the site did not already hold.
 *
 * Sovereignty, from the CIA World Factbook's Government section (final
 * edition, January 2026, public domain), each as the Factbook words it:
 *
 *   independence          the date, and from whom
 *   dependency status     for a place that is not independent
 *   dependent areas       the places it holds
 *   constitution          its history, and how it is amended
 *   international law     whether it accepts the International Court of
 *                         Justice's and the International Criminal Court's
 *                         jurisdiction
 *   citizenship           by birth, by descent, dual, and the years of
 *                         residence to be naturalised
 *   organisations         how many international bodies it takes part in, and
 *                         whether the United Nations is among them
 *   forces abroad         its military deployments
 *
 * Safety: the Factbook's natural hazards, and from the World Bank's World
 * Development Indicators the death rates the WHO estimates - on the roads,
 * from unintentional poisoning, from air pollution, from unsafe water and
 * sanitation, by suicide - and the IDMC's count of people newly displaced by
 * disasters; each for the latest year in the last twelve, with the world's
 * figure for the same year where the Bank publishes one.
 *
 * Nothing is computed. A field a source does not give for a place is absent.
 * The Factbook is frozen at January 2026: a change of status since is not in
 * it, and the report says so.
 *
 *   node build-country-reports.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryReports.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const FACTBOOK = path.join(os.tmpdir(), "commonsphere-geography");
const CACHE = path.join(os.tmpdir(), "commonsphere-country-reports");
for (const d of [FACTBOOK, CACHE]) fs.mkdirSync(d, { recursive: true });
const REPO = "https://raw.githubusercontent.com/factbook/factbook.json/master";
const THIS_YEAR = new Date().getFullYear();
const OLDEST = THIS_YEAR - 12;

/** Factbook entries with no internet country code of their own (as in build-country-politics.cjs). */
const BY_PATH = { GB: "europe/uk", UM: "australia-oceania/um", GS: "south-america/sx", SJ: "europe/sv", XK: "europe/kv", EH: "africa/wi" };

/** The World Bank's series kept: what each is, its unit, and its decimal places. */
const SAFETY = {
  roadDeaths: { code: "SH.STA.TRAF.P5", dp: 1 },
  poisoning: { code: "SH.STA.POIS.P5", dp: 1 },
  airPollutionDeaths: { code: "SH.STA.AIRP.P5", dp: 1 },
  unsafeWaterDeaths: { code: "SH.STA.WASH.P5", dp: 1 },
  suicide: { code: "SH.STA.SUIC.P5", dp: 1 },
  disasterDisplaced: { code: "VC.IDP.NWDS", dp: 0 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url, at) {
  if (!fs.existsSync(at)) {
    for (let i = 0; ; i++) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fs.writeFileSync(at, await res.text());
        break;
      } catch (e) {
        if (i === 4) throw new Error(`${url}: ${e.message}`);
        await sleep(2500 * (i + 1));
      }
    }
  }
  return JSON.parse(fs.readFileSync(at, "utf8"));
}
const entities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&eacute;/g, "é")
    .replace(/&[a-z]+;/g, "");
const plain = (v) => entities(String((v && typeof v === "object" ? v.text : v) ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const cut = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(" ", n - 1)) + "…" : s);

function loadCountries() {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

(async () => {
  const countries = loadCountries();

  // ── The Factbook ──
  const tree = await json("https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1", path.join(FACTBOOK, "tree.json"));
  const files = tree.tree.filter((x) => x.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(x.path)).map((x) => x.path.replace(/\.json$/, ""));
  const entry = (f) => json(`${REPO}/${f}.json`, path.join(FACTBOOK, f.replace("/", "__") + ".json"));
  const byTld = new Map();
  for (const f of files) {
    const m = /\.([a-z]{2})\b/.exec(plain((await entry(f)).Communications?.["Internet country code"]));
    if (!m) continue;
    const code = m[1].toUpperCase() === "UK" ? "GB" : m[1].toUpperCase();
    (byTld.get(code) || byTld.set(code, []).get(code)).push(f);
  }

  const sovereignty = {};
  const hazards = {};
  for (const c of countries) {
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    if (!p) continue;
    const j = await entry(p);
    const g = j.Government ?? {};
    const s = {};
    const put = (k, v, n = 420) => {
      const t = plain(v);
      if (t) s[k] = cut(t, n);
    };
    put("independence", g.Independence);
    put("dependency", g["Dependency status"]);
    put("dependentAreas", g["Dependent areas"]);
    put("constitution", g.Constitution?.history);
    put("amendment", g.Constitution?.["amendment process"], 520);
    put("internationalLaw", g["International law organization participation"]);
    const cz = g.Citizenship;
    if (cz && typeof cz === "object" && !cz.text) {
      const z = {};
      for (const [k, f] of [["birth", "citizenship by birth"], ["descent", "citizenship by descent only"], ["dual", "dual citizenship recognized"], ["residency", "residency requirement for naturalization"]]) {
        const t = plain(cz[f]);
        if (t) z[k] = cut(t, 200);
      }
      if (Object.keys(z).length) s.citizenship = z;
    } else put("citizenshipNote", cz, 200);
    // The bodies it takes part in, as the Factbook lists them: counted, and whether the UN is one.
    const orgs = plain(g["International organization participation"]);
    if (orgs && !/^none/i.test(orgs)) {
      const list = orgs.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
      s.organisations = list.length;
      s.un = list.includes("UN");
    }
    put("deployments", j["Military and Security"]?.["Military deployments"], 380);
    put("holiday", g["National holiday"], 200);
    if (Object.keys(s).length) sovereignty[c.code] = s;

    const h = plain(j.Geography?.["Natural hazards"]);
    if (h) hazards[c.code] = cut(h, 420);
  }
  const nSov = Object.keys(sovereignty).length;
  const nIndep = Object.values(sovereignty).filter((s) => s.independence).length;
  const nUn = Object.values(sovereignty).filter((s) => s.un).length;
  // The UN has 193 members; the site holds most of them. Far fewer means the list is no longer read right.
  if (nSov < 220 || nIndep < 190 || nUn < 185 || nUn > 195) throw new Error(`Factbook: ${nSov} places, ${nIndep} with an independence line, ${nUn} in the UN`);

  // ── The World Bank ──
  const wbCountries = (await json("https://api.worldbank.org/v2/country?format=json&per_page=400", path.join(CACHE, "wb-countries.json")))[1];
  const iso2 = Object.fromEntries(wbCountries.map((c) => [c.id, c.iso2Code]));
  const site = new Set(countries.map((c) => c.code));
  const safety = {};
  const world = {};
  for (const [k, spec] of Object.entries(SAFETY)) {
    const j = await json(`https://api.worldbank.org/v2/country/all/indicator/${spec.code}?format=json&per_page=20000&date=${OLDEST}:${THIS_YEAR}`, path.join(CACHE, `wb-${spec.code}.json`));
    if (j[0].pages !== 1) throw new Error(`World Bank ${spec.code}: more than one page`);
    world[k] = {};
    let n = 0;
    const latest = {};
    for (const r of j[1]) {
      if (r.value == null) continue;
      const y = Number(r.date), v = Number(Number(r.value).toFixed(spec.dp));
      if (r.countryiso3code === "WLD") world[k][y] = v;
      const code = iso2[r.countryiso3code];
      if (!code || !site.has(code)) continue;
      if (!latest[code] || y > latest[code][0]) latest[code] = [y, v];
    }
    for (const [code, f] of Object.entries(latest)) {
      (safety[code] ||= {})[k] = f;
      n++;
    }
    if (n < 100) throw new Error(`World Bank ${spec.code}: only ${n} countries`);
  }
  for (const [code, h] of Object.entries(hazards)) (safety[code] ||= {}).hazards = h;

  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  fs.writeFileSync(
    OUT,
    `/**
 * What the country window's Sovereignty and Safety reports stand on.
 *
 * GENERATED by build-country-reports.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Sovereignty is the CIA World Factbook's Government section, as written, in
 * its final edition (January 2026): a change of status since is not in it.
 * Safety is the death rates the WHO estimates and the IDMC's disaster
 * displacements, from the World Bank, each for its latest year, and the
 * Factbook's natural hazards. Nothing is computed.
 */
export const COUNTRY_REPORT_SOURCES = {
  factbook: { label: "CIA World Factbook, final edition (January 2026) — Government; Geography (public domain)", url: "https://github.com/factbook/factbook.json" },
  worldBank: { label: "World Bank — World Development Indicators (WHO Global Health Estimates; IDMC)", url: "https://data.worldbank.org/" },
  retrieved: "${today}",
};

export interface Sovereignty {
  /** The date of independence and from whom, as the Factbook words it. */
  independence?: string;
  /** For a place that is not independent: whose it is, and on what terms. */
  dependency?: string;
  /** The places it holds. */
  dependentAreas?: string;
  constitution?: string;
  amendment?: string;
  /** Whether it accepts the ICJ's and the ICC's jurisdiction. */
  internationalLaw?: string;
  citizenship?: { birth?: string; descent?: string; dual?: string; residency?: string };
  citizenshipNote?: string;
  /** How many international bodies the Factbook lists it as taking part in, and whether the United Nations is one. */
  organisations?: number;
  un?: boolean;
  /** Its forces abroad. */
  deployments?: string;
  holiday?: string;
}

/** Keyed by ISO 3166-1 alpha-2 code. */
export const SOVEREIGNTY: Record<string, Sovereignty> = {
${Object.entries(sovereignty).map(([code, s]) => `  ${code}: ${q(s)},`).join("\n")}
};

/** A figure and the year it is for. */
export type SafetyFigure = [year: number, value: number];
export type SafetyKey = ${Object.keys(SAFETY).map(q).join(" | ")};
export interface Safety extends Partial<Record<SafetyKey, SafetyFigure>> {
  /** Natural hazards, as the Factbook words them. */
  hazards?: string;
}

/** The World Bank's indicator behind each figure. */
export const SAFETY_INDICATORS: Record<SafetyKey, string> = ${q(Object.fromEntries(Object.entries(SAFETY).map(([k, s]) => [k, s.code])))};

/** The world's figure for each, by year, where the World Bank publishes one. */
export const SAFETY_WORLD: Record<SafetyKey, Record<number, number>> = ${q(world)};

/** Keyed by ISO 3166-1 alpha-2 code. */
export const SAFETY: Record<string, Safety> = {
${Object.entries(safety).map(([code, s]) => `  ${code}: ${q(s)},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  sovereignty: ${nSov} places; ${nIndep} with independence, ${nUn} UN members, ${Object.values(sovereignty).filter((s) => s.dependency).length} dependencies, ${Object.values(sovereignty).filter((s) => s.internationalLaw).length} with international law, ${Object.values(sovereignty).filter((s) => s.deployments).length} with deployments`);
  for (const k of Object.keys(SAFETY)) console.log(`  ${k.padEnd(20)} ${Object.values(safety).filter((s) => s[k]).length} countries; world years ${Object.keys(world[k]).join(",") || "none"}`);
  console.log(`  hazards: ${Object.keys(hazards).length}`);
  for (const code of ["JP", "PR", "US"]) console.log(`  ${code}:`, q(sovereignty[code]).slice(0, 700), q(safety[code]).slice(0, 300));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
