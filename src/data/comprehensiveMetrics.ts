// ── Comprehensive 13-Category Metrics for Countries and US States ──────────
// All values are approximate 2024-2026 estimates from public indices.
// Sources: UNDP, World Bank, IMF, EIU, Freedom House, Transparency International,
//          IEP, EPI, ITU, RSF, KOF, GII, SIPRI, WHO, OECD, UN HDR

export interface CategoryMetric {
  label: string;
  value: string | number;
  unit?: string;
  /** 0–100 normalized score for progress bar (higher = better unless invertScale) */
  score?: number;
  /** If true, lower raw value = better (e.g. infant mortality) */
  invertScale?: boolean;
  note?: string;
}

export interface MetricsProfile {
  // 1. Human Development & Quality of Life
  hdi?: CategoryMetric;
  ihdi?: CategoryMetric;
  gii?: CategoryMetric;
  gdi?: CategoryMetric;
  mpi?: CategoryMetric;
  spi?: CategoryMetric;
  pqli?: CategoryMetric;
  betterLife?: CategoryMetric;
  happinessScore?: CategoryMetric;

  // 2. Economic
  gdpPerCapitaPPP?: CategoryMetric;
  giniCoeff?: CategoryMetric;
  palmaRatio?: CategoryMetric;
  povertyRate?: CategoryMetric;
  unemploymentRate?: CategoryMetric;
  laborForceParticipation?: CategoryMetric;
  inflationRate?: CategoryMetric;
  humanCapitalIndex?: CategoryMetric;
  economicComplexityIndex?: CategoryMetric;
  inclusiveDevelopmentIndex?: CategoryMetric;
  economicFreedomIndex?: CategoryMetric;

  // 3. Political & Governance
  democracyIndex?: CategoryMetric;
  freedomInWorld?: CategoryMetric;
  wgi?: CategoryMetric;
  corruptionPerceptionsIndex?: CategoryMetric;
  ruleOfLawIndex?: CategoryMetric;
  governmentEffectiveness?: CategoryMetric;
  politicalStabilityIndex?: CategoryMetric;
  voiceAccountability?: CategoryMetric;
  regulatoryQuality?: CategoryMetric;
  civilLibertiesIndex?: CategoryMetric;

  // 4. Social Cohesion & Inequality
  socialCohesionIndex?: CategoryMetric;
  socialCapitalIndex?: CategoryMetric;
  interpersonalTrust?: CategoryMetric;
  incomeInequalityIndex?: CategoryMetric;
  wealthInequalityIndex?: CategoryMetric;
  socialExclusionIndex?: CategoryMetric;
  discriminationIndex?: CategoryMetric;
  mobilityIndex?: CategoryMetric;
  intergenerationalMobility?: CategoryMetric;

  // 5. Peace, Conflict & Security
  globalPeaceIndex?: CategoryMetric;
  fragileStatesIndex?: CategoryMetric;
  globalTerrorismIndex?: CategoryMetric;
  positivePeaceIndex?: CategoryMetric;
  conflictIntensity?: CategoryMetric;
  crimeRate?: CategoryMetric;
  homicideRate?: CategoryMetric;
  politicalViolence?: CategoryMetric;
  militaryExpenditurePct?: CategoryMetric;

  // 6. Justice & Rights
  ruleOfLawScore?: CategoryMetric;
  humanRightsIndex?: CategoryMetric;
  civilLibertiesScore?: CategoryMetric;
  politicalRightsScore?: CategoryMetric;
  accessToJustice?: CategoryMetric;
  judicialIndependence?: CategoryMetric;
  prisonPopulationRate?: CategoryMetric;
  pretrialDetentionRate?: CategoryMetric;
  legalEqualityIndex?: CategoryMetric;

  // 7. Health
  lifeExpectancy?: CategoryMetric;
  hale?: CategoryMetric;
  infantMortality?: CategoryMetric;
  maternalMortality?: CategoryMetric;
  morbidityCoverage?: CategoryMetric;
  healthcareAccessIndex?: CategoryMetric;
  uhcIndex?: CategoryMetric;
  nutritionIndex?: CategoryMetric;
  mentalHealthIndex?: CategoryMetric;

  // 8. Education & Knowledge
  educationIndex?: CategoryMetric;
  humanCapitalScore?: CategoryMetric;
  learningAdjustedSchooling?: CategoryMetric;
  literacyRate?: CategoryMetric;
  schoolEnrollment?: CategoryMetric;
  pisaScore?: CategoryMetric;
  rdIntensity?: CategoryMetric;
  knowledgeEconomyIndex?: CategoryMetric;
  digitalLiteracy?: CategoryMetric;

  // 9. Environment & Sustainability
  epi?: CategoryMetric;
  ecologicalFootprint?: CategoryMetric;
  ecologicalOvershoot?: CategoryMetric;
  climateChangePerformance?: CategoryMetric;
  sustainableDevelopmentIndex?: CategoryMetric;
  greenGrowthIndex?: CategoryMetric;
  airQualityIndex?: CategoryMetric;
  waterStressIndex?: CategoryMetric;
  biodiversityIndex?: CategoryMetric;

  // 10. Infrastructure & Technology
  digitalDevelopmentIndex?: CategoryMetric;
  networkReadinessIndex?: CategoryMetric;
  ictDevelopmentIndex?: CategoryMetric;
  internetPenetration?: CategoryMetric;
  digitalGovernmentIndex?: CategoryMetric;
  infrastructureQuality?: CategoryMetric;
  energySecurityIndex?: CategoryMetric;
  logisticsPerformanceIndex?: CategoryMetric;

  // 11. Civic Participation
  civicParticipationIndex?: CategoryMetric;
  politicalParticipation?: CategoryMetric;
  civilSocietyStrength?: CategoryMetric;

  // 12. Information & Media
  pressFreedomIndex?: CategoryMetric;
  mediaPluralism?: CategoryMetric;
  internetFreedom?: CategoryMetric;
  disinformationIndex?: CategoryMetric;
  informationIntegrity?: CategoryMetric;
  mediaLiteracy?: CategoryMetric;
  governmentTransparency?: CategoryMetric;
  openDataIndex?: CategoryMetric;

  // 13. International / Global Position
  globalizationIndex?: CategoryMetric;
  globalInnovationIndex?: CategoryMetric;
  econComplexityRank?: CategoryMetric;
  globalConnectivity?: CategoryMetric;
  fdiInflows?: CategoryMetric;
  tradeOpenness?: CategoryMetric;
}

