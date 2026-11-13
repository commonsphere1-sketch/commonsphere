#!/usr/bin/env node
/**
 * Builds static/elections/compass.json - every country's latest place on the political compass, for the Dashboard's card,
 * as asked: from the files the Polls & Elections page reads (static/elections/history/<CC>.json), by the same rules as that
 * page's compass (ElectionsPage.tsx: leanSpans, compassPoints - kept in step with them by hand, as this runs in Node):
 *
 *   across  the government's leaning in the year - ParlGov's place for the prime minister's party, left (0) to right (10),
 *           where ParlGov holds the country, each cabinet until the next or until a head of government it is not named
 *           after takes office; after ParlGov's last cabinet, and wherever it does not hold the country, the political
 *           alignment Wikidata records for the head of government's party (or, where none is recorded for a head of
 *           government, the head of state's), its seven steps set evenly from far-left to far-right; a party given more
 *           than one alignment is not placed
 *   down    V-Dem's civil liberties index for the year, 0 to 1, the freest at the foot
 *
 * The government is the one in office at the middle of the year. Each country's latest year with both; a country with no
 * such year is not on the compass.
 *
 *   node build-compass-world.cjs
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DIR = path.join(__dirname, "static/elections/history");
const OUT = path.join(__dirname, "static/elections/compass.json");
const ALIGN = ["far-left", "left-wing", "centre-left", "centrism", "centre-right", "right-wing", "far-right"];
const alignAt = (a) => {
  if (!a || a.includes(",")) return null;
  const i = ALIGN.findIndex((w) => a.toLowerCase().startsWith(w.replace("centrism", "centr")));
  return i < 0 ? null : i;
};
const indexAt = (s, y) => (s && y >= s[0] ? (s[1 + y - s[0]] ?? null) : null);
const dayOf = (d, end = false) => (d.length > 4 ? d : `${d}-${end ? "12-31" : "01-01"}`);
// Today, by a server's clock rather than the machine's, which runs hours fast.
const today = new Date(execFileSync("curl", ["-sI", "--max-time", "60", "https://api.worldbank.org/v2/country"]).toString().match(/^date:\s*(.+)$/im)[1]).toISOString().slice(0, 10);

function leanSpans(data) {
  const leaders = data.leaders ?? [];
  const pg = (data.cabinets ?? []).filter((c) => typeof c.pmLeftRight === "number");
  const govs = leaders.filter((l) => l.role === "government");
  const wd = (l) => {
    const step = alignAt(l.align);
    if (step === null) return null;
    const open = !l.to && Boolean(l.now);
    return { from: dayOf(l.from), to: l.to ? dayOf(l.to, true) : open ? today : dayOf(l.from), open, across: (2 * step) / (ALIGN.length - 1) - 1, who: l.name, lean: `${l.party}: ${l.align}`, source: "Wikidata" };
  };
  if (!pg.length) {
    const role = govs.some((l) => alignAt(l.align) !== null) ? "government" : "state";
    return leaders.filter((l) => l.role === role).flatMap((l) => wd(l) ?? []);
  }
  const surname = (n) => n.trim().split(/\s+/).pop().toLowerCase();
  const out = [];
  let until = "";
  pg.forEach((c, i) => {
    let to = pg[i + 1]?.start ?? today;
    const other = govs.find((l) => dayOf(l.from) > c.start && dayOf(l.from) < to && !c.name.toLowerCase().includes(surname(l.name)));
    if (other) to = dayOf(other.from);
    out.push({ from: c.start, to, open: !pg[i + 1] && !other, across: (2 * c.pmLeftRight) / 10 - 1, who: `${c.name} cabinet`, lean: `${c.pmParty}: ${c.pmLeftRight} on ParlGov's scale, left (0) to right (10)`, source: "ParlGov" });
    until = to;
  });
  if (until < today)
    for (const l of govs) {
      const s = wd(l);
      if (s && s.to > until) out.push({ ...s, from: s.from < until ? until : s.from });
    }
  return out;
}

const rows = [];
for (const f of fs.readdirSync(DIR).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const civ = data.indices?.civ;
  if (!civ) continue;
  const spans = leanSpans(data);
  // The latest year with both, counting back from the last V-Dem scored.
  for (let y = civ[0] + civ.length - 2; y >= civ[0]; y--) {
    const v = indexAt(civ, y);
    if (v == null) continue;
    const mid = `${y}-07-01`;
    const s = [...spans].reverse().find((x) => x.from <= mid && (x.to > mid || (x.open && mid <= today)));
    if (s) {
      rows.push([data.cc, y, Math.round(s.across * 1000) / 1000, v, s.who, s.lean, s.source]);
      break;
    }
  }
}
fs.writeFileSync(OUT, JSON.stringify({ fields: ["cc", "year", "across", "civ", "governing", "leaning", "leaningSource"], today, rows }));
const years = {};
for (const r of rows) years[r[1]] = (years[r[1]] ?? 0) + 1;
console.log(`Compass: ${rows.length} countries; by year ${JSON.stringify(years)}`);
