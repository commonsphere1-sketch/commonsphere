/**
 * What fills the Worldview page under its map when a country is picked on it:
 * the country's own figures, set out as a mosaic of panels after the
 * reference design the page follows - its headline figures, its GDP year by
 * year and the change on each year before, its tax revenue against the
 * world's, what its government spends by function, how many of its people
 * have the basics, who lives there by age, and where it stands among every
 * country on the map's measure.
 *
 * Every figure is its publisher's, read from data the site already holds,
 * with its year and its source under its panel: the World Bank's indicators
 * and GDP, the IMF's spending by function, the World Bank's tax revenue. A
 * change on the year before and a rank are worked out here, and say so. A
 * panel the country has no figures for says so and is not filled.
 */
import { useId, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE, COUNTRY_INDICATOR_FALLBACKS, type Measured } from "../data/countryIndicators";
import { GDP_HISTORY, GDP_HISTORY_SOURCE } from "../data/gdpHistory";
import { TAX_HISTORY, TAX_HISTORY_SOURCES, TAX_REVENUE_WORLD } from "../data/taxHistory";
import { BUDGET_DIVISIONS, BUDGET_SOURCE, COUNTRY_BUDGET } from "../data/countryBudget";
import { COUNTRY_PANELS, PANEL_SOURCES, type PanelField } from "../data/countryPanels";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

/** The site's colours for the panels, in turn. */
const INK = ["#2a78d6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"];
const usd = (b: number) => (b >= 1000 ? `$${(b / 1000).toFixed(2)}T` : b >= 1 ? `$${b.toFixed(b >= 100 ? 0 : 1)}B` : `$${Math.round(b * 1000)}M`);
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US"));

export type Ranked = { name: string; code: string; v: number; y: string };

