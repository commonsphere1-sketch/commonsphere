/**
 * The names on a map, as asked: of its areas - countries, states and
 * provinces, counties and districts - and of its towns, at every zoom. As
 * many are set as can be read: each keeps its size on the screen however
 * close the map is drawn, an area's name is set only where it fits inside the
 * area, and none is set over another - the more important first, so that
 * drawing the map closer brings the smaller places' names in. A name left
 * out is still given when its place is pointed at.
 */

/** A name to set: at an area's middle, or beside a town's point. */
export type LabelCandidate = {
  key: string;
  text: string;
  x: number;
  y: number;
  /** The area's width and height in map units, for an area's name: it is set only where it fits. Left out for a town. */
  w?: number;
  h?: number;
  /** Its size on the screen, in pixels. */
  size: number;
  weight?: number;
  /** Which comes first where two would meet: the lower. */
  rank: number;
  /** A town's name, set to the right of its point, with a dot where the map draws none. */
  town?: boolean;
  dot?: boolean;
};

export type PlacedLabel = LabelCandidate & { fs: number };

/** A character's width as a share of the type's size: the site's serif set small. */
const CHAR = 0.56;

/**
 * The names that can be set in the view: `k` is how close the map is drawn (1 the whole of it), and the view's edges are in
 * map units. At most `most`, so that a map of thousands of districts stays quick to draw.
 */
export function placeLabels(cands: LabelCandidate[], view: { x0: number; y0: number; x1: number; y1: number; k: number }, most = 260): PlacedLabel[] {
  const { x0, y0, x1, y1, k } = view;
  const boxes: [number, number, number, number][] = [];
  const out: PlacedLabel[] = [];
  const order = cands.map((c, i) => [c, i] as const).sort((a, b) => a[0].rank - b[0].rank || a[1] - b[1]);
  for (const [c] of order) {
    if (out.length >= most) break;
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
    const fs = c.size / k;
    const w = c.text.length * fs * CHAR;
    const h = fs * 1.2;
    // An area's name only where it fits inside the area.
    if (c.w !== undefined && (w > c.w * 0.95 || h > (c.h ?? Infinity) * 0.9)) continue;
    const bx0 = c.town ? c.x : c.x - w / 2;
    const bx1 = c.town ? c.x + 4 / k + w : c.x + w / 2;
    const by0 = c.y - h / 2;
    const by1 = c.y + h / 2;
    if (bx1 < x0 || bx0 > x1 || by1 < y0 || by0 > y1) continue;
    // A little room round each, so that two names are not set edge to edge.
    const pad = 2 / k;
    if (boxes.some(([a, b, cc, d]) => bx0 - pad < cc && bx1 + pad > a && by0 - pad < d && by1 + pad > b)) continue;
    boxes.push([bx0, by0, bx1, by1]);
    out.push({ ...c, fs });
  }
  return out;
}

/** The names set: in the map's ink, with a halo of the page behind them so that they read over lines and fills. */
export function MapLabels({ labels, k, ink = "var(--color-foreground)", halo = "var(--color-background)", dotInk }: { labels: PlacedLabel[]; k: number; ink?: string; halo?: string; dotInk?: string }) {
  return (
    <g pointerEvents="none" aria-hidden>
      {labels.map((l) =>
        l.town ? (
          <g key={l.key}>
            {l.dot && <circle cx={l.x} cy={l.y} r={1.8 / k} fill={dotInk ?? ink} stroke={halo} strokeWidth={0.6 / k} />}
            <text x={l.x + 4 / k} y={l.y} dominantBaseline="middle" className="font-sans" style={{ fontSize: l.fs, fontWeight: l.weight ?? 500, fill: ink, stroke: halo, strokeWidth: 2.6 / k, strokeLinejoin: "round", paintOrder: "stroke" }}>
              {l.text}
            </text>
          </g>
        ) : (
          <text key={l.key} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" className="font-sans" style={{ fontSize: l.fs, fontWeight: l.weight ?? 600, fill: ink, stroke: halo, strokeWidth: 2.6 / k, strokeLinejoin: "round", paintOrder: "stroke" }}>
            {l.text}
          </text>
        ),
      )}
    </g>
  );
}
