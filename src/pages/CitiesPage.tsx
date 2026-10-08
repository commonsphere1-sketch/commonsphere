/**
 * The Cities page: each city as the United Nations measures it.
 *
 * Every figure here was typed in - populations, GDP, "indices" of cost of
 * living, crime, safety and air quality, a tourism rank, five years of
 * "trends", eighteen "urban statistics" a city - and credited to two rankings
 * that publish none of them as given. A Laws tab showed every city the same
 * six placeholder ordinances, because the laws written for eight cities were
 * filed under ids no city on the page has.
 *
 * The page is built on data/cityFigures.ts instead: the UN's World
 * Urbanization Prospects (2025 Revision), which draws every city on Earth by
 * one rule and gives its population, land area and built-up area year by year
 * from 1975, with its own projections to 2050. Beside it, where Wikidata has a
 * referenced figure, the population inside the city's own boundary. What no
 * body publishes for every city alike is not shown.
 */
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CITY_PLACES } from "../data/cityPlaces";
import { ECONOMY_OF } from "../data/placeIndex";
import { ECONOMY_INDICATORS, ECONOMY_INDICATORS_SOURCE } from "../data/economyIndicators";
import {
  MapPin,
  ListBullets,
  MapTrifold,
  DownloadSimple,
  ArrowsIn,
  ArrowsOut,
  ClockCounterClockwise,
  Star,
  X,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { citiesData, type City } from "../data/citiesData";
import { CITY_FIGURES, CITY_FIGURES_SOURCE, type CityFigures } from "../data/cityFigures";
import { CITY_YEARS, cityYear, cityFirstYear, cityGrowth, type CityYear } from "../lib/cityFigures";
import { ArticlePanel } from "../components/HistoryPanel";
import { ACCENT, ChartNote } from "../components/ModalCharts";
import { useTheme } from "../contexts/ThemeContext";
import { HeadlinesBanner, namesTag, type Headline, type Shown } from "../components/HeadlinesBanner";
import { nameMatcher } from "../lib/namesInText";
import { SourceLink } from "../components/SourceLink";
import { SeeAlso } from "../components/SeeAlso";
import { useFollowedCities } from "../lib/followedCities";
import { FilterBar } from "../components/FilterBar";
import { TONE, CHIP_TEXT } from "@/lib/chipTone";

/* Water, energy, transport, safety, business and the economy for the city's country. Loaded when a window opens:
   the figures it reads are the Countries page's, and large. */
const CountryQuality = lazy(() => import("../components/CountryQuality"));
const Universities = lazy(() => import("../components/Universities"));
/** Every city the United Nations counts, under the profiled ones: loaded when the page reaches it, with its list of some twelve thousand. */
const AllCities = lazy(() => import("../components/AllCities"));

const SRC = CITY_FIGURES_SOURCE;
/** The last year of the UN's estimates; the years after are its projections. */
const BASE = SRC.baseYear;
const LAST = SRC.lastYear;
/** The year a city's recent growth is measured from. */
const SINCE = 2000;

const SRC_UN = [{ label: "United Nations, World Urbanization Prospects: The 2025 Revision", url: SRC.url }];

const regionColors: Record<string, string> = {
  "North America": TONE.blue,
  "Western Europe": TONE.purple,
  "East Asia": TONE.yellow,
  "Southeast Asia": TONE.green,
  "Middle East": TONE.orange,
  "Central Europe": TONE.pink,
  Oceania: TONE.cyan,
  "South Asia": TONE.red,
  "South America": TONE.lime,
  "Eastern Europe": TONE.indigo,
  "Northern Europe": TONE.teal,
  Africa: TONE.amber,
};

/* People in whichever unit keeps the real number visible. Fixed at millions,
   Monaco's 57,050 read "0.1M" - a city that is small, shown as one that is
   barely there. */
function fmtPeople(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return Math.round(n).toLocaleString("en-US");
}
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const km2 = (v: number) => `${v >= 100 ? whole(v) : v.toLocaleString("en-US", { maximumFractionDigits: 1 })} km²`;
const perKm2 = (v: number) => `${whole(v)}/km²`;
const m2 = (v: number) => `${v.toFixed(1)} m²`;
const share = (v: number) => `${v >= 10 ? v.toFixed(1) : v.toFixed(2)}%`;
const signed = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v) >= 10 ? Math.abs(v).toFixed(0) : Math.abs(v).toFixed(1)}%`;
/** An axis's people: 33M, 2.5M, 440k. */
const axisPeople = (v: number) => (v >= 1e6 ? `${Number((v / 1e6).toFixed(v >= 1e7 ? 0 : 1))}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(v));

/** 1st, 2nd, 3rd, 4th … */
function nth(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n.toLocaleString("en-US")}th`;
  return `${n.toLocaleString("en-US")}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** A city with the UN's figures for it: the base year's, and how its population moved before and is projected to after. */
