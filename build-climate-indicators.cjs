/**
 * Builds src/data/climateIndicators.ts — the measured state of the climate,
 * read from the agencies that measure it.
 *
 * Every figure here is the latest reading its source publishes, with the month
 * or year it belongs to, and a comparison with the same period a decade
 * earlier so a number has something to be read against. Nothing is projected,
 * smoothed by this script, or filled in: where a series stops, it stops.
 *
 * Sources, all public and all machine-readable:
 *
 *   CO2        NOAA Global Monitoring Laboratory, Mauna Loa and global mean
 *   CH4, N2O   NOAA Global Monitoring Laboratory, globally averaged marine surface
 *   Warming    NASA GISS Surface Temperature Analysis (GISTEMP v4)
 *   AGGI       NOAA Annual Greenhouse Gas Index
 *   Sea ice    NSIDC Sea Ice Index, Arctic September extent
 *
 * A note on what these numbers are. NOAA publishes both a monthly mean and a
 * seasonally adjusted trend for CO2; the raw monthly mean rises and falls
 * through the year with the northern hemisphere's growing season, so the trend
 * is the one to compare across months and both are carried here. GISTEMP is an
 * anomaly against its own 1951-1980 baseline, which is not the pre-industrial
 * baseline the 1.5 degree target uses - the file says so rather than letting
 * the two be confused.
 *
 *   node build-climate-indicators.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const fail = (m) => {
  console.error("ABORT: " + m);
  process.exit(1);
};

const OUT = path.join(__dirname, "src/data/climateIndicators.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-climate");
fs.mkdirSync(CACHE, { recursive: true });

const SRC = {
  co2Mlo: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt",
  co2Global: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_gl.txt",
  ch4: "https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.txt",
  n2o: "https://gml.noaa.gov/webdata/ccgg/trends/n2o/n2o_mm_gl.txt",
  gistemp: "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv",
  aggi: "https://gml.noaa.gov/aggi/AGGI_Table.csv",
  seaIce: "https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv",
};

async function grab(key) {
  const at = path.join(CACHE, key + ".txt");
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  const res = await fetch(SRC[key], { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}

/** Data rows only: NOAA comments its headers with #, NSIDC uses a title row. */
const rows = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (m) => MONTHS[m - 1] ?? String(m);

/** NOAA monthly gas files: year, month, decimal, mean, ... (layout varies). */
function noaaMonthly(text, { meanAt, trendAt }) {
  const out = [];
  for (const line of rows(text)) {
    const f = line.split(/\s+/).map(Number);
    const [year, month] = f;
    if (!Number.isInteger(year) || !Number.isInteger(month)) continue;
    const mean = f[meanAt];
    const trend = trendAt === undefined ? undefined : f[trendAt];
    // NOAA writes -9.99 / -99.99 for a month it has not filled in.
    if (!Number.isFinite(mean) || mean <= 0) continue;
    out.push({ year, month, mean, trend: Number.isFinite(trend) && trend > 0 ? trend : undefined });
  }
  return out;
}

const pick = (series, year, month) => series.find((r) => r.year === year && r.month === month);

