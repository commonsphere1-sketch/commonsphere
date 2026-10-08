/**
 * The Dashboard's US States card: the ten largest state economies, and for
 * the one that is open, how its people live.
 *
 * It is laid out as the Cities card beside it is - a chart of the ten, a row
 * for each, the open one's figures as bars, three figures read off all
 * fifty - so the two stand at the same height. One state is open at a time.
 *
 * Every figure is the state's own, from stateIndicators.ts: the Bureau of
 * Economic Analysis for output and personal income, the Bureau of Labor
 * Statistics for unemployment, the Census Bureau for people, incomes,
 * housing, schooling and the journey to work, each with its year. A bar for
 * a share is out of 100; any other is on the scale of the highest of the
 * fifty states, so a bar's length says where the state stands among them.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MapTrifold } from "@phosphor-icons/react";
import { STATE_INDICATORS, STATE_SOURCES, type StateIndicators } from "../data/stateIndicators";
import { usStatesData } from "../data/statesData";
import { Card, Caret, Go, Head, Kicker } from "./DashboardCitiesSectors";
import { tooltipStyle, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const COLOR = "#3b82f6";
const SHOWN = 10;
/** A state's output, held in billions of dollars. */
const output = (bn: number) => (bn >= 1000 ? `$${(bn / 1000).toFixed(1)}T` : `$${bn.toFixed(0)}B`);
const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const people = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US"));
const poor = (m: StateIndicators) => m.poverty.groups.find((g) => g.label === "Below poverty line")?.pct;

type Fact = { label: string; value: string; sub: string; /** How far along its scale, 0 to 100. */ bar: number };
/** The measures given for the open state: what each is read from, how it is printed, and whether it is a share. */
const MEASURES: { label: string; unit: string; get: (m: StateIndicators) => number | undefined; year: (m: StateIndicators) => string; print: (v: number) => string; share?: boolean }[] = [
  { label: "People", unit: "residents", get: (m) => m.population.v, year: (m) => m.population.y, print: people },
  { label: "Median age", unit: "years", get: (m) => m.medianAge.v, year: (m) => m.medianAge.y, print: (v) => `${v}` },
  { label: "Median household income", unit: "a year", get: (m) => m.medianIncome.v, year: (m) => m.medianIncome.y, print: usd },
  { label: "Personal income per person", unit: "a year", get: (m) => m.averageIncome.v, year: (m) => m.averageIncome.y, print: usd },
  { label: "Below the poverty line", unit: "of people", get: poor, year: (m) => m.poverty.y, print: (v) => `${v}%`, share: true },
  { label: "Bachelor's degree or higher", unit: "of people 25 and over", get: (m) => m.education.bachelorsOrHigherPct, year: (m) => m.education.y, print: (v) => `${v}%`, share: true },
  { label: "Median home value", unit: "owner-occupied homes", get: (m) => m.housing.medianHomeValue, year: (m) => m.housing.y, print: usd },
  { label: "Median rent", unit: "gross rent a month", get: (m) => m.housing.medianRent, year: (m) => m.housing.y, print: usd },
  { label: "Homes lived in by their owner", unit: "of occupied homes", get: (m) => m.housing.homeOwnershipPct, year: (m) => m.housing.y, print: (v) => `${v}%`, share: true },
  { label: "Average journey to work", unit: "one way", get: (m) => m.commute.meanCommuteMin, year: (m) => m.commute.y, print: (v) => `${v} min` },
];
/** The highest of the fifty states on each measure that is not a share: what its bars are drawn against. */
const HIGHEST = MEASURES.map((x) => Math.max(0, ...usStatesData.flatMap((s) => (STATE_INDICATORS[s.id] ? [x.get(STATE_INDICATORS[s.id]) ?? 0] : []))));

function factsOf(id: string): Fact[] {
  const m = STATE_INDICATORS[id];
  if (!m) return [];
  return MEASURES.flatMap((x, i) => {
    const v = x.get(m);
    if (v == null || !Number.isFinite(v)) return [];
    const scale = x.share ? 100 : HIGHEST[i];
    return [{ label: x.label, value: x.print(v), sub: `${x.unit} · ${x.year(m)}`, bar: scale > 0 ? Math.min(100, (100 * v) / scale) : 0 }];
  });
}

