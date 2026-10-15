/**
 * What is illegal and what is legal in a country, in a place's Laws tab: the
 * "Laws and cultural differences" part of the UK Foreign, Commonwealth &
 * Development Office's travel advice for it (static/law, built by
 * build-country-law.cjs), under the Open Government Licence.
 *
 * Every word is the Office's. It is set out as the States page's windows set
 * out their laws, a row for each subject with a badge, with the day the advice
 * was last updated and its page. It is advice to
 * British travellers: it is not the whole of a country's law, and some of it
 * is custom and not law - the panel says so.
 *
 * So that what is illegal and what is legal can be found in it, its
 * sentences are marked by their wording alone: red where a sentence speaks
 * of something illegal, banned or punished, amber where of something allowed
 * only under a condition - a permit, a licence, an age, a place - and green
 * where of something legal or allowed. The marking is a search for those words (the two lists below)
 * and no judgement of the site's; the panel says that too, and the counts on
 * its buttons are counts of the sentences so marked. A list that follows a
 * sentence ending in a colon is read with that sentence.
 */
import { useMemo, useState } from "react";
import type { AdviceBlock, CountryLawAdvice } from "../data/countryLaw";

const RED = "#dc2626";
const GREEN = "#16a34a";
const AMBER = "#f59e0b";
/** A sentence that speaks of something illegal, banned or punished. */
const ILLEGAL =
  /\b(?:illegal(?:ly)?|against the law|unlawful|banned|bans?\b|prohibit(?:ed|s)?|forbidden|not (?:legal|allowed|permitted)|criminal offence|an offence|offence to|criminali[sz]ed|a crime|punishable|death penalty|prison sentences?|imprisonment|imprisoned|jailed|you (?:could|can|may|might|will) (?:also )?be (?:arrested|fined|detained|jailed|imprisoned|deported|prosecuted)|you could face|could be arrested|can be arrested|heavy fines?|on-the-spot fines?)\b/i;
/** A sentence that speaks of something legal or allowed - and not of its not being so. */
const LEGAL = /(?<!\b(?:not|never|no longer|nor) )\b(?:(?:is|are) (?:legal|lawful|allowed|permitted)|legal (?:in|for|to)\b|legali[sz]ed|decriminali[sz]ed|legally (?:recogni[sz]ed|allowed|permitted)|not illegal|no longer illegal|no laws? against|no restrictions? on)\b/i;
/** A sentence that speaks of something allowed only under a condition: a permit, a licence, an age, a place, a limit. */
const RESTRICTED =
  /(?<!\bno )\b(?:restrict(?:ed|ions?|s)?|permits? (?:is |are )?(?:required|needed)|(?:need|require|requires|required) (?:a |an |prior |written |official )?(?:permit|licen[cs]e|permission|authori[sz]ation|approval)|without (?:a |an |prior |official )?(?:permit|licen[cs]e|permission|authori[sz]ation)|only (?:with|if|in|at|by|on|when)|limited to|limits? on|(?:legal|minimum) age|aged? (?:under|over) \d+|under the age of|over the age of|must (?:register|declare|carry|obtain|apply)|subject to (?:approval|permission|restrictions?))\b/i;
