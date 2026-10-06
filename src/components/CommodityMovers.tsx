/**
 * Commodity prices on the Dashboard: each commodity's latest published
 * monthly average, the year behind it as a line, and its change on the same
 * month a year before - the largest rise first.
 *
 * It stands where a "Sector Outlook" stood: eight sectors with a twelve-month
 * "outlook" and a "confidence" beside each, and three "top movers" drawn from
 * numbers typed in to make a line. Nobody publishes those. These prices are
 * published - the World Bank's and the IMF's monthly averages
 * (commodityPrices.ts) - and the one thing worked out is the change, from two
 * of those averages, with both months named in its title.
 */
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChartLineUp } from "@phosphor-icons/react";
import { COMMODITY_PRICES, COMMODITY_PRICE_SOURCES } from "../data/commodityPrices";
import { SourceLink } from "./SourceLink";
import { useTokens } from "./DataExplorer";

const COLOR = "#059669";
const UP = "#10b981";
const DOWN = "#ef4444";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthName = (m: string) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
const price = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Each commodity at its latest month, with the thirteen months to it and its change on the same month a year before, where that month is published. */
const MOVERS = Object.entries(COMMODITY_PRICES)
  .flatMap(([name, p]) => {
    const s = p.series;
    if (s.length < 2) return [];
    const [month, value] = s[s.length - 1];
    const before = s.find(([m]) => m === `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`);
    return [{ name, unit: p.unit, source: p.source, month, value, year: s.slice(-13), before: before && before[1] > 0 ? { month: before[0], value: before[1], pct: (100 * (value - before[1])) / before[1] } : null }];
  })
  .sort((a, b) => (b.before?.pct ?? -Infinity) - (a.before?.pct ?? -Infinity));
const LATEST = MOVERS.map((m) => m.month).sort().pop() ?? "";

/** The thirteen months as a line between their lowest and highest, with the latest marked. */
function YearLine({ points, color }: { points: [string, number][]; color: string }) {
  const ys = points.map(([, v]) => v);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x = (i: number) => 1 + (i / (points.length - 1)) * 58;
  const y = (v: number) => 15 - ((v - lo) / (hi - lo || 1)) * 13;
  const d = points.map(([, v], i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox="0 0 60 16" className="w-14 h-4 shrink-0" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(ys[ys.length - 1])} r={1.6} fill={color} />
    </svg>
  );
}

export function CommodityMovers() {
  const t = useTokens();
  const navigate = useNavigate();
  const sources = [...new Set(MOVERS.map((m) => m.source))].map((s) => COMMODITY_PRICE_SOURCES[s]);
  return (
    <div className="rounded-2xl p-4 flex flex-col flex-1" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <ChartLineUp size={14} weight="fill" style={{ color: COLOR }} aria-hidden />
          <h2 className="text-sm font-bold font-sans" style={{ color: t.headText }}>
            Commodity prices
          </h2>
        </div>
        <button type="button" onClick={() => navigate("/dashboard/economies?view=resources")} className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: COLOR }}>
          Resources <ArrowRight size={10} weight="bold" aria-hidden />
        </button>
      </div>
      <p className="text-[10px] font-sans leading-snug mb-2" style={{ color: t.mutedText }}>
        Monthly averages to {monthName(LATEST)}, and each one's change on the same month a year before - the largest rise first.
      </p>
      <ul className="flex flex-col">
        {MOVERS.map((m, i) => (
          <li
            key={m.name}
            className="flex items-center gap-2 py-1.5"
            style={{ borderBottom: i < MOVERS.length - 1 ? `1px solid ${t.gridLine}` : "none" }}
            title={m.before ? `${m.name}: ${price(m.before.value)} ${m.unit} in ${monthName(m.before.month)}, ${price(m.value)} in ${monthName(m.month)}` : `${m.name}: ${price(m.value)} ${m.unit} in ${monthName(m.month)}`}
          >
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-semibold font-sans truncate" style={{ color: t.headText }}>
                {m.name}
              </span>
              <span className="block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                {price(m.value)} {m.unit}
                {m.month !== LATEST ? ` · ${monthName(m.month)}` : ""}
              </span>
            </span>
            <YearLine points={m.year} color={t.mutedText} />
            <span className="text-[11px] font-mono font-bold tabular-nums w-14 text-right shrink-0" style={{ color: m.before ? (m.before.pct >= 0 ? UP : DOWN) : t.mutedText }}>
              {m.before ? `${m.before.pct > 0 ? "+" : ""}${m.before.pct.toFixed(1)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        The line is the thirteen months to the latest, drawn between its own lowest and highest, so it shows the shape of the year and not its size. Prices are nominal US dollars, in each
        publisher's own unit.
      </p>
      <SourceLink sources={sources} className="mt-1" />
    </div>
  );
}
