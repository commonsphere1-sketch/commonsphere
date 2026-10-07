/**
 * Builds src/data/stateOffices.ts — when the terms of each state's elected
 * officials end, and where each office announces its own events. It is behind
 * the "Dates & elections" section at the foot of a state's window.
 *
 *   unitedstates/              each senator's and representative's current
 *     congress-legislators     term: the day it ends, a senator's class, and
 *                              the member's official website
 *   Wikipedia, "List of        each governor - name, party, the day the term
 *     current United States    began and its end as that list gives them,
 *     governors"               which it cites to the National Governors
 *                              Association's roster - with the NGA's page
 *                              for the governor
 *   Wikipedia, "List of        the mayor of each of the fifty largest
 *     mayors of the 50         cities: name, party as the list gives it (most
 *     largest cities in the    of these offices are nonpartisan in law, and
 *     United States"           the list says which), the day the term began
 *                              and the year of the next election. They are
 *                              the officials explorer's mayors
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
const MAYORS_PAGE = "List of mayors of the 50 largest cities in the United States";
/**
 * A party as the site names it: the congress-legislators data says "Democrat", the Wikipedia lists "Democratic" - and
 * "DFL" for Minnesota's Democratic-Farmer-Labor Party, which is the Democratic Party's affiliate in that state.
 */
const partyName = (p) => (/Democrat|^DFL$|Farmer.Labor/i.test(p) ? "Democrat" : /Republican/i.test(p) ? "Republican" : /Independent|Nonpartisan/i.test(p) ? "Independent" : p.trim());
/** "{{sortname|Mike|Dunleavy|dab=politician}}" → "Mike Dunleavy". */
const sortname = (cell) => {
  const m = /\{\{sortname\|([^|}]+)\|([^|}]+)/.exec(cell || "");
  return m ? `${m[1].trim()} ${m[2].trim()}`.replace(/\s+/g, " ") : null;
};
/** The article a name cell links to: a sortname template's third parameter, or its name with the "dab" in brackets; else the cell's own link. */
const sortlink = (cell) => {
  const m = /\{\{sortname\|([^}]+)\}\}/.exec(cell || "");
  if (!m) return /\[\[([^|\]]+)/.exec(cell || "")?.[1].trim() ?? null;
  const parts = m[1].split("|").map((x) => x.trim());
  const named = Object.fromEntries(parts.filter((x) => /^[a-z]+\s*=/.test(x)).map((x) => x.split(/\s*=\s*/)));
  const pos = parts.filter((x) => !/^[a-z]+\s*=/.test(x));
  if (named.nolink) return null;
  return pos[2] || `${pos[0]} ${pos[1]}${named.dab ? ` (${named.dab})` : ""}`;
};
const unlink = (s) => s.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "").replace(/\{\{efn[\s\S]*?\}\}/g, "").replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1").replace(/<br\s*\/?>/g, " ").trim();
const wikitextOf = (page, name) =>
  JSON.parse(fetchText(["-G", "https://en.wikipedia.org/w/api.php", "--data-urlencode", "action=parse", "--data-urlencode", `page=${page}`, "--data-urlencode", "prop=wikitext", "--data-urlencode", "format=json", "--data-urlencode", "formatversion=2"], name)).parse.wikitext;

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
  if (!/^[A-Z]\d{6}$/.test(p.id.bioguide || "")) throw new Error(`${name}: Biographical Directory id "${p.id.bioguide}"`);
  // The party a member who belongs to neither sits with, where the data names one.
  const who = { id: p.id.bioguide, name, party: t.party, caucus: t.caucus && t.caucus !== t.party ? partyName(t.caucus) : undefined };
  if (t.type === "sen") {
    if (![1, 2, 3].includes(t.class)) throw new Error(`${name}: Senate class "${t.class}"`);
    out[s.id].senators.push({ ...who, termEnd: t.end, class: t.class, url: site(t.url) });
  } else if (t.type === "rep") {
    out[s.id].representatives.push({ ...who, district: t.district === 0 ? "At Large" : String(t.district), n: t.district, termEnd: t.end, url: site(t.url) });
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
  // The governor's name, party and the day the term began, from the same row.
  // The name is the row's header cell: a sortname template, or - for one row - a plain link.
  const head = /\n! scope="row" \|([^\n]+)/.exec(row)?.[1] ?? "";
  const name = sortname(head) ?? (unlink(head) || null);
  const party = row.match(/\{\{party color\|([^}]+)\}\}/);
  const began = row.match(/\{\{dts\|(\d{4})\|(\d{1,2})\|(\d{1,2})\}\}/);
  if (!name || !party || !began) throw new Error(`${s.name}: the governor's name, party or term start was not read`);
  out[s.id].governor = { name, party: partyName(party[1]), since: `${began[1]}-${began[2].padStart(2, "0")}-${began[3].padStart(2, "0")}`, termEnds, year: +termEnds.slice(0, 4), nga: nga ? nga[0] : undefined, wiki: sortlink(head) ?? undefined };
  governors++;
}
if (governors !== 50) throw new Error(`read ${governors} governors' terms, not 50`);

