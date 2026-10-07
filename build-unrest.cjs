/**
 * Builds src/data/unrest.ts — revolutions, protests, boycotts and internal
 * conflicts, old and recent, large and small, each with its cause, what it
 * cost and how it ended.
 *
 * No body counts these on one footing across history, so nothing here is a
 * statistic. Each event is one that Wikipedia lists and has written up, said
 * in the words of its own article (CC BY-SA):
 *
 *   The lists      "List of revolutions and rebellions", "List of civil wars",
 *                  the list of protests in the twenty-first century, and the
 *                  lists of riots, of strikes and of civil unrest in the
 *                  United States. Every article a list links to is looked
 *                  at; the revision of each list is recorded.
 *   Boycotts       "List of boycotts" is a table, and is read as one: each
 *                  row's time, who took part, what was boycotted and why, in
 *                  the list's words. Most boycotts have no article of their
 *                  own; where a row names one that carries a summary box, how
 *                  it ended is taken from it, and otherwise no outcome is
 *                  given.
 *   The articles   An article is an event here only if it carries the
 *                  summary box Wikipedia gives a civil conflict or a military
 *                  conflict, its title says what kind of event it is, and the
 *                  box gives a date and how it ended. From the box, as
 *                  written: when and where, the causes and the goals, the
 *                  dead, injured and arrested, and the result. From the
 *                  article: its opening sentences.
 *
 * A box's field is taken as its words, with links, notes and flags removed
 * and a list's items set one after another; a long field is cut at the end of
 * an item. Nothing is ranked by size - the boxes give no figure that could be
 * compared across four thousand years - so events are ordered by date. Where
 * a box gives no cause, the event is kept and says so.
 *
 * So that old and recent, and well known and little known, stand alike: from
 * each kind in each of five eras, half of those kept are the events with the
 * longest articles and half are taken evenly from all the rest.
 *
 *   node build-unrest.cjs
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const OUT = path.join(__dirname, "src/data/unrest.ts");
const UA = "commonsphere-data-build/1.0 (+https://github.com/commonsphere1-sketch/commonsphere)";
const CACHE = path.join(os.tmpdir(), "commonsphere-unrest");
fs.mkdirSync(CACHE, { recursive: true });

/** The lists read, the kind each gives, and what an article's title must say to be of that kind. */
const KINDS = {
  // Boycotts are read from their list's table (below), not from the articles it links to.
  Boycott: { lists: [], title: /boycott/i, box: /civil conflict|^event$|historical event/i },
  Protest: {
    lists: ["List of protests in the 21st century", "List of riots", "List of strikes", "List of incidents of civil unrest in the United States"],
    title: /protest|demonstration|march\b|strike|riot|sit-in|movement|unrest|uprising|spring\b|rally|lockout|massacre/i,
    box: /civil conflict|^event$|historical event/i,
  },
  Revolution: {
    lists: ["List of revolutions and rebellions"],
    title: /revolution|rebellion|revolt|uprising|insurrection|rising\b|mutiny|war of independence|spring\b/i,
    box: /civil conflict|military conflict|^event$|historical event/i,
  },
  "Internal conflict": { lists: ["List of civil wars"], title: /civil war|insurgency|conflict|\bwar\b|rebellion|uprising|troubles|emergency/i, box: /military conflict|civil conflict/i },
};
const ERAS = [
  ["Before 1800", -Infinity, 1799],
  ["1800–1899", 1800, 1899],
  ["1900–1949", 1900, 1949],
  ["1950–1999", 1950, 1999],
  ["2000 on", 2000, Infinity],
];
const PER_KIND_ERA = 28;
const MAX_FIELD = 360;

