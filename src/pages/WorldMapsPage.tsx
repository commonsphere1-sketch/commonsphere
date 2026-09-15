import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  geoEqualEarth,
  geoAlbersUsa,
  geoPath,
  geoGraticule10,
  geoBounds,
  geoArea,
} from "d3-geo";
import { feature, mesh, merge } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import statesTopo from "us-atlas/states-10m.json";
import {
  GlobeHemisphereWest,
  MapTrifold,
  Info,
  CaretDown,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
} from "@phosphor-icons/react";
import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";
import {
  countryForFeature,
  stateForFeature,
  auditMapJoin,
} from "../data/mapJoin";
import { useTheme } from "../contexts/ThemeContext";
import { isG20, g20Countries, G20_UNION_MEMBERS, G20_MEMBER_CODES } from "../data/g20";
import { isG7, g7Countries, G7_PARTICIPANTS, G7_MEMBER_CODES } from "../data/g7";
import {
  isBrics,
  bricsCountries,
  BRICS_MEMBER_CODES,
  BRICS_MEMBERSHIP_NOTE,
} from "../data/brics";
import {
  isGlobalNorth,
  isGlobalSouth,
  globalNorthCountries,
  globalSouthCountries,
  GLOBAL_NORTH_CODES,
  GLOBAL_SOUTH_CODES,
} from "../data/developmentStatus";
import {
  AIR_QUALITY,
  AIR_QUALITY_SOURCE,
  pm25Band,
} from "../data/airQuality";
import { StyledSelect } from "../components/StyledSelect";
import { citiesData } from "../data/citiesData";

/**
 * Equal Earth world map and a US state map, both shaded from the site's own
 * datasets.
 *
 * The projection is Equal Earth (Šavrič, Patterson & Jenny, 2018) because a
 * choropleth compared across countries has to preserve area — on Mercator,
 * Greenland reads larger than Africa and every comparison the page invites is
 * distorted before a single colour is applied. The US map uses Albers USA,
 * which is equal-area for the same reason and insets Alaska and Hawaii.
 *
 * Every indicator below is a field that already exists in the datasets. None is
 * computed to fill a gap, and where a country has no value it is drawn in the
 * "no data" tone rather than being given one.
 */

// Viridis, trimmed per theme so the extreme step still separates from the
// card behind it. Ordered low → high in both.
/* Served from static/ (vite publicDir), so the path is absolute — the router
   has no basename and the app already assumes a root deploy. */
const ADMIN1_BASE = "/geo/admin1";
/* Every country's internal borders as one simplified line layer, built by
   build-admin1-borders.cjs from the same per-country files. */
const ADMIN1_BORDERS_URL = "/geo/admin1-borders.json";

/* The physical and infrastructure layers, all built by build-map-layers.cjs.
   None is bundled: each is fetched the first time its toggle is switched on,
   because most visits to this page never turn one on. Sizes gzipped: rivers
   161 KB, lakes 100 KB, mines 157 KB, ports 16 KB. */
const OVERLAY_URL = {
  rivers: "/geo/rivers.json",
  lakes: "/geo/lakes.json",
  ports: "/geo/ports.json",
  mines: "/geo/mines.json",
  infrastructure: "/geo/infrastructure.json",
} as const;

/* Air pollution is the one layer that is not fetched: it is 197 numbers, a
   few kilobytes, so it rides in the bundle rather than costing a request. */
type OverlayId = keyof typeof OVERLAY_URL | "pollution";

/** A point layer as build-map-layers.cjs writes it: a header plus index rows.
    Generic over the row shape so destructuring a row keeps its tuple types. */
type PointLayer<Row> = {
  fields: string[];
  rows: Row[];
};

/** ports.json — [name, lon, lat, scalerank]. */
type PortRow = [string, number, number, number];

/** mines.json — [name, commodityIdx, countryIdx, kindIdx, record, lon, lat].
    record is 0 for a working facility and 1 for a known deposit; the two come
    from different USGS datasets and are never added together. */
type MineRow = [string, number, number, number, number, number, number];
type MineLayer = PointLayer<MineRow> & {
  commodities: string[];
  countries: string[];
  kinds: string[];
};

/** infrastructure.json — two TopoJSON objects, `rd` and `rl`, each a single
    merged MultiLineString, plus airports as [name, lon, lat, major] rows. */
type InfrastructureLayer = Topology & {
  airports: [string, number, number, number][];
};

type Subdivision = {
  n: string;
  d: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
};


/**
 * Indices of the divisions worth framing the map on.
 *
 * Fitting the map to everything a country administers makes nonsense of the
 * common case: France's overseas départements stretch the extent from Guyane
 * to Réunion, and metropolitan France came out about 17px wide with its
 * départements at 6px. Measured, not guessed — that is what the page drew
 * before this existed, and the world atlas outline spans the same degrees, so
 * this was never a question of which boundary file to use.
 *
 * Divisions whose bounding boxes sit within SLACK degrees of one another are
 * grouped, transitively, so a strait or a river mouth does not split a country
 * and an archipelago stays whole.
 *
 * The largest group by division count is kept, and any other group is kept
 * too when it carries a real share of both the divisions and the land. Both
 * tests are needed, and each was chosen against a case that fails the other:
 *
 *  - Land alone framed Malaysia on Borneo and dropped 13 of its 16 states,
 *    because Sabah and Sarawak outweigh the peninsula in area.
 *  - Count alone dragged the Netherlands out to the Caribbean for Bonaire,
 *    St. Eustatius and Saba — 3 of 15 divisions, and about a thousandth of
 *    the land.
 *
 * Run across all 241 countries, 22 drop anything at all, and every one of
 * those drops is a distant offshore territory: Svalbard, the Azores, the
 * Canaries, the Galápagos, the Chatham Islands, Lord Howe.
 *
 * Nothing is discarded. Whatever is left out is named under the map.
 */
const CLUSTER_SLACK_DEG = 2;

/* Inset maps for the outlying groups. Each is square and drawn at its own
   scale, so a territory is legible next to a mainland thousands of times its
   size. Eight is well past what any country needs — the most any one has is
   six — and the remainder is still named. */
const INSET_SIZE = 100;
const INSET_PAD = 8;
const MAX_INSETS = 8;

/** One outlying group, drawn beside the map at its own scale. */
type Inset = {
  key: string;
  name: string;
  d: string;
  interior: string;
};
const CLUSTER_MIN_COUNT = 0.15;
const CLUSTER_MIN_AREA = 0.05;

type DivisionClusters = {
  /** Indices the map is framed on. */
  keep: number[];
  /** Everything else, grouped and ordered by land, largest first. */
  outliers: number[][];
};

