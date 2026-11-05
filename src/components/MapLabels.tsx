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
  /**
   * An area's name that must be set, as asked of a country's divisions: where it does not fit at its size it is tried
   * smaller (down to `min`), then as `short` ("VT" for Vermont), and where neither fits or each would meet another name,
   * it is set beside the map with a line to the area's middle.
   */
  always?: { short?: string; min?: number };
};

export type PlacedLabel = LabelCandidate & { fs: number; /** Where a name set beside the map points: the area's middle. */ lead?: [number, number] };

/** Where an area's name goes: the middle of its largest piece of land, with that piece's width and height - so that a country's name sits on its mainland and not in the sea between its islands. */
export type Anchor = { x: number; y: number; w: number; h: number };
type PathLike = { area(o: never): number; centroid(o: never): [number, number]; bounds(o: never): [[number, number], [number, number]] };
export function anchorOf(path: PathLike, geo: unknown): Anchor | undefined {
  const g = ((geo as { geometry?: unknown }).geometry ?? geo) as { type?: string; coordinates?: unknown[] } | null;
  if (!g?.type) return undefined;
  const pieces = g.type === "MultiPolygon" ? (g.coordinates ?? []).map((c) => ({ type: "Polygon", coordinates: c })) : [g];
  let best: (Anchor & { a: number }) | undefined;
  for (const p of pieces) {
    const a = path.area(p as never);
    if (!(a > 0) || (best && a <= best.a)) continue;
    const [x, y] = path.centroid(p as never);
    const [[x0, y0], [x1, y1]] = path.bounds(p as never);
    if (Number.isFinite(x) && Number.isFinite(y)) best = { x, y, w: x1 - x0, h: y1 - y0, a };
  }
  return best && { x: best.x, y: best.y, w: best.w, h: best.h };
}

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
  const pad = 2 / k;
  const free = (bx0: number, by0: number, bx1: number, by1: number) => !boxes.some(([a, b, cc, d]) => bx0 - pad < cc && bx1 + pad > a && by0 - pad < d && by1 + pad > b);
  /** Names that must be set and found no room: set beside the map afterwards. */
  const aside: LabelCandidate[] = [];
  /** The last rank a name that must be set has: those beside the map are set once every name up to it has been. */
  const lastAlways = Math.max(-Infinity, ...cands.filter((c) => c.always).map((c) => c.rank));
  let asideDone = false;
  for (const [c] of order) {
    if (out.length >= most) break;
    if (!asideDone && c.rank > lastAlways) {
      setAside();
      asideDone = true;
    }
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
    if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) {
      if (!c.always) continue;
    }
    // The ways it may be set, in turn: at its size, smaller, then its short form.
    const tries: [string, number][] = [[c.text, c.size]];
    if (c.always) {
      for (let s = c.size - 1; s >= (c.always.min ?? 7.5); s -= 1) tries.push([c.text, s]);
      if (c.always.short) tries.push([c.always.short, Math.max(c.always.min ?? 7.5, c.size - 1.5)]);
    }
    let set = false;
    for (const [text, size] of tries) {
      const fs = size / k;
      const w = text.length * fs * CHAR;
      const h = fs * 1.2;
      // An area's name only where it fits inside the area - its short form a little more freely.
      const short = text !== c.text;
      if (c.w !== undefined && (w > c.w * (short ? 1.1 : 0.95) || h > (c.h ?? Infinity) * (short ? 1.1 : 0.9))) continue;
      const bx0 = c.town ? c.x : c.x - w / 2;
      const bx1 = c.town ? c.x + 4 / k + w : c.x + w / 2;
      const by0 = c.y - h / 2;
      const by1 = c.y + h / 2;
      if (bx1 < x0 || bx0 > x1 || by1 < y0 || by0 > y1) continue;
      // A little room round each, so that two names are not set edge to edge.
      if (!free(bx0, by0, bx1, by1)) continue;
      boxes.push([bx0, by0, bx1, by1]);
      out.push({ ...c, text, fs });
      set = true;
      break;
    }
    if (!set && c.always && c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1) aside.push(c);
  }
  if (!asideDone) setAside();
  return out;

  // Those beside the map: a column to the right of every area set, each as near its area's height as the names above it
  // allow, a line from it to the area's middle - set before the towns' names, so that none lies under them.
  function setAside() {
    if (!aside.length) return;
    const fs = Math.max(...aside.map((c) => c.always?.min ?? 7.5)) / k;
    const h = fs * 1.25;
    const right = Math.max(...aside.map((c) => c.x + (c.w ?? 0) / 2)) + 10 / k;
    let y = -Infinity;
    for (const c of aside.sort((a, b) => a.y - b.y).slice(0, 16)) {
      const text = c.always?.short ?? c.text;
      const w = text.length * fs * CHAR;
      y = Math.max(c.y, y + h);
      const xs = Math.min(right, x1 - w - 2 / k);
      if (y > y1 - h / 2) break;
      boxes.push([xs, y - h / 2, xs + w, y + h / 2]);
      out.push({ ...c, text, x: xs + w / 2, y, fs, lead: [c.x, c.y] });
    }
  }
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
          <g key={l.key}>
            {/* A name set beside the map: a fine line from it to its area's middle. */}
            {l.lead && <line x1={l.lead[0]} y1={l.lead[1]} x2={l.x - (l.text.length * l.fs * CHAR) / 2 - 1.5 / k} y2={l.y} stroke={ink} strokeOpacity={0.55} strokeWidth={0.6 / k} />}
            {l.lead && <circle cx={l.lead[0]} cy={l.lead[1]} r={1.2 / k} fill={ink} />}
            <text x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" className="font-sans" style={{ fontSize: l.fs, fontWeight: l.weight ?? 600, fill: ink, stroke: halo, strokeWidth: 2.6 / k, strokeLinejoin: "round", paintOrder: "stroke" }}>
              {l.text}
            </text>
          </g>
        ),
      )}
    </g>
  );
}
