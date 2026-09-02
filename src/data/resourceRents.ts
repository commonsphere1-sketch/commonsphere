/**
 * resourceRents.ts
 *
 * Natural-resource composition for the economies page, sourced from the World
 * Bank rather than hand-authored.
 *
 * The World Bank publishes resource rents as a share of GDP per country, which
 * is a real, comparable, annually-updated measure of what an economy actually
 * earns from each resource class. Coverage is 237-250 countries depending on
 * the indicator, the API needs no key, and it sends
 * Access-Control-Allow-Origin: *, so it works from the browser — the same
 * upstream the country figures already use.
 *
 * The numbers discriminate the way you would expect: Chile reads 16.2% mineral
 * rents, Saudi Arabia 23.7% oil, DR Congo 28.8% minerals and 9.4% forestry,
 * Germany effectively zero across every class.
 *
 * This replaces guesswork with a citation. Where the World Bank has no entry
 * for an economy — Taiwan is not a reporting economy, and Hong Kong reports
 * no resource rents — callers fall back to the curated data.
 */

export interface ResourceRent {
  /** Display label for the resource class. */
  name: string;
  /** Rent as a percentage of GDP, most recent non-null year. */
  pctOfGdp: number;
  /** Year the figure is from, so the UI can cite it. */
  year: string;
  color: string;
}

export interface EconomyRents {
  items: ResourceRent[];
  /** Total natural-resource rents as % of GDP. */
  totalPctOfGdp: number | null;
  year: string | null;
}

/** World Bank indicator codes for each resource class. */
const RENT_INDICATORS: { key: string; name: string; color: string }[] = [
  { key: "NY.GDP.PETR.RT.ZS", name: "Oil", color: "#f97316" },
  { key: "NY.GDP.NGAS.RT.ZS", name: "Natural gas", color: "#6366f1" },
  { key: "NY.GDP.COAL.RT.ZS", name: "Coal", color: "#64748b" },
  { key: "NY.GDP.MINR.RT.ZS", name: "Minerals", color: "#0ea5e9" },
  { key: "NY.GDP.FRST.RT.ZS", name: "Forestry", color: "#10b981" },
];

const TOTAL_INDICATOR = "NY.GDP.TOTL.RT.ZS";

/**
 * economiesData ids to World Bank alpha-3 codes.
 *
 * "eu-eco" maps to EUU, the World Bank's European Union aggregate, so the bloc
 * gets a real figure rather than nothing. Taiwan has no World Bank entry and is
 * deliberately absent — it falls back to curated data instead of showing zero,
 * which would read as "no resources" rather than "not reported".
 */
