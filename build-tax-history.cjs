/**
 * Builds src/data/taxHistory.ts — taxation over the years, for the Tax tab of
 * an economy's window: the rates a country sets on companies' profits at its
 * centre (federal) and below it (state and local), the top rate on personal
 * income, and what its government takes in tax, each year by year, with an
 * average to set each beside.
 *
 *   node build-tax-history.cjs
 *
 * Sources - each one's licence allows a site that sells memberships and
 * carries advertising to show its figures, with the credit given here:
 *
 *   OECD, Tax Database (CC BY 4.0)
 *     Corporate income tax, statutory rates (DF_CIT, "Statutory"): the
 *     central government's rate, the sub-central government's rate, and the
 *     two combined - the OECD's own three measures, for the jurisdictions it
 *     covers, from 2000.
 *     The top statutory personal income tax rate (DF_PIT_TOP_EARN_THRESH),
 *     for its members, from 2000.
 *
 *   World Bank, World Development Indicators (CC BY 4.0), from the IMF's
 *   Government Finance Statistics
 *     Tax revenue as a share of GDP (GC.TAX.TOTL.GD.ZS), every year held,
 *     with the Bank's own figure for the world and for the European Union.
 *
 * A rate announced for a year to come is not yet the rate, and is left out.
 * So is a figure of more than 100% in the OECD's table (it gives 122.8% as
 * France's top rate of income tax for 2013, between 54.4% and 54.5% in the
 * years either side), and a tax revenue of more than 100% of GDP in the
 * World Bank's series: each is kept in TAX_HISTORY_LEFT_OUT, and the tab
 * says what was left out and why.
 *
 * Two things are worked out, and the tab says so of each:
 *   - the average of a rate in a year: the plain average over the
 *     jurisdictions the OECD gives that rate for in that year, each counted
 *     once whatever its size, with how many they were;
 *   - the European Union's rates: the plain average over those of its 27
 *     members the OECD gives the rate for, for the years every one of them
 *     has it; said to be of how many, and without whom; and not given at
 *     all where fewer than 25 are.
 * Nothing else is. The Tax Foundation's tables are not used: they are
 * licensed for non-commercial use only.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/taxHistory.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-tax-history");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const THIS_YEAR = Number(TODAY.slice(0, 4));
const FROM = 2000;
/** The members of the European Union, by ISO code. */
const EU = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];

/** A page, kept for a few days. Fetched with curl, as build-country-tax.cjs does: the OECD answers Node's own fetch with an error. */
async function cached(name, url, accept = "application/json", days = 3) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < days * 24 * 3600e3) return fs.readFileSync(at, "utf8");
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "300", "-A", UA, "-H", `Accept: ${accept}`, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
      return fs.readFileSync(at, "utf8");
    } catch (e) {
      fs.rmSync(at, { force: true });
      last = e;
      await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
  }
  throw new Error(`${url}: could not be fetched (${String(last.stderr || last.message).trim().slice(0, 160)})`);
}
const round = (v, dp) => Number(Number(v).toFixed(dp));

/** An OECD table as rows of named fields, a span of years at a time: the whole of it in one request is refused. */
async function oecd(flow, name) {
  const rows = [];
  for (let from = FROM; from <= THIS_YEAR; from += 9) {
    const to = Math.min(from + 8, THIS_YEAR);
    const text = await cached(`${name}-${from}-${to}.csv`, `https://sdmx.oecd.org/public/rest/data/${flow},/all?startPeriod=${from}&endPeriod=${to}&dimensionAtObservation=AllDimensions`, "application/vnd.sdmx.data+csv; charset=utf-8");
    const [head, ...lines] = text.trim().split(/\r?\n/);
    const cols = head.split(",");
    for (const l of lines) {
      const f = l.split(",");
      if (f.length !== cols.length) throw new Error(`${flow}: a row has ${f.length} fields, not ${cols.length}`);
      rows.push(Object.fromEntries(cols.map((c, i) => [c, f[i]])));
    }
  }
  return rows;
}

