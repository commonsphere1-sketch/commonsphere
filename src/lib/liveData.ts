/**
 * liveData.ts
 * Fetches live economic + demographic data from free public APIs and merges
 * it into the existing static data structures.
 *
 * APIs used (no auth required, CORS-friendly):
 *   - REST Countries:  https://restcountries.com/v3.1/
 *   - World Bank:      https://api.worldbank.org/v2/
 */

import { countriesData, type Country } from "../data/countriesData";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LiveCountryPatch {
  /** ISO alpha-2 code used as the join key */
  code: string;
  population?: number;
  gdp?: number;           // billions USD
  gdpPerCapita?: number;
  gdpGrowth?: number;
  inflationRate?: number;
  unemploymentRate?: number;
  lifeExpectancy?: number;
}

export interface LiveDataResult {
  countries: Country[];           // merged static + live
  patchedCount: number;           // how many entries were actually updated
  lastUpdated: Date;
  source: string;
}

// ── World Bank indicator codes ─────────────────────────────────────────────

const WB_INDICATORS: Record<string, string> = {
  gdpUsd:        "NY.GDP.MKTP.CD",   // GDP (current US$)
  gdpGrowth:     "NY.GDP.MKTP.KD.ZG",// GDP growth (annual %)
  gdpPerCapita:  "NY.GDP.PCAP.CD",   // GDP per capita (current US$)
  inflation:     "FP.CPI.TOTL.ZG",   // Inflation, consumer prices (annual %)
  unemployment:  "SL.UEM.TOTL.ZS",   // Unemployment, total (% of labor force)
  lifeExpect:    "SP.DYN.LE00.IN",   // Life expectancy at birth, total (years)
  population:    "SP.POP.TOTL",      // Population, total
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Returns the most recent non-null value from a World Bank timeseries */
function latestValue(entries: { value: number | null }[]): number | null {
  for (const e of entries) {
    if (e.value !== null && !isNaN(e.value)) return e.value;
  }
  return null;
}

// ── World Bank fetch (one indicator for all countries at once) ─────────────

async function fetchWBIndicator(indicator: string): Promise<Map<string, number>> {
  const url =
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}` +
    `?format=json&mrv=3&per_page=500`;

  const raw = await fetchJSON<[unknown, { countryiso3code: string; value: number | null }[]]>(url);
  const out = new Map<string, number>();
  if (!raw || !Array.isArray(raw[1])) return out;

  // Group by country code and take most-recent non-null
  const grouped = new Map<string, { value: number | null }[]>();
  for (const row of raw[1]) {
    const iso3 = row.countryiso3code?.toUpperCase();
    if (!iso3) continue;
    if (!grouped.has(iso3)) grouped.set(iso3, []);
    grouped.get(iso3)!.push({ value: row.value });
  }
  for (const [iso3, entries] of grouped) {
    const v = latestValue(entries);
    if (v !== null) out.set(iso3, v);
  }
  return out;
}

// ── ISO alpha-2 → alpha-3 map (only for countries in our dataset) ──────────
// World Bank uses alpha-3 codes; our data uses alpha-2.

const ALPHA2_TO_3: Record<string, string> = {
  US:"USA", CA:"CAN", MX:"MEX", GT:"GTM", CU:"CUB", HT:"HTI", DO:"DOM", HN:"HND",
  SV:"SLV", NI:"NIC", CR:"CRI", PA:"PAN", JM:"JAM", TT:"TTO", BZ:"BLZ",
  BR:"BRA", AR:"ARG", CL:"CHL", CO:"COL", PE:"PER", VE:"VEN", EC:"ECU", BO:"BOL",
  PY:"PRY", UY:"URY", GY:"GUY", SR:"SUR",
  DE:"DEU", FR:"FRA", GB:"GBR", IT:"ITA", ES:"ESP", NL:"NLD", CH:"CHE", SE:"SWE",
  NO:"NOR", DK:"DNK", FI:"FIN", PL:"POL", BE:"BEL", AT:"AUT", PT:"PRT", GR:"GRC",
  CZ:"CZE", RO:"ROU", HU:"HUN", UA:"UKR", SK:"SVK", HR:"HRV", RS:"SRB", BG:"BGR",
  EE:"EST", LV:"LVA", LT:"LTU", SI:"SVN", IE:"IRL", BY:"BLR", MD:"MDA", AL:"ALB",
  MK:"MKD", BA:"BIH", ME:"MNE", LU:"LUX", CY:"CYP", MT:"MLT", IS:"ISL", RU:"RUS",
  CN:"CHN", JP:"JPN", IN:"IND", KR:"KOR", SA:"SAU", ID:"IDN", TR:"TUR", TH:"THA",
  MY:"MYS", SG:"SGP", PH:"PHL", VN:"VNM", PK:"PAK", BD:"BGD", AE:"ARE", IL:"ISR",
  IR:"IRN", IQ:"IRQ", KZ:"KAZ", UZ:"UZB", MM:"MMR", KH:"KHM", LK:"LKA", NP:"NPL",
  JO:"JOR", LB:"LBN", SY:"SYR", YE:"YEM", OM:"OMN", QA:"QAT", KW:"KWT", BH:"BHR",
  AM:"ARM", AZ:"AZE", GE:"GEO", TM:"TKM", KG:"KGZ", TJ:"TJK", AF:"AFG", MN:"MNG",
  KP:"PRK", LA:"LAO", TL:"TLS", BN:"BRN",
  NG:"NGA", ET:"ETH", EG:"EGY", CD:"COD", TZ:"TZA", KE:"KEN", ZA:"ZAF", GH:"GHA",
  AO:"AGO", MA:"MAR", DZ:"DZA", SD:"SDN", UG:"UGA", CI:"CIV", CM:"CMR", SN:"SEN",
  ZW:"ZWE", MZ:"MOZ", MG:"MDG", ZM:"ZMB", ML:"MLI", BF:"BFA", NE:"NER", TN:"TUN",
  LY:"LBY", RW:"RWA", BJ:"BEN", SS:"SSD", SO:"SOM", ER:"ERI", DJ:"DJI", BI:"BDI",
  MW:"MWI", NA:"NAM", BW:"BWA", MU:"MUS", SZ:"SWZ", LS:"LSO", GM:"GMB", GN:"GIN",
  GW:"GNB", SL:"SLE", LR:"LBR", TG:"TGO", GA:"GAB", CG:"COG", CF:"CAF", TD:"TCD",
  CV:"CPV", SC:"SYC", ST:"STP", GQ:"GNQ", KM:"COM",
  AU:"AUS", NZ:"NZL", PG:"PNG", FJ:"FJI", SB:"SLB", VU:"VUT", WS:"WSM", TO:"TON",
  KI:"KIR", FM:"FSM", PW:"PLW", MH:"MHL", NR:"NRU", TV:"TUV",
};

// ── Main export ────────────────────────────────────────────────────────────

export async function fetchLiveCountryData(): Promise<LiveDataResult> {
  // Fire all WB indicator fetches in parallel
  const [gdpMap, growthMap, gdpPCMap, inflMap, unempMap, lifeMap, popMap] =
    await Promise.all([
      fetchWBIndicator(WB_INDICATORS.gdpUsd),
      fetchWBIndicator(WB_INDICATORS.gdpGrowth),
      fetchWBIndicator(WB_INDICATORS.gdpPerCapita),
      fetchWBIndicator(WB_INDICATORS.inflation),
      fetchWBIndicator(WB_INDICATORS.unemployment),
      fetchWBIndicator(WB_INDICATORS.lifeExpect),
      fetchWBIndicator(WB_INDICATORS.population),
    ]);

  let patchedCount = 0;

  const merged: Country[] = countriesData.map((c) => {
    const iso3 = ALPHA2_TO_3[c.code];
    if (!iso3) return c;

    const gdpRaw  = gdpMap.get(iso3);
    const growth  = growthMap.get(iso3);
    const gdpPC   = gdpPCMap.get(iso3);
    const infl    = inflMap.get(iso3);
    const unemp   = unempMap.get(iso3);
    const lifeExp = lifeMap.get(iso3);
    const popRaw  = popMap.get(iso3);

    const hasAny = gdpRaw || growth || gdpPC || infl || unemp || lifeExp || popRaw;
    if (!hasAny) return c;

    patchedCount++;
    return {
      ...c,
      ...(popRaw  != null ? { population: Math.round(popRaw) } : {}),
      ...(gdpRaw  != null ? { gdp: Math.round(gdpRaw / 1e9) } : {}),      // USD → billions
      ...(gdpPC   != null ? { gdpPerCapita: Math.round(gdpPC) } : {}),
      ...(growth  != null ? { gdpGrowth: parseFloat(growth.toFixed(1)) } : {}),
      ...(infl    != null ? { inflationRate: parseFloat(infl.toFixed(1)) } : {}),
      ...(unemp   != null ? { unemploymentRate: parseFloat(unemp.toFixed(1)) } : {}),
      ...(lifeExp != null ? { lifeExpectancy: parseFloat(lifeExp.toFixed(1)) } : {}),
    };
  });

  return {
    countries: merged,
    patchedCount,
    lastUpdated: new Date(),
    source: "World Bank Open Data API",
  };
}
