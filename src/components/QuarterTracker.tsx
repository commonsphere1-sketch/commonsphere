/**
 * The quarter tracker: where the year is, by calendar and by US federal
 * fiscal quarter, counting down to the end of this one, with each quarter's
 * scheduled conferences and events (calendar2026.ts).
 *
 * It was a card on the Dashboard, and is opened from the calendar button at
 * the top right of every page now (CalendarPopup), as asked - so it lives in
 * a file of its own and the button does not load the Dashboard to show it.
 * Nothing in it changed in the move.
 */
import React, { useEffect, useMemo, useState } from "react";
import { SourceLink } from "./SourceLink";
import { Figures, COUNTER_FIGURES, COUNTER_UNIT } from "./Figures";
import { CALENDAR_2026, CALENDAR_CHECKED, CALENDAR_YEAR, eventQuarter, type CalendarEvent } from "../data/calendar2026";

// ─── Quarter tracker ─────────────────────────────────────────────────────────
/**
 * Where the year is, by quarter.
 *
 * Two calendars, because a dashboard carrying US federal figures needs both
 * and they disagree by a quarter: the calendar year runs January to December,
 * while the US federal fiscal year runs 1 October to 30 September and is named
 * for the year it ends in, so 20 September 2026 is calendar Q3 and federal
 * FY2026 Q4.
 *
 * Everything is computed from the clock rather than written down, so nothing
 * here can go stale. Dates are local-time midnights; a quarter ends the instant
 * the next one begins, which is what the countdown counts to.
 */
type QuarterInfo = {
  label: string;
  start: Date;
  /** Exclusive: the first instant of the next quarter. */
  end: Date;
  index: number;
};

/** The four calendar quarters of the year `now` falls in. */
function calendarQuarters(now: Date): QuarterInfo[] {
  const y = now.getFullYear();
  return [0, 1, 2, 3].map((i) => ({
    label: `Q${i + 1}`,
    start: new Date(y, i * 3, 1),
    end: new Date(y, i * 3 + 3, 1),
    index: i,
  }));
}

/**
 * The four quarters of the US federal fiscal year `now` falls in. FY quarters
 * start in October, and the fiscal year is named for the calendar year it ends
 * in: October to December 2025 is FY2026 Q1.
 */
function fiscalQuarters(now: Date): { fy: number; quarters: QuarterInfo[] } {
  const m = now.getMonth();
  const startYear = m >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  const quarters = [0, 1, 2, 3].map((i) => ({
    label: `Q${i + 1}`,
    start: new Date(startYear, 9 + i * 3, 1),
    end: new Date(startYear, 9 + (i + 1) * 3, 1),
    index: i,
  }));
  return { fy: startYear + 1, quarters };
}

const QUARTER_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long" });
const range = (q: QuarterInfo) =>
  `${QUARTER_FMT.format(q.start)} – ${QUARTER_FMT.format(new Date(q.end.getTime() - 1))}`;

/**
 * A colour per quarter, taken from the northern-hemisphere season it mostly
 * covers: winter blue, spring green, summer gold, autumn rust.
 *
 * `accent` draws the borders, the progress bar and the fills. Text is never
 * the accent itself — on a tinted fill that is the pair most likely to fail
 * contrast — so each season also carries the ink to write on it: a dark shade
 * for the light theme, a pale one for the dark theme. The tint is the accent
 * at roughly 12% on light and 20% on dark, which keeps the four quarters
 * distinguishable without turning the card into a paintbox.
 */
const SEASONS = [
  // bright: a clearer, more saturated version of the accent, for the
  // progress bar, where the muted accents ran together into a muddy brown.
  { name: "Winter", accent: "#4f83cc", bright: "#6fa8ff", inkLight: "#1b3a63", inkDark: "#cfe2ff" },
  { name: "Spring", accent: "#4f9d69", bright: "#4cc48a", inkLight: "#17402d", inkDark: "#cfeddb" },
  { name: "Summer", accent: "#c79232", bright: "#f6c343", inkLight: "#54390a", inkDark: "#f7e4b6" },
  { name: "Autumn", accent: "#c0653c", bright: "#f27a54", inkLight: "#5b2811", inkDark: "#f8d8c6" },
] as const;

