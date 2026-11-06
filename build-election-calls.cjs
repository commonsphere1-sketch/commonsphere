#!/usr/bin/env node
/**
 * Builds static/elections/2026-calls.json - the races of the 2026 midterms called by news organisations, as asked, from
 * Wikipedia (CC BY-SA 4.0), whose election articles mark a race's winner as news organisations call it, citing them.
 *
 * Wikipedia is never taken alone: a call is kept only where two of its records agree - the national article's race
 * summary (the winner marked, and whether the seat was held or gained) and the race's own article (its infobox's winner,
 * for the Senate and governors; for the House, the winner of the general election in the district's section of the
 * state's article). A race whose two records differ, or where only one has a winner, is not called here, and is listed.
 * Each article's revision is kept, so every call can be read as it was.
 *
 * A call is not a count: the states' own counts (build-election-2026.cjs) stand beside it, unofficial until certified.
 *
 *   node build-election-calls.cjs
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "static/elections/2026-calls.json");
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
// The time stamped on the calls, by a server's clock: this computer's can be set wrong.
const { syncClock, nowIso } = require("./build-clock.cjs");
const API = "https://en.wikipedia.org/w/api.php";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** An article's wikitext and revision, one read at a time. */
async function article(title, section) {
  await sleep(150);
  const url = `${API}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|revid&format=json&formatversion=2&redirects=1${section !== undefined ? `&section=${section}` : ""}`;
  // A dropped connection is tried again, three times, a little longer apart each time.
  let r;
  for (let attempt = 0; ; attempt++) {
    try {
      r = await fetch(url, { headers: { "User-Agent": UA } });
      break;
    } catch (e) {
      if (attempt >= 3) throw e;
      await sleep(2000 * (attempt + 1));
    }
  }
  if (!r.ok) throw new Error(`${title}: ${r.status}`);
  const j = await r.json();
  if (j.error) return null;
  return { text: j.parse.wikitext, rev: j.parse.revid, title: j.parse.title };
}

