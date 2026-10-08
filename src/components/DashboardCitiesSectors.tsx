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
 *                   since 2000 from the same series. Under each city,
 *                   quality-of-living figures as bars (CityQualityBars):
 *                   its country's, said to be so, since none is published
 *                   city by city. The city's other facts and what it is
 *                   known for stood here and were taken off; their data
 *                   (cityFigures.ts, cityKnownFor.ts) is kept. One city is
 *                   open at a time, so the card keeps to the height of the
 *                   card beside it.
 *   Sector Outlook  eight sectors with an "outlook" and a "confidence", and
 *                   "7-week" sparklines; nobody publishes such figures. It
 *                   now gives, for the sectors the site holds a published
 *                   world series for, the latest year's figure, the year
 *                   before's, the change between them and on ten years
 *                   before, and each one's whole series as a line.
 *
 * A growth rate here is worked out from two published figures of one series;
 * the containers say so. Sector Outlook keeps its name because it is the
 * container that was asked back, and says in its first line that it is what
 * happened, not a forecast: the published projections are on the Trends
 * page.
 */
import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Buildings, CaretDown, ChartLineUp, TrendDown, TrendUp } from "@phosphor-icons/react";
import { citiesData } from "../data/citiesData";
import { CITY_FIGURES, CITY_FIGURES_SOURCE } from "../data/cityFigures";
import { RENEWABLE_GENERATION, RENEWABLE_GENERATION_SOURCE } from "../data/renewables";
import { TSMC_REVENUE } from "../data/technology";
import { WORLD } from "../data/worldview";
import { cityGrowth, cityYear } from "../lib/cityFigures";
import { tooltipStyle, useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Point = [year: number, value: number];

/** A city's quality-of-living bars, and where they are from: loaded with the country panels they read when the card is shown. */
const CityQualityBars = lazy(() => import("./CityQualityBars"));
const CityQualitySources = lazy(() => import("./CityQualityBars").then((m) => ({ default: m.CityQualitySources })));

const GREEN = "#10b981";
const RED = "#ef4444";
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const publisher = (label: string) => label.replace(/ \(via [^)]*\)$/, "").split(" — ")[0];

