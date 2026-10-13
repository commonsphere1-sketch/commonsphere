/**
 * Build your own index, on the Rankings page: the page's own measures of
 * countries and US states - health, schooling, housing, income and work,
 * safety, infrastructure, equality and participation - each given a weight
 * by the reader, and combined into one score by a rule set out in full.
 *
 * It holds no figures of its own. Every measure is one the page already
 * ranks on or compares, from the source the page names for it; this tool
 * only weighs them. The rule is the page's own (computeComposite): each
 * measure is put on a scale of 0 to 100 between the lowest and the highest
 * value any place has - turned over where lower is better - and a place's
 * score is the weighted mean of its measures, over the measures it has.
 * With the weights it opens on, the score is the page's composite score.
 *
 * A score is arithmetic on published figures, not a published figure: the
 * tool says so, and says how many of the weighted measures each place has,
 * since a place scored on two measures and a place scored on nine are not
 * on the same footing. Its strongest and weakest measures are read off the
 * same scales. The figures are each measure's latest: the page holds no
 * earlier years to compare a place with itself.
 */
import { ArrowCounterClockwise, Faders } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

export type IndexMeasure = {
  id: string;
  label: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
  /** The heading it is weighed under, where the page names one; otherwise the Rankings page's own headings are used. */
  group?: string;
  /** The two ends of its own scale, where it has one - an index of 0 to 1, a share of 0 to 100: it is then set on that scale, not between the lowest and highest place. */
  scale?: [number, number];
  /** Whose figure it is and of what year, said under its name. */
  by?: string;
};
export type IndexEntity = { id: string; name: string; type: "country" | "state"; flag: string; values: Record<string, number> };

const ACCENT = "#6366f1";
/** The heading each measure is weighed under. A measure not named here is under "Other". */
const GROUPS: [title: string, ids: string[]][] = [
  ["Overall development", ["hdi"]],
  ["Health", ["lifeExpectancy", "physicians", "maternalMortality"]],
  ["Education", ["highSchoolPct", "bachelorsPct"]],
  ["Income and work", ["gdpPerCapita", "gdpGrowth", "unemployment", "inflation", "tradeBalance", "medianIncome", "averageIncome", "medianDailyIncome", "povertyPct"]],
  ["Housing", ["homelessness", "rentBurdenPct"]],
  ["Safety and justice", ["incarceration"]],
  ["Infrastructure", ["electricityAccess", "internetPct"]],
  ["Equality, integrity and participation", ["gini", "cpiScore", "parliamentFemale"]],
];
const STEPS = [0, 1, 2, 3, 4, 5];
/** How many places are listed at each end. */
const SHOWN = 10;

type Scored = { e: IndexEntity; score: number; has: number; parts: { m: IndexMeasure; on: number; weight: number }[] };

