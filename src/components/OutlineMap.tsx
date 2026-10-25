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
 * and its people where GeoNames gives them. Where several outlines are drawn
 * side by side - a country's divisions - the one pointed at is picked out and
 * named, and a press on it opens it where the map's owner says how. A dot
 * pressed goes straight to the
 * place's own window, where the map's owner says how.
 *
 * Inside the outlines it draws the finer borders it is given - a state's
 * counties, a province's districts - as thin lines in the same colour. Drawn
 * closer, those smaller places are what is pointed at, as on the Dashboard's
 * map: each is picked out and named, and a press opens it where the map's
 * owner says how. From far out they are borders only, and the outlines
 * themselves are what is pointed at.
 *
 * It can be drawn closer, as the site's other maps can: with the wheel or a
 * trackpad, two fingers pinched on a touch screen, the buttons at its corner
 * and the + and - keys; closer in, it is moved by dragging or with the arrow
 * keys, and 0 or Reset puts it back. A turn of the wheel that would change
 * nothing is left to scroll the window, and one finger still scrolls the
 * window over a map that is whole. Lines and dots keep their size on the
 * screen however close it is drawn, so that places part as it closes in.
 *
 * A place in parts that lie apart - the United States' Alaska and Hawaii,
 * Portugal's Azores - opens on its main part, the largest, as asked, with the
 * others a swipe away: a finger or the mouse drawn sideways across the map,
 * the arrows under it, or the arrow keys while it is whole. Each part is
 * framed on its own; the parts are told apart in lib/outlines (outlineParts).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, CaretRight, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { geoAzimuthalEqualArea, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { PlaceRow, PlacesFile } from "../data/placesIndex";
import { outlineParts, type Outline } from "../lib/outlines";
import { MapLabels, placeLabels, type LabelCandidate } from "./MapLabels";

const W = 640;
const H = 260;
/** How close it can be drawn. */
const MAX_K = 60;
/** How close it must be drawn for the places inside the outlines to be what is pointed at. */
const PARTS_FROM = 1.6;

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
  inner,
  parts,
  onPart,
  dots = [],
  mark,
  color,
  label,
  onDot,
  onShape,
}: {
  /** What is drawn: one outline, or several side by side - a country's divisions. */
  shapes: Outline[];
  /** No longer used: a place in parts that lie apart is shown a part at a time (outlineParts), and one whose parts lie together whole. Kept so that the windows that pass it need not change. */
  frame?: Outline[];
  /** The finer borders inside what is drawn, as lines: those between its second-order divisions. */
  inner?: unknown;
  /** The second-order divisions themselves: what is pointed at once the map is drawn closer. Each is named by properties.n, with the division it lies in in properties.p. */
  parts?: Outline[];
  /** What a press on one of them does, by its place in `parts`: it opens that place's own window. Left out, one pointed at is only picked out and named. */
  onPart?: (i: number) => void;
  dots?: MapDot[];
  /** The one place the window is about, where it is a point and not an outline. */
  mark?: MapDot;
  color: string;
  /** What the map shows, for a screen reader. */
  label: string;
  /** What a press on a dot does: it opens the place's own window. Left out, a dot only says what it is. */
  onDot?: (d: MapDot) => void;
  /** What a press on one of several outlines does: it opens that division. Left out, an outline pointed at is only picked out and named. */
  onShape?: (shape: Outline) => void;
}) {
  /** Which of several outlines is pointed at. */
  const [lit, setLit] = useState<number | null>(null);
  const [over, setOver] = useState<string | number | null>(null);
  /** Which of the places inside is pointed at, once the map is drawn closer. */
  const [litPart, setLitPart] = useState<number | null>(null);
  /* The groups of outlines that lie apart, the main one first, and which of them the map is framed on. */
  const groups = useMemo(() => outlineParts(shapes), [shapes]);
  const slides = groups.length > 1;
  const [slide, setSlide] = useState(0);
  useEffect(() => setSlide(0), [groups]);
  const onSlide = Math.min(slide, groups.length - 1);
  /* How close the map is drawn, and where its middle is, in the map's own units: 1 is the whole of it. */
  const [view, setView] = useState({ k: 1, x: W / 2, y: H / 2 });
  /** Kept on the map: no closer than it goes, no further out than the whole, and never past an edge. */
  const held = (k: number, x: number, y: number) => {
    const z = Math.max(1, Math.min(MAX_K, k));
    const hw = W / (2 * z);
    const hh = H / (2 * z);
    return { k: z, x: Math.max(hw, Math.min(W - hw, x)), y: Math.max(hh, Math.min(H - hh, y)) };
  };
  /** Closer or further by a factor, about the middle of what is in view. */
  const zoomBy = (factor: number) => setView((v) => held(v.k * factor, v.x, v.y));
  const panBy = (dx: number, dy: number) => setView((v) => held(v.k, v.x + dx, v.y + dy));
  const resetView = () => setView({ k: 1, x: W / 2, y: H / 2 });
  /** Another of the parts, whole: going on from the last comes round to the first. */
  const goTo = (i: number) => {
    setSlide(((i % groups.length) + groups.length) % groups.length);
    resetView();
  };
  /** Closer or further about a point of the screen, which stays where it is. */
  const zoomAt = (factor: number, clientX: number, clientY: number, r: DOMRect) =>
    setView((v) => {
      const k = Math.max(1, Math.min(MAX_K, v.k * factor));
      const px = v.x - W / (2 * v.k) + ((clientX - r.left) / r.width) * (W / v.k);
      const py = v.y - H / (2 * v.k) + ((clientY - r.top) / r.height) * (H / v.k);
      return held(k, px - (px - v.x) * (v.k / k), py - (py - v.y) * (v.k / k));
    });
  /* The wheel, and a trackpad's pinch, about the pointer. A turn that would change nothing - further out when the map is
     whole - is left alone, so that it scrolls the window. The listener is put on by hand: one that can stop the scroll
     cannot be passive. */
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const kRef = useRef(1);
  kRef.current = view.k;
  useEffect(() => {
    if (!svgEl) return;
    const onWheel = (e: WheelEvent) => {
      const closer = e.deltaY < 0;
      if (e.deltaY === 0 || (closer ? kRef.current >= MAX_K : kRef.current <= 1)) return;
      e.preventDefault();
      const notches = Math.min(4, Math.abs(e.deltaY) * (e.deltaMode === 1 ? 1 / 3 : e.deltaMode === 2 ? 1 : 1 / 100));
      zoomAt(Math.pow(1.25, closer ? notches : -notches), e.clientX, e.clientY, svgEl.getBoundingClientRect());
    };
    svgEl.addEventListener("wheel", onWheel, { passive: false });
    return () => svgEl.removeEventListener("wheel", onWheel);
    // zoomAt only sets state from what it is given.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgEl]);
  /* The fingers, or the mouse, down on the map: one moves it once it is drawn closer, two pinch it about the point between them. A drag is not a press: the press that ends one is dropped. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  /** Where one finger or the mouse went down, for a swipe to another part. */
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };
  const drawn = useMemo(() => {
    // The part shown; a place whose parts all lie together is shown whole, as asked - nothing of it is left out of the frame.
    const on = { type: "FeatureCollection", features: slides ? groups[onSlide].features : shapes };
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
    return {
      path,
      inner: inner ? path(inner as never) : null,
      // Each outline with its name and its middle, where its name is said when it is pointed at.
      paths: shapes.flatMap((s, i) => {
        const d = path(s as never);
        if (!d) return [];
        const [cx, cy] = path.centroid(s as never);
        const [[bx0, by0], [bx1, by1]] = path.bounds(s as never);
        return [{ key: i, d, cx, cy, w: bx1 - bx0, h: by1 - by0, name: s.properties.n ?? s.properties.name ?? "", shape: s }];
      }),
      dots: dots.flatMap(at),
      mark: mark ? at(mark)[0] : undefined,
    };
  }, [shapes, inner, dots, mark, slides, groups, onSlide]);
  /* The places inside, each with its outline, its middle and where it lies: worked out when the map is first drawn close enough for them. */
  const wantParts = view.k >= PARTS_FROM && Boolean(parts?.length);
  const partPaths = useMemo(() => {
    if (!wantParts || !drawn || !parts) return [];
    return parts.flatMap((s, i) => {
      const d = drawn.path(s as never);
      if (!d) return [];
      const [[x0, y0], [x1, y1]] = drawn.path.bounds(s as never);
      const [cx, cy] = drawn.path.centroid(s as never);
      return [{ i, d, cx, cy, x0, y0, x1, y1, name: [s.properties.n, s.properties.p].filter(Boolean).join(", ") }];
    });
  }, [wantParts, drawn, parts]);
  /* Where each of the places inside has its name set: worked out once for the map, at any zoom, so that their names show from the first view. */
  const partAnchors = useMemo(() => {
    if (!drawn || !parts) return [];
    return parts.flatMap((s, i) => {
      const text = s.properties.n ?? "";
      if (!text) return [];
      const [cx, cy] = drawn.path.centroid(s as never);
      const [[bx0, by0], [bx1, by1]] = drawn.path.bounds(s as never);
      return [{ i, text, cx, cy, w: bx1 - bx0, h: by1 - by0 }];
    });
  }, [drawn, parts]);
  /* The names, as asked: the place marked, then the outlines side by side, the towns, and the places inside - as many as fit in view without meeting, more as the map is drawn closer. */
  const labels = useMemo(() => {
    if (!drawn) return [];
    const cands: LabelCandidate[] = [];
    if (drawn.mark) cands.push({ key: "mark", text: drawn.mark.name, x: drawn.mark.x, y: drawn.mark.y, size: 11, weight: 700, rank: 0, town: true });
    if (drawn.paths.length > 1) for (const p of drawn.paths) if (p.name) cands.push({ key: `s${p.key}`, text: p.name, x: p.cx, y: p.cy, w: p.w, h: p.h, size: 10, rank: 1 });
    // A map of one place carries its name across its middle, as asked, where no place in it is marked.
    else if (!drawn.mark && drawn.paths[0]?.name) {
      const p = drawn.paths[0];
      cands.push({ key: "self", text: p.name, x: p.cx, y: p.cy, w: p.w, h: p.h, size: 12, weight: 700, rank: 0 });
    }
    for (const d of drawn.dots) cands.push({ key: `d${d.id}`, text: d.name, x: d.x, y: d.y, size: 9, rank: 2, town: true });
    for (const p of partAnchors) cands.push({ key: `p${p.i}`, text: p.text, x: p.cx, y: p.cy, w: p.w, h: p.h, size: 8.5, weight: 500, rank: 3 });
    return placeLabels(cands, { x0: view.x - W / (2 * view.k), y0: view.y - H / (2 * view.k), x1: view.x + W / (2 * view.k), y1: view.y + H / (2 * view.k), k: view.k });
  }, [drawn, partAnchors, view]);
  if (!drawn || !drawn.paths.length) return null;
  // Only those in view are drawn: a country has thousands.
  const vx0 = view.x - W / (2 * view.k);
  const vx1 = view.x + W / (2 * view.k);
  const vy0 = view.y - H / (2 * view.k);
  const vy1 = view.y + H / (2 * view.k);
  const partsInView = partPaths.filter((p) => p.x1 >= vx0 && p.x0 <= vx1 && p.y1 >= vy0 && p.y0 <= vy1);
  const litPartPath = litPart !== null ? partsInView.find((p) => p.i === litPart) : undefined;
  const said = over === null ? undefined : drawn.mark && drawn.mark.id === over ? drawn.mark : drawn.dots.find((d) => d.id === over);
  /* Several outlines side by side can each be pointed at; one alone is the whole map, and has nothing to be told from. */
  const many = drawn.paths.length > 1;
  const litPath = many && lit !== null ? drawn.paths.find((p) => p.key === lit) : undefined;
  /** What is said in the pop-up: the dot pointed at, or, where none is, the outline. */
  const tip =
    said ??
    (litPartPath && litPartPath.name && Number.isFinite(litPartPath.cx)
      ? { x: litPartPath.cx, y: litPartPath.cy, name: litPartPath.name, sub: onPart ? "Press it to open its window" : undefined }
      : litPath && litPath.name && Number.isFinite(litPath.cx)
        ? { x: litPath.cx, y: litPath.cy, name: litPath.name, sub: onShape ? "Press it to open its window" : undefined }
        : undefined);
  /* Where the pop-up's place is across what is in view, 0 to 1 each way. */
  const fx = tip ? (tip.x - (view.x - W / (2 * view.k))) / (W / view.k) : 0;
  const fy = tip ? (tip.y - (view.y - H / (2 * view.k))) / (H / view.k) : 0;
  const tool =
    "w-7 h-7 rounded-full border border-border bg-background/70 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default";
  return (
    <div className="relative">
      <svg
        ref={setSvgEl}
        viewBox={`${view.x - W / (2 * view.k)} ${view.y - H / (2 * view.k)} ${W / view.k} ${H / view.k}`}
        className="w-full h-auto modal-tile rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
        // One finger scrolls the window over a map that is whole and moves one that is drawn closer; two are always the map's, to pinch.
        style={{ touchAction: view.k > 1 ? "none" : "pan-y", cursor: view.k > 1 ? "grab" : undefined }}
        role="img"
        tabIndex={0}
        aria-label={`${label}. The wheel or a pinch draws it closer and further, and a drag moves it; with the map in focus, plus and minus do the same, the arrow keys move it and 0 puts it back.${slides ? ` It is in ${groups.length} parts that lie apart, shown one at a time, the main one first: swipe across it, or with it whole press the side arrows, for the others.` : ""}`}
        onKeyDown={(e) => {
          const step = 40 / view.k;
          if (e.key === "+" || e.key === "=") zoomBy(1.5);
          else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.5);
          else if (e.key === "0") resetView();
          // Whole, the side arrows go to the other parts.
          else if (slides && view.k <= 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) goTo(onSlide + (e.key === "ArrowRight" ? 1 : -1));
          else if (e.key === "ArrowLeft") panBy(-step, 0);
          else if (e.key === "ArrowRight") panBy(step, 0);
          else if (e.key === "ArrowUp") panBy(0, -step);
          else if (e.key === "ArrowDown") panBy(0, step);
          else return;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) {
            pinch.current = spread();
            drag.current = { x: e.clientX, y: e.clientY, moved: true };
          } else drag.current = { x: e.clientX, y: e.clientY, moved: false };
          swipe.current = pointers.current.size === 1 ? { x: e.clientX, y: e.clientY } : null;
        }}
        onPointerMove={(e) => {
          if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pinch.current && pointers.current.size === 2) {
            const was = pinch.current;
            const now = spread();
            if (was.dist > 0 && now.dist > 0) zoomAt(now.dist / was.dist, now.cx, now.cy, e.currentTarget.getBoundingClientRect());
            pinch.current = now;
            return;
          }
          const d = drag.current;
          if (!d || view.k <= 1 || e.buttons === 0) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (!d.moved && Math.hypot(dx, dy) < 4) return;
          const r = e.currentTarget.getBoundingClientRect();
          panBy((-dx * (W / view.k)) / r.width, (-dy * (H / view.k)) / r.height);
          drag.current = { x: e.clientX, y: e.clientY, moved: true };
        }}
        onPointerUp={(e) => {
          // Drawn sideways across a whole map: the next part, or the one before; and the press that ends it is not a press.
          const s = swipe.current;
          swipe.current = null;
          if (s && slides && view.k <= 1) {
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 40 && Math.abs(dx) > 1.5 * Math.abs(e.clientY - s.y)) {
              goTo(onSlide + (dx < 0 ? 1 : -1));
              drag.current = { x: e.clientX, y: e.clientY, moved: true };
            }
          }
          pointers.current.delete(e.pointerId);
          pinch.current = null;
          const rest = [...pointers.current.values()][0];
          if (rest) drag.current = { x: rest.x, y: rest.y, moved: true };
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = null;
          drag.current = null;
        }}
        onPointerLeave={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = null;
          drag.current = null;
        }}
        onClickCapture={(e) => {
          if (drag.current?.moved) e.stopPropagation();
          drag.current = null;
        }}
      >
        {drawn.paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill={color}
            fillOpacity={litPath?.key === p.key ? 0.62 : 0.28}
            stroke={color}
            strokeWidth={many ? 0.8 : 1.4}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            className={many && onShape ? "cursor-pointer" : undefined}
            onMouseEnter={many ? () => setLit(p.key) : undefined}
            onMouseLeave={many ? () => setLit((x) => (x === p.key ? null : x)) : undefined}
            onClick={many && onShape ? () => onShape(p.shape) : undefined}
          />
        ))}
        {/* The finer borders, over the fills and under the dots: thinner and fainter than the outlines they lie in. */}
        {drawn.inner && <path d={drawn.inner} fill="none" stroke={color} strokeOpacity={many ? 0.5 : 0.7} strokeWidth={many ? 0.35 : 0.55} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />}
        {/* The outline pointed at, edged over its neighbours so that the whole of its border shows. */}
        {litPath && !litPartPath && <path d={litPath.d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />}
        {/* Drawn closer, the places inside are what is pointed at: unseen until then, each over the outline it lies in. */}
        {partsInView.map((p) => (
          <path
            key={p.i}
            d={p.d}
            fill={color}
            fillOpacity={litPart === p.i ? 0.45 : 0}
            className={onPart ? "cursor-pointer" : undefined}
            onMouseEnter={() => setLitPart(p.i)}
            onMouseLeave={() => setLitPart((x) => (x === p.i ? null : x))}
            onClick={onPart ? () => onPart(p.i) : undefined}
          />
        ))}
        {litPartPath && <path d={litPartPath.d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />}
        {drawn.dots.map((p) => (
          // A clear edge round each dot, so that one so small can still be pointed at.
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={(drawn.mark ? 1.8 : 2.4) / view.k}
            className={`fill-foreground ${onDot ? "cursor-pointer" : ""}`}
            fillOpacity={drawn.mark ? 0.45 : 0.85}
            stroke="transparent"
            strokeWidth={7}
            vectorEffect="non-scaling-stroke"
            onClick={onDot ? () => onDot(p) : undefined}

            onMouseEnter={() => setOver(p.id)}
            onMouseLeave={() => setOver((x) => (x === p.id ? null : x))}
          />
        ))}
        {drawn.mark && (
          <circle
            cx={drawn.mark.x}
            cy={drawn.mark.y}
            r={5.5 / view.k}
            fill={color}
            className="stroke-foreground cursor-pointer"
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => setOver(drawn.mark!.id)}
            onMouseLeave={() => setOver(null)}
          />
        )}
        {/* The names of the places on it, over the lines and under the pointer's ring. */}
        <MapLabels labels={labels} k={view.k} />
        {/* The dot pointed at: a ring in the place's colour. */}
        {said && <circle cx={said.x} cy={said.y} r={7.5 / view.k} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
      </svg>
      {/* Closer and further, at the map's corner: the same as the wheel, a pinch and the + and - keys. */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button type="button" onClick={() => zoomBy(1 / 1.5)} disabled={view.k <= 1} aria-label="Draw the map further out" title="Further out ( - )" className={tool}>
          <MagnifyingGlassMinus size={13} aria-hidden />
        </button>
        <button type="button" onClick={() => zoomBy(1.5)} disabled={view.k >= MAX_K} aria-label="Draw the map closer" title="Closer ( + )" className={tool}>
          <MagnifyingGlassPlus size={13} aria-hidden />
        </button>
        {view.k > 1 && (
          <button type="button" onClick={resetView} className="px-2.5 h-7 rounded-full border border-border bg-background/70 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors" title="Back to the whole map ( 0 )">
            Reset · {view.k.toFixed(1)}×
          </button>
        )}
      </div>
      {/* The parts that lie apart: which is shown, and the arrows to the others - as a swipe across the map does. At the map's left-hand corner, as asked, clear of the places in the middle. */}
      {slides && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 max-w-[calc(100%-1rem)]">
          <button type="button" onClick={() => goTo(onSlide - 1)} aria-label="The part before" title="The part before ( ← )" className={tool}>
            <CaretLeft size={12} weight="bold" aria-hidden />
          </button>
          <span role="status" className="min-w-0 px-2.5 h-7 rounded-full border border-border bg-background/70 flex items-center gap-1.5 text-[10px] font-sans text-foreground">
            <span className="truncate">{groups[onSlide].label}</span>
            <span className="shrink-0 font-mono text-muted-foreground">
              {onSlide + 1}/{groups.length}
            </span>
          </span>
          <button type="button" onClick={() => goTo(onSlide + 1)} aria-label="The next part" title="The next part ( → )" className={tool}>
            <CaretRight size={12} weight="bold" aria-hidden />
          </button>
        </div>
      )}
      {/* Its name, and what it belongs to: above the dot, turned to the side that keeps it on the map. */}
      {tip && fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1 && (
        <div
          role="status"
          className="absolute z-10 pointer-events-none modal-glass border rounded-lg px-2.5 py-1.5 shadow-lg max-w-[16rem]"
          style={{
            left: `${100 * fx}%`,
            top: `${100 * fy}%`,
            transform: `translate(${fx < 0.25 ? "0%" : fx > 0.75 ? "-100%" : "-50%"}, ${fy < 0.3 ? "14px" : "calc(-100% - 12px)"})`,
          }}
        >
          <p className="text-[12px] font-bold font-sans text-foreground leading-tight">{tip.name}</p>
          {tip.sub && <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">{tip.sub}</p>}

        </div>
      )}
    </div>
  );
}
