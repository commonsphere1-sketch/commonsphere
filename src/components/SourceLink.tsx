/**
 * SourceLink.tsx
 * Small reusable citation component placed under displayed data.
 *
 * The sources sit folded under a small "Sources" pill, as asked - on every
 * container, in and out of the windows - and open on a press to the list of
 * links, each to the publisher's own page, so that a reader can still check
 * where every figure is from.
 */
import { useId, useState } from "react";
import { ArrowSquareOut, CaretDown } from "@phosphor-icons/react";

interface Source {
  label: string;
  url: string;
}

interface SourceLinkProps {
  sources: Source | Source[];
  className?: string;
  /**
   * Show the external-link icon after each label. Defaults to true; the
   * economies modal opts out because that dialog is deliberately icon-free.
   */
  showIcon?: boolean;
}

export function SourceLink({
  sources,
  className = "",
  showIcon = true,
}: SourceLinkProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  // The same source can reach a panel twice (two figures from one dataset);
  // list it once.
  const list = (Array.isArray(sources) ? sources : [sources]).filter(
    (src, i, all) => all.findIndex((o) => o.label === src.label && o.url === src.url) === i,
  );
  // Nothing to cite: render nothing rather than an empty "Sources" pill.
  if (list.length === 0) return null;

  return (
    <div className={`flex flex-col items-start gap-1 mt-1.5 ${className}`} aria-label="Data sources">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex items-center gap-1 px-2 h-5 rounded-full border border-border/70 bg-background/40 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/80 hover:text-foreground cursor-pointer transition-colors"
      >
        {list.length === 1 ? "Source" : `Sources · ${list.length}`}
        <CaretDown size={8} weight="bold" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div id={id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {list.map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/70 hover:text-secondary transition-colors underline underline-offset-2 decoration-dotted"
              title={`Open ${src.label}`}
            >
              {src.label}
              {showIcon && <ArrowSquareOut size={8} className="shrink-0 opacity-70" />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
