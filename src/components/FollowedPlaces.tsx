import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "@phosphor-icons/react";
import { useWatchlist, type WatchItem } from "@/contexts/WatchlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { lookup, type EntityType } from "@/lib/watchlist";
import { has } from "@/lib/na";
import { fmtArea, fmtGDP, fmtPop } from "@/lib/placeFormat";
import { usdFromBillions } from "@/lib/money";
import type { Country } from "@/data/countriesData";
import type { USState } from "@/data/statesData";

/**
 * The countries and states the reader follows, as cards: each with its key
 * published figures and anything that has changed in a data update since it
 * was last looked at. Following is the watch list (the account when signed
 * in, this browser otherwise), so the same places appear on the Countries and
 * States pages, in My Notes, in Settings and behind the bell in the header.
 *
 * Only published figures are shown; a card lists the first three a place has
 * rather than a dash for one it does not.
 */

const PAGE: Record<EntityType, string> = {
  country: "/dashboard/countries",
  state: "/dashboard/states",
};

function countryFigures(c: Country): [string, string][] {
  const out: [string, string][] = [];
  if (has(c.gdp)) out.push(["GDP", fmtGDP(c.gdp)]);
  if (has(c.population)) out.push(["Population", fmtPop(c.population)]);
  if (has(c.gdpGrowth)) out.push(["Growth", `${c.gdpGrowth > 0 ? "+" : ""}${Number(c.gdpGrowth.toFixed(2))}%`]);
  if (has(c.humanDevelopmentIndex)) out.push(["HDI", String(c.humanDevelopmentIndex)]);
  if (has(c.lifeExpectancy)) out.push(["Life expect.", `${c.lifeExpectancy} yrs`]);
  if (has(c.areaKm2)) out.push(["Area", fmtArea(c.areaKm2)]);
  return out.slice(0, 3);
}

function stateFigures(s: USState): [string, string][] {
  const out: [string, string][] = [];
  // As on the state cards.
  if (has(s.gdp)) out.push(["GDP", usdFromBillions(s.gdp)]);
  if (has(s.population)) out.push(["Population", fmtPop(s.population)]);
  if (has(s.unemploymentRate)) out.push(["Unemployment", `${s.unemploymentRate}%`]);
  if (has(s.medianIncome)) out.push(["Median income", `$${Math.round(s.medianIncome).toLocaleString()}`]);
  return out.slice(0, 3);
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
  const flag = country
    ? `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`
    : `https://flagcdn.com/w40/us-${item.id}.png`;
  const figures = country ? countryFigures(country) : stateFigures(state!);

  return (
    <div className="modal-tile rounded-xl p-3 w-56 shrink-0 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <img
          src={flag}
          alt=""
          className="w-7 h-5 rounded-[3px] object-cover border border-border shrink-0"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <button
          onClick={() => onOpen(item)}
          className="text-sm font-semibold font-sans text-foreground truncate text-left hover:underline flex-1 min-w-0"
        >
          {hit.name}
        </button>
        <button
          onClick={() => void watch.remove(item)}
          className="p-1 rounded text-amber-500 hover:text-amber-600 shrink-0"
          aria-label={`Unfollow ${hit.name}`}
          title="Unfollow"
        >
          <Star size={14} weight="fill" />
        </button>
      </div>
      {showType && (
        <p className="-mt-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
          {item.type === "country" ? (country?.territory ? "Territory" : "Country") : "US state"}
        </p>
      )}
      <div className="space-y-1">
        {figures.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-sans text-muted-foreground">{k}</span>
            <span className="text-xs font-mono font-semibold text-foreground">{v}</span>
          </div>
        ))}
        {state?.governor && (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-sans text-muted-foreground">Governor</span>
            <span className="text-xs font-sans font-semibold text-foreground truncate">{state.governor}</span>
          </div>
        )}
      </div>
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
            onClick={() => void watch.markSeen(item)}
            className="text-[10px] font-semibold text-secondary hover:underline"
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

export function FollowedPlaces({
  types,
  title,
  emptyText,
  onOpen,
  match,
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
  className?: string;
}) {
  const watch = useWatchlist();
  const { isConfigured, openAuth } = useAuth();
  const navigate = useNavigate();
  const all = watch.items.filter((i) => types.includes(i.type));
  const shown = match ? all.filter((i) => match(i.name)) : all;
  const headingId = `followed-${types.join("-")}`;
  const open = (item: WatchItem) =>
    onOpen ? onOpen(item.type, item.id) : navigate(`${PAGE[item.type]}?open=${encodeURIComponent(item.id)}`);

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
    </section>
  );
}
