/**
 * The Dashboard's latest headlines, merged into its Data Explorer, as asked: the same banner, under the explorer's tabs, its
 * headlines following the tab that is open - and, where the tab has one chosen, the place.
 *
 *   Countries      every desk; those naming the country chosen first, then those naming any other country or US state
 *   Economies      the economy desks; those naming a country of the region or bloc chosen first
 *   Resources      every desk; those whose words are about energy, oil, gas, metals, mining or crops first, then the rest about the economy
 *   Industry       every desk; those whose words are about companies, industry and markets first, then the rest about the economy
 *   Geopolitics    the world desks; those naming two countries or more - their relations - first
 *   Ideologies     the politics desks; those whose words are about parties, elections and forms of government first
 *   Revolutions    the world, humanitarian and crime desks; those whose words are about protests, uprisings and coups first
 *   Climate        the climate desks
 *
 * A headline is matched on its own words, as the rest of the site's banners match theirs, and the note under the banner
 * says so; nothing is matched that the headline does not say. A tab whose desks are quiet is topped up from the other
 * desks by the subject's words (HeadlinesBanner's subject), and the note says that too.
 */
import { useMemo, type ReactNode } from "react";
import { ALL_TOPICS, HeadlinesBanner, SUBJECT, namesPlace, placeName, placeTag, spread, type Headline, type HeadlinePick, type Topic } from "./HeadlinesBanner";

/** The tabs the explorer has, as DataExplorer names them. */
export type NewsTab = "countries" | "economies" | "resources" | "industry" | "geopolitics" | "ideologies" | "unrest" | "climate";

/** The newest thirty that pass `keep`, five at most from one outlet, those that pass `first` ahead of the rest; or, for the full list, all that pass, newest first. */
const firstThen =
  (first: (h: Headline) => boolean, keep: (h: Headline) => boolean = () => true): HeadlinePick =>
  (rows, all) => {
    const kept = rows.filter(keep);
    const list = all ? kept : spread([...kept.filter(first), ...kept.filter((h) => !first(h))]);
    return list.map((h) => ({ h, tag: placeTag(h.places) }));
  };
const says = (re: RegExp) => (h: Headline) => re.test(h.title);

/* The words each tab's headlines are matched on: whole words, any case. Words with a common second sense are left out -
   "strike" (an air strike), "mines" (landmines), "march" (the month), "CEO" (named in stories of every kind). */
const RESOURCE_WORDS =
  /\b(oil|crude|petroleum|gasoline|diesel|fuels?|natural gas|LNG|OPEC\+?|coal|energy|electricity|gold|silver|copper|lithium|nickel|cobalt|iron ore|steel|alumin(i)?um|uranium|rare earths?|critical minerals|mining|wheat|grain|maize|soybeans?|rice|coffee|cocoa|sugar|commodit(y|ies)|metals)\b/i;
const INDUSTRY_WORDS =
  /\b(compan(y|ies)|firms?|industr(y|ies|ial)|manufactur(er|ers|ing)|factor(y|ies)|carmakers?|automakers?|chipmakers?|semiconductors?|shares|stocks|stock markets?|earnings|profits?|revenues?|IPO|mergers?|acquisitions?|takeover|layoffs|job cuts|Wall Street|Nasdaq|FTSE|Nikkei)\b/i;
const IDEA_WORDS =
  /\b(elections?|electoral|voters?|referendums?|parliament(ary)?|coalition|opposition|left-wing|right-wing|far[- ]right|far[- ]left|cent(re|er)[- ](left|right)|socialis(t|ts|m)|conservatives?|liberals?|populis(t|ts|m)|nationalis(t|ts|m)|communis(t|ts|m)|democra(cy|cies|tic)|authoritarian|autocra(cy|cies|tic|ts?)|dictator(ship)?s?|monarch(y|ies)|ideolog(y|ies|ical)|constitution(al)?)\b/i;
const UNREST_WORDS =
  /\b(protests?|protesters?|demonstrat(ors?|ions?)|riots?|rioters?|uprisings?|revolution(s|ary)?|coup|boycotts?|unrest|crackdown|rebels?|insurgen(ts?|cy)|walkouts?|general strike|on strike|civil disobedience)\b/i;

/* From every desk: those about the subject first, then the rest about the economy (SUBJECT.economy's words) - the economy
   desks alone carry too few in two days for a subject this narrow. */
const aboutEconomy = says(SUBJECT.economy);
const PICK_RESOURCES = firstThen(says(RESOURCE_WORDS), (h) => RESOURCE_WORDS.test(h.title) || aboutEconomy(h));
const PICK_INDUSTRY = firstThen(says(INDUSTRY_WORDS), (h) => INDUSTRY_WORDS.test(h.title) || aboutEconomy(h));
/** Names two countries or more - their relations; two US states are not geopolitics. */
const namesTwoCountries = (h: Headline) => h.places.filter((p) => p.startsWith("c:") && placeName(p) !== null).length >= 2;
const PICK_GEOPOLITICS = firstThen(namesTwoCountries);
const PICK_IDEAS = firstThen(says(IDEA_WORDS));
const PICK_UNREST = firstThen(says(UNREST_WORDS));
const PICK_NEWEST = firstThen(() => false);