const STATES = Object.fromEntries(
  [...fs.readFileSync(path.join(__dirname, "src/data/statesData.ts"), "utf8").matchAll(/name:\s*"([^"]+)",\s*abbreviation:\s*"([A-Z]{2})"/g)].map((m) => [m[1], m[2]]),
);
/** A party by its family: a state's Democratic party and Minnesota's Democratic-Farmer-Labor are D, a Republican one R. */
const partyOf = (s) => {
  const p = String(s ?? "").replace(/\[\[|\]\]/g, "").replace(/\|.*$/, "").replace(/ Party.*$/, "").replace(/ \(United States\)$/, "").trim();
  return /Democrat|DFL/i.test(p) ? "D" : /Republican|GOP/i.test(p) ? "R" : p;
};
/** A template's named parameters, inline or one to a line: pipes inside links and templates are not splits. */
function params(tpl) {
  const out = {};
  let depth = 0;
  let cur = "";
  const parts = [];
  for (let i = 0; i < tpl.length; i++) {
    const two = tpl.slice(i, i + 2);
    if (two === "[[" || two === "{{") {
      depth++;
      cur += two;
      i++;
    } else if (two === "]]" || two === "}}") {
      depth--;
      cur += two;
      i++;
    } else if (tpl[i] === "|" && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += tpl[i];
  }
  parts.push(cur);
  for (const p of parts.slice(1)) {
    const m = p.match(/^\s*([a-z_0-9]+)\s*=([\s\S]*)$/i);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}
/** Each template of a name in some text, with its body, braces balanced. */
function templates(text, name) {
  const out = [];
  const re = new RegExp(`\\{\\{\\s*${name}`, "gi");
  let m;
  while ((m = re.exec(text))) {
    let depth = 0;
    let i = m.index;
    for (; i < text.length; i++) {
      if (text.startsWith("{{", i)) {
        depth++;
        i++;
      } else if (text.startsWith("}}", i)) {
        depth--;
        i++;
        if (!depth) break;
      }
    }
    out.push(text.slice(m.index + 2, i - 1));
  }
  return out;
}
/** A name as a link or bold text shows it: the display text of a link, with no markup. */
const shown = (s) =>
  String(s ?? "")
    .replace(/'''/g, "")
    .replace(/\{\{nowrap\|([^}]*)\}\}/gi, "$1")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\(incumbent\)/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
/** A name's surname: the last word, a suffix (Jr., III) and middle initials set aside. */
const surname = (s) => fold(s).split(" ").filter((w) => w.length > 1 && !/^(jr|sr|ii|iii|iv|v)$/.test(w)).pop() ?? "";
/** Two records name the same person: the same name, or the same surname. */
const same = (a, b) => fold(a) === fold(b) || (surname(a) !== "" && surname(a) === surname(b));

/** A national article's marked winner in a row: the line with the tick, its name and party. */
function markedWinner(row) {
  const line = row.split("\n").find((l) => /\{\{aye\}\}/i.test(l));
  if (!line) return null;
  // The winner's name and party, and since the count came in, the share of the vote after them ("(Democratic) 54.3%").
  const m = line.match(/\{\{aye\}\}\s*(.+?)\s*\(([^)]+)\)\s*(?:[\d.,]+\s*%)?\s*$/);
  return m ? { name: shown(m[1]), party: partyOf(m[2]) } : null;
}
const statusOf = (row) => {
  const m = row.match(/(Republican|Democratic|Independent)\s+(hold|gain)/i);
  return m ? `${m[1]} ${m[2].toLowerCase()}` : null;
};

const result = { builtAt: "", revisions: {}, senate: {}, governor: {}, house: {}, unagreed: [], uncalled: { senate: 0, governor: 0, house: 0 } };
const disagree = (office, where, a, b) => result.unagreed.push({ office, where, national: a, race: b });

/** A race article's infobox winner: after_election and after_party. */
async function infoboxWinner(title) {
  const a = await article(title, 0);
  if (!a) return null;
  result.revisions[a.title] = a.rev;
  const box = templates(a.text, "Infobox election")[0];
  const p = box ? params(box) : {};
  return p.after_election && shown(p.after_election) ? { name: shown(p.after_election), party: partyOf(p.after_party) } : null;
}

async function statewide(office, page) {
  const nat = await article(page);
  result.revisions[nat.title] = nat.rev;
  const rows = nat.text.split(/\n\|-/).filter((r) => /Party stripe/i.test(r) && /^\s*!\s*\[\[/m.test(r));
  for (const row of rows) {
    const link = row.match(/^\s*!\s*\[\[([^|\]]+)\|([^\]]+)\]\]/m);
    if (!link) continue;
    const stateName = link[2].replace(/\s*\(.*\)\s*$/, "").trim();
    const st = STATES[stateName];
    if (!st) continue;
    const special = /special/i.test(link[1]);
    const w = markedWinner(row);
    if (!w) {
      result.uncalled[office]++;
      continue;
    }
    const second = await infoboxWinner(link[1]);
    if (!second || !same(w.name, second.name) || w.party !== second.party) {
      disagree(office, `${st}${special ? " (special)" : ""}`, w, second);
      continue;
    }
    result[office][st] = { winner: w.name, party: w.party, status: statusOf(row), special, article: link[1] };
  }
}

/** A state's House article: each district's general-election winner. */
async function stateHouse(stateName) {
  const a = await article(`2026 United States House of Representatives elections in ${stateName}`);
  if (!a) return null;
  result.revisions[a.title] = a.rev;
  const out = {};
  // Each district's section, at whatever level it is headed, then the general election's results box in it and its winner.
  const parts = a.text.split(/\n=+\s*(?:\[\[[^|\]]*\|)?(?:District\s*(\d+)|At[- ]large(?: district)?)(?:\]\])?\s*=+\s*\n/i);
  for (let i = 1; i < parts.length; i += 2) {
    const district = parts[i] ? +parts[i] : 1;
    const body = parts[i + 1];
    for (const chunk of body.split(/(?=\{\{\s*Election box begin)/i).slice(1)) {
      const begin = templates(chunk, "Election box begin")[0];
      const title = begin ? params(begin).title ?? "" : "";
      // The general election's box: titled so, or for the district's election ("2026 Arizona's 9th congressional district
      // election") - any box that is not a primary's, a runoff's or a convention's.
      if (/primary|runoff|convention|caucus/i.test(title) || !/general|election/i.test(title)) continue;
      const end = chunk.search(/\{\{\s*Election box end/i);
      const win = templates(end > 0 ? chunk.slice(0, end) : chunk, "Election box winning candidate")[0];
      if (win) {
        const p = params(win);
        out[district] = { name: shown(p.candidate), party: partyOf(p.party) };
      }
    }
  }
  return out;
}

/** Where the state's own count is held (build-election-2026.cjs) and every precinct is in: the district's leader. */
const COUNTS = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "static/elections/2026.json"), "utf8")).states;
  } catch {
    return {};
  }
})();
function countLeader(st, district) {
  const c = COUNTS[st]?.contests.find((x) => x.office === "house" && x.district === district);
  if (!c || !c.reporting || c.reporting[0] < c.reporting[1] || !c.cands[0]?.[2]) return null;
  return { name: c.cands[0][0], party: c.cands[0][1], fromCount: true };
}

async function house() {
  const nat = await article("2026 United States House of Representatives elections");
  result.revisions[nat.title] = nat.rev;
  const rows = nat.text.split(/\n\|-/).filter((r) => /\{\{ushr\|[A-Z]{2}\|/i.test(r) && /Party stripe/i.test(r));
  const byState = new Map();
  for (const row of rows) {
    const m = row.match(/\{\{ushr\|([A-Z]{2})\|(\d+|AL)/i);
    if (!m) continue;
    const st = m[1].toUpperCase();
    const district = /AL/i.test(m[2]) ? 1 : +m[2];
    const w = markedWinner(row);
    if (!w) {
      result.uncalled.house++;
      continue;
    }
    if (!byState.has(st)) byState.set(st, []);
    byState.get(st).push({ district, w, status: statusOf(row) });
  }
  const NAME = Object.fromEntries(Object.entries(STATES).map(([n, c]) => [c, n]));
  for (const [st, list] of byState) {
    const second = NAME[st] ? await stateHouse(NAME[st]) : null;
    for (const { district, w, status } of list) {
      const s = second?.[district] ?? countLeader(st, district);
      if (!s || !same(w.name, s.name) || w.party !== s.party) {
        disagree("house", `${st}-${district}`, w, s ?? null);
        continue;
      }
      (result.house[st] ??= {})[district] = { winner: w.name, party: w.party, status };
    }
  }
}

async function main() {
  await syncClock();
  result.builtAt = nowIso();
  await statewide("senate", "2026 United States Senate elections");
  await statewide("governor", "2026 United States gubernatorial elections");
  await house();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result));
  const n = (o) => Object.values(o).reduce((a, x) => a + (typeof x.winner === "string" ? 1 : Object.keys(x).length), 0);
  console.log(`called, both records agreeing: Senate ${Object.keys(result.senate).length}, governors ${Object.keys(result.governor).length}, House ${n(result.house)}; not yet called on Wikipedia: ${JSON.stringify(result.uncalled)}; records disagreeing or one missing: ${result.unagreed.length}`);
  for (const u of result.unagreed.slice(0, 25)) console.log(`  ${u.office} ${u.where}: national ${u.national?.name} (${u.national?.party}) · race ${u.race ? `${u.race.name} (${u.race.party})` : "none"}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
