/**
 * The card a world map shows by the pointer when it is over a place, as asked - a country, and drawn closer a state or
 * province, a county or district: its name, the time now there and its zone, how many times its clocks show where they
 * show more than one, and the latitude and longitude of the point under the pointer.
 *
 * The zone is the place's own, by the IANA time zone database (timeZones.ts, build-time-zones.cjs): a country's capital's;
 * a state's or province's seat's, with every zone kept in it; a county's or district's own where it keeps another time
 * than most of its state or province, else theirs. A country whose zones all keep one time needs nothing more; for the 20
 * whose zones do not, the places' zones are in /tz/{CC}.json, fetched once when the pointer first comes onto one. Where
 * no zone is found for a place, no time is said. The time a zone shows now, summer time and all, is worked out by the
 * reader's browser from its own copy of the same database, from the time now as the site's server has it (trueTime.ts) -
 * not the reader's computer's clock alone, which can be set wrong. The point is worked out from where the pointer is on
 * the map, by the map's own projection.
 *
 * The card keeps its own state, set by the map through its handle, so that the pointer moving over a place redraws the
 * card alone and not the map.
 */
import { forwardRef, useImperativeHandle, useState } from "react";
import { createPortal } from "react-dom";
import { COUNTRY_ZONES, TZ_MULTI, ZONES, type TzFile } from "../data/timeZones";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { fileOf, minutesOf, offset, useMinute } from "./LocalTime";

/** The part of a d3 projection the card needs: the way back from the map to the globe. */
type Projection = { invert?: ((p: [number, number]) => [number, number] | null) | null };
/** Which place's zone is wanted: a country; a first-order division by name; a US county by its state and FIPS code; a second-order division by its parent's name and its own. */
export type PlaceZone =
  | { kind: "country"; cc: string }
  | { kind: "division"; cc: string; name: string }
  | { kind: "county"; state: string; fips: string }
  | { kind: "district"; cc: string; parent?: string; name: string };
/** What the card says of a place: its name, what it lies in (a line under the name), and where its zone is to be found. */
export type HoverPlace = { name: string; kicker?: string; zone: PlaceZone };
export type CountryHoverHandle = {
  /** Shows, or moves, the card for a place, from the pointer's event on the place's shape. */
  show: (e: React.MouseEvent<SVGElement>, place: HoverPlace, projection: Projection) => void;
  hide: () => void;
};

const CAPITAL = new Map(countriesData.map((c) => [c.code, c.capital]));
/** A US state's postal code by its name, and by itself. */
const STATE_CODE = new Map<string, string>([...usStatesData.flatMap((s) => [[s.name, s.abbreviation], [s.abbreviation, s.abbreviation]] as [string, string][]), ["District of Columbia", "DC"], ["DC", "DC"]]);
/** A latitude or longitude as an atlas gives it: degrees to two places, and the hemisphere. */
const deg = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;
const ccOf = (z: PlaceZone) => (z.kind === "county" ? "US" : z.cc);
/** A zone by its place in ZONES; -1, or none, is no zone found. */
const named = (i: number | undefined) => (i === undefined || i < 0 ? undefined : ZONES[i]);

/** The files of the countries whose zones keep different times, once in: the card is drawn again as each comes. */
const LOADED = new Map<string, TzFile | null>();

type Found = { zone: string; at?: string; kinds?: string[] };
/** A place's zone, where it is found: undefined while its country's file is still to come. */
function zoneOf(z: PlaceZone): Found | null | undefined {
  const cc = ccOf(z);
  const country = COUNTRY_ZONES[cc];
  if (!country) return null;
  const kinds = (list?: number[]) => list?.map((i) => ZONES[i]).filter(Boolean);
  if (z.kind === "country") return { zone: ZONES[country[0]], at: country[1].length > 1 ? CAPITAL.get(cc) : undefined, kinds: kinds(country[1]) };
  // A country whose zones all keep one time: every place in it keeps that.
  if (!TZ_MULTI.includes(cc)) return { zone: ZONES[country[0]] };
  if (!LOADED.has(cc)) return undefined;
  const f = LOADED.get(cc);
  if (!f) return null;
  /** A first-order division: its seat's zone and every zone kept in it, by GeoNames' name for it; else the zone most of it keeps, by the maps' name. */
  const division = (name: string): Found | null => {
    const r = f.regions?.[name];
    if (r && named(r[1])) return { zone: named(r[1])!, at: r[2] && r[2].length > 1 ? r[0] || undefined : undefined, kinds: kinds(r[2]) };
    const a = f.admin2?.[name];
    if (a && named(a[0])) return { zone: named(a[0])!, kinds: kinds([...new Set([a[0], ...Object.values(a[1])].filter((i) => i >= 0))]) };
    return null;
  };
  switch (z.kind) {
    case "division":
      return division(z.name);
    case "county": {
      const st = STATE_CODE.get(z.state);
      const c = st ? f.counties?.[st] : undefined;
      const zone = c ? named(z.fips in c[1] ? c[1][z.fips] : c[0]) : undefined;
      return zone ? { zone } : null;
    }
    case "district": {
      const a = z.parent ? f.admin2?.[z.parent] : undefined;
      const zone = a ? named(z.name in a[1] ? a[1][z.name] : a[0]) : undefined;
      if (zone) return { zone };
      // Its province's, where the district's own is not held.
      const p = z.parent ? division(z.parent) : null;
      return p && (!p.kinds || p.kinds.length <= 1) ? { zone: p.zone } : null;
    }
  }
}

