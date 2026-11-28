/**
 * A figure as the site sets it, as asked: its numbers in the figures' face and its words in the reading face - "75 nations",
 * "86.5 yrs", "$1.2 trillion", "Tokyo 33.4M" - where a tile's figure had its words set in the figures' face with its numbers.
 *
 * A word is a run of letters with no digit in it; anything with a digit ("33.4M", "27,301/km²", "2025") or no letter at all
 * ("$", "·", "—", "→") is part of the figure. A figure with no words in it comes back as it was, for its element's own face;
 * anything that is not a string (a number, or an element already laid out) is left alone.
 */
import type { ReactNode } from "react";

const DIGIT = /[0-9]/;
const LETTER = /\p{L}/u;

export function figureText(value: ReactNode): ReactNode {
  if (typeof value !== "string") return value;
  const tokens = value.split(/(\s+)/).filter((t) => t !== "");
  const isWord = (t: string) => LETTER.test(t) && !DIGIT.test(t);
  if (!tokens.some(isWord)) return value;
  // Each token's kind; a space takes the reading face when a word is either side of it (the figures' face is wider).
  const kinds = tokens.map((t) => (/^\s+$/.test(t) ? null : isWord(t)));
  const runs: { word: boolean; text: string }[] = [];
  tokens.forEach((t, i) => {
    let word = kinds[i];
    if (word === null) word = Boolean(kinds[i - 1] || kinds[i + 1]);
    const last = runs[runs.length - 1];
    if (last && last.word === word) last.text += t;
    else runs.push({ word, text: t });
  });
  return runs.map((r, i) => (
    <span key={i} className={r.word ? "font-sans" : "font-mono"}>
      {r.text}
    </span>
  ));
}