(async () => {
  const wbCountries = JSON.parse(await cached("wb-countries.json", "https://api.worldbank.org/v2/country?format=json&per_page=400", "application/json", 30))[1];
  const iso2Of = {};
  for (const c of wbCountries) if (c.region && c.region.id !== "NA" && /^[A-Z]{2}$/.test(c.iso2Code)) iso2Of[c.id] = c.iso2Code;
  if (Object.keys(iso2Of).length < 200) throw new Error(`only ${Object.keys(iso2Of).length} World Bank economies were read`);

  const out = {};
  const of = (iso2) => (out[iso2] ||= {});
  /** What the OECD's table gives that is not drawn: by country and by rate, the year and the figure. */
  const leftOut = {};

  /* ── The OECD's rates ── */
  /** The rows kept, as a series a country: [year, rate], oldest first. */
  const seriesOf = (rows, key, lo, hi) => {
    const by = {};
    for (const r of rows) {
      const iso2 = iso2Of[r.REF_AREA];
      const y = Number(r.TIME_PERIOD);
      const v = Number(r.OBS_VALUE);
      if (!iso2 || r.OBS_VALUE === "" || !Number.isFinite(v) || y > THIS_YEAR || y < FROM) continue;
      // A rate of more than the whole of what it is a rate on is not a rate that can be drawn: it is left out, and said to be.
      if (v > 100) {
        ((leftOut[iso2] ||= {})[key] ||= []).push([y, round(v, 1)]);
        continue;
      }
      if (v < lo || v > hi) throw new Error(`${key} of ${r.REF_AREA} in ${y}: ${v} is out of range`);
      if ((by[iso2] ||= new Map()).has(y)) throw new Error(`${key} of ${r.REF_AREA}: ${y} is given twice`);
      by[iso2].set(y, round(v, 2));
    }
    for (const [iso2, m] of Object.entries(by)) of(iso2)[key] = [...m.entries()].sort((a, b) => a[0] - b[0]);
    return by;
  };
  const cit = (await oecd("OECD.CTP.TPS,DSD_TAX_CIT@DF_CIT", "cit")).filter((r) => r.TARGETING === "ST");
  const central = seriesOf(cit.filter((r) => r.MEASURE === "CIT" && r.SECTOR === "S1311"), "central", 0, 80);
  const local = seriesOf(cit.filter((r) => r.MEASURE === "CIT_SCG" && r.SECTOR === "S13M"), "local", 0, 80);
  const combined = seriesOf(cit.filter((r) => r.MEASURE === "CIT_C" && r.SECTOR === "S13"), "combined", 0, 80);
  if (Object.keys(combined).length < 100) throw new Error("the OECD's corporate rates cover over a hundred jurisdictions");
  const pit = (await oecd("OECD.CTP.TPS,DSD_TAX_PIT@DF_PIT_TOP_EARN_THRESH", "pit")).filter((r) => r.MEASURE === "TS_PIT");
  const top = seriesOf(pit, "topIncome", 0, 90);
  if (Object.keys(top).length < 30) throw new Error("the OECD's top income tax rates cover its members");

  /** The plain average of a rate in each year, over the jurisdictions that have it, with how many they were. */
  const average = (by) => {
    const years = {};
    for (const m of Object.values(by)) for (const [y, v] of m) (years[y] ||= []).push(v);
    return Object.entries(years)
      .map(([y, vs]) => [Number(y), round(vs.reduce((a, v) => a + v, 0) / vs.length, 1), vs.length])
      .sort((a, b) => a[0] - b[0]);
  };
  /**
   * The European Union's: the plain average over the members the OECD gives the rate for, for the years every one of
   * those members has it - so each year is an average of the same countries. With fewer than 25 of the 27 it is not
   * the Union's in any fair sense, and none is given.
   */
  const euAmong = {};
  const union = (by, key) => {
    const held = EU.filter((cc) => by[cc]?.size);
    if (held.length < 25) return [];
    euAmong[key] = { among: held.length, without: EU.filter((cc) => !held.includes(cc)) };
    const years = new Set(held.flatMap((cc) => [...by[cc].keys()]));
    return [...years]
      .filter((y) => held.every((cc) => by[cc].has(y)))
      .sort((a, b) => a - b)
      .map((y) => [y, round(held.reduce((a, cc) => a + by[cc].get(y), 0) / held.length, 1)]);
  };
  /* ── The World Bank's revenue ── */
  const wb = JSON.parse(await cached("revenue.json", `https://api.worldbank.org/v2/country/all/indicator/GC.TAX.TOTL.GD.ZS?format=json&per_page=30000&date=1970:${THIS_YEAR}`))[1] ?? [];
  const revenue = {};
  const group = { WLD: new Map(), EUU: new Map() };
  for (const r of wb) {
    if (r.value == null) continue;
    const y = Number(r.date);
    const v = round(r.value, 1);
    if (v < 0) throw new Error(`tax revenue of ${r.countryiso3code} in ${y}: ${v}% of GDP is not a share`);
    const iso2 = iso2Of[r.countryiso3code];
    // Tax of more than the whole of GDP is not drawn (the Bank's series has 638.7% for Sudan in 1999): left out, and said to be.
    if (v > 100) {
      if (!iso2) throw new Error(`tax revenue of ${r.countryiso3code} in ${y}: ${v}% of GDP`);
      ((leftOut[iso2] ||= {}).revenue ||= []).push([y, v]);
      continue;
    }
    if (group[r.countryiso3code]) group[r.countryiso3code].set(y, v);
    if (iso2) (revenue[iso2] ||= new Map()).set(y, v);
  }
  if (Object.keys(revenue).length < 120) throw new Error(`tax revenue is given for only ${Object.keys(revenue).length} countries`);
  const sorted = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
  for (const [iso2, m] of Object.entries(revenue)) of(iso2).revenue = sorted(m);
  if (group.WLD.size < 10) throw new Error("the World Bank's figure for the world was not found");

  const eu = { central: union(central, "central"), local: union(local, "local"), combined: union(combined, "combined"), topIncome: union(top, "topIncome"), revenue: sorted(group.EUU) };
  const row = (c) => `{${Object.entries(c).filter(([, v]) => v && v.length).map(([k, v]) => `${k}:${JSON.stringify(v)}`).join(",")}}`;
  const codes = Object.keys(out).sort();

  fs.writeFileSync(
    OUT,
    `/**
 * Taxation over the years: the rates a country sets on companies' profits at
 * its centre and below it, its top rate on personal income, and what its
 * government takes in tax - each year by year, with an average beside it.
 *
 * GENERATED by build-tax-history.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * The rates are the OECD's (Tax Database, CC BY 4.0), statutory, from ${FROM};
 * the revenue is the World Bank's (World Development Indicators, CC BY 4.0,
 * from the IMF's Government Finance Statistics), every year it holds. Two
 * things are worked out here and are said to be wherever they are shown: the
 * average of a rate in a year - the plain average over the jurisdictions the
 * OECD gives it for, each counted once, with how many they were - and the
 * European Union's rates, the plain average over those of its 27 members
 * the OECD gives the rate for (TAX_EU_AMONG says how many, and without whom).
 */
export const TAX_HISTORY_RETRIEVED = "${TODAY}";
export const TAX_HISTORY_SOURCES = {
  corporate: { label: "OECD — Tax Database: corporate income tax, statutory rates of central and of sub-central government, and combined (CC BY 4.0)", url: "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_TAX_CIT%40DF_CIT&df[ag]=OECD.CTP.TPS" },
  income: { label: "OECD — Tax Database: top statutory personal income tax rate (CC BY 4.0)", url: "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_TAX_PIT%40DF_PIT_TOP_EARN_THRESH&df[ag]=OECD.CTP.TPS" },
  revenue: { label: "World Bank — World Development Indicators: tax revenue, % of GDP, from the IMF's Government Finance Statistics (CC BY 4.0)", url: "https://data.worldbank.org/indicator/GC.TAX.TOTL.GD.ZS" },
};

/** A figure a year, oldest first. */
export type TaxSeries = [year: number, value: number][];
/** An average a year, with how many jurisdictions it is of. */
export type TaxAverage = [year: number, value: number, among: number][];
export type TaxHistory = Partial<{
  /** The central government's statutory rate of corporate income tax, %: the federal rate, where there is a federation. */
  central: TaxSeries;
  /** The sub-central government's - state and local - statutory rate of corporate income tax, %, as the OECD gives one for the country. */
  local: TaxSeries;
  /** The two combined, %, as the OECD combines them. */
  combined: TaxSeries;
  /** The top statutory rate of personal income tax, %. */
  topIncome: TaxSeries;
  /** Tax revenue of the central government, % of GDP. */
  revenue: TaxSeries;
}>;

/** The plain average of each rate in each year over the jurisdictions the OECD gives it for: worked out here. */
export const TAX_AVERAGE: { central: TaxAverage; local: TaxAverage; combined: TaxAverage; topIncome: TaxAverage } = {
  central: ${JSON.stringify(average(central))},
  local: ${JSON.stringify(average(local))},
  combined: ${JSON.stringify(average(combined))},
  topIncome: ${JSON.stringify(average(top))},
};
/** The world's tax revenue, % of GDP: the World Bank's own figure. */
export const TAX_REVENUE_WORLD: TaxSeries = ${JSON.stringify(sorted(group.WLD))};
/** The European Union's: its rates the plain average over its members, worked out here; its revenue the World Bank's own figure for it. */
export const TAX_EU: TaxHistory = ${row(eu)};
/** How many of the Union's 27 members each of its averages is of, and which are not among them (by ISO code). A rate fewer than 25 are given for has no average. */
export const TAX_EU_AMONG: Partial<Record<keyof TaxHistory, { among: number; without: string[] }>> = ${JSON.stringify(euAmong)};

/** What the two bodies' tables give that is not drawn here - a rate, or a revenue, of more than 100% - by country and by series: the year and the figure as published. */
export const TAX_HISTORY_LEFT_OUT: Record<string, Partial<Record<keyof TaxHistory, TaxSeries>>> = ${JSON.stringify(leftOut)};

/** By ISO 3166-1 code. */
export const TAX_HISTORY: Record<string, TaxHistory> = {
${codes.map((cc) => `  ${cc}: ${row(out[cc])},`).join("\n")}
};
`,
  );
  const us = out.US;
  const last = (s) => (s?.length ? `${s[s.length - 1][1]} (${s[s.length - 1][0]})` : "none");
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${codes.length} countries`);
  console.log(`  rates: central ${Object.keys(central).length}, sub-central ${Object.keys(local).length}, combined ${Object.keys(combined).length}, top income ${Object.keys(top).length}; revenue ${Object.keys(revenue).length}`);
  console.log(`  United States: central ${last(us.central)}, sub-central ${last(us.local)}, combined ${last(us.combined)}, top income ${last(us.topIncome)}, revenue ${last(us.revenue)}; first years ${us.central?.[0]?.[0]}, ${us.topIncome?.[0]?.[0]}, ${us.revenue?.[0]?.[0]}`);
  console.log(`  European Union: combined ${last(eu.combined)} over ${eu.combined.length} years, top income ${last(eu.topIncome)}, revenue ${last(eu.revenue)}; ${JSON.stringify(euAmong)}`);
  console.log(`  left out: ${JSON.stringify(leftOut)}`);
  const avg = average(combined);
  console.log(`  average combined rate: ${avg[0].join(", ")} … ${avg[avg.length - 1].join(", ")}; world revenue ${last(sorted(group.WLD))}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
