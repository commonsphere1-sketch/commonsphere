import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Star,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  EnvelopeSimple,
  Sparkle,
  CreditCard,
  ShieldCheck,
  PencilLine,
  IdentificationBadge,
  UploadSimple,
  Article,
  Warning,
  Seal,
  Globe,
  MapTrifold,
  ChartBar,
  ChartLineUp,
  Buildings,
  Newspaper,
  Flag,
  UserCircle,
  BookOpen,
  BellSimple,
  Cpu,
  Users,
  FileText,
  MagnifyingGlass,
  Briefcase,
  TreeStructure,
  Heartbeat,
  Scales,
  Atom,
  Fingerprint,
  ExportSimple,
  Clipboard,
  NotePencil,
  MapPin,
} from "@phosphor-icons/react";

// ─── Entitlement Matrix ───────────────────────────────────────────────────────

const PLANS = [
  {
    id: "student",
    name: "Student",
    price: "$0",
    period: "while enrolled",
    borderClass: "border-emerald-500/40",
    badge: null,
    btnClass:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
    accentClass: "text-emerald-400",
    checkClass: "text-emerald-400",
    desc: "Full Research-tier access, free for verified students & educators.",
    audience: "Students · Faculty · Academic institutions",
    note: "Requires .edu or institutional email — renewed annually.",
    features: [
      "Everything in the Professional plan — no paywalls",
      "All 195+ countries, 300+ cities & 50 US states",
      "Active conflicts, humanitarian & military data",
      "Crime statistics & planetary boundaries modules",
      "Congress tracker, policy hub & political library",
      "Research notes, clipboard & annotation tools",
      "Historical archives — 60+ years of data",
      "Export to CSV, PDF, and BibTeX citation format",
      "API access — unlimited calls during enrollment",
      "Collaborative research workspaces",
      "Unlimited bookmarks & collections",
      "Used by researchers at 200+ universities worldwide",
    ],
  },
  {
    id: "public",
    name: "Public",
    price: "$9",
    period: "per month",
    borderClass: "border-secondary/50 ring-2 ring-secondary/20",
    badge: "Most Popular",
    btnClass:
      "bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/20",
    accentClass: "text-secondary",
    checkClass: "text-secondary",
    desc: "Powerful intelligence for curious citizens, journalists & advocates.",
    audience: "General public · Journalists · Policy advocates",
    note: null,
    features: [
      "All 195+ countries with live global data",
      "300+ global city profiles",
      "All 50 US states — demographics, politics & economy",
      "Economy & GDP comparisons",
      "Political ideologies & parties explorer",
      "Polls & public opinion hub",
      "Global rankings, indexes & quizzes",
      "Political library & educational content",
      "Advanced multi-entity comparison tool",
      "Historical trend data (60+ years)",
      "Congress & policy positions tracker",
      "Active conflicts & military data",
      "Humanitarian crisis dashboard",
      "Crime statistics module",
      "Planetary boundaries & biosphere data",
      "International community profiles",
      "Export data to CSV, PNG & PDF",
      "Unlimited bookmarks & collections",
      "Priority data refresh",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$29",
    period: "per month",
    borderClass: "border-violet-500/40",
    badge: null,
    btnClass:
      "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20",
    accentClass: "text-violet-400",
    checkClass: "text-violet-400",
    desc: "Full-platform power for researchers, analysts & policy teams.",
    audience: "Researchers · Policy analysts · Data teams",
    note: null,
    features: [
      "Everything in Public",
      "Research notes & annotations hub",
      "Clipboard & clipping manager",
      "World map — choropleth overlays & custom layers",
      "Policy hub & public policy deep-dives",
      "Global metrics & society index panels",
      "Alerts & real-time notifications system",
      "API access for data integration & exports",
      "Team collaboration — up to 5 seats",
      "Advanced exports: CSV, PDF & BibTeX",
      "Dedicated research & priority support",
      "Wealth & inequality intelligence module",
      "Royal families & heads of state profiles",
      "Election countdown & calendar tracker",
    ],
  },
];

// ─── Feature grid (shown below plans) ────────────────────────────────────────

const FEATURE_GRID = [
  { icon: Globe, label: "195+ Countries", desc: "Live verified global data" },
  { icon: MapTrifold, label: "300+ Cities", desc: "Urban profiles & stats" },
  {
    icon: Buildings,
    label: "All 50 US States",
    desc: "Full state intelligence",
  },
  {
    icon: ChartLineUp,
    label: "100K+ Data Points",
    desc: "Continuously updated",
  },
  { icon: Flag, label: "Active Conflicts", desc: "Military & conflict data" },
  {
    icon: UserCircle,
    label: "Congress Tracker",
    desc: "Bills, votes & positions",
  },
  { icon: Newspaper, label: "Political Library", desc: "Ideologies & parties" },
  {
    icon: ShieldCheck,
    label: "Verified Sources",
    desc: "UN, World Bank, ILO & more",
  },
  { icon: Heartbeat, label: "Humanitarian", desc: "Crisis & aid data" },
  {
    icon: Fingerprint,
    label: "Crime Statistics",
    desc: "National & global stats",
  },
  {
    icon: Atom,
    label: "Planetary Boundaries",
    desc: "Biosphere & climate science",
  },
  { icon: Scales, label: "Policy Hub", desc: "Public policy deep-dives" },
];

// ─── Comparison table rows ────────────────────────────────────────────────────

type FeatureRow = {
  label: string;
  student: boolean | string;
  public: boolean | string;
  professional: boolean | string;
};

const COMPARISON_ROWS: FeatureRow[] = [
  {
    label: "Countries / Cities / States",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Political library & quizzes",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Global rankings & indexes",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Polls & public opinion hub",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Conflicts & military data",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Humanitarian crisis data",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Crime statistics module",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Planetary boundaries & biosphere",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Historical archives (60+ years)",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Advanced comparison tool",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Export (CSV, PNG, PDF)",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Unlimited bookmarks & collections",
    student: true,
    public: true,
    professional: true,
  },
  {
    label: "Bookmarks limit",
    student: "Unlimited",
    public: "Unlimited",
    professional: "Unlimited",
  },
  {
    label: "Research notes & annotations",
    student: true,
    public: false,
    professional: true,
  },
  {
    label: "Clipboard & clipping manager",
    student: true,
    public: false,
    professional: true,
  },
  {
    label: "Choropleth world map",
    student: true,
    public: false,
    professional: true,
  },
  {
    label: "Policy hub deep-dives",
    student: true,
    public: false,
    professional: true,
  },
  {
    label: "Alerts & notifications",
    student: true,
    public: false,
    professional: true,
  },
  {
    label: "API access",
    student: "Unlimited",
    public: false,
    professional: "Full",
  },
  { label: "BibTeX export", student: true, public: false, professional: true },
  {
    label: "Team seats",
    student: "Workspace",
    public: false,
    professional: "Up to 5",
  },
  {
    label: "Priority support",
    student: true,
    public: false,
    professional: true,
  },
];

// ─── EDU perks ────────────────────────────────────────────────────────────────

const EDU_PERKS = [
  "Full Professional plan — completely free for verified students & faculty",
  "Unlimited API calls during enrollment",
  "Collaborative research workspaces",
  "Export to CSV, PDF, and BibTeX citation format",
  "Priority data refresh & 60+ years of historical archives",
  "Access to conflicts, humanitarian, crime & planetary data",
  "Congress tracker, policy hub & political library",
  "Research notes, clipboard manager & annotation tools",
];

// ─── Analyst tiers ────────────────────────────────────────────────────────────

const ANALYST_TIERS = [
  {
    name: "Contributor",
    price: "$19",
    period: "per month",
    borderClass: "border-border",
    badge: null,
    btnClass: "bg-muted hover:bg-muted/80 text-foreground",
    accentClass: "text-sky-400",
    features: [
      "Publish up to 5 data reports/month",
      "Verified analyst badge on your profile",
      "Access to state & country data APIs",
      "Standard review queue (48 hrs)",
      "Basic analytics on your published data",
      "Community feed visibility",
    ],
  },
  {
    name: "Analyst",
    price: "$49",
    period: "per month",
    borderClass: "border-sky-500/40 ring-2 ring-sky-500/20",
    badge: "Most Popular",
    btnClass:
      "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20",
    accentClass: "text-sky-400",
    features: [
      "Unlimited data report publishing",
      "Priority review queue (12 hrs)",
      "Featured placement on relevant pages",
      "Full access to all platform datasets",
      "Detailed reader analytics & reach stats",
      "Embed charts directly in published reports",
      "Custom analyst profile page",
      "Email alerts when data is cited",
    ],
  },
  {
    name: "Institution",
    price: "$199",
    period: "per month",
    borderClass: "border-violet-500/40",
    badge: null,
    btnClass:
      "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20",
    accentClass: "text-violet-400",
    features: [
      "Everything in Analyst",
      "Up to 10 analyst seats under one org",
      "Whitelabeled org publisher profile",
      "Bulk data upload tools (CSV / API)",
      "Dedicated editorial review team",
      "Co-branded reports with your org logo",
      "Priority homepage & newsletter placement",
      "SLA — 4 hr review turnaround",
    ],
  },
];

const ANALYST_PROCESS = [
  {
    icon: IdentificationBadge,
    title: "Apply & Verify",
    desc: "Submit credentials. Our editorial team verifies your background within 2 business days.",
  },
  {
    icon: PencilLine,
    title: "Write Your Report",
    desc: "Use our built-in report editor with live chart embeds, citations, and data annotations.",
  },
  {
    icon: ShieldCheck,
    title: "Editorial Review",
    desc: "Every report is reviewed for factual accuracy and methodology before going live.",
  },
  {
    icon: UploadSimple,
    title: "Publish & Reach",
    desc: "Your verified report appears on relevant state, country, and topic data pages sitewide.",
  },
];

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = "plans" | "compare" | "edu" | "analyst";

// ─── Component ───────────────────────────────────────────────────────────────

export function MembershipsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("plans");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [eduError, setEduError] = useState("");

  const handleEduSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith(".edu")) {
      setEduError("Please enter a valid .edu email address.");
      return;
    }
    setEduError("");
    setSubmitted(true);
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "plans", label: "Plans & Pricing", icon: <CreditCard size={14} /> },
    {
      id: "compare",
      label: "Compare Plans",
      icon: <TreeStructure size={14} />,
    },
    {
      id: "analyst",
      label: "Official Analysts",
      icon: <IdentificationBadge size={14} />,
    },
    { id: "edu", label: "Edu / Students", icon: <GraduationCap size={14} /> },
  ];

  const inputCls =
    "w-full bg-background border border-border focus:border-secondary rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors";

  const CellValue = ({ val }: { val: boolean | string }) => {
    if (val === false)
      return (
        <span className="text-muted-foreground/30 text-base font-light">—</span>
      );
    if (val === true)
      return (
        <CheckCircle size={15} weight="fill" className="text-success mx-auto" />
      );
    return <span className="text-xs font-semibold text-foreground">{val}</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {/* ── Page Header ── */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary transition-colors"
            >
              <ArrowLeft size={14} weight="bold" /> Back
            </button>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-warning">
              Support
            </span>
            <h1 className="text-3xl font-bold font-sans text-foreground mt-1">
              Memberships
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl">
              Three plans built around how you engage with the world&#39;s data
              — whether you&#39;re studying, staying informed, or doing serious
              research.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {[
                "Countries",
                "US States",
                "Cities",
                "Economies",
                "Conflicts",
                "Humanitarian",
                "Crime Stats",
                "Congress",
                "Planetary Boundaries",
                "Rankings",
                "Policies",
                "World Map",
                "Research Notes",
                "API Access",
                "Alerts",
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium bg-muted/50 border border-border rounded-full px-2.5 py-1 text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                tab === t.id
                  ? "bg-secondary border-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-muted bg-card"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB: Plans & Pricing
        ══════════════════════════════════════════ */}
        {tab === "plans" && (
          <div className="space-y-6">
            {/* Audience callout strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: GraduationCap,
                  label: "Student",
                  sub: "Free with .edu",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/8 border-emerald-500/20",
                },
                {
                  icon: MagnifyingGlass,
                  label: "Public",
                  sub: "$9 / month",
                  color: "text-secondary",
                  bg: "bg-secondary/8 border-secondary/20",
                },
                {
                  icon: Briefcase,
                  label: "Professional",
                  sub: "$29 / month",
                  color: "text-violet-400",
                  bg: "bg-violet-500/8 border-violet-500/20",
                },
              ].map(({ icon: Icon, label, sub, color, bg }) => (
                <div
                  key={label}
                  className={`rounded-xl border p-4 text-center ${bg}`}
                >
                  <Icon size={22} className={`${color} mx-auto mb-1.5`} />
                  <div className={`text-sm font-bold ${color}`}>{label}</div>
                  <div className="text-muted-foreground text-xs">{sub}</div>
                </div>
              ))}
            </div>

            {/* Plan cards */}
            <div className="grid md:grid-cols-3 gap-5">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 flex flex-col bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${plan.borderClass}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={10} weight="fill" /> {plan.badge}
                    </div>
                  )}
                  <h2
                    className={`text-base font-bold mb-1 ${plan.accentClass}`}
                  >
                    {plan.name}
                  </h2>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold font-mono text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-xs mb-1">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-1">
                    {plan.desc}
                  </p>
                  <p
                    className={`text-[10px] font-medium mb-1 ${plan.accentClass}`}
                  >
                    {plan.audience}
                  </p>
                  {plan.note && (
                    <p className="text-[10px] text-muted-foreground/70 italic mb-1">
                      {plan.note}
                    </p>
                  )}
                  <div className="border-t border-border my-4" />
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle
                          size={14}
                          weight="fill"
                          className={`${plan.checkClass} shrink-0 mt-0.5`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${plan.btnClass}`}
                  >
                    {plan.id === "student"
                      ? "Verify Student Status"
                      : "Get Started"}
                  </button>
                </div>
              ))}
            </div>

            {/* What's included grid */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ChartBar size={14} className="text-secondary" /> What&#39;s
                covered across all plans
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FEATURE_GRID.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-secondary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA row */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setTab("compare")}
                className="flex items-center gap-2 text-secondary hover:text-secondary/80 text-sm font-semibold underline underline-offset-2 transition-colors"
              >
                See full feature comparison <ArrowRight size={13} />
              </button>
              <span className="text-border">|</span>
              <button
                onClick={() => setTab("edu")}
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-semibold underline underline-offset-2 transition-colors"
              >
                Student? Verify free access <GraduationCap size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: Compare Plans
        ══════════════════════════════════════════ */}
        {tab === "compare" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-4 bg-muted/40 border-b border-border">
              <div className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Feature
              </div>
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className="p-4 text-center border-l border-border"
                >
                  <div className={`text-sm font-bold ${p.accentClass}`}>
                    {p.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {p.price}/{p.id === "student" ? "enrolled" : "mo"}
                  </div>
                </div>
              ))}
            </div>
            {/* Feature rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
              >
                <div className="p-3 px-4 text-xs text-muted-foreground flex items-center">
                  {row.label}
                </div>
                <div className="p-3 flex items-center justify-center border-l border-border">
                  <CellValue val={row.student} />
                </div>
                <div className="p-3 flex items-center justify-center border-l border-border">
                  <CellValue val={row.public} />
                </div>
                <div className="p-3 flex items-center justify-center border-l border-border">
                  <CellValue val={row.professional} />
                </div>
              </div>
            ))}
            {/* Footer CTA */}
            <div className="grid grid-cols-4 bg-muted/40 border-t border-border">
              <div className="p-4" />
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className="p-3 border-l border-border flex justify-center"
                >
                  <button
                    className={`w-full py-2 rounded-lg font-semibold text-xs transition-all ${p.btnClass}`}
                  >
                    {p.id === "student" ? "Verify .edu" : "Get Started"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: Official Analysts
        ══════════════════════════════════════════ */}
        {tab === "analyst" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-xs font-semibold mb-3">
                <Seal size={13} weight="fill" /> Official Analyst Program
              </div>
              <h2 className="text-2xl font-bold font-sans text-foreground mb-2">
                Publish Verified Data & Reports on CommonSphere
              </h2>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Are you a policy researcher, economist, journalist, or academic?
                Apply for an Official Analyst subscription to publish verified
                reports directly on the pages users are already reading — state
                profiles, country dashboards, economy pages, and more.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  {
                    icon: Globe,
                    label: "Global Reach",
                    desc: "Your data surfaces on country & state pages",
                  },
                  {
                    icon: MapTrifold,
                    label: "Topic Targeting",
                    desc: "Published on relevant economy, policy & map views",
                  },
                  {
                    icon: ChartLineUp,
                    label: "Live Chart Embeds",
                    desc: "Embed interactive charts in your reports",
                  },
                  {
                    icon: Newspaper,
                    label: "Verified Badge",
                    desc: "Analyst badge displayed on your profile & reports",
                  },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-muted/30 p-4 text-center"
                  >
                    <Icon size={20} className="text-sky-400 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-foreground mb-0.5">
                      {label}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {ANALYST_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-xl border p-6 flex flex-col bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${tier.borderClass}`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={10} weight="fill" /> {tier.badge}
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-2 mb-2 ${tier.accentClass}`}
                  >
                    <IdentificationBadge size={14} weight="fill" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {tier.name}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold font-mono text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-muted-foreground text-xs mb-1">
                      /{tier.period}
                    </span>
                  </div>
                  <div className="border-t border-border my-4" />
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle
                          size={14}
                          weight="fill"
                          className="text-sky-500 shrink-0 mt-0.5"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${tier.btnClass}`}
                  >
                    Apply for {tier.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-base text-foreground mb-5 flex items-center gap-2">
                <Article size={16} className="text-sky-400" /> How the Analyst
                Program Works
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {ANALYST_PROCESS.map(({ icon: Icon, title, desc }, i) => (
                  <div key={title} className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                        <span className="text-sky-400 text-xs font-bold">
                          {i + 1}
                        </span>
                      </div>
                      <Icon size={16} className="text-sky-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-1">
                        {title}
                      </div>
                      <div className="text-muted-foreground text-xs leading-relaxed">
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-start gap-3">
              <Warning
                size={16}
                weight="fill"
                className="text-warning shrink-0 mt-0.5"
              />
              <div className="text-xs text-warning leading-relaxed">
                <span className="font-semibold">
                  Editorial independence notice:
                </span>{" "}
                All analyst-published reports are clearly labeled as analyst
                contributions and are separate from CommonSphere&#39;s primary
                verified dataset. Paid subscriptions grant publishing access
                only — they do not influence editorial review decisions or data
                sourcing standards.
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: Edu / Students
        ══════════════════════════════════════════ */}
        {tab === "edu" && (
          <div className="space-y-6">
            {/* Hero banner */}
            <div className="bg-card border border-emerald-500/20 rounded-xl p-6">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-xs font-semibold mb-3">
                <GraduationCap size={13} /> Student Plan — Always Free
              </div>
              <h2 className="text-2xl font-bold font-sans text-foreground mb-2">
                Full Professional access.
                <br />
                Zero cost while enrolled.
              </h2>
              <p className="text-muted-foreground text-sm max-w-2xl mb-5">
                The Student plan gives verified students and faculty complete
                access to every module on CommonSphere — the same tools used by
                policy researchers, analysts, and data teams — at no charge for
                the duration of your enrollment.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    icon: BookOpen,
                    label: "Research Tools",
                    desc: "Notes, clipboard & annotations",
                  },
                  {
                    icon: Cpu,
                    label: "Full API Access",
                    desc: "Unlimited calls while enrolled",
                  },
                  {
                    icon: FileText,
                    label: "BibTeX Export",
                    desc: "Academic citation formats",
                  },
                  {
                    icon: Users,
                    label: "Workspaces",
                    desc: "Collaborative team research",
                  },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-center"
                  >
                    <Icon size={18} className="text-emerald-400 mx-auto mb-2" />
                    <div className="text-xs font-semibold text-foreground mb-0.5">
                      {label}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perks + form */}
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Left: perks */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle
                    size={15}
                    weight="fill"
                    className="text-emerald-400"
                  />{" "}
                  What you get free
                </h3>
                <ul className="space-y-3">
                  {EDU_PERKS.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle
                        size={15}
                        weight="fill"
                        className="text-emerald-400 shrink-0 mt-0.5"
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkle size={12} className="text-warning" />
                  Used by researchers at 200+ universities worldwide
                </div>
              </div>

              {/* Right: verification form */}
              <div className="rounded-xl border border-border bg-card p-7">
                {submitted ? (
                  <div className="text-center py-4">
                    <CheckCircle
                      size={40}
                      weight="fill"
                      className="text-emerald-400 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      Check your inbox
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      We&#39;ve sent a verification link to{" "}
                      <span className="text-emerald-400 font-mono text-xs">
                        {email}
                      </span>
                      . Click it to activate your free Student plan.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setEmail("");
                      }}
                      className="mt-6 text-secondary hover:text-secondary/80 text-sm underline"
                    >
                      Use a different email
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <EnvelopeSimple size={18} className="text-emerald-400" />
                      <h3 className="text-base font-semibold text-foreground">
                        Verify your student status
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-xs mb-5">
                      Enter your institutional email address. We&#39;ll send a
                      magic link to verify your enrollment and unlock your free
                      Student plan.
                    </p>
                    <form onSubmit={handleEduSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">
                          Institutional email (.edu)
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEduError("");
                          }}
                          placeholder="you@university.edu"
                          className={inputCls}
                        />
                        {eduError && (
                          <p className="text-destructive text-xs mt-1.5">
                            {eduError}
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Send Verification Link <ArrowRight size={14} />
                      </button>
                    </form>
                    <p className="text-muted-foreground text-[11px] mt-5 text-center">
                      By continuing you agree to our Terms of Service. Verified
                      annually.
                    </p>
                    <div className="border-t border-border mt-5 pt-5 text-center">
                      <p className="text-muted-foreground text-xs mb-3">
                        Or sign in with
                      </p>
                      <div className="flex gap-3">
                        <button className="flex-1 border border-border hover:border-muted-foreground rounded-lg py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all">
                          Google
                        </button>
                        <button className="flex-1 border border-border hover:border-muted-foreground rounded-lg py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all">
                          Microsoft
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
