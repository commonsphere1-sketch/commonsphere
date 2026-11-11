/**
 * The critical zones the Worldview map can highlight, as asked: each country that one or more of four public bodies
 * names, with what each says and a link to it. Nothing is scored or judged here - a country is on it where a body's
 * own list names it, and is drawn the more solid the more of the four do.
 *
 *   Travel ban         the US State Department's Level 4, Do Not Travel, for it or a part of it; or the UK Foreign
 *                      Office's advice against all travel to the whole country (data/countryStatus.ts, read daily-ish).
 *   Deadly conflict    deaths in organised violence in the latest month the Uppsala Conflict Data Program has
 *                      released (/geo/conflicts.json): the deaths and events, its best estimate.
 *   Red alert          a red alert from GDACS now - its estimate that international help is expected to be needed.
 *   UN appeal          a UN humanitarian response plan or flash appeal running now (data/humanitarianPlans.ts).
 */
import { useEffect, useMemo, useState } from "react";
import { daysOf, dayOf, monthOf, type ConflictLayer } from "./conflictEvents";
import { HAZARD_KINDS, type Hazard } from "./gdacsLive";
import { HUMANITARIAN_PLANS, planUrl } from "../data/humanitarianPlans";

export type CriticalBy = "travel" | "conflict" | "disaster" | "humanitarian";
/** Each of the four, in the order they are told: its chip, and what it is. */
export const CRITICAL_BY: { id: CriticalBy; chip: string; is: string }[] = [
  { id: "travel", chip: "Travel ban", is: "the US State Department's Level 4, Do Not Travel, or the UK Foreign Office's advice against all travel to the whole country" },
  { id: "conflict", chip: "Deadly conflict", is: "deaths in organised violence in the latest month the Uppsala Conflict Data Program has released" },
  { id: "disaster", chip: "Red alert", is: "a red alert from GDACS now: its estimate that help from abroad is expected to be needed" },
  { id: "humanitarian", chip: "UN appeal", is: "a UN humanitarian response plan or flash appeal running now" },
];
export type CriticalReason = { by: CriticalBy; said: string; url?: string };
export type CriticalZones = {
  /** Each country named, by its code, with what names it. */
  zones: Map<string, CriticalReason[]>;
  /** Which of the four are read: one not yet read names no country, and is said to be waiting. */
  read: Record<CriticalBy, boolean>;
  /** The day the travel advice was read, and the month of the conflicts. */
  advisedOn?: string;
  month?: string;
  status?: typeof import("../data/countryStatus");
};

let STATUS: Promise<typeof import("../data/countryStatus")> | null = null;
const money = (usd: number) => (usd >= 1e9 ? `$${(usd / 1e9).toFixed(2)} billion` : `$${Math.round(usd / 1e6).toLocaleString("en-US")} million`);

/** The critical zones, while the layer is on: the conflicts and the disasters as the map's own layers read them, the travel advice when first wanted. */
export function useCriticalZones(enabled: boolean, conflicts: ConflictLayer | null, hazards: Hazard[] | null): CriticalZones | null {
  const [status, setStatus] = useState<typeof import("../data/countryStatus") | null>(null);
  useEffect(() => {
    if (!enabled || status) return;
    let live = true;
    void (STATUS ??= import("../data/countryStatus")).then((m) => live && setStatus(m));
    return () => {
      live = false;
    };
  }, [enabled, status]);
  return useMemo(() => {
    if (!enabled) return null;
    const zones = new Map<string, CriticalReason[]>();
    const add = (cc: string, r: CriticalReason) => {
      const was = zones.get(cc);
      if (was) was.push(r);
      else zones.set(cc, [r]);
    };
    if (status)
      for (const [cc, s] of Object.entries(status.COUNTRY_STATUS)) {
        for (const a of s.us ?? []) if (a.level === 4) add(cc, { by: "travel", said: `US State Department: ${a.name} - Level 4, ${a.advice}, since ${dayOf(a.issued)}`, url: a.url });
        if (s.uk?.status.includes("avoid_all_travel_to_whole_country"))
          add(cc, { by: "travel", said: `UK Foreign Office: ${s.uk.name} - advises against all travel to the whole country, as of ${dayOf(s.uk.updated)}`, url: s.uk.url });
      }
    if (conflicts) {
      const by = new Map<string, { deaths: number; events: number }>();
      for (const r of conflicts.rows) {
        const cc = r[11];
        if (!cc || r[4] <= 0) continue;
        const was = by.get(cc) ?? { deaths: 0, events: 0 };
        by.set(cc, { deaths: was.deaths + r[4], events: was.events + r[3] });
      }
      for (const [cc, x] of by)
        add(cc, {
          by: "conflict",
          said: `Uppsala Conflict Data Program: ${x.deaths.toLocaleString("en-US")} killed in ${x.events.toLocaleString("en-US")} event${x.events === 1 ? "" : "s"} of organised violence in ${monthOf(conflicts.month)}, its best estimate`,
        });
    }
    if (hazards)
      for (const h of hazards)
        if (h.alert === "Red")
          for (const cc of new Set(h.codes))
            add(cc, { by: "disaster", said: `GDACS: red alert - ${HAZARD_KINDS[h.kind]}${h.name ? ` ${h.name}` : ""}, ${daysOf(h.from, h.to)}`, url: h.report || undefined });
    for (const p of HUMANITARIAN_PLANS)
      for (const cc of p.countries)
        add(cc, { by: "humanitarian", said: `UN OCHA: ${p.name} - ${p.kind.toLowerCase()}, ${daysOf(p.from, p.to)}${p.needs ? `, asking ${money(p.needs)}` : ""}`, url: planUrl(p.id) });
    // Each country's reasons in the order the four are told.
    const order = CRITICAL_BY.map((b) => b.id);
    for (const rs of zones.values()) rs.sort((a, b) => order.indexOf(a.by) - order.indexOf(b.by));
    return {
      zones,
      read: { travel: Boolean(status), conflict: Boolean(conflicts), disaster: Boolean(hazards), humanitarian: true },
      advisedOn: status?.COUNTRY_STATUS_RETRIEVED,
      month: conflicts?.month,
      status: status ?? undefined,
    };
  }, [enabled, status, conflicts, hazards]);
}

/** How many of the four name a country. */
export const namedBy = (rs: CriticalReason[]) => new Set(rs.map((r) => r.by)).size;
