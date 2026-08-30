import React, { useState, useEffect } from "react";
import {
  Buildings,
  MagnifyingGlass,
  MapPin,
  X,
  ListBullets,
  MapTrifold,
  Scales,
  ArrowLeft,
  NotePencil,
  DownloadSimple,
  House,
  Train,
  FirstAid,
  GraduationCap,
  WifiHigh,
  ChartBar,
  Rocket,
} from "@phosphor-icons/react";
import { useNotes } from "../contexts/NotesContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { citiesData, type City } from "../data/citiesData";
import { getUpcoming } from "../data/upcomingToWatch";
import { SourceLink } from "../components/SourceLink";

const SRC_CITIES = [
  {
    label: "Numbeo City Rankings",
    url: "https://www.numbeo.com/city-rankings/",
  },
  {
    label: "Global Power City Index",
    url: "https://mori-m-foundation.or.jp/english/ius2/gpci2/",
  },
];

// ─── Urban Statistics Data ─────────────────────────────────────────────────
interface UrbanStats {
  // Housing
  avgRentUSD1BR: number; // avg monthly rent 1-bedroom city center (USD)
  avgHomePriceUSDm2: number; // avg price per m² to buy apartment (USD)
  rentToIncomeRatio: number; // rent as % of avg salary (0–100)
  // Transport
  transitScore: number; // public transit quality 0–100 (Numbeo-style)
  avgCommuteMin: number; // avg one-way commute in minutes
  bikeInfraScore: number; // cycling infrastructure 0–100
  // Healthcare
  healthcareIndex: number; // Numbeo healthcare index 0–100
  hospitalBedsPerK: number; // hospital beds per 1,000 residents
  // Education
  literacyRate: number; // %
  topUniversityRank: number | null; // QS world ranking of top uni in city (null if none in top 500)
  // Digital & Environment
  avgInternetMbps: number; // avg broadband speed Mbps
  greenSpacePct: number; // % of city area that is parks/green
  recyclingRatePct: number; // municipal recycling rate %
  // Economy & Inequality
  unemploymentRate: number; // %
  giniCoefficient: number; // 0–100 (higher = more unequal)
  avgSalaryUSD: number; // net monthly avg salary USD
  // Startup Ecosystem
  startupScore: number; // 0–100 composite
  unicorns: number; // unicorn companies HQ'd here
}

