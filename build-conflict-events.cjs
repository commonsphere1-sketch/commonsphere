#!/usr/bin/env node
/**
 * Builds static/geo/conflicts.json and src/data/conflictEventsMeta.ts - the armed conflicts of the latest month, each fatal event
 * where it happened, for the World Maps page's Conflicts layer, as asked: the conflicts going on now, inside countries and
 * between them, pinned on the map.
 *
 *   UCDP Candidate Events Dataset (Uppsala Conflict Data Program; Hegre et al. 2020), CC BY 4.0: every event of organised
 *   violence in which at least one person was killed, released each month, not more than a month behind. Its events are
 *   candidates - UCDP may still revise, add or drop them before its yearly dataset - and each carries UCDP's own flag where a
 *   detail is still being checked. The page says so.
 *
 *   Each event is one of UCDP's three kinds of violence; a state-based one is set apart by the UCDP/PRIO Armed Conflict
 *   Dataset's type of conflict (26.1) - between states, or a government against an armed group within a state:
 *     0 between states            state-based, interstate (both sides governments)
 *     1 within a state            state-based, intrastate - a government against an armed group (with or without other
 *                                 states' troops on its side)
 *     2 between armed groups      non-state: neither side a government
 *     3 against civilians         one-sided: a government or an armed group killing civilians
 *   A conflict not yet in the Armed Conflict Dataset (it began this year) is between states if both its sides are governments.
 *
 * Events at the same coordinates are one pin: the deaths summed - UCDP's best estimates; its low and high ones are left out, as
 * in some candidate events they do not bracket the best - and each conflict named. Only UCDP's own coded fields are kept -
 * not the news articles and headlines it cites.
 *
 *   node build-conflict-events.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "static/geo/conflicts.json");
const META = path.join(__dirname, "src/data/conflictEventsMeta.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-conflicts");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";

function get(url, name, maxAgeH = 20) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > maxAgeH * 3600e3)
    execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "300", "-A", UA, "-o", file, url]);
  return file;
}

/** A CSV reader that keeps quoted commas, doubled quotes and line breaks inside a field. */
function csvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* ─── The latest monthly release ─── */
const page = fs.readFileSync(get("https://ucdp.uu.se/downloads/", "downloads.html", 6), "utf8");
const releases = [...page.matchAll(/candidateged\/GEDEvent_v(\d+)_0_(\d+)\.csv/gi)].map((m) => ({ year: +m[1], month: +m[2], url: `https://ucdp.uu.se/downloads/candidateged/${m[0].split("/")[1]}` }));
if (!releases.length) throw new Error("no monthly candidate release found on the UCDP download page");
releases.sort((a, b) => b.year - a.year || b.month - a.month);
const rel = releases[0];
const version = `${rel.year}.0.${rel.month}`;
console.log(`UCDP Candidate Events ${version}: ${rel.url}`);
const csvFile = get(rel.url, `candidate-${version}.csv`, 24 * 7);
const released = execFileSync("curl", ["-s", "-I", "-A", UA, "--max-time", "60", rel.url], { encoding: "utf8" }).match(/last-modified:\s*(.+)/i)?.[1]?.trim();

const [head, ...rows] = csvRows(fs.readFileSync(csvFile, "utf8")).filter((r) => r.length > 1);
const col = Object.fromEntries(head.map((h, i) => [h, i]));
for (const need of ["type_of_violence", "conflict_new_id", "conflict_name", "side_a", "side_b", "latitude", "longitude", "best", "low", "high", "country", "adm_1", "date_start", "date_end", "code_status", "where_prec"])
  if (!(need in col)) throw new Error(`column missing: ${need}`);

/* ─── The Armed Conflict Dataset's type of each state-based conflict ─── */
const acdZip = get("https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-261-csv.zip", "acd-261.zip", 24 * 30);
const acdDir = path.join(CACHE, "acd-261");
if (!fs.existsSync(acdDir)) {
  fs.mkdirSync(acdDir, { recursive: true });
  execFileSync("unzip", ["-o", "-q", acdZip, "-d", acdDir]);
}
const acdCsv = fs.readdirSync(acdDir).find((f) => f.endsWith(".csv"));
const [acdHead, ...acdRows] = csvRows(fs.readFileSync(path.join(acdDir, acdCsv), "utf8")).filter((r) => r.length > 1);
const ac = Object.fromEntries(acdHead.map((h, i) => [h, i]));
const acdType = new Map(); // conflict id -> type of conflict in its latest year (1 extrasystemic, 2 interstate, 3 intrastate, 4 internationalised intrastate)
{
  const latestYear = new Map();
  for (const r of acdRows) {
    const id = r[ac.conflict_id];
    const y = +r[ac.year];
    if (!latestYear.has(id) || y >= latestYear.get(id)) {
      latestYear.set(id, y);
      acdType.set(id, +r[ac.type_of_conflict]);
    }
  }
}

