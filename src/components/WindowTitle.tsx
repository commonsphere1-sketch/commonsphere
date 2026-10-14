/**
 * The head of a place's window: its name, where it is beside the name, and
 * the window's buttons - one bar across the top of the window, above the
 * flag, that stays in sight as the window is scrolled.
 *
 * It is the same in every window of the site - a place's, a leader's, a
 * figure's, a commodity's, an alliance's, and the sign-in and About windows -
 * so the name is always in the window's top left corner and the way out
 * always in its top right.
 *
 * The bar of tabs under it is sticky too, and has to stop under this bar and
 * not behind it. This bar's height is not fixed - a long name or a narrow
 * window wraps it - so it is measured, and given to the window as
 * --window-title-h, which the tabs' rule (index.css) reads.
 */
import { MapPin } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function WindowTitle({
  title,
  where,
  note,
  children,
  className = "",
}: {
  title: ReactNode;
  /** Where the place is - its capital, its country, the division it is in - set beside its name. */
  where?: ReactNode;
  /** What the window is, where it is not a place's: a line beside its name, with no pin. */
  note?: ReactNode;
  /** The window's buttons, at the bar's right. */
  children?: ReactNode;
  className?: string;
}) {
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = bar.current;
    const win = el?.closest<HTMLElement>(".modal-glass");
    if (!el || !win) return;
    const set = () => win.style.setProperty("--window-title-h", `${el.offsetHeight}px`);
    set();
    const seen = new ResizeObserver(set);
    seen.observe(el);
    return () => {
      seen.disconnect();
      win.style.removeProperty("--window-title-h");
    };
  }, []);
  return (
    <div ref={bar} className={`window-title ${className}`}>
      <div className="flex items-baseline gap-x-3 gap-y-0.5 flex-wrap min-w-0 flex-1 py-1">
        <h2 className="text-xl font-bold font-sans text-foreground leading-tight min-w-0">{title}</h2>
        {where && (
          <span className="inline-flex items-center gap-1 text-xs font-medium font-sans text-foreground/80 min-w-0">
            <MapPin size={12} weight="fill" className="shrink-0" aria-hidden /> {where}
          </span>
        )}
        {note && <span className="text-xs font-medium font-sans text-foreground/80 min-w-0">{note}</span>}
      </div>
      {children && <div className="flex items-center gap-1.5 shrink-0">{children}</div>}
    </div>
  );
}
