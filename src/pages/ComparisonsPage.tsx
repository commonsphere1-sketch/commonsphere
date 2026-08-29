import { ArrowsLeftRight } from "@phosphor-icons/react";
import { ComparisonModule } from "../components/ComparisonModule";

export function ComparisonsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <ArrowsLeftRight size={26} weight="fill" className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">Compare Countries &amp; States</h1>
            <p className="text-muted-foreground text-sm font-sans">
              Select any mix of countries and US states to compare statistics side by side
            </p>
          </div>
        </div>
        <ComparisonModule />
      </div>
    </div>
  );
}
