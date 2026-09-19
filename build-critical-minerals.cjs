/**
 * Builds src/data/criticalMinerals.ts — reserves and mine production of the
 * critical minerals, per economy, from the USGS Mineral Commodity Summaries.
 *
 * What it replaces. The Economies page held a hand-written table giving each
 * economy reserves of neodymium, dysprosium, lanthanum and cerium separately -
 * the United States at 1,400 kt, 180 kt, 900 kt and 2,100 kt. USGS does not
 * publish rare earths by element for any country; its own end-use table files
 * every individual rare earth as "Included in the Rare Earths chapter", which
 * reports one aggregate. The United States' aggregate is 1.9 million tonnes,
 * less than half of what those four invented splits summed to. Lithium was
 * given as 9.8 million tonnes against USGS's 4.4. Every economy without an
 * entry was also handed a generic default list, as though it were its own.
 *
 * Source: USGS, Mineral Commodity Summaries 2026 data release (ScienceBase),
 * the "Commodity Salient U.S. and World Statistics" table, 2025 figures. End
 * uses come from the same release's critical-minerals end-use table, in USGS's
 * words.
 *
 * Three things this is careful about, because each would otherwise put a wrong
 * number on the page:
 *
 *   Units are read per row. Copper and manganese are published in thousands of
 *   tonnes, gallium and the platinum metals in kilograms. Everything is
 *   converted to tonnes before it is compared.
 *
 *   Some world totals are lower bounds - rare earths ">85,000,000", nickel
 *   ">140,000,000". Dividing a country's figure by a minimum overstates its
 *   share, so a share computed that way is an upper bound and is marked "at
 *   most". Where the country's own figure is a lower bound the share is marked
 *   "at least". Where both are, no share is given at all.
 *
 *   USGS withholds some figures ("W") to protect company data and leaves others
 *   unreported ("NA"). Neither is treated as zero. A mineral appears for an
 *   economy only where USGS reports a real reserve or production figure.
 *
 * "Net exporter" is not carried. USGS does not publish a net trade position for
 * other countries, so rather than guess one, each mineral says whether the
 * economy mines it or only holds reserves.
 *
 *   node build-critical-minerals.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/criticalMinerals.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-critical-minerals");
fs.mkdirSync(CACHE, { recursive: true });

const RELEASE_ID = "696a75d5d4be0228872d3bf8"; // Mineral Commodity Summaries 2026 Data Release
const DATA_FILE = "MCS2026_Commodities_Data.csv";
const USE_FILE = "MCS2026_T6_Critical_Minerals_End_Use.csv";
const YEAR = "2025";

/**
 * The minerals shown, by USGS commodity name, with the short symbol the page
 * prints and the name to look up in USGS's end-use table.
 *
 * Chosen because USGS reports both reserves and mine production for them at
 * country level. Gallium, germanium and the platinum metals are left out: USGS
 * gives production for some and reserves for others, in kilograms, and a row
 * that can only ever be half filled is worse than no row.
 */
const MINERALS = [
  { usgs: "Rare Earths", symbol: "REE", use: null },
  { usgs: "Lithium", symbol: "Li", use: "Lithium" },
  { usgs: "Cobalt", symbol: "Co", use: "Cobalt" },
  { usgs: "Nickel", symbol: "Ni", use: "Nickel" },
  { usgs: "Graphite (Natural)", symbol: "C", use: "Graphite" },
  { usgs: "Manganese", symbol: "Mn", use: "Manganese" },
  { usgs: "Copper", symbol: "Cu", use: "Copper" },
  { usgs: "Tungsten", symbol: "W", use: "Tungsten" },
  { usgs: "Tin", symbol: "Sn", use: "Tin" },
  { usgs: "Antimony", symbol: "Sb", use: "Antimony" },
  { usgs: "Vanadium", symbol: "V", use: "Vanadium" },
];

