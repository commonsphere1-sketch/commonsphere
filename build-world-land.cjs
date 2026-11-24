#!/usr/bin/env node
/**
 * Builds src/data/worldLand.ts - what the world's land is used for, and what covers it, as FAO publishes them for the
 * world as a whole: the other kinds of terrain beside forest and farmland, as asked.
 *
 * Sources. FAO's statistical database (FAOSTAT), two of its tables, each read whole from FAO's bulk download:
 *
 *   Land Use (RL)      what the land is used for, by country's reports: cropland (arable land and permanent crops),
 *                      permanent meadows and pastures, forest land, and other land - FAO's name for land that is
 *                      neither farmland nor forest; with the world's land area and inland waters. One year for all.
 *   Land Cover (LC)    what covers the ground, as satellite maps class it - tree cover, grassland, shrubs, cropland,
 *                      flooded vegetation, mangroves, built-up land, bare land, snow and glaciers, inland water. FAO
 *                      gives the world's area in each class from four maps (MODIS, ESA's CCI, ESA WorldCover and
 *                      Copernicus CGLS), which class the land differently; the latest year of each is kept, so that
 *                      the page can set them side by side.
 *
 * Areas are FAO's, in thousand hectares, turned into square kilometres (x 10). A share is an area over the whole it is
 * part of - the land area for land use, the sum of the classes for a map - worked out here, and said so on the page.
 *
 * Licence: CC BY 4.0, with FAO's Statistical Database Terms of Use (no use in promoting a commercial enterprise, no
 * suggestion of FAO's endorsement). Cited as FAO asks: "FAO. [year of last update]. [database: dataset]. Accessed on
 * [date]. [URL]. Licence: CC-BY-4.0."
 *
 *   node build-world-land.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/worldLand.ts");
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const BULK = "https://bulks-faostat.fao.org/production/";
const TABLES = {
  RL: { zip: "Inputs_LandUse_E_All_Data_(Normalized).zip", csv: "Inputs_LandUse_E_All_Data_(Normalized).csv", name: "FAOSTAT: Land Use", page: "https://www.fao.org/faostat/en/#data/RL" },
  LC: { zip: "Environment_LandCover_E_All_Data_(Normalized).zip", csv: "Environment_LandCover_E_All_Data_(Normalized).csv", name: "FAOSTAT: Land Cover", page: "https://www.fao.org/faostat/en/#data/LC" },
};
/** The maps of the land cover table, as FAO names them in its elements, and as the page names them. */
const MAPS = {
  "Area from MODIS": "MODIS (NASA)",
  "Area from CCI_LC": "ESA Climate Change Initiative",
  "Area from WorldCover": "ESA WorldCover",
  "Area from CGLS": "Copernicus Global Land Service",
};
/** The classes, in FAO's words, and the page's shorter ones. */
const CLASSES = {
  "Tree-covered areas": "Tree cover",
  Grassland: "Grassland",
  "Shrub-covered areas": "Shrubland",
  "Herbaceous crops": "Crops (herbaceous)",
  "Woody crops": "Crops (woody)",
  "Multiple or layered crops": "Crops (layered)",
  "Shrubs and/or herbaceous vegetation, aquatic or regularly flooded": "Flooded vegetation",
  Mangroves: "Mangroves",
  "Sparsely natural vegetated areas": "Sparse vegetation",
  "Terrestrial barren land": "Bare land",
  "Permanent snow and glaciers": "Snow and glaciers",
  "Inland water bodies": "Inland water",
  "Coastal water bodies and intertidal areas": "Coastal water and tidal flats",
  "Artificial surfaces (including urban and associated areas)": "Built-up land",
};

const work = fs.mkdtempSync(path.join(os.tmpdir(), "cs-world-land-"));
const httpDate = (headers) => (/^date:\s*(.+)$/im.exec(headers) || [])[1];
const lastModified = (headers) => (/^last-modified:\s*(.+)$/im.exec(headers) || [])[1];

function fetchTable(key) {
  const t = TABLES[key];
  const zip = path.join(work, `${key}.zip`);
  const head = execFileSync("curl", ["-sS", "-D", "-", "-o", zip, "-A", UA, "--max-time", "600", BULK + t.zip], { encoding: "utf8" });
  if (!/^HTTP\/[\d.]+ 200/m.test(head)) throw new Error(`${key}: ${head.split("\n")[0]}`);
  const dir = path.join(work, key);
  execFileSync("unzip", ["-o", "-q", zip, "-d", dir]);
  return { text: fs.readFileSync(path.join(dir, t.csv), "utf8"), date: httpDate(head), updated: lastModified(head) };
}

/** The World rows of a FAOSTAT normalized table. */
function worldRows(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(",");
  const out = [];
  for (const l of lines.slice(1)) {
    if (!l.includes('"World"')) continue;
    const cells = [];
    let cur = "",
      q = false;
    for (const c of l) {
      if (c === '"') q = !q;
      else if (c === "," && !q) {
        cells.push(cur);
        cur = "";
      } else cur += c;
    }
    cells.push(cur);
    const r = Object.fromEntries(head.map((h, i) => [h, cells[i]]));
    if (r.Area === "World") out.push({ item: r.Item, element: r.Element, year: Number(r.Year), unit: r.Unit, value: Number(r.Value), flag: r.Flag });
  }
  return out;
}

const km2 = (thousandHa) => Math.round(thousandHa * 10);
const share = (part, whole) => Number(((100 * part) / whole).toFixed(2));
const day = (d) => new Date(d).toISOString().slice(0, 10);
const year = (d) => new Date(d).getUTCFullYear();