/** A Dashboard card. In the page's grid it is as tall as the card beside it. */
export function Card({ t, children, className = "" }: { t: Tokens; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col ${className}`} style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      {children}
    </div>
  );
}

export function Head({ t, icon, label, badge, color, cta, to }: { t: Tokens; icon: ReactNode; label: string; badge: string; color: string; cta: string; to: string }) {
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

export const Kicker = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: t.mutedText }}>
    {children}
  </p>
);

/** The mark at the end of a row that opens: it turns up when its row is open. */
export const Caret = ({ open, color }: { open: boolean; color: string }) => (
  <CaretDown size={10} weight="bold" aria-hidden className="shrink-0 transition-transform" style={{ color, transform: open ? "rotate(180deg)" : "none" }} />
);

/** The way from an open row to the page that holds the rest. */
export function Go({ color, onClick, children }: { color: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70 cursor-pointer" style={{ color }}>
      {children} <ArrowRight size={10} weight="bold" aria-hidden />
    </button>
  );
}

// ── Cities ──────────────────────────────────────────────────────────────────

const BASE = CITY_FIGURES_SOURCE.baseYear;
const SINCE = 2000;
const CITY_COLORS = ["#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#a855f7", "#ec4899"];
const millions = (n: number) => `${(n / 1e6).toFixed(1)}M`;

/** The cities the site profiles, with the UN's population for its base year and their growth since 2000: the largest first. */
const CITY_ROWS = citiesData
  .flatMap((c) => {
    const now = cityYear(c.id);
    const f = CITY_FIGURES[c.id];
    return now && f ? [{ c, pop: now.population, growth: cityGrowth(c.id, SINCE, BASE), capital: f.capital }] : [];
  })
  .sort((a, b) => b.pop - a.pop);

export function CitiesContainer() {
  const t = useTokens();
  const navigate = useNavigate();
  const color = "#10b981";
  const top = CITY_ROWS.slice(0, 10);
  const largest = top[0];
  // One city is open at a time: the first, until another is chosen.
  const [open, setOpen] = useState(top[0]?.c.id);
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
      <div className="flex flex-col flex-1 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        <Kicker t={t}>The ten largest · choose one for its quality of living</Kicker>
        {top.map(({ c, pop, growth, capital }, i) => (
          <div key={c.id} className="py-2" style={{ borderBottom: i < top.length - 1 ? `1px solid ${t.gridLine}` : "none" }}>
            <button type="button" aria-expanded={open === c.id} onClick={() => setOpen(c.id)} className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity cursor-pointer">
              <img src={`https://flagcdn.com/w40/${c.countryCode.toLowerCase()}.png`} alt="" width={20} height={15} loading="lazy" className="rounded-sm shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                  {c.name}
                </span>
                <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                  {c.country}
                  {capital ? " · its capital" : ""}
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
              <Caret open={open === c.id} color={t.mutedText} />
            </button>
            {/* Quality of living: the rows of the city's own window, which are its country's and say so. */}
            {open === c.id && (
              <Suspense fallback={null}>
                <CityQualityBars t={t} code={c.countryCode} country={c.country} city={c.id} name={c.name} />
                <div className="pl-7 mt-2">
                  <Go color={color} onClick={() => navigate(`/dashboard/cities?open=${c.id}`)}>
                    Open {c.name}
                  </Go>
                </div>
              </Suspense>
            )}
          </div>

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
        Each city as the UN draws it, for {BASE}: built-up land of at least 1,500 people to a km² holding 50,000 or more, which is not the city's own boundary. The change under a
        figure is its population on {SINCE}. The quality-of-living figures under a city are its country's, each from the body that measures it and for its latest year: no body
        publishes health, water, air, safety, schooling and income city by city on one footing. A figure that is the city's own comes first and says so. A bar is on the measure's
        own scale - 0 to 100 for a share - or, where the world's figure is the only yardstick, on the larger of the two; the tick is the world. A figure with neither is given
        without a bar. Every panel is in the city's window. The ten largest of the {CITY_ROWS.length} the site profiles, not of the world's.
      </p>
      <Suspense fallback={null}>
        <CityQualitySources places={top.map(({ c }) => ({ code: c.countryCode, country: c.country, city: c.id, name: c.name }))} className="mt-1" />
      </Suspense>

    </Card>
  );
}

// ── Sector Outlook ──────────────────────────────────────────────────────────

type Sector = { sector: string; what: string; series: Point[]; color: string; source: Source; /** The figure as printed, with its unit. */ print: (v: number) => string };
const money = (v: number) => {
  const a = Math.abs(v);
  return "$" + (a >= 1e12 ? (v / 1e12).toFixed(2) + "T" : a >= 1e9 ? (v / 1e9).toFixed(a >= 1e11 ? 0 : 1) + "bn" : (v / 1e6).toFixed(0) + "M");
};
const twh = (v: number) => Math.round(v).toLocaleString("en-US") + " TWh";
const world = (id: string, sector: string, what: string, color: string, print: (v: number) => string): Sector[] => {
  const ind = WORLD[id];
  return ind ? [{ sector, what, series: ind.series as Point[], color, source: ind.source, print }] : [];
};
/** The sectors the site holds a yearly world series for, each by the series that measures it. */
const SECTORS: Sector[] = [
  ...world("militaryUsd", "Defence", "world military spending", "#ef4444", money),
  { sector: "Renewables", what: "electricity from renewable sources", series: RENEWABLE_GENERATION.map((r) => [r.year, r.solar + r.wind + r.hydro + r.bioenergy + r.other] as Point), color: "#10b981", source: RENEWABLE_GENERATION_SOURCE, print: twh },
  // TSMC's revenue is held in US$ billions.
  { sector: "Semiconductors", what: "TSMC's revenue, the largest chip foundry", series: TSMC_REVENUE.series as Point[], color: "#6366f1", source: TSMC_REVENUE.source, print: (v) => "$" + v.toFixed(1) + "bn" },
  ...world("aiInvestment", "AI", "private investment in AI, 2021 prices", "#a855f7", money),
  ...world("manufacturingUsd", "Manufacturing", "world manufacturing value added", "#06b6d4", money),
  ...world("robotInstalls", "Industrial robots", "robots installed in the year", "#f97316", (v) => Math.round(v).toLocaleString("en-US")),
  ...world("extDebtUsd", "Developing-country debt", "external debt of developing countries", "#f59e0b", money),
  ...world("oilProduction", "Oil", "world oil production", "#64748b", twh),
];

