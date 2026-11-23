import { useCallback, useRef } from "react";

/**
 * A row that scrolls sideways takes the mouse wheel too: turned over the row, the wheel moves it along, until it reaches
 * an end, where the wheel goes back to scrolling the page. Returned as a ref to put on the row.
 */
export function useSidewaysWheel<T extends HTMLElement>() {
  const detach = useRef<(() => void) | null>(null);
  return useCallback((el: T | null) => {
    detach.current?.();
    detach.current = null;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    detach.current = () => el.removeEventListener("wheel", wheel);
  }, []);
}
