/**
 * Headlines from established news outlets, matched to the countries and US
 * states they are about.
 *
 * Sources: the outlets' own public RSS feeds - wire-quality international
 * desks, public broadcasters, the UN's news service, US politics and
 * statehouse desks for the states, national politics desks, business desks,
 * the humanitarian agencies' own newsrooms (ICRC, IFRC, MSF) and climate
 * desks. ReliefWeb's feed answers servers with a bot check, so it is not
 * among them. (GDELT, the open news index, was the
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
 * names need rules (Georgia, Washington, Jordan, Chad); see below. A desk
 * that covers one country or state (UK politics, CalMatters) gives its own
 * place to a headline that names none: that is what its stories are about.
 *
 * Each feed also carries the topics of the site's pages it serves - world
 * affairs, US news, the economy, public policy, humanitarian crises, the
 * climate, crime and justice - so each page's banner draws on the desks
 * that cover its subject.
 * A world-affairs headline is kept only when it names a place; a topical
 * one is kept either way, since "Carbon dioxide hits a new high" is climate
 * news without naming a country.
 */
import { COUNTRY_NAMES } from "./places.ts";
import { STATES, UA } from "./sources.ts";

/** The pages a feed serves, as the site's banners ask for them. */
export type Topic = "world" | "us" | "economy" | "policy" | "humanitarian" | "climate" | "crime";

export type NewsRow = {
  url: string;
  title: string;
  outlet: string;
  published_at: string;
  /** "c:JP" for a country, "s:tx" for a US state. */
  places: string[];
  topics: Topic[];
};

type Feed = {
  url: string;
  outlet: string;
  topics: Topic[];
  /** A US desk, where "Georgia" is the state rather than the country. */
  us?: boolean;
  /** The one country or state a desk covers, for headlines that name no place. */
  home?: string;
};