const ECONOMY: Topic[] = ["economy"];
const WORLD: Topic[] = ["world"];
const POLICY: Topic[] = ["policy"];
const UNREST: Topic[] = ["world", "humanitarian", "crime"];
const CLIMATE: Topic[] = ["climate"];

/** The line every note ends with: what the tag is, and where each goes. */
const TAIL = "refreshed every half hour. The tag is the place a story is about, cyan for more than one. Each links to the outlet.";

export function ExplorerHeadlines({
  tab,
  country,
  region,
  sourcesAt,
}: {
  tab: NewsTab;
  country?: { code: string; name: string } | null;
  region?: { id: string; name: string; members: string[] } | null;
  /** The place at the foot of the explorer's card where the banner's sources go, as asked. */
  sourcesAt: HTMLElement | null;
}) {
  const code = country?.code ?? null;
  const pickCountry = useMemo(() => (code ? firstThen((h) => h.places.includes(`c:${code}`), namesPlace) : firstThen(() => false, namesPlace)), [code]);
  const memberKey = region?.members.join(",") ?? "";
  const pickRegion = useMemo(() => {
    const tags = new Set(memberKey ? memberKey.split(",").map((m) => `c:${m}`) : []);
    return firstThen((h) => h.places.some((p) => tags.has(p)));
  }, [memberKey]);

  const cfg: { label: string; topics: Topic[]; pick: HeadlinePick; subject?: RegExp; note: (outlets: string) => ReactNode } =
    tab === "countries"
      ? {
          label: country ? `Latest headlines · ${country.name}` : "Latest headlines",
          topics: ALL_TOPICS,
          pick: pickCountry,
          note: (o) =>
            `The last two days' headlines naming a country or US state, from every desk the site reads - ${o} (five at most from each)${country ? `; those naming ${country.name}, where there are any, first` : ""} - ${TAIL}`,
        }
      : tab === "economies"
        ? {
            label: region ? `Economy headlines · ${region.name}` : "Economy headlines",
            topics: ECONOMY,
            subject: SUBJECT.economy,
            pick: pickRegion,
            note: (o) =>
              `The last two days' headlines from the economy desks - ${o} (five at most from each)${region ? `; those naming a country of ${region.name}, where there are any, first` : ""} - ${TAIL}`,
          }
        : tab === "resources"
          ? {
              label: "Resources headlines",
              topics: ALL_TOPICS,
              pick: PICK_RESOURCES,
              note: (o) =>
                `The last two days' headlines from every desk the site reads - ${o} (five at most from each) - about energy, oil, gas, coal, metals, mining or crops first, then the others about the economy, each matched on the headline's own words; ${TAIL}`,
            }
          : tab === "industry"
            ? {
                label: "Industry headlines",
                topics: ALL_TOPICS,
                pick: PICK_INDUSTRY,
                note: (o) =>
                  `The last two days' headlines from every desk the site reads - ${o} (five at most from each) - about companies, industry and the markets first, then the others about the economy, each matched on the headline's own words; ${TAIL}`,
              }
            : tab === "geopolitics"
              ? {
                  label: "Geopolitics headlines",
                  topics: WORLD,
                  pick: PICK_GEOPOLITICS,
                  note: (o) => `The last two days' headlines from the world desks - ${o} (five at most from each) - those naming two countries or more, the stories of their relations, first; ${TAIL}`,
                }
              : tab === "ideologies"
                ? {
                    label: "Politics headlines",
                    topics: POLICY,
                    pick: PICK_IDEAS,
                    note: (o) => `The last two days' headlines from the politics desks - ${o} (five at most from each) - those whose words are about parties, elections and forms of government first, matched on the headline's own words; ${TAIL}`,
                  }
                : tab === "unrest"
                  ? {
                      label: "Unrest headlines",
                      topics: UNREST,
                      pick: PICK_UNREST,
                      note: (o) => `The last two days' headlines from the world, humanitarian and crime desks - ${o} (five at most from each) - those whose words are about protests, uprisings, coups and boycotts first, matched on the headline's own words; ${TAIL}`,
                    }
                  : {
                      label: "Climate headlines",
                      topics: CLIMATE,
                      subject: SUBJECT.climate,
                      pick: PICK_NEWEST,
                      note: (o) => `The last two days' headlines from the climate desks - ${o} (five at most from each) - ${TAIL}`,
                    };

  // One banner a tab: its full list and its sources shut again when the tab changes. Headlines stored before the desks were
  // tagged are read only where every desk is (Countries, Resources, Industry): a tab of one kind of desk takes only that desk's.
  // A tab matched on words reads deeper into the two days - the 400 newest - so that it finds more than a handful.
  const read = tab === "resources" || tab === "industry" ? 400 : 150;
  // The description under each banner was taken off, as asked (`plain`): only its sources stay, a press away. What each tab
  // reads and puts first is set out above and in each `note`, kept here for the record.
  return <HeadlinesBanner key={tab} label={cfg.label} topics={cfg.topics} days={2} read={read} untagged={cfg.topics === ALL_TOPICS} pick={cfg.pick} subject={cfg.subject} note={cfg.note} plain sourcesAt={sourcesAt} />;
}

export default ExplorerHeadlines;
