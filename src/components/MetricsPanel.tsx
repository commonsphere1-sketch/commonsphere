import { useState } from "react";
import {
  METRIC_CATEGORIES,
  COUNTRY_METRICS,
  STATE_METRICS,
  type MetricsProfile,
} from "../data/comprehensiveMetrics";
import { SourceLink } from "./SourceLink";
import { CaretDown, CaretUp, MagnifyingGlass, X } from "@phosphor-icons/react";

const SOURCES = [
  { label: "UNDP Human Development Reports", url: "https://hdr.undp.org/" },
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
  {
    label: "EIU Democracy Index",
    url: "https://www.eiu.com/n/campaigns/democracy-index-2023/",
  },
  {
    label: "Freedom House",
    url: "https://freedomhouse.org/report/freedom-world",
  },
  {
    label: "Transparency International CPI",
    url: "https://www.transparency.org/en/cpi/",
  },
  { label: "Yale EPI", url: "https://epi.yale.edu/" },
  { label: "RSF Press Freedom", url: "https://rsf.org/en/index" },
  {
    label: "IEP Global Peace Index",
    url: "https://www.visionofhumanity.org/maps/",
  },
];

function ScoreBar({
  score,
  invertScale,
}: {
  score: number;
  invertScale?: boolean;
}) {
  const displayScore = invertScale ? 100 - score : score;
  const color =
    displayScore >= 70
      ? "hsl(142,71%,45%)"
      : displayScore >= 45
        ? "hsl(38,92%,50%)"
        : "hsl(0,70%,55%)";
  return (
    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, displayScore))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function ScoreBadge({
  score,
  invertScale,
}: {
  score: number;
  invertScale?: boolean;
}) {
  const displayScore = invertScale ? 100 - score : score;
  const cls =
    displayScore >= 70
      ? "text-success bg-success/10"
      : displayScore >= 45
        ? "text-warning bg-warning/10"
        : "text-destructive bg-destructive/10";
  return (
    <span
      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${cls}`}
    >
      {displayScore.toFixed(0)}
    </span>
  );
}

interface MetricsPanelProps {
  entityId: string;
  entityType: "country" | "state";
}

export function MetricsPanel({ entityId, entityType }: MetricsPanelProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  const profile: MetricsProfile =
    entityType === "country"
      ? (COUNTRY_METRICS[entityId] ?? {})
      : (STATE_METRICS[entityId] ?? {});

  const totalMetrics = METRIC_CATEGORIES.flatMap((c) =>
    c.keys.filter((k) => !!(profile as any)[k]),
  ).length;

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setCollapsed({});
    } else {
      const all: Record<string, boolean> = {};
      METRIC_CATEGORIES.forEach((c) => {
        all[c.id] = true;
      });
      setCollapsed(all);
    }
    setExpandAll((v) => !v);
  };

  // Global search mode
  const searchResults =
    search.trim().length > 1
      ? METRIC_CATEGORIES.flatMap((cat) =>
          cat.keys.flatMap((key) => {
            const m = (profile as any)[key];
            if (!m) return [];
            if (
              m.label.toLowerCase().includes(search.toLowerCase()) ||
              key.toLowerCase().includes(search.toLowerCase())
            ) {
              return [{ key, catLabel: cat.label, catIcon: cat.icon, ...m }];
            }
            return [];
          }),
        )
      : null;

  // Category-level average score for summary badge
  const getCatAvgScore = (keys: readonly string[]) => {
    const scores = keys
      .map((k) => (profile as any)[k])
      .filter(Boolean)
      .filter((m: any) => m.score !== undefined)
      .map((m: any) => (m.invertScale ? 100 - m.score : m.score));
    if (!scores.length) return null;
    return Math.round(
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
    );
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
            Comprehensive Index Dashboard
          </p>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            {totalMetrics} metrics across 13 index categories · 2024–2026
            estimates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Expand / collapse all */}
          <button
            onClick={handleExpandAll}
            className="text-[10px] font-sans text-muted-foreground hover:text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {expandAll ? "Expand All" : "Collapse All"}
          </button>
          {/* Search */}
          <div className="flex items-center gap-2 bg-muted/60 border border-border/60 rounded-lg px-3 py-1.5">
            <MagnifyingGlass
              size={12}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search metrics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none w-28"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search results mode */}
      {searchResults !== null ? (
        <div className="space-y-2">
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground font-sans py-4 text-center">
              No metrics found for &ldquo;{search}&rdquo;
            </p>
          ) : (
            searchResults.map((m) => (
              <MetricRow
                key={m.key}
                metric={m}
                showCategory
                catLabel={m.catLabel}
                catIcon={m.catIcon}
              />
            ))
          )}
        </div>
      ) : (
        /* Dashboard grid — all 13 categories */
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {METRIC_CATEGORIES.map((cat) => {
            const metrics = cat.keys
              .map((key) => {
                const m = (profile as any)[key];
                if (!m) return null;
                return { key, ...m };
              })
              .filter(Boolean) as Array<{
              key: string;
              label: string;
              value: string | number;
              unit?: string;
              score?: number;
              invertScale?: boolean;
              note?: string;
            }>;

            if (metrics.length === 0) return null;

            const isCollapsed = collapsed[cat.id] ?? false;
            const avgScore = getCatAvgScore(cat.keys);

            return (
              <div
                key={cat.id}
                className="modal-tile rounded-xl border border-border/40 overflow-hidden flex flex-col"
              >
                {/* Category header — always visible */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <span className="text-xs font-bold font-sans text-foreground flex-1 leading-tight">
                    {cat.label}
                  </span>
                  {/* metric count + avg score */}
                  <span className="text-[9px] font-mono text-muted-foreground mr-1 shrink-0">
                    {metrics.length} metrics
                  </span>
                  {avgScore !== null && <ScoreBadge score={avgScore} />}
                  <span className="text-muted-foreground shrink-0 ml-1">
                    {isCollapsed ? (
                      <CaretDown size={12} />
                    ) : (
                      <CaretUp size={12} />
                    )}
                  </span>
                </button>

                {/* Metrics rows — collapsible */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/30">
                    {metrics.map((m) => {
                      const displayScore =
                        m.score !== undefined
                          ? m.invertScale
                            ? 100 - m.score
                            : m.score
                          : null;
                      const scoreColor =
                        displayScore === null
                          ? ""
                          : displayScore >= 70
                            ? "text-success"
                            : displayScore >= 45
                              ? "text-warning"
                              : "text-destructive";

                      return (
                        <div key={m.key} className="px-4 py-2.5">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold font-sans text-foreground leading-tight truncate">
                                {m.label}
                              </p>
                              {m.note && (
                                <p className="text-[9px] text-muted-foreground font-sans mt-0.5 italic leading-tight">
                                  {m.note}
                                </p>
                              )}
                              {m.score !== undefined && (
                                <div className="flex items-center gap-2 mt-1">
                                  <ScoreBar
                                    score={m.score}
                                    invertScale={m.invertScale}
                                  />
                                  <span
                                    className={`text-[9px] font-mono w-6 text-right shrink-0 ${scoreColor}`}
                                  >
                                    {displayScore!.toFixed(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-bold font-mono text-foreground">
                                {typeof m.value === "number"
                                  ? m.value % 1 !== 0
                                    ? m.value.toFixed(3)
                                    : m.value.toLocaleString()
                                  : m.value}
                              </span>
                              {m.unit && (
                                <span className="text-[9px] text-muted-foreground font-sans ml-1">
                                  {m.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SourceLink sources={SOURCES} className="mt-2" />
      <p className="text-[10px] text-muted-foreground font-sans italic text-center">
        All values are estimates based on publicly available index data. Scores
        are normalized 0–100 for comparison purposes.
      </p>
    </div>
  );
}

function MetricRow({
  metric,
  showCategory = false,
  catLabel,
  catIcon,
}: {
  metric: {
    key: string;
    label: string;
    value: string | number;
    unit?: string;
    score?: number;
    invertScale?: boolean;
    note?: string;
  };
  showCategory?: boolean;
  catLabel?: string;
  catIcon?: string;
}) {
  const score = metric.score ?? 0;
  const displayScore = metric.invertScale ? 100 - score : score;
  const scoreColor =
    displayScore >= 70
      ? "text-success"
      : displayScore >= 45
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="modal-tile rounded-lg px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[11px] font-semibold font-sans text-foreground">
              {metric.label}
            </p>
            {showCategory && catLabel && (
              <span className="text-[9px] font-sans text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border/50">
                {catIcon} {catLabel}
              </span>
            )}
          </div>
          {metric.note && (
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5 italic">
              {metric.note}
            </p>
          )}
          {metric.score !== undefined && (
            <div className="flex items-center gap-2 mt-1.5">
              <ScoreBar score={score} invertScale={metric.invertScale} />
              <span
                className={`text-[10px] font-mono w-8 text-right shrink-0 ${scoreColor}`}
              >
                {displayScore.toFixed(0)}
              </span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-bold font-mono text-foreground">
            {typeof metric.value === "number"
              ? metric.value % 1 !== 0
                ? metric.value.toFixed(3)
                : metric.value.toLocaleString()
              : metric.value}
          </span>
          {metric.unit && (
            <span className="text-[10px] text-muted-foreground font-sans ml-1">
              {metric.unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
