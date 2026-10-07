/**
 * The data explorer: countries, the world's economies, and policy news, each
 * as a list beside a detail pane. The Dashboard has countries and economies
 * as tabs, and with them the explorers the Economies and Trends pages have -
 * industries, resources and trends - each loaded when its tab is first
 * opened; the Countries, Economies and Policy pages each have their own alone
 * (`only`), with no tabs. Policies was a tab of the Dashboard's too; Industries
 * stands there now, as asked, and the Policy page keeps the policy explorer.
 *
 * Every figure is sourced. Countries come from the site's country data; the
 * world, its regions and the European Union from the World Bank's and the
 * IMF's own aggregates (worldview.ts, built by build-worldview.cjs, with no
 * projections); policy from the live headlines of national politics desks
 * and US statehouse coverage, counted by the words in them. Nothing here is
 * typed in by hand.
 *
 * A policy headline's detail goes further than its link (PolicyContext):
 * where the headline came from, the published figures for the place it is
 * about, and the week's other policy headlines about that place - the same
 * on the Dashboard's Policies tab as on the Policy page. It is loaded when a
 * headline's detail is first shown, so neither carries its data before then.
 *
 * A country's detail is its headline figures, each with its year; where it
 * stands among the site's places and in the world's totals; and then its
 * record in full (PolicyContext's CountryRecord): its people, health,
 * schooling and public services, trade, energy, technology, work, defence,
 * rights, what its government spends, and the blocs it belongs to. A
 * region's detail adds the World Bank's own figures for the region beside
 * the world's (RegionFigures). Both are loaded when first shown. A rank or a
 * share is the only thing worked out, each from published figures, and the
 * pane says what from.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ArrowSquareOut, ChartBar, ChartLine, Factory, Globe, Heart, MagnifyingGlass, MapPin, Scales, Tree, Users, X } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { useLiveCountries } from "../contexts/LiveDataContext";
import type { Country, DataSource, ReferenceField } from "../data/countriesData";
import { IMF_INFLATION, INCOME_GROUPS, INCOME_OF, INCOME_SOURCE, REGIONS, REGION_OF, WORLD, type WorldPoint } from "../data/worldview";
import { has, na, sortKey } from "../lib/na";
import { usdFromBillions } from "../lib/money";
import { SourceLink } from "./SourceLink";
import { hdiHex } from "../lib/hdiTier";
import { ago, placeName, useHeadlines, type Headline } from "./HeadlinesBanner";
import type { TopicHit } from "./PolicyContext";
import { RESOURCES } from "../data/resourceList";
import { INDUSTRY_FIGURES, TREND_FIGURES } from "../data/trendGroups";

/** A policy headline's fuller detail, with the data it draws on: loaded when one is first shown. */
const PolicyContext = lazy(() => import("./PolicyContext"));
/** A country's record in full, from the same file and so with the same data: loaded when a country's detail is first shown. */
const CountryRecord = lazy(() => import("./PolicyContext").then((m) => ({ default: m.CountryRecord })));
/** A region's World Bank figures beside the world's, with the series they are read from. */
const RegionFigures = lazy(() => import("./RegionFigures"));
/** Every topic a country's record has figures for, in the order a country's detail gives them. */
const RECORD_TOPICS = ["Trade", "Energy", "Climate", "Tech", "Jobs & pay", "Defence"];
/** The explorers of the Economies page's resources and of the Trends page, each with its data: loaded when its tab is opened. */
const ResourcesTab = lazy(() => import("./ResourceExplorerTab"));
const TrendsTab = lazy(() => import("../pages/TrendsPage").then((m) => ({ default: m.TrendsExplorer })));
/** The industries explorer: the same page's world series, set out by industry. */
const IndustriesTab = lazy(() => import("../pages/TrendsPage").then((m) => ({ default: m.IndustriesExplorer })));

export type ExplorerTab = "countries" | "economies" | "policies";
/** The Dashboard's tabs: countries and economies, and the three explorers that come from other pages. */
type Tab = ExplorerTab | "industries" | "resources" | "trends";
type TabDef = { id: Tab; label: string; color: string; path: string; Icon: typeof Globe };

const TABS: TabDef[] = [
  { id: "countries", label: "Countries", color: "#6366f1", path: "/dashboard/countries", Icon: Globe },
  { id: "economies", label: "Economies", color: "#f59e0b", path: "/dashboard/economies", Icon: ChartBar },
  { id: "industries", label: "Industries", color: "#06b6d4", path: "/dashboard/trends", Icon: Factory },
  { id: "resources", label: "Resources", color: "#059669", path: "/dashboard/economies?view=resources", Icon: Tree },
  { id: "trends", label: "Trends", color: "#0ea5e9", path: "/dashboard/trends", Icon: ChartLine },
];
/** The policy explorer: the Policy page's alone (`only`). It was the Dashboard's third tab, where Industries stands now. */
const POLICY_TAB: TabDef = { id: "policies", label: "Policies", color: "#a855f7", path: "/dashboard/policy", Icon: Scales };

/**
 * Policy topics, matched on a headline's own words. "Labour" is left out of
 * jobs and pay because it is also the name of a party.
 */
const POLICY_TOPICS: { label: string; color: string; re: RegExp }[] = [
  { label: "Climate", color: "#10b981", re: /\b(climate|emissions?|carbon|net[- ]zero|greenhouse|pollution|environment(al)?|COP\d+)\b/i },
  { label: "Trade", color: "#3b82f6", re: /\b(trade|tariffs?|exports?|imports?|customs|sanctions?|WTO)\b/i },
  { label: "Defence", color: "#ef4444", re: /\b(defen[cs]e|military|armed forces|troops|NATO|weapons?|missiles?|arms)\b/i },
  { label: "Tech", color: "#6366f1", re: /\b(tech|technology|AI|artificial intelligence|digital|cyber|chips?|semiconductors?|social media|online safety)\b/i },
  { label: "Energy", color: "#f59e0b", re: /\b(energy|oil|gas|electricity|power (plants?|grid)|nuclear|renewables?|solar|wind farms?|fuel)\b/i },
  { label: "Jobs & pay", color: "#a855f7", re: /\b(workers?|wages?|jobs|employment|unemployment|unions?|strikes?|minimum wage|pensions?)\b/i },
];

/** How many of the week's policy headlines are read, newest first. */
const POLICY_READ = 300;

/** The site's card colours, as the Dashboard sets them, for light and dark. */
export function useTokens() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return {
    isLight,
    cardBg: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
    cardBorder: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
    cardShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
    mutedText: isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.38)",
    bodyText: isLight ? "#1e293b" : "#e2e8f0",
    headText: isLight ? "#0f172a" : "#f1f0ff",
    gridLine: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    tile: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
    tooltipBg: isLight ? "#ffffff" : "#1a1730",
  };
}
export type Tokens = ReturnType<typeof useTokens>;

