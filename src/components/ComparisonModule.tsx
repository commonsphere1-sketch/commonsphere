import { usdFromBillions } from "../lib/money";
import { na } from "../lib/na";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Plus,
  ArrowsLeftRight,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { countriesData, type Country } from "../data/countriesData";
import { usStatesData, type USState } from "../data/statesData";
import { STATE_INDICATORS as STATE_FIGURES } from "../data/stateIndicators";

/* The colours of the places compared, in the order they are picked: four of the palette the site's charts share,
   whose neighbours stay apart for colour-blind readers on the light and the dark card. */
const COLORS = ["#2563eb", "#d97706", "#0d9488", "#c026d3"];

type EntityItem =
  | { kind: "country"; data: Country }
  | { kind: "state"; data: USState };

function entityId(e: EntityItem) {
  return e.kind === "country" ? `c-${e.data.id}` : `s-${e.data.id}`;
}
function entityName(e: EntityItem) {
  return e.data.name;
}

const money0 = (v: number) => `$${Math.round(v).toLocaleString()}`;
/** Billions in, T or B out. The sign leads the currency: -$898B, not $-898B. */
// Scaled to T/B/M so a small economy is not "$0B".
const bnUSD = (v: number) => usdFromBillions(v);
const people = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`;
const areaKm = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(2)}M km²` : `${Math.round(v).toLocaleString()} km²`;

/*
 * What the profile shows, and why it changed twice.
 *
 * It first labelled proxies as the thing named - a country's "Transport" axis
 * was its GDP growth, "Crime" its unemployment. Those went, but what replaced
 * them still drew each axis between a floor and a ceiling picked to look
 * right (employment from 75 to 100, life expectancy from 50 to 90), and one
 * axis, "Price stability", was a sum of the page's own making: ten less the
 * distance of inflation from two. A spoke's length meant whatever the range
 * had been set to.
 *
 * Each axis is a published figure now, and its scale is the largest of the
 * places being compared: that place reaches the edge, and one halfway in has
 * half its figure. A longer spoke is a larger figure, not a better one -
 * unemployment is among them - and the chart says so.
 */
type AxisDef = { axis: string; get: (e: EntityItem) => number | undefined; print: (v: number) => string };

const COUNTRY_AXES: AxisDef[] = [
  { axis: "GDP per capita", get: (e) => (e.data as Country).gdpPerCapita, print: money0 },
  { axis: "HDI", get: (e) => (e.data as Country).humanDevelopmentIndex, print: (v) => String(v) },
  { axis: "Life expectancy", get: (e) => (e.data as Country).lifeExpectancy, print: (v) => `${v} yrs` },
  { axis: "Unemployment", get: (e) => (e.data as Country).unemploymentRate, print: (v) => `${v}%` },
];
const STATE_AXES: AxisDef[] = [
  { axis: "GDP per capita", get: (e) => ((e.data as USState).gdp * 1e9) / (e.data as USState).population, print: money0 },
  { axis: "Unemployment", get: (e) => (e.data as USState).unemploymentRate, print: (v) => `${v}%` },
  { axis: "Median household income", get: (e) => (e.data as USState).medianIncome, print: money0 },
  { axis: "Bachelor's degree+", get: (e) => STATE_FIGURES[e.data.id]?.education.bachelorsOrHigherPct, print: (v) => `${v}%` },
  { axis: "Home ownership", get: (e) => STATE_FIGURES[e.data.id]?.housing.homeOwnershipPct, print: (v) => `${v}%` },
];
const axesOf = (e: EntityItem) => (e.kind === "country" ? COUNTRY_AXES : STATE_AXES);
/** An entity's figure on an axis, where it has one and it is above zero: a spoke has nowhere to put anything else. */
const figureOn = (e: EntityItem, axis: string) => {
  const v = axesOf(e).find((a) => a.axis === axis)?.get(e);
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
};

