/**
 * The data explorer for commodities: the Economies page's Resources view has
 * this where its Economies view has the regions and blocs (DataExplorer) -
 * the same card, a list beside a detail pane, in the same pieces.
 *
 * The list is every commodity with its latest published monthly price and
 * that price's change on the same month a year before; the detail is the
 * commodity at a glance - its price and the five years behind it, world
 * output and reserves, who produces most of it and who holds most of it,
 * how its price is quoted, what it is used for, how it is produced, where
 * it comes from and what moves its price - with the full profile
 * (ResourceModal) a click away.
 *
 * Every figure is the one the commodity's card and window show, read from
 * the same files: commodityPrices.ts (World Bank, IMF) and the producer
 * tables (USGS, EIA, OPEC and the rest). A change is worked out from two
 * published monthly averages, as on the cards, and names both months. The
 * background - uses, production, deposits, pricing - is the site's own
 * summary (resourceDetails.ts), kept to what is settled.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, MagnifyingGlass, Tree, X } from "@phosphor-icons/react";
import { RESOURCE_DETAILS } from "../data/resourceDetails";
import { COMMODITY_PRICE_SOURCES } from "../data/commodityPrices";
import { Block, Empty, GoButton, Kpi, Label, Row, tooltipStyle, useTokens, type Tokens } from "./DataExplorer";
import { LATEST_PRICE_MONTH, fmtMonth, fmtPrice, holderTitle, leadingHolders, leadingProducers, priceFacts, producerFacts, producerSources, type PriceFacts, type ResourceSummary } from "./ResourceModal";
import { SourceLink } from "./SourceLink";

const COLOR = "#059669";
const GREEN = "#10b981";
const RED = "#ef4444";
const signedPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

type Entry = { r: ResourceSummary; price: PriceFacts | null };

export function ResourceExplorer({
  resources,
  onOpen,
  embedded = false,
  action,
}: {
  resources: ResourceSummary[];
  /** Opens the commodity's full profile. */
  onOpen: (r: ResourceSummary) => void;
  /** Inside another explorer's card: no card or heading of its own. */
  embedded?: boolean;
  /** A link at the foot, to the page the figures are from. */
  action?: { label: string; onClick: () => void };
}) {
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
    <div className={embedded ? "flex flex-col" : "explorer flex flex-col rounded-2xl overflow-hidden w-full max-w-6xl mx-auto"} style={embedded ? undefined : { background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      {!embedded && (
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: COLOR }}>
        <Tree size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Resources</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: COLOR + "15" }}>
          {resources.length}
        </span>
      </div>
      )}

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

      <div className="explorer-panes flex flex-col md:flex-row md:h-[520px]">
        <div className="explorer-list flex flex-col overflow-y-auto max-h-[320px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r" style={{ borderColor: t.gridLine }}>
          <ResourceList t={t} entries={entries} list={list} selected={shown} onPick={(n) => setName(n)} />
        </div>
        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">{shown && <ResourceDetail key={shown.r.name} t={t} entry={shown} onOpen={() => onOpen(shown.r)} />}</div>
      </div>

      <div className="px-4 py-2.5 border-t flex items-center justify-between gap-3" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {resources.length} commodities · prices are monthly averages, the newest for {fmtMonth(LATEST_PRICE_MONTH)}
        </span>
        {action && (
          <button type="button" onClick={action.onClick} className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: COLOR }}>
            {action.label} <ArrowRight size={10} weight="bold" />
          </button>
        )}
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

