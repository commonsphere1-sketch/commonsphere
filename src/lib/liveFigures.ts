/**
 * Published figures refreshed after the build, and upcoming events.
 *
 * The refresh-data Edge Function checks the site's sources twice a day and
 * keeps the latest figure for each series in Supabase (live_figures), with
 * the period it is for; upcoming elections and data releases go to
 * upcoming_events. This module reads them and brings the site's own data up
 * to date, under one rule: a refreshed figure is used only when it is for
 * the same period as the built one or a later one. A refresh can move a
 * figure forward - a new year of World Bank data, a new month from the BLS,
 * a governor sworn in after the build - but never back to an older one, and
 * every figure it changes carries its new period, labelled as before.
 *
 *   Countries   population, GDP, GDP per capita, growth, life expectancy,
 *               unemployment, inflation (World Bank), rounded as
 *               build-country-indicators.cjs rounds them
 *   Economies   the same World Bank series plus FDI, rounded as
 *               build-economy-indicators.cjs rounds them
 *   US states   unemployment rate (BLS, monthly) and governor (Wikidata)
 *
 * The data objects are updated in place, because fifteen pages import them
 * directly; the version below tells React when to re-render. The last
 * refresh is kept in this browser and applied as soon as the module loads,
 * so a page opens with it rather than switching over a moment later.
 *
 * Without Supabase configured nothing is fetched and the site shows the
 * figures it was built with.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { countriesData, type Country } from "@/data/countriesData";
import { usStatesData, type USState } from "@/data/statesData";
import { economiesData, economyForCountry, ECONOMY_FIGURE_SOURCES, type Economy } from "@/data/economiesData";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE } from "@/data/countryIndicators";
import { ECONOMY_INDICATORS_SOURCE } from "@/data/economyIndicators";
import { STATE_INDICATORS } from "@/data/stateIndicators";

export type LiveRow = {
  source: "wb" | "bls" | "wikidata";
  series: string;
  area: string;
  period: string;
  value: number | null;
  text_value: string | null;
  detail: Record<string, unknown> | null;
};

export type UpcomingEvent = {
  id: string;
  scope: "states" | "economies" | "cities";
  area: string | null;
  kind: string;
  title: string;
  event_date: string;
  source: "wikidata" | "bea";
  source_url: string;
};

// ── Rounding, exactly as the build scripts round ────────────────────────────

/** build-country-indicators.cjs's round(). */
const roundLikeBuild = (v: number) => {
  const a = Math.abs(v);
  if (a >= 100) return Math.round(v);
  if (a >= 10) return Number(v.toFixed(1));
  if (a >= 1) return Number(v.toFixed(2));
  return Number(v.toFixed(4));
};

const COUNTRY_SERIES: Record<string, [keyof Country & string, (v: number) => number]> = {
  "SP.POP.TOTL": ["population", (v) => Math.round(v)],
  "NY.GDP.MKTP.CD": ["gdp", (v) => roundLikeBuild(v / 1e9)],
  "NY.GDP.PCAP.CD": ["gdpPerCapita", (v) => Math.round(v)],
  "NY.GDP.MKTP.KD.ZG": ["gdpGrowth", roundLikeBuild],
  "SP.DYN.LE00.IN": ["lifeExpectancy", roundLikeBuild],
  "SL.UEM.TOTL.ZS": ["unemploymentRate", roundLikeBuild],
  "FP.CPI.TOTL.ZG": ["inflationRate", roundLikeBuild],
};