const lastOf = (s: WorldPoint[]) => s[s.length - 1];
const trillions = (usd: number) => `$${(usd / 1e12).toFixed(usd >= 1e13 ? 1 : 2)}T`;
const signed = (v: number, dp = 1) => `${v > 0 ? "+" : ""}${v.toFixed(dp)}`;
/** A country's GDP, which the site holds in billions of dollars. */
const gdpShort = (b: number) => (b >= 1000 ? `$${(b / 1000).toFixed(1)}T` : b >= 1 ? `$${Math.round(b)}B` : `$${Math.round(b * 1000)}M`);
const flagOf = (c: Country) => (c as Country & { flag?: string }).flag ?? c.code;
const GREEN = "#10b981";
const RED = "#ef4444";

export function DataExplorer({
  only,
  onOpenCountry,
}: {
  /** Show this category alone, without the tabs. */
  only?: ExplorerTab;
  /** Opens a country's full profile where the explorer is; without it the pane's button goes to the Countries page and opens it there. */
  onOpenCountry?: (c: Country) => void;
}) {
  const t = useTokens();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [picked, setTab] = useState<Tab>("countries");
  const tab: Tab = only ?? picked;
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  // Countries, largest economy first.
  const live = useLiveCountries();
  const byGdp = useMemo(() => [...live].sort((a, b) => sortKey(b.gdp, "desc") - sortKey(a.gdp, "desc")), [live]);
  const [countryId, setCountryId] = useState<string | null>(null);
  const countries = useMemo(
    () => byGdp.filter((c) => !q || c.name.toLowerCase().includes(q) || c.continent.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 30),
    [byGdp, q],
  );
  const country = (countryId ? byGdp.find((c) => c.id === countryId) : null) ?? countries[0] ?? null;

  // The World Bank's regions and the EU, largest first.
  const regions = useMemo(() => [...REGIONS].sort((a, b) => lastOf(b.gdp)[1] - lastOf(a.gdp)[1]), []);
  const [regionId, setRegionId] = useState<string | null>(null);
  const regionList = regions.filter((r) => !q || r.name.toLowerCase().includes(q));
  const region = (regionId ? regions.find((r) => r.id === regionId) : null) ?? regionList[0] ?? null;

  // The last week's headlines from the policy desks, by topic: the newest POLICY_READ of them at most.
  // Read only where the explorer is the Policy page's: the Dashboard's has no policy tab.
  const headlines = useHeadlines(["policy"], 7, POLICY_READ, false, undefined, only === "policies");
  const capped = headlines.length >= POLICY_READ;
  const [topic, setTopic] = useState<string | null>(null);
  const topicRe = POLICY_TOPICS.find((p) => p.label === topic)?.re;
  const policies = headlines
    .filter((h) => !topicRe || topicRe.test(h.title))
    .filter((h) => !q || h.title.toLowerCase().includes(q) || h.outlet.toLowerCase().includes(q) || h.places.some((p) => placeName(p)?.toLowerCase().includes(q)))
    .slice(0, 60);
  const [policyUrl, setPolicyUrl] = useState<string | null>(null);
  // A headline opened from the detail pane - another about the same place - may not be in the list.
  const [opened, setOpened] = useState<Headline | null>(null);
  const policy = (policyUrl ? (policies.find((h) => h.url === policyUrl) ?? (opened?.url === policyUrl ? opened : null)) : null) ?? policies[0] ?? null;

  // Narrowing the list lets go of it, as it does of a headline picked from the list.
  useEffect(() => setOpened(null), [topic, q]);

  // A new headline in the detail pane starts at its top.
  const detailRef = useRef<HTMLDivElement | null>(null);
  const shownUrl = tab === "policies" ? (policy?.url ?? null) : null;
  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }, [shownUrl]);

  const cur = tab === "policies" ? POLICY_TAB : TABS.find((x) => x.id === tab)!;
  const badge: Record<Tab, string> = {
    countries: `${byGdp.length}`,
    economies: `${regions.length}`,
    policies: `${headlines.length}${capped ? "+" : ""}`,
    industries: `${INDUSTRY_FIGURES}`,
    resources: `${RESOURCES.length}`,
    trends: `${TREND_FIGURES}`,
  };
  /* The link at the foot of a tab that is another page's explorer: to that page. */
  const toPage = { label: "View all", onClick: () => navigate(cur.path) };
  const footer =
    tab === "countries"
      ? `${countries.length} of ${byGdp.length} countries`
      : tab === "economies"
        ? `${regionList.length} regions and blocs`
        : `${policies.length} of the ${capped ? `newest ${headlines.length}` : headlines.length} policy headlines from the last week`;

  return (
    /* Capped and centred up to 1280px. From there the explorer takes the page's
       width and the window's height, the list keeps a column of its own and
       the detail sets its parts side by side (index.css, "The explorers on a
       wide window"): what stretched across the page was one column, not this. */
    <div className="explorer flex flex-col rounded-2xl overflow-hidden w-full max-w-6xl mx-auto" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      {/* One category alone is headed by its name; all three are tabs. */}
      {only ? (
        <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: t.gridLine, color: cur.color }}>
          <cur.Icon size={12} weight="fill" aria-hidden />
          <h2 className="text-[11px] font-bold font-sans">{cur.label}</h2>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: cur.color + "15" }}>
            {badge[cur.id]}
          </span>
        </div>
      ) : (
        <div role="tablist" aria-label="Data explorer" className="flex items-center overflow-x-auto border-b" style={{ borderColor: t.gridLine }}>
          {TABS.map((x) => {
            const on = tab === x.id;
            return (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setTab(x.id);
                  setSearch("");
                  setTopic(null);
                }}
                className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold font-sans transition-colors relative shrink-0 cursor-pointer"
                style={{
                  color: on ? x.color : t.mutedText,
                  background: on ? t.tile : "transparent",
                  borderBottom: `2px solid ${on ? x.color : "transparent"}`,
                  marginBottom: -1,
                }}
              >
                <x.Icon size={12} weight="fill" style={{ color: x.color }} aria-hidden />
                {x.label}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: x.color + "15", color: x.color }}>
                  {badge[x.id]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "industries" || tab === "resources" || tab === "trends" ? (
        // Another page's explorer, in this card: it brings its own search, list, detail and footer.
        <Suspense fallback={<Empty t={t}>Loading…</Empty>}>
          {tab === "resources" ? <ResourcesTab action={toPage} /> : tab === "industries" ? <IndustriesTab embedded action={toPage} /> : <TrendsTab embedded action={toPage} />}
        </Suspense>
      ) : (
        <>
      {/* Search */}
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: t.gridLine }}>
        <MagnifyingGlass size={13} style={{ color: t.mutedText }} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={tab === "countries" ? "Search countries" : tab === "economies" ? "Search regions" : "Search policy headlines"}
          placeholder={tab === "countries" ? "Search countries, continents…" : tab === "economies" ? "Search regions…" : "Search policy headlines, outlets, places…"}
          className="flex-1 bg-transparent text-[11px] font-sans outline-none border-none"
          style={{ color: t.bodyText }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear the search" className="cursor-pointer" style={{ color: t.mutedText }}>
            <X size={11} weight="bold" />
          </button>
        )}
      </div>

      {/* List beside detail; stacked on a phone */}
      <div className="explorer-panes flex flex-col md:flex-row md:h-[520px]">
        <div
          className="explorer-list flex flex-col overflow-y-auto max-h-[320px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r"
          style={{ borderColor: t.gridLine }}
        >
          {tab === "countries" && <CountryList t={t} countries={countries} selected={country} onPick={(c) => setCountryId(c.id)} searching={!!q} />}
          {tab === "economies" && <EconomyList t={t} regions={regionList} selected={region} onPick={(id) => setRegionId(id)} />}
          {tab === "policies" && (
            <PolicyList
              t={t}
              headlines={headlines}
              policies={policies}
              selected={policy}
              onPick={(h) => setPolicyUrl(h.url)}
              topic={topic}
              onTopic={(label) => setTopic((cur) => (cur === label ? null : label))}
            />
          )}
        </div>
        <div ref={detailRef} className="explorer-detail flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {tab === "countries" && country && <CountryDetail key={country.id} t={t} c={country} all={byGdp} onOpen={onOpenCountry} />}
          {tab === "economies" && region && <RegionDetail key={region.id} t={t} region={region} byGdp={byGdp} onExplorer={pathname === TABS[1].path ? null : () => navigate(TABS[1].path)} />}
          {tab === "policies" &&
            (policy ? (
              <PolicyDetail
                t={t}
                h={policy}
                onHub={pathname === POLICY_TAB.path ? null : () => navigate(POLICY_TAB.path)}
                more={{
                  headlines,
                  onOpen: (h) => {
                    setOpened(h);
                    setPolicyUrl(h.url);
                  },
                  onTopic: (label) => {
                    setSearch("");
                    setTopic(label);
                  },
                  onOutlet: (outlet) => {
                    setTopic(null);
                    setSearch(outlet);
                  },
                }}
              />
            ) : (
              <Empty t={t}>No policy headlines to show.</Empty>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t flex items-center justify-between gap-3" style={{ borderColor: t.gridLine }}>
        <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {footer}
        </span>
        {pathname !== cur.path && (
          <button
            type="button"
            onClick={() => navigate(cur.path)}
            className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70 cursor-pointer shrink-0"
            style={{ color: cur.color }}
          >
            View all <ArrowRight size={10} weight="bold" />
          </button>
        )}
      </div>
        </>
      )}
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

export function Label({ t, children, className = "" }: { t: Tokens; children: ReactNode; className?: string }) {
  return (
    <p className={`text-[9px] font-mono uppercase tracking-widest ${className}`} style={{ color: t.mutedText }}>
      {children}
    </p>
  );
}

/** A part of a detail pane that stays together. On a wide window the pane sets its parts side by side, in columns. */
export function Block({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`flex flex-col gap-3 min-w-0 ${className}`}>{children}</section>;
}

export function Empty({ t, children }: { t: Tokens; children: ReactNode }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
        {children}
      </p>
    </div>
  );
}

