import { na } from "../lib/na";
import React, { useState, useCallback } from "react";
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  MagnifyingGlass,
  ArrowsLeftRight,
  Tree,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { economiesData, type Economy } from "../data/economiesData";
import { getUpcoming } from "../data/upcomingToWatch";
import { ECONOMY_ISO3, type EconomyRents } from "../data/resourceRents";
import { RESOURCE_PRODUCERS } from "../data/resourceProducers";
import { useResourceRents } from "../hooks/useResourceRents";
import { SourceLink } from "../components/SourceLink";
import { countriesData } from "../data/countriesData";
import { CollapsibleFilters } from "../components/CollapsibleFilters";
import { StyledSelect } from "../components/StyledSelect";
import {
  ECONOMY_SECTORS,
  ECONOMY_SECTORS_SOURCE,
  type EconomySectors,
} from "../data/economySectors";
import {
  BUDGET_DIVISIONS,
  BUDGET_SOURCE,
  COUNTRY_BUDGET_BY_ISO3,
  type BudgetDivision,
  type CountryBudget,
} from "../data/countryBudget";
import {
  ResourceModal,
  type ResourceSummary,
} from "../components/ResourceModal";
import {
  CRITICAL_MINERALS,
  CRITICAL_MINERALS_SOURCE,
  SUPPLY_CONCENTRATION,
  type Amount,
  type Share,
} from "../data/criticalMinerals";


// Default for economies without specific data


// Fallback generic resources for economies not explicitly listed

const SRC_IMF = [
  {
    label: "IMF World Economic Outlook",
    url: "https://www.imf.org/en/Publications/WEO",
  },
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
];
const SRC_OECD = [
  { label: "OECD.Stat", url: "https://stats.oecd.org/" },
  { label: "IMF Data", url: "https://www.imf.org/en/Data" },
];
const SRC_WTO = [
  {
    label: "WTO Statistics",
    url: "https://www.wto.org/english/res_e/statis_e/statis_e.htm",
  },
];
const SRC_MARITIME = [
  {
    label: "UNCTAD Maritime Transport",
    url: "https://unctad.org/topic/transport-and-trade-logistics/review-of-maritime-transport",
  },
];

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

// Static mid-market rates vs USD (Aug 2026 approx.)
const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.921,
  GBP: 0.787,
  JPY: 149.8,
  CNY: 7.24,
  INR: 83.5,
  BRL: 4.97,
  CAD: 1.363,
  AUD: 1.531,
  KRW: 1325,
  RUB: 91.2,
  MXN: 17.15,
  IDR: 15640,
  CHF: 0.894,
  ARS: 874,
  AED: 3.673,
  SAR: 3.751,
  TRY: 32.4,
  PLN: 3.96,
  SEK: 10.42,
  DKK: 6.87,
  NOK: 10.55,
  SGD: 1.339,
  MYR: 4.71,
  ILS: 3.73,
  EGP: 30.9,
  ZAR: 18.62,
  THB: 35.1,
  NGN: 1480,
  PKR: 278,
  VND: 24350,
  CLP: 897,
  PHP: 56.2,
  BDT: 110,
  NZD: 1.628,
  HUF: 352,
  CZK: 22.7,
  RON: 4.58,
  UAH: 37.2,
  KWD: 0.308,
  QAR: 3.641,
  TWD: 31.9,
  HKD: 7.825,
  HKD2: 7.825,
  KZT: 455,
  MMK: 2098,
  LKR: 327,
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  BRL: "Brazilian Real",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  KRW: "South Korean Won",
  RUB: "Russian Ruble",
  MXN: "Mexican Peso",
  IDR: "Indonesian Rupiah",
  CHF: "Swiss Franc",
  ARS: "Argentine Peso",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  TRY: "Turkish Lira",
  PLN: "Polish Złoty",
  SEK: "Swedish Krona",
  DKK: "Danish Krone",
  NOK: "Norwegian Krone",
  SGD: "Singapore Dollar",
  MYR: "Malaysian Ringgit",
  ILS: "Israeli Shekel",
  EGP: "Egyptian Pound",
  ZAR: "South African Rand",
  THB: "Thai Baht",
  NGN: "Nigerian Naira",
  PKR: "Pakistani Rupee",
  VND: "Vietnamese Dong",
  CLP: "Chilean Peso",
  PHP: "Philippine Peso",
  BDT: "Bangladeshi Taka",
  NZD: "New Zealand Dollar",
  HUF: "Hungarian Forint",
  CZK: "Czech Koruna",
  RON: "Romanian Leu",
  UAH: "Ukrainian Hryvnia",
  KWD: "Kuwaiti Dinar",
  QAR: "Qatari Riyal",
  TWD: "Taiwan Dollar",
  HKD: "Hong Kong Dollar",
  KZT: "Kazakhstani Tenge",
  MMK: "Myanmar Kyat",
  LKR: "Sri Lankan Rupee",
};

const POPULAR_PAIRS = [
  { from: "USD", to: "EUR" },
  { from: "USD", to: "GBP" },
  { from: "USD", to: "JPY" },
  { from: "EUR", to: "GBP" },
  { from: "GBP", to: "JPY" },
  { from: "USD", to: "CNY" },
];

