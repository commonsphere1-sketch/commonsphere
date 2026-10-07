/**
 * The three detail sections of an economy's window: inflation, deficits and
 * tariffs.
 *
 * Each says what the measure is in its publisher's own words, gives the
 * latest figure with its year, and draws the whole series - for inflation
 * and the two balances, the IMF's estimates from 1990 and then its
 * projections, dashed from the first projected year; for tariffs, the World
 * Bank's series to its last year, with nothing after it, because no body
 * projects a tariff.
 *
 * The data is economyDetails.ts (build-economy-details.cjs). Nothing here is
 * worked out but which year is the latest, the highest and the lowest.
 */
import { ArrowsLeftRight, Percent, Scales } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ECONOMY_DETAILS, ECONOMY_DETAILS_ABOUT as ABOUT, ECONOMY_DETAILS_SOURCES as SRC, WORLD_DETAIL, type Dated, type YearSeries } from "../data/economyDetails";
import { ACCENT, ChartNote, ChartTitle, FigureTile } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const FIRST = SRC.firstProjected;
const pct = (v: number, dp = 1) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp)}%`;

/** A series as [year, value] pairs, the unpublished years left out. */
const points = (s: YearSeries | undefined): Dated[] => (s ? s[1].flatMap((v, i) => (v === null ? [] : [[s[0] + i, v] as Dated])) : []);
const at = (s: YearSeries | undefined, year: number) => (s ? (s[1][year - s[0]] ?? null) : null);
/** The latest year that is not a projection. */
const outturn = (s: YearSeries | undefined) => points(s).filter(([y]) => y < FIRST).pop() ?? null;
const lastOf = (s: YearSeries | undefined) => points(s).pop() ?? null;

function Section({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children: ReactNode }) {
  return (
    <div className="modal-tile rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">{title}</h3>
          <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-0.5">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/** What the measure is, as its publisher describes it. */
const About = ({ by, text }: { by: string; text: string }) => (
  <p className="text-[12px] font-sans text-foreground/90 leading-relaxed mb-3">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{by} · </span>
    {text}
  </p>
);

type Row = { year: number; a: number | null; p: number | null; w?: number | null };

/**
 * One series over the years: solid where it is an estimate of what happened,
 * dashed from the first year it is a projection, with the world's beside it
 * where there is one. The scale is the data's own, and zero is marked where
 * the series crosses it.
 */
function OutlookChart({ series, world, name, fmt, projected, label }: { series: YearSeries; world?: YearSeries; name: string; fmt: (v: number) => string; projected: boolean; label: string }) {
  const pts = points(series);
  const rows: Row[] = pts.map(([year, v]) => ({
    year,
    a: !projected || year < FIRST ? v : null,
    // The dashed line starts at the last estimate, so the two join.
    p: projected && year >= FIRST - 1 ? v : null,
    w: world ? at(world, year) : undefined,
  }));
  const values = rows.flatMap((r) => [r.a, r.p, r.w ?? null]).filter((v): v is number => v !== null);
  const crossesZero = Math.min(...values) < 0 && Math.max(...values) > 0;
  const allBelow = Math.max(...values) <= 0;
  return (
    <div className="text-muted-foreground" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
          <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tickCount={8} tick={{ fill: "currentColor", fontSize: 10, fontFamily: "Figures, IBM Plex Mono" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "currentColor", fontSize: 10, fontFamily: "Figures, IBM Plex Mono" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => `${Number(v.toFixed(1))}%`} domain={["auto", "auto"]} />
          {(crossesZero || allBelow) && <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.6} />}
          {projected && pts.some(([y]) => y >= FIRST) && <ReferenceLine x={FIRST - 0.5} stroke="currentColor" strokeOpacity={0.5} strokeDasharray="2 3" label={{ value: "projected", position: "insideTopLeft", fill: "currentColor", fontSize: 9 }} />}
          <Tooltip
            content={({ active, payload, label: year }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as Row;
              const v = r.a ?? r.p;
              return (
                <div className="cs-chart-tip rounded-md p-3 text-xs font-mono">
                  <p className="font-bold mb-1">
                    {year}
                    {projected && Number(year) >= FIRST ? " · projected" : ""}
                  </p>
                  {v !== null && (
                    <p>
                      {name}: <span className="font-bold">{fmt(v)}</span>
                    </p>
                  )}
                  {r.w != null && <p>World: {fmt(r.w)}</p>}
                </div>
              );
            }}
          />
          {world && <Line type="monotone" dataKey="w" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} dot={false} connectNulls isAnimationActive={false} />}
          <Line type="monotone" dataKey="a" stroke={ACCENT} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="p" stroke={ACCENT} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full" style={{ background: ACCENT }} aria-hidden />
          {name}
        </span>
        {projected && pts.some(([y]) => y >= FIRST) && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed" style={{ borderColor: ACCENT }} aria-hidden />
            projected, from {FIRST}
          </span>
        )}
        {world && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded-full bg-current opacity-60" aria-hidden />
            World
          </span>
        )}
      </p>
    </div>
  );
}

const dated = (d: Dated | undefined, fmt: (v: number) => string) => (d ? { value: fmt(d[1]), sub: `${d[0]}` } : null);
/** A latest-year figure is shown only if its year is within the last ten: an older one is history, not the present. */
const recent = (d: Dated | undefined) => (d && d[0] >= FIRST - 10 ? d : undefined);

export default function EconomyDetails({ id, name }: { id: string; name: string }) {
  const d = ECONOMY_DETAILS[id];
  // The tab is there for every economy: one neither body covers is told so, not shown an empty pane.
  if (!d)
    return (
      <p className="modal-tile rounded-lg p-4 text-[12px] font-sans text-muted-foreground leading-relaxed">
        Neither the IMF's World Economic Outlook nor the World Bank's tariff series covers {name}, so no inflation, deficit or tariff figures are published for it
        here.
      </p>
    );

  // ── Inflation ──
  const infl = points(d.inflation);
  const inflNow = outturn(d.inflation);
  const inflNext = at(d.inflation, FIRST);
  const inflEnd = lastOf(d.inflation);
  const past = infl.filter(([y]) => y < FIRST);
  const high = past.length ? past.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
  const low = past.length ? past.reduce((a, b) => (b[1] < a[1] ? b : a)) : null;
  const worldNow = inflNow ? at(WORLD_DETAIL.inflation, inflNow[0]) : null;

  // ── Deficits ──
  const balNow = outturn(d.balance);
  const balEnd = lastOf(d.balance);
  const debtNow = outturn(d.debt);
  const caNow = outturn(d.currentAccount);
  const word = (v: number) => (v < 0 ? "deficit" : v > 0 ? "surplus" : "balance");

  // ── Tariffs ──
  const tariffNow = lastOf(d.tariff);
  const tariffFirst = points(d.tariff)[0] ?? null;
  const duties = recent(d.dutiesOfTax);
  const tariffTiles = (
    [
      ["Simple mean, all products", dated(recent(d.tariffSimple), (v) => pct(v, 2))],
      ["Most-favoured-nation rate, weighted mean", dated(recent(d.tariffMfn), (v) => pct(v, 2))],
      ["On manufactured products", dated(recent(d.tariffManufactures), (v) => pct(v, 2))],
      ["On primary products", dated(recent(d.tariffPrimary), (v) => pct(v, 2))],
      ["Customs duties, share of tax revenue", dated(duties, (v) => pct(v, 1))],
    ] as [string, { value: string; sub: string } | null][]
  ).filter((t): t is [string, { value: string; sub: string }] => !!t[1]);

  return (
    <div className="space-y-4">
      {d.inflation && inflNow && (
        <Section icon={<Percent size={13} weight="bold" />} title="Inflation" sub={`How fast consumer prices rise in ${name}: every year since ${infl[0][0]}, and the IMF's projections to ${inflEnd![0]}`}>
          <About by="IMF" text={ABOUT.inflation.text} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <FigureTile label="Latest estimate" value={pct(inflNow[1])} sub={`a year · ${inflNow[0]}`} world={worldNow !== null ? pct(worldNow) : null} />
            {inflNext !== null && <FigureTile label={`Projected for ${FIRST}`} value={pct(inflNext)} sub="IMF projection" />}
            {inflEnd && inflEnd[0] > FIRST && <FigureTile label={`Projected for ${inflEnd[0]}`} value={pct(inflEnd[1])} sub="IMF projection" />}
            {high && <FigureTile label={`Highest since ${infl[0][0]}`} value={pct(high[1])} sub={`${high[0]}${low ? ` · lowest ${pct(low[1])}, ${low[0]}` : ""}`} />}
          </div>
          <ChartTitle>
            Consumer prices · % change a year · {infl[0][0]}–{inflEnd![0]}
          </ChartTitle>
          <OutlookChart series={d.inflation} name={name} fmt={(v) => pct(v)} projected label={`Inflation in ${name}, ${infl[0][0]} to ${inflEnd![0]}; ${pct(inflNow[1])} in ${inflNow[0]}.`} />
          <ChartNote className="mt-2">
            The average of the year's consumer prices against the year before. To {FIRST - 1} the figures are the IMF's estimates of what happened; from {FIRST} they are
            its projections, drawn dashed, and are revised with each edition. The scale is the series' own, so a year of very high inflation flattens the rest; the
            world's rate for the latest year is on the first tile, not on the chart, where its early-1990s peak would do the same.
          </ChartNote>
          <SourceLink sources={[SRC.weo]} className="mt-2" />
        </Section>
      )}

      {(d.balance || d.currentAccount) && (
        <Section icon={<Scales size={13} weight="fill" />} title="Deficits" sub="What the government borrows or saves each year, what it owes, and the country's balance with the rest of the world">
          {d.balance && balNow && <About by="IMF" text={ABOUT.balance.text} />}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {balNow && <FigureTile label={`Government ${word(balNow[1])}`} value={signed(balNow[1])} sub={`of GDP · ${balNow[0]}`} />}
            {d.primaryBalance && <FigureTile label="Before interest (primary balance)" value={signed(d.primaryBalance[1])} sub={`of GDP · ${d.primaryBalance[0]}`} />}
            {d.revenue && <FigureTile label="Government revenue" value={pct(d.revenue[1])} sub={`of GDP · ${d.revenue[0]}`} />}
            {d.expenditure && <FigureTile label="Government spending" value={pct(d.expenditure[1])} sub={`of GDP · ${d.expenditure[0]}`} />}
            {debtNow && <FigureTile label="Government gross debt" value={pct(debtNow[1])} sub={`of GDP · ${debtNow[0]}`} />}
            {caNow && <FigureTile label={`Current account ${word(caNow[1])}`} value={signed(caNow[1])} sub={`of GDP · ${caNow[0]}`} />}
          </div>
          {d.balance && balNow && (
            <>
              <ChartTitle>
                Government lending (+) or borrowing (−) · % of GDP · {points(d.balance)[0][0]}–{balEnd![0]}
              </ChartTitle>
              <OutlookChart series={d.balance} name={name} fmt={(v) => signed(v)} projected label={`The government balance of ${name} as a share of GDP; ${signed(balNow[1])} in ${balNow[0]}.`} />
            </>
          )}
          {d.currentAccount && caNow && (
            <>
              <ChartTitle className="mt-4">
                Current account balance · % of GDP · {points(d.currentAccount)[0][0]}–{lastOf(d.currentAccount)![0]}
              </ChartTitle>
              <p className="text-[11px] font-sans text-muted-foreground leading-relaxed mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest">IMF · </span>
                {ABOUT.currentAccount.text}
              </p>
              <OutlookChart series={d.currentAccount} name={name} fmt={(v) => signed(v)} projected label={`The current account balance of ${name} as a share of GDP; ${signed(caNow[1])} in ${caNow[0]}.`} />
            </>
          )}
          <ChartNote className="mt-2">
            Below the line is a deficit, above it a surplus. The government's balance is all levels of government together; the current account is the whole
            country's dealings with the rest of the world, not the government's. Dashed years are the IMF's projections. Revenue, spending and the primary
            balance are from its Fiscal Monitor, for the latest year that is not a projection.
          </ChartNote>
          <SourceLink sources={[SRC.weo, ...(d.revenue || d.expenditure || d.primaryBalance ? [SRC.fiscalMonitor] : [])]} className="mt-2" />
        </Section>
      )}

      {d.tariff && tariffNow && tariffFirst && (
        <Section icon={<ArrowsLeftRight size={13} weight="bold" />} title="Tariffs" sub={`The duty ${name} charges on the goods it imports, as the World Bank measures it, to ${tariffNow[0]}`}>
          <About by="World Bank" text={ABOUT.tariff.text} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <FigureTile label="Applied rate, weighted mean" value={pct(tariffNow[1], 2)} sub={`all products · ${tariffNow[0]}`} />
            {tariffTiles.map(([label, t]) => (
              <FigureTile key={label} label={label} value={t.value} sub={t.sub} />
            ))}
          </div>
          <ChartTitle>
            Tariff rate, applied, weighted mean, all products · % · {tariffFirst[0]}–{tariffNow[0]}
          </ChartTitle>
          <OutlookChart series={d.tariff} name={name} fmt={(v) => pct(v, 2)} projected={false} label={`The applied tariff rate of ${name}, ${tariffFirst[0]} to ${tariffNow[0]}: ${pct(tariffFirst[1], 2)} to ${pct(tariffNow[1], 2)}.`} />
          <ChartNote className="mt-2">
            The series ends in {tariffNow[0]}, the last year the World Bank has published: a tariff raised or cut since is not in it, and no body publishes a
            projection of one, so none is drawn. A weighted mean counts each product by how much of it is imported, so a high duty on goods that are barely
            imported moves it little; the simple mean counts every product alike. The Bank publishes no world figure to set beside it.
          </ChartNote>
          <SourceLink sources={[SRC.tariffs]} className="mt-2" />
        </Section>
      )}
    </div>
  );
}