const ECONOMY_SERIES: Record<string, [keyof Economy & string, (v: number) => number]> = {
  "NY.GDP.MKTP.CD": ["gdpTrillions", (v) => Number((v / 1e12).toPrecision(4))],
  "NY.GDP.PCAP.CD": ["gdpPerCapita", (v) => Math.round(v)],
  "NY.GDP.MKTP.KD.ZG": ["gdpGrowthRate", (v) => Number(v.toFixed(1))],
  "FP.CPI.TOTL.ZG": ["inflationRate", (v) => Number(v.toFixed(1))],
  "SL.UEM.TOTL.ZS": ["unemploymentRate", (v) => Number(v.toFixed(1))],
  "BX.KLT.DINV.CD.WD": ["fdiInflowBillions", (v) => Number((v / 1e9).toPrecision(3))],
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "August 2026" → "2026-08"; anything else → null. */
function monthKey(label: string | undefined): string | null {
  const m = /^([A-Z][a-z]+) (\d{4})/.exec(label ?? "");
  const i = m ? MONTHS.indexOf(m[1]) : -1;
  return i >= 0 ? `${m![2]}-${String(i + 1).padStart(2, "0")}` : null;
}

/** The year at the end of a source label: "World Bank — …, 2025" → "2025". */
const yearOfLabel = (label: string | undefined) => /, (\d{4})$/.exec(label ?? "")?.[1] ?? null;

/** Periods compare as text: "2025" < "2026", "2026-07" < "2026-08". */
const notOlder = (live: string, built: string | null) => !built || live >= built;

// ── What the site was built with, kept so a refresh can be re-applied ──────

type Rec = Record<string, unknown>;
let baseline: {
  countries: Map<Country, { values: Rec; sources: Country["sources"] }>;
  economies: Map<Economy, { values: Rec; years: Economy["figureYears"]; cited: Rec | undefined }>;
  states: Map<USState, { values: Rec; years: USState["figureYears"] }>;
} | null = null;

function captureBaseline() {
  if (baseline) return baseline;
  const countryFields = Object.values(COUNTRY_SERIES).map(([f]) => f);
  const economyFields = Object.values(ECONOMY_SERIES).map(([f]) => f);
  baseline = {
    countries: new Map(
      countriesData.map((c) => [
        c,
        {
          values: Object.fromEntries(countryFields.map((f) => [f, (c as unknown as Rec)[f]])),
          sources: c.sources ? { ...c.sources } : c.sources,
        },
      ]),
    ),
    economies: new Map(
      economiesData.map((e) => [
        e,
        {
          values: Object.fromEntries(economyFields.map((f) => [f, (e as unknown as Rec)[f]])),
          years: e.figureYears ? { ...e.figureYears } : undefined,
          cited: ECONOMY_FIGURE_SOURCES[e.id] ? { ...ECONOMY_FIGURE_SOURCES[e.id] } : undefined,
        },
      ]),
    ),
    states: new Map(
      usStatesData.map((s) => [
        s,
        {
          values: { unemploymentRate: s.unemploymentRate, governor: s.governor, party: s.party },
          years: s.figureYears ? { ...s.figureYears } : s.figureYears,
        },
      ]),
    ),
  };
  return baseline;
}

function restoreBaseline() {
  const b = captureBaseline();
  for (const [c, v] of b.countries) {
    Object.assign(c, v.values);
    c.sources = v.sources ? { ...v.sources } : v.sources;
  }
  for (const [e, v] of b.economies) {
    Object.assign(e, v.values);
    e.figureYears = v.years ? { ...v.years } : undefined;
    if (v.cited) ECONOMY_FIGURE_SOURCES[e.id] = { ...v.cited } as (typeof ECONOMY_FIGURE_SOURCES)[string];
    else delete ECONOMY_FIGURE_SOURCES[e.id];
  }
  for (const [s, v] of b.states) {
    Object.assign(s, v.values);
    s.figureYears = v.years ? { ...v.years } : v.years;
  }
}

/** Each economy's ISO2 code: its own where it has one, else its country's. */
let economyIso2: Map<Economy, string> | null = null;
function isoOfEconomy(e: Economy): string | undefined {
  if (!economyIso2) {
    economyIso2 = new Map();
    for (const c of countriesData) {
      const found = economyForCountry(c);
      if (found && !economyIso2.has(found)) economyIso2.set(found, c.code);
    }
    for (const x of economiesData) if (x.iso2) economyIso2.set(x, x.iso2);
  }
  return economyIso2.get(e);
}

/**
 * Brings the data up to date from a set of rows: back to what was built,
 * then every refreshed figure that is not older. Returns how many figures
 * now differ from the built ones.
 */
export function applyRows(rows: LiveRow[]): number {
  restoreBaseline();
  const b = captureBaseline();
  const wb = new Map<string, LiveRow>();
  const bls = new Map<string, LiveRow>();
  const gov = new Map<string, LiveRow>();
  for (const r of rows) {
    if (r.source === "wb") wb.set(`${r.series}|${r.area}`, r);
    else if (r.source === "bls") bls.set(r.area, r);
    else if (r.source === "wikidata" && r.series === "governor") gov.set(r.area, r);
  }
  let changed = 0;
  const moved = (before: unknown, after: unknown) => {
    if (before !== after && !(Number.isNaN(before) && Number.isNaN(after))) changed++;
  };

  // Countries.
  for (const c of countriesData) {
    const built = COUNTRY_INDICATORS[c.code] as Record<string, { y: string } | undefined> | undefined;
    for (const [series, [field, conv]] of Object.entries(COUNTRY_SERIES)) {
      const r = wb.get(`${series}|${c.code}`);
      if (!r || r.value === null || !Number.isFinite(r.value)) continue;
      const builtPeriod = built?.[field]?.y ?? yearOfLabel(c.sources?.[field as keyof NonNullable<Country["sources"]>]?.label);
      if (!notOlder(r.period, builtPeriod)) continue;
      const v = conv(r.value);
      moved(b.countries.get(c)?.values[field], v);
      (c as unknown as Rec)[field] = v;
      c.sources = {
        ...c.sources,
        [field]: { label: `${COUNTRY_INDICATORS_SOURCE.label}, ${r.period}`, url: COUNTRY_INDICATORS_SOURCE.url },
      };
    }
  }

  // Economies.
  for (const e of economiesData) {
    const iso = isoOfEconomy(e);
    if (!iso) continue;
    for (const [series, [field, conv]] of Object.entries(ECONOMY_SERIES)) {
      const r = wb.get(`${series}|${iso}`);
      if (!r || r.value === null || !Number.isFinite(r.value)) continue;
      const cited = ECONOMY_FIGURE_SOURCES[e.id] as Record<string, { year: string } | undefined> | undefined;
      const builtPeriod = cited?.[field]?.year ?? e.figureYears?.[field] ?? null;
      if (!notOlder(r.period, builtPeriod)) continue;
      const v = conv(r.value);
      moved(b.economies.get(e)?.values[field], v);
      (e as unknown as Rec)[field] = v;
      if (e.figureYears) e.figureYears = { ...e.figureYears, [field]: r.period };
      if (cited || !e.figureYears) {
        ECONOMY_FIGURE_SOURCES[e.id] = {
          ...ECONOMY_FIGURE_SOURCES[e.id],
          [field]: { ...ECONOMY_INDICATORS_SOURCE.worldBank, year: r.period },
        } as (typeof ECONOMY_FIGURE_SOURCES)[string];
      }
    }
  }

  // US states.
  for (const s of usStatesData) {
    const built = STATE_INDICATORS[s.id];
    const u = bls.get(s.id);
    if (u && u.value !== null && Number.isFinite(u.value) && notOlder(u.period, monthKey(built?.unemploymentRate.y))) {
      const [y, m] = u.period.split("-");
      moved(b.states.get(s)?.values.unemploymentRate, u.value);
      s.unemploymentRate = u.value;
      s.figureYears = {
        ...s.figureYears,
        unemploymentRate: `${MONTHS[Number(m) - 1]} ${y}${u.detail?.prelim ? " (preliminary)" : ""}`,
      };
    }
    // A governor only when their term began after the built one's did.
    const g = gov.get(s.id);
    const party = g?.detail?.party;
    if (
      g?.text_value &&
      built?.governor &&
      g.period > built.governor.since &&
      (party === "Democrat" || party === "Republican" || party === "Independent")
    ) {
      moved(b.states.get(s)?.values.governor, g.text_value);
      s.governor = g.text_value;
      s.party = party;
    }
  }
  return changed;
}

// ── The store ───────────────────────────────────────────────────────────────

type Status = {
  /** Bumped whenever the data changes, for React to re-render. */
  version: number;
  refreshing: boolean;
  /** When the sources were last checked, by the most recent successful job. */
  lastChecked: Date | null;
  /** Figures that differ from the built ones. */
  patched: number;
  events: UpcomingEvent[];
};

let status: Status = { version: 0, refreshing: false, lastChecked: null, patched: 0, events: [] };
const listeners = new Set<() => void>();
const set = (next: Partial<Status>) => {
  status = { ...status, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => status;

/** The refresh status; re-renders the caller when it changes. */
export function useLiveStatus(): Status {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// ── This browser's copy of the last refresh ─────────────────────────────────

const CACHE_KEY = "cs-live-refresh-v1";
type Cached = { at: string; checked: string | null; rows: LiveRow[]; events: UpcomingEvent[] };

function readCache(): Cached | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as Cached | null;
    return c && Array.isArray(c.rows) && Array.isArray(c.events) ? c : null;
  } catch {
    return null;
  }
}

function writeCache(c: Cached) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* storage full or blocked: the next visit fetches again */
  }
}

