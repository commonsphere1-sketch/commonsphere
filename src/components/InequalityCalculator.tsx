/**
 * The inequality calculator, on the Economies page: how a country's or a US
 * state's income is shared among five equal parts of its people, and what
 * the shares would be after a change the reader sets - a flat tax paid back
 * to everyone equally, or a part of the richest fifth's share moved to the
 * poorest.
 *
 * What is published is published: the shares by fifth and the Gini index are
 * the World Bank's for a country (with the survey's year) and the Census
 * Bureau's for a state. What follows from a change is arithmetic on those
 * shares and nothing more, and the calculator says so beside every such
 * figure. It assumes what it must - that nobody earns more or less because
 * of the change - and says that too: it is not a forecast of what a real tax
 * would do.
 *
 * One figure is worked out even before any change: an index of inequality
 * from the five fifths alone, by the same rule as a Gini index. It counts no
 * inequality inside a fifth, so it is lower than the published Gini; it is
 * given so that "before" and "after" are measured the same way, and is never
 * put in the published Gini's place.
 *
 * Wealth - as against income - median income and mobility between
 * generations are not held by the site, and are not here.
 */
import { Scales } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { COUNTRY_INDEXES, INDEX_DEFS } from "../data/countryIndexes";
import { COUNTRY_PEOPLE, COUNTRY_PEOPLE_SOURCES } from "../data/countryPeople";
import { PLACE_COUNTRIES } from "../data/placesIndex";
import { STATE_PEOPLE, STATE_PEOPLE_SOURCES, STATE_PEOPLE_YEAR } from "../data/statePeople";
import { usStatesData } from "../data/statesData";
import { ChartNote, ChartTitle, FigureTile, PartsBar } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const ACCENT = "#6366f1";
const FIFTHS = ["Poorest fifth", "Second fifth", "Middle fifth", "Fourth fifth", "Richest fifth"];
const FIFTH_COLORS = ["#fde68a", "#fcd34d", "#f59e0b", "#d97706", "#92400e"];
type Source = { label: string; url: string };
type Place = { id: string; name: string; fifths: number[]; year: number; of: string; gini?: { text: string; sub: string }; sources: Source[] };

const giniSource = INDEX_DEFS.find((d) => d.id === "gini")?.source;
const PLACES: Place[] = [
  ...Object.entries(COUNTRY_PEOPLE).flatMap(([code, p]): Place[] => {
    if (!p.income || p.income.fifths.length !== 5) return [];
    const g = COUNTRY_INDEXES[code]?.gini;
    return [
      {
        id: `c:${code}`,
        name: PLACE_COUNTRIES[code]?.[0] ?? code,
        fifths: p.income.fifths,
        year: p.income.y,
        of: "income or spending, as the World Bank's survey measures it",
        gini: g ? { text: String(g.v), sub: `World Bank · ${g.y} · 0 everyone alike, 100 one person with all` } : undefined,
        sources: [COUNTRY_PEOPLE_SOURCES.income, ...(g && giniSource ? [giniSource] : [])],
      },
    ];
  }),
  ...usStatesData.flatMap((s): Place[] => {
    const p = STATE_PEOPLE[s.id];
    return p
      ? [{ id: `s:${s.id}`, name: `${s.name} · US state`, fifths: p.fifths, year: STATE_PEOPLE_YEAR, of: "household income, as the Census Bureau's survey measures it", gini: { text: String(p.gini), sub: `Census Bureau · ${STATE_PEOPLE_YEAR} · 0 every household alike, 1 one with all` }, sources: [STATE_PEOPLE_SOURCES.income] }]
      : [];
  }),
].sort((a, b) => a.name.localeCompare(b.name));

