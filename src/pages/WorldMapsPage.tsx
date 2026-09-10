import React, { useMemo, useState, useEffect } from "react";
import { geoEqualEarth, geoAlbersUsa, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import statesTopo from "us-atlas/states-10m.json";
import { GlobeHemisphereWest, MapTrifold, Info } from "@phosphor-icons/react";
import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";
import {
  countryForFeature,
  stateForFeature,
  auditMapJoin,
} from "../data/mapJoin";
import { useTheme } from "../contexts/ThemeContext";
import { isG20, g20Countries, G20_UNION_MEMBERS } from "../data/g20";
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
const RAMP_LIGHT = ["#60c860", "#28a883", "#26838e", "#355f8d", "#45347e", "#440154"];
const RAMP_DARK = ["#404286", "#2e6e8e", "#21958b", "#3cba75", "#96d73f", "#fde725"];

/**
 * Readable label colour for a given fill.
 *
 * The spectrum runs from deep purple to bright yellow-green, so a fixed label
 * colour is unreadable at one end or the other. This scores the two candidates
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
  /** Higher is better, which decides which end of the ramp reads as "good". */
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
  /** Ranks run 1 = best, so they are inverted for colouring, not for display. */
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

  const ramp = isLight ? RAMP_LIGHT : RAMP_DARK;
  const noData = isLight ? "#e8eaed" : "#24242c";
  // Deliberately different from noData: "not selected" and "no figure" are not
  // the same statement, and the legend names both.
  const outOfScope = isLight ? "#f4f5f7" : "#191920";
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
  const WORLD_W = 960;
  const WORLD_H = 480;
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

  const US_W = 960;
  const US_H = 560;
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

  const colourFor = (value: number | null, breaks: number[], higherIsBetter: boolean) => {
    if (value === null || !Number.isFinite(value)) return noData;
    let idx = 0;
    while (idx < breaks.length && value >= breaks[idx]) idx++;
    // A low unemployment rate is a good outcome, so the ramp is read backwards
    // for indicators where less is better. The legend flips with it.
    return ramp[higherIsBetter ? idx : ramp.length - 1 - idx];
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
  // ISO codes Natural Earth ships subdivisions for at 1:50m.
  const ADMIN1_COUNTRIES = useMemo(
    () => new Set(["RU", "US", "IN", "ID", "CN", "BR", "CA", "AU", "ZA"]),
    [],
  );

  const [admin1, setAdmin1] = useState<{
    features: { properties: { c: string; n: string } }[];
  } | null>(null);

  useEffect(() => {
    if (focusCode === "US" || !ADMIN1_COUNTRIES.has(focusCode) || admin1) return;
    let cancelled = false;
    import("../data/geo/admin1.topo.json")
      .then((mod) => {
        if (cancelled) return;
        const topo = (mod.default ?? mod) as unknown as Topology;
        const key = Object.keys(topo.objects)[0];
        setAdmin1(
          feature(topo, topo.objects[key] as never) as unknown as {
            features: { properties: { c: string; n: string } }[];
          },
        );
      })
      .catch(() => {
        // The outline still draws; only the internal borders are lost.
      });
    return () => {
      cancelled = true;
    };
  }, [focusCode, admin1, ADMIN1_COUNTRIES]);

  // Loaded lazily: 110m is too coarse once zoomed to a single country.
  const [detailWorld, setDetailWorld] = useState<{
    features: { properties: { name: string } }[];
  } | null>(null);

  useEffect(() => {
    if (focusCode === "US" || detailWorld) return;
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
  }, [focusCode, detailWorld]);

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

  const focusGeo = useMemo(() => {
    if (focusCode === "US") return null; // the US keeps its state-level map
    const f = featureByCode.get(focusCode);
    if (!f) return null;
    const projection = geoEqualEarth().fitExtent(
      [
        [24, 24],
        [US_W - 24, US_H - 24],
      ],
      f as never,
    );
    return { d: geoPath(projection)(f as never) ?? "", feature: f };
  }, [focusCode, featureByCode]);

  /** Subdivision outlines for the focused country, if any are published. */
  const focusSubdivisions = useMemo(() => {
    if (focusCode === "US" || !focusGeo || !admin1) return [];
    const projection = geoEqualEarth().fitExtent(
      [
        [24, 24],
        [US_W - 24, US_H - 24],
      ],
      focusGeo.feature as never,
    );
    const path = geoPath(projection);
    return admin1.features
      .filter((f) => f.properties.c === focusCode)
      .map((f) => ({ n: f.properties.n, d: path(f as never) ?? "" }))
      .filter((f) => f.d.length > 0);
  }, [focusCode, focusGeo, admin1]);

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
      const fill = colourFor(value, stateShading.breaks, activeState.higherIsBetter);
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
            Equal-area maps of {countriesData.length} countries and{" "}
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

          <svg
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            className="w-full h-auto"
            role="img"
            aria-label={`World map shaded by ${activeCountry.label}`}
          >
            {/* Graticule first, so borders sit above it. */}
            <path
              d={worldPath.path(geoGraticule10()) ?? undefined}
              fill="none"
              stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
              strokeWidth={0.5}
            />
            {world.features.map((f, i) => {
              const country = countryForFeature(f.properties.name);
              const outside = scope === "g20" && country !== null && !isG20(country);
              const value = country && !outside ? activeCountry.get(country) : null;
              return (
                <path
                  key={i}
                  d={worldPath.path(f as never) ?? undefined}
                  fill={
                    outside
                      ? outOfScope
                      : colourFor(value, countryShading.breaks, activeCountry.higherIsBetter)
                  }
                  stroke={stroke}
                  strokeWidth={0.3}
                  onMouseEnter={() =>
                    setHovered({
                      name: country?.name ?? f.properties.name,
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
          </svg>

          <Legend
            ramp={ramp}
            noData={noData}
            lowLabel="Lower"
            highLabel="Higher"
            higherIsBetter={activeCountry.higherIsBetter}
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
          <svg
            viewBox={`0 0 ${US_W} ${US_H}`}
            className="w-full h-auto"
            role="img"
            aria-label={`United States map shaded by ${activeState.label}`}
          >
            {states.features.map((f, i) => {
              const state = stateForFeature(f.properties.name);
              const value = state ? activeState.get(state) : null;
              return (
                <path
                  key={i}
                  d={statePath(f as never) ?? undefined}
                  fill={colourFor(value, stateShading.breaks, activeState.higherIsBetter)}
                  stroke={stroke}
                  strokeWidth={0.5}
                  onMouseEnter={() =>
                    setHovered({
                      name: state?.name ?? f.properties.name,
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
                    strokeWidth={0.75}
                  />
                )}
                <text
                  x={l.x}
                  y={l.y}
                  textAnchor={l.outside ? "start" : "middle"}
                  dominantBaseline="middle"
                  className="font-mono"
                  style={{
                    fontSize: l.outside ? 11 : 12,
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
            lowLabel={activeState.isRank ? "Best rank" : "Lower"}
            highLabel={activeState.isRank ? "Worst rank" : "Higher"}
            higherIsBetter={activeState.higherIsBetter}
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
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                <div className="lg:col-span-3">
                  <svg
                    viewBox={`0 0 ${US_W} ${US_H}`}
                    className="w-full h-auto"
                    role="img"
                    aria-label={`Outline map of ${focusCountry?.name ?? "the selected country"}`}
                  >
                    {focusGeo && (
                      <path
                        d={focusGeo.d}
                        fill={ramp[3]}
                        stroke={stroke}
                        strokeWidth={0.8}
                      />
                    )}
                    {/* Internal borders drawn over the fill, unshaded: this
                        project has no per-subdivision figures for any country
                        but the US, and a colour here would imply one. */}
                    {focusSubdivisions.map((sd) => (
                      <path
                        key={sd.n}
                        d={sd.d}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={0.5}
                        strokeOpacity={0.8}
                      >
                        <title>{sd.n}</title>
                      </path>
                    ))}
                  </svg>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-2">
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
                {ADMIN1_COUNTRIES.has(focusCode)
                  ? `Internal borders shown are ${focusSubdivisions.length} first-order divisions from Natural Earth. `
                  : "Natural Earth publishes first-order divisions at this resolution for nine countries only — Russia, the United States, India, Indonesia, China, Brazil, Canada, Australia and South Africa — so this country is drawn as a single outline. "}
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
            Country and state boundaries: Natural Earth (public domain) via
            world-atlas, and the US Census Bureau via us-atlas. Indicators:
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
  lowLabel,
  highLabel,
  higherIsBetter,
  extra,
  hovered,
}: {
  ramp: string[];
  noData: string;
  lowLabel: string;
  highLabel: string;
  /** Mirrors how the map reads the ramp, so the two cannot disagree. */
  higherIsBetter: boolean;
  /** A further tone to name, e.g. countries outside the selected scope. */
  extra?: { colour: string; label: string };
  hovered: { name: string; value: string } | null;
}) {
  const shown = higherIsBetter ? ramp : [...ramp].reverse();
  return (
    <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-border/40 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-sans text-muted-foreground">{lowLabel}</span>
        <div className="flex rounded-full overflow-hidden">
          {shown.map((c) => (
            <span key={c} className="w-7 h-2.5" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] font-sans text-muted-foreground">{highLabel}</span>
        <span className="flex items-center gap-1.5 ml-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block border border-border"
            style={{ background: noData }}
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
