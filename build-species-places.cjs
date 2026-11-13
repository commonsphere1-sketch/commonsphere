#!/usr/bin/env node
/**
 * Where the species on the Climate page live, as asked - so that its lists of endangered and newly described species can
 * show those of the place chosen: for each species (endangeredSpecies.ts, newSpecies.ts), by its scientific name, the
 * places Wikidata records it as endemic to (P183) and its taxon range (P9714), each turned into its country (the place's
 * own ISO 3166-1 code, or its country's, P17); and, for a newly described species, the countries its own article names
 * where it says the species lives or was found (its `where`, in its own words), by the site's names for them. A species
 * neither record places is in no country: the lists say how many of theirs are placed.
 *
 * Writes static/species/places.json: { scientificName: { cc: [ISO codes], places: [{ name, cc, via }] } }.
 *
 *   node build-species-places.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const OUT = path.join(__dirname, "static/species/places.json");
const CACHE = path.join(os.tmpdir(), "commonsphere-species-places");
fs.mkdirSync(CACHE, { recursive: true });

/** A generated data file's exported array, read through esbuild. */
function load(file, name) {
  const bundle = path.join(CACHE, `${name}.cjs`);
  execSync(`npx esbuild ${file} --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle);
}

async function qlever(query) {
  for (let i = 0; ; i++) {
    const res = await fetch("https://qlever.dev/api/wikidata", {
      method: "POST",
      headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
      body: `query=${encodeURIComponent(query)}`,
    });
    const text = await res.text();
    if (res.ok) return JSON.parse(text).results.bindings;
    // A 429 whose body says it timed out is a timeout, not a limit: no use waiting.
    if (i >= 2 || /timed? ?out/i.test(text)) throw new Error(`QLever ${res.status}: ${text.slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

(async () => {
  const { ENDANGERED_SPECIES } = load("src/data/endangeredSpecies.ts", "endangered");
  const { NEW_SPECIES } = load("src/data/newSpecies.ts", "newSpecies");
  const { countriesData } = load("src/data/countriesData.ts", "countries");
  const names = [...new Set([...ENDANGERED_SPECIES, ...NEW_SPECIES].map((s) => s.scientific))];

  const out = {};
  const add = (name, cc, place, via) => {
    const at = (out[name] ||= { cc: [], places: [] });
    if (cc && !at.cc.includes(cc)) at.cc.push(cc);
    if (!at.places.some((p) => p.name === place && p.via === via)) at.places.push({ name: place, ...(cc ? { cc } : {}), via });
  };

  for (let i = 0; i < names.length; i += 50) {
    const values = names
      .slice(i, i + 50)
      .map((n) => `"${n.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
      .join(" ");
    const rows = await qlever(`PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?name ?via ?place ?label ?iso0 ?iso1 WHERE {
  VALUES ?name { ${values} }
  ?taxon wdt:P225 ?name .
  { ?taxon wdt:P183 ?place . BIND("endemic" AS ?via) } UNION { ?taxon wdt:P9714 ?place . BIND("range" AS ?via) }
  OPTIONAL { ?place rdfs:label ?label . FILTER(LANG(?label) = "en") }
  OPTIONAL { ?place wdt:P297 ?iso0 }
  OPTIONAL { ?place wdt:P17 ?c . ?c wdt:P297 ?iso1 }
}`);
    for (const r of rows) {
      const cc = r.iso0?.value ?? r.iso1?.value ?? null;
      add(r.name.value, cc, r.label?.value ?? r.place.value.split("/").pop(), r.via.value);
    }
    process.stdout.write(".");
  }
  console.log();

  // A new species' own words on where it lives: the countries they name, by the site's names (the longest first, so that
  // "Papua New Guinea" is not read as "Guinea").
  const byName = countriesData.filter((c) => !c.uninhabited).map((c) => [c.name, c.code]).sort((a, b) => b[0].length - a[0].length);
  let fromWords = 0;
  for (const s of NEW_SPECIES) {
    if (!s.where) continue;
    let text = ` ${s.where} `;
    for (const [n, code] of byName) {
      const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(text)) {
        add(s.scientific, code, n, "article");
        text = text.replace(re, " ");
        fromWords++;
      }
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  const placed = (list) => list.filter((s) => out[s.scientific]?.cc.length).length;
  console.log(`species placed in a country: endangered ${placed(ENDANGERED_SPECIES)} of ${ENDANGERED_SPECIES.length}, new ${placed(NEW_SPECIES)} of ${NEW_SPECIES.length}; ${fromWords} countries read from articles' own words`);
  const gorilla = out["Gorilla beringei"];
  if (gorilla) console.log("Gorilla beringei:", JSON.stringify(gorilla).slice(0, 300));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