const CITY_URBAN_STATS: Record<string, UrbanStats> = {
  "new-york": {
    avgRentUSD1BR: 3800,
    avgHomePriceUSDm2: 17500,
    rentToIncomeRatio: 62,
    transitScore: 88,
    avgCommuteMin: 47,
    bikeInfraScore: 52,
    healthcareIndex: 72,
    hospitalBedsPerK: 3.1,
    literacyRate: 99,
    topUniversityRank: 12,
    avgInternetMbps: 250,
    greenSpacePct: 27,
    recyclingRatePct: 21,
    unemploymentRate: 5.2,
    giniCoefficient: 50,
    avgSalaryUSD: 5800,
    startupScore: 92,
    unicorns: 143,
  },
  "new-york-city": {
    avgRentUSD1BR: 3800,
    avgHomePriceUSDm2: 17500,
    rentToIncomeRatio: 62,
    transitScore: 88,
    avgCommuteMin: 47,
    bikeInfraScore: 52,
    healthcareIndex: 72,
    hospitalBedsPerK: 3.1,
    literacyRate: 99,
    topUniversityRank: 12,
    avgInternetMbps: 250,
    greenSpacePct: 27,
    recyclingRatePct: 21,
    unemploymentRate: 5.2,
    giniCoefficient: 50,
    avgSalaryUSD: 5800,
    startupScore: 92,
    unicorns: 143,
  },
  nyc26: {
    avgRentUSD1BR: 3800,
    avgHomePriceUSDm2: 17500,
    rentToIncomeRatio: 62,
    transitScore: 88,
    avgCommuteMin: 47,
    bikeInfraScore: 52,
    healthcareIndex: 72,
    hospitalBedsPerK: 3.1,
    literacyRate: 99,
    topUniversityRank: 12,
    avgInternetMbps: 250,
    greenSpacePct: 27,
    recyclingRatePct: 21,
    unemploymentRate: 5.2,
    giniCoefficient: 50,
    avgSalaryUSD: 5800,
    startupScore: 92,
    unicorns: 143,
  },
  tky26: {
    avgRentUSD1BR: 1400,
    avgHomePriceUSDm2: 10200,
    rentToIncomeRatio: 28,
    transitScore: 97,
    avgCommuteMin: 48,
    bikeInfraScore: 62,
    healthcareIndex: 88,
    hospitalBedsPerK: 13.1,
    literacyRate: 99.9,
    topUniversityRank: 23,
    avgInternetMbps: 190,
    greenSpacePct: 18,
    recyclingRatePct: 77,
    unemploymentRate: 2.4,
    giniCoefficient: 33,
    avgSalaryUSD: 3100,
    startupScore: 71,
    unicorns: 12,
  },
  tokyo: {
    avgRentUSD1BR: 1400,
    avgHomePriceUSDm2: 10200,
    rentToIncomeRatio: 28,
    transitScore: 97,
    avgCommuteMin: 48,
    bikeInfraScore: 62,
    healthcareIndex: 88,
    hospitalBedsPerK: 13.1,
    literacyRate: 99.9,
    topUniversityRank: 23,
    avgInternetMbps: 190,
    greenSpacePct: 18,
    recyclingRatePct: 77,
    unemploymentRate: 2.4,
    giniCoefficient: 33,
    avgSalaryUSD: 3100,
    startupScore: 71,
    unicorns: 12,
  },
  lon26: {
    avgRentUSD1BR: 2900,
    avgHomePriceUSDm2: 14800,
    rentToIncomeRatio: 57,
    transitScore: 83,
    avgCommuteMin: 43,
    bikeInfraScore: 65,
    healthcareIndex: 74,
    hospitalBedsPerK: 2.5,
    literacyRate: 99.5,
    topUniversityRank: 6,
    avgInternetMbps: 165,
    greenSpacePct: 47,
    recyclingRatePct: 38,
    unemploymentRate: 4.1,
    giniCoefficient: 40,
    avgSalaryUSD: 4300,
    startupScore: 87,
    unicorns: 68,
  },
  london: {
    avgRentUSD1BR: 2900,
    avgHomePriceUSDm2: 14800,
    rentToIncomeRatio: 57,
    transitScore: 83,
    avgCommuteMin: 43,
    bikeInfraScore: 65,
    healthcareIndex: 74,
    hospitalBedsPerK: 2.5,
    literacyRate: 99.5,
    topUniversityRank: 6,
    avgInternetMbps: 165,
    greenSpacePct: 47,
    recyclingRatePct: 38,
    unemploymentRate: 4.1,
    giniCoefficient: 40,
    avgSalaryUSD: 4300,
    startupScore: 87,
    unicorns: 68,
  },
  par26: {
    avgRentUSD1BR: 2100,
    avgHomePriceUSDm2: 13200,
    rentToIncomeRatio: 51,
    transitScore: 86,
    avgCommuteMin: 40,
    bikeInfraScore: 74,
    healthcareIndex: 82,
    hospitalBedsPerK: 6.0,
    literacyRate: 99.8,
    topUniversityRank: 33,
    avgInternetMbps: 215,
    greenSpacePct: 14,
    recyclingRatePct: 43,
    unemploymentRate: 8.5,
    giniCoefficient: 42,
    avgSalaryUSD: 3300,
    startupScore: 79,
    unicorns: 28,
  },
  paris: {
    avgRentUSD1BR: 2100,
    avgHomePriceUSDm2: 13200,
    rentToIncomeRatio: 51,
    transitScore: 86,
    avgCommuteMin: 40,
    bikeInfraScore: 74,
    healthcareIndex: 82,
    hospitalBedsPerK: 6.0,
    literacyRate: 99.8,
    topUniversityRank: 33,
    avgInternetMbps: 215,
    greenSpacePct: 14,
    recyclingRatePct: 43,
    unemploymentRate: 8.5,
    giniCoefficient: 42,
    avgSalaryUSD: 3300,
    startupScore: 79,
    unicorns: 28,
  },
  dxb26: {
    avgRentUSD1BR: 2400,
    avgHomePriceUSDm2: 5400,
    rentToIncomeRatio: 36,
    transitScore: 62,
    avgCommuteMin: 39,
    bikeInfraScore: 22,
    healthcareIndex: 79,
    hospitalBedsPerK: 1.9,
    literacyRate: 96.3,
    topUniversityRank: 301,
    avgInternetMbps: 195,
    greenSpacePct: 11,
    recyclingRatePct: 19,
    unemploymentRate: 2.6,
    giniCoefficient: 38,
    avgSalaryUSD: 4800,
    startupScore: 72,
    unicorns: 7,
  },
  dubai: {
    avgRentUSD1BR: 2400,
    avgHomePriceUSDm2: 5400,
    rentToIncomeRatio: 36,
    transitScore: 62,
    avgCommuteMin: 39,
    bikeInfraScore: 22,
    healthcareIndex: 79,
    hospitalBedsPerK: 1.9,
    literacyRate: 96.3,
    topUniversityRank: 301,
    avgInternetMbps: 195,
    greenSpacePct: 11,
    recyclingRatePct: 19,
    unemploymentRate: 2.6,
    giniCoefficient: 38,
    avgSalaryUSD: 4800,
    startupScore: 72,
    unicorns: 7,
  },
  sgp: {
    avgRentUSD1BR: 3100,
    avgHomePriceUSDm2: 17900,
    rentToIncomeRatio: 43,
    transitScore: 91,
    avgCommuteMin: 45,
    bikeInfraScore: 44,
    healthcareIndex: 90,
    hospitalBedsPerK: 2.4,
    literacyRate: 97.5,
    topUniversityRank: 8,
    avgInternetMbps: 310,
    greenSpacePct: 47,
    recyclingRatePct: 61,
    unemploymentRate: 2.1,
    giniCoefficient: 46,
    avgSalaryUSD: 5200,
    startupScore: 85,
    unicorns: 11,
  },
  singapore: {
    avgRentUSD1BR: 3100,
    avgHomePriceUSDm2: 17900,
    rentToIncomeRatio: 43,
    transitScore: 91,
    avgCommuteMin: 45,
    bikeInfraScore: 44,
    healthcareIndex: 90,
    hospitalBedsPerK: 2.4,
    literacyRate: 97.5,
    topUniversityRank: 8,
    avgInternetMbps: 310,
    greenSpacePct: 47,
    recyclingRatePct: 61,
    unemploymentRate: 2.1,
    giniCoefficient: 46,
    avgSalaryUSD: 5200,
    startupScore: 85,
    unicorns: 11,
  },
  syd26: {
    avgRentUSD1BR: 2600,
    avgHomePriceUSDm2: 12800,
    rentToIncomeRatio: 49,
    transitScore: 68,
    avgCommuteMin: 41,
    bikeInfraScore: 48,
    healthcareIndex: 78,
    hospitalBedsPerK: 3.8,
    literacyRate: 99.9,
    topUniversityRank: 19,
    avgInternetMbps: 90,
    greenSpacePct: 46,
    recyclingRatePct: 62,
    unemploymentRate: 3.4,
    giniCoefficient: 35,
    avgSalaryUSD: 4600,
    startupScore: 69,
    unicorns: 6,
  },
  sydney: {
    avgRentUSD1BR: 2600,
    avgHomePriceUSDm2: 12800,
    rentToIncomeRatio: 49,
    transitScore: 68,
    avgCommuteMin: 41,
    bikeInfraScore: 48,
    healthcareIndex: 78,
    hospitalBedsPerK: 3.8,
    literacyRate: 99.9,
    topUniversityRank: 19,
    avgInternetMbps: 90,
    greenSpacePct: 46,
    recyclingRatePct: 62,
    unemploymentRate: 3.4,
    giniCoefficient: 35,
    avgSalaryUSD: 4600,
    startupScore: 69,
    unicorns: 6,
  },
  ber26: {
    avgRentUSD1BR: 1600,
    avgHomePriceUSDm2: 7200,
    rentToIncomeRatio: 38,
    transitScore: 87,
    avgCommuteMin: 38,
    bikeInfraScore: 91,
    healthcareIndex: 81,
    hospitalBedsPerK: 8.2,
    literacyRate: 99.7,
    topUniversityRank: 130,
    avgInternetMbps: 135,
    greenSpacePct: 44,
    recyclingRatePct: 67,
    unemploymentRate: 7.8,
    giniCoefficient: 39,
    avgSalaryUSD: 3100,
    startupScore: 76,
    unicorns: 18,
  },
  berlin: {
    avgRentUSD1BR: 1600,
    avgHomePriceUSDm2: 7200,
    rentToIncomeRatio: 38,
    transitScore: 87,
    avgCommuteMin: 38,
    bikeInfraScore: 91,
    healthcareIndex: 81,
    hospitalBedsPerK: 8.2,
    literacyRate: 99.7,
    topUniversityRank: 130,
    avgInternetMbps: 135,
    greenSpacePct: 44,
    recyclingRatePct: 67,
    unemploymentRate: 7.8,
    giniCoefficient: 39,
    avgSalaryUSD: 3100,
    startupScore: 76,
    unicorns: 18,
  },
  sfo: {
    avgRentUSD1BR: 3400,
    avgHomePriceUSDm2: 14500,
    rentToIncomeRatio: 44,
    transitScore: 65,
    avgCommuteMin: 42,
    bikeInfraScore: 67,
    healthcareIndex: 76,
    hospitalBedsPerK: 1.8,
    literacyRate: 99.2,
    topUniversityRank: 1,
    avgInternetMbps: 320,
    greenSpacePct: 20,
    recyclingRatePct: 80,
    unemploymentRate: 3.9,
    giniCoefficient: 52,
    avgSalaryUSD: 9400,
    startupScore: 99,
    unicorns: 287,
  },
  sha26: {
    avgRentUSD1BR: 1100,
    avgHomePriceUSDm2: 8900,
    rentToIncomeRatio: 53,
    transitScore: 89,
    avgCommuteMin: 52,
    bikeInfraScore: 70,
    healthcareIndex: 67,
    hospitalBedsPerK: 5.8,
    literacyRate: 99.3,
    topUniversityRank: 47,
    avgInternetMbps: 195,
    greenSpacePct: 16,
    recyclingRatePct: 37,
    unemploymentRate: 3.5,
    giniCoefficient: 48,
    avgSalaryUSD: 2100,
    startupScore: 74,
    unicorns: 22,
  },
  bei26: {
    avgRentUSD1BR: 950,
    avgHomePriceUSDm2: 10600,
    rentToIncomeRatio: 61,
    transitScore: 90,
    avgCommuteMin: 55,
    bikeInfraScore: 78,
    healthcareIndex: 65,
    hospitalBedsPerK: 8.7,
    literacyRate: 99.4,
    topUniversityRank: 15,
    avgInternetMbps: 145,
    greenSpacePct: 12,
    recyclingRatePct: 35,
    unemploymentRate: 3.8,
    giniCoefficient: 49,
    avgSalaryUSD: 1800,
    startupScore: 78,
    unicorns: 30,
  },
  seo26: {
    avgRentUSD1BR: 1600,
    avgHomePriceUSDm2: 13700,
    rentToIncomeRatio: 42,
    transitScore: 94,
    avgCommuteMin: 44,
    bikeInfraScore: 55,
    healthcareIndex: 87,
    hospitalBedsPerK: 12.8,
    literacyRate: 99.9,
    topUniversityRank: 36,
    avgInternetMbps: 290,
    greenSpacePct: 41,
    recyclingRatePct: 82,
    unemploymentRate: 2.8,
    giniCoefficient: 31,
    avgSalaryUSD: 2900,
    startupScore: 80,
    unicorns: 15,
  },
  ams26: {
    avgRentUSD1BR: 2200,
    avgHomePriceUSDm2: 9100,
    rentToIncomeRatio: 48,
    transitScore: 79,
    avgCommuteMin: 35,
    bikeInfraScore: 97,
    healthcareIndex: 84,
    hospitalBedsPerK: 3.3,
    literacyRate: 99.9,
    topUniversityRank: 61,
    avgInternetMbps: 310,
    greenSpacePct: 16,
    recyclingRatePct: 64,
    unemploymentRate: 3.7,
    giniCoefficient: 30,
    avgSalaryUSD: 3900,
    startupScore: 77,
    unicorns: 10,
  },
  zur26: {
    avgRentUSD1BR: 2800,
    avgHomePriceUSDm2: 14400,
    rentToIncomeRatio: 31,
    transitScore: 91,
    avgCommuteMin: 29,
    bikeInfraScore: 82,
    healthcareIndex: 90,
    hospitalBedsPerK: 4.4,
    literacyRate: 99.9,
    topUniversityRank: 7,
    avgInternetMbps: 265,
    greenSpacePct: 42,
    recyclingRatePct: 92,
    unemploymentRate: 2.3,
    giniCoefficient: 33,
    avgSalaryUSD: 8200,
    startupScore: 75,
    unicorns: 5,
  },
  cph26: {
    avgRentUSD1BR: 2100,
    avgHomePriceUSDm2: 8600,
    rentToIncomeRatio: 37,
    transitScore: 84,
    avgCommuteMin: 32,
    bikeInfraScore: 95,
    healthcareIndex: 87,
    hospitalBedsPerK: 2.9,
    literacyRate: 99.9,
    topUniversityRank: 87,
    avgInternetMbps: 260,
    greenSpacePct: 38,
    recyclingRatePct: 70,
    unemploymentRate: 4.9,
    giniCoefficient: 29,
    avgSalaryUSD: 4900,
    startupScore: 71,
    unicorns: 9,
  },
  hel26: {
    avgRentUSD1BR: 1450,
    avgHomePriceUSDm2: 5600,
    rentToIncomeRatio: 32,
    transitScore: 80,
    avgCommuteMin: 31,
    bikeInfraScore: 88,
    healthcareIndex: 89,
    hospitalBedsPerK: 4.8,
    literacyRate: 100,
    topUniversityRank: 105,
    avgInternetMbps: 240,
    greenSpacePct: 67,
    recyclingRatePct: 58,
    unemploymentRate: 6.5,
    giniCoefficient: 27,
    avgSalaryUSD: 4000,
    startupScore: 68,
    unicorns: 4,
  },
  tal: {
    avgRentUSD1BR: 780,
    avgHomePriceUSDm2: 3100,
    rentToIncomeRatio: 33,
    transitScore: 71,
    avgCommuteMin: 28,
    bikeInfraScore: 60,
    healthcareIndex: 75,
    hospitalBedsPerK: 5.4,
    literacyRate: 99.8,
    topUniversityRank: 401,
    avgInternetMbps: 230,
    greenSpacePct: 28,
    recyclingRatePct: 30,
    unemploymentRate: 5.3,
    giniCoefficient: 31,
    avgSalaryUSD: 1800,
    startupScore: 62,
    unicorns: 2,
  },
  tor26: {
    avgRentUSD1BR: 2100,
    avgHomePriceUSDm2: 10400,
    rentToIncomeRatio: 46,
    transitScore: 74,
    avgCommuteMin: 43,
    bikeInfraScore: 57,
    healthcareIndex: 80,
    hospitalBedsPerK: 2.6,
    literacyRate: 99.8,
    topUniversityRank: 18,
    avgInternetMbps: 145,
    greenSpacePct: 18,
    recyclingRatePct: 55,
    unemploymentRate: 5.8,
    giniCoefficient: 41,
    avgSalaryUSD: 3600,
    startupScore: 74,
    unicorns: 14,
  },
  mum26: {
    avgRentUSD1BR: 520,
    avgHomePriceUSDm2: 4600,
    rentToIncomeRatio: 55,
    transitScore: 71,
    avgCommuteMin: 58,
    bikeInfraScore: 18,
    healthcareIndex: 55,
    hospitalBedsPerK: 1.6,
    literacyRate: 89.7,
    topUniversityRank: null,
    avgInternetMbps: 35,
    greenSpacePct: 13,
    recyclingRatePct: 17,
    unemploymentRate: 5.4,
    giniCoefficient: 46,
    avgSalaryUSD: 790,
    startupScore: 63,
    unicorns: 8,
  },
  sao26: {
    avgRentUSD1BR: 620,
    avgHomePriceUSDm2: 3200,
    rentToIncomeRatio: 44,
    transitScore: 58,
    avgCommuteMin: 62,
    bikeInfraScore: 32,
    healthcareIndex: 52,
    hospitalBedsPerK: 2.8,
    literacyRate: 97.2,
    topUniversityRank: 115,
    avgInternetMbps: 110,
    greenSpacePct: 16,
    recyclingRatePct: 25,
    unemploymentRate: 11.5,
    giniCoefficient: 57,
    avgSalaryUSD: 870,
    startupScore: 58,
    unicorns: 5,
  },
  ist26: {
    avgRentUSD1BR: 680,
    avgHomePriceUSDm2: 2800,
    rentToIncomeRatio: 52,
    transitScore: 70,
    avgCommuteMin: 50,
    bikeInfraScore: 14,
    healthcareIndex: 63,
    hospitalBedsPerK: 3.7,
    literacyRate: 98.5,
    topUniversityRank: null,
    avgInternetMbps: 53,
    greenSpacePct: 12,
    recyclingRatePct: 22,
    unemploymentRate: 9.7,
    giniCoefficient: 44,
    avgSalaryUSD: 890,
    startupScore: 52,
    unicorns: 3,
  },
  mos26: {
    avgRentUSD1BR: 700,
    avgHomePriceUSDm2: 4200,
    rentToIncomeRatio: 35,
    transitScore: 88,
    avgCommuteMin: 52,
    bikeInfraScore: 28,
    healthcareIndex: 60,
    hospitalBedsPerK: 8.6,
    literacyRate: 99.8,
    topUniversityRank: 87,
    avgInternetMbps: 72,
    greenSpacePct: 34,
    recyclingRatePct: 11,
    unemploymentRate: 3.1,
    giniCoefficient: 44,
    avgSalaryUSD: 1400,
    startupScore: 45,
    unicorns: 4,
  },
  mex26: {
    avgRentUSD1BR: 680,
    avgHomePriceUSDm2: 2100,
    rentToIncomeRatio: 47,
    transitScore: 63,
    avgCommuteMin: 56,
    bikeInfraScore: 36,
    healthcareIndex: 53,
    hospitalBedsPerK: 1.4,
    literacyRate: 97.9,
    topUniversityRank: 104,
    avgInternetMbps: 38,
    greenSpacePct: 14,
    recyclingRatePct: 14,
    unemploymentRate: 3.4,
    giniCoefficient: 51,
    avgSalaryUSD: 860,
    startupScore: 50,
    unicorns: 2,
  },
  bue26: {
    avgRentUSD1BR: 430,
    avgHomePriceUSDm2: 1800,
    rentToIncomeRatio: 41,
    transitScore: 67,
    avgCommuteMin: 45,
    bikeInfraScore: 48,
    healthcareIndex: 61,
    hospitalBedsPerK: 5.0,
    literacyRate: 99.2,
    topUniversityRank: null,
    avgInternetMbps: 62,
    greenSpacePct: 9,
    recyclingRatePct: 12,
    unemploymentRate: 7.7,
    giniCoefficient: 49,
    avgSalaryUSD: 550,
    startupScore: 42,
    unicorns: 2,
  },
  lag26: {
    avgRentUSD1BR: 280,
    avgHomePriceUSDm2: 890,
    rentToIncomeRatio: 48,
    transitScore: 32,
    avgCommuteMin: 70,
    bikeInfraScore: 4,
    healthcareIndex: 30,
    hospitalBedsPerK: 0.4,
    literacyRate: 92.4,
    topUniversityRank: null,
    avgInternetMbps: 14,
    greenSpacePct: 4,
    recyclingRatePct: 6,
    unemploymentRate: 21.0,
    giniCoefficient: 55,
    avgSalaryUSD: 320,
    startupScore: 35,
    unicorns: 1,
  },
  bar26: {
    avgRentUSD1BR: 1400,
    avgHomePriceUSDm2: 5800,
    rentToIncomeRatio: 45,
    transitScore: 83,
    avgCommuteMin: 36,
    bikeInfraScore: 78,
    healthcareIndex: 80,
    hospitalBedsPerK: 3.2,
    literacyRate: 99.7,
    topUniversityRank: 135,
    avgInternetMbps: 185,
    greenSpacePct: 6,
    recyclingRatePct: 36,
    unemploymentRate: 9.4,
    giniCoefficient: 38,
    avgSalaryUSD: 2200,
    startupScore: 65,
    unicorns: 3,
  },
  vie26: {
    avgRentUSD1BR: 1450,
    avgHomePriceUSDm2: 7400,
    rentToIncomeRatio: 30,
    transitScore: 89,
    avgCommuteMin: 30,
    bikeInfraScore: 80,
    healthcareIndex: 87,
    hospitalBedsPerK: 7.3,
    literacyRate: 99.9,
    topUniversityRank: 164,
    avgInternetMbps: 130,
    greenSpacePct: 50,
    recyclingRatePct: 65,
    unemploymentRate: 5.1,
    giniCoefficient: 30,
    avgSalaryUSD: 3100,
    startupScore: 60,
    unicorns: 2,
  },
  mel26: {
    avgRentUSD1BR: 2300,
    avgHomePriceUSDm2: 10900,
    rentToIncomeRatio: 47,
    transitScore: 66,
    avgCommuteMin: 40,
    bikeInfraScore: 45,
    healthcareIndex: 79,
    hospitalBedsPerK: 3.9,
    literacyRate: 99.9,
    topUniversityRank: 14,
    avgInternetMbps: 85,
    greenSpacePct: 50,
    recyclingRatePct: 60,
    unemploymentRate: 3.6,
    giniCoefficient: 33,
    avgSalaryUSD: 4400,
    startupScore: 65,
    unicorns: 3,
  },
  hk26: {
    avgRentUSD1BR: 2700,
    avgHomePriceUSDm2: 27000,
    rentToIncomeRatio: 58,
    transitScore: 93,
    avgCommuteMin: 44,
    bikeInfraScore: 20,
    healthcareIndex: 85,
    hospitalBedsPerK: 4.9,
    literacyRate: 98.4,
    topUniversityRank: 26,
    avgInternetMbps: 265,
    greenSpacePct: 40,
    recyclingRatePct: 39,
    unemploymentRate: 3.0,
    giniCoefficient: 54,
    avgSalaryUSD: 3800,
    startupScore: 68,
    unicorns: 7,
  },
  fra26: {
    avgRentUSD1BR: 1600,
    avgHomePriceUSDm2: 6900,
    rentToIncomeRatio: 31,
    transitScore: 82,
    avgCommuteMin: 34,
    bikeInfraScore: 72,
    healthcareIndex: 82,
    hospitalBedsPerK: 6.1,
    literacyRate: 99.8,
    topUniversityRank: 120,
    avgInternetMbps: 155,
    greenSpacePct: 22,
    recyclingRatePct: 53,
    unemploymentRate: 6.2,
    giniCoefficient: 31,
    avgSalaryUSD: 3400,
    startupScore: 62,
    unicorns: 4,
  },
  joh26: {
    avgRentUSD1BR: 480,
    avgHomePriceUSDm2: 1600,
    rentToIncomeRatio: 40,
    transitScore: 28,
    avgCommuteMin: 55,
    bikeInfraScore: 8,
    healthcareIndex: 39,
    hospitalBedsPerK: 1.8,
    literacyRate: 95.4,
    topUniversityRank: 240,
    avgInternetMbps: 22,
    greenSpacePct: 18,
    recyclingRatePct: 9,
    unemploymentRate: 27.0,
    giniCoefficient: 63,
    avgSalaryUSD: 840,
    startupScore: 34,
    unicorns: 0,
  },
  kar26: {
    avgRentUSD1BR: 190,
    avgHomePriceUSDm2: 700,
    rentToIncomeRatio: 39,
    transitScore: 35,
    avgCommuteMin: 53,
    bikeInfraScore: 5,
    healthcareIndex: 33,
    hospitalBedsPerK: 0.6,
    literacyRate: 73.5,
    topUniversityRank: null,
    avgInternetMbps: 12,
    greenSpacePct: 4,
    recyclingRatePct: 5,
    unemploymentRate: 8.8,
    giniCoefficient: 41,
    avgSalaryUSD: 270,
    startupScore: 28,
    unicorns: 0,
  },
  bkk26: {
    avgRentUSD1BR: 680,
    avgHomePriceUSDm2: 3400,
    rentToIncomeRatio: 40,
    transitScore: 61,
    avgCommuteMin: 51,
    bikeInfraScore: 16,
    healthcareIndex: 72,
    hospitalBedsPerK: 2.2,
    literacyRate: 97.1,
    topUniversityRank: 246,
    avgInternetMbps: 115,
    greenSpacePct: 7,
    recyclingRatePct: 21,
    unemploymentRate: 1.1,
    giniCoefficient: 47,
    avgSalaryUSD: 1100,
    startupScore: 52,
    unicorns: 2,
  },
  mco: {
    avgRentUSD1BR: 6500,
    avgHomePriceUSDm2: 65000,
    rentToIncomeRatio: 28,
    transitScore: 72,
    avgCommuteMin: 14,
    bikeInfraScore: 40,
    healthcareIndex: 88,
    hospitalBedsPerK: 13.8,
    literacyRate: 99.9,
    topUniversityRank: null,
    avgInternetMbps: 500,
    greenSpacePct: 6,
    recyclingRatePct: 50,
    unemploymentRate: 2.0,
    giniCoefficient: 32,
    avgSalaryUSD: 18000,
    startupScore: 50,
    unicorns: 0,
  },
};