/** Countries ranked on one scale, the largest filling the track: each with its amount as printed and its share of the world's. */
function RankBars({ t, color, rows, label }: { t: Tokens; color: string; rows: { name: string; value: number; amount: string; share: string | null }[]; label: string }) {
  const top = Math.max(...rows.map((p) => p.value), 0) || 1;
  return (
    <ul className="flex flex-col gap-2" aria-label={label}>
      {rows.map((p) => (
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
            <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * p.value) / top)}%`, background: color }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A heading and what is said under it, in the pane's small print. */
function Told({ t, title, children }: { t: Tokens; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
      <Label t={t}>{title}</Label>
      {children}
    </section>
  );
}

function ResourceDetail({ t, entry: { r, price }, onOpen }: { t: Tokens; entry: Entry; onOpen: () => void }) {
  const detail = RESOURCE_DETAILS[r.name];
  const made = producerFacts(r.name);
  const producers = leadingProducers(r.name, 6);
  const holders = leadingHolders(r.name, 5);
  // Five years and the month before them, as on the commodity's card.
  const series = price?.price.series ?? [];
  const trend = series.slice(-61).map(([m, v]) => ({ m, v }));
  const januaries = trend.filter((p) => p.m.endsWith("-01")).map((p) => p.m);
  // The same month five years before, where the series has it: two published monthly averages, like the other two changes.
  const fiveBack = price ? series.find(([m]) => m === `${Number(price.month.slice(0, 4)) - 5}${price.month.slice(4)}`) : undefined;
  const onFive = price && fiveBack && fiveBack[1] > 0 ? { pct: Math.round(((price.value - fiveBack[1]) / fiveBack[1]) * 1000) / 10, from: fiveBack[0], was: fiveBack[1] } : null;
  const sources = [...(price ? [COMMODITY_PRICE_SOURCES[price.price.source]] : []), ...producerSources(r.name)];
  const text = "text-[11px] font-sans leading-relaxed";
  return (
    <>
      <Block>
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
        <p className={text} style={{ color: t.bodyText }}>
          {detail.summary}
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {price && <Kpi t={t} label="Price" value={fmtPrice(price.value)} sub={price.price.unit} color={t.headText} />}
        {price?.onYear && <Kpi t={t} label="On a year before" value={signedPct(price.onYear.pct)} sub={`${fmtPrice(price.onYear.was)} in ${fmtMonth(price.onYear.from)}`} color={price.onYear.pct >= 0 ? GREEN : RED} />}
        {price?.onMonth && <Kpi t={t} label="On the month before" value={signedPct(price.onMonth.pct)} sub={`${fmtPrice(price.onMonth.was)} in ${fmtMonth(price.onMonth.from)}`} color={price.onMonth.pct >= 0 ? GREEN : RED} />}
        {onFive && <Kpi t={t} label="On five years before" value={signedPct(onFive.pct)} sub={`${fmtPrice(onFive.was)} in ${fmtMonth(onFive.from)}`} color={onFive.pct >= 0 ? GREEN : RED} />}
        {made && <Kpi t={t} label="World output" value={made.output} sub={made.outputYear} color={t.headText} />}
        {made?.topProducer && <Kpi t={t} label="Largest producer" value={made.topProducer.name} sub={[made.topProducer.amount, made.topProducer.share].filter(Boolean).join(" · ")} color={t.headText} />}
        {made?.held && <Kpi t={t} label={`World ${made.heldLabel}`} value={made.held} sub={made.heldYear ?? undefined} color={t.headText} />}
        {made?.topHolder && <Kpi t={t} label={holderTitle(made.heldLabel)} value={made.topHolder.name} sub={[made.topHolder.amount, made.topHolder.share].filter(Boolean).join(" · ")} color={t.headText} />}
      </div>
      </Block>
      {price && trend.length > 2 && (
        <Block>
          <Label t={t}>
            Price · {price.price.unit} · {fmtMonth(trend[0].m)} to {fmtMonth(price.month)}
          </Label>
          <div role="img" aria-label={`${price.price.benchmark}, ${fmtMonth(trend[0].m)} to ${fmtMonth(price.month)}: ${fmtPrice(trend[0].v)} to ${fmtPrice(price.value)} ${price.price.unit}.`}>
            <ResponsiveContainer width="100%" height={96}>
              <AreaChart data={trend} margin={{ top: 4, right: 2, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id={`explorerResource-${r.color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={r.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={r.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.gridLine} vertical={false} />
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
          {detail && (
            <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
              {detail.unit}
            </p>
          )}
        </Block>
      )}
      {producers.length > 0 && made && (
        <Block>
          <Label t={t}>
            Largest producers · {made.outputYear} · of {made.countries} listed
          </Label>
          <RankBars t={t} color={r.color} rows={producers} label={`Largest producers of ${r.name}`} />
          <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
            {made.measure}.
          </p>
        </Block>
      )}
      {holders.length > 1 && made?.held && (
        <Block>
          <Label t={t}>
            {made.heldLabel === "exports" ? "Largest exporters" : `Largest ${made.heldLabel}`}
            {made.heldYear ? ` · ${made.heldYear}` : ""}
          </Label>
          <RankBars t={t} color={r.color} rows={holders} label={`Largest ${made.heldLabel} of ${r.name}`} />
        </Block>
      )}
      <SourceLink sources={sources} />

      {detail && (
        <>
          <Told t={t} title="What it is used for">
            <dl className="flex flex-col gap-1.5">
              {detail.uses.map((u) => (
                <div key={u.label}>
                  <dt className="text-[11px] font-sans font-bold" style={{ color: t.headText }}>
                    {u.label}
                  </dt>
                  <dd className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {u.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Told>
          <Told t={t} title="How it is produced">
            <ol className="flex flex-col gap-1.5">
              {detail.made.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[10px] font-mono font-bold shrink-0 w-3" style={{ color: r.color }}>
                    {i + 1}
                  </span>
                  <span className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </Told>
          <Told t={t} title="Where it comes from">
            <dl className="flex flex-col gap-1.5">
              {detail.deposits.map((d) => (
                <div key={d.place}>
                  <dt className="text-[11px] font-sans font-bold" style={{ color: t.headText }}>
                    {d.place}
                  </dt>
                  <dd className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {d.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Told>
          <Told t={t} title="What moves its price">
            <ul className="flex flex-col gap-1">
              {detail.value.map((v, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: r.color }} aria-hidden />
                  <span className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {v}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
              The site's own summary, kept to what is settled; the figures above are each from the source named.
            </p>
          </Told>
        </>
      )}
      <GoButton color={COLOR} onClick={onOpen}>
        {r.name} in full: ten years of prices, every country, how it is produced
      </GoButton>
    </>
  );
}