(async () => {
  const indicators = [];
  const notes = [];

  /* ── CO2, Mauna Loa ─────────────────────────────────────────────────── */
  const mlo = noaaMonthly(await grab("co2Mlo"), { meanAt: 3, trendAt: 4 });
  const mloLast = mlo[mlo.length - 1];
  const mloDecade = pick(mlo, mloLast.year - 10, mloLast.month);
  indicators.push({
    id: "co2",
    label: "Carbon dioxide",
    value: mloLast.trend ?? mloLast.mean,
    unit: "ppm",
    period: `${monthName(mloLast.month)} ${mloLast.year}`,
    decadeAgo: mloDecade ? (mloDecade.trend ?? mloDecade.mean) : null,
    monthlyMean: mloLast.mean,
    source: "NOAA Global Monitoring Laboratory — Mauna Loa",
    url: "https://gml.noaa.gov/ccgg/trends/",
    note: "Seasonally adjusted trend. The raw monthly mean was " + mloLast.mean + " ppm; it swings through the year with the northern growing season, so the trend is what compares across months.",
  });

  /* ── CO2, global mean ───────────────────────────────────────────────── */
  const glob = noaaMonthly(await grab("co2Global"), { meanAt: 3, trendAt: 5 });
  const globLast = glob[glob.length - 1];
  const globDecade = pick(glob, globLast.year - 10, globLast.month);
  indicators.push({
    id: "co2-global",
    label: "Carbon dioxide, global mean",
    value: globLast.mean,
    unit: "ppm",
    period: `${monthName(globLast.month)} ${globLast.year}`,
    decadeAgo: globDecade ? globDecade.mean : null,
    source: "NOAA Global Monitoring Laboratory — globally averaged marine surface",
    url: "https://gml.noaa.gov/ccgg/trends/gl_trend.html",
    note: "Averaged across the global marine surface network, which runs a little behind Mauna Loa.",
  });

  /* ── Methane and nitrous oxide ──────────────────────────────────────── */
  for (const [key, id, label, unit] of [
    ["ch4", "ch4", "Methane", "ppb"],
    ["n2o", "n2o", "Nitrous oxide", "ppb"],
  ]) {
    const s = noaaMonthly(await grab(key), { meanAt: 3, trendAt: 5 });
    const last = s[s.length - 1];
    const decade = pick(s, last.year - 10, last.month);
    indicators.push({
      id,
      label,
      value: last.mean,
      unit,
      period: `${monthName(last.month)} ${last.year}`,
      decadeAgo: decade ? decade.mean : null,
      source: "NOAA Global Monitoring Laboratory — globally averaged marine surface",
      url: `https://gml.noaa.gov/ccgg/trends_${id}/`,
      note: null,
    });
  }

  /* ── Surface temperature anomaly ────────────────────────────────────── */
  const giss = rows(await grab("gistemp"));
  const gissRows = giss
    .map((l) => l.split(","))
    .filter((f) => /^\d{4}$/.test(f[0]));
  let warm = null;
  for (let i = gissRows.length - 1; i >= 0 && !warm; i--) {
    const f = gissRows[i];
    for (let m = 12; m >= 1; m--) {
      const v = parseFloat(f[m]);
      if (Number.isFinite(v)) { warm = { year: +f[0], month: m, v }; break; }
    }
  }
  if (!warm) throw new Error("GISTEMP: no usable month");
  const warmDecadeRow = gissRows.find((f) => +f[0] === warm.year - 10);
  const warmDecade = warmDecadeRow ? parseFloat(warmDecadeRow[warm.month]) : NaN;
  indicators.push({
    id: "warming",
    label: "Surface temperature anomaly",
    value: warm.v,
    unit: "°C",
    period: `${monthName(warm.month)} ${warm.year}`,
    decadeAgo: Number.isFinite(warmDecade) ? warmDecade : null,
    source: "NASA GISS Surface Temperature Analysis (GISTEMP v4)",
    url: "https://data.giss.nasa.gov/gistemp/",
    note: "Measured against GISTEMP's own 1951-1980 average, which is already warmer than pre-industrial — so this is not the same number as the 1.5 °C target.",
  });

  /* ── Annual greenhouse gas index ────────────────────────────────────── */
  const aggiText = await grab("aggi");
  const aggiAll = aggiText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const aggiHeader = aggiAll.find((l) => /^Year,/i.test(l));
  if (!aggiHeader) fail("AGGI: header row not found");
  const aggiCols = aggiHeader.split(",").map((c) => c.trim());
  /* "1990 = 1" is the index. The column after it is the year-on-year percent
     change, which is a different quantity and was briefly published as though
     it were the index. */
  const aggiIdx = aggiCols.findIndex((c) => /^1990\s*=\s*1$/i.test(c));
  if (aggiIdx < 0) fail("AGGI: no column labelled 1990 = 1; the layout changed");
  const aggiRows = aggiAll.map((l) => l.split(",")).filter((f) => /^\d{4}$/.test(f[0]));
  const aggiLast = aggiRows[aggiRows.length - 1];
  const aggiDecade = aggiRows.find((f) => +f[0] === +aggiLast[0] - 10);
  indicators.push({
    id: "aggi",
    label: "Annual greenhouse gas index",
    value: parseFloat(aggiLast[aggiIdx]),
    unit: "× 1990",
    period: String(aggiLast[0]),
    decadeAgo: aggiDecade ? parseFloat(aggiDecade[aggiIdx]) : null,
    source: "NOAA Annual Greenhouse Gas Index",
    url: "https://gml.noaa.gov/aggi/aggi.html",
    note: "Heating from long-lived greenhouse gases, indexed so 1990 = 1.",
  });

  /* ── Arctic sea ice, September ──────────────────────────────────────── */
  try {
    const ice = rows(await grab("seaIce"))
      .map((l) => l.split(",").map((x) => x.trim()))
      .filter((f) => /^\d{4}$/.test(f[0]));
    const iceLast = ice[ice.length - 1];
    const iceDecade = ice.find((f) => +f[0] === +iceLast[0] - 10);
    const extentAt = iceLast.length - 2; // ...,extent,area
    /* The 1979-1990 mean, for the note. A single decade-ago figure is noisy
       enough to read against the trend - September 2025 came in above
       September 2015 - so the long baseline is given as well. */
    const early = ice.filter((f) => +f[0] >= 1979 && +f[0] <= 1990).map((f) => parseFloat(f[extentAt])).filter(Number.isFinite);
    const earlyMean = early.length ? early.reduce((a, b) => a + b, 0) / early.length : null;
    indicators.push({
      id: "sea-ice",
      label: "Arctic sea ice, September",
      value: parseFloat(iceLast[extentAt]),
      unit: "million km²",
      period: `September ${iceLast[0]}`,
      decadeAgo: iceDecade ? parseFloat(iceDecade[extentAt]) : null,
      source: "NSIDC Sea Ice Index",
      url: "https://nsidc.org/arcticseaicenews/",
      note:
        "September is the Arctic's annual minimum, which is why it is the month usually quoted." +
        (earlyMean
          ? ` The 1979-1990 September average was ${earlyMean.toFixed(2)} million km²; single years move enough that a decade-on-decade comparison can run against the trend.`
          : ""),
    });
  } catch (e) {
    notes.push("Arctic sea ice omitted: " + e.message);
  }

  const today = new Date().toISOString().slice(0, 10);
  const body = indicators
    .map(
      (i) =>
        `  {\n` +
        `    id: ${JSON.stringify(i.id)},\n` +
        `    label: ${JSON.stringify(i.label)},\n` +
        `    value: ${i.value},\n` +
        `    unit: ${JSON.stringify(i.unit)},\n` +
        `    period: ${JSON.stringify(i.period)},\n` +
        `    decadeAgo: ${i.decadeAgo === null ? "null" : i.decadeAgo},\n` +
        `    source: ${JSON.stringify(i.source)},\n` +
        `    url: ${JSON.stringify(i.url)},\n` +
        `    note: ${i.note === null || i.note === undefined ? "null" : JSON.stringify(i.note)},\n` +
        `  },`,
    )
    .join("\n");

  fs.writeFileSync(
    OUT,
    `/**
 * The measured state of the climate, from the agencies that measure it.
 *
 * GENERATED by build-climate-indicators.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Each entry is the latest reading its source publishes, the period it belongs
 * to, and the same period ten years earlier for comparison. Nothing is
 * projected or interpolated: where a series stops, it stops, and the period
 * says when that was.
 */
export const CLIMATE_RETRIEVED = "${today}";

export interface ClimateIndicator {
  id: string;
  label: string;
  value: number;
  unit: string;
  /** The month or year this reading is for. */
  period: string;
  /** The same period a decade earlier, or null where the series does not reach. */
  decadeAgo: number | null;
  source: string;
  url: string;
  /** What the figure is, where that is not obvious from the label. */
  note: string | null;
}

export const CLIMATE_INDICATORS: ClimateIndicator[] = [
${body}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}: ${indicators.length} indicators`);
  for (const i of indicators) {
    const d = i.decadeAgo === null ? "no decade-ago figure" : `vs ${i.decadeAgo} a decade earlier`;
    console.log(`  ${i.label.padEnd(30)} ${String(i.value).padStart(9)} ${i.unit.padEnd(12)} ${i.period.padEnd(16)} ${d}`);
  }
  notes.forEach((n) => console.log("  " + n));
})().catch((e) => { console.error(e); process.exit(1); });
