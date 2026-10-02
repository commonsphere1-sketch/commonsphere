/**
 * The data explorer for commodities: the Economies page's Resources view has
 * this where its Economies view has the regions and blocs (DataExplorer) -
 * the same card, a list beside a detail pane, in the same pieces.
 *
 * The list is every commodity with its latest published monthly price and
 * that price's change on the same month a year before; the detail is the
 * commodity at a glance - its price and the five years behind it, world
 * output and reserves, who produces most of it, and what it is used for -
 * with the full profile (ResourceModal) a click away.
 *
 * Every figure is the one the commodity's card and window show, read from
 * the same files: commodityPrices.ts (World Bank, IMF) and the producer
 * tables (USGS, EIA, OPEC and the rest). The two changes are worked out
 * from two published monthly averages, as on the cards.
 */
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MagnifyingGlass, Tree, X } from "@phosphor-icons/react";
import { RESOURCE_DETAILS } from "../data/resourceDetails";
import { COMMODITY_PRICE_SOURCES } from "../data/commodityPrices";
import { Empty, GoButton, Kpi, Label, Row, tooltipStyle, useTokens, type Tokens } from "./DataExplorer";
import { LATEST_PRICE_MONTH, fmtMonth, fmtPrice, holderTitle, leadingProducers, priceFacts, producerFacts, producerSources, type PriceFacts, type ResourceSummary } from "./ResourceModal";
import { SourceLink } from "./SourceLink";

const COLOR = "#059669";
const GREEN = "#10b981";
const RED = "#ef4444";
const signedPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

type Entry = { r: ResourceSummary; price: PriceFacts | null };

export function ResourceExplorer({ resources, onOpen }: { resources: ResourceSummary[]; /** Opens the commodity's full profile. */ onOpen: (r: ResourceSummary) => void }) {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const entries = useMemo<Entry[]>(() => resources.map((r) => ({ r, price: priceFacts(r.name) })), [resources]);
  // By name, by what is priced, or by a use: "battery" finds lithium.
  const list = entries.filter(
    ({ r, price }) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      price?.price.benchmark.toLowerCase().includes(q) ||
      RESOURCE_DETAILS[r.name]?.uses.some((u) => u.label.toLowerCase().includes(q) || u.detail.toLowerCase().includes(q)),
  );
  const [name, setName] = useState<string | null>(null);
  const shown = (name ? entries.find((e) => e.r.name === name) : null) ?? list[0] ?? null;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden w-full max-w-6xl mx-auto" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: COLOR }}>
        <Tree size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Resources</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: COLOR + "15" }}>
          {resources.length}
        </span>
      </div>

      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search resources"
          placeholder="Search resources, benchmarks, uses…"
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:h-[520px]">
        <div className="flex flex-col overflow-y-auto max-h-[320px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          <ResourceList t={t} entries={entries} list={list} selected={shown} onPick={(n) => setName(n)} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">{shown && <ResourceDetail key={shown.r.name} t={t} entry={shown} onOpen={() => onOpen(shown.r)} />}</div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {resources.length} commodities · prices are monthly averages, the newest for {fmtMonth(LATEST_PRICE_MONTH)}
        </span>
      </div>
    </div>
  );
}

/** The commodities whose price rose and fell most on the same month a year before, of those with both months published. */
function movers(entries: Entry[]) {
  const moved = entries.flatMap(({ r, price }) => (price?.onYear ? [{ name: r.name, pct: price.onYear.pct, from: price.onYear.from }] : [])).sort((a, b) => b.pct - a.pct);
  return { up: moved[0] ?? null, down: moved.length > 1 ? moved[moved.length - 1] : null, priced: entries.filter((e) => e.price).length };
}

