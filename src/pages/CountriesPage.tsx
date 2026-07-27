import React, { useState } from "react";
import {
  Globe,
  MagnifyingGlass,
  MapPin,
  Shield,
  Users,
  Sword,
  Airplane,
  Anchor,
  Buildings,
  Flag,
  CurrencyDollar,
  ArrowRight,
  MapTrifold,
  Images,
  ListBullets,
  ArrowLeft,
  X,
} from "@phosphor-icons/react";
import { getMilitary, fmtPers, type MilitaryStats } from "../data/militaryData";
import { BIOSPHERE_PRESETS, BIOSPHERE_DEFAULT } from "../data/biosphereData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  type Country,
  type Industry,
  type EnergyStats,
} from "../data/countriesData";
import { useLiveData } from "../hooks/useLiveData";
import { ArrowsClockwise } from "@phosphor-icons/react";

// Format GDP: show B for < 1T, T for >= 1T
function fmtGDP(billionsUSD: number): string {
  if (billionsUSD >= 1000)
    return `$${(billionsUSD / 1000).toFixed(2).replace(/\.?0+$/, "")}T`;
  if (billionsUSD >= 1) return `$${Math.round(billionsUSD)}B`;
  return `<$1B`;
}

// Format population: show K for < 1M, M for >= 1M, B for >= 1B
function fmtPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n.toLocaleString()}`;
}

const continentColors: Record<string, string> = {
  "North America": "text-secondary border-secondary bg-secondary/10",
  Asia: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  Europe: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  "South America": "text-green-400 border-green-500/40 bg-green-500/10",
  Africa: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  Oceania: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
};

const hdiBadge = (hdi: number) => {
  if (hdi >= 0.9) return "bg-green-500/20 text-green-400";
  if (hdi >= 0.8) return "bg-secondary/20 text-secondary";
  if (hdi >= 0.7) return "bg-yellow-500/20 text-yellow-400";
  return "bg-orange-500/20 text-orange-400";
};

function getBiosphere(country: Country) {
  return BIOSPHERE_PRESETS[country.id] ?? BIOSPHERE_DEFAULT;
}

// ── Military Panel Sub-component ──
function MilitarySection({ mil }: { mil: MilitaryStats }) {
  const totalBases = mil.nationalBases + mil.intlBases;
  const nationalPct =
    totalBases > 0 ? (mil.nationalBases / totalBases) * 100 : 0;
  const intlPct = totalBases > 0 ? (mil.intlBases / totalBases) * 100 : 0;

  const kpiCards = [
    {
      label: "Active Personnel",
      value: fmtPers(mil.activePers),
      sub: mil.activePers.toLocaleString(),
      icon: <Users size={14} weight="fill" className="text-red-400" />,
      accent: "border-red-500/25 bg-red-500/5",
      valueColor: "text-red-400",
    },
    {
      label: "Reserve Personnel",
      value: fmtPers(mil.reservePers),
      sub: mil.reservePers.toLocaleString(),
      icon: <Shield size={14} weight="fill" className="text-orange-400" />,
      accent: "border-orange-500/25 bg-orange-500/5",
      valueColor: "text-orange-400",
    },
    {
      label: "Total Inventory",
      value: mil.inventory.toLocaleString(),
      sub: "assets tracked",
      icon: <Sword size={14} weight="fill" className="text-yellow-400" />,
      accent: "border-yellow-500/25 bg-yellow-500/5",
      valueColor: "text-yellow-400",
    },
    {
      label: "Defence Budget",
      value: `$${mil.defenceBudgetB}B`,
      sub: "annual USD",
      icon: <CurrencyDollar size={14} weight="fill" className="text-success" />,
      accent: "border-green-500/25 bg-green-500/5",
      valueColor: "text-success",
    },
  ];

  return (
    <div className="modal-tile rounded-lg p-4 mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-500/10 rounded-md border border-red-500/20">
            <Shield size={13} weight="fill" className="text-red-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Military Capacity
            </h3>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              {mil.branches.length} active service branches
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
          {totalBases} bases total
        </span>
      </div>

      {/* KPI cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {kpiCards.map((k) => (
          <div key={k.label} className={`rounded-lg border p-3 ${k.accent}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
                {k.label}
              </span>
              {k.icon}
            </div>
            <p
              className={`text-xl font-bold font-mono leading-none ${k.valueColor}`}
            >
              {k.value}
            </p>
            <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-70">
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Base deployment breakdown */}
      <div className="rounded-lg border border-border bg-background/40 p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
            Base Deployment
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-mono text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
              {mil.nationalBases} National
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
              {mil.intlBases} Overseas
            </span>
          </div>
        </div>

        {/* Stacked bar */}
        {totalBases > 0 ? (
          <>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted gap-px">
              <div
                className="h-full bg-secondary transition-all duration-700 rounded-l-full"
                style={{ width: `${nationalPct}%` }}
              />
              {intlPct > 0 && (
                <div
                  className="h-full bg-purple-500 transition-all duration-700 rounded-r-full"
                  style={{ width: `${intlPct}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] font-mono text-secondary opacity-80">
                {nationalPct.toFixed(0)}% domestic
              </span>
              <span className="text-[9px] font-mono text-purple-400 opacity-80">
                {intlPct.toFixed(0)}% international
              </span>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground font-sans italic">
            No base data available
          </p>
        )}
      </div>

      {/* Service Branches */}
      <div>
        <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
          Service Branches
        </p>
        <div className="flex flex-wrap gap-1.5">
          {mil.branches.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1 text-[10px] bg-card text-foreground border border-border px-2.5 py-1 rounded-md font-sans hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              <span className="w-1 h-1 rounded-full bg-red-400/70 shrink-0" />
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountryModal({
  country,
  onClose,
}: {
  country: Country;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "map" | "photos"
  >("overview");

  React.useEffect(() => {
    setActiveTab("overview");
  }, [country.id]);

  React.useEffect(() => {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 text-xs font-mono">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((e: any) => (
            <p key={e.name} style={{ color: e.color }}>
              {e.name}: {e.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in modal-glass border">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img
                  src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.onerror = null;
                    t.style.display = "none";
                    const fb = t.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = "flex";
                  }}
                />
                <div className="w-full h-full bg-gradient-1 items-center justify-center hidden">
                  <span className="text-lg font-bold font-mono text-primary-foreground">
                    {country.code}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold font-sans text-foreground">
                  {country.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} /> {country.capital}
                  </span>
                  <span
                    className={`text-xs border px-2 py-0.5 rounded-full font-sans ${continentColors[country.continent] ?? "text-muted-foreground border-border bg-muted"}`}
                  >
                    {country.continent}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${hdiBadge(country.humanDevelopmentIndex)}`}
                  >
                    HDI {country.humanDevelopmentIndex}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-5 bg-muted/60 rounded-xl p-1 border border-border/60">
            {(
              [
                {
                  id: "overview" as const,
                  label: "Overview",
                  icon: <ListBullets size={13} weight="fill" />,
                },
                {
                  id: "map" as const,
                  label: "Map",
                  icon: <MapTrifold size={13} weight="fill" />,
                },
                {
                  id: "photos" as const,
                  label: "Photos",
                  icon: <Images size={13} weight="fill" />,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all duration-150 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── MAP TAB ── */}
          {activeTab === "map" && (
            <div className="animate-fade-in space-y-4">
              {/* Info strip */}
              <div
                className={`rounded-xl p-4 bg-gradient-to-r ${
                  country.continent === "North America"
                    ? "from-blue-500/20 to-cyan-500/10"
                    : country.continent === "Europe"
                      ? "from-purple-500/20 to-violet-500/10"
                      : country.continent === "Asia"
                        ? "from-yellow-500/20 to-amber-500/10"
                        : country.continent === "Africa"
                          ? "from-orange-500/20 to-red-500/10"
                          : country.continent === "South America"
                            ? "from-green-500/20 to-emerald-500/10"
                            : "from-cyan-500/20 to-teal-500/10"
                } border border-border/50`}
              >
                <div className="flex flex-wrap items-center gap-4 text-sm font-sans">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={14}
                      className="text-secondary"
                      weight="fill"
                    />
                    <span className="text-muted-foreground">Capital:</span>
                    <span className="font-semibold text-foreground">
                      {country.capital}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Continent:</span>
                    <span className="font-semibold text-foreground">
                      {country.continent}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {(country.areaKm2 / 1e6).toFixed(2)}M km²
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Population:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {fmtPop(country.population)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Embedded Google Map */}
              <div
                className="relative rounded-xl overflow-hidden border border-border shadow-lg"
                style={{ height: 380 }}
              >
                <iframe
                  title={`Map of ${country.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(country.name)}&z=5&output=embed&t=m`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              {/* Location facts */}
              <div className="modal-tile rounded-xl p-4">
                <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
                  Location Facts
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "ISO Code", value: country.code },
                    { label: "Government", value: country.governmentType },
                    { label: "Currency", value: country.currency },
                    {
                      label: "HDI",
                      value: String(country.humanDevelopmentIndex),
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
                        {s.label}
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground truncate">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PHOTOS TAB ── */}
          {activeTab === "photos" &&
            (() => {
              const photos = getCountryPhotos(country);
              return (
                <div className="animate-fade-in space-y-4">
                  {/* Flag header */}
                  <div className="flex items-center gap-4 p-4 modal-tile rounded-xl">
                    <img
                      src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                      alt={`${country.name} flag`}
                      className="h-14 rounded-md border border-border shadow-md object-cover"
                      style={{ aspectRatio: "3/2" }}
                    />
                    <div>
                      <p className="text-sm font-bold font-sans text-foreground">
                        {country.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {country.code} · {country.continent}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5">
                        {country.capital} ·{" "}
                        {country.officialLanguages.join(", ")}
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {photos.length} photos
                    </span>
                  </div>
                  {/* Photo grid */}
                  <ModalPhotosGrid photos={photos} />
                </div>
              );
            })()}

          {/* ── OVERVIEW TAB ── */}
          {
            activeTab === "overview" && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      label: "GDP",
                      value: fmtGDP(country.gdp),
                      sub: country.gdp >= 1000 ? "trillion USD" : "billion USD",
                    },
                    {
                      label: "GDP Per Capita",
                      value: `$${country.gdpPerCapita.toLocaleString()}`,
                      sub: "per person",
                    },
                    {
                      label: "GDP Growth",
                      value: `${country.gdpGrowth > 0 ? "+" : ""}${country.gdpGrowth}%`,
                      sub: "annual",
                    },
                    {
                      label: "Population",
                      value: fmtPop(country.population),
                      sub: "estimated",
                    },
                    {
                      label: "Unemployment",
                      value: `${country.unemploymentRate}%`,
                      sub: "rate",
                    },
                    {
                      label: "Inflation",
                      value: `${country.inflationRate}%`,
                      sub: "annual",
                    },
                    {
                      label: "Life Expectancy",
                      value: `${country.lifeExpectancy}`,
                      sub: "years avg.",
                    },
                    {
                      label: "Trade Balance",
                      value: `${country.tradeBalance > 0 ? "+" : ""}$${country.tradeBalance}B`,
                      sub: "surplus/deficit",
                    },
                    {
                      label: "Area",
                      value: `${(country.areaKm2 / 1e6).toFixed(2)}M km²`,
                      sub: "total land",
                    },
                  ].map((s) => (
                    <div key={s.label} className="modal-tile rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-sans">
                        {s.label}
                      </p>
                      <p
                        className={`text-lg font-bold font-mono ${s.label === "Trade Balance" ? (country.tradeBalance >= 0 ? "text-success" : "text-destructive") : s.label === "GDP Growth" ? (country.gdpGrowth >= 0 ? "text-success" : "text-destructive") : "text-foreground"}`}
                      >
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {s.sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Key Industries + Biosphere */}
                {country.keyIndustries && country.keyIndustries.length > 0 && (
                  <div className="modal-tile rounded-lg p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Horizontal bar chart */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold font-sans text-foreground mb-3">
                          Most Vital Industries
                        </h3>
                        <div className="space-y-2">
                          {country.keyIndustries.map((ind) => (
                            <div
                              key={ind.name}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs font-sans text-muted-foreground w-28 shrink-0 truncate">
                                {ind.name}
                              </span>
                              <div className="flex-1 h-4 bg-background rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(ind.gdpShare / 50) * 100}%`,
                                    backgroundColor: ind.color,
                                    opacity: 0.85,
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-mono w-9 text-right shrink-0"
                                style={{ color: ind.color }}
                              >
                                {ind.gdpShare}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Biosphere donut */}
                      <div className="shrink-0 flex flex-col items-center">
                        <h3 className="text-sm font-semibold font-sans text-foreground mb-1">
                          Biosphere
                        </h3>
                        <div className="relative w-32 h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getBiosphere(country)}
                                cx="50%"
                                cy="50%"
                                innerRadius={34}
                                outerRadius={55}
                                paddingAngle={2}
                                dataKey="value"
                                isAnimationActive
                                animationDuration={700}
                              >
                                {getBiosphere(country).map((entry, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={entry.color}
                                    fillOpacity={0.9}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload?.length) {
                                    const d = payload[0].payload;
                                    return (
                                      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                                        <p className="font-semibold text-foreground">
                                          {d.label}
                                        </p>
                                        <p style={{ color: d.color }}>
                                          {d.value}%
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-1 space-y-0.5 w-full">
                          {getBiosphere(country).map((seg) => (
                            <div
                              key={seg.label}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="text-xs font-sans text-muted-foreground truncate">
                                {seg.label}
                              </span>
                              <span
                                className="text-xs font-mono ml-auto"
                                style={{ color: seg.color }}
                              >
                                {seg.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Energy */}
                {country.energy && (
                  <EnergySection
                    energy={country.energy}
                    countryId={country.id}
                  />
                )}

                {/* Military */}
                {getMilitary(country.id) && (
                  <MilitarySection mil={getMilitary(country.id)!} />
                )}

                {/* Languages & Government */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2">
                      Government
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {country.governmentType}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {country.headOfState}
                    </p>
                  </div>
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2">
                      Languages · Currency
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {country.officialLanguages.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {country.currency}
                      {country.gdpGrowth > 0 ? " · Growing" : " · Contracting"}
                    </p>
                  </div>
                </div>

                {/* Spoken Languages, Landmarks, Religions */}
                {!!(
                  (country as any).spokenLanguages?.length ||
                  (country as any).landmarks?.length ||
                  (country as any).religions?.length
                ) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(country as any).spokenLanguages?.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                          Languages Spoken
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(country as any).spokenLanguages.map((l: string) => (
                            <span
                              key={l}
                              className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(country as any).landmarks?.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                          Top Landmarks
                        </p>
                        <ul className="space-y-1">
                          {(country as any).landmarks.map((lm: string) => (
                            <li
                              key={lm}
                              className="text-xs text-foreground font-sans flex items-start gap-1.5"
                            >
                              <span className="text-secondary mt-0.5">•</span>
                              {lm}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(country as any).religions?.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                          Religions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(country as any).religions.map((r: string) => (
                            <span
                              key={r}
                              className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SOCIOLOGICAL BREAKDOWN ── */}
                <CountrySociologicalBreakdown country={country} />
              </>
            ) /* end overview tab */
          }
        </div>
      </div>
    </div>
  );
}

// ── Inline photo grid with lightbox used by CountryModal photos tab ──────────
function ModalPhotosGrid({
  photos,
}: {
  photos: { url: string; caption: string }[];
}) {
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIdx(idx)}
            className="group relative rounded-lg overflow-hidden border border-border hover:border-secondary/50 transition-all cursor-pointer"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="absolute bottom-0 left-0 right-0 p-2 text-[10px] text-white font-sans leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.caption}
            </p>
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={20} />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length);
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx + 1) % photos.length);
            }}
          >
            <ArrowRight size={18} />
          </button>
          <div
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIdx].url}
              alt={photos[lightboxIdx].caption}
              className="w-full max-h-[75vh] object-cover rounded-xl shadow-2xl"
            />
            <p className="text-center text-sm text-white/70 mt-3 font-sans">
              {photos[lightboxIdx].caption}
            </p>
            <p className="text-center text-xs text-white/40 mt-1 font-mono">
              {lightboxIdx + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function EnergySection({
  energy,
  countryId,
}: {
  energy: EnergyStats;
  countryId: string;
}) {
  const netBalance = energy.totalProductionTWh - energy.totalUseTWh;
  const isExporter = netBalance >= 0;
  const fmtTWh = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)} PWh` : `${n.toLocaleString()} TWh`;

  return (
    <div className="modal-tile rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/10 rounded-md border border-yellow-500/20">
            <svg
              width="13"
              height="13"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-yellow-400"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Energy
            </h3>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              Use, production & energy mix
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isExporter ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-orange-400 border-orange-500/30 bg-orange-500/10"}`}
        >
          {isExporter
            ? `Net Exporter +${fmtTWh(netBalance)}`
            : `Net Importer ${fmtTWh(Math.abs(netBalance))}`}
        </span>
      </div>

      {/* Use vs Production KPI row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider mb-1">
            Total Consumption
          </p>
          <p className="text-lg font-bold font-mono text-yellow-400 leading-none">
            {fmtTWh(energy.totalUseTWh)}
          </p>
          <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-70">
            per year
          </p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider mb-1">
            Total Production
          </p>
          <p className="text-lg font-bold font-mono text-blue-400 leading-none">
            {fmtTWh(energy.totalProductionTWh)}
          </p>
          <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-70">
            per year
          </p>
        </div>
      </div>

      {/* Energy Mix */}
      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
        Energy Mix (% of production)
      </p>
      <div className="space-y-2 mb-3">
        {energy.mix.map((src) => (
          <div key={src.source} className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-muted-foreground w-24 shrink-0 truncate">
              {src.source}
            </span>
            <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${src.pct}%`,
                  backgroundColor: src.color,
                  opacity: 0.85,
                }}
              />
            </div>
            <span
              className="text-[11px] font-mono w-9 text-right shrink-0"
              style={{ color: src.color }}
            >
              {src.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Stacked mix bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {energy.mix.map((src) => (
          <div
            key={src.source}
            className="h-full transition-all duration-700"
            style={{ width: `${src.pct}%`, backgroundColor: src.color }}
            title={`${src.source}: ${src.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {energy.mix.map((src) => (
          <span
            key={src.source}
            className="flex items-center gap-1 text-[10px] font-sans text-muted-foreground"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: src.color }}
            />
            {src.source}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Country Sociological Breakdown ──────────────────────────────────────────
const SOCIO_PALETTE = [
  "#60a5fa",
  "#f87171",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#fb923c",
  "#38bdf8",
  "#e879f9",
  "#4ade80",
  "#f472b6",
];

function CountrySociologicalBreakdown({ country }: { country: Country }) {
  const religions = (country as any).religions as string[] | undefined;
  const spokenLanguages = (country as any).spokenLanguages as
    | string[]
    | undefined;
  const politicalIdeologies = (country as any).politicalIdeologies as
    | string[]
    | undefined;
  const governanceStyle = (country as any).governanceStyle as
    | string[]
    | undefined;

  const hasSocioData = !!(
    religions?.length ||
    spokenLanguages?.length ||
    politicalIdeologies?.length ||
    governanceStyle?.length ||
    country.lifeExpectancy ||
    country.humanDevelopmentIndex
  );

  if (!hasSocioData) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-violet-500/10 rounded-md border border-violet-500/20">
          <Users size={13} weight="fill" className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
            Sociological Breakdown
          </h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            People, culture, beliefs &amp; governance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Religion */}
        {religions && religions.length > 0 && (
          <div className="modal-tile rounded-lg p-4">
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
              Religion / Belief Systems
            </p>
            <div className="space-y-1.5">
              {religions.map((r, i) => (
                <div key={r} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: SOCIO_PALETTE[i % SOCIO_PALETTE.length],
                    }}
                  />
                  <span className="text-[11px] font-sans text-foreground flex-1">
                    {r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {spokenLanguages && spokenLanguages.length > 0 && (
          <div className="modal-tile rounded-lg p-4">
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
              Languages Spoken
            </p>
            <div className="flex flex-wrap gap-1.5">
              {spokenLanguages.map((l, i) => (
                <span
                  key={l}
                  className="text-[11px] font-sans px-2 py-0.5 rounded-full border"
                  style={{
                    color: SOCIO_PALETTE[i % SOCIO_PALETTE.length],
                    borderColor: SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "44",
                    backgroundColor:
                      SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "18",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Human Development */}
        <div className="modal-tile rounded-lg p-4">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-3">
            Human Development
          </p>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground font-sans">
                  HDI Score
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {country.humanDevelopmentIndex}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${country.humanDevelopmentIndex * 100}%`,
                    background:
                      country.humanDevelopmentIndex >= 0.8
                        ? "#34d399"
                        : country.humanDevelopmentIndex >= 0.6
                          ? "#fbbf24"
                          : "#f87171",
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] mt-0.5 text-muted-foreground">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Very High</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-[10px] text-muted-foreground font-sans">
                Life Expectancy
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {country.lifeExpectancy} yrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-sans">
                Population
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {fmtPop(country.population)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-sans">
                Official Language(s)
              </span>
              <span className="text-xs font-sans text-foreground truncate max-w-[140px] text-right">
                {country.officialLanguages.join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Political & Governance Culture */}
        <div className="modal-tile rounded-lg p-4">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
            Political &amp; Governance Culture
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground font-sans mb-1">
                Government Type
              </p>
              <p className="text-xs font-sans text-foreground">
                {country.governmentType}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-sans mb-1">
                Head of State
              </p>
              <p className="text-xs font-sans text-foreground">
                {country.headOfState}
              </p>
            </div>
            {politicalIdeologies && politicalIdeologies.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-sans mb-1">
                  Political Ideologies
                </p>
                <div className="flex flex-wrap gap-1">
                  {politicalIdeologies.map((id, i) => (
                    <span
                      key={id}
                      className="text-[10px] font-sans px-1.5 py-0.5 rounded border"
                      style={{
                        color: SOCIO_PALETTE[i % SOCIO_PALETTE.length],
                        borderColor:
                          SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "44",
                        backgroundColor:
                          SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "18",
                      }}
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {governanceStyle && governanceStyle.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-sans mb-1">
                  Governance Style
                </p>
                <div className="flex flex-wrap gap-1">
                  {governanceStyle.map((gs, i) => (
                    <span
                      key={gs}
                      className="text-[10px] font-sans px-1.5 py-0.5 rounded border bg-muted/60 text-muted-foreground border-border"
                    >
                      {gs}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-sans text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-mono w-12 text-right shrink-0"
        style={{ color }}
      >
        {typeof value === "number" && value % 1 !== 0
          ? value.toFixed(1)
          : value}
      </span>
    </div>
  );
}

// ── Per-country landmark photo sets ──────────────────────────────────────────
const COUNTRY_PHOTOS: Record<string, { url: string; caption: string }[]> = {
  us: [
    {
      url: "https://images.unsplash.com/photo-1490642914619-7955a3fd483c?w=800&q=80",
      caption: "Grand Canyon, Arizona",
    },
    {
      url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80",
      caption: "New York City Skyline",
    },
    {
      url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      caption: "Golden Gate Bridge, San Francisco",
    },
    {
      url: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
      caption: "Yellowstone National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1597149154484-f46a213c21de?w=800&q=80",
      caption: "Statue of Liberty, New York",
    },
    {
      url: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
      caption: "Washington D.C. Capitol",
    },
  ],
  ca: [
    {
      url: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80",
      caption: "Niagara Falls, Ontario",
    },
    {
      url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Banff National Park, Alberta",
    },
    {
      url: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80",
      caption: "Toronto Skyline",
    },
    {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "Vancouver, British Columbia",
    },
    {
      url: "https://images.unsplash.com/photo-1601238585539-48e56b0a9e3c?w=800&q=80",
      caption: "Old Quebec City",
    },
    {
      url: "https://images.unsplash.com/photo-1616430426562-e1af16e4e6b8?w=800&q=80",
      caption: "Moraine Lake, Alberta",
    },
  ],
  gb: [
    {
      url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
      caption: "Big Ben & Westminster, London",
    },
    {
      url: "https://images.unsplash.com/photo-1543716091-a840c05249ec?w=800&q=80",
      caption: "Edinburgh Castle, Scotland",
    },
    {
      url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
      caption: "Stonehenge, Wiltshire",
    },
    {
      url: "https://images.unsplash.com/photo-1472756254485-bf517edec2a4?w=800&q=80",
      caption: "Lake District, England",
    },
    {
      url: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800&q=80",
      caption: "Tower Bridge, London",
    },
    {
      url: "https://images.unsplash.com/photo-1425321053535-0d344af0ce35?w=800&q=80",
      caption: "Cliffs of Moher (Ireland)",
    },
  ],
  fr: [
    {
      url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
      caption: "Eiffel Tower, Paris",
    },
    {
      url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&q=80",
      caption: "Palace of Versailles",
    },
    {
      url: "https://images.unsplash.com/photo-1596442880282-41cf9a2cdb48?w=800&q=80",
      caption: "Loire Valley Châteaux",
    },
    {
      url: "https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=800&q=80",
      caption: "Mont Saint-Michel, Normandy",
    },
    {
      url: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800&q=80",
      caption: "French Riviera, Nice",
    },
    {
      url: "https://images.unsplash.com/photo-1541960071727-c531398e7494?w=800&q=80",
      caption: "Lavender Fields, Provence",
    },
  ],
  de: [
    {
      url: "https://images.unsplash.com/photo-1560090995-e9a16818b4c5?w=800&q=80",
      caption: "Neuschwanstein Castle, Bavaria",
    },
    {
      url: "https://images.unsplash.com/photo-1579166765019-d6e0dc2d8e2b?w=800&q=80",
      caption: "Brandenburg Gate, Berlin",
    },
    {
      url: "https://images.unsplash.com/photo-1580537660053-b1f0e65e2a23?w=800&q=80",
      caption: "Cologne Cathedral",
    },
    {
      url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
      caption: "Black Forest",
    },
    {
      url: "https://images.unsplash.com/photo-1554560665-7b35baa8ed36?w=800&q=80",
      caption: "Hamburg Speicherstadt",
    },
    {
      url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      caption: "Munich Beer Garden",
    },
  ],
  jp: [
    {
      url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80",
      caption: "Mount Fuji, Honshu",
    },
    {
      url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
      caption: "Fushimi Inari Shrine, Kyoto",
    },
    {
      url: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
      caption: "Tokyo Shibuya Crossing",
    },
    {
      url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      caption: "Nara Deer Park",
    },
    {
      url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Hiroshima Peace Memorial",
    },
    {
      url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80",
      caption: "Osaka Castle",
    },
  ],
  cn: [
    {
      url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
      caption: "Great Wall of China",
    },
    {
      url: "https://images.unsplash.com/photo-1584793797613-f3b48e4c0a98?w=800&q=80",
      caption: "Forbidden City, Beijing",
    },
    {
      url: "https://images.unsplash.com/photo-1537519946571-2834ad0c29ba?w=800&q=80",
      caption: "Li River, Guilin",
    },
    {
      url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
      caption: "Shanghai Skyline",
    },
    {
      url: "https://images.unsplash.com/photo-1513415277900-a62401e19be4?w=800&q=80",
      caption: "Terracotta Army, Xi&#39;an",
    },
    {
      url: "https://images.unsplash.com/photo-1568275279434-ee8948fe7d63?w=800&q=80",
      caption: "Yellow Mountains (Huangshan)",
    },
  ],
  in: [
    {
      url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
      caption: "Taj Mahal, Agra",
    },
    {
      url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
      caption: "Jaipur Pink City, Rajasthan",
    },
    {
      url: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
      caption: "Kerala Backwaters",
    },
    {
      url: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800&q=80",
      caption: "Varanasi Ghats, Ganges",
    },
    {
      url: "https://images.unsplash.com/photo-1561361058-c24e0a9b3e09?w=800&q=80",
      caption: "Hawa Mahal, Jaipur",
    },
    {
      url: "https://images.unsplash.com/photo-1519911208978-e0e614f3fc13?w=800&q=80",
      caption: "Mumbai Gateway of India",
    },
  ],
  br: [
    {
      url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
      caption: "Christ the Redeemer, Rio de Janeiro",
    },
    {
      url: "https://images.unsplash.com/photo-1598977679564-43bd5b5c1c3b?w=800&q=80",
      caption: "Iguazu Falls",
    },
    {
      url: "https://images.unsplash.com/photo-1567324823810-4f45d6d4dd4a?w=800&q=80",
      caption: "Amazon Rainforest",
    },
    {
      url: "https://images.unsplash.com/photo-1539632346654-dd4c3cffad8c?w=800&q=80",
      caption: "Copacabana Beach, Rio",
    },
    {
      url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
      caption: "Pantanal Wetlands",
    },
    {
      url: "https://images.unsplash.com/photo-1616430426562-e1af16e4e6b8?w=800&q=80",
      caption: "São Paulo Skyline",
    },
  ],
  au_oc: [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Sydney Opera House",
    },
    {
      url: "https://images.unsplash.com/photo-1520395612e4a7e5a41524db9d91fcf4?w=800&q=80",
      caption: "Great Barrier Reef",
    },
    {
      url: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800&q=80",
      caption: "Uluru (Ayers Rock), Northern Territory",
    },
    {
      url: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80",
      caption: "Great Ocean Road, Victoria",
    },
    {
      url: "https://images.unsplash.com/photo-1572175235055-1f9cc9a4aea0?w=800&q=80",
      caption: "Sydney Harbour Bridge",
    },
    {
      url: "https://images.unsplash.com/photo-1559674780-7fa57f47c7e3?w=800&q=80",
      caption: "Blue Mountains, New South Wales",
    },
  ],
  it: [
    {
      url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
      caption: "Colosseum, Rome",
    },
    {
      url: "https://images.unsplash.com/photo-1534643960519-11ad79bc19df?w=800&q=80",
      caption: "Venice Canals",
    },
    {
      url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
      caption: "Cinque Terre, Liguria",
    },
    {
      url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Florence Cathedral (Duomo)",
    },
    {
      url: "https://images.unsplash.com/photo-1544085313-a5b04a65bcfe?w=800&q=80",
      caption: "Amalfi Coast",
    },
    {
      url: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&q=80",
      caption: "Leaning Tower of Pisa",
    },
  ],
  es: [
    {
      url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
      caption: "Sagrada Família, Barcelona",
    },
    {
      url: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80",
      caption: "Alhambra Palace, Granada",
    },
    {
      url: "https://images.unsplash.com/photo-1543442076-93a25e1474f1?w=800&q=80",
      caption: "Park Güell, Barcelona",
    },
    {
      url: "https://images.unsplash.com/photo-1559762717-99673c3b3f90?w=800&q=80",
      caption: "Plaza Mayor, Madrid",
    },
    {
      url: "https://images.unsplash.com/photo-1560748952-5e40caed0e6a?w=800&q=80",
      caption: "Camino de Santiago",
    },
    {
      url: "https://images.unsplash.com/photo-1516476667791-2efcbeffdf95?w=800&q=80",
      caption: "Ibiza Coastline",
    },
  ],
  ru: [
    {
      url: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&q=80",
      caption: "Red Square, Moscow",
    },
    {
      url: "https://images.unsplash.com/photo-1556983703-27576e5afa24?w=800&q=80",
      caption: "St. Basil&#39;s Cathedral, Moscow",
    },
    {
      url: "https://images.unsplash.com/photo-1529988885170-24e5c8571f91?w=800&q=80",
      caption: "Lake Baikal, Siberia",
    },
    {
      url: "https://images.unsplash.com/photo-1608826063534-2c1ecaf4fe9d?w=800&q=80",
      caption: "Hermitage Museum, St. Petersburg",
    },
    {
      url: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&q=80",
      caption: "Churches of the Kremlin",
    },
    {
      url: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80",
      caption: "St. Petersburg Canals",
    },
  ],
  sa: [
    {
      url: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
      caption: "Masjid al-Haram, Mecca",
    },
    {
      url: "https://images.unsplash.com/photo-1617893497756-d4f5b7f4892d?w=800&q=80",
      caption: "Al-Ula Ancient City",
    },
    {
      url: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80",
      caption: "Riyadh Kingdom Tower",
    },
    {
      url: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&q=80",
      caption: "Hegra (Mada&#39;in Saleh)",
    },
    {
      url: "https://images.unsplash.com/photo-1620459482813-91de1d2f9892?w=800&q=80",
      caption: "Edge of the World, Riyadh",
    },
    {
      url: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80",
      caption: "Diriyah Historic District",
    },
  ],
  za: [
    {
      url: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
      caption: "Table Mountain, Cape Town",
    },
    {
      url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      caption: "Kruger National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=800&q=80",
      caption: "Cape of Good Hope",
    },
    {
      url: "https://images.unsplash.com/photo-1590688944704-07d3c2c8b226?w=800&q=80",
      caption: "Boulders Penguin Colony",
    },
    {
      url: "https://images.unsplash.com/photo-1531928351158-2197288a4c09?w=800&q=80",
      caption: "Garden Route Coastline",
    },
    {
      url: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&q=80",
      caption: "Johannesburg Skyline",
    },
  ],
};

// Continent fallback galleries
const CONTINENT_PHOTOS: Record<string, { url: string; caption: string }[]> = {
  "North America": [
    {
      url: "https://images.unsplash.com/photo-1490642914619-7955a3fd483c?w=800&q=80",
      caption: "Grand Canyon",
    },
    {
      url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80",
      caption: "New York City",
    },
    {
      url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      caption: "Golden Gate Bridge",
    },
    {
      url: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80",
      caption: "Niagara Falls",
    },
    {
      url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Banff National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
      caption: "Yellowstone",
    },
  ],
  "South America": [
    {
      url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
      caption: "Christ the Redeemer, Rio",
    },
    {
      url: "https://images.unsplash.com/photo-1598977679564-43bd5b5c1c3b?w=800&q=80",
      caption: "Iguazu Falls",
    },
    {
      url: "https://images.unsplash.com/photo-1567324823810-4f45d6d4dd4a?w=800&q=80",
      caption: "Amazon Rainforest",
    },
    {
      url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
      caption: "Machu Picchu, Peru",
    },
    {
      url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      caption: "Patagonia, Argentina",
    },
    {
      url: "https://images.unsplash.com/photo-1608082633671-1b4d6b02e51a?w=800&q=80",
      caption: "Atacama Desert, Chile",
    },
  ],
  Europe: [
    {
      url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
      caption: "Eiffel Tower, Paris",
    },
    {
      url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
      caption: "Colosseum, Rome",
    },
    {
      url: "https://images.unsplash.com/photo-1560090995-e9a16818b4c5?w=800&q=80",
      caption: "Neuschwanstein Castle, Germany",
    },
    {
      url: "https://images.unsplash.com/photo-1543482791-5f7c4e6f3093?w=800&q=80",
      caption: "Santorini, Greece",
    },
    {
      url: "https://images.unsplash.com/photo-1534643960519-11ad79bc19df?w=800&q=80",
      caption: "Venice Canals, Italy",
    },
    {
      url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
      caption: "Big Ben, London",
    },
  ],
  Asia: [
    {
      url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
      caption: "Great Wall of China",
    },
    {
      url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80",
      caption: "Mount Fuji, Japan",
    },
    {
      url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
      caption: "Taj Mahal, India",
    },
    {
      url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      caption: "Bali Rice Terraces",
    },
    {
      url: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
      caption: "Kerala Backwaters, India",
    },
    {
      url: "https://images.unsplash.com/photo-1549273932-fdec6f3e9e69?w=800&q=80",
      caption: "Angkor Wat, Cambodia",
    },
  ],
  Africa: [
    {
      url: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
      caption: "Table Mountain, South Africa",
    },
    {
      url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      caption: "Kruger National Park, Safari",
    },
    {
      url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
      caption: "Sahara Desert Dunes",
    },
    {
      url: "https://images.unsplash.com/photo-1531975474574-e9d2732e8386?w=800&q=80",
      caption: "Victoria Falls, Zambia/Zimbabwe",
    },
    {
      url: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
      caption: "Pyramids of Giza, Egypt",
    },
    {
      url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Serengeti, Tanzania",
    },
  ],
  Oceania: [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Sydney Opera House, Australia",
    },
    {
      url: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800&q=80",
      caption: "Uluru, Australia",
    },
    {
      url: "https://images.unsplash.com/photo-1520459990304-7ef7a7c8bb46?w=800&q=80",
      caption: "Milford Sound, New Zealand",
    },
    {
      url: "https://images.unsplash.com/photo-1559762717-99673c3b3f90?w=800&q=80",
      caption: "Great Barrier Reef",
    },
    {
      url: "https://images.unsplash.com/photo-1480654240659-4d3c38f47c9f?w=800&q=80",
      caption: "Fiji Islands",
    },
    {
      url: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?w=800&q=80",
      caption: "Bora Bora, French Polynesia",
    },
  ],
};

function getCountryPhotos(country: Country) {
  return (
    COUNTRY_PHOTOS[country.id] ??
    CONTINENT_PHOTOS[country.continent] ??
    CONTINENT_PHOTOS["Asia"]
  );
}

function CountryDetailPanel({
  country,
  onClose,
  onCompare,
}: {
  country: Country;
  onClose: () => void;
  onCompare?: (c: Country) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "photos">(
    "overview",
  );
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const photos = getCountryPhotos(country);

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: <ListBullets size={13} weight="fill" />,
    },
    {
      id: "map" as const,
      label: "Map",
      icon: <MapTrifold size={13} weight="fill" />,
    },
    {
      id: "photos" as const,
      label: "Photos",
      icon: <Images size={13} weight="fill" />,
    },
  ];

  return (
    <div className="modal-glass border rounded-xl animate-fade-in overflow-hidden">
      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={20} />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length);
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx + 1) % photos.length);
            }}
          >
            <ArrowRight size={18} />
          </button>
          <div
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIdx].url}
              alt={photos[lightboxIdx].caption}
              className="w-full max-h-[75vh] object-cover rounded-xl shadow-2xl"
            />
            <p className="text-center text-sm text-white/70 mt-3 font-sans">
              {photos[lightboxIdx].caption}
            </p>
            <p className="text-center text-xs text-white/40 mt-1 font-mono">
              {lightboxIdx + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}

      {/* Header (always visible) */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
              <img
                src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                alt={`${country.name} flag`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget;
                  t.onerror = null;
                  t.style.display = "none";
                  const fb = t.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <div className="absolute inset-0 bg-gradient-1 items-center justify-center hidden">
                <span className="text-lg font-bold font-mono text-primary-foreground">
                  {country.code}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-foreground">
                {country.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> {country.capital}
                </span>
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-sans ${continentColors[country.continent] ?? "text-muted-foreground border-border bg-muted"}`}
                >
                  {country.continent}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${hdiBadge(country.humanDevelopmentIndex)}`}
                >
                  HDI {country.humanDevelopmentIndex}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onCompare && (
              <button
                onClick={() => onCompare(country)}
                className="px-2.5 py-1 rounded-full text-xs bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors font-sans cursor-pointer flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8h12M10 4l4 4-4 4M6 12l-4-4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Compare
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground hover:text-foreground transition-colors font-sans cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-sans border-b-2 transition-colors cursor-pointer -mb-px ${
                activeTab === tab.id
                  ? "border-secondary text-secondary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* ── MAP TAB ── */}
        {activeTab === "map" && (
          <div className="animate-fade-in">
            <div
              className="rounded-xl overflow-hidden border border-border mb-4"
              style={{ height: 340 }}
            >
              <iframe
                title={`Map of ${country.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(country.name)}&output=embed&z=5`}
              />
            </div>
            {/* Location fact strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Capital", value: country.capital },
                { label: "Continent", value: country.continent },
                {
                  label: "Area",
                  value: `${(country.areaKm2 / 1e6).toFixed(2)}M km²`,
                },
                {
                  label: "Population",
                  value: (() => {
                    const n = country.population;
                    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
                    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                    return `${(n / 1000).toFixed(0)}K`;
                  })(),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="modal-tile rounded-lg p-3 text-center"
                >
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === "photos" && (
          <div className="animate-fade-in">
            {/* Flag header */}
            <div className="flex items-center gap-4 p-4 modal-tile rounded-xl mb-4">
              <img
                src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                alt={`${country.name} flag`}
                className="h-14 rounded-md border border-border shadow-md object-cover"
                style={{ aspectRatio: "3/2" }}
              />
              <div>
                <p className="text-sm font-bold font-sans text-foreground">
                  {country.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {country.code} · {country.continent}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  {country.capital} · {country.officialLanguages.join(", ")}
                </p>
              </div>
            </div>
            {/* Photo grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIdx(idx)}
                  className="group relative rounded-lg overflow-hidden border border-border hover:border-secondary/50 transition-all cursor-pointer"
                  style={{ aspectRatio: "4/3" }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="absolute bottom-0 left-0 right-0 p-2 text-[10px] text-white font-sans leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div>
            {/* ── ECONOMIC OVERVIEW ── */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-widest mb-3">
                Economic Overview
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  {
                    label: "GDP",
                    value: fmtGDP(country.gdp),
                    color: "text-secondary",
                  },
                  {
                    label: "Per Capita",
                    value: `$${country.gdpPerCapita.toLocaleString()}`,
                    color: "text-secondary",
                  },
                  {
                    label: "GDP Growth",
                    value: `${country.gdpGrowth > 0 ? "+" : ""}${country.gdpGrowth}%`,
                    color:
                      country.gdpGrowth >= 0
                        ? "text-success"
                        : "text-destructive",
                  },
                  {
                    label: "Trade Balance",
                    value: `${country.tradeBalance > 0 ? "+" : ""}$${country.tradeBalance}B`,
                    color:
                      country.tradeBalance >= 0
                        ? "text-success"
                        : "text-destructive",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="modal-tile rounded-lg p-3 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                      {s.label}
                    </p>
                    <p className={`text-base font-bold font-mono ${s.color}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* Score bars: economic health */}
              <div className="modal-tile rounded-lg p-4 space-y-2">
                <ScoreBar
                  label="Unemployment"
                  value={country.unemploymentRate}
                  max={35}
                  color="#fb923c"
                />
                <ScoreBar
                  label="Inflation Rate"
                  value={country.inflationRate}
                  max={50}
                  color="#f87171"
                />
                <ScoreBar
                  label="HDI Score"
                  value={country.humanDevelopmentIndex * 100}
                  max={100}
                  color="#34d399"
                />
                <ScoreBar
                  label="Life Expectancy"
                  value={country.lifeExpectancy}
                  max={90}
                  color="#60a5fa"
                />
              </div>
            </div>

            {/* ── GDP TREND ── */}
            {country.trends && country.trends.length > 0 && (
              <div className="modal-tile rounded-lg p-4 mb-5">
                <p className="text-xs font-semibold font-sans text-foreground mb-3">
                  GDP Trend (Billion USD)
                </p>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={country.trends}
                      margin={{ top: 2, right: 4, left: 0, bottom: 2 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222,30%,22%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{
                          fill: "hsl(0,0%,55%)",
                          fontSize: 9,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(0,0%,55%)",
                          fontSize: 9,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}T`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-secondary">
                                ${payload[0].value?.toLocaleString()}B GDP
                              </p>
                            </div>
                          ) : null
                        }
                      />
                      <Bar dataKey="gdp" radius={[3, 3, 0, 0]}>
                        {country.trends.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === country.trends.length - 1
                                ? "hsl(200,85%,50%)"
                                : "hsl(200,55%,35%)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── KEY INDUSTRIES + BIOSPHERE ── */}
            {country.keyIndustries && country.keyIndustries.length > 0 && (
              <div className="modal-tile rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-xs font-semibold font-sans text-foreground mb-3 uppercase tracking-wide">
                      Key Industries
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      {country.keyIndustries.map((ind) => (
                        <div key={ind.name} className="flex items-center gap-2">
                          <span className="text-xs font-sans text-muted-foreground w-28 shrink-0 truncate">
                            {ind.name}
                          </span>
                          <div className="flex-1 h-3.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${(ind.gdpShare / 50) * 100}%`,
                                backgroundColor: ind.color,
                                opacity: 0.85,
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono w-9 text-right shrink-0"
                            style={{ color: ind.color }}
                          >
                            {ind.gdpShare}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center">
                    <h3 className="text-xs font-semibold font-sans text-foreground mb-1 uppercase tracking-wide">
                      Biosphere
                    </h3>
                    <div className="relative w-28 h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getBiosphere(country)}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                            isAnimationActive
                            animationDuration={700}
                          >
                            {getBiosphere(country).map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={entry.color}
                                fillOpacity={0.9}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                                  <p className="font-semibold text-foreground">
                                    {payload[0].payload.label}
                                  </p>
                                  <p
                                    style={{ color: payload[0].payload.color }}
                                  >
                                    {payload[0].payload.value}%
                                  </p>
                                </div>
                              ) : null
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-1 space-y-0.5 w-full max-h-28 overflow-y-auto">
                      {getBiosphere(country).map((seg) => (
                        <div
                          key={seg.label}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-[10px] font-sans text-muted-foreground truncate">
                            {seg.label}
                          </span>
                          <span
                            className="text-[10px] font-mono ml-auto"
                            style={{ color: seg.color }}
                          >
                            {seg.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ENERGY ── */}
            {country.energy && (
              <EnergySection energy={country.energy} countryId={country.id} />
            )}

            {/* ── MILITARY ── */}
            {getMilitary(country.id) && (
              <MilitarySection mil={getMilitary(country.id)!} />
            )}

            {/* ── GOVERNANCE + PEOPLE ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="modal-tile rounded-lg p-4">
                <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-2">
                  Governance
                </p>
                <p className="text-sm font-semibold font-sans text-foreground">
                  {country.governmentType}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  {country.headOfState}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  {country.currency}
                  {country.gdpGrowth > 0 ? " · Growing" : " · Contracting"}
                </p>
              </div>
              <div className="modal-tile rounded-lg p-4">
                <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-2">
                  People
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Population
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {(() => {
                        const n = country.population;
                        if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
                        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                        return `${(n / 1000).toFixed(0)}K`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Area
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {(country.areaKm2 / 1e6).toFixed(2)}M km²
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Language(s)
                    </p>
                    <p className="text-xs font-sans text-foreground truncate">
                      {country.officialLanguages.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Life Expect.
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {country.lifeExpectancy} yrs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spoken Languages, Landmarks, Religions */}
            {!!(
              (country as any).spokenLanguages?.length ||
              (country as any).landmarks?.length ||
              (country as any).religions?.length
            ) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(country as any).spokenLanguages?.length > 0 && (
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                      Languages Spoken
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(country as any).spokenLanguages.map((l: string) => (
                        <span
                          key={l}
                          className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(country as any).landmarks?.length > 0 && (
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                      Top Landmarks
                    </p>
                    <ul className="space-y-1">
                      {(country as any).landmarks.map((lm: string) => (
                        <li
                          key={lm}
                          className="text-xs text-foreground font-sans flex items-start gap-1.5"
                        >
                          <span className="text-secondary mt-0.5">•</span>
                          {lm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(country as any).religions?.length > 0 && (
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                      Religions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(country as any).religions.map((r: string) => (
                        <span
                          key={r}
                          className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SOCIOLOGICAL BREAKDOWN ── */}
            <CountrySociologicalBreakdown country={country} />
          </div>
        )}
      </div>
    </div>
  );
}

export function CountriesPage() {
  const {
    countries: liveCountries,
    isRefreshing,
    lastUpdated,
    patchedCount,
    refresh,
  } = useLiveData();
  const [search, setSearch] = useState("");
  const [continentFilter, setContinentFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdp" | "population" | "gdpGrowth" | "humanDevelopmentIndex"
  >("gdp");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [modalCountry, setModalCountry] = useState<Country | null>(null);

  const continents = [
    "All",
    "North America",
    "Asia",
    "Europe",
    "South America",
    "Oceania",
  ];

  const filtered = liveCountries
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchContinent =
        continentFilter === "All" || c.continent === continentFilter;
      return matchSearch && matchContinent;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/20 rounded-lg">
              <Globe size={26} weight="fill" className="text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans text-foreground">
                Countries
              </h1>
              <p className="text-muted-foreground text-sm font-sans">
                In-depth data on sovereign nations — economics, population,
                governance, and development
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lastUpdated && (
              <p className="text-xs text-muted-foreground font-mono hidden sm:block">
                Live · {patchedCount} updated ·{" "}
                {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live data"
            >
              <ArrowsClockwise
                size={13}
                className={isRefreshing ? "animate-spin" : ""}
              />
              {isRefreshing ? "Updating…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Countries Tracked",
              value: "195+",
              color: "text-secondary",
            },
            {
              label: "World Population",
              value: "8.12B",
              color: "text-success",
            },
            { label: "Global GDP", value: "$104.5T", color: "text-warning" },
            { label: "Avg HDI", value: "0.739", color: "text-secondary" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className={`text-xl font-bold font-mono ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Unified Search + Filter Bar */}
        <div className="flex flex-col bg-card border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              size={16}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {continents.map((c) => (
              <button
                key={c}
                onClick={() => setContinentFilter(c)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  continentFilter === c
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {c}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdp">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="gdpGrowth">Sort: GDP Growth</option>
              <option value="humanDevelopmentIndex">Sort: HDI</option>
            </select>
          </div>
        </div>

        {modalCountry && (
          <CountryModal
            country={modalCountry}
            onClose={() => setModalCountry(null)}
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Country Cards */}
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((country) => (
                <article
                  key={country.id}
                  onClick={() => setModalCountry(country)}
                  className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40"
                >
                  {/* Card header — flag background + name */}
                  <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                    {/* Flag as blurred background */}
                    <img
                      src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105 select-none pointer-events-none"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-card/60 via-card/70 to-card pointer-events-none" />
                    {/* Content */}
                    <div className="relative flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                        <img
                          src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                          alt={`${country.name} flag`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const t = e.currentTarget;
                            t.onerror = null;
                            t.style.display = "none";
                            const fb =
                              t.nextElementSibling as HTMLElement | null;
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-1 items-center justify-center hidden">
                          <span className="text-xs font-bold font-mono text-primary-foreground">
                            {country.code}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold font-sans text-foreground text-sm">
                          {country.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-sans">
                          {country.capital}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`relative text-xs border px-2 py-0.5 rounded-full font-sans shrink-0 ${continentColors[country.continent] ?? "text-muted-foreground border-border bg-muted"}`}
                    >
                      {country.continent}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        GDP
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground">
                        {fmtGDP(country.gdp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        GDP Growth
                      </p>
                      <p
                        className={`text-sm font-bold font-mono ${country.gdpGrowth >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {country.gdpGrowth >= 0 ? "+" : ""}
                        {country.gdpGrowth}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        Population
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground">
                        {fmtPop(country.population)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        HDI
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground">
                        {country.humanDevelopmentIndex}
                      </p>
                    </div>
                  </div>

                  {/* HDI bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-sans">
                        Human Dev. Index
                      </span>
                      <span className="font-mono text-foreground">
                        {(country.humanDevelopmentIndex * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary transition-all duration-500"
                        style={{
                          width: `${country.humanDevelopmentIndex * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
