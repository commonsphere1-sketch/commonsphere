import React, { useState } from "react";
import {
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
  X,
  CheckCircle,
  Funnel,
  ArrowClockwise,
} from "@phosphor-icons/react";
import {
  SAMPLE_NOTIFICATIONS,
  CATEGORY_META,
  ALL_CATEGORIES,
  AppNotification,
  NotificationCategory,
} from "@/components/NotificationsPanel";

const URGENCY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-warning",
  low: "bg-muted-foreground",
};

const URGENCY_LABEL: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  low: "text-muted-foreground bg-muted border-border",
};

export function NotificationsPage() {
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

  const reset = () => setNotifications(SAMPLE_NOTIFICATIONS);

  const filtered = notifications.filter((n) => {
    const catMatch = activeFilter === "all" || n.category === activeFilter;
    const readMatch = !showUnreadOnly || !n.read;
    return catMatch && readMatch;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Bell size={22} weight="fill" className="text-secondary" />
            <h1 className="text-xl font-bold font-sans text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-sans mt-1 ml-9">
            Political updates, environmental status, public health, science &amp; technology, and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors duration-150 font-sans"
          >
            <ArrowClockwise size={13} weight="bold" />
            Reset
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 transition-colors duration-150 font-sans"
            >
              <CheckCircle size={13} weight="bold" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Category summary strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = notifications.filter((n) => n.category === cat && !n.read).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(activeFilter === cat ? "all" : cat)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors duration-150 ${
                activeFilter === cat
                  ? `${meta.bg} border-current/30 ${meta.color}`
                  : "bg-card border-border text-muted-foreground hover:bg-muted hover:border-border"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeFilter === cat ? meta.bg : "bg-muted"}`}>
                <Icon size={16} weight="fill" className={activeFilter === cat ? meta.color : "text-muted-foreground"} />
              </div>
              <span className="text-xs font-sans text-center leading-tight">{meta.label}</span>
              {count > 0 && (
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full leading-none ${meta.bg} ${meta.color} border`} style={{ borderColor: "currentColor" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Funnel size={14} className="text-muted-foreground shrink-0" />
        <button
          onClick={() => setActiveFilter("all")}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 font-sans ${
            activeFilter === "all"
              ? "bg-secondary/10 text-secondary border-secondary/30"
              : "bg-muted text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          All categories
        </button>
        <div className="ml-auto">
          <button
            onClick={() => setShowUnreadOnly((v) => !v)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 font-sans ${
              showUnreadOnly
                ? "bg-secondary/10 text-secondary border-secondary/30"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Unread only
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Bell size={40} weight="thin" />
            <p className="text-sm font-sans">No notifications to show</p>
          </div>
        ) : (
          <ul>
            {filtered.map((notif, idx) => {
              const meta = CATEGORY_META[notif.category];
              const Icon = meta.icon;
              return (
                <li
                  key={notif.id}
                  className={`relative flex gap-4 px-5 py-5 transition-all duration-150 group cursor-pointer ${
                    idx < filtered.length - 1 ? "border-b border-border/40" : ""
                  } ${notif.read ? "hover:bg-muted/20" : "bg-secondary/[0.04] hover:bg-secondary/[0.07]"}`}
                  onClick={() => markRead(notif.id)}
                >
                  {/* Unread left accent bar */}
                  {!notif.read && (
                    <span
                      className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${URGENCY_DOT[notif.urgency]}`}
                    />
                  )}

                  {/* Category icon badge */}
                  <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border border-border/40 shadow-sm ${meta.bg}`}>
                    <Icon size={19} weight="fill" className={meta.color} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* Title row */}
                    <div className="flex items-start gap-3 justify-between">
                      <p className={`text-[13.5px] font-semibold font-sans leading-snug tracking-tight ${notif.read ? "text-foreground/70" : "text-foreground"}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        <span className="text-[11px] text-muted-foreground/50 font-mono whitespace-nowrap">{notif.timestamp}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                          className="p-1 rounded text-transparent group-hover:text-muted-foreground hover:!text-foreground transition-colors duration-150"
                          aria-label="Dismiss"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-[12px] text-muted-foreground font-sans leading-relaxed line-clamp-2">
                      {notif.summary}
                    </p>

                    {/* Tags row */}
                    <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border font-sans ${meta.bg} ${meta.color}`}
                        style={{ borderColor: "currentColor", opacity: 0.85 }}
                      >
                        <Icon size={9} weight="fill" />
                        {meta.label}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-sans font-medium ${URGENCY_LABEL[notif.urgency]}`}>
                        {notif.urgency.charAt(0).toUpperCase() + notif.urgency.slice(1)}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60 font-mono ml-1">{notif.source}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
