/**
 * liveData.ts
 * Fetches live economic + demographic data from free public APIs and merges
 * it into the existing static data structures.
 *
 * Verified status of each upstream (tested 2026-08-29):
 *
 *   - World Bank  https://api.worldbank.org/v2/   WORKS from the browser.
 *       Sends Access-Control-Allow-Origin: *. Patches ~200 of 204 countries.
 *
 *   - BLS         https://api.bls.gov/publicAPI/v2/   BLOCKED in the browser.
 *       Sends no Access-Control-Allow-Origin, and our JSON POST triggers a
 *       preflight it rejects, so state unemployment never reaches the page.
 *       It works fine server-side — it needs a proxy/serverless route, not a
 *       client fix. The call is left in place for whenever that exists.
 *
 *   - Census ACS  https://api.census.gov/data/   NEEDS AN API KEY.
 *       Unauthenticated requests return an HTML "Missing Key" page with
 *       HTTP 200. Set VITE_CENSUS_API_KEY to enable; see fetchCensusStateData.
 */

import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LiveCountryPatch {
  /** ISO alpha-2 code used as the join key */
  code: string;
  population?: number;
  gdp?: number; // billions USD
  gdpPerCapita?: number;
  gdpGrowth?: number;
  inflationRate?: number;
  unemploymentRate?: number;
  lifeExpectancy?: number;
}

export interface LiveDataResult {
  countries: Country[]; // merged static + live
  states: USState[]; // merged static + live
  patchedCount: number; // how many entries were actually updated
  lastUpdated: Date;
  source: string;
}

// ── US State live patch ────────────────────────────────────────────────────
export interface LiveStatePatch {
  /** FIPS code string, e.g. "06" for CA */
  fips: string;
  unemploymentRate?: number;
  medianIncome?: number;
  population?: number;
}

// ── World Bank indicator codes ─────────────────────────────────────────────

const WB_INDICATORS: Record<string, string> = {
  gdpUsd: "NY.GDP.MKTP.CD", // GDP (current US$)
  gdpGrowth: "NY.GDP.MKTP.KD.ZG", // GDP growth (annual %)
  gdpPerCapita: "NY.GDP.PCAP.CD", // GDP per capita (current US$)
  inflation: "FP.CPI.TOTL.ZG", // Inflation, consumer prices (annual %)
  unemployment: "SL.UEM.TOTL.ZS", // Unemployment, total (% of labor force)
  lifeExpect: "SP.DYN.LE00.IN", // Life expectancy at birth, total (years)
  population: "SP.POP.TOTL", // Population, total
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(
  url: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, ...init });
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

