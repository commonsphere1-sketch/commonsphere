#!/usr/bin/env node
/**
 * Builds static/poverty/eurostat.json - the share of each European division's people at risk of poverty, as asked:
 * Eurostat's regional figures from the EU survey of income and living conditions (EU-SILC), reused under the
 * Commission's reuse policy (Decision 2011/833/EU: any use, commercial included, with the source credited).
 *
 *   ilc_li41     At-risk-of-poverty rate by NUTS region: the share of people whose household income, for its size, is
 *                below 60% of their country's median - a measure of how far below the rest of the country, not of hunger.
 *   ilc_peps11n  People at risk of poverty or social exclusion by NUTS region: those, and the people in severe material
 *                and social deprivation or in households where little work is done.
 *   https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<code> - no key.
 *
 * A division is matched by its NUTS code - the one its Wikidata record gives (static/divisions/<cc>.json, field nuts) -
 * and never by name: a code is one area. Eurostat publishes these for regions at NUTS levels 0 to 2, so a division at
 * level 3 (a French department, an Italian province) has none. For each, its latest year; a figure Eurostat flags as of
 * low reliability ("u") is left out, and its flag is kept where it gives one (b: a break in the series, p: provisional).
 *
 *   node build-division-eurostat.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const CACHE = path.join(os.tmpdir(), "commonsphere-eurostat");
const OUT = path.join(__dirname, "static/poverty/eurostat.json");
fs.mkdirSync(CACHE, { recursive: true });

/** A Eurostat dataset as JSON-stat, kept for a day. */
function dataset(code) {
  const file = path.join(CACHE, `${code}.json`);
  if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3))
    execFileSync("curl", ["-sL", "--fail", "--max-time", "300", "-A", UA, "-o", file, `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${code}?format=JSON&lang=EN&sinceTimePeriod=2010`]);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Each region's latest figure in a dataset of one unit (per cent): { code: { y, v, f?, label } }. */
function latest(code) {
  const j = dataset(code);
  const dims = j.id;
  const size = j.size;
  if (Object.keys(j.dimension.unit.category.index).join() !== "PC") throw new Error(`${code}: not in per cent`);
  const geoIx = j.dimension.geo.category.index;
  const timeIx = j.dimension.time.category.index;
  const geos = Object.keys(geoIx);
  const times = Object.keys(timeIx).sort();
  // The flat index of a cell: each dimension's position times the sizes of the ones after it.
  const at = (pos) => dims.reduce((n, d, i) => n * size[i] + pos[d], 0);
  const out = {};
  for (const g of geos) {
    for (const t of [...times].reverse()) {
      const k = at({ freq: 0, unit: 0, geo: geoIx[g], time: timeIx[t] });
      const v = j.value[k];
      const f = j.status?.[k];
      if (v === undefined || v === null || /u/.test(f ?? "")) continue;
      out[g] = { y: +t, v, ...(f ? { f } : {}), label: j.dimension.geo.category.label[g] };
      break;
    }
  }
  return { out, updated: j.updated, label: j.label };
}

const arop = latest("ilc_li41");
const arope = latest("ilc_peps11n");
console.log(`ilc_li41: ${Object.keys(arop.out).length} regions (updated ${arop.updated}); ilc_peps11n: ${Object.keys(arope.out).length} (updated ${arope.updated})`);

/* The site's divisions, each with the NUTS code its record gives, and every name it goes by. */
const fold = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(prov|provincia autonoma di|province|provincie|region|region de|comunidad|comunidad foral de|principado de|ciudad de|wojewodztwo|nl|be)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const lev = (a, b) => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
};
/** Whether Eurostat's name for a code is one of the division's names: the same but for spelling, or one standing whole inside the other ("Uusimaa", "Helsinki-Uusimaa"). */
const agree = (label, own) =>
  label
    .split("/")
    .map(fold)
    .some((l) => own.some((n) => n && (` ${l} `.includes(` ${n} `) || ` ${n} `.includes(` ${l} `) || 1 - lev(l, n) / Math.max(l.length, n.length) >= 0.75)));
