import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, Plus, ArrowsLeftRight, MagnifyingGlass } from "@phosphor-icons/react";
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

const COLORS = [
  "hsl(200,85%,50%)",
  "hsl(330,70%,55%)",
  "hsl(150,60%,45%)",
  "hsl(45,90%,55%)",
  "hsl(270,60%,60%)",
];

type EntityItem =
  | { kind: "country"; data: Country }
  | { kind: "state"; data: USState };

function entityId(e: EntityItem) {
  return e.kind === "country" ? `c-${e.data.id}` : `s-${e.data.id}`;
}
function entityName(e: EntityItem) {
  return e.data.name;
}

// Normalise a value 0–100 for radar
function norm(val: number, lo: number, hi: number) {
  return Math.round(Math.min(100, Math.max(0, ((val - lo) / (hi - lo)) * 100)));
}

function radarData(e: EntityItem) {
  if (e.kind === "country") {
    const c = e.data;
    return [
      { axis: "Economy", value: norm(c.gdpPerCapita, 0, 120000) },
      { axis: "Growth", value: norm(c.gdpGrowth, -10, 20) },
      { axis: "HDI", value: norm(c.humanDevelopmentIndex, 0.3, 1) },
      { axis: "Life", value: norm(c.lifeExpectancy, 50, 90) },
      { axis: "Employment", value: norm(100 - c.unemploymentRate, 60, 100) },
      { axis: "Stability", value: norm(100 - Math.min(100, c.inflationRate), 50, 100) },
    ];
  } else {
    const s = e.data;
    const avgIncome = s.averageIncome ?? s.medianIncome ?? 0;
    return [
      { axis: "Economy", value: norm(s.gdp, 0, 4000) },
      { axis: "Growth", value: norm(s.approvalRating, 0, 100) },
      { axis: "HDI", value: norm(s.educationRank ? 51 - s.educationRank : 25, 0, 50) },
      { axis: "Life", value: norm(s.healthcareRank ? 51 - s.healthcareRank : 25, 0, 50) },
      { axis: "Employment", value: norm(100 - s.unemploymentRate * 4, 60, 100) },
      { axis: "Stability", value: norm(avgIncome / 1000, 30, 120) },
    ];
  }
}