type Row = {
  city: City;
  f: CityFigures;
  now: CityYear;
  /** From SINCE to the base year; null where the UN has no figure that far back. */
  since: ReturnType<typeof cityGrowth>;
  /** From the base year to the last projected one. */
  ahead: ReturnType<typeof cityGrowth>;
};
/** Every city on the page has figures: the build stops if the UN has none for one. */
const ROWS: Row[] = citiesData.flatMap((city) => {
  const f = CITY_FIGURES[city.id];
  const now = cityYear(city.id);
  return f && now ? [{ city, f, now, since: cityGrowth(city.id, SINCE, BASE), ahead: cityGrowth(city.id, BASE, LAST) }] : [];
});
const rowOf = (id: string) => ROWS.find((r) => r.city.id === id) ?? null;

type MeasureKey = "population" | "density" | "builtPer" | "share" | "growth";
type Measure = {
  key: MeasureKey;
  label: string;
  /** Its unit and year. */
  what: string;
  value: (r: Row) => number | null;
  fmt: (v: number) => string;
  /** What the city ranked 1st is. */
  first: string;
  /** Whether it is drawn as a bar: a change that can be negative is a figure, not a length. */
  bar: boolean;
  /** The end of the bar's scale where it has a natural one: 100 for a share. Otherwise the largest city's figure. */
  max?: number;
  /** The colour of its bar: one to a measure, so the tiles can be told apart at a glance. */
  color: string;
};
/** The measures the cities are sorted, ranked and set side by side on. */
const MEASURES: Measure[] = [
  { key: "population", label: "Population", what: `people, ${BASE}`, value: (r) => r.now.population, fmt: fmtPeople, first: "largest", bar: true, color: "#6366f1" },
  { key: "density", label: "Density", what: `people per km² of land, ${BASE}`, value: (r) => r.now.density, fmt: perKm2, first: "densest", bar: true, color: "#f97316" },
  { key: "builtPer", label: "Built-up area per person", what: `m², ${BASE}`, value: (r) => r.now.builtPer, fmt: m2, first: "most built-up area a person", bar: true, color: "#64748b" },
  { key: "share", label: "Share of its country's city population", what: `per cent, ${BASE}`, value: (r) => r.now.share, fmt: share, first: "largest share", bar: true, max: 100, color: "#14b8a6" },
  { key: "growth", label: `Population change since ${SINCE}`, what: `per cent, ${SINCE} to ${BASE}`, value: (r) => r.since?.pct ?? null, fmt: signed, first: "fastest growing", bar: false, color: "#22c55e" },
];
const measureOf = (key: MeasureKey) => MEASURES.find((m) => m.key === key)!;

/** Where a city stands among the cities the page holds, on one measure: its rank, and the list's low, middle and high. */
function standingOf(row: Row, m: Measure) {
  const v = m.value(row);
  const all = ROWS.map(m.value).filter((x): x is number => x != null).sort((a, b) => a - b);
  if (v == null || !all.length) return null;
  const mid = all.length >> 1;
  return {
    v,
    rank: all.filter((x) => x > v).length + 1,
    of: all.length,
    min: all[0],
    max: all[all.length - 1],
    median: all.length % 2 ? all[mid] : (all[mid - 1] + all[mid]) / 2,
  };
}

// ── Charts ─────────────────────────────────────────────────────────────────

/** The chart's quiet colours, by theme: axis text, grid, and the wash over the projected years. */
function useChartInk() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return {
    muted: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)",
    grid: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    ahead: isLight ? "rgba(99,102,241,0.07)" : "rgba(129,140,248,0.10)",
  };
}

type SeriesLine = { key: string; label: string; color: string; values: (number | null)[] };

function SeriesTip({
  active,
  payload,
  label,
  lines,
  fmt,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number | null }[];
  label?: string;
  lines: SeriesLine[];
  fmt: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const seen = new Set<string>();
  const rows = payload.flatMap((p) => {
    const key = String(p.dataKey).slice(0, -1);
    const line = lines.find((l) => l.key === key);
    if (!line || p.value == null || seen.has(key)) return [];
    seen.add(key);
    return [{ line, v: p.value }];
  });
  if (!rows.length) return null;
  return (
    <div className="cs-chart-tip rounded-md p-2 text-[11px] font-mono font-bold">
      <p className="mb-1" style={{ opacity: 0.75 }}>
        {label}
        {Number(label) > BASE ? " · projected" : " · estimated"}
      </p>
      {rows.map(({ line, v }) => (
        <p key={line.key}>
          <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: line.color }} aria-hidden />
          {line.label}: {fmt(v)}
        </p>
      ))}
    </div>
  );
}

/**
 * A city's series, year by year, on an axis from zero: solid to the UN's last
 * estimate, dashed over the years it projects, which are washed. A year the
 * UN gives no figure for is a gap in the line.
 */
