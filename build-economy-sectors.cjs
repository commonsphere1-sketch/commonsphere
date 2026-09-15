/**
 * Builds src/data/economySectors.ts — the GDP composition the Economies page
 * charts, from the World Bank's national accounts.
 *
 * What it replaces was written by hand and did not hold together. Sixty-one of
 * the seventy-seven economies had sector shares that did not sum to 100 - China
 * 127%, Germany 122%, Mexico 120% - and fifteen listed a sector beside one of
 * its own sub-sectors, "Services" next to "Finance" or "Industry" next to
 * "Manufacturing". A pie normalises whatever it is given, so every slice drawn
 * from those numbers was a share of a total no source reports.
 *
 * The three shares here partition value added, by the World Bank's own
 * definitions:
 *
 *   NV.AGR.TOTL.ZS  agriculture, forestry, fishing   ISIC rev.4 01-03
 *   NV.IND.TOTL.ZS  industry including construction  ISIC rev.4 05-43
 *   NV.SRV.TOTL.ZS  services                         ISIC rev.4 45-99
 *
 * Industry "is comprised of mining, manufacturing, construction, electricity,
 * water, and gas", and services "includes ... financial intermediation", both
 * quoted from those definitions. So manufacturing and finance are parts of
 * those sectors, never siblings of them. Manufacturing (NV.IND.MANF.ZS) is
 * carried separately as an "of which" figure and is never given a slice.
 *
 * The three are percentages of GDP, while value added is measured at basic
 * prices and GDP at purchaser prices, so they sum to somewhat less than 100.
 * The remainder is taxes less subsidies on products, plus any statistical
 * discrepancy, and it is written out as its own field rather than quietly
 * scaled away - scaling it away would misstate every other share.
 *
 * All four figures for an economy come from the same year: the most recent year
 * the World Bank reports all three core shares for. Mixing years across slices
 * of one pie would invent a composition that never existed.
 *
 *   node build-economy-sectors.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/economySectors.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-economy-sectors");
fs.mkdirSync(CACHE, { recursive: true });

const INDICATORS = {
  agriculture: "NV.AGR.TOTL.ZS",
  industry: "NV.IND.TOTL.ZS",
  services: "NV.SRV.TOTL.ZS",
  manufacturing: "NV.IND.MANF.ZS",
};

/**
 * Where the site's name for an economy differs from the World Bank's. Each is
 * the World Bank's own code, not a guess at its spelling; anything not listed
 * has to match by name exactly or the build reports it.
 */
const ALIAS = {
  "United States": "USA",
  "South Korea": "KOR",
  Russia: "RUS",
  Turkey: "TUR",
  Egypt: "EGY",
  Iran: "IRN",
  Venezuela: "VEN",
  Vietnam: "VNM",
  Slovakia: "SVK",
  "Hong Kong": "HKG",
  "European Union": "EUU",
  Czechia: "CZE",
  Laos: "LAO",
  Syria: "SYR",
  Brunei: "BRN",
  "Cape Verde": "CPV",
  "Ivory Coast": "CIV",
  "Democratic Republic of the Congo": "COD",
  "Republic of the Congo": "COG",
  Gambia: "GMB",
  Bahamas: "BHS",
  Kyrgyzstan: "KGZ",
  Moldova: "MDA",
  "North Macedonia": "MKD",
  Yemen: "YEM",
  Micronesia: "FSM",
  "Saint Lucia": "LCA",
};

function loadEconomies() {
  const bundle = path.join(CACHE, "economiesData.cjs");
  execSync(
    `npx esbuild src/data/economiesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).economiesData;
}

async function fetchIndicator(code) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=12&per_page=25000`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || !json[1]) throw new Error(`${code}: no rows`);
  // code -> year -> value
  const by = new Map();
  for (const row of json[1]) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    if (!/^\d{4}$/.test(String(row.date))) continue;
    const id = row.countryiso3code || row.country.id;
    if (!id) continue;
    if (!by.has(id)) by.set(id, new Map());
    by.get(id).set(String(row.date), row.value);
  }
  return by;
}

