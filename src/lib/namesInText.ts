/**
 * Finding named things - cities, people - in headlines.
 *
 * Whole words only ("Xi" but not "Xi'an", while "Putin's" is still Putin),
 * accents ignored and case kept ("Sao Paulo" is São Paulo; "Turkey" the
 * country is not "turkey"). The longest names are read first and take their
 * text, so a shorter name inside a longer one does not match as well. The
 * phrases to ignore are read before everything: "Paris Agreement" is not
 * news about Paris. The word before a name is captured rather than looked
 * behind, which older Safari cannot read.
 */

/** Without accents, and with one kind of apostrophe. */
export const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/[ʻʼ‘’`]/g, "'");

type Pattern<T> = { form: string; re: RegExp; item: T | null };

function pattern<T>(name: string, item: T | null): Pattern<T> {
  const form = plain(name);
  const esc = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { form, re: new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})(?![\\p{L}\\p{N}]|'\\p{Ll}{2})`, "gu"), item };
}

/** A function returning the items a text names, in the order found. */
export function nameMatcher<T>(entries: [T, string[]][], ignore: string[] = []): (text: string) => T[] {
  const patterns: Pattern<T>[] = ignore.map((n) => pattern<T>(n, null));
  for (const [item, names] of entries) for (const n of names) patterns.push(pattern(n, item));
  patterns.sort((a, b) => Number(!!a.item) - Number(!!b.item) || b.form.length - a.form.length);
  return (text: string) => {
    let t = plain(text);
    const found: T[] = [];
    for (const p of patterns) {
      if (!t.includes(p.form)) continue;
      p.re.lastIndex = 0;
      if (!p.re.test(t)) continue;
      t = t.replace(p.re, (_m, before: string, name: string) => before + " ".repeat(name.length));
      if (p.item !== null && !found.includes(p.item)) found.push(p.item);
    }
    return found;
  };
}