/** The axes every selected entity has a figure for, in the first one's order. */
function sharedAxes(sel: EntityItem[]): AxisDef[] {
  if (sel.length === 0) return [];
  return axesOf(sel[0]).filter((a) => sel.every((e) => figureOn(e, a.axis) !== undefined));
}

/**
 * Stat rows for the comparison table: the same measures the dashboard's
 * compare card carries, so the two agree on what "comparing" means. Ten for a
 * country, ten for a state, four of them shared.
 *
 * Shared measures deliberately use the same key — GDP, Population,
 * Unemployment, Area — so a country and a state pinned together line up on one
 * row instead of producing two rows that say the same thing. A key an entity
 * does not have renders "—".
 *
 * The labels lost their emoji here. Ten rows of assorted pictograms read as
 * decoration rather than a table, and there is no sensible glyph for a top
 * marginal income tax rate.
 *
 * The radar above is unchanged on purpose: it needs a measure that normalises
 * to 0–100 with a defensible floor and ceiling, which size (GDP, population,
 * area) and tax rates do not have. Bigger is not better, so an axis for it
 * would assert something false.
 */
function statRow(e: EntityItem): Record<string, string> {
  if (e.kind === "country") {
    const c = e.data;
    return {
      GDP: na(c.gdp, bnUSD),
      "GDP per capita": na(c.gdpPerCapita, money0),
      "GDP growth": na(c.gdpGrowth, (v) => `${v > 0 ? "+" : ""}${v}%`),
      Population: na(c.population, people),
      Unemployment: na(c.unemploymentRate, (v) => `${v}%`),
      Inflation: na(c.inflationRate, (v) => `${v}%`),
      "Life expectancy": na(c.lifeExpectancy, (v) => `${v} yrs`),
      HDI: na(c.humanDevelopmentIndex, (v) => String(v)),
      "Trade balance": na(c.tradeBalance, (v) => `${v > 0 ? "+" : ""}${bnUSD(v)}`),
      Area: na(c.areaKm2, areaKm),
    };
  }
  const s = e.data;
  const f = STATE_FIGURES[s.id];
  return {
    GDP: bnUSD(s.gdp),
    "GDP per capita": money0((s.gdp * 1e9) / s.population),
    Population: people(s.population),
    Unemployment: `${s.unemploymentRate}%`,
    "Median household income": money0(s.medianIncome),
    "Income per person": money0(s.averageIncome),
    "Top state income tax": `${s.stateTaxRate.toFixed(1)}%`,
    "Sales tax, with local": `${s.salesTaxRate.toFixed(2)}%`,
    // 0 means the state sets none of its own and follows the federal floor,
    // which is an answer rather than a gap.
    "Minimum wage": s.minimumWage === 0 ? "federal $7.25" : `$${s.minimumWage.toFixed(2)}/hr`,
    "Bachelor's degree+": f ? `${f.education.bachelorsOrHigherPct}%` : "—",
    Area: areaKm(s.areaKm2),
  };
}

