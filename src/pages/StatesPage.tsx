import React, { useState, useEffect } from "react";
import {
  Buildings,
  Users,
  CurrencyDollar,
  TrendDown,
  MagnifyingGlass,
  MapPin,
  Flag,
  Timer,
  Factory,
  ChartBar,
  UserCircle,
  Gavel,
  UsersThree,
  MapTrifold,
  Images,
  ListBullets,
} from "@phosphor-icons/react";
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
  Legend,
} from "recharts";
import { usStatesData, type USState } from "../data/statesData";

const partyColor = {
  Democrat: "text-secondary border-secondary bg-secondary/10",
  Republican: "text-red-400 border-red-500/40 bg-red-500/10",
  Independent: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
};

// ─── Color palettes ──────────────────────────────────────────────────────────
const ETHNICITY_COLORS = [
  "#60a5fa",
  "#f87171",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
];
const LAND_COLORS = ["#f97316", "#84cc16", "#22d3ee", "#3b82f6", "#94a3b8"];
const AGE_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171"];
const VOTER_COLORS = ["#3b82f6", "#ef4444", "#a3a3a3"];
const WEALTH_COLORS = ["#22d3ee", "#60a5fa", "#fbbf24", "#f87171"];
const ENERGY_COLORS = [
  "#78716c",
  "#6b7280",
  "#60a5fa",
  "#22d3ee",
  "#fbbf24",
  "#34d399",
  "#a78bfa",
];

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="modal-tile rounded-lg p-4 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground font-sans">{label}</p>
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground font-sans">{sub}</p>}
    </div>
  );
}