type Mark = "illegal" | "legal" | "both" | "restricted" | null;
const markOf = (s: string): Mark => {
  const legal = LEGAL.test(s);
  // "Not illegal" says a thing is legal: the word in it is not counted against it.
  const illegal = ILLEGAL.test(s.replace(/\b(?:not|no longer) illegal\b/gi, ""));
  return illegal && legal ? "both" : illegal ? "illegal" : RESTRICTED.test(s) ? "restricted" : legal ? "legal" : null;
};
/** A paragraph as its sentences: cut after a full stop, a question or an exclamation that a capital follows. */
const sentences = (p: string) => p.split(/(?<=[.!?])\s+(?=[A-Z“"‘'(])/);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** A piece of the advice as it is drawn: a sentence, or a sentence with the list it leads into. */
type Piece = { text: string; list?: string[]; mark: Mark };
type Shown = { kind: "sub"; text: string } | { kind: "para"; pieces: Piece[] } | { kind: "list"; items: Piece[] };

function read(blocks: AdviceBlock[]): Shown[] {
  const out: Shown[] = [];
  blocks.forEach((b, i) => {
    if (typeof b === "string") {
      const next = blocks[i + 1];
      const parts = sentences(b);
      const pieces: Piece[] = parts.map((text, k) => {
        // A sentence that ends in a colon before a list is one statement with the list.
        const list = k === parts.length - 1 && /:$/.test(text) && Array.isArray(next) ? next : undefined;
        return { text, list, mark: markOf(list ? `${text} ${list.join("; ")}` : text) };
      });
      out.push({ kind: "para", pieces });
    } else if (Array.isArray(b)) {
      const prev = blocks[i - 1];
      // Already read with the sentence that leads into it.
      if (typeof prev === "string" && /:$/.test(prev)) return;
      out.push({ kind: "list", items: b.map((text) => ({ text, mark: markOf(text) })) });
    } else out.push({ kind: "sub", text: b.sub });
  });
  return out;
}
const tint = (m: Mark) => (m === "illegal" ? RED : m === "legal" ? GREEN : m === "restricted" ? AMBER : m === "both" ? "#d97706" : null);

/**
 * A place's Laws tab: the advice set out as the States page's windows set out their laws - "What's Legal in ...?", the
 * counts at its head, and a row for each subject with its badge - in the same tile, as asked.
 */
export function LawAdvice({ advice, country, place }: { advice: CountryLawAdvice; country: string; /** The place whose window this is, where it is not the country itself. */ place?: string }) {
  return (
    <section className="modal-tile rounded-xl p-4 border border-border/50 min-w-0">
      <AdviceLists advice={advice} country={country} place={place} all />
    </section>
  );
}

/**
 * The same advice as the states' windows list their laws: a row for each of its subjects - "Illegal drugs", "Alcohol laws" -
 * with a badge for what its sentences say: Illegal where any speaks of something banned or punished, Restricted where of
 * something allowed only under a condition, Legal where of something allowed, Mixed where its sentences say both. The row
 * gives the sentence the badge is taken from, and opens on a press to the rest of them. Every word is the Office's; the
 * badge is a search for its wording, as the window's marks are.
 */
type Status = "Illegal" | "Restricted" | "Legal" | "Mixed";
const STATUS: Record<Status, { dot: string; badge: string }> = {
  Illegal: { dot: "#f87171", badge: "text-red-400 bg-red-500/10 border-red-500/30" },
  Restricted: { dot: "#facc15", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  Legal: { dot: "#34d399", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  Mixed: { dot: "#a78bfa", badge: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
};
export function AdviceLists({ advice, country, place, all: whole = false }: { advice: CountryLawAdvice; country: string; /** The place whose window it is, where it is not the country. */ place?: string; /** Every subject at once, as a window lists them. */ all?: boolean }) {
  const [more, setMore] = useState(false);
  const all = whole || more;
  const topics = useMemo(
    () =>
      advice.items.flatMap((it) => {
        const pieces = read(it.b).flatMap((s) => (s.kind === "para" ? s.pieces : s.kind === "list" ? s.items : []));
        const marked = pieces.filter((p) => p.mark);
        if (!it.h || !marked.length) return [];
        const has = (m: Mark) => marked.some((p) => p.mark === m);
        const status: Status = has("both") || (has("illegal") && has("legal")) ? "Mixed" : has("illegal") ? "Illegal" : has("restricted") ? "Restricted" : "Legal";
        const lead = marked.find((p) => (status === "Mixed" ? p.mark === "both" || p.mark === "illegal" : p.mark === status.toLowerCase())) ?? marked[0];
        return [{ h: it.h, status, lead, rest: marked.filter((p) => p !== lead) }];
      }),
    [advice],
  );
  const count = (s: Status) => topics.filter((x) => x.status === s).length;
  const SHOWN = 6;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <p className="text-sm font-bold font-sans text-foreground">What's Legal in {country}?</p>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          {(["Legal", "Illegal", "Restricted", "Mixed"] as Status[]).map((s) =>
            count(s) ? (
              <span key={s} className={`px-2 py-0.5 rounded-full border ${STATUS[s].badge}`}>
                {count(s)} {s.toLowerCase()}
              </span>
            ) : null,
          )}
        </div>
      </div>
      {topics.length ? (
        <div className="flex flex-col gap-2">
          {topics.slice(0, all ? topics.length : SHOWN).map((x) => (
            <details key={x.h} className="group rounded-lg bg-background/40 border border-border/30">
              <summary className="flex items-start gap-2.5 p-3 cursor-pointer list-none">
                <span aria-hidden className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: STATUS[x.status].dot }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-sans font-semibold text-foreground leading-snug">{x.h}</span>
                  <span className="block text-[11px] font-sans text-muted-foreground mt-1 leading-snug">
                    {x.lead.text}
                    {x.lead.list && ` ${x.lead.list.join("; ")}`}
                  </span>
                  {x.rest.length > 0 && <span className="block text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1 group-open:hidden">{x.rest.length} more +</span>}
                </span>
                <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${STATUS[x.status].badge}`}>{x.status}</span>
              </summary>
              {x.rest.length > 0 && (
                <ul className="flex flex-col gap-1.5 px-3 pb-3 pl-[2.125rem]">
                  {x.rest.map((p, i) => (
                    <li key={i} className="pl-2 border-l-2 text-[11px] font-sans text-foreground leading-snug" style={{ borderColor: tint(p.mark) ?? "var(--color-border)" }}>
                      {p.text}
                      {p.list && <span className="text-muted-foreground"> {p.list.join("; ")}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      ) : (
        <p className="text-[11px] font-sans text-muted-foreground">No subject of the advice speaks of something illegal, restricted or legal.</p>
      )}
      {!whole && topics.length > SHOWN && (
        <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={all} className="self-start px-2.5 h-7 rounded-full border border-border bg-background/70 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          {all ? "Fewer" : `All ${topics.length} subjects`}
        </button>
      )}
      <p className="text-[10px] font-sans text-muted-foreground leading-snug">
        Each subject of the UK Foreign Office's travel advice for {country}{place ? ` - the country's law, which ${place} is under, not its own` : ""}, in its own words, last updated {day(advice.updated)}: written for British travellers, not the whole of the law, and some of it custom. The badge is a search for
        the wording of its sentences - illegal, banned or punished; allowed only with a permit, a licence, an age or a place; legal or allowed - not the site's judgement.{" "}
        <a href={advice.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
          Read it on GOV.UK
        </a>
      </p>
    </div>
  );
}
