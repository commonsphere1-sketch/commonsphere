import { useEffect, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowsIn, ArrowsOut, TrendDown, TrendUp, X } from "@phosphor-icons/react";
import { RESOURCE_DETAILS } from "../data/resourceDetails";
import { RESOURCE_PRODUCERS } from "../data/resourceProducers";
import { ENERGY_PRODUCERS } from "../data/energyProducers";
import { OTHER_PRODUCERS } from "../data/otherProducers";
import { COMMODITY_PRICES, COMMODITY_PRICE_SOURCES, type CommodityPrice } from "../data/commodityPrices";
import type { Amount, ProducerUnit, ResourceProducers, Share } from "../data/resourceProducerTypes";
import { useTheme } from "../contexts/ThemeContext";
import { SourceLink } from "./SourceLink";

/** A commodity on the page: its name, which keys every data file, and the colour it is drawn in. */
export interface ResourceSummary {
  name: string;
  color: string;
}

/**
 * An amount in its own unit, read at a glance. Oil is in barrels and gas in
 * cubic metres as published; nothing is converted into a unit its source did
 * not use.
 */
function fmtAmount(a: Amount, unit: ProducerUnit): string {
  const v = a.value;
  const pre = a.lowerBound ? ">" : "";
  switch (unit) {
    case "t":
      if (v >= 1e9) return `${pre}${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)} bn t`;
      if (v >= 1e6) return `${pre}${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)} Mt`;
      return `${pre}${Math.round(v).toLocaleString()} t`;
    case "kb/d":
      // Thousand barrels a day; a million or more reads better as mb/d.
      return v >= 1000
        ? `${pre}${(v / 1000).toFixed(1)} mb/d`
        : `${pre}${Math.round(v).toLocaleString()} kb/d`;
    case "mb":
      // Million barrels; the large holders read better in billions.
      return v >= 1000
        ? `${pre}${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} bn bbl`
        : `${pre}${Math.round(v).toLocaleString()} m bbl`;
    case "bcm":
      return v >= 1000
        ? `${pre}${(v / 1000).toFixed(1)} tcm`
        : `${pre}${v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(1)} bcm`;
  }
}

function fmtShare(s: Share | null): string | null {
  if (!s) return null;
  const mark = s.bound === "atMost" ? "≤" : s.bound === "atLeast" ? "≥" : "";
  return `${mark}${s.pct}%`;
}

/** Every commodity with a country table: USGS minerals, then energy. */
const PRODUCERS: Record<string, ResourceProducers> = {
  ...RESOURCE_PRODUCERS,
  ...ENERGY_PRODUCERS,
  ...OTHER_PRODUCERS,
};

// ── Prices ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-08" as "Aug 2026". */
export const fmtMonth = (m: string) => `${MONTH_NAMES[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
/** A price as its publisher prints it: no more decimals than it gave. */
export const fmtPrice = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** A change between two published months, as a percentage of the earlier one. */
export type PriceChange = { pct: number; from: string; was: number };

export interface PriceFacts {
  price: CommodityPrice;
  month: string;
  value: number;
  /** On the month before, and on the same month a year before, where the series has them. */
  onMonth: PriceChange | null;
  onYear: PriceChange | null;
  /** The highest and lowest months in the series kept (ten years). */
  high: [month: string, price: number];
  low: [month: string, price: number];
}

/**
 * The latest published price of a commodity and what it has done. The two
 * changes are worked out here, each from two published monthly averages; the
 * page names the months wherever it shows one.
 */
export function priceFacts(name: string): PriceFacts | null {
  const price = COMMODITY_PRICES[name];
  if (!price || price.series.length === 0) return null;
  const s = price.series;
  const [month, value] = s[s.length - 1];
  const change = (from: [string, number] | undefined): PriceChange | null =>
    from && from[1] > 0 ? { pct: Math.round(((value - from[1]) / from[1]) * 1000) / 10, from: from[0], was: from[1] } : null;
  const yearBefore = `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;
  return {
    price,
    month,
    value,
    onMonth: change(s[s.length - 2]),
    onYear: change(s.find(([m]) => m === yearBefore)),
    high: s.reduce((a, b) => (b[1] > a[1] ? b : a)),
    low: s.reduce((a, b) => (b[1] < a[1] ? b : a)),
  };
}

