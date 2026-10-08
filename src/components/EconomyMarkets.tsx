/**
 * What "Where the economy stands" does not say, in charts: growth, prices
 * and jobs drawn together year by year (where stagflation would show), how
 * steady the economy has been, its stock market, and what borrowing costs.
 *
 * Every line is a World Bank series for the country (economyMarkets.ts,
 * build-economy-markets.cjs), drawn as published: a year with no figure is a
 * gap in its line, not a guess. Three things are worked out here and said to
 * be: the highest and lowest of a series' last ten years, a count of the
 * years output fell, and the sum of inflation and unemployment (the "misery
 * index"), which is only two published figures added. No verdict is given,
 * and nothing is forecast. A government bond yield is not shown because no
 * open source gives one for every country; the pane says so.
 *
 * In the site's chart language: dashed rules, small mono ticks, lines that do
 * not animate, and a legend that names every line with its latest figure in
 * ink, so nothing is told by colour alone. Loaded with its data when an
 * economy's window opens.
 */
import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import type { Economy } from "../data/economiesData";
import { ECONOMY_MARKETS, ECONOMY_MARKETS_SOURCE, type MarketSeries } from "../data/economyMarkets";
import { ECONOMY_ISO3 } from "../data/resourceRents";
import { ChartNote, ChartTitle, FigureRow, worldFor } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const COLOR = { growth: "#0d9488", inflation: "#d97706", unemployment: "#7c3aed", stockValue: "#2563eb", stockTraded: "#c026d3", lendingRate: "#b45309", realRate: "#65a30d" };
const pct = (v: number, dp = 1) => `${v.toFixed(dp)}%`;
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}%`;

type Point = [year: number, value: number];
/** A series' years that have a figure. */
const pointsOf = (s: MarketSeries | undefined): Point[] => (s ? s[1].flatMap((v, i): Point[] => (v === null ? [] : [[s[0] + i, v]])) : []);
const lastOf = (p: Point[]) => p[p.length - 1];
/** The highest and the lowest of the last ten years a series has. */
function tenYears(p: Point[]) {
  const ten = p.slice(-10);
  if (ten.length < 3) return null;
  const hi = ten.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lo = ten.reduce((a, b) => (b[1] < a[1] ? b : a));
  return { hi, lo, from: ten[0][0], to: ten[ten.length - 1][0], n: ten.length, ten };
}

type LineSpec = { key: string; label: string; color: string; points: Point[] };

/** Several series on one set of axes, each named in the legend with its latest figure. */
function Chart({ lines, label, zero = false }: { lines: LineSpec[]; label: string; zero?: boolean }) {
  const { theme } = useTheme();
  const muted = theme === "light" ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const grid = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const years = [...new Set(lines.flatMap((l) => l.points.map(([y]) => y)))].sort((a, b) => a - b);
  const data = years.map((y) => {
    const row: Record<string, number | string | null> = { year: String(y) };
    for (const l of lines) row[l.key] = l.points.find(([py]) => py === y)?.[1] ?? null;
    return row;
  });
  const tick = { fontSize: 9, fill: muted, fontFamily: "monospace" };
  return (
    <>
      <div role="img" aria-label={`${label}: ${lines.map((l) => `${l.label} ${pct(lastOf(l.points)[1])} in ${lastOf(l.points)[0]}`).join("; ")}.`}>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={data} margin={{ top: 4, right: 6, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} minTickGap={18} />
            <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            {zero && <ReferenceLine y={0} stroke={muted} strokeWidth={1} />}
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, fontFamily: "monospace" }} formatter={(v: number, n: string) => [pct(v), lines.find((l) => l.key === n)?.label ?? n]} />
            {lines.map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
        {lines.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full" style={{ background: l.color }} aria-hidden />
            <span className="text-[10px] font-sans text-muted-foreground">
              {l.label}, {lastOf(l.points)[0]}
            </span>
            <span className="text-[10px] font-mono font-bold text-foreground">{pct(lastOf(l.points)[1])}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="modal-tile rounded-xl p-4 min-w-0">
      <ChartTitle>{title}</ChartTitle>
      {children}
    </div>
  );
}

export default function EconomyMarkets({ economy }: { economy: Economy }) {
  const iso3 = ECONOMY_ISO3[economy.id];
  const m = iso3 ? ECONOMY_MARKETS[iso3] : undefined;
  if (!m) return null;
  const growth = pointsOf(m.growth);
  const inflation = pointsOf(m.inflation);
  const unemployment = pointsOf(m.unemployment);
  const stockValue = pointsOf(m.stockValue);
  const stockTraded = pointsOf(m.stockTraded);
  const stockChange = pointsOf(m.stockChange);
  const lendingRate = pointsOf(m.lendingRate);
  const realRate = pointsOf(m.realRate);
  const line = (key: keyof typeof COLOR, label: string, points: Point[]): LineSpec[] => (points.length >= 3 ? [{ key, label, color: COLOR[key], points }] : []);
  const span = (lines: LineSpec[]) => `${Math.min(...lines.map((l) => l.points[0][0]))}–${Math.max(...lines.map((l) => lastOf(l.points)[0]))}`;

  const together = [...line("growth", "Growth", growth), ...line("inflation", "Inflation", inflation), ...line("unemployment", "Unemployment", unemployment)];
  // Inflation and unemployment for the same year, the latest both have: their sum, and the world's for that year.
  const both = [...inflation].reverse().find(([y]) => unemployment.some(([uy]) => uy === y));
  const jobless = both ? unemployment.find(([y]) => y === both[0]) : undefined;
  const worldBoth = both ? [worldFor("inflation", both[0]), worldFor("unemployment", both[0])] : [null, null];
  const g10 = tenYears(growth);
  const i10 = tenYears(inflation);
  const s10 = tenYears(stockChange);
  const stocks = [...line("stockValue", "Value of listed companies", stockValue), ...line("stockTraded", "Shares traded in the year", stockTraded)];
  const rates = [...line("lendingRate", "Lending rate", lendingRate), ...line("realRate", "Real interest rate", realRate)];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Markets, prices and stability · year by year</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {together.length > 0 && (
          <Tile title={`Growth, prices and jobs · % · ${span(together)}`}>
            <Chart lines={together} label={`Growth, inflation and unemployment in ${economy.name}`} zero />
            {both && jobless && (
              <div className="mt-3">
                <FigureRow
                  label={`Inflation and unemployment together · ${both[0]}`}
                  value={pct(both[1] + jobless[1])}
                  sub={`${pct(both[1])} + ${pct(jobless[1])}, the two added - the "misery index"${worldBoth[0] !== null && worldBoth[1] !== null ? ` · the world's that year ${pct(worldBoth[0] + worldBoth[1])}` : ""}`}
                />
              </div>
            )}
            <ChartNote className="mt-2">
              Stagflation is the name for prices rising fast while output stalls and unemployment stays high. The three are drawn on one scale so that it can be seen where it
              happened: inflation above growth, with unemployment climbing. The chart draws it; it does not call it.
            </ChartNote>
          </Tile>
        )}

        {(g10 || i10) && (
          <Tile title="How steady it has been · the last ten years on record">
            {g10 && (
              <>
                <FigureRow label="Growth at its highest" value={signed(g10.hi[1])} sub={String(g10.hi[0])} />
                <FigureRow label="Growth at its lowest" value={signed(g10.lo[1])} sub={String(g10.lo[0])} />
                <FigureRow
                  label="Years its output fell"
                  value={`${g10.ten.filter(([, v]) => v < 0).length} of ${g10.n}`}
                  sub={`${g10.from}–${g10.to} · a swing of ${(g10.hi[1] - g10.lo[1]).toFixed(1)} points between its best year and its worst`}
                />
              </>
            )}
            {i10 && (
              <>
                <FigureRow label="Inflation at its highest" value={pct(i10.hi[1])} sub={String(i10.hi[0])} />
                <FigureRow label="Inflation at its lowest" value={pct(i10.lo[1])} sub={String(i10.lo[0])} />
              </>
            )}
            <ChartNote className="mt-2">Read off the lines above: the highest and lowest of the last ten years each series has. A wider swing is a less steady economy; no single number for volatility is made of it.</ChartNote>
          </Tile>
        )}

        <Tile title={stocks.length > 0 ? `Stock market · % of the economy's output · ${span(stocks)}` : "Stock market"}>
          {stocks.length > 0 ? (
            <>
              <Chart lines={stocks} label={`The stock market of ${economy.name} against its output`} />
              {s10 && (
                <div className="mt-3">
                  <FigureRow label={`Share prices over the year · ${lastOf(stockChange)[0]}`} value={signed(lastOf(stockChange)[1])} sub="S&P Global Equity Indices, change in US dollars" />
                  <FigureRow label="Their best year of the last ten on record" value={signed(s10.hi[1])} sub={String(s10.hi[0])} />
                  <FigureRow label="Their worst" value={signed(s10.lo[1])} sub={`${s10.lo[0]} · a swing of ${(s10.hi[1] - s10.lo[1]).toFixed(0)} points between the two`} />
                </div>
              )}
              <ChartNote className="mt-2">
                The value of the companies listed on its exchanges, and of the shares that changed hands in the year, each against a year's output. A market worth more than the
                economy is over 100%.
              </ChartNote>
            </>
          ) : (
            <ChartNote>The World Bank publishes no stock market series for {economy.name}, and none is put in its place.</ChartNote>
          )}
        </Tile>

        <Tile title={rates.length > 0 ? `What borrowing costs · % a year · ${span(rates)}` : "What borrowing costs"}>
          {rates.length > 0 ? (
            <>
              <Chart lines={rates} label={`Interest rates in ${economy.name}`} zero />
              <ChartNote className="mt-2">
                The lending rate is what banks charge their best private borrowers; the real rate is that with inflation taken out, so it can fall below zero when prices rise
                faster than interest.
              </ChartNote>
            </>
          ) : (
            <ChartNote>The World Bank publishes no interest rate series for {economy.name}.</ChartNote>
          )}
          <ChartNote className="mt-2">
            Government bonds: no yield is shown. The World Bank publishes none, and no open source gives one for every country on one footing; the government's debt is in the lines
            above and under Inflation, Deficits & Tariffs.
          </ChartNote>
        </Tile>
      </div>
      <SourceLink sources={[{ label: `${ECONOMY_MARKETS_SOURCE.label} · read on ${ECONOMY_MARKETS_SOURCE.retrieved}`, url: ECONOMY_MARKETS_SOURCE.url }]} className="mt-2" />
    </div>
  );
}