export const CountryHoverCard = forwardRef<CountryHoverHandle>(function CountryHoverCard(_, ref) {
  const [at, setAt] = useState<{ place: HoverPlace; x: number; y: number; lon: number; lat: number } | null>(null);
  const [, setFiles] = useState(0);
  useImperativeHandle(
    ref,
    () => ({
      show(e, place, projection) {
        // The pointer on the screen, back through the shape's own drawing - the map's zoom and pan - to the projection's plane, then to the globe.
        const m = (e.currentTarget as SVGGraphicsElement).getScreenCTM?.();
        let lon = NaN;
        let lat = NaN;
        if (m && projection.invert) {
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
          const ll = projection.invert([p.x, p.y]);
          if (ll && Number.isFinite(ll[0]) && Number.isFinite(ll[1])) [lon, lat] = ll;
        }
        setAt({ place, x: e.clientX, y: e.clientY, lon, lat });
        // The country's file of places' zones, where its zones keep different times: fetched once, and the card drawn again.
        const cc = ccOf(place.zone);
        if (place.zone.kind !== "country" && TZ_MULTI.includes(cc) && !LOADED.has(cc))
          void fileOf(cc).then((file) => {
            LOADED.set(cc, file);
            setFiles((n) => n + 1);
          });
      },
      hide() {
        setAt(null);
      },
    }),
    [],
  );
  const now = useMinute();
  if (!at) return null;

  const found = zoneOf(at.place.zone);
  let time: { clock: string; long: string; off: string; at?: string; span?: string } | null = null;
  if (found) {
    try {
      const clock = new Intl.DateTimeFormat(undefined, { timeZone: found.zone, hour: "numeric", minute: "2-digit" }).format(now);
      const long = new Intl.DateTimeFormat("en", { timeZone: found.zone, timeZoneName: "long" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "";
      // How many times its clocks show now: its zones' offsets, those keeping the same time counted once.
      const offsets = [...new Set((found.kinds ?? []).map((k) => minutesOf(k, now)))].sort((a, b) => a - b);
      time = {
        clock,
        long,
        off: offset(minutesOf(found.zone, now)),
        at: offsets.length > 1 ? found.at : undefined,
        span: offsets.length > 1 ? `${offsets.length} times now, ${offset(offsets[0])} to ${offset(offsets[offsets.length - 1])}` : undefined,
      };
    } catch {
      // A zone this browser's copy of the database does not hold: no time is said.
    }
  }
  const W = 256;
  const left = Math.max(12, Math.min(at.x + 16, window.innerWidth - W - 12));
  const top = Math.max(12, Math.min(at.y + 16, window.innerHeight - 170));
  return createPortal(
    <div role="tooltip" className="fixed z-50 rounded-xl border modal-glass shadow-2xl px-3 py-2.5 pointer-events-none" style={{ left, top, width: W }}>
      <p className="text-[13px] font-semibold font-sans text-foreground leading-snug">{at.place.name}</p>
      {at.place.kicker && <p className="text-[10px] font-sans text-muted-foreground leading-snug">{at.place.kicker}</p>}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 mt-1.5 items-baseline">
        {time && (
          <>
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Time</dt>
            <dd className="text-[11px] font-sans text-foreground tabular-nums">
              {time.clock}
              {time.at ? <span className="text-muted-foreground"> at {time.at.replace(/\.$/, "")}</span> : null}
            </dd>
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Zone</dt>
            <dd className="text-[11px] font-sans text-foreground">
              <span className="tabular-nums">{time.off}</span>
              {time.long ? <span className="text-muted-foreground"> · {time.long}</span> : null}
            </dd>
            {time.span && (
              <>
                <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Clocks</dt>
                <dd className="text-[11px] font-sans text-foreground tabular-nums">{time.span}</dd>
              </>
            )}
          </>
        )}
        {found === undefined && (
          <>
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Time</dt>
            <dd className="text-[11px] font-sans text-muted-foreground">reading…</dd>
          </>
        )}
        {Number.isFinite(at.lat) && (
          <>
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Here</dt>
            <dd className="text-[11px] font-mono text-foreground tabular-nums">
              {deg(at.lat, "N", "S")}, {deg(at.lon, "E", "W")}
            </dd>
          </>
        )}
      </dl>
      <p className="text-[9px] font-sans text-muted-foreground leading-snug mt-1.5">Time by the site&apos;s clock and the IANA time zone database, summer time and all; the point under the pointer, worked out from the map.</p>
    </div>,
    document.body,
  );
});
