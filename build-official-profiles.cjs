/**
 * Builds src/data/officialProfiles.ts — what the States page's explorer of
 * elected officials says of one of them once picked: schooling and career,
 * where their votes place them, and the money their campaign has reported.
 *
 *   Wikipedia, each         education, occupation, military service and the
 *     official's article    offices held, as the article's infobox lists them.
 *                           A value that does not read cleanly is left out,
 *                           not repaired.
 *   unitedstates/           each member's terms in the House and the Senate
 *     congress-legislators  (the same reading build-state-offices.cjs made)
 *   Voteview                the DW-NOMINATE first-dimension score of each
 *                           member of the 119th Congress: where the member's
 *                           roll-call votes place them, from -1 (most
 *                           liberal) to +1 (most conservative). Governors and
 *                           mayors have none, and none is made up
 *   Federal Election        weball26 - each candidate's totals for 2025-26;
 *     Commission, bulk      cm26 - the committees; itpas2 - what each
 *     data                  committee reports giving to, or spending for or
 *                           against, a candidate. Committees and totals
 *                           only: no contributor's name is read
 *
 * A campaign for governor or mayor reports to its state or city, not to the
 * FEC, so those officials carry no money here.
 *
 * What is worked out here, and nothing else: a member's place in the order of
 * their chamber's scores, each party's median score in each chamber, how many
 * committees gave, and the sums of each committee's gifts.
 *
 *   node build-state-offices.cjs && node build-official-profiles.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { unzip } = require("./xlsx-lite.cjs");

const OUT = path.join(__dirname, "src/data/officialProfiles.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-official-profiles");
/** build-state-offices.cjs's cache: the reading of Congress the page's officials came from. */
const SHARED = path.join(os.tmpdir(), "commonsphere-state-offices");
fs.mkdirSync(CACHE, { recursive: true });

const CYCLE = 2026;
const FEC = (file) => `https://www.fec.gov/files/bulk-downloads/${CYCLE}/${file}`;
const VOTEVIEW = "https://voteview.com/static/data/out/members/HS119_members.csv";
/** The committee the request for this pane named: its gifts are listed for a member even when it is not among the largest. */
const NAMED_COMMITTEES = ["C00797670"]; // American Israel Public Affairs Committee Political Action Committee

function fetchFile(args, name, dir = CACHE) {
  const at = path.join(dir, name);
  if (!fs.existsSync(at)) {
    try {
      execFileSync("curl", ["-sSfL", "-m", "300", "-A", UA, "-o", at, ...args], { stdio: ["ignore", "ignore", "pipe"] });
    } catch {
      fs.rmSync(at, { force: true });
      throw new Error(`${name}: could not be fetched`);
    }
  }
  return at;
}
const zipped = (file, entry) => {
  const got = unzip(fetchFile([FEC(file)], file));
  const name = [...got.keys()].find((k) => k.toLowerCase() === entry.toLowerCase());
  if (!name) throw new Error(`${file}: no ${entry} inside (${[...got.keys()].join(", ")})`);
  return got.get(name).toString("latin1");
};
const lines = (text) => text.split("\n").filter(Boolean).map((l) => l.replace(/\r$/, "").split("|"));