// ── Mayors: the fifty largest cities ──
const mayorsText = wikitextOf(MAYORS_PAGE, "mayors.json");
const mayorsTable = mayorsText.slice(mayorsText.indexOf('{|class="wikitable plainrowheaders sortable'));
const mayors = [];
for (const row of mayorsTable.slice(0, mayorsTable.indexOf("\n|}")).split("\n|-")) {
  const name = sortname(row);
  if (!name) continue;
  // The cells after the name: photo, party, city, state, population, rank, start, elections, next election, form, list.
  const cells = row.slice(row.indexOf("}}", row.indexOf("{{sortname")) + 2).split(/\n\|\|?/).slice(1);
  const party = /\{\{party shading\/([^}|]+)/.exec(cells[1] || "");
  const [city, state, population, rank, start, , next, form] = cells.slice(2).map(unlink);
  const began = new Date(`${start} UTC`);
  if (!party || !city || !state || !/^[\d,]+$/.test(population) || !/^\d+$/.test(rank) || Number.isNaN(began.getTime())) throw new Error(`${name}: a mayor's row was not read (${[city, state, population, rank, start].join(" | ")})`);
  mayors.push({
    name,
    party: partyName(party[1]),
    // Most big-city mayors are elected on a nonpartisan ballot; the list marks them, and gives the party they are known by.
    nonpartisan: /efn\s*\|\s*name=NP/.test(cells[1]),
    city,
    state: byName.get(state)?.id ?? null,
    stateName: state,
    population: +population.replace(/,/g, ""),
    rank: +rank,
    since: began.toISOString().slice(0, 10),
    nextElection: +(/\d{4}/.exec(next || "") || [0])[0] || null,
    form: form || null,
    wiki: sortlink(row),
  });
}
if (mayors.length !== 50) throw new Error(`read ${mayors.length} mayors, not 50`);
mayors.sort((a, b) => a.rank - b.rank);

const today = new Date().toISOString().slice(0, 10);
const q = (v) => JSON.stringify(v);
const person = (p, extra) => `{ id: ${q(p.id)}, name: ${q(p.name)}, party: ${q(p.party)}, ${p.caucus ? `caucus: ${q(p.caucus)}, ` : ""}${extra}termEnd: ${q(p.termEnd)}${p.url ? `, url: ${q(p.url)}` : ""} }`;
const row = (s) => {
  const o = out[s.id];
  return `  ${s.id}: {
    senators: [${o.senators.map((p) => person(p, `class: ${p.class}, `)).join(", ")}],
    representatives: [${o.representatives.map((p) => person(p, `district: ${q(p.district)}, `)).join(", ")}],
    governor: { name: ${q(o.governor.name)}, party: ${q(o.governor.party)}, since: ${q(o.governor.since)}, termEnds: ${q(o.governor.termEnds)}, year: ${o.governor.year}${o.governor.nga ? `, nga: ${q(o.governor.nga)}` : ""}${o.governor.wiki ? `, wiki: ${q(o.governor.wiki)}` : ""} },
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
 * ends in the congress-legislators data; a governor's name, party, the day the
 * term began and the year it ends are as Wikipedia's list of current governors
 * gives them, which it cites to the National Governors Association. The mayors
 * are those of the fifty largest cities, as Wikipedia's list of them gives
 * each. Election days are not stored: they follow from federal law
 * (lib/usCivicDates.ts). There is no published calendar of town halls or of
 * officials' public events, and none is made up: the window links to each
 * office's own site.
 */
export const STATE_OFFICES_SOURCES = {
  congress: { label: "congress-legislators (current members' terms and sites)", url: "https://github.com/unitedstates/congress-legislators" },
  governors: { label: "Wikipedia — List of current United States governors (term ends, citing the National Governors Association)", url: "https://en.wikipedia.org/wiki/${GOVERNORS_PAGE.replace(/ /g, "_")}" },
  mayors: { label: "Wikipedia — List of mayors of the 50 largest cities in the United States", url: "https://en.wikipedia.org/wiki/${MAYORS_PAGE.replace(/ /g, "_")}" },
  retrieved: "${today}",
};

export type OfficeHolder = {
  /** The member's id in the Biographical Directory of the United States Congress: what officialProfiles.ts is keyed by. */
  id: string;
  name: string;
  party: string;
  /** The party a member of neither sits with, where the data names one. */
  caucus?: string;
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
  /** The governor, the day the term began, its end as the list gives it ("2027 (term limits)"), its year, the NGA's page for the governor, and the Wikipedia article the list links the name to. */
  governor: { name: string; party: string; since: string; termEnds: string; year: number; nga?: string; wiki?: string };
};

/** The mayor of one of the fifty largest cities. */
export type BigCityMayor = {
  name: string;
  /** The party the list gives. Where the office is nonpartisan in law (the flag below), this is the party the mayor is known by. */
  party: string;
  nonpartisan: boolean;
  city: string;
  /** The state's id, or null for a city in none of the fifty (Washington, D.C.). */
  state: string | null;
  stateName: string;
  /** The Census Bureau's estimate the list ranks the cities by. */
  population: number;
  rank: number;
  /** The day the mayor took office. */
  since: string;
  /** The year of the next election for the office, where the list gives one. */
  nextElection: number | null;
  /** The city's form of government, as the list names it. */
  form: string | null;
  /** The Wikipedia article the list links the mayor's name to. */
  wiki: string | null;
};

/** State id → its offices. */
export const STATE_OFFICES: Record<string, StateOffices> = {
${states.map(row).join("\n")}
};

/** The mayors of the fifty largest cities, largest city first. */
export const BIG_CITY_MAYORS: BigCityMayor[] = [
${mayors.map((m) => `  ${q(m)},`).join("\n")}
];
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: ${senators} senators, ${reps} representatives, ${governors} governors, ${mayors.length} mayors`);
console.log("  mayors:", mayors.slice(0, 4).map((m) => `${m.name} (${m.city}, ${m.party}${m.nonpartisan ? ", nonpartisan office" : ""}, since ${m.since})`).join("; "));
// The state cards name each governor from stateIndicators.ts (Wikidata, build-states.cjs). A governor this list names
// differently is said here, so that the two sources falling out of step is not missed.
const indicators = fs.readFileSync(path.join(__dirname, "src/data/stateIndicators.ts"), "utf8");
const differ = states.flatMap((s) => {
  const at = indicators.indexOf(`\n  ${s.id}: {`);
  const other = at < 0 ? null : /governor:\{name:"([^"]+)"/.exec(indicators.slice(at, at + 40000))?.[1];
  return other && other !== out[s.id].governor.name ? [`${s.name}: stateIndicators.ts has ${other}, the list ${out[s.id].governor.name}`] : [];
});
if (differ.length) console.log("  governors named differently in stateIndicators.ts:\n    " + differ.join("\n    "));
const oh = out.oh;
console.log("  OH:", JSON.stringify({ senators: oh.senators, governor: oh.governor, reps: oh.representatives.length, first: oh.representatives[0] }));
const ends = {};
for (const s of states) for (const p of out[s.id].senators) ends[p.termEnd] = (ends[p.termEnd] || 0) + 1;
console.log("  senators' term ends:", JSON.stringify(ends));
const gov = {};
for (const s of states) gov[out[s.id].governor.termEnds] = (gov[out[s.id].governor.termEnds] || 0) + 1;
console.log("  governors' term ends:", JSON.stringify(gov));
