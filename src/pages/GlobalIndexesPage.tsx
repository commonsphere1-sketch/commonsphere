import React, { useState, useMemo } from "react";
import {
  DOMAINS,
  DOMAIN_MAP,
  type Domain,
  type DomainId,
  type Indicator,
} from "../data/societyIndexFramework";
import {
  HeartStraight,
  ChartLineUp,
  Buildings,
  Eye,
  UsersThree,
  Shield,
  Scales,
  FirstAid,
  GraduationCap,
  Leaf,
  WifiHigh,
  Handshake,
  Newspaper,
  Globe,
  MagnifyingGlass,
  ArrowSquareOut,
  Star,
  CaretDown,
  CaretUp,
  X,
  BookOpen,
  Funnel,
  SlidersHorizontal,
} from "@phosphor-icons/react";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  HeartStraight,
  ChartLineUp,
  Buildings,
  Eye,
  UsersThree,
  Shield,
  Scales,
  FirstAid,
  GraduationCap,
  Leaf,
  WifiHigh,
  Handshake,
  Newspaper,
  Globe,
};

// ─── Color map (Tailwind class bases) ────────────────────────────────────────

const COLOR_MAP: Record<
  string,
  { text: string; bg: string; border: string; badge: string }
> = {
  rose: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    badge: "bg-rose-500/15 text-rose-400",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-400",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    badge: "bg-violet-500/15 text-violet-400",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-400",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    badge: "bg-orange-500/15 text-orange-400",
  },
  teal: {
    text: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    badge: "bg-teal-500/15 text-teal-400",
  },
  indigo: {
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    badge: "bg-indigo-500/15 text-indigo-400",
  },
  green: {
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    badge: "bg-green-500/15 text-green-400",
  },
  blue: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/15 text-blue-400",
  },
  lime: {
    text: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
    badge: "bg-lime-500/15 text-lime-400",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    badge: "bg-cyan-500/15 text-cyan-400",
  },
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    badge: "bg-purple-500/15 text-purple-400",
  },
  yellow: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    badge: "bg-yellow-500/15 text-yellow-400",
  },
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    badge: "bg-sky-500/15 text-sky-400",
  },
};

function getColor(color: string) {
  return (
    COLOR_MAP[color] ?? {
      text: "text-secondary",
      bg: "bg-secondary/10",
      border: "border-secondary/20",
      badge: "bg-secondary/15 text-secondary",
    }
  );
}

// ─── Indicator card ───────────────────────────────────────────────────────────

