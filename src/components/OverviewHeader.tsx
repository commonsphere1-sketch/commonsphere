import React from "react";
import { Funnel } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OverviewHeaderProps {
  entityType: string;
  setEntityType: (v: string) => void;
  timeRange: string;
  setTimeRange: (v: string) => void;
  metric: string;
  setMetric: (v: string) => void;
}

export function OverviewHeader({
  entityType,
  setEntityType,
  timeRange,
  setTimeRange,
  metric,
  setMetric,
}: OverviewHeaderProps) {
  return (
    <section aria-labelledby="dashboard-title">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1
            id="dashboard-title"
            className="text-2xl font-bold font-sans text-foreground"
          >
            My CommonSphere Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-sans">
            Track and compare insights across your saved entities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Funnel size={20} weight="fill" className="text-secondary shrink-0" />

          <div className="flex flex-col gap-1">
            <label
              htmlFor="entity-type-select"
              className="text-xs text-muted-foreground font-sans"
            >
              Entity Type
            </label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger
                id="entity-type-select"
                className="w-36 bg-card border-border text-foreground h-9 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {["Global", "Country", "State", "City"].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                    className="hover:bg-muted text-foreground"
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="time-range-select"
              className="text-xs text-muted-foreground font-sans"
            >
              Time Range
            </label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                id="time-range-select"
                className="w-28 bg-card border-border text-foreground h-9 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {["1M", "3M", "6M", "1Y", "3Y", "5Y"].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                    className="hover:bg-muted text-foreground"
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="metric-select"
              className="text-xs text-muted-foreground font-sans"
            >
              Metric
            </label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger
                id="metric-select"
                className="w-40 bg-card border-border text-foreground h-9 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {[
                  "GDP",
                  "Population",
                  "Approval Rating",
                  "Trade Balance",
                  "Unemployment",
                ].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                    className="hover:bg-muted text-foreground"
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}
