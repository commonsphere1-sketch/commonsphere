/**
 * The federal government's money in a place, as asked: what its agencies awarded to recipients in a US state or county
 * in a fiscal year - in all, by kind (contracts, grants, direct payments, loans and the rest) and by the agency that
 * awarded it - read live from USAspending.gov, the US Treasury's official record of federal spending (public domain).
 *
 * A fiscal year runs from October to September. The figures are USAspending's as it reports them, by where each
 * recipient is located, which need not be where the money is spent; the panel says so. USAspending's own figure per
 * person rests on a population years old, so it is not shown.
 */
import { useEffect, useState } from "react";
import { ChartNote, ChartTitle, FigureRow, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

const API = "https://api.usaspending.gov/api/v2";
const SOURCES = [
  { label: "USAspending.gov (US Department of the Treasury) — spending by state and county, by recipient location", url: "https://www.usaspending.gov/state" },
  { label: "USAspending.gov — API documentation", url: "https://api.usaspending.gov/docs/endpoints" },
];
/** The states' FIPS codes, as the Census Bureau sets them. */
const STATE_FIPS: Record<string, string> = { AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10", DC: "11", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18", IA: "19", KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25", MI: "26", MN: "27", MS: "28", MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44", SC: "45", SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54", WI: "55", WY: "56" };
const KINDS: Record<string, string> = { direct_payments: "Direct payments", contracts: "Contracts", grants: "Grants", other_financial_assistance: "Other assistance", loans: "Loans, their cost to the government" };
const COLOR = "#2563eb";

/** Money as read: in billions or millions, to three figures. */
const usd = (v: number) => (Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(v >= 1e11 ? 0 : 1)}B` : Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(v >= 1e8 ? 0 : 1)}M` : `$${Math.round(v).toLocaleString("en-US")}`);
const fy = (y: number) => ({ start_date: `${y - 1}-10-01`, end_date: `${y}-09-30` });
const post = <T,>(path: string, body: unknown) =>
  fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));
const get = <T,>(path: string) => fetch(`${API}${path}`).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));

type Found = { total: number | null; awards?: number; outlays?: number; loanFace?: number; kinds?: { type: string; amount: number }[]; agencies: { name: string; amount: number }[] };

export type MoneyScope = { kind: "state"; abbr: string; name: string } | { kind: "county"; fips: string; abbr: string; name: string };

export default function FederalMoney({ scope }: { scope: MoneyScope }) {
  // The fiscal year ended last September: the latest whole one.
  const now = new Date();
  const latest = now.getUTCMonth() >= 9 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const years = [latest, latest - 1, latest - 2, latest - 3];
  const [year, setYear] = useState(latest - 1);
  const [found, setFound] = useState<Found | null | undefined>(undefined);
  const key = scope.kind === "state" ? scope.abbr : scope.fips;

  useEffect(() => {
    let live = true;
    setFound(undefined);
    const fips = STATE_FIPS[scope.abbr];
    const where = scope.kind === "state" ? { country: "USA", state: scope.abbr } : { country: "USA", state: scope.abbr, county: scope.fips.slice(2) };
    const agencies = post<{ results: { name: string; amount: number }[] }>("/search/spending_by_category/awarding_agency/", { filters: { time_period: [fy(year)], recipient_locations: [where] }, limit: 10, page: 1 }).then((j) => j.results.filter((a) => a.amount > 0));
    const load: Promise<Found> =
      scope.kind === "state"
        ? Promise.all([
            get<{ total_prime_amount: number; total_prime_awards: number; total_outlays: number; total_face_value_loan_amount: number }>(`/recipient/state/${fips}/?year=${year}`),
            get<{ type: string; amount: number }[]>(`/recipient/state/awards/${fips}/?year=${year}`),
            agencies,
          ]).then(([s, k, a]) => ({ total: s.total_prime_amount, awards: s.total_prime_awards, outlays: s.total_outlays, loanFace: s.total_face_value_loan_amount, kinds: k, agencies: a }))
        : Promise.all([post<{ results: { aggregated_amount: number }[] }>("/search/spending_by_geography/", { scope: "recipient_location", geo_layer: "county", geo_layer_filters: [scope.fips], filters: { time_period: [fy(year)] } }), agencies]).then(([g, a]) => ({ total: g.results[0]?.aggregated_amount ?? null, agencies: a }));
    load.then((x) => live && setFound(x)).catch(() => live && setFound(null));
    return () => {
      live = false;
    };
  }, [scope.kind, key, scope.abbr, year]);

  const kinds = (found?.kinds ?? []).filter((k) => k.amount > 0 && KINDS[k.type]).sort((a, b) => b.amount - a.amount);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Federal money · {scope.name}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2" role="group" aria-label="Fiscal year">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            aria-pressed={year === y}
            className={`px-2 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${year === y ? "border-foreground/40 text-foreground bg-muted/60" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            FY{y}
            {y === latest ? " · as reported so far" : ""}
          </button>
        ))}
      </div>
      {found === undefined && <p className="text-[11px] font-sans text-muted-foreground">Reading USAspending.gov, which can take a little while…</p>}
      {found === null && <p className="text-[11px] font-sans text-muted-foreground">USAspending.gov could not be read just now.</p>}
      {found && (
        <div className="grid grid-cols-1 gap-3">
          <div className="modal-tile rounded-xl p-4 min-w-0">
            <ChartTitle>{`Awarded to recipients in ${scope.name} · October ${year - 1} to September ${year}`}</ChartTitle>
            <FigureRow label="In all" value={found.total === null ? "Not published" : usd(found.total)} sub="obligated" />
            {found.outlays !== undefined && <FigureRow label="Paid out" value={usd(found.outlays)} sub="outlays" />}
            {found.awards !== undefined && <FigureRow label="Awards" value={found.awards.toLocaleString("en-US")} />}
            {found.loanFace ? <FigureRow label="Loans, their face value" value={usd(found.loanFace)} /> : null}
            {kinds.length > 0 && (
              <div className="mt-3">
                <MeasureBars rows={kinds.map((k) => ({ key: k.type, label: KINDS[k.type], value: k.amount, text: usd(k.amount), color: COLOR }))} label={`Federal awards in ${scope.name} by kind`} />
              </div>
            )}
          </div>
          {found.agencies.length > 0 && (
            <div className="modal-tile rounded-xl p-4 min-w-0">
              <ChartTitle>{`The agencies that awarded most · FY${year}`}</ChartTitle>
              <MeasureBars rows={found.agencies.map((a) => ({ key: a.name, label: a.name, value: a.amount, text: usd(a.amount), color: COLOR }))} label={`Federal awards in ${scope.name} by agency`} />
            </div>
          )}
          <ChartNote>
            What federal agencies obligated - committed to pay - to recipients located in {scope.name} in the fiscal year, as they report it to USAspending.gov: contracts, grants, payments to people and the rest. A recipient&apos;s location is where it is registered, which need not be where the money is spent; a year still being reported grows as agencies file.
          </ChartNote>
        </div>
      )}
      <SourceLink sources={SOURCES} className="mt-2" />
    </div>
  );
}
