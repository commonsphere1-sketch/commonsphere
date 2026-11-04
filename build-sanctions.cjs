#!/usr/bin/env node
/**
 * Builds src/data/sanctions.ts - who is under sanctions, by country, as asked: the people, companies, ships and aircraft
 * on three governments' official lists, counted by the country each is tied to, and the programmes they are listed under.
 *
 *   US Treasury, Office of Foreign Assets Control - the Specially Designated Nationals and Blocked Persons List (public
 *   domain).
 *   UK Foreign, Commonwealth and Development Office - the UK Sanctions List (Open Government Licence v3.0).
 *   European Commission - the consolidated list of persons, groups and entities subject to EU financial sanctions (reuse
 *   allowed with acknowledgement).
 *
 * An entry is tied to a country where the list gives it an address there or a nationality or citizenship of it; one
 * entry can be tied to several. The counts are worked out here from the lists, and the window says so; no one listed is
 * named, and being tied to a country by an entry does not mean its government is under sanctions.
 *
 *   node build-sanctions.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/sanctions.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-sanctions");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
function get(url, name) {
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > 20 * 3600e3) execFileSync("curl", ["-s", "-L", "--fail", "--max-time", "600", "-A", UA, "-o", file, url]);
  return fs.readFileSync(file, "utf8");
}
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

// ── Country names as the lists write them, to the site's codes ──
const NAME = new Map();
for (const rec of read("src/data/countriesData.ts").split(/\n  \{\n/)) {
  const name = rec.match(/^\s*name:\s*"([^"]+)"/m)?.[1];
  const code = rec.match(/^\s*code:\s*"([A-Z]{2})"/m)?.[1];
  if (name && code) NAME.set(name.toLowerCase(), code);
}
const SITE = new Set(NAME.values());
// The lists' own names for countries the site names otherwise.
const ALIAS = {
  russia: "RU", "russian federation": "RU", iran: "IR", "iran (islamic republic of)": "IR", "korea, north": "KP", "north korea": "KP", "democratic people's republic of korea": "KP", "korea, south": "KR", "south korea": "KR", "republic of korea": "KR",
  burma: "MM", myanmar: "MM", syria: "SY", "syrian arab republic": "SY", turkey: "TR", "türkiye": "TR", turkiye: "TR", "congo, democratic republic of the": "CD", "democratic republic of the congo": "CD", "congo, republic of the": "CG", "republic of the congo": "CG", congo: "CG",
  "united arab emirates": "AE", "united kingdom": "GB", "united states": "US", "united states of america": "US", venezuela: "VE", "bolivarian republic of venezuela": "VE", laos: "LA", "lao people's democratic republic": "LA", vietnam: "VN", "viet nam": "VN",
  "west bank": "PS", gaza: "PS", "palestinian territories": "PS", "occupied palestinian territory": "PS", palestine: "PS", "czech republic": "CZ", czechia: "CZ", "bosnia and herzegovina": "BA", "north macedonia": "MK", macedonia: "MK", moldova: "MD", "republic of moldova": "MD",
  "cote d'ivoire": "CI", "côte d'ivoire": "CI", "ivory coast": "CI", "cabo verde": "CV", "cape verde": "CV", eswatini: "SZ", swaziland: "SZ", "the bahamas": "BS", bahamas: "BS", "the gambia": "GM", gambia: "GM", "hong kong": "HK", macau: "MO", macao: "MO", taiwan: "TW", tanzania: "TZ", "united republic of tanzania": "TZ",
  "brunei darussalam": "BN", brunei: "BN", kyrgyzstan: "KG", "kyrgyz republic": "KG", "st. kitts and nevis": "KN", "saint kitts and nevis": "KN", "st. lucia": "LC", "saint lucia": "LC", "st. vincent and the grenadines": "VC", "saint vincent and the grenadines": "VC", "timor-leste": "TL", "east timor": "TL",
  "congo (democratic republic)": "CD", palestinian: "PS", "occupied palestinian territories": "PS", "region: gaza": "PS", "region: west bank": "PS", "region: northern gaza": "PS", "region: north gaza": "PS", dprk: "KP",
  "virgin islands, british": "VG", "british virgin islands": "VG", "st kitts and nevis": "KN", "st lucia": "LC", "north macedonia, the republic of": "MK", "cayman islands": "KY", jersey: "JE", guernsey: "GG", "man, isle of": "IM", "isle of man": "IM",
  "cote d ivoire": "CI", gibraltar: "GI", "bahamas, the": "BS", curacao: "CW", "curaçao": "CW", aruba: "AW", "region: iran": "IR", "region: russia": "RU", "region: northern mali": "ML",
  "netherlands": "NL", "the netherlands": "NL", "slovak republic": "SK", slovakia: "SK", "micronesia, federated states of": "FM", "bolivia (plurinational state of)": "BO", bolivia: "BO", "sao tome and principe": "ST", "são tomé and príncipe": "ST", "trinidad and tobago": "TT", "antigua and barbuda": "AG", kosovo: "XK", "region: crimea": "UA", crimea: "UA",
};
const unmatched = new Map();
function codeOf(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^[A-Z]{2}$/.test(s)) return SITE.has(s) ? s : (s === "GB" || s === "US" ? s : null);
  const k = s.toLowerCase().replace(/\s+/g, " ");
  const cc = NAME.get(k) ?? ALIAS[k];
  if (!cc) unmatched.set(s, (unmatched.get(s) ?? 0) + 1);
  return cc ?? null;
}

/** Each list's entries: an id, the countries it is tied to, its programmes, and what kind it is. */
function tally(entries) {
  const by = {};
  for (const e of entries) {
    for (const cc of new Set(e.countries)) {
      const t = (by[cc] ??= { n: 0, kinds: {}, progs: {} });
      t.n++;
      t.kinds[e.kind] = (t.kinds[e.kind] ?? 0) + 1;
      for (const p of new Set(e.programmes)) t.progs[p] = (t.progs[p] ?? 0) + 1;
    }
  }
  // [entries, {kind: n}, the programmes they are listed under, most first (up to eight)]
  return Object.fromEntries(Object.entries(by).map(([cc, t]) => [cc, [t.n, t.kinds, Object.entries(t.progs).sort((a, b) => b[1] - a[1]).slice(0, 8)]]));
}