// ── Who the page holds ──────────────────────────────────────────────────────
const officesSrc = fs.readFileSync(path.join(__dirname, "src/data/stateOffices.ts"), "utf8").replace(/\r\n/g, "\n");
const memberIds = new Set([...officesSrc.matchAll(/\{ id: "([A-Z]\d{6})", name: "/g)].map((m) => m[1]));
const governors = [...officesSrc.matchAll(/\n  ([a-z]{2}): \{\n[^\n]*\n[^\n]*\n    governor: \{ name: "([^"]+)"([^\n]*)\},/g)].map((m) => ({ key: `gov-${m[1]}`, name: m[2], wiki: /wiki: "([^"]+)"/.exec(m[3])?.[1] ?? null }));
const mayorsAt = officesSrc.indexOf("export const BIG_CITY_MAYORS");
const mayors = officesSrc
  .slice(mayorsAt)
  .split("\n")
  .filter((l) => l.startsWith('  {"name":'))
  .map((l) => JSON.parse(l.replace(/,$/, "")))
  .map((m) => ({ key: `mayor-${m.rank}`, name: m.name, wiki: m.wiki }));
if (memberIds.size < 520 || governors.length !== 50 || mayors.length !== 50) throw new Error(`stateOffices.ts: ${memberIds.size} members, ${governors.length} governors, ${mayors.length} mayors — run build-state-offices.cjs first`);

const people = JSON.parse(fs.readFileSync(fetchFile(["https://unitedstates.github.io/congress-legislators/legislators-current.json"], "legislators-current.json", SHARED), "utf8")).filter((p) => memberIds.has(p.id.bioguide));
if (people.length !== memberIds.size) throw new Error(`congress-legislators holds ${people.length} of the page's ${memberIds.size} members`);

// ── Wikipedia: each article's opening, where the infobox is ─────────────────
function wikiLeads(titles) {
  const out = new Map();
  const want = [...new Set(titles.filter(Boolean))];
  for (let i = 0; i < want.length; i += 20) {
    const batch = want.slice(i, i + 20);
    const name = `wp-${crypto.createHash("sha1").update(batch.join("|")).digest("hex").slice(0, 16)}.json`;
    const args = ["-G", "https://en.wikipedia.org/w/api.php"];
    for (const [k, v] of Object.entries({ action: "query", prop: "revisions", rvprop: "content|ids|timestamp", rvslots: "main", rvsection: "0", redirects: "1", format: "json", formatversion: "2", titles: batch.join("|") })) args.push("--data-urlencode", `${k}=${v}`);
    const j = JSON.parse(fs.readFileSync(fetchFile(args, name), "utf8"));
    if (!j.query) throw new Error(`Wikipedia: no pages for ${batch[0]}…`);
    const to = new Map();
    for (const n of j.query.normalized || []) to.set(n.from, n.to);
    for (const r of j.query.redirects || []) to.set(r.from, r.to);
    const pages = new Map(j.query.pages.map((p) => [p.title, p]));
    for (const t of batch) {
      let at = t;
      for (let hop = 0; hop < 3 && to.has(at); hop++) at = to.get(at);
      const p = pages.get(at);
      const rev = p?.revisions?.[0];
      if (rev?.slots?.main?.content) out.set(t, { title: p.title, revid: rev.revid, text: rev.slots.main.content });
    }
  }
  return out;
}

// ── Reading an infobox ──────────────────────────────────────────────────────
/** The parameters of the template that opens at `start`, top level only: what is nested inside a value stays in the value. */
function paramsAt(text, start) {
  let i = start + 2;
  let depth = 2;
  let link = 0;
  const parts = [];
  let cur = "";
  while (i < text.length && depth > 0) {
    if (text.startsWith("{{", i)) { depth += 2; cur += "{{"; i += 2; continue; }
    if (text.startsWith("}}", i)) { depth -= 2; if (depth > 0) cur += "}}"; i += 2; continue; }
    if (text.startsWith("[[", i)) { link++; cur += "[["; i += 2; continue; }
    if (text.startsWith("]]", i)) { link = Math.max(0, link - 1); cur += "]]"; i += 2; continue; }
    if (text[i] === "|" && depth === 2 && link === 0) { parts.push(cur); cur = ""; i++; continue; }
    cur += text[i++];
  }
  parts.push(cur);
  const out = new Map();
  for (const p of parts.slice(1)) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const k = p.slice(0, eq).trim().toLowerCase().replace(/[ ]+/g, "_");
    const v = p.slice(eq + 1).trim();
    if (v && !out.has(k)) out.set(k, v);
  }
  return out;
}
/** Every infobox in the text, nested ones too, in the order they open. */
const infoboxes = (text) => [...text.matchAll(/\{\{\s*Infobox[ _]+([A-Za-z ]+?)\s*(?=[|\n<])/gi)].map((m) => ({ kind: m[1].trim().toLowerCase(), params: paramsAt(text, m.index) }));

const SEP = "\u0001";
const unknownTemplates = new Map();
const FORCES = { army: "Army", navy: "Navy", "air force": "Air Force", marines: "Marine Corps", "marine corps": "Marine Corps", "coast guard": "Coast Guard", "space force": "Space Force" };
const LISTS = new Set(["ubl", "unbulleted list", "ublist", "unbulleted", "plainlist", "plain list", "flatlist", "flat list", "hlist", "bulleted list", "blist", "cslist", "collapsible list", "indented plainlist", "tree list", "flowlist", "br separated entries", "startplainlist"]);
const WRAPS = new Set(["nowrap", "nobr", "nobreak", "nowr", "no wrap", "nwr", "small", "smaller", "big", "large", "nobold", "normal", "noitalic", "awrap", "avoid wrap", "wrap", "abbr", "tooltip", "ill", "interlanguage link", "illm", "linktext", "plain text", "longitem", "allow wrap", "nihongo", "sortname", "marriage", "age", "birth year and age", "flag", "flagu", "flagcountry", "flag country", "center", "raise", "align"]);
const LASTS = new Set(["resize", "font", "lang", "transl", "transliteration", "color", "font color"]);
const DATES = new Set(["start date", "start date and age", "startdate", "end date", "end date and age", "birth date", "birth date and age", "death date", "death date and age", "dts", "date"]);
const DROPS = /^(efn|efn-ua|efn-lr|refn|sfn|sfnp|harvnb|harv|cn|citation needed|cite .*|r|rp|notetag|ref label|note label|note|better source needed|clarify|dubious|failed verification|update inline|fact|when|who|nb|#tag:ref.*|flagicon|flagicon image|flag icon|flagdeco|collapsed infobox section begin|collapsed infobox section end|infobox .*|sup|sub|clear|pb|paragraph break|hidden begin|hidden end|use .* dates|short description|pp.*|election box.*|s-.*|party shading.*|color box|legend.*|composition bar|tree list\/end|endplainlist|plainlist\/end)$/;
function template(body) {
  const parts = body.split("|");
  const name = parts[0].trim().toLowerCase().replace(/_/g, " ");
  const pos = parts.slice(1).filter((x) => !/^\s*[a-z0-9_ -]{1,24}=/i.test(x)).map((x) => x.trim());
  if (LISTS.has(name)) return SEP + pos.join(SEP) + SEP;
  if (name === "sortname") return `${pos[0] || ""} ${pos[1] || ""}`;
  if (WRAPS.has(name)) return pos[0] || "";
  if (LASTS.has(name)) return pos[pos.length - 1] || "";
  if (DATES.has(name)) {
    const n = pos.filter((x) => /^\d+$/.test(x));
    return n.length ? n.slice(0, 3).join("-") : pos[0] || "";
  }
  if (FORCES[name]) return /^(usa?|u\.s\.a?\.?|united states)$/i.test(pos[0] || "") ? `United States ${FORCES[name]}` : `${pos[0] || ""} ${FORCES[name]}`.trim();
  if (name === "ushr") return pos[2] || `${pos[0]}-${pos[1]}`;
  if (name === "usa") return "United States";
  if (name === "us" || name === "u.s.") return "U.S.";
  if (/^(snd|spnd|spaced ndash|spaced en dash|spndash)$/.test(name)) return " – ";
  if (/^(ndash|en dash|nbnd|–)$/.test(name)) return "–";
  if (name === "mdash" || name === "em dash") return "—";
  if (/^(·|dot|middot|bull|bullet)$/.test(name)) return " · ";
  if (/^(nbsp|space|spaces|thinsp|hair space)$/.test(name)) return " ";
  if (name === "'") return "'";
  if (name === "circa" || name === "c.") return "c. " + (pos[0] || "");
  if (DROPS.test(name)) return "";
  unknownTemplates.set(name, (unknownTemplates.get(name) || 0) + 1);
  return "";
}
/** A value of an infobox as the plain items it lists. */
function items(value) {
  let s = (value || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{!\}\}/g, "|")
    .replace(/\[\[(?:File|Image):(?:[^[\]]|\[\[[^\]]*\]\])*\]\]/gi, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, (_, label) => label.replace(/<br\s*\/?>/gi, " "))
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/\[https?:\/\/\S+\]/g, "");
  for (let pass = 0, prev = null; pass < 12 && s !== prev; pass++) {
    prev = s;
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body) => template(body));
  }
  s = s
    .replace(/<br\s*\/?>/gi, SEP)
    .replace(/<\/?li[^>]*>/gi, SEP)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&thinsp;|&#160;/g, " ")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/(^|\n)\s*\*+\s*/g, SEP)
    .replace(/'{2,}/g, "")
    .replace(/\s+/g, " ");
  const out = [];
  for (let x of s.split(SEP).map((x) => x.replace(/\s+([,;)])/g, "$1").replace(/\(\s+/g, "(").replace(/^[\s;,·–-]+|[\s;,·]+$/g, "").trim())) {
    if (!x) continue;
    x = x.replace(/^\*+\s*/, "");
    // "(BA)" on a line of its own is the degree of the school above it.
    if (/^\(/.test(x) && out.length) out[out.length - 1] += " " + x;
    else out.push(x);
  }
  return out;
}
let dropped = 0;
const clean = (x, letters = true) => {
  const ok = (letters ? /\p{L}/u : /[\p{L}\d]/u).test(x) && !/[{}[\]|<>=]/.test(x) && !/\(\s*\)/.test(x);
  if (!ok) dropped++;
  return ok;
};
const one = (value) => items(value).join(" ");
const yearIn = (text) => {
  const m = /\b(1[89]\d\d|20\d\d)\b/.exec(text || "");
  return m ? +m[1] : null;
};

/** Education, occupation, service and the offices an article's infobox lists. */
function readArticle(text, { member }) {
  const boxes = infoboxes(text);
  if (!boxes.length) return null;
  const first = (key) => boxes.map((b) => b.params.get(key)).find(Boolean) ?? "";
  // Schooling: the two fields the infobox has for it, as written.
  const education = [...new Set([...items(first("education")), ...items(first("alma_mater"))].flatMap((x) => x.split(/(?<=\))\s+(?=\p{Lu})/u)))].filter((x) => clean(x) && x.length <= 110).slice(0, 6);
  // Occupation: listed with commas as often as with a list template. "Politician" says nothing the page does not.
  const occupation = [...new Map([...items(first("occupation")), ...items(first("profession"))].flatMap((x) => x.split(/\s*,\s*|\s+and\s+|\s*\/\s*|\s*;\s*/)).map((x) => x.trim()).filter((x) => clean(x) && x.length <= 40 && !/^politician$/i.test(x)).map((x) => [x.toLowerCase(), x[0].toUpperCase() + x.slice(1)])).values()].slice(0, 6);
  const branch = items(first("branch")).filter(clean).slice(0, 3).join(" / ");
  const years = one(first("serviceyears"));
  const rank = items(first("rank")).filter(clean)[0] ?? "";
  const military = branch ? [branch, years && clean(years, false) && years.length <= 60 ? years : "", rank.length <= 40 ? rank : ""].filter(Boolean).join(" · ") : "";

  const offices = [];
  for (const b of boxes) {
    if (!/officeholder|politician|congress|senator|governor|mayor|representative|minister|president|judge|person|military/.test(b.kind)) continue;
    const by = new Map();
    for (const [k, v] of b.params) {
      const m = /^(office|order|jr\/sr|state|district|state_senate|state_house|state_assembly|state_delegate|state_legislature|ambassador_from|country|term_start|term_end|term)(\d*)$/.exec(k);
      if (m) (by.get(+(m[2] || 0)) ?? by.set(+(m[2] || 0), {}).get(+(m[2] || 0)))[m[1]] = v;
    }
    let last = null;
    for (const n of [...by.keys()].sort((a, c) => a - c)) {
      const f = by.get(n);
      const district = f.district ? one(f.district) : "";
      const at = district && clean(district) && district.length <= 24 ? (/district|at.large/i.test(district) ? `, ${district}` : `, ${district} district`) : "";
      let label = null;
      let seat = false;
      const order = f.order ? one(f.order) : "";
      if (f.office || /\p{L}{4,}/u.test(order.replace(/^\d+(st|nd|rd|th)\b/i, ""))) {
        // The office is named in "office", with its number in "order" - or the whole of it is written in "order".
        const text = f.office ? one(f.office) : order;
        label = f.office && order && clean(order) && order.length <= 12 && !/^\d/.test(text) ? `${order} ${text}` : text;
        seat = /^(member(-elect)? of the )?(u\.s\.|united states) (house|senate|senator|representative)|^(united states|u\.s\.) (senator|representative)|^delegate to the (u\.s\.|united states)/i.test(text);
      } else if (f["jr/sr"] && f.state) {
        label = `United States Senator from ${one(f.state)}`;
        seat = true;
      } else if (f.state_senate) label = `Member of the ${one(f.state_senate)} Senate${at}`;
      else if (f.state_house) label = `Member of the ${one(f.state_house)} House of Representatives${at}`;
      else if (f.state_assembly) label = `Member of the ${one(f.state_assembly)} State Assembly${at}`;
      else if (f.state_delegate) label = `Member of the ${one(f.state_delegate)} House of Delegates${at}`;
      else if (f.state_legislature) label = `Member of the ${one(f.state_legislature)} Legislature${at}`;
      else if (f.ambassador_from && f.country) label = `${one(f.ambassador_from)} Ambassador to ${one(f.country)}`;
      else if (f.state) {
        // A state with no office named is a seat in the U.S. House, with or without its district.
        label = `Member of the U.S. House of Representatives from ${one(f.state)}${at}`;
        seat = true;
      } else if (last && (f.term_start || f.term_end || f.term)) {
        // No office named: the infobox means the one above, held again.
        label = last.label;
        seat = last.seat;
      }
      if (!label) continue;
      last = { label, seat };
      // A member's seats in Congress come from the congress-legislators data, with their dates.
      if (seat && member) continue;
      const from = yearIn(one(f.term_start)) ?? yearIn(one(f.term));
      const termYears = [...one(f.term || "").matchAll(/\b(1[89]\d\d|20\d\d)\b/g)].map((m) => +m[1]);
      const to = f.term_end ? yearIn(one(f.term_end)) : termYears.length > 1 ? termYears[termYears.length - 1] : null;
      // An office with no year cannot be placed in a career; one whose end is written but not read is left out too.
      if (from == null || (f.term_end && to == null && !/present|incumbent/i.test(f.term_end))) continue;
      if (!clean(label) || label.length > 120) continue;
      if (!offices.some((o) => o.office === label && o.from === from)) offices.push({ office: label, from, to });
    }
  }
  // Newest first; the infobox keeps a second list of older offices folded away, so its own order is not one order.
  return { education, occupation, military, offices: offices.sort((a, b) => b.from - a.from).slice(0, 10) };
}

// ── Voteview: where each member's votes place them ──────────────────────────
function csv(text) {
  return text.split("\n").filter(Boolean).map((line) => {
    const out = [];
    let cur = "";
    let quoted = false;
    for (const ch of line.replace(/\r$/, "")) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out;
  });
}
const vv = csv(fs.readFileSync(fetchFile([VOTEVIEW], "HS119_members.csv"), "utf8"));
const col = Object.fromEntries(vv[0].map((h, i) => [h, i]));
for (const need of ["congress", "chamber", "bioguide_id", "nominate_dim1", "nominate_number_of_votes"]) if (!(need in col)) throw new Error(`Voteview: no ${need} column`);
const scoreOf = new Map(); // "House|B000001" → { score, votes }
for (const r of vv.slice(1)) {
  if (r[col.congress] !== "119" || !r[col.bioguide_id] || r[col.nominate_dim1] === "") continue;
  const score = +r[col.nominate_dim1];
  if (!Number.isFinite(score) || score < -1 || score > 1) throw new Error(`Voteview: score "${r[col.nominate_dim1]}" for ${r[col.bioguide_id]}`);
  scoreOf.set(`${r[col.chamber]}|${r[col.bioguide_id]}`, { score, votes: +r[col.nominate_number_of_votes] || 0 });
}

// ── The FEC's files ─────────────────────────────────────────────────────────
const iso = (mdy) => (/^\d{2}\/\d{2}\/\d{4}$/.test(mdy) ? `${mdy.slice(6)}-${mdy.slice(0, 2)}-${mdy.slice(3, 5)}` : null);
const weball = new Map(lines(zipped(`weball${CYCLE % 100}.zip`, `weball${CYCLE % 100}.txt`)).map((r) => [r[0], r]));
const committees = new Map(lines(zipped(`cm${CYCLE % 100}.zip`, "cm.txt")).map((r) => [r[0], { name: r[1].replace(/\s+/g, " ").trim(), dsgn: r[8], tp: r[9], org: r[12] }]));
if (weball.size < 1500 || committees.size < 8000) throw new Error(`FEC: ${weball.size} candidates and ${committees.size} committees read`);
/** What kind of committee the FEC's own codes say it is: its designation, its type and the kind of organization behind it. */
const ORG = { C: "Corporate PAC", L: "Labor PAC", T: "Trade association PAC", M: "Membership organization PAC", V: "Cooperative PAC", W: "Non-stock corporation PAC" };
const TYPE = { O: "Super PAC", U: "Single-candidate super PAC", I: "Independent spender", X: "Party committee", Y: "Party committee", Z: "Party committee", H: "Another candidate's committee", S: "Another candidate's committee", P: "Another candidate's committee", C: "Communication-cost filer", E: "Electioneering filer", D: "Delegate committee" };
const kindOf = (c) => (!c ? "Committee" : c.dsgn === "D" ? "Leadership PAC" : TYPE[c.tp] ?? ORG[c.org] ?? (c.tp === "V" || c.tp === "W" ? "Hybrid PAC" : "PAC"));

const candidateOf = new Map(); // FEC candidate id → member
for (const p of people) for (const id of p.id.fec || []) candidateOf.set(id, p.id.bioguide);
const gifts = new Map(); // member → committee → dollars
const spentFor = new Map();
const spentAgainst = new Map();
const add = (map, who, cmte, amount) => {
  const m = map.get(who) ?? map.set(who, new Map()).get(who);
  m.set(cmte, (m.get(cmte) || 0) + amount);
};
let pasRows = 0;
for (const r of lines(zipped(`pas2${CYCLE % 100}.zip`, "itpas2.txt"))) {
  pasRows++;
  const who = candidateOf.get(r[16]);
  // A memo line repeats money counted on another line.
  if (!who || r[19] === "X") continue;
  const amount = +r[14];
  if (!Number.isFinite(amount)) continue;
  if (r[5] === "24K" || r[5] === "24Z") add(gifts, who, r[0], amount);
  else if (r[5] === "24E") add(spentFor, who, r[0], amount);
  else if (r[5] === "24A") add(spentAgainst, who, r[0], amount);
}
if (pasRows < 100000) throw new Error(`FEC: only ${pasRows} committee transactions read`);
const top = (map, n) => [...(map ?? [])].filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, Math.round(v)]);
const sum = (map) => Math.round([...(map ?? [])].reduce((n, [, v]) => n + (v >= 1 ? v : 0), 0));

// ── Each official ───────────────────────────────────────────────────────────
const leads = wikiLeads([...people.map((p) => p.id.wikipedia), ...governors.map((g) => g.wiki), ...mayors.map((m) => m.wiki)]);
const profiles = {};
const used = new Set();
const report = { noArticle: [], noInfobox: [], noEducation: [], noScore: [], noMoney: [] };

function fromArticle(title, name, member) {
  const lead = title && leads.get(title);
  if (!lead) { report.noArticle.push(name); return {}; }
  const read = readArticle(lead.text, { member });
  if (!read) { report.noInfobox.push(name); return { wiki: lead.title }; }
  if (!read.education.length) report.noEducation.push(name);
  return { wiki: lead.title, ...(read.education.length ? { education: read.education } : {}), ...(read.occupation.length ? { occupation: read.occupation } : {}), ...(read.military ? { military: read.military } : {}), ...(read.offices.length ? { offices: read.offices } : {}) };
}

for (const p of people) {
  const now = p.terms[p.terms.length - 1];
  const name = p.name.official_full || `${p.name.first} ${p.name.last}`;
  const chamber = now.type === "sen" ? "Senate" : "House";
  const profile = fromArticle(p.id.wikipedia, name, true);

  // Service in Congress: one line for each unbroken stretch in a chamber.
  const runs = [];
  for (const t of p.terms) {
    const ch = t.type === "sen" ? "Senate" : "House";
    const prev = runs[runs.length - 1];
    if (prev && prev.chamber === ch && Date.parse(t.start) - Date.parse(prev.end) < 90 * 864e5) prev.end = t.end;
    else runs.push({ chamber: ch, start: t.start, end: t.end });
  }
  profile.congress = runs.map((r, i) => ({ chamber: r.chamber, from: +r.start.slice(0, 4), to: i === runs.length - 1 ? null : +r.end.slice(0, 4) }));

  const s = scoreOf.get(`${chamber}|${p.id.bioguide}`);
  if (s) profile.ideology = { chamber, score: s.score, votes: s.votes };
  else report.noScore.push(name);

  // Money: each candidacy that reported any in the cycle. Two ids that carry the same committee's figures are one campaign.
  const campaigns = [];
  for (const id of p.id.fec || []) {
    const r = weball.get(id);
    if (!r || !(+r[5] > 0 || +r[7] > 0)) continue;
    const c = { id, office: id[0] === "S" ? "Senate" : id[0] === "H" ? "House" : "President", receipts: Math.round(+r[5]), individuals: Math.round(+r[17]), committees: Math.round(+r[25]), party: Math.round(+r[26]), self: Math.round(+r[11] + +r[12]), transfers: Math.round(+r[6]), spent: Math.round(+r[7]), cash: Math.round(+r[10]), debts: Math.round(+r[16]), through: iso(r[27]) };
    if (!c.through) throw new Error(`${name}: the FEC's coverage date "${r[27]}"`);
    const same = campaigns.findIndex((x) => x.receipts === c.receipts && x.spent === c.spent && x.cash === c.cash && x.through === c.through);
    if (same < 0) campaigns.push(c);
    else if (c.office === chamber) campaigns[same] = c;
  }
  campaigns.sort((a, b) => b.receipts - a.receipts);
  if (campaigns.length) profile.campaigns = campaigns;
  else report.noMoney.push(name);

  const g = gifts.get(p.id.bioguide);
  if (g && sum(g) > 0) {
    const list = top(g, 8);
    for (const id of NAMED_COMMITTEES) if (g.get(id) >= 1 && !list.some(([k]) => k === id)) list.push([id, Math.round(g.get(id))]);
    profile.givers = { count: [...g].filter(([, v]) => v >= 1).length, total: sum(g), top: list };
    for (const [k] of list) used.add(k);
  }
  const f = spentFor.get(p.id.bioguide);
  const a = spentAgainst.get(p.id.bioguide);
  if (sum(f) > 0 || sum(a) > 0) {
    profile.outside = { for: sum(f), against: sum(a), forTop: top(f, 3), againstTop: top(a, 3) };
    for (const [k] of [...profile.outside.forTop, ...profile.outside.againstTop]) used.add(k);
  }
  profiles[p.id.bioguide] = profile;
}
for (const o of [...governors, ...mayors]) profiles[o.key] = fromArticle(o.wiki, o.name, false);

// Where each member's score falls among the chamber's seated members, and each party's median there.
const reference = {};
for (const chamber of ["House", "Senate"]) {
  const seated = people.filter((p) => (p.terms[p.terms.length - 1].type === "sen" ? "Senate" : "House") === chamber && profiles[p.id.bioguide].ideology);
  const order = seated.map((p) => ({ id: p.id.bioguide, party: p.terms[p.terms.length - 1].party, score: profiles[p.id.bioguide].ideology.score })).sort((a, b) => a.score - b.score);
  order.forEach((x, i) => Object.assign(profiles[x.id].ideology, { rank: i + 1, of: order.length }));
  const median = (party) => {
    const v = order.filter((x) => x.party === party).map((x) => x.score);
    if (v.length < 10) throw new Error(`${chamber}: ${v.length} ${party} scores`);
    return +((v[Math.floor((v.length - 1) / 2)] + v[Math.ceil((v.length - 1) / 2)]) / 2).toFixed(3);
  };
  reference[chamber] = { members: order.length, Democrat: median("Democrat"), Republican: median("Republican") };
  for (const x of order) delete profiles[x.id].ideology.chamber;
}

// ── Checks, then the file ───────────────────────────────────────────────────
const members = people.length;
const withSchool = Object.values(profiles).filter((p) => p.education).length;
const withOffices = Object.values(profiles).filter((p) => p.offices).length;
const withMoney = Object.values(profiles).filter((p) => p.campaigns).length;
const withScore = Object.values(profiles).filter((p) => p.ideology).length;
if (withSchool < 500 || withMoney < 500 || withScore < 500) throw new Error(`too little was read: ${withSchool} with schooling, ${withMoney} with money, ${withScore} with a score`);
const through = Object.values(profiles).flatMap((p) => (p.campaigns || []).map((c) => c.through)).sort();

const today = new Date().toISOString().slice(0, 10);
const q = (v) => JSON.stringify(v);
fs.writeFileSync(
  OUT,
  `/**
 * What the States page's explorer says of an elected official once picked:
 * schooling and career, where their votes place them, and the money their
 * campaign has reported.
 *
 * GENERATED by build-official-profiles.cjs on ${today} — do not edit by hand;
 * change the script and re-run it.
 *
 * Education, occupation, military service and offices held are as each
 * official's Wikipedia article lists them in its infobox; a member's terms in
 * the House and Senate are from the congress-legislators data. A member's
 * score is Voteview's DW-NOMINATE first dimension for the 119th Congress: -1
 * the most liberal, +1 the most conservative; the place in the chamber's
 * order and each party's median are worked out from those scores. Money is
 * each campaign's own totals for 2025-26 as the Federal Election Commission
 * publishes them, each to the day its last report covers, and the committees
 * are those that report giving to it or spending for or against it — sums of
 * the FEC's lines for each committee. A governor's or a mayor's campaign
 * reports to the state or the city, not the FEC, so they carry no money here,
 * and they have no score: none is made up.
 */
export const OFFICIAL_PROFILE_SOURCES = {
  wikipedia: { label: "Wikipedia — the official's own article (education, occupation and offices held, from its infobox)", url: "https://en.wikipedia.org/wiki/" },
  congress: { label: "congress-legislators (each member's terms in the House and Senate)", url: "https://github.com/unitedstates/congress-legislators" },
  voteview: { label: "Voteview: Congressional Roll-Call Votes Database — Lewis, Poole, Rosenthal, Boche, Rudkin and Sonnet (2026), DW-NOMINATE scores for the 119th Congress", url: "https://voteview.com/data" },
  fec: { label: "Federal Election Commission — candidates' summaries and committees' contributions to candidates, 2025–26 (bulk data)", url: "https://www.fec.gov/data/browse-data/?tab=bulk-data" },
  earmarks: { label: "Federal Election Commission — earmarked contributions: a gift an individual sends through a committee is reported as the individual's", url: "https://www.fec.gov/help-candidates-and-committees/candidate-taking-receipts/earmarked-contributions/" },
  retrieved: "${today}",
  /** The election cycle the money is for, and the span of days the campaigns' last reports run to. */
  cycle: "${CYCLE - 1}–${String(CYCLE).slice(2)}",
  through: [${q(through[0])}, ${q(through[through.length - 1])}],
};

/** An office and the years it was held: \`to\` is null while it still is. */
export type OfficeHeld = { office: string; from: number; to: number | null };

/** One campaign's totals for the cycle, in dollars, as the FEC publishes them. */
export type Campaign = {
  /** The FEC's id for the candidacy: fec.gov/data/candidate/<id>/ */
  id: string;
  office: "House" | "Senate" | "President";
  receipts: number;
  /** Of the receipts: from individuals, from PACs and other committees, from party committees, the candidate's own gifts and loans, and moved from the candidate's other committees. What is left is interest, refunds and other loans. */
  individuals: number;
  committees: number;
  party: number;
  self: number;
  transfers: number;
  spent: number;
  /** Cash on hand at the end of the last report, and debts owed then. */
  cash: number;
  debts: number;
  /** The day the last report covers to. */
  through: string;
};

export type OfficialProfile = {
  /** The Wikipedia article the next four are read from. */
  wiki?: string;
  education?: string[];
  occupation?: string[];
  military?: string;
  /** Offices the article's infobox lists, in its order. For a member of Congress the seats in Congress are not repeated here. */
  offices?: OfficeHeld[];
  /** A member's stretches in each chamber. */
  congress?: { chamber: "House" | "Senate"; from: number; to: number | null }[];
  /** Voteview's score, the roll-call votes it rests on, and its place counted from the chamber's most liberal member. */
  ideology?: { score: number; votes: number; rank: number; of: number };
  /** The largest campaign first. */
  campaigns?: Campaign[];
  /** Committees that report giving to the campaign: how many, the sum, and the largest as [committee id, dollars]. */
  givers?: { count: number; total: number; top: [string, number][] };
  /** Independent spending for and against the candidate, with the largest spenders. */
  outside?: { for: number; against: number; forTop: [string, number][]; againstTop: [string, number][] };
};

/** Each chamber's seated members with a score, and each party's median score among them. */
export const IDEOLOGY_REFERENCE: Record<"House" | "Senate", { members: number; Democrat: number; Republican: number }> = ${q(reference)};

/** A committee named in a profile: its name as registered with the FEC, and what the FEC's codes say it is. fec.gov/data/committee/<id>/ */
export const COMMITTEES: Record<string, [name: string, kind: string]> = {
${[...used].sort().map((id) => `  ${id}: ${q([committees.get(id)?.name ?? id, kindOf(committees.get(id))])},`).join("\n")}
};

/** A member of Congress by Biographical Directory id; a governor as "gov-<state>"; a mayor as "mayor-<the city's rank>". */
export const OFFICIAL_PROFILES: Record<string, OfficialProfile> = {
${Object.entries(profiles).map(([k, v]) => `  ${q(k)}: ${q(v)},`).join("\n")}
};
`,
);

console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB): ${Object.keys(profiles).length} officials — ${members} members, 50 governors, 50 mayors`);
console.log(`  schooling ${withSchool}, offices ${withOffices}, score ${withScore}, money ${withMoney}; ${used.size} committees named; ${dropped} values not read cleanly and left out`);
console.log(`  campaigns' reports run to ${through[0]} … ${through[through.length - 1]}`);
console.log("  medians:", q(reference));
for (const [k, v] of Object.entries(report)) if (v.length) console.log(`  ${k} (${v.length}): ${v.slice(0, 30).join("; ")}${v.length > 30 ? "; …" : ""}`);
const unknown = [...unknownTemplates].sort((a, b) => b[1] - a[1]);
if (unknown.length) console.log(`  templates not rendered (their text is left out): ${unknown.slice(0, 40).map(([k, n]) => `${k}×${n}`).join(", ")}`);
if (process.argv.includes("--sample")) {
  const every = +process.argv[process.argv.indexOf("--sample") + 1] || 10;
  const names = new Map([...people.map((p) => [p.id.bioguide, p.name.official_full]), ...governors.map((g) => [g.key, g.name + " (gov)"]), ...mayors.map((m) => [m.key, m.name + " (mayor)"])]);
  Object.entries(profiles).forEach(([k, v], i) => {
    if (i % every) return;
    console.log(`
${names.get(k)} [${k}] wiki=${v.wiki}
  EDU: ${(v.education || []).join(" | ")}
  OCC: ${(v.occupation || []).join(" | ")}
  MIL: ${v.military || ""}
  OFF: ${(v.offices || []).map((o) => `${o.office} ${o.from}-${o.to ?? ""}`).join(" | ")}
  CON: ${(v.congress || []).map((o) => `${o.chamber} ${o.from}-${o.to ?? ""}`).join(" | ")}`);
  });
}
if (process.argv.includes("--show")) for (const id of process.argv.slice(process.argv.indexOf("--show") + 1)) console.log(id, JSON.stringify(profiles[id], null, 1));
