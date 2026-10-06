/**
 * Builds src/data/stateOffices.ts — when the terms of each state's elected
 * officials end, and where each office announces its own events. It is behind
 * the "Dates & elections" section at the foot of a state's window.
 *
 *   unitedstates/              each senator's and representative's current
 *     congress-legislators     term: the day it ends, a senator's class, and
 *                              the member's official website
 *   Wikipedia, "List of        each governor's term end as that list gives
 *     current United States    it, which it cites to the National Governors
 *     governors"               Association's roster, with the NGA's page for
 *                              the governor
 *
 * The election days themselves are not stored: they follow from federal law
 * and are worked out in lib/usCivicDates.ts.
 *
 * There is no published calendar of town halls or of mayors' and members'
 * public events, so none is made up: the section links to each office's own
 * site, where its events are announced.
 *
 *   node build-state-offices.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/stateOffices.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-state-offices");
fs.mkdirSync(CACHE, { recursive: true });

const CONGRESS = "https://unitedstates.github.io/congress-legislators/legislators-current.json";
const GOVERNORS_PAGE = "List of current United States governors";

function fetchText(args, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "120", "-A", UA, "-o", at, ...args], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${name}: could not be fetched`);
    }
  }
  return fs.readFileSync(at, "utf8");
}

// ── The fifty states, as the site names them ──
const statesSrc = fs.readFileSync(path.join(__dirname, "src/data/statesData.ts"), "utf8").replace(/\r\n/g, "\n");
const states = [...statesSrc.matchAll(/\n    id: "([a-z]{2})",\n    name: "([^"]+)",\n    abbreviation: "([A-Z]{2})",/g)].map((m) => ({ id: m[1], name: m[2], abbr: m[3] }));
if (states.length !== 50) throw new Error(`read ${states.length} states from statesData.ts, not 50`);
const byAbbr = new Map(states.map((s) => [s.abbr, s]));
const byName = new Map(states.map((s) => [s.name, s]));
const out = Object.fromEntries(states.map((s) => [s.id, { senators: [], representatives: [] }]));

// ── Congress: each member's current term ──
const people = JSON.parse(fetchText([CONGRESS], "legislators-current.json"));
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
const site = (u) => (/^https:\/\/[a-z0-9.-]+\.(senate|house)\.gov\/?$/i.test(u || "") ? u.replace(/\/$/, "") : undefined);
for (const p of people) {
  const t = p.terms[p.terms.length - 1];
  const s = byAbbr.get(t.state);
  if (!s) continue; // DC and the territories: delegates, not in the fifty
  const name = p.name.official_full || `${p.name.first} ${p.name.last}`;
  if (!isDate(t.end)) throw new Error(`${name}: term end "${t.end}"`);
  if (t.type === "sen") {
    if (![1, 2, 3].includes(t.class)) throw new Error(`${name}: Senate class "${t.class}"`);
    out[s.id].senators.push({ name, party: t.party, termEnd: t.end, class: t.class, url: site(t.url) });
  } else if (t.type === "rep") {
    out[s.id].representatives.push({ name, party: t.party, district: t.district === 0 ? "At Large" : String(t.district), n: t.district, termEnd: t.end, url: site(t.url) });
  }
}
for (const s of states) {
  const o = out[s.id];
  if (o.senators.length > 2) throw new Error(`${s.name}: ${o.senators.length} senators`);
  o.senators.sort((a, b) => a.termEnd.localeCompare(b.termEnd) || a.name.localeCompare(b.name));
  o.representatives.sort((a, b) => a.n - b.n);
  for (const r of o.representatives) delete r.n;
}
const senators = states.reduce((n, s) => n + out[s.id].senators.length, 0);
const reps = states.reduce((n, s) => n + out[s.id].representatives.length, 0);
if (senators < 95 || reps < 420) throw new Error(`only ${senators} senators and ${reps} representatives were read`);

// ── Governors: the term end the list gives, and the NGA's page ──
const wikitext = JSON.parse(
  fetchText(
    ["-G", "https://en.wikipedia.org/w/api.php", "--data-urlencode", "action=parse", "--data-urlencode", `page=${GOVERNORS_PAGE}`, "--data-urlencode", "prop=wikitext", "--data-urlencode", "format=json", "--data-urlencode", "formatversion=2"],
    "governors.json",
  ),
).parse.wikitext;
const table = wikitext.slice(wikitext.indexOf("Current state governors of the United States"));
let governors = 0;
for (const row of table.split("\n|-")) {
  const st = row.match(/\[\[Governor of ([^|\]]+)\|([^\]]+)\]\]/);
  const s = st && byName.get(st[2].trim());
  if (!s) continue;
  // The term-end cell is the one after the term-start date.
  const end = row.match(/\{\{dts\|\d{4}\|\d{1,2}\|\d{1,2}\}\}\s*\n\|\s*([^\n]+)/);
  if (!end) throw new Error(`${s.name}: no term-end cell in the governors list`);
  const termEnds = end[1].replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "").replace(/\{\{[^}]*\}\}/g, "").replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1").trim();
  if (!/^\d{4}/.test(termEnds) || termEnds.length > 60) throw new Error(`${s.name}: term end "${termEnds}"`);
  const nga = row.match(/https:\/\/www\.nga\.org\/governors\/[a-z-]+\//);
  if (out[s.id].governor) throw new Error(`${s.name}: two rows in the governors list`);
  out[s.id].governor = { termEnds, year: +termEnds.slice(0, 4), nga: nga ? nga[0] : undefined };
  governors++;
}
if (governors !== 50) throw new Error(`read ${governors} governors' terms, not 50`);

const today = new Date().toISOString().slice(0, 10);
const q = (v) => JSON.stringify(v);
const person = (p, extra) => `{ name: ${q(p.name)}, party: ${q(p.party)}, ${extra}termEnd: ${q(p.termEnd)}${p.url ? `, url: ${q(p.url)}` : ""} }`;
const row = (s) => {
  const o = out[s.id];
  return `  ${s.id}: {
    senators: [${o.senators.map((p) => person(p, `class: ${p.class}, `)).join(", ")}],
    representatives: [${o.representatives.map((p) => person(p, `district: ${q(p.district)}, `)).join(", ")}],
    governor: { termEnds: ${q(o.governor.termEnds)}, year: ${o.governor.year}${o.governor.nga ? `, nga: ${q(o.governor.nga)}` : ""} },
  },`;
};
fs.writeFileSync(
  OUT,
  `/**
 * When the terms of each state's elected officials end, and each office's own
 * site: behind the "Dates & elections" section of a state's window.
 *
 * GENERATED by build-state-offices.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * A senator's and a representative's term end is the day their current term
 * ends in the congress-legislators data; a governor's is the year Wikipedia's
 * list of current governors gives, which it cites to the National Governors
 * Association. Election days are not stored: they follow from federal law
 * (lib/usCivicDates.ts). There is no published calendar of town halls or of
 * officials' public events, and none is made up: the window links to each
 * office's own site.
 */
