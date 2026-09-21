/**
 * build-resource-producers.cjs
 *
 * For each commodity card on the Economies page that USGS covers: every
 * country USGS lists, with its 2025 mine (or smelter) production, its
 * reserves, and each as a share of the world. Written to
 * src/data/resourceProducers.ts.
 *
 * Source: USGS, Mineral Commodity Summaries 2026 data release (ScienceBase),
 * the world tables — the same file build-critical-minerals.cjs reads, and
 * read the same way:
 *
 *   Units per row. Copper, iron ore and aluminum are in thousand (iron ore
 *   reserves in million) metric tons; everything is converted to tonnes.
 *
 *   Withheld ("W") and unavailable ("NA") are not zero. A country with a
 *   withheld figure is listed with that figure absent — the United States'
 *   lithium output is withheld to protect company data, and "0" would say
 *   it produces none.
 *
 *   Lower bounds stay lower bounds. Where USGS gives a world total as ">", a
 *   share of it is an upper bound and is marked so.
 *
 * "Other countries" and "World total" are kept apart from the country list.
 *
 * Which measure. Mine production and reserves, except aluminum, which is a
 * refined metal: USGS reports it as smelter production, with no reserves —
 * the reserves are bauxite, a different commodity. Iron ore is usable ore for
 * production and crude ore for reserves, USGS's headline pair.
 *
 * Crude oil, natural gas, coal, uranium and wheat are not in the Mineral
 * Commodity Summaries and are built from their own sources separately.
 *
 *   node build-resource-producers.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/resourceProducers.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-critical-minerals");
fs.mkdirSync(CACHE, { recursive: true });

const RELEASE_ID = "696a75d5d4be0228872d3bf8"; // Mineral Commodity Summaries 2026 Data Release
const DATA_FILE = "MCS2026_Commodities_Data.csv";
const YEAR = "2025";

/** Card name on the page -> USGS chapter and the statistics that answer it. */
const CARDS = [
  { card: "Copper", chapter: "COPPER", production: "Mine production", reserves: "Reserves", measure: "Mine production" },
  { card: "Lithium", chapter: "LITHIUM", production: "Mine production", reserves: "Reserves", measure: "Mine production (lithium content)" },
  { card: "Rare Earth", chapter: "RARE EARTHS", production: "Mine production", reserves: "Reserves", measure: "Mine production (rare-earth oxide equivalent)" },
  {
    card: "Iron Ore",
    chapter: "IRON ORE",
    production: "Mine production: Usable ore",
    reserves: "Reserves (million metric tons): Crude ore",
    measure: "Mine production (usable ore); reserves as crude ore",
  },
  { card: "Gold", chapter: "GOLD", production: "Mine production", reserves: "Reserves", measure: "Mine production" },
  { card: "Silver", chapter: "SILVER", production: "Mine production", reserves: "Reserves", measure: "Mine production" },
  { card: "Aluminum", chapter: "ALUMINUM", production: "Smelter production", reserves: null, measure: "Smelter production (primary aluminum)" },
];