function TaxCard({
  incomeTax,
  salesTax,
  minimumWage,
  averageIncome,
}: {
  incomeTax: number | null | undefined;
  salesTax: number | null | undefined;
  minimumWage: number | null | undefined;
  averageIncome: number | null | undefined;
}) {
  const fmtPct = (v: number | null | undefined) =>
    v == null ? "N/A" : v === 0 ? "None" : `${v}%`;
  const fmtWage = (v: number | null | undefined) =>
    v == null ? "N/A" : v <= 7.25 ? `$7.25` : `$${v.toFixed(2)}`;
  const fmtIncome = (v: number | null | undefined) =>
    v == null ? "N/A" : `$${(v / 1000).toFixed(1)}K`;
  return (
    <div className="modal-tile rounded-lg p-4 flex flex-col gap-2 col-span-2 sm:col-span-4">
      <p className="text-xs text-muted-foreground font-sans">Tax &amp; Wages</p>
      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Income Tax
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtPct(incomeTax)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            top marginal rate
          </p>
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Sales Tax
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtPct(salesTax)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            state + local avg
          </p>
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Min Wage
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtWage(minimumWage)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            per hour
          </p>
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Avg Income
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtIncome(averageIncome)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            per capita
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared tooltip ──────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, suffix = "%" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((e: any) => (
        <p key={e.name ?? e.dataKey} style={{ color: e.fill ?? e.color }}>
          {e.name ?? e.dataKey}: {e.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

// ─── Mini horizontal bar ─────────────────────────────────────────────────────
function HorizBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 text-muted-foreground font-sans truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-foreground shrink-0">
        {pct}%
      </span>
    </div>
  );
}

// ─── 6 Chart panels ──────────────────────────────────────────────────────────
function DemographicsCharts({ state }: { state: USState }) {
  const id = state.id;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Ethnicity */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Ethnicity / Demographics
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {state.ethnicity.map((_, i) => (
                  <linearGradient
                    key={i}
                    id={`ethGrad-${id}-${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={ETHNICITY_COLORS[i % ETHNICITY_COLORS.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={ETHNICITY_COLORS[i % ETHNICITY_COLORS.length]}
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={state.ethnicity.filter((d) => d.pct > 0)}
                dataKey="pct"
                nameKey="group"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={60}
                paddingAngle={2}
                isAnimationActive
                animationDuration={600}
              >
                {state.ethnicity
                  .filter((d) => d.pct > 0)
                  .map((_, i) => (
                    <Cell key={i} fill={`url(#ethGrad-${id}-${i})`} />
                  ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }}
                formatter={(v) => (
                  <span style={{ color: "hsl(0,0%,65%)" }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Land Use */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Land Use / Distribution
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {state.landUse.map((_, i) => (
                  <linearGradient
                    key={i}
                    id={`landGrad-${id}-${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={LAND_COLORS[i % LAND_COLORS.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={LAND_COLORS[i % LAND_COLORS.length]}
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={state.landUse}
                dataKey="pct"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={60}
                paddingAngle={2}
                isAnimationActive
                animationDuration={600}
              >
                {state.landUse.map((_, i) => (
                  <Cell key={i} fill={`url(#landGrad-${id}-${i})`} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }}
                formatter={(v) => (
                  <span style={{ color: "hsl(0,0%,65%)" }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Age Distribution */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-2">
          Age Distribution{" "}
          <span className="text-muted-foreground normal-case font-normal">
            (median {state.medianAge} yrs)
          </span>
        </h4>
        <div className="flex flex-col gap-1.5 mt-2">
          {state.ageGroups.map((g, i) => (
            <HorizBar
              key={g.group}
              label={g.group}
              pct={g.pct}
              color={AGE_COLORS[i % AGE_COLORS.length]}
            />
          ))}
        </div>
      </div>

      {/* 4. Voter Registration */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Voter Registration
        </h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={state.voterShare}
              layout="vertical"
              margin={{ top: 2, right: 16, left: 0, bottom: 2 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222,30%,22%)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{
                  fill: "hsl(0,0%,55%)",
                  fontSize: 9,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="party"
                tick={{
                  fill: "hsl(0,0%,65%)",
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
              <Tooltip content={<ChartTip label="" />} />
              <Bar
                dataKey="pct"
                radius={[0, 4, 4, 0]}
                isAnimationActive
                animationDuration={600}
              >
                {state.voterShare.map((_, i) => (
                  <Cell key={i} fill={VOTER_COLORS[i % VOTER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Wealth & Poverty */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Wealth &amp; Poverty
        </h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={state.wealthPoverty}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222,30%,22%)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{
                  fill: "hsl(0,0%,60%)",
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
                width={28}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTip />} />
              <Bar
                dataKey="pct"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={600}
              >
                {state.wealthPoverty.map((_, i) => (
                  <Cell
                    key={i}
                    fill={WEALTH_COLORS[i % WEALTH_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Energy Production */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-2">
          Energy Production Mix
        </h4>
        <div className="flex flex-col gap-1.5 mt-2">
          {state.energyMix
            .filter((e) => e.pct > 0)
            .map((e, i) => (
              <HorizBar
                key={e.source}
                label={e.source}
                pct={e.pct}
                color={ENERGY_COLORS[i % ENERGY_COLORS.length]}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Per-state image galleries ────────────────────────────────────────────────
const STATE_IMAGES: Record<string, { src: string; caption: string }[]> = {
  al: [
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Birmingham skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Gulf Shores beach",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Alabama woodland",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Appalachian foothills",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Mobile Bay",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Historic architecture",
    },
  ],
  ak: [
    {
      src: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
      caption: "Denali National Park",
    },
    {
      src: "https://images.unsplash.com/photo-1541459131820-b49b5f15bdb7?w=800&q=80",
      caption: "Northern Lights",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Alaskan wilderness",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Glacier Bay",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Alaska coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Tundra at sunset",
    },
  ],
  az: [
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Grand Canyon",
    },
    {
      src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
      caption: "Sedona red rocks",
    },
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "Saguaro desert",
    },
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Monument Valley",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Phoenix skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Antelope Canyon",
    },
  ],
  ar: [
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Ozark Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Buffalo River",
    },
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Hot Springs",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Arkansas Delta",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Autumn foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Little Rock",
    },
  ],
  ca: [
    {
      src: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800&q=80",
      caption: "Golden Gate Bridge",
    },
    {
      src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
      caption: "Redwood forest",
    },
    {
      src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      caption: "Yosemite Valley",
    },
    {
      src: "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=800&q=80",
      caption: "Los Angeles skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Big Sur coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Sierra Nevada peaks",
    },
  ],
  co: [
    {
      src: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
      caption: "Rocky Mountain peaks",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Denver skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Alpine meadows",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Mount Elbert summit",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Mesa Verde",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Garden of the Gods",
    },
  ],
  ct: [
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "New Haven harbor",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "New England village",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Connecticut shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Hartford skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Mystic seaport",
    },
  ],
  de: [
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Delaware beaches",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Wilmington waterfront",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "Colonial Wilmington",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall along the river",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Dover cityscape",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Delaware Bay",
    },
  ],
  fl: [
    {
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      caption: "Miami Beach",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Gulf Coast sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Everglades wetlands",
    },
    {
      src: "https://images.unsplash.com/photo-1590093444774-7cc7fb5e1225?w=800&q=80",
      caption: "Florida Keys",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Orlando skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1549893072-4bc678117f45?w=800&q=80",
      caption: "St. Augustine",
    },
  ],
  ga: [
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Atlanta skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Georgia forest",
    },
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Savannah squares",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Blue Ridge foothills",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Antebellum architecture",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Georgia coastline",
    },
  ],
  hi: [
    {
      src: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=800&q=80",
      caption: "Waimea Canyon",
    },
    {
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      caption: "Waikiki Beach",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Na Pali coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Hawaiian sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80",
      caption: "Mauna Kea volcano",
    },
    {
      src: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80",
      caption: "Tropical rainforest",
    },
  ],
  id: [
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Sawtooth Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Snake River Canyon",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Idaho prairie",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Craters of the Moon",
    },
    {
      src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
      caption: "Boise foothills",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Hells Canyon",
    },
  ],
  il: [
    {
      src: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80",
      caption: "Chicago skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Chicago waterfront",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Illinois farmland",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Prairie grain fields",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Corn harvest",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Mississippi River",
    },
  ],
  in: [
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Indiana cornfields",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Indiana plains",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Indianapolis skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Hoosier woodland",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Lake Michigan dunes",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Harvest season",
    },
  ],
  ia: [
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Iowa corn fields",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Iowa prairie",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Harvest time",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Mississippi River bluffs",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Autumn farmland",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Iowa River",
    },
  ],
  ks: [
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Kansas horizon",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Wheat fields",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Tallgrass prairie",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Harvest season",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Flint Hills",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Arkansas River",
    },
  ],
  ky: [
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Kentucky Bluegrass",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Daniel Boone Forest",
    },
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Mammoth Cave",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Ohio River",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Horse country",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Rolling hills",
    },
  ],
  la: [
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Louisiana bayou",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Gulf Coast sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "New Orleans skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "French Quarter",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Cypress swamp",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Mississippi River Delta",
    },
  ],
  me: [
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Maine rocky coast",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "Acadia National Park",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Portland harbor",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Maine coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Fishing village",
    },
  ],
  md: [
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Chesapeake Bay",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Eastern Shore",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Baltimore inner harbor",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Autumn in Annapolis",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Historic district",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Blue Ridge foothills",
    },
  ],
  ma: [
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Boston skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Boston harbor",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Cape Cod autumn",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "New England village",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Cape Cod shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Nantucket harbor",
    },
  ],
  mi: [
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Great Lakes shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Detroit skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Upper Peninsula forest",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Michigan farmland",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall color drive",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Mackinac Island",
    },
  ],
  mn: [
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Land of 10,000 Lakes",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Boundary Waters",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Minneapolis skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Minnesota prairie",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Autumn foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Wheat fields",
    },
  ],
  ms: [
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Mississippi bayou",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Gulf Coast",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Delta woodlands",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Antebellum homes",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Natchez Trace",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Mississippi sunset",
    },
  ],
  mo: [
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "St. Louis Gateway Arch",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Ozark forest",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Missouri plains",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Missouri River",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Rolling hills",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Missouri farmland",
    },
  ],
  mt: [
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Glacier National Park",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Beartooth Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Big Sky country",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Montana river",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Eastern Montana plains",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Autumn wilderness",
    },
  ],
  ne: [
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Nebraska Sandhills",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Wheat harvest",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Great Plains horizon",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Cornhusker fields",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Platte River",
    },
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Pine Ridge",
    },
  ],
  nv: [
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "Nevada desert",
    },
    {
      src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
      caption: "Red Rock Canyon",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Las Vegas skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Valley of Fire",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Black Rock Desert",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Lake Tahoe",
    },
  ],
  nh: [
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "White Mountains foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "White Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "New Hampshire seacoast",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Portsmouth harbor",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Lake Winnipesaukee",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Granite Peak",
    },
  ],
  nj: [
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Jersey Shore",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Hudson River waterfront",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Newark skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Pine Barrens autumn",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "Delaware River",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Atlantic City boardwalk",
    },
  ],
  nm: [
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "White Sands",
    },
    {
      src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
      caption: "Santa Fe adobe",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "New Mexico desert",
    },
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Carlsbad Caverns",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Albuquerque hot air balloons",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Sandia Mountains",
    },
  ],
  ny: [
    {
      src: "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&q=80",
      caption: "New York skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Manhattan at night",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Hudson River",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Adirondack foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Long Island Sound",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Niagara Falls",
    },
  ],
  nc: [
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Blue Ridge Parkway",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Outer Banks",
    },
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Charlotte skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Smoky Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall in the Piedmont",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Historic Wilmington",
    },
  ],
  nd: [
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "North Dakota badlands",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Wheat harvest",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Great Plains",
    },
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Theodore Roosevelt NP",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Missouri River",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Sunflower fields",
    },
  ],
  oh: [
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Columbus skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Lake Erie shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Ohio farmland",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Hocking Hills",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Ohio autumn",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Corn Belt harvest",
    },
  ],
  ok: [
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Oklahoma plains",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Tallgrass prairie",
    },
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Wichita Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Wheat fields",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Oklahoma Ozarks",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Arkansas River",
    },
  ],
  or: [
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Oregon coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
      caption: "Oregon forest",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Crater Lake",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Mount Hood",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Portland skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Columbia River Gorge",
    },
  ],
  pa: [
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Philadelphia skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Pennsylvania hills",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Pocono forests",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Amish country",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Delaware River",
    },
  ],
  ri: [
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Rhode Island coast",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Newport harbor",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Narragansett Bay",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Gilded Age mansions",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Autumn in Providence",
    },
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "Providence skyline",
    },
  ],
  sc: [
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Myrtle Beach",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Charleston historic district",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Congaree forest",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Blue Ridge foothills",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Low Country sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Autumn along the river",
    },
  ],
  sd: [
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Badlands",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Black Hills",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Mount Rushmore",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Great Plains",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Wheat harvest",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Wind Cave National Park",
    },
  ],
  tn: [
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Nashville skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Great Smoky Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Tennessee forest",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Memphis historic district",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Tennessee River",
    },
  ],
  tx: [
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Houston skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Austin skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "Big Bend desert",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Texas Hill Country",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Texas plains",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Gulf of Mexico",
    },
  ],
  ut: [
    {
      src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Zion National Park",
    },
    {
      src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
      caption: "Bryce Canyon",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Arches National Park",
    },
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "Monument Valley",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Wasatch Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Salt Lake City",
    },
  ],
  vt: [
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Vermont fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "New England village",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Green Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Lake Champlain",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Vermont countryside",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Maple sugar farm",
    },
  ],
  va: [
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Shenandoah Valley",
    },
    {
      src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
      caption: "Richmond skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Chesapeake Bay",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Colonial Williamsburg",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Blue Ridge in fall",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Virginia Beach",
    },
  ],
  wa: [
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Seattle skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Mount Rainier",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Olympic Peninsula coast",
    },
    {
      src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
      caption: "Hoh Rain Forest",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Eastern Washington wheat",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Cascade volcanoes",
    },
  ],
  wv: [
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Appalachian Mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "New River Gorge",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Autumn in the hills",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Seneca Rocks",
    },
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Blackwater Falls",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Gauley River",
    },
  ],
  wi: [
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Lake Michigan shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Wisconsin dairy farms",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Northwoods forest",
    },
    {
      src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
      caption: "Milwaukee skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Door County autumn",
    },
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Corn fields",
    },
  ],
  wy: [
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Grand Teton",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Yellowstone geysers",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Wyoming plains",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Wind River Range",
    },
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Snake River",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Autumn wilderness",
    },
  ],
};

