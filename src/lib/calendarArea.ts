/**
 * The area the calendar is set to, as asked: everywhere, the international meetings alone, one country, or one US state. Its
 * entries are the site's diary (calendar2026.ts), the elections and the city council meetings (civicCalendar.ts), each in a
 * common shape, and an area picks those that are its own.
 *
 * The area a reader chooses in Settings is kept in this browser, as the profile colour is, and the calendar opens on it; it
 * can be changed in the calendar too, which keeps the choice.
 */
import { useEffect, useState } from "react";
import { CALENDAR_2026, type CalendarEvent } from "../data/calendar2026";
import { CIVIC_ELECTIONS, COUNCIL_MEETINGS, type CivicSource } from "../data/civicCalendar";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";

export type EntryKind = CalendarEvent["theme"] | "Election" | "Council";
/** An entry of the calendar, whatever it came from. */
export interface CalendarEntry {
  id: string;
  name: string;
  start: string;
  end?: string;
  monthOnly?: boolean;
  kind: EntryKind;
  /** Where it is held, as it is written under its name. */
  place: string;
  /** Who convenes it, or what it is. */
  org: string;
  what?: string;
  sources: CivicSource[];
  /** The country it is in (ISO2) and, for a state's or a region's, its ISO 3166-2 code. */
  cc: string;
  region?: string;
  international?: boolean;
}

const NAME_TO_CODE = new Map(countriesData.map((c) => [c.name, c.code]));
// The diary's names that differ from the country list's.
const ALIAS: Record<string, string> = { Türkiye: "TR", "United States": "US" };
const codeOf = (country: string) => ALIAS[country] ?? NAME_TO_CODE.get(country) ?? "";
const COUNTRY_NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const STATE_NAME = new Map(usStatesData.map((s) => [`US-${s.abbreviation}`, s.name]));

export const CALENDAR_ENTRIES: CalendarEntry[] = [
  ...CALENDAR_2026.map((e) => ({
    id: e.id,
    name: e.name,
    start: e.start,
    end: e.end,
    monthOnly: e.monthOnly,
    kind: e.theme,
    place: `${e.city}, ${e.country}`,
    org: `${e.org} · ${e.scope.toLowerCase()}, ${e.theme.toLowerCase()}`,
    what: e.what,
    sources: [e.source],
    cc: codeOf(e.country),
    international: e.scope === "International",
  })),
  ...CIVIC_ELECTIONS.map((e) => ({
    id: e.id,
    name: e.name,
    start: e.date,
    kind: "Election" as const,
    place: [e.region ? (STATE_NAME.get(e.region) ?? e.region) : "", COUNTRY_NAME.get(e.cc) ?? e.cc].filter(Boolean).join(", "),
    org: e.level === "National" ? "national election" : "election in a state or region",
    what: e.what,
    sources: e.sources,
    cc: e.cc,
    region: e.region || undefined,
  })),
  ...COUNCIL_MEETINGS.map((m) => ({
    id: m.id,
    name: m.body,
    start: m.date,
    kind: "Council" as const,
    place: `${m.city}, ${STATE_NAME.get(m.region) ?? m.region}`,
    org: `city council meeting${m.time ? ` · ${m.time}` : ""}`,
    what: m.location || undefined,
    sources: [{ label: `${m.city} - the meeting on the city's own calendar (Legistar)`, url: m.url }],
    cc: "US",
    region: m.region,
  })),
];

/** "all", "international", "cc:FR" or "us:CA". */
export type CalendarArea = string;
export const DEFAULT_AREA: CalendarArea = "all";
/** Whether an entry is the area's own. A state's calendar holds the state's own and the nation's US dates (the Federal Reserve's, say). */
export function inArea(e: CalendarEntry, area: CalendarArea): boolean {
  if (area === "all") return true;
  if (area === "international") return !!e.international;
  if (area.startsWith("cc:")) return e.cc === area.slice(3);
  if (area.startsWith("us:")) return e.cc === "US" && (e.region === `US-${area.slice(3)}` || (!e.region && e.kind !== "Council"));
  return true;
}

/** The areas to choose from: everywhere, the international meetings, every country with an entry, and the fifty states. */
export const AREA_OPTIONS: { value: CalendarArea; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "international", label: "International meetings" },
  ...[...new Set(CALENDAR_ENTRIES.map((e) => e.cc).filter(Boolean))]
    .map((cc) => ({ value: `cc:${cc}`, label: COUNTRY_NAME.get(cc) ?? cc }))
    .sort((a, b) => a.label.localeCompare(b.label)),
  ...[...usStatesData].sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ value: `us:${s.abbreviation}`, label: `${s.name}, US` })),
];
export const areaLabel = (area: CalendarArea) => AREA_OPTIONS.find((o) => o.value === area)?.label ?? "Everywhere";

const KEY = "cs.calendarArea";
const EVENT = "cs-calendar-area";
export function readArea(): CalendarArea {
  try {
    const v = localStorage.getItem(KEY);
    return v && AREA_OPTIONS.some((o) => o.value === v) ? v : DEFAULT_AREA;
  } catch {
    return DEFAULT_AREA;
  }
}
export function saveArea(area: CalendarArea) {
  try {
    localStorage.setItem(KEY, area);
  } catch {
    /* The choice holds for this visit only. */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: area }));
}
/** The area, kept in step wherever it is changed - Settings or the calendar. */
export function useCalendarArea(): [CalendarArea, (a: CalendarArea) => void] {
  const [area, setArea] = useState<CalendarArea>(readArea);
  useEffect(() => {
    const on = (e: Event) => setArea((e as CustomEvent<string>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return [area, saveArea];
}
