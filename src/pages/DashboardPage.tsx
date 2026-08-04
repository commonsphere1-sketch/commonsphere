import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  Globe,
  Buildings,
  MapTrifold,
  ChartBar,
  Scales,
  Crosshair,
  ArrowRight,
  TrendUp,
  TrendDown,
  ArrowUp,
  ArrowDown,
  Fire,
  Warning,
  Lightning,
  Atom,
  Flag,
  ShareNetwork,
  Users,
  ChatTeardropDots,
  Newspaper,
  Bank,
  Handshake,
  Sparkle,
  Info,
  Target,
  BookOpen,
  FileMagnifyingGlass,
  ChartLineUp,
  MapPin,
  PushPin,
  PushPinSlash,
  MagnifyingGlass,
  X,
  Pencil,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { SourceLink } from "../components/SourceLink";

const SRC_DASH_ECONOMY = [
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
  { label: "IMF WEO", url: "https://www.imf.org/en/Publications/WEO" },
];
const SRC_DASH_STATES = [
  {
    label: "Bureau of Economic Analysis",
    url: "https://www.bea.gov/data/gdp/gdp-state",
  },
  { label: "Bureau of Labor Statistics", url: "https://www.bls.gov/data/" },
];
const SRC_DASH_CITIES = [
  {
    label: "Numbeo City Rankings",
    url: "https://www.numbeo.com/city-rankings/",
  },
];
const SRC_DASH_CONFLICTS = [
  { label: "ACLED Conflict Data", url: "https://acleddata.com/" },
  { label: "Uppsala Conflict Data Program", url: "https://ucdp.uu.se/" },
];
const SRC_DASH_POLICIES = [
  {
    label: "OECD Policy Observatory",
    url: "https://www.oecd.org/gov/regulatory-policy/",
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const fmtB = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}T` : `$${n.toFixed(0)}B`;

/* ─── Static data ──────────────────────────────────────────────────────── */
const WORLD_GDP_SERIES = [
  { year: "2018", gdp: 85.8 },
  { year: "2019", gdp: 87.6 },
  { year: "2020", gdp: 84.9 },
  { year: "2021", gdp: 96.1 },
  { year: "2022", gdp: 100.6 },
  { year: "2023", gdp: 104.5 },
  { year: "2024", gdp: 105.4 },
];

const INFLATION_DATA = [
  { year: "2022", g20: 8.7, adv: 7.3 },
  { year: "2023", g20: 6.1, adv: 4.6 },
  { year: "2024", g20: 4.8, adv: 3.2 },
  { year: "2025", g20: 3.9, adv: 2.6 },
  { year: "2026", g20: 3.2, adv: 2.2 },
];

const RECENT_EVENTS = [
  {
    tag: "Conflict",
    color: "#ef4444",
    icon: <Warning size={12} weight="fill" />,
    title: "Red Sea shipping disruptions continue",
    date: "Jul 2025",
  },
  {
    tag: "Economy",
    color: "#f59e0b",
    icon: <ChartBar size={12} weight="fill" />,
    title: "Fed holds interest rate at 5.25%",
    date: "Jun 2025",
  },
  {
    tag: "Climate",
    color: "#10b981",
    icon: <Atom size={12} weight="fill" />,
    title: "G7 pledges $50B clean energy fund",
    date: "Jun 2025",
  },
  {
    tag: "Geopolitics",
    color: "#6366f1",
    icon: <Globe size={12} weight="fill" />,
    title: "BRICS+ summit opens in Kazan",
    date: "May 2025",
  },
  {
    tag: "Trade",
    color: "#a855f7",
    icon: <Scales size={12} weight="fill" />,
    title: "US-EU tariff truce extended 6 months",
    date: "May 2025",
  },
];

const NATIONAL_HIGHLIGHTS = [
  {
    tag: "Economy",
    color: "#3b82f6",
    icon: <Bank size={12} weight="fill" />,
    title: "US GDP growth revised up to 2.8% for Q2 2025",
    sub: "Bureau of Economic Analysis",
    date: "Jul 2025",
  },
  {
    tag: "Policy",
    color: "#6366f1",
    icon: <Scales size={12} weight="fill" />,
    title: "Senate passes infrastructure spending package",
    sub: "Congress · Domestic",
    date: "Jun 2025",
  },
  {
    tag: "Labor",
    color: "#10b981",
    icon: <Buildings size={12} weight="fill" />,
    title: "Unemployment holds at 3.9% — 3rd consecutive month",
    sub: "Bureau of Labor Statistics",
    date: "Jun 2025",
  },
  {
    tag: "Energy",
    color: "#f59e0b",
    icon: <Lightning size={12} weight="fill" />,
    title: "Federal clean energy tax credits extended through 2032",
    sub: "Department of Energy",
    date: "May 2025",
  },
];

const INTERNATIONAL_EVENTS = [
  {
    tag: "Diplomacy",
    color: "#6366f1",
    icon: <Handshake size={12} weight="fill" />,
    title: "G20 summit reaches consensus on AI governance framework",
    region: "Global",
    date: "Jul 2025",
  },
  {
    tag: "Trade",
    color: "#3b82f6",
    icon: <Newspaper size={12} weight="fill" />,
    title: "EU-Mercosur trade deal enters ratification phase",
    region: "Europe · S. America",
    date: "Jun 2025",
  },
  {
    tag: "Security",
    color: "#ef4444",
    icon: <Warning size={12} weight="fill" />,
    title: "NATO defence spending pledges hit record €1.1T",
    region: "NATO Alliance",
    date: "Jun 2025",
  },
  {
    tag: "Climate",
    color: "#10b981",
    icon: <Atom size={12} weight="fill" />,
    title: "COP30 pre-summit: 47 nations pledge net-zero by 2045",
    region: "UN Framework",
    date: "May 2025",
  },
];

const REGION_STATS = [
  { region: "North America", gdp: "$29.1T", growth: "+2.4%", up: true },
  { region: "European Union", gdp: "$18.4T", growth: "+1.1%", up: true },
  { region: "Asia-Pacific", gdp: "$38.7T", growth: "+4.3%", up: true },
  { region: "Middle East", gdp: "$4.2T", growth: "+1.8%", up: true },
  { region: "Sub-Saharan Africa", gdp: "$2.1T", growth: "+3.6%", up: true },
  { region: "Latin America", gdp: "$5.8T", growth: "-0.4%", up: false },
];

const ANALYST_PREVIEW = [
  {
    initials: "SC",
    name: "Dr. Sarah Chen",
    role: "Senior Economist",
    color: "#6366f1",
    online: true,
    insight:
      "BRICS expansion is accelerating dollar de-dollarization faster than consensus models predict. Watch Q3 reserves data.",
    tags: ["BRICS", "USD"],
    likes: 47,
    time: "2h ago",
  },
  {
    initials: "MW",
    name: "Marcus Webb",
    role: "Geopolitical Analyst",
    color: "#10b981",
    online: true,
    insight:
      "Ceasefire momentum in Eastern Europe is being underpriced by energy markets. Nat-gas futures divergence is widening.",
    tags: ["Ukraine", "Energy"],
    likes: 31,
    time: "5h ago",
  },
  {
    initials: "PN",
    name: "Priya Nair",
    role: "Policy Strategist",
    color: "#f97316",
    online: false,
    insight:
      "India&#39;s semiconductor subsidy package outpaces CHIPS Act on a per-capita basis. Supply chain realignment underway.",
    tags: ["India", "Tech"],
    likes: 28,
    time: "9h ago",
  },
];

const CONFLICTS_DATA = [
  {
    name: "Gaza / Israel",
    intensity: 92,
    type: "Armed Conflict",
    color: "#ef4444",
  },
  {
    name: "Ukraine / Russia",
    intensity: 88,
    type: "Interstate War",
    color: "#ef4444",
  },
  {
    name: "Sudan Civil War",
    intensity: 74,
    type: "Civil Conflict",
    color: "#f97316",
  },
  {
    name: "Myanmar Junta",
    intensity: 68,
    type: "Civil Conflict",
    color: "#f97316",
  },
  {
    name: "Sahel Insurgency",
    intensity: 61,
    type: "Terrorism",
    color: "#f59e0b",
  },
];

const CITIES_DATA = [
  {
    city: "New York",
    country: "USA",
    flag: "🇺🇸",
    pop: "8.4M",
    gdpPerCapita: 92,
    gdpLabel: "$92k",
    growth: "+1.2%",
    up: true,
    color: "#6366f1",
  },
  {
    city: "San Francisco",
    country: "USA",
    flag: "🇺🇸",
    pop: "4.8M",
    gdpPerCapita: 141,
    gdpLabel: "$141k",
    growth: "+2.1%",
    up: true,
    color: "#8b5cf6",
  },
  {
    city: "Zurich",
    country: "Switzerland",
    flag: "🇨🇭",
    pop: "435k",
    gdpPerCapita: 120,
    gdpLabel: "$120k",
    growth: "+1.6%",
    up: true,
    color: "#3b82f6",
  },
  {
    city: "London",
    country: "UK",
    flag: "🇬🇧",
    pop: "9.8M",
    gdpPerCapita: 76,
    gdpLabel: "$76k",
    growth: "+1.4%",
    up: true,
    color: "#06b6d4",
  },
  {
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    pop: "13.8M",
    gdpPerCapita: 43,
    gdpLabel: "$43k",
    growth: "+0.8%",
    up: true,
    color: "#10b981",
  },
  {
    city: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    pop: "6.0M",
    gdpPerCapita: 87,
    gdpLabel: "$87k",
    growth: "+3.2%",
    up: true,
    color: "#f59e0b",
  },
  {
    city: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    pop: "3.8M",
    gdpPerCapita: 46,
    gdpLabel: "$46k",
    growth: "+3.7%",
    up: true,
    color: "#f97316",
  },
  {
    city: "Shanghai",
    country: "China",
    flag: "🇨🇳",
    pop: "25.0M",
    gdpPerCapita: 31,
    gdpLabel: "$31k",
    growth: "+4.9%",
    up: true,
    color: "#ef4444",
  },
  {
    city: "Sydney",
    country: "Australia",
    flag: "🇦🇺",
    pop: "5.5M",
    gdpPerCapita: 65,
    gdpLabel: "$65k",
    growth: "+2.3%",
    up: true,
    color: "#a855f7",
  },
  {
    city: "Paris",
    country: "France",
    flag: "🇫🇷",
    pop: "2.2M",
    gdpPerCapita: 60,
    gdpLabel: "$60k",
    growth: "+1.1%",
    up: true,
    color: "#ec4899",
  },
];

const CITIES_CHART_DATA = [
  { name: "SFO", gdp: 141 },
  { name: "ZRH", gdp: 120 },
  { name: "NYC", gdp: 92 },
  { name: "SGP", gdp: 87 },
  { name: "SYD", gdp: 65 },
  { name: "LDN", gdp: 76 },
  { name: "PAR", gdp: 60 },
  { name: "TYO", gdp: 43 },
  { name: "DXB", gdp: 46 },
  { name: "SHA", gdp: 31 },
];

const POLICY_FEED = [
  {
    tag: "Climate",
    color: "#10b981",
    title: "EU Carbon Border Adjustment Mechanism enters full enforcement",
    date: "Jul 2025",
  },
  {
    tag: "Tech",
    color: "#6366f1",
    title: "US AI Executive Order requires federal agency compliance audits",
    date: "Jun 2025",
  },
  {
    tag: "Trade",
    color: "#3b82f6",
    title: "WTO rules in favour of India on steel tariff dispute",
    date: "Jun 2025",
  },
  {
    tag: "Defense",
    color: "#ef4444",
    title: "UK-France joint defense procurement framework signed",
    date: "May 2025",
  },
];

const SECTOR_OUTLOOK = [
  {
    sector: "Defense",
    outlook: "+18%",
    confidence: 88,
    up: true,
    color: "#ef4444",
  },
  {
    sector: "Renewables",
    outlook: "+24%",
    confidence: 76,
    up: true,
    color: "#10b981",
  },
  {
    sector: "Semiconductors",
    outlook: "+31%",
    confidence: 71,
    up: true,
    color: "#6366f1",
  },
  {
    sector: "AI Infrastructure",
    outlook: "+42%",
    confidence: 83,
    up: true,
    color: "#a855f7",
  },
  {
    sector: "Commodities",
    outlook: "-6%",
    confidence: 62,
    up: false,
    color: "#f59e0b",
  },
  {
    sector: "EM Debt",
    outlook: "-11%",
    confidence: 69,
    up: false,
    color: "#ef4444",
  },
  {
    sector: "Biotech",
    outlook: "+19%",
    confidence: 67,
    up: true,
    color: "#06b6d4",
  },
  {
    sector: "Real Estate",
    outlook: "-4%",
    confidence: 58,
    up: false,
    color: "#f97316",
  },
];

const MACRO_SIGNALS = [
  { label: "Fed Funds Rate", value: "5.25%", delta: "hold", neutral: true },
  { label: "US 10Y Yield", value: "4.31%", delta: "+12bps", up: true },
  { label: "USD Index (DXY)", value: "104.6", delta: "-0.4%", up: false },
  { label: "Brent Crude", value: "$83.2", delta: "+1.8%", up: true },
  { label: "Gold (XAU)", value: "$2,341", delta: "+0.6%", up: true },
];

const SECTOR_SPARKLINES: Record<string, { v: number }[]> = {
  "AI Infrastructure": [
    { v: 22 },
    { v: 28 },
    { v: 31 },
    { v: 27 },
    { v: 35 },
    { v: 39 },
    { v: 42 },
  ],
  Renewables: [
    { v: 14 },
    { v: 18 },
    { v: 17 },
    { v: 22 },
    { v: 20 },
    { v: 23 },
    { v: 24 },
  ],
  Semiconductors: [
    { v: 18 },
    { v: 22 },
    { v: 19 },
    { v: 26 },
    { v: 30 },
    { v: 28 },
    { v: 31 },
  ],
};

const QUICK_STATS = [
  {
    label: "Countries Tracked",
    value: "195",
    icon: <Globe size={18} weight="fill" />,
    color: "#6366f1",
  },
  {
    label: "US States",
    value: "50",
    icon: <MapTrifold size={18} weight="fill" />,
    color: "#3b82f6",
  },
  {
    label: "Global Cities",
    value: "500+",
    icon: <Buildings size={18} weight="fill" />,
    color: "#10b981",
  },
  {
    label: "Active Conflicts",
    value: "42",
    icon: <Crosshair size={18} weight="fill" />,
    color: "#ef4444",
  },
];

/* ─── Pinned Dashboard logic ────────────────────────────────────────────── */
const LS_KEY_COUNTRIES = "cs_pinned_countries";
const LS_KEY_STATES = "cs_pinned_states";

function usePinned(key: string, defaultIds: string[]) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultIds;
    } catch {
      return defaultIds;
    }
  });

  const toggle = (id: string) =>
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });

  return { ids, toggle };
}

/* ─── Pinned Section Component ─────────────────────────────────────────── */
function PinnedSection({
  isLight,
  cardBg,
  cardBorder,
  cardShadow,
  gridLine,
  headText,
  mutedText,
  bodyText,
  onNav,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  gridLine: string;
  headText: string;
  mutedText: string;
  bodyText: string;
  onNav: (path: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");

  const { ids: pinnedCountryIds, toggle: toggleCountry } = usePinned(
    LS_KEY_COUNTRIES,
    ["us", "cn", "de", "gb", "jp"],
  );
  const { ids: pinnedStateIds, toggle: toggleState } = usePinned(
    LS_KEY_STATES,
    ["ca", "tx", "ny", "fl", "wa"],
  );

  const pinnedCountries = useMemo(
    () => countriesData.filter((c) => pinnedCountryIds.includes(c.id)),
    [pinnedCountryIds],
  );
  const pinnedStates = useMemo(
    () => usStatesData.filter((s) => pinnedStateIds.includes(s.id)),
    [pinnedStateIds],
  );

  const filteredCountries = useMemo(
    () =>
      countriesData.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()),
      ),
    [countrySearch],
  );
  const filteredStates = useMemo(
    () =>
      usStatesData.filter(
        (s) =>
          s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.abbreviation.toLowerCase().includes(stateSearch.toLowerCase()),
      ),
    [stateSearch],
  );

  const accent = "#6366f1";
  const pillBg = isLight ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.12)";
  const pillBorder = isLight
    ? "rgba(99,102,241,0.22)"
    : "rgba(99,102,241,0.28)";
  const totalPinned = pinnedCountries.length + pinnedStates.length;

  /* ── Empty state ── */
  if (totalPinned === 0 && !editing) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: cardShadow,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: accent + "12",
              border: `1px solid ${accent}25`,
            }}
          >
            <PushPin size={16} weight="fill" style={{ color: accent }} />
          </div>
          <div>
            <p
              className="text-sm font-bold font-sans"
              style={{ color: headText }}
            >
              My Dashboard
            </p>
            <p className="text-[11px] font-sans" style={{ color: mutedText }}>
              Pin countries and states you follow — they&#39;ll appear here at a
              glance.
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 shrink-0"
          style={{
            background: pillBg,
            border: `1px solid ${pillBorder}`,
            color: accent,
          }}
        >
          <Pencil size={11} weight="bold" /> Customize
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
    >
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: accent + "12",
              border: `1px solid ${accent}22`,
            }}
          >
            <PushPin size={13} weight="fill" style={{ color: accent }} />
          </div>
          <span
            className="text-sm font-bold font-sans"
            style={{ color: headText }}
          >
            My Dashboard
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: accent + "14", color: accent }}
          >
            {totalPinned} pinned
          </span>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{
            background: editing ? accent + "18" : pillBg,
            border: `1px solid ${editing ? accent + "44" : pillBorder}`,
            color: accent,
          }}
        >
          {editing ? (
            <>
              <CheckCircle size={12} weight="bold" /> Done
            </>
          ) : (
            <>
              <Pencil size={11} weight="bold" /> Customize
            </>
          )}
        </button>
      </div>

      {/* ── Edit picker panel ── */}
      {editing && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-px"
          style={{ background: gridLine }}
        >
          {/* Countries picker */}
          {[
            {
              label: "Countries",
              items: filteredCountries.slice(0, 40),
              pinnedIds: pinnedCountryIds,
              toggle: toggleCountry,
              search: countrySearch,
              setSearch: setCountrySearch,
              placeholder: "Search countries…",
              renderItem: (c: (typeof filteredCountries)[0]) => (
                <>
                  <span className="text-base w-6 shrink-0">{c.flag}</span>
                  <span
                    className="flex-1 text-[11px] font-sans truncate"
                    style={{ color: headText }}
                  >
                    {c.name}
                  </span>
                </>
              ),
            },
            {
              label: "US States",
              items: filteredStates as typeof filteredCountries,
              pinnedIds: pinnedStateIds,
              toggle: toggleState,
              search: stateSearch,
              setSearch: setStateSearch,
              placeholder: "Search states…",
              renderItem: (item: (typeof filteredStates)[0]) => {
                const s = item as (typeof filteredStates)[0];
                return (
                  <>
                    <span
                      className="text-[9px] font-mono font-bold w-7 text-center rounded-md py-0.5 shrink-0"
                      style={{
                        background: isLight
                          ? "rgba(59,130,246,0.1)"
                          : "rgba(147,197,253,0.1)",
                        color: isLight ? "#3b82f6" : "#93c5fd",
                      }}
                    >
                      {(s as any).abbreviation}
                    </span>
                    <span
                      className="flex-1 text-[11px] font-sans truncate"
                      style={{ color: headText }}
                    >
                      {s.name}
                    </span>
                  </>
                );
              },
            },
          ].map((col) => (
            <div
              key={col.label}
              className="px-4 py-4"
              style={{
                background: isLight
                  ? "rgba(0,0,0,0.015)"
                  : "rgba(255,255,255,0.025)",
              }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                {col.label}
              </p>
              {/* Search */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${gridLine}`,
                }}
              >
                <MagnifyingGlass
                  size={12}
                  style={{ color: mutedText, flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder={col.placeholder}
                  value={col.search}
                  onChange={(e) => col.setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
                  style={{ color: bodyText }}
                />
              </div>
              {/* List */}
              <div className="flex flex-col max-h-52 overflow-y-auto -mx-1 px-1">
                {col.items.map((item) => {
                  const pinned = col.pinnedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => col.toggle(item.id)}
                      className="flex items-center gap-2.5 py-2 text-left transition-opacity hover:opacity-75 rounded-lg px-1"
                      style={{ borderBottom: `1px solid ${gridLine}` }}
                    >
                      {col.renderItem(item)}
                      <span
                        className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                        style={{
                          background: pinned ? accent + "15" : "transparent",
                          color: pinned ? accent : mutedText,
                        }}
                      >
                        {pinned ? (
                          <PushPin size={11} weight="fill" />
                        ) : (
                          <PushPinSlash size={11} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pinned cards grid ── */}
      <div className="p-5 flex flex-col gap-5">
        {/* Countries */}
        {pinnedCountries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: mutedText }}
              >
                Countries
              </p>
              <button
                onClick={() => onNav("/dashboard/countries")}
                className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: accent }}
              >
                View all <ArrowRight size={10} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {pinnedCountries.map((c) => {
                const gdpUp = c.gdpGrowth >= 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => onNav("/dashboard/countries")}
                    className="rounded-xl p-3 text-left flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] relative group"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.025)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    {/* Remove button */}
                    {editing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCountry(c.id);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "#ef444420", color: "#ef4444" }}
                      >
                        <X size={9} weight="bold" />
                      </button>
                    )}
                    {/* Flag + name */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none shrink-0">
                        {c.flag}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-[11px] font-bold font-sans truncate leading-tight"
                          style={{ color: headText }}
                        >
                          {c.name}
                        </p>
                        <p
                          className="text-[9px] font-mono truncate"
                          style={{ color: mutedText }}
                        >
                          {c.region}
                        </p>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div
                      className="flex items-center justify-between pt-2"
                      style={{ borderTop: `1px solid ${gridLine}` }}
                    >
                      <div>
                        <p
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          GDP growth
                        </p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {gdpUp ? (
                            <TrendUp size={10} weight="fill" color="#10b981" />
                          ) : (
                            <TrendDown
                              size={10}
                              weight="fill"
                              color="#ef4444"
                            />
                          )}
                          <span
                            className="text-[11px] font-mono font-semibold"
                            style={{ color: gdpUp ? "#10b981" : "#ef4444" }}
                          >
                            {gdpUp ? "+" : ""}
                            {c.gdpGrowth}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          Unemp.
                        </p>
                        <span
                          className="text-[11px] font-mono font-semibold"
                          style={{
                            color:
                              c.unemploymentRate < 5 ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {c.unemploymentRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* States */}
        {pinnedStates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: mutedText }}
              >
                US States
              </p>
              <button
                onClick={() => onNav("/dashboard/states")}
                className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: "#3b82f6" }}
              >
                View all <ArrowRight size={10} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {pinnedStates.map((s) => {
                const unempGood = s.unemploymentRate < 4;
                return (
                  <button
                    key={s.id}
                    onClick={() => onNav("/dashboard/states")}
                    className="rounded-xl p-3 text-left flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] relative group"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.025)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    {editing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleState(s.id);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "#ef444420", color: "#ef4444" }}
                      >
                        <X size={9} weight="bold" />
                      </button>
                    )}
                    {/* Abbr + name */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono font-bold w-8 text-center rounded-md py-0.5 shrink-0"
                        style={{
                          background: isLight
                            ? "rgba(59,130,246,0.12)"
                            : "rgba(147,197,253,0.12)",
                          color: isLight ? "#3b82f6" : "#93c5fd",
                        }}
                      >
                        {s.abbreviation}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-[11px] font-bold font-sans truncate leading-tight"
                          style={{ color: headText }}
                        >
                          {s.name}
                        </p>
                        <p
                          className="text-[9px] font-mono truncate"
                          style={{ color: mutedText }}
                        >
                          {s.region}
                        </p>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div
                      className="flex items-center justify-between pt-2"
                      style={{ borderTop: `1px solid ${gridLine}` }}
                    >
                      <div>
                        <p
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          Unemp.
                        </p>
                        <span
                          className="text-[11px] font-mono font-semibold"
                          style={{ color: unempGood ? "#10b981" : "#f59e0b" }}
                        >
                          {s.unemploymentRate}%
                        </span>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[9px] font-mono"
                          style={{ color: mutedText }}
                        >
                          GDP
                        </p>
                        <span
                          className="text-[11px] font-mono font-semibold"
                          style={{ color: headText }}
                        >
                          {fmtB(s.gdp)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Reusable Section Header ───────────────────────────────────────────── */
function SectionHeader({
  icon,
  label,
  badge,
  badgeColor,
  cta,
  ctaTo,
  isLight,
  onNav,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  cta?: string;
  ctaTo?: string;
  isLight: boolean;
  onNav?: () => void;
}) {
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const accentColor = badgeColor ?? "#6366f1";
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span style={{ color: accentColor }}>{icon}</span>
        <h2
          className="text-base font-bold font-sans"
          style={{ color: headText }}
        >
          {label}
        </h2>
        {badge && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: accentColor + "15", color: accentColor }}
          >
            {badge}
          </span>
        )}
      </div>
      {cta && onNav && (
        <button
          onClick={onNav}
          className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: accentColor }}
        >
          {cta} <ArrowRight size={11} weight="bold" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const topCountries = useMemo(
    () => [...countriesData].sort((a, b) => b.gdp - a.gdp).slice(0, 6),
    [],
  );
  const topStates = useMemo(
    () => [...usStatesData].sort((a, b) => b.gdp - a.gdp).slice(0, 6),
    [],
  );

  return (
    <div
      className="min-h-screen w-full animate-fade-in"
      style={{ background: isLight ? "#f8fafc" : "#0b0b14", color: bodyText }}
    >
      <div className="w-full px-4 sm:px-5 py-4 flex flex-col gap-4">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
          style={{
            background: isLight
              ? "linear-gradient(130deg, #dbeafe 0%, #e0e7ff 60%, #d1fae5 100%)"
              : "linear-gradient(130deg, #0f1535 0%, #0b0b14 50%, #0c1a0e 100%)",
            border: isLight
              ? "1px solid rgba(99,102,241,0.18)"
              : "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(circle, ${isLight ? "#4f46e5" : "#818cf8"} 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: isLight ? "#4f46e5" : "#818cf8" }}
            >
              CommonSphere · Global Intelligence
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold font-sans"
              style={{ color: headText }}
            >
              Dashboard
            </h1>
            <p
              className="text-sm font-sans mt-1 max-w-md"
              style={{ color: mutedText }}
            >
              Real-time data on countries, economies, conflicts, and policies
              across the world.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2 shrink-0">
            {QUICK_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: isLight
                    ? "rgba(255,255,255,0.72)"
                    : "rgba(255,255,255,0.07)",
                  border: isLight
                    ? "1px solid rgba(99,102,241,0.15)"
                    : "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <p
                    className="text-sm font-bold font-mono leading-none"
                    style={{ color: headText }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-[10px] font-sans"
                    style={{ color: mutedText }}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PINNED / MY DASHBOARD ─────────────────────────────────────── */}
        <PinnedSection
          isLight={isLight}
          cardBg={cardBg}
          cardBorder={cardBorder}
          cardShadow={cardShadow}
          gridLine={gridLine}
          headText={headText}
          mutedText={mutedText}
          bodyText={bodyText}
          onNav={navigate}
        />

        {/* ── KPI PILLS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Countries Tracked",
              value: "195",
              delta: "6 continents",
              positive: true,
              icon: <Globe size={14} weight="fill" />,
            },
            {
              label: "Active Conflicts",
              value: "42",
              delta: "3 escalating",
              positive: false,
              icon: <Crosshair size={14} weight="fill" />,
            },
            {
              label: "Policies Tracked",
              value: "1,200+",
              delta: "+48 this month",
              positive: true,
              icon: <Scales size={14} weight="fill" />,
            },
            {
              label: "Analyst Network",
              value: "127+",
              delta: "3 online now",
              positive: true,
              icon: <Users size={14} weight="fill" />,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl px-5 py-4 flex flex-col gap-1.5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <p
                className="text-[11px] font-sans uppercase tracking-widest"
                style={{ color: mutedText }}
              >
                {k.label}
              </p>
              <p
                className="text-2xl font-bold font-mono"
                style={{ color: headText }}
              >
                {k.value}
              </p>
              <div className="flex items-center gap-1">
                <span style={{ color: k.positive ? "#10b981" : "#ef4444" }}>
                  {k.icon}
                </span>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: k.positive ? "#10b981" : "#ef4444" }}
                >
                  {k.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* COL 1–2: Countries + Economies */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* COUNTRIES container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<Globe size={16} weight="fill" />}
                label="Countries"
                badge="195 tracked"
                badgeColor="#6366f1"
                cta="All Countries"
                ctaTo="/dashboard/countries"
                isLight={isLight}
                onNav={() => navigate("/dashboard/countries")}
              />
              {/* World GDP chart */}
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={WORLD_GDP_SERIES}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="dashWorldGdp"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tick={{
                      fontSize: 9,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 9,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}T`}
                    domain={[80, 115]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: isLight
                        ? "1px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number) => [`$${v}T`, "World GDP"]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gdp"
                    stroke="#6366f1"
                    fill="url(#dashWorldGdp)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <SourceLink sources={SRC_DASH_ECONOMY} className="mt-1 mb-2" />
              <p
                className="text-[10px] font-mono uppercase tracking-widest mt-1 mb-2"
                style={{ color: mutedText }}
              >
                Top Countries by GDP
              </p>
              <div className="flex flex-col gap-0">
                {topCountries.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => navigate("/dashboard/countries")}
                    className="flex items-center gap-3 py-2 text-left hover:opacity-80 transition-opacity"
                    style={{
                      borderBottom:
                        i < topCountries.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <span className="text-lg w-7 shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {c.name}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {c.region}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="w-16 h-1.5 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (c.gdp / topCountries[0].gdp) * 100)}%`,
                            background: "#6366f1",
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-mono w-14 text-right"
                        style={{ color: headText }}
                      >
                        {fmtB(c.gdp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 w-12 justify-end shrink-0">
                      {c.unemploymentRate < 5 ? (
                        <TrendDown size={10} weight="fill" color="#10b981" />
                      ) : (
                        <TrendUp size={10} weight="fill" color="#f59e0b" />
                      )}
                      <span
                        className="text-[10px] font-mono"
                        style={{
                          color: c.unemploymentRate < 5 ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {c.unemploymentRate.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ECONOMIES container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<ChartBar size={16} weight="fill" />}
                label="Economies"
                badge="Blocs & Markets"
                badgeColor="#f59e0b"
                cta="View Economies"
                ctaTo="/dashboard/economies"
                isLight={isLight}
                onNav={() => navigate("/dashboard/economies")}
              />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  {
                    label: "World GDP",
                    value: "$105.4T",
                    delta: "+1.8%",
                    color: "#6366f1",
                  },
                  {
                    label: "Trade Volume",
                    value: "$32.1T",
                    delta: "+2.3%",
                    color: "#10b981",
                  },
                  {
                    label: "FDI Flows",
                    value: "$1.37T",
                    delta: "-4.1%",
                    color: "#ef4444",
                  },
                  {
                    label: "Debt-to-GDP",
                    value: "93.4%",
                    delta: "+0.6pp",
                    color: "#f59e0b",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-3 py-3"
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.025)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${gridLine}`,
                    }}
                  >
                    <p
                      className="text-[10px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                    </p>
                    <p
                      className="text-lg font-bold font-mono"
                      style={{ color: headText }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[10px] font-mono"
                      style={{ color: m.color }}
                    >
                      {m.delta}
                    </p>
                  </div>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_ECONOMY} className="mb-2" />
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-2"
                style={{ color: mutedText }}
              >
                Regional GDP
              </p>
              <div className="flex flex-col gap-0">
                {REGION_STATS.map((r, i) => (
                  <div
                    key={r.region}
                    className="flex items-center gap-2 py-2"
                    style={{
                      borderBottom:
                        i < REGION_STATS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <p
                      className="text-[11px] font-semibold font-sans flex-1 truncate"
                      style={{ color: headText }}
                    >
                      {r.region}
                    </p>
                    <span
                      className="text-[11px] font-mono shrink-0"
                      style={{ color: headText }}
                    >
                      {r.gdp}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0 w-12 justify-end">
                      {r.up ? (
                        <TrendUp size={10} weight="fill" color="#10b981" />
                      ) : (
                        <TrendDown size={10} weight="fill" color="#ef4444" />
                      )}
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: r.up ? "#10b981" : "#ef4444" }}
                      >
                        {r.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* POLICIES container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<Scales size={16} weight="fill" />}
                label="Policies"
                badge="1,200+ tracked"
                badgeColor="#a855f7"
                cta="Policy Hub"
                ctaTo="/dashboard/policy"
                isLight={isLight}
                onNav={() => navigate("/dashboard/policy")}
              />
              <div className="flex flex-col gap-0">
                {POLICY_FEED.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < POLICY_FEED.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: p.color + "18", color: p.color }}
                    >
                      <Scales size={11} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: p.color + "15", color: p.color }}
                        >
                          {p.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {p.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_POLICIES} className="mt-2 mb-1" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: "Climate", count: "312", color: "#10b981" },
                  { label: "Trade", count: "248", color: "#3b82f6" },
                  { label: "Defense", count: "189", color: "#ef4444" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="rounded-xl px-3 py-2 text-center"
                    style={{
                      background: c.color + "10",
                      border: `1px solid ${c.color}20`,
                    }}
                  >
                    <p
                      className="text-base font-bold font-mono"
                      style={{ color: c.color }}
                    >
                      {c.count}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {c.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COL 3: US States + Cities */}
          <div className="flex flex-col gap-4">
            {/* US STATES container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<MapTrifold size={16} weight="fill" />}
                label="US States"
                badge="50 states"
                badgeColor="#3b82f6"
                cta="All States"
                ctaTo="/dashboard/states"
                isLight={isLight}
                onNav={() => navigate("/dashboard/states")}
              />
              <div className="flex flex-col gap-0">
                {topStates.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => navigate("/dashboard/states")}
                    className="flex items-center gap-3 py-2.5 text-left hover:opacity-80 transition-opacity"
                    style={{
                      borderBottom:
                        i < topStates.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold w-7 shrink-0 text-center rounded-md py-0.5"
                      style={{
                        background: isLight
                          ? "rgba(59,130,246,0.1)"
                          : "rgba(147,197,253,0.1)",
                        color: isLight ? "#3b82f6" : "#93c5fd",
                      }}
                    >
                      {s.abbreviation}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {s.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="w-14 h-1.5 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (s.gdp / topStates[0].gdp) * 100)}%`,
                            background: "#3b82f6",
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-mono w-14 text-right"
                        style={{ color: headText }}
                      >
                        {fmtB(s.gdp)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_STATES} className="mt-2 mb-1" />

              {/* State snapshot grid */}
              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {[
                  { label: "Avg Unemp.", value: "3.9%", color: "#10b981" },
                  { label: "Top GDP", value: "$3.9T", color: "#3b82f6" },
                  { label: "Growth", value: "+2.1%", color: "#6366f1" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-2 py-2 text-center"
                    style={{
                      background: m.color + "10",
                      border: `1px solid ${m.color}20`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: m.color }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CITIES container */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-0 flex-1"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<Buildings size={16} weight="fill" />}
                label="Cities"
                badge="500+ global"
                badgeColor="#10b981"
                cta="All Cities"
                ctaTo="/dashboard/cities"
                isLight={isLight}
                onNav={() => navigate("/dashboard/cities")}
              />

              {/* GDP per Capita bar chart */}
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-2"
                style={{ color: mutedText }}
              >
                GDP per Capita (USD k)
              </p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart
                  data={CITIES_CHART_DATA}
                  margin={{ top: 2, right: 4, left: -18, bottom: 0 }}
                  barSize={14}
                >
                  <defs>
                    <linearGradient
                      id="cityGdpGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#059669"
                        stopOpacity={0.5}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke={gridLine}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 8,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}k`}
                    domain={[0, 160]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: isLight
                        ? "1px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number) => [`$${v}k`, "GDP/capita"]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Bar
                    dataKey="gdp"
                    fill="url(#cityGdpGrad)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              <SourceLink sources={SRC_DASH_CITIES} className="mt-1 mb-1" />

              {/* City list */}
              <div
                className="flex flex-col gap-0 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {CITIES_DATA.map((c, i) => (
                  <button
                    key={c.city}
                    onClick={() => navigate("/dashboard/cities")}
                    className="flex items-center gap-2 py-2 text-left hover:opacity-80 transition-opacity"
                    style={{
                      borderBottom:
                        i < CITIES_DATA.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <span className="text-base w-6 shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans truncate"
                        style={{ color: headText }}
                      >
                        {c.city}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: mutedText }}
                      >
                        {c.country} · {c.pop}
                      </p>
                    </div>
                    {/* Confidence bar */}
                    <div
                      className="w-12 h-1.5 rounded-full overflow-hidden shrink-0"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((c.gdpPerCapita / 141) * 100))}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                    <div className="text-right shrink-0 w-14">
                      <p
                        className="text-[11px] font-mono font-semibold"
                        style={{ color: headText }}
                      >
                        {c.gdpLabel}
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{ color: c.up ? "#10b981" : "#ef4444" }}
                      >
                        {c.growth}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Summary stats */}
              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                {[
                  { label: "Avg GDP/cap", value: "$76k", color: "#10b981" },
                  { label: "Fastest Grow", value: "+4.9%", color: "#f59e0b" },
                  { label: "Cities Tracked", value: "500+", color: "#6366f1" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-2 py-2 text-center"
                    style={{
                      background: m.color + "10",
                      border: `1px solid ${m.color}20`,
                    }}
                  >
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: m.color }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="text-[9px] font-sans"
                      style={{ color: mutedText }}
                    >
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COL 4: Conflicts + Recent Events */}
          <div className="flex flex-col gap-4">
            {/* CONFLICTS container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <SectionHeader
                icon={<Crosshair size={16} weight="fill" />}
                label="Conflicts"
                badge="42 active"
                badgeColor="#ef4444"
                cta="View Conflicts"
                ctaTo="/dashboard/conflicts"
                isLight={isLight}
                onNav={() => navigate("/dashboard/conflicts")}
              />
              <div className="flex flex-col gap-2.5">
                {CONFLICTS_DATA.map((c) => (
                  <div key={c.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold font-sans"
                        style={{ color: headText }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{ background: c.color + "15", color: c.color }}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{
                          background: isLight
                            ? "rgba(0,0,0,0.07)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.intensity}%`,
                            background: c.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-mono w-6 text-right shrink-0"
                        style={{ color: mutedText }}
                      >
                        {c.intensity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <SourceLink sources={SRC_DASH_CONFLICTS} className="mt-2 mb-1" />
              <div
                className="mt-2 pt-3 grid grid-cols-2 gap-2"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <div
                  className="rounded-xl px-3 py-2 text-center"
                  style={{
                    background: "#ef444410",
                    border: "1px solid #ef444420",
                  }}
                >
                  <p
                    className="text-base font-bold font-mono"
                    style={{ color: "#ef4444" }}
                  >
                    42
                  </p>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    Active
                  </p>
                </div>
                <div
                  className="rounded-xl px-3 py-2 text-center"
                  style={{
                    background: "#f5940010",
                    border: "1px solid #f5940020",
                  }}
                >
                  <p
                    className="text-base font-bold font-mono"
                    style={{ color: "#f59e0b" }}
                  >
                    18
                  </p>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    Monitored
                  </p>
                </div>
              </div>
            </div>

            {/* RECENT EVENTS container */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Fire size={16} weight="fill" style={{ color: "#f97316" }} />
                  <h2
                    className="text-base font-bold font-sans"
                    style={{ color: headText }}
                  >
                    Live Feed
                  </h2>
                </div>
                <span
                  className="text-[9px] font-mono px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "#ef444415", color: "#ef4444" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />{" "}
                  Live
                </span>
              </div>
              <div className="flex flex-col gap-0">
                {RECENT_EVENTS.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < RECENT_EVENTS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: e.color + "18", color: e.color }}
                    >
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {e.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: e.color + "15", color: e.color }}
                        >
                          {e.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {e.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTOR OUTLOOK mini container */}
            <div
              className="rounded-2xl p-3 flex flex-col flex-1"
              style={{
                background: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
              }}
            >
              <div className="mb-2">
                <SectionHeader
                  icon={<ChartLineUp size={14} weight="fill" />}
                  label="Sector Outlook"
                  badge="12-month"
                  badgeColor="#a855f7"
                  cta="Full Trends"
                  ctaTo="/dashboard/trends"
                  isLight={isLight}
                  onNav={() => navigate("/dashboard/trends")}
                />
              </div>

              {/* Sector rows */}
              <div className="flex flex-col gap-0">
                {SECTOR_OUTLOOK.map((s, i) => (
                  <div
                    key={s.sector}
                    className="flex items-center gap-2 py-1"
                    style={{
                      borderBottom:
                        i < SECTOR_OUTLOOK.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    {/* Left side: sector name + outlook value stacked */}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[11px] font-semibold font-sans truncate block"
                        style={{ color: headText }}
                      >
                        {s.sector}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {s.up ? (
                          <TrendUp
                            size={9}
                            weight="fill"
                            style={{ color: s.color }}
                          />
                        ) : (
                          <TrendDown
                            size={9}
                            weight="fill"
                            style={{ color: s.color }}
                          />
                        )}
                        <span
                          className="text-[10px] font-mono font-semibold"
                          style={{ color: s.color }}
                        >
                          {s.outlook}
                        </span>
                      </div>
                    </div>
                    {/* Right side: bar + confidence% */}
                    <div
                      className="w-10 h-1 rounded-full overflow-hidden shrink-0"
                      style={{
                        background: isLight
                          ? "rgba(0,0,0,0.07)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.confidence}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono shrink-0 w-7 text-right"
                      style={{ color: mutedText }}
                    >
                      {s.confidence}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Top-3 sparklines */}
              <div
                className="mt-2 pt-2 flex flex-col gap-1"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-0.5"
                  style={{ color: mutedText }}
                >
                  Top Movers — 7-week
                </p>
                {Object.entries(SECTOR_SPARKLINES).map(([name, pts]) => {
                  const sData = SECTOR_OUTLOOK.find((s) => s.sector === name);
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-sans font-semibold truncate w-20 shrink-0"
                        style={{ color: headText }}
                      >
                        {name}
                      </span>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={22}>
                          <AreaChart
                            data={pts}
                            margin={{ top: 1, right: 0, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id={`spark-${name.replace(/\s/g, "")}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={sData?.color ?? "#a855f7"}
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={sData?.color ?? "#a855f7"}
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="v"
                              stroke={sData?.color ?? "#a855f7"}
                              strokeWidth={1.5}
                              fill={`url(#spark-${name.replace(/\s/g, "")})`}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <span
                        className="text-[9px] font-mono font-semibold shrink-0 w-7 text-right"
                        style={{ color: sData?.color ?? "#a855f7" }}
                      >
                        {sData?.outlook}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── NATIONAL SECTION ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <SectionHeader
            icon={<Flag size={16} weight="fill" />}
            label="National"
            badge="US Focus"
            badgeColor="#3b82f6"
            cta="View States"
            ctaTo="/dashboard/states"
            isLight={isLight}
            onNav={() => navigate("/dashboard/states")}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Domestic Highlights
              </p>
              <div className="flex flex-col gap-0">
                {NATIONAL_HIGHLIGHTS.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < NATIONAL_HIGHLIGHTS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: e.color + "18", color: e.color }}
                    >
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {e.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: e.color + "15", color: e.color }}
                        >
                          {e.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {e.sub} · {e.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                State GDP Snapshot
              </p>
              <div className="flex flex-col gap-0">
                {[
                  {
                    state: "CA",
                    label: "California",
                    gdp: "$3.9T",
                    change: "+2.1%",
                    up: true,
                    color: "#6366f1",
                  },
                  {
                    state: "TX",
                    label: "Texas",
                    gdp: "$2.6T",
                    change: "+3.4%",
                    up: true,
                    color: "#3b82f6",
                  },
                  {
                    state: "NY",
                    label: "New York",
                    gdp: "$2.1T",
                    change: "+1.8%",
                    up: true,
                    color: "#10b981",
                  },
                  {
                    state: "FL",
                    label: "Florida",
                    gdp: "$1.6T",
                    change: "+4.2%",
                    up: true,
                    color: "#f59e0b",
                  },
                  {
                    state: "WA",
                    label: "Washington",
                    gdp: "$800B",
                    change: "-0.3%",
                    up: false,
                    color: "#ef4444",
                  },
                  {
                    state: "IL",
                    label: "Illinois",
                    gdp: "$912B",
                    change: "+0.9%",
                    up: true,
                    color: "#a855f7",
                  },
                ].map((s, i) => (
                  <div
                    key={s.state}
                    className="flex items-center gap-2.5 py-2.5"
                    style={{
                      borderBottom: i < 5 ? `1px solid ${gridLine}` : "none",
                    }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold w-7 text-center rounded-md py-0.5 shrink-0"
                      style={{ background: s.color + "18", color: s.color }}
                    >
                      {s.state}
                    </span>
                    <p
                      className="text-xs font-semibold font-sans flex-1 truncate"
                      style={{ color: headText }}
                    >
                      {s.label}
                    </p>
                    <span
                      className="text-[11px] font-mono shrink-0"
                      style={{ color: headText }}
                    >
                      {s.gdp}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {s.up ? (
                        <ArrowUp size={10} weight="bold" color="#10b981" />
                      ) : (
                        <ArrowDown size={10} weight="bold" color="#ef4444" />
                      )}
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: s.up ? "#10b981" : "#ef4444" }}
                      >
                        {s.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERNATIONAL SECTION ─────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <SectionHeader
            icon={<Globe size={16} weight="fill" />}
            label="International"
            badge="Global"
            badgeColor="#6366f1"
            cta="View Countries"
            ctaTo="/dashboard/countries"
            isLight={isLight}
            onNav={() => navigate("/dashboard/countries")}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Global Developments
              </p>
              <div className="flex flex-col gap-0">
                {INTERNATIONAL_EVENTS.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        i < INTERNATIONAL_EVENTS.length - 1
                          ? `1px solid ${gridLine}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: e.color + "18", color: e.color }}
                    >
                      {e.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold font-sans leading-snug"
                        style={{ color: headText }}
                      >
                        {e.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: e.color + "15", color: e.color }}
                        >
                          {e.tag}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: mutedText }}
                        >
                          {e.region} · {e.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: mutedText }}
              >
                Inflation Trend
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart
                  data={INFLATION_DATA}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke={gridLine} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tick={{
                      fontSize: 9,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 9,
                      fill: mutedText,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ReferenceLine y={2} stroke="#10b981" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: isLight
                        ? "1px solid rgba(0,0,0,0.1)"
                        : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: headText,
                    }}
                    formatter={(v: number, name: string) => [
                      `${v}%`,
                      name === "g20" ? "G20" : "Advanced",
                    ]}
                    labelStyle={{ color: mutedText }}
                  />
                  <Line
                    type="monotone"
                    dataKey="g20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 2.5, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="adv"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 2.5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "G20 Avg", color: "#f59e0b" },
                  { label: "Advanced", color: "#3b82f6" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div
                      className="w-3 h-0.5 rounded-full"
                      style={{ background: l.color }}
                    />
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: mutedText }}
                    >
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-3 pt-3"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <p
                  className="text-[10px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: mutedText }}
                >
                  Regional GDP
                </p>
                {REGION_STATS.slice(0, 4).map((r, i) => (
                  <div
                    key={r.region}
                    className="flex items-center justify-between py-1.5"
                    style={{
                      borderBottom: i < 3 ? `1px solid ${gridLine}` : "none",
                    }}
                  >
                    <p
                      className="text-[11px] font-sans truncate flex-1"
                      style={{ color: headText }}
                    >
                      {r.region}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.up ? (
                        <TrendUp size={9} weight="fill" color="#10b981" />
                      ) : (
                        <TrendDown size={9} weight="fill" color="#ef4444" />
                      )}
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: r.up ? "#10b981" : "#ef4444" }}
                      >
                        {r.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ANALYST SECTION ───────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} weight="fill" style={{ color: "#8b5cf6" }} />
              <h2
                className="text-base font-bold font-sans"
                style={{ color: headText }}
              >
                Analyst Network
              </h2>
              <span
                className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "#10b98115", color: "#10b981" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />{" "}
                3 online
              </span>
            </div>
            <button
              onClick={() => navigate("/dashboard/analysts")}
              className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: isLight ? "#8b5cf6" : "#c4b5fd" }}
            >
              Open Network <ArrowRight size={11} weight="bold" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANALYST_PREVIEW.map((a) => (
              <div
                key={a.initials}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: isLight
                    ? "rgba(0,0,0,0.02)"
                    : "rgba(255,255,255,0.035)",
                  border: `1px solid ${gridLine}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ background: a.color }}
                    >
                      {a.initials}
                    </div>
                    {a.online && (
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                        style={{
                          background: "#10b981",
                          borderColor: isLight ? "#ffffff" : "#0b0b14",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold font-sans truncate"
                      style={{ color: headText }}
                    >
                      {a.name}
                    </p>
                    <p
                      className="text-[10px] font-sans truncate"
                      style={{ color: mutedText }}
                    >
                      {a.role}
                    </p>
                  </div>
                  <span
                    className="text-[9px] font-mono shrink-0"
                    style={{ color: mutedText }}
                  >
                    {a.time}
                  </span>
                </div>
                <p
                  className="text-[11px] font-sans leading-relaxed flex-1"
                  style={{ color: mutedText }}
                  dangerouslySetInnerHTML={{ __html: a.insight }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: a.color + "15", color: a.color }}
                    >
                      #{t}
                    </span>
                  ))}
                  <div className="flex items-center gap-3 ml-auto">
                    <span
                      className="flex items-center gap-1 text-[10px] font-mono"
                      style={{ color: mutedText }}
                    >
                      <Lightning size={11} />
                      {a.likes}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10px] font-mono"
                      style={{ color: mutedText }}
                    >
                      <ChatTeardropDots size={11} />
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10px] font-mono"
                      style={{ color: mutedText }}
                    >
                      <ShareNetwork size={11} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/dashboard/analysts")}
            className="mt-4 w-full rounded-2xl py-4 flex items-center justify-center gap-3 transition-all hover:scale-[1.005] active:scale-[0.998]"
            style={{
              background: isLight
                ? "linear-gradient(130deg, #f5f3ff, #ede9fe)"
                : "linear-gradient(130deg, #1e1b4b, #2e1065)",
              border: isLight
                ? "1px solid rgba(139,92,246,0.2)"
                : "1px solid rgba(139,92,246,0.25)",
            }}
          >
            <Sparkle size={16} weight="fill" style={{ color: "#8b5cf6" }} />
            <span
              className="text-sm font-bold font-sans"
              style={{ color: headText }}
            >
              Join the Analyst Network
            </span>
            <span
              className="text-[11px] font-sans"
              style={{ color: mutedText }}
            >
              · 127+ analysts · Real-time discussions
            </span>
            <ArrowRight
              size={14}
              weight="bold"
              style={{ color: isLight ? "#8b5cf6" : "#c4b5fd" }}
            />
          </button>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 flex flex-col items-center gap-1">
          <p className="text-[11px] font-sans" style={{ color: mutedText }}>
            © {new Date().getFullYear()} CommonSphere · Dashboard · Data
            updated Q2 2025
          </p>
          <SourceLink
            sources={[
              { label: "World Bank", url: "https://data.worldbank.org/" },
              { label: "IMF", url: "https://www.imf.org/en/Data" },
              { label: "BLS", url: "https://www.bls.gov/data/" },
              { label: "BEA", url: "https://www.bea.gov/" },
              { label: "ACLED", url: "https://acleddata.com/" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