// ── Land use: the latest year that has every part ──────────────────────────────────────────────
const rl = fetchTable("RL");
const use = worldRows(rl.text).filter((r) => r.element === "Area" && r.unit === "1000 ha");
const at = (item, y) => use.find((r) => r.item === item && r.year === y)?.value;
const NEED = ["Land area", "Cropland", "Arable land", "Permanent crops", "Permanent meadows and pastures", "Forest land", "Other land", "Inland waters"];
const useYear = Math.max(...use.filter((r) => r.item === "Land area").map((r) => r.year).filter((y) => NEED.every((i) => at(i, y) !== undefined)));
if (!Number.isFinite(useYear)) throw new Error("No year holds every land use part");
const land = at("Land area", useYear);
const parts = [
  ["Cropland", "Cropland"],
  ["Permanent meadows and pastures", "Meadows and pastures"],
  ["Forest land", "Forest"],
  ["Other land", "Other land"],
].map(([item, label]) => ({ label, item, km2: km2(at(item, useYear)), pct: share(at(item, useYear), land) }));
const sum = parts.reduce((s, p) => s + at(p.item, useYear), 0);
// FAO's other land is the land area less farmland and forest: the parts should make the whole, to within rounding.
if (Math.abs(sum - land) / land > 0.005) throw new Error(`Land use parts ${sum} do not make the land area ${land}`);
const LAND_USE = {
  year: useYear,
  landKm2: km2(land),
  inlandWaterKm2: km2(at("Inland waters", useYear)),
  parts,
  cropland: [
    { label: "Arable land", km2: km2(at("Arable land", useYear)), pct: share(at("Arable land", useYear), land) },
    { label: "Permanent crops", km2: km2(at("Permanent crops", useYear)), pct: share(at("Permanent crops", useYear), land) },
  ],
};

// ── Land cover: each map's latest year, every class it holds ───────────────────────────────────
const lc = fetchTable("LC");
const cover = worldRows(lc.text).filter((r) => MAPS[r.element] && r.unit === "1000 ha");
const LAND_COVER = Object.entries(MAPS).map(([element, map]) => {
  const rows = cover.filter((r) => r.element === element);
  const y = Math.max(...rows.map((r) => r.year));
  const inYear = rows.filter((r) => r.year === y && r.value > 0);
  for (const r of inYear) if (!CLASSES[r.item]) throw new Error(`Unnamed class: ${r.item}`);
  const total = inYear.reduce((s, r) => s + r.value, 0);
  return {
    map,
    year: y,
    totalKm2: km2(total),
    classes: inYear
      .map((r) => ({ label: CLASSES[r.item], fao: r.item, km2: km2(r.value), pct: share(r.value, total) }))
      .sort((a, b) => b.km2 - a.km2),
  };
});
for (const m of LAND_COVER) if (!m.classes.length) throw new Error(`${m.map}: no classes`);
// A map whose world total is well short of the others' does not cover the whole world in FAO's sum (Copernicus's, for
// 2019, held 79 million km2 where the others hold 135 to 147): its shares would not be of the same whole. It is left out,
// and the page says so with its total.
const widest = Math.max(...LAND_COVER.map((m) => m.totalKm2));
const LEFT_OUT = LAND_COVER.filter((m) => m.totalKm2 < 0.75 * widest).map((m) => ({ map: m.map, year: m.year, totalKm2: m.totalKm2 }));
const KEPT = LAND_COVER.filter((m) => m.totalKm2 >= 0.75 * widest);

const accessed = day(rl.date || lc.date || Date.now());
const cite = (key, src) =>
  `FAO. ${year(src.updated || src.date)}. ${TABLES[key].name}. Accessed on ${accessed}. ${TABLES[key].page} Licence: CC-BY-4.0.`;
const out = `// GENERATED by build-world-land.cjs on ${accessed} - do not edit by hand.
// Sources: ${cite("RL", rl)}
//          ${cite("LC", lc)}

export interface LandPart {
  label: string;
  /** FAO's own name for it, where the page shortens it. */
  fao?: string;
  /** FAO's area, in square kilometres (its thousand hectares x 10). */
  km2: number;
  /** Its share of the whole it is part of, worked out here: the land area for land use, the map's classes for cover. */
  pct: number;
}

/** What the world's land is used for, FAO's land use statistics, one year for every part. */
export const WORLD_LAND_USE: { year: number; landKm2: number; inlandWaterKm2: number; parts: (LandPart & { item: string })[]; cropland: LandPart[] } = ${JSON.stringify(LAND_USE)};

/** What covers the world's surface, as each satellite map FAO publishes classes it, each map's latest year. */
export const WORLD_LAND_COVER: { map: string; year: number; totalKm2: number; classes: LandPart[] }[] = ${JSON.stringify(KEPT)};

/** Maps FAO publishes whose world total falls well short of the others' - not the whole world - and so are not drawn. */
export const WORLD_LAND_COVER_LEFT_OUT: { map: string; year: number; totalKm2: number }[] = ${JSON.stringify(LEFT_OUT)};

export const WORLD_LAND_SOURCES = {
  use: { label: ${JSON.stringify(cite("RL", rl))}, url: ${JSON.stringify(TABLES.RL.page)} },
  cover: { label: ${JSON.stringify(cite("LC", lc))}, url: ${JSON.stringify(TABLES.LC.page)} },
};
`;
fs.writeFileSync(OUT, out);
console.log(`Land use ${useYear}: ${parts.map((p) => `${p.label} ${p.pct}%`).join(", ")}`);
for (const m of KEPT) console.log(`${m.map} ${m.year}: ${m.classes.map((c) => `${c.label} ${c.pct}%`).join(", ")}`);
for (const m of LEFT_OUT) console.log(`left out: ${m.map} ${m.year}, ${(m.totalKm2 / 1e6).toFixed(1)} million km2`);
fs.rmSync(work, { recursive: true, force: true });
