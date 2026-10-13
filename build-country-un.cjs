/**
 * Builds src/data/countryUn.ts - each country's place in the United Nations:
 * when it was admitted, the regional group it sits in, and its seat on the
 * Security Council - now, and the terms it has been elected to.
 *
 *   node build-country-un.cjs
 *
 * Sources - the United Nations' own pages, read as they stand:
 *
 *   Member States                https://www.un.org/en/about-us/member-states
 *     Each of the 193, with its date of admission.
 *   Regional groups              https://www.un.org/dgacm/en/content/regional-groups
 *     The five groups the General Assembly's seats are shared among, and the
 *     three special cases the page sets out (Israel, Türkiye, the United States).
 *   Security Council, current    https://main.un.org/securitycouncil/en/content/current-members
 *     The five permanent members, and the ten elected with the year each
 *     one's term ends.
 *   Security Council, elected    https://main.un.org/securitycouncil/en/content/countries-elected-members
 *     Every term each country has been elected to.
 *   Standard country codes       https://unstats.un.org/unsd/methodology/m49/overview/
 *     The UN Statistics Division's table, by which a country's name on those
 *     pages is matched to its ISO code.
 *
 * Nothing is worked out but two counts - the terms a country has served, and
 * how many members were admitted before it - and both are said to be counted
 * here. Every one of the 193 members must be matched to a code, and every
 * name on the other pages to a member, or the build stops: a name that is
 * not matched is not guessed at.
 *
 * The two non-member observer states, the Holy See and the State of
 * Palestine, are not on the members' page and are set down here from the
 * UN's page of them (https://www.un.org/en/about-us/non-member-states).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryUn.ts");
const CACHE = path.join(os.tmpdir(), "commonsphere-country-un");
fs.mkdirSync(CACHE, { recursive: true });
const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const THIS_YEAR = new Date().getFullYear();

const PAGES = {
  members: "https://www.un.org/en/about-us/member-states",
  groups: "https://www.un.org/dgacm/en/content/regional-groups",
  sc: "https://main.un.org/securitycouncil/en/content/current-members",
  scall: "https://main.un.org/securitycouncil/en/content/countries-elected-members",
  m49: "https://unstats.un.org/unsd/methodology/m49/overview/",
};
function page(name) {
  const at = path.join(CACHE, `${name}.html`);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "180", "-A", BROWSER, "-o", at, PAGES[name]], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${PAGES[name]}: could not be fetched`);
    }
  }
  return fs.readFileSync(at, "utf8");
}
const entities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&rsquo;|&lsquo;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;/g, " ");
/** A page as lines of text: one for each run of text between tags. */
const lines = (html) =>
  entities(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, "\n"))
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
/** A name as it is compared: lower case, without accents or marks, "the" and a footnote's star dropped. */
const fold = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[*]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/[^a-z' ()-]+/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();

/* ── The UN's names by ISO code ── */
const byName = new Map();
{
  const cells = (row) => [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => entities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim());
  const rows = page("m49").split(/<tr[^>]*>/i).slice(1).map(cells);
  const header = rows[0];
  const iCode = header.findIndex((c) => /alpha-?2/i.test(c));
  const iName = header.findIndex((c) => /country or area/i.test(c));
  if (iCode < 0 || iName < 0) throw new Error("the M49 table's columns were not found");
  for (const r of rows.slice(1)) {
    const code = (r[iCode] || "").trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && r[iName]) byName.set(fold(r[iName]), code);
  }
  if (byName.size < 240) throw new Error(`only ${byName.size} names were read from the M49 table`);
}
/* The short forms the Security Council's pages use, and a name the members' page writes another way than the M49 table. */
const ALIAS = {
  "united kingdom": "GB",
  "united states": "US",
  "united states of america": "US",
  "republic of korea": "KR",
  "democratic people's republic of korea": "KP",
  "cote d'ivoire": "CI",
  turkiye: "TR",
  "netherlands (kingdom of the)": "NL",
  netherlands: "NL",
  "bolivia": "BO",
  "venezuela": "VE",
  "iran": "IR",
  "syria": "SY",
  "tanzania": "TZ",
  "czech republic": "CZ",
  "viet nam": "VN",
  "micronesia": "FM",
  "gambia (republic of the)": "GM",
  gambia: "GM",
  bahamas: "BS",
  "bahamas (the)": "BS",
  "china (the people's republic of)": "CN",
  "venezuela bolivarian republic of": "VE",
  // The Council's page of past terms still writes two members by the names they then went by.
  turkey: "TR",
  "libyan arab jamahiriya": "LY",
  "guinea bissau": "GW",
  "timor leste": "TL",
};
const codeOf = (name) => byName.get(fold(name)) ?? ALIAS[fold(name)];

