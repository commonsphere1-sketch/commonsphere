/**
 * The time now, as the site's own server has it, for the clocks the site shows - a place's time in its window, a
 * country's on the world maps' card.
 *
 * Each clock was the reader's computer's: a computer whose clock is set wrong, or set to the wrong zone with its hours
 * moved to look right, showed every place's time wrong by as much - one set to Pacific time with Maryland's hours on it
 * read 2:19 PM in Maryland at 11:04 AM. So the site asks its own server the time once, from the Date every reply of
 * its carries (the server keeps true time), and sets the reader's clock right by the difference: half a second for the
 * whole seconds the header gives, and the middle of the request for the time it took. Where the server cannot be asked,
 * the computer's clock is used, as before.
 */

/** How far the reader's clock is from true time, in milliseconds: added to it. */
let skew = 0;
let asked: Promise<void> | null = null;

/** Asks the server the time, once: later calls wait on the same answer. */
export function syncClock(): Promise<void> {
  return (asked ??= (async () => {
    try {
      const sent = Date.now();
      const r = await fetch(`/?clock=${sent}`, { method: "HEAD", cache: "no-store" });
      const back = Date.now();
      const said = Date.parse(r.headers.get("date") ?? "");
      // A reply that took more than five seconds says too little of when it was sent.
      if (Number.isFinite(said) && back - sent < 5000) skew = said + 500 - (sent + back) / 2;
    } catch {
      // No server to ask: the computer's own clock stands.
    }
  })());
}

/** The time now, set right by the server's where it has been asked. */
export const trueNow = () => new Date(Date.now() + skew);
