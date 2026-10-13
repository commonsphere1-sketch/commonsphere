/**
 * Builds src/data/countryStatus.ts — what is being warned of in each country
 * now, for the Status report in a country's window: crises, outbreaks of
 * disease and disasters, as the public bodies that watch for them have them
 * on the day the file is built.
 *
 * Nobody publishes one "status" of a country, and none is made up here. The
 * file holds four official notices, each under its own name:
 *
 *   US Department of State,      The advisory in force for each destination:
 *     Travel Advisories          its level, 1 (exercise normal precautions)
 *     (public domain: a work     to 4 (do not travel), the day it was issued
 *     of the US government)      and the Department's own first sentence of
 *                                why. It is one government's advice to its
 *                                own citizens, and the page says so.
 *   UK Foreign, Commonwealth &   Whether the Office advises against travel -
 *     Development Office,        all travel or all but essential, to the
 *     foreign travel advice      whole country or to parts of it - the day
 *     (Open Government Licence   the advice was last changed, and the Office's
 *     v3.0)                      own note of that change. A second
 *                                government's advice, beside the first.
 *   US Centers for Disease       The travel health notices in force: an
 *     Control and Prevention,    outbreak or a health risk, its level 1 to 4,
 *     Travel Health Notices      and the day it was posted. A notice is a
 *     (public domain)            country's where its title names the country
 *                                or its list of countries does; one that
 *                                names more than a hundred countries is a
 *                                notice for the world, and is kept apart.
 *   Global Disaster Alert and    The orange and red alerts - earthquakes,
 *     Coordination System, the   cyclones, floods, eruptions, droughts,
 *     European Commission's      wildfires - that are current or ended within
 *     Joint Research Centre      the last 30 days, with the countries the
 *     with the United Nations    system lists as affected. Its pages carry
 *     (CC BY 4.0, under the      the Commission's copyright notice, which
 *     Commission's notice)       licenses what the EU owns under CC BY 4.0.
 *
 * Left out, because their terms do not allow a site that takes payment to
 * republish them: the World Health Organization's Disease Outbreak News
 * (non-commercial), EM-DAT's disaster records and ACLED's event data.
 *
 * A name is matched to its ISO code through the names GeoNames gives
 * (placesIndex.ts) and the list of other spellings below; a notice whose
 * country is not found is left out and printed, never guessed at.
 *
 * These are notices of the day, and go out of date: the file carries the day
 * it was read, and the page gives each notice's own date and a link to it.
 *
 *   node build-country-status.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "src/data/countryStatus.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-country-status");
fs.mkdirSync(CACHE, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);

const US_FEED = "https://travel.state.gov/_res/rss/TAsTWs.xml";
const UK_INDEX = "https://www.gov.uk/api/content/foreign-travel-advice";
const CDC_FEED = "https://wwwnc.cdc.gov/travel/rss/notices.xml";
/** How long ago a disaster alert may have ended and still be given. */
const HAZARD_DAYS = 30;
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const GDACS = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=orange;red&fromDate=${daysAgo(365)}&toDate=${TODAY}`;

async function cached(name, url) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 12 * 3600e3) return fs.readFileSync(at, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  return text;
}

/* ── Names to ISO codes ── */
const fold = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z' -]+/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();
const byName = new Map();
{
  const src = fs.readFileSync(path.join(__dirname, "src/data/placesIndex.ts"), "utf8");
  const m = src.match(/export const PLACE_COUNTRIES[^=]*= (\{.*\});/);
  if (!m) throw new Error("placesIndex.ts: the countries were not found");
  for (const [code, [name]] of Object.entries(JSON.parse(m[1]))) byName.set(fold(name), code);
  if (byName.size < 240) throw new Error(`only ${byName.size} country names were read`);
}
/* A country or territory as one of the four bodies writes it, where that is not GeoNames' name for it. */
const ALIAS = {
  bahamas: "BS",
  gambia: "GM",
  burma: "MM",
  "myanmar burma": "MM",
  palestine: "PS",
  "kyrgyz republic": "KG",
  "republic of congo": "CG",
  "congo": "CG",
  "republic of the congo": "CG",
  "democratic republic of the congo": "CD",
  "democratic republic of congo": "CD",
  "cote d'ivoire": "CI",
  "ivory coast": "CI",
  czechia: "CZ",
  "czech republic": "CZ",
  "cabo verde": "CV",
  "cape verde": "CV",
  macau: "MO",
  macao: "MO",
  "south korea": "KR",
  "north korea": "KP",
  "federated states of micronesia": "FM",
  micronesia: "FM",
  "french saint martin": "MF",
  "st martin and st barthelemy": "MF",
  "saint barthelemy": "BL",
  "sint maarten": "SX",
  "st maarten": "SX",
  "kingdom of denmark": "DK",
  "timor-leste": "TL",
  "east timor": "TL",
  turkey: "TR",
  turkiye: "TR",
  "usa": "US",
  "united states": "US",
  "st kitts and nevis": "KN",
  "st lucia": "LC",
  "st vincent and the grenadines": "VC",
  "st helena ascension and tristan da cunha": "SH",
  "st pierre and miquelon": "PM",
  "sao tome and principe": "ST",
  "the occupied palestinian territories": "PS",
  "occupied palestinian territories": "PS",
  "west bank": "PS",
  gaza: "PS",
  "pitcairn island": "PN",
  "falkland islands": "FK",
  "wallis and futuna": "WF",
  "bonaire": "BQ",
  "bonaire st eustatius saba": "BQ",
  "saba and sint eustatius": "BQ",
  eswatini: "SZ",
  "north macedonia": "MK",
  vatican: "VA",
  "vatican city": "VA",
  brunei: "BN",
  laos: "LA",
  vietnam: "VN",
  syria: "SY",
  russia: "RU",
  iran: "IR",
  moldova: "MD",
  tanzania: "TZ",
  bolivia: "BO",
  venezuela: "VE",
  taiwan: "TW",
  kosovo: "XK",
  "hong kong": "HK",
  curacao: "CW",
  "british virgin islands": "VG",
  "turks and caicos islands": "TC",
  "south georgia and south sandwich islands": "GS",
  "british indian ocean territory": "IO",
  "tristan da cunha": "SH",
  "st helena": "SH",
  "ascension island": "SH",
  reunion: "RE",
};
const codeOf = (name) => byName.get(fold(name)) ?? ALIAS[fold(name)];
const text = (html) =>
  html
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&rsquo;|&apos;/g, "’")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ ([,.;:])/g, "$1")
    .trim();
const isoDay = (s) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`a date could not be read: "${s}"`);
  return d.toISOString().slice(0, 10);
};
/** A health notice that names more countries than this is a notice for the world, given once and not country by country. */
const WORLDWIDE_FROM = 100;
const world = [];
const missed = [];
const out = {};
const at = (code) => (out[code] ??= {});

/* ── US Department of State ── */
async function unitedStates() {
  const xml = await cached("us.xml", US_FEED);
  const items = xml.split("<item>").slice(1);
  if (items.length < 150) throw new Error(`State Department: only ${items.length} advisories were read`);
  let n = 0;
  for (const it of items) {
    const title = text((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const m = title.match(/^(.*?)\s+-\s+Level ([1-4]):\s*(.*)$/);
    if (!m) {
      missed.push(`State Department: "${title}" is not an advisory with a level`);
      continue;
    }
    const name = m[1].replace(/ Travel Advisory$/, "").trim();
    const code = codeOf(name);
    if (!code) {
      missed.push(`State Department: ${name}`);
      continue;
    }
    const url = text((it.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");
    const issued = isoDay((it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]);
    // Its own first sentence: "Reconsider travel to Saudi Arabia due to risk of ...".
    const said = text((it.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "");
    const first = (said.match(/^(.*?[.!?])(?=\s|$)/) || [])[1];
    const row = { name, level: Number(m[2]), advice: m[3].trim(), issued, ...(first && first.length <= 420 && /\bdue to\b/i.test(first) ? { why: first } : {}), url };
    const list = (at(code).us ??= []);
    // The feed keeps an older notice beside a newer one for some places: the newer stands.
    const same = list.findIndex((r) => r.name === name);
    if (same < 0) list.push(row);
    else if (list[same].issued < issued) list[same] = row;
    n++;
  }
  return n;
}

/* ── UK Foreign, Commonwealth & Development Office ── */
async function unitedKingdom() {
  const index = JSON.parse(await cached("uk-index.json", UK_INDEX));
  const children = index.links.children;
  if (children.length < 200) throw new Error(`FCDO: only ${children.length} countries are listed`);
  let n = 0;
  const queue = [...children];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const name = c.details.country.name;
      const code = codeOf(name);
      if (!code) {
        missed.push(`FCDO: ${name}`);
        continue;
      }
      const d = JSON.parse(await cached(`uk-${c.details.country.slug}.json`, c.api_url));
      const status = d.details.alert_status;
      if (!Array.isArray(status)) throw new Error(`FCDO: ${name} has no alert status`);
      const row = {
        name,
        status,
        updated: isoDay(d.public_updated_at),
        ...(d.details.change_description ? { change: text(d.details.change_description).slice(0, 400) } : {}),
        url: `https://www.gov.uk${d.base_path}`,
      };
      // Two of the Office's pages can be one place by its code: the first read stands, and the second is said.
      if (at(code).uk) missed.push(`FCDO: ${name} is ${code}, which ${at(code).uk.name} already is`);
      else {
        at(code).uk = row;
        n++;
      }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return n;
}