// per_page must exceed the total row count: mrv=3 across ~265 entities is ~795
// rows, so the old per_page=500 returned only page 1 of 2. Page 1 also leads
// with ~43 regional aggregates (AFE, ARB, ...), so barely half our countries
// were reachable — measured 108 of 204 patched before, 200 of 204 after.
async function fetchWBIndicator(
  indicator: string,
): Promise<Map<string, number>> {
  const url =
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}` +
    `?format=json&mrv=3&per_page=20000`;

  const raw =
    await fetchJSON<
      [unknown, { countryiso3code: string; value: number | null }[]]
    >(url);
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
  US: "USA",
  CA: "CAN",
  MX: "MEX",
  GT: "GTM",
  CU: "CUB",
  HT: "HTI",
  DO: "DOM",
  HN: "HND",
  SV: "SLV",
  NI: "NIC",
  CR: "CRI",
  PA: "PAN",
  JM: "JAM",
  TT: "TTO",
  BZ: "BLZ",
  BR: "BRA",
  AR: "ARG",
  CL: "CHL",
  CO: "COL",
  PE: "PER",
  VE: "VEN",
  EC: "ECU",
  BO: "BOL",
  PY: "PRY",
  UY: "URY",
  GY: "GUY",
  SR: "SUR",
  DE: "DEU",
  FR: "FRA",
  GB: "GBR",
  IT: "ITA",
  ES: "ESP",
  NL: "NLD",
  CH: "CHE",
  SE: "SWE",
  NO: "NOR",
  DK: "DNK",
  FI: "FIN",
  PL: "POL",
  BE: "BEL",
  AT: "AUT",
  PT: "PRT",
  GR: "GRC",
  CZ: "CZE",
  RO: "ROU",
  HU: "HUN",
  UA: "UKR",
  SK: "SVK",
  HR: "HRV",
  RS: "SRB",
  BG: "BGR",
  EE: "EST",
  LV: "LVA",
  LT: "LTU",
  SI: "SVN",
  IE: "IRL",
  BY: "BLR",
  MD: "MDA",
  AL: "ALB",
  MK: "MKD",
  BA: "BIH",
  ME: "MNE",
  LU: "LUX",
  CY: "CYP",
  MT: "MLT",
  IS: "ISL",
  RU: "RUS",
  CN: "CHN",
  JP: "JPN",
  IN: "IND",
  KR: "KOR",
  SA: "SAU",
  ID: "IDN",
  TR: "TUR",
  TH: "THA",
  MY: "MYS",
  SG: "SGP",
  PH: "PHL",
  VN: "VNM",
  PK: "PAK",
  BD: "BGD",
  AE: "ARE",
  IL: "ISR",
  IR: "IRN",
  IQ: "IRQ",
  KZ: "KAZ",
  UZ: "UZB",
  MM: "MMR",
  KH: "KHM",
  LK: "LKA",
  NP: "NPL",
  JO: "JOR",
  LB: "LBN",
  SY: "SYR",
  YE: "YEM",
  OM: "OMN",
  QA: "QAT",
  KW: "KWT",
  BH: "BHR",
  AM: "ARM",
  AZ: "AZE",
  GE: "GEO",
  TM: "TKM",
  KG: "KGZ",
  TJ: "TJK",
  AF: "AFG",
  MN: "MNG",
  KP: "PRK",
  LA: "LAO",
  TL: "TLS",
  BN: "BRN",
  NG: "NGA",
  ET: "ETH",
  EG: "EGY",
  CD: "COD",
  TZ: "TZA",
  KE: "KEN",
  ZA: "ZAF",
  GH: "GHA",
  AO: "AGO",
  MA: "MAR",
  DZ: "DZA",
  SD: "SDN",
  UG: "UGA",
  CI: "CIV",
  CM: "CMR",
  SN: "SEN",
  ZW: "ZWE",
  MZ: "MOZ",
  MG: "MDG",
  ZM: "ZMB",
  ML: "MLI",
  BF: "BFA",
  NE: "NER",
  TN: "TUN",
  LY: "LBY",
  RW: "RWA",
  BJ: "BEN",
  SS: "SSD",
  SO: "SOM",
  ER: "ERI",
  DJ: "DJI",
  BI: "BDI",
  MW: "MWI",
  NA: "NAM",
  BW: "BWA",
  MU: "MUS",
  SZ: "SWZ",
  LS: "LSO",
  GM: "GMB",
  GN: "GIN",
  GW: "GNB",
  SL: "SLE",
  LR: "LBR",
  TG: "TGO",
  GA: "GAB",
  CG: "COG",
  CF: "CAF",
  TD: "TCD",
  CV: "CPV",
  SC: "SYC",
  ST: "STP",
  GQ: "GNQ",
  KM: "COM",
  AU: "AUS",
  NZ: "NZL",
  PG: "PNG",
  FJ: "FJI",
  SB: "SLB",
  VU: "VUT",
  WS: "WSM",
  TO: "TON",
  KI: "KIR",
  FM: "FSM",
  PW: "PLW",
  MH: "MHL",
  NR: "NRU",
  TV: "TUV",
  // Added after an audit found these 22 countries in our dataset had no
  // alpha-3 mapping and were therefore skipped by every live refresh.
  XK: "XKX",
  PR: "PRI",
  GU: "GUM",
  BM: "BMU",
  FO: "FRO",
  GL: "GRL",
  BS: "BHS",
  AG: "ATG",
  DM: "DMA",
  GD: "GRD",
  BB: "BRB",
  LC: "LCA",
  VC: "VCT",
  KN: "KNA",
  MV: "MDV",
  BT: "BTN",
  SM: "SMR",
  LI: "LIE",
  AD: "AND",
  MC: "MCO",
  MR: "MRT",
  PS: "PSE",
  // TW, EH, CK and NU are intentionally absent: the World Bank does not
  // publish these as reporting economies, so they keep their static values.
};

// ── FIPS → state abbreviation map (BLS / Census use FIPS codes) ────────────
const FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

/**
 * State-level unemployment from BLS.
 *
 * Disabled, and not because it is unimplemented — the request below is
 * correct, but api.bls.gov sends no Access-Control-Allow-Origin header, so the
 * browser refuses the response every time. The call therefore could not ever
 * succeed from a static front end; all it did was throw a CORS error into the
 * console on every page load and burn a request. The catch swallowed the
 * failure, so the app looked fine while doing this on repeat.
 *
 * The code is kept rather than deleted because it is exactly what a server-side
 * proxy would run. Route it through one, or through a Supabase edge function,
 * and flip this flag.
 */
const BLS_REACHABLE_FROM_BROWSER = false;

async function fetchBLSStateUnemployment(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!BLS_REACHABLE_FROM_BROWSER) return out;
  try {
    // Series IDs for state unemployment: "LAUST" + FIPS(2) + "0000000000003"
    // We batch all 50 states in one request (BLS allows up to 50 series/request)
    const fipsList = Object.keys(FIPS_TO_ABBR);
    const seriesIds = fipsList.map((f) => `LAUST${f}0000000000003`);

    const body = JSON.stringify({
      seriesid: seriesIds,
      latest: true,
    });

    const res = await fetchJSON<{
      status: string;
      Results?: {
        series: Array<{
          seriesID: string;
          data: Array<{ value: string; latest?: string }>;
        }>;
      };
    }>("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!res || res.status !== "REQUEST_SUCCEEDED" || !res.Results) return out;

    for (const series of res.Results.series) {
      const fips = series.seriesID.slice(5, 7);
      const abbr = FIPS_TO_ABBR[fips];
      if (!abbr) continue;
      const latestEntry =
        series.data.find((d) => d.latest === "true") ?? series.data[0];
      if (!latestEntry) continue;
      const val = parseFloat(latestEntry.value);
      if (!isNaN(val)) out.set(abbr, val);
    }
  } catch {
    // silently fall back
  }
  return out;
}

/**
 * Fetch state-level median household income + population from the Census ACS 1-Year.
 * Endpoint: https://api.census.gov/data/2022/acs/acs1?get=B19013_001E,B01003_001E&for=state:*
 */
/**
 * The Census API rejects unauthenticated requests with an HTML "Missing Key"
 * page (HTTP 200), which JSON-parses to null and was previously swallowed in
 * silence — so state median income and population never actually refreshed.
 * Supply a free key (https://api.census.gov/data/key_signup.html) as
 * VITE_CENSUS_API_KEY to enable it. Without a key we skip the call outright
 * and report it, rather than pretending the data is live.
 */
export const CENSUS_API_KEY: string | undefined = (
  import.meta as unknown as { env?: Record<string, string | undefined> }
).env?.VITE_CENSUS_API_KEY;

let censusWarned = false;

async function fetchCensusStateData(): Promise<
  Map<string, { medianIncome?: number; population?: number }>
> {
  const out = new Map<string, { medianIncome?: number; population?: number }>();
  if (!CENSUS_API_KEY) {
    if (!censusWarned) {
      censusWarned = true;
      console.warn(
        "[liveData] No VITE_CENSUS_API_KEY set — state median income and " +
          "population will keep their static values. Get a free key at " +
          "https://api.census.gov/data/key_signup.html",
      );
    }
    return out;
  }
  try {
    const url =
      "https://api.census.gov/data/2023/acs/acs1?get=NAME,B19013_001E,B01003_001E&for=state:*" +
      `&key=${encodeURIComponent(CENSUS_API_KEY)}`;
    const raw = await fetchJSON<string[][]>(url);
    if (!Array.isArray(raw) || raw.length < 2) return out;

    // First row is headers: ["NAME","B19013_001E","B01003_001E","state"]
    const [header, ...rows] = raw;
    const nameIdx = header.indexOf("NAME");
    const incomeIdx = header.indexOf("B19013_001E");
    const popIdx = header.indexOf("B01003_001E");
    const fipsIdx = header.indexOf("state");
    if (fipsIdx < 0) return out;

    for (const row of rows) {
      const fips = row[fipsIdx]?.padStart(2, "0");
      const abbr = fips ? FIPS_TO_ABBR[fips] : undefined;
      if (!abbr) continue;
      const income = incomeIdx >= 0 ? parseInt(row[incomeIdx]) : NaN;
      const pop = popIdx >= 0 ? parseInt(row[popIdx]) : NaN;
      out.set(abbr, {
        medianIncome: isNaN(income) || income < 0 ? undefined : income,
        population: isNaN(pop) || pop < 0 ? undefined : pop,
      });
    }
  } catch {
    // silently fall back
  }
  return out;
}

// ── Main export ────────────────────────────────────────────────────────────

export async function fetchLiveCountryData(): Promise<LiveDataResult> {
  // Fire all fetches in parallel — World Bank for countries, BLS + Census for states
  const [
    gdpMap,
    growthMap,
    gdpPCMap,
    inflMap,
    unempMap,
    lifeMap,
    popMap,
    blsUnempMap,
    censusMap,
  ] = await Promise.all([
    fetchWBIndicator(WB_INDICATORS.gdpUsd),
    fetchWBIndicator(WB_INDICATORS.gdpGrowth),
    fetchWBIndicator(WB_INDICATORS.gdpPerCapita),
    fetchWBIndicator(WB_INDICATORS.inflation),
    fetchWBIndicator(WB_INDICATORS.unemployment),
    fetchWBIndicator(WB_INDICATORS.lifeExpect),
    fetchWBIndicator(WB_INDICATORS.population),
    fetchBLSStateUnemployment(),
    fetchCensusStateData(),
  ]);

  let patchedCount = 0;

  // ── Merge countries ────────────────────────────────────────────────────
  const mergedCountries: Country[] = countriesData.map((c) => {
    const iso3 = ALPHA2_TO_3[c.code];
    if (!iso3) return c;

    const gdpRaw = gdpMap.get(iso3);
    const growth = growthMap.get(iso3);
    const gdpPC = gdpPCMap.get(iso3);
    const infl = inflMap.get(iso3);
    const unemp = unempMap.get(iso3);
    const lifeExp = lifeMap.get(iso3);
    const popRaw = popMap.get(iso3);

    const hasAny =
      gdpRaw || growth || gdpPC || infl || unemp || lifeExp || popRaw;
    if (!hasAny) return c;

    patchedCount++;
    return {
      ...c,
      ...(popRaw != null ? { population: Math.round(popRaw) } : {}),
      // gdp is stored in billions USD. Math.round() alone flattened every
      // economy under $500M to 0 (Tuvalu, Nauru, Niue, ...), so keep
      // 3 decimals below $10B and whole billions above it.
      ...(gdpRaw != null
        ? {
            gdp:
              gdpRaw >= 1e10
                ? Math.round(gdpRaw / 1e9)
                : parseFloat((gdpRaw / 1e9).toFixed(3)),
          }
        : {}),
      ...(gdpPC != null ? { gdpPerCapita: Math.round(gdpPC) } : {}),
      ...(growth != null ? { gdpGrowth: parseFloat(growth.toFixed(1)) } : {}),
      ...(infl != null ? { inflationRate: parseFloat(infl.toFixed(1)) } : {}),
      ...(unemp != null
        ? { unemploymentRate: parseFloat(unemp.toFixed(1)) }
        : {}),
      ...(lifeExp != null
        ? { lifeExpectancy: parseFloat(lifeExp.toFixed(1)) }
        : {}),
    };
  });

  // ── Merge US states ────────────────────────────────────────────────────
  const mergedStates: USState[] = usStatesData.map((s) => {
    const abbr = s.abbreviation;
    const blsUnemp = blsUnempMap.get(abbr);
    const census = censusMap.get(abbr);

    const hasAny =
      blsUnemp != null ||
      census?.medianIncome != null ||
      census?.population != null;
    if (!hasAny) return s;

    patchedCount++;
    return {
      ...s,
      ...(blsUnemp != null
        ? { unemploymentRate: parseFloat(blsUnemp.toFixed(1)) }
        : {}),
      ...(census?.medianIncome != null
        ? { medianIncome: census.medianIncome }
        : {}),
      ...(census?.population != null ? { population: census.population } : {}),
    };
  });

  return {
    countries: mergedCountries,
    states: mergedStates,
    patchedCount,
    lastUpdated: new Date(),
    // Names only the providers that actually returned something. The old value
    // was the fixed string "World Bank · BLS · US Census Bureau", which
    // credited all three whatever happened — BLS is unreachable from the
    // browser and Census stays idle without a key, so in practice it was
    // crediting two sources that contributed nothing.
    source: [
      "World Bank",
      ...(blsUnempMap.size ? ["BLS"] : []),
      ...(censusMap.size ? ["US Census Bureau"] : []),
    ].join(" · "),
  };
}
