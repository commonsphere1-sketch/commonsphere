/**
 * Society Status Index Framework
 * ================================
 * Normalized schema for all 14 societal domains.
 * Each domain contains concrete indicators with:
 *   - id            unique snake_case key
 *   - label         display name
 *   - description   one-line explanation
 *   - unit          display suffix/prefix (e.g. "%", "score", "per 100k")
 *   - unitPrefix    true if unit goes BEFORE the number (e.g. "$")
 *   - higherIsBetter true = higher score = better outcome (green)
 *   - source        authoritative index / institution name
 *   - sourceUrl     reference link (informational)
 *   - tier          "primary" (always shown) | "secondary" (expandable)
 * ---------------------------------------------------------------------------
 * Data structures for per-entity metric values are also exported here so
 * the data pipeline (Step 3) and UI (Step 4) share the same contract.
 */

// ─── Indicator definition ────────────────────────────────────────────────────

export type IndicatorTier = "primary" | "secondary";

export interface Indicator {
  id: string;
  label: string;
  description: string;
  unit: string;
  unitPrefix: boolean;
  higherIsBetter: boolean;
  source: string;
  sourceUrl: string;
  tier: IndicatorTier;
}

// ─── Domain definition ────────────────────────────────────────────────────────

export type DomainId =
  | "quality_of_life"
  | "economic"
  | "governance"
  | "corruption"
  | "inequality"
  | "peace_security"
  | "justice_rights"
  | "health"
  | "education"
  | "environment"
  | "infrastructure"
  | "civic"
  | "media"
  | "global_position";

export interface Domain {
  id: DomainId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // phosphor icon name (PascalCase)
  color: string; // tailwind text/bg token base color (e.g. "sky")
  indicators: Indicator[];
}

// ─── Value types for runtime metric data ─────────────────────────────────────

/** Single indicator value for one entity */
export interface IndicatorValue {
  indicatorId: string;
  /** Raw numeric value; null = no data */
  value: number | null;
  /** Year of the data point (e.g. 2025) */
  year: number;
  /** Optional rank within dataset (1 = best in class) */
  rank?: number;
  /** Optional percentile 0–100 within dataset */
  percentile?: number;
  /** Optional note / caveat */
  note?: string;
}

/** All indicator values for one entity, keyed by domainId */
export type EntitySocietyProfile = {
  entityId: string;
  entityType: "country" | "state";
  updatedAt: string; // ISO date string
  domains: Partial<Record<DomainId, IndicatorValue[]>>;
};

// ─── Helper to clamp percentile scoring (0–100) ──────────────────────────────
export function scoreToPercentile(
  value: number,
  min: number,
  max: number,
  higherIsBetter: boolean,
): number {
  if (max === min) return 50;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.round(higherIsBetter ? pct : 100 - pct);
}

// ─── Domain / Indicator taxonomy ─────────────────────────────────────────────