function IndicatorCard({
  indicator,
  domainColor,
  expanded,
  onToggle,
}: {
  indicator: Indicator;
  domainColor: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = getColor(domainColor);
  return (
    <div
      className={`bg-background/60 border rounded-xl overflow-hidden transition-all cursor-pointer hover:border-opacity-60 ${expanded ? `border-${domainColor}-500/40` : "border-border/60 hover:border-border"}`}
      onClick={onToggle}
    >
      {/* Row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Tier badge */}
        <span
          className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${
            indicator.tier === "primary"
              ? c.badge
              : "bg-muted/60 text-muted-foreground"
          }`}
        >
          {indicator.tier === "primary" ? "Core" : "Ext"}
        </span>

        {/* Label */}
        <span className="text-xs font-semibold text-foreground flex-1 leading-snug">
          {indicator.label}
        </span>

        {/* Unit */}
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
          {indicator.unit}
        </span>

        {/* Direction */}
        <span
          className={`text-[10px] shrink-0 ${indicator.higherIsBetter ? "text-success" : "text-destructive"}`}
          title={
            indicator.higherIsBetter ? "Higher is better" : "Lower is better"
          }
        >
          {indicator.higherIsBetter ? "↑" : "↓"}
        </span>

        {/* Caret */}
        <span className="text-muted-foreground shrink-0">
          {expanded ? <CaretUp size={11} /> : <CaretDown size={11} />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={`px-3 pb-3 pt-1 border-t border-border/40 bg-muted/20`}>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            {indicator.description}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Source:</span>
              <a
                href={indicator.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`text-[10px] font-semibold ${c.text} hover:underline flex items-center gap-1`}
              >
                {indicator.source}
                <ArrowSquareOut size={9} weight="bold" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                  indicator.higherIsBetter
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {indicator.higherIsBetter
                  ? "↑ Higher = Better"
                  : "↓ Lower = Better"}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-semibold">
                Unit: {indicator.unit}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Domain section ───────────────────────────────────────────────────────────

function DomainSection({
  domain,
  searchQ,
  tierFilter,
  isOpen,
  onToggle,
}: {
  domain: Domain;
  searchQ: string;
  tierFilter: "all" | "primary" | "secondary";
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(
    null,
  );

  const Icon = ICON_MAP[domain.icon] ?? Globe;
  const c = getColor(domain.color);

  const filteredIndicators = useMemo(() => {
    let inds = domain.indicators;
    if (tierFilter !== "all") inds = inds.filter((i) => i.tier === tierFilter);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      inds = inds.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q),
      );
    }
    return inds;
  }, [domain.indicators, tierFilter, searchQ]);

  const primaryCount = domain.indicators.filter(
    (i) => i.tier === "primary",
  ).length;
  const secondaryCount = domain.indicators.filter(
    (i) => i.tier === "secondary",
  ).length;

  if (filteredIndicators.length === 0 && searchQ.trim()) return null;

  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden ${isOpen ? `border-${domain.color}-500/30` : "border-border"}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
      >
        <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}>
          <Icon size={18} weight="fill" className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-foreground">
              {domain.label}
            </h2>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${c.badge}`}
              >
                {primaryCount} Core
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                {secondaryCount} Extended
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {domain.description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground font-mono">
            {filteredIndicators.length} index
            {filteredIndicators.length !== 1 ? "es" : ""}
          </span>
          {isOpen ? (
            <CaretUp size={14} className="text-muted-foreground" />
          ) : (
            <CaretDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Indicators list */}
      {isOpen && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-border/40">
          {filteredIndicators.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No indexes match the current filter.
            </p>
          ) : (
            filteredIndicators.map((ind) => (
              <IndicatorCard
                key={ind.id}
                indicator={ind}
                domainColor={domain.color}
                expanded={expandedIndicator === ind.id}
                onToggle={() =>
                  setExpandedIndicator((prev) =>
                    prev === ind.id ? null : ind.id,
                  )
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function GlobalIndexesPage() {
  const [searchQ, setSearchQ] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "primary" | "secondary">(
    "all",
  );
  const [openDomains, setOpenDomains] = useState<Set<DomainId>>(
    new Set(["quality_of_life", "economic", "governance"]),
  );
  const [expandAll, setExpandAll] = useState(false);

  // Total counts
  const totalIndicators = DOMAINS.reduce((s, d) => s + d.indicators.length, 0);
  const totalPrimary = DOMAINS.reduce(
    (s, d) => s + d.indicators.filter((i) => i.tier === "primary").length,
    0,
  );
  const totalSources = useMemo(() => {
    const sources = new Set(
      DOMAINS.flatMap((d) => d.indicators.map((i) => i.source)),
    );
    return sources.size;
  }, []);

  // Filter domains based on search / tier
  const visibleDomains = useMemo(() => {
    if (!searchQ.trim() && tierFilter === "all") return DOMAINS;
    return DOMAINS.filter((d) => {
      let inds = d.indicators;
      if (tierFilter !== "all")
        inds = inds.filter((i) => i.tier === tierFilter);
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        inds = inds.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.source.toLowerCase().includes(q) ||
            d.label.toLowerCase().includes(q),
        );
      }
      return inds.length > 0;
    });
  }, [searchQ, tierFilter]);

  function toggleDomain(id: DomainId) {
    setOpenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExpandAll() {
    if (expandAll) {
      setOpenDomains(new Set());
      setExpandAll(false);
    } else {
      setOpenDomains(new Set(DOMAINS.map((d) => d.id)));
      setExpandAll(true);
    }
  }

  // Quick-jump to domain
  const DOMAIN_SHORTCUTS = DOMAINS.map((d) => ({
    id: d.id,
    shortLabel: d.shortLabel,
    color: d.color,
  }));

  return (
    <div className="flex flex-col gap-6 p-6 max-w-full font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-secondary/10">
              <BookOpen size={20} weight="fill" className="text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Global Indexes & Indicators
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Comprehensive reference of every societal, economic, political, and
            environmental index used across CommonSphere — organized by domain,
            with source links and methodology notes.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            val: DOMAINS.length.toString(),
            lbl: "Domains",
            sub: "Thematic categories",
            icon: (
              <SlidersHorizontal
                size={15}
                weight="fill"
                className="text-secondary"
              />
            ),
            accent: "bg-secondary/10",
          },
          {
            val: totalIndicators.toString(),
            lbl: "Total Indexes",
            sub: `${totalPrimary} core · ${totalIndicators - totalPrimary} extended`,
            icon: (
              <ChartLineUp
                size={15}
                weight="fill"
                className="text-emerald-400"
              />
            ),
            accent: "bg-emerald-500/10",
          },
          {
            val: totalPrimary.toString(),
            lbl: "Core Indicators",
            sub: "Primary measurement tools",
            icon: <Star size={15} weight="fill" className="text-yellow-400" />,
            accent: "bg-yellow-500/10",
          },
          {
            val: totalSources.toString(),
            lbl: "Data Sources",
            sub: "Authoritative institutions",
            icon: <Globe size={15} weight="fill" className="text-sky-400" />,
            accent: "bg-sky-500/10",
          },
        ].map((card) => (
          <div
            key={card.lbl}
            className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
          >
            <div className={`p-2 rounded-xl ${card.accent} shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">
                {card.lbl}
              </p>
              <p className="text-sm font-bold text-foreground font-mono">
                {card.val}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Domain quick-jump strip */}
      <div className="flex flex-wrap gap-1.5">
        {DOMAIN_SHORTCUTS.map((d) => {
          const c = getColor(d.color);
          const Icon = ICON_MAP[DOMAIN_MAP[d.id].icon] ?? Globe;
          const isOpen = openDomains.has(d.id);
          return (
            <button
              key={d.id}
              onClick={() => toggleDomain(d.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors border ${
                isOpen
                  ? `${c.bg} ${c.text} ${c.border}`
                  : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon size={12} weight={isOpen ? "fill" : "regular"} />
              {d.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-1.5 flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass
            size={13}
            className="text-muted-foreground shrink-0"
          />
          <input
            type="text"
            placeholder="Search indexes, sources…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-0.5">
          {(["all", "primary", "secondary"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                tierFilter === t
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all"
                ? "All"
                : t === "primary"
                  ? "Core Only"
                  : "Extended Only"}
            </button>
          ))}
        </div>

        {/* Expand / Collapse all */}
        <button
          onClick={handleExpandAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
        >
          <Funnel size={12} />
          {expandAll ? "Collapse All" : "Expand All"}
        </button>

        {/* Result count */}
        {(searchQ || tierFilter !== "all") && (
          <span className="text-[11px] text-muted-foreground font-mono">
            {visibleDomains.reduce((s, d) => {
              let inds = d.indicators;
              if (tierFilter !== "all")
                inds = inds.filter((i) => i.tier === tierFilter);
              if (searchQ.trim()) {
                const q = searchQ.toLowerCase();
                inds = inds.filter(
                  (i) =>
                    i.label.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q) ||
                    i.source.toLowerCase().includes(q),
                );
              }
              return s + inds.length;
            }, 0)}{" "}
            results
          </span>
        )}
      </div>

      {/* Domain sections */}
      {visibleDomains.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <MagnifyingGlass
            size={32}
            className="text-muted-foreground/30 mx-auto mb-3"
          />
          <p className="text-sm font-semibold text-muted-foreground">
            No indexes found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different search term or filter.
          </p>
          <button
            onClick={() => {
              setSearchQ("");
              setTierFilter("all");
            }}
            className="mt-4 text-xs text-secondary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleDomains.map((domain) => (
            <DomainSection
              key={domain.id}
              domain={domain}
              searchQ={searchQ}
              tierFilter={tierFilter}
              isOpen={openDomains.has(domain.id)}
              onToggle={() => toggleDomain(domain.id)}
            />
          ))}
        </div>
      )}

      {/* Footer legend */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-secondary/15 text-secondary">
            Core
          </span>
          <span className="text-[11px] text-muted-foreground">
            Primary indexes — always displayed in entity profiles
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
            Ext
          </span>
          <span className="text-[11px] text-muted-foreground">
            Extended indexes — shown in expanded / detail views
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-success font-bold">↑</span>
          <span className="text-[11px] text-muted-foreground">
            Higher value = better outcome
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-destructive font-bold">↓</span>
          <span className="text-[11px] text-muted-foreground">
            Lower value = better outcome
          </span>
        </div>
      </div>
    </div>
  );
}
