/**
 * What the world's bodies are working on: a card for each alliance, bloc and
 * agency that states an agenda, three across as the Countries, Cities and
 * Municipalities pages lay their cards out, each opening a window with the
 * agenda in full - what the body is, what it is working on, what is worth
 * knowing of it, its members and its source.
 *
 * Everything is read from alliances.ts, where each body's entry was checked
 * against its own page on the day the window gives; nothing is typed in here.
 * They stood on the Developments page as long cards, two across, with every
 * item set out: a card says how many items there are and gives the first,
 * and the window has the rest.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowsIn, ArrowsOut, X } from "@phosphor-icons/react";
import { ALLIANCES, ALLIANCES_CHECKED, HUMAN_RIGHTS_CHECKED, type Alliance } from "../data/alliances";
import { SourceLink } from "./SourceLink";
import { WindowTitle } from "./WindowTitle";

/** The bodies that say what they are working on. */
export const AGENDAS = ALLIANCES.filter((a) => a.agenda?.length);

const places = new Intl.DisplayNames(["en"], { type: "region" });
const placeName = (code: string) => {
  try {
    return places.of(code) ?? code;
  } catch {
    return code;
  }
};
const checkedOn = (a: Alliance) => (a.kind === "Human rights body" ? HUMAN_RIGHTS_CHECKED : ALLIANCES_CHECKED);

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="modal-tile rounded-lg p-3 min-w-0">
      <p className="text-xs text-muted-foreground font-sans">{label}</p>
      <p className={`font-bold font-mono text-foreground ${value.length > 14 ? "text-sm leading-snug" : "text-lg"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground font-sans">{sub}</p>}
    </div>
  );
}
function Listed({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="modal-tile rounded-xl p-4">
      <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-wide mb-2.5">{title}</h3>
      <ul className="flex flex-col gap-2 list-disc pl-4">
        {items.map((x) => (
          <li key={x} className="text-[12.5px] font-sans text-foreground/90 leading-relaxed">
            {x}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AgendaWindow({ a, onClose }: { a: Alliance; onClose: () => void }) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${a.name}: what it is working on`}
    >
      <div className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${wide ? "max-w-full max-h-full m-0" : "max-w-2xl max-h-[90vh]"}`}>
        <div className="p-6">
          <WindowTitle title={a.short} note={a.kind}>
            <button
              onClick={() => setWide((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label={wide ? "Collapse modal" : "Expand modal to full screen"}
              title={wide ? "Collapse" : "Expand to full screen"}
            >
              {wide ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </WindowTitle>

          {a.name !== a.short && <p className="text-sm font-sans text-foreground mb-4">{a.name}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <Tile label="Members" value={String(a.memberCount)} sub="by its own count" />
            {a.founded && <Tile label="Founded" value={String(a.founded)} />}
            {a.headquarters && <Tile label="Headquarters" value={a.headquarters} />}
          </div>
          <div className="flex flex-col gap-3">
            {a.what && <p className="text-[13px] font-sans text-foreground/90 leading-relaxed">{a.what}</p>}
            <Listed title="What it is working on" items={a.agenda} />
            <Listed title="Worth knowing" items={a.impact} />
            {a.members && a.members.length > 0 && (
              <section className="modal-tile rounded-xl p-4">
                <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-wide mb-2.5">Members on the site · {a.members.length}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {a.members.map((code) => (
                    <span key={code} className="inline-flex items-center gap-1 text-[11px] font-sans text-foreground px-2 py-0.5 rounded-full border border-border">
                      <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" width={14} height={10} className="rounded-[1px]" loading="lazy" />
                      {placeName(code)}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {a.note && <p className="text-[11px] font-sans text-muted-foreground leading-snug">{a.note}</p>}
            <p className="text-[11px] font-sans text-muted-foreground leading-snug">Checked against the body's own page on {checkedOn(a)}.</p>
            <SourceLink sources={[a.source]} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function AgendaCards() {
  const [open, setOpen] = useState<Alliance | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {AGENDAS.map((a) => {
          const items = a.agenda ?? [];
          return (
            <article
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(a)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(a);
                }
              }}
              aria-haspopup="dialog"
              aria-label={`${a.name}: what it is working on`}
              className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 flex flex-col min-w-0"
            >
              <h3 className="font-semibold font-sans text-foreground text-sm leading-snug">{a.short}</h3>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">{a.kind}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans">Members</p>
                  <p className="text-sm font-bold font-mono text-foreground">{a.memberCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans">On its agenda</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <p className="text-[11.5px] font-sans text-foreground/85 leading-snug mt-3 line-clamp-3">{items[0]}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-auto pt-3">Open for the agenda in full</p>
            </article>
          );
        })}
      </div>
      {open && <AgendaWindow a={open} onClose={() => setOpen(null)} />}
    </>
  );
}