const api = (params) => `https://en.wikipedia.org/w/api.php?format=json&formatversion=2&${new URLSearchParams(params)}`;
let calls = 0;
async function get(params) {
  const at = path.join(CACHE, `${crypto.createHash("md5").update(JSON.stringify(params)).digest("hex")}.json`);
  if (fs.existsSync(at) && Date.now() - fs.statSync(at).mtimeMs < 24 * 3600e3) return JSON.parse(fs.readFileSync(at, "utf8"));
  const res = await fetch(api(params), { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(at, text);
  if (++calls % 10 === 0) await new Promise((r) => setTimeout(r, 500));
  return JSON.parse(text);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** A template as the words it stands for: a list as its items, a date as a date, a wrapper as what it wraps; anything else as nothing. */
function template(body) {
  const parts = body.split("|").map((p) => p.trim());
  const name = parts[0].toLowerCase().replace(/_/g, " ");
  const args = parts.slice(1).filter((a) => !/^(class|style|indent|list style|item style|df|mf|br|abbr|link|nolink|size|sp|lk|disp|adj)\s*=/i.test(a));
  if (/^(ubl|unbulleted list|plainlist|plain list|bulleted list|blist|flatlist|hlist|ubt|unbulleted|collapsible list|ordered list|indented plainlist)$/.test(name)) return args.map((a) => a.replace(/^title\s*=\s*/i, "")).join("\n");
  if (/^(start date|start date and age|end date|birth date|death date|date)$/.test(name)) {
    const n = args.filter((a) => /^\d+$/.test(a)).map(Number);
    if (!n.length) return args[0] ?? "";
    return [n[2], n[1] ? MONTHS[n[1] - 1] : null, n[0]].filter(Boolean).join(" ");
  }
  if (/^(nowrap|small|smaller|big|nobr|lang|transliteration|no wrap|nobold|normal|resize|center)$/.test(name)) return args[args.length - 1] ?? "";
  if (/^(circa|c\.)$/.test(name)) return `c. ${args[0] ?? ""}`;
  if (/^(flag|flagcountry|flagu)$/.test(name)) return args[0] ?? "";
  if (/^(snd|spnd|spaced ndash|ndash|en dash)$/.test(name)) return " – ";
  if (/^(dash|mdash|em dash)$/.test(name)) return " — ";
  if (name === "plainlist" || name === "endplainlist") return "";
  return "";
}

/** A field of a summary box as plain words, one item to a line. */
function plain(value) {
  let s = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "");
  for (let before = ""; before !== s; ) {
    before = s;
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body) => template(body));
  }
  return s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
    .replace(/\[https?:\/\/\S+\]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/'{2,}/g, "")
    .split("\n")
    .map((l) => l.replace(/^[*#:;]+\s*/, "").replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").trim())
    .filter((l) => l && !/^[\s|{}]*$/.test(l))
    .join("\n");
}

/** A field for the page: its items joined, cut at the end of an item where it runs long. */
function field(value) {
  if (!value) return undefined;
  const items = plain(value).split("\n");
  let out = "";
  for (const item of items) {
    const next = out ? `${out}; ${item}` : item;
    if (next.length > MAX_FIELD) break;
    out = next;
  }
  if (!out && items[0]) {
    const cut = items[0].slice(0, MAX_FIELD);
    const end = cut.lastIndexOf(". ");
    out = end > 80 ? cut.slice(0, end + 1) : "";
  }
  out = out.replace(/\s*[;:,]\s*$/, "").trim();
  return out.length >= 3 && /[A-Za-z0-9]/.test(out) ? out : undefined;
}

/** The first summary box of the kinds wanted, as its fields. */
function boxOf(text, wanted) {
  const m = /\{\{\s*Infobox ([^|\n}]+)/gi;
  for (let hit; (hit = m.exec(text)); ) {
    if (!wanted.test(hit[1])) continue;
    let depth = 0;
    let end = -1;
    for (let i = hit.index; i < text.length - 1; i++) {
      const two = text.slice(i, i + 2);
      if (two === "{{") (depth++, i++);
      else if (two === "}}") {
        depth--;
        i++;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end < 0) return null;
    const body = text.slice(hit.index + 2, end - 2);
    // Cut at the bars that part the box's own fields: not those inside a template, a link or a table.
    const fields = {};
    let curly = 0;
    let square = 0;
    let start = 0;
    const cuts = [];
    for (let i = 0; i < body.length; i++) {
      const two = body.slice(i, i + 2);
      if (two === "{{" || two === "{|") (curly++, i++);
      else if (two === "}}" || two === "|}") (curly--, i++);
      else if (two === "[[") (square++, i++);
      else if (two === "]]") (square--, i++);
      else if (body[i] === "|" && curly === 0 && square === 0) {
        cuts.push(body.slice(start, i));
        start = i + 1;
      }
    }
    cuts.push(body.slice(start));
    for (const part of cuts.slice(1)) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const key = part.slice(0, eq).trim().toLowerCase().replace(/[ -]/g, "_");
      const value = part.slice(eq + 1).trim();
      if (key && value && !(key in fields)) fields[key] = value;
    }
    return { type: hit[1].trim().toLowerCase(), fields };
  }
  return null;
}

/** An event's date as its box writes it: the first it gives, without the length of time or the empty brackets a template leaves after it. */
function whenOf(value) {
  const first = (field(value) ?? "").split("; ").find((item) => /\d/.test(item));
  if (!first) return undefined;
  const when = first
    .replace(/\([^)]*\b(?:years?|months?|weeks?|days?)\b[^)]*\)?/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[;,:]\s*$/, "")
    .trim();
  return when || undefined;
}

/** The year an event began, from its date as written: before the common era is negative. */
function yearOf(when) {
  const bc = when.match(/(\d{1,4})\s*(?:–|-|to)?\s*(?:\d{1,4}\s*)?(BC|BCE)\b/i);
  if (bc) return -Number(bc[1]);
  const y = when.match(/\b(\d{3,4})\b/);
  return y ? Number(y[1]) : null;
}

/** The opening of an article: its first two sentences. */
function openingOf(extract) {
  const text = (extract ?? "").replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").trim();
  const m = text.match(/^(.{60,420}?[.!?])(?:\s+(.{20,260}?[.!?]))?(?=\s|$)/);
  return m ? [m[1], m[2]].filter(Boolean).join(" ") : undefined;
}

(async () => {
  const lists = [];
  const kindOf = new Map();
  for (const [kind, spec] of Object.entries(KINDS)) {
    for (const list of spec.lists) {
      const j = await get({ action: "parse", page: list, prop: "links|revid", redirects: "1" });
      if (!j.parse) {
        lists.push({ title: list, kind, revision: null, links: 0 });
        continue;
      }
      const titles = j.parse.links.filter((l) => l.ns === 0 && l.exists !== false).map((l) => l.title);
      lists.push({ title: j.parse.title, kind, revision: j.parse.revid, links: titles.length });
      // An article two lists hold takes the first kind whose title test it passes.
      for (const t of titles) if (spec.title.test(t) && !kindOf.has(t)) kindOf.set(t, kind);
    }
  }
  // The list of boycotts, row by row: time frame, participants, target, cause, main article.
  const boycotts = [];
  {
    const j = await get({ action: "parse", page: "List of boycotts", prop: "wikitext|revid", redirects: "1" });
    if (!j.parse) throw new Error("Wikipedia: no list of boycotts");
    const text = j.parse.wikitext.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
    const ongoingFrom = text.indexOf("==Ongoing==");
    let at = 0;
    for (const raw of text.split(/\n\|-[^\n]*\n/)) {
      at = text.indexOf(raw, at);
      const row = raw.split(/\n\|\}/)[0];
      if (/^\s*!/.test(row) || !row.trim().startsWith("|")) continue;
      const cells = row.replace(/^\s*\|/, "").split(/\|\||\n\|/);
      if (cells.length < 4) continue;
      const when = field(cells[0]);
      const year = when ? yearOf(when) : null;
      const target = field(cells[2]);
      const cause = field(cells[3]);
      if (!when || year === null || !target || !cause) continue;
      const article = ((cells[4] ?? "").match(/\[\[([^\]|#]+)/) || [])[1]?.trim();
      boycotts.push({ kind: "Boycott", title: article ?? `Boycott of ${target}`, article, when, year, participants: field(cells[1]), target, cause, ongoing: ongoingFrom >= 0 && at > ongoingFrom, length: 0 });
    }
    lists.push({ title: j.parse.title, kind: "Boycott", revision: j.parse.revid, links: boycotts.length });
    if (boycotts.length < 40) throw new Error(`only ${boycotts.length} boycotts read from the list's table`);
    for (const b of boycotts) if (b.article && !kindOf.has(b.article)) kindOf.set(b.article, "Boycott");
  }
  const titles = [...kindOf.keys()];
  const events = [];
  const counted = { looked: titles.length, noBox: 0, noDate: 0, noEnd: 0 };
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const j = await get({ action: "query", prop: "revisions|info", rvprop: "content", rvslots: "main", rvsection: "0", redirects: "1", titles: batch.join("|") });
    const back = new Map([...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])].map((r) => [r.to, r.from]));
    for (const p of j.query?.pages ?? []) {
      const kind = kindOf.get(p.title) ?? kindOf.get(back.get(p.title)) ?? kindOf.get(back.get(back.get(p.title)));
      const text = p.revisions?.[0]?.slots?.main?.content;
      if (!kind || !text) continue;
      const box = boxOf(text, KINDS[kind].box);
      // A boycott's article adds how it ended, and its length, to the list's row.
      const row = boycotts.find((b) => b.article === p.title || b.article === back.get(p.title));
      if (row) {
        row.title = p.title;
        row.article = p.title;
        row.length = p.length ?? 0;
        if (box) Object.assign(row, { where: field(box.fields.place ?? box.fields.location), outcome: field(box.fields.result ?? box.fields.outcome ?? box.fields.status), methods: field(box.fields.methods) });
        continue;
      }
      if (!box) {
        counted.noBox++;
        continue;
      }
      const f = box.fields;
      // The date as written, without the length of time some boxes add after it in brackets.
      const when = whenOf(f.date);
      const year = when ? yearOf(when) : null;
      if (!when || year === null) {
        counted.noDate++;
        continue;
      }
      const outcome = field(f.result ?? f.outcome ?? f.status);
      if (!outcome) {
        counted.noEnd++;
        continue;
      }
      const cost = [
        ["dead", f.fatalities ?? f.casualties3],
        ["injured", f.injuries],
        ["arrested", f.arrests ?? f.detentions],
      ]
        .map(([word, v]) => [word, field(v)])
        .filter(([, v]) => v && v.length <= 160 && /\d/.test(v))
        .map(([word, v]) => `${word.charAt(0).toUpperCase()}${word.slice(1)}: ${v}`);
      events.push({
        kind,
        title: p.title,
        article: p.title,
        length: p.length ?? 0,
        when,
        year,
        where: field(f.place ?? f.location),
        cause: field(f.causes ?? f.cause ?? f.caused_by),
        goals: field(f.goals ?? f.goal ?? f.aims),
        methods: field(f.methods),
        effect: cost.length ? cost.join("; ") : field(f.territory),
        outcome,
      });
    }
  }

  // The opening of each article kept, and the fullest accounts of each kind in each era.
  // An article two links reach is one event.
  const once = new Set();
  for (let i = events.length - 1; i >= 0; i--) once.has(events[i].title) ? events.splice(i, 1) : once.add(events[i].title);
  events.push(...boycotts);
  // From each kind in each era: the longest articles, and as many again taken evenly from all the rest.
  const kept = [];
  for (const kind of Object.keys(KINDS)) {
    for (const [, from, to] of ERAS) {
      const pool = events.filter((e) => e.kind === kind && e.year >= from && e.year <= to).sort((a, b) => b.length - a.length || a.title.localeCompare(b.title));
      const known = pool.slice(0, PER_KIND_ERA / 2);
      const rest = pool.slice(PER_KIND_ERA / 2);
      const step = Math.max(1, rest.length / (PER_KIND_ERA / 2));
      const others = [];
      for (let i = 0; i < rest.length && others.length < PER_KIND_ERA / 2; i += step) others.push(rest[Math.floor(i)]);
      kept.push(...known, ...new Set(others));
    }
  }
  for (let i = 0; i < kept.length; i += 20) {
    const batch = kept.slice(i, i + 20).filter((e) => e.article);
    if (!batch.length) continue;
    const j = await get({ action: "query", prop: "extracts", exintro: "1", explaintext: "1", exlimit: "20", titles: batch.map((e) => e.title).join("|") });
    const by = new Map((j.query?.pages ?? []).map((p) => [p.title, p.extract]));
    for (const e of batch) e.said = openingOf(by.get(e.title));
  }
  if (kept.length < 100) throw new Error(`only ${kept.length} events: the lists or the boxes have changed`);
  kept.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const today = new Date().toISOString().slice(0, 10);
  const read = lists.filter((l) => l.revision !== null);
  const opt = (e, k) => (e[k] ? `, ${k}: ${JSON.stringify(e[k])}` : "");

  fs.writeFileSync(
    OUT,
    `/**
 * Revolutions, protests, boycotts and internal conflicts, old and recent,
 * each with its cause, what it cost and how it ended.
 *
 * GENERATED by build-unrest.cjs on ${today} — do not edit by hand; change the
 * script and re-run it.
 *
 * Each is an event one of Wikipedia's lists names and whose own article
 * carries the summary box of a civil or a military conflict, with a date and
 * a result. ${counted.looked.toLocaleString("en-US")} articles of the right kind were looked at: ${counted.noBox} had no such box,
 * ${counted.noDate} no date that could be read and ${counted.noEnd} no result. Boycotts are the rows of
 * Wikipedia's list of boycotts (${boycotts.length}), with how each ended where its row names an
 * article that says. That leaves ${events.length}; from each kind in each of five eras up to
 * ${PER_KIND_ERA} are kept - half the events with the longest articles, half taken
 * evenly from the rest - so the well known and the little known stand alike.
 *
 * Every field is the box's own words with links, notes and flags removed; a
 * list's items are set one after another and a long field is cut at the end
 * of an item. A field the box does not give is absent, and the page says so.
 * These are accounts, not statistics: nothing is ranked by size, and the
 * events are in order of date. \`year\` is the year the event began, negative
 * before the common era.
 */
export const UNREST_SOURCES = {
  lists: ${JSON.stringify(read.map((l) => ({ label: `Wikipedia — ${l.title} (revision ${l.revision})`, url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(l.title.replace(/ /g, "_"))}&oldid=${l.revision}` })))},
  retrieved: "${today}",
  looked: ${counted.looked},
  withAccount: ${events.length},
};

export const UNREST_KINDS = ${JSON.stringify(Object.keys(KINDS))} as const;
export type UnrestKind = (typeof UNREST_KINDS)[number];
export const UNREST_ERAS: [label: string, from: number, to: number][] = ${JSON.stringify(ERAS).replace(/null/g, (m, at, all) => (all[at - 1] === "," && all[at + 4] === "," ? "-Infinity" : "Infinity"))};

export type UnrestEvent = {
  kind: UnrestKind;
  /** Its name: its Wikipedia article's title, or for a boycott with no article, what was boycotted. */
  title: string;
  /** The title of its Wikipedia article, where it has one. */
  article?: string;
  /** For a boycott: who took part, and what was boycotted. */
  participants?: string;
  target?: string;
  /** A boycott the list gives as still going on. */
  ongoing?: boolean;
  when: string;
  year: number;
  where?: string;
  /** What the article's opening says of it. */
  said?: string;
  cause?: string;
  goals?: string;
  methods?: string;
  /** What it cost - the dead, injured and arrested - or the territory that changed hands. */
  effect?: string;
  /** How it ended; absent for a boycott whose row names no article that says. */
  outcome?: string;
};

export const UNREST_EVENTS: UnrestEvent[] = [
${kept.map((e) => `  { kind: ${JSON.stringify(e.kind)}, title: ${JSON.stringify(e.title)}${opt(e, "article")}, when: ${JSON.stringify(e.when.replace(/\n/g, "; "))}, year: ${e.year}${e.ongoing ? ", ongoing: true" : ""}${opt(e, "where")}${opt(e, "participants")}${opt(e, "target")}${opt(e, "said")}${opt(e, "cause")}${opt(e, "goals")}${opt(e, "methods")}${opt(e, "effect")}${opt(e, "outcome")} },`).join("\n")}
];
`,
  );

  console.log(`wrote ${path.relative(__dirname, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
  console.log(`  lists: ${lists.map((l) => `${l.title} ${l.revision ? l.links : "MISSING"}`).join("; ")}`);
  console.log(`  ${JSON.stringify(counted)} · with an account ${events.length} · kept ${kept.length} · with a cause ${kept.filter((e) => e.cause).length} · with a cost ${kept.filter((e) => e.effect).length}`);
  for (const kind of Object.keys(KINDS)) console.log(`  ${kind}: ${ERAS.map(([label, from, to]) => `${label} ${kept.filter((e) => e.kind === kind && e.year >= from && e.year <= to).length}`).join(", ")}`);
  for (const t of ["Montgomery bus boycott", "French Revolution", "George Floyd protests", "Spanish Civil War", "Arab Spring", "Salt March"]) {
    const e = kept.find((x) => x.title === t);
    console.log(e ? `    ${e.kind} · ${e.title} · ${e.when.replace(/\n/g, "; ").slice(0, 50)} · ${e.where ?? "-"}\n       cause: ${e.cause ?? "-"}\n       effect: ${e.effect ?? "-"}\n       outcome: ${e.outcome ?? "-"}` : `    (not kept: ${t})`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
