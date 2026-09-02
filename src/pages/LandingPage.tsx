import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  ArrowRight,
  MagnifyingGlass,
  Moon,
  Sun,
  ShieldCheck,
  BookmarkSimple,
  FolderOpen,
  ChartLine,
  Scales,
  Newspaper,
  FlowArrow,
  ChartBar,
  MapPin,
  Cpu,
  Export,
  UsersThree,
  CheckCircle,
  Star,
  CaretDown,
} from "@phosphor-icons/react";

// ─── Sample country/state cards ──────────────────────────────────────
const SAMPLE_CARDS = [
  {
    name: "United States",
    abbr: "US",
    capital: "Washington D.C.",
    flag: "https://flagcdn.com/w320/us.png",
    demPct: 51,
    repPct: 49,
    economicStatus: "Very High Income",
    economicPct: 88,
    gdpPerCapita: "$76.3k",
    population: "335M",
    growth: "+1.1%",
    crimeRate: "369/100k",
    homePrice: "$412k",
    topEnergy: "Natural Gas",
    homeless: "582k",
  },
  {
    name: "Germany",
    abbr: "DE",
    capital: "Berlin",
    flag: "https://flagcdn.com/w320/de.png",
    demPct: 44,
    repPct: 56,
    economicStatus: "High Income",
    economicPct: 74,
    gdpPerCapita: "$51.4k",
    population: "84M",
    growth: "+0.4%",
    crimeRate: "295/100k",
    homePrice: "$385k",
    topEnergy: "Wind",
    homeless: "49k",
  },
  {
    name: "Japan",
    abbr: "JP",
    capital: "Tokyo",
    flag: "https://flagcdn.com/w320/jp.png",
    demPct: 39,
    repPct: 61,
    economicStatus: "High Income",
    economicPct: 71,
    gdpPerCapita: "$33.8k",
    population: "125M",
    growth: "-0.2%",
    crimeRate: "138/100k",
    homePrice: "$290k",
    topEnergy: "Nuclear",
    homeless: "5.5k",
  },
];

// ─── Circular text words ─────────────────────────────────────────────
const CIRCLE_WORDS = [
  "PEACE",
  "FREEDOM",
  "EQUALITY",
  "DIVERSITY",
  "UNITY",
  "JUSTICE",
];

// ─── Stats ───────────────────────────────────────────────────────────
const STATS = [
  { value: "195+", label: "Countries Tracked" },
  { value: "50", label: "US States" },
  { value: "1200+", label: "Data Metrics" },
  { value: "30", label: "Major Cities" },
];

