import React, { useState } from "react";
import ReactDOM from "react-dom";
import { NavLink } from "react-router-dom";
import {
  SquaresFour,
  GearSix,
  CaretLeft,
  CaretRight,
  Buildings,
  Globe,
  City,
  CurrencyDollar,
  NotePencil,
  Lectern,
  HandHeart,
  Crown,
  Scales,
  ChartLine,
  Info,
  X,
  Bank,
  ChartBar,
  Flag,
  Database,
  ShieldCheck,
  Newspaper,
  Lightning,
  ArrowSquareOut,
  Leaf,
  Trophy,
} from "@phosphor-icons/react";

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: SquaresFour, end: true },
  { to: "/dashboard/states", label: "US States", icon: Buildings, end: false },
  { to: "/dashboard/countries", label: "Countries", icon: Globe, end: false },
  { to: "/dashboard/cities", label: "Global Cities", icon: City, end: false },
  {
    to: "/dashboard/economies",
    label: "Economies",
    icon: CurrencyDollar,
    end: false,
  },
];

const analysisNav = [
  { to: "/dashboard/rankings", label: "Rankings", icon: Trophy, end: false },
  { to: "/dashboard/policy", label: "Policy", icon: Scales, end: false },
  {
    to: "/dashboard/worldmap",
    label: "World Leaders",
    icon: Lectern,
    end: false,
  },
  {
    to: "/dashboard/humanitarian",
    label: "Humanitarian",
    icon: HandHeart,
    end: false,
  },
  {
    to: "/dashboard/planetary-boundaries",
    label: "Planetary Boundaries",
    icon: Leaf,
    end: false,
  },
  {
    to: "/dashboard/crime",
    label: "Crime Statistics",
    icon: ShieldCheck,
    end: false,
  },
];

const bottomNav = [
  { to: "/dashboard/notes", label: "My Notes", icon: NotePencil, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: GearSix, end: false },
  { to: "/membership", label: "Membership", icon: Crown, end: false },
];

// ─── About Modal ────────────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    icon: Bank,
    name: "World Bank Open Data",
    category: "Economics",
    desc: "GDP, poverty, trade, and development indicators for 200+ economies.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    url: "https://data.worldbank.org",
  },
  {
    icon: Globe,
    name: "UN Statistics Division",
    category: "Demographics",
    desc: "Population, migration, and human development data from all UN member states.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    url: "https://unstats.un.org",
  },
  {
    icon: ChartBar,
    name: "IMF Data Warehouse",
    category: "Fiscal & Monetary",
    desc: "Government debt, currency reserves, inflation, and fiscal balance data.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    url: "https://data.imf.org",
  },
  {
    icon: Flag,
    name: "Freedom House",
    category: "Civil Liberties",
    desc: "Annual freedom scores measuring political rights and civil liberties globally.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    url: "https://freedomhouse.org",
  },
  {
    icon: Buildings,
    name: "US Census Bureau",
    category: "US Demographics",
    desc: "US state population, income, housing, and demographic breakdowns.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    url: "https://data.census.gov",
  },
  {
    icon: Database,
    name: "Bureau of Labor Statistics",
    category: "Employment",
    desc: "US employment, wages, unemployment rates, and labor productivity metrics.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    url: "https://bls.gov",
  },
  {
    icon: ShieldCheck,
    name: "FBI Crime Data Explorer",
    category: "Public Safety",
    desc: "National crime statistics by offense type, agency, and geography.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    url: "https://cde.ucr.cjis.gov",
  },
  {
    icon: Newspaper,
    name: "WHO Global Health Observatory",
    category: "Public Health",
    desc: "Life expectancy, disease burden, healthcare access, and mortality data.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    url: "https://who.int/data/gho",
  },
  {
    icon: ChartLine,
    name: "OECD Statistics",
    category: "Policy & Economy",
    desc: "Education, labor, tax, and well-being indicators across OECD nations.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    url: "https://stats.oecd.org",
  },
  {
    icon: Lightning,
    name: "Int'l Energy Agency",
    category: "Energy",
    desc: "Global energy production, consumption, renewable share, and CO₂ emissions.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    url: "https://iea.org/data-and-statistics",
  },
  {
    icon: Scales,
    name: "Heritage Foundation",
    category: "Economic Freedom",
    desc: "Annual Index of Economic Freedom across 180+ countries.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    url: "https://heritage.org/index",
  },
  {
    icon: Newspaper,
    name: "V-Dem Institute",
    category: "Governance",
    desc: "Multidimensional democracy indicators measuring 500+ political attributes.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    url: "https://v-dem.net",
  },
  {
    icon: ShieldCheck,
    name: "SIPRI Military Data",
    category: "Defense & Security",
    desc: "Military expenditure, arms transfers, and nuclear force estimates.",
    color: "text-red-400",
    bg: "bg-red-500/10",
    url: "https://sipri.org",
  },
  {
    icon: Globe,
    name: "Pew Research Center",
    category: "Public Opinion",
    desc: "Political, religious, and social survey data across global populations.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    url: "https://pewresearch.org",
  },
  {
    icon: ChartBar,
    name: "ProPublica Congress API",
    category: "US Legislation",
    desc: "Real-time US congressional votes, members, bills, and committee data.",
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    url: "https://projects.propublica.org/api-docs/congress-api",
  },
  {
    icon: Newspaper,
    name: "NewsAPI",
    category: "Live News",
    desc: "Breaking news aggregation from 70,000+ sources in real time.",
    color: "text-orange-300",
    bg: "bg-orange-400/10",
    url: "https://newsapi.org",
  },
];

