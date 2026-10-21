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
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowRight, Buildings, CaretDown, ChartLineUp, TrendDown, TrendUp } from "@phosphor-icons/react";
import { countriesData } from "../data/countriesData";
import { unCityId } from "../lib/profiledCities";
import { RENEWABLE_GENERATION, RENEWABLE_GENERATION_SOURCE } from "../data/renewables";
import { TSMC_REVENUE } from "../data/technology";
import { WORLD } from "../data/worldview";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import SlimBars from "./SlimBars";

type Source = { label: string; url: string };
type Point = [year: number, value: number];

/* The quality-of-living bars that opened under a city (CityQualityBars) are in its window now; the card opens that. */

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

/* The card is the Cities page in brief, as asked: the cities the United Nations counts (World Urbanization Prospects: The
   2025 Revision), the ten largest, and each one opening its own window on that page - not the 34 profiles it once listed.
   The UN's list is large, so it is read when the card is first drawn. */
type UnModule = typeof import("../data/unCities");
const SINCE = 2000;
const CITY_COLORS = ["#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#a855f7", "#ec4899"];
const millions = (n: number) => `${(n / 1e6).toFixed(1)}M`;
const COUNTRY_NAME = new Map(countriesData.map((c) => [c.code, c.name]));
/** A city's change from 2000 to 2025, %, where the UN gives both. */
const since2000 = (c: UnModule["UN_CITIES"][number]) => (c[7] && c[8] ? ((c[8] - c[7]) / c[7]) * 100 : null);

export function CitiesContainer() {
  const t = useTokens();
  const navigate = useNavigate();
  const color = "#10b981";
  const [un, setUn] = useState<UnModule | null>(null);
  useEffect(() => {
    let off = false;
    import("../data/unCities").then((m) => !off && setUn(m));
    return () => {
      off = true;
    };
  }, []);
  const base = un?.UN_CITY_YEARS[2] ?? 2025;
  const top = useMemo(() => (un ? un.UN_CITIES.slice(0, 10) : []), [un]);
  // The fastest-growing since 2000 of the cities of a million or more: among smaller ones a few thousand new people is a large share.
  const fastest = useMemo(() => {
    if (!un) return null;
    let best: { c: UnModule["UN_CITIES"][number]; pct: number } | null = null;
    for (const c of un.UN_CITIES) {
      if (c[8] < 1e6) break;
      const pct = since2000(c);
      if (pct !== null && (!best || pct > best.pct)) best = { c, pct };
    }
    return best;
  }, [un]);
  const open = (c: UnModule["UN_CITIES"][number]) => navigate(`/dashboard/cities?open=${unCityId(c)}`);
  const largest = top[0];
  return (
    <Card t={t} className="flex-1">
      <Head t={t} icon={<Buildings size={16} weight="fill" />} label="Cities" badge={un ? `${un.UN_CITIES.length.toLocaleString("en-US")} counted` : "the UN's"} color={color} cta="All Cities" to="/dashboard/cities" />

      {!un ? (
        <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
          Loading the cities…
        </p>
      ) : (
        <>
          <Kicker t={t}>Population · millions · {base}</Kicker>
          <div role="img" aria-label={`The world's ten largest cities by population, ${base}: ${top.map((c) => `${c[2]} ${millions(c[8])}`).join(", ")}.`}>
            <SlimBars dense labelWidth="7.5rem" rows={top.map((c, i) => ({ key: unCityId(c), label: c[2], v: Number((c[8] / 1e6).toFixed(1)), color: CITY_COLORS[i % CITY_COLORS.length], tip: `${c[2]}: ${millions(c[8])} people, ${base}` }))} fmt={(v) => `${v}M`} />
          </div>
          <SourceLink sources={[un.UN_CITIES_SOURCE]} className="mt-1 mb-1" />

          {/* The ten, each opening its window on the Cities page. */}
          <div className="flex flex-col flex-1 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
            <Kicker t={t}>The world's ten largest · choose one to open its window</Kicker>
            {top.map((c, i) => {
              const pct = since2000(c);
              return (
                <button
                  key={unCityId(c)}
                  type="button"
                  onClick={() => open(c)}
                  className="flex items-center gap-2 w-full text-left py-2 hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ borderBottom: i < top.length - 1 ? `1px solid ${t.gridLine}` : "none" }}
                  aria-label={`Open ${c[2]}'s window`}
                >
                  <img src={`https://flagcdn.com/w40/${c[0].toLowerCase()}.png`} alt="" width={20} height={15} loading="lazy" className="rounded-sm shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold font-sans" style={{ color: t.headText }}>
                      {c[2]}
                    </span>
                    <span className="block text-[10px] font-mono" style={{ color: t.mutedText }}>
                      {COUNTRY_NAME.get(c[0]) ?? c[0]}
                      {c[5] ? " · its capital" : ""}
                    </span>
                  </span>
                  {/* On the scale of the largest. */}
                  <span className="w-12 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${Math.round((100 * c[8]) / largest[8])}%`, background: CITY_COLORS[i % CITY_COLORS.length] }} />
                  </span>
                  <span className="text-right shrink-0 w-16">
                    <span className="block text-[11px] font-mono font-semibold" style={{ color: t.headText }}>
                      {millions(c[8])}
                    </span>
                    {pct !== null && (
                      <span className="block text-[10px] font-mono" style={{ color: pct >= 0 ? GREEN : RED }}>
                        {signed(pct, 0)}
                      </span>
                    )}
                  </span>
                  <ArrowRight size={11} weight="bold" aria-hidden className="shrink-0" style={{ color: t.mutedText }} />
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
            {[
              { label: "Largest", value: millions(largest[8]), note: largest[2], color: "#10b981" },
              { label: `Fastest since ${SINCE}`, value: fastest ? signed(fastest.pct, 0) : "—", note: fastest ? `${fastest.c[2]}, of a million or more` : "", color: "#f59e0b" },
              { label: "Cities counted", value: un.UN_CITIES.length.toLocaleString("en-US"), note: "by the UN", color: "#6366f1" },
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
            Each city as the UN draws it, for {base}: built-up land of at least 1,500 people to a km² holding 50,000 or more, which is not the city's own boundary. The change under a figure is
            its population on {SINCE}'s, worked out here; since the UN draws a city as its built-up land, a change can include towns that land has grown to take in. A city opens its window on the Cities
            page, with its people, land and growth.
          </p>
        </>
      )}
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