function SeriesChart({ lines, fmt, tick, label, height = 200 }: { lines: SeriesLine[]; fmt: (v: number) => string; tick: (v: number) => string; label: string; height?: number }) {
  const ink = useChartInk();
  const data = CITY_YEARS.map((y, i) => {
    const row: Record<string, string | number | null> = { year: String(y) };
    for (const l of lines) {
      const v = l.values[i] ?? null;
      row[`${l.key}A`] = y <= BASE ? v : null;
      row[`${l.key}P`] = y >= BASE ? v : null;
    }
    return row;
  });
  const axis = { tick: { fontSize: 9, fill: ink.muted, fontFamily: "monospace" }, axisLine: false, tickLine: false };
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={ink.grid} vertical={false} />
          <XAxis dataKey="year" {...axis} ticks={[String(SRC.firstYear), "2000", String(BASE), String(LAST)]} interval={0} />
          <YAxis {...axis} width={46} tickFormatter={tick} domain={[0, "auto"]} />
          <ReferenceArea x1={String(BASE + 1)} x2={String(LAST)} fill={ink.ahead} fillOpacity={1} ifOverflow="visible" />
          <ReferenceLine
            x={String(BASE + 1)}
            stroke={ink.muted}
            strokeDasharray="2 3"
            label={{ value: "projected", position: "insideTopLeft", fontSize: 9, fill: ink.muted, fontFamily: "monospace" }}
          />
          <Tooltip content={<SeriesTip lines={lines} fmt={fmt} />} />
          {lines.flatMap((l) => [
            <Line key={`${l.key}A`} type="monotone" dataKey={`${l.key}A`} stroke={l.color} strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key={`${l.key}P`} type="monotone" dataKey={`${l.key}P`} stroke={l.color} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />,
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The lines of a chart, named, each with its latest figure in ink. */
function Legend({ items }: { items: { color: string; label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1.5">
      {items.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ background: l.color }} aria-hidden />
          <span className="text-[10px] font-sans text-muted-foreground">{l.label}</span>
          <span className="text-[10px] font-mono font-bold text-foreground">{l.value}</span>
        </span>
      ))}
    </div>
  );
}

/** A city's population from 1975 to 2050 as a line the width of its card: solid to the last estimate, dashed after, from zero. */
function PopSpark({ f, name }: { f: CityFigures; name: string }) {
  const W = 120;
  const H = 30;
  const top = Math.max(...f.pop.map((v) => v ?? 0));
  const pts = f.pop.map((v, i) => (v == null || top <= 0 ? null : ([(i / (f.pop.length - 1)) * W, H - 1 - (v / top) * (H - 2)] as const)));
  const path = (from: number, to: number) =>
    pts
      .slice(from, to + 1)
      .filter((p): p is readonly [number, number] => p != null)
      .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
      .join("");
  const b = BASE - SRC.firstYear;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block w-full h-8" role="img" aria-label={`Population of ${name}, ${SRC.firstYear} to ${LAST}; projected from ${BASE + 1}.`}>
      <line x1={0} y1={H - 0.5} x2={W} y2={H - 0.5} stroke="currentColor" strokeWidth={1} opacity={0.15} vectorEffect="non-scaling-stroke" />
      <path d={path(0, b)} fill="none" stroke={ACCENT} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
      <path d={path(b, pts.length - 1)} fill="none" stroke={ACCENT} strokeWidth={1.75} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── The city window's pieces ───────────────────────────────────────────────

/** A section's heading inside the window, drawn as the country window draws its own. */
function WindowSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {note && <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">{note}</p>}
      {children}
    </div>
  );
}

/** A figure in a tile, with a line under it saying whose it is and for when. */
function CityTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="modal-tile rounded-lg p-3 min-w-0">
      <p className="text-xs text-muted-foreground font-sans">{label}</p>
      <p className="text-base font-bold font-mono text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground font-sans mt-0.5 leading-snug">{sub}</p>}
    </div>
  );
}

