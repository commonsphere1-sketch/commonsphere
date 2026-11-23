import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CaretDown, CaretLeft, CaretRight, CaretUp, Star } from "@phosphor-icons/react";
import { useWatchlist, type WatchItem } from "@/contexts/WatchlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { lookup, type EntityType } from "@/lib/watchlist";
import { has } from "@/lib/na";
import { fmtArea, fmtGDP, fmtPop } from "@/lib/placeFormat";
import { usdFromBillions } from "@/lib/money";
import type { Country } from "@/data/countriesData";
import type { USState } from "@/data/statesData";
import { TONE } from "@/lib/chipTone";
import { useLiveStatus } from "@/lib/liveFigures";

/**
 * The countries and states the reader follows, as cards: each with its key
 * published figures and anything that has changed in a data update since it
 * was last looked at. Following is the watch list (the account when signed
 * in, this browser otherwise), so the same places appear on the Countries and
 * States pages, in My Notes, in Settings and behind the bell in the header.
 *
 * Only published figures are shown: a card lists the first six a place has
 * rather than a dash for one it does not. The whole card opens the place.
 */

const PAGE: Record<EntityType, string> = {
  country: "/dashboard/countries",
  state: "/dashboard/states",
};

const PARTY: Record<USState["party"], { tone: string; short: string }> = {
  Democrat: { tone: TONE.blue, short: "D" },
  Republican: { tone: TONE.red, short: "R" },
  Independent: { tone: TONE.violet, short: "I" },
};

const pct = (v: number, signed = false) => `${signed && v > 0 ? "+" : ""}${Number(v.toFixed(2))}%`;

/** A followed place's flag: the country's, or the state's. */
function flagFor(item: WatchItem): string | null {
  const hit = lookup(item.type, item.id);
  if (!hit) return null;
  return item.type === "country"
    ? `https://flagcdn.com/w40/${(hit.record as Country).code.toLowerCase()}.png`
    : `https://flagcdn.com/w40/us-${item.id}.png`;
}

function countryFigures(c: Country): [string, string][] {
  const out: [string, string][] = [];
  if (has(c.gdp)) out.push(["GDP", fmtGDP(c.gdp)]);
  if (has(c.population)) out.push(["Population", fmtPop(c.population)]);
  if (has(c.gdpGrowth)) out.push(["GDP growth", pct(c.gdpGrowth, true)]);
  if (has(c.gdpPerCapita)) out.push(["GDP per capita", `$${Math.round(c.gdpPerCapita).toLocaleString()}`]);
  if (has(c.unemploymentRate)) out.push(["Unemployment", pct(c.unemploymentRate)]);
  if (has(c.inflationRate)) out.push(["Inflation", pct(c.inflationRate)]);
  if (has(c.lifeExpectancy)) out.push(["Life expect.", `${c.lifeExpectancy} yrs`]);
  if (has(c.humanDevelopmentIndex)) out.push(["HDI", String(c.humanDevelopmentIndex)]);
  if (has(c.areaKm2)) out.push(["Area", fmtArea(c.areaKm2)]);
  return out.slice(0, 6);
}

function stateFigures(s: USState): [string, string][] {
  const out: [string, string][] = [];
  // As on the state cards and pop-up.
  if (has(s.gdp)) out.push(["GDP", usdFromBillions(s.gdp)]);
  if (has(s.population)) out.push(["Population", fmtPop(s.population)]);
  if (has(s.unemploymentRate)) out.push(["Unemployment", pct(s.unemploymentRate)]);
  if (has(s.medianIncome)) out.push(["Median income", `$${Math.round(s.medianIncome).toLocaleString()}`]);
  if (has(s.medianAge)) out.push(["Median age", `${s.medianAge} yrs`]);
  if (has(s.minimumWage)) out.push(["Min. wage", s.minimumWage <= 7.25 ? "$7.25" : `$${s.minimumWage.toFixed(2)}`]);
  if (has(s.salesTaxRate)) out.push(["Sales tax", pct(s.salesTaxRate)]);
  return out.slice(0, 6);
}

