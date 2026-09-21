/**
 * build-budget.cjs
 *
 * Where each country's government spends its money: the share of total
 * government spending that goes to each of the ten functions of the UN's
 * Classification of the Functions of Government (COFOG) — defence, public
 * order and safety, education, health, social protection, economic affairs
 * (which includes transport and infrastructure), housing, environment,
 * culture, and general public services — plus total spending as a share of GDP.
 *
 * Source. IMF Government Finance Statistics, "Expenditure by Function of
 * Government" (IMF.STA, GFS_COFOG), through the IMF's SDMX 3.0 API:
 *   - INDICATOR GF01_T ... GF10_T, TYPE_OF_TRANSFORMATION POTO_PT: each
 *     function as a percent of total outlays, which is what a pie needs;
 *   - INDICATOR TOTOUT_T, POGDP_PT: total outlays as a percent of GDP.
 *
 * Which government. General government (S13) — central, state and local
 * together — is used wherever the IMF has a complete breakdown, because it is
 * the only basis that compares across federal and unitary countries: in the
 * US most education spending is state and local, and a central-government pie
 * would all but leave it out. Where only central government (S1311) is
 * complete, that is used and marked as such.
 *
 * Which year. The latest year with all ten functions reported, and nothing
 * older than ten years, as elsewhere in these builds. Where the functions do
 * not add to 100% of outlays — spending the country did not classify — the
 * remainder is kept as its own slice rather than spread across the others.
 *
 * Who is missing. Countries that do not report spending by function to the IMF
 * — India among them — have no entry, and the page says the figures are not
 * published rather than showing a guess.
 *
 *   node build-budget.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/countryBudget.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-imf-cofog");
fs.mkdirSync(CACHE, { recursive: true });

const API = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/GFS_COFOG/+";
const PAGE = "https://data.imf.org/Datasets/GFS_COFOG";
const DIVISIONS = ["GF01", "GF02", "GF03", "GF04", "GF05", "GF06", "GF07", "GF08", "GF09", "GF10"];
const OLDEST = new Date().getFullYear() - 10;

async function get(url, file, accept) {
  const at = path.join(CACHE, file);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const body = await res.text();
  fs.writeFileSync(at, body);
  return body;
}

/** country -> year -> indicator -> value, from an IMF SDMX CSV. */
function parse(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const H = lines[0].split(",");
  const ci = (n) => H.indexOf(n);
  const by = {};
  for (const l of lines.slice(1)) {
    const r = l.split(",");
    const v = r[ci("OBS_VALUE")];
    if (v === "") continue;
    const c = r[ci("COUNTRY")];
    const y = r[ci("TIME_PERIOD")];
    const ind = r[ci("INDICATOR")].replace(/_T$/, "");
    ((by[c] ??= {})[y] ??= {})[ind] = Number(v);
  }
  return by;
}

async function sector(code) {
  const shares = parse(
    await get(
      `${API}/*.${code}.G2MF.${DIVISIONS.map((d) => d + "_T").join("+")}.POTO_PT.A`,
      `cofog-${code}-shares.csv`,
      "application/vnd.sdmx.data+csv;version=2.0.0",
    ),
  );
  const total = parse(
    await get(
      `${API}/*.${code}.G2MF.TOTOUT_T.POGDP_PT.A`,
      `cofog-${code}-total.csv`,
      "application/vnd.sdmx.data+csv;version=2.0.0",
    ),
  );
  return { shares, total };
}

