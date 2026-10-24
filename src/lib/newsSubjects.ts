import { countriesData } from "@/data/countriesData";
import { SUBJECT, namesAbroad, placeName, type Headline } from "@/components/HeadlinesBanner";

/**
 * The News page's places and subjects, shared by its list and its tracker.
 * The places are those the news job tags a headline with; a subject or an
 * event is a match of the headline's words, so one headline can sit under
 * several, or none.
 */

/* ─── Where ─────────────────────────────────────────────────────────────── */

export const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"] as const;
export type Continent = (typeof CONTINENTS)[number];
/** "JP" → "Asia". */
export const CONTINENT_OF_CODE = new Map(countriesData.map((c) => [c.code, c.continent]));
const countriesNamed = (h: Headline) => h.places.filter((p) => p.startsWith("c:") && placeName(p) !== null);

/** "global", "intl", "cont:Asia", "c:JP" or "s:tx". */
export type Where = string;
export const inWhere =
  (where: Where) =>
  (h: Headline): boolean => {
    if (where === "global") return true;
    // Between countries: it names two or more, one of them not the United States - the US desks tag every story with the US.
    if (where === "intl") return countriesNamed(h).length >= 2 && namesAbroad(h);
    if (where.startsWith("cont:")) {
      const c = where.slice(5);
      return h.places.some((p) => (p.startsWith("c:") && CONTINENT_OF_CODE.get(p.slice(2)) === c) || (c === "North America" && p.startsWith("s:") && placeName(p) !== null));
    }
    return h.places.includes(where);
  };

/* ─── Subjects ──────────────────────────────────────────────────────────── */

/*
 * The words that put a headline under a subject: whole words, any case. The
 * ambiguous are left out - "Labour" is also the labour market, "union" the
 * European Union, "rally" a market's, "mines" also landmines, "security"
 * also social security - and deaths are not counted as security, since
 * floods and earthquakes kill too.
 */