function FollowedCard({
  item,
  showType,
  onOpen,
}: {
  item: WatchItem;
  showType: boolean;
  onOpen: (item: WatchItem) => void;
}) {
  const watch = useWatchlist();
  const hit = lookup(item.type, item.id);
  if (!hit) return null;
  const country = item.type === "country" ? (hit.record as Country) : null;
  const state = item.type === "state" ? (hit.record as USState) : null;
  const flag = flagFor(item) ?? "";
  const figures = country ? countryFigures(country) : stateFigures(state!);
  const kind = country ? (country.territory ? "Territory" : "Country") : "US state";
  const where = country
    ? [country.capital && !/^None/.test(country.capital) ? country.capital : "", country.continent]
    : [state!.capital, `${state!.region} region`];
  const leader = country
    ? country.headOfState && !/^None/.test(country.headOfState)
      ? { label: "Leader", name: country.headOfState }
      : null
    : state!.governor
      ? { label: "Governor", name: state!.governor, party: PARTY[state!.party] }
      : null;

  return (
    <div className="group relative modal-tile rounded-xl p-3 w-64 shrink-0 flex flex-col gap-2.5 transition-colors hover:bg-muted/40 hover:border-secondary/40 focus-within:ring-2 focus-within:ring-ring">
      {/* The whole card opens the place: one button stretched over it. The
          star and "Mark as seen" sit above it with their own clicks, so no
          button is inside another. */}
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="absolute inset-0 rounded-xl cursor-pointer focus:outline-none"
        aria-label={`Open ${hit.name}`}
      />
      <div className="flex items-start gap-2">
        <img
          src={flag}
          alt=""
          className="mt-0.5 w-7 h-5 rounded-[3px] object-cover border border-border shrink-0"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-sans text-foreground truncate group-hover:underline">{hit.name}</p>
          <p className="text-[10px] font-sans text-muted-foreground truncate">
            {[showType ? kind : "", ...where].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void watch.remove(item)}
          className="relative z-10 p-1 rounded text-amber-500 hover:text-amber-600 shrink-0 cursor-pointer"
          aria-label={`Unfollow ${hit.name}`}
          title="Unfollow"
        >
          <Star size={14} weight="fill" />
        </button>
      </div>

      {figures.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {figures.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] font-sans text-muted-foreground truncate">{k}</dt>
              <dd className="text-xs font-mono font-semibold text-foreground truncate">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {leader && (
        <div className="flex items-center gap-2 min-w-0 pt-2 border-t border-border/60">
          <span className="text-[10px] font-sans text-muted-foreground shrink-0">{leader.label}</span>
          <span className="text-xs font-sans font-semibold text-foreground truncate flex-1 min-w-0" title={leader.name}>
            {leader.name}
          </span>
          {"party" in leader && leader.party && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans shrink-0 ${leader.party.tone}`}>
              {leader.party.short}
            </span>
          )}
        </div>
      )}

      {item.changes.length > 0 ? (
        <div className="rounded-lg border border-secondary/30 px-2 py-1.5 space-y-0.5">
          {item.changes.slice(0, 2).map((ch) => (
            <p key={ch.key} className="text-[10px] font-sans text-foreground leading-snug">
              <span className="text-muted-foreground">{ch.label}:</span> {ch.from} → <b>{ch.to}</b>
            </p>
          ))}
          {item.changes.length > 2 && (
            <p className="text-[10px] font-sans text-muted-foreground">+{item.changes.length - 2} more</p>
          )}
          <button
            type="button"
            onClick={() => void watch.markSeen(item)}
            className="relative z-10 text-[10px] font-semibold text-secondary hover:underline cursor-pointer"
          >
            Mark as seen
          </button>
        </div>
      ) : (
        <p className="text-[10px] font-sans text-muted-foreground">No changes since you last looked</p>
      )}
    </div>
  );
}

const DOCK_KEY = "cs-followed-dock-open";

/**
 * The places followed, on a bar at the foot of the screen, as asked: folded to a small pill - the count, the flags,
 * how many have changed - until the reader chooses to revisit them; opened, the cards stand in one row that scrolls
 * sideways (the wheel, the arrows or a drag of the bar). It keeps clear of the side menu, whatever its width, and of
 * the notes button in the corner. Open or folded is remembered in this browser.
 */
function FollowedDock({
  headingId,
  title,
  items,
  saved,
  checked,
  children,
}: {
  headingId: string;
  title: string;
  items: WatchItem[];
  saved: ReactNode;
  checked: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(DOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const show = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(DOCK_KEY, v ? "1" : "0");
    } catch {
      /* not kept: the bar still opens and folds */
    }
  };
  const row = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  useEffect(() => {
    const el = row.current;
    if (!open || !el) return;
    const measure = () =>
      setEdge({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    // The wheel turned over the row scrolls it sideways, until it reaches an end.
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    el.addEventListener("wheel", wheel, { passive: false });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      el.removeEventListener("wheel", wheel);
      ro.disconnect();
    };
  }, [open, items.length]);

  const step = (dir: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: dir * Math.max(272, el.clientWidth * 0.8), behavior: "smooth" });
  };
  const updated = items.filter((i) => i.changes.length > 0).length;
  // Within the page beside the side menu (its width is --side, set by the layout); clear of the notes button at right.
  const place = "fixed bottom-0 left-0 right-0 md:left-[var(--side,3.5rem)] z-30 pointer-events-none transition-[left] duration-300";

  if (!open)
    return (
      <div className={`${place} flex justify-center px-16 pb-4`}>
        <button
          type="button"
          onClick={() => show(true)}
          aria-expanded={false}
          aria-label={`Show the ${title.toLowerCase()}: ${items.length}`}
          className="pointer-events-auto modal-glass border rounded-full shadow-lg pl-3 pr-2.5 py-1.5 flex items-center gap-2 min-w-0 max-w-full hover:border-secondary/40 transition-colors cursor-pointer"
        >
          <Star size={12} weight="fill" className="text-amber-500 shrink-0" />
          <span className="text-[10px] font-bold font-sans uppercase tracking-widest text-foreground truncate">{title}</span>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{items.length}</span>
          <span className="hidden sm:flex items-center -space-x-1 shrink-0" aria-hidden>
            {items.slice(0, 6).map((i) => {
              const f = flagFor(i);
              return f ? (
                <img key={i.key} src={f} alt="" className="w-5 h-3.5 rounded-[2px] object-cover border border-border" />
              ) : null;
            })}
          </span>
          {updated > 0 && (
            <span className="text-[10px] font-sans text-secondary shrink-0">{updated} updated</span>
          )}
          <CaretUp size={11} weight="bold" className="text-muted-foreground shrink-0" />
        </button>
      </div>
    );

  return (
    <section aria-labelledby={headingId} className={`${place} pl-3 sm:pl-4 pr-16 pb-3`}>
      <div className="pointer-events-auto modal-glass border rounded-2xl shadow-2xl p-3 animate-fade-in">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
          <h2
            id={headingId}
            className="flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-widest text-foreground"
          >
            <Star size={13} weight="fill" className="text-amber-500" />
            {title}
            <span className="text-[10px] font-mono font-normal normal-case tracking-normal text-muted-foreground">
              {items.length}
            </span>
          </h2>
          <p className="text-[10px] font-sans text-muted-foreground min-w-0">
            {saved}
            {checked && <> · figures checked against their sources twice a day, last {checked}</>}
          </p>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={!edge.left}
              aria-label="Scroll back"
              className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default cursor-pointer"
            >
              <CaretLeft size={13} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={!edge.right}
              aria-label="Scroll on"
              className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default cursor-pointer"
            >
              <CaretRight size={13} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => show(false)}
              aria-expanded
              aria-label={`Fold the ${title.toLowerCase()} away`}
              title="Fold away"
              className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <CaretDown size={13} weight="bold" />
            </button>
          </div>
        </div>
        <div ref={row} className="flex gap-3 overflow-x-auto pb-1">
          {children}
        </div>
      </div>
    </section>
  );
}

export function FollowedPlaces({
  types,
  title,
  emptyText,
  onOpen,
  match,
  dock = false,
  className = "mb-6",
}: {
  /** Which kinds of place to show. */
  types: EntityType[];
  title: string;
  /** What to say when nothing of these kinds is followed. */
  emptyText: ReactNode;
  /** Open a place in this page's pop-up; by default, go to its page with the pop-up open. */
  onOpen?: (type: EntityType, id: string) => void;
  /** Optional name filter, for a page with its own search box. */
  match?: (name: string) => boolean;
  /** On a bar at the foot of the screen, folded until opened, in place of a card in the page; nothing while none is followed. */
  dock?: boolean;
  className?: string;
}) {
  const watch = useWatchlist();
  const { isConfigured, openAuth } = useAuth();
  const navigate = useNavigate();
  const { lastChecked } = useLiveStatus();
  const all = watch.items.filter((i) => types.includes(i.type));
  const shown = match ? all.filter((i) => match(i.name)) : all;
  const headingId = `followed-${types.join("-")}`;
  const open = (item: WatchItem) =>
    onOpen ? onOpen(item.type, item.id) : navigate(`${PAGE[item.type]}?open=${encodeURIComponent(item.id)}`);

  if (dock) {
    if (shown.length === 0) return null;
    return (
      <FollowedDock
        headingId={headingId}
        title={title}
        items={shown}
        saved={
          watch.mode === "account" ? (
            "Saved to your account"
          ) : isConfigured ? (
            <>
              Saved in this browser ·{" "}
              <button onClick={() => openAuth("signin")} className="underline hover:text-foreground">
                sign in
              </button>{" "}
              to keep them on every device
            </>
          ) : (
            "Saved in this browser"
          )
        }
        checked={
          lastChecked
            ? lastChecked.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : null
        }
      >
        {shown.map((item) => (
          <FollowedCard key={item.key} item={item} showType={types.length > 1} onOpen={open} />
        ))}
      </FollowedDock>
    );
  }

  return (
    <section aria-labelledby={headingId} className={`bg-card border border-border rounded-2xl p-4 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-widest text-foreground"
        >
          <Star size={13} weight="fill" className="text-amber-500" />
          {title}
          {all.length > 0 && (
            <span className="text-[10px] font-mono font-normal normal-case tracking-normal text-muted-foreground">
              {all.length}
            </span>
          )}
        </h2>
        <p className="text-[11px] font-sans text-muted-foreground">
          {watch.mode === "account" ? (
            "Saved to your account"
          ) : isConfigured ? (
            <>
              Saved in this browser ·{" "}
              <button onClick={() => openAuth("signin")} className="underline hover:text-foreground">
                sign in
              </button>{" "}
              to keep them on every device
            </>
          ) : (
            "Saved in this browser"
          )}
        </p>
      </div>
      {all.length === 0 ? (
        <p className="text-xs font-sans text-muted-foreground leading-relaxed">{emptyText}</p>
      ) : shown.length === 0 ? (
        <p className="text-xs font-sans text-muted-foreground">None of the places you follow match your search.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {shown.map((item) => (
            <FollowedCard key={item.key} item={item} showType={types.length > 1} onOpen={open} />
          ))}
        </div>
      )}
      {all.length > 0 && lastChecked && (
        <p className="mt-2 text-[10px] font-sans text-muted-foreground">
          Figures are checked against their sources twice a day - last checked{" "}
          {lastChecked.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
        </p>
      )}
    </section>
  );
}
