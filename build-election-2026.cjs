#!/usr/bin/env node
/**
 * Builds static/elections/2026.json - the 2026 midterms, as asked: each state's count of its races for the US Senate,
 * governor and the US House, read from the state's own official results site (free, and the record the state certifies
 * from), with the time it was read.
 *
 * No race is called here: a state's count is shown as the state gives it, unofficial until it certifies, and the map
 * colours a state by who leads its count. A state whose results site refuses a program, or whose site has not yet been
 * read here, is listed as not held, with the reason.
 *
 * Readers, one for each kind of site:
 *   Clarity (Scytl) - results.enr.clarityelections.com: Colorado, Iowa. Its files may be read from a browser, so the
 *     page reads them again itself while it is open.
 *   North Carolina State Board of Elections - er.ncsbe.gov's results file.
 *
 *   node build-election-2026.cjs
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "static/elections/2026.json");
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const get = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r;
};

/** A party as the state writes it, to the site's: R, D, or the state's own code for any other. */
const PARTY = { REP: "R", Republican: "R", R: "R", DEM: "D", Democratic: "D", Democrat: "D", D: "D" };
const party = (p) => PARTY[String(p ?? "").trim()] ?? String(p ?? "").trim();

/** Which race a contest is, by its title: senate (a special one for an unexpired term), governor, or a House district. */
function raceOf(title) {
  const t = title.replace(/\s+/g, " ").trim();
  if (/^(United States Senator|US SENATE|U\.S\. Senator)/i.test(t)) return { office: "senate", special: /unexpired|special/i.test(t) };
  if (/^Governor\b/i.test(t)) return { office: "governor" };
  const h = t.match(/(?:United States Representative|Representative to the \d+(?:st|nd|rd|th) United States Congress|US HOUSE OF REPRESENTATIVES|U\.S\. Representative)\D*District (\d+)/i);
  if (h) return { office: "house", district: +h[1] };
  return null;
}

// ── Clarity ──
async function clarity(st, eid) {
  const base = `https://results.enr.clarityelections.com/${st}/${eid}`;
  const ver = (await (await get(`${base}/current_ver.txt`)).text()).trim();
  const sum = await (await get(`${base}/${ver}/json/en/summary.json`)).json();
  const contests = [];
  for (const c of sum) {
    const race = raceOf(c.C);
    if (!race) continue;
    contests.push({ ...race, title: c.C, cands: c.CH.map((n, i) => [n, party(c.P[i]), c.V[i]]), reporting: Number.isFinite(c.PR) && Number.isFinite(c.TP) ? [c.PR, c.TP] : null });
  }
  return { contests, live: { kind: "clarity", st, eid }, url: `https://results.enr.clarityelections.com/${st}/${eid}/web.${ver}/#/summary` };
}

// ── North Carolina ──
async function northCarolina() {
  const rows = await (await get("https://er.ncsbe.gov/enr/20261103/data/results_0.txt")).json();
  const by = new Map();
  for (const r of rows) {
    const race = raceOf(r.cnm);
    if (!race) continue;
    if (!by.has(r.cnm)) by.set(r.cnm, { ...race, title: r.cnm.replace(/ \(VOTE FOR \d+\)$/, ""), cands: [], reporting: [+r.prt, +r.ptl] });
    by.get(r.cnm).cands.push([r.bnm, party(r.pty), +r.vct]);
  }
  return { contests: [...by.values()], url: "https://er.ncsbe.gov/?election_dt=11/03/2026&county_id=0&office=FED&contest=0" };
}

const READERS = {
  CO: { name: "Colorado Secretary of State", read: () => clarity("CO", "127407") },
  IA: { name: "Iowa Secretary of State", read: () => clarity("IA", "127077") },
  NC: { name: "North Carolina State Board of Elections", read: northCarolina },
};
/** States read and refused, so far: what each official site said to a program. */
const REFUSED = {
  TX: "The Texas Secretary of State's results site refuses reads by a program.",
  AR: "The Arkansas Secretary of State's results site refuses reads by a program.",
  KY: "The Kentucky State Board of Elections' results site refuses reads by a program.",
};

async function main() {
  const states = {};
  const failed = {};
  for (const [st, r] of Object.entries(READERS)) {
    try {
      const got = await r.read();
      // A contest with no votes counted yet is kept: it says the race is on the ballot.
      for (const c of got.contests) c.cands.sort((a, b) => b[2] - a[2]);
      states[st] = { source: r.name, url: got.url, live: got.live ?? null, readAt: new Date().toISOString(), contests: got.contests.sort((a, b) => ["senate", "governor", "house"].indexOf(a.office) - ["senate", "governor", "house"].indexOf(b.office) || (a.district ?? 0) - (b.district ?? 0)) };
    } catch (e) {
      failed[st] = String(e.message ?? e);
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ election: "2026-11-03", builtAt: new Date().toISOString(), states, refused: REFUSED, failed }));
  for (const [st, s] of Object.entries(states)) console.log(`${st} ${s.source}: ${s.contests.map((c) => `${c.office}${c.district ?? ""}${c.special ? "*" : ""} ${c.cands[0]?.[0]} ${c.cands[0]?.[1]} ${c.cands[0]?.[2]}`).join(" · ")}`);
  if (Object.keys(failed).length) console.log("failed:", failed);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
