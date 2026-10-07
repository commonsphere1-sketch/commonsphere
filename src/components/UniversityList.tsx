/**
 * Universities and colleges, a row each: the name with a chip or two saying
 * what kind of school it is, Wikidata's one-line description and the year it
 * was founded; opening a row quotes the opening of its Wikipedia article -
 * what it is about and known for, in Wikipedia's words - fetched then.
 *
 * The country and city windows' panel (Universities) and the state window's
 * Education panel draw their schools with it, so a school reads the same in
 * all three. It holds no data of its own.
 *
 * The chips are the kind of chip a leader's card has for an ideology, as
 * asked. In a state's window the chip is the site's own word for the school
 * (Public, Research, HBCU). Elsewhere a chip repeats a word of Wikidata's
 * description - "public research university in Seoul" is Public and
 * Research - and a description that says neither whose it is nor what kind
 * gets the plain noun it uses: University, College, Institute.
 */
import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { TONE } from "@/lib/chipTone";
import { ArticleLead } from "./HistoryPanel";

export interface UniversityRow {
  name: string;
  /** Its English Wikipedia article. A row without one is its name alone and does not open. */
  wiki?: string;
  /** Wikidata's one-line description. */
  about?: string;
  /** The year it was founded. */
  founded?: number;
  /** A word of the list's own for the kind of school: the state window's "Public" or "Research". Shown as the row's chip. */
  tag?: string;
}

/** Each kind's chip colour. */
const KIND_TONE: Record<string, string> = {
  Public: TONE.blue,
  Private: TONE.purple,
  National: TONE.sky,
  Research: TONE.teal,
  Technical: TONE.orange,
  "Liberal Arts": TONE.rose,
  HBCU: TONE.amber,
  Medical: TONE.emerald,
  Military: TONE.stone,
  Religious: TONE.yellow,
  "Women's": TONE.pink,
  Community: TONE.lime,
  "Land-grant": TONE.green,
  Arts: TONE.fuchsia,
  University: TONE.zinc,
  College: TONE.zinc,
  Institute: TONE.zinc,
  Academy: TONE.zinc,
  School: TONE.zinc,
};

/** Whose a school is, as a description words it. */
const OWNERSHIP: [RegExp, string][] = [
  [/\bpublic\b/i, "Public"],
  [/\bprivate\b/i, "Private"],
  [/\bnational\b/i, "National"],
];
/** What kind of school it is, as a description words it: the first that matches. */
const CHARACTER: [RegExp, string][] = [
  [/\bhistorically black\b/i, "HBCU"],
  [/\bresearch\b/i, "Research"],
  [/\b(institute of technology|technological|technical|polytechnic|engineering)\b/i, "Technical"],
  [/\bliberal arts\b/i, "Liberal Arts"],
  [/\b(medical|medicine)\b/i, "Medical"],
  [/\b(military|naval|air force)\b/i, "Military"],
  [/\b(catholic|jesuit|pontifical|lutheran|methodist|baptist|presbyterian|christian|islamic|buddhist)\b/i, "Religious"],
  [/\bwomen'?s\b/i, "Women's"],
  [/\bcommunity college\b/i, "Community"],
  [/\bland-grant\b/i, "Land-grant"],
  [/\b(art|arts|music|conservatory|film)\b/i, "Arts"],
];
/** The plain noun a description uses, for one that says nothing more. */
const NOUN: [RegExp, string][] = [
  [/\buniversity\b/i, "University"],
  [/\bcollege\b/i, "College"],
  [/\binstitute\b/i, "Institute"],
  [/\bacademy\b/i, "Academy"],
  [/\bschool\b/i, "School"],
];
const first = (rules: [RegExp, string][], text: string) => rules.find(([re]) => re.test(text))?.[1];

/** A row's chips: the list's own word where it has one, else what the description says the school is - two at most. */
function kindsOf(u: UniversityRow): string[] {
  if (u.tag) return [u.tag];
  const about = u.about ?? "";
  const said = [first(OWNERSHIP, about), first(CHARACTER, about)].filter((k): k is string => !!k);
  if (said.length) return said;
  const noun = first(NOUN, about);
  return noun ? [noun] : [];
}

export function UniversityList({ list }: { list: UniversityRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="flex flex-col">
      {list.map((u) => {
        const id = u.wiki ?? u.name;
        const on = !!u.wiki && open === id;
        const kinds = kindsOf(u);
        const row = (
          <>
            <span className="flex-1 min-w-0">
              <span className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-sans font-semibold text-foreground leading-snug min-w-0">{u.name}</span>
                {kinds.length > 0 && (
                  <span className="flex flex-wrap justify-end gap-1 shrink-0">
                    {kinds.map((k) => (
                      <span key={k} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${KIND_TONE[k] ?? TONE.zinc}`}>
                        {k}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              {u.about && <span className="block text-[11px] font-sans text-muted-foreground leading-snug mt-0.5">{u.about}</span>}
            </span>
            <span className="shrink-0 text-right w-11">
              {u.founded && <span className="block text-[11px] font-mono font-semibold text-foreground">{u.founded}</span>}
              {u.founded && <span className="block text-[9px] font-mono text-muted-foreground">founded</span>}
            </span>
          </>
        );
        return (
          <li key={id} className="border-b border-border last:border-b-0">
            {u.wiki ? (
              <button type="button" onClick={() => setOpen(on ? null : id)} aria-expanded={on} className="w-full flex items-start gap-3 py-2 text-left cursor-pointer hover:opacity-80 transition-opacity">
                {row}
                <CaretDown size={12} className={`shrink-0 mt-1 text-muted-foreground transition-transform ${on ? "rotate-180" : ""}`} aria-hidden />
              </button>
            ) : (
              <div className="flex items-start gap-3 py-2">{row}</div>
            )}
            {on && u.wiki && (
              <div className="pb-3">
                <ArticleLead title={u.wiki} name={u.name} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
