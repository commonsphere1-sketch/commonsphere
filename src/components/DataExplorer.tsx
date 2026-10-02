/**
 * The data explorer: countries, the world's economies, and policy news, each
 * as a list beside a detail pane. The Dashboard has all three, as tabs; the
 * Countries, Economies and Policy pages each have their own alone (`only`),
 * with no tabs to the other two.
 *
 * Every figure is sourced. Countries come from the site's country data; the
 * world, its regions and the European Union from the World Bank's and the
 * IMF's own aggregates (worldview.ts, built by build-worldview.cjs, with no
 * projections); policy from the live headlines of national politics desks
 * and US statehouse coverage, counted by the words in them. Nothing here is
 * typed in by hand.
 *
 * On the Policy page a headline's detail goes further (PolicyContext): where
 * the headline came from, the published figures for the place it is about,
 * and the week's other policy headlines about that place. It is loaded only
 * there, so the Dashboard's panel does not carry its data.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ArrowSquareOut, ChartBar, Globe, Heart, MagnifyingGlass, MapPin, Scales, Users, X } from "@phosphor-icons/react";
import { useTheme } from "../contexts/ThemeContext";
import { useLiveCountries } from "../contexts/LiveDataContext";
import type { Country } from "../data/countriesData";
import { IMF_INFLATION, REGIONS, WORLD, type WorldPoint } from "../data/worldview";
import { has, na, sortKey } from "../lib/na";
import { usdFromBillions } from "../lib/money";
import { SourceLink } from "./SourceLink";
import { ago, placeName, useHeadlines, type Headline } from "./HeadlinesBanner";
import type { TopicHit } from "./PolicyContext";

/** The Policy page's fuller detail for a headline, with the data it draws on. */
const PolicyContext = lazy(() => import("./PolicyContext"));

export type ExplorerTab = "countries" | "economies" | "policies";

const TABS: { id: ExplorerTab; label: string; color: string; path: string; Icon: typeof Globe }[] = [
  { id: "countries", label: "Countries", color: "#6366f1", path: "/dashboard/countries", Icon: Globe },
  { id: "economies", label: "Economies", color: "#f59e0b", path: "/dashboard/economies", Icon: ChartBar },
  { id: "policies", label: "Policies", color: "#a855f7", path: "/dashboard/policy", Icon: Scales },
];

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