function CurrencyConverter() {
  const [amount, setAmount] = useState("1");
  const [fromCur, setFromCur] = useState("USD");
  const [toCur, setToCur] = useState("EUR");

  const convert = useCallback((val: string, from: string, to: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || !FX_RATES[from] || !FX_RATES[to]) return "—";
    const inUSD = n / FX_RATES[from];
    const result = inUSD * FX_RATES[to];
    if (result >= 1e6)
      return result.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (result >= 1000)
      return result.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return result.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }, []);

  const rate = useCallback((from: string, to: string) => {
    if (!FX_RATES[from] || !FX_RATES[to]) return "—";
    const r = FX_RATES[to] / FX_RATES[from];
    if (r >= 100)
      return r.toLocaleString("en-US", { maximumFractionDigits: 1 });
    return r.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }, []);

  const swap = () => {
    setFromCur(toCur);
    setToCur(fromCur);
  };

  const fromSym = CURRENCY_SYMBOLS[fromCur] ?? fromCur;
  const toSym = CURRENCY_SYMBOLS[toCur] ?? toCur;
  const resultVal = convert(amount, fromCur, toCur);
  const currencies = Object.keys(FX_RATES).filter((c) => c !== "HKD2");

  const currencyOptions = currencies.map((c) => ({
    value: c,
    label: `${c} — ${CURRENCY_NAMES[c] ?? c}`,
  }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-secondary/20">
          <ArrowsLeftRight size={16} weight="fill" className="text-secondary" />
        </div>
        <div>
          <p className="text-sm font-semibold font-sans text-foreground leading-tight">
            Currency Converter
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            Mid-market rates · Aug 2026
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {POPULAR_PAIRS.map((p) => (
            <button
              key={`${p.from}-${p.to}`}
              onClick={() => {
                setFromCur(p.from);
                setToCur(p.to);
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${fromCur === p.from && toCur === p.to ? "bg-secondary/20 border-secondary/40 text-secondary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
            >
              {p.from}/{p.to}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* FROM */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Amount
          </label>
          <div className="flex items-center gap-2 bg-background/60 border border-border rounded-xl px-3 py-2.5">
            <span className="text-sm font-bold font-mono text-secondary shrink-0">
              {fromSym}
            </span>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm font-mono text-foreground focus:outline-none min-w-0"
              placeholder="1"
            />
            <StyledSelect
              value={fromCur}
              onValueChange={setFromCur}
              ariaLabel="Convert from currency"
              options={currencyOptions}
            />
          </div>
        </div>

        {/* SWAP */}
        <button
          onClick={swap}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20 hover:border-secondary/40 transition-all cursor-pointer self-end sm:self-auto mb-1 sm:mb-0 shrink-0"
          aria-label="Swap currencies"
        >
          <ArrowsLeftRight size={14} weight="bold" />
        </button>

        {/* TO */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Result
          </label>
          <div className="flex items-center gap-2 bg-secondary/5 border border-secondary/20 rounded-xl px-3 py-2.5">
            <span className="text-sm font-bold font-mono text-secondary shrink-0">
              {toSym}
            </span>
            <span className="flex-1 text-sm font-mono font-bold text-foreground min-w-0 truncate">
              {resultVal}
            </span>
            <StyledSelect
              value={toCur}
              onValueChange={setToCur}
              ariaLabel="Convert to currency"
              options={currencyOptions}
            />
          </div>
        </div>
      </div>

      {/* Rate row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
              1 {fromCur}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              = {rate(fromCur, toCur)} {toCur}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
              1 {toCur}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              = {rate(toCur, fromCur)} {fromCur}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-sans text-right">
          Indicative rates only.
          <br />
          Not for transactional use.
        </p>
      </div>
    </div>
  );
}

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

const SECTOR_COLORS: Record<string, string> = {
  /* The residual parts of GDP: whatever is left once the three sectors are
     counted. Grey, because neither is an industry. Which one applies depends on
     the source - see economySectors.ts. */
  "Taxes less subsidies": "#94a3b8",
  "Statistical discrepancy": "#94a3b8",
  Services: "#38bdf8",
  Industry: "#a78bfa",
  Agriculture: "#4ade80",
  Manufacturing: "#fb923c",
  Finance: "#f472b6",
  Technology: "#facc15",
  Energy: "#f97316",
  Mining: "#a3a3a3",
  Tourism: "#34d399",
  IT: "#60a5fa",
  Logistics: "#c084fc",
  Chemicals: "#fbbf24",
  "Trade & Logistics": "#22d3ee",
  Pharmaceuticals: "#e879f9",
  Semiconductors: "#f87171",
  BPO: "#818cf8",
  Fisheries: "#06b6d4",
  Garments: "#ec4899",
  Automotive: "#fb923c",
  Textiles: "#10b981",
};

/** The eight economies and the minerals the global overview compares. */
const OVERVIEW_ECONOMIES: [string, string][] = [
  ["china-eco", "China"],
  ["usa-eco", "USA"],
  ["australia-eco", "Australia"],
  ["brazil-eco", "Brazil"],
  ["chile-eco", "Chile"],
  ["russia-eco", "Russia"],
  ["india-eco", "India"],
  ["indonesia-eco", "Indonesia"],
];
const OVERVIEW_MINERALS = [
  "Rare Earths",
  "Lithium",
  "Cobalt",
  "Nickel",
  "Graphite",
  "Copper",
  "Tungsten",
];

/** Tonnes, compactly: 1,900,000 -> "1.9 Mt". A lower bound keeps its ">". */
function fmtTonnes(a: Amount | null): string {
  if (!a) return "—";
  const t = a.tonnes;
  const body =
    t >= 1e9
      ? `${+(t / 1e9).toFixed(1)} Gt`
      : t >= 1e6
        ? `${+(t / 1e6).toFixed(1)} Mt`
        : t >= 1e3
          ? `${+(t / 1e3).toFixed(1)} kt`
          : `${Math.round(t)} t`;
  return (a.lowerBound ? ">" : "") + body;
}

/**
 * A share of the world total, saying how exact it is. A share of a world total
 * that USGS gives only as a minimum overstates the country's part, so it is an
 * upper bound ("≤"); a share of a country figure given as a minimum is a lower
 * bound ("≥").
 */
function fmtShare(s: Share | null): string {
  if (!s) return "";
  const mark = s.bound === "atMost" ? "≤" : s.bound === "atLeast" ? "≥" : "";
  return `${mark}${s.pct}% of world`;
}

function getSectorColor(name: string): string {
  return SECTOR_COLORS[name] ?? "#94a3b8";
}

/**
 * One sector row inside the GDP-composition tile.
 *
 * Previously each sector rendered its own bordered card, which put four cards
 * inside the modal-tile they already sat in, repeated "Share of GDP" four
 * times, and used a five-dot meter that appears nowhere else in the app.
 * This is the label / mono-value / h-1.5 bar pattern used for every other
 * measured value in the codebase.
 */
function SectorBar({ name, share }: { name: string; share: number }) {
  const color = getSectorColor(name);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 gap-3">
        <span className="text-muted-foreground font-sans truncate">{name}</span>
        <span className="font-mono text-foreground shrink-0">{share}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${share}%`, background: color }}
        />
      </div>
    </div>
  );
}

/**
 * GDP composition as a pie.
 *
 * The figures come from ECONOMY_SECTORS, which is generated from the World
 * Bank's national accounts. The slices sum to exactly 100 by construction, so
 * the number printed on a slice is the size of that slice — which the hand
 * written data this replaced could not promise: sixty-one of the seventy-seven
 * economies had shares that did not sum to 100, and a pie silently normalises
 * whatever it is handed, so every slice drawn from them was a share of a total
 * no source reported.
 *
 * Manufacturing is not a slice. The World Bank's definition has industry
 * "comprised of mining, manufacturing, construction, electricity, water, and
 * gas", so manufacturing is inside the industry slice and is quoted underneath
 * as an "of which" figure instead.
 */
function SectorPie({ sectors }: { sectors: EconomySectors }) {
  const dominant = [...sectors.slices].sort((a, b) => b.pct - a.pct)[0];
  const pieData = sectors.slices.map((x) => ({ name: x.name, value: x.pct }));
  const basisLabel = sectors.basis === "gdp" ? "of GDP" : "of value added";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
      <div className="bg-card border border-border rounded-lg p-2.5 text-xs font-mono shadow-lg">
        <p style={{ color: getSectorColor(entry.name) }} className="font-semibold">
          {entry.name}
        </p>
        <p className="text-foreground">
          {entry.value}% {basisLabel}
        </p>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Sector Distribution · {sectors.year}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="shrink-0" style={{ width: 110, height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                /* A pie, so no hole and no gaps between slices: the parts of a
                   whole should visibly meet. */
                innerRadius={0}
                outerRadius={52}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationDuration={600}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={getSectorColor(entry.name)}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span
              className="text-xl font-bold font-mono"
              style={{ color: getSectorColor(dominant.name) }}
            >
              {dominant.pct}%
            </span>
            <span className="text-xs font-sans text-muted-foreground">
              {dominant.name}
            </span>
          </div>
          {sectors.slices.map((x) => (
            <div key={x.name} className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: getSectorColor(x.name) }}
              />
              <span className="text-[11px] font-sans text-foreground truncate flex-1">
                {x.name}
              </span>
              <span
                className="text-[11px] font-mono shrink-0"
                style={{ color: getSectorColor(x.name) }}
              >
                {x.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[9px] font-sans text-muted-foreground mt-2 leading-snug">
        Value added by sector, {basisLabel.replace("of ", "as a share of ")},{" "}
        {sectors.year}, from{" "}
        {sectors.source === "un"
          ? "the UN Statistics Division's national accounts, which report economies the World Bank does not"
          : sectors.source === "dgbas"
            ? "Taiwan's Directorate-General of Budget, Accounting and Statistics, which publishes the breakdown that neither the World Bank nor the UN covers"
            : ECONOMY_SECTORS_SOURCE.label}
        .
        {sectors.source === "dgbas" &&
          " Its figures already distribute import duties and value-added tax across the three sectors, so what is left over is the statistical discrepancy rather than taxes."}
        {sectors.basis === "valueAdded" &&
          (sectors.source === "un"
            ? " The UN publishes this as a distribution across value added, so the shares are of value added rather than of GDP and there is no separate figure for taxes less subsidies."
            : " Charted on value added rather than GDP because subsidies on products exceed taxes on them here, so the sectors come to more than GDP.")}
        {sectors.manufacturing !== null &&
          ` Of the industry share, manufacturing is ${sectors.manufacturing}% ${
            sectors.basis === "gdp" ? "of GDP" : "of value added"
          }.`}
        {sectors.topSubSector &&
          ` Its largest single industry is ${sectors.topSubSector.name.toLowerCase()}, at ${sectors.topSubSector.pct}% of GDP on its own.`}
      </p>
    </div>
  );
}

/** One colour per COFOG function, far enough apart to tell ten slices apart. */
const BUDGET_COLORS: Record<BudgetDivision | "unclassified", string> = {
  GF01: "#94a3b8", // general public services
  GF02: "#ef4444", // defence
  GF03: "#f97316", // public order & safety
  GF04: "#eab308", // economic affairs
  GF05: "#22c55e", // environment
  GF06: "#14b8a6", // housing
  GF07: "#06b6d4", // health
  GF08: "#a855f7", // culture
  GF09: "#3b82f6", // education
  GF10: "#ec4899", // social protection
  unclassified: "#64748b",
};

/**
 * Where a government's money goes: each of the ten COFOG functions as a share
 * of total government spending, from the IMF (countryBudget.ts, built by
 * build-budget.cjs). Laid out like the sector pie above it.
 *
 * General government — central, state and local together — wherever the IMF
 * has it, because that is what compares across countries: a central-government
 * pie for the US would leave out most of its education spending, which states
 * and localities carry. Where only central government is available it is used
 * and the caption says so.
 */
function BudgetPie({ budget }: { budget: CountryBudget }) {
  const slices = [
    ...BUDGET_DIVISIONS.map((d) => ({
      key: d.id as BudgetDivision | "unclassified",
      name: d.label,
      pct: budget.shares[d.id],
    })),
    ...(budget.unclassified
      ? [{ key: "unclassified" as const, name: "Not classified by function", pct: budget.unclassified }]
      : []),
  ].filter((s) => s.pct > 0);
  const ranked = [...slices].sort((a, b) => b.pct - a.pct);
  const top = ranked[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const e = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-2.5 text-xs font-mono shadow-lg">
        <p style={{ color: BUDGET_COLORS[e.key as keyof typeof BUDGET_COLORS] }} className="font-semibold">
          {e.name}
        </p>
        <p className="text-foreground">{e.pct}% of government spending</p>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Spending by function · {budget.y}
        </p>
      </div>
      <div className="flex items-start gap-4">
        <div className="shrink-0" style={{ width: 110, height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={52}
                paddingAngle={0}
                dataKey="pct"
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationDuration={600}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={BUDGET_COLORS[s.key]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-xl font-bold font-mono" style={{ color: BUDGET_COLORS[top.key] }}>
              {top.pct}%
            </span>
            <span className="text-xs font-sans text-muted-foreground">{top.name}</span>
          </div>
          {/* Largest first, so the list reads as a ranking of priorities. */}
          {ranked.map((s) => (
            <div key={s.key} className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: BUDGET_COLORS[s.key] }} />
              <span className="text-[11px] font-sans text-foreground truncate flex-1">{s.name}</span>
              <span className="text-[11px] font-mono shrink-0" style={{ color: BUDGET_COLORS[s.key] }}>
                {s.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[9px] font-sans text-muted-foreground mt-2 leading-snug">
        Each function as a share of total {budget.basis === "general" ? "general government" : "central government"}{" "}
        spending, {budget.y}, from the {BUDGET_SOURCE.label}.
        {budget.basis === "general"
          ? " General government is central, state and local government together, which is what compares across countries."
          : " Only central-government figures are published for this country, so spending by regional and local government is not included."}
        {budget.spendingPctGdp !== undefined &&
          ` Total spending was ${budget.spendingPctGdp}% of GDP that year.`}
        {budget.unclassified &&
          ` ${budget.unclassified}% of spending was not assigned to any function by the country, and is shown as its own slice.`}
      </p>
    </div>
  );
}

function EconomyModal({
  economy,
  onClose,
  rents,
}: {
  economy: Economy;
  onClose: () => void;
  /** World Bank resource rents for this economy, when the fetch succeeded. */
  rents?: EconomyRents;
}) {
  const [activeChart, setActiveChart] = useState<
    "gdp" | "growth" | "inflation"
  >("gdp");
  const [isExpanded, setIsExpanded] = React.useState(false);

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

  // Prefer World Bank resource rents over the curated list: they are
  // sourced, dated and cover ~250 economies. Curated data is the fallback
  // for economies the World Bank does not report (Taiwan) and for when
  // the request fails.
  const resources = rents?.items.length
    ? rents.items.map((r) => ({
        name: r.name,
        value: r.pctOfGdp,
        unit: "% of GDP",
        color: r.color,
        icon: "",
        share: `World Bank ${r.year}`,
      }))
    : [];

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
          {/* ── HEADER with flag-style background ── */}
          <div className="relative flex items-start justify-between mb-0 -mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden">
            {/* Gradient background banner */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/25 via-secondary/10 to-secondary/20 pointer-events-none" />
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />

            {/* Left: entity icon + name */}
            <div className="relative flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold font-sans text-foreground leading-tight">
                  {economy.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground border border-border/60 px-2 py-0.5 rounded-full bg-background/40">
                    {economy.entityType}
                  </span>
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
                    {economy.gdpGrowthRate}% growth
                  </span>
                </div>
              </div>
            </div>

            {/* Right: expand + close */}
            <div className="relative flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label={
                  isExpanded ? "Collapse modal" : "Expand to full screen"
                }
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                <span className="text-xs font-sans font-medium">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="text-xs font-sans font-medium">Close</span>
              </button>
            </div>
          </div>

          {/* ── ALL SECTIONS ── */}
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* ════════════════════════════════════════
                SECTION: OVERVIEW
            ════════════════════════════════════════ */}
            <div className="space-y-4">
              {/* ── ECONOMIC CATEGORY ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Key Economic Metrics
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid grid-cols-3 gap-2">
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
                      label: "Interest Rate",
                      value: `${economy.interestRate}%`,
                      color: "text-foreground",
                    },
                    {
                      label: "Trade Volume",
                      value: `$${economy.tradeVolumeTrillions}T`,
                      color: "text-foreground",
                    },
                    {
                      label: "FDI Inflow",
                      value: `$${economy.fdiInflowBillions}B`,
                      color: "text-secondary",
                    },
                    {
                      label: "Mkt Cap",
                      value: `$${economy.stockMarketCap}T`,
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="modal-tile rounded-lg px-3 py-2.5 flex items-center justify-between gap-2"
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
              </div>

              <SourceLink sources={SRC_IMF} showIcon={false} />

              {/* ── 5-YEAR TRENDS CHART ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    5-Year Trends
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  <div className="flex gap-1">
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
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <div className="h-40">
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
                            fontFamily: "Figures, IBM Plex Mono",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fill: "hsl(0,0%,60%)",
                            fontSize: 10,
                            fontFamily: "Figures, IBM Plex Mono",
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
                </div>
              </div>

              {/* ── GDP SECTOR COMPOSITION ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    GDP Composition by Sector
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  {(() => {
                    /* One lookup for the whole tile. The World Bank has no
                       national accounts for two of the economies listed here -
                       Taiwan is not one of its reporters, and Venezuela has no
                       figures - so those say so rather than showing a chart
                       built from nothing. */
                    const sectors: EconomySectors | undefined =
                      ECONOMY_SECTORS[economy.id];
                    if (!sectors) {
                      return (
                        <p className="text-[11px] font-sans text-muted-foreground">
                          The World Bank publishes no sector breakdown for{" "}
                          {economy.name}, so none is shown. Inventing one would
                          be worse than leaving it out.
                        </p>
                      );
                    }
                    const ranked = [...sectors.slices].sort((a, b) => b.pct - a.pct);
                    const dominant = ranked[0];
                    return (
                      <>
                        <div className="mb-4">
                          <SectorPie sectors={sectors} />
                        </div>
                        <div className="space-y-2.5 mb-3">
                          {sectors.slices.map((x) => (
                            <SectorBar key={x.name} name={x.name} share={x.pct} />
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                              Largest
                            </p>
                            <p className="text-xs font-bold font-sans text-foreground mt-0.5">
                              {dominant.name}
                            </p>
                            <p
                              className="text-[10px] font-mono"
                              style={{ color: getSectorColor(dominant.name) }}
                            >
                              {dominant.pct}%{" "}
                              {sectors.basis === "gdp" ? "of GDP" : "of value added"}
                            </p>
                          </div>
                          <div className="text-center border-x border-border/40">
                            <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                              {sectors.topSubSector ? "Largest industry" : "Manufacturing"}
                            </p>
                            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                              {sectors.topSubSector
                                ? `${sectors.topSubSector.pct}%`
                                : sectors.manufacturing === null
                                  ? "—"
                                  : `${sectors.manufacturing}%`}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans">
                              {sectors.topSubSector
                                ? sectors.topSubSector.name.toLowerCase()
                                : sectors.manufacturing === null
                                  ? "not reported"
                                  : sectors.basis === "gdp"
                                    ? "of GDP, within industry"
                                    : "of value added, within industry"}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                              Reported
                            </p>
                            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                              {sectors.year}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans">
                              World Bank
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* ── NATIONAL BUDGET ── */}
              {economy.entityType === "Country" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                      Government Spending by Function
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                  <div className="modal-tile rounded-xl p-4">
                    {(() => {
                      const iso3 = ECONOMY_ISO3[economy.id];
                      const budget = iso3 ? COUNTRY_BUDGET_BY_ISO3[iso3] : undefined;
                      if (!budget) {
                        return (
                          <p className="text-[11px] font-sans text-muted-foreground">
                            {economy.name} does not report its government spending
                            by function to the IMF, so no breakdown is shown rather
                            than an estimate.
                          </p>
                        );
                      }
                      return <BudgetPie budget={budget} />;
                    })()}
                    <SourceLink sources={[BUDGET_SOURCE]} className="mt-3" />
                  </div>
                </div>
              )}

              {/* ── TRADE & PARTNERS ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Trade &amp; Partners
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
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
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════
                SECTION DIVIDER: MARKETS
            ════════════════════════════════════════ */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30">
                <span className="text-[10px] font-bold font-sans text-secondary uppercase tracking-widest">
                  Markets
                </span>
              </div>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="space-y-4">
              {/* Quick KPI tiles */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Financial Markets
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Stock Market Cap",
                      value: `$${economy.stockMarketCap}T`,
                      color: "text-secondary",
                    },
                    {
                      label: "FDI Inflow",
                      value: `$${economy.fdiInflowBillions}B`,
                      color: "text-green-400",
                    },
                    {
                      label: "Trade Volume",
                      value: `$${economy.tradeVolumeTrillions}T`,
                      color: "text-blue-400",
                    },
                    {
                      label: "Interest Rate",
                      value: `${economy.interestRate}%`,
                      color:
                        economy.interestRate > 5
                          ? "text-warning"
                          : "text-success",
                    },
                    {
                      label: "Debt / GDP",
                      value: `${economy.debtToGDPRatio}%`,
                      color:
                        economy.debtToGDPRatio > 100
                          ? "text-destructive"
                          : economy.debtToGDPRatio > 60
                            ? "text-warning"
                            : "text-success",
                    },
                    {
                      label: "Credit Rating",
                      value: economy.creditRating,
                      color: ratingColor(economy.creditRating).split(" ")[0],
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="modal-tile rounded-xl p-3 flex items-center gap-3"
                    >
                      <div>
                        <p className="text-[10px] text-muted-foreground font-sans">
                          {s.label}
                        </p>
                        <p
                          className={`text-base font-bold font-mono ${s.color}`}
                        >
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inflation vs Growth trend */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Growth vs Inflation Trend
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={economy.trends}
                        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
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
                            fontFamily: "Figures, IBM Plex Mono",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fill: "hsl(0,0%,55%)",
                            fontSize: 9,
                            fontFamily: "Figures, IBM Plex Mono",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="growth"
                          name="GDP Growth %"
                          fill="hsl(142,60%,45%)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={18}
                        />
                        <Bar
                          dataKey="inflation"
                          name="Inflation %"
                          fill="hsl(35,100%,50%)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {[
                      { label: "GDP Growth", color: "hsl(142,60%,45%)" },
                      { label: "Inflation", color: "hsl(35,100%,50%)" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ background: l.color }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {l.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SourceLink sources={SRC_OECD} showIcon={false} />
            </div>

            {/* ════════════════════════════════════════
                SECTION DIVIDER: RESOURCES
            ════════════════════════════════════════ */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                <span className="text-[10px] font-bold font-sans text-amber-400 uppercase tracking-widest">
                  Resources
                </span>
              </div>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="space-y-4">
              {(() => {
                const pieData = resources.map((r) => ({
                  name: r.name,
                  value: r.value,
                }));
                /* Rents are each a share of GDP and do not sum to 100, so the
                   only whole a pie of them can represent is their own total.
                   Stated rather than left for the reader to infer from a slice
                   that is 45% of the circle next to a label reading 3.2%. */
                const rentTotal = resources.reduce(
                  (n: number, r: { value: number }) => n + (r.value || 0),
                  0,
                );
                const rentShare = (v: number) =>
                  rentTotal > 0 ? Math.round((v / rentTotal) * 1000) / 10 : 0;

                const ResourceTooltip = ({ active, payload }: any) => {
                  if (active && payload?.length) {
                    const entry = payload[0];
                    const res = resources.find((r) => r.name === entry.name);
                    return (
                      <div className="bg-card border border-border rounded-lg p-2.5 text-xs font-mono shadow-lg">
                        <p
                          style={{ color: res?.color ?? "#fff" }}
                          className="font-semibold"
                        >
                          {entry.name}
                        </p>
                        <p className="text-foreground">
                          {rentShare(entry.value)}% of this economy's resource
                          rents
                        </p>
                        <p className="text-foreground">
                          {entry.value} {res?.unit}
                        </p>
                        <p className="text-muted-foreground">{res?.share}</p>
                      </div>
                    );
                  }
                  return null;
                };
                return (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                          Natural Resources &amp; Commodities
                        </span>
                        <div className="flex-1 h-px bg-border/60" />
                        <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
                          {resources.length} tracked
                        </span>
                      </div>

                      {/* Donut + resource rows in a single tile. The separate
                          "Production & Output" bar chart listed the same five
                          resources a second time, so its data is shown here as
                          inline bars instead. */}
                      {resources.length === 0 ? (
                        <div className="modal-tile rounded-xl p-4 mb-3">
                          <p className="text-[11px] font-sans text-muted-foreground">
                            The World Bank publishes no resource-rent figures
                            for {economy.name}, so none are shown.
                            {economy.name === "Venezuela" &&
                              " Its last reported oil rents were 11.3% of GDP in 2014; nothing has been published since, and a twelve-year-old figure is not a current one."}
                          </p>
                        </div>
                      ) : (
                      <div className="modal-tile rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="shrink-0"
                            style={{ width: 120, height: 120 }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  /* A pie: no hole, and no gaps, because the
                                     slices are parts of one total. */
                                  innerRadius={0}
                                  outerRadius={54}
                                  paddingAngle={0}
                                  dataKey="value"
                                  startAngle={90}
                                  endAngle={-270}
                                  isAnimationActive
                                  animationDuration={600}
                                >
                                  {pieData.map((entry) => {
                                    const res = resources.find(
                                      (r) => r.name === entry.name,
                                    );
                                    return (
                                      <Cell
                                        key={entry.name}
                                        fill={res?.color ?? "#94a3b8"}
                                        stroke="transparent"
                                      />
                                    );
                                  })}
                                </Pie>
                                <Tooltip content={<ResourceTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-bold font-mono truncate"
                              style={{ color: resources[0]?.color }}
                            >
                              {resources[0]?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans">
                              {resources[0]?.share}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-sans mt-1.5 leading-snug">
                              Slices are each commodity's share of this
                              economy's resource rents, which together come to{" "}
                              {Math.round(rentTotal * 10) / 10}% of GDP. The
                              rows below give each one as its own share of GDP.
                              2021 is the latest year the World Bank has
                              published resource rents for any country; the
                              series has not been updated since.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {resources.slice(0, 5).map((r) => {
                            // Units differ between rows, so the bar shows each
                            // resource against the largest value in this set
                            // rather than implying a like-for-like comparison.
                            const peak = Math.max(
                              ...resources.slice(0, 5).map((x) => x.value),
                              1,
                            );
                            return (
                              <div key={r.name}>
                                <div className="flex justify-between text-xs mb-1 gap-3">
                                  <span className="text-muted-foreground font-sans truncate">
                                    {r.name}
                                    {r.share && (
                                      <span className="text-muted-foreground/60">
                                        {" · "}
                                        {r.share}
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono text-foreground shrink-0">
                                    {r.value}
                                    <span className="text-muted-foreground">
                                      {" "}
                                      {r.unit}
                                    </span>
                                  </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${(r.value / peak) * 100}%`,
                                      background: r.color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      )}

                      {/* Summary strip. Only where there is something to
                          summarise: it named a data source even when no source
                          had reported anything. */}
                      {resources.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="modal-tile rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                            Resources
                          </p>
                          <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                            {resources.length}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-sans">
                            tracked
                          </p>
                        </div>
                        <div className="modal-tile rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                            Top Resource
                          </p>
                          <p
                            className="text-xs font-bold font-sans mt-0.5"
                            style={{ color: resources[0]?.color }}
                          >
                            {resources[0]?.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-sans">
                            {resources[0]?.share}
                          </p>
                        </div>
                        <div className="modal-tile rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                            Data Source
                          </p>
                          <p className="text-[10px] font-sans text-muted-foreground mt-0.5 leading-snug">
                            World Bank 2021 · USGS 2026
                          </p>
                        </div>
                      </div>
                      )}

                      {/* ── Critical minerals ──
                          From the USGS Mineral Commodity Summaries 2026, 2025
                          figures. What was here was hand-written: reserves of
                          neodymium, dysprosium, lanthanum and cerium given
                          separately for each economy, which USGS does not
                          publish for any country, and a generic default list
                          handed to every economy that had no entry. */}
                      {(() => {
                        const minerals = CRITICAL_MINERALS[economy.id] ?? [];
                        const mined = minerals.filter((m) => m.production).length;
                        const heldOnly = minerals.length - mined;
                        return (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                                Rare Earth &amp; Critical Minerals
                              </span>
                              <div className="flex-1 h-px bg-border/60" />
                              {minerals.length > 0 && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-warning/10 mineral-pill-surplus border border-warning/25">
                                    {mined} mined
                                  </span>
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-success/10 mineral-pill-has border border-success/25">
                                    {heldOnly} reserves only
                                  </span>
                                </div>
                              )}
                            </div>

                            {minerals.length === 0 ? (
                              <p className="text-[11px] font-sans text-muted-foreground">
                                USGS reports no reserves or mine production of
                                these minerals for {economy.name}.
                              </p>
                            ) : (
                              <div className="divide-y divide-border/40">
                                {minerals.map((m) => (
                                  <div key={m.name} className="flex items-start gap-2 py-2">
                                    <span className="text-[10px] font-bold font-mono px-1 py-0.5 rounded shrink-0 bg-muted text-foreground mt-0.5">
                                      {m.symbol}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-semibold font-sans text-foreground">
                                        {m.name}
                                      </p>
                                      {m.use && (
                                        <p className="text-[9px] text-muted-foreground font-sans leading-snug">
                                          {m.use}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0 grid grid-cols-2 gap-x-3 gap-y-0.5">
                                      <p className="text-[8px] font-sans uppercase tracking-wide text-muted-foreground">
                                        Reserves
                                      </p>
                                      <p className="text-[8px] font-sans uppercase tracking-wide text-muted-foreground">
                                        Mined 2025
                                      </p>
                                      <p className="text-[10px] font-mono text-foreground">
                                        {fmtTonnes(m.reserves)}
                                      </p>
                                      <p className="text-[10px] font-mono text-foreground">
                                        {fmtTonnes(m.production)}
                                      </p>
                                      <p className="text-[9px] font-mono text-muted-foreground">
                                        {fmtShare(m.reserveShare)}
                                      </p>
                                      <p className="text-[9px] font-mono text-muted-foreground">
                                        {fmtShare(m.productionShare)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-[9px] font-sans text-muted-foreground mt-2 leading-snug">
                              {CRITICAL_MINERALS_SOURCE.label}, {CRITICAL_MINERALS_SOURCE.year}{" "}
                              figures (estimates for the latest year). Rare earths
                              are one total: USGS does not report reserves for
                              individual rare-earth elements by country. "—" is a
                              figure USGS withholds or does not report, not a zero.
                              "≤" marks a share of a world total USGS gives only as
                              a minimum.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    <SourceLink
                      sources={[
                        {
                          label: "World Bank — natural resource rents",
                          url: "https://data.worldbank.org/indicator/NY.GDP.TOTL.RT.ZS",
                        },
                        {
                          label: CRITICAL_MINERALS_SOURCE.label,
                          url: CRITICAL_MINERALS_SOURCE.url,
                        },
                      ]}
                      showIcon={false}
                    />
                  </>
                );
              })()}
            </div>

            {/* ════════════════════════════════════════
                SECTION DIVIDER: MARITIME
            ════════════════════════════════════════ */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30">
                <span className="text-[10px] font-bold font-sans text-blue-400 uppercase tracking-widest">
                  Maritime
                </span>
              </div>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Maritime Trade
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-4">
                    {economy.maritime.maritimeTrade}
                  </p>

                  {/* KPI tiles */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Annual Cargo
                      </p>
                      <p className="text-base font-bold font-mono text-secondary">
                        {economy.maritime.annualCargoMT.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        metric tonnes
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        TEU
                      </p>
                      <p className="text-base font-bold font-mono text-foreground">
                        {(economy.maritime.containersTEU / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        containers
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Navy
                      </p>
                      <p className="text-xs font-mono text-foreground leading-tight mt-0.5">
                        {economy.maritime.navyStrength.split("—")[0].trim()}
                      </p>
                    </div>
                  </div>

                  {/* Ports */}
                  <div className="mb-3">
                    <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
                      Major Ports
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {economy.maritime.majorPorts.map((port) => (
                        <span
                          key={port}
                          className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                        >
                          {port}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Shipping lanes */}
                  <div>
                    <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
                      Shipping Lanes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {economy.maritime.shippingLanes.map((lane) => (
                        <span
                          key={lane}
                          className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                        >
                          {lane}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <SourceLink sources={SRC_MARITIME} showIcon={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewMode = "economies" | "resources";

/**
 * For the cards USGS covers, the headline holder and share are read from the
 * same USGS table as the country list inside the card, so the two cannot
 * disagree. They were typed in and had drifted — lithium said Chile held 36%
 * of the world's reserves, where USGS's 2026 figure is 24.9%; rare earths said
 * China held 38%, against up to 51.8%.
 *
 * The share is of reserves where USGS reports them, and says so; aluminum has
 * none (its reserves are bauxite, a different commodity), so its card gives
 * the share of smelter output. Gold is left as it is: its card leads with
 * central-bank holdings, a different and deliberate measure that its own
 * detail text explains.
 */
function usgsHeadline<T extends { name: string; holder: string; reserve: string }>(r: T): T {
  if (r.name === "Gold") return r;
  const p = RESOURCE_PRODUCERS[r.name];
  if (!p) return r;
  const mark = (b: string) => (b === "atMost" ? "≤" : b === "atLeast" ? "≥" : "");
  if (p.worldReserves) {
    const top = [...p.countries]
      .filter((c) => c.reservesShare)
      .sort((a, b) => (b.reserves?.tonnes ?? 0) - (a.reserves?.tonnes ?? 0))[0];
    if (!top?.reservesShare) return r;
    return {
      ...r,
      holder: top.name,
      reserve: `${mark(top.reservesShare.bound)}${top.reservesShare.pct}% of reserves`,
    };
  }
  const top = p.countries.find((c) => c.productionShare);
  if (!top?.productionShare) return r;
  return {
    ...r,
    holder: top.name,
    reserve: `${mark(top.productionShare.bound)}${top.productionShare.pct}% of output`,
  };
}

const RESOURCES_DATA = [
  {
    name: "Crude Oil",
    unit: "$/bbl",
    price: 83.2,
    change: +1.8,
    holder: "Saudi Arabia",
    reserve: "17% of global",
    color: "#f97316",
    icon: "🛢️",
  },
  {
    name: "Natural Gas",
    unit: "$/MMBtu",
    price: 2.84,
    change: -0.3,
    holder: "Russia",
    reserve: "24% of global",
    color: "#6366f1",
    icon: "🔥",
  },
  {
    name: "Gold",
    unit: "$/troy oz",
    price: 2341,
    change: +0.6,
    holder: "USA",
    reserve: "8,133 tons",
    color: "#f59e0b",
    icon: "🥇",
  },
  {
    name: "Coal",
    unit: "$/ton",
    price: 128,
    change: -2.1,
    holder: "China",
    reserve: "21% of global",
    color: "#6b7280",
    icon: "⛏️",
  },
  {
    name: "Iron Ore",
    unit: "$/ton",
    price: 114,
    change: +0.4,
    holder: "Australia",
    reserve: "28% of global",
    color: "#b45309",
    icon: "⚙️",
  },
  {
    name: "Copper",
    unit: "$/ton",
    price: 9280,
    change: +1.2,
    holder: "Chile",
    reserve: "23% of global",
    color: "#dc2626",
    icon: "🔩",
  },
  {
    name: "Lithium",
    unit: "$/ton",
    price: 15400,
    change: +3.4,
    holder: "Chile",
    reserve: "36% of global",
    color: "#7c3aed",
    icon: "🔋",
  },
  {
    name: "Wheat",
    unit: "$/bushel",
    price: 5.62,
    change: -0.8,
    holder: "Russia",
    reserve: "17% exports",
    color: "#ca8a04",
    icon: "🌾",
  },
  {
    name: "Rare Earth",
    unit: "$/kg avg",
    price: 42,
    change: +2.1,
    holder: "China",
    reserve: "38% of global",
    color: "#059669",
    icon: "🧲",
  },
  {
    name: "Uranium",
    unit: "$/lb",
    price: 91.5,
    change: +4.2,
    holder: "Kazakhstan",
    reserve: "29% of global",
    color: "#84cc16",
    icon: "☢️",
  },
  {
    name: "Aluminum",
    unit: "$/ton",
    price: 2410,
    change: +0.9,
    holder: "China",
    reserve: "N/A (produced)",
    color: "#94a3b8",
    icon: "🏗️",
  },
  {
    name: "Silver",
    unit: "$/troy oz",
    price: 29.4,
    change: +1.1,
    holder: "Mexico",
    reserve: "23% of global",
    color: "#cbd5e1",
    icon: "🥈",
  },
].map(usgsHeadline);

export function EconomiesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdpTrillions" | "gdpGrowthRate" | "inflationRate" | "stockMarketCap"
  >("gdpTrillions");
  const [modalEconomy, setModalEconomy] = useState<Economy | null>(null);
  const { rents: resourceRents } = useResourceRents();
  const [viewMode, setViewMode] = useState<ViewMode>("economies");
  const [selectedResource, setSelectedResource] =
    useState<ResourceSummary | null>(null);

  // Deep-link: open entity from search bar via ?open=<id>
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId) {
      const found = economiesData.find((e) => e.id === openId);
      if (found) setModalEconomy(found);
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const filtered = economiesData
    .filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || e.entityType === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);


  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
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

        {/* View Mode Tabs */}
        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Global GDP",
              value: "$118.4T",
              // World Bank world aggregate for 2025, the latest completed year
              // the source publishes. Was $104.5T labelled "estimated 2024".
              sub: "World Bank · 2025",
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

        <CurrencyConverter />

        <SourceLink sources={SRC_IMF} className="mb-4 -mt-2" />

        {/* Unified Search + Filter Bar */}
        <div className="search-sticky sticky top-16 z-30 flex flex-col border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
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
          {/* Row 2: View tabs + filters + sort */}
          <CollapsibleFilters id="economies">
            {(
              [
                {
                  id: "economies",
                  label: "Economies",
                  icon: <CurrencyDollar size={13} weight="fill" />,
                },
                {
                  id: "resources",
                  label: "Resources",
                  icon: <Tree size={13} weight="fill" />,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  viewMode === tab.id
                    ? "bg-secondary/20 border-secondary/40 text-secondary"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            {(["All", "Country", "Bloc"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  typeFilter === t
                    ? "chip-selected"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {t}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              aria-label="Sort results"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdpTrillions">Sort: GDP</option>
              <option value="gdpGrowthRate">Sort: GDP Growth</option>
              <option value="inflationRate">Sort: Inflation</option>
              <option value="stockMarketCap">Sort: Mkt Cap</option>
            </select>
          </CollapsibleFilters>
        </div>

        {/* ── Upcoming to Watch ── */}
        <div className="mb-6 bg-card border border-border rounded-2xl p-5">
          <div>
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
              🔥 Upcoming to Watch
            </p>
            <div className="flex flex-wrap gap-2">
              {getUpcoming("economies").map((e) => (
                <span
                  key={e.id}
                  className={`text-[10px] font-sans px-2.5 py-1 rounded-full border ${e.className}`}
                >
                  {e.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {modalEconomy && (
          <EconomyModal
            economy={modalEconomy}
            rents={resourceRents[modalEconomy.id]}
            onClose={() => setModalEconomy(null)}
          />
        )}

        {/* ── Resources View ── */}
        {viewMode === "resources" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold font-sans text-foreground">
                  Global Resource Markets
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Commodity prices, reserves & top holders · Aug 2026
                </p>
              </div>
              <span className="text-[10px] font-mono bg-muted border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                {RESOURCES_DATA.length} commodities tracked
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {RESOURCES_DATA.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setSelectedResource(r)}
                  aria-label={`${r.name} details`}
                  className="text-left w-full bg-card border border-border rounded-xl p-4 hover:border-secondary/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold font-sans text-foreground">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {r.unit}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${r.change >= 0 ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
                    >
                      {r.change >= 0 ? "+" : ""}
                      {r.change}%
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold font-mono mb-1"
                    style={{ color: r.color }}
                  >
                    {r.price.toLocaleString()}
                  </p>
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-sans">
                        Top Holder
                      </span>
                      <span className="text-[10px] font-semibold font-sans text-foreground">
                        {r.holder}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-sans">
                        Reserve
                      </span>
                      <span className="text-[10px] font-mono text-foreground">
                        {r.reserve}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.abs(r.change) * 15 + 30)}%`,
                        background: r.color,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
            {/* ── Critical minerals, global view ──
                From the USGS Mineral Commodity Summaries 2026. The table used to
                show neodymium, dysprosium, lanthanum and cerium for eight
                economies from the same invented per-element figures, labelled
                "USGS / BGS 2025", and the callouts below it had China at ~60%
                of rare-earth mining, Brazil at ~92% of niobium reserves and India
                with the largest thorium reserves. Against USGS those are 69%, at
                most 67%, and a figure it does not publish. */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold font-sans text-foreground">
                    Rare Earth &amp; Critical Minerals — Global Overview
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans">
                    Share of world mine production, {CRITICAL_MINERALS_SOURCE.year} ·{" "}
                    {CRITICAL_MINERALS_SOURCE.label}
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold min-w-[110px]">
                          Mineral
                        </th>
                        {OVERVIEW_ECONOMIES.map(([, label]) => (
                          <th
                            key={label}
                            className="text-center px-3 py-2.5 text-muted-foreground font-semibold whitespace-nowrap min-w-[80px]"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {OVERVIEW_MINERALS.map((mineralName, idx) => (
                        <tr
                          key={mineralName}
                          className={`border-b border-border/40 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                        >
                          <td className="px-4 py-2.5 font-semibold text-foreground">
                            {mineralName}
                          </td>
                          {OVERVIEW_ECONOMIES.map(([ecoId, label]) => {
                            const m = (CRITICAL_MINERALS[ecoId] ?? []).find(
                              (x) => x.name === mineralName,
                            );
                            const share = m?.productionShare ?? null;
                            return (
                              <td key={ecoId} className="px-3 py-2.5 text-center font-mono">
                                {share ? (
                                  <span
                                    className="text-foreground"
                                    title={`${label}: ${fmtTonnes(m!.production)} mined in ${CRITICAL_MINERALS_SOURCE.year}`}
                                  >
                                    {fmtShare(share).replace(" of world", "")}
                                  </span>
                                ) : m?.reserves ? (
                                  <span
                                    className="text-muted-foreground"
                                    title={`${label}: ${fmtTonnes(m.reserves)} in reserves, no mine production reported`}
                                  >
                                    reserves
                                  </span>
                                ) : (
                                  <span
                                    className="text-muted-foreground/50"
                                    title={`USGS reports no ${mineralName.toLowerCase()} for ${label}`}
                                  >
                                    ·
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-4 py-3 border-t border-border bg-muted/10 text-[10px] text-muted-foreground font-sans leading-snug">
                  Each cell is that economy's share of world mine production.
                  "reserves" means USGS reports reserves but no mine output; "·"
                  means USGS reports neither, or withholds the figure. Rare earths
                  are one total, as USGS reports them.
                </p>
              </div>

              {/* The most concentrated supply, computed from the same release -
                  including producers with no card on this page, since the
                  Democratic Republic of the Congo mines most cobalt either way. */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPLY_CONCENTRATION.slice(0, 3).map((c) => (
                  <div key={c.mineral} className="rounded-xl border border-border p-4">
                    <p className="text-xs font-bold font-sans text-foreground mb-1">
                      {c.mineral}
                    </p>
                    <p className="text-2xl font-bold font-mono text-foreground leading-none">
                      {c.pct}%
                    </p>
                    <p className="text-[11px] text-muted-foreground font-sans leading-snug mt-1">
                      of world mine production comes from {c.country} (
                      {fmtTonnes({ tonnes: c.tonnes, lowerBound: false })} of{" "}
                      {fmtTonnes({ tonnes: c.worldTonnes, lowerBound: false })}).
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <SourceLink
              sources={[{ label: CRITICAL_MINERALS_SOURCE.label, url: CRITICAL_MINERALS_SOURCE.url }]}
              className="mt-2"
            />
                        <SourceLink sources={SRC_WTO} className="mt-2" />
          </div>
        )}

        {/* ── Economies View (default) ── */}
        {viewMode === "economies" && (
          <div className="min-w-0">
            {/* Economy Cards */}
            <div className="space-y-4 min-w-0">
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
                          className="h-full rounded-full bg-sky-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (economy.gdpTrillions / 104.5) * 100 * 4)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* ── Inline country economic stats (for Country-type economies) ── */}
                    {economy.entityType === "Country" &&
                      (() => {
                        const country = countriesData.find(
                          (c) => c.name === economy.name || c.id === economy.id,
                        );
                        if (!country) return null;
                        const stats = [
                          {
                            label: "GDP Per Capita",
                            value: na(country.gdpPerCapita, (v) => `${v.toLocaleString()}`),
                            color: "text-foreground",
                          },
                          {
                            label: "GDP Growth",
                            value: na(country.gdpGrowth, (v) => `${v > 0 ? "+" : ""}${v}%`),
                            color:
                              country.gdpGrowth >= 0
                                ? "text-success"
                                : "text-destructive",
                          },
                          {
                            label: "Unemployment",
                            value: na(country.unemploymentRate, (v) => `${v}%`),
                            color:
                              country.unemploymentRate <= 5
                                ? "text-success"
                                : country.unemploymentRate <= 10
                                  ? "text-warning"
                                  : "text-destructive",
                          },
                          {
                            label: "Inflation",
                            value: na(country.inflationRate, (v) => `${v}%`),
                            color:
                              country.inflationRate <= 3
                                ? "text-success"
                                : country.inflationRate <= 8
                                  ? "text-warning"
                                  : "text-destructive",
                          },
                          {
                            label: "Trade Balance",
                            value: Number.isFinite(country.tradeBalance)
                              ? `${country.tradeBalance >= 0 ? "+" : ""}$${country.tradeBalance}B`
                              : "No data",
                            color: !Number.isFinite(country.tradeBalance)
                              ? "text-muted-foreground"
                              : country.tradeBalance >= 0
                                ? "text-success"
                                : "text-destructive",
                          },
                        ];
                        return (
                          <div className="mt-2 pt-2 border-t border-border/40">
                            <p className="text-[9px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
                              Country Economic Stats
                            </p>
                            <div className="grid grid-cols-5 gap-1">
                              {stats.map((s) => (
                                <div
                                  key={s.label}
                                  className="rounded-md bg-background/50 border border-border/40 px-1.5 py-1 text-center"
                                >
                                  <p className="text-[8px] text-muted-foreground font-sans leading-tight mb-0.5">
                                    {s.label}
                                  </p>
                                  <p
                                    className={`text-[10px] font-bold font-mono leading-tight ${s.color}`}
                                  >
                                    {s.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                    {/* Top sectors pills */}
                    <div className="flex flex-wrap gap-1 mt-2">
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
                    {(() => {
                      const gdpVals = economy.trends.map((t) => t.gdp);
                      const minGdp = Math.min(...gdpVals);
                      const maxGdp = Math.max(...gdpVals);
                      const pad = (maxGdp - minGdp) * 0.12 || maxGdp * 0.05;
                      const domainMin = Math.max(0, minGdp - pad);
                      const domainMax = maxGdp + pad;
                      return (
                        <>
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-secondary leading-none">
                              GDP $T
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono text-emerald-400 leading-none">
                                ▲{maxGdp.toFixed(2)}
                              </span>
                              <span className="text-[8px] font-mono text-rose-400 leading-none">
                                ▼{minGdp.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={economy.trends}
                                margin={{
                                  top: 4,
                                  right: 2,
                                  left: -28,
                                  bottom: 0,
                                }}
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
                                    fontFamily: "Figures, IBM Plex Mono",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                  interval={1}
                                />
                                <YAxis
                                  domain={[domainMin, domainMax]}
                                  tick={{
                                    fill: "hsl(0,0%,50%)",
                                    fontSize: 8,
                                    fontFamily: "Figures, IBM Plex Mono",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v) =>
                                    `${v % 1 === 0 ? v : v.toFixed(1)}`
                                  }
                                  tickCount={4}
                                  width={28}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: "hsl(222,30%,14%)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8,
                                    fontSize: 10,
                                    fontFamily: "Figures, IBM Plex Mono",
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
                                  dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.gdp === maxGdp) {
                                      return (
                                        <circle
                                          key={`hi-${economy.id}-${cx}`}
                                          cx={cx}
                                          cy={cy}
                                          r={3}
                                          fill="#4ade80"
                                          stroke="hsl(222,30%,14%)"
                                          strokeWidth={1}
                                        />
                                      );
                                    }
                                    if (payload.gdp === minGdp) {
                                      return (
                                        <circle
                                          key={`lo-${economy.id}-${cx}`}
                                          cx={cx}
                                          cy={cy}
                                          r={3}
                                          fill="#f87171"
                                          stroke="hsl(222,30%,14%)"
                                          strokeWidth={1}
                                        />
                                      );
                                    }
                                    return (
                                      <circle
                                        key={`dot-${economy.id}-${cx}`}
                                        cx={cx}
                                        cy={cy}
                                        r={0}
                                        fill="transparent"
                                      />
                                    );
                                  }}
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
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {selectedResource && (
        <ResourceModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}