(async () => {
  const economies = loadEconomies();

  // The World Bank's own list, so names are matched against what it publishes.
  const cRes = await fetch("https://api.worldbank.org/v2/country?format=json&per_page=500", { headers: { "User-Agent": UA } });
  const cJson = await cRes.json();
  const byName = new Map();
  for (const c of cJson[1] || []) byName.set(c.name.toLowerCase(), c.id);

  const series = {};
  for (const [key, code] of Object.entries(INDICATORS)) series[key] = await fetchIndicator(code);

  const resolved = [];
  const unmatched = [];
  const noData = [];

  for (const e of economies) {
    const code = ALIAS[e.name] ?? byName.get(e.name.toLowerCase());
    if (!code) { unmatched.push(e.name); continue; }

    const agr = series.agriculture.get(code);
    const ind = series.industry.get(code);
    const srv = series.services.get(code);
    if (!agr || !ind || !srv) { noData.push(`${e.name} (${code})`); continue; }

    // The newest year all three are reported for, so one pie is one year.
    const years = [...agr.keys()].filter((y) => ind.has(y) && srv.has(y)).sort((a, b) => +b - +a);
    if (!years.length) { noData.push(`${e.name} (${code}, no common year)`); continue; }
    const year = years[0];

    const a = agr.get(year), i = ind.get(year), s = srv.get(year);
    const manu = series.manufacturing.get(code)?.get(year) ?? null;
    const residual = 100 - (a + i + s);

    /* Normally the three shares fall short of 100 and the gap is taxes less
       subsidies on products - a real part of GDP, so it gets a slice.

       In a few economies the gap is negative: subsidies on products exceed
       taxes on them, so value added at basic prices comes to more than GDP at
       purchaser prices. Kuwait reports 114.2%. A pie cannot draw a negative
       part, and quietly dropping it would leave three slices whose labels add
       to more than the whole. Those are charted as shares of value added
       instead, which is a total that does exist, and the basis is recorded so
       the page can say which it is showing. */
    const onGdp = residual >= 0;
    const parts = onGdp
      ? [
          ["Agriculture", a],
          ["Industry", i],
          ["Services", s],
          ["Taxes less subsidies", residual],
        ]
      : [
          ["Agriculture", a],
          ["Industry", i],
          ["Services", s],
        ];

    /* Round to one decimal and give the rounding error to the largest slice,
       so the printed numbers add to exactly 100 and match the geometry. */
    const total = parts.reduce((n, [, v]) => n + v, 0);
    const scaled = parts.map(([n, v]) => [n, (v / total) * 100]);
    const rounded = scaled.map(([n, v]) => [n, Math.round(v * 10) / 10]);
    const drift = +(100 - rounded.reduce((n, [, v]) => n + v, 0)).toFixed(1);
    if (drift !== 0) {
      let big = 0;
      for (let k = 1; k < rounded.length; k++) if (rounded[k][1] > rounded[big][1]) big = k;
      rounded[big][1] = +(rounded[big][1] + drift).toFixed(1);
    }

    resolved.push({
      id: e.id,
      name: e.name,
      code,
      year,
      basis: onGdp ? "gdp" : "valueAdded",
      slices: rounded.map(([n, v]) => ({ name: n, pct: v })),
      manufacturing: manu === null ? null : +manu.toFixed(1),
    });
  }

  resolved.sort((x, y) => x.name.localeCompare(y.name));
  const today = new Date().toISOString().slice(0, 10);
  const rows = resolved
    .map(
      (r) =>
        `  "${r.id}": {\n` +
        `    name: ${JSON.stringify(r.name)}, code: "${r.code}", year: "${r.year}", basis: "${r.basis}",\n` +
        `    manufacturing: ${r.manufacturing === null ? "null" : r.manufacturing},\n` +
        `    slices: [${r.slices.map((x) => `{ name: ${JSON.stringify(x.name)}, pct: ${x.pct} }`).join(", ")}],\n` +
        `  },`,
    )
    .join("\n");

  const years = [...new Set(resolved.map((r) => r.year))].sort();
  fs.writeFileSync(
    OUT,
    `/**
 * GDP composition by sector, per economy.
 *
 * GENERATED by build-economy-sectors.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Three shares that partition value added, from the World Bank's national
 * accounts, all four figures for an economy taken from the same year:
 *
 *   agriculture    NV.AGR.TOTL.ZS   ISIC rev.4 01-03
 *   industry       NV.IND.TOTL.ZS   ISIC rev.4 05-43, including construction
 *   services       NV.SRV.TOTL.ZS   ISIC rev.4 45-99
 *
 * \`manufacturing\` (NV.IND.MANF.ZS) is part of industry, not a fourth sector —
 * the World Bank's definition has industry "comprised of mining, manufacturing,
 * construction, electricity, water, and gas". It is here to be quoted as an
 * "of which" figure and must never be given a slice of its own. Finance is
 * likewise inside services, whose definition covers "financial intermediation".
 *
 * \`other\` is what is left of GDP once the three are counted: taxes less
 * subsidies on products, plus any statistical discrepancy, arising because
 * value added is measured at basic prices and GDP at purchaser prices. It is
 * kept rather than scaled away, because scaling it away would overstate every
 * other share.
 *
 * ${resolved.length} of the ${economies.length} economies on the page have a figure${years.length === 1 ? `, all from ${years[0]}` : `; years ${years.join(", ")}`}.
 */
export const ECONOMY_SECTORS_SOURCE = {
  label: "World Bank — national accounts, value added by sector (% of GDP)",
  url: "https://data.worldbank.org/indicator/NV.AGR.TOTL.ZS",
  retrieved: "${today}",
};

export type EconomySectors = {
  name: string;
  /** World Bank entity code the figures were read from. */
  code: string;
  year: string;
  /**
   * What the slices are shares of. "gdp" is the usual case, and the slices
   * include taxes less subsidies on products. "valueAdded" is used where
   * subsidies on products exceed taxes, so value added comes to more than GDP
   * and there is no positive remainder to draw.
   */
  basis: "gdp" | "valueAdded";
  /** Sums to exactly 100, so each slice's size is the number printed on it. */
  slices: { name: string; pct: number }[];
  /** Part of the industry slice, never a slice of its own. Percent of GDP. */
  manufacturing: number | null;
};

/** Keyed by the economy id used in economiesData.ts. */
export const ECONOMY_SECTORS: Record<string, EconomySectors> = {
${rows}
};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  ${resolved.length} of ${economies.length} economies; years ${years.join(", ")}`);
  if (unmatched.length) console.log(`  no World Bank entity (${unmatched.length}): ${unmatched.join(", ")}`);
  if (noData.length) console.log(`  matched but no figures (${noData.length}): ${noData.join(", ")}`);
  const worst = Math.max(
    ...resolved.map((r) => Math.abs(r.slices.reduce((n, x) => n + x.pct, 0) - 100)),
  );
  const va = resolved.filter((r) => r.basis === "valueAdded");
  console.log(`  every pie sums to 100 within ${worst.toFixed(2)} points`);
  console.log(`  charted on GDP: ${resolved.length - va.length}; on value added: ${va.length}${va.length ? ` (${va.map((r) => r.name).join(", ")})` : ""}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
