/**
 * Energy to 2050: the world's electricity by type as the U.S. EIA projects
 * it - what is generated and what is installed, its Reference case and the
 * lowest and highest of its seven cases (renewables.ts).
 *
 * It was one tab of the Trends & Projections desk, which stood on the
 * Dashboard and at the head of the Trends page. The desk was removed as
 * asked and this kept: it stands with the Trends page's Renewables and with
 * the Dashboard's sectors and commodities.
 *
 * The year it starts from is solid and the projection paler behind it; the
 * line across is the reach of EIA's cases. A change is worked out here from
 * two of EIA's figures, and the panel says so. There is no probability on
 * it: EIA gives none.
 */
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Lightning } from "@phosphor-icons/react";
import { RENEWABLE_OUTLOOK, type OutlookRow } from "../data/renewables";
import { useTokens, type Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

const EIA = RENEWABLE_OUTLOOK;
const ACCENT = "#6366f1";
const RENEWABLE = "#0d9488";
const OTHER_POWER = "#64748b";

const POWER_NAME: Record<string, { name: string; renewable: boolean }> = {
  solar: { name: "Solar", renewable: true },
  wind: { name: "Wind", renewable: true },
  hydro: { name: "Hydropower", renewable: true },
  other: { name: "Other renewables", renewable: true },
  nuclear: { name: "Nuclear", renewable: false },
  gas: { name: "Natural gas", renewable: false },
  coal: { name: "Coal", renewable: false },
  battery: { name: "Battery storage", renewable: false },
};

const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}`;
const whole = (v: number) => Math.round(v).toLocaleString("en-US");
/** A projected figure against where it starts: "×6.0" where it more than doubles, a percentage otherwise. */
const growthOf = (from: number, to: number) => (to >= 2 * from ? `×${(to / from).toFixed(1)}` : `${signed((100 * (to - from)) / from, 0)}%`);

function Note({ t, children }: { t: Tokens; children: ReactNode }) {
  return (
    <p className="text-[10px] font-sans leading-relaxed" style={{ color: t.mutedText }}>
      {children}
    </p>
  );
}

/** A figure as a tile. */
function Figure({ t, label, value, sub, change }: { t: Tokens; label: string; value: string; sub?: string; change?: { text: string; dir?: "up" | "down" } | null }) {
  return (
    <div className="rounded-xl px-3 py-2.5 min-w-0" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
      <span className="block text-[9px] font-mono uppercase tracking-widest leading-snug" style={{ color: t.mutedText }}>
        {label}
      </span>
      <span className="block text-lg font-bold font-mono leading-tight mt-1" style={{ color: t.headText }}>
        {value}
      </span>
      {sub && (
        <span className="block text-[9px] font-mono leading-snug mt-0.5" style={{ color: t.mutedText }}>
          {sub}
        </span>
      )}
      {change && (
        <span className="flex items-center gap-1 text-[10px] font-mono leading-snug mt-1" style={{ color: t.bodyText }}>
          {change.dir === "up" ? <ArrowUp size={9} weight="bold" aria-hidden /> : change.dir === "down" ? <ArrowDown size={9} weight="bold" aria-hidden /> : null}
          {change.text}
        </span>
      )}
    </div>
  );
}

/** A choice among a few: chips, one pressed. */
function Chips<T extends string>({ t, value, onChange, options, label }: { t: Tokens; value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            className="text-[10px] font-sans font-semibold px-2 py-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer"
            style={{ background: on ? ACCENT + "22" : t.tile, border: `1px solid ${on ? ACCENT + "66" : t.gridLine}`, color: on ? ACCENT : t.headText }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Legend({ t, items }: { t: Tokens; items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ background: l.color }} aria-hidden />
          <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            {l.label}
          </span>
        </span>
      ))}
    </div>
  );
}

/** The year a projection starts from, solid, with the projection paler behind it and the reach of the other cases as a line across. */
function RangeBar({ t, top, base, mid, low, high, color }: { t: Tokens; top: number; base: number; mid: number; low: number; high: number; color: string }) {
  const at100 = (v: number) => `${Math.max(0, Math.min(100, (100 * v) / top))}%`;
  return (
    <div className="relative h-2.5 rounded-full" style={{ background: t.gridLine }} aria-hidden>
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at100(mid), background: color, opacity: 0.35 }} />
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: at100(base), background: color }} />
      <span className="absolute top-1/2 h-0.5 -translate-y-1/2" style={{ left: at100(low), width: `${Math.max(0.5, (100 * (high - low)) / top)}%`, background: t.headText }} />
    </div>
  );
}

export function EnergyOutlook({ action, id }: { /** A link at the head of the panel: to the page with the rest. */ action?: { label: string; onClick: () => void }; id?: string }) {
  const t = useTokens();
  const [kind, setKind] = useState<"generation" | "capacity">("generation");
  const rows: OutlookRow[] = EIA[kind].filter((r) => POWER_NAME[r.key]);
  const unit = kind === "generation" ? "TWh" : "GW";
  const top = Math.max(...rows.map((r) => r.high));
  const of = (key: string) => EIA.generation.find((r) => r.key === key);
  const tiles = [of("solar"), of("wind"), of("gas"), of("coal")].flatMap((r) =>
    r
      ? [
          {
            label: `${POWER_NAME[r.key].name}, ${EIA.year}`,
            value: `${whole(r.ref)} TWh`,
            sub: `EIA Reference case · ${whole(r.base)} in ${EIA.base}`,
            change: { text: `${growthOf(r.base, r.ref)} on ${EIA.base}`, dir: r.ref > r.base ? ("up" as const) : r.ref < r.base ? ("down" as const) : undefined },
          },
        ]
      : [],
  );
  const cell = "py-2 pl-3 text-right text-[11px] font-mono tabular-nums align-top";
  return (
    <section id={id} aria-labelledby="energy-outlook-title" className="rounded-2xl overflow-hidden scroll-mt-36" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: RENEWABLE + "14", border: `1px solid ${RENEWABLE}2a` }}>
            <Lightning size={16} weight="fill" style={{ color: RENEWABLE }} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="energy-outlook-title" className="text-base font-bold font-sans leading-tight" style={{ color: t.headText }}>
              Energy to {EIA.year}
            </h2>
            <p className="text-[11px] font-sans leading-snug mt-0.5 max-w-2xl" style={{ color: t.mutedText }}>
              The world's electricity by type, as the U.S. EIA projects it: its Reference case, and the lowest and highest of its seven cases. Published figures only - no
              probabilities.
            </p>
          </div>
        </div>
        {action && (
          <button type="button" onClick={action.onClick} className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0" style={{ color: RENEWABLE }}>
            {action.label} <ArrowRight size={11} weight="bold" aria-hidden />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {tiles.map((x) => (
            <Figure key={x.label} t={t} label={x.label} value={x.value} sub={x.sub} change={x.change} />
          ))}
        </div>
        <div className="rounded-xl p-4 flex flex-col gap-3 min-w-0" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
          <div>
            <h3 className="text-[13px] font-bold font-sans leading-snug" style={{ color: t.headText }}>
              The world's electricity by type: {EIA.base} and {EIA.year}
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-widest mt-1 leading-snug" style={{ color: t.mutedText }}>
              {kind === "generation" ? "TWh generated a year" : "GW of generating capacity"} · U.S. EIA, International Energy Outlook 2023
            </p>
          </div>
          <Chips
            t={t}
            value={kind}
            onChange={setKind}
            label="Generation or capacity"
            options={[
              { id: "generation", label: "What is generated" },
              { id: "capacity", label: "What is installed" },
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 560 }}>
              <caption className="sr-only">
                The world's electricity {kind} by type in {EIA.base} and as the U.S. EIA projects it for {EIA.year}: its Reference case, and the lowest and highest of its seven cases
              </caption>
              <thead>
                <tr>
                  {["Type", `${EIA.base}`, `${EIA.year} · Reference`, "Change", "Lowest case", "Highest case"].map((h, i) => (
                    <th key={h} scope="col" className={`py-1 text-[9px] font-mono font-normal ${i === 0 ? "text-left" : "text-right pl-3"}`} style={{ color: t.mutedText, borderBottom: `1px solid ${t.gridLine}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const p = POWER_NAME[r.key];
                  const color = p.renewable ? RENEWABLE : OTHER_POWER;
                  const line = { borderBottom: `1px solid ${t.gridLine}` };
                  return (
                    <tr key={r.key}>
                      <th scope="row" className="py-2 text-left align-top" style={{ ...line, width: "34%" }}>
                        <span className="flex items-center gap-1.5 text-[11px] font-sans font-semibold" style={{ color: t.headText }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden />
                          {p.name}
                        </span>
                        <span className="block mt-1.5">
                          <RangeBar t={t} top={top} base={r.base} mid={r.ref} low={r.low} high={r.high} color={color} />
                        </span>
                      </th>
                      <td className={cell} style={{ ...line, color: t.bodyText }}>
                        {whole(r.base)}
                      </td>
                      <td className={`${cell} font-bold`} style={{ ...line, color: t.headText }}>
                        {whole(r.ref)}
                      </td>
                      <td className={cell} style={{ ...line, color: t.headText }}>
                        {growthOf(r.base, r.ref)}
                      </td>
                      <td className={cell} style={{ ...line, color: t.mutedText }}>
                        {whole(r.low)}
                      </td>
                      <td className={cell} style={{ ...line, color: t.mutedText }}>
                        {whole(r.high)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Legend
            t={t}
            items={[
              { color: RENEWABLE, label: `Renewable: in ${EIA.base} (solid) and projected for ${EIA.year} (paler)` },
              { color: OTHER_POWER, label: "Other types, the same way" },
              { color: t.headText, label: "Lowest to highest of the seven cases" },
            ]}
          />
          <Note t={t}>
            Figures are in {unit}. EIA's Reference case assumes the laws and policies in place when it was made, and its six other cases vary economic growth, oil prices and the cost
            of zero-carbon technology. It gives no likelihood to any of them, and nor does this panel. This is its 2023 edition, the latest it has published. The change is the Reference
            case against {EIA.base}, worked out here.
          </Note>
        </div>
        <SourceLink sources={[EIA.source]} />
      </div>
    </section>
  );
}

export default EnergyOutlook;
