/**
 * The Trends & Projections desk: every projection the site holds, in one
 * panel - on the Dashboard and at the head of the Trends page.
 *
 * What it replaces. The Dashboard's panel of this name was typed by hand:
 * sector "outlooks" with a "confidence" beside each, five risk scenarios with
 * a probability apiece, "live macro signals" that were not live, and five
 * countries' GDP for 2028. No body publishes any of those. This is built only
 * on projections that are published, each by the body that makes it:
 *
 *   IMF, World Economic Outlook    the economy, to five years out: output,
 *                                  growth, prices, debt - the world, its two
 *                                  halves and every economy (projections.ts)
 *   UN, World Population Prospects people to 2100, with the UN's own low and
 *                                  high variants (projections.ts)
 *   U.S. EIA, International        the world's electricity by type in 2050:
 *     Energy Outlook               its Reference case, and the lowest and
 *                                  highest of its seven cases (renewables.ts)
 *
 * Two tabs are trends, not projections, because no body projects them:
 * research and discovery (what the world spends on research, its researchers,
 * its papers and patents) and technology (who is online, the robots at work,
 * what is put into AI, electric cars). Each is the world's measured series to
 * its publisher's latest year (worldview.ts), drawn solid throughout, and the
 * tab says there is no projection to show.
 *
 * How it reads. A line is solid over the years its publisher estimates and
 * dashed over the years it projects, and the projected years are washed; a
 * table gives the same series to the figure, year by year. A percentage
 * change, a share of a total and a rank are worked out here from two
 * published figures of one source, and the panel says so where it gives one.
 * There is no probability and no confidence anywhere on it: no publisher
 * gives one, and the scenarios shown are the publishers' own.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, ChartLineUp, Cpu, Flask, Globe, Lightning, Minus, Target, TrendUp, Users, X } from "@phosphor-icons/react";
import { POPULATION_OUTLOOK, POPULATION_VARIANTS, PROJECTIONS_RETRIEVED, PROJECTION_SOURCES, WEO_COUNTRIES, WEO_GROUPS, type CountryOutlook, type Point } from "../data/projections";
import { RENEWABLE_OUTLOOK, type OutlookRow } from "../data/renewables";
import { WORLD, type WorldIndicator } from "../data/worldview";
import { usdFromBillions } from "../lib/money";
import { Label, useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

// ── The publishers, and the years each looks to ─────────────────────────────

const WEO = PROJECTION_SOURCES.weo;
const WPP = PROJECTION_SOURCES.wpp;
const EIA = RENEWABLE_OUTLOOK;
const NOW = new Date().getFullYear();
/** The IMF's first projected year, its last, and the last year it estimates. */
const FIRST = WEO.firstProjected;
const END = WEO.lastYear;
const BASE = FIRST - 1;
const UN_END = 2100;

const ACCENT = "#6366f1";
/** The world and the IMF's two halves of it, each with its colour: three of the palette the validator passed. */
const GROUPS = [
  { key: "world", label: "World", color: "#2563eb" },
  { key: "advanced", label: "Advanced economies", color: "#0d9488" },
  { key: "emerging", label: "Emerging and developing", color: "#d97706" },
] as const;
/** The colours economies take when set side by side, in the order they are picked. */
const PICK_COLORS = ["#2563eb", "#d97706", "#0d9488", "#c026d3", "#65a30d"];
const UP = "#10b981";
const DOWN = "#ef4444";

const at = (s: Point[] | undefined, year: number) => s?.find(([y]) => y === year)?.[1];
const lastOf = (s: Point[]) => s[s.length - 1];
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}`;
const people = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}bn` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : Math.round(n).toLocaleString("en-US"));
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const flagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

type MeasureKey = "gdp" | "growth" | "inflation" | "debt" | "unemployment";
const MEASURES: Record<MeasureKey, { label: string; unit: string; fmt: (v: number) => string; tick: (v: number) => string; /** A change between two years: a percentage of the earlier for money, points for a rate. */ points: boolean }> = {
  gdp: { label: "GDP", unit: "current US dollars", fmt: (v) => usdFromBillions(v), tick: (v) => (v === 0 ? "$0" : v >= 1000 ? `$${Number((v / 1000).toFixed(1))}T` : `$${Math.round(v)}B`), points: false },
  growth: { label: "Real growth", unit: "real GDP, % a year", fmt: (v) => `${signed(v)}%`, tick: (v) => `${v}%`, points: true },
  inflation: { label: "Inflation", unit: "consumer prices, % a year", fmt: (v) => `${v.toFixed(1)}%`, tick: (v) => `${v}%`, points: true },
  debt: { label: "Government debt", unit: "% of GDP", fmt: (v) => `${v.toFixed(1)}%`, tick: (v) => `${v}%`, points: true },
  unemployment: { label: "Unemployment", unit: "% of the labour force", fmt: (v) => `${v.toFixed(1)}%`, tick: (v) => `${v}%`, points: true },
};

/** The wash over the years that are projections. */
const aheadOf = (t: Tokens) => (t.isLight ? "rgba(99,102,241,0.07)" : "rgba(129,140,248,0.10)");
const axisOf = (t: Tokens) => ({ tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false });

// ── Pieces ──────────────────────────────────────────────────────────────────

function Note({ t, children }: { t: Tokens; children: ReactNode }) {
  return (
    <p className="text-[10px] font-sans leading-relaxed" style={{ color: t.mutedText }}>
      {children}
    </p>
  );
}