export default function IndexBuilder({
  entities,
  measures,
  defaults,
  title = "Build your own index",
  tag = "Social conditions",
  lead = "Weigh the page's measures as you see fit, and every country and US state is scored again. A score is worked out here from published figures - it is not a published figure - and the rule is given in full below the weights.",
  defaultsLabel = "The page's weights",
  defaultsNote = "These are the weights of the page's own composite score, and the rule is the same.",
  otherNote = "The page's own composite score uses the weights the first button restores.",
  className = "",
}: {
  entities: IndexEntity[];
  measures: IndexMeasure[];
  /** The weights it opens on, by measure. */
  defaults: Record<string, number>;
  title?: string;
  tag?: string;
  lead?: string;
  /** What the button that restores the opening weights says, and what is said of those weights and of others. */
  defaultsLabel?: string;
  defaultsNote?: string;
  otherNote?: string;
  className?: string;
}) {
  const grouped = useMemo(() => {
    // A page that names its measures' headings is grouped by them, in the order they first come.
    if (measures.some((m) => m.group)) {
      const titles = [...new Set(measures.map((m) => m.group ?? "Other"))];
      return titles.map((t) => ({ title: t, list: measures.filter((m) => (m.group ?? "Other") === t) }));
    }
    const named = new Set(GROUPS.flatMap(([, ids]) => ids));
    const byId = new Map(measures.map((m) => [m.id, m]));
    const out = GROUPS.map(([title, ids]) => ({ title, list: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])) }));
    const other = measures.filter((m) => !named.has(m.id));
    return [...out, ...(other.length ? [{ title: "Other", list: other }] : [])].filter((g) => g.list.length);
  }, [measures]);
  const [weights, setWeights] = useState<Record<string, number>>(defaults);
  const [scope, setScope] = useState<"all" | "country" | "state">("all");
  /** How many of the weighted measures a place must have to be scored: any, at least half, or every one. */
  const [cover, setCover] = useState<"any" | "half" | "every">("half");
  const [picked, setPicked] = useState<string | null>(null);

  /** Each measure's lowest and highest value over every place that has it: the ends of its scale. */
  const range = useMemo(() => {
    const out: Record<string, { min: number; max: number; n: number }> = {};
    for (const m of measures) {
      const vs = entities.map((e) => e.values[m.id]).filter((v) => Number.isFinite(v));
      if (vs.length) out[m.id] = { min: Math.min(...vs), max: Math.max(...vs), n: vs.length };
    }
    return out;
  }, [entities, measures]);
  const weighted = measures.filter((m) => (weights[m.id] ?? 0) > 0 && range[m.id]);

  const scored = useMemo(() => {
    const out: Scored[] = [];
    for (const e of entities) {
      if (scope !== "all" && e.type !== scope) continue;
      const parts = weighted.flatMap((m) => {
        const v = e.values[m.id];
        if (!Number.isFinite(v)) return [];
        // On its own scale where it has one; otherwise between the lowest and the highest place.
        const [min, max] = m.scale ?? [range[m.id].min, range[m.id].max];
        // A measure every place has the same value of says nothing between them: it sits at the middle, as on the page.
        const raw = max === min ? 50 : Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
        return [{ m, on: m.higherIsBetter ? raw : 100 - raw, weight: weights[m.id] }];
      });
      const needed = cover === "every" ? weighted.length : cover === "half" ? Math.ceil(weighted.length / 2) : 1;
      if (parts.length < needed) continue;
      const total = parts.reduce((a, p) => a + p.weight, 0);
      out.push({ e, score: Math.round((parts.reduce((a, p) => a + p.on * p.weight, 0) / total) * 10) / 10, has: parts.length, parts });
    }
    return out.sort((a, b) => b.score - a.score);
  }, [entities, weighted, weights, range, scope, cover]);

  /** Whether there are both countries and states to choose between. */
  const both = entities.some((e) => e.type === "country") && entities.some((e) => e.type === "state");
  const open = scored.find((s) => s.e.id === picked) ?? null;
  const rankOf = (s: Scored) => scored.indexOf(s) + 1;
  const same = measures.every((m) => (weights[m.id] ?? 0) === (defaults[m.id] ?? 0));
  const chip = (on: boolean) => `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`;

  const row = (s: Scored) => (
    <button
      key={s.e.id}
      type="button"
      onClick={() => setPicked(picked === s.e.id ? null : s.e.id)}
      aria-pressed={picked === s.e.id}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left cursor-pointer transition-colors ${picked === s.e.id ? "border-secondary/50 bg-secondary/5" : "border-border hover:bg-muted/40"}`}
    >
      <span className="w-7 text-[10px] font-mono text-muted-foreground shrink-0">#{rankOf(s)}</span>
      <img src={s.e.flag} alt="" className="w-5 h-3.5 rounded-[2px] object-cover border border-border shrink-0" onError={(ev) => (ev.currentTarget.style.visibility = "hidden")} />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold font-sans text-foreground truncate">{s.e.name}</span>
        <span className="block h-1 rounded-full bg-muted mt-1 overflow-hidden" aria-hidden>
          <span className="block h-full rounded-full" style={{ width: `${s.score}%`, background: ACCENT }} />
        </span>
      </span>
      <span className="text-right shrink-0">
        <span className="block text-xs font-bold font-mono text-foreground">{s.score.toFixed(1)}</span>
        <span className="block text-[9px] font-mono text-muted-foreground">
          {s.has} of {weighted.length}
        </span>
      </span>
    </button>
  );

  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT + "12", border: `1px solid ${ACCENT}22` }}>
            <Faders size={13} weight="fill" style={{ color: ACCENT }} />
          </div>
          <span className="text-sm font-bold font-sans text-foreground">{title}</span>
          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg" style={{ background: ACCENT + "18", color: ACCENT }}>
            {tag}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans mt-1.5 leading-snug">
          {lead}
        </p>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Weights */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Weights · 0 leaves a measure out</span>
            <span className="flex-1" />
            <button type="button" className={chip(same)} onClick={() => setWeights(defaults)}>
              <ArrowCounterClockwise size={11} className="inline -mt-0.5 mr-1" aria-hidden />
              {defaultsLabel}
            </button>
            <button type="button" className={chip(false)} onClick={() => setWeights(Object.fromEntries(measures.map((m) => [m.id, 1])))}>
              All equal
            </button>
            <button type="button" className={chip(false)} onClick={() => setWeights({})}>
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
            {grouped.map((g) => (
              <div key={g.title} className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{g.title}</p>
                <div className="flex flex-col gap-1.5">
                  {g.list.map((m) => {
                    const w = weights[m.id] ?? 0;
                    const r = range[m.id];
                    return (
                      <div key={m.id} className="flex items-center gap-2 min-w-0">
                        <span className="flex-1 min-w-0">
                          <span className={`block text-xs font-sans truncate ${w > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`} title={m.label}>
                            {m.label}
                          </span>
                          <span className="block text-[9px] font-mono text-muted-foreground truncate">
                            {m.by ? `${m.by} · ` : ""}
                            {m.higherIsBetter ? "higher is better" : "lower is better"}
                            {r ? ` · ${r.n} places have it` : " · no place has it"}
                          </span>
                        </span>
                        {/* A weight between two buttons - the page's own 1.5 and 2.5 - is said in figures. */}
                        <span className="w-7 text-right text-[10px] font-mono text-muted-foreground shrink-0">{w > 0 ? `×${w}` : ""}</span>
                        <span className="flex items-center gap-0.5 shrink-0" role="group" aria-label={`Weight of ${m.label}`}>
                          {STEPS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setWeights((old) => ({ ...old, [m.id]: n }))}
                              aria-pressed={w === n}
                              disabled={!r}
                              className={`w-6 h-6 rounded-md text-[10px] font-mono border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default ${w === n ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
                              style={w === n ? { background: n === 0 ? "var(--color-muted-foreground)" : ACCENT } : undefined}
                            >
                              {n}
                            </button>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
            The rule: each measure is set on a scale of 0 to 100 between the lowest and the highest value any place has{measures.some((m) => m.scale) ? " - or, where it has a scale of its own, an index of 0 to 1 or a share of 0 to 100, on that scale" : ""},
            turned over where lower is better; a place's score is the mean of its measures, each counted by its weight, over the measures it has. {same ? defaultsNote : otherNote} The figures are each measure's latest - no earlier years are held
            to compare a place with itself.
          </p>
        </div>

        {/* Result */}
        {weighted.length === 0 ? (
          <div className="rounded-xl px-4 py-6 text-center border border-dashed border-border bg-muted/20">
            <p className="text-[12px] font-sans text-muted-foreground">Every weight is 0, so there is nothing to score. Give a measure a weight.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                {scored.length} places scored on {weighted.length} {weighted.length === 1 ? "measure" : "measures"}
              </span>
              <span className="flex-1" />
              {(both ? (["all", "country", "state"] as const) : []).map((k) => (
                <button key={k} type="button" className={chip(scope === k)} onClick={() => setScope(k)} aria-pressed={scope === k}>
                  {k === "all" ? "All" : k === "country" ? "Countries" : "US states"}
                </button>
              ))}
              <span className="w-px h-4 bg-border mx-0.5" aria-hidden />
              {(
                [
                  ["half", "With half the measures or more"],
                  ["every", "With every measure"],
                  ["any", "With any"],
                ] as const
              ).map(([k, label]) => (
                <button key={k} type="button" className={chip(cover === k)} onClick={() => setCover(k)} aria-pressed={cover === k}>
                  {label}
                </button>
              ))}
            </div>
            {scored.length === 0 ? (
              <p className="text-xs font-sans text-muted-foreground">No place has {cover === "every" ? "every one of" : cover === "half" ? "half of" : "any of"} the weighted measures.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Highest</p>
                  <div className="flex flex-col gap-1.5">{scored.slice(0, SHOWN).map(row)}</div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Lowest</p>
                  <div className="flex flex-col gap-1.5">
                    {scored
                      .slice(Math.max(SHOWN, scored.length - SHOWN))
                      .reverse()
                      .map(row)}
                  </div>
                </div>
              </div>
            )}
            <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
              Under each score is how many of the weighted measures the place has: a score on two measures and a score on nine are not on the same footing, so a place is scored only where it has at least half of them unless you choose otherwise. Press a place to see what its score is made of.
            </p>
          </div>
        )}

        {/* One place's score, measure by measure */}
        {open && (
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <img src={open.e.flag} alt="" className="w-7 h-5 rounded-[3px] object-cover border border-border shrink-0" onError={(ev) => (ev.currentTarget.style.visibility = "hidden")} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold font-sans text-foreground truncate">{open.e.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  score {open.score.toFixed(1)} · #{rankOf(open)} of {scored.length} · on {open.has} of {weighted.length} weighted measures
                </p>
              </div>
            </div>
            {open.parts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {(
                  [
                    ["Its strongest", [...open.parts].sort((a, b) => b.on - a.on).slice(0, 3)],
                    ["Its weakest", [...open.parts].sort((a, b) => a.on - b.on).slice(0, 3)],
                  ] as const
                ).map(([title, list]) => (
                  <div key={title} className="rounded-lg border border-border bg-background/40 px-3 py-2.5 min-w-0">
                    <p className="text-[10px] font-sans text-muted-foreground mb-1">{title} · where it stands, 0 to 100</p>
                    {list.map((p) => (
                      <p key={p.m.id} className="text-xs font-sans text-foreground truncate">
                        <span className="font-mono font-bold">{Math.round(p.on)}</span> · {p.m.label}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {open.parts.map((p) => (
                <div key={p.m.id} className="flex items-center gap-2 min-w-0">
                  <span className="w-[42%] text-xs font-sans text-foreground truncate" title={p.m.label}>
                    {p.m.label}
                  </span>
                  <span className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${p.on}%`, background: ACCENT }} />
                  </span>
                  <span className="w-9 text-right text-[10px] font-mono text-muted-foreground shrink-0">{Math.round(p.on)}</span>
                  <span className="w-20 text-right text-[10px] font-mono font-bold text-foreground shrink-0 truncate">{p.m.format(open.e.values[p.m.id])}</span>
                  <span className="w-8 text-right text-[9px] font-mono text-muted-foreground shrink-0">×{p.weight}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
              Each bar is where {open.e.name} stands on that measure, from 0 to 100 by the rule above; beside it the published figure, and the weight it is counted by.
              {weighted.length > open.has ? ` It has no figure for ${weighted.length - open.has} of the weighted measures, which are left out of its score.` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