/** Local midnight for an ISO yyyy-mm-dd, so nothing shifts by a time zone. */
function isoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** How an entry reads as a date: a day, a span of days, or a bare month. */
function eventDateLabel(e: CalendarEvent): string {
  const start = isoDate(e.start);
  if (e.monthOnly) return MONTH_FMT.format(start);
  if (!e.end) return QUARTER_FMT.format(start);
  const end = isoDate(e.end);
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${start.getDate()}–${QUARTER_FMT.format(end)}`
    : `${QUARTER_FMT.format(start)} – ${QUARTER_FMT.format(end)}`;
}

/** Where an entry sits relative to the clock. A month-only entry uses its month. */
function eventState(e: CalendarEvent, now: Date): { kind: "past" | "now" | "ahead"; days: number } {
  const start = isoDate(e.start);
  const last = e.monthOnly
    ? new Date(start.getFullYear(), start.getMonth() + 1, 0)
    : isoDate(e.end ?? e.start);
  const endOfLast = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  if (now >= endOfLast) return { kind: "past", days: 0 };
  if (now >= start) return { kind: "now", days: 0 };
  return { kind: "ahead", days: Math.ceil((start.getTime() - now.getTime()) / 86400000) };
}

/** "past", "under way", or how long until it starts. */
function statusLabel(st: { kind: "past" | "now" | "ahead"; days: number }): string {
  if (st.kind === "past") return "past";
  if (st.kind === "now") return "under way";
  return st.days === 1 ? "tomorrow" : `in ${st.days} days`;
}

const THEME_FILTERS = ["All", "Political", "Economic", "Social"] as const;
const SCOPE_FILTERS = ["All", "National", "International"] as const;

/** The row dates stay monospaced: they sit in a list, and they do not tick. */
const ROW_FIGURES: React.CSSProperties = {
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "0.035em",
};

export function QuarterTracker({
  isLight,
  cardBg,
  cardBorder,
  headText,
  mutedText,
  gridLine,
}: {
  isLight: boolean;
  cardBg: string;
  cardBorder: string;
  headText: string;
  mutedText: string;
  gridLine: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const calendar = calendarQuarters(now);
  const fiscal = fiscalQuarters(now);
  const current = calendar.find((q) => now >= q.start && now < q.end)!;
  const currentFiscal = fiscal.quarters.find((q) => now >= q.start && now < q.end)!;

  // The quarter whose diary is on show; the current one until the reader picks
  // another. Kept in state, so the once-a-second clock tick does not reset it.
  const [selected, setSelected] = useState(current.index);
  const [themeFilter, setThemeFilter] = useState<(typeof THEME_FILTERS)[number]>("All");
  const [scopeFilter, setScopeFilter] = useState<(typeof SCOPE_FILTERS)[number]>("All");
  // One entry open at a time: the detail is a few lines, and an accordion
  // keeps the quarter readable as a list of dates.
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  // Hover is state, not a :hover class: the row's background is an inline
  // style keyed to the quarter's colour, and a Tailwind hover variant cannot
  // override an inline background.
  const [hoverEvent, setHoverEvent] = useState<string | null>(null);
  // The diary as a whole folds away, and starts folded: the tracker leads
  // with the countdown, and the header still says how many entries the
  // quarter holds. It opens on its own if a quarter is picked, since picking
  // one is a request to see it.
  const [diaryOpen, setDiaryOpen] = useState(false);

  const season = SEASONS[selected];
  const accent = season.accent;
  const ink = isLight ? season.inkLight : season.inkDark;
  const tint = (a: string) => a + (isLight ? "1f" : "33");

  const span = current.end.getTime() - current.start.getTime();
  const elapsed = now.getTime() - current.start.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / span) * 100));

  // Countdown to the first instant of the next quarter.
  const left = current.end.getTime() - now.getTime();
  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const state = (q: QuarterInfo) =>
    now >= q.end ? "done" : now >= q.start ? "current" : "ahead";

  // Entries in the chosen quarter, in date order, after the two filters.
  const byQuarter = useMemo(() => {
    const out: CalendarEvent[][] = [[], [], [], []];
    for (const e of CALENDAR_2026) out[eventQuarter(e)].push(e);
    for (const list of out) list.sort((a, b) => a.start.localeCompare(b.start));
    return out;
  }, []);
  const shown = byQuarter[selected].filter(
    (e) =>
      (themeFilter === "All" || e.theme === themeFilter) &&
      (scopeFilter === "All" || e.scope === scopeFilter),
  );

  /**
   * A quarter button. Three things have to read at a glance and they are
   * carried by three different signals, so none of them has to fight the
   * seasonal colour: the season is the fill, selection is the ring, and where
   * the year actually is ("now", "done", "ahead") is the word on the right.
   */
  const chipStyle = (i: number): React.CSSProperties => {
    const s = state(calendar[i]);
    const c = SEASONS[i].accent;
    const isSel = i === selected;
    return {
      background: s === "ahead" && !isSel ? "transparent" : tint(c),
      border: `1px ${s === "ahead" && !isSel ? "dashed" : "solid"} ${isSel ? c : s === "current" ? c : gridLine}`,
      color: s === "ahead" && !isSel ? mutedText : isLight ? SEASONS[i].inkLight : SEASONS[i].inkDark,
      // A ring is the obvious signal for "this is the one you are reading",
      // but every rounded clickable element on the site already carries an
      // !important box-shadow (index.css), so an inline one never lands. An
      // outline is not in that fight.
      outline: isSel ? `2px solid ${c}` : "none",
      outlineOffset: "1px",
      opacity: s === "done" && !isSel ? 0.75 : 1,
    };
  };

  // An unselected filter is still a control, so it keeps the body's text
  // colour rather than the muted one used for captions — at 10px the muted
  // grey is too faint to read on the dark theme.
  const filterStyle = (on: boolean): React.CSSProperties =>
    on
      ? { background: tint(accent), border: `1px solid ${accent}`, color: ink }
      : { background: "transparent", border: `1px solid ${gridLine}`, color: headText };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: cardBorder }}>
      <div
        className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2"
        style={{ borderBottom: `1px solid ${gridLine}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-sans" style={{ color: headText }}>
            Quarter Tracker
          </span>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: tint(SEASONS[current.index].accent), color: isLight ? SEASONS[current.index].inkLight : SEASONS[current.index].inkDark }}
          >
            {current.label} {current.start.getFullYear()}
          </span>
        </div>
        <p className="text-[10px] font-sans" style={{ color: mutedText }}>
          Calendar quarter {current.label}, {range(current)} · US federal fiscal year {fiscal.fy}, {currentFiscal.label}
        </p>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Countdown to the next quarter */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-sans uppercase tracking-widest mb-1" style={{ color: mutedText }}>
              {current.label} ends in
            </p>
            <p className="text-[32px] leading-none" style={{ ...COUNTER_FIGURES, color: headText }}>
              <Figures value={String(days)} />
              <span style={COUNTER_UNIT}>d</span>{" "}
              <Figures value={`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-sans uppercase tracking-widest mb-1" style={{ color: mutedText }}>
              Elapsed
            </p>
            <p className="text-[32px] leading-none" style={{ ...COUNTER_FIGURES, color: headText }}>
              <Figures value={pct.toFixed(1)} />
              <span style={COUNTER_UNIT}>%</span>
            </p>
          </div>
          <p className="text-[10px] font-sans" style={{ color: mutedText }}>
            {current.label} runs to {QUARTER_FMT.format(new Date(current.end.getTime() - 1))}; Q
            {((current.index + 1) % 4) + 1} begins {QUARTER_FMT.format(current.end)}
          </p>
        </div>

        {/* Progress through the current quarter.
            A gradient, like the hero above it, and one that means something:
            it runs from this season's colour into the next one, so the bar
            hands over to the quarter it is counting down to as it fills. */}
        <div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${SEASONS[current.index].bright} 0%, ${
                  SEASONS[(current.index + 1) % 4].bright
                } 100%)`,
                boxShadow: `0 0 10px ${SEASONS[(current.index + 1) % 4].bright}55`,
              }}
            />
          </div>
        </div>

        {/* The four quarters of this calendar year, each one selectable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {calendar.map((q) => {
            const s = state(q);
            const count = byQuarter[q.index].length;
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  setSelected(q.index);
                  setDiaryOpen(true);
                }}
                aria-pressed={q.index === selected}
                className="rounded-xl px-3 py-2 text-left transition-all cursor-pointer"
                style={chipStyle(q.index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold font-mono">
                    {q.label} <span className="font-sans font-normal opacity-70">{SEASONS[q.index].name}</span>
                  </span>
                  <span className="text-[9px] font-sans uppercase tracking-wider">
                    {s === "current" ? "now" : s === "done" ? "done" : "ahead"}
                  </span>
                </div>
                <p className="text-[10px] font-sans mt-0.5">{range(q)}</p>
                <p className="text-[10px] font-sans opacity-80">
                  {count} {count === 1 ? "entry" : "entries"}
                </p>
              </button>
            );
          })}
        </div>

        {/* The chosen quarter's diary. The whole section folds away from its
            own header, so the tracker can go back to being a countdown. */}
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${gridLine}` }}>
          <button
            type="button"
            onClick={() => setDiaryOpen((v) => !v)}
            aria-expanded={diaryOpen}
            className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2 cursor-pointer"
            style={{
              borderBottom: diaryOpen ? `1px solid ${gridLine}` : "none",
            }}
          >
            <span className="text-sm font-bold font-sans" style={{ color: headText }}>
              Q{selected + 1} {CALENDAR_YEAR} · scheduled conferences and events
            </span>
            <span className="text-[11px] font-sans" style={{ color: mutedText }}>
              {diaryOpen
                ? `${shown.length} of ${byQuarter[selected].length} shown`
                : `${byQuarter[selected].length} entries`}
            </span>
            <span
              className="text-[10px] font-sans uppercase tracking-wider ml-auto"
              style={{ color: mutedText }}
            >
              {diaryOpen ? "Hide" : "Show"}
            </span>
          </button>

          {diaryOpen && (
          <>
          <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-sans uppercase tracking-widest mr-0.5" style={{ color: mutedText }}>
                Theme
              </span>
              {THEME_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setThemeFilter(t)}
                  aria-pressed={themeFilter === t}
                  className="text-[11px] font-sans px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  style={filterStyle(themeFilter === t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-sans uppercase tracking-widest mr-0.5" style={{ color: mutedText }}>
                Scope
              </span>
              {SCOPE_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setScopeFilter(t)}
                  aria-pressed={scopeFilter === t}
                  className="text-[11px] font-sans px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  style={filterStyle(scopeFilter === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-col gap-2">
            {shown.map((e) => {
              const st = eventState(e, now);
              const isOpen = openEvent === e.id;
              const hovered = hoverEvent === e.id;
              // The same hover the dashboard's expandable rows use: the row
              // warms toward the quarter's colour rather than fading, and
              // takes a bar in that colour down its leading edge, which is
              // what carries the state where the tint is hard to see. A past
              // row also comes back to full strength under the cursor, so it
              // does not read as disabled.
              const rowBg = isOpen
                ? accent + (isLight ? (hovered ? "29" : "1f") : hovered ? "3d" : "33")
                : hovered
                  ? accent + (isLight ? "17" : "29")
                  : st.kind === "now"
                    ? tint(accent)
                    : "transparent";
              return (
                <div
                  key={e.id}
                  onMouseEnter={() => setHoverEvent(e.id)}
                  onMouseLeave={() => setHoverEvent(null)}
                  className="rounded-lg overflow-hidden transition-all duration-150"
                  style={{
                    border: `1px solid ${isOpen || hovered ? accent : gridLine}`,
                    background: rowBg,
                    opacity: st.kind === "past" && !isOpen && !hovered ? 0.62 : 1,
                  }}
                >
                  {/* Collapsed, a row is the date, where it sits in the year,
                      and what it is called. The rest waits for a click, so
                      eleven entries stay a list rather than a wall. */}
                  <button
                    type="button"
                    onClick={() => setOpenEvent(isOpen ? null : e.id)}
                    onFocus={() => setHoverEvent(e.id)}
                    onBlur={() => setHoverEvent(null)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 cursor-pointer transition-all duration-150"
                    style={{
                      boxShadow: hovered || isOpen ? `inset 3px 0 0 0 ${accent}` : "none",
                    }}
                  >
                    <span className="sm:w-28 shrink-0 block">
                      <span
                        className="text-xs font-mono block"
                        style={{ ...ROW_FIGURES, color: headText }}
                      >
                        {eventDateLabel(e)}
                      </span>
                      <span
                        className="text-[10px] font-sans uppercase tracking-wider block"
                        style={{ color: mutedText }}
                      >
                        {statusLabel(st)}
                      </span>
                    </span>
                    <span
                      className="text-[13px] font-semibold font-sans min-w-0 flex-1"
                      style={{ color: headText }}
                    >
                      {e.name}
                    </span>
                    <span
                      className="text-[10px] font-sans uppercase tracking-wider shrink-0"
                      style={{ color: mutedText }}
                    >
                      {isOpen ? "Close" : "Details"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 sm:pl-[7.75rem]">
                      <p className="text-[11px] font-sans" style={{ color: mutedText }}>
                        {e.org} · {e.city}
                        {e.city !== e.country && `, ${e.country}`}
                      </p>
                      <p className="text-[11px] font-sans mt-1" style={{ color: mutedText }}>
                        {e.what}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span
                          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                          style={{ border: `1px solid ${gridLine}`, color: mutedText }}
                        >
                          {e.scope}
                        </span>
                        <span
                          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                          style={{ background: tint(accent), color: ink }}
                        >
                          {e.theme}
                        </span>
                        {e.monthOnly && (
                          <span
                            className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                            style={{ border: `1px dashed ${gridLine}`, color: mutedText }}
                          >
                            days to be confirmed
                          </span>
                        )}
                      </div>
                      <SourceLink sources={[e.source]} />
                    </div>
                  )}
                </div>
              );
            })}
            {shown.length === 0 && (
              <p className="text-xs font-sans" style={{ color: mutedText }}>
                Nothing in Q{selected + 1} matches those filters.
              </p>
            )}
            <p className="text-[10px] font-sans mt-1" style={{ color: mutedText }}>
              Each entry is taken from the convening body's own page and was checked on {CALENDAR_CHECKED}.
              Scheduled dates can move; the source link is the place to confirm one.
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
