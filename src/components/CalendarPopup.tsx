/**
 * The calendar button: at the top right of every page, below the header,
 * the way the notes button sits at the bottom right. Pressed, it opens a
 * panel with a full calendar - a month at a time, today marked, and the
 * scheduled conferences and events the site holds (calendar2026.ts) on their
 * days - and under it the quarter tracker that was the Dashboard's card.
 *
 * Every entry is the convening body's own, with its page as its source; a
 * month-only entry is set on its month and not on a day nobody has
 * confirmed. The diary the site holds is 2026's: another year's months are
 * drawn without entries, and say so.
 */
import { useEffect, useMemo, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight, ArrowsIn, ArrowsOut, X } from "@phosphor-icons/react";
import { CALENDAR_2026, CALENDAR_CHECKED, CALENDAR_YEAR, type CalendarEvent } from "../data/calendar2026";
import { useTokens } from "./DataExplorer";
import { QuarterTracker } from "./QuarterTracker";
import { SourceLink } from "./SourceLink";

const THEME_COLOR: Record<CalendarEvent["theme"], string> = { Political: "#6366f1", Economic: "#f59e0b", Social: "#10b981" };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** A local date's key, yyyy-mm-dd. */
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** The days an event runs on, by key: none for a month-only entry, which is shown on its month. */
function daysOf(e: CalendarEvent): string[] {
  if (e.monthOnly) return [];
  const out: string[] = [];
  const end = fromKey(e.end ?? e.start);
  for (let d = fromKey(e.start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push(keyOf(d));
  return out;
}
const BY_DAY = (() => {
  const m = new Map<string, CalendarEvent[]>();
  for (const e of CALENDAR_2026) for (const k of daysOf(e)) m.set(k, [...(m.get(k) ?? []), e]);
  return m;
})();
const when = (e: CalendarEvent) =>
  e.monthOnly ? `${new Intl.DateTimeFormat("en-GB", { month: "long" }).format(fromKey(e.start))}, days not yet published` : e.end && e.end !== e.start ? `${SHORT.format(fromKey(e.start))} – ${SHORT.format(fromKey(e.end))}` : SHORT.format(fromKey(e.start));

/** The month, a day to a cell. Full screen, as asked, it is the calendar that fills the window: its cells grow taller with it. */
function MonthCalendar({ wide = false }: { wide?: boolean } = {}) {
  const t = useTokens();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState<string | null>(null);
  const cells = useMemo(() => {
    // From the Monday on or before the first, six weeks: every month fits.
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - lead + i));
  }, [month]);
  const monthOnly = CALENDAR_2026.filter((e) => e.monthOnly && fromKey(e.start).getMonth() === month.getMonth() && fromKey(e.start).getFullYear() === month.getFullYear());
  const inMonth = CALENDAR_2026.filter((e) => {
    const s = fromKey(e.start);
    const end = fromKey(e.end ?? e.start);
    return !e.monthOnly && end >= new Date(month.getFullYear(), month.getMonth(), 1) && s < new Date(month.getFullYear(), month.getMonth() + 1, 1);
  });
  const list = picked ? (BY_DAY.get(picked) ?? []) : inMonth;
  const held = month.getFullYear() === CALENDAR_YEAR;
  const step = (n: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
    setPicked(null);
  };
  const navBtn = "w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-muted/60";
  return (
    <section className="rounded-2xl p-4" style={{ background: t.cardBg, border: t.cardBorder }} aria-label="Calendar">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-bold font-sans flex-1" style={{ color: t.headText }}>
          {MONTH.format(month)}
        </h3>
        <button type="button" onClick={() => step(-1)} className={navBtn} style={{ color: t.headText }} aria-label="The month before">
          <CaretLeft size={13} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => {
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setPicked(keyOf(today));
          }}
          className="text-[11px] font-sans px-2.5 py-1 rounded-full border border-border cursor-pointer hover:bg-muted/60"
          style={{ color: t.headText }}
        >
          Today
        </button>
        <button type="button" onClick={() => step(1)} className={navBtn} style={{ color: t.headText }} aria-label="The month after">
          <CaretRight size={13} weight="bold" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={MONTH.format(month)}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[9px] font-mono uppercase tracking-wider pb-1" style={{ color: t.mutedText }} role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((d) => {
          const k = keyOf(d);
          const here = d.getMonth() === month.getMonth();
          const events = BY_DAY.get(k) ?? [];
          const isToday = k === keyOf(today);
          const on = picked === k;
          return (
            <button
              key={k}
              type="button"
              role="gridcell"
              aria-selected={on}
              aria-label={`${DAY.format(d)}${events.length ? `: ${events.length} ${events.length === 1 ? "event" : "events"}` : ""}`}
              onClick={() => setPicked(on ? null : k)}
              className={`relative rounded-lg ${wide ? "h-16 lg:h-20" : "h-11"} flex flex-col items-center justify-start pt-1 cursor-pointer transition-colors hover:bg-muted/50`}
              style={{
                opacity: here ? 1 : 0.35,
                background: on ? (t.isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)") : "transparent",
                border: isToday ? `1px solid ${t.headText}` : `1px solid transparent`,
              }}
            >
              <span className={`text-[12px] font-sans ${isToday ? "font-bold" : ""}`} style={{ color: t.headText }}>
                {d.getDate()}
              </span>
              {events.length > 0 && (
                <span className="flex gap-0.5 mt-1" aria-hidden>
                  {events.slice(0, 3).map((e) => (
                    <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: THEME_COLOR[e.theme] }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {(Object.keys(THEME_COLOR) as CalendarEvent["theme"][]).map((th) => (
          <span key={th} className="inline-flex items-center gap-1.5 text-[10px] font-sans" style={{ color: t.mutedText }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: THEME_COLOR[th] }} aria-hidden />
            {th}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t" style={{ borderColor: t.gridLine }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: t.mutedText }}>
          {picked ? DAY.format(fromKey(picked)) : `${MONTH.format(month)} · ${inMonth.length + monthOnly.length} scheduled`}
        </p>
        {!held ? (
          <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
            The diary the site holds is {CALENDAR_YEAR}'s: no entries are held for {month.getFullYear()}.
          </p>
        ) : list.length === 0 && (picked || monthOnly.length === 0) ? (
          <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
            Nothing the site holds is scheduled {picked ? "that day" : "this month"}.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {[...list, ...(picked ? [] : monthOnly)].map((e) => (
              <li key={e.id} className="flex gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: THEME_COLOR[e.theme] }} aria-hidden />
                <div className="min-w-0">
                  <p className="text-[12px] font-sans font-semibold leading-snug" style={{ color: t.headText }}>
                    {e.name}
                  </p>
                  <p className="text-[10.5px] font-sans leading-snug" style={{ color: t.mutedText }}>
                    {when(e)} · {e.city}, {e.country} · {e.org} · {e.scope.toLowerCase()}, {e.theme.toLowerCase()}
                  </p>
                  <p className="text-[11px] font-sans leading-snug mt-0.5" style={{ color: t.bodyText }}>
                    {e.what}
                  </p>
                  <SourceLink sources={[e.source]} className="mt-1" />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] font-sans mt-3" style={{ color: t.mutedText }}>
          Each entry is taken from the convening body's own page, checked on {CALENDAR_CHECKED}; scheduled dates can move.
        </p>
      </div>
    </section>
  );
}

export function CalendarPopup() {
  const t = useTokens();
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="notes-fab fixed top-20 right-4 z-40 w-9 h-9 rounded-full flex items-center justify-center hover:scale-105" aria-label="Open the calendar" title="Calendar and quarter tracker">
        <CalendarBlank size={16} weight="fill" />
      </button>
    );

  return (
    <div
      role="dialog"
      aria-label="Calendar and quarter tracker"
      className={`fixed z-50 rounded-2xl shadow-2xl modal-glass border overflow-y-auto transition-all duration-300 ${wide ? "inset-4 top-20" : "top-20 right-4 w-[min(44rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)]"}`}
    >
      <div className="p-6">
        <div className="window-title">
          <div className="flex items-baseline gap-x-3 flex-wrap min-w-0 flex-1 py-1">
            <h2 className="text-xl font-bold font-sans text-foreground leading-tight inline-flex items-center gap-2">
              <CalendarBlank size={18} weight="fill" aria-hidden /> Calendar
            </h2>
            <span className="text-xs font-medium font-sans text-foreground/80">and the quarter tracker</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setWide((v) => !v)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label={wide ? "Collapse" : "Expand to full screen"} title={wide ? "Collapse" : "Expand to full screen"}>
              {wide ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
            <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close the calendar">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Full screen, the calendar takes the wide column and the quarter tracker the narrow one beside it, as asked. */}
        <div className={`grid gap-4 ${wide ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] items-start" : "grid-cols-1"}`}>
          <MonthCalendar wide={wide} />
          <QuarterTracker isLight={t.isLight} cardBg={t.cardBg} cardBorder={t.cardBorder} headText={t.headText} mutedText={t.mutedText} gridLine={t.gridLine} />
        </div>
      </div>
    </div>
  );
}
