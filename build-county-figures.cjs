#!/usr/bin/env node
/**
 * Builds static/poverty/counties/<cc>.json and its index - each country's own figures for its counties, municipalities
 * or districts, for the World Maps' poorest and richest areas drawn by county, as asked. A country's counties are ranked
 * against each other on the map, each country by its own statistics office's measure, so the measures need not match.
 *
 *   Brazil  IBGE: municipal GDP at current prices, 2022 (SIDRA table 5938), over the 2022 census population (table 4709) -
 *           GDP per person, worked out here from the two, for the poorest and the richest. IBGE's data are free to use
 *           with the source cited.
 *   Mexico  CONEVAL: the share of each municipality's people in poverty, 2020 (Concentrado de indicadores de pobreza
 *           municipal 2020), for the poorest only - CONEVAL publishes no income level by municipality. Its terms of free
 *           use allow copying, distributing and using the data in other products, with the source cited.
 *
 * Each figure is matched to the site's own outline of the place (static/geo/admin2, geoBoundaries) by its state and its
 * name - or, where its state as drawn differs, by a name no other outline in the country has - never by a name many share.
 * set - as many of each, every one paired, by name or, among the few left, by spelling: an outline drawn before a
 * municipality was split no longer has the land the figure is for, so a state whose count has changed is left out whole.
 *
 *   node build-county-figures.cjs
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const OUT = path.join(__dirname, "static/poverty/counties");
fs.mkdirSync(OUT, { recursive: true });
// A name as compared: without accents or case, its abbreviations written out ("Dr. Arroyo" is "Doctor Arroyo", "Gral." is "General").
const fold = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bdr\b/g, "doctor")
    .replace(/\bgral\b/g, "general")
    .replace(/\bsta\b/g, "santa")
    .replace(/\bsto\b/g, "santo")
    .trim();
/** One name standing whole inside the other ("Silao", "Silao de la Victoria"). */
const within = (a, b) => ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `);
/**
 * Places a country's statistics office and the outlines' publisher spell apart, each checked as one place: by country, the
 * office's name and the outline's.
 */
const SPELLED = {
  BR: { Assú: "Açu", Arez: "Arês", "São Luiz do Anauá": "São Luiz" },
};
const lev = (a, b) => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
};

/** The site's outlines of a country's second-order places, as { state: [name] } by the outline's own names. */
function outlines(cc) {
  const t = JSON.parse(fs.readFileSync(path.join(__dirname, "static/geo/admin2", `${cc}.json`), "utf8"));
  const by = new Map();
  for (const g of t.objects.a.geometries) {
    const { n, p } = g.properties ?? {};
    if (n && p) (by.get(p) ?? by.set(p, []).get(p)).push(n);
  }
  return by;
}

/**
 * Pairs one country's figures with its outlines, state by state. `rows` is [{ state, name, values }]; `stateOf` turns a
 * figure's state into the outline's own state name. Returns { "<state>|<name>": values } and what was left out.
 */
function pair(cc, rows, stateOf) {
  // Every outline of the country: its state as drawn (the first-order division most of its land lies in, which near a
  // state's edge can be its neighbour), its name, and whether a figure has been paired to it.
  const all = [];
  for (const [p, names] of outlines(cc)) for (const n of names) all.push({ p, n, key: fold(n), used: false });
  const byName = new Map();
  for (const o of all) (byName.get(o.key) ?? byName.set(o.key, []).get(o.key)).push(o);
  const list = rows.flatMap((r) => (stateOf(r.state) ? [{ ...r, name: SPELLED[cc]?.[r.name] ?? r.name, s: stateOf(r.state) }] : []));
  const pairs = new Map();
  let spelled = 0;
  // How many places in the country carry each name: a name two places share is never paired across a state's edge.
  const rowsByName = new Map();
  for (const r of list) rowsByName.set(fold(r.name), (rowsByName.get(fold(r.name)) ?? 0) + 1);
  // By name: the one outline of that name in its own state; else, where the name is the country's only one of both the
  // places and the outlines, that outline wherever it is drawn (its state as drawn being its neighbour's).
  for (const r of list) {
    const named = (byName.get(fold(r.name)) ?? []).filter((o) => !o.used);
    const inState = named.filter((o) => o.p === r.s);
    const hit =
      inState.length === 1
        ? inState[0]
        : inState.length === 0 && named.length === 1 && (byName.get(fold(r.name)) ?? []).length === 1 && rowsByName.get(fold(r.name)) === 1
          ? named[0]
          : null;
    if (hit) {
      hit.used = true;
      pairs.set(r, hit);
    }
  }
  // The few left, by spelling, within one state as drawn: only where one is clearly the nearest, and no other as near.
  const restRows = list.filter((r) => !pairs.has(r));
  const cand = [];
  for (const r of restRows)
    for (const o of all)
      if (!o.used && o.p === r.s) {
        const like = 1 - lev(fold(r.name), o.key) / Math.max(fold(r.name).length, o.key.length, 1);
        cand.push([within(fold(r.name), o.key) ? Math.max(0.85, like) : like, r, o]);
      }
  cand.sort((a, b) => b[0] - a[0]);
  for (const [sc, r, o] of cand) {
    if (sc < 0.8 || pairs.has(r) || o.used) continue;
    if (cand.some(([s2, r2, o2]) => s2 === sc && ((r2 === r && o2 !== o && !o2.used) || (o2 === o && r2 !== r && !pairs.has(r2))))) continue;
    o.used = true;
    pairs.set(r, o);
    spelled++;
  }
  // A state is kept only where every one of its places is paired and no outline drawn in it is left without a figure:
  // a place with no outline, or an outline with no figure, means the map and the figures are not the same set of places
  // there - a municipality split or merged since the outlines were drawn - and so the land a figure is for may differ.
  const out = {};
  const left = [];
  const states = [...new Set(list.map((r) => r.s))];
  for (const s of states) {
    const mine = list.filter((r) => r.s === s);
    const unpaired = mine.filter((r) => !pairs.has(r));
    const bare = all.filter((o) => o.p === s && !o.used);
    if (unpaired.length || bare.length) {
      left.push(`${s}: ${unpaired.length ? `${unpaired.length} place(s) without an outline (e.g. ${unpaired.slice(0, 2).map((r) => r.name).join(", ")})` : ""}${unpaired.length && bare.length ? "; " : ""}${bare.length ? `${bare.length} outline(s) without a figure (e.g. ${bare.slice(0, 2).map((o) => o.n).join(", ")})` : ""}`);
      continue;
    }
    for (const r of mine) {
      const o = pairs.get(r);
      out[`${o.p}|${o.n}`] = r.values;
    }
  }
  return { out, left, spelled };
}

const write = (cc, body) => {
  fs.writeFileSync(path.join(OUT, `${cc}.json`), JSON.stringify(body));
  console.log(`${cc}: ${Object.keys(body.values).length} places`);
};
const done = [];

/* ── Brazil ── */
{
  const sidra = (q) => JSON.parse(execFileSync("curl", ["-s", "--fail", "--max-time", "300", "-A", UA, `https://apisidra.ibge.gov.br/values/${q}`], { maxBuffer: 256 * 1024 * 1024 }).toString()).slice(1);
  const gdp = new Map(sidra("t/5938/n6/all/v/37/p/2022").map((r) => [r.D1C, r]));
  const pop = new Map(sidra("t/4709/n6/all/v/93/p/2022").map((r) => [r.D1C, Number(r.V)]));
  const UF = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
  const states = [...outlines("BR").keys()];
  const stateOf = (uf) => states.find((s) => fold(s) === fold(UF[uf] ?? "")) ?? null;
  const rows = [];
  for (const [code, r] of gdp) {
    const m = String(r.D1N).match(/^(.*) - ([A-Z]{2})$/);
    const people = pop.get(code);
    const thousands = Number(r.V);
    if (!m || !people || !Number.isFinite(thousands)) continue;
    // GDP per person, in reais: GDP in thousands of reais over the census population, worked out here.
    const perPerson = Math.round((thousands * 1000) / people);
    rows.push({ state: m[2], name: m[1], values: [perPerson, perPerson] });
  }
  const { out, left, spelled } = pair("BR", rows, stateOf);
  console.log(`Brazil: ${rows.length} municipalities with both figures; paired ${Object.keys(out).length} (${spelled} by spelling); left out: ${left.join("; ") || "none"}`);
  write("BR", {
    cc: "BR",
    level: "municipalities",
    year: 2022,
    source: [
      { label: "IBGE — Produto Interno Bruto dos Municípios, 2022 (SIDRA table 5938)", url: "https://sidra.ibge.gov.br/tabela/5938" },
      { label: "IBGE — Censo Demográfico 2022, população residente (SIDRA table 4709)", url: "https://sidra.ibge.gov.br/tabela/4709" },
    ],
    poor: { label: "GDP per person, lowest", say: "GDP per person in 2022, in reais - IBGE's municipal GDP over its 2022 census population, worked out here", higherIsPoorer: false },
    rich: { label: "GDP per person, highest", say: "GDP per person in 2022, in reais - IBGE's municipal GDP over its 2022 census population, worked out here" },
    values: out,
  });
  done.push("BR");
}

