/**
 * The wealthiest families with a published estimate, and the dynasties of
 * the past, under the hand-written family cards of the World Leaders page
 * (data/wealthyFamilies.ts).
 *
 * Each card is a family, what its wealth is from, and the estimate of its
 * combined wealth with the year of the estimate and the publication that
 * made it: Forbes, Bloomberg, Fortune and a few national lists, as gathered
 * in Wikipedia's list of the wealthiest families at the revision linked.
 * They are estimates made in different years by different publications, so
 * they are not one ranking; they are set largest first only to be found,
 * and carry no rank number. A family the cards above already hold is not
 * given twice.
 *
 * The dynasties of the past - the Rothschilds, the Medici, the Fuggers -
 * have no present-day estimate, and are given none: each has what the list
 * says of it and a way to its article.
 *
 * The list leaves out royal houses and ruling dynasties.
 */
import { ArrowSquareOut, ArrowsIn, ArrowsOut, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { PLACE_COUNTRIES } from "../data/placesIndex";
import { PAST_DYNASTIES, WEALTHY_FAMILIES, WEALTHY_FAMILIES_SOURCE, type WealthyFamily } from "../data/wealthyFamilies";
import { SourceLink } from "./SourceLink";
import { WindowTitle } from "./WindowTitle";

/** How many families are shown before the rest are asked for. */
const FIRST = 24;
const CODE_OF = new Map(Object.entries(PLACE_COUNTRIES).map(([code, [name]]) => [name, code]));
/** The flag of the first country a family is given: some are of two. */
const codeOf = (country: string | undefined) => (country ? CODE_OF.get(country.split(",")[0].trim()) : undefined);
export const wealthText = (f: WealthyFamily) => `$${Number(f.wealth.toFixed(1))}B`;
/** A family of the list, by the name the list gives it and - where two share a name - what its wealth is from. */
export const wealthyFamily = (name: string, from?: RegExp) => WEALTHY_FAMILIES.find((f) => f.name === name && (!from || from.test(f.from ?? "")));

function Flag({ country, big = false }: { country?: string; big?: boolean }) {
  const code = codeOf(country);
  const box = big ? "w-16 h-11 rounded-xl" : "w-7 h-5 rounded";
  return code ? (
    <img src={`https://flagcdn.com/${big ? "w160" : "w40"}/${code.toLowerCase()}.png`} alt={country} className={`${box} object-cover border border-border shrink-0`} />
  ) : (
    <span className={`${box} border border-border bg-muted shrink-0`} aria-hidden />
  );
}

function FamilyWindow({ f, onClose }: { f: WealthyFamily; onClose: () => void }) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tile = "bg-muted/20 rounded-lg p-3 border border-border/40 min-w-0";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`${f.name} family`} className={`relative z-10 w-full overflow-y-auto rounded-2xl modal-glass border shadow-2xl transition-all duration-300 ${wide ? "max-w-full max-h-full m-0" : "max-w-2xl max-h-[90vh]"}`}>
        <div className="p-6">
          <WindowTitle title={`${f.name} family`} where={f.country}>
            <button onClick={() => setWide((v) => !v)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label={wide ? "Collapse the window" : "Expand the window to full screen"} title={wide ? "Collapse" : "Expand to full screen"}>
              {wide ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </WindowTitle>
          <div className="flex items-center gap-4 mb-4">
            <Flag country={f.country} big />
            {f.from && <p className="text-xs font-sans text-foreground/80 leading-snug min-w-0">{f.from}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={tile}>
              <p className="text-[10px] text-muted-foreground">Combined wealth, as estimated</p>
              <p className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">{wealthText(f)}</p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5">billions of US dollars</p>
            </div>
            <div className={tile}>
              <p className="text-[10px] text-muted-foreground">Year of the estimate</p>
              <p className="text-sm font-bold font-mono text-foreground">{f.year ?? "Not given"}</p>
            </div>
            <div className={tile}>
              <p className="text-[10px] text-muted-foreground">Estimated by</p>
              <p className="text-sm font-bold font-sans text-foreground truncate">{f.cite?.by ?? "Not given"}</p>
            </div>
          </div>
          {f.members && (
            <div className="bg-muted/20 rounded-xl p-4 border border-border/40 mt-4">
              <h4 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest mb-2">Notable members</h4>
              <p className="text-[13px] font-sans text-foreground/90 leading-relaxed">{f.members}</p>
              <p className="text-[10px] font-sans text-muted-foreground mt-1.5">As the list names them; a name in brackets is of an earlier generation.</p>
            </div>
          )}
          {f.cite && (
            <a href={f.cite.url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-sans text-foreground hover:bg-muted/60 transition-colors">
              <ArrowSquareOut size={14} className="shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="font-semibold">{f.cite.by}</span>
                {f.cite.title ? ` — ${f.cite.title}` : ""}
                <span className="block text-[10px] text-muted-foreground">the publication the list cites for this figure</span>
              </span>
            </a>
          )}
          <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
            An estimate, not an account: a family's wealth is not published by the family, and the publication's figure for another year may differ. It is given as Wikipedia's list reports it, which volunteers edit.
          </p>
          <SourceLink sources={[...(f.cite ? [{ label: `${f.cite.by}${f.cite.title ? ` — ${f.cite.title}` : ""}`, url: f.cite.url }] : []), WEALTHY_FAMILIES_SOURCE]} className="mt-3" />
        </div>
      </div>
    </div>
  );
}

export default function WealthyFamilies({ held = [] }: { /** The families the cards above already hold, as the list names them: not given again here. */ held?: WealthyFamily[] }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<WealthyFamily | null>(null);
  const rest = useMemo(() => WEALTHY_FAMILIES.filter((f) => !held.includes(f)), [held]);
  const shown = all ? rest : rest.slice(0, FIRST);
  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">More families · each with a published estimate</h3>
          <div className="flex-1 h-px bg-border/60" />
        </div>
        <p className="text-[11px] font-sans text-muted-foreground leading-snug">
          {rest.length} more families, each with an estimate of its combined wealth, the year of the estimate and the publication that made it - Forbes for most. The estimates are of different years and by different publications, so they are
          not one ranking: they are set largest first only to be found. Royal houses and ruling dynasties are not in the list these are drawn from.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shown.map((f) => (
          <button key={`${f.name}-${f.from}`} onClick={() => setOpen(f)} className="w-full text-left rounded-xl border border-border bg-card hover:border-secondary/30 transition-all duration-200 overflow-hidden hover:scale-[1.01] hover:shadow-lg cursor-pointer">
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Flag country={f.country} />
                <span className="text-[10px] font-mono text-muted-foreground truncate">{f.country}</span>
              </div>
              <p className="font-bold text-sm text-foreground mb-0.5">{f.name} family</p>
              <p className="text-xs text-muted-foreground mb-2 truncate">{f.from ?? " "}</p>
              <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">{wealthText(f)}</p>
              <p className="text-[10px] text-muted-foreground">
                estimate{f.year ? ` · ${f.year}` : ""}
                {f.cite ? ` · ${f.cite.by}` : ""}
              </p>
            </div>
          </button>
        ))}
      </div>
      {rest.length > FIRST && (
        <button type="button" onClick={() => setAll((v) => !v)} className="show-more">
          {all ? `Show the first ${FIRST}` : `Show all ${rest.length} families`}
        </button>
      )}

      <div className="pt-2">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">Dynasties of the past · no present-day estimate</h3>
          <div className="flex-1 h-px bg-border/60" />
        </div>
        <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-3">
          The banking and merchant families that were the wealthiest of their day. No publication gives a figure for what they hold now, so none is given here: each has what the list says of it, and its article.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAST_DYNASTIES.map((d) => (
            <a key={d.name} href={`https://en.wikipedia.org/wiki/${encodeURIComponent(d.article.replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-card hover:border-secondary/30 transition-colors p-4 block">
              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                {d.name} <ArrowSquareOut size={12} className="text-muted-foreground shrink-0" aria-hidden />
              </p>
              <p className="text-xs font-sans text-muted-foreground leading-relaxed mt-1">{d.said}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-2">Wealth today: not held</p>
            </a>
          ))}
        </div>
      </div>
      <SourceLink sources={[WEALTHY_FAMILIES_SOURCE]} />
      {open && <FamilyWindow f={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