/** The newest month any commodity's price is for. */
export const LATEST_PRICE_MONTH = Object.values(COMMODITY_PRICES)
  .map((p) => p.series[p.series.length - 1]?.[0] ?? "")
  .sort()
  .pop() as string;

/** A change as a chip: an arrow, the percentage, and in its title the two figures it is worked out from. */
export function ChangeChip({ c, unit, now, small = false }: { c: PriceChange; unit: string; now: number; small?: boolean }) {
  const up = c.pct >= 0;
  const Icon = up ? TrendUp : TrendDown;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-full border whitespace-nowrap ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"} ${
        up ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
      }`}
      title={`${fmtPrice(c.was)} ${unit} in ${fmtMonth(c.from)}; ${fmtPrice(now)} ${unit} now`}
    >
      <Icon size={small ? 10 : 12} weight="bold" aria-hidden />
      {up ? "+" : ""}
      {c.pct.toFixed(1)}%
    </span>
  );
}

/** The last `months` of a price series as a line, with its latest point marked. */
export function PriceSparkline({ series, color, months = 61 }: { series: [string, number][]; color: string; months?: number }) {
  const s = series.slice(-months);
  if (s.length < 3) return null;
  const ys = s.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const px = (i: number) => 2 + (i / (s.length - 1)) * 96;
  const py = (v: number) => 90 - ((v - lo) / (hi - lo || 1)) * 80;
  const d = s.map(([, v], i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join("");
  return (
    <span className="relative block h-9 w-full" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={`${d}L${px(s.length - 1).toFixed(1)},100L${px(0).toFixed(1)},100Z`} fill={color} fillOpacity={0.14} />
        <path d={d} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
        style={{ left: `${px(s.length - 1)}%`, top: `${py(s[s.length - 1][1])}%`, background: color }}
      />
    </span>
  );
}

// ── Output and reserves ────────────────────────────────────────────────────

export interface ProducerFacts {
  /** World production, with what is measured and for when. */
  output: string;
  outputYear: string;
  measure: string;
  /** World reserves - or what the second column holds instead (exports for wheat, resources for uranium). */
  held: string | null;
  heldYear: string | null;
  /** "reserves", "resources" or "exports". */
  heldLabel: string;
  topProducer: { name: string; share: string | null; amount: string } | null;
  topHolder: { name: string; share: string | null; amount: string } | null;
  countries: number;
}

/**
 * The headline of a commodity's country table: world output, the largest
 * producer, and the largest holder of reserves, each read from the same table
 * the window lists, so a card and the list inside it cannot disagree.
 */
export function producerFacts(name: string): ProducerFacts | null {
  const p = PRODUCERS[name];
  if (!p) return null;
  const producer = p.countries.find((c) => c.production);
  const holder =
    p.worldReserves && p.reservesUnit
      ? [...p.countries].filter((c) => c.reserves).sort((a, b) => (b.reserves?.value ?? 0) - (a.reserves?.value ?? 0))[0]
      : undefined;
  return {
    output: fmtAmount(p.worldProduction, p.productionUnit),
    outputYear: p.productionYear,
    measure: p.measure,
    held: p.worldReserves && p.reservesUnit ? fmtAmount(p.worldReserves, p.reservesUnit) : null,
    heldYear: p.reservesYear,
    heldLabel: (p.reservesLabel ?? "Reserves").toLowerCase(),
    topProducer: producer?.production ? { name: producer.name, share: fmtShare(producer.productionShare), amount: fmtAmount(producer.production, p.productionUnit) } : null,
    topHolder: holder?.reserves && p.reservesUnit ? { name: holder.name, share: fmtShare(holder.reservesShare), amount: fmtAmount(holder.reserves, p.reservesUnit) } : null,
    countries: p.countries.length,
  };
}

/** The countries that produce most of a commodity, largest first, each with its output as printed and its share of the world's. */
export function leadingProducers(name: string, n = 6): { name: string; value: number; amount: string; share: string | null }[] {
  const p = PRODUCERS[name];
  if (!p) return [];
  return p.countries
    .flatMap((c) => (c.production ? [{ name: c.name, value: c.production.value, amount: fmtAmount(c.production, p.productionUnit), share: fmtShare(c.productionShare) }] : []))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

/** Where a commodity's country table comes from. */
export const producerSources = (name: string) => PRODUCERS[name]?.sources ?? [];

/** "exports" → "Top exporter", "reserves" → "Largest reserves": what to call whoever leads the second column. */
export const holderTitle = (label: string) => (label === "exports" ? "Top exporter" : `Largest ${label}`);

/**
 * Every country the source lists for the commodity: its production and its
 * reserves, each with its share of the world. From resourceProducers.ts
 * (USGS) and energyProducers.ts (EIA, OPEC). A commodity without a table
 * renders nothing here rather than a table of guesses.
 */
function ProducerTable({ name }: { name: string }) {
  const p = PRODUCERS[name];
  if (!p) return null;
  const hasReserves = p.worldReserves !== null && p.reservesUnit !== null;
  const cols = hasReserves ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]";
  const years =
    hasReserves && p.reservesYear && p.reservesYear !== p.productionYear
      ? `production ${p.productionYear} · ${(p.reservesLabel ?? "reserves").toLowerCase()} ${p.reservesYear}`
      : p.productionYear;

  return (
    <>
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
        Countries · {years}
      </p>
      <div className="modal-tile rounded-xl p-3">
        <div className={`grid ${cols} gap-x-4 pb-1.5 mb-1 border-b border-border/50`}>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Country</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-right">
            Production
          </span>
          {hasReserves && (
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-right">
              {p.reservesLabel ?? "Reserves"}
            </span>
          )}
        </div>
        {p.countries.map((c) => (
          <div key={c.name} className={`grid ${cols} gap-x-4 py-1 items-baseline`}>
            <span className="text-[11px] font-sans text-foreground">{c.name}</span>
            <span className="text-[11px] font-mono text-foreground text-right">
              {c.production ? (
                <>
                  {fmtAmount(c.production, p.productionUnit)}
                  {p.estimated?.includes(c.name) && (
                    <span className="text-muted-foreground"> est.</span>
                  )}
                  {c.productionShare && (
                    <span className="text-muted-foreground"> · {fmtShare(c.productionShare)}</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">{c.productionWithheld ? "withheld" : "—"}</span>
              )}
            </span>
            {hasReserves && (
              <span className="text-[11px] font-mono text-foreground text-right">
                {c.reserves ? (
                  <>
                    {fmtAmount(c.reserves, p.reservesUnit!)}
                    {c.reservesShare && (
                      <span className="text-muted-foreground"> · {fmtShare(c.reservesShare)}</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            )}
          </div>
        ))}
        <div className={`grid ${cols} gap-x-4 pt-1.5 mt-1 border-t border-border/50`}>
          <span className="text-[11px] font-sans font-semibold text-foreground">World</span>
          <span className="text-[11px] font-mono font-semibold text-foreground text-right">
            {fmtAmount(p.worldProduction, p.productionUnit)}
          </span>
          {hasReserves && p.worldReserves && (
            <span className="text-[11px] font-mono font-semibold text-foreground text-right">
              {fmtAmount(p.worldReserves, p.reservesUnit!)}
            </span>
          )}
        </div>
        <p className="text-[9px] font-sans text-muted-foreground mt-2 leading-snug">
          {p.measure}, with each country's share of the world.
          {p.countries.some((c) => c.productionWithheld) &&
            " “Withheld” means the figure is not published, to protect company data — not that there is none."}
          {p.worldReserves?.lowerBound &&
            " The world reserve total is a minimum, so a share of it (≤) is an upper bound."}
          {p.notes?.map((n) => ` ${n}`)}
        </p>
        <SourceLink sources={p.sources} className="mt-1" />
      </div>
    </>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">{children}</p>
);

/** A figure in a tile: what it is, the figure, and a line under it saying whose or for when. */
function Glance({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="modal-tile rounded-xl p-3 min-w-0">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold font-sans text-foreground leading-tight break-words">{value}</p>
      {sub && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/** Ten years of the monthly price, with the months it was highest and lowest and what it was a year ago. */
function PriceHistory({ facts, color, unitNote }: { facts: PriceFacts; color: string; unitNote?: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { price, month, value, onYear, high, low } = facts;
  const muted = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.5)";
  const ink = isLight ? "#0f172a" : "#f1f0ff";
  const data = price.series.map(([m, v]) => ({ m, v }));
  const januaries = price.series.filter(([m]) => m.endsWith("-01")).map(([m]) => m);
  const source = COMMODITY_PRICE_SOURCES[price.source];
  const gradient = `price-fill-${price.source}-${color.replace("#", "")}`;
  return (
    <>
      <Label>
        Price · monthly average, {fmtMonth(price.series[0][0])} to {fmtMonth(month)}
      </Label>
      <div className="modal-tile rounded-xl p-3">
        <div
          role="img"
          aria-label={`${price.benchmark}: ${fmtPrice(value)} ${price.unit} in ${fmtMonth(month)}; over ten years between ${fmtPrice(low[1])} in ${fmtMonth(low[0])} and ${fmtPrice(high[1])} in ${fmtMonth(high[0])}.`}
        >
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="m" ticks={januaries} tickFormatter={(m: string) => m.slice(0, 4)} tick={{ fontSize: 9, fill: muted, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis width={46} tick={{ fontSize: 9, fill: muted, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : fmtPrice(v))} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ background: isLight ? "#ffffff" : "#15151a", border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11, fontFamily: "monospace", color: ink }}
                itemStyle={{ color: ink }}
                labelStyle={{ color: muted }}
                labelFormatter={(m: string) => fmtMonth(m)}
                formatter={(v: number) => [`${fmtPrice(v)} ${price.unit}`, price.benchmark]}
              />
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradient})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: "Ten-year high", v: high[1], m: high[0] },
            { label: "Ten-year low", v: low[1], m: low[0] },
            ...(onYear ? [{ label: "A year before", v: onYear.was, m: onYear.from }] : []),
          ].map((t) => (
            <div key={t.label} className="rounded-lg border border-border/50 px-2.5 py-1.5 min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <p className="text-[13px] font-bold font-mono text-foreground">{fmtPrice(t.v)}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{fmtMonth(t.m)}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] font-sans leading-relaxed text-muted-foreground mt-3">
          <span className="font-semibold text-foreground">What is priced. </span>
          {price.about.replace(/\.$/, "")}. {unitNote}
        </p>
        {price.also.length > 0 && (
          <p className="text-[11px] font-sans leading-relaxed text-muted-foreground mt-2">
            <span className="font-semibold text-foreground">Other benchmarks, {fmtMonth(price.also[0].month)}. </span>
            {price.also.map((a, i) => (
              <span key={a.label}>
                {i > 0 && " · "}
                {a.label} <span className="font-mono text-foreground">{fmtPrice(a.price)}</span> {a.unit}
              </span>
            ))}
          </p>
        )}
        <p className="text-[9px] font-sans text-muted-foreground mt-2 leading-snug">
          Monthly averages in nominal US dollars, as published; the percentage changes are worked out here from the two months each names.
          {"updated" in source && ` The World Bank's file was updated ${source.updated}.`}
        </p>
        <SourceLink sources={source} className="mt-1" />
      </div>
    </>
  );
}