// Fallback images by region if state not in map
const REGION_FALLBACK: Record<string, { src: string; caption: string }[]> = {
  West: [
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Pacific coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Rocky mountain peaks",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Alpine wilderness",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Desert landscape",
    },
    {
      src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
      caption: "Redwood forest",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Golden meadow",
    },
  ],
  South: [
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Bayou waterway",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Southern coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Gulf sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Historic architecture",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Appalachian foothills",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Autumn woodland",
    },
  ],
  Northeast: [
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "City skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Urban waterfront",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Atlantic shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "New England village",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Harbor at dusk",
    },
  ],
  Midwest: [
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Golden wheat fields",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Prairie horizon",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Great Lakes shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      caption: "Farmland at sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Corn harvest",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "River valley",
    },
  ],
};

// ─── State location map using an SVG iframe from simplemaps ──────────────────
function StateMapTab({ state }: { state: USState }) {
  // Use a free embedded map from simplemaps (no key needed for basic embed)
  // We construct a Google Maps embed focused on the state
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(state.name + ", USA")}&z=6&output=embed&t=m`;

  const regionColors: Record<string, string> = {
    West: "from-blue-500/20 to-cyan-500/10",
    South: "from-green-500/20 to-emerald-500/10",
    Northeast: "from-purple-500/20 to-violet-500/10",
    Midwest: "from-amber-500/20 to-yellow-500/10",
  };

  return (
    <div className="space-y-4">
      {/* Info strip */}
      <div
        className={`rounded-xl p-4 bg-gradient-to-r ${regionColors[state.region] ?? "from-secondary/20 to-secondary/10"} border border-border/50`}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm font-sans">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-secondary" weight="fill" />
            <span className="text-muted-foreground">Capital:</span>
            <span className="font-semibold text-foreground">
              {state.capital}
            </span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Region:</span>
            <span className="font-semibold text-foreground">
              {state.region}
            </span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Area:</span>
            <span className="font-semibold text-foreground font-mono">
              {(state.areaKm2 / 1000).toFixed(0)}K km²
            </span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Statehood:</span>
            <span className="font-semibold text-foreground font-mono">
              {state.statehood}
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Google Map */}
      <div
        className="relative rounded-xl overflow-hidden border border-border shadow-lg"
        style={{ height: 420 }}
      >
        <iframe
          title={`${state.name} map`}
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {/* Neighboring info */}
      <div className="modal-tile rounded-xl p-4">
        <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Location Facts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
              Abbreviation
            </p>
            <p className="text-lg font-bold font-mono text-foreground">
              {state.abbreviation}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
              Population Density
            </p>
            <p className="text-lg font-bold font-mono text-foreground">
              {(state.population / state.areaKm2).toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">
                /km²
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
              US Region
            </p>
            <span
              className={`inline-block text-xs font-sans px-2 py-0.5 rounded-full border ${
                state.region === "West"
                  ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                  : state.region === "South"
                    ? "text-green-400 border-green-500/40 bg-green-500/10"
                    : state.region === "Northeast"
                      ? "text-purple-400 border-purple-500/40 bg-purple-500/10"
                      : "text-amber-400 border-amber-500/40 bg-amber-500/10"
              }`}
            >
              {state.region}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Photos tab ───────────────────────────────────────────────────────────────
function StatePhotosTab({ state }: { state: USState }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [flagError, setFlagError] = useState(false);
  const images =
    STATE_IMAGES[state.id] ??
    REGION_FALLBACK[state.region] ??
    REGION_FALLBACK["West"];
  const flagUrl = `https://flagcdn.com/w320/us-${state.id}.png`;

  return (
    <div className="space-y-4">
      {/* State flag + header row */}
      <div className="flex items-center gap-4 p-4 modal-tile rounded-xl border border-border/60">
        {/* Flag */}
        <div
          className="w-28 h-18 rounded-lg overflow-hidden border border-border shadow-md shrink-0 bg-muted flex items-center justify-center"
          style={{ minHeight: 72 }}
        >
          {!flagError ? (
            <img
              src={flagUrl}
              alt={`Flag of ${state.name}`}
              className="w-full h-full object-cover"
              onError={() => setFlagError(true)}
            />
          ) : (
            <span className="text-xl font-bold font-mono text-muted-foreground">
              {state.abbreviation}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-bold font-sans text-foreground">
            Flag of {state.name}
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            {state.abbreviation} · {state.region} Region · Since{" "}
            {state.statehood}
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-1">
            Photos:{" "}
            <span className="text-foreground font-semibold">{state.name}</span>{" "}
            landscapes &amp; landmarks
          </p>
        </div>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
          {images.length} photos
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="group relative rounded-xl overflow-hidden border border-border/60 hover:border-secondary/60 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={img.src}
              alt={img.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <p className="absolute bottom-2 left-2 right-2 text-[10px] font-sans text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
              {img.caption}
            </p>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightbox].src.replace("w=800", "w=1200")}
              alt={images[lightbox].caption}
              className="w-full rounded-xl shadow-2xl"
            />
            <p className="text-center text-sm text-white/80 font-sans mt-3">
              {images[lightbox].caption}
            </p>
            {/* Prev / Next */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={() =>
                  setLightbox((lightbox - 1 + images.length) % images.length)
                }
                className="ml-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={() => setLightbox((lightbox + 1) % images.length)}
                className="mr-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
type ModalTab = "overview" | "map" | "photos";

function StateModal({
  state,
  onClose,
}: {
  state: USState;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");

  React.useEffect(() => {
    setActiveTab("overview");
  }, [state.id]);

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

  const tabs: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <ListBullets size={13} weight="bold" />,
    },
    { id: "map", label: "Map", icon: <MapTrifold size={13} weight="fill" /> },
    { id: "photos", label: "Photos", icon: <Images size={13} weight="fill" /> },
  ];

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
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 border border-border shadow-md relative bg-muted">
                <img
                  src={`https://flagcdn.com/w160/us-${state.id}.png`}
                  alt={`${state.name} flag`}
                  className="w-full h-full object-cover"
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
                    {state.abbreviation}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold font-sans text-foreground">
                  {state.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                    <MapPin size={12} /> {state.capital}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground font-sans">
                    {state.region} Region
                  </span>
                  <span
                    className={`text-xs border px-2 py-0.5 rounded-full font-sans ${partyColor[state.party]}`}
                  >
                    {state.party}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-sans cursor-pointer shrink-0"
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
            {tabs.map((tab) => (
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

          {/* Tab: Map */}
          {activeTab === "map" && <StateMapTab state={state} />}

          {/* Tab: Photos */}
          {activeTab === "photos" && <StatePhotosTab state={state} />}

          {/* Tab: Overview */}
          {
            activeTab === "overview" && (
              <>
                {/* Key Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard
                    label="Population"
                    value={`${(state.population / 1e6).toFixed(1)}M`}
                    sub="residents"
                  />
                  <StatCard
                    label="GDP"
                    value={`$${state.gdp}B`}
                    sub="billions USD"
                  />
                  <StatCard
                    label="Median Income"
                    value={`$${state.medianIncome.toLocaleString()}`}
                    sub="per household"
                  />
                  <StatCard
                    label="Unemployment"
                    value={`${state.unemploymentRate}%`}
                    sub="current rate"
                  />
                  <StatCard
                    label="Approval Rating"
                    value={`${state.approvalRating}%`}
                    sub="governor"
                  />
                  <StatCard
                    label="Area"
                    value={`${(state.areaKm2 / 1000).toFixed(0)}K km²`}
                    sub="total land"
                  />
                  <StatCard
                    label="Education Rank"
                    value={`#${state.educationRank}`}
                    sub="out of 50 states"
                  />
                  <StatCard
                    label="Healthcare Rank"
                    value={`#${state.healthcareRank}`}
                    sub="out of 50 states"
                  />
                  <div className="modal-tile rounded-lg p-4 flex flex-col gap-1 col-span-2 sm:col-span-4">
                    <p className="text-xs text-muted-foreground font-sans">
                      Quality of Living Score
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-2xl font-bold font-mono ${state.qualityOfLiving >= 75 ? "text-success" : state.qualityOfLiving >= 55 ? "text-warning" : "text-destructive"}`}
                      >
                        {state.qualityOfLiving}
                        <span className="text-sm font-normal text-muted-foreground">
                          /100
                        </span>
                      </span>
                      <div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${state.qualityOfLiving >= 75 ? "bg-success" : state.qualityOfLiving >= 55 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${state.qualityOfLiving}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-sans px-2 py-0.5 rounded-full border ${state.qualityOfLiving >= 75 ? "text-success bg-success/10 border-success/30" : state.qualityOfLiving >= 55 ? "text-warning bg-warning/10 border-warning/30" : "text-destructive bg-destructive/10 border-destructive/30"}`}
                      >
                        {state.qualityOfLiving >= 75
                          ? "High"
                          : state.qualityOfLiving >= 55
                            ? "Moderate"
                            : "Low"}
                      </span>
                    </div>
                  </div>
                  <TaxCard
                    incomeTax={state.stateTaxRate}
                    salesTax={state.salesTaxRate}
                    minimumWage={state.minimumWage}
                    averageIncome={state.averageIncome}
                  />
                </div>

                {/* 6 Charts */}
                <DemographicsCharts state={state} />

                {/* Sociological Breakdown */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <UsersThree
                      size={14}
                      weight="fill"
                      className="text-secondary"
                    />
                    <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                      Sociological Breakdown
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Ethnic Composition */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Ethnic Composition
                      </p>
                      <div className="space-y-1.5">
                        {state.ethnicity
                          .filter((e) => e.pct > 0)
                          .map((e, i) => (
                            <div
                              key={e.group}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    ETHNICITY_COLORS[
                                      i % ETHNICITY_COLORS.length
                                    ],
                                }}
                              />
                              <span className="text-[11px] font-sans text-muted-foreground flex-1 truncate">
                                {e.group}
                              </span>
                              <span
                                className="text-[11px] font-mono font-semibold"
                                style={{
                                  color:
                                    ETHNICITY_COLORS[
                                      i % ETHNICITY_COLORS.length
                                    ],
                                }}
                              >
                                {e.pct}%
                              </span>
                            </div>
                          ))}
                      </div>
                      {/* stacked diversity bar */}
                      <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-px">
                        {state.ethnicity
                          .filter((e) => e.pct > 0)
                          .map((e, i) => (
                            <div
                              key={e.group}
                              style={{
                                width: `${e.pct}%`,
                                backgroundColor:
                                  ETHNICITY_COLORS[i % ETHNICITY_COLORS.length],
                              }}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Age Structure */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Age Structure
                        <span className="ml-1 normal-case font-normal text-muted-foreground">
                          · median {state.medianAge} yrs
                        </span>
                      </p>
                      <div className="space-y-1.5">
                        {state.ageGroups.map((g, i) => (
                          <div
                            key={g.group}
                            className="flex items-center gap-2"
                          >
                            <span className="text-[11px] font-sans text-muted-foreground w-16 shrink-0">
                              {g.group}
                            </span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${g.pct * 3}%`,
                                  backgroundColor:
                                    AGE_COLORS[i % AGE_COLORS.length],
                                }}
                              />
                            </div>
                            <span
                              className="text-[11px] font-mono w-7 text-right shrink-0"
                              style={{
                                color: AGE_COLORS[i % AGE_COLORS.length],
                              }}
                            >
                              {g.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Political Alignment */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Political Alignment
                      </p>
                      <div className="flex gap-1 h-5 rounded-full overflow-hidden mb-2">
                        {state.voterShare.map((v, i) => (
                          <div
                            key={v.party}
                            style={{
                              width: `${v.pct}%`,
                              backgroundColor:
                                VOTER_COLORS[i % VOTER_COLORS.length],
                            }}
                          />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {state.voterShare.map((v, i) => (
                          <div
                            key={v.party}
                            className="flex items-center justify-between text-[11px]"
                          >
                            <span className="flex items-center gap-1.5 font-sans text-muted-foreground">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    VOTER_COLORS[i % VOTER_COLORS.length],
                                }}
                              />
                              {v.party}
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              {v.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border font-sans ${
                            state.party === "Democrat"
                              ? "text-secondary border-secondary/40 bg-secondary/10"
                              : state.party === "Republican"
                                ? "text-red-400 border-red-500/40 bg-red-500/10"
                                : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
                          }`}
                        >
                          {state.party} Leaning
                        </span>
                      </div>
                    </div>

                    {/* Wealth Distribution */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Wealth Distribution
                      </p>
                      <div className="space-y-1.5">
                        {state.wealthPoverty.map((w, i) => (
                          <div
                            key={w.label}
                            className="flex items-center gap-2"
                          >
                            <span className="text-[11px] font-sans text-muted-foreground w-24 shrink-0">
                              {w.label}
                            </span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${w.pct * 2}%`,
                                  backgroundColor:
                                    WEALTH_COLORS[i % WEALTH_COLORS.length],
                                }}
                              />
                            </div>
                            <span
                              className="text-[11px] font-mono w-7 text-right shrink-0"
                              style={{
                                color: WEALTH_COLORS[i % WEALTH_COLORS.length],
                              }}
                            >
                              {w.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-sans">
                          Median Household Income
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground">
                          ${state.medianIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Social Scores Row */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="modal-tile rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Education Rank
                      </p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        #{state.educationRank}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        out of 50
                      </p>
                    </div>
                    <div className="modal-tile rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Healthcare Rank
                      </p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        #{state.healthcareRank}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        out of 50
                      </p>
                    </div>
                    <div className="modal-tile rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Crime Index
                      </p>
                      <p
                        className={`text-lg font-bold font-mono ${state.crimeIndex >= 55 ? "text-destructive" : state.crimeIndex >= 40 ? "text-warning" : "text-success"}`}
                      >
                        {state.crimeIndex}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        per 100k
                      </p>
                    </div>
                  </div>
                </div>

                {/* Governor / Statehood */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">
                      Governor
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {state.governor}
                    </p>
                    <p
                      className={`text-xs mt-1 font-sans ${state.party === "Democrat" ? "text-secondary" : "text-red-400"}`}
                    >
                      {state.party}
                    </p>
                  </div>
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">
                      Statehood
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      Since {state.statehood}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {new Date().getFullYear() - state.statehood} years as a
                      state
                    </p>
                  </div>
                </div>

                {/* Senators */}
                {state.senators && state.senators.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle
                        size={14}
                        weight="fill"
                        className="text-secondary"
                      />
                      <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                        US Senators
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.senators.map((sen, i) => (
                        <div
                          key={i}
                          className="modal-tile rounded-lg p-3 flex items-start justify-between gap-2"
                        >
                          <div>
                            <p className="text-sm font-semibold font-sans text-foreground">
                              {sen.name}
                            </p>
                            <p
                              className={`text-xs font-sans mt-0.5 ${sen.party === "Democrat" ? "text-secondary" : sen.party === "Republican" ? "text-red-400" : "text-yellow-400"}`}
                            >
                              {sen.party}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-card border border-border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                            Term ends {sen.termEnd}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* House Representatives */}
                {state.representatives && state.representatives.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel size={14} weight="fill" className="text-warning" />
                      <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                        House Representatives
                        <span className="ml-2 text-muted-foreground normal-case font-normal">
                          ({state.houseSeats} seat
                          {state.houseSeats !== 1 ? "s" : ""})
                        </span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {state.representatives.map((rep, i) => (
                        <div
                          key={i}
                          className="modal-tile rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold font-sans text-foreground truncate">
                              {rep.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans">
                              {rep.district}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded border ${rep.party === "Democrat" ? "border-secondary/40 text-secondary bg-secondary/10" : rep.party === "Republican" ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"}`}
                          >
                            {rep.party === "Democrat"
                              ? "D"
                              : rep.party === "Republican"
                                ? "R"
                                : "I"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) /* end overview tab */
          }
        </div>
      </div>
    </div>
  );
}

// ─── Election Countdown ──────────────────────────────────────────────────────
function useElectionCountdown() {
  const target = new Date("2028-11-07T00:00:00");
  const [diff, setDiff] = useState(target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSecs = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return { days, hours, mins, secs };
}

// ─── National Stats Banner ────────────────────────────────────────────────────
function USNationalBanner() {
  const { days, hours, mins, secs } = useElectionCountdown();

  const totalGDP = usStatesData.reduce((sum, s) => sum + s.gdp, 0);
  const totalPop = usStatesData.reduce((sum, s) => sum + s.population, 0);
  const avgUnemployment = (
    usStatesData.reduce((sum, s) => sum + s.unemploymentRate, 0) /
    usStatesData.length
  ).toFixed(1);
  const avgMedianIncome = Math.round(
    usStatesData.reduce((sum, s) => sum + s.medianIncome, 0) /
      usStatesData.length,
  );
  const demStates = usStatesData.filter((s) => s.party === "Democrat").length;
  const repStates = usStatesData.filter((s) => s.party === "Republican").length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8 shadow-lg">
      {/* Header */}
      <div className="relative overflow-hidden px-6 py-6 flex flex-wrap items-center justify-between gap-5 border-b border-border">
        {/* Background gradient — vivid in dark, softer in light */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-700/20 dark:from-blue-900/70 dark:via-cyan-800/50 dark:to-blue-900/70 pointer-events-none" />
        {/* Subtle star/shine overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />

        {/* Left: title + inline countdown */}
        <div className="relative flex items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold font-sans text-foreground tracking-tight leading-tight">
              United States of America
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground font-sans">
                Federal Republic
              </span>
              <span className="w-1 h-1 rounded-full bg-border inline-block" />
              <span className="text-xs font-medium text-muted-foreground font-sans">
                50 States
              </span>
              <span className="w-1 h-1 rounded-full bg-border inline-block" />
              <span className="text-xs font-medium text-muted-foreground font-sans">
                Washington, D.C.
              </span>
            </div>
          </div>

          {/* Inline Election countdown */}
          <div className="flex items-center gap-3 bg-background/60 dark:bg-black/40 backdrop-blur-sm border border-border dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-400/15 dark:bg-yellow-400/20 border border-yellow-400/30 shrink-0">
              <Timer
                size={14}
                className="text-yellow-500 dark:text-yellow-400"
                weight="fill"
              />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground font-sans uppercase tracking-widest mb-1">
                Next Presidential Election · Nov 2028
              </p>
              <div className="flex items-end gap-1 font-mono">
                {[
                  { val: String(days).padStart(3, "0"), label: "days" },
                  { val: String(hours).padStart(2, "0"), label: "hrs" },
                  { val: String(mins).padStart(2, "0"), label: "min" },
                  { val: String(secs).padStart(2, "0"), label: "sec" },
                ].map(({ val, label }, i) => (
                  <span key={label} className="inline-flex items-end gap-1">
                    {i > 0 && (
                      <span className="text-muted-foreground/60 text-base mb-0.5 leading-none">
                        :
                      </span>
                    )}
                    <span className="flex flex-col items-center">
                      <span className="text-base font-bold text-yellow-500 dark:text-yellow-400 leading-none tabular-nums">
                        {val}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {label}
                      </span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key national stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-border border-b border-border">
        {[
          {
            label: "Total GDP",
            value: `$${(totalGDP / 1000).toFixed(1)}T`,
            sub: "2026 estimate",
            icon: <CurrencyDollar size={14} weight="fill" />,
            color: "text-green-400",
          },
          {
            label: "Population",
            value: `${(totalPop / 1e6).toFixed(0)}M`,
            sub: "2026 estimate",
            icon: <Users size={14} weight="fill" />,
            color: "text-blue-400",
          },
          {
            label: "Unemployment",
            value: `${avgUnemployment}%`,
            sub: "Mar 2026 avg",
            icon: <ChartBar size={14} weight="fill" />,
            color: "text-orange-400",
          },
          {
            label: "Median Income",
            value: `$${(avgMedianIncome / 1000).toFixed(0)}K`,
            sub: "2026 avg",
            icon: <Factory size={14} weight="fill" />,
            color: "text-purple-400",
          },
          {
            label: "Democrat States",
            value: `${demStates}`,
            sub: "blue states (2026)",
            icon: <Flag size={14} weight="fill" />,
            color: "text-secondary",
          },
          {
            label: "Republican States",
            value: `${repStates}`,
            sub: "red states (2026)",
            icon: <Flag size={14} weight="fill" />,
            color: "text-red-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 px-3 py-2.5">
            <div className={`flex items-center gap-1 ${stat.color}`}>
              {stat.icon}
              <span className="text-[9px] font-sans text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className="text-base font-bold font-mono text-foreground leading-tight">
              {stat.value}
            </p>
            <p className="text-[9px] text-muted-foreground font-sans">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom: snapshot */}
      <div className="p-5">
        <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          National Snapshot
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Largest State (area)",
              value: "Alaska — 1.7M km²",
              color: "bg-blue-500/20 text-blue-300",
            },
            {
              label: "Most Populous",
              value: "California — 39.5M",
              color: "bg-green-500/20 text-green-300",
            },
            {
              label: "Highest GDP",
              value: "California — $4.1T",
              color: "bg-yellow-500/20 text-yellow-300",
            },
            {
              label: "Lowest Unemployment",
              value: "North Dakota — 2.2%",
              color: "bg-purple-500/20 text-purple-300",
            },
            {
              label: "Highest Median Income",
              value: "New Jersey — $100K",
              color: "bg-pink-500/20 text-pink-300",
            },
            {
              label: "Oldest State",
              value: "Delaware — 1787",
              color: "bg-orange-500/20 text-orange-300",
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground font-sans">
                {item.label}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full self-start ${item.color}`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function StatesPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [partyFilter, setPartyFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "population" | "gdp" | "medianIncome" | "approvalRating"
  >("gdp");
  const [modalState, setModalState] = useState<USState | null>(null);

  const regions = ["All", "West", "South", "Northeast", "Midwest"];
  const parties = ["All", "Democrat", "Republican", "Independent"];

  const filtered = usStatesData
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.abbreviation.toLowerCase().includes(search.toLowerCase());
      const matchRegion = regionFilter === "All" || s.region === regionFilter;
      const matchParty = partyFilter === "All" || s.party === partyFilter;
      return matchSearch && matchRegion && matchParty;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* US National Banner */}
        <USNationalBanner />

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <Buildings size={26} weight="fill" className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              US States
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              Demographics, economics, and governance data for all 50 states
            </p>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "States Tracked",
              value: "50",
              icon: <Buildings size={18} weight="fill" />,
              color: "text-secondary",
            },
            {
              label: "Total Population",
              value: "335M+",
              icon: <Users size={18} weight="fill" />,
              color: "text-success",
            },
            {
              label: "Largest Economy",
              value: "CA · $4.1T",
              icon: <CurrencyDollar size={18} weight="fill" />,
              color: "text-warning",
            },
            {
              label: "Avg Unemployment",
              value: "3.8%",
              icon: <TrendDown size={18} weight="fill" />,
              color: "text-secondary",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-3"
            >
              <span className={s.color}>{s.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground font-sans">
                  {s.label}
                </p>
                <p className="text-base font-bold font-mono text-foreground">
                  {s.value}
                </p>
              </div>
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
              placeholder="Search states…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Pills + Sort */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  regionFilter === r
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {r}
              </button>
            ))}
            <div className="w-px h-5 bg-border shrink-0" />
            {parties.map((p) => {
              const isActive = partyFilter === p;
              const activeStyle =
                p === "Democrat"
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : p === "Republican"
                    ? "bg-red-500/15 text-red-400 border-red-500/40"
                    : p === "Independent"
                      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                      : "bg-secondary/20 text-secondary border-secondary/40";
              return (
                <button
                  key={p}
                  onClick={() => setPartyFilter(p)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? activeStyle
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <div className="w-px h-5 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdp">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="medianIncome">Sort: Median Income</option>
              <option value="approvalRating">Sort: Approval</option>
            </select>
          </div>
        </div>

        {modalState && (
          <StateModal state={modalState} onClose={() => setModalState(null)} />
        )}

        {/* State Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {filtered.map((state) => (
            <article
              key={state.id}
              onClick={() => setModalState(state)}
              className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40"
            >
              {/* Card header with flag background */}
              <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                {/* Flag background */}
                <img
                  src={`https://flagcdn.com/w320/us-${state.id}.png`}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105 select-none pointer-events-none"
                />
                {/* Gradient overlay so text stays readable */}
                <div className="absolute inset-0 bg-gradient-to-b from-card/60 via-card/70 to-card pointer-events-none" />
                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <img
                      src={`https://flagcdn.com/w80/us-${state.id}.png`}
                      alt={`${state.name} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.onerror = null;
                        t.style.display = "none";
                        const fb = t.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-1 items-center justify-center hidden">
                      <span className="text-sm font-bold font-mono text-primary-foreground">
                        {state.abbreviation}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold font-sans text-foreground text-sm">
                      {state.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {state.capital} · {state.region}
                    </p>
                  </div>
                </div>
                <span
                  className={`relative text-xs border px-2 py-0.5 rounded-full font-sans ${partyColor[state.party]}`}
                >
                  {state.party === "Democrat"
                    ? "D"
                    : state.party === "Republican"
                      ? "R"
                      : "I"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-sans">GDP</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    ${state.gdp}B
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Population
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {(state.population / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Income Tax
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {state.stateTaxRate != null
                      ? state.stateTaxRate === 0
                        ? "None"
                        : `${state.stateTaxRate}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Sales Tax
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {state.salesTaxRate != null
                      ? state.salesTaxRate === 0
                        ? "None"
                        : `${state.salesTaxRate}%`
                      : "—"}
                  </p>
                </div>
              </div>
              {/* QoL bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-sans">
                    Quality of Living
                  </span>
                  <span
                    className={`font-mono font-semibold ${state.qualityOfLiving >= 75 ? "text-success" : state.qualityOfLiving >= 55 ? "text-warning" : "text-destructive"}`}
                  >
                    {state.qualityOfLiving}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${state.qualityOfLiving >= 75 ? "bg-success" : state.qualityOfLiving >= 55 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${state.qualityOfLiving}%` }}
                  />
                </div>
              </div>

              {/* Voter share mini bars */}
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden mb-2">
                {state.voterShare.map((v, i) => (
                  <div
                    key={v.party}
                    style={{ width: `${v.pct}%`, background: VOTER_COLORS[i] }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-sans">
                {state.voterShare.map((v) => (
                  <span key={v.party}>
                    {v.party.slice(0, 3)} {v.pct}%
                  </span>
                ))}
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 modal-tile rounded-xl p-12 text-center">
              <p className="text-muted-foreground font-sans text-sm">
                No states match your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
