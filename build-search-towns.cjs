/**
 * Builds static/search/towns.json — the towns the header's search finds by
 * name: every place GeoNames lists with 15,000 people or more, with its
 * country, its GeoNames id and its population, largest first.
 *
 *   node build-search-towns.cjs
 *
 * Read from the site's own files of places (static/places/CC.json, built
 * from GeoNames, CC BY 4.0): nothing is fetched and nothing is worked out.
 * The whole of the 225,000 places would be too much to hand to a search box;
 * a smaller town is found in its country's or its division's window on the
 * Municipalities page, and the search says so.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "static/places");
const OUT = path.join(__dirname, "static/search/towns.json");
const AT_LEAST = 15000;

const rows = [];
for (const f of fs.readdirSync(DIR)) {
  const m = /^([A-Z]{2})\.json$/.exec(f);
  if (!m) continue;
  const file = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  // A place's row: its name, latitude, longitude, population, region, kind, GeoNames id, district.
  for (const p of file.places) if (p[3] >= AT_LEAST) rows.push([p[0], m[1], p[6], p[3], file.regions[p[4]] || ""]);
}
rows.sort((a, b) => b[3] - a[3]);
if (rows.length < 20000) throw new Error(`only ${rows.length} towns were read`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ atLeast: AT_LEAST, built: new Date().toISOString().slice(0, 10), towns: rows }));
console.log(`wrote ${path.relative(__dirname, OUT)}: ${rows.length} towns of ${AT_LEAST.toLocaleString("en-US")} people or more, ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
console.log(`  largest: ${rows.slice(0, 3).map((r) => `${r[0]} (${r[1]}) ${r[3].toLocaleString("en-US")}`).join("; ")}`);
