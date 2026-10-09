import { useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * One row of chips that scrolls sideways when it runs out of room - the
 * section bars, the sticky filter bars, and the rows of chips inside the
 * pages' containers, which once wrapped onto several lines. The scrollbar is hidden, so the
 * row stays the height of its chips; an edge that has more chips beyond it
 * fades out and gets a small arrow to move along, which a mouse without a
 * sideways wheel needs. Keyboard focus scrolls the row by itself.
 */
export function ChipRow({
  children,
  className = "",
  rowRef,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** What the chips choose between, for a screen reader: the row is then a named group. */
  label?: string;
  /** The scrolling element, for a parent that brings a chip into view. */
  rowRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  const ownRef = useRef<HTMLDivElement | null>(null);
  const ref = rowRef ?? ownRef;
  const [more, setMore] = useState({ left: false, right: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref]);

  const fade = 28;
  const mask =
    more.left || more.right
      ? `linear-gradient(90deg, ${more.left ? `transparent 0, #000 ${fade}px` : "#000 0"}, ${
          more.right ? `#000 calc(100% - ${fade}px), transparent 100%` : "#000 100%"
        })`
      : undefined;
  const step = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });
  const arrow = "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-border bg-background/85 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer";

  return (
    <div className={`relative min-w-0 ${className}`} role={label ? "group" : undefined} aria-label={label}>

      <div ref={ref} className="cs-chip-row flex items-center gap-1.5 overflow-x-auto" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        {children}
      </div>
      {more.left && (
        <button type="button" tabIndex={-1} onClick={() => step(-1)} aria-label="Show the chips to the left" className={`${arrow} left-0`}>
          <CaretLeft size={11} weight="bold" />
        </button>
      )}
      {more.right && (
        <button type="button" tabIndex={-1} onClick={() => step(1)} aria-label="Show the chips to the right" className={`${arrow} right-0`}>
          <CaretRight size={11} weight="bold" />
        </button>
      )}
    </div>
  );
}
