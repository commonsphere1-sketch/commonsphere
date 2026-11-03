/**
 * What each job pays in a place, as asked: a US state's or territory's, or the metropolitan or nonmetropolitan area a
 * county lies in - the US Bureau of Labor Statistics' Occupational Employment and Wage Statistics, May 2025 (payMeta.ts,
 * build-pay.cjs). All jobs together, the pay of each major group, the best-paid and the most common jobs, and any of the
 * 830 jobs found by name: its median and mean, its spread from the 10th to the 90th percentile beside the nation's, the
 * people employed in it, and where it pays most - every state ranked, and the place's own areas.
 *
 * Every figure is BLS's as published. The ranks are worked out here from BLS's medians, and said to be. A wage BLS marks
 * "#" - $239,200 a year or $115 an hour, or more - is written so, never as a figure; one BLS does not publish is "Not
 * published". Only wage and salary jobs are counted: the self-employed are not.
 */
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PAY_PERIOD, PAY_SOURCES, PAY_TOP, type PayAreas, type PayOccFile, type PayRow, type PayUs } from "../data/payMeta";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const COLOR = "#0d9488";
const json = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));
let US: Promise<PayUs> | null = null;
let AREAS: Promise<PayAreas> | null = null;
const us = () => (US ??= json<PayUs>("/pay/us.json").catch((e) => ((US = null), Promise.reject(e))));
const areas = () => (AREAS ??= json<PayAreas>("/pay/areas.json").catch((e) => ((AREAS = null), Promise.reject(e))));
/** The county's area, by its FIPS code: BLS's code and name for it. */
export const payAreaOf = (fips: string) => areas().then((a) => (a.counties[fips] ? { code: a.counties[fips], title: a.areas[a.counties[fips]]?.[0] ?? "" } : null));

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

export type PayScope = { kind: "state"; abbr: string } | { kind: "area"; code: string };