export const DOMAINS: Domain[] = [
  // ── 1. Quality of Life & Human Development ───────────────────────────────
  {
    id: "quality_of_life",
    label: "Quality of Life & Human Development",
    shortLabel: "Quality of Life",
    description:
      "Overall societal well-being, human capabilities, and standard of living.",
    icon: "HeartStraight",
    color: "rose",
    indicators: [
      {
        id: "hdi",
        label: "Human Development Index",
        description:
          "UNDP composite of life expectancy, education, and income.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNDP HDI",
        sourceUrl: "https://hdr.undp.org/data-center/human-development-index",
        tier: "primary",
      },
      {
        id: "life_expectancy",
        label: "Life Expectancy",
        description: "Average years a newborn is expected to live.",
        unit: "yrs",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WHO / World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN",
        tier: "primary",
      },
      {
        id: "happiness_score",
        label: "World Happiness Score",
        description: "Cantril Ladder life-satisfaction score (0–10).",
        unit: "/ 10",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Happiness Report",
        sourceUrl: "https://worldhappiness.report/",
        tier: "primary",
      },
      {
        id: "quality_of_life_index",
        label: "Quality of Life Index",
        description:
          "Numbeo composite index covering purchasing power, safety, healthcare, cost of living, climate, and traffic.",
        unit: "index",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Numbeo",
        sourceUrl:
          "https://www.numbeo.com/quality-of-life/rankings_by_country.jsp",
        tier: "primary",
      },
      {
        id: "poverty_rate",
        label: "Poverty Rate",
        description:
          "Share of population below national or $2.15/day poverty line.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: false,
        source: "World Bank PIP",
        sourceUrl: "https://pip.worldbank.org/",
        tier: "secondary",
      },
      {
        id: "social_mobility_index",
        label: "Global Social Mobility Index",
        description:
          "WEF index (0–100) measuring opportunity for income upward mobility.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WEF Social Mobility Index",
        sourceUrl:
          "https://www.weforum.org/reports/global-social-mobility-index-2020",
        tier: "secondary",
      },
      {
        id: "mean_years_of_schooling",
        label: "Mean Years of Schooling",
        description:
          "Average years of education adults aged 25+ have received.",
        unit: "yrs",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNDP HDR",
        sourceUrl: "https://hdr.undp.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 2. Economic ──────────────────────────────────────────────────────────
  {
    id: "economic",
    label: "Economic",
    shortLabel: "Economy",
    description:
      "Macroeconomic performance, labor markets, trade, and fiscal health.",
    icon: "ChartLineUp",
    color: "emerald",
    indicators: [
      {
        id: "gdp_per_capita",
        label: "GDP per Capita (PPP)",
        description:
          "Gross domestic product per person adjusted for purchasing power parity.",
        unit: "USD",
        unitPrefix: true,
        higherIsBetter: true,
        source: "World Bank / IMF WEO",
        sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.CD",
        tier: "primary",
      },
      {
        id: "gdp_growth",
        label: "GDP Growth Rate",
        description: "Year-on-year real GDP growth.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "IMF WEO",
        sourceUrl: "https://www.imf.org/en/Publications/WEO",
        tier: "primary",
      },
      {
        id: "unemployment_rate",
        label: "Unemployment Rate",
        description:
          "Share of labor force that is unemployed and seeking work.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: false,
        source: "ILO / BLS",
        sourceUrl: "https://ilostat.ilo.org/",
        tier: "primary",
      },
      {
        id: "inflation_rate",
        label: "Inflation (CPI)",
        description: "Annual consumer price index change.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: false,
        source: "IMF / BLS",
        sourceUrl: "https://www.imf.org/",
        tier: "primary",
      },
      {
        id: "trade_balance",
        label: "Trade Balance",
        description: "Exports minus imports (positive = surplus).",
        unit: "B USD",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WTO / World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/BN.CAB.XOKA.CD",
        tier: "secondary",
      },
      {
        id: "economic_freedom",
        label: "Economic Freedom Index",
        description:
          "Heritage Foundation composite (0–100): rule of law, limited government, regulatory efficiency, open markets.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Heritage Foundation",
        sourceUrl: "https://www.heritage.org/index/",
        tier: "secondary",
      },
      {
        id: "ease_of_doing_business",
        label: "Ease of Doing Business",
        description:
          "World Bank ranking of regulatory environment for businesses.",
        unit: "rank",
        unitPrefix: false,
        higherIsBetter: false,
        source: "World Bank Doing Business",
        sourceUrl: "https://www.doingbusiness.org/",
        tier: "secondary",
      },
      {
        id: "global_competitiveness",
        label: "Global Competitiveness Index",
        description:
          "WEF score (0–100) across 12 pillars of national competitiveness.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WEF GCI",
        sourceUrl:
          "https://www.weforum.org/reports/the-global-competitiveness-report-2019/",
        tier: "secondary",
      },
    ],
  },

  // ── 3. Political & Governance ────────────────────────────────────────────
  {
    id: "governance",
    label: "Political & Governance",
    shortLabel: "Governance",
    description:
      "Democratic quality, rule of law, government effectiveness, and political stability.",
    icon: "Buildings",
    color: "violet",
    indicators: [
      {
        id: "democracy_index",
        label: "Democracy Index",
        description:
          "EIU index (0–10) assessing electoral process, civil liberties, functioning government, political participation, culture.",
        unit: "/ 10",
        unitPrefix: false,
        higherIsBetter: true,
        source: "EIU Democracy Index",
        sourceUrl: "https://www.eiu.com/n/campaigns/democracy-index/",
        tier: "primary",
      },
      {
        id: "rule_of_law",
        label: "Rule of Law",
        description:
          "World Bank governance indicator: legal rights, contract enforcement, property rights.",
        unit: "percentile",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank WGI",
        sourceUrl: "https://info.worldbank.org/governance/wgi/",
        tier: "primary",
      },
      {
        id: "government_effectiveness",
        label: "Government Effectiveness",
        description:
          "WB governance percentile: public service quality, policy formulation, credibility.",
        unit: "percentile",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank WGI",
        sourceUrl: "https://info.worldbank.org/governance/wgi/",
        tier: "primary",
      },
      {
        id: "political_stability",
        label: "Political Stability",
        description:
          "WB governance indicator: likelihood of political instability / politically motivated violence.",
        unit: "percentile",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank WGI",
        sourceUrl: "https://info.worldbank.org/governance/wgi/",
        tier: "secondary",
      },
      {
        id: "regulatory_quality",
        label: "Regulatory Quality",
        description:
          "WB governance indicator: ability to formulate sound policies enabling private sector development.",
        unit: "percentile",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank WGI",
        sourceUrl: "https://info.worldbank.org/governance/wgi/",
        tier: "secondary",
      },
      {
        id: "fragile_states_index",
        label: "Fragile States Index",
        description:
          "Fund for Peace score (0–120): higher = more fragile / at risk of state failure.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: false,
        source: "Fund for Peace FSI",
        sourceUrl: "https://fragilestatesindex.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 4. Corruption Perception ─────────────────────────────────────────────
  {
    id: "corruption",
    label: "Corruption Perception",
    shortLabel: "Corruption",
    description:
      "Perceived levels of public sector corruption and transparency.",
    icon: "Eye",
    color: "amber",
    indicators: [
      {
        id: "cpi",
        label: "Corruption Perceptions Index",
        description:
          "Transparency International CPI (0–100): higher = less corrupt.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Transparency International",
        sourceUrl: "https://www.transparency.org/en/cpi",
        tier: "primary",
      },
      {
        id: "control_of_corruption",
        label: "Control of Corruption",
        description:
          "World Bank WGI: extent to which public power is exercised for private gain.",
        unit: "percentile",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank WGI",
        sourceUrl: "https://info.worldbank.org/governance/wgi/",
        tier: "primary",
      },
      {
        id: "bribery_rate",
        label: "Bribery Rate",
        description:
          "Share of firms asked to pay a bribe by public officials (World Bank enterprise surveys).",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: false,
        source: "World Bank Enterprise Surveys",
        sourceUrl: "https://www.enterprisesurveys.org/",
        tier: "secondary",
      },
      {
        id: "open_budget_index",
        label: "Open Budget Index",
        description:
          "IBP score (0–100): availability and comprehensiveness of public budget documents.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "International Budget Partnership",
        sourceUrl: "https://www.internationalbudget.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 5. Social Cohesion & Inequality ──────────────────────────────────────
  {
    id: "inequality",
    label: "Social Cohesion & Inequality",
    shortLabel: "Inequality",
    description:
      "Income distribution, social trust, and cohesion within society.",
    icon: "UsersThree",
    color: "orange",
    indicators: [
      {
        id: "gini",
        label: "Gini Coefficient",
        description:
          "Income inequality measure (0 = perfect equality, 100 = perfect inequality).",
        unit: "index",
        unitPrefix: false,
        higherIsBetter: false,
        source: "World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/SI.POV.GINI",
        tier: "primary",
      },
      {
        id: "social_trust",
        label: "Social Trust",
        description:
          "Share of people who say most people can be trusted (World Values Survey).",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Values Survey",
        sourceUrl: "https://www.worldvaluessurvey.org/",
        tier: "primary",
      },
      {
        id: "gender_inequality_index",
        label: "Gender Inequality Index",
        description:
          "UNDP GII (0–1): loss in human development due to gender inequality (lower = better).",
        unit: "index",
        unitPrefix: false,
        higherIsBetter: false,
        source: "UNDP GII",
        sourceUrl:
          "https://hdr.undp.org/data-center/thematic-composite-indices/gender-inequality-index",
        tier: "primary",
      },
      {
        id: "social_cohesion_index",
        label: "Social Cohesion & Reconciliation Index",
        description:
          "SCORE composite measuring intergroup relations, perceptions of security, and state legitimacy.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "SCORE Index (UNDP/EU)",
        sourceUrl: "https://scoreforpeace.org/",
        tier: "secondary",
      },
      {
        id: "palma_ratio",
        label: "Palma Ratio",
        description: "Ratio of income share of top 10% to bottom 40%.",
        unit: "ratio",
        unitPrefix: false,
        higherIsBetter: false,
        source: "World Bank / UNDP",
        sourceUrl: "https://hdr.undp.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 6. Peace, Conflict & Security ────────────────────────────────────────
  {
    id: "peace_security",
    label: "Peace, Conflict & Security",
    shortLabel: "Peace & Security",
    description: "Levels of peace, conflict, terrorism, and personal safety.",
    icon: "Shield",
    color: "teal",
    indicators: [
      {
        id: "global_peace_index",
        label: "Global Peace Index",
        description:
          "IEP score (1–5): lower = more peaceful. Covers ongoing conflicts, militarization, and safety.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: false,
        source: "IEP Global Peace Index",
        sourceUrl:
          "https://www.economicsandpeace.org/research/iep-indices-data/global-peace-index/",
        tier: "primary",
      },
      {
        id: "homicide_rate",
        label: "Homicide Rate",
        description: "Intentional homicides per 100,000 population.",
        unit: "per 100k",
        unitPrefix: false,
        higherIsBetter: false,
        source: "UNODC",
        sourceUrl:
          "https://www.unodc.org/unodc/en/data-and-analysis/homicide.html",
        tier: "primary",
      },
      {
        id: "terrorism_index",
        label: "Global Terrorism Index",
        description: "IEP score (0–10): higher = greater impact of terrorism.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: false,
        source: "IEP GTI",
        sourceUrl:
          "https://www.economicsandpeace.org/research/iep-indices-data/global-terrorism-index/",
        tier: "primary",
      },
      {
        id: "conflict_deaths",
        label: "Battle-related Deaths",
        description:
          "Deaths directly caused by war and armed conflict per year.",
        unit: "deaths/yr",
        unitPrefix: false,
        higherIsBetter: false,
        source: "UCDP / Armed Conflict Dataset",
        sourceUrl: "https://ucdp.uu.se/",
        tier: "secondary",
      },
      {
        id: "crime_index",
        label: "Crime Index",
        description:
          "Numbeo crime index (0–100); higher = more crime perceived.",
        unit: "index",
        unitPrefix: false,
        higherIsBetter: false,
        source: "Numbeo",
        sourceUrl: "https://www.numbeo.com/crime/rankings_by_country.jsp",
        tier: "secondary",
      },
    ],
  },

  // ── 7. Justice & Rights ──────────────────────────────────────────────────
  {
    id: "justice_rights",
    label: "Justice & Rights",
    shortLabel: "Justice & Rights",
    description:
      "Civil liberties, human rights, access to justice, and equality before law.",
    icon: "Scales",
    color: "indigo",
    indicators: [
      {
        id: "wjp_rule_of_law",
        label: "WJP Rule of Law Index",
        description:
          "World Justice Project composite (0–1): constraints on government, fundamental rights, open government, order and security, regulatory enforcement, civil justice, criminal justice.",
        unit: "/ 1",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Justice Project",
        sourceUrl: "https://worldjusticeproject.org/rule-of-law-index/",
        tier: "primary",
      },
      {
        id: "freedom_index",
        label: "Freedom in the World Score",
        description:
          "Freedom House aggregate (0–100): political rights and civil liberties.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Freedom House",
        sourceUrl: "https://freedomhouse.org/report/freedom-world",
        tier: "primary",
      },
      {
        id: "press_freedom",
        label: "Press Freedom Index",
        description: "RSF index (0–100): higher = more press freedom.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Reporters Without Borders (RSF)",
        sourceUrl: "https://rsf.org/en/index",
        tier: "primary",
      },
      {
        id: "incarceration_rate",
        label: "Incarceration Rate",
        description: "Prison population per 100,000 population.",
        unit: "per 100k",
        unitPrefix: false,
        higherIsBetter: false,
        source: "World Prison Brief / BJS",
        sourceUrl: "https://www.prisonstudies.org/",
        tier: "secondary",
      },
      {
        id: "civil_liberties",
        label: "Civil Liberties Score",
        description:
          "Freedom House civil liberties sub-score (1–7; lower = freer).",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: false,
        source: "Freedom House",
        sourceUrl: "https://freedomhouse.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 8. Health ────────────────────────────────────────────────────────────
  {
    id: "health",
    label: "Health",
    shortLabel: "Health",
    description:
      "Population health outcomes, healthcare access, and system performance.",
    icon: "FirstAid",
    color: "green",
    indicators: [
      {
        id: "life_expectancy_health",
        label: "Life Expectancy at Birth",
        description:
          "Average years a newborn is expected to live under current mortality rates.",
        unit: "yrs",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WHO",
        sourceUrl:
          "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-(years)",
        tier: "primary",
      },
      {
        id: "healthcare_access",
        label: "Healthcare Access & Quality Index",
        description:
          "GBD HAQ index (0–100): amenable mortality from 32 conditions.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "IHME GBD / Lancet",
        sourceUrl:
          "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30994-2/fulltext",
        tier: "primary",
      },
      {
        id: "maternal_mortality",
        label: "Maternal Mortality Ratio",
        description: "Maternal deaths per 100,000 live births.",
        unit: "per 100k births",
        unitPrefix: false,
        higherIsBetter: false,
        source: "WHO / World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/SH.STA.MMRT",
        tier: "primary",
      },
      {
        id: "infant_mortality",
        label: "Infant Mortality Rate",
        description:
          "Deaths of infants under one year old per 1,000 live births.",
        unit: "per 1k births",
        unitPrefix: false,
        higherIsBetter: false,
        source: "UNICEF / WHO",
        sourceUrl:
          "https://data.unicef.org/topic/child-survival/under-five-mortality/",
        tier: "secondary",
      },
      {
        id: "health_expenditure",
        label: "Health Expenditure (% GDP)",
        description: "Total health expenditure as share of GDP.",
        unit: "% GDP",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WHO Global Health Expenditure DB",
        sourceUrl: "https://apps.who.int/nha/database",
        tier: "secondary",
      },
      {
        id: "vaccination_rate",
        label: "Vaccination Coverage (DTP3)",
        description:
          "Share of children receiving 3rd dose of diphtheria-tetanus-pertussis vaccine.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WHO / UNICEF",
        sourceUrl: "https://immunizationdata.who.int/",
        tier: "secondary",
      },
    ],
  },

  // ── 9. Education & Knowledge ─────────────────────────────────────────────
  {
    id: "education",
    label: "Education & Knowledge",
    shortLabel: "Education",
    description:
      "Educational attainment, quality, access, and research capacity.",
    icon: "GraduationCap",
    color: "blue",
    indicators: [
      {
        id: "education_index",
        label: "Education Index (UNDP)",
        description:
          "UNDP composite of mean and expected years of schooling (0–1).",
        unit: "/ 1",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNDP HDR",
        sourceUrl: "https://hdr.undp.org/data-center/human-development-index",
        tier: "primary",
      },
      {
        id: "pisa_score",
        label: "PISA Average Score",
        description:
          "OECD Programme for International Student Assessment average across reading, maths, and science.",
        unit: "points",
        unitPrefix: false,
        higherIsBetter: true,
        source: "OECD PISA",
        sourceUrl: "https://www.oecd.org/en/topics/pisa.html",
        tier: "primary",
      },
      {
        id: "literacy_rate",
        label: "Adult Literacy Rate",
        description: "Share of adults (15+) who can read and write.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNESCO / World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/SE.ADT.LITR.ZS",
        tier: "primary",
      },
      {
        id: "tertiary_enrollment",
        label: "Tertiary Enrollment Ratio",
        description: "Gross enrollment ratio in higher education.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNESCO UIS",
        sourceUrl: "https://uis.unesco.org/",
        tier: "secondary",
      },
      {
        id: "research_development",
        label: "R&D Expenditure (% GDP)",
        description: "Spending on research and development as a share of GDP.",
        unit: "% GDP",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNESCO / World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS",
        tier: "secondary",
      },
      {
        id: "innovation_index",
        label: "Global Innovation Index",
        description:
          "WIPO-Cornell-INSEAD index (0–100) of innovation inputs and outputs.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WIPO GII",
        sourceUrl: "https://www.globalinnovationindex.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 10. Environment & Sustainability ─────────────────────────────────────
  {
    id: "environment",
    label: "Environment & Sustainability",
    shortLabel: "Environment",
    description:
      "Environmental performance, climate vulnerability, and ecological sustainability.",
    icon: "Leaf",
    color: "lime",
    indicators: [
      {
        id: "epi",
        label: "Environmental Performance Index",
        description:
          "Yale/Columbia EPI (0–100): ecosystem vitality and environmental health.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Yale EPI",
        sourceUrl: "https://epi.yale.edu/",
        tier: "primary",
      },
      {
        id: "co2_per_capita",
        label: "CO₂ Emissions per Capita",
        description: "Annual CO₂ emissions in tonnes per person.",
        unit: "t/capita",
        unitPrefix: false,
        higherIsBetter: false,
        source: "Our World in Data / IEA",
        sourceUrl: "https://ourworldindata.org/co2-emissions",
        tier: "primary",
      },
      {
        id: "climate_vulnerability",
        label: "ND-GAIN Climate Vulnerability",
        description:
          "Notre Dame GAIN index (0–100): readiness + vulnerability to climate change (higher = better adapted).",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Notre Dame GAIN",
        sourceUrl: "https://gain.nd.edu/our-work/country-index/",
        tier: "primary",
      },
      {
        id: "renewable_energy_share",
        label: "Renewable Energy Share",
        description: "Share of total energy from renewable sources.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "IEA / IRENA",
        sourceUrl: "https://www.iea.org/",
        tier: "secondary",
      },
      {
        id: "access_clean_water",
        label: "Access to Clean Water",
        description:
          "Share of population with access to safely managed drinking water.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WHO / UNICEF JMP",
        sourceUrl: "https://washdata.org/",
        tier: "secondary",
      },
      {
        id: "forest_cover",
        label: "Forest Cover",
        description: "Percentage of land area covered by forests.",
        unit: "% land",
        unitPrefix: false,
        higherIsBetter: true,
        source: "FAO Global Forest Resources Assessment",
        sourceUrl: "https://www.fao.org/forest-resources-assessment/",
        tier: "secondary",
      },
    ],
  },

  // ── 11. Infrastructure & Technological Capacity ──────────────────────────
  {
    id: "infrastructure",
    label: "Infrastructure & Tech Capacity",
    shortLabel: "Infrastructure",
    description:
      "Physical infrastructure quality and digital/technological readiness.",
    icon: "WifiHigh",
    color: "cyan",
    indicators: [
      {
        id: "infrastructure_quality",
        label: "Infrastructure Quality",
        description: "WEF GCI infrastructure pillar score (0–100).",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "WEF Global Competitiveness Report",
        sourceUrl:
          "https://www.weforum.org/reports/the-global-competitiveness-report-2019/",
        tier: "primary",
      },
      {
        id: "internet_penetration",
        label: "Internet Penetration",
        description: "Share of population using the internet.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "ITU / World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/IT.NET.USER.ZS",
        tier: "primary",
      },
      {
        id: "network_readiness_index",
        label: "Network Readiness Index",
        description:
          "Portulans Institute NRI (0–100): technology, people, governance, impact.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Portulans NRI",
        sourceUrl: "https://networkreadinessindex.org/",
        tier: "primary",
      },
      {
        id: "mobile_subscriptions",
        label: "Mobile Subscriptions",
        description: "Mobile cellular subscriptions per 100 inhabitants.",
        unit: "per 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "ITU",
        sourceUrl: "https://www.itu.int/en/ITU-D/Statistics/",
        tier: "secondary",
      },
      {
        id: "electricity_access",
        label: "Electricity Access",
        description: "Share of population with access to electricity.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS",
        tier: "secondary",
      },
    ],
  },

  // ── 12. Civic Participation ──────────────────────────────────────────────
  {
    id: "civic",
    label: "Civic Participation",
    shortLabel: "Civic",
    description:
      "Electoral participation, civil society strength, and public engagement.",
    icon: "Handshake",
    color: "purple",
    indicators: [
      {
        id: "voter_turnout",
        label: "Voter Turnout",
        description:
          "Percentage of registered voters who cast ballots in most recent national election.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "IDEA Voter Turnout Database",
        sourceUrl: "https://www.idea.int/data-tools/data/voter-turnout",
        tier: "primary",
      },
      {
        id: "civil_society_index",
        label: "Civil Society Participation",
        description: "V-Dem civil society participation index (0–1).",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "V-Dem Institute",
        sourceUrl: "https://www.v-dem.net/",
        tier: "primary",
      },
      {
        id: "voice_accountability",
        label: "Voice & Accountability",
        description:
          "World Bank WGI: extent citizens can participate in government selection, freedom of expression and association.",
        unit: "percentile",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank WGI",
        sourceUrl: "https://info.worldbank.org/governance/wgi/",
        tier: "primary",
      },
      {
        id: "women_in_parliament",
        label: "Women in Parliament",
        description: "Percentage of parliamentary seats held by women.",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "IPU Parline",
        sourceUrl: "https://data.ipu.org/",
        tier: "secondary",
      },
      {
        id: "ngo_density",
        label: "CSO Enabling Environment",
        description:
          "CIVICUS monitor rating of operating environment for civil society (0–100).",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "CIVICUS Monitor",
        sourceUrl: "https://monitor.civicus.org/",
        tier: "secondary",
      },
    ],
  },

  // ── 13. Information & Media ──────────────────────────────────────────────
  {
    id: "media",
    label: "Information & Media",
    shortLabel: "Media",
    description:
      "Press freedom, media pluralism, disinformation resilience, and internet freedom.",
    icon: "Newspaper",
    color: "yellow",
    indicators: [
      {
        id: "press_freedom_index",
        label: "Press Freedom Index",
        description:
          "RSF Reporters Without Borders (0–100): higher = freer press.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "RSF World Press Freedom Index",
        sourceUrl: "https://rsf.org/en/index",
        tier: "primary",
      },
      {
        id: "internet_freedom",
        label: "Freedom on the Net",
        description:
          "Freedom House internet freedom score (0–100): obstacles to access, content limitations, violations of user rights.",
        unit: "/ 100",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Freedom House FOTN",
        sourceUrl: "https://freedomhouse.org/report/freedom-net",
        tier: "primary",
      },
      {
        id: "media_pluralism",
        label: "Media Pluralism Monitor",
        description:
          "EU/CMPF risk indicator (0–100): lower = lower risk to media pluralism.",
        unit: "risk %",
        unitPrefix: false,
        higherIsBetter: false,
        source: "Centre for Media Pluralism (EUI)",
        sourceUrl: "https://cmpf.eui.eu/media-pluralism-monitor/",
        tier: "secondary",
      },
      {
        id: "disinformation_resilience",
        label: "Digital Society Project — Disinformation",
        description:
          "V-Dem disinformation index (0–1): government disinformation campaigns; higher = more disinformation.",
        unit: "index",
        unitPrefix: false,
        higherIsBetter: false,
        source: "V-Dem Digital Society Project",
        sourceUrl: "https://www.v-dem.net/",
        tier: "secondary",
      },
    ],
  },

  // ── 14. International / Global Position ──────────────────────────────────
  {
    id: "global_position",
    label: "International & Global Position",
    shortLabel: "Global Position",
    description:
      "Trade openness, diplomatic engagement, multilateral participation, and soft power.",
    icon: "Globe",
    color: "sky",
    indicators: [
      {
        id: "soft_power_index",
        label: "Global Soft Power Index",
        description:
          "Brand Finance soft power composite: familiarity, reputation, influence across 7 pillars.",
        unit: "score",
        unitPrefix: false,
        higherIsBetter: true,
        source: "Brand Finance",
        sourceUrl: "https://brandirectory.com/softpower/",
        tier: "primary",
      },
      {
        id: "trade_openness",
        label: "Trade Openness",
        description: "Sum of exports + imports as % of GDP.",
        unit: "% GDP",
        unitPrefix: false,
        higherIsBetter: true,
        source: "World Bank",
        sourceUrl: "https://data.worldbank.org/indicator/NE.TRD.GNFS.ZS",
        tier: "primary",
      },
      {
        id: "un_voting_alignment",
        label: "UN Voting Alignment",
        description:
          "Share of UN General Assembly votes aligned with international consensus resolutions (per Voeten dataset).",
        unit: "%",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UN Vote Alignment / Voeten",
        sourceUrl:
          "https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LEJUQZ",
        tier: "secondary",
      },
      {
        id: "fdi_inflows",
        label: "FDI Inflows (% GDP)",
        description: "Foreign direct investment net inflows as share of GDP.",
        unit: "% GDP",
        unitPrefix: false,
        higherIsBetter: true,
        source: "UNCTAD / World Bank",
        sourceUrl: "https://unctadstat.unctad.org/",
        tier: "secondary",
      },
      {
        id: "global_firepower_rank",
        label: "Military Power Rank",
        description:
          "Global Firepower index rank (1 = most powerful). Lower = stronger military.",
        unit: "rank",
        unitPrefix: false,
        higherIsBetter: false,
        source: "Global Firepower Index",
        sourceUrl: "https://www.globalfirepower.com/",
        tier: "secondary",
      },
      {
        id: "aid_as_pct_gni",
        label: "ODA (% GNI)",
        description:
          "Official development assistance given as percentage of gross national income.",
        unit: "% GNI",
        unitPrefix: false,
        higherIsBetter: true,
        source: "OECD DAC",
        sourceUrl: "https://stats.oecd.org/",
        tier: "secondary",
      },
    ],
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Map from domainId → Domain */
export const DOMAIN_MAP: Record<DomainId, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<DomainId, Domain>;

/** Flat map of all indicators by id */
export const INDICATOR_MAP: Record<string, Indicator & { domainId: DomainId }> =
  Object.fromEntries(
    DOMAINS.flatMap((d) =>
      d.indicators.map((ind) => [ind.id, { ...ind, domainId: d.id }]),
    ),
  );

/** All primary-tier indicators across all domains */
export const PRIMARY_INDICATORS = DOMAINS.flatMap((d) =>
  d.indicators
    .filter((i) => i.tier === "primary")
    .map((i) => ({ ...i, domainId: d.id })),
);

/** Count of primary indicators per domain */
export const DOMAIN_PRIMARY_COUNTS: Record<DomainId, number> =
  Object.fromEntries(
    DOMAINS.map((d) => [
      d.id,
      d.indicators.filter((i) => i.tier === "primary").length,
    ]),
  ) as Record<DomainId, number>;

// ─── Entity-type metadata ─────────────────────────────────────────────────────

/**
 * Which domains are directly supported for US states
 * (some international indexes have no state-level equivalent).
 */
export const STATE_SUPPORTED_DOMAINS: DomainId[] = [
  "quality_of_life",
  "economic",
  "governance",
  "inequality",
  "peace_security",
  "justice_rights",
  "health",
  "education",
  "environment",
  "infrastructure",
  "civic",
  "media",
];

/** All 14 domains are available for countries. */
export const COUNTRY_SUPPORTED_DOMAINS: DomainId[] = DOMAINS.map((d) => d.id);
