import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MagnifyingGlass,
  Moon,
  Sun,
  List,
  X,
  MapPin,
  Flag,
  Buildings,
  ChartLine,
  Bell,
  TreeStructure,
  MapTrifold,
  SquaresFour,
} from "@phosphor-icons/react";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useProfilePhoto,
  avatarTextColor,
  GLASS_AVATAR,
} from "@/contexts/ProfilePhotoContext";
import { useProfile } from "@/contexts/ProfileContext";
import { usStatesData } from "@/data/statesData";
import { countriesData } from "@/data/countriesData";
import { citiesData } from "@/data/citiesData";
import { economiesData } from "@/data/economiesData";
import { LIMITS } from "@/lib/security";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/contexts/WatchlistContext";

interface HeaderNavProps {
  onMenuToggle: () => void;
  mobileSidebarOpen: boolean;
}

type SearchType = "Page" | "Country" | "State" | "City" | "Division" | "Economy" | "County";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: SearchType;
  /** Where choosing it goes: the page, with the thing itself opened on it. */
  to: string;
  /** The label and the line under it as they are compared: without accents or case. */
  key: string;
  subkey: string;
}

/** A name as it is compared: "Tōkyō" answers "tokyo". */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const entry = (r: Omit<SearchResult, "key" | "subkey">): SearchResult => ({ ...r, key: fold(r.label), subkey: fold(r.sublabel) });

/** Which kind comes first where two answer equally well. */
const TYPE_ORDER: Record<SearchType, number> = { Page: 0, Country: 1, State: 2, City: 3, Division: 4, Economy: 5, County: 6 };

const TYPE_ICON: Record<SearchType, React.ReactNode> = {
  Page: <SquaresFour size={14} weight="fill" className="text-secondary shrink-0" />,
  State: <MapPin size={14} weight="fill" className="text-secondary shrink-0" />,
  Country: <Flag size={14} weight="fill" className="text-secondary shrink-0" />,
  City: <Buildings size={14} weight="fill" className="text-secondary shrink-0" />,
  Division: <TreeStructure size={14} weight="fill" className="text-secondary shrink-0" />,
  Economy: <ChartLine size={14} weight="fill" className="text-secondary shrink-0" />,
  County: <MapTrifold size={14} weight="fill" className="text-secondary shrink-0" />,
};

/** The site's pages, by the names the side menu gives them. */
const PAGES: [label: string, to: string, about: string][] = [
  ["Dashboard", "/dashboard", "The site at a glance, and the map to any place"],
  ["US States", "/dashboard/states", "The fifty states"],
  ["Countries", "/dashboard/countries", "Every country and territory"],
  ["Municipalities", "/dashboard/subnations", "States, provinces, counties, districts and towns"],
  ["Cities", "/dashboard/cities", "Every city the United Nations counts"],
  ["Economies", "/dashboard/economies", "Economies, markets and sectors"],
  ["World Leaders", "/dashboard/world-leaders", "Heads of state and government"],
  ["Policy", "/dashboard/policy", "Policies, country by country"],
  ["Compare", "/dashboard/rankings", "Places side by side"],
  ["Trends", "/dashboard/trends", "Figures over time"],
  ["Worldview", "/dashboard/worldview", "The world's news and views"],
  ["Human Rights", "/dashboard/humanitarian", "Rights, liberties and humanitarian need"],
  ["Climate", "/dashboard/planetary-boundaries", "The measured state of the climate"],
  ["Crime Statistics", "/dashboard/crime", "Crime and justice figures"],
  ["World Maps", "/dashboard/maps", "The world, mapped by measure"],
];

/** What can be searched as soon as the page is up: the pages, the countries, the US states, the profiled cities and the economies. */
function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = PAGES.map(([label, to, about]) => entry({ id: `page-${to}`, label, sublabel: about, type: "Page", to }));
  countriesData.forEach((c) =>
    results.push(entry({ id: `country-${c.id}`, label: c.name, sublabel: `${c.continent} · ${c.capital}`, type: "Country", to: `/dashboard/countries?open=${encodeURIComponent(c.id)}` })),
  );
  usStatesData.forEach((s) =>
    results.push(entry({ id: `state-${s.id}`, label: s.name, sublabel: `${s.region} · ${s.capital}`, type: "State", to: `/dashboard/states?open=${encodeURIComponent(s.id)}` })),
  );
  citiesData.forEach((c) =>
    results.push(entry({ id: `city-${c.id}`, label: c.name, sublabel: `${c.country} · ${c.region}`, type: "City", to: `/dashboard/cities?open=${encodeURIComponent(c.id)}` })),
  );
  economiesData.forEach((e) =>
    results.push(entry({ id: `economy-${e.id}`, label: e.name, sublabel: `${e.entityType} · ${e.currencyCode}`, type: "Economy", to: `/dashboard/economies?open=${encodeURIComponent(e.id)}` })),
  );
  return results;
}