export default function PayByJob({ scope, place, ofParent }: { scope: PayScope; place: string; /** Shown in a county's window: the figures are its area's, and said to be. */ ofParent?: boolean }) {
  const [base, setBase] = useState<PayUs | null | undefined>(undefined);
  const [rows, setRows] = useState<PayRow[] | null | undefined>(undefined);
  const [names, setNames] = useState<PayAreas | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const key = scope.kind === "state" ? scope.abbr : scope.code;

  useEffect(() => {
    let live = true;
    us()
      .then((x) => live && setBase(x))
      .catch(() => live && setBase(null));
    areas()
      .then((x) => live && setNames(x))
      .catch(() => undefined);
    json<PayRow[]>(scope.kind === "state" ? `/pay/state/${scope.abbr}.json` : `/pay/area/${scope.code}.json`)
      .then((x) => live && setRows(x))
      .catch(() => live && setRows(null));
    setPick(null);
    return () => {
      live = false;
    };
  }, [scope.kind, key]);

  const byOcc = useMemo(() => new Map((rows ?? []).map((r) => [r[0], r])), [rows]);
  const nation = useMemo(() => new Map((base?.rows ?? []).map((r) => [r[0], r])), [base]);

  if (base === undefined || rows === undefined) return <p className="text-[11px] font-sans text-muted-foreground">Loading what each job pays…</p>;
  if (!base || !rows) return <p className="text-[11px] font-sans text-muted-foreground">What each job pays could not be read just now.</p>;

  const hourly = (i: number) => base.occ[i][3] === 1;
  /** A wage as BLS gives it: a year's, or an hour's for the jobs it gives by the hour only. */
  const pay = (v: number | null, i: number) => (v === null ? "Not published" : v === -1 ? `${hourly(i) ? `$${PAY_TOP.hour.toFixed(2)}` : `$${PAY_TOP.year.toLocaleString("en")}`} or more` : hourly(i) ? `$${v.toFixed(2)}` : `$${v.toLocaleString("en")}`);
  const per = (i: number) => (hourly(i) ? "an hour" : "a year");
  const people = (v: number | null) => (v === null ? "Not published" : v.toLocaleString("en"));
  /** For sorting: BLS's "#" above every figure. */
  const rank = (v: number | null, i: number) => (v === null ? -Infinity : v === -1 ? (hourly(i) ? PAY_TOP.hour : PAY_TOP.year) + 1 : v);

  const total = byOcc.get(0);
  const usTotal = nation.get(0);
  const detailed = rows.filter((r) => base.occ[r[0]][2] >= 0);
  const yearly = detailed.filter((r) => !hourly(r[0]) && r[5] !== null);
  const best = [...yearly].sort((a, b) => rank(b[5], b[0]) - rank(a[5], a[0])).slice(0, 10);
  const common = [...detailed].filter((r) => r[1] !== null).sort((a, b) => b[1]! - a[1]!).slice(0, 10);
  const groups = base.majors
    .map(([code, title]) => ({ i: base.occ.findIndex((o) => o[0] === code), title }))
    .map(({ i, title }) => ({ title, row: byOcc.get(i), i }))
    .filter((g) => g.row && g.row[5] !== null && g.row[5] !== -1);
  const hits = q.trim() ? detailed.filter((r) => fold(base.occ[r[0]][1]).includes(fold(q.trim()))).slice(0, 12) : [];

  const jobButton = (r: PayRow, figure: ReactNode) => (
    <button key={r[0]} type="button" onClick={() => setPick(r[0])} aria-pressed={pick === r[0]} className={`w-full flex items-baseline justify-between gap-3 py-1.5 border-b border-border last:border-b-0 text-left cursor-pointer hover:bg-muted/40 rounded-sm px-1 -mx-1 ${pick === r[0] ? "bg-muted/60" : ""}`}>
      <span className="text-[11px] font-sans text-foreground flex-1 min-w-0">{base.occ[r[0]][1]}</span>
      <span className="text-[11px] font-mono font-semibold text-foreground text-right shrink-0">{figure}</span>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
          Pay by job · {place} · {PAY_PERIOD}
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {ofParent && <ChartNote>These are the figures of the area BLS counts this county in, {place}: BLS publishes none for a county alone.</ChartNote>}

      {total && (
        <Tile title={`All jobs · ${PAY_PERIOD}`}>
          <FigureRow label="Median pay" value={pay(total[5], 0)} sub={`a year · the nation's ${usTotal ? pay(usTotal[5], 0) : "not held"}`} />
          <FigureRow label="Mean pay" value={pay(total[2], 0)} sub={`a year · the nation's ${usTotal ? pay(usTotal[2], 0) : "not held"}`} />
          <FigureRow label="People employed" value={people(total[1])} sub="wage and salary jobs" />
          <Spread rows={[{ label: place, r: total }, ...(usTotal ? [{ label: "United States", r: usTotal }] : [])]} fmt={(v) => pay(v, 0)} note />
        </Tile>
      )}

      {/* Any job, by name. */}
      <Tile title={`Find a job · ${detailed.length} with figures here`}>
        <label className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 focus-within:border-foreground/40 transition-colors">
          <MagnifyingGlass size={12} className="text-muted-foreground shrink-0" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="A job: nurse, electrician, software…" aria-label="Find a job by name" className="flex-1 min-w-0 bg-transparent text-[12px] font-sans text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </label>
        {q.trim() && (
          <div className="mt-2">
            {hits.length ? hits.map((r) => jobButton(r, `${pay(r[5], r[0])}`)) : <ChartNote>No job by that name has figures here.</ChartNote>}
          </div>
        )}
        {pick !== null && byOcc.get(pick) && (
          <Job key={pick} i={pick} r={byOcc.get(pick)!} us={nation.get(pick)} base={base} names={names} scope={scope} place={place} pay={pay} per={per} people={people} />
        )}
      </Tile>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Tile title="Best-paid jobs here · median, a year">
          {best.map((r) => jobButton(r, pay(r[5], r[0])))}
        </Tile>
        <Tile title="Most common jobs here · people employed">
          {common.map((r) => jobButton(r, people(r[1])))}
        </Tile>
      </div>

      {groups.length > 0 && (
        <Tile title={`The ${groups.length} groups of jobs · median pay, a year`}>
          <MeasureBars
            rows={groups.sort((a, b) => b.row![5]! - a.row![5]!).map((g) => ({ key: g.title, label: g.title.replace(/ Occupations$/, ""), value: g.row![5]!, text: pay(g.row![5], g.i), sub: `the nation's ${pay(nation.get(g.i)?.[5] ?? null, g.i)}`, color: COLOR }))}
            label={`Median pay of each group of jobs in ${place}`}
          />
        </Tile>
      )}

      <ChartNote>
        BLS&apos;s figures for {PAY_PERIOD}, drawn from its survey of employers over the three years to then. Wage and salary jobs only: the self-employed are not counted. A year&apos;s pay is BLS&apos;s - the hourly wage over 2,080 hours, or for a job paid by the year, such as teaching, what is paid in it; a few jobs, such as acting, BLS gives by the hour only. BLS gives no figure above ${PAY_TOP.year.toLocaleString("en")} a year (${PAY_TOP.hour.toFixed(2)} an hour), and one at or above it is written so.
      </ChartNote>
      <SourceLink sources={PAY_SOURCES} />
    </div>
  );
}

