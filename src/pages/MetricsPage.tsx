import React, { useState } from "react";
import { MetricsPanel } from "../components/MetricsPanel";
import { COUNTRY_METRICS, STATE_METRICS } from "../data/comprehensiveMetrics";
import { MagnifyingGlass, Globe, Buildings } from "@phosphor-icons/react";

type EntityType = "country" | "state";

interface EntityOption {
  id: string;
  label: string;
  flag?: string;
  type: EntityType;
}

const COUNTRY_OPTIONS: EntityOption[] = [
  { id: "us", label: "United States", flag: "🇺🇸", type: "country" },
  { id: "cn", label: "China", flag: "🇨🇳", type: "country" },
  { id: "de", label: "Germany", flag: "🇩🇪", type: "country" },
  { id: "gb", label: "United Kingdom", flag: "🇬🇧", type: "country" },
  { id: "fr", label: "France", flag: "🇫🇷", type: "country" },
  { id: "jp", label: "Japan", flag: "🇯🇵", type: "country" },
  { id: "in", label: "India", flag: "🇮🇳", type: "country" },
  { id: "br", label: "Brazil", flag: "🇧🇷", type: "country" },
  { id: "ru", label: "Russia", flag: "🇷🇺", type: "country" },
  { id: "au_oc", label: "Australia", flag: "🇦🇺", type: "country" },
  { id: "kr", label: "South Korea", flag: "🇰🇷", type: "country" },
  { id: "ca", label: "Canada", flag: "🇨🇦", type: "country" },
  { id: "sa", label: "Saudi Arabia", flag: "🇸🇦", type: "country" },
  { id: "ae", label: "UAE", flag: "🇦🇪", type: "country" },
  { id: "sg", label: "Singapore", flag: "🇸🇬", type: "country" },
  { id: "mx", label: "Mexico", flag: "🇲🇽", type: "country" },
  { id: "za", label: "South Africa", flag: "🇿🇦", type: "country" },
  { id: "ng", label: "Nigeria", flag: "🇳🇬", type: "country" },
  { id: "il_as", label: "Israel", flag: "🇮🇱", type: "country" },
  { id: "se", label: "Sweden", flag: "🇸🇪", type: "country" },
  { id: "no", label: "Norway", flag: "🇳🇴", type: "country" },
  { id: "dk", label: "Denmark", flag: "🇩🇰", type: "country" },
  { id: "fi", label: "Finland", flag: "🇫🇮", type: "country" },
  { id: "nl", label: "Netherlands", flag: "🇳🇱", type: "country" },
  { id: "ch", label: "Switzerland", flag: "🇨🇭", type: "country" },
  { id: "it", label: "Italy", flag: "🇮🇹", type: "country" },
  { id: "es", label: "Spain", flag: "🇪🇸", type: "country" },
  { id: "pl", label: "Poland", flag: "🇵🇱", type: "country" },
  { id: "tr", label: "Turkey", flag: "🇹🇷", type: "country" },
  { id: "id", label: "Indonesia", flag: "🇮🇩", type: "country" },
  { id: "nz", label: "New Zealand", flag: "🇳🇿", type: "country" },
  { id: "tw", label: "Taiwan", flag: "🇹🇼", type: "country" },
  { id: "cl", label: "Chile", flag: "🇨🇱", type: "country" },
  { id: "ar", label: "Argentina", flag: "🇦🇷", type: "country" },
  { id: "my", label: "Malaysia", flag: "🇲🇾", type: "country" },
  { id: "th", label: "Thailand", flag: "🇹🇭", type: "country" },
  { id: "vn", label: "Vietnam", flag: "🇻🇳", type: "country" },
  { id: "ph", label: "Philippines", flag: "🇵🇭", type: "country" },
  { id: "pk", label: "Pakistan", flag: "🇵🇰", type: "country" },
  { id: "bd", label: "Bangladesh", flag: "🇧🇩", type: "country" },
  { id: "eg", label: "Egypt", flag: "🇪🇬", type: "country" },
  { id: "et", label: "Ethiopia", flag: "🇪🇹", type: "country" },
  { id: "ke", label: "Kenya", flag: "🇰🇪", type: "country" },
  { id: "gh", label: "Ghana", flag: "🇬🇭", type: "country" },
  { id: "cd", label: "DR Congo", flag: "🇨🇩", type: "country" },
  { id: "ma", label: "Morocco", flag: "🇲🇦", type: "country" },
  { id: "ua", label: "Ukraine", flag: "🇺🇦", type: "country" },
  { id: "kz", label: "Kazakhstan", flag: "🇰🇿", type: "country" },
  { id: "ir", label: "Iran", flag: "🇮🇷", type: "country" },
  { id: "iq", label: "Iraq", flag: "🇮🇶", type: "country" },
  { id: "kp", label: "North Korea", flag: "🇰🇵", type: "country" },
];

