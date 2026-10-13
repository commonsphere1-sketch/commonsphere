/**
 * A source's own line of words, set out to be read: where a figure would be
 * a chart, a line that is only words - "Bahasa Indonesia (official, modified
 * form of Malay), English, Dutch, local dialects (…); note - more than 700
 * languages are used" - is a list.
 *
 * Nothing is reworded. The line is only cut where its own commas and
 * semicolons cut it (never inside brackets) and each piece set on a row:
 *
 *   NamedList   a line of names - languages, religions, peoples. Each name
 *               is a row, with what the line says of it in brackets beside
 *               it; "official", where the brackets open with it, is a tag;
 *               a share the line gives after a name is set at the row's end.
 *               A clause the line opens with "note" is given under the list
 *               as the source's note. A line that is not a list of names is
 *               given as its clauses.
 *   Clauses     a line of clauses - how a constitution is amended, how
 *               judges are chosen. Each clause is a row.
 *
 * The dots of a list of names are the colours a ring's legend uses, so a
 * tile of names sits beside a tile with a ring as its pair; they mark the
 * rows and stand for no figure.
 */
import { ChartNote, PART_COLORS } from "./ModalCharts";

/** A line cut at the given marks, but not at those inside brackets. */
function cut(line: string, marks: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of line) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (marks.includes(ch) && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
const NOTE = /^note\s*\d*\s*[-:]\s*/i;
/** A name, what the line says of it in brackets, and what follows the brackets: "Spanish (official) 99.5%". Without brackets, a share at its end is what follows. */
const BRACKETED = /^([^()]+?)\s*\(((?:[^()]|\([^()]*\))*)\)\s*([^()]*)$/;
const SHARED = /^(.+?)\s+((?:<\s*)?\d*\.?\d+%)$/;
function itemOf(it: string): { name: string; inside: string; after: string } | null {
  const b = BRACKETED.exec(it);
  if (b) return { name: b[1].trim(), inside: b[2].trim(), after: b[3].trim() };
  if (/[()]/.test(it)) return null;
  const s = SHARED.exec(it);
  return s ? { name: s[1].trim(), inside: "", after: s[2] } : { name: it, inside: "", after: "" };
}
/** The longest a name may be for the line to be read as a list of names. */
const NAME = 56;

/** A line of clauses, each on a row of its own. */
export function Clauses({ text, className = "" }: { text: string; className?: string }) {
  const rows = cut(text, ";");
  if (rows.length < 2) return <p className={`text-xs font-sans text-foreground leading-relaxed ${className}`}>{text}</p>;
  return (
    <ul className={`flex flex-col gap-1.5 ${className}`}>
      {rows.map((row, i) => (
        <li key={i} className="flex items-baseline gap-2 text-xs font-sans text-foreground leading-relaxed">
          <span aria-hidden className="w-1 h-1 rounded-full bg-muted-foreground/70 shrink-0 -translate-y-[2px]" />
          <span className="min-w-0">{row}</span>
        </li>
      ))}
    </ul>
  );
}

/** A line of names, each on a row of its own; what does not read as one is given as its clauses. */
export function NamedList({ text, colors = PART_COLORS, from = "The Factbook" }: { text: string; colors?: string[]; /** Whose line it is, to name in its note. */ from?: string }) {
  // A line the build cut short ends with an ellipsis: it is said to go on.
  const short = /\s…$/.test(text);
  const clauses = cut(short ? text.replace(/\s…$/, "") : text, ";");
  const notes = clauses.filter((c) => NOTE.test(c)).map((c) => c.replace(NOTE, ""));
  const items = clauses
    .filter((c) => !NOTE.test(c))
    .flatMap((c) => cut(c, ","))
    .map((it) => it.replace(/^and\s+/i, ""))
    .map((it) => {
      const m = itemOf(it);
      if (!m) return null;
      const official = /^official(?:[,;]\s*|$)/i.exec(m.inside);
      return { name: m.name, official: Boolean(official), said: (official ? m.inside.slice(official[0].length) : m.inside).trim(), after: m.after };
    });
  const named = items.length >= 2 && items.every((it) => it && it.name.length <= NAME);
  const foot = (
    <>
      {notes.map((n) => (
        <ChartNote key={n} className="mt-2">
          {from}'s note: {n}.
        </ChartNote>
      ))}
      {short && <ChartNote className="mt-2">{from}'s line goes on: it is cut here to keep the tile short.</ChartNote>}
    </>
  );
  if (!named)
    return (
      <>
        <Clauses text={clauses.filter((c) => !NOTE.test(c)).join("; ")} />
        {foot}
      </>
    );
  return (
    <>
      <ul className="flex flex-col">
        {items.map((it, i) => (
          <li key={i} className="flex items-baseline gap-2.5 py-1.5 border-b border-border/40 last:border-b-0">
            <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="flex-1 min-w-0 text-xs font-sans leading-snug">
              <span className="font-semibold text-foreground">{it!.name}</span>
              {it!.official && <span className="ml-1.5 align-[1px] text-[9px] font-mono uppercase tracking-wider px-1.5 py-px rounded-full border border-border bg-muted/60 text-foreground">official</span>}
              {it!.said && <span className="text-muted-foreground"> · {it!.said}</span>}
            </span>
            {it!.after && <span className="shrink-0 text-[11px] font-bold font-mono text-foreground">{it!.after}</span>}
          </li>
        ))}
      </ul>
      {foot}
    </>
  );
}
