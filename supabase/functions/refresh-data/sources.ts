/**
 * Fetching and parsing for the refresh-data function, kept free of Deno and
 * Supabase APIs so it can be run and checked on its own.
 *
 * Every source here is one the build scripts already use, read the same way,
 * so a refreshed figure means exactly what the built one did:
 *
 *   World Bank WDI   the country series of build-country-indicators.cjs and
 *                    build-economy-indicators.cjs, latest year per country
 *                    within the same eight-year window (mrv=8)
 *   BLS LAUS         state unemployment rate, seasonally adjusted, latest
 *                    month, through the public API (as build-states.cjs)
 *   Wikidata         current governors, with build-states.cjs's checks; and
 *                    dated upcoming elections in each state
 *   BEA              its published release schedule, for the state GDP and
 *                    personal income releases
 *
 * Values are stored unrounded; each page rounds them as it rounds the built
 * figure. Nothing is estimated: a series that fails or looks wrong is not
 * written, and the site keeps the figure it was built with.
 */

export const UA = "commonsphere-data-refresh/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";

export type FigureRow = {
  source: "wb" | "bls" | "wikidata";
  series: string;
  area: string;
  period: string;
  value: number | null;
  text_value?: string | null;
  detail?: Record<string, unknown> | null;
};

export type EventRow = {
  id: string;
  scope: "states";
  area: string | null;
  kind: string;
  title: string;
  event_date: string;
  source: "wikidata" | "bea";
  source_url: string;
};

/** The World Bank series the site uses, for countries and economies. */
export const WB_SERIES = [
  "SP.POP.TOTL",
  "NY.GDP.MKTP.CD",
  "NY.GDP.PCAP.CD",
  "NY.GDP.MKTP.KD.ZG",
  "SP.DYN.LE00.IN",
  "SL.UEM.TOTL.ZS",
  "FP.CPI.TOTL.ZG",
  "BX.KLT.DINV.CD.WD",
];

/** State id (postal code) → name and Census FIPS code, checked against the Census file. */
export const STATES: Record<string, [string, string]> = {
  al: ["Alabama", "01"], ak: ["Alaska", "02"], az: ["Arizona", "04"], ar: ["Arkansas", "05"],
  ca: ["California", "06"], co: ["Colorado", "08"], ct: ["Connecticut", "09"], de: ["Delaware", "10"],
  fl: ["Florida", "12"], ga: ["Georgia", "13"], hi: ["Hawaii", "15"], id: ["Idaho", "16"],
  il: ["Illinois", "17"], in: ["Indiana", "18"], ia: ["Iowa", "19"], ks: ["Kansas", "20"],
  ky: ["Kentucky", "21"], la: ["Louisiana", "22"], me: ["Maine", "23"], md: ["Maryland", "24"],
  ma: ["Massachusetts", "25"], mi: ["Michigan", "26"], mn: ["Minnesota", "27"], ms: ["Mississippi", "28"],
  mo: ["Missouri", "29"], mt: ["Montana", "30"], ne: ["Nebraska", "31"], nv: ["Nevada", "32"],
  nh: ["New Hampshire", "33"], nj: ["New Jersey", "34"], nm: ["New Mexico", "35"], ny: ["New York", "36"],
  nc: ["North Carolina", "37"], nd: ["North Dakota", "38"], oh: ["Ohio", "39"], ok: ["Oklahoma", "40"],
  or: ["Oregon", "41"], pa: ["Pennsylvania", "42"], ri: ["Rhode Island", "44"], sc: ["South Carolina", "45"],
  sd: ["South Dakota", "46"], tn: ["Tennessee", "47"], tx: ["Texas", "48"], ut: ["Utah", "49"],
  vt: ["Vermont", "50"], va: ["Virginia", "51"], wa: ["Washington", "53"], wv: ["West Virginia", "54"],
  wi: ["Wisconsin", "55"], wy: ["Wyoming", "56"],
};
const STATE_BY_NAME = new Map(Object.entries(STATES).map(([id, [name]]) => [name, id]));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One request, retried after a pause when the server is busy (429, 5xx) -
 * Wikidata's query service answers 502 now and then under load. Every
 * request has a time limit, so a job always ends well inside the Edge
 * Function's own limit (150 s on the free plan).
 */
