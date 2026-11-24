#!/usr/bin/env node
/**
 * Builds src/data/worldRankings.ts - the nations at the top and the foot of the world, as asked: the richest and poorest
 * by output per person, and the largest manufacturers, for the World window on the Dashboard.
 *
 * Source: the World Bank's World Development Indicators (CC BY 4.0), read keyless from its API, each country's latest
 * year with a figure in the last six:
 *
 *   NY.GDP.PCAP.CD      GDP per person, current US$
 *   NY.GDP.PCAP.PP.CD   GDP per person at purchasing power parity, current international $
 *   NV.IND.MANF.CD      manufacturing value added, current US$ - with the world's, for each country's share of it
 *   NV.IND.TOTL.CD      industry (with construction) value added, current US$ - the world's
 *   NV.IND.TOTL.KD.ZG   industry value added, real growth - the world's
 *
 * Nations are the members of the United Nations and its two observer states (data/countryUn.ts), so that a territory
 * (Bermuda, Macao) is not ranked as a nation. A share of the world's manufacturing is a country's figure over the
 * world's for the same year, worked out here.
 *
 *   node build-world-rankings.cjs
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "src/data/worldRankings.ts");
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const API = "https://api.worldbank.org/v2";
const PAGE = (id) => `https://data.worldbank.org/indicator/${id}`;

// The nations: the UN's members and observers, by ISO 3166 alpha-2, read from the site's own file.
const unSrc = fs.readFileSync(path.join(__dirname, "src/data/countryUn.ts"), "utf8");
const MEMBERS = new Set([...unSrc.matchAll(/^\s{2}([A-Z]{2}): \{name:/gm)].map((m) => m[1]));
const OBSERVERS = /UN_OBSERVERS[^=]*= \{([^}]*)\}/.exec(unSrc);
for (const m of (OBSERVERS ? OBSERVERS[1] : "").matchAll(/([A-Z]{2}):/g)) MEMBERS.add(m[1]);
if (MEMBERS.size < 190) throw new Error(`Only ${MEMBERS.size} UN members and observers read`);

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return { json: await res.json(), date: res.headers.get("date") };
}

/** Each nation's latest figure for an indicator, in the last six years. */
async function latest(id, through) {
  const { json } = await get(`${API}/country/all/indicator/${id}?format=json&per_page=20000&date=${through - 5}:${through}`);
  const rows = json[1] || [];
  const best = new Map();
  for (const r of rows) {
    const cc = r.country && r.country.id;
    if (!cc || r.value == null || !MEMBERS.has(cc)) continue;
    const y = Number(r.date);
    if (!best.has(cc) || y > best.get(cc).year) best.set(cc, { cc, name: r.country.value, year: y, value: r.value });
  }
  return [...best.values()];
}
async function world(id) {
  const { json, date } = await get(`${API}/country/WLD/indicator/${id}?format=json&per_page=80&mrnev=1`);
  const r = (json[1] || [])[0];
  if (!r) throw new Error(`No world figure for ${id}`);
  return { year: Number(r.date), value: r.value, date };
}