function clusterDivisions(
  features: { properties: { n: string } }[],
): DivisionClusters {
  const all = features.map((_, i) => i);
  if (features.length < 2) return { keep: all, outliers: [] };

  const boxes = features.map((f) => geoBounds(f as never));
  const areas = features.map((f) => geoArea(f as never));

  const parent = features.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const M = CLUSTER_SLACK_DEG;
  for (let i = 0; i < features.length; i++) {
    const [[ax0, ay0], [ax1, ay1]] = boxes[i];
    if (!Number.isFinite(ax0)) continue;
    for (let j = i + 1; j < features.length; j++) {
      const [[bx0, by0], [bx1, by1]] = boxes[j];
      if (!Number.isFinite(bx0)) continue;
      if (ax0 - M <= bx1 && bx0 - M <= ax1 && ay0 - M <= by1 && by0 - M <= ay1) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, { count: number; land: number; idx: number[] }>();
  for (let i = 0; i < features.length; i++) {
    const r = find(i);
    const g = groups.get(r) ?? { count: 0, land: 0, idx: [] };
    g.count += 1;
    g.land += areas[i];
    g.idx.push(i);
    groups.set(r, g);
  }

  const totalLand = areas.reduce((sum, a) => sum + a, 0) || 1;
  const ranked = [...groups.values()].sort(
    (a, b) => b.count - a.count || b.land - a.land,
  );

  const keep = [...ranked[0].idx];
  const outliers: { land: number; idx: number[] }[] = [];

  for (const g of ranked.slice(1)) {
    if (
      g.count / features.length >= CLUSTER_MIN_COUNT &&
      g.land / totalLand >= CLUSTER_MIN_AREA
    ) {
      keep.push(...g.idx);
    } else {
      outliers.push({ land: g.land, idx: g.idx });
    }
  }

  outliers.sort((a, b) => b.land - a.land);

  return {
    keep: keep.sort((a, b) => a - b),
    outliers: outliers.map((g) => g.idx),
  };
}

/* Drawing canvases, in viewBox units. The US and country-focus maps share one
   so switching between them never resizes the card; the world map is wider
   because Equal Earth's whole sphere is roughly 2:1. */
const US_W = 960;
const US_H = 560;
const WORLD_W = 960;
const WORLD_H = 480;
const PAD = 24;

/**
 * Vertical space a map card needs for everything that is not the map: its
 * heading, the scope chips, the legend and the source note, plus the card's own
 * padding. Measured at 205-238px across viewports from 1366 to 2560 wide, the
 * spread coming from the legend and note wrapping onto more rows when narrow.
 * Rounded up so the card still fits when they wrap furthest.
 */
const MAP_CHROME_PX = 330;

/**
 * The narrowest a map may be drawn, in CSS pixels.
 *
 * Labels are sized in canvas units - 13 for the world map, 12 for a state, 11
 * for an off-map territory - so how legible they are is decided entirely by how
 * far the 960-unit canvas is scaled down. This is 95% of that canvas, which
 * holds a state label at about 11px.
 *
 * It exists because fitting the card to the screen and keeping the map readable
 * conflict on a short screen: at 1280x720 a pure fit rendered every state label
 * between 7.7 and 8.4px. Below roughly 850px of viewport height the map stops
 * shrinking and the page scrolls instead, which is the better of the two.
 */
const MAP_MIN_WIDTH_PX = 912;

/* Zoom bounds. 1 fits the country to the canvas; 8 is where the 1:10m arcs
   start to show their own quantisation, so there is nothing further to see. */
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.6;

/* Below this zoom the whole world is in view, where a country's name is often
   wider than the country; above it the reader is looking at one country, so
   the title names that instead of its continent. */
const CONTINENT_TITLE_BELOW = 2;

/* Natural Earth ranks a river 1 (the Amazon, the Nile) to 10 (a minor
   tributary). At world view only the trunk rivers are drawn - all 1,454 at
   once turn the continents into a grey haze - and the rest appear once the
   reader has zoomed past RIVER_DETAIL_ABOVE, where there is room for them. */
const RIVER_TRUNK_RANK = 4;
const RIVER_DETAIL_ABOVE = 2;

/* Ports are thinned at world view: 1,081 dots of a fixed screen size merge
   into a smudge that says nothing, so below this zoom only the most prominent
   are drawn. Natural Earth ranks a port 1 (Rotterdam, Shanghai) to 10.
   Mineral sites are deliberately not thinned - where they cluster is the whole
   point of the layer - which they can afford because the layer is drawn as two
   paths rather than 9,639 elements. */
const PORT_DETAIL_ABOVE = 2;
const PORT_MAJOR_RANK = 5;

/* Airports thin the same way: 387 of the 893 are classed major, and those are
   the ones worth drawing while the whole world is in view. */
const AIRPORT_DETAIL_ABOVE = 2;

/* How strongly each PM2.5 band is washed over the choropleth. Index 0 is the
   band that meets the WHO guideline and is never drawn, so its entry is 0. The
   rest climb far enough apart to be told apart at a glance, and stop well short
   of hiding the grey underneath. */
const POLLUTION_OPACITY = [0, 0.18, 0.3, 0.44, 0.6];

/* Mineral sites are the one layer dense enough to bury the map underneath it:
   9,639 dots at full size turn Europe, China, Australia and the eastern United
   States into solid colour, and the choropleth the page is actually about
   stops being readable. Rather than hide the layer at world view - a toggle
   that visibly does nothing is worse - the dots are drawn small and part
   transparent until the reader zooms in, where there is room for them at full
   size. Where mining concentrates still reads; what is under it survives. */
const MINE_FULL_DETAIL_ABOVE = 2;
const MINE_DOT = { far: 0.55, near: 1.5 };
const MINE_OPACITY = { far: 0.5, near: 0.85 };

/**
 * The overlay layers offered under the world map, in the order they are drawn:
 * water first, then what people built on it and dug out of the ground.
 *
 * `about` is the button's tooltip and says where the layer comes from and what
 * it leaves out, so a reader meets the caveat at the switch rather than after
 * drawing a conclusion from it.
 */
const OVERLAYS: { id: OverlayId; label: string; about: string }[] = [
  {
    id: "rivers",
    label: "Rivers",
    about:
      "Rivers and lake centrelines, Natural Earth 1:10m, public domain. Major rivers at world view; the rest once zoomed in.",
  },
  {
    id: "lakes",
    label: "Lakes",
    about:
      "Lakes and reservoirs, Natural Earth 1:10m, public domain. 1,310 of them; the smallest are omitted at this scale.",
  },
  {
    id: "ports",
    label: "Ports",
    about:
      "1,081 ports, Natural Earth 1:10m, public domain. Ranked by prominence, not by tonnage — this is not a throughput ranking.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    about:
      "Trunk roads, principal railways and 893 airports, Natural Earth 1:10m, public domain. The trunk network, not every road — and coverage is uneven, so it is not a measure of how much road or rail a country has.",
  },
  {
    id: "pollution",
    label: "Air pollution",
    about:
      "Countries whose population-weighted mean PM2.5 exceeds the WHO guideline, World Bank 2023. Shaded by how far above it they sit. One national figure per country, weighted by where people live - it says where people breathe polluted air, not where within a country the pollution is.",
  },
  {
    id: "mines",
    label: "Mineral sites",
    about:
      "16,424 sites from three USGS surveys: working operations outside the United States (2003-2008), active mines and plants inside it (2003), and known deposits worldwide (2005). Historical surveys, not a current census - USGS publishes no later point data at this coverage.",
  },
];

/**
 * The selected country's flag, for the corner of the focus card.
 *
 * From flagcdn, which the Countries page already uses - not a regional
 * indicator emoji, because Windows has no glyphs for those pairs and renders
 * them as the two letters instead, so the emoji route reads as "CN" rather
 * than a flag on a large share of visitors' machines.
 *
 * Falls back to the map icon if the image does not arrive: a country flagcdn
 * has no picture for, or a viewer who is offline, gets the header the card had
 * before rather than a broken-image box. Give it a `key` of the country code so
 * a new country starts with a fresh attempt rather than inheriting the last
 * one's failure.
 */
function CountryFlag({ code, name }: { code?: string; name?: string }) {
  const [failed, setFailed] = useState(false);
  const cc = (code ?? "").toLowerCase();
  if (!cc || failed) {
    return <MapTrifold size={28} weight="fill" className="text-secondary shrink-0" />;
  }
  return (
    <img
      src={`https://flagcdn.com/w80/${cc}.png`}
      srcSet={`https://flagcdn.com/w160/${cc}.png 2x`}
      width={42}
      height={28}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      /* The country's name sits beside it in the heading, so the flag is
         decorative and announcing it again would only repeat the name. */
      alt=""
      aria-hidden
      title={name}
      className="h-7 w-auto rounded-[2px] shrink-0"
      style={{ border: "1px solid rgba(128,128,128,0.35)" }}
    />
  );
}

/**
 * A line drawn over a casing, so it reads whatever lies underneath it.
 *
 * The overlay colours were picked to separate from each other and from the
 * grey ramp, but the fill under a line is whatever the choropleth put there.
 * Measured against the mid-grey a country map uses, the river blue came out at
 * 1.05:1 and the infrastructure violet at 1.15:1 - all but invisible inside
 * the country, while perfectly clear on the dark background outside it.
 *
 * No choice of colour fixes that, because the fill underneath changes with the
 * data. A casing does: the same halo the labels use, drawn slightly wider
 * beneath the line, so every line carries its own contrasting edge.
 */
function CasedLine({
  d,
  ink,
  halo,
  width,
  zoom,
  dash,
  opacity = 0.9,
}: {
  d: string | undefined;
  ink: string;
  halo: string;
  width: number;
  zoom: number;
  dash?: string;
  opacity?: number;
}) {
  if (!d) return null;
  const shared = {
    d,
    fill: "none",
    strokeLinecap: dash ? ("butt" as const) : ("round" as const),
    strokeLinejoin: "round" as const,
    strokeDasharray: dash,
  };
  return (
    <g pointerEvents="none">
      <path {...shared} stroke={halo} strokeOpacity={0.55} strokeWidth={(width + 1.2) / zoom} />
      <path {...shared} stroke={ink} strokeOpacity={opacity} strokeWidth={width / zoom} />
    </g>
  );
}

/**
 * Zoom and pan for one map canvas.
 *
 * Zoom is applied to the viewBox rather than to a transform, so no geometry
 * memo has to know about it. Callers divide strokes and text by the zoom so
 * they hold their size on screen while the map grows underneath. The viewport
 * is clamped to the canvas, so a map can never be dragged away with no way
 * back but the reset button. Passing resetKey returns to 1x whenever it changes.
 */
function useMapZoom(width: number, height: number, resetKey?: unknown) {
  /* Zoom and centre are one piece of state, not two.

     They were separate, and every handler read the current zoom from its own
     closure. A wheel notch is a factor applied to that zoom, so when a
     trackpad delivered ten events in a frame - which is what a flick is - all
     ten read the same starting zoom and computed the same result. Measured:
     one of ten events survived, and the gesture felt dead.

     With a single state and functional updates, each event sees what the one
     before it did, so a flick accumulates. */
  const [view, setView] = useState({ zoom: 1, x: width / 2, y: height / 2 });
  const { zoom } = view;
  const center = view;
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(
    null,
  );

  const reset = useCallback(() => {
    setView({ zoom: 1, x: width / 2, y: height / 2 });
  }, [width, height]);

  // A new subject is a new map; the old viewport would land somewhere arbitrary.
  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  const clamp = useCallback(
    (x: number, y: number, k: number) => {
      const halfW = width / (2 * k);
      const halfH = height / (2 * k);
      return {
        x: Math.min(width - halfW, Math.max(halfW, x)),
        y: Math.min(height - halfH, Math.max(halfH, y)),
      };
    },
    [width, height],
  );

  /** The zoom buttons, which name an absolute level. */
  const zoomTo = useCallback(
    (k: number) => {
      setView((v) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k));
        return { zoom: next, ...clamp(v.x, v.y, next) };
      });
    },
    [clamp],
  );

  /* Where the drawing sits inside its box, and how big it is on screen.
     The box can be wider than the drawing, so this is the one place that
     converts between client pixels and canvas units; the pan handler and the
     wheel handler both use it rather than each doing the arithmetic. */
  const frame = useCallback(
    (rect: DOMRect, k: number) => {
      if (rect.width === 0 || rect.height === 0) return null;
      const scale = Math.min(rect.width / (width / k), rect.height / (height / k));
      if (!Number.isFinite(scale) || scale <= 0) return null;
      const drawnW = (width / k) * scale;
      const drawnH = (height / k) * scale;
      return {
        scale,
        drawnW,
        drawnH,
        left: rect.left + (rect.width - drawnW) / 2,
        top: rect.top + (rect.height - drawnH) / 2,
      };
    },
    [width, height],
  );

  /**
   * Multiplies the zoom while holding one point of the map still - the point
   * under the cursor for a wheel, the middle for a keystroke.
   *
   * Takes a factor rather than a level so that consecutive events compose: two
   * notches in one frame are two multiplications, not two writes of the same
   * number. `fx`/`fy` are where the held point sits across the drawing, 0 to
   * 1, and are independent of the zoom - the drawing is fitted to the box the
   * same way whatever the zoom, so the fraction does not move.
   *
   * The canvas coordinate under that point is the same before and after, which
   * gives the new centre directly: at a fraction fx across a viewport w wide,
   * the centre lies fx - 0.5 viewports from that coordinate.
   */
  const zoomBy = useCallback(
    (factor: number, fx: number, fy: number) => {
      setView((v) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.zoom * factor));
        if (next === v.zoom) return v;
        const atX = v.x - width / (2 * v.zoom) + fx * (width / v.zoom);
        const atY = v.y - height / (2 * v.zoom) + fy * (height / v.zoom);
        return {
          zoom: next,
          ...clamp(
            atX + (width / next) * (0.5 - fx),
            atY + (height / next) * (0.5 - fy),
            next,
          ),
        };
      });
    },
    [clamp, width, height],
  );

  const endPan = () => {
    drag.current = null;
  };

  /* Wheel and trackpad. The gesture zooms rather than scrolling the page,
     which is what a map is expected to do, so the event is consumed - hence a
     non-passive listener attached by hand below, since React's onWheel is
     passive and cannot preventDefault.

     deltaY is normalised by mode: a line-wise wheel reports ~3 lines a notch, a
     pixel-wise trackpad tens of pixels, and a page-wise wheel one page. Without
     this a trackpad flings from world view to full zoom in one flick. */
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const el = e.currentTarget as SVGSVGElement;
      /* Any zoom gives the same fx/fy, so this one does not have to be the
         live one - which is what keeps the handler free of stale state. */
      const f = frame(el.getBoundingClientRect(), 1);
      if (!f) return;
      const perNotch = e.deltaMode === 1 ? 1 / 3 : e.deltaMode === 2 ? 1 : 1 / 100;
      const notches = -e.deltaY * perNotch;
      zoomBy(
        Math.pow(ZOOM_STEP, notches),
        Math.min(1, Math.max(0, (e.clientX - f.left) / f.drawnW)),
        Math.min(1, Math.max(0, (e.clientY - f.top) / f.drawnH)),
      );
    },
    [frame, zoomBy],
  );

  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  /* Keyboard, for anyone not using a mouse. +/- zoom about the middle, the
     arrows pan by a fifth of the viewport, 0 resets. The map is focusable, so
     these only fire once the reader has tabbed to it - they cannot steal the
     arrow keys from the page. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      const step = 0.2;
      const pan = (dx: number, dy: number) =>
        setView((v) => ({
          zoom: v.zoom,
          ...clamp(v.x + (dx * width) / v.zoom, v.y + (dy * height) / v.zoom, v.zoom),
        }));
      switch (e.key) {
        case "+":
        case "=":
          zoomBy(ZOOM_STEP, 0.5, 0.5);
          break;
        case "-":
        case "_":
          zoomBy(1 / ZOOM_STEP, 0.5, 0.5);
          break;
        case "0":
          reset();
          break;
        case "ArrowLeft":
          pan(-step, 0);
          break;
        case "ArrowRight":
          pan(step, 0);
          break;
        case "ArrowUp":
          pan(0, -step);
          break;
        case "ArrowDown":
          pan(0, step);
          break;
        default:
          return; // every other key belongs to the page
      }
      e.preventDefault();
    },
    [clamp, reset, width, height, zoomBy],
  );

  const panProps = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      if (zoom === 1) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { px: e.clientX, py: e.clientY, cx: center.x, cy: center.y };
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current;
      if (!d) return;
      /* Canvas units travelled per device pixel, from the same frame helper
         the wheel uses: whenever the box's aspect differs from the viewBox's,
         the drawing is letterboxed inside it and only one axis binds. Reading
         the box width alone would make a drag lag the pointer. */
      const rect = e.currentTarget.getBoundingClientRect();
      const dx = e.clientX - d.px;
      const dy = e.clientY - d.py;
      setView((v) => {
        const f = frame(rect, v.zoom);
        if (!f) return v;
        const perPx = 1 / f.scale;
        return { zoom: v.zoom, ...clamp(d.cx - dx * perPx, d.cy - dy * perPx, v.zoom) };
      });
    },
    onPointerUp: endPan,
    onPointerCancel: endPan,
  };

  const style: React.CSSProperties = {
    cursor: zoom > 1 ? "grab" : "default",
    outlineOffset: "2px",
    touchAction: zoom > 1 ? "none" : "auto",
    /* Keep the whole card - map, legend and note - on one screen, so a map is
       never taller than the space it has. Width is what is capped, not height:
       with h-auto the height follows the width, so the box stays equal to the
       drawing. Capping height instead would letterbox the box, leaving dead
       space beside the map and breaking the pan conversion above, which needs
       the box to match what is drawn.

       The chrome subtracted is roughly fixed rather than proportional, which is
       why this is not a flat percentage of the viewport: a 70% cap overflowed a
       1366x768 screen by ~70px while leaving height unused at 2560x1440. */
    maxWidth: `calc(max(${MAP_MIN_WIDTH_PX}px, (100vh - ${MAP_CHROME_PX}px) * ${(
      width / height
    ).toFixed(4)}))`,
  };

  const viewBox = `${center.x - width / (2 * zoom)} ${
    center.y - height / (2 * zoom)
  } ${width / zoom} ${height / zoom}`;

  /* Focusable so the keyboard handler can receive keys at all, and labelled
     with what those keys do. */
  const a11yProps = {
    ref: svgRef,
    tabIndex: 0,
    onKeyDown,
  };

  return { zoom, zoomTo, reset, viewBox, panProps, style, a11yProps };
}

/**
 * Fetches one overlay the first time it is switched on, then keeps it.
 *
 * The layers total 1.4 MB, so bundling them would make every visit pay for
 * data most visits never ask for. Switching a layer off keeps what was already
 * fetched, so toggling it back on is instant and costs no second request.
 *
 * A failed fetch is reported to the caller rather than thrown: the map is still
 * readable without an overlay, so the rest of the page must not come down with
 * it.
 */
function useOverlay<T>(url: string, enabled: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || data || failed) return;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: T) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, enabled, data, failed]);

  return { data, loading: enabled && !data && !failed, failed };
}

/**
 * Zoom buttons for one map. They sit outside the drawing so they stay
 * reachable by keyboard and never cover the map. Each carries the map's name,
 * because the page has more than one set and "Zoom in" alone would not say
 * which map it moves.
 */
function ZoomControls({
  zoom,
  onZoom,
  onReset,
  label,
  children,
}: {
  zoom: number;
  onZoom: (k: number) => void;
  onReset: () => void;
  label: string;
  children?: React.ReactNode;
}) {
  const button =
    "h-7 rounded-lg border border-border text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        type="button"
        onClick={() => onZoom(zoom / ZOOM_STEP)}
        disabled={zoom <= ZOOM_MIN}
        aria-label={`Zoom out of the ${label}`}
        className={`w-7 ${button}`}
      >
        <MagnifyingGlassMinus size={14} className="mx-auto" />
      </button>
      <button
        type="button"
        onClick={() => onZoom(zoom * ZOOM_STEP)}
        disabled={zoom >= ZOOM_MAX}
        aria-label={`Zoom in on the ${label}`}
        className={`w-7 ${button}`}
      >
        <MagnifyingGlassPlus size={14} className="mx-auto" />
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={zoom === 1}
        aria-label={`Reset the ${label} zoom`}
        className={`px-2 text-[10px] font-mono uppercase tracking-widest ${button}`}
      >
        Reset
      </button>
      <span className="text-[10px] font-mono text-muted-foreground" aria-live="polite">
        {zoom.toFixed(1)}×{children}
      </span>
    </div>
  );
}

/* Greys: low values black, high values light grey, lowest bucket first.
   Steps are spaced so every adjacent pair has the same contrast ratio (1.6:1
   light, 1.5:1 dark); even spacing in perceived lightness left the two
   darkest buckets at 1.1:1, which reads as one colour. The end of each ramp
   nearest the card colour is held at 2:1 against it so no country dissolves
   into the background. That rules out pure black in dark mode, where it sits
   at 1.1:1 on the card; the dark ramp starts at the darkest grey that still
   clears 2:1. Checked with the dataviz ordinal checks against the surfaces
   as painted: #ffffff and #0f0f13. */
const RAMP_LIGHT = ["#000000", "#303030", "#4f4f4f", "#6e6e6e", "#909090", "#b7b7b7"];
const RAMP_DARK = ["#464646", "#5f5f5f", "#7a7a7a", "#989898", "#b9b9b9", "#e0e0e0"];

/** The "no figure" fill: a 45 degree hatch that keeps its spacing on screen at any zoom. */
function NoDataHatch({
  id,
  base,
  line,
  zoom,
}: {
  id: string;
  base: string;
  line: string;
  zoom: number;
}) {
  const size = 4 / zoom;
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width={size}
      height={size}
      patternTransform="rotate(45)"
    >
      <rect width={size} height={size} fill={base} />
      <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke={line} strokeWidth={1.5 / zoom} />
    </pattern>
  );
}

type ScopeId = "all" | "g20" | "g7" | "brics" | "north" | "south";

/**
 * The groups the world map can narrow to.
 *
 * Each carries its own members, the test for belonging, the codes the
 * internal-border layer is clipped to, and what to call everything outside it,
 * so adding a group does not mean threading another condition through the page.
 *
 * "Global North" and "Global South" are not official categories and no body
 * publishes a membership list, so they are the UN M49 developed / developing
 * classification. The panel says so, in UNSD's own terms, wherever they appear.
 */
