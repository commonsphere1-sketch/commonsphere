/**
 * Headlines from established news outlets, matched to the countries and US
 * states they are about.
 *
 * Sources: the outlets' own public RSS feeds - wire-quality international
 * desks, public broadcasters, the UN's news service, and US politics and
 * statehouse desks for the states. (GDELT, the open news index, was the
 * first choice, but its API refuses more than one request every few
 * seconds per address, which a scheduled job on shared servers cannot rely
 * on.)
 *
 * What is kept: the headline, the link, the outlet and the time - never the
 * article text. The site shows the headline and links to the publisher.
 *
 * Matching is by name in the headline: a headline is about a place when it
 * names it, and about the relation between places when it names more than
 * one. Longer names are matched first and consume their text, so "New
 * Mexico" is not also Mexico and "South Sudan" is not also Sudan. A few
 * names need rules (Georgia, Washington, Jordan, Chad); see below.
 */
import { COUNTRY_NAMES } from "./places.ts";
import { STATES, UA } from "./sources.ts";

export type NewsRow = {
  url: string;
  title: string;
  outlet: string;
  published_at: string;
  /** "c:JP" for a country, "s:tx" for a US state. */
  places: string[];
};

type Feed = { url: string; outlet: string; us?: boolean };

/** us: a US desk, where "Georgia" is the state rather than the country. */
export const FEEDS: Feed[] = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", outlet: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", outlet: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", outlet: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml", outlet: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", outlet: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", outlet: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml", outlet: "BBC News", us: true },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", outlet: "Al Jazeera" },
  { url: "https://feeds.npr.org/1004/rss.xml", outlet: "NPR" },
  { url: "https://feeds.npr.org/1014/rss.xml", outlet: "NPR", us: true },
  { url: "https://rss.dw.com/rdf/rss-en-world", outlet: "DW" },
  { url: "https://www.france24.com/en/rss", outlet: "France 24" },
  { url: "https://www.theguardian.com/world/rss", outlet: "The Guardian" },
  { url: "https://www.theguardian.com/us-news/rss", outlet: "The Guardian", us: true },
  { url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", outlet: "UN News" },
  { url: "https://www.pbs.org/newshour/feeds/rss/world", outlet: "PBS NewsHour" },
  { url: "https://www.pbs.org/newshour/feeds/rss/politics", outlet: "PBS NewsHour", us: true },
  { url: "https://foreignpolicy.com/feed/", outlet: "Foreign Policy" },
  { url: "https://thediplomat.com/feed/", outlet: "The Diplomat" },
  { url: "https://www.abc.net.au/news/feed/51120/rss.xml", outlet: "ABC News (Australia)" },
  { url: "https://www.euronews.com/rss?level=theme&name=news", outlet: "Euronews" },
  { url: "https://www.scmp.com/rss/91/feed", outlet: "South China Morning Post" },
  { url: "https://www.japantimes.co.jp/feed/", outlet: "The Japan Times" },
  { url: "https://www.straitstimes.com/news/world/rss.xml", outlet: "The Straits Times" },
  { url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", outlet: "CNA" },
  { url: "https://www.africanews.com/feed/rss", outlet: "Africanews" },
  { url: "https://www.thehindu.com/news/international/feeder/default.rss", outlet: "The Hindu" },
  { url: "https://mercopress.com/rss/", outlet: "MercoPress" },
  { url: "https://rss.politico.com/politics-news.xml", outlet: "Politico", us: true },
  { url: "https://thehill.com/homenews/state-watch/feed/", outlet: "The Hill", us: true },
  { url: "https://stateline.org/feed/", outlet: "Stateline", us: true },
  { url: "https://calmatters.org/feed/", outlet: "CalMatters", us: true },
];

/** Sections that are not national or international affairs. */
const SKIP_PATH =
  /\/(sports?|football|soccer|cricket|rugby|tennis|golf|formula-?1|f1|motorsport|olympics|entertainment|entertainment_and_arts|culture|lifestyle|life-and-style|travel|food|recipes|fashion|style|arts?|music|film|movies|tv|tv-and-radio|books|games|crosswords?|puzzles|horoscopes?|wellness|obituaries)\//i;

/**
 * The forms headlines use besides the site's own names. Demonyms are only
 * the ones that almost always mean the country; bare "Korea", "Congo" and
 * "America" are left out as ambiguous.
 */
const ALIASES: Record<string, string[]> = {
  US: ["U.S.", "US", "USA", "United States"],
  GB: ["UK", "U.K.", "Britain", "British", "Northern Ireland", "Scotland", "Scottish", "Wales"],
  CN: ["Chinese", "Beijing"],
  TW: ["Taiwanese", "Taipei"],
  RU: ["Russian", "Russians", "Kremlin", "Moscow"],
  UA: ["Ukrainian", "Ukrainians", "Kyiv"],
  IL: ["Israeli", "Israelis"],
  PS: ["Palestinian", "Palestinians", "Gaza", "West Bank"],
  IR: ["Iranian", "Iranians", "Tehran"],
  IQ: ["Iraqi", "Iraqis", "Baghdad"],
  SY: ["Syrian", "Syrians", "Damascus"],
  LB: ["Lebanese", "Beirut"],
  YE: ["Yemeni", "Houthi", "Houthis"],
  SA: ["Saudi"],
  AE: ["UAE", "Emirati"],
  QA: ["Qatari", "Doha"],
  TR: ["Turkey", "Turkish", "Ankara"],
  EG: ["Egyptian", "Cairo"],
  KP: ["North Korean", "Pyongyang"],
  KR: ["South Korean", "Seoul"],
  JP: ["Japanese", "Tokyo"],
  IN: ["Indian", "New Delhi"],
  PK: ["Pakistani", "Islamabad"],
  AF: ["Afghan", "Afghans", "Kabul"],
  BD: ["Bangladeshi", "Dhaka"],
  LK: ["Sri Lankan"],
  NP: ["Nepali", "Nepalese"],
  MM: ["Burma", "Burmese"],
  TH: ["Thai"],
  VN: ["Vietnamese"],
  PH: ["Philippine", "Filipino", "Filipinos", "Manila"],
  ID: ["Indonesian", "Jakarta"],
  MY: ["Malaysian"],
  SG: ["Singaporean"],
  KH: ["Cambodian"],
  AU: ["Australian", "Australians", "Canberra"],
  NZ: ["Kiwi"],
  DE: ["German", "Germans", "Berlin"],
  FR: ["French"],
  IT: ["Italian", "Italians"],
  ES: ["Spanish"],
  PT: ["Portuguese"],
  NL: ["Dutch"],
  BE: ["Belgian"],
  CH: ["Swiss"],
  AT: ["Austrian"],
  PL: ["Polish", "Warsaw"],
  CZ: ["Czechia", "Czech"],
  HU: ["Hungarian", "Budapest"],
  RO: ["Romanian"],
  BG: ["Bulgarian"],
  GR: ["Greek", "Athens"],
  RS: ["Serbian", "Belgrade"],
  BY: ["Belarusian", "Minsk"],
  MD: ["Moldovan"],
  SE: ["Swedish"],
  NO: ["Norwegian"],
  FI: ["Finnish"],
  DK: ["Danish"],
  IE: ["Irish"],
  AM: ["Armenian", "Yerevan"],
  AZ: ["Azerbaijani", "Baku"],
  GE: ["Georgian", "Tbilisi"],
  KZ: ["Kazakh"],
  CA: ["Canadian", "Canadians", "Ottawa"],
  MX: ["Mexican", "Mexicans"],
  BR: ["Brazilian", "Brasilia", "Brasília"],
  AR: ["Argentine", "Argentinian", "Buenos Aires"],
  CL: ["Chilean"],
  CO: ["Colombian", "Bogota", "Bogotá"],
  PE: ["Peruvian"],
  VE: ["Venezuelan", "Caracas"],
  CU: ["Cuban", "Havana"],
  HT: ["Haitian"],
  NG: ["Nigerian", "Abuja"],
  ZA: ["South African"],
  KE: ["Kenyan", "Nairobi"],
  ET: ["Ethiopian", "Addis Ababa"],
  SD: ["Sudanese", "Khartoum"],
  SS: ["South Sudanese"],
  SO: ["Somali", "Mogadishu"],
  CD: ["Democratic Republic of the Congo", "DRC", "Kinshasa"],
  CG: ["Congo-Brazzaville"],
  CV: ["Cabo Verde"],
  MA: ["Moroccan", "Rabat"],
  DZ: ["Algerian", "Algiers"],
  TN: ["Tunisian"],
  LY: ["Libyan", "Tripoli"],
  ML: ["Malian", "Bamako"],
  MK: ["Macedonia"],
  SZ: ["Swaziland"],
  TL: ["East Timor"],
  VA: ["Vatican", "Holy See"],
  // Where the site's name uses "&" or an accent that headlines often drop.
  AG: ["Antigua and Barbuda"],
  BA: ["Bosnia and Herzegovina", "Bosnia", "Bosnian"],
  TT: ["Trinidad and Tobago"],
  KN: ["Saint Kitts and Nevis", "St Kitts and Nevis"],
  VC: ["Saint Vincent and the Grenadines", "St Vincent and the Grenadines"],
  ST: ["Sao Tome and Principe", "São Tomé and Príncipe"],
  CW: ["Curacao"],
  MO: ["Macao"],
  AX: ["Aland"],
  CI: ["Ivory Coast", "Ivorian", "Côte d’Ivoire", "Cote d'Ivoire"],
  GS: ["South Georgia"],
};

/** Phrases that contain a place name but are not about the place; consumed, not tagged. */
const STOP = [
  "Kansas City", "Indiana Jones", "Washington Post", "Washington, D.C.", "Washington DC", "Washington D.C.",
  "New York Times", "New York Post", "Texas Instruments", "Jersey Shore", "Latin American", "South American",
  "North American", "Central American", "Native American", "Indian Ocean", "Georgia Tech", "British Columbia",
  "American Indian", "French Open", "US Open", "Chinese New Year", "Turkish Airlines", "Qatar Airways", "Air India",
];

type Pattern = { re: RegExp; place: string | null; len: number };

/**
 * Words that are also people's names - Jordan and Chad as first names or
 * surnames, French as a surname ("Bo French"). They count only when the word
 * before them is not a capitalised name: "The French government" and
 * "talks With Jordan" count, "Bo French" and "Jim Jordan" do not. Jordan and
 * Chad are also first names, so not before a capitalised word either
 * ("Chad Daybell").
 */
const NAME_LIKE: Record<string, { firstName: boolean }> = {
  Jordan: { firstName: true },
  Chad: { firstName: true },
  French: { firstName: false },
};
const SENTENCE_WORDS =
  "The|A|An|In|On|At|For|With|By|From|To|As|And|Of|Over|After|Before|About|Against|Amid|Into|Why|How|What|When|Where|New|Top|Ex|Former|Senior|Visits?|Says|Meets|Backs|Slams|Warns|Urges";
const notAfterName = `(?<!(?<![\\p{L}])(?!(?:${SENTENCE_WORDS}) )\\p{Lu}\\p{Ll}+ )`;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (s: string) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(s)}(?![\\p{L}\\p{N}])`, "gu");

function patterns(us: boolean): Pattern[] {
  const out: Pattern[] = [];
  for (const s of STOP) out.push({ re: word(s), place: null, len: s.length + 100 });
  for (const [id, [name]] of Object.entries(STATES)) {
    if (name === "Washington") {
      // The state only when the headline says so; otherwise it is the capital.
      out.push({ re: /(?<![\p{L}])Washington (state|State|Gov\.?|governor|Governor|legislature|Legislature)(?![\p{L}])/gu, place: `s:${id}`, len: 20 });
      continue;
    }
    if (name === "Georgia") {
      // A US desk means the state; an international desk, the country -
      // unless the headline's own words make it the state.
      out.push({ re: word("Georgia"), place: us ? `s:${id}` : "c:GE", len: 7 });
      out.push({
        re: /(?<![\p{L}])(Atlanta, Georgia|Georgia (governor|Governor|Gov\.?|state|State|senator|Senate|runoff|voters|Republicans?|Democrats?|lawmakers|legislature|Legislature))(?![\p{L}])/gu,
        place: `s:${id}`,
        len: 30,
      });
      continue;
    }
    out.push({ re: word(name), place: `s:${id}`, len: name.length });
  }
  for (const [code, name] of COUNTRY_NAMES) {
    // Georgia by name is handled with the states above; its other names here.
    const names = code === "GE" ? (ALIASES[code] ?? []) : [name, ...(ALIASES[code] ?? [])];
    for (const n of names) {
      const nameLike = NAME_LIKE[n];
      if (nameLike) {
        const after = nameLike.firstName ? "(?! \\p{Lu})" : "";
        out.push({ re: new RegExp(`${notAfterName}(?<![\\p{L}])${n}(?![\\p{L}])${after}`, "gu"), place: `c:${code}`, len: n.length });
        continue;
      }
      // Case matters: "US" is the country, "us" is not; "Turkey", not "turkey".
      out.push({ re: word(n), place: `c:${code}`, len: n.length });
    }
  }
  // Longest first, so a longer name takes its text before a shorter one can.
  return out.sort((a, b) => b.len - a.len);
}

const PATTERNS = { us: patterns(true), world: patterns(false) };

/** The places a headline names, in the order first found. */
export function placesIn(title: string, us: boolean): string[] {
  let text = title;
  const found: string[] = [];
  for (const p of us ? PATTERNS.us : PATTERNS.world) {
    p.re.lastIndex = 0;
    if (!p.re.test(text)) continue;
    p.re.lastIndex = 0;
    text = text.replace(p.re, (m) => " ".repeat(m.length));
    if (p.place && !found.includes(p.place)) found.push(p.place);
  }
  return found;
}

// ── Parsing ─────────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const tag = (block: string, name: string) =>
  new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(block)?.[1];

/** Drops tracking parameters, so the same story from two feeds is one row. */
function cleanUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.protocol = "https:";
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|at_|ns_|ito|cmp|ref$|src$)/i.test(k)) u.searchParams.delete(k);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

/** RSS 2.0, RDF (RSS 1.0) and Atom items: title, link and date. */
export function parseFeed(xml: string): { title: string; link: string; date: Date }[] {
  const out: { title: string; link: string; date: Date }[] = [];
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  for (const b of blocks) {
    const title = decode(tag(b, "title") ?? "");
    const link =
      decode(tag(b, "link") ?? "") ||
      /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i.exec(b)?.[1] ||
      /<link[^>]*href="([^"]+)"/i.exec(b)?.[1] ||
      decode(tag(b, "guid") ?? "");
    const when = decode(tag(b, "pubDate") ?? tag(b, "dc:date") ?? tag(b, "published") ?? tag(b, "updated") ?? "");
    const date = new Date(when);
    if (!title || !link || Number.isNaN(date.getTime())) continue;
    out.push({ title, link, date });
  }
  return out;
}

// ── The job ─────────────────────────────────────────────────────────────────

/** Keep a fortnight; older headlines are no longer news. */
export const KEEP_DAYS = 14;

export async function newsHeadlines(): Promise<{ rows: NewsRow[]; failed: string[] }> {
  const since = Date.now() - KEEP_DAYS * 86_400_000;
  const failed: string[] = [];
  const results = await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { f, items: parseFeed(await res.text()) };
      } catch (e) {
        failed.push(`${new URL(f.url).host}: ${e instanceof Error ? e.message : e}`);
        return { f, items: [] };
      }
    }),
  );
  const byUrl = new Map<string, NewsRow>();
  for (const { f, items } of results) {
    for (const it of items) {
      const url = cleanUrl(it.link);
      if (!url || SKIP_PATH.test(new URL(url).pathname)) continue;
      if (it.date.getTime() < since || it.date.getTime() > Date.now() + 86_400_000) continue;
      if (it.title.length < 15 || it.title.length > 400) continue;
      const places = placesIn(it.title, !!f.us);
      if (!places.length) continue;
      const prev = byUrl.get(url);
      if (prev) {
        for (const p of places) if (!prev.places.includes(p)) prev.places.push(p);
        continue;
      }
      byUrl.set(url, {
        url: url.slice(0, 600),
        title: it.title,
        outlet: f.outlet,
        published_at: it.date.toISOString(),
        places: places.slice(0, 20),
      });
    }
  }
  const rows = [...byUrl.values()];
  // Most feeds failing means something is wrong here, not with the news.
  if (failed.length > FEEDS.length / 2) throw new Error(`news: ${failed.length} of ${FEEDS.length} feeds failed (${failed.slice(0, 3).join("; ")})`);
  return { rows, failed };
}
