/**
 * build-donor-aid.cjs
 *
 * Official development assistance (ODA) by donor country, from the OECD
 * Development Assistance Committee's DAC1 table: how much aid each country gave
 * in its latest reported year, the year before for comparison, and aid as a
 * share of its gross national income.
 *
 * Source. OECD Data Explorer, DAC1 "Flows by provider" (OECD.DCD.FSD,
 * DSD_DAC1@DF_DAC1), read through its SDMX API:
 *   - measure 11010, ODA on the grant-equivalent basis the DAC has used as its
 *     headline since 2018, in current US dollars;
 *   - measure 11002, the same as a percentage of GNI.
 * The latest year is preliminary: the OECD publishes each year's figures the
 * following April and revises them at year end.
 *
 * Only countries are kept. The table also carries totals — "DAC countries",
 * "G7", "EU Institutions", "Multilaterals organisations" and so on — which are
 * dropped here, and the DAC total is kept separately for the headline.
 *
 * Who is missing, and why. The OECD can only publish what providers report to
 * it. China, India, Russia, Brazil and others give aid but do not report to the
 * DAC, so they are absent — not zero — and the page says so.
 *
 *   node build-donor-aid.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/donorAid.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-oecd-dac");
fs.mkdirSync(CACHE, { recursive: true });

const FLOW = "OECD.DCD.FSD,DSD_DAC1@DF_DAC1,1.7";
const API = "https://sdmx.oecd.org/public/rest";
const EXPLORER =
  "https://data-explorer.oecd.org/vis?df%5Bag%5D=OECD.DCD.FSD&df%5Bid%5D=DSD_DAC1%40DF_DAC1";

/** Aggregates in the DONOR dimension — not countries. */
const AGGREGATES = new Set(["DAC", "DAC_EC", "DACEU", "G7", "WXDAC", "ALLM", "4EU001"]);

/** The OECD's formal names, where the site calls the country something else. */
const RENAME = {
  "Chinese Taipei": "Taiwan",
  Korea: "South Korea",
  "Slovak Republic": "Slovakia",
  Czechia: "Czech Republic",
};

async function get(url, file, accept) {
  const at = path.join(CACHE, file);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const body = await res.text();
  fs.writeFileSync(at, body);
  return body;
}