export function Kpi({ t, label, value, color, sub }: { t: Tokens; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
      <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
        {label}
      </p>
      <p className="text-sm font-bold font-mono" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-[9px] font-mono" style={{ color: t.mutedText }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Row({ t, selected, color, onClick, children }: { t: Tokens; selected: boolean; color: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:opacity-90 cursor-pointer"
      style={{ borderBottom: `1px solid ${t.gridLine}`, background: selected ? color + (t.isLight ? "12" : "1f") : "transparent" }}
    >
      {children}
      <ArrowRight size={10} weight="bold" style={{ color: selected ? color : t.mutedText, flexShrink: 0 }} aria-hidden />
    </button>
  );
}

export function GoButton({ color, onClick, children }: { color: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold transition-opacity hover:opacity-80 cursor-pointer"
      style={{ background: color + "18", color, border: `1px solid ${color}25` }}
    >
      {children} <ArrowRight size={11} weight="bold" />
    </button>
  );
}

/** A row of a pane's short table: what it is, and the figure. */
function FactRow({ t, label, value, sub }: { t: Tokens; label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
      <span className="text-[10px] font-mono shrink-0" style={{ color: t.mutedText }}>
        {label}
      </span>
      <span className="text-[11px] font-sans font-semibold text-right min-w-0" style={{ color: t.headText }}>
        {value}
        {sub && (
          <span className="font-mono font-normal text-[10px]" style={{ color: t.mutedText }}>
            {" "}
            · {sub}
          </span>
        )}
      </span>
    </div>
  );
}

