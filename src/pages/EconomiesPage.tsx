import React, { useState } from "react";
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  Anchor,
  Package,
  Boat,
  Globe,
  Flag,
  MapTrifold,
  Buildings,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { economiesData, type Economy } from "../data/economiesData";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  CAD: "CA$",
  AUD: "A$",
  KRW: "₩",
  RUB: "₽",
  MXN: "MX$",
  IDR: "Rp",
  CHF: "Fr",
  ARS: "$",
  AED: "د.إ",
  SAR: "﷼",
  TRY: "₺",
  PLN: "zł",
  SEK: "kr",
  DKK: "kr",
  NOK: "kr",
  SGD: "S$",
  MYR: "RM",
  ILS: "₪",
  EGP: "£",
  ZAR: "R",
  THB: "฿",
  NGN: "₦",
  PKR: "₨",
  VND: "₫",
  CLP: "$",
  PHP: "₱",
  BDT: "৳",
  NZD: "NZ$",
  HUF: "Ft",
  CZK: "Kč",
  RON: "lei",
  BGN: "лв",
  HRK: "€",
  UAH: "₴",
  RSD: "дин",
  KWD: "د.ك",
  QAR: "﷼",
  ETB: "Br",
  KES: "KSh",
  GHS: "₵",
  TZS: "TSh",
  AOA: "Kz",
  MAD: "د.م.",
  MZN: "MT",
  PEN: "S/.",
  VES: "Bs.S",
  TWD: "NT$",
  HKD: "HK$",
  UZS: "so'm",
  KZT: "₸",
  MMK: "K",
  KHR: "៛",
  LKR: "Rs",
  NPR: "Rs",
  IRR: "﷼",
  IQD: "ع.د",
  COP: "$",
};

const getCurrencyDisplay = (code: string, name: string) => {
  const sym = CURRENCY_SYMBOLS[code];
  return sym ? `${sym} ${code} · ${name}` : `${code} · ${name}`;
};

const ratingColor = (r: string) => {
  if (r.startsWith("AAA"))
    return "text-success bg-success/10 border-success/30";
  if (r.startsWith("AA"))
    return "text-secondary bg-secondary/10 border-secondary/30";
  if (r.startsWith("A"))
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-orange-400 bg-orange-500/10 border-orange-500/30";
};

function SectorBar({ name, share }: { name: string; share: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-sans">{name}</span>
        <span className="font-mono text-foreground">{share}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary transition-all duration-500"
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-muted">
        <span className="text-sm font-semibold font-sans text-foreground">
          {title}
        </span>
      </div>
      <div className="px-4 py-3 bg-muted/40">{children}</div>
    </div>
  );
}