type Scope = {
  id: ScopeId;
  chip: string;
  /** Heading for the panel. */
  title: string;
  /** Plural noun for "N of M ___ have this figure". */
  noun: string;
  /** What one row of the panel's table is. */
  rowLabel: "Member" | "Country";
  members: Country[];
  /** null for every country: nothing is out of scope. */
  belongs: ((c: Country) => boolean) | null;
  codes: readonly string[] | null;
  outsideLabel: string | null;
};

const SCOPES: Scope[] = [
  {
    id: "all",
    chip: "All countries",
    title: "All countries",
    noun: "countries",
    rowLabel: "Country",
    members: countriesData,
    belongs: null,
    codes: null,
    outsideLabel: null,
  },
  {
    id: "g20",
    chip: "G20",
    title: "Group of Twenty",
    noun: "G20 states",
    rowLabel: "Member",
    members: g20Countries,
    belongs: isG20,
    codes: G20_MEMBER_CODES,
    outsideLabel: "Not a G20 member",
  },
  {
    id: "g7",
    chip: "G7",
    title: "Group of Seven",
    noun: "G7 states",
    rowLabel: "Member",
    members: g7Countries,
    belongs: isG7,
    codes: G7_MEMBER_CODES,
    outsideLabel: "Not a G7 member",
  },
  {
    id: "brics",
    chip: "BRICS",
    title: "BRICS",
    noun: "BRICS states",
    rowLabel: "Member",
    members: bricsCountries,
    belongs: isBrics,
    codes: BRICS_MEMBER_CODES,
    outsideLabel: "Not a BRICS member",
  },
  {
    id: "north",
    chip: "Global North",
    title: "Global North",
    noun: "countries",
    rowLabel: "Country",
    members: globalNorthCountries,
    belongs: isGlobalNorth,
    codes: GLOBAL_NORTH_CODES,
    outsideLabel: "Not classified developed",
  },
  {
    id: "south",
    chip: "Global South",
    title: "Global South",
    noun: "countries",
    rowLabel: "Country",
    members: globalSouthCountries,
    belongs: isGlobalSouth,
    codes: GLOBAL_SOUTH_CODES,
    outsideLabel: "Not classified developing",
  },
];

type CountryIndicator = {
  id: string;
  label: string;
  group: string;
  unit: string;
  /** Higher is better. Orders the ranking list; colour follows the value itself. */
  higherIsBetter: boolean;
  get: (c: Country) => number | null;
  format: (v: number) => string;
};

