/**
 * What fills the Worldview page under its map when a country is picked on it:
 * the country's own figures, set out as a mosaic of panels after the
 * reference design the page follows - its headline figures, its GDP year by
 * year and the change on each year before, its tax revenue against the
 * world's, what its government spends by function, how many of its people
 * have the basics, and who lives there by age. (A panel of where it stood
 * among every country on five measures was taken off, as asked.)
 *
 * Every figure is its publisher's, read from data the site already holds,
 * with its year and its source under its panel: the World Bank's indicators
 * and GDP, the IMF's spending by function, the World Bank's tax revenue. A
 * change on the year before and a rank are worked out here, and say so. A
 * panel the country has no figures for says so and is not filled.
 *
 * Under the charts, every other figure the site holds for the country, by
 * subject - people, health, schooling, work and money, what it makes, its
 * connections, its government and standing, who comes and goes, and its tax
 * rates - each with its year and its publisher, as asked: the page is about
 * the place picked on the map.
 */
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COUNTRY_INDICATORS, COUNTRY_INDICATORS_SOURCE, COUNTRY_INDICATOR_FALLBACKS, type Measured } from "../data/countryIndicators";
import { GDP_HISTORY, GDP_HISTORY_SOURCE } from "../data/gdpHistory";
import { TAX_HISTORY, TAX_HISTORY_SOURCES, TAX_REVENUE_WORLD } from "../data/taxHistory";
import { BUDGET_DIVISIONS, BUDGET_SOURCE, COUNTRY_BUDGET } from "../data/countryBudget";
import { COUNTRY_PANELS, PANEL_SOURCES, type PanelField } from "../data/countryPanels";
import { useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import { SlimColumns, gradId } from "./SlimBars";
import CountryFigures, { INK, None, Panel } from "./CountryFigures";

const usd = (b: number) => (b >= 1000 ? `$${(b / 1000).toFixed(2)}T` : b >= 1 ? `$${b.toFixed(b >= 100 ? 0 : 1)}B` : `$${Math.round(b * 1000)}M`);
const people = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US"));

export type Ranked = { name: string; code: string; v: number; y: string };
/** A measure, and every country with a figure on it, highest first. */
export type Standing = { id: string; label: string; unit: string; color: string; fmt: (v: number) => string; source: { label: string; url: string }; ranked: Ranked[] };



/** A place's headline figures, for the map card's column: each with its year, or not held; and whose they are. */
export function headlineOf(code: string): { rows: { label: string; text: string; y?: string }[]; sources: { label: string; url: string }[] } {
  const ind = COUNTRY_INDICATORS[code] ?? {};
  const hdi = COUNTRY_PANELS[code.toLowerCase()]?.hdi;
  const kpis: [string, Measured | undefined, (v: number) => string][] = [
    ["People", ind.population, people],
    ["GDP", ind.gdp, usd],
    ["GDP a head", ind.gdpPerCapita, (v) => `$${Math.round(v).toLocaleString("en-US")}`],
    ["Growth", ind.gdpGrowth, (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`],
    ["Life expectancy", ind.lifeExpectancy, (v) => `${v.toFixed(1)} yrs`],
    ["Inflation", ind.inflationRate, (v) => `${v.toFixed(1)}%`],
    ["Unemployment", ind.unemploymentRate, (v) => `${v.toFixed(1)}%`],
  ];
  const rows = kpis.map(([label, m, fmt]) => (m ? { label, text: fmt(m.v), y: m.y } : { label, text: "Not held" }));
  if (hdi) rows.push({ label: "Human development", text: hdi.v.toFixed(3), y: hdi.y });
  const sources = [...new Map(kpis.flatMap(([, m]) => (m ? [m.s ? COUNTRY_INDICATOR_FALLBACKS[m.s] : { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url }] : [])).map((s) => [s.label, s])).values()];
  if (hdi) sources.push(PANEL_SOURCES[(hdi.s ?? "hdr") as keyof typeof PANEL_SOURCES]);
  return { rows, sources };
}
export default function CountryDashboard({ code, name }: { code: string; name: string }) {
  const t = useTokens();
  const id = useId().replace(/:/g, "");
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
  const panelSources = [...new Set([...accessRows.map((r) => r.s ?? "wb"), ...ages.flatMap((a) => (a.fig ? [a.fig.s ?? "wb"] : []))])].map((s) => PANEL_SOURCES[s as keyof typeof PANEL_SOURCES]);
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  const tip = { contentStyle: { background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }, labelStyle: { color: t.headText }, itemStyle: { color: t.headText } };

  return (
    <div id="country-figures" className="scroll-mt-36 flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
        <h2 className="text-lg font-bold font-sans" style={{ color: t.headText }}>
          {name}
        </h2>
        <span className="text-[11px] font-sans" style={{ color: t.mutedText }}>
          its own figures, picked on the map - its headline figures are beside the map · pick another country to fill the panels with its own
        </span>
      </div>


      {/* Three across on a wide screen, two on a middling one; a panel with nothing held is left out, and a row with fewer widens them to fill it. */}
      <div className="flex flex-wrap gap-3 items-stretch">
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
              <SlimColumns label={`${name}'s GDP in current dollars, the change on each year before`} rows={change.map((r) => ({ key: String(r.year), label: String(r.year), v: r.pct }))} fmt={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`} up={INK[1]} down={INK[4]} />
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
                      <defs>
                        {[...new Set(slices.map((s) => s.color))].map((c) => (
                          <linearGradient key={c} id={gradId(c)} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity={0.55} />
                            <stop offset="100%" stopColor={c} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={[{ v: 1 }]} dataKey="v" innerRadius={47} outerRadius={60} fill={t.gridLine} stroke="none" isAnimationActive={false} tooltipType="none" />
                      <Pie data={slices} dataKey="v" nameKey="name" innerRadius={47} outerRadius={60} paddingAngle={2.5} cornerRadius={3} stroke="none" isAnimationActive={false}>
                        {slices.map((s) => (
                          <Cell key={s.name} fill={`url(#${gradId(s.color)})`} />
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
                  <span className="col-span-2 h-2 rounded-full overflow-hidden" style={{ background: t.gridLine }} aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${Math.min(100, r.v)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${INK[i % INK.length]} 35%, transparent), ${INK[i % INK.length]})` }} />
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
              <div className="flex h-2.5 gap-[3px]" role="img" aria-label={ages.map((a) => `${a.label} ${a.fig ? a.fig.v.toFixed(1) + "%" : "not held"}`).join(", ")}>
                {ages.map((a) => (a.fig ? <span key={a.f} className="rounded-full" style={{ width: `${a.fig.v}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${a.color} 35%, transparent), ${a.color})` }} /> : null))}
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

      {/* Every subject the site holds official figures on for it, as charts of their own kinds, as asked. */}
      <CountryFigures code={code} name={name} />
    </div>
  );
}