const SEARCH_INDEX = buildSearchIndex();

/**
 * The rest of what the site holds, fetched when the search is first used: every division of every country, every city
 * the United Nations counts and every US county - some twenty thousand names, too many to carry on every page. Once
 * they are in, the UN's cities stand for the few profiled ones, which they include. A town is found inside its
 * country's or its division's window on the Municipalities page, where its country's list is fetched.
 */
let MORE: Promise<SearchResult[]> | null = null;
const more = () =>
  (MORE ??= Promise.all([import("@/data/subnations"), import("@/data/unCities"), import("@/data/usCounties")])
    .then(([sub, un, us]) => {
      const country = new Map(countriesData.map((c) => [c.code, c.name]));
      const stateOf = new Map(usStatesData.map((s) => [s.abbreviation, s.name]));
      const people = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : Math.round(v).toLocaleString("en-US"));
      return [
        ...un.UN_CITIES.map((c) =>
          entry({ id: `un-${c[0]}-${c[1]}`, label: c[2], sublabel: `${country.get(c[0]) ?? c[0]} · ${people(c[8])} people, 2025 (UN)${c[5] ? " · capital" : ""}`, type: "City", to: `/dashboard/cities?open=un-${c[0]}-${c[1]}` }),
        ),
        // A US state is found as a state: its division's record is left out of the list, so that it is not there twice.
        ...sub.SUBNATIONS.filter((s) => !(s.cc === "US" && s.code && stateOf.has(s.code.slice(3)))).map((s) =>
          entry({
            id: `division-${s.id}`,
            label: s.name,
            sublabel: [s.kind || "Division", country.get(s.cc) ?? s.cc, s.capital ? `capital ${s.capital}` : ""].filter(Boolean).join(" · "),
            type: "Division",
            to: `/dashboard/subnations?open=${encodeURIComponent(s.id)}`,
          }),
        ),
        ...us.US_COUNTIES.map((x) => entry({ id: `county-${x[0]}`, label: x[1], sublabel: `County · ${stateOf.get(x[2]) ?? x[2]}`, type: "County", to: `/dashboard/subnations?open=county:${x[0]}` })),
      ];
    })
    .catch(() => {
      // Asked for again the next time, should it not have come.
      MORE = null;
      return [] as SearchResult[];
    }));