const STATE_OPTIONS: EntityOption[] = [
  { id: "ca", label: "California", flag: "🌴", type: "state" },
  { id: "tx", label: "Texas", flag: "⭐", type: "state" },
  { id: "ny", label: "New York", flag: "🗽", type: "state" },
  { id: "fl", label: "Florida", flag: "☀️", type: "state" },
  { id: "il", label: "Illinois", flag: "🏙️", type: "state" },
  { id: "pa", label: "Pennsylvania", flag: "🔔", type: "state" },
  { id: "oh", label: "Ohio", flag: "🌻", type: "state" },
  { id: "ga", label: "Georgia", flag: "🍑", type: "state" },
  { id: "nc", label: "North Carolina", flag: "🌲", type: "state" },
  { id: "mi", label: "Michigan", flag: "🚗", type: "state" },
  { id: "wa", label: "Washington", flag: "🌧️", type: "state" },
  { id: "ma", label: "Massachusetts", flag: "🦞", type: "state" },
  { id: "va", label: "Virginia", flag: "🏛️", type: "state" },
  { id: "co", label: "Colorado", flag: "🏔️", type: "state" },
  { id: "mn", label: "Minnesota", flag: "🌊", type: "state" },
  { id: "nj", label: "New Jersey", flag: "🌃", type: "state" },
  { id: "md", label: "Maryland", flag: "🦀", type: "state" },
  { id: "ct", label: "Connecticut", flag: "⛵", type: "state" },
  { id: "wi", label: "Wisconsin", flag: "🧀", type: "state" },
  { id: "or", label: "Oregon", flag: "🌲", type: "state" },
  { id: "al", label: "Alabama", flag: "🎶", type: "state" },
  { id: "ms", label: "Mississippi", flag: "🎸", type: "state" },
  { id: "la", label: "Louisiana", flag: "🎷", type: "state" },
  { id: "tn", label: "Tennessee", flag: "🎵", type: "state" },
  { id: "mo", label: "Missouri", flag: "🌉", type: "state" },
  { id: "in", label: "Indiana", flag: "🏎️", type: "state" },
  { id: "ut", label: "Utah", flag: "🏜️", type: "state" },
  { id: "az", label: "Arizona", flag: "🌵", type: "state" },
  { id: "nv", label: "Nevada", flag: "🎰", type: "state" },
  { id: "ak", label: "Alaska", flag: "🐻", type: "state" },
  { id: "hi", label: "Hawaii", flag: "🌺", type: "state" },
  { id: "me", label: "Maine", flag: "🦞", type: "state" },
  { id: "nh", label: "New Hampshire", flag: "⛰️", type: "state" },
  { id: "vt", label: "Vermont", flag: "🍁", type: "state" },
  { id: "ri", label: "Rhode Island", flag: "⚓", type: "state" },
  { id: "de", label: "Delaware", flag: "🌼", type: "state" },
  { id: "sc", label: "South Carolina", flag: "🌴", type: "state" },
  { id: "ky", label: "Kentucky", flag: "🐎", type: "state" },
  { id: "wv", label: "West Virginia", flag: "⛏️", type: "state" },
  { id: "ar", label: "Arkansas", flag: "💎", type: "state" },
  { id: "ok", label: "Oklahoma", flag: "🛢️", type: "state" },
  { id: "ks", label: "Kansas", flag: "🌾", type: "state" },
  { id: "ne", label: "Nebraska", flag: "🌽", type: "state" },
  { id: "ia", label: "Iowa", flag: "🌽", type: "state" },
  { id: "sd", label: "South Dakota", flag: "🦅", type: "state" },
  { id: "nd", label: "North Dakota", flag: "🛢️", type: "state" },
  { id: "mt", label: "Montana", flag: "🦌", type: "state" },
  { id: "wy", label: "Wyoming", flag: "🦬", type: "state" },
  { id: "id", label: "Idaho", flag: "🥔", type: "state" },
  { id: "nm", label: "New Mexico", flag: "🌶️", type: "state" },
];

