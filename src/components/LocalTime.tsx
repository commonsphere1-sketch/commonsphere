/**
 * The time now where a place is, as asked: in the head of its window, beside where it is - the hour and minute, its offset
 * from UTC, the day where it is not the reader's, and for a country or a US state whose clocks show more than one time, how
 * many they show.
 *
 * The zone is the place's own, by the IANA time zone database (timeZones.ts, build-time-zones.cjs); the time the zone shows
 * now, summer time and all, is worked out by the reader's browser from its own copy of the same database, and moves on each
 * minute. A country whose zones all keep one time needs nothing more; a place in one of the countries whose zones do not
 * has its zone in /tz/{CC}.json, fetched once when a window there opens. A place with no zone found shows no time.
 */
import { Clock } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { COUNTRY_ZONES, TZ_MULTI, ZONES, type TzFile } from "../data/timeZones";

export type ZoneOf =
  /** A country: the time at its capital, named by `at`. */
  | { kind: "country"; cc: string; at?: string }
  /** A first-order division by GeoNames' name for it - a US state on the States page: the time at its seat, or at `at`. */
  | { kind: "region"; cc: string; name: string; at?: string }
  /** A division on the Municipalities page: its seat's time where GeoNames names the division so, else at its centre. */
  | { kind: "division"; cc: string; id: string; name: string }
  /** A place GeoNames lists, by its id and its first-order division's place in the file. */
  | { kind: "place"; cc: string; id: number; region: number }
  | { kind: "un"; cc: string; code: number }
  /** A city the Cities page profiles. */
  | { kind: "city"; cc: string; id: string }
  | { kind: "county"; state: string; fips: string }
  /** A second-order division, by its parent's name and its own. */
  | { kind: "admin2"; cc: string; parent: string; name: string };

type Found = { zone: string; at?: string; kinds?: string[] };

const FILES = new Map<string, Promise<TzFile | null>>();
const fileOf = (cc: string) => {
  if (!FILES.has(cc))
    FILES.set(
      cc,
      fetch(`/tz/${cc}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<TzFile>) : null))
        .catch(() => null),
    );
  return FILES.get(cc)!;
};
const zone = (i: number | undefined) => (i === undefined || i < 0 ? undefined : ZONES[i]);
/** The zone most of a group keep, or the one a member keeps where it is another. */
const inGroup = (g: [number, Record<string, number>] | undefined, key: string) => (g ? zone(key in g[1] ? g[1][key] : g[0]) : undefined);

function found(of: ZoneOf, f: TzFile | null): Found | null {
  const cc = of.kind === "county" ? "US" : of.cc;
  const country = COUNTRY_ZONES[cc];
  if (!country) return null;
  if (of.kind === "country") {
    const kinds = country[1].map((i) => ZONES[i]);
    return { zone: ZONES[country[0]], at: kinds.length > 1 ? of.at : undefined, kinds };
  }
  // A country whose zones all keep one time: every place in it keeps that.
  if (!TZ_MULTI.includes(cc)) return { zone: ZONES[country[0]] };
  if (!f) return null;
  const z = (i: number | undefined, at?: string, kinds?: number[]) => {
    const name = zone(i);
    return name ? { zone: name, at, kinds: kinds?.map((k) => ZONES[k]) } : null;
  };
  switch (of.kind) {
    case "region": {
      const r = f.regions?.[of.name];
      return r ? z(r[1], of.at ?? (r[0] || undefined), r[2]) : null;
    }
    case "division": {
      const r = f.regions?.[of.name];
      if (r && r[1] >= 0) return z(r[1], r[0] || undefined, r[2]);
      return z(f.divisions?.[of.id], "its centre");
    }
    case "place":
      return z(f.ex && String(of.id) in f.ex ? f.ex[of.id] : f.rm?.[of.region]);
    case "un":
      return z(f.un?.[of.code]);
    case "city":
      return z(f.cities?.[of.id]);
    case "county": {
      const name = inGroup(f.counties?.[of.state], of.fips);
      return name ? { zone: name, at: "its centre" } : null;
    }
    case "admin2": {
      const name = inGroup(f.admin2?.[of.parent], of.name);
      return name ? { zone: name, at: "its centre" } : null;
    }
  }
}

function useZone(of: ZoneOf): Found | null {
  const key = JSON.stringify(of);
  const cc = of.kind === "county" ? "US" : of.cc;
  const needs = of.kind !== "country" && TZ_MULTI.includes(cc);
  const [f, setF] = useState<{ key: string; file: TzFile | null } | null>(null);
  useEffect(() => {
    if (!needs) return;
    let live = true;
    void fileOf(cc).then((file) => live && setF({ key, file }));
    return () => {
      live = false;
    };
  }, [key, cc, needs]);
  if (!needs) return found(of, null);
  return f?.key === key ? found(of, f.file) : null;
}

/** The time now, moved on at each new minute. */
export function useMinute() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = window.setTimeout(function tick() {
      setNow(new Date());
      timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    }, 60_000 - (Date.now() % 60_000) + 50);
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

/** A zone's offset from UTC now, in minutes. */
export const minutesOf = (zone: string, now: Date) => {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = s.match(/GMT([+-])(\d{2}):(\d{2})/);
  return m ? (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0;
};
export const offset = (min: number) => `UTC${min < 0 ? "−" : "+"}${Math.floor(Math.abs(min) / 60)}${Math.abs(min) % 60 ? `:${String(Math.abs(min) % 60).padStart(2, "0")}` : ""}`;

export function LocalTime({ of }: { of: ZoneOf }) {
  const found = useZone(of);
  const now = useMinute();
  if (!found) return null;
  let time: string;
  let long: string;
  try {
    time = new Intl.DateTimeFormat(undefined, { timeZone: found.zone, hour: "numeric", minute: "2-digit" }).format(now);
    long = new Intl.DateTimeFormat("en", { timeZone: found.zone, timeZoneName: "long" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    // A zone this browser's copy of the database does not hold.
    return null;
  }
  const day = (zone?: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const weekday = day(found.zone) !== day() ? new Intl.DateTimeFormat(undefined, { timeZone: found.zone, weekday: "short" }).format(now) : "";
  // How many times its clocks show now: its zones' offsets, those keeping the same time counted once.
  const offsets = [...new Set((found.kinds ?? []).map((z) => minutesOf(z, now)))].sort((a, b) => a - b);
  const here = minutesOf(found.zone, now);
  const said = [
    `${long}${found.at ? `, the time at ${found.at.replace(/\.$/, "")}` : ""}.`,
    offsets.length > 1 ? `Clocks there now show ${offsets.length} times, ${offset(offsets[0])} to ${offset(offsets[offsets.length - 1])}.` : "",
    "Worked out in your browser from the IANA time zone database.",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium font-sans text-foreground/80 whitespace-nowrap tabular-nums" title={said} aria-label={`Local time ${weekday ? `${weekday} ` : ""}${time}, ${offset(here)}. ${said}`}>
      <Clock size={12} weight="fill" className="shrink-0" aria-hidden />
      {weekday && <span>{weekday}</span>}
      <span>{time}</span>
      <span className="text-foreground/60">{offset(here)}</span>
      {offsets.length > 1 && <span className="text-foreground/60">· {offsets.length} local times</span>}
    </span>
  );
}
