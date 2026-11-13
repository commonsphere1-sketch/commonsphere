/**
 * A filter bar's dropdown, in the site's own style, as asked - in place of the browser's own select: a chip like its
 * neighbours (marked as chosen when something other than the first option is picked) that opens the site's frosted list
 * (modal-glass), the one the country search uses. The list is drawn over the page (a portal) so the chip row, which
 * scrolls sideways, does not clip it. Arrow keys move, Enter picks, Escape closes; pressing away closes it.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react";

export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; /** What it chooses, said to a screen reader. */ label: string }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [place, setPlace] = useState<{ left: number; top: number; minWidth: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const chosen = options.find((o) => o.value === value) ?? options[0];
  const isDefault = value === options[0]?.value;

  // Where the list goes: under the chip, kept on the screen.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const width = Math.max(r.width, 176);
    setPlace({ left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), top: r.bottom + 6, minWidth: width });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setAt(Math.max(0, options.findIndex((o) => o.value === value)));
    const away = (e: PointerEvent) => !button.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node) && setOpen(false);
    // The page moving under it: the list closes rather than float away from its chip.
    const close = (e: Event) => !list.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-at="${at}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, at]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  };
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${label}: ${chosen?.label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return setOpen(true);
            setAt((i) => Math.max(0, Math.min(options.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            pick(options[at].value);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
          }
        }}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
          isDefault ? "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60" : "chip-selected"
        }`}
      >
        {chosen?.label}
        <CaretDown size={10} weight="bold" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        place &&
        createPortal(
          <ul ref={list} id={id} role="listbox" aria-label={label} className="fixed max-h-80 overflow-y-auto modal-glass border rounded-xl shadow-lg py-1 z-50" style={{ left: place.left, top: place.top, minWidth: place.minWidth }}>
            {options.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value} data-at={i}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  onMouseEnter={() => setAt(i)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer text-[12px] font-sans ${i === at ? "bg-muted/60" : ""} ${o.value === value ? "font-semibold text-foreground" : "text-foreground/90"}`}
                >
                  <span className="flex-1 min-w-0 truncate">{o.label}</span>
                  {o.value === value && <Check size={11} weight="bold" aria-hidden className="shrink-0 text-muted-foreground" />}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