// ─── Full capabilities ────────────────────────────────────────────────
const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    desc: "Account management with Supabase — sign in, protect your data, and sync preferences across devices.",
    tag: "Auth",
  },
  {
    icon: BookmarkSimple,
    title: "Persistent Bookmarks",
    desc: "Bookmark any state, country, news item, or event. Access your saved content from anywhere.",
    tag: "Saved Content",
  },
  {
    icon: FolderOpen,
    title: "Custom Collections",
    desc: "Organise bookmarks into named collections — group by region, topic, or research project.",
    tag: "Organization",
  },
  {
    icon: Cpu,
    title: "Admin & API Dashboard",
    desc: "Source registry, request logs, and the World Bank indicator pulls that keep country and state figures current.",
    tag: "Admin",
  },
  {
    icon: FlowArrow,
    title: "Instant Filtering & Sorting",
    desc: "Filter and sort across all datasets — countries, states, metrics — instantly with no page reloads.",
    tag: "Data",
  },
  {
    icon: Star,
    title: "Custom Dashboard",
    desc: "Save metrics and charts to a personal dashboard. Build your own view of the world's data.",
    tag: "Personalization",
  },
  {
    icon: ChartLine,
    title: "Interactive Charts",
    desc: "Hover tooltips, drill-down breakdowns, and animated transitions across all visualizations.",
    tag: "Visualization",
  },
  {
    icon: Moon,
    title: "Dark & Light Mode",
    desc: "Switch between dark and light themes for comfortable viewing at any time of day.",
    tag: "UX",
  },
  {
    icon: MagnifyingGlass,
    title: "Comprehensive Search",
    desc: "Search across every page, state, country, metric, and data source from a single input.",
    tag: "Discovery",
  },
  {
    icon: Globe,
    title: "Responsive Design",
    desc: "Optimised for desktop, tablet, and mobile — glassmorphism UI with powder blue aesthetics.",
    tag: "Design",
  },
  {
    icon: Export,
    title: "Export Capabilities",
    desc: "Export data tables and visualizations to CSV, PNG, or PDF. Premium feature.",
    tag: "Premium",
  },
  {
    icon: Scales,
    title: "State-to-State Comparison",
    desc: "Compare any two or more US states side-by-side with synchronised visualizations.",
    tag: "Comparison",
  },
  {
    icon: ChartBar,
    title: "Real Polling Data",
    desc: "Aggregated polling from FiveThirtyEight, Pew Research Center, and RealClearPolitics.",
    tag: "Politics",
  },
  {
    icon: MapPin,
    title: "Global Cities Analytics",
    desc: "Deep metrics across 30 major metropolitan areas covering economics, safety, and quality of life.",
    tag: "Cities",
  },
  {
    icon: UsersThree,
    title: "Comparative Analysis",
    desc: "Compare states, countries, and cities across dozens of categories with aligned charts.",
    tag: "Analysis",
  },
  {
    icon: ChartLine,
    title: "Historical Trends & Forecasting",
    desc: "Decades of historical data with trend-line overlays and forward-looking projections.",
    tag: "Trends",
  },
  {
    icon: Scales,
    title: "Legal & Governance Data",
    desc: "Legal system comparisons, governance scores, and index rankings from Heritage Foundation and Freedom House.",
    tag: "Governance",
  },
  {
    icon: Globe,
    title: "Energy & Environment",
    desc: "Energy production, consumption, renewables share, and environmental quality from the IEA.",
    tag: "Environment",
  },
  {
    icon: ShieldCheck,
    title: "Crime & Public Safety",
    desc: "Crime statistics, trends, and public safety indicators sourced from FBI Crime Data Explorer.",
    tag: "Safety",
  },
  {
    icon: Newspaper,
    title: "Health & Life Expectancy",
    desc: "Healthcare quality, life expectancy, disease burden, and wellness data from the WHO.",
    tag: "Health",
  },
  {
    icon: CheckCircle,
    title: "Education & Literacy",
    desc: "Educational attainment, literacy rates, and school enrollment data from the UN and OECD.",
    tag: "Education",
  },
];

// ─── Data sources ─────────────────────────────────────────────────────
const DATA_SOURCES = [
  { name: "United Nations Development Programme", abbr: "UNDP", color: "sky" },
  { name: "World Bank", abbr: "WB", color: "blue" },
  { name: "International Monetary Fund", abbr: "IMF", color: "indigo" },
  { name: "US Census Bureau", abbr: "Census", color: "violet" },
  { name: "Bureau of Labor Statistics", abbr: "BLS", color: "purple" },
  { name: "FBI Crime Data Explorer", abbr: "FBI", color: "sky" },
  { name: "WHO Global Health Observatory", abbr: "WHO", color: "blue" },
  { name: "OECD Statistics", abbr: "OECD", color: "indigo" },
  { name: "Heritage Foundation", abbr: "Heritage", color: "violet" },
  { name: "Freedom House", abbr: "Freedom", color: "purple" },
  { name: "International Energy Agency", abbr: "IEA", color: "sky" },
  { name: "Olympic Committee Records", abbr: "IOC", color: "blue" },
  { name: "FiveThirtyEight", abbr: "538", color: "indigo" },
  { name: "Pew Research Center", abbr: "Pew", color: "violet" },
  { name: "RealClearPolitics", abbr: "RCP", color: "purple" },
  { name: "NewsAPI", abbr: "News", color: "sky" },
  { name: "ProPublica Congress API", abbr: "ProPublica", color: "blue" },
];

