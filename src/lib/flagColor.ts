/**
 * A country's own colour for a bar on its card: its flag's (data/flagColors,
 * read off the flag image by build-flag-colors.cjs).
 *
 * A flag's colour is used as it is unless it is too dark to be seen as a thin
 * bar on the site's dark cards - France's navy, Estonia's black-blue. Those
 * are lifted towards white by a fixed share, enough to read on both themes
 * and still be the flag's blue. Nothing else is changed, and a country whose
 * flag has no colour of its own gets none: the bar keeps the site's accent.
 */
import { FLAG_COLOR } from "../data/flagColors";

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** Relative luminance, 0 (black) to 1 (white). */
const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const towardsWhite = (hex: string, share: number) =>
  "#" +
  channels(hex)
    .map((v) => Math.round(v + (255 - v) * share).toString(16).padStart(2, "0"))
    .join("");

/** A flag's colour as it can be seen on both themes: lifted towards white where it is too dark to show, and otherwise as it is. */
export const seen = (raw: string) => (luminance(raw) < 0.07 ? towardsWhite(raw, 0.38) : raw);
/**
 * A shade of a colour, for telling apart the places that share one flag - the divisions of a country that have no
 * flag of their own: a step above zero lifts it towards white, one below darkens it. It is the same hue throughout.
 */
export const shade = (hex: string, step: number) =>
  step >= 0
    ? towardsWhite(hex, step)
    : "#" +
      channels(hex)
        .map((v) => Math.round(v * (1 + step)).toString(16).padStart(2, "0"))
        .join("");

const memo = new Map<string, string | null>();

/** The colour of a country's bar, by ISO code: its flag's, lifted where it would not show; null where its flag has none. */
export function flagColor(code: string): string | null {
  const hit = memo.get(code);
  if (hit !== undefined) return hit;
  const raw = FLAG_COLOR[code];
  const out = raw ? (luminance(raw) < 0.07 ? towardsWhite(raw, 0.38) : raw) : null;
  memo.set(code, out);
  return out;
}