function Panel({ t, title, meta, children, className = "" }: { t: Tokens; title: string; meta?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl flex flex-col min-w-0 ${className}`} style={{ background: t.cardBg, border: t.cardBorder }}>
      <div className="flex items-baseline gap-2 px-3.5 pt-3 pb-2 border-b" style={{ borderColor: t.gridLine }}>
        <h3 className="text-[10px] font-mono uppercase tracking-widest flex-1 min-w-0 truncate" style={{ color: t.headText }}>
          {title}
        </h3>
        {meta && (
          <span className="text-[9px] font-mono shrink-0" style={{ color: t.mutedText }}>
            {meta}
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2 flex-1">{children}</div>
    </section>
  );
}
const None = ({ t, children }: { t: Tokens; children: ReactNode }) => (
  <p className="text-[11px] font-sans py-6 text-center" style={{ color: t.mutedText }}>
    {children}
  </p>
);

export default function CountryDashboard({ code, name, measure, ranked }: { code: string; name: string; measure: { label: string; unit: string; color: string; fmt: (v: number) => string }; ranked: Ranked[] }) {
  const t = useTokens();
  const id = useId().replace(/:/g, "");
  const ind = COUNTRY_INDICATORS[code] ?? {};
  const gdp = (GDP_HISTORY[code] ?? []).map((r) => ({ year: r.year, gdp: r.gdp }));
  const change = gdp.slice(1).map((r, i) => ({ year: r.year, pct: gdp[i].gdp ? ((r.gdp - gdp[i].gdp) / gdp[i].gdp) * 100 : 0 }));
  const tax = TAX_HISTORY[code]?.revenue ?? [];
  const taxRows = [...new Set([...tax.map(([y]) => y), ...TAX_REVENUE_WORLD.map(([y]) => y)])]
    .sort((a, b) => a - b)
    .filter((y) => y >= (tax[0]?.[0] ?? Infinity))
    .map((y) => ({ year: String(y), own: tax.find(([x]) => x === y)?.[1] ?? null, world: TAX_REVENUE_WORLD.find(([x]) => x === y)?.[1] ?? null }));
  const budget = COUNTRY_BUDGET[code];
  const slices = budget ? BUDGET_DIVISIONS.map((d, i) => ({ name: d.label, v: budget.shares[d.id], color: INK[i] })).filter((s) => s.v > 0) : [];
  // The panels' figures are keyed by the code in lower case.
  const panels = COUNTRY_PANELS[code.toLowerCase()] ?? {};
  const access: [PanelField, string][] = [
    ["urbanPct", "Live in towns and cities"],
    ["internetPct", "Use the internet"],
    ["electricityAccess", "Have electricity"],
    ["safeWater", "Safely managed water"],
    ["safeSanitation", "Safely managed sanitation"],
    ["literacy", "Adults who can read"],
    ["upperSecondaryPct", "Finished upper secondary school"],
    ["parliamentFemale", "Seats in parliament held by women"],
  ];
  const accessRows = access.flatMap(([f, label]) => (panels[f] ? [{ f, label, ...panels[f]! }] : []));
  const ages = (["age0to14", "age15to64", "age65up"] as const).map((f, i) => ({ f, label: ["Under 15", "15 to 64", "65 and over"][i], fig: panels[f], color: INK[i] }));
  const place = ranked.findIndex((r) => r.code === code);
  const panelSources = [...new Set([...accessRows.map((r) => r.s ?? "wb"), ...ages.flatMap((a) => (a.fig ? [a.fig.s ?? "wb"] : []))])].map((s) => PANEL_SOURCES[s as keyof typeof PANEL_SOURCES]);
  const kpis: [string, Measured | undefined, (v: number) => string][] = [
    ["People", ind.population, people],
    ["GDP", ind.gdp, usd],
    ["GDP a head", ind.gdpPerCapita, (v) => `$${Math.round(v).toLocaleString("en-US")}`],
    ["Growth", ind.gdpGrowth, (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`],
    ["Life expectancy", ind.lifeExpectancy, (v) => `${v.toFixed(1)} yrs`],
    ["Inflation", ind.inflationRate, (v) => `${v.toFixed(1)}%`],
  ];
  const kpiSources = [...new Map(kpis.flatMap(([, m]) => (m ? [m.s ? COUNTRY_INDICATOR_FALLBACKS[m.s] : { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url }] : [])).map((s) => [s.label, s])).values()];
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  const tip = { contentStyle: { background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }, labelStyle: { color: t.headText }, itemStyle: { color: t.headText } };

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
        <h2 className="text-lg font-bold font-sans" style={{ color: t.headText }}>
          {name}
        </h2>
        <span className="text-[11px] font-sans" style={{ color: t.mutedText }}>
          its own figures, picked on the map · pick another country to fill the panels with its own
        </span>
      </div>

      {/* Its headline figures, a tile each. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(([label, m, fmt]) => (
          <div key={label} className="rounded-xl px-3.5 py-3 min-w-0" style={{ background: t.cardBg, border: t.cardBorder }}>
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
              {label}
            </p>
            <p className="text-lg font-bold font-mono leading-tight mt-1" style={{ color: t.headText }}>
              {m ? fmt(m.v) : "Not held"}
            </p>
            {m && (
              <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                {m.y}
              </p>
            )}
          </div>
        ))}
      </div>
      {kpiSources.length > 0 && <SourceLink sources={kpiSources} className="-mt-1 px-1" />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <Panel t={t} title="GDP, year by year" meta={gdp.length ? `current US$ · ${gdp[0].year}–${gdp[gdp.length - 1].year}` : undefined}>
          {gdp.length > 1 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={gdp} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`${id}-gdp`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INK[0]} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={INK[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={t.gridLine} />
                  <XAxis dataKey="year" {...axis} />
                  <YAxis {...axis} width={44} tickFormatter={(v: number) => usd(v)} domain={["auto", "auto"]} />
                  <Tooltip {...tip} formatter={(v: number) => [usd(v), "GDP"]} />
                  <Area type="monotone" dataKey="gdp" stroke={INK[0]} strokeWidth={2} fill={`url(#${id}-gdp)`} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
              <SourceLink sources={[GDP_HISTORY_SOURCE]} />
            </>
          ) : (
            <None t={t}>No GDP series is held for {name}.</None>
          )}
        </Panel>

        <Panel t={t} title="Change on the year before" meta="GDP in current US$, %">
          {change.length ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={change} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={t.gridLine} vertical={false} />
                  <XAxis dataKey="year" {...axis} />
                  <YAxis {...axis} width={36} tickFormatter={(v: number) => `${Math.round(v)}%`} />
                  <Tooltip {...tip} formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(1)}%`, "on the year before"]} />
                  <Bar dataKey="pct" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                    {change.map((r) => (
                      <Cell key={r.year} fill={r.pct >= 0 ? INK[1] : INK[4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                Worked out here from the World Bank's GDP in current dollars: it moves with prices and the dollar, and is not real growth.
              </p>
            </>
          ) : (
            <None t={t}>Not enough years of GDP are held to show a change.</None>
          )}
        </Panel>

        <Panel t={t} title="What its government spends on" meta={budget ? `share of outlays · ${budget.y}` : undefined}>
          {slices.length ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-[130px] h-[130px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={slices} dataKey="v" nameKey="name" innerRadius={34} outerRadius={60} stroke="none" isAnimationActive={false}>
                        {slices.map((s) => (
                          <Cell key={s.name} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tip} formatter={(v: number, k: string) => [`${v.toFixed(1)}%`, k]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex flex-col gap-1 min-w-0 flex-1">
                  {[...slices].sort((a, b) => b.v - a.v).slice(0, 6).map((s) => (
                    <li key={s.name} className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} aria-hidden />
                      <span className="text-[10px] font-sans truncate flex-1" style={{ color: t.bodyText }}>
                        {s.name}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: t.headText }}>
                        {s.v.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                {budget!.basis === "general" ? "All levels of government" : "The central government only"}
                {budget!.spendingPctGdp !== undefined ? `, spending ${budget!.spendingPctGdp}% of GDP` : ""}.
              </p>
              <SourceLink sources={[BUDGET_SOURCE]} />
            </>
          ) : (
            <None t={t}>The IMF publishes no spending by function for {name}.</None>
          )}
        </Panel>

        <Panel t={t} title="Tax revenue against the world's" meta="% of GDP">
          {taxRows.length > 1 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={taxRows} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    {[
                      ["own", INK[5]],
                      ["world", INK[3]],
                    ].map(([k, c]) => (
                      <linearGradient key={k} id={`${id}-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke={t.gridLine} />
                  <XAxis dataKey="year" {...axis} minTickGap={18} />
                  <YAxis {...axis} width={32} tickFormatter={(v: number) => `${Math.round(v)}%`} domain={["auto", "auto"]} />
                  <Tooltip {...tip} formatter={(v: number, k: string) => [`${v.toFixed(1)}%`, k === "own" ? name : "The world"]} />
                  <Area type="monotone" dataKey="world" stroke={INK[3]} strokeWidth={1.5} fill={`url(#${id}-world)`} connectNulls isAnimationActive={false} />
                  <Area type="monotone" dataKey="own" stroke={INK[5]} strokeWidth={2} fill={`url(#${id}-own)`} connectNulls isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-[10px] font-sans" style={{ color: t.mutedText }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5" style={{ background: INK[5] }} aria-hidden /> {name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5" style={{ background: INK[3] }} aria-hidden /> The world
                </span>
              </div>
              <SourceLink sources={[TAX_HISTORY_SOURCES.revenue]} />
            </>
          ) : (
            <None t={t}>No series of tax revenue is held for {name}.</None>
          )}
        </Panel>

        <Panel t={t} title="The basics, and who has them" meta="% of people">
          {accessRows.length ? (
            <ul className="flex flex-col gap-2">
              {accessRows.map((r, i) => (
                <li key={r.f} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 items-center">
                  <span className="text-[11px] font-sans truncate" style={{ color: t.bodyText }}>
                    {r.label}
                  </span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: t.headText }}>
                    {r.v.toFixed(1)}%<span className="font-normal" style={{ color: t.mutedText }}> · {r.y}</span>
                  </span>
                  <span className="col-span-2 h-1.5 rounded-full overflow-hidden" style={{ background: t.gridLine }} aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${Math.min(100, r.v)}%`, background: INK[i % INK.length] }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <None t={t}>None of these figures is held for {name}.</None>
          )}
        </Panel>

        <Panel t={t} title="Who lives there, by age" meta="% of people">
          {ages.some((a) => a.fig) ? (
            <>
              <div className="flex h-5 rounded-full overflow-hidden" role="img" aria-label={ages.map((a) => `${a.label} ${a.fig ? a.fig.v.toFixed(1) + "%" : "not held"}`).join(", ")}>
                {ages.map((a) => (a.fig ? <span key={a.f} style={{ width: `${a.fig.v}%`, background: a.color }} /> : null))}
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {ages.map((a) => (
                  <li key={a.f}>
                    <p className="text-[10px] font-sans inline-flex items-center gap-1.5" style={{ color: t.mutedText }}>
                      <span className="w-2 h-2 rounded-sm" style={{ background: a.color }} aria-hidden />
                      {a.label}
                    </p>
                    <p className="text-sm font-bold font-mono" style={{ color: t.headText }}>
                      {a.fig ? `${a.fig.v.toFixed(1)}%` : "Not held"}
                    </p>
                    {a.fig && (
                      <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                        {a.fig.y}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: t.gridLine }}>
                {(
                  [
                    ["lifeExpMale", "Life expectancy, men", "yrs"],
                    ["lifeExpFemale", "Life expectancy, women", "yrs"],
                    ["medianAge", "Median age", "yrs"],
                  ] as [PanelField, string, string][]
                ).map(([f, label, unit]) => (
                  <div key={f}>
                    <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                      {label}
                    </p>
                    <p className="text-sm font-bold font-mono" style={{ color: t.headText }}>
                      {panels[f] ? `${panels[f]!.v.toFixed(1)} ${unit}` : "Not held"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <None t={t}>No age figures are held for {name}.</None>
          )}
          {panelSources.length > 0 && <SourceLink sources={panelSources} />}
        </Panel>
      </div>

      {/* Where it stands on the map's measure: every country with a figure, highest first, it marked. */}
      <Panel t={t} title={`Where ${name} stands · ${measure.label}`} meta={place >= 0 ? `${place + 1} of ${ranked.length}, highest first · worked out here` : `no figure held for ${name}`}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={ranked} margin={{ top: 4, right: 6, left: 0, bottom: 0 }} barCategoryGap={1}>
            <CartesianGrid stroke={t.gridLine} vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis {...axis} width={40} tickFormatter={(v: number) => measure.fmt(v)} />
            <Tooltip {...tip} formatter={(v: number, _k: string, p: { payload?: Ranked }) => [`${measure.fmt(v)} · ${p.payload?.y ?? ""}`, measure.label]} />
            <Bar dataKey="v" isAnimationActive={false}>
              {ranked.map((r) => (
                <Cell key={r.code} fill={measure.color} fillOpacity={r.code === code ? 1 : 0.35} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
          Each bar a country, {measure.unit}; {name}'s is the bright one. Pick another measure on the map to rank them on it.
        </p>
      </Panel>
    </div>
  );
}
