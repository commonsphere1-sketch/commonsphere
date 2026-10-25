import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import {
  ALL_TOPICS,
  HeadlinesBanner,
  SUBJECT,
  followedFirst,
  namesAbroad,
  namesPlace,
  namesTwo,
  pickWhere,
  useFollowedTags,
  type HeadlinePick,
  type Topic,
} from "./HeadlinesBanner";
import { pickWorld } from "../lib/headlinePicks";

/**
 * The site's headline banners, together on the News page, as asked: each the same banner its own page shows - the same
 * desks, the same window of days, the same choice of headlines - with a link to that page. The leaders' and the cities'
 * banners pick their headlines by the names their pages hold, so those two are read in when the News page opens.
 */
type Desk = {
  key: string;
  label: string;
  topics: Topic[];
  days: number;
  read?: number;
  untagged?: boolean;
  subject?: RegExp;
  pick?: HeadlinePick;
  /** What the banner carries, in a few words, under it. */
  about: string;
  page: { to: string; name: string };
};

const pickRelations = pickWhere(namesTwo);
const pickPlaced = pickWhere(namesPlace);
const DAY_WORDS = ["", "the last day", "the last two days", "the last three days", "the last four days", "the last five days"];

export function NewsDesks() {
  const followed = useFollowedTags();
  const countryPick = useMemo(() => followedFirst(followed, namesAbroad), [followed]);
  const yoursPick = useMemo(() => followedFirst(followed, namesPlace), [followed]);
  // The two banners that pick by the names their pages hold, read in with those pages' code.
  const [byName, setByName] = useState<{ leaders?: HeadlinePick; cities?: HeadlinePick }>({});
  useEffect(() => {
    let off = false;
    import("../pages/WorldleadersPage").then((m) => !off && setByName((b) => ({ ...b, leaders: m.pickLeaders })));
    import("../pages/CitiesPage").then((m) => !off && setByName((b) => ({ ...b, cities: m.pickCities })));
    return () => {
      off = true;
    };
  }, []);

  const desks: Desk[] = [
    { key: "latest", label: "Latest headlines", topics: ALL_TOPICS, days: 2, read: 150, untagged: true, about: "from every desk the site reads", page: { to: "/dashboard", name: "Dashboard" } },
    { key: "world", label: "World headlines", topics: ["world"], days: 2, untagged: true, pick: pickWorld, about: "naming a country outside the United States", page: { to: "/dashboard/worldview", name: "Worldview" } },
    { key: "countries", label: "Country headlines", topics: ALL_TOPICS, days: 2, read: 200, untagged: true, pick: countryPick, about: "naming a country, the ones you follow first", page: { to: "/dashboard/countries", name: "Countries" } },
    ...(byName.leaders ? [{ key: "leaders", label: "Leaders in the news", topics: ["world", "policy"] as Topic[], days: 2, read: 400, untagged: true, pick: byName.leaders, about: "naming a leader the site profiles", page: { to: "/dashboard/world-leaders", name: "World Leaders" } }] : []),
    { key: "relations", label: "Relations in the news", topics: ALL_TOPICS, days: 2, read: 300, untagged: true, pick: pickRelations, about: "naming two places or more", page: { to: "/dashboard/comparisons", name: "Comparisons" } },
    { key: "places", label: "Country and state headlines", topics: ALL_TOPICS, days: 2, read: 150, untagged: true, pick: pickPlaced, about: "naming a country or a US state", page: { to: "/dashboard/rankings", name: "Compare" } },
    ...(byName.cities ? [{ key: "cities", label: "City headlines", topics: ["world", "economy", "policy", "us"] as Topic[], days: 2, read: 400, untagged: true, pick: byName.cities, about: "naming a city the site profiles", page: { to: "/dashboard/cities", name: "Cities" } }] : []),
    { key: "economy", label: "Economy headlines", topics: ["economy"], subject: SUBJECT.economy, days: 3, read: 120, about: "from the economy desks", page: { to: "/dashboard/economies", name: "Economies" } },
    { key: "policy", label: "Policy headlines", topics: ["policy"], days: 2, read: 150, about: "from national politics desks and US statehouse coverage", page: { to: "/dashboard/policy", name: "Policy" } },
    { key: "society", label: "Policy and society headlines", topics: ["policy", "humanitarian"], days: 2, read: 120, about: "politics, policy and humanitarian news", page: { to: "/dashboard/indexes", name: "Indexes" } },
    { key: "climate", label: "Climate headlines", topics: ["climate"], subject: SUBJECT.climate, days: 5, about: "from the climate desks", page: { to: "/dashboard/planetary-boundaries", name: "Climate" } },
    { key: "crime", label: "Crime and justice headlines", topics: ["crime"], days: 5, read: 100, about: "organised crime, corruption and the US and UK crime desks", page: { to: "/dashboard/crime", name: "Crime" } },
    { key: "yours", label: "Your places in the news", topics: ALL_TOPICS, days: 2, read: 300, untagged: true, pick: yoursPick, about: "about the countries and states you follow, starred and first", page: { to: "/dashboard/notes", name: "My Notes" } },
  ];

  return (
    <section aria-labelledby="news-desks" className="mb-6">
      <div className="flex items-baseline gap-3 px-1 pb-3">
        <h2 id="news-desks" className="text-sm font-bold font-sans text-foreground">
          The site&#39;s desks
        </h2>
        <span className="text-[10px] font-sans text-muted-foreground">every headline banner on the site, each as its page shows it</span>
        <span className="flex-1 h-px bg-border" aria-hidden />
      </div>
      <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
        {desks.map((d) => (
          <HeadlinesBanner
            key={d.key}
            label={d.label}
            topics={d.topics}
            days={d.days}
            read={d.read}
            untagged={d.untagged}
            subject={d.subject}
            pick={d.pick}
            // Held to its column: the moving row is wider than any screen.
            className="min-w-0"
            note={(outlets) => (
              <>
                The headlines of {DAY_WORDS[d.days] ?? `the last ${d.days} days`} {d.about}, from {outlets}, refreshed every half hour; each links to the outlet.{" "}
                <Link to={d.page.to} className="inline-flex items-center gap-0.5 font-semibold text-foreground/80 underline hover:text-foreground">
                  On the {d.page.name} page <ArrowRight size={9} weight="bold" aria-hidden />
                </Link>
              </>
            )}
          />
        ))}
      </div>
    </section>
  );
}
