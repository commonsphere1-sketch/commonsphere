import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Globe,
  MapPin,
  MagnifyingGlass,
  X,
  Check,
  Trash,
  BellRinging,
  BellSlash,
} from "@phosphor-icons/react";
import { countriesData } from "@/data/countriesData";
import { usStatesData } from "@/data/statesData";

// ─── Topic config ─────────────────────────────────────────────────────────────
const ALERT_TOPICS = [
  { id: "policy", label: "Policy Changes" },
  { id: "leadership", label: "Leadership / Elections" },
  { id: "economy", label: "Economic Updates" },
  { id: "conflicts", label: "Conflicts & Security" },
  { id: "legislation", label: "New Legislation" },
];

interface WatchedEntity {
  id: string;
  name: string;
  type: "Country" | "State";
  topics: string[];
}

// ─── Searchable add-row ───────────────────────────────────────────────────────
function EntitySearch({
  onAdd,
  existingIds,
}: {
  onAdd: (e: WatchedEntity) => void;
  existingIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const lower = q.trim().toLowerCase();
    if (lower.length < 2) return [];
    const countries = countriesData
      .filter(
        (c) =>
          !existingIds.has(`country-${c.id}`) &&
          c.name.toLowerCase().includes(lower),
      )
      .slice(0, 5)
      .map((c) => ({
        id: `country-${c.id}`,
        name: c.name,
        type: "Country" as const,
        topics: ["policy", "leadership"],
      }));
    const states = usStatesData
      .filter(
        (s) =>
          !existingIds.has(`state-${s.id}`) &&
          s.name.toLowerCase().includes(lower),
      )
      .slice(0, 5)
      .map((s) => ({
        id: `state-${s.id}`,
        name: s.name,
        type: "State" as const,
        topics: ["policy", "leadership"],
      }));
    return [...countries, ...states];
  }, [q, existingIds]);

  useEffect(() => {
    setOpen(results.length > 0);
  }, [results]);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MagnifyingGlass
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search countries or states to track…"
          className="w-full pl-8 pr-3 py-2 text-[13px] bg-muted border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={12} weight="bold" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onAdd(r);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              {r.type === "Country" ? (
                <Globe
                  size={13}
                  weight="fill"
                  className="text-secondary shrink-0"
                />
              ) : (
                <MapPin
                  size={13}
                  weight="fill"
                  className="text-secondary shrink-0"
                />
              )}
              <span className="text-[13px] font-medium text-foreground flex-1 truncate">
                {r.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border shrink-0">
                {r.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single watched entity row ────────────────────────────────────────────────
function WatchedRow({
  entity,
  onToggleTopic,
  onRemove,
}: {
  entity: WatchedEntity;
  onToggleTopic: (entityId: string, topicId: string) => void;
  onRemove: (entityId: string) => void;
}) {
  return (
    <div className="bg-muted/50 border border-border/60 rounded-xl p-4 space-y-3 hover:border-secondary/30 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {entity.type === "Country" ? (
            <Globe
              size={15}
              weight="fill"
              className="text-secondary shrink-0"
            />
          ) : (
            <MapPin
              size={15}
              weight="fill"
              className="text-secondary shrink-0"
            />
          )}
          <span className="text-[14px] font-semibold text-foreground truncate">
            {entity.name}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-card border border-border shrink-0">
            {entity.type}
          </span>
        </div>
        <button
          onClick={() => onRemove(entity.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded shrink-0"
          aria-label={`Remove ${entity.name}`}
        >
          <Trash size={14} weight="bold" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALERT_TOPICS.map((t) => {
          const active = entity.topics.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => onToggleTopic(entity.id, t.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                active
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : "bg-transparent text-muted-foreground border-border hover:border-secondary/40 hover:text-secondary"
              }`}
            >
              {active && <Check size={9} weight="bold" />}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AlertsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [watched, setWatched] = useState<WatchedEntity[]>([
    {
      id: "country-us",
      name: "United States",
      type: "Country",
      topics: ["policy", "leadership", "economy"],
    },
    {
      id: "state-ca",
      name: "California",
      type: "State",
      topics: ["policy", "legislation"],
    },
  ]);

  const existingIds = React.useMemo(
    () => new Set(watched.map((w) => w.id)),
    [watched],
  );

  function addEntity(e: WatchedEntity) {
    setWatched((prev) => [...prev, e]);
  }

  function removeEntity(id: string) {
    setWatched((prev) => prev.filter((w) => w.id !== id));
  }

  function toggleTopic(entityId: string, topicId: string) {
    setWatched((prev) =>
      prev.map((w) => {
        if (w.id !== entityId) return w;
        const topics = w.topics.includes(topicId)
          ? w.topics.filter((t) => t !== topicId)
          : [...w.topics, topicId];
        return { ...w, topics };
      }),
    );
  }

  const totalAlerts = watched.reduce((sum, w) => sum + w.topics.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Bell size={28} weight="fill" className="text-secondary" />
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Alerts
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              Get notified when updates occur for your tracked locations
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Tracked Locations", value: watched.length },
            { label: "Active Alert Topics", value: totalAlerts },
            {
              label: "Delivery Channels",
              value: [emailAlerts, inAppAlerts].filter(Boolean).length,
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold font-mono text-foreground">
                {value}
              </p>
              <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Delivery Preferences */}
        <section className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BellRinging size={20} weight="fill" className="text-secondary" />
            <h2 className="text-base font-semibold font-sans text-foreground">
              Delivery Preferences
            </h2>
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between py-3 border-b border-border/60">
            <div>
              <p className="text-sm font-sans text-foreground">Email Digest</p>
              <p className="text-xs text-muted-foreground font-sans">
                Receive a daily summary for your watched locations
              </p>
            </div>
            <button
              role="switch"
              aria-checked={emailAlerts}
              onClick={() => setEmailAlerts((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${emailAlerts ? "bg-secondary" : "bg-muted"}`}
              aria-label="Toggle email alerts"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform duration-200 ${emailAlerts ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* In-App */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-sans text-foreground">
                In-App Notifications
              </p>
              <p className="text-xs text-muted-foreground font-sans">
                Show badge alerts inside the platform
              </p>
            </div>
            <button
              role="switch"
              aria-checked={inAppAlerts}
              onClick={() => setInAppAlerts((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${inAppAlerts ? "bg-secondary" : "bg-muted"}`}
              aria-label="Toggle in-app notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform duration-200 ${inAppAlerts ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </section>

        {/* Tracked Locations */}
        <section className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Globe size={20} weight="fill" className="text-secondary" />
              <h2 className="text-base font-semibold font-sans text-foreground">
                Tracked Locations
              </h2>
            </div>
            {watched.length > 0 && (
              <span className="text-[11px] font-mono text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                {watched.length} tracked
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Toggle individual topics on each location to control what alerts you
            receive.
          </p>

          <div className="space-y-2 mb-4">
            {watched.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <BellSlash size={36} weight="thin" />
                <p className="text-sm font-sans">No locations tracked yet.</p>
                <p className="text-xs font-sans">
                  Search below to add your first one.
                </p>
              </div>
            )}
            {watched.map((w) => (
              <WatchedRow
                key={w.id}
                entity={w}
                onToggleTopic={toggleTopic}
                onRemove={removeEntity}
              />
            ))}
          </div>

          <EntitySearch onAdd={addEntity} existingIds={existingIds} />
        </section>
      </div>
    </div>
  );
}
