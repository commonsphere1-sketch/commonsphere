import React, { useState } from "react";
import {
  Globe,
  MagnifyingGlass,
  MapPin,
  Shield,
  Users,
  Sword,
  Airplane,
  Anchor,
  Buildings,
  Flag,
  CurrencyDollar,
  ArrowRight,
  MapTrifold,
  Scroll,
  ListBullets,
  ArrowLeft,
  X,
  BookOpen,
  Scales,
  Star,
  NotePencil,
} from "@phosphor-icons/react";
import { useNotes } from "../contexts/NotesContext";
import { getMilitary, fmtPers, type MilitaryStats } from "../data/militaryData";
import { BIOSPHERE_PRESETS, BIOSPHERE_DEFAULT } from "../data/biosphereData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  type Country,
  type Industry,
  type EnergyStats,
} from "../data/countriesData";
import { useLiveData } from "../hooks/useLiveData";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { SourceLink } from "../components/SourceLink";

// ── Source citation constants ────────────────────────────────────────────
// ── Extended per-country data ────────────────────────────────────────────────
interface FuturesMarket {
  /** Stock index name e.g. "S&P 500" */
  stockIndex: string;
  /** Index value or label */
  indexValue: string;
  /** YTD change % */
  indexChangeYTD: number;
  /** 10-year bond yield % */
  bondYield10Y: number;
  /** Currency vs USD e.g. "EUR/USD 1.08" */
  fxRate: string;
  /** Key commodity and price e.g. "WTI Crude $78/bbl" */
  keyCommodity: string;
  /** Market cap of domestic stock exchange (trillion USD) */
  marketCapT?: number;
}

interface ServicesSector {
  /** % of GDP from services */
  gdpPct: number;
  /** % of workforce in services */
  workforcePct?: number;
  /** Top service sub-sectors */
  subSectors: { name: string; pct: number; color: string }[];
}

interface CountryExtended {
  /** Gini coefficient 0-100 */
  gini?: number;
  /** Debt as % of GDP */
  debtPct?: number;
  /** Fiscal balance as % of GDP (negative = deficit) */
  fiscalBalancePct?: number;
  /** Urban population as % */
  urbanPct?: number;
  /** Birth rate per 1,000 */
  birthRate?: number;
  /** Death rate per 1,000 */
  deathRate?: number;
  /** Credit rating label e.g. "AA+" */
  creditRating?: string;
  /** Rating agency */
  creditAgency?: string;
  /** Ease of doing business rank (World Bank) */
  easeOfBusinessRank?: number;
  /** Corruption Perception Index score 0-100 (higher = cleaner) */
  cpiScore?: number;
  /** Top 3 export partners */
  exportPartners?: string[];
  /** Top 3 import partners */
  importPartners?: string[];
  /** Internet penetration % */
  internetPct?: number;
  /** Median age */
  medianAge?: number;
  /** Economic structure description */
  economicStructure?: string;
  /** Futures & financial markets data */
  futures?: FuturesMarket;
  /** Services sector detail */
  services?: ServicesSector;
}

