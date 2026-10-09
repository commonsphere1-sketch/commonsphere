/**
 * A place's outline, with the places inside it as dots: the small map at the
 * head of a window on the Municipalities page - a country's, a division's, a
 * county's, a district's - and, in a town's window, the outline of the place
 * it lies in with the town itself marked.
 *
 * It shows where things are and nothing else: every dot is one size, whatever
 * the place's people, and the outline is the one the site's maps draw,
 * simplified for them.
 */
import { useMemo } from "react";
import { geoAzimuthalEqualArea, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { PlaceRow } from "../data/placesIndex";
import type { Outline } from "../lib/outlines";

const W = 640;
const H = 260;

/** A point on the map: a place by its name. */
export type MapDot = { id: string | number; name: string; lon: number; lat: number };

/** The places of a list as dots: the first of them, which in a country's list are its largest. */
export const placeDots = (rows: PlaceRow[], most = 300): MapDot[] => rows.slice(0, most).map((p) => ({ id: p[6], name: p[0], lon: p[2], lat: p[1] }));

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
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto modal-tile rounded-xl" role="img" aria-label={label}>
      {drawn.paths.map((p) => (
        <path key={p.key} d={p.d} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={drawn.paths.length > 1 ? 0.8 : 1.4} strokeLinejoin="round" />
      ))}
      {drawn.dots.map((p) => (
        <circle key={p.id} cx={p.x} cy={p.y} r={drawn.mark ? 1.8 : 2.4} className="fill-foreground" fillOpacity={drawn.mark ? 0.45 : 0.85}>
          <title>{p.name}</title>
        </circle>
      ))}
      {drawn.mark && (
        <circle cx={drawn.mark.x} cy={drawn.mark.y} r={5.5} fill={color} className="stroke-foreground" strokeWidth={1.6}>
          <title>{drawn.mark.name}</title>
        </circle>
      )}
    </svg>
  );
}
