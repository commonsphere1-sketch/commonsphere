import { useEffect, useRef } from "react";

/** How far from the end of the page, in pixels, the light starts to come up. */
const RISE = 320;

/**
 * A light along the bottom of the screen as a page nears its end: it comes
 * up over the last stretch of scrolling and is full at the very bottom, so
 * reaching the end of a long page reads as arriving rather than stopping.
 *
 * Decorative only: it takes no clicks, is hidden from assistive technology,
 * and a page too short to scroll never shows it. Its brightness is set
 * straight on the element, once a frame at most, so scrolling re-renders
 * nothing; the look is .cs-end-glow in index.css.
 */
export function ScrollEndGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const room = document.documentElement.scrollHeight - window.innerHeight;
      const left = room - window.scrollY;
      // Only a page with somewhere to scroll has an end to reach.
      const glow = room > RISE ? Math.max(0, Math.min(1, 1 - left / RISE)) : 0;
      el.style.opacity = glow.toFixed(3);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    // A page grows as its data and images arrive, which moves its end.
    const grown = new ResizeObserver(queue);
    grown.observe(document.documentElement);
    grown.observe(document.body);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      grown.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="cs-end-glow" style={{ opacity: 0 }} />;
}