type Limits = { timeoutMs?: number; tries?: number };
async function request(url: string, init: RequestInit = {}, { timeoutMs = 30_000, tries = 2 }: Limits = {}): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, ...((init.headers as Record<string, string>) ?? {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return res;
    const busy = res.status === 429 || res.status >= 500;
    await res.body?.cancel();
    if (!busy || attempt >= tries) throw new Error(`${new URL(url).host}: HTTP ${res.status}`);
    await sleep(3000 * attempt);
  }
}

const getJson = async (url: string, init: RequestInit = {}, limits?: Limits): Promise<unknown> =>
  (await request(url, init, limits)).json();
const getText = async (url: string, init: RequestInit = {}, limits?: Limits): Promise<string> =>
  (await request(url, init, limits)).text();

// ── World Bank ──────────────────────────────────────────────────────────────

/**
 * The latest year of each series for each economy (not the regional and
 * income-group aggregates), keyed by ISO2 as the site's countries are.
 * A series that comes back for fewer than 150 economies is treated as a
 * failed download and not written.
 */
export async function worldBank(): Promise<FigureRow[]> {
  const list = (await getJson("https://api.worldbank.org/v2/country?format=json&per_page=400", {}, { timeoutMs: 40_000 })) as [
    unknown,
    { iso2Code: string; region: { value: string } }[],
  ];
  const economies = new Set(list[1].filter((c) => c.region.value !== "Aggregates").map((c) => c.iso2Code));
  if (economies.size < 200) throw new Error(`World Bank: only ${economies.size} economies listed`);

  // The series together: one at a time, the API took minutes.
  const all = await Promise.all(
    WB_SERIES.map(
      async (code) =>
        [code, await getJson(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&mrv=8&per_page=25000`, {}, { timeoutMs: 100_000, tries: 1 })] as const,
    ),
  );
  const rows: FigureRow[] = [];
  for (const [code, raw] of all) {
    const json = raw as [unknown, { country: { id: string }; date: string; value: number | null }[] | null];
    if (!Array.isArray(json) || !json[1]) throw new Error(`World Bank ${code}: no rows`);
    const latest = new Map<string, { v: number; y: string }>();
    for (const r of json[1]) {
      if (r.value === null || !Number.isFinite(r.value)) continue;
      if (!/^\d{4}$/.test(String(r.date))) continue;
      const id = r.country.id;
      if (!economies.has(id)) continue;
      const cur = latest.get(id);
      if (!cur || +r.date > +cur.y) latest.set(id, { v: r.value, y: String(r.date) });
    }
    if (latest.size < 150) throw new Error(`World Bank ${code}: only ${latest.size} economies`);
    for (const [area, { v, y }] of latest) rows.push({ source: "wb", series: code, area, period: y, value: v });
  }
  return rows;
}

// ── BLS ─────────────────────────────────────────────────────────────────────

/**
 * Each state's latest monthly unemployment rate, seasonally adjusted, from
 * the keyless public API - ten series a request with a pause, which has been
 * reliable where larger batches are refused. Period is YYYY-MM; the most
 * recent month is preliminary, and says so.
 */
export async function blsUnemployment(): Promise<FigureRow[]> {
  const ids = Object.entries(STATES).map(([id, [, fips]]) => [id, `LASST${fips}0000000000003`] as const);
  const yr = new Date().getUTCFullYear();
  const series: { seriesID: string; data: { year: string; period: string; value: string; footnotes: ({ code?: string } | null)[] }[] }[] = [];
  for (let i = 0; i < ids.length; i += 10) {
    if (i) await sleep(1500);
    const j = (await getJson("https://api.bls.gov/publicAPI/v1/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesid: ids.slice(i, i + 10).map(([, s]) => s), startyear: String(yr - 1), endyear: String(yr) }),
    })) as { status: string; message?: string[]; Results?: { series: typeof series } };
    if (j.status !== "REQUEST_SUCCEEDED" || !j.Results) throw new Error(`BLS: ${j.status} ${(j.message ?? []).join(" ")}`.trim());
    series.push(...j.Results.series);
  }
  const rows: FigureRow[] = [];
  for (const [id, sid] of ids) {
    const d = series.find((s) => s.seriesID === sid)?.data?.find((x) => /^M(0[1-9]|1[0-2])$/.test(x.period));
    const v = d ? Number(d.value) : NaN;
    if (!d || !Number.isFinite(v)) continue;
    const prelim = (d.footnotes ?? []).some((f) => f?.code === "P");
    rows.push({
      source: "bls",
      series: sid,
      area: id,
      period: `${d.year}-${d.period.slice(1)}`,
      value: v,
      detail: prelim ? { prelim: true } : null,
    });
  }
  if (rows.length < 45) throw new Error(`BLS: only ${rows.length} states returned`);
  return rows;
}

// ── Wikidata ────────────────────────────────────────────────────────────────

type Binding = Record<string, { value: string } | undefined>;

async function sparql(query: string): Promise<Binding[]> {
  const j = (await getJson(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/sparql-results+json" } },
    { timeoutMs: 50_000, tries: 2 },
  )) as { results: { bindings: Binding[] } };
  return j.results.bindings;
}

/**
 * The current governor of each state, with build-states.cjs's checks: a
 * position held with a start date and no end date, a living holder, and
 * exactly one per state - a state with none or two (as in a handover being
 * edited) is left out, and the site keeps the governor it was built with. A
 * start date in the future (a governor-elect) is not current yet.
 */
export async function governors(): Promise<FigureRow[]> {
  const rows = await sparql(`SELECT ?stateLabel ?govLabel ?start (GROUP_CONCAT(DISTINCT ?partyLabel;separator="|") AS ?parties) WHERE {
    ?state wdt:P31 wd:Q35657 ; wdt:P1313 ?office .
    ?gov p:P39 ?st . ?st ps:P39 ?office ; pq:P580 ?start .
    FILTER NOT EXISTS { ?st pq:P582 ?end }
    FILTER NOT EXISTS { ?gov wdt:P570 ?died }
    FILTER(YEAR(?start) >= 2010)
    OPTIONAL { ?gov p:P102 ?ps . ?ps ps:P102 ?party . FILTER NOT EXISTS { ?ps pq:P582 ?pend }
               ?party rdfs:label ?partyLabel . FILTER(LANG(?partyLabel) = "en") }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } GROUP BY ?stateLabel ?govLabel ?start`);
  const today = new Date().toISOString().slice(0, 10);
  const byState = new Map<string, { name: string; since: string; parties: string }[]>();
  for (const b of rows) {
    const id = STATE_BY_NAME.get(b.stateLabel?.value ?? "");
    const name = b.govLabel?.value ?? "";
    const since = (b.start?.value ?? "").slice(0, 10);
    if (!id || !name || /^Q\d+$/.test(name) || !/^\d{4}-\d{2}-\d{2}$/.test(since) || since > today) continue;
    byState.set(id, [...(byState.get(id) ?? []), { name, since, parties: b.parties?.value ?? "" }]);
  }
  const out: FigureRow[] = [];
  for (const [id, list] of byState) {
    if (list.length !== 1) continue;
    const g = list[0];
    const party = /Republican/.test(g.parties) ? "Republican" : /Democratic/.test(g.parties) ? "Democrat" : "Independent";
    out.push({ source: "wikidata", series: "governor", area: id, period: g.since, value: null, text_value: g.name, detail: { party } });
  }
  if (out.length < 40) throw new Error(`Wikidata governors: only ${out.length} states had exactly one`);
  return out;
}

/** What kind of contest an election item is, from its own name. */
function electionKind(label: string): string | null {
  if (/ elections( in [A-Z].*)?$/.test(label) && !/United States (Senate|House)/.test(label)) return null; // an umbrella page for the year
  if (/lieutenant/i.test(label)) return "Lieutenant Governor";
  if (/gubernatorial|governor/i.test(label)) return "Governor";
  if (/United States Senate/.test(label)) return "US Senate";
  if (/United States House of Representatives/.test(label)) return "US House";
  if (/attorney general/i.test(label)) return "Attorney General";
  if (/secretary of state/i.test(label)) return "Secretary of State";
  if (/(senate|house|assembly|legislat)/i.test(label)) return "State legislature";
  if (/(amendment|proposition|measure|question|referendum|initiative|ballot)/i.test(label)) return "Ballot measure";
  if (/(special|by-election|recall)/i.test(label)) return "Special election";
  return "Election";
}

/** US general election day in a year: the Tuesday after the first Monday in November. */
export function electionDay(year: number): string {
  const firstMonday = 1 + ((8 - new Date(Date.UTC(year, 10, 1)).getUTCDay()) % 7);
  return `${year}-11-${String(firstMonday + 1).padStart(2, "0")}`;
}

/**
 * Elections dated from today to the end of next year, in each state, as
 * Wikidata holds them: an item with the state as its jurisdiction and a
 * point in time. Wikidata does not have every contest, so this is what it
 * lists, not a complete calendar, and the page says where the list is from.
 */
export async function stateElections(): Promise<EventRow[]> {
  const rows = await sparql(`SELECT DISTINCT ?e ?eLabel ?date ?stateLabel WHERE {
    ?state wdt:P31 wd:Q35657 .
    ?e wdt:P1001 ?state ; wdt:P585 ?date .
    FILTER(?date >= NOW() && YEAR(?date) <= YEAR(NOW()) + 1)
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }`);
  const out: EventRow[] = [];
  const seen = new Set<string>();
  for (const b of rows) {
    const qid = (b.e?.value ?? "").split("/").pop() ?? "";
    const title = b.eLabel?.value ?? "";
    const date = (b.date?.value ?? "").slice(0, 10);
    const area = STATE_BY_NAME.get(b.stateLabel?.value ?? "") ?? null;
    if (!/^Q\d+$/.test(qid) || !title || /^Q\d+$/.test(title) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !area) continue;
    // An item with a jurisdiction and a date is not always a vote; keep the
    // ones that name themselves as one.
    if (!/election|referendum|amendment|proposition|ballot measure|primary|recall/i.test(title)) continue;
    /* A contest dated a day or three either side of general election day,
       but not on it, is a slip in the data (Wikidata had Michigan's 2026
       House election on 5 November): left out rather than shown with a
       date that is almost certainly wrong. */
    const ed = electionDay(Number(date.slice(0, 4)));
    const off = Math.abs(Date.parse(date) - Date.parse(ed)) / 86_400_000;
    if (off > 0 && off <= 3) continue;
    const kind = electionKind(title);
    if (!kind || seen.has(qid)) continue;
    seen.add(qid);
    out.push({
      id: `wikidata:${qid}`,
      scope: "states",
      area,
      kind,
      title: title.slice(0, 300),
      event_date: date,
      source: "wikidata",
      source_url: `https://www.wikidata.org/wiki/${qid}`,
    });
  }
  return out;
}

// ── BEA ─────────────────────────────────────────────────────────────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * BEA's upcoming releases that cover the states (state GDP, state personal
 * income), from its published schedule. The page is a table per year, headed
 * "Year 2026", with a "September 30" date and a title per row; if that shape
 * changes, nothing is read rather than a wrong date.
 */