/** A county's: the figures of the area BLS counts it in, said to be its area's. */
export function CountyPay({ fips }: { fips: string }) {
  const [area, setArea] = useState<{ code: string; title: string } | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    payAreaOf(fips)
      .then((a) => live && setArea(a))
      .catch(() => live && setArea(null));
    return () => {
      live = false;
    };
  }, [fips]);
  if (!area) return null;
  return <PayByJob scope={{ kind: "area", code: area.code }} place={area.title} ofParent />;
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="modal-tile rounded-xl p-4 min-w-0">
      <ChartTitle>{title}</ChartTitle>
      {children}
    </div>
  );
}

/** The spread of pay, the 10th percentile to the 90th, with the middle half and the median marked - several places on one scale. */
function Spread({ rows, fmt, note = false }: { rows: { label: string; r: PayRow }[]; fmt: (v: number | null) => string; /** How to read it, said under the first only. */ note?: boolean }) {
  const shown = rows.filter(({ r }) => r[3] !== null && r[7] !== null && r[5] !== null);
  if (!shown.length) return null;
  // BLS's "#" runs to the top figure: the bar ends there, and its end is said to be "or more".
  const v = (x: number | null, top: number) => (x === -1 ? top : x ?? 0);
  const top = Math.max(...shown.map(({ r }) => [r[3], r[4], r[5], r[6], r[7]].reduce<number>((m, x) => Math.max(m, x === -1 ? 0 : x ?? 0), 0)));
  const end = shown.some(({ r }) => r[7] === -1) ? Math.max(top, PAY_TOP.year) : top;
  const at = (x: number) => `${Math.min(100, (100 * x) / end)}%`;
  return (
    <div className="mt-3 space-y-2.5">
      {shown.map(({ label, r }) => (
        <div key={label}>
          <p className="flex items-baseline justify-between gap-3 text-[10px] font-sans text-muted-foreground">
            <span className="min-w-0 truncate">{label}</span>
            <span className="font-mono shrink-0">
              {fmt(r[3])} – {fmt(r[7])}
            </span>
          </p>
          <span className="relative block h-2.5 rounded-full mt-1 text-foreground" style={{ background: "color-mix(in srgb, currentColor 7%, transparent)" }} role="img" aria-label={`${label}: 10th percentile ${fmt(r[3])}, 25th ${fmt(r[4])}, median ${fmt(r[5])}, 75th ${fmt(r[6])}, 90th ${fmt(r[7])}`}>
            <span className="absolute inset-y-0 rounded-full" style={{ left: at(v(r[3], end)), width: `calc(${at(v(r[7], end))} - ${at(v(r[3], end))})`, background: `color-mix(in srgb, ${COLOR} 30%, transparent)` }} />
            {r[4] !== null && r[6] !== null && <span className="absolute inset-y-0 rounded-full" style={{ left: at(v(r[4], end)), width: `calc(${at(v(r[6], end))} - ${at(v(r[4], end))})`, background: COLOR }} />}
            <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full bg-foreground" style={{ left: at(v(r[5], end)) }} />
          </span>
        </div>
      ))}
      {note && <ChartNote>The bar runs from the 10th percentile to the 90th: a tenth of jobs pay less, a tenth more. The darker middle is the middle half, the 25th to the 75th; the mark is the median.</ChartNote>}
    </div>
  );
}

