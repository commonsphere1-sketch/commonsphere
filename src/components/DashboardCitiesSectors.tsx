/**
 * The Dashboard's Cities and Sector Outlook containers.
 *
 * Both are back where they stood, laid out as they were. What fills them is
 * not what did:
 *
 *   Cities          a bar chart, a list of ten cities and three tiles. They
 *                   showed "GDP per capita" and a growth rate for each city,
 *                   cited to a cost-of-living site that publishes neither,
 *                   and "500+ cities tracked". They now show the ten largest
 *                   of the cities the site profiles by the United Nations'
 *                   population for its base year, with each one's growth
 *                   since 2000 from the same series.
 *   Sector Outlook  eight sectors with an "outlook" and a "confidence", and
 *                   "7-week" sparklines; nobody publishes such figures. It
 *                   now gives, for the sectors the site holds a published
 *                   world series for, the latest year against the year
 *                   before, and draws the whole series of the three that
 *                   moved most.
 *
 * A growth rate here is worked out from two published figures of one series;
 * the containers say so. Sector Outlook keeps its name because it is the
 * container that was asked back, and says in its first line that it is what
 * happened, not a forecast: the published projections are in the Trends &
 * Projections panel above it.
 */
import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Buildings, ChartLineUp, TrendDown, TrendUp } from "@phosphor-icons/react";
import { citiesData } from "../data/citiesData";
import { CITY_FIGURES_SOURCE } from "../data/cityFigures";
import { RENEWABLE_GENERATION, RENEWABLE_GENERATION_SOURCE } from "../data/renewables";
import { TSMC_REVENUE } from "../data/technology";
import { WORLD } from "../data/worldview";
import { cityGrowth, cityYear } from "../lib/cityFigures";
import { tooltipStyle, useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Point = [year: number, value: number];

const GREEN = "#10b981";
const RED = "#ef4444";
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const publisher = (label: string) => label.replace(/ \(via [^)]*\)$/, "").split(" — ")[0];

