/**
 * The policy calculator, on the Policy page: move a part of what a
 * government spends from one policy area to another, and see what the two
 * areas' shares become and what the move comes to - as a share of the
 * economy, in dollars, and for each resident.
 *
 * It is kept small on purpose: a country, two areas and an amount, and three
 * figures in answer.
 *
 * The shares are the page's own: the IMF's figures for what each government
 * spends by function (COFOG), with their year, and the same government's
 * spending as a share of GDP. The dollars use the country's GDP and the
 * figure for each resident its population, as the Countries page gives them.
 * What is worked out is said to be: the shares after the move are a sum and
 * a difference; the share of GDP is the amount moved times spending's share
 * of GDP; the dollars are that times GDP, and may be of a later year than
 * the shares, which the calculator states.
 *
 * It is arithmetic on a budget. It says nothing of what the move would do -
 * no figure is held that could - and says so.
 */
import { ArrowRight, Calculator } from "@phosphor-icons/react";
import { useState } from "react";
import { BUDGET_DIVISIONS, BUDGET_SOURCE, COUNTRY_BUDGET, type BudgetDivision } from "../data/countryBudget";
import { COUNTRY_INDICATORS, COUNTRY_INDICATOR_FALLBACKS, COUNTRY_INDICATORS_SOURCE } from "../data/countryIndicators";
import { PLACE_COUNTRIES } from "../data/placesIndex";
import { FigureTile } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const ACCENT = "#6366f1";
const COUNTRIES = Object.keys(COUNTRY_BUDGET)
  .map((code) => ({ value: code, label: PLACE_COUNTRIES[code]?.[0] ?? code }))
  .sort((a, b) => a.label.localeCompare(b.label));
