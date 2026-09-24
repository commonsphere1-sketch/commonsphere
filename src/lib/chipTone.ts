/**
 * Chip colours that read in both themes.
 *
 * Light mode: dark text on a pale fill. Dark mode: pale text on a deeper
 * fill. Each has a border, so a chip keeps its shape on the glass panels.
 * The pop-ups used -400 text on a 10-20% wash of the same hue, which works
 * on black and all but disappears on the light glass.
 *
 * Written out in full, not built from the hue name, because Tailwind only
 * generates classes it can find as whole strings in the source.
 */
export const TONE = {
  blue: "border border-blue-600/40 bg-blue-100 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-200",
  sky: "border border-sky-600/40 bg-sky-100 text-sky-800 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-200",
  red: "border border-red-600/40 bg-red-100 text-red-800 dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-200",
  rose: "border border-rose-600/40 bg-rose-100 text-rose-800 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-200",
  orange: "border border-orange-600/40 bg-orange-100 text-orange-800 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200",
  amber: "border border-amber-600/40 bg-amber-100 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200",
  yellow: "border border-yellow-600/40 bg-yellow-100 text-yellow-900 dark:border-yellow-400/40 dark:bg-yellow-500/20 dark:text-yellow-200",
  green: "border border-green-600/40 bg-green-100 text-green-800 dark:border-green-400/40 dark:bg-green-500/20 dark:text-green-200",
  emerald: "border border-emerald-600/40 bg-emerald-100 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200",
  lime: "border border-lime-600/40 bg-lime-100 text-lime-800 dark:border-lime-400/40 dark:bg-lime-500/20 dark:text-lime-200",
  teal: "border border-teal-600/40 bg-teal-100 text-teal-800 dark:border-teal-400/40 dark:bg-teal-500/20 dark:text-teal-200",
  cyan: "border border-cyan-600/40 bg-cyan-100 text-cyan-800 dark:border-cyan-400/40 dark:bg-cyan-500/20 dark:text-cyan-200",
  indigo: "border border-indigo-600/40 bg-indigo-100 text-indigo-800 dark:border-indigo-400/40 dark:bg-indigo-500/20 dark:text-indigo-200",
  violet: "border border-violet-600/40 bg-violet-100 text-violet-800 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200",
  purple: "border border-purple-600/40 bg-purple-100 text-purple-800 dark:border-purple-400/40 dark:bg-purple-500/20 dark:text-purple-200",
  pink: "border border-pink-600/40 bg-pink-100 text-pink-800 dark:border-pink-400/40 dark:bg-pink-500/20 dark:text-pink-200",
  fuchsia: "border border-fuchsia-600/40 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-400/40 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
  zinc: "border border-zinc-500/40 bg-zinc-200 text-zinc-800 dark:border-zinc-400/40 dark:bg-zinc-500/25 dark:text-zinc-200",
  stone: "border border-stone-500/40 bg-stone-200 text-stone-800 dark:border-stone-400/40 dark:bg-stone-500/25 dark:text-stone-200",
  slate: "border border-slate-500/40 bg-slate-200 text-slate-800 dark:border-slate-400/40 dark:bg-slate-500/25 dark:text-slate-200",
} as const;

export type Tone = keyof typeof TONE;

/** For text beside the chips (a capital, a region): readable, not faint. */
export const CHIP_TEXT = "text-xs font-medium font-sans text-foreground/80";