// ─── Tag color map ────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  Auth: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Saved Content": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Organization: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Data: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Personalization: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Visualization: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  UX: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Discovery: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Design: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Premium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Comparison: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Politics: "bg-red-500/10 text-red-400 border-red-500/20",
  Cities: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Analysis: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Trends: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Governance: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Environment: "bg-green-500/10 text-green-400 border-green-500/20",
  Safety: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Health: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Education: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// ─── Navigation Dropdown ─────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "EXPLORE",
    emoji: "🌐",
    items: [
      { label: "US States", path: "/explore/states" },
      { label: "Cities", path: "/explore/cities" },
      { label: "Countries", path: "/explore/countries" },
      { label: "Economies", path: "/explore/economies" },
    ],
  },
  {
    label: "ANALYZE",
    emoji: "📊",
    items: [
      { label: "Policy Hub", path: "/analyze/policy-hub" },
      { label: "Congress", path: "/analyze/congress" },
      { label: "Policy Positions", path: "/analyze/policy-positions" },
      { label: "Research Notes", path: "/analyze/research-notes" },
    ],
  },
  {
    label: "LEARN",
    emoji: "🎓",
    items: [
      { label: "Quizzes", path: "/learn/quizzes" },
      { label: "Political Library", path: "/learn/political-library" },
    ],
  },
  {
    label: "SUPPORT",
    emoji: "💛",
    items: [{ label: "Memberships", path: "/support/memberships" }],
  },
];