/** USGS's name for a country, where it differs from the site's. */
const USGS_ALIAS = {
  Burma: "Myanmar",
  "Congo (Kinshasa)": "Democratic Republic of the Congo",
  "Congo (Brazzaville)": "Republic of the Congo",
  "Korea, Republic of": "South Korea",
  "Korea, North": "North Korea",
  Russia: "Russia",
  "United States": "United States",
  "Cote d'Ivoire": "Ivory Coast",
};

function parseCsv(text) {
  const rows = [];
  let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift().map((x) => x.trim());
  return rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? "").trim()])));
}

async function releaseFile(name) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return fs.readFileSync(at, "latin1");
  const meta = await (await fetch(`https://www.sciencebase.gov/catalog/item/${RELEASE_ID}?format=json`, { headers: { "User-Agent": UA } })).json();
  const file = (meta.files || []).find((x) => x.name === name);
  if (!file) throw new Error(`USGS release has no file named ${name}`);
  const res = await fetch(file.url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(at, buf);
  return buf.toString("latin1");
}

/**
 * A USGS value, in tonnes, with whether it is exact or a lower bound.
 * Returns null for withheld (W), not available (NA) and blank.
 */
function reading(raw, unit) {
  const s = String(raw || "").trim();
  if (!s || /^(W|NA|--?|—|XX)$/i.test(s)) return null;
  const lowerBound = s.startsWith(">");
  const n = Number(s.replace(/^[><]\s*/, "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  const u = String(unit || "").toLowerCase();
  let tonnes;
  if (/thousand metric tons/.test(u)) tonnes = n * 1000;
  else if (/kilograms/.test(u)) tonnes = n / 1000;
  else if (/metric tons/.test(u)) tonnes = n;
  else return null; // a unit this script does not know how to read
  return { tonnes, lowerBound };
}

function loadEconomies() {
  const bundle = path.join(CACHE, "economiesData.cjs");
  execSync(
    `npx esbuild src/data/economiesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`,
    { cwd: __dirname, stdio: "inherit" },
  );
  delete require.cache[bundle];
  return require(bundle).economiesData;
}

(async () => {
  const economies = loadEconomies();
  const byName = new Map(economies.map((e) => [e.name.toLowerCase(), e]));
  const rows = parseCsv(await releaseFile(DATA_FILE));
  const uses = new Map(parseCsv(await releaseFile(USE_FILE)).map((r) => [r.Critical_Mineral, r.Primary_Applications]));

  const world = rows.filter((r) => /World/i.test(r.Section) && !/Salient Statistics/i.test(r.Section) && r.Year === YEAR);

  const perEconomy = {};
  const unmatched = new Set();
  const report = [];
  /** Per mineral, the country that mines the largest share of it. */
  const concentration = [];

  for (const m of MINERALS) {
    const mine = world.filter((r) => r.Commodity === m.usgs);
    /* Which rows count. For production that is mine production only: copper
       and cobalt also carry refinery rows, and taking whichever came first
       could divide a country's refinery output by the world's mine output. */
    const detailOk = (kind, r) =>
      kind === "Production" ? /^Mine production/i.test(r.Statistics_detail) : true;
    // Prefer the unrounded statistic where USGS gives both.
    const pickStat = (kind, country) => {
      const cand = mine.filter(
        (r) => r.Country === country && new RegExp(`^${kind}$`, "i").test(r.Statistics) && detailOk(kind, r),
      );
      return cand.find((r) => !/rounded/i.test(r.Statistics_detail)) ?? cand[0] ?? null;
    };
    const totalRow = (kind) => {
      const cand = mine.filter(
        (r) => /World total/i.test(r.Country) && new RegExp(`^${kind}$`, "i").test(r.Statistics) && detailOk(kind, r),
      );
      return cand.find((r) => !/rounded/i.test(r.Statistics_detail)) ?? cand[0] ?? null;
    };
    let worldRes = totalRow("Reserves") ? reading(totalRow("Reserves").Value, totalRow("Reserves").Unit) : null;
    const worldProd = totalRow("Production") ? reading(totalRow("Production").Value, totalRow("Production").Unit) : null;

    /* Reserves smaller than a single year's world output cannot be right. It
       is what a unit mislabelled in the data release looks like: vanadium's
       reserves are marked "metric tons" but give the United States 50 and
       the world 21,000, against 110,000 tonnes mined in a year - the printed
       tables carry them in thousands. Reinterpreting a source's stated unit
       would be guessing, so the reserves are dropped for that mineral, and
       reported, rather than published wrong. Production is unaffected. */
    let reservesUnreliable = false;
    if (worldRes && worldProd && !worldRes.lowerBound && worldRes.tonnes < worldProd.tonnes) {
      reservesUnreliable = true;
      worldRes = null;
    }

    const countries = [...new Set(mine.map((r) => r.Country))].filter((c) => c && !/World total|Other countries/i.test(c));

    /* The most concentrated supply, computed rather than written. The page's
       callouts had China at "~60%" of rare-earth mining, Brazil at "~92%" of
       niobium reserves and India holding the largest thorium reserves; against
       this same release those are 69%, at most 67%, and a figure USGS does not
       publish. Deriving the callouts from the data keeps them from drifting. */
    if (worldProd && !worldProd.lowerBound && worldProd.tonnes > 0) {
      let top = null;
      for (const country of countries) {
        const row = pickStat("Production", country);
        const p = row ? reading(row.Value, row.Unit) : null;
        if (!p || p.lowerBound) continue;
        if (!top || p.tonnes > top.tonnes) top = { country, tonnes: p.tonnes };
      }
      if (top) {
        concentration.push({
          mineral: m.usgs === "Graphite (Natural)" ? "Graphite" : m.usgs,
          country: USGS_ALIAS[top.country] ?? top.country,
          pct: +((top.tonnes / worldProd.tonnes) * 100).toFixed(0),
          tonnes: top.tonnes,
          worldTonnes: worldProd.tonnes,
        });
      }
    }

    let placed = 0;
    for (const country of countries) {
      const siteName = USGS_ALIAS[country] ?? country;
      const econ = byName.get(siteName.toLowerCase());
      const res = pickStat("Reserves", country);
      const prod = pickStat("Production", country);
      const r = res && !reservesUnreliable ? reading(res.Value, res.Unit) : null;
      const p = prod ? reading(prod.Value, prod.Unit) : null;
      if (!r && !p) continue;
      if (!econ) { unmatched.add(country); continue; }

      /* Share of the world total, stated as exactly as the inputs allow. */
      const share = (part, whole) => {
        if (!part || !whole || whole.tonnes <= 0) return null;
        if (part.lowerBound && whole.lowerBound) return null; // cannot be bounded
        const pct = (part.tonnes / whole.tonnes) * 100;
        return { pct: pct >= 1 ? +pct.toFixed(1) : +pct.toFixed(2), bound: whole.lowerBound ? "atMost" : part.lowerBound ? "atLeast" : "exact" };
      };

      (perEconomy[econ.id] ||= []).push({
        name: m.usgs === "Graphite (Natural)" ? "Graphite" : m.usgs,
        symbol: m.symbol,
        use: m.use ? (uses.get(m.use) ?? null) : "Seventeen elements, which USGS reports together; their uses vary by element.",
        reserves: r ? { tonnes: r.tonnes, lowerBound: r.lowerBound } : null,
        production: p ? { tonnes: p.tonnes, lowerBound: p.lowerBound } : null,
        reserveShare: share(r, worldRes),
        productionShare: share(p, worldProd),
      });
      placed++;
    }
    report.push({ mineral: m.usgs, placed, worldRes, worldProd, reservesUnreliable });
  }

  // Order each economy's list by how much of the world's production it holds.
  for (const list of Object.values(perEconomy)) {
    list.sort((a, b) => (b.productionShare?.pct ?? -1) - (a.productionShare?.pct ?? -1) || (b.reserveShare?.pct ?? -1) - (a.reserveShare?.pct ?? -1));
  }

  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  const body = Object.entries(perEconomy)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, list]) => `  ${q(id)}: ${q(list)},`)
    .join("\n");

  fs.writeFileSync(
    OUT,
    `/**
 * Critical-mineral reserves and mine production per economy.
 *
 * GENERATED by build-critical-minerals.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Source: USGS, Mineral Commodity Summaries 2026 data release, ${YEAR} figures.
 * USGS gives the current year as an estimate, and revises it in the next
 * edition. End uses are USGS's own wording from the same release.
 *
 * Rare earths are one aggregate, as USGS reports them. It does not publish
 * reserves for individual rare-earth elements by country, so none are given.
 *
 * Where a mineral's world reserves come out smaller than one year's world
 * production, its reserves are left out: that is a unit mislabelled in the data
 * release, not a real figure, and it is not reinterpreted here.
 *
 * Shares are of USGS's world total. Where that total is a lower bound (">") a
 * share is an upper bound and is marked atMost; where the country's own figure
 * is a lower bound, atLeast. Withheld and unreported figures are absent, never
 * zero.
 */
export const CRITICAL_MINERALS_SOURCE = {
  label: "USGS — Mineral Commodity Summaries 2026",
  url: "https://doi.org/10.3133/mcs2026",
  dataUrl: "https://www.sciencebase.gov/catalog/item/${RELEASE_ID}",
  year: "${YEAR}",
  retrieved: "${today}",
};

export type Amount = { tonnes: number; lowerBound: boolean };
export type Share = { pct: number; bound: "exact" | "atMost" | "atLeast" };

export interface CriticalMineral {
  name: string;
  symbol: string;
  /** USGS's description of what it is mainly used for. */
  use: string | null;
  reserves: Amount | null;
  production: Amount | null;
  reserveShare: Share | null;
  productionShare: Share | null;
}

export const CRITICAL_MINERALS: Record<string, CriticalMineral[]> = {
${body}
};

/**
 * For each mineral, the one country that mines the largest share of world
 * output in ${YEAR}, most concentrated first. Taken across every country USGS
 * lists, including those without a card on the Economies page. Only minerals
 * whose world production is an exact figure are included, since a share of a
 * lower bound would overstate it.
 */
export interface SupplyConcentration {
  mineral: string;
  country: string;
  pct: number;
  tonnes: number;
  worldTonnes: number;
}

export const SUPPLY_CONCENTRATION: SupplyConcentration[] = ${JSON.stringify(
    concentration.sort((a, b) => b.pct - a.pct),
    null,
    2,
  )};
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(perEconomy).length} economies`);
  for (const r of report) {
    const w = (x) => (x ? (x.lowerBound ? ">" : "") + Math.round(x.tonnes).toLocaleString() + " t" : "—");
    console.log(`  ${r.mineral.padEnd(20)} ${String(r.placed).padStart(3)} economies   world reserves ${w(r.worldRes).padStart(16)}   world production ${w(r.worldProd)}` +
      (r.reservesUnreliable ? "   RESERVES DROPPED: smaller than one year's output, so the release's unit is wrong" : ""));
  }
  console.log("\n  most concentrated supply:");
  for (const c of [...concentration].sort((a, b) => b.pct - a.pct).slice(0, 6))
    console.log(`    ${c.mineral.padEnd(14)} ${c.country.padEnd(34)} ${c.pct}% of world mine production`);
  if (unmatched.size) console.log(`\n  USGS countries not on the Economies page (skipped, not guessed): ${[...unmatched].sort().join(", ")}`);
})().catch((e) => { console.error(e); process.exit(1); });
