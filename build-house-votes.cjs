#!/usr/bin/env node
/**
 * Builds static/votes/house/ and src/data/houseVotesMeta.ts - how each member of the House voted, as asked: every
 * recorded vote of the 119th Congress, from the Clerk of the House's own roll-call files (public domain).
 *
 *   https://clerk.house.gov/evs/{year}/roll{NNN}.xml - each roll call: its question, the bill or measure, the result, the
 *   Clerk's totals by party, and each member's vote by their Biographical Directory id.
 *
 * Quorum calls (where members answer "present" only to be counted) and the elections of the Speaker (where each names a
 * candidate) are left out of the votes kept: they are not a yea or a nay on a question.
 *
 *   static/votes/house/index.json      every vote kept: [year, roll, date, measure, question, result, title, yea, nay,
 *                                       present, not voting, Democrats yea, Democrats nay, Republicans yea, Republicans nay]
 *   static/votes/house/m/{id}.json     a member's party in the Clerk's files (D, R, I) and votes, one letter each in the
 *                                       index's order: Y yea or aye, N nay or no, P present, V not voting, - not a member then
 *
 *   node build-house-votes.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const CONGRESS = 119;
const YEARS = [2025, 2026];
const OUT = path.join(__dirname, "static/votes/house");
const META = path.join(__dirname, "src/data/houseVotesMeta.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-votes");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";

/** A roll call's file, from the cache where it is there: a vote, once recorded, does not change. */
async function roll(year, n) {
  const file = path.join(CACHE, `house-${year}-${String(n).padStart(3, "0")}.xml`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const r = await fetch(`https://clerk.house.gov/evs/${year}/roll${String(n).padStart(3, "0")}.xml`, { headers: { "User-Agent": UA } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`roll ${year} ${n}: ${r.status}`);
  const text = await r.text();
  if (!text.includes("<rollcall-vote>")) return null;
  fs.writeFileSync(file, text);
  return text;
}
const tag = (xml, name) => (xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) ?? [])[1]?.trim() ?? "";
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");
const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
const isoDate = (d) => {
  const m = d.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
  if (!m || !MONTHS[m[2]]) throw new Error(`a date of ${d}`);
  return `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, "0")}`;
};
const CODE = { Yea: "Y", Aye: "Y", Nay: "N", No: "N", Present: "P", "Not Voting": "V" };

async function main() {
  const votes = [];
  const byMember = new Map(); // id -> Map(vote index -> code)
  const names = new Map(); // id -> [sort name, party, state]
  let skipped = 0;
  for (const year of YEARS) {
    let n = 1;
    let misses = 0;
    while (misses < 3) {
      // Four at a time, in order.
      const batch = await Promise.all([n, n + 1, n + 2, n + 3].map((k) => roll(year, k)));
      for (let i = 0; i < batch.length; i++) {
        const xml = batch[i];
        if (!xml) {
          misses++;
          continue;
        }
        misses = 0;
        const type = tag(xml, "vote-type");
        const question = unesc(tag(xml, "vote-question"));
        if (type === "QUORUM" || /Election of the Speaker/i.test(question)) {
          skipped++;
          continue;
        }
        const party = (p) => {
          const block = [...xml.matchAll(/<totals-by-party>([\s\S]*?)<\/totals-by-party>/g)].map((m) => m[1]).find((b) => tag(b, "party") === p);
          return block ? [+tag(block, "yea-total"), +tag(block, "nay-total")] : [0, 0];
        };
        const all = (xml.match(/<totals-by-vote>([\s\S]*?)<\/totals-by-vote>/) ?? [])[1] ?? "";
        const idx = votes.length;
        const [dy, dn] = party("Democratic");
        const [ry, rn] = party("Republican");
        votes.push([year, n + i, isoDate(tag(xml, "action-date")), unesc(tag(xml, "legis-num")), question, unesc(tag(xml, "vote-result")), unesc(tag(xml, "vote-desc")), +tag(all, "yea-total"), +tag(all, "nay-total"), +tag(all, "present-total"), +tag(all, "not-voting-total"), dy, dn, ry, rn]);
        for (const m of xml.matchAll(/<recorded-vote>\s*<legislator name-id="([A-Z]\d{6})"[^>]*sort-field="([^"]*)"[^>]*party="([A-Z])"[^>]*state="([A-Z]{2})"[^>]*>[\s\S]*?<\/legislator>\s*<vote>([^<]*)<\/vote>/g)) {
          const code = CODE[m[5].trim()];
          if (!code) throw new Error(`roll ${year} ${n + i}: a vote of ${m[5]}`);
          if (!byMember.has(m[1])) byMember.set(m[1], new Map());
          byMember.get(m[1]).set(idx, code);
          names.set(m[1], [unesc(m[2]), m[3], m[4]]);
        }
      }
      n += 4;
    }
  }
  if (votes.length < 300) throw new Error(`only ${votes.length} votes read`);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "m"), { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ congress: CONGRESS, votes }));
  for (const [id, m] of byMember) fs.writeFileSync(path.join(OUT, "m", `${id}.json`), JSON.stringify({ party: names.get(id)[1], votes: votes.map((_, i) => m.get(i) ?? "-").join("") }));
  const last = votes[votes.length - 1];
  fs.writeFileSync(
    META,
    `/**
 * How each member of the House voted: the ${votes.length} recorded votes of the ${CONGRESS}th Congress to ${last[2]} (roll ${last[1]} of ${last[0]}), from the
 * Clerk of the House's roll-call files (public domain); ${skipped} quorum calls and elections of the Speaker left out. The votes are in
 * static/votes/house/, fetched when a member's profile is opened.
 *
 * GENERATED by build-house-votes.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const HOUSE_VOTES_SOURCES = [
  { label: "Clerk of the US House of Representatives — roll call votes, ${CONGRESS}th Congress", url: "https://clerk.house.gov/Votes" },
];
export const HOUSE_VOTES_THROUGH = "${last[2]}";
export const HOUSE_VOTES_COUNT = ${votes.length};
/** A member's file: their party as the Clerk last gives it, and a letter for each vote - Y yea, N nay, P present, V not voting, - not then a member. */
export type HouseMemberVotes = { party: string; votes: string };
/** A vote: [year, roll number, date, measure, question, result, title, yea, nay, present, not voting, Democrats yea, Democrats nay, Republicans yea, Republicans nay]. */
export type HouseVote = [year: number, roll: number, date: string, measure: string, question: string, result: string, title: string, yea: number, nay: number, present: number, notVoting: number, demYea: number, demNay: number, repYea: number, repNay: number];
`,
  );
  console.log(`wrote static/votes/house: ${votes.length} votes to ${last[2]}, ${byMember.size} members; ${skipped} quorum calls and Speaker elections left out`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