/** How the city's population moved over each stretch of the series: the change, and the average rate a year it comes to. */
function GrowthRows({ row }: { row: Row }) {
  const first = cityFirstYear(row.city.id) ?? SRC.firstYear;
  const marks = [...new Set([first, SINCE, BASE, LAST])].filter((y) => y >= first).sort((a, b) => a - b);
  const spans = marks.slice(1).flatMap((to, i) => {
    const g = cityGrowth(row.city.id, marks[i], to);
    return g ? [g] : [];
  });
  if (!spans.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
      {spans.map((g) => (
        <div key={g.from} className="rounded-lg border border-border bg-background/40 px-3 py-2">
          <p className="text-[10px] font-mono text-muted-foreground">
            {g.from} to {g.to}
            {g.to > BASE ? " · projected" : ""}
          </p>
          <p className="text-sm font-bold font-mono text-foreground">{signed(g.pct)}</p>
          <p className="text-[10px] font-sans text-muted-foreground">{signed(g.perYear)} a year on average</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Where the city stands among the cities on the page, a tile to a measure:
 * the figure, its rank, the middle of the list, and a bar on the measure's
 * own scale - from zero to the largest city's figure, or to 100 for a share -
 * with a notch at the middle. A change that can be negative is given as a
 * figure with no bar.
 */
/** The measures the window sets the city's standing on: its size and its density. The other three were removed from it as asked; the page still sorts by them. */
const STANDING_KEYS: MeasureKey[] = ["population", "density"];

function CityStandings({ row }: { row: Row }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MEASURES.filter((m) => STANDING_KEYS.includes(m.key)).map((m) => {
        const s = standingOf(row, m);
        if (!s) {
          return (
            <li key={m.key} className="modal-tile rounded-lg p-3 min-w-0">
              <p className="text-xs text-muted-foreground font-sans">{m.label}</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">Not published</p>
              <p className="text-[11px] font-sans text-muted-foreground">The UN's series for {row.city.name} starts after {SINCE}.</p>
            </li>
          );
        }
        const top = m.max ?? s.max;
        const at = (v: number) => `${top > 0 ? Math.min(100, Math.max(0, (100 * v) / top)) : 0}%`;
        return (
          <li key={m.key} className="modal-tile rounded-lg p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground font-sans">{m.label}</p>
              <span className="text-[10px] font-mono font-bold text-foreground px-2 py-0.5 rounded-full border border-border whitespace-nowrap">
                {nth(s.rank)} of {s.of}
              </span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground leading-tight mt-0.5">{m.fmt(s.v)}</p>
            <p className="text-[11px] font-sans text-muted-foreground">
              {m.what} · the middle of the {s.of} is {m.fmt(s.median)}
            </p>
            {m.bar && (
              <>
                <div
                  className="relative mt-2.5 h-1.5 rounded-full bg-muted"
                  role="img"
                  aria-label={`${row.city.name}: ${m.fmt(s.v)}, ${nth(s.rank)} of ${s.of} cities for ${m.label.toLowerCase()}, on a scale from zero to ${m.fmt(top)}.`}
                >
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: at(s.v), minWidth: 2, background: m.color }} />
                  <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full bg-foreground" style={{ left: at(s.median) }} title={`The middle of the ${s.of}: ${m.fmt(s.median)}`} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                  <span>0</span>
                  <span>{m.max ? "100%" : `${m.fmt(top)} · the ${m.first}`}</span>
                </div>
              </>
            )}
            <p className="text-[11px] font-sans text-muted-foreground mt-2 pt-2 border-t border-border/50">
              The {s.of} cities run from <span className="font-mono text-foreground">{m.fmt(s.min)}</span> to <span className="font-mono text-foreground">{m.fmt(s.max)}</span>.
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function CityModal({ city, onClose }: { city: City; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "history">("overview");
  /* The city's article and where it is. */
  const place = CITY_PLACES[city.id];
  const row = rowOf(city.id);
  const follow = useFollowedCities();
  const followed = follow.isFollowed(city.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* The region's tone, whole: its fill, border and text for the light theme and for the dark. The Map tab's banner took
     only the light fill out of it and set the page's text on top, so in the dark theme it was pale text on pale yellow. */
  const regionColor = regionColors[city.region] ?? "text-muted-foreground border-border bg-muted";

  const first = cityFirstYear(city.id) ?? SRC.firstYear;
  const then = cityYear(city.id, first);
  /** The economy of the country the city is in: what stands in for a city's own, which nobody publishes. */
  const eco = ECONOMY_OF[city.countryCode] ? ECONOMY_INDICATORS[ECONOMY_OF[city.countryCode]] : undefined;
  const end = cityYear(city.id, LAST);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : "max-w-2xl max-h-[90vh]"}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img src={`https://flagcdn.com/w160/${city.countryCode.toLowerCase()}.png`} alt={`${city.country} flag`} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold font-sans text-foreground">{city.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`flex items-center gap-1 ${CHIP_TEXT}`}>
                    <MapPin size={12} weight="fill" /> {city.country}
                  </span>
                  <span className={`text-xs border px-2 py-0.5 rounded-full font-sans ${regionColor}`}>{city.region}</span>
                  {row?.f.capital && <span className={CHIP_TEXT}>Capital</span>}
                  {row && (
                    <span className={CHIP_TEXT} title={`By population in ${BASE}, among the ${SRC.cities.toLocaleString("en-US")} cities the United Nations counts`}>
                      {nth(row.f.rank)} largest city in the world
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Follow, as in a country's and a state's window: the city is kept at the top of the page. */}
              <button
                onClick={() => follow.toggle(city.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-pressed={followed}
                aria-label={followed ? `Unfollow ${city.name}` : `Follow ${city.name}`}
                title={followed ? "Stop following" : "Keep this city at the top of the page · saved in this browser"}
              >
                <Star size={18} weight={followed ? "fill" : "regular"} className={followed ? "text-amber-500" : undefined} />
              </button>
              {/* As in a country's and a state's window: to the maps page, with this city marked on both maps. */}
              {place && (
                <button
                  onClick={() => navigate(`/dashboard/maps?city=${city.id}`)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  aria-label={`Show ${city.name} on the map`}
                  title="Show on map"
                >
                  <MapTrifold size={18} />
                </button>
              )}
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label={isExpanded ? "Collapse modal" : "Expand modal to full screen"}
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                {isExpanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Through to the same place on the other pages: its country, the country's economy and leaders, the other
              cities profiled in it, and the city's place on the map. */}
          <SeeAlso code={city.countryCode} name={city.country} cityId={city.id} mapTo={place ? `/dashboard/maps?city=${city.id}` : undefined} />

          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 mb-5">
            {(
              [
                { key: "overview", label: "Overview", icon: <ListBullets size={14} /> },
                { key: "history", label: "History", icon: <ClockCounterClockwise size={14} /> },
                { key: "map", label: "Map", icon: <MapTrifold size={14} /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeTab === tab.key ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {row && (
                <>
                  <WindowSection
                    title="👥 People & place"
                    note={`A city, to the UN, is contiguous 1 km² cells of at least 1,500 people each, holding 50,000 people or more - one rule for every city, whatever its boundary. That is why its figure and the city's own differ.`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <CityTile label="Population" value={whole(row.now.population)} sub={`UN estimate, ${BASE}`} />
                      <CityTile label="Country" value={city.country} sub={city.region} />
                      {city.languages?.length ? <CityTile label="Languages" value={city.languages.slice(0, 2).join(", ")} sub="the site's own note" /> : null}
                    </div>
                  </WindowSection>

                  {/* Economy & institutions, as the window had it. The figures it showed for the city were typed in; no body
                      publishes a city's economy on one footing, so these are its country's, and say so. */}
                  {eco && (
                    <WindowSection title="💰 Economy & institutions" note={`These are ${city.country}'s figures, not ${city.name}'s: no body publishes them city by city. The universities and colleges are below.`}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {eco.gdpPerCapita && <CityTile label="GDP per person" value={`$${eco.gdpPerCapita.v.toLocaleString("en-US")}`} sub={`${city.country}, current US$, ${eco.gdpPerCapita.y}`} />}
                        {eco.gdpGrowthRate && <CityTile label="Real GDP growth" value={`${eco.gdpGrowthRate.v > 0 ? "+" : ""}${eco.gdpGrowthRate.v}%`} sub={`${city.country}, ${eco.gdpGrowthRate.y}`} />}
                        {eco.unemploymentRate && <CityTile label="Unemployment" value={`${eco.unemploymentRate.v}%`} sub={`${city.country}, of the labour force, ${eco.unemploymentRate.y}`} />}
                        {eco.inflationRate && <CityTile label="Inflation" value={`${eco.inflationRate.v}%`} sub={`${city.country}, consumer prices, ${eco.inflationRate.y}`} />}
                        {eco.debtToGDPRatio && <CityTile label="Government debt" value={`${eco.debtToGDPRatio.v}%`} sub={`${city.country}, of GDP, ${eco.debtToGDPRatio.y}`} />}
                        {eco.gdpTrillions && <CityTile label="GDP" value={`$${eco.gdpTrillions.v >= 1 ? `${eco.gdpTrillions.v}T` : `${Math.round(eco.gdpTrillions.v * 1000)}B`}`} sub={`${city.country}, current US$, ${eco.gdpTrillions.y}`} />}
                      </div>
                      <SourceLink sources={[ECONOMY_INDICATORS_SOURCE.worldBank, ECONOMY_INDICATORS_SOURCE.imf]} className="mt-2" />
                    </WindowSection>
                  )}

                  <WindowSection
                    title="📊 Where it stands"
                    note={`${city.name} among the ${ROWS.length} cities on this page. Each bar runs from zero to the largest city's figure; the notch is the middle of them.`}
                  >
                    <CityStandings row={row} />
                  </WindowSection>

                  <WindowSection
                    title={`📈 Population, ${first} to ${LAST}`}
                    note={`The UN's estimates to ${BASE} and its projections after, a figure a year, on an axis from zero.`}
                  >
                    <div className="modal-tile rounded-lg p-4">
                      <Legend
                        items={[
                          ...(then ? [{ color: ACCENT, label: String(first), value: fmtPeople(then.population) }] : []),
                          { color: ACCENT, label: String(BASE), value: fmtPeople(row.now.population) },
                          ...(end ? [{ color: ACCENT, label: `${LAST}, projected`, value: fmtPeople(end.population) }] : []),
                        ]}
                      />
                      <SeriesChart
                        lines={[{ key: "pop", label: "Population", color: ACCENT, values: row.f.pop }]}
                        fmt={whole}
                        tick={axisPeople}
                        label={`Population of ${city.name}, ${first} to ${LAST}: ${then ? fmtPeople(then.population) : ""} to ${end ? fmtPeople(end.population) : ""}, projected from ${BASE + 1}.`}
                      />
                      <GrowthRows row={row} />
                    </div>
                  </WindowSection>

                  <SourceLink sources={SRC_UN} className="mb-1" />
                </>
              )}

              {/* The headings the windows once had - water, energy, transport, safety, business, the economy - with the
                  country's published figures under them, and said to be the country's. */}
              <Suspense fallback={null}>
                <CountryQuality code={city.countryCode} country={city.country} place={city.name} city={city.id} />
                {/* The city's universities and colleges, each opening to what it is about and known for. */}
                <Universities city={city.id} place={city.name} />
              </Suspense>

              {/* Languages, Landmarks, Religions */}
              {(city.languages?.length || city.landmarks?.length || city.religions?.length) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {city.languages?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">Languages Spoken</p>
                      <div className="flex flex-wrap gap-1.5">
                        {city.languages.map((l) => (
                          <span key={l} className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {city.landmarks?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">Top Landmarks</p>
                      <ul className="space-y-1">
                        {city.landmarks.map((lm) => (
                          <li key={lm} className="text-xs text-foreground font-sans flex items-start gap-1.5">
                            <span className="text-secondary mt-0.5">•</span>
                            {lm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {city.religions?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">Religions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {city.religions.map((r) => (
                          <span key={r} className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <p className="text-[10px] font-sans text-muted-foreground leading-snug pt-1">
                Every figure in this window is the United Nations' (World Urbanization Prospects: The 2025 Revision, read {SRC.retrieved}). The lists of
                languages, landmarks and religions are the site's own notes, not a published count. The history is Wikipedia's, fetched as the window
                opens.
              </p>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <div className="space-y-4">
              {/* Region banner: every line in the tone's own text colour, which is dark on the pale fill and pale on the deep one. */}
              <div className={`rounded-xl p-4 flex items-center gap-4 ${regionColor}`}>
                <div>
                  <p className="text-xs font-semibold font-sans uppercase tracking-wide opacity-80">{city.region}</p>
                  <p className="font-bold font-sans text-lg leading-tight">{city.name}</p>
                  <p className="text-xs font-sans opacity-80">{city.country}</p>
                </div>
                {row && (
                  <div className="ml-auto text-right">
                    <p className="text-xs font-sans opacity-80">Population</p>
                    <p className="font-mono font-bold text-sm">{fmtPeople(row.now.population)}</p>
                    <p className="font-mono text-xs opacity-80">UN estimate, {BASE}</p>
                  </div>
                )}
              </div>

              {/* Google Maps embed */}
              <div className="rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
                <iframe
                  title={`Map of ${city.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(city.name + ", " + city.country)}&z=11&output=embed`}
                />
              </div>

              {/* Location facts grid */}
              {row && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Land area", value: km2(row.now.area) },
                      { label: "Density", value: perKm2(row.now.density) },
                      { label: "Built-up area", value: km2(row.now.built) },
                      { label: "A capital", value: row.f.capital ? "Yes" : "No" },
                    ].map((f) => (
                      <div key={f.label} className="modal-tile rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground font-sans">{f.label}</p>
                        <p className="text-sm font-bold font-mono text-foreground mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <ChartNote>
                    The city as the United Nations draws it, {BASE}; whether it is a capital is as its country designates. The map is Google's and shows
                    the place by name, not the UN's outline.
                  </ChartNote>
                  <SourceLink sources={SRC_UN} />
                </>
              )}
            </div>
          )}

          {/* History Tab: the city's story from its Wikipedia article. */}
          {activeTab === "history" &&
            (place ? (
              <ArticlePanel title={place.wiki} name={city.name} mode="history" />
            ) : (
              <p className="text-xs font-sans text-muted-foreground py-6 text-center">No article is recorded for {city.name}.</p>
            ))}
        </div>
      </div>
    </div>
  );
}

/** The cities shown, as a file: every figure the page holds for each, with whose it is and for when in the column's name. */
function exportCitiesToCSV(rows: Row[]) {
  const headers = [
    "Name",
    "Country",
    "Region",
    "UN city name",
    "Capital",
    `Population ${BASE} (UN estimate)`,
    `Land area km2 ${BASE} (UN)`,
    `Built-up area km2 ${BASE} (UN)`,
    `People per km2 ${BASE} (UN)`,
    `Built-up m2 per person ${BASE} (UN)`,
    `Share of country's city population % ${BASE} (UN)`,
    `World rank by population ${BASE} (of ${SRC.cities} UN cities)`,
    "UN plausibility of population figure",
    `Population ${SINCE} (UN estimate)`,
    `Population ${LAST} (UN projection)`,
    "Population within own boundary (Wikidata)",
    "Year of boundary population",
  ];
  const lines = rows.map((r) => [
    r.city.name,
    r.city.country,
    r.city.region,
    r.f.un,
    r.f.capital ? "yes" : "no",
    r.now.population,
    r.now.area,
    r.now.built,
    r.now.density,
    r.now.builtPer,
    r.now.share,
    r.f.rank,
    r.f.plausibility,
    cityYear(r.city.id, SINCE)?.population ?? "",
    cityYear(r.city.id, LAST)?.population ?? "",
    r.f.admin?.population ?? "",
    r.f.admin?.year ?? "",
  ]);
  const csv = [headers, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cities_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Cities in the news ─────────────────────────────────────────────────────

/** How headlines name a city, where it is not the city's own name on the page. */
const HEADLINE_NAMES: Record<string, string[]> = {
  "San Francisco Bay Area": ["San Francisco", "Bay Area"],
  "New York City": ["New York City", "New York", "NYC", "Manhattan", "Brooklyn"],
  Johannesburg: ["Johannesburg", "Joburg"],
};

/**
 * Phrases that name a city without being news about it - a treaty, a
 * newspaper, a team, a person, the state of New York - read first and set
 * aside.
 */
const NOT_CITIES = [
  "Paris Agreement", "Paris climate", "Paris accord", "Paris Accord", "Paris Hilton", "Paris Saint-Germain", "Paris St-Germain",
  "New York Times", "New York Post", "New York Magazine", "New York state", "New York State", "New York governor",
  "New York Governor", "New York Gov", "New York lawmakers", "New York legislature", "New York Legislature",
  "New York attorney general", "New York Attorney General", "New York Rangers", "New York Knicks", "New York Yankees",
  "New York Mets", "New York Giants", "New York Jets", "New York Liberty", "New York Islanders",
  "Shanghai Cooperation Organisation", "Shanghai Cooperation Organization", "Istanbul Convention", "Vienna Convention",
  "Zurich Insurance", "London, Ontario", "Jack London", "Sydney Sweeney", "Sydney McLaughlin", "Mumbai Indians",
  "FC Barcelona", "Toronto Raptors", "Toronto Maple Leafs", "Toronto Blue Jays", "Monaco Grand Prix", "Tokyo Electric",
];

const citiesIn = nameMatcher(
  citiesData.map((c): [City, string[]] => [c, HEADLINE_NAMES[c.name] ?? [c.name]]),
  NOT_CITIES,
);

/**
 * The newest headlines naming a profiled city, at most three a city so the
 * most-covered do not crowd out the rest. The chip is the city; violet when
 * a story names more than one. Asked for all, every headline naming one.
 */
const pickCities = (rows: Headline[], all = false): Shown[] => {
  const n = new Map<string, number>();
  const out: Shown[] = [];
  for (const h of rows) {
    const named = citiesIn(h.title);
    if (!named.length || (!all && named.every((c) => (n.get(c.id) ?? 0) >= 3))) continue;
    for (const c of named) n.set(c.id, (n.get(c.id) ?? 0) + 1);
    out.push({ h, tag: namesTag(named.map((c) => c.name)) });
    if (!all && out.length === 30) break;
  }
  return out;
};

/** The city with the highest figure on a measure, among the page's. */
const topOf = (key: MeasureKey) => {
  const m = measureOf(key);
  return ROWS.reduce<{ row: Row; v: number } | null>((best, row) => {
    const v = m.value(row);
    return v != null && (!best || v > best.v) ? { row, v } : best;
  }, null);
};

export function CitiesPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [sortBy, setSortBy] = useState<MeasureKey>("population");
  const [modalCity, setModalCity] = useState<City | null>(null);
  /** One of the cities in the full list below, where a link names it ("un-<country>-<code>"). */
  const [unOpen, setUnOpen] = useState<string | null>(null);
  const clearUn = React.useCallback(() => setUnOpen(null), []);

  /* Deep link: ?open=<city id> opens that city's window - from the search bar, another page's window, or one city's
     window to another's. It is read from the router so a link made while the page is open works too, and the address
     is tidied through the router so the same link works a second time. The value is only ever matched against the list. */
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    const openId = new URLSearchParams(location.search).get("open");
    if (!openId) return;
    // "un-…" is one of the cities the UN counts, in the full list below: its window opens there.
    if (openId.startsWith("un-")) setUnOpen(openId);
    const found = citiesData.find((c) => c.id === openId);
    if (found) setModalCity(found);
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, navigate]);

  const allRegions = ["All", ...Array.from(new Set(citiesData.map((c) => c.region))).sort()];
  const measure = measureOf(sortBy);

  /* The cities that match, highest on the chosen measure first; one the UN has no figure for on it goes last. */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ROWS.filter(({ city }) => (city.name.toLowerCase().includes(q) || city.country.toLowerCase().includes(q)) && (regionFilter === "All" || city.region === regionFilter)).sort(
      (a, b) => (measure.value(b) ?? -Infinity) - (measure.value(a) ?? -Infinity),
    );
  }, [search, regionFilter, measure]);

  /* The cards: the cities the reader follows first, each group in the order of the chosen measure. */
  const follow = useFollowedCities();
  const cards = useMemo(() => [...filtered.filter((r) => follow.ids.includes(r.city.id)), ...filtered.filter((r) => !follow.ids.includes(r.city.id))], [filtered, follow.ids]);
  const followedShown = cards.filter((r) => follow.ids.includes(r.city.id)).length;

  /* The headline figures, read off the cities: they were typed in - "Tokyo 37M", "Safest City: Dubai (83)". */
  const summary = useMemo(() => {
    const largest = topOf("population");
    const densest = topOf("density");
    const fastest = topOf("growth");
    return [
      { label: "Cities profiled", value: String(ROWS.length), sub: `of the ${SRC.cities.toLocaleString("en-US")} the UN counts` },
      ...(largest ? [{ label: "Largest", value: `${largest.row.city.name} · ${fmtPeople(largest.v)}`, sub: `people, ${BASE}` }] : []),
      ...(densest ? [{ label: "Densest", value: `${densest.row.city.name} · ${perKm2(densest.v)}`, sub: `people per km² of land, ${BASE}` }] : []),
      ...(fastest ? [{ label: `Grown most since ${SINCE}`, value: `${fastest.row.city.name} · ${signed(fastest.v)}`, sub: `population, ${SINCE} to ${BASE}` }] : []),
    ];
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">Cities</h1>
            <p className="text-muted-foreground text-sm font-sans">
              {ROWS.length} world cities — people, land and built-up area, {SRC.firstYear} to {LAST}, as the United Nations measures them
            </p>
          </div>
          <button
            onClick={() => exportCitiesToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-medium font-sans cursor-pointer"
            title="Export the cities shown, with every figure, to CSV"
          >
            <DownloadSimple size={13} weight="bold" />
            Export CSV
          </button>
        </div>

        {/* What a figure here is: said once, before any is read. */}
        <div className="bg-card border border-border rounded-lg px-4 py-3 mb-6">
          <p className="text-xs font-sans text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">How to read this page.</span> Every figure is the United Nations', from World Urbanization
            Prospects: The 2025 Revision. It draws every city by one rule - contiguous 1 km² cells of at least 1,500 people each, together holding
            50,000 or more - so the cities can be set side by side, and a figure here is not the one a city government reports for the area inside its
            own boundary. Years to {BASE} are estimates; later years are the UN's projections.
          </p>
          <SourceLink sources={SRC_UN} className="mt-1.5" />
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {summary.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground font-sans">{s.label}</p>
              <p className="text-base font-bold font-mono text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Unified Search + Filter Bar */}
        <FilterBar
          label="City filters"
          className="mb-5"
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search cities or countries…",
          }}
        >
          {allRegions.map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                regionFilter === r ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {r}
            </button>
          ))}
          <div className="w-px h-4 bg-border shrink-0" />
          <select
            aria-label="Sort and rank cities by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MeasureKey)}
            className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
          >
            {MEASURES.map((m) => (
              <option key={m.key} value={m.key}>
                Sort: {m.label}
              </option>
            ))}
          </select>
        </FilterBar>

        {/* ── City headlines: news naming a city profiled here ── */}
        <HeadlinesBanner
          label="City headlines"
          topics={["world", "economy", "policy", "us"]}
          days={2}
          read={400}
          untagged
          pick={pickCities}
          className="mb-6"
          note={(outlets) => (
            <>
              The last two days' headlines naming a city profiled here, from {outlets}, refreshed every half hour - three at most a
              city, so the most-covered do not crowd out the rest. The tag is the city, violet when a story names more than one. Each
              links to the outlet.
            </>
          )}
        />

        {modalCity && <CityModal city={modalCity} onClose={() => setModalCity(null)} />}


        {followedShown > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground mb-2">
            <Star size={12} weight="fill" className="text-amber-500" aria-hidden />
            The {followedShown === 1 ? "city" : `${followedShown} cities`} you follow {followedShown === 1 ? "is" : "are"} first. Followed cities are saved in this browser.
          </p>
        )}

        {/* City Cards — 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-fr">
          {cards.map(({ city, f, now, since }) => {
            const first = cityFirstYear(city.id) ?? SRC.firstYear;
            const end = cityYear(city.id, LAST);
            return (
              <article
                key={city.id}
                onClick={() => setModalCity(city)}
                className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 flex flex-col h-full"
              >
                {/* Card header with country flag background */}
                <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                  <img
                    src={`https://flagcdn.com/w320/${city.countryCode?.toLowerCase() ?? "un"}.png`}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 select-none pointer-events-none"
                  />
                  <div className="relative flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                      <img
                        src={`https://flagcdn.com/w80/${city.countryCode?.toLowerCase() ?? "un"}.png`}
                        alt={`${city.country} flag`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.onerror = null;
                          t.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold font-sans text-foreground text-sm">{city.name}</h3>
                      <p className="text-xs text-muted-foreground font-sans flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {city.country}
                        {f.capital ? " · capital" : ""}
                      </p>
                    </div>
                  </div>
                  {/* Follow: kept to its own click, so it does not open the card. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      follow.toggle(city.id);
                    }}
                    aria-pressed={follow.isFollowed(city.id)}
                    aria-label={follow.isFollowed(city.id) ? `Unfollow ${city.name}` : `Follow ${city.name}`}
                    title={follow.isFollowed(city.id) ? "Following" : "Follow"}
                    className="relative shrink-0 p-1.5 rounded-full bg-background/60 hover:bg-background/90 transition-colors cursor-pointer"
                  >
                    <Star size={16} weight={follow.isFollowed(city.id) ? "fill" : "regular"} className={follow.isFollowed(city.id) ? "text-amber-500" : "text-foreground/70"} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground font-sans">Population, {BASE}</p>
                    <p className="text-sm font-bold font-mono text-foreground">{fmtPeople(now.population)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-sans">Land area</p>
                    <p className="text-sm font-bold font-mono text-foreground">{km2(now.area)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-sans">Density</p>
                    <p className="text-sm font-bold font-mono text-foreground">{perKm2(now.density)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-sans">Since {SINCE}</p>
                    <p className="text-sm font-bold font-mono text-foreground" title={since ? undefined : `The UN's series for ${city.name} starts in ${first}`}>
                      {since ? signed(since.pct) : "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground font-sans">
                      Population, {first}–{LAST}
                    </span>
                    {end && <span className="font-mono text-muted-foreground">{fmtPeople(end.population)} projected</span>}
                  </div>
                  <PopSpark f={f} name={city.name} />
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground font-sans text-sm">No cities match your filters.</p>
            </div>
          )}
        </div>

        {/* ── Every city the United Nations counts: the full list under the profiled few, each with a window ── */}
        <Suspense fallback={<p className="text-xs font-sans text-muted-foreground mt-10">Loading every city the United Nations counts…</p>}>
          <AllCities openId={unOpen} onOpened={clearUn} />
        </Suspense>

      </div>
    </div>
  );
}
