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
  MegaphoneSimple,
  Flag,
  CalendarBlank,
  ImageSquare,
  TextAlignLeft,
  Buildings,
  ChartBar,
  Confetti,
  UserCircle,
  Globe,
  MapTrifold,
  ChartLineUp,
  Newspaper,
  ShieldCheck,
  PencilLine,
  IdentificationBadge,
  UploadSimple,
  Article,
  Warning,
  Seal,
} from "@phosphor-icons/react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    borderClass: "border-border",
    btnClass: "bg-muted hover:bg-muted/80 text-foreground",
    accentClass: "text-muted-foreground",
    features: [
      "All 50 US states — demographics, politics & economy",
      "195+ countries with live global data",
      "8 major global cities",
      "Economy & GDP comparisons",
      "Political ideology explorer",
      "Polls & public opinion hub",
      "10 bookmarks · 3 collections",
      "Quiz & research modules",
    ],
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    borderClass: "border-secondary/50 ring-2 ring-secondary/20",
    badge: "Most Popular",
    btnClass:
      "bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/20",
    accentClass: "text-secondary",
    features: [
      "Everything in Free",
      "Unlimited bookmarks & collections",
      "Export data to CSV, PNG & PDF",
      "Advanced multi-entity comparison tool",
      "Historical trend data (60+ years)",
      "Congress & policy positions tracker",
      "Conflicts & military data module",
      "International community profiles",
      "Priority data refresh",
    ],
  },
  {
    name: "Research",
    price: "$29",
    period: "per month",
    borderClass: "border-violet-500/40",
    btnClass:
      "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20",
    accentClass: "text-violet-400",
    features: [
      "Everything in Pro",
      "Team collaboration (up to 5 seats)",
      "Custom dashboard builder",
      "Research notes & annotations hub",
      "Clipboard & clipping manager",
      "World map — choropleth overlays",
      "Advanced data exports (CSV, PDF)",
      "Dedicated research support",
    ],
  },
];

const EDU_PERKS = [
  "Full Research plan — free for verified students & faculty",
  "Unlimited API calls during enrollment",
  "Collaborative research workspaces",
  "Export to CSV, PDF, and BibTeX",
  "Priority data refresh & historical archives",
];

const CAMPAIGN_PACKAGES = [
  {
    name: "Grassroots",
    price: "$49",
    period: "per week",
    borderClass: "border-amber-500/30",
    badge: null,
    btnClass: "bg-amber-500 hover:bg-amber-400 text-white",
    accentColor: "text-amber-400",
    features: [
      "Banner on 1 dashboard page",
      "Mission statement (280 chars)",
      "500 estimated daily impressions",
      "Campaign logo + tagline",
      "7-day minimum run",
    ],
  },
  {
    name: "District",
    price: "$149",
    period: "per week",
    borderClass: "border-red-500/40 ring-2 ring-red-500/15",
    badge: "Most Popular",
    btnClass:
      "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20",
    accentColor: "text-red-400",
    features: [
      "Banner on 3 dashboard pages",
      "Full mission statement (600 chars)",
      "2,000 estimated daily impressions",
      "Campaign logo, tagline & CTA button",
      "Issue tag targeting (e.g. Economy, Climate)",
      "Analytics dashboard",
    ],
  },
  {
    name: "Statewide",
    price: "$399",
    period: "per week",
    borderClass: "border-violet-500/40",
    badge: null,
    btnClass:
      "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20",
    accentColor: "text-violet-400",
    features: [
      "Sitewide banner placement",
      "Unlimited mission statement length",
      "10,000+ estimated daily impressions",
      "Campaign logo, tagline, CTA & video embed",
      "Full issue & state targeting",
      "Priority placement + dedicated support",
      "Real-time analytics & A/B testing",
    ],
  },
];

const ISSUE_TAGS = [
  "Economy",
  "Climate",
  "Healthcare",
  "Education",
  "Immigration",
  "Housing",
  "Criminal Justice",
  "Veterans",
  "Infrastructure",
  "Tax Reform",
  "Foreign Policy",
  "Gun Policy",
];

