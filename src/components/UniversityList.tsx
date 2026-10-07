/**
 * Universities and colleges, a row each: the name, Wikidata's one-line
 * description and the year it was founded; opening a row quotes the opening
 * of its Wikipedia article - what it is about and known for, in Wikipedia's
 * words - fetched then.
 *
 * The country and city windows' panel (Universities) and the state window's
 * Education panel draw their schools with it, so a school reads the same in
 * all three. It holds no data of its own.
 */
import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { ArticleLead } from "./HistoryPanel";

export interface UniversityRow {
  name: string;
  /** Its English Wikipedia article. A row without one is its name alone and does not open. */
  wiki?: string;
  /** Wikidata's one-line description. */
  about?: string;
  /** The year it was founded. */
  founded?: number;
  /** A word of the list's own beside the row: the state window's "Public" or "Research". */
  tag?: string;
}

export function UniversityList({ list }: { list: UniversityRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="flex flex-col">
      {list.map((u) => {
        const id = u.wiki ?? u.name;
        const on = !!u.wiki && open === id;
        const row = (
          <>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-sans font-semibold text-foreground leading-snug">{u.name}</span>
              {u.about && <span className="block text-[11px] font-sans text-muted-foreground leading-snug mt-0.5">{u.about}</span>}
            </span>
            {u.tag ? (
              <span className="shrink-0 text-right">
                <span className="block text-[11px] font-sans text-muted-foreground">{u.tag}</span>
                {u.founded && <span className="block text-[9px] font-mono text-muted-foreground">founded {u.founded}</span>}
              </span>
            ) : (
              <span className="shrink-0 text-right">
                {u.founded && <span className="block text-[11px] font-mono font-semibold text-foreground">{u.founded}</span>}
                {u.founded && <span className="block text-[9px] font-mono text-muted-foreground">founded</span>}
              </span>
            )}
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