/** A block of the desk with its own heading. */
function Block({ t, title, kicker, children, className = "" }: { t: Tokens; title: string; kicker?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-3 min-w-0 ${className}`} style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
      <div>
        <h3 className="text-[13px] font-bold font-sans leading-snug" style={{ color: t.headText }}>
          {title}
        </h3>
        {kicker && (
          <p className="text-[9px] font-mono uppercase tracking-widest mt-1 leading-snug" style={{ color: t.mutedText }}>
            {kicker}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/** A figure as a tile; as a button where picking it changes what the chart shows. */
function Figure({ t, label, value, sub, change, on, onPick, color = ACCENT }: { t: Tokens; label: string; value: string; sub?: string; change?: { text: string; dir?: "up" | "down" } | null; on?: boolean; onPick?: () => void; color?: string }) {
  const body = (
    <>
      <span className="block text-[9px] font-mono uppercase tracking-widest leading-snug" style={{ color: on ? color : t.mutedText }}>
        {label}
      </span>
      <span className="block text-lg font-bold font-mono leading-tight mt-1" style={{ color: t.headText }}>
        {value}
      </span>
      {sub && (
        <span className="block text-[9px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
          {sub}
        </span>
      )}
      {change && (
        <span className="flex items-center gap-1 text-[10px] font-mono leading-snug mt-1" style={{ color: t.bodyText }}>
          {change.dir === "up" ? <ArrowUp size={9} weight="bold" aria-hidden /> : change.dir === "down" ? <ArrowDown size={9} weight="bold" aria-hidden /> : null}
          {change.text}
        </span>
      )}
    </>
  );
  const style = { background: on ? color + (t.isLight ? "10" : "1c") : t.tile, border: `1px solid ${on ? color + "66" : t.gridLine}` };
  return onPick ? (
    <button type="button" onClick={onPick} aria-pressed={on} className="rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer min-w-0" style={style}>
      {body}
    </button>
  ) : (
    <div className="rounded-xl px-3 py-2.5 min-w-0" style={style}>
      {body}
    </div>
  );
}

/** A choice among a few: chips, one pressed. */
function Chips<T extends string>({ t, value, onChange, options, label }: { t: Tokens; value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            className="text-[10px] font-sans font-semibold px-2 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer"
            style={{ background: on ? ACCENT + "22" : t.tile, border: `1px solid ${on ? ACCENT + "66" : t.gridLine}`, color: on ? ACCENT : t.headText }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type LineSpec = { key: string; label: string; color: string; series: Point[] };

/** What a year's hover says: each line once, and whether the year is a projection. */
function OutlookTip({ active, payload, label, lines, fmt, split }: { active?: boolean; payload?: { dataKey?: string | number; value?: number | null }[]; label?: string; lines: LineSpec[]; fmt: (v: number) => string; split: number }) {
  if (!active || !payload?.length) return null;
  const seen = new Set<string>();
  const rows = payload.flatMap((p) => {
    const key = String(p.dataKey).slice(0, -1);
    const line = lines.find((l) => l.key === key);
    if (!line || p.value == null || seen.has(key)) return [];
    seen.add(key);
    return [{ line, v: p.value }];
  });
  if (!rows.length) return null;
  return (
    <div className="cs-chart-tip rounded-md p-2 text-[11px] font-mono font-bold">
      <p className="mb-1" style={{ opacity: 0.75 }}>
        {label}
        {Number(label) >= split ? " · projected" : " · estimated"}
      </p>
      {rows.map(({ line, v }) => (
        <p key={line.key} style={{ color: line.color }}>
          {line.label}: {fmt(v)}
        </p>
      ))}
    </div>
  );
}

/**
 * Several series on one axis: solid to where the publisher's estimates end,
 * dashed from there, with the projected years washed. Recharts cannot change
 * a line's stroke part-way, so each series is two keys; the dashed one also
 * carries the last estimate, so the two join.
 */
function OutlookChart({ t, lines, split, fmt, tick, from, height = 250, label }: { t: Tokens; lines: LineSpec[]; split: number; fmt: (v: number) => string; tick: (v: number) => string; from?: number; height?: number; label: string }) {
  const years = [...new Set(lines.flatMap((l) => l.series.map(([y]) => y)))].filter((y) => !from || y >= from).sort((a, b) => a - b);
  if (years.length < 2) return <Note t={t}>The publisher gives no series for this.</Note>;
  const data = years.map((y) => {
    const row: Record<string, string | number | null> = { year: String(y) };
    for (const l of lines) {
      const v = at(l.series, y) ?? null;
      row[`${l.key}A`] = y < split ? v : null;
      row[`${l.key}P`] = y >= split - 1 ? v : null;
    }
    return row;
  });
  const lastYear = years[years.length - 1];
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={t.gridLine} vertical={false} />
          <XAxis dataKey="year" {...axisOf(t)} minTickGap={18} />
          <YAxis {...axisOf(t)} width={50} tickFormatter={tick} domain={["auto", "auto"]} />
          {lastYear >= split && <ReferenceArea x1={String(split)} x2={String(lastYear)} fill={aheadOf(t)} fillOpacity={1} ifOverflow="visible" />}
          {lastYear >= split && years.includes(split) && (
            <ReferenceLine x={String(split)} stroke={t.mutedText} strokeDasharray="2 3" label={{ value: "projected", position: "insideTopLeft", fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }} />
          )}
          <ReferenceLine y={0} stroke={t.gridLine} />
          <Tooltip content={<OutlookTip lines={lines} fmt={fmt} split={split} />} />
          {lines.flatMap((l) => [
            <Line key={`${l.key}A`} type="monotone" dataKey={`${l.key}A`} stroke={l.color} strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key={`${l.key}P`} type="monotone" dataKey={`${l.key}P`} stroke={l.color} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />,
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The lines of a chart, named, each with a figure. */
function Legend({ t, items }: { t: Tokens; items: { color: string; label: string; value?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ background: l.color }} aria-hidden />
          <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            {l.label}
          </span>
          {l.value && (
            <span className="text-[10px] font-mono font-bold" style={{ color: t.headText }}>
              {l.value}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** The same series as the chart, to the figure: a row a line, a column a year, the projected years washed. */
function YearTable({ t, rows, years, split, fmt, caption }: { t: Tokens; rows: { key: string; label: string; color: string; series: Point[] }[]; years: number[]; split: number; fmt: (v: number) => string; caption: string }) {
  const est = years.filter((y) => y < split).length;
  const cell = "px-2 py-1.5 text-[11px] font-mono tabular-nums whitespace-nowrap";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-right" style={{ minWidth: 80 + years.length * 62 }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <td />
            {est > 0 && (
              <th colSpan={est} scope="colgroup" className="px-2 pb-1 text-[9px] font-mono font-normal uppercase tracking-widest text-center" style={{ color: t.mutedText }}>
                Estimated
              </th>
            )}
            {years.length - est > 0 && (
              <th colSpan={years.length - est} scope="colgroup" className="px-2 pb-1 text-[9px] font-mono font-normal uppercase tracking-widest text-center" style={{ color: ACCENT, background: aheadOf(t) }}>
                Projected
              </th>
            )}
          </tr>
          <tr>
            <td />
            {years.map((y) => (
              <th key={y} scope="col" className="px-2 py-1 text-[10px] font-mono font-normal" style={{ color: t.mutedText, background: y >= split ? aheadOf(t) : undefined, borderBottom: `1px solid ${t.gridLine}` }}>
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="py-1.5 pr-3 text-left text-[11px] font-sans font-semibold whitespace-nowrap" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: r.color }} aria-hidden />
                {r.label}
              </th>
              {years.map((y) => {
                const v = at(r.series, y);
                return (
                  <td key={y} className={cell} style={{ color: v === undefined ? t.mutedText : t.headText, background: y >= split ? aheadOf(t) : undefined, borderBottom: `1px solid ${t.gridLine}` }}>
                    {v === undefined ? "—" : fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A range on a shared scale: where a figure starts (solid), where the
 * publisher's central case puts it (paler, behind), and the reach of its
 * other cases as a line across - or, with no start, just the central case
 * as a tick on the line.
 */
function RangeBar({ t, top, base, mid, low, high, color }: { t: Tokens; top: number; base?: number; mid: number; low: number; high: number; color: string }) {
  const at100 = (v: number) => `${Math.max(0, Math.min(100, (100 * v) / top))}%`;
  return (
    <div className="relative h-2.5 rounded-full" style={{ background: t.gridLine }} aria-hidden>
      {base !== undefined && <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at100(mid), background: color, opacity: 0.35 }} />}
      {base !== undefined && <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at100(base), background: color }} />}
      <span className="absolute top-1/2 h-0.5 -translate-y-1/2" style={{ left: at100(low), width: `${Math.max(0.5, (100 * (high - low)) / top)}%`, background: t.headText }} />
      {base === undefined && <span className="absolute -top-0.5 -bottom-0.5 w-1 -ml-0.5 rounded-full" style={{ left: at100(mid), background: color }} />}
    </div>
  );
}

// ── How far each publisher looks ────────────────────────────────────────────

/** The three horizons on one line of years: the IMF's five, EIA's to mid-century, the UN's to the century's end. */
function Horizons({ t }: { t: Tokens }) {
  const from = 2020;
  const span = UN_END - from;
  const x = (year: number) => `${(100 * (year - from)) / span}%`;
  const rows = [
    { who: "IMF", what: "the economy", to: END, start: FIRST, color: "#2563eb", note: `World Economic Outlook, ${WEO.edition}` },
    { who: "U.S. EIA", what: "electricity by type", to: EIA.year, start: EIA.base, color: "#0d9488", note: "International Energy Outlook 2023" },
    { who: "UN", what: "people", to: UN_END, start: WPP.firstProjected, color: "#c026d3", note: `World Population Prospects ${WPP.revision}` },
  ];
  return (
    <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <Label t={t}>How far each projection looks</Label>
        <span className="text-[9px] font-mono" style={{ color: t.mutedText }}>
          read {PROJECTIONS_RETRIEVED}
        </span>
      </div>
      <div className="flex flex-col gap-1.5" role="img" aria-label={`The projections' horizons: ${rows.map((r) => `${r.who}, ${r.what}, from ${r.start} to ${r.to}`).join("; ")}.`}>
        {rows.map((r) => (
          <div key={r.who} className="grid grid-cols-[7.5rem_1fr_3rem] sm:grid-cols-[15rem_1fr_3rem] items-center gap-x-3">
            <span className="min-w-0">
              <span className="block text-[11px] font-sans font-bold leading-tight" style={{ color: t.headText }}>
                {r.who} <span className="font-normal" style={{ color: t.mutedText }}>· {r.what}</span>
              </span>
              <span className="hidden sm:block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                {r.note}
              </span>
            </span>
            <span className="relative h-2 rounded-full" style={{ background: t.gridLine }}>
              <span className="absolute inset-y-0 rounded-full" style={{ left: x(r.start), width: `${(100 * (r.to - r.start)) / span}%`, minWidth: 6, background: r.color }} />
              <span className="absolute -top-1 -bottom-1 w-px" style={{ left: x(NOW), background: t.headText }} />
            </span>
            <span className="text-[11px] font-mono font-bold text-right" style={{ color: t.headText }}>
              {r.to}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[7.5rem_1fr_3rem] sm:grid-cols-[15rem_1fr_3rem] gap-x-3">
          <span />
          <span className="relative h-3">
            {[NOW, 2050, 2075, UN_END].map((y) => (
              <span key={y} className="absolute text-[8px] font-mono -translate-x-1/2 whitespace-nowrap" style={{ left: x(y), color: y === NOW ? t.headText : t.mutedText }}>
                {y === NOW ? `now, ${y}` : y}
              </span>
            ))}
          </span>
          <span />
        </div>
      </div>
    </div>
  );
}

// ── The world economy ───────────────────────────────────────────────────────

type EconomyMeasure = "gdp" | "growth" | "inflation" | "debt";

function EconomyTab({ t }: { t: Tokens }) {
  const [measure, setMeasure] = useState<EconomyMeasure>("gdp");
  const m = MEASURES[measure];
  const world = WEO_GROUPS.world;
  const lines: LineSpec[] = GROUPS.map((g) => ({ key: g.key, label: g.label, color: g.color, series: WEO_GROUPS[g.key][measure] ?? [] })).filter((l) => l.series.length > 1);
  const years = Array.from({ length: END - (BASE - 1) + 1 }, (_, i) => BASE - 1 + i);

  // Each tile: the world's figure, and its change on the IMF's last estimate.
  const tile = (key: EconomyMeasure) => {
    const s = world[key] ?? [];
    const base = at(s, BASE);
    const year = key === "gdp" ? END : FIRST;
    const v = at(s, year);
    if (v === undefined || base === undefined) return null;
    const d = MEASURES[key].points ? v - base : (100 * (v - base)) / base;
    return {
      key,
      label: key === "gdp" ? `World GDP in ${END}` : `${MEASURES[key].label}, ${FIRST}`,
      value: MEASURES[key].fmt(v),
      sub: `IMF projection · ${MEASURES[key].unit}`,
      change: { text: `${signed(d, MEASURES[key].points ? 1 : 0)}${MEASURES[key].points ? " pts" : "%"} on ${BASE} (${MEASURES[key].fmt(base)})`, dir: d > 0.04 ? ("up" as const) : d < -0.04 ? ("down" as const) : undefined },
    };
  };
  const tiles = (["gdp", "growth", "inflation", "debt"] as const).map(tile).filter((x): x is NonNullable<ReturnType<typeof tile>> => !!x);

  // What the selected measure says, read off the three series.
  const adv = WEO_GROUPS.advanced[measure] ?? [];
  const eme = WEO_GROUPS.emerging[measure] ?? [];
  const w = world[measure] ?? [];
  const facts: { label: string; value: string; sub?: string }[] = [];
  if (measure === "gdp") {
    for (const y of [BASE, END]) {
      const total = at(w, y);
      const a = at(adv, y);
      const e = at(eme, y);
      if (total && a !== undefined && e !== undefined) facts.push({ label: `Shares of world GDP, ${y}`, value: `${((100 * a) / total).toFixed(1)}% · ${((100 * e) / total).toFixed(1)}%`, sub: "advanced · emerging and developing" });
    }
    const b = at(w, BASE);
    const e = at(w, END);
    if (b && e) facts.push({ label: `Added between ${BASE} and ${END}`, value: usdFromBillions(e - b), sub: "in current dollars: growth, price rises and exchange rates together" });
  } else {
    const a = at(adv, FIRST);
    const e = at(eme, FIRST);
    if (a !== undefined && e !== undefined) facts.push({ label: `Emerging less advanced, ${FIRST}`, value: `${signed(e - a)} pts`, sub: `${m.fmt(e)} against ${m.fmt(a)}` });
    const end = at(w, END);
    if (end !== undefined) facts.push({ label: `World, ${END}`, value: m.fmt(end), sub: "the last year the IMF projects" });
    if (w.length) {
      const hi = w.reduce((x, y) => (y[1] > x[1] ? y : x));
      const lo = w.reduce((x, y) => (y[1] < x[1] ? y : x));
      facts.push({ label: `World, highest and lowest since ${w[0][0]}`, value: `${m.fmt(hi[1])} · ${m.fmt(lo[1])}`, sub: `${hi[0]} · ${lo[0]}` });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" role="group" aria-label="The measure the chart and the table show">
        {tiles.map((x) => (
          <Figure key={x.key} t={t} label={x.label} value={x.value} sub={x.sub} change={x.change} on={x.key === measure} onPick={() => setMeasure(x.key)} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block t={t} title={`${m.label}: the world and its two halves`} kicker={`${m.unit} · IMF World Economic Outlook, ${WEO.edition} · 2015–${END}`} className="lg:col-span-2">
          <OutlookChart
            t={t}
            lines={lines}
            split={FIRST}
            fmt={m.fmt}
            tick={m.tick}
            from={2015}
            label={`${m.label} for the world, the advanced economies and the emerging and developing economies, 2015 to ${END}. The IMF's estimates run to ${BASE} and its projections from ${FIRST}; the table below has each year.`}
          />
          <Legend t={t} items={lines.map((l) => ({ color: l.color, label: `${l.label}, ${END}`, value: m.fmt(at(l.series, END) ?? lastOf(l.series)[1]) }))} />
        </Block>
        <Block t={t} title="What it says" kicker={`Read off the IMF's series · ${WEO.edition}`}>
          <dl className="flex flex-col">
            {facts.map((f) => (
              <div key={f.label} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <dt className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                  {f.label}
                </dt>
                <dd className="text-sm font-bold font-mono leading-tight mt-0.5" style={{ color: t.headText }}>
                  {f.value}
                </dd>
                {f.sub && (
                  <dd className="text-[9px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
                    {f.sub}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <Note t={t}>
            Estimates to {BASE}, projections from {FIRST}. A projection is the IMF's central case, not a forecast with a probability; it revises the whole series every April and
            October. A share, a gap or an amount added is worked out here from the two figures beside it.
          </Note>
        </Block>
      </div>

      <Block t={t} title={`${m.label}, year by year`} kicker={`${m.unit} · the same series as the chart, to the figure`}>
        <YearTable t={t} rows={lines} years={years} split={FIRST} fmt={m.fmt} caption={`${m.label} by year, ${years[0]} to ${END}, for the world, the advanced economies and the emerging and developing economies`} />
      </Block>
      <SourceLink sources={[WEO]} />
    </div>
  );
}

// ── Countries ───────────────────────────────────────────────────────────────

const ADD = "__add";
const DEFAULT_PICKS = ["USA", "CHN", "IND", "DEU", "JPN"].filter((iso3) => WEO_COUNTRIES.some((c) => c.iso3 === iso3));

function CountriesTab({ t }: { t: Tokens }) {
  const [measure, setMeasure] = useState<MeasureKey>("gdp");
  const [picked, setPicked] = useState<string[]>(DEFAULT_PICKS);
  const m = MEASURES[measure];

  /* The order of the largest economies now and in the last projected year, among those the IMF gives both for. */
  const order = useMemo(() => {
    const both = WEO_COUNTRIES.map((c) => ({ c, now: at(c.gdp, BASE), then: at(c.gdp, END) })).filter((r): r is { c: CountryOutlook; now: number; then: number } => r.now !== undefined && r.then !== undefined);
    const byNow = [...both].sort((a, b) => b.now - a.now).map((r) => r.c.iso3);
    const rows = [...both].sort((a, b) => b.then - a.then).map((r, i) => ({ ...r, rank: i + 1, was: byNow.indexOf(r.c.iso3) + 1 }));
    return { of: both.length, rows: rows.slice(0, 12), top: rows[0]?.then ?? 1 };
  }, []);
  /* Growth projected for the first projected year, both ends of the list. */
  const growth = useMemo(() => {
    const all = WEO_COUNTRIES.map((c) => ({ c, v: at(c.growth, FIRST) }))
      .filter((r): r is { c: CountryOutlook; v: number } => r.v !== undefined)
      .sort((a, b) => b.v - a.v);
    return { fastest: all.slice(0, 6), slowest: all.slice(-6).reverse(), of: all.length };
  }, []);

  const chosen = picked.map((iso3) => WEO_COUNTRIES.find((c) => c.iso3 === iso3)).filter((c): c is CountryOutlook => !!c);
  const lines: LineSpec[] = chosen.map((c, i) => ({ key: c.iso3, label: c.name, color: PICK_COLORS[i % PICK_COLORS.length], series: (c[measure] as Point[] | undefined) ?? [] }));
  const drawn = lines.filter((l) => l.series.length > 1);
  const missing = lines.filter((l) => l.series.length <= 1).map((l) => l.label);
  const years = Array.from({ length: END - (BASE - 1) + 1 }, (_, i) => BASE - 1 + i);
  const options = [{ value: ADD, label: picked.length >= PICK_COLORS.length ? `Remove one to add another` : "Add an economy…" }, ...WEO_COUNTRIES.filter((c) => !picked.includes(c.iso3)).map((c) => ({ value: c.iso3, label: c.name }))];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Block t={t} title={`The largest economies: ${BASE} and ${END}`} kicker={`GDP, current US dollars · IMF · the twelve largest of ${order.of} in ${END}, with where each stood in ${BASE}`} className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 330 }}>
              <caption className="sr-only">
                The twelve largest economies projected for {END}, with each one's GDP in {BASE} and {END}, the change between them, and its place in the order in both years
              </caption>
              <thead>
                <tr>
                  {["", "Economy", `${BASE}`, `${END}`, "Change", `Place in ${BASE}`].map((h, i) => (
                    <th key={i} scope="col" className={`py-1 text-[9px] font-mono font-normal ${i < 2 ? "text-left" : "text-right"} ${i === 5 ? "pl-2" : ""}`} style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.rows.map((r) => {
                  const moved = r.was - r.rank;
                  return (
                    <tr key={r.c.iso3}>
                      <td className="py-1.5 pr-2 text-[11px] font-mono font-bold tabular-nums" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {r.rank}
                      </td>
                      <th scope="row" className="py-1.5 pr-2 text-left" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                        <span className="flex items-center gap-1.5 min-w-0">
                          {r.c.code ? <img src={flagUrl(r.c.code)} alt="" width={16} height={12} loading="lazy" className="rounded-[2px] shrink-0" /> : <span className="w-4 shrink-0" />}
                          <span className="text-[11px] font-sans font-semibold truncate" style={{ color: t.headText }} title={r.c.name}>
                            {r.c.name}
                          </span>
                        </span>
                      </th>
                      <td className="py-1.5 text-right text-[11px] font-mono tabular-nums whitespace-nowrap" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {usdFromBillions(r.now)}
                      </td>
                      <td className="py-1.5 pl-2 text-right text-[11px] font-mono font-bold tabular-nums whitespace-nowrap" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {usdFromBillions(r.then)}
                      </td>
                      <td className="py-1.5 pl-2 text-right text-[11px] font-mono tabular-nums whitespace-nowrap" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {signed((100 * (r.then - r.now)) / r.now, 0)}%
                      </td>
                      <td className="py-1.5 pl-2 text-right text-[11px] font-mono tabular-nums whitespace-nowrap" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          {ordinal(r.was)}
                          {moved > 0 ? <ArrowUp size={9} weight="bold" style={{ color: UP }} aria-label={`up ${moved}`} /> : moved < 0 ? <ArrowDown size={9} weight="bold" style={{ color: DOWN }} aria-label={`down ${-moved}`} /> : <Minus size={9} weight="bold" aria-label="unchanged" />}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Note t={t}>
            The change is from the IMF's {BASE} estimate to its {END} projection in current dollars - growth, price rises and exchange rates together - and the places are counted here
            from its figures. An arrow shows an economy that stands higher or lower in {END} than in {BASE}.
          </Note>
        </Block>

        <Block t={t} title="Set economies side by side" kicker={`${m.label} · ${m.unit} · IMF · ${WEO_COUNTRIES.length} economies to choose from, up to ${PICK_COLORS.length} at once`} className="lg:col-span-3">
          <Chips t={t} value={measure} onChange={setMeasure} label="The measure to compare" options={(Object.keys(MEASURES) as MeasureKey[]).map((id) => ({ id, label: MEASURES[id].label }))} />
          <div className="flex flex-wrap items-center gap-1.5">
            {chosen.map((c, i) => (
              <span key={c.iso3} className="flex items-center gap-1.5 text-[10px] font-sans font-semibold pl-2 pr-1 py-0.5 rounded-full" style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}>
                <span className="w-2 h-2 rounded-full" style={{ background: PICK_COLORS[i % PICK_COLORS.length] }} aria-hidden />
                {c.name}
                <button type="button" onClick={() => setPicked((p) => p.filter((x) => x !== c.iso3))} aria-label={`Remove ${c.name}`} className="p-0.5 rounded-full hover:opacity-70 cursor-pointer" style={{ color: t.mutedText }}>
                  <X size={9} weight="bold" />
                </button>
              </span>
            ))}
            <StyledSelect
              value={ADD}
              onValueChange={(v) => {
                if (v !== ADD && picked.length < PICK_COLORS.length) setPicked((p) => [...p, v]);
              }}
              ariaLabel="Add an economy to the comparison"
              options={options}
              triggerClassName="chip-selected px-2.5 py-1 rounded-full font-medium"
            />
          </div>
          {drawn.length > 0 ? (
            <>
              <OutlookChart
                t={t}
                lines={drawn}
                split={FIRST}
                fmt={m.fmt}
                tick={m.tick}
                height={240}
                label={`${m.label} for ${drawn.map((l) => l.label).join(", ")}, ${drawn[0].series[0][0]} to ${END}. The IMF's projections begin in ${FIRST}; the table below has each year.`}
              />
              <YearTable t={t} rows={drawn} years={years} split={FIRST} fmt={m.fmt} caption={`${m.label} by year for the economies chosen`} />
            </>
          ) : (
            <Note t={t}>Choose an economy to draw its series.</Note>
          )}
          {missing.length > 0 && (
            <Note t={t}>
              The IMF publishes no {m.label.toLowerCase()} series for {missing.join(", ")}.
            </Note>
          )}
        </Block>
      </div>

      <Block t={t} title={`Growth projected for ${FIRST}`} kicker={`Real GDP, % · IMF · the six fastest and six slowest of ${growth.of}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { title: "Fastest", rows: growth.fastest },
            { title: "Slowest", rows: growth.slowest },
          ].map((g) => (
            <div key={g.title} className="min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: t.mutedText }}>
                {g.title}
              </p>
              {g.rows.map(({ c, v }) => (
                <div key={c.iso3} className="flex items-center justify-between gap-2 py-1" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                  <span className="flex items-center gap-1.5 min-w-0">
                    {c.code ? <img src={flagUrl(c.code)} alt="" width={16} height={12} loading="lazy" className="rounded-[2px] shrink-0" /> : <span className="w-4 shrink-0" />}
                    <span className="text-[11px] font-sans font-semibold truncate" style={{ color: t.headText }}>
                      {c.name}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono font-bold tabular-nums shrink-0" style={{ color: v >= 0 ? t.headText : DOWN }}>
                    {signed(v)}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <Note t={t}>Small economies lead both ends: one mine, one harvest or one conflict moves a small economy's year a long way.</Note>
      </Block>
      <SourceLink sources={[WEO]} />
    </div>
  );
}

const ordinal = (n: number) => {
  const v = n % 100;
  return `${n}${v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};

// ── People ──────────────────────────────────────────────────────────────────

const WORLD_POP = POPULATION_OUTLOOK[0];
const POP_PEAK = WORLD_POP.population.reduce((a, b) => (b[1] > a[1] ? b : a));
const POP_COLOR = "#c026d3";

function PeopleTip({ active, payload, label }: { active?: boolean; payload?: { payload?: { v?: number; band?: [number, number] | null } }[]; label?: string }) {
  const row = payload?.[0]?.payload;
  if (!active || !row || row.v == null) return null;
  return (
    <div className="cs-chart-tip rounded-md p-2 text-[11px] font-mono font-bold">
      <p className="mb-1" style={{ opacity: 0.75 }}>
        {label}
        {Number(label) >= WPP.firstProjected ? " · projected" : " · estimated"}
      </p>
      <p style={{ color: POP_COLOR }}>
        {Number(label) >= WPP.firstProjected ? "Medium variant" : "World population"}: {people(row.v)}
      </p>
      {row.band && (
        <p>
          Low to high: {people(row.band[0])} – {people(row.band[1])}
        </p>
      )}
    </div>
  );
}

function PeopleTab({ t }: { t: Tokens }) {
  const pop = WORLD_POP.population;
  const nowYear = at(pop, NOW) !== undefined ? NOW : lastOf(pop.filter(([y]) => y <= NOW))[0];
  const data = pop.map(([y, v]) => {
    const low = at(POPULATION_VARIANTS.low, y);
    const high = at(POPULATION_VARIANTS.high, y);
    return { year: String(y), v, a: y < WPP.firstProjected ? v : null, p: y >= WPP.firstProjected - 1 ? v : null, band: low !== undefined && high !== undefined ? ([low, high] as [number, number]) : null };
  });
  const figure = (label: string, s: Point[], fmt: (v: number) => string) => {
    const now = at(s, nowYear);
    const end = at(s, UN_END);
    const mid = at(s, 2050);
    return now === undefined ? null : { label, value: fmt(now), sub: `UN · ${nowYear}`, change: mid !== undefined && end !== undefined ? { text: `${fmt(mid)} in 2050 · ${fmt(end)} in ${UN_END}` } : null };
  };
  const tiles = [
    { label: `World population, ${nowYear}`, value: people(at(pop, nowYear) ?? 0), sub: "UN · people on 1 July", change: { text: `${people(at(pop, 2050) ?? 0)} in 2050 · ${people(at(pop, UN_END) ?? 0)} in ${UN_END}` } },
    { label: "Its peak", value: `${POP_PEAK[0]}`, sub: "UN medium variant", change: { text: `${people(POP_PEAK[1])} people, then a slow fall` } },
    figure("Median age", WORLD_POP.medianAge, (v) => `${v.toFixed(1)} years`),
    figure("Births per woman", WORLD_POP.fertility, (v) => v.toFixed(2)),
    figure("Life expectancy", WORLD_POP.lifeExpectancy, (v) => `${v.toFixed(1)} years`),
  ].filter((x): x is NonNullable<typeof x> => !!x);

  /* The six regions at three dates, and each one's share of the world's people then - a region over the UN's world total for the same year. */
  const regions = POPULATION_OUTLOOK.slice(1)
    .map((r) => {
      const yr = at(r.population, nowYear) !== undefined ? nowYear : lastOf(r.population.filter(([y]) => y <= nowYear))[0];
      const v = (y: number) => at(r.population, y) ?? 0;
      const share = (y: number) => (100 * v(y)) / (at(pop, y) ?? 1);
      return { name: r.name, yr, now: v(yr), mid: v(2050), end: v(UN_END), shareNow: share(yr), shareEnd: share(UN_END) };
    })
    .sort((a, b) => b.end - a.end);
  const regionTop = Math.max(...regions.flatMap((r) => [r.now, r.mid, r.end]));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {tiles.map((x) => (
          <Figure key={x.label} t={t} label={x.label} value={x.value} sub={x.sub} change={x.change} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Block t={t} title="The world's people, 1950 to 2100" kicker={`People on 1 July · UN World Population Prospects ${WPP.revision} · medium variant, with the low and high variants as a band`} className="lg:col-span-3">
          <div role="img" aria-label={`World population from 1950 to ${UN_END}: ${people(pop[0][1])} in ${pop[0][0]}, ${people(at(pop, nowYear) ?? 0)} in ${nowYear}, a peak of ${people(POP_PEAK[1])} in ${POP_PEAK[0]} and ${people(at(pop, UN_END) ?? 0)} in ${UN_END} on the medium variant. The low and high variants are a band from ${WPP.firstProjected}.`}>
            <ResponsiveContainer width="100%" height={270}>
              <ComposedChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={t.gridLine} vertical={false} />
                <XAxis dataKey="year" {...axisOf(t)} ticks={["1950", "1975", "2000", "2025", "2050", "2075", "2100"]} />
                <YAxis {...axisOf(t)} width={44} tickFormatter={(v: number) => `${(v / 1e9).toFixed(0)}bn`} domain={[0, "auto"]} />
                <ReferenceArea x1={String(WPP.firstProjected)} x2={String(UN_END)} fill={aheadOf(t)} fillOpacity={1} ifOverflow="visible" />
                <ReferenceLine x={String(POP_PEAK[0])} stroke={t.mutedText} strokeDasharray="2 3" label={{ value: `peak ${POP_PEAK[0]}`, position: "top", fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }} />
                <Tooltip content={<PeopleTip />} />
                <Area type="monotone" dataKey="band" stroke="none" fill={POP_COLOR} fillOpacity={0.16} isAnimationActive={false} connectNulls={false} />
                <Line type="monotone" dataKey="a" stroke={POP_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="p" stroke={POP_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <Legend
            t={t}
            items={[
              { color: POP_COLOR, label: `Medium variant, ${UN_END}`, value: people(at(pop, UN_END) ?? 0) },
              { color: POP_COLOR + "55", label: `Low to high, ${UN_END}`, value: `${people(at(POPULATION_VARIANTS.low, UN_END) ?? 0)} – ${people(at(POPULATION_VARIANTS.high, UN_END) ?? 0)}` },
            ]}
          />
          <Note t={t}>
            The UN's estimates run to {WPP.firstProjected - 1} and its projections from {WPP.firstProjected}. The band is its own low and high variants - half a child fewer or more per
            woman than the medium - to which it gives no likelihood.
          </Note>
        </Block>

        <Block t={t} title="Where the people will be" kicker={`The UN's six regions · medium variant · ${nowYear}, 2050 and ${UN_END}`} className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 330 }}>
              <caption className="sr-only">
                Population of the UN's six regions in {nowYear}, 2050 and {UN_END}, and each region's share of the world's people in {nowYear} and {UN_END}
              </caption>
              <thead>
                <tr>
                  {["Region", `${nowYear}`, "2050", `${UN_END}`, "Of the world"].map((h, i) => (
                    <th key={h} scope="col" className={`py-1 text-[9px] font-mono font-normal ${i === 0 ? "text-left" : "text-right pl-2"}`} style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.name}>
                    <th scope="row" className="py-1.5 text-left align-top" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                      <span className="block text-[11px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
                        {r.name}
                      </span>
                      <span className="block h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.gridLine }} aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${(100 * r.end) / regionTop}%`, background: POP_COLOR }} />
                      </span>
                    </th>
                    {[r.now, r.mid, r.end].map((v, i) => (
                      <td key={i} className={`py-1.5 pl-2 text-right text-[11px] font-mono tabular-nums whitespace-nowrap align-top ${i === 2 ? "font-bold" : ""}`} style={{ color: i === 2 ? t.headText : t.bodyText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {people(v)}
                      </td>
                    ))}
                    <td className="py-1.5 pl-2 text-right text-[10px] font-mono tabular-nums whitespace-nowrap align-top" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {r.shareNow.toFixed(1)}% → <span style={{ color: t.headText }}>{r.shareEnd.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note t={t}>
            Largest in {UN_END} first; the bar is the region's people in {UN_END}, on one scale for all six. A share is the region over the UN's world total for the same year, worked out
            here.
          </Note>
        </Block>
      </div>
      <SourceLink sources={[WPP]} />
    </div>
  );
}

// ── Energy ──────────────────────────────────────────────────────────────────

const POWER_NAME: Record<string, { name: string; renewable: boolean }> = {
  solar: { name: "Solar", renewable: true },
  wind: { name: "Wind", renewable: true },
  hydro: { name: "Hydropower", renewable: true },
  other: { name: "Other renewables", renewable: true },
  nuclear: { name: "Nuclear", renewable: false },
  gas: { name: "Natural gas", renewable: false },
  coal: { name: "Coal", renewable: false },
  battery: { name: "Battery storage", renewable: false },
};
const RENEWABLE = "#0d9488";
const OTHER_POWER = "#64748b";
/** A projected figure against where it starts: "×6.0" where it more than doubles, a percentage otherwise. */
const growthOf = (from: number, to: number) => (to >= 2 * from ? `×${(to / from).toFixed(1)}` : `${signed((100 * (to - from)) / from, 0)}%`);

function EnergyTab({ t }: { t: Tokens }) {
  const [kind, setKind] = useState<"generation" | "capacity">("generation");
  const rows: OutlookRow[] = EIA[kind].filter((r) => POWER_NAME[r.key]);
  const unit = kind === "generation" ? "TWh" : "GW";
  const top = Math.max(...rows.map((r) => r.high));
  const of = (key: string) => EIA.generation.find((r) => r.key === key);
  const solar = of("solar");
  const wind = of("wind");
  const coal = of("coal");
  const gas = of("gas");
  const tiles = [solar, wind, gas, coal].flatMap((r) =>
    r
      ? [
          {
            label: `${POWER_NAME[r.key].name}, ${EIA.year}`,
            value: `${whole(r.ref)} TWh`,
            sub: `EIA Reference case · ${whole(r.base)} in ${EIA.base}`,
            change: { text: `${growthOf(r.base, r.ref)} on ${EIA.base}`, dir: r.ref > r.base ? ("up" as const) : r.ref < r.base ? ("down" as const) : undefined },
          },
        ]
      : [],
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tiles.map((x) => (
          <Figure key={x.label} t={t} label={x.label} value={x.value} sub={x.sub} change={x.change} color={RENEWABLE} />
        ))}
      </div>
      <Block t={t} title={`The world's electricity by type: ${EIA.base} and ${EIA.year}`} kicker={`${kind === "generation" ? "TWh generated a year" : "GW of generating capacity"} · U.S. EIA, International Energy Outlook 2023`}>
        <Chips
          t={t}
          value={kind}
          onChange={setKind}
          label="Generation or capacity"
          options={[
            { id: "generation", label: "What is generated" },
            { id: "capacity", label: "What is installed" },
          ]}
        />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 560 }}>
            <caption className="sr-only">
              The world's electricity {kind} by type in {EIA.base} and as the U.S. EIA projects it for {EIA.year}: its Reference case, and the lowest and highest of its seven cases
            </caption>
            <thead>
              <tr>
                {["Type", `${EIA.base}`, `${EIA.year} · Reference`, "Change", "Lowest case", "Highest case"].map((h, i) => (
                  <th key={h} scope="col" className={`py-1 text-[9px] font-mono font-normal ${i === 0 ? "text-left" : "text-right pl-3"}`} style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = POWER_NAME[r.key];
                const color = p.renewable ? RENEWABLE : OTHER_POWER;
                return (
                  <tr key={r.key}>
                    <th scope="row" className="py-2 text-left align-top" style={{ borderBottom: `1px solid ${t.gridLine}`, width: "34%" }}>
                      <span className="flex items-center gap-1.5 text-[11px] font-sans font-semibold" style={{ color: t.headText }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden />
                        {p.name}
                      </span>
                      <span className="block mt-1.5">
                        <RangeBar t={t} top={top} base={r.base} mid={r.ref} low={r.low} high={r.high} color={color} />
                      </span>
                    </th>
                    <td className="py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top" style={{ color: t.bodyText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {whole(r.base)}
                    </td>
                    <td className="py-2 pl-3 text-right text-[11px] font-mono font-bold tabular-nums align-top" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {whole(r.ref)}
                    </td>
                    <td className="py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {growthOf(r.base, r.ref)}
                    </td>
                    <td className="py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {whole(r.low)}
                    </td>
                    <td className="py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {whole(r.high)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Legend
          t={t}
          items={[
            { color: RENEWABLE, label: `Renewable: in ${EIA.base} (solid) and projected for ${EIA.year} (paler)` },
            { color: OTHER_POWER, label: "Other types, the same way" },
            { color: t.headText, label: "Lowest to highest of the seven cases" },
          ]}
        />
        <Note t={t}>
          Figures are in {unit}. EIA's Reference case assumes the laws and policies in place when it was made, and its six other cases vary economic growth, oil prices and the cost of
          zero-carbon technology. It gives no likelihood to any of them, and nor does this panel. This is its 2023 edition, the latest it has published. The change is the Reference case
          against {EIA.base}, worked out here.
        </Note>
      </Block>
      <SourceLink sources={[EIA.source]} />
    </div>
  );
}

// ── Scenarios ───────────────────────────────────────────────────────────────

function ScenariosTab({ t }: { t: Tokens }) {
  const medium = WORLD_POP.population;
  const variants = [
    { key: "low", label: "Low variant", says: "Half a child fewer per woman than the medium, everywhere and throughout.", series: POPULATION_VARIANTS.low, color: "#0d9488" },
    { key: "medium", label: "Medium variant", says: "The UN's central projection, used everywhere else on the site.", series: medium, color: POP_COLOR },
    { key: "high", label: "High variant", says: "Half a child more per woman than the medium.", series: POPULATION_VARIANTS.high, color: "#d97706" },
  ];
  const mid = (y: number) => at(medium, y) ?? 0;
  const popTop = at(POPULATION_VARIANTS.high, UN_END) ?? 1;
  const power = EIA.generation.filter((r) => POWER_NAME[r.key]);
  const powerTop = Math.max(...power.map((r) => r.high));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl px-4 py-3" style={{ background: ACCENT + (t.isLight ? "0d" : "18"), border: `1px solid ${ACCENT}33` }}>
        <p className="text-[11px] font-sans leading-relaxed" style={{ color: t.bodyText }}>
          <strong style={{ color: t.headText }}>The scenarios here are the publishers' own, and none carries a probability.</strong> A body that projects sets out what its figures do if an
          assumption is moved; it does not say how likely that is. The site adds no scenario of its own and puts no likelihood on any.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Block t={t} title="People: the UN's three variants" kicker={`World population · UN World Population Prospects ${WPP.revision} · 2050 and ${UN_END}`}>
          <OutlookChart
            t={t}
            lines={variants.map((v) => ({ key: v.key, label: v.label, color: v.color, series: v.series.filter(([y]) => y >= WPP.firstProjected - 1) }))}
            split={WPP.firstProjected}
            fmt={people}
            tick={(v) => `${(v / 1e9).toFixed(0)}bn`}
            height={210}
            label={`The world's population to ${UN_END} under the UN's low, medium and high variants: ${variants.map((v) => `${v.label} ${people(at(v.series, UN_END) ?? 0)}`).join(", ")} in ${UN_END}.`}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 340 }}>
              <caption className="sr-only">World population in 2050 and {UN_END} under each of the UN's three variants, and each variant's difference from the medium in {UN_END}</caption>
              <thead>
                <tr>
                  {["Variant", "2050", `${UN_END}`, `Against the medium, ${UN_END}`].map((h, i) => (
                    <th key={h} scope="col" className={`py-1 text-[9px] font-mono font-normal ${i === 0 ? "text-left" : "text-right pl-3"}`} style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => {
                  const end = at(v.series, UN_END) ?? 0;
                  const d = end - mid(UN_END);
                  return (
                    <tr key={v.key}>
                      <th scope="row" className="py-2 text-left align-top" style={{ borderBottom: `1px solid ${t.gridLine}`, width: "42%" }}>
                        <span className="flex items-center gap-1.5 text-[11px] font-sans font-semibold" style={{ color: t.headText }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.color }} aria-hidden />
                          {v.label}
                        </span>
                        <span className="block text-[9px] font-sans leading-snug mt-0.5" style={{ color: t.mutedText }}>
                          {v.says}
                        </span>
                        <span className="block h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.gridLine }} aria-hidden>
                          <span className="block h-full rounded-full" style={{ width: `${(100 * end) / popTop}%`, background: v.color }} />
                        </span>
                      </th>
                      <td className="py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top" style={{ color: t.bodyText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {people(at(v.series, 2050) ?? 0)}
                      </td>
                      <td className="py-2 pl-3 text-right text-[11px] font-mono font-bold tabular-nums align-top" style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {people(end)}
                      </td>
                      <td className="py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top" style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                        {v.key === "medium" ? "—" : `${d > 0 ? "+" : "−"}${people(Math.abs(d))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Note t={t}>The variants mark out how much rests on fertility, the least certain part of the projection. The difference from the medium is worked out here.</Note>
          <SourceLink sources={[WPP]} />
        </Block>

        <Block t={t} title={`Power: the reach of EIA's seven cases in ${EIA.year}`} kicker={`TWh generated a year by type · U.S. EIA, International Energy Outlook 2023`}>
          <ul className="flex flex-col gap-3" aria-label={`The lowest, Reference and highest of EIA's seven cases for electricity generated by each type in ${EIA.year}`}>
            {power.map((r) => {
              const p = POWER_NAME[r.key];
              const color = p.renewable ? RENEWABLE : OTHER_POWER;
              return (
                <li key={r.key}>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[11px] font-sans font-semibold" style={{ color: t.headText }}>
                      {p.name}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums" style={{ color: t.mutedText }}>
                      {whole(r.low)} · <span className="font-bold" style={{ color: t.headText }}>{whole(r.ref)}</span> · {whole(r.high)}
                    </span>
                  </div>
                  <RangeBar t={t} top={powerTop} mid={r.ref} low={r.low} high={r.high} color={color} />
                </li>
              );
            })}
          </ul>
          <Legend
            t={t}
            items={[
              { color: t.headText, label: "Lowest to highest case" },
              { color: RENEWABLE, label: "Reference case, renewable" },
              { color: OTHER_POWER, label: "Reference case, other types" },
            ]}
          />
          <Note t={t}>
            Each row reads lowest · Reference · highest, in TWh. The six cases beside the Reference vary economic growth, oil prices and the cost of zero-carbon technology; the widest
            reach is where those matter most.
          </Note>
          <SourceLink sources={[EIA.source]} />
        </Block>
      </div>

      <Block t={t} title="The economy: one case, revised twice a year" kicker={`IMF World Economic Outlook, ${WEO.edition}`}>
        <Note t={t}>
          The IMF publishes its projections as a single central case and discusses alternatives in the report's text; it gives no alternative series a reader can set beside the central
          one, so none is drawn here. What changes is the case itself: every April and October the whole series is revised, estimates and projections alike. The figures on this panel are
          the {WEO.edition} edition's, in which {BASE} is the last year estimated and {FIRST} to {END} are projected.
        </Note>
        <SourceLink sources={[WEO]} />
      </Block>
    </div>
  );
}

// ── Research and technology: the measured record ────────────────────────────

/** A tab of world series that are measured, not projected: which series, in the order of its tiles, and its colour. */
type TrendSpec = { ids: string[]; color: string; about: string };
const RESEARCH: TrendSpec = {
  ids: ["research", "researchers", "sciArticles", "patents", "aiPublications", "ipReceipts"],
  color: "#65a30d",
  about: "What the world puts into research and what comes out of it: spending, the people doing it, the papers and patents, and what is paid across borders for their use.",
};
const TECH: TrendSpec = {
  ids: ["internet", "mobile", "broadband", "secureServers", "robotStock", "aiInvestment", "evSalesShare", "highTechExports"],
  color: "#e11d48",
  about: "How far technology has spread and what is being put into it: who is online and how, the robots at work, the money going into AI, electric cars, and high-tech goods in trade.",
};
const seriesOf = (spec: TrendSpec) => spec.ids.map((id) => WORLD[id]).filter((x): x is WorldIndicator => !!x && x.series.length > 1);
/** The latest year any of a tab's series runs to: the tab's badge. */
const latestOf = (spec: TrendSpec) => Math.max(0, ...seriesOf(spec).map((i) => lastOf(i.series)[0]));

const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e12 ? `${Number((v / 1e12).toFixed(2))}tn` : a >= 1e9 ? `${Number((v / 1e9).toFixed(a >= 1e10 ? 0 : 1))}bn` : a >= 1e6 ? `${Number((v / 1e6).toFixed(a >= 1e7 ? 1 : 2))}M` : whole(v);
};
/** A world series' figure, as its kind is printed. */
const printWorld = (ind: WorldIndicator, v: number) =>
  ind.format === "pct" ? `${v.toFixed(ind.dp)}%` : ind.format === "usd" ? `$${compact(v)}` : ind.format === "count" ? compact(v) : v.toLocaleString("en-US", { minimumFractionDigits: ind.dp, maximumFractionDigits: ind.dp });
const tickWorld = (ind: WorldIndicator) => (v: number) => {
  const a = Math.abs(v);
  const n = a >= 1e9 ? `${Number((v / 1e9).toFixed(1))}bn` : a >= 1e6 ? `${Number((v / 1e6).toFixed(1))}M` : a >= 1e4 ? `${Number((v / 1e3).toFixed(0))}k` : String(Number(v.toFixed(2)));
  return ind.format === "pct" ? `${n}%` : ind.format === "usd" ? (v === 0 ? "$0" : `$${n}`) : n;
};
/** The publisher, without "via ..." or what follows a dash. */
const publisherOf = (label: string) => label.split(/ \(| — /)[0];

/** How a series' latest figure stands against an earlier one: points for a share, a percentage or a multiple otherwise. */
function movedSince(ind: WorldIndicator, from: [number, number], to: [number, number]): { text: string; dir?: "up" | "down" } | null {
  if (from[0] === to[0]) return null;
  const was = `${from[0]} (${printWorld(ind, from[1])})`;
  if (ind.format === "pct") {
    const d = to[1] - from[1];
    return { text: `${signed(d, ind.dp)} pts on ${was}`, dir: d > 0 ? "up" : d < 0 ? "down" : undefined };
  }
  if (from[1] <= 0) return null;
  const ratio = to[1] / from[1];
  const dir = ratio > 1 ? ("up" as const) : ratio < 1 ? ("down" as const) : undefined;
  return { text: ratio >= 10 ? `${Math.round(ratio)} times ${was}` : `${signed(100 * (ratio - 1), 0)}% on ${was}`, dir };
}
/** The figure nearest ten years before the series' latest, or its first. */
const tenBefore = (ind: WorldIndicator): [number, number] => {
  const last = lastOf(ind.series)[0];
  return [...ind.series].reverse().find(([y]) => y <= last - 10) ?? ind.series[0];
};

function TrendTip({ active, payload, label, ind }: { active?: boolean; payload?: { value?: number | null }[]; label?: string; ind: WorldIndicator }) {
  const v = payload?.[0]?.value;
  if (!active || v == null) return null;
  return (
    <div className="cs-chart-tip rounded-md p-2 text-[11px] font-mono font-bold">
      <p className="mb-1" style={{ opacity: 0.75 }}>
        {label} · measured
      </p>
      <p>
        {ind.label}: {printWorld(ind, v)}
      </p>
    </div>
  );
}

/** One measured series, year by year, on an axis from zero: solid all the way, a dot a figure - a year with none is a gap, not a guess. */
function TrendChart({ t, ind, color, label }: { t: Tokens; ind: WorldIndicator; color: string; label: string }) {
  const [y0, y1] = [ind.series[0][0], lastOf(ind.series)[0]];
  const data = Array.from({ length: y1 - y0 + 1 }, (_, i) => ({ year: String(y0 + i), v: at(ind.series, y0 + i) ?? null }));
  const sparse = ind.series.length < (y1 - y0 + 1) * 0.7;
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={t.gridLine} vertical={false} />
          <XAxis dataKey="year" {...axisOf(t)} minTickGap={18} />
          <YAxis {...axisOf(t)} width={54} tickFormatter={tickWorld(ind)} domain={[0, "auto"]} />
          <Tooltip content={<TrendTip ind={ind} />} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={sparse ? { r: 3, fill: color, strokeWidth: 0 } : false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Every series of the tab at the same years, to the figure: a row a series, each in its own unit, a dash where its publisher has no figure for the year. */
function MeasuredTable({ t, inds, picked, onPick, caption }: { t: Tokens; inds: WorldIndicator[]; picked: string; onPick: (id: string) => void; caption: string }) {
  const last = Math.max(...inds.map((i) => lastOf(i.series)[0]));
  const first = Math.max(Math.min(...inds.map((i) => i.series[0][0])), last - 30);
  const years = [...new Set([...Array.from({ length: last - first + 1 }, (_, i) => first + i).filter((y) => y % 5 === 0), ...inds.map((i) => lastOf(i.series)[0])])].sort((a, b) => a - b);
  const cell = "px-2 py-1.5 text-[11px] font-mono tabular-nums whitespace-nowrap";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-right" style={{ minWidth: 220 + years.length * 64 }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <td />
            {years.map((y) => (
              <th key={y} scope="col" className={`${cell} font-bold`} style={{ color: t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inds.map((ind) => (
            <tr key={ind.id} onClick={() => onPick(ind.id)} className="cursor-pointer" style={{ background: ind.id === picked ? t.tile : undefined }}>
              <th scope="row" className="py-1.5 pr-3 text-left font-normal" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <span className="block text-[11px] font-sans font-semibold leading-tight" style={{ color: t.headText }}>
                  {ind.label}
                </span>
                <span className="block text-[9px] font-mono leading-tight" style={{ color: t.mutedText }}>
                  {ind.unit}
                </span>
              </th>
              {years.map((y) => {
                const v = at(ind.series, y);
                return (
                  <td key={y} className={cell} style={{ color: v === undefined ? t.mutedText : t.headText, borderBottom: `1px solid ${t.gridLine}` }}>
                    {v === undefined ? "—" : printWorld(ind, v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A tab of measured world series: a tile a series, the picked one drawn over
 * its whole record with what it says read off beside it, and every series of
 * the tab in one table. Nothing here is a projection, and the tab says so.
 */
function MeasuredTab({ t, spec, name }: { t: Tokens; spec: TrendSpec; name: string }) {
  const inds = seriesOf(spec);
  const [pick, setPick] = useState(inds[0]?.id ?? "");
  const ind = inds.find((x) => x.id === pick) ?? inds[0];
  if (!ind) return <Note t={t}>The site holds no series for this.</Note>;
  const first = ind.series[0];
  const last = lastOf(ind.series);
  const hi = ind.series.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lo = ind.series.reduce((a, b) => (b[1] < a[1] ? b : a));
  const whole_ = movedSince(ind, first, last);
  const facts: { label: string; value: string; sub?: string }[] = [
    { label: `Latest, ${last[0]}`, value: printWorld(ind, last[1]), sub: ind.unit },
    { label: `Where the series starts, ${first[0]}`, value: printWorld(ind, first[1]) },
    ...(whole_ ? [{ label: `Over the ${last[0] - first[0]} years between`, value: whole_.text.split(" on ")[0], sub: `from ${printWorld(ind, first[1])} to ${printWorld(ind, last[1])}` }] : []),
    { label: "Highest and lowest in the series", value: `${printWorld(ind, hi[1])} · ${printWorld(ind, lo[1])}`, sub: `${hi[0]} · ${lo[0]}` },
  ];
  const sources = [...new Map(inds.map((i) => [i.source.url, i.source])).values()];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl px-4 py-3" style={{ background: spec.color + (t.isLight ? "0d" : "14"), border: `1px solid ${spec.color}33` }}>
        <p className="text-[12px] font-sans leading-relaxed" style={{ color: t.bodyText }}>
          <strong style={{ color: t.headText }}>These are measured, not projected.</strong> {spec.about} No body publishes a projection of any of them, so each
          line stops at its publisher's latest year and nothing is drawn beyond it.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" role="group" aria-label="The series the chart shows">
        {inds.map((x) => {
          const end = lastOf(x.series);
          return (
            <Figure
              key={x.id}
              t={t}
              label={x.label}
              value={printWorld(x, end[1])}
              sub={`${x.unit} · ${end[0]}`}
              change={movedSince(x, tenBefore(x), end)}
              on={x.id === ind.id}
              onPick={() => setPick(x.id)}
              color={spec.color}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block t={t} title={`${ind.label}: the world, ${first[0]} to ${last[0]}`} kicker={`${ind.unit} · ${publisherOf(ind.source.label)} · measured, on an axis from zero`} className="lg:col-span-2">
          <TrendChart t={t} ind={ind} color={spec.color} label={`${ind.label} for the world, ${first[0]} to ${last[0]}: ${printWorld(ind, first[1])} to ${printWorld(ind, last[1])}. The table below has the figures.`} />
          <Legend t={t} items={[{ color: spec.color, label: `${first[0]}`, value: printWorld(ind, first[1]) }, { color: spec.color, label: `${last[0]}`, value: printWorld(ind, last[1]) }]} />
          {ind.note && <Note t={t}>{ind.note}</Note>}
        </Block>
        <Block t={t} title="What it says" kicker={`Read off the series · ${publisherOf(ind.source.label)}`}>
          <dl className="flex flex-col">
            {facts.map((x) => (
              <div key={x.label} className="py-2" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <dt className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                  {x.label}
                </dt>
                <dd className="text-sm font-bold font-mono leading-tight mt-0.5" style={{ color: t.headText }}>
                  {x.value}
                </dd>
                {x.sub && (
                  <dd className="text-[9px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
                    {x.sub}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          {ind.breakdown && ind.breakdown.length > 0 && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
                Its parts{ind.breakdownYear ? `, ${ind.breakdownYear}` : ""}
                {ind.breakdownUnit ? ` · ${ind.breakdownUnit}` : ""}
              </p>
              <ul className="flex flex-col gap-1">
                {ind.breakdown.slice(0, 6).map(([label, v]) => (
                  <li key={label} className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] font-sans min-w-0" style={{ color: t.bodyText }}>
                      {label}
                    </span>
                    <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
                      {ind.breakdownUnit ? v.toLocaleString("en-US", { maximumFractionDigits: 1 }) : printWorld(ind, v)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Block>
      </div>

      <Block t={t} title={`${name}, year by year`} kicker="Each series in its own unit · every fifth year and each series' latest · a dash where its publisher has no figure · select a row to chart it">
        <MeasuredTable t={t} inds={inds} picked={ind.id} onPick={setPick} caption={`${name}: the world's figure for each series, by year.`} />
        <SourceLink sources={sources} />
      </Block>
    </div>
  );
}

// ── The desk ────────────────────────────────────────────────────────────────

type TabId = "economy" | "countries" | "people" | "energy" | "research" | "tech" | "scenarios";

export function ProjectionsDesk({ action, id }: { /** A link at the head of the panel: to the page with the full analysis. */ action?: { label: string; onClick: () => void }; id?: string }) {
  const t = useTokens();
  const [tab, setTab] = useState<TabId>("economy");
  const tabs: { id: TabId; label: string; badge: string; color: string; icon: ReactNode }[] = [
    { id: "economy", label: "World economy", badge: `to ${END}`, color: "#2563eb", icon: <ChartLineUp size={12} weight="fill" /> },
    { id: "countries", label: "Countries", badge: `${WEO_COUNTRIES.length}`, color: "#d97706", icon: <Globe size={12} weight="fill" /> },
    { id: "people", label: "People", badge: `to ${UN_END}`, color: "#c026d3", icon: <Users size={12} weight="fill" /> },
    { id: "energy", label: "Energy", badge: `to ${EIA.year}`, color: "#0d9488", icon: <Lightning size={12} weight="fill" /> },
    // The measured record, not a projection: the badge is the latest year its series run to.
    { id: "research", label: "Research & discovery", badge: `measured to ${latestOf(RESEARCH)}`, color: RESEARCH.color, icon: <Flask size={12} weight="fill" /> },
    { id: "tech", label: "Technology", badge: `measured to ${latestOf(TECH)}`, color: TECH.color, icon: <Cpu size={12} weight="fill" /> },
    { id: "scenarios", label: "Scenarios", badge: "published only", color: "#7c3aed", icon: <Target size={12} weight="fill" /> },
  ];
  return (
    <section id={id} aria-labelledby="projections-desk-title" className="rounded-2xl overflow-hidden scroll-mt-36" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: ACCENT + "14", border: `1px solid ${ACCENT}2a` }}>
            <TrendUp size={16} weight="fill" style={{ color: ACCENT }} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="projections-desk-title" className="text-base font-bold font-sans leading-tight" style={{ color: t.headText }}>
              Trends &amp; Projections
            </h2>
            <p className="text-[11px] font-sans leading-snug mt-0.5 max-w-2xl" style={{ color: t.mutedText }}>
              Where the bodies that publish projections put the world next: the economy from the IMF, power from the U.S. EIA, people from the UN - and, for research and
              technology, which nobody projects, the measured record to date. Published figures only - no probabilities, no confidence scores.
            </p>
          </div>
        </div>
        {action && (
          <button type="button" onClick={action.onClick} className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: ACCENT }}>
            {action.label} <ArrowRight size={11} weight="bold" aria-hidden />
          </button>
        )}
      </div>

      <Horizons t={t} />

      <div role="tablist" aria-label="Trends and projections" className="flex items-center overflow-x-auto" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
        {tabs.map((x) => {
          const on = tab === x.id;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(x.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold font-sans transition-colors shrink-0 cursor-pointer"
              style={{ color: on ? x.color : t.mutedText, background: on ? t.tile : "transparent", borderBottom: `2px solid ${on ? x.color : "transparent"}`, marginBottom: -1 }}
            >
              <span style={{ color: x.color }}>{x.icon}</span>
              {x.label}
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: x.color + "15", color: x.color }}>
                {x.badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-5" role="tabpanel">
        {tab === "economy" && <EconomyTab t={t} />}
        {tab === "countries" && <CountriesTab t={t} />}
        {tab === "people" && <PeopleTab t={t} />}
        {tab === "energy" && <EnergyTab t={t} />}
        {tab === "research" && <MeasuredTab key="research" t={t} spec={RESEARCH} name="Research and discovery" />}
        {tab === "tech" && <MeasuredTab key="tech" t={t} spec={TECH} name="Technology" />}
        {tab === "scenarios" && <ScenariosTab t={t} />}
      </div>
    </section>
  );
}

export default ProjectionsDesk;