export const COUNTRY_METRICS: Record<string, MetricsProfile> = {
  us: {
    hdi: { label: "HDI", value: 0.927, score: 92.7 },
    ihdi: { label: "IHDI", value: 0.808, score: 80.8 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.179,
      score: 82,
      invertScale: true,
    },
    gdi: { label: "Gender Development Index", value: 0.993, score: 99.3 },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.007,
      score: 99,
      invertScale: true,
    },
    spi: { label: "Social Progress Index", value: 84.5, score: 84.5 },
    pqli: { label: "Physical Quality of Life Index", value: 97, score: 97 },
    betterLife: {
      label: "Better Life Index",
      value: 7.2,
      unit: "/10",
      score: 72,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.72,
      unit: "/10",
      score: 67.2,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$80,035",
      score: 92,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 39.8,
      score: 40,
      invertScale: true,
    },
    palmaRatio: {
      label: "Palma Ratio",
      value: 2.0,
      score: 35,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.5%",
      score: 65,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "3.9%",
      score: 82,
      invertScale: true,
    },
    laborForceParticipation: {
      label: "Labor Force Participation",
      value: "62.8%",
      score: 62.8,
    },
    inflationRate: {
      label: "Inflation Rate",
      value: "3.1%",
      score: 72,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.7,
      score: 70,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 1.55,
      score: 77,
    },
    inclusiveDevelopmentIndex: {
      label: "Inclusive Dev. Index",
      value: 5.4,
      unit: "/7",
      score: 77,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 70.1,
      score: 70.1,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.85,
      unit: "/10",
      score: 78.5,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 83,
      unit: "/100",
      score: 83,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 69,
      score: 69,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.69,
      score: 69,
    },
    governmentEffectiveness: {
      label: "Govt. Effectiveness (WGI)",
      value: 1.54,
      score: 85,
    },
    politicalStabilityIndex: {
      label: "Political Stability Index (WGI)",
      value: 0.09,
      score: 55,
    },
    voiceAccountability: {
      label: "Voice & Accountability",
      value: 1.27,
      score: 84,
    },
    regulatoryQuality: { label: "Regulatory Quality", value: 1.49, score: 87 },
    civilLibertiesIndex: {
      label: "Civil Liberties (FH)",
      value: 52,
      unit: "/60",
      score: 87,
    },

    socialCohesionIndex: {
      label: "Social Cohesion Index",
      value: 55,
      score: 55,
    },
    interpersonalTrust: {
      label: "Interpersonal Trust",
      value: "38%",
      score: 38,
    },
    incomeInequalityIndex: {
      label: "Income Inequality (Gini)",
      value: 39.8,
      score: 40,
      invertScale: true,
    },
    wealthInequalityIndex: {
      label: "Wealth Inequality",
      value: 85.0,
      unit: "top 1% share %",
      score: 20,
      invertScale: true,
    },
    mobilityIndex: {
      label: "Social Mobility Index (WEF)",
      value: 70.4,
      score: 70.4,
    },
    intergenerationalMobility: {
      label: "Intergenerational Mobility",
      value: 0.45,
      score: 42,
      invertScale: true,
    },

    globalPeaceIndex: {
      label: "Global Peace Index",
      value: 1.64,
      unit: "(lower=better)",
      score: 64,
      invertScale: true,
    },
    fragileStatesIndex: {
      label: "Fragile States Index",
      value: 44.2,
      score: 66,
      invertScale: true,
    },
    globalTerrorismIndex: {
      label: "Global Terrorism Index",
      value: 4.99,
      score: 50,
      invertScale: true,
    },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 6.3,
      score: 37,
      invertScale: true,
    },
    militaryExpenditurePct: {
      label: "Military Expenditure (% GDP)",
      value: "3.5%",
      score: 50,
    },

    humanRightsIndex: {
      label: "Human Rights Score",
      value: 7.1,
      unit: "/10",
      score: 71,
    },
    accessToJustice: { label: "Access to Justice", value: 0.65, score: 65 },
    judicialIndependence: {
      label: "Judicial Independence",
      value: 0.73,
      score: 73,
    },
    prisonPopulationRate: {
      label: "Prison Population (per 100k)",
      value: 531,
      score: 12,
      invertScale: true,
    },
    pretrialDetentionRate: {
      label: "Pretrial Detention Rate",
      value: "22%",
      score: 60,
      invertScale: true,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "78.7 yrs", score: 79 },
    hale: {
      label: "Healthy Life Expectancy (HALE)",
      value: "67.7 yrs",
      score: 75,
    },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 5.4,
      score: 76,
      invertScale: true,
    },
    maternalMortality: {
      label: "Maternal Mortality (per 100k)",
      value: 23.8,
      score: 62,
      invertScale: true,
    },
    healthcareAccessIndex: {
      label: "Healthcare Access & Quality",
      value: 88.7,
      score: 88.7,
    },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 83,
      score: 83,
    },
    mentalHealthIndex: {
      label: "Mental Health Services",
      value: 65,
      score: 65,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.9, score: 90 },
    learningAdjustedSchooling: {
      label: "Learning-Adj. Schooling Yrs",
      value: 13.4,
      score: 90,
    },
    literacyRate: { label: "Literacy Rate", value: "99%", score: 99 },
    schoolEnrollment: { label: "Tertiary Enrollment", value: "88%", score: 88 },
    pisaScore: { label: "PISA Score (avg)", value: 505, score: 68 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "3.4%", score: 86 },
    digitalLiteracy: { label: "Digital Literacy", value: 78, score: 78 },

    epi: { label: "Environmental Performance Index", value: 51.1, score: 51.1 },
    ecologicalFootprint: {
      label: "Ecological Footprint (gha/cap)",
      value: 8.1,
      score: 20,
      invertScale: true,
    },
    climateChangePerformance: {
      label: "Climate Change Performance",
      value: 26.7,
      score: 26.7,
    },
    airQualityIndex: { label: "Air Quality Index (EPI)", value: 57, score: 57 },
    waterStressIndex: {
      label: "Water Stress Index",
      value: 35,
      score: 55,
      invertScale: true,
    },

    internetPenetration: {
      label: "Internet Penetration",
      value: "92%",
      score: 92,
    },
    networkReadinessIndex: {
      label: "Network Readiness Index",
      value: 79.6,
      score: 79.6,
    },
    ictDevelopmentIndex: {
      label: "ICT Development Index",
      value: 8.0,
      unit: "/10",
      score: 80,
    },
    infrastructureQuality: {
      label: "Infrastructure Quality (WEF)",
      value: 81,
      score: 81,
    },
    logisticsPerformanceIndex: {
      label: "Logistics Performance Index",
      value: 3.99,
      unit: "/5",
      score: 80,
    },

    civicParticipationIndex: {
      label: "Civic Participation",
      value: 62,
      score: 62,
    },
    politicalParticipation: {
      label: "Political Participation",
      value: 64,
      score: 64,
    },
    civilSocietyStrength: {
      label: "Civil Society Strength",
      value: 71,
      score: 71,
    },

    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 66,
      score: 66,
    },
    internetFreedom: {
      label: "Internet Freedom (Freedom House)",
      value: 76,
      score: 76,
    },
    governmentTransparency: {
      label: "Government Transparency",
      value: 69,
      score: 69,
    },

    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 89.2,
      score: 89.2,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 63.2,
      score: 63.2,
    },
    tradeOpenness: { label: "Trade Openness (% GDP)", value: "27%", score: 54 },
  },

  cn: {
    hdi: { label: "HDI", value: 0.788, score: 78.8 },
    ihdi: { label: "IHDI", value: 0.636, score: 63.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.192,
      score: 80,
      invertScale: true,
    },
    gdi: { label: "Gender Development Index", value: 0.975, score: 97.5 },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.022,
      score: 89,
      invertScale: true,
    },
    spi: { label: "Social Progress Index", value: 69.9, score: 69.9 },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.82,
      unit: "/10",
      score: 58.2,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$22,133",
      score: 55,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 38.2,
      score: 44,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "0.1%",
      score: 99,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "5.1%",
      score: 71,
      invertScale: true,
    },
    laborForceParticipation: {
      label: "Labor Force Participation",
      value: "68.4%",
      score: 68.4,
    },
    inflationRate: {
      label: "Inflation Rate",
      value: "0.4%",
      score: 90,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.65,
      score: 65,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 1.12,
      score: 68,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 48.3,
      score: 48.3,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 2.12,
      unit: "/10",
      score: 21.2,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 9,
      unit: "/100",
      score: 9,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 42,
      score: 42,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.48,
      score: 48,
    },
    governmentEffectiveness: {
      label: "Govt. Effectiveness (WGI)",
      value: 0.41,
      score: 62,
    },
    politicalStabilityIndex: {
      label: "Political Stability Index (WGI)",
      value: -0.23,
      score: 44,
    },
    voiceAccountability: {
      label: "Voice & Accountability",
      value: -1.58,
      score: 8,
    },
    civilLibertiesIndex: {
      label: "Civil Liberties (FH)",
      value: 10,
      unit: "/60",
      score: 17,
    },

    globalPeaceIndex: {
      label: "Global Peace Index",
      value: 2.04,
      score: 47,
      invertScale: true,
    },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 0.5,
      score: 95,
      invertScale: true,
    },
    militaryExpenditurePct: {
      label: "Military Expenditure (% GDP)",
      value: "1.7%",
      score: 65,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "78.6 yrs", score: 79 },
    hale: {
      label: "Healthy Life Expectancy (HALE)",
      value: "69.0 yrs",
      score: 77,
    },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 5.7,
      score: 74,
      invertScale: true,
    },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 85,
      score: 85,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.8, score: 80 },
    pisaScore: { label: "PISA Score (avg)", value: 579, score: 84 },
    literacyRate: { label: "Literacy Rate", value: "97.3%", score: 97 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "2.4%", score: 72 },

    epi: { label: "Environmental Performance Index", value: 28.4, score: 28.4 },
    ecologicalFootprint: {
      label: "Ecological Footprint (gha/cap)",
      value: 3.7,
      score: 48,
      invertScale: true,
    },
    airQualityIndex: { label: "Air Quality Index (EPI)", value: 19, score: 19 },

    internetPenetration: {
      label: "Internet Penetration",
      value: "74%",
      score: 74,
    },
    networkReadinessIndex: {
      label: "Network Readiness Index",
      value: 59.8,
      score: 59.8,
    },

    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 7,
      score: 7,
    },
    internetFreedom: { label: "Internet Freedom", value: 10, score: 10 },

    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 66.0,
      score: 66,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 45.5,
      score: 45.5,
    },
    tradeOpenness: { label: "Trade Openness (% GDP)", value: "38%", score: 65 },
  },

  de: {
    hdi: { label: "HDI", value: 0.95, score: 95 },
    ihdi: { label: "IHDI", value: 0.869, score: 86.9 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.077,
      score: 92,
      invertScale: true,
    },
    spi: { label: "Social Progress Index", value: 90.4, score: 90.4 },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.0,
      unit: "/10",
      score: 70,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$57,928",
      score: 86,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 31.7,
      score: 62,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "3.5%",
      score: 93,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "3.0%",
      score: 88,
      invertScale: true,
    },
    laborForceParticipation: {
      label: "Labor Force Participation",
      value: "76.5%",
      score: 76.5,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.79,
      score: 79,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 72.5,
      score: 72.5,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.8,
      unit: "/10",
      score: 88,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 94,
      unit: "/100",
      score: 94,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 78,
      score: 78,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.84,
      score: 84,
    },
    governmentEffectiveness: {
      label: "Govt. Effectiveness (WGI)",
      value: 1.52,
      score: 85,
    },
    politicalStabilityIndex: {
      label: "Political Stability Index (WGI)",
      value: 0.69,
      score: 78,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "81.1 yrs", score: 90 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 3.3,
      score: 88,
      invertScale: true,
    },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 86,
      score: 86,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.94, score: 94 },
    pisaScore: { label: "PISA Score (avg)", value: 475, score: 64 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "3.1%", score: 82 },

    epi: { label: "Environmental Performance Index", value: 66.5, score: 66.5 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "94%",
      score: 94,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 78,
      score: 78,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 91.4,
      score: 91.4,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 57.0,
      score: 57,
    },
  },

  gb: {
    hdi: { label: "HDI", value: 0.94, score: 94 },
    ihdi: { label: "IHDI", value: 0.845, score: 84.5 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.119,
      score: 88,
      invertScale: true,
    },
    spi: { label: "Social Progress Index", value: 88.6, score: 88.6 },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.03,
      unit: "/10",
      score: 70.3,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$50,291",
      score: 82,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 35.1,
      score: 53,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "4.2%",
      score: 78,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.78,
      score: 78,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 73.1,
      score: 73.1,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.54,
      unit: "/10",
      score: 85.4,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 93,
      unit: "/100",
      score: 93,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 71,
      score: 71,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.81,
      score: 81,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "81.3 yrs", score: 91 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 89,
      score: 89,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.93, score: 93 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "1.7%", score: 60 },
    pisaScore: { label: "PISA Score (avg)", value: 502, score: 67 },

    epi: { label: "Environmental Performance Index", value: 68.0, score: 68 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "96%",
      score: 96,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 79,
      score: 79,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 90.3,
      score: 90.3,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 59.7,
      score: 59.7,
    },
  },

  fr: {
    hdi: { label: "HDI", value: 0.91, score: 91 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.084,
      score: 92,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.66,
      unit: "/10",
      score: 66.6,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$51,451",
      score: 83,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 32.4,
      score: 60,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "7.3%",
      score: 60,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.76,
      score: 76,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 63.8,
      score: 63.8,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.07,
      unit: "/10",
      score: 80.7,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 71,
      score: 71,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.78,
      score: 78,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "82.3 yrs", score: 93 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 90,
      score: 90,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.89, score: 89 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "2.2%", score: 68 },

    epi: { label: "Environmental Performance Index", value: 67.5, score: 67.5 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "93%",
      score: 93,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 75,
      score: 75,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 88.2,
      score: 88.2,
    },
  },

  jp: {
    hdi: { label: "HDI", value: 0.92, score: 92 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.083,
      score: 92,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.14,
      unit: "/10",
      score: 61.4,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$42,940",
      score: 77,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 32.9,
      score: 59,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "2.5%",
      score: 90,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.8,
      score: 80,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 71.4,
      score: 71.4,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 2.27,
      score: 92,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.4,
      unit: "/10",
      score: 84,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 73,
      score: 73,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.79,
      score: 79,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "84.3 yrs", score: 100 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 88,
      score: 88,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.88, score: 88 },
    pisaScore: { label: "PISA Score (avg)", value: 520, score: 72 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "3.3%", score: 85 },

    epi: { label: "Environmental Performance Index", value: 57.1, score: 57.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "93%",
      score: 93,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 70,
      score: 70,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 77.1,
      score: 77.1,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 53.9,
      score: 53.9,
    },
  },

  in: {
    hdi: { label: "HDI", value: 0.644, score: 64.4 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.437,
      score: 56,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.123,
      score: 50,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.05,
      unit: "/10",
      score: 40.5,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$9,183",
      score: 35,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 35.7,
      score: 51,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "7.8%",
      score: 55,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.49,
      score: 49,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 0.43,
      score: 51,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.04,
      unit: "/10",
      score: 70.4,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 66,
      unit: "/100",
      score: 66,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 39,
      score: 39,
    },
    ruleOfLawIndex: { label: "Rule of Law Index (WJP)", value: 0.5, score: 50 },

    lifeExpectancy: { label: "Life Expectancy", value: "70.8 yrs", score: 62 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 26.6,
      score: 40,
      invertScale: true,
    },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 65,
      score: 65,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.63, score: 63 },
    literacyRate: { label: "Literacy Rate", value: "77.7%", score: 77.7 },

    epi: { label: "Environmental Performance Index", value: 18.9, score: 18.9 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "52%",
      score: 52,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 31,
      score: 31,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 57.0,
      score: 57,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 36.6,
      score: 36.6,
    },
  },

  br: {
    hdi: { label: "HDI", value: 0.76, score: 76 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.408,
      score: 59,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.17,
      unit: "/10",
      score: 61.7,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$17,208",
      score: 48,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 52.9,
      score: 17,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13%",
      score: 57,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "7.8%",
      score: 55,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.56,
      score: 56,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 6.97,
      unit: "/10",
      score: 69.7,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 73,
      unit: "/100",
      score: 73,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 36,
      score: 36,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "75.9 yrs", score: 73 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 72,
      score: 72,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.73, score: 73 },
    pisaScore: { label: "PISA Score (avg)", value: 379, score: 32 },
    literacyRate: { label: "Literacy Rate", value: "94.2%", score: 94 },

    epi: { label: "Environmental Performance Index", value: 52.5, score: 52.5 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "84%",
      score: 84,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 57,
      score: 57,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 68.8,
      score: 68.8,
    },
  },

  ru: {
    hdi: { label: "HDI", value: 0.821, score: 82.1 },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.66,
      unit: "/10",
      score: 56.6,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$29,485",
      score: 62,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 36.0,
      score: 50,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "3.0%",
      score: 88,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.68,
      score: 68,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 2.22,
      unit: "/10",
      score: 22.2,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 5,
      unit: "/100",
      score: 5,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 26,
      score: 26,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.38,
      score: 38,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "73.4 yrs", score: 64 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 72,
      score: 72,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.82, score: 82 },
    literacyRate: { label: "Literacy Rate", value: "99.7%", score: 99.7 },

    epi: { label: "Environmental Performance Index", value: 37.5, score: 37.5 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "85%",
      score: 85,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 9,
      score: 9,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 69.7,
      score: 69.7,
    },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 5.4,
      score: 46,
      invertScale: true,
    },
  },

  au_oc: {
    hdi: { label: "HDI", value: 0.946, score: 94.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.094,
      score: 91,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.1,
      unit: "/10",
      score: 71,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$56,624",
      score: 85,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 34.3,
      score: 55,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "4.1%",
      score: 79,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.8,
      score: 80,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 75.6,
      score: 75.6,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.86,
      unit: "/10",
      score: 88.6,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 97,
      unit: "/100",
      score: 97,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 75,
      score: 75,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.87,
      score: 87,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "83.3 yrs", score: 97 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 88,
      score: 88,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.94, score: 94 },
    pisaScore: { label: "PISA Score (avg)", value: 494, score: 65 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "1.9%", score: 63 },

    epi: { label: "Environmental Performance Index", value: 60.1, score: 60.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "91%",
      score: 91,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 87,
      score: 87,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 84.5,
      score: 84.5,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 53.9,
      score: 53.9,
    },
  },

  kr: {
    hdi: { label: "HDI", value: 0.929, score: 92.9 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.067,
      score: 93,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.95,
      unit: "/10",
      score: 59.5,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$44,501",
      score: 78,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 31.4,
      score: 62,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "2.7%",
      score: 89,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.79,
      score: 79,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 1.95,
      score: 88,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.09,
      unit: "/10",
      score: 80.9,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 63,
      score: 63,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "83.6 yrs", score: 98 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 90,
      score: 90,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.89, score: 89 },
    pisaScore: { label: "PISA Score (avg)", value: 527, score: 73 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "4.9%", score: 95 },

    epi: { label: "Environmental Performance Index", value: 54.7, score: 54.7 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "97%",
      score: 97,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 62,
      score: 62,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 79.9,
      score: 79.9,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 57.1,
      score: 57.1,
    },
  },

  ca: {
    hdi: { label: "HDI", value: 0.936, score: 93.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.08,
      score: 92,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.9,
      unit: "/10",
      score: 69,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$55,522",
      score: 84,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 33.3,
      score: 57,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "6.2%",
      score: 65,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.8,
      score: 80,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 74.6,
      score: 74.6,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.87,
      unit: "/10",
      score: 88.7,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 74,
      score: 74,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.84,
      score: 84,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "82.6 yrs", score: 95 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 88,
      score: 88,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.94, score: 94 },
    pisaScore: { label: "PISA Score (avg)", value: 512, score: 70 },

    epi: { label: "Environmental Performance Index", value: 57.1, score: 57.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "94%",
      score: 94,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 85,
      score: 85,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 86.8,
      score: 86.8,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 57.0,
      score: 57,
    },
  },

  sa: {
    hdi: { label: "HDI", value: 0.875, score: 87.5 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.271,
      score: 73,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.32,
      unit: "/10",
      score: 63.2,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$60,836",
      score: 87,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.9,
      score: 30,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "5.9%",
      score: 66,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 2.08,
      unit: "/10",
      score: 20.8,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 8,
      unit: "/100",
      score: 8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 52,
      score: 52,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "77.2 yrs", score: 76 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 79,
      score: 79,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.82, score: 82 },
    literacyRate: { label: "Literacy Rate", value: "97.6%", score: 97.6 },

    epi: { label: "Environmental Performance Index", value: 48.7, score: 48.7 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "98%",
      score: 98,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 12,
      score: 12,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 73.1,
      score: 73.1,
    },
  },

  ae: {
    hdi: { label: "HDI", value: 0.911, score: 91.1 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.117,
      score: 88,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.73,
      unit: "/10",
      score: 67.3,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$96,958",
      score: 97,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "2.7%",
      score: 89,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 2.77,
      unit: "/10",
      score: 27.7,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 69,
      score: 69,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "78.7 yrs", score: 81 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 81,
      score: 81,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.86, score: 86 },

    epi: { label: "Environmental Performance Index", value: 56.1, score: 56.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "99%",
      score: 99,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 22,
      score: 22,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 84.7,
      score: 84.7,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 37.5,
      score: 37.5,
    },
  },

  sg: {
    hdi: { label: "HDI", value: 0.949, score: 94.9 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.065,
      score: 94,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.52,
      unit: "/10",
      score: 65.2,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$133,895",
      score: 100,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.9,
      score: 30,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "2.0%",
      score: 92,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.88,
      score: 88,
    },
    economicFreedomIndex: {
      label: "Economic Freedom Index",
      value: 83.9,
      score: 83.9,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 1.55,
      score: 77,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 6.22,
      unit: "/10",
      score: 62.2,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 85,
      score: 85,
    },
    ruleOfLawIndex: {
      label: "Rule of Law Index (WJP)",
      value: 0.86,
      score: 86,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "83.5 yrs", score: 98 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 89,
      score: 89,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.9, score: 90 },
    pisaScore: { label: "PISA Score (avg)", value: 569, score: 82 },

    epi: { label: "Environmental Performance Index", value: 64.1, score: 64.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "99%",
      score: 99,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 58,
      score: 58,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 94.8,
      score: 94.8,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 57.2,
      score: 57.2,
    },
  },

  mx: {
    hdi: { label: "HDI", value: 0.781, score: 78.1 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.297,
      score: 70,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.68,
      unit: "/10",
      score: 66.8,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$21,364",
      score: 54,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.4,
      score: 31,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "36.3%",
      score: 30,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "2.9%",
      score: 88,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.61,
      score: 61,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 5.86,
      unit: "/10",
      score: 58.6,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 31,
      score: 31,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "75.1 yrs", score: 72 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 76,
      score: 76,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.72, score: 72 },
    pisaScore: { label: "PISA Score (avg)", value: 410, score: 40 },

    epi: { label: "Environmental Performance Index", value: 48.3, score: 48.3 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "76%",
      score: 76,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 40,
      score: 40,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 68.6,
      score: 68.6,
    },
  },

  za: {
    hdi: { label: "HDI", value: 0.717, score: 71.7 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.408,
      score: 59,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.065,
      score: 72,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.49,
      unit: "/10",
      score: 54.9,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$14,854",
      score: 44,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 63.0,
      score: 5,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "31.9%",
      score: 10,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.41,
      score: 41,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.05,
      unit: "/10",
      score: 70.5,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 41,
      score: 41,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "64.9 yrs", score: 43 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 41.1,
      score: 8,
      invertScale: true,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.72, score: 72 },
    literacyRate: { label: "Literacy Rate", value: "87%", score: 87 },

    epi: { label: "Environmental Performance Index", value: 43.1, score: 43.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "72%",
      score: 72,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 55,
      score: 55,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 66.1,
      score: 66.1,
    },
  },

  ng: {
    hdi: { label: "HDI", value: 0.548, score: 54.8 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.68,
      score: 32,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.307,
      score: 20,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.15,
      unit: "/10",
      score: 51.5,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$5,371",
      score: 22,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 35.1,
      score: 53,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "40%",
      score: 22,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "4.3%",
      score: 77,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 4.31,
      unit: "/10",
      score: 43.1,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 24,
      score: 24,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "53.6 yrs", score: 27 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 55.5,
      score: 18,
      invertScale: true,
    },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 42,
      score: 42,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.52, score: 52 },
    literacyRate: { label: "Literacy Rate", value: "62%", score: 62 },

    epi: { label: "Environmental Performance Index", value: 26.1, score: 26.1 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "57%",
      score: 57,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 37,
      score: 37,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 55.5,
      score: 55.5,
    },
  },

  eg: {
    hdi: { label: "HDI", value: 0.728, score: 72.8 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.454,
      score: 55,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.17,
      unit: "/10",
      score: 41.7,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$17,614",
      score: 49,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 31.5,
      score: 62,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "7.0%",
      score: 61,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.49,
      score: 49,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 2.93,
      unit: "/10",
      score: 29.3,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 18,
      unit: "/100",
      score: 18,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 30,
      score: 30,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "72.0 yrs", score: 63 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 65,
      score: 65,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.69, score: 69 },
    literacyRate: { label: "Literacy Rate", value: "73.1%", score: 73.1 },

    epi: { label: "Environmental Performance Index", value: 30.2, score: 30.2 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "72%",
      score: 72,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 23,
      score: 23,
    },
  },

  il_as: {
    hdi: { label: "HDI", value: 0.919, score: 91.9 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.139,
      score: 86,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.34,
      unit: "/10",
      score: 73.4,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$51,430",
      score: 83,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 38.6,
      score: 45,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "3.7%",
      score: 83,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.74,
      score: 74,
    },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "5.6%", score: 98 },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.86,
      unit: "/10",
      score: 78.6,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 76,
      unit: "/100",
      score: 76,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 62,
      score: 62,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "82.8 yrs", score: 96 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 87,
      score: 87,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.9, score: 90 },
    pisaScore: { label: "PISA Score (avg)", value: 475, score: 64 },

    epi: { label: "Environmental Performance Index", value: 55.0, score: 55 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "91%",
      score: 91,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 50,
      score: 50,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 86.2,
      score: 86.2,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 64.8,
      score: 64.8,
    },
  },

  ar: {
    hdi: { label: "HDI", value: 0.849, score: 84.9 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.308,
      score: 69,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.88,
      unit: "/10",
      score: 58.8,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$25,218",
      score: 58,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 42.3,
      score: 36,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "40%",
      score: 22,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "6.2%",
      score: 65,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.03,
      unit: "/10",
      score: 70.3,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 37,
      score: 37,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "75.8 yrs", score: 73 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 79,
      score: 79,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.82, score: 82 },
    pisaScore: { label: "PISA Score (avg)", value: 370, score: 25 },
    literacyRate: { label: "Literacy Rate", value: "99.1%", score: 99.1 },

    epi: { label: "Environmental Performance Index", value: 45.9, score: 45.9 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "88%",
      score: 88,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 63,
      score: 63,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 75.2,
      score: 75.2,
    },
  },

  tr: {
    hdi: { label: "HDI", value: 0.838, score: 83.8 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.282,
      score: 72,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.63,
      unit: "/10",
      score: 46.3,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$35,777",
      score: 68,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 41.9,
      score: 37,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "8.5%",
      score: 52,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.64,
      score: 64,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 4.35,
      unit: "/10",
      score: 43.5,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 32,
      unit: "/100",
      score: 32,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 34,
      score: 34,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "78.6 yrs", score: 81 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 79,
      score: 79,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.77, score: 77 },
    pisaScore: { label: "PISA Score (avg)", value: 453, score: 56 },

    epi: { label: "Environmental Performance Index", value: 42.6, score: 42.6 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "83%",
      score: 83,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 26,
      score: 26,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 79.4,
      score: 79.4,
    },
  },

  id: {
    hdi: { label: "HDI", value: 0.713, score: 71.3 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.466,
      score: 53,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.46,
      unit: "/10",
      score: 54.6,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$15,279",
      score: 45,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 38.2,
      score: 44,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "5.3%",
      score: 70,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.54,
      score: 54,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 6.71,
      unit: "/10",
      score: 67.1,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 34,
      score: 34,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "68.7 yrs", score: 57 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 63,
      score: 63,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.65, score: 65 },
    pisaScore: { label: "PISA Score (avg)", value: 366, score: 21 },
    literacyRate: { label: "Literacy Rate", value: "96%", score: 96 },

    epi: { label: "Environmental Performance Index", value: 28.4, score: 28.4 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "77%",
      score: 77,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 52,
      score: 52,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 60.9,
      score: 60.9,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 31.8,
      score: 31.8,
    },
  },

  vn: {
    hdi: { label: "HDI", value: 0.726, score: 72.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.296,
      score: 70,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.75,
      unit: "/10",
      score: 57.5,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$12,591",
      score: 40,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 35.7,
      score: 51,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "2.2%",
      score: 91,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.69,
      score: 69,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 2.94,
      unit: "/10",
      score: 29.4,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 41,
      score: 41,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "73.7 yrs", score: 65 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 73,
      score: 73,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.72, score: 72 },
    pisaScore: { label: "PISA Score (avg)", value: 469, score: 62 },

    epi: { label: "Environmental Performance Index", value: 25.9, score: 25.9 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "79%",
      score: 79,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 20,
      score: 20,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 61.7,
      score: 61.7,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 38.8,
      score: 38.8,
    },
  },

  ph: {
    hdi: { label: "HDI", value: 0.71, score: 71 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.425,
      score: 58,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.11,
      unit: "/10",
      score: 61.1,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$9,620",
      score: 36,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "4.5%",
      score: 76,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.55,
      score: 55,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 6.64,
      unit: "/10",
      score: 66.4,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 33,
      score: 33,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "71.2 yrs", score: 62 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 60,
      score: 60,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.67, score: 67 },
    pisaScore: { label: "PISA Score (avg)", value: 353, score: 13 },
    literacyRate: { label: "Literacy Rate", value: "98.2%", score: 98.2 },

    epi: { label: "Environmental Performance Index", value: 41.3, score: 41.3 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "73%",
      score: 73,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 55,
      score: 55,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 65.8,
      score: 65.8,
    },
  },

  pk: {
    hdi: { label: "HDI", value: 0.544, score: 54.4 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.534,
      score: 47,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.198,
      score: 30,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.36,
      unit: "/10",
      score: 43.6,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$5,839",
      score: 23,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "6.3%",
      score: 64,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 3.85,
      unit: "/10",
      score: 38.5,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 27,
      score: 27,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "67.5 yrs", score: 55 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 52.6,
      score: 20,
      invertScale: true,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.45, score: 45 },
    literacyRate: { label: "Literacy Rate", value: "58%", score: 58 },

    epi: { label: "Environmental Performance Index", value: 24.2, score: 24.2 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "48%",
      score: 48,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 26,
      score: 26,
    },
  },

  bd: {
    hdi: { label: "HDI", value: 0.661, score: 66.1 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.536,
      score: 46,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.121,
      score: 51,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 3.87,
      unit: "/10",
      score: 38.7,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$7,945",
      score: 30,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "4.9%",
      score: 73,
      invertScale: true,
    },
    humanCapitalIndex: {
      label: "Human Capital Index (WB)",
      value: 0.46,
      score: 46,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 5.98,
      unit: "/10",
      score: 59.8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 24,
      score: 24,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "73.6 yrs", score: 65 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 26.9,
      score: 39,
      invertScale: true,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.55, score: 55 },
    literacyRate: { label: "Literacy Rate", value: "74.9%", score: 74.9 },

    epi: { label: "Environmental Performance Index", value: 23.7, score: 23.7 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "73%",
      score: 73,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 35,
      score: 35,
    },
  },

  et: {
    hdi: { label: "HDI", value: 0.492, score: 49.2 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.52,
      score: 48,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.354,
      score: 14,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.08,
      unit: "/10",
      score: 40.8,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$2,576",
      score: 10,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "26%",
      score: 42,
      invertScale: true,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "3.5%",
      score: 84,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 3.36,
      unit: "/10",
      score: 33.6,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 37,
      score: 37,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "64.8 yrs", score: 43 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 36.8,
      score: 29,
      invertScale: true,
    },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 42,
      score: 42,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.42, score: 42 },
    literacyRate: { label: "Literacy Rate", value: "51.8%", score: 51.8 },

    epi: { label: "Environmental Performance Index", value: 34.5, score: 34.5 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "24%",
      score: 24,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 27,
      score: 27,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 44.5,
      score: 44.5,
    },
  },

  ke: {
    hdi: { label: "HDI", value: 0.601, score: 60.1 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.48,
      score: 52,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.65,
      unit: "/10",
      score: 46.5,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$5,965",
      score: 23,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "5.7%",
      score: 68,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 5.45,
      unit: "/10",
      score: 54.5,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 31,
      score: 31,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "63.3 yrs", score: 41 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 31.7,
      score: 34,
      invertScale: true,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.6, score: 60 },
    literacyRate: { label: "Literacy Rate", value: "82.6%", score: 82.6 },

    epi: { label: "Environmental Performance Index", value: 39.0, score: 39 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "87%",
      score: 87,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 49,
      score: 49,
    },
  },

  ir: {
    hdi: { label: "HDI", value: 0.774, score: 77.4 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.459,
      score: 54,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.79,
      unit: "/10",
      score: 47.9,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$14,607",
      score: 43,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "8.8%",
      score: 50,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 1.67,
      unit: "/10",
      score: 16.7,
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 14,
      unit: "/100",
      score: 14,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 24,
      score: 24,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "77.4 yrs", score: 76 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 77,
      score: 77,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.73, score: 73 },
    literacyRate: { label: "Literacy Rate", value: "89.5%", score: 89.5 },

    epi: { label: "Environmental Performance Index", value: 37.2, score: 37.2 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "72%",
      score: 72,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 13,
      score: 13,
    },
  },

  iq: {
    hdi: { label: "HDI", value: 0.686, score: 68.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.547,
      score: 45,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 4.64,
      unit: "/10",
      score: 46.4,
    },

    gdpPerCapitaPPP: {
      label: "GDP per Capita (PPP)",
      value: "$15,700",
      score: 46,
    },
    unemploymentRate: {
      label: "Unemployment Rate",
      value: "15.5%",
      score: 30,
      invertScale: true,
    },

    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 3.83,
      unit: "/10",
      score: 38.3,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 20,
      score: 20,
    },

    lifeExpectancy: { label: "Life Expectancy", value: "70.6 yrs", score: 60 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 58,
      score: 58,
    },

    educationIndex: { label: "Education Index (UNDP)", value: 0.6, score: 60 },
    literacyRate: { label: "Literacy Rate", value: "79%", score: 79 },

    epi: { label: "Environmental Performance Index", value: 37.7, score: 37.7 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "79%",
      score: 79,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 22,
      score: 22,
    },
  },

  kp: {
    hdi: {
      label: "HDI",
      value: 0.551,
      score: 55.1,
      note: "Estimate — DPRK does not submit data",
    },
    freedomInWorld: {
      label: "Freedom in the World",
      value: 3,
      unit: "/100",
      score: 3,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 1.08,
      unit: "/10",
      score: 10.8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 8,
      score: 8,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "72.3 yrs", score: 63 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 1,
      score: 1,
    },
    internetPenetration: {
      label: "Internet Penetration",
      value: "<1%",
      score: 1,
    },
    militaryExpenditurePct: {
      label: "Military Expenditure (% GDP)",
      value: "~25%",
      score: 5,
    },
    prisonPopulationRate: {
      label: "Prison / Camp Population (est.)",
      value: "~460 per 100k",
      score: 5,
    },
  },

  // Scandinavia & Nordic
  se: {
    hdi: { label: "HDI", value: 0.952, score: 95.2 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.04,
      score: 96,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.36,
      unit: "/10",
      score: 73.6,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 28.8,
      score: 68,
      invertScale: true,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.39,
      unit: "/10",
      score: 93.9,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 85,
      score: 85,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "82.8 yrs", score: 96 },
    epi: { label: "Environmental Performance Index", value: 72.7, score: 72.7 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 88,
      score: 88,
    },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "3.4%", score: 86 },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 91.1,
      score: 91.1,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 63.0,
      score: 63,
    },
  },

  no: {
    hdi: { label: "HDI", value: 0.966, score: 96.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.016,
      score: 98,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.06,
      unit: "/10",
      score: 70.6,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 25.7,
      score: 73,
      invertScale: true,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.75,
      unit: "/10",
      score: 97.5,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 84,
      score: 84,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "83.3 yrs", score: 97 },
    epi: { label: "Environmental Performance Index", value: 77.3, score: 77.3 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 95,
      score: 95,
    },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "2.0%", score: 64 },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 89.0,
      score: 89,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 58.5,
      score: 58.5,
    },
  },

  dk: {
    hdi: { label: "HDI", value: 0.952, score: 95.2 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.038,
      score: 96,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.12,
      unit: "/10",
      score: 71.2,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 28.8,
      score: 68,
      invertScale: true,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.28,
      unit: "/10",
      score: 92.8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 90,
      score: 90,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "81.6 yrs", score: 91 },
    epi: { label: "Environmental Performance Index", value: 77.9, score: 77.9 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 89,
      score: 89,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 90.9,
      score: 90.9,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 59.9,
      score: 59.9,
    },
  },

  fi: {
    hdi: { label: "HDI", value: 0.94, score: 94 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.037,
      score: 96,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.74,
      unit: "/10",
      score: 77.4,
      note: "#1 happiest country 2024",
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 27.3,
      score: 71,
      invertScale: true,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.2,
      unit: "/10",
      score: 92,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 87,
      score: 87,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "81.8 yrs", score: 92 },
    epi: { label: "Environmental Performance Index", value: 74.9, score: 74.9 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 93,
      score: 93,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 87.5,
      score: 87.5,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 57.9,
      score: 57.9,
    },
  },

  nl: {
    hdi: { label: "HDI", value: 0.946, score: 94.6 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.044,
      score: 96,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.08,
      unit: "/10",
      score: 70.8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 83,
      score: 83,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.02,
      unit: "/10",
      score: 90.2,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "81.7 yrs", score: 91 },
    epi: { label: "Environmental Performance Index", value: 66.9, score: 66.9 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 83,
      score: 83,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 93.0,
      score: 93,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 60.0,
      score: 60,
    },
  },

  ch: {
    hdi: { label: "HDI", value: 0.962, score: 96.2 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.025,
      score: 98,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.25,
      unit: "/10",
      score: 72.5,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 82,
      score: 82,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.14,
      unit: "/10",
      score: 91.4,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "84.0 yrs", score: 99 },
    epi: { label: "Environmental Performance Index", value: 76.9, score: 76.9 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 82,
      score: 82,
    },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "3.2%", score: 83 },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 90.5,
      score: 90.5,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 67.7,
      score: 67.7,
      note: "#1 Global Innovation 2024",
    },
  },

  it: {
    hdi: { label: "HDI", value: 0.895, score: 89.5 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.069,
      score: 93,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.38,
      unit: "/10",
      score: 63.8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 56,
      score: 56,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.92,
      unit: "/10",
      score: 79.2,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "83.4 yrs", score: 97 },
    epi: { label: "Environmental Performance Index", value: 62.2, score: 62.2 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 63,
      score: 63,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 87.6,
      score: 87.6,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 48.5,
      score: 48.5,
    },
  },

  es: {
    hdi: { label: "HDI", value: 0.905, score: 90.5 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.058,
      score: 94,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.46,
      unit: "/10",
      score: 64.6,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 60,
      score: 60,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.08,
      unit: "/10",
      score: 80.8,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "83.3 yrs", score: 97 },
    epi: { label: "Environmental Performance Index", value: 63.4, score: 63.4 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 70,
      score: 70,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 86.4,
      score: 86.4,
    },
  },

  pl: {
    hdi: { label: "HDI", value: 0.881, score: 88.1 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.124,
      score: 88,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.14,
      unit: "/10",
      score: 61.4,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 54,
      score: 54,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 6.8,
      unit: "/10",
      score: 68,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "77.7 yrs", score: 77 },
    epi: { label: "Environmental Performance Index", value: 45.3, score: 45.3 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 65,
      score: 65,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 83.7,
      score: 83.7,
    },
  },

  ua: {
    hdi: { label: "HDI", value: 0.773, score: 77.3 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.253,
      score: 75,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.07,
      unit: "/10",
      score: 50.7,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 35,
      score: 35,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 5.81,
      unit: "/10",
      score: 58.1,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "72.1 yrs", score: 63 },
    epi: { label: "Environmental Performance Index", value: 41.7, score: 41.7 },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 58,
      score: 58,
    },
  },

  kz: {
    hdi: { label: "HDI", value: 0.802, score: 80.2 },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.78,
      unit: "/10",
      score: 57.8,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 34,
      score: 34,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 3.14,
      unit: "/10",
      score: 31.4,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "73.3 yrs", score: 64 },
    pisaScore: { label: "PISA Score (avg)", value: 430, score: 48 },
    epi: { label: "Environmental Performance Index", value: 37.6, score: 37.6 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "91%",
      score: 91,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 22,
      score: 22,
    },
  },

  my: {
    hdi: { label: "HDI", value: 0.803, score: 80.3 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.287,
      score: 71,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.56,
      unit: "/10",
      score: 55.6,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 41.0,
      score: 38,
      invertScale: true,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 50,
      score: 50,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.32,
      unit: "/10",
      score: 73.2,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "75.9 yrs", score: 74 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 75,
      score: 75,
    },
    pisaScore: { label: "PISA Score (avg)", value: 432, score: 49 },
    epi: { label: "Environmental Performance Index", value: 39.7, score: 39.7 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "89%",
      score: 89,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 46,
      score: 46,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 76.1,
      score: 76.1,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 39.4,
      score: 39.4,
    },
  },

  th: {
    hdi: { label: "HDI", value: 0.8, score: 80 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.364,
      score: 64,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.69,
      unit: "/10",
      score: 56.9,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 43.3,
      score: 34,
      invertScale: true,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 36,
      score: 36,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 4.51,
      unit: "/10",
      score: 45.1,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "77.8 yrs", score: 78 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 80,
      score: 80,
    },
    pisaScore: { label: "PISA Score (avg)", value: 407, score: 39 },
    epi: { label: "Environmental Performance Index", value: 30.2, score: 30.2 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "88%",
      score: 88,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 35,
      score: 35,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 71.2,
      score: 71.2,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 38.0,
      score: 38,
    },
  },

  nz: {
    hdi: { label: "HDI", value: 0.939, score: 93.9 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.12,
      score: 88,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 7.09,
      unit: "/10",
      score: 70.9,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 85,
      score: 85,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 9.37,
      unit: "/10",
      score: 93.7,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "82.4 yrs", score: 95 },
    epi: { label: "Environmental Performance Index", value: 60.7, score: 60.7 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "94%",
      score: 94,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 86,
      score: 86,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 83.7,
      score: 83.7,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 53.1,
      score: 53.1,
    },
  },

  tw: {
    hdi: {
      label: "HDI",
      value: 0.926,
      score: 92.6,
      note: "Not in UN system; WB estimate",
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.71,
      unit: "/10",
      score: 67.1,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 67,
      score: 67,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 8.92,
      unit: "/10",
      score: 89.2,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "80.2 yrs", score: 88 },
    pisaScore: { label: "PISA Score (avg)", value: 547, score: 78 },
    rdIntensity: { label: "R&D Intensity (% GDP)", value: "3.6%", score: 88 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "92%",
      score: 92,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 73,
      score: 73,
    },
    globalInnovationIndex: {
      label: "Global Innovation Index",
      value: 64.8,
      score: 64.8,
    },
    economicComplexityIndex: {
      label: "Economic Complexity Index",
      value: 2.02,
      score: 89,
    },
  },

  cl: {
    hdi: { label: "HDI", value: 0.86, score: 86 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.254,
      score: 75,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 6.41,
      unit: "/10",
      score: 64.1,
    },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.9,
      score: 31,
      invertScale: true,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 67,
      score: 67,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 7.93,
      unit: "/10",
      score: 79.3,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "80.2 yrs", score: 88 },
    pisaScore: { label: "PISA Score (avg)", value: 448, score: 54 },
    epi: { label: "Environmental Performance Index", value: 53.0, score: 53 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "92%",
      score: 92,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 74,
      score: 74,
    },
    globalizationIndex: {
      label: "KOF Globalization Index",
      value: 80.7,
      score: 80.7,
    },
  },

  ma: {
    hdi: { label: "HDI", value: 0.698, score: 69.8 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.433,
      score: 57,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.52,
      unit: "/10",
      score: 55.2,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 38,
      score: 38,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 4.82,
      unit: "/10",
      score: 48.2,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "74.8 yrs", score: 71 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 65,
      score: 65,
    },
    educationIndex: { label: "Education Index (UNDP)", value: 0.6, score: 60 },
    literacyRate: { label: "Literacy Rate", value: "76.4%", score: 76.4 },
    epi: { label: "Environmental Performance Index", value: 41.8, score: 41.8 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "88%",
      score: 88,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 34,
      score: 34,
    },
  },

  gh: {
    hdi: { label: "HDI", value: 0.632, score: 63.2 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.511,
      score: 49,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 5.09,
      unit: "/10",
      score: 50.9,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 42,
      score: 42,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 6.89,
      unit: "/10",
      score: 68.9,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "64.5 yrs", score: 43 },
    uhcIndex: {
      label: "Universal Health Coverage Index",
      value: 54,
      score: 54,
    },
    literacyRate: { label: "Literacy Rate", value: "79%", score: 79 },
    epi: { label: "Environmental Performance Index", value: 30.2, score: 30.2 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "68%",
      score: 68,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 63,
      score: 63,
    },
  },

  cd: {
    hdi: { label: "HDI", value: 0.481, score: 48.1 },
    gii: {
      label: "Gender Inequality Index",
      value: 0.618,
      score: 38,
      invertScale: true,
    },
    mpi: {
      label: "Multidimensional Poverty Index",
      value: 0.459,
      score: 5,
      invertScale: true,
    },
    happinessScore: {
      label: "World Happiness Score",
      value: 3.38,
      unit: "/10",
      score: 33.8,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "73%",
      score: 5,
      invertScale: true,
    },
    corruptionPerceptionsIndex: {
      label: "Corruption Perceptions Index",
      value: 19,
      score: 19,
    },
    democracyIndex: {
      label: "Democracy Index (EIU)",
      value: 1.96,
      unit: "/10",
      score: 19.6,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "60.7 yrs", score: 33 },
    infantMortality: {
      label: "Infant Mortality (per 1k births)",
      value: 59.3,
      score: 15,
      invertScale: true,
    },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 13.6,
      score: 27,
      invertScale: true,
    },
    literacyRate: { label: "Literacy Rate", value: "80%", score: 80 },
    internetPenetration: {
      label: "Internet Penetration",
      value: "27%",
      score: 27,
    },
    pressFreedomIndex: {
      label: "Press Freedom Index (RSF)",
      value: 28,
      score: 28,
    },
  },
};

