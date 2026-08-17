import React, { useState } from "react";
import {
  Warning,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  Minus,
  Fire,
  Globe,
  MapPin,
  Users,
  Calendar,
  Tag,
  CurrencyDollar,
  BookOpen,
  ClockCounterClockwise,
  ChartBar,
  Money,
  XCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  conflictsData,
  conflictTypeColors,
  intensityColors,
  trendColors,
  type Conflict,
  type ConflictType,
  type IntensityLevel,
} from "../data/conflictsData";

// ── Summary strip ─────────────────────────────────────────────────────────────
function SummaryStrip() {
  const active = conflictsData.filter((c) => c.active).length;
  const critical = conflictsData.filter(
    (c) => c.intensity === "Critical" && c.active,
  ).length;
  const displaced = conflictsData.reduce((s, c) => s + (c.displaced ?? 0), 0);
  const escalating = conflictsData.filter(
    (c) => c.trend === "Escalating" && c.active,
  ).length;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        {
          label: "Active Conflicts",
          value: String(active),
          sub: "ongoing worldwide",
          color: "text-red-400",
        },
        {
          label: "Critical Intensity",
          value: String(critical),
          sub: "requiring attention",
          color: "text-orange-400",
        },
        {
          label: "People Displaced",
          value: `${displaced.toFixed(1)}M`,
          sub: "approx. total",
          color: "text-yellow-400",
        },
        {
          label: "Escalating",
          value: String(escalating),
          sub: "worsening trends",
          color: "text-rose-400",
        },
      ].map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-lg p-4"
        >
          <p className="text-xs text-muted-foreground font-sans">{s.label}</p>
          <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            {s.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Trend icon ────────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: Conflict["trend"] }) {
  if (trend === "Escalating")
    return <ArrowUp size={13} className="text-red-400" weight="bold" />;
  if (trend === "De-escalating")
    return <ArrowDown size={13} className="text-green-400" weight="bold" />;
  return <Minus size={13} className="text-yellow-400" weight="bold" />;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
type ConflictTab =
  | "overview"
  | "policy-history"
  | "background"
  | "prioritization"
  | "budgets-economics";

function ConflictModal({
  conflict,
  onClose,
}: {
  conflict: Conflict;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ConflictTab>("overview");
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const typeStyle = conflictTypeColors[conflict.type];
  const intensityStyle = intensityColors[conflict.intensity];
  const trendStyle = trendColors[conflict.trend];

  const tabs: { id: ConflictTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen size={13} /> },
    {
      id: "policy-history",
      label: "Policy History",
      icon: <ClockCounterClockwise size={13} />,
    },
    { id: "background", label: "Background", icon: <Globe size={13} /> },
    {
      id: "prioritization",
      label: "Prioritization",
      icon: <ChartBar size={13} />,
    },
    {
      id: "budgets-economics",
      label: "Budgets & Economics",
      icon: <Money size={13} />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : "max-w-xl max-h-[90vh]"}`}
      >
        {/* ── Header ── */}
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-mono font-semibold ${typeStyle}`}
                >
                  {conflict.type}
                </span>
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-mono font-semibold ${intensityStyle}`}
                >
                  {conflict.intensity}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-mono ${trendStyle}`}
                >
                  <TrendIcon trend={conflict.trend} />
                  {conflict.trend}
                </span>
                {!conflict.active && (
                  <span className="text-xs border border-border px-2 py-0.5 rounded-full font-sans text-muted-foreground">
                    Resolved / Inactive
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold font-sans text-foreground leading-tight">
                {conflict.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <MapPin size={13} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-sans">
                  {conflict.region}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label={
                isExpanded ? "Collapse modal" : "Expand modal to full screen"
              }
              title={isExpanded ? "Collapse" : "Expand to full screen"}
            >
              {isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5 1H1v4M11 1h4v4M5 15H1v-4M11 15h4v-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <XCircle size={20} weight="fill" />
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-border/40 border border-border/40 rounded-xl overflow-hidden mb-4">
            <div className="px-3 py-2.5 modal-tile text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Started
              </p>
              <p className="text-sm font-bold font-mono text-foreground">
                {conflict.startYear}
              </p>
            </div>
            <div className="px-3 py-2.5 modal-tile text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Casualties
              </p>
              <p className="text-sm font-bold font-mono text-red-400">
                {conflict.casualties != null
                  ? conflict.casualties >= 1000
                    ? `${(conflict.casualties / 1000).toFixed(0)}K+`
                    : conflict.casualties.toLocaleString()
                  : "—"}
              </p>
            </div>
            <div className="px-3 py-2.5 modal-tile text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Displaced
              </p>
              <p className="text-sm font-bold font-mono text-orange-400">
                {conflict.displaced != null && conflict.displaced > 0
                  ? `${conflict.displaced.toFixed(1)}M`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Scrollable tab bar */}
          <div className="flex overflow-x-auto border-b border-border/40 -mx-5 px-5 gap-0 no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium font-sans whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                  tab === t.id
                    ? "border-secondary text-secondary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="p-5 space-y-4">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <>
              <div className="modal-tile rounded-lg p-4">
                <p className="text-sm text-foreground font-sans leading-relaxed">
                  {conflict.description}
                </p>
              </div>

              <div className="modal-tile rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-muted-foreground" />
                  <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                    Countries Involved
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {conflict.countries.map((c) => (
                    <span
                      key={c}
                      className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="modal-tile rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-muted-foreground" />
                  <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                    Key Factors
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {conflict.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                      dangerouslySetInnerHTML={{ __html: t }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-mono text-right">
                Last updated: {conflict.lastUpdate}
              </p>
            </>
          )}

          {/* POLICY HISTORY */}
          {tab === "policy-history" && (
            <>
              {conflict.policyHistory && conflict.policyHistory.length > 0 ? (
                <div className="relative pl-5">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-5">
                    {conflict.policyHistory.map((p, i) => (
                      <div key={i} className="relative">
                        <div
                          className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-background ${
                            p.outcome === "positive"
                              ? "bg-green-400"
                              : p.outcome === "negative"
                                ? "bg-red-400"
                                : "bg-muted-foreground"
                          }`}
                        />
                        <div className="modal-tile rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold font-mono text-secondary">
                              {p.year}
                            </span>
                            {p.outcome === "positive" ? (
                              <CheckCircle
                                size={12}
                                weight="fill"
                                className="text-green-400 shrink-0"
                              />
                            ) : p.outcome === "negative" ? (
                              <XCircle
                                size={12}
                                weight="fill"
                                className="text-red-400 shrink-0"
                              />
                            ) : (
                              <Calendar
                                size={12}
                                className="text-muted-foreground shrink-0"
                              />
                            )}
                            <span className="text-xs font-semibold font-sans text-foreground">
                              {p.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                            {p.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="modal-tile rounded-lg p-6 text-center">
                  <ClockCounterClockwise
                    size={28}
                    className="text-muted-foreground mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    No detailed policy history available for this conflict yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Key diplomatic milestones, peace agreements, and UN
                    resolutions will appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {/* BACKGROUND */}
          {tab === "background" && (
            <>
              {conflict.background ? (
                <>
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Origins
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {conflict.background.origins}
                    </p>
                  </div>
                  {conflict.background.keyActors.length > 0 && (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Key Actors
                      </p>
                      <div className="space-y-2">
                        {conflict.background.keyActors.map((a, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                            <div>
                              <span className="text-sm font-semibold text-foreground">
                                {a.name}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {a.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {conflict.background.timeline.length > 0 && (
                    <div className="relative pl-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 -ml-5">
                        Historical Timeline
                      </p>
                      <div className="absolute left-1.5 top-7 bottom-0 w-px bg-border" />
                      <div className="space-y-4">
                        {conflict.background.timeline.map((t, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-secondary/50 border-2 border-background" />
                            <span className="text-xs font-bold font-mono text-secondary mr-2">
                              {t.year}
                            </span>
                            <span
                              className="text-xs text-foreground"
                              dangerouslySetInnerHTML={{ __html: t.event }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="modal-tile rounded-lg p-6 text-center">
                  <Globe
                    size={28}
                    className="text-muted-foreground mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    No detailed background available for this conflict yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Historical origins, key actors, and contextual timeline will
                    be shown here.
                  </p>
                </div>
              )}
            </>
          )}

          {/* PRIORITIZATION */}
          {tab === "prioritization" && (
            <>
              {conflict.prioritization ? (
                <>
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      International Attention
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {conflict.prioritization.internationalAttention}
                    </p>
                  </div>
                  {conflict.prioritization.keyChallenges.length > 0 && (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Key Challenges
                      </p>
                      <ul className="space-y-2">
                        {conflict.prioritization.keyChallenges.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <XCircle
                              size={14}
                              weight="fill"
                              className="text-red-400 mt-0.5 shrink-0"
                            />
                            <span className="text-sm text-foreground">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {conflict.prioritization.proposedSolutions.length > 0 && (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Proposed Solutions
                      </p>
                      <ul className="space-y-2">
                        {conflict.prioritization.proposedSolutions.map(
                          (s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle
                                size={14}
                                weight="fill"
                                className="text-green-400 mt-0.5 shrink-0"
                              />
                              <span className="text-sm text-foreground">
                                {s}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="modal-tile rounded-lg p-6 text-center">
                  <ChartBar
                    size={28}
                    className="text-muted-foreground mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    No prioritization data available for this conflict yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Urgency levels, international attention, challenges, and
                    proposed solutions will appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {/* BUDGETS & ECONOMICS */}
          {tab === "budgets-economics" && (
            <>
              {(conflict.economicImpacts &&
                conflict.economicImpacts.length > 0) ||
              (conflict.budgets && conflict.budgets.length > 0) ? (
                <>
                  {conflict.economicImpacts &&
                    conflict.economicImpacts.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CurrencyDollar
                            size={14}
                            className="text-emerald-400"
                          />
                          <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                            Economic Impacts
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {conflict.economicImpacts.map((impact) => (
                            <div
                              key={impact.indicator}
                              className="bg-background/40 border border-border/60 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold font-sans text-foreground leading-tight">
                                  {impact.indicator}
                                </span>
                                <span
                                  className={`text-xs font-mono font-bold shrink-0 ml-2 ${
                                    impact.direction === "up"
                                      ? "text-red-400"
                                      : impact.direction === "down"
                                        ? "text-emerald-400"
                                        : "text-yellow-400"
                                  }`}
                                >
                                  {impact.value}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                                {impact.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  {conflict.budgets && conflict.budgets.length > 0 && (
                    <div className="modal-tile rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Money size={14} className="text-purple-400" />
                        <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                          Aid &amp; Budget Allocations
                        </p>
                      </div>
                      <div className="space-y-2">
                        {conflict.budgets.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-background/40 border border-border/60 rounded-lg p-3"
                          >
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {b.category}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {b.note}
                              </p>
                            </div>
                            <span className="text-sm font-bold font-mono text-secondary ml-2 shrink-0">
                              {b.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="modal-tile rounded-lg p-6 text-center">
                  <Money
                    size={28}
                    className="text-muted-foreground mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    No budget or economic data available for this conflict yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Aid allocations, defense spending, and economic disruption
                    metrics will appear here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────
const CATEGORY_META: Record<
  ConflictType,
  { label: string; desc: string; color: string }
> = {
  War: {
    label: "Wars",
    desc: "Active conventional warfare between states or major armed groups",
    color: "text-red-400",
  },
  "Proxy War": {
    label: "Proxy Wars",
    desc: "Conflicts where external powers supply and direct local forces",
    color: "text-orange-500",
  },
  "Civil War": {
    label: "Civil Wars",
    desc: "Internal armed conflicts between factions within a state",
    color: "text-rose-400",
  },
  Protest: {
    label: "Protests",
    desc: "Mass civil disobedience and social unrest movements",
    color: "text-yellow-400",
  },
  Riot: {
    label: "Riots",
    desc: "Violent civil disturbances and urban unrest",
    color: "text-amber-400",
  },
  Terrorism: {
    label: "Terrorism & Insurgency",
    desc: "Non-state armed groups using asymmetric violence",
    color: "text-red-300",
  },
  "Natural Disaster": {
    label: "Natural Disasters",
    desc: "Major earthquakes, floods, cyclones and climate-driven crises",
    color: "text-sky-400",
  },
  "Economic Crisis": {
    label: "Economic Turmoil",
    desc: "Sovereign debt crises, hyperinflation, and financial collapse",
    color: "text-purple-400",
  },
  "Political Instability": {
    label: "Political Instability",
    desc: "Coups, authoritarian crackdowns, and state fragility",
    color: "text-orange-300",
  },
};

const ALL_TYPES: ConflictType[] = [
  "War",
  "Proxy War",
  "Civil War",
  "Protest",
  "Riot",
  "Terrorism",
  "Natural Disaster",
  "Economic Crisis",
  "Political Instability",
];

const ALL_INTENSITIES: IntensityLevel[] = ["Critical", "High", "Medium", "Low"];

// ── Page ──────────────────────────────────────────────────────────────────────
export function ConflictsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ConflictType | "All">("All");
  const [intensityFilter, setIntensityFilter] = useState<
    IntensityLevel | "All"
  >("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("Active");
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(
    null,
  );

  const filtered = conflictsData
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.region.toLowerCase().includes(search.toLowerCase()) ||
        c.countries.some((cc) =>
          cc.toLowerCase().includes(search.toLowerCase()),
        );
      const matchType = typeFilter === "All" || c.type === typeFilter;
      const matchIntensity =
        intensityFilter === "All" || c.intensity === intensityFilter;
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" ? c.active : !c.active);
      return matchSearch && matchType && matchIntensity && matchStatus;
    })
    .sort((a, b) => {
      const order: Record<IntensityLevel, number> = {
        Critical: 0,
        High: 1,
        Medium: 2,
        Low: 3,
      };
      return order[a.intensity] - order[b.intensity];
    });

  // Active type breakdown for overview bar
  const typeCounts = ALL_TYPES.map((t) => ({
    type: t,
    count: conflictsData.filter((c) => c.type === t && c.active).length,
  })).filter((t) => t.count > 0);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-500/20 rounded-lg">
            <Warning size={26} weight="fill" className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Global Conflicts &amp; Crises
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              Wars, protests, disasters, economic turmoil, and regional
              destabilization
            </p>
          </div>
        </div>

        <SummaryStrip />

        {/* Active type breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
            Active Incidents by Category
          </p>
          <div className="flex flex-wrap gap-2">
            {typeCounts.map(({ type, count }) => {
              const meta = CATEGORY_META[type];
              return (
                <button
                  key={type}
                  onClick={() =>
                    setTypeFilter(typeFilter === type ? "All" : type)
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans cursor-pointer transition-colors ${
                    typeFilter === type
                      ? conflictTypeColors[type]
                      : "border-border text-muted-foreground hover:border-secondary/40 hover:text-foreground bg-transparent"
                  }`}
                >
                  <span>{meta.label}</span>
                  <span className="font-mono font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category description */}
        {typeFilter !== "All" && (
          <div className="bg-card border border-border rounded-xl p-4 mb-5 flex items-start gap-3">
            <Warning
              size={18}
              weight="fill"
              className={CATEGORY_META[typeFilter].color}
            />
            <div>
              <p
                className={`text-sm font-semibold font-sans ${CATEGORY_META[typeFilter].color}`}
              >
                {CATEGORY_META[typeFilter].label}
              </p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {CATEGORY_META[typeFilter].desc}
              </p>
            </div>
          </div>
        )}

        {/* Filters — two-row bar: search on row 1, pills on row 2 */}
        <div className="bg-card border border-border/60 rounded-2xl px-4 py-2.5 mb-5">
          {/* Row 1: search */}
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              size={16}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search conflicts, regions, countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: status + intensity pills */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest shrink-0">
              Status
            </span>
            {(["All", "Active", "Inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  statusFilter === s
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {s}
              </button>
            ))}
            <div className="w-px h-5 bg-border shrink-0" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest shrink-0">
              Intensity
            </span>
            {(["All", ...ALL_INTENSITIES] as (IntensityLevel | "All")[]).map(
              (i) => (
                <button
                  key={i}
                  onClick={() => setIntensityFilter(i)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                    intensityFilter === i
                      ? i === "All"
                        ? "bg-secondary/20 text-secondary border-secondary/40"
                        : intensityColors[i as IntensityLevel]
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {i}
                </button>
              ),
            )}
          </div>
        </div>

        {selectedConflict && (
          <ConflictModal
            conflict={selectedConflict}
            onClose={() => setSelectedConflict(null)}
          />
        )}

        {/* Conflict cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((conflict) => {
            const typeStyle = conflictTypeColors[conflict.type];
            const intensityStyle = intensityColors[conflict.intensity];
            return (
              <article
                key={conflict.id}
                onClick={() => setSelectedConflict(conflict)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-3">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span
                        className={`text-xs border px-2 py-0.5 rounded-full font-mono font-semibold ${typeStyle}`}
                      >
                        {conflict.type}
                      </span>
                      <span
                        className={`text-xs border px-2 py-0.5 rounded-full font-mono ${intensityStyle}`}
                      >
                        {conflict.intensity}
                      </span>
                      {!conflict.active && (
                        <span className="text-xs border border-border px-2 py-0.5 rounded-full font-sans text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold font-sans text-foreground leading-snug group-hover:text-secondary transition-colors">
                      {conflict.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin
                        size={11}
                        className="text-muted-foreground shrink-0"
                      />
                      <span className="text-xs text-muted-foreground font-sans">
                        {conflict.region}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div
                      className={`flex items-center gap-1 text-xs font-mono font-semibold ${trendColors[conflict.trend]}`}
                    >
                      <TrendIcon trend={conflict.trend} />
                      {conflict.trend}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Calendar size={11} />
                      {conflict.startYear}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-3 line-clamp-2">
                  {conflict.description}
                </p>

                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  {conflict.casualties != null && (
                    <div className="flex items-center gap-1">
                      <Fire size={12} className="text-red-400 shrink-0" />
                      <span className="text-xs font-mono text-red-400">
                        {conflict.casualties >= 1000
                          ? `~${(conflict.casualties / 1000).toFixed(0)}K casualties`
                          : `${conflict.casualties.toLocaleString()} casualties`}
                      </span>
                    </div>
                  )}
                  {conflict.displaced != null && conflict.displaced > 0 && (
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-orange-400 shrink-0" />
                      <span className="text-xs font-mono text-orange-400">
                        {conflict.displaced.toFixed(1)}M displaced
                      </span>
                    </div>
                  )}
                  {conflict.economicImpacts &&
                    conflict.economicImpacts.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CurrencyDollar
                          size={12}
                          className="text-emerald-400 shrink-0"
                        />
                        <span className="text-xs font-mono text-emerald-400">
                          {conflict.economicImpacts.length} economic impacts
                        </span>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {conflict.countries.slice(0, 3).map((c) => (
                    <span
                      key={c}
                      className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                    >
                      {c}
                    </span>
                  ))}
                  {conflict.countries.length > 3 && (
                    <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans">
                      +{conflict.countries.length - 3}
                    </span>
                  )}
                  {conflict.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                      dangerouslySetInnerHTML={{ __html: t }}
                    />
                  ))}
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 bg-card border border-border rounded-xl p-12 text-center">
              <Warning
                size={32}
                className="text-muted-foreground mx-auto mb-3"
              />
              <p className="text-muted-foreground font-sans text-sm">
                No conflicts match your current filters.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground font-sans text-center mt-8">
          Data reflects publicly known information as of early 2026. Sources: UN
          OCHA, ACLED, IISS, Reuters, AP.
        </p>
      </div>
    </div>
  );
}
