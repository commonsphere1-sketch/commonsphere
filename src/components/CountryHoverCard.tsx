/**
 * The card a world map shows by the pointer when it is over a country, as asked: the country's name, the time now at its
 * capital and its zone, how many times its clocks show where they show more than one, and the latitude and longitude of
 * the point under the pointer.
 *
 * The zone is the country's capital's, by the IANA time zone database (timeZones.ts); the time it shows now, summer time
 * and all, is worked out by the reader's browser from its own copy of the same database. The point is worked out here
 * from where the pointer is on the map, by the map's own projection.
 *
 * The card keeps its own state, set by the map through its handle, so that the pointer moving over a country redraws the
 * card alone and not the map.
 */
import { forwardRef, useImperativeHandle, useState } from "react";
import { createPortal } from "react-dom";
import { COUNTRY_ZONES, ZONES } from "../data/timeZones";
import { countriesData } from "../data/countriesData";
import { minutesOf, offset, useMinute } from "./LocalTime";

/** The part of a d3 projection the card needs: the way back from the map to the globe. */
type Projection = { invert?: ((p: [number, number]) => [number, number] | null) | null };
export type CountryHoverHandle = {
  /** Shows, or moves, the card for a country, from the pointer's event on the country's shape. */
  show: (e: React.MouseEvent<SVGElement>, cc: string, name: string, projection: Projection) => void;
  hide: () => void;
};

const CAPITAL = new Map(countriesData.map((c) => [c.code, c.capital]));
/** A latitude or longitude as an atlas gives it: degrees to two places, and the hemisphere. */
const deg = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

export const CountryHoverCard = forwardRef<CountryHoverHandle>(function CountryHoverCard(_, ref) {
  const [at, setAt] = useState<{ cc: string; name: string; x: number; y: number; lon: number; lat: number } | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      show(e, cc, name, projection) {
        // The pointer on the screen, back through the shape's own drawing - the map's zoom and pan - to the projection's plane, then to the globe.
        const m = (e.currentTarget as SVGGraphicsElement).getScreenCTM?.();
        let lon = NaN;
        let lat = NaN;
        if (m && projection.invert) {
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
          const ll = projection.invert([p.x, p.y]);
          if (ll && Number.isFinite(ll[0]) && Number.isFinite(ll[1])) [lon, lat] = ll;
        }
        setAt({ cc, name, x: e.clientX, y: e.clientY, lon, lat });
      },
      hide() {
        setAt(null);
      },
    }),
    [],
  );
  const now = useMinute();
  if (!at) return null;

  const zones = COUNTRY_ZONES[at.cc];
  let time: { clock: string; long: string; off: string; at?: string; span?: string } | null = null;
  if (zones) {
    const zone = ZONES[zones[0]];
    try {
      const clock = new Intl.DateTimeFormat(undefined, { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(now);
      const long = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "long" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "";
      // How many times its clocks show now: its zones' offsets, those keeping the same time counted once.
      const offsets = [...new Set(zones[1].map((i) => minutesOf(ZONES[i], now)))].sort((a, b) => a - b);
      time = {
        clock,
        long,
        off: offset(minutesOf(zone, now)),
        at: offsets.length > 1 ? CAPITAL.get(at.cc) : undefined,
        span: offsets.length > 1 ? `${offsets.length} times now, ${offset(offsets[0])} to ${offset(offsets[offsets.length - 1])}` : undefined,
      };
    } catch {
      // A zone this browser's copy of the database does not hold: no time is said.
    }
  }
  const W = 256;
  const left = Math.max(12, Math.min(at.x + 16, window.innerWidth - W - 12));
  const top = Math.max(12, Math.min(at.y + 16, window.innerHeight - 150));
  return createPortal(
    <div role="tooltip" className="fixed z-50 rounded-xl border modal-glass shadow-2xl px-3 py-2.5 pointer-events-none" style={{ left, top, width: W }}>
      <p className="text-[13px] font-semibold font-sans text-foreground leading-snug">{at.name}</p>
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
        {Number.isFinite(at.lat) && (
          <>
            <dt className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Here</dt>
            <dd className="text-[11px] font-mono text-foreground tabular-nums">
              {deg(at.lat, "N", "S")}, {deg(at.lon, "E", "W")}
            </dd>
          </>
        )}
      </dl>
      <p className="text-[9px] font-sans text-muted-foreground leading-snug mt-1.5">Time by the IANA time zone database, worked out in your browser; the point under the pointer, worked out from the map.</p>
    </div>,
    document.body,
  );
});
