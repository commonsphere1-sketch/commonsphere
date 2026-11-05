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
 *   Georgia Secretary of State - the total votes report (an Excel file) it publishes with each count.
 *   Florida Division of Elections - its election-night file, county by county, read five times for its fullest copy.
 *
 *   node build-election-2026.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readXlsx } = require("./xlsx-lite.cjs");

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
  const h = t.match(/(?:United States Representative|Representative to the \d+(?:st|nd|rd|th) United States Congress|US HOUSE OF REPRESENTATIVES|U\.S\. Representative|Representative in Congress)\D*District (\d+)/i);
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

// ── Georgia: the Secretary of State's results report, an Excel file it publishes with each count ──
async function georgia() {
  const api = "https://results.sos.ga.gov/results/public/api";
  const id = "11032026GeneralAndSpecialElection";
  const e = await (await get(`${api}/elections/Georgia/${id}`)).json();
  const report = (e.publicReportCategories ?? []).flatMap((c) => c.reports ?? []).find((r) => /Total Votes/i.test(r.reportName) && /\.xlsx$/i.test(r.blobName));
  if (!report) throw new Error("Georgia: no total votes report published");
  const buf = Buffer.from(await (await get(`https://results.sos.ga.gov/cdn/results/${e.jurisdictionId}/${encodeURIComponent(report.blobName)}`)).arrayBuffer());
  const file = path.join(os.tmpdir(), "commonsphere-ga-total-votes.xlsx");
  fs.writeFileSync(file, buf);
  const rows = readXlsx(file, readXlsx(file).sheets[0]).rows;
  const head = rows[0].map((h) => String(h).trim());
  const [iOffice, iName, iParty, iTotal] = ["Office Name", "Ballot Name", "Party", "Total"].map((n) => {
    const i = head.indexOf(n);
    if (i < 0) throw new Error(`Georgia: no column ${n}`);
    return i;
  });
  const by = new Map();
  for (const r of rows.slice(1)) {
    const race = raceOf(String(r[iOffice] ?? ""));
    if (!race || /^Total Votes$/i.test(String(r[iName]).trim())) continue;
    const key = String(r[iOffice]);
    if (!by.has(key)) by.set(key, { ...race, title: key, cands: [], reporting: null });
    // The report marks an incumbent "(I)" and the party after the name: the name alone is kept.
    by.get(key).cands.push([String(r[iName]).replace(/\s*\((?:I|Rep|Dem|Lib|Grn|Ind)\)/g, "").trim(), party(r[iParty] === "Rep" ? "REP" : r[iParty] === "Dem" ? "DEM" : r[iParty]), Number(r[iTotal]) || 0]);
  }
  return { contests: [...by.values()], url: `https://results.sos.ga.gov/results/public/Georgia/elections/${id}`, asOf: e.asOf };
}

// ── Florida: the Division of Elections' election-night file, each race county by county ──
async function florida() {
  // Florida's server answers some reads with a copy of the file from before the count, every figure 0, and some with one
  // part way through updating: it is read five times, and the copy with the most precincts reporting is kept - a count
  // only grows while it is made.
  const reads = [];
  for (let i = 0; i < 5; i++) reads.push(await (await get(`https://flelectionfiles.floridados.gov/enightfilespublic/20261103_ElecResultsFL.txt?r=${Date.now()}${i}`)).text());
  const reported = (t) => t.split(/\r?\n/).reduce((a, l) => {
    const r = l.split("\t");
    return r[3] === "USS" ? a + (Number(r[10]) || 0) : a;
  }, 0);
  const text = reads.sort((a, b) => reported(b) - reported(a))[0];
  if (!reported(text)) throw new Error("Florida: every read of the file had no precinct reporting");
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const h = head.split("\t");
  const at = (n) => {
    const i = h.indexOf(n);
    if (i < 0) throw new Error(`Florida: no column ${n}`);
    return i;
  };
  const [iParty, iCode, iRace, iCounty, iJuris, iPrec, iRep, iLast, iFirst, iMiddle, iVotes] = ["PartyCode", "RaceCode", "RaceName", "CountyCode", "Juris1num", "Precincts", "PrecinctsReporting", "CanNameLast", "CanNameFirst", "CanNameMiddle", "CanVotes"].map(at);
  const by = new Map();
  for (const line of lines) {
    const r = line.split("\t");
    if (!["USS", "GOV", "USR"].includes(r[iCode])) continue;
    const key = `${r[iCode]}${r[iJuris]}`;
    // Florida's only Senate race this year is the special election for the rest of Marco Rubio's term.
    const race = r[iCode] === "USS" ? { office: "senate", special: true } : r[iCode] === "GOV" ? { office: "governor" } : { office: "house", district: +r[iJuris] };
    if (!by.has(key)) by.set(key, { ...race, title: r[iRace], cands: new Map(), counties: new Map() });
    const c = by.get(key);
    // A governor's ticket is written as the two running mates' surnames - the governor's in the first-name column, a "/"
    // between: "Donalds / Avila".
    const name = r[iMiddle] === "/" ? `${r[iFirst]} / ${r[iLast]}` : `${r[iFirst]} ${r[iLast]}`.trim();
    const was = c.cands.get(name) ?? [name, party(r[iParty]), 0];
    was[2] += Number(r[iVotes]) || 0;
    c.cands.set(name, was);
    c.counties.set(r[iCounty], [Number(r[iRep]) || 0, Number(r[iPrec]) || 0]);
  }
  const contests = [...by.values()].map(({ counties, cands, ...c }) => {
    const p = [...counties.values()].reduce((a, [rep, tot]) => [a[0] + rep, a[1] + tot], [0, 0]);
    return { ...c, cands: [...cands.values()], reporting: p[1] ? p : null };
  });
  return { contests, url: "https://results.elections.myflorida.com/" };
}

const READERS = {
  CO: { name: "Colorado Secretary of State", read: () => clarity("CO", "127407") },
  IA: { name: "Iowa Secretary of State", read: () => clarity("IA", "127077") },
  NC: { name: "North Carolina State Board of Elections", read: northCarolina },
  GA: { name: "Georgia Secretary of State", read: georgia },
  FL: { name: "Florida Division of Elections", read: florida },
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
