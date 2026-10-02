/**
 * Charts for a category of figures: each pillar of the Worldview page and
 * each group of the Trends page gets a pair, drawn from data the site
 * already holds.
 *
 * Three kinds of chart, each a published series against the years:
 *   "regions"  one figure for each of the World Bank's seven regions
 *              (regionSeries.ts, the Bank's own regional aggregates);
 *   "world"    several world figures that share a unit, a line each
 *              (worldview.ts);
 *   "stack"    the parts of a whole, stacked: the world's people by the kind
 *              of regime they live under, the displaced by kind.
 *
 * Under each chart a sentence reads its ends off the series - the highest
 * and lowest region, where each line began and where it stands - and its
 * source is linked. Nothing is estimated; the one figure worked out is the
 * share living in an electoral democracy, which is V-Dem's share for all
 * democracies less its share for liberal ones, and the chart says so.
 *
 * Colours are a fixed order the palette validator passed on the light and
 * the dark surface (seven for the regions, the first five for the rest);
 * every line is named in a legend with its latest figure, so nothing is
 * told by colour alone.
 */
import { useId, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { DISPLACED_BY_KIND, WORLD, type WorldIndicator, type WorldPoint } from "../data/worldview";
import { REGION_SERIES } from "../data/regionSeries";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };

export type ChartDef =
  | { kind: "regions"; id: string; title: string }
  | { kind: "world"; ids: string[]; title: string; unit: string }
  | { kind: "stack"; key: "regimes" | "displaced"; title: string };

const ORDERED = ["#d97706", "#2563eb", "#0d9488", "#c026d3", "#65a30d", "#7c3aed", "#b45309"];
/** The Bank's regions in the order they take those colours, with names short enough for a legend. */
const REGION_NAME: Record<string, string> = {
  EAS: "East Asia & Pacific",
  ECS: "Europe & Central Asia",
  LCN: "Latin America & Caribbean",
  MEA: "Middle East, N. Africa, Afghanistan & Pakistan",
  NAC: "North America",
  SAS: "South Asia",
  SSF: "Sub-Saharan Africa",
};
const REGION_ORDER = Object.keys(REGION_NAME);

// ── Printing a figure ──────────────────────────────────────────────────────

const compact = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e12 ? `${(v / 1e12).toFixed(a >= 1e13 ? 1 : 2)}T` : a >= 1e9 ? `${(v / 1e9).toFixed(a >= 1e10 ? 1 : 2)}bn` : a >= 1e6 ? `${(v / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M` : a >= 1e4 ? `${Math.round(v / 1e3)}k` : Math.round(v).toLocaleString("en-US");
};
/** A value as its figure's format prints it. */
function print(ind: Pick<WorldIndicator, "format" | "dp">, v: number): string {
  if (ind.format === "pct") return `${v.toFixed(ind.dp)}%`;
  if (ind.format === "usd") return `$${compact(v)}`;
  if (ind.format === "count") return compact(v);
  return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(ind.dp);
}
/** The same, shorter, for an axis. */
function tickOf(ind: Pick<WorldIndicator, "format" | "dp">, v: number): string {
  if (ind.format === "pct") return `${Number(v.toFixed(Math.min(ind.dp, 1)))}%`;
  if (ind.format === "usd") return `$${compact(v)}`;
  if (ind.format === "count") return compact(v);
  return Math.abs(v) >= 1000 ? compact(v) : String(Number(v.toFixed(ind.dp)));
}
const last = <T,>(a: T[]) => a[a.length - 1];

// ── Look ───────────────────────────────────────────────────────────────────

function useChartLook() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const head = isLight ? "#0f172a" : "#f1f0ff";
  const muted = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.5)";
  return {
    head,
    muted,
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    card: {
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
      border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    },
    axis: { tick: { fontSize: 9, fill: muted, fontFamily: "monospace" }, axisLine: false, tickLine: false },
    tooltip: {
      contentStyle: {
        background: isLight ? "#ffffff" : "#15151a",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        fontSize: 11,
        fontFamily: "monospace",
        color: head,
      },
      // The lines of a hover box are in ink, not in their series' colour.
      itemStyle: { color: head },
      labelStyle: { color: muted },
    },
  };
}
type Look = ReturnType<typeof useChartLook>;

