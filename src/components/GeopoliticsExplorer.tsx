/**
 * The Worldview page's geopolitical explorer: how power is arranged in the
 * world, as a list beside a detail pane, in the pieces the site's other
 * explorers are made of (DataExplorer).
 *
 * Two kinds of row, each read from a data file the site already holds, and
 * nothing typed in here:
 *
 *   The world's measures   armed conflicts and the deaths in them, military
 *                          spending, arms transfers, nuclear warheads, the
 *                          displaced, who lives under which kind of regime,
 *                          trade, investment and debt (worldview.ts - each
 *                          with its publisher and year). A figure's change
 *                          on ten years before is worked out from the two
 *                          readings of its own series, and said to be.
 *   Alliances and blocs    the security alliances, political and economic
 *                          blocs, agencies and human rights bodies, with
 *                          their members, each checked against the body's
 *                          own page (alliances.ts).
 *
 *   Political theories     the ideologies and philosophies, and the forms of
 *   and forms of           government and political systems, that more than
 *   governance             one work of reference has an entry for
 *                          (politicalTheories.ts): each described by the
 *                          opening of its Wikipedia article, with the
 *                          Stanford and Internet encyclopedias of philosophy
 *                          and the Britannica listed first, to read and cite.
 *
 * A measure also says what it counts and why it matters, in its source's
 * terms (worldviewExplain.ts). The list is searched by name, member or place,
 * and narrowed by kind.
 */