/* ── The members, each with its date of admission ── */
const out = {};
{
  const text = lines(page("members")).join(" | ");
  const found = [...text.matchAll(/\| ([^|]+?) \| Date of Admission: (\d{2})-(\d{2})-(\d{4})/g)];
  const missed = [];
  for (const [, name, d, m, y] of found) {
    const code = codeOf(name);
    if (!code) {
      missed.push(name);
      continue;
    }
    if (out[code]) throw new Error(`${name}: ${code} is on the members' page twice`);
    out[code] = { name: name.replace(/\*+$/, "").trim(), admitted: `${y}-${m}-${d}` };
  }
  if (missed.length) throw new Error(`members not matched to a code: ${missed.join("; ")}`);
  if (Object.keys(out).length !== 193) throw new Error(`${Object.keys(out).length} members were read, not 193`);
}
// How many were admitted before each: the founding members, admitted on the day the Charter came into force, are first together.
{
  const dates = Object.values(out).map((m) => m.admitted).sort();
  for (const m of Object.values(out)) m.nth = dates.filter((d) => d < m.admitted).length + 1;
}

/* ── The regional groups ── */
const GROUPS = ["African States", "Asia-Pacific States", "Eastern European States", "Latin American and Caribbean States", "Western European and other States"];
{
  const all = lines(page("groups"));
  const end = all.findIndex((l) => /^\*\s*Special cases/i.test(l));
  if (end < 0) throw new Error("the end of the regional groups was not found");
  let group = null;
  const missed = [];
  const seen = new Map();
  for (const l of all.slice(0, end)) {
    if (GROUPS.includes(l)) {
      // The page names each group once as a heading before its members; a later mention in running text is not one.
      group = l;
      continue;
    }
    if (!group || l.length > 60) continue;
    const code = codeOf(l);
    if (!code || !out[code]) {
      if (/^[A-Z]/.test(l) && !/Regional groups|Member States|^Print|^Share/i.test(l)) missed.push(`${l} (${group})`);
      continue;
    }
    if (!seen.has(code)) seen.set(code, []);
    seen.get(code).push(group);
  }
  for (const [code, groups] of seen) {
    // Türkiye is listed in two; the page says which it stands in for elections.
    out[code].group = groups.length > 1 && groups.includes("Western European and other States") ? "Western European and other States" : groups[0];
  }
  const without = Object.entries(out).filter(([, m]) => !m.group).map(([c, m]) => `${m.name} (${c})`);
  // Kiribati is in none of the groups, as the UN has long noted; any other member without one is a name that was not read.
  const allowed = new Set(["KI"]);
  const lost = Object.entries(out).filter(([c, m]) => !m.group && !allowed.has(c));
  if (lost.length) throw new Error(`members with no regional group read: ${without.join("; ")} | lines not matched: ${missed.slice(0, 12).join("; ")}`);
  // The special cases, as the page sets them out under the lists.
  if (out.IL) out.IL.groupNote = "a full member of the group since 2000, on a temporary basis that is renewed";
  if (out.TR) out.TR.groupNote = "it takes part in the Asia-Pacific group as well, and stands in this one for elections";
  if (out.US) out.US.groupNote = "not formally a member of any group: it attends this one as an observer and is counted in it for elections";
}

