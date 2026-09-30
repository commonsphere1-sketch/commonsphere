import { ComparisonModule } from "../components/ComparisonModule";
import { HeadlinesBanner, ALL_TOPICS, namesTwo, pickWhere } from "../components/HeadlinesBanner";

/** Stories naming two places or more: the news that sets them side by side. */
const pickRelations = pickWhere(namesTwo);

export function ComparisonsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">Compare Countries &amp; States</h1>
            <p className="text-muted-foreground text-sm font-sans">
              Select any mix of countries and US states to compare statistics side by side
            </p>
          </div>
        </div>
        <HeadlinesBanner
          label="Relations in the news"
          topics={ALL_TOPICS}
          days={2}
          read={300}
          untagged
          pick={pickRelations}
          className="mb-6"
          note={(outlets) => (
            <>
              The last two days' headlines naming two places or more - the stories that set countries and states side by
              side - from {outlets} (five at most from each), refreshed every half hour. The tag names the places. Each
              links to the outlet.
            </>
          )}
        />
        <ComparisonModule />
      </div>
    </div>
  );
}
