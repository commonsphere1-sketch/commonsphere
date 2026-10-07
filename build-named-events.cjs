/**
 * Builds src/data/namedEvents.ts — the events behind the Humanitarian page's
 * yearly charts: which disaster killed most in each year, by name, and where
 * most of each year's conflict deaths were.
 *
 * A yearly total says how many died and not in what. EM-DAT, whose totals the
 * disaster chart draws, gives its event records only on registration and for
 * non-commercial use, so they are not used. The names are from records that
 * are open:
 *
 *   Wikipedia, "List of natural   The deadliest natural disaster of each year
 *     disasters by death toll"    (epidemics and famines left out, as the list
 *     (the table by year)         does): its name, kind, where, when, and the
 *                                 death toll as the list gives it - a range
 *                                 where the counts differ. The revision read
 *                                 is recorded. One row a year, or the build
 *                                 stops.
 *   Wikipedia, each event's       For a storm, the damage the article's
 *     article                     infobox gives, where it is a plain figure
 *                                 in US dollars of the year.
 *   NOAA National Centers for     For an earthquake: its magnitude, the damage
 *     Environmental               in dollars, and NOAA's own count of the
 *     Information, Significant    dead, tsunami included - attached only where
 *     Earthquake Database         the database has exactly one earthquake of
 *     (public domain)             1,000 deaths or more in that year in a
 *                                 country the list names. NOAA's count is
 *                                 printed beside the list's, not in its place:
 *                                 two records of the same event rarely agree
 *                                 to the person.
 *   Uppsala Conflict Data         For each year, the three countries in which
 *     Program, via Our World in   most people died in armed conflict - fighting
 *     Data (the table the site's  involving a state, between non-state groups,
 *     other conflict figures      and violence against civilians together,
 *     are built from)             counted where they took place - and the
 *                                 world's total, so each can be read as a
 *                                 share of it.
 *
 * The disaster named for a year is the deadliest single event, not the year's
 * whole toll: EM-DAT's total covers every disaster of the year and is counted
 * by its own rules, so the two are shown side by side and never subtracted.
 *
 *   node build-named-events.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/namedEvents.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-named-events");
fs.mkdirSync(CACHE, { recursive: true });

const FROM = 1990;
const LIST = "List of natural disasters by death toll";
const WIKI = "https://en.wikipedia.org/w/api.php";
const NOAA = `https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes?minYear=${FROM}&minDeaths=1000`;
const UCDP_SLUG = "deaths-in-armed-conflicts-by-type";
const UCDP = `https://ourworldindata.org/grapher/${UCDP_SLUG}.csv?v=1&csvType=full&useColumnShortNames=true`;
/** The table's regions, which are sums of its countries and territories and not places of their own. */
const UCDP_REGIONS = new Set(["Africa", "Americas", "Asia and Oceania", "Europe", "Middle East"]);

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}

/** Wikitext as plain words: notes, references and templates out, a link as its label. */
function plain(cell) {
  let s = cell.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
  for (let before = ""; before !== s; ) {
    before = s;
    s = s.replace(/\{\{[^{}]*\}\}/g, "");
  }
  return s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<[^>]+>/g, "")
    .replace(/'{2,}/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;])/g, "$1")
    .trim();
}