/** One job in the place: its figures beside the nation's, and where it pays most. */
function Job({
  i,
  r,
  us,
  base,
  names,
  scope,
  place,
  pay,
  per,
  people,
}: {
  i: number;
  r: PayRow;
  us?: PayRow;
  base: PayUs;
  names: PayAreas | null;
  scope: PayScope;
  place: string;
  pay: (v: number | null, i: number) => string;
  per: (i: number) => string;
  people: (v: number | null) => string;
}) {
  const [occ, setOcc] = useState<PayOccFile | null | undefined>(undefined);
  const [allAreas, setAllAreas] = useState(false);
  const [code, title, major] = base.occ[i];
  useEffect(() => {
    let live = true;
    json<PayOccFile>(`/pay/occ/${code}.json`)
      .then((x) => live && setOcc(x))
      .catch(() => live && setOcc(null));
    return () => {
      live = false;
    };
  }, [code]);
  const top = base.occ[i][3] === 1 ? PAY_TOP.hour + 0.01 : PAY_TOP.year + 1;
  const sortKey = (m: number | null) => (m === null ? -Infinity : m === -1 ? top : m);
  const states = occ ? [...occ.states].filter((s) => s[3] !== null).sort((a, b) => sortKey(b[3]) - sortKey(a[3])) : [];
  const myState = scope.kind === "state" ? scope.abbr : names?.areas[scope.code]?.[1];
  const stateAt = states.findIndex((s) => s[0] === (scope.kind === "state" ? scope.abbr : ""));
  const areaRows = occ ? [...occ.areas].filter((a) => a[2] !== null).sort((a, b) => sortKey(b[2]) - sortKey(a[2])) : [];
  const areaAt = scope.kind === "area" ? areaRows.findIndex((a) => a[0] === scope.code) : -1;
  // The areas of the place's own state, for a state's window.
  const ownAreas = scope.kind === "state" && names ? areaRows.filter((a) => names.areas[a[0]]?.[1] === scope.abbr) : [];
  const stateName = (abbr: string) => names?.states[abbr]?.[1] ?? abbr;
  const areaName = (c: string) => names?.areas[c]?.[0] ?? c;
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        {base.majors[major]?.[1] ?? "Job"} · SOC {code}
      </p>
      <p className="text-sm font-bold font-sans text-foreground mt-0.5">{title}</p>
      <div className="mt-2">
        <FigureRow label="Median pay" value={pay(r[5], i)} sub={`${per(i)} · the nation's ${us ? pay(us[5], i) : "not held"}`} />
        <FigureRow label="Mean pay" value={pay(r[2], i)} sub={`${per(i)} · the nation's ${us ? pay(us[2], i) : "not held"}`} />
        <FigureRow label="People employed" value={people(r[1])} sub={`the nation's ${us ? people(us[1]) : "not held"}`} />
      </div>
      <Spread rows={[{ label: place, r }, ...(us ? [{ label: "United States", r: us }] : [])]} fmt={(v) => pay(v, i)} />

      {occ === undefined && <ChartNote className="mt-3">Loading where it pays most…</ChartNote>}
      {occ && states.length > 0 && (
        <div className="mt-4">
          <ChartTitle>Where it pays most · the states by median · ranks worked out here</ChartTitle>
          {stateAt >= 0 && (
            <p className="text-[11px] font-sans text-foreground mb-1.5">
              {place} ranks <span className="font-mono font-semibold">{ordinal(stateAt + 1)}</span> of the {states.length} states and territories BLS gives a median for.
            </p>
          )}
          {areaAt >= 0 && (
            <p className="text-[11px] font-sans text-foreground mb-1.5">
              {place} ranks <span className="font-mono font-semibold">{ordinal(areaAt + 1)}</span> of the {areaRows.length} areas BLS gives a median for; its state is marked below.
            </p>
          )}
          {states.slice(0, 10).map((s, k) => (
            <FigureRow key={s[0]} label={`${k + 1}. ${stateName(s[0])}${s[0] === myState ? " ←" : ""}`} value={pay(s[3], i)} sub={`${people(s[1])} employed`} />
          ))}
        </div>
      )}
      {ownAreas.length > 0 && (
        <div className="mt-4">
          <ChartTitle>In {place}&apos;s {ownAreas.length} areas · median</ChartTitle>
          {(allAreas ? ownAreas : ownAreas.slice(0, 8)).map((a) => (
            <FigureRow key={a[0]} label={areaName(a[0])} value={pay(a[2], i)} sub={`${people(a[1])} employed`} />
          ))}
          {ownAreas.length > 8 && (
            <button type="button" onClick={() => setAllAreas((v) => !v)} className="text-[10px] font-sans text-muted-foreground mt-1 cursor-pointer underline-offset-2 hover:underline">
              {allAreas ? "Fewer" : `All ${ownAreas.length}`}
            </button>
          )}
        </div>
      )}
      {occ === null && <ChartNote className="mt-3">Where it pays most could not be read just now.</ChartNote>}
    </div>
  );
}
