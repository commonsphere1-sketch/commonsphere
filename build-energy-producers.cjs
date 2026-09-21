/**
 * build-energy-producers.cjs
 *
 * Country tables for the three fossil-fuel cards on the Economies page —
 * Crude Oil, Natural Gas and Coal — in the same shape as the USGS minerals
 * (see resourceProducerTypes.ts). Written to src/data/energyProducers.ts.
 *
 * Production. US Energy Information Administration, International Energy
 * Data, bulk file INTL.zip (public, no key):
 *   crude oil   INTL.57-1-*-TBPD   crude including lease condensate, kb/d
 *   natural gas INTL.26-1-*-BCM    dry natural gas, billion cubic metres
 *   coal        INTL.7-1-*-MT      coal, thousand tonnes
 * Each series' latest year is used; the world total is EIA's own WORL series,
 * so shares are of the same total the countries are drawn from.
 *
 * Reserves.
 *   crude oil, natural gas: OPEC Annual Statistical Bulletin 2026, Table 3.1
 *   "World proven crude oil reserves by country" (million barrels) and Table
 *   9.1 "World proven natural gas reserves by country" (billion cubic
 *   metres), both at end-2025. The EIA bulk file no longer carries either.
 *   The tables are read from the bulletin's PDF by cell: the extractor starts
 *   a new cell wherever the PDF repositions its text cursor, so a row comes
 *   out as its printed cells — Venezuela | 303,468 | 303,221 | ... — rather
 *   than the run-together digits a plain text dump gives, which cannot be
 *   split back without guessing.
 *   coal: EIA INTL.7-6 (million short tons, converted to tonnes).
 *
 * OPEC's oil figure for Canada excludes oil sands, as its own footnote says;
 * the page repeats that.
 *
 * Which countries. The largest twenty by production, and any other country
 * among the largest twenty by reserves, so a large holder that produces
 * little (or nothing yet) is not left out.
 *
 *   node build-energy-producers.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/energyProducers.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const EIA_CACHE = path.join(os.tmpdir(), "commonsphere-energy");
const OPEC_CACHE = path.join(os.tmpdir(), "commonsphere-opec");
fs.mkdirSync(EIA_CACHE, { recursive: true });
fs.mkdirSync(OPEC_CACHE, { recursive: true });

const EIA_URL = "https://www.eia.gov/opendata/bulk/INTL.zip";
const OPEC_URL = "https://publications.opec.org/ASSETS/assetdb/asb-2026.pdf";
const EIA_SOURCE = {
  label: "US EIA — International Energy Data",
  url: "https://www.eia.gov/international/data/world",
};
const OPEC_SOURCE = {
  label: "OPEC — Annual Statistical Bulletin 2026",
  url: "https://publications.opec.org/ASSETS/assetdb/asb-2026.pdf",
};
const TOP = 20;
const SHORT_TON = 0.90718474; // tonnes

/** EIA and OPEC names, mapped to the one the site uses. */
const NAME = {
  "IR Iran": "Iran",
  "Iran": "Iran",
  "Sudans": "Sudan & South Sudan",
  "Congo": "Republic of the Congo",
  "Congo-Brazzaville": "Republic of the Congo",
  "Congo-Kinshasa": "DR Congo",
  "Burma": "Myanmar",
  "Korea, South": "South Korea",
  "Korea, North": "North Korea",
  "Timor-Leste (East Timor)": "Timor-Leste",
  Turkiye: "Türkiye",
};
const nm = (s) => NAME[s.trim()] || s.trim();