/* ── Mexico ── */
{
  const dir = path.join(__dirname, "data-raw/coneval/xx");
  if (!fs.existsSync(path.join(dir, "xl/worksheets/sheet1.xml"))) throw new Error("Unpack data-raw/coneval/x/Concentrado_indicadores_de_pobreza_2020.xlsx to data-raw/coneval/xx");
  const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const strings = [...fs.readFileSync(path.join(dir, "xl/sharedStrings.xml"), "utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unescape([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));
  const rows = [];
  let headerOk = false;
  for (const m of fs.readFileSync(path.join(dir, "xl/worksheets/sheet1.xml"), "utf8").matchAll(/<row [^>]*?r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const c of m[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, col, attrs, inner] = c;
      const v = inner ? (inner.match(/<v>([\s\S]*?)<\/v>/) ?? [])[1] : undefined;
      if (v !== undefined) cells[col] = /t="s"/.test(attrs) ? strings[+v] : unescape(v);
    }
    // The heading the poverty share is read under: "Porcentaje 2020" in column K, below "Pobreza" in column I.
    if (/Porcentaje\s*2020/.test(cells.K ?? "")) headerOk = true;
    if (!/^\d{5}$/.test(cells.D ?? "")) continue;
    const v = Number(cells.K);
    if (!Number.isFinite(v)) continue;
    rows.push({ state: cells.C, name: cells.E, values: [Math.round(v * 10) / 10, null] });
  }
  if (!headerOk) throw new Error("CONEVAL: column K is not the 2020 poverty share");
  const states = [...outlines("MX").keys()];
  // CONEVAL names Mexico's states in full; the outlines, as their publisher does - matched by name, then by the few spelled apart.
  const ALIAS = { "Coahuila de Zaragoza": "Coahuila", "Michoacán de Ocampo": "Michoacán", "Veracruz de Ignacio de la Llave": "Veracruz", "Ciudad de México": "Distrito Federal" };
  const stateOf = (s) => states.find((x) => fold(x) === fold(s)) ?? states.find((x) => fold(x) === fold(ALIAS[s] ?? "")) ?? null;
  const { out, left, spelled } = pair("MX", rows, stateOf);
  console.log(`Mexico: ${rows.length} municipalities; paired ${Object.keys(out).length} (${spelled} by spelling); left out: ${left.join("; ") || "none"}`);
  write("MX", {
    cc: "MX",
    level: "municipalities",
    year: 2020,
    source: [{ label: "CONEVAL — Medición de la pobreza municipal 2020: concentrado de indicadores de pobreza por municipio", url: "https://www.coneval.org.mx/Medicion/Paginas/Pobreza-municipio-2010-2020.aspx" }],
    poor: { label: "In poverty", say: "the share of people in poverty in 2020, by CONEVAL's multidimensional measure", higherIsPoorer: true },
    rich: null,
    values: out,
  });
  done.push("MX");
}

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ countries: done }));
console.log("Index:", done.join(", "));
