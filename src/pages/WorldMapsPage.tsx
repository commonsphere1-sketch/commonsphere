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

/* Zoom bounds. 1 fits the country to the canvas; 8 is where the 1:10m arcs
   start to show their own quantisation, so there is nothing further to see. */
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.6;

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
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: width / 2, y: height / 2 });
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(
    null,
  );

  const reset = useCallback(() => {
    setZoom(1);
    setCenter({ x: width / 2, y: height / 2 });
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

  const zoomTo = useCallback(
    (k: number) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k));
      setZoom(next);
      setCenter((c) => clamp(c.x, c.y, next));
    },
    [clamp],
  );

  const endPan = () => {
    drag.current = null;
  };

  const panProps = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      if (zoom === 1) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { px: e.clientX, py: e.clientY, cx: center.x, cy: center.y };
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current;
      if (!d) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0) return;
      // Canvas units travelled per device pixel at this zoom.
      const perPx = width / zoom / rect.width;
      setCenter(
        clamp(
          d.cx - (e.clientX - d.px) * perPx,
          d.cy - (e.clientY - d.py) * perPx,
          zoom,
        ),
      );
    },
    onPointerUp: endPan,
    onPointerCancel: endPan,
  };

  const style: React.CSSProperties = {
    cursor: zoom > 1 ? "grab" : "default",
    touchAction: zoom > 1 ? "none" : "auto",
  };

  const viewBox = `${center.x - width / (2 * zoom)} ${
    center.y - height / (2 * zoom)
  } ${width / zoom} ${height / zoom}`;

  return { zoom, zoomTo, reset, viewBox, panProps, style };
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

/**
 * Readable label colour for a given fill.
 *
 * The ramp runs from black to light grey, so a fixed label colour is
 * unreadable at one end or the other. This scores the two candidates
 * against the fill actually rendered and takes the better.
 */
