/**
 * The pieces the Crime page's sections share: its colours for light and
 * dark, a section's heading, a row of choices, and a card that ranks places
 * by one published rate. They stood in the page itself until the Justice
 * section needed them too.
 */
import { useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { ChartNote, MeasureBars } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

export const ACCENT = "#ef4444";
/** A place counts as large enough for its rate to be steady from year to year. */
export const LARGE = 1_000_000;

export type Ranked = { id: string; name: string; population: number; value: number; text: string; sub: string };

export const yearsOf = (rows: Ranked[]) => {
  const ys = rows.map((r) => Number(/\d{4}/.exec(r.sub)?.[0])).filter(Number.isFinite);
  return ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "";
};

export function useLook() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return {
    isLight,
    head: isLight ? "#0f172a" : "#f1f0ff",
    muted: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)",
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    card: {
      background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
      border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    },
  };
}
export type Look = ReturnType<typeof useLook>;

export function SectionHead({ look, title, kicker }: { look: Look; title: string; kicker: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold font-sans leading-tight" style={{ color: look.head }}>
        {title}
      </h2>
      <p className="text-[11px] font-sans mt-0.5" style={{ color: look.muted }}>
        {kicker}
      </p>
    </div>
  );
}

export function Pick<T extends string>({ look, value, onChange, options, label }: { look: Look; value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
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
            style={{ background: on ? ACCENT + "22" : "transparent", border: `1px solid ${on ? ACCENT + "66" : look.grid}`, color: on ? ACCENT : look.head }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Places ranked by one published rate: the highest or the lowest of those
 * that report, on one scale - the highest rate of the places counted - so a
 * bar's length is its rate whichever end is shown.
 */
export function RankCard({ look, title, unit, rows, note, source, count = 12 }: { look: Look; title: string; unit: string; rows: Ranked[]; note: string; source: { label: string; url: string } | { label: string; url: string }[]; count?: number }) {
  const [end, setEnd] = useState<"highest" | "lowest">("highest");
  const [scope, setScope] = useState<"large" | "all">("large");
  const pool = useMemo(() => (scope === "large" ? rows.filter((r) => r.population >= LARGE) : rows), [rows, scope]);
  const sorted = useMemo(() => [...pool].sort((a, b) => (end === "highest" ? b.value - a.value : a.value - b.value)), [pool, end]);
  const shown = sorted.slice(0, count);
  const top = Math.max(0, ...pool.map((r) => r.value));
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 min-w-0" style={look.card}>
      <div>
        <h3 className="text-[13px] font-bold font-sans leading-snug" style={{ color: look.head }}>
          {title}
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest mt-1 leading-snug" style={{ color: look.muted }}>
          {unit} · the {end} {shown.length} of {pool.length} {scope === "large" ? "places of a million people or more" : "places"} · {yearsOf(pool)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Pick
          look={look}
          value={end}
          onChange={setEnd}
          label="Which end of the list"
          options={[
            { id: "highest", label: "Highest" },
            { id: "lowest", label: "Lowest" },
          ]}
        />
        <Pick
          look={look}
          value={scope}
          onChange={setScope}
          label="Which places are counted"
          options={[
            { id: "large", label: "A million people or more" },
            { id: "all", label: `All ${rows.length} places` },
          ]}
        />
      </div>
      <MeasureBars max={top} color={ACCENT} label={`${title}: the ${end} ${shown.length}`} rows={shown.map((r) => ({ key: r.id, label: r.name, value: r.value, text: r.text, sub: r.sub }))} />
      <ChartNote>{note} Every bar is on one scale, the highest rate among the places counted, so the lowest are short because they are low.</ChartNote>
      <SourceLink sources={Array.isArray(source) ? source : [source]} />
    </div>
  );
}
