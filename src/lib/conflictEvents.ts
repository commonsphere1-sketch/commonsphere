import { useEffect, useState } from "react";
import type { HazardAlert, HazardKind } from "./gdacsLive";

/**
 * The Conflicts layer, as build-conflict-events.cjs writes it to /geo/conflicts.json, and what the two maps that pin it -
 * World Maps' and the Worldview page's - say of it, so the two say it alike.
 *
 * Each row is a place: where, its kind (the one with the most deaths there), its events, their deaths (UCDP's best
 * estimates), each pair of sides there with its events and deaths and their split, the first and last day, how many
 * events UCDP is still checking, and how closely it could place them.
 */
/** A pair of sides, with the governments on each as the site's countries - "Government of Mali, Government of Russia" is ["ML", "RU"]. */
export type ConflictDyad = [conflict: string, sideA: string, sideB: string, kind: number, govsA: string[], govsB: string[]];
/** One pair of sides at a place: its events and deaths, and - where UCDP's split adds up - side A's, side B's, civilians' and those not known. */
export type ConflictPart = [dyad: number, events: number, best: number, sideA?: number, sideB?: number, civilians?: number, unknown?: number];
export type ConflictRow = [
  lon: number,
  lat: number,
  kind: number,
  events: number,
  best: number,
  place: string,
  parts: ConflictPart[],
  from: string,
  to: string,
  unchecked: number,
  precision: number,
  country: string,
];
export type ConflictLayer = { version: string; month: string; dyads: ConflictDyad[]; rows: ConflictRow[] };

/** What each kind is, in UCDP's terms - with where the incursions and the attacks called terrorism fall, as UCDP has no such classes. */
export const CONFLICT_KIND_SAID = [
  "A war between governments, their forces fighting or striking each other at home or across a border: a state-based conflict that the UCDP/PRIO Armed Conflict Dataset types as interstate.",
  "A government against an armed group, at home or across a border, with or without other states' troops on one side.",
  "Two organised armed groups fighting each other, neither of them a government.",
  "A government or an organised armed group killing civilians, who are not fighting. UCDP has no class called terrorism: an armed group's attacks on civilians are counted here.",
] as const;

/** The governments a pair of sides names, each with its country - in the order the side names them. */
const govsNamed = (side: string, govs: string[]) =>
  side
    .split(", ")
    .filter((s) => s.startsWith("Government of "))
    .map((s, i) => ({ name: s, code: govs[i] }));
/** The governments fighting at a place that is not their own country's - an incursion, a strike or a deployment across a border. */
export const acrossBorder = (row: ConflictRow, dyads: ConflictDyad[]) => {
  const seen = new Set<string>();
  return row[6].flatMap((p) => {
    const d = dyads[p[0]];
    return [...govsNamed(d[1], d[4]), ...govsNamed(d[2], d[5])].filter((g) => g.code && g.code !== row[11] && !seen.has(g.name) && seen.add(g.name));
  });
};
/** Whether a country's government is a side to any pair fighting at a place. */
export const involves = (row: ConflictRow, dyads: ConflictDyad[], code: string) => row[6].some((p) => dyads[p[0]][4].includes(code) || dyads[p[0]][5].includes(code));

/** What a pin's place means where UCDP could not place an event exactly (its "where_prec", 3 to 7). */
export const CONFLICT_PRECISION: Record<number, string> = {
  3: "Pinned at its district: UCDP knows the district, not the spot",
  4: "Pinned at its province: UCDP knows the province, not the spot",
  5: "Pinned roughly: UCDP knows only a wider area, a road or a border",
  6: "Pinned at the country: UCDP knows only the country",
  7: "In international waters or airspace",
};

/** The four kinds' colours, and the three alert levels' - hues no other layer uses; the alerts are drawn as rings. */
export const conflictInks = (isLight: boolean) => (isLight ? ["#991b1b", "#db2777", "#b45309", "#6d28d9"] : ["#ef4444", "#f472b6", "#fbbf24", "#a78bfa"]);
export const alertInks = (isLight: boolean): Record<HazardAlert, string> =>
  isLight ? { Green: "#15803d", Orange: "#ea580c", Red: "#dc2626" } : { Green: "#4ade80", Orange: "#fb923c", Red: "#f87171" };

/** What GDACS's alert levels mean, as its guidelines put them: how far a disaster may need help from abroad. */
export const ALERT_SAID: Record<HazardAlert, string> = {
  Red: "A red alert: in GDACS's terms a potentially severe disaster, where international assistance is expected to be needed.",
  Orange: "An orange alert: in GDACS's terms a potential local disaster, where international assistance might be needed.",
  Green: "A green alert: in GDACS's terms a moderate event, where international assistance is not likely to be needed.",
};

/** The bodies GDACS takes each disaster from, by the name it gives them, where that name is plain. */
export const HAZARD_SOURCE_NAMES: Record<string, string> = {
  NEIC: "the USGS National Earthquake Information Center",
  "ALASKA EC": "the Alaska Earthquake Center",
  JTWC: "the Joint Typhoon Warning Center",
  NOAA: "NOAA",
  RSMC: "a Regional Specialized Meteorological Centre",
  GLOFAS: "the Global Flood Awareness System (Copernicus)",
  GDO: "the Global Drought Observatory (Copernicus)",
  GWIS: "the Global Wildfire Information System (Copernicus)",
};
export const hazardSource = (kind: HazardKind, source: string) =>
  HAZARD_SOURCE_NAMES[source] ??
  (kind === "VO" && source ? `the ${source.charAt(0) + source.slice(1).toLowerCase().replace(/ (\w)/g, (_, c: string) => ` ${c.toUpperCase()}`)} Volcanic Ash Advisory Centre` : source);

export const dayOf = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const daysOf = (from: string, to: string) => (from.slice(0, 10) === to.slice(0, 10) ? dayOf(from) : `${dayOf(from)} to ${dayOf(to)}`);
export const monthOf = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** A pair of sides as UCDP names them: "Government of Pakistan - TTP". */
export const sidesOf = (d: ConflictDyad) => `${d[1]} - ${d[2]}`;

/** The layer's places, read once when it is first wanted. */
export function useConflictEvents(enabled: boolean) {
  const [data, setData] = useState<ConflictLayer | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || data || failed) return;
    let cancelled = false;
    fetch("/geo/conflicts.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: ConflictLayer) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, data, failed]);
  return { data, loading: enabled && !data && !failed, failed };
}