const DEFAULT_URBAN_STATS: UrbanStats = {
  avgRentUSD1BR: 1200,
  avgHomePriceUSDm2: 5000,
  rentToIncomeRatio: 40,
  transitScore: 65,
  avgCommuteMin: 42,
  bikeInfraScore: 40,
  healthcareIndex: 65,
  hospitalBedsPerK: 3.0,
  literacyRate: 95,
  topUniversityRank: null,
  avgInternetMbps: 80,
  greenSpacePct: 20,
  recyclingRatePct: 25,
  unemploymentRate: 6.0,
  giniCoefficient: 40,
  avgSalaryUSD: 1500,
  startupScore: 40,
  unicorns: 0,
};
const SRC_CITY_LAWS = [
  {
    label: "City & Local Government Network",
    url: "https://www.citiesalliance.org/",
  },
];

const regionColors: Record<string, string> = {
  "North America": "text-secondary border-secondary bg-secondary/10",
  "Western Europe": "text-purple-400 border-purple-500/40 bg-purple-500/10",
  "East Asia": "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  "Southeast Asia": "text-green-400 border-green-500/40 bg-green-500/10",
  "Middle East": "text-orange-400 border-orange-500/40 bg-orange-500/10",
  "Central Europe": "text-pink-400 border-pink-500/40 bg-pink-500/10",
  Oceania: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  "South Asia": "text-red-400 border-red-500/40 bg-red-500/10",
  "South America": "text-lime-400 border-lime-500/40 bg-lime-500/10",
  "Eastern Europe": "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
  "Northern Europe": "text-teal-400 border-teal-500/40 bg-teal-500/10",
  Africa: "text-amber-400 border-amber-500/40 bg-amber-500/10",
};

function IndexBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-sans">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.replace("text-", "bg-")}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Per-city laws data ────────────────────────────────────────────────────
interface CityLaw {
  category: string;
  title: string;
  description: string;
  enacted?: string;
  status: "Active" | "Proposed" | "Repealed";
  color: string;
}

const CITY_LAWS: Record<string, CityLaw[]> = {
  "new-york": [
    {
      category: "Housing",
      title: "Rent Stabilization Law",
      description:
        "Limits annual rent increases for eligible apartments and grants tenants right of renewal.",
      enacted: "1969",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Environment",
      title: "Local Law 97 — Climate Mobilization Act",
      description:
        "Requires large buildings to cut carbon emissions by 40% by 2030 and 80% by 2050.",
      enacted: "2019",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Labor",
      title: "Fair Work Week Law",
      description:
        "Requires fast-food employers to provide predictable schedules and premium pay for last-minute changes.",
      enacted: "2017",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Public Safety",
      title: "Bail Reform Act (local application)",
      description:
        "Limits cash bail for most misdemeanors and non-violent felonies to reduce pre-trial detention.",
      enacted: "2020",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Transport",
      title: "Congestion Pricing Scheme",
      description:
        "Tolls vehicles entering Manhattan below 60th Street to reduce gridlock and fund public transit.",
      enacted: "2024",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Business",
      title: "Commercial Rent Stabilization Bill",
      description:
        "Proposed protections for small-business tenants against sudden lease non-renewals.",
      enacted: "2024",
      status: "Proposed",
      color: "#fb923c",
    },
  ],
  tokyo: [
    {
      category: "Environment",
      title: "Tokyo Cap-and-Trade Program",
      description:
        "World's first urban emissions trading scheme requiring large facilities to cut CO₂.",
      enacted: "2010",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Disaster",
      title: "Disaster Prevention Ordinance",
      description:
        "Mandates earthquake-resistance retrofitting for buildings and regular evacuation drills.",
      enacted: "2000",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Labor",
      title: "Overwork Prevention Regulation",
      description:
        "Caps overtime at 100 hours/month and requires employers to offer mental health support.",
      enacted: "2019",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Housing",
      title: "Urban Renaissance Special District Law",
      description:
        "Enables fast-track development in designated zones to increase housing stock.",
      enacted: "2002",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Public Safety",
      title: "Anti-Stalking Ordinance",
      description:
        "Strengthens restraining-order provisions and criminalises persistent unwanted contact.",
      enacted: "2013",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Transport",
      title: "Zero-Emission Vehicle By-Law",
      description:
        "Requires all new taxis and ride-share vehicles registered in Tokyo to be electric by 2030.",
      enacted: "2022",
      status: "Active",
      color: "#22d3ee",
    },
  ],
  london: [
    {
      category: "Environment",
      title: "Ultra Low Emission Zone (ULEZ)",
      description:
        "Charges high-emission vehicles entering Greater London to improve air quality.",
      enacted: "2021",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Transport",
      title: "Congestion Charge Scheme",
      description:
        "Daily charge for vehicles driving within the Central London Congestion Charge Zone.",
      enacted: "2003",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Housing",
      title: "Mayor's London Plan",
      description:
        "Requires 35–50% affordable housing in new residential developments.",
      enacted: "2021",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Business",
      title: "London Living Wage Policy",
      description:
        "Voluntary certification scheme encouraging employers to pay above the national minimum wage.",
      enacted: "2005",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Public Safety",
      title: "Night Time Economy Strategy",
      description:
        "Licensing framework governing late-night venues to balance vibrancy with public safety.",
      enacted: "2018",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Climate",
      title: "Net Zero London By 2030 Target",
      description:
        "Binding mayoral commitment to decarbonise city operations and cut borough-wide emissions.",
      enacted: "2018",
      status: "Active",
      color: "#22d3ee",
    },
  ],
  paris: [
    {
      category: "Environment",
      title: "Paris Climate Action Plan",
      description:
        "Aims for carbon neutrality by 2050 with interim milestones including cycling infrastructure expansion.",
      enacted: "2018",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Transport",
      title: "Paris Car-Free Sundays",
      description:
        "Monthly closures of central boulevards to private vehicles, promoting walking and cycling.",
      enacted: "2015",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Housing",
      title: "Encadrement des Loyers (Rent Control)",
      description:
        "Caps rents at 20% above reference index in Paris arrondissements.",
      enacted: "2019",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Urban Planning",
      title: "Paris en Commun Street Reallocation",
      description:
        "Converts car lanes to protected cycle tracks and green corridors city-wide.",
      enacted: "2020",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Business",
      title: "Late-Night Noise Ordinance",
      description:
        "Restricts amplified music after midnight in residential zones with fines for non-compliance.",
      enacted: "2017",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Heritage",
      title: "View Corridor Protection Rules",
      description:
        "Prohibits high-rise construction in 23 protected visual corridors around historic monuments.",
      enacted: "1977",
      status: "Active",
      color: "#fb923c",
    },
  ],
  dubai: [
    {
      category: "Business",
      title: "Free Zone Corporate Law",
      description:
        "Allows 100% foreign ownership and zero corporate tax within designated free zones.",
      enacted: "1985",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Public Safety",
      title: "Dubai Dress Code Ordinance",
      description:
        "Requires modest dress in public spaces; fines apply for violations in malls and government buildings.",
      enacted: "2012",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Environment",
      title: "Dubai Clean Energy Strategy 2050",
      description:
        "Mandates 75% of energy from clean sources by 2050 with interim solar and nuclear targets.",
      enacted: "2015",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Labor",
      title: "WPS (Wage Protection System)",
      description:
        "Requires employers to pay workers via regulated bank transfers to prevent wage theft.",
      enacted: "2009",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Housing",
      title: "Rental Dispute Settlement Ordinance",
      description:
        "Governs landlord-tenant disputes through the Rental Disputes Center; caps increases at RERA index.",
      enacted: "2008",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Transport",
      title: "Autonomous Vehicles Regulation 2021",
      description:
        "Framework permitting self-driving vehicle trials and sets liability rules for AV incidents.",
      enacted: "2021",
      status: "Active",
      color: "#22d3ee",
    },
  ],
  singapore: [
    {
      category: "Environment",
      title: "Carbon Tax Act",
      description:
        "Uniform S$25/tonne carbon tax on large industrial emitters, rising to S$80 by 2030.",
      enacted: "2019",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Housing",
      title: "HDB (Housing Development Board) Scheme",
      description:
        "Government-subsidised public housing covering ~80% of the resident population.",
      enacted: "1960",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Transport",
      title: "Vehicle Quota System (COE)",
      description:
        "Limits total vehicle population via certificates of entitlement auctioned monthly.",
      enacted: "1990",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Public Safety",
      title: "Zero Tolerance Drug Policy",
      description:
        "Mandatory death penalty for trafficking above threshold quantities.",
      enacted: "1973",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Business",
      title: "Personal Data Protection Act (PDPA)",
      description:
        "Governs collection, use, and disclosure of personal data by organisations.",
      enacted: "2012",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Labor",
      title: "Fair Consideration Framework",
      description:
        "Requires employers to consider Singaporeans fairly before hiring foreign professionals.",
      enacted: "2014",
      status: "Active",
      color: "#fb923c",
    },
  ],
  sydney: [
    {
      category: "Environment",
      title: "Net Zero Emissions by 2035 Strategy",
      description:
        "City of Sydney's commitment to decarbonise council operations and support district renewable energy.",
      enacted: "2021",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Housing",
      title: "Affordable Housing Contributions Scheme",
      description:
        "Requires developers to contribute 3–5% of residential floor space as affordable units.",
      enacted: "2019",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Transport",
      title: "Cycling Infrastructure Policy",
      description:
        "Mandates separated cycleways on all major inner-city streets as part of the cycling action plan.",
      enacted: "2018",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Liquor",
      title: "Sydney Lock-out Laws",
      description:
        "Prohibits entry to licensed venues after 1:30am and last drinks at 3am in the CBD entertainment precinct.",
      enacted: "2014",
      status: "Active",
      color: "#f87171",
    },
    {
      category: "Heritage",
      title: "Heritage Conservation Areas Policy",
      description:
        "Protects streetscapes and built fabric in 47 heritage conservation areas across the city.",
      enacted: "1988",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Business",
      title: "Night-Time Economy Strategy 2030",
      description:
        "Permits businesses to trade 24/7 in designated night-time economy precincts.",
      enacted: "2020",
      status: "Active",
      color: "#fb923c",
    },
  ],
  berlin: [
    {
      category: "Housing",
      title: "Mietendeckel (Rent Cap — overturned)",
      description:
        "Capped rents at 2019 levels; struck down by Federal Constitutional Court in 2021.",
      enacted: "2020",
      status: "Repealed",
      color: "#f87171",
    },
    {
      category: "Environment",
      title: "Berlin Energy Transition Law",
      description:
        "Sets target of 100% renewable electricity for Berlin by 2050 with 5-year milestones.",
      enacted: "2021",
      status: "Active",
      color: "#34d399",
    },
    {
      category: "Transport",
      title: "Mobility Act (Mobilitätsgesetz)",
      description:
        "Germany's first state mobility law, prioritising cycling, pedestrians, and public transit.",
      enacted: "2018",
      status: "Active",
      color: "#60a5fa",
    },
    {
      category: "Public Safety",
      title: "Berlin House Rules Ordinance",
      description:
        "Anti-discrimination provisions prohibiting denial of services based on ethnicity or religion.",
      enacted: "2011",
      status: "Active",
      color: "#fbbf24",
    },
    {
      category: "Housing",
      title: "Zweckentfremdungsverbot (Misuse Prohibition)",
      description:
        "Restricts conversion of residential apartments to tourist accommodation without a permit.",
      enacted: "2014",
      status: "Active",
      color: "#a78bfa",
    },
    {
      category: "Business",
      title: "Berlin Nightlife Protection Ordinance",
      description:
        "Classifies clubs as cultural institutions, shielding them from noise-complaint-based closures.",
      enacted: "2021",
      status: "Active",
      color: "#fb923c",
    },
  ],
};

