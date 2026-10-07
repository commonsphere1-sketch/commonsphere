/**
 * The Climate page's explorer: everything the page holds, as a list beside a
 * detail pane, in the pieces the site's other explorers are made of
 * (DataExplorer).
 *
 * Every row is read from the page's own data files, and nothing is typed in
 * here: what is measured now (climateIndicators.ts - NOAA, NASA and the
 * rest, each with its period), the nine planetary boundaries and their
 * control variables (planetaryBoundaries.ts - the Planetary Health Check
 * 2026), the tipping points, flashpoints and treaties (climateContext.ts),
 * the page's figure cards (climateFigures.ts) and its cards on species,
 * ecosystems and ecological projects (lifeOnEarth.ts). A reading also says
 * what causes it and what it does, in its agencies' words (climateCauses.ts),
 * as a boundary says what drives it and what follows. The list is searched by
 * name and narrowed by kind; the detail gives the figure, what it is set
 * against, and its source. A change on ten years before is the only thing
 * worked out, from the two readings the source gives.
 */
import { useMemo, useState } from "react";
import { Leaf, MagnifyingGlass, X } from "@phosphor-icons/react";
import { CLIMATE_INDICATORS, CLIMATE_RETRIEVED, type ClimateIndicator } from "../data/climateIndicators";
import { BOUNDARIES, PHC_2026, type PlanetaryBoundary, type Zone } from "../data/planetaryBoundaries";
import { FLASHPOINTS, TIPPING_POINTS, TREATIES, TREATIES_CHECKED, type ContextItem } from "../data/climateContext";
import { FIGURE_CARDS, type FigureCard } from "../data/climateFigures";
import { CLIMATE_CAUSES } from "../data/climateCauses";
import { LIFE_CARDS } from "../data/lifeOnEarth";
import { Block, Empty, GoButton, Kpi, Label, Row, useTokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const ACCENT = "#10b981";
const ZONE: Record<Zone, { label: string; color: string }> = {
  safe: { label: "Within the boundary", color: "#22c55e" },
  increasing: { label: "Zone of increasing risk", color: "#f59e0b" },
  high: { label: "High-risk zone", color: "#ef4444" },
};

type Kind = "measured" | "boundary" | "tipping" | "flashpoint" | "treaty" | "figures";
const KINDS: { id: Kind; label: string; one: string; color: string }[] = [
  { id: "measured", label: "Measured now", one: "Measured now", color: "#0ea5e9" },
  { id: "boundary", label: "Planetary boundaries", one: "Planetary boundary", color: "#ef4444" },
  { id: "tipping", label: "Tipping points", one: "Tipping point", color: "#f97316" },
  { id: "flashpoint", label: "Flashpoints", one: "Flashpoint", color: "#f59e0b" },
  { id: "treaty", label: "Treaties", one: "Treaty", color: "#8b5cf6" },
  { id: "figures", label: "Figure cards", one: "Figures", color: "#10b981" },
];

type Item =
  | { key: string; kind: "measured"; name: string; said: string; m: ClimateIndicator }
  | { key: string; kind: "boundary"; name: string; said: string; b: PlanetaryBoundary }
  | { key: string; kind: "tipping" | "flashpoint" | "treaty"; name: string; said: string; c: ContextItem }
  | { key: string; kind: "figures"; name: string; said: string; f: FigureCard };

/** A reading as printed: to the precision the source gives it. */
const reading = (v: number) => (Math.abs(v) >= 100 ? v.toLocaleString("en-US", { maximumFractionDigits: 1 }) : String(v));

const ITEMS: Item[] = [
  ...CLIMATE_INDICATORS.map((m): Item => ({ key: `m-${m.id}`, kind: "measured", name: m.label, said: `${reading(m.value)} ${m.unit} · ${m.period}`, m })),
  ...BOUNDARIES.map((b): Item => ({ key: `b-${b.id}`, kind: "boundary", name: b.name, said: ZONE[b.zone].label, b })),
  ...TIPPING_POINTS.map((c): Item => ({ key: `t-${c.id}`, kind: "tipping", name: c.label, said: c.val, c })),
  ...FLASHPOINTS.map((c): Item => ({ key: `f-${c.id}`, kind: "flashpoint", name: c.label, said: c.val, c })),
  ...TREATIES.map((c): Item => ({ key: `y-${c.id}`, kind: "treaty", name: c.label, said: c.val, c })),
  ...[...LIFE_CARDS, ...FIGURE_CARDS].map((f): Item => ({ key: `g-${f.id}`, kind: "figures", name: f.title, said: f.kicker, f })),
];

export function ClimateExplorer({ onOpenBoundary }: { /** Shows a boundary in the page's own wheel and panel. */ onOpenBoundary?: (id: string) => void }) {
  const t = useTokens();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const q = search.trim().toLowerCase();
  const list = useMemo(() => ITEMS.filter((x) => (!kind || x.kind === kind) && (!q || [x.name, x.said].some((s) => s.toLowerCase().includes(q)))), [q, kind]);
  const shown = (pickedKey ? ITEMS.find((x) => x.key === pickedKey) : null) ?? list[0] ?? null;
  const groups = KINDS.map((k) => ({ k, rows: list.filter((x) => x.kind === k.id) })).filter((g) => g.rows.length > 0);

  return (
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full mb-6" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: ACCENT }}>
        <Leaf size={12} weight="fill" aria-hidden />
        <h2 className="text-[11px] font-bold font-sans">Climate and planetary boundaries</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + "15" }}>
          {ITEMS.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search the climate page's measures"
          placeholder="Search measures, boundaries, tipping points, treaties…"
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
          {/* How many of each kind the page holds: pick one to see only those. */}
          <div className="grid grid-cols-3 gap-2 px-4 pt-3">
            {KINDS.map((k) => {
              const on = kind === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setKind(on ? null : k.id);
                    setPickedKey(null);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: on ? k.color + "22" : t.tile, border: `1px solid ${on ? k.color + "88" : t.gridLine}` }}
                >
                  <span className="block text-sm font-bold font-mono" style={{ color: k.color }}>
                    {ITEMS.filter((x) => x.kind === k.id).length}
                  </span>
                  <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                    {k.label}
                  </span>
                </button>
              );
            })}
          </div>
          {groups.map((g) => (
            <div key={g.k.id} className="flex flex-col">
              <div className="px-4 pt-3 pb-1">
                <Label t={t}>
                  {g.k.label} · {g.rows.length}
                </Label>
              </div>
              {g.rows.map((x) => {
                const tone = x.kind === "boundary" ? ZONE[x.b.zone].color : "c" in x ? x.c.color : g.k.color;
                return (
                  <Row key={x.key} t={t} selected={shown?.key === x.key} color={g.k.color} onClick={() => setPickedKey(x.key)}>
                    <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: tone }} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                        {x.name}
                      </span>
                      <span className="block text-[10px] font-mono truncate" style={{ color: t.mutedText }}>
                        {x.said}
                      </span>
                    </span>
                  </Row>
                );
              })}
            </div>
          ))}
          {list.length === 0 && <Empty t={t}>Nothing on the page matches the search.</Empty>}
        </div>

        <div className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {shown ? (
            <>
              <Block>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: KINDS.find((k) => k.id === shown.kind)!.color }}>
                    {KINDS.find((k) => k.id === shown.kind)!.one}
                  </p>
                  <p className="text-sm font-bold font-sans leading-tight mt-0.5" style={{ color: t.headText }}>
                    {shown.name}
                  </p>
                  <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
                    {shown.said}
                  </p>
                </div>
              </Block>

              {shown.kind === "measured" && (
                <Block>
                  <div className="grid grid-cols-2 gap-2">
                    <Kpi t={t} label={shown.m.period} value={`${reading(shown.m.value)} ${shown.m.unit}`} color={t.headText} sub="the latest reading" />
                    <Kpi
                      t={t}
                      label="Ten years before"
                      value={shown.m.decadeAgo === null ? "not in the series" : `${reading(shown.m.decadeAgo)} ${shown.m.unit}`}
                      color={t.headText}
                      sub={shown.m.decadeAgo === null ? undefined : `a change of ${shown.m.value - shown.m.decadeAgo >= 0 ? "+" : "−"}${reading(+Math.abs(shown.m.value - shown.m.decadeAgo).toFixed(2))}`}
                    />
                  </div>
                  {shown.m.note && (
                    <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                      {shown.m.note}
                    </p>
                  )}
                  <SourceLink sources={[{ label: `${shown.m.source} · read on ${CLIMATE_RETRIEVED}`, url: shown.m.url }]} />
                  {CLIMATE_CAUSES[shown.m.id] && (
                    <>
                      <Label t={t}>Cause</Label>
                      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                        {CLIMATE_CAUSES[shown.m.id].cause}
                      </p>
                      <Label t={t}>Effect</Label>
                      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                        {CLIMATE_CAUSES[shown.m.id].effect}
                      </p>
                      <SourceLink sources={CLIMATE_CAUSES[shown.m.id].sources} />
                    </>
                  )}
                </Block>
              )}

              {shown.kind === "boundary" && (
                <Block>
                  <span className="self-start inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: ZONE[shown.b.zone].color + "22", color: t.headText }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ZONE[shown.b.zone].color }} aria-hidden />
                    {ZONE[shown.b.zone].label} · {shown.b.verdict}
                  </span>
                  <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {shown.b.summary}
                  </p>
                  <Label t={t}>What it is measured by</Label>
                  <div className="flex flex-col">
                    {shown.b.variables.map((v) => (
                      <div key={v.name} className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                        <span className="text-[11px] font-sans min-w-0" style={{ color: t.headText }}>
                          {v.name}
                          {v.regional ? <span style={{ color: t.mutedText }}> · regional</span> : null}
                        </span>
                        <span className="text-[10px] font-mono font-semibold shrink-0 text-right" style={{ color: ZONE[v.zone].color }}>
                          {v.current}
                          {v.unit ? ` ${v.unit}` : ""}
                          <span className="font-normal" style={{ color: t.mutedText }}>
                            {" "}
                            · boundary {v.boundary}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {shown.b.drivers.length > 0 && (
                    <>
                      <Label t={t}>Cause</Label>
                      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                        {shown.b.drivers.join("; ")}.
                      </p>
                    </>
                  )}
                  {shown.b.impacts.length > 0 && (
                    <>
                      <Label t={t}>Effect</Label>
                      <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                        {shown.b.impacts.join("; ")}.
                      </p>
                    </>
                  )}
                  <SourceLink sources={[{ label: `Planetary Health Check 2026, page ${shown.b.page}`, url: PHC_2026.summaryUrl }]} />
                  {onOpenBoundary && (
                    <GoButton color={ACCENT} onClick={() => onOpenBoundary(shown.b.id)}>
                      Show it on the wheel below
                    </GoButton>
                  )}
                </Block>
              )}

              {"c" in shown && (
                <Block>
                  <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                    {shown.c.summary}
                  </p>
                  <SourceLink sources={shown.c.sources} />
                  {shown.kind === "treaty" && (
                    <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                      Parties as the UN Treaty Collection listed them on {TREATIES_CHECKED}.
                    </p>
                  )}
                </Block>
              )}

              {shown.kind === "figures" && (
                <Block>
                  {shown.f.figures && (
                    <div className="flex flex-col">
                      {shown.f.figures.map((x) => (
                        <div key={x.label} className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                          <span className="text-[11px] font-sans min-w-0" style={{ color: t.bodyText }}>
                            {x.label}
                          </span>
                          <span className="text-[11px] font-mono font-bold shrink-0 text-right" style={{ color: t.headText }}>
                            {x.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {shown.f.bars && (
                    <>
                      <Label t={t}>{shown.f.bars.caption}</Label>
                      <div className="flex flex-col gap-2">
                        {shown.f.bars.rows.map((r) => (
                          <div key={r.label}>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-[11px] font-sans min-w-0" style={{ color: t.bodyText }}>
                                {r.label}
                              </span>
                              <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
                                {r.display}
                              </span>
                            </div>
                            <div className="relative h-1.5 rounded-full overflow-hidden mt-1" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(1, (100 * r.value) / shown.f.bars!.max))}%`, background: r.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {shown.f.events && (
                    <div className="flex flex-col">
                      {shown.f.events.map((e) => (
                        <div key={e.title} className="py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
                          <p className="text-[11px] font-sans font-semibold" style={{ color: t.headText }}>
                            {e.title}
                          </p>
                          <p className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
                            {e.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {shown.f.callout && (
                    <p className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                      <span className="font-semibold" style={{ color: t.headText }}>
                        {shown.f.callout.title}
                      </span>{" "}
                      {shown.f.callout.body}
                    </p>
                  )}
                  <SourceLink sources={shown.f.sources} />
                </Block>
              )}
            </>
          ) : (
            <Empty t={t}>Nothing to show.</Empty>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {list.length} of {ITEMS.length} · measures read on {CLIMATE_RETRIEVED} · boundaries from the Planetary Health Check 2026
        </span>
      </div>
    </div>
  );
}

export default ClimateExplorer;