/** How well an entry answers: its name itself, its name's beginning, a word of its name, somewhere in its name, or only the line under it. */
function answers(r: SearchResult, q: string): number {
  if (r.key === q) return 0;
  if (r.key.startsWith(q)) return 1;
  const at = r.key.indexOf(q);
  if (at > 0) return /[\s(\-/]/.test(r.key[at - 1]) ? 2 : 3;
  return r.subkey.includes(q) ? 4 : -1;
}

export function HeaderNav({ onMenuToggle, mobileSidebarOpen }: HeaderNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isConfigured, openAuth } = useAuth();
  const { items: watched, changeCount } = useWatchlist();
  const { photo, avatarColor } = useProfilePhoto();
  const { displayName: savedName } = useProfile();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  /** The larger list, once it has been fetched. */
  const [extra, setExtra] = useState<SearchResult[] | null>(null);
  const wantMore = () => {
    if (!extra) more().then((list) => list.length && setExtra(list));
  };
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cap query length to prevent runaway string operations on large pastes
    const raw = searchValue.slice(0, LIMITS.SEARCH_QUERY);
    const q = raw.trim().toLowerCase();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (!extra) more().then((list) => list.length && setExtra(list));
    const key = fold(q);
    // With the larger list in, the UN's cities stand for the profiled few.
    const list = extra ? [...SEARCH_INDEX.filter((r) => r.type !== "City"), ...extra] : SEARCH_INDEX;
    const found: { r: SearchResult; score: number; at: number }[] = [];
    list.forEach((r, at) => {
      const score = answers(r, key);
      if (score >= 0) found.push({ r, score, at });
    });
    // The best answer first; among equals, the kind of thing, and then the list's own order - the cities are in it largest first.
    found.sort((a, b) => a.score - b.score || TYPE_ORDER[a.r.type] - TYPE_ORDER[b.r.type] || a.at - b.at);
    const matches = found.slice(0, 10).map((x) => x.r);
    setResults(matches);
    setOpen(matches.length > 0);
  }, [searchValue, extra]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.to);
    setSearchValue("");
    setOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border/40 flex items-center px-5 gap-5 header-bar"
      style={{
        boxShadow:
          "0 1px 0 rgba(255, 220, 120, 0.05), inset 0 -1px 0 rgba(255, 255, 255, 0.02), 0 4px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* The header's fill and blur live on this layer, not on <header>.
          An element with backdrop-filter becomes a backdrop root: anything
          inside it can only blur what lies within its own box. The search
          dropdown hangs below the 64px bar, so with the blur on <header> its
          own frosting sampled nothing and the page read straight through it.
          On a sibling layer the header looks the same and the dropdown can
          blur the page. */}
      <div
        aria-hidden
        className="header-bar-bg absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(7, 7, 7, 0.95) 0%, rgba(4, 4, 4, 0.92) 100%)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
        }}
      />
      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity duration-150"
        aria-label="CommonSphere Home"
      >
        {/* Logo mark — switches between light/dark globe.
            The box is already 32px, the same as the avatar on the right, but
            the source JPEGs carry their own padding: the globe measures
            450x451 inside a 614x610 frame, so it filled only 73.5% of the box
            and read as the smaller of the two.

            The artwork is also off-centre, so the largest scale that clips
            nothing is set by the tightest margin: 1.332 for the light file and
            1.304 for the dark one. 1.28 sits just under both. */}
        <div className="w-8 h-8 shrink-0 relative overflow-hidden">
          {/* Light mode: black-on-white globe */}
          <img
            src="https://c.animaapp.com/mnv7exnwOzX3vX/img/uploaded-asset-1776467236633-0.jpeg"
            alt="CommonSphere logo"
            className="logo-light absolute inset-0 w-full h-full object-contain scale-[1.28]"
          />
          {/* Dark mode: white-on-black globe */}
          <img
            src="https://c.animaapp.com/mnv7exnwOzX3vX/img/uploaded-asset-1776467236635-1.jpeg"
            alt="CommonSphere logo"
            className="logo-dark absolute inset-0 w-full h-full object-contain scale-[1.28]"
          />
        </div>
        {/* Wordmark */}
        <span
          className="header-logo-text text-primary-foreground hidden sm:block"
          style={{
            fontFamily:
              "'Playfair Display', 'Cormorant Garant', Georgia, serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Common<span style={{ color: "hsl(0, 0%, 75%)" }}>Sphere</span>
        </span>
      </Link>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div ref={wrapperRef} className="relative w-full max-w-xl">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="header-search-icon absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-white/60"
          />
          <Input
            type="search"
            placeholder="Search countries, states, cities, counties, pages…"
            value={searchValue}
            onChange={(e) =>
              setSearchValue(e.target.value.slice(0, LIMITS.SEARCH_QUERY))
            }
            onFocus={() => {
              // The larger list is asked for as the search is first reached, so that it is in by the time something is typed.
              wantMore();
              if (results.length > 0) setOpen(true);
            }}

            className="header-search-input pl-10 border text-foreground focus:ring-ring h-9 text-sm rounded-full transition-colors duration-150"
            role="combobox"
            aria-label="Global search"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue("");
                setOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
              aria-label="Clear search"
            >
              <X size={14} weight="bold" />
            </button>
          )}

          {open && (
            <div
              className="search-dropdown-glass absolute top-full mt-2 left-0 right-0 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in
                bg-card border border-border"
              role="listbox"
            >
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 group border-b border-border/40 last:border-b-0
                    hover:bg-secondary/10
                    dark:border-white/10 dark:hover:bg-white/10"
                  role="option"
                >
                  {TYPE_ICON[r.type]}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-sans font-medium text-foreground dark:text-white group-hover:text-secondary transition-colors duration-100 block truncate">
                      {r.label}
                    </span>
                    <span className="text-xs font-sans text-muted-foreground dark:text-white/70 block truncate">
                      {r.sublabel}
                    </span>
                  </div>
                  <span
                    className="text-xs font-mono shrink-0 px-1.5 py-0.5 rounded
                    text-foreground bg-muted border border-border
                    dark:text-white/90 dark:bg-white/15 dark:border-white/20"
                  >
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggleTheme}
          className="header-action-icon relative p-2 text-primary-foreground hover:text-secondary transition-colors duration-150 rounded-md"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <Sun size={22} weight="regular" />
          ) : (
            <Moon size={22} weight="regular" />
          )}
        </button>

        {/* Watch-list alerts: shown once something is watched, with the
            number of figures that changed since the reader last looked. */}
        {watched.length > 0 && (
          <button
            onClick={() => navigate("/dashboard/settings#alert-subscriptions")}
            className="header-action-icon relative p-2 text-primary-foreground hover:text-secondary transition-colors duration-150 rounded-md"
            aria-label={
              changeCount
                ? `${changeCount} change${changeCount === 1 ? "" : "s"} in places you watch`
                : "Watch list: no changes"
            }
            title={changeCount ? `${changeCount} new` : "Watch list"}
          >
            <Bell size={22} weight={changeCount ? "fill" : "regular"} />
            {changeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold leading-[18px] text-center">
                {changeCount > 99 ? "99+" : changeCount}
              </span>
            )}
          </button>
        )}

        {/* Signed out, on a site with accounts: a way in instead of a menu
            for an account that does not exist. While the stored session is
            still being read (user undefined) nothing shows, so the button
            does not flash for someone who is signed in. */}
        {isConfigured && user === null ? (
          <button
            onClick={() => openAuth("signin")}
            className="px-3.5 py-1.5 rounded-full text-sm font-sans font-medium bg-secondary text-secondary-foreground hover:bg-secondary/85 transition-colors"
          >
            Sign in
          </button>
        ) : isConfigured && user === undefined ? (
          <span className="w-8 h-8" aria-hidden />
        ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 p-1 rounded-md hover:bg-muted transition-colors duration-150 cursor-pointer"
              aria-label="User profile menu"
            >
              <span className="header-username text-primary-foreground text-sm font-normal hidden md:block">
                {savedName || user?.name || user?.email || "Account"}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={photo || ""}
                  alt="User avatar"
                />
                <AvatarFallback
                  className={`text-xs font-bold avatar-surface${
                    avatarColor === GLASS_AVATAR ? " avatar-glass" : ""
                  }`}
                  style={
                    avatarColor === GLASS_AVATAR
                      ? undefined
                      : {
                          background: avatarColor,
                          color: avatarTextColor(avatarColor),
                        }
                  }
                >
                  {(() => {
                    // Same precedence as the label above, so the initials never
                    // disagree with the name shown next to them.
                    const name = savedName || user?.name;
                    if (name) {
                      return name
                        .split(" ")
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                    }
                    return user?.email?.[0]?.toUpperCase() ?? "?";
                  })()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-card border-border text-card-foreground w-48"
          >
            {user?.email && (
              <>
                <p className="px-2 py-1.5 text-[11px] font-sans text-muted-foreground truncate">
                  {user.email}
                </p>
                <DropdownMenuSeparator className="bg-border" />
              </>
            )}
            <DropdownMenuItem
              className="cursor-pointer hover:bg-muted text-card-foreground"
              onClick={() => navigate("/dashboard/settings")}
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-muted text-card-foreground"
              onClick={() => navigate("/dashboard/notes")}
            >
              My Notes
            </DropdownMenuItem>
            {user && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-muted text-destructive"
                  onClick={() => {
                    void logout().catch(() => {});
                    navigate("/dashboard");
                  }}
                >
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* Mobile hamburger */}
        <button
          className="header-action-icon md:hidden p-2 text-primary-foreground hover:text-secondary transition-colors duration-150 rounded-md"
          onClick={onMenuToggle}
          aria-label={
            mobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          {mobileSidebarOpen ? (
            <X size={24} weight="bold" />
          ) : (
            <List size={24} weight="bold" />
          )}
        </button>
      </div>
    </header>
  );
}
