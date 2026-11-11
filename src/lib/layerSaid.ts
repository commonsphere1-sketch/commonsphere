/**
 * What the Worldview map's card by the pointer says of the conflicts and the disasters, as asked: of a pin - one place's
 * fighting in UCDP's latest month, or one disaster GDACS holds as current - and of a country, while their layers are on.
 * Each in its body's own terms: UCDP's kinds of violence, its sides and its best estimates; GDACS's alert levels, as its
 * guidelines put them, its severity and its sources. Nothing is worked out but sums of UCDP's own counts.
 */
import { ALERT_SAID, CONFLICT_KIND_SAID, daysOf, hazardSource, monthOf, type ConflictDyad, type ConflictLayer, type ConflictRow } from "./conflictEvents";
import { CONFLICT_KINDS } from "../data/conflictEventsMeta";
import { HAZARD_KINDS, type Hazard } from "./gdacsLive";

/** A disaster's name as GDACS gives it - "Tropical Cyclone MURASU-26", "Earthquake in Japan" - or its kind where it gives none. */
export const hazardName = (h: Hazard) => h.name || HAZARD_KINDS[h.kind];
/** A pair of sides, the one against the other, as UCDP names them. */
const against = (d: ConflictDyad) => `${d[1]} against ${d[2].replace(/^Civilians$/, "civilians")}`;
const n = (v: number) => v.toLocaleString("en-US");

export type CountryConflict = { deaths: number; events: number; kinds: number[]; what: string };

/** Each country's deaths in UCDP's latest month, where the events were: by kind of violence, and the sides with the most. */
export function conflictsByCountry(layer: ConflictLayer): Map<string, CountryConflict> {
  const by = new Map<string, { deaths: number; events: number; kinds: number[]; dyads: Map<number, number> }>();
  for (const r of layer.rows) {
    const cc = r[11];
    if (!cc || r[4] <= 0) continue;
    const was = by.get(cc) ?? { deaths: 0, events: 0, kinds: [0, 0, 0, 0], dyads: new Map<number, number>() };
    was.deaths += r[4];
    was.events += r[3];
    for (const p of r[6]) {
      const d = layer.dyads[p[0]];
      if (d) was.kinds[d[3]] += p[2];
      was.dyads.set(p[0], (was.dyads.get(p[0]) ?? 0) + p[2]);
    }
    by.set(cc, was);
  }
  const out = new Map<string, CountryConflict>();
  for (const [cc, x] of by) {
    const kinds = x.kinds.flatMap((v, k) => (v > 0 ? [`${CONFLICT_KINDS[k].toLowerCase()} ${n(v)}`] : []));
    const most = [...x.dyads.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).filter(([, v]) => v > 0);
    out.set(cc, {
      deaths: x.deaths,
      events: x.events,
      kinds: x.kinds,
      what: `Killed ${kinds.join(", ")}${most.length ? `; the most: ${most.map(([d, v]) => `${against(layer.dyads[d])} (${n(v)})`).join("; then ")}` : ""}`,
    });
  }
  return out;
}

/** Each country's disasters GDACS holds as current, the most severe first. */
export function disastersByCountry(hazards: Hazard[]): Map<string, Hazard[]> {
  const rank = { Red: 0, Orange: 1, Green: 2 } as const;
  const out = new Map<string, Hazard[]>();
  for (const h of [...hazards].sort((a, b) => rank[a.alert] - rank[b.alert]))
    for (const cc of new Set(h.codes)) {
      const was = out.get(cc);
      if (was) was.push(h);
      else out.set(cc, [h]);
    }
  return out;
}

/** The card's rows for a conflict's pin: its deaths and days, what its kind of violence is, its sides, who died, and what UCDP is still checking. */
export function conflictPinRows(layer: ConflictLayer, r: ConflictRow): [string, string][] {
  const parts = [...r[6]].sort((a, b) => b[2] - a[2]);
  const civilians = parts.reduce((s, p) => s + (p[5] ?? 0), 0);
  const rows: [string, string][] = [
    ["Killed", `${n(r[4])} in ${n(r[3])} event${r[3] === 1 ? "" : "s"}, ${daysOf(r[7], r[8])} - UCDP's best estimate`],
    ["Kind", CONFLICT_KIND_SAID[r[2]]],
    ["Sides", parts.slice(0, 3).map((p) => `${against(layer.dyads[p[0]])} (${n(p[2])})`).join("; ") + (parts.length > 3 ? `; and ${parts.length - 3} more` : "")],
  ];
  if (civilians > 0) rows.push(["Civilians", `${n(civilians)} of the dead, as UCDP splits them`]);
  if (r[9] > 0) rows.push(["Checking", `UCDP is still checking ${n(r[9])} of these events`]);
  rows.push(["By", `Uppsala Conflict Data Program, ${monthOf(layer.month)}`]);
  return rows;
}

/** The card's rows for a disaster's pin: what its alert means, its severity, its days, where it reaches, and whose it is. */
export function hazardPinRows(h: Hazard): [string, string][] {
  const rows: [string, string][] = [["Alert", ALERT_SAID[h.alert]]];
  if (h.severity) rows.push(["Severity", h.severity]);
  rows.push(["When", daysOf(h.from, h.to)]);
  if (h.affected.length) rows.push(["Affects", h.affected.join(", ")]);
  rows.push(["By", `GDACS, from ${hazardSource(h.kind, h.source)}`]);
  return rows;
}

/** The card's row for a country's conflicts, in UCDP's latest month. */
export const countryConflictRow = (c: CountryConflict, month: string): [string, string] => [
  "Conflict",
  `${n(c.deaths)} killed in ${n(c.events)} event${c.events === 1 ? "" : "s"}, ${monthOf(month)}. ${c.what}`,
];

/** The card's row for a country's disasters now: the most severe first, three at most and how many more. */
export const countryDisastersRow = (hs: Hazard[]): [string, string] => [
  "Disasters",
  hs
    .slice(0, 3)
    .map((h) => `${h.alert} alert: ${hazardName(h)}, ${daysOf(h.from, h.to)}`)
    .join("; ") + (hs.length > 3 ? `; and ${hs.length - 3} more` : ""),
];