// ── OFAC ──
const sdn = get("https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML", "sdn.xml");
const ofacDate = sdn.match(/<Publish_Date>([^<]+)<\/Publish_Date>/)?.[1] ?? "";
const KIND_OFAC = { Individual: "person", Entity: "entity", Vessel: "vessel", Aircraft: "aircraft" };
const ofac = sdn
  .split("<sdnEntry>")
  .slice(1)
  .map((e) => ({
    kind: KIND_OFAC[(e.match(/<sdnType>([^<]+)<\/sdnType>/) ?? [])[1]] ?? "entity",
    programmes: [...e.matchAll(/<program>([^<]+)<\/program>/g)].map((m) => m[1].trim()),
    countries: [...e.matchAll(/<country>([^<]+)<\/country>/g)].map((m) => codeOf(m[1])).filter(Boolean),
  }));
if (ofac.length < 10000) throw new Error(`OFAC: ${ofac.length} entries`);

// ── The UK ──
function csvRows(text, sep = ",") {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}
const ukText = get("https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv", "uk.csv");
const ukDate = ukText.match(/^Report Date:\s*([^\r\n,]+)/)?.[1]?.trim() ?? "";
const ukRows = csvRows(ukText.replace(/^Report Date:[^\n]*\n/, ""));
const uh = ukRows[0].map((h) => h.trim());
const ui = (n) => {
  const i = uh.indexOf(n);
  if (i < 0) throw new Error(`UK list: no column ${n}`);
  return i;
};
const [uId, uRegime, uType, uAddr, uNat] = [ui("Unique ID"), ui("Regime Name"), ui("Designation Type"), ui("Address Country"), ui("Nationality(/ies)")];
const ukById = new Map();
for (const r of ukRows.slice(1)) {
  const id = r[uId];
  if (!id) continue;
  const e = ukById.get(id) ?? { kind: /individual/i.test(r[uType]) ? "person" : /ship/i.test(r[uType]) ? "vessel" : "entity", programmes: [], countries: [] };
  if (r[uRegime]) e.programmes.push(r[uRegime].replace(/^The /, "").replace(/ \(Sanctions\) \(EU Exit\) Regulations \d{4}$/, "").replace(/ Regulations \d{4}$/, "").trim());
  for (const c of [r[uAddr], ...String(r[uNat] ?? "").split(/[,;]|\(\d\)/)]) {
    const cc = codeOf(c);
    if (cc) e.countries.push(cc);
  }
  ukById.set(id, e);
}
const uk = [...ukById.values()];
if (uk.length < 3000) throw new Error(`UK: ${uk.length} entries`);