import { useMemo, useState } from "react";
import { Globe, MagnifyingGlass, X } from "@phosphor-icons/react";
import { WORLD, type WorldIndicator } from "../data/worldview";
import { EXPLAIN } from "../data/worldviewExplain";
import { POLITICAL_IDEAS, POLITICAL_THEORIES_RETRIEVED, type PoliticalIdea } from "../data/politicalTheories";
import { ALLIANCES, ALLIANCES_CHECKED, ALLIANCE_KIND_PLURAL, HUMAN_RIGHTS_CHECKED, type Alliance, type AllianceKind } from "../data/alliances";
import { Block, Empty, Kpi, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const ACCENT = "#6366f1";
/** The world's measures of power and conflict, in the order they are listed, each under its heading. */
const MEASURES: { group: string; color: string; ids: string[] }[] = [
  { group: "War and arms", color: "#ef4444", ids: ["conflicts", "conflictDeaths", "militaryUsd", "militaryGdp", "militaryShare", "armsTransfers", "nuclearWarheads", "displaced"] },
  { group: "Regimes", color: "#8b5cf6", ids: ["democracies", "democracyShare", "liberalDemocracyShare", "electoralAutocracyShare", "closedAutocracyShare", "autocratizing", "autocratizingShare", "democratizing", "democratizingShare"] },
  { group: "Trade, money and debt", color: "#f59e0b", ids: ["trade", "fdi", "remittances", "govDebt", "extDebtUsd", "interestPayments"] },
];
const KIND_COLOR: Record<AllianceKind, string> = {
  "Security alliance": "#ef4444",
  "Political & regional bloc": "#0ea5e9",
  "Economic & trade bloc": "#f59e0b",
  "International agency": "#10b981",
  "Human rights body": "#ec4899",
};

type Item = { key: string; group: string; color: string; name: string; said: string; find: string } & ({ m: WorldIndicator } | { a: Alliance } | { p: PoliticalIdea });
/** The two kinds of political idea, each under its own heading and colour. */
const IDEA_GROUP = { theory: { group: "Political theories", color: "#d946ef" }, governance: { group: "Forms of governance", color: "#14b8a6" } } as const;

const places = new Intl.DisplayNames(["en"], { type: "region" });
const placeName = (code: string) => {
  try {
    return places.of(code) ?? code;
  } catch {
    return code;
  }
};
/** A figure as its series' format says to print it. */
const print = (m: WorldIndicator, v: number) => {
  const a = Math.abs(v);
  if (m.format === "pct") return `${v.toFixed(m.dp)}%`;
  if (m.format === "usd") return a >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : a >= 1e9 ? `$${(v / 1e9).toFixed(1)}bn` : `$${Math.round(v / 1e6)}M`;
  if (m.format === "count") return a >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US");
  return v.toLocaleString("en-US", { maximumFractionDigits: m.dp });
};
const lastOf = (m: WorldIndicator) => m.series[m.series.length - 1];

const ITEMS: Item[] = [
  ...MEASURES.flatMap((g) =>
    g.ids.flatMap((id): Item[] => {
      const m = WORLD[id];
      if (!m?.series.length) return [];
      const [year, v] = lastOf(m);
      return [{ key: `m-${id}`, group: g.group, color: g.color, name: m.label, said: `${print(m, v)} · ${m.unit} · ${year}`, find: `${m.label} ${m.unit}`, m }];
    }),
  ),
  ...ALLIANCES.map((a): Item => ({
    key: `a-${a.id}`,
    group: ALLIANCE_KIND_PLURAL[a.kind],
    color: KIND_COLOR[a.kind],
    name: a.short,
    said: `${a.memberCount} members${a.founded ? ` · founded ${a.founded}` : ""}`,
    find: `${a.name} ${a.short} ${(a.members ?? []).map(placeName).join(" ")}`,
    a,
  })),
  ...POLITICAL_IDEAS.map((p): Item => ({
    key: `p-${p.kind}-${p.name}`,
    group: IDEA_GROUP[p.kind].group,
    color: IDEA_GROUP[p.kind].color,
    name: p.name,
    said: `${p.classed} · ${p.sources.length} works to read`,
    find: `${p.name} ${p.said}`,
    p,
  })),
];
const GROUPS = [...new Set(ITEMS.map((x) => x.group))];

export function GeopoliticsExplorer() {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const q = search.trim().toLowerCase();
  const list = useMemo(() => ITEMS.filter((x) => (!group || x.group === group) && (!q || x.find.toLowerCase().includes(q))), [q, group]);
  const shown = (pickedKey ? ITEMS.find((x) => x.key === pickedKey) : null) ?? list[0] ?? null;

  return (
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: ACCENT }}>
        <Globe size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Geopolitics</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {ITEMS.length}
        </span>
      </div>

      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search the geopolitical measures and alliances"
          placeholder="Search measures, alliances, blocs, member countries…"
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
          <div className="flex flex-wrap gap-1.5 px-4 pt-3" role="group" aria-label="Kind">
            {GROUPS.map((g) => {
              const on = group === g;
              const color = ITEMS.find((x) => x.group === g)!.color;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setGroup(on ? null : g);
                    setPickedKey(null);
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-sans font-semibold px-2 py-1 rounded-full cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: on ? color + "22" : t.tile, border: `1px solid ${on ? color + "88" : t.gridLine}`, color: t.headText }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} aria-hidden />
                  {g} · {ITEMS.filter((x) => x.group === g).length}
                </button>
              );
            })}
          </div>
          {GROUPS.map((g) => {
            const rows = list.filter((x) => x.group === g);
            if (!rows.length) return null;
            return (
              <div key={g} className="flex flex-col">
                <div className="px-4 pt-3 pb-1">
                  <Label t={t}>
                    {g} · {rows.length}
                  </Label>
                </div>
                {rows.map((x) => (
                  <Row key={x.key} t={t} selected={shown?.key === x.key} color={x.color} onClick={() => setPickedKey(x.key)}>
                    <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: x.color }} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                        {x.name}
                      </span>
                      <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                        {x.said}
                      </span>
                    </span>
                  </Row>
                ))}
              </div>
            );
          })}
          {list.length === 0 && <Empty t={t}>No measure, alliance or political idea matches the search.</Empty>}
        </div>

        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {!shown ? (
            <Empty t={t}>Nothing to show.</Empty>
          ) : "m" in shown ? (
            (() => {
              const m = shown.m;
              const [year, v] = lastOf(m);
              const before = m.series.find(([y]) => y === year - 10);
              const diff = before ? v - before[1] : null;
              return (
                <Block>
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: shown.color }}>
                      {shown.group}
                    </p>
                    <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                      {m.label}
                    </p>
                    <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                      {m.unit}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Kpi t={t} label={String(year)} value={print(m, v)} color={t.headText} sub="the latest year" />
                    <Kpi
                      t={t}
                      label={before ? String(before[0]) : "Ten years before"}
                      value={before ? print(m, before[1]) : "not in the series"}
                      color={t.headText}
                      sub={diff === null ? undefined : `${diff >= 0 ? "up" : "down"} ${m.format === "pct" ? `${Math.abs(diff).toFixed(m.dp)} points` : print(m, Math.abs(diff))} since`}
                    />
                  </div>
                  {m.note && (
                    <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                      {m.note}
                    </p>
                  )}
                  {EXPLAIN[m.id]?.what && (
                    <>
                      <Label t={t}>What it measures</Label>
                      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                        {EXPLAIN[m.id].what}
                      </p>
                    </>
                  )}
                  {EXPLAIN[m.id]?.why && (
                    <>
                      <Label t={t}>Why it matters</Label>
                      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                        {EXPLAIN[m.id].why}
                      </p>
                    </>
                  )}
                  <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                    The series runs from {m.series[0][0]} to {year}; the change is worked out from its own two readings.
                  </p>
                  <SourceLink sources={[m.source]} />
                </Block>
              );
            })()
          ) : "p" in shown ? (
            <Block>
              <div className="min-w-0">
                <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: shown.color }}>
                  {shown.group} · classed as a {shown.p.classed}
                </p>
                <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                  {shown.p.name}
                </p>
              </div>
              <p className="text-[12px] font-sans leading-relaxed" style={{ color: t.bodyText }}>
                {shown.p.said}
              </p>
              <Label t={t}>Works to read · {shown.p.sources.length}</Label>
              <SourceLink sources={shown.p.sources} />
              <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                The description is the opening of its Wikipedia article, the one of these works whose words are open to reuse. The others are linked to be read and cited; none of
                their text is taken. It is here because more than one work of reference has an entry for it. Read on {POLITICAL_THEORIES_RETRIEVED}.
              </p>
            </Block>
          ) : (
            (() => {
              const a = shown.a;
              return (
                <Block>
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: shown.color }}>
                      {a.kind}
                    </p>
                    <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                      {a.name}
                    </p>
                    <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                      {[a.founded ? `Founded ${a.founded}` : "", a.headquarters].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Kpi t={t} label="Members" value={String(a.memberCount)} color={t.headText} sub="by the body's own count" />
                    <Kpi t={t} label="Checked" value={a.kind === "Human rights body" ? HUMAN_RIGHTS_CHECKED : ALLIANCES_CHECKED} color={t.headText} sub="against its own page" />
                  </div>
                  {a.what && (
                    <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                      {a.what}
                    </p>
                  )}
                  {a.agenda && a.agenda.length > 0 && (
                    <>
                      <Label t={t}>What it is working on</Label>
                      <ul className="flex flex-col gap-1">
                        {a.agenda.map((x) => (
                          <li key={x} className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {a.impact && a.impact.length > 0 && (
                    <>
                      <Label t={t}>Worth knowing</Label>
                      <ul className="flex flex-col gap-1">
                        {a.impact.map((x) => (
                          <li key={x} className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {a.members && a.members.length > 0 && (
                    <>
                      <Label t={t}>Members on the site · {a.members.length}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {a.members.map((code) => (
                          <span key={code} className="inline-flex items-center gap-1 text-[10px] font-sans px-1.5 py-0.5 rounded-full" style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}>
                            <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" width={14} height={10} className="rounded-[1px]" loading="lazy" />
                            {placeName(code)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {a.note && (
                    <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                      {a.note}
                    </p>
                  )}
                  <SourceLink sources={[a.source]} />
                </Block>
              );
            })()
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {ITEMS.length} · alliances checked {ALLIANCES_CHECKED} · political ideas read {POLITICAL_THEORIES_RETRIEVED}
        </span>
      </div>
    </div>
  );
}

export default GeopoliticsExplorer;
