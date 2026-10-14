/**
 * The public resource allocation calculator, on the Policy page: a fixed
 * budget shared out among the fifty US states by a rule the reader sets -
 * by residents, by people below the poverty line, by children, by people
 * 65 and over, in equal shares, or any mix of them - to see who receives
 * more and who less under one rule than another, and what each state
 * government spends per resident now.
 *
 * Every count is the Census Bureau's: each state's population, the shares
 * of it below the poverty line and of each age (American Community Survey),
 * and what its government spends by function (Annual Survey of State
 * Government Finances). What is worked out is said to be wherever it is
 * shown: a count of people is a published share of a published population;
 * dollars per person are a division; a state's share of the budget is its
 * share of each count, weighed as the reader chose.
 *
 * It is arithmetic on who lives where. It does not say what the money would
 * buy or change, and "need" in it is no more than the counts the reader
 * weighs. What it cannot show is said on it: access to schools, clinics,
 * transit and emergency services, the gap between town and country inside a
 * state, and what infrastructure is wanting - none is held state by state.
 */
import { ChartPieSlice } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { STATE_FINANCE, STATE_FINANCE_SOURCE, STATE_FINANCE_YEAR, type StateFinanceKey } from "../data/stateFinance";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { usStatesData } from "../data/statesData";
import { FigureTile } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const ACCENT = "#6366f1";
const STEPS = [0, 1, 2, 3, 4, 5];
type Basis = "people" | "poor" | "children" | "older" | "equal";
const BASES: { id: Basis; label: string; sub: string }[] = [
  { id: "people", label: "By residents", sub: "each state's share of the fifty states' people" },
  { id: "poor", label: "By people below the poverty line", sub: "each state's share of them" },
  { id: "children", label: "By children under 18", sub: "each state's share of them" },
  { id: "older", label: "By people 65 and over", sub: "each state's share of them" },
  { id: "equal", label: "In equal shares", sub: "a fiftieth to each state, whatever its size" },
];
const FUNCTIONS: [StateFinanceKey, string][] = [
  ["generalExpenditure", "All general spending"],
  ["education", "Education"],
  ["publicWelfare", "Public welfare"],
  ["health", "Health"],
  ["hospitals", "Hospitals"],
  ["highways", "Highways"],
  ["police", "Police"],
  ["correction", "Correction"],
  ["naturalResources", "Natural resources"],
  ["parks", "Parks and recreation"],
];

type State = { id: string; name: string; people: number; poor: number; children: number; older: number; equal: number };
const share = (groups: { pct: number }[], at: (g: never) => boolean) => (groups as never[]).find(at) as { pct: number } | undefined;
/** The fifty states, each with its people and the counts of them worked out from the published shares. */
const STATES: State[] = usStatesData.flatMap((s) => {
  const i = STATE_INDICATORS[s.id];
  if (!i?.population?.v) return [];
  const below = share(i.poverty.groups, ((g: { label: string }) => /^Below/.test(g.label)) as never);
  const under = share(i.ageGroups.groups, ((g: { group: string }) => g.group === "Under 18") as never);
  const over = share(i.ageGroups.groups, ((g: { group: string }) => g.group === "65+") as never);
  if (!below || !under || !over) return [];
  const p = i.population.v;
  return [{ id: s.id, name: s.name, people: p, poor: (p * below.pct) / 100, children: (p * under.pct) / 100, older: (p * over.pct) / 100, equal: 1 }];
});
const TOTAL = Object.fromEntries(BASES.map((b) => [b.id, STATES.reduce((a, s) => a + s[b.id], 0)])) as Record<Basis, number>;
const YEARS = (() => {
  const i = STATE_INDICATORS[STATES[0]?.id ?? ""];
  return i ? { people: i.population.y, poverty: i.poverty.y, ages: i.ageGroups.y } : { people: "", poverty: "", ages: "" };
})();

const money = (v: number) => (Math.abs(v) >= 1e12 ? `$${(v / 1e12).toFixed(2)} trillion` : Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v).toLocaleString("en-US")}`);
const dollars = (v: number) => `$${v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(2)}`;
const signedMoney = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${money(Math.abs(v))}`;

type Sort = "perPerson" | "perPoor" | "gain" | "name";
const SORTS: { value: Sort; label: string }[] = [
  { value: "gain", label: "Gains most against a split by residents" },
  { value: "perPerson", label: "Most per resident" },
  { value: "perPoor", label: "Least per person below the poverty line" },
  { value: "name", label: "By name" },
];