export function StatesContainer() {
  const t = useTokens();
  const navigate = useNavigate();
  const top = useMemo(() => [...usStatesData].sort((a, b) => b.gdp - a.gdp).slice(0, SHOWN), []);
  // The states with the lowest and the highest unemployment rate, as the BLS has them.
  const jobs = useMemo(() => {
    const byRate = [...usStatesData].sort((a, b) => a.unemploymentRate - b.unemploymentRate);
    return { low: byRate[0], high: byRate[byRate.length - 1] };
  }, []);
  // One state is open at a time: the first, until another is chosen.
  const [open, setOpen] = useState(top[0]?.id);
  const track = t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)";
  const years = top[0].figureYears;
  const chart = top.map((s) => ({ name: s.abbreviation, full: s.name, gdp: Number((s.gdp / 1000).toFixed(2)) }));
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false };
  return (
    <Card t={t}>
      <Head t={t} icon={<MapTrifold size={16} weight="fill" />} label="US States" badge={`${usStatesData.length} states`} color={COLOR} cta="All States" to="/dashboard/states" />

      <Kicker t={t}>Output · $ trillions · {years?.gdp}</Kicker>
      <div role="img" aria-label={`The ten largest state economies by GDP, ${years?.gdp}: ${top.map((s) => `${s.name} ${output(s.gdp)}`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chart} margin={{ top: 2, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} vertical={false} />
            <XAxis dataKey="name" {...axis} interval={0} />
            <YAxis {...axis} />
            <Tooltip {...tooltipStyle(t)} cursor={{ fill: t.tile }} formatter={(v: number) => [`$${v}T`, "GDP"]} labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ""} />
            <Bar dataKey="gdp" fill={COLOR} radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SourceLink sources={[{ label: STATE_SOURCES.bea.label, url: STATE_SOURCES.bea.url }]} className="mt-1 mb-1" />

      <div className="flex flex-col flex-1 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        <Kicker t={t}>
          The ten largest · GDP, {years?.gdp} · unemployment, {years?.unemploymentRate} · choose one for how its people live
        </Kicker>
        {top.map((s, i) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="py-2" style={{ borderBottom: i < top.length - 1 ? `1px solid ${t.gridLine}` : "none" }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(s.id)} className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity cursor-pointer">
                <span className="text-[10px] font-mono font-bold w-7 shrink-0 text-center rounded-md py-0.5" style={{ background: t.isLight ? "rgba(59,130,246,0.1)" : "rgba(147,197,253,0.1)", color: t.isLight ? COLOR : "#93c5fd" }}>
                  {s.abbreviation}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                    {s.name}
                  </span>
                  <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                    {s.capital} · unemployment {s.unemploymentRate}%
                  </span>
                </span>
                {/* On the scale of the largest state: a bar's length is its GDP. */}
                <span className="w-12 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: track }} aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (100 * s.gdp) / top[0].gdp)}%`, background: COLOR }} />
                </span>
                <span className="text-[11px] font-mono font-semibold text-right shrink-0 w-14" style={{ color: t.headText }}>
                  {output(s.gdp)}
                </span>
                <Caret open={isOpen} color={t.mutedText} />
              </button>
              {isOpen && (
                <div className="pl-9 mt-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
                    How people live · {s.name}'s own figures
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-x-6 gap-y-2">
                    {factsOf(s.id).map((f) => (
                      <div key={f.label} className="min-w-0" title={`${f.label}: ${f.value} · ${f.sub}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-sans flex-1 min-w-0 truncate" style={{ color: t.bodyText }}>
                            {f.label}
                          </span>
                          <span className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: track }} aria-hidden>
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, f.bar)}%`, background: COLOR }} />
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-right shrink-0 min-w-[4.5rem]" style={{ color: t.headText }}>
                            {f.value}
                          </span>
                        </div>
                        <p className="text-[9px] font-mono leading-snug truncate" style={{ color: t.mutedText }}>
                          {f.sub}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Go color={COLOR} onClick={() => navigate(`/dashboard/states?open=${s.id}`)}>
                      Open {s.name}
                    </Go>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Three figures read off the fifty states. */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
        {[
          { label: "Largest economy", value: output(top[0].gdp), note: top[0].name, color: "#3b82f6" },
          { label: "Lowest unemployment", value: `${jobs.low.unemploymentRate}%`, note: jobs.low.name, color: "#10b981" },
          { label: "Highest unemployment", value: `${jobs.high.unemploymentRate}%`, note: jobs.high.name, color: "#f59e0b" },
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
        Every figure is the state's own, for the year beside it. A bar for a share is out of 100; any other is on the scale of the highest of the fifty states, so its length
        says where the state stands among them. The ten largest by output, of {usStatesData.length}; every figure for each is in its window.
      </p>
      <SourceLink
        sources={[STATE_SOURCES.bea, STATE_SOURCES.bls, STATE_SOURCES.population, STATE_SOURCES.acs].map((s) => ({ label: s.label, url: s.url }))}
        className="mt-1"
      />
    </Card>
  );
}