export function DataExplorer({ only }: { /** Show this category alone, without the tabs. */ only?: ExplorerTab }) {
  const t = useTokens();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [picked, setTab] = useState<ExplorerTab>("countries");
  const tab = only ?? picked;
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
  // Not read at all where the explorer shows another category alone.
  const headlines = useHeadlines(["policy"], 7, POLICY_READ, false, undefined, !only || only === "policies");
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

  const cur = TABS.find((x) => x.id === tab)!;
  const badge: Record<ExplorerTab, string> = {
    countries: `${byGdp.length}`,
    economies: `${regions.length}`,
    policies: `${headlines.length}${capped ? "+" : ""}`,
  };
  const footer =
    tab === "countries"
      ? `${countries.length} of ${byGdp.length} countries`
      : tab === "economies"
        ? `${regionList.length} regions and blocs`
        : `${policies.length} of the ${capped ? `newest ${headlines.length}` : headlines.length} policy headlines from the last week`;

  return (
    /* Capped and centred: on a wide or full-screen window the list's rows and
       the detail's charts stretched across the whole page, a name at one edge
       and its figure at the other. */
    <div className="flex flex-col rounded-2xl overflow-hidden w-full max-w-6xl mx-auto" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
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
      <div className="flex flex-col md:flex-row md:h-[520px]">
        <div
          className="flex flex-col overflow-y-auto max-h-[320px] md:max-h-none md:h-full md:w-[44%] border-b md:border-b-0 md:border-r"
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
        <div ref={detailRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 md:h-full">
          {tab === "countries" && country && <CountryDetail t={t} c={country} onProfile={pathname === TABS[0].path ? null : () => navigate(TABS[0].path)} />}
          {tab === "economies" && region && <RegionDetail t={t} region={region} byGdp={byGdp} onExplorer={pathname === TABS[1].path ? null : () => navigate(TABS[1].path)} />}
          {tab === "policies" &&
            (policy ? (
              <PolicyDetail
                t={t}
                h={policy}
                onHub={pathname === TABS[2].path ? null : () => navigate(TABS[2].path)}
                more={
                  only === "policies"
                    ? {
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
                      }
                    : null
                }
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

function CountryDetail({ t, c, onProfile }: { t: Tokens; c: Country; onProfile: (() => void) | null }) {
  const up = c.gdpGrowth >= 0;
  const pop = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}K`);
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
              GDP {signed(c.gdpGrowth)}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Kpi t={t} label="GDP" value={na(c.gdp, gdpShort)} color="#6366f1" />
        <Kpi t={t} label="Growth" value={na(c.gdpGrowth, (v) => `${signed(v)}%`)} color={up ? GREEN : RED} />
        <Kpi t={t} label="GDP per person" value={na(c.gdpPerCapita, (v) => `$${Math.round(v).toLocaleString("en-US")}`)} color="#3b82f6" />
        <Kpi t={t} label="Inflation" value={na(c.inflationRate, (v) => `${v}%`)} color={c.inflationRate > 6 ? RED : "#f59e0b"} />
        <Kpi t={t} label="Unemployment" value={na(c.unemploymentRate, (v) => `${v.toFixed(1)}%`)} color={c.unemploymentRate < 5 ? GREEN : "#f59e0b"} />
        <Kpi
          t={t}
          label="HDI"
          value={na(c.humanDevelopmentIndex, (v) => v.toFixed(3))}
          color={c.humanDevelopmentIndex >= 0.8 ? GREEN : c.humanDevelopmentIndex >= 0.65 ? "#f59e0b" : RED}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "Population", value: na(c.population, pop), icon: <Users size={10} weight="fill" />, color: "#06b6d4" },
          { label: "Life expectancy", value: na(c.lifeExpectancy, (v) => `${v} yrs`), icon: <Heart size={10} weight="fill" />, color: "#ec4899" },
          {
            label: "Trade balance",
            value: has(c.tradeBalance) ? usdFromBillions(c.tradeBalance, true) : "—",
            icon: <Scales size={10} weight="fill" />,
            color: !has(c.tradeBalance) ? t.mutedText : c.tradeBalance >= 0 ? GREEN : RED,
          },
          {
            label: "Area",
            value: na(c.areaKm2, (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M km²` : `${Math.round(v).toLocaleString("en-US")} km²`)),
            icon: <MapPin size={10} weight="fill" />,
            color: "#a855f7",
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg px-2.5 py-2 flex items-center gap-2" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
            <span style={{ color: m.color }}>{m.icon}</span>
            <div className="min-w-0">
              <p className="text-[9px] font-mono truncate" style={{ color: t.mutedText }}>
                {m.label}
              </p>
              <p className="text-[12px] font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {c.trends && c.trends.length > 1 && (
        <>
          <Label t={t}>GDP trend · World Bank</Label>
          <ResponsiveContainer width="100%" height={72}>
            <AreaChart data={c.trends} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id={`explorerCountry-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}T` : `${v}B`}`}
              />
              <Tooltip {...tooltipStyle(t)} formatter={(v: number) => [v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v}B`, "GDP"]} />
              <Area type="monotone" dataKey="gdp" stroke="#6366f1" fill={`url(#explorerCountry-${c.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}

      {c.keyIndustries && c.keyIndustries.length > 0 && (
        <>
          <Label t={t}>Key industries</Label>
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
                <span className="text-[9px] font-mono w-7 text-right shrink-0" style={{ color: t.mutedText }}>
                  {ind.gdpShare}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}

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
            <span className="text-[11px] font-sans font-semibold text-right max-w-[60%] truncate" style={{ color: t.headText }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {score && (
        <div className="rounded-xl px-3 py-3" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
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
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] font-bold font-mono" style={{ color: s.color }}>
                  {Math.round(s.v)}/{s.max}
                </p>
                <p className="text-[8px] font-mono" style={{ color: t.mutedText }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
            CommonSphere's own composite of the published figures above, not an official index: the HDI counts for 40 points, and growth,
            inflation and unemployment for 20 each.
          </p>
        </div>
      )}

      {onProfile && (
        <GoButton color="#6366f1" onClick={onProfile}>
          Full country profiles
        </GoButton>
      )}
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
  const [growthYear, growth] = lastOf(r.growth);
  const worldThen = WORLD.gdp.series.find(([y]) => y === gy)?.[1];
  const members = new Set(r.members);
  const largest = byGdp.filter((c) => members.has(c.code)).slice(0, 6);
  const trend = r.gdp.map(([year, v]) => ({ year: String(year), gdp: Number((v / 1e12).toFixed(2)) }));
  return (
    <>
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
        <Kpi t={t} label={r.kind === "bloc" ? "Members" : "Economies"} value={`${r.members.length}`} color="#3b82f6" />
      </div>
      <Label t={t}>GDP · current US$ trillions</Label>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={trend} margin={{ top: 2, right: 2, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={`explorerRegion-${r.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="year" tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8, fill: t.mutedText, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}T`} />
          <Tooltip {...tooltipStyle(t)} formatter={(v: number) => [`$${v}T`, "GDP"]} />
          <Area type="monotone" dataKey="gdp" stroke="#f59e0b" fill={`url(#explorerRegion-${r.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      <Label t={t}>Real growth, year by year</Label>
      <div className="flex flex-wrap gap-1">
        {r.growth.slice(-6).map(([y, g]) => (
          <span key={y} className="rounded-md px-1.5 py-0.5 text-[10px] font-mono" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
            <span style={{ color: t.mutedText }}>{y}</span> <span style={{ color: g >= 0 ? GREEN : RED }}>{signed(g)}%</span>
          </span>
        ))}
      </div>
      <SourceLink sources={r.source} />
      {largest.length > 0 && (
        <>
          <Label t={t}>Largest economies</Label>
          <div>
            {largest.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < largest.length - 1 ? `1px solid ${t.gridLine}` : "none" }}>
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
            ))}
          </div>
        </>
      )}
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