(async () => {
  const w = await world("NV.IND.MANF.CD");
  const through = w.year;
  const gdpPc = await latest("NY.GDP.PCAP.CD", through);
  const gdpPcPpp = await latest("NY.GDP.PCAP.PP.CD", through);
  const manf = await latest("NV.IND.MANF.CD", through);
  // World manufacturing for each year a country's figure is for, so its share is of the same year.
  const { json: wm } = await get(`${API}/country/WLD/indicator/NV.IND.MANF.CD?format=json&per_page=80&date=${through - 5}:${through}`);
  const worldManf = new Map((wm[1] || []).filter((r) => r.value != null).map((r) => [Number(r.date), r.value]));
  const industry = await world("NV.IND.TOTL.CD");
  const industryGrowth = await world("NV.IND.TOTL.KD.ZG");

  const top = (rows, n, dir) => [...rows].sort((a, b) => (dir === "desc" ? b.value - a.value : a.value - b.value)).slice(0, n);
  const round = (v, dp = 0) => Number(v.toFixed(dp));
  const pick = (r) => ({ cc: r.cc, name: r.name, year: r.year, value: round(r.value) });

  const RANKINGS = {
    richest: top(gdpPc, 10, "desc").map(pick),
    poorest: top(gdpPc, 10, "asc").map(pick),
    richestPpp: top(gdpPcPpp, 10, "desc").map(pick),
    poorestPpp: top(gdpPcPpp, 10, "asc").map(pick),
    nations: { gdpPerPerson: gdpPc.length, gdpPerPersonPpp: gdpPcPpp.length, manufacturing: manf.length, of: MEMBERS.size },
    manufacturers: top(manf, 10, "desc").map((r) => ({
      ...pick(r),
      share: worldManf.has(r.year) ? round((100 * r.value) / worldManf.get(r.year), 1) : null,
    })),
    worldManufacturing: { year: w.year, value: round(w.value) },
    worldIndustry: { year: industry.year, value: round(industry.value) },
    worldIndustryGrowth: { year: industryGrowth.year, value: round(industryGrowth.value, 2) },
  };

  const built = new Date(w.date || Date.now()).toISOString().slice(0, 10);
  const SOURCES = {
    gdpPerPerson: { label: "World Bank - World Development Indicators, GDP per capita (current US$), NY.GDP.PCAP.CD", url: PAGE("NY.GDP.PCAP.CD") },
    gdpPerPersonPpp: { label: "World Bank - World Development Indicators, GDP per capita, PPP (current international $), NY.GDP.PCAP.PP.CD", url: PAGE("NY.GDP.PCAP.PP.CD") },
    manufacturing: { label: "World Bank - World Development Indicators, manufacturing value added (current US$), NV.IND.MANF.CD", url: PAGE("NV.IND.MANF.CD") },
    industry: { label: "World Bank - World Development Indicators, industry (including construction) value added, NV.IND.TOTL.CD and NV.IND.TOTL.KD.ZG", url: PAGE("NV.IND.TOTL.CD") },
  };
  const out = `// GENERATED by build-world-rankings.cjs on ${built} - do not edit by hand.
// Source: World Bank, World Development Indicators (CC BY 4.0), via its API; nations are the UN's members and observers.

export interface NationFigure {
  cc: string;
  name: string;
  /** The year of its latest figure. */
  year: number;
  value: number;
  /** Its share of the world's for the same year, worked out here. */
  share?: number | null;
}

export const WORLD_RANKINGS: {
  richest: NationFigure[];
  poorest: NationFigure[];
  richestPpp: NationFigure[];
  poorestPpp: NationFigure[];
  /** How many nations had a figure for each, of how many. */
  nations: { gdpPerPerson: number; gdpPerPersonPpp: number; manufacturing: number; of: number };
  manufacturers: NationFigure[];
  worldManufacturing: { year: number; value: number };
  worldIndustry: { year: number; value: number };
  worldIndustryGrowth: { year: number; value: number };
} = ${JSON.stringify(RANKINGS)};

export const WORLD_RANKINGS_SOURCES = ${JSON.stringify(SOURCES)};
`;
  fs.writeFileSync(OUT, out);
  const line = (r) => `${r.name} ${r.value.toLocaleString("en-US")} (${r.year})`;
  console.log("richest:", RANKINGS.richest.slice(0, 5).map(line).join("; "));
  console.log("poorest:", RANKINGS.poorest.slice(0, 5).map(line).join("; "));
  console.log("manufacturers:", RANKINGS.manufacturers.slice(0, 5).map((r) => `${line(r)} ${r.share}%`).join("; "));
  console.log("nations:", JSON.stringify(RANKINGS.nations), "industry", JSON.stringify(RANKINGS.worldIndustry), JSON.stringify(RANKINGS.worldIndustryGrowth));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
