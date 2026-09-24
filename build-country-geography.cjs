/**
 * Builds src/data/countryGeography.ts — where each place is and what it is
 * like: location, coordinates, area, coastline, climate, terrain, elevation,
 * natural resources and hazards.
 *
 * From the CIA World Factbook (public domain, the September 2026 edition via
 * the factbook.json mirror), matched to the site's ISO codes through each
 * entry's internet country code - ".uk" for the United Kingdom, and a few
 * entries listed by path because they have none. For the places the Factbook
 * folds into another country - Åland, the Caribbean Netherlands, France's
 * overseas regions - Wikidata (CC0) supplies what it holds: a description,
 * coordinates, area and highest point. Nothing is written for a field the
 * source does not publish.
 *
 * For a place with no permanent population, the Factbook's own note on who
 * is there (research stations, military staff) is kept as well.
 *
 * The page imports this on demand, so it is not in the main bundle.
 *
 *   node build-country-geography.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryGeography.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-geography");
fs.mkdirSync(CACHE, { recursive: true });
const REPO = "https://raw.githubusercontent.com/factbook/factbook.json/master";

/** Factbook entries with no internet country code of their own. */
const BY_PATH = {
  GB: "europe/uk",
  UM: "australia-oceania/um",
  GS: "south-america/sx",
  SJ: "europe/sv",
  XK: "europe/kv",
  EH: "africa/wi",
};
/** Wikidata items for the places the Factbook has no entry for. */
const WIKIDATA = { AX: "Q5689", BQ: "Q27561", GF: "Q3769", GP: "Q17012", MQ: "Q17054", RE: "Q17070", YT: "Q17063", PS: "Q219060" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cached(url, name) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json, application/sparql-results+json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      fs.writeFileSync(at, text);
      return text;
    } catch (e) {
      if (i === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

const ENTITIES = { amp: "&", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", quot: '"', deg: "°", eacute: "é", egrave: "è" };
const clean = (s) =>
  (s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z]+);/g, (m, e) => ENTITIES[e] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
/** A long note, cut at a sentence end near the limit. */
const clip = (s, n) => {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (end > n * 0.5 ? cut.slice(0, end + 1) : cut.trimEnd() + "…").trim();
};
const text = (node) => (node ? clean(node.text ?? "") : "");

/** "18 15 N, 63 10 W" → [18.25, -63.1667]. The first pair where there are several. */
function coords(s) {
  const m = /(\d+)\s+(\d+)\s+([NS])\s*,\s*(\d+)\s+(\d+)\s+([EW])/.exec(s);
  if (!m) return null;
  const lat = (+m[1] + +m[2] / 60) * (m[3] === "S" ? -1 : 1);
  const lon = (+m[4] + +m[5] / 60) * (m[6] === "W" ? -1 : 1);
  return [Number(lat.toFixed(4)), Number(lon.toFixed(4))];
}

function fromFactbook(j) {
  const G = j.Geography || {};
  const out = { src: "factbook" };
  const put = (k, v) => { if (v) out[k] = v; };
  put("location", text(G.Location));
  const c = text(G["Geographic coordinates"]);
  put("coordinatesText", c);
  const xy = coords(c);
  if (xy) out.coordinates = xy;
  const A = G.Area || {};
  put("areaTotal", text(A.total || A["total "]));
  put("areaLand", text(A.land));
  put("areaWater", text(A.water));
  put("areaComparative", text(G["Area - comparative"]));
  put("landBoundaries", text(G["Land boundaries"]?.total));
  put("coastline", text(G.Coastline));
  put("climate", clip(text(G.Climate), 400));
  put("terrain", clip(text(G.Terrain), 400));
  const E = G.Elevation || {};
  put("highestPoint", text(E["highest point"]));
  put("lowestPoint", text(E["lowest point"]));
  put("meanElevation", text(E["mean elevation"]));
  put("naturalResources", clip(text(G["Natural resources"]), 400));
  put("naturalHazards", clip(text(G["Natural hazards"]), 400));
  put("note", clip(text(G["Geography - note"]), 600));
  return out;
}

(async () => {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  const countries = require(bundle).countriesData;

  // Every Factbook entry, indexed by its internet country code.
  const tree = JSON.parse(await cached("https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1", "tree.json"));
  const files = tree.tree.filter((x) => x.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(x.path)).map((x) => x.path.replace(/\.json$/, ""));
  const byTld = new Map();
  for (const f of files) {
    const j = JSON.parse(await cached(`${REPO}/${f}.json`, f.replace("/", "__") + ".json"));
    const m = /\.([a-z]{2})\b/.exec(text(j.Communications?.["Internet country code"]));
    if (!m) continue;
    const code = m[1].toUpperCase() === "UK" ? "GB" : m[1].toUpperCase();
    // Two entries share ".ps" (West Bank, Gaza Strip): neither is Palestine
    // as a whole, so that code goes to Wikidata instead.
    (byTld.get(code) || byTld.set(code, []).get(code)).push(f);
  }

  const out = {};
  const missing = [];
  for (const c of countries) {
    if (WIKIDATA[c.code]) continue;
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    if (!p) { missing.push(c.code); continue; }
    const j = JSON.parse(await cached(`${REPO}/${p}.json`, p.replace("/", "__") + ".json"));
    const g = fromFactbook(j);
    if (c.uninhabited) {
      const P = j["People and Society"] || {};
      const pop = text(P.Population?.total ?? P.Population);
      if (pop) g.population = clip(pop, 400);
    }
    out[c.code] = g;
  }

  // Wikidata for the rest.
  const q = `SELECT ?code ?desc ?coord ?area ?hpLabel ?hpElev WHERE {
    VALUES (?code ?item) { ${Object.entries(WIKIDATA).map(([c, q]) => `("${c}" wd:${q})`).join(" ")} }
    OPTIONAL { ?item schema:description ?desc. FILTER(LANG(?desc) = "en") }
    OPTIONAL { ?item wdt:P625 ?coord. }
    OPTIONAL { ?item p:P2046 ?aS. ?aS psv:P2046 ?aV. ?aV wikibase:quantityAmount ?area; wikibase:quantityUnit wd:Q712226. }
    OPTIONAL { ?item wdt:P610 ?hp. OPTIONAL { ?hp wdt:P2044 ?hpElev. } }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  const wd = JSON.parse(await cached("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q), "wikidata.json"));
  for (const b of wd.results.bindings) {
    const code = b.code.value;
    const g = (out[code] ||= { src: "wikidata" });
    if (b.desc && !g.location) g.location = b.desc.value.charAt(0).toUpperCase() + b.desc.value.slice(1);
    if (b.coord && !g.coordinates) {
      const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value);
      if (m) g.coordinates = [Number((+m[2]).toFixed(4)), Number((+m[1]).toFixed(4))];
    }
    if (b.area && !g.areaTotal) g.areaTotal = `${Math.round(+b.area.value).toLocaleString("en-US")} sq km`;
    if (b.hpLabel && !g.highestPoint)
      g.highestPoint = b.hpElev ? `${b.hpLabel.value} ${Math.round(+b.hpElev.value).toLocaleString("en-US")} m` : b.hpLabel.value;
  }
  for (const code of Object.keys(WIKIDATA)) if (!out[code] && countries.some((c) => c.code === code)) missing.push(code);

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * Where each place is and what it is like.
 *
 * GENERATED by build-country-geography.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * src "factbook": CIA World Factbook, Geography (public domain).
 * src "wikidata": Wikidata (CC0), for places the Factbook folds into another
 * country - description, coordinates, area and highest point only.
 * A field the source does not publish is absent. population is the
 * Factbook's note for a place with no permanent population.
 */
export interface Geography {
  src: "factbook" | "wikidata";
  location?: string;
  /** [latitude, longitude], decimal degrees. */
  coordinates?: [number, number];
  coordinatesText?: string;
  areaTotal?: string;
  areaLand?: string;
  areaWater?: string;
  areaComparative?: string;
  landBoundaries?: string;
  coastline?: string;
  climate?: string;
  terrain?: string;
  highestPoint?: string;
  lowestPoint?: string;
  meanElevation?: string;
  naturalResources?: string;
  naturalHazards?: string;
  note?: string;
  population?: string;
}

export const GEOGRAPHY_SOURCES = {
  factbook: { label: "CIA World Factbook — Geography (public domain)", url: "https://www.cia.gov/the-world-factbook/" },
  wikidata: { label: "Wikidata (CC0)", url: "https://www.wikidata.org/" },
};

export const COUNTRY_GEOGRAPHY: Record<string, Geography> = {
${Object.entries(out).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${Object.keys(out).length} places (${Object.values(out).filter((g) => g.src === "wikidata").length} from Wikidata)`);
  if (missing.length) console.log(`  no source for: ${missing.join(", ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