/**
 * Detail view for a commodity card: its price and what that price is of, who
 * produces and holds it, what it is used for, how it is produced, where it
 * comes out of the ground, and how it is valued.
 *
 * Follows the page's existing modal shape — scrim, .modal-glass panel,
 * gradient header — so it reads as part of the same family as the economy
 * modal rather than a new pattern.
 */
export function ResourceModal({
  resource,
  onClose,
}: {
  resource: ResourceSummary;
  onClose: () => void;
}) {
  const detail = RESOURCE_DETAILS[resource.name];
  const price = priceFacts(resource.name);
  const made = producerFacts(resource.name);

  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${resource.name} detail`}
    >
      <div
        className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : "max-w-2xl max-h-[90vh]"}`}
      >
        <div className="p-6">
          {/* ── Header ── */}
          <div className="relative flex items-start justify-between -mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, ${resource.color}33, ${resource.color}14, ${resource.color}26)`,
              }}
            />
            <div className="relative min-w-0">
              <h2 className="text-xl font-bold font-sans text-foreground leading-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: resource.color }} aria-hidden />
                {resource.name}
              </h2>
              {price ? (
                <>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-2xl font-bold font-mono text-foreground leading-none">{fmtPrice(price.value)}</span>
                    <span className="text-xs font-mono text-muted-foreground">{price.price.unit}</span>
                    {price.onMonth && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans text-muted-foreground">
                        <ChangeChip c={price.onMonth} unit={price.price.unit} now={price.value} />
                        on {fmtMonth(price.onMonth.from)}
                      </span>
                    )}
                    {price.onYear && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans text-muted-foreground">
                        <ChangeChip c={price.onYear} unit={price.price.unit} now={price.value} />
                        on {fmtMonth(price.onYear.from)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-sans text-muted-foreground mt-1.5">
                    {price.price.benchmark} · average for {fmtMonth(price.month)}
                  </p>
                </>
              ) : (
                <p className="text-[11px] font-sans text-muted-foreground mt-1.5">No published price series is held for this commodity.</p>
              )}
            </div>
            <div className="relative flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                aria-label={isExpanded ? "Collapse modal" : "Expand modal to full screen"}
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                {isExpanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
              </button>
              <button
                onClick={onClose}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {detail ? (
            <>
              <p className="text-[13px] font-sans leading-relaxed text-muted-foreground mt-5">
                {detail.summary}
              </p>

              {/* ── At a glance: the headline of the country table below ── */}
              {made && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                  <Glance label="World output" value={made.output} sub={made.outputYear} />
                  {made.held ? (
                    <Glance label={`World ${made.heldLabel}`} value={made.held} sub={made.heldYear ?? undefined} />
                  ) : (
                    <Glance label="World reserves" value="None published" sub={resource.name === "Aluminum" ? "its ore is bauxite" : undefined} />
                  )}
                  {made.topProducer && (
                    <Glance label="Largest producer" value={made.topProducer.name} sub={[made.topProducer.amount, made.topProducer.share].filter(Boolean).join(" · ")} />
                  )}
                  {made.topHolder && (
                    <Glance label={holderTitle(made.heldLabel)} value={made.topHolder.name} sub={[made.topHolder.amount, made.topHolder.share].filter(Boolean).join(" · ")} />
                  )}
                </div>
              )}

              {/* ── Price ── */}
              {price && <PriceHistory facts={price} color={resource.color} unitNote={detail.unit} />}

              {/* ── Countries ── */}
              <ProducerTable name={resource.name} />

              {/* ── Uses ── */}
              <Label>What it is used for</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detail.uses.map((u, i) => (
                  <div key={u.label} className="modal-tile rounded-xl p-3 flex gap-2.5">
                    <span
                      className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[10px] font-mono font-bold text-foreground"
                      style={{ background: `${resource.color}33`, border: `1px solid ${resource.color}66` }}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold font-sans text-foreground mb-0.5">{u.label}</p>
                      <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">{u.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Production ── */}
              <Label>How it is produced</Label>
              <ol className="modal-tile rounded-xl p-3 flex flex-col gap-2.5">
                {detail.made.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground w-4 shrink-0 pt-0.5" aria-hidden>
                      {i + 1}.
                    </span>
                    <span className="text-[11px] font-sans leading-relaxed text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>

              {/* ── Deposits ── */}
              <Label>Where it comes from</Label>
              <div className="flex flex-col gap-2">
                {detail.deposits.map((d) => (
                  <div key={d.place} className="flex gap-2.5">
                    <div
                      className="w-1 rounded-full shrink-0 mt-1"
                      style={{ background: resource.color, minHeight: 14 }}
                    />
                    <div>
                      <p className="text-[11px] font-bold font-sans text-foreground">
                        {d.place}
                      </p>
                      <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">
                        {d.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Value ── */}
              <Label>How it is valued</Label>
              <div className="flex flex-col gap-2">
                {detail.value.map((v, i) => (
                  <div
                    key={i}
                    className="modal-tile rounded-xl p-3 text-[11px] font-sans leading-relaxed text-muted-foreground"
                  >
                    {v}
                  </div>
                ))}
              </div>

              <p className="text-[9px] font-sans text-muted-foreground mt-5 pt-3 border-t border-border/40">
                The price, output, reserves and shares above are published figures, each with its source and its date. The
                descriptions of uses, production, deposits and valuation are CommonSphere's own summary, written to explain
                them.
              </p>
            </>
          ) : (
            <p className="text-[13px] font-sans text-muted-foreground mt-5">
              No background is recorded for this commodity yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