const COUNTRY_EXTENDED: Record<string, CountryExtended> = {
  us: {
    gini: 39.8,
    debtPct: 122,
    fiscalBalancePct: -6.3,
    urbanPct: 83,
    birthRate: 11.0,
    deathRate: 10.4,
    creditRating: "AA+",
    creditAgency: "S&P",
    easeOfBusinessRank: 55,
    cpiScore: 69,
    exportPartners: ["Canada", "Mexico", "China"],
    importPartners: ["China", "Mexico", "Canada"],
    internetPct: 92,
    medianAge: 38.9,
    economicStructure:
      "The world&#39;s largest economy by nominal GDP runs a consumption-driven mixed market. Private consumption (~70% of GDP) anchors growth. The services sector dominates at ~80% of GDP — led by healthcare, finance, technology, and professional services. Manufacturing (~11%) remains vital in aerospace, defense, and advanced electronics. The US dollar serves as the global reserve currency, giving the federal government unique borrowing capacity. Key tensions: widening fiscal deficit, deindustrialization pressures, and technology platform concentration.",
    futures: {
      stockIndex: "S&P 500",
      indexValue: "5,320",
      indexChangeYTD: 8.4,
      bondYield10Y: 4.42,
      fxRate: "DXY 104.2",
      keyCommodity: "WTI Crude $77/bbl",
      marketCapT: 46.2,
    },
    services: {
      gdpPct: 80,
      workforcePct: 79,
      subSectors: [
        { name: "Healthcare & Social", pct: 17, color: "hsl(150,60%,45%)" },
        { name: "Finance & Insurance", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Technology & IT", pct: 13, color: "hsl(270,60%,60%)" },
        { name: "Retail Trade", pct: 12, color: "hsl(45,90%,55%)" },
        { name: "Real Estate", pct: 9, color: "hsl(330,65%,55%)" },
        { name: "Government", pct: 8, color: "hsl(0,70%,50%)" },
        { name: "Education", pct: 7, color: "hsl(90,60%,40%)" },
      ],
    },
  },
  cn: {
    gini: 38.2,
    debtPct: 83,
    fiscalBalancePct: -7.4,
    urbanPct: 65,
    birthRate: 10.1,
    deathRate: 7.4,
    creditRating: "A+",
    creditAgency: "S&P",
    easeOfBusinessRank: 31,
    cpiScore: 42,
    exportPartners: ["USA", "EU", "Japan"],
    importPartners: ["South Korea", "Japan", "USA"],
    internetPct: 74,
    medianAge: 39.0,
    economicStructure:
      "China operates a state-directed mixed economy (\'socialism with Chinese characteristics\') where the Party shapes investment allocation, currency management, and strategic sectors. Manufacturing (~27% of GDP) remains the global workshop — electronics, steel, chemicals, textiles. The services sector is growing (~54%) but faces structural limits on financial liberalization. Real estate accounted for ~25% of economic activity before the 2021 property crisis. China is the world&#39;s largest exporter and holds ~$3.1T in foreign exchange reserves. State-owned enterprises control commanding heights while private firms drive innovation.",
    futures: {
      stockIndex: "CSI 300",
      indexValue: "3,580",
      indexChangeYTD: -2.1,
      bondYield10Y: 2.29,
      fxRate: "USD/CNY 7.24",
      keyCommodity: "Iron Ore $108/t",
      marketCapT: 8.4,
    },
    services: {
      gdpPct: 54,
      workforcePct: 48,
      subSectors: [
        { name: "Wholesale & Retail", pct: 14, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Real Estate", pct: 10, color: "hsl(330,65%,55%)" },
        { name: "Transport & Logistics", pct: 9, color: "hsl(18,80%,55%)" },
        { name: "IT & Telecoms", pct: 8, color: "hsl(270,60%,60%)" },
        { name: "Government", pct: 7, color: "hsl(0,70%,50%)" },
      ],
    },
  },
  de: {
    gini: 31.7,
    debtPct: 64,
    fiscalBalancePct: -2.5,
    urbanPct: 77,
    birthRate: 9.7,
    deathRate: 11.3,
    creditRating: "AAA",
    creditAgency: "S&P",
    easeOfBusinessRank: 22,
    cpiScore: 78,
    exportPartners: ["USA", "France", "Netherlands"],
    importPartners: ["China", "Netherlands", "USA"],
    internetPct: 94,
    medianAge: 47.9,
    economicStructure:
      "Germany is Europe&#39;s largest economy and the world leader in export-oriented industrial production — \'Mittelstand\' (medium-sized, family-owned specialists) form the backbone of its engineering, chemical, and automotive sectors. The social market economy (Soziale Marktwirtschaft) balances private enterprise with strong labor co-determination (Mitbestimmung) and a comprehensive welfare state. Key challenges: ageing population, energy transition costs post-Energiewende, automotive sector electrification disruption, and declining competitiveness amid high energy prices.",
    futures: {
      stockIndex: "DAX 40",
      indexValue: "18,420",
      indexChangeYTD: 6.2,
      bondYield10Y: 2.51,
      fxRate: "EUR/USD 1.08",
      keyCommodity: "German Power €72/MWh",
      marketCapT: 2.3,
    },
    services: {
      gdpPct: 69,
      workforcePct: 71,
      subSectors: [
        { name: "Finance & Insurance", pct: 15, color: "hsl(200,85%,55%)" },
        { name: "Healthcare", pct: 13, color: "hsl(150,60%,45%)" },
        { name: "Retail & Wholesale", pct: 12, color: "hsl(45,90%,55%)" },
        { name: "Transport & Logistics", pct: 10, color: "hsl(18,80%,55%)" },
        { name: "Government & Education", pct: 9, color: "hsl(0,70%,50%)" },
        { name: "IT & Consulting", pct: 8, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  gb: {
    gini: 35.1,
    debtPct: 100,
    fiscalBalancePct: -4.4,
    urbanPct: 84,
    birthRate: 10.1,
    deathRate: 10.6,
    creditRating: "AA",
    creditAgency: "S&P",
    easeOfBusinessRank: 8,
    cpiScore: 71,
    exportPartners: ["USA", "Germany", "France"],
    importPartners: ["China", "Germany", "USA"],
    internetPct: 96,
    medianAge: 40.7,
    economicStructure:
      "The UK has one of the world&#39;s most service-dominant economies — financial services alone contribute ~12% of GDP and London is a global banking hub for forex, derivatives, and asset management. Post-Brexit, the UK has lost passporting rights to EU financial markets, driving some activity to Amsterdam and Dublin. Manufacturing has declined structurally to ~9% of GDP. The NHS (~10% of GDP) is the largest single-employer in Europe. Key tensions: productivity gap vs. Germany/France, housing supply crisis, persistent current account deficit, and post-Brexit trade friction.",
    futures: {
      stockIndex: "FTSE 100",
      indexValue: "8,140",
      indexChangeYTD: 3.8,
      bondYield10Y: 4.18,
      fxRate: "GBP/USD 1.27",
      keyCommodity: "Brent Crude $81/bbl",
      marketCapT: 3.8,
    },
    services: {
      gdpPct: 79,
      workforcePct: 82,
      subSectors: [
        { name: "Finance & Insurance", pct: 18, color: "hsl(200,85%,55%)" },
        { name: "Healthcare (NHS)", pct: 13, color: "hsl(150,60%,45%)" },
        { name: "Retail & Wholesale", pct: 12, color: "hsl(45,90%,55%)" },
        { name: "Professional Services", pct: 10, color: "hsl(270,60%,60%)" },
        { name: "Education", pct: 8, color: "hsl(90,60%,40%)" },
        { name: "IT & Telecoms", pct: 7, color: "hsl(18,80%,55%)" },
      ],
    },
  },
  fr: {
    gini: 32.4,
    debtPct: 111,
    fiscalBalancePct: -5.5,
    urbanPct: 81,
    birthRate: 10.9,
    deathRate: 9.7,
    creditRating: "AA-",
    creditAgency: "S&P",
    easeOfBusinessRank: 32,
    cpiScore: 71,
    exportPartners: ["Germany", "USA", "Italy"],
    importPartners: ["Germany", "China", "Italy"],
    internetPct: 93,
    medianAge: 42.3,
    economicStructure:
      "France blends a large public sector (~57% of GDP in government expenditure) with strong luxury goods, aerospace-defense, and nuclear energy industries. The state retains strategic stakes in EDF, Air France, Renault, and others. Tourism (~8% GDP) is the world&#39;s most visited country. The CAC 40 includes global champions: LVMH, TotalEnergies, Sanofi, Airbus. Key structural challenges: rigid labour market, high structural unemployment, public sector wage bill, and energy transition costs.",
    futures: {
      stockIndex: "CAC 40",
      indexValue: "7,980",
      indexChangeYTD: 4.1,
      bondYield10Y: 3.12,
      fxRate: "EUR/USD 1.08",
      keyCommodity: "Brent Crude $81/bbl",
      marketCapT: 3.1,
    },
    services: {
      gdpPct: 78,
      workforcePct: 77,
      subSectors: [
        { name: "Tourism & Hospitality", pct: 16, color: "hsl(150,60%,45%)" },
        { name: "Finance & Insurance", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Healthcare", pct: 12, color: "hsl(90,60%,40%)" },
        { name: "Retail & Wholesale", pct: 11, color: "hsl(45,90%,55%)" },
        { name: "Government & Education", pct: 10, color: "hsl(0,70%,50%)" },
        { name: "Luxury & Fashion", pct: 8, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  jp: {
    gini: 32.9,
    debtPct: 250,
    fiscalBalancePct: -3.9,
    urbanPct: 92,
    birthRate: 7.3,
    deathRate: 12.8,
    creditRating: "A+",
    creditAgency: "S&P",
    easeOfBusinessRank: 29,
    cpiScore: 73,
    exportPartners: ["USA", "China", "South Korea"],
    importPartners: ["China", "USA", "Australia"],
    internetPct: 93,
    medianAge: 48.7,
    economicStructure:
      "Japan is a highly developed, capital-intensive export economy anchored by manufacturing keiretsu (cross-shareholding conglomerates): Toyota, Sony, Mitsubishi, and Hitachi. Services (~70% of GDP) are driven by domestic consumption and finance. Despite the world&#39;s highest debt-to-GDP ratio (~250%), Japan finances it domestically — the Bank of Japan holds ~50% of JGBs. Post-Abenomics, the BOJ maintained near-zero rates until 2024 when it began normalizing. Structural challenges: world&#39;s fastest-ageing population, deflationary mindset, and low immigration constraining labour supply.",
    futures: {
      stockIndex: "Nikkei 225",
      indexValue: "38,450",
      indexChangeYTD: 12.3,
      bondYield10Y: 1.08,
      fxRate: "USD/JPY 154.2",
      keyCommodity: "Rubber ¥240/kg",
      marketCapT: 5.6,
    },
    services: {
      gdpPct: 70,
      workforcePct: 71,
      subSectors: [
        { name: "Retail & Wholesale", pct: 14, color: "hsl(45,90%,55%)" },
        { name: "Finance & Insurance", pct: 13, color: "hsl(200,85%,55%)" },
        {
          name: "Healthcare & Elderly Care",
          pct: 12,
          color: "hsl(150,60%,45%)",
        },
        { name: "IT & Telecoms", pct: 10, color: "hsl(270,60%,60%)" },
        { name: "Transport & Logistics", pct: 9, color: "hsl(18,80%,55%)" },
        { name: "Tourism", pct: 6, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  in: {
    gini: 35.7,
    debtPct: 83,
    fiscalBalancePct: -5.8,
    urbanPct: 36,
    birthRate: 17.7,
    deathRate: 7.3,
    creditRating: "BBB-",
    creditAgency: "S&P",
    easeOfBusinessRank: 63,
    cpiScore: 39,
    exportPartners: ["USA", "UAE", "Netherlands"],
    importPartners: ["China", "UAE", "USA"],
    internetPct: 52,
    medianAge: 28.7,
    economicStructure:
      "India&#39;s dual economy features a world-class IT services sector alongside hundreds of millions in subsistence agriculture. Services (~55% of GDP) are led by IT/BPO, finance, and telecoms. Agriculture (~17% GDP) employs ~44% of the workforce — a structural distortion. India is the world&#39;s largest democracy and the fastest-growing major economy. The government&#39;s \'Make in India\' and PLI (production-linked incentive) programs are driving manufacturing expansion, particularly in semiconductors, smartphones, and electric vehicles. Remittances (~$120B/year) are the world&#39;s largest.",
    futures: {
      stockIndex: "SENSEX",
      indexValue: "73,800",
      indexChangeYTD: 5.6,
      bondYield10Y: 7.08,
      fxRate: "USD/INR 83.4",
      keyCommodity: "Cotton ₹58,000/bale",
      marketCapT: 4.4,
    },
    services: {
      gdpPct: 55,
      workforcePct: 32,
      subSectors: [
        { name: "IT & BPO Services", pct: 20, color: "hsl(270,60%,60%)" },
        { name: "Finance & Banking", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Trade & Retail", pct: 12, color: "hsl(45,90%,55%)" },
        { name: "Transport", pct: 9, color: "hsl(18,80%,55%)" },
        { name: "Healthcare", pct: 8, color: "hsl(150,60%,45%)" },
        { name: "Tourism", pct: 5, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  br: {
    gini: 52.9,
    debtPct: 89,
    fiscalBalancePct: -7.2,
    urbanPct: 88,
    birthRate: 14.7,
    deathRate: 6.9,
    creditRating: "BB",
    creditAgency: "S&P",
    easeOfBusinessRank: 124,
    cpiScore: 36,
    exportPartners: ["China", "USA", "Argentina"],
    importPartners: ["China", "USA", "Germany"],
    internetPct: 84,
    medianAge: 33.4,
    economicStructure:
      "Brazil is Latin America&#39;s largest economy with the world&#39;s most biodiverse agricultural system. Agribusiness (~25% of GDP including supply chains) is a global powerhouse — Brazil is the top exporter of soybeans, beef, coffee, sugar, and orange juice. The services sector (~73% of GDP) is anchored by a sophisticated banking system (Itaú, Bradesco, BTG Pactual), the Bolsa Família social program, and a growing fintech ecosystem. Petrobras&#39; pre-salt oil fields make Brazil a major crude exporter. Key challenges: extreme inequality (Gini ~53), fiscal instability, bureaucratic burden, and infrastructure gaps.",
    futures: {
      stockIndex: "Bovespa (B3)",
      indexValue: "127,400",
      indexChangeYTD: -1.8,
      bondYield10Y: 13.42,
      fxRate: "USD/BRL 4.97",
      keyCommodity: "Soybeans $380/t",
      marketCapT: 0.9,
    },
    services: {
      gdpPct: 73,
      workforcePct: 67,
      subSectors: [
        { name: "Finance & Banking", pct: 16, color: "hsl(200,85%,55%)" },
        { name: "Trade & Retail", pct: 15, color: "hsl(45,90%,55%)" },
        { name: "Government & Education", pct: 14, color: "hsl(0,70%,50%)" },
        { name: "Healthcare", pct: 12, color: "hsl(150,60%,45%)" },
        { name: "Transport", pct: 8, color: "hsl(18,80%,55%)" },
        { name: "IT & Telecoms", pct: 7, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  ru: {
    gini: 36.0,
    debtPct: 17,
    fiscalBalancePct: -2.2,
    urbanPct: 74,
    birthRate: 9.4,
    deathRate: 13.4,
    creditRating: "CC",
    creditAgency: "S&P",
    easeOfBusinessRank: 28,
    cpiScore: 26,
    exportPartners: ["China", "India", "Turkey"],
    importPartners: ["China", "Germany", "UAE"],
    internetPct: 85,
    medianAge: 40.6,
    economicStructure:
      "Russia&#39;s economy is heavily resource-dependent — oil, gas, and mining constitute ~35% of GDP and ~50% of federal revenues. The state controls strategic sectors via Gazprom, Rosneft, Sberbank, and others. Since the 2022 Ukraine invasion and Western sanctions, Russia has pivoted East: China now accounts for ~38% of trade. The war economy stimulus (defense spending ~7% of GDP in 2024) is masking underlying structural weakness: capital flight, technology embargo, and demographic decline. The ruble has depreciated significantly; official GDP figures understate real purchasing power losses.",
    futures: {
      stockIndex: "MOEX Russia",
      indexValue: "3,210",
      indexChangeYTD: -4.2,
      bondYield10Y: 16.8,
      fxRate: "USD/RUB 88.5",
      keyCommodity: "Urals Crude $68/bbl",
      marketCapT: 0.4,
    },
    services: {
      gdpPct: 55,
      workforcePct: 63,
      subSectors: [
        { name: "Trade & Retail", pct: 16, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Government & Defense", pct: 12, color: "hsl(0,70%,50%)" },
        { name: "Transport", pct: 10, color: "hsl(18,80%,55%)" },
        { name: "Healthcare", pct: 8, color: "hsl(150,60%,45%)" },
        { name: "IT & Telecoms", pct: 6, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  au_oc: {
    gini: 34.3,
    debtPct: 49,
    fiscalBalancePct: -0.5,
    urbanPct: 86,
    birthRate: 12.4,
    deathRate: 6.9,
    creditRating: "AAA",
    creditAgency: "S&P",
    easeOfBusinessRank: 14,
    cpiScore: 75,
    exportPartners: ["China", "Japan", "South Korea"],
    importPartners: ["China", "USA", "Japan"],
    internetPct: 91,
    medianAge: 38.7,
    economicStructure:
      "Australia&#39;s \'lucky country\' economy benefits from vast mineral wealth (iron ore, coal, gold, lithium) and proximity to Asia&#39;s growing middle class. Mining (~10% of GDP, ~60% of exports) is anchored by BHP, Rio Tinto, and Fortescue. The services sector (~70%) is led by finance, healthcare, and education (international students ~$40B/year). The Reserve Bank of Australia maintained unusual monetary stability — Australia went 28 years without recession (1991–2020). Key risks: housing affordability crisis, Chinese economic slowdown cutting commodity demand, and energy transition disrupting coal revenues.",
    futures: {
      stockIndex: "ASX 200",
      indexValue: "7,780",
      indexChangeYTD: 4.9,
      bondYield10Y: 4.38,
      fxRate: "AUD/USD 0.656",
      keyCommodity: "Iron Ore $108/t",
      marketCapT: 2.0,
    },
    services: {
      gdpPct: 70,
      workforcePct: 77,
      subSectors: [
        { name: "Finance & Insurance", pct: 16, color: "hsl(200,85%,55%)" },
        { name: "Healthcare & Social", pct: 14, color: "hsl(150,60%,45%)" },
        { name: "Education", pct: 11, color: "hsl(90,60%,40%)" },
        { name: "Retail & Wholesale", pct: 11, color: "hsl(45,90%,55%)" },
        { name: "Construction", pct: 9, color: "hsl(30,70%,45%)" },
        { name: "Tourism & Hospitality", pct: 7, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  kr: {
    gini: 31.4,
    debtPct: 54,
    fiscalBalancePct: -3.9,
    urbanPct: 82,
    birthRate: 5.0,
    deathRate: 6.6,
    creditRating: "AA",
    creditAgency: "S&P",
    easeOfBusinessRank: 5,
    cpiScore: 63,
    exportPartners: ["China", "USA", "Vietnam"],
    importPartners: ["China", "USA", "Japan"],
    internetPct: 97,
    medianAge: 44.0,
    economicStructure:
      "South Korea&#39;s economy is defined by \'chaebol\' — large family-controlled conglomerates (Samsung, Hyundai, LG, SK, Lotte) that drive exports of semiconductors, electronics, autos, and shipbuilding. The country transformed from one of the world&#39;s poorest in the 1950s to a high-income OECD economy in 50 years — the \'Miracle on the Han River.\' Semiconductors alone account for ~20% of exports. K-pop, Korean drama, and cultural exports (Hallyu wave) are a growing soft-power economic asset. Key challenges: world&#39;s lowest fertility rate (0.72), demographic cliff, chaebol governance concerns, and North Korea risk premium.",
    futures: {
      stockIndex: "KOSPI",
      indexValue: "2,680",
      indexChangeYTD: 2.3,
      bondYield10Y: 3.42,
      fxRate: "USD/KRW 1,338",
      keyCommodity: "DRAM Chips $3.4/Gb",
      marketCapT: 1.7,
    },
    services: {
      gdpPct: 63,
      workforcePct: 70,
      subSectors: [
        { name: "IT & Technology", pct: 16, color: "hsl(270,60%,60%)" },
        { name: "Finance & Insurance", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Retail & Wholesale", pct: 13, color: "hsl(45,90%,55%)" },
        { name: "Healthcare", pct: 11, color: "hsl(150,60%,45%)" },
        { name: "Education", pct: 9, color: "hsl(90,60%,40%)" },
        { name: "Entertainment & Media", pct: 6, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  ca: {
    gini: 33.3,
    debtPct: 107,
    fiscalBalancePct: -1.8,
    urbanPct: 82,
    birthRate: 10.1,
    deathRate: 8.1,
    creditRating: "AAA",
    creditAgency: "S&P",
    easeOfBusinessRank: 23,
    cpiScore: 74,
    exportPartners: ["USA", "China", "UK"],
    importPartners: ["USA", "China", "Mexico"],
    internetPct: 94,
    medianAge: 41.9,
    economicStructure:
      "Canada&#39;s economy is tightly integrated with the US (75% of exports go south) but resource-rich: oil sands (~4.2 mbpd), minerals, timber, and potash. The financial sector is dominated by the Big Six banks (RBC, TD, BMO, Scotiabank, CIBC, National) — among the world&#39;s most stable due to strict OSFI regulation. The services sector (~70%) is led by real estate, finance, and healthcare. The housing affordability crisis has become a structural macroeconomic issue — household debt-to-income is among the OECD&#39;s highest. US tariff threats under Trump (2025) have accelerated economic sovereignty diversification efforts.",
    futures: {
      stockIndex: "S&P/TSX Composite",
      indexValue: "21,840",
      indexChangeYTD: 3.2,
      bondYield10Y: 3.62,
      fxRate: "USD/CAD 1.362",
      keyCommodity: "WCS Crude $64/bbl",
      marketCapT: 3.1,
    },
    services: {
      gdpPct: 70,
      workforcePct: 77,
      subSectors: [
        {
          name: "Real Estate & Construction",
          pct: 16,
          color: "hsl(330,65%,55%)",
        },
        { name: "Finance & Insurance", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Healthcare", pct: 13, color: "hsl(150,60%,45%)" },
        { name: "Retail & Wholesale", pct: 12, color: "hsl(45,90%,55%)" },
        { name: "Government & Education", pct: 10, color: "hsl(0,70%,50%)" },
        { name: "IT & Telecoms", pct: 8, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  sa: {
    gini: 45.9,
    debtPct: 27,
    fiscalBalancePct: -1.6,
    urbanPct: 84,
    birthRate: 16.9,
    deathRate: 3.3,
    creditRating: "A",
    creditAgency: "S&P",
    easeOfBusinessRank: 62,
    cpiScore: 52,
    exportPartners: ["China", "Japan", "India"],
    importPartners: ["China", "USA", "India"],
    internetPct: 98,
    medianAge: 29.7,
    economicStructure:
      "Saudi Arabia&#39;s economy remains petrostate-structured — oil revenues fund ~60% of government expenditures and Aramco is the world&#39;s most profitable company. Vision 2030 is attempting structural diversification: NEOM mega-city ($500B), Red Sea tourism, sports investments (LIV Golf, PIF stakes in global sports), and domestic entertainment liberalization (allowing cinemas, concerts, mixed-gender events). Non-oil sectors are growing (finance, tourism, petrochemicals) but the private sector still employs mostly expatriates (~38% of population). Subsidized fuel and utilities create structural fiscal vulnerabilities when oil prices fall.",
    futures: {
      stockIndex: "Tadawul (TASI)",
      indexValue: "11,420",
      indexChangeYTD: -1.4,
      bondYield10Y: 5.12,
      fxRate: "USD/SAR 3.75 (pegged)",
      keyCommodity: "Arab Light Crude $82/bbl",
      marketCapT: 2.9,
    },
    services: {
      gdpPct: 44,
      workforcePct: 52,
      subSectors: [
        { name: "Government Services", pct: 18, color: "hsl(0,70%,50%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Tourism & Hospitality", pct: 10, color: "hsl(150,60%,45%)" },
        { name: "Retail & Trade", pct: 9, color: "hsl(45,90%,55%)" },
        { name: "Transport & Logistics", pct: 7, color: "hsl(18,80%,55%)" },
        { name: "Healthcare", pct: 5, color: "hsl(90,60%,40%)" },
      ],
    },
  },
  ae: {
    gini: 32.5,
    debtPct: 30,
    fiscalBalancePct: 5.1,
    urbanPct: 87,
    birthRate: 9.5,
    deathRate: 1.5,
    creditRating: "AA-",
    creditAgency: "S&P",
    easeOfBusinessRank: 16,
    cpiScore: 69,
    exportPartners: ["India", "China", "Japan"],
    importPartners: ["China", "India", "USA"],
    internetPct: 99,
    medianAge: 33.5,
    economicStructure:
      "The UAE operates a dual-engine economy: Abu Dhabi&#39;s oil wealth (90% of UAE oil reserves) funds sovereign wealth (ADIA ~$1T, Mubadala ~$300B) while Dubai has deliberately built a near oil-free economy in trade, tourism, finance, and real estate. Dubai is home to the world&#39;s busiest international airport, Jebel Ali Port (9th globally), and DIFC — a major financial center with English common law courts. The UAE has aggressively liberalized with 100% foreign ownership laws, 10-year golden visas, and removal of alcohol restrictions to attract global talent.",
    futures: {
      stockIndex: "DFM General Index",
      indexValue: "4,180",
      indexChangeYTD: 3.6,
      bondYield10Y: 4.84,
      fxRate: "USD/AED 3.67 (pegged)",
      keyCommodity: "Murban Crude $84/bbl",
      marketCapT: 0.3,
    },
    services: {
      gdpPct: 60,
      workforcePct: 68,
      subSectors: [
        { name: "Trade & Logistics", pct: 22, color: "hsl(200,85%,55%)" },
        { name: "Tourism & Hospitality", pct: 18, color: "hsl(150,60%,45%)" },
        { name: "Finance & Banking", pct: 14, color: "hsl(45,90%,55%)" },
        { name: "Real Estate", pct: 12, color: "hsl(330,65%,55%)" },
        { name: "Government", pct: 8, color: "hsl(0,70%,50%)" },
        { name: "IT & Telecoms", pct: 6, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  sg: {
    gini: 45.9,
    debtPct: 130,
    fiscalBalancePct: 0.5,
    urbanPct: 100,
    birthRate: 9.1,
    deathRate: 4.9,
    creditRating: "AAA",
    creditAgency: "S&P",
    easeOfBusinessRank: 2,
    cpiScore: 85,
    exportPartners: ["China", "Malaysia", "USA"],
    importPartners: ["China", "Malaysia", "USA"],
    internetPct: 99,
    medianAge: 42.2,
    economicStructure:
      "Singapore is an open, trade-reliant city-state with no natural resources — its economy is built on world-class port infrastructure, financial services, and semiconductor manufacturing. The Monetary Authority of Singapore (MAS) manages monetary policy through the SGD exchange rate band rather than interest rates. GLCs (Government-Linked Companies) — Temasek, GIC — control key strategic sectors while the government promotes \'productivity-led growth\' to counter labour shortage. Singapore is Asia&#39;s premier wealth management hub (~$5T AUM) and biomedical research cluster. Its effective corporate tax regime and stable governance make it the preferred Asia-Pacific HQ for multinationals.",
    futures: {
      stockIndex: "STI (Straits Times Index)",
      indexValue: "3,380",
      indexChangeYTD: 2.8,
      bondYield10Y: 3.08,
      fxRate: "USD/SGD 1.34",
      keyCommodity: "Semiconductor Chips (spot)",
      marketCapT: 0.6,
    },
    services: {
      gdpPct: 72,
      workforcePct: 76,
      subSectors: [
        { name: "Finance & Asset Mgmt", pct: 26, color: "hsl(200,85%,55%)" },
        { name: "Trade & Logistics", pct: 20, color: "hsl(270,60%,60%)" },
        { name: "IT & Tech Services", pct: 14, color: "hsl(45,90%,55%)" },
        { name: "Tourism & MICE", pct: 8, color: "hsl(150,60%,45%)" },
        { name: "Healthcare & Biomedical", pct: 7, color: "hsl(90,60%,40%)" },
        { name: "Education", pct: 5, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  mx: {
    gini: 45.4,
    debtPct: 50,
    fiscalBalancePct: -3.7,
    urbanPct: 81,
    birthRate: 16.1,
    deathRate: 6.4,
    creditRating: "BBB",
    creditAgency: "S&P",
    easeOfBusinessRank: 60,
    cpiScore: 31,
    exportPartners: ["USA", "Canada", "Germany"],
    importPartners: ["USA", "China", "Germany"],
    internetPct: 76,
    medianAge: 29.3,
    economicStructure:
      "Mexico is the US&#39;s top trading partner (USMCA framework) and a major nearshoring destination as companies de-risk from China. The maquiladora system (export-processing factories near the US border) generates 80% of manufactured exports. Remittances (~$64B in 2023) surpass oil revenues. PEMEX — once the world&#39;s most profitable company — is deeply indebted (~$100B) and declining in production. The incoming Claudia Sheinbaum administration faces balancing energy nationalism with need for private investment. Cartel violence and judicial independence concerns under AMLO&#39;s 2024 judicial reform are key investor risks.",
    futures: {
      stockIndex: "BMV IPC",
      indexValue: "54,200",
      indexChangeYTD: -2.6,
      bondYield10Y: 9.88,
      fxRate: "USD/MXN 17.4",
      keyCommodity: "Silver $29/oz",
      marketCapT: 0.4,
    },
    services: {
      gdpPct: 63,
      workforcePct: 62,
      subSectors: [
        { name: "Retail & Wholesale", pct: 18, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 13, color: "hsl(200,85%,55%)" },
        { name: "Tourism", pct: 12, color: "hsl(150,60%,45%)" },
        { name: "Transport & Logistics", pct: 10, color: "hsl(18,80%,55%)" },
        { name: "Healthcare", pct: 8, color: "hsl(90,60%,40%)" },
        { name: "IT & Telecoms", pct: 7, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  za: {
    gini: 63.0,
    debtPct: 73,
    fiscalBalancePct: -4.9,
    urbanPct: 68,
    birthRate: 20.2,
    deathRate: 9.5,
    creditRating: "BB-",
    creditAgency: "S&P",
    easeOfBusinessRank: 84,
    cpiScore: 41,
    exportPartners: ["China", "EU", "USA"],
    importPartners: ["China", "Germany", "India"],
    internetPct: 72,
    medianAge: 27.6,
    economicStructure:
      "South Africa is the world&#39;s most unequal major economy (Gini ~63). Its \'minerals-energy complex\' — platinum, gold, coal, and manganese — has historically defined growth but is structurally stagnant. The services sector (~70%) is anchored by financial services (JSE, major African banks), retail, and government. Structural challenges are severe: 31% unemployment (youth unemployment ~60%), rolling electricity blackouts (loadshedding ~200+ days/year), water infrastructure collapse, and port/rail inefficiencies. The 2024 Government of National Unity (ANC+DA) offers hope of pragmatic reform but institutional capacity remains stretched.",
    futures: {
      stockIndex: "JSE Top 40",
      indexValue: "68,400",
      indexChangeYTD: 5.2,
      bondYield10Y: 9.88,
      fxRate: "USD/ZAR 18.4",
      keyCommodity: "Platinum $980/oz",
      marketCapT: 1.0,
    },
    services: {
      gdpPct: 70,
      workforcePct: 74,
      subSectors: [
        { name: "Finance & Insurance", pct: 18, color: "hsl(200,85%,55%)" },
        { name: "Retail & Wholesale", pct: 16, color: "hsl(45,90%,55%)" },
        { name: "Government & Public Admin", pct: 14, color: "hsl(0,70%,50%)" },
        { name: "Transport & Logistics", pct: 10, color: "hsl(18,80%,55%)" },
        { name: "Healthcare", pct: 9, color: "hsl(150,60%,45%)" },
        { name: "IT & Telecoms", pct: 7, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  ng: {
    gini: 35.1,
    debtPct: 37,
    fiscalBalancePct: -4.6,
    urbanPct: 53,
    birthRate: 37.5,
    deathRate: 11.4,
    creditRating: "B-",
    creditAgency: "S&P",
    easeOfBusinessRank: 131,
    cpiScore: 24,
    exportPartners: ["India", "USA", "Netherlands"],
    importPartners: ["China", "Netherlands", "India"],
    internetPct: 57,
    medianAge: 18.6,
    economicStructure:
      "Nigeria is Africa&#39;s largest economy by GDP yet paradoxically one of the world&#39;s highest poverty rates (~40% below $2.15/day). Oil dominates exports (~95%) but contributes only ~6% of GDP — a structural paradox driven by the dominance of services and informal economy. Lagos is sub-Saharan Africa&#39;s largest city and emerging tech hub (\'Silicon Lagoon\': Flutterwave, Paystack, Interswitch). The removal of petrol subsidies in 2023 (under Tinubu) caused immediate inflation spike but was fiscally necessary. The naira has lost ~70% of value (2022–2024), driving dollarization and a large parallel FX market.",
    futures: {
      stockIndex: "NGX All Share Index",
      indexValue: "97,400",
      indexChangeYTD: 28.4,
      bondYield10Y: 19.8,
      fxRate: "USD/NGN 1,560",
      keyCommodity: "Bonny Light Crude $84/bbl",
      marketCapT: 0.06,
    },
    services: {
      gdpPct: 56,
      workforcePct: 44,
      subSectors: [
        {
          name: "Trade & Retail (informal)",
          pct: 22,
          color: "hsl(45,90%,55%)",
        },
        { name: "Telecoms & Fintech", pct: 14, color: "hsl(270,60%,60%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Transport", pct: 9, color: "hsl(18,80%,55%)" },
        { name: "Government", pct: 8, color: "hsl(0,70%,50%)" },
        { name: "Healthcare", pct: 6, color: "hsl(150,60%,45%)" },
      ],
    },
  },
  eg: {
    gini: 31.5,
    debtPct: 92,
    fiscalBalancePct: -6.8,
    urbanPct: 43,
    birthRate: 24.9,
    deathRate: 5.6,
    creditRating: "B",
    creditAgency: "S&P",
    easeOfBusinessRank: 93,
    cpiScore: 30,
    exportPartners: ["UAE", "USA", "Italy"],
    importPartners: ["China", "UAE", "USA"],
    internetPct: 72,
    medianAge: 24.6,
    economicStructure:
      "Egypt&#39;s economy is structurally constrained: the Suez Canal (~$9B/year pre-Houthi disruptions), tourism, and remittances from Gulf expatriates are the key hard-currency earners. The military economy (SCAF-linked enterprises) controls an estimated 20–40% of GDP across construction, food, fuel, and hospitality. The pound has lost ~70% of value since 2022 under IMF restructuring requirements. Real estate speculation and construction have crowded out productive investment. Despite a young population (60% under 30) and large labour force, structural unemployment and underemployment are pervasive.",
    futures: {
      stockIndex: "EGX 30",
      indexValue: "29,600",
      indexChangeYTD: 14.2,
      bondYield10Y: 28.4,
      fxRate: "USD/EGP 49.2",
      keyCommodity: "Cotton EGP 14,000/qintar",
      marketCapT: 0.07,
    },
    services: {
      gdpPct: 52,
      workforcePct: 47,
      subSectors: [
        { name: "Tourism & Hospitality", pct: 16, color: "hsl(150,60%,45%)" },
        { name: "Suez Canal & Transport", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Finance & Banking", pct: 11, color: "hsl(45,90%,55%)" },
        { name: "Retail & Wholesale", pct: 11, color: "hsl(270,60%,60%)" },
        { name: "Government", pct: 10, color: "hsl(0,70%,50%)" },
        { name: "Telecoms", pct: 6, color: "hsl(18,80%,55%)" },
      ],
    },
  },
  il_as: {
    gini: 38.6,
    debtPct: 62,
    fiscalBalancePct: -6.1,
    urbanPct: 93,
    birthRate: 19.9,
    deathRate: 5.0,
    creditRating: "A+",
    creditAgency: "S&P",
    easeOfBusinessRank: 35,
    cpiScore: 62,
    exportPartners: ["USA", "China", "UK"],
    importPartners: ["USA", "China", "Switzerland"],
    internetPct: 91,
    medianAge: 30.6,
    economicStructure:
      "Israel is the \'Start-up Nation\' — with the highest density of tech startups and R&D spend per capita (~5.6% of GDP) globally. The tech sector (~18% of GDP, ~50% of exports) is anchored by cybersecurity, semiconductors, AI, and agritech. Intel, Apple, Google, and Microsoft all have major R&D centers in Israel. Despite war-driven economic disruption (Gaza conflict since Oct 2023 — tourism collapsed, defense spending surged, shekel depreciated), the underlying tech fundamentals remain resilient. Diamond processing, defense exports, and precision agriculture are secondary pillars.",
    futures: {
      stockIndex: "Tel Aviv 125 (TA-125)",
      indexValue: "2,080",
      indexChangeYTD: -3.4,
      bondYield10Y: 5.22,
      fxRate: "USD/ILS 3.72",
      keyCommodity: "Polished Diamonds (IDEX)",
      marketCapT: 0.2,
    },
    services: {
      gdpPct: 72,
      workforcePct: 78,
      subSectors: [
        { name: "Technology & R&D", pct: 24, color: "hsl(270,60%,60%)" },
        { name: "Finance & Insurance", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Healthcare", pct: 12, color: "hsl(150,60%,45%)" },
        { name: "Retail & Trade", pct: 10, color: "hsl(45,90%,55%)" },
        { name: "Defense Services", pct: 8, color: "hsl(0,70%,50%)" },
        { name: "Tourism", pct: 4, color: "hsl(330,65%,55%)" },
      ],
    },
  },
  ar: {
    gini: 42.3,
    debtPct: 85,
    fiscalBalancePct: 0.8,
    urbanPct: 93,
    birthRate: 16.5,
    deathRate: 7.3,
    creditRating: "CCC",
    creditAgency: "S&P",
    easeOfBusinessRank: 126,
    cpiScore: 37,
    exportPartners: ["Brazil", "China", "USA"],
    importPartners: ["Brazil", "China", "USA"],
    internetPct: 88,
    medianAge: 31.9,
    economicStructure:
      "Argentina is a resource-rich economy that has suffered serial crises — 9 sovereign defaults since 1816, 211% inflation in 2023, and chronic capital controls. The Pampas agricultural heartland (soybeans, wheat, corn, beef) generates the hard currency that services the economy. Lithium deposits (second largest globally) offer a future beyond agriculture. Milei&#39;s shock therapy (2024–) has slashed the fiscal deficit but caused severe social pain — poverty exceeded 40%. The Vaca Muerta shale formation (~2nd largest global shale gas reserves) is a transformative opportunity if investment conditions stabilize. Structural impediments: peso instability, export taxes, and unpredictable policy swings.",
    futures: {
      stockIndex: "MERVAL (S&P Merval)",
      indexValue: "1,620,000",
      indexChangeYTD: 34.2,
      bondYield10Y: 14.8,
      fxRate: "USD/ARS 1,020 (official)",
      keyCommodity: "Soybeans $380/t",
      marketCapT: 0.08,
    },
    services: {
      gdpPct: 60,
      workforcePct: 72,
      subSectors: [
        { name: "Finance & Banking", pct: 16, color: "hsl(200,85%,55%)" },
        { name: "Retail & Wholesale", pct: 14, color: "hsl(45,90%,55%)" },
        { name: "Government & Education", pct: 13, color: "hsl(0,70%,50%)" },
        { name: "Healthcare", pct: 11, color: "hsl(150,60%,45%)" },
        { name: "Transport", pct: 9, color: "hsl(18,80%,55%)" },
        { name: "IT & Telecoms", pct: 7, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  tr: {
    gini: 41.9,
    debtPct: 33,
    fiscalBalancePct: -5.2,
    urbanPct: 77,
    birthRate: 15.6,
    deathRate: 5.4,
    creditRating: "B+",
    creditAgency: "S&P",
    easeOfBusinessRank: 33,
    cpiScore: 34,
    exportPartners: ["Germany", "USA", "UK"],
    importPartners: ["Russia", "China", "Germany"],
    internetPct: 83,
    medianAge: 32.6,
    economicStructure:
      "Turkey straddles Europe and Asia as a manufacturing hub — automotive (Ford, Fiat, Renault, Toyota), textiles, construction materials, and defense industries drive exports. Tourism (~4% GDP) makes Turkey the world&#39;s 4th most visited country. The lira has lost ~95% of value vs. the dollar since 2018 due to unorthodox monetary policy (President Erdoğan long resisted rate hikes). Post-2023 earthquake and election, Turkey shifted to orthodox economics under new central bank governor Hafize Erkan/Fatih Karahan — rates rose from 8.5% to 50%. Real estate and construction are politically sensitive sectors given 2023 earthquake failures.",
    futures: {
      stockIndex: "BIST 100 (Borsa Istanbul)",
      indexValue: "9,840",
      indexChangeYTD: 22.4,
      bondYield10Y: 28.8,
      fxRate: "USD/TRY 32.4",
      keyCommodity: "Hazelnuts €6,200/t",
      marketCapT: 0.22,
    },
    services: {
      gdpPct: 64,
      workforcePct: 56,
      subSectors: [
        { name: "Tourism & Hospitality", pct: 16, color: "hsl(150,60%,45%)" },
        { name: "Finance & Banking", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Retail & Wholesale", pct: 13, color: "hsl(45,90%,55%)" },
        { name: "Transport & Logistics", pct: 11, color: "hsl(18,80%,55%)" },
        { name: "Healthcare", pct: 9, color: "hsl(90,60%,40%)" },
        { name: "IT & Telecoms", pct: 7, color: "hsl(270,60%,60%)" },
      ],
    },
  },
  id: {
    gini: 38.2,
    debtPct: 39,
    fiscalBalancePct: -2.7,
    urbanPct: 57,
    birthRate: 16.2,
    deathRate: 6.5,
    creditRating: "BBB",
    creditAgency: "S&P",
    easeOfBusinessRank: 73,
    cpiScore: 34,
    exportPartners: ["China", "USA", "Japan"],
    importPartners: ["China", "Singapore", "Japan"],
    internetPct: 77,
    medianAge: 29.7,
    economicStructure:
      "Indonesia is the world&#39;s 4th most populous nation and Southeast Asia&#39;s largest economy — a commodity powerhouse (nickel, coal, palm oil, rubber) combined with a large domestic consumption market. Nickel is strategically critical: Indonesia holds ~42% of global reserves and has mandated nickel ore export bans since 2020 to drive domestic battery/EV supply chain development. The digital economy (Gojek, Tokopedia, Traveloka) is the fastest-growing in Southeast Asia. Structural constraints: excessive dependence on commodity cycles, infrastructure gaps across 17,000 islands, and bureaucratic fragmentation across regional governments.",
    futures: {
      stockIndex: "IDX Composite (IHSG)",
      indexValue: "7,240",
      indexChangeYTD: -1.8,
      bondYield10Y: 7.12,
      fxRate: "USD/IDR 15,840",
      keyCommodity: "Nickel $18,400/t",
      marketCapT: 0.6,
    },
    services: {
      gdpPct: 58,
      workforcePct: 46,
      subSectors: [
        { name: "Retail & Wholesale", pct: 20, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 14, color: "hsl(200,85%,55%)" },
        { name: "Transport & Logistics", pct: 11, color: "hsl(18,80%,55%)" },
        { name: "Digital Economy", pct: 10, color: "hsl(270,60%,60%)" },
        { name: "Tourism & Hospitality", pct: 9, color: "hsl(150,60%,45%)" },
        { name: "Government", pct: 8, color: "hsl(0,70%,50%)" },
      ],
    },
  },
  my: {
    gini: 41.0,
    debtPct: 67,
    fiscalBalancePct: -4.5,
    urbanPct: 78,
    birthRate: 14.4,
    deathRate: 5.1,
    creditRating: "A-",
    creditAgency: "S&P",
    easeOfBusinessRank: 12,
    cpiScore: 50,
    exportPartners: ["Singapore", "China", "USA"],
    importPartners: ["China", "Singapore", "USA"],
    internetPct: 89,
    medianAge: 29.2,
    economicStructure:
      "Malaysia has successfully diversified from a commodity economy to a manufacturing powerhouse in electronics and semiconductors (Penang&#39;s \'Silicon Island\' concentration). It is one of the world&#39;s top palm oil producers and a significant LNG exporter. PETRONAS funds ~20% of government revenues. The services sector (~54%) is led by finance (Kuala Lumpur as Islamic finance hub), retail, and tourism. Bumiputera affirmative action policies create structural inefficiencies but are politically non-negotiable. A major nearshoring beneficiary from US-China decoupling — Intel, Micron, Infineon, and NXP have large Malaysian facilities.",
    futures: {
      stockIndex: "FTSE Bursa Malaysia KLCI",
      indexValue: "1,580",
      indexChangeYTD: 8.4,
      bondYield10Y: 3.88,
      fxRate: "USD/MYR 4.68",
      keyCommodity: "Crude Palm Oil RM 3,850/t",
      marketCapT: 0.38,
    },
    services: {
      gdpPct: 54,
      workforcePct: 62,
      subSectors: [
        { name: "Retail & Wholesale", pct: 18, color: "hsl(45,90%,55%)" },
        { name: "Finance & Insurance", pct: 16, color: "hsl(200,85%,55%)" },
        { name: "Tourism & Hospitality", pct: 12, color: "hsl(150,60%,45%)" },
        { name: "Transport & Logistics", pct: 11, color: "hsl(18,80%,55%)" },
        { name: "IT & Telecoms", pct: 10, color: "hsl(270,60%,60%)" },
        { name: "Government", pct: 8, color: "hsl(0,70%,50%)" },
      ],
    },
  },
  th: {
    gini: 43.3,
    debtPct: 62,
    fiscalBalancePct: -3.4,
    urbanPct: 52,
    birthRate: 10.1,
    deathRate: 8.0,
    creditRating: "BBB+",
    creditAgency: "S&P",
    easeOfBusinessRank: 21,
    cpiScore: 36,
    exportPartners: ["USA", "China", "Japan"],
    importPartners: ["China", "Japan", "USA"],
    internetPct: 88,
    medianAge: 40.1,
    economicStructure:
      "Thailand is a middle-income Southeast Asian economy anchored by automotive manufacturing (Detroit of Asia — 2M vehicles/year), electronics exports, and the world&#39;s largest tourism sector relative to GDP. Agriculture (rice, rubber, cassava) remains significant for rural employment (~30% of workforce). The services sector (~57% of GDP) is dominated by tourism, finance, and government. Thailand faces \'middle income trap\' challenges — declining manufacturing competitiveness vs. Vietnam, limited R&D investment, and an ageing population. The military&#39;s political influence (Constitution 2017, appointed Senate) constrains institutional reform.",
    futures: {
      stockIndex: "SET Index",
      indexValue: "1,340",
      indexChangeYTD: -4.2,
      bondYield10Y: 2.84,
      fxRate: "USD/THB 35.2",
      keyCommodity: "Natural Rubber THB 58/kg",
      marketCapT: 0.6,
    },
    services: {
      gdpPct: 57,
      workforcePct: 42,
      subSectors: [
        { name: "Tourism & Hospitality", pct: 20, color: "hsl(150,60%,45%)" },
        { name: "Retail & Wholesale", pct: 16, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Transport & Logistics", pct: 10, color: "hsl(18,80%,55%)" },
        {
          name: "Healthcare (Medical Tourism)",
          pct: 9,
          color: "hsl(90,60%,40%)",
        },
        { name: "Government", pct: 7, color: "hsl(0,70%,50%)" },
      ],
    },
  },
  vn: {
    gini: 35.7,
    debtPct: 37,
    fiscalBalancePct: -2.8,
    urbanPct: 39,
    birthRate: 15.8,
    deathRate: 5.8,
    creditRating: "BB+",
    creditAgency: "S&P",
    easeOfBusinessRank: 70,
    cpiScore: 41,
    exportPartners: ["USA", "China", "South Korea"],
    importPartners: ["China", "South Korea", "Japan"],
    internetPct: 79,
    medianAge: 31.5,
    economicStructure:
      "Vietnam is one of the world&#39;s premier manufacturing relocation destinations — Samsung alone produces ~50% of its global smartphones in Vietnam, contributing ~25% of Vietnam&#39;s total exports. The economy has grown at ~6% for 20+ years via FDI-led export industrialization (similar to China&#39;s 1990s model). Agriculture (rice, coffee, cashews, shrimp) remains a significant rural employer. The services sector is growing rapidly (fintech, e-commerce, tourism). Key challenges: dependence on FDI for technology transfer, limited domestic R&D, infrastructure bottlenecks (especially power supply), and governance concerns under the \'blazing furnace\' anti-corruption drive.",
    futures: {
      stockIndex: "VN-Index (HOSE)",
      indexValue: "1,240",
      indexChangeYTD: 8.2,
      bondYield10Y: 3.04,
      fxRate: "USD/VND 25,480",
      keyCommodity: "Robusta Coffee $4,200/t",
      marketCapT: 0.18,
    },
    services: {
      gdpPct: 42,
      workforcePct: 38,
      subSectors: [
        { name: "Retail & Wholesale", pct: 18, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Transport & Logistics", pct: 11, color: "hsl(18,80%,55%)" },
        { name: "Tourism", pct: 10, color: "hsl(150,60%,45%)" },
        { name: "IT & Telecoms", pct: 8, color: "hsl(270,60%,60%)" },
        { name: "Government", pct: 7, color: "hsl(0,70%,50%)" },
      ],
    },
  },
  ph: {
    gini: 40.7,
    debtPct: 60,
    fiscalBalancePct: -5.1,
    urbanPct: 48,
    birthRate: 21.0,
    deathRate: 6.4,
    creditRating: "BBB+",
    creditAgency: "S&P",
    easeOfBusinessRank: 95,
    cpiScore: 33,
    exportPartners: ["USA", "Japan", "China"],
    importPartners: ["China", "Japan", "South Korea"],
    internetPct: 73,
    medianAge: 25.7,
    economicStructure:
      "The Philippines&#39; economy is uniquely service-driven for a middle-income Asian country. BPO/IT-BPM (call centers, shared services, IT outsourcing) generates ~$35B annually — comparable to remittances (~$38B). OCW remittances are the second-largest economic sector. Manufacturing remains underdeveloped relative to peers (electronics assembly, food processing). The services sector (~62% of GDP) is the dominant growth engine. Structural constraints: geographic fragmentation (7,100 islands), typhoon vulnerability, and inadequate infrastructure.",
    futures: {
      stockIndex: "PSEi (Philippine Stock Exchange)",
      indexValue: "6,640",
      indexChangeYTD: -3.1,
      bondYield10Y: 6.88,
      fxRate: "USD/PHP 57.2",
      keyCommodity: "BPO Services (non-tradable)",
      marketCapT: 0.22,
    },
    services: {
      gdpPct: 62,
      workforcePct: 57,
      subSectors: [
        { name: "BPO & IT Services", pct: 26, color: "hsl(270,60%,60%)" },
        { name: "Retail & Wholesale", pct: 16, color: "hsl(45,90%,55%)" },
        { name: "Finance & Banking", pct: 12, color: "hsl(200,85%,55%)" },
        { name: "Tourism & Hospitality", pct: 10, color: "hsl(150,60%,45%)" },
        { name: "Transport", pct: 8, color: "hsl(18,80%,55%)" },
        { name: "Government", pct: 7, color: "hsl(0,70%,50%)" },
      ],
    },
  },
  pk: {
    gini: 31.6,
    debtPct: 77,
    fiscalBalancePct: -7.6,
    urbanPct: 37,
    birthRate: 26.4,
    deathRate: 6.8,
    creditRating: "CCC+",
    creditAgency: "S&P",
    easeOfBusinessRank: 108,
    cpiScore: 27,
    exportPartners: ["USA", "China", "UK"],
    importPartners: ["China", "UAE", "Saudi Arabia"],
    internetPct: 48,
    medianAge: 22.0,
  },
  bd: {
    gini: 32.4,
    debtPct: 41,
    fiscalBalancePct: -5.7,
    urbanPct: 40,
    birthRate: 19.2,
    deathRate: 5.4,
    creditRating: "B+",
    creditAgency: "S&P",
    easeOfBusinessRank: 168,
    cpiScore: 24,
    exportPartners: ["USA", "Germany", "UK"],
    importPartners: ["China", "India", "Singapore"],
    internetPct: 73,
    medianAge: 27.9,
  },
  et: {
    gini: 35.0,
    debtPct: 49,
    fiscalBalancePct: -3.5,
    urbanPct: 22,
    birthRate: 34.0,
    deathRate: 7.1,
    creditRating: "CCC",
    creditAgency: "S&P",
    easeOfBusinessRank: 159,
    cpiScore: 37,
    exportPartners: ["USA", "UAE", "Saudi Arabia"],
    importPartners: ["China", "India", "UAE"],
    internetPct: 24,
    medianAge: 19.8,
  },
  ke: {
    gini: 40.8,
    debtPct: 72,
    fiscalBalancePct: -5.4,
    urbanPct: 30,
    birthRate: 27.4,
    deathRate: 6.2,
    creditRating: "B",
    creditAgency: "S&P",
    easeOfBusinessRank: 56,
    cpiScore: 31,
    exportPartners: ["Uganda", "USA", "Netherlands"],
    importPartners: ["China", "India", "UAE"],
    internetPct: 87,
    medianAge: 20.1,
  },
  ir: {
    gini: 42.0,
    debtPct: 30,
    fiscalBalancePct: -3.0,
    urbanPct: 76,
    birthRate: 16.8,
    deathRate: 5.5,
    creditRating: "N/A",
    creditAgency: "–",
    easeOfBusinessRank: 127,
    cpiScore: 24,
    exportPartners: ["China", "India", "Turkey"],
    importPartners: ["China", "UAE", "India"],
    internetPct: 72,
    medianAge: 32.0,
  },
  iq: {
    gini: 29.5,
    debtPct: 47,
    fiscalBalancePct: 2.3,
    urbanPct: 71,
    birthRate: 28.7,
    deathRate: 5.2,
    creditRating: "B-",
    creditAgency: "S&P",
    easeOfBusinessRank: 172,
    cpiScore: 20,
    exportPartners: ["India", "China", "South Korea"],
    importPartners: ["Turkey", "China", "UAE"],
    internetPct: 79,
    medianAge: 20.6,
  },
  kp: {
    gini: 32.0,
    debtPct: 0,
    fiscalBalancePct: 0.0,
    urbanPct: 63,
    birthRate: 14.4,
    deathRate: 9.4,
    creditRating: "N/A",
    creditAgency: "–",
    easeOfBusinessRank: 0,
    cpiScore: 8,
    exportPartners: ["China", "Russia", "India"],
    importPartners: ["China", "Russia", "India"],
    internetPct: 0,
    medianAge: 34.7,
  },
};

const SRC_WORLDBANK = [
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
  {
    label: "IMF World Economic Outlook",
    url: "https://www.imf.org/en/Publications/WEO",
  },
];
const SRC_UNDP = [
  {
    label: "UNDP Human Development Report",
    url: "https://hdr.undp.org/data-center/human-development-index",
  },
];
const SRC_MILITARY = [
  {
    label: "SIPRI Military Expenditure DB",
    url: "https://www.sipri.org/databases/milex",
  },
  { label: "Global Firepower Index", url: "https://www.globalfirepower.com/" },
];
const SRC_ENERGY = [
  {
    label: "IEA World Energy Balances",
    url: "https://www.iea.org/data-and-statistics",
  },
  {
    label: "Our World in Data – Energy",
    url: "https://ourworldindata.org/energy",
  },
];
const SRC_CONSTITUTION = [
  { label: "Constitute Project", url: "https://www.constituteproject.org/" },
];

const WORLD_BANK_SOURCES = [
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
  { label: "UN Population Division", url: "https://population.un.org/wpp/" },
];

const HDI_SOURCES = [
  {
    label: "UNDP Human Development Report",
    url: "https://hdr.undp.org/data-center/human-development-index",
  },
];

const MILITARY_SOURCES = [
  {
    label: "SIPRI Military Expenditure DB",
    url: "https://www.sipri.org/databases/milex",
  },
  { label: "Global Firepower Index", url: "https://www.globalfirepower.com/" },
];

const ENERGY_SOURCES = [
  {
    label: "IEA World Energy Balances",
    url: "https://www.iea.org/data-and-statistics/data-product/world-energy-balances",
  },
  {
    label: "Our World in Data – Energy",
    url: "https://ourworldindata.org/energy",
  },
];

const CONSTITUTION_SOURCES = [
  { label: "Constitute Project", url: "https://www.constituteproject.org/" },
  {
    label: "World Constitutions Illustrated",
    url: "https://heinonline.org/HOL/Index?collection=cow",
  },
];

// Format GDP: show B for < 1T, T for >= 1T
function fmtGDP(billionsUSD: number): string {
  if (billionsUSD >= 1000)
    return `$${(billionsUSD / 1000).toFixed(2).replace(/\.?0+$/, "")}T`;
  if (billionsUSD >= 1) return `$${Math.round(billionsUSD)}B`;
  return `<$1B`;
}

// Format population: show K for < 1M, M for >= 1M, B for >= 1B
function fmtPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n.toLocaleString()}`;
}

const continentColors: Record<string, string> = {
  "North America": "text-secondary border-secondary bg-secondary/10",
  Asia: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  Europe: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  "South America": "text-green-400 border-green-500/40 bg-green-500/10",
  Africa: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  Oceania: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
};

const hdiBadge = (hdi: number) => {
  if (hdi >= 0.9) return "bg-green-500/20 text-green-400";
  if (hdi >= 0.8) return "bg-secondary/20 text-secondary";
  if (hdi >= 0.7) return "bg-yellow-500/20 text-yellow-400";
  return "bg-orange-500/20 text-orange-400";
};

function getBiosphere(country: Country) {
  return BIOSPHERE_PRESETS[country.id] ?? BIOSPHERE_DEFAULT;
}

// ── Military Panel Sub-component ──
function MilitarySection({ mil }: { mil: MilitaryStats }) {
  const totalBases = mil.nationalBases + mil.intlBases;
  const nationalPct =
    totalBases > 0 ? (mil.nationalBases / totalBases) * 100 : 0;
  const intlPct = totalBases > 0 ? (mil.intlBases / totalBases) * 100 : 0;

  const kpiCards = [
    {
      label: "Active Personnel",
      value: fmtPers(mil.activePers),
      sub: mil.activePers.toLocaleString(),
      icon: <Users size={14} weight="fill" className="text-red-400" />,
      accent: "border-red-500/25 bg-red-500/5",
      valueColor: "text-red-400",
    },
    {
      label: "Reserve Personnel",
      value: fmtPers(mil.reservePers),
      sub: mil.reservePers.toLocaleString(),
      icon: <Shield size={14} weight="fill" className="text-orange-400" />,
      accent: "border-orange-500/25 bg-orange-500/5",
      valueColor: "text-orange-400",
    },
    {
      label: "Total Inventory",
      value: mil.inventory.toLocaleString(),
      sub: "assets tracked",
      icon: <Sword size={14} weight="fill" className="text-yellow-400" />,
      accent: "border-yellow-500/25 bg-yellow-500/5",
      valueColor: "text-yellow-400",
    },
    {
      label: "Defence Budget",
      value: `$${mil.defenceBudgetB}B`,
      sub: "annual USD",
      icon: <CurrencyDollar size={14} weight="fill" className="text-success" />,
      accent: "border-green-500/25 bg-green-500/5",
      valueColor: "text-success",
    },
  ];

  return (
    <div className="modal-tile rounded-lg p-4 mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-500/10 rounded-md border border-red-500/20">
            <Shield size={13} weight="fill" className="text-red-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Military Capacity
            </h3>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              {mil.branches.length} active service branches
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
          {totalBases} bases total
        </span>
      </div>

      {/* KPI cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {kpiCards.map((k) => (
          <div key={k.label} className={`rounded-lg border p-3 ${k.accent}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
                {k.label}
              </span>
              {k.icon}
            </div>
            <p
              className={`text-xl font-bold font-mono leading-none ${k.valueColor}`}
            >
              {k.value}
            </p>
            <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-70">
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Base deployment breakdown */}
      <div className="rounded-lg border border-border bg-background/40 p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
            Base Deployment
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-mono text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
              {mil.nationalBases} National
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
              {mil.intlBases} Overseas
            </span>
          </div>
        </div>

        {/* Stacked bar */}
        {totalBases > 0 ? (
          <>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted gap-px">
              <div
                className="h-full bg-secondary transition-all duration-700 rounded-l-full"
                style={{ width: `${nationalPct}%` }}
              />
              {intlPct > 0 && (
                <div
                  className="h-full bg-purple-500 transition-all duration-700 rounded-r-full"
                  style={{ width: `${intlPct}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] font-mono text-secondary opacity-80">
                {nationalPct.toFixed(0)}% domestic
              </span>
              <span className="text-[9px] font-mono text-purple-400 opacity-80">
                {intlPct.toFixed(0)}% international
              </span>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground font-sans italic">
            No base data available
          </p>
        )}
      </div>

      {/* Service Branches */}
      <div>
        <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
          Service Branches
        </p>
        <div className="flex flex-wrap gap-1.5">
          {mil.branches.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1 text-[10px] bg-card text-foreground border border-border px-2.5 py-1 rounded-md font-sans hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              <span className="w-1 h-1 rounded-full bg-red-400/70 shrink-0" />
              {b}
            </span>
          ))}
        </div>
      </div>
      <SourceLink sources={SRC_MILITARY} className="mt-3" />
    </div>
  );
}

function CountryModal({
  country,
  onClose,
}: {
  country: Country;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "map" | "constitution"
  >("overview");
  const { openNote } = useNotes();

  React.useEffect(() => {
    setActiveTab("overview");
  }, [country.id]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 text-xs font-mono">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((e: any) => (
            <p key={e.name} style={{ color: e.color }}>
              {e.name}: {e.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in modal-glass border">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
                <img
                  src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.onerror = null;
                    t.style.display = "none";
                    const fb = t.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = "flex";
                  }}
                />
                <div className="w-full h-full bg-gradient-1 items-center justify-center hidden">
                  <span className="text-lg font-bold font-mono text-primary-foreground">
                    {country.code}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold font-sans text-foreground">
                  {country.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} /> {country.capital}
                  </span>
                  <span
                    className={`text-xs border px-2 py-0.5 rounded-full font-sans ${continentColors[country.continent] ?? "text-muted-foreground border-border bg-muted"}`}
                  >
                    {country.continent}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${hdiBadge(country.humanDevelopmentIndex)}`}
                  >
                    HDI {country.humanDevelopmentIndex}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  openNote({ entityName: country.name, entityType: "Country" })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors cursor-pointer"
                aria-label="Take note about this country"
              >
                <NotePencil size={13} weight="fill" />
                Take Note
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-5 bg-muted/60 rounded-xl p-1 border border-border/60">
            {(
              [
                {
                  id: "overview" as const,
                  label: "Overview",
                  icon: <ListBullets size={13} weight="fill" />,
                },
                {
                  id: "map" as const,
                  label: "Map",
                  icon: <MapTrifold size={13} weight="fill" />,
                },
                {
                  id: "constitution" as const,
                  label: "Governance",
                  icon: <Scales size={13} weight="fill" />,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all duration-150 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── MAP TAB ── */}
          {activeTab === "map" && (
            <div className="animate-fade-in space-y-4">
              {/* Info strip */}
              <div
                className={`rounded-xl p-4 bg-gradient-to-r ${
                  country.continent === "North America"
                    ? "from-blue-500/20 to-cyan-500/10"
                    : country.continent === "Europe"
                      ? "from-purple-500/20 to-violet-500/10"
                      : country.continent === "Asia"
                        ? "from-yellow-500/20 to-amber-500/10"
                        : country.continent === "Africa"
                          ? "from-orange-500/20 to-red-500/10"
                          : country.continent === "South America"
                            ? "from-green-500/20 to-emerald-500/10"
                            : "from-cyan-500/20 to-teal-500/10"
                } border border-border/50`}
              >
                <div className="flex flex-wrap items-center gap-4 text-sm font-sans">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={14}
                      className="text-secondary"
                      weight="fill"
                    />
                    <span className="text-muted-foreground">Capital:</span>
                    <span className="font-semibold text-foreground">
                      {country.capital}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Continent:</span>
                    <span className="font-semibold text-foreground">
                      {country.continent}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {(country.areaKm2 / 1e6).toFixed(2)}M km²
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Population:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {fmtPop(country.population)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Embedded Google Map */}
              <div
                className="relative rounded-xl overflow-hidden border border-border shadow-lg"
                style={{ height: 380 }}
              >
                <iframe
                  title={`Map of ${country.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(country.name)}&z=5&output=embed&t=m`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              {/* Location facts */}
              <div className="modal-tile rounded-xl p-4">
                <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
                  Location Facts
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "ISO Code", value: country.code },
                    { label: "Government", value: country.governmentType },
                    { label: "Currency", value: country.currency },
                    {
                      label: "HDI",
                      value: String(country.humanDevelopmentIndex),
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
                        {s.label}
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground truncate">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONSTITUTION TAB ── */}
          {activeTab === "constitution" && (
            <ConstitutionTab country={country} />
          )}

          {/* ── OVERVIEW TAB ── */}
          {
            activeTab === "overview" && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-1">
                  {[
                    {
                      label: "GDP",
                      value: fmtGDP(country.gdp),
                      sub: country.gdp >= 1000 ? "trillion USD" : "billion USD",
                    },
                    {
                      label: "GDP Per Capita",
                      value: `$${country.gdpPerCapita.toLocaleString()}`,
                      sub: "per person",
                    },
                    {
                      label: "GDP Growth",
                      value: `${country.gdpGrowth > 0 ? "+" : ""}${country.gdpGrowth}%`,
                      sub: "annual",
                    },
                    {
                      label: "Population",
                      value: fmtPop(country.population),
                      sub: "estimated",
                    },
                    {
                      label: "Unemployment",
                      value: `${country.unemploymentRate}%`,
                      sub: "rate",
                    },
                    {
                      label: "Inflation",
                      value: `${country.inflationRate}%`,
                      sub: "annual",
                    },
                    {
                      label: "Life Expectancy",
                      value: `${country.lifeExpectancy}`,
                      sub: "years avg.",
                    },
                    {
                      label: "Trade Balance",
                      value: `${country.tradeBalance > 0 ? "+" : ""}$${country.tradeBalance}B`,
                      sub: "surplus/deficit",
                    },
                    {
                      label: "Area",
                      value: `${(country.areaKm2 / 1e6).toFixed(2)}M km²`,
                      sub: "total land",
                    },
                  ].map((s) => (
                    <div key={s.label} className="modal-tile rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-sans">
                        {s.label}
                      </p>
                      <p
                        className={`text-lg font-bold font-mono ${s.label === "Trade Balance" ? (country.tradeBalance >= 0 ? "text-success" : "text-destructive") : s.label === "GDP Growth" ? (country.gdpGrowth >= 0 ? "text-success" : "text-destructive") : "text-foreground"}`}
                      >
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {s.sub}
                      </p>
                    </div>
                  ))}
                </div>

                <SourceLink sources={SRC_WORLDBANK} className="mb-4" />

                {/* Key Industries + Biosphere */}
                {country.keyIndustries && country.keyIndustries.length > 0 && (
                  <div className="modal-tile rounded-lg p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Horizontal bar chart */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold font-sans text-foreground mb-3">
                          Most Vital Industries
                        </h3>
                        <div className="space-y-2">
                          {country.keyIndustries.map((ind) => (
                            <div
                              key={ind.name}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs font-sans text-muted-foreground w-28 shrink-0 truncate">
                                {ind.name}
                              </span>
                              <div className="flex-1 h-4 bg-background rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(ind.gdpShare / 50) * 100}%`,
                                    backgroundColor: ind.color,
                                    opacity: 0.85,
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-mono w-9 text-right shrink-0"
                                style={{ color: ind.color }}
                              >
                                {ind.gdpShare}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Biosphere donut */}
                      <div className="shrink-0 flex flex-col items-center">
                        <h3 className="text-sm font-semibold font-sans text-foreground mb-1">
                          Biosphere
                        </h3>
                        <div className="relative w-32 h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getBiosphere(country)}
                                cx="50%"
                                cy="50%"
                                innerRadius={34}
                                outerRadius={55}
                                paddingAngle={2}
                                dataKey="value"
                                isAnimationActive
                                animationDuration={700}
                              >
                                {getBiosphere(country).map((entry, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={entry.color}
                                    fillOpacity={0.9}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload?.length) {
                                    const d = payload[0].payload;
                                    return (
                                      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                                        <p className="font-semibold text-foreground">
                                          {d.label}
                                        </p>
                                        <p style={{ color: d.color }}>
                                          {d.value}%
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-1 space-y-0.5 w-full">
                          {getBiosphere(country).map((seg) => (
                            <div
                              key={seg.label}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="text-xs font-sans text-muted-foreground truncate">
                                {seg.label}
                              </span>
                              <span
                                className="text-xs font-mono ml-auto"
                                style={{ color: seg.color }}
                              >
                                {seg.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Energy */}
                {country.energy && (
                  <EnergySection
                    energy={country.energy}
                    countryId={country.id}
                  />
                )}

                {/* Military */}
                {getMilitary(country.id) && (
                  <MilitarySection mil={getMilitary(country.id)!} />
                )}

                {/* Languages & Government */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2">
                      Government
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {country.governmentType}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {country.headOfState}
                    </p>
                  </div>
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2">
                      Languages · Currency
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {country.officialLanguages.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {country.currency}
                      {country.gdpGrowth > 0 ? " · Growing" : " · Contracting"}
                    </p>
                  </div>
                </div>

                {/* Spoken Languages, Landmarks, Religions */}
                {!!(
                  (country as any).spokenLanguages?.length ||
                  (country as any).landmarks?.length ||
                  (country as any).religions?.length
                ) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(country as any).spokenLanguages?.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                          Languages Spoken
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(country as any).spokenLanguages.map((l: string) => (
                            <span
                              key={l}
                              className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(country as any).landmarks?.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                          Top Landmarks
                        </p>
                        <ul className="space-y-1">
                          {(country as any).landmarks.map((lm: string) => (
                            <li
                              key={lm}
                              className="text-xs text-foreground font-sans flex items-start gap-1.5"
                            >
                              <span className="text-secondary mt-0.5">•</span>
                              {lm}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(country as any).religions?.length > 0 && (
                      <div className="modal-tile rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                          Religions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(country as any).religions.map((r: string) => (
                            <span
                              key={r}
                              className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SOCIOLOGICAL BREAKDOWN ── */}
                <CountrySociologicalBreakdown country={country} />
              </>
            ) /* end overview tab */
          }
        </div>
      </div>
    </div>
  );
}

// ── Inline photo grid with lightbox used by CountryModal photos tab ──────────
function ModalPhotosGrid({
  photos,
}: {
  photos: { url: string; caption: string }[];
}) {
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIdx(idx)}
            className="group relative rounded-lg overflow-hidden border border-border hover:border-secondary/50 transition-all cursor-pointer"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="absolute bottom-0 left-0 right-0 p-2 text-[10px] text-white font-sans leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.caption}
            </p>
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={20} />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length);
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx + 1) % photos.length);
            }}
          >
            <ArrowRight size={18} />
          </button>
          <div
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIdx].url}
              alt={photos[lightboxIdx].caption}
              className="w-full max-h-[75vh] object-cover rounded-xl shadow-2xl"
            />
            <p className="text-center text-sm text-white/70 mt-3 font-sans">
              {photos[lightboxIdx].caption}
            </p>
            <p className="text-center text-xs text-white/40 mt-1 font-mono">
              {lightboxIdx + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function EnergySection({
  energy,
  countryId,
}: {
  energy: EnergyStats;
  countryId: string;
}) {
  const netBalance = energy.totalProductionTWh - energy.totalUseTWh;
  const isExporter = netBalance >= 0;
  const fmtTWh = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)} PWh` : `${n.toLocaleString()} TWh`;

  return (
    <div className="modal-tile rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/10 rounded-md border border-yellow-500/20">
            <svg
              width="13"
              height="13"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-yellow-400"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Energy
            </h3>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              Use, production & energy mix
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isExporter ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-orange-400 border-orange-500/30 bg-orange-500/10"}`}
        >
          {isExporter
            ? `Net Exporter +${fmtTWh(netBalance)}`
            : `Net Importer ${fmtTWh(Math.abs(netBalance))}`}
        </span>
      </div>

      {/* Use vs Production KPI row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider mb-1">
            Total Consumption
          </p>
          <p className="text-lg font-bold font-mono text-yellow-400 leading-none">
            {fmtTWh(energy.totalUseTWh)}
          </p>
          <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-70">
            per year
          </p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider mb-1">
            Total Production
          </p>
          <p className="text-lg font-bold font-mono text-blue-400 leading-none">
            {fmtTWh(energy.totalProductionTWh)}
          </p>
          <p className="text-[9px] text-muted-foreground font-mono mt-1 opacity-70">
            per year
          </p>
        </div>
      </div>

      {/* Energy Mix */}
      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
        Energy Mix (% of production)
      </p>
      <div className="space-y-2 mb-3">
        {energy.mix.map((src) => (
          <div key={src.source} className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-muted-foreground w-24 shrink-0 truncate">
              {src.source}
            </span>
            <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${src.pct}%`,
                  backgroundColor: src.color,
                  opacity: 0.85,
                }}
              />
            </div>
            <span
              className="text-[11px] font-mono w-9 text-right shrink-0"
              style={{ color: src.color }}
            >
              {src.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Stacked mix bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {energy.mix.map((src) => (
          <div
            key={src.source}
            className="h-full transition-all duration-700"
            style={{ width: `${src.pct}%`, backgroundColor: src.color }}
            title={`${src.source}: ${src.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {energy.mix.map((src) => (
          <span
            key={src.source}
            className="flex items-center gap-1 text-[10px] font-sans text-muted-foreground"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: src.color }}
            />
            {src.source}
          </span>
        ))}
      </div>
      <SourceLink sources={SRC_ENERGY} className="mt-3" />
    </div>
  );
}

// ── Country Sociological Breakdown ──────────────────────────────────────────
const SOCIO_PALETTE = [
  "#60a5fa",
  "#f87171",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#fb923c",
  "#38bdf8",
  "#e879f9",
  "#4ade80",
  "#f472b6",
];

function CountrySociologicalBreakdown({ country }: { country: Country }) {
  const religions = (country as any).religions as string[] | undefined;
  const spokenLanguages = (country as any).spokenLanguages as
    | string[]
    | undefined;
  const politicalIdeologies = (country as any).politicalIdeologies as
    | string[]
    | undefined;
  const governanceStyle = (country as any).governanceStyle as
    | string[]
    | undefined;

  const hasSocioData = !!(
    religions?.length ||
    spokenLanguages?.length ||
    politicalIdeologies?.length ||
    governanceStyle?.length ||
    country.lifeExpectancy ||
    country.humanDevelopmentIndex
  );

  if (!hasSocioData) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-violet-500/10 rounded-md border border-violet-500/20">
          <Users size={13} weight="fill" className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
            Sociological Breakdown
          </h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            People, culture, beliefs &amp; governance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Religion */}
        {religions && religions.length > 0 && (
          <div className="modal-tile rounded-lg p-4">
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
              Religion / Belief Systems
            </p>
            <div className="space-y-1.5">
              {religions.map((r, i) => (
                <div key={r} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: SOCIO_PALETTE[i % SOCIO_PALETTE.length],
                    }}
                  />
                  <span className="text-[11px] font-sans text-foreground flex-1">
                    {r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {spokenLanguages && spokenLanguages.length > 0 && (
          <div className="modal-tile rounded-lg p-4">
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
              Languages Spoken
            </p>
            <div className="flex flex-wrap gap-1.5">
              {spokenLanguages.map((l, i) => (
                <span
                  key={l}
                  className="text-[11px] font-sans px-2 py-0.5 rounded-full border"
                  style={{
                    color: SOCIO_PALETTE[i % SOCIO_PALETTE.length],
                    borderColor: SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "44",
                    backgroundColor:
                      SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "18",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Human Development */}
        <div className="modal-tile rounded-lg p-4">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-3">
            Human Development
          </p>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground font-sans">
                  HDI Score
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {country.humanDevelopmentIndex}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${country.humanDevelopmentIndex * 100}%`,
                    background:
                      country.humanDevelopmentIndex >= 0.8
                        ? "#34d399"
                        : country.humanDevelopmentIndex >= 0.6
                          ? "#fbbf24"
                          : "#f87171",
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] mt-0.5 text-muted-foreground">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Very High</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-[10px] text-muted-foreground font-sans">
                Life Expectancy
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {country.lifeExpectancy} yrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-sans">
                Population
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {fmtPop(country.population)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-sans">
                Official Language(s)
              </span>
              <span className="text-xs font-sans text-foreground truncate max-w-[140px] text-right">
                {country.officialLanguages.join(", ")}
              </span>
            </div>
            <SourceLink
              sources={SRC_UNDP}
              className="pt-2 border-t border-border mt-2"
            />
          </div>
        </div>

        {/* Political & Governance Culture */}
        <div className="modal-tile rounded-lg p-4">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
            Political &amp; Governance Culture
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground font-sans mb-1">
                Government Type
              </p>
              <p className="text-xs font-sans text-foreground">
                {country.governmentType}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-sans mb-1">
                Head of State
              </p>
              <p className="text-xs font-sans text-foreground">
                {country.headOfState}
              </p>
            </div>
            {politicalIdeologies && politicalIdeologies.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-sans mb-1">
                  Political Ideologies
                </p>
                <div className="flex flex-wrap gap-1">
                  {politicalIdeologies.map((id, i) => (
                    <span
                      key={id}
                      className="text-[10px] font-sans px-1.5 py-0.5 rounded border"
                      style={{
                        color: SOCIO_PALETTE[i % SOCIO_PALETTE.length],
                        borderColor:
                          SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "44",
                        backgroundColor:
                          SOCIO_PALETTE[i % SOCIO_PALETTE.length] + "18",
                      }}
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {governanceStyle && governanceStyle.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-sans mb-1">
                  Governance Style
                </p>
                <div className="flex flex-wrap gap-1">
                  {governanceStyle.map((gs, i) => (
                    <span
                      key={gs}
                      className="text-[10px] font-sans px-1.5 py-0.5 rounded border bg-muted/60 text-muted-foreground border-border"
                    >
                      {gs}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-sans text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-mono w-12 text-right shrink-0"
        style={{ color }}
      >
        {typeof value === "number" && value % 1 !== 0
          ? value.toFixed(1)
          : value}
      </span>
    </div>
  );
}

// ── Constitution / Political Doctrine Data ───────────────────────────────────
interface ConstitutionArticle {
  title: string;
  description: string;
  type: "right" | "principle" | "structure" | "doctrine";
  year?: number;
}

interface ConstitutionData {
  name: string;
  adopted: number;
  lastAmended?: number;
  type: string;
  summary: string;
  ideology: string[];
  articles: ConstitutionArticle[];
}

const typeColors: Record<ConstitutionArticle["type"], string> = {
  right: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  principle: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  structure: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  doctrine: "text-green-400 border-green-500/30 bg-green-500/10",
};

const COUNTRY_CONSTITUTIONS: Record<string, ConstitutionData> = {
  us: {
    name: "Constitution of the United States",
    adopted: 1789,
    lastAmended: 1992,
    type: "Federal Presidential Constitutional Republic",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Constitutionalism",
      "Republicanism",
      "Separation of Powers",
      "Rule of Law",
    ],
    summary:
      "Ratified in 1788 and effective March 4, 1789, the U.S. Constitution is the world&#39;s oldest functioning codified national constitution. It replaced the Articles of Confederation, creating a stronger federal government while balancing state sovereignty. Its 27 amendments — the first ten known as the Bill of Rights (1791) — codify civil liberties that have influenced constitutional design worldwide.",
    articles: [
      {
        title: "Article I — The Legislative Branch",
        description:
          "Vests all federal legislative power in a bicameral Congress: the Senate (100 senators, 6-year terms, 2 per state) and the House of Representatives (435 members, 2-year terms, apportioned by population). Congress holds enumerated powers including taxation, commerce regulation, and declaration of war.",
        type: "structure",
      },
      {
        title: "Article II — The Executive Branch",
        description:
          "Establishes the President as Commander-in-Chief of the armed forces. The President is elected via the Electoral College to a 4-year term (limited to two terms by the 22nd Amendment, 1951), and holds powers of appointment, treaty negotiation (with Senate confirmation), and executive orders.",
        type: "structure",
      },
      {
        title: "Article III — The Judicial Branch",
        description:
          "Creates one Supreme Court and empowers Congress to establish inferior federal courts. Federal judges serve during good behavior (effectively life tenure). The doctrine of judicial review — established by Marbury v. Madison (1803) — empowers courts to strike down unconstitutional laws.",
        type: "structure",
      },
      {
        title: "First Amendment — Freedom of Expression",
        description:
          "Congress shall make no law respecting an establishment of religion, or prohibiting its free exercise; or abridging freedom of speech, press, peaceful assembly, or the right to petition the government for redress of grievances. One of the broadest free speech protections in any democracy.",
        type: "right",
        year: 1791,
      },
      {
        title: "Second Amendment — Right to Bear Arms",
        description:
          "A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed. The Supreme Court in D.C. v. Heller (2008) confirmed this as an individual right, not solely a collective militia right.",
        type: "right",
        year: 1791,
      },
      {
        title: "Fourth Amendment — Search and Seizure",
        description:
          "Protects against unreasonable searches and seizures; warrants must be judicially sanctioned and supported by probable cause. Foundational to American privacy law, extended by courts to digital communications, GPS tracking, and thermal imaging.",
        type: "right",
        year: 1791,
      },
      {
        title: "Fifth & Sixth Amendments — Due Process & Fair Trial",
        description:
          "No person shall be held for a capital crime without grand jury indictment, nor compelled to be a witness against themselves (self-incrimination), nor deprived of life, liberty, or property without due process. The Sixth guarantees speedy public trial by jury, right to counsel, and to confront accusers.",
        type: "right",
        year: 1791,
      },
      {
        title: "14th Amendment — Equal Protection & Citizenship",
        description:
          "All persons born or naturalized in the United States are citizens. No state shall abridge privileges or immunities, deny due process, or deny equal protection. Ratified 1868 after the Civil War, it incorporated most Bill of Rights protections against state action and outlawed racial discrimination in law.",
        type: "right",
        year: 1868,
      },
      {
        title: "Federalism — 10th Amendment",
        description:
          "Powers not delegated to the federal government by the Constitution, nor prohibited to states, are reserved to the states or to the people. This reserve-power clause underpins American federalism, preserving 50 state laboratories of democracy operating alongside the federal government.",
        type: "principle",
        year: 1791,
      },
      {
        title: "Checks and Balances",
        description:
          "Each branch is given tools to limit the others: Congress approves appointments and budgets; the President vetoes legislation (Congress can override); the Supreme Court strikes unconstitutional acts. No branch can fully dominate government — by constitutional design.",
        type: "principle",
      },
      {
        title: "19th Amendment — Women&#39;s Suffrage",
        description:
          "The right of citizens to vote shall not be denied or abridged on account of sex. Ratified August 18, 1920 after a 72-year suffrage movement, enfranchising approximately 26 million women.",
        type: "right",
        year: 1920,
      },
      {
        title: "Amendment Process — Article V",
        description:
          "Amendments require two-thirds approval in both chambers of Congress and ratification by three-fourths (38 of 50) of state legislatures, or via a constitutional convention called by two-thirds of states — a deliberately high bar that has kept the document to 27 amendments in 235 years.",
        type: "principle",
      },
    ],
  },
  cn: {
    name: "Constitution of the People&#39;s Republic of China",
    adopted: 1982,
    lastAmended: 2018,
    type: "Unitary One-Party Socialist State",
    ideology: [
      "Marxism-Leninism",
      "Mao Zedong Thought",
      "Deng Xiaoping Theory",
      "Socialism with Chinese Characteristics",
      "Xi Jinping Thought on Socialism",
      "People&#39;s Democratic Centralism",
    ],
    summary:
      "The PRC&#39;s fourth constitution since 1949 (following versions in 1954, 1975, and 1978), the 1982 constitution has been amended five times, most significantly in 2018, when presidential term limits were abolished and Xi Jinping Thought was added to the Preamble. It combines Soviet-style socialist structure with uniquely Chinese characteristics and CCP supremacy over all state organs.",
    articles: [
      {
        title: "Preamble — CCP Leadership (2018 Amendment)",
        description:
          "The 2018 amendment inserted the phrase \'the leadership of the Communist Party of China\' as a defining feature of Chinese socialism directly into the Preamble — making Party leadership a core constitutional principle immune from challenge. This amendment also removed the two-term presidential limit.",
        type: "doctrine",
        year: 2018,
      },
      {
        title: "Article 1 — People&#39;s Democratic Dictatorship",
        description:
          "The People&#39;s Republic of China is a socialist state under the people&#39;s democratic dictatorship led by the working class and based on the alliance of workers and peasants. The socialist system is the basic system of the PRC — no organization or individual may sabotage it.",
        type: "principle",
      },
      {
        title: "Article 2 — All Power Belongs to the People",
        description:
          "All power in the PRC belongs to the people. The National People&#39;s Congress (NPC) and local People&#39;s Congresses are the organs through which the people exercise state power. In practice, the NPC operates under CCP direction and typically ratifies decisions made by the Party&#39;s Politburo Standing Committee.",
        type: "principle",
      },
      {
        title: "National People&#39;s Congress — Highest State Organ",
        description:
          "The NPC is China&#39;s national legislature with 2,977 deputies serving 5-year terms. It elects the President, approves the Premier and State Council, ratifies constitutional amendments (by two-thirds majority), and adopts the national budget. Sessions are held annually and last approximately two weeks.",
        type: "structure",
      },
      {
        title: "State Council — Executive Authority",
        description:
          "The State Council (cabinet) is the highest state administrative organ, led by the Premier. It implements NPC legislation, formulates economic planning, directs ministries and provincial governments, and manages foreign relations under CCP Politburo oversight.",
        type: "structure",
      },
      {
        title: "Article 15 — Socialist Market Economy",
        description:
          "The state practices a socialist market economy, upholding the basic economic system with public ownership as the dominant form while allowing diverse forms of ownership to develop together. The 1993 amendment replaced \'planned economy\' with \'socialist market economy,\' reflecting Deng&#39;s reforms.",
        type: "doctrine",
      },
      {
        title: "Article 35 — Citizens&#39; Freedoms",
        description:
          "Citizens enjoy freedom of speech, the press, assembly, association, procession, and demonstration. These rights are subject to restrictions under national security, social order, and other laws — in practice, the Great Firewall censors internet content and public protests require prior authorization.",
        type: "right",
      },
      {
        title: "One Country, Two Systems — Article 31",
        description:
          "The state may establish Special Administrative Regions when necessary. Hong Kong (1997) and Macau (1999) operate under \'one country, two systems\' frameworks — maintaining separate legal, economic, and political systems until 2047 and 2049 respectively, though the 2020 National Security Law altered Hong Kong&#39;s autonomy significantly.",
        type: "principle",
      },
      {
        title: "National Supervision Commission (2018)",
        description:
          "The 2018 amendment created a fourth branch of state power — the National Supervision Commission — which merged Party anti-corruption bodies (Central Commission for Discipline Inspection) with state supervisory functions, giving it authority over all public officials including non-Party members.",
        type: "structure",
        year: 2018,
      },
      {
        title: "Article 36 — Freedom of Religion",
        description:
          "Citizens enjoy freedom of religious belief. The state protects \'normal religious activities.\' In practice, only five religions are officially recognized (Buddhism, Taoism, Islam, Catholicism, Protestantism) and must operate under state-approved patriotic associations. Tibetan Buddhism and Uyghur Islam face heightened restrictions.",
        type: "right",
      },
      {
        title: "Article 18 — Foreign Investment",
        description:
          "The PRC permits foreign enterprises, other foreign economic organizations, and individual foreigners to invest in China and enter into various forms of economic cooperation with Chinese enterprises and other economic organizations. Forms the constitutional basis for special economic zones and foreign joint ventures.",
        type: "doctrine",
      },
      {
        title: "Ethnic Regional Autonomy — Article 4",
        description:
          "All nationalities are equal. Regional autonomy is practiced in areas with concentrated minority populations. China recognizes 55 ethnic minorities alongside the Han majority, with 5 autonomous regions (Tibet, Xinjiang, Inner Mongolia, Guangxi, Ningxia) holding nominal self-governance rights.",
        type: "principle",
      },
    ],
  },
  de: {
    name: "Basic Law for the Federal Republic of Germany (Grundgesetz)",
    adopted: 1949,
    lastAmended: 2020,
    type: "Federal Parliamentary Democratic Republic",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Social Market Economy",
      "Constitutional Patriotism",
      "Human Dignity",
      "Militant Democracy",
    ],
    summary:
      "Drafted in 1948–49 as a deliberate response to the Nazi era, the Grundgesetz was intended as a temporary document pending German reunification. When reunification came in 1990, it became the permanent constitution of all Germany. Its design reflects \'militant democracy\' — a constitution explicitly armed against its own destruction, with unamendable core provisions and mechanisms to ban political parties threatening the democratic order.",
    articles: [
      {
        title: "Article 1 — Human Dignity (Unamendable)",
        description:
          "Human dignity shall be inviolable. To respect and protect it shall be the duty of all state authority. The German people therefore acknowledge inviolable and inalienable human rights as the basis of every community, of peace and of justice in the world. This article cannot be amended — ever.",
        type: "right",
      },
      {
        title: "Article 20 — Constitutional Pillars (Unamendable)",
        description:
          "Germany is a democratic and social federal state. All state authority is derived from the people. The legislature is bound by the constitutional order; the executive and judiciary are bound by law and justice. The right of resistance against unconstitutional seizure of state power is explicitly granted. This article is also permanently unamendable.",
        type: "principle",
      },
      {
        title: "Eternity Clause — Article 79(3)",
        description:
          "Amendments to the Basic Law shall be inadmissible if they affect the division of the Federation into Länder, the participation of the Länder in legislation, or the principles laid down in Articles 1 and 20. This makes Germany&#39;s core constitutional identity — federal, democratic, respectful of human dignity — literally unconstitutionable to remove.",
        type: "principle",
      },
      {
        title: "Bundestag — Federal Parliament",
        description:
          "The Bundestag is Germany&#39;s primary legislative chamber, elected every 4 years by a mixed-member proportional system. The \'5% threshold\' prevents small parties from fragmenting parliament. The Bundestag elects the Federal Chancellor, who leads government — making Germany a parliamentary (not presidential) republic.",
        type: "structure",
      },
      {
        title: "Bundesrat — Federal Council",
        description:
          "The Bundesrat represents the 16 Länder in federal legislation. State governments send ministers (not separately elected delegates) as members. Legislation affecting Länder (roughly 60% of all federal law) requires Bundesrat approval — giving states substantial input over national policy.",
        type: "structure",
      },
      {
        title: "Constructive Vote of No Confidence — Article 67",
        description:
          "The Bundestag can remove a Chancellor only by simultaneously electing a successor with absolute majority. This \'constructive\' mechanism was designed to prevent the governmental instability of Weimar Republic, where parliament could topple governments without agreeing on replacements.",
        type: "principle",
      },
      {
        title: "Federal Constitutional Court (Bundesverfassungsgericht)",
        description:
          "Germany&#39;s dedicated constitutional court, based in Karlsruhe, can ban political parties threatening the free democratic basic order (used against neo-Nazi and far-left parties), review all legislation for constitutionality, and adjudicate federalism disputes. Its judgments are legally binding on all state organs.",
        type: "structure",
      },
      {
        title: "Social State Principle — Article 20",
        description:
          "Germany is constitutionally a \'social state\' (Sozialstaat), obligating the government to provide social security, equalize living conditions across regions (Länderfinanzausgleich), and ensure citizens&#39; basic needs are met. The Federal Constitutional Court derives a constitutional right to a subsistence minimum from Articles 1 and 20.",
        type: "doctrine",
      },
      {
        title: "Article 16a — Right of Asylum",
        description:
          "Persons persecuted on political grounds shall have the right of asylum. Germany&#39;s asylum protections are constitutionally enshrined, though the 1993 amendment introduced the \'safe country of origin\' rule limiting claims. Germany has historically accepted the most asylum seekers of any EU member state.",
        type: "right",
      },
      {
        title: "Article 5 — Freedom of Expression & Press",
        description:
          "Every person shall have the right freely to express and disseminate their opinions in speech, writing and pictures, and to inform themselves without hindrance from generally accessible sources. Freedom of the press and freedom of reporting by broadcasts and films shall be guaranteed. Limits exist for protection of youth and personal honor.",
        type: "right",
      },
      {
        title: "Article 14 — Property Rights & Social Obligation",
        description:
          "Property and the right of inheritance are guaranteed. Their content and limits shall be defined by law. Property entails obligations — its use shall also serve the public good. Expropriation is permitted only for the public good and upon just compensation. A uniquely balanced articulation of property rights with social responsibility.",
        type: "right",
      },
      {
        title: "European Integration — Article 23",
        description:
          "With a view to establishing a united Europe, Germany shall participate in the development of the European Union. The Bundestag and Bundesrat must be involved in EU matters. The Federal Constitutional Court can review whether EU acts exceed transferred powers (ultra vires review), as in the landmark PSPP judgment (2020).",
        type: "doctrine",
      },
    ],
  },
  gb: {
    name: "Constitution of the United Kingdom (Uncodified)",
    adopted: 1215,
    lastAmended: 2011,
    type: "Constitutional Parliamentary Monarchy",
    ideology: [
      "Parliamentary Sovereignty",
      "Common Law Constitutionalism",
      "Constitutional Monarchy",
      "Liberal Democracy",
      "Rule of Law",
      "Gradualism",
    ],
    summary:
      "The UK is one of only three countries (alongside Israel and New Zealand) without a single codified constitutional document. Its constitution is a living, evolving collection of statute law, common law precedent, constitutional conventions, and foundational historic documents. Parliamentary sovereignty — the principle that Parliament is supreme and can pass any law — is its central doctrine, increasingly qualified by European human rights norms even after Brexit.",
    articles: [
      {
        title: "Magna Carta (1215)",
        description:
          "Sealed by King John at Runnymede, Magna Carta established that the sovereign is subject to the rule of law. Clause 39 provided: \'No free man shall be seized, imprisoned, dispossessed, outlawed, exiled, or harmed in any way... except by the lawful judgment of his peers or by the law of the land.\' Four clauses remain on the statute book today.",
        type: "principle",
        year: 1215,
      },
      {
        title: "Petition of Right (1628)",
        description:
          "Charles I was forced to accept that taxation required parliamentary consent, that soldiers could not be billeted in private homes, that martial law could not be imposed in peacetime, and that imprisonment required cause shown. A transitional document linking medieval constraints on monarchy to modern constitutionalism.",
        type: "right",
        year: 1628,
      },
      {
        title: "Bill of Rights (1689)",
        description:
          "Following the Glorious Revolution, William and Mary accepted that: Parliament must be called regularly; parliamentary debates are immune from prosecution (freedom of speech in Parliament); taxation requires parliamentary consent; standing armies in peacetime require parliamentary approval; excessive bail, fines, and cruel punishments are prohibited. Directly influenced the American Bill of Rights.",
        type: "right",
        year: 1689,
      },
      {
        title: "Act of Union (1707) — Parliament of Great Britain",
        description:
          "United the Scottish and English parliaments into a single Parliament of Great Britain, creating the Kingdom of Great Britain. Scotland retained its separate legal system (Scots law, Presbyterian Church), and 45 Scottish MPs joined the Commons. Foundational to the UK&#39;s constitutional identity and the basis for ongoing Scottish independence debate.",
        type: "structure",
        year: 1707,
      },
      {
        title: "Parliamentary Sovereignty — Dicey&#39;s Doctrine",
        description:
          "Constitutionalist A.V. Dicey (1885) described parliamentary sovereignty as Parliament&#39;s right to make or unmake any law, with no body able to override or disregard its acts. While formally absolute, this doctrine is qualified in practice by EU retained law (post-Brexit), the Human Rights Act, and devolution settlements.",
        type: "doctrine",
      },
      {
        title: "Constitutional Conventions",
        description:
          "Uncodified but binding political norms: the Prime Minister must command a Commons majority; the monarch acts on ministerial advice; the House of Lords does not block manifesto commitments (Salisbury Convention). These conventions are enforced by political sanction, not courts — a uniquely British constitutional mechanism.",
        type: "principle",
      },
      {
        title: "Human Rights Act 1998",
        description:
          "Incorporated the European Convention on Human Rights into domestic UK law, allowing citizens to enforce Convention rights in British courts without going to Strasbourg. Courts may issue \'declarations of incompatibility\' if legislation breaches Convention rights, but cannot strike down Acts of Parliament — preserving parliamentary sovereignty.",
        type: "right",
        year: 1998,
      },
      {
        title: "Scotland Act 1998 — Devolution",
        description:
          "Created the Scottish Parliament with primary legislative powers over devolved matters (health, education, justice, housing) and, since 2016, some tax-varying powers. The fundamental principle of the devolution settlements is that Westminster retains sovereignty but has permanently altered the UK&#39;s constitutional landscape.",
        type: "structure",
        year: 1998,
      },
      {
        title: "Fixed-term Parliaments Act 2011 (Repealed 2022)",
        description:
          "Attempted to codify 5-year fixed parliamentary terms, removing the Prime Minister&#39;s prerogative to call early elections. Repealed by the Dissolution and Calling of Parliament Act 2022, which restored royal prerogative to dissolve Parliament on Prime Ministerial advice — illustrating how UK constitutional arrangements can be rapidly altered by simple statute.",
        type: "structure",
        year: 2011,
      },
      {
        title: "Rule of Law — Separation of Powers",
        description:
          "The Constitutional Reform Act 2005 created a Supreme Court (replacing the Law Lords in the House of Lords), reinforcing judicial independence. The Lord Chancellor&#39;s judicial functions were transferred to the Lord Chief Justice. UK&#39;s separation of powers is less strict than U.S. — Cabinet Ministers sit in Parliament, for example.",
        type: "principle",
        year: 2005,
      },
      {
        title: "European Union (Withdrawal) Act 2018 — Brexit",
        description:
          "Repealed the European Communities Act 1972 and ended the supremacy of EU law in the UK. Created \'retained EU law\' giving continuity to existing EU-derived legislation. The most significant constitutional change since 1707, raising fundamental questions about parliamentary sovereignty, Northern Ireland (Protocol/Windsor Framework), and Scottish independence.",
        type: "doctrine",
        year: 2018,
      },
    ],
  },
  fr: {
    name: "Constitution of the Fifth French Republic",
    adopted: 1958,
    lastAmended: 2008,
    type: "Unitary Semi-Presidential Republic",
    ideology: [
      "Republicanism",
      "Laïcité (Secularism)",
      "Liberté-Égalité-Fraternité",
      "Gaullism",
      "Indivisibility of the Republic",
      "Popular Sovereignty",
    ],
    summary:
      "France&#39;s current constitution — its fifth since the Revolution — was drafted under Charles de Gaulle and approved by referendum (79.25%) on September 28, 1958. It created a strong presidency to end the chronic governmental instability of the Fourth Republic (25 governments in 12 years). The constitutional bloc also includes the 1789 Declaration of Rights, the 1946 Preamble, and the Charter for the Environment (2004).",
    articles: [
      {
        title: "Article 1 — Republican Principles",
        description:
          "France is an indivisible, secular, democratic and social Republic. It shall ensure the equality of all citizens before the law, without distinction of origin, race or religion. The Republic&#39;s motto is Liberté, Égalité, Fraternité. Its principle is government of the people, by the people, and for the people.",
        type: "principle",
      },
      {
        title: "Laïcité — Constitutional Secularism",
        description:
          "France&#39;s strict separation of church and state — encoded in the 1905 Law on Separation of Churches and State and incorporated into constitutional identity. The state neither recognizes nor funds religious organizations (with Alsace-Moselle exceptions). Laïcité prohibits religious symbols in public schools (2004 law) and face coverings in public spaces (2010 law).",
        type: "doctrine",
      },
      {
        title: "Title II — The President of the Republic",
        description:
          "The President is elected directly by universal suffrage to a 5-year term (rénovation from 7 years, reduced by 2000 referendum). Key powers: appoints the Prime Minister, presides over the Council of Ministers, may dissolve the National Assembly, call referendums, and invoke emergency powers under Article 16. Enjoys immunity from criminal prosecution while in office.",
        type: "structure",
      },
      {
        title: "Article 16 — Emergency Powers",
        description:
          "When the institutions of the Republic, the independence of the Nation, the integrity of its territory or the fulfilment of its international commitments are threatened, the President may take extraordinary measures after consulting the Prime Minister, Parliament, and Constitutional Council. De Gaulle exercised this power once in 1961 during the Algerian crisis — for 5 months.",
        type: "doctrine",
      },
      {
        title: "Prime Minister and the Government",
        description:
          "The Prime Minister directs the Government&#39;s actions and is responsible to the National Assembly. In \'cohabitation\' periods (1986-88, 1993-95, 1997-2002), a President and Prime Minister of opposing parties must govern together — a uniquely French constitutional dynamic. The PM can be ousted by a motion of censure but not directly by the President.",
        type: "structure",
      },
      {
        title: "National Assembly — Fifth Republic Parliament",
        description:
          "577 deputies elected by two-round majority voting to 5-year terms. Any candidate achieving over 50% of votes cast (with at least 25% of registered voters) wins outright; otherwise a second round is held. The Assembly controls the budget, can amend and reject legislation, and holds the government accountable via questions and censure motions.",
        type: "structure",
      },
      {
        title: "Constitutional Council — Conseil Constitutionnel",
        description:
          "Created by the 1958 Constitution as a specialized constitutional review body (not a supreme court). Nine members serving 9-year non-renewable terms (Presidents of Republic, Senate, and Assembly each appoint three). Until 2008, only parliamentarians could refer laws to it. A 2008 reform created the \'question prioritaire de constitutionnalité\' (QPC), allowing individuals to challenge laws via courts.",
        type: "structure",
      },
      {
        title: "Declaration of the Rights of Man and the Citizen (1789)",
        description:
          "Incorporated into the constitutional bloc by the 1958 Preamble. Its 17 articles enshrine: men are born free and equal in rights; sovereignty resides in the nation; liberty is the ability to do anything that does not harm another; taxation requires consent through representatives; freedom of opinion and the press is one of the most precious rights of man.",
        type: "right",
        year: 1789,
      },
      {
        title: "Preamble of 1946 — Social and Economic Rights",
        description:
          "The 1946 Preamble (Fourth Republic) is incorporated into the constitutional bloc and recognizes: right to work and join a union; right to strike; right to participate in management of enterprises; right to health protection; right to material security for those unable to work; free and equal access to education at all levels.",
        type: "right",
        year: 1946,
      },
      {
        title: "Charter for the Environment (2004)",
        description:
          "France became the first country to incorporate an environmental charter into its constitutional bloc. It recognizes: the right to live in a balanced and health-conscious environment; the precautionary principle (states may delay action to prevent risk of serious harm); and the duty to participate in preservation and improvement of the environment.",
        type: "doctrine",
        year: 2004,
      },
      {
        title: "Article 89 — Constitutional Amendment",
        description:
          "Amendments must be approved by both chambers of Parliament (same wording) then either by three-fifths majority in a joint session (Congrès) or by referendum. The Republican form of government shall not be subject to amendment. Constitutional revisions since 1958 number 24 — most without referendum, approved by the Congrès at Versailles.",
        type: "principle",
      },
    ],
  },
  jp: {
    name: "Constitution of Japan (Nihonkoku Kenpō)",
    adopted: 1947,
    type: "Constitutional Parliamentary Monarchy",
    ideology: [
      "Pacifism",
      "Liberal Democracy",
      "Parliamentary Sovereignty",
      "Popular Sovereignty",
      "Respect for Fundamental Human Rights",
      "International Cooperation",
    ],
    summary:
      "Drafted primarily by American lawyers in MacArthur&#39;s GHQ during the U.S. occupation and promulgated on November 3, 1946, Japan&#39;s constitution came into effect May 3, 1947. In 78 years it has never once been amended — the only major democratic constitution to hold this distinction. Its Article 9 pacifist clause creates an ongoing constitutional debate as Japan&#39;s Self-Defense Forces have grown into a substantial military force.",
    articles: [
      {
        title: "Article 1 — The Emperor as Symbol",
        description:
          "The Emperor shall be the symbol of the State and of the unity of the People, deriving his position from the will of the people with whom resides sovereign power. A dramatic transformation from the Meiji Constitution where the Emperor was sovereign and \'sacred and inviolable.\' The Emperor performs state ceremonial functions (opening the Diet, receiving ambassadors) with Cabinet advice.",
        type: "structure",
      },
      {
        title: "Article 9 — Renunciation of War",
        description:
          "Aspiring sincerely to an international peace based on justice and order, the Japanese people forever renounce war as a sovereign right of the nation and the threat or use of force as means of settling international disputes. Paragraph 2: war potential shall never be maintained. The right of belligerency of the state will not be recognized. Japan&#39;s Self-Defense Forces (300,000+ personnel, ¥6.8T defense budget) exist in legal tension with this article.",
        type: "doctrine",
      },
      {
        title: "Chapter III — Rights and Duties of the People",
        description:
          "39 articles covering fundamental rights: freedom of thought and conscience (Article 19), freedom of religion (20), freedom of assembly/association/speech/press (21), academic freedom (23), right to minimum standards of wholesome and cultured living (25), right to receive equal education (26), right and obligation to work (27), right to organize and bargain collectively (28).",
        type: "right",
      },
      {
        title: "Article 14 — Equality Under the Law",
        description:
          "All of the people are equal under the law and there shall be no discrimination in political, economic or social relations because of race, creed, sex, social status or family origin. The Imperial House system itself sits in tension with this principle, as membership is hereditary, male-only, and subject to special Imperial House Law provisions.",
        type: "right",
      },
      {
        title: "The National Diet — Highest Organ of State Power",
        description:
          "Article 41 declares the Diet the highest organ of state power and the sole law-making organ. It is bicameral: the House of Representatives (465 members, 4-year terms) and the House of Councillors (248 members, 6-year terms). The lower house can override upper house rejection with a two-thirds majority on legislation and a simple majority on budget and treaties.",
        type: "structure",
      },
      {
        title: "Cabinet and Prime Minister — Article 65-75",
        description:
          "Executive power is vested in the Cabinet, headed by the Prime Minister who is elected by the Diet (not by popular vote). The Cabinet is collectively responsible to the Diet and the PM may be removed by a no-confidence vote in the House of Representatives. Japan has had 35 Prime Ministers since 1947, averaging under 2.5 years per premier.",
        type: "structure",
      },
      {
        title: "Supreme Court — Article 81",
        description:
          "The Supreme Court is the court of last resort, with the power to determine the constitutionality of any law, order, regulation, or official act. Unlike the U.S., judicial review is rare in Japan — in 78 years the Supreme Court has struck down legislation as unconstitutional only approximately 12 times, reflecting judicial deference to the Diet.",
        type: "structure",
      },
      {
        title: "Article 25 — Right to Minimum Standards of Living",
        description:
          "All people shall have the right to maintain the minimum standards of wholesome and cultured living. In all spheres of life, the State shall use its endeavors for the promotion and extension of social welfare and security, and of public health. Foundation for Japan&#39;s universal healthcare system and comprehensive social security programs.",
        type: "right",
      },
      {
        title: "Article 76 — Judicial Independence",
        description:
          "The whole judicial power is vested in a Supreme Court and in such inferior courts as are established by law. No extraordinary tribunal shall be established; executive organs or agencies shall not be given final judicial power. All judges shall be independent in the exercise of their conscience and shall be bound only by the Constitution and the laws.",
        type: "principle",
      },
      {
        title: "Article 96 — Amendment Process",
        description:
          "Amendments require concurrent approval of two-thirds of all members of each house of the Diet, followed by ratification in a popular referendum by majority of all votes cast. In 78 years, no amendment has achieved the required Diet supermajority — partly because LDP and opposition have disagreed on changes, particularly to Article 9.",
        type: "principle",
      },
      {
        title: "Article 15 — Right to Choose Public Officials",
        description:
          "The people have the inalienable right to choose their public officials and to dismiss them. Universal adult suffrage is guaranteed in elections of public officials. Voting age was lowered from 20 to 18 in 2016. Japan employs both single-member district plurality and proportional representation electoral systems.",
        type: "right",
      },
    ],
  },
  in: {
    name: "Constitution of India",
    adopted: 1950,
    lastAmended: 2019,
    type: "Sovereign Socialist Secular Democratic Republic",
    ideology: [
      "Democratic Socialism",
      "Secularism",
      "Parliamentary Democracy",
      "Cooperative Federalism",
      "Social Justice (Ambedkarism)",
      "Non-Alignment",
    ],
    summary:
      "The world&#39;s longest written national constitution, with 448 articles, 12 schedules, 5 appendices, and 105 amendments. Drafted in 2 years, 11 months and 17 days by a Constituent Assembly chaired by B.R. Ambedkar, it came into force January 26, 1950 (Republic Day). Drawing from the Government of India Act 1935, the U.S., Irish, Canadian, and Australian constitutions, it was designed to hold a vast, diverse nation together through constitutional democracy and social transformation.",
    articles: [
      {
        title: "Preamble — The Constitutional Vision",
        description:
          "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE—social, economic, and political; LIBERTY of thought, expression, belief, faith and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation. \'Socialist\' and \'Secular\' were added in the 42nd Amendment (1976).",
        type: "principle",
      },
      {
        title: "Part III — Fundamental Rights (Articles 12-35)",
        description:
          "Six categories: (1) Right to Equality (Articles 14–18) — equality before law, no discrimination on religion/race/caste/sex. (2) Right to Freedom (19–22) — speech, assembly, movement, profession; protection against arbitrary arrest. (3) Right Against Exploitation (23–24) — no forced labor, no child labor under 14. (4) Right to Freedom of Religion (25–28). (5) Cultural and Educational Rights (29–30) — minority institutions. (6) Right to Constitutional Remedies (32) — Ambedkar called Article 32 \'the heart and soul of the Constitution.\'",
        type: "right",
      },
      {
        title:
          "Part IV — Directive Principles of State Policy (Articles 36-51)",
        description:
          "Non-justiciable socioeconomic guidelines drawing from the Irish constitution. Directives include: equal pay for equal work; right to work, education, public assistance; free legal aid; living wage; participation in management; uniform civil code (Article 44, a politically contentious provision); organization of village panchayats; protection of environment.",
        type: "doctrine",
      },
      {
        title: "Part IVA — Fundamental Duties (Article 51A)",
        description:
          "Added by 42nd Amendment (1976): citizens shall cherish sovereignty, national symbols, and constitutional values; protect national heritage; promote harmony; protect environment; develop scientific temper; safeguard public property; strive for excellence. Eleven duties added to balance rights with responsibilities. Not directly enforceable but courts use them in interpretation.",
        type: "principle",
        year: 1976,
      },
      {
        title: "Union and State Legislature — Parliament",
        description:
          "India&#39;s Parliament comprises: Rajya Sabha (Council of States, 245 members, 6-year terms, elected by state legislatures plus 12 Presidential nominees) and Lok Sabha (House of the People, 543 elected members, 5-year terms). The Prime Minister, who commands Lok Sabha majority, heads the Cabinet. A money bill (Article 110) can only originate in the Lok Sabha.",
        type: "structure",
      },
      {
        title: "Quasi-Federal Structure with Strong Centre",
        description:
          "India&#39;s federalism is asymmetric: the Union List (97 subjects — defence, foreign affairs, banking), State List (66 subjects — police, agriculture, public health), and Concurrent List (47 subjects — education, forests, electricity). In case of conflict, Union law prevails. The Centre can assume state subjects in national emergency or if directed by Rajya Sabha resolution.",
        type: "structure",
      },
      {
        title: "Article 356 — President&#39;s Rule",
        description:
          "If the President is satisfied that the government of a state cannot be carried on in accordance with the provisions of the Constitution, s/he may impose President&#39;s Rule, dismissing the state government and dissolving the Assembly. Has been invoked 100+ times since 1950 — frequently misused for political purposes until S.R. Bommai case (1994) established judicial review of proclamations.",
        type: "doctrine",
      },
      {
        title: "Articles 124-147 — Independent Judiciary",
        description:
          "The Supreme Court consists of the Chief Justice and up to 33 other judges (appointed by the collegium system — a Supreme Court judges\' body that recommends appointments, controversially bypassing executive control). Original jurisdiction: disputes between states or between states and Union. Appellate jurisdiction over High Courts. Writ jurisdiction to enforce Fundamental Rights.",
        type: "structure",
      },
      {
        title: "Articles 14-18 — Right to Equality",
        description:
          "Article 14: equality before law. Article 15: no discrimination on grounds of religion, race, caste, sex, or place of birth (with affirmative action exemptions under Articles 15(4) and 16(4)). Article 17: untouchability is abolished and its practice in any form is forbidden. Article 18: no titles shall be conferred by the State (except military/academic distinctions).",
        type: "right",
      },
      {
        title:
          "Scheduled Castes, Tribes & Other Backward Classes — Reservations",
        description:
          "Articles 15(4), 16(4), 330, and 332 provide for reservations (affirmative action quotas) in educational institutions, government employment, and Parliamentary seats for Scheduled Castes (15–16% reserved), Scheduled Tribes (7.5%), and OBCs (27%). The 103rd Amendment (2019) added 10% EWS (economically weaker sections) reservation, upheld by the Supreme Court in 2022.",
        type: "doctrine",
        year: 2019,
      },
      {
        title: "Article 370 — J&K Special Status (Abrogated 2019)",
        description:
          "Granted Jammu and Kashmir special autonomous status, applying only specific provisions of the Indian Constitution unless J&K&#39;s own Constituent Assembly concurred. Abrogated by Presidential Order on August 5, 2019, reorganizing J&K into two Union Territories: J&K (with legislature) and Ladakh (without legislature). Upheld by Supreme Court December 2023 as constitutional.",
        type: "principle",
        year: 2019,
      },
      {
        title: "Amendment Process — Article 368",
        description:
          "The Constitution can be amended by a special majority of Parliament (two-thirds of members present and voting + majority of total members of each house). Amendments affecting federal structure also require ratification by half of state legislatures. The Basic Structure Doctrine (Kesavananda Bharati, 1973) holds that Parliament cannot amend the \'basic structure\' — democracy, federalism, secular character, separation of powers.",
        type: "principle",
      },
    ],
  },
  au_oc: {
    name: "Constitution of Australia",
    adopted: 1901,
    lastAmended: 1977,
    type: "Federal Parliamentary Constitutional Monarchy",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Westminster Parliamentarism",
      "Constitutional Monarchy",
      "Rule of Law",
      "Responsible Government",
    ],
    summary:
      "The Commonwealth of Australia Constitution Act was passed by the British Parliament and came into effect on 1 January 1901, federating six colonies into one nation. Australia operates under a Westminster-style parliamentary system with the British monarch as head of state (represented by the Governor-General). It has been amended only eight times via referendum — a deliberately high bar requiring both a national majority and majorities in at least four of six states.",
    articles: [
      {
        title: "Chapter I — The Parliament",
        description:
          "Legislative power is vested in a Federal Parliament comprising the Queen (King), the Senate (76 senators, 12 per state + 2 per territory), and the House of Representatives (151 members). Bills must pass both chambers. The Senate provides equal state representation regardless of population.",
        type: "structure",
      },
      {
        title: "Chapter II — The Executive Government",
        description:
          "Executive power is formally vested in the King and exercised by the Governor-General as the King's representative. In practice, the Prime Minister and Cabinet (who must hold parliamentary confidence) exercise executive power — a Westminster convention not written in the text.",
        type: "structure",
      },
      {
        title: "Section 51 — Legislative Powers of the Parliament",
        description:
          "Lists 39 specific subject matters on which the Commonwealth Parliament may legislate, including trade and commerce, taxation, defence, immigration, and external affairs. Residual powers not listed belong to the states.",
        type: "principle",
      },
      {
        title: "Section 92 — Freedom of Interstate Trade",
        description:
          "Trade and commerce among the states shall be absolutely free — a provision that has generated extensive High Court jurisprudence and is the closest the Constitution comes to a general economic freedom guarantee.",
        type: "right",
      },
      {
        title: "Section 116 — Freedom of Religion",
        description:
          "The Commonwealth shall not make any law establishing any religion, imposing any religious observance, or prohibiting the free exercise of any religion. Unlike the U.S., this applies only to federal (not state) laws.",
        type: "right",
      },
      {
        title: "Section 128 — Amendment Procedure",
        description:
          "Constitutional amendments require an absolute majority in both Houses of Parliament, then approval in a national referendum by a double majority: a national majority of voters AND majorities in at least four of six states. Of 44 referendums held, only eight have passed.",
        type: "principle",
      },
    ],
  },
  ca: {
    name: "Constitution Act, 1982 (& Constitution Act, 1867)",
    adopted: 1867,
    lastAmended: 1982,
    type: "Federal Parliamentary Constitutional Monarchy",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Bilingualism",
      "Constitutional Monarchy",
      "Multiculturalism",
      "Charter Rights",
    ],
    summary:
      "Canada's constitution has two foundational documents: the Constitution Act, 1867 (formerly the British North America Act), which established Confederation and the federal structure, and the Constitution Act, 1982, which patriated the constitution from Britain and added the Canadian Charter of Rights and Freedoms. Canada operates as a Westminster parliamentary democracy with the British King as head of state represented by the Governor-General.",
    articles: [
      {
        title: "Canadian Charter of Rights and Freedoms (1982)",
        description:
          "Part I of the Constitution Act, 1982 guarantees fundamental freedoms (conscience, expression, assembly, association), democratic rights (voting), mobility rights (movement between provinces), legal rights (fair trial, unreasonable search protection), equality rights (Section 15 — no discrimination on enumerated grounds), and language rights.",
        type: "right",
        year: 1982,
      },
      {
        title: "Section 1 — Reasonable Limits Clause",
        description:
          "The Charter guarantees rights 'subject only to such reasonable limits prescribed by law as can be demonstrably justified in a free and democratic society.' The Oakes Test (1986) established the framework for when the government may lawfully limit Charter rights.",
        type: "principle",
        year: 1982,
      },
      {
        title: "Section 33 — Notwithstanding Clause",
        description:
          "Parliament or a provincial legislature may declare legislation operates 'notwithstanding' Sections 2 and 7-15 of the Charter for a renewable five-year term. Used controversially by Quebec and Ontario governments to override court rulings on language and labour rights.",
        type: "doctrine",
        year: 1982,
      },
      {
        title: "Division of Powers — Sections 91 & 92",
        description:
          "Section 91 lists exclusive federal powers (criminal law, banking, trade, immigration, defence). Section 92 lists exclusive provincial powers (property, civil rights, education, hospitals, municipalities). Concurrent powers exist in agriculture and immigration.",
        type: "structure",
      },
      {
        title: "Section 35 — Aboriginal Rights",
        description:
          "The existing aboriginal and treaty rights of the aboriginal peoples of Canada are hereby recognized and affirmed. Section 35 has been the basis for landmark Supreme Court rulings on Indigenous land title (Delgamuukw, 1997; Tsilhqot'in, 2014) and consultation obligations.",
        type: "right",
        year: 1982,
      },
      {
        title: "Bilingualism — Section 16",
        description:
          "English and French are the official languages of Canada with equal status in Parliament and federal institutions. New Brunswick is the only constitutionally bilingual province. Federal services must be available in both official languages where numbers warrant.",
        type: "doctrine",
        year: 1982,
      },
    ],
  },
  kr: {
    name: "Constitution of the Republic of Korea (Sixth Republic)",
    adopted: 1948,
    lastAmended: 1987,
    type: "Unitary Presidential Constitutional Republic",
    ideology: [
      "Liberal Democracy",
      "Constitutionalism",
      "Market Economy",
      "Human Dignity",
      "Anti-Communism (historical)",
      "Popular Sovereignty",
    ],
    summary:
      "South Korea's current constitution — its ninth since 1948 — was adopted by national referendum on October 29, 1987, following massive pro-democracy demonstrations (the June Struggle). It introduced direct presidential elections, strengthened judicial independence, and limited the president to a single five-year term. The 1987 constitution is widely credited with consolidating South Korea's democratic transition after nearly 30 years of authoritarian rule.",
    articles: [
      {
        title: "Article 1 — Democratic Republic",
        description:
          "The Republic of Korea shall be a democratic republic. The sovereignty of the Republic of Korea shall reside in the people, and all state authority shall emanate from the people.",
        type: "principle",
      },
      {
        title: "Presidential System — Article 66",
        description:
          "The President is the head of state and head of government, elected by direct popular vote for a single non-renewable five-year term. The single-term limit was a key 1987 democratic reform to prevent indefinite rule. The President appoints the Prime Minister with National Assembly consent.",
        type: "structure",
      },
      {
        title: "National Assembly — Unicameral Legislature",
        description:
          "300 members: 254 elected from single-member constituencies + 46 allocated proportionally. Serves 4-year terms. Powers include legislation, budget approval, treaty ratification, and presidential impeachment. The Assembly impeached Presidents Roh Moo-hyun (2004, restored) and Park Geun-hye (2017, upheld) and Yoon Suk-yeol (2024, upheld).",
        type: "structure",
      },
      {
        title: "Constitutional Court — Article 111",
        description:
          "Established in 1987, the Constitutional Court rules on constitutionality of statutes, impeachments, dissolution of political parties, and constitutional complaints by individuals. Nine justices serve 6-year terms. Its rulings have been globally influential in constitutional adjudication.",
        type: "structure",
      },
      {
        title: "Chapter II — Rights and Duties of Citizens",
        description:
          "Guarantees equality before the law (Article 11); right to life and liberty; inviolability of private life; freedom of conscience, religion, speech, press, and assembly (Articles 17-21); right to education; right to work; right to a healthy and pleasant environment; right to property.",
        type: "right",
      },
      {
        title: "Article 119 — Market Economy & Social Regulation",
        description:
          "The economic order of the Republic of Korea shall be based on respect for the freedom and creative initiative of enterprises and individuals in economic affairs. The State may regulate and coordinate economic affairs to maintain the balanced growth and stability of the national economy — the basis for Korea's active industrial policy.",
        type: "doctrine",
      },
    ],
  },
  ae: {
    name: "Constitution of the United Arab Emirates",
    adopted: 1971,
    lastAmended: 2004,
    type: "Federal Absolute Monarchy (Seven Emirates)",
    ideology: [
      "Islamic Governance",
      "Arab Nationalism",
      "Federalism (limited)",
      "Tribal Consultative Governance",
      "Economic Liberalism",
      "Paternalistic Welfare State",
    ],
    summary:
      "The UAE constitution was adopted in 1971 when the seven Trucial States federated upon British withdrawal. It was initially 'provisional' but made permanent in 1996. The Supreme Council of Rulers — the seven hereditary emirs — is the highest federal authority. The constitution balances federal unity with significant emirate autonomy. Abu Dhabi (oil wealth) and Dubai (commerce) hold disproportionate influence within the federation.",
    articles: [
      {
        title: "Supreme Council — Highest Federal Authority",
        description:
          "The Supreme Council of Rulers (seven hereditary emirs) is the highest federal body. It elects the President and Vice President (5-year terms), ratifies federal laws, and approves the Prime Minister. Abu Dhabi's ruler holds the presidency and Dubai's holds the vice-presidency by established convention.",
        type: "structure",
      },
      {
        title: "Federal National Council (FNC)",
        description:
          "The FNC has 40 members: 20 elected by citizens (since 2006) and 20 appointed by rulers. It has advisory (consultative) powers only — it cannot initiate legislation or override executive decisions. The UAE has no fully elected national legislature.",
        type: "structure",
      },
      {
        title: "Article 7 — Islam as State Religion",
        description:
          "Islam is the official religion of the Union. Islamic Sharia is a principal source of legislation. In practice, federal laws blend civil law (for commerce and trade) with Sharia (for family, inheritance, and some criminal matters for Muslims).",
        type: "doctrine",
      },
      {
        title: "Emirate Autonomy",
        description:
          "Each emirate retains sovereignty over matters not expressly delegated to the federal government. Dubai and Abu Dhabi operate separate legal systems including free zones (DIFC, ADGM) that apply English common law with their own courts — creating a uniquely pluralist legal architecture.",
        type: "principle",
      },
      {
        title: "Article 25 — Equality",
        description:
          "All persons are equal before the law, without distinction as to race, nationality, religious belief, or social status. In practice, the 89% non-citizen population has limited rights compared to Emirati citizens, including no path to citizenship.",
        type: "right",
      },
      {
        title: "Article 40 — Foreign Nationals",
        description:
          "Foreign nationals residing in the UAE shall enjoy the rights and bear the public duties provided for in the legislation in force. UAE citizenship requires 30 years of legal residence (or fewer via exceptional naturalization). Non-citizens cannot vote in federal elections.",
        type: "principle",
      },
    ],
  },
  sg: {
    name: "Constitution of the Republic of Singapore",
    adopted: 1965,
    lastAmended: 2023,
    type: "Unitary Parliamentary Constitutional Republic",
    ideology: [
      "Pragmatic Governance",
      "Asian Values",
      "Meritocracy",
      "Multi-Racialism",
      "Rule of Law",
      "Economic Liberalism",
    ],
    summary:
      "Singapore's constitution came into effect on 9 August 1965 upon independence from Malaysia. It draws from the Malayan Federal Constitution, British constitutional conventions, and the Indian constitution. Singapore operates as a parliamentary republic where the People's Action Party (PAP) has governed since independence. Despite formal democratic institutions, the PAP's dominance — aided by electoral rules, defamation suits against opponents, and the Internal Security Act — places Singapore in the 'electoral authoritarian' or 'dominant party democracy' category by most analysts.",
    articles: [
      {
        title: "Presidential Elections — Elected Presidency",
        description:
          "The Elected Presidency (introduced 1991, reformed 2017) gives the President reserve powers to veto use of past reserves and key civil service appointments. The controversial 2017 amendment reserved the 2017 election for Malay candidates if no Malay president had served in the preceding five terms — Halimah Yacob was elected uncontested.",
        type: "structure",
      },
      {
        title: "Parliament — Unicameral",
        description:
          "Parliament has 93 constituency seats + up to 12 Non-Constituency MPs (NCMPs, best-losing opposition candidates) + up to 9 Nominated MPs (NMPs, appointed non-partisan members). The 2025 election saw 10 elected opposition MPs — the most in Singapore's modern history.",
        type: "structure",
      },
      {
        title: "Article 9 — Personal Liberty",
        description:
          "No person shall be deprived of his personal liberty save in accordance with law. The Internal Security Act (ISA) allows detention without trial for up to 2 years (renewable) for national security purposes — a significant exception to this guarantee that the government has used against political opponents and alleged terrorists.",
        type: "right",
      },
      {
        title: "Article 12 — Equal Protection",
        description:
          "All persons are equal before the law and entitled to equal protection of the law. Singapore abolished Section 377A (criminalizing sex between men) in 2022 via constitutional amendment — simultaneously constitutionally protecting the government's existing definition of marriage as between a man and woman.",
        type: "right",
      },
      {
        title: "Meritocracy & CMIO Framework",
        description:
          "Singapore's constitutionalized multiracialism (Chinese, Malay, Indian, Others framework) governs minority rights, housing quotas (racial integration policy), and reserved presidential elections. The framework is intended to prevent racial majoritarianism but critics argue it entrenches racial categories.",
        type: "doctrine",
      },
      {
        title: "Group Representation Constituencies (GRCs)",
        description:
          "Introduced in 1988, GRCs require teams of 3-6 candidates including at least one minority member to contest together. Officially designed to ensure minority representation; critics argue the system advantages the incumbent PAP by requiring opposition parties to field larger, harder-to-coordinate teams.",
        type: "structure",
      },
    ],
  },
  il_as: {
    name: "Basic Laws of Israel (Uncodified)",
    adopted: 1948,
    lastAmended: 2023,
    type: "Unitary Parliamentary Democracy (No Formal Constitution)",
    ideology: [
      "Liberal Democracy",
      "Zionism",
      "Jewish and Democratic State",
      "Parliamentary Sovereignty",
      "Rule of Law",
      "Human Dignity",
    ],
    summary:
      "Israel has no single codified constitution. Instead, a series of Basic Laws — passed by the Knesset since 1958 — serve constitutional functions. The 1992 Basic Laws on Human Dignity and Liberty and on Freedom of Occupation gave the Supreme Court power of judicial review. The 2023 constitutional crisis erupted when the Netanyahu government passed a judicial override law limiting Supreme Court power to strike down government decisions — triggering Israel's largest ever protests (weekly demonstrations of 300,000+) and a constitutional standoff that remains unresolved.",
    articles: [
      {
        title: "Basic Law: Human Dignity and Liberty (1992)",
        description:
          "Protects life, body, and dignity; property rights; personal liberty; privacy; and the right to leave and enter Israel. The Supreme Court derived broad rights protections from this law, interpreting human dignity expansively to cover equality, due process, and other rights not explicitly listed.",
        type: "right",
        year: 1992,
      },
      {
        title: "Basic Law: The Knesset",
        description:
          "The Knesset is a 120-member unicameral parliament elected by proportional representation every four years (or earlier if dissolved). The extremely low 3.25% electoral threshold facilitates coalition governments — Israel has never had a single-party majority government.",
        type: "structure",
      },
      {
        title:
          "Basic Law: Israel as the Nation-State of the Jewish People (2018)",
        description:
          "Passed in July 2018, this Basic Law declares Israel the historic homeland of the Jewish people; Hebrew is the sole official language (Arabic given special status); only Jewish people have the right to national self-determination in Israel. Critics — including Israeli Arabs (21% of citizens) — argue it creates a two-tier citizenship system.",
        type: "doctrine",
        year: 2018,
      },
      {
        title: "Judicial Override Law (2023) — Constitutional Crisis",
        description:
          "The July 2023 amendment to Basic Law: The Judiciary stripped the Supreme Court of its ability to use the 'reasonableness standard' to strike down government decisions. The Supreme Court ruled 8-7 in January 2024 that the law itself was unconstitutional — an unprecedented ruling that the government initially refused to accept, creating a constitutional standoff.",
        type: "doctrine",
        year: 2023,
      },
      {
        title: "No Written Bill of Rights",
        description:
          "Unlike most democracies, Israel has no comprehensive bill of rights. Civil liberties derive primarily from the 1992 Basic Laws and Supreme Court interpretation. Rights can in principle be limited by regular Knesset legislation, subject to proportionality review.",
        type: "principle",
      },
      {
        title: "Attorney General & State Prosecution Independence",
        description:
          "The Attorney General (Menachem Mazuz principle) serves as both government legal adviser and head of prosecution — a unified role that is constitutionally significant. In 2019 AG Avichai Mandelblit indicted PM Netanyahu on corruption charges while serving in office — a constitutionally unprecedented situation.",
        type: "principle",
      },
    ],
  },
  tr: {
    name: "Constitution of the Republic of Turkey",
    adopted: 1982,
    lastAmended: 2017,
    type: "Unitary Presidential Republic",
    ideology: [
      "Kemalist Secularism (historical)",
      "Turkish Nationalism",
      "Presidentialism (post-2017)",
      "Islamic Conservatism (AKP era)",
      "Unitarism",
      "State Authority",
    ],
    summary:
      "Turkey's current constitution was drafted by a military junta following the 1980 coup and adopted by referendum (91.4%) in 1982. It has been amended 19 times. The 2017 constitutional referendum (51.4% for, amid controversy) transformed Turkey from a parliamentary to a presidential republic, eliminating the office of Prime Minister, giving President Erdoğan sweeping executive powers, and taking effect after the 2018 elections. Critics argue it dangerously concentrates power in a single office.",
    articles: [
      {
        title: "2017 Presidential System — Article 104",
        description:
          "The 2017 amendment (effective 2018) made the President: head of state AND head of government; commander-in-chief; able to appoint/remove ministers without parliamentary approval; able to issue presidential decrees; and able to dissolve parliament. Opposition parties and the Venice Commission criticized the system as lacking adequate checks and balances.",
        type: "structure",
        year: 2017,
      },
      {
        title: "Article 2 — Principles of the Republic",
        description:
          "The Republic of Turkey is a democratic, secular and social state governed by the rule of law. Secularism (laiklik, established by Atatürk) is explicitly protected and was a founding pillar. The AKP government has moved toward Islamic conservatism while maintaining formal constitutional secularism.",
        type: "principle",
      },
      {
        title: "Article 24 — Freedom of Religion",
        description:
          "No one shall be compelled to worship or participate in religious ceremonies. Religious education is mandatory in state schools (Islamic in content for Muslim pupils). The Presidency of Religious Affairs (Diyanet) is a state body administering Sunni Islam — illustrating the complex relationship between constitutional secularism and state religion.",
        type: "right",
      },
      {
        title: "Article 26 — Freedom of Expression (Restricted)",
        description:
          "Everyone has the right to express and disseminate his thoughts and opinion by speech, in writing or in pictures. Broad restrictions apply for national security, public order, and 'territorial integrity.' Turkey has repeatedly ranked near the bottom of the RSF World Press Freedom Index. Thousands have been prosecuted under Article 301 (insulting Turkishness) and anti-terrorism laws.",
        type: "right",
      },
      {
        title: "Article 3 — Indivisibility of the State",
        description:
          "The Turkish state, with its territory and nation, is an indivisible entity. This article, combined with Article 26 restrictions, has been used to prosecute Kurdish politicians, journalists, and academics for speech deemed supportive of Kurdish self-determination.",
        type: "doctrine",
      },
      {
        title: "Constitutional Court — Judicial Review",
        description:
          "The Constitutional Court (15 members) reviews legislation and presidential decrees for constitutionality. In 2021 it ruled the Peoples' Democratic Party (HDP, pro-Kurdish) case for closure admissible — the party faces potential closure and 400+ members facing political bans, including former presidential candidate Selahattin Demirtaş.",
        type: "structure",
      },
    ],
  },
  za: {
    name: "Constitution of the Republic of South Africa",
    adopted: 1996,
    lastAmended: 2021,
    type: "Unitary Presidential Constitutional Republic",
    ideology: [
      "Liberal Democracy",
      "Constitutional Supremacy",
      "Human Rights",
      "Non-Racialism",
      "Non-Sexism",
      "Ubuntu (Human Interconnectedness)",
      "Social Justice",
    ],
    summary:
      "South Africa's post-apartheid constitution — in effect since 4 February 1997 — is widely regarded as one of the world's most progressive. Negotiated in the Constitutional Assembly after the 1994 democratic transition, it was described by Nelson Mandela as 'a bridge from the past to the future.' It contains a comprehensive Bill of Rights (Chapter 2), an independent Constitutional Court, and explicit socioeconomic rights — including rights to housing, healthcare, food, water, and social security that courts can enforce.",
    articles: [
      {
        title: "Section 1 — Founding Values",
        description:
          "The Republic of South Africa is one, sovereign, democratic state founded on: human dignity, equality, and freedom; non-racialism and non-sexism; supremacy of the Constitution and the rule of law; universal adult suffrage and multi-party democracy.",
        type: "principle",
      },
      {
        title: "Chapter 2 — Bill of Rights (38 sections)",
        description:
          "The most comprehensive in Africa: equality (including sexual orientation — one of the world's first constitutions to explicitly protect it); human dignity; privacy; freedom of expression, religion, belief and opinion; assembly; environment; property; housing; healthcare, food, water and social security; education; language and culture. Section 36 allows limitations only through general laws of application, to the extent reasonable and justifiable in a democratic society.",
        type: "right",
      },
      {
        title: "Section 26 — Right to Housing",
        description:
          "Everyone has the right to have access to adequate housing. The state must take reasonable legislative and other measures, within available resources, to achieve progressive realization of this right. No one may be evicted without court order. The Constitutional Court in Grootboom (2001) enforced this right — compelling government to provide temporary shelter to evicted families.",
        type: "right",
      },
      {
        title: "Constitutional Court — Section 167",
        description:
          "The apex court for constitutional matters, sitting in Johannesburg (not Pretoria/Bloemfontein). Eleven justices, including the Chief Justice, appointed by the President on advice of the Judicial Service Commission. Only the Constitutional Court may confirm constitutional invalidity declarations by lower courts.",
        type: "structure",
      },
      {
        title: "Section 195 — Public Administration Principles",
        description:
          "Establishes constitutional principles for public administration including: impartial, fair service delivery; accountability; transparency; efficient and cost-effective use of resources; high standards of professional ethics. The State Capture Inquiry (2018–2022) documented systematic violation of these principles under President Zuma.",
        type: "doctrine",
      },
      {
        title: "Section 74 — Amendment (Entrenched Provisions)",
        description:
          "Most provisions require two-thirds majority in both National Assembly and the National Council of Provinces to amend. Section 1 (founding values) and Section 74 itself require a 75% majority. Section 25 (property rights, including expropriation) has been subject to prolonged amendment debates around land reform.",
        type: "principle",
      },
    ],
  },
  ng: {
    name: "Constitution of the Federal Republic of Nigeria",
    adopted: 1999,
    type: "Federal Presidential Constitutional Republic",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Secularism",
      "Multi-Ethnicity (Balancing)",
      "Presidential System",
      "Rule of Law",
    ],
    summary:
      "Nigeria's current constitution was drafted by a military government and came into effect on 29 May 1999 with the inauguration of President Olusegun Obasanjo, ending 16 years of military rule. It is based on the U.S. presidential model and creates a strong federal structure with 36 states and the Federal Capital Territory. Nigeria's federal balance is complicated by the country's 250+ ethnic groups, Christian-Muslim divide (roughly 50/50), and the revenue-sharing disputes over oil wealth predominantly found in the Niger Delta.",
    articles: [
      {
        title: "Section 1 — Supremacy of the Constitution",
        description:
          "This Constitution is supreme and its provisions shall have binding force on the authorities and persons throughout the Federal Republic of Nigeria. Any law inconsistent with it shall, to the extent of the inconsistency, be void.",
        type: "principle",
      },
      {
        title: "Federal Structure — Three Tiers",
        description:
          "Nigeria's federalism has three tiers: Federal Government; 36 States + FCT; and 774 Local Government Areas (constitutionally recognized — unique globally). The Exclusive Legislative List (68 items — defence, external affairs, immigration, shipping, currency) belongs solely to the federal government; the Concurrent List to both.",
        type: "structure",
      },
      {
        title: "Sharia Law — Northern States",
        description:
          "While the constitution declares Nigeria secular, Section 277 allows states to establish Sharia courts for Muslims in personal and civil matters. Since 2000, 12 northern states (including Zamfara, Kano, Kaduna) extended Sharia to criminal matters — creating a dual legal system that has caused significant controversy and intercommunal violence.",
        type: "doctrine",
      },
      {
        title: "Chapter IV — Fundamental Rights",
        description:
          "Right to life (Section 33); right to dignity of the human person (torture prohibition); right to personal liberty; fair hearing; private and family life; freedom of thought, conscience and religion; freedom of expression and the press; peaceful assembly and association; freedom of movement; freedom from discrimination.",
        type: "right",
      },
      {
        title: "Federal Character Principle — Section 14",
        description:
          "The composition of the Government and its agencies shall reflect the federal character of Nigeria with a view to promoting national unity. Federal appointments must reflect Nigeria's diverse character — designed to prevent any region or ethnic group from dominating. Critics argue it prioritizes balance over meritocracy.",
        type: "doctrine",
      },
      {
        title: "Section 308 — Presidential Immunity",
        description:
          "No civil or criminal proceedings shall be instituted or continued against a person to whom this section applies during his period of office. This immunity for the President, Vice-President, State Governors and Deputies has been controversially interpreted to prevent prosecution of officials for acts committed before taking office.",
        type: "principle",
      },
    ],
  },
  eg: {
    name: "Constitution of the Arab Republic of Egypt",
    adopted: 2014,
    lastAmended: 2019,
    type: "Unitary Presidential Republic (De facto Authoritarian)",
    ideology: [
      "Arab Nationalism",
      "Egyptian Nationalism",
      "Islamic Conservatism",
      "Military Predominance",
      "Authoritarianism (current)",
      "Social Contract Welfare",
    ],
    summary:
      "Egypt's current constitution was approved by referendum (98.1%) in January 2014 following the military's removal of elected President Mohamed Morsi in July 2013. A 2019 amendment extended presidential terms from 4 to 6 years, allowed the incumbent President (Sisi) to remain until 2030, and expanded the military's constitutional role. Freedom House, V-Dem, and international human rights organizations classify Egypt as an authoritarian state under Sisi's rule.",
    articles: [
      {
        title: "Article 2 — Islam and Sharia",
        description:
          "Islam is the religion of the state and Arabic its official language. The principles of Islamic Sharia are the principal source of legislation. The Constitutional Supreme Court (SCC) reviews legislation for compliance with Sharia — in practice, this has not significantly limited most modern legislation.",
        type: "doctrine",
      },
      {
        title: "2019 Amendment — Presidential Term Extension",
        description:
          "The 2019 amendments extended presidential terms from 4 to 6 years, allowed Sisi to reset his term count and potentially serve until 2030, constitutionalized the military's 'guardian' role over the democratic system, mandated 25% women's representation in parliament, and created a Senate (Majlis al-Shuyukh).",
        type: "doctrine",
        year: 2019,
      },
      {
        title: "Military's Constitutional Role — Article 200",
        description:
          "The armed forces belong to the people; their mission is to protect the country and preserve its security and the nature of the democratic republican regime and the components of the people's constitution. Critics argue this article constitutionalizes the military as guardians of political order, legitimizing potential future coups.",
        type: "structure",
      },
      {
        title: "Chapter III — Rights and Freedoms",
        description:
          "Extensive formal rights including: personal freedom; privacy; freedom of belief; freedom of thought and opinion; academic freedom; artistic and literary freedom; press freedom. However, the Emergency Law (in effect 2017–2021 and intermittently since), Cybercrime Law (2018), and broad anti-terrorism statutes have severely constrained rights in practice.",
        type: "right",
      },
      {
        title: "Article 87 — Parliamentary Quotas",
        description:
          "The State shall guarantee women's appropriate representation in parliamentary chambers. The 2019 amendment mandated at least 25% women's seats in the House of Representatives — met through appointed seats and electoral quotas.",
        type: "principle",
      },
      {
        title: "Supreme Constitutional Court (SCC)",
        description:
          "Egypt's constitutional court rules on constitutionality, resolves jurisdictional conflicts between courts, and interprets legislation. Under Mubarak and Sisi, the SCC's independence has been limited; its president is appointed by the President of the Republic.",
        type: "structure",
      },
    ],
  },
  ar: {
    name: "National Constitution of the Argentine Republic",
    adopted: 1853,
    lastAmended: 1994,
    type: "Federal Presidential Constitutional Republic",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Constitutionalism",
      "Separation of Powers",
      "Human Rights (post-1994)",
      "Social Rights",
    ],
    summary:
      "Argentina's constitution — one of Latin America's oldest, modeled partly on the U.S. constitution — was adopted in 1853 and substantially reformed in 1994. The 1994 reform (under Menem-Alfonsín pact) introduced direct presidential elections, created the office of Chief of Cabinet, imposed a 4-year presidential term with one re-election limit, elevated international human rights treaties to constitutional status, and created an independent Ombudsman and Auditor General.",
    articles: [
      {
        title: "Article 1 — Federal System",
        description:
          "The Argentine Nation adopts the representative, republican and federal form of government. Argentina's 23 provinces + the Autonomous City of Buenos Aires retain significant autonomy, with residual powers not delegated to the federal government belonging to the provinces.",
        type: "principle",
      },
      {
        title: "Article 36 — Constitutional Defense",
        description:
          "This Constitution shall maintain its empire even when its observance is interrupted by acts of force against the institutional order. Those who instigate interruption shall be held guilty of sedition. Added in 1994 following military coups of 1955, 1966, 1976, and 1983.",
        type: "principle",
        year: 1994,
      },
      {
        title: "Article 75(22) — International Human Rights Treaties",
        description:
          "The 1994 reform elevated 11 international human rights instruments (including the American Convention, ICCPR, ICERD, Convention against Torture, Convention on the Rights of the Child) to constitutional hierarchy — directly applicable and overriding ordinary law.",
        type: "right",
        year: 1994,
      },
      {
        title: "Chapter II — New Rights and Guarantees (1994)",
        description:
          "Added: right to a healthy and balanced environment; consumer rights; right to political party participation; citizens' initiative (proposing legislation); referendum; popular action to protect collective rights (amparo colectivo); habeas data (right to access and correct personal data held by the state or private entities).",
        type: "right",
        year: 1994,
      },
      {
        title: "Federal Intervention — Article 6",
        description:
          "The Federal Government may intervene in the territory of the provinces to guarantee the republican form of government or repel foreign invasion. Federal intervention (replacing elected provincial authorities with a federal interventor) has been used 200+ times — frequently for political purposes, though last major use was in 2002.",
        type: "doctrine",
      },
      {
        title: "Amendment Process — Article 30",
        description:
          "Amendments require a two-thirds majority in Congress declaring the need for reform, then a separately elected Constitutional Convention to draft and adopt changes. The 1994 reform was unusual in being negotiated by party leaders before the Convention met.",
        type: "principle",
      },
    ],
  },
  cl: {
    name: "Political Constitution of the Republic of Chile",
    adopted: 1980,
    lastAmended: 2023,
    type: "Unitary Presidential Republic",
    ideology: [
      "Liberal Democracy",
      "Presidentialism",
      "Free Market Economy",
      "Constitutionalism",
      "Rule of Law",
      "Post-Pinochet Democratic Transition",
    ],
    summary:
      "Chile's current constitution was drafted under Pinochet's military junta and approved by a controversial referendum in 1980 (amid censorship and without voter rolls). Despite 60+ amendments transforming it since the democratic transition (1990), demands for a new constitution fueled the 2019 social uprising (estallido social). A Constitutional Convention (2021-22) produced a draft rejected by 62% in September 2022. A second process (2023) also resulted in rejection (55%). Chile thus continues under the substantially reformed 1980 constitution.",
    articles: [
      {
        title: "Article 1 — Human Dignity",
        description:
          "People are born free and equal in dignity and rights. The family is the fundamental nucleus of society. The State is at the service of the human person and its goal is to promote the common good. These principles have been broadly interpreted by the Constitutional Tribunal.",
        type: "principle",
      },
      {
        title: "Chapter III — Constitutional Rights and Duties",
        description:
          "Extensive rights: right to life; equality before the law; equal protection of law; personal liberty; privacy; freedom of conscience and religion; freedom of expression; property rights (strongly protected); right to education; right to health; freedom to work; social security rights.",
        type: "right",
      },
      {
        title: "Binomial Electoral System (Repealed 2015)",
        description:
          "The original constitution entrenched a binomial electoral system that systematically over-represented the right by requiring supermajorities to change laws. The system was abolished in 2015 but its legacy shaped Chile's political landscape for 25 years post-transition.",
        type: "structure",
      },
      {
        title: "Constitutional Tribunal — Article 92",
        description:
          "Ten-member body with preventive and ex-post review of legislation. Three appointed by the President, three by the Senate, three by the Supreme Court, one by the Senate on proposal by the President. Has ruled on healthcare, education, and water rights cases.",
        type: "structure",
      },
      {
        title: "Article 19(21) — Economic Freedom",
        description:
          "The right to develop any economic activity not contrary to morals, public order or national security. Combined with strong property rights protections, this provision established Chile's constitution as one of the most market-liberal in the world — a legacy of the Chicago Boys economic reforms under Pinochet.",
        type: "right",
      },
      {
        title: "Amendment Process — Article 127",
        description:
          "Constitutional amendments require approval by both chambers of the National Congress with two-thirds majority for most provisions, three-fifths for others. Some provisions can be amended with three-fifths majority; the most fundamental require two-thirds.",
        type: "principle",
      },
    ],
  },
  my: {
    name: "Federal Constitution of Malaysia",
    adopted: 1957,
    lastAmended: 2019,
    type: "Federal Constitutional Elective Monarchy",
    ideology: [
      "Constitutional Monarchy",
      "Parliamentary Democracy",
      "Islam as State Religion",
      "Malay Special Rights (Ketuanan Melayu)",
      "Multi-Racialism (formal)",
      "Rule of Law",
    ],
    summary:
      "Malaysia's Federal Constitution came into effect on 31 August 1957 (Merdeka Day). It is a unique document establishing a constitutional monarchy where nine hereditary Malay rulers elect a Yang di-Pertuan Agong (King) for a 5-year term among themselves. The constitution entrenches Malay special rights (Article 153), Islam as the official religion, and the Malay language as the national language — provisions that cannot be amended without conference of the Malay rulers.",
    articles: [
      {
        title: "Article 153 — Malay Special Position",
        description:
          "The Yang di-Pertuan Agong shall safeguard the special position of the Malays and natives of Sabah and Sarawak and the legitimate interests of other communities. This article guarantees quotas for Malays and indigenous peoples (Bumiputera) in public service, scholarships, business licenses, and university places — the basis of Malaysia's affirmative action policy (Bumiputera policy).",
        type: "doctrine",
      },
      {
        title: "Article 3 — Islam as Religion of the Federation",
        description:
          "Islam is the religion of the Federation; but other religions may be practised in peace and harmony in any part of the Federation. State governments maintain Sharia courts for Muslims in family and personal matters. Conversion out of Islam is difficult and often requires civil court proceedings.",
        type: "doctrine",
      },
      {
        title: "Constitutional Monarchy — Yang di-Pertuan Agong",
        description:
          "Malaysia's unique rotating monarchy: the Agong is elected every 5 years by the Conference of Rulers (nine hereditary state rulers) from among themselves. The Agong appoints the Prime Minister who commands a parliamentary majority, acting on ministerial advice.",
        type: "structure",
      },
      {
        title: "Article 10 — Fundamental Liberties",
        description:
          "Guarantees: freedom of speech and expression; freedom of assembly (peacefully without arms); freedom of association. However, the Sedition Act, Official Secrets Act, Communications and Multimedia Act, and Security Offences Act significantly restrict these freedoms in practice.",
        type: "right",
      },
      {
        title: "Sensitive Issues — Article 10(4)",
        description:
          "Parliament may restrict speech on sensitive topics: the special position of the Malays, citizenship, Malay language, the rulers' sovereignty, and Islam. Questioning these is legally restricted — making Malaysia one of few democracies where certain constitutional provisions cannot be publicly criticized.",
        type: "doctrine",
      },
      {
        title: "Federal-State Division of Powers",
        description:
          "Parliament has exclusive power over external affairs, defence, internal security, civil and criminal law, trade, finance, and communications. States retain land, mines, forestry, and Islamic personal law. Sabah and Sarawak (East Malaysia) have special autonomy provisions on immigration and native rights.",
        type: "structure",
      },
    ],
  },
  th: {
    name: "Constitution of the Kingdom of Thailand",
    adopted: 2017,
    type: "Constitutional Monarchy (Military-Influenced)",
    ideology: [
      "Constitutional Monarchy",
      "Buddhism",
      "Nationalism (Nation-Religion-King)",
      "Military Tutelage",
      "Limited Democracy",
      "Anti-Corruption",
    ],
    summary:
      "Thailand's 2017 constitution — its 20th since 1932 — was drafted by a National Constitution Drafting Committee appointed by the military junta (NCPO) following the May 2014 coup, and approved by referendum (61%) under conditions restricting debate and campaigning against it. It contains provisions explicitly designed to limit elected governments and preserve military and royalist influence: a 5-year appointed Senate; a 20-year National Strategy binding future governments; and Constitutional Court powers to remove elected politicians.",
    articles: [
      {
        title: "Appointed Senate — Transitional Period",
        description:
          "For the first 5 years (extended to 10), 250 senators were appointed entirely by the junta (NCPO). The Senate jointly selected the Prime Minister with the House of Representatives — allowing the junta to install Prayuth Chan-ocha as PM despite a democratic election. The appointed Senate expired May 2024.",
        type: "structure",
      },
      {
        title: "20-Year National Strategy",
        description:
          "Section 65 mandates a 20-year National Strategy (security, competitiveness, human development, social equality, environment, public sector rebalancing) binding on all future governments. Failure to comply can result in dismissal of Cabinet members by the Constitutional Court.",
        type: "doctrine",
      },
      {
        title: "Section 7 — Constitutional Monarchy",
        description:
          "Thailand is a democratic state with the King as Head of State. The lèse-majesté law (Section 112 Criminal Code, up to 15 years imprisonment) makes criticism of the monarchy illegal. Between 2020-2024, hundreds of pro-democracy protesters were charged under this law for calling for monarchy reform.",
        type: "structure",
      },
      {
        title: "Section 256 — Extremely Difficult Amendment",
        description:
          "Constitutional amendments require: approval by more than half of the total members of parliament (including a third of the Senate), and a second reading with similar requirements, plus a referendum if the amendment affects the monarchy-related chapters.",
        type: "principle",
      },
      {
        title: "Constitutional Court — Political Dissolution Powers",
        description:
          "The Constitutional Court has extensive powers to dissolve political parties and ban politicians. In 2019 it dissolved the progressive Future Forward Party; in 2023 it dissolved the Move Forward Party after it won the most seats in the election, banning its leader Pita Limjaroenrat from politics for 10 years.",
        type: "structure",
      },
      {
        title: "Section 161 — Anti-Corruption Obligation",
        description:
          "The state shall strictly prevent and suppress corrupt conduct. Independent agencies (NACC, Anti-Money Laundering Office) are constitutionally established. Thailand ranks 108th on the Corruption Perceptions Index — reflecting the gap between constitutional anti-corruption mandates and practice.",
        type: "doctrine",
      },
    ],
  },
  id: {
    name: "Constitution of the Republic of Indonesia (UUD 1945)",
    adopted: 1945,
    lastAmended: 2002,
    type: "Unitary Presidential Republic",
    ideology: [
      "Pancasila (Five Principles)",
      "Democratic Republic",
      "Unitary State",
      "Social Welfare",
      "Nationalism",
      "Popular Sovereignty",
    ],
    summary:
      "Indonesia's constitution — the UUD (Undang-Undang Dasar) 1945 — was drafted in two days before independence was proclaimed on 17 August 1945. After Suharto's New Order period (1966–1998) during which the constitution was largely nominal, four amendments (1999-2002) during the Reformasi era introduced direct presidential elections, a Bill of Rights, regional autonomy, and a bicameral legislature. The Pancasila (Belief in God; Just Humanity; Indonesian Unity; Democracy through Deliberation; Social Justice) is the philosophical foundation of the state.",
    articles: [
      {
        title: "Pancasila — State Philosophy",
        description:
          "The five principles (sila) of Pancasila are embedded in the constitution's preamble as the philosophical foundation of the state. All political parties, organizations, and legal entities must formally accept Pancasila as their founding principle. The Constitutional Court uses Pancasila as a lens for constitutional interpretation.",
        type: "doctrine",
      },
      {
        title: "Article 6A — Direct Presidential Elections (2002)",
        description:
          "The 2002 amendments introduced direct presidential elections — replacing the previous system of selection by the People's Consultative Assembly (MPR). Candidates must be nominated by parties or coalitions holding at least 20% of parliamentary seats or 25% of the popular vote, requiring broad coalition-building.",
        type: "structure",
        year: 2002,
      },
      {
        title: "Article 22E — General Elections",
        description:
          "General elections are held every five years for the DPR (House of Representatives, 575 seats), DPD (Regional Representative Council, 136 seats), provincial and local legislatures, and the President/Vice-President — all in a single simultaneous election since 2019.",
        type: "structure",
      },
      {
        title: "Chapter XA — Human Rights (1999-2000)",
        description:
          "Added by the first and second amendments: right to life; freedom from torture; freedom of thought and conscience; equal protection; right to work; right to education; right to participate in government; protection of cultural rights of indigenous communities.",
        type: "right",
      },
      {
        title: "Article 18 — Regional Autonomy (1999)",
        description:
          "Decentralization (otonomi daerah) gives Indonesia's 34 provinces and 500+ districts/cities significant autonomy over local governance, budgeting, and public services — a dramatic shift from Suharto's highly centralized New Order. Resource-rich Papua and Aceh have special autonomy status.",
        type: "structure",
        year: 1999,
      },
      {
        title: "Constitutional Court (MK) — Article 24C",
        description:
          "Established by the 2002 amendment, the Mahkamah Konstitusi (Constitutional Court) reviews the constitutionality of laws, resolves electoral disputes, and adjudicates presidential impeachment and party dissolution cases. Nine justices serve one renewable 5-year term.",
        type: "structure",
        year: 2002,
      },
    ],
  },
  vn: {
    name: "Constitution of the Socialist Republic of Vietnam",
    adopted: 1992,
    lastAmended: 2013,
    type: "Unitary One-Party Socialist Republic",
    ideology: [
      "Marxism-Leninism",
      "Ho Chi Minh Thought",
      "Vietnamese Socialism",
      "Doi Moi (Economic Renovation)",
      "Communist Party Supremacy",
      "National Sovereignty",
    ],
    summary:
      "Vietnam's current constitution (the fourth since 1946) was adopted in 1992 during the Doi Moi reform period and substantially revised in 2013. The 2013 revision introduced stronger human rights language but reaffirmed the Vietnamese Communist Party's leading role. Vietnam maintains a one-party system; the VCP controls all state institutions, the military, and the courts. General Secretary Tô Lâm became both General Secretary (since 2024) and President — consolidating power in a single leader as in China under Xi Jinping.",
    articles: [
      {
        title: "Article 4 — VCP Leading Role",
        description:
          "The Communist Party of Vietnam, the vanguard of the Vietnamese working class and simultaneously the vanguard of the labouring people and the Vietnamese nation, a faithful representative of the interests of the working class, labouring people and the whole nation, acting upon the Marxist-Leninist doctrine and Ho Chi Minh's Thought, is the force leading the State and society.",
        type: "doctrine",
      },
      {
        title: "Article 1 — Socialist Republic",
        description:
          "The Socialist Republic of Vietnam is an independent, sovereign, unified and territorially integral nation including the mainland, islands, territorial waters and airspace. Vietnam claims the Paracel and Spratly Islands in the South China Sea — a major source of regional tension with China, Taiwan, and ASEAN neighbors.",
        type: "principle",
      },
      {
        title: "Doi Moi Constitutional Framework",
        description:
          "The 1992 constitution formally recognized a multi-sector economy while maintaining 'state-led' development. It legalized private enterprise and foreign investment while keeping the state sector dominant. This framework underpinned Vietnam's transformation from one of the world's poorest countries to a middle-income economy.",
        type: "doctrine",
      },
      {
        title: "Chapter II — Human Rights (2013)",
        description:
          "The 2013 revision introduced explicit human rights language: right to life; personal inviolability; private life and correspondence; freedom of expression, press, information, assembly, association, demonstration; right to vote and stand for election; social security rights. Rights may be limited by 'the provisions of law' — giving the VCP broad discretion.",
        type: "right",
        year: 2013,
      },
      {
        title: "National Assembly — Highest State Organ",
        description:
          "The National Assembly (500 members) is formally the highest state power. In practice, the VCP controls candidate selection — only VCP-approved candidates may stand. The NA meets twice yearly and approves major legislation and state appointments. Self-nominated independent candidates face significant obstacles.",
        type: "structure",
      },
      {
        title: "Unitary State with No Federalism",
        description:
          "Vietnam is a unitary state with 58 provinces and 5 municipalities directly under central government. There is no federal structure, no upper house representing sub-national units, and no constitutional protection for regional autonomy. Central government direction is implemented through the party structure.",
        type: "structure",
      },
    ],
  },
  ua: {
    name: "Constitution of Ukraine",
    adopted: 1996,
    lastAmended: 2019,
    type: "Unitary Semi-Presidential Republic (Wartime Democracy)",
    ideology: [
      "Liberal Democracy",
      "Popular Sovereignty",
      "Constitutionalism",
      "European Integration",
      "Anti-Corruption",
      "Territorial Integrity",
    ],
    summary:
      "Ukraine's constitution was adopted on 28 June 1996, the first post-Soviet constitution. The 2004 Orange Revolution produced constitutional amendments shifting to a parliamentary-presidential system; these were reversed in 2010 under Yanukovych (declared unconstitutional in 2014). The 2019 amendments under Zelensky constitutionalized Ukraine's aspirations to join the EU and NATO. Since Russia's full-scale invasion on 24 February 2022, Ukraine has operated under martial law while maintaining constitutional institutions and regular Verkhovna Rada sessions.",
    articles: [
      {
        title: "Article 1 — Sovereign and Democratic State",
        description:
          "Ukraine is a sovereign and independent, democratic, social, law-based state. Ukraine's sovereignty and territorial integrity have been the central constitutional issue since Russia's annexation of Crimea (2014) and full-scale invasion (2022). The constitution explicitly prohibits recognition of territorial changes made by force.",
        type: "principle",
      },
      {
        title: "2019 Amendment — EU and NATO Aspirations",
        description:
          "The February 2019 constitutional amendment inserted Ukraine's strategic course toward full membership in the European Union and the North Atlantic Treaty Organization as a fundamental objective of foreign and security policy. This directly precipitated Russia's claims of NATO expansion as a pretext for war.",
        type: "doctrine",
        year: 2019,
      },
      {
        title: "Article 17 — Defense of Sovereignty",
        description:
          "The protection of sovereignty and territorial integrity of Ukraine, ensuring its economic and informational security are the most important functions of the State and the direct duty of the citizens of Ukraine. The Armed Forces of Ukraine are designated as the guarantors of military security.",
        type: "doctrine",
      },
      {
        title: "Chapter II — Human Rights, Freedoms and Duties",
        description:
          "Comprehensive rights: right to life; human dignity; liberty and security; inviolability of home; privacy; freedom of movement; thought, speech and expression; peaceful assembly; political parties; property; work; social security; housing; health protection; education; legal protection.",
        type: "right",
      },
      {
        title: "Verkhovna Rada — 450-Member Parliament",
        description:
          "Ukraine's unicameral parliament has 450 members (225 in single-member constituencies, 225 by proportional representation). Under martial law, parliamentary elections are suspended — the 2023 elections scheduled under normal circumstances could not be held. The existing parliament's mandate has been extended by constitutional martial law provisions.",
        type: "structure",
      },
      {
        title: "Article 157 — No Amendment During Martial Law",
        description:
          "The Constitution of Ukraine may not be amended in conditions of martial law or a state of emergency. This provision, invoked since 24 February 2022, prevents constitutional changes during the war — protecting against emergency-era constitutional manipulation while also preventing potentially beneficial reforms.",
        type: "principle",
      },
    ],
  },
  pl: {
    name: "Constitution of the Republic of Poland",
    adopted: 1997,
    type: "Unitary Semi-Presidential Parliamentary Republic",
    ideology: [
      "Liberal Democracy",
      "Constitutionalism",
      "Christian Democratic Values",
      "European Integration",
      "Rule of Law",
      "Social Market Economy",
    ],
    summary:
      "Poland's constitution was adopted by the National Assembly and confirmed by referendum (52.7%) on 25 May 1997. It establishes a parliamentary republic with a President as head of state and Prime Minister as head of government. Poland has been at the center of EU rule-of-law disputes: the PiS (Law and Justice) government (2015-2023) enacted controversial reforms to the Constitutional Tribunal, Supreme Court, and judiciary that the EU Commission and European Court of Justice found violated EU treaties. The 2023 election victory of Donald Tusk's coalition has reversed some — but not all — of these changes.",
    articles: [
      {
        title: "Article 2 — Democratic Rule of Law",
        description:
          "The Republic of Poland shall be a democratic state ruled by law and implementing the principles of social justice. The Constitutional Tribunal (Trybunał Konstytucyjny) is meant to enforce this guarantee — but became contested after PiS packed it with loyalist judges (2015-2016), triggering Poland's rule-of-law crisis.",
        type: "principle",
      },
      {
        title: "Chapter II — Freedoms, Rights and Obligations",
        description:
          "Personal dignity and liberty; right to life; prohibition of torture; personal inviolability; freedom of movement; equality before the law; property rights; family protection; freedom of conscience and religion; freedom of expression; right to information; right of assembly; social security; right to education; environmental protection.",
        type: "right",
      },
      {
        title: "Constitutional Tribunal — Article 188",
        description:
          "The Tribunal adjudicates constitutionality of laws, international agreements, and the conformity of laws with international treaties. The 2015-2016 PiS reforms blocked legitimate Tribunal appointments, packed it with loyalist judges, and undermined its independence — leading the EU to trigger Article 7 proceedings against Poland for the first time.",
        type: "structure",
      },
      {
        title: "Senate — Upper Chamber",
        description:
          "The Senate (100 members, elected by majority vote in 100 single-member districts) has a 30-day suspensive veto on legislation passed by the Sejm (460 members). The Senate flipped to opposition control in 2019, serving as a brake on PiS legislation. Since 2023, both chambers are controlled by the Tusk coalition.",
        type: "structure",
      },
      {
        title: "Article 90 — EU Membership",
        description:
          "The Republic of Poland may, by virtue of international agreements, delegate to an international organization or international body the competence of organs of State authority in relation to certain matters. This article was the legal basis for Poland's EU accession (2004) and remains contested in EU primacy vs. constitutional supremacy debates.",
        type: "doctrine",
      },
      {
        title: "Amendment — Two-Thirds Majority",
        description:
          "Constitutional amendments require two-thirds majority in the Sejm and absolute majority in the Senate, with a minimum 60-day deliberation period. Senate may call for a referendum on amendments affecting Chapters I, II, or XII.",
        type: "principle",
      },
    ],
  },
  it: {
    name: "Constitution of the Italian Republic",
    adopted: 1948,
    type: "Unitary Parliamentary Republic",
    ideology: [
      "Liberal Democracy",
      "Parliamentary Sovereignty",
      "Antifascism",
      "Social Rights",
      "Regionalism",
      "European Integration",
    ],
    summary:
      "Italy's constitution — drafted by a Constituent Assembly elected in 1946 and in force from 1 January 1948 — was explicitly designed as a repudiation of Fascism. Its Fundamental Principles (Articles 1-12) are considered unamendable by constitutional doctrine. It establishes a parliamentary republic with a directly elected President as head of state (largely ceremonial) and a Prime Minister commanding parliamentary confidence. Italy's political instability — 69 governments since 1948 — is partly a product of its highly proportional electoral system.",
    articles: [
      {
        title: "Article 1 — Democratic Republic of Labor",
        description:
          "Italy is a democratic Republic founded on labor. Sovereignty belongs to the people and is exercised by the people in the forms and within the limits of the Constitution. 'Founded on labor' reflects the post-war consensus that the Republic's legitimacy derives from working people rather than monarchical or corporate authority.",
        type: "principle",
      },
      {
        title: "Fundamental Principles (Articles 1-12) — Unamendable",
        description:
          "The Constitutional Court has held that the Fundamental Principles (democratic republic, labor dignity, equality, unity, defense, international peace, Church-State separation, local autonomy, recognition of international law, flag) cannot be amended even by supermajority — they are the constitution's irreducible core.",
        type: "principle",
      },
      {
        title: "Title I — Civil Relations",
        description:
          "Personal inviolability; prohibition of capital punishment; habeas corpus; privacy of correspondence; freedom of movement; right to asylum; freedom of conscience, religion and worship; freedom of expression (without prior censorship, with prohibition on obscenity and incitement); freedom of assembly; freedom of association.",
        type: "right",
      },
      {
        title: "Title II — Ethical and Social Relations",
        description:
          "Family equality; parents' duty to maintain and educate children; right to health (public and free for the poor); right to education; academic freedom; art and science freedom; cultural and scientific promotion by the Republic.",
        type: "right",
      },
      {
        title: "Constitutional Court — Article 134",
        description:
          "Fifteen judges (5 appointed by the President, 5 elected by Parliament, 5 by the supreme courts) serve 9-year non-renewable terms. Rules on constitutional legitimacy of laws and referendums, and adjudicates conflicts between state powers.",
        type: "structure",
      },
      {
        title: "Amendment Process — Article 138",
        description:
          "Constitutional amendments require two successive votes in each chamber at least three months apart, with an absolute majority in the second vote. If not passed by two-thirds majority, any 500,000 voters, one-fifth of Parliament, or five Regional Councils may request a confirmatory referendum within three months.",
        type: "principle",
      },
    ],
  },
  pk: {
    name: "Constitution of the Islamic Republic of Pakistan",
    adopted: 1973,
    lastAmended: 2023,
    type: "Federal Parliamentary Islamic Republic",
    ideology: [
      "Islamic Republicanism",
      "Parliamentary Democracy",
      "Federalism",
      "Ethnic Balancing",
      "Military Influence (de facto)",
      "Rule of Law (aspirational)",
    ],
    summary:
      "Pakistan's third constitution (after 1956 and 1962) was adopted unanimously by the National Assembly on 10 April 1973 under Zulfikar Ali Bhutto. It has been suspended three times by military coups (1977, 1999), amended 26 times, and operated under varying emergency and martial law conditions. Despite formal democratic institutions, Pakistan's military (particularly the ISI) exerts substantial extra-constitutional influence over politics — a phenomenon analysts call 'guided democracy' or 'hybrid regime.'",
    articles: [
      {
        title: "Article 2 — Islam as State Religion",
        description:
          "Islam shall be the state religion of Pakistan. All laws must conform with the Quran and Sunnah. The Council of Islamic Ideology reviews legislation for Sharia compliance. The blasphemy laws (Sections 295-C, PPC) — prescribing death or life imprisonment for blasphemy — have been extensively misused, generating hundreds of cases and extrajudicial violence.",
        type: "doctrine",
      },
      {
        title: "Article 6 — High Treason",
        description:
          "Any person who abrogates or subverts or suspends or holds in abeyance, or attempts or conspires to abrogate or subvert or suspend or hold in abeyance, the Constitution by use of force or show of force or by any other unconstitutional means shall be guilty of high treason. Intended to deter coups — but effectively set aside by each of the three military takeovers.",
        type: "doctrine",
      },
      {
        title: "Federal Structure — Four Provinces",
        description:
          "Pakistan's federation comprises Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad Capital Territory, and Gilgit-Baltistan (with special constitutional status). The Council of Common Interests coordinates federal-provincial relations. Balochistan's separatist movement (ongoing) reflects unresolved federalism tensions.",
        type: "structure",
      },
      {
        title: "Eighteenth Amendment (2010) — Devolution",
        description:
          "The landmark 2010 amendment abolished the concurrent legislative list, transferring 47 subjects (including education, health, agriculture, labour) to the provinces. Abolished the National Security Council's constitutional status. Restored the 1973 constitution's original parliamentary character after Musharraf's presidential amendments.",
        type: "structure",
        year: 2010,
      },
      {
        title: "Chapter 1 — Fundamental Rights",
        description:
          "Security of person; safeguards as to arrest; inviolability of dignity; freedom of movement; assembly; association; trade and profession; speech; religious freedom (non-Muslims may profess their religion); property rights; equality of citizens; no discrimination in services. Rights may be limited by law 'in the interest of glory of Islam or integrity of Pakistan.'",
        type: "right",
      },
      {
        title: "Parliament — Bicameral (National Assembly + Senate)",
        description:
          "National Assembly: 336 seats (266 general + 60 reserved for women + 10 for non-Muslims), 5-year terms. Senate: 100 members (indirectly elected by provincial assemblies), 6-year terms with half elected every 3 years. The Prime Minister must command National Assembly confidence.",
        type: "structure",
      },
    ],
  },
  et: {
    name: "Constitution of the Federal Democratic Republic of Ethiopia",
    adopted: 1995,
    type: "Federal Parliamentary Republic (Dominant-Party Authoritarian)",
    ideology: [
      "Revolutionary Democracy",
      "Ethnic Federalism",
      "Multi-Party Democracy (formal)",
      "Developmental State",
      "Self-Determination Rights",
      "Anti-Imperialism",
    ],
    summary:
      "Ethiopia's 1995 constitution is remarkable for its explicit granting of self-determination — including the right to secession — to each of Ethiopia's ethnic groups (Article 39). This ethnic federalism model organized Ethiopia into 10 ethnic-based regional states. Under the EPRDF (1991-2019) and its successor party Prosperity Party, the constitution operated in a dominant-party system with limited electoral competition. The Tigray War (2020-2022) and ongoing Amhara and Oromo conflicts raise fundamental questions about whether the constitutional framework is functioning.",
    articles: [
      {
        title: "Article 39 — Rights of Nations, Nationalities and Peoples",
        description:
          "Every Nation, Nationality and People in Ethiopia has an unconditional right to self-determination, including the right to secession. This is one of the world's only constitutions explicitly granting an unconditional right to secede. Eritrea exercised a pre-constitutional version of this right in 1993; the provision has not been invoked by any region since 1995.",
        type: "right",
      },
      {
        title: "Ethnic Federalism — Article 47",
        description:
          "Ethiopia is divided into nine regional states and two city administrations organized along ethnic and linguistic lines: Tigray, Afar, Amhara, Oromia, Somali, Benishangul-Gumuz, Southern Nations, Gambela, Harari, plus Addis Ababa and Dire Dawa. Critics argue ethnic federalism institutionalizes conflict rather than managing it.",
        type: "structure",
      },
      {
        title: "Article 9 — Constitutional Supremacy",
        description:
          "The Constitution is the supreme law of the land. Any law, customary practice or a decision of an organ of state or a public official which contravenes this Constitution shall be of no effect.",
        type: "principle",
      },
      {
        title: "Chapter III — Fundamental Rights and Freedoms",
        description:
          "Right to life; liberty and security of person; right against torture; privacy; freedom of expression; right to information; right of assembly; formation of political parties; right to vote; right to property; right to social security; right to education; cultural rights of ethnic communities.",
        type: "right",
      },
      {
        title: "House of Federation — Upper Chamber",
        description:
          "The upper house represents Ethiopia's nations, nationalities and peoples — each sends at least one member plus one additional for each million population. The House interprets the constitution and resolves disputes over self-determination rights. Unlike most upper chambers, it has no legislative role.",
        type: "structure",
      },
      {
        title: "Article 44 — Environmental Rights",
        description:
          "All persons have the right to a clean and healthy environment. All persons who have been displaced or whose livelihoods have been adversely affected as a result of State programs have the right to commensurate monetary or alternative means of compensation, including relocation with adequate State assistance.",
        type: "right",
      },
    ],
  },
  se: {
    name: "Instrument of Government (Regeringsformen) — Swedish Constitution",
    adopted: 1974,
    type: "Unitary Constitutional Monarchy",
    ideology: [
      "Liberal Democracy",
      "Parliamentary Sovereignty",
      "Social Democracy",
      "Transparency",
      "Human Rights",
      "Welfare State",
    ],
    summary:
      "Sweden's constitution consists of four fundamental laws: the Instrument of Government (1974, main constitutional document), the Act of Succession (1810), the Freedom of the Press Act (1766 — world's oldest freedom of information law), and the Fundamental Law on Freedom of Expression (1991). The 1974 Instrument replaced the 1809 constitution, converting Sweden from a constitutional monarchy with royal executive power to a pure parliamentary democracy where the King has entirely ceremonial functions.",
    articles: [
      {
        title: "Chapter 1 — Foundations of Government",
        description:
          "All public power in Sweden proceeds from the people. The Riksdag is the foremost representative of the people. Government is based on free formation of opinion and universal and equal suffrage. Public power is exercised under the law.",
        type: "principle",
      },
      {
        title: "The King — Purely Ceremonial",
        description:
          "Unlike most constitutional monarchies, the Swedish King has no constitutional powers. The Speaker of the Riksdag (not the King) charges the Prime Minister with forming a government. The King opens the Riksdag but only ceremonially. Sweden's monarchy is among the most constitutionally limited in the world.",
        type: "structure",
      },
      {
        title: "Chapter 2 — Fundamental Rights and Freedoms",
        description:
          "Freedom of expression, information, assembly, demonstration, and association (absolute negative freedoms). Right to vote (18+). Protection against death penalty, corporal punishment, and torture. Protection against arbitrary deprivation of liberty. Retroactive criminal law prohibition. Right to a fair trial. Property rights. Academic freedom.",
        type: "right",
      },
      {
        title: "Freedom of the Press Act (1766)",
        description:
          "The world's oldest freedom of information law establishes: the right to access all public documents (offentlighetsprincipen); prohibition of prior censorship; source protection (journalists cannot be compelled to reveal sources); and the right to publish information on any topic. Part of the constitutional framework since 1766.",
        type: "right",
        year: 1766,
      },
      {
        title: "Riksdag — Single Chamber (349 Seats)",
        description:
          "Sweden's unicameral parliament has 349 members elected by proportional representation (4% threshold) every 4 years. The Speaker commissions the Prime Minister who must have the passive confidence of the Riksdag (a PM can be elected with abstentions if not a majority against). Coalition or minority government is the norm.",
        type: "structure",
      },
      {
        title: "Chapter 14 — Amendment Procedure",
        description:
          "Constitutional amendments require identical decisions in two consecutive parliaments with a general election in between — ensuring public awareness. Any member of parliament may also demand a referendum on a proposed amendment (requires one-third of MPs). This deliberative process takes at least 1 year.",
        type: "principle",
      },
    ],
  },
  no: {
    name: "Constitution of the Kingdom of Norway (Grunnloven)",
    adopted: 1814,
    type: "Unitary Constitutional Monarchy",
    ideology: [
      "Liberal Democracy",
      "Constitutional Monarchy",
      "Parliamentary Sovereignty",
      "Rule of Law",
      "Human Rights",
      "Nordic Welfare State",
    ],
    summary:
      "The Norwegian Constitution, adopted at Eidsvoll on 17 May 1814 (Norwegian Constitution Day, Syttende Mai), is the world's second oldest written constitution still in force (after the U.S.). Drafted during Napoleon's defeat while Norway was briefly independent, it was amended to adapt to parliamentary democracy (1884), include women's suffrage (1913, among the world's first), and a 2014 update modernized the language and added a rights chapter.",
    articles: [
      {
        title: "§ 1 — Values and Form of Government",
        description:
          "The Kingdom of Norway is a free, independent, indivisible and inalienable realm. Its form of government is a limited and hereditary monarchy. 'Limited' refers to constitutional limitations on royal power established in 1814 and reinforced by parliamentary practice since 1884.",
        type: "principle",
      },
      {
        title: "Parliamentary Government (Established by Convention 1884)",
        description:
          "Parliamentary government is not in the constitutional text but is the fundamental constitutional convention: the government must have the confidence of the Storting. Since 1884, no government has used royal prerogative to govern against parliamentary will. The King's Council (statsråd) formally holds executive power but acts on ministerial advice.",
        type: "structure",
      },
      {
        title: "§ 100 — Freedom of Expression",
        description:
          "Freedom of expression shall be enshrined in law. Everyone may speak their mind freely on any matter whatsoever. There may only be prior restraint of expression when strictly necessary to protect children. Conviction for expressions is warranted only when particularly weighty considerations justify it — a strong constitutional protection.",
        type: "right",
      },
      {
        title: "§ 110c — Human Rights Obligation",
        description:
          "It is the responsibility of the state authorities to respect and ensure human rights. Specific provisions thereof shall be determined by law. Norway has incorporated the ECHR, ICCPR, ICESCR, and UN Convention on the Rights of the Child directly into Norwegian law (Human Rights Act 1999), giving them precedence over other domestic law.",
        type: "right",
      },
      {
        title: "Storting — Unicameral Parliament (169 Members)",
        description:
          "Norway's parliament has 169 members elected by proportional representation from 19 constituencies every 4 years. The former division into Odelsting and Lagting was abolished in 2009. Coalition minority governments are the historical norm in Norway's multi-party system.",
        type: "structure",
      },
      {
        title: "§ 121 — Amendment Procedure",
        description:
          "Amendments must be proposed in an ordinary Storting session and, if adopted by more than two-thirds of the members, take effect after a new general election — ensuring the electorate can weigh in. Proposed amendments cannot contradict the constitution's principles or alter its spirit.",
        type: "principle",
      },
    ],
  },
  kp: {
    name: "Socialist Constitution of the Democratic People&#39;s Republic of Korea",
    adopted: 1972,
    lastAmended: 2023,
    type: "Unitary One-Party Juche State (Hereditary Dictatorship)",
    ideology: [
      "Juche (Self-Reliance)",
      "Kimilsungism-Kimjongilism",
      "Songun (Military-First)",
      "Korean Nationalism",
      "Anti-Imperialism",
      "Totalitarianism",
    ],
    summary:
      "North Korea is not a democracy. The DPRK&#39;s constitution, adopted in 1972 under Kim Il-sung and heavily amended in 1992, 1998, 2009, 2012, 2016, 2019, and 2023, is the legal facade of a totalitarian hereditary dynasty. Real power resides in the Korean Workers&#39; Party (KWP) and its supreme leader Kim Jong-un, who holds the titles of General Secretary of the KWP, Chairman of the State Affairs Commission, and Supreme Commander of the armed forces. The constitution declares the DPRK a \'Juche-oriented socialist state\' — but all state institutions operate as instruments of KWP and supreme leader authority.",
    articles: [
      {
        title: "Article 1 — DPRK as Juche-Oriented Socialist State",
        description:
          "The Democratic People&#39;s Republic of Korea is an independent socialist state representing the interests of all the Korean people. In practice, it is a one-party state ruled by the Korean Workers&#39; Party with no multi-party elections, no independent courts, and no free press. The word \'democratic\' in the name reflects Soviet-era naming conventions, not electoral democracy.",
        type: "doctrine",
      },
      {
        title: "Juche Ideology — State Philosophy",
        description:
          "Juche (self-reliance) was developed by Kim Il-sung as the DPRK&#39;s official state ideology, placing it above Marxism-Leninism. It holds that the masses are the master of their destiny only when guided by the supreme leader. The 1992 amendment removed references to Marxism-Leninism and replaced them with Juche. Kimilsungism-Kimjongilism was added in the 2012 amendment following Kim Jong-il&#39;s death.",
        type: "doctrine",
      },
      {
        title: "Songun — Military-First Policy",
        description:
          "Songun (military-first) was adopted as state policy under Kim Jong-il and codified constitutionally in 1998. It prioritizes the Korean People&#39;s Army in all political, economic, and social affairs. Defense spending consumes an estimated 15–25% of GDP. North Korea maintains 1.28 million active troops — the world&#39;s fourth largest military.",
        type: "doctrine",
      },
      {
        title: "Supreme Leader — Kim Jong-un",
        description:
          "Kim Jong-un assumed power in 2011 upon his father&#39;s death and holds three supreme positions: General Secretary of the Korean Workers&#39; Party (established 1949), Chairman of the State Affairs Commission, and Supreme Commander of the KPA. The 2012 constitution explicitly designated the Kim family&#39;s political lineage as the foundation of DPRK statehood. There is no constitutional term limit or electoral mechanism to remove him.",
        type: "structure",
      },
      {
        title: "Korean Workers&#39; Party (KWP) Supremacy",
        description:
          "The KWP is constitutionally the \'guiding force of the state and society.\' The Party&#39;s Political Bureau Presidium, currently led by Kim Jong-un, makes all significant policy decisions. The Supreme People&#39;s Assembly (SPA) — the nominal legislature — meets only 1–2 days per year and unanimously rubber-stamps KWP decisions. All candidates for the SPA run unopposed.",
        type: "structure",
      },
      {
        title: "Supreme People&#39;s Assembly — Nominal Legislature",
        description:
          "The SPA has 687 deputies elected every 5 years in elections where a single KWP-approved candidate appears on each ballot. Voter turnout is reported at 99.99%. The SPA formally appoints the Cabinet (Naegak) and ratifies constitutional amendments. Real legislative authority rests with the KWP Secretariat and the State Affairs Commission.",
        type: "structure",
      },
      {
        title: "Article 64 — \'Rights and Duties\' of Citizens",
        description:
          "The constitution enumerates rights including: freedom of speech, press, assembly, demonstration, and association — but only in conformity with \'the interests of the state and society.\' In practice, North Korea is ranked last (180th of 180) in the RSF World Press Freedom Index. Access to foreign media, internet, and unsupervised movement is criminalized. The UN Commission of Inquiry (2014) documented crimes against humanity including extermination, torture, and enforced disappearances.",
        type: "right",
      },
      {
        title: "Songbun — Hereditary Social Classification",
        description:
          "Not in the constitution but codified in practice: Songbun is a three-tier hereditary loyalty classification (core/wavering/hostile) assigned based on a family&#39;s perceived loyalty to the Kim regime dating from the Korean War era. Songbun determines access to food, education, residence, employment, and Party membership — affecting all 26 million citizens across generations.",
        type: "doctrine",
      },
      {
        title: "Nuclear State — 2012 & 2023 Amendments",
        description:
          "The April 2012 constitutional amendment declared the DPRK a \'nuclear-armed state\' in the Preamble — making North Korea the only country to constitutionally enshrine nuclear weapons status. The September 2022 law and 2023 amendment further codified an \'irreversible\' nuclear posture, explicitly ruling out denuclearization negotiations. Estimated stockpile: 40–50 nuclear warheads.",
        type: "doctrine",
        year: 2023,
      },
      {
        title: "Article 3 — Juche as Guiding Ideology",
        description:
          "The DPRK shall conduct all activities under the guidance of the Juche idea, the revolutionary ideology of the working class created by President Kim Il-sung. Juche is also described as \'man-centered philosophy,\' asserting the primacy of political consciousness over material conditions — used to justify continued mobilization despite chronic food shortages and economic stagnation.",
        type: "principle",
      },
      {
        title: "Korean People&#39;s Army — Constitutional Role",
        description:
          "The KPA is constitutionally the defender of the revolution and the state, under the direct command of the Supreme Commander (Kim Jong-un). Mandatory military service applies to men (10 years) and women (7 years). The DPRK&#39;s military expenditure relative to GDP is among the highest globally, sustaining a nuclear weapons program, ballistic missile forces, and asymmetric cyber capabilities (Lazarus Group).",
        type: "structure",
      },
      {
        title: "Political Prison Camps — Camp System",
        description:
          "Not constitutionalized but integral to state control: an estimated 80,000–120,000 political prisoners are held in kwanliso (total control zones) including Camps 14, 15, 16, and 25. The UN COI (2014) concluded that the scale and nature of the abuses indicated crimes against humanity. Detention without trial, forced labor, public executions, and collective punishment of families are documented practices.",
        type: "doctrine",
      },
    ],
  },
  br: {
    name: "Constitution of the Federative Republic of Brazil",
    adopted: 1988,
    type: "Federal Presidential Democratic Republic",
    ideology: [
      "Liberal Democracy",
      "Federalism",
      "Social Rights Constitutionalism",
      "Participatory Democracy",
      "Dignity of Human Person",
      "Social Pluralism",
    ],
    summary:
      "Brazil&#39;s seventh constitution was promulgated October 5, 1988 following 21 years (1964–1985) of military dictatorship. Nicknamed the \'Citizen Constitution\' by Assembly President Ulysses Guimarães, it is one of the world&#39;s most detailed constitutions (250 articles + 97 transitional provisions), enshrining an unusually extensive bill of social rights. It has been amended 109 times (as of 2023) — a reflection of Brazil&#39;s dynamic political environment.",
    articles: [
      {
        title: "Article 1 — Founding Principles",
        description:
          "The Federative Republic of Brazil is a democratic state of law, founded on: (I) sovereignty; (II) citizenship; (III) dignity of the human person; (IV) social values of labor and free enterprise; (V) political pluralism. Its sole holder of power is the people, exercised through representatives or directly.",
        type: "principle",
      },
      {
        title: "Article 3 — Fundamental Objectives",
        description:
          "The Republic&#39;s objectives are: (I) build a free, just, and united society; (II) guarantee national development; (III) eradicate poverty and marginalization and reduce social and regional inequalities; (IV) promote the well-being of all, without prejudice based on origin, race, sex, color, age, or any other form of discrimination. Unique for inscribing social transformation goals directly into constitutional text.",
        type: "principle",
      },
      {
        title: "Article 5 — Fundamental Rights (78 clauses)",
        description:
          "The most expansive constitutional rights article in the world. All persons are equal before the law. Specific rights include: inviolability of home; privacy and honor; freedom of conscience and religion; free manifestation of thought; right of reply; right of assembly; right of association; opposition to torture; habeas corpus; habeas data (unique: right to access one&#39;s own government file); mandado de injunção (compels legislation to give effect to constitutional rights).",
        type: "right",
      },
      {
        title: "Article 6 — Social Rights",
        description:
          "Social rights are: education, health, food, work, housing, transport, leisure, security, social security (previdência social), protection of motherhood and childhood, and assistance to the destitute. \'Food\' and \'transport\' were added by amendments (2010 and 2015 respectively), reflecting constitutional amendment as a social policy tool. Brazil&#39;s Bolsa Família program operates under this mandate.",
        type: "right",
      },
      {
        title: "Chapter II — Social Rights of Workers (Articles 7-11)",
        description:
          "78 labor rights constitutionally guaranteed, including: protection against arbitrary dismissal; FGTS (severance fund); minimum wage; 13th salary (mandatory annual bonus); 8-hour workday / 44-hour week; 30-day paid vacation with bonus; maternity leave (120 days) and paternity leave; profit-sharing; prohibition of work for children under 16 (except apprenticeship from 14). The world\'s most detailed constitutional labor code.",
        type: "right",
      },
      {
        title: "Federal Structure — Articles 18-36",
        description:
          "Brazil&#39;s federation comprises: 26 states + Federal District + 5,570 municipalities, all constitutionally recognized as autonomous federative entities with self-governance, self-taxation, and self-legislation. Municipalities are uniquely granted federated status — rare globally. Powers are divided among Union (exclusive), states (residual), and concurrent (Union + states), and municipalities (local interest).",
        type: "structure",
      },
      {
        title: "Separation of Powers — Branches",
        description:
          "Legislative: National Congress (Senate — 81 senators, 3 per state, 8-year terms; Chamber of Deputies — 513 deputies, 4-year terms). Executive: President elected for 4-year term, limited to two terms. Judicial: Federal Supreme Court (STF, 11 ministers appointed by President + Senate approval), Superior Court of Justice (STJ), Electoral Court system, Labor Court system.",
        type: "structure",
      },
      {
        title: "Article 225 — Environmental Rights",
        description:
          "Everyone has the right to an ecologically balanced environment, which is a public good for the people&#39;s use and essential to a healthy quality of life. Both the Government and the community have a duty to defend and preserve it for present and future generations. Additionally: the Amazon Forest, Atlantic Forest, Serra do Mar, Pantanal, and coastal zone are \'national heritage\' requiring special protection.",
        type: "doctrine",
      },
      {
        title: "Articles 196-200 — Right to Health",
        description:
          "Health is the right of all and the duty of the State, guaranteed through social and economic policies aimed at reducing illness risk. Created the Sistema Único de Saúde (SUS), Brazil&#39;s universal public health system — one of the world&#39;s largest. 2023: SUS serves 150+ million people. Courts frequently compel the state to provide specific medications or procedures under this constitutional right.",
        type: "right",
      },
      {
        title: "Articles 231-232 — Indigenous Peoples&#39; Rights",
        description:
          "The Indians are recognized their social organization, customs, languages, creeds and traditions, and the original rights over the lands they traditionally occupy, which the Union is obliged to demarcate and protect. The concept of \'marco temporal\' (temporal milestone) — debated in the STF — would have limited indigenous land claims to areas occupied in 1988; the STF rejected this in 2023, restoring broader protections.",
        type: "right",
      },
      {
        title: "Articles 14-16 — Direct Democracy",
        description:
          "Political rights include popular sovereignty exercised directly through: plebiscite (pre-legislative consultation), referendum (post-legislative ratification), and popular initiative (bills proposed by 1% of national electorate spread across at least 5 states). Brazil has held one national referendum (2005 — arms ban; 64% voted against). Lula government proposed a popular initiative reform referendum in 2023.",
        type: "doctrine",
      },
      {
        title: "Amendment Process — Article 60",
        description:
          "Constitutional amendments require three-fifths approval in each house in two separate rounds of voting. Certain provisions are unamendable (cláusulas pétreas): the federal structure; the direct, secret, universal suffrage ballot; separation of powers; and individual rights and guarantees. Despite this, Brazil has enacted 109 amendments in 35 years — averaging three per year.",
        type: "principle",
      },
    ],
  },
};

// ── Per-country ideology overrides for countries not in COUNTRY_CONSTITUTIONS ──
const COUNTRY_IDEOLOGY_OVERRIDES: Record<string, string[]> = {
  // One-party socialist / communist states
  cu: [
    "Marxism-Leninism",
    "Cuban Socialism",
    "Anti-Imperialism",
    "One-Party State",
  ],
  la: [
    "Marxism-Leninism",
    "Lao Socialism",
    "One-Party State",
    "People's Democratic Centralism",
  ],
  er: [
    "Single-Party Authoritarian Rule",
    "Nationalism",
    "No Electoral Competition",
    "Militarism",
  ],
  // Military juntas / coup-led governments
  mm: [
    "Military Rule",
    "Tatmadaw Supremacy",
    "Authoritarian Nationalism",
    "No Constitutional Democracy",
  ],
  ml: [
    "Military Junta",
    "Transitional Rule",
    "Anti-Western Nationalism",
    "Coup-led Government",
  ],
  bf: [
    "Military Junta",
    "Transitional Rule",
    "Pan-Africanist Nationalism",
    "Coup-led Government",
  ],
  ne: [
    "Military Junta",
    "Transitional Rule",
    "Sahel Nationalism",
    "Coup-led Government",
  ],
  gn: [
    "Military Junta",
    "Transitional Rule",
    "Resource Nationalism",
    "Coup-led Government",
  ],
  ga_af: ["Military Junta", "Transitional Rule", "Coup-led Government"],
  sd: [
    "Military Council Rule",
    "Islamic Conservatism",
    "Transitional Fragility",
  ],
  // Authoritarian / dominant-party non-democratic systems
  by: [
    "Authoritarian Presidentialism",
    "Soviet-Derived Governance",
    "Suppressed Pluralism",
    "Pro-Russian Alignment",
  ],
  af: [
    "Islamic Emirate",
    "Deobandi Fundamentalism",
    "Sharia Supremacy",
    "Taliban Rule",
    "No Civil Rights",
  ],
  tm: [
    "Presidential Authoritarianism",
    "Neutrality Doctrine",
    "Personality Cult Governance",
  ],
  tj: ["Presidential Authoritarianism", "Secular Islam", "Dominant-Party Rule"],
  az_as: [
    "Presidential Authoritarianism",
    "Secular Nationalism",
    "Dominant-Party Rule",
  ],
  sy: [
    "Transitional Government (Post-Assad)",
    "Fragile State Rebuilding",
    "Islamic Conservatism (HTS)",
  ],
  kz: [
    "Managed Democracy",
    "Presidential Dominant System",
    "Modernisation-from-above",
  ],
  ni: [
    "Presidential Authoritarianism",
    "Ortega-Murillo Regime",
    "Suppressed Opposition",
  ],
  ve: [
    "Bolivarian Socialism",
    "Chavismo",
    "Authoritarian Populism",
    "Electoral Autocracy",
  ],
  // Islamic republics / theocracy
  sa: [
    "Islamic Absolute Monarchy",
    "Wahhabi Islam",
    "Shura Governance",
    "Vision 2030 Modernisation",
  ],
  om: [
    "Absolute Monarchy",
    "Ibadi Islam",
    "Benevolent Authoritarianism",
    "Neutralist Foreign Policy",
  ],
  qa: [
    "Absolute Monarchy",
    "Islam as State Law",
    "Consultative Governance",
    "Sovereign Wealth Statism",
  ],
  kw: [
    "Constitutional Monarchy",
    "Islam as State Religion",
    "Tribal Consensus Governance",
    "Limited Parliamentary Democracy",
  ],
  bh: [
    "Constitutional Monarchy",
    "Islam as State Religion",
    "Al Khalifa Family Rule",
  ],
  bn: ["Absolute Monarchy", "Malay Islamic Monarchy (MIB)", "Sharia Law"],
  // Dominant-party democracies / hybrid regimes
  rw: [
    "Strong Presidential Governance",
    "RPF Dominance",
    "Post-Genocide Reconciliation",
    "Developmental Authoritarianism",
  ],
  ug: [
    "Presidential Dominant System",
    "NRM Movement Governance",
    "Limited Multi-Party Competition",
  ],
  cm: [
    "Presidential Dominant System",
    "Long-Tenure Authoritarian",
    "Francophone Governance",
  ],
  dz: [
    "One-Party Dominant State",
    "Islamic-Socialist Hybrid",
    "Military-Backed Governance",
  ],
  ly: [
    "Fragile State / Divided Authority",
    "Tribal Governance",
    "Post-Gaddafi Transitional Rule",
  ],
  td: [
    "Presidential Dominant System",
    "Military-Backed Transitional Governance",
  ],
  ss: ["Fragile State", "Wartime Presidential Rule", "Ethnic Federalism"],
  so: [
    "Federal Transitional Democracy",
    "Clan-Based Governance",
    "Fragile Constitutionalism",
  ],
  cg: [
    "Presidential Dominant System",
    "Sassou-Nguesso Dynasty",
    "Limited Political Pluralism",
  ],
  cf: [
    "Fragile Presidential Republic",
    "Russian Wagner Influence",
    "Transitional Constitutionalism",
  ],
  gq: [
    "Presidential Authoritarianism",
    "Obiang Dynasty",
    "Oil-State Patronage",
  ],
  // Constitutional democracies — specific regional character
  mx: [
    "Presidential Democracy",
    "Multi-Party System",
    "Federal Constitutionalism",
    "AMLO-era Social Rights",
  ],
  gt: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Anti-Corruption Constitutionalism",
  ],
  hn: [
    "Presidential Republic",
    "Left-Populist Governance",
    "Multi-Party Democracy",
  ],
  sv: [
    "Presidential Republic",
    "Bukele Technocratic Populism",
    "Bitcoin Legal Tender",
  ],
  cr: [
    "Presidential Republic",
    "Liberal Democracy",
    "Unarmed Neutrality",
    "Social Democratic Welfare",
  ],
  pa: ["Presidential Republic", "Liberal Democracy", "Canal-State Sovereignty"],
  cu_na: ["Marxism-Leninism", "Cuban Socialism", "One-Party State"],
  do: [
    "Presidential Republic",
    "Liberal Democracy",
    "Caribbean Constitutionalism",
  ],
  jm: [
    "Westminster Parliamentary Democracy",
    "Constitutional Monarchy",
    "Common Law Constitutionalism",
  ],
  tt: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Multi-Ethnic Constitutionalism",
  ],
  uy: [
    "Presidential Republic",
    "Social Democracy",
    "Secular Constitutionalism",
    "Progressive Rights",
  ],
  py: [
    "Presidential Republic",
    "Limited Democracy",
    "Colorado Party Dominance",
  ],
  bo: [
    "Presidential Republic",
    "Plurinational Constitutionalism",
    "Indigenous Rights",
    "MAS Socialism",
  ],
  ec: [
    "Presidential Republic",
    "Correa-era Citizen Revolution (reformed)",
    "Social Rights Constitutionalism",
  ],
  co_co: [
    "Presidential Republic",
    "Liberal Democracy",
    "Post-Conflict Constitutionalism",
    "Peace Process",
  ],
  pe: [
    "Presidential Republic",
    "Liberal Democracy",
    "Anti-Corruption Governance",
  ],
  gy: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Ethnic Constitutionalism",
  ],
  // Specific non-standard governance
  kp: [
    "Juche Ideology",
    "Kimilsungism-Kimjongilism",
    "Totalitarian One-Party State",
    "Military-First (Songun)",
    "Hereditary Succession",
  ],
  // European specific
  hu: [
    "Constitutional Democracy",
    "Illiberal Democracy (Orbán)",
    "Christian Democracy",
    "National Sovereignty",
  ],
  sk: [
    "Parliamentary Democracy",
    "Euro-Skeptic Conservatism",
    "Rule of Law Concerns",
  ],
  rs: [
    "Parliamentary Democracy",
    "Serbian Nationalism",
    "EU-Aspirant Governance",
  ],
  by_eu: ["Authoritarian Rule", "Soviet Governance Legacy"],
  // Asian specific
  jo: [
    "Constitutional Monarchy",
    "Hashemite Monarchy",
    "Islam as State Religion",
    "Parliamentary Advisory System",
  ],
  lb: [
    "Confessional Democracy",
    "Sectarian Power-Sharing (Taif Agreement)",
    "Fragile Constitutionalism",
  ],
  ye: [
    "Fragile Presidential State",
    "Civil War Governance",
    "Houthi Insurgency",
  ],
  iq: [
    "Federal Parliamentary Republic",
    "Sectarian Power-Sharing",
    "Oil-State Governance",
    "De-Baathification",
  ],
  ps: [
    "Parliamentary Authority",
    "Divided Governance (PA/Hamas)",
    "Occupied Territory Constitutionalism",
  ],
  np: [
    "Federal Democratic Republic",
    "Post-Monarchy Constitutionalism",
    "Multi-Party Federalism",
  ],
  lk: [
    "Presidential Republic",
    "Liberal Democracy",
    "Post-Civil War Reconciliation",
  ],
  mm_as: ["Military Junta", "No Constitutional Governance"],
  kh: [
    "Constitutional Monarchy",
    "Hun Sen–Era Dominant Party",
    "Limited Pluralism",
  ],
  mn_as: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Landlocked Neutralism",
  ],
  bt: [
    "Constitutional Monarchy",
    "Gross National Happiness Doctrine",
    "Buddhist Governance",
  ],
  mv: [
    "Presidential Republic",
    "Islam as State Religion",
    "Multi-Party Democracy",
  ],
  // Africa specific
  ke: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Constitutionalism",
    "Devolved Governance",
  ],
  tz: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Union Constitutionalism",
  ],
  gh: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Constitutionalism",
  ],
  sn: [
    "Presidential Republic",
    "Liberal Democracy",
    "Secularism",
    "West African Democracy",
  ],
  ma: [
    "Constitutional Monarchy",
    "Islam as State Religion",
    "Makhzen System",
    "Parliamentary Monarchy",
  ],
  tn: [
    "Presidential Republic",
    "Saied-era Constitutional Revision",
    "Secularism Under Strain",
  ],
  ao: [
    "Presidential Republic",
    "MPLA-Dominant Multi-Party System",
    "Post-Civil War Governance",
  ],
  zm: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Christian Nation Declaration",
  ],
  mw: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Liberal Constitutionalism",
  ],
  bw: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Diamond-Resource Governance",
  ],
  na: [
    "Presidential Republic",
    "Liberal Democracy",
    "SWAPO-Dominant Multi-Party System",
  ],
  mz: [
    "Presidential Republic",
    "Frelimo-Dominant Multi-Party System",
    "Post-Colonial Socialism (reformed)",
  ],
  rw_af: ["Presidential Dominant System", "Post-Genocide Reconciliation"],
  mu: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Multi-Ethnic Constitutionalism",
  ],
  sc: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Island Governance",
  ],
  cv: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "African Multi-Party Governance",
  ],
  ci: ["Presidential Republic", "Multi-Party Democracy", "Ivorian Nationalism"],
  sz: [
    "Absolute Monarchy",
    "Traditional Monarchy",
    "Swazi Customary Law",
    "No Political Parties",
  ],
  ls: [
    "Constitutional Monarchy",
    "Mosotho Customary Law",
    "Westminster Parliamentarism",
  ],
  mg: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Fragile Constitutionalism",
  ],
  zw: [
    "Presidential Republic",
    "ZANU-PF Dominant Party",
    "Limited Multi-Party Competition",
  ],
  bi: [
    "Presidential Republic",
    "Dominant-Party Rule",
    "Post-Conflict Governance",
  ],
  mw_af: ["Presidential Republic", "Multi-Party Democracy"],
  dj: [
    "Presidential Republic",
    "Dominant-Party Authoritarian",
    "Strategic Port-State",
  ],
  so_af: ["Federal Transitional Democracy", "Fragile Constitutionalism"],
  cm_af: ["Presidential Republic", "Dominant-Party Rule"],
  ng_af: [
    "Federal Presidential Republic",
    "Multi-Party Democracy",
    "Sharia–Civil Law Dualism",
  ],
  bf_af: ["Military Junta Rule"],
  gm: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Liberal Constitutionalism (post-Jammeh)",
  ],
  bj: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Constitutionalism",
  ],
  tg: [
    "Presidential Dominant System",
    "Gnassingbé Dynasty",
    "Limited Pluralism",
  ],
  gw: [
    "Semi-Presidential Republic",
    "Fragile Democracy",
    "Coup-Prone Governance",
  ],
  gn_af: ["Military Junta", "Transitional Rule"],
  sl: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Post-Conflict Constitutionalism",
  ],
  lr: [
    "Presidential Republic",
    "Multi-Party Democracy",
    "Post-Civil War Governance",
  ],
  mr: [
    "Presidential Republic",
    "Islam as State Religion",
    "Limited Multi-Party Democracy",
  ],
  km: ["Presidential Republic", "Islam as State Religion", "Fragile Democracy"],
  td_af: ["Presidential Transitional Rule"],
  ss_af: ["Fragile Presidential State", "Ethnic Federalism"],
  cd: [
    "Presidential Republic",
    "Multi-Party System",
    "Fragile Constitutionalism",
    "Resource-State Governance",
  ],
  ug_af: ["Presidential Dominant System"],
  rw_2: ["Presidential Dominant System"],
  st: [
    "Semi-Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Governance",
  ],
  mu_af: ["Parliamentary Republic", "Liberal Democracy"],
  // Oceania
  au_oc: [
    "Liberal Democracy",
    "Westminster Parliamentarism",
    "Federalism",
    "Constitutional Monarchy",
    "Common Law",
  ],
  nz: [
    "Liberal Democracy",
    "Westminster Parliamentarism",
    "Māori Treaty Rights",
    "Constitutional Monarchy",
  ],
  pg: [
    "Parliamentary Democracy",
    "Westminster Constitutionalism",
    "Constitutional Monarchy",
    "Melanesian Governance",
  ],
  fj: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Multi-Ethnic Constitutionalism",
  ],
  sb: [
    "Parliamentary Democracy",
    "Westminster Constitutionalism",
    "Constitutional Monarchy",
  ],
  vu: [
    "Parliamentary Republic",
    "Multi-Party Democracy",
    "Custom Law and Constitutionalism",
  ],
  ws: [
    "Parliamentary Republic",
    "Fa'amatai Customary Leadership",
    "Liberal Democracy",
  ],
  to: [
    "Constitutional Monarchy",
    "Tongan Customary Governance",
    "Limited Democracy",
  ],
  ki: [
    "Presidential Republic",
    "Liberal Democracy",
    "Climate Vulnerability Focus",
  ],
  fm: ["Federal Republic", "US Compact Governance", "Liberal Democracy"],
  pw: ["Presidential Republic", "US Compact Governance", "Liberal Democracy"],
  mh: ["Parliamentary Republic", "Liberal Democracy", "US Compact Governance"],
  nr: ["Parliamentary Republic", "Liberal Democracy", "Single-Resource State"],
  tv: [
    "Parliamentary Democracy",
    "Constitutional Monarchy",
    "Liberal Democracy",
  ],
  // Missing European democracies
  es: [
    "Liberal Democracy",
    "Constitutional Monarchy",
    "Parliamentary System",
    "Autonomous Communities (Devolved Federalism)",
    "Rule of Law",
  ],
  nl: [
    "Liberal Democracy",
    "Constitutional Monarchy",
    "Parliamentary System",
    "Rule of Law",
    "Separation of Church and State",
  ],
  ch: [
    "Direct Democracy",
    "Federal Republicanism",
    "Consociationalism",
    "Neutrality Doctrine",
    "Multilingual Constitutionalism",
  ],
  dk: [
    "Liberal Democracy",
    "Constitutional Monarchy",
    "Parliamentary System",
    "Nordic Social Democracy",
    "Rule of Law",
  ],
  fi: [
    "Liberal Democracy",
    "Semi-Presidential Republic",
    "Nordic Social Democracy",
    "Rule of Law",
    "EU Integration",
  ],
  be: [
    "Liberal Democracy",
    "Constitutional Monarchy",
    "Federal System",
    "Consociationalism",
    "Linguistic Community Rights",
  ],
  at: [
    "Liberal Democracy",
    "Federal Republic",
    "Parliamentary System",
    "Social Partnership Model",
    "Rule of Law",
  ],
  pt: [
    "Liberal Democracy",
    "Semi-Presidential Republic",
    "Post-Carnation Revolution Constitutionalism",
    "Rule of Law",
    "EU Integration",
  ],
  gr: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Hellenic Constitutionalism",
    "Rule of Law",
    "EU Integration",
  ],
  cz: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Post-Communist Constitutionalism",
    "Rule of Law",
    "EU Integration",
  ],
  ro: [
    "Liberal Democracy",
    "Semi-Presidential Republic",
    "Post-Communist Constitutionalism",
    "Rule of Law",
    "EU Integration",
  ],
  hr: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Post-Yugoslav Constitutionalism",
    "Rule of Law",
    "EU Integration",
  ],
  bg: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Post-Communist Constitutionalism",
    "Rule of Law",
    "EU Integration",
  ],
  ee: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Digital Governance Pioneer",
    "Rule of Law",
    "EU & NATO Integration",
  ],
  lv: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Post-Soviet Constitutionalism",
    "Rule of Law",
    "EU & NATO Integration",
  ],
  lt: [
    "Liberal Democracy",
    "Semi-Presidential Republic",
    "Post-Soviet Constitutionalism",
    "Rule of Law",
    "EU & NATO Integration",
  ],
  si: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Post-Yugoslav Constitutionalism",
    "Rule of Law",
    "EU & NATO Integration",
  ],
  ie: [
    "Liberal Democracy",
    "Parliamentary Republic",
    "Westminster-Derived Constitutionalism",
    "Bunreacht na hÉireann (1937)",
    "EU Integration",
  ],
  md: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Post-Soviet Constitutionalism",
    "EU Aspirant Governance",
  ],
  al_al: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Post-Communist Constitutionalism",
    "EU & NATO Aspirant",
  ],
  mk: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Post-Yugoslav Constitutionalism",
    "Multi-Ethnic Constitutionalism",
    "EU & NATO Aspirant",
  ],
  ba: [
    "Federal Parliamentary Republic",
    "Dayton Agreement Constitutionalism",
    "Ethnic Power-Sharing",
    "Post-War Governance",
    "EU Aspirant",
  ],
  me_eu: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Post-Yugoslav Constitutionalism",
    "EU & NATO Member",
  ],
  xk: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Post-Conflict Constitutionalism",
    "Partial International Recognition",
  ],
  lu: [
    "Constitutional Monarchy",
    "Liberal Democracy",
    "Grand Duchy Governance",
    "EU Founding Member",
    "Rule of Law",
  ],
  cy: [
    "Presidential Republic",
    "Liberal Democracy",
    "Post-Colonial Constitutionalism",
    "Divided Island Governance",
    "EU Member",
  ],
  mt_eu: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Westminster-Derived Constitutionalism",
    "EU Member",
    "Neutrality Doctrine",
  ],
  is: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Nordic Constitutionalism",
    "World\'s Oldest Parliament (Althing, 930 AD)",
    "NATO Member",
  ],
  // Missing Asian countries
  ph: [
    "Presidential Republic",
    "Liberal Democracy",
    "US-Influenced Constitutionalism",
    "Multi-Party System",
    "Post-Marcos Constitutionalism",
  ],
  bd: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Bengali Secularism",
    "Post-Liberation Constitutionalism",
    "Multi-Party Democracy",
  ],
  ir: [
    "Islamic Republic",
    "Velayat-e Faqih (Guardianship of the Jurist)",
    "Shia Islamic Governance",
    "Theocratic Republicanism",
    "Anti-Western Ideology",
  ],
  uz: [
    "Presidential Authoritarianism",
    "Post-Soviet Secular Governance",
    "Dominant-Party Rule",
    "Modernisation-from-above",
  ],
  kg: [
    "Presidential Republic",
    "Fragile Parliamentary Democracy",
    "Post-Soviet Constitutionalism",
    "Multi-Party Competition",
  ],
  tl: [
    "Semi-Presidential Republic",
    "Liberal Democracy",
    "Post-Colonial Constitutionalism",
    "Catholic Social Teaching",
    "Resistance Movement Legacy",
  ],
  tw: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Democracy",
    "Chinese Constitutionalism (1947)",
    "De Facto Sovereign State",
  ],
  // Missing Caribbean / Americas
  ht: [
    "Presidential Republic",
    "Fragile Constitutional Governance",
    "Gang-Controlled Instability",
    "Transitional Prime Minister Rule",
  ],
  bz: [
    "Westminster Parliamentary Democracy",
    "Constitutional Monarchy",
    "Common Law Constitutionalism",
    "Caribbean Integration",
  ],
  sr: [
    "Presidential Republic",
    "Liberal Democracy",
    "Multi-Party Democracy",
    "Post-Colonial Constitutionalism",
  ],
  // Territories & special cases
  pr: [
    "Unincorporated US Territory",
    "Limited Self-Governance",
    "US Constitutional Framework",
  ],
  gu: ["Unincorporated US Territory", "Limited Self-Governance"],
  fo: ["Autonomous Parliamentary Democracy", "Nordic Constitutionalism"],
  gl: [
    "Autonomous Parliamentary Democracy",
    "Nordic Constitutionalism",
    "Inuit Self-Determination",
  ],
  // Caribbean
  bs: [
    "Westminster Parliamentary Democracy",
    "Constitutional Monarchy",
    "Common Law",
  ],
  ag: ["Westminster Parliamentary Democracy", "Constitutional Monarchy"],
  dm: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Caribbean Constitutionalism",
  ],
  gd: ["Westminster Parliamentary Democracy", "Constitutional Monarchy"],
  bb: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Caribbean Republicanism (post-2021)",
  ],
  lc: ["Westminster Parliamentary Democracy", "Constitutional Monarchy"],
  vc: ["Westminster Parliamentary Democracy", "Constitutional Monarchy"],
  kn: ["Westminster Parliamentary Democracy", "Constitutional Monarchy"],
  // Missing territories / special cases
  coo_af: [
    "Parliamentary Democracy",
    "Free Association with New Zealand",
    "South Pacific Constitutionalism",
  ],
  ck: [
    "Parliamentary Democracy",
    "Free Association with New Zealand",
    "South Pacific Constitutionalism",
  ],
  nu: [
    "Parliamentary Democracy",
    "Free Association with New Zealand",
    "South Pacific Self-Governance",
  ],
  eh: [
    "Disputed Territory",
    "Moroccan Administrative Control",
    "Polisario Front Claim (SADR)",
    "UN-Monitored Status",
  ],
  // Micro-states
  sm: [
    "Parliamentary Republic",
    "Medieval Diarchy",
    "Liberal Democracy",
    "Italian Legal Tradition",
  ],
  li: [
    "Constitutional Monarchy",
    "Liberal Democracy",
    "Swiss-Liechtenstein Economic Union",
  ],
  ad: [
    "Parliamentary Co-Principality",
    "French-Spanish Co-Sovereignty",
    "Liberal Democracy",
  ],
  mc: ["Constitutional Monarchy", "Liberal Democracy", "Grimaldi Principality"],
  bm: [
    "British Overseas Territory",
    "Westminster Parliamentarism",
    "Limited Self-Governance",
  ],
  // Caucasus
  am: [
    "Parliamentary Republic",
    "Liberal Democracy",
    "Rule of Law",
    "Pro-EU Orientation",
  ],
  ge_as: [
    "Semi-Presidential Republic",
    "Liberal Democracy (contested)",
    "EU Aspirant Governance",
  ],
};

const DEFAULT_CONSTITUTION: ConstitutionData = {
  name: "National Constitutional Framework",
  adopted: 1900,
  type: "Constitutional Government",
  ideology: ["Constitutionalism", "Rule of Law", "Democracy"],
  summary:
    "This country operates under a constitutional framework that defines the structure of government, the rights of citizens, and the principles of governance.",
  articles: [
    {
      title: "Sovereignty",
      description:
        "The nation is a sovereign state with supreme authority over its territory and people.",
      type: "principle",
    },
    {
      title: "Rule of Law",
      description:
        "All persons and institutions are accountable to laws that are publicly promulgated and equally enforced.",
      type: "doctrine",
    },
    {
      title: "Fundamental Rights",
      description:
        "Citizens are guaranteed basic civil and political rights including freedom of expression and equal treatment.",
      type: "right",
    },
    {
      title: "Separation of Powers",
      description:
        "Government authority is divided among executive, legislative, and judicial branches with checks and balances.",
      type: "structure",
    },
    {
      title: "Democratic Governance",
      description:
        "The government derives its legitimacy from the consent of the governed through free and fair elections.",
      type: "doctrine",
    },
    {
      title: "Constitutional Supremacy",
      description:
        "The constitution is the supreme law of the land; all other laws must conform to its provisions.",
      type: "principle",
    },
  ],
};

function getConstitution(country: Country): ConstitutionData {
  const base = COUNTRY_CONSTITUTIONS[country.id] ?? DEFAULT_CONSTITUTION;
  // Apply per-country ideology override if the country isn't in the full data set
  if (
    !COUNTRY_CONSTITUTIONS[country.id] &&
    COUNTRY_IDEOLOGY_OVERRIDES[country.id]
  ) {
    return { ...base, ideology: COUNTRY_IDEOLOGY_OVERRIDES[country.id] };
  }
  return base;
}

// ── Per-country political status data ────────────────────────────────────────
interface PoliticalStatus {
  status: string;
  statusColor: string;
  regime: string;
  freedomScore: number; // 0–100, Freedom House style
  freedomLabel: string;
  pressIndex: number; // 0–100 RSF Press Freedom (higher = freer)
  electionType: string;
  lastElection: string;
  nextElection?: string;
  ruling: string;
  opposition: string;
  notes: string;
}

const POLITICAL_STATUS: Record<string, PoliticalStatus> = {
  us: {
    status: "Stable Democracy",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Federal Constitutional Republic",
    freedomScore: 83,
    freedomLabel: "Free",
    pressIndex: 66,
    electionType: "Presidential & Congressional (every 2–4 yrs)",
    lastElection: "November 2024",
    nextElection: "November 2026 (Midterms)",
    ruling: "Republican Party (President Trump, 2025–)",
    opposition: "Democratic Party",
    notes:
      "Two-party system with Electoral College presidential selection. 119th Congress in session. Ongoing debates over institutional norms, executive authority, and electoral integrity.",
  },
  cn: {
    status: "One-Party Authoritarian State",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Unitary One-Party Socialist State",
    freedomScore: 9,
    freedomLabel: "Not Free",
    pressIndex: 7,
    electionType: "Indirect / No competitive elections",
    lastElection: "NPC Elections: March 2023",
    nextElection: "NPC: March 2028",
    ruling:
      "Chinese Communist Party — Xi Jinping (General Secretary since 2012, President since 2013)",
    opposition: "No legal opposition parties",
    notes:
      "Xi Jinping consolidated unprecedented power via 2018 constitutional amendment removing term limits. CCP controls all branches. Significant crackdowns in Hong Kong, Xinjiang, and Tibet. Strategic rivalry with the United States.",
  },
  de: {
    status: "Stable Parliamentary Democracy",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Federal Parliamentary Republic",
    freedomScore: 94,
    freedomLabel: "Free",
    pressIndex: 78,
    electionType: "Proportional Federal Elections (every 4 yrs)",
    lastElection: "February 2025",
    nextElection: "2029",
    ruling: "CDU/CSU-SPD Grand Coalition — Friedrich Merz (Chancellor, 2025–)",
    opposition: "SPD (junior coalition partner), Greens, FDP, AfD",
    notes:
      "AfD (Alternative für Deutschland) surged to 20.8% in 2025 elections, reflecting populist-right shift. New CDU/CSU-led government formed after Olaf Scholz\'s traffic-light coalition collapsed in November 2024. Migration and economic competitiveness are dominant political issues.",
  },
  gb: {
    status: "Stable Parliamentary Democracy",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Constitutional Parliamentary Monarchy",
    freedomScore: 93,
    freedomLabel: "Free",
    pressIndex: 79,
    electionType: "First-Past-The-Post General Elections (≤5 yr terms)",
    lastElection: "July 2024",
    nextElection: "By July 2029",
    ruling: "Labour Party — Keir Starmer (Prime Minister, July 2024–)",
    opposition: "Conservative Party, Reform UK, Liberal Democrats",
    notes:
      "Labour won 2024 general election in a landslide, ending 14 years of Conservative government. Reform UK (Nigel Farage) emerged as a significant populist force with 14.3% of vote. Post-Brexit trade and Northern Ireland Protocol remain ongoing political challenges.",
  },
  fr: {
    status: "Politically Volatile Democracy",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Unitary Semi-Presidential Republic",
    freedomScore: 90,
    freedomLabel: "Free",
    pressIndex: 75,
    electionType: "Two-Round Presidential (5 yr) + Legislative (5 yr)",
    lastElection: "Legislative: July 2024",
    nextElection: "Presidential: April 2027",
    ruling:
      "Centrist Alliance (Renaissance) — Emmanuel Macron (President, 2017–2027)",
    opposition:
      "Rassemblement National (Marine Le Pen), NUPES/NFP left coalition",
    notes:
      "Macron called snap elections in June 2024, resulting in a hung parliament with no bloc holding a majority. Prime Minister François Bayrou leads a minority government. RN (far-right) became the largest single party by first-round votes. Political instability remains high.",
  },
  jp: {
    status: "Stable Democracy",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Constitutional Parliamentary Monarchy",
    freedomScore: 96,
    freedomLabel: "Free",
    pressIndex: 70,
    electionType:
      "Parliamentary (Lower House ≤4 yr, Upper House 3 yr rotation)",
    lastElection: "House of Representatives: October 2024",
    nextElection: "House of Councillors: July 2025",
    ruling:
      "Liberal Democratic Party (LDP) — Shigeru Ishiba (Prime Minister, October 2024–)",
    opposition: "Constitutional Democratic Party of Japan (CDP), Nippon Ishin",
    notes:
      "LDP lost its parliamentary majority in October 2024 elections for first time since 2009, forming a minority coalition. LDP has governed Japan for nearly all of the post-war period. Ishiba succeeded Kishida after the LDP slush fund scandal damaged the party.",
  },
  in: {
    status: "Electoral Democracy (Democratic Backsliding Concerns)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Federal Parliamentary Republic",
    freedomScore: 66,
    freedomLabel: "Partly Free",
    pressIndex: 31,
    electionType: "First-Past-The-Post Parliamentary Elections (every 5 yrs)",
    lastElection: "General Elections: April–June 2024",
    nextElection: "2029",
    ruling:
      "Bharatiya Janata Party (BJP) / NDA Coalition — Narendra Modi (Prime Minister, 2014–)",
    opposition: "Indian National Congress (INC) / INDIA alliance",
    notes:
      "Modi won a third term in 2024 but lost his parliamentary majority, forming a coalition dependent on regional allies. V-Dem and Freedom House note democratic erosion including press freedom constraints, Hindu nationalist policies, and judicial independence concerns. World\'s largest democracy by voter count (969M eligible voters in 2024).",
  },
  br: {
    status: "Democracy (Institutional Stress)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Federal Presidential Republic",
    freedomScore: 73,
    freedomLabel: "Free",
    pressIndex: 57,
    electionType: "Direct Presidential + Congressional (4 yr terms)",
    lastElection: "October 2022",
    nextElection: "October 2026",
    ruling:
      "Workers\' Party (PT) — Luiz Inácio Lula da Silva (President, January 2023–)",
    opposition: "Liberal Party (PL) — Bolsonaro movement",
    notes:
      "Lula\'s 2022 victory was followed by a January 8 2023 insurrection by Bolsonaro supporters who stormed Congress, the Supreme Court, and the Presidential Palace. Bolsonaro charged with coup attempt. Political polarization remains extreme. Amazon deforestation reduction and fiscal responsibility are key policy debates.",
  },
  ru: {
    status: "Authoritarian Regime",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Federal Semi-Presidential (De facto Presidential Autocracy)",
    freedomScore: 5,
    freedomLabel: "Not Free",
    pressIndex: 9,
    electionType: "Managed elections (no genuine competition)",
    lastElection:
      "Presidential: March 2024 (87.3% for Putin, widely deemed non-free)",
    nextElection: "2030",
    ruling:
      "United Russia party — Vladimir Putin (President 2000–2008, 2012–, now constitutionally eligible until 2036)",
    opposition:
      "Opposition suppressed; Alexei Navalny died in prison February 2024",
    notes:
      "Russia invaded Ukraine February 24, 2022. International isolation, sanctions, and war economy dominate politics. Independent media essentially eliminated. Navalny\'s death in Arctic penal colony intensified international condemnation. 2020 constitutional amendment reset Putin\'s term count, allowing rule until 2036.",
  },
  kp: {
    status: "Totalitarian Dictatorship",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Unitary One-Party Juche Totalitarian State",
    freedomScore: 3,
    freedomLabel: "Not Free",
    pressIndex: 1,
    electionType: "Single-candidate elections (no genuine voting)",
    lastElection: "SPA: November 2023 (99.99% turnout reported)",
    ruling: "Korean Workers\' Party — Kim Jong-un (Supreme Leader since 2011)",
    opposition:
      "No opposition; dissent punishable by execution or kwanliso camps",
    notes:
      "Kim Jong-un has conducted 100+ missile tests since taking power. DPRK constitutionally declared a nuclear state in 2012. Estimated 80,000–120,000 political prisoners in concentration camps. Russia-DPRK military cooperation expanded significantly in 2024 with troops deployed to support Russia in Ukraine.",
  },
  au_oc: {
    status: "Stable Liberal Democracy",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Federal Parliamentary Constitutional Monarchy",
    freedomScore: 97,
    freedomLabel: "Free",
    pressIndex: 87,
    electionType: "Preferential House + Proportional Senate (3-yr cycle)",
    lastElection: "Federal Election: May 2025",
    nextElection: "2028",
    ruling:
      "Australian Labor Party — Anthony Albanese (Prime Minister, 2022–, re-elected 2025)",
    opposition:
      "Liberal-National Coalition (Peter Dutton leader), Greens, independents (Teals)",
    notes:
      "Labor won the May 2025 federal election with an increased majority. The 'Teal' independent movement — moderate pro-climate centrists in previously safe Liberal seats — consolidated into a significant parliamentary force. Indigenous Voice to Parliament referendum was defeated (60% No) in October 2023. Cost of living and housing affordability are dominant issues.",
  },
  ca: {
    status: "Stable Parliamentary Democracy",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Federal Parliamentary Constitutional Monarchy",
    freedomScore: 98,
    freedomLabel: "Free",
    pressIndex: 85,
    electionType: "First-Past-The-Post Federal Elections (≤5 yr terms)",
    lastElection: "Federal Election: April 2025",
    nextElection: "By 2030",
    ruling:
      "Liberal Party of Canada — Mark Carney (Prime Minister, March 2025–)",
    opposition: "Conservative Party (Pierre Poilievre), NDP, Bloc Québécois",
    notes:
      "Mark Carney replaced Justin Trudeau as Liberal leader and PM in March 2025, winning the April 2025 federal election on a platform of economic sovereignty in response to U.S. tariff threats under Trump. The election was dominated by U.S.-Canada trade tensions and cost of living. The NDP lost official party status.",
  },
  kr: {
    status: "Democracy (Constitutional Crisis Resolved)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Unitary Presidential Constitutional Republic",
    freedomScore: 83,
    freedomLabel: "Free",
    pressIndex: 62,
    electionType:
      "Direct Presidential (single 5-yr term) + Parliamentary (4 yr)",
    lastElection:
      "Presidential: June 2025 (snap election after Yoon impeachment)",
    nextElection: "Parliamentary: 2028",
    ruling: "Democratic Party — Lee Jae-myung (President, June 2025–)",
    opposition: "People Power Party (PPP)",
    notes:
      "President Yoon Suk-yeol declared martial law on 3 December 2024 — the first in 44 years. The National Assembly voted to lift it within 6 hours. Yoon was impeached 14 December 2024 and the Constitutional Court upheld the impeachment in April 2025. Lee Jae-myung won the June 2025 snap presidential election. South Korea's democratic resilience was widely noted.",
  },
  ae: {
    status: "Absolute Monarchy (Reformist)",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Federal Absolute Monarchy",
    freedomScore: 17,
    freedomLabel: "Not Free",
    pressIndex: 22,
    electionType:
      "Advisory FNC elections (limited electorate); no competitive elections",
    lastElection: "Federal National Council: October 2023",
    nextElection: "FNC: 2027",
    ruling:
      "Federal Supreme Council (7 hereditary rulers) — President Sheikh Mohamed bin Zayed Al Nahyan (MBZ), VP Sheikh Mohammed bin Rashid Al Maktoum",
    opposition: "No political parties permitted",
    notes:
      "UAE under MBZ and Dubai's MBR pursues aggressive economic diversification (tourism, finance, tech), social liberalization (entertainment, mixed-gender events, expat rights), and assertive foreign policy. UAE normalized relations with Israel (Abraham Accords, 2020). Strategic competition with Saudi Arabia in the Gulf is a growing dynamic. No genuine electoral democracy.",
  },
  sg: {
    status: "Dominant-Party Democracy (Limited Pluralism)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Unitary Parliamentary Constitutional Republic",
    freedomScore: 47,
    freedomLabel: "Partly Free",
    pressIndex: 58,
    electionType:
      "First-Past-The-Post Group Representation + SMC (≤5 yr terms)",
    lastElection: "General Election: May 2025",
    nextElection: "By 2030",
    ruling:
      "People's Action Party (PAP) — Lawrence Wong (Prime Minister, May 2024–)",
    opposition: "Workers' Party (10 seats), Progress Singapore Party",
    notes:
      "Lawrence Wong succeeded Lee Hsien Loong in May 2024. The PAP won the May 2025 GE with 65.6% of votes, retaining its parliamentary supermajority. The Workers' Party holds 10 seats — the most opposition MPs since independence. Singapore's economic model and social stability remain exemplary but political space is tightly managed.",
  },
  il_as: {
    status: "Democracy Under Severe Strain (Constitutional Crisis + War)",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Unitary Parliamentary Democracy (No Formal Constitution)",
    freedomScore: 76,
    freedomLabel: "Free",
    pressIndex: 50,
    electionType: "Proportional parliamentary elections (4-yr terms or snap)",
    lastElection: "Knesset: November 2022",
    nextElection: "By November 2026 (or snap earlier)",
    ruling:
      "Likud + Ultra-Orthodox + Far-Right Coalition — Benjamin Netanyahu (Prime Minister)",
    opposition:
      "National Unity (Gantz/Eisenkot), Yesh Atid, Yisrael Beiteinu, Joint Arab List",
    notes:
      "Israel is simultaneously fighting the Gaza War (since October 7 Hamas attack, 2023), managing the West Bank, and facing the ICC arrest warrant for PM Netanyahu (November 2024). The 2023 judicial override law sparked mass protests. Netanyahu faces corruption charges. The coalition's far-right members (Smotrich, Ben Gvir) have pushed extremist positions, straining democratic norms.",
  },
  tr: {
    status: "Competitive Authoritarian / Electoral Democracy",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Unitary Presidential Republic",
    freedomScore: 32,
    freedomLabel: "Partly Free",
    pressIndex: 26,
    electionType:
      "Direct Presidential (5-yr) + Parliamentary (5-yr) simultaneous",
    lastElection: "Presidential & Parliamentary: May 2023",
    nextElection: "2028",
    ruling:
      "AKP-MHP People's Alliance — Recep Tayyip Erdoğan (President, 2014–; PM 2003-2014)",
    opposition:
      "CHP (Ekrem İmamoğlu, Istanbul mayor arrested March 2025), HDP/DEM Party",
    notes:
      "Erdoğan won the 2023 presidential election in a runoff (52%). March 2025: Istanbul mayor Ekrem İmamoğlu arrested and charged with terrorism — triggering Turkey's largest protests since 2013 Gezi Park demonstrations. İmamoğlu's arrest widely seen as politically motivated attempt to eliminate leading opposition presidential candidate.",
  },
  za: {
    status: "Democracy (Post-ANC Majority, GNU)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Unitary Presidential Constitutional Republic",
    freedomScore: 79,
    freedomLabel: "Free",
    pressIndex: 55,
    electionType: "Proportional Parliamentary Elections (5 yr terms)",
    lastElection: "National Elections: May 2024",
    nextElection: "2029",
    ruling:
      "Government of National Unity (GNU) — ANC + DA + IFP + other parties; Cyril Ramaphosa (President)",
    opposition: "uMkhonto we Sizwe (Jacob Zuma's party), EFF",
    notes:
      "The ANC fell below 50% for the first time since 1994, winning 40.2% in May 2024. It formed a Government of National Unity (GNU) with the DA (21.8%) and others. Jacob Zuma's new MK party won 14.6% — mainly in KwaZulu-Natal. GNU faces severe challenges: 31% unemployment, rolling blackouts (loadshedding), infrastructure collapse, and corruption legacy.",
  },
  ng: {
    status: "Electoral Democracy (Weak Institutions)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Federal Presidential Constitutional Republic",
    freedomScore: 43,
    freedomLabel: "Partly Free",
    pressIndex: 37,
    electionType: "Direct Presidential + Congressional (4-yr terms)",
    lastElection: "Presidential & National Assembly: February 2023",
    nextElection: "2027",
    ruling:
      "All Progressives Congress (APC) — Bola Tinubu (President, May 2023–)",
    opposition: "Peoples Democratic Party (PDP), Labour Party (Peter Obi)",
    notes:
      "Tinubu won a disputed 2023 election (36.6% in a 3-way race) confirmed by courts. His removal of petrol subsidies caused immediate inflation spike. Naira devaluation hit 70% in 2024. Labour Party's Peter Obi emerged as major opposition force. Security crises in the north (Boko Haram/ISWAP), Niger Delta, and southeast (IPOB secessionist movement) continue.",
  },
  eg: {
    status: "Authoritarian Regime",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Unitary Presidential Republic (Military-Backed Autocracy)",
    freedomScore: 18,
    freedomLabel: "Not Free",
    pressIndex: 23,
    electionType: "Managed elections (no genuine competition)",
    lastElection: "Presidential: December 2023 (89.6% for Sisi)",
    nextElection: "2030",
    ruling:
      "Independent (military-backed) — Abdel Fattah el-Sisi (President, 2014–, 2019 term extension to 2030)",
    opposition:
      "Political parties exist but face systematic repression; most opposition leaders imprisoned",
    notes:
      "Sisi won his third term in December 2023 (89.6%) in an election with no serious opposition. Egypt holds 60,000+ political prisoners according to human rights organizations. The economy is under severe IMF restructuring; the pound lost 70% of its value in 2022-2024. The Gaza war (bordering Sinai) has significantly impacted Egypt's geopolitical role as mediator.",
  },
  ar: {
    status: "Democracy (Economic Reform Under Milei)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Federal Presidential Constitutional Republic",
    freedomScore: 85,
    freedomLabel: "Free",
    pressIndex: 63,
    electionType: "Direct Presidential + Congressional (4-yr terms, staggered)",
    lastElection: "Presidential: November 2023",
    nextElection: "Congressional midterms: October 2025",
    ruling: "La Libertad Avanza — Javier Milei (President, December 2023–)",
    opposition:
      "Peronism/Kirchnerism (Unión por la Patria), PRO (Macri), Radical Civic Union",
    notes:
      "Libertarian Javier Milei won the November 2023 runoff (55.7%) amid economic crisis. His shock-therapy reforms — chainsaw spending cuts, dollarization discussion, elimination of 10 ministries — cut the fiscal deficit and reduced inflation from 290% to ~50% annualized by mid-2025. But poverty rose above 40% and social tensions remain high. October 2025 midterms will test his governing viability.",
  },
  cl: {
    status: "Stable Democracy (Post-Rejection Stability)",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Unitary Presidential Republic",
    freedomScore: 94,
    freedomLabel: "Free",
    pressIndex: 74,
    electionType:
      "Direct Presidential (4-yr, no immediate re-election) + Congressional",
    lastElection: "Presidential: November 2021",
    nextElection: "Presidential & Congressional: November 2025",
    ruling:
      "Apruebo Dignidad (Broad Front + Communist Party) — Gabriel Boric (President, March 2022–)",
    opposition:
      "Chile Vamos (right coalition), Republican Party (José Antonio Kast)",
    notes:
      "Boric (elected at 35, Chile's youngest president) governs amid weak approval ratings (~30%). Two constitutional replacement attempts failed: September 2022 (62% No) and December 2023 (55% No). Chile continues under the amended 1980 constitution. November 2025 elections will be a major test of the left-right balance.",
  },
  my: {
    status: "Parliamentary Democracy (Reformist Coalition)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Federal Constitutional Elective Monarchy",
    freedomScore: 52,
    freedomLabel: "Partly Free",
    pressIndex: 46,
    electionType: "First-Past-The-Post Parliamentary Elections (≤5 yr terms)",
    lastElection: "General Election: November 2022",
    nextElection: "By November 2027",
    ruling:
      "Pakatan Harapan + Gabungan Parti Sarawak — Anwar Ibrahim (Prime Minister, November 2022–)",
    opposition:
      "Perikatan Nasional (PN — Bersatu + PAS), UMNO (within Barisan Nasional, in unity govt)",
    notes:
      "Anwar Ibrahim finally became PM after 24 years of political struggle (including two prison terms). His 'Madani' (civilised) government faces Islamist opposition from Perikatan Nasional. The Agong's appointment of Anwar amid a hung parliament was constitutionally significant. State elections in 2023 showed PN's Islamic conservative base growing in peninsular Malay heartlands.",
  },
  th: {
    status: "Limited Democracy (Military-Constitutional Constraints)",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Constitutional Monarchy (Military-Influenced)",
    freedomScore: 29,
    freedomLabel: "Not Free",
    pressIndex: 35,
    electionType: "Proportional + constituency hybrid (4-yr terms)",
    lastElection: "General Election: May 2023",
    nextElection: "2027",
    ruling:
      "Pheu Thai Party — Paetongtarn Shinawatra (Prime Minister, August 2024–)",
    opposition:
      "People's Party (successor to dissolved Move Forward), United Thai Nation",
    notes:
      "Move Forward won most seats in May 2023 (14.4M votes) but was blocked from forming government by appointed Senate. The Constitutional Court dissolved Move Forward in August 2024 and banned its leader. Srettha Thavisin (Pheu Thai PM) was removed by Constitutional Court in August 2024; Paetongtarn Shinawatra (daughter of Thaksin) became PM. Thaksin returned from exile and received royal pardon.",
  },
  id: {
    status: "Electoral Democracy (Democratic Backsliding Concerns)",
    statusColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    regime: "Unitary Presidential Republic",
    freedomScore: 59,
    freedomLabel: "Partly Free",
    pressIndex: 52,
    electionType:
      "Direct simultaneous Presidential + DPR + DPD elections (5-yr terms)",
    lastElection: "Presidential & Parliamentary: February 2024",
    nextElection: "2029",
    ruling:
      "Gerindra-led coalition — Prabowo Subianto (President, October 2024–)",
    opposition: "PDI-P (Megawati/Puan Maharani), PKS",
    notes:
      "Prabowo Subianto, who lost two previous presidential races (2014, 2019), won in February 2024 (58.6%) with Gibran Rakabuming Raka (Jokowi's son, age 36) as VP — following a controversial Constitutional Court ruling lowering the VP age requirement. Jokowi's son-in-law dynamics sparked nepotism concerns. Indonesia's democracy rated as backsliding by V-Dem.",
  },
  vn: {
    status: "One-Party Authoritarian State",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Unitary One-Party Socialist Republic",
    freedomScore: 19,
    freedomLabel: "Not Free",
    pressIndex: 20,
    electionType: "VCP-controlled National Assembly elections (5-yr terms)",
    lastElection: "National Assembly: May 2021",
    nextElection: "May 2026",
    ruling:
      "Vietnamese Communist Party — Tô Lâm (General Secretary, 2024–; President, 2024–)",
    opposition: "No legal opposition; independent civil society suppressed",
    notes:
      "Vietnam has undergone rapid political consolidation. General Secretary Nguyễn Phú Trọng died in July 2024 after 13 years of anti-corruption 'Blazing Furnace' campaign. Tô Lâm (former Public Security minister) consolidated power as both GS and President — emulating China's Xi Jinping model. Hundreds of journalists, activists, and bloggers imprisoned. Economic growth remains strong at ~6% despite political tightening.",
  },
  ua: {
    status: "Wartime Democracy",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Unitary Semi-Presidential Republic",
    freedomScore: 60,
    freedomLabel: "Partly Free",
    pressIndex: 58,
    electionType:
      "Parliamentary + Presidential elections (suspended under martial law)",
    lastElection: "Presidential: March 2019 / Parliamentary: July 2019",
    nextElection: "Post-war (elections suspended under martial law)",
    ruling:
      "Servant of the People — Volodymyr Zelensky (President, May 2019–; extended under martial law)",
    opposition:
      "European Solidarity (Poroshenko), Voice, various; Parliament (Rada) in session",
    notes:
      "Ukraine has maintained democratic institutions during Russia's full-scale invasion (February 2022). The Verkhovna Rada meets regularly and exercises parliamentary oversight. Presidential elections due March 2024 were suspended under martial law. Zelensky's term is legally extended until elections can safely be held post-war. Western military aid (NATO, EU, U.S.) is critical to Ukraine's defense.",
  },
  pl: {
    status: "Democracy (Rule of Law Restoration)",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Unitary Semi-Presidential Parliamentary Republic",
    freedomScore: 83,
    freedomLabel: "Free",
    pressIndex: 65,
    electionType:
      "Proportional + single-mandate Sejm + Senate elections (4-yr terms)",
    lastElection: "Parliamentary: October 2023",
    nextElection: "Presidential: May 2025; Parliamentary: 2027",
    ruling:
      "Civic Coalition + TD + The Left — Donald Tusk (Prime Minister, December 2023–)",
    opposition: "PiS (Jarosław Kaczyński), Konfederacja (far-right)",
    notes:
      "Tusk's coalition defeated PiS in October 2023 after 8 years. Rule-of-law restoration is ongoing: Constitutional Tribunal reform blocked by President Duda's vetoes until his term ends. EU suspended Article 7 proceedings after seeing reform progress. Presidential election in May 2025 is pivotal — a PiS-aligned president (Duda's successor) could veto Tusk's reforms.",
  },
  it: {
    status: "Stable Democracy (Centre-Right Govt)",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Unitary Parliamentary Republic",
    freedomScore: 90,
    freedomLabel: "Free",
    pressIndex: 63,
    electionType: "Proportional Parliamentary Elections (5 yr terms)",
    lastElection: "Parliamentary: September 2022",
    nextElection: "By September 2027",
    ruling:
      "Centre-Right Coalition (FdI + Lega + FI) — Giorgia Meloni (Prime Minister, October 2022–)",
    opposition: "Centre-Left (PD + M5S + AVS + IV)",
    notes:
      "Giorgia Meloni (Brothers of Italy, post-fascist roots) leads Italy's most right-wing government since WWII, but has governed more pragmatically than feared: maintaining EU and NATO commitments, supporting Ukraine, accepting EU budget rules. Migration policy is the most contentious issue. Italy's growth remains sluggish; high debt (140% of GDP) constrains fiscal space.",
  },
  pk: {
    status: "Hybrid Regime (Civil-Military Tensions)",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Federal Parliamentary Islamic Republic",
    freedomScore: 27,
    freedomLabel: "Not Free",
    pressIndex: 26,
    electionType:
      "First-Past-The-Post National Assembly + Provincial elections (5-yr terms)",
    lastElection: "General Elections: February 2024",
    nextElection: "2029",
    ruling: "PMLN-PPP coalition — Shehbaz Sharif (Prime Minister, March 2024–)",
    opposition:
      "PTI (Imran Khan imprisoned); PTI candidates ran as independents, won most seats but blocked from power",
    notes:
      "Imran Khan has been imprisoned since August 2023 on multiple convictions his supporters call politically motivated. In the February 2024 elections, PTI-backed independents won the most seats, but the military-backed PMLN-PPP coalition formed government. Pakistan faces economic crisis (IMF bailout), terrorism from TTP, and tense civil-military relations. Khan's legal battles continue.",
  },
  et: {
    status: "Dominant-Party Authoritarian (Post-War Reconstruction)",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Federal Parliamentary Republic (De facto Presidential Autocracy)",
    freedomScore: 27,
    freedomLabel: "Not Free",
    pressIndex: 27,
    electionType: "Managed parliamentary elections (Prosperity Party dominant)",
    lastElection: "Parliamentary: June 2021",
    nextElection: "2026",
    ruling:
      "Prosperity Party — Abiy Ahmed (Prime Minister, April 2018–; Nobel Peace Prize 2019)",
    opposition:
      "Tigray People's Liberation Front (TPLF, armed/political), Oromo Liberation Army (armed)",
    notes:
      "The Tigray War (November 2020 – November 2022) killed an estimated 300,000-500,000 people and displaced millions. The Pretoria Agreement (November 2022) ended the civil war. Conflict continues in Amhara and Oromia regions. Abiy Ahmed's Prosperity Party dominates politics; media freedom and civil liberties remain severely constrained. Horn of Africa's strategic importance growing with Red Sea tensions.",
  },
  se: {
    status: "Stable Democracy (NATO Member since 2024)",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Unitary Constitutional Monarchy",
    freedomScore: 100,
    freedomLabel: "Free",
    pressIndex: 88,
    electionType: "Proportional Riksdag Elections (4-yr terms)",
    lastElection: "Riksdag: September 2022",
    nextElection: "September 2026",
    ruling:
      "Moderate Party + Sweden Democrats (confidence-and-supply) — Ulf Kristersson (PM, October 2022–)",
    opposition: "Social Democrats (Magdalena Andersson), Greens, Left Party",
    notes:
      "Sweden joined NATO in March 2024 — ending 200 years of military non-alignment, a historic shift triggered by Russia's invasion of Ukraine. The Kristersson government relies on the far-right Sweden Democrats for support, marking the first time SD has formal influence. Gang violence and integration are dominant domestic issues. Sweden's welfare state remains one of the world's most comprehensive.",
  },
  no: {
    status: "Stable Democracy (Consistent Top Rankings)",
    statusColor: "text-green-400 border-green-500/30 bg-green-500/10",
    regime: "Unitary Constitutional Monarchy",
    freedomScore: 100,
    freedomLabel: "Free",
    pressIndex: 95,
    electionType: "Proportional Storting Elections (4-yr terms)",
    lastElection: "Storting: September 2021",
    nextElection: "September 2025",
    ruling:
      "Labour + Centre Party coalition — Jonas Gahr Støre (Prime Minister, October 2021–)",
    opposition: "Conservative Party (Erna Solberg), Progress Party, FRP",
    notes:
      "Norway consistently ranks 1st or 2nd globally on Democracy Index, Press Freedom, and Human Development. The Government Pension Fund Global (oil fund, $1.7 trillion) is the world's largest sovereign wealth fund. September 2025 elections expected to be competitive — polls show right-leaning opposition competitive. NATO membership confirmed; defence spending being raised to 2% of GDP.",
  },
  sa: {
    status: "Absolute Monarchy",
    statusColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    regime: "Unitary Islamic Absolute Monarchy",
    freedomScore: 8,
    freedomLabel: "Not Free",
    pressIndex: 12,
    electionType: "Municipal elections only (men and women since 2015)",
    lastElection: "Consultative Council appointed by King",
    ruling:
      "House of Saud — King Salman (since 2015), Crown Prince Mohammed bin Salman (de facto ruler)",
    opposition: "Political parties banned",
    notes:
      "MBS (Crown Prince Mohammed bin Salman) has driven Saudi Vision 2030 economic reforms and social liberalization (women driving, entertainment, tourism) while maintaining authoritarian political control. Assassination of journalist Jamal Khashoggi in 2018 severely damaged international reputation. Saudi-Iran rapprochement (2023) and potential Saudi-Israel normalization are key geopolitical developments.",
  },
  ir: {
    status: "Theocratic Authoritarian State",
    statusColor: "text-red-400 border-red-500/30 bg-red-500/10",
    regime: "Unitary Islamic Republic (Theocracy with electoral elements)",
    freedomScore: 14,
    freedomLabel: "Not Free",
    pressIndex: 13,
    electionType:
      "Guardian Council-filtered presidential + parliamentary elections",
    lastElection: "Presidential: June 2024",
    ruling:
      "Supreme Leader Ali Khamenei (since 1989); President Masoud Pezeshkian (July 2024–)",
    opposition: "Reformists allowed only under Guardian Council approval",
    notes:
      "Supreme Leader holds ultimate authority over all state institutions. Reformist Pezeshkian won June 2024 presidential election after conservative hardliner Ebrahim Raisi died in helicopter crash. Woman-Life-Freedom uprising (2022–23) followed Mahsa Amini\'s death in morality police custody. Iran has advanced its nuclear program significantly under heavy sanctions.",
  },
};

const DEFAULT_POLITICAL_STATUS: PoliticalStatus = {
  status: "Constitutional Government",
  statusColor: "text-secondary border-secondary/30 bg-secondary/10",
  regime: "Constitutional State",
  freedomScore: 50,
  freedomLabel: "Partly Free",
  pressIndex: 50,
  electionType: "Regular Elections",
  lastElection: "Recent",
  ruling: "Governing Party / Coalition",
  opposition: "Parliamentary Opposition",
  notes:
    "This country operates under a constitutional framework with regular elections and formal separation of powers.",
};

function getPoliticalStatus(country: Country): PoliticalStatus {
  return POLITICAL_STATUS[country.id] ?? DEFAULT_POLITICAL_STATUS;
}

const LEGAL_SYSTEMS: Record<
  string,
  { system: string; family: string; codified: boolean; description: string }
> = {
  us: {
    system: "Common Law",
    family: "Anglo-American",
    codified: false,
    description:
      "Judge-made case law (stare decisis) governs alongside statute. No single codified civil law. Federal system with 50 state legal systems. Louisiana uses civil law (French/Spanish heritage).",
  },
  cn: {
    system: "Socialist Civil Law",
    family: "Socialist / Civil Law Hybrid",
    codified: true,
    description:
      "Codified statutory system derived from Soviet and continental European models, adapted to CCP ideology. Civil Code enacted 2021. Party guidance supersedes judicial independence.",
  },
  de: {
    system: "Civil Law (Pandectist)",
    family: "German-Roman",
    codified: true,
    description:
      "Highly codified system rooted in Roman law and the Pandectist tradition. Bürgerliches Gesetzbuch (BGB, 1900) governs private law. Federal Constitutional Court exercises judicial review. Influential in many European and East Asian legal systems.",
  },
  gb: {
    system: "Common Law (Uncodified)",
    family: "Anglo-American",
    codified: false,
    description:
      "Oldest common law system in the world — precedent (stare decisis) forms the backbone. No codified constitution. Parliamentary Acts, delegated legislation, and judge-made law coexist. Scotland operates under a separate mixed (civil/common) law system.",
  },
  fr: {
    system: "Civil Law (Napoleonic)",
    family: "Napoleonic / Romano-Germanic",
    codified: true,
    description:
      "The Napoleonic Code (Code Civil, 1804) is the archetype for civil law systems globally. Highly codified private, commercial, criminal, and administrative law. Separate administrative courts (Conseil d\'État) operate alongside ordinary courts.",
  },
  jp: {
    system: "Civil Law (German-influenced)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Meiji-era codification modeled on German BGB and French codes. Post-WWII constitutional reforms under U.S. influence added common law elements (judicial review, jury trial option). Civil Code, Criminal Code, and Commercial Code are central statutes.",
  },
  in: {
    system: "Common Law (Hybrid)",
    family: "Anglo-Indian Hybrid",
    codified: false,
    description:
      "Inherited British common law, overlaid with codified personal laws by religion (Hindu law, Muslim personal law, Parsi law). Constitution is codified but case law is paramount. Separate tribunals for administrative, tax, and labor matters.",
  },
  br: {
    system: "Civil Law (Napoleonic/Portuguese)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Based on Portuguese civil law influenced by the Napoleonic Code. New Civil Code enacted 2002. Complex federalist legal system with federal, state, and specialized courts. STF (Supreme Federal Tribunal) exercises both constitutional review and regular supreme court functions.",
  },
  ru: {
    system: "Civil Law (Soviet-derived)",
    family: "Romano-Germanic / Socialist",
    codified: true,
    description:
      "Post-Soviet Russia adopted a new Civil Code (1994–2006) based on continental European models, displacing Soviet law. Criminal law was substantially reformed in 1996. In practice, judicial independence is severely limited; courts operate as instruments of state authority.",
  },
  kp: {
    system: "Socialist Law",
    family: "Socialist",
    codified: true,
    description:
      "Nominally based on socialist legal principles derived from Soviet/Chinese models. All law subordinate to KWP ideology and supreme leader directives. Courts are instruments of party control; no independent judiciary. Criminal law used extensively as political tool.",
  },
  sa: {
    system: "Islamic Law (Sharia)",
    family: "Islamic / Sharia",
    codified: false,
    description:
      "Sharia as interpreted by Hanbali school of Sunni Islam is the supreme law. No codified penal code historically; Basic Law of Governance (1992) provides a constitutional-type framework. The Council of Ministers issues royal decrees that supplement Sharia. Modernizing reforms underway under Vision 2030.",
  },
  au_oc: {
    system: "Common Law",
    family: "Anglo-Australian",
    codified: false,
    description:
      "Australia follows the English common law tradition — judge-made precedent (stare decisis) governs alongside statute. Each state has its own Supreme Court; the High Court is the apex court. Australia has no bill of rights at the federal level (unlike Canada or the UK's HRA), though some states have legislated charters of rights.",
  },
  ca: {
    system: "Common Law + Civil Law (Quebec)",
    family: "Mixed: Anglo-Canadian + Civil Law",
    codified: true,
    description:
      "Canada uses English common law in nine provinces and territories, but Quebec uses civil law (Code Civil du Québec, based on French Napoleonic tradition) for private law. The Canadian Charter of Rights and Freedoms (1982) is constitutionally supreme. Federal criminal law is common law; Quebec maintains a distinct civil code for contracts, property, and family law.",
  },
  kr: {
    system: "Civil Law (German-influenced)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "South Korea's legal system was shaped by Japanese colonial law (1910-1945), which was based on German civil law. Post-war reforms introduced U.S.-influenced constitutional elements including judicial review. The Civil Code (1960), Criminal Code, Commercial Code, and Family Law are the core codified statutes. Constitutional Court (1988) exercises concentrated constitutional review.",
  },
  sg: {
    system: "Common Law (English-derived)",
    family: "Anglo-Singapore",
    codified: false,
    description:
      "Singapore's legal system is based on English common law, inherited from British colonial rule. Case law is binding (stare decisis), though Singapore courts may depart from English precedent since independence. The Supreme Court is the highest court (Court of Appeal for non-constitutional matters). Key commercial law is highly sophisticated — Singapore is a major international arbitration hub.",
  },
  il_as: {
    system: "Mixed: Common Law + Ottoman Residuals + Sharia/Rabbinical",
    family: "Mixed: Anglo-Israeli Hybrid",
    codified: false,
    description:
      "Israel has no single constitution or civil code. The legal system blends English common law (inherited via British Mandate), Ottoman civil law residuals, and religious law for personal status (Jews under rabbinical courts, Muslims under Sharia courts, Christians under ecclesiastical courts). The Supreme Court exercises both ordinary and constitutional review functions.",
  },
  tr: {
    system: "Civil Law (Swiss and French-influenced)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Turkey adopted a comprehensive civil law system under Atatürk's reforms: the Civil Code (1926, based on Swiss Civil Code), Commercial Code, and Criminal Code (replaced 2004). Sharia was formally abolished in civil law. Administrative courts (Council of State, Danıştay) handle government actions. The Constitutional Court was established in 1961.",
  },
  za: {
    system: "Mixed: Roman-Dutch + Common Law + Customary Law",
    family: "Mixed: Roman-Dutch / Anglo-South African",
    codified: false,
    description:
      "South Africa's unique legal system blends Roman-Dutch private law (from Dutch colonization, 1652) with English common law (from British colonial period), plus African customary law for traditional communities (recognized by the Constitution). The Constitutional Court is the apex court for constitutional matters; the Supreme Court of Appeal for non-constitutional matters.",
  },
  ng: {
    system: "Mixed: Common Law + Sharia + Customary Law",
    family: "Mixed: Anglo-Nigerian / Islamic / Customary",
    codified: false,
    description:
      "Nigeria uses English common law (federal level and southern states), Sharia criminal law (12 northern states for Muslims), and customary law for personal and family matters across all regions. The three systems coexist with ongoing jurisdictional tensions. The federal legal system uses common law; each state may additionally apply its own personal law systems.",
  },
  eg: {
    system: "Civil Law (Napoleonic/Islamic)",
    family: "Mixed: Romano-Germanic / Islamic",
    codified: true,
    description:
      "Egypt's civil law system (based on the Napoleonic Code, introduced via the 1949 Civil Code drafted by Abdel Razzak al-Sanhuri) is the most influential in the Arab world — widely adopted by other Arab states. Sharia is 'the principal source of legislation' constitutionally, interpreted by the Supreme Constitutional Court. Personal status law (marriage, divorce, inheritance) applies different rules by religion.",
  },
  ar: {
    system: "Civil Law (French-influenced)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Argentina's legal system is based on continental European civil law, heavily influenced by the French and Spanish traditions. The New Civil and Commercial Code (2015, replacing the 1869 Vélez Sársfield code) is the core private law statute. Federal and provincial courts operate in parallel. The Supreme Court (Corte Suprema) exercises judicial review.",
  },
  cl: {
    system: "Civil Law (Spanish/French-influenced)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Chile's civil law system is based on Andrés Bello's 1855 Civil Code — one of Latin America's most influential legal texts, adopted by Colombia, Ecuador, El Salvador, and Honduras. Commercial, criminal, family, and labor law are comprehensively codified. The Constitutional Tribunal exercises preventive and ex-post constitutional review. Labor law reforms have been a significant recent legislative area.",
  },
  my: {
    system: "Common Law + Islamic Law (Sharia)",
    family: "Mixed: Anglo-Malay / Islamic",
    codified: false,
    description:
      "Malaysia uses English common law for federal matters (inherited from British colonial rule). Islamic (Sharia) courts have exclusive jurisdiction over Muslims in personal and family matters — operating parallel to the civil courts. Each state administers its own Sharia law under state legislation. The Federal Court is the apex civil court; Sharia courts are constitutionally separate.",
  },
  th: {
    system: "Civil Law (German/French-influenced) + Buddhist Customary",
    family: "Romano-Germanic / East Asian",
    codified: true,
    description:
      "Thailand modernized its legal system in the late 19th-early 20th century, adopting civil and commercial codes influenced by French and German models (while remaining one of the only Southeast Asian countries never formally colonized). The Civil and Commercial Code (1925), Criminal Code, and Civil Procedure Code form the core. Constitutional Tribunal has significant power to dissolve parties and remove politicians.",
  },
  id: {
    system: "Civil Law (Dutch-colonial) + Adat + Islamic",
    family: "Mixed: Dutch Civil Law / Adat Customary / Islamic",
    codified: true,
    description:
      "Indonesia's civil law system derives from Dutch colonial law (Netherlands East Indies). Post-independence, Indonesia has gradually replaced Dutch codes with national legislation. Adat (customary indigenous law) is recognized for traditional communities. Islamic courts (Pengadilan Agama) handle Muslim family and inheritance matters. The legal system remains in ongoing transition with significant regional variation.",
  },
  vn: {
    system: "Socialist Civil Law",
    family: "Socialist / Civil Law Hybrid",
    codified: true,
    description:
      "Vietnam's legal system is a socialist civil law system derived from Soviet models and French colonial law, progressively reformed since Doi Moi (1986). The 2015 Civil Code is comprehensive. Courts operate under VCP supervision — there is no independent judiciary. The National Assembly and its Standing Committee are the primary lawmakers. International commercial arbitration (VIAC) has grown significantly.",
  },
  ua: {
    system: "Civil Law (Soviet-Post-Soviet Reform)",
    family: "Romano-Germanic / Post-Soviet",
    codified: true,
    description:
      "Ukraine's legal system is a civil law system transitioning from Soviet law. The 2003 Civil Code is based on continental European models. Since the 2014 Revolution of Dignity, Ukraine has undertaken extensive legal reforms: anti-corruption courts (HACC, 2019), judicial vetting, and alignment with EU law as part of the Association Agreement and EU accession process. Wartime legislation (2022–) has modified many ordinary legal procedures.",
  },
  pl: {
    system: "Civil Law (Continental European)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Poland's civil law system is based on continental European traditions. Post-1989 democratic transition saw comprehensive reform of the communist-era legal codes. The Civil Code, Criminal Code, and Administrative Procedure Code are the core statutes. The Constitutional Tribunal reviews laws for constitutionality; the Supreme Court handles ordinary appeals. The 2015-2023 PiS government's judicial reforms — packing courts and undermining independence — were found to violate EU law.",
  },
  it: {
    system: "Civil Law (Napoleonic/Roman)",
    family: "Romano-Germanic",
    codified: true,
    description:
      "Italy's legal system is based on the Roman law tradition, codified under Napoleonic influence. The Codice Civile (1942, still in force with reforms) governs private law. The Constitution (1948) is supreme. The Constitutional Court reviews legislation. Administrative courts (TAR and Council of State) are separate from civil courts — a French-influenced dualist system. Italy's legal system is notably slow: average civil case takes 7+ years.",
  },
  pk: {
    system: "Common Law + Islamic Law (Sharia)",
    family: "Mixed: Anglo-Pakistani / Islamic",
    codified: false,
    description:
      "Pakistan inherited English common law from British colonial rule, overlaid with Islamic law requirements. The Federal Shariat Court reviews laws for conformity with Islamic principles and can strike down non-Islamic provisions. Hudood Ordinances (1979, introduced under Zia ul-Haq) apply Islamic punishments for certain crimes. Anglo-Pakistani common law governs commercial and criminal matters at the federal level.",
  },
  et: {
    system: "Mixed: Civil Law + Customary + Islamic",
    family: "Mixed: Civil Law / Customary",
    codified: true,
    description:
      "Ethiopia's legal system draws from Swiss civil law (the 1960 Civil Code was drafted by Swiss jurist René David), customary law for personal matters in many ethnic communities, and Sharia for Muslim family and inheritance cases. The Federal Supreme Court is the apex court. Ethiopia's ethnic federalism creates significant legal diversity across regional states.",
  },
  se: {
    system: "Civil Law (Swedish/Nordic)",
    family: "Nordic / Romano-Germanic",
    codified: true,
    description:
      "Sweden's legal system belongs to the Nordic civil law family — closely related to Danish and Norwegian law but distinct from continental civil law. The core statutes include the Contracts Act (1915), the Land Code (Jordabalken), and the Criminal Code. Sweden has no separate administrative courts — administrative law cases are handled by a parallel court system (Administrative Courts of Appeal, Supreme Administrative Court).",
  },
  no: {
    system: "Civil Law (Norwegian/Nordic)",
    family: "Nordic / Romano-Germanic",
    codified: true,
    description:
      "Norway's legal system is part of the Nordic civil law family with Scandinavian characteristics. Key statutes include the Courts of Justice Act, the Criminal Code (Straffeloven, replaced 2015), and the Contracts Act. Norway has incorporated the ECHR directly into domestic law with precedence over ordinary legislation. The Supreme Court (Høyesterett) exercises constitutional review.",
  },
  ir: {
    system: "Islamic Law (Sharia / Fiqh)",
    family: "Islamic / Theocratic",
    codified: true,
    description:
      "Constitution mandates all laws must conform to Islamic standards (Sharia). Guardian Council reviews legislation for conformity. Civil Code based on Shia Imami jurisprudence (fiqh). Criminal punishments include Qisas (retribution) and Hudud (fixed punishments). Theocratic legal authority ultimately vests in the Supreme Leader.",
  },
};

const DEFAULT_LEGAL = {
  system: "Mixed Legal System",
  family: "Hybrid",
  codified: true,
  description:
    "This country operates under a constitutional legal framework combining codified statutes with judicial precedent and customary norms.",
};

function getLegalSystem(country: Country) {
  return LEGAL_SYSTEMS[country.id] ?? DEFAULT_LEGAL;
}

function ConstitutionTab({ country }: { country: Country }) {
  const data = getConstitution(country);
  const polStatus = getPoliticalStatus(country);
  const legal = getLegalSystem(country);

  return (
    <div className="animate-fade-in space-y-4">
      {/* ── 1. GOVERNANCE TYPE ── */}
      <div className="modal-tile rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-secondary/10 rounded-md border border-secondary/20 shrink-0">
            <Scales size={14} weight="fill" className="text-secondary" />
          </div>
          <div>
            <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Type of Governance
            </p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              System of government &amp; legal foundation
            </p>
          </div>
        </div>

        {/* Regime type badge */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-sans text-secondary border border-secondary/30 bg-secondary/10 px-3 py-1 rounded-full font-semibold">
            {polStatus.regime}
          </span>
          <span
            className={`text-xs font-sans px-3 py-1 rounded-full border font-semibold ${polStatus.statusColor}`}
          >
            {polStatus.status}
          </span>
        </div>

        {/* Governance fast-facts grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Government Type", value: country.governmentType },
            { label: "Head of State", value: country.headOfState },
            { label: "Election Type", value: polStatus.electionType },
            { label: "Ruling Party / Leader", value: polStatus.ruling },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-border bg-background/40 p-3"
            >
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                {f.label}
              </p>
              <p className="text-xs font-sans text-foreground leading-snug">
                {f.value}
              </p>
            </div>
          ))}
        </div>

        {/* Freedom score bar */}
        <div className="rounded-lg border border-border bg-background/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
              Political Freedom Index
            </p>
            <span
              className={`text-[10px] font-sans px-2 py-0.5 rounded-full border font-semibold ${
                polStatus.freedomScore >= 70
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : polStatus.freedomScore >= 35
                    ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                    : "text-red-400 border-red-500/30 bg-red-500/10"
              }`}
            >
              {polStatus.freedomLabel} · {polStatus.freedomScore}/100
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${polStatus.freedomScore}%`,
                background:
                  polStatus.freedomScore >= 70
                    ? "hsl(142,71%,45%)"
                    : polStatus.freedomScore >= 35
                      ? "hsl(38,92%,50%)"
                      : "hsl(0,70%,55%)",
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Not Free</span>
            <span>Partly Free</span>
            <span>Free</span>
          </div>
        </div>
      </div>

      {/* ── 2. CODIFIED LAW / LEGAL SYSTEM ── */}
      <div className="modal-tile rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-amber-500/10 rounded-md border border-amber-500/20 shrink-0">
            <Scroll size={14} weight="fill" className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Legal System &amp; Codified Law
            </p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              Legal family, codification status &amp; constitutional basis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs font-sans text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-full font-semibold">
            {legal.system}
          </span>
          <span className="text-xs font-sans text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 rounded-full font-semibold">
            {legal.family}
          </span>
          <span
            className={`text-xs font-sans px-2.5 py-1 rounded-full border font-semibold ${
              legal.codified
                ? "text-green-400 border-green-500/30 bg-green-500/10"
                : "text-orange-400 border-orange-500/30 bg-orange-500/10"
            }`}
          >
            {legal.codified
              ? "Codified Constitution"
              : "Uncodified Constitution"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-3">
          {legal.description}
        </p>

        {/* Constitutional document reference */}
        <div className="rounded-lg border border-border bg-background/30 p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-xs font-semibold font-sans text-foreground leading-snug">
              {data.name}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {data.adopted}
              </span>
              {data.lastAmended && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Amended {data.lastAmended}
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
            {data.summary}
          </p>
        </div>

        <SourceLink sources={SRC_CONSTITUTION} className="mt-3" />
      </div>

      {/* ── 3. CURRENT POLITICAL STATUS ── */}
      <div className="modal-tile rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 shrink-0">
            <Flag size={14} weight="fill" className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Current Political Status
            </p>
            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
              Live political landscape as of 2025
            </p>
          </div>
        </div>

        {/* Press Freedom bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
              Press Freedom Index (RSF)
            </p>
            <span
              className={`text-[10px] font-mono font-semibold ${
                polStatus.pressIndex >= 60
                  ? "text-green-400"
                  : polStatus.pressIndex >= 30
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {polStatus.pressIndex}/100
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${polStatus.pressIndex}%`,
                background:
                  polStatus.pressIndex >= 60
                    ? "hsl(142,71%,45%)"
                    : polStatus.pressIndex >= 30
                      ? "hsl(38,92%,50%)"
                      : "hsl(0,70%,55%)",
              }}
            />
          </div>
        </div>

        {/* Election timeline */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
              Last Election
            </p>
            <p className="text-xs font-semibold font-sans text-foreground">
              {polStatus.lastElection}
            </p>
          </div>
          {polStatus.nextElection && (
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                Next Election
              </p>
              <p className="text-xs font-semibold font-sans text-foreground">
                {polStatus.nextElection}
              </p>
            </div>
          )}
        </div>

        {/* Ruling / Opposition */}
        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
                Ruling Party / Leader
              </p>
              <p className="text-xs font-sans text-foreground mt-0.5">
                {polStatus.ruling}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
            <div>
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
                Opposition
              </p>
              <p className="text-xs font-sans text-foreground mt-0.5">
                {polStatus.opposition}
              </p>
            </div>
          </div>
        </div>

        {/* Political notes */}
        <div className="rounded-lg border border-border bg-background/30 p-3">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
            Political Context
          </p>
          <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
            {polStatus.notes}
          </p>
        </div>
      </div>

      {/* ── 4. IDEOLOGY TAGS ── */}
      <div className="modal-tile rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={12} weight="fill" className="text-amber-400" />
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
            Constitutional Ideology &amp; Doctrine
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.ideology.map((tag, i) => {
            const colors = [
              "text-blue-400 border-blue-500/30 bg-blue-500/10",
              "text-purple-400 border-purple-500/30 bg-purple-500/10",
              "text-green-400 border-green-500/30 bg-green-500/10",
              "text-orange-400 border-orange-500/30 bg-orange-500/10",
            ];
            return (
              <span
                key={tag}
                className={`text-xs font-sans px-2.5 py-1 rounded-full border ${colors[i % colors.length]}`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── 5. KEY CONSTITUTIONAL ARTICLES (collapsed under disclosure) ── */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer select-none modal-tile rounded-xl px-4 py-3 hover:bg-muted/60 transition-colors">
          <BookOpen size={12} weight="fill" className="text-muted-foreground" />
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest flex-1">
            Key Constitutional Articles &amp; Provisions
          </p>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {data.articles.length} provisions
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-muted-foreground group-open:rotate-180 transition-transform shrink-0"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <div className="mt-2 space-y-2.5">
          {data.articles.map((article, i) => (
            <div key={i} className="modal-tile rounded-lg p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-xs font-bold font-sans text-foreground">
                  {article.title}
                </p>
                <span
                  className={`text-[10px] font-sans px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${typeColors[article.type]}`}
                >
                  {article.type.charAt(0).toUpperCase() + article.type.slice(1)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                {article.description}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ── Per-country landmark photo sets ──────────────────────────────────────────
const COUNTRY_PHOTOS: Record<string, { url: string; caption: string }[]> = {
  us: [
    {
      url: "https://images.unsplash.com/photo-1490642914619-7955a3fd483c?w=800&q=80",
      caption: "Grand Canyon, Arizona",
    },
    {
      url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80",
      caption: "New York City Skyline",
    },
    {
      url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      caption: "Golden Gate Bridge, San Francisco",
    },
    {
      url: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
      caption: "Yellowstone National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1597149154484-f46a213c21de?w=800&q=80",
      caption: "Statue of Liberty, New York",
    },
    {
      url: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
      caption: "Washington D.C. Capitol",
    },
  ],
  ca: [
    {
      url: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80",
      caption: "Niagara Falls, Ontario",
    },
    {
      url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Banff National Park, Alberta",
    },
    {
      url: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80",
      caption: "Toronto Skyline",
    },
    {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      caption: "Vancouver, British Columbia",
    },
    {
      url: "https://images.unsplash.com/photo-1601238585539-48e56b0a9e3c?w=800&q=80",
      caption: "Old Quebec City",
    },
    {
      url: "https://images.unsplash.com/photo-1616430426562-e1af16e4e6b8?w=800&q=80",
      caption: "Moraine Lake, Alberta",
    },
  ],
  gb: [
    {
      url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
      caption: "Big Ben & Westminster, London",
    },
    {
      url: "https://images.unsplash.com/photo-1543716091-a840c05249ec?w=800&q=80",
      caption: "Edinburgh Castle, Scotland",
    },
    {
      url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
      caption: "Stonehenge, Wiltshire",
    },
    {
      url: "https://images.unsplash.com/photo-1472756254485-bf517edec2a4?w=800&q=80",
      caption: "Lake District, England",
    },
    {
      url: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800&q=80",
      caption: "Tower Bridge, London",
    },
    {
      url: "https://images.unsplash.com/photo-1425321053535-0d344af0ce35?w=800&q=80",
      caption: "Cliffs of Moher (Ireland)",
    },
  ],
  fr: [
    {
      url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
      caption: "Eiffel Tower, Paris",
    },
    {
      url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&q=80",
      caption: "Palace of Versailles",
    },
    {
      url: "https://images.unsplash.com/photo-1596442880282-41cf9a2cdb48?w=800&q=80",
      caption: "Loire Valley Châteaux",
    },
    {
      url: "https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=800&q=80",
      caption: "Mont Saint-Michel, Normandy",
    },
    {
      url: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800&q=80",
      caption: "French Riviera, Nice",
    },
    {
      url: "https://images.unsplash.com/photo-1541960071727-c531398e7494?w=800&q=80",
      caption: "Lavender Fields, Provence",
    },
  ],
  de: [
    {
      url: "https://images.unsplash.com/photo-1560090995-e9a16818b4c5?w=800&q=80",
      caption: "Neuschwanstein Castle, Bavaria",
    },
    {
      url: "https://images.unsplash.com/photo-1579166765019-d6e0dc2d8e2b?w=800&q=80",
      caption: "Brandenburg Gate, Berlin",
    },
    {
      url: "https://images.unsplash.com/photo-1580537660053-b1f0e65e2a23?w=800&q=80",
      caption: "Cologne Cathedral",
    },
    {
      url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
      caption: "Black Forest",
    },
    {
      url: "https://images.unsplash.com/photo-1554560665-7b35baa8ed36?w=800&q=80",
      caption: "Hamburg Speicherstadt",
    },
    {
      url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      caption: "Munich Beer Garden",
    },
  ],
  jp: [
    {
      url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80",
      caption: "Mount Fuji, Honshu",
    },
    {
      url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
      caption: "Fushimi Inari Shrine, Kyoto",
    },
    {
      url: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
      caption: "Tokyo Shibuya Crossing",
    },
    {
      url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      caption: "Nara Deer Park",
    },
    {
      url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Hiroshima Peace Memorial",
    },
    {
      url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80",
      caption: "Osaka Castle",
    },
  ],
  cn: [
    {
      url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
      caption: "Great Wall of China",
    },
    {
      url: "https://images.unsplash.com/photo-1584793797613-f3b48e4c0a98?w=800&q=80",
      caption: "Forbidden City, Beijing",
    },
    {
      url: "https://images.unsplash.com/photo-1537519946571-2834ad0c29ba?w=800&q=80",
      caption: "Li River, Guilin",
    },
    {
      url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
      caption: "Shanghai Skyline",
    },
    {
      url: "https://images.unsplash.com/photo-1513415277900-a62401e19be4?w=800&q=80",
      caption: "Terracotta Army, Xi&#39;an",
    },
    {
      url: "https://images.unsplash.com/photo-1568275279434-ee8948fe7d63?w=800&q=80",
      caption: "Yellow Mountains (Huangshan)",
    },
  ],
  in: [
    {
      url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
      caption: "Taj Mahal, Agra",
    },
    {
      url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
      caption: "Jaipur Pink City, Rajasthan",
    },
    {
      url: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
      caption: "Kerala Backwaters",
    },
    {
      url: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800&q=80",
      caption: "Varanasi Ghats, Ganges",
    },
    {
      url: "https://images.unsplash.com/photo-1561361058-c24e0a9b3e09?w=800&q=80",
      caption: "Hawa Mahal, Jaipur",
    },
    {
      url: "https://images.unsplash.com/photo-1519911208978-e0e614f3fc13?w=800&q=80",
      caption: "Mumbai Gateway of India",
    },
  ],
  br: [
    {
      url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
      caption: "Christ the Redeemer, Rio de Janeiro",
    },
    {
      url: "https://images.unsplash.com/photo-1598977679564-43bd5b5c1c3b?w=800&q=80",
      caption: "Iguazu Falls",
    },
    {
      url: "https://images.unsplash.com/photo-1567324823810-4f45d6d4dd4a?w=800&q=80",
      caption: "Amazon Rainforest",
    },
    {
      url: "https://images.unsplash.com/photo-1539632346654-dd4c3cffad8c?w=800&q=80",
      caption: "Copacabana Beach, Rio",
    },
    {
      url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
      caption: "Pantanal Wetlands",
    },
    {
      url: "https://images.unsplash.com/photo-1616430426562-e1af16e4e6b8?w=800&q=80",
      caption: "São Paulo Skyline",
    },
  ],
  au_oc: [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Sydney Opera House",
    },
    {
      url: "https://images.unsplash.com/photo-1520395612e4a7e5a41524db9d91fcf4?w=800&q=80",
      caption: "Great Barrier Reef",
    },
    {
      url: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800&q=80",
      caption: "Uluru (Ayers Rock), Northern Territory",
    },
    {
      url: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80",
      caption: "Great Ocean Road, Victoria",
    },
    {
      url: "https://images.unsplash.com/photo-1572175235055-1f9cc9a4aea0?w=800&q=80",
      caption: "Sydney Harbour Bridge",
    },
    {
      url: "https://images.unsplash.com/photo-1559674780-7fa57f47c7e3?w=800&q=80",
      caption: "Blue Mountains, New South Wales",
    },
  ],
  it: [
    {
      url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
      caption: "Colosseum, Rome",
    },
    {
      url: "https://images.unsplash.com/photo-1534643960519-11ad79bc19df?w=800&q=80",
      caption: "Venice Canals",
    },
    {
      url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
      caption: "Cinque Terre, Liguria",
    },
    {
      url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Florence Cathedral (Duomo)",
    },
    {
      url: "https://images.unsplash.com/photo-1544085313-a5b04a65bcfe?w=800&q=80",
      caption: "Amalfi Coast",
    },
    {
      url: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&q=80",
      caption: "Leaning Tower of Pisa",
    },
  ],
  es: [
    {
      url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
      caption: "Sagrada Família, Barcelona",
    },
    {
      url: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80",
      caption: "Alhambra Palace, Granada",
    },
    {
      url: "https://images.unsplash.com/photo-1543442076-93a25e1474f1?w=800&q=80",
      caption: "Park Güell, Barcelona",
    },
    {
      url: "https://images.unsplash.com/photo-1559762717-99673c3b3f90?w=800&q=80",
      caption: "Plaza Mayor, Madrid",
    },
    {
      url: "https://images.unsplash.com/photo-1560748952-5e40caed0e6a?w=800&q=80",
      caption: "Camino de Santiago",
    },
    {
      url: "https://images.unsplash.com/photo-1516476667791-2efcbeffdf95?w=800&q=80",
      caption: "Ibiza Coastline",
    },
  ],
  ru: [
    {
      url: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&q=80",
      caption: "Red Square, Moscow",
    },
    {
      url: "https://images.unsplash.com/photo-1556983703-27576e5afa24?w=800&q=80",
      caption: "St. Basil&#39;s Cathedral, Moscow",
    },
    {
      url: "https://images.unsplash.com/photo-1529988885170-24e5c8571f91?w=800&q=80",
      caption: "Lake Baikal, Siberia",
    },
    {
      url: "https://images.unsplash.com/photo-1608826063534-2c1ecaf4fe9d?w=800&q=80",
      caption: "Hermitage Museum, St. Petersburg",
    },
    {
      url: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&q=80",
      caption: "Churches of the Kremlin",
    },
    {
      url: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80",
      caption: "St. Petersburg Canals",
    },
  ],
  sa: [
    {
      url: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
      caption: "Masjid al-Haram, Mecca",
    },
    {
      url: "https://images.unsplash.com/photo-1617893497756-d4f5b7f4892d?w=800&q=80",
      caption: "Al-Ula Ancient City",
    },
    {
      url: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80",
      caption: "Riyadh Kingdom Tower",
    },
    {
      url: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&q=80",
      caption: "Hegra (Mada&#39;in Saleh)",
    },
    {
      url: "https://images.unsplash.com/photo-1620459482813-91de1d2f9892?w=800&q=80",
      caption: "Edge of the World, Riyadh",
    },
    {
      url: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80",
      caption: "Diriyah Historic District",
    },
  ],
  za: [
    {
      url: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
      caption: "Table Mountain, Cape Town",
    },
    {
      url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      caption: "Kruger National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=800&q=80",
      caption: "Cape of Good Hope",
    },
    {
      url: "https://images.unsplash.com/photo-1590688944704-07d3c2c8b226?w=800&q=80",
      caption: "Boulders Penguin Colony",
    },
    {
      url: "https://images.unsplash.com/photo-1531928351158-2197288a4c09?w=800&q=80",
      caption: "Garden Route Coastline",
    },
    {
      url: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&q=80",
      caption: "Johannesburg Skyline",
    },
  ],
};

// Continent fallback galleries
const CONTINENT_PHOTOS: Record<string, { url: string; caption: string }[]> = {
  "North America": [
    {
      url: "https://images.unsplash.com/photo-1490642914619-7955a3fd483c?w=800&q=80",
      caption: "Grand Canyon",
    },
    {
      url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80",
      caption: "New York City",
    },
    {
      url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      caption: "Golden Gate Bridge",
    },
    {
      url: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80",
      caption: "Niagara Falls",
    },
    {
      url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
      caption: "Banff National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
      caption: "Yellowstone",
    },
  ],
  "South America": [
    {
      url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
      caption: "Christ the Redeemer, Rio",
    },
    {
      url: "https://images.unsplash.com/photo-1598977679564-43bd5b5c1c3b?w=800&q=80",
      caption: "Iguazu Falls",
    },
    {
      url: "https://images.unsplash.com/photo-1567324823810-4f45d6d4dd4a?w=800&q=80",
      caption: "Amazon Rainforest",
    },
    {
      url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
      caption: "Machu Picchu, Peru",
    },
    {
      url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      caption: "Patagonia, Argentina",
    },
    {
      url: "https://images.unsplash.com/photo-1608082633671-1b4d6b02e51a?w=800&q=80",
      caption: "Atacama Desert, Chile",
    },
  ],
  Europe: [
    {
      url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
      caption: "Eiffel Tower, Paris",
    },
    {
      url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
      caption: "Colosseum, Rome",
    },
    {
      url: "https://images.unsplash.com/photo-1560090995-e9a16818b4c5?w=800&q=80",
      caption: "Neuschwanstein Castle, Germany",
    },
    {
      url: "https://images.unsplash.com/photo-1543482791-5f7c4e6f3093?w=800&q=80",
      caption: "Santorini, Greece",
    },
    {
      url: "https://images.unsplash.com/photo-1534643960519-11ad79bc19df?w=800&q=80",
      caption: "Venice Canals, Italy",
    },
    {
      url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
      caption: "Big Ben, London",
    },
  ],
  Asia: [
    {
      url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
      caption: "Great Wall of China",
    },
    {
      url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80",
      caption: "Mount Fuji, Japan",
    },
    {
      url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
      caption: "Taj Mahal, India",
    },
    {
      url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      caption: "Bali Rice Terraces",
    },
    {
      url: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
      caption: "Kerala Backwaters, India",
    },
    {
      url: "https://images.unsplash.com/photo-1549273932-fdec6f3e9e69?w=800&q=80",
      caption: "Angkor Wat, Cambodia",
    },
  ],
  Africa: [
    {
      url: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
      caption: "Table Mountain, South Africa",
    },
    {
      url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      caption: "Kruger National Park, Safari",
    },
    {
      url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
      caption: "Sahara Desert Dunes",
    },
    {
      url: "https://images.unsplash.com/photo-1531975474574-e9d2732e8386?w=800&q=80",
      caption: "Victoria Falls, Zambia/Zimbabwe",
    },
    {
      url: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
      caption: "Pyramids of Giza, Egypt",
    },
    {
      url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Serengeti, Tanzania",
    },
  ],
  Oceania: [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Sydney Opera House, Australia",
    },
    {
      url: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800&q=80",
      caption: "Uluru, Australia",
    },
    {
      url: "https://images.unsplash.com/photo-1520459990304-7ef7a7c8bb46?w=800&q=80",
      caption: "Milford Sound, New Zealand",
    },
    {
      url: "https://images.unsplash.com/photo-1559762717-99673c3b3f90?w=800&q=80",
      caption: "Great Barrier Reef",
    },
    {
      url: "https://images.unsplash.com/photo-1480654240659-4d3c38f47c9f?w=800&q=80",
      caption: "Fiji Islands",
    },
    {
      url: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?w=800&q=80",
      caption: "Bora Bora, French Polynesia",
    },
  ],
};

function getCountryPhotos(country: Country) {
  return (
    COUNTRY_PHOTOS[country.id] ??
    CONTINENT_PHOTOS[country.continent] ??
    CONTINENT_PHOTOS["Asia"]
  );
}

function CountryDetailPanel({
  country,
  onClose,
  onCompare,
}: {
  country: Country;
  onClose: () => void;
  onCompare?: (c: Country) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "map" | "constitution"
  >("overview");
  const { openNote } = useNotes();

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: <ListBullets size={13} weight="fill" />,
    },
    {
      id: "map" as const,
      label: "Map",
      icon: <MapTrifold size={13} weight="fill" />,
    },
    {
      id: "constitution" as const,
      label: "Governance",
      icon: <Scales size={13} weight="fill" />,
    },
  ];

  return (
    <div className="modal-glass border rounded-xl animate-fade-in overflow-hidden">
      {/* Header (always visible) */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border shadow-md bg-muted">
              <img
                src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                alt={`${country.name} flag`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget;
                  t.onerror = null;
                  t.style.display = "none";
                  const fb = t.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <div className="absolute inset-0 bg-gradient-1 items-center justify-center hidden">
                <span className="text-lg font-bold font-mono text-primary-foreground">
                  {country.code}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-foreground">
                {country.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> {country.capital}
                </span>
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-sans ${continentColors[country.continent] ?? "text-muted-foreground border-border bg-muted"}`}
                >
                  {country.continent}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${hdiBadge(country.humanDevelopmentIndex)}`}
                >
                  HDI {country.humanDevelopmentIndex}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onCompare && (
              <button
                onClick={() => onCompare(country)}
                className="px-2.5 py-1 rounded-full text-xs bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors font-sans cursor-pointer flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8h12M10 4l4 4-4 4M6 12l-4-4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Compare
              </button>
            )}
            <button
              onClick={() =>
                openNote({ entityName: country.name, entityType: "Country" })
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors font-sans cursor-pointer"
            >
              <NotePencil size={12} weight="fill" />
              Note
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground hover:text-foreground transition-colors font-sans cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-sans border-b-2 transition-colors cursor-pointer -mb-px ${
                activeTab === tab.id
                  ? "border-secondary text-secondary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* ── MAP TAB ── */}
        {activeTab === "map" && (
          <div className="animate-fade-in">
            <div
              className="rounded-xl overflow-hidden border border-border mb-4"
              style={{ height: 340 }}
            >
              <iframe
                title={`Map of ${country.name}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(country.name)}&output=embed&z=5`}
              />
            </div>
            {/* Location fact strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Capital", value: country.capital },
                { label: "Continent", value: country.continent },
                {
                  label: "Area",
                  value: `${(country.areaKm2 / 1e6).toFixed(2)}M km²`,
                },
                {
                  label: "Population",
                  value: (() => {
                    const n = country.population;
                    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
                    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                    return `${(n / 1000).toFixed(0)}K`;
                  })(),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="modal-tile rounded-lg p-3 text-center"
                >
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONSTITUTION TAB ── */}
        {activeTab === "constitution" && <ConstitutionTab country={country} />}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div>
            {/* ── ECONOMIC OVERVIEW ── */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-widest mb-3">
                Economic Overview
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  {
                    label: "GDP",
                    value: fmtGDP(country.gdp),
                    color: "text-secondary",
                  },
                  {
                    label: "Per Capita",
                    value: `$${country.gdpPerCapita.toLocaleString()}`,
                    color: "text-secondary",
                  },
                  {
                    label: "GDP Growth",
                    value: `${country.gdpGrowth > 0 ? "+" : ""}${country.gdpGrowth}%`,
                    color:
                      country.gdpGrowth >= 0
                        ? "text-success"
                        : "text-destructive",
                  },
                  {
                    label: "Trade Balance",
                    value: `${country.tradeBalance > 0 ? "+" : ""}$${country.tradeBalance}B`,
                    color:
                      country.tradeBalance >= 0
                        ? "text-success"
                        : "text-destructive",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="modal-tile rounded-lg p-3 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                      {s.label}
                    </p>
                    <p className={`text-base font-bold font-mono ${s.color}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* Score bars: economic health */}
              <div className="modal-tile rounded-lg p-4 space-y-2">
                <ScoreBar
                  label="Unemployment"
                  value={country.unemploymentRate}
                  max={35}
                  color="#fb923c"
                />
                <ScoreBar
                  label="Inflation Rate"
                  value={country.inflationRate}
                  max={50}
                  color="#f87171"
                />
                <ScoreBar
                  label="HDI Score"
                  value={country.humanDevelopmentIndex * 100}
                  max={100}
                  color="#34d399"
                />
                <ScoreBar
                  label="Life Expectancy"
                  value={country.lifeExpectancy}
                  max={90}
                  color="#60a5fa"
                />
              </div>
            </div>

            <SourceLink sources={SRC_WORLDBANK} className="mb-3" />

            {/* ── GDP TREND ── */}
            {country.trends && country.trends.length > 0 && (
              <div className="modal-tile rounded-lg p-4 mb-5">
                <p className="text-xs font-semibold font-sans text-foreground mb-3">
                  GDP Trend (Billion USD)
                </p>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={country.trends}
                      margin={{ top: 2, right: 4, left: 0, bottom: 2 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222,30%,22%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{
                          fill: "hsl(0,0%,55%)",
                          fontSize: 9,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(0,0%,55%)",
                          fontSize: 9,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}T`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-secondary">
                                ${payload[0].value?.toLocaleString()}B GDP
                              </p>
                            </div>
                          ) : null
                        }
                      />
                      <Bar dataKey="gdp" radius={[3, 3, 0, 0]}>
                        {country.trends.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === country.trends.length - 1
                                ? "hsl(200,85%,50%)"
                                : "hsl(200,55%,35%)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── KEY INDUSTRIES + BIOSPHERE ── */}
            {country.keyIndustries && country.keyIndustries.length > 0 && (
              <div className="modal-tile rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-xs font-semibold font-sans text-foreground mb-3 uppercase tracking-wide">
                      Key Industries
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      {country.keyIndustries.map((ind) => (
                        <div key={ind.name} className="flex items-center gap-2">
                          <span className="text-xs font-sans text-muted-foreground w-28 shrink-0 truncate">
                            {ind.name}
                          </span>
                          <div className="flex-1 h-3.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${(ind.gdpShare / 50) * 100}%`,
                                backgroundColor: ind.color,
                                opacity: 0.85,
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono w-9 text-right shrink-0"
                            style={{ color: ind.color }}
                          >
                            {ind.gdpShare}%
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Key Services tag list */}
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Key Services &amp; Sectors
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {country.keyIndustries
                          .slice()
                          .sort((a, b) => b.gdpShare - a.gdpShare)
                          .map((ind) => (
                            <span
                              key={ind.name}
                              className="inline-flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-full border"
                              style={{
                                color: ind.color,
                                borderColor: ind.color + "44",
                                backgroundColor: ind.color + "18",
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: ind.color }}
                              />
                              {ind.name}
                              <span className="opacity-60 font-mono">
                                {ind.gdpShare}%
                              </span>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center">
                    <h3 className="text-xs font-semibold font-sans text-foreground mb-1 uppercase tracking-wide">
                      Biosphere
                    </h3>
                    <div className="relative w-28 h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getBiosphere(country)}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                            isAnimationActive
                            animationDuration={700}
                          >
                            {getBiosphere(country).map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={entry.color}
                                fillOpacity={0.9}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                                  <p className="font-semibold text-foreground">
                                    {payload[0].payload.label}
                                  </p>
                                  <p
                                    style={{ color: payload[0].payload.color }}
                                  >
                                    {payload[0].payload.value}%
                                  </p>
                                </div>
                              ) : null
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-1 space-y-0.5 w-full max-h-28 overflow-y-auto">
                      {getBiosphere(country).map((seg) => (
                        <div
                          key={seg.label}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-[10px] font-sans text-muted-foreground truncate">
                            {seg.label}
                          </span>
                          <span
                            className="text-[10px] font-mono ml-auto"
                            style={{ color: seg.color }}
                          >
                            {seg.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ENERGY ── */}
            {country.energy && (
              <EnergySection energy={country.energy} countryId={country.id} />
            )}

            {/* ── MILITARY ── */}
            {getMilitary(country.id) && (
              <MilitarySection mil={getMilitary(country.id)!} />
            )}

            {/* ── GOVERNANCE + PEOPLE ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="modal-tile rounded-lg p-4">
                <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-2">
                  Governance
                </p>
                <p className="text-sm font-semibold font-sans text-foreground">
                  {country.governmentType}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  {country.headOfState}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  {country.currency}
                  {country.gdpGrowth > 0 ? " · Growing" : " · Contracting"}
                </p>
              </div>
              <div className="modal-tile rounded-lg p-4">
                <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-2">
                  People
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Population
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {(() => {
                        const n = country.population;
                        if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
                        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                        return `${(n / 1000).toFixed(0)}K`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Area
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {(country.areaKm2 / 1e6).toFixed(2)}M km²
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Language(s)
                    </p>
                    <p className="text-xs font-sans text-foreground truncate">
                      {country.officialLanguages.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Life Expect.
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {country.lifeExpectancy} yrs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spoken Languages, Landmarks, Religions */}
            {!!(
              (country as any).spokenLanguages?.length ||
              (country as any).landmarks?.length ||
              (country as any).religions?.length
            ) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(country as any).spokenLanguages?.length > 0 && (
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                      Languages Spoken
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(country as any).spokenLanguages.map((l: string) => (
                        <span
                          key={l}
                          className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(country as any).landmarks?.length > 0 && (
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                      Top Landmarks
                    </p>
                    <ul className="space-y-1">
                      {(country as any).landmarks.map((lm: string) => (
                        <li
                          key={lm}
                          className="text-xs text-foreground font-sans flex items-start gap-1.5"
                        >
                          <span className="text-secondary mt-0.5">•</span>
                          {lm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(country as any).religions?.length > 0 && (
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                      Religions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(country as any).religions.map((r: string) => (
                        <span
                          key={r}
                          className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── EXTENDED DATA: Demographics, Fiscal, Trade, Credit ── */}
            <CountryExtendedPanels country={country} />

            {/* ── SOCIOLOGICAL BREAKDOWN ── */}
            <CountrySociologicalBreakdown country={country} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Extended data panels ──────────────────────────────────────────────────────
const SRC_DEMOGRAPHICS = [
  { label: "UN Population Division", url: "https://population.un.org/wpp/" },
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
];
const SRC_FISCAL = [
  {
    label: "IMF Fiscal Monitor",
    url: "https://www.imf.org/en/Publications/FM",
  },
  {
    label: "World Bank Debt Stats",
    url: "https://www.worldbank.org/en/programs/debt-statistics",
  },
];
const SRC_TRADE_PARTNERS = [
  { label: "WTO Statistics", url: "https://stats.wto.org/" },
  { label: "UNCTAD Trade Data", url: "https://unctad.org/statistics" },
];
const SRC_CREDIT = [
  { label: "S&P Global Ratings", url: "https://www.spglobal.com/ratings/" },
  {
    label: "Transparency International CPI",
    url: "https://www.transparency.org/en/cpi/",
  },
];
const SRC_PMI = [
  {
    label: "S&P Global PMI",
    url: "https://www.spglobal.com/marketintelligence/en/mi/research-analysis/pmi.html",
  },
  {
    label: "JPMorgan Global PMI",
    url: "https://www.jpmorgan.com/insights/global-research/economy/pmi",
  },
];

function CountryExtendedPanels({ country }: { country: Country }) {
  const ext = COUNTRY_EXTENDED[country.id];
  const pmi = country.pmi;

  return (
    <div className="mt-4 space-y-4">
      {/* ── DEMOGRAPHICS ── */}
      {ext &&
        (ext.urbanPct != null ||
          ext.birthRate != null ||
          ext.medianAge != null ||
          ext.internetPct != null) && (
          <div className="modal-tile rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-cyan-500/10 rounded-md border border-cyan-500/20 shrink-0">
                <Users size={13} weight="fill" className="text-cyan-400" />
              </div>
              <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
                Demographics
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              {ext.medianAge != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Median Age
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {ext.medianAge} yrs
                  </p>
                </div>
              )}
              {ext.urbanPct != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Urban Pop.
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {ext.urbanPct}%
                  </p>
                </div>
              )}
              {ext.birthRate != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Birth Rate
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {ext.birthRate}
                    <span className="text-[10px] text-muted-foreground">
                      /1k
                    </span>
                  </p>
                </div>
              )}
              {ext.deathRate != null && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Death Rate
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {ext.deathRate}
                    <span className="text-[10px] text-muted-foreground">
                      /1k
                    </span>
                  </p>
                </div>
              )}
            </div>
            {ext.internetPct != null && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-sans">
                    Internet Penetration
                  </span>
                  <span className="font-mono text-foreground">
                    {ext.internetPct}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${ext.internetPct}%`,
                      background: "hsl(200,85%,55%)",
                    }}
                  />
                </div>
              </div>
            )}
            {ext.urbanPct != null && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-sans">
                    Urbanization Rate
                  </span>
                  <span className="font-mono text-foreground">
                    {ext.urbanPct}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${ext.urbanPct}%`,
                      background: "hsl(160,60%,45%)",
                    }}
                  />
                </div>
              </div>
            )}
            <SourceLink sources={SRC_DEMOGRAPHICS} className="mt-2" />
          </div>
        )}

      {/* ── FISCAL & DEBT ── */}
      {ext &&
        (ext.debtPct != null ||
          ext.fiscalBalancePct != null ||
          ext.gini != null) && (
          <div className="modal-tile rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-500/10 rounded-md border border-amber-500/20 shrink-0">
                <CurrencyDollar
                  size={13}
                  weight="fill"
                  className="text-amber-400"
                />
              </div>
              <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
                Fiscal &amp; Inequality
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {ext.debtPct != null && (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Debt/GDP
                  </p>
                  <p
                    className={`text-base font-bold font-mono ${ext.debtPct > 100 ? "text-destructive" : ext.debtPct > 60 ? "text-warning" : "text-success"}`}
                  >
                    {ext.debtPct}%
                  </p>
                </div>
              )}
              {ext.fiscalBalancePct != null && (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Fiscal Balance
                  </p>
                  <p
                    className={`text-base font-bold font-mono ${ext.fiscalBalancePct >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {ext.fiscalBalancePct > 0 ? "+" : ""}
                    {ext.fiscalBalancePct}%
                  </p>
                </div>
              )}
              {ext.gini != null && (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Gini Index
                  </p>
                  <p
                    className={`text-base font-bold font-mono ${ext.gini > 45 ? "text-destructive" : ext.gini > 35 ? "text-warning" : "text-success"}`}
                  >
                    {ext.gini}
                  </p>
                </div>
              )}
            </div>
            {ext.debtPct != null && (
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-sans">
                    Public Debt Load
                  </span>
                  <span
                    className={`font-mono ${ext.debtPct > 100 ? "text-destructive" : ext.debtPct > 60 ? "text-warning" : "text-success"}`}
                  >
                    {ext.debtPct}% of GDP
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, ext.debtPct / 3)}%`,
                      background:
                        ext.debtPct > 100
                          ? "hsl(0,70%,55%)"
                          : ext.debtPct > 60
                            ? "hsl(38,92%,50%)"
                            : "hsl(142,71%,45%)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-0.5 text-muted-foreground">
                  <span>Low</span>
                  <span>Moderate (60%)</span>
                  <span>High (100%+)</span>
                </div>
              </div>
            )}
            <SourceLink sources={SRC_FISCAL} className="mt-2" />
          </div>
        )}

      {/* ── TRADE PARTNERS ── */}
      {ext && (ext.exportPartners?.length || ext.importPartners?.length) && (
        <div className="modal-tile rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-500/10 rounded-md border border-purple-500/20 shrink-0">
              <Globe size={13} weight="fill" className="text-purple-400" />
            </div>
            <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Key Trade Partners
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ext.exportPartners?.length && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Top Exports To
                </p>
                <div className="space-y-1.5">
                  {ext.exportPartners.map((p, i) => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center rounded-full bg-secondary/20 text-secondary text-[9px] font-mono font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs font-sans text-foreground">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ext.importPartners?.length && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Top Imports From
                </p>
                <div className="space-y-1.5">
                  {ext.importPartners.map((p, i) => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-[9px] font-mono font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs font-sans text-foreground">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <SourceLink sources={SRC_TRADE_PARTNERS} className="mt-3" />
        </div>
      )}

      {/* ── CREDIT & GOVERNANCE ── */}
      {ext &&
        (ext.creditRating ||
          ext.cpiScore != null ||
          ext.easeOfBusinessRank != null) && (
          <div className="modal-tile rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-500/10 rounded-md border border-green-500/20 shrink-0">
                <Shield size={13} weight="fill" className="text-green-400" />
              </div>
              <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
                Credit &amp; Governance
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {ext.creditRating && (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Credit Rating
                  </p>
                  <p
                    className={`text-base font-bold font-mono ${
                      ["AAA", "AA+", "AA", "AA-"].includes(ext.creditRating)
                        ? "text-green-400"
                        : ["A+", "A", "A-", "BBB+", "BBB", "BBB-"].includes(
                              ext.creditRating,
                            )
                          ? "text-secondary"
                          : ["BB+", "BB", "BB-"].includes(ext.creditRating)
                            ? "text-yellow-400"
                            : "text-destructive"
                    }`}
                  >
                    {ext.creditRating}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                    {ext.creditAgency}
                  </p>
                </div>
              )}
              {ext.cpiScore != null && (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    CPI Score
                  </p>
                  <p
                    className={`text-base font-bold font-mono ${ext.cpiScore >= 60 ? "text-success" : ext.cpiScore >= 40 ? "text-warning" : "text-destructive"}`}
                  >
                    {ext.cpiScore}
                    <span className="text-[10px] text-muted-foreground">
                      /100
                    </span>
                  </p>
                </div>
              )}
              {ext.easeOfBusinessRank != null && ext.easeOfBusinessRank > 0 && (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                    Business Ease
                  </p>
                  <p
                    className={`text-base font-bold font-mono ${ext.easeOfBusinessRank <= 30 ? "text-success" : ext.easeOfBusinessRank <= 80 ? "text-warning" : "text-destructive"}`}
                  >
                    #{ext.easeOfBusinessRank}
                  </p>
                </div>
              )}
            </div>
            {ext.cpiScore != null && (
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-sans">
                    Corruption Perception Index
                  </span>
                  <span
                    className={`font-mono ${ext.cpiScore >= 60 ? "text-success" : ext.cpiScore >= 40 ? "text-warning" : "text-destructive"}`}
                  >
                    {ext.cpiScore}/100
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${ext.cpiScore}%`,
                      background:
                        ext.cpiScore >= 60
                          ? "hsl(142,71%,45%)"
                          : ext.cpiScore >= 40
                            ? "hsl(38,92%,50%)"
                            : "hsl(0,70%,55%)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-0.5 text-muted-foreground">
                  <span>Very Corrupt</span>
                  <span>Moderate</span>
                  <span>Very Clean</span>
                </div>
              </div>
            )}
            <SourceLink sources={SRC_CREDIT} className="mt-2" />
          </div>
        )}

      {/* ── ECONOMIC STRUCTURE ── */}
      {ext?.economicStructure && (
        <div className="modal-tile rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 shrink-0">
              <Buildings size={13} weight="fill" className="text-emerald-400" />
            </div>
            <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
              Economic Structure
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
            {ext.economicStructure}
          </p>
        </div>
      )}

      {/* ── FUTURES & MARKETS ── */}
      {ext?.futures && (
        <div className="modal-tile rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-md border border-purple-500/20 shrink-0">
                <CurrencyDollar
                  size={13}
                  weight="fill"
                  className="text-purple-400"
                />
              </div>
              <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
                Markets &amp; Futures
              </p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
              Live Reference
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                {ext.futures.stockIndex}
              </p>
              <p className="text-base font-bold font-mono text-foreground leading-none">
                {ext.futures.indexValue}
              </p>
              <p
                className={`text-[10px] font-mono mt-1 ${ext.futures.indexChangeYTD >= 0 ? "text-success" : "text-destructive"}`}
              >
                {ext.futures.indexChangeYTD >= 0 ? "+" : ""}
                {ext.futures.indexChangeYTD}% YTD
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                10Y Bond Yield
              </p>
              <p
                className={`text-base font-bold font-mono leading-none ${ext.futures.bondYield10Y > 8 ? "text-destructive" : ext.futures.bondYield10Y > 4 ? "text-warning" : "text-success"}`}
              >
                {ext.futures.bondYield10Y}%
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                government bonds
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                FX Rate
              </p>
              <p className="text-sm font-bold font-mono text-secondary leading-none">
                {ext.futures.fxRate}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                Key Commodity
              </p>
              <p className="text-xs font-mono text-amber-400 leading-snug">
                {ext.futures.keyCommodity}
              </p>
            </div>
          </div>
          {ext.futures.marketCapT != null && (
            <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border px-3 py-2">
              <span className="text-[10px] text-muted-foreground font-sans">
                Domestic Stock Market Cap
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                ${ext.futures.marketCapT}T USD
              </span>
            </div>
          )}
          <SourceLink sources={SRC_PMI} className="mt-2" />
        </div>
      )}

      {/* ── SERVICES SECTOR BREAKDOWN ── */}
      {ext?.services && (
        <div className="modal-tile rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/10 rounded-md border border-cyan-500/20 shrink-0">
                <Buildings size={13} weight="fill" className="text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
                  Services Sector
                </p>
                <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                  Breakdown of service sub-sectors
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-secondary font-semibold">
                {ext.services.gdpPct}% of GDP
              </span>
              {ext.services.workforcePct != null && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  · {ext.services.workforcePct}% workforce
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 mb-3">
            {ext.services.subSectors.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-[10px] font-sans text-muted-foreground w-36 shrink-0 truncate">
                  {s.name}
                </span>
                <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(s.pct / 30) * 100}%`,
                      backgroundColor: s.color,
                      opacity: 0.85,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-mono w-8 text-right shrink-0"
                  style={{ color: s.color }}
                >
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
          {/* Stacked color bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {ext.services.subSectors.map((s) => (
              <div
                key={s.name}
                className="h-full transition-all duration-700"
                style={{
                  width: `${(s.pct / ext.services!.subSectors.reduce((a, b) => a + b.pct, 0)) * 100}%`,
                  backgroundColor: s.color,
                }}
                title={`${s.name}: ${s.pct}%`}
              />
            ))}
          </div>
          <SourceLink sources={SRC_WORLDBANK} className="mt-3" />
        </div>
      )}

      {/* ── PMI ── */}
      {pmi && (
        <div className="modal-tile rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 shrink-0">
                <Buildings size={13} weight="fill" className="text-blue-400" />
              </div>
              <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
                PMI — Purchasing Managers&#39; Index
              </p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
              {pmi.period}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Composite", value: pmi.composite },
              { label: "Manufacturing", value: pmi.manufacturing },
              { label: "Services", value: pmi.services },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border bg-background/40 p-3 text-center"
              >
                <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                  {m.label}
                </p>
                <p
                  className={`text-base font-bold font-mono ${m.value > 50 ? "text-success" : m.value < 50 ? "text-destructive" : "text-warning"}`}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${pmi.trend === "expanding" ? "bg-success" : pmi.trend === "contracting" ? "bg-destructive" : "bg-warning"}`}
            />
            <p className="text-xs font-sans text-foreground capitalize font-semibold">
              {pmi.trend}
            </p>
            <p className="text-[11px] text-muted-foreground font-sans ml-1">
              — PMI above 50 signals expansion; below 50 signals contraction
            </p>
          </div>
          <SourceLink sources={SRC_PMI} className="mt-2" />
        </div>
      )}
    </div>
  );
}

export function CountriesPage() {
  const {
    countries: liveCountries,
    isRefreshing,
    lastUpdated,
    patchedCount,
    refresh,
  } = useLiveData();
  const [search, setSearch] = useState("");
  const [continentFilter, setContinentFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdp" | "population" | "gdpGrowth" | "humanDevelopmentIndex"
  >("gdp");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [modalCountry, setModalCountry] = useState<Country | null>(null);

  const continents = [
    "All",
    "North America",
    "Asia",
    "Europe",
    "South America",
    "Oceania",
  ];

  const filtered = liveCountries
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchContinent =
        continentFilter === "All" || c.continent === continentFilter;
      return matchSearch && matchContinent;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/20 rounded-lg">
              <Globe size={26} weight="fill" className="text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans text-foreground">
                Countries
              </h1>
              <p className="text-muted-foreground text-sm font-sans">
                In-depth data on sovereign nations — economics, population,
                governance, and development
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lastUpdated && (
              <p className="text-xs text-muted-foreground font-mono hidden sm:block">
                Live · {patchedCount} updated ·{" "}
                {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live data"
            >
              <ArrowsClockwise
                size={13}
                className={isRefreshing ? "animate-spin" : ""}
              />
              {isRefreshing ? "Updating…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Countries Tracked",
              value: "195+",
              color: "text-secondary",
            },
            {
              label: "World Population",
              value: "8.12B",
              color: "text-success",
            },
            { label: "Global GDP", value: "$104.5T", color: "text-warning" },
            { label: "Avg HDI", value: "0.739", color: "text-secondary" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className={`text-xl font-bold font-mono ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <SourceLink sources={SRC_WORLDBANK} className="mb-5 -mt-2" />

        {/* Unified Search + Filter Bar */}
        <div className="flex flex-col bg-card border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              size={16}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {continents.map((c) => (
              <button
                key={c}
                onClick={() => setContinentFilter(c)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  continentFilter === c
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {c}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdp">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="gdpGrowth">Sort: GDP Growth</option>
              <option value="humanDevelopmentIndex">Sort: HDI</option>
            </select>
          </div>
        </div>

        {modalCountry && (
          <CountryModal
            country={modalCountry}
            onClose={() => setModalCountry(null)}
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Country Cards */}
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((country) => (
                <article
                  key={country.id}
                  onClick={() => setModalCountry(country)}
                  className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40"
                >
                  {/* Card header — flag background + name */}
                  <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                    {/* Flag as blurred background */}
                    <img
                      src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105 select-none pointer-events-none"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-card/60 via-card/70 to-card pointer-events-none" />
                    {/* Content */}
                    <div className="relative flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                        <img
                          src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                          alt={`${country.name} flag`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const t = e.currentTarget;
                            t.onerror = null;
                            t.style.display = "none";
                            const fb =
                              t.nextElementSibling as HTMLElement | null;
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-1 items-center justify-center hidden">
                          <span className="text-xs font-bold font-mono text-primary-foreground">
                            {country.code}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold font-sans text-foreground text-sm">
                          {country.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-sans">
                          {country.capital}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`relative text-xs border px-2 py-0.5 rounded-full font-sans shrink-0 ${continentColors[country.continent] ?? "text-muted-foreground border-border bg-muted"}`}
                    >
                      {country.continent}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        GDP
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground">
                        {fmtGDP(country.gdp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        GDP Growth
                      </p>
                      <p
                        className={`text-sm font-bold font-mono ${country.gdpGrowth >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {country.gdpGrowth >= 0 ? "+" : ""}
                        {country.gdpGrowth}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        Population
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground">
                        {fmtPop(country.population)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans">
                        HDI
                      </p>
                      <p className="text-sm font-bold font-mono text-foreground">
                        {country.humanDevelopmentIndex}
                      </p>
                    </div>
                  </div>

                  {/* HDI bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-sans">
                        Human Dev. Index
                      </span>
                      <span className="font-mono text-foreground">
                        {(country.humanDevelopmentIndex * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary transition-all duration-500"
                        style={{
                          width: `${country.humanDevelopmentIndex * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
