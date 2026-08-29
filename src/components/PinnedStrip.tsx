import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PushPin,
  X,
  Pencil,
  CheckCircle,
  PushPinSlash,
} from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";

const LS_KEY_COUNTRIES = "cs_pinned_countries";
const LS_KEY_STATES = "cs_pinned_states";
/** Country has no `flag` field — derive the emoji from its ISO alpha-2 code
 *  by mapping each letter to its regional-indicator symbol. */
function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}

function usePinned(key: string, defaultIds: string[]) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultIds;
    } catch {
      return defaultIds;
    }
  });
  const toggle = (id: string) =>
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  return { ids, toggle };
}

export function PinnedStrip() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const { ids: pinnedCountryIds, toggle: toggleCountry } = usePinned(
    LS_KEY_COUNTRIES,
    ["us", "cn", "de", "gb", "jp"],
  );
  const { ids: pinnedStateIds, toggle: toggleState } = usePinned(
    LS_KEY_STATES,
    ["ca", "tx", "ny", "fl", "wa"],
  );

  const pinnedCountries = useMemo(
    () => countriesData.filter((c) => pinnedCountryIds.includes(c.id)),
    [pinnedCountryIds],
  );
  const pinnedStates = useMemo(
    () => usStatesData.filter((s) => pinnedStateIds.includes(s.id)),
    [pinnedStateIds],
  );

  const accent = "#6366f1";
  const bg = isLight ? "rgba(255,255,255,0.96)" : "rgba(14,13,26,0.97)";
  const border = isLight ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.09)";
  const shadow = isLight
    ? "0 4px 24px rgba(0,0,0,0.10)"
    : "0 4px 24px rgba(0,0,0,0.45)";
  const mutedText = isLight ? "rgba(30,41,59,0.45)" : "rgba(255,255,255,0.35)";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const itemBg = isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.04)";
  const itemBgHover = isLight
    ? "rgba(99,102,241,0.07)"
    : "rgba(99,102,241,0.12)";

  const handleCountryClick = (id: string) => {
    if (editing) return;
    navigate(`/dashboard/countries?open=${id}`);
  };

  const handleStateClick = (id: string) => {
    if (editing) return;
    navigate(`/dashboard/states?open=${id}`);
  };

  const totalPinned = pinnedCountries.length + pinnedStates.length;

  return (
    <div
      className="fixed right-0 top-16 bottom-0 z-20 flex flex-col overflow-hidden"
      style={{
        width: 56,
        background: bg,
        borderLeft: `1px solid ${border}`,
        boxShadow: shadow,
      }}
    >
      {/* Header pin icon + edit toggle */}
      <div
        className="flex flex-col items-center py-3 gap-2 shrink-0"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: accent + "16", border: `1px solid ${accent}28` }}
        >
          <PushPin size={14} weight="fill" style={{ color: accent }} />
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          title={editing ? "Done editing" : "Edit pins"}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{
            background: editing ? accent + "20" : "transparent",
            color: editing ? accent : mutedText,
            border: `1px solid ${editing ? accent + "40" : "transparent"}`,
          }}
        >
          {editing ? (
            <CheckCircle size={13} weight="bold" />
          ) : (
            <Pencil size={12} weight="bold" />
          )}
        </button>
      </div>

      {/* Scrollable pin list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-2 gap-1 scrollbar-none">
        {/* Countries section */}
        {pinnedCountries.length > 0 && (
          <>
            <span
              className="text-[8px] font-mono uppercase tracking-widest py-1"
              style={{ color: mutedText, letterSpacing: "0.1em" }}
            >
              CTR
            </span>
            {pinnedCountries.map((c) => (
              <div
                key={c.id}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all active:scale-95"
                style={{
                  background: hovered === c.id ? itemBgHover : itemBg,
                  border: `1px solid ${hovered === c.id ? accent + "30" : gridLine}`,
                }}
                onClick={() => handleCountryClick(c.id)}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                title={c.name}
              >
                <span className="text-xl leading-none select-none">
                  {flagEmoji(c.code)}
                </span>
                {/* Remove badge in edit mode */}
                {editing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCountry(c.id);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center z-10"
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    <X size={8} weight="bold" />
                  </button>
                )}
                {/* Tooltip */}
                {hovered === c.id && !editing && (
                  <div
                    className="absolute right-12 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl text-[11px] font-sans font-semibold whitespace-nowrap pointer-events-none z-50 shadow-xl"
                    style={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: `1px solid ${border}`,
                      color: headText,
                      boxShadow: shadow,
                    }}
                  >
                    <div style={{ color: headText }}>{c.name}</div>
                    <div
                      className="text-[9px] font-mono mt-0.5"
                      style={{ color: mutedText }}
                    >
                      {c.gdpGrowth >= 0 ? "+" : ""}
                      {c.gdpGrowth}% GDP · {c.unemploymentRate.toFixed(1)}%
                      unemp.
                    </div>
                    {/* arrow */}
                    <div
                      className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45"
                      style={{
                        background: isLight ? "#fff" : "#1a1730",
                        borderRight: `1px solid ${border}`,
                        borderTop: `1px solid ${border}`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Divider */}
        {pinnedCountries.length > 0 && pinnedStates.length > 0 && (
          <div
            className="w-6 my-1"
            style={{ borderTop: `1px solid ${gridLine}` }}
          />
        )}

        {/* States section */}
        {pinnedStates.length > 0 && (
          <>
            <span
              className="text-[8px] font-mono uppercase tracking-widest py-1"
              style={{ color: mutedText, letterSpacing: "0.1em" }}
            >
              ST
            </span>
            {pinnedStates.map((s) => (
              <div
                key={s.id}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all active:scale-95"
                style={{
                  background:
                    hovered === `st-${s.id}` ? "rgba(59,130,246,0.1)" : itemBg,
                  border: `1px solid ${hovered === `st-${s.id}` ? "rgba(59,130,246,0.28)" : gridLine}`,
                }}
                onClick={() => handleStateClick(s.id)}
                onMouseEnter={() => setHovered(`st-${s.id}`)}
                onMouseLeave={() => setHovered(null)}
                title={s.name}
              >
                <span
                  className="text-[10px] font-mono font-bold select-none"
                  style={{ color: isLight ? "#3b82f6" : "#93c5fd" }}
                >
                  {s.abbreviation}
                </span>
                {editing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleState(s.id);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center z-10"
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    <X size={8} weight="bold" />
                  </button>
                )}
                {hovered === `st-${s.id}` && !editing && (
                  <div
                    className="absolute right-12 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl text-[11px] font-sans font-semibold whitespace-nowrap pointer-events-none z-50 shadow-xl"
                    style={{
                      background: isLight ? "#fff" : "#1a1730",
                      border: `1px solid ${border}`,
                      color: headText,
                      boxShadow: shadow,
                    }}
                  >
                    <div style={{ color: headText }}>{s.name}</div>
                    <div
                      className="text-[9px] font-mono mt-0.5"
                      style={{ color: mutedText }}
                    >
                      ${s.gdp}B GDP · {s.unemploymentRate}% unemp.
                    </div>
                    <div
                      className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45"
                      style={{
                        background: isLight ? "#fff" : "#1a1730",
                        borderRight: `1px solid ${border}`,
                        borderTop: `1px solid ${border}`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {totalPinned === 0 && (
          <div className="flex flex-col items-center gap-1 py-4 px-1">
            <PushPinSlash size={18} style={{ color: mutedText }} />
            <span
              className="text-[8px] font-mono text-center"
              style={{ color: mutedText }}
            >
              No pins
            </span>
          </div>
        )}
      </div>

      {/* Count badge at bottom */}
      {totalPinned > 0 && (
        <div
          className="shrink-0 flex items-center justify-center py-2"
          style={{ borderTop: `1px solid ${gridLine}` }}
        >
          <span
            className="text-[9px] font-mono tabular-nums"
            style={{ color: accent }}
          >
            {totalPinned}
          </span>
        </div>
      )}
    </div>
  );
}
