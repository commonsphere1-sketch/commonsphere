/**
 * Tax, in an economy's window: the rates it sets on companies' profits at its
 * centre (the federal rate, in a federation) and below it (state and local),
 * its top rate on personal income, and what its government takes in tax -
 * each as it stands now, over the years, and beside an average
 * (data/taxHistory.ts; what revenue is made of from data/countryTax.ts).
 *
 * The rates are the OECD's statutory rates and the revenue the World Bank's,
 * from the IMF. Two things are worked out and are said to be where they are
 * shown: the average of a rate in a year - the plain average over the
 * jurisdictions the OECD gives it for, each counted once - and, for the
 * European Union, its rates as the plain average over its members. The
 * world's revenue is the World Bank's own figure. What a rate was at the
 * start, its highest and its lowest are read off its series; the change
 * between two years is a subtraction, and is said to be worked out.
 *
 * A figure a body's table gives that cannot be a rate - over 100% - is not
 * drawn, and the tab says which and what it was. An economy neither body
 * covers is told so.
 */
import { Bank, ChartLineUp, Percent, UserFocus } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COUNTRY_TAX } from "../data/countryTax";
import { TAX_AVERAGE, TAX_EU, TAX_EU_AMONG, TAX_HISTORY, TAX_HISTORY_LEFT_OUT, TAX_HISTORY_SOURCES as SRC, TAX_REVENUE_WORLD, type TaxAverage, type TaxHistory, type TaxSeries } from "../data/taxHistory";
import { ACCENT, ChartNote, ChartTitle, FigureTile, PartsDonut } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const pct = (v: number, dp = 1) => `${Number(v.toFixed(dp))}%`;
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Number(v.toFixed(1)))} ${Math.abs(Number(v.toFixed(1))) === 1 ? "point" : "points"}`;
const lastOf = (s: TaxSeries | undefined) => (s?.length ? s[s.length - 1] : null);
const atYear = (s: [number, number, ...number[]][] | undefined, y: number) => s?.find((p) => p[0] === y) ?? null;
const highest = (s: TaxSeries) => s.reduce((a, b) => (b[1] > a[1] ? b : a));
const lowest = (s: TaxSeries) => s.reduce((a, b) => (b[1] < a[1] ? b : a));
/** The years a figure held without a break, to the last year given: "since 2018". */
const since = (s: TaxSeries) => {
  const end = s[s.length - 1];
  let i = s.length - 1;
  while (i > 0 && s[i - 1][1] === end[1]) i--;
  return s[i][0];
};
/** A country's name from its ISO code, as the browser has it. */
const REGION = new Intl.DisplayNames(["en"], { type: "region" });
const GREY = "currentColor";
const STATE = "#f59e0b";
const CENTRE = "#14b8a6";

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

type Drawn = { key: string; label: string; color: string; series: [number, number, ...number[]][]; dashed?: boolean; faint?: boolean };
/** Series over the years on one scale from zero, so that a rate's fall is seen at its true size. */
function Years({ lines, label }: { lines: Drawn[]; label: string }) {
  const shown = lines.filter((l) => l.series.length);
  const years = [...new Set(shown.flatMap((l) => l.series.map((p) => p[0])))].sort((a, b) => a - b);
  const rows = years.map((year) => ({ year, ...Object.fromEntries(shown.map((l) => [l.key, atYear(l.series, year)?.[1] ?? null])) }));
  return (
    <div className="text-muted-foreground" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.15} vertical={false} />
          <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tickCount={8} allowDecimals={false} tick={{ fill: "currentColor", fontSize: 10, fontFamily: "Figures, IBM Plex Mono" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "currentColor", fontSize: 10, fontFamily: "Figures, IBM Plex Mono" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${Number(v.toFixed(1))}%`} domain={[0, "auto"]} />
          <Tooltip
            content={({ active, payload, label: year }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as Record<string, number | null>;
              return (
                <div className="cs-chart-tip rounded-md p-3 text-xs font-mono">
                  <p className="font-bold mb-1">{year}</p>
                  {shown.map((l) => (r[l.key] == null ? null : <p key={l.key}>{`${l.label}: ${pct(r[l.key] as number, 2)}`}</p>))}
                </div>
              );
            }}
          />
          {shown.map((l) => (
            <Line key={l.key} type="linear" dataKey={l.key} stroke={l.color} strokeOpacity={l.faint ? 0.55 : 1} strokeWidth={l.faint ? 1.25 : 2} strokeDasharray={l.dashed ? "5 4" : undefined} dot={false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono mt-1">
        {shown.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className={`w-4 ${l.dashed ? "border-t-2 border-dashed" : "h-0.5 rounded-full"}`} style={l.dashed ? { borderColor: l.color } : { background: l.color, opacity: l.faint ? 0.6 : 1 }} aria-hidden />
            {l.label}
          </span>
        ))}
      </p>
    </div>
  );
}
/** What a series was at its start, at its highest and at its lowest, and how far it has moved: read off it, the move worked out. */
function Then({ s, what }: { s: TaxSeries; what: string }) {
  if (s.length < 2) return null;
  const first = s[0];
  const last = s[s.length - 1];
  const hi = highest(s);
  const lo = lowest(s);
  return (
    <div className="tile-fill gap-2 mt-3">
      <FigureTile label={`${what} in ${first[0]}`} value={pct(first[1])} sub="the first year held" />
      <FigureTile label="Highest" value={pct(hi[1])} sub={`${hi[0]}`} />
      <FigureTile label="Lowest" value={pct(lo[1])} sub={`${lo[0]}`} />
      <FigureTile label={`Change, ${first[0]} to ${last[0]}`} value={signed(last[1] - first[1])} sub="percentage points · worked out here" />
    </div>
  );
}