/**
 * Why each sector's figure matters and what it is used for: the site's own two lines under the row, written to what the
 * series measures. They explain; they carry no figure of their own.
 */
const SECTOR_MEANING: Record<string, { why: string; use: string }> = {
  Defence: {
    why: "What governments commit to their armed forces: money every other public service competes with, and a sign of how states read their own security.",
    use: "Set a country's spending against its GDP on its page to see who is behind a rise. Budget offices, arms makers and diplomats all read it.",
  },
  Renewables: {
    why: "The electricity the world gets from water, wind, sun and biomass: how far power has moved off coal and gas.",
    use: "Against total generation it gives the renewable share. It sizes the market for panels, turbines, grids and storage, and for the minerals they need.",
  },
  Semiconductors: {
    why: "Chips run phones, cars, data centres and weapons. The largest contract chipmaker's sales show how many of them the world is ordering.",
    use: "One company, not the whole industry: an early signal of demand for computing, and a reminder of how much production sits with a single firm.",
  },
  AI: {
    why: "Money that funds and companies put into privately held AI firms: where investors expect the next products and profits to come from.",
    use: "Investment is a bet, not output. It shows where skills and computing will be in demand; set it beside research and adoption before reading it as growth.",
  },
  Manufacturing: {
    why: "The value factories add to the materials they buy: the size of the world's industrial base, and of the trade in goods that rests on it.",
    use: "It is in current dollars, so prices and exchange rates move it as well as output. Use it to weigh one country's share of world industry.",
  },
  "Industrial robots": {
    why: "How many new robots factories put to work in a year: the pace at which production is being automated.",
    use: "A count of machines, not of jobs. Read it with manufacturing output and employment to see whether factories are making more with fewer people.",
  },
  "Developing-country debt": {
    why: "What low- and middle-income countries owe to lenders abroad. Repaying it takes foreign currency that could otherwise pay for imports, schools and health.",
    use: "Compare a country's debt with its income, exports and reserves on its page to judge whether it can carry it, as lenders and aid donors do.",
  },
  Oil: {
    why: "Oil fuels road, air and sea transport and is the feedstock of plastics and chemicals. How much is produced bears on fuel prices and on exporters' income.",
    use: "Read it beside renewables to see whether new energy is replacing oil or adding to it. Changes in output feed through to prices at the pump.",
  },
};

/** Each sector's latest year against the year before, and against ten years before where its series reaches that far. */
const SECTOR_ROWS = SECTORS.flatMap((s) => {
  const [year, now] = s.series[s.series.length - 1] ?? [];
  const before = s.series.find(([y]) => y === year - 1)?.[1];
  if (year === undefined || !before || before <= 0) return [];
  const decade = s.series.find(([y]) => y === year - 10)?.[1];
  return [{ ...s, year, now, before, change: (now / before - 1) * 100, decade: decade && decade > 0 ? { value: decade, change: (now / decade - 1) * 100 } : null }];
});

