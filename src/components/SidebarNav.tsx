import { WindowTitle } from "./WindowTitle";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { NavLink } from "react-router-dom";
import { countriesData } from "@/data/countriesData";
import { usStatesData } from "@/data/statesData";
import { economiesData } from "@/data/economiesData";
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
  Crown,
  GlobeHemisphereWest,
  Scroll,
  Scales,
  ChartLine,
  Info,
  Bank,
  ChartBar,
  Flag,
  Database,
  ShieldCheck,
  Newspaper,
  Lightning,
  ArrowSquareOut,
  Leaf,
  GlobeStand,
  ArrowsLeftRight,
  ArrowsIn,
  ArrowsOut,
  X,
  TreeStructure,
} from "@phosphor-icons/react";

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: SquaresFour, end: true },
  // The world, and any country, state, county or city in it, picked on its map: the first page under the Dashboard, as asked.
  { to: "/dashboard/worldview", label: "Worldview", icon: GlobeStand, end: false },
  { to: "/dashboard/states", label: "US States", icon: Buildings, end: false },
  { to: "/dashboard/countries", label: "Countries", icon: Globe, end: false },
  // What countries are divided into - states, provinces, regions - and the counties of the United States: between the countries and their cities.
  { to: "/dashboard/subnations", label: "Municipalities", icon: TreeStructure, end: false },
  { to: "/dashboard/cities", label: "Cities", icon: City, end: false },
  {
    to: "/dashboard/economies",
    label: "Economies",
    icon: CurrencyDollar,
    end: false,
  },
];

// World Leaders and Worldview changed places, and Policy and Trends, as asked: the leaders and policy now open the list.
const analysisNav = [
  {
    to: "/dashboard/world-leaders",
    label: "World Leaders",
    icon: Lectern,
    end: false,
  },
  { to: "/dashboard/policy", label: "Policy", icon: Scales, end: false },
  // The route keeps its /rankings path so existing links still resolve; the
  // page itself is the comparison now, with the ranked list as its picker.
  {
    to: "/dashboard/rankings",
    label: "Compare",
    // A trophy is a leaderboard's icon. The page pins entities side by side
    // now, so the icon is two arrows facing each other.
    icon: ArrowsLeftRight,
    end: false,
  },
  // What is changing, field by field: the week's headlines, and the projections and trends behind them. It was "Trends".
  {
    to: "/dashboard/planetary-boundaries",
    label: "Climate",
    icon: Leaf,
    end: false,
  },
  {
    to: "/dashboard/crime",
    label: "Crime",
    icon: ShieldCheck,
    end: false,
  },
  { to: "/dashboard/maps", label: "World Maps", icon: GlobeHemisphereWest, end: false },
];

const bottomNav = [
  { to: "/dashboard/news", label: "News", icon: Newspaper, end: false },
  { to: "/dashboard/notes", label: "My Notes", icon: NotePencil, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: GearSix, end: false },
  { to: "/dashboard/membership", label: "Membership", icon: Crown, end: false },
  { to: "/dashboard/legal", label: "Terms & Policies", icon: Scroll, end: false },
];

// ─── About Modal ────────────────────────────────────────────────────────────

/* The publishers the site's figures are mostly drawn from - each figure names its own, with its year, under the Sources menu beside it.
   Only those whose terms let a commercial site use their data are listed, and used. */