/* ── US CDC ── */
async function cdc() {
  const xml = await cached("cdc.xml", CDC_FEED);
  const items = xml.split("<item>").slice(1);
  if (!items.length) throw new Error("CDC: no notices were read");
  // Every name a country goes by, longest first, so that "Democratic Republic of the Congo" is not read as the Congo.
  const names = [...new Set([...byName.keys(), ...Object.keys(ALIAS)])].sort((a, b) => b.length - a.length);
  let n = 0;
  for (const it of items) {
    const title = text((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const m = title.match(/^Level ([1-4]) - (.*)$/);
    if (!m) {
      missed.push(`CDC: "${title}" is not a notice with a level`);
      continue;
    }
    const url = text((it.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");
    const issued = isoDay((it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]);
    const said = text((it.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "");
    const codes = new Set();
    // The countries its own list names: the feed repeats the list as it grew, and the last is the whole of it.
    const lists = said.split(/Country List\s*:/).slice(1);
    if (lists.length) for (const part of lists[lists.length - 1].split(",")) if (codeOf(part)) codes.add(codeOf(part));
    // And those its title names.
    let rest = ` ${fold(m[2].replace(/\bin the\b|\bin\b|\band\b|\bof\b/gi, (w) => ` ${w} `))} `;
    for (const nm of names) {
      const i = rest.indexOf(` ${nm} `);
      if (i < 0) continue;
      codes.add(codeOf(nm));
      rest = `${rest.slice(0, i)} | ${rest.slice(i + nm.length + 2)}`;
    }
    if (!codes.size) {
      missed.push(`CDC: no country was found for "${m[2]}"`);
      continue;
    }
    const notice = { level: Number(m[1]), title: m[2].trim(), issued, url, ...(codes.size > 1 ? { among: codes.size } : {}) };
    if (codes.size > WORLDWIDE_FROM) world.push(notice);
    else for (const code of codes) (at(code).health ??= []).push(notice);
    n++;
  }
  return n;
}

/* ── GDACS ── */
const HAZARDS = { EQ: "Earthquake", TC: "Tropical cyclone", FL: "Flood", VO: "Volcanic eruption", DR: "Drought", WF: "Wildfire", TS: "Tsunami" };
async function gdacs() {
  const d = JSON.parse(await cached("gdacs.json", GDACS));
  if (!Array.isArray(d.features)) throw new Error("GDACS: no list of events");
  const since = daysAgo(HAZARD_DAYS);
  let n = 0;
  for (const f of d.features) {
    const p = f.properties;
    const kind = HAZARDS[p.eventtype];
    if (!kind) throw new Error(`GDACS: an event of a kind not known, ${p.eventtype}`);
    if (!/^(Orange|Red)$/.test(p.alertlevel)) continue;
    const to = String(p.todate).slice(0, 10);
    const current = p.iscurrent === "true";
    if (!current && to < since) continue;
    const row = {
      kind,
      ...(p.eventname ? { name: String(p.eventname).trim() } : {}),
      alert: p.alertlevel,
      from: String(p.fromdate).slice(0, 10),
      to,
      ...(current ? { current: true } : {}),
      ...(p.severitydata?.severitytext ? { said: text(String(p.severitydata.severitytext)) } : {}),
      url: p.url.report,
    };
    let any = false;
    for (const c of p.affectedcountries ?? []) {
      const code = /^[A-Z]{2}$/.test(c.iso2 ?? "") ? c.iso2 : codeOf(c.countryname ?? "");
      if (!code) {
        if (c.countryname) missed.push(`GDACS: ${c.countryname}`);
        continue;
      }
      const list = (at(code).hazards ??= []);
      if (!list.some((r) => r.url === row.url)) list.push({ ...row, ...((p.affectedcountries ?? []).length > 1 ? { among: p.affectedcountries.length } : {}) });
      any = true;
    }
    if (any) n++;
  }
  return n;
}

(async () => {
  const us = await unitedStates();
  const uk = await unitedKingdom();
  const health = await cdc();
  const hazards = await gdacs();
  for (const v of Object.values(out)) {
    v.us?.sort((a, b) => a.name.localeCompare(b.name));
    v.health?.sort((a, b) => b.level - a.level || b.issued.localeCompare(a.issued));
    v.hazards?.sort((a, b) => Number(Boolean(b.current)) - Number(Boolean(a.current)) || b.to.localeCompare(a.to));
  }
  const codes = Object.keys(out).sort();
  const count = (k) => codes.filter((c) => out[c][k]).length;
  if (count("us") < 180 || count("uk") < 200) throw new Error(`too few countries: ${count("us")} with a US advisory, ${count("uk")} with UK advice`);

  fs.writeFileSync(
    OUT,
    `/**
 * What is being warned of in each country now: crises, outbreaks of disease
 * and disasters, as four public bodies had them on ${TODAY}.
 *
 * GENERATED by build-country-status.cjs on ${TODAY} — do not edit by hand;
 * change the script and re-run it.
 *
 * Nobody publishes one "status" of a country, and none is made up here: each
 * notice is its body's own, under its name, with its date and a link. The
 * two travel advisories are governments' advice to their own citizens. All
 * of it is of the day it was read and goes out of date.
 */
export const COUNTRY_STATUS_RETRIEVED = "${TODAY}";
export const COUNTRY_STATUS_SOURCES = {
  us: { label: "US Department of State — Travel Advisories (public domain)", url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html" },
  uk: { label: "UK Foreign, Commonwealth & Development Office — Foreign travel advice (Open Government Licence v3.0)", url: "https://www.gov.uk/foreign-travel-advice" },
  cdc: { label: "US Centers for Disease Control and Prevention — Travel Health Notices (public domain)", url: "https://wwwnc.cdc.gov/travel/notices" },
  gdacs: { label: "Global Disaster Alert and Coordination System — European Commission Joint Research Centre and the United Nations (CC BY 4.0)", url: "https://www.gdacs.org/" },
};
/** How many days ago a disaster alert may have ended and still be given. */
export const HAZARD_DAYS = ${HAZARD_DAYS};

/** The State Department's advisory for a destination: its level, 1 to 4, its own words for the level, the day it was issued, and its first sentence of why. */
export type UsAdvisory = { name: string; level: 1 | 2 | 3 | 4; advice: string; issued: string; why?: string; url: string };
/** The Foreign Office's advice: which of its four warnings against travel are in force (none where it advises against none), the day it last changed, and its note of the change. */
export type UkAdvice = { name: string; status: string[]; updated: string; change?: string; url: string };
/** A CDC travel health notice, level 1 to 4; \`among\` is how many countries it names, where it names more than this one. */
export type HealthNotice = { level: 1 | 2 | 3 | 4; title: string; issued: string; url: string; among?: number };
/** A disaster alert: orange or red, current or ended within the last ${HAZARD_DAYS} days; \`among\` is how many countries it lists as affected, where more than this one. */
export type Hazard = { kind: string; name?: string; alert: "Orange" | "Red"; from: string; to: string; current?: true; said?: string; url: string; among?: number };
export type CountryStatus = { us?: UsAdvisory[]; uk?: UkAdvice; health?: HealthNotice[]; hazards?: Hazard[] };

/** The CDC's notices that name more than ${WORLDWIDE_FROM} countries: for the world, and given once. */
export const WORLD_HEALTH_NOTICES: HealthNotice[] = ${JSON.stringify(world)};

/** By ISO code. A country with no entry, or without one of the four, has no notice of that kind: it is not a finding that all is well. */
export const COUNTRY_STATUS: Record<string, CountryStatus> = {
${codes.map((c) => `  ${c}: ${JSON.stringify(out[c])},`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}`);
  console.log(`  US advisories ${us} (${count("us")} countries); UK advice ${uk}; CDC notices ${health} (${count("health")} countries); disaster alerts ${hazards} (${count("hazards")} countries)`);
  if (missed.length) console.log(`  left out (${missed.length}):\n    ${missed.join("\n    ")}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