(async () => {
  const startYear = new Date().getFullYear() - 3;

  // Donor names, from the dataflow's own codelist.
  const struct = JSON.parse(
    await get(
      `${API}/dataflow/OECD.DCD.FSD/DSD_DAC1@DF_DAC1/latest?references=all`,
      "dac1-structure.json",
      "application/vnd.sdmx.structure+json",
    ),
  );
  const dims = struct.data.dataStructures[0].dataStructureComponents.dimensionList.dimensions;
  const donorDim = dims.find((d) => d.id === "DONOR");
  const donorList = struct.data.codelists.find((c) =>
    donorDim.localRepresentation.enumeration.includes(`:${c.id}(`),
  );
  const nameOf = (id) => {
    const k = donorList.codes.find((c) => c.id === id);
    return k ? k.name || k.names?.en : id;
  };

  // Key order: DONOR.SECTOR.MEASURE.TYING_STATUS.FLOW_TYPE.UNIT_MEASURE.PRICE_BASE
  const csv = await get(
    `${API}/data/${FLOW}/..11010+11002....?startPeriod=${startYear}&dimensionAtObservation=AllDimensions`,
    `dac1-oda-${startYear}.csv`,
    "application/vnd.sdmx.data+csv; charset=utf-8",
  );
  const lines = csv.trim().split(/\r?\n/);
  const H = lines[0].split(",");
  const col = (n) => H.indexOf(n);
  const rows = lines.slice(1).map((l) => l.split(","));

  /** donor -> year -> { usd, gni } */
  const by = {};
  for (const r of rows) {
    const donor = r[col("DONOR")];
    const measure = r[col("MEASURE")];
    const unit = r[col("UNIT_MEASURE")];
    const price = r[col("PRICE_BASE")];
    const year = r[col("TIME_PERIOD")];
    const v = Number(r[col("OBS_VALUE")]);
    if (!Number.isFinite(v)) continue;
    const slot = ((by[donor] ??= {})[year] ??= {});
    const mult = Number(r[col("UNIT_MULT")] || 0);
    // Two price bases, kept apart. The amount is shown in current dollars,
    // as the OECD headlines it ("USD 29 billion"). The change is taken from
    // constant prices, as the OECD reports it: in current dollars 2025 looks
    // like a 19.0% fall for the DAC, but inflation hides part of it, and the
    // figure the OECD publishes — and this reproduces — is 23.1%.
    if (measure === "11010" && unit === "USD" && price === "V") slot.usd = v * 10 ** mult;
    if (measure === "11010" && unit === "USD" && price === "Q") slot.real = v * 10 ** mult;
    if (measure === "11002" && price === "V") slot.gni = v;
  }

  const summarise = (code) => {
    const years = Object.keys(by[code] ?? {})
      .filter((y) => by[code][y].usd !== undefined)
      .sort();
    if (!years.length) return null;
    const y = years[years.length - 1];
    const prevY = String(Number(y) - 1);
    const cur = by[code][y];
    const prev = by[code][prevY];
    const realChangePct =
      cur.real !== undefined && prev?.real !== undefined && prev.real > 0
        ? Math.round(((cur.real - prev.real) / prev.real) * 1000) / 10
        : null;
    return {
      usd: Math.round(cur.usd),
      year: y,
      realChangePct,
      pctGni: cur.gni ?? null,
    };
  };

  const donors = Object.keys(by)
    .filter((c) => !AGGREGATES.has(c) && /^[A-Z]{3}$/.test(c))
    .map((c) => {
      const s = summarise(c);
      if (!s) return null;
      const raw = nameOf(c);
      return { iso3: c, name: RENAME[raw] ?? raw, ...s };
    })
    .filter(Boolean)
    .sort((a, b) => b.usd - a.usd);

  const dac = summarise("DAC");
  if (!dac || donors.length < 30) throw new Error("DAC1 response looks incomplete");
  const latestYear = dac.year;

  const retrieved = new Date().toISOString().slice(0, 10);
  const body = `/**
 * Official development assistance by donor country.
 *
 * GENERATED by build-donor-aid.cjs on ${retrieved} — do not edit by hand;
 * change the script and re-run it. See that script for the source and method.
 */

export interface DonorAid {
  iso3: string;
  name: string;
  /** ODA, grant-equivalent basis, current US dollars, in \`year\`. */
  usd: number;
  year: string;
  /**
   * Change on the year before in real terms (constant prices), as the OECD
   * reports it, in percent. Null where the year before was not reported.
   */
  realChangePct: number | null;
  /** ODA as a percentage of gross national income, in \`year\`. */
  pctGni: number | null;
}

export const DONOR_AID_SOURCE = {
  label: "OECD — DAC1, official development assistance by provider (${latestYear} preliminary)",
  url: ${JSON.stringify(EXPLORER)},
};
export const DONOR_AID_RETRIEVED = ${JSON.stringify(retrieved)};

/** The DAC members' combined total, for the headline. */
export const DAC_TOTAL = ${JSON.stringify(dac)};

/** Every reporting country, largest first. */
export const DONOR_AID: DonorAid[] = ${JSON.stringify(donors, null, 2)};
`;
  fs.writeFileSync(OUT, body);
  console.log(`wrote ${OUT}: ${donors.length} donors, latest ${latestYear}`);
  console.log(`  DAC total ${latestYear}: $${(dac.usd / 1e9).toFixed(1)}bn, ${dac.realChangePct}% real on ${Number(latestYear) - 1}`);
  for (const d of donors.slice(0, 6)) console.log(`  ${d.name}: $${(d.usd / 1e9).toFixed(2)}bn ${d.year}, ${d.realChangePct}% real, ${d.pctGni}% GNI`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
