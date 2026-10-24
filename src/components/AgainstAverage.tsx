/**
 * A place against the average, as asked: each of its figures beside the average of every place of its kind - the countries,
 * the states, the economies, the cities, a country's divisions - with who measured the figure here and when, and how the
 * figure is gathered. The average is each place counted once, worked out here (it is not a weighted world total), and the
 * median is given with it, since a few places far from the rest can pull an average a long way.
 *
 * Places gather these figures differently - by census or by survey, in different years, to their own definitions - and the
 * bodies that publish them for every place convert or model them to one standard where they can. Each row says how its
 * figure is made, and the panel says that a figure here and the average may not be measured in the same way.
 */
import { SLIM_TRACK, slimFill } from "./SlimBars";

export type AvgRow = {
  key: string;
  label: string;
  /** This place's figure, where one is held. */
  value?: number;
  fmt: (v: number) => string;
  /** Who measured it here, and for when: "World Bank · 2025". */
  here?: string;
  /** The average and the median of every place of its kind that has the figure, and how many those are. */
  avg?: number;
  median?: number;
  n: number;
  /** How the figure is gathered, and where places differ in gathering it. */
  how: string;
};

export function AgainstAverage({ rows, peers, note, color = "#6366f1" }: { rows: AvgRow[]; /** "the 50 states", "the 196 countries". */ peers: string; note?: string; color?: string }) {
  const shown = rows.filter((r) => r.value !== undefined && Number.isFinite(r.value) && r.avg !== undefined && r.n > 1);
  if (!shown.length) return null;
  return (
    <section className="modal-tile rounded-xl p-4 border border-border/50 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <p className="text-sm font-bold font-sans text-foreground">Against the average</p>
        <p className="text-[10px] font-mono text-muted-foreground">Here · the average of {peers}</p>
      </div>
      <ul className="flex flex-col">
        {shown.map((r) => {
          const v = r.value as number;
          const a = r.avg as number;
          // Bars only where both are above nothing: a rate that can fall below zero is given as figures alone.
          const bars = v >= 0 && a >= 0;
          const top = Math.max(v, a) || 1;
          return (
            <li key={r.key} className="py-2.5 border-b border-border/40 last:border-b-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-4">
                <span className="text-[12px] font-sans font-semibold text-foreground leading-snug">{r.label}</span>
                <span className="text-right">
                  <span className="block text-[13px] font-mono font-bold text-foreground">{r.fmt(v)}</span>
                  {r.here && <span className="block text-[9px] font-sans text-muted-foreground">{r.here}</span>}
                </span>
                <span className="text-right min-w-[5.5rem]">
                  <span className="block text-[13px] font-mono text-muted-foreground">{r.fmt(a)}</span>
                  <span className="block text-[9px] font-sans text-muted-foreground">
                    average of {r.n.toLocaleString("en-US")}
                    {r.median !== undefined ? ` · median ${r.fmt(r.median)}` : ""}
                  </span>
                </span>
              </div>
              {bars && (
                <div className="flex flex-col gap-1 mt-1.5" aria-hidden>
                  <span className="h-2 rounded-full overflow-hidden" style={{ background: SLIM_TRACK }}>
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * v) / top)}%`, background: slimFill(color) }} />
                  </span>
                  <span className="h-2 rounded-full overflow-hidden" style={{ background: SLIM_TRACK }}>
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (100 * a) / top)}%`, background: slimFill("#94a3b8") }} />
                  </span>
                </div>
              )}
              <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1.5">{r.how}</p>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
        The top bar is here, the lower one the average. The average is each place counted once, worked out here - not a total weighted by size - and the median, the middle
        place, is beside it. Places gather these figures in different ways, by census or survey, in different years and to their own definitions; the bodies that publish
        them for every place bring them to one standard where they can, and each line says how. A figure here and the average may not be measured in quite the same way.
        {note ? ` ${note}` : ""}
      </p>
    </section>
  );
}

/** The count, the mean and the median of the figures given, the blanks left out. */
export function stats(values: (number | undefined | null)[]): { n: number; avg?: number; median?: number } {
  const v = values.filter((x): x is number => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return { n: 0 };
  const mid = Math.floor(v.length / 2);
  return { n: v.length, avg: v.reduce((s, x) => s + x, 0) / v.length, median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2 };
}