export const STATE_OFFICES_SOURCES = {
  congress: { label: "congress-legislators (current members' terms and sites)", url: "https://github.com/unitedstates/congress-legislators" },
  governors: { label: "Wikipedia — List of current United States governors (term ends, citing the National Governors Association)", url: "https://en.wikipedia.org/wiki/${GOVERNORS_PAGE.replace(/ /g, "_")}" },
  retrieved: "${today}",
};

export type OfficeHolder = {
  name: string;
  party: string;
  /** The day the current term ends. */
  termEnd: string;
  /** The member's official site, where their events are announced. */
  url?: string;
};

export type StateOffices = {
  /** In the order their terms end. A senator's class says which of the three election cycles the seat is in. */
  senators: (OfficeHolder & { class: 1 | 2 | 3 })[];
  /** In district order. */
  representatives: (OfficeHolder & { district: string })[];
  /** The end of the governor's term as the list gives it ("2027 (term limits)"), its year, and the NGA's page for the governor. */
  governor: { termEnds: string; year: number; nga?: string };
};

/** State id → its offices. */
export const STATE_OFFICES: Record<string, StateOffices> = {
${states.map(row).join("\n")}
};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: ${senators} senators, ${reps} representatives, ${governors} governors`);
const oh = out.oh;
console.log("  OH:", JSON.stringify({ senators: oh.senators, governor: oh.governor, reps: oh.representatives.length, first: oh.representatives[0] }));
const ends = {};
for (const s of states) for (const p of out[s.id].senators) ends[p.termEnd] = (ends[p.termEnd] || 0) + 1;
console.log("  senators' term ends:", JSON.stringify(ends));
const gov = {};
for (const s of states) gov[out[s.id].governor.termEnds] = (gov[out[s.id].governor.termEnds] || 0) + 1;
console.log("  governors' term ends:", JSON.stringify(gov));
