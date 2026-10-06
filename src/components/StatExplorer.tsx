/**
 * The data explorer for a page of figures: the Trends page has this where
 * the Countries page has its countries and the Economies page its regions
 * or its commodities - the same card, a list beside a detail pane, in the
 * same pieces (DataExplorer).
 *
 * The list is every figure the page gives as a card, by group, each with its
 * latest value and how it has moved; the detail is the figure at a glance -
 * what it measures and why it matters, its facts, its series and what the
 * series shows, each of its breakdowns by its first rows, who is behind it,
 * what its programme says of itself, and the figures beside it - with the
 * figure's full window (StatCard's) a click away for every row.
 *
 * It is handed the same StatCardData the page's cards are drawn from, so the
 * explorer and the cards cannot disagree, and it works out nothing of its
 * own.
 */
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Empty, GoButton, Kpi, Label, Row, tooltipStyle, useTokens, type Tokens } from "./DataExplorer";
import { StatWindow, statFacts, type StatCardData } from "./StatCard";
import { SourceLink } from "./SourceLink";

export interface StatGroup {
  title: string;
  color: string;
  items: StatCardData[];
}

const GREEN = "#10b981";
const RED = "#ef4444";
const toneOf = (t: Tokens, s: StatCardData) => (s.change?.verdict === "better" ? GREEN : s.change?.verdict === "worse" ? RED : t.mutedText);
/** A figure's place in the list: its group, its name and its unit - two figures can share a name (military spending, in dollars and as a share of GDP). */
const idOf = (group: string, s: StatCardData) => `${group}·${s.label}·${s.sub}`;

