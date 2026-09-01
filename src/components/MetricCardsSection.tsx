import React from "react";
import {
  TrendUp,
  TrendDown,
  Users,
  CurrencyDollar,
  ChartBar,
  Scales,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

interface MetricCardProps {
  title: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  subtitle: string;
  icon: React.ReactNode;
}

function MetricCard({
  title,
  value,
  delta,
  deltaPositive,
  subtitle,
  icon,
}: MetricCardProps) {
  const navigate = useNavigate();
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate("/dashboard/comparisons")}
      onKeyDown={(e) => e.key === "Enter" && navigate("/dashboard/comparisons")}
      className="bg-card border border-border rounded-lg p-5 cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={`${title}: ${value}, ${deltaPositive ? "up" : "down"} ${delta}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-muted rounded-md text-secondary">{icon}</div>
        <span
          className={`flex items-center gap-1 text-xs font-mono font-medium px-2 py-1 rounded-full ${
            deltaPositive
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive"
          }`}
        >
          {deltaPositive ? (
            <TrendUp size={14} weight="bold" />
          ) : (
            <TrendDown size={14} weight="bold" />
          )}
          {delta}
        </span>
      </div>
      <p className="text-muted-foreground text-xs font-sans mb-1">{title}</p>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-muted-foreground text-xs font-sans mt-1">{subtitle}</p>
    </article>
  );
}

// World Bank world aggregates, 2025 — the most recent completed year the
// source publishes. These read $104.5T and 8.12B labelled "estimated 2024",
// which did not match the World Bank's own 2024 figures either ($111.67T and
// 8.141B). Deltas are 2024 to 2025 from the same series.
const metricsData = [
  {
    title: "Global GDP",
    value: "$118.4T",
    delta: "+6.0%",
    deltaPositive: true,
    subtitle: "World Bank · 2025",
    icon: <CurrencyDollar size={22} weight="fill" />,
  },
  {
    title: "World Population",
    value: "8.22B",
    delta: "+0.9%",
    deltaPositive: true,
    subtitle: "World Bank · 2025",
    icon: <Users size={22} weight="fill" />,
  },
  {
    title: "Avg. Approval Rating",
    value: "47.3%",
    delta: "-1.8%",
    deltaPositive: false,
    subtitle: "across tracked entities",
    icon: <ChartBar size={22} weight="fill" />,
  },
  {
    title: "Trade Balance Index",
    value: "0.84",
    delta: "+0.05",
    deltaPositive: true,
    subtitle: "normalized global index",
    icon: <Scales size={22} weight="fill" />,
  },
];

interface MetricCardsSectionProps {
  metric: string;
}

export function MetricCardsSection({ metric }: MetricCardsSectionProps) {
  return (
    <section aria-labelledby="highlights-heading">
      <h2
        id="highlights-heading"
        className="text-lg font-semibold font-sans text-foreground mb-4"
      >
        Highlights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
