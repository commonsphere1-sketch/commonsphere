/**
 * Builds src/data/countryPolitics.ts — each country's political parties and
 * the seats they hold in its legislature, behind the "Political parties"
 * panel of a country's window.
 *
 * Source: the CIA World Factbook's Government section, from the
 * factbook.json mirror - the final edition (January 2026; the CIA closed the
 * Factbook in February 2026). It is in the public domain. Per country:
 *
 *   Political parties             the parties it lists, by name
 *   Legislative branch -          for each chamber: its name, its seats, how
 *     lower / upper chamber       and for how long members are elected, the
 *                                 date of the most recent election, the seats
 *                                 each party won, and when the next is due
 *
 * Nothing is added or reworded beyond splitting the lists into their items.
 * Where a chamber's line of seats cannot be read as "party, seats" throughout,
 * the line is kept as the Factbook wrote it rather than half-parsed. The
 * Inter-Parliamentary Union keeps a fuller record, but under a
 * non-commercial licence, so it is not used.
 *
 * The Factbook's files are the ones build-country-geography.cjs reads, and
 * share its cache.
 *
 *   node build-country-politics.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "src/data/countryPolitics.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-geography");
fs.mkdirSync(CACHE, { recursive: true });
const REPO = "https://raw.githubusercontent.com/factbook/factbook.json/master";

/** Factbook entries with no internet country code of their own (as in build-country-geography.cjs). */
const BY_PATH = { GB: "europe/uk", UM: "australia-oceania/um", GS: "south-america/sx", SJ: "europe/sv", XK: "europe/kv", EH: "africa/wi" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cached(url, name) {
  const at = path.join(CACHE, name);
  if (fs.existsSync(at)) return fs.readFileSync(at, "utf8");
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const t = await res.text();
      fs.writeFileSync(at, t);
      return t;
    } catch (e) {
      if (i === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

const entities = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ndash;|&mdash;/g, "-");
const plain = (v) => entities(String((v && typeof v === "object" ? v.text : v) ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** The parties a country's entry lists: one a line in the Factbook. */
function partyList(field) {
  const raw = String((field && typeof field === "object" ? field.text : field) ?? "");
  if (!raw) return [];
  return raw
    .split(/<br\s*\/?>|\n/)
    .map((x) => plain(x).replace(/\s*[;,]$/, ""))
    .filter((x) => x && x.length <= 140 && !/^note\b/i.test(x) && !/^none\b/i.test(x) && !/^NA$/i.test(x));
}

/** "2/23/2025" → "2025-02-23"; anything else is kept as written. */
const isoDate = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : s;
};

/** A chamber's seats by party: "Name (ABBR) (164); Other (1)" or "SPD 23; CDU 17". All of it must read as party-and-seats, or none is taken. */
function seatsByParty(text) {
  if (!text) return null;
  const parts = text.split(/;\s*/).map((x) => x.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const m = /^(.*\S)\s*\((\d[\d,]*)\)$/.exec(p) || /^(.*\S)\s+(\d[\d,]*)$/.exec(p);
    if (!m) return null;
    out.push({ name: m[1].trim(), seats: +m[2].replace(/,/g, "") });
  }
  return out.length ? out : null;
}

function chamber(c, fallbackName) {
  if (!c || typeof c !== "object") return null;
  const name = plain(c["chamber name"] ?? c["legislature name"]) || fallbackName;
  const seatsText = plain(c["parties elected and seats per party"]);
  const parties = seatsByParty(seatsText);
  const out = {
    name,
    seats: plain(c["number of seats"]) || undefined,
    electoral: plain(c["electoral system"]) || undefined,
    term: plain(c["term in office"]) || undefined,
    // "full renewal" or "partial renewal": whether the seats listed are the whole chamber or only those contested.
    scope: plain(c["scope of elections"]) || undefined,
    lastElection: isoDate(plain(c["most recent election date"])) || undefined,
    nextElection: plain(c["expected date of next election"]) || undefined,
    parties: parties ?? undefined,
    partiesText: !parties && seatsText ? seatsText.slice(0, 400) : undefined,
  };
  for (const k of Object.keys(out)) if (out[k] === undefined || out[k] === "") delete out[k];
  return out.name && (out.parties || out.partiesText || out.seats) ? out : null;
}

(async () => {
  const bundle = path.join(CACHE, "countriesData.cjs");
  execSync(`npx esbuild src/data/countriesData.ts --bundle --format=cjs --platform=node --log-level=error --outfile="${bundle}"`, { cwd: __dirname, stdio: "inherit" });
  delete require.cache[bundle];
  const countries = require(bundle).countriesData;

  const tree = JSON.parse(await cached("https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1", "tree.json"));
  const files = tree.tree.filter((x) => x.type === "blob" && /^[a-z-]+\/[a-z]{2}\.json$/.test(x.path)).map((x) => x.path.replace(/\.json$/, ""));
  const byTld = new Map();
  for (const f of files) {
    const j = JSON.parse(await cached(`${REPO}/${f}.json`, f.replace("/", "__") + ".json"));
    const m = /\.([a-z]{2})\b/.exec(plain(j.Communications?.["Internet country code"]));
    if (!m) continue;
    const code = m[1].toUpperCase() === "UK" ? "GB" : m[1].toUpperCase();
    (byTld.get(code) || byTld.set(code, []).get(code)).push(f);
  }

  const out = {};
  let withSeats = 0;
  for (const c of countries) {
    const p = BY_PATH[c.code] ?? (byTld.get(c.code)?.length === 1 ? byTld.get(c.code)[0] : null);
    if (!p) continue;
    const g = JSON.parse(await cached(`${REPO}/${p}.json`, p.replace("/", "__") + ".json")).Government;
    if (!g) continue;
    const parties = partyList(g["Political parties"]);
    const legis = g["Legislative branch"];
    const lower = chamber(g["Legislative branch - lower chamber"], "Lower chamber");
    const upper = chamber(g["Legislative branch - upper chamber"], "Upper chamber");
    // A one-chamber legislature is described under "Legislative branch" itself.
    const single = !lower && !upper ? chamber(legis, plain(legis?.["legislature name"]) || "Legislature") : null;
    const chambers = [lower ?? single, upper].filter(Boolean);
    if (!parties.length && !chambers.length) continue;
    out[c.code] = { parties, chambers, structure: plain(legis?.["legislative structure"]) || undefined };
    if (chambers.some((x) => x.parties)) withSeats++;
  }
  const n = Object.keys(out).length;
  if (n < 180 || withSeats < 120) throw new Error(`only ${n} countries read, ${withSeats} with seats by party`);

  const today = new Date().toISOString().slice(0, 10);
  const q = (v) => JSON.stringify(v);
  const ch = (c) => `{ ${Object.entries(c).map(([k, v]) => `${k}: ${k === "parties" ? `[${v.map((x) => `[${q(x.name)}, ${x.seats}]`).join(", ")}]` : q(v)}`).join(", ")} }`;
  fs.writeFileSync(
    OUT,
    `/**
 * Each country's political parties, and the seats they hold in its
 * legislature.
 *
 * GENERATED by build-country-politics.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * From the CIA World Factbook's Government section, final edition (January
 * 2026), in the public domain: the parties each entry lists, and for each
 * chamber its name, size, electoral system, term, most recent election, the
 * seats each party won and when the next election is due. It is the record
 * as the Factbook left it: a government formed, a seat changed or an
 * election held since January 2026 is not in it.
 */
export const COUNTRY_POLITICS_SOURCE = {
  label: "CIA World Factbook, final edition (January 2026) — Government (public domain)",
  url: "https://github.com/factbook/factbook.json",
  retrieved: "${today}",
};

export type Chamber = {
  name: string;
  /** Its seats, as the Factbook describes them: "630 (all directly elected)". */
  seats?: string;
  electoral?: string;
  term?: string;
  /** "full renewal" or "partial renewal": whether the seats listed are the whole chamber or only those contested at the election. */
  scope?: string;
  /** The most recent election: a date (YYYY-MM-DD) where the Factbook gives one. */
  lastElection?: string;
  nextElection?: string;
  /** [party, seats won], in the Factbook's order. */
  parties?: [name: string, seats: number][];
  /** The seats line as written, where it does not read as party-and-seats throughout. */
  partiesText?: string;
};

export type CountryPolitics = {
  /** The parties the Factbook lists for the country. */
  parties: string[];
  /** The lower (or only) chamber first, then the upper. */
  chambers: Chamber[];
  /** "bicameral", "unicameral". */
  structure?: string;
};

/** ISO 3166-1 alpha-2 code → the country's parties and chambers. */
export const COUNTRY_POLITICS: Record<string, CountryPolitics> = {
${Object.keys(out).sort().map((code) => `  ${code}: { parties: ${q(out[code].parties)}, chambers: [${out[code].chambers.map(ch).join(", ")}]${out[code].structure ? `, structure: ${q(out[code].structure)}` : ""} },`).join("\n")}
};
`,
  );
  console.log(`wrote ${path.relative(__dirname, OUT)}: ${n} countries, ${withSeats} with seats by party`);
  for (const code of ["DE", "JP", "US", "GB", "IN", "CN", "NZ"]) {
    const o = out[code];
    console.log(`  ${code}: ${o ? `${o.parties.length} parties; ${o.chambers.map((c) => `${c.name} [${c.lastElection ?? "-"}] ${c.parties ? c.parties.map((x) => `${x.name} ${x.seats}`).join(", ").slice(0, 160) : `TEXT: ${(c.partiesText ?? "").slice(0, 100)}`}`).join(" || ")}` : "none"}`);
  }
  const textOnly = Object.entries(out).filter(([, o]) => o.chambers.some((c) => c.partiesText)).map(([k]) => k);
  console.log(`  seats kept as written (not parsed): ${textOnly.length} - ${textOnly.slice(0, 40).join(" ")}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
