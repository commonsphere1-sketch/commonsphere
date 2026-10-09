/**
 * A place's outline, with the places inside it as dots: the small map at the
 * head of a window - a country's, a division's, a county's, a district's -
 * and, in a town's window, the outline of the place it lies in with the town
 * itself marked.
 *
 * It shows where things are and nothing else: every dot is one size, whatever
 * the place's people, and the outline is the one the site's maps draw,
 * simplified for them. A dot pointed at says what it is: its name, and under
 * it what it belongs to - the district and division GeoNames files it under,
 * and its people where GeoNames gives them.
 */
import { useMemo, useState } from "react";
import { geoAzimuthalEqualArea, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { PlaceRow, PlacesFile } from "../data/placesIndex";
import type { Outline } from "../lib/outlines";

const W = 640;
const H = 260;

/** A point on the map: a place by its name, and what is said under its name when it is pointed at. */
export type MapDot = { id: string | number; name: string; lon: number; lat: number; sub?: string };

/**
 * The places of a list as dots: the first of them, which in a country's list are its largest. With the list's file, each
 * says what it belongs to - its district and its division, as GeoNames files it - and its people.
 */
export const placeDots = (rows: PlaceRow[], most = 300, file?: PlacesFile | null): MapDot[] =>
  rows.slice(0, most).map((p) => {
    // A district named for its division - Beijing in Beijing - is said once.
    const where = file ? [...new Set([file.districts[p[7]], file.regions[p[4]]].filter(Boolean))].join(" · ") : "";
    const people = p[3] > 0 ? `${p[3].toLocaleString("en-US")} people, as GeoNames has it` : "";
    return { id: p[6], name: p[0], lon: p[2], lat: p[1], sub: [where, people].filter(Boolean).join(" · ") || undefined };
  });

export function OutlineMap({
  shapes,
  frame,
  dots = [],
  mark,
  color,
  label,
}: {
  /** What is drawn: one outline, or several side by side - a country's divisions. */
  shapes: Outline[];
  /** What the map is framed on, where that is not all of them: a country without its far-off parts. */
  frame?: Outline[];
  dots?: MapDot[];
  /** The one place the window is about, where it is a point and not an outline. */
  mark?: MapDot;
  color: string;
  /** What the map shows, for a screen reader. */
  label: string;
}) {
  const [over, setOver] = useState<string | number | null>(null);
  const drawn = useMemo(() => {
    const on = { type: "FeatureCollection", features: frame?.length ? frame : shapes };
    if (!on.features.length) return null;
    const [lon, lat] = geoCentroid(on as never);
    const l = Number.isFinite(lon) ? lon : 0;
    const box: [[number, number], [number, number]] = [
      [12, 12],
      [W - 12, H - 12],
    ];
    // Turned to its own middle, so that a place across 180° is not split to both edges; about the pole itself near one.
    const projection =
      Number.isFinite(lat) && Math.abs(lat) >= 70 ? geoAzimuthalEqualArea().rotate([-l, -lat]).fitExtent(box, on as never) : geoMercator().rotate([-l, 0]).fitExtent(box, on as never);
    const path = geoPath(projection);
    const at = (d: MapDot) => {
      const xy = projection([d.lon, d.lat]);
      return xy && xy[0] >= 0 && xy[0] <= W && xy[1] >= 0 && xy[1] <= H ? [{ ...d, x: xy[0], y: xy[1] }] : [];
    };
    return { paths: shapes.flatMap((s, i) => (path(s as never) ? [{ key: i, d: path(s as never)! }] : [])), dots: dots.flatMap(at), mark: mark ? at(mark)[0] : undefined };
  }, [shapes, frame, dots, mark]);
  if (!drawn || !drawn.paths.length) return null;
  const said = over === null ? undefined : drawn.mark && drawn.mark.id === over ? drawn.mark : drawn.dots.find((d) => d.id === over);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto modal-tile rounded-xl" role="img" aria-label={label}>
        {drawn.paths.map((p) => (
          <path key={p.key} d={p.d} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={drawn.paths.length > 1 ? 0.8 : 1.4} strokeLinejoin="round" />
        ))}
        {drawn.dots.map((p) => (
          // A clear edge round each dot, so that one so small can still be pointed at.
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={drawn.mark ? 1.8 : 2.4}
            className="fill-foreground cursor-pointer"
            fillOpacity={drawn.mark ? 0.45 : 0.85}
            stroke="transparent"
            strokeWidth={7}
            onMouseEnter={() => setOver(p.id)}
            onMouseLeave={() => setOver((x) => (x === p.id ? null : x))}
          />
        ))}
        {drawn.mark && (
          <circle
            cx={drawn.mark.x}
            cy={drawn.mark.y}
            r={5.5}
            fill={color}
            className="stroke-foreground cursor-pointer"
            strokeWidth={1.6}
            onMouseEnter={() => setOver(drawn.mark!.id)}
            onMouseLeave={() => setOver(null)}
          />
        )}
        {/* The dot pointed at: a ring in the place's colour. */}
        {said && <circle cx={said.x} cy={said.y} r={7.5} fill="none" stroke={color} strokeWidth={1.8} pointerEvents="none" />}
      </svg>
      {/* Its name, and what it belongs to: above the dot, turned to the side that keeps it on the map. */}
      {said && (
        <div
          role="status"
          className="absolute z-10 pointer-events-none modal-glass border rounded-lg px-2.5 py-1.5 shadow-lg max-w-[16rem]"
          style={{
            left: `${(100 * said.x) / W}%`,
            top: `${(100 * said.y) / H}%`,
            transform: `translate(${said.x < W * 0.25 ? "0%" : said.x > W * 0.75 ? "-100%" : "-50%"}, ${said.y < H * 0.3 ? "14px" : "calc(-100% - 12px)"})`,
          }}
        >
          <p className="text-[12px] font-bold font-sans text-foreground leading-tight">{said.name}</p>
          {said.sub && <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">{said.sub}</p>}
        </div>
      )}
    </div>
  );
}