export function ComparisonModule() {
  const [selected, setSelected] = useState<EntityItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"countries" | "states">("countries");
  const [popupOpen, setPopupOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setPopupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCountries = useMemo(
    () =>
      countriesData
        .filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 30),
    [search],
  );

  const filteredStates = useMemo(
    () =>
      usStatesData
        .filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.abbreviation.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 30),
    [search],
  );

  const addEntity = (e: EntityItem) => {
    if (selected.length >= 4) return;
    if (selected.find((x) => entityId(x) === entityId(e))) return;
    setSelected((prev) => [...prev, e]);
  };

  const removeEntity = (id: string) =>
    setSelected((prev) => prev.filter((x) => entityId(x) !== id));

  // Radar: only axes every selected entity has. Mixing countries and states
  // leaves two (GDP per capita, employment), too few for a radar, so the
  // chart is shown only when at least three axes are shared.
  const radarAxes = sharedAxes(selected);
  /* A row an axis: each place's figure as a share of the largest among them (the spoke), and the figure itself as
     printed (the tooltip and the list under the chart). */
  const mergedRadar = radarAxes.map((a) => {
    const figures = selected.map((e) => figureOn(e, a.axis)!);
    const top = Math.max(...figures);
    const row: Record<string, string | number> = { axis: a.axis };
    selected.forEach((e, i) => {
      row[entityName(e)] = Math.round((1000 * figures[i]) / top) / 10;
      row[`${entityName(e)}__text`] = a.print(figures[i]);
    });
    return row;
  });

  // Table: every metric any selected entity has.
  const statKeys = [...new Set(selected.flatMap((e) => Object.keys(statRow(e))))];

  return (
    <div className="space-y-6">
      {/* Search + Picker */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <ArrowsLeftRight size={18} weight="fill" className="text-secondary" />
          <h2 className="text-sm font-semibold font-sans text-foreground">
            Add Entities to Compare
          </h2>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {selected.length}/4 selected
          </span>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((e, idx) => (
              <span
                key={entityId(e)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans text-foreground border"
                style={{
                  borderColor: COLORS[idx % COLORS.length],
                  background: `${COLORS[idx % COLORS.length]}18`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span style={{ color: COLORS[idx % COLORS.length] }}>
                  {e.kind === "state" ? "🗺️" : "🌍"}
                </span>
                {entityName(e)}
                <button
                  onClick={() => removeEntity(entityId(e))}
                  className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tab + Search */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["countries", "states"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${tab === t ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {t === "countries" ? "🌍 Countries" : "🗺️ US States"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPopupOpen(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (search.length > 0) setPopupOpen(true);
              }}
              placeholder="Search to add…"
              className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded-full text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-sans"
            />

            {/* Popup dropdown */}
            {popupOpen && (
              <div
                ref={popupRef}
                className="search-dropdown-glass absolute left-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 p-3 max-h-52 overflow-y-auto">
                  {(tab === "countries" ? filteredCountries : filteredStates)
                    .length === 0 ? (
                    <p className="text-xs text-muted-foreground font-sans px-1 py-2 w-full text-center">
                      No results found.
                    </p>
                  ) : (
                    (tab === "countries"
                      ? filteredCountries
                      : filteredStates
                    ).map((item) => {
                      const e: EntityItem =
                        tab === "countries"
                          ? { kind: "country", data: item as Country }
                          : { kind: "state", data: item as USState };
                      const isSelected = !!selected.find(
                        (x) => entityId(x) === entityId(e),
                      );
                      return (
                        <button
                          key={entityId(e)}
                          onClick={() => {
                            isSelected
                              ? removeEntity(entityId(e))
                              : addEntity(e);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans cursor-pointer border transition-colors ${isSelected ? "chip-selected" : "bg-muted text-muted-foreground border-border hover:bg-secondary/10 hover:text-foreground"}`}
                        >
                          {!isSelected && <Plus size={10} weight="bold" />}
                          {isSelected && (
                            <span className="text-secondary">✓</span>
                          )}
                          {tab === "countries"
                            ? (item as Country).name
                            : (item as USState).abbreviation +
                              " — " +
                              (item as USState).name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected.length >= 2 && (
        <>
          {/* The profile */}
          {radarAxes.length < 3 ? (
            <div className="bg-card border border-border rounded-xl p-5 text-xs text-muted-foreground font-sans">
              Countries and US states share only GDP per capita and
              unemployment, too few measures for a profile chart. Compare
              countries with countries, or states with states, to see one;
              the table below lists every measure.
            </div>
          ) : (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-1">
              Profile
            </h3>
            <p className="text-[10px] text-muted-foreground font-sans mb-3 max-w-3xl leading-relaxed">
              Each spoke is one published figure, on the scale of the largest of the places compared: that place reaches the edge, and a point
              halfway in is half its figure. A longer spoke is a larger figure, not a better one - unemployment is among them. Point at the chart for
              the figures.
            </p>
            <div className="h-64 text-muted-foreground" role="img" aria-label={`A profile of ${selected.map(entityName).join(", ")} on ${radarAxes.map((a) => a.axis.toLowerCase()).join(", ")}, each as a share of the largest among them.`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={mergedRadar}
                  margin={{ top: 8, right: 32, bottom: 8, left: 32 }}
                >
                  <PolarGrid stroke="currentColor" strokeOpacity={0.25} />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{
                      fill: "currentColor",
                      fontSize: 11,
                      fontFamily: "Figures, IBM Plex Mono",
                    }}
                  />
                  {/* The figure as published, not the spoke's length. */}
                  <Tooltip formatter={(_v: unknown, name: string, item: { payload?: Record<string, string | number> }) => [String(item.payload?.[`${name}__text`] ?? ""), name]} />
                  {selected.map((e, idx) => (
                    <Radar
                      key={entityId(e)}
                      name={entityName(e)}
                      dataKey={entityName(e)}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={0.08}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* The same figures, to the number: a row an axis, a column a place. */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-[11px] font-mono">
                <caption className="sr-only">The figures the profile is drawn from.</caption>
                <thead>
                  <tr>
                    <td />
                    {selected.map((e, idx) => (
                      <th key={entityId(e)} scope="col" className="px-2 py-1 text-right font-sans font-semibold text-foreground">
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-baseline" style={{ backgroundColor: COLORS[idx % COLORS.length] }} aria-hidden />
                        {entityName(e)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mergedRadar.map((r) => (
                    <tr key={String(r.axis)} className="border-t border-border">
                      <th scope="row" className="py-1 pr-2 text-left font-sans font-normal text-muted-foreground">
                        {r.axis}
                      </th>
                      {selected.map((e) => (
                        <td key={entityId(e)} className="px-2 py-1 text-right text-foreground">
                          {r[`${entityName(e)}__text`]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          )}

          {/* Comparison table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                Side-by-Side Statistics
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-muted-foreground font-sans font-semibold uppercase tracking-wider text-[10px] w-32">
                      Metric
                    </th>
                    {selected.map((e, idx) => (
                      <th
                        key={entityId(e)}
                        className="px-4 py-3 text-left font-sans font-semibold text-sm"
                        style={{ color: COLORS[idx % COLORS.length] }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                          {entityName(e)}
                          <span className="text-[9px] text-muted-foreground font-mono ml-0.5">
                            {e.kind === "state" ? "State" : e.data.code}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statKeys.map((key, ri) => {
                    const rows = selected.map(
                      (e) =>
                        statRow(e)[key as keyof ReturnType<typeof statRow>] ??
                        "—",
                    );
                    return (
                      <tr
                        key={key}
                        className={`border-b border-border/40 ${ri % 2 === 0 ? "bg-muted/30" : ""}`}
                      >
                        <td className="px-5 py-2.5 text-muted-foreground font-sans text-[11px] font-medium">
                          {key}
                        </td>
                        {rows.map((val, ci) => {
                          const isPositive =
                            typeof val === "string" && val.startsWith("+");
                          const isNegative =
                            typeof val === "string" &&
                            val.startsWith("-") &&
                            key !== "Trade Balance";
                          return (
                            <td
                              key={ci}
                              className={`px-4 py-2.5 font-mono text-xs ${isPositive ? "text-success" : isNegative ? "text-destructive" : "text-foreground"}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selected.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <ArrowsLeftRight
            size={32}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground font-sans text-sm">
            Select 2–4 countries or US states above to compare them side by
            side.
          </p>
        </div>
      )}

      {selected.length === 1 && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-sans text-sm">
            Add at least one more entity to start comparing.
          </p>
        </div>
      )}
    </div>
  );
}