(async () => {
  // ISO3 -> ISO2, from the World Bank's country list (the site keys countries
  // by ISO2). Kosovo, the West Bank & Gaza and the Cook Islands are coded
  // differently by the two bodies or missing from the list, so they are set
  // by hand.
  const wb = JSON.parse(
    await get("https://api.worldbank.org/v2/country?format=json&per_page=400", "wb-countries.json", "application/json"),
  )[1];
  const iso2 = {};
  for (const c of wb) if (c.iso2Code && /^[A-Z]{2}$/.test(c.iso2Code)) iso2[c.id] = c.iso2Code;
  iso2.UVK = "XK";
  iso2.KOS = "XK";
  iso2.WBG = "PS";
  iso2.COK = "CK"; // not a World Bank member, so absent from its list

  const gg = await sector("S13");
  const cg = await sector("S1311");

  const pick = (by, c) => {
    const years = Object.keys(by[c] ?? {})
      .map(Number)
      .filter((y) => y >= OLDEST)
      .sort((a, b) => b - a);
    const y = years.find((yr) => DIVISIONS.every((d) => by[c][yr][d] !== undefined));
    return y ? { y, row: by[c][y] } : null;
  };

  const out = {};
  const skipped = [];
  for (const c of new Set([...Object.keys(gg.shares), ...Object.keys(cg.shares)])) {
    const code = iso2[c];
    if (!code) {
      skipped.push(c);
      continue;
    }
    let basis = "general";
    let got = pick(gg.shares, c);
    let total = gg.total;
    if (!got) {
      got = pick(cg.shares, c);
      basis = "central";
      total = cg.total;
    }
    if (!got) continue;
    const shares = {};
    for (const d of DIVISIONS) shares[d] = Math.round(got.row[d] * 10) / 10;
    const sum = DIVISIONS.reduce((a, d) => a + got.row[d], 0);
    const unclassified = Math.round((100 - sum) * 10) / 10;
    const pctGdp = total[c]?.[got.y]?.TOTOUT;
    out[code] = {
      iso3: c,
      y: String(got.y),
      basis,
      shares,
      // Only kept when it is a real remainder, not rounding.
      ...(unclassified > 1 ? { unclassified } : {}),
      ...(pctGdp !== undefined ? { spendingPctGdp: Math.round(pctGdp * 10) / 10 } : {}),
    };
  }

  const n = Object.keys(out).length;
  if (n < 60) throw new Error(`only ${n} countries — has the API changed?`);

  const retrieved = new Date().toISOString().slice(0, 10);
  const body = `/**
 * Government spending by function (COFOG), per country, keyed by ISO2 code.
 *
 * GENERATED by build-budget.cjs on ${retrieved} — do not edit by hand; change
 * the script and re-run it. See that script for the source and method.
 */

export type BudgetDivision =
  | "GF01" | "GF02" | "GF03" | "GF04" | "GF05"
  | "GF06" | "GF07" | "GF08" | "GF09" | "GF10";

/** The ten COFOG functions, in the order the classification numbers them. */
export const BUDGET_DIVISIONS: { id: BudgetDivision; label: string }[] = [
  { id: "GF01", label: "General public services" },
  { id: "GF02", label: "Defence" },
  { id: "GF03", label: "Public order & safety" },
  { id: "GF04", label: "Economic affairs & infrastructure" },
  { id: "GF05", label: "Environmental protection" },
  { id: "GF06", label: "Housing & community" },
  { id: "GF07", label: "Health" },
  { id: "GF08", label: "Recreation, culture & religion" },
  { id: "GF09", label: "Education" },
  { id: "GF10", label: "Social protection" },
];

export interface CountryBudget {
  /** ISO 3166 alpha-3, as the IMF codes it. */
  iso3: string;
  y: string;
  /** "general": central, state and local government; "central": central only. */
  basis: "general" | "central";
  /** Each function as a percent of total government outlays. */
  shares: Record<BudgetDivision, number>;
  /** Outlays not classified by function, in percent, where material. */
  unclassified?: number;
  /** Total government outlays as a percent of GDP, same year and basis. */
  spendingPctGdp?: number;
}

export const BUDGET_SOURCE = {
  label: "IMF — Government Finance Statistics, expenditure by function (COFOG)",
  url: ${JSON.stringify(PAGE)},
};
export const BUDGET_RETRIEVED = ${JSON.stringify(retrieved)};

export const COUNTRY_BUDGET: Record<string, CountryBudget> = ${JSON.stringify(out, null, 2)};

/** The same, keyed by ISO alpha-3 — for pages, like Economies, that key by it. */
export const COUNTRY_BUDGET_BY_ISO3: Record<string, CountryBudget> = Object.fromEntries(
  Object.values(COUNTRY_BUDGET).map((b) => [b.iso3, b]),
);
`;
  fs.writeFileSync(OUT, body);
  const general = Object.values(out).filter((o) => o.basis === "general").length;
  console.log(`wrote ${OUT}: ${n} countries (${general} general government, ${n - general} central only)`);
  if (skipped.length) console.log(`  no ISO2 for: ${skipped.join(" ")}`);
  for (const c of ["US", "DE", "GB", "JP", "CN", "BR"]) {
    const o = out[c];
    if (o) console.log(`  ${c} ${o.y} ${o.basis}: defence ${o.shares.GF02}%, health ${o.shares.GF07}%, education ${o.shares.GF09}%, social ${o.shares.GF10}%, spending ${o.spendingPctGdp ?? "?"}% of GDP`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