// ── The EU ──
const euText = get("https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw", "eu.csv").replace(/^﻿/, "");
const euRows = csvRows(euText, ";");
const eh = euRows[0];
const ei = (n) => {
  const i = eh.indexOf(n);
  if (i < 0) throw new Error(`EU list: no column ${n}`);
  return i;
};
const [eDate, eId, eType, eProg, eAddr, eCit] = [ei("fileGenerationDate"), ei("Entity_LogicalId"), ei("Entity_SubjectType_ClassificationCode"), ei("Entity_Regulation_Programme"), ei("Address_CountryIso2Code"), ei("Citizenship_CountryIso2Code")];
const euDate = euRows[1]?.[eDate] ?? "";
const euById = new Map();
for (const r of euRows.slice(1)) {
  const id = r[eId];
  if (!id) continue;
  const e = euById.get(id) ?? { kind: r[eType] === "person" ? "person" : "entity", programmes: [], countries: [] };
  if (r[eProg]) e.programmes.push(r[eProg]);
  for (const c of [r[eAddr], r[eCit]]) {
    const cc = c && /^[A-Z]{2}$/.test(c) ? (c === "UK" ? "GB" : c === "EL" ? "GR" : c) : null;
    if (cc && SITE.has(cc)) e.countries.push(cc);
  }
  euById.set(id, e);
}
const eu = [...euById.values()];
if (eu.length < 3000) throw new Error(`EU: ${eu.length} entries`);

const US = tally(ofac);
const UKT = tally(uk);
const EUT = tally(eu);
fs.writeFileSync(
  OUT,
  `/**
 * Who is under sanctions, by country: the entries of three official lists tied to each country by an address there or a
 * nationality of it, and the programmes they are listed under - the US Treasury's SDN list (${ofacDate}, ${ofac.length.toLocaleString("en-US")} entries), the UK
 * Sanctions List (${ukDate}, ${uk.length.toLocaleString("en-US")}) and the EU's consolidated financial sanctions list (${euDate}, ${eu.length.toLocaleString("en-US")}). The counts are worked out here.
 *
 * GENERATED by build-sanctions.cjs on ${TODAY} — do not edit by hand; change the script and re-run it.
 */
export const SANCTIONS_SOURCES = {
  us: { label: "US Treasury, Office of Foreign Assets Control — Specially Designated Nationals and Blocked Persons List (${ofacDate})", url: "https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists" },
  uk: { label: "UK Foreign, Commonwealth & Development Office — the UK Sanctions List (${ukDate}; Open Government Licence v3.0)", url: "https://www.gov.uk/government/publications/the-uk-sanctions-list" },
  eu: { label: "European Commission — consolidated list of persons, groups and entities subject to EU financial sanctions (${euDate})", url: "https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions" },
};
export const SANCTIONS_TOTALS = { us: ${ofac.length}, uk: ${uk.length}, eu: ${eu.length} };
/** A list's entries tied to a country: [how many, how many of each kind (person, entity, vessel, aircraft), the programmes they are listed under, most first]. */
export type SanctionsTally = [entries: number, kinds: Record<string, number>, programmes: [name: string, entries: number][]];
export const SANCTIONS: Record<"us" | "uk" | "eu", Record<string, SanctionsTally>> = ${JSON.stringify({ us: US, uk: UKT, eu: EUT })};
`,
);
console.log(`wrote ${path.relative(__dirname, OUT)}: OFAC ${ofac.length} (${ofacDate}), UK ${uk.length} (${ukDate}), EU ${eu.length} (${euDate}); countries ${Object.keys(US).length} / ${Object.keys(UKT).length} / ${Object.keys(EUT).length}`);
console.log(`  samples: RU us ${US.RU?.[0]} uk ${UKT.RU?.[0]} eu ${EUT.RU?.[0]} · IR us ${US.IR?.[0]} · KP us ${US.KP?.[0]} · CN us ${US.CN?.[0]}`);
console.log(`  names not matched: ${[...unmatched].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([n, c]) => `${n} ${c}`).join("; ")}`);