export function SectorOutlook() {
  const t = useTokens();
  const color = "#a855f7";
  const sources = [...new Map(SECTOR_ROWS.map((r) => [r.source.url, { label: publisher(r.source.label), url: r.source.url }])).values()];
  return (
    <Card t={t}>
      <Head t={t} icon={<ChartLineUp size={14} weight="fill" />} label="Sector Outlook" badge="latest year" color={color} cta="Full Trends" to="/dashboard/trends" />
      <p className="text-[10px] font-sans leading-snug -mt-2 mb-2" style={{ color: t.mutedText }}>
        What each sector's published series did: its latest year's figure, the year before's, the change between them and on ten years before, and the series itself - what
        happened, not a forecast. Under each, why the figure matters and what it is used for.
      </p>

      {/* Sector rows: the figure and its change above, the series and the years it is set against below. */}
      <div className="flex flex-col">
        {SECTOR_ROWS.map((s, i) => {
          const up = s.change >= 0;
          const grad = "sector-" + s.sector.replace(/[^A-Za-z0-9]/g, "");
          return (
            <div key={s.sector} className="py-2" style={{ borderBottom: i < SECTOR_ROWS.length - 1 ? `1px solid ${t.gridLine}` : "none" }} title={`${s.what}, ${s.series[0][0]} to ${s.year} · ${s.source.label}`}>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: s.color }} aria-hidden />
                <span className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold font-sans truncate block" style={{ color: t.headText }}>
                    {s.sector}
                  </span>
                  <span className="text-[9px] font-mono truncate block" style={{ color: t.mutedText }}>
                    {s.what} · {publisher(s.source.label)}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-[12px] font-mono font-bold" style={{ color: t.headText }}>
                    {s.print(s.now)}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {s.year}
                  </span>
                </span>
                <span className="flex items-center gap-0.5 shrink-0 w-16 justify-end mt-0.5" title={`${s.year} against ${s.year - 1}`}>
                  {up ? <TrendUp size={9} weight="fill" color={GREEN} /> : <TrendDown size={9} weight="fill" color={RED} />}
                  <span className="text-[10px] font-mono font-semibold" style={{ color: up ? GREEN : RED }}>
                    {signed(s.change)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 pl-3.5">
                <div className="flex-1 min-w-0" role="img" aria-label={`${s.what}, ${s.series[0][0]} to ${s.year}.`}>
                  <ResponsiveContainer width="100%" height={22}>
                    <AreaChart data={s.series.map(([year, v]) => ({ year, v }))} margin={{ top: 1, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={s.color} strokeWidth={1.5} fill={`url(#${grad})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-[9px] font-mono shrink-0 text-right leading-snug" style={{ color: t.mutedText }}>
                  <span className="block">
                    {s.year - 1}: <span style={{ color: t.bodyText }}>{s.print(s.before)}</span>
                  </span>
                  <span className="block">
                    {s.decade ? (
                      <>
                        {s.year - 10}: <span style={{ color: t.bodyText }}>{s.print(s.decade.value)}</span> · {signed(s.decade.change, 0)}
                      </>
                    ) : (
                      `series from ${s.series[0][0]}`
                    )}
                  </span>
                </span>
              </div>
              {SECTOR_MEANING[s.sector] && (
                <p className="text-[10px] font-sans leading-snug mt-1.5 pl-3.5" style={{ color: t.bodyText }}>
                  <span className="font-semibold" style={{ color: s.color }}>
                    Why it matters
                  </span>{" "}
                  {SECTOR_MEANING[s.sector].why}{" "}
                  <span className="font-semibold" style={{ color: s.color }}>
                    In practice
                  </span>{" "}
                  {SECTOR_MEANING[s.sector].use}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        A change is worked out from the publisher's two figures: beside a sector, its latest year on the year before; under it, the year before's figure and the figure
        ten years before with the change since. The line is the series from its first year. The sectors are measured in different things - dollars, terawatt-hours,
        robots - so the rates set them in order and nothing more. No body publishes a twelve-month outlook by sector; the projections that are published are on the
        Trends page. "Why it matters" and "In practice" are the site's own explanation of what each series measures, not the publisher's words, and add no figure.
      </p>
      <SourceLink sources={sources} className="mt-1" />
    </Card>
  );
}