/** The shares made to add to a hundred: a survey's five figures can miss it by a tenth through rounding. */
const whole = (s: number[]) => {
  const sum = s.reduce((a, v) => a + v, 0);
  return s.map((v) => (v * 100) / sum);
};
/** An index of inequality from five fifths alone, 0 to 100, by the Gini rule: twice the area between the line of equal shares and the line the shares draw. */
function fromFifths(s: number[]) {
  let run = 0;
  let area = 0;
  for (const v of s) {
    area += (run + run + v / 100) * 0.2 * 0.5;
    run += v / 100;
  }
  return (1 - 2 * area) * 100;
}
const one = (v: number) => Number(v.toFixed(1));
const signed = (v: number, unit: string) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(one(v))}${unit === " pts" && Math.abs(one(v)) === 1 ? " pt" : unit}`;

type Mode = "dividend" | "transfer";

export default function InequalityCalculator({ className = "" }: { className?: string }) {
  const [id, setId] = useState(PLACES.find((p) => p.id === "c:US")?.id ?? PLACES[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("dividend");
  const [rate, setRate] = useState(10);
  const [moved, setMoved] = useState(5);
  const place = PLACES.find((p) => p.id === id);
  const before = useMemo(() => (place ? whole(place.fifths) : []), [place]);
  /** The most that can be moved from the richest fifth without its share falling below the fourth fifth's: past that it is no longer the richest. */
  const most = before.length ? Math.max(0, Math.floor(before[4] - before[3])) : 0;
  const take = Math.min(moved, most);
  const after = useMemo(() => {
    if (!before.length) return [];
    if (mode === "dividend") return before.map((s) => s * (1 - rate / 100) + (20 * rate) / 100);
    return before.map((s, i) => (i === 4 ? s - take : i === 0 ? s + take : s));
  }, [before, mode, rate, take]);
  if (!place) return null;
  const ratio = (s: number[]) => s[4] / s[0];
  const changed = mode === "dividend" ? rate > 0 : take > 0;
  const chip = (on: boolean) => `px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${on ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`;

  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT + "12", border: `1px solid ${ACCENT}22` }}>
            <Scales size={13} weight="fill" style={{ color: ACCENT }} />
          </div>
          <span className="text-sm font-bold font-sans text-foreground">Inequality calculator</span>
          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg" style={{ background: ACCENT + "18", color: ACCENT }}>
            {PLACES.length} countries and US states
          </span>
          <span className="flex-1" />
          <div className="rounded-full border border-border px-3 py-1.5">
            <StyledSelect value={id} onValueChange={setId} options={PLACES.map((p) => ({ value: p.id, label: p.name }))} ariaLabel="Whose income the calculator shows" triggerClassName="!text-[12px] font-semibold !text-foreground" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans mt-1.5 leading-snug">
          How income is shared among five equal parts of a place's people, as published - and what the shares would be after a change you set, worked out here by arithmetic alone.
        </p>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* As published */}
        <div>
          <ChartTitle>
            {place.name.replace(" · US state", "")} · the share of {place.of.split(",")[0]} that goes to each fifth · % · {place.year}
          </ChartTitle>
          <PartsBar label={`How ${place.name}'s income is shared among five equal parts of its people, ${place.year}`} columns={3} colors={FIFTH_COLORS} parts={place.fifths.map((v, i) => ({ label: FIFTHS[i], value: v, text: `${v}%` }))} />
          <div className="tile-fill gap-2 mt-3">
            {place.gini && <FigureTile label="Gini index, as published" value={place.gini.text} sub={place.gini.sub} />}
            <FigureTile label="Richest fifth to poorest fifth" value={`${one(ratio(before))} times`} sub={`the one's share over the other's · worked out here · ${place.year}`} />
            <FigureTile label="Inequality from the five fifths alone" value={String(one(fromFifths(before)))} sub="0 to 100, by the Gini rule · worked out here · lower than the published index, as it counts none inside a fifth" />
          </div>
        </div>

        {/* The change */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">A change to try</span>
            <span className="flex-1" />
            <button type="button" className={chip(mode === "dividend")} onClick={() => setMode("dividend")} aria-pressed={mode === "dividend"}>
              A flat tax, paid back equally
            </button>
            <button type="button" className={chip(mode === "transfer")} onClick={() => setMode("transfer")} aria-pressed={mode === "transfer"}>
              From the richest fifth to the poorest
            </button>
          </div>
          {mode === "dividend" ? (
            <label className="block">
              <span className="flex items-baseline justify-between gap-2 text-xs font-sans text-foreground">
                <span>Every income is taxed at one rate, and what is raised is paid out in equal amounts to everyone</span>
                <span className="font-mono font-bold shrink-0">{rate}%</span>
              </span>
              <input type="range" min={0} max={40} step={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full mt-2 cursor-pointer" style={{ accentColor: ACCENT }} aria-label="The rate of the flat tax, per cent" />
            </label>
          ) : (
            <label className="block">
              <span className="flex items-baseline justify-between gap-2 text-xs font-sans text-foreground">
                <span>A part of all income is moved from the richest fifth to the poorest fifth</span>
                <span className="font-mono font-bold shrink-0">{take} of every 100</span>
              </span>
              <input type="range" min={0} max={Math.max(most, 1)} step={1} value={take} onChange={(e) => setMoved(Number(e.target.value))} disabled={most === 0} className="w-full mt-2 cursor-pointer" style={{ accentColor: ACCENT }} aria-label="How much of all income is moved, in hundredths" />
              <span className="block text-[10px] font-sans text-muted-foreground mt-1">Up to {most}: past that the richest fifth would have less than the fourth.</span>
            </label>
          )}

          <div className="mt-4">
            <ChartTitle>The shares after the change · % · worked out here</ChartTitle>
            <PartsBar label={`${place.name}'s shares of income after the change`} columns={3} colors={FIFTH_COLORS} parts={after.map((v, i) => ({ label: FIFTHS[i], value: v, text: `${one(v)}%` }))} />
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground text-right">
                  <th className="text-left font-normal py-1 pr-2">Fifth</th>
                  <th className="font-normal py-1 px-2">Share now</th>
                  <th className="font-normal py-1 px-2">Share after</th>
                  <th className="font-normal py-1 px-2">Change in share</th>
                  <th className="font-normal py-1 pl-2">Change in its income</th>
                </tr>
              </thead>
              <tbody>
                {before.map((s, i) => (
                  <tr key={i} className="border-t border-border/50 text-right font-mono">
                    <td className="text-left font-sans text-foreground py-1.5 pr-2">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: FIFTH_COLORS[i] }} aria-hidden />
                      {FIFTHS[i]}
                    </td>
                    <td className="py-1.5 px-2 text-muted-foreground">{one(s)}%</td>
                    <td className="py-1.5 px-2 font-bold text-foreground">{one(after[i])}%</td>
                    <td className="py-1.5 px-2 text-foreground">{changed ? signed(after[i] - s, " pts") : "—"}</td>
                    <td className="py-1.5 pl-2 text-foreground">{changed ? signed((after[i] / s - 1) * 100, "%") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tile-fill gap-2 mt-3">
            <FigureTile label="Richest fifth to poorest fifth, after" value={`${one(ratio(after))} times`} sub={`from ${one(ratio(before))} times · worked out here`} />
            <FigureTile label="Inequality from the five fifths, after" value={String(one(fromFifths(after)))} sub={`from ${one(fromFifths(before))} · 0 to 100 · worked out here`} />
          </div>
          <ChartNote className="mt-3">
            Arithmetic, not a forecast. It takes the published shares and assumes nobody earns, works or spends differently because of the change, that the tax is collected in full, and that a fifth's people stay the same people. A real
            tax or benefit changes behaviour, and its effect is not known from these figures. “Change in its income” is the change in a fifth's whole income, the total staying the same; the published Gini index is not recalculated, as that
            needs each household's income, which is not held.
          </ChartNote>
        </div>

        <p className="text-[10px] font-sans text-muted-foreground leading-snug">
          The shares are of {place.of}, for {place.year}. Not held, and so not here: wealth as against income, median against average income, and mobility between generations.
        </p>
        <SourceLink sources={place.sources} />
      </div>
    </div>
  );
}