type Tab = "plans" | "edu" | "campaigns" | "analyst";

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

  const [campaignStep, setCampaignStep] = useState<1 | 2 | 3>(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    candidateName: "",
    office: "",
    party: "",
    state: "",
    startDate: "",
    endDate: "",
    tagline: "",
    mission: "",
    website: "",
    selectedTags: [] as string[],
  });
  const [campaignSubmitted, setCampaignSubmitted] = useState(false);

  const toggleIssueTag = (tag: string) => {
    setCampaignForm((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : prev.selectedTags.length < 5
          ? [...prev.selectedTags, tag]
          : prev.selectedTags,
    }));
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "plans", label: "Plans & Pricing", icon: <CreditCard size={14} /> },
    {
      id: "analyst",
      label: "Official Analysts",
      icon: <IdentificationBadge size={14} />,
    },
    { id: "edu", label: "Edu / Students", icon: <GraduationCap size={14} /> },
    {
      id: "campaigns",
      label: "Political Campaigns",
      icon: <MegaphoneSimple size={14} />,
    },
  ];

  // shared input class
  const inputCls =
    "w-full bg-background border border-border focus:border-secondary rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors";

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
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
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              Choose the plan that fits your research needs. All plans include
              access to our verified global dataset.
            </p>
          </div>
        </section>

        {/* Tabs */}
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

        {/* ── TAB: Plans ── */}
        {tab === "plans" && (
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-6 flex flex-col bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${plan.borderClass}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={10} weight="fill" /> {plan.badge}
                  </div>
                )}
                <h2 className={`text-base font-bold mb-1 ${plan.accentClass}`}>
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
                        className="text-success shrink-0 mt-0.5"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${plan.btnClass}`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: Analyst ── */}
        {tab === "analyst" && (
          <div className="space-y-6">
            {/* Hero */}
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

              {/* Feature highlights */}
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

            {/* Pricing tiers */}
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

            {/* How it works */}
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

            {/* Compliance notice */}
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

        {/* ── TAB: Campaigns ── */}
        {tab === "campaigns" && (
          <div>
            {/* Hero */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-red-400 text-xs font-semibold mb-3">
                <Flag size={13} weight="fill" /> Nonprofit Political Advertising
              </div>
              <h2 className="text-2xl font-bold font-sans text-foreground mb-2">
                Campaign Season Banner Placements
              </h2>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Reach engaged, policy-minded citizens during your campaign
                season. Place your banner and mission statement directly inside
                CommonSphere&#39;s data dashboards — where voters are already
                researching the issues that matter.
              </p>

              {/* Step indicator */}
              <div className="flex items-center gap-0 mt-6">
                {[
                  { n: 1, label: "Choose Package" },
                  { n: 2, label: "Campaign Details" },
                  { n: 3, label: "Review & Pay" },
                ].map((s, i) => (
                  <React.Fragment key={s.n}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          campaignStep >= s.n
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {campaignStep > s.n ? (
                          <CheckCircle size={14} weight="fill" />
                        ) : (
                          s.n
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1 font-medium ${campaignStep >= s.n ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={`w-16 h-0.5 mb-4 mx-1 transition-all ${campaignStep > s.n ? "bg-red-500" : "bg-border"}`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* STEP 1: Choose package */}
            {campaignStep === 1 && (
              <div>
                <div className="grid md:grid-cols-3 gap-5 mb-6">
                  {CAMPAIGN_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.name}
                      onClick={() => setSelectedPackage(pkg.name)}
                      className={`relative rounded-xl border p-6 flex flex-col bg-card cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${pkg.borderClass} ${
                        selectedPackage === pkg.name
                          ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background"
                          : ""
                      }`}
                    >
                      {pkg.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Star size={10} weight="fill" /> {pkg.badge}
                        </div>
                      )}
                      {selectedPackage === pkg.name && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-red-400"
                          />
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-2 mb-2 ${pkg.accentColor}`}
                      >
                        <MegaphoneSimple size={14} weight="fill" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {pkg.name}
                        </span>
                      </div>
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-3xl font-bold font-mono text-foreground">
                          {pkg.price}
                        </span>
                        <span className="text-muted-foreground text-xs mb-1">
                          /{pkg.period}
                        </span>
                      </div>
                      <div className="border-t border-border my-4" />
                      <ul className="space-y-2 flex-1 mb-5">
                        {pkg.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle
                              size={13}
                              weight="fill"
                              className="text-success shrink-0 mt-0.5"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${pkg.btnClass}`}
                      >
                        Select {pkg.name}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Info strip */}
                <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-3 gap-6 text-center mb-6">
                  {[
                    {
                      icon: Buildings,
                      label: "501(c)(3) & 501(c)(4)",
                      desc: "Eligible nonprofit org types",
                    },
                    {
                      icon: ChartBar,
                      label: "Verified Reach",
                      desc: "Real analytics, no bot traffic",
                    },
                    {
                      icon: CalendarBlank,
                      label: "Seasonal Scheduling",
                      desc: "Book weeks, primaries, election day",
                    },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label}>
                      <Icon size={18} className="text-red-400 mx-auto mb-1.5" />
                      <div className="text-sm font-semibold text-foreground">
                        {label}
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    disabled={!selectedPackage}
                    onClick={() => setCampaignStep(2)}
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20"
                  >
                    Continue with {selectedPackage ?? "a package"}{" "}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Campaign Details */}
            {campaignStep === 2 && (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-xl border border-border bg-card p-8 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag size={16} weight="fill" className="text-red-400" />
                    <h3 className="font-semibold text-base text-foreground">
                      Campaign Information
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      {selectedPackage} Package
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "Candidate / Org Name *",
                        key: "candidateName",
                        placeholder: "Jane Smith for Senate",
                      },
                      {
                        label: "Office Sought *",
                        key: "office",
                        placeholder: "U.S. Senate — California",
                      },
                      {
                        label: "Party Affiliation",
                        key: "party",
                        placeholder: "Democratic / Republican / Independent…",
                      },
                      {
                        label: "Primary State",
                        key: "state",
                        placeholder: "e.g. California",
                      },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-muted-foreground mb-1.5">
                          {label}
                        </label>
                        <input
                          value={(campaignForm as any)[key]}
                          onChange={(e) =>
                            setCampaignForm((p) => ({
                              ...p,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={placeholder}
                          className={inputCls}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Campaign Start Date *
                      </label>
                      <input
                        type="date"
                        value={campaignForm.startDate}
                        onChange={(e) =>
                          setCampaignForm((p) => ({
                            ...p,
                            startDate: e.target.value,
                          }))
                        }
                        className={inputCls}
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Campaign End Date *
                      </label>
                      <input
                        type="date"
                        value={campaignForm.endDate}
                        onChange={(e) =>
                          setCampaignForm((p) => ({
                            ...p,
                            endDate: e.target.value,
                          }))
                        }
                        className={inputCls}
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">
                      <ImageSquare size={11} className="inline mr-1" />
                      Banner Tagline *{" "}
                      <span className="text-muted-foreground/60">
                        ({campaignForm.tagline.length}/80)
                      </span>
                    </label>
                    <input
                      maxLength={80}
                      value={campaignForm.tagline}
                      onChange={(e) =>
                        setCampaignForm((p) => ({
                          ...p,
                          tagline: e.target.value,
                        }))
                      }
                      placeholder="Fighting for working families in California"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">
                      <TextAlignLeft size={11} className="inline mr-1" />
                      Mission Statement *{" "}
                      <span className="text-muted-foreground/60">
                        ({campaignForm.mission.length}/
                        {selectedPackage === "Grassroots"
                          ? "280"
                          : selectedPackage === "District"
                            ? "600"
                            : "∞"}
                        )
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      maxLength={
                        selectedPackage === "Grassroots"
                          ? 280
                          : selectedPackage === "District"
                            ? 600
                            : undefined
                      }
                      value={campaignForm.mission}
                      onChange={(e) =>
                        setCampaignForm((p) => ({
                          ...p,
                          mission: e.target.value,
                        }))
                      }
                      placeholder="Describe your campaign&#39;s core values, policy priorities, and what you stand for."
                      className={`${inputCls} resize-none leading-relaxed`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">
                      Issue Tag Targeting{" "}
                      <span className="text-muted-foreground/60">
                        (select up to 5)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ISSUE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleIssueTag(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            campaignForm.selectedTags.includes(tag)
                              ? "bg-red-500 border-red-500 text-white"
                              : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">
                      Campaign Website URL
                    </label>
                    <input
                      type="url"
                      value={campaignForm.website}
                      onChange={(e) =>
                        setCampaignForm((p) => ({
                          ...p,
                          website: e.target.value,
                        }))
                      }
                      placeholder="https://janesmith.com"
                      className={inputCls}
                    />
                  </div>

                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
                    <span className="font-semibold">Compliance note:</span> All
                    campaign ads are reviewed within 24 hours to ensure FEC
                    compliance and CommonSphere&#39;s nonprofit political
                    advertising guidelines before going live.
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => setCampaignStep(1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    disabled={
                      !campaignForm.candidateName ||
                      !campaignForm.office ||
                      !campaignForm.startDate ||
                      !campaignForm.endDate ||
                      !campaignForm.tagline ||
                      !campaignForm.mission
                    }
                    onClick={() => setCampaignStep(3)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20"
                  >
                    Review Order <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Pay */}
            {campaignStep === 3 && !campaignSubmitted && (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-xl border border-border bg-card p-8 space-y-6">
                  <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                    <ChartBar size={16} className="text-red-400" /> Order
                    Summary
                  </h3>

                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Flag size={10} weight="fill" /> Sponsored Campaign
                    </div>
                    <div className="font-bold text-lg text-foreground">
                      {campaignForm.candidateName || "Your Candidate Name"}
                    </div>
                    <div className="text-muted-foreground text-sm mt-0.5">
                      {campaignForm.tagline || "Your banner tagline"}
                    </div>
                    {campaignForm.selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {campaignForm.selectedTags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {campaignForm.mission && (
                      <p className="text-muted-foreground text-xs mt-3 leading-relaxed line-clamp-3">
                        {campaignForm.mission}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Package", value: selectedPackage },
                      { label: "Office", value: campaignForm.office },
                      {
                        label: "Party",
                        value: campaignForm.party || "Not specified",
                      },
                      {
                        label: "State",
                        value: campaignForm.state || "Not specified",
                      },
                      {
                        label: "Run Dates",
                        value:
                          campaignForm.startDate && campaignForm.endDate
                            ? `${campaignForm.startDate} → ${campaignForm.endDate}`
                            : "—",
                      },
                      {
                        label: "Issue Tags",
                        value: campaignForm.selectedTags.join(", ") || "None",
                      },
                      {
                        label: "Website",
                        value: campaignForm.website || "Not provided",
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between border-b border-border pb-2"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-medium text-right max-w-xs truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        {selectedPackage} package
                      </span>
                      <span className="text-foreground font-semibold font-mono">
                        {
                          CAMPAIGN_PACKAGES.find(
                            (p) => p.name === selectedPackage,
                          )?.price
                        }
                        /week
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Final invoice calculated by exact campaign duration.
                      You&#39;ll be contacted by our team within 24 hours to
                      complete payment and schedule your ad.
                    </p>
                  </div>

                  <button
                    onClick={() => setCampaignSubmitted(true)}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20"
                  >
                    <CreditCard size={15} /> Submit Campaign Request
                  </button>
                </div>

                <div className="flex items-center justify-start mt-4">
                  <button
                    onClick={() => setCampaignStep(2)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    <ArrowLeft size={14} /> Edit Details
                  </button>
                </div>
              </div>
            )}

            {campaignStep === 3 && campaignSubmitted && (
              <div className="max-w-lg mx-auto text-center">
                <div className="rounded-xl border border-success/20 bg-card p-10">
                  <Confetti
                    size={48}
                    weight="fill"
                    className="text-success mx-auto mb-4"
                  />
                  <h3 className="text-2xl font-bold mb-2 text-foreground">
                    Campaign Request Submitted!
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Our team will review your{" "}
                    <span className="text-foreground font-semibold">
                      {selectedPackage}
                    </span>{" "}
                    campaign request and reach out within{" "}
                    <span className="text-success font-semibold">24 hours</span>{" "}
                    to finalize scheduling and payment.
                  </p>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2 mb-6 text-sm">
                    {[
                      { label: "Candidate", value: campaignForm.candidateName },
                      { label: "Package", value: selectedPackage ?? "" },
                      {
                        label: "Run window",
                        value: `${campaignForm.startDate} → ${campaignForm.endDate}`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setCampaignSubmitted(false);
                      setCampaignStep(1);
                      setSelectedPackage(null);
                      setCampaignForm({
                        candidateName: "",
                        office: "",
                        party: "",
                        state: "",
                        startDate: "",
                        endDate: "",
                        tagline: "",
                        mission: "",
                        website: "",
                        selectedTags: [],
                      });
                    }}
                    className="text-secondary hover:text-secondary/80 text-sm underline"
                  >
                    Submit another campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Edu ── */}
        {tab === "edu" && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: perks */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-1.5 text-success text-xs font-semibold mb-4">
                <GraduationCap size={13} /> Education Program
              </div>
              <h2 className="text-2xl font-bold font-sans text-foreground mb-2">
                Free for Students
                <br />& Educators
              </h2>
              <p className="text-muted-foreground text-sm mb-5">
                Verify your .edu email and unlock everything CommonSphere has to
                offer — at no cost, for the duration of your enrollment.
              </p>
              <ul className="space-y-3">
                {EDU_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle
                      size={15}
                      weight="fill"
                      className="text-success shrink-0 mt-0.5"
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

            {/* Right: form */}
            <div className="rounded-xl border border-border bg-card p-7">
              {submitted ? (
                <div className="text-center py-4">
                  <CheckCircle
                    size={40}
                    weight="fill"
                    className="text-success mx-auto mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    Check your inbox
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We&#39;ve sent a verification link to{" "}
                    <span className="text-success font-mono text-xs">
                      {email}
                    </span>
                    . Click it to activate your free Research plan.
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
                    <EnvelopeSimple size={18} className="text-success" />
                    <h3 className="text-base font-semibold text-foreground">
                      Sign in with .edu email
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs mb-5">
                    Enter your institutional email address below. We&#39;ll send
                    you a magic link to verify your enrollment.
                  </p>
                  <form onSubmit={handleEduSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">
                        Institutional email
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
                      className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/80 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-success/20"
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
        )}
      </div>
    </div>
  );
}