// Stat rows for comparison table
function statRow(e: EntityItem) {
  if (e.kind === "country") {
    const c = e.data;
    return {
      "GDP": `$${(c.gdp / 1000).toFixed(1)}T`,
      "GDP/Capita": `$${c.gdpPerCapita.toLocaleString()}`,
      "GDP Growth": `${c.gdpGrowth > 0 ? "+" : ""}${c.gdpGrowth}%`,
      "Population": `${(c.population / 1e6).toFixed(0)}M`,
      "Unemployment": `${c.unemploymentRate}%`,
      "Inflation": `${c.inflationRate}%`,
      "Life Expect.": `${c.lifeExpectancy} yrs`,
      "HDI": `${c.humanDevelopmentIndex}`,
      "Trade Balance": `${c.tradeBalance >= 0 ? "+" : ""}$${c.tradeBalance}B`,
      "Gov. Type": c.governmentType.split(" ").slice(0, 3).join(" "),
      "Head of State": c.headOfState,
      "Currency": c.currency,
    };
  } else {
    const s = e.data;
    return {
      "GDP": `$${s.gdp}B`,
      "GDP/Capita": `$${(s.averageIncome ?? s.medianIncome ?? 0).toLocaleString()}`,
      "GDP Growth": `${s.approvalRating}% approval`,
      "Population": `${(s.population / 1e6).toFixed(1)}M`,
      "Unemployment": `${s.unemploymentRate}%`,
      "Inflation": "State-level",
      "Life Expect.": `#${s.healthcareRank ?? "—"} rank`,
      "HDI": `Edu #${s.educationRank ?? "—"}`,
      "Trade Balance": "—",
      "Gov. Type": `${s.party} Gov.`,
      "Head of State": s.governor,
      "Currency": "USD",
    };
  }
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
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) {
        setPopupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCountries = useMemo(() =>
    countriesData.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 30),
    [search]
  );

  const filteredStates = useMemo(() =>
    usStatesData.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.abbreviation.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 30),
    [search]
  );

  const addEntity = (e: EntityItem) => {
    if (selected.length >= 4) return;
    if (selected.find(x => entityId(x) === entityId(e))) return;
    setSelected(prev => [...prev, e]);
  };

  const removeEntity = (id: string) => setSelected(prev => prev.filter(x => entityId(x) !== id));

  // Build merged radar data
  const radarAxes = ["Economy", "Growth", "HDI", "Life", "Employment", "Stability"];
  const mergedRadar = radarAxes.map(axis => {
    const row: Record<string, any> = { axis };
    selected.forEach(e => { row[entityName(e)] = radarData(e).find(r => r.axis === axis)?.value ?? 0; });
    return row;
  });

  const statKeys = Object.keys(statRow(selected[0] ?? { kind: "country", data: countriesData[0] }));

  return (
    <div className="space-y-6">
      {/* Search + Picker */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <ArrowsLeftRight size={18} weight="fill" className="text-secondary" />
          <h2 className="text-sm font-semibold font-sans text-foreground">Add Entities to Compare</h2>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{selected.length}/4 selected</span>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((e, idx) => (
              <span key={entityId(e)} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans text-foreground border" style={{ borderColor: COLORS[idx % COLORS.length], background: `${COLORS[idx % COLORS.length]}18` }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span style={{ color: COLORS[idx % COLORS.length] }}>{e.kind === "state" ? "🗺️" : "🌍"}</span>
                {entityName(e)}
                <button onClick={() => removeEntity(entityId(e))} className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer">
                  <X size={12} weight="bold" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tab + Search */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["countries", "states"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${tab === t ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {t === "countries" ? "🌍 Countries" : "🗺️ US States"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPopupOpen(e.target.value.length > 0);
              }}
              onFocus={() => { if (search.length > 0) setPopupOpen(true); }}
              placeholder="Search to add…"
              className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded-full text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-sans"
            />

            {/* Popup dropdown */}
            {popupOpen && (
              <div
                ref={popupRef}
                className="absolute left-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 p-3 max-h-52 overflow-y-auto">
                  {(tab === "countries" ? filteredCountries : filteredStates).length === 0 ? (
                    <p className="text-xs text-muted-foreground font-sans px-1 py-2 w-full text-center">No results found.</p>
                  ) : (
                    (tab === "countries" ? filteredCountries : filteredStates).map(item => {
                      const e: EntityItem = tab === "countries"
                        ? { kind: "country", data: item as Country }
                        : { kind: "state", data: item as USState };
                      const isSelected = !!selected.find(x => entityId(x) === entityId(e));
                      return (
                        <button
                          key={entityId(e)}
                          onClick={() => {
                            isSelected ? removeEntity(entityId(e)) : addEntity(e);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans cursor-pointer border transition-colors ${isSelected ? "bg-secondary/20 text-secondary border-secondary/40" : "bg-muted text-muted-foreground border-border hover:bg-secondary/10 hover:text-foreground"}`}
                        >
                          {!isSelected && <Plus size={10} weight="bold" />}
                          {isSelected && <span className="text-secondary">✓</span>}
                          {tab === "countries" ? (item as Country).name : (item as USState).abbreviation + " — " + (item as USState).name}
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
          {/* Radar chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-4">Performance Radar</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={mergedRadar} margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                  <PolarGrid stroke="hsl(222,30%,25%)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(0,0%,60%)", fontSize: 11, fontFamily: "IBM Plex Mono" }} />
                  <Tooltip contentStyle={{ background: "hsl(222,44%,12%)", border: "1px solid hsl(222,30%,24%)", borderRadius: 6, fontFamily: "IBM Plex Mono", fontSize: 11 }} />
                  {selected.map((e, idx) => (
                    <Radar key={entityId(e)} name={entityName(e)} dataKey={entityName(e)} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.08} strokeWidth={2} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {selected.map((e, idx) => (
                <div key={entityId(e)} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-sans text-muted-foreground">{entityName(e)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">Side-by-Side Statistics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-muted-foreground font-sans font-semibold uppercase tracking-wider text-[10px] w-32">Metric</th>
                    {selected.map((e, idx) => (
                      <th key={entityId(e)} className="px-4 py-3 text-left font-sans font-semibold text-sm" style={{ color: COLORS[idx % COLORS.length] }}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          {entityName(e)}
                          <span className="text-[9px] text-muted-foreground font-mono ml-0.5">{e.kind === "state" ? "State" : e.data.code}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statKeys.map((key, ri) => {
                    const rows = selected.map(e => statRow(e)[key as keyof ReturnType<typeof statRow>] ?? "—");
                    return (
                      <tr key={key} className={`border-b border-border/40 ${ri % 2 === 0 ? "bg-muted/30" : ""}`}>
                        <td className="px-5 py-2.5 text-muted-foreground font-sans text-[11px] font-medium">{key}</td>
                        {rows.map((val, ci) => {
                          const isPositive = typeof val === "string" && val.startsWith("+");
                          const isNegative = typeof val === "string" && val.startsWith("-") && key !== "Trade Balance";
                          return (
                            <td key={ci} className={`px-4 py-2.5 font-mono text-xs ${isPositive ? "text-success" : isNegative ? "text-destructive" : "text-foreground"}`}>
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
          <ArrowsLeftRight size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-sans text-sm">Select 2–4 countries or US states above to compare them side by side.</p>
        </div>
      )}

      {selected.length === 1 && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-sans text-sm">Add at least one more entity to start comparing.</p>
        </div>
      )}
    </div>
  );
}