/** What the Policy page's detail adds: the headlines read, and what its links into the list do. */
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

function PolicyDetail({ t, h, onHub, more }: { t: Tokens; h: Headline; onHub: (() => void) | null; more: PolicyMore | null }) {
  const topics = POLICY_TOPICS.filter((p) => p.re.test(h.title));
  const hits: TopicHit[] = topics.map((p) => ({ label: p.label, color: p.color, words: wordsIn(p.re, h.title) }));
  const places = placesOf(h);
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
      {!more && places.length > 0 && (
        <div className="rounded-xl px-3 py-3" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
          <Label t={t} className="mb-1">
            About
          </Label>
          <p className="text-[11px] font-sans" style={{ color: t.headText }}>
            {places.join(", ")}
          </p>
        </div>
      )}
      <a
        href={h.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold transition-opacity hover:opacity-80"
        style={{ background: t.tile, color: t.headText, border: `1px solid ${t.gridLine}` }}
      >
        Read it at {h.outlet} <ArrowSquareOut size={11} weight="bold" />
      </a>
      {more ? (
        // Keyed by the headline, so the place it shows starts afresh with each.
        <Suspense
          fallback={
            <p className="text-[10px] font-sans" style={{ color: t.mutedText }}>
              Loading the figures…
            </p>
          }
        >
          <PolicyContext key={h.url} t={t} h={h} hits={hits} {...more} />
        </Suspense>
      ) : (
        <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
          {topics.length ? "Its topics come from the words in the headline. " : ""}The story is the outlet's; CommonSphere links to it and adds nothing to it.
        </p>
      )}
      {onHub && (
        <GoButton color="#a855f7" onClick={onHub}>
          Policy hub
        </GoButton>
      )}
    </>
  );
}
