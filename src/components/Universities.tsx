/**
 * The universities and colleges of a city or a country, in its window.
 *
 * The list is Wikidata's (universities.ts, build-universities.cjs): the
 * institutions it classes as higher education and places there, the twelve
 * written about in the most language editions of Wikipedia. Each row gives
 * its name, the year it was founded and Wikidata's one-line description;
 * opening a row quotes the opening of its Wikipedia article - what it is
 * about and what it is known for, in Wikipedia's words - fetched then
 * (UniversityList, which the state window's schools are drawn with too).
 *
 * It is not a ranking: nobody's league table is here, and the order is only
 * how widely each is written about. The panel says so.
 */
import { GraduationCap } from "@phosphor-icons/react";
import { CITY_UNIVERSITIES, COUNTRY_UNIVERSITIES, UNIVERSITIES_SOURCE } from "../data/universities";
import { ChartNote } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { UniversityList } from "./UniversityList";

export default function Universities({ city, country, place, className = "" }: { /** A city's id, or … */ city?: string; /** … a country's ISO code. */ country?: string; place: string; className?: string }) {
  const list = (city ? CITY_UNIVERSITIES[city] : country ? COUNTRY_UNIVERSITIES[country] : undefined) ?? [];
  if (!list.length) return null;
  return (
    <div className={`modal-tile rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-2 mb-3">
        <div className="p-1.5 rounded-md border border-border bg-muted text-muted-foreground shrink-0">
          <GraduationCap size={13} weight="fill" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">Universities &amp; colleges</h3>
          <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-0.5">
            The {list.length} in {place} most widely written about · open one for what it is about and known for
          </p>
        </div>
      </div>

      <UniversityList list={list} />

      <ChartNote className="mt-3">
        Wikidata's list of the higher-education institutions it places in {place}, in the order of how many language editions of Wikipedia have an article on each:
        how widely one is written about, not a ranking of how good it is. One with no English article, or since dissolved, is left out. The year is its founding as
        Wikidata gives it; what it is known for is the opening of its Wikipedia article.
      </ChartNote>
      <SourceLink sources={[UNIVERSITIES_SOURCE]} className="mt-2" />
    </div>
  );
}