export const SUBJECTS = [
  {
    id: "political",
    label: "Political",
    re: /\b(elections?|electoral|voters?|voting|votes?|ballots?|referendums?|parliament(ary)?|congress(ional)?|senate|senators?|lawmakers?|legislat(ure|ures|ion|ive|ors?)|presiden(t|ts|tial|cy)|prime ministers?|ministers?|ministry|cabinet|governments?|coalition|opposition (leader|party|parties)|political|politics|politicians?|impeach(ment|ed)?|governors?|mayors?|diplomats?|diplomacy|diplomatic|summit|treaty|embassy|White House|Kremlin|Downing Street|Democrats?|Republicans?|Tories|Supreme Court|constitution(al)?)\b/i,
  },
  {
    id: "social",
    label: "Sociological",
    re: /\b(protests?|protesters?|demonstrat(ion|ions|ors)|immigra(tion|nts?)|migrants?|migration|refugees?|asylum|education|schools?|teachers?|students?|universit(y|ies)|healthcare|health care|hospitals?|patients?|doctors?|nurses?|poverty|inequality|housing|homeless(ness)?|welfare|pensions?|religio(n|us)|church(es)?|mosques?|synagogues?|racism|racial|discrimination|gender|women|women's|LGBTQ?|transgender|abortion|same-sex|birth rates?|census|families|children|youth|communit(y|ies)|civil rights|human rights|free speech|social media)\b/i,
  },
  {
    id: "environmental",
    label: "Environmental",
    re: /\b(climate|emissions?|carbon|CO2|greenhouse|heatwaves?|heat wave|wildfires?|bushfires?|droughts?|floods?|flooding|glaciers?|sea[- ]level|global warming|renewables?|solar|wind (power|farms?|energy)|fossil fuels?|coal|net[- ]zero|COP\d+|El Niño|La Niña|hurricanes?|typhoons?|cyclones?|storms?|tornado(es)?|earthquakes?|quakes?|volcan(o|oes|ic)|eruptions?|tsunamis?|landslides?|pollution|polluted|air quality|smog|plastics?|wildlife|species|extinct(ion)?|endangered|biodiversity|deforestation|forests?|oceans?|coral|conservation|environment(al)?|recycling)\b/i,
  },
  { id: "economic", label: "Economic", re: SUBJECT.economy },
  {
    id: "security",
    label: "Security",
    re: /\b(wars?|warfare|military|militaries|troops|soldiers?|army|armies|navy|naval|air force|missiles?|drones?|air ?strikes?|shelling|bomb(s|ing|ings|ed)?|explosions?|attacks?|attacked|shootings?|gunman|gunmen|gunfire|terror(ism|ist|ists)?|ceasefire|truce|hostages?|invasion|invade[ds]?|rebels?|militants?|insurgents?|jihadists?|NATO|defen[cs]e|weapons?|cyber ?attacks?|hack(s|ers?|ed|ing)?|police|arrest(s|ed)?|crimes?|criminals?|murders?|gangs?|cartels?|security forces|national security|Security Council|border (guards?|patrol)|conflicts?|clashes|violence|coup)\b/i,
  },
  {
    id: "industrial",
    label: "Industrial",
    re: /\b(industr(y|ies|ial)|manufactur(ing|ers?)|factor(y|ies)|carmakers?|automakers?|car makers?|electric (cars?|vehicles?)|EVs?|chipmakers?|chips?|semiconductors?|steel|alumin(i)?um|copper|lithium|mining|miners?|oil|natural gas|gas (prices|supplies|supply|fields?)|refiner(y|ies)|pipelines?|shipping|shipbuild(ing|ers?)|airlines?|aerospace|aircraft|Boeing|Airbus|supply chains?|production|output|layoffs|job cuts|workers|trade unions?|labou?r unions?|construction|pharmaceuticals?|drugmakers?|tech (firms?|companies|giants?)|artificial intelligence|AI|data cent(re|er)s?|power plants?|utilities|telecoms?|start-?ups?|compan(y|ies)|firms?|corporat(e|ion|ions))\b/i,
  },
] as const;

/*
 * Events, as asked: the kinds of occurrence the tracker follows by region.
 * Narrower than the subjects, and the words that mean something else are
 * kept out: a "trade war" or "culture war" is not a war, an "outbreak of
 * fighting" is not an epidemic, and "revolution" alone is as often an AI
 * revolution as a political one - so only the words that are about
 * overthrowing a government count there.
 */
export const EVENTS = [
  {
    id: "unrest",
    label: "Civil unrest",
    re: /\b(protests?|protesters?|protested|protesting|demonstrat(ion|ions|ors)|riots?|rioters?|rioting|unrest|tear gas|curfews?|general strike|street clashes|clashes with police|looting)\b/i,
  },
  {
    id: "revolution",
    label: "Revolutions and coups",
    re: /\b(coups?|coup d'état|putsch|juntas?|uprisings?|insurrections?|revolts?|rebellions?|revolutionaries|overthrow(n|s|ing)?|ousted|seized power|seize power|martial law|regime change)\b/i,
  },
  {
    id: "war",
    label: "Wars and conflicts",
    re: /\b((?<!(trade|price|culture|tariff|bidding|turf|format|talent|streaming|console|flame|word|chip) )wars?|warfare|armed conflict|civil war|troops|shelling|air ?strikes?|missile (strikes?|attacks?)|drone (strikes?|attacks?)|front ?lines?|ceasefire|truce|invasion|invaded|insurgen(ts|cy)|rebels?|militias?|battlefield|killed in fighting|heavy fighting)\b/i,
  },
  {
    id: "terror",
    label: "Terrorism",
    re: /\b(terror(ism|ist|ists)?|suicide (bomb|bomber|bombers|bombing|attack)|car bomb(s|ing)?|jihadists?|Islamic State|ISIS|ISIL|al-Qaeda|al-Shabaab|Boko Haram|extremist attacks?)\b/i,
  },
  {
    id: "disaster",
    label: "Natural disasters",
    re: /\b(earthquakes?|quakes?|tsunamis?|volcan(o|oes|ic eruptions?)|eruptions?|hurricanes?|typhoons?|cyclones?|tropical storms?|tornado(es)?|floods?|flooding|flash floods?|landslides?|mudslides?|wildfires?|bushfires?|forest fires?|droughts?|heatwaves?|heat wave|avalanches?|blizzards?|famine)\b/i,
  },
  {
    id: "epidemic",
    label: "Epidemics",
    re: /\b(epidemics?|pandemics?|outbreaks?(?! of (violence|fighting|war|hostilities|unrest))|cholera|measles|ebola|mpox|monkeypox|dengue|malaria|polio|bird flu|avian flu|H5N1|influenza|flu|covid(-19)?|coronavirus|marburg|zika|yellow fever|meningitis|meningococcal|tuberculosis|hantavirus|plague|anthrax|chikungunya|nipah|lassa|diphtheria|whooping cough|hepatitis)\b/i,
  },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"] | (typeof EVENTS)[number]["id"] | "all";
export type EventId = (typeof EVENTS)[number]["id"];
/** A subject's or event's words, by its id. */
export const wordsOf = (id: SubjectId): RegExp | undefined => [...SUBJECTS, ...EVENTS].find((s) => s.id === id)?.re;
export const labelOf = (id: SubjectId): string | undefined => [...SUBJECTS, ...EVENTS].find((s) => s.id === id)?.label;