export function StatExplorer({
  title,
  icon,
  color,
  groups,
  noun,
  embedded = false,
  action,
}: {
  title: string;
  icon: ReactNode;
  color: string;
  groups: StatGroup[];
  /** What the figures are, for the search box and the footer: "figures". */
  noun: string;
  /** Inside another explorer's card: no card or heading of its own. */
  embedded?: boolean;
  /** A link at the foot, to the page the figures are from. */
  action?: { label: string; onClick: () => void };
}) {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const all = groups.flatMap((g) => g.items.map((s) => ({ g, s, id: idOf(g.title, s) })));
  // By name, by group, by what it measures, or by whose figure it is.
  const hit = (g: StatGroup, s: StatCardData) => !q || [s.label, g.title, s.sub, s.about ?? ""].some((x) => x.toLowerCase().includes(q));
  const list = all.filter(({ g, s }) => hit(g, s));
  const [picked, setPicked] = useState<string | null>(null);
  const shown = (picked ? all.find((x) => x.id === picked) : null) ?? list[0] ?? null;
  const [open, setOpen] = useState(false);

  return (
    <div className={embedded ? "flex flex-col" : "flex flex-col rounded-2xl overflow-hidden w-full max-w-6xl mx-auto"} style={embedded ? undefined : { background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      {!embedded && (
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color }}>
        {icon}
        <h2 className="text-[11px] font-bold font-sans">{title}</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: color + "15" }}>
          {all.length}
        </span>
      </div>
      )}

      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${noun}`}
          placeholder={`Search ${noun}, groups, sources…`}
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
          {groups.map((g) => {
            const items = g.items.filter((s) => hit(g, s));
            if (!items.length) return null;
            return (
              <div key={g.title} className="flex flex-col">
                <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }} aria-hidden />
                  <Label t={t}>
                    {g.title} · {items.length}
                  </Label>
                </div>
                {items.map((s) => (
                  <Row key={idOf(g.title, s)} t={t} selected={shown?.id === idOf(g.title, s)} color={g.color} onClick={() => setPicked(idOf(g.title, s))}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color ?? g.color }} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                        {s.label}
                      </span>
                      <span className="block text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                        {s.sub}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
                      {s.value}
                    </span>
                    <span className="text-[10px] font-mono shrink-0 w-16 text-right truncate" style={{ color: toneOf(t, s) }}>
                      {s.change?.chip ?? "—"}
                    </span>
                  </Row>
                ))}
              </div>
            );
          })}
          {list.length === 0 && <Empty t={t}>No {noun} match the search.</Empty>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">{shown && <StatDetail key={shown.id} t={t} group={shown.g} s={shown.s} onOpen={() => setOpen(true)} />}</div>
      </div>

      <div className="px-4 py-2.5 border-t flex items-center justify-between gap-3" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {all.length} {noun} · {groups.length} groups · each from its publisher, with its year
        </span>
        {action && (
          <button type="button" onClick={action.onClick} className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: color }}>
            {action.label} <ArrowRight size={10} weight="bold" />
          </button>
        )}
      </div>
      {open && shown && createPortal(<StatWindow s={shown.s} onClose={() => setOpen(false)} />, document.body)}
    </div>
  );
}

/** How many rows of a breakdown the pane gives before sending the reader to the window. */
const ROWS = 5;

function StatDetail({ t, group, s, onOpen }: { t: Tokens; group: StatGroup; s: StatCardData; onOpen: () => void }) {
  const color = s.color ?? group.color;
  const series = s.series ?? [];
  const split = s.split && series.length && s.split <= series[series.length - 1][0] ? s.split : undefined;
  const fmt = s.fmt ?? ((v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 }));
  // The same facts the figure's window gives.
  const facts = [...(s.facts ?? []), ...statFacts(s, true).filter((f) => !(s.facts ?? []).some((x) => x.label === f.label)), ...(s.moreFacts ?? [])].filter((f) => f.label !== "Latest").slice(0, 8);
  const tables = s.tables ?? [];
  const sources = s.source ? (Array.isArray(s.source) ? s.source : [s.source]) : [];
  // On the axis a figure drops the zeros it ends in: "$60T" for "$60.00T".
  const tick = (v: number) => fmt(v).replace(/\.(\d*?)0+(?=\D|$)/, (_, d: string) => (d ? `.${d}` : ""));
  const gradient = `explorerStat-${color.replace("#", "")}`;
  const lead = s.about ?? s.what;
  const small = "text-[10px] font-sans leading-snug";
  return (
    <>
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: group.color }}>
          {group.title}
        </p>
        <p className="text-sm font-bold font-sans flex items-center gap-2 mt-0.5" style={{ color: t.headText }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden />
          {s.label}
        </p>
        <p className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {s.sub}
        </p>
      </div>
      {lead && (
        <p className="text-[11px] font-sans leading-relaxed" style={{ color: t.bodyText }}>
          {lead}
        </p>
      )}
      {((s.what && s.what !== lead) || s.why) && (
        <div className="flex flex-col gap-1.5">
          {[
            { title: "What it measures", text: s.what !== lead ? s.what : undefined },
            { title: "Why it matters", text: s.why },
          ].map(
            (x) =>
              x.text && (
                <div key={x.title} className="rounded-lg px-2.5 py-2" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
                  <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {x.title}
                  </p>
                  <p className={`${small} mt-0.5`} style={{ color: t.bodyText }}>
                    {x.text}
                  </p>
                </div>
              ),
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <Kpi t={t} label="Latest" value={s.value} sub={s.sub} color={t.headText} />
        {s.change && <Kpi t={t} label="Change" value={s.change.chip} sub={[s.change.caption, s.change.verdict ? `for the ${s.change.verdict}` : ""].filter(Boolean).join(" · ")} color={toneOf(t, s) === t.mutedText ? t.headText : toneOf(t, s)} />}
        {facts.map((f) => (
          <Kpi key={f.label} t={t} label={f.label} value={f.value} sub={f.sub} color={t.headText} />
        ))}
      </div>
      {series.length > 2 && (
        <>
          <Label t={t}>
            The series · {series[0][0]}–{series[series.length - 1][0]}
            {split ? ` · projected from ${split}` : ""}
          </Label>
          <div role="img" aria-label={`${s.label}, ${series[0][0]} to ${series[series.length - 1][0]}: ${fmt(series[0][1])} to ${fmt(series[series.length - 1][1])}.`}>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={series.map(([y, v]) => ({ year: String(y), a: !split || y < split ? v : null, p: split && y >= split - 1 ? v : null }))} margin={{ top: 4, right: 2, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.gridLine} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={tick} domain={["auto", "auto"]} width={52} />
                <Tooltip {...tooltipStyle(t)} formatter={(v: number, k: string) => [fmt(v), k === "p" ? `${s.label}, projected` : s.label]} />
                <Area type="monotone" dataKey="a" stroke={color} fill={`url(#${gradient})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="p" stroke={color} strokeDasharray="5 4" fill={`url(#${gradient})`} fillOpacity={0.5} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {s.story && (
            <p className={small} style={{ color: t.bodyText }}>
              {s.story}
            </p>
          )}
        </>
      )}
      {sources.length > 0 && <SourceLink sources={sources} />}

      {/* Each breakdown by its first rows; the window has every row. */}
      {tables.map((table) => {
        const top = Math.max(...table.rows.map((r) => r.value), 0) || 1;
        return (
          <section key={table.key} className="flex flex-col gap-2 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
            <Label t={t}>
              {table.title}
              {table.kicker ? ` · ${table.kicker}` : ""}
            </Label>
            <ul className="flex flex-col gap-2" aria-label={table.title}>
              {table.rows.slice(0, ROWS).map((r) => (
                <li key={r.name}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-sans font-semibold truncate" style={{ color: t.headText }}>
                      {r.name}
                    </span>
                    <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
                      {r.text}
                      {r.note && <span style={{ color: t.mutedText }}> · {r.note}</span>}
                    </span>
                  </span>
                  <span className="block h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.gridLine }} aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * Math.max(0, r.value)) / top)}%`, background: color }} />
                  </span>
                </li>
              ))}
            </ul>
            {(table.rows.length > ROWS || table.note) && (
              <p className={small} style={{ color: t.mutedText }}>
                {table.rows.length > ROWS ? `The first ${ROWS} of ${table.rows.length}; the rest are in the full window. ` : ""}
                {table.note}
              </p>
            )}
            {table.source && <SourceLink sources={table.source} />}
          </section>
        );
      })}

      {(s.briefs ?? []).map((b) => (
        <section key={b.title} className="flex flex-col gap-1.5 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
          <Label t={t}>In the programme's own account · {b.title}</Label>
          <p className={small} style={{ color: t.bodyText }}>
            {b.text}
          </p>
          {b.source && <SourceLink sources={b.checked ? { label: `${b.source.label}, read ${b.checked}`, url: b.source.url } : b.source} />}
        </section>
      ))}

      {s.related && s.related.rows.length > 0 && (
        <section className="flex flex-col gap-1 pt-3" style={{ borderTop: `1px solid ${t.gridLine}` }}>
          <Label t={t}>Beside it · {s.related.title}</Label>
          <dl className="flex flex-col">
            {s.related.rows.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                <dt className="text-[10px] font-sans min-w-0" style={{ color: t.bodyText }}>
                  {f.label}
                </dt>
                <dd className="text-[11px] font-mono font-bold text-right shrink-0" style={{ color: t.headText }}>
                  {f.value}
                  {f.sub && (
                    <span className="block text-[9px] font-normal" style={{ color: t.mutedText }}>
                      {f.sub}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {s.notes && s.notes.length > 0 && (
        <ul className="flex flex-col gap-1">
          {s.notes.map((n, i) => (
            <li key={i} className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
              {n}
            </li>
          ))}
        </ul>
      )}
      {(series.length > 2 || tables.length > 0) && (
        <GoButton color={group.color} onClick={onOpen}>
          {s.label} in full{tables.length > 0 ? `: every row of ${tables.length === 1 ? "its breakdown" : `its ${tables.length} breakdowns`} and the whole series` : ": the facts and the whole series"}
        </GoButton>
      )}
    </>
  );
}
