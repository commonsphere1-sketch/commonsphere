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

  const ramp = isLight ? RAMP_LIGHT : RAMP_DARK;
  const noData = isLight ? "#e8eaed" : "#24242c";
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
  const countryShading = useMemo(() => {
    const values = countriesData
      .map((c) => activeCountry.get(c))
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const breaks = quantileBreaks(values, ramp.length);
    return { breaks, min: Math.min(...values), max: Math.max(...values), count: values.length };
  }, [activeCountry, ramp.length]);

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
              {countryShading.count} of {countriesData.length} countries have this figure
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
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
              const value = country ? activeCountry.get(country) : null;
              return (
                <path
                  key={i}
                  d={worldPath.path(f as never) ?? undefined}
                  fill={colourFor(value, countryShading.breaks, activeCountry.higherIsBetter)}
                  stroke={stroke}
                  strokeWidth={0.3}
                  onMouseEnter={() =>
                    setHovered({
                      name: country?.name ?? f.properties.name,
                      value: value !== null ? activeCountry.format(value) : "no data",
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
            hovered={hovered}
          />
        </div>

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
                  Albers USA projection
                </p>
                <h2 className="text-sm font-bold font-sans text-foreground">
                  {activeState.label} by state
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {stateShading.count} of {usStatesData.length} states
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
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
  hovered,
}: {
  ramp: string[];
  noData: string;
  lowLabel: string;
  highLabel: string;
  /** Mirrors how the map reads the ramp, so the two cannot disagree. */
  higherIsBetter: boolean;
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
