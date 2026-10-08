/**
 * Commodity prices on the Dashboard: each commodity's latest published
 * monthly average, the year behind it as a line, and its change on the same
 * month a year before - the largest rise first.
 *
 * Under each: which benchmark it is and whose, the publisher's own account of
 * the series, and the other benchmarks published for the same commodity. A
 * grid of where the price had been - a month, a year and ten years before,
 * and its highs and lows - stood under them and was taken off.
 *
 * And what the commodity is used for and who has it - the countries that
 * produce the most and hold the most - from the Resources window's own
 * tables (CommodityBackground, loaded with them when the card is shown).
 * One commodity is open at a time, so the card keeps to the height of the
 * card beside it.
 *
 * It stands where a "Sector Outlook" stood: eight sectors with a twelve-month
 * "outlook" and a "confidence" beside each, and three "top movers" drawn from
 * numbers typed in to make a line. Nobody publishes those. These prices are
 * published - the World Bank's and the IMF's monthly averages
 * (commodityPrices.ts) - and the one thing worked out is the change, from two
 * of those averages, with both months named in its title.
 */
import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChartLineUp } from "@phosphor-icons/react";
import { COMMODITY_PRICES, COMMODITY_PRICE_SOURCES } from "../data/commodityPrices";
import { SourceLink } from "./SourceLink";
import { RESOURCES } from "../data/resourceList";
import { Card, Caret, Go, Head, Kicker } from "./DashboardCitiesSectors";
import { useTokens } from "./DataExplorer";

/** What a commodity is used for and who has it, with the country tables it reads: loaded when the card is shown. */
const CommodityBackground = lazy(() => import("./CommodityBackground"));

const COLOR = "#059669";
/** Each commodity's own colour, as the Resources page gives it. */
const RESOURCE_COLOR = new Map(RESOURCES.map((r) => [r.name, r.color]));
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
    // The average of the same month a year back, with the change since, where the series has that month.
    const b = s.find(([m]) => m === `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`);
    const before = b && b[1] > 0 ? { month: b[0], value: b[1], pct: (100 * (value - b[1])) / b[1] } : null;
    return [{ name, unit: p.unit, source: p.source, benchmark: p.benchmark, about: p.about, also: p.also, month, value, year: s.slice(-13), before }];
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
  // One commodity is open at a time: the first, until another is chosen.
  const [open, setOpen] = useState(MOVERS[0]?.name);
  return (
    <Card t={t}>
      <Head t={t} icon={<ChartLineUp size={16} weight="fill" />} label="Commodity prices" badge={`${MOVERS.length} priced`} color={COLOR} cta="Resources" to="/dashboard/economies?view=resources" />
      <p className="text-[10px] font-sans leading-snug -mt-2 mb-2" style={{ color: t.mutedText }}>
        Monthly averages to {monthName(LATEST)}, and each one's change on the same month a year before - the largest rise first.
      </p>
      <Kicker t={t}>Choose one for what it is used for and who has it</Kicker>
      <ul className="flex flex-col flex-1">
        {MOVERS.map((m, i) => (
          <li
            key={m.name}
            className="py-2"
            style={{ borderBottom: i < MOVERS.length - 1 ? `1px solid ${t.gridLine}` : "none" }}
            title={m.before ? `${m.name}: ${price(m.before.value)} ${m.unit} in ${monthName(m.before.month)}, ${price(m.value)} in ${monthName(m.month)}` : `${m.name}: ${price(m.value)} ${m.unit} in ${monthName(m.month)}`}
          >
            <button type="button" aria-expanded={open === m.name} onClick={() => setOpen(m.name)} className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: RESOURCE_COLOR.get(m.name) ?? COLOR }} aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
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
            <Caret open={open === m.name} color={t.mutedText} />
            </button>
            {open === m.name && (
              <div className="pl-3.5">
                {/* What is priced and whose price it is, in the publisher's words. */}
                <p className="text-[9px] font-mono mt-1.5" style={{ color: t.mutedText }}>
                  {m.benchmark} · {COMMODITY_PRICE_SOURCES[m.source].label}
                </p>
                <p className="text-[10px] font-sans leading-snug mt-1" style={{ color: t.bodyText }}>
                  {m.about}
                </p>
                {m.also.length > 0 && (
                  <p className="text-[9px] font-sans leading-snug mt-0.5" style={{ color: t.mutedText }}>
                    Also published: {m.also.map((a) => `${a.label} ${price(a.price)} ${a.unit} (${monthName(a.month)})`).join(" · ")}
                  </p>
                )}
                <Suspense fallback={null}>
                  <CommodityBackground name={m.name} t={t} color={RESOURCE_COLOR.get(m.name) ?? COLOR} />
                </Suspense>
                <div className="mt-2">
                  <Go color={COLOR} onClick={() => navigate("/dashboard/economies?view=resources")}>
                    Open Resources
                  </Go>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        The line is the thirteen months to the latest, drawn between its own lowest and highest, so it shows the shape of the year and not its size. Prices are nominal US dollars, in each
        publisher's own unit; each is a monthly average of its series, and the change is one average on another. Who
 produces and holds each is from the agencies named under it, on the scale
        of the largest country shown; what it is used for is the site's own background, kept to what is settled.
      </p>
      <SourceLink sources={sources} className="mt-1" />
    </Card>
  );

}