/** USGS's name for a country, where the site uses another. */
const ALIAS = {
  Burma: "Myanmar",
  "Congo (Kinshasa)": "DR Congo",
  "Congo (Brazzaville)": "Republic of the Congo",
  "Korea, Republic of": "South Korea",
  "Korea, North": "North Korea",
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

/** A USGS value in tonnes, or null for withheld / unavailable / blank. */
function reading(raw, unit) {
  const s = String(raw || "").trim();
  if (!s || /^(W|NA|--?|—|XX)$/i.test(s)) return null;
  const lowerBound = s.startsWith(">");
  const n = Number(s.replace(/^[><]\s*/, "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  const u = String(unit || "").toLowerCase();
  let tonnes;
  if (/million metric (dry )?tons/.test(u)) tonnes = n * 1e6;
  else if (/thousand metric (dry )?tons/.test(u)) tonnes = n * 1000;
  else if (/kilograms/.test(u)) tonnes = n / 1000;
  else if (/metric tons/.test(u)) tonnes = n;
  else return null;
  return { tonnes, lowerBound };
}

(async () => {
  const rows = parseCsv(await releaseFile(DATA_FILE));
  const world = rows.filter(
    (r) => /World/i.test(r.Section) && !/Salient Statistics/i.test(r.Section) && r.Year === YEAR,
  );

  const out = {};
  for (const spec of CARDS) {
    const rs = world.filter((r) => r["MCS chapter"] === spec.chapter);
    const stat = (name) => rs.filter((r) => r.Statistics_detail === name);
    const totalOf = (name) => {
      const t = rs.find((r) => r.Country === "World total" && r.Statistics_detail === `${name}: rounded`) ||
        rs.find((r) => r.Country === "World total" && r.Statistics_detail === name) ||
        rs.find((r) => r.Country === "World total" && r.Statistics_detail === name.replace(/(\w)$/, "$1, rounded"));
      return t ? reading(t.Value, t.Unit) : null;
    };
    // Iron ore's rounded rows are "Usable ore, rounded" rather than ": rounded".
    const worldTotal = (name) =>
      totalOf(name) ||
      (() => {
        const t = rs.find((r) => r.Country === "World total" && r.Statistics_detail === `${name}, rounded`);
        return t ? reading(t.Value, t.Unit) : null;
      })();

    const prodWorld = worldTotal(spec.production);
    const resWorld = spec.reserves ? worldTotal(spec.reserves) : null;

    const share = (v, w) => {
      if (!v || !w || w.tonnes <= 0) return null;
      const pct = Math.round((v.tonnes / w.tonnes) * 1000) / 10;
      return { pct, bound: w.lowerBound ? "atMost" : v.lowerBound ? "atLeast" : "exact" };
    };

    const countries = new Map();
    for (const r of stat(spec.production)) {
      if (/^(World total|Other countries)$/.test(r.Country)) continue;
      const name = ALIAS[r.Country] || r.Country;
      countries.set(name, { name, production: reading(r.Value, r.Unit), withheld: /^W$/i.test(r.Value.trim()) });
    }
    if (spec.reserves) {
      for (const r of stat(spec.reserves)) {
        if (/^(World total|Other countries)$/.test(r.Country)) continue;
        const name = ALIAS[r.Country] || r.Country;
        const c = countries.get(name) || { name, production: null, withheld: false };
        c.reserves = reading(r.Value, r.Unit);
        countries.set(name, c);
      }
    }
    const list = [...countries.values()]
      .map((c) => ({
        name: c.name,
        production: c.production,
        productionWithheld: c.withheld || undefined,
        productionShare: share(c.production, prodWorld),
        reserves: c.reserves ?? null,
        reservesShare: share(c.reserves, resWorld),
      }))
      .filter((c) => c.production || c.reserves || c.productionWithheld)
      .sort(
        (a, b) =>
          (b.production?.tonnes ?? -1) - (a.production?.tonnes ?? -1) ||
          (b.reserves?.tonnes ?? -1) - (a.reserves?.tonnes ?? -1),
      );

    if (!list.length || !prodWorld) throw new Error(`${spec.card}: nothing read — has the file changed?`);
    out[spec.card] = {
      measure: spec.measure,
      year: YEAR,
      worldProduction: prodWorld,
      worldReserves: resWorld,
      countries: list,
    };
  }

  const retrieved = new Date().toISOString().slice(0, 10);
  const body = `/**
 * Producing and reserve-holding countries per commodity card.
 *
 * GENERATED by build-resource-producers.cjs on ${retrieved} — do not edit by
 * hand; change the script and re-run it. See that script for the method.
 */

export type Amount = { tonnes: number; lowerBound: boolean };
export type Share = { pct: number; bound: "exact" | "atMost" | "atLeast" };

export interface ResourceProducer {
  name: string;
  production: Amount | null;
  /** USGS withholds the figure to protect company data; not zero. */
  productionWithheld?: boolean;
  productionShare: Share | null;
  reserves: Amount | null;
  reservesShare: Share | null;
}

export interface ResourceProducers {
  /** What "production" means for this commodity, in USGS's terms. */
  measure: string;
  year: string;
  worldProduction: Amount;
  /** Null where USGS reports no reserves for the commodity (aluminum). */
  worldReserves: Amount | null;
  /** Largest producer first. */
  countries: ResourceProducer[];
}

export const RESOURCE_PRODUCERS_SOURCE = {
  label: "USGS — Mineral Commodity Summaries 2026, world tables",
  url: "https://doi.org/10.3133/mcs2026",
};

export const RESOURCE_PRODUCERS: Record<string, ResourceProducers> = ${JSON.stringify(out, null, 2)};
`;
  fs.writeFileSync(OUT, body);
  console.log(`wrote ${OUT}`);
  for (const [k, v] of Object.entries(out)) {
    const top = v.countries[0];
    const topRes = [...v.countries].sort((a, b) => (b.reserves?.tonnes ?? 0) - (a.reserves?.tonnes ?? 0))[0];
    console.log(
      `  ${k}: ${v.countries.length} countries; top producer ${top.name} ${top.productionShare?.pct}%` +
        (v.worldReserves ? `; top reserves ${topRes.name} ${topRes.reservesShare?.pct}% (${topRes.reservesShare?.bound})` : ""),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