const DEFAULT_CITY_LAWS: CityLaw[] = [
  {
    category: "Zoning",
    title: "Urban Zoning Ordinance",
    description:
      "Governs land use designations — residential, commercial, industrial — and development parameters.",
    enacted: "2000",
    status: "Active",
    color: "#60a5fa",
  },
  {
    category: "Environment",
    title: "Clean Air Standards",
    description:
      "Sets emission limits for industry and vehicles operating within city limits.",
    enacted: "2010",
    status: "Active",
    color: "#34d399",
  },
  {
    category: "Housing",
    title: "Tenant Protection Act",
    description:
      "Limits eviction grounds and requires 90-day notice for rent increases exceeding 10%.",
    enacted: "2015",
    status: "Active",
    color: "#fbbf24",
  },
  {
    category: "Public Safety",
    title: "Public Order Ordinance",
    description:
      "Regulates gatherings, noise levels, and conduct in public spaces.",
    enacted: "2005",
    status: "Active",
    color: "#f87171",
  },
  {
    category: "Business",
    title: "Business Licensing Framework",
    description:
      "Defines licensing requirements, trading hours, and compliance obligations for commercial operators.",
    enacted: "2008",
    status: "Active",
    color: "#a78bfa",
  },
  {
    category: "Transport",
    title: "Road Safety Regulation",
    description:
      "Establishes speed limits, cycling infrastructure requirements, and pedestrian priority zones.",
    enacted: "2018",
    status: "Active",
    color: "#fb923c",
  },
];

const STATUS_COLORS: Record<string, string> = {
  Active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Proposed: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Repealed: "text-red-400 bg-red-500/10 border-red-500/30",
};

// ─── City Legal Status Grid ───────────────────────────────────────────────
type LegalStatus =
  | "Legal"
  | "Illegal"
  | "Decriminalized"
  | "Restricted"
  | "Varies"
  | "N/A";

interface CityLegalTopic {
  topic: string;
  icon: string;
  status: LegalStatus;
  note: string;
}

const LEGAL_STATUS_BADGE: Record<LegalStatus, string> = {
  Legal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Illegal: "text-red-400 bg-red-500/10 border-red-500/30",
  Decriminalized: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Restricted: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  Varies: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  "N/A": "text-muted-foreground bg-muted border-border",
};

const CITY_LEGAL_STATUS: Record<string, CityLegalTopic[]> = {
  "new-york": [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal for adults 21+ since 2021 (MRTA); licensed dispensaries operating.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Decriminalized",
      note: "NYC decriminalized psilocybin possession in 2023; state-level ban still applies.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Legal",
      note: "Legal 21+; open container prohibited in public spaces.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Restricted",
      note: "Licensed casinos permitted; NYC awarding 3 downstate casino licenses.",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Restricted",
      note: "Strict licensing required; concealed carry permit system under NYSRPA v. Bruen.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Illegal",
      note: "Prostitution illegal; buying sex criminalized since 2021 Nordic-model push.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Legal statewide since 2011; federally guaranteed since Obergefell 2015.",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Legal up to fetal viability (~24 weeks); broader access enshrined in NY Constitution.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Illegal",
      note: "Medical Aid in Dying bills have not passed the NY Legislature as of 2026.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Illegal",
      note: "Banned in parks, beaches, pedestrian plazas, and all indoor public spaces.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Strictly regulated; vendor permits are limited and highly competitive.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Legal",
      note: "Decriminalized in 2022; NYPD no longer tickets pedestrians for crossing mid-block.",
    },
  ],
  tokyo: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Cannabis strictly prohibited under the Cannabis Control Act; penalties include imprisonment.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Illegal",
      note: "Psilocybin and all psychedelics fully prohibited; zero-tolerance enforcement.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Legal",
      note: "Legal 20+; public drinking is culturally accepted in parks during cherry blossom season.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Restricted",
      note: "Pachinko legally a grey zone; integrated resort casino law passed 2018, first opening 2030.",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Illegal",
      note: "Handguns completely banned for civilians; one of the world\'s strictest gun laws.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Restricted",
      note: "Intercourse for payment illegal; non-penetrative acts in 'fashion health' clubs in grey zone.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Restricted",
      note: "Tokyo issues partnership certificates; national constitutional ban remains; Supreme Court ruling pending.",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "Legal up to 22 weeks but requires spousal consent — widely criticised internationally.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Illegal",
      note: "Euthanasia and assisted suicide are illegal; no legislative movement as of 2026.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned in most outdoor public spaces; designated smoking areas mandated near stations.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Requires permit; yatai (food stall) culture tightly regulated by ward offices.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Illegal",
      note: "Technically illegal; crossing against signals is enforced more strictly than in Western cities.",
    },
  ],
  london: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Class B drug; possession carries up to 5 years imprisonment though enforcement varies.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Illegal",
      note: "Psilocybin is Class A; mere possession can result in up to 7 years imprisonment.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Legal",
      note: "Legal 18+; alcohol banned only on the London Underground (since 2008).",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Legal",
      note: "Legal and regulated by the UK Gambling Commission; online and land-based casinos permitted.",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Illegal",
      note: "Handguns banned since 1997 Dunblane massacre; shotguns/rifles require license.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Restricted",
      note: "Selling sex is legal; brothel-keeping, pimping, and kerb crawling are illegal.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Legal in England and Wales since 2014.",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Legal up to 24 weeks under the Abortion Act 1967; at-home medical abortion permitted.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Legal",
      note: "Terminally Ill Adults (End of Life) Act 2025 passed; implementation in progress.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned in enclosed public spaces and workplaces since 2007; legal outdoors.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Licensed by local borough councils; street markets like Borough Market are tightly managed.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Legal",
      note: "Not a legal offence in the UK; pedestrians may cross anywhere.",
    },
  ],
  paris: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Possession of any amount is technically illegal; enforcement often results in on-the-spot fines.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Illegal",
      note: "All psychedelics prohibited as stupéfiants; enforcement focuses on trafficking.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Legal",
      note: "Legal 18+; public drinking is culturally normal but prohibited near schools and mosques.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Restricted",
      note: "Legal in licensed casinos (Casino de Paris); online gambling regulated by ANJ.",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Illegal",
      note: "Civilian handgun ownership banned; rifles/shotguns require permit and proof of reason.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Restricted",
      note: "Selling sex decriminalized; buying sex criminalized under 2016 Nordic-model law.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Legal nationwide since 2013 (Loi Taubira).",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Legal up to 14 weeks; enshrined in the French Constitution since March 2024.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Restricted",
      note: "Deep sedation until death permitted for terminal cases (2016 Claeys-Leonetti law); active euthanasia bill debated 2024.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned in enclosed public spaces; Paris expanded outdoor bans to parks and playgrounds.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Unauthorized street vending is illegal; heavily policed around tourist sites.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Illegal",
      note: "Technically illegal (R412-34 Code de la Route); fines of €4 rarely enforced.",
    },
  ],
  dubai: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Zero tolerance — any amount can result in 4+ years imprisonment and deportation.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Illegal",
      note: "All psychedelics strictly banned; severe penalties including life imprisonment.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Restricted",
      note: "Legal for non-Muslims in licensed venues and with a personal licence; public intoxication illegal.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Illegal",
      note: "All forms of gambling prohibited under UAE law; Dubai plans a regulated casino resort (2027).",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Illegal",
      note: "Civilian firearm ownership banned; military and police carry strictly controlled.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Illegal",
      note: "Illegal under Islamic law; strict enforcement with imprisonment and deportation.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Illegal",
      note: "Homosexual acts punishable under UAE Penal Code with up to 10 years imprisonment.",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Illegal except to save the mother\'s life or in cases of severe fetal abnormality.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Illegal",
      note: "Prohibited; no legislation exists permitting any form of assisted dying.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned in government buildings, malls, public transport, and most indoor spaces.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Illegal",
      note: "Unauthorized vending prohibited; violators face fines and deportation for expatriates.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Illegal",
      note: "Strictly enforced with fines up to AED 400; pedestrian bridges required where provided.",
    },
  ],
  singapore: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Possession of >500g carries mandatory death penalty; small amounts up to 10 years.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Illegal",
      note: "All psychedelics are Class A; trafficking carries the death penalty.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Restricted",
      note: "Legal 18+; prohibited in public between 10:30pm–7am under the Liquor Control Act.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Restricted",
      note: "Legal in licensed integrated resorts (Marina Bay Sands, Sentosa); online gambling banned.",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Illegal",
      note: "All civilian gun ownership banned; even imitation firearms are illegal.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Restricted",
      note: "Selling sex legal in licensed Geylang red-light district; soliciting and pimping illegal.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Illegal",
      note: "Same-sex marriage prohibited; Section 377A repealed 2023 but marriage rights not extended.",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Legal on request up to 24 weeks of pregnancy under the Termination of Pregnancy Act.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Illegal",
      note: "Euthanasia and assisted suicide are illegal; palliative care advanced-directives are legal.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned in almost all public areas; violators face fines up to SGD 1,000.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Only permitted in licensed hawker centres; unauthorized vending results in fines.",
    },
    {
      topic: "Chewing Gum",
      icon: "🍬",
      status: "Restricted",
      note: "Sale banned since 1992; medical/dental gum allowed with prescription.",
    },
  ],
  sydney: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Decriminalized",
      note: "Personal use decriminalized in NSW (caution scheme); medical cannabis legal since 2016.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Restricted",
      note: "TGA approved psilocybin for treatment-resistant depression from July 2023 (authorised prescribers only).",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Legal",
      note: "Legal 18+; 'dry zones' in some parks and CBD areas restrict public drinking.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Restricted",
      note: "Legal in licensed venues; The Star Casino operates in Sydney; pokies (slots) widespread and controversial.",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Restricted",
      note: "Strictly licensed; handguns for sport only; no self-defense justification post-1996 Port Arthur reforms.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Legal",
      note: "NSW fully decriminalized sex work in 1995; one of the most progressive frameworks globally.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Legal nationally since December 2017 (Marriage Amendment Act).",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Legal on request up to 22 weeks in NSW; after 22 weeks with two-doctor approval.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Legal",
      note: "Legal in NSW under the Voluntary Assisted Dying Act 2021; commenced November 2023.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned within 4m of building entrances, outdoor dining, public transport stops, and sports venues.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Requires council approval; regulated by City of Sydney\'s outdoor dining and trading policies.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Illegal",
      note: "Fines up to AUD 79 for crossing against signals; however enforcement is minimal in practice.",
    },
  ],
  berlin: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal for adults 18+ since April 2024 (CanG); up to 25g in public, 50g at home.",
    },
    {
      topic: "Psychedelics",
      icon: "🍄",
      status: "Illegal",
      note: "Psilocybin remains illegal (BtMG); decriminalization debate active in Bundestag.",
    },
    {
      topic: "Alcohol",
      icon: "🍺",
      status: "Legal",
      note: "Legal 18+ (spirits); 16+ for beer and wine; public drinking is broadly legal.",
    },
    {
      topic: "Gambling",
      icon: "🎰",
      status: "Restricted",
      note: "Licensed casinos legal; online gambling regulated by new Interstate Gambling Treaty (GlüStV 2021).",
    },
    {
      topic: "Firearms",
      icon: "🔫",
      status: "Restricted",
      note: "Strict licensing under Waffengesetz; sport shooting and hunting permitted; handguns heavily restricted.",
    },
    {
      topic: "Sex Work",
      icon: "💼",
      status: "Legal",
      note: "Fully legal and regulated since the Prostitution Act 2002; sex workers can pay into social security.",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Legal nationally since October 2017 (Ehe für alle).",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "Legal up to 12 weeks after mandatory counselling (§218 StGB); technically still 'illegal but not punishable'.",
    },
    {
      topic: "Assisted Dying",
      icon: "🕊️",
      status: "Legal",
      note: "Federal Court struck down ban in 2020; assisted suicide organisations now operate legally.",
    },
    {
      topic: "Public Smoking",
      icon: "🚬",
      status: "Restricted",
      note: "Banned in restaurants, bars (unless designated), and public transport; outdoor smoking legal.",
    },
    {
      topic: "Street Vending",
      icon: "🛒",
      status: "Restricted",
      note: "Requires Gewerbeerlaubnis (trade permit); markets like Mauerpark flea market operate under permits.",
    },
    {
      topic: "Jaywalking",
      icon: "🚶",
      status: "Illegal",
      note: "Fines of €5–10 for crossing red lights as pedestrian; enforcement is relaxed but real.",
    },
  ],
};

