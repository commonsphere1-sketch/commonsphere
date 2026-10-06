/**
 * The state an economy is in, read off one published figure against another:
 * its real GDP growth for its latest year, and the world's for the same year.
 *
 *   contracting   its output fell that year
 *   behind        it grew, but more slowly than the world economy did
 *   ahead         it grew as fast as the world economy, or faster
 *   unknown       no growth figure is published for it, or none for the
 *                 world that year
 *
 * Both figures are the World Bank's (real GDP growth, annual per cent), so
 * the dividing lines are zero and the world's own rate - not cut-offs of the
 * site's choosing. It is a reading of growth alone: it says nothing of prices,
 * jobs or debt, which each card gives as figures beside it.
 *
 * Each state carries the hue its card is washed in - the same wash as the
 * headline banners' blue, in the state's colour - and the tone of the chip
 * that names it, so no card says its state by colour alone.
 */
import { WORLD } from "../data/worldview";
import { TONE } from "./chipTone";

export type EconomyStatusKey = "ahead" | "behind" | "contracting" | "unknown";

export type EconomyStatus = {
  key: EconomyStatusKey;
  /** The state, in a few words: the chip on the card. */
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
  ahead: "bg-gradient-to-r from-emerald-600/20 via-teal-500/10 to-emerald-700/20 dark:from-emerald-900/70 dark:via-teal-800/45 dark:to-emerald-900/70",
  behind: "bg-gradient-to-r from-amber-500/25 via-yellow-400/10 to-amber-600/25 dark:from-amber-900/60 dark:via-yellow-800/35 dark:to-amber-900/60",
  contracting: "bg-gradient-to-r from-rose-600/20 via-red-500/10 to-rose-700/20 dark:from-rose-900/70 dark:via-red-800/45 dark:to-rose-900/70",
  unknown: "bg-gradient-to-r from-slate-500/15 via-slate-400/5 to-slate-600/15 dark:from-slate-800/60 dark:via-slate-700/35 dark:to-slate-800/60",
};
const CHIP: Record<EconomyStatusKey, string> = { ahead: TONE.emerald, behind: TONE.amber, contracting: TONE.rose, unknown: TONE.slate };

/** What each state means, for the key above the cards. */
export const ECONOMY_STATUS_KEY: { key: EconomyStatusKey; label: string; means: string; hue: string; chip: string }[] = [
  { key: "ahead", label: "Growing faster than the world", means: "its real GDP grew at the world's rate or above it", hue: HUE.ahead, chip: CHIP.ahead },
  { key: "behind", label: "Growing slower than the world", means: "it grew, but by less than the world economy did", hue: HUE.behind, chip: CHIP.behind },
  { key: "contracting", label: "Contracting", means: "its real GDP fell", hue: HUE.contracting, chip: CHIP.contracting },
  { key: "unknown", label: "No growth figure", means: "none is published for it", hue: HUE.unknown, chip: CHIP.unknown },
];

const rate = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;

/** The world's real GDP growth for a year, where the World Bank series holds it. */
export const worldGrowth = (year: string | number | undefined): number | null =>
  year == null ? null : (WORLD.gdpGrowth?.series.find(([y]) => String(y) === String(year))?.[1] ?? null);

/** An economy's state, from its real GDP growth and the year that figure is for. */
export function economyStatus(growth: number | undefined, year: string | undefined): EconomyStatus {
  const of = (key: EconomyStatusKey, label: string, detail: string): EconomyStatus => ({ key, label, detail, hue: HUE[key], chip: CHIP[key] });
  if (growth == null || !Number.isFinite(growth)) return of("unknown", "No growth figure", "No real GDP growth figure is published for this economy.");
  const when = year ? ` in ${year}` : "";
  if (growth < 0) return of("contracting", "Contracting", `Its real GDP fell ${Math.abs(growth).toFixed(1)}%${when}.`);
  const world = worldGrowth(year);
  if (world == null) return of("unknown", "Growing", `Its real GDP grew ${rate(growth)}${when}; the World Bank has no world figure for that year to set it against.`);
  return growth >= world
    ? of("ahead", "Growing faster than the world", `Its real GDP grew ${rate(growth)}${when}; the world's grew ${rate(world)}.`)
    : of("behind", "Growing slower than the world", `Its real GDP grew ${rate(growth)}${when}; the world's grew ${rate(world)}.`);
}
