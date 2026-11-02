import { useEffect, useState } from "react";

/**
 * The disasters going on now, from GDACS - the Global Disaster Alert and Coordination System of the United Nations (OCHA,
 * UNOSAT) and the European Commission (JRC, ECHO) - read live in the browser, as asked: earthquakes, tropical cyclones,
 * floods, volcanoes, droughts and forest fires, each event GDACS holds as current, with its alert level - GDACS's estimate
 * of the humanitarian impact, green, orange or red.
 *
 * GDACS's search gives a hundred events a page, newest first, so a kind with more than a hundred current events is read
 * on to the page where the current ones end. Read again every ten minutes while the layer is open.
 */
export const HAZARD_KINDS = {
  EQ: "Earthquake",
  TC: "Tropical cyclone",
  FL: "Flood",
  VO: "Volcano",
  DR: "Drought",
  WF: "Forest fire",
} as const;
export type HazardKind = keyof typeof HAZARD_KINDS;
export const HAZARD_PLURAL: Record<HazardKind, string> = {
  EQ: "earthquakes",
  TC: "tropical cyclones",
  FL: "floods",
  VO: "volcanoes",
  DR: "droughts",
  WF: "forest fires",
};
export type HazardAlert = "Green" | "Orange" | "Red";
export type Hazard = {
  id: string;
  kind: HazardKind;
  name: string;
  alert: HazardAlert;
  from: string;
  to: string;
  country: string;
  severity: string;
  lon: number;
  lat: number;
  report: string;
};
export const GDACS_SOURCES = [
  { label: "GDACS - Global Disaster Alert and Coordination System (UN OCHA, UNOSAT, European Commission), its current events", url: "https://www.gdacs.org/" },
  { label: "GDACS terms of use", url: "https://www.gdacs.org/About/termofuse.aspx" },
];

const SEARCH = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";
const PAGE = 100;
const EVERY_MS = 10 * 60 * 1000;

type Feature = {
  geometry: { type: string; coordinates: [number, number] } | null;
  properties: {
    eventtype: string;
    eventid: number;
    name: string;
    alertlevel: string;
    iscurrent: string;
    country: string;
    fromdate: string;
    todate: string;
    severitydata?: { severitytext?: string };
    url?: { report?: string };
  };
};

async function currentOf(kind: HazardKind, signal: AbortSignal): Promise<Hazard[]> {
  const out = new Map<string, Hazard>();
  for (let page = 1; page <= 6; page++) {
    const r = await fetch(`${SEARCH}?eventlist=${kind}&alertlevel=Green;Orange;Red&pagenumber=${page}`, { signal });
    // GDACS answers "no content" where a page has no events.
    if (r.status === 204) break;
    if (!r.ok) throw new Error(`GDACS ${kind} ${r.status}`);
    const features = ((await r.json()) as { features?: Feature[] }).features ?? [];
    let current = 0;
    for (const f of features) {
      const p = f.properties;
      if (p.iscurrent !== "true" || !f.geometry || f.geometry.type !== "Point") continue;
      current++;
      const [lon, lat] = f.geometry.coordinates;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      const alert = (["Green", "Orange", "Red"] as const).find((a) => a === p.alertlevel);
      if (!alert) continue;
      out.set(`${p.eventtype}-${p.eventid}`, {
        id: `${p.eventtype}-${p.eventid}`,
        kind,
        name: p.name,
        alert,
        from: p.fromdate,
        to: p.todate,
        country: p.country,
        severity: p.severitydata?.severitytext ?? "",
        lon,
        lat,
        report: p.url?.report ?? "https://www.gdacs.org/",
      });
    }
    // Newest first: once a page is not all current, the pages after it are older still.
    if (features.length < PAGE || current < features.length) break;
  }
  return [...out.values()];
}

/** GDACS's current events while `enabled`, read again every ten minutes; `at` is when they were last read. */
export function useGdacsLive(enabled: boolean) {
  const [events, setEvents] = useState<Hazard[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [at, setAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let live = new AbortController();
    const read = () => {
      live.abort();
      live = new AbortController();
      const signal = live.signal;
      Promise.all((Object.keys(HAZARD_KINDS) as HazardKind[]).map((k) => currentOf(k, signal)))
        .then((lists) => {
          if (signal.aborted) return;
          setEvents(lists.flat());
          setFailed(false);
          setAt(new Date());
        })
        .catch(() => {
          if (!signal.aborted) setFailed(true);
        });
    };
    read();
    const timer = window.setInterval(read, EVERY_MS);
    return () => {
      window.clearInterval(timer);
      live.abort();
    };
  }, [enabled]);

  return { events, loading: enabled && !events && !failed, failed: failed && !events, at };
}
