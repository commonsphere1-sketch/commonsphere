import React, { useState } from "react";
import {
  Briefcase,
  CurrencyDollar,
  Lightbulb,
  ChartLine,
  Scales,
  Users,
  ArrowUp,
  ArrowDown,
  MagnifyingGlass,
  FunnelSimple,
  Info,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  Buildings,
  MapPin,
  Flag,
  Heart,
  BookOpen,
  Wrench,
  ShieldChevron,
  TrendUp,
  HandHeart,
  DeviceMobile,
} from "@phosphor-icons/react";
import { countriesData, type Country } from "../data/countriesData";
import { SourceLink } from "../components/SourceLink";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type PolicyTab =
  | "budget"
  | "initiatives"
  | "impact"
  | "scale"
  | "adoption"
  | "countries";

type PolicyScope = "Global" | "National" | "Regional" | "Local";
type PolicyStatus = "Active" | "Proposed" | "Enacted" | "Expired" | "Pending";
type PolicyDomain =
  | "Climate"
  | "Healthcare"
  | "Education"
  | "Infrastructure"
  | "Defense"
  | "Economy"
  | "Social"
  | "Technology";

interface Policy {
  id: string;
  name: string;
  domain: PolicyDomain;
  scope: PolicyScope;
  status: PolicyStatus;
  country: string;
  year: number;
  budgetUSD: number; // millions
  beneficiaries: number; // thousands
  adoptionRate: number; // 0-100
  impactScore: number; // 0-10
  description: string;
  tags: string[];
  partiesFavoring: {
    name: string;
    stance: "strong" | "moderate" | "opposed";
  }[];
  keyObjectives: string[];
  relatedPolicies: string[]; // policy ids
  legislativeBody?: string;
  implementingAgency?: string;
  renewalDate?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const policies: Policy[] = [
  {
    id: "p1",
    name: "Paris Agreement Climate Framework",
    domain: "Climate",
    scope: "Global",
    status: "Active",
    country: "UN / 196 Parties",
    year: 2016,
    budgetUSD: 100000,
    beneficiaries: 8000000,
    adoptionRate: 92,
    impactScore: 8.4,
    description:
      "International treaty to limit global warming to 1.5°C above pre-industrial levels through nationally determined contributions. Each signatory submits an NDC outlining emissions reduction targets and climate adaptation plans, reviewed every 5 years with a ratchet mechanism requiring increased ambition.",
    tags: ["Net Zero", "NDC", "Carbon", "Emissions"],
    partiesFavoring: [
      { name: "European Green Parties", stance: "strong" },
      { name: "Progressive Democrats (US)", stance: "strong" },
      { name: "Labour / Social Democrats (EU)", stance: "strong" },
      { name: "Conservative Parties (UK/AU)", stance: "moderate" },
      { name: "Republican Party (US)", stance: "opposed" },
    ],
    keyObjectives: [
      "Limit global temperature rise to 1.5°C above pre-industrial levels",
      "Achieve net-zero emissions globally by mid-century",
      "Provide $100B/year in climate finance to developing nations",
      "Strengthen countries' ability to deal with climate impacts",
      "Require nationally determined contributions (NDCs) every 5 years",
    ],
    relatedPolicies: ["p2", "p3"],
    legislativeBody: "UN Framework Convention on Climate Change",
    implementingAgency: "UNFCCC Secretariat",
    renewalDate: "2030",
  },
  {
    id: "p2",
    name: "Inflation Reduction Act",
    domain: "Climate",
    scope: "National",
    status: "Active",
    country: "United States",
    year: 2022,
    budgetUSD: 369000,
    beneficiaries: 334000,
    adoptionRate: 78,
    impactScore: 7.9,
    description:
      "Largest US climate investment in history — $369B in clean energy tax credits, EV incentives, methane reduction fees, and domestic manufacturing subsidies. Also includes healthcare provisions capping insulin costs and extending ACA subsidies.",
    tags: ["Clean Energy", "EV", "Tax Credit", "Manufacturing"],
    partiesFavoring: [
      { name: "Democratic Party", stance: "strong" },
      { name: "Progressive Caucus", stance: "strong" },
      { name: "Green Party", stance: "moderate" },
      { name: "Republican Party", stance: "opposed" },
      { name: "Libertarian Party", stance: "opposed" },
    ],
    keyObjectives: [
      "Reduce US greenhouse gas emissions by ~40% below 2005 levels by 2030",
      "Deploy clean electricity via production and investment tax credits",
      "Accelerate EV adoption with $7,500 consumer tax credits",
      "Impose methane fees on oil & gas sector above EPA thresholds",
      "Boost domestic clean energy manufacturing (solar, wind, batteries)",
    ],
    relatedPolicies: ["p1", "p6", "p12"],
    legislativeBody: "US Congress (Senate + House)",
    implementingAgency: "IRS / Department of Energy / EPA",
    renewalDate: "Permanent (tax credits through 2032)",
  },
  {
    id: "p3",
    name: "European Green Deal",
    domain: "Climate",
    scope: "Regional",
    status: "Active",
    country: "European Union",
    year: 2020,
    budgetUSD: 1000000,
    beneficiaries: 447000,
    adoptionRate: 85,
    impactScore: 8.1,
    description:
      "EU strategy to make Europe the first climate-neutral continent by 2050 through green finance, sustainable agriculture (Farm to Fork), circular economy regulation, and carbon border adjustment mechanism (CBAM). Backed by the €1T European Green Deal Investment Plan.",
    tags: ["Net Zero", "Green Finance", "Circular Economy"],
    partiesFavoring: [
      { name: "Greens–EFA (EU Parliament)", stance: "strong" },
      { name: "S&D / Social Democrats", stance: "strong" },
      { name: "Renew Europe / Liberals", stance: "strong" },
      { name: "EPP / Centre-Right", stance: "moderate" },
      { name: "European Conservatives (ECR)", stance: "opposed" },
      { name: "Identity & Democracy (ID)", stance: "opposed" },
    ],
    keyObjectives: [
      "Achieve EU climate neutrality by 2050 (55% cut by 2030)",
      "Expand EU Emissions Trading System (ETS) to buildings & transport",
      "Implement Carbon Border Adjustment Mechanism (CBAM)",
      "Transition to sustainable food systems via Farm to Fork Strategy",
      "Mobilize €1 trillion in sustainable investments over a decade",
    ],
    relatedPolicies: ["p1", "p11"],
    legislativeBody: "European Commission / European Parliament",
    implementingAgency: "DG CLIMA / DG ENER",
    renewalDate: "2050 (milestones: 2030, 2040)",
  },
  {
    id: "p4",
    name: "Universal Health Coverage Initiative",
    domain: "Healthcare",
    scope: "Global",
    status: "Active",
    country: "WHO / 194 Members",
    year: 2019,
    budgetUSD: 58000,
    beneficiaries: 4500000,
    adoptionRate: 71,
    impactScore: 7.5,
    description:
      "WHO-led initiative to ensure all people have access to essential health services without financial hardship by 2030. Targets include 1 billion more people benefiting from UHC, 1 billion better protected from health emergencies, and 1 billion enjoying better health and well-being (the 'Triple Billion' goals).",
    tags: ["UHC", "SDG 3", "Primary Care", "Equity"],
    partiesFavoring: [
      {
        name: "Centre-Left / Social Democratic parties (Global)",
        stance: "strong",
      },
      { name: "Labour Parties (UK, AU, NZ)", stance: "strong" },
      { name: "Progressive parties (Scandinavia)", stance: "strong" },
      { name: "Centre-Right / Christian Democrats", stance: "moderate" },
      { name: "Libertarian / Free-Market parties", stance: "opposed" },
    ],
    keyObjectives: [
      "Extend essential health service coverage to 1 billion more people",
      "Eliminate out-of-pocket health expenses causing financial hardship",
      "Strengthen primary healthcare systems in low-income countries",
      "Achieve SDG 3 targets on health by 2030",
      "Build pandemic preparedness and health emergency infrastructure",
    ],
    relatedPolicies: ["p12"],
    legislativeBody: "World Health Assembly",
    implementingAgency: "WHO / National Health Ministries",
    renewalDate: "2030 (SDG deadline)",
  },
  {
    id: "p5",
    name: "National Education Policy 2020",
    domain: "Education",
    scope: "National",
    status: "Active",
    country: "India",
    year: 2020,
    budgetUSD: 14200,
    beneficiaries: 350000,
    adoptionRate: 68,
    impactScore: 7.2,
    description:
      "Comprehensive reform of India&#39;s education system — replaces 34-year-old policy with a new 5+3+3+4 school structure, multilingual instruction in mother tongue up to Grade 5, emphasis on critical thinking, vocational training from Grade 6, and a target of 6% of GDP for education spending.",
    tags: ["K-12", "Higher Ed", "Digital Learning", "Vocational"],
    partiesFavoring: [
      { name: "BJP (Bharatiya Janata Party)", stance: "strong" },
      { name: "NDA Alliance Parties", stance: "strong" },
      { name: "Regional parties (State govts)", stance: "moderate" },
      { name: "Indian National Congress", stance: "moderate" },
      {
        name: "Dravidian / Tamil parties (language concerns)",
        stance: "opposed",
      },
    ],
    keyObjectives: [
      "Introduce new 5+3+3+4 school curriculum structure",
      "Mandate mother tongue/regional language instruction up to Grade 5",
      "Increase education spending to 6% of GDP",
      "Introduce vocational training from Grade 6",
      "Establish Academic Bank of Credits for flexible higher education",
    ],
    relatedPolicies: ["p10"],
    legislativeBody: "Parliament of India / State Legislatures",
    implementingAgency: "Ministry of Education (MoE)",
    renewalDate: "Ongoing (2030 milestones)",
  },
  {
    id: "p6",
    name: "Build Back Better Infrastructure Plan",
    domain: "Infrastructure",
    scope: "National",
    status: "Enacted",
    country: "United States",
    year: 2021,
    budgetUSD: 1200000,
    beneficiaries: 334000,
    adoptionRate: 82,
    impactScore: 7.8,
    description:
      "Bipartisan Infrastructure Law (BIL) — the largest long-term infrastructure investment in US history. Allocates $550B in new spending over 5 years for roads, bridges, broadband, water systems, public transit, and rail. Passed with bipartisan support in the Senate 69-30.",
    tags: ["Roads", "Broadband", "Water", "Transit"],
    partiesFavoring: [
      { name: "Democratic Party", stance: "strong" },
      { name: "Moderate Republicans (Bipartisan)", stance: "strong" },
      { name: "Labour & Trade Unions", stance: "strong" },
      { name: "Progressive Caucus", stance: "moderate" },
      { name: "Fiscal Conservative Republicans", stance: "opposed" },
    ],
    keyObjectives: [
      "Repair 45,000 structurally deficient bridges and 173,000 miles of roads",
      "Provide universal high-speed broadband internet access",
      "Replace all lead service lines and pipes for clean water",
      "Expand public transit and passenger rail (Amtrak)",
      "Build national EV charging network of 500,000 stations",
    ],
    relatedPolicies: ["p2", "p13"],
    legislativeBody: "US Congress",
    implementingAgency: "Department of Transportation / EPA",
    renewalDate: "5-year authorization (2026)",
  },
  {
    id: "p7",
    name: "China Belt & Road Initiative",
    domain: "Infrastructure",
    scope: "Global",
    status: "Active",
    country: "China",
    year: 2013,
    budgetUSD: 1000000,
    beneficiaries: 4400000,
    adoptionRate: 65,
    impactScore: 6.8,
    description:
      "Massive infrastructure and investment initiative spanning 150+ countries to build roads, ports, rail, and digital networks along the Silk Route. Includes the Digital Silk Road for tech infrastructure, and the Health Silk Road for medical cooperation. Criticized by Western nations as debt-trap diplomacy.",
    tags: ["Connectivity", "Trade", "Development", "Diplomacy"],
    partiesFavoring: [
      { name: "Chinese Communist Party (CCP)", stance: "strong" },
      { name: "African Union member governments", stance: "strong" },
      { name: "SCO member states", stance: "strong" },
      { name: "Western liberal democracies", stance: "opposed" },
      { name: "G7 governments", stance: "opposed" },
    ],
    keyObjectives: [
      "Build trade and infrastructure networks across Asia, Africa, and Europe",
      "Expand Chinese geopolitical influence through investment partnerships",
      "Develop Digital Silk Road for 5G and tech infrastructure",
      "Establish strategic port access (e.g., Gwadar, Hambantota)",
      "Create alternative to Western-led multilateral development banks",
    ],
    relatedPolicies: ["p6"],
    legislativeBody: "National People&#39;s Congress (China)",
    implementingAgency: "National Development and Reform Commission (NDRC)",
    renewalDate: "Ongoing (no fixed end date)",
  },
  {
    id: "p8",
    name: "NATO Defense Spending Commitment",
    domain: "Defense",
    scope: "Regional",
    status: "Active",
    country: "NATO Alliance",
    year: 2014,
    budgetUSD: 1250000,
    beneficiaries: 1000000,
    adoptionRate: 73,
    impactScore: 6.5,
    description:
      "Alliance-wide pledge for all 32 NATO members to spend at least 2% of GDP on defense, adopted at the Wales Summit in 2014 and reaffirmed post-Russia&#39;s 2022 invasion of Ukraine. As of 2024, 23 members meet the target — up from just 3 in 2014. New 2.5% target proposed for 2032.",
    tags: ["2% GDP", "Burden Sharing", "Collective Defense"],
    partiesFavoring: [
      {
        name: "Conservative / Centre-Right parties (EU/UK/US)",
        stance: "strong",
      },
      { name: "Republican Party (US)", stance: "strong" },
      {
        name: "Eastern European governing parties (Poland, Baltic states)",
        stance: "strong",
      },
      { name: "Social Democrats (EU)", stance: "moderate" },
      { name: "Green / Anti-militarist parties", stance: "opposed" },
      { name: "UK Labour Left", stance: "opposed" },
    ],
    keyObjectives: [
      "Ensure all 32 NATO allies spend ≥2% of GDP on defense annually",
      "Modernize NATO&#39;s collective deterrence against Russia and China",
      "Increase alliance readiness with pre-positioned forces in Eastern Europe",
      "Coordinate intelligence sharing and cyber defense capabilities",
      "Propose 2.5% GDP target for member states by 2032",
    ],
    relatedPolicies: [],
    legislativeBody: "NATO Summit / North Atlantic Council",
    implementingAgency: "National Defense Ministries",
    renewalDate: "Reviewed at annual summits",
  },
  {
    id: "p9",
    name: "Universal Basic Income Pilot — Kenya",
    domain: "Social",
    scope: "Local",
    status: "Active",
    country: "Kenya",
    year: 2017,
    budgetUSD: 75,
    beneficiaries: 21,
    adoptionRate: 100,
    impactScore: 7.6,
    description:
      "GiveDirectly&#39;s 12-year UBI experiment providing unconditional $22/month (long-term) or $500 lump-sum to ~21,000 rural Kenyans across 328 villages. The world&#39;s largest and longest-running UBI study, tracking economic, psychological, and community outcomes in randomized control trials.",
    tags: ["UBI", "Poverty", "Cash Transfer", "Research"],
    partiesFavoring: [
      { name: "Progressive / Left parties globally", stance: "strong" },
      { name: "Green parties (Finland, Germany, UK)", stance: "strong" },
      {
        name: "Some Libertarians (Friedman-style negative income tax)",
        stance: "moderate",
      },
      { name: "Fiscal Conservative parties", stance: "opposed" },
      { name: "Traditional welfare-state advocates", stance: "moderate" },
    ],
    keyObjectives: [
      "Provide unconditional cash transfers to eliminate extreme poverty",
      "Measure long-term economic and psychological effects via RCT",
      "Test whether UBI increases entrepreneurship and local investment",
      "Assess spillover effects on non-recipient community members",
      "Inform global UBI policy debate with rigorous 12-year dataset",
    ],
    relatedPolicies: ["p15"],
    legislativeBody: "N/A (NGO pilot — GiveDirectly)",
    implementingAgency: "GiveDirectly / J-PAL Research Partners",
    renewalDate: "2029 (end of 12-year study)",
  },
  {
    id: "p10",
    name: "Digital India Programme",
    domain: "Technology",
    scope: "National",
    status: "Active",
    country: "India",
    year: 2015,
    budgetUSD: 20000,
    beneficiaries: 1400000,
    adoptionRate: 74,
    impactScore: 7.4,
    description:
      "Nationwide initiative to digitize government services, expand broadband to 250,000 gram panchayats, and build the India Stack (Aadhaar + UPI + DigiLocker). UPI now processes over 10 billion transactions/month, making India a global fintech leader.",
    tags: ["E-Gov", "Broadband", "Fintech", "UPI"],
    partiesFavoring: [
      { name: "BJP (Bhartiya Janata Party)", stance: "strong" },
      { name: "NDA Alliance Partners", stance: "strong" },
      { name: "Tech industry & startup ecosystem", stance: "strong" },
      { name: "Indian National Congress", stance: "moderate" },
      { name: "Privacy / Civil liberties advocates", stance: "opposed" },
    ],
    keyObjectives: [
      "Connect 250,000 gram panchayats with high-speed broadband",
      "Build Aadhaar-based digital identity for 1.4 billion citizens",
      "Scale UPI to become the world&#39;s dominant real-time payment system",
      "Move government services to digital-first through DigiLocker and e-governance",
      "Create 10 million IT jobs and develop a $1T digital economy by 2025",
    ],
    relatedPolicies: ["p5"],
    legislativeBody: "Parliament of India",
    implementingAgency: "Ministry of Electronics & IT (MeitY)",
    renewalDate: "Ongoing",
  },
  {
    id: "p11",
    name: "EU AI Act",
    domain: "Technology",
    scope: "Regional",
    status: "Enacted",
    country: "European Union",
    year: 2024,
    budgetUSD: 1200,
    beneficiaries: 447000,
    adoptionRate: 88,
    impactScore: 8.0,
    description:
      "World&#39;s first comprehensive AI regulation — a risk-based framework that classifies AI systems as Unacceptable Risk (banned), High Risk (strict requirements), Limited Risk (transparency), or Minimal Risk (no obligations). Prohibits social scoring, real-time biometric surveillance, and manipulative AI in public spaces.",
    tags: ["AI", "Regulation", "High-Risk", "Transparency"],
    partiesFavoring: [
      { name: "S&D / Social Democrats (EU)", stance: "strong" },
      { name: "Greens–EFA (EU Parliament)", stance: "strong" },
      { name: "EPP / Christian Democrats", stance: "moderate" },
      { name: "Renew Europe / Liberals", stance: "moderate" },
      { name: "Tech industry lobbies", stance: "opposed" },
      { name: "ECR / Conservatives (deregulation stance)", stance: "opposed" },
    ],
    keyObjectives: [
      "Ban unacceptable-risk AI (social scoring, real-time biometric surveillance)",
      "Impose strict conformity requirements on high-risk AI in healthcare, justice, hiring",
      "Require transparency disclosures for chatbots and deepfakes",
      "Establish EU AI Office to supervise compliance",
      "Apply extraterritorially to any AI system used in the EU regardless of origin",
    ],
    relatedPolicies: ["p3"],
    legislativeBody: "European Parliament / Council of the EU",
    implementingAgency:
      "EU AI Office / National Market Supervisory Authorities",
    renewalDate: "Fully applicable August 2026",
  },
  {
    id: "p12",
    name: "Affordable Care Act",
    domain: "Healthcare",
    scope: "National",
    status: "Active",
    country: "United States",
    year: 2010,
    budgetUSD: 2000000,
    beneficiaries: 45000,
    adoptionRate: 90,
    impactScore: 7.7,
    description:
      "Landmark US health reform (&#39;Obamacare&#39;) — expanded Medicaid to millions of low-income adults, established health insurance marketplaces, banned pre-existing condition exclusions, allowed children to stay on parents&#39; plans until age 26, and mandated coverage of essential health benefits.",
    tags: ["Insurance", "Medicaid", "Marketplace", "Prevention"],
    partiesFavoring: [
      { name: "Democratic Party", stance: "strong" },
      { name: "Progressive Caucus", stance: "strong" },
      { name: "Moderate Republicans (pre-2016)", stance: "moderate" },
      { name: "Republican Party (post-2010)", stance: "opposed" },
      { name: "Libertarian Party", stance: "opposed" },
      { name: "Tea Party / Freedom Caucus", stance: "opposed" },
    ],
    keyObjectives: [
      "Extend health coverage to 20+ million previously uninsured Americans",
      "Expand Medicaid eligibility to 138% of federal poverty level",
      "Prohibit insurers from denying coverage for pre-existing conditions",
      "Create health insurance exchanges / marketplaces with subsidies",
      "Require coverage of preventive services at no cost-sharing",
    ],
    relatedPolicies: ["p4", "p2"],
    legislativeBody: "US Congress (Senate + House)",
    implementingAgency: "HHS / CMS / IRS",
    renewalDate: "Ongoing (ACA marketplace subsidies extended through 2025)",
  },
  {
    id: "p13",
    name: "15-Minute City Initiative",
    domain: "Infrastructure",
    scope: "Local",
    status: "Active",
    country: "France (Paris)",
    year: 2020,
    budgetUSD: 500,
    beneficiaries: 2200,
    adoptionRate: 62,
    impactScore: 7.3,
    description:
      "Urban planning concept pioneered by Paris Mayor Anne Hidalgo — ensures all essential services (work, shops, schools, health, leisure) are reachable within 15 minutes on foot or bike. Involves road reallocation, expanded cycling infrastructure (Paris Plan Vélo), and mixed-use zoning reform.",
    tags: ["Urban Planning", "Walkability", "Sustainability", "Mobility"],
    partiesFavoring: [
      { name: "Green / Ecologist parties", stance: "strong" },
      { name: "Socialist / Centre-Left parties (France)", stance: "strong" },
      { name: "Urban planning progressives globally", stance: "strong" },
      { name: "Centrist municipal governments", stance: "moderate" },
      { name: "Suburban / Car-dependent communities", stance: "opposed" },
      {
        name: "Far-Right / Nationalist parties (conspiracy framing)",
        stance: "opposed",
      },
    ],
    keyObjectives: [
      "Ensure all essential services within 15-minute walk/cycle in Paris",
      "Reduce car dependency and lower urban carbon emissions",
      "Expand cycling infrastructure to 1,000km of bike lanes",
      "Reform zoning to enable mixed-use neighborhoods",
      "Export model to 40+ global cities via C40 Cities network",
    ],
    relatedPolicies: ["p6"],
    legislativeBody: "Paris City Council / Île-de-France Regional Council",
    implementingAgency: "City of Paris Urbanisme",
    renewalDate: "Ongoing strategic plan through 2024",
  },
  {
    id: "p14",
    name: "Global Minimum Corporate Tax",
    domain: "Economy",
    scope: "Global",
    status: "Proposed",
    country: "OECD / 140+ Countries",
    year: 2021,
    budgetUSD: 150000,
    beneficiaries: 7800000,
    adoptionRate: 55,
    impactScore: 7.0,
    description:
      "OECD/G20 Inclusive Framework agreement to impose a 15% global minimum corporate tax rate on multinationals with revenue >€750M. Pillar One reallocates taxing rights to market jurisdictions; Pillar Two establishes the global minimum rate. Aims to generate $150B+ in additional annual global tax revenue.",
    tags: ["Tax", "BEPS", "Multinationals", "Fairness"],
    partiesFavoring: [
      { name: "Democratic Party (US)", stance: "strong" },
      { name: "Labour / Social Democrat parties (EU)", stance: "strong" },
      { name: "G7 Finance Ministers", stance: "strong" },
      { name: "Centre-Right / EPP (EU)", stance: "moderate" },
      { name: "Low-tax jurisdictions (Ireland, Hungary)", stance: "opposed" },
      { name: "Republican Party (US)", stance: "opposed" },
      { name: "Libertarian / Free-Market parties", stance: "opposed" },
    ],
    keyObjectives: [
      "Establish 15% global minimum tax rate on large multinationals",
      "Curtail profit-shifting to low-tax jurisdictions and tax havens",
      "Reallocate taxing rights to countries where revenues are generated (Pillar One)",
      "Generate $150B+ in additional annual global corporate tax revenue",
      "Reduce distortionary tax competition between countries",
    ],
    relatedPolicies: [],
    legislativeBody: "OECD / G20 / National parliaments",
    implementingAgency: "OECD Centre for Tax Policy / National Tax Authorities",
    renewalDate: "Phased implementation 2024–2026",
  },
  {
    id: "p15",
    name: "Jobseeker&#39;s Allowance Reform — UK",
    domain: "Social",
    scope: "National",
    status: "Active",
    country: "United Kingdom",
    year: 2013,
    budgetUSD: 8400,
    beneficiaries: 2200,
    adoptionRate: 95,
    impactScore: 6.2,
    description:
      "Universal Credit — merges six legacy benefits (income support, JSA, ESA, housing benefit, child tax credit, working tax credit) into a single monthly payment with work conditionality and a benefits cap. Managed by DWP via an online portal, with a five-week wait for initial payment that has been widely criticized.",
    tags: ["Welfare", "Universal Credit", "Conditionality"],
    partiesFavoring: [
      { name: "Conservative Party (UK)", stance: "strong" },
      { name: "Reform UK / UKIP", stance: "strong" },
      { name: "Labour Party (partial critique)", stance: "moderate" },
      { name: "SNP / Plaid Cymru", stance: "opposed" },
      { name: "Green Party (UK)", stance: "opposed" },
      { name: "Disability rights advocates", stance: "opposed" },
    ],
    keyObjectives: [
      "Merge 6 legacy benefit types into a single streamlined Universal Credit payment",
      "Incentivize work by tapering benefits as earnings increase (63p taper rate)",
      "Reduce welfare fraud and administrative complexity",
      "Extend conditionality requirements to in-work benefit claimants",
      "Achieve long-term welfare savings of £4B+ annually",
    ],
    relatedPolicies: ["p9"],
    legislativeBody: "UK Parliament (Welfare Reform Act 2012)",
    implementingAgency: "Department for Work and Pensions (DWP)",
    renewalDate: "Ongoing (reforms proposed under Labour 2024)",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DOMAIN_COLOR: Record<PolicyDomain, string> = {
  Climate: "bg-emerald-500/15 text-emerald-400",
  Healthcare: "bg-blue-500/15 text-blue-400",
  Education: "bg-yellow-500/15 text-yellow-400",
  Infrastructure: "bg-orange-500/15 text-orange-400",
  Defense: "bg-red-500/15 text-red-400",
  Economy: "bg-purple-500/15 text-purple-400",
  Social: "bg-pink-500/15 text-pink-400",
  Technology: "bg-cyan-500/15 text-cyan-400",
};

const SCOPE_ICON: Record<PolicyScope, React.ReactNode> = {
  Global: <Globe size={13} className="shrink-0" />,
  National: <Buildings size={13} className="shrink-0" />,
  Regional: <Scales size={13} className="shrink-0" />,
  Local: <MapPin size={13} className="shrink-0" />,
};

const STATUS_STYLE: Record<PolicyStatus, string> = {
  Active: "bg-success/15 text-success",
  Enacted: "bg-blue-500/15 text-blue-400",
  Proposed: "bg-yellow-500/15 text-yellow-400",
  Pending: "bg-orange-500/15 text-orange-400",
  Expired: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<PolicyStatus, React.ReactNode> = {
  Active: <CheckCircle size={11} weight="fill" />,
  Enacted: <CheckCircle size={11} weight="fill" />,
  Proposed: <Clock size={11} weight="fill" />,
  Pending: <Clock size={11} weight="fill" />,
  Expired: <XCircle size={11} weight="fill" />,
};

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}T`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}B`;
  return `$${n}M`;
}
function fmtPeople(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}B`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}M`;
  return `${n}K`;
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function BudgetTab({ data }: { data: Policy[] }) {
  const total = data.reduce((s, p) => s + p.budgetUSD, 0);
  const byDomain = Object.entries(
    data.reduce<Record<string, number>>((acc, p) => {
      acc[p.domain] = (acc[p.domain] || 0) + p.budgetUSD;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Budget by domain */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Budget Allocation by Domain</h3>
        <div className="space-y-3">
          {byDomain.map(([domain, amount]) => {
            const pct = Math.round((amount / total) * 100);
            return (
              <div key={domain}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-foreground font-medium">{domain}</span>
                  <span className="text-xs text-muted-foreground">{fmt(amount)} · {pct}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <SourceLink sources={[
          { label: "OECD Gov't Spending", url: "https://data.oecd.org/gga/general-government-spending.htm" },
          { label: "IMF Fiscal Monitor", url: "https://www.imf.org/en/Publications/FM" },
          { label: "World Bank PFM", url: "https://www.worldbank.org/en/topic/publicfinancialmanagement" },
        ]} />
      </div>

      {/* Policy budget table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Policy Budget Breakdown</h3>
        </div>

      {/* Policy budget table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Policy Budget Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">
                  Policy
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">
                  Domain
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-medium">
                  Scope
                </th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">
                  Budget
                </th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">
                  % Share
                </th>
              </tr>
            </thead>
            <tbody>
              {[...data]
                .sort((a, b) => b.budgetUSD - a.budgetUSD)
                .map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
                  >
                    <td className="px-5 py-3 font-medium text-foreground max-w-[200px] truncate">
                      {p.name}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DOMAIN_COLOR[p.domain]}`}
                      >
                        {p.domain}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground flex items-center gap-1">
                      {SCOPE_ICON[p.scope]}
                      {p.scope}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-foreground">
                      {fmt(p.budgetUSD)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {((p.budgetUSD / total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-3">
          <SourceLink sources={[
            { label: "OECD Stats", url: "https://stats.oecd.org/" },
            { label: "UN Budget Portal", url: "https://open.un.org/budget" },
            { label: "EU Budget", url: "https://budget.ec.europa.eu/index_en" },
          ]} />
        </div>
      </div>
    </div>
  );
}

function PolicyModal({
  policy,
  onClose,
}: {
  policy: Policy;
  onClose: () => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative z-10 w-full rounded-2xl animate-fade-in shadow-2xl modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : "max-w-lg max-h-[90vh]"}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[policy.status]}`}
                >
                  {STATUS_ICON[policy.status]}
                  {policy.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DOMAIN_COLOR[policy.domain]}`}
                >
                  {policy.domain}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  {SCOPE_ICON[policy.scope]}
                  {policy.scope}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                {policy.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {policy.country} · {policy.year}
              </p>
            </div>
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label={isExpanded ? "Collapse modal" : "Expand modal to full screen"}
              title={isExpanded ? "Collapse" : "Expand to full screen"}
            >
              {isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 1H1v4M11 1h4v4M5 15H1v-4M11 15h4v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {policy.description}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Budget", value: fmt(policy.budgetUSD) },
              {
                label: "Beneficiaries",
                value: fmtPeople(policy.beneficiaries),
              },
              { label: "Impact Score", value: `${policy.impactScore}/10` },
              { label: "Adoption Rate", value: `${policy.adoptionRate}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-3 modal-tile">
                <p className="text-[10px] text-muted-foreground font-sans">
                  {s.label}
                </p>
                <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="mb-5 modal-tile rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {policy.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full font-sans bg-secondary/10 text-secondary border border-secondary/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Key Objectives */}
          <div className="mb-5 modal-tile rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
              Key Objectives
            </p>
            <ul className="space-y-2">
              {policy.keyObjectives.map((obj, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full text-primary flex items-center justify-center text-[9px] font-bold bg-muted border border-border">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Parties Favoring */}
          <div className="mb-5 modal-tile rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
              Political Support
            </p>
            <div className="space-y-1.5">
              {policy.partiesFavoring.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 bg-muted border border-border"
                >
                  <span className="text-xs text-foreground truncate flex-1">
                    {p.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 bg-card border border-border ${
                      p.stance === "strong"
                        ? "text-success"
                        : p.stance === "moderate"
                          ? "text-yellow-400"
                          : "text-destructive"
                    }`}
                  >
                    {p.stance === "strong"
                      ? "✓ Support"
                      : p.stance === "moderate"
                        ? "~ Moderate"
                        : "✗ Opposed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Details */}
          <div className="rounded-xl p-4 space-y-2 mb-5 modal-tile">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
              Implementation
            </p>
            {policy.legislativeBody && (
              <div className="flex justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Legislative Body
                </span>
                <span className="text-[11px] text-foreground font-medium text-right max-w-[55%]">
                  {policy.legislativeBody}
                </span>
              </div>
            )}
            {policy.implementingAgency && (
              <div className="flex justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Agency
                </span>
                <span className="text-[11px] text-foreground font-medium text-right max-w-[55%]">
                  {policy.implementingAgency}
                </span>
              </div>
            )}
            {policy.renewalDate && (
              <div className="flex justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Renewal / Timeline
                </span>
                <span className="text-[11px] text-foreground font-medium text-right max-w-[55%]">
                  {policy.renewalDate}
                </span>
              </div>
            )}
          </div>

          {/* Related Policies */}
          {policy.relatedPolicies.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                Related Policies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {policy.relatedPolicies.map((rid) => {
                  const rel = policies.find((p) => p.id === rid);
                  if (!rel) return null;
                  return (
                    <span
                      key={rid}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLOR[rel.domain]}`}
                    >
                      {rel.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Source links */}
          <div className="pt-3 border-t border-border mt-4">
            <SourceLink sources={[
              { label: "OECD Policy Library", url: "https://www.oecd.org/en/topics/policy-issues/public-governance.html" },
              { label: "World Bank Governance", url: "https://www.worldbank.org/en/topic/governance" },
              { label: "UN Policy Briefs", url: "https://www.un.org/development/desa/publications/policy-briefs.html" },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InitiativesTab({ data }: { data: Policy[] }) {
  const [modalPolicy, setModalPolicy] = useState<Policy | null>(null);

  return (
    <>
      {modalPolicy && (
        <PolicyModal
          policy={modalPolicy}
          onClose={() => setModalPolicy(null)}
        />
      )}
      <div className="space-y-3">
        {data.map((p) => (
          <button
            key={p.id}
            onClick={() => setModalPolicy(p)}
            className="w-full text-left bg-card border border-border rounded-xl p-4 transition-all duration-150 hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[p.status]}`}
                  >
                    {STATUS_ICON[p.status]}
                    {p.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DOMAIN_COLOR[p.domain]}`}
                  >
                    {p.domain}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-foreground">
                    {SCOPE_ICON[p.scope]}
                    {p.scope}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {p.name}
                </p>
                <p className="text-[11px] text-foreground/60 mt-1">
                  {p.country} · {p.year}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-foreground font-mono">
                  {fmt(p.budgetUSD)}
                </p>
                <p className="text-[10px] text-foreground/60">budget</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full font-sans bg-secondary/10 text-secondary border border-secondary/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function ImpactTab({ data }: { data: Policy[] }) {
  const sorted = [...data].sort((a, b) => b.impactScore - a.impactScore);
  const avgImpact = (
    data.reduce((s, p) => s + p.impactScore, 0) / data.length
  ).toFixed(1);
  const totalBeneficiaries = data.reduce((s, p) => s + p.beneficiaries, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Avg Impact Score",
            value: `${avgImpact}/10`,
            sub: "Across all policies",
          },
          {
            label: "Total Beneficiaries",
            value: fmtPeople(totalBeneficiaries),
            sub: "People impacted",
          },
          {
            label: "High Impact (≥8)",
            value: data.filter((p) => p.impactScore >= 8).length.toString(),
            sub: "Policies scoring 8+",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {c.label}
            </p>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Impact leaderboard */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Impact Leaderboard
        </h3>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span
                className={`text-xs font-bold w-5 text-right shrink-0 ${i < 3 ? "text-primary" : "text-muted-foreground"}`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-foreground font-medium truncate max-w-[55%]">
                    {p.name}
                  </span>
                  <span className="text-xs font-bold text-primary shrink-0">
                    {p.impactScore}/10
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      p.impactScore >= 8
                        ? "bg-success"
                        : p.impactScore >= 6.5
                          ? "bg-primary"
                          : "bg-muted-foreground"
                    }`}
                    style={{ width: `${(p.impactScore / 10) * 100}%` }}
                  />
                </div>
              </div>
              <span
                className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full ${DOMAIN_COLOR[p.domain]}`}
              >
                {p.domain}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiaries vs Budget scatter */}
      <div className="bg-card border border-border rounded-xl p-5 selected">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Beneficiaries vs Budget
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Bubble size = impact score
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 8, right: 12, bottom: 20, left: 8 }}>
            <defs>
              {(Object.keys(DOMAIN_COLOR) as PolicyDomain[]).map((domain) => {
                const colorMap: Record<PolicyDomain, string> = {
                  Climate: "#10b981",
                  Healthcare: "#3b82f6",
                  Education: "#eab308",
                  Infrastructure: "#f97316",
                  Defense: "#ef4444",
                  Economy: "#a855f7",
                  Social: "#ec4899",
                  Technology: "#06b6d4",
                };
                return (
                  <radialGradient
                    key={domain}
                    id={`bubbleGrad-${domain}`}
                    cx="40%"
                    cy="35%"
                    r="65%"
                  >
                    <stop
                      offset="0%"
                      stopColor={colorMap[domain]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={colorMap[domain]}
                      stopOpacity={0.4}
                    />
                  </radialGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(128,128,128,0.12)"
            />
            <XAxis
              dataKey="x"
              name="Budget"
              type="number"
              scale="log"
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => fmt(v)}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              label={{
                value: "Budget →",
                position: "insideBottomRight",
                offset: -4,
                fontSize: 9,
                fill: "var(--muted-foreground)",
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="y"
              name="Beneficiaries"
              type="number"
              scale="log"
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => fmtPeople(v)}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              label={{
                value: "Reach ↑",
                angle: -90,
                position: "insideLeft",
                offset: 12,
                fontSize: 9,
                fill: "var(--muted-foreground)",
              }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{
                strokeDasharray: "3 3",
                stroke: "rgba(128,128,128,0.3)",
              }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as {
                  name: string;
                  x: number;
                  y: number;
                  impact: number;
                  domain: PolicyDomain;
                };
                return (
                  <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs max-w-[180px]">
                    <p className="font-semibold text-foreground mb-1 leading-snug">
                      {d.name}
                    </p>
                    <p className="text-muted-foreground">
                      Budget:{" "}
                      <span className="text-foreground font-mono">
                        {fmt(d.x)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Reach:{" "}
                      <span className="text-foreground font-mono">
                        {fmtPeople(d.y)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Impact:{" "}
                      <span className="text-foreground font-mono">
                        {d.impact}/10
                      </span>
                    </p>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${DOMAIN_COLOR[d.domain]}`}
                    >
                      {d.domain}
                    </span>
                  </div>
                );
              }}
            />
            <Scatter
              data={data.map((p) => ({
                x: p.budgetUSD,
                y: p.beneficiaries,
                z: 40 + p.impactScore * 18,
                name: p.name,
                impact: p.impactScore,
                domain: p.domain,
              }))}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const r = Math.sqrt(payload.z / Math.PI);
                const colorMap: Record<PolicyDomain, string> = {
                  Climate: "#10b981",
                  Healthcare: "#3b82f6",
                  Education: "#eab308",
                  Infrastructure: "#f97316",
                  Defense: "#ef4444",
                  Economy: "#a855f7",
                  Social: "#ec4899",
                  Technology: "#06b6d4",
                };
                const color =
                  colorMap[payload.domain as PolicyDomain] || "#6366f1";
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={`url(#bubbleGrad-${payload.domain})`}
                    stroke={color}
                    strokeWidth={1.2}
                    strokeOpacity={0.6}
                    style={{ cursor: "pointer" }}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdoptionTab({ data }: { data: Policy[] }) {
  const sorted = [...data].sort((a, b) => b.adoptionRate - a.adoptionRate);
  const avgAdoption = Math.round(
    data.reduce((s, p) => s + p.adoptionRate, 0) / data.length,
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Avg Adoption Rate",
            value: `${avgAdoption}%`,
            sub: "Across all policies",
          },
          {
            label: "Full Adoption (100%)",
            value: data.filter((p) => p.adoptionRate === 100).length.toString(),
            sub: "Policies fully adopted",
          },
          {
            label: "High Adoption (≥80%)",
            value: data.filter((p) => p.adoptionRate >= 80).length.toString(),
            sub: "Policies above 80%",
          },
          {
            label: "Low Adoption (<60%)",
            value: data.filter((p) => p.adoptionRate < 60).length.toString(),
            sub: "Need more uptake",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {c.label}
            </p>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Adoption rate bars */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Adoption Rate by Policy
        </h3>
        <div className="space-y-3">
          {sorted.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${DOMAIN_COLOR[p.domain]}`}
                  >
                    {p.domain}
                  </span>
                  <span className="text-xs text-foreground font-medium truncate">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {p.adoptionRate >= avgAdoption ? (
                    <ArrowUp size={10} className="text-success" />
                  ) : (
                    <ArrowDown size={10} className="text-destructive" />
                  )}
                  <span className="text-xs font-bold text-foreground">
                    {p.adoptionRate}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    p.adoptionRate >= 80
                      ? "bg-success"
                      : p.adoptionRate >= 60
                        ? "bg-primary"
                        : "bg-destructive/60"
                  }`}
                  style={{ width: `${p.adoptionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adoption vs Impact quadrant analysis */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Adoption vs Impact
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          Quadrant analysis — ideal policies: high adoption + high impact
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "High Impact · High Adoption",
              color: "border-success/40 bg-success/5",
              filter: (p: Policy) =>
                p.impactScore >= 7.5 && p.adoptionRate >= 75,
            },
            {
              label: "High Impact · Low Adoption",
              color: "border-yellow-500/40 bg-yellow-500/5",
              filter: (p: Policy) =>
                p.impactScore >= 7.5 && p.adoptionRate < 75,
            },
            {
              label: "Low Impact · High Adoption",
              color: "border-blue-500/40 bg-blue-500/5",
              filter: (p: Policy) =>
                p.impactScore < 7.5 && p.adoptionRate >= 75,
            },
            {
              label: "Low Impact · Low Adoption",
              color: "border-destructive/30 bg-destructive/5",
              filter: (p: Policy) => p.impactScore < 7.5 && p.adoptionRate < 75,
            },
          ].map((q) => {
            const items = data.filter(q.filter);
            return (
              <div key={q.label} className={`border rounded-xl p-3 ${q.color}`}>
                <p className="text-[10px] font-semibold text-foreground mb-2">
                  {q.label}
                </p>
                <p className="text-xl font-bold text-foreground mb-1">
                  {items.length}
                </p>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((p) => (
                    <p
                      key={p.id}
                      className="text-[9px] text-muted-foreground truncate"
                    >
                      · {p.name}
                    </p>
                  ))}
                  {items.length > 3 && (
                    <p className="text-[9px] text-muted-foreground">
                      +{items.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: PolicyTab; label: string; icon: React.ReactNode }[] = [
  { id: "budget", label: "Budget", icon: <CurrencyDollar size={14} /> },
  { id: "initiatives", label: "Initiatives", icon: <Lightbulb size={14} /> },
  { id: "impact", label: "Impact", icon: <ChartLine size={14} /> },
  { id: "adoption", label: "Adoption", icon: <Users size={14} /> },
  { id: "countries", label: "Countries", icon: <Globe size={14} /> },
];

// ─── Country Policy Priorities Data ──────────────────────────────────────────

interface CountryPolicyProfile {
  countryId: string;
  countryName: string;
  continent: string;
  gdp: number;
  priorities: {
    domain: PolicyDomain;
    budgetPct: number; // % of GDP allocated
    score: number; // 0-10 priority score
    trend: "up" | "down" | "stable";
    keyInitiative: string;
    budgetUSD: number; // billions
  }[];
  overallPolicyStrength: number; // 0-10
  policyNotes: string;
}

const DOMAIN_ICON: Record<PolicyDomain, React.ReactNode> = {
  Climate: <Globe size={12} weight="fill" />,
  Healthcare: <Heart size={12} weight="fill" />,
  Education: <BookOpen size={12} weight="fill" />,
  Infrastructure: <Wrench size={12} weight="fill" />,
  Defense: <ShieldChevron size={12} weight="fill" />,
  Economy: <TrendUp size={12} weight="fill" />,
  Social: <HandHeart size={12} weight="fill" />,
  Technology: <DeviceMobile size={12} weight="fill" />,
};

const DOMAIN_COLOR_HEX: Record<PolicyDomain, string> = {
  Climate: "#10b981",
  Healthcare: "#3b82f6",
  Education: "#eab308",
  Infrastructure: "#f97316",
  Defense: "#ef4444",
  Economy: "#a855f7",
  Social: "#ec4899",
  Technology: "#06b6d4",
};

const countryPolicyProfiles: CountryPolicyProfile[] = [
  {
    countryId: "us",
    countryName: "United States",
    continent: "North America",
    gdp: 29170,
    overallPolicyStrength: 8.1,
    policyNotes:
      "World&#39;s largest policy spender; driven by defense, healthcare, and clean energy investments post-IRA.",
    priorities: [
      {
        domain: "Defense",
        budgetPct: 3.5,
        score: 9.2,
        trend: "up",
        keyInitiative: "National Defense Authorization Act",
        budgetUSD: 886,
      },
      {
        domain: "Healthcare",
        budgetPct: 17.3,
        score: 9.0,
        trend: "stable",
        keyInitiative: "Affordable Care Act + Medicare",
        budgetUSD: 4500,
      },
      {
        domain: "Infrastructure",
        budgetPct: 2.1,
        score: 8.5,
        trend: "up",
        keyInitiative: "Bipartisan Infrastructure Law ($1.2T)",
        budgetUSD: 612,
      },
      {
        domain: "Climate",
        budgetPct: 1.3,
        score: 8.0,
        trend: "up",
        keyInitiative: "Inflation Reduction Act ($369B)",
        budgetUSD: 369,
      },
      {
        domain: "Education",
        budgetPct: 5.0,
        score: 7.5,
        trend: "stable",
        keyInitiative: "Every Student Succeeds Act",
        budgetUSD: 1459,
      },
      {
        domain: "Economy",
        budgetPct: 4.2,
        score: 8.8,
        trend: "up",
        keyInitiative: "CHIPS & Science Act ($280B)",
        budgetUSD: 1200,
      },
      {
        domain: "Social",
        budgetPct: 6.1,
        score: 7.8,
        trend: "stable",
        keyInitiative: "Social Security & SNAP Programs",
        budgetUSD: 1780,
      },
      {
        domain: "Technology",
        budgetPct: 1.8,
        score: 8.6,
        trend: "up",
        keyInitiative: "AI Executive Order + CHIPS Act",
        budgetUSD: 525,
      },
    ],
  },
  {
    countryId: "cn",
    countryName: "China",
    continent: "Asia",
    gdp: 19530,
    overallPolicyStrength: 8.8,
    policyNotes:
      "State-directed economy with aggressive 5-year planning; massive infrastructure, tech, and manufacturing investment.",
    priorities: [
      {
        domain: "Infrastructure",
        budgetPct: 6.8,
        score: 9.8,
        trend: "up",
        keyInitiative: "Belt & Road Initiative + High-Speed Rail",
        budgetUSD: 1328,
      },
      {
        domain: "Technology",
        budgetPct: 2.4,
        score: 9.5,
        trend: "up",
        keyInitiative: "Made in China 2025 + AI Strategy",
        budgetUSD: 469,
      },
      {
        domain: "Defense",
        budgetPct: 1.7,
        score: 8.9,
        trend: "up",
        keyInitiative: "PLA Modernization Program",
        budgetUSD: 332,
      },
      {
        domain: "Economy",
        budgetPct: 3.1,
        score: 9.2,
        trend: "stable",
        keyInitiative: "14th Five-Year Plan",
        budgetUSD: 606,
      },
      {
        domain: "Education",
        budgetPct: 4.2,
        score: 8.5,
        trend: "up",
        keyInitiative: "Double Reduction Policy + STEM Push",
        budgetUSD: 820,
      },
      {
        domain: "Climate",
        budgetPct: 1.5,
        score: 7.8,
        trend: "up",
        keyInitiative: "Carbon Neutrality by 2060 Plan",
        budgetUSD: 293,
      },
      {
        domain: "Healthcare",
        budgetPct: 5.4,
        score: 7.2,
        trend: "up",
        keyInitiative: "Healthy China 2030 Initiative",
        budgetUSD: 1055,
      },
      {
        domain: "Social",
        budgetPct: 2.8,
        score: 6.9,
        trend: "stable",
        keyInitiative: "Common Prosperity Program",
        budgetUSD: 547,
      },
    ],
  },
  {
    countryId: "de",
    countryName: "Germany",
    continent: "Europe",
    gdp: 4530,
    overallPolicyStrength: 8.4,
    policyNotes:
      "European policy leader; Energiewende (energy transition) flagship; high social spending and industrial policy reform.",
    priorities: [
      {
        domain: "Climate",
        budgetPct: 2.1,
        score: 9.1,
        trend: "up",
        keyInitiative: "Energiewende (Energy Transition)",
        budgetUSD: 95,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.8,
        score: 8.2,
        trend: "up",
        keyInitiative: "Deutsche Bahn Modernization + Digitalpakt",
        budgetUSD: 82,
      },
      {
        domain: "Social",
        budgetPct: 26.0,
        score: 9.0,
        trend: "stable",
        keyInitiative: "Bürgergeld Welfare Reform",
        budgetUSD: 1178,
      },
      {
        domain: "Healthcare",
        budgetPct: 11.7,
        score: 8.8,
        trend: "stable",
        keyInitiative: "Statutory Health Insurance (GKV)",
        budgetUSD: 530,
      },
      {
        domain: "Defense",
        budgetPct: 2.0,
        score: 7.5,
        trend: "up",
        keyInitiative: "Zeitenwende — €100B Special Fund",
        budgetUSD: 91,
      },
      {
        domain: "Economy",
        budgetPct: 1.4,
        score: 7.9,
        trend: "stable",
        keyInitiative: "Industry Strategy 2030",
        budgetUSD: 63,
      },
      {
        domain: "Education",
        budgetPct: 4.8,
        score: 8.3,
        trend: "stable",
        keyInitiative: "Digitalpakt Schools + Vocational Training",
        budgetUSD: 218,
      },
      {
        domain: "Technology",
        budgetPct: 0.9,
        score: 7.4,
        trend: "up",
        keyInitiative: "German AI Strategy €5B",
        budgetUSD: 41,
      },
    ],
  },
  {
    countryId: "in",
    countryName: "India",
    continent: "Asia",
    gdp: 4270,
    overallPolicyStrength: 7.6,
    policyNotes:
      "Fastest-growing major economy; National Infrastructure Pipeline, PLI schemes, and Digital India drive policy.",
    priorities: [
      {
        domain: "Infrastructure",
        budgetPct: 3.3,
        score: 9.0,
        trend: "up",
        keyInitiative: "National Infrastructure Pipeline ($1.4T)",
        budgetUSD: 141,
      },
      {
        domain: "Technology",
        budgetPct: 1.2,
        score: 8.8,
        trend: "up",
        keyInitiative: "Digital India + UPI + Aadhaar Stack",
        budgetUSD: 51,
      },
      {
        domain: "Education",
        budgetPct: 4.5,
        score: 8.0,
        trend: "up",
        keyInitiative: "National Education Policy 2020",
        budgetUSD: 192,
      },
      {
        domain: "Healthcare",
        budgetPct: 3.0,
        score: 7.5,
        trend: "up",
        keyInitiative: "Ayushman Bharat PM-JAY",
        budgetUSD: 128,
      },
      {
        domain: "Economy",
        budgetPct: 2.8,
        score: 8.5,
        trend: "up",
        keyInitiative: "PLI (Production-Linked Incentive) Schemes",
        budgetUSD: 120,
      },
      {
        domain: "Climate",
        budgetPct: 0.8,
        score: 7.0,
        trend: "up",
        keyInitiative: "National Action Plan on Climate Change",
        budgetUSD: 34,
      },
      {
        domain: "Social",
        budgetPct: 3.5,
        score: 7.8,
        trend: "stable",
        keyInitiative: "PM-KISAN + MGNREGS Farm Aid",
        budgetUSD: 150,
      },
      {
        domain: "Defense",
        budgetPct: 2.4,
        score: 8.2,
        trend: "up",
        keyInitiative: "Atmanirbhar Bharat Defense Self-Reliance",
        budgetUSD: 103,
      },
    ],
  },
  {
    countryId: "gb",
    countryName: "United Kingdom",
    continent: "Europe",
    gdp: 3340,
    overallPolicyStrength: 8.0,
    policyNotes:
      "Post-Brexit industrial strategy; NHS reform, net-zero commitment, and levelling up agenda define UK policy.",
    priorities: [
      {
        domain: "Healthcare",
        budgetPct: 10.9,
        score: 9.0,
        trend: "up",
        keyInitiative: "NHS Long Term Plan (£20.5B/yr boost)",
        budgetUSD: 364,
      },
      {
        domain: "Climate",
        budgetPct: 1.0,
        score: 8.6,
        trend: "up",
        keyInitiative: "Net Zero Strategy 2050",
        budgetUSD: 33,
      },
      {
        domain: "Education",
        budgetPct: 5.5,
        score: 8.0,
        trend: "stable",
        keyInitiative: "Schools White Paper + Skills England",
        budgetUSD: 184,
      },
      {
        domain: "Defense",
        budgetPct: 2.3,
        score: 8.5,
        trend: "up",
        keyInitiative: "AUKUS + Defence Review",
        budgetUSD: 77,
      },
      {
        domain: "Social",
        budgetPct: 16.8,
        score: 8.8,
        trend: "stable",
        keyInitiative: "Universal Credit + State Pension Triple Lock",
        budgetUSD: 561,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.4,
        score: 7.5,
        trend: "up",
        keyInitiative: "National Infrastructure Strategy",
        budgetUSD: 47,
      },
      {
        domain: "Economy",
        budgetPct: 0.8,
        score: 7.8,
        trend: "up",
        keyInitiative: "Invest 2035 Industrial Strategy",
        budgetUSD: 27,
      },
      {
        domain: "Technology",
        budgetPct: 0.7,
        score: 7.9,
        trend: "up",
        keyInitiative: "UK AI Safety Institute + Tech Catapult",
        budgetUSD: 23,
      },
    ],
  },
  {
    countryId: "fr",
    countryName: "France",
    continent: "Europe",
    gdp: 3050,
    overallPolicyStrength: 8.2,
    policyNotes:
      "Strong state intervention; industrial sovereignty, green reindustrialisation, and welfare state expansion.",
    priorities: [
      {
        domain: "Social",
        budgetPct: 31.0,
        score: 9.2,
        trend: "stable",
        keyInitiative: "Solidarity & Social Protection Framework",
        budgetUSD: 946,
      },
      {
        domain: "Healthcare",
        budgetPct: 12.2,
        score: 9.0,
        trend: "up",
        keyInitiative: "Plan Ma Santé 2022 + Sécurité Sociale",
        budgetUSD: 372,
      },
      {
        domain: "Climate",
        budgetPct: 1.4,
        score: 8.5,
        trend: "up",
        keyInitiative: "Plan France 2030 + Nuclear Revival",
        budgetUSD: 43,
      },
      {
        domain: "Education",
        budgetPct: 5.5,
        score: 8.4,
        trend: "stable",
        keyInitiative: "Choc des savoirs Education Reform",
        budgetUSD: 168,
      },
      {
        domain: "Defense",
        budgetPct: 2.1,
        score: 8.0,
        trend: "up",
        keyInitiative: "Loi de Programmation Militaire 2024-30",
        budgetUSD: 64,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.3,
        score: 7.6,
        trend: "stable",
        keyInitiative: "Grand Paris Express Metro + TGV Expansion",
        budgetUSD: 40,
      },
      {
        domain: "Economy",
        budgetPct: 1.9,
        score: 7.8,
        trend: "up",
        keyInitiative: "France Relance + Reindustrialisation",
        budgetUSD: 58,
      },
      {
        domain: "Technology",
        budgetPct: 0.8,
        score: 7.5,
        trend: "up",
        keyInitiative: "French Tech + AI National Strategy",
        budgetUSD: 24,
      },
    ],
  },
  {
    countryId: "jp",
    countryName: "Japan",
    continent: "Asia",
    gdp: 4440,
    overallPolicyStrength: 8.0,
    policyNotes:
      "Post-deflation revival through Abenomics successors; green transformation (GX) and semiconductor revival dominate policy.",
    priorities: [
      {
        domain: "Economy",
        budgetPct: 2.8,
        score: 8.8,
        trend: "up",
        keyInitiative: "New Capitalism Economic Plan",
        budgetUSD: 124,
      },
      {
        domain: "Defense",
        budgetPct: 2.0,
        score: 8.5,
        trend: "up",
        keyInitiative: "National Defense Strategy — 2% GDP target",
        budgetUSD: 89,
      },
      {
        domain: "Climate",
        budgetPct: 1.2,
        score: 8.0,
        trend: "up",
        keyInitiative: "Green Transformation (GX) ¥150T Plan",
        budgetUSD: 53,
      },
      {
        domain: "Technology",
        budgetPct: 1.4,
        score: 8.6,
        trend: "up",
        keyInitiative: "Semiconductor Rebirth + Rapidus Chip Fab",
        budgetUSD: 62,
      },
      {
        domain: "Social",
        budgetPct: 23.0,
        score: 8.5,
        trend: "stable",
        keyInitiative: "Child & Family Agency + Aging Society Measures",
        budgetUSD: 1021,
      },
      {
        domain: "Healthcare",
        budgetPct: 11.4,
        score: 8.7,
        trend: "stable",
        keyInitiative: "Universal Health Insurance (Kokuho)",
        budgetUSD: 506,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.6,
        score: 7.5,
        trend: "stable",
        keyInitiative: "National Resilience Plan + Linear Shinkansen",
        budgetUSD: 71,
      },
      {
        domain: "Education",
        budgetPct: 3.7,
        score: 7.0,
        trend: "up",
        keyInitiative: "University Funding Reform + STEAM Push",
        budgetUSD: 164,
      },
    ],
  },
  {
    countryId: "br",
    countryName: "Brazil",
    continent: "South America",
    gdp: 2360,
    overallPolicyStrength: 6.8,
    policyNotes:
      "Re-engagement with social policy under Lula; Amazon protection, Bolsa Família expansion, and infrastructure concessions.",
    priorities: [
      {
        domain: "Social",
        budgetPct: 14.8,
        score: 8.5,
        trend: "up",
        keyInitiative: "Bolsa Família + New PAC Infrastructure",
        budgetUSD: 349,
      },
      {
        domain: "Climate",
        budgetPct: 0.9,
        score: 7.8,
        trend: "up",
        keyInitiative: "Amazon Fund Reactivation + Eco-92 Legacy",
        budgetUSD: 21,
      },
      {
        domain: "Healthcare",
        budgetPct: 9.8,
        score: 7.5,
        trend: "up",
        keyInitiative: "SUS (Sistema Único de Saúde) Reform",
        budgetUSD: 231,
      },
      {
        domain: "Education",
        budgetPct: 6.2,
        score: 7.2,
        trend: "up",
        keyInitiative: "Mais Educação / FUNDEB Reform",
        budgetUSD: 146,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.8,
        score: 7.5,
        trend: "up",
        keyInitiative: "New PAC ($350B) Roads/Rail/Water",
        budgetUSD: 57,
      },
      {
        domain: "Economy",
        budgetPct: 2.1,
        score: 7.0,
        trend: "stable",
        keyInitiative: "Arcabouço Fiscal + Reindustrialisation",
        budgetUSD: 50,
      },
      {
        domain: "Defense",
        budgetPct: 1.5,
        score: 6.2,
        trend: "stable",
        keyInitiative: "F-39 Gripen Program + Amazon Surveillance",
        budgetUSD: 35,
      },
      {
        domain: "Technology",
        budgetPct: 0.6,
        score: 6.5,
        trend: "up",
        keyInitiative: "Brazil Digital Transformation Strategy",
        budgetUSD: 14,
      },
    ],
  },
  {
    countryId: "ca",
    countryName: "Canada",
    continent: "North America",
    gdp: 2290,
    overallPolicyStrength: 7.9,
    policyNotes:
      "Progressive federal spending; national pharmacare, clean economy transition, and indigenous reconciliation policies.",
    priorities: [
      {
        domain: "Healthcare",
        budgetPct: 12.2,
        score: 8.8,
        trend: "up",
        keyInitiative: "National Pharmacare Act + Dental Plan",
        budgetUSD: 279,
      },
      {
        domain: "Climate",
        budgetPct: 1.6,
        score: 8.5,
        trend: "up",
        keyInitiative: "Net-Zero by 2050 Clean Economy Plan",
        budgetUSD: 37,
      },
      {
        domain: "Social",
        budgetPct: 18.0,
        score: 8.5,
        trend: "stable",
        keyInitiative: "Canada Child Benefit + OAS Reform",
        budgetUSD: 412,
      },
      {
        domain: "Infrastructure",
        budgetPct: 0.9,
        score: 7.4,
        trend: "up",
        keyInitiative: "Investing in Canada Plan ($186B)",
        budgetUSD: 21,
      },
      {
        domain: "Defense",
        budgetPct: 1.4,
        score: 6.8,
        trend: "up",
        keyInitiative: "Strong Secure Engaged Defense Policy",
        budgetUSD: 32,
      },
      {
        domain: "Education",
        budgetPct: 5.3,
        score: 8.0,
        trend: "stable",
        keyInitiative: "Post-Secondary Education + Childcare $10/day",
        budgetUSD: 121,
      },
      {
        domain: "Economy",
        budgetPct: 1.1,
        score: 7.5,
        trend: "up",
        keyInitiative: "Critical Minerals Strategy + Cleantech",
        budgetUSD: 25,
      },
      {
        domain: "Technology",
        budgetPct: 0.7,
        score: 7.6,
        trend: "up",
        keyInitiative: "Pan-Canadian AI Strategy ($443M)",
        budgetUSD: 16,
      },
    ],
  },
  {
    countryId: "au_oc",
    countryName: "Australia",
    continent: "Oceania",
    gdp: 1810,
    overallPolicyStrength: 7.7,
    policyNotes:
      "Clean energy superpower ambitions; NDIS disability scheme, housing crisis response, and critical minerals strategy.",
    priorities: [
      {
        domain: "Climate",
        budgetPct: 1.1,
        score: 8.6,
        trend: "up",
        keyInitiative: "Capacity Investment Scheme + 82% Renewables",
        budgetUSD: 20,
      },
      {
        domain: "Healthcare",
        budgetPct: 10.5,
        score: 8.5,
        trend: "stable",
        keyInitiative: "Medicare + NDIS Disability Insurance",
        budgetUSD: 190,
      },
      {
        domain: "Social",
        budgetPct: 19.0,
        score: 8.3,
        trend: "stable",
        keyInitiative: "JobSeeker + Age Pension + NDIS",
        budgetUSD: 344,
      },
      {
        domain: "Defense",
        budgetPct: 2.1,
        score: 8.0,
        trend: "up",
        keyInitiative: "AUKUS Nuclear Submarine Program",
        budgetUSD: 38,
      },
      {
        domain: "Education",
        budgetPct: 5.8,
        score: 7.8,
        trend: "stable",
        keyInitiative: "Universities Accord + Fee-Free TAFE",
        budgetUSD: 105,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.3,
        score: 7.5,
        trend: "up",
        keyInitiative: "Infrastructure Investment Program ($120B)",
        budgetUSD: 24,
      },
      {
        domain: "Economy",
        budgetPct: 0.9,
        score: 7.4,
        trend: "up",
        keyInitiative: "Critical Minerals Strategy + Future Made in Aus",
        budgetUSD: 16,
      },
      {
        domain: "Technology",
        budgetPct: 0.5,
        score: 7.0,
        trend: "up",
        keyInitiative: "National Quantum Strategy + Cyber Security",
        budgetUSD: 9,
      },
    ],
  },
  {
    countryId: "sa",
    countryName: "Saudi Arabia",
    continent: "Asia",
    gdp: 1140,
    overallPolicyStrength: 7.5,
    policyNotes:
      "Vision 2030 diversification away from oil; NEOM megaproject, tourism, and private sector localisation.",
    priorities: [
      {
        domain: "Infrastructure",
        budgetPct: 5.2,
        score: 9.5,
        trend: "up",
        keyInitiative: "NEOM + Red Sea Project + Qiddiya",
        budgetUSD: 59,
      },
      {
        domain: "Economy",
        budgetPct: 3.8,
        score: 9.0,
        trend: "up",
        keyInitiative: "Saudi Vision 2030 Diversification",
        budgetUSD: 43,
      },
      {
        domain: "Defense",
        budgetPct: 6.0,
        score: 8.8,
        trend: "stable",
        keyInitiative: "SAMA Defense Spending + SAMI Arms Industry",
        budgetUSD: 68,
      },
      {
        domain: "Technology",
        budgetPct: 2.0,
        score: 8.5,
        trend: "up",
        keyInitiative: "Saudi AI & Cloud Strategy + LEAP Conference",
        budgetUSD: 23,
      },
      {
        domain: "Social",
        budgetPct: 6.5,
        score: 7.8,
        trend: "up",
        keyInitiative: "Saudization (Nitaqat) + Women Empowerment",
        budgetUSD: 74,
      },
      {
        domain: "Education",
        budgetPct: 7.2,
        score: 8.0,
        trend: "up",
        keyInitiative: "Education Quality Reform + Saudi Aramco STEM",
        budgetUSD: 82,
      },
      {
        domain: "Healthcare",
        budgetPct: 5.4,
        score: 7.5,
        trend: "up",
        keyInitiative: "National Transformation Program Health",
        budgetUSD: 62,
      },
      {
        domain: "Climate",
        budgetPct: 0.5,
        score: 5.5,
        trend: "up",
        keyInitiative: "Saudi Green Initiative — 10B Trees",
        budgetUSD: 6,
      },
    ],
  },
  {
    countryId: "kr",
    countryName: "South Korea",
    continent: "Asia",
    gdp: 1840,
    overallPolicyStrength: 8.3,
    policyNotes:
      "Semiconductor-led industrial policy, K-content soft power, aging society healthcare and pension reform.",
    priorities: [
      {
        domain: "Technology",
        budgetPct: 2.1,
        score: 9.5,
        trend: "up",
        keyInitiative: "K-Semiconductor Belt + AI National Strategy",
        budgetUSD: 39,
      },
      {
        domain: "Defense",
        budgetPct: 2.8,
        score: 8.8,
        trend: "up",
        keyInitiative: "K-Defense Export + KAMD Missile Shield",
        budgetUSD: 52,
      },
      {
        domain: "Economy",
        budgetPct: 2.4,
        score: 8.8,
        trend: "up",
        keyInitiative: "National Strategic Industries Support",
        budgetUSD: 44,
      },
      {
        domain: "Healthcare",
        budgetPct: 8.9,
        score: 8.5,
        trend: "up",
        keyInitiative: "National Health Insurance + Elder Care Reform",
        budgetUSD: 164,
      },
      {
        domain: "Climate",
        budgetPct: 0.8,
        score: 7.5,
        trend: "up",
        keyInitiative: "2050 Carbon Neutrality + Green New Deal",
        budgetUSD: 15,
      },
      {
        domain: "Education",
        budgetPct: 5.1,
        score: 8.2,
        trend: "stable",
        keyInitiative: "University Reform + IB International Programs",
        budgetUSD: 94,
      },
      {
        domain: "Social",
        budgetPct: 14.0,
        score: 8.0,
        trend: "up",
        keyInitiative: "National Pension Reform + Birth Rate Crisis",
        budgetUSD: 258,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.4,
        score: 7.8,
        trend: "stable",
        keyInitiative: "GTX Metro Expansion + Smart City Projects",
        budgetUSD: 26,
      },
    ],
  },
  {
    countryId: "mx",
    countryName: "Mexico",
    continent: "North America",
    gdp: 1420,
    overallPolicyStrength: 6.2,
    policyNotes:
      "Nearshoring boom policy responses; social cash transfer programs (Bienestar), infrastructure mega-projects.",
    priorities: [
      {
        domain: "Infrastructure",
        budgetPct: 2.8,
        score: 8.2,
        trend: "up",
        keyInitiative: "Tren Maya + Interoceanic Corridor + Dos Bocas",
        budgetUSD: 40,
      },
      {
        domain: "Social",
        budgetPct: 6.2,
        score: 8.5,
        trend: "up",
        keyInitiative: "Bienestar Social Programs + Sembrando Vida",
        budgetUSD: 88,
      },
      {
        domain: "Healthcare",
        budgetPct: 6.0,
        score: 6.5,
        trend: "up",
        keyInitiative: "IMSS-Bienestar Universal Health System",
        budgetUSD: 85,
      },
      {
        domain: "Economy",
        budgetPct: 1.4,
        score: 7.0,
        trend: "up",
        keyInitiative: "Nearshoring Strategy + Plan Mexico",
        budgetUSD: 20,
      },
      {
        domain: "Education",
        budgetPct: 5.8,
        score: 6.8,
        trend: "stable",
        keyInitiative: "New Educational Model + Libros de Texto",
        budgetUSD: 82,
      },
      {
        domain: "Defense",
        budgetPct: 0.7,
        score: 5.5,
        trend: "stable",
        keyInitiative: "National Guard + Armed Forces Expansion",
        budgetUSD: 10,
      },
      {
        domain: "Climate",
        budgetPct: 0.3,
        score: 4.5,
        trend: "down",
        keyInitiative: "Energy Sovereignty (fossil-first) Policy",
        budgetUSD: 4,
      },
      {
        domain: "Technology",
        budgetPct: 0.4,
        score: 5.8,
        trend: "up",
        keyInitiative: "Digital Welfare + Conectando México",
        budgetUSD: 6,
      },
    ],
  },
  {
    countryId: "ng",
    countryName: "Nigeria",
    continent: "Africa",
    gdp: 490,
    overallPolicyStrength: 5.8,
    policyNotes:
      "Tinubu&#39;s subsidy removal shock; rebuilding foreign reserves, industrial diversification, and infrastructure spending.",
    priorities: [
      {
        domain: "Economy",
        budgetPct: 3.2,
        score: 7.5,
        trend: "up",
        keyInitiative: "Fuel Subsidy Removal + Naira Unification",
        budgetUSD: 16,
      },
      {
        domain: "Infrastructure",
        budgetPct: 2.4,
        score: 6.8,
        trend: "up",
        keyInitiative: "Lagos-Calabar Coastal Highway + Rail Network",
        budgetUSD: 12,
      },
      {
        domain: "Education",
        budgetPct: 5.0,
        score: 5.5,
        trend: "stable",
        keyInitiative: "Universal Basic Education Program",
        budgetUSD: 25,
      },
      {
        domain: "Healthcare",
        budgetPct: 4.1,
        score: 5.8,
        trend: "up",
        keyInitiative: "Basic Health Care Provision Fund",
        budgetUSD: 20,
      },
      {
        domain: "Social",
        budgetPct: 3.0,
        score: 6.0,
        trend: "up",
        keyInitiative: "Conditional Cash Transfer + Social Investment",
        budgetUSD: 15,
      },
      {
        domain: "Defense",
        budgetPct: 1.4,
        score: 6.5,
        trend: "stable",
        keyInitiative: "Counter-terrorism + Boko Haram Campaign",
        budgetUSD: 7,
      },
      {
        domain: "Technology",
        budgetPct: 0.8,
        score: 6.5,
        trend: "up",
        keyInitiative: "Nigeria Digital Economy Policy + Fintech Hub",
        budgetUSD: 4,
      },
      {
        domain: "Climate",
        budgetPct: 0.3,
        score: 4.2,
        trend: "stable",
        keyInitiative: "Energy Transition Plan (ETP)",
        budgetUSD: 1,
      },
    ],
  },
  {
    countryId: "eg",
    countryName: "Egypt",
    continent: "Africa",
    gdp: 432,
    overallPolicyStrength: 6.0,
    policyNotes:
      "Mega-infrastructure state; New Administrative Capital, Suez Canal expansion, and IMF-backed reform program.",
    priorities: [
      {
        domain: "Infrastructure",
        budgetPct: 5.5,
        score: 8.5,
        trend: "up",
        keyInitiative: "New Administrative Capital + Suez Canal Zone",
        budgetUSD: 24,
      },
      {
        domain: "Economy",
        budgetPct: 3.8,
        score: 7.2,
        trend: "up",
        keyInitiative: "IMF Reform Program + Vision 2030 Egypt",
        budgetUSD: 16,
      },
      {
        domain: "Social",
        budgetPct: 8.0,
        score: 7.0,
        trend: "stable",
        keyInitiative: "Takaful & Karama Social Protection",
        budgetUSD: 35,
      },
      {
        domain: "Defense",
        budgetPct: 1.7,
        score: 7.5,
        trend: "stable",
        keyInitiative: "Military Modernization + Regional Security",
        budgetUSD: 7,
      },
      {
        domain: "Education",
        budgetPct: 4.0,
        score: 6.0,
        trend: "up",
        keyInitiative: "Education Reform 2.0 + Tech Schools",
        budgetUSD: 17,
      },
      {
        domain: "Healthcare",
        budgetPct: 5.2,
        score: 6.2,
        trend: "up",
        keyInitiative: "Universal Health Insurance Law",
        budgetUSD: 22,
      },
      {
        domain: "Climate",
        budgetPct: 0.5,
        score: 5.8,
        trend: "up",
        keyInitiative: "National Climate Change Strategy 2050",
        budgetUSD: 2,
      },
      {
        domain: "Technology",
        budgetPct: 0.7,
        score: 6.0,
        trend: "up",
        keyInitiative: "Digital Egypt Transformation Initiative",
        budgetUSD: 3,
      },
    ],
  },
  {
    countryId: "za",
    countryName: "South Africa",
    continent: "Africa",
    gdp: 395,
    overallPolicyStrength: 6.3,
    policyNotes:
      "Post-Eskom energy crisis response; GNU coalition policy; NHI health push and infrastructure investment.",
    priorities: [
      {
        domain: "Healthcare",
        budgetPct: 8.6,
        score: 7.8,
        trend: "up",
        keyInitiative: "National Health Insurance (NHI) Act",
        budgetUSD: 34,
      },
      {
        domain: "Social",
        budgetPct: 11.2,
        score: 7.5,
        trend: "stable",
        keyInitiative: "Social Relief of Distress + Child Support",
        budgetUSD: 44,
      },
      {
        domain: "Infrastructure",
        budgetPct: 1.8,
        score: 7.0,
        trend: "up",
        keyInitiative: "ERRP Energy Plan + Transnet Rail Repair",
        budgetUSD: 7,
      },
      {
        domain: "Education",
        budgetPct: 6.5,
        score: 7.2,
        trend: "stable",
        keyInitiative: "Basic Education Laws Amendment + NSFAS",
        budgetUSD: 26,
      },
      {
        domain: "Economy",
        budgetPct: 1.2,
        score: 6.5,
        trend: "up",
        keyInitiative: "Operation Vulindlela Reform Program",
        budgetUSD: 5,
      },
      {
        domain: "Climate",
        budgetPct: 0.6,
        score: 6.8,
        trend: "up",
        keyInitiative: "Just Energy Transition Partnership (JETP)",
        budgetUSD: 2,
      },
      {
        domain: "Defense",
        budgetPct: 0.8,
        score: 5.5,
        trend: "stable",
        keyInitiative: "SANDF Modernization + AU Peacekeeping",
        budgetUSD: 3,
      },
      {
        domain: "Technology",
        budgetPct: 0.5,
        score: 6.0,
        trend: "up",
        keyInitiative: "SA Digital & Future Skills Initiative",
        budgetUSD: 2,
      },
    ],
  },
  {
    countryId: "ru",
    countryName: "Russia",
    continent: "Europe",
    gdp: 1960,
    overallPolicyStrength: 6.5,
    policyNotes:
      "War-time economy pivot; massive defense spending, import substitution, and sovereign tech development under sanctions.",
    priorities: [
      {
        domain: "Defense",
        budgetPct: 7.5,
        score: 9.8,
        trend: "up",
        keyInitiative: "War in Ukraine Defense Budget ($147B)",
        budgetUSD: 147,
      },
      {
        domain: "Economy",
        budgetPct: 3.5,
        score: 7.5,
        trend: "up",
        keyInitiative: "Import Substitution + Parallel Import Policy",
        budgetUSD: 69,
      },
      {
        domain: "Technology",
        budgetPct: 1.1,
        score: 6.8,
        trend: "up",
        keyInitiative: "Sovereign Internet (Runet) + Gostech",
        budgetUSD: 22,
      },
      {
        domain: "Social",
        budgetPct: 14.0,
        score: 7.2,
        trend: "stable",
        keyInitiative: "National Social Projects + Maternity Capital",
        budgetUSD: 274,
      },
      {
        domain: "Infrastructure",
        budgetPct: 2.1,
        score: 7.0,
        trend: "stable",
        keyInitiative: "Eastern Routes + Arctic LNG Infrastructure",
        budgetUSD: 41,
      },
      {
        domain: "Healthcare",
        budgetPct: 3.6,
        score: 6.0,
        trend: "stable",
        keyInitiative: "National Health Project + MRI Rollout",
        budgetUSD: 71,
      },
      {
        domain: "Education",
        budgetPct: 4.0,
        score: 6.5,
        trend: "stable",
        keyInitiative: "Patriotic Education + Tech University Push",
        budgetUSD: 78,
      },
      {
        domain: "Climate",
        budgetPct: 0.2,
        score: 2.5,
        trend: "down",
        keyInitiative: "Limited Carbon Regulation; fossil fuel expansion",
        budgetUSD: 4,
      },
    ],
  },
];

function CountriesTab() {
  const [search, setSearch] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("All");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const continents = [
    "All",
    "North America",
    "South America",
    "Europe",
    "Asia",
    "Africa",
    "Oceania",
  ];

  const filtered = countryPolicyProfiles.filter((cp) => {
    const q = search.toLowerCase();
    if (q && !cp.countryName.toLowerCase().includes(q)) return false;
    if (selectedContinent !== "All" && cp.continent !== selectedContinent)
      return false;
    return true;
  });

  const domainList = [
    "All",
    "Climate",
    "Healthcare",
    "Education",
    "Infrastructure",
    "Defense",
    "Economy",
    "Social",
    "Technology",
  ] as const;

  const getTopPriority = (profile: CountryPolicyProfile) => {
    const sorted = [...profile.priorities].sort((a, b) => b.score - a.score);
    return sorted[0];
  };

  const getDomainScore = (profile: CountryPolicyProfile, domain: string) => {
    const p = profile.priorities.find((pr) => pr.domain === domain);
    return p ? p.score : 0;
  };

  const displayedProfiles =
    selectedDomain !== "All"
      ? [...filtered].sort(
          (a, b) =>
            getDomainScore(b, selectedDomain) -
            getDomainScore(a, selectedDomain),
        )
      : [...filtered].sort(
          (a, b) => b.overallPolicyStrength - a.overallPolicyStrength,
        );

  return (
    <div className="space-y-5">
      {/* Header summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Countries Tracked",
            value: countryPolicyProfiles.length.toString(),
            sub: "Policy profiles",
          },
          { label: "Policy Domains", value: "8", sub: "Areas of governance" },
          {
            label: "Avg Policy Strength",
            value:
              (
                countryPolicyProfiles.reduce(
                  (s, c) => s + c.overallPolicyStrength,
                  0,
                ) / countryPolicyProfiles.length
              ).toFixed(1) + "/10",
            sub: "Across all countries",
          },
          { label: "Top Spender", value: "USA", sub: "Healthcare $4.5T" },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {c.label}
            </p>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Domain legend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
          Policy Domains
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "Climate",
              "Healthcare",
              "Education",
              "Infrastructure",
              "Defense",
              "Economy",
              "Social",
              "Technology",
            ] as PolicyDomain[]
          ).map((d) => (
            <div
              key={d}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${selectedDomain === d ? "border-transparent scale-[1.03]" : "border-transparent"} ${DOMAIN_COLOR[d]}`}
              onClick={() =>
                setSelectedDomain(selectedDomain === d ? "All" : d)
              }
            >
              {DOMAIN_ICON[d]}
              {d}
            </div>
          ))}
          {selectedDomain !== "All" && (
            <button
              onClick={() => setSelectedDomain("All")}
              className="text-xs text-primary hover:underline px-2"
            >
              Clear filter ×
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries…"
            className="pl-8 pr-4 py-1.5 bg-card border border-border rounded-full text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44"
          />
        </div>
        {continents.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedContinent(c)}
            className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${selectedContinent === c ? "bg-secondary text-secondary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {selectedDomain !== "All" && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 ${DOMAIN_COLOR[selectedDomain as PolicyDomain]}`}
        >
          {DOMAIN_ICON[selectedDomain as PolicyDomain]}
          <span>
            Showing countries ranked by <b>{selectedDomain}</b> policy priority
            score
          </span>
        </div>
      )}

      {/* Country cards */}
      <div className="space-y-3">
        {displayedProfiles.map((profile, idx) => {
          const isExpanded = expandedCountry === profile.countryId;
          const topPriority = getTopPriority(profile);
          const sortedPriorities =
            selectedDomain !== "All"
              ? [...profile.priorities].sort(
                  (a, b) =>
                    (b.domain === selectedDomain ? 1 : 0) -
                    (a.domain === selectedDomain ? 1 : 0),
                )
              : [...profile.priorities].sort((a, b) => b.score - a.score);

          return (
            <div
              key={profile.countryId}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Card header */}
              <button
                className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors"
                onClick={() =>
                  setExpandedCountry(isExpanded ? null : profile.countryId)
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-secondary/60 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-foreground">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {profile.countryName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground">
                          {profile.continent}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          GDP $
                          {profile.gdp >= 1000
                            ? (profile.gdp / 1000).toFixed(1) + "T"
                            : profile.gdp + "B"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          Top priority:
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DOMAIN_COLOR[topPriority.domain]}`}
                        >
                          {DOMAIN_ICON[topPriority.domain]}
                          {topPriority.domain}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate hidden sm:block">
                          {topPriority.keyInitiative}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Mini domain bars */}
                    <div className="hidden sm:flex items-end gap-0.5 h-8">
                      {sortedPriorities.slice(0, 8).map((p) => (
                        <div
                          key={p.domain}
                          className="w-2 rounded-sm"
                          title={`${p.domain}: ${p.score}/10`}
                          style={{
                            height: `${(p.score / 10) * 100}%`,
                            backgroundColor: DOMAIN_COLOR_HEX[p.domain],
                            opacity:
                              selectedDomain !== "All" &&
                              p.domain !== selectedDomain
                                ? 0.25
                                : 0.85,
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">
                        {profile.overallPolicyStrength}/10
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Policy strength
                      </p>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M2 5l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-5 animate-fade-in">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                    {profile.policyNotes}
                  </p>

                  {/* Priority bars */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    {sortedPriorities.map((p) => (
                      <div
                        key={p.domain}
                        className={`rounded-xl p-3 border transition-all ${selectedDomain === p.domain ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DOMAIN_COLOR[p.domain]}`}
                            >
                              {DOMAIN_ICON[p.domain]}
                              {p.domain}
                            </span>
                            <span
                              className={`text-[9px] font-medium ${p.trend === "up" ? "text-success" : p.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}
                            >
                              {p.trend === "up"
                                ? "↑"
                                : p.trend === "down"
                                  ? "↓"
                                  : "→"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {p.budgetPct}% GDP
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {p.score}/10
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(p.score / 10) * 100}%`,
                              backgroundColor: DOMAIN_COLOR_HEX[p.domain],
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug truncate">
                          {p.keyInitiative}
                        </p>
                        <p className="text-[10px] text-foreground font-mono mt-1">
                          $
                          {p.budgetUSD >= 1000
                            ? (p.budgetUSD / 1000).toFixed(1) + "T"
                            : p.budgetUSD + "B"}{" "}
                          allocated
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Domain coverage radar-style summary row */}
                  <div className="bg-secondary/30 rounded-xl p-3 flex flex-wrap gap-3 items-center">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Coverage
                    </span>
                    {sortedPriorities.map((p) => (
                      <div key={p.domain} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: DOMAIN_COLOR_HEX[p.domain],
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {p.domain}
                        </span>
                        <span className="text-[10px] font-bold text-foreground">
                          {p.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
          <Info size={28} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No countries match your filters
          </p>
        </div>
      )}
    </div>
  );
}

const DOMAINS = [
  "All",
  "Climate",
  "Healthcare",
  "Education",
  "Infrastructure",
  "Defense",
  "Economy",
  "Social",
  "Technology",
] as const;
const SCOPES = ["All", "Global", "National", "Regional", "Local"] as const;
const STATUSES = [
  "All",
  "Active",
  "Enacted",
  "Proposed",
  "Pending",
  "Expired",
] as const;

export function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<PolicyTab>("initiatives");
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<string>("All");
  const [scope, setScope] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");

  const filtered = policies.filter((p) => {
    const q = search.toLowerCase();
    if (
      q &&
      !p.name.toLowerCase().includes(q) &&
      !p.country.toLowerCase().includes(q) &&
      !p.tags.some((t) => t.toLowerCase().includes(q))
    )
      return false;
    if (domain !== "All" && p.domain !== domain) return false;
    if (scope !== "All" && p.scope !== scope) return false;
    if (status !== "All" && p.status !== status) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Global &amp; Local Policies
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Budget · Initiatives · Impact · Scale · Adoption
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} of {policies.length} policies
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mt-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies…"
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-sans"
            />
          </div>
          {/* Domain pills */}
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${domain === d ? "bg-secondary text-secondary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                {d === "All" ? "All Domains" : d}
              </button>
            ))}
          </div>
          {/* Scope + Status pills — merged row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pr-1">
              Scope
            </span>
            {SCOPES.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${scope === s ? "bg-secondary text-secondary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                {s === "All" ? "All" : s}
              </button>
            ))}
            <span className="w-px h-4 bg-border/60 mx-1" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pr-1">
              Status
            </span>
            {STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${status === st ? "bg-secondary text-secondary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                {st === "All" ? "All" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-secondary/50 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <Info size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No policies match your filters
            </p>
            <button
              onClick={() => {
                setSearch("");
                setDomain("All");
                setScope("All");
                setStatus("All");
              }}
              className="text-xs text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {activeTab === "budget" && <BudgetTab data={filtered} />}
            {activeTab === "initiatives" && <InitiativesTab data={filtered} />}
            {activeTab === "impact" && <ImpactTab data={filtered} />}
            {activeTab === "adoption" && <AdoptionTab data={filtered} />}
            {activeTab === "countries" && <CountriesTab />}
          </>
        )}
      </div>
    </div>
  );
}