const names = new Map();
for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
  const s = line.trim().replace(/,$/, "");
  if (s.startsWith('"{')) {
    const d = JSON.parse(JSON.parse(s));
    names.set(d.id, { name: d.name, all: [d.name, d.official, d.native, d.article].filter(Boolean).map(fold) });
  }
}
/* What each candidate division's Wikidata record is called, in every language: Wikidata's (CC0), read through QLever. */
async function labelsOf(qids) {
  const out = new Map();
  for (let i = 0; i < qids.length; i += 50) {
    if (i) await new Promise((r) => setTimeout(r, 1000));
    const query = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?d ?l WHERE { VALUES ?d { ${qids.slice(i, i + 50).map((q) => `wd:${q}`).join(" ")} } ?d rdfs:label ?l }`;
    const file = path.join(CACHE, `labels-${require("crypto").createHash("sha1").update(query).digest("hex").slice(0, 12)}.json`);
    if (!(fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 20 * 3600e3)) {
      const res = await fetch("https://qlever.dev/api/wikidata", {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
        body: `query=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`QLever: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      fs.writeFileSync(file, await res.text());
    }
    for (const b of JSON.parse(fs.readFileSync(file, "utf8")).results.bindings) {
      const q = b.d.value.split("/").pop();
      (out.get(q) ?? out.set(q, []).get(q)).push(fold(b.l.value));
    }
  }
  return out;
}

const divisions = {};
const seen = [];
const refused = [];
const candidates = [];
for (const f of fs.readdirSync(path.join(__dirname, "static/divisions")).filter((f) => /^[A-Z]{2}\.json$/.test(f))) {
  const file = JSON.parse(fs.readFileSync(path.join(__dirname, "static/divisions", f), "utf8"));
  for (const [id, d] of Object.entries(file)) {
    const code = d.nuts;
    // A country's own code (DE, FR) is the country, not a division of it.
    if (code && code.length > 2 && (arop.out[code] || arope.out[code])) candidates.push([id, code]);
  }
}
const qidOf = new Map();
for (const line of fs.readFileSync(path.join(__dirname, "src/data/subnations.ts"), "utf8").split(/\r?\n/)) {
  const s = line.trim().replace(/,$/, "");
  if (s.startsWith('"{')) {
    const d = JSON.parse(JSON.parse(s));
    if (d.qid) qidOf.set(d.id, d.qid);
  }
}
(async () => {
  const labels = await labelsOf([...new Set(candidates.map(([id]) => qidOf.get(id)).filter(Boolean))]);
  for (const [id, code] of candidates) {
    const a = arop.out[code];
    const b = arope.out[code];
    const label = (a ?? b).label;
    const own = names.get(id);
    const recorded = labels.get(qidOf.get(id)) ?? [];
    // The code must name it: Eurostat's name for the code is the division's own ("Anatoliki Makedonia, Thraki"); or, where
    // the two are in other tongues ("Greater Poland", "Wielkopolskie"), one of its record's names is - and the record is
    // about it, its name one of the record's in some language. A record can carry another area's code (Bozen's gives
    // Trento's), and the one held for "Genova" is Liguria's.
    const direct = agree(label, [fold(own?.name ?? "")]);
    if (!direct && !recorded.some((l) => agree(l, [fold(own?.name ?? "")]))) {
      refused.push(`${id} ${own?.name}: its record is not called so, nor is ${code} ${label}`);
      continue;
    }
    if (!direct && !agree(label, [...(own?.all ?? []), ...recorded])) {
      refused.push(`${id} ${own?.name} ≠ ${code} ${label}`);
      continue;
    }
    divisions[id] = { code, ...(a ? { arop: [a.y, a.v, ...(a.f ? [a.f] : [])] } : {}), ...(b ? { arope: [b.y, b.v, ...(b.f ? [b.f] : [])] } : {}) };
    seen.push(`${id} ${names.get(id)?.name} = ${code} ${label} ${JSON.stringify(divisions[id].arop)}`);
  }
  console.log("Not taken:", refused.join("; "));
fs.writeFileSync(
  OUT,
  JSON.stringify({
    sources: {
      arop: { label: "Eurostat — At-risk-of-poverty rate by NUTS region (ilc_li41), EU-SILC", url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_li41/default/table" },
      arope: { label: "Eurostat — People at risk of poverty or social exclusion by NUTS region (ilc_peps11n), EU-SILC", url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_peps11n/default/table" },
    },
    divisions,
  }),
);
  console.log(`${Object.keys(divisions).length} divisions held:`);
  console.log(seen.join("\n"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