/** Keeps only well-formed rows: storage and responses are both untrusted. */
function cleanRows(rows: unknown[]): LiveRow[] {
  return rows.filter(
    (r): r is LiveRow =>
      !!r &&
      typeof r === "object" &&
      ["wb", "bls", "wikidata"].includes((r as LiveRow).source) &&
      typeof (r as LiveRow).series === "string" &&
      typeof (r as LiveRow).area === "string" &&
      /^\d{4}(-\d{2}(-\d{2})?)?$/.test(String((r as LiveRow).period)),
  );
}

function cleanEvents(rows: unknown[]): UpcomingEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return rows.filter(
    (e): e is UpcomingEvent =>
      !!e &&
      typeof e === "object" &&
      typeof (e as UpcomingEvent).title === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(String((e as UpcomingEvent).event_date)) &&
      (e as UpcomingEvent).event_date >= today &&
      /^https:\/\//.test(String((e as UpcomingEvent).source_url)),
  );
}

// Applied as soon as the module loads, before any page renders.
{
  const c = supabase ? readCache() : null;
  if (c) {
    const patched = applyRows(cleanRows(c.rows));
    status = { ...status, patched, lastChecked: c.checked ? new Date(c.checked) : null, events: cleanEvents(c.events) };
  }
}

// ── Fetching ────────────────────────────────────────────────────────────────