export const ECONOMY_ISO3: Record<string, string> = {
  "usa-eco": "USA",
  "china-eco": "CHN",
  "eu-eco": "EUU",
  "japan-eco": "JPN",
  "india-eco": "IND",
  "uk-eco": "GBR",
  "germany-eco": "DEU",
  "france-eco": "FRA",
  "brazil-eco": "BRA",
  "canada-eco": "CAN",
  "southkorea-eco": "KOR",
  "australia-eco": "AUS",
  "russia-eco": "RUS",
  "mexico-eco": "MEX",
  "indonesia-eco": "IDN",
  "netherlands-eco": "NLD",
  "saudiarabia-eco": "SAU",
  "turkey-eco": "TUR",
  "spain-eco": "ESP",
  "switzerland-eco": "CHE",
  "argentina-eco": "ARG",
  "uae-eco": "ARE",
  "poland-eco": "POL",
  "sweden-eco": "SWE",
  "belgium-eco": "BEL",
  "norway-eco": "NOR",
  "singapore-eco": "SGP",
  "malaysia-eco": "MYS",
  "israel-eco": "ISR",
  "colombia-eco": "COL",
  "egypt-eco": "EGY",
  "southafrica-eco": "ZAF",
  "thailand-eco": "THA",
  "denmark-eco": "DNK",
  "nigeria-eco": "NGA",
  "pakistan-eco": "PAK",
  "vietnam-eco": "VNM",
  "chile-eco": "CHL",
  "philippines-eco": "PHL",
  "bangladesh-eco": "BGD",
  "austria-eco": "AUT",
  "iran-eco": "IRN",
  "iraq-eco": "IRQ",
  "portugal-eco": "PRT",
  "czechia-eco": "CZE",
  "greece-eco": "GRC",
  "kuwait-eco": "KWT",
  "qatar-eco": "QAT",
  "ethiopia-eco": "ETH",
  "kenya-eco": "KEN",
  "ghana-eco": "GHA",
  "tanzania-eco": "TZA",
  "angola-eco": "AGO",
  "morocco-eco": "MAR",
  "mozambique-eco": "MOZ",
  "peru-eco": "PER",
  "venezuela-eco": "VEN",
  "ecuador-eco": "ECU",
  "myanmar-eco": "MMR",
  "cambodia-eco": "KHM",
  "srilanka-eco": "LKA",
  "nepal-eco": "NPL",
  "newzealand-eco": "NZL",
  "finland-eco": "FIN",
  "romania-eco": "ROU",
  "hungary-eco": "HUN",
  "ukraine-eco": "UKR",
  "slovakia-eco": "SVK",
  "bulgaria-eco": "BGR",
  "croatia-eco": "HRV",
  "serbia-eco": "SRB",
  "ireland-eco": "IRL",
  "italy-eco": "ITA",
  "hongkong-eco": "HKG",
  "uzbekistan-eco": "UZB",
  "kazakhstan-eco": "KAZ",
};

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type WBRow = { countryiso3code: string; value: number | null; date: string };

/**
 * One indicator for every country. per_page must clear the full row count —
 * the default page size silently truncates, which is how the country figures
 * came to be half-populated before.
 */
async function fetchIndicator(
  code: string,
): Promise<Map<string, { value: number; year: string }>> {
  const raw = await fetchJSON<[unknown, WBRow[]]>(
    `https://api.worldbank.org/v2/country/all/indicator/${code}` +
      `?format=json&mrv=3&per_page=20000`,
  );
  const out = new Map<string, { value: number; year: string }>();
  if (!raw || !Array.isArray(raw[1])) return out;
  for (const row of raw[1]) {
    const iso = row.countryiso3code?.toUpperCase();
    if (!iso || row.value == null || isNaN(row.value)) continue;
    // rows arrive newest-first, so the first non-null wins
    if (!out.has(iso)) out.set(iso, { value: row.value, year: row.date });
  }
  return out;
}

/**
 * Fetches every rent class in parallel and returns them keyed by economy id.
 * Resource classes worth less than 0.05% of GDP are dropped — they round to
 * "0.0%" and add noise rather than information.
 */
export async function fetchResourceRents(): Promise<
  Record<string, EconomyRents>
> {
  const [totals, ...perClass] = await Promise.all([
    fetchIndicator(TOTAL_INDICATOR),
    ...RENT_INDICATORS.map((i) => fetchIndicator(i.key)),
  ]);

  const out: Record<string, EconomyRents> = {};
  for (const [economyId, iso3] of Object.entries(ECONOMY_ISO3)) {
    const items: ResourceRent[] = [];
    let year: string | null = null;

    RENT_INDICATORS.forEach((ind, idx) => {
      const hit = perClass[idx].get(iso3);
      if (!hit || hit.value < 0.05) return;
      year = year ?? hit.year;
      items.push({
        name: ind.name,
        pctOfGdp: Math.round(hit.value * 100) / 100,
        year: hit.year,
        color: ind.color,
      });
    });

    if (!items.length) continue;
    items.sort((a, b) => b.pctOfGdp - a.pctOfGdp);
    const total = totals.get(iso3);
    out[economyId] = {
      items,
      totalPctOfGdp: total ? Math.round(total.value * 100) / 100 : null,
      year: total?.year ?? year,
    };
  }
  return out;
}
