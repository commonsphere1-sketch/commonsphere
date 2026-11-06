/**
 * The time now by a server's clock, for the times the election builds stamp on what they read ("read 6 Nov, 9:41 AM"):
 * the computer a build runs on can have its clock set wrong - this one's was hours fast, its zone set to Pacific with
 * Maryland's hours on it - and every such time is said on the site. A server's replies carry the time by its own clock
 * (their Date header), which a server keeps true: it is asked once, and the difference put right - half a second for
 * the whole seconds the header gives, and the middle of the request for the time it took. Where no server answers, the
 * computer's clock is used, and the build says so.
 *
 *   const { syncClock, nowIso } = require("./build-clock.cjs");
 *   await syncClock();   // once, before anything is stamped
 *   nowIso();            // the time now, set right
 */
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
let skew = 0;
let asked = null;

function syncClock(url = "https://en.wikipedia.org/w/api.php") {
  return (asked ??= (async () => {
    try {
      const sent = Date.now();
      const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
      const back = Date.now();
      const said = Date.parse(r.headers.get("date") ?? "");
      if (!Number.isFinite(said) || back - sent > 5000) throw new Error("no usable Date");
      skew = said + 500 - (sent + back) / 2;
      if (Math.abs(skew) > 60_000) console.log(`clock: this computer's clock is ${Math.abs(skew / 60_000).toFixed(0)} min ${skew < 0 ? "fast" : "slow"} by ${new URL(url).host}'s; times are stamped by the server's`);
    } catch (e) {
      console.log(`clock: no server's time (${e.message}); times are stamped by this computer's clock`);
    }
  })());
}

const nowIso = () => new Date(Date.now() + skew).toISOString();

module.exports = { syncClock, nowIso };