async function download(url, file) {
  if (fs.existsSync(file)) return;
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

/** EIA bulk series -> { iso3: { name, year, value } } plus the world value. */
function eiaSeries(lines, pattern) {
  const byCode = {};
  let world = null;
  for (const line of lines) {
    const j = line;
    const m = pattern.exec(j.series_id || "");
    if (!m) continue;
    const code = m[1];
    const point = (j.data || []).find((d) => d[1] !== null && d[1] !== "--" && Number.isFinite(Number(d[1])));
    if (!point) continue;
    const entry = { year: String(point[0]), value: Number(point[1]) };
    if (code === "WORL") world = entry;
    else if (/^[A-Z]{3}$/.test(code)) {
      const name = (j.name || "").split(", ").slice(1, -1).join(", ");
      // EIA keeps some historical aggregates under three-letter codes —
      // "Former U.S.S.R.", "Former Yugoslavia" — alongside their successors.
      if (/^Former /.test(name)) continue;
      byCode[code] = { name: nm(name), ...entry };
    }
  }
  // A country's latest figure must be current. EIA keeps defunct entities —
  // East and West Germany, Czechoslovakia — whose "latest" year is decades
  // old; without this, 1990 East German coal would sit beside 2024 figures.
  if (world) {
    for (const [code, c] of Object.entries(byCode)) {
      if (Number(c.year) < Number(world.year) - 2) delete byCode[code];
    }
  }
  return { byCode, world };
}

/** One OPEC table, read by cell: { name: value-for-latest-year }, plus world. */
function opecTable(pdfText, title) {
  const line = pdfText.split("\n").find((l) => l.includes(title));
  if (!line) throw new Error(`OPEC bulletin: no table "${title}"`);
  const cells = line.split("|").map((c) => c.trim()).filter((c) => c !== "");
  const num = (c) => /^[–−\x96-]?[\d,]+(\.\d+)?$/.test(c);
  // Regional and group totals, the unit label, and "Others" — everything in
  // the table that is not a single country.
  const isAggregate = (label) =>
    /^(OECD|OPEC|Non[–\x96-]|DoC|Others|of which|Total world|\(|Latin America|Middle East|Africa|Other |Asia|Europe|North America)/.test(
      label,
    );
  const rows = {};
  let world = null;
  for (let i = 0; i < cells.length; i++) {
    const label = cells[i];
    if (num(label)) continue;
    // The next five cells are 2021..2025; OPEC prints a footnote digit before
    // Canada's, so skip one lone digit if six numbers follow it.
    let j = i + 1;
    if (/^\d$/.test(cells[j] || "") && cells.slice(j + 1, j + 6).every(num)) j++;
    const vals = cells.slice(j, j + 5);
    if (vals.length < 5 || !vals.every(num)) continue;
    const latest = Number(vals[4].replace(/,/g, ""));
    if (label === "Total world") world = latest;
    else if (!isAggregate(label)) rows[nm(label)] = latest;
    i = j + 4;
  }
  if (!world) throw new Error(`OPEC bulletin: no world total in "${title}"`);
  return { rows, world };
}

/** Cell-preserving text from a PDF: a "|" wherever the text cursor moves. */
function pdfCells(file) {
  const buf = fs.readFileSync(file);
  const out = [];
  let i = 0;
  while (true) {
    const s = buf.indexOf("stream", i);
    if (s < 0) break;
    let p = s + 6;
    if (buf[p] === 0x0d) p++;
    if (buf[p] === 0x0a) p++;
    const e = buf.indexOf("endstream", p);
    if (e < 0) break;
    i = e + 9;
    let data;
    try {
      data = zlib.inflateSync(buf.slice(p, e));
    } catch {
      continue;
    }
    const txt = data.toString("latin1");
    if (!/(TJ|Tj)/.test(txt)) continue;
    let line = "";
    const re = /\(((?:\\.|[^\\()])*)\)|\b(Td|TD|Tm|T\*|BT|ET)\b/g;
    let m;
    while ((m = re.exec(txt))) {
      // Undo PDF string escapes: octal first (\226 is the bulletin's en dash,
      // which it uses in "Non–OPEC" and as a minus sign), then \( \) \\.
      if (m[1] !== undefined)
        line += m[1]
          .replace(/\\([0-7]{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
          .replace(/\\([()\\])/g, "$1");
      else if (!line.endsWith("|")) line += "|";
    }
    out.push(line);
  }
  return out.join("\n");
}

const share = (v, w) => (v !== null && w ? { pct: Math.round((v / w) * 1000) / 10, bound: "exact" } : null);

function assemble({ measure, prod, prodUnit, res, resUnit, resYear, sources, notes }) {
  const names = new Map();
  for (const c of Object.values(prod.byCode)) names.set(c.name, { name: c.name, production: c.value });
  for (const [name, v] of Object.entries(res.rows)) {
    const c = names.get(name) || { name, production: null };
    c.reserves = v;
    names.set(name, c);
  }
  const all = [...names.values()];
  const byProd = [...all].filter((c) => c.production > 0).sort((a, b) => b.production - a.production).slice(0, TOP);
  const byRes = [...all].filter((c) => c.reserves > 0).sort((a, b) => b.reserves - a.reserves).slice(0, TOP);
  const keep = new Set([...byProd, ...byRes].map((c) => c.name));
  const countries = all
    .filter((c) => keep.has(c.name))
    .sort((a, b) => (b.production ?? -1) - (a.production ?? -1) || (b.reserves ?? 0) - (a.reserves ?? 0))
    .map((c) => ({
      name: c.name,
      production: c.production > 0 ? { value: c.production, lowerBound: false } : null,
      productionShare: c.production > 0 ? share(c.production, prod.world.value) : null,
      reserves: c.reserves > 0 ? { value: c.reserves, lowerBound: false } : null,
      reservesShare: c.reserves > 0 ? share(c.reserves, res.world) : null,
    }));
  return {
    measure,
    productionYear: prod.world.year,
    reservesYear: resYear,
    productionUnit: prodUnit,
    reservesUnit: resUnit,
    worldProduction: { value: prod.world.value, lowerBound: false },
    worldReserves: { value: res.world, lowerBound: false },
    countries,
    sources,
    ...(notes ? { notes } : {}),
  };
}

(async () => {
  const zipAt = path.join(EIA_CACHE, "INTL.zip");
  await download(EIA_URL, zipAt);
  const lines = unzip(zipAt)
    .get("INTL.txt")
    .toString("utf8")
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const pdfAt = path.join(OPEC_CACHE, "asb-2026.pdf");
  await download(OPEC_URL, pdfAt);
  const pdf = pdfCells(pdfAt);

  const oilProd = eiaSeries(lines, /^INTL\.57-1-([A-Z0-9]+)-TBPD\.A$/);
  const gasProd = eiaSeries(lines, /^INTL\.26-1-([A-Z0-9]+)-BCM\.A$/);
  const coalProd = eiaSeries(lines, /^INTL\.7-1-([A-Z0-9]+)-MT\.A$/);
  const coalRes = eiaSeries(lines, /^INTL\.7-6-([A-Z0-9]+)-MST\.A$/);
  for (const [k, s] of Object.entries({ oilProd, gasProd, coalProd, coalRes }))
    if (!s.world || Object.keys(s.byCode).length < 50) throw new Error(`EIA ${k}: incomplete`);

  const oilRes = opecTable(pdf, "World proven crude oil reserves by country");
  const gasRes = opecTable(pdf, "World proven natural gas reserves by country");

  // Coal: EIA's units to tonnes (thousand tonnes; million short tons).
  const coalProdT = {
    byCode: Object.fromEntries(Object.entries(coalProd.byCode).map(([k, c]) => [k, { ...c, value: c.value * 1000 }])),
    world: { ...coalProd.world, value: coalProd.world.value * 1000 },
  };
  const coalResRows = {};
  for (const c of Object.values(coalRes.byCode)) if (c.value > 0) coalResRows[c.name] = c.value * 1e6 * SHORT_TON;

  const out = {
    "Crude Oil": assemble({
      measure: "Crude oil production including lease condensate (EIA); proven reserves at year-end (OPEC)",
      prod: oilProd,
      prodUnit: "kb/d",
      res: oilRes,
      resUnit: "mb",
      resYear: "2025",
      sources: [EIA_SOURCE, OPEC_SOURCE],
      notes: ["OPEC's reserve figure for Canada excludes oil sands; counting them, Canada's reserves are several times larger."],
    }),
    "Natural Gas": assemble({
      measure: "Dry natural gas production (EIA); proven reserves at year-end (OPEC)",
      prod: gasProd,
      prodUnit: "bcm",
      res: gasRes,
      resUnit: "bcm",
      resYear: "2025",
      sources: [EIA_SOURCE, OPEC_SOURCE],
    }),
    Coal: assemble({
      measure: "Coal production and recoverable reserves (EIA)",
      prod: coalProdT,
      prodUnit: "t",
      res: { rows: coalResRows, world: coalRes.world.value * 1e6 * SHORT_TON },
      resUnit: "t",
      resYear: coalRes.world.year,
      sources: [EIA_SOURCE],
    }),
  };

  const retrieved = new Date().toISOString().slice(0, 10);
  const body = `/**
 * Producing and reserve-holding countries for the fossil-fuel cards.
 *
 * GENERATED by build-energy-producers.cjs on ${retrieved} — do not edit by
 * hand; change the script and re-run it. See that script for the sources.
 */
import type { ResourceProducers } from "./resourceProducerTypes";

export const ENERGY_PRODUCERS: Record<string, ResourceProducers> = ${JSON.stringify(out, null, 2)};
`;
  fs.writeFileSync(OUT, body);
  console.log(`wrote ${OUT}`);
  for (const [k, v] of Object.entries(out)) {
    const topP = v.countries[0];
    const topR = [...v.countries].sort((a, b) => (b.reserves?.value ?? 0) - (a.reserves?.value ?? 0))[0];
    console.log(
      `  ${k}: ${v.countries.length} countries; production ${v.productionYear} world ${Math.round(v.worldProduction.value).toLocaleString()} ${v.productionUnit}, top ${topP.name} ${topP.productionShare?.pct}%; reserves ${v.reservesYear} world ${Math.round(v.worldReserves.value).toLocaleString()} ${v.reservesUnit}, top ${topR.name} ${topR.reservesShare?.pct}%`,
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