function EconomyModal({
  economy,
  onClose,
}: {
  economy: Economy;
  onClose: () => void;
}) {
  const [activeChart, setActiveChart] = useState<
    "gdp" | "growth" | "inflation"
  >("gdp");

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

  const chartDataKey =
    activeChart === "gdp"
      ? "gdp"
      : activeChart === "growth"
        ? "growth"
        : "inflation";
  const chartName =
    activeChart === "gdp"
      ? "GDP ($T)"
      : activeChart === "growth"
        ? "Growth (%)"
        : "Inflation (%)";
  const chartColor =
    activeChart === "gdp"
      ? "hsl(200,85%,50%)"
      : activeChart === "growth"
        ? "hsl(150,55%,45%)"
        : "hsl(35,100%,50%)";

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
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold font-sans text-foreground">
                  {economy.name}
                </h2>
                <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                  {economy.entityType}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-mono font-semibold ${ratingColor(economy.creditRating)}`}
                >
                  {economy.creditRating}
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  {economy.currencyCode}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-mono ${economy.gdpGrowthRate >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {economy.gdpGrowthRate >= 0 ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                  {economy.gdpGrowthRate}% growth
                </span>
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

          {/* Key Stats — condensed 3-col grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              {
                label: "GDP",
                value: `$${economy.gdpTrillions.toFixed(2)}T`,
                color: "text-secondary",
              },
              {
                label: "Per Capita",
                value: `$${economy.gdpPerCapita.toLocaleString()}`,
                color: "text-foreground",
              },
              {
                label: "Inflation",
                value: `${economy.inflationRate}%`,
                color:
                  economy.inflationRate > 5
                    ? "text-destructive"
                    : "text-success",
              },
              {
                label: "Unemployment",
                value: `${economy.unemploymentRate}%`,
                color:
                  economy.unemploymentRate > 6
                    ? "text-warning"
                    : "text-success",
              },
              {
                label: "Debt/GDP",
                value: `${economy.debtToGDPRatio}%`,
                color:
                  economy.debtToGDPRatio > 100
                    ? "text-destructive"
                    : "text-warning",
              },
              {
                label: "Interest",
                value: `${economy.interestRate}%`,
                color: "text-foreground",
              },
              {
                label: "Trade Vol.",
                value: `$${economy.tradeVolumeTrillions}T`,
                color: "text-foreground",
              },
              {
                label: "FDI",
                value: `$${economy.fdiInflowBillions}B`,
                color: "text-secondary",
              },
              {
                label: "Mkt Cap",
                value: `$${economy.stockMarketCap}T`,
                color: "text-foreground",
              },
              ...(economy.cpi != null
                ? [
                    {
                      label: "CPI",
                      value: economy.cpi.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      }),
                      color: "text-foreground",
                    },
                  ]
                : []),
            ].map((s) => (
              <div
                key={s.label}
                className="modal-tile rounded-lg px-3 py-2 flex items-center justify-between gap-2"
              >
                <p className="text-xs text-muted-foreground font-sans truncate">
                  {s.label}
                </p>
                <p
                  className={`text-sm font-bold font-mono whitespace-nowrap ${s.color}`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Accordion sections */}
          <div className="space-y-2">
            {/* Chart */}
            <AccordionSection title="5-Year Trends" defaultOpen>
              <div className="flex gap-1 mb-3">
                {(["gdp", "growth", "inflation"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveChart(tab)}
                    className={`px-2 py-0.5 rounded text-xs font-sans transition-colors cursor-pointer ${activeChart === tab ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={economy.trends}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id={`ecoGrad-${economy.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={chartColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={chartColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(222,30%,25%)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="year"
                      tick={{
                        fill: "hsl(0,0%,60%)",
                        fontSize: 10,
                        fontFamily: "IBM Plex Mono",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fill: "hsl(0,0%,60%)",
                        fontSize: 10,
                        fontFamily: "IBM Plex Mono",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={chartDataKey}
                      name={chartName}
                      stroke={chartColor}
                      strokeWidth={2}
                      fill={`url(#ecoGrad-${economy.id})`}
                      dot={false}
                      isAnimationActive
                      animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AccordionSection>

            {/* Sectors */}
            <AccordionSection title="GDP Composition by Sector">
              <div className="space-y-2">
                {economy.topSectors.map((s) => (
                  <SectorBar key={s.name} name={s.name} share={s.shareOfGDP} />
                ))}
              </div>
            </AccordionSection>

            {/* Trade */}
            <AccordionSection title="Trade & Partners">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-sans mb-1.5">
                    Top Exports
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {economy.topExports.slice(0, 4).map((e) => (
                      <span
                        key={e}
                        className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans mb-1.5">
                    Top Partners
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {economy.tradingPartners.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* Maritime */}
            <AccordionSection title="Maritime Trade">
              <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-3">
                {economy.maritime.maritimeTrade}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-background/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground font-sans">
                    Annual Cargo
                  </p>
                  <p className="text-sm font-bold font-mono text-secondary">
                    {economy.maritime.annualCargoMT.toLocaleString()} MT
                  </p>
                </div>
                <div className="bg-background/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground font-sans">TEU</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {(economy.maritime.containersTEU / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-background/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground font-sans">
                    Navy
                  </p>
                  <p className="text-xs font-mono text-foreground leading-tight mt-0.5">
                    {economy.maritime.navyStrength.split("—")[0].trim()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-muted-foreground font-sans mr-1">
                  Ports:
                </span>
                {economy.maritime.majorPorts.map((port) => (
                  <span
                    key={port}
                    className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                  >
                    {port}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground font-sans mr-1">
                  Lanes:
                </span>
                {economy.maritime.shippingLanes.map((lane) => (
                  <span
                    key={lane}
                    className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                  >
                    {lane}
                  </span>
                ))}
              </div>
            </AccordionSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EconomiesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdpTrillions" | "gdpGrowthRate" | "inflationRate" | "stockMarketCap"
  >("gdpTrillions");
  const [selectedEconomy, setSelectedEconomy] = useState<Economy | null>(null);
  const [modalEconomy, setModalEconomy] = useState<Economy | null>(null);

  const types = ["All", "Country", "Region", "Bloc"];

  const filtered = economiesData
    .filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || e.entityType === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const globalGDP = economiesData.reduce(
    (sum, e) => sum + (e.entityType === "Country" ? e.gdpTrillions : 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <CurrencyDollar
              size={26}
              weight="fill"
              className="text-secondary"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Global Economies
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              GDP, growth, trade, inflation, credit ratings, and sector
              breakdowns
            </p>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Global GDP",
              value: "$104.5T",
              sub: "estimated 2024",
              color: "text-secondary",
            },
            {
              label: "Fastest Growing",
              value: "India +6.3%",
              sub: "tracked nations",
              color: "text-success",
            },
            {
              label: "Largest Market",
              value: "USA $27.4T",
              sub: "by nominal GDP",
              color: "text-warning",
            },
            {
              label: "Avg Inflation",
              value: "4.2%",
              sub: "tracked economies",
              color: "text-destructive",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {s.sub}
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
              placeholder="Search economies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {(["All", "Country", "Region", "Bloc"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  typeFilter === t
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {t}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdpTrillions">Sort: GDP</option>
              <option value="gdpGrowthRate">Sort: GDP Growth</option>
              <option value="inflationRate">Sort: Inflation</option>
              <option value="stockMarketCap">Sort: Mkt Cap</option>
            </select>
          </div>
        </div>

        {modalEconomy && (
          <EconomyModal
            economy={modalEconomy}
            onClose={() => setModalEconomy(null)}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Economy Cards */}
          <div className="xl:col-span-2 space-y-4 min-w-0">
            {filtered.map((economy) => (
              <div
                key={economy.id}
                className="flex gap-3 items-stretch min-w-0 overflow-hidden"
              >
                {/* ── Main card ── */}
                <article
                  onClick={() => setModalEconomy(economy)}
                  className="modal-tile rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 flex-1 min-w-0"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-semibold font-sans text-foreground leading-tight">
                          {economy.name}
                        </h3>
                        <span
                          className={`text-[10px] border px-1.5 py-px rounded-full font-mono font-semibold ${ratingColor(economy.creditRating)}`}
                        >
                          {economy.creditRating}
                        </span>
                        <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-px rounded-full font-sans">
                          {economy.entityType}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-sans leading-tight">
                        {getCurrencyDisplay(
                          economy.currencyCode,
                          economy.currencyName,
                        )}{" "}
                        · Interest Rate: {economy.interestRate}%
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold font-mono text-secondary leading-tight">
                        ${economy.gdpTrillions.toFixed(2)}T
                      </p>
                      <p
                        className={`text-[10px] font-mono flex items-center gap-0.5 justify-end ${economy.gdpGrowthRate >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {economy.gdpGrowthRate >= 0 ? (
                          <TrendUp size={10} weight="bold" />
                        ) : (
                          <TrendDown size={10} weight="bold" />
                        )}
                        {economy.gdpGrowthRate >= 0 ? "+" : ""}
                        {economy.gdpGrowthRate}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-2 gap-y-0.5 mb-1.5">
                    <div>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        GDP/Capita
                      </p>
                      <p className="text-xs font-bold font-mono text-foreground leading-tight">
                        ${economy.gdpPerCapita.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        Inflation
                      </p>
                      <p
                        className={`text-xs font-bold font-mono leading-tight ${economy.inflationRate > 6 ? "text-destructive" : economy.inflationRate > 3 ? "text-warning" : "text-success"}`}
                      >
                        {economy.inflationRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        Unemployment
                      </p>
                      <p className="text-xs font-bold font-mono text-foreground leading-tight">
                        {economy.unemploymentRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        Debt/GDP
                      </p>
                      <p
                        className={`text-xs font-bold font-mono leading-tight ${economy.debtToGDPRatio > 120 ? "text-destructive" : economy.debtToGDPRatio > 80 ? "text-warning" : "text-success"}`}
                      >
                        {economy.debtToGDPRatio}%
                      </p>
                    </div>
                    {economy.cpi != null && (
                      <div>
                        <p className="text-[9px] text-muted-foreground font-sans">
                          CPI
                        </p>
                        <p className="text-xs font-bold font-mono text-foreground leading-tight">
                          {economy.cpi.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GDP share bar */}
                  <div className="mb-1">
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="text-muted-foreground font-sans">
                        Share of Global GDP
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {((economy.gdpTrillions / 104.5) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (economy.gdpTrillions / 104.5) * 100 * 4)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Top sectors pills */}
                  <div className="flex flex-wrap gap-1">
                    {economy.topExports.slice(0, 3).map((exp) => (
                      <span
                        key={exp}
                        className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-1.5 py-px rounded-full font-sans"
                      >
                        {exp}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-px rounded-full font-sans">
                      +{economy.topExports.length - 3} more
                    </span>
                  </div>
                </article>

                {/* ── GDP chart box ── */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:flex w-28 md:w-36 h-28 md:h-36 shrink-0 bg-card border border-border rounded-xl p-2 flex-col justify-between"
                >
                  <div className="mb-0.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-secondary leading-none">
                      GDP $T
                    </p>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={economy.trends}
                        margin={{ top: 4, right: 2, left: -28, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`cardGdpGrad-${economy.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(200,85%,50%)"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(200,85%,50%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="year"
                          tick={{
                            fill: "hsl(0,0%,50%)",
                            fontSize: 8,
                            fontFamily: "IBM Plex Mono",
                          }}
                          axisLine={false}
                          tickLine={false}
                          interval={1}
                        />
                        <YAxis
                          tick={{
                            fill: "hsl(0,0%,50%)",
                            fontSize: 8,
                            fontFamily: "IBM Plex Mono",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}`}
                          width={28}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(222,30%,14%)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            fontSize: 10,
                            fontFamily: "IBM Plex Mono",
                          }}
                          formatter={(v: number) => [`$${v}T`, "GDP"]}
                          labelStyle={{ color: "hsl(0,0%,55%)" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="gdp"
                          name="GDP"
                          stroke="hsl(200,85%,50%)"
                          fill={`url(#cardGdpGrad-${economy.id})`}
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* growth badge */}
                  <div className="mt-1 flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[8px] text-muted-foreground font-mono truncate">
                      {economy.trends[0]?.year}–
                      {economy.trends[economy.trends.length - 1]?.year}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold shrink-0 ${economy.gdpGrowthRate >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {economy.gdpGrowthRate >= 0 ? "+" : ""}
                      {economy.gdpGrowthRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── GDP Growth Projections Sidebar ─────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-5 min-w-0">
            {/* GDP Growth Bar Chart */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
                GDP Growth Projections
              </p>
              <h3 className="text-sm font-bold font-sans text-foreground mb-4">
                Projected GDP Growth 2025–2030
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      year: "2025",
                      world: 3.1,
                      usa: 2.3,
                      china: 4.6,
                      india: 6.5,
                      eu: 1.4,
                    },
                    {
                      year: "2026",
                      world: 3.3,
                      usa: 2.5,
                      china: 4.8,
                      india: 6.8,
                      eu: 1.7,
                    },
                    {
                      year: "2027",
                      world: 3.4,
                      usa: 2.4,
                      china: 4.9,
                      india: 7.0,
                      eu: 1.8,
                    },
                    {
                      year: "2028",
                      world: 3.2,
                      usa: 2.6,
                      china: 5.0,
                      india: 7.1,
                      eu: 1.9,
                    },
                    {
                      year: "2029",
                      world: 3.3,
                      usa: 2.5,
                      china: 5.1,
                      india: 7.3,
                      eu: 2.0,
                    },
                    {
                      year: "2030",
                      world: 3.4,
                      usa: 2.7,
                      china: 5.2,
                      india: 7.5,
                      eu: 2.1,
                    },
                  ]}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
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
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222,30%,14%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono",
                    }}
                    formatter={(v: number, name: string) => [
                      `${v}%`,
                      name.toUpperCase(),
                    ]}
                    labelStyle={{ color: "hsl(0,0%,55%)", marginBottom: 2 }}
                  />
                  <Bar
                    dataKey="world"
                    name="World"
                    fill="#a855f7"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="usa"
                    name="USA"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="china"
                    name="China"
                    fill="#ef4444"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="india"
                    name="India"
                    fill="#f97316"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                  <Bar
                    dataKey="eu"
                    name="EU"
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={8}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center">
                {[
                  { label: "World", color: "#a855f7" },
                  { label: "USA", color: "#3b82f6" },
                  { label: "China", color: "#ef4444" },
                  { label: "India", color: "#f97316" },
                  { label: "EU", color: "#10b981" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: l.color }}
                    />
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Area chart: GDP absolute $T */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
                GDP Trajectory
              </p>
              <h3 className="text-sm font-bold font-sans text-foreground mb-1">
                Nominal GDP ($T) to 2030
              </h3>
              <p className="text-[10px] text-muted-foreground font-sans mb-4">
                IMF WEO projections by economy
              </p>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart
                  data={[
                    {
                      year: "2024",
                      usa: 27.4,
                      china: 18.5,
                      india: 3.9,
                      germany: 4.5,
                      japan: 4.2,
                    },
                    {
                      year: "2025",
                      usa: 28.2,
                      china: 19.8,
                      india: 4.3,
                      germany: 4.7,
                      japan: 4.3,
                    },
                    {
                      year: "2026",
                      usa: 29.5,
                      china: 21.2,
                      india: 4.8,
                      germany: 4.9,
                      japan: 4.4,
                    },
                    {
                      year: "2027",
                      usa: 30.8,
                      china: 22.8,
                      india: 5.4,
                      germany: 5.1,
                      japan: 4.5,
                    },
                    {
                      year: "2028",
                      usa: 32.1,
                      china: 24.6,
                      india: 6.1,
                      germany: 5.3,
                      japan: 4.6,
                    },
                    {
                      year: "2029",
                      usa: 33.4,
                      china: 26.5,
                      india: 6.9,
                      germany: 5.5,
                      japan: 4.7,
                    },
                    {
                      year: "2030",
                      usa: 34.9,
                      china: 28.6,
                      india: 7.8,
                      germany: 5.8,
                      japan: 4.8,
                    },
                  ]}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ecoUsaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#3b82f6"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="ecoChinaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ef4444"
                        stopOpacity={0.25}
                      />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="ecoIndiaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f97316"
                        stopOpacity={0.25}
                      />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
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
                    tickFormatter={(v) => `$${v}T`}
                  />
                  <ReferenceLine
                    x="2025"
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 2"
                    label={{
                      value: "Now",
                      position: "top",
                      fontSize: 9,
                      fill: "hsl(0,0%,55%)",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222,30%,14%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono",
                    }}
                    formatter={(v: number, name: string) => [
                      `$${v}T`,
                      name.toUpperCase(),
                    ]}
                    labelStyle={{ color: "hsl(0,0%,55%)", marginBottom: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="usa"
                    name="USA"
                    stroke="#3b82f6"
                    fill="url(#ecoUsaGrad)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="china"
                    name="China"
                    stroke="#ef4444"
                    fill="url(#ecoChinaGrad)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="india"
                    name="India"
                    stroke="#f97316"
                    fill="url(#ecoIndiaGrad)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="germany"
                    name="Germany"
                    stroke="#6366f1"
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="japan"
                    name="Japan"
                    stroke="#10b981"
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-3 mt-2 justify-center">
                {[
                  { label: "USA", color: "#3b82f6" },
                  { label: "China", color: "#ef4444" },
                  { label: "India", color: "#f97316" },
                  { label: "Germany", color: "#6366f1" },
                  { label: "Japan", color: "#10b981" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div
                      className="w-3 h-0.5 rounded-full"
                      style={{ background: l.color }}
                    />
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Rate Line Chart */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
                Annual Growth Rate
              </p>
              <h3 className="text-sm font-bold font-sans text-foreground mb-4">
                YoY GDP Growth % Forecast
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={[
                    {
                      year: "2022",
                      usa: 2.1,
                      china: 3.0,
                      india: 7.2,
                      world: 3.5,
                    },
                    {
                      year: "2023",
                      usa: 2.5,
                      china: 5.2,
                      india: 8.2,
                      world: 3.2,
                    },
                    {
                      year: "2024",
                      usa: 2.3,
                      china: 4.6,
                      india: 6.1,
                      world: 3.1,
                    },
                    {
                      year: "2025",
                      usa: 2.3,
                      china: 4.8,
                      india: 6.5,
                      world: 3.1,
                    },
                    {
                      year: "2026",
                      usa: 2.5,
                      china: 4.9,
                      india: 6.8,
                      world: 3.3,
                    },
                    {
                      year: "2027",
                      usa: 2.4,
                      china: 5.0,
                      india: 7.0,
                      world: 3.4,
                    },
                    {
                      year: "2028",
                      usa: 2.6,
                      china: 5.1,
                      india: 7.1,
                      world: 3.2,
                    },
                    {
                      year: "2030",
                      usa: 2.7,
                      china: 5.2,
                      india: 7.5,
                      world: 3.4,
                    },
                  ]}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
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
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, "auto"]}
                  />
                  <ReferenceLine
                    x="2025"
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="4 2"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222,30%,14%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono",
                    }}
                    formatter={(v: number, name: string) => [
                      `${v}%`,
                      name.toUpperCase(),
                    ]}
                    labelStyle={{ color: "hsl(0,0%,55%)", marginBottom: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="world"
                    name="World"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: "#a855f7", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usa"
                    name="USA"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="china"
                    name="China"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="india"
                    name="India"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: "#f97316", r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-3 mt-2 justify-center">
                {[
                  { label: "World", color: "#a855f7" },
                  { label: "USA", color: "#3b82f6" },
                  { label: "China", color: "#ef4444" },
                  { label: "India", color: "#f97316" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div
                      className="w-3 h-0.5 rounded-full"
                      style={{ background: l.color }}
                    />
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground font-sans mt-3">
                Dashed line = 2025 threshold. Source: IMF WEO Apr 2025.
              </p>
            </div>

            {/* Confidence/Forecast quality strip */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-1">
                Forecast Quality
              </p>
              <h3 className="text-sm font-bold font-sans text-foreground mb-4">
                Model Confidence
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: "GDP ($T) path", confidence: 81, color: "#3b82f6" },
                  {
                    label: "Growth rate (YoY)",
                    confidence: 74,
                    color: "#a855f7",
                  },
                  {
                    label: "Emerging markets",
                    confidence: 63,
                    color: "#f97316",
                  },
                  {
                    label: "High-income bloc",
                    confidence: 79,
                    color: "#10b981",
                  },
                  {
                    label: "Transition economies",
                    confidence: 58,
                    color: "#f59e0b",
                  },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-[11px] font-sans text-foreground flex-1 truncate">
                      {f.label}
                    </span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden bg-muted shrink-0">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${f.confidence}%`,
                          background: f.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono w-8 text-right shrink-0"
                      style={{ color: f.color }}
                    >
                      {f.confidence}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground font-sans mt-3">
                Confidence reflects model back-test accuracy on 5-year horizons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