export function MetricsPage() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"country" | "state">("country");
  const [selected, setSelected] = useState<EntityOption>(COUNTRY_OPTIONS[0]);

  const options = mode === "country" ? COUNTRY_OPTIONS : STATE_OPTIONS;
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleModeSwitch = (m: "country" | "state") => {
    setMode(m);
    setSearch("");
    setSelected(m === "country" ? COUNTRY_OPTIONS[0] : STATE_OPTIONS[0]);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-secondary/10">
            <span className="text-base">📊</span>
          </div>
          <h1 className="text-lg font-bold font-sans text-foreground">
            Metrics Explorer
          </h1>
        </div>
        <p className="text-xs text-muted-foreground font-sans">
          Browse 90+ indexed metrics across 13 categories for countries &amp; US
          states
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — entity picker */}
        <div className="w-64 shrink-0 border-r border-border flex flex-col min-h-0">
          {/* Mode toggle */}
          <div className="flex gap-1 p-3 shrink-0">
            <button
              onClick={() => handleModeSwitch("country")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold font-sans transition-colors cursor-pointer ${mode === "country" ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Globe
                size={13}
                weight={mode === "country" ? "fill" : "regular"}
              />
              Countries
            </button>
            <button
              onClick={() => handleModeSwitch("state")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold font-sans transition-colors cursor-pointer ${mode === "state" ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Buildings
                size={13}
                weight={mode === "state" ? "fill" : "regular"}
              />
              US States
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 bg-muted/60 border border-border/60 rounded-lg px-2.5 py-1.5">
              <MagnifyingGlass
                size={12}
                className="text-muted-foreground shrink-0"
              />
              <input
                type="text"
                placeholder={`Search ${mode === "country" ? "countries" : "states"}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Entity list */}
          <div
            className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {filtered.map((opt) => {
              const isActive = selected.id === opt.id && selected.type === mode;
              const hasData =
                mode === "country"
                  ? !!COUNTRY_METRICS[opt.id]
                  : !!STATE_METRICS[opt.id];
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isActive
                      ? "bg-secondary/20 text-secondary"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className="text-base shrink-0">{opt.flag}</span>
                  <span className="text-[11px] font-sans truncate flex-1">
                    {opt.label}
                  </span>
                  {!hasData && (
                    <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                      —
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — metrics */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="mb-4">
            <h2 className="text-base font-bold font-sans text-foreground flex items-center gap-2">
              <span className="text-xl">{selected.flag}</span>
              {selected.label}
            </h2>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
              {mode === "country" ? "Country" : "US State"} · 2024–2026
              estimates
            </p>
          </div>
          <MetricsPanel entityId={selected.id} entityType={mode} />
        </div>
      </div>
    </div>
  );
}