// ── US STATE METRICS ─────────────────────────────────────────────────────────
// Score represents 0-100 comparison within US state context

export const STATE_METRICS: Record<string, MetricsProfile> = {
  ca: {
    hdi: { label: "Human Development Index", value: 0.928, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 49.6,
      score: 25,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.2%",
      score: 48,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.9%", score: 63 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$98,000", score: 93 },
    humanCapitalIndex: { label: "Human Capital Index", value: 0.79, score: 79 },
    democracyIndex: { label: "Political Participation", value: 72, score: 72 },
    corruptionPerceptionsIndex: {
      label: "State Government Trust",
      value: 42,
      score: 42,
    },
    lifeExpectancy: { label: "Life Expectancy", value: "81.5 yrs", score: 93 },
    infantMortality: {
      label: "Infant Mortality (per 1k)",
      value: 4.4,
      score: 78,
      invertScale: true,
    },
    uhcIndex: { label: "Health Coverage Rate", value: 93, score: 93 },
    educationIndex: { label: "Education Index", value: 0.92, score: 92 },
    pisaScore: { label: "NAEP Score (avg)", value: 238, score: 65 },
    literacyRate: { label: "Adult Literacy", value: "93%", score: 93 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "4.9%", score: 98 },
    epi: { label: "Environmental Policy Index", value: 72, score: 72 },
    internetPenetration: { label: "Broadband Access", value: "89%", score: 89 },
    pressFreedomIndex: { label: "Press Freedom", value: 78, score: 78 },
    globalizationIndex: { label: "Global Connectivity", value: 88, score: 88 },
    globalInnovationIndex: { label: "Innovation Index", value: 91, score: 91 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 5.3,
      score: 49,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 313,
      score: 48,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 82, score: 82 },
    socialCohesionIndex: { label: "Social Cohesion", value: 52, score: 52 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 64,
      score: 64,
    },
  },
  tx: {
    hdi: { label: "Human Development Index", value: 0.887, score: 89 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 49.7,
      score: 25,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "14.7%",
      score: 43,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.1%", score: 72 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$84,000", score: 88 },
    humanCapitalIndex: { label: "Human Capital Index", value: 0.72, score: 72 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.5 yrs", score: 78 },
    infantMortality: {
      label: "Infant Mortality (per 1k)",
      value: 5.5,
      score: 67,
      invertScale: true,
    },
    uhcIndex: { label: "Health Coverage Rate", value: 81, score: 81 },
    educationIndex: { label: "Education Index", value: 0.81, score: 81 },
    literacyRate: { label: "Adult Literacy", value: "88%", score: 88 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.2%", score: 72 },
    epi: { label: "Environmental Policy Index", value: 38, score: 38 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    globalizationIndex: { label: "Global Connectivity", value: 80, score: 80 },
    globalInnovationIndex: { label: "Innovation Index", value: 75, score: 75 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 8.0,
      score: 37,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 662,
      score: 20,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.2,
      unit: "/10",
      score: 62,
    },
    spi: { label: "Social Progress Index", value: 75, score: 75 },
    socialCohesionIndex: { label: "Social Cohesion", value: 55, score: 55 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 55,
      score: 55,
    },
  },
  ny: {
    hdi: { label: "Human Development Index", value: 0.922, score: 92 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 51.3,
      score: 23,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.9%",
      score: 45,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.4%", score: 68 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$95,000", score: 92 },
    humanCapitalIndex: { label: "Human Capital Index", value: 0.8, score: 80 },
    lifeExpectancy: { label: "Life Expectancy", value: "80.8 yrs", score: 90 },
    infantMortality: {
      label: "Infant Mortality (per 1k)",
      value: 4.6,
      score: 76,
      invertScale: true,
    },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.93, score: 93 },
    literacyRate: { label: "Adult Literacy", value: "93%", score: 93 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.8%", score: 78 },
    epi: { label: "Environmental Policy Index", value: 75, score: 75 },
    internetPenetration: { label: "Broadband Access", value: "88%", score: 88 },
    globalizationIndex: { label: "Global Connectivity", value: 90, score: 90 },
    globalInnovationIndex: { label: "Innovation Index", value: 87, score: 87 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.9,
      score: 60,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 274,
      score: 55,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.4,
      unit: "/10",
      score: 64,
    },
    spi: { label: "Social Progress Index", value: 83, score: 83 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 68,
      score: 68,
    },
  },
  fl: {
    hdi: { label: "Human Development Index", value: 0.886, score: 89 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 47.7,
      score: 28,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.9%",
      score: 45,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.2%", score: 81 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$61,000", score: 72 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.0 yrs", score: 80 },
    infantMortality: {
      label: "Infant Mortality (per 1k)",
      value: 5.3,
      score: 69,
      invertScale: true,
    },
    uhcIndex: { label: "Health Coverage Rate", value: 85, score: 85 },
    educationIndex: { label: "Education Index", value: 0.83, score: 83 },
    epi: { label: "Environmental Policy Index", value: 40, score: 40 },
    internetPenetration: { label: "Broadband Access", value: "83%", score: 83 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.8,
      score: 38,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 494,
      score: 30,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.3,
      unit: "/10",
      score: 63,
    },
    spi: { label: "Social Progress Index", value: 77, score: 77 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 55,
      score: 55,
    },
  },
  il: {
    hdi: { label: "Human Development Index", value: 0.908, score: 91 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.4,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.5%",
      score: 55,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.8%", score: 64 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$73,000", score: 82 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.8 yrs", score: 79 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.89, score: 89 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.0%", score: 68 },
    epi: { label: "Environmental Policy Index", value: 62, score: 62 },
    internetPenetration: { label: "Broadband Access", value: "87%", score: 87 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 9.1,
      score: 33,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 353,
      score: 43,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.3,
      unit: "/10",
      score: 63,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 65,
      score: 65,
    },
  },
  pa: {
    hdi: { label: "Human Development Index", value: 0.903, score: 90 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.0,
      score: 33,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.8%",
      score: 54,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.2%", score: 70 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$62,000", score: 73 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.2 yrs", score: 77 },
    uhcIndex: { label: "Health Coverage Rate", value: 93, score: 93 },
    educationIndex: { label: "Education Index", value: 0.9, score: 90 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "3.0%", score: 80 },
    epi: { label: "Environmental Policy Index", value: 54, score: 54 },
    internetPenetration: { label: "Broadband Access", value: "85%", score: 85 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 5.6,
      score: 47,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 440,
      score: 35,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.2,
      unit: "/10",
      score: 62,
    },
    spi: { label: "Social Progress Index", value: 79, score: 79 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 60,
      score: 60,
    },
  },
  oh: {
    hdi: { label: "Human Development Index", value: 0.876, score: 88 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.4,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.0%",
      score: 49,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.2%", score: 70 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$62,000", score: 73 },
    lifeExpectancy: { label: "Life Expectancy", value: "77.2 yrs", score: 74 },
    uhcIndex: { label: "Health Coverage Rate", value: 94, score: 94 },
    educationIndex: { label: "Education Index", value: 0.87, score: 87 },
    epi: { label: "Environmental Policy Index", value: 44, score: 44 },
    internetPenetration: { label: "Broadband Access", value: "84%", score: 84 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.0,
      score: 42,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 504,
      score: 28,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.0,
      unit: "/10",
      score: 60,
    },
    spi: { label: "Social Progress Index", value: 78, score: 78 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 60,
      score: 60,
    },
  },
  ga: {
    hdi: { label: "Human Development Index", value: 0.877, score: 88 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 47.1,
      score: 29,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "14.8%",
      score: 43,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.3%", score: 80 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$65,000", score: 75 },
    lifeExpectancy: { label: "Life Expectancy", value: "76.3 yrs", score: 72 },
    uhcIndex: { label: "Health Coverage Rate", value: 88, score: 88 },
    educationIndex: { label: "Education Index", value: 0.83, score: 83 },
    epi: { label: "Environmental Policy Index", value: 38, score: 38 },
    internetPenetration: { label: "Broadband Access", value: "81%", score: 81 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 8.8,
      score: 35,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 546,
      score: 24,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.2,
      unit: "/10",
      score: 62,
    },
    spi: { label: "Social Progress Index", value: 75, score: 75 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 57,
      score: 57,
    },
  },
  nc: {
    hdi: { label: "Human Development Index", value: 0.878, score: 88 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.9,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.8%",
      score: 45,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.7%", score: 76 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$60,000", score: 71 },
    lifeExpectancy: { label: "Life Expectancy", value: "77.4 yrs", score: 75 },
    uhcIndex: { label: "Health Coverage Rate", value: 87, score: 87 },
    educationIndex: { label: "Education Index", value: 0.85, score: 85 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.5%", score: 75 },
    epi: { label: "Environmental Policy Index", value: 49, score: 49 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 8.0,
      score: 37,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 517,
      score: 27,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.3,
      unit: "/10",
      score: 63,
    },
    spi: { label: "Social Progress Index", value: 78, score: 78 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 59,
      score: 59,
    },
  },
  mi: {
    hdi: { label: "Human Development Index", value: 0.886, score: 89 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.1,
      score: 31,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.4%",
      score: 47,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.0%", score: 74 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$58,000", score: 70 },
    lifeExpectancy: { label: "Life Expectancy", value: "77.4 yrs", score: 75 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.87, score: 87 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.5%", score: 75 },
    epi: { label: "Environmental Policy Index", value: 56, score: 56 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.2,
      score: 40,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 439,
      score: 35,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.1,
      unit: "/10",
      score: 61,
    },
    spi: { label: "Social Progress Index", value: 79, score: 79 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 63,
      score: 63,
    },
  },
  wa: {
    hdi: { label: "Human Development Index", value: 0.93, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.7,
      score: 31,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.0%",
      score: 60,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.5%", score: 67 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$96,000", score: 92 },
    humanCapitalIndex: { label: "Human Capital Index", value: 0.82, score: 82 },
    lifeExpectancy: { label: "Life Expectancy", value: "80.8 yrs", score: 90 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.92, score: 92 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "5.8%", score: 99 },
    epi: { label: "Environmental Policy Index", value: 72, score: 72 },
    internetPenetration: { label: "Broadband Access", value: "89%", score: 89 },
    globalizationIndex: { label: "Global Connectivity", value: 85, score: 85 },
    globalInnovationIndex: { label: "Innovation Index", value: 88, score: 88 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 4.6,
      score: 54,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 333,
      score: 46,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.7,
      unit: "/10",
      score: 67,
    },
    spi: { label: "Social Progress Index", value: 84, score: 84 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 70,
      score: 70,
    },
  },
  ma: {
    hdi: { label: "Human Development Index", value: 0.948, score: 95 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 47.0,
      score: 29,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "9.4%",
      score: 63,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.6%", score: 77 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$98,000", score: 93 },
    humanCapitalIndex: { label: "Human Capital Index", value: 0.88, score: 88 },
    lifeExpectancy: { label: "Life Expectancy", value: "81.3 yrs", score: 92 },
    infantMortality: {
      label: "Infant Mortality (per 1k)",
      value: 3.5,
      score: 86,
      invertScale: true,
    },
    uhcIndex: { label: "Health Coverage Rate", value: 97, score: 97 },
    educationIndex: { label: "Education Index", value: 0.97, score: 97 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "5.5%", score: 98 },
    epi: { label: "Environmental Policy Index", value: 75, score: 75 },
    internetPenetration: { label: "Broadband Access", value: "91%", score: 91 },
    globalizationIndex: { label: "Global Connectivity", value: 87, score: 87 },
    globalInnovationIndex: { label: "Innovation Index", value: 92, score: 92 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 2.5,
      score: 72,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 186,
      score: 68,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.9,
      unit: "/10",
      score: 69,
    },
    spi: { label: "Social Progress Index", value: 87, score: 87 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 72,
      score: 72,
    },
  },
  va: {
    hdi: { label: "Human Development Index", value: 0.925, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.3,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.0%",
      score: 60,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.0%", score: 84 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$73,000", score: 82 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.1 yrs", score: 81 },
    uhcIndex: { label: "Health Coverage Rate", value: 92, score: 92 },
    educationIndex: { label: "Education Index", value: 0.93, score: 93 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.8%", score: 78 },
    epi: { label: "Environmental Policy Index", value: 60, score: 60 },
    internetPenetration: { label: "Broadband Access", value: "87%", score: 87 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 6.2,
      score: 45,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 436,
      score: 36,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.5,
      unit: "/10",
      score: 65,
    },
    spi: { label: "Social Progress Index", value: 82, score: 82 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 65,
      score: 65,
    },
  },
  co: {
    hdi: { label: "Human Development Index", value: 0.93, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 47.3,
      score: 29,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "9.4%",
      score: 63,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.6%", score: 77 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$78,000", score: 85 },
    lifeExpectancy: { label: "Life Expectancy", value: "80.2 yrs", score: 87 },
    uhcIndex: { label: "Health Coverage Rate", value: 93, score: 93 },
    educationIndex: { label: "Education Index", value: 0.93, score: 93 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "3.2%", score: 83 },
    epi: { label: "Environmental Policy Index", value: 68, score: 68 },
    internetPenetration: { label: "Broadband Access", value: "87%", score: 87 },
    globalizationIndex: { label: "Global Connectivity", value: 78, score: 78 },
    globalInnovationIndex: { label: "Innovation Index", value: 80, score: 80 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 5.3,
      score: 49,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 348,
      score: 43,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.7,
      unit: "/10",
      score: 67,
    },
    spi: { label: "Social Progress Index", value: 83, score: 83 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 69,
      score: 69,
    },
  },
  mn: {
    hdi: { label: "Human Development Index", value: 0.93, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 43.5,
      score: 33,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "8.7%",
      score: 65,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.0%", score: 84 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$73,000", score: 82 },
    lifeExpectancy: { label: "Life Expectancy", value: "80.9 yrs", score: 90 },
    uhcIndex: { label: "Health Coverage Rate", value: 96, score: 96 },
    educationIndex: { label: "Education Index", value: 0.92, score: 92 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.2%", score: 72 },
    epi: { label: "Environmental Policy Index", value: 64, score: 64 },
    internetPenetration: { label: "Broadband Access", value: "87%", score: 87 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.6,
      score: 63,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 313,
      score: 48,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.8,
      unit: "/10",
      score: 68,
    },
    spi: { label: "Social Progress Index", value: 85, score: 85 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 72,
      score: 72,
    },
  },
  nj: {
    hdi: { label: "Human Development Index", value: 0.929, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.1,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "9.7%",
      score: 61,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.2%", score: 70 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$82,000", score: 87 },
    humanCapitalIndex: { label: "Human Capital Index", value: 0.84, score: 84 },
    lifeExpectancy: { label: "Life Expectancy", value: "80.5 yrs", score: 89 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.93, score: 93 },
    epi: { label: "Environmental Policy Index", value: 68, score: 68 },
    internetPenetration: { label: "Broadband Access", value: "89%", score: 89 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.0,
      score: 67,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 262,
      score: 58,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.5,
      unit: "/10",
      score: 65,
    },
    spi: { label: "Social Progress Index", value: 83, score: 83 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 62,
      score: 62,
    },
  },
  md: {
    hdi: { label: "Human Development Index", value: 0.929, score: 93 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.5,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "9.1%",
      score: 64,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.8%", score: 86 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$73,000", score: 82 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.0 yrs", score: 80 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.93, score: 93 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "3.8%", score: 90 },
    epi: { label: "Environmental Policy Index", value: 70, score: 70 },
    internetPenetration: { label: "Broadband Access", value: "88%", score: 88 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 10.2,
      score: 31,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 369,
      score: 41,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.5,
      unit: "/10",
      score: 65,
    },
    spi: { label: "Social Progress Index", value: 83, score: 83 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 67,
      score: 67,
    },
  },
  ct: {
    hdi: { label: "Human Development Index", value: 0.939, score: 94 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 47.0,
      score: 29,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.7%",
      score: 58,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.4%", score: 68 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$88,000", score: 90 },
    lifeExpectancy: { label: "Life Expectancy", value: "80.0 yrs", score: 86 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.95, score: 95 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "3.5%", score: 87 },
    epi: { label: "Environmental Policy Index", value: 70, score: 70 },
    internetPenetration: { label: "Broadband Access", value: "90%", score: 90 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.7,
      score: 62,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 272,
      score: 56,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 84, score: 84 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 66,
      score: 66,
    },
  },
  al: {
    hdi: { label: "Human Development Index", value: 0.84, score: 84 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.3,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "16.8%",
      score: 37,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.0%", score: 84 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$50,000", score: 62 },
    lifeExpectancy: { label: "Life Expectancy", value: "75.5 yrs", score: 70 },
    uhcIndex: { label: "Health Coverage Rate", value: 91, score: 91 },
    educationIndex: { label: "Education Index", value: 0.79, score: 79 },
    epi: { label: "Environmental Policy Index", value: 29, score: 29 },
    internetPenetration: { label: "Broadband Access", value: "75%", score: 75 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 13.4,
      score: 22,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 672,
      score: 19,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 5.9,
      unit: "/10",
      score: 59,
    },
    spi: { label: "Social Progress Index", value: 70, score: 70 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 51,
      score: 51,
    },
  },
  ms: {
    hdi: { label: "Human Development Index", value: 0.828, score: 83 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.8,
      score: 29,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "19.1%",
      score: 30,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.8%", score: 64 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$41,000", score: 52 },
    lifeExpectancy: { label: "Life Expectancy", value: "74.3 yrs", score: 66 },
    uhcIndex: { label: "Health Coverage Rate", value: 90, score: 90 },
    educationIndex: { label: "Education Index", value: 0.78, score: 78 },
    epi: { label: "Environmental Policy Index", value: 25, score: 25 },
    internetPenetration: { label: "Broadband Access", value: "71%", score: 71 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 20.5,
      score: 14,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 636,
      score: 21,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 5.8,
      unit: "/10",
      score: 58,
    },
    spi: { label: "Social Progress Index", value: 66, score: 66 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 48,
      score: 48,
    },
  },
  la: {
    hdi: { label: "Human Development Index", value: 0.843, score: 84 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 47.5,
      score: 28,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "19.0%",
      score: 30,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.4%", score: 68 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$56,000", score: 68 },
    lifeExpectancy: { label: "Life Expectancy", value: "75.0 yrs", score: 69 },
    uhcIndex: { label: "Health Coverage Rate", value: 93, score: 93 },
    educationIndex: { label: "Education Index", value: 0.8, score: 80 },
    epi: { label: "Environmental Policy Index", value: 26, score: 26 },
    internetPenetration: { label: "Broadband Access", value: "76%", score: 76 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 19.9,
      score: 14,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 680,
      score: 18,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 5.9,
      unit: "/10",
      score: 59,
    },
    spi: { label: "Social Progress Index", value: 68, score: 68 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 50,
      score: 50,
    },
  },
  ut: {
    hdi: { label: "Human Development Index", value: 0.916, score: 92 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 43.6,
      score: 33,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "9.0%",
      score: 64,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.9%", score: 85 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$65,000", score: 75 },
    lifeExpectancy: { label: "Life Expectancy", value: "81.0 yrs", score: 91 },
    uhcIndex: { label: "Health Coverage Rate", value: 90, score: 90 },
    educationIndex: { label: "Education Index", value: 0.9, score: 90 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.1%", score: 70 },
    epi: { label: "Environmental Policy Index", value: 48, score: 48 },
    internetPenetration: { label: "Broadband Access", value: "86%", score: 86 },
    globalInnovationIndex: { label: "Innovation Index", value: 77, score: 77 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 2.3,
      score: 74,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 340,
      score: 44,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.7,
      unit: "/10",
      score: 67,
    },
    spi: { label: "Social Progress Index", value: 82, score: 82 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 65,
      score: 65,
    },
  },
  az: {
    hdi: { label: "Human Development Index", value: 0.882, score: 88 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.4,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.6%",
      score: 46,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.1%", score: 72 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$57,000", score: 69 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.0 yrs", score: 77 },
    uhcIndex: { label: "Health Coverage Rate", value: 89, score: 89 },
    educationIndex: { label: "Education Index", value: 0.83, score: 83 },
    epi: { label: "Environmental Policy Index", value: 38, score: 38 },
    internetPenetration: { label: "Broadband Access", value: "83%", score: 83 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.1,
      score: 41,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 572,
      score: 23,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.3,
      unit: "/10",
      score: 63,
    },
    spi: { label: "Social Progress Index", value: 76, score: 76 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 57,
      score: 57,
    },
  },
  nv: {
    hdi: { label: "Human Development Index", value: 0.876, score: 88 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.4,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "13.2%",
      score: 48,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "5.5%", score: 60 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$58,000", score: 70 },
    lifeExpectancy: { label: "Life Expectancy", value: "76.0 yrs", score: 71 },
    uhcIndex: { label: "Health Coverage Rate", value: 87, score: 87 },
    educationIndex: { label: "Education Index", value: 0.79, score: 79 },
    epi: { label: "Environmental Policy Index", value: 42, score: 42 },
    internetPenetration: { label: "Broadband Access", value: "83%", score: 83 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 8.3,
      score: 36,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 496,
      score: 30,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.0,
      unit: "/10",
      score: 60,
    },
    spi: { label: "Social Progress Index", value: 75, score: 75 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 52,
      score: 52,
    },
  },
  or: {
    hdi: { label: "Human Development Index", value: 0.906, score: 91 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.5,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "12.4%",
      score: 51,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.4%", score: 68 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$71,000", score: 81 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.9 yrs", score: 86 },
    uhcIndex: { label: "Health Coverage Rate", value: 96, score: 96 },
    educationIndex: { label: "Education Index", value: 0.89, score: 89 },
    rdIntensity: { label: "R&D Spending (% GDP)", value: "2.2%", score: 72 },
    epi: { label: "Environmental Policy Index", value: 70, score: 70 },
    internetPenetration: { label: "Broadband Access", value: "85%", score: 85 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 4.0,
      score: 59,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 416,
      score: 37,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 82, score: 82 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 68,
      score: 68,
    },
  },
  wi: {
    hdi: { label: "Human Development Index", value: 0.898, score: 90 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.4,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.4%",
      score: 58,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.2%", score: 81 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$63,000", score: 74 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.2 yrs", score: 81 },
    uhcIndex: { label: "Health Coverage Rate", value: 95, score: 95 },
    educationIndex: { label: "Education Index", value: 0.9, score: 90 },
    epi: { label: "Environmental Policy Index", value: 54, score: 54 },
    internetPenetration: { label: "Broadband Access", value: "84%", score: 84 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 5.4,
      score: 47,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 399,
      score: 38,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.5,
      unit: "/10",
      score: 65,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 66,
      score: 66,
    },
  },
  tn: {
    hdi: { label: "Human Development Index", value: 0.855, score: 86 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.1,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "14.3%",
      score: 44,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.7%", score: 76 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$58,000", score: 70 },
    lifeExpectancy: { label: "Life Expectancy", value: "75.8 yrs", score: 71 },
    uhcIndex: { label: "Health Coverage Rate", value: 90, score: 90 },
    educationIndex: { label: "Education Index", value: 0.82, score: 82 },
    epi: { label: "Environmental Policy Index", value: 34, score: 34 },
    internetPenetration: { label: "Broadband Access", value: "78%", score: 78 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 10.5,
      score: 29,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 546,
      score: 24,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.1,
      unit: "/10",
      score: 61,
    },
    spi: { label: "Social Progress Index", value: 73, score: 73 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 53,
      score: 53,
    },
  },
  mo: {
    hdi: { label: "Human Development Index", value: 0.873, score: 87 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.2,
      score: 33,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "12.7%",
      score: 50,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.6%", score: 77 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$57,000", score: 69 },
    lifeExpectancy: { label: "Life Expectancy", value: "76.9 yrs", score: 74 },
    uhcIndex: { label: "Health Coverage Rate", value: 93, score: 93 },
    educationIndex: { label: "Education Index", value: 0.85, score: 85 },
    epi: { label: "Environmental Policy Index", value: 36, score: 36 },
    internetPenetration: { label: "Broadband Access", value: "79%", score: 79 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 11.9,
      score: 24,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 575,
      score: 23,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.1,
      unit: "/10",
      score: 61,
    },
    spi: { label: "Social Progress Index", value: 75, score: 75 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 56,
      score: 56,
    },
  },
  in: {
    hdi: { label: "Human Development Index", value: 0.878, score: 88 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.4,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "12.9%",
      score: 49,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.8%", score: 75 },
    gdpPerCapitaPPP: { label: "GDP per Capita", value: "$58,000", score: 70 },
    lifeExpectancy: { label: "Life Expectancy", value: "76.6 yrs", score: 73 },
    uhcIndex: { label: "Health Coverage Rate", value: 91, score: 91 },
    educationIndex: { label: "Education Index", value: 0.84, score: 84 },
    epi: { label: "Environmental Policy Index", value: 42, score: 42 },
    internetPenetration: { label: "Broadband Access", value: "81%", score: 81 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.9,
      score: 38,
      invertScale: true,
    },
    prisonPopulationRate: {
      label: "Incarceration Rate (per 100k)",
      value: 547,
      score: 24,
      invertScale: true,
    },
    happinessScore: {
      label: "Well-being Index",
      value: 6.2,
      unit: "/10",
      score: 62,
    },
    spi: { label: "Social Progress Index", value: 77, score: 77 },
    civicParticipationIndex: {
      label: "Civic Engagement",
      value: 57,
      score: 57,
    },
  },
  // Default metrics for remaining states (abbreviated)
  ak: {
    hdi: { label: "HDI", value: 0.903, score: 90 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.2 yrs", score: 77 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 41.2,
      score: 36,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.7%",
      score: 54,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "5.2%", score: 62 },
    epi: { label: "Environmental Policy Index", value: 58, score: 58 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.5,
      unit: "/10",
      score: 65,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    internetPenetration: { label: "Broadband Access", value: "72%", score: 72 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.4,
      score: 40,
      invertScale: true,
    },
  },
  hi: {
    hdi: { label: "HDI", value: 0.94, score: 94 },
    lifeExpectancy: { label: "Life Expectancy", value: "82.4 yrs", score: 95 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.8,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "9.3%",
      score: 63,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.9%", score: 85 },
    epi: { label: "Environmental Policy Index", value: 78, score: 78 },
    happinessScore: {
      label: "Well-being Index",
      value: 7.0,
      unit: "/10",
      score: 70,
    },
    spi: { label: "Social Progress Index", value: 86, score: 86 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 2.0,
      score: 77,
      invertScale: true,
    },
  },
  me: {
    hdi: { label: "HDI", value: 0.907, score: 91 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.7 yrs", score: 79 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 42.2,
      score: 35,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.9%",
      score: 57,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.1%", score: 82 },
    epi: { label: "Environmental Policy Index", value: 70, score: 70 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.7,
      unit: "/10",
      score: 67,
    },
    spi: { label: "Social Progress Index", value: 82, score: 82 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 1.9,
      score: 78,
      invertScale: true,
    },
  },
  nh: {
    hdi: { label: "HDI", value: 0.944, score: 94 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.8 yrs", score: 85 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 39.8,
      score: 40,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "7.8%",
      score: 70,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.4%", score: 90 },
    epi: { label: "Environmental Policy Index", value: 70, score: 70 },
    happinessScore: {
      label: "Well-being Index",
      value: 7.1,
      unit: "/10",
      score: 71,
    },
    spi: { label: "Social Progress Index", value: 87, score: 87 },
    internetPenetration: { label: "Broadband Access", value: "91%", score: 91 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 1.5,
      score: 82,
      invertScale: true,
    },
  },
  vt: {
    hdi: { label: "HDI", value: 0.93, score: 93 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.4 yrs", score: 83 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 39.9,
      score: 40,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.3%",
      score: 58,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.8%", score: 86 },
    epi: { label: "Environmental Policy Index", value: 78, score: 78 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.9,
      unit: "/10",
      score: 69,
    },
    spi: { label: "Social Progress Index", value: 85, score: 85 },
    internetPenetration: { label: "Broadband Access", value: "80%", score: 80 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 2.4,
      score: 73,
      invertScale: true,
    },
  },
  ri: {
    hdi: { label: "HDI", value: 0.913, score: 91 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.0 yrs", score: 80 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.1,
      score: 33,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.8%",
      score: 54,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.0%", score: 74 },
    epi: { label: "Environmental Policy Index", value: 70, score: 70 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.4,
      unit: "/10",
      score: 64,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    internetPenetration: { label: "Broadband Access", value: "88%", score: 88 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.9,
      score: 60,
      invertScale: true,
    },
  },
  de: {
    hdi: { label: "HDI", value: 0.908, score: 91 },
    lifeExpectancy: { label: "Life Expectancy", value: "77.7 yrs", score: 75 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.8,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "12.0%",
      score: 53,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.2%", score: 70 },
    epi: { label: "Environmental Policy Index", value: 60, score: 60 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.3,
      unit: "/10",
      score: 63,
    },
    spi: { label: "Social Progress Index", value: 79, score: 79 },
    internetPenetration: { label: "Broadband Access", value: "86%", score: 86 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 8.0,
      score: 37,
      invertScale: true,
    },
  },
  sc: {
    hdi: { label: "HDI", value: 0.86, score: 86 },
    lifeExpectancy: { label: "Life Expectancy", value: "76.3 yrs", score: 72 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.8,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "15.3%",
      score: 41,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.3%", score: 80 },
    epi: { label: "Environmental Policy Index", value: 35, score: 35 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.1,
      unit: "/10",
      score: 61,
    },
    spi: { label: "Social Progress Index", value: 72, score: 72 },
    internetPenetration: { label: "Broadband Access", value: "78%", score: 78 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 11.3,
      score: 27,
      invertScale: true,
    },
  },
  ky: {
    hdi: { label: "HDI", value: 0.847, score: 85 },
    lifeExpectancy: { label: "Life Expectancy", value: "74.8 yrs", score: 68 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.0,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "16.5%",
      score: 37,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.0%", score: 74 },
    epi: { label: "Environmental Policy Index", value: 30, score: 30 },
    happinessScore: {
      label: "Well-being Index",
      value: 5.9,
      unit: "/10",
      score: 59,
    },
    spi: { label: "Social Progress Index", value: 71, score: 71 },
    internetPenetration: { label: "Broadband Access", value: "76%", score: 76 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 8.5,
      score: 35,
      invertScale: true,
    },
  },
  wv: {
    hdi: { label: "HDI", value: 0.836, score: 84 },
    lifeExpectancy: { label: "Life Expectancy", value: "74.0 yrs", score: 64 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.8,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "17.1%",
      score: 35,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.2%", score: 70 },
    epi: { label: "Environmental Policy Index", value: 24, score: 24 },
    happinessScore: {
      label: "Well-being Index",
      value: 5.7,
      unit: "/10",
      score: 57,
    },
    spi: { label: "Social Progress Index", value: 68, score: 68 },
    internetPenetration: { label: "Broadband Access", value: "69%", score: 69 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 7.8,
      score: 38,
      invertScale: true,
    },
  },
  ar: {
    hdi: { label: "HDI", value: 0.84, score: 84 },
    lifeExpectancy: { label: "Life Expectancy", value: "75.0 yrs", score: 69 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 45.6,
      score: 31,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "17.0%",
      score: 35,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.4%", score: 79 },
    epi: { label: "Environmental Policy Index", value: 28, score: 28 },
    happinessScore: {
      label: "Well-being Index",
      value: 5.9,
      unit: "/10",
      score: 59,
    },
    spi: { label: "Social Progress Index", value: 69, score: 69 },
    internetPenetration: { label: "Broadband Access", value: "73%", score: 73 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 10.8,
      score: 28,
      invertScale: true,
    },
  },
  ok: {
    hdi: { label: "HDI", value: 0.855, score: 86 },
    lifeExpectancy: { label: "Life Expectancy", value: "75.3 yrs", score: 70 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.0,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "15.6%",
      score: 40,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.5%", score: 78 },
    epi: { label: "Environmental Policy Index", value: 32, score: 32 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.0,
      unit: "/10",
      score: 60,
    },
    spi: { label: "Social Progress Index", value: 72, score: 72 },
    internetPenetration: { label: "Broadband Access", value: "78%", score: 78 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 9.7,
      score: 31,
      invertScale: true,
    },
  },
  ks: {
    hdi: { label: "HDI", value: 0.884, score: 88 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.2 yrs", score: 77 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.5,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.6%",
      score: 55,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.1%", score: 82 },
    epi: { label: "Environmental Policy Index", value: 40, score: 40 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.3,
      unit: "/10",
      score: 63,
    },
    spi: { label: "Social Progress Index", value: 78, score: 78 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 5.1,
      score: 50,
      invertScale: true,
    },
  },
  ne: {
    hdi: { label: "HDI", value: 0.897, score: 90 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.4 yrs", score: 83 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 42.8,
      score: 34,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.6%",
      score: 58,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.5%", score: 90 },
    epi: { label: "Environmental Policy Index", value: 50, score: 50 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 81, score: 81 },
    internetPenetration: { label: "Broadband Access", value: "84%", score: 84 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.5,
      score: 64,
      invertScale: true,
    },
  },
  ia: {
    hdi: { label: "HDI", value: 0.899, score: 90 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.3 yrs", score: 83 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 42.9,
      score: 34,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.0%",
      score: 57,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.0%", score: 84 },
    epi: { label: "Environmental Policy Index", value: 50, score: 50 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 81, score: 81 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 2.7,
      score: 70,
      invertScale: true,
    },
  },
  mn2: { hdi: { label: "HDI", value: 0.928, score: 93 } },
  sd: {
    hdi: { label: "HDI", value: 0.889, score: 89 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.4 yrs", score: 83 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 44.4,
      score: 32,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "11.5%",
      score: 55,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.2%", score: 91 },
    epi: { label: "Environmental Policy Index", value: 48, score: 48 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    internetPenetration: { label: "Broadband Access", value: "80%", score: 80 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.0,
      score: 68,
      invertScale: true,
    },
  },
  nd: {
    hdi: { label: "HDI", value: 0.906, score: 91 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.9 yrs", score: 86 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 41.0,
      score: 37,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.3%",
      score: 58,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "2.2%", score: 91 },
    epi: { label: "Environmental Policy Index", value: 48, score: 48 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.7,
      unit: "/10",
      score: 67,
    },
    spi: { label: "Social Progress Index", value: 82, score: 82 },
    internetPenetration: { label: "Broadband Access", value: "82%", score: 82 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 2.4,
      score: 73,
      invertScale: true,
    },
  },
  mt: {
    hdi: { label: "HDI", value: 0.898, score: 90 },
    lifeExpectancy: { label: "Life Expectancy", value: "78.0 yrs", score: 77 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 43.4,
      score: 33,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "12.9%",
      score: 49,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.0%", score: 84 },
    epi: { label: "Environmental Policy Index", value: 62, score: 62 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    internetPenetration: { label: "Broadband Access", value: "74%", score: 74 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 4.3,
      score: 56,
      invertScale: true,
    },
  },
  wy: {
    hdi: { label: "HDI", value: 0.897, score: 90 },
    lifeExpectancy: { label: "Life Expectancy", value: "77.6 yrs", score: 75 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 42.4,
      score: 35,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "10.1%",
      score: 59,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.6%", score: 77 },
    epi: { label: "Environmental Policy Index", value: 44, score: 44 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.5,
      unit: "/10",
      score: 65,
    },
    spi: { label: "Social Progress Index", value: 79, score: 79 },
    internetPenetration: { label: "Broadband Access", value: "77%", score: 77 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 4.5,
      score: 55,
      invertScale: true,
    },
  },
  id: {
    hdi: { label: "HDI", value: 0.887, score: 89 },
    lifeExpectancy: { label: "Life Expectancy", value: "79.2 yrs", score: 81 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 41.2,
      score: 36,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "12.5%",
      score: 50,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "3.1%", score: 82 },
    epi: { label: "Environmental Policy Index", value: 56, score: 56 },
    happinessScore: {
      label: "Well-being Index",
      value: 6.6,
      unit: "/10",
      score: 66,
    },
    spi: { label: "Social Progress Index", value: 80, score: 80 },
    internetPenetration: { label: "Broadband Access", value: "79%", score: 79 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 3.4,
      score: 64,
      invertScale: true,
    },
  },
  nm: {
    hdi: { label: "HDI", value: 0.845, score: 85 },
    lifeExpectancy: { label: "Life Expectancy", value: "76.5 yrs", score: 72 },
    giniCoeff: {
      label: "Gini Coefficient",
      value: 46.3,
      score: 30,
      invertScale: true,
    },
    povertyRate: {
      label: "Poverty Rate",
      value: "18.2%",
      score: 32,
      invertScale: true,
    },
    unemploymentRate: { label: "Unemployment Rate", value: "4.6%", score: 66 },
    epi: { label: "Environmental Policy Index", value: 52, score: 52 },
    happinessScore: {
      label: "Well-being Index",
      value: 5.9,
      unit: "/10",
      score: 59,
    },
    spi: { label: "Social Progress Index", value: 68, score: 68 },
    internetPenetration: { label: "Broadband Access", value: "74%", score: 74 },
    homicideRate: {
      label: "Homicide Rate (per 100k)",
      value: 11.2,
      score: 27,
      invertScale: true,
    },
  },
};

// -- Category labels for rendering -------------------------------------------
export const METRIC_CATEGORIES = [
  {
    id: "humandev",
    label: "Human Development & QoL",
    icon: "👥",
    keys: [
      "hdi",
      "ihdi",
      "gii",
      "gdi",
      "mpi",
      "spi",
      "pqli",
      "betterLife",
      "happinessScore",
    ],
  },
  {
    id: "economic",
    label: "Economic",
    icon: "💹",
    keys: [
      "gdpPerCapitaPPP",
      "giniCoeff",
      "palmaRatio",
      "povertyRate",
      "unemploymentRate",
      "laborForceParticipation",
      "inflationRate",
      "humanCapitalIndex",
      "economicComplexityIndex",
      "inclusiveDevelopmentIndex",
      "economicFreedomIndex",
    ],
  },
  {
    id: "political",
    label: "Political & Governance",
    icon: "🏛️",
    keys: [
      "democracyIndex",
      "freedomInWorld",
      "wgi",
      "corruptionPerceptionsIndex",
      "ruleOfLawIndex",
      "governmentEffectiveness",
      "politicalStabilityIndex",
      "voiceAccountability",
      "regulatoryQuality",
      "civilLibertiesIndex",
    ],
  },
  {
    id: "social",
    label: "Social Cohesion & Inequality",
    icon: "🤝",
    keys: [
      "socialCohesionIndex",
      "socialCapitalIndex",
      "interpersonalTrust",
      "incomeInequalityIndex",
      "wealthInequalityIndex",
      "socialExclusionIndex",
      "discriminationIndex",
      "mobilityIndex",
      "intergenerationalMobility",
    ],
  },
  {
    id: "peace",
    label: "Peace, Conflict & Security",
    icon: "☮️",
    keys: [
      "globalPeaceIndex",
      "fragileStatesIndex",
      "globalTerrorismIndex",
      "positivePeaceIndex",
      "conflictIntensity",
      "crimeRate",
      "homicideRate",
      "politicalViolence",
      "militaryExpenditurePct",
    ],
  },
  {
    id: "justice",
    label: "Justice & Rights",
    icon: "⚖️",
    keys: [
      "ruleOfLawScore",
      "humanRightsIndex",
      "civilLibertiesScore",
      "politicalRightsScore",
      "accessToJustice",
      "judicialIndependence",
      "prisonPopulationRate",
      "pretrialDetentionRate",
      "legalEqualityIndex",
    ],
  },
  {
    id: "health",
    label: "Health",
    icon: "🏥",
    keys: [
      "lifeExpectancy",
      "hale",
      "infantMortality",
      "maternalMortality",
      "morbidityCoverage",
      "healthcareAccessIndex",
      "uhcIndex",
      "nutritionIndex",
      "mentalHealthIndex",
    ],
  },
  {
    id: "education",
    label: "Education & Knowledge",
    icon: "📚",
    keys: [
      "educationIndex",
      "humanCapitalScore",
      "learningAdjustedSchooling",
      "literacyRate",
      "schoolEnrollment",
      "pisaScore",
      "rdIntensity",
      "knowledgeEconomyIndex",
      "digitalLiteracy",
    ],
  },
  {
    id: "environment",
    label: "Environment & Sustainability",
    icon: "🌿",
    keys: [
      "epi",
      "ecologicalFootprint",
      "ecologicalOvershoot",
      "climateChangePerformance",
      "sustainableDevelopmentIndex",
      "greenGrowthIndex",
      "airQualityIndex",
      "waterStressIndex",
      "biodiversityIndex",
    ],
  },
  {
    id: "infra",
    label: "Infrastructure & Technology",
    icon: "🖥️",
    keys: [
      "digitalDevelopmentIndex",
      "networkReadinessIndex",
      "ictDevelopmentIndex",
      "internetPenetration",
      "digitalGovernmentIndex",
      "infrastructureQuality",
      "energySecurityIndex",
      "logisticsPerformanceIndex",
    ],
  },
  {
    id: "civic",
    label: "Civic Participation",
    icon: "🗳️",
    keys: [
      "civicParticipationIndex",
      "politicalParticipation",
      "civilSocietyStrength",
    ],
  },
  {
    id: "media",
    label: "Information & Media",
    icon: "📰",
    keys: [
      "pressFreedomIndex",
      "mediaPluralism",
      "internetFreedom",
      "disinformationIndex",
      "informationIntegrity",
      "mediaLiteracy",
      "governmentTransparency",
      "openDataIndex",
    ],
  },
] as const;

export type MetricCategoryId = (typeof METRIC_CATEGORIES)[number]["id"];