/** The banners list these as their sources: after changing them, run `node build-news-sources.cjs`. */
export const FEEDS: Feed[] = [
  // World affairs.
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", outlet: "BBC News", topics: ["world"] },
  { url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", outlet: "BBC News", topics: ["world"] },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", outlet: "BBC News", topics: ["world"] },
  { url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml", outlet: "BBC News", topics: ["world"] },
  { url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", outlet: "BBC News", topics: ["world"] },
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", outlet: "BBC News", topics: ["world"] },
  { url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml", outlet: "BBC News", topics: ["world", "us"], us: true },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", outlet: "Al Jazeera", topics: ["world"] },
  { url: "https://feeds.npr.org/1004/rss.xml", outlet: "NPR", topics: ["world"] },
  { url: "https://rss.dw.com/rdf/rss-en-world", outlet: "DW", topics: ["world"] },
  { url: "https://www.france24.com/en/rss", outlet: "France 24", topics: ["world"] },
  { url: "https://www.theguardian.com/world/rss", outlet: "The Guardian", topics: ["world"] },
  { url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", outlet: "UN News", topics: ["world"] },
  { url: "https://www.pbs.org/newshour/feeds/rss/world", outlet: "PBS NewsHour", topics: ["world"] },
  { url: "https://foreignpolicy.com/feed/", outlet: "Foreign Policy", topics: ["world", "policy"] },
  { url: "https://thediplomat.com/feed/", outlet: "The Diplomat", topics: ["world", "policy"] },
  { url: "https://www.abc.net.au/news/feed/51120/rss.xml", outlet: "ABC News (Australia)", topics: ["world"] },
  { url: "https://www.euronews.com/rss?level=theme&name=news", outlet: "Euronews", topics: ["world"] },
  { url: "https://www.scmp.com/rss/91/feed", outlet: "South China Morning Post", topics: ["world"] },
  { url: "https://www.japantimes.co.jp/feed/", outlet: "The Japan Times", topics: ["world"] },
  { url: "https://www.straitstimes.com/news/world/rss.xml", outlet: "The Straits Times", topics: ["world"] },
  { url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", outlet: "CNA", topics: ["world"] },
  { url: "https://www.africanews.com/feed/rss", outlet: "Africanews", topics: ["world"] },
  { url: "https://www.thehindu.com/news/international/feeder/default.rss", outlet: "The Hindu", topics: ["world"] },
  { url: "https://mercopress.com/rss/", outlet: "MercoPress", topics: ["world"] },
  // US national and state desks.
  { url: "https://feeds.npr.org/1014/rss.xml", outlet: "NPR", topics: ["us", "policy"], us: true, home: "c:US" },
  { url: "https://www.theguardian.com/us-news/rss", outlet: "The Guardian", topics: ["us"], us: true, home: "c:US" },
  { url: "https://www.pbs.org/newshour/feeds/rss/politics", outlet: "PBS NewsHour", topics: ["us", "policy"], us: true, home: "c:US" },
  { url: "https://rss.politico.com/politics-news.xml", outlet: "Politico", topics: ["us", "policy"], us: true, home: "c:US" },
  { url: "https://thehill.com/homenews/state-watch/feed/", outlet: "The Hill", topics: ["us", "policy"], us: true, home: "c:US" },
  { url: "https://stateline.org/feed/", outlet: "Stateline", topics: ["us", "policy"], us: true, home: "c:US" },
  { url: "https://calmatters.org/feed/", outlet: "CalMatters", topics: ["us", "policy"], us: true, home: "s:ca" },
  // Politics and public policy beyond the US.
  { url: "https://feeds.bbci.co.uk/news/politics/rss.xml", outlet: "BBC News", topics: ["policy"], home: "c:GB" },
  { url: "https://www.theguardian.com/politics/rss", outlet: "The Guardian", topics: ["policy"], home: "c:GB" },
  { url: "https://www.politico.eu/feed/", outlet: "Politico Europe", topics: ["policy"] },
  { url: "https://www.cbc.ca/webfeed/rss/rss-politics", outlet: "CBC News", topics: ["policy"], home: "c:CA" },
  { url: "https://www.abc.net.au/news/feed/1534/rss.xml", outlet: "ABC News (Australia)", topics: ["policy"], home: "c:AU" },
  { url: "https://www.rnz.co.nz/rss/political.xml", outlet: "RNZ", topics: ["policy"], home: "c:NZ" },
  // The economy.
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", outlet: "BBC News", topics: ["economy"] },
  { url: "https://www.theguardian.com/business/economics/rss", outlet: "The Guardian", topics: ["economy"] },
  { url: "https://feeds.npr.org/1017/rss.xml", outlet: "NPR", topics: ["economy", "us"], us: true, home: "c:US" },
  { url: "https://rss.dw.com/rdf/rss-en-bus", outlet: "DW", topics: ["economy"] },
  { url: "https://www.france24.com/en/business-tech/rss", outlet: "France 24", topics: ["economy"] },
  { url: "https://news.un.org/feed/subscribe/en/news/topic/economic-development/feed/rss.xml", outlet: "UN News", topics: ["economy"] },
  { url: "https://www.thehindu.com/business/Economy/feeder/default.rss", outlet: "The Hindu", topics: ["economy"], home: "c:IN" },
  // Humanitarian crises.
  { url: "https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/feed/rss.xml", outlet: "UN News", topics: ["humanitarian"] },
  { url: "https://news.un.org/feed/subscribe/en/news/topic/migrants-and-refugees/feed/rss.xml", outlet: "UN News", topics: ["humanitarian"] },
  { url: "https://www.thenewhumanitarian.org/rss/all.xml", outlet: "The New Humanitarian", topics: ["humanitarian"] },
  { url: "https://www.icrc.org/en/rss/news", outlet: "ICRC", topics: ["humanitarian"] },
  { url: "https://www.ifrc.org/rss.xml", outlet: "IFRC", topics: ["humanitarian"] },
  { url: "https://www.msf.org/rss/all", outlet: "MSF", topics: ["humanitarian"] },
  // The climate.
  { url: "https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml", outlet: "UN News", topics: ["climate"] },
  { url: "https://www.theguardian.com/environment/climate-crisis/rss", outlet: "The Guardian", topics: ["climate"] },
  { url: "https://www.carbonbrief.org/feed", outlet: "Carbon Brief", topics: ["climate"] },
  { url: "https://insideclimatenews.org/feed/", outlet: "Inside Climate News", topics: ["climate"] },
  { url: "https://www.climatechangenews.com/feed/", outlet: "Climate Home News", topics: ["climate"] },
  { url: "https://rss.dw.com/rdf/rss-en-environment", outlet: "DW", topics: ["climate"] },
  // Crime and justice: organized crime and corruption worldwide, and the US and UK crime desks.
  { url: "https://www.occrp.org/en/feed", outlet: "OCCRP", topics: ["crime"] },
  { url: "https://insightcrime.org/feed/", outlet: "InSight Crime", topics: ["crime"] },
  { url: "https://globalinitiative.net/feed/", outlet: "Global Initiative", topics: ["crime"] },
  { url: "https://www.themarshallproject.org/rss/recent", outlet: "The Marshall Project", topics: ["crime", "us"], us: true, home: "c:US" },
  { url: "https://www.thetrace.org/feed/", outlet: "The Trace", topics: ["crime", "us"], us: true, home: "c:US" },
  { url: "https://www.theguardian.com/us-news/us-crime/rss", outlet: "The Guardian", topics: ["crime", "us"], us: true, home: "c:US" },
  { url: "https://www.theguardian.com/uk/ukcrime/rss", outlet: "The Guardian", topics: ["crime"], home: "c:GB" },
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

/**
 * RSS 2.0, RDF (RSS 1.0) and Atom items: title, link and date. An item that
 * declares a language other than English is left out - Politico Europe's
 * feed carries its French and German stories among the English ones.
 */
export function parseFeed(xml: string): { title: string; link: string; date: Date }[] {
  const out: { title: string; link: string; date: Date }[] = [];
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  for (const b of blocks) {
    const lang = decode(tag(b, "language") ?? tag(b, "dc:language") ?? "").toLowerCase();
    if (lang && !lang.startsWith("en")) continue;
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
        // CBC's feed can take over 20 seconds; the feeds are fetched side by side, so the wait is shared.
        const res = await fetch(f.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
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
      if (!places.length && f.home) places.push(f.home);
      // A world-affairs headline is only useful here when it names a place.
      if (!places.length && !f.topics.some((t) => t !== "world")) continue;
      const prev = byUrl.get(url);
      if (prev) {
        // The same story from two desks: every place, and every page it serves.
        for (const p of places) if (!prev.places.includes(p)) prev.places.push(p);
        for (const t of f.topics) if (!prev.topics.includes(t)) prev.topics.push(t);
        continue;
      }
      byUrl.set(url, {
        url: url.slice(0, 600),
        title: it.title,
        outlet: f.outlet,
        published_at: it.date.toISOString(),
        places: places.slice(0, 20),
        topics: [...f.topics],
      });
    }
  }
  // A story merged from several desks can gather more places than the table takes.
  const rows = [...byUrl.values()].map((r) => ({ ...r, places: r.places.slice(0, 20) }));
  // Most feeds failing means something is wrong here, not with the news.
  if (failed.length > FEEDS.length / 2) throw new Error(`news: ${failed.length} of ${FEEDS.length} feeds failed (${failed.slice(0, 3).join("; ")})`);
  return { rows, failed };
}
