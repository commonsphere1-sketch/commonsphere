/**
 * The degree of inflation an economy is at, read off one published figure
 * against another: its consumer-price inflation for its latest year, and the
 * world's for the same year.
 *
 *   falling   prices fell over the year
 *   below     prices rose, by less than the world's rate
 *   above     prices rose by the world's rate or more, up to twice it
 *   high      prices rose by more than twice the world's rate
 *   unknown   no inflation figure is published for it, or none for the
 *             world that year
 *
 * Both figures are the World Bank's (inflation, consumer prices, annual per
 * cent; the world's is the median of its economies). The dividing lines are
 * zero, the world's own rate and twice it: the first two are the figures
 * themselves, and the third is the site's way of setting far above apart
 * from above, said in the key so it is not mistaken for anybody's standard.
 * It reads prices alone: growth, jobs and debt are the figures on each card.
 *
 * Each degree carries the hue its card is washed in - the same wash as the
 * headline banners' blue, in the degree's colour - and the tone of the chip
 * that names it, so no card says its degree by colour alone.
 */
import { WORLD } from "../data/worldview";
import { TONE } from "./chipTone";

export type EconomyStatusKey = "falling" | "below" | "above" | "high" | "unknown";

export type EconomyStatus = {
  key: EconomyStatusKey;
  /** The degree, in a few words: the chip on the card. */
  label: string;
  /** The two figures behind it, in a sentence. */
  detail: string;
  /** The wash across the card: a background image, written out in full so Tailwind generates it. */
  hue: string;
  /** The chip's colours, light and dark. */
  chip: string;
};

/* Written out in full, not built from parts, because Tailwind only generates
   classes it can find as whole strings in the source. Each is the headline
   banners' wash (lib/blueHue.ts) in another colour. */
const HUE: Record<EconomyStatusKey, string> = {
  falling: "bg-gradient-to-r from-sky-600/20 via-cyan-500/10 to-sky-700/20 dark:from-sky-900/70 dark:via-cyan-800/45 dark:to-sky-900/70",
  below: "bg-gradient-to-r from-emerald-600/20 via-teal-500/10 to-emerald-700/20 dark:from-emerald-900/70 dark:via-teal-800/45 dark:to-emerald-900/70",
  above: "bg-gradient-to-r from-amber-500/25 via-yellow-400/10 to-amber-600/25 dark:from-amber-900/60 dark:via-yellow-800/35 dark:to-amber-900/60",
  high: "bg-gradient-to-r from-rose-600/20 via-red-500/10 to-rose-700/20 dark:from-rose-900/70 dark:via-red-800/45 dark:to-rose-900/70",
  unknown: "bg-gradient-to-r from-slate-500/15 via-slate-400/5 to-slate-600/15 dark:from-slate-800/60 dark:via-slate-700/35 dark:to-slate-800/60",
};
const CHIP: Record<EconomyStatusKey, string> = { falling: TONE.sky, below: TONE.emerald, above: TONE.amber, high: TONE.rose, unknown: TONE.slate };

/** What each degree means, for the key above the cards, lowest first. */
export const ECONOMY_STATUS_KEY: { key: EconomyStatusKey; label: string; means: string; hue: string; chip: string }[] = [
  { key: "falling", label: "Prices falling", means: "consumer prices fell over the year", hue: HUE.falling, chip: CHIP.falling },
  { key: "below", label: "Inflation below the world's", means: "prices rose by less than the world's rate", hue: HUE.below, chip: CHIP.below },
  { key: "above", label: "Inflation above the world's", means: "prices rose by the world's rate or more, up to twice it", hue: HUE.above, chip: CHIP.above },
  { key: "high", label: "Inflation over twice the world's", means: "prices rose by more than twice the world's rate", hue: HUE.high, chip: CHIP.high },
  { key: "unknown", label: "No inflation figure", means: "none is published for it", hue: HUE.unknown, chip: CHIP.unknown },
];

const rate = (v: number) => `${Math.abs(v).toFixed(1)}%`;

/** The world's consumer-price inflation for a year, where the World Bank series holds it. */
export const worldInflation = (year: string | number | undefined): number | null =>
  year == null ? null : (WORLD.inflation?.series.find(([y]) => String(y) === String(year))?.[1] ?? null);

/** An economy's degree of inflation, from its inflation rate and the year that figure is for. */
export function economyStatus(inflation: number | undefined, year: string | undefined): EconomyStatus {
  const of = (key: EconomyStatusKey, label: string, detail: string): EconomyStatus => ({ key, label, detail, hue: HUE[key], chip: CHIP[key] });
  if (inflation == null || !Number.isFinite(inflation)) return of("unknown", "No inflation figure", "No consumer-price inflation figure is published for this economy.");
  const when = year ? ` in ${year}` : "";
  if (inflation < 0) return of("falling", "Prices falling", `Its consumer prices fell ${rate(inflation)}${when}.`);
  const world = worldInflation(year);
  if (world == null || world <= 0) return of("unknown", `Inflation ${rate(inflation)}`, `Its consumer prices rose ${rate(inflation)}${when}; the World Bank has no world figure for that year to set it against.`);
  const said = `Its consumer prices rose ${rate(inflation)}${when}; the world's rose ${rate(world)}.`;
  if (inflation < world) return of("below", "Inflation below the world's", said);
  if (inflation <= 2 * world) return of("above", "Inflation above the world's", said);
  return of("high", "Inflation over twice the world's", `${said} That is ${(inflation / world).toFixed(1)} times the world's rate.`);
}