const DATA_SOURCES = [
  { icon: Bank, name: "World Bank Open Data", category: "Economy and development", desc: "GDP, trade, research, poverty and the World Development Indicators for every economy.", color: "text-emerald-400", bg: "bg-emerald-500/10", url: "https://data.worldbank.org" },
  { icon: ChartBar, name: "International Monetary Fund", category: "Outlook", desc: "The World Economic Outlook: growth, inflation and debt, with its projections.", color: "text-purple-400", bg: "bg-purple-500/10", url: "https://www.imf.org/external/datamapper/" },
  { icon: Globe, name: "United Nations", category: "People and places", desc: "World Population Prospects, the UN's cities, UN Comtrade's trade, UNODC's crime and UNESCO's statistics.", color: "text-blue-400", bg: "bg-blue-500/10", url: "https://unstats.un.org" },
  { icon: ChartLine, name: "OECD", category: "Policy and research", desc: "Government spending, research budgets by aim, health and medical technology.", color: "text-violet-400", bg: "bg-violet-500/10", url: "https://data-explorer.oecd.org" },
  { icon: Buildings, name: "US Census Bureau", category: "United States", desc: "States' and counties' people, income, housing and the American Community Survey.", color: "text-cyan-400", bg: "bg-cyan-500/10", url: "https://data.census.gov" },
  { icon: Database, name: "Bureau of Labor Statistics", category: "US work", desc: "Employment, wages and unemployment in the United States.", color: "text-indigo-400", bg: "bg-indigo-500/10", url: "https://www.bls.gov" },
  { icon: Scales, name: "V-Dem Institute", category: "Governance", desc: "How countries are ruled, and the rights their people hold.", color: "text-pink-400", bg: "bg-pink-500/10", url: "https://v-dem.net" },
  { icon: Lightning, name: "Our World in Data", category: "Energy and invention", desc: "Ember's electricity, IRENA's renewables, Epoch AI's computing and more, as it republishes them.", color: "text-yellow-400", bg: "bg-yellow-500/10", url: "https://ourworldindata.org" },
  { icon: Flag, name: "UK Foreign Office", category: "Law", desc: "The laws and customs each country's travel advice sets out, under the Open Government Licence.", color: "text-orange-400", bg: "bg-orange-500/10", url: "https://www.gov.uk/foreign-travel-advice" },
  { icon: GlobeHemisphereWest, name: "Natural Earth, geoBoundaries and GeoNames", category: "Maps", desc: "The borders of countries, their divisions and districts, and their towns.", color: "text-teal-400", bg: "bg-teal-500/10", url: "https://www.naturalearthdata.com" },
  { icon: Newspaper, name: "Wikidata", category: "Reference", desc: "Office-holders and facts, kept only where its record agrees with others; Wikipedia is listed last, never alone.", color: "text-sky-400", bg: "bg-sky-500/10", url: "https://www.wikidata.org" },
  { icon: ShieldCheck, name: "GCAT and the Federation of American Scientists", category: "Space and security", desc: "Every launch and satellite in Jonathan McDowell's catalogue, and the world's nuclear arsenals.", color: "text-red-400", bg: "bg-red-500/10", url: "https://planet4589.org/space/gcat/" },
];

/* What each of the menu's pages is for: the features are the menu's own pages, so that the window cannot list a page that has gone. */
const FEATURE_ABOUT: Record<string, string> = {
  "/dashboard": "The world at a glance: a map to press, the headlines, countries, states and cities, and an explorer of the site's figures.",
  "/dashboard/worldview": "A wheel of countries, and for the one picked its economy, industry, people, health, security and standing - down to its states, counties and cities.",
  "/dashboard/states": "Each US state's people, economy, politics and laws.",
  "/dashboard/countries": "A window on every country and territory: its leaders, economy, people, law and divisions.",
  "/dashboard/subnations": "States, provinces, counties, districts and towns the world over, each with its record.",
  "/dashboard/cities": "The cities the United Nations counts: their people, their land and how they are growing.",
  "/dashboard/economies": "Economies, their resources and trade, and a currency converter.",
  "/dashboard/world-leaders": "Who holds office in each country, and the alliances and blocs countries belong to.",
  "/dashboard/policy": "What governments spend and on what, and a calculator to move it from one area to another.",
  "/dashboard/rankings": "Countries, states and systems side by side.",
  "/dashboard/planetary-boundaries": "The state of the planet: emissions, temperature, energy and the limits the earth can bear.",
  "/dashboard/crime": "Crime by type and by country, as the UN Office on Drugs and Crime counts it.",
  "/dashboard/maps": "The world mapped by any measure the site holds.",
  "/dashboard/news": "The latest headlines from established outlets, for the whole world, between countries, or any continent, country or US state - political, social, environmental, economic, security and industrial.",
  "/dashboard/notes": "Your own notes on any place, person or page.",
};

function AboutModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"mission" | "features" | "sources">("mission");
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div
        className={`relative w-full flex flex-col modal-glass border rounded-2xl overflow-hidden animate-fade-in transition-all duration-300 ${isExpanded ? "max-w-full h-full" : "max-w-2xl max-h-[90vh]"}`}
      >
        {/* Its name and the window's buttons: one bar across the top of the window - the same in every window of the site. */}
        {/* The window does not scroll as a whole - its body does - so the bar has no padding to reach across. */}
        <WindowTitle className="!m-0 shrink-0" title={<span className="inline-flex items-center gap-2 min-w-0"><Globe size={18} weight="fill" className="text-secondary shrink-0" aria-hidden />About CommonSphere</span>} note="An atlas of the world as it stands">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse modal" : "Expand modal to full screen"}
            title={isExpanded ? "Collapse" : "Expand to full screen"}
          >
            {isExpanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </WindowTitle>

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
                  An atlas of the world as it stands
                </h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  CommonSphere sets the world's nations, economies, people,
                  climate, law and the news side by side - for researchers,
                  journalists and anyone who wants to understand how the world is
                  governed and how it is changing, without wading through dozens of
                  disconnected sources.
                </p>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed mt-3">
                  Every figure is its publisher's, named beside it with the year it
                  describes. Nothing is estimated or made up: a figure the site does
                  not hold is left out or marked Not held, and anything worked out
                  here - a share, a change, a score - says so.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  // Counted from the data, as the Dashboard's welcome counts them, so that they cannot drift from it.
                  { val: String(countriesData.filter((c) => !c.territory).length), lbl: "Countries" },
                  { val: String(countriesData.filter((c) => c.territory).length), lbl: "Territories" },
                  { val: String(usStatesData.length), lbl: "US States" },
                  { val: String(economiesData.length), lbl: "Economies" },
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
                    desc: "Every country and territory, their divisions, districts and towns, and the US states and counties, on one map.",
                  },
                  {
                    icon: Lightning,
                    color: "text-secondary",
                    bg: "bg-secondary/10",
                    title: "Kept current",
                    desc: "The headlines are read every half hour, and each dataset gives the day it was read from its publisher.",
                  },
                  {
                    icon: Scales,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    title: "Sourced, never estimated",
                    desc: "Facts, not opinions: official and reference publishers first, several a reader can open, Wikipedia last and never alone.",
                  },
                  {
                    icon: Newspaper,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    title: "Open to use",
                    desc: "Only data whose licence lets the site use it: public domain, the open Creative Commons licences and the Open Government Licence.",
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
              {[...mainNav, ...analysisNav, ...bottomNav].filter((n) => FEATURE_ABOUT[n.to]).map((n) => ({ icon: n.icon, label: n.label, desc: FEATURE_ABOUT[n.to] })).map((f) => {
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
                The publishers the site's figures are mostly drawn from. Each figure
                names its own source and the year it describes, under the Sources
                menu beside it.
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
            © {new Date().getFullYear()} CommonSphere. All rights reserved.
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
          `flex items-center py-2 rounded-lg transition-all duration-250 ease-in-out cursor-pointer group w-full ${
            isActive ? "nav-item-active" : "nav-item-idle"
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
              // No colour class: the icon inherits the item's colour through
              // currentColor, so it can never disagree with the label.
              className="shrink-0 transition-colors duration-200"
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
    // At tablet widths the list is spread evenly, and the rule takes its place in the spread without margins of its own.
    return <li aria-hidden="true" className="my-3 md:max-lg:my-0 mx-2 border-t border-border list-none" />;
  return (
    <li className="px-3 pt-5 pb-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50 font-sans">
        {label}
      </span>
    </li>
  );
}

/** The row that opens and closes the sidebar: at the head of the bar and at its foot. */
function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-250 ease-in-out cursor-pointer ${
        collapsed ? "justify-center px-0" : ""
      }`}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <CaretRight size={14} weight="bold" />
      ) : (
        <>
          <CaretLeft size={14} weight="bold" />
          <span className="text-[11px] font-medium font-sans tracking-wide">Collapse</span>
        </>
      )}
    </button>
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
      {/* Collapse toggle at the head of the bar — desktop only; the same one is at its foot. */}
      {!mobile && (
        <div className="px-2 pb-2 border-b border-border mb-2 shrink-0">
          <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
        </div>
      )}

      {/* Main nav — fills available height. At tablet widths the bar is tall
          and the list short, so it sat bunched at the top with the account
          links stranded at the foot; there the items are spread evenly down
          the bar instead (and the spacer that pushes the account links down
          is not needed). */}
      <ul className="flex flex-col px-1.5 flex-1 md:max-lg:justify-between">
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
        <li className="flex-1 min-h-0 md:max-lg:hidden" aria-hidden="true" />

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
            className={`flex items-center py-2 rounded-lg transition-all duration-250 ease-in-out cursor-pointer group w-full text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border ${collapsed && !mobile ? "justify-center px-0" : "gap-3 px-3"}`}
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
        <div className="px-2 pt-3 border-t border-border mt-2 shrink-0">
          <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
        </div>
      )}
    </nav>
  );
}