/* ─── Each event, then each place ─── */
const KIND_OF = (r) => {
  const t = +r[col.type_of_violence];
  if (t === 2) return 2;
  if (t === 3) return 3;
  const type = acdType.get(r[col.conflict_new_id]);
  if (type === 2) return 0;
  if (type) return 1;
  return /^Government of /.test(r[col.side_a]) && /^Government of /.test(r[col.side_b]) ? 0 : 1;
};
const FORMER = / \((?:North Yemen|Burma|Soviet Union|Zaire|Kampuchea|Rhodesia|Yugoslavia|Malagasy|Upper Volta|Dahomey|Ceylon)\)/g;
const conflicts = []; // [name, kind]
const conflictAt = new Map();
const places = new Map();
let events = 0;
let unchecked = 0;
const deaths = [0, 0, 0, 0];
const months = new Map();
for (const r of rows) {
  const lat = +r[col.latitude];
  const lon = +r[col.longitude];
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) continue;
  const kind = KIND_OF(r);
  // UCDP names a country with its former name after it - "Yemen (North Yemen)", "Myanmar (Burma)"; the page gives today's alone.
  const name = (r[col.conflict_name] || r[col.dyad_name] || `${r[col.side_a]} - ${r[col.side_b]}`).replace(FORMER, "");
  const country = r[col.country].replace(FORMER, "");
  const ckey = `${kind}|${name}`;
  if (!conflictAt.has(ckey)) {
    conflictAt.set(ckey, conflicts.length);
    conflicts.push([name, kind]);
  }
  const best = +r[col.best] || 0;
  const from = r[col.date_start].slice(0, 10);
  const to = (r[col.date_end] || r[col.date_start]).slice(0, 10);
  months.set(from.slice(0, 7), (months.get(from.slice(0, 7)) ?? 0) + 1);
  const check = r[col.code_status] && r[col.code_status] !== "Clear";
  const key = `${lon.toFixed(4)},${lat.toFixed(4)}`;
  const p =
    places.get(key) ??
    places
      .set(key, { lon, lat, place: [r[col.adm_1], country].filter(Boolean).join(", "), events: 0, best: 0, byKind: [0, 0, 0, 0], conflicts: new Set(), from, to, unchecked: 0, prec: 0 })
      .get(key);
  p.events++;
  p.best += best;
  p.byKind[kind] += best || 0.001;
  p.conflicts.add(conflictAt.get(ckey));
  if (from < p.from) p.from = from;
  if (to > p.to) p.to = to;
  if (check) p.unchecked++;
  p.prec = Math.max(p.prec, +r[col.where_prec] || 0);
  events++;
  deaths[kind] += best;
  if (check) unchecked++;
}
if (events < 500) throw new Error(`only ${events} events read`);
const month = [...months].sort((a, b) => b[1] - a[1])[0][0];
const out = [...places.values()]
  .sort((a, b) => b.best - a.best)
  .map((p) => [
    +p.lon.toFixed(4),
    +p.lat.toFixed(4),
    p.byKind.indexOf(Math.max(...p.byKind)),
    p.events,
    p.best,
    p.place,
    [...p.conflicts],
    p.from,
    p.to,
    p.unchecked,
    p.prec,
  ]);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ version, month, fields: ["lon", "lat", "kind", "events", "best", "place", "conflicts", "from", "to", "unchecked", "precision"], conflicts, rows: out }));

const KINDS = ["between states", "within a state", "between armed groups", "against civilians"];
fs.writeFileSync(
  META,
  `/**
 * The Conflicts layer's release: UCDP Candidate Events ${version} (CC BY 4.0), the fatal events of organised violence in ${month} -
 * ${events.toLocaleString("en")} events at ${out.length.toLocaleString("en")} places; ${KINDS.map((k, i) => `${deaths[i].toLocaleString("en")} killed ${k}`).join(", ")} (UCDP's best estimates).
 * The events themselves are in static/geo/conflicts.json.
 *
 * GENERATED by build-conflict-events.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const CONFLICT_EVENTS_META = ${JSON.stringify({ version, month, released: released ? new Date(released).toISOString().slice(0, 10) : null, events, places: out.length, unchecked, deaths })} as const;
export const CONFLICT_KINDS = ${JSON.stringify(["Between states", "Within a state", "Between armed groups", "Against civilians"])} as const;
export const CONFLICT_SOURCES = [
  { label: "UCDP Candidate Events Dataset ${version} (Uppsala Conflict Data Program, CC BY 4.0)", url: "https://ucdp.uu.se/downloads/#candidate" },
  { label: "UCDP/PRIO Armed Conflict Dataset 26.1, for which conflicts are between states", url: "https://ucdp.uu.se/downloads/#armedconflict" },
  { label: "Hegre et al., 'Introducing the UCDP Candidate Events Dataset', Research & Politics (2020)", url: "https://doi.org/10.1177/2053168020935257" },
];
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: ${events} events at ${out.length} places in ${month} (${[...months].map(([m, n]) => `${m} ${n}`).join(", ")}); deaths ${deaths.join(" / ")}; ${unchecked} still being checked`);
console.log(`  biggest: ${out.slice(0, 6).map((r) => `${r[5]} ${r[4]}`).join("; ")}`);
console.log(`  between states: ${conflicts.filter((c) => c[1] === 0).map((c) => c[0]).join("; ")}`);
