/**
 * The place-history files the Climate and Crime pages read, as asked: a country's history and its divisions' - states,
 * provinces, regions, counties and cities - each year by year, from the published series of the agencies that keep them.
 *
 *   static/<topic>/history/<CC>.json       the country and its first-level divisions
 *   static/<topic>/history/more/<id>.json  a division's own parts (counties, cities), read when it is chosen
 *
 * Each file: { cc, defs: {key: {label, unit, say}}, sources: {id: {label, url, note?}},
 *              places: [{ id, name, kind, parent?, series: {key: [firstYear, value | null, ...]}, from: {key: sourceId} }],
 *              more?: {placeId: count of its parts} }
 *
 * Several builds write to the same files, each its own places' series from its own source: merge() keeps what the
 * others wrote and replaces only what this source wrote before - so any build can be run again alone.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const dirOf = (topic) => path.join(ROOT, "static", topic, "history");

/** A series from {year: value}: [first year, each value on to the last, null where none]. */
function seriesOf(byYear) {
  const ys = Object.keys(byYear)
    .map(Number)
    .filter((y) => Number.isFinite(byYear[y]))
    .sort((a, b) => a - b);
  if (!ys.length) return null;
  const out = [ys[0]];
  for (let y = ys[0]; y <= ys[ys.length - 1]; y++) out.push(Number.isFinite(byYear[y]) ? byYear[y] : null);
  return out;
}

function read(at) {
  return fs.existsSync(at) ? JSON.parse(fs.readFileSync(at, "utf8")) : null;
}

/**
 * Write one source's places into a file, keeping every other source's. `places` are { id, name, kind, parent?, series }
 * (series keyed as `defs`); `more` marks places whose parts are in their own file. One call per file for a source in a
 * run, with all its places there: what the source wrote to the file before is taken off first.
 */
function mergeInto(at, base, { source, sourceId, defs, places, more }) {
  const file = read(at) ?? { ...base, defs: {}, sources: {}, places: [] };
  file.defs = { ...file.defs, ...defs };
  file.sources = { ...file.sources, [sourceId]: source };
  const byId = new Map(file.places.map((p) => [p.id, p]));
  // What this source wrote before is taken off first, so a run again leaves no stale years.
  for (const p of file.places)
    for (const [k, s] of Object.entries(p.from ?? {}))
      if (s === sourceId) {
        delete p.series[k];
        delete p.from[k];
      }
  for (const p of places) {
    const had = byId.get(p.id);
    const into = had ?? { id: p.id, name: p.name, kind: p.kind, ...(p.parent ? { parent: p.parent } : {}), series: {}, from: {} };
    if (!had) {
      byId.set(p.id, into);
      file.places.push(into);
    }
    for (const [k, s] of Object.entries(p.series)) {
      if (!s) continue;
      if (into.from[k] && into.from[k] !== sourceId) continue; // another source holds this place's series already
      into.series[k] = s;
      into.from[k] = sourceId;
    }
  }
  file.places = file.places.filter((p) => Object.keys(p.series).length);
  if (more) file.more = { ...(file.more ?? {}), ...more };
  const order = { country: 0, state: 1, province: 1, territory: 1, region: 1, jurisdiction: 1, county: 2, municipality: 2, city: 3 };
  file.places.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || a.name.localeCompare(b.name));
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, JSON.stringify(file));
  return file;
}

/** A country's file. */
const mergeCountry = (topic, cc, args) => mergeInto(path.join(dirOf(topic), `${cc}.json`), { cc }, args);
/** A division's parts, in their own file. */
const mergeMore = (topic, cc, id, args) => mergeInto(path.join(dirOf(topic), "more", `${id}.json`), { cc, of: id }, args);

/** The index of countries held, for the page's line under the chooser: {cc: [first year, last year, places]}. */
function writeIndex(topic) {
  const dir = dirOf(topic);
  const index = {};
  for (const f of fs.readdirSync(dir).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
    const j = read(path.join(dir, f));
    let lo = Infinity, hi = -Infinity;
    for (const p of j.places)
      for (const s of Object.values(p.series)) {
        lo = Math.min(lo, s[0]);
        hi = Math.max(hi, s[0] + s.length - 2);
      }
    const parts = j.places.filter((p) => p.kind !== "country").length + Object.values(j.more ?? {}).reduce((a, n) => a + n, 0);
    index[j.cc] = [lo, hi, parts];
  }
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index));
  return index;
}

/** The site's countries (code, name), from src/data/countriesData.ts. */
function siteCountries(cacheDir) {
  const { execSync } = require("child_process");
  const bundle = path.join(cacheDir, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: ROOT, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

module.exports = { seriesOf, mergeCountry, mergeMore, writeIndex, siteCountries, dirOf };