export async function beaStateReleases(): Promise<EventRow[]> {
  const html = await getText("https://www.bea.gov/news/schedule");
  const out: EventRow[] = [];
  const today = new Date().toISOString().slice(0, 10);
  // Split at each year header, so every row knows its year.
  const parts = html.split(/<th[^>]*>\s*Year (\d{4})\s*<\/th>/);
  for (let i = 1; i < parts.length; i += 2) {
    const year = parts[i];
    const body = parts[i + 1].split(/<\/table>/)[0];
    for (const row of body.split(/<tr[\s>]/).slice(1)) {
      const d = /class="release-date">\s*([A-Z][a-z]+) (\d{1,2})\s*</.exec(row);
      const t = /class="release-title[^"]*"[^>]*>([\s\S]*?)<\/td>/.exec(row);
      if (!d || !t) continue;
      const m = MONTHS.indexOf(d[1]);
      if (m < 0) continue;
      const title = t[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      if (!/\bState\b|\bStates\b|by State/.test(title)) continue;
      const date = `${year}-${String(m + 1).padStart(2, "0")}-${d[2].padStart(2, "0")}`;
      if (date < today) continue;
      out.push({
        id: `bea:${date}:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`,
        scope: "states",
        area: null,
        kind: "Data release",
        title: `BEA: ${title}`.slice(0, 300),
        event_date: date,
        source: "bea",
        source_url: "https://www.bea.gov/news/schedule",
      });
    }
  }
  if (parts.length < 3) throw new Error("BEA schedule: no year tables found");
  return out;
}