export default function AllocationCalculator({ className = "" }: { className?: string }) {
  const [billions, setBillions] = useState(10);
  const [weights, setWeights] = useState<Record<Basis, number>>({ people: 1, poor: 1, children: 0, older: 0, equal: 0 });
  const [sort, setSort] = useState<Sort>("gain");
  const [fn, setFn] = useState<StateFinanceKey>("education");
  const budget = Math.max(0, billions) * 1e9;
  const weightSum = BASES.reduce((a, b) => a + weights[b.id], 0);

  const rows = useMemo(() => {
    const out = STATES.map((s) => {
      // Its share of the budget: its share of each count, each counted by the weight given it.
      const part = weightSum ? BASES.reduce((a, b) => a + (weights[b.id] * s[b.id]) / TOTAL[b.id], 0) / weightSum : 0;
      const amount = budget * part;
      const flat = budget * (s.people / TOTAL.people);
      return { s, amount, perPerson: amount / s.people, perPoor: amount / s.poor, gain: amount - flat, gainPct: flat ? ((amount - flat) / flat) * 100 : 0 };
    });
    return out.sort((a, b) => (sort === "name" ? a.s.name.localeCompare(b.s.name) : sort === "perPoor" ? a.perPoor - b.perPoor : sort === "perPerson" ? b.perPerson - a.perPerson : b.gain - a.gain));
  }, [weights, weightSum, budget, sort]);
  const moved = rows.reduce((a, r) => a + Math.max(0, r.gain), 0);
  const gainers = rows.filter((r) => r.gain > 0.5).length;
  const losers = rows.filter((r) => r.gain < -0.5).length;
  const byPerson = [...rows].sort((a, b) => b.perPerson - a.perPerson);
  const byPoor = [...rows].sort((a, b) => b.perPoor - a.perPoor);

  /** What each state government spends on the chosen function, over its people. */
  const spending = useMemo(
    () =>
      STATES.flatMap((s) => {
        const v = STATE_FINANCE[s.id]?.[fn];
        return typeof v === "number" ? [{ name: s.name, per: (v * 1000) / s.people }] : [];
      }).sort((a, b) => b.per - a.per),
    [fn],
  );
  const chip = (on: boolean) => `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`;
  if (STATES.length === 0) return null;
  const cols = "minmax(8rem, 1.3fr) repeat(4, minmax(6.5rem, 1fr))";

  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT + "12", border: `1px solid ${ACCENT}22` }}>
            <ChartPieSlice size={13} weight="fill" style={{ color: ACCENT }} />
          </div>
          <span className="text-sm font-bold font-sans text-foreground">Allocate a budget</span>
          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg" style={{ background: ACCENT + "18", color: ACCENT }}>
            {STATES.length} US states
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans mt-1.5 leading-snug">
          Share a fixed sum among the states by a rule you set, and see who receives more and who less than a plain split by residents would give. The counts are the Census Bureau's; the shares and the dollars a person are worked out here. It
          is arithmetic on who lives where, and says nothing of what the money would buy.
        </p>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* The budget and the rule */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5">
          <label className="block min-w-0">
            <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">The budget</span>
            <span className="flex items-baseline gap-2 mt-2">
              <span className="text-sm font-mono text-muted-foreground">$</span>
              <input
                type="number"
                min={0}
                step={1}
                value={billions}
                onChange={(e) => setBillions(Number(e.target.value) || 0)}
                className="w-28 bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-lg font-bold font-mono text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                aria-label="The budget, in billions of dollars"
              />
              <span className="text-sm font-sans text-foreground">billion</span>
            </span>
            <span className="block text-[10px] font-sans text-muted-foreground leading-snug mt-2">
              For scale: the fifty state governments together spent {money((STATE_FINANCE.us?.generalExpenditure ?? 0) * 1000)} in {STATE_FINANCE_YEAR}.
            </span>
          </label>
          <div className="min-w-0">
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">How it is shared · 0 leaves a count out</p>
            <div className="flex flex-col gap-1.5">
              {BASES.map((b) => (
                <div key={b.id} className="flex items-center gap-2 min-w-0">
                  <span className="flex-1 min-w-0">
                    <span className={`block text-xs font-sans truncate ${weights[b.id] > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{b.label}</span>
                    <span className="block text-[9px] font-mono text-muted-foreground truncate">
                      {b.sub}
                      {weightSum && weights[b.id] > 0 ? ` · ${Math.round((weights[b.id] / weightSum) * 100)}% of the budget goes this way` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-0.5 shrink-0" role="group" aria-label={`Weight of ${b.label}`}>
                    {STEPS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setWeights((old) => ({ ...old, [b.id]: n }))}
                        aria-pressed={weights[b.id] === n}
                        className={`w-6 h-6 rounded-md text-[10px] font-mono border cursor-pointer transition-colors ${weights[b.id] === n ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
                        style={weights[b.id] === n ? { background: n === 0 ? "var(--color-muted-foreground)" : ACCENT } : undefined}
                      >
                        {n}
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {weightSum === 0 ? (
          <div className="rounded-xl px-4 py-6 text-center border border-dashed border-border bg-muted/20">
            <p className="text-[12px] font-sans text-muted-foreground">Every weight is 0, so nothing is shared out. Give a count a weight.</p>
          </div>
        ) : (
          <>
            {/* What the rule does */}
            <div className="tile-fill gap-2">
              <FigureTile label="Moved, against a split by residents" value={money(moved)} sub={`${gainers} states receive more, ${losers} less · worked out here`} />
              <FigureTile label="Most a resident" value={dollars(byPerson[0].perPerson)} sub={`${byPerson[0].s.name} · the least, ${dollars(byPerson[byPerson.length - 1].perPerson)} in ${byPerson[byPerson.length - 1].s.name}`} />
              <FigureTile label="Most a person below the poverty line" value={dollars(byPoor[0].perPoor)} sub={`${byPoor[0].s.name} · the least, ${dollars(byPoor[byPoor.length - 1].perPoor)} in ${byPoor[byPoor.length - 1].s.name}`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Every state under this rule</span>
                <span className="flex-1" />
                <div className="rounded-full border border-border px-3 py-1.5">
                  <StyledSelect value={sort} onValueChange={(v) => setSort(v as Sort)} options={SORTS} ariaLabel="How the states are ordered" triggerClassName="!text-[12px] font-semibold !text-foreground" />
                </div>
              </div>
              <div className="rounded-xl overflow-auto max-h-[60vh] border border-border">
                <div style={{ minWidth: "600px" }}>
                  <div className="compare-head grid sticky top-0 z-10 border-b border-border text-[9px] font-mono uppercase tracking-widest text-muted-foreground" style={{ gridTemplateColumns: cols }}>
                    <span className="px-3 py-2.5">State</span>
                    <span className="px-3 py-2.5 text-right">It receives</span>
                    <span className="px-3 py-2.5 text-right">A resident</span>
                    <span className="px-3 py-2.5 text-right">A person below the poverty line</span>
                    <span className="px-3 py-2.5 text-right">Against a split by residents</span>
                  </div>
                  {rows.map((r) => (
                    <div key={r.s.id} className="grid border-b border-border/50 last:border-b-0 text-xs font-mono text-right" style={{ gridTemplateColumns: cols }}>
                      <span className="px-3 py-2 text-left font-sans font-semibold text-foreground truncate">{r.s.name}</span>
                      <span className="px-3 py-2 text-foreground">{money(r.amount)}</span>
                      <span className="px-3 py-2 text-foreground">{dollars(r.perPerson)}</span>
                      <span className="px-3 py-2 text-foreground">{dollars(r.perPoor)}</span>
                      <span className={`px-3 py-2 ${r.gain > 0.5 ? "text-green-700 dark:text-green-400" : r.gain < -0.5 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                        {Math.abs(r.gain) <= 0.5 ? "the same" : `${signedMoney(r.gain)} · ${r.gainPct > 0 ? "+" : "−"}${Math.abs(r.gainPct).toFixed(1)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
                A state's share is its share of each count you weighed, each counted by its weight. The people below the poverty line, the children and the people 65 and over are counted here from the Census Bureau's shares ({YEARS.poverty}{" "}
                for poverty, {YEARS.ages} for ages) of each state's {YEARS.people} population. The last column is the difference from sharing the same budget by residents alone: what one rule gives, another takes from somewhere else.
              </p>
            </div>
          </>
        )}

        {/* What state governments spend now */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">What each state government spends now, a resident · {STATE_FINANCE_YEAR}</span>
            <span className="flex-1" />
            {FUNCTIONS.slice(0, 6).map(([k, label]) => (
              <button key={k} type="button" className={chip(fn === k)} onClick={() => setFn(k)} aria-pressed={fn === k}>
                {label}
              </button>
            ))}
            <div className="rounded-full border border-border px-3 py-1">
              <StyledSelect value={fn} onValueChange={(v) => setFn(v as StateFinanceKey)} options={FUNCTIONS.map(([value, label]) => ({ value, label }))} ariaLabel="Which spending is shown" triggerClassName="!text-[11px] font-semibold !text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
            {(
              [
                ["Most a resident", spending.slice(0, 5)],
                ["Least a resident", spending.slice(-5).reverse()],
              ] as const
            ).map(([title, list]) => (
              <div key={title} className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{title}</p>
                {list.map((x) => (
                  <div key={x.name} className="flex items-center gap-2 py-1 border-b border-border/40 last:border-b-0">
                    <span className="flex-1 min-w-0 text-xs font-sans text-foreground truncate">{x.name}</span>
                    <span className="w-24 h-1 rounded-full bg-muted overflow-hidden shrink-0" aria-hidden>
                      <span className="block h-full rounded-full" style={{ width: `${(x.per / (spending[0]?.per || 1)) * 100}%`, background: ACCENT }} />
                    </span>
                    <span className="w-20 text-right text-xs font-bold font-mono text-foreground shrink-0">{dollars(x.per)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
            The state government's own spending in fiscal {STATE_FINANCE_YEAR}, over the state's {YEARS.people} population - worked out here, and of two different years, so it is a measure of size and not an exact figure. Counties, cities and
            school districts spend besides, and are not in it: a state that leaves schools to its districts shows less here than it spends on them in all.
          </p>
        </div>

        <p className="text-[10px] font-sans text-muted-foreground leading-snug">
          Not held state by state, and so not here: how near people are to schools, clinics, transit and emergency services; the gap between town and country inside a state; and what roads, pipes and lines are wanting. “Need” in this
          calculator is only the counts you weigh.
        </p>
        <SourceLink sources={[STATE_SOURCES.population, STATE_SOURCES.acs, STATE_FINANCE_SOURCE]} />
      </div>
    </div>
  );
}