/** A chart's frame: a card of its own on a page of cards, or a tile inside a card. */
function Frame({ frame, look, title, kicker, children }: { frame: "card" | "tile"; look: Look; title: string; kicker: string; children: ReactNode }) {
  return (
    <div className={frame === "card" ? "rounded-2xl p-5 min-w-0" : "modal-tile rounded-xl p-3.5 min-w-0"} style={frame === "card" ? look.card : undefined}>
      <h4 className="text-[13px] font-bold font-sans leading-snug" style={{ color: look.head }}>
        {title}
      </h4>
      <p className="text-[9px] font-mono uppercase tracking-widest mt-1 mb-3 leading-snug" style={{ color: look.muted }}>
        {kicker}
      </p>
      {children}
    </div>
  );
}

function Legend({ look, items }: { look: Look; items: { color: string; label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
      {items.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="w-3.5 h-0 border-t-2 shrink-0" style={{ borderColor: l.color }} aria-hidden />
          <span className="text-[10px] font-sans" style={{ color: look.muted }}>
            {l.label}
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ color: look.head }}>
            {l.value}
          </span>
        </span>
      ))}
    </div>
  );
}

function Reading({ look, children }: { look: Look; children: ReactNode }) {
  return (
    <p className="text-[11px] font-sans leading-relaxed mt-3" style={{ color: look.muted }}>
      {children}
    </p>
  );
}

type LineDef = { key: string; label: string; color: string; series: WorldPoint[] };

