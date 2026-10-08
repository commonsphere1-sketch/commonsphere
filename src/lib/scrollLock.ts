/**
 * Holds the page still behind a window, for windows that open over one
 * another.
 *
 * Each window used to remember how the page scrolled when it opened and put
 * that back when it closed. Opened one over another and closed together -
 * a division's window over its country's, both shut by one X - the one that
 * opened second put back "held still", which is how it had found the page,
 * and the page stayed locked. So the holds are counted: the page is let go
 * when the last window lets go, and goes back to how the first one found it.
 */
let held = 0;
let before = "";

/** Holds the page still; the function it returns lets go, once. */
export function lockScroll(): () => void {
  if (held++ === 0) {
    before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--held === 0) document.body.style.overflow = before;
  };
}
