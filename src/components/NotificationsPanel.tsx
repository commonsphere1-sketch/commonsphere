import React, { useState } from "react";
import {
  X,
  Bell,
  Leaf,
  Heartbeat,
  Flask,
  ShieldCheck,
  Lightning,
  Gavel,
  CurrencyDollar,
  Globe,
  Buildings,
  ArrowRight,
  CheckCircle,
  Funnel,
  IdentificationBadge,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export type NotificationCategory =
  | "national"
  | "environment"
  | "health"
  | "science"
  | "security"
  | "energy"
  | "courts"
  | "economics"
  | "international"
  | "agencies";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  summary: string;
  timestamp: string;
  read: boolean;
  urgency: "low" | "medium" | "high";
  source: string;
}

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  national: {
    label: "National Affairs",
    icon: Buildings,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  environment: {
    label: "Environment",
    icon: Leaf,
    color: "text-success",
    bg: "bg-success/10",
  },
  health: {
    label: "Public Health",
    icon: Heartbeat,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  science: {
    label: "Science & Tech",
    icon: Flask,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  security: {
    label: "Security & Defense",
    icon: ShieldCheck,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  energy: {
    label: "Energy",
    icon: Lightning,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  courts: {
    label: "International Courts",
    icon: Gavel,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  economics: {
    label: "Global Economics",
    icon: CurrencyDollar,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  international: {
    label: "International",
    icon: Globe,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  agencies: {
    label: "International Agencies",
    icon: IdentificationBadge,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
};

const URGENCY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-warning",
  low: "bg-muted-foreground",
};

const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    category: "national",
    title: "Senate passes bipartisan infrastructure bill",
    summary: "A $1.2T infrastructure bill cleared the Senate 68-32, heading to committee reconciliation.",
    timestamp: "2 min ago",
    read: false,
    urgency: "high",
    source: "Congress Watch",
  },
  {
    id: "n2",
    category: "environment",
    title: "Arctic ice sheet reaches record low extent",
    summary: "NSIDC reports the Arctic sea ice extent hit its lowest recorded level for March, raising alarm among climate scientists.",
    timestamp: "18 min ago",
    read: false,
    urgency: "high",
    source: "NSIDC",
  },
  {
    id: "n3",
    category: "health",
    title: "WHO issues advisory on novel respiratory pathogen",
    summary: "Early-stage monitoring underway in Southeast Asia after clusters of unexplained pneumonia cases reported.",
    timestamp: "1 hr ago",
    read: false,
    urgency: "high",
    source: "WHO",
  },
  {
    id: "n4",
    category: "science",
    title: "CERN announces breakthrough in antimatter research",
    summary: "Scientists successfully trapped antihydrogen for a record 1,000 seconds, opening new avenues in particle physics.",
    timestamp: "3 hrs ago",
    read: false,
    urgency: "medium",
    source: "CERN",
  },
  {
    id: "n5",
    category: "security",
    title: "NATO activates rapid response units near Baltic region",
    summary: "Following increased activity along the eastern flank, NATO member states have placed 20,000 troops on enhanced readiness.",
    timestamp: "4 hrs ago",
    read: true,
    urgency: "high",
    source: "NATO",
  },
  {
    id: "n6",
    category: "energy",
    title: "OPEC+ agrees to 500k bbl/day output cut",
    summary: "The alliance cited global demand uncertainty, sending crude prices up 3.4% in early trading.",
    timestamp: "5 hrs ago",
    read: true,
    urgency: "medium",
    source: "OPEC",
  },
  {
    id: "n7",
    category: "courts",
    title: "ICJ rules in favor of climate liability case",
    summary: "The International Court of Justice handed down a landmark advisory opinion on state obligations under international climate law.",
    timestamp: "6 hrs ago",
    read: true,
    urgency: "medium",
    source: "ICJ",
  },
  {
    id: "n8",
    category: "economics",
    title: "IMF downgrades global growth forecast to 2.8%",
    summary: "The revised outlook cites persistent inflation in advanced economies and slowing momentum in emerging markets.",
    timestamp: "8 hrs ago",
    read: true,
    urgency: "medium",
    source: "IMF",
  },
  {
    id: "n9",
    category: "international",
    title: "G7 summit communiqué on AI governance released",
    summary: "Leaders agreed to a voluntary code of conduct for frontier AI developers, the first such multilateral framework.",
    timestamp: "10 hrs ago",
    read: true,
    urgency: "low",
    source: "G7",
  },
  {
    id: "n10",
    category: "environment",
    title: "Amazon deforestation down 50% year-over-year",
    summary: "Brazil&#39;s INPE satellite data shows enforcement efforts under the new government have halved illegal clearing.",
    timestamp: "12 hrs ago",
    read: true,
    urgency: "low",
    source: "INPE",
  },
  {
    id: "n11",
    category: "science",
    title: "SpaceX Starship completes first full orbital flight",
    summary: "Starship and Super Heavy booster both achieved successful splashdowns after an uncrewed orbital test mission.",
    timestamp: "1 day ago",
    read: true,
    urgency: "low",
    source: "SpaceX",
  },
  {
    id: "n12",
    category: "health",
    title: "FDA approves first CRISPR-based sickle cell cure",
    summary: "The gene-editing therapy Casgevy receives full approval, marking a turning point in genetic medicine.",
    timestamp: "1 day ago",
    read: true,
    urgency: "medium",
    source: "FDA",
  },
  {
    id: "n13",
    category: "economics",
    title: "Eurozone inflation ticks up to 2.9%",
    summary: "Energy price rebounds drove a slight uptick, clouding the ECB&#39;s rate-cut timeline for Q3.",
    timestamp: "2 days ago",
    read: true,
    urgency: "low",
    source: "Eurostat",
  },
  {
    id: "n14",
    category: "security",
    title: "US Cyber Command disrupts ransomware network",
    summary: "Operation coordinated with allied agencies seized 47 servers used by LockBit 4.0 group across 12 countries.",
    timestamp: "2 days ago",
    read: true,
    urgency: "medium",
    source: "US Cyber Command",
  },
  {
    id: "n15",
    category: "courts",
    title: "ICC issues arrest warrant for sitting head of state",
    summary: "The warrant relates to alleged war crimes and crimes against humanity in an ongoing regional conflict.",
    timestamp: "3 days ago",
    read: true,
    urgency: "high",
    source: "ICC",
  },
  {
    id: "n16",
    category: "agencies",
    title: "UN Security Council adopts resolution on food security",
    summary: "The council passed a resolution calling for unimpeded humanitarian access to conflict zones facing famine conditions.",
    timestamp: "4 hrs ago",
    read: false,
    urgency: "high",
    source: "UN Security Council",
  },
  {
    id: "n17",
    category: "agencies",
    title: "World Bank approves $3.2B climate resilience fund",
    summary: "The financing package targets infrastructure adaptation in 14 low-income nations most exposed to climate risk.",
    timestamp: "9 hrs ago",
    read: true,
    urgency: "medium",
    source: "World Bank",
  },
  {
    id: "n18",
    category: "agencies",
    title: "IAEA confirms Iran enrichment levels below treaty threshold",
    summary: "Inspectors reported that uranium enrichment remains at 60%, below weapons-grade, following a new access agreement.",
    timestamp: "1 day ago",
    read: true,
    urgency: "medium",
    source: "IAEA",
  },
  {
    id: "n19",
    category: "agencies",
    title: "WTO rules against US steel tariffs in landmark dispute",
    summary: "The appellate body found Section 232 tariffs inconsistent with GATT obligations, though enforcement remains uncertain.",
    timestamp: "2 days ago",
    read: true,
    urgency: "low",
    source: "WTO",
  },
];

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as NotificationCategory[];

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | "all">("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const filtered = notifications.filter((n) => {
    const catMatch = activeFilter === "all" || n.category === activeFilter;
    const readMatch = !showUnreadOnly || !n.read;
    return catMatch && readMatch;
  });

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={18} weight="fill" className="text-secondary" />
          <h2 className="text-sm font-semibold font-sans text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-secondary transition-colors duration-150 flex items-center gap-1"
            >
              <CheckCircle size={13} weight="bold" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
            aria-label="Close notifications"
          >
            <X size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <Funnel size={13} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground font-sans">Filter</span>
          <button
            onClick={() => setShowUnreadOnly((v) => !v)}
            className={`ml-auto text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 font-sans ${
              showUnreadOnly
                ? "bg-secondary/10 text-secondary border-secondary/30"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Unread only
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 font-sans ${
              activeFilter === "all"
                ? "bg-secondary/10 text-secondary border-secondary/30"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 font-sans flex items-center gap-1 ${
                  isActive
                    ? `${meta.bg} ${meta.color} border-current/30`
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Icon size={11} weight={isActive ? "fill" : "regular"} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Bell size={32} weight="thin" />
            <p className="text-sm font-sans">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {filtered.map((notif) => {
              const meta = CATEGORY_META[notif.category];
              const Icon = meta.icon;
              return (
                <li
                  key={notif.id}
                  className={`relative flex gap-3.5 px-5 py-4 transition-colors duration-150 group cursor-pointer ${
                    notif.read
                      ? "hover:bg-muted/20"
                      : "bg-muted/40 hover:bg-muted/60"
                  }`}
                  onClick={() => markRead(notif.id)}
                >
                  {/* Unread accent bar */}
                  {!notif.read && (
                    <span
                      className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${URGENCY_DOT[notif.urgency]}`}
                    />
                  )}

                  {/* Icon badge */}
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} border border-border/30 shadow-sm`}
                  >
                    <Icon size={16} weight="fill" className={meta.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Top row: title + dismiss */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[13px] font-semibold font-sans leading-snug tracking-tight ${
                          notif.read ? "text-foreground/75" : "text-foreground"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                        className="shrink-0 mt-0.5 p-0.5 rounded text-transparent group-hover:text-muted-foreground hover:text-foreground transition-colors duration-150"
                        aria-label="Dismiss notification"
                      >
                        <X size={11} weight="bold" />
                      </button>
                    </div>

                    {/* Summary */}
                    <p className="text-[12px] text-muted-foreground font-sans leading-relaxed line-clamp-2">
                      {notif.summary}
                    </p>

                    {/* Meta row: category chip · source · timestamp */}
                    <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border font-sans ${meta.bg} ${meta.color}`}
                        style={{ borderColor: "currentColor", opacity: 0.9 }}
                      >
                        <Icon size={10} weight="fill" />
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 font-mono">
                        {notif.source}
                      </span>
                      <span className="text-[11px] text-muted-foreground/50 font-mono ml-auto">
                        {notif.timestamp}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border shrink-0">
        <button
          onClick={() => { navigate("/dashboard/notifications"); onClose(); }}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-secondary hover:text-secondary/80 font-sans transition-colors duration-150"
        >
          View all notifications
          <ArrowRight size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export { SAMPLE_NOTIFICATIONS, CATEGORY_META, ALL_CATEGORIES };