/** Several series against the years, a line each. */
function Lines({ look, lines, fmt, tick, label }: { look: Look; lines: LineDef[]; fmt: (v: number) => string; tick: (v: number) => string; label: string }) {
  const years = [...new Set(lines.flatMap((l) => l.series.map(([y]) => y)))].sort((a, b) => a - b);
  const data = years.map((y) => ({ year: String(y), ...Object.fromEntries(lines.map((l) => [l.key, l.series.find(([x]) => x === y)?.[1] ?? null])) }));
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" {...look.axis} minTickGap={22} />
          <YAxis {...look.axis} width={48} tickFormatter={tick} domain={["auto", "auto"]} />
          <Tooltip {...look.tooltip} formatter={(v: number, k: string) => [fmt(v), lines.find((l) => l.key === k)?.label ?? k]} />
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── The three kinds ────────────────────────────────────────────────────────

function RegionsChart({ def, frame, look }: { def: Extract<ChartDef, { kind: "regions" }>; frame: "card" | "tile"; look: Look }) {
  const ind = WORLD[def.id];
  const data = REGION_SERIES[def.id];
  if (!ind || !data) return null;
  const lines: LineDef[] = data.regions.map((r) => ({ key: r.code, label: REGION_NAME[r.code] ?? r.name, color: ORDERED[REGION_ORDER.indexOf(r.code)] ?? ORDERED[0], series: r.series }));
  // The latest year every region has, and the earliest: the ends the sentence compares.
  const end = Math.min(...lines.map((l) => last(l.series)[0]));
  const start = Math.max(...lines.map((l) => l.series[0][0]));
  const at = (l: LineDef, y: number) => l.series.find(([x]) => x === y)?.[1];
  const ranked = lines.flatMap((l) => (at(l, end) !== undefined ? [{ l, v: at(l, end) as number }] : [])).sort((a, b) => b.v - a.v);
  const top = ranked[0];
  const bottom = last(ranked);
  const fmt = (v: number) => print(ind, v);
  const was = (l: LineDef) => {
    const v = at(l, start);
    return v === undefined ? "" : `, from ${fmt(v)} in ${start}`;
  };
  return (
    <Frame frame={frame} look={look} title={def.title} kicker={`${ind.unit} · the World Bank's regions · ${start}–${Math.max(...lines.map((l) => last(l.series)[0]))}`}>
      <Lines look={look} lines={lines} fmt={fmt} tick={(v) => tickOf(ind, v)} label={`${def.title}, ${start} to ${end}: ${ranked.map((r) => `${r.l.label} ${fmt(r.v)}`).join(", ")} in ${end}.`} />
      <Legend look={look} items={lines.map((l) => ({ color: l.color, label: l.label, value: `${fmt(last(l.series)[1])}${last(l.series)[0] !== end ? ` (${last(l.series)[0]})` : ""}` }))} />
      {top && bottom && (
        <Reading look={look}>
          In {end} the figure was highest in {top.l.label}, at {fmt(top.v)}
          {was(top.l)}, and lowest in {bottom.l.label}, at {fmt(bottom.v)}
          {was(bottom.l)}. For the world it was {fmt(last(ind.series)[1])} in {last(ind.series)[0]}.
        </Reading>
      )}
      <SourceLink sources={[data.source]} className="mt-2" />
    </Frame>
  );
}

function WorldChart({ def, frame, look }: { def: Extract<ChartDef, { kind: "world" }>; frame: "card" | "tile"; look: Look }) {
  const inds = def.ids.map((id) => WORLD[id]).filter((x): x is WorldIndicator => Boolean(x) && x.series.length > 2);
  if (!inds.length) return null;
  const first = inds[0];
  const lines: LineDef[] = inds.map((ind, i) => ({ key: ind.id, label: ind.label, color: ORDERED[i % 5], series: ind.series }));
  const fmt = (v: number) => print(first, v);
  const sources = inds.map((i) => i.source).filter((s, i, all) => all.findIndex((o) => o.label === s.label && o.url === s.url) === i);
  const start = Math.min(...lines.map((l) => l.series[0][0]));
  const end = Math.max(...lines.map((l) => last(l.series)[0]));
  return (
    <Frame frame={frame} look={look} title={def.title} kicker={`${def.unit} · the world · ${start}–${end}`}>
      <Lines look={look} lines={lines} fmt={fmt} tick={(v) => tickOf(first, v)} label={`${def.title}, ${start} to ${end}: ${lines.map((l) => `${l.label} ${fmt(last(l.series)[1])}`).join(", ")}.`} />
      <Legend look={look} items={lines.map((l) => ({ color: l.color, label: l.label, value: `${fmt(last(l.series)[1])}${last(l.series)[0] !== end ? ` (${last(l.series)[0]})` : ""}` }))} />
      <Reading look={look}>
        {lines.map((l, i) => (
          <span key={l.key}>
            {i > 0 && " "}
            {l.label}: {fmt(l.series[0][1])} in {l.series[0][0]}, {fmt(last(l.series)[1])} in {last(l.series)[0]}.
          </span>
        ))}
      </Reading>
      <SourceLink sources={sources} className="mt-2" />
    </Frame>
  );
}

type Stack = { unit: string; parts: { key: string; label: string }[]; rows: Record<string, number>[]; fmt: (v: number) => string; tick: (v: number) => string; note: string; source: Source };

const at = (id: string, y: number) => WORLD[id]?.series.find(([x]) => x === y)?.[1];
/** The parts of each whole, year by year. */
const STACKS: Record<"regimes" | "displaced", () => Stack> = {
  regimes: () => ({
    unit: "% of the world's people",
    parts: [
      { key: "liberal", label: "Liberal democracy" },
      { key: "electoral", label: "Electoral democracy" },
      { key: "electoralAutocracy", label: "Electoral autocracy" },
      { key: "closedAutocracy", label: "Closed autocracy" },
    ],
    rows: (WORLD.democracyShare?.series ?? []).flatMap(([y, all]) => {
      const liberal = at("liberalDemocracyShare", y);
      const ea = at("electoralAutocracyShare", y);
      const ca = at("closedAutocracyShare", y);
      return liberal === undefined || ea === undefined || ca === undefined ? [] : [{ year: y, liberal, electoral: Number((all - liberal).toFixed(1)), electoralAutocracy: ea, closedAutocracy: ca }];
    }),
    fmt: (v) => `${v.toFixed(1)}%`,
    tick: (v) => `${Math.round(v)}%`,
    note: "V-Dem sorts every country into one of the four each year. The share in an electoral democracy is its share for all democracies less its share for liberal ones, worked out here.",
    source: WORLD.democracyShare.source,
  }),
  displaced: () => ({
    unit: "millions of people",
    parts: [
      { key: "idps", label: "Displaced inside their country" },
      { key: "refugees", label: "Refugees under UNHCR" },
      { key: "unrwa", label: "Palestine refugees under UNRWA" },
      { key: "asylumSeekers", label: "Asylum-seekers" },
      { key: "others", label: "Others needing protection" },
    ],
    rows: DISPLACED_BY_KIND.map((d) => ({ year: d.year, idps: d.idps / 1e6, refugees: d.refugees / 1e6, unrwa: d.unrwa / 1e6, asylumSeekers: d.asylumSeekers / 1e6, others: d.others / 1e6 })),
    fmt: (v) => `${v.toFixed(1)}M`,
    tick: (v) => `${Math.round(v)}M`,
    note: "People forced from home by persecution, conflict or violence, as UNHCR counts them at the end of each year.",
    source: WORLD.displaced.source,
  }),
};

function StackChart({ def, frame, look }: { def: Extract<ChartDef, { kind: "stack" }>; frame: "card" | "tile"; look: Look }) {
  const id = useId().replace(/:/g, "");
  const s = STACKS[def.key]();
  if (s.rows.length < 3) return null;
  const first = s.rows[0];
  const now = last(s.rows);
  const total = (r: Record<string, number>) => s.parts.reduce((t, p) => t + r[p.key], 0);
  const biggest = [...s.parts].sort((a, b) => now[b.key] - now[a.key])[0];
  return (
    <Frame frame={frame} look={look} title={def.title} kicker={`${s.unit} · ${first.year}–${now.year}`}>
      <div role="img" aria-label={`${def.title}, ${first.year} to ${now.year}. In ${now.year}: ${s.parts.map((p) => `${p.label} ${s.fmt(now[p.key])}`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={s.rows.map((r) => ({ ...r, year: String(r.year) }))} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={look.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" {...look.axis} minTickGap={22} />
            <YAxis {...look.axis} width={48} tickFormatter={s.tick} />
            <Tooltip {...look.tooltip} formatter={(v: number, k: string) => [s.fmt(v), s.parts.find((p) => p.key === k)?.label ?? k]} />
            {s.parts.map((p, i) => (
              // A hairline of the surface between the bands, so two that touch stay apart.
              <Area key={p.key} type="monotone" dataKey={p.key} stackId={id} stroke={look.card.background} strokeWidth={1} fill={ORDERED[i % 5]} fillOpacity={0.85} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Legend look={look} items={s.parts.map((p, i) => ({ color: ORDERED[i % 5], label: p.label, value: s.fmt(now[p.key]) }))} />
      <Reading look={look}>
        In {now.year} the largest part was {biggest.label.toLowerCase()}, at {s.fmt(now[biggest.key])} of {s.fmt(total(now))}; in {first.year} it was {s.fmt(first[biggest.key])} of {s.fmt(total(first))}. {s.note}
      </Reading>
      <SourceLink sources={[s.source]} className="mt-2" />
    </Frame>
  );
}

/** A category's charts, side by side where there is room. */
export function CategoryCharts({ charts, frame = "tile" }: { charts: ChartDef[]; frame?: "card" | "tile" }) {
  const look = useChartLook();
  if (!charts.length) return null;
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 ${frame === "card" ? "gap-4" : "gap-3"}`}>
      {charts.map((c) =>
        c.kind === "regions" ? <RegionsChart key={c.title} def={c} frame={frame} look={look} /> : c.kind === "world" ? <WorldChart key={c.title} def={c} frame={frame} look={look} /> : <StackChart key={c.title} def={c} frame={frame} look={look} />,
      )}
    </div>
  );
}

// ── Which charts each category gets ────────────────────────────────────────

/** The Worldview page's pillars, by id. */
export const PILLAR_CHARTS: Record<string, ChartDef[]> = {
  society: [
    { kind: "regions", id: "lifeExpectancy", title: "Life expectancy, by region" },
    { kind: "regions", id: "childMortality", title: "Deaths before age five, by region" },
  ],
  economy: [
    { kind: "regions", id: "gdp", title: "The size of each region's economy" },
    { kind: "world", ids: ["extremePoverty", "poverty420", "poverty830"], title: "People in poverty, at three lines", unit: "% of people" },
  ],
  development: [
    { kind: "regions", id: "gdpPerCapitaPpp", title: "Output per person, by region" },
    { kind: "world", ids: ["agEmployment", "servicesEmployment", "wageWorkers", "vulnerableWork"], title: "Where and how people work", unit: "% of employment" },
  ],
  industry: [
    { kind: "regions", id: "manufacturingVA", title: "Manufacturing's share of output, by region" },
    { kind: "world", ids: ["oilRents", "gasRents", "coalRents", "mineralRents"], title: "What the ground earns", unit: "% of world GDP" },
  ],
  energy: [
    { kind: "regions", id: "electricity", title: "People with electricity, by region" },
    { kind: "world", ids: ["fossilElectricity", "renewableElectricity"], title: "Electricity from fossil fuels and from renewables", unit: "% of electricity generated" },
  ],
  technology: [
    { kind: "regions", id: "internet", title: "People using the internet, by region" },
    { kind: "world", ids: ["mobile", "broadband", "landlines"], title: "Phones and broadband", unit: "subscriptions per 100 people" },
  ],
  politics: [
    { kind: "regions", id: "womenParliament", title: "Parliament seats held by women, by region" },
    { kind: "world", ids: ["womenEmpowerment"], title: "Women's political empowerment", unit: "V-Dem index, 0 to 1" },
  ],
  civic: [
    { kind: "world", ids: ["civilLiberties", "freeExpression", "freeAssociation", "politicalLiberties"], title: "Liberties and freedoms", unit: "V-Dem index, 0 to 1" },
    { kind: "world", ids: ["physicalIntegrity", "equalityBeforeLaw", "privateLiberties", "civilSociety"], title: "Rights, justice and taking part", unit: "V-Dem index, 0 to 1" },
  ],
  governance: [
    { kind: "world", ids: ["ruleOfLaw", "judicialConstraints", "legislativeConstraints"], title: "Law and the checks on those who govern", unit: "V-Dem index, 0 to 1" },
    { kind: "world", ids: ["taxRevenue", "govRevenue", "govExpense"], title: "What governments raise and spend", unit: "% of GDP" },
  ],
  ideology: [
    { kind: "stack", key: "regimes", title: "The world's people, by the regime they live under" },
    { kind: "world", ids: ["autocratizing", "democratizing"], title: "Which way countries are turning", unit: "countries" },
  ],
  security: [
    { kind: "regions", id: "militaryGdp", title: "Military spending, by region" },
    { kind: "stack", key: "displaced", title: "The forcibly displaced, by kind" },
  ],
  ecology: [
    { kind: "regions", id: "co2PerPerson", title: "CO₂ emitted per person, by region" },
    { kind: "regions", id: "forest", title: "Forest cover, by region" },
  ],
};

/** The Trends page's groups of trends, by the group's id. */
export const TREND_CHARTS: Record<string, ChartDef[]> = {
  "trend-energy": [
    { kind: "regions", id: "co2", title: "CO₂ emissions, by region" },
    { kind: "regions", id: "electricity", title: "People with electricity, by region" },
  ],
  "trend-technology": [
    { kind: "regions", id: "internet", title: "People using the internet, by region" },
    { kind: "regions", id: "broadband", title: "Fixed broadband, by region" },
  ],
  "trend-research": [
    { kind: "regions", id: "sciArticles", title: "Scientific articles, by region" },
    { kind: "regions", id: "patents", title: "Patent applications, by region" },
  ],
  "trend-relations": [
    { kind: "regions", id: "militaryGdp", title: "Military spending, by region" },
    { kind: "stack", key: "displaced", title: "The forcibly displaced, by kind" },
  ],
  "trend-industry": [
    { kind: "regions", id: "trade", title: "Trade, by region" },
    { kind: "regions", id: "manufacturingVA", title: "Manufacturing's share of output, by region" },
  ],
  "trend-people": [
    { kind: "regions", id: "lifeExpectancy", title: "Life expectancy, by region" },
    { kind: "regions", id: "extremePoverty", title: "Extreme poverty, by region" },
  ],
};