const AREAS = BUDGET_DIVISIONS.map((d) => ({ value: d.id as string, label: d.label }));
const pct = (v: number) => `${Number(v.toFixed(1))}%`;
const money = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)} trillion` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)} billion` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)} million` : `$${Math.round(v).toLocaleString("en-US")}`);
const pill = "rounded-full border border-border px-3 py-1.5";
const trigger = "!text-[12px] font-semibold !text-foreground";

export default function PolicyCalculator({ className = "" }: { className?: string }) {
  const [code, setCode] = useState(COUNTRY_BUDGET.US ? "US" : (COUNTRIES[0]?.value ?? ""));
  const [from, setFrom] = useState<BudgetDivision>("GF02");
  const [to, setTo] = useState<BudgetDivision>("GF09");
  const [points, setPoints] = useState(1);
  const b = COUNTRY_BUDGET[code];
  if (!b) return null;
  const name = PLACE_COUNTRIES[code]?.[0] ?? code;
  const ind = COUNTRY_INDICATORS[code];
  const label = (id: BudgetDivision) => BUDGET_DIVISIONS.find((d) => d.id === id)?.label ?? id;
  // No more can be moved out of an area than it has.
  const most = Math.floor(b.shares[from] * 2) / 2;
  const moved = from === to ? 0 : Math.min(points, most);
  const ofGdp = b.spendingPctGdp !== undefined ? (moved * b.spendingPctGdp) / 100 : null;
  // GDP is held in billions of US dollars.
  const dollars = ofGdp !== null && ind?.gdp ? (ofGdp / 100) * ind.gdp.v * 1e9 : null;
  const each = dollars !== null && ind?.population ? dollars / ind.population.v : null;
  const indSources = [ind?.gdp, ind?.population].flatMap((f) => (f ? [f.s ? COUNTRY_INDICATOR_FALLBACKS[f.s] : { label: COUNTRY_INDICATORS_SOURCE.label, url: COUNTRY_INDICATORS_SOURCE.url }] : []));

  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT + "12", border: `1px solid ${ACCENT}22` }}>
            <Calculator size={13} weight="fill" style={{ color: ACCENT }} />
          </div>
          <span className="text-sm font-bold font-sans text-foreground">Policy calculator</span>
          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg" style={{ background: ACCENT + "18", color: ACCENT }}>
            {COUNTRIES.length} countries
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans mt-1.5 leading-snug">Move a part of what a government spends from one policy area to another, and see what it comes to. The shares are the IMF's; the rest is worked out here.</p>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* The move, as one sentence */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-sans text-foreground">
          <span>In</span>
          <div className={pill}>
            <StyledSelect value={code} onValueChange={setCode} options={COUNTRIES} ariaLabel="Which country's spending" triggerClassName={trigger} />
          </div>
          <span>move</span>
          <div className={`${pill} flex items-center gap-2`}>
            <button type="button" onClick={() => setPoints((v) => Math.max(0.5, v - 0.5))} className="w-5 h-5 rounded-full border border-border text-muted-foreground hover:text-foreground cursor-pointer leading-none" aria-label="Move less">
              −
            </button>
            <span className="font-mono font-bold tabular-nums w-10 text-center">{pct(moved)}</span>
            <button type="button" onClick={() => setPoints((v) => Math.min(Math.max(most, 0.5), v + 0.5))} className="w-5 h-5 rounded-full border border-border text-muted-foreground hover:text-foreground cursor-pointer leading-none" aria-label="Move more">
              +
            </button>
          </div>
          <span>of government spending from</span>
          <div className={pill}>
            <StyledSelect value={from} onValueChange={(v) => setFrom(v as BudgetDivision)} options={AREAS} ariaLabel="The area spending is moved from" triggerClassName={trigger} />
          </div>
          <ArrowRight size={13} className="text-muted-foreground" aria-label="to" />
          <div className={pill}>
            <StyledSelect value={to} onValueChange={(v) => setTo(v as BudgetDivision)} options={AREAS} ariaLabel="The area spending is moved to" triggerClassName={trigger} />
          </div>
        </div>

        {from === to ? (
          <p className="text-xs font-sans text-muted-foreground">Choose two different areas.</p>
        ) : most < 0.5 ? (
          <p className="text-xs font-sans text-muted-foreground">
            {name} spends {pct(b.shares[from])} of its budget on {label(from).toLowerCase()} in the IMF's figures: there is nothing there to move.
          </p>
        ) : (
          <div className="tile-fill gap-2">
            <FigureTile label={label(from)} value={`${pct(b.shares[from])} → ${pct(b.shares[from] - moved)}`} sub={`of government spending · ${b.y} · after the move, worked out here`} />
            <FigureTile label={label(to)} value={`${pct(b.shares[to])} → ${pct(b.shares[to] + moved)}`} sub={`of government spending · ${b.y} · after the move, worked out here`} />
            <FigureTile
              label="What the move comes to"
              value={dollars !== null ? money(dollars) : ofGdp !== null ? `${ofGdp.toFixed(2)}% of GDP` : "Not held"}
              sub={
                ofGdp === null
                  ? "the IMF gives no figure for this government's spending against GDP"
                  : `${ofGdp.toFixed(2)}% of GDP${dollars !== null && ind?.gdp ? ` · on ${ind.gdp.y} GDP` : ""}${each !== null ? ` · ${money(each)} a resident` : ""} · worked out here`
              }
            />
          </div>
        )}

        <p className="text-[10px] font-sans text-muted-foreground leading-snug">
          {name}'s spending is {b.basis === "general" ? "that of all levels of government" : "its central government's only"}, for {b.y}
          {b.spendingPctGdp !== undefined ? `, when it came to ${b.spendingPctGdp}% of GDP` : ""}. This is arithmetic on a budget: it does not say what the move would do to schools, hospitals or anything else - no figure is held that
          could.
        </p>
        <SourceLink sources={[{ label: `${BUDGET_SOURCE.label}, ${b.y}`, url: BUDGET_SOURCE.url }, ...indSources]} />
      </div>
    </div>
  );
}