function labelInkFor(fill: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(fill);
  if (!m) return "#000000";
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  const ratio = (a: number, b: number) =>
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return ratio(lum, 0) >= ratio(lum, 1) ? "#0b0b0b" : "#ffffff";
}

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
  const [hovered, setHovered] = useState<{ name: string; value: string } | null>(null);
  const [scope, setScope] = useState<"all" | "g20">("all");
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
  const stroke = isLight ? "#ffffff" : "#15151d";
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

  /* ── Country shading ── */
  const activeCountry = COUNTRY_INDICATORS.find((i) => i.id === countryMetric)!;
  const inScope = scope === "g20" ? g20Countries : countriesData;
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
  const g20Stats = useMemo(() => {
    const sum = (list: Country[], f: (c: Country) => number) =>
      list.reduce((a, c) => a + (f(c) || 0), 0);
    const worldPop = sum(countriesData, (c) => c.population);
    const worldGdp = sum(countriesData, (c) => c.gdp);
    const pop = sum(g20Countries, (c) => c.population);
    const gdp = sum(g20Countries, (c) => c.gdp);
    return {
      members: g20Countries.length,
      pop,
      gdp,
      popShare: worldPop ? (pop / worldPop) * 100 : 0,
      gdpShare: worldGdp ? (gdp / worldGdp) * 100 : 0,
    };
  }, []);

  /* Members ranked by whatever indicator the map is showing. */
  const g20Ranked = useMemo(
    () =>
      g20Countries
        .map((c) => ({ c, v: activeCountry.get(c) }))
        .filter((r): r is { c: Country; v: number } => r.v !== null && Number.isFinite(r.v))
        .sort((a, b) => (activeCountry.higherIsBetter ? b.v - a.v : a.v - b.v)),
    [activeCountry],
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
      worldDrawn.features.map((f) => ({
        name: f.properties.name,
        country: countryForFeature(f.properties.name),
        d: worldPath.path(f as never) ?? undefined,
      })),
    [worldDrawn, worldPath],
  );
  /* Drawn only inside the countries in scope: in G20 mode the others are a
     plain "not selected" fill, and lines across them would read as data. */
  const admin1BordersD = useMemo(() => {
    if (!admin1Borders) return undefined;
    const g20 = new Set<string>(G20_MEMBER_CODES);
    const features =
      scope === "g20"
        ? admin1Borders.features.filter((f) => g20.has(f.properties.c))
        : admin1Borders.features;
    return worldPath.path({ type: "FeatureCollection", features } as never) ?? undefined;
  }, [admin1Borders, worldPath, scope]);
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
    };
  }, [focusCode, featureByCode, admin1]);

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
      abbr: string; x: number; y: number; fill: string;
      outside: false; leader: null;
    }[] = [];
    const tooSmall: { abbr: string; cx: number; cy: number; fill: string }[] = [];

    for (const f of states.features) {
      const state = stateForFeature(f.properties.name);
      if (!state) continue; // DC and the territories carry no dataset row
      const value = activeState.get(state);
      // Label ink is scored against a flat colour, so a hatched state uses its base.
      const fill = colourFor(value, stateShading.breaks) ?? noData;
      const [cx, cy] = statePath.centroid(f as never);
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
      const [[x0, y0], [x1, y1]] = statePath.bounds(f as never);
      // Two characters at 12px need roughly this much room.
      const fits = x1 - x0 >= 22 && y1 - y0 >= 14;
      if (fits) inside.push({ abbr: state.abbreviation, x: cx, y: cy, fill, outside: false, leader: null });
      else tooSmall.push({ abbr: state.abbreviation, cx, cy, fill });
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
          fill: t.fill,
          outside: true as const,
          leader: `${t.cx},${t.cy} ${COL_X - 10},${y} ${COL_X - 4},${y}`,
        };
      });

    return [...inside, ...outside];
  }, [states, statePath, activeState, stateShading.breaks]);

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

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
      active
        ? "bg-secondary/20 text-secondary border-secondary/40"
        : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
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
              {countryShading.count} of {inScope.length}{" "}
              {scope === "g20" ? "G20 states" : "countries"} have this figure
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              onClick={() => setScope("all")}
              aria-pressed={scope === "all"}
              className={chip(scope === "all")}
            >
              All countries
            </button>
            <button
              onClick={() => setScope("g20")}
              aria-pressed={scope === "g20"}
              className={chip(scope === "g20")}
            >
              G20 only
            </button>
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

          <ZoomControls
            zoom={worldZoom.zoom}
            onZoom={worldZoom.zoomTo}
            onReset={worldZoom.reset}
            label="world map"
          />
          <svg
            viewBox={worldZoom.viewBox}
            className="w-full h-auto"
            style={worldZoom.style}
            {...worldZoom.panProps}
            role="img"
            aria-label={`World map shaded by ${activeCountry.label}`}
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
            {worldShapes.map(({ name, country, d }, i) => {
              const outside = scope === "g20" && country !== null && !isG20(country);
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
                        ? "not a G20 member"
                        : value !== null
                          ? activeCountry.format(value)
                          : "no data",
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
          </svg>

          <Legend
            ramp={ramp}
            noData={noData}
            noDataHatch={noDataHatch}
            lowLabel="Lower"
            highLabel="Higher"
            extra={
              scope === "g20"
                ? { colour: outOfScope, label: "Not a G20 member" }
                : undefined
            }
            hovered={hovered}
          />
        </div>

        {/* ── G20 figures, only while that scope is selected ── */}
        {scope === "g20" && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
              Group of Twenty
            </p>
            <h2 className="text-sm font-bold font-sans text-foreground mb-1">
              {g20Stats.members} member states
            </h2>
            <p className="text-[11px] font-sans text-muted-foreground mb-4">
              The G20 has 21 members. The {g20Stats.members} states below are
              mapped; the other two — the{" "}
              {G20_UNION_MEMBERS.join(" and the ")} — are unions rather than
              countries, so they have no country row and no share of their own
              here. The African Union joined in 2023.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Combined population", value: `${(g20Stats.pop / 1e9).toFixed(2)}B` },
                { label: "Share of world population", value: `${g20Stats.popShare.toFixed(1)}%` },
                { label: "Combined GDP", value: `$${(g20Stats.gdp / 1000).toFixed(1)}T` },
                { label: "Share of world GDP", value: `${g20Stats.gdpShare.toFixed(1)}%` },
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
              Members by {activeCountry.label}
            </p>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      #
                    </th>
                    <th className="pb-2 text-left text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      Member
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
                  {g20Ranked.map((r, i) => (
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
            {g20Ranked.length < g20Stats.members && (
              <p className="text-[9px] font-sans mt-2 text-muted-foreground">
                {g20Stats.members - g20Ranked.length} member
                {g20Stats.members - g20Ranked.length === 1 ? "" : "s"} have no
                figure for {activeCountry.label} and are omitted from the ranking.
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
              <MapTrifold size={16} weight="fill" className="text-secondary" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">
                  {focusCode === "US" ? "Albers USA projection" : "Country focus"}
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
          <ZoomControls
            zoom={zoom}
            onZoom={focusZoom.zoomTo}
            onReset={focusZoom.reset}
            label="United States map"
          />
          <svg
            viewBox={focusZoom.viewBox}
            className="w-full h-auto"
            style={focusZoom.style}
            {...focusZoom.panProps}
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
                    fill: l.outside
                      ? isLight
                        ? "#0f172a"
                        : "#f1f0ff"
                      : labelInkFor(l.fill),
                  }}
                >
                  {l.abbr}
                </text>
              </g>
            ))}
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
          </>
          ) : (
            <>
              {/* One country, drawn at its own scale. It is a single outline
                  rather than a shaded set of regions because this project holds
                  no province-level figures for any country but the US — and an
                  invented one would be worse than none. */}
              <div>
                <div>
                  <ZoomControls
                    zoom={zoom}
                    onZoom={focusZoom.zoomTo}
                    onReset={focusZoom.reset}
                    label={`${focusCountry?.name ?? "country"} map`}
                  >
                    {" "}· {focusLabels.inside.length} of {focusLabels.total} names shown
                  </ZoomControls>

                  {/* Map and territories side by side on a wide screen, the
                      territories dropping underneath when there is no room. */}
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <svg
                    viewBox={focusZoom.viewBox}
                    className="w-full h-auto md:flex-1 md:min-w-0"
                    style={focusZoom.style}
                    {...focusZoom.panProps}
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
                          fill: labelInkFor(ramp[3]),
                        }}
                      >
                        {sd.n}
                      </text>
                    ))}
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
            Bureau via us-atlas. Indicators:
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