const DEFAULT_CITY_LEGAL: CityLegalTopic[] = [
  {
    topic: "Recreational Cannabis",
    icon: "🌿",
    status: "Varies",
    note: "Legal status varies by national and municipal law.",
  },
  {
    topic: "Alcohol",
    icon: "🍺",
    status: "Restricted",
    note: "Subject to local licensing laws and minimum age requirements.",
  },
  {
    topic: "Gambling",
    icon: "🎰",
    status: "Restricted",
    note: "Regulated by national gambling authority.",
  },
  {
    topic: "Firearms",
    icon: "🔫",
    status: "Restricted",
    note: "Subject to national firearms licensing laws.",
  },
  {
    topic: "Sex Work",
    icon: "💼",
    status: "Varies",
    note: "Legal status determined by national law.",
  },
  {
    topic: "Same-Sex Marriage",
    icon: "🏳️‍🌈",
    status: "Varies",
    note: "Legal status determined by national law.",
  },
  {
    topic: "Abortion",
    icon: "⚕️",
    status: "Varies",
    note: "Regulated by national health law.",
  },
  {
    topic: "Public Smoking",
    icon: "🚬",
    status: "Restricted",
    note: "Typically banned in enclosed public spaces.",
  },
];

function CityLegalStatusGrid({ city }: { city: City }) {
  const topics = CITY_LEGAL_STATUS[city.id] ?? DEFAULT_CITY_LEGAL;
  return (
    <div className="modal-tile rounded-xl border border-border/60 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚖️</span>
        <h3 className="text-sm font-bold font-sans text-foreground">
          What&#39;s Legal &amp; Illegal in {city.name}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {topics.map((t) => (
          <div
            key={t.topic}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/40 border border-border/40 hover:border-border/70 transition-colors"
          >
            <span className="text-base shrink-0 mt-0.5">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-xs font-semibold font-sans text-foreground leading-tight">
                  {t.topic}
                </span>
                <span
                  className={`text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${LEGAL_STATUS_BADGE[t.status]}`}
                >
                  {t.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-sans leading-relaxed">
                {t.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityLawsTab({ city }: { city: City }) {
  const laws = CITY_LAWS[city.id] ?? DEFAULT_CITY_LAWS;
  const categories = Array.from(new Set(laws.map((l) => l.category)));

  return (
    <div className="space-y-4">
      {/* Legal Status Grid */}
      <CityLegalStatusGrid city={city} />

      {/* Header strip */}
      <div className="flex items-center gap-3 p-4 modal-tile rounded-xl border border-border/60">
        <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
          <Scales size={16} weight="fill" className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-sans text-foreground">
            {city.name} · Local Laws &amp; Ordinances
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            {city.country} · {laws.length} laws across {categories.length}{" "}
            categories
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {laws.filter((l) => l.status === "Active").length} active
        </span>
      </div>

      <SourceLink sources={SRC_CITY_LAWS} className="-mt-1 mb-1" />

      {/* Law cards */}
      <div className="space-y-2">
        {laws.map((law, i) => (
          <div
            key={i}
            className="p-4 modal-tile rounded-xl border border-border/60 hover:border-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: law.color,
                    borderColor: law.color + "44",
                    backgroundColor: law.color + "18",
                  }}
                >
                  {law.category}
                </span>
                <span
                  className={`text-[10px] font-sans px-2 py-0.5 rounded-full border ${STATUS_COLORS[law.status]}`}
                >
                  {law.status}
                </span>
                {law.enacted && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Est. {law.enacted}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs font-semibold font-sans text-foreground mb-1">
              {law.title}
            </p>
            <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
              {law.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CITY_PHOTOS: Record<string, string[]> = {
  "new-york": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&q=80",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
    "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=80",
    "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=600&q=80",
    "https://images.unsplash.com/photo-1543716091-a840c05249ec?w=600&q=80",
  ],
  tokyo: [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    "https://images.unsplash.com/photo-1570521462033-3015e76e7432?w=600&q=80",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80",
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80",
  ],
  london: [
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
    "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80",
    "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=600&q=80",
    "https://images.unsplash.com/photo-1426684700239-c7b548f2cd99?w=600&q=80",
    "https://images.unsplash.com/photo-1543536448-1e76fc2795bf?w=600&q=80",
  ],
  paris: [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80",
    "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&q=80",
    "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=600&q=80",
    "https://images.unsplash.com/photo-1515266591878-f93e32bc5937?w=600&q=80",
    "https://images.unsplash.com/photo-1508050919630-b135583b29ab?w=600&q=80",
  ],
  dubai: [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
    "https://images.unsplash.com/photo-1547451742-56f0c1c63b33?w=600&q=80",
    "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&q=80",
  ],
  singapore: [
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
    "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80",
    "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=600&q=80",
    "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
    "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=600&q=80",
    "https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80",
  ],
  sydney: [
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80",
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=600&q=80",
    "https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=600&q=80",
    "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&q=80",
  ],
  berlin: [
    "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=80",
    "https://images.unsplash.com/photo-1582719202047-76d3432ee323?w=600&q=80",
    "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=600&q=80",
    "https://images.unsplash.com/photo-1566404791232-af9fe3ae2188?w=600&q=80",
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=600&q=80",
    "https://images.unsplash.com/photo-1549893072-4bc678117f45?w=600&q=80",
  ],
};

const REGION_CITY_PHOTOS: Record<string, string[]> = {
  "North America": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
    "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=80",
    "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&q=80",
  ],
  "Western Europe": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80",
    "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80",
    "https://images.unsplash.com/photo-1555992457-b8fefdd09069?w=600&q=80",
  ],
  "East Asia": [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    "https://images.unsplash.com/photo-1570521462033-3015e76e7432?w=600&q=80",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80",
    "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=600&q=80",
    "https://images.unsplash.com/photo-1549092979-765a26b0ac7a?w=600&q=80",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80",
  ],
  "Southeast Asia": [
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
    "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=600&q=80",
    "https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80",
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80",
    "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600&q=80",
    "https://images.unsplash.com/photo-1519625150589-7d6aaafe33a0?w=600&q=80",
  ],
  "Middle East": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
    "https://images.unsplash.com/photo-1547451742-56f0c1c63b33?w=600&q=80",
    "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80",
    "https://images.unsplash.com/photo-1538766017398-415434a31a5b?w=600&q=80",
  ],
  Oceania: [
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80",
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=600&q=80",
    "https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=600&q=80",
    "https://images.unsplash.com/photo-1589330979470-3595ac045ab0?w=600&q=80",
  ],
};

function getCityPhotos(city: City): string[] {
  return (
    CITY_PHOTOS[city.id] ??
    REGION_CITY_PHOTOS[city.region] ??
    REGION_CITY_PHOTOS["North America"]
  );
}

function CityPhotosGrid({ city }: { city: City }) {
  const photos = getCityPhotos(city);
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div>
      {/* Flag header strip */}
      <div className="relative rounded-xl overflow-hidden mb-4 h-20 flex items-center px-5 gap-4">
        <img
          src={`https://flagcdn.com/w320/${city.countryCode?.toLowerCase() ?? "un"}.png`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-card/60 to-card/40" />
        <img
          src={`https://flagcdn.com/w80/${city.countryCode?.toLowerCase() ?? "un"}.png`}
          alt={`${city.country} flag`}
          className="relative w-12 h-8 object-cover rounded shadow-md border border-white/20 shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="relative">
          <p className="font-bold text-foreground font-sans text-sm leading-tight">
            {city.name}
          </p>
          <p className="text-xs text-muted-foreground font-sans">
            {city.country} · {city.region}
          </p>
        </div>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <img
              src={src}
              alt={`${city.name} photo ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox - 1 + photos.length) % photos.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full modal-glass border text-foreground hover:text-white transition-colors z-10"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <div
            className="relative modal-glass border rounded-2xl overflow-hidden shadow-2xl animate-fade-in max-w-[90vw] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightbox]}
              alt={`${city.name} photo ${lightbox + 1}`}
              className="max-w-[85vw] max-h-[80vh] object-contain"
            />
            <div className="flex items-center justify-between px-4 py-2.5 modal-tile border-t border-border/40 shrink-0">
              <span className="text-xs text-muted-foreground font-sans">
                {city.name}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {lightbox + 1} / {photos.length}
              </span>
              <button
                onClick={() => setLightbox(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox + 1) % photos.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full modal-glass border text-foreground hover:text-white transition-colors z-10"
          >
            <ArrowLeft size={20} weight="bold" className="rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Urban Stats Panel ─────────────────────────────────────────────────────
function ScoreBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 bg-background rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
      />
    </div>
  );
}

function UrbanStatSection({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-tile rounded-xl border border-border/60 p-4">
      <div
        className={`flex items-center gap-2 mb-3 pb-2 border-b border-border/40`}
      >
        <span className={color}>{icon}</span>
        <h4 className="text-xs font-bold font-sans text-foreground uppercase tracking-wide">
          {title}
        </h4>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  bar,
  barColor = "bg-secondary",
  barMax = 100,
  sub,
}: {
  label: string;
  value: string;
  bar?: number;
  barColor?: string;
  barMax?: number;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground font-sans">
          {label}
        </span>
        <div className="text-right">
          <span className="text-xs font-bold font-mono text-foreground">
            {value}
          </span>
          {sub && (
            <span className="text-[10px] text-muted-foreground font-sans ml-1">
              {sub}
            </span>
          )}
        </div>
      </div>
      {bar !== undefined && (
        <ScoreBar value={bar} max={barMax} color={barColor} />
      )}
    </div>
  );
}

function CityUrbanStatsPanel({ city }: { city: City }) {
  const s = CITY_URBAN_STATS[city.id] ?? DEFAULT_URBAN_STATS;

  const rentStressColor =
    s.rentToIncomeRatio > 55
      ? "bg-destructive"
      : s.rentToIncomeRatio > 40
        ? "bg-warning"
        : "bg-success";
  const giniColor =
    s.giniCoefficient > 50
      ? "bg-destructive"
      : s.giniCoefficient > 38
        ? "bg-warning"
        : "bg-success";
  const unempColor =
    s.unemploymentRate > 10
      ? "bg-destructive"
      : s.unemploymentRate > 6
        ? "bg-warning"
        : "bg-success";
  const aqiColor =
    city.airQualityIndex < 30
      ? "bg-success"
      : city.airQualityIndex < 60
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <ChartBar size={15} weight="fill" className="text-secondary" />
        <h3 className="text-sm font-bold font-sans text-foreground">
          Urban Statistics
        </h3>
        <span className="ml-auto text-[10px] text-muted-foreground font-sans bg-muted px-2 py-0.5 rounded-full">
          Most inquired
        </span>
      </div>

      {/* Housing */}
      <UrbanStatSection
        icon={<House size={14} weight="fill" />}
        title="Housing & Affordability"
        color="text-blue-400"
      >
        <StatRow
          label="Avg Rent · 1BR City Center"
          value={`$${s.avgRentUSD1BR.toLocaleString()}/mo`}
        />
        <StatRow
          label="Avg Buy Price / m²"
          value={`$${s.avgHomePriceUSDm2.toLocaleString()}`}
        />
        <StatRow
          label="Rent-to-Income Ratio"
          value={`${s.rentToIncomeRatio}%`}
          sub={
            s.rentToIncomeRatio > 55
              ? "Severely unaffordable"
              : s.rentToIncomeRatio > 40
                ? "Unaffordable"
                : "Manageable"
          }
          bar={s.rentToIncomeRatio}
          barMax={80}
          barColor={rentStressColor}
        />
        <StatRow
          label="Avg Monthly Net Salary"
          value={`$${s.avgSalaryUSD.toLocaleString()}`}
        />
      </UrbanStatSection>

      {/* Transport */}
      <UrbanStatSection
        icon={<Train size={14} weight="fill" />}
        title="Transport & Mobility"
        color="text-purple-400"
      >
        <StatRow
          label="Public Transit Quality"
          value={`${s.transitScore}/100`}
          bar={s.transitScore}
          barColor="bg-purple-500"
        />
        <StatRow
          label="Cycling Infrastructure"
          value={`${s.bikeInfraScore}/100`}
          bar={s.bikeInfraScore}
          barColor="bg-purple-400"
        />
        <StatRow
          label="Avg Daily Commute"
          value={`${s.avgCommuteMin} min`}
          sub="one-way"
        />
      </UrbanStatSection>

      {/* Healthcare */}
      <UrbanStatSection
        icon={<FirstAid size={14} weight="fill" />}
        title="Healthcare"
        color="text-emerald-400"
      >
        <StatRow
          label="Healthcare Quality Index"
          value={`${s.healthcareIndex}/100`}
          bar={s.healthcareIndex}
          barColor="bg-emerald-500"
        />
        <StatRow
          label="Hospital Beds per 1,000"
          value={s.hospitalBedsPerK.toFixed(1)}
          bar={s.hospitalBedsPerK}
          barMax={15}
          barColor="bg-emerald-400"
        />
      </UrbanStatSection>

      {/* Education */}
      <UrbanStatSection
        icon={<GraduationCap size={14} weight="fill" />}
        title="Education"
        color="text-yellow-400"
      >
        <StatRow
          label="Literacy Rate"
          value={`${s.literacyRate}%`}
          bar={s.literacyRate}
          barMax={100}
          barColor="bg-yellow-500"
        />
        <StatRow
          label="Top University (QS Rank)"
          value={
            s.topUniversityRank ? `#${s.topUniversityRank}` : "Not in top 500"
          }
          sub={
            s.topUniversityRank && s.topUniversityRank <= 50
              ? "World-class"
              : s.topUniversityRank && s.topUniversityRank <= 200
                ? "Strong"
                : ""
          }
        />
        <StatRow label="Universities in City" value={`${city.universities}`} />
      </UrbanStatSection>

      {/* Digital & Environment */}
      <UrbanStatSection
        icon={<WifiHigh size={14} weight="fill" />}
        title="Digital & Environment"
        color="text-cyan-400"
      >
        <StatRow
          label="Avg Broadband Speed"
          value={`${s.avgInternetMbps} Mbps`}
          bar={s.avgInternetMbps}
          barMax={400}
          barColor="bg-cyan-500"
        />
        <StatRow
          label="Green Space Coverage"
          value={`${s.greenSpacePct}%`}
          bar={s.greenSpacePct}
          barMax={70}
          barColor="bg-green-500"
        />
        <StatRow
          label="Municipal Recycling Rate"
          value={`${s.recyclingRatePct}%`}
          bar={s.recyclingRatePct}
          barMax={100}
          barColor="bg-teal-500"
        />
        <StatRow
          label="Air Quality Index (AQI)"
          value={`${city.airQualityIndex}`}
          sub={
            city.airQualityIndex < 30
              ? "Good"
              : city.airQualityIndex < 60
                ? "Moderate"
                : "Poor"
          }
          bar={city.airQualityIndex}
          barMax={100}
          barColor={aqiColor}
        />
      </UrbanStatSection>

      {/* Economy & Inequality */}
      <UrbanStatSection
        icon={<ChartBar size={14} weight="fill" />}
        title="Economy & Inequality"
        color="text-orange-400"
      >
        <StatRow
          label="Unemployment Rate"
          value={`${s.unemploymentRate}%`}
          bar={s.unemploymentRate}
          barMax={30}
          barColor={unempColor}
        />
        <StatRow
          label="Gini Coefficient"
          value={`${s.giniCoefficient}`}
          sub={
            s.giniCoefficient > 50
              ? "Very unequal"
              : s.giniCoefficient > 38
                ? "Moderate"
                : "Relatively equal"
          }
          bar={s.giniCoefficient}
          barMax={70}
          barColor={giniColor}
        />
        <StatRow
          label="GDP Per Capita"
          value={`$${city.gdpPerCapita.toLocaleString()}`}
        />
        <StatRow label="Fortune 500 HQs" value={`${city.fortuneHQs}`} />
      </UrbanStatSection>

      {/* Startup Ecosystem */}
      <UrbanStatSection
        icon={<Rocket size={14} weight="fill" />}
        title="Startup Ecosystem"
        color="text-pink-400"
      >
        <StatRow
          label="Ecosystem Score"
          value={`${s.startupScore}/100`}
          bar={s.startupScore}
          barColor="bg-pink-500"
        />
        <StatRow
          label="Unicorn Companies"
          value={`${s.unicorns}`}
          sub="HQ'd in city"
        />
        <StatRow label="Tech Hubs / Incubators" value={`${city.techHubs}`} />
      </UrbanStatSection>
    </div>
  );
}

function CityModal({ city, onClose }: { city: City; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "laws">(
    "overview",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const { openNote } = useNotes();

  useEffect(() => {
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

  const regionColor =
    regionColors[city.region] ?? "text-muted-foreground border-border bg-muted";
  const regionBg =
    regionColor.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-muted";
  const regionText =
    regionColor.split(" ").find((c) => c.startsWith("text-")) ??
    "text-muted-foreground";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 text-xs font-mono shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((e: any) => (
            <p key={e.name} style={{ color: e.color }}>
              {e.name}:{" "}
              {typeof e.value === "number" && e.value > 100000
                ? `${(e.value / 1e6).toFixed(2)}M`
                : e.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${isExpanded ? "max-w-full max-h-full m-0" : "max-w-2xl max-h-[90vh]"}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                {city.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                  <MapPin size={12} /> {city.country}
                </span>
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-sans ${regionColors[city.region] ?? "text-muted-foreground border-border bg-muted"}`}
                >
                  {city.region}
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  Tourism #{city.tourismRankGlobal} globally
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  openNote({ entityName: city.name, entityType: "City" })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors cursor-pointer"
                aria-label="Take note about this city"
              >
                <NotePencil size={13} weight="fill" />
                Take Note
              </button>
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label={
                  isExpanded ? "Collapse modal" : "Expand modal to full screen"
                }
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                {isExpanded ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M5 1H1v4M11 1h4v4M5 15H1v-4M11 15h4v-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 mb-5">
            {(
              [
                {
                  key: "overview",
                  label: "Overview",
                  icon: <ListBullets size={14} />,
                },
                { key: "map", label: "Map", icon: <MapTrifold size={14} /> },
                { key: "laws", label: "Laws", icon: <Scales size={14} /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "City Population",
                    value: `${(city.population / 1e6).toFixed(1)}M`,
                  },
                  {
                    label: "Metro Area",
                    value: `${(city.metroPopulation / 1e6).toFixed(1)}M`,
                  },
                  { label: "GDP", value: `$${city.gdpBillions}B` },
                  {
                    label: "GDP Per Capita",
                    value: `$${city.gdpPerCapita.toLocaleString()}`,
                  },
                  {
                    label: "Area",
                    value: `${city.areaKm2.toLocaleString()} km²`,
                  },
                  {
                    label: "Density",
                    value: `${city.populationDensity.toLocaleString()}/km²`,
                  },
                  { label: "Avg Temp", value: `${city.avgTemperatureC}°C` },
                  { label: "Fortune HQs", value: `${city.fortuneHQs}` },
                  { label: "Universities", value: `${city.universities}` },
                ].map((s) => (
                  <div key={s.label} className="modal-tile rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-sans">
                      {s.label}
                    </p>
                    <p className="text-base font-bold font-mono text-foreground">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              <SourceLink sources={SRC_CITIES} className="mb-1" />

              {/* City Indices */}
              <div className="modal-tile rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-2">
                  City Indices
                </h3>
                <IndexBar
                  label="Cost of Living Index"
                  value={city.costOfLivingIndex}
                  color="text-warning"
                />
                <IndexBar
                  label="Crime Index"
                  value={city.crimeIndex}
                  color="text-destructive"
                />
                <IndexBar
                  label="Safety Index"
                  value={city.safetyIndex}
                  color="text-success"
                />
                <IndexBar
                  label="Air Quality Index (AQI)"
                  value={city.airQualityIndex}
                  color="text-secondary"
                />
              </div>

              <SourceLink sources={SRC_CITIES} className="mb-1" />

              {/* Languages, Landmarks, Religions */}
              {(city.languages?.length ||
                city.landmarks?.length ||
                city.religions?.length) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {city.languages?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                        Languages Spoken
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {city.languages.map((l) => (
                          <span
                            key={l}
                            className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {city.landmarks?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                        Top Landmarks
                      </p>
                      <ul className="space-y-1">
                        {city.landmarks.map((lm) => (
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
                  ) : null}
                  {city.religions?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                        Religions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {city.religions.map((r) => (
                          <span
                            key={r}
                            className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Urban Statistics */}
              <CityUrbanStatsPanel city={city} />

              {/* Population Trend */}
              <div className="modal-tile rounded-lg p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">
                  Population Trend
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={city.trends}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id={`cityModalGrad-${city.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(200,85%,50%)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(200,85%,50%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222,30%,25%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{
                          fill: "hsl(0,0%,60%)",
                          fontSize: 10,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(0,0%,60%)",
                          fontSize: 10,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                        tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="population"
                        name="Population"
                        stroke="hsl(200,85%,50%)"
                        strokeWidth={2}
                        fill={`url(#cityModalGrad-${city.id})`}
                        dot={false}
                        isAnimationActive
                        animationDuration={600}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <div className="space-y-4">
              {/* Region color info strip */}
              <div
                className={`rounded-xl p-4 flex items-center gap-4 border ${regionBg} border-current/20`}
              >
                <div>
                  <p
                    className={`text-xs font-semibold font-sans uppercase tracking-wide ${regionText}`}
                  >
                    {city.region}
                  </p>
                  <p className="text-foreground font-bold font-sans text-lg leading-tight">
                    {city.name}
                  </p>
                  <p className="text-muted-foreground text-xs font-sans">
                    {city.country}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground font-sans">
                    Population
                  </p>
                  <p className={`font-mono font-bold text-sm ${regionText}`}>
                    {(city.population / 1e6).toFixed(1)}M city
                  </p>
                  <p className={`font-mono text-xs ${regionText} opacity-80`}>
                    {(city.metroPopulation / 1e6).toFixed(1)}M metro
                  </p>
                </div>
              </div>

              {/* Google Maps embed */}
              <div
                className="rounded-xl overflow-hidden border border-border"
                style={{ height: 320 }}
              >
                <iframe
                  title={`Map of ${city.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(city.name + ", " + city.country)}&z=11&output=embed`}
                />
              </div>

              {/* Location facts grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Area",
                    value: `${city.areaKm2.toLocaleString()} km²`,
                  },
                  {
                    label: "Pop. Density",
                    value: `${city.populationDensity.toLocaleString()}/km²`,
                  },
                  { label: "Avg Temp", value: `${city.avgTemperatureC}°C` },
                  {
                    label: "Tourism Rank",
                    value: `#${city.tourismRankGlobal} global`,
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="modal-tile rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground font-sans">
                      {f.label}
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Laws Tab */}
          {activeTab === "laws" && <CityLawsTab city={city} />}
        </div>
      </div>
    </div>
  );
}

function exportCitiesToCSV(cities: City[]) {
  const headers = [
    "Name",
    "Country",
    "Region",
    "Population",
    "Metro Population",
    "GDP (B USD)",
    "GDP Per Capita",
    "Area km2",
    "Density /km2",
    "Cost of Living Index",
    "Crime Index",
    "Safety Index",
    "Air Quality Index",
    "Tourism Rank",
    "Fortune HQs",
    "Universities",
    "Avg Temp C",
  ];
  const rows = cities.map((c) => [
    c.name,
    c.country,
    c.region,
    c.population,
    c.metroPopulation,
    c.gdpBillions,
    c.gdpPerCapita,
    c.areaKm2,
    c.populationDensity,
    c.costOfLivingIndex,
    c.crimeIndex,
    c.safetyIndex,
    c.airQualityIndex,
    c.tourismRankGlobal,
    c.fortuneHQs,
    c.universities,
    c.avgTemperatureC,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cities_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CitiesPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdpBillions" | "population" | "safetyIndex" | "costOfLivingIndex"
  >("gdpBillions");
  const [modalCity, setModalCity] = useState<City | null>(null);

  // Deep-link: open entity from search bar via ?open=<id>
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId) {
      const found = citiesData.find((c) => c.id === openId);
      if (found) setModalCity(found);
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const allRegions = [
    "All",
    ...Array.from(new Set(citiesData.map((c) => c.region))).sort(),
  ];

  const filtered = citiesData
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase());
      const matchRegion = regionFilter === "All" || c.region === regionFilter;
      return matchSearch && matchRegion;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <Buildings size={26} weight="fill" className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Global Cities
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              {citiesData.length} world cities — urban demographics, cost of
              living, safety &amp; economic data
            </p>
          </div>
        </div>

        {/* CSV Export */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => exportCitiesToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-sans cursor-pointer"
            title="Export visible cities to CSV"
          >
            <DownloadSimple size={13} weight="bold" />
            Export CSV
          </button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Cities Tracked",
              value: `${citiesData.length} Cities`,
              color: "text-secondary",
            },
            {
              label: "Largest Metro",
              value: "Tokyo 37M",
              color: "text-warning",
            },
            {
              label: "Safest City",
              value: "Dubai (83)",
              color: "text-success",
            },
            {
              label: "Highest GDP",
              value: "NYC $1.77T",
              color: "text-secondary",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className={`text-base font-bold font-mono ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Unified Search + Filter Bar */}
        <div className="search-sticky sticky top-16 z-30 flex flex-col border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              size={16}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search cities or countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {allRegions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  regionFilter === r
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {r}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdpBillions">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="safetyIndex">Sort: Safety</option>
              <option value="costOfLivingIndex">Sort: Cost of Living</option>
            </select>
          </div>
        </div>

        {/* ── Upcoming to Watch ── */}
        <div className="mb-6 bg-card border border-border rounded-2xl p-5">
          <div>
            <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
              🔥 Upcoming to Watch
            </p>
            <div className="flex flex-wrap gap-2">
              {getUpcoming("cities").map((e) => (
                <span
                  key={e.id}
                  className={`text-[10px] font-sans px-2.5 py-1 rounded-full border ${e.className}`}
                >
                  {e.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {modalCity && (
          <CityModal city={modalCity} onClose={() => setModalCity(null)} />
        )}

        {/* City Cards — 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-fr">
          {filtered.map((city) => (
            <article
              key={city.id}
              onClick={() => setModalCity(city)}
              className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 flex flex-col h-full"
            >
              {/* Card header with country flag background */}
              <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                {/* Flag background */}
                <img
                  src={`https://flagcdn.com/w320/${city.countryCode?.toLowerCase() ?? "un"}.png`}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 select-none pointer-events-none"
                />
                {/* Gradient overlay */}
                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <img
                      src={`https://flagcdn.com/w80/${city.countryCode?.toLowerCase() ?? "un"}.png`}
                      alt={`${city.country} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.onerror = null;
                        t.style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold font-sans text-foreground text-sm">
                      {city.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {city.country}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    City Pop.
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {(city.population / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">GDP</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    ${city.gdpBillions}B
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Cost of Living
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {city.costOfLivingIndex}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Safety Index
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${city.safetyIndex >= 60 ? "text-success" : city.safetyIndex >= 40 ? "text-warning" : "text-destructive"}`}
                  >
                    {city.safetyIndex}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-sans">
                    Safety Score
                  </span>
                  <span className="font-mono text-foreground">
                    {city.safetyIndex}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${city.safetyIndex >= 60 ? "bg-success" : city.safetyIndex >= 40 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${city.safetyIndex}%` }}
                  />
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground font-sans text-sm">
                No cities match your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
