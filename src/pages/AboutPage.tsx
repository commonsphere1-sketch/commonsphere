import {
  Globe,
  Lightning,
  Newspaper,
  Scales,
  ArrowRight,
  Database,
  Bank,
  ChartBar,
  Buildings,
  Flag,
  BookOpen,
  ShieldCheck,
  ArrowSquareOut,
  Sword,
  Leaf,
  MapPin,
  Briefcase,
  Users,
  Gavel,
  Ranking,
  Article,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

const STATS = [
  { val: "195+", lbl: "Countries Indexed" },
  { val: "50", lbl: "US States Tracked" },
  { val: "300+", lbl: "Global Cities" },
  { val: "100K+", lbl: "Data Points" },
];

const VALUES = [
  {
    icon: <Globe size={24} weight="fill" />,
    title: "Global Coverage",
    desc: "We track every sovereign nation, major territory, all 50 US states, hundreds of global cities, and major economies — giving you one unified view of the world's political landscape.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <Lightning size={24} weight="fill" />,
    title: "Kept Current",
    desc: "Country and state indicators are pulled from the World Bank and refreshed while you have the app open. Written entries — policy notes, conflict and leadership records — are curated and carry their own dates.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: <Scales size={24} weight="fill" />,
    title: "Non-partisan Integrity",
    desc: "We present facts, not opinions. Every data point is sourced from verified government records, official statistics, and reputable institutions — from Freedom House to the UN.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: <Newspaper size={24} weight="fill" />,
    title: "Research-first",
    desc: "Built for analysts, journalists, policy researchers, and the simply curious. Every feature — from the Research Notes hub to Comparisons — is designed to accelerate deep, rigorous research.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

const DATA_SOURCES = [
  {
    icon: <Bank size={22} weight="fill" />,
    name: "World Bank Open Data",
    category: "Economics & Development",
    desc: "GDP, poverty rates, debt-to-GDP ratios, trade balances, and 1,400+ development indicators across 217 economies.",
    url: "https://data.worldbank.org",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: <Globe size={22} weight="fill" />,
    name: "UN Statistics Division",
    category: "Demographics & Social",
    desc: "Population, migration flows, gender equality indices, education metrics, and sustainable development goals data.",
    url: "https://unstats.un.org",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: <ChartBar size={22} weight="fill" />,
    name: "IMF Data Warehouse",
    category: "Fiscal & Monetary",
    desc: "Government finance statistics, currency reserves, inflation indices, balance of payments, and fiscal monitor reports.",
    url: "https://data.imf.org",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: <Flag size={22} weight="fill" />,
    name: "Freedom House",
    category: "Political Rights & Civil Liberties",
    desc: "Annual Freedom in the World and Freedom on the Net scores, tracking political rights and civil liberties globally.",
    url: "https://freedomhouse.org",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/10 text-orange-400",
  },
  {
    icon: <Buildings size={22} weight="fill" />,
    name: "US Census Bureau",
    category: "US States & Demographics",
    desc: "State-level population estimates, economic census, American Community Survey, and Congressional apportionment data.",
    url: "https://data.census.gov",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    badge: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: <Newspaper size={22} weight="fill" />,
    name: "Varieties of Democracy (V-Dem)",
    category: "Governance & Democracy",
    desc: "Disaggregated democracy indices covering electoral, liberal, participatory, deliberative, and egalitarian dimensions.",
    url: "https://v-dem.net",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: <ShieldCheck size={22} weight="fill" />,
    name: "SIPRI Military Expenditure",
    category: "Defense & Security",
    desc: "Consistent time-series data on military spending, arms transfers, peacekeeping operations, and conflict casualties.",
    url: "https://sipri.org",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: <Database size={22} weight="fill" />,
    name: "US Bureau of Labor Statistics",
    category: "Employment & Labor",
    desc: "State and national unemployment figures, consumer price indices, productivity data, and labor force participation rates.",
    url: "https://bls.gov",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    badge: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: <Sword size={22} weight="fill" />,
    name: "ACLED Conflict Data",
    category: "Conflicts & Security",
    desc: "Disaggregated data on political violence and protest events worldwide, covering fatalities, actors, and event types.",
    url: "https://acleddata.com",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: <Leaf size={22} weight="fill" />,
    name: "NASA Earth Observations",
    category: "Planetary & Environment",
    desc: "Environmental boundary data including CO₂ levels, ocean acidification, land use change, and biodiversity loss indicators.",
    url: "https://earthdata.nasa.gov",
    color: "text-green-400",
    bg: "bg-green-500/10",
    badge: "bg-green-500/10 text-green-400",
  },
  {
    icon: <MapPin size={22} weight="fill" />,
    name: "UN Habitat Urban Data",
    category: "Cities & Urban",
    desc: "City-level data on population density, urban inequality, housing affordability, municipal governance, and infrastructure.",
    url: "https://unhabitat.org",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    badge: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: <Briefcase size={22} weight="fill" />,
    name: "ILO Forced Labour Data",
    category: "Humanitarian & Crime",
    desc: "Global estimates of forced labour, modern slavery prevalence, child labour, and human trafficking by region and sector.",
    url: "https://ilo.org",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/10 text-orange-400",
  },
  {
    icon: <Gavel size={22} weight="fill" />,
    name: "UNODC Crime & Justice",
    category: "Crime & Justice",
    desc: "Homicide rates, prison populations, drug seizures, corruption indices, and justice system metrics across 200+ countries.",
    url: "https://unodc.org",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/10 text-amber-400",
  },
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-0 max-w-screen-2xl mx-auto">
        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-b-2xl border-x border-b border-border bg-card mb-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-purple-500/5 blur-3xl" />
          </div>
          <div className="relative px-8 pt-14 pb-12 flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-2">
              <Globe size={28} weight="fill" className="text-secondary" />
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-secondary">
                About CommonSphere
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-sans leading-tight text-foreground">
              We make the world&#39;s
              <br />
              <span className="text-secondary">political data legible</span>
            </h1>
            <p className="text-base text-muted-foreground font-sans leading-relaxed max-w-xl">
              CommonSphere is a political intelligence platform built for
              researchers, analysts, journalists, and citizens who want to
              understand how the world is governed — covering countries, US
              states, global cities, economies, conflicts, humanitarian crises,
              crime statistics, planetary boundaries, and more.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 w-fit px-5 py-2.5 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold font-sans hover:opacity-90 transition-opacity"
            >
              Explore the platform <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </section>

        <div className="space-y-16 pb-16">
          {/* ── STATS ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div
                key={s.lbl}
                className="bg-card border border-border rounded-2xl p-6 text-center"
              >
                <p className="text-4xl font-bold font-mono text-secondary mb-2">
                  {s.val}
                </p>
                <p className="text-sm text-muted-foreground font-sans">
                  {s.lbl}
                </p>
              </div>
            ))}
          </section>

          {/* ── MISSION ───────────────────────────────────────────── */}
          <section className="bg-card border border-border rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0 md:w-48">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                Our Mission
              </p>
              <div className="w-8 h-0.5 bg-secondary/40 rounded-full" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-sans text-foreground leading-snug">
                Democratising access to political intelligence
              </h2>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Geopolitical data has long been locked behind expensive
                subscriptions, inconsistent formats, and institutional
                gatekeeping. CommonSphere removes those barriers — giving any
                researcher, journalist, or policy professional access to the
                same depth of political intelligence that governments rely on to
                make decisions.
              </p>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Our goal is a single, authoritative, always-current window into
                how every country, state, city, and economy on Earth is governed
                — economically, politically, and socially — alongside deep
                tracking of conflicts, humanitarian emergencies, crime
                statistics, planetary boundaries, political ideologies, and
                global wealth.
              </p>
            </div>
          </section>

          {/* ── VALUES ────────────────────────────────────────────── */}
          <section>
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                What we stand for
              </p>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                Our core values
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="bg-card border border-border rounded-2xl p-6 flex gap-5"
                >
                  <div
                    className={`p-3 rounded-xl ${v.bg} ${v.color} w-fit h-fit shrink-0 mt-0.5`}
                  >
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-sans text-foreground mb-2">
                      {v.title}
                    </h3>
                    <p
                      className="text-sm text-muted-foreground font-sans leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: v.desc }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── DATA SOURCES ──────────────────────────────────────── */}
          <section>
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                Where the data comes from
              </p>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                Data sources
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-2 max-w-2xl">
                Every data point on CommonSphere is sourced from authoritative,
                publicly accessible institutions. We cross-reference multiple
                sources to ensure accuracy and consistency.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DATA_SOURCES.map((src) => (
                <div
                  key={src.name}
                  className="bg-card border border-border rounded-xl p-5 flex gap-4 hover:border-secondary/30 transition-colors group"
                >
                  <div
                    className={`p-2.5 rounded-xl ${src.bg} ${src.color} w-fit h-fit shrink-0 mt-0.5`}
                  >
                    {src.icon}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-bold font-sans text-foreground leading-snug">
                        {src.name}
                      </p>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${src.badge} whitespace-nowrap shrink-0`}
                      >
                        {src.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {src.desc}
                    </p>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold font-sans text-secondary hover:opacity-80 transition-opacity w-fit mt-0.5"
                    >
                      Visit source <ArrowSquareOut size={11} weight="bold" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── WHAT'S ON THE PLATFORM ───────────────────────────── */}
          <section>
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                Platform Coverage
              </p>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                Everything in one place
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-2 max-w-2xl">
                CommonSphere spans a growing set of intelligence domains — each
                with dedicated analysis tools, charts, and searchable data.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <Globe size={18} weight="fill" />,
                  label: "Countries",
                  desc: "195+ sovereign nations",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  icon: <Buildings size={18} weight="fill" />,
                  label: "US States",
                  desc: "All 50 states tracked",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  icon: <MapPin size={18} weight="fill" />,
                  label: "Global Cities",
                  desc: "Major urban centres",
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10",
                },
                {
                  icon: <Sword size={18} weight="fill" />,
                  label: "Conflicts",
                  desc: "Active & historical wars",
                  color: "text-rose-400",
                  bg: "bg-rose-500/10",
                },
                {
                  icon: <Users size={18} weight="fill" />,
                  label: "Humanitarian",
                  desc: "Displacement, food & health",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10",
                },
                {
                  icon: <Gavel size={18} weight="fill" />,
                  label: "Crime & Justice",
                  desc: "Global crime statistics",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  icon: <Leaf size={18} weight="fill" />,
                  label: "Planetary Boundaries",
                  desc: "Environmental limits",
                  color: "text-green-400",
                  bg: "bg-green-500/10",
                },
                {
                  icon: <Flag size={18} weight="fill" />,
                  label: "Political Ideologies",
                  desc: "Party & movement tracking",
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/10",
                },
                {
                  icon: <Ranking size={18} weight="fill" />,
                  label: "Global Rankings",
                  desc: "Cross-country indices",
                  color: "text-secondary",
                  bg: "bg-secondary/10",
                },
                {
                  icon: <Article size={18} weight="fill" />,
                  label: "Public Policy Hub",
                  desc: "Policy positions & analysis",
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
                {
                  icon: <BookOpen size={18} weight="fill" />,
                  label: "Research Notes",
                  desc: "Save & organise insights",
                  color: "text-teal-400",
                  bg: "bg-teal-500/10",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-secondary/30 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg w-fit ${item.bg} ${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────────────── */}
          <section className="relative overflow-hidden bg-card border border-secondary/30 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-secondary/8 blur-3xl" />
            </div>
            <div className="relative space-y-2 max-w-lg">
              <p className="text-xs font-mono font-semibold uppercase tracking-widest text-secondary">
                Get started
              </p>
              <h3 className="text-xl font-bold font-sans text-foreground">
                Ready to explore the platform?
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Start with any region or entity type — no account required for
                basic access.
              </p>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-full font-semibold text-sm font-sans hover:opacity-90 transition-opacity"
              >
                <Globe size={16} weight="fill" />
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate("/membership")}
                className="flex items-center gap-2 px-6 py-3 border border-border rounded-full font-semibold text-sm font-sans text-foreground hover:bg-muted transition-colors"
              >
                View Memberships
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