function ResourceList({ t, entries, list, selected, onPick }: { t: Tokens; entries: Entry[]; list: Entry[]; selected: Entry | null; onPick: (name: string) => void }) {
  const { up, down, priced } = movers(entries);
  const tiles = [
    { label: "Commodities", value: `${entries.length}`, sub: `${priced} with a published price`, color: t.headText },
    { label: "Newest prices", value: fmtMonth(LATEST_PRICE_MONTH), sub: "monthly averages, US$", color: t.headText },
    ...(up ? [{ label: "Largest rise on the year", value: up.name, sub: `${signedPct(up.pct)} on ${fmtMonth(up.from)}`, color: up.pct >= 0 ? GREEN : RED }] : []),
    ...(down ? [{ label: "Largest fall on the year", value: down.name, sub: `${signedPct(down.pct)} on ${fmtMonth(down.from)}`, color: down.pct >= 0 ? GREEN : RED }] : []),
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-4 pb-2">
        {tiles.map((m) => (
          <div key={m.label} className="rounded-xl px-3 py-2.5" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
            <p className="text-[9px] font-sans" style={{ color: t.mutedText }}>
              {m.label}
            </p>
            <p className="text-base font-bold font-mono truncate" style={{ color: t.headText }}>
              {m.value}
            </p>
            <p className="text-[10px] font-mono" style={{ color: m.color === t.headText ? t.mutedText : m.color }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>
      <SourceLink sources={[COMMODITY_PRICE_SOURCES.wb, COMMODITY_PRICE_SOURCES.imf]} className="px-4 mb-2" />
      <div className="px-4 pb-1 pt-1">
        <Label t={t}>Commodities · price and its change on a year before</Label>
      </div>
      {list.map(({ r, price }) => (
        <Row key={r.name} t={t} selected={selected?.r.name === r.name} color={COLOR} onClick={() => onPick(r.name)}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} aria-hidden />
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
              {r.name}
            </span>
            <span className="block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
              {price ? `${price.price.unit} · ${fmtMonth(price.month)}` : "No published price held"}
            </span>
          </span>
          <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
            {price ? fmtPrice(price.value) : "—"}
          </span>
          <span className="text-[11px] font-mono shrink-0 w-14 text-right" style={{ color: price?.onYear ? (price.onYear.pct >= 0 ? GREEN : RED) : t.mutedText }}>
            {price?.onYear ? signedPct(price.onYear.pct) : "—"}
          </span>
        </Row>
      ))}
      {list.length === 0 && <Empty t={t}>No commodities match the search.</Empty>}
    </>
  );
}

function ResourceDetail({ t, entry: { r, price }, onOpen }: { t: Tokens; entry: Entry; onOpen: () => void }) {
  const detail = RESOURCE_DETAILS[r.name];
  const made = producerFacts(r.name);
  const producers = leadingProducers(r.name, 6);
  // Five years and the month before them, as on the commodity's card.
  const trend = (price?.price.series ?? []).slice(-61).map(([m, v]) => ({ m, v }));
  const januaries = trend.filter((p) => p.m.endsWith("-01")).map((p) => p.m);
  const top = Math.max(...producers.map((p) => p.value), 0) || 1;
  const sources = [...(price ? [COMMODITY_PRICE_SOURCES[price.price.source]] : []), ...producerSources(r.name)];
  return (
    <>
      <div>
        <p className="text-sm font-bold font-sans flex items-center gap-2" style={{ color: t.headText }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} aria-hidden />
          {r.name}
        </p>
        <p className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {price ? `${price.price.benchmark} · average for ${fmtMonth(price.month)}` : "No published price series is held for this commodity"}
        </p>
      </div>
      {detail && (
        <p className="text-[11px] font-sans leading-relaxed" style={{ color: t.bodyText }}>
          {detail.summary}
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {price && <Kpi t={t} label="Price" value={fmtPrice(price.value)} sub={price.price.unit} color={t.headText} />}
        {price?.onYear && <Kpi t={t} label="On a year before" value={signedPct(price.onYear.pct)} sub={`${fmtPrice(price.onYear.was)} in ${fmtMonth(price.onYear.from)}`} color={price.onYear.pct >= 0 ? GREEN : RED} />}
        {price?.onMonth && <Kpi t={t} label="On the month before" value={signedPct(price.onMonth.pct)} sub={`${fmtPrice(price.onMonth.was)} in ${fmtMonth(price.onMonth.from)}`} color={price.onMonth.pct >= 0 ? GREEN : RED} />}
        {made && <Kpi t={t} label="World output" value={made.output} sub={made.outputYear} color={t.headText} />}
        {made?.held && <Kpi t={t} label={`World ${made.heldLabel}`} value={made.held} sub={made.heldYear ?? undefined} color={t.headText} />}
        {made?.topHolder && <Kpi t={t} label={holderTitle(made.heldLabel)} value={made.topHolder.name} sub={[made.topHolder.amount, made.topHolder.share].filter(Boolean).join(" · ")} color={t.headText} />}
      </div>
      {price && trend.length > 2 && (
        <>
          <Label t={t}>
            Price · {price.price.unit} · {fmtMonth(trend[0].m)} to {fmtMonth(price.month)}
          </Label>
          <div role="img" aria-label={`${price.price.benchmark}, ${fmtMonth(trend[0].m)} to ${fmtMonth(price.month)}: ${fmtPrice(trend[0].v)} to ${fmtPrice(price.value)} ${price.price.unit}.`}>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={trend} margin={{ top: 2, right: 2, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id={`explorerResource-${r.color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={r.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={r.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" ticks={januaries} tickFormatter={(m: string) => m.slice(0, 4)} tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : fmtPrice(v))} domain={["auto", "auto"]} />
                <Tooltip {...tooltipStyle(t)} labelFormatter={(m: string) => fmtMonth(m)} formatter={(v: number) => [`${fmtPrice(v)} ${price.price.unit}`, price.price.benchmark]} />
                <Area type="monotone" dataKey="v" stroke={r.color} fill={`url(#explorerResource-${r.color.replace("#", "")})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Ten-year high", p: price.high },
              { label: "Ten-year low", p: price.low },
            ].map((x) => (
              <span key={x.label} className="rounded-md px-1.5 py-0.5 text-[10px] font-mono" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
                <span style={{ color: t.mutedText }}>{x.label}</span> <span style={{ color: t.headText }}>{fmtPrice(x.p[1])}</span> <span style={{ color: t.mutedText }}>· {fmtMonth(x.p[0])}</span>
              </span>
            ))}
          </div>
        </>
      )}
      {producers.length > 0 && made && (
        <>
          <Label t={t}>
            Largest producers · {made.outputYear} · of {made.countries} listed
          </Label>
          <ul className="flex flex-col gap-2" aria-label={`Largest producers of ${r.name}`}>
            {producers.map((p) => (
              <li key={p.name}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-sans font-semibold truncate" style={{ color: t.headText }}>
                    {p.name}
                  </span>
                  <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
                    {p.amount}
                    {p.share && <span style={{ color: t.mutedText }}> · {p.share} of the world</span>}
                  </span>
                </span>
                <span className="block h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.gridLine }} aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * p.value) / top)}%`, background: r.color }} />
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            {made.measure}.
          </p>
        </>
      )}
      {detail && (
        <>
          <Label t={t}>What it is used for</Label>
          <div className="flex flex-wrap gap-1">
            {detail.uses.map((u) => (
              <span key={u.label} title={u.detail} className="rounded-md px-1.5 py-0.5 text-[10px] font-sans" style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.bodyText }}>
                {u.label}
              </span>
            ))}
          </div>
        </>
      )}
      <SourceLink sources={sources} />
      <GoButton color={COLOR} onClick={onOpen}>
        {r.name} in full: ten years of prices, every country, how it is produced
      </GoButton>
    </>
  );
}