/** The table by year of Wikipedia's list: one row for each year from FROM to the last complete one. */
async function deadliestByYear(lastYear) {
  const j = JSON.parse(await cached("list.json", `${WIKI}?action=parse&page=${encodeURIComponent(LIST)}&prop=wikitext|revid&format=json&formatversion=2`));
  const w = j.parse.wikitext;
  const a = w.indexOf("===20th century===");
  const b = w.indexOf("==Lists of deadliest natural disasters by cause==");
  if (a < 0 || b < a) throw new Error("Wikipedia: the table by year is not where it was");
  const events = [];
  // A kind that holds for the rows below it too (rowspan), and how many of them are left.
  let carried = { kind: "", rows: 0 };
  for (const raw of w.slice(a, b).split(/\n\|-[^\n]*\n/)) {
    const cells = raw
      // The last row of a table runs on into the table's end and whatever follows it.
      .split(/\n\|\}/)[0]
      .trim()
      .replace(/^\|/, "")
      .split(/\n\|/)
      .map((c) => c.trim());
    const year = Number(plain(cells[0] ?? ""));
    if (!Number.isInteger(year) || year < FROM || year > lastYear) continue;
    // Two years running of the same kind share one cell: the second row has no kind of its own and takes the one above.
    let kindCell;
    let whenCell;
    if (cells.length === 6) {
      const span = cells[4].match(/^rowspan\s*=\s*"?(\d+)"?\s*\|\s*([\s\S]*)$/);
      kindCell = span ? span[2] : cells[4];
      whenCell = cells[5];
      carried = { kind: kindCell, rows: span ? Number(span[1]) - 1 : 0 };
    } else if (cells.length === 5 && carried.rows > 0) {
      kindCell = carried.kind;
      whenCell = cells[4];
      carried.rows--;
    } else throw new Error(`Wikipedia: ${year} has ${cells.length} cells`);
    if (/\w+\s*=\s*"/.test([kindCell, cells[1], cells[2], cells[3], whenCell].map(plain).join(" "))) throw new Error(`Wikipedia: ${year} has a cell attribute this build does not read`);
    const article = (cells[2].match(/\[\[([^\]|#]+)/) || [])[1];
    if (!article) throw new Error(`Wikipedia: ${year} names no article`);
    const deaths = plain(cells[1]);
    const counts = (deaths.match(/\d[\d,]*/g) || []).map((n) => Number(n.replace(/,/g, ""))).filter((n) => n > 0);
    if (!counts.length) throw new Error(`Wikipedia: ${year} has no death toll ("${deaths}")`);
    events.push({ year, name: plain(cells[2]), article: article.trim(), kind: plain(kindCell), where: plain(cells[3]), when: plain(whenCell), deaths, low: Math.min(...counts), high: Math.max(...counts) });
  }
  events.sort((x, y) => x.year - y.year);
  for (let y = FROM; y <= lastYear; y++) {
    const n = events.filter((e) => e.year === y).length;
    if (n !== 1) throw new Error(`Wikipedia: ${n} rows for ${y}`);
  }
  return { events, revision: j.parse.revid };
}

/** A storm's damage, where its article's infobox gives a plain figure in dollars. */
async function stormDamage(events) {
  const storms = events.filter((e) => /cyclone|hurricane|typhoon|storm/i.test(e.kind || e.name));
  if (!storms.length) return;
  const url = `${WIKI}?action=query&prop=revisions&rvprop=content&rvslots=main&rvsection=0&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(storms.map((e) => e.article).join("|"))}`;
  const q = JSON.parse(await cached("storms.json", url)).query;
  const goesTo = new Map([...(q.normalized ?? []), ...(q.redirects ?? [])].map((r) => [r.from, r.to]));
  const resolve = (t) => {
    for (let i = 0; i < 4 && goesTo.has(t); i++) t = goesTo.get(t);
    return t;
  };
  for (const e of storms) {
    const page = q.pages.find((p) => p.title === resolve(e.article));
    const text = page?.revisions?.[0]?.slots?.main?.content ?? "";
    if (!/\{\{\s*Infobox weather event/i.test(text)) continue;
    const m = text.match(/^\s*\|\s*damages?\s*=\s*(\d{6,})\s*$/m);
    if (m) Object.assign(e, { damageUsd: Number(m[1]), damageFrom: "Wikipedia" });
  }
}

/** NOAA's record of an earthquake: taken only where one, and one alone, fits the year and a country the list names. */
async function earthquakes(events) {
  const items = JSON.parse(await cached("noaa.json", NOAA)).items;
  if (!Array.isArray(items) || items.length < 20) throw new Error("NOAA: too few earthquakes");
  for (const e of events.filter((x) => /earthquake/i.test(x.kind || x.name))) {
    const places = e.where.toUpperCase().split(/,\s*/);
    const fits = items.filter((q) => q.year === e.year && places.some((p) => q.country.includes(p) || p.includes(q.country)));
    if (fits.length !== 1) continue;
    const q = fits[0];
    if (typeof q.eqMagnitude === "number") e.magnitude = q.eqMagnitude;
    if (typeof q.deathsTotal === "number") e.noaaDeaths = q.deathsTotal;
    if (typeof q.damageMillionsDollarsTotal === "number") Object.assign(e, { damageUsd: Math.round(q.damageMillionsDollarsTotal * 1e6), damageFrom: "NOAA" });
    e.noaaId = q.id;
  }
}

/** Where most died in armed conflict, year by year. */
async function conflictPlaces() {
  const [head, ...lines] = (await cached("ucdp.csv", UCDP)).trim().split(/\r?\n/);
  const cols = head.split(",");
  const k = "number_deaths_ongoing_conflicts__conflict_type_";
  const kinds = ["one_sided_violence", "non_state_conflict", "intrastate", "interstate", "extrasystemic"];
  for (const c of kinds) if (!cols.includes(k + c)) throw new Error(`UCDP: no "${c}" column`);
  const years = new Map();
  for (const l of lines) {
    // No field is quoted except a name with a comma in it, which is the first.
    const f = l.startsWith('"') ? [l.slice(1, l.indexOf('",')), ...l.slice(l.indexOf('",') + 2).split(",")] : l.split(",");
    const r = Object.fromEntries(cols.map((c, i) => [c, f[i]]));
    const year = Number(r.year);
    if (year < FROM) continue;
    const deaths = kinds.reduce((t, c) => t + Math.round(Number(r[k + c]) || 0), 0);
    const y = years.get(year) ?? { year, world: null, places: [] };
    years.set(year, y);
    if (r.code === "OWID_WRL") y.world = deaths;
    else if (!UCDP_REGIONS.has(r.entity)) y.places.push([r.entity, deaths]);
  }
  const out = [...years.values()].sort((a, b) => a.year - b.year);
  for (const y of out) {
    if (y.world === null) throw new Error(`UCDP: no world total for ${y.year}`);
    const sum = y.places.reduce((t, [, d]) => t + d, 0);
    // The countries must account for the world's deaths, or a region has been read as a country.
    if (sum > y.world || sum < 0.95 * y.world) throw new Error(`UCDP: ${y.year}: the countries hold ${sum} of the world's ${y.world}`);
    y.top = y.places.sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([, d]) => d > 0);
    delete y.places;
  }
  return out;
}

(async () => {
  const conflicts = await conflictPlaces();
  const lastYear = conflicts.at(-1).year;
  const { events, revision } = await deadliestByYear(lastYear);
  await stormDamage(events);
  await earthquakes(events);
  const today = new Date().toISOString().slice(0, 10);
  const opt = (e, key) => (e[key] === undefined ? "" : `, ${key}: ${JSON.stringify(e[key])}`);

  fs.writeFileSync(
    OUT,
    `/**
 * The events behind the yearly charts: the deadliest natural disaster of each
 * year by name, and where most of each year's conflict deaths were.
 *
 * GENERATED by build-named-events.cjs on ${today} — do not edit by hand; change
 * the script and re-run it.
 *
 * A disaster's name, kind, place, date and death toll are as Wikipedia's list
 * of natural disasters by death toll gives them for the year (revision
 * ${revision}; epidemics and famines are left out, as the list leaves them) - a
 * range where the counts differ. An earthquake's magnitude, damage and second
 * death count are NOAA's, attached only where its database has exactly one
 * such earthquake that year in a country the list names. A storm's damage is
 * the figure in its article's infobox. The event is the year's deadliest, not
 * the year's whole toll.
 *
 * Conflict deaths are the Uppsala Conflict Data Program's, counted where they
 * took place: the three countries with the most in each year, and the world's
 * total for the year.
 */
export const NAMED_EVENTS_SOURCES = {
  list: {
    label: "Wikipedia — List of natural disasters by death toll: deadliest by year (revision ${revision})",
    url: "https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(LIST.replace(/ /g, "_"))}&oldid=${revision}",
  },
  noaa: {
    label: "NOAA National Centers for Environmental Information — Significant Earthquake Database",
    url: "https://www.ngdc.noaa.gov/hazel/view/hazards/earthquake/search",
  },
  ucdp: { label: "Uppsala Conflict Data Program (via Our World in Data) — deaths by country and kind of conflict", url: "https://ourworldindata.org/grapher/${UCDP_SLUG}" },
  retrieved: "${today}",
};

export type DisasterEvent = {
  year: number;
  name: string;
  /** The title of its Wikipedia article. */
  article: string;
  kind: string;
  where: string;
  when: string;
  /** The death toll as the list writes it, and its lowest and highest figures. */
  deaths: string;
  low: number;
  high: number;
  /** An earthquake's magnitude, and NOAA's own count of the dead. */
  magnitude?: number;
  noaaDeaths?: number;
  noaaId?: number;
  /** Damage in US dollars of the year, and whose figure it is. */
  damageUsd?: number;
  damageFrom?: "NOAA" | "Wikipedia";
};

/** One a year, ${FROM} to ${lastYear}. */
export const DEADLIEST_DISASTERS: DisasterEvent[] = [
${events
  .map(
    (e) =>
      `  { year: ${e.year}, name: ${JSON.stringify(e.name)}, article: ${JSON.stringify(e.article)}, kind: ${JSON.stringify(e.kind)}, where: ${JSON.stringify(e.where)}, when: ${JSON.stringify(e.when)}, deaths: ${JSON.stringify(e.deaths)}, low: ${e.low}, high: ${e.high}${opt(e, "magnitude")}${opt(e, "noaaDeaths")}${opt(e, "noaaId")}${opt(e, "damageUsd")}${opt(e, "damageFrom")} },`,
  )
  .join("\n")}
];

/** For each year: the world's conflict deaths, and the three countries where most of them were. */
export const CONFLICT_DEATHS_BY_PLACE: { year: number; world: number; top: [place: string, deaths: number][] }[] = [
${conflicts.map((y) => `  { year: ${y.year}, world: ${y.world}, top: ${JSON.stringify(y.top)} },`).join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  disasters ${FROM}–${lastYear}: ${events.length}; with NOAA's record ${events.filter((e) => e.noaaId).length} of ${events.filter((e) => /earthquake/i.test(e.kind || e.name)).length} earthquakes; storm damage ${events.filter((e) => e.damageFrom === "Wikipedia").length}`);
  for (const e of events) console.log(`    ${e.year}  ${e.name} · ${e.kind} · ${e.where} · ${e.when} · ${e.deaths}${e.magnitude ? ` · M${e.magnitude} · NOAA ${e.noaaDeaths}` : ""}${e.damageUsd ? ` · $${(e.damageUsd / 1e9).toFixed(2)}bn (${e.damageFrom})` : ""}`);
  console.log(`  conflicts: ${conflicts.length} years; e.g. ${conflicts.filter((y) => [1994, 2022, lastYear].includes(y.year)).map((y) => `${y.year} ${y.top[0][0]} ${y.top[0][1]} of ${y.world}`).join("; ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
