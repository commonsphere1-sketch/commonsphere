#!/usr/bin/env node
/**
 * Natural disasters, country by country, as asked: every event the Global Disaster Alert and Coordination System (GDACS,
 * of the United Nations and the European Commission) has raised an orange or a red alert for - its judgement that the
 * event may need, or does need, international help - each year since 2000, for each country it names as struck:
 * earthquakes, tropical cyclones, floods, droughts, volcanic eruptions and wildfires. A green alert (little expected
 * impact) is not taken: there are thousands a year.
 *
 *   static/climate/history/<CC>.json   each year's alerts, by kind, and the strongest alerted earthquake's magnitude
 *   static/climate/disasters/<CC>.json each event, newest first: its date, kind, name, alert and scale in GDACS's words
 *
 * The counts are of GDACS's alerts, not of every disaster, and an alert is GDACS's own judgement of what help may be
 * needed; nothing is worked out here but the counting.
 *
 *   node build-climate-disasters.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { mergeCountry, seriesOf, writeIndex } = require("./place-history-lib.cjs");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-disasters");
fs.mkdirSync(CACHE, { recursive: true });
const API = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";
const FIRST = 2000;
const KINDS = { EQ: ["quakeAlerts", "Earthquake"], TC: ["cycloneAlerts", "Tropical cyclone"], FL: ["floodAlerts", "Flood"], DR: ["droughtAlerts", "Drought"], VO: ["volcanoAlerts", "Volcanic eruption"], WF: ["fireAlerts", "Wildfire"] };

async function page(year, n) {
  const at = path.join(CACHE, `${year}-${n}.json`);
  if (fs.existsSync(at) && year < new Date().getFullYear()) return JSON.parse(fs.readFileSync(at, "utf8"));
  const url = `${API}?eventlist=EQ;TC;FL;VO;DR;WF&alertlevel=Orange;Red&fromDate=${year}-01-01&toDate=${year}-12-31&pagesize=100&pagenumber=${n}`;
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    // GDACS answers a page past the last with no content.
    if (res.status === 204 || res.status === 404) return { features: [] };
    if (res.ok) {
      const text = await res.text();
      const j = text ? JSON.parse(text) : { features: [] };
      fs.writeFileSync(at, JSON.stringify(j));
      return j;
    }
    if (i >= 2) throw new Error(`${url}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

(async () => {
  const today = new Date(execFileSync("curl", ["-sI", "--max-time", "60", "https://api.worldbank.org/v2/country"]).toString().match(/^date:\s*(.+)$/im)[1]);
  const last = today.getUTCFullYear();
  const events = new Map(); // type-id -> event
  for (let y = FIRST; y <= last; y++) {
    for (let n = 1; ; n++) {
      const j = await page(y, n);
      const fs_ = j.features ?? [];
      for (const f of fs_) {
        const p = f.properties;
        const key = `${p.eventtype}-${p.eventid}`;
        const was = events.get(key);
        // An event's episodes come as one: keep its highest alert, its widest dates.
        const level = { Red: 2, Orange: 1 }[p.alertlevel] ?? 0;
        if (!was || level > was.level) events.set(key, { type: p.eventtype, id: p.eventid, name: p.name, from: p.fromdate?.slice(0, 10), to: p.todate?.slice(0, 10), alert: p.alertlevel, level, severity: p.severitydata?.severitytext ?? "", magnitude: p.eventtype === "EQ" ? p.severitydata?.severity : undefined, countries: (p.affectedcountries ?? []).map((c) => c.iso2).filter(Boolean), url: p.url?.report });
      }
      process.stdout.write(`${y}:${n} `);
      if (fs_.length < 100) break;
    }
  }
  console.log(`\n${events.size} orange and red events`);

  // By country: each year's alerts by kind, the strongest alerted earthquake, and the events themselves.
  const by = {};
  for (const e of events.values()) {
    if (!KINDS[e.type] || !e.from) continue;
    const y = +e.from.slice(0, 4);
    for (const cc of new Set(e.countries)) {
      const at = (by[cc] ||= { years: {}, quake: {}, list: [] });
      const row = (at.years[y] ||= Object.fromEntries(Object.values(KINDS).map(([k]) => [k, 0])));
      row[KINDS[e.type][0]]++;
      if (e.type === "EQ" && typeof e.magnitude === "number") at.quake[y] = Math.max(at.quake[y] ?? 0, e.magnitude);
      at.list.push({ date: e.from, to: e.to !== e.from ? e.to : undefined, kind: KINDS[e.type][1], name: e.name, alert: e.alert, scale: e.severity, url: e.url });
    }
  }
  const DEFS = {
    ...Object.fromEntries(Object.values(KINDS).map(([k, label]) => [k, { label: `${label}s`.replace("Floods", "Floods").replace("Droughts", "Droughts"), unit: "count", say: `${label.toLowerCase()}s GDACS raised an orange or red alert for in the year` }])),
    strongestQuake: { label: "Strongest alerted earthquake", unit: "magnitude", say: "the magnitude of the strongest earthquake GDACS raised an orange or red alert for in the year" },
  };
  const source = {
    label: "GDACS - Global Disaster Alert and Coordination System (UN and European Commission)",
    url: "https://www.gdacs.org/",
    note: "Counts of the events GDACS raised an orange or red alert for - its judgement that international help may be, or is, needed - not of every disaster; an event striking several countries is counted in each.",
  };
  fs.mkdirSync(path.join(__dirname, "static/climate/disasters"), { recursive: true });
  let n = 0;
  for (const [cc, at] of Object.entries(by)) {
    // Years with no alert are noughts, not gaps: GDACS's record runs every year from 2000.
    const series = {};
    for (const [k] of Object.values(KINDS)) {
      const byYear = {};
      for (let y = FIRST; y <= last; y++) byYear[y] = at.years[y]?.[k] ?? 0;
      if (Object.values(byYear).some((v) => v > 0)) series[k] = seriesOf(byYear);
    }
    if (Object.keys(at.quake).length) series.strongestQuake = seriesOf(at.quake);
    const file = path.join(__dirname, "static/climate/history", `${cc}.json`);
    if (!fs.existsSync(file)) continue; // a country the climate history does not hold
    const name = JSON.parse(fs.readFileSync(file, "utf8")).places.find((p) => p.kind === "country")?.name ?? cc;
    mergeCountry("climate", cc, { source, sourceId: "gdacs", defs: DEFS, places: [{ id: cc, name, kind: "country", series }] });
    at.list.sort((a, b) => b.date.localeCompare(a.date));
    fs.writeFileSync(path.join(__dirname, "static/climate/disasters", `${cc}.json`), JSON.stringify({ cc, source: { label: source.label, url: source.url }, events: at.list }));
    n++;
  }
  writeIndex("climate");
  const jp = by.JP;
  console.log(`disasters: ${n} countries; Japan ${jp?.list.length} events, strongest quake 2024 ${jp?.quake[2024]}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