export default function EconomyTax({ code, name, union = false }: { /** The economy's ISO 3166-1 code, where it is a country or a territory. */ code?: string; name: string; /** The European Union: its members' rates averaged, and the World Bank's figure for it. */ union?: boolean }) {
  const h: TaxHistory | undefined = union ? TAX_EU : code ? TAX_HISTORY[code] : undefined;
  const now = !union && code ? COUNTRY_TAX[code] : undefined;
  const left = !union && code ? TAX_HISTORY_LEFT_OUT[code] : undefined;
  if (!h || !Object.values(h).some((s) => s?.length))
    return (
      <p className="modal-tile rounded-lg p-4 text-[12px] font-sans text-muted-foreground leading-relaxed">
        Neither the OECD's Tax Database nor the World Bank's series of tax revenue covers {name}, so no tax figures are published for it here.
      </p>
    );
  const avgNote = (a: TaxAverage, y: number) => {
    const p = atYear(a, y);
    return p ? { value: pct(p[1]), sub: `plain average of ${p[2]} jurisdictions · ${y} · worked out here` } : null;
  };
  const euNote = (key: "central" | "combined") => {
    const a = TAX_EU_AMONG[key];
    const y = lastOf(h?.[key])?.[0];
    return union && a ? `the plain average of ${a.among} of its 27 members${a.without.length ? ` (the OECD gives none for ${a.without.map((cc) => REGION.of(cc) ?? cc).join(", ")})` : ""} · ${y} · worked out here` : null;
  };

  const central = lastOf(h.central);
  const local = lastOf(h.local);
  const combined = lastOf(h.combined);
  const top = lastOf(h.topIncome);
  const revenue = lastOf(h.revenue);
  const combinedAvg = combined ? avgNote(TAX_AVERAGE.combined, combined[0]) : null;
  const topAvg = top ? avgNote(TAX_AVERAGE.topIncome, top[0]) : null;
  const world = revenue ? atYear(TAX_REVENUE_WORLD, revenue[0]) : null;
  const mix = now?.mix;
  const sources = [...(h.combined?.length || h.central?.length ? [SRC.corporate] : []), ...(h.topIncome?.length ? [SRC.income] : []), ...(h.revenue?.length || mix ? [SRC.revenue] : [])];

  return (
    <div className="space-y-4">
      {(central || combined) && (
        <Section icon={<Percent size={13} weight="bold" />} title="Tax on companies' profits" sub="The statutory rate of corporate income tax: what the centre sets, what states and localities add, and the two together">
          <div className="tile-fill gap-2">
            {central && <FigureTile label={union ? "Central government rate" : "Federal · central government rate"} value={pct(central[1], 2)} sub={euNote("central") ?? `statutory · ${central[0]}${h.central && since(h.central) < central[0] ? ` · unchanged since ${since(h.central)}` : ""}`} />}
            {local ? (
              <FigureTile label="State and local · sub-central rate" value={pct(local[1], 2)} sub={`the OECD's one rate for the country's states and localities · ${local[0]}`} />
            ) : (
              !union && <FigureTile label="State and local · sub-central rate" value={<span className="font-sans text-sm font-normal text-muted-foreground">None given</span>} sub={`the OECD gives no sub-central rate for ${name}`} />
            )}
            {combined && <FigureTile label="Combined rate" value={pct(combined[1], 2)} sub={euNote("combined") ?? `central and sub-central together, as the OECD combines them · ${combined[0]}`} />}
            {combinedAvg && <FigureTile label="Average combined rate" value={combinedAvg.value} sub={combinedAvg.sub} />}
          </div>
          {h.combined && h.combined.length > 1 && (
            <div className="mt-4">
              <ChartTitle>
                The rates over the years · % of profits · {h.combined[0][0]} to {h.combined[h.combined.length - 1][0]}
              </ChartTitle>
              <Years
                label={`${name}'s statutory rates of corporate income tax, ${h.combined[0][0]} to ${h.combined[h.combined.length - 1][0]}`}
                lines={[
                  { key: "combined", label: "Combined", color: ACCENT, series: h.combined },
                  // Where there is no sub-central rate the central rate is the combined one, and is not drawn twice.
                  ...(h.local?.length ? [{ key: "central", label: union ? "Central" : "Federal · central", color: CENTRE, series: h.central ?? [] }] : []),
                  { key: "local", label: "State and local", color: STATE, series: h.local ?? [] },
                  { key: "avg", label: "Average of the jurisdictions the OECD covers", color: GREY, series: TAX_AVERAGE.combined, faint: true },
                ]}
              />
              <Then s={h.combined} what="Combined rate" />
            </div>
          )}
          <ChartNote className="mt-3">
            Statutory rates: what the law sets on a company's taxable profit, before any relief - not what companies in fact pay. A sub-central rate is the OECD's single figure for a country's states, provinces or localities, whose own
            rates differ. The average counts each jurisdiction once, whatever its size.
          </ChartNote>
        </Section>
      )}

      {top && h.topIncome && (
        <Section icon={<UserFocus size={13} weight="bold" />} title="Tax on the highest incomes" sub="The top statutory rate of personal income tax, central and sub-central government together">
          <div className="tile-fill gap-2">
            <FigureTile label="Top rate" value={pct(top[1], 1)} sub={`statutory · ${top[0]}`} />
            {topAvg && <FigureTile label="Average top rate" value={topAvg.value} sub={topAvg.sub.replace("jurisdictions", "OECD members")} />}
          </div>
          {h.topIncome.length > 1 && (
            <div className="mt-4">
              <ChartTitle>
                The top rate over the years · % of income · {h.topIncome[0][0]} to {top[0]}
              </ChartTitle>
              <Years
                label={`${name}'s top statutory rate of personal income tax, ${h.topIncome[0][0]} to ${top[0]}`}
                lines={[
                  { key: "top", label: name, color: ACCENT, series: h.topIncome },
                  { key: "avg", label: "Average of the OECD's members", color: GREY, series: TAX_AVERAGE.topIncome, faint: true },
                ]}
              />
              <Then s={h.topIncome} what="Top rate" />
            </div>
          )}
          {left?.topIncome && (
            <ChartNote className="mt-3">
              Left out: the OECD's table gives {left.topIncome.map(([y, v]) => `${v}% for ${y}`).join(" and ")}. A rate of more than the whole of an income is not drawn as one, so {left.topIncome.length === 1 ? "that year is" : "those years are"} missing
              from the line and from the highest above.
            </ChartNote>
          )}
        </Section>
      )}

      {revenue && h.revenue && (
        <Section icon={<Bank size={13} weight="bold" />} title="What the government takes in tax" sub="Tax revenue of the central government, as a share of the economy">
          <div className="tile-fill gap-2">
            <FigureTile label="Tax revenue" value={pct(revenue[1])} sub={`of GDP · ${revenue[0]}`} world={world ? pct(world[1]) : null} />
          </div>
          {h.revenue.length > 1 && (
            <div className="mt-4">
              <ChartTitle>
                Tax revenue over the years · % of GDP · {h.revenue[0][0]} to {revenue[0]}
              </ChartTitle>
              <Years
                label={`${name}'s tax revenue as a share of GDP, ${h.revenue[0][0]} to ${revenue[0]}`}
                lines={[
                  { key: "rev", label: name, color: ACCENT, series: h.revenue },
                  { key: "world", label: "World · the World Bank's figure", color: GREY, series: TAX_REVENUE_WORLD, faint: true },
                ]}
              />
              <Then s={h.revenue} what="Tax revenue" />
            </div>
          )}
          {mix && (
            <div className="mt-4">
              <ChartTitle>What the central government's revenue is made of · % of revenue · {mix.y}</ChartTitle>
              <PartsDonut
                label={`What the revenue of ${name}'s central government is made of, ${mix.y}`}
                parts={(
                  [
                    ["Taxes on income, profits and capital gains", mix.income],
                    ["Taxes on goods and services", mix.goods],
                    ["Taxes on international trade", mix.trade],
                    ["Other taxes", mix.other],
                    ["Social contributions", mix.social],
                    ["Grants and other revenue", mix.grants],
                  ] as [string, number | undefined][]
                ).flatMap(([label, v]) => (v == null ? [] : [{ label, value: v, text: `${v}%` }]))}
              />
            </div>
          )}
          {left?.revenue && (
            <ChartNote className="mt-3">
              Left out: the World Bank's series gives {left.revenue.map(([y, v]) => `${v}% of GDP for ${y}`).join(", ")}. Tax of more than the whole of the economy is not drawn as a share of it.
            </ChartNote>
          )}
          <ChartNote className="mt-3">The central government's taxes only: what states, provinces and localities collect themselves is not in it, so a federation's figure is lower than its whole tax take.</ChartNote>
        </Section>
      )}

      <div className="flex items-start gap-2 text-[10px] font-sans text-muted-foreground leading-snug">
        <ChartLineUp size={12} className="shrink-0 mt-px" aria-hidden />
        <span>Each line starts in the first year its publisher holds a figure: the OECD's rates in 2000, the World Bank's revenue as early as 1972. Earlier years are not held, and none are filled in.</span>
      </div>
      <SourceLink sources={sources} />
    </div>
  );
}