const FEATURES = [
  {
    icon: Globe,
    label: "195 Countries",
    desc: "Full sovereign nation profiles with leadership, governance & economy data",
  },
  {
    icon: Buildings,
    label: "All 50 US States",
    desc: "State-level political, economic, and demographic intelligence",
  },
  {
    icon: City,
    label: "Global Cities",
    desc: "Major city profiles with regional economic and social indicators",
  },
  {
    icon: CurrencyDollar,
    label: "Economies",
    desc: "Country, regional bloc, and global economic tracking",
  },
  {
    icon: Scales,
    label: "Policy Hub",
    desc: "Active policies, legislation, and governance documents",
  },
  {
    icon: Lectern,
    label: "World Leaders",
    desc: "Interactive map of current heads of state and government",
  },
  {
    icon: ChartLine,
    label: "Trends & Analysis",
    desc: "Sector outlooks, forecasts, and macroeconomic trend signals",
  },
  {
    icon: NotePencil,
    label: "Research Notes",
    desc: "Personal note-taking tied to any entity, exportable and organised",
  },
];

function AboutModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"mission" | "features" | "sources">("mission");

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col modal-glass border rounded-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 modal-tile shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary/10">
              <Globe size={18} weight="fill" className="text-secondary" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-foreground">
                About CommonSphere
              </h2>
              <p className="text-[11px] text-muted-foreground font-sans">
                Political intelligence platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close about dialog"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-4 shrink-0">
          {(["mission", "features", "sources"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-[12px] font-semibold font-sans rounded-t-lg border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-secondary text-secondary bg-secondary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "mission"
                ? "Mission"
                : t === "features"
                  ? "Features"
                  : "Data Sources"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === "mission" && (
            <div className="space-y-5">
              {/* Mission statement */}
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightning
                    size={16}
                    weight="fill"
                    className="text-secondary"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary font-sans">
                    Mission Statement
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground font-sans mb-2 leading-snug">
                  Democratising access to political intelligence
                </h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  CommonSphere is a political intelligence platform built for
                  researchers, analysts, journalists, and citizens who want to
                  understand how the world is governed — without wading through
                  dozens of disconnected sources.
                </p>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed mt-3">
                  Geopolitical data has long been locked behind expensive
                  subscriptions, inconsistent formats, and institutional
                  gatekeeping. We remove those barriers — giving any researcher
                  or policy professional access to the same depth of political
                  intelligence that governments rely on.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { val: "195", lbl: "Countries" },
                  { val: "50", lbl: "US States" },
                  { val: "40K+", lbl: "Data Points" },
                  { val: "2024", lbl: "Founded" },
                ].map((s) => (
                  <div
                    key={s.lbl}
                    className="modal-tile rounded-xl p-3 text-center"
                  >
                    <p className="text-xl font-bold font-mono text-secondary">
                      {s.val}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                      {s.lbl}
                    </p>
                  </div>
                ))}
              </div>

              {/* Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: Globe,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    title: "Global Coverage",
                    desc: "Every sovereign nation, major territory, and all 50 US states in one unified view.",
                  },
                  {
                    icon: Lightning,
                    color: "text-secondary",
                    bg: "bg-secondary/10",
                    title: "Continuous Updates",
                    desc: "Leadership changes, policy shifts, and economic signals surface as they happen.",
                  },
                  {
                    icon: Scales,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    title: "Non-partisan Integrity",
                    desc: "Facts, not opinions. Every data point is sourced from verified government records.",
                  },
                  {
                    icon: Newspaper,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    title: "Research-first Design",
                    desc: "Built for analysts, journalists, and policy researchers who need rigorous depth.",
                  },
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <div
                      key={v.title}
                      className="flex gap-3 modal-tile rounded-xl p-3.5"
                    >
                      <div
                        className={`p-2 rounded-lg ${v.bg} ${v.color} w-fit h-fit shrink-0`}
                      >
                        <Icon size={16} weight="fill" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground font-sans">
                          {v.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-sans leading-relaxed mt-0.5">
                          {v.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "features" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex gap-3 modal-tile rounded-xl p-3.5"
                  >
                    <div className="p-2 rounded-lg bg-secondary/10 w-fit h-fit shrink-0">
                      <Icon
                        size={16}
                        weight="fill"
                        className="text-secondary"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground font-sans">
                        {f.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-sans leading-relaxed mt-0.5">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "sources" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Every data point on CommonSphere is sourced from authoritative,
                publicly accessible institutions. We cross-reference multiple
                sources to ensure accuracy and consistency.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DATA_SOURCES.map((src) => {
                  const Icon = src.icon;
                  return (
                    <div
                      key={src.name}
                      className="flex gap-3 modal-tile rounded-xl p-3.5"
                    >
                      <div
                        className={`p-2 rounded-lg ${src.bg} w-fit h-fit shrink-0`}
                      >
                        <Icon size={16} weight="fill" className={src.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-foreground font-sans truncate">
                            {src.name}
                          </p>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shrink-0 ${src.color} hover:opacity-70 transition-opacity`}
                            aria-label={`Visit ${src.name}`}
                          >
                            <ArrowSquareOut size={12} weight="bold" />
                          </a>
                        </div>
                        <p
                          className={`text-[10px] font-mono font-semibold ${src.color} mt-0.5`}
                        >
                          {src.category}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-sans leading-relaxed mt-1">
                          {src.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/40 modal-tile shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-sans">
            © 2024 CommonSphere. All rights reserved.
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
  mobile,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  end: boolean;
  collapsed: boolean;
  mobile: boolean;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex items-center py-2 rounded-lg transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group w-full ${
            isActive
              ? "bg-secondary text-secondary-foreground border border-secondary/60 shadow-[0_1px_4px_rgba(160,160,160,0.2)]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border"
          } ${collapsed && !mobile ? "justify-center px-0" : "gap-3 px-3"}`
        }
        title={collapsed && !mobile ? label : undefined}
        aria-label={collapsed && !mobile ? label : undefined}
      >
        {({ isActive }) => (
          <>
            <Icon
              size={18}
              weight={isActive ? "fill" : "regular"}
              className={`shrink-0 transition-colors duration-200 ${isActive ? "text-secondary-foreground" : ""}`}
            />
            {(!collapsed || mobile) && (
              <span className="text-[12px] leading-none font-medium font-sans truncate tracking-wide">
                {label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

function SectionLabel({
  label,
  collapsed,
  mobile,
}: {
  label: string;
  collapsed: boolean;
  mobile: boolean;
}) {
  if (collapsed && !mobile)
    return <div className="my-3 mx-2 border-t border-border" />;
  return (
    <li className="px-3 pt-5 pb-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50 font-sans">
        {label}
      </span>
    </li>
  );
}

export function SidebarNav({
  collapsed,
  onToggle,
  mobile = false,
}: SidebarNavProps) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <nav
      className="flex flex-col h-full py-2 overflow-y-auto scrollbar-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      aria-label="Sidebar navigation"
    >
      {/* Main nav — fills available height */}
      <ul className="flex flex-col px-1.5 flex-1">
        {mainNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            mobile={mobile}
          />
        ))}

        <SectionLabel label="Analysis" collapsed={collapsed} mobile={mobile} />

        {analysisNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            mobile={mobile}
          />
        ))}

        {/* Spacer pushes bottom items down */}
        <li className="flex-1 min-h-0" aria-hidden="true" />

        <SectionLabel label="Account" collapsed={collapsed} mobile={mobile} />

        {bottomNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            mobile={mobile}
          />
        ))}

        {/* About button */}
        <li>
          <button
            onClick={() => setShowAbout(true)}
            className={`flex items-center py-2 rounded-lg transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group w-full text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border ${collapsed && !mobile ? "justify-center px-0" : "gap-3 px-3"}`}
            title={collapsed && !mobile ? "About" : undefined}
            aria-label="About CommonSphere"
          >
            <Info size={18} weight="regular" className="shrink-0" />
            {(!collapsed || mobile) && (
              <span className="text-[12px] leading-none font-medium font-sans truncate tracking-wide">
                About
              </span>
            )}
          </button>
        </li>
      </ul>

      {showAbout &&
        ReactDOM.createPortal(
          <AboutModal onClose={() => setShowAbout(false)} />,
          document.body,
        )}

      {/* Collapse toggle — desktop only */}
      {!mobile && (
        <div className="px-2 pt-3 border-t border-border mt-2">
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer ${
              collapsed ? "justify-center px-0" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <CaretRight size={14} weight="bold" />
            ) : (
              <>
                <CaretLeft size={14} weight="bold" />
                <span className="text-[11px] font-medium font-sans tracking-wide">
                  Collapse
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </nav>
  );
}