let inFlight: Promise<void> | null = null;
let fetchedAt = 0;
const PAGE = 1000;

/**
 * Fetches the latest refresh and applies it. Called once when the app starts
 * (and by `refresh`); a second call while one is running, or within five
 * minutes of the last, does nothing.
 */
export function refreshLive(force = false): Promise<void> {
  if (!supabase) return Promise.resolve();
  if (inFlight) return inFlight;
  if (!force && Date.now() - fetchedAt < 5 * 60_000) return Promise.resolve();
  const sb = supabase;
  set({ refreshing: true });
  inFlight = (async () => {
    try {
      const rows: unknown[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb
          .from("live_figures")
          .select("source, series, area, period, value, text_value, detail")
          .order("source")
          .order("series")
          .order("area")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < PAGE) break;
      }
      const today = new Date().toISOString().slice(0, 10);
      const { data: ev, error: evError } = await sb
        .from("upcoming_events")
        .select("id, scope, area, kind, title, event_date, source, source_url")
        .gte("event_date", today)
        .order("event_date")
        .limit(500);
      if (evError) throw evError;
      const { data: runs } = await sb
        .from("data_refresh_runs")
        .select("finished_at")
        .eq("status", "ok")
        .order("finished_at", { ascending: false })
        .limit(1);

      const clean = cleanRows(rows);
      const events = cleanEvents(ev ?? []);
      const checked = runs?.[0]?.finished_at ?? null;
      const patched = applyRows(clean);
      writeCache({ at: new Date().toISOString(), checked, rows: clean, events });
      fetchedAt = Date.now();
      set({ version: status.version + 1, patched, lastChecked: checked ? new Date(checked) : null, events });
    } catch {
      /* Offline, or Supabase unreachable: keep what is showing (the built
         figures, or the last refresh this browser saw). */
    } finally {
      inFlight = null;
      set({ refreshing: false });
    }
  })();
  return inFlight;
}