function NavDropdown({
  dark,
  navigate,
  subFg,
  fg,
  navBg,
}: {
  dark: boolean;
  navigate: (path: string) => void;
  subFg: string;
  fg: string;
  navBg: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownBg = dark
    ? "bg-[#0d1f35] border-slate-700/70 shadow-xl shadow-black/40"
    : "bg-white border-gray-200 shadow-xl shadow-gray-200/60";

  const itemHover = dark
    ? "hover:bg-slate-700/50 text-slate-200 hover:text-white"
    : "hover:bg-gray-50 text-gray-700 hover:text-gray-900";

  const sectionLabel = dark ? "text-slate-500" : "text-gray-400";
  const divider = dark ? "border-slate-700/60" : "border-gray-100";

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-sm font-medium ${subFg} cursor-pointer hover:text-sky-400 transition-colors px-1 py-1`}
      >
        Navigation
        <CaretDown
          size={11}
          weight="bold"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-52 rounded-xl border overflow-hidden z-50 ${dropdownBg}`}
        >
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div className={`border-t ${divider}`} />}
              {/* Section header */}
              <div className={`flex items-center gap-2 px-4 pt-3 pb-1`}>
                <span className="text-[13px]">{section.emoji}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${sectionLabel}`}
                >
                  {section.label}
                </span>
              </div>
              {/* Items */}
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-100 ${itemHover}`}
                >
                  {item.label}
                </button>
              ))}
              {si === NAV_SECTIONS.length - 1 && <div className="pb-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Circular SVG text ────────────────────────────────────────────────
function CircularText({
  words,
  radius,
  speed,
  dark,
}: {
  words: string[];
  radius: number;
  speed: number;
  dark: boolean;
}) {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastRef.current) {
        setAngle((a) => (a + ((ts - lastRef.current) / 1000) * speed) % 360);
      }
      lastRef.current = ts;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  const full = words.map((w) => w + "  ·  ").join("");
  const chars = full.split("");
  const total = chars.length;
  const arcPerChar = 360 / total;
  const dotColor = dark ? "#94a3b8" : "#9ca3af";
  const textColor = dark ? "#0f172a" : "#374151";

  return (
    <svg
      viewBox={`${-radius - 30} ${-radius - 30} ${(radius + 30) * 2} ${(radius + 30) * 2}`}
      className="w-full h-full"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {chars.map((ch, i) => {
        const charAngle = i * arcPerChar - 90;
        const rad = (charAngle * Math.PI) / 180;
        const x = radius * Math.cos(rad);
        const y = radius * Math.sin(rad);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={radius * 0.095}
            fill={ch === "·" ? dotColor : textColor}
            fontFamily="Georgia, serif"
            fontWeight="700"
            style={{
              transform: `rotate(${charAngle + 90}deg)`,
              transformOrigin: `${x}px ${y}px`,
            }}
          >
            {ch}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────
function AnimatedNumber({ target }: { target: string }) {
  const [displayed, setDisplayed] = useState("0");
  useEffect(() => {
    const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ""));
    const suffix = target.replace(/[0-9.]/g, "");
    if (isNaN(numericTarget)) {
      setDisplayed(target);
      return;
    }
    const duration = 1800;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(eased * numericTarget) + suffix);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <span>{displayed}</span>;
}

// ─── Main component ───────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [search, setSearch] = useState("");
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Theme tokens
  const bg = dark ? "bg-[#06101f]" : "bg-[#f8fafc]";
  const fg = dark ? "text-white" : "text-gray-900";
  const subFg = dark ? "text-slate-400" : "text-gray-500";
  const cardBg = dark
    ? "bg-[#0d1f35]/80 border-slate-700/60 hover:border-sky-500/40"
    : "bg-white border-gray-200 hover:border-sky-400/60";
  const navBg = dark
    ? "bg-[#06101f]/90 border-slate-800"
    : "bg-white/90 border-gray-200";
  const inputBg = dark
    ? "bg-[#0d1f35] border-slate-600 text-white placeholder-slate-400"
    : "bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400";
  const pillBg = dark
    ? "bg-[#0d1f35] border-slate-700 text-slate-300 hover:border-sky-500/50 hover:text-sky-300"
    : "bg-white border-gray-200 text-gray-600 hover:border-sky-400 hover:text-sky-600";
  const sectionDivider = dark ? "border-slate-800" : "border-gray-100";
  const sectionAlt = dark ? "bg-[#080f1d]" : "bg-white";

  // Filter tags
  const allTags = [
    "All",
    ...Array.from(new Set(CAPABILITIES.map((c) => c.tag))),
  ];
  const filtered =
    activeFilter === "All"
      ? CAPABILITIES
      : CAPABILITIES.filter((c) => c.tag === activeFilter);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div
      className={`min-h-screen ${bg} ${fg} font-sans transition-colors duration-300`}
    >
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 backdrop-blur-md border-b ${navBg} transition-colors duration-300`}
      >
        <div className="flex items-center gap-2 mr-auto">
          <Globe size={24} weight="fill" className="text-sky-400" />
          <span className="font-bold text-sm tracking-tight">CommonSphere</span>
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center flex-1 max-w-sm mx-8 relative"
        >
          <MagnifyingGlass
            size={14}
            className={`absolute left-3 ${dark ? "text-slate-400" : "text-gray-400"} pointer-events-none`}
          />
          <input
            type="search"
            placeholder="Search pages, states, countries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-8 pr-4 py-1.5 rounded-full text-xs border outline-none focus:ring-1 focus:ring-sky-400 ${inputBg} transition-colors duration-300`}
          />
        </form>

        <div className="flex items-center gap-3 ml-auto">
          <NavDropdown
            dark={dark}
            navigate={navigate}
            subFg={subFg}
            fg={fg}
            navBg={navBg ?? ""}
          />
          <button
            onClick={() => setDark((d) => !d)}
            className={`p-2 rounded-full border transition-colors duration-200 ${dark ? "border-slate-700 text-slate-300 hover:text-white bg-[#0d1f35]" : "border-gray-200 text-gray-500 hover:text-gray-900 bg-gray-100"}`}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            Open App
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-14 min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background: dark = subtle radial glow; light = US-banner blue gradient */}
        <div className="absolute inset-0 pointer-events-none">
          {dark ? (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-sky-900/15 blur-3xl" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-700/20" />
          )}
        </div>

        {/* Circular ring */}
        <div className="relative w-[520px] h-[520px] max-w-[90vw] max-h-[90vw] flex items-center justify-center">
          <div className="absolute inset-0">
            <CircularText
              words={CIRCLE_WORDS}
              radius={230}
              speed={8}
              dark={!dark}
            />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-[300px]">
            <Globe size={38} weight="fill" className="text-sky-400 mb-4" />
            <h1
              className={`text-4xl sm:text-5xl font-bold tracking-tight mb-3 ${fg}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              CommonSphere
            </h1>
            <div
              className={`w-16 h-px ${dark ? "bg-slate-600" : "bg-gray-300"} mx-auto mb-3`}
            />
            <p className={`text-sm leading-relaxed ${subFg}`}>
              Explore data and insights for all 50 US states and 195+ countries
              worldwide
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mt-2 px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all shadow-lg shadow-sky-500/25"
          >
            Explore Dashboard <ArrowRight size={15} weight="bold" />
          </button>
          <button
            onClick={() => navigate("/dashboard/collections")}
            className={`flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full border transition-all ${dark ? "border-slate-600 text-slate-200 hover:border-sky-400 hover:text-sky-400" : "border-gray-300 text-gray-700 hover:border-sky-500 hover:text-sky-500"}`}
          >
            Browse Collections
          </button>
        </div>

        {/* Source pills */}
        <div className="mt-8 px-6 max-w-2xl text-center">
          <p className={`text-xs mb-3 ${subFg}`}>Trusted data from</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "World Bank",
              "IMF",
              "United Nations",
              "WHO",
              "OECD",
              "Pew Research",
              "FiveThirtyEight",
            ].map((s) => (
              <span
                key={s}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${pillBg}`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 ${subFg} text-xs animate-bounce`}
        >
          <span>Scroll</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        ref={statsRef}
        className={`py-16 border-y ${sectionDivider} ${sectionAlt}`}
      >
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div
                className={`text-4xl font-bold mb-1 ${dark ? "text-sky-400" : "text-sky-600"}`}
              >
                {statsVisible ? <AnimatedNumber target={value} /> : "0"}
              </div>
              <div className={`text-sm ${subFg}`}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Capabilities ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span
              className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-sky-400" : "text-sky-600"}`}
            >
              Platform Capabilities
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold mt-2 mb-3 ${fg}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              Everything you need, nothing you don&#39;t
            </h2>
            <p className={`text-sm max-w-xl mx-auto ${subFg}`}>
              21 integrated capabilities spanning data exploration,
              personalization, political intelligence, and comparative analysis.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium ${
                  activeFilter === tag
                    ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                    : dark
                      ? "bg-transparent border-slate-700 text-slate-400 hover:border-sky-500/50 hover:text-sky-300"
                      : "bg-white border-gray-200 text-gray-500 hover:border-sky-400 hover:text-sky-600"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Capabilities grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className={`rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl backdrop-blur-sm ${cardBg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg ${dark ? "bg-sky-500/10" : "bg-sky-50"}`}
                  >
                    <Icon
                      size={18}
                      className={dark ? "text-sky-400" : "text-sky-600"}
                      weight="duotone"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                  >
                    {tag}
                  </span>
                </div>
                <h3 className={`font-semibold text-sm mb-1.5 ${fg}`}>
                  {title}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${subFg}`}
                  dangerouslySetInnerHTML={{ __html: desc }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Sources ── */}
      <section
        className={`py-20 px-6 border-y ${sectionDivider} ${sectionAlt}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span
              className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-sky-400" : "text-sky-600"}`}
            >
              Data Sources & Methodology
            </span>
            <h2
              className={`text-3xl font-bold mt-2 mb-3 ${fg}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              Built on verified, reputable data
            </h2>
            <p className={`text-sm max-w-xl mx-auto ${subFg}`}>
              CommonSphere aggregates data from international organizations and
              government agencies, with country and state indicators pulled from
              the World Bank. Every data point is traceable.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {DATA_SOURCES.map(({ name, abbr }) => (
              <div
                key={abbr}
                className={`rounded-lg border p-3 flex flex-col items-center text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${cardBg}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${dark ? "bg-sky-500/10 text-sky-400" : "bg-sky-50 text-sky-600"}`}
                >
                  {abbr.slice(0, 3)}
                </div>
                <span
                  className={`text-[10px] leading-tight font-medium ${subFg}`}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`mt-8 rounded-xl border p-5 ${dark ? "bg-[#0d1f35]/60 border-slate-700/60" : "bg-sky-50/60 border-sky-100"}`}
          >
            <div className="flex flex-wrap gap-6 justify-center text-center">
              {[
                {
                  label: "Live API",
                  value: "1",
                  desc: "World Bank indicators, refreshed in-app",
                },
                {
                  label: "Data Sources",
                  value: "17",
                  desc: "International organizations & agencies",
                },
                {
                  label: "Update Frequency",
                  value: "30 min",
                  desc: "World Bank pull while a tab is open",
                },
                {
                  label: "Historical Depth",
                  value: "60+ yrs",
                  desc: "Time-series going back decades",
                },
              ].map(({ label, value, desc }) => (
                <div key={label} className="min-w-[120px]">
                  <div
                    className={`text-2xl font-bold ${dark ? "text-sky-400" : "text-sky-600"}`}
                  >
                    {value}
                  </div>
                  <div className={`text-xs font-semibold mt-0.5 ${fg}`}>
                    {label}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${subFg}`}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Scrolling sources marquee ── */}
      <section className={`py-10 overflow-hidden border-b ${sectionDivider}`}>
        <p
          className={`text-center text-[10px] mb-5 ${subFg} uppercase tracking-widest`}
        >
          Verified Institutions
        </p>
        <div className="relative flex">
          <div
            className="flex gap-5 whitespace-nowrap"
            style={{ animation: "marquee 32s linear infinite" }}
          >
            {[...DATA_SOURCES, ...DATA_SOURCES].map((s, i) => (
              <span
                key={i}
                className={`text-xs font-medium px-4 py-2 rounded-full border shrink-0 transition-colors ${pillBg}`}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── US / World Split ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* US States */}
          <div
            className={`rounded-2xl border p-8 ${dark ? "bg-[#0d1f35]/80 border-slate-700/60" : "bg-white border-gray-200"}`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-widest mb-4 ${dark ? "text-sky-400" : "text-sky-600"}`}
            >
              United States
            </div>
            <h3
              className={`text-2xl font-bold mb-3 ${fg}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              50 States. Every Metric.
            </h3>
            <p className={`text-sm leading-relaxed mb-6 ${subFg}`}>
              Crime, health, education, economics, voting patterns, and
              governance data for every US state. Compare side-by-side with
              synchronised visualizations.
            </p>
            <ul className="space-y-2">
              {[
                "State-to-state comparison tools",
                "Real polling aggregates (538, Pew, RCP)",
                "BLS employment & labor data",
                "FBI crime statistics",
              ].map((item) => (
                <li
                  key={item}
                  className={`flex items-center gap-2 text-xs ${subFg}`}
                >
                  <CheckCircle
                    size={14}
                    className={dark ? "text-sky-400" : "text-sky-600"}
                    weight="fill"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/dashboard")}
              className={`mt-6 flex items-center gap-1.5 text-xs font-semibold group ${dark ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-500"}`}
            >
              Explore States{" "}
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
                weight="bold"
              />
            </button>
          </div>

          {/* World */}
          <div
            className={`rounded-2xl border p-8 ${dark ? "bg-[#0d1f35]/80 border-slate-700/60" : "bg-white border-gray-200"}`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-widest mb-4 ${dark ? "text-violet-400" : "text-violet-600"}`}
            >
              Global
            </div>
            <h3
              className={`text-2xl font-bold mb-3 ${fg}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              195+ Countries. One Platform.
            </h3>
            <p className={`text-sm leading-relaxed mb-6 ${subFg}`}>
              GDP, HDI, freedom scores, energy, healthcare, and more across
              every nation on Earth. Plus city-level analytics for 30 major
              metros.
            </p>
            <ul className="space-y-2">
              {[
                "World Bank & IMF economic indicators",
                "WHO health & life expectancy data",
                "Heritage & Freedom House governance scores",
                "IEA energy & environmental metrics",
                "30 major metropolitan areas",
              ].map((item) => (
                <li
                  key={item}
                  className={`flex items-center gap-2 text-xs ${subFg}`}
                >
                  <CheckCircle
                    size={14}
                    className={dark ? "text-violet-400" : "text-violet-600"}
                    weight="fill"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/dashboard")}
              className={`mt-6 flex items-center gap-1.5 text-xs font-semibold group ${dark ? "text-violet-400 hover:text-violet-300" : "text-violet-600 hover:text-violet-500"}`}
            >
              Explore Countries{" "}
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
                weight="bold"
              />
            </button>
          </div>
        </div>
      </section>

      {/* ── Country/State Preview Cards ── */}
      <section className={`py-20 px-6 border-t ${sectionDivider}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span
              className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-sky-400" : "text-sky-600"}`}
            >
              Data Cards
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-bold mt-2 mb-3 ${fg}`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              Rich detail for every country
            </h2>
            <p className={`text-sm max-w-xl mx-auto ${subFg}`}>
              Each country and state gets a detailed card with political
              balance, economic status, and key metrics at a glance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_CARDS.map((card) => {
              const growthPositive = !card.growth.startsWith("-");
              return (
                <div
                  key={card.abbr}
                  className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${
                    dark
                      ? "bg-[#0d1f35]/80 border-slate-700/60 hover:border-sky-500/50 shadow-lg shadow-black/20"
                      : "bg-white border-[#c8e4f0] hover:border-sky-400/60 shadow-md shadow-sky-100/40"
                  }`}
                >
                  {/* Flag */}
                  <div
                    className={`w-full h-44 overflow-hidden ${dark ? "bg-slate-800" : "bg-[#ddf0f8]"}`}
                  >
                    <img
                      src={card.flag}
                      alt={`${card.name} flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Name row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`font-bold text-base leading-tight ${fg}`}
                        >
                          {card.name}
                        </h3>
                        <p className={`text-xs mt-0.5 ${subFg}`}>
                          {card.abbr} · {card.capital}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium mt-0.5 shrink-0 ${subFg}`}
                      >
                        Political
                      </span>
                    </div>

                    {/* Political split */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-500">
                        {card.demPct}%
                      </span>
                      <div className="flex-1 flex h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500"
                          style={{ width: `${card.demPct}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${card.repPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-red-500">
                        {card.repPct}%
                      </span>
                    </div>

                    {/* Economic status */}
                    <div
                      className={`rounded-lg px-3 py-2 ${dark ? "bg-[#061525]/60 border border-slate-700/50" : "bg-[#eef7fc] border border-[#c8e4f0]"}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-medium ${subFg}`}>
                          Economic Status
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${dark ? "text-slate-200" : "text-gray-700"}`}
                        >
                          {card.economicStatus}
                        </span>
                      </div>
                      {/* Gradient bar: red → orange → yellow → green */}
                      <div
                        className="relative h-2 rounded-full overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)",
                        }}
                      >
                        <div
                          className="absolute top-0 h-full rounded-full bg-white/20"
                          style={{ left: 0, width: `${card.economicPct}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-400 shadow"
                          style={{ left: `calc(${card.economicPct}% - 5px)` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-red-400">
                          ● Poverty
                        </span>
                        <span className={`text-[9px] ${subFg}`}>
                          {card.gdpPerCapita}
                        </span>
                        <span className="text-[9px] text-green-400">
                          ● Wealth
                        </span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        {
                          icon: "👥",
                          label: "Population",
                          value: card.population,
                        },
                        {
                          icon: "📈",
                          label: "Growth",
                          value: card.growth,
                          highlight: growthPositive
                            ? "text-emerald-400"
                            : "text-rose-400",
                        },
                        {
                          icon: "🔴",
                          label: "Crime Rate",
                          value: card.crimeRate,
                        },
                        {
                          icon: "🏠",
                          label: "Home Price",
                          value: card.homePrice,
                        },
                        {
                          icon: "⚡",
                          label: "Top Energy",
                          value: card.topEnergy,
                        },
                        { icon: "⚠️", label: "Homeless", value: card.homeless },
                      ].map(({ icon, label, value, highlight }) => (
                        <div key={label}>
                          <div
                            className={`text-[10px] flex items-center gap-1 ${subFg}`}
                          >
                            <span>{icon}</span> {label}
                          </div>
                          <div
                            className={`text-xs font-bold mt-0.5 ${highlight || fg}`}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info icon row */}
                    <div className="flex justify-end mt-1">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${dark ? "border-slate-600 text-slate-400" : "border-gray-300 text-gray-400"}`}
                      >
                        ⓘ
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm px-7 py-3 rounded-full transition-all shadow-lg shadow-sky-500/20"
            >
              Browse All Countries <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className={`py-24 px-6 text-center border-t ${sectionDivider} ${sectionAlt}`}
      >
        <div className="max-w-2xl mx-auto">
          {dark && (
            <div className="absolute left-1/2 -translate-x-1/2 w-96 h-40 bg-sky-900/20 blur-3xl rounded-full pointer-events-none" />
          )}
          <Globe
            size={40}
            weight="fill"
            className={`mx-auto mb-5 ${dark ? "text-sky-400" : "text-sky-500"}`}
          />
          <h2
            className={`text-3xl sm:text-4xl font-bold mb-4 relative ${fg}`}
            style={{ fontFamily: "Georgia, serif" }}
          >
            The world&#39;s data, clearly understood
          </h2>
          <p className={`text-sm mb-8 max-w-md mx-auto ${subFg}`}>
            Join CommonSphere and explore every country, every state, every
            metric — in real time, with verified sources and beautiful
            visualizations.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-lg shadow-sky-500/25 text-sm"
            >
              Get Started Free <ArrowRight size={15} weight="bold" />
            </button>
            <button
              onClick={() => {
                document
                  .querySelector("#capabilities")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full border text-sm transition-all ${dark ? "border-slate-600 text-slate-300 hover:border-sky-400 hover:text-sky-400" : "border-gray-300 text-gray-700 hover:border-sky-400 hover:text-sky-500"}`}
            >
              See Capabilities
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className={`border-t py-10 px-6 ${sectionDivider} ${dark ? "text-slate-500" : "text-gray-400"}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={18} weight="fill" className="text-sky-400" />
                <span className={`font-bold text-sm ${fg}`}>CommonSphere</span>
              </div>
              <p className="leading-relaxed">
                The world&#39;s data, aggregated and verified for everyone.
              </p>
            </div>
            <div>
              <div
                className={`font-semibold mb-3 text-xs uppercase tracking-wider ${fg}`}
              >
                Platform
              </div>
              <ul className="space-y-2">
                {["Dashboard", "Collections", "Trends", "Comparisons"].map(
                  (l) => (
                    <li key={l}>
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard${l === "Dashboard" ? "" : "/" + l.toLowerCase()}`,
                          )
                        }
                        className="hover:text-sky-400 transition-colors"
                      >
                        {l}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <div
                className={`font-semibold mb-3 text-xs uppercase tracking-wider ${fg}`}
              >
                Data
              </div>
              <ul className="space-y-2">
                {["World Bank", "IMF", "United Nations", "WHO", "OECD"].map(
                  (s) => (
                    <li key={s}>
                      <span>{s}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <div
                className={`font-semibold mb-3 text-xs uppercase tracking-wider ${fg}`}
              >
                Account
              </div>
              <ul className="space-y-2">
                {["Sign In", "Settings", "Bookmarks", "Collections"].map(
                  (l) => (
                    <li key={l}>
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard${l === "Sign In" ? "" : "/" + l.toLowerCase()}`,
                          )
                        }
                        className="hover:text-sky-400 transition-colors"
                      >
                        {l}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
          <div
            className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] ${sectionDivider}`}
          >
            <p>
              © {new Date().getFullYear()} CommonSphere. All data sourced from
              verified institutions.
            </p>
            <p>
              Data updated regularly · Methodology documented for transparency
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
