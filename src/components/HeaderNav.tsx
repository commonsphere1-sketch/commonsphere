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
} from "@/contexts/ProfilePhotoContext";
import { useProfile } from "@/contexts/ProfileContext";
import { usStatesData } from "@/data/statesData";
import { countriesData } from "@/data/countriesData";
import { citiesData } from "@/data/citiesData";
import { economiesData } from "@/data/economiesData";
import { LIMITS } from "@/lib/security";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderNavProps {
  onMenuToggle: () => void;
  mobileSidebarOpen: boolean;
}

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: "State" | "Country" | "City" | "Economy";
  route: string;
}

const ROUTE_MAP: Record<string, string> = {
  State: "/dashboard/states",
  Country: "/dashboard/countries",
  City: "/dashboard/cities",
  Economy: "/dashboard/economies",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  State: <MapPin size={14} weight="fill" className="text-secondary shrink-0" />,
  Country: <Flag size={14} weight="fill" className="text-secondary shrink-0" />,
  City: (
    <Buildings size={14} weight="fill" className="text-secondary shrink-0" />
  ),
  Economy: (
    <ChartLine size={14} weight="fill" className="text-secondary shrink-0" />
  ),
};

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  usStatesData.forEach((s) =>
    results.push({
      id: `state-${s.id}`,
      label: s.name,
      sublabel: `${s.region} · ${s.capital}`,
      type: "State",
      route: ROUTE_MAP.State,
    }),
  );
  countriesData.forEach((c) =>
    results.push({
      id: `country-${c.id}`,
      label: c.name,
      sublabel: `${c.continent} · ${c.capital}`,
      type: "Country",
      route: ROUTE_MAP.Country,
    }),
  );
  citiesData.forEach((c) =>
    results.push({
      id: `city-${c.id}`,
      label: c.name,
      sublabel: `${c.country} · ${c.region}`,
      type: "City",
      route: ROUTE_MAP.City,
    }),
  );
  economiesData.forEach((e) =>
    results.push({
      id: `economy-${e.id}`,
      label: e.name,
      sublabel: `${e.entityType} · ${e.currencyCode}`,
      type: "Economy",
      route: ROUTE_MAP.Economy,
    }),
  );
  return results;
}

const SEARCH_INDEX = buildSearchIndex();

export function HeaderNav({ onMenuToggle, mobileSidebarOpen }: HeaderNavProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { photo, avatarColor } = useProfilePhoto();
  const { displayName: savedName } = useProfile();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
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
    const matches = SEARCH_INDEX.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel.toLowerCase().includes(q),
    ).slice(0, 8);
    setResults(matches);
    setOpen(matches.length > 0);
  }, [searchValue]);

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
    // Strip the leading "state-", "country-", "city-", "economy-" prefix to get the raw entity id
    const rawId = result.id.replace(/^(state|country|city|economy)-/, "");
    navigate(`${result.route}?open=${encodeURIComponent(rawId)}`);
    setSearchValue("");
    setOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border/40 flex items-center px-5 gap-5 header-bar"
      style={{
        background:
          "linear-gradient(180deg, rgba(5, 5, 12, 0.95) 0%, rgba(3, 3, 8, 0.92) 100%)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        boxShadow:
          "0 1px 0 rgba(255, 220, 120, 0.05), inset 0 -1px 0 rgba(255, 255, 255, 0.02), 0 4px 32px rgba(0,0,0,0.5)",
      }}
    >
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
            placeholder="Search states, countries, cities, economies…"
            value={searchValue}
            onChange={(e) =>
              setSearchValue(e.target.value.slice(0, LIMITS.SEARCH_QUERY))
            }
            onFocus={() => results.length > 0 && setOpen(true)}
            className="header-search-input pl-10 border text-foreground focus:ring-ring h-9 text-sm rounded-full transition-colors duration-150"
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
              className="absolute top-full mt-2 left-0 right-0 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in
                bg-card border border-border
                dark:bg-white/10 dark:border-white/15 dark:backdrop-blur-xl dark:shadow-2xl"
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
                  src={photo || (user as any)?.profilePictureUrl || ""}
                  alt="User avatar"
                />
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: avatarColor,
                    color: avatarTextColor(avatarColor),
                  }}
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
            <DropdownMenuItem
              className="cursor-pointer hover:bg-muted text-card-foreground"
              onClick={() => navigate("/dashboard/settings")}
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-muted text-destructive"
              onClick={() => {
                // Deliberately not awaited. The SDK's logout first waits for
                // its playground bridge (window.anima), polling for a full 5s
                // before rejecting when the app runs outside the playground —
                // so awaiting it leaves this item looking dead for five
                // seconds. Logout invalidates the user query on success, and
                // the header reads that reactively, so navigating first costs
                // nothing and keeps the click responsive either way.
                void logout().catch(() => {});
                navigate("/dashboard");
              }}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
