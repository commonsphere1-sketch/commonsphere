/**
 * An economy's manufacturing: the section of that name in an economy's
 * window - its figures as tiles, its record over the years as charts, and
 * where it stands among the world's manufacturers as a list.
 *
 * Every figure is the World Bank's (World Development Indicators,
 * economyManufacturing.ts), with its year: what manufacturing adds to the
 * economy in dollars and as a share of GDP, how fast it grew, how much of
 * what the economy sells and buys abroad is manufactures, how much of what
 * it sells is high technology, and the share of its jobs that are in
 * industry - industry as a whole, which the tile says. And what it
 * manufactures: the five branches the World Bank divides manufacturing into,
 * each with its share of the value added and what it covers, the largest
 * first - UNIDO's figures, as the World Bank republishes them. The world's own share
 * of GDP is drawn beside the economy's, as the line to measure against.
 *
 * Worked out here, and said to be: the economy's place among the countries
 * and territories by value added - each by the latest year the World Bank
 * gives it, which is beside each figure, since they are not all one year.
 * A regional bloc is not ranked among countries. Nothing is shown where the
 * World Bank publishes nothing, and the section itself is left out then.
 */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { economiesData, type Economy } from "../data/economiesData";
import { ECONOMY_MANUFACTURING, ECONOMY_MANUFACTURING_SOURCE, MANUFACTURING_BRANCHES, WORLD_MANUFACTURING_SHARE, type Latest } from "../data/economyManufacturing";
import { ACCENT, ChartNote, ChartTitle, MeasureBars, PART_COLORS, PartsBar } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const usd = (bn: number) => (bn >= 1000 ? `$${(bn / 1000).toFixed(2)}T` : bn >= 1 ? `$${bn.toFixed(1)}B` : `$${Math.round(bn * 1000)}M`);
const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;
const nth = (n: number) => `${n.toLocaleString("en-US")}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
const tip = { background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 11 };
const tick = { fontSize: 9, fontFamily: "monospace", fill: "currentColor" };
const last = (list?: Latest[]) => (list && list.length ? list[list.length - 1] : undefined);

/** The countries and territories with a value added, largest first by the latest year each has: counted once, for every window. */
const RANKED = economiesData
  .filter((e) => e.entityType === "Country" || e.entityType === "Territory")
  .flatMap((e) => {
    const at = last(ECONOMY_MANUFACTURING[e.id]?.value);
    return at ? [{ id: e.id, name: e.name, year: at[0], value: at[1] }] : [];
  })
  .sort((a, b) => b.value - a.value);

const Tile = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="modal-tile rounded-lg px-3 py-2.5 min-w-0">
    <p className="text-[10px] font-sans text-muted-foreground leading-snug">{label}</p>
    <p className="text-base font-bold font-mono leading-tight mt-0.5 text-foreground">{value}</p>
    <p className="text-[9px] font-mono text-muted-foreground leading-snug mt-0.5">{sub}</p>
  </div>
);

export default function EconomyManufacturing({ economy }: { economy: Economy }) {
  const m = ECONOMY_MANUFACTURING[economy.id];
  if (!m) return null;
  const value = last(m.value);
  const share = last(m.share);
  const growth = last(m.growth);
  const world = new Map(WORLD_MANUFACTURING_SHARE);
  const place = RANKED.findIndex((r) => r.id === economy.id) + 1;
  const beside = [...RANKED.slice(0, 8), ...(place > 8 ? [RANKED[place - 1]] : [])];
  const shareRows = (m.share ?? []).map(([year, v]) => ({ year, own: v, world: world.get(year) ?? null }));
  const worldAt = share ? world.get(share[0]) : undefined;
  /* What it manufactures: each branch with its share, the largest first - "Other", the residual, last whatever its size - and, where the World Bank gives the value added for the same year, what the share comes to in dollars. */
  const madeIn = m.branches?.[0];
  const madeValue = madeIn ? m.value?.find(([y]) => y === madeIn)?.[1] : undefined;
  const made = m.branches
    ? MANUFACTURING_BRANCHES.map((b, i) => ({ ...b, pct: m.branches![i + 1] as number, color: PART_COLORS[i % PART_COLORS.length], residual: i === MANUFACTURING_BRANCHES.length - 1 })).sort(
        (a, b) => Number(a.residual) - Number(b.residual) || b.pct - a.pct,
      )
    : [];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Manufacturing</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {value && <Tile label="Value added" value={usd(value[1])} sub={`current US$ · ${value[0]}`} />}
        {share && <Tile label="Share of GDP" value={`${share[1]}%`} sub={`of GDP · ${share[0]}${worldAt != null ? ` · world ${worldAt}%` : ""}`} />}
        {growth && <Tile label="Growth" value={pct(growth[1])} sub={`real, a year · ${growth[0]}`} />}
        {m.exportsShare && <Tile label="Manufactures in exports" value={`${m.exportsShare[1]}%`} sub={`of goods sold abroad · ${m.exportsShare[0]}`} />}
        {m.importsShare && <Tile label="Manufactures in imports" value={`${m.importsShare[1]}%`} sub={`of goods bought abroad · ${m.importsShare[0]}`} />}
        {m.highTech && <Tile label="High technology" value={`${m.highTech[1]}%`} sub={`of manufactured exports · ${m.highTech[0]}`} />}
        {m.midHighTech && <Tile label="Medium and high technology" value={`${m.midHighTech[1]}%`} sub={`of manufacturing value added · ${m.midHighTech[0]}`} />}
        {m.industryJobs && <Tile label="Jobs in industry" value={`${m.industryJobs[1]}%`} sub={`of all jobs · industry as a whole · ${m.industryJobs[0]}`} />}
        {place > 0 && <Tile label="Among manufacturers" value={nth(place)} sub={`of ${RANKED.length} countries, by value added`} />}
      </div>

      {made.length > 0 && (
        <div className="modal-tile rounded-xl p-4 mt-2">
          <ChartTitle>
            What it manufactures · % of manufacturing value added · {madeIn}
          </ChartTitle>
          <PartsBar label={`What ${economy.name} manufactures, by branch, ${madeIn}`} parts={made.map((b) => ({ label: b.name, value: b.pct, text: `${b.pct}%`, color: b.color }))} />
          {/* The list: each branch, what it covers, and its share - the largest first, the residual last. */}
          <ol className="mt-3 flex flex-col">
            {made.map((b, i) => (
              <li key={b.name} className="flex items-start gap-3 py-2 border-t border-border/40 first:border-t-0">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0 mt-1" style={{ background: b.color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold font-sans text-foreground">
                    {b.residual ? "" : `${i + 1}. `}
                    {b.name}
                  </span>
                  <span className="block text-[10px] font-sans text-muted-foreground leading-snug">Covers {b.covers}.</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-bold font-mono text-foreground">{b.pct}%</span>
                  {madeValue != null && <span className="block text-[9px] font-mono text-muted-foreground">about {usd((madeValue * b.pct) / 100)}</span>}
                </span>
              </li>
            ))}
          </ol>
          <ChartNote>
            The five branches the World Bank divides manufacturing into, by the international classification of industries (ISIC, revision 3) - UNIDO's figures, as the World Bank republishes
            them, for the latest year it has all five for {economy.name}.{" "}
            {madeValue != null ? `The dollar amounts are worked out here: each share of the ${usd(madeValue)} manufacturing added that year.` : ""} A branch whose figures are not reported apart is counted in
            "Other".
          </ChartNote>
        </div>
      )}

      {shareRows.length > 2 && (
        <div className="modal-tile rounded-xl p-4 mt-2" role="img"
 aria-label={`Manufacturing as a share of ${economy.name}'s GDP: ${shareRows.map((r) => `${r.year} ${r.own}%`).join(", ")}.`}>
          <ChartTitle>
            Manufacturing value added · % of GDP · {shareRows[0].year} to {shareRows[shareRows.length - 1].year}
          </ChartTitle>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={shareRows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tick={tick} axisLine={false} tickLine={false} tickCount={6} allowDecimals={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={36} domain={[0, "auto"]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number, key: string) => [`${v}%`, key === "own" ? economy.name : "World"]} labelFormatter={(y) => String(y)} contentStyle={tip} />
              <Line type="linear" dataKey="world" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.4} strokeDasharray="4 3" dot={false} isAnimationActive={false} connectNulls />
              <Line type="linear" dataKey="own" stroke={ACCENT} strokeWidth={1.9} dot={{ r: 1.8 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            <span style={{ color: ACCENT }}>━</span> {economy.name} · ┄ the world
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {m.value && m.value.length > 2 && (
          <div className="modal-tile rounded-xl p-4" role="img" aria-label={`Manufacturing value added in ${economy.name}: ${m.value.map(([y, v]) => `${y} ${usd(v)}`).join(", ")}.`}>
            <ChartTitle>Value added · current US$</ChartTitle>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={m.value.map(([year, v]) => ({ year, v }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tick={tick} axisLine={false} tickLine={false} tickCount={5} allowDecimals={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} width={50} domain={[0, "auto"]} tickFormatter={(v: number) => usd(v)} />
                <Tooltip formatter={(v: number) => [usd(v), "Value added"]} labelFormatter={(y) => String(y)} contentStyle={tip} />
                <Area type="linear" dataKey="v" stroke={ACCENT} strokeWidth={1.75} fill={ACCENT} fillOpacity={0.14} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {m.growth && m.growth.length > 2 && (
          <div className="modal-tile rounded-xl p-4" role="img" aria-label={`Real growth of manufacturing in ${economy.name}: ${m.growth.map(([y, v]) => `${y} ${pct(v)}`).join(", ")}.`}>
            <ChartTitle>Growth · real, % a year</ChartTitle>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={m.growth.map(([year, v]) => ({ year: String(year).slice(2), full: year, v }))} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={tick} axisLine={false} tickLine={false} width={36} tickFormatter={(v: number) => `${v}%`} />
                <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.35} />
                <Tooltip formatter={(v: number) => [pct(v), "Growth"]} labelFormatter={(_, items) => String((items[0]?.payload as { full?: number } | undefined)?.full ?? "")} contentStyle={tip} cursor={{ fill: "currentColor", fillOpacity: 0.06 }} />
                <Bar dataKey="v" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                  {m.growth.map(([year, v]) => (
                    <Cell key={year} fill={ACCENT} fillOpacity={v < 0 ? 0.45 : 0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {(m.exportsShare || m.importsShare) && (
        <div className="modal-tile rounded-xl p-4 mt-2 flex flex-col gap-4">
          {m.exportsShare && (
            <div>
              <ChartTitle>What it sells abroad · % of merchandise exports · {m.exportsShare[0]}</ChartTitle>
              <PartsBar
                label={`Manufactures in ${economy.name}'s merchandise exports, ${m.exportsShare[0]}`}
                parts={[
                  { label: "Manufactures", value: m.exportsShare[1], text: `${m.exportsShare[1]}%`, color: ACCENT },
                  { label: "Other goods", value: Number((100 - m.exportsShare[1]).toFixed(1)), text: `${(100 - m.exportsShare[1]).toFixed(1)}%`, color: "#94a3b8" },
                ]}
              />
            </div>
          )}
          {m.importsShare && (
            <div>
              <ChartTitle>What it buys abroad · % of merchandise imports · {m.importsShare[0]}</ChartTitle>
              <PartsBar
                label={`Manufactures in ${economy.name}'s merchandise imports, ${m.importsShare[0]}`}
                parts={[
                  { label: "Manufactures", value: m.importsShare[1], text: `${m.importsShare[1]}%`, color: ACCENT },
                  { label: "Other goods", value: Number((100 - m.importsShare[1]).toFixed(1)), text: `${(100 - m.importsShare[1]).toFixed(1)}%`, color: "#94a3b8" },
                ]}
              />
            </div>
          )}
          <ChartNote>"Other goods" is what is left of 100%: food, fuels, ores and metals, and farm raw materials - worked out here from the World Bank's share.</ChartNote>
        </div>
      )}

      {place > 0 && (
        <div className="modal-tile rounded-xl p-4 mt-2">
          <ChartTitle>The largest manufacturers · value added, current US$</ChartTitle>
          <MeasureBars
            label={`${economy.name} beside the largest manufacturers by value added`}
            rows={beside.map((r) => ({
              key: r.id,
              label: `${nth(RANKED.indexOf(r) + 1)} · ${r.name}${r.id === economy.id ? " · this economy" : ""}`,
              value: r.value,
              text: usd(r.value),
              sub: String(r.year),
              color: r.id === economy.id ? ACCENT : "#94a3b8",
            }))}
          />
          <ChartNote>
            Ranked here from the World Bank's figures, each for the latest year it gives the economy - the year is beside each, since they are not all one. {RANKED.length} countries and
            territories have a figure; a bloc is not ranked among them.
          </ChartNote>
        </div>
      )}

      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
        Value added is what manufacturing puts out less what it buys in. "Jobs in industry" is industry as a whole - manufacturing with mining, construction and utilities - the
        ILO's modelled estimate; the indicators hold no jobs figure for manufacturing alone.
      </p>
      <SourceLink sources={[ECONOMY_MANUFACTURING_SOURCE]} className="mt-1" />
    </div>
  );
}