/* ── The Security Council: its members now ── */
const PERMANENT = ["CN", "FR", "RU", "GB", "US"];
{
  const text = lines(page("sc")).join(" ");
  const at = text.search(/with end of term year\)/i);
  const until = text.indexOf("Non-Council", at);
  if (at < 0 || until < 0) throw new Error("the Council's elected members were not found");
  const found = [...text.slice(at, until).matchAll(/([A-Z][A-Za-z' .-]+?)\s*\((\d{4})\)/g)];
  if (found.length !== 10) throw new Error(`${found.length} elected members of the Council were read, not 10`);
  for (const [, name, year] of found) {
    const code = codeOf(name);
    if (!code || !out[code]) throw new Error(`Council member not matched: ${name}`);
    out[code].council = Number(year);
  }
  for (const code of PERMANENT) {
    if (!out[code]) throw new Error(`permanent member ${code} is not among the members`);
    out[code].council = "permanent";
  }
}

/* ── The Security Council: every term a country has been elected to ── */
{
  const all = lines(page("scall"));
  let terms = 0;
  for (let i = 0; i + 1 < all.length; i++) {
    // A term is two years, or one where a country sat for a single year in the Council's early, split terms.
    if (!/^\d{4}(\s*-\s*\d{4})?(\s*,\s*\d{4}(\s*-\s*\d{4})?)*\s*$/.test(all[i + 1])) continue;
    const code = codeOf(all[i]);
    // A state that no longer exists - Czechoslovakia, Yugoslavia, the German Democratic Republic - is on the page and is no one's now.
    if (!code || !out[code]) continue;
    out[code].terms = all[i + 1].split(",").map((t) => {
      const [from, to] = t.trim().split(/\s*-\s*/).map(Number);
      return [from, to ?? from];
    });
    terms += out[code].terms.length;
  }
  const elected = Object.values(out).filter((m) => m.terms).length;
  if (elected < 120) throw new Error(`only ${elected} members were read as ever elected to the Council`);
  // Every member the Council's page says is elected now must have that term among its own.
  for (const [code, m] of Object.entries(out)) {
    if (typeof m.council === "number" && !(m.terms ?? []).some(([, to]) => to === m.council)) throw new Error(`${m.name} (${code}) is on the Council to ${m.council}, but that term is not among those it was elected to`);
  }
  console.log(`members: 193; ever elected to the Council: ${elected}, to ${terms} terms`);
}

const today = new Date().toISOString().slice(0, 10);
const body = Object.keys(out)
  .sort()
  .map((code) => {
    const m = out[code];
    const fields = [`name:${JSON.stringify(m.name)}`, `admitted:"${m.admitted}"`, `nth:${m.nth}`];
    if (m.group) fields.push(`group:${GROUPS.indexOf(m.group)}`);
    if (m.groupNote) fields.push(`groupNote:${JSON.stringify(m.groupNote)}`);
    if (m.council) fields.push(`council:${typeof m.council === "number" ? m.council : '"permanent"'}`);
    if (m.terms) fields.push(`terms:${JSON.stringify(m.terms)}`);
    return `  ${code}: {${fields.join(",")}},`;
  })
  .join("\n");

fs.writeFileSync(
  OUT,
  `/**
 * Each country's place in the United Nations: when it was admitted, the
 * regional group it sits in, and its seat on the Security Council - now, and
 * the terms it has been elected to.
 *
 * GENERATED by build-country-un.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Read from the United Nations' own pages as they stood that day. \`nth\` is
 * counted here: one more than the number of members admitted before it, the
 * ${Object.values(out).filter((m) => m.admitted === "1945-10-24").length} admitted on 24 October 1945 being first together.
 */
export const COUNTRY_UN_RETRIEVED = "${today}";

export const COUNTRY_UN_SOURCES = {
  members: { label: "United Nations — Member States, with dates of admission", url: "${PAGES.members}" },
  groups: { label: "United Nations — regional groups of Member States", url: "${PAGES.groups}" },
  council: { label: "United Nations Security Council — current members", url: "${PAGES.sc}" },
  terms: { label: "United Nations Security Council — countries elected members", url: "${PAGES.scall}" },
  observers: { label: "United Nations — non-member states", url: "https://www.un.org/en/about-us/non-member-states" },
};

/** The five regional groups the General Assembly's seats are shared among. */
export const UN_GROUPS = ${JSON.stringify(GROUPS)};
/** How many members sit in each, counted here from the lists. */
export const UN_GROUP_SIZE = ${JSON.stringify(GROUPS.map((g) => Object.values(out).filter((m) => m.group === g).length))};

export type CountryUn = {
  /** Its name as the United Nations writes it. */
  name: string;
  /** The date it was admitted, as year-month-day. */
  admitted: string;
  /** One more than the number of members admitted before it: counted here. */
  nth: number;
  /** Its regional group, by its place in UN_GROUPS; none for a member that sits in no group. */
  group?: number;
  /** Where its membership of the group is a special case, what the UN says of it. */
  groupNote?: string;
  /** On the Security Council now: a permanent member, or the year its elected term ends. */
  council?: "permanent" | number;
  /** Every term it has been elected to the Council for, as first and last year. */
  terms?: [number, number][];
};

export const COUNTRY_UN: Record<string, CountryUn> = {
${body}
};

/** The two states that are not members and have a standing invitation to take part as observers. */
export const UN_OBSERVERS: Record<string, string> = { VA: "Holy See", PS: "State of Palestine" };
`,
);
console.log(`written; the year is ${THIS_YEAR}`);