const COUNTRY_INDICATORS: CountryIndicator[] = [
  {
    id: "hdi",
    label: "Human Development",
    group: "Development",
    unit: "HDI",
    higherIsBetter: true,
    get: (c) => c.humanDevelopmentIndex ?? null,
    format: (v) => v.toFixed(3),
  },
  {
    id: "life",
    label: "Life Expectancy",
    group: "Health",
    unit: "years",
    higherIsBetter: true,
    get: (c) => c.lifeExpectancy ?? null,
    format: (v) => `${v.toFixed(1)} yrs`,
  },
  {
    id: "gdppc",
    label: "GDP per Capita",
    group: "Economy",
    unit: "USD",
    higherIsBetter: true,
    get: (c) => c.gdpPerCapita ?? null,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  {
    id: "growth",
    label: "GDP Growth",
    group: "Economy",
    unit: "%",
    higherIsBetter: true,
    get: (c) => c.gdpGrowth ?? null,
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
  },
  {
    id: "unemployment",
    label: "Unemployment",
    group: "Economy",
    unit: "%",
    higherIsBetter: false,
    get: (c) => c.unemploymentRate ?? null,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    id: "population",
    label: "Population",
    group: "Society",
    unit: "people",
    higherIsBetter: true,
    get: (c) => c.population ?? null,
    format: (v) =>
      v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString(),
  },
];

type StateIndicator = {
  id: string;
  label: string;
  group: string;
  higherIsBetter: boolean;
  /** Ranks run 1 = best, so the legend names its ends Best rank and Worst rank. */
  isRank?: boolean;
  get: (s: USState) => number | null;
  format: (v: number) => string;
};

const STATE_INDICATORS: StateIndicator[] = [
  {
    id: "education",
    label: "Education Rank",
    group: "Education",
    higherIsBetter: false,
    isRank: true,
    get: (s) => s.educationRank ?? null,
    format: (v) => `#${v}`,
  },
  {
    id: "healthcare",
    label: "Healthcare Rank",
    group: "Health",
    higherIsBetter: false,
    isRank: true,
    get: (s) => s.healthcareRank ?? null,
    format: (v) => `#${v}`,
  },
  {
    id: "income",
    label: "Median Income",
    group: "Economy",
    higherIsBetter: true,
    get: (s) => s.medianIncome ?? null,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  {
    id: "unemployment",
    label: "Unemployment",
    group: "Economy",
    higherIsBetter: false,
    get: (s) => s.unemploymentRate ?? null,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    id: "population",
    label: "Population",
    group: "Society",
    higherIsBetter: true,
    get: (s) => s.population ?? null,
    format: (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString()),
  },
];

/** Quantile thresholds, so a handful of outliers cannot flatten the map. */
function quantileBreaks(values: number[], buckets: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const breaks: number[] = [];
  for (let i = 1; i < buckets; i++) {
    breaks.push(sorted[Math.floor((sorted.length * i) / buckets)]);
  }
  return breaks;
}

export function WorldMapsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [countryMetric, setCountryMetric] = useState("hdi");
  const [stateMetric, setStateMetric] = useState("education");
  const [hovered, setHovered] = useState<{
    name: string;
    value: string;
    /** Centre of the hovered shape, for the title the world map draws. */
    cx?: number;
    cy?: number;
    continent?: string;
  } | null>(null);
  const [scope, setScope] = useState<ScopeId>("all");
  // The second map focuses on one country. The US is the default because it is
  // the only one with subdivision figures behind it.
  const [focusCode, setFocusCode] = useState("US");
  const [factsOpen, setFactsOpen] = useState(true);

  const ramp = isLight ? RAMP_LIGHT : RAMP_DARK;
  /* "No figure" is a hatch, not a tone: on a grey ramp any flat grey would
     read as a value. "Not selected" is the plain near-surface fill, lighter
     than every light-mode step and darker than every dark-mode step, so a
     value, no figure and not selected cannot be taken for one another.
     noData is the hatch's base, used wherever a flat colour is needed. */
  const noData = isLight ? "#f4f5f7" : "#191920";
  const noDataHatch = isLight ? "#a3a3a3" : "#5c5c5c";
  const outOfScope = noData;
  /* Map labels: white in dark mode, black in light mode. A fixed ink on a grey
     ramp would fail contrast somewhere — white on the dark-mode mid grey is
     2.9:1 — so each label carries a halo in the opposite colour, which is what
     keeps it legible on every fill. */
  const labelInk = isLight ? "#000000" : "#ffffff";
  const labelHalo = isLight ? "#ffffff" : "#000000";
  const stroke = isLight ? "#ffffff" : "#15151d";
  /* The choropleth is deliberately greyscale, which leaves hue free to mean
     "this is not the shaded figure": water blue, port amber, mineral rust.

     Colour alone is not enough to tell the layers apart, and cannot be made
     enough here. The grey ramp spans the whole luminance range, so whatever
     luminance an overlay takes, it matches some step of the ramp it is drawn
     over - the first pairing tried put rivers and ports at 1.00:1 luminance,
     identical in greyscale. The layers are therefore separated by shape, which
     no colour vision affects: rivers are lines, lakes are filled areas, ports
     are squares and mineral sites circles. These values are simply the best
     luminance separation available on top of that - 1.67:1 between the closest
     pair in light, 1.55:1 in dark, against 1.00:1 and 1.10:1 before. */
  const overlayInk: Record<OverlayId, string> = {
    rivers: isLight ? "#14608f" : "#4a9ad8",
    lakes: isLight ? "#14608f" : "#4a9ad8",
    ports: isLight ? "#e0a030" : "#ffd27a",
    mines: isLight ? "#6e1e0a" : "#c0512c",
    infrastructure: isLight ? "#9c4fc0" : "#c88ce6",
    pollution: isLight ? "#b3006b" : "#ff6fb5",
  };
  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight
    ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)"
    : "var(--card-glow)";

  /* ── Geometry ── */
  const world = useMemo(() => {
    const topo = worldTopo as unknown as Topology;
    return feature(topo, topo.objects.countries as never) as unknown as {
      features: { properties: { name: string }; type: string }[];
    };
  }, []);

  const states = useMemo(() => {
    const topo = statesTopo as unknown as Topology;
    return feature(topo, topo.objects.states as never) as unknown as {
      features: { properties: { name: string }; type: string }[];
    };
  }, []);

  // A join that silently misses looks exactly like a country with no data, so
  // it is checked out loud in development rather than left to look deliberate.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const { matched, unexpectedMisses } = auditMapJoin(
      world.features.map((f) => f.properties.name),
    );
    if (unexpectedMisses.length) {
      console.warn(
        `[maps] ${unexpectedMisses.length} country features did not match the dataset:`,
        unexpectedMisses,
      );
    } else {
      console.info(`[maps] join clean — ${matched} country features matched`);
    }
  }, [world]);

  /* ── World projection: Equal Earth, fitted to the viewbox ── */
  const worldPath = useMemo(() => {
    const projection = geoEqualEarth().fitExtent(
      [
        [8, 8],
        [WORLD_W - 8, WORLD_H - 8],
      ],
      { type: "Sphere" } as never,
    );
    return { path: geoPath(projection), projection };
  }, []);

  const statePath = useMemo(() => {
    const projection = geoAlbersUsa().fitExtent(
      [
        [10, 10],
        [US_W - 10, US_H - 10],
      ],
      states as never,
    );
    return geoPath(projection);
  }, [states]);

  const usOutlineD = useMemo(() => {
    const topo = statesTopo as unknown as Topology;
    const obj = topo.objects.states as unknown as {
      geometries: Parameters<typeof merge>[1];
    };
    return statePath(merge(topo, obj.geometries) as never) ?? undefined;
  }, [statePath]);

  /* ── Country shading ── */
  const activeCountry = COUNTRY_INDICATORS.find((i) => i.id === countryMetric)!;
  const activeScope = SCOPES.find((s) => s.id === scope)!;
  const inScope = activeScope.members;
  /* M49 classifies neither Kosovo nor Taiwan, so they belong to no scope and
     are drawn out of scope rather than assigned to one. */
  const unclassifiedCount =
    countriesData.length - globalNorthCountries.length - globalSouthCountries.length;
  const countryShading = useMemo(() => {
    const values = inScope
      .map((c) => activeCountry.get(c))
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const breaks = quantileBreaks(values, ramp.length);
    return { breaks, min: Math.min(...values), max: Math.max(...values), count: values.length };
  }, [activeCountry, ramp.length, inScope]);

  /* ── G20 figures ──
     Shares are of the world totals in this dataset, not of a published world
     figure, so the numerator and denominator come from the same place. */
  const groupStats = useMemo(() => {
    const sum = (list: Country[], f: (c: Country) => number) =>
      list.reduce((a, c) => a + (f(c) || 0), 0);
    const worldPop = sum(countriesData, (c) => c.population);
    const worldGdp = sum(countriesData, (c) => c.gdp);
    const pop = sum(inScope, (c) => c.population);
    const gdp = sum(inScope, (c) => c.gdp);
    return {
      members: inScope.length,
      pop,
      gdp,
      popShare: worldPop ? (pop / worldPop) * 100 : 0,
      gdpShare: worldGdp ? (gdp / worldGdp) * 100 : 0,
    };
  }, [inScope]);

  /* The group's countries, ranked by whatever indicator the map is showing. */
  const groupRanked = useMemo(
    () =>
      inScope
        .map((c) => ({ c, v: activeCountry.get(c) }))
        .filter((r): r is { c: Country; v: number } => r.v !== null && Number.isFinite(r.v))
        .sort((a, b) => (activeCountry.higherIsBetter ? b.v - a.v : a.v - b.v)),
    [activeCountry, inScope],
  );

  /* The ramp colour for a value, or null when there is no figure. Colour
     follows the value itself for every indicator — low is black, high is
     light grey — so the legend's "Lower" end is always the dark one. It used
     to flip where less is better, which put black at the "Higher" end for
     unemployment and the US ranks. */
  const colourFor = (value: number | null, breaks: number[]): string | null => {
    if (value === null || !Number.isFinite(value)) return null;
    let idx = 0;
    while (idx < breaks.length && value >= breaks[idx]) idx++;
    return ramp[idx];
  };

  /* ── State shading ── */
  const activeState = STATE_INDICATORS.find((i) => i.id === stateMetric)!;
  const stateShading = useMemo(() => {
    const values = usStatesData
      .map((s) => activeState.get(s))
      .filter((v): v is number => v !== null && Number.isFinite(v));
    return { breaks: quantileBreaks(values, ramp.length), count: values.length };
  }, [activeState, ramp.length]);

  /* ── Focus map ── */
  /* Natural Earth's 1:10m admin-1 file covers every country, but at 38.8 MB it
     is far too large to bundle. build-admin1.cjs splits it into one TopoJSON
     per country under static/geo/admin1 — 241 files averaging 30 KB — and the
     manifest maps ISO code to feature count, so the page knows which countries
     have divisions to draw without fetching anything. */
  /* The world map's internal borders: one line per shared border between two
     divisions of the same country, for all 194 countries that have any.
     Loaded after first paint; if it fails, the map simply draws without them. */
  const [admin1Borders, setAdmin1Borders] = useState<{
    features: { properties: { c: string } }[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ADMIN1_BORDERS_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((topo: Topology) => {
        if (cancelled) return;
        setAdmin1Borders(
          feature(topo, topo.objects.b as never) as unknown as {
            features: { properties: { c: string } }[];
          },
        );
      })
      .catch(() => {
        // Country outlines still draw; only the internal borders are missing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [admin1Manifest, setAdmin1Manifest] = useState<Record<
    string,
    number
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${ADMIN1_BASE}/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Record<string, number> | null) => {
        if (!cancelled && m) setAdmin1Manifest(m);
      })
      .catch(() => {
        // Every country still draws its outline; only internal borders are lost.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* One division is the country itself, so it draws no internal border. */
  const hasAdmin1 = useCallback(
    (code: string) => (admin1Manifest?.[code] ?? 0) > 1,
    [admin1Manifest],
  );

  /* The whole topology is kept, not just its features: the country outline is
     merged from these same arcs and the internal borders are meshed from them,
     which is the only way the two are guaranteed to line up. Drawing a 1:50m
     outline around 1:10m divisions leaves subdivisions hanging over the coast. */
  const [admin1, setAdmin1] = useState<{
    code: string;
    topo: Topology;
    key: string;
  } | null>(null);

  useEffect(() => {
    if (focusCode === "US" || !hasAdmin1(focusCode)) return;
    if (admin1?.code === focusCode) return;
    let cancelled = false;
    fetch(`${ADMIN1_BASE}/${focusCode}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((topo: Topology) => {
        if (cancelled) return;
        setAdmin1({ code: focusCode, topo, key: Object.keys(topo.objects)[0] });
      })
      .catch(() => {
        // The outline still draws; only the internal borders are lost.
      });
    return () => {
      cancelled = true;
    };
  }, [focusCode, admin1, hasAdmin1]);

  // Loaded after first paint, for every map: 110m has no shape at all for 33
  // of the dataset's countries — Malta, Singapore, most of the Caribbean and
  // the Pacific — and is too coarse once zoomed.
  const [detailWorld, setDetailWorld] = useState<{
    features: { properties: { name: string } }[];
  } | null>(null);

  useEffect(() => {
    if (detailWorld) return;
    let cancelled = false;
    import("world-atlas/countries-50m.json")
      .then((mod) => {
        if (cancelled) return;
        const topo = (mod.default ?? mod) as unknown as Topology;
        setDetailWorld(
          feature(topo, topo.objects.countries as never) as unknown as {
            features: { properties: { name: string } }[];
          },
        );
      })
      .catch(() => {
        // The 110m outline still draws, so a failed fetch costs detail, not
        // the map.
      });
    return () => {
      cancelled = true;
    };
  }, [detailWorld]);

  /* The world map draws 110m first and switches to 1:50m when it arrives. */
  const worldDrawn: { features: { properties: { name: string } }[] } =
    detailWorld ?? world;

  /* Countries the drawn atlas has a shape for — what the caption may claim.
     1:50m has one for every country in the dataset except Tuvalu. */
  const drawnCountryCount = useMemo(
    () =>
      new Set(
        worldDrawn.features
          .map((f) => countryForFeature(f.properties.name)?.code)
          .filter(Boolean),
      ).size,
    [worldDrawn],
  );

  /* Path strings, computed once per geometry rather than on every render.
     Hovering sets page state and re-renders the page, so building 241 country
     outlines at 1:50m, every state and the graticule inside the render put
     that whole cost on each pointer move. */
  const graticuleD = useMemo(
    () => worldPath.path(geoGraticule10()) ?? undefined,
    [worldPath],
  );
  const worldShapes = useMemo(
    () =>
      worldDrawn.features.map((f) => {
        const [cx, cy] = worldPath.path.centroid(f as never);
        return {
          name: f.properties.name,
          country: countryForFeature(f.properties.name),
          d: worldPath.path(f as never) ?? undefined,
          cx,
          cy,
        };
      }),
    [worldDrawn, worldPath],
  );
  /* Drawn only inside the countries in scope: in G20 mode the others are a
     plain "not selected" fill, and lines across them would read as data. */
  /* ── Overlay layers ───────────────────────────────────────────────────
     Rivers, lakes, ports and mineral sites. Each is off by default and fetched
     only when first switched on; see useOverlay above. */
  const [overlay, setOverlay] = useState<Record<OverlayId, boolean>>({
    rivers: false,
    lakes: false,
    ports: false,
    mines: false,
    infrastructure: false,
    pollution: false,
  });
  const toggleOverlay = useCallback(
    (id: OverlayId) => setOverlay((o) => ({ ...o, [id]: !o[id] })),
    [],
  );

  const rivers = useOverlay<Topology>(OVERLAY_URL.rivers, overlay.rivers);
  const lakes = useOverlay<Topology>(OVERLAY_URL.lakes, overlay.lakes);
  const ports = useOverlay<PointLayer<PortRow>>(OVERLAY_URL.ports, overlay.ports);
  const mines = useOverlay<MineLayer>(OVERLAY_URL.mines, overlay.mines);
  const infra = useOverlay<InfrastructureLayer>(
    OVERLAY_URL.infrastructure,
    overlay.infrastructure,
  );

  const activeOverlays = OVERLAYS.filter((o) => overlay[o.id]);

  const overlayState: Record<OverlayId, { loading: boolean; failed: boolean }> = {
    rivers: { loading: rivers.loading, failed: rivers.failed },
    lakes: { loading: lakes.loading, failed: lakes.failed },
    ports: { loading: ports.loading, failed: ports.failed },
    mines: { loading: mines.loading, failed: mines.failed },
    infrastructure: { loading: infra.loading, failed: infra.failed },
    // Bundled, so it is never pending and cannot fail to arrive.
    pollution: { loading: false, failed: false },
  };

  /* Rivers are drawn in two passes so the map reads at every zoom: the trunk
     rivers always, the rest only once zoomed past RIVER_DETAIL_ABOVE. Drawing
     all 1,454 at world view turns the continents into a grey haze. */
  const riverPaths = useMemo(() => {
    if (!rivers.data) return null;
    const fc = feature(rivers.data, rivers.data.objects.r as never) as unknown as {
      features: { properties: { n: string; s: number } }[];
    };
    const bySize = (max: number) =>
      worldPath.path({
        type: "FeatureCollection",
        features: fc.features.filter((f) => f.properties.s <= max),
      } as never) ?? undefined;
    return { trunk: bySize(RIVER_TRUNK_RANK), all: bySize(99) };
  }, [rivers.data, worldPath]);

  const lakePaths = useMemo(() => {
    if (!lakes.data) return undefined;
    return (
      worldPath.path(
        feature(lakes.data, lakes.data.objects.l as never) as never,
      ) ?? undefined
    );
  }, [lakes.data, worldPath]);

  /* Point layers are drawn as one path each rather than one element per site.
     With a circle per site the mineral layer put 9,639 nodes in the document,
     and because the map re-renders on hover, moving the cursor across it cost a
     measured 33 ms a time - two dropped frames. Two paths render the same dots
     for two nodes and no per-hover reconciliation. */
  const dot = (x: number, y: number, r: number) =>
    `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  /* Ports are squares and mineral sites circles, so the two point layers stay
     distinguishable without reference to their colour. */
  const box = (x: number, y: number, r: number) =>
    `M${x - r},${y - r}h${2 * r}v${2 * r}h${-2 * r}Z`;
  /* Airports are triangles - the third mark shape, after the port square and
     the mineral circle - so the three point layers never depend on colour. */
  const tri = (x: number, y: number, r: number) =>
    `M${x},${y - r}L${x + r},${y + r}L${x - r},${y + r}Z`;

  const portPoints = useMemo(() => {
    if (!ports.data) return null;
    return ports.data.rows
      .map(([, lon, lat, rank]) => {
        const p = worldPath.projection([lon, lat]);
        return p ? { x: p[0], y: p[1], rank } : null;
      })
      .filter((p): p is { x: number; y: number; rank: number } => p !== null);
  }, [ports.data, worldPath]);

  const minePoints = useMemo(() => {
    if (!mines.data) return null;
    const out: { x: number; y: number; deposit: boolean }[] = [];
    for (const [, , , , record, lon, lat] of mines.data.rows) {
      const p = worldPath.projection([lon, lat]);
      if (p) out.push({ x: p[0], y: p[1], deposit: record === 1 });
    }
    return out;
  }, [mines.data, worldPath]);

  const infraPaths = useMemo(() => {
    if (!infra.data) return null;
    const d = infra.data;
    const draw = (key: string) =>
      worldPath.path(feature(d, d.objects[key] as never) as never) ?? undefined;
    return { roads: draw("rd"), rails: draw("rl") };
  }, [infra.data, worldPath]);

  const airportPoints = useMemo(() => {
    if (!infra.data) return null;
    return infra.data.airports
      .map(([, lon, lat, major]) => {
        const p = worldPath.projection([lon, lat]);
        return p ? { x: p[0], y: p[1], major: major === 1 } : null;
      })
      .filter((p): p is { x: number; y: number; major: boolean } => p !== null);
  }, [infra.data, worldPath]);

  /* What the mineral layer actually holds, counted from the data rather than
     written by hand, so the note cannot drift from the file it describes. The
     two record types are reported separately: a deposit and an operation can
     be the same place, so a combined total would overstate it. */
  const mineSummary = useMemo(() => {
    if (!mines.data) return null;
    const d = mines.data;
    const byCommodity = new Map<string, number>();
    let operations = 0;
    for (const [, ci, , , record] of d.rows) {
      if (record === 0) operations++;
      const name = d.commodities[ci];
      if (name) byCommodity.set(name, (byCommodity.get(name) ?? 0) + 1);
    }
    return {
      operations,
      deposits: d.rows.length - operations,
      top: [...byCommodity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [mines.data]);

  const pollutionBands = useMemo(() => {
    const byBand = new Map<number, string[]>();
    for (const { country, d } of worldShapes) {
      if (!country || !d) continue;
      const reading = AIR_QUALITY[country.code];
      if (!reading) continue;
      const band = pm25Band(reading.pm25);
      if (band === 0) continue; // meets the guideline; nothing to mark
      if (!byBand.has(band)) byBand.set(band, []);
      byBand.get(band)!.push(d);
    }
    return [...byBand.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([band, ds]) => ({ band, d: ds.join(""), opacity: POLLUTION_OPACITY[band] }));
  }, [worldShapes]);

  const admin1BordersD = useMemo(() => {
    if (!admin1Borders) return undefined;
    const codes = activeScope.codes ? new Set<string>(activeScope.codes) : null;
    const features = codes
      ? admin1Borders.features.filter((f) => codes.has(f.properties.c))
      : admin1Borders.features;
    return worldPath.path({ type: "FeatureCollection", features } as never) ?? undefined;
  }, [admin1Borders, worldPath, activeScope]);
  const stateShapes = useMemo(
    () =>
      states.features.map((f) => ({
        name: f.properties.name,
        state: stateForFeature(f.properties.name),
        d: statePath(f as never) ?? undefined,
      })),
    [states, statePath],
  );

  // The same audit for the 1:50m file, which every map ends up drawing.
  useEffect(() => {
    if (!import.meta.env.DEV || !detailWorld) return;
    const { matched, unexpectedMisses } = auditMapJoin(
      detailWorld.features.map((f) => f.properties.name),
    );
    if (unexpectedMisses.length) {
      console.warn(
        `[maps] 1:50m: ${unexpectedMisses.length} country features did not match the dataset:`,
        unexpectedMisses,
      );
    } else {
      console.info(`[maps] 1:50m join clean — ${matched} country features matched`);
    }
  }, [detailWorld]);

  const featureByCode = useMemo(() => {
    const m = new Map<string, { properties: { name: string } }>();
    const source = detailWorld ?? world;
    for (const f of source.features) {
      const c = countryForFeature(f.properties.name);
      if (c) m.set(c.code, f);
    }
    return m;
  }, [world, detailWorld]);

  const focusCountry = useMemo(
    () => countriesData.find((c) => c.code === focusCode) ?? null,
    [focusCode],
  );

  // Only countries with geometry are offered; picking one with no outline would
  // give an empty card.
  const focusOptions = useMemo(
    () =>
      countriesData
        .filter((c) => featureByCode.has(c.code))
        .map((c) => ({ value: c.code, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [featureByCode],
  );

  /* ── Viewports ──
     One per canvas. The US map and the country focus map share a card and a
     canvas, so they share a viewport, and it resets whenever the country
     changes. `zoom` is that shared level, which the label pass depends on. */
  const worldZoom = useMapZoom(WORLD_W, WORLD_H);
  const focusZoom = useMapZoom(US_W, US_H, focusCode);

  /* These two depend on the zoom, so they are declared after it: the dots keep
     a constant size on screen, which means their radius is in canvas units
     divided by the current zoom. */
  const portsD = useMemo(() => {
    if (!portPoints) return undefined;
    const r = 1.5 / worldZoom.zoom;
    return portPoints
      .filter((p) => worldZoom.zoom > PORT_DETAIL_ABOVE || p.rank <= PORT_MAJOR_RANK)
      .map((p) => box(p.x, p.y, r))
      .join("");
  }, [portPoints, worldZoom.zoom]);

  const airportsD = useMemo(() => {
    if (!airportPoints) return undefined;
    const r = 1.6 / worldZoom.zoom;
    return airportPoints
      .filter((p) => worldZoom.zoom > AIRPORT_DETAIL_ABOVE || p.major)
      .map((p) => tri(p.x, p.y, r))
      .join("");
  }, [airportPoints, worldZoom.zoom]);

  const minesD = useMemo(() => {
    if (!minePoints) return null;
    const near = worldZoom.zoom > MINE_FULL_DETAIL_ABOVE;
    const r = (near ? MINE_DOT.near : MINE_DOT.far) / worldZoom.zoom;
    const solid: string[] = [];
    const hollow: string[] = [];
    for (const p of minePoints) (p.deposit ? hollow : solid).push(dot(p.x, p.y, r));
    return {
      solid: solid.join(""),
      hollow: hollow.join(""),
      opacity: near ? MINE_OPACITY.near : MINE_OPACITY.far,
      /* Far out, a hollow ring of 0.55 units would close up into a blob, so
         both record types are drawn solid and the distinction returns with the
         zoom that makes it legible. */
      ringed: near,
    };
  }, [minePoints, worldZoom.zoom]);

  const zoom = focusZoom.zoom;

  /**
   * Everything geometric about the focused country, in one pass.
   *
   * The outline is merged from the admin-1 arcs and the internal borders are
   * meshed from the same topology, so the two cannot disagree — the coast a
   * division ends on is literally the same arc the outline is drawn from.
   * Only the countries with a single division fall back to the world atlas
   * outline, and there is nothing internal to misalign there.
   *
   * mesh(..., (a, b) => a !== b) yields interior borders only, so a shared
   * border is one stroke rather than two stacked on each other. That is what
   * stops internal lines reading heavier than the coast.
   *
   * The projection is fitted to the mainland cluster, not to everything the
   * country administers — see mainlandIndices for why.
   */
  const focusMap = useMemo(() => {
    if (focusCode === "US") return null;
    const useAdmin1 = admin1 !== null && admin1.code === focusCode;
    const worldFeature = featureByCode.get(focusCode);

    const fitTo = (geo: unknown, box: [[number, number], [number, number]]) =>
      geoEqualEarth().fitExtent(box, geo as never);

    const mainBox: [[number, number], [number, number]] = [
      [PAD, PAD],
      [US_W - PAD, US_H - PAD],
    ];

    if (!useAdmin1) {
      if (!worldFeature) return null;
      const path = geoPath(fitTo(worldFeature, mainBox));
      return {
        outline: path(worldFeature as never) ?? "",
        interior: "",
        parts: [] as Subdivision[],
        insets: [] as Inset[],
        offView: [] as string[],
        path,
        geo: worldFeature as unknown,
      };
    }

    const obj = admin1.topo.objects[admin1.key] as unknown as {
      type: string;
      geometries: { properties?: { n?: string } }[];
    };
    const fc = feature(admin1.topo, obj as never) as unknown as {
      features: { properties: { n: string } }[];
    };

    const { keep, outliers } = clusterDivisions(fc.features);
    const keptGeoms = keep.map((i) => obj.geometries[i]);

    const outlineGeo = merge(
      admin1.topo,
      keptGeoms as Parameters<typeof merge>[1],
    );
    const path = geoPath(fitTo(outlineGeo, mainBox));

    const interior =
      path(
        mesh(
          admin1.topo,
          { type: "GeometryCollection", geometries: keptGeoms } as never,
          (a, b) => a !== b,
        ) as never,
      ) ?? "";

    const parts: Subdivision[] = keep
      .map((i) => {
        const f = fc.features[i];
        const [cx, cy] = path.centroid(f as never);
        const [[x0, y0], [x1, y1]] = path.bounds(f as never);
        return {
          n: f.properties.n ?? "",
          d: path(f as never) ?? "",
          cx,
          cy,
          w: x1 - x0,
          h: y1 - y0,
        };
      })
      .filter((f) => f.d.length > 0 && Number.isFinite(f.cx));

    /* Each outlying group gets its own small map at its own scale, the way an
       atlas insets the DOM beside metropolitan France. Drawn to scale on the
       main map they would be a few pixels of nothing, and left off entirely
       they would be a quiet omission. */
    const nameOf = (group: number[]) => {
      const names = group
        .map((i) => fc.features[i].properties.n ?? "")
        .filter((n) => n.trim().length > 0);
      if (names.length === 0) return "Unnamed";
      if (names.length <= 2) return names.join(" & ");
      return `${names[0]} +${names.length - 1}`;
    };

    const insetBox: [[number, number], [number, number]] = [
      [INSET_PAD, INSET_PAD],
      [INSET_SIZE - INSET_PAD, INSET_SIZE - INSET_PAD],
    ];

    const insets: Inset[] = outliers.slice(0, MAX_INSETS).map((group) => {
      const geoms = group.map((i) => obj.geometries[i]);
      const collection = {
        type: "GeometryCollection",
        geometries: geoms,
      };
      const merged = merge(admin1.topo, geoms as Parameters<typeof merge>[1]);
      const ip = geoPath(fitTo(merged, insetBox));
      return {
        key: group.join("-"),
        name: nameOf(group),
        d: ip(merged as never) ?? "",
        interior:
          group.length > 1
            ? (ip(mesh(admin1.topo, collection as never, (a, b) => a !== b) as never) ?? "")
            : "",
      };
    });

    /* Anything past the inset cap is still named, never silently dropped. */
    const offView = outliers
      .slice(MAX_INSETS)
      .flatMap((group) => group.map((i) => fc.features[i].properties.n ?? ""))
      .filter((n) => n.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));

    return {
      outline: path(outlineGeo as never) ?? "",
      interior,
      parts,
      insets,
      offView,
      path,
      geo: outlineGeo as unknown,
    };
  }, [focusCode, featureByCode, admin1]);

  /* ── The same overlays, on whichever country is in focus ──────────────
     The layers are lon/lat, so they can be drawn in any projection; what
     changes is that the focus map is one country, and the files cover the
     world. Everything is therefore clipped to that country's own bounding box
     before it is projected - otherwise the map would carry every road and
     every mine on earth, nearly all of it outside the viewBox and none of it
     free to draw.

     The box is taken from the geography the projection was fitted to, so it
     follows whatever is being shown, including the outlying groups the
     projection chose to leave out. A degree of margin keeps a river that
     leaves the country from stopping dead at the border. */
  const focusFrame = useMemo(() => {
    const path = focusCode === "US" ? statePath : focusMap?.path;
    const geo = focusCode === "US" ? (states as unknown) : focusMap?.geo;
    if (!path || !geo) return null;
    const [[w, s0], [e, n]] = geoBounds(geo as never);
    if (![w, s0, e, n].every(Number.isFinite)) return null;
    const M = 1;
    /* geoBounds reports the SHORTER way round, so for a country that reaches
       across the antimeridian the western edge is numerically larger than the
       eastern one. The United States is such a country - Guam at 144.6 East,
       Maine at 64.6 West - and so are Russia, New Zealand, Fiji and Kiribati.
       Read as a plain interval that box excludes the whole country: tested
       with lon >= 144.6 && lon <= -64.6, New York fails, and the layer came
       out empty rather than wrong-looking, which is why it needed measuring
       rather than a glance. When the edges are the wrong way round the test
       is an OR, not an AND. */
    return {
      path,
      bounds: { w: w - M, s: s0 - M, e: e + M, n: n + M, wraps: w > e },
    };
  }, [focusCode, statePath, states, focusMap]);

  type FocusBounds = NonNullable<typeof focusFrame>["bounds"];

  const inBounds = useCallback(
    (lon: number, lat: number, b: FocusBounds) =>
      lat >= b.s &&
      lat <= b.n &&
      (b.wraps ? lon >= b.w || lon <= b.e : lon >= b.w && lon <= b.e),
    [],
  );

  /** Does any part of this line come near the country in view? */
  const lineNear = useCallback(
    (line: [number, number][], b: FocusBounds) => {
      for (const [x, y] of line) if (inBounds(x, y, b)) return true;
      return false;
    },
    [inBounds],
  );

  const focusOverlays = useMemo(() => {
    if (!focusFrame) return null;
    const { path, bounds } = focusFrame;
    const inBox = (lon: number, lat: number) => inBounds(lon, lat, bounds);

    /* Multi-feature layers are filtered feature by feature. */
    const clipCollection = (topo: Topology | null, key: string) => {
      if (!topo) return undefined;
      const fc = feature(topo, topo.objects[key] as never) as unknown as {
        features: { geometry: { type: string; coordinates: unknown } }[];
      };
      const kept = fc.features.filter((f) => {
        const g = f.geometry;
        if (!g) return false;
        if (g.type === "MultiLineString") {
          return (g.coordinates as [number, number][][]).some((l) => lineNear(l, bounds));
        }
        if (g.type === "Polygon") {
          return lineNear((g.coordinates as [number, number][][])[0], bounds);
        }
        if (g.type === "MultiPolygon") {
          return (g.coordinates as [number, number][][][]).some((p) => lineNear(p[0], bounds));
        }
        return false;
      });
      if (!kept.length) return undefined;
      return path({ type: "FeatureCollection", features: kept } as never) ?? undefined;
    };

    /* Roads and railways arrive as one merged geometry each, so they are
       filtered line by line instead of feature by feature. */
    const clipMerged = (topo: Topology | null, key: string) => {
      if (!topo) return undefined;
      const fc = feature(topo, topo.objects[key] as never) as unknown as {
        features: { geometry: { type: string; coordinates: [number, number][][] } }[];
      };
      const lines: [number, number][][] = [];
      for (const f of fc.features) {
        if (!f.geometry) continue;
        for (const l of f.geometry.coordinates) if (lineNear(l, bounds)) lines.push(l);
      }
      if (!lines.length) return undefined;
      return path({ type: "MultiLineString", coordinates: lines } as never) ?? undefined;
    };

    /* A projection may refuse a point outside what it covers - Albers USA
       returns null for anywhere that is not the United States - so the result
       is checked rather than assumed. */
    const project = path.projection() as unknown as
      ((c: [number, number]) => [number, number] | null) | null;
    const place = <T,>(rows: T[], lon: (r: T) => number, lat: (r: T) => number) =>
      !project
        ? []
        : rows
            .filter((r) => inBox(lon(r), lat(r)))
            .map((r) => {
              const p = project([lon(r), lat(r)]);
              return p && Number.isFinite(p[0]) && Number.isFinite(p[1])
                ? { x: p[0], y: p[1], row: r }
                : null;
            })
            .filter((p): p is { x: number; y: number; row: T } => p !== null);

    return {
      rivers: clipCollection(rivers.data, "r"),
      lakes: clipCollection(lakes.data, "l"),
      roads: clipMerged(infra.data, "rd"),
      rails: clipMerged(infra.data, "rl"),
      ports: ports.data ? place(ports.data.rows, (r) => r[1], (r) => r[2]) : null,
      airports: infra.data ? place(infra.data.airports, (r) => r[1], (r) => r[2]) : null,
      mines: mines.data ? place(mines.data.rows, (r) => r[5], (r) => r[6]) : null,
    };
  }, [focusFrame, lineNear, inBounds, rivers.data, lakes.data, infra.data, ports.data, mines.data]);

  /* Marks on the focus map keep the same shapes as on the world map, drawn a
     little larger because there is room for them on one country.

     Mineral sites are the exception, and get the same treatment they get on the
     world map: there are 7,160 of them in the United States alone, and at full
     size they cover the country rather than showing where mining is. They are
     drawn small and part transparent until the reader zooms in. */
  /* The focused country's own band, so the focus maps can wash the whole
     country the one colour its single national figure supports. */
  const focusPollution = useMemo(() => {
    const code = focusCode === "US" ? "US" : focusCountry?.code;
    const reading = code ? AIR_QUALITY[code] : undefined;
    if (!reading) return null;
    const band = pm25Band(reading.pm25);
    if (band === 0) return null;
    return { band, pm25: reading.pm25, year: reading.year, opacity: POLLUTION_OPACITY[band] };
  }, [focusCode, focusCountry]);

  const focusMarks = useMemo(() => {
    if (!focusOverlays) return null;
    const z = focusZoom.zoom;
    const r = 2 / z;
    const near = z > MINE_FULL_DETAIL_ABOVE;
    const mineR = (near ? MINE_DOT.near : MINE_DOT.far) / z;
    const join = (
      pts: { x: number; y: number }[] | null,
      shape: (x: number, y: number, r: number) => string,
      radius = r,
    ) => (pts && pts.length ? pts.map((p) => shape(p.x, p.y, radius)).join("") : undefined);
    const mineSolid = focusOverlays.mines?.filter((p) => p.row[4] === 0) ?? [];
    const mineHollow = focusOverlays.mines?.filter((p) => p.row[4] === 1) ?? [];
    return {
      ports: join(focusOverlays.ports, box),
      airports: join(focusOverlays.airports, tri),
      mineSolid: join(mineSolid, dot, mineR),
      mineHollow: join(mineHollow, dot, mineR),
      mineOpacity: near ? MINE_OPACITY.near : MINE_OPACITY.far,
      /* Too small to read as a ring when zoomed out, so both kinds are solid
         until the distinction can actually be seen. */
      mineRinged: near,
    };
  }, [focusOverlays, focusZoom.zoom]);

  /**
   * Which names fit on the map at the current zoom, and which do not.
   *
   * Labels hold a constant size on screen, so zooming in grows the geometry
   * underneath them and more names earn a place. A label is drawn only when it
   * fits inside its own division *and* clears every label already placed —
   * largest division first, so the biggest regions keep their names when space
   * runs out. Anything left over is listed under the map instead of being
   * dragged out on a leader line, which is what used to run off the canvas:
   * Russia's 86 divisions stacked to y=1315 in a 560-tall viewBox.
   */
  const focusLabels = useMemo(() => {
    const parts = focusMap?.parts ?? [];
    const named = parts.filter((f) => f.n.trim().length > 0);

    /* Roughly 5.3px per character at 9px in this mono face, measured off the
       rendered labels. Divided by the zoom because the text keeps its size on
       screen while the map beneath it grows. */
    const charW = 5.3 / zoom;
    const lineH = 10 / zoom;

    const byArea = [...named].sort((a, b) => b.w * b.h - a.w * a.h);
    const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const inside: Subdivision[] = [];

    for (const f of byArea) {
      const w = f.n.length * charW;
      if (f.w < w + 6 / zoom || f.h < lineH + 2 / zoom) continue;
      const box = {
        x0: f.cx - w / 2 - charW,
        y0: f.cy - lineH / 2 - lineH * 0.2,
        x1: f.cx + w / 2 + charW,
        y1: f.cy + lineH / 2 + lineH * 0.2,
      };
      const clash = placed.some(
        (p) => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0,
      );
      if (clash) continue;
      placed.push(box);
      inside.push(f);
    }

    const shown = new Set(inside.map((f) => f.n));
    const unlabelled = named
      .filter((f) => !shown.has(f.n))
      .map((f) => f.n)
      .sort((a, b) => a.localeCompare(b));

    return { inside, unlabelled, total: named.length };
  }, [focusMap, zoom]);

  /**
   * The sentence under the focus map, describing only what is actually drawn.
   *
   * Natural Earth publishes first-order divisions for every country at 1:10m,
   * but seven of the 204 countries in this dataset — Tuvalu, Puerto Rico,
   * Guam, the Faroe Islands, Monaco, Western Sahara and Niue — have exactly
   * one, so there is no internal border to draw. Six of them can be selected
   * here; Tuvalu cannot, because the 1:50m atlas the selector draws from has
   * no shape for it. Counted off the manifest and the atlas, not asserted.
   */
  const bordersNote = useMemo(() => {
    if (!admin1Manifest) return "Internal borders load with the country. ";
    const published = admin1Manifest[focusCode] ?? 0;
    if (published <= 1) {
      return "Natural Earth records a single first-order division for this country, so it is drawn as one outline. ";
    }
    const drawn = focusMap?.parts.length ?? 0;
    if (drawn === 0) {
      return `Loading ${published} first-order divisions from Natural Earth. `;
    }
    const insets = focusMap?.insets.length ?? 0;
    const off = focusMap?.offView.length ?? 0;
    const framed = insets
      ? ` The map is framed on the main landmass; ${insets} outlying territor${
          insets === 1 ? "y is" : "ies are"
        } drawn beside it, each at its own scale.`
      : "";
    const listed = off
      ? ` ${off} further division${off === 1 ? " is" : "s are"} named below.`
      : "";
    return `Internal borders shown are ${drawn} first-order divisions from Natural Earth.${framed}${listed} `;
  }, [admin1Manifest, focusCode, focusMap]);

  /** Cities the dataset happens to hold for the focused country. */
  const focusCities = useMemo(
    () =>
      focusCountry
        ? citiesData
            .filter((c) => c.countryCode === focusCountry.code)
            .sort((a, b) => b.population - a.population)
        : [],
    [focusCountry],
  );

  /* ── State labels ──
     Measured from the projected path, so a state only gets an outside label
     when its own geometry genuinely cannot hold the text. */
  const stateLabels = useMemo(() => {
    const inside: {
      abbr: string; x: number; y: number;
      outside: false; leader: null;
    }[] = [];
    const tooSmall: { abbr: string; cx: number; cy: number }[] = [];

    for (const f of states.features) {
      const state = stateForFeature(f.properties.name);
      if (!state) continue; // DC and the territories carry no dataset row
      const [cx, cy] = statePath.centroid(f as never);
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
      const [[x0, y0], [x1, y1]] = statePath.bounds(f as never);
      // Two characters at 12px need roughly this much room.
      const fits = x1 - x0 >= 22 && y1 - y0 >= 14;
      if (fits) inside.push({ abbr: state.abbreviation, x: cx, y: cy, outside: false, leader: null });
      else tooSmall.push({ abbr: state.abbreviation, cx, cy });
    }

    // The ones that do not fit are stacked down the right edge in the order
    // they appear on the map, each joined to its state by a leader.
    const COL_X = US_W - 52;
    const startY = 150;
    const step = 20;
    const outside = tooSmall
      .sort((a, b) => a.cy - b.cy)
      .map((t, i) => {
        const y = startY + i * step;
        return {
          abbr: t.abbr,
          x: COL_X,
          y,
          outside: true as const,
          leader: `${t.cx},${t.cy} ${COL_X - 10},${y} ${COL_X - 4},${y}`,
        };
      });

    return [...inside, ...outside];
  }, [states, statePath]);

  /* ── Continental aggregates ── */
  const continents = useMemo(() => {
    const groups = new Map<string, Country[]>();
    for (const c of countriesData) {
      if (!groups.has(c.continent)) groups.set(c.continent, []);
      groups.get(c.continent)!.push(c);
    }
    const median = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s.length ? s[Math.floor(s.length / 2)] : null;
    };
    return [...groups.entries()]
      .map(([name, list]) => {
        const hdi = list.map((c) => c.humanDevelopmentIndex).filter((v): v is number => Number.isFinite(v));
        const life = list.map((c) => c.lifeExpectancy).filter((v): v is number => Number.isFinite(v));
        return {
          name,
          countries: list.length,
          // Summed, because a population is a count.
          population: list.reduce((a, c) => a + (c.population || 0), 0),
          gdp: list.reduce((a, c) => a + (c.gdp || 0), 0),
          // Median, not mean: an average HDI across countries of wildly
          // different size would say nothing about a typical country there.
          medianHdi: median(hdi),
          medianLife: median(life),
        };
      })
      .sort((a, b) => b.population - a.population);
  }, []);

  /* Where each switched-on layer came from, and what it does not say.
  
     Printed under the map rather than hidden in a tooltip, because a reader who
     has just drawn a conclusion from the mineral layer is the one who most
     needs to know that it stops in 2008 and omits the United States.
  
     Shared between the maps for the same reason the toggles are: one set of
     caveats, so the country map cannot quietly omit one the world map gives. */
  const layerNotes = () =>
    activeOverlays.length === 0 ? null : (
        <div className="mt-2 space-y-1">
          {activeOverlays.map((o) => (
            <p key={o.id} className="text-[9px] font-sans text-muted-foreground">
              <span
                aria-hidden
                className={`inline-block w-1.5 h-1.5 mr-1.5 align-middle ${
                  o.id === "ports" || o.id === "infrastructure" ? "" : "rounded-full"
                }`}
                style={
                  o.id === "infrastructure"
                    ? { background: overlayInk[o.id], clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }
                    : { background: overlayInk[o.id] }
                }
              />
              <span className="font-medium text-foreground">{o.label}</span> — {o.about}
            </p>
          ))}
          {overlay.pollution && (
            <p className="text-[9px] font-sans text-muted-foreground pl-3">
              Bands are the WHO thresholds as the World Bank states them: the
              guideline at 10 µg/m³, then interim targets 3, 2 and 1 at 15, 25
              and 35. Countries at or below the guideline are left unshaded.
              Figures are {AIR_QUALITY_SOURCE.years} and population-weighted, so
              they describe the air a country's people breathe rather than where
              within it the pollution sits.
            </p>
          )}
          {overlay.mines && mineSummary && (
            <p className="text-[9px] font-sans text-muted-foreground pl-3">
              A filled dot is one of {mineSummary.operations.toLocaleString()}{" "}
              working operations, a hollow one of{" "}
              {mineSummary.deposits.toLocaleString()} known deposits. They are
              counted separately: the same place can be both, and the surveys
              do not share a date. Most common:{" "}
              {mineSummary.top.map(([name, n]) => `${name} (${n})`).join(", ")}.
            </p>
          )}
        </div>
    );

  /* The overlay toggles, drawn under every map that can show them.
  
     One row of markup and one piece of state, so switching a layer on under
     the world map switches it on under the country map too - they are the
     same layers, and two independent sets would invite the reader to wonder
     why the same switch says different things in two places.
  
     Kept in a row of their own, apart from the scope and indicator chips,
     because these do not change what is shaded - they add a layer over it -
     and a reader who mistook one for the other would read the map wrongly. */
  const layerToggles = () => (
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-secondary mr-1">
          Layers
        </span>
        {OVERLAYS.map((o) => {
          const state = overlayState[o.id];
          return (
            <button
              key={o.id}
              onClick={() => toggleOverlay(o.id)}
              aria-pressed={overlay[o.id]}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                overlay[o.id]
                  ? "border-transparent"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              style={
                overlay[o.id]
                  ? { background: `${overlayInk[o.id]}26`, borderColor: `${overlayInk[o.id]}66`, color: overlayInk[o.id] }
                  : undefined
              }
              title={o.about}
            >
              <span
                aria-hidden
                className={`w-2 h-2 shrink-0 ${
                  o.id === "ports" || o.id === "infrastructure" ? "" : "rounded-full"
                }`}
                style={{
                  background: overlay[o.id] ? overlayInk[o.id] : "currentColor",
                  opacity: overlay[o.id] ? 1 : 0.45,
                  ...(o.id === "infrastructure"
                    ? { clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }
                    : {}),
                }}
              />
              {o.label}
              {state.loading && <span className="font-mono opacity-70">…</span>}
              {state.failed && <span className="font-mono opacity-70">unavailable</span>}
            </button>
          );
        })}
      </div>

  );

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
      active
        ? "bg-secondary/20 text-secondary border-secondary/40"
        : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      {/* Wider than the usual 2xl cap: at 2560 the maps stopped growing at
          1488px and sat in ~890px of empty space. Height is capped per map
          below, so the extra width cannot push a card past the viewport. */}
      <div className="px-6 py-8 max-w-[2000px] mx-auto">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-sans text-foreground">
            World &amp; Regional Maps
          </h1>
          <p className="text-muted-foreground text-sm font-sans">
            Equal-area maps of {drawnCountryCount} countries and{" "}
            {usStatesData.length} US states, shaded by development, health,
            economy and society indicators
          </p>
        </div>

        {/* ── Why these projections ── */}
        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-2.5">
            <Info size={14} weight="fill" className="text-secondary shrink-0 mt-0.5" />
            <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">
              The world map uses the <strong>Equal Earth</strong> projection and
              the US map uses <strong>Albers USA</strong>. Both preserve relative
              area, which a shaded map needs: on Mercator, Greenland appears
              larger than Africa, and every comparison this page invites would be
              distorted before a colour was applied. Boundaries are Natural Earth
              and US Census Bureau data, both public domain. Shading comes from
              this site's own datasets — countries with no figure for the chosen
              indicator are left unshaded rather than estimated.
            </p>
          </div>
        </div>

        {/* ── World map ── */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <GlobeHemisphereWest size={16} weight="fill" className="text-secondary" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  Equal Earth projection
                </p>
                <h2 className="text-sm font-bold font-sans text-foreground">
                  {activeCountry.label} by country
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {countryShading.count} of {inScope.length} {activeScope.noun} have
              this figure
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {SCOPES.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setScope(sc.id)}
                aria-pressed={scope === sc.id}
                className={chip(scope === sc.id)}
              >
                {sc.chip}
              </button>
            ))}
            <div className="w-px h-5 bg-border shrink-0" />
            {COUNTRY_INDICATORS.map((i) => (
              <button
                key={i.id}
                onClick={() => setCountryMetric(i.id)}
                aria-pressed={countryMetric === i.id}
                className={chip(countryMetric === i.id)}
              >
                {i.label}
              </button>
            ))}
          </div>

          {layerToggles()}

          <ZoomControls
            zoom={worldZoom.zoom}
            onZoom={worldZoom.zoomTo}
            onReset={worldZoom.reset}
            label="world map"
          >
            {" "}· scroll or +/- to zoom, drag or arrows to pan
          </ZoomControls>
          <svg
            viewBox={worldZoom.viewBox}
            className="w-full h-auto mx-auto"
            style={worldZoom.style}
            {...worldZoom.panProps}
            {...worldZoom.a11yProps}
            role="img"
            aria-label={`World map shaded by ${activeCountry.label}. Scroll to zoom; once focused, plus and minus zoom, the arrow keys pan and 0 resets.`}
          >
            <defs>
              <NoDataHatch id="nodata-world" base={noData} line={noDataHatch} zoom={worldZoom.zoom} />
            </defs>
            {/* Graticule first, so borders sit above it. */}
            <path
              d={graticuleD}
              fill="none"
              stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
              strokeWidth={0.5 / worldZoom.zoom}
            />
            {worldShapes.map(({ name, country, d, cx, cy }, i) => {
              const outside =
                activeScope.belongs !== null &&
                country !== null &&
                !activeScope.belongs(country);
              const value = country && !outside ? activeCountry.get(country) : null;
              return (
                <path
                  key={i}
                  d={d}
                  fill={
                    outside
                      ? outOfScope
                      : (colourFor(value, countryShading.breaks) ?? "url(#nodata-world)")
                  }
                  stroke={stroke}
                  strokeWidth={0.3 / worldZoom.zoom}
                  onMouseEnter={() =>
                    setHovered({
                      name: country?.name ?? name,
                      value: outside
                        ? `not in ${activeScope.title}`
                        : value !== null
                          ? activeCountry.format(value)
                          : "no data",
                      cx,
                      cy,
                      continent: country?.continent,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
            {/* First-order internal borders — states, provinces, regions — as one
                unshaded layer over the fills. Lighter than the country borders so
                countries still read first, and it takes no pointer events, so a
                hover still reports the country underneath. */}
            {admin1BordersD && (
              <path
                d={admin1BordersD}
                fill="none"
                stroke={stroke}
                strokeOpacity={0.6}
                strokeWidth={0.3 / worldZoom.zoom}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}

            {/* ── Overlays ──────────────────────────────────────────────
                Drawn over the fills and the internal borders, under the hover
                title. None takes pointer events, so hovering a river still
                reports the country beneath it and the choropleth stays the
                thing the map is about. Widths and radii are divided by the
                zoom, so every layer holds its size on screen. */}
            {overlay.pollution &&
              pollutionBands.map((b) => (
                <path
                  key={b.band}
                  d={b.d}
                  fill={overlayInk.pollution}
                  fillOpacity={b.opacity}
                  pointerEvents="none"
                />
              ))}
            {overlay.infrastructure && infraPaths && (
              /* Roads solid and railways dashed, so the two line networks stay
                 apart without reference to colour. Drawn first of the overlays,
                 so water and the point layers read over them. */
              <g pointerEvents="none">
                <CasedLine d={infraPaths.roads} ink={overlayInk.infrastructure} halo={labelHalo} width={0.45} zoom={worldZoom.zoom} opacity={0.75} />
                <CasedLine
                  d={infraPaths.rails}
                  ink={overlayInk.infrastructure}
                  halo={labelHalo}
                  width={0.5}
                  zoom={worldZoom.zoom}
                  dash={`${2.4 / worldZoom.zoom} ${1.6 / worldZoom.zoom}`}
                />
              </g>
            )}
            {overlay.lakes && lakePaths && (
              <path
                d={lakePaths}
                fill={overlayInk.lakes}
                fillOpacity={0.55}
                stroke={overlayInk.lakes}
                strokeWidth={0.3 / worldZoom.zoom}
                pointerEvents="none"
              />
            )}
            {overlay.rivers && riverPaths && (
              <CasedLine
                d={worldZoom.zoom > RIVER_DETAIL_ABOVE ? riverPaths.all : riverPaths.trunk}
                ink={overlayInk.rivers}
                halo={labelHalo}
                width={0.6}
                zoom={worldZoom.zoom}
                opacity={0.85}
              />
            )}
            {overlay.mines && minesD && (
              /* A working operation is drawn solid and a known deposit hollow,
                 because they come from different datasets and mean different
                 things - one is a mine that was running, the other is ore known
                 to be in the ground. */
              <g pointerEvents="none">
                {/* Every mark carries a halo for the same reason the lines carry
                    a casing: the fill underneath is whatever the choropleth put
                    there, and against a pale step the rust would vanish. */}
                <path
                  d={minesD.solid}
                  fill={overlayInk.mines}
                  fillOpacity={minesD.opacity}
                  stroke={labelHalo}
                  strokeOpacity={0.55}
                  strokeWidth={0.4 / worldZoom.zoom}
                />
                <path
                  d={minesD.hollow}
                  fill="none"
                  stroke={labelHalo}
                  strokeOpacity={0.55}
                  strokeWidth={(minesD.ringed ? 1.5 : 0.9) / worldZoom.zoom}
                />
                <path
                  d={minesD.hollow}
                  fill={minesD.ringed ? "none" : overlayInk.mines}
                  fillOpacity={minesD.opacity}
                  stroke={minesD.ringed ? overlayInk.mines : "none"}
                  strokeWidth={0.7 / worldZoom.zoom}
                  strokeOpacity={0.9}
                />
              </g>
            )}
            {overlay.infrastructure && airportsD && (
              <path
                d={airportsD}
                fill={overlayInk.infrastructure}
                fillOpacity={0.95}
                stroke={labelHalo}
                strokeWidth={0.35 / worldZoom.zoom}
                pointerEvents="none"
              />
            )}
            {overlay.ports && portsD && (
              <path
                d={portsD}
                fill={overlayInk.ports}
                fillOpacity={0.9}
                stroke={labelHalo}
                strokeWidth={0.4 / worldZoom.zoom}
                pointerEvents="none"
              />
            )}

            {/* The title under the cursor: the continent while the whole world
                is in view, the country once zoomed in. Same ink and halo as the
                map's other labels and the same size on screen at any zoom. It
                takes no pointer events, so it cannot interrupt its own hover. */}
            {hovered &&
              hovered.cx !== undefined &&
              hovered.cy !== undefined &&
              Number.isFinite(hovered.cx) &&
              Number.isFinite(hovered.cy) && (
                <text
                  x={hovered.cx}
                  y={hovered.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  className="font-mono"
                  style={{
                    fontSize: 13 / worldZoom.zoom,
                    fontWeight: 700,
                    fill: labelInk,
                    stroke: labelHalo,
                    strokeWidth: 3.5 / worldZoom.zoom,
                    strokeLinejoin: "round",
                    paintOrder: "stroke",
                  }}
                >
                  {worldZoom.zoom < CONTINENT_TITLE_BELOW
                    ? (hovered.continent ?? hovered.name)
                    : hovered.name}
                </text>
              )}
          </svg>

          <Legend
            ramp={ramp}
            noData={noData}
            noDataHatch={noDataHatch}
            lowLabel="Lower"
            highLabel="Higher"
            extra={
              activeScope.outsideLabel
                ? { colour: outOfScope, label: activeScope.outsideLabel }
                : undefined
            }
            hovered={hovered}
          />

          {layerNotes()}
        </div>

        {/* ── Group figures, while a group scope is selected ── */}
        {scope !== "all" && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
              {activeScope.title}
            </p>
            <h2 className="text-sm font-bold font-sans text-foreground mb-1">
              {groupStats.members}{" "}
              {activeScope.rowLabel === "Member" ? "member states" : "countries"}
            </h2>
            <p className="text-[11px] font-sans text-muted-foreground mb-4">
              {scope === "g20" && (
                <>
                  The G20 has 21 members. The {groupStats.members} states below are
                  mapped; the other two — the{" "}
                  {G20_UNION_MEMBERS.join(" and the ")} — are unions rather than
                  countries, so they have no country row and no share of their own
                  here. The African Union joined in 2023.
                </>
              )}
              {scope === "brics" && <>{BRICS_MEMBERSHIP_NOTE}</>}
              {scope === "g7" && (
                <>
                  The {groupStats.members} member states are mapped. The{" "}
                  {G7_PARTICIPANTS.join(" and ")} takes part in every summit but is
                  not counted as a member and has no country row of its own here.
                </>
              )}
              {(scope === "north" || scope === "south") && (
                <>
                  Global North and Global South are not official categories and no
                  body publishes a membership list, so this uses the UN Statistics
                  Division's M49 developed / developing classification. UNSD states
                  that those designations are for statistical convenience and do not
                  express a judgement about the stage a country has reached in the
                  development process.{" "}
                  {unclassifiedCount} countries here are classified neither way and
                  are drawn as out of scope.
                </>
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Combined population", value: `${(groupStats.pop / 1e9).toFixed(2)}B` },
                { label: "Share of world population", value: `${groupStats.popShare.toFixed(1)}%` },
                { label: "Combined GDP", value: `$${(groupStats.gdp / 1000).toFixed(1)}T` },
                { label: "Share of world GDP", value: `${groupStats.gdpShare.toFixed(1)}%` },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.04)",
                    border: isLight
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="text-base font-bold font-mono text-foreground">{k.value}</p>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              {activeScope.rowLabel === "Member" ? "Members" : "Countries"} by{" "}
              {activeCountry.label}
            </p>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      #
                    </th>
                    <th className="pb-2 text-left text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      {activeScope.rowLabel}
                    </th>
                    <th className="pb-2 text-right text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      {activeCountry.label}
                    </th>
                    <th className="pb-2 text-right text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      Population
                    </th>
                    <th className="pb-2 text-right text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      GDP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupRanked.map((r, i) => (
                    <tr key={r.c.id} className="border-b border-border/40">
                      <td className="py-1.5 text-[11px] font-mono text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-1.5 text-[12px] font-semibold font-sans text-foreground">
                        {r.c.name}
                      </td>
                      <td className="py-1.5 text-[12px] font-mono text-right text-foreground">
                        {activeCountry.format(r.v)}
                      </td>
                      <td className="py-1.5 text-[12px] font-mono text-right text-muted-foreground">
                        {(r.c.population / 1e6).toFixed(1)}M
                      </td>
                      <td className="py-1.5 text-[12px] font-mono text-right text-muted-foreground">
                        ${(r.c.gdp / 1000).toFixed(2)}T
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {groupRanked.length < groupStats.members && (
              <p className="text-[9px] font-sans mt-2 text-muted-foreground">
                {groupStats.members - groupRanked.length}{" "}
                {activeScope.rowLabel === "Member" ? "member" : "country"}
                {groupStats.members - groupRanked.length === 1 ? "" : "s"}{" "}
                {groupStats.members - groupRanked.length === 1 ? "has" : "have"} no
                figure for {activeCountry.label} and{" "}
                {groupStats.members - groupRanked.length === 1 ? "is" : "are"} omitted
                from the ranking.
              </p>
            )}
          </div>
        )}

        {/* ── Continental aggregates ── */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
            Intercontinental comparison
          </p>
          <h2 className="text-sm font-bold font-sans text-foreground mb-4">
            By continent
          </h2>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Continent", "Countries", "Population", "Combined GDP", "Median HDI", "Median life exp."].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`pb-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {continents.map((c) => (
                  <tr key={c.name} className="border-b border-border/40">
                    <td className="py-2 text-[12px] font-semibold font-sans text-foreground">
                      {c.name}
                    </td>
                    <td className="py-2 text-[12px] font-mono text-right text-muted-foreground">
                      {c.countries}
                    </td>
                    <td className="py-2 text-[12px] font-mono text-right text-foreground">
                      {(c.population / 1e6).toFixed(0)}M
                    </td>
                    <td className="py-2 text-[12px] font-mono text-right text-foreground">
                      ${(c.gdp / 1000).toFixed(1)}T
                    </td>
                    <td className="py-2 text-[12px] font-mono text-right text-foreground">
                      {c.medianHdi !== null ? c.medianHdi.toFixed(3) : "—"}
                    </td>
                    <td className="py-2 text-[12px] font-mono text-right text-foreground">
                      {c.medianLife !== null ? `${c.medianLife.toFixed(1)} yrs` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] font-sans mt-3 text-muted-foreground">
            Population and GDP are summed. HDI and life expectancy are medians
            rather than means, because averaging across countries of very
            different size describes no country in particular.
          </p>
        </div>

        {/* ── US map ── */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CountryFlag
                key={focusCode}
                code={focusCode}
                name={focusCode === "US" ? "United States" : focusCountry?.name}
              />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  {focusCode === "US" ? "Albers USA projection" : "Country focus"}
                  {focusCountry?.continent ? ` · ${focusCountry.continent}` : ""}
                </p>
                <h2 className="text-sm font-bold font-sans text-foreground">
                  {focusCode === "US"
                    ? `${activeState.label} by state`
                    : (focusCountry?.name ?? "Select a country")}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {focusCode === "US" && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {stateShading.count} of {usStatesData.length} states
                </span>
              )}
              <StyledSelect
                value={focusCode}
                onValueChange={setFocusCode}
                ariaLabel="Choose which country to map"
                options={focusOptions}
              />
            </div>
          </div>

          <div className={`flex-wrap items-center gap-2 mb-3 ${focusCode === "US" ? "flex" : "hidden"}`}>
            {STATE_INDICATORS.map((i) => (
              <button
                key={i.id}
                onClick={() => setStateMetric(i.id)}
                aria-pressed={stateMetric === i.id}
                className={chip(stateMetric === i.id)}
              >
                {i.label}
              </button>
            ))}
          </div>

          {focusCode === "US" ? (
          <>
          {layerToggles()}

          <ZoomControls
            zoom={zoom}
            onZoom={focusZoom.zoomTo}
            onReset={focusZoom.reset}
            label="United States map"
          >
            {" "}· scroll or +/- to zoom, drag or arrows to pan
          </ZoomControls>
          <svg
            viewBox={focusZoom.viewBox}
            className="w-full h-auto mx-auto"
            style={focusZoom.style}
            {...focusZoom.panProps}
            {...focusZoom.a11yProps}
            role="img"
            aria-label={`United States map shaded by ${activeState.label}`}
          >
            <defs>
              <NoDataHatch id="nodata-us" base={noData} line={noDataHatch} zoom={zoom} />
            </defs>
            {stateShapes.map(({ name, state, d }, i) => {
              const value = state ? activeState.get(state) : null;
              return (
                <path
                  key={i}
                  d={d}
                  fill={colourFor(value, stateShading.breaks) ?? "url(#nodata-us)"}
                  stroke={stroke}
                  strokeWidth={0.5 / zoom}
                  onMouseEnter={() =>
                    setHovered({
                      name: state?.name ?? name,
                      value: value !== null ? activeState.format(value) : "not in dataset",
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* Labels last, so nothing is drawn over them. */}
            {stateLabels.map((l) => (
              <g key={l.abbr} pointerEvents="none">
                {l.leader && (
                  <polyline
                    points={l.leader}
                    fill="none"
                    stroke={isLight ? "rgba(15,23,42,0.35)" : "rgba(255,255,255,0.35)"}
                    strokeWidth={0.75 / zoom}
                  />
                )}
                <text
                  x={l.x}
                  y={l.y}
                  textAnchor={l.outside ? "start" : "middle"}
                  dominantBaseline="middle"
                  className="font-mono"
                  style={{
                    fontSize: (l.outside ? 11 : 12) / zoom,
                    fontWeight: 600,
                    fill: labelInk,
                    stroke: labelHalo,
                    strokeWidth: 3 / zoom,
                    strokeLinejoin: "round",
                    paintOrder: "stroke",
                  }}
                >
                  {l.abbr}
                </text>
              </g>
            ))}
            {overlay.pollution && focusPollution && usOutlineD && (
              <path
                d={usOutlineD}
                fill={overlayInk.pollution}
                fillOpacity={focusPollution.opacity}
                pointerEvents="none"
              />
            )}
                        {/* These are worldwide files. Without clipping they run on across Canada and Mexico, and the map stops being a map of the United States. */}
            <defs>
              {usOutlineD && (
                <clipPath id="clip-us">
                  <path d={usOutlineD} />
                </clipPath>
              )}
            </defs>
            <g clipPath={usOutlineD ? "url(#clip-us)" : undefined}>
              {/* The same overlays as the world map, in this map's own projection and
                  clipped to the country in view. */}
              {overlay.infrastructure && focusOverlays && (
                <g pointerEvents="none">
                  {focusOverlays.roads && (
                    <CasedLine d={focusOverlays.roads} ink={overlayInk.infrastructure} halo={labelHalo} width={0.5} zoom={focusZoom.zoom} opacity={0.75} />
                  )}
                  {focusOverlays.rails && (
                    <CasedLine
                      d={focusOverlays.rails}
                      ink={overlayInk.infrastructure}
                      halo={labelHalo}
                      width={0.55}
                      zoom={focusZoom.zoom}
                      dash={`${2.4 / focusZoom.zoom} ${1.6 / focusZoom.zoom}`}
                    />
                  )}
                </g>
              )}
              {overlay.lakes && focusOverlays?.lakes && (
                <path
                  d={focusOverlays.lakes}
                  fill={overlayInk.lakes}
                  fillOpacity={0.55}
                  stroke={overlayInk.lakes}
                  strokeWidth={0.3 / focusZoom.zoom}
                  pointerEvents="none"
                />
              )}
              {overlay.rivers && focusOverlays?.rivers && (
                <CasedLine d={focusOverlays.rivers} ink={overlayInk.rivers} halo={labelHalo} width={0.7} zoom={focusZoom.zoom} opacity={0.85} />
              )}
              {overlay.mines && focusMarks && (
                <g pointerEvents="none">
                  {focusMarks.mineSolid && (
                    <path
                      d={focusMarks.mineSolid}
                      fill={overlayInk.mines}
                      fillOpacity={focusMarks.mineOpacity}
                      stroke={labelHalo}
                      strokeOpacity={0.55}
                      strokeWidth={0.4 / focusZoom.zoom}
                    />
                  )}
                  {focusMarks.mineHollow && (
                    <>
                      <path
                        d={focusMarks.mineHollow}
                        fill="none"
                        stroke={labelHalo}
                        strokeOpacity={0.55}
                        strokeWidth={(focusMarks.mineRinged ? 1.5 : 0.9) / focusZoom.zoom}
                      />
                      <path
                        d={focusMarks.mineHollow}
                        fill={focusMarks.mineRinged ? "none" : overlayInk.mines}
                        fillOpacity={focusMarks.mineOpacity}
                        stroke={focusMarks.mineRinged ? overlayInk.mines : "none"}
                        strokeWidth={0.7 / focusZoom.zoom}
                      />
                    </>
                  )}
                </g>
              )}
              {overlay.infrastructure && focusMarks?.airports && (
                <path
                  d={focusMarks.airports}
                  fill={overlayInk.infrastructure}
                  fillOpacity={0.95}
                  stroke={labelHalo}
                  strokeWidth={0.35 / focusZoom.zoom}
                  pointerEvents="none"
                />
              )}
              {overlay.ports && focusMarks?.ports && (
                <path
                  d={focusMarks.ports}
                  fill={overlayInk.ports}
                  fillOpacity={0.9}
                  stroke={labelHalo}
                  strokeWidth={0.4 / focusZoom.zoom}
                  pointerEvents="none"
                />
              )}
            </g>
          </svg>

          <Legend
            ramp={ramp}
            noData={noData}
            noDataHatch={noDataHatch}
            lowLabel={activeState.isRank ? "Best rank" : "Lower"}
            highLabel={activeState.isRank ? "Worst rank" : "Higher"}
            hovered={hovered}
          />
          <p className="text-[9px] font-sans mt-2 text-muted-foreground">
            The District of Columbia and the five inhabited territories appear in
            the boundary data but not in the state dataset, so they are drawn
            unshaded.
          </p>
          {layerNotes()}
          </>
          ) : (
            <>
              {/* One country, drawn at its own scale. It is a single outline
                  rather than a shaded set of regions because this project holds
                  no province-level figures for any country but the US — and an
                  invented one would be worse than none. */}
              <div>
                <div>
                  {layerToggles()}

                  <ZoomControls
                    zoom={zoom}
                    onZoom={focusZoom.zoomTo}
                    onReset={focusZoom.reset}
                    label={`${focusCountry?.name ?? "country"} map`}
                  >
                    {" "}· {focusLabels.inside.length} of {focusLabels.total} names
                    shown · scroll or +/- to zoom
                  </ZoomControls>

                  {/* Map and territories side by side on a wide screen, the
                      territories dropping underneath when there is no room. */}
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <svg
                    viewBox={focusZoom.viewBox}
                    className="w-full h-auto mx-auto md:mx-0 md:flex-1 md:min-w-0"
                    style={focusZoom.style}
                    {...focusZoom.panProps}
                    {...focusZoom.a11yProps}
                    role="img"
                    aria-label={`Outline map of ${focusCountry?.name ?? "the selected country"}${
                      focusMap && focusMap.parts.length > 1
                        ? `, showing ${focusMap.parts.length} internal divisions`
                        : ""
                    }`}
                  >
                    {focusMap && (
                      <>
                        {/* The fill and the coast, from the merged arcs. */}
                        <path
                          d={focusMap.outline}
                          fill={ramp[3]}
                          stroke={stroke}
                          strokeWidth={1 / zoom}
                          strokeLinejoin="round"
                        />

                        {/* Hit targets: one invisible shape per division, so
                            every name is discoverable on hover even when it is
                            too small to carry a label. */}
                        {focusMap.parts.map((sd, i) => (
                          <path
                            key={`hit-${sd.n}-${i}`}
                            d={sd.d}
                            fill="transparent"
                            stroke="none"
                          >
                            <title>{sd.n || "Unnamed division"}</title>
                          </path>
                        ))}

                        {/* Internal borders as a single mesh, so a shared
                            border is one stroke rather than two stacked on
                            each other — that is what used to make internal
                            lines read heavier than the coast. Unshaded: this
                            project has no per-division figures outside the US,
                            and a colour here would imply one. */}
                        {focusMap.interior && (
                          <path
                            d={focusMap.interior}
                            fill="none"
                            stroke={stroke}
                            strokeWidth={0.6 / zoom}
                            strokeOpacity={0.75}
                            strokeLinejoin="round"
                            pointerEvents="none"
                          />
                        )}

                        {/* The coast again, over the mesh, so the outline stays
                            the crispest line on the map. */}
                        <path
                          d={focusMap.outline}
                          fill="none"
                          stroke={stroke}
                          strokeWidth={1 / zoom}
                          strokeLinejoin="round"
                          pointerEvents="none"
                        />
                      </>
                    )}

                    {/* Names that fit inside their own division and clash with
                        no name already placed. Zooming in makes room for more. */}
                    {focusLabels.inside.map((sd, i) => (
                      <text
                        key={`in-${sd.n}-${i}`}
                        x={sd.cx}
                        y={sd.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        className="font-mono"
                        style={{
                          fontSize: 9 / zoom,
                          fontWeight: 600,
                          fill: labelInk,
                          stroke: labelHalo,
                          strokeWidth: 2.2 / zoom,
                          strokeLinejoin: "round",
                          paintOrder: "stroke",
                        }}
                      >
                        {sd.n}
                      </text>
                    ))}
                    {overlay.pollution && focusPollution && focusMap?.outline && (
                      <path
                        d={focusMap?.outline}
                        fill={overlayInk.pollution}
                        fillOpacity={focusPollution.opacity}
                        pointerEvents="none"
                      />
                    )}
                                        {/* Clipped to the country itself, so a road or a river stops at the border instead of running on through its neighbours. */}
                    <defs>
                      {focusMap?.outline && (
                        <clipPath id="clip-focus-country">
                          <path d={focusMap?.outline} />
                        </clipPath>
                      )}
                    </defs>
                    <g clipPath={focusMap?.outline ? "url(#clip-focus-country)" : undefined}>
                      {/* The same overlays as the world map, in this map's own projection and
                          clipped to the country in view. */}
                      {overlay.infrastructure && focusOverlays && (
                        <g pointerEvents="none">
                          {focusOverlays.roads && (
                            <CasedLine d={focusOverlays.roads} ink={overlayInk.infrastructure} halo={labelHalo} width={0.5} zoom={focusZoom.zoom} opacity={0.75} />
                          )}
                          {focusOverlays.rails && (
                            <CasedLine
                              d={focusOverlays.rails}
                              ink={overlayInk.infrastructure}
                              halo={labelHalo}
                              width={0.55}
                              zoom={focusZoom.zoom}
                              dash={`${2.4 / focusZoom.zoom} ${1.6 / focusZoom.zoom}`}
                            />
                          )}
                        </g>
                      )}
                      {overlay.lakes && focusOverlays?.lakes && (
                        <path
                          d={focusOverlays.lakes}
                          fill={overlayInk.lakes}
                          fillOpacity={0.55}
                          stroke={overlayInk.lakes}
                          strokeWidth={0.3 / focusZoom.zoom}
                          pointerEvents="none"
                        />
                      )}
                      {overlay.rivers && focusOverlays?.rivers && (
                        <CasedLine d={focusOverlays.rivers} ink={overlayInk.rivers} halo={labelHalo} width={0.7} zoom={focusZoom.zoom} opacity={0.85} />
                      )}
                      {overlay.mines && focusMarks && (
                        <g pointerEvents="none">
                          {focusMarks.mineSolid && (
                            <path
                              d={focusMarks.mineSolid}
                              fill={overlayInk.mines}
                              fillOpacity={focusMarks.mineOpacity}
                              stroke={labelHalo}
                              strokeOpacity={0.55}
                              strokeWidth={0.4 / focusZoom.zoom}
                            />
                          )}
                          {focusMarks.mineHollow && (
                            <>
                              <path
                                d={focusMarks.mineHollow}
                                fill="none"
                                stroke={labelHalo}
                                strokeOpacity={0.55}
                                strokeWidth={(focusMarks.mineRinged ? 1.5 : 0.9) / focusZoom.zoom}
                              />
                              <path
                                d={focusMarks.mineHollow}
                                fill={focusMarks.mineRinged ? "none" : overlayInk.mines}
                                fillOpacity={focusMarks.mineOpacity}
                                stroke={focusMarks.mineRinged ? overlayInk.mines : "none"}
                                strokeWidth={0.7 / focusZoom.zoom}
                              />
                            </>
                          )}
                        </g>
                      )}
                      {overlay.infrastructure && focusMarks?.airports && (
                        <path
                          d={focusMarks.airports}
                          fill={overlayInk.infrastructure}
                          fillOpacity={0.95}
                          stroke={labelHalo}
                          strokeWidth={0.35 / focusZoom.zoom}
                          pointerEvents="none"
                        />
                      )}
                      {overlay.ports && focusMarks?.ports && (
                        <path
                          d={focusMarks.ports}
                          fill={overlayInk.ports}
                          fillOpacity={0.9}
                          stroke={labelHalo}
                          strokeWidth={0.4 / focusZoom.zoom}
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  </svg>

                  {focusMap && focusMap.insets.length > 0 && (
                    <div
                      className="flex flex-row md:flex-col flex-wrap gap-2 md:w-[104px] md:shrink-0"
                      role="group"
                      aria-label="Territories shown separately, each at its own scale"
                    >
                      {focusMap.insets.map((ins) => (
                        <div key={ins.key} className="w-[92px] md:w-full">
                          <svg
                            viewBox={`0 0 ${INSET_SIZE} ${INSET_SIZE}`}
                            className="w-full h-auto rounded-lg"
                            style={{
                              background: isLight
                                ? "rgba(0,0,0,0.025)"
                                : "rgba(255,255,255,0.04)",
                            }}
                            role="img"
                            aria-label={`${ins.name}, drawn at its own scale`}
                          >
                            <path
                              d={ins.d}
                              fill={ramp[3]}
                              stroke={stroke}
                              strokeWidth={0.8}
                              strokeLinejoin="round"
                            />
                            {ins.interior && (
                              <path
                                d={ins.interior}
                                fill="none"
                                stroke={stroke}
                                strokeWidth={0.5}
                                strokeOpacity={0.75}
                              />
                            )}
                          </svg>
                          <p className="mt-0.5 text-[9px] font-sans leading-tight text-muted-foreground text-center">
                            {ins.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>

                {layerNotes()}

                {/* Attached to the map: same panel, directly beneath it. */}
                <div className="mt-3 border-t border-border/60 pt-3">
                  <button
                    onClick={() => setFactsOpen((v) => !v)}
                    aria-expanded={factsOpen}
                    aria-controls="focus-country-details"
                    className="flex items-center gap-1.5 w-full text-left px-1 py-1 rounded text-[11px] font-medium font-sans text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <CaretDown
                      size={11}
                      weight="bold"
                      className={`transition-transform duration-200 ${factsOpen ? "" : "-rotate-90"}`}
                    />
                    {focusCountry?.name ?? "Country"} details
                  </button>

                  {factsOpen && (
                    <div id="focus-country-details">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {focusCountry &&
                    [
                      ["Capital", focusCountry.capital],
                      ["Government", focusCountry.governmentType],
                      ["Population", `${(focusCountry.population / 1e6).toFixed(1)}M`],
                      ["GDP", `$${(focusCountry.gdp / 1000).toFixed(2)}T`],
                      ["GDP per capita", `$${Math.round(focusCountry.gdpPerCapita).toLocaleString()}`],
                      ["GDP growth", `${focusCountry.gdpGrowth > 0 ? "+" : ""}${focusCountry.gdpGrowth}%`],
                      ["Life expectancy", `${focusCountry.lifeExpectancy} yrs`],
                      ["Human development", focusCountry.humanDevelopmentIndex.toFixed(3)],
                      ["Unemployment", `${focusCountry.unemploymentRate}%`],
                      ["Inflation", `${focusCountry.inflationRate}%`],
                      ["Area", `${(focusCountry.areaKm2 / 1e6).toFixed(2)}M km²`],
                      ["Currency", focusCountry.currency],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-1.5"
                        style={{
                          background: isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.04)",
                          border: isLight
                            ? "1px solid rgba(0,0,0,0.06)"
                            : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span className="text-[10px] font-sans text-muted-foreground">{k}</span>
                        <span className="text-[12px] font-mono font-semibold text-foreground text-right">
                          {v}
                        </span>
                      </div>
                    ))}
                      </div>

                      {/* Names the map could not carry legibly. They are listed
                          rather than dragged out on leader lines: a column of
                          86 of them ran off the bottom of the canvas, and every
                          one of these is still on the map under the pointer. */}
                      {focusLabels.unlabelled.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                            {focusLabels.unlabelled.length} more division
                            {focusLabels.unlabelled.length === 1 ? "" : "s"} — too
                            small to label at {zoom.toFixed(1)}×
                            {zoom < ZOOM_MAX ? "; zoom in to place more" : ""}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {focusLabels.unlabelled.map((n, i) => (
                              <span
                                key={`${n}-${i}`}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {focusMap && focusMap.offView.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                            {focusMap.offView.length} division
                            {focusMap.offView.length === 1 ? "" : "s"} outside
                            this view
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {focusMap.offView.map((n, i) => (
                              <span
                                key={`off-${n}-${i}`}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {focusCities.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/40">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Cities in this dataset
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {focusCities.map((c) => (
                      <span
                        key={c.id}
                        className="px-3 py-1 rounded-full text-[11px] font-sans border border-border text-muted-foreground"
                      >
                        {c.name}{" "}
                        <span className="font-mono">
                          {(c.population / 1e6).toFixed(1)}M
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[9px] font-sans mt-3 pt-3 border-t border-border/40 text-muted-foreground">
                {bordersNote}
                Subdivisions are outlined but never shaded: this project holds
                state-level figures for the US and none for any other country's
                provinces, and a colour here would imply a number that does not
                exist.
              </p>
            </>
          )}
        </div>

        {/* ── Sources ── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Sources
          </p>
          <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">
            Country outlines: Natural Earth (public domain) via world-atlas.
            Internal subdivision borders: Natural Earth 1:10m admin-1, 4,596
            first-order divisions across 241 countries. The world map draws the
            internal borders of all 194 countries that have any, simplified to
            within 0.02° — under half a pixel at the deepest zoom; the country
            focus map fetches one country at full detail. US states: the US Census
            Bureau via us-atlas. Group scopes: G7 and G20 membership as those
            groups publish it; Global North and South follow the UN M49 developed /
            developing classification, which UNSD states is for statistical
            convenience rather than a judgement about development. Indicators:
            CommonSphere's own country and state datasets, which draw on the
            World Bank, IMF, UN agencies and national statistical offices —
            each page carries the source for the figures it shows. Nothing on
            this page is estimated or interpolated: a country without a figure
            is drawn unshaded.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Ramp legend, plus a live readout so the hovered value is text, not colour. */
function Legend({
  ramp,
  noData,
  noDataHatch,
  lowLabel,
  highLabel,
  extra,
  hovered,
}: {
  ramp: string[];
  noData: string;
  /** Hatch line colour, so the swatch matches the map's "no figure" fill. */
  noDataHatch: string;
  lowLabel: string;
  highLabel: string;
  /** A further tone to name, e.g. countries outside the selected scope. */
  extra?: { colour: string; label: string };
  hovered: { name: string; value: string } | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-border/40 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-sans text-muted-foreground">{lowLabel}</span>
        <div className="flex rounded-full overflow-hidden">
          {ramp.map((c) => (
            <span key={c} className="w-7 h-2.5" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] font-sans text-muted-foreground">{highLabel}</span>
        <span className="flex items-center gap-1.5 ml-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block border border-border"
            style={{
              background: `repeating-linear-gradient(45deg, ${noDataHatch} 0 1.5px, ${noData} 1.5px 4px)`,
            }}
          />
          <span className="text-[10px] font-sans text-muted-foreground">No data</span>
        </span>
        {extra && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border border-border"
              style={{ background: extra.colour }}
            />
            <span className="text-[10px] font-sans text-muted-foreground">
              {extra.label}
            </span>
          </span>
        )}
      </div>
      {/* Reserved height, so the layout does not jump as the pointer moves. */}
      <div className="min-h-[18px]" aria-live="polite">
        {hovered && (
          <span className="text-[11px] font-sans text-foreground">
            {hovered.name}{" "}
            <span className="font-mono text-muted-foreground">· {hovered.value}</span>
          </span>
        )}
      </div>
    </div>
  );
}
