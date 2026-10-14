import { decodeEntities } from "../lib/security";
import {
  Globe,
  Lightning,
  Newspaper,
  Scales,
  ArrowRight,
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
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { CITY_FIGURES_SOURCE } from "../data/cityFigures";
import { PLACES_TOTAL } from "../data/placesIndex";

/* What the site holds, counted from its own data and not typed: the figures once here - "195+", "300+", "100K+" - were not counts of anything. */
const STATS = [
  { val: countriesData.length.toLocaleString("en-US"), lbl: "Countries and territories" },
  { val: String(usStatesData.length), lbl: "US states" },
  { val: CITY_FIGURES_SOURCE.cities.toLocaleString("en-US"), lbl: "Cities, as the UN counts them" },
  { val: PLACES_TOTAL.toLocaleString("en-US"), lbl: "Towns and villages" },
];

const VALUES = [
  {
    icon: <Globe size={24} weight="fill" />,
    title: "From the world to the village",
    desc: `Every country and territory, the states, provinces and regions they are made of, the counties of the United States, ${CITY_FIGURES_SOURCE.cities.toLocaleString("en-US")} cities and ${PLACES_TOTAL.toLocaleString("en-US")} towns and villages - each with a window of its own - and the economies, the leaders and the laws over them.`,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <Lightning size={24} weight="fill" />,
    title: "Dated, and kept current",
    desc: "Every figure carries the year it is for. Country and state indicators are refreshed from the World Bank while you have the app open; headlines every half hour. Travel advice, disaster alerts and the year's events are snapshots, each with its day.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: <Scales size={24} weight="fill" />,
    title: "Sourced, not estimated",
    desc: "Each figure is its publisher's, named beside it with a link. What the site works out itself - a ratio, a rank, a count - says so. Where nothing is published, the site says \"Not held\" and leaves the gap.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: <Newspaper size={24} weight="fill" />,
    title: "Made to work with",
    desc: "Follow a country, a state, a city or a municipality. Compare up to six countries and states side by side, on their figures or on how they are governed. Take a note on any place, or on any page.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

/* The publishers the site's figures are in fact drawn from (see the data log, src/data/dataLog.ts): the list once here named some that were never used. */
const DATA_SOURCES = [
  {
    icon: <Bank size={22} weight="fill" />,
    name: "World Bank Open Data",
    category: "Development & governance",
    desc: "Development indicators, shares of income and poverty, the Worldwide Governance Indicators, tax revenue and tariffs.",
    url: "https://data.worldbank.org",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: <ChartBar size={22} weight="fill" />,
    name: "OECD",
    category: "Tax & wages",
    desc: "Statutory rates of corporate and personal income tax, year by year, and average wages.",
    url: "https://data.oecd.org",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: <Globe size={22} weight="fill" />,
    name: "United Nations",
    category: "Population & cities",
    desc: "The world's cities and their populations, population prospects, the human development indices, and the classification of what governments spend on.",
    url: "https://unstats.un.org",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    badge: "bg-sky-500/10 text-sky-400",
  },
  {
    icon: <Buildings size={22} weight="fill" />,
    name: "US Census Bureau",
    category: "US states, counties & cities",
    desc: "Population, income and its shares, poverty, languages spoken at home, commuting, and what each state government spends.",
    url: "https://data.census.gov",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    badge: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: <Briefcase size={22} weight="fill" />,
    name: "US Bureau of Labor Statistics",
    category: "Employment",
    desc: "Unemployment in each state, and with the Bureau of Economic Analysis what each state produces and earns.",
    url: "https://www.bls.gov/data/",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    badge: "bg-teal-500/10 text-teal-400",
  },
  {
    icon: <Bank size={22} weight="fill" />,
    name: "International Monetary Fund",
    category: "Economies & budgets",
    desc: "The World Economic Outlook's figures and projections, and government spending by function.",
    url: "https://www.imf.org/en/Data",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    badge: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: <BookOpen size={22} weight="fill" />,
    name: "CIA World Factbook",
    category: "People, law & government",
    desc: "Languages, religions and peoples; legal systems, constitutions, courts, executives and legislatures. Its final edition, of January 2026, in the public domain.",
    url: "https://github.com/factbook/factbook.json",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    badge: "bg-violet-500/10 text-violet-400",
  },
  {
    icon: <ShieldCheck size={22} weight="fill" />,
    name: "UK Foreign, Commonwealth & Development Office",
    category: "Travel advice & local laws",
    desc: "Where travel is advised against, and what is illegal and legal in each country. Contains public sector information licensed under the Open Government Licence v3.0.",
    url: "https://www.gov.uk/foreign-travel-advice",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: <ShieldCheck size={22} weight="fill" />,
    name: "US Department of State and CDC",
    category: "Advisories & health notices",
    desc: "Travel advisories and travel health notices, in the public domain.",
    url: "https://travel.state.gov",
    color: "text-red-400",
    bg: "bg-red-500/10",
    badge: "bg-red-500/10 text-red-400",
  },
  {
    icon: <Scales size={22} weight="fill" />,
    name: "Varieties of Democracy (V-Dem) and Freedom House",
    category: "Rights & liberties",
    desc: "V-Dem's indices of liberties and of who lives under which kind of government; Freedom House's scores of political rights and civil liberties.",
    url: "https://v-dem.net",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: <Sword size={22} weight="fill" />,
    name: "UCDP and SIPRI",
    category: "Conflict & defence",
    desc: "Deaths in armed conflict from the Uppsala Conflict Data Program, and military spending from SIPRI.",
    url: "https://ucdp.uu.se",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/10 text-orange-400",
  },
  {
    icon: <Gavel size={22} weight="fill" />,
    name: "UNODC",
    category: "Crime & justice",
    desc: "Homicide and other recorded crime, people at each stage of a justice system, and those who staff it.",
    url: "https://dataunodc.un.org",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: <Users size={22} weight="fill" />,
    name: "ILO and Eurostat",
    category: "Work across countries",
    desc: "Earnings and minimum wages from ILOSTAT, and Europe's journeys to work and city statistics from Eurostat.",
    url: "https://ilostat.ilo.org",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    badge: "bg-yellow-500/10 text-yellow-400",
  },
  {
    icon: <Leaf size={22} weight="fill" />,
    name: "NOAA, NASA and NSIDC",
    category: "Climate",
    desc: "The Oceanic Niño Index, global temperature, carbon dioxide, sea ice and coral reef watch.",
    url: "https://www.noaa.gov",
    color: "text-green-400",
    bg: "bg-green-500/10",
    badge: "bg-green-500/10 text-green-400",
  },
  {
    icon: <Lightning size={22} weight="fill" />,
    name: "GDACS",
    category: "Disasters now",
    desc: "The Global Disaster Alert and Coordination System's orange and red alerts, with each event's own account.",
    url: "https://www.gdacs.org",
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    badge: "bg-lime-500/10 text-lime-400",
  },
  {
    icon: <MapPin size={22} weight="fill" />,
    name: "Natural Earth and GeoNames",
    category: "Maps & places",
    desc: "The outlines of countries and their divisions, rivers, ports and roads; and the world's towns and villages.",
    url: "https://www.naturalearthdata.com",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    badge: "bg-fuchsia-500/10 text-fuchsia-400",
  },
  {
    icon: <Article size={22} weight="fill" />,
    name: "Wikidata and Wikipedia",
    category: "Records & history",
    desc: "Office-holders, a place's history and the year's events - used beside other sources, each linked at the revision read.",
    url: "https://www.wikidata.org",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    badge: "bg-slate-500/10 text-slate-400",
  },
];

/* The pages of the site, as the sidebar names them. */
const SITE_PAGES = [
  { icon: <Globe size={18} weight="fill" />, label: "Countries", desc: `${countriesData.length} countries and territories`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: <Buildings size={18} weight="fill" />, label: "US States", desc: "All fifty, with their counties", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: <MapPin size={18} weight="fill" />, label: "Municipalities", desc: "States, provinces, counties, towns and villages", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: <Buildings size={18} weight="fill" />, label: "Cities", desc: "The world's cities, with each one's laws", color: "text-sky-400", bg: "bg-sky-500/10" },
  { icon: <ChartBar size={18} weight="fill" />, label: "Economies", desc: "Output, tax, inflation, deficits and resources", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: <Flag size={18} weight="fill" />, label: "World Leaders", desc: "Who governs, and the wealthiest families", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { icon: <Article size={18} weight="fill" />, label: "Policy", desc: "What governments spend, with a calculator", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: <Ranking size={18} weight="fill" />, label: "Compare", desc: "Figures and systems of government, side by side", color: "text-secondary", bg: "bg-secondary/10" },
  { icon: <Lightning size={18} weight="fill" />, label: "Trends", desc: "Where the figures are heading", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: <Globe size={18} weight="fill" />, label: "Worldview", desc: "The world as a whole", color: "text-teal-400", bg: "bg-teal-500/10" },
  { icon: <Users size={18} weight="fill" />, label: "Human Rights", desc: "Liberties, and humanitarian need and aid", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: <Leaf size={18} weight="fill" />, label: "Climate", desc: "Disasters now, and the state of the living world", color: "text-green-400", bg: "bg-green-500/10" },
  { icon: <Gavel size={18} weight="fill" />, label: "Crime Statistics", desc: "Crime and justice", color: "text-rose-400", bg: "bg-rose-500/10" },
  { icon: <MapPin size={18} weight="fill" />, label: "World Maps", desc: "Maps to the county and the district", color: "text-lime-400", bg: "bg-lime-500/10" },
  { icon: <BookOpen size={18} weight="fill" />, label: "My Notes", desc: "A note on any place or page", color: "text-purple-400", bg: "bg-purple-500/10" },
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
              CommonSphere is built for researchers, analysts, journalists and
              citizens who want to understand how the world is governed - from
              countries and US states down to counties, cities, towns and
              villages, with their economies, leaders, laws, rights, climate and
              crime, each figure from the body that publishes it.
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
                      className="text-sm text-muted-foreground font-sans leading-relaxed">{decodeEntities(v.desc)}</p>
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
                The publishers the site's figures are drawn from. Each figure names
                its own beside it, with its year and a link; the Terms &amp; Policies
                page says under what licence each is used.
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
                The pages of the site, as the sidebar names them. Each opens on
                its own figures, and every place on it has a window of its own.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {SITE_PAGES.map((item) => (
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
