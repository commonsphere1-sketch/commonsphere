/**
 * Builds src/data/civicCalendar.ts - the local and national dates the calendar can be set to: elections, and city council
 * meetings - so that a reader can set the calendar to a country or a US state and see what is coming there.
 *
 *   Elections   Outside the United States: Wikidata's elections (CC0), read through the QLever endpoint, kept only where the
 *               date is given to the day and its statement cites a page, or names the source it is stated in - an official
 *               gazette, an electoral commission - given then by its own website where Wikidata has one. That source is the
 *               date's first, Wikidata's item the second. A date whose only citation is the Inter-Parliamentary Union's database is left out: that database
 *               is for non-commercial use. In the United States: the general election of 3 November 2026 in every state,
 *               fixed by federal law (2 U.S.C. 7), with what is on its ballot from the bodies' own records - every House seat
 *               (the Constitution), the Senate's Class II seats (the Senate's own list), and the governorships the National
 *               Governors Association lists. Special elections for appointed Senate seats are not in the Senate's list and
 *               are not given.
 *   Councils    The city council and committee meetings US cities publish through Legistar's public web API, from the day of
 *               the build to 75 days on, each with the city's own page for it. A meeting the city marks as cancelled or not
 *               meeting is left out.
 *
 * Nothing is estimated: a date is one a body published.
 *
 *   node build-civic-calendar.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/civicCalendar.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-civic");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
fs.mkdirSync(CACHE, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const tidy = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

function curl(args, name, { maxAge = 6 * 3600e3 } = {}) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < maxAge) return fs.readFileSync(at, "utf8");
  const out = execFileSync("curl", ["-s", "--max-time", "180", "-A", UA, ...args], { maxBuffer: 1 << 28 }).toString();
  fs.writeFileSync(at, out);
  return out;
}

/* ── Elections outside the US: Wikidata ── */
function wikidataElections() {
  const q = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX pr: <http://www.wikidata.org/prop/reference/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT ?e ?name ?anyName ?date ?prec ?cc ?sub ?ref WHERE {
  ?e wdt:P31/wdt:P279* wd:Q40231 .
  ?e p:P585 ?st . ?st psv:P585 ?dv . ?dv wikibase:timeValue ?date ; wikibase:timePrecision ?prec .
  FILTER(?date >= "${today}T00:00:00Z"^^xsd:dateTime && ?date < "${Number(today.slice(0, 4)) + 2}-01-01T00:00:00Z"^^xsd:dateTime)
  ?e wdt:P17 ?country . ?country wdt:P297 ?cc .
  OPTIONAL { ?e wdt:P1001 ?jur . ?jur wdt:P300 ?sub }
  OPTIONAL { ?st prov:wasDerivedFrom ?r . ?r pr:P854 ?ref }
  OPTIONAL { ?e rdfs:label ?name . FILTER(LANG(?name) = "en") }
  OPTIONAL { ?e rdfs:label ?anyName }
}`;
  // The endpoint now and then answers with an error instead of results (out of memory, a timeout): such an answer is thrown
  // away and the query tried once more; failing again, the last good answer cached is used - the dates are still filtered
  // from today, so nothing past is shown.
  const ask = () => curl(["-H", "Accept: application/sparql-results+json", "--data-urlencode", "query=" + q, "https://qlever.dev/api/wikidata"], `elections-${today}.json`);
  const parse = (raw) => {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j?.results?.bindings) ? j.results.bindings : null;
    } catch {
      return null;
    }
  };
  let rows = parse(ask());
  if (!rows) {
    fs.rmSync(path.join(CACHE, `elections-${today}.json`), { force: true });
    rows = parse(ask());
  }
  if (!rows) {
    fs.rmSync(path.join(CACHE, `elections-${today}.json`), { force: true });
    const earlier = fs.readdirSync(CACHE).filter((f) => /^elections-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
    for (const f of earlier) {
      rows = parse(fs.readFileSync(path.join(CACHE, f), "utf8"));
      if (rows) {
        console.log(`the endpoint failed today; using its answer of ${f.slice(10, 20)}`);
        break;
      }
    }
  }
  if (!rows) throw new Error("no answer from the Wikidata endpoint, today or cached");
  const by = new Map();
  for (const r of rows) {
    const id = r.e.value.split("/").pop();
    const o = by.get(id) || { id, name: "", other: "", date: r.date.value.slice(0, 10), prec: +r.prec.value, cc: r.cc.value, subs: new Set(), refs: new Set(), stated: new Map() };
    if (r.name && !o.name) o.name = tidy(r.name.value);
    if (r.anyName && !o.other) o.other = tidy(r.anyName.value);
    if (r.sub) o.subs.add(r.sub.value);
    if (r.ref) o.refs.add(r.ref.value);
    by.set(id, o);
  }
  // The sources each date is stated in, asked for apart - in the one query with the rest it runs past the endpoint's time - each
  // by its own website where Wikidata gives one; never the IPU's database (non-commercial) or Wikipedia.
  const qs = `${q.slice(0, q.indexOf("SELECT"))}SELECT DISTINCT ?e ?si ?siName ?siUrl WHERE {
  ?e wdt:P31/wdt:P279* wd:Q40231 .
  ?e p:P585 ?st . ?st psv:P585 ?dv . ?dv wikibase:timeValue ?date ; wikibase:timePrecision ?prec .
  FILTER(?prec >= 11 && ?date >= "${today}T00:00:00Z"^^xsd:dateTime && ?date < "${Number(today.slice(0, 4)) + 2}-01-01T00:00:00Z"^^xsd:dateTime)
  ?st prov:wasDerivedFrom ?r2 . ?r2 pr:P248 ?si .
  OPTIONAL { ?si rdfs:label ?siName . FILTER(LANG(?siName) = "en") }
  OPTIONAL { ?si wdt:P856 ?siUrl }
}`;
  let stated = parse(curl(["-H", "Accept: application/sparql-results+json", "--data-urlencode", "query=" + qs, "https://qlever.dev/api/wikidata"], `elections-stated-${today}.json`));
  if (!stated) {
    fs.rmSync(path.join(CACHE, `elections-stated-${today}.json`), { force: true });
    stated = parse(curl(["-H", "Accept: application/sparql-results+json", "--data-urlencode", "query=" + qs, "https://qlever.dev/api/wikidata"], `elections-stated-${today}.json`));
  }
  if (!stated) {
    fs.rmSync(path.join(CACHE, `elections-stated-${today}.json`), { force: true });
    console.log("  the sources dates are stated in could not be read today: only dates citing a page are kept");
  }
  for (const r of stated ?? []) {
    const o = by.get(r.e.value.split("/").pop());
    if (!o || !r.siName || /inter-parliamentary|parline|wikipedia/i.test(r.siName.value) || /ipu\.org/.test(r.siUrl?.value ?? "")) continue;
    o.stated.set(r.si.value, { name: tidy(r.siName.value), url: r.siUrl?.value ?? "", qid: r.si.value.split("/").pop() });
  }
  return [...by.values()]
    .filter((o) => o.cc !== "US" && o.prec >= 11 && o.date >= today)
    .map((o) => ({ ...o, refs: [...o.refs].filter((u) => !/(^|\.)ipu\.org\//.test(u.replace(/^https?:\/\//, ""))) }))
    .filter((o) => (o.refs.length || o.stated.size) && (o.name || o.other))
    .map((o) => {
      const host = (u) => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
      const subs = [...o.subs];
      return {
        id: `wd-${o.id}`,
        date: o.date,
        // The record's own name, its first letter capitalised ("next Palestinian ..." reads as a heading).
        name: ((n) => n.charAt(0).toUpperCase() + n.slice(1))(o.name || o.other),
        cc: o.cc,
        region: subs.length === 1 ? subs[0] : "",
        level: subs.length === 1 ? "Regional" : "National",
        sources: [
          ...o.refs.slice(0, 2).map((u) => ({ label: `${host(u)} - the page Wikidata cites for the date`, url: u })),
          ...[...o.stated.values()].slice(0, 2).map((s) => ({ label: `${s.name} - the source Wikidata cites for the date`, url: s.url || `https://www.wikidata.org/wiki/${s.qid}` })),
          { label: `Wikidata - ${o.id} (CC0)`, url: `https://www.wikidata.org/wiki/${o.id}` },
        ],
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/* ── The US general election of 3 November 2026 ── */
const STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
// The Senate's Class II seats, whose terms end on 3 January 2027 (senate.gov, Class II), and the governorships the NGA lists for 3 November 2026.
const SENATE_2026 = ["Alabama", "Alaska", "Arkansas", "Colorado", "Delaware", "Georgia", "Idaho", "Illinois", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Montana", "Nebraska", "New Hampshire", "New Jersey", "New Mexico", "North Carolina", "Oklahoma", "Oregon", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Virginia", "West Virginia", "Wyoming"];
const GOVERNOR_2026 = ["Alaska", "Alabama", "Arizona", "Arkansas", "California", "Colorado", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Iowa", "Kansas", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Nebraska", "Connecticut", "Nevada", "New Hampshire", "New Mexico", "New York", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Vermont", "Wisconsin", "Wyoming"];
const US_SOURCES = {
  law: { label: "2 U.S.C. 7 - the day of the general election (US Code, Office of the Law Revision Counsel)", url: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title2-section7&num=0&edition=prelim" },
  senate: { label: "US Senate - Class II senators, whose terms end 3 January 2027", url: "https://www.senate.gov/senators/Class_II.htm" },
  nga: { label: "National Governors Association - 2026 gubernatorial elections", url: "https://www.nga.org/governors/elections/" },
};
function usElections() {
  if (SENATE_2026.length !== 33 || GOVERNOR_2026.length !== 36) throw new Error("the Senate or governor list is not the records' count");
  const date = "2026-11-03";
  if (date < today) return [];
  return Object.entries(STATES).map(([ab, name]) => {
    const ballot = ["every US House seat", SENATE_2026.includes(name) ? "a US Senate seat" : "", GOVERNOR_2026.includes(name) ? "the governorship" : ""].filter(Boolean);
    return {
      id: `us-general-2026-${ab}`,
      date,
      name: `General election in ${name}`,
      cc: "US",
      region: `US-${ab}`,
      level: "Regional",
      what: `On the ballot, among state and local offices: ${ballot.join(", ")}.`,
      sources: [US_SOURCES.law, ...(SENATE_2026.includes(name) ? [US_SOURCES.senate] : []), ...(GOVERNOR_2026.includes(name) ? [US_SOURCES.nga] : [])],
    };
  });
}

/* ── City councils: Legistar ── */
const CITIES = [
  ["seattle", "Seattle", "WA"], ["denver", "Denver", "CO"], ["boston", "Boston", "MA"], ["phoenix", "Phoenix", "AZ"], ["cityofdallas", "Dallas", "TX"],
  ["sanjose", "San José", "CA"], ["columbus", "Columbus", "OH"], ["jaxcityc", "Jacksonville", "FL"], ["nashville", "Nashville", "TN"], ["milwaukee", "Milwaukee", "WI"],
  ["fresno", "Fresno", "CA"], ["sacramento", "Sacramento", "CA"], ["kansascity", "Kansas City", "MO"], ["mesa", "Mesa", "AZ"], ["oakland", "Oakland", "CA"],
  ["pittsburgh", "Pittsburgh", "PA"], ["madison", "Madison", "WI"], ["baltimore", "Baltimore", "MD"],
];
function councils() {
  const end = new Date(Date.now() + 75 * 86400e3).toISOString().slice(0, 10);
  const out = [];
  const read = [];
  for (const [client, city, st] of CITIES) {
    let list;
    try {
      const url = `https://webapi.legistar.com/v1/${client}/events?$filter=EventDate+ge+datetime'${today}'+and+EventDate+lt+datetime'${end}'&$orderby=EventDate&$top=500`;
      list = JSON.parse(curl([url], `legistar-${client}-${today}.json`));
    } catch {
      continue;
    }
    if (!Array.isArray(list)) continue;
    let n = 0;
    for (const e of list) {
      const comment = tidy(e.EventComment);
      if (/cancel|not meeting|postpon|rescheduled/i.test(comment) || /cancel/i.test(e.EventAgendaStatusName || "")) continue;
      const date = String(e.EventDate || "").slice(0, 10);
      if (!date || date < today) continue;
      out.push({
        id: `lg-${client}-${e.EventId}`,
        date,
        time: tidy(e.EventTime),
        body: tidy(e.EventBodyName),
        city,
        region: `US-${st}`,
        location: tidy(e.EventLocation).slice(0, 140),
        url: e.EventInSiteURL || `https://${client}.legistar.com/Calendar.aspx`,
      });
      n++;
    }
    if (n) read.push([city, st, client, n]);
  }
  return { meetings: out.sort((a, b) => a.date.localeCompare(b.date) || a.city.localeCompare(b.city)), read };
}

const W = wikidataElections();
const U = usElections();
const C = councils();
const J = (x) => JSON.stringify(x);
fs.writeFileSync(
  OUT,
  `/**
 * The local and national dates the calendar can be set to: elections, and city council meetings.
 *
 * GENERATED by build-civic-calendar.cjs on ${today} - do not edit by hand; change the script and re-run it.
 *
 * Elections outside the United States are Wikidata's, kept only where the date is given to the day and cites a page or names the
 * source it is stated in, which is listed first; a date cited only to the Inter-Parliamentary Union's database is left out. US elections are the general election
 * of 3 November 2026 in every state, with what is on its ballot from the Senate's and the National Governors Association's own
 * records; special elections for appointed Senate seats are not given. Council meetings are those the cities listed in
 * Legistar on ${today}, to 75 days on; cities move and cancel meetings, and the city's own page is the record.
 */
export const CIVIC_RETRIEVED = "${today}";
export type CivicSource = { label: string; url: string };
/** An election: its day, its name, its country (ISO2) and, where it is a region's, the region's ISO 3166-2 code. */
export interface CivicElection { id: string; date: string; name: string; cc: string; region: string; level: "National" | "Regional"; what?: string; sources: CivicSource[] }
/** A city council or committee meeting, as the city's calendar lists it. */
export interface CouncilMeeting { id: string; date: string; time: string; body: string; city: string; region: string; location: string; url: string }

export const CIVIC_ELECTIONS: CivicElection[] = ${J([...U, ...W].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)))};

/** The cities whose meetings are read: [city, state, Legistar client, meetings]. */
export const COUNCIL_CITIES: [city: string, state: string, client: string, meetings: number][] = ${J(C.read)};
export const COUNCIL_MEETINGS: CouncilMeeting[] = ${J(C.meetings)};
export const COUNCIL_SOURCE: CivicSource = { label: "Each city's council calendar, through Legistar's public web API (Granicus)", url: "https://webapi.legistar.com/Help" };
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: ${U.length} US and ${W.length} other elections, ${C.meetings.length} meetings in ${C.read.length} cities`);
console.log(W.map((e) => `${e.date} ${e.cc} ${e.region} ${e.name}`).join("\n"));
console.log(J(C.read));