function Card({ t, children, className = "" }: { t: Tokens; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col ${className}`} style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      {children}
    </div>
  );
}

function Head({ t, icon, label, badge, color, cta, to }: { t: Tokens; icon: ReactNode; label: string; badge: string; color: string; cta: string; to: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <span style={{ color }}>{icon}</span>
        <h2 className="text-base font-bold font-sans" style={{ color: t.headText }}>
          {label}
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: color + "15", color }}>
          {badge}
        </span>
      </div>
      <button type="button" onClick={() => navigate(to)} className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color }}>
        {cta} <ArrowRight size={11} weight="bold" />
      </button>
    </div>
  );
}

const Kicker = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: t.mutedText }}>
    {children}
  </p>
);

// ── Cities ──────────────────────────────────────────────────────────────────

const BASE = CITY_FIGURES_SOURCE.baseYear;
const SINCE = 2000;
const CITY_COLORS = ["#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#a855f7", "#ec4899"];
const millions = (n: number) => `${(n / 1e6).toFixed(1)}M`;

/** The cities the site profiles, with the UN's population for its base year and their growth since 2000: the largest first. */
const CITY_ROWS = citiesData
  .flatMap((c) => {
    const now = cityYear(c.id);
    return now ? [{ c, pop: now.population, growth: cityGrowth(c.id, SINCE, BASE) }] : [];
  })
  .sort((a, b) => b.pop - a.pop);

export function CitiesContainer() {
  const t = useTokens();
  const navigate = useNavigate();
  const color = "#10b981";
  const top = CITY_ROWS.slice(0, 10);
  const largest = top[0];
  const fastest = useMemo(() => [...CITY_ROWS].filter((r) => r.growth).sort((a, b) => b.growth!.pct - a.growth!.pct)[0], []);
  const chart = top.map((r, i) => ({ name: r.c.name.length > 9 ? `${r.c.name.slice(0, 8)}…` : r.c.name, full: r.c.name, pop: Number((r.pop / 1e6).toFixed(1)), color: CITY_COLORS[i % CITY_COLORS.length] }));
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false };
  return (
    <Card t={t} className="flex-1">
      <Head t={t} icon={<Buildings size={16} weight="fill" />} label="Cities" badge={`${CITY_ROWS.length} profiled`} color={color} cta="All Cities" to="/dashboard/cities" />

      <Kicker t={t}>Population · millions · {BASE}</Kicker>
      <div role="img" aria-label={`The ten largest cities on the site by population, ${BASE}: ${top.map((r) => `${r.c.name} ${millions(r.pop)}`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chart} margin={{ top: 2, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} vertical={false} />
            <XAxis dataKey="name" {...axis} interval={0} tick={{ ...axis.tick, fontSize: 8 }} />
            <YAxis {...axis} />
            <Tooltip {...tooltipStyle(t)} cursor={{ fill: t.tile }} formatter={(v: number) => [`${v}M people`, "Population"]} labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ""} />
            <Bar dataKey="pop" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false}>
              {chart.map((d) => (
                <Cell key={d.full} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SourceLink sources={[{ label: "United Nations, World Urbanization Prospects: The 2025 Revision", url: CITY_FIGURES_SOURCE.url }]} className="mt-1 mb-1" />

      {/* City list */}
      <div className="flex flex-col mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        {top.map(({ c, pop, growth }, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/dashboard/cities?open=${c.id}`)}
            className="flex items-center gap-2 py-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
            style={{ borderBottom: i < top.length - 1 ? `1px solid ${t.gridLine}` : "none" }}
          >
            <img src={`https://flagcdn.com/w40/${c.countryCode.toLowerCase()}.png`} alt="" width={20} height={15} loading="lazy" className="rounded-sm shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                {c.name}
              </span>
              <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                {c.country}
              </span>
            </span>
            {/* On the scale of the largest city shown. */}
            <span className="w-12 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${Math.round((100 * pop) / largest.pop)}%`, background: CITY_COLORS[i % CITY_COLORS.length] }} />
            </span>
            <span className="text-right shrink-0 w-16">
              <span className="block text-[11px] font-mono font-semibold" style={{ color: t.headText }}>
                {millions(pop)}
              </span>
              {growth && (
                <span className="block text-[10px] font-mono" style={{ color: growth.pct >= 0 ? GREEN : RED }}>
                  {signed(growth.pct, 0)}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        {[
          { label: "Largest", value: millions(largest.pop), note: largest.c.name, color: "#10b981" },
          { label: `Fastest since ${SINCE}`, value: fastest?.growth ? signed(fastest.growth.pct, 0) : "—", note: fastest?.c.name ?? "", color: "#f59e0b" },
          { label: "Cities profiled", value: `${CITY_ROWS.length}`, note: "on the site", color: "#6366f1" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl px-2 py-2 text-center" style={{ background: m.color + "10", border: `1px solid ${m.color}20` }}>
            <p className="text-sm font-bold font-mono" style={{ color: t.headText }}>
              {m.value}
            </p>
            <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
              {m.label}
              <br />
              {m.note}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        Each city as the UN draws it, for {BASE}; the change under a figure is its population on {SINCE}, from the same series. The ten largest of the {CITY_ROWS.length}{" "}
        the site profiles, not of the world's.
      </p>
    </Card>
  );
}

// ── Sector Outlook ──────────────────────────────────────────────────────────

type Sector = { sector: string; what: string; series: Point[]; color: string; source: Source };
const world = (id: string, sector: string, what: string, color: string): Sector[] => {
  const ind = WORLD[id];
  return ind ? [{ sector, what, series: ind.series as Point[], color, source: ind.source }] : [];
};
/** The sectors the site holds a yearly world series for, each by the series that measures it. */
const SECTORS: Sector[] = [
  ...world("militaryUsd", "Defence", "world military spending", "#ef4444"),
  { sector: "Renewables", what: "electricity from renewable sources", series: RENEWABLE_GENERATION.map((r) => [r.year, r.solar + r.wind + r.hydro + r.bioenergy + r.other] as Point), color: "#10b981", source: RENEWABLE_GENERATION_SOURCE },
  { sector: "Semiconductors", what: "TSMC's revenue, the largest chip foundry", series: TSMC_REVENUE.series as Point[], color: "#6366f1", source: TSMC_REVENUE.source },
  ...world("aiInvestment", "AI", "private investment in AI", "#a855f7"),
  ...world("manufacturingUsd", "Manufacturing", "world manufacturing value added", "#06b6d4"),
  ...world("robotInstalls", "Industrial robots", "robots installed in the year", "#f97316"),
  ...world("extDebtUsd", "Developing-country debt", "external debt of developing countries", "#f59e0b"),
  ...world("oilProduction", "Oil", "world oil production", "#64748b"),
];

/** Each sector's latest year against the year before, where its series has both. */
const SECTOR_ROWS = SECTORS.flatMap((s) => {
  const [year, now] = s.series[s.series.length - 1] ?? [];
  const before = s.series.find(([y]) => y === year - 1)?.[1];
  if (year === undefined || !before || before <= 0) return [];
  return [{ ...s, year, change: (now / before - 1) * 100 }];
});

export function SectorOutlook() {
  const t = useTokens();
  const color = "#a855f7";
  const top = Math.max(...SECTOR_ROWS.map((r) => Math.abs(r.change)), 1);
  const movers = useMemo(() => [...SECTOR_ROWS].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3), []);
  const sources = [...new Map(SECTOR_ROWS.map((r) => [r.source.url, { label: publisher(r.source.label), url: r.source.url }])).values()];
  return (
    <Card t={t}>
      <Head t={t} icon={<ChartLineUp size={14} weight="fill" />} label="Sector Outlook" badge="latest year" color={color} cta="Full Trends" to="/dashboard/trends" />
      <p className="text-[10px] font-sans leading-snug -mt-2 mb-2" style={{ color: t.mutedText }}>
        What each sector's published series did in its latest year against the year before - what happened, not a forecast.
      </p>

      {/* Sector rows */}
      <div className="flex flex-col">
        {SECTOR_ROWS.map((s, i) => {
          const up = s.change >= 0;
          return (
            <div key={s.sector} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < SECTOR_ROWS.length - 1 ? `1px solid ${t.gridLine}` : "none" }} title={`${s.what}, ${s.year} against ${s.year - 1} · ${publisher(s.source.label)}`}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold font-sans truncate block" style={{ color: t.headText }}>
                  {s.sector}
                </span>
                <span className="text-[9px] font-mono truncate block" style={{ color: t.mutedText }}>
                  {s.what} · {s.year}
                </span>
              </span>
              {/* On the scale of the largest move shown, up or down. */}
              <span className="w-12 h-1 rounded-full overflow-hidden shrink-0" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
                <span className="block h-full rounded-full" style={{ width: `${Math.max(3, (100 * Math.abs(s.change)) / top)}%`, background: s.color }} />
              </span>
              <span className="flex items-center gap-0.5 shrink-0 w-16 justify-end">
                {up ? <TrendUp size={9} weight="fill" color={GREEN} /> : <TrendDown size={9} weight="fill" color={RED} />}
                <span className="text-[10px] font-mono font-semibold" style={{ color: up ? GREEN : RED }}>
                  {signed(s.change)}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* The three that moved most: each one's whole series */}
      <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: t.mutedText }}>
          Top movers · each one's series
        </p>
        {movers.map((s) => (
          <div key={s.sector} className="flex items-center gap-2">
            <span className="text-[9px] font-sans font-semibold truncate w-24 shrink-0" style={{ color: t.headText }}>
              {s.sector}
            </span>
            <div className="flex-1 min-w-0" role="img" aria-label={`${s.what}, ${s.series[0][0]} to ${s.year}.`}>
              <ResponsiveContainer width="100%" height={24}>
                <AreaChart data={s.series.map(([year, v]) => ({ year, v }))} margin={{ top: 1, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`sector-${s.sector.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={s.color} strokeWidth={1.5} fill={`url(#sector-${s.sector.replace(/\W/g, "")})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[9px] font-mono shrink-0 w-16 text-right" style={{ color: t.mutedText }}>
              {s.series[0][0]}–{s.year}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        A change is worked out from the publisher's two figures. The sectors are measured in different things - dollars, terawatt-hours, robots - so the rates set
        them in order and nothing more. No body publishes a twelve-month outlook by sector; the projections that are published are in Trends &amp; Projections.
      </p>
      <SourceLink sources={sources} className="mt-1" />
    </Card>
  );
}