/** The year a cited figure is for: the end of its source's label. */
const yearOf = (src: DataSource | undefined) => /, (\d{4})$/.exec(src?.label ?? "")?.[1];
/** Sources without repeats, in the order given. */
const distinct = (list: (DataSource | undefined)[]) => [...new Map(list.filter((x): x is DataSource => !!x).map((x) => [x.label, x])).values()];
/** "the United States", "Japan". */
const the = (name: string) => (/^(United |Netherlands$|Philippines$|Bahamas$|Gambia$|Maldives$)/.test(name) ? `the ${name}` : name);
const ordinal = (n: number) => {
  const v = n % 100;
  return `${n}${v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
};
/** A share of a world total: tenths of a percent, and "under 0.1%" below that. */
const shareText = (pct: number) => (pct < 0.1 ? "under 0.1%" : `${pct.toFixed(1)}%`);

export function tooltipStyle(t: Tokens) {
  return {
    contentStyle: { background: t.tooltipBg, border: `1px solid ${t.gridLine}`, borderRadius: 8, fontSize: 10, fontFamily: "monospace", color: t.headText },
    labelStyle: { color: t.mutedText },
  };
}

// ── Countries ───────────────────────────────────────────────────────────────

function CountryList({ t, countries, selected, onPick, searching }: { t: Tokens; countries: Country[]; selected: Country | null; onPick: (c: Country) => void; searching: boolean }) {
  const world = WORLD.gdp.series.slice(-10).map(([year, v]) => ({ year: String(year), gdp: Number((v / 1e12).toFixed(1)) }));
  return (
    <>
      <div className="px-4 pt-3 pb-1">
        <Label t={t} className="mb-1.5">
          World GDP · current US$ · World Bank
        </Label>
        <ResponsiveContainer width="100%" height={52}>
          <AreaChart data={world} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="explorerWorldGdp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle(t)} formatter={(v: number) => [`$${v}T`, "World GDP"]} />
            <Area type="monotone" dataKey="gdp" stroke="#6366f1" fill="url(#explorerWorldGdp)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
        <SourceLink sources={WORLD.gdp.source} className="mt-1" />
      </div>
      <div className="px-4 pt-2 pb-1">
        <Label t={t}>{searching ? `${countries.length} results` : "Largest economies"}</Label>
      </div>
      {countries.map((c) => (
        <Row key={c.id} t={t} selected={selected?.id === c.id} color="#6366f1" onClick={() => onPick(c)}>
          <span className="text-base w-6 shrink-0">{flagOf(c)}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
              {c.name}
            </span>
            <span className="block text-[10px] font-mono" style={{ color: t.mutedText }}>
              {c.continent}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[11px] font-mono font-bold" style={{ color: t.headText }}>
              {na(c.gdp, gdpShort)}
            </span>
            <span className="block text-[10px] font-mono" style={{ color: has(c.gdpGrowth) ? (c.gdpGrowth >= 0 ? GREEN : RED) : t.mutedText }}>
              {na(c.gdpGrowth, (v) => `${signed(v)}%`)}
            </span>
          </span>
        </Row>
      ))}
      {countries.length === 0 && <Empty t={t}>No countries match the search.</Empty>}
    </>
  );
}

type Ranked = "gdp" | "population" | "gdpPerCapita";

/** Where a country stands among the places with a published figure, largest first. */
function rankOf(all: Country[], c: Country, f: Ranked) {
  if (!has(c[f])) return null;
  const withFigure = all.filter((x) => has(x[f]));
  return { rank: withFigure.filter((x) => x[f] > c[f]).length + 1, of: withFigure.length };
}

function CountryDetail({ t, c, all, onOpen }: { t: Tokens; c: Country; all: Country[]; onOpen?: (c: Country) => void }) {
  const up = c.gdpGrowth >= 0;
  const pop = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}K`);
  const src = (f: ReferenceField) => c.sources?.[f];
  const yr = (f: ReferenceField) => yearOf(src(f));

  // Where it stands: its rank among the site's places, and its share of the World Bank's world total for the same year.
  const ranks = { gdp: rankOf(all, c, "gdp"), population: rankOf(all, c, "population"), gdpPerCapita: rankOf(all, c, "gdpPerCapita") };
  const shareOf = (f: "gdp" | "population", value: number, series: WorldPoint[]) => {
    // Only a World Bank figure is set beside the Bank's world total, and only for the same year.
    const y = yr(f);
    const world = y && /^World Bank/.test(src(f)?.label ?? "") ? series.find(([year]) => String(year) === y)?.[1] : undefined;
    return world && has(c[f]) ? { pct: (100 * value) / world, year: y! } : null;
  };
  const gdpShare = shareOf("gdp", c.gdp * 1e9, WORLD.gdp.series);
  const popShare = shareOf("population", c.population, WORLD.population.series);
  const region = REGIONS.find((r) => r.id === REGION_OF[c.code]);
  const income = INCOME_GROUPS.find((g) => g.id === INCOME_OF[c.code]);
  const standing = ranks.gdp || ranks.population || ranks.gdpPerCapita || region || income;

  const sectorYear = yr("keyIndustries");
  const first = c.trends?.[0];
  const last = c.trends?.[c.trends.length - 1];

  // The site's own composite, shown only when all four of its figures are published.
  const score =
    has(c.humanDevelopmentIndex) && has(c.gdpGrowth) && has(c.inflationRate) && has(c.unemploymentRate)
      ? {
          hdi: c.humanDevelopmentIndex * 40,
          growth: Math.min(20, Math.max(0, (c.gdpGrowth + 2) * 4)),
          inflation: Math.max(0, 20 - c.inflationRate * 2),
          jobs: Math.max(0, 20 - c.unemploymentRate * 2),
        }
      : null;
  const total = score ? Math.round(score.hdi + score.growth + score.inflation + score.jobs) : 0;
  const scoreColor = total >= 75 ? GREEN : total >= 50 ? "#f59e0b" : RED;
  return (
    <>
      <Block>
      <div className="rounded-xl overflow-hidden relative shrink-0" style={{ height: 96, background: "linear-gradient(135deg,#1e2040 0%,#0f1535 100%)" }}>
        <img
          src={`https://flagcdn.com/w320/${c.code.toLowerCase()}.png`}
          alt={`Flag of ${c.name}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.65) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 py-2">
          <div>
            <p className="font-bold font-sans text-[13px] leading-tight text-white drop-shadow">{c.name}</p>
            <p className="font-mono text-[9px] drop-shadow" style={{ color: "rgba(255,255,255,0.75)" }}>
              {c.continent} · {c.governmentType}
            </p>
          </div>
          {has(c.gdpGrowth) && (
            <span
              className="font-mono font-bold text-[9px] rounded-full px-2 py-0.5"
              style={{ background: up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)", color: up ? "#6ee7b7" : "#fca5a5", border: `1px solid ${up ? "#10b98155" : "#ef444455"}` }}
            >
              GDP {signed(c.gdpGrowth)}%{yr("gdpGrowth") ? ` · ${yr("gdpGrowth")}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Each figure with the year it is for. */}
      <div className="grid grid-cols-3 gap-1.5">
        <Kpi t={t} label="GDP" value={na(c.gdp, gdpShort)} sub={yr("gdp")} color="#6366f1" />
        <Kpi t={t} label="Real growth" value={na(c.gdpGrowth, (v) => `${signed(v)}%`)} sub={yr("gdpGrowth")} color={up ? GREEN : RED} />
        <Kpi t={t} label="GDP per person" value={na(c.gdpPerCapita, (v) => `$${Math.round(v).toLocaleString("en-US")}`)} sub={yr("gdpPerCapita")} color="#3b82f6" />
        <Kpi t={t} label="Inflation" value={na(c.inflationRate, (v) => `${v}%`)} sub={yr("inflationRate")} color="#f59e0b" />
        <Kpi t={t} label="Unemployment" value={na(c.unemploymentRate, (v) => `${v.toFixed(1)}%`)} sub={yr("unemploymentRate")} color="#0d9488" />
        <Kpi
          t={t}
          label="HDI"
          value={na(c.humanDevelopmentIndex, (v) => v.toFixed(3))}
          sub={yr("humanDevelopmentIndex")}
          color={hdiHex(c.humanDevelopmentIndex)}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "Population", value: na(c.population, pop), year: yr("population"), icon: <Users size={10} weight="fill" />, color: "#06b6d4" },
          { label: "Life expectancy", value: na(c.lifeExpectancy, (v) => `${v} yrs`), year: yr("lifeExpectancy"), icon: <Heart size={10} weight="fill" />, color: "#ec4899" },
          {
            label: "Trade balance",
            value: has(c.tradeBalance) ? usdFromBillions(c.tradeBalance, true) : "—",
            year: yr("tradeBalance"),
            icon: <Scales size={10} weight="fill" />,
            color: !has(c.tradeBalance) ? t.mutedText : c.tradeBalance >= 0 ? GREEN : RED,
          },
          {
            label: "Area",
            value: na(c.areaKm2, (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M km²` : `${Math.round(v).toLocaleString("en-US")} km²`)),
            year: undefined,
            icon: <MapPin size={10} weight="fill" />,
            color: "#a855f7",
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg px-2.5 py-2 flex items-center gap-2" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
            <span style={{ color: m.color }}>{m.icon}</span>
            <div className="min-w-0">
              <p className="text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                {m.label}
                {m.year && m.value !== "—" ? ` · ${m.year}` : ""}
              </p>
              <p className="text-[12px] font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      <SourceLink sources={distinct([src("gdp"), src("gdpGrowth"), src("gdpPerCapita"), src("inflationRate"), src("unemploymentRate"), src("humanDevelopmentIndex"), src("population"), src("lifeExpectancy"), src("tradeBalance")])} />
      </Block>

      {standing && (
        <Block>
          <Label t={t}>Where it stands</Label>
          <div className="flex flex-col">
            {ranks.gdp && <FactRow t={t} label="Size of its economy" value={`${ordinal(ranks.gdp.rank)} of ${ranks.gdp.of}`} sub={gdpShare ? `${shareText(gdpShare.pct)} of world GDP, ${gdpShare.year}` : undefined} />}
            {ranks.population && (
              <FactRow t={t} label="Population" value={`${ordinal(ranks.population.rank)} of ${ranks.population.of}`} sub={popShare ? `${shareText(popShare.pct)} of the world's people, ${popShare.year}` : undefined} />
            )}
            {ranks.gdpPerCapita && <FactRow t={t} label="GDP per person" value={`${ordinal(ranks.gdpPerCapita.rank)} of ${ranks.gdpPerCapita.of}`} />}
            {region && <FactRow t={t} label="World Bank region" value={region.name} sub={`${region.members.length} economies`} />}
            {income && <FactRow t={t} label="Income group" value={income.label} sub={`one of ${income.economies}`} />}
          </div>
          <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
            A rank is among the places on the site with a published figure, each for its own latest year. A share sets the World Bank's figure for{" "}
            {the(c.name)} beside the Bank's world total for the same year.
          </p>
          <SourceLink sources={distinct([WORLD.gdp.source, ...(income ? [INCOME_SOURCE] : [])])} />
        </Block>
      )}

      {c.trends && c.trends.length > 1 && first && last && (
        <Block>
          <Label t={t}>
            GDP · current US$ · {first.year}–{last.year}
          </Label>
          <div role="img" aria-label={`GDP of ${c.name}, ${first.year} to ${last.year}: ${gdpShort(first.gdp)} to ${gdpShort(last.gdp)}.`}>
            <ResponsiveContainer width="100%" height={84}>
              <AreaChart data={c.trends} margin={{ top: 4, right: 2, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id={`explorerCountry-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.gridLine} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v === 0 ? "$0" : v >= 1000 ? `$${Number((v / 1000).toFixed(1))}T` : gdpShort(v))}
                />
                <Tooltip {...tooltipStyle(t)} formatter={(v: number) => [gdpShort(v), "GDP"]} />
                <Area type="monotone" dataKey="gdp" stroke="#6366f1" fill={`url(#explorerCountry-${c.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1">
            {[first, last].map((p, i) => (
              <span key={p.year} className="rounded-md px-1.5 py-0.5 text-[10px] font-mono" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
                <span style={{ color: t.mutedText }}>{i === 0 ? "Began" : "Latest"}</span> <span style={{ color: t.headText }}>{gdpShort(p.gdp)}</span> <span style={{ color: t.mutedText }}>· {p.year}</span>
              </span>
            ))}
          </div>
        </Block>
      )}

      {c.keyIndustries && c.keyIndustries.length > 0 && (
        <Block>
          <Label t={t}>What its economy is made of · share of GDP{sectorYear ? ` · ${sectorYear}` : ""}</Label>
          <div className="flex flex-col gap-1.5">
            {c.keyIndustries.slice(0, 5).map((ind) => (
              <div key={ind.name} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ind.color }} />
                <span className="text-[10px] font-sans truncate flex-1" style={{ color: t.headText }}>
                  {ind.name}
                </span>
                <span className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }}>
                  <span className="block h-full rounded-full" style={{ width: `${ind.gdpShare}%`, background: ind.color }} />
                </span>
                <span className="text-[10px] font-mono w-9 text-right shrink-0" style={{ color: t.headText }}>
                  {ind.gdpShare}%
                </span>
              </div>
            ))}
          </div>
          <SourceLink sources={distinct([src("keyIndustries")])} />
        </Block>
      )}

      <Block>
      <div style={{ borderTop: `1px solid ${t.gridLine}` }} />
      <Label t={t}>Political &amp; social</Label>
      <div className="flex flex-col gap-1.5">
        {[
          { label: "Government", value: c.governmentType },
          { label: "Head of state", value: c.headOfState },
          { label: "Capital", value: c.capital },
          { label: "Continent", value: c.continent },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-1" style={{ borderBottom: `1px solid ${t.gridLine}` }}>
            <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
              {row.label}
            </span>
            <span className="text-[11px] font-sans font-semibold text-right max-w-[60%] truncate" style={{ color: t.headText }} title={row.value}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      </Block>

      {score && (
        <section className="rounded-xl px-3 py-3 min-w-0" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
          <div className="flex items-center justify-between mb-1">
            <Label t={t}>Macro health score</Label>
            <span className="text-[13px] font-bold font-mono" style={{ color: scoreColor }}>
              {total}/100
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${total}%`, background: `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})` }} />
          </div>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[
              { label: "HDI", v: score.hdi, max: 40, color: "#a855f7" },
              { label: "Growth", v: score.growth, max: 20, color: GREEN },
              { label: "Inflation", v: score.inflation, max: 20, color: "#f59e0b" },
              { label: "Jobs", v: score.jobs, max: 20, color: "#3b82f6" },
            ].map((x) => (
              <div key={x.label} className="text-center">
                <p className="text-[10px] font-bold font-mono" style={{ color: x.color }}>
                  {Math.round(x.v)}/{x.max}
                </p>
                <p className="text-[8px] font-mono" style={{ color: t.mutedText }}>
                  {x.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
            CommonSphere's own composite of the published figures above, not an official index: the HDI counts for 40 points, and growth,
            inflation and unemployment for 20 each.
          </p>
        </section>
      )}

      {/* The record in full: the same sections the Policies tab gives a headline's place, for every topic. */}
      <Suspense
        fallback={
          <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            Loading the record…
          </p>
        }
      >
        <CountryRecord t={t} c={c} topics={RECORD_TOPICS} accent="#6366f1" full onProfile={onOpen ? () => onOpen(c) : undefined} />
      </Suspense>
    </>
  );
}

// ── Economies ───────────────────────────────────────────────────────────────

type Region = (typeof REGIONS)[number];

type Change = { text: string; good: boolean | null };

/** The world's headline figures, each for its series' latest year, with its change on the reading before. */
function worldTiles() {
  const tile = (id: string, label: string, value: (v: number) => string, change: (now: number, before: WorldPoint) => Change) => {
    const s = WORLD[id].series;
    const [y, v] = s[s.length - 1];
    const before = s[s.length - 2];
    return { label, value: value(v), sub: `${y}`, change: before ? change(v, before) : null, source: WORLD[id].source };
  };
  // A share's change in points; better or worse only where one way plainly is.
  const points =
    (upIsGood: boolean | null) =>
    (now: number, [y, before]: WorldPoint): Change => ({
      text: `${signed(now - before)} pts on ${y}`,
      good: upIsGood === null || Math.abs(now - before) < 0.05 ? null : now > before === upIsGood,
    });
  const [gy, g] = lastOf(WORLD.gdpGrowth.series);
  return [
    tile("gdp", "World GDP", trillions, () => ({ text: `${signed(g)}% real growth in ${gy}`, good: g >= 0 })),
    tile("trade", "Trade", (v) => `${v.toFixed(1)}% of GDP`, points(null)),
    tile("fdi", "Foreign direct investment", (v) => `${v.toFixed(2)}% of GDP`, points(null)),
    tile("govDebt", "Government debt", (v) => `${v.toFixed(1)}% of GDP`, points(false)),
  ];
}

function EconomyList({ t, regions, selected, onPick }: { t: Tokens; regions: Region[]; selected: Region | null; onPick: (id: string) => void }) {
  const tiles = worldTiles();
  const years = [...new Set([...IMF_INFLATION.world, ...IMF_INFLATION.advanced, ...IMF_INFLATION.emerging].map(([y]) => y))].sort((a, b) => a - b);
  const at = (s: WorldPoint[], y: number) => s.find(([x]) => x === y)?.[1] ?? null;
  const inflation = years.map((y) => ({ year: String(y), world: at(IMF_INFLATION.world, y), advanced: at(IMF_INFLATION.advanced, y), emerging: at(IMF_INFLATION.emerging, y) }));
  const lines = [
    { key: "world", label: "World", color: "#f59e0b" },
    { key: "advanced", label: "Advanced economies", color: "#3b82f6" },
    { key: "emerging", label: "Emerging & developing", color: "#ec4899" },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-4 pb-2">
        {tiles.map((m) => (
          <div key={m.label} className="rounded-xl px-3 py-2.5" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
            <p className="text-[9px] font-sans" style={{ color: t.mutedText }}>
              {m.label} · {m.sub}
            </p>
            <p className="text-base font-bold font-mono" style={{ color: t.headText }}>
              {m.value}
            </p>
            {m.change && (
              <p className="text-[10px] font-mono" style={{ color: m.change.good === null ? t.mutedText : m.change.good ? GREEN : RED }}>
                {m.change.text}
              </p>
            )}
          </div>
        ))}
      </div>
      <SourceLink sources={tiles.map((m) => m.source)} className="px-4 mb-2" />
      <div className="px-4 pb-1 pt-1">
        <Label t={t}>Regions and blocs · GDP and real growth</Label>
      </div>
      {regions.map((r) => {
        const [gy, gdp] = lastOf(r.gdp);
        const [, g] = lastOf(r.growth);
        return (
          <Row key={r.id} t={t} selected={selected?.id === r.id} color="#f59e0b" onClick={() => onPick(r.id)}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g >= 0 ? GREEN : RED }} aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold font-sans truncate" style={{ color: t.headText }}>
                {r.name}
              </span>
              <span className="block text-[9px] font-mono" style={{ color: t.mutedText }}>
                {r.kind === "bloc" ? "Bloc" : "Region"} · {gy}
              </span>
            </span>
            <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
              {trillions(gdp)}
            </span>
            <span className="text-[11px] font-mono shrink-0 w-12 text-right" style={{ color: g >= 0 ? GREEN : RED }}>
              {signed(g)}%
            </span>
          </Row>
        );
      })}
      {regions.length === 0 && <Empty t={t}>No regions match the search.</Empty>}
      <div className="px-4 pt-4 pb-3">
        <Label t={t} className="mb-2">
          Consumer-price inflation · % a year · IMF
        </Label>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={inflation} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip {...tooltipStyle(t)} formatter={(v: number, n: string) => [`${v}%`, lines.find((l) => l.key === n)?.label ?? n]} />
            {lines.map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
          {lines.map((l) => (
            <span key={l.key} className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[9px] font-mono" style={{ color: t.mutedText }}>
                {l.label}
              </span>
            </span>
          ))}
        </div>
        <SourceLink sources={IMF_INFLATION.source} className="mt-1" />
      </div>
    </>
  );
}

function RegionDetail({ t, region: r, byGdp, onExplorer }: { t: Tokens; region: Region; byGdp: Country[]; onExplorer: (() => void) | null }) {
  const [gy, gdp] = lastOf(r.gdp);
  const [firstYear, firstGdp] = r.gdp[0];
  const [growthYear, growth] = lastOf(r.growth);
  const worldAt = (y: number) => WORLD.gdp.series.find(([year]) => year === y)?.[1];
  const worldThen = worldAt(gy);
  // Its GDP as a share of the world's, for each year both are published.
  const share = r.gdp.flatMap(([year, v]) => {
    const w = worldAt(year);
    return w ? [{ year: String(year), share: Number(((100 * v) / w).toFixed(2)) }] : [];
  });
  const best = r.growth.reduce((a, b) => (b[1] > a[1] ? b : a));
  const worst = r.growth.reduce((a, b) => (b[1] < a[1] ? b : a));
  const growthBars = r.growth.map(([year, g]) => ({ year: String(year), g }));
  const trend = r.gdp.map(([year, v]) => ({ year: String(year), gdp: Number((v / 1e12).toFixed(2)) }));

  // Its members, as the site holds them: largest first, and those growing fastest and slowest.
  const members = new Set(r.members);
  const mine = byGdp.filter((c) => members.has(c.code));
  const [showAll, setShowAll] = useState(false);
  const listed = showAll ? mine : mine.slice(0, 8);
  // Set side by side only where the growth is for the same year as the region's: a member's latest may be older.
  const growing = mine.filter((c) => has(c.gdpGrowth) && yearOf(c.sources?.gdpGrowth) === String(growthYear)).sort((a, b) => b.gdpGrowth - a.gdpGrowth);
  const ends = growing.length >= 6 ? { fastest: growing.slice(0, 3), slowest: growing.slice(-3).reverse() } : null;
  // How many of its members the World Bank puts in each income group.
  const groups = INCOME_GROUPS.map((g) => ({ label: g.label, n: r.members.filter((code) => INCOME_OF[code] === g.id).length })).filter((g) => g.n > 0);
  const unclassified = r.members.length - groups.reduce((n, g) => n + g.n, 0);
  const memberRow = (c: Country, i: number, n: number) => (
    <div key={c.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < n - 1 ? `1px solid ${t.gridLine}` : "none" }}>
      <span className="text-sm w-6">{flagOf(c)}</span>
      <span className="flex-1 text-[11px] font-sans font-semibold truncate" style={{ color: t.headText }}>
        {c.name}
      </span>
      <span className="text-[11px] font-mono shrink-0" style={{ color: t.headText }}>
        {na(c.gdp, gdpShort)}
      </span>
      <span className="text-[10px] font-mono shrink-0 w-12 text-right" style={{ color: has(c.gdpGrowth) ? (c.gdpGrowth >= 0 ? GREEN : RED) : t.mutedText }}>
        {na(c.gdpGrowth, (v) => `${signed(v)}%`)}
      </span>
    </div>
  );
  const axis = { tick: { fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false };
  return (
    <>
      <Block>
      <div>
        <p className="text-sm font-bold font-sans" style={{ color: t.headText }}>
          {r.name}
        </p>
        <p className="text-[10px] font-mono" style={{ color: t.mutedText }}>
          {r.kind === "bloc" ? `Bloc · ${r.members.length} members` : `World Bank region · ${r.members.length} economies`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Kpi t={t} label="GDP" value={trillions(gdp)} sub={`${gy} · current US$`} color="#f59e0b" />
        <Kpi t={t} label="Real growth" value={`${signed(growth)}%`} sub={`${growthYear}`} color={growth >= 0 ? GREEN : RED} />
        <Kpi t={t} label="Share of world GDP" value={worldThen ? `${((100 * gdp) / worldThen).toFixed(1)}%` : "—"} sub={`${gy}`} color="#6366f1" />
        <Kpi t={t} label={`GDP on ${firstYear}`} value={`${signed((100 * (gdp - firstGdp)) / firstGdp, 0)}%`} sub={`${trillions(firstGdp)} then · current US$`} color={t.headText} />
        <Kpi t={t} label="Strongest year" value={`${signed(best[1])}%`} sub={`${best[0]} · real growth`} color={t.headText} />
        <Kpi t={t} label="Weakest year" value={`${signed(worst[1])}%`} sub={`${worst[0]} · real growth`} color={t.headText} />
      </div>
      </Block>

      <Block>
      <Label t={t}>
        GDP · current US$ trillions · {firstYear}–{gy}
      </Label>
      <div role="img" aria-label={`GDP of ${r.name}, ${firstYear} to ${gy}: ${trillions(firstGdp)} to ${trillions(gdp)}.`}>
        <ResponsiveContainer width="100%" height={84}>
          <AreaChart data={trend} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={`explorerRegion-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.gridLine} vertical={false} />
            <XAxis dataKey="year" {...axis} />
            <YAxis {...axis} tickFormatter={(v: number) => `$${v}T`} />
            <Tooltip {...tooltipStyle(t)} formatter={(v: number) => [`$${v}T`, "GDP"]} />
            <Area type="monotone" dataKey="gdp" stroke="#f59e0b" fill={`url(#explorerRegion-${r.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </Block>

      <Block>
      <Label t={t}>
        Real growth · % a year · {r.growth[0][0]}–{growthYear}
      </Label>
      <div role="img" aria-label={`Real growth of ${r.name}, year by year: ${r.growth.map(([y, g]) => `${y} ${signed(g)}%`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height={92}>
          <BarChart data={growthBars} margin={{ top: 12, right: 2, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={t.gridLine} vertical={false} />
            <XAxis dataKey="year" {...axis} />
            <YAxis {...axis} tickFormatter={(v: number) => `${v}%`} />
            <ReferenceLine y={0} stroke={t.mutedText} strokeWidth={1} />
            <Tooltip {...tooltipStyle(t)} cursor={{ fill: t.tile }} formatter={(v: number) => [`${signed(v)}%`, "Real growth"]} />
            <Bar dataKey="g" radius={[2, 2, 0, 0]} maxBarSize={22} isAnimationActive={false}>
              {growthBars.map((b) => (
                <Cell key={b.year} fill={b.g >= 0 ? GREEN : RED} />
              ))}
              <LabelList dataKey="g" position="top" formatter={(v: number) => signed(v)} style={{ fontSize: 8, fontFamily: "monospace", fill: t.mutedText }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </Block>

      <Block>
      {share.length > 2 && (
        <>
          <Label t={t}>
            Share of world GDP · % · {share[0].year}–{share[share.length - 1].year}
          </Label>
          <div role="img" aria-label={`${r.name}'s share of world GDP, ${share[0].year} to ${share[share.length - 1].year}: ${share[0].share.toFixed(1)}% to ${share[share.length - 1].share.toFixed(1)}%.`}>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={share} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={t.gridLine} vertical={false} />
                <XAxis dataKey="year" {...axis} />
                <YAxis {...axis} tickFormatter={(v: number) => `${Number(v.toFixed(1))}%`} domain={["auto", "auto"]} />
                <Tooltip {...tooltipStyle(t)} formatter={(v: number) => [`${v.toFixed(1)}%`, "Of world GDP"]} />
                <Line type="monotone" dataKey="share" stroke="#6366f1" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
            Its GDP over the world's, each year, both in current US dollars from the World Bank: {share[0].share.toFixed(1)}% in {share[0].year},{" "}
            {share[share.length - 1].share.toFixed(1)}% in {share[share.length - 1].year}.
          </p>
        </>
      )}
      <SourceLink sources={distinct([r.source, WORLD.gdp.source])} />
      </Block>

      {mine.length > 0 && (
        <Block>
          <Label t={t}>
            {r.kind === "bloc" ? "Its members" : "Its economies"} · GDP and real growth · {showAll ? `all ${mine.length}` : `largest ${listed.length} of ${mine.length}`}
          </Label>
          <div>{listed.map((c, i) => memberRow(c, i, listed.length))}</div>
          {mine.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="self-start text-[10px] font-sans font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}
            >
              {showAll ? "Show the largest 8" : `Show all ${mine.length}`}
            </button>
          )}
          {ends && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: `Growing fastest · ${growthYear}`, list: ends.fastest },
                { title: `Growing slowest · ${growthYear}`, list: ends.slowest },
              ].map((x) => (
                <div key={x.title} className="min-w-0">
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: t.mutedText }}>
                    {x.title}
                  </p>
                  {x.list.map((c) => (
                    <p key={c.id} className="flex items-baseline justify-between gap-2 text-[10px] font-sans py-0.5">
                      <span className="truncate font-semibold" style={{ color: t.headText }}>
                        {c.name}
                      </span>
                      <span className="font-mono shrink-0" style={{ color: c.gdpGrowth >= 0 ? GREEN : RED }}>
                        {signed(c.gdpGrowth)}%
                      </span>
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
          {groups.length > 0 && (
            <>
              <p className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                By the World Bank's income groups:{" "}
                {groups.map((g, i) => (
                  <span key={g.label}>
                    {i > 0 && " · "}
                    <span className="font-mono font-bold" style={{ color: t.headText }}>
                      {g.n}
                    </span>{" "}
                    {g.label.toLowerCase()}
                  </span>
                ))}
                {unclassified > 0 && ` · ${unclassified} not classified`}. In the list, each member's GDP and growth are for its own latest published year
                {ends ? `; the fastest and slowest are of the ${growing.length} with a figure for ${growthYear}` : ""}.
              </p>
              <SourceLink sources={INCOME_SOURCE} />
            </>
          )}
        </Block>
      )}

      <Suspense
        fallback={
          <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            Loading the region's figures…
          </p>
        }
      >
        <RegionFigures t={t} code={r.id} name={r.name} />
      </Suspense>

      {onExplorer && (
        <GoButton color="#f59e0b" onClick={onExplorer}>
          Economies explorer
        </GoButton>
      )}
    </>
  );
}

// ── Policies ────────────────────────────────────────────────────────────────

const placesOf = (h: Headline) => h.places.map(placeName).filter((n): n is string => !!n);

function PolicyList({
  t,
  headlines,
  policies,
  selected,
  onPick,
  topic,
  onTopic,
}: {
  t: Tokens;
  headlines: Headline[];
  policies: Headline[];
  selected: Headline | null;
  onPick: (h: Headline) => void;
  topic: string | null;
  onTopic: (label: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 p-4 pb-2">
        {POLICY_TOPICS.map((p) => {
          const n = headlines.filter((h) => p.re.test(h.title)).length;
          const on = topic === p.label;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onTopic(p.label)}
              aria-pressed={on}
              className="rounded-xl px-2 py-2 text-center transition-opacity hover:opacity-80 cursor-pointer"
              style={{ background: p.color + (on ? "26" : "10"), border: `1px solid ${p.color}${on ? "66" : "20"}` }}
            >
              <span className="block text-sm font-bold font-mono" style={{ color: p.color }}>
                {n}
              </span>
              <span className="block text-[9px] font-sans" style={{ color: t.mutedText }}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="px-4 pb-2 text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
        The newest {headlines.length} headlines of the last week, counted by the words in them; pick a topic to see only its headlines.
      </p>
      <div className="px-4 pb-1">
        <Label t={t}>{topic ? `${topic} · ${policies.length}` : "Latest policy headlines"}</Label>
      </div>
      {policies.map((h) => {
        const places = placesOf(h);
        return (
          <button
            key={h.url}
            type="button"
            onClick={() => onPick(h)}
            aria-pressed={selected?.url === h.url}
            className="flex items-start gap-3 px-4 py-3 text-left transition-colors hover:opacity-90 cursor-pointer"
            style={{ borderBottom: `1px solid ${t.gridLine}`, background: selected?.url === h.url ? "#a855f7" + (t.isLight ? "10" : "1a") : "transparent" }}
          >
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#a855f718", color: "#a855f7" }}>
              <Scales size={11} weight="fill" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold font-sans leading-snug" style={{ color: t.headText }}>
                {h.title}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                {places.length > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "#3b82f615", color: "#3b82f6" }}>
                    {places.slice(0, 2).join(" · ")}
                    {places.length > 2 ? ` +${places.length - 2}` : ""}
                  </span>
                )}
                <span className="text-[10px] font-mono" style={{ color: t.mutedText }}>
                  {h.outlet} · {ago(h.published_at)}
                </span>
              </span>
            </span>
            <ArrowRight size={10} weight="bold" style={{ color: selected?.url === h.url ? "#a855f7" : t.mutedText, flexShrink: 0, marginTop: 4 }} aria-hidden />
          </button>
        );
      })}
      {policies.length === 0 && <Empty t={t}>{headlines.length ? "No headlines match." : "No policy headlines have come in over the last week."}</Empty>}
    </>
  );
}

/** What a headline's detail draws on beyond the headline: the headlines read, and what its links into the list do. */
type PolicyMore = {
  headlines: Headline[];
  onOpen: (h: Headline) => void;
  onTopic: (label: string) => void;
  onOutlet: (outlet: string) => void;
};

/** A topic's words as the headline has them, each once. */
function wordsIn(re: RegExp, title: string): string[] {
  const found = new Map<string, string>();
  for (const m of title.matchAll(new RegExp(re.source, "gi"))) if (!found.has(m[0].toLowerCase())) found.set(m[0].toLowerCase(), m[0]);
  return [...found.values()];
}

function PolicyDetail({ t, h, onHub, more }: { t: Tokens; h: Headline; onHub: (() => void) | null; more: PolicyMore }) {
  const topics = POLICY_TOPICS.filter((p) => p.re.test(h.title));
  const hits: TopicHit[] = topics.map((p) => ({ label: p.label, color: p.color, words: wordsIn(p.re, h.title) }));
  const when = new Date(h.published_at);
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#a855f718", color: "#a855f7" }}>
          <Scales size={14} weight="fill" />
        </span>
        {topics.map((p) => (
          <span key={p.label} className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: p.color + "15", color: p.color }}>
            {p.label}
          </span>
        ))}
      </div>
      <div className="rounded-xl px-3 py-3" style={{ background: "#a855f708", border: "1px solid #a855f718" }}>
        <p className="text-sm font-bold font-sans leading-snug" style={{ color: t.headText }}>
          {h.title}
        </p>
        <p className="text-[10px] font-mono mt-1" style={{ color: t.mutedText }}>
          {h.outlet} · {when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {ago(h.published_at)}
        </p>
      </div>
      <a
        href={h.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold transition-opacity hover:opacity-80"
        style={{ background: t.tile, color: t.headText, border: `1px solid ${t.gridLine}` }}
      >
        Read it at {h.outlet} <ArrowSquareOut size={11} weight="bold" />
      </a>
      {/* Keyed by the headline, so the place it shows starts afresh with each. */}
      <Suspense
        fallback={
          <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
            Loading the figures…
          </p>
        }
      >
        <PolicyContext key={h.url} t={t} h={h} hits={hits} {...more} />
      </Suspense>
      {onHub && (
        <GoButton color="#a855f7" onClick={onHub}>
          Policy hub
        </GoButton>
      )}
    </>
  );
}
