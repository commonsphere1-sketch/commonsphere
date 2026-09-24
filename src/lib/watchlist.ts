import { countriesData, type Country } from "@/data/countriesData";
import { usStatesData, type USState } from "@/data/statesData";
import { usdFromBillions } from "./money";

/**
 * What a watched place's alerts are made of.
 *
 * The site's figures change when its data is rebuilt and deployed. An alert
 * is a watched figure that differs from the value the person last saw: the
 * snapshot taken when they added the place or marked it seen. Only figures
 * the site actually carries can be watched, so the topics are the ones it
 * can answer for - leadership and the economy for countries and states, and
 * the state policies it records (minimum wage and tax rates).
 */

export type EntityType = "country" | "state";
export type Topic = "leadership" | "economy" | "policy";

export const TOPICS: { id: Topic; label: string; for: EntityType[] }[] = [
  { id: "leadership", label: "Leadership", for: ["country", "state"] },
  { id: "economy", label: "Economy", for: ["country", "state"] },
  { id: "policy", label: "Wage & tax policy", for: ["state"] },
];

export const defaultTopics = (type: EntityType): Topic[] =>
  TOPICS.filter((t) => t.for.includes(type)).map((t) => t.id);

/** A stored value: text, a number, or null for "not published". */
type Value = string | number | null;
export type Snapshot = Record<string, Value>;

type Field<T> = { key: string; label: string; topic: Topic; get: (x: T) => Value; show: (v: Value) => string };

const num = (v: number | undefined): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const text = (v: string | undefined): string | null => (v && v.trim() ? v.trim() : null);
const shown = (f: (n: number) => string) => (v: Value) =>
  v === null ? "not published" : typeof v === "number" ? f(v) : String(v);
const plain = (v: Value) => (v === null ? "not published" : String(v));
const pct = shown((n) => `${n.toFixed(1)}%`);
const usd = shown((n) => usdFromBillions(n));
const signedUsd = shown((n) => usdFromBillions(n, true));
const dollars = shown((n) => `$${Math.round(n).toLocaleString("en-US")}`);

const COUNTRY_FIELDS: Field<Country>[] = [
  { key: "headOfState", label: "Head of state", topic: "leadership", get: (c) => text(c.headOfState), show: plain },
  { key: "governmentType", label: "Government", topic: "leadership", get: (c) => text(c.governmentType), show: plain },
  { key: "gdp", label: "GDP", topic: "economy", get: (c) => num(c.gdp), show: usd },
  { key: "gdpGrowth", label: "GDP growth", topic: "economy", get: (c) => num(c.gdpGrowth), show: pct },
  { key: "inflationRate", label: "Inflation", topic: "economy", get: (c) => num(c.inflationRate), show: pct },
  { key: "unemploymentRate", label: "Unemployment", topic: "economy", get: (c) => num(c.unemploymentRate), show: pct },
  { key: "tradeBalance", label: "Trade balance", topic: "economy", get: (c) => num(c.tradeBalance), show: signedUsd },
];

const STATE_FIELDS: Field<USState>[] = [
  { key: "governor", label: "Governor", topic: "leadership", get: (s) => text(s.governor), show: plain },
  { key: "party", label: "Governor's party", topic: "leadership", get: (s) => text(s.party), show: plain },
  {
    key: "senators",
    label: "Senators",
    topic: "leadership",
    get: (s) => (s.senators?.length ? s.senators.map((x) => x.name).sort().join(", ") : null),
    show: plain,
  },
  { key: "gdp", label: "GDP", topic: "economy", get: (s) => num(s.gdp), show: usd },
  { key: "unemploymentRate", label: "Unemployment", topic: "economy", get: (s) => num(s.unemploymentRate), show: pct },
  { key: "medianIncome", label: "Median household income", topic: "economy", get: (s) => num(s.medianIncome), show: dollars },
  {
    key: "minimumWage",
    label: "Minimum wage",
    topic: "policy",
    get: (s) => num(s.minimumWage),
    // 0 in the data means the state follows the federal minimum.
    show: shown((n) => (n === 0 ? "$7.25 (federal)" : `$${n.toFixed(2)}`)),
  },
  { key: "stateTaxRate", label: "Top income tax rate", topic: "policy", get: (s) => num(s.stateTaxRate), show: pct },
  { key: "salesTaxRate", label: "Sales tax (state + average local)", topic: "policy", get: (s) => num(s.salesTaxRate), show: pct },
];

/** The place's current record, or null if the site no longer lists it. */
export function lookup(type: EntityType, id: string): { name: string; record: Country | USState } | null {
  const r = type === "country" ? countriesData.find((c) => c.id === id) : usStatesData.find((s) => s.id === id);
  return r ? { name: r.name, record: r } : null;
}

const fieldsFor = (type: EntityType) => (type === "country" ? COUNTRY_FIELDS : STATE_FIELDS) as Field<Country | USState>[];

/** Every trackable figure as it stands now, whatever topics are chosen. */
export function snapshotOf(type: EntityType, id: string): Snapshot {
  const hit = lookup(type, id);
  if (!hit) return {};
  const out: Snapshot = {};
  for (const f of fieldsFor(type)) out[f.key] = f.get(hit.record);
  return out;
}

export type Change = { key: string; label: string; from: string; to: string };

/**
 * The watched figures that differ from the snapshot. A figure the snapshot
 * never recorded is not a change: there is nothing to compare it with.
 */
export function changesSince(type: EntityType, id: string, topics: Topic[], snap: Snapshot): Change[] {
  const hit = lookup(type, id);
  if (!hit) return [];
  const out: Change[] = [];
  for (const f of fieldsFor(type)) {
    if (!topics.includes(f.topic) || !(f.key in snap)) continue;
    const now = f.get(hit.record);
    const then = snap[f.key];
    if (now !== then) out.push({ key: f.key, label: f.label, from: f.show(then), to: f.show(now) });
  }
  return out;
}

/** Stored JSON back to a snapshot, keeping only values of the right shape. */
export function readSnapshot(raw: unknown): Snapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Snapshot = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>))
    if (v === null || typeof v === "string" || (typeof v === "number" && Number.isFinite(v))) out[k] = v;
  return out;
}

export const isTopic = (t: unknown): t is Topic => t === "leadership" || t === "economy" || t === "policy";
