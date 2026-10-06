#!/usr/bin/env node
/**
 * build-dependencies.cjs
 *
 * Every dependency the CIA World Factbook lists, set against the places the
 * site holds, so that each state's card names all of its territories and
 * dependencies. Written to src/data/dependencies.ts, for the Territories &
 * Dependencies section of a country's window.
 *
 * SOURCE
 *   CIA World Factbook (public domain), in its final edition. The CIA closed
 *   the Factbook in February 2026; the factbook.json mirror
 *   (github.com/factbook/factbook.json) holds the last copy it took, and the
 *   date of that copy is read from the mirror and written out with the data.
 *   An entry is a dependency where the Factbook gives it a "Dependency
 *   status", and the state that administers it is the one that status names.
 *
 * WHAT IT DOES
 *   The site has a card for every place on the ISO 3166-1 list. The Factbook
 *   lists a few dependencies ISO has no entry for, and ISO lists as one place
 *   a few the Factbook lists apart (Svalbard and Jan Mayen; the United States
 *   Minor Outlying Islands). So the run
 *     - checks that every Factbook dependency with a card is tied, on the
 *       site, to the state the Factbook names - and stops if one is not;
 *     - checks that every place the site ties to a state is a Factbook
 *       dependency, apart from the seven ISO lists that the Factbook counts
 *       within the country (Åland, the Caribbean Netherlands and France's
 *       five overseas regions);
 *     - writes out the dependencies that have no card, under the state that
 *       administers each, with the Factbook's status, location and area and
 *       whether anyone lives there;
 *     - writes out, for a card that stands for several Factbook entries, the
 *       names of those entries;
 *     - writes out the Factbook's own status for each dependency with a card,
 *       which the page shows beside its shorter one.
 *
 * Nothing is listed that the Factbook does not list, and no figure is worked
 * out. A dependency the run cannot place stops it, so one is never dropped
 * without notice.
 *
 * Usage:  node build-dependencies.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/dependencies.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-dependencies");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const MIRROR = "https://github.com/factbook/factbook.json";
const RAW = "https://raw.githubusercontent.com/factbook/factbook.json/master";
const API = "https://api.github.com/repos/factbook/factbook.json";

function get(url, name) {
  const at = path.join(CACHE, name);
  if (!fs.existsSync(at)) {
    let failure = "";
    for (let attempt = 1; attempt <= 3 && !fs.existsSync(at); attempt++) {
      try {
        execFileSync("curl", ["-sSfL", "-m", "120", "-A", UA, "-o", at, url], { stdio: ["ignore", "ignore", "pipe"] });
      } catch (e) {
        fs.rmSync(at, { force: true });
        failure = String(e.stderr || e.message).trim().split("\n")[0];
        execSync(process.platform === "win32" ? "ping -n 11 127.0.0.1 > NUL" : "sleep 10");
      }
    }
    if (!fs.existsSync(at)) throw new Error(`${url}: ${failure}`);
  }
  return fs.readFileSync(at, "utf8");
}

const clean = (s) =>
  (s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.)])/g, "$1")
    .replace(/\(\s+/g, "(")
    .trim();
const firstClause = (s) => s.split(";")[0].trim();
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** The site's places, as the page has them. */
function loadCountries() {
  const bundle = path.join(CACHE, "countries.bundle.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  return require(bundle).countriesData;
}

/** The states the Factbook's dependency statuses name, as each is written there. */
const STATES = [
  [/\bAustralia\b/, "AU"],
  [/\bChina\b/, "CN"],
  [/\bDenmark\b/, "DK"],
  [/\bFrance\b/, "FR"],
  [/\bNetherlands\b/, "NL"],
  [/\bNew Zealand\b/, "NZ"],
  [/\bNorway\b/, "NO"],
  [/\b(UK|British)\b/, "GB"],
  [/\bUS\b/, "US"],
];
function stateOf(status, entry) {
  const found = STATES.filter(([re]) => re.test(firstClause(status))).map(([, code]) => code);
  if (found.length !== 1) throw new Error(`${entry}: the status "${firstClause(status)}" names ${found.length ? found.join(" and ") : "no state the run knows"}`);
  return found[0];
}

/**
 * Factbook entries with no internet country code of their own that an ISO
 * 3166-1 entry covers: South Georgia has the code GS, and ISO lists Jan Mayen
 * with Svalbard (SJ) and the nine minor US islands as one place (UM).
 */
const CARD_BY_PATH = {
  "south-america/sx": "GS",
  "europe/jn": "SJ",
  "australia-oceania/um": "UM",
  "australia-oceania/wq": "UM",
  "central-america-n-caribbean/bq": "UM",
};
/**
 * Dependencies ISO 3166-1 has no entry for, so the site has no card for them:
 * Ashmore and Cartier Islands, the Coral Sea Islands, Clipperton Island,
 * Akrotiri and Dhekelia. Named so that another turning up stops the run.
 */
const NO_CARD = new Set(["australia-oceania/at", "australia-oceania/cr", "north-america/ip", "europe/ax", "europe/dx"]);
/**
 * Places the site ties to a state that are not Factbook dependencies: ISO
 * lists them, and the Factbook counts them within the country - Åland, the
 * Caribbean Netherlands, and French Guiana, Guadeloupe, Martinique, Réunion
 * and Mayotte.
 */
const WITHIN_THE_COUNTRY = new Set(["AX", "BQ", "GF", "GP", "MQ", "RE", "YT"]);

function main() {
  // When the mirror last copied the Factbook: its newest "auto-update" commit.
  const commits = JSON.parse(get(`${API}/commits?per_page=100`, `commits-${TODAY}.json`));
  const lastCopy = commits.find((c) => /^auto-update\b/i.test(c.commit?.message ?? ""));
  if (!lastCopy) throw new Error("The mirror's recent commits hold no auto-update: read its history again for the date of its last copy");
  const edition = lastCopy.commit.committer.date.slice(0, 10);

  const tree = JSON.parse(get(`${API}/git/trees/master?recursive=1`, `tree-${TODAY}.json`));
  const paths = tree.tree.filter((n) => n.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(n.path)).map((n) => n.path.replace(/\.json$/, ""));
  if (paths.length < 250) throw new Error(`The mirror lists only ${paths.length} entries`);

  const site = loadCountries();
  const byCode = new Map(site.map((c) => [c.code, c]));

  /** Factbook dependency entries each card stands for, and the dependencies with no card, by state. */
  const covers = {};
  const uncarded = {};
  const statusOf = {};
  let listed = 0;

  for (const p of paths) {
    const j = JSON.parse(get(`${RAW}/${p}.json`, `${p.replace("/", "_")}.json`));
    const gov = j.Government ?? {};
    const status = clean(gov["Dependency status"]?.text);
    if (!status) continue;
    listed++;
    const names = gov["Country name"] ?? {};
    const short = clean(names["conventional short form"]?.text);
    const name = (short && short !== "none" ? short : clean(names["conventional long form"]?.text)).replace(/\s*\([^)]*\)/g, "").trim();
    if (!name || name === "none") throw new Error(`${p}: no name`);
    const state = stateOf(status, p);

    const tld = clean(j.Communications?.["Internet country code"]?.text).match(/^\.([a-z]{2})\b/)?.[1].toUpperCase();
    const code = tld && byCode.has(tld) ? tld : CARD_BY_PATH[p];
    if (code) {
      const place = byCode.get(code);
      if (!place) throw new Error(`${p} (${name}): the site has no place ${code}`);
      if (place.sovereign !== state) throw new Error(`${name}: the Factbook has it under ${state} ("${firstClause(status)}"), the site under ${place.sovereign ?? "no state"}`);
      // One entry can name several islands (the US Pacific refuges).
      (covers[code] ||= []).push(...(p === "australia-oceania/um" ? name.split(/,\s*/) : [name]));
      (statusOf[code] ||= []).push({ name, status: capital(status) });
      continue;
    }
    if (!NO_CARD.has(p)) throw new Error(`${p} (${name}): a dependency the site has no card for, and not one the run knows of - add its card, or name it in NO_CARD`);

    const geo = j.Geography ?? {};
    const area = geo.Area ?? {};
    const totalKey = Object.keys(area).find((k) => k.trim() === "total");
    const total = clean(totalKey ? area[totalKey]?.text : area.text).match(/^([\d,.]+) sq km( less than)?/);
    if (!total) throw new Error(`${name}: no area`);
    const location = firstClause(clean(geo.Location?.text));
    if (!location) throw new Error(`${name}: no location`);
    const people = j["People and Society"]?.Population ?? {};
    const peopleText = clean(people.total?.text ?? people.text);
    if (!peopleText) throw new Error(`${name}: nothing on its population`);
    const flagState = clean(gov.Flag?.text ?? gov["Flag description"]?.text).match(/^the flag of (?:the )?(.+?) is used/);
    const flag = flagState ? stateOf(flagState[1], `${p} flag`) : undefined;
    if (flag && flag !== state) throw new Error(`${name}: flies the flag of ${flag}, administered by ${state}`);

    (uncarded[state] ||= []).push({
      name,
      status: capital(firstClause(status)),
      statusFull: capital(status),
      location,
      areaKm2: Number(total[1].replace(/,/g, "")),
      ...(total[2] ? { areaUnder: true } : {}),
      uninhabited: /\b(uninhabited|no permanent inhabitants)\b/i.test(peopleText),
      ...(flag ? { flag } : {}),
    });
  }
  if (listed < 45) throw new Error(`Only ${listed} entries carry a dependency status`);

  // Every place the site ties to a state is a Factbook dependency, or one of the seven within a country.
  for (const c of site) {
    if (!c.sovereign) continue;
    const inFactbook = Boolean(covers[c.code]);
    if (WITHIN_THE_COUNTRY.has(c.code)) {
      if (inFactbook) throw new Error(`${c.name}: named as within its country, yet the Factbook lists it as a dependency`);
    } else if (!inFactbook) throw new Error(`${c.name}: tied to ${c.sovereign} on the site, and no Factbook dependency`);
  }

  // A card stands for several entries where it has more than one, or where one entry names several islands.
  const cardCovers = Object.fromEntries(
    Object.entries(covers)
      .filter(([, names]) => names.length > 1)
      .map(([code, names]) => [code, [...new Set(names)].sort((a, b) => a.localeCompare(b))])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  for (const list of Object.values(uncarded)) list.sort((a, b) => a.name.localeCompare(b.name));
  // Each card's status in the Factbook's words; a card standing for several entries has each, by name, unless they agree.
  const factbookStatus = Object.fromEntries(
    Object.entries(statusOf)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, list]) => [code, new Set(list.map((e) => e.status)).size === 1 ? list[0].status : list.map((e) => `${e.name}: ${e.status.charAt(0).toLowerCase()}${e.status.slice(1)}`).join(" · ")]),
  );
  const uncardedCount = Object.values(uncarded).reduce((n, l) => n + l.length, 0);
  if (uncardedCount !== NO_CARD.size) throw new Error(`${uncardedCount} dependencies with no card, where ${NO_CARD.size} are named`);

  const month = new Date(`${edition}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  fs.writeFileSync(
    OUT,
    `/**
 * The dependencies the CIA World Factbook lists that have no card on the
 * site, and the Factbook entries a card stands for where ISO 3166-1 lists
 * several as one place.
 *
 * GENERATED by build-dependencies.cjs on ${TODAY} — do not edit by hand; change
 * the script and re-run it. The script checks every Factbook dependency
 * against the site's places and stops if one is missing or under another
 * state.
 *
 * From the Factbook's final edition: the CIA closed it in February 2026, and
 * the factbook.json mirror last copied it on ${edition}.
 */
export const DEPENDENCIES_RETRIEVED = "${TODAY}";
/** The day the mirror last copied the Factbook. */
export const FACTBOOK_LAST_COPY = "${edition}";

export const DEPENDENCIES_SOURCE = {
  label: "CIA World Factbook, final edition (${month}) — dependency status, from the factbook.json archive",
  url: "${MIRROR}",
} as const;

/** A dependency the Factbook lists that ISO 3166-1 has no entry for, so it has no card of its own. */
export interface ListedDependency {
  name: string;
  /** The Factbook's dependency status: its first clause, and the whole of it. */
  status: string;
  statusFull: string;
  /** Where it is, in the Factbook's words. */
  location: string;
  areaKm2: number;
  /** The Factbook gives the area as less than this. */
  areaUnder?: boolean;
  /** No permanent population. */
  uninhabited: boolean;
  /** The state whose flag it flies, where the Factbook says it uses that flag. */
  flag?: string;
}

/** How many Factbook entries carry a dependency status. */
export const FACTBOOK_DEPENDENCIES = ${listed};

/** The dependencies with no card, by the ISO code of the state that administers them. */
export const UNCARDED_DEPENDENCIES: Record<string, ListedDependency[]> = ${JSON.stringify(Object.fromEntries(Object.entries(uncarded).sort(([a], [b]) => a.localeCompare(b))), null, 2)};

/** The Factbook's entries that one card stands for, where ISO 3166-1 lists them as one place: by the card's code. */
export const CARD_COVERS: Record<string, string[]> = ${JSON.stringify(cardCovers, null, 2)};

/** The Factbook's dependency status for each dependency with a card, in its own words: by the card's code. */
export const FACTBOOK_STATUS: Record<string, string> = ${JSON.stringify(factbookStatus, null, 2)};
`,
  );

  console.log(`The Factbook's last copy: ${edition}. ${listed} entries carry a dependency status; ${Object.keys(covers).length} cards stand for ${Object.values(covers).reduce((n, l) => n + l.length, 0)} of them, ${uncardedCount} have no card.`);
  for (const [state, list] of Object.entries(uncarded).sort()) for (const d of list) console.log(`  ${state}  ${d.name}: ${d.status} · ${d.areaUnder ? "under " : ""}${d.areaKm2} km² · ${d.uninhabited ? "uninhabited" : "inhabited"} · ${d.location}`);
  for (const [code, names] of Object.entries(cardCovers)) console.log(`  ${code} stands for: ${names.join(", ")}`);
  console.log("\nStatus on the site, against the Factbook's:");
  for (const [code, statuses] of Object.entries(statusOf).sort()) {
    const c = byCode.get(code);
    console.log(`  ${code}  ${(c.sovereignStatus ?? c.governmentType).padEnd(72)} | ${[...new Set(statuses.map((e) => firstClause(e.status)))].join(" / ")}`);
  }
  console.log(`\nWrote ${path.relative(__dirname, OUT)}.`);
}

main();
