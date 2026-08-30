import React, { useState, useEffect } from "react";
import {
  Buildings,
  Users,
  CurrencyDollar,
  TrendDown,
  MagnifyingGlass,
  MapPin,
  Flag,
  Timer,
  Factory,
  ChartBar,
  UserCircle,
  Gavel,
  UsersThree,
  MapTrifold,
  ListBullets,
  Scales,
  NotePencil,
  DownloadSimple,
} from "@phosphor-icons/react";
// Bookmark feature removed
import { useNotes } from "../contexts/NotesContext";
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
  Legend,
} from "recharts";
import { usStatesData, type USState } from "../data/statesData";
import { getStateSocialStats } from "../data/socialStatsData";
import { getUpcoming } from "../data/upcomingToWatch";
import { useLiveData } from "../hooks/useLiveData";
import { SourceLink } from "../components/SourceLink";

// ─── Transportation Statistics per state ─────────────────────────────────
interface StateTransportData {
  carOwnershipPct: number; // % households with at least 1 vehicle
  avgCommuteMin: number; // average commute time in minutes
  publicTransitUsePct: number; // % of workers using public transit
  walkBikePct: number; // % walking or cycling to work
  interstatesMiles: number; // total interstate highway miles
  bridgesTotal: number; // total bridges (thousands, approx)
  airportsCommercial: number; // commercial service airports
  trafficDeathsPer100k: number; // traffic fatalities per 100k residents
}

const STATE_TRANSPORT: Record<string, StateTransportData> = {
  al: {
    carOwnershipPct: 93,
    avgCommuteMin: 25,
    publicTransitUsePct: 1,
    walkBikePct: 2,
    interstatesMiles: 906,
    bridgesTotal: 16,
    airportsCommercial: 8,
    trafficDeathsPer100k: 17.4,
  },
  ak: {
    carOwnershipPct: 90,
    avgCommuteMin: 20,
    publicTransitUsePct: 3,
    walkBikePct: 6,
    interstatesMiles: 0,
    bridgesTotal: 2,
    airportsCommercial: 127,
    trafficDeathsPer100k: 9.8,
  },
  az: {
    carOwnershipPct: 92,
    avgCommuteMin: 27,
    publicTransitUsePct: 2,
    walkBikePct: 2,
    interstatesMiles: 1168,
    bridgesTotal: 8,
    airportsCommercial: 10,
    trafficDeathsPer100k: 15.1,
  },
  ar: {
    carOwnershipPct: 93,
    avgCommuteMin: 22,
    publicTransitUsePct: 1,
    walkBikePct: 1,
    interstatesMiles: 638,
    bridgesTotal: 12,
    airportsCommercial: 5,
    trafficDeathsPer100k: 18.9,
  },
  ca: {
    carOwnershipPct: 88,
    avgCommuteMin: 32,
    publicTransitUsePct: 5,
    walkBikePct: 4,
    interstatesMiles: 2456,
    bridgesTotal: 25,
    airportsCommercial: 30,
    trafficDeathsPer100k: 10.9,
  },
  co: {
    carOwnershipPct: 91,
    avgCommuteMin: 26,
    publicTransitUsePct: 3,
    walkBikePct: 4,
    interstatesMiles: 952,
    bridgesTotal: 8,
    airportsCommercial: 12,
    trafficDeathsPer100k: 12.4,
  },
  ct: {
    carOwnershipPct: 90,
    avgCommuteMin: 27,
    publicTransitUsePct: 5,
    walkBikePct: 3,
    interstatesMiles: 346,
    bridgesTotal: 4,
    airportsCommercial: 5,
    trafficDeathsPer100k: 7.2,
  },
  de: {
    carOwnershipPct: 92,
    avgCommuteMin: 26,
    publicTransitUsePct: 4,
    walkBikePct: 3,
    interstatesMiles: 41,
    bridgesTotal: 1,
    airportsCommercial: 1,
    trafficDeathsPer100k: 11.0,
  },
  fl: {
    carOwnershipPct: 92,
    avgCommuteMin: 29,
    publicTransitUsePct: 2,
    walkBikePct: 3,
    interstatesMiles: 1470,
    bridgesTotal: 12,
    airportsCommercial: 20,
    trafficDeathsPer100k: 15.4,
  },
  ga: {
    carOwnershipPct: 92,
    avgCommuteMin: 29,
    publicTransitUsePct: 3,
    walkBikePct: 2,
    interstatesMiles: 1244,
    bridgesTotal: 14,
    airportsCommercial: 12,
    trafficDeathsPer100k: 14.2,
  },
  hi: {
    carOwnershipPct: 85,
    avgCommuteMin: 27,
    publicTransitUsePct: 8,
    walkBikePct: 8,
    interstatesMiles: 55,
    bridgesTotal: 1,
    airportsCommercial: 15,
    trafficDeathsPer100k: 8.1,
  },
  id: {
    carOwnershipPct: 93,
    avgCommuteMin: 21,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 611,
    bridgesTotal: 4,
    airportsCommercial: 9,
    trafficDeathsPer100k: 14.9,
  },
  il: {
    carOwnershipPct: 88,
    avgCommuteMin: 31,
    publicTransitUsePct: 8,
    walkBikePct: 3,
    interstatesMiles: 2169,
    bridgesTotal: 26,
    airportsCommercial: 10,
    trafficDeathsPer100k: 11.3,
  },
  in: {
    carOwnershipPct: 93,
    avgCommuteMin: 24,
    publicTransitUsePct: 1,
    walkBikePct: 2,
    interstatesMiles: 1172,
    bridgesTotal: 19,
    airportsCommercial: 6,
    trafficDeathsPer100k: 13.9,
  },
  ia: {
    carOwnershipPct: 94,
    avgCommuteMin: 19,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 782,
    bridgesTotal: 24,
    airportsCommercial: 7,
    trafficDeathsPer100k: 11.0,
  },
  ks: {
    carOwnershipPct: 93,
    avgCommuteMin: 21,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 874,
    bridgesTotal: 25,
    airportsCommercial: 7,
    trafficDeathsPer100k: 14.5,
  },
  ky: {
    carOwnershipPct: 93,
    avgCommuteMin: 23,
    publicTransitUsePct: 1,
    walkBikePct: 2,
    interstatesMiles: 766,
    bridgesTotal: 14,
    airportsCommercial: 6,
    trafficDeathsPer100k: 16.9,
  },
  la: {
    carOwnershipPct: 90,
    avgCommuteMin: 26,
    publicTransitUsePct: 2,
    walkBikePct: 3,
    interstatesMiles: 908,
    bridgesTotal: 13,
    airportsCommercial: 8,
    trafficDeathsPer100k: 16.6,
  },
  me: {
    carOwnershipPct: 93,
    avgCommuteMin: 24,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 368,
    bridgesTotal: 2,
    airportsCommercial: 5,
    trafficDeathsPer100k: 11.3,
  },
  md: {
    carOwnershipPct: 90,
    avgCommuteMin: 34,
    publicTransitUsePct: 9,
    walkBikePct: 4,
    interstatesMiles: 482,
    bridgesTotal: 5,
    airportsCommercial: 5,
    trafficDeathsPer100k: 8.8,
  },
  ma: {
    carOwnershipPct: 85,
    avgCommuteMin: 31,
    publicTransitUsePct: 10,
    walkBikePct: 5,
    interstatesMiles: 569,
    bridgesTotal: 5,
    airportsCommercial: 8,
    trafficDeathsPer100k: 5.6,
  },
  mi: {
    carOwnershipPct: 93,
    avgCommuteMin: 25,
    publicTransitUsePct: 2,
    walkBikePct: 2,
    interstatesMiles: 1239,
    bridgesTotal: 11,
    airportsCommercial: 10,
    trafficDeathsPer100k: 11.1,
  },
  mn: {
    carOwnershipPct: 92,
    avgCommuteMin: 24,
    publicTransitUsePct: 4,
    walkBikePct: 3,
    interstatesMiles: 913,
    bridgesTotal: 13,
    airportsCommercial: 10,
    trafficDeathsPer100k: 8.4,
  },
  ms: {
    carOwnershipPct: 93,
    avgCommuteMin: 24,
    publicTransitUsePct: 1,
    walkBikePct: 1,
    interstatesMiles: 685,
    bridgesTotal: 17,
    airportsCommercial: 6,
    trafficDeathsPer100k: 22.6,
  },
  mo: {
    carOwnershipPct: 93,
    avgCommuteMin: 24,
    publicTransitUsePct: 2,
    walkBikePct: 2,
    interstatesMiles: 1431,
    bridgesTotal: 24,
    airportsCommercial: 8,
    trafficDeathsPer100k: 14.5,
  },
  mt: {
    carOwnershipPct: 93,
    avgCommuteMin: 18,
    publicTransitUsePct: 1,
    walkBikePct: 4,
    interstatesMiles: 1192,
    bridgesTotal: 5,
    airportsCommercial: 9,
    trafficDeathsPer100k: 22.5,
  },
  ne: {
    carOwnershipPct: 94,
    avgCommuteMin: 19,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 482,
    bridgesTotal: 15,
    airportsCommercial: 6,
    trafficDeathsPer100k: 11.4,
  },
  nv: {
    carOwnershipPct: 89,
    avgCommuteMin: 26,
    publicTransitUsePct: 3,
    walkBikePct: 3,
    interstatesMiles: 555,
    bridgesTotal: 2,
    airportsCommercial: 6,
    trafficDeathsPer100k: 15.2,
  },
  nh: {
    carOwnershipPct: 93,
    avgCommuteMin: 27,
    publicTransitUsePct: 2,
    walkBikePct: 3,
    interstatesMiles: 225,
    bridgesTotal: 2,
    airportsCommercial: 4,
    trafficDeathsPer100k: 8.0,
  },
  nj: {
    carOwnershipPct: 87,
    avgCommuteMin: 33,
    publicTransitUsePct: 11,
    walkBikePct: 3,
    interstatesMiles: 446,
    bridgesTotal: 6,
    airportsCommercial: 5,
    trafficDeathsPer100k: 7.5,
  },
  nm: {
    carOwnershipPct: 91,
    avgCommuteMin: 23,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 1001,
    bridgesTotal: 4,
    airportsCommercial: 5,
    trafficDeathsPer100k: 18.7,
  },
  ny: {
    carOwnershipPct: 69,
    avgCommuteMin: 34,
    publicTransitUsePct: 26,
    walkBikePct: 6,
    interstatesMiles: 1674,
    bridgesTotal: 17,
    airportsCommercial: 15,
    trafficDeathsPer100k: 5.3,
  },
  nc: {
    carOwnershipPct: 92,
    avgCommuteMin: 26,
    publicTransitUsePct: 2,
    walkBikePct: 2,
    interstatesMiles: 1029,
    bridgesTotal: 18,
    airportsCommercial: 10,
    trafficDeathsPer100k: 13.2,
  },
  nd: {
    carOwnershipPct: 94,
    avgCommuteMin: 17,
    publicTransitUsePct: 1,
    walkBikePct: 4,
    interstatesMiles: 571,
    bridgesTotal: 4,
    airportsCommercial: 7,
    trafficDeathsPer100k: 15.2,
  },
  oh: {
    carOwnershipPct: 92,
    avgCommuteMin: 24,
    publicTransitUsePct: 2,
    walkBikePct: 2,
    interstatesMiles: 1574,
    bridgesTotal: 27,
    airportsCommercial: 8,
    trafficDeathsPer100k: 11.3,
  },
  ok: {
    carOwnershipPct: 93,
    avgCommuteMin: 23,
    publicTransitUsePct: 1,
    walkBikePct: 1,
    interstatesMiles: 928,
    bridgesTotal: 23,
    airportsCommercial: 7,
    trafficDeathsPer100k: 16.3,
  },
  or: {
    carOwnershipPct: 89,
    avgCommuteMin: 25,
    publicTransitUsePct: 4,
    walkBikePct: 5,
    interstatesMiles: 727,
    bridgesTotal: 8,
    airportsCommercial: 8,
    trafficDeathsPer100k: 10.7,
  },
  pa: {
    carOwnershipPct: 89,
    avgCommuteMin: 28,
    publicTransitUsePct: 6,
    walkBikePct: 3,
    interstatesMiles: 1587,
    bridgesTotal: 22,
    airportsCommercial: 10,
    trafficDeathsPer100k: 10.5,
  },
  ri: {
    carOwnershipPct: 87,
    avgCommuteMin: 26,
    publicTransitUsePct: 4,
    walkBikePct: 5,
    interstatesMiles: 71,
    bridgesTotal: 1,
    airportsCommercial: 1,
    trafficDeathsPer100k: 7.8,
  },
  sc: {
    carOwnershipPct: 93,
    avgCommuteMin: 26,
    publicTransitUsePct: 1,
    walkBikePct: 2,
    interstatesMiles: 843,
    bridgesTotal: 9,
    airportsCommercial: 7,
    trafficDeathsPer100k: 19.4,
  },
  sd: {
    carOwnershipPct: 94,
    avgCommuteMin: 17,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 678,
    bridgesTotal: 6,
    airportsCommercial: 7,
    trafficDeathsPer100k: 14.5,
  },
  tn: {
    carOwnershipPct: 93,
    avgCommuteMin: 26,
    publicTransitUsePct: 1,
    walkBikePct: 2,
    interstatesMiles: 1161,
    bridgesTotal: 20,
    airportsCommercial: 8,
    trafficDeathsPer100k: 15.2,
  },
  tx: {
    carOwnershipPct: 93,
    avgCommuteMin: 28,
    publicTransitUsePct: 2,
    walkBikePct: 1,
    interstatesMiles: 3233,
    bridgesTotal: 53,
    airportsCommercial: 26,
    trafficDeathsPer100k: 14.7,
  },
  ut: {
    carOwnershipPct: 93,
    avgCommuteMin: 24,
    publicTransitUsePct: 3,
    walkBikePct: 3,
    interstatesMiles: 941,
    bridgesTotal: 3,
    airportsCommercial: 5,
    trafficDeathsPer100k: 11.6,
  },
  vt: {
    carOwnershipPct: 93,
    avgCommuteMin: 23,
    publicTransitUsePct: 2,
    walkBikePct: 6,
    interstatesMiles: 319,
    bridgesTotal: 2,
    airportsCommercial: 3,
    trafficDeathsPer100k: 10.8,
  },
  va: {
    carOwnershipPct: 91,
    avgCommuteMin: 29,
    publicTransitUsePct: 5,
    walkBikePct: 3,
    interstatesMiles: 1153,
    bridgesTotal: 14,
    airportsCommercial: 10,
    trafficDeathsPer100k: 10.1,
  },
  wa: {
    carOwnershipPct: 89,
    avgCommuteMin: 28,
    publicTransitUsePct: 6,
    walkBikePct: 4,
    interstatesMiles: 768,
    bridgesTotal: 8,
    airportsCommercial: 13,
    trafficDeathsPer100k: 9.3,
  },
  wv: {
    carOwnershipPct: 92,
    avgCommuteMin: 26,
    publicTransitUsePct: 1,
    walkBikePct: 2,
    interstatesMiles: 549,
    bridgesTotal: 7,
    airportsCommercial: 3,
    trafficDeathsPer100k: 17.7,
  },
  wi: {
    carOwnershipPct: 93,
    avgCommuteMin: 22,
    publicTransitUsePct: 2,
    walkBikePct: 3,
    interstatesMiles: 739,
    bridgesTotal: 14,
    airportsCommercial: 8,
    trafficDeathsPer100k: 10.3,
  },
  wy: {
    carOwnershipPct: 93,
    avgCommuteMin: 18,
    publicTransitUsePct: 1,
    walkBikePct: 3,
    interstatesMiles: 916,
    bridgesTotal: 3,
    airportsCommercial: 6,
    trafficDeathsPer100k: 19.0,
  },
};

// ─── Housing Statistics per state ─────────────────────────────────────────
interface StateHousingData {
  medianHomePrice: number; // median home price in thousands USD
  medianRent: number; // median monthly rent in USD
  homeOwnershipPct: number; // % households that own their home
  vacancyRatePct: number; // % housing units vacant
  affordabilityIndex: number; // 0-100, higher = more affordable
  avgMortgageRate: number; // current avg 30-yr mortgage rate %
  housingCostBurdenPct: number; // % households spending >30% income on housing
  newPermitsPer1k: number; // new housing permits per 1k residents (annual)
  priceYoYChangePct: number; // YoY % change in home prices
}

const STATE_HOUSING: Record<string, StateHousingData> = {
  al: {
    medianHomePrice: 219,
    medianRent: 1060,
    homeOwnershipPct: 70,
    vacancyRatePct: 14,
    affordabilityIndex: 68,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 26,
    newPermitsPer1k: 4.2,
    priceYoYChangePct: 4.1,
  },
  ak: {
    medianHomePrice: 348,
    medianRent: 1380,
    homeOwnershipPct: 64,
    vacancyRatePct: 8,
    affordabilityIndex: 44,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 30,
    newPermitsPer1k: 2.1,
    priceYoYChangePct: 2.8,
  },
  az: {
    medianHomePrice: 421,
    medianRent: 1590,
    homeOwnershipPct: 65,
    vacancyRatePct: 11,
    affordabilityIndex: 38,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 35,
    newPermitsPer1k: 7.8,
    priceYoYChangePct: 5.2,
  },
  ar: {
    medianHomePrice: 185,
    medianRent: 880,
    homeOwnershipPct: 66,
    vacancyRatePct: 15,
    affordabilityIndex: 74,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 24,
    newPermitsPer1k: 3.1,
    priceYoYChangePct: 5.6,
  },
  ca: {
    medianHomePrice: 790,
    medianRent: 2540,
    homeOwnershipPct: 56,
    vacancyRatePct: 7,
    affordabilityIndex: 14,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 51,
    newPermitsPer1k: 2.3,
    priceYoYChangePct: 3.8,
  },
  co: {
    medianHomePrice: 580,
    medianRent: 1880,
    homeOwnershipPct: 65,
    vacancyRatePct: 7,
    affordabilityIndex: 28,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 38,
    newPermitsPer1k: 5.6,
    priceYoYChangePct: 4.0,
  },
  ct: {
    medianHomePrice: 410,
    medianRent: 1760,
    homeOwnershipPct: 65,
    vacancyRatePct: 8,
    affordabilityIndex: 32,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 38,
    newPermitsPer1k: 2.0,
    priceYoYChangePct: 9.1,
  },
  de: {
    medianHomePrice: 370,
    medianRent: 1560,
    homeOwnershipPct: 72,
    vacancyRatePct: 10,
    affordabilityIndex: 40,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 33,
    newPermitsPer1k: 3.9,
    priceYoYChangePct: 6.8,
  },
  fl: {
    medianHomePrice: 416,
    medianRent: 1870,
    homeOwnershipPct: 65,
    vacancyRatePct: 13,
    affordabilityIndex: 30,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 43,
    newPermitsPer1k: 8.5,
    priceYoYChangePct: 2.1,
  },
  ga: {
    medianHomePrice: 320,
    medianRent: 1580,
    homeOwnershipPct: 63,
    vacancyRatePct: 12,
    affordabilityIndex: 45,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 33,
    newPermitsPer1k: 6.9,
    priceYoYChangePct: 4.4,
  },
  hi: {
    medianHomePrice: 850,
    medianRent: 2800,
    homeOwnershipPct: 60,
    vacancyRatePct: 12,
    affordabilityIndex: 10,
    avgMortgageRate: 7.2,
    housingCostBurdenPct: 55,
    newPermitsPer1k: 1.8,
    priceYoYChangePct: 1.5,
  },
  id: {
    medianHomePrice: 430,
    medianRent: 1450,
    homeOwnershipPct: 70,
    vacancyRatePct: 8,
    affordabilityIndex: 32,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 33,
    newPermitsPer1k: 8.2,
    priceYoYChangePct: 3.0,
  },
  il: {
    medianHomePrice: 255,
    medianRent: 1390,
    homeOwnershipPct: 66,
    vacancyRatePct: 9,
    affordabilityIndex: 55,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 31,
    newPermitsPer1k: 2.2,
    priceYoYChangePct: 7.2,
  },
  in: {
    medianHomePrice: 232,
    medianRent: 1050,
    homeOwnershipPct: 70,
    vacancyRatePct: 10,
    affordabilityIndex: 64,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 26,
    newPermitsPer1k: 4.8,
    priceYoYChangePct: 6.4,
  },
  ia: {
    medianHomePrice: 205,
    medianRent: 930,
    homeOwnershipPct: 72,
    vacancyRatePct: 9,
    affordabilityIndex: 68,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 25,
    newPermitsPer1k: 3.7,
    priceYoYChangePct: 5.9,
  },
  ks: {
    medianHomePrice: 210,
    medianRent: 980,
    homeOwnershipPct: 68,
    vacancyRatePct: 10,
    affordabilityIndex: 66,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 26,
    newPermitsPer1k: 4.0,
    priceYoYChangePct: 5.2,
  },
  ky: {
    medianHomePrice: 215,
    medianRent: 1000,
    homeOwnershipPct: 68,
    vacancyRatePct: 12,
    affordabilityIndex: 66,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 27,
    newPermitsPer1k: 4.1,
    priceYoYChangePct: 6.1,
  },
  la: {
    medianHomePrice: 210,
    medianRent: 1080,
    homeOwnershipPct: 66,
    vacancyRatePct: 14,
    affordabilityIndex: 62,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 30,
    newPermitsPer1k: 2.9,
    priceYoYChangePct: 2.5,
  },
  me: {
    medianHomePrice: 380,
    medianRent: 1520,
    homeOwnershipPct: 73,
    vacancyRatePct: 17,
    affordabilityIndex: 33,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 36,
    newPermitsPer1k: 3.8,
    priceYoYChangePct: 8.3,
  },
  md: {
    medianHomePrice: 415,
    medianRent: 1890,
    homeOwnershipPct: 68,
    vacancyRatePct: 8,
    affordabilityIndex: 30,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 37,
    newPermitsPer1k: 3.0,
    priceYoYChangePct: 5.8,
  },
  ma: {
    medianHomePrice: 630,
    medianRent: 2600,
    homeOwnershipPct: 63,
    vacancyRatePct: 7,
    affordabilityIndex: 18,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 48,
    newPermitsPer1k: 2.4,
    priceYoYChangePct: 7.0,
  },
  mi: {
    medianHomePrice: 235,
    medianRent: 1160,
    homeOwnershipPct: 72,
    vacancyRatePct: 11,
    affordabilityIndex: 60,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 28,
    newPermitsPer1k: 3.1,
    priceYoYChangePct: 6.8,
  },
  mn: {
    medianHomePrice: 320,
    medianRent: 1380,
    homeOwnershipPct: 72,
    vacancyRatePct: 7,
    affordabilityIndex: 48,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 30,
    newPermitsPer1k: 3.8,
    priceYoYChangePct: 5.5,
  },
  ms: {
    medianHomePrice: 175,
    medianRent: 870,
    homeOwnershipPct: 68,
    vacancyRatePct: 17,
    affordabilityIndex: 74,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 26,
    newPermitsPer1k: 2.5,
    priceYoYChangePct: 4.2,
  },
  mo: {
    medianHomePrice: 228,
    medianRent: 1070,
    homeOwnershipPct: 67,
    vacancyRatePct: 11,
    affordabilityIndex: 62,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 28,
    newPermitsPer1k: 3.9,
    priceYoYChangePct: 5.7,
  },
  mt: {
    medianHomePrice: 465,
    medianRent: 1560,
    homeOwnershipPct: 68,
    vacancyRatePct: 12,
    affordabilityIndex: 27,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 35,
    newPermitsPer1k: 5.9,
    priceYoYChangePct: 4.0,
  },
  ne: {
    medianHomePrice: 248,
    medianRent: 1060,
    homeOwnershipPct: 67,
    vacancyRatePct: 8,
    affordabilityIndex: 58,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 27,
    newPermitsPer1k: 4.6,
    priceYoYChangePct: 6.0,
  },
  nv: {
    medianHomePrice: 420,
    medianRent: 1700,
    homeOwnershipPct: 58,
    vacancyRatePct: 11,
    affordabilityIndex: 32,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 40,
    newPermitsPer1k: 6.5,
    priceYoYChangePct: 4.8,
  },
  nh: {
    medianHomePrice: 450,
    medianRent: 1800,
    homeOwnershipPct: 71,
    vacancyRatePct: 9,
    affordabilityIndex: 27,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 35,
    newPermitsPer1k: 3.5,
    priceYoYChangePct: 8.9,
  },
  nj: {
    medianHomePrice: 500,
    medianRent: 2080,
    homeOwnershipPct: 64,
    vacancyRatePct: 8,
    affordabilityIndex: 22,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 43,
    newPermitsPer1k: 2.5,
    priceYoYChangePct: 8.4,
  },
  nm: {
    medianHomePrice: 295,
    medianRent: 1250,
    homeOwnershipPct: 68,
    vacancyRatePct: 13,
    affordabilityIndex: 46,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 30,
    newPermitsPer1k: 3.5,
    priceYoYChangePct: 5.1,
  },
  ny: {
    medianHomePrice: 460,
    medianRent: 2200,
    homeOwnershipPct: 54,
    vacancyRatePct: 9,
    affordabilityIndex: 18,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 52,
    newPermitsPer1k: 2.0,
    priceYoYChangePct: 6.5,
  },
  nc: {
    medianHomePrice: 335,
    medianRent: 1500,
    homeOwnershipPct: 65,
    vacancyRatePct: 11,
    affordabilityIndex: 44,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 33,
    newPermitsPer1k: 7.6,
    priceYoYChangePct: 5.3,
  },
  nd: {
    medianHomePrice: 255,
    medianRent: 990,
    homeOwnershipPct: 62,
    vacancyRatePct: 9,
    affordabilityIndex: 60,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 25,
    newPermitsPer1k: 4.3,
    priceYoYChangePct: 3.8,
  },
  oh: {
    medianHomePrice: 225,
    medianRent: 1120,
    homeOwnershipPct: 67,
    vacancyRatePct: 11,
    affordabilityIndex: 62,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 28,
    newPermitsPer1k: 3.5,
    priceYoYChangePct: 7.0,
  },
  ok: {
    medianHomePrice: 195,
    medianRent: 1000,
    homeOwnershipPct: 66,
    vacancyRatePct: 13,
    affordabilityIndex: 68,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 25,
    newPermitsPer1k: 4.4,
    priceYoYChangePct: 4.3,
  },
  or: {
    medianHomePrice: 480,
    medianRent: 1720,
    homeOwnershipPct: 63,
    vacancyRatePct: 8,
    affordabilityIndex: 26,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 41,
    newPermitsPer1k: 4.0,
    priceYoYChangePct: 3.2,
  },
  pa: {
    medianHomePrice: 260,
    medianRent: 1350,
    homeOwnershipPct: 69,
    vacancyRatePct: 11,
    affordabilityIndex: 52,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 31,
    newPermitsPer1k: 2.6,
    priceYoYChangePct: 7.5,
  },
  ri: {
    medianHomePrice: 445,
    medianRent: 1960,
    homeOwnershipPct: 62,
    vacancyRatePct: 10,
    affordabilityIndex: 24,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 44,
    newPermitsPer1k: 2.1,
    priceYoYChangePct: 9.2,
  },
  sc: {
    medianHomePrice: 295,
    medianRent: 1380,
    homeOwnershipPct: 72,
    vacancyRatePct: 14,
    affordabilityIndex: 50,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 30,
    newPermitsPer1k: 8.1,
    priceYoYChangePct: 4.8,
  },
  sd: {
    medianHomePrice: 300,
    medianRent: 1140,
    homeOwnershipPct: 68,
    vacancyRatePct: 10,
    affordabilityIndex: 52,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 28,
    newPermitsPer1k: 5.2,
    priceYoYChangePct: 5.5,
  },
  tn: {
    medianHomePrice: 325,
    medianRent: 1470,
    homeOwnershipPct: 66,
    vacancyRatePct: 12,
    affordabilityIndex: 44,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 32,
    newPermitsPer1k: 7.0,
    priceYoYChangePct: 4.0,
  },
  tx: {
    medianHomePrice: 305,
    medianRent: 1560,
    homeOwnershipPct: 63,
    vacancyRatePct: 11,
    affordabilityIndex: 44,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 34,
    newPermitsPer1k: 9.3,
    priceYoYChangePct: 1.8,
  },
  ut: {
    medianHomePrice: 515,
    medianRent: 1650,
    homeOwnershipPct: 70,
    vacancyRatePct: 6,
    affordabilityIndex: 24,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 37,
    newPermitsPer1k: 8.7,
    priceYoYChangePct: 2.5,
  },
  vt: {
    medianHomePrice: 395,
    medianRent: 1620,
    homeOwnershipPct: 71,
    vacancyRatePct: 17,
    affordabilityIndex: 30,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 36,
    newPermitsPer1k: 2.7,
    priceYoYChangePct: 9.5,
  },
  va: {
    medianHomePrice: 380,
    medianRent: 1780,
    homeOwnershipPct: 68,
    vacancyRatePct: 9,
    affordabilityIndex: 36,
    avgMortgageRate: 7.0,
    housingCostBurdenPct: 35,
    newPermitsPer1k: 4.4,
    priceYoYChangePct: 6.0,
  },
  wa: {
    medianHomePrice: 580,
    medianRent: 1990,
    homeOwnershipPct: 63,
    vacancyRatePct: 7,
    affordabilityIndex: 20,
    avgMortgageRate: 7.1,
    housingCostBurdenPct: 40,
    newPermitsPer1k: 4.8,
    priceYoYChangePct: 4.5,
  },
  wv: {
    medianHomePrice: 155,
    medianRent: 790,
    homeOwnershipPct: 73,
    vacancyRatePct: 17,
    affordabilityIndex: 78,
    avgMortgageRate: 6.8,
    housingCostBurdenPct: 24,
    newPermitsPer1k: 1.4,
    priceYoYChangePct: 5.8,
  },
  wi: {
    medianHomePrice: 285,
    medianRent: 1240,
    homeOwnershipPct: 68,
    vacancyRatePct: 8,
    affordabilityIndex: 52,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 29,
    newPermitsPer1k: 3.8,
    priceYoYChangePct: 6.5,
  },
  wy: {
    medianHomePrice: 330,
    medianRent: 1150,
    homeOwnershipPct: 70,
    vacancyRatePct: 14,
    affordabilityIndex: 46,
    avgMortgageRate: 6.9,
    housingCostBurdenPct: 27,
    newPermitsPer1k: 3.8,
    priceYoYChangePct: 4.2,
  },
};

const DEFAULT_HOUSING: StateHousingData = {
  medianHomePrice: 300,
  medianRent: 1300,
  homeOwnershipPct: 66,
  vacancyRatePct: 10,
  affordabilityIndex: 50,
  avgMortgageRate: 7.0,
  housingCostBurdenPct: 30,
  newPermitsPer1k: 4.0,
  priceYoYChangePct: 4.5,
};

const HOUSING_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f87171"];

function HousingPanel({ state }: { state: USState }) {
  const hd = STATE_HOUSING[state.id] ?? DEFAULT_HOUSING;

  const ownershipData = [
    { name: "Owner-Occupied", pct: hd.homeOwnershipPct, color: "#60a5fa" },
    {
      name: "Renter-Occupied",
      pct: Math.max(0, 100 - hd.homeOwnershipPct - hd.vacancyRatePct),
      color: "#34d399",
    },
    { name: "Vacant", pct: hd.vacancyRatePct, color: "#94a3b8" },
  ];

  const affordabilityLabel =
    hd.affordabilityIndex >= 60
      ? "Affordable"
      : hd.affordabilityIndex >= 35
        ? "Moderate"
        : hd.affordabilityIndex >= 20
          ? "Expensive"
          : "Very Expensive";

  const affordabilityColor =
    hd.affordabilityIndex >= 60
      ? "text-success"
      : hd.affordabilityIndex >= 35
        ? "text-warning"
        : hd.affordabilityIndex >= 20
          ? "text-orange-400"
          : "text-destructive";

  const yoyColor =
    hd.priceYoYChangePct >= 7
      ? "text-destructive"
      : hd.priceYoYChangePct >= 4
        ? "text-warning"
        : "text-success";

  const barChartData = [
    { label: "Ownership", value: hd.homeOwnershipPct, fill: "#60a5fa" },
    { label: "Cost Burden", value: hd.housingCostBurdenPct, fill: "#f87171" },
    { label: "Vacancy", value: hd.vacancyRatePct, fill: "#94a3b8" },
    { label: "Affordability", value: hd.affordabilityIndex, fill: "#34d399" },
  ];

  return (
    <div className="modal-tile rounded-xl p-4 mt-4 border border-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-amber-500/10 rounded-md border border-amber-500/20 shrink-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-amber-400"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
            Housing Statistics
          </h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            Home prices, rent, affordability &amp; ownership
          </p>
        </div>
        <span
          className={`ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${hd.affordabilityIndex >= 60 ? "text-success bg-success/10 border-success/30" : hd.affordabilityIndex >= 35 ? "text-warning bg-warning/10 border-warning/30" : hd.affordabilityIndex >= 20 ? "text-orange-400 bg-orange-500/10 border-orange-500/30" : "text-destructive bg-destructive/10 border-destructive/30"}`}
        >
          {affordabilityLabel}
        </span>
      </div>

      {/* 4 key stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Median Home Price
          </p>
          <p className="text-base font-bold font-mono text-amber-400">
            ${hd.medianHomePrice}K
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">
            2025 estimate
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Median Rent
          </p>
          <p className="text-base font-bold font-mono text-blue-400">
            ${hd.medianRent.toLocaleString()}/mo
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">monthly</p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Ownership Rate
          </p>
          <p className="text-base font-bold font-mono text-green-400">
            {hd.homeOwnershipPct}%
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">
            households
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            YoY Price Change
          </p>
          <p className={`text-base font-bold font-mono ${yoyColor}`}>
            +{hd.priceYoYChangePct}%
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">
            annual change
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        {/* Donut: occupancy breakdown */}
        <div>
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
            Housing Occupancy Split
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {ownershipData.map((d, i) => (
                    <linearGradient
                      key={i}
                      id={`housingGrad-${state.id}-${i}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={d.color} stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor={d.color}
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={ownershipData}
                  dataKey="pct"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={54}
                  paddingAngle={2}
                  isAnimationActive
                  animationDuration={600}
                >
                  {ownershipData.map((_, i) => (
                    <Cell key={i} fill={`url(#housingGrad-${state.id}-${i})`} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 9, fontFamily: "IBM Plex Mono" }}
                  formatter={(v) => (
                    <span style={{ color: "hsl(0,0%,65%)" }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart: key housing metrics */}
        <div>
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
            Housing Metrics (%)
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(222,30%,22%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "hsl(0,0%,60%)",
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
                  width={28}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                        <p style={{ color: payload[0].payload.fill }}>
                          {payload[0].payload.label}: {payload[0].value}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                  animationDuration={600}
                >
                  {barChartData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Affordability index bar */}
      <div className="rounded-lg border border-border bg-background/40 p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
            🏠 Housing Affordability Index
          </p>
          <span className={`text-xs font-bold font-mono ${affordabilityColor}`}>
            {hd.affordabilityIndex}/100
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${hd.affordabilityIndex}%`,
              background:
                hd.affordabilityIndex >= 60
                  ? "hsl(142,71%,45%)"
                  : hd.affordabilityIndex >= 35
                    ? "hsl(38,92%,50%)"
                    : hd.affordabilityIndex >= 20
                      ? "hsl(24,95%,50%)"
                      : "hsl(0,70%,55%)",
            }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground font-sans mt-1">
          {hd.affordabilityIndex >= 60
            ? "Below national average cost burden — relatively affordable market"
            : hd.affordabilityIndex >= 35
              ? "Near national average — moderate housing cost pressure"
              : hd.affordabilityIndex >= 20
                ? "Above average cost burden — challenging market for buyers & renters"
                : "Severely unaffordable — among the most expensive housing markets in the US"}
        </p>
      </div>

      {/* Quick facts row */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Cost Burden", value: `${hd.housingCostBurdenPct}%` },
          { label: "Avg Mortgage Rate", value: `${hd.avgMortgageRate}%` },
          { label: "New Permits/1k", value: hd.newPermitsPer1k.toFixed(1) },
          { label: "Vacancy Rate", value: `${hd.vacancyRatePct}%` },
        ].map((f) => (
          <div
            key={f.label}
            className="flex-1 min-w-[80px] rounded-lg border border-border/40 bg-background/30 px-2.5 py-2 text-center"
          >
            <p className="text-[10px] text-muted-foreground font-sans">
              {f.label}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              {f.value}
            </p>
          </div>
        ))}
      </div>

      <SourceLink
        sources={[
          {
            label: "Zillow Research",
            url: "https://www.zillow.com/research/data/",
          },
          {
            label: "Census Bureau ACS",
            url: "https://www.census.gov/programs-surveys/acs/data.html",
          },
          {
            label: "FHFA House Price Index",
            url: "https://www.fhfa.gov/data/hpi",
          },
        ]}
        className="mt-3"
      />
    </div>
  );
}

const DEFAULT_TRANSPORT: StateTransportData = {
  carOwnershipPct: 91,
  avgCommuteMin: 25,
  publicTransitUsePct: 2,
  walkBikePct: 3,
  interstatesMiles: 600,
  bridgesTotal: 8,
  airportsCommercial: 5,
  trafficDeathsPer100k: 13.0,
};

const TRANSPORT_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

function TransportationPanel({ state }: { state: USState }) {
  const td = STATE_TRANSPORT[state.id] ?? DEFAULT_TRANSPORT;

  const commuteModeData = [
    {
      name: "Drive/Carpool",
      pct: Math.max(0, 100 - td.publicTransitUsePct - td.walkBikePct - 3),
      color: "#60a5fa",
    },
    { name: "Public Transit", pct: td.publicTransitUsePct, color: "#34d399" },
    { name: "Walk / Bike", pct: td.walkBikePct, color: "#fbbf24" },
    { name: "Work from Home", pct: 3, color: "#a78bfa" },
  ];

  const barData = [
    {
      label: "Car Ownership",
      value: td.carOwnershipPct,
      suffix: "%",
      color: "#60a5fa",
    },
    {
      label: "Avg Commute",
      value: td.avgCommuteMin,
      suffix: " min",
      color: "#34d399",
    },
    {
      label: "Transit Use",
      value: td.publicTransitUsePct,
      suffix: "%",
      color: "#fbbf24",
    },
    {
      label: "Walk/Bike",
      value: td.walkBikePct,
      suffix: "%",
      color: "#a78bfa",
    },
  ];

  return (
    <div className="modal-tile rounded-xl p-4 mt-4 border border-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 shrink-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-blue-400"
          >
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
            Transportation Statistics
          </h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            Commute, transit, infrastructure &amp; road safety
          </p>
        </div>
      </div>

      {/* 4 key stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Car Ownership
          </p>
          <p className="text-base font-bold font-mono text-blue-400">
            {td.carOwnershipPct}%
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">
            households
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Avg Commute
          </p>
          <p className="text-base font-bold font-mono text-green-400">
            {td.avgCommuteMin} min
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">one way</p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Interstates
          </p>
          <p className="text-base font-bold font-mono text-amber-400">
            {td.interstatesMiles.toLocaleString()} mi
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">
            total miles
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Traffic Deaths
          </p>
          <p
            className={`text-base font-bold font-mono ${td.trafficDeathsPer100k >= 17 ? "text-destructive" : td.trafficDeathsPer100k >= 11 ? "text-warning" : "text-success"}`}
          >
            {td.trafficDeathsPer100k}
          </p>
          <p className="text-[9px] text-muted-foreground font-sans">per 100k</p>
        </div>
      </div>

      {/* Commute mode breakdown chart + bars side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        {/* Donut chart — commute modes */}
        <div>
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
            Commute Mode Split
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {commuteModeData.map((d, i) => (
                    <linearGradient
                      key={i}
                      id={`transGrad-${state.id}-${i}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={d.color} stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor={d.color}
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={commuteModeData}
                  dataKey="pct"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={54}
                  paddingAngle={2}
                  isAnimationActive
                  animationDuration={600}
                >
                  {commuteModeData.map((_d, i) => (
                    <Cell key={i} fill={`url(#transGrad-${state.id}-${i})`} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 9, fontFamily: "IBM Plex Mono" }}
                  formatter={(v) => (
                    <span style={{ color: "hsl(0,0%,65%)" }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal bar chart — transit vs walk vs drive */}
        <div>
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
            Infrastructure &amp; Access
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    label: "Car Own.",
                    value: td.carOwnershipPct,
                    fill: "#60a5fa",
                  },
                  {
                    label: "Transit",
                    value: td.publicTransitUsePct * 4,
                    fill: "#34d399",
                  },
                  {
                    label: "Walk/Bike",
                    value: td.walkBikePct * 4,
                    fill: "#fbbf24",
                  },
                  {
                    label: "Airports",
                    value: Math.min(100, td.airportsCommercial * 2),
                    fill: "#a78bfa",
                  },
                ]}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(222,30%,22%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "hsl(0,0%,60%)",
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
                  width={28}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
                        <p style={{ color: payload[0].payload.fill }}>
                          {payload[0].payload.label}: {payload[0].value}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                  animationDuration={600}
                >
                  {[
                    { fill: "#60a5fa" },
                    { fill: "#34d399" },
                    { fill: "#fbbf24" },
                    { fill: "#a78bfa" },
                  ].map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Road safety progress bar */}
      <div className="rounded-lg border border-border bg-background/40 p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
            🛣️ Road Safety Index
          </p>
          <span
            className={`text-xs font-bold font-mono ${td.trafficDeathsPer100k >= 17 ? "text-destructive" : td.trafficDeathsPer100k >= 11 ? "text-warning" : "text-success"}`}
          >
            {td.trafficDeathsPer100k}/100k fatalities
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (td.trafficDeathsPer100k / 25) * 100)}%`,
              background:
                td.trafficDeathsPer100k >= 17
                  ? "hsl(0,70%,55%)"
                  : td.trafficDeathsPer100k >= 11
                    ? "hsl(38,92%,50%)"
                    : "hsl(142,71%,45%)",
            }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground font-sans mt-1">
          {td.trafficDeathsPer100k >= 17
            ? "Above average — elevated road fatality risk"
            : td.trafficDeathsPer100k >= 11
              ? "Near national average (~13/100k)"
              : "Below national average — safer roads"}
        </p>
      </div>

      {/* Quick facts row */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Commercial Airports", value: td.airportsCommercial },
          { label: "Bridges (est.)", value: `${td.bridgesTotal}K` },
          {
            label: "Interstate Miles",
            value: td.interstatesMiles.toLocaleString(),
          },
          { label: "Transit Use", value: `${td.publicTransitUsePct}%` },
        ].map((f) => (
          <div
            key={f.label}
            className="flex-1 min-w-[80px] rounded-lg border border-border/40 bg-background/30 px-2.5 py-2 text-center"
          >
            <p className="text-[10px] text-muted-foreground font-sans">
              {f.label}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              {f.value}
            </p>
          </div>
        ))}
      </div>

      <SourceLink
        sources={[
          {
            label: "US DOT / FHWA",
            url: "https://www.fhwa.dot.gov/policyinformation/statistics.cfm",
          },
          {
            label: "NHTSA Traffic Safety",
            url: "https://www.nhtsa.gov/research-data",
          },
          {
            label: "ACS Commute Data",
            url: "https://www.census.gov/topics/employment/commuting.html",
          },
        ]}
        className="mt-3"
      />
    </div>
  );
}

// ─── Mean elevation lookup (feet) per state ──────────────────────────────
const STATE_ELEVATION_FT: Record<string, number> = {
  al: 500,
  ak: 1900,
  az: 4100,
  ar: 650,
  ca: 2900,
  co: 6800,
  ct: 500,
  de: 60,
  fl: 100,
  ga: 600,
  hi: 3030,
  id: 5000,
  il: 600,
  in: 700,
  ia: 1100,
  ks: 2000,
  ky: 750,
  la: 100,
  me: 600,
  md: 350,
  ma: 500,
  mi: 900,
  mn: 1200,
  ms: 300,
  mo: 800,
  mt: 3400,
  ne: 2600,
  nv: 5500,
  nh: 1000,
  nj: 250,
  nm: 5700,
  ny: 1000,
  nc: 700,
  nd: 1900,
  oh: 850,
  ok: 1300,
  or: 3300,
  pa: 1100,
  ri: 200,
  sc: 350,
  sd: 2200,
  tn: 900,
  tx: 1700,
  ut: 6100,
  vt: 1000,
  va: 950,
  wa: 1700,
  wv: 1500,
  wi: 1050,
  wy: 6700,
};

// ── Source citation constants ────────────────────────────────────────────
const SRC_BLS = [
  { label: "Bureau of Labor Statistics", url: "https://www.bls.gov/data/" },
  { label: "US Census Bureau", url: "https://data.census.gov/" },
];
const SRC_BEA = [
  {
    label: "Bureau of Economic Analysis",
    url: "https://www.bea.gov/data/gdp/gdp-state",
  },
];
const SRC_CENSUS = [
  {
    label: "US Census Bureau – ACS",
    url: "https://www.census.gov/programs-surveys/acs/data.html",
  },
];
const SRC_CONGRESS = [
  { label: "Congress.gov", url: "https://www.congress.gov/" },
  {
    label: "National Conference of State Legislatures",
    url: "https://www.ncsl.org/",
  },
];
const SRC_EIA = [
  {
    label: "US Energy Information Administration",
    url: "https://www.eia.gov/state/",
  },
];

const partyColor = {
  Democrat: "text-secondary border-secondary bg-secondary/10",
  Republican: "text-red-400 border-red-500/40 bg-red-500/10",
  Independent: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
};

// ─── Color palettes ──────────────────────────────────────────────────────────
const ETHNICITY_COLORS = [
  "#60a5fa",
  "#f87171",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
];
const LAND_COLORS = ["#f97316", "#84cc16", "#22d3ee", "#3b82f6", "#94a3b8"];
const AGE_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171"];
const VOTER_COLORS = ["#3b82f6", "#ef4444", "#a3a3a3"];
const WEALTH_COLORS = ["#22d3ee", "#60a5fa", "#fbbf24", "#f87171"];
const ENERGY_COLORS = [
  "#78716c",
  "#6b7280",
  "#60a5fa",
  "#22d3ee",
  "#fbbf24",
  "#34d399",
  "#a78bfa",
];

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="modal-tile rounded-lg p-4 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground font-sans">{label}</p>
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground font-sans">{sub}</p>}
    </div>
  );
}

function TaxCard({
  incomeTax,
  salesTax,
  minimumWage,
  averageIncome,
}: {
  incomeTax: number | null | undefined;
  salesTax: number | null | undefined;
  minimumWage: number | null | undefined;
  averageIncome: number | null | undefined;
}) {
  const fmtPct = (v: number | null | undefined) =>
    v == null ? "N/A" : v === 0 ? "None" : `${v}%`;
  const fmtWage = (v: number | null | undefined) =>
    v == null ? "N/A" : v <= 7.25 ? `$7.25` : `$${v.toFixed(2)}`;
  const fmtIncome = (v: number | null | undefined) =>
    v == null ? "N/A" : `$${(v / 1000).toFixed(1)}K`;
  return (
    <div className="modal-tile rounded-lg p-4 flex flex-col gap-2 col-span-2 sm:col-span-4">
      <p className="text-xs text-muted-foreground font-sans">Tax &amp; Wages</p>
      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Income Tax
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtPct(incomeTax)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            top marginal rate
          </p>
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Sales Tax
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtPct(salesTax)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            state + local avg
          </p>
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Min Wage
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtWage(minimumWage)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            per hour
          </p>
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
            Avg Income
          </p>
          <p className="text-xl font-bold font-mono text-foreground">
            {fmtIncome(averageIncome)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            per capita
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared tooltip ──────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, suffix = "%" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-lg">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((e: any) => (
        <p key={e.name ?? e.dataKey} style={{ color: e.fill ?? e.color }}>
          {e.name ?? e.dataKey}: {e.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

// ─── Mini horizontal bar ─────────────────────────────────────────────────────
function HorizBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 text-muted-foreground font-sans truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-foreground shrink-0">
        {pct}%
      </span>
    </div>
  );
}

// ─── 6 Chart panels ──────────────────────────────────────────────────────────
function DemographicsCharts({ state }: { state: USState }) {
  const id = state.id;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Ethnicity */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Ethnicity / Demographics
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {state.ethnicity.map((_, i) => (
                  <linearGradient
                    key={i}
                    id={`ethGrad-${id}-${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={ETHNICITY_COLORS[i % ETHNICITY_COLORS.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={ETHNICITY_COLORS[i % ETHNICITY_COLORS.length]}
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={state.ethnicity.filter((d) => d.pct > 0)}
                dataKey="pct"
                nameKey="group"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={60}
                paddingAngle={2}
                isAnimationActive
                animationDuration={600}
              >
                {state.ethnicity
                  .filter((d) => d.pct > 0)
                  .map((_, i) => (
                    <Cell key={i} fill={`url(#ethGrad-${id}-${i})`} />
                  ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }}
                formatter={(v) => (
                  <span style={{ color: "hsl(0,0%,65%)" }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Land Use */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Land Use / Distribution
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {state.landUse.map((_, i) => (
                  <linearGradient
                    key={i}
                    id={`landGrad-${id}-${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={LAND_COLORS[i % LAND_COLORS.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={LAND_COLORS[i % LAND_COLORS.length]}
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={state.landUse}
                dataKey="pct"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={60}
                paddingAngle={2}
                isAnimationActive
                animationDuration={600}
              >
                {state.landUse.map((_, i) => (
                  <Cell key={i} fill={`url(#landGrad-${id}-${i})`} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }}
                formatter={(v) => (
                  <span style={{ color: "hsl(0,0%,65%)" }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Age Distribution */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-2">
          Age Distribution{" "}
          <span className="text-muted-foreground normal-case font-normal">
            (median {state.medianAge} yrs)
          </span>
        </h4>
        <div className="flex flex-col gap-1.5 mt-2">
          {state.ageGroups.map((g, i) => (
            <HorizBar
              key={g.group}
              label={g.group}
              pct={g.pct}
              color={AGE_COLORS[i % AGE_COLORS.length]}
            />
          ))}
        </div>
      </div>

      {/* 4. Voter Registration */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Voter Registration
        </h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={state.voterShare}
              layout="vertical"
              margin={{ top: 2, right: 16, left: 0, bottom: 2 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222,30%,22%)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{
                  fill: "hsl(0,0%,55%)",
                  fontSize: 9,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="party"
                tick={{
                  fill: "hsl(0,0%,65%)",
                  fontSize: 10,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
              <Tooltip content={<ChartTip label="" />} />
              <Bar
                dataKey="pct"
                radius={[0, 4, 4, 0]}
                isAnimationActive
                animationDuration={600}
              >
                {state.voterShare.map((_, i) => (
                  <Cell key={i} fill={VOTER_COLORS[i % VOTER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Wealth & Poverty */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Wealth &amp; Poverty
        </h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={state.wealthPoverty}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222,30%,22%)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{
                  fill: "hsl(0,0%,60%)",
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
                width={28}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTip />} />
              <Bar
                dataKey="pct"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={600}
              >
                {state.wealthPoverty.map((_, i) => (
                  <Cell
                    key={i}
                    fill={WEALTH_COLORS[i % WEALTH_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Energy Production */}
      <div className="modal-tile rounded-lg p-4">
        <h4 className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-2">
          Energy Production Mix
        </h4>
        <div className="flex flex-col gap-1.5 mt-2">
          {state.energyMix
            .filter((e) => e.pct > 0)
            .map((e, i) => (
              <HorizBar
                key={e.source}
                label={e.source}
                pct={e.pct}
                color={ENERGY_COLORS[i % ENERGY_COLORS.length]}
              />
            ))}
        </div>
        <SourceLink sources={SRC_EIA} className="mt-2" />
      </div>
    </div>
  );
}

// ─── Per-state image galleries ────────────────────────────────────────────────
const _STATE_IMAGES_UNUSED: Record<string, { src: string; caption: string }[]> =
  {
    al: [
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Birmingham skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Gulf Shores beach",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Alabama woodland",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Appalachian foothills",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Mobile Bay",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Historic architecture",
      },
    ],
    ak: [
      {
        src: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
        caption: "Denali National Park",
      },
      {
        src: "https://images.unsplash.com/photo-1541459131820-b49b5f15bdb7?w=800&q=80",
        caption: "Northern Lights",
      },
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Alaskan wilderness",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Glacier Bay",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Alaska coastline",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Tundra at sunset",
      },
    ],
    az: [
      {
        src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
        caption: "Grand Canyon",
      },
      {
        src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
        caption: "Sedona red rocks",
      },
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        caption: "Saguaro desert",
      },
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Monument Valley",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Phoenix skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Antelope Canyon",
      },
    ],
    ar: [
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Ozark Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Buffalo River",
      },
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Hot Springs",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Arkansas Delta",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Autumn foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Little Rock",
      },
    ],
    ca: [
      {
        src: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800&q=80",
        caption: "Golden Gate Bridge",
      },
      {
        src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
        caption: "Redwood forest",
      },
      {
        src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
        caption: "Yosemite Valley",
      },
      {
        src: "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=800&q=80",
        caption: "Los Angeles skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Big Sur coastline",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Sierra Nevada peaks",
      },
    ],
    co: [
      {
        src: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
        caption: "Rocky Mountain peaks",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Denver skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Alpine meadows",
      },
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Mount Elbert summit",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Mesa Verde",
      },
      {
        src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
        caption: "Garden of the Gods",
      },
    ],
    ct: [
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "New Haven harbor",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "New England village",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Connecticut shoreline",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Hartford skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Mystic seaport",
      },
    ],
    de: [
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Delaware beaches",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Wilmington waterfront",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "Colonial Wilmington",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall along the river",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Dover cityscape",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Delaware Bay",
      },
    ],
    fl: [
      {
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        caption: "Miami Beach",
      },
      {
        src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        caption: "Gulf Coast sunset",
      },
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Everglades wetlands",
      },
      {
        src: "https://images.unsplash.com/photo-1590093444774-7cc7fb5e1225?w=800&q=80",
        caption: "Florida Keys",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Orlando skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1549893072-4bc678117f45?w=800&q=80",
        caption: "St. Augustine",
      },
    ],
    ga: [
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Atlanta skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Georgia forest",
      },
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Savannah squares",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Blue Ridge foothills",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Antebellum architecture",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Georgia coastline",
      },
    ],
    hi: [
      {
        src: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=800&q=80",
        caption: "Waimea Canyon",
      },
      {
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        caption: "Waikiki Beach",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Na Pali coastline",
      },
      {
        src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        caption: "Hawaiian sunset",
      },
      {
        src: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80",
        caption: "Mauna Kea volcano",
      },
      {
        src: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80",
        caption: "Tropical rainforest",
      },
    ],
    id: [
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Sawtooth Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Snake River Canyon",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Idaho prairie",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Craters of the Moon",
      },
      {
        src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
        caption: "Boise foothills",
      },
      {
        src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
        caption: "Hells Canyon",
      },
    ],
    il: [
      {
        src: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80",
        caption: "Chicago skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Chicago waterfront",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Illinois farmland",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Prairie grain fields",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Corn harvest",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Mississippi River",
      },
    ],
    in: [
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Indiana cornfields",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Indiana plains",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Indianapolis skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Hoosier woodland",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Lake Michigan dunes",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Harvest season",
      },
    ],
    ia: [
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Iowa corn fields",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Iowa prairie",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Harvest time",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Mississippi River bluffs",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Autumn farmland",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Iowa River",
      },
    ],
    ks: [
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Kansas horizon",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Wheat fields",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Tallgrass prairie",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Harvest season",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Flint Hills",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Arkansas River",
      },
    ],
    ky: [
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Kentucky Bluegrass",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Daniel Boone Forest",
      },
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Mammoth Cave",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Ohio River",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Horse country",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Rolling hills",
      },
    ],
    la: [
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Louisiana bayou",
      },
      {
        src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        caption: "Gulf Coast sunset",
      },
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "New Orleans skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "French Quarter",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Cypress swamp",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Mississippi River Delta",
      },
    ],
    me: [
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Maine rocky coast",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "Acadia National Park",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Portland harbor",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Maine coastline",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Fishing village",
      },
    ],
    md: [
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Chesapeake Bay",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Eastern Shore",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Baltimore inner harbor",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Autumn in Annapolis",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Historic district",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Blue Ridge foothills",
      },
    ],
    ma: [
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Boston skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Boston harbor",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Cape Cod autumn",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "New England village",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Cape Cod shoreline",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Nantucket harbor",
      },
    ],
    mi: [
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Great Lakes shoreline",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Detroit skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Upper Peninsula forest",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Michigan farmland",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall color drive",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Mackinac Island",
      },
    ],
    mn: [
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Land of 10,000 Lakes",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Boundary Waters",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Minneapolis skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Minnesota prairie",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Autumn foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Wheat fields",
      },
    ],
    ms: [
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Mississippi bayou",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Gulf Coast",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Delta woodlands",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Antebellum homes",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Natchez Trace",
      },
      {
        src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        caption: "Mississippi sunset",
      },
    ],
    mo: [
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "St. Louis Gateway Arch",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Ozark forest",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Missouri plains",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Missouri River",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Rolling hills",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Missouri farmland",
      },
    ],
    mt: [
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Glacier National Park",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Beartooth Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Big Sky country",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Montana river",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Eastern Montana plains",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Autumn wilderness",
      },
    ],
    ne: [
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Nebraska Sandhills",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Wheat harvest",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Great Plains horizon",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Cornhusker fields",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Platte River",
      },
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Pine Ridge",
      },
    ],
    nv: [
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        caption: "Nevada desert",
      },
      {
        src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
        caption: "Red Rock Canyon",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Las Vegas skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Valley of Fire",
      },
      {
        src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
        caption: "Black Rock Desert",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Lake Tahoe",
      },
    ],
    nh: [
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "White Mountains foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "White Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "New Hampshire seacoast",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Portsmouth harbor",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Lake Winnipesaukee",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Granite Peak",
      },
    ],
    nj: [
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Jersey Shore",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Hudson River waterfront",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Newark skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Pine Barrens autumn",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "Delaware River",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Atlantic City boardwalk",
      },
    ],
    nm: [
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        caption: "White Sands",
      },
      {
        src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
        caption: "Santa Fe adobe",
      },
      {
        src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
        caption: "New Mexico desert",
      },
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Carlsbad Caverns",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Albuquerque hot air balloons",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Sandia Mountains",
      },
    ],
    ny: [
      {
        src: "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&q=80",
        caption: "New York skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Manhattan at night",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Hudson River",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Adirondack foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Long Island Sound",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Niagara Falls",
      },
    ],
    nc: [
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Blue Ridge Parkway",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Outer Banks",
      },
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Charlotte skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Smoky Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall in the Piedmont",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Historic Wilmington",
      },
    ],
    nd: [
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "North Dakota badlands",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Wheat harvest",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Great Plains",
      },
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Theodore Roosevelt NP",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Missouri River",
      },
      {
        src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
        caption: "Sunflower fields",
      },
    ],
    oh: [
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Columbus skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Lake Erie shoreline",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Ohio farmland",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Hocking Hills",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Ohio autumn",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Corn Belt harvest",
      },
    ],
    ok: [
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Oklahoma plains",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Tallgrass prairie",
      },
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Wichita Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Wheat fields",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Oklahoma Ozarks",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Arkansas River",
      },
    ],
    or: [
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Oregon coastline",
      },
      {
        src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
        caption: "Oregon forest",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Crater Lake",
      },
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Mount Hood",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Portland skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Columbia River Gorge",
      },
    ],
    pa: [
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Philadelphia skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Pennsylvania hills",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Pocono forests",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Amish country",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Delaware River",
      },
    ],
    ri: [
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Rhode Island coast",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Newport harbor",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Narragansett Bay",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Gilded Age mansions",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Autumn in Providence",
      },
      {
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        caption: "Providence skyline",
      },
    ],
    sc: [
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Myrtle Beach",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Charleston historic district",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Congaree forest",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Blue Ridge foothills",
      },
      {
        src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        caption: "Low Country sunset",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Autumn along the river",
      },
    ],
    sd: [
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Badlands",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Black Hills",
      },
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Mount Rushmore",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Great Plains",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Wheat harvest",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Wind Cave National Park",
      },
    ],
    tn: [
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Nashville skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Great Smoky Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Tennessee forest",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Fall foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Memphis historic district",
      },
      {
        src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
        caption: "Tennessee River",
      },
    ],
    tx: [
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Houston skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Austin skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        caption: "Big Bend desert",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Texas Hill Country",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Texas plains",
      },
      {
        src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        caption: "Gulf of Mexico",
      },
    ],
    ut: [
      {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
        caption: "Zion National Park",
      },
      {
        src: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
        caption: "Bryce Canyon",
      },
      {
        src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
        caption: "Arches National Park",
      },
      {
        src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        caption: "Monument Valley",
      },
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Wasatch Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Salt Lake City",
      },
    ],
    vt: [
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Vermont fall foliage",
      },
      {
        src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
        caption: "New England village",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Green Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        caption: "Lake Champlain",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Vermont countryside",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Maple sugar farm",
      },
    ],
    va: [
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Shenandoah Valley",
      },
      {
        src: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
        caption: "Richmond skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        caption: "Chesapeake Bay",
      },
      {
        src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
        caption: "Colonial Williamsburg",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Blue Ridge in fall",
      },
      {
        src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
        caption: "Virginia Beach",
      },
    ],
    wa: [
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Seattle skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Mount Rainier",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Olympic Peninsula coast",
      },
      {
        src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
        caption: "Hoh Rain Forest",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Eastern Washington wheat",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Cascade volcanoes",
      },
    ],
    wv: [
      {
        src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
        caption: "Appalachian Mountains",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "New River Gorge",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Autumn in the hills",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Seneca Rocks",
      },
      {
        src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        caption: "Blackwater Falls",
      },
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Gauley River",
      },
    ],
    wi: [
      {
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        caption: "Lake Michigan shoreline",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Wisconsin dairy farms",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Northwoods forest",
      },
      {
        src: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&q=80",
        caption: "Milwaukee skyline",
      },
      {
        src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
        caption: "Door County autumn",
      },
      {
        src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
        caption: "Corn fields",
      },
    ],
    wy: [
      {
        src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        caption: "Grand Teton",
      },
      {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        caption: "Yellowstone geysers",
      },
      {
        src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
        caption: "Wyoming plains",
      },
      {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
        caption: "Wind River Range",
      },
      {
        src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        caption: "Snake River",
      },
      {
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
        caption: "Autumn wilderness",
      },
    ],
  };

// Fallback images by region if state not in map
const _REGION_FALLBACK_UNUSED: Record<
  string,
  { src: string; caption: string }[]
> = {
  West: [
    {
      src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      caption: "Pacific coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      caption: "Rocky mountain peaks",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "Alpine wilderness",
    },
    {
      src: "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=800&q=80",
      caption: "Desert landscape",
    },
    {
      src: "https://images.unsplash.com/photo-1568631177851-f5bfbb0f2e1a?w=800&q=80",
      caption: "Redwood forest",
    },
    {
      src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
      caption: "Golden meadow",
    },
  ],
  South: [
    {
      src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      caption: "Bayou waterway",
    },
    {
      src: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
      caption: "Southern coastline",
    },
    {
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      caption: "Gulf sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      caption: "Historic architecture",
    },
    {
      src: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&q=80",
      caption: "Appalachian foothills",
    },
    {
      src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      caption: "Autumn woodland",
    },
  ],
  Northeast: [
    {
      src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
      caption: "City skyline",
    },
    {
      src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      caption: "Urban waterfront",
    },
    {
      src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&q=80",
      caption: "Fall foliage",
    },
    {
      src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      caption: "Atlantic shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      caption: "New England village",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      caption: "Harbor at dusk",
    },
  ],
  Midwest: [
    {
      src: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800&q=80",
      caption: "Golden wheat fields",
    },
    {
      src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
      caption: "Prairie horizon",
    },
    {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      caption: "Great Lakes shoreline",
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      caption: "Farmland at sunset",
    },
    {
      src: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80",
      caption: "Corn harvest",
    },
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      caption: "River valley",
    },
  ],
};

// ─── Per-state Education Data ────────────────────────────────────────────────
interface StateUniversity {
  name: string;
  rankTag?: string;
  type:
    | "Public"
    | "Private"
    | "Technical"
    | "Research"
    | "Liberal Arts"
    | "HBCU";
}
interface StateEducationData {
  literacyRate: number;
  avgSchoolingYears: number;
  topSchools: StateUniversity[];
  eduNotes?: string;
}

const STATE_EDUCATION: Record<string, StateEducationData> = {
  al: {
    literacyRate: 84,
    avgSchoolingYears: 12.8,
    topSchools: [
      {
        name: "University of Alabama",
        rankTag: "#133 National Univ.",
        type: "Public",
      },
      {
        name: "Auburn University",
        rankTag: "#101 National Univ.",
        type: "Public",
      },
      {
        name: "University of Alabama at Birmingham (UAB)",
        rankTag: "Top Research",
        type: "Research",
      },
      { name: "Alabama A&M University", rankTag: "#1 HBCU Eng.", type: "HBCU" },
    ],
    eduNotes:
      "Ranked #48 nationally. Strong football-university culture. UAB has a top-tier medical school.",
  },
  ak: {
    literacyRate: 92,
    avgSchoolingYears: 13.2,
    topSchools: [
      {
        name: "University of Alaska Fairbanks",
        rankTag: "#Top Arctic Research",
        type: "Research",
      },
      {
        name: "University of Alaska Anchorage",
        rankTag: "#Largest UA Campus",
        type: "Public",
      },
      {
        name: "Alaska Pacific University",
        rankTag: "Top Private AK",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #35 nationally. Small population; strong outdoor and environmental science programs.",
  },
  az: {
    literacyRate: 86,
    avgSchoolingYears: 12.9,
    topSchools: [
      {
        name: "Arizona State University (ASU)",
        rankTag: "#103 National / #1 Innovation",
        type: "Public",
      },
      {
        name: "University of Arizona",
        rankTag: "#117 National Univ.",
        type: "Research",
      },
      {
        name: "Grand Canyon University",
        rankTag: "Largest Christian Univ.",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #39 nationally. ASU is the largest US university by enrollment (~78K students).",
  },
  ar: {
    literacyRate: 84,
    avgSchoolingYears: 12.5,
    topSchools: [
      {
        name: "University of Arkansas",
        rankTag: "#152 National Univ.",
        type: "Public",
      },
      {
        name: "Arkansas Tech University",
        rankTag: "Top Public AR",
        type: "Public",
      },
      {
        name: "Hendrix College",
        rankTag: "#7 Liberal Arts South",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #50 nationally. Known for Walmart-funded Walton Arts programs at U of Arkansas.",
  },
  ca: {
    literacyRate: 93,
    avgSchoolingYears: 13.6,
    topSchools: [
      {
        name: "Stanford University",
        rankTag: "#3 National / #5 World",
        type: "Private",
      },
      {
        name: "Caltech (Pasadena)",
        rankTag: "#9 National / #10 World",
        type: "Technical",
      },
      {
        name: "UC Berkeley",
        rankTag: "#22 National / #12 World (Public)",
        type: "Public",
      },
      { name: "UCLA", rankTag: "#20 National", type: "Public" },
      { name: "USC", rankTag: "#25 National", type: "Research" },
    ],
    eduNotes:
      "Ranked #23 nationally. 9 UC campuses + 23 CSU campuses. Silicon Valley talent pipeline is unmatched globally.",
  },
  co: {
    literacyRate: 93,
    avgSchoolingYears: 13.8,
    topSchools: [
      {
        name: "University of Colorado Boulder (CU)",
        rankTag: "#101 National Univ.",
        type: "Research",
      },
      {
        name: "Colorado State University",
        rankTag: "#174 National Univ.",
        type: "Public",
      },
      {
        name: "Colorado School of Mines",
        rankTag: "#76 National / #1 Engineering CO",
        type: "Technical",
      },
      {
        name: "University of Denver",
        rankTag: "Top Private CO",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #8 nationally. High college-educated workforce; strong outdoor recreation and aerospace industries.",
  },
  ct: {
    literacyRate: 94,
    avgSchoolingYears: 14.2,
    topSchools: [
      {
        name: "Yale University",
        rankTag: "#5 National / Ivy League",
        type: "Private",
      },
      {
        name: "University of Connecticut (UConn)",
        rankTag: "#53 National Public",
        type: "Public",
      },
      {
        name: "Wesleyan University",
        rankTag: "#17 Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "Trinity College",
        rankTag: "Top Liberal Arts CT",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #6 nationally. Yale is one of the world's top universities. CT has the 3rd-highest per-capita income in the US.",
  },
  de: {
    literacyRate: 90,
    avgSchoolingYears: 13.2,
    topSchools: [
      {
        name: "University of Delaware",
        rankTag: "#99 National Univ.",
        type: "Research",
      },
      {
        name: "Delaware State University",
        rankTag: "Top HBCU DE",
        type: "HBCU",
      },
      {
        name: "Widener University (DE campus)",
        rankTag: "Top Private DE",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #26 nationally. Small state; UD produces major alumni in business and policy.",
  },
  fl: {
    literacyRate: 88,
    avgSchoolingYears: 13.0,
    topSchools: [
      {
        name: "University of Florida (UF Gainesville)",
        rankTag: "#28 National Public",
        type: "Public",
      },
      {
        name: "Florida State University (FSU)",
        rankTag: "#55 National Univ.",
        type: "Public",
      },
      {
        name: "University of Miami",
        rankTag: "#55 National Univ.",
        type: "Private",
      },
      {
        name: "Florida International University (FIU)",
        rankTag: "Top Research FL",
        type: "Public",
      },
    ],
    eduNotes:
      "Ranked #31 nationally. UF is a top public research university. Strong STEM and legal programs.",
  },
  ga: {
    literacyRate: 88,
    avgSchoolingYears: 13.2,
    topSchools: [
      {
        name: "Georgia Institute of Technology (Georgia Tech)",
        rankTag: "#33 National / Top Engineering",
        type: "Technical",
      },
      {
        name: "Emory University",
        rankTag: "#21 National Univ.",
        type: "Private",
      },
      {
        name: "University of Georgia (UGA)",
        rankTag: "#46 National Public",
        type: "Public",
      },
      { name: "Spelman College", rankTag: "#1 HBCU Women's", type: "HBCU" },
    ],
    eduNotes:
      "Ranked #33 nationally. Georgia Tech is a world-class STEM school; Spelman & Morehouse are premier HBCUs.",
  },
  hi: {
    literacyRate: 94,
    avgSchoolingYears: 13.4,
    topSchools: [
      {
        name: "University of Hawaii at Manoa",
        rankTag: "#182 National Univ.",
        type: "Research",
      },
      {
        name: "Hawaii Pacific University",
        rankTag: "Top Private HI",
        type: "Private",
      },
      {
        name: "Chaminade University",
        rankTag: "Top Catholic HI",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #12 nationally. Strong marine biology, Pacific Rim studies, and indigenous Hawaiian studies programs.",
  },
  id: {
    literacyRate: 91,
    avgSchoolingYears: 13.0,
    topSchools: [
      {
        name: "University of Idaho",
        rankTag: "#211 National Univ.",
        type: "Public",
      },
      {
        name: "Boise State University",
        rankTag: "Top Research ID",
        type: "Public",
      },
      {
        name: "Idaho State University",
        rankTag: "Top Pharmacy/Health ID",
        type: "Public",
      },
    ],
    eduNotes:
      "Ranked #30 nationally. Boise State is expanding rapidly with tech and health programs.",
  },
  il: {
    literacyRate: 91,
    avgSchoolingYears: 13.7,
    topSchools: [
      {
        name: "University of Chicago",
        rankTag: "#12 National / #11 World",
        type: "Private",
      },
      {
        name: "Northwestern University",
        rankTag: "#9 National",
        type: "Private",
      },
      {
        name: "University of Illinois Urbana-Champaign (UIUC)",
        rankTag: "#35 National Public / #1 CS Public",
        type: "Public",
      },
      {
        name: "DePaul University",
        rankTag: "Top Private Chicago",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #25 nationally. U of Chicago economics school shaped modern economics (Chicago School). UIUC CS is elite globally.",
  },
  in: {
    literacyRate: 89,
    avgSchoolingYears: 13.0,
    topSchools: [
      {
        name: "Notre Dame (University of Notre Dame)",
        rankTag: "#18 National",
        type: "Private",
      },
      {
        name: "Purdue University",
        rankTag: "#53 National / Top STEM",
        type: "Technical",
      },
      {
        name: "Indiana University Bloomington (IU)",
        rankTag: "#72 National",
        type: "Public",
      },
      {
        name: "Butler University",
        rankTag: "Top Private IN",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #40 nationally. Notre Dame is a top-20 national university. Purdue has produced 25+ astronauts.",
  },
  ia: {
    literacyRate: 93,
    avgSchoolingYears: 13.5,
    topSchools: [
      {
        name: "University of Iowa",
        rankTag: "#89 National Univ.",
        type: "Research",
      },
      {
        name: "Iowa State University",
        rankTag: "#133 National / Top Ag+Eng",
        type: "Technical",
      },
      {
        name: "Grinnell College",
        rankTag: "#17 Liberal Arts",
        type: "Liberal Arts",
      },
      { name: "Drake University", rankTag: "Top Private IA", type: "Private" },
    ],
    eduNotes:
      "Ranked #13 nationally. Iowa City is a UNESCO City of Literature; UI has one of the US's top writing programs.",
  },
  ks: {
    literacyRate: 91,
    avgSchoolingYears: 13.4,
    topSchools: [
      {
        name: "University of Kansas (KU Lawrence)",
        rankTag: "#152 National Univ.",
        type: "Public",
      },
      {
        name: "Kansas State University (K-State)",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      {
        name: "Wichita State University",
        rankTag: "Top Aerospace Engineering KS",
        type: "Technical",
      },
    ],
    eduNotes:
      "Ranked #22 nationally. KU Medical Center is one of the Midwest's top health research campuses.",
  },
  ky: {
    literacyRate: 86,
    avgSchoolingYears: 12.8,
    topSchools: [
      {
        name: "University of Kentucky (UK)",
        rankTag: "#152 National Univ.",
        type: "Research",
      },
      {
        name: "University of Louisville",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      {
        name: "Berea College",
        rankTag: "#1 Service/Tuition-Free Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "Centre College",
        rankTag: "Top Liberal Arts KY",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #44 nationally. Berea College is unique — charges no tuition and requires student work programs.",
  },
  la: {
    literacyRate: 85,
    avgSchoolingYears: 12.7,
    topSchools: [
      {
        name: "Tulane University",
        rankTag: "#44 National Univ.",
        type: "Private",
      },
      {
        name: "Louisiana State University (LSU)",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      {
        name: "Xavier University of Louisiana",
        rankTag: "#1 HBCU Pharmacy",
        type: "HBCU",
      },
      {
        name: "Loyola University New Orleans",
        rankTag: "Top Catholic LA",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #49 nationally. Xavier HBCU sends more Black students to med school than any other US institution.",
  },
  me: {
    literacyRate: 94,
    avgSchoolingYears: 13.6,
    topSchools: [
      {
        name: "Bowdoin College",
        rankTag: "#6 Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "Colby College",
        rankTag: "#12 Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "Bates College",
        rankTag: "#24 Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "University of Maine",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
    ],
    eduNotes:
      "Ranked #16 nationally. Maine has a remarkable concentration of elite liberal arts colleges (Bowdoin, Colby, Bates).",
  },
  md: {
    literacyRate: 93,
    avgSchoolingYears: 14.1,
    topSchools: [
      {
        name: "Johns Hopkins University",
        rankTag: "#9 National / #1 Research Output",
        type: "Research",
      },
      {
        name: "University of Maryland, College Park",
        rankTag: "#55 National Public",
        type: "Public",
      },
      {
        name: "United States Naval Academy",
        rankTag: "#1 Service Academy",
        type: "Technical",
      },
      {
        name: "Loyola University Maryland",
        rankTag: "Top Jesuit MD",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #3 nationally. JHU is the US's top research university by federal funding. NIH/NSF proximity in DC corridor creates unmatched research ecosystem.",
  },
  ma: {
    literacyRate: 96,
    avgSchoolingYears: 14.6,
    topSchools: [
      {
        name: "MIT (Massachusetts Institute of Technology)",
        rankTag: "#1 National / #1 World Engineering",
        type: "Technical",
      },
      {
        name: "Harvard University",
        rankTag: "#3 National / #4 World",
        type: "Private",
      },
      { name: "Tufts University", rankTag: "#28 National", type: "Research" },
      { name: "Boston University", rankTag: "#39 National", type: "Research" },
      {
        name: "Amherst College",
        rankTag: "#2 Liberal Arts",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #1 nationally. The Boston-Cambridge corridor hosts 52+ universities; MIT and Harvard are global academic titans.",
  },
  mi: {
    literacyRate: 90,
    avgSchoolingYears: 13.3,
    topSchools: [
      {
        name: "University of Michigan (Ann Arbor)",
        rankTag: "#23 National / #30 World",
        type: "Research",
      },
      {
        name: "Michigan State University (MSU)",
        rankTag: "#80 National",
        type: "Public",
      },
      {
        name: "Wayne State University",
        rankTag: "Top Research Detroit",
        type: "Research",
      },
      {
        name: "Kalamazoo College",
        rankTag: "Top Liberal Arts MI",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #27 nationally. U of M is one of the top public research universities in the world with a $17B+ endowment.",
  },
  mn: {
    literacyRate: 93,
    avgSchoolingYears: 13.8,
    topSchools: [
      {
        name: "University of Minnesota Twin Cities",
        rankTag: "#55 National / Top Research",
        type: "Research",
      },
      {
        name: "Carleton College",
        rankTag: "#7 Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "Macalester College",
        rankTag: "#24 Liberal Arts",
        type: "Liberal Arts",
      },
      {
        name: "St. Olaf College",
        rankTag: "Top Lutheran Liberal Arts",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #4 nationally. Minnesota has outstanding liberal arts colleges. High educational attainment mirrors Scandinavian heritage.",
  },
  ms: {
    literacyRate: 83,
    avgSchoolingYears: 12.5,
    topSchools: [
      {
        name: "University of Mississippi (Ole Miss)",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      {
        name: "Mississippi State University",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      { name: "Tougaloo College", rankTag: "Top HBCU MS", type: "HBCU" },
      {
        name: "Millsaps College",
        rankTag: "Top Liberal Arts MS",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #51 nationally (last). Despite challenges, Ole Miss Law School and MS State engineering are improving.",
  },
  mo: {
    literacyRate: 90,
    avgSchoolingYears: 13.3,
    topSchools: [
      {
        name: "Washington University in St. Louis (WashU)",
        rankTag: "#24 National",
        type: "Private",
      },
      {
        name: "University of Missouri (Mizzou)",
        rankTag: "#133 National Univ.",
        type: "Public",
      },
      {
        name: "Saint Louis University",
        rankTag: "Top Jesuit MO",
        type: "Private",
      },
      {
        name: "Truman State University",
        rankTag: "#1 Public Liberal Arts MO",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #36 nationally. WashU is a top-25 research university; strong in medicine, engineering, and law.",
  },
  mt: {
    literacyRate: 93,
    avgSchoolingYears: 13.2,
    topSchools: [
      {
        name: "University of Montana",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      {
        name: "Montana State University (MSU Bozeman)",
        rankTag: "Top STEM MT",
        type: "Technical",
      },
      {
        name: "Carroll College",
        rankTag: "Top Private Liberal Arts MT",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #29 nationally. MSU Bozeman's engineering and tech programs are growing with Bozeman's tech boom.",
  },
  ne: {
    literacyRate: 92,
    avgSchoolingYears: 13.4,
    topSchools: [
      {
        name: "University of Nebraska-Lincoln (UNL)",
        rankTag: "#152 National Univ.",
        type: "Research",
      },
      {
        name: "Creighton University",
        rankTag: "Top Jesuit NE",
        type: "Private",
      },
      {
        name: "Nebraska Wesleyan University",
        rankTag: "Top Liberal Arts NE",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #18 nationally. Creighton has strong medical and pharmacy schools. Unicameral legislature reflects civic education values.",
  },
  nv: {
    literacyRate: 85,
    avgSchoolingYears: 12.7,
    topSchools: [
      {
        name: "University of Nevada, Las Vegas (UNLV)",
        rankTag: "#276 National Univ.",
        type: "Public",
      },
      {
        name: "University of Nevada, Reno (UNR)",
        rankTag: "#195 National Univ.",
        type: "Research",
      },
      {
        name: "Nevada State University",
        rankTag: "Newest State Univ. NV",
        type: "Public",
      },
    ],
    eduNotes:
      "Ranked #47 nationally. Hospitality management at UNLV is world-class; higher education investing heavily post-2020.",
  },
  nh: {
    literacyRate: 95,
    avgSchoolingYears: 14.0,
    topSchools: [
      {
        name: "Dartmouth College",
        rankTag: "#12 National / Ivy League",
        type: "Private",
      },
      {
        name: "University of New Hampshire (UNH)",
        rankTag: "#152 National Univ.",
        type: "Public",
      },
      {
        name: "Keene State College",
        rankTag: "Top Public Liberal Arts NH",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #7 nationally. Dartmouth is an Ivy League university and one of the country's premier research institutions.",
  },
  nj: {
    literacyRate: 93,
    avgSchoolingYears: 14.0,
    topSchools: [
      {
        name: "Princeton University",
        rankTag: "#1 National (tie) / Ivy League",
        type: "Private",
      },
      {
        name: "Rutgers University–New Brunswick",
        rankTag: "#52 National Public",
        type: "Research",
      },
      {
        name: "Stevens Institute of Technology",
        rankTag: "Top Engineering NJ",
        type: "Technical",
      },
      {
        name: "Seton Hall University",
        rankTag: "Top Catholic NJ",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #5 nationally. Princeton is the #1 national university. NJ has the highest percentage of college graduates per capita.",
  },
  nm: {
    literacyRate: 83,
    avgSchoolingYears: 12.8,
    topSchools: [
      {
        name: "University of New Mexico (UNM)",
        rankTag: "#195 National Univ.",
        type: "Research",
      },
      {
        name: "New Mexico State University (NMSU)",
        rankTag: "Top Ag+Eng NM",
        type: "Public",
      },
      {
        name: "New Mexico Institute of Mining & Technology (NM Tech)",
        rankTag: "Top STEM NM",
        type: "Technical",
      },
    ],
    eduNotes:
      "Ranked #46 nationally. NM Tech has a strong STEM track; Sandia and Los Alamos national labs nearby.",
  },
  ny: {
    literacyRate: 93,
    avgSchoolingYears: 14.0,
    topSchools: [
      {
        name: "Columbia University",
        rankTag: "#12 National / Ivy League",
        type: "Private",
      },
      {
        name: "Cornell University",
        rankTag: "#15 National / Ivy League",
        type: "Research",
      },
      {
        name: "New York University (NYU)",
        rankTag: "#35 National",
        type: "Research",
      },
      {
        name: "Rensselaer Polytechnic Institute (RPI)",
        rankTag: "Top Engineering NY",
        type: "Technical",
      },
      {
        name: "Vassar College",
        rankTag: "#12 Liberal Arts",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #14 nationally. NYC is home to world-class universities. Columbia, Cornell and NYU produce massive global impact.",
  },
  nc: {
    literacyRate: 89,
    avgSchoolingYears: 13.2,
    topSchools: [
      {
        name: "Duke University",
        rankTag: "#7 National / #17 World",
        type: "Private",
      },
      {
        name: "UNC Chapel Hill",
        rankTag: "#28 National Public / Top Law+Med",
        type: "Public",
      },
      {
        name: "Wake Forest University",
        rankTag: "#24 National Univ.",
        type: "Private",
      },
      {
        name: "NC State University",
        rankTag: "Top Engineering NC",
        type: "Technical",
      },
    ],
    eduNotes:
      "Ranked #28 nationally. Research Triangle (Duke, UNC, NC State) is one of the world's top academic clusters.",
  },
  nd: {
    literacyRate: 93,
    avgSchoolingYears: 13.5,
    topSchools: [
      {
        name: "University of North Dakota (UND)",
        rankTag: "#266 National Univ.",
        type: "Public",
      },
      {
        name: "North Dakota State University (NDSU)",
        rankTag: "Top Research ND",
        type: "Research",
      },
      {
        name: "Bismarck State College",
        rankTag: "Top 2-Year ND",
        type: "Public",
      },
    ],
    eduNotes:
      "Ranked #20 nationally. High graduation rates relative to population. NDSU engineering and pharmacy are strong.",
  },
  oh: {
    literacyRate: 90,
    avgSchoolingYears: 13.3,
    topSchools: [
      {
        name: "Ohio State University (Columbus)",
        rankTag: "#35 National Public / #1 OH",
        type: "Public",
      },
      {
        name: "Case Western Reserve University",
        rankTag: "#53 National",
        type: "Research",
      },
      {
        name: "Oberlin College",
        rankTag: "#2 Liberal Arts + Conservatory",
        type: "Liberal Arts",
      },
      {
        name: "University of Cincinnati",
        rankTag: "#Top Engineering Co-op",
        type: "Technical",
      },
    ],
    eduNotes:
      "Ranked #24 nationally. OSU is one of the largest universities in the US. Oberlin has the oldest coeducational and racial integration history.",
  },
  ok: {
    literacyRate: 87,
    avgSchoolingYears: 12.9,
    topSchools: [
      {
        name: "University of Oklahoma (OU Norman)",
        rankTag: "#195 National Univ.",
        type: "Public",
      },
      {
        name: "Oklahoma State University (OSU)",
        rankTag: "#195 National Univ.",
        type: "Public",
      },
      {
        name: "Oral Roberts University",
        rankTag: "Top Christian OK",
        type: "Private",
      },
      {
        name: "University of Tulsa",
        rankTag: "Top Private OK",
        type: "Research",
      },
    ],
    eduNotes:
      "Ranked #45 nationally. OU petroleum engineering is one of the best in the world.",
  },
  or: {
    literacyRate: 91,
    avgSchoolingYears: 13.5,
    topSchools: [
      {
        name: "University of Oregon (UO Eugene)",
        rankTag: "#104 National Univ.",
        type: "Public",
      },
      {
        name: "Oregon State University (OSU)",
        rankTag: "#133 National Univ.",
        type: "Research",
      },
      {
        name: "Reed College",
        rankTag: "#78 Liberal Arts / Top Science",
        type: "Liberal Arts",
      },
      {
        name: "Lewis & Clark College",
        rankTag: "Top Liberal Arts OR",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #19 nationally. Reed College is known as producing more Rhodes Scholars per capita than most schools.",
  },
  pa: {
    literacyRate: 92,
    avgSchoolingYears: 13.8,
    topSchools: [
      {
        name: "University of Pennsylvania (Penn)",
        rankTag: "#6 National / Ivy League",
        type: "Private",
      },
      {
        name: "Carnegie Mellon University (CMU)",
        rankTag: "#22 National / #1 AI+CS",
        type: "Technical",
      },
      {
        name: "Villanova University",
        rankTag: "Top Catholic PA",
        type: "Private",
      },
      {
        name: "Penn State University Park",
        rankTag: "#67 National Public",
        type: "Public",
      },
      {
        name: "Swarthmore College",
        rankTag: "#3 Liberal Arts",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #15 nationally. CMU's CS and AI programs are world-class; Penn's Wharton School is the top undergrad business program.",
  },
  ri: {
    literacyRate: 91,
    avgSchoolingYears: 13.6,
    topSchools: [
      {
        name: "Brown University",
        rankTag: "#9 National / Ivy League",
        type: "Private",
      },
      {
        name: "Rhode Island School of Design (RISD)",
        rankTag: "#1 Art+Design School",
        type: "Research",
      },
      {
        name: "Roger Williams University",
        rankTag: "Top Law RI",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #21 nationally. Brown has the Open Curriculum (no core requirements). RISD is globally renowned in art and design.",
  },
  sc: {
    literacyRate: 86,
    avgSchoolingYears: 13.0,
    topSchools: [
      {
        name: "Clemson University",
        rankTag: "#74 National / Top Engineering",
        type: "Technical",
      },
      {
        name: "University of South Carolina (UofSC)",
        rankTag: "#110 National Univ.",
        type: "Public",
      },
      {
        name: "College of Charleston",
        rankTag: "Top Public Liberal Arts SC",
        type: "Liberal Arts",
      },
      {
        name: "Furman University",
        rankTag: "#43 Liberal Arts",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #43 nationally. Clemson's automotive engineering program is boosted by BMW and Michelin plants nearby.",
  },
  sd: {
    literacyRate: 92,
    avgSchoolingYears: 13.4,
    topSchools: [
      {
        name: "South Dakota State University (SDSU)",
        rankTag: "#175 National Univ.",
        type: "Public",
      },
      {
        name: "University of South Dakota (USD)",
        rankTag: "Top Law+Medicine SD",
        type: "Public",
      },
      {
        name: "Augustana University",
        rankTag: "Top Private Liberal Arts SD",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #17 nationally. High graduation rates; SDSU's dairy science and ag programs are nationally recognized.",
  },
  tn: {
    literacyRate: 87,
    avgSchoolingYears: 12.9,
    topSchools: [
      {
        name: "Vanderbilt University",
        rankTag: "#18 National",
        type: "Private",
      },
      {
        name: "University of Tennessee Knoxville (UTK)",
        rankTag: "#104 National Univ.",
        type: "Public",
      },
      {
        name: "Rhodes College",
        rankTag: "#51 Liberal Arts",
        type: "Liberal Arts",
      },
      { name: "Fisk University", rankTag: "Historic HBCU TN", type: "HBCU" },
    ],
    eduNotes:
      "Ranked #41 nationally. Vanderbilt is a top-20 national university with world-class medical and business schools.",
  },
  tx: {
    literacyRate: 88,
    avgSchoolingYears: 13.0,
    topSchools: [
      {
        name: "University of Texas at Austin (UT Austin)",
        rankTag: "#32 National Public / Top Business+Law",
        type: "Public",
      },
      {
        name: "Rice University",
        rankTag: "#17 National / #1 TX Private",
        type: "Research",
      },
      {
        name: "Texas A&M University",
        rankTag: "#52 National Public",
        type: "Research",
      },
      {
        name: "SMU (Southern Methodist University)",
        rankTag: "Top Business TX",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #38 nationally. UT Austin is a flagship research giant; Rice is in the global elite for science.",
  },
  ut: {
    literacyRate: 93,
    avgSchoolingYears: 13.8,
    topSchools: [
      {
        name: "University of Utah",
        rankTag: "#104 National Univ. / Top Silicon Slopes",
        type: "Research",
      },
      {
        name: "Brigham Young University (BYU)",
        rankTag: "#105 National Univ.",
        type: "Private",
      },
      {
        name: "Utah State University (USU)",
        rankTag: "Top Ag+Eng UT",
        type: "Public",
      },
      {
        name: "Westminster University",
        rankTag: "Top Private Liberal Arts UT",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #10 nationally. 'Silicon Slopes' tech ecosystem centers on U of Utah and BYU alumni networks.",
  },
  vt: {
    literacyRate: 95,
    avgSchoolingYears: 14.2,
    topSchools: [
      {
        name: "Middlebury College",
        rankTag: "#6 Liberal Arts / Top Languages",
        type: "Liberal Arts",
      },
      {
        name: "University of Vermont (UVM)",
        rankTag: "#104 National Univ.",
        type: "Research",
      },
      {
        name: "Norwich University",
        rankTag: "Oldest Military College US",
        type: "Technical",
      },
    ],
    eduNotes:
      "Ranked #9 nationally. Middlebury's language schools are the gold standard for language immersion in the US.",
  },
  va: {
    literacyRate: 92,
    avgSchoolingYears: 14.1,
    topSchools: [
      {
        name: "University of Virginia (UVA)",
        rankTag: "#25 National / #3 Public",
        type: "Public",
      },
      {
        name: "William & Mary",
        rankTag: "#33 National Public / 2nd Oldest US",
        type: "Public",
      },
      {
        name: "Virginia Tech (VT)",
        rankTag: "#62 National / Top Engineering",
        type: "Technical",
      },
      {
        name: "Washington and Lee University",
        rankTag: "#11 Liberal Arts",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #2 nationally. UVA, founded by Thomas Jefferson, is one of the top public universities. VA has 6 top-50 national universities.",
  },
  wa: {
    literacyRate: 93,
    avgSchoolingYears: 13.8,
    topSchools: [
      {
        name: "University of Washington (UW Seattle)",
        rankTag: "#53 National / Top CS+Medicine",
        type: "Research",
      },
      {
        name: "Washington State University (WSU)",
        rankTag: "#133 National Univ.",
        type: "Public",
      },
      {
        name: "Whitman College",
        rankTag: "#35 Liberal Arts",
        type: "Liberal Arts",
      },
      { name: "Seattle University", rankTag: "Top Jesuit WA", type: "Private" },
    ],
    eduNotes:
      "Ranked #11 nationally. UW Seattle is one of the top public research universities globally; Amazon/Microsoft feed massive CS talent pipeline.",
  },
  wv: {
    literacyRate: 85,
    avgSchoolingYears: 12.6,
    topSchools: [
      {
        name: "West Virginia University (WVU)",
        rankTag: "#195 National Univ.",
        type: "Research",
      },
      { name: "Marshall University", rankTag: "Top Public WV", type: "Public" },
      {
        name: "Bethany College",
        rankTag: "Top Liberal Arts WV",
        type: "Liberal Arts",
      },
    ],
    eduNotes:
      "Ranked #48 nationally. WVU has strong programs in energy, medicine, and forensic science tied to state industries.",
  },
  wi: {
    literacyRate: 92,
    avgSchoolingYears: 13.6,
    topSchools: [
      {
        name: "University of Wisconsin-Madison (UW)",
        rankTag: "#35 National / #51 World",
        type: "Research",
      },
      {
        name: "Marquette University",
        rankTag: "Top Jesuit WI",
        type: "Private",
      },
      {
        name: "Lawrence University",
        rankTag: "Top Liberal Arts WI",
        type: "Liberal Arts",
      },
      {
        name: "Carroll University",
        rankTag: "Top Private WI",
        type: "Private",
      },
    ],
    eduNotes:
      "Ranked #20 nationally. UW-Madison is a top public research university; Wisconsin Idea integrates university expertise with state policy.",
  },
  wy: {
    literacyRate: 92,
    avgSchoolingYears: 13.0,
    topSchools: [
      {
        name: "University of Wyoming (UW Laramie)",
        rankTag: "#195 National Univ.",
        type: "Public",
      },
      {
        name: "Western Wyoming Community College",
        rankTag: "Top 2-Year WY",
        type: "Public",
      },
    ],
    eduNotes:
      "Ranked #37 nationally. Wyoming has only one four-year public university — the University of Wyoming — serving the entire state.",
  },
};

const DEFAULT_STATE_EDUCATION: StateEducationData = {
  literacyRate: 88,
  avgSchoolingYears: 13.0,
  topSchools: [
    { name: "State University", rankTag: "Main campus", type: "Public" },
    { name: "State Technical College", type: "Technical" },
  ],
  eduNotes: "Education data being compiled.",
};

const TYPE_COLORS: Record<string, string> = {
  Public: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  Private: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  Technical: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  Research: "text-green-400 border-green-500/30 bg-green-500/10",
  "Liberal Arts": "text-pink-400 border-pink-500/30 bg-pink-500/10",
  HBCU: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

function StateEducationPanel({ state }: { state: USState }) {
  const edu = STATE_EDUCATION[state.id] ?? DEFAULT_STATE_EDUCATION;

  return (
    <div className="modal-tile rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20 shrink-0">
          <span className="text-indigo-400 flex items-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </span>
        </div>
        <div>
          <h3 className="text-xs font-bold font-sans text-foreground uppercase tracking-widest">
            Education Ranking & Top Schools
          </h3>
          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
            US News rankings, literacy & top universities
          </p>
        </div>
        <span className="ml-auto text-[10px] font-mono text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">
          #{state.educationRank}/50 States
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Literacy Rate
          </p>
          <p
            className={`text-base font-bold font-mono ${edu.literacyRate >= 92 ? "text-success" : edu.literacyRate >= 87 ? "text-warning" : "text-destructive"}`}
          >
            {edu.literacyRate}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Avg. Schooling
          </p>
          <p className="text-base font-bold font-mono text-foreground">
            {edu.avgSchoolingYears} yrs
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
            Edu Rank
          </p>
          <p
            className={`text-base font-bold font-mono ${state.educationRank <= 10 ? "text-success" : state.educationRank <= 25 ? "text-secondary" : state.educationRank <= 40 ? "text-warning" : "text-destructive"}`}
          >
            #{state.educationRank}
          </p>
        </div>
      </div>

      {/* Literacy bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground font-sans">Literacy Rate</span>
          <span
            className={`font-mono font-semibold ${edu.literacyRate >= 92 ? "text-success" : edu.literacyRate >= 87 ? "text-warning" : "text-destructive"}`}
          >
            {edu.literacyRate}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${edu.literacyRate}%`,
              background:
                edu.literacyRate >= 92
                  ? "hsl(142,71%,45%)"
                  : edu.literacyRate >= 87
                    ? "hsl(38,92%,50%)"
                    : "hsl(0,70%,55%)",
            }}
          />
        </div>
      </div>

      {/* Top Schools */}
      <div className="mb-3">
        <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
          Top Universities & Schools
        </p>
        <div className="space-y-2">
          {edu.topSchools.map((u, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-background/30 border border-border/40"
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-medium text-foreground truncate">
                  {u.name}
                </p>
                {u.rankTag && (
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {u.rankTag}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-sans px-1.5 py-0.5 rounded-full border shrink-0 ${TYPE_COLORS[u.type] ?? "text-secondary border-secondary/30 bg-secondary/10"}`}
              >
                {u.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {edu.eduNotes && (
        <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3">
          <p className="text-[11px] font-sans text-muted-foreground leading-relaxed">
            {edu.eduNotes}
          </p>
        </div>
      )}
      <SourceLink
        sources={[
          {
            label: "US News Education Rankings",
            url: "https://www.usnews.com/education/best-colleges",
          },
          { label: "NCES Education Stats", url: "https://nces.ed.gov/" },
        ]}
        className="mt-2"
      />
    </div>
  );
}

// ─── Per-state significant laws ──────────────────────────────────────────────
interface StateLaw {
  title: string;
  year: number;
  category:
    | "Civil Rights"
    | "Criminal Justice"
    | "Environment"
    | "Healthcare"
    | "Education"
    | "Labor"
    | "Tax & Finance"
    | "Gun Policy"
    | "Immigration"
    | "LGBTQ+"
    | "Abortion & Reproductive"
    | "Voting Rights"
    | "Cannabis"
    | "Agriculture"
    | "Technology"
    | "Energy";
  status: "Active" | "Amended" | "Repealed";
  summary: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "text-success bg-success/10 border-success/30",
  Amended: "text-warning bg-warning/10 border-warning/30",
  Repealed: "text-destructive bg-destructive/10 border-destructive/30",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Civil Rights": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Criminal Justice": "bg-red-500/15 text-red-400 border-red-500/30",
  Environment: "bg-green-500/15 text-green-400 border-green-500/30",
  Healthcare: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Education: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Labor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Tax & Finance": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Gun Policy": "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Immigration: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "LGBTQ+": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Abortion & Reproductive":
    "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  "Voting Rights": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Cannabis: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Agriculture: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  Technology: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Energy: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const STATE_LAWS: Record<string, StateLaw[]> = {
  al: [
    {
      title: "Alabama Abortion Ban (HB 314)",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Near-total ban on abortion with no exceptions for rape or incest; performs an abortion is a Class A felony. Triggered by the fall of Roe v. Wade in 2022.",
    },
    {
      title: "Death Penalty Nitrogen Hypoxia Act",
      year: 2018,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "First state to authorize nitrogen hypoxia as an alternative execution method. Used for the first time in January 2024.",
    },
    {
      title: "Alabama Education Scholarship Act",
      year: 2013,
      category: "Education",
      status: "Active",
      summary:
        "Creates scholarship tax credits allowing corporations to fund private school scholarships, primarily for students zoned to failing public schools.",
    },
    {
      title: "Alabama Voters ID Law",
      year: 2011,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Requires photo ID to vote. Controversial due to subsequent closure of DMV offices in majority-Black counties, prompting federal civil rights complaints.",
    },
    {
      title: "AG Farmers Protect Act",
      year: 2023,
      category: "Agriculture",
      status: "Active",
      summary:
        "Prohibits foreign adversary nationals from owning agricultural land in Alabama, targeting Chinese, Russian, Iranian, and North Korean entities.",
    },
    {
      title: "Alabama Right to Work Law",
      year: 1953,
      category: "Labor",
      status: "Active",
      summary:
        "Prohibits union security agreements, meaning workers cannot be required to join a union or pay dues as a condition of employment.",
    },
  ],
  ak: [
    {
      title: "Alaska Permanent Fund Dividend Act",
      year: 1982,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Distributes annual dividends to all Alaska residents from the Alaska Permanent Fund, which invests oil revenues. One of the most distinctive public finance programs in the US.",
    },
    {
      title: "Ballot Measure 2 — Ranked Choice Voting",
      year: 2020,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Replaced partisan primaries with open top-four primaries and adopted ranked-choice voting for general elections — the first state with this system statewide.",
    },
    {
      title: "Marijuana Legalization (Measure 2)",
      year: 2014,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational marijuana use and possession of up to one ounce. Alaska became the third state to legalize recreational cannabis.",
    },
    {
      title: "Alaska Subsistence Law",
      year: 1978,
      category: "Agriculture",
      status: "Active",
      summary:
        "Grants priority access to fish and wildlife resources to rural Alaskans for subsistence purposes. Has been the subject of ongoing federal-state tension.",
    },
    {
      title: "Oil and Gas Production Tax (SB 21)",
      year: 2013,
      category: "Energy",
      status: "Active",
      summary:
        "Replaced the previous ACES system with a flat 35% production tax plus allowances for investment. Critically shapes Alaska's relationship with the oil industry.",
    },
  ],
  az: [
    {
      title: "SB 1070 — Arizona Immigration Law",
      year: 2010,
      category: "Immigration",
      status: "Amended",
      summary:
        "Required police to check immigration status during lawful stops. Partially struck down by the Supreme Court (Arizona v. United States, 2012); the 'show me your papers' provision upheld.",
    },
    {
      title: "Proposition 207 — Smart and Safe Act",
      year: 2020,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult-use cannabis; adults 21+ can possess up to one ounce. Creates a regulated market and expunges past marijuana convictions.",
    },
    {
      title: "Arizona Flat Income Tax (HB 2900)",
      year: 2022,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Phased Arizona to a flat 2.5% income tax by 2023 — one of the lowest flat taxes in the country, replacing a tiered system that topped at 4.5%.",
    },
    {
      title: "Abortion Ban (15-Week, SB 1164)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Prohibits most abortions after 15 weeks of pregnancy with exceptions for medical emergencies.",
    },
    {
      title: "Arizona School Choice (ESA Expansion)",
      year: 2022,
      category: "Education",
      status: "Active",
      summary:
        "Expanded Education Savings Accounts (ESAs) to all K–12 students, allowing state education funding to follow each child to any school — private, charter, or homeschool.",
    },
    {
      title: "Voters First Act (Prop 106)",
      year: 2000,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Created the independent Arizona Independent Redistricting Commission to draw congressional and state legislative maps, removing that power from the legislature.",
    },
  ],
  ar: [
    {
      title: "Arkansas Abortion Near-Total Ban (SB 6)",
      year: 2021,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans all abortions except to save the life of the mother; no exceptions for rape or incest. Enforceable since Dobbs (2022).",
    },
    {
      title: "Arkansas Medical Marijuana Amendment",
      year: 2016,
      category: "Cannabis",
      status: "Active",
      summary:
        "Constitutional amendment establishing a medical marijuana program. Arkansas is one of the few Republican-controlled states with medical cannabis.",
    },
    {
      title: "LEARNS Act (Education Reform)",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Comprehensive education reform including universal school choice vouchers, a $50,000 teacher pay floor, and literacy standards overhaul. One of the largest ed-reform bills in state history.",
    },
    {
      title: "Arkansas Right to Work Amendment",
      year: 1944,
      category: "Labor",
      status: "Active",
      summary:
        "Constitutional prohibition on mandatory union membership as a condition of employment. One of the earliest right-to-work provisions in the nation.",
    },
    {
      title: "Anti-Drag Performance Law (SB 43)",
      year: 2023,
      category: "LGBTQ+",
      status: "Active",
      summary:
        "Restricts 'adult-oriented performances' including drag shows in public or where minors could view them. Challenged in federal court.",
    },
  ],
  ca: [
    {
      title: "California Consumer Privacy Act (CCPA)",
      year: 2018,
      category: "Technology",
      status: "Amended",
      summary:
        "Landmark data privacy law giving Californians rights to know, delete, and opt out of the sale of their personal data. Strengthened by Prop 24 (CPRA) in 2020.",
    },
    {
      title: "AB 5 — Gig Worker Classification",
      year: 2019,
      category: "Labor",
      status: "Amended",
      summary:
        "Requires companies to classify gig workers as employees unless they pass the ABC test. Prop 22 (2020) exempted app-based rideshare/delivery companies, creating a major political battle.",
    },
    {
      title: "SB 100 — 100% Clean Energy by 2045",
      year: 2018,
      category: "Energy",
      status: "Active",
      summary:
        "Requires California to source 100% of its electricity from renewable and zero-carbon sources by December 31, 2045. Most ambitious clean energy target of any US state at passage.",
    },
    {
      title: "Proposition 47 — Safe Neighborhoods Act",
      year: 2014,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Reclassified certain nonviolent offenses from felonies to misdemeanors, including drug possession and theft under $950. Led to significant reductions in prison population.",
    },
    {
      title: "California WARN Act (AB 2592)",
      year: 2022,
      category: "Labor",
      status: "Active",
      summary:
        "Requires 60 days notice before mass layoffs and extends protections to contract workers. Became prominent during Silicon Valley tech layoffs in 2023.",
    },
    {
      title: "Proposition 215 — Compassionate Use Act",
      year: 1996,
      category: "Cannabis",
      status: "Active",
      summary:
        "First state in the nation to legalize medical marijuana. A watershed moment in US drug policy, paving the way for 38+ states to follow.",
    },
    {
      title: "FAIR Act — Athlete Pay (SB 206)",
      year: 2019,
      category: "Education",
      status: "Active",
      summary:
        "First law in the nation allowing college athletes to profit from name, image, and likeness (NIL). Prompted the NCAA to change its rules nationally.",
    },
  ],
  co: [
    {
      title: "Amendment 64 — Marijuana Legalization",
      year: 2012,
      category: "Cannabis",
      status: "Active",
      summary:
        "First state in the world to legalize adult recreational marijuana alongside Washington State. Became a model for cannabis legalization globally.",
    },
    {
      title: "Colorado FAMLI Act (Paid Family Leave)",
      year: 2020,
      category: "Labor",
      status: "Active",
      summary:
        "Created the first publicly funded paid family and medical leave program approved by voters; workers can receive up to 12 weeks of paid leave.",
    },
    {
      title: "TABOR — Taxpayer's Bill of Rights",
      year: 1992,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Constitutional amendment requiring voter approval for all tax increases and limiting government revenue growth. Unique in the US; has significantly constrained Colorado's fiscal policy for 30+ years.",
    },
    {
      title: "Colorado Reproductive Health Equity Act",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Codifies the right to abortion into state law with no restrictions, including late-term procedures. Positioned Colorado as one of the most permissive abortion-rights states.",
    },
    {
      title: "Colorado AI Act (SB 205)",
      year: 2024,
      category: "Technology",
      status: "Active",
      summary:
        "First US state AI regulation law covering high-risk AI systems. Requires developers to take reasonable care to protect consumers from algorithmic discrimination.",
    },
    {
      title: "Oil and Gas Conservation Commission Reform (SB 181)",
      year: 2019,
      category: "Environment",
      status: "Active",
      summary:
        "Shifted the Colorado Oil and Gas Conservation Commission's mandate from primarily fostering development to protecting public health and the environment.",
    },
  ],
  ct: [
    {
      title: "Connecticut Paid Sick Leave Law",
      year: 2011,
      category: "Labor",
      status: "Active",
      summary:
        "First state to enact mandatory paid sick leave, requiring employers with 50+ employees to provide paid sick time to service workers.",
    },
    {
      title: "PACT Act — Gun Violence Prevention",
      year: 2013,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Passed within months of Sandy Hook, banned assault weapons, high-capacity magazines, and required background checks on all gun sales.",
    },
    {
      title: "Connecticut Paid Family & Medical Leave",
      year: 2019,
      category: "Labor",
      status: "Active",
      summary:
        "Provides 12 weeks of paid leave funded by a payroll tax. Covers nearly all private employees, including part-time workers.",
    },
    {
      title: "FOIA — Freedom of Information Act (CT)",
      year: 1975,
      category: "Civil Rights",
      status: "Active",
      summary:
        "One of the strongest state public records laws in the nation, creating a Freedom of Information Commission to enforce government transparency.",
    },
    {
      title: "Connecticut Clean Slate Law",
      year: 2021,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Allows automatic erasure of certain criminal records — misdemeanors after 7 years and Class D/E felonies after 10 years, one of the broadest automatic expungement laws in the US.",
    },
  ],
  de: [
    {
      title: "Delaware Incorporation Law (General Corporation Law)",
      year: 1899,
      category: "Tax & Finance",
      status: "Amended",
      summary:
        "Delaware's pro-business corporate code established the state as the legal home of over 65% of Fortune 500 companies. The Court of Chancery provides specialized corporate dispute resolution.",
    },
    {
      title: "Delaware Marijuana Legalization (HB 1)",
      year: 2023,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational marijuana possession. Delaware became the 21st state to legalize recreational cannabis.",
    },
    {
      title: "Delaware Equal Rights Amendment",
      year: 2019,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Added gender equality explicitly to Delaware's constitution — one of the first states to independently enshrine gender equality at constitutional level.",
    },
    {
      title: "Delaware Offshore Wind Energy Law",
      year: 2011,
      category: "Energy",
      status: "Active",
      summary:
        "Enabled the offshore wind power purchase agreement that led to Skipjack Wind Farm, helping establish Delaware as an early leader in offshore wind development.",
    },
  ],
  fl: [
    {
      title: "HB 5 — 15-Week Abortion Ban",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Amended",
      summary:
        "Banned most abortions after 15 weeks. Superseded in 2023 by SB 300 (6-week ban), which took effect in May 2024.",
    },
    {
      title: "Florida Constitutional Carry (HB 543)",
      year: 2023,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows Floridians to carry concealed firearms without a permit. Florida became the 26th permitless carry state.",
    },
    {
      title: "Florida Anti-Rioting Law (HB 1)",
      year: 2021,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Expands definition of rioting, increases penalties, and creates civil immunity for drivers who hit protesters blocking roads. Passed after 2020 protests.",
    },
    {
      title: "Amendment 2 — $15 Minimum Wage",
      year: 2020,
      category: "Labor",
      status: "Active",
      summary:
        "Ballot initiative raising Florida's minimum wage incrementally to $15/hr by 2026, approved by 61% of voters despite being a Republican-controlled state.",
    },
  ],
  ga: [
    {
      title: "Georgia Election Integrity Act (SB 202)",
      year: 2021,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Overhauled elections: banned mobile voting units, limited Sunday early voting, made it illegal to hand out food/water in voting lines, and gave legislature power over State Election Board.",
    },
    {
      title: "Georgia RICO Indictment Law (Use in Trump Case)",
      year: 1980,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Georgia's RICO statute (used to indict Donald Trump and 18 co-defendants in 2023) is unusually broad, allowing prosecution of wide-ranging criminal enterprises.",
    },
    {
      title: "Living Infants Fairness and Equality (LIFE) Act",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans abortion after cardiac activity is detected (~6 weeks). Enforceable since Dobbs (2022).",
    },
    {
      title: "Georgia HEART Act (SB 43)",
      year: 2023,
      category: "Healthcare",
      status: "Active",
      summary:
        "Establishes funding for maternal mortality prevention, following Georgia's alarming rate as highest maternal mortality in the nation.",
    },
    {
      title: "Georgia Film Tax Credit",
      year: 2008,
      category: "Tax & Finance",
      status: "Amended",
      summary:
        "30% tax credit made Georgia the #1 filming location in the world ('Hollywood of the South'), generating $4.4B in economic impact annually.",
    },
  ],
  hi: [
    {
      title: "Hawaii Clean Energy Initiative (HB 623)",
      year: 2009,
      category: "Energy",
      status: "Active",
      summary:
        "First state to set a 100% renewable electricity standard (2045). Hawaii was the model for other states' clean energy targets.",
    },
    {
      title: "Hawaii Gun Control Laws",
      year: 1994,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Hawaii requires firearm registration, mandatory background checks, and a 14-day waiting period — among the strictest gun laws in the nation. Consistently ranks as the safest state for gun violence.",
    },
    {
      title: "Hawaii Housing Act (HB 1049)",
      year: 2023,
      category: "Healthcare",
      status: "Active",
      summary:
        "Establishes a state housing production authority to address Hawaii's severe housing shortage, with focus on affordable workforce housing.",
    },
    {
      title: "Native Hawaiian Government Reorganization Act",
      year: 2011,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Establishes a process for the formal reorganization of a Native Hawaiian governing entity. Remains highly contested politically.",
    },
    {
      title: "Hawaii Medicaid Expansion",
      year: 1974,
      category: "Healthcare",
      status: "Active",
      summary:
        "Hawaii's Prepaid Health Care Act (1974) preceded the ACA by 36 years, requiring employers to provide health insurance to workers over 20 hrs/week. Hawaii consistently has the highest insured rate in the nation.",
    },
  ],
  id: [
    {
      title: "Idaho Abortion Total Ban (HB 8)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans all abortions except to save the mother's life; no exceptions for rape or incest. A trigger law that took effect when Roe was overturned.",
    },
    {
      title: "Idaho Don't Say Gay Expansion (SB 1100)",
      year: 2024,
      category: "LGBTQ+",
      status: "Active",
      summary:
        "Prohibits instruction on sexual orientation or gender identity in public schools K–12. Mirrors Florida's Parental Rights law.",
    },
    {
      title: "Idaho Permitless Carry Law",
      year: 2016,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows Idaho residents 21+ to carry concealed firearms without a permit. Expanded in 2020 to include those 18–20.",
    },
    {
      title: "Idaho Property Rights Act (Prop 1)",
      year: 2006,
      category: "Environment",
      status: "Active",
      summary:
        "Requires state to compensate landowners when regulations reduce property value, limiting environmental and zoning restrictions.",
    },
    {
      title: "Idaho Education Savings Account (HB 447)",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Creates state-funded Education Savings Accounts allowing families to use public funds for private school tuition, tutoring, and homeschooling.",
    },
  ],
  il: [
    {
      title: "Illinois SAFE-T Act",
      year: 2021,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Eliminated cash bail entirely — the first state in the US to do so. Also imposed new use-of-force standards on police. Cash bail elimination took effect January 2023.",
    },
    {
      title: "Illinois Cannabis Regulation and Tax Act",
      year: 2019,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational cannabis while expunging over 770,000 prior marijuana convictions. One of the first laws to explicitly address racial equity in cannabis licensing.",
    },
    {
      title: "Illinois Equal Pay Act",
      year: 2021,
      category: "Labor",
      status: "Active",
      summary:
        "Requires employers to certify pay equity compliance to the IDOL. Creates the 'equal pay registration certificate' framework — among the strictest pay equity laws in the country.",
    },
    {
      title: "Illinois Human Rights Act (Biometric Privacy)",
      year: 2008,
      category: "Technology",
      status: "Active",
      summary:
        "BIPA (Biometric Information Privacy Act) regulates collection and storage of fingerprints, retina scans, and facial recognition — the most enforced biometric privacy law in the US.",
    },
    {
      title: "Reproductive Health Act (SB 25)",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Codified abortion rights into state law and repealed the 1975 Illinois Abortion Act. Illinois became a sanctuary state for abortion access after Dobbs.",
    },
  ],
  in: [
    {
      title: "Indiana Abortion Near-Total Ban (SB 1)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "First state to pass a near-total abortion ban post-Dobbs. Bans abortion with narrow exceptions for rape, incest, fetal anomaly, and the mother's life.",
    },
    {
      title: "Indiana RFRA — Religious Freedom Restoration Act",
      year: 2015,
      category: "Civil Rights",
      status: "Amended",
      summary:
        "Allowed businesses to refuse service based on religious beliefs. National boycott led to a quick amendment clarifying it does not permit discrimination against LGBTQ+ people.",
    },
    {
      title: "Indiana School Choice Program (Choice Scholarships)",
      year: 2011,
      category: "Education",
      status: "Active",
      summary:
        "Created one of the nation's largest voucher programs, allowing low-income families to use state funds for private school tuition.",
    },
    {
      title: "Indiana Permitless Carry (HB 1296)",
      year: 2022,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Eliminated the requirement for a handgun license to carry a firearm in Indiana. Took effect July 1, 2022.",
    },
  ],
  ia: [
    {
      title: "Iowa Heartbeat Law (SF 2340)",
      year: 2024,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans abortion after 6 weeks of pregnancy, when cardiac activity is detected. Took effect after Iowa Supreme Court ruling upheld it in 2024.",
    },
    {
      title: "Iowa Education Savings Accounts (HF 68)",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Universal school choice voucher program allowing any Iowa family to redirect $7,600+ in per-pupil state funding to private or homeschool education.",
    },
    {
      title: "Iowa Agricultural Land Protection Law",
      year: 1990,
      category: "Agriculture",
      status: "Active",
      summary:
        "Restricts corporate and non-citizen ownership of Iowa farmland. Iowa has some of the most protective ag land ownership laws in the Midwest.",
    },
    {
      title: "Iowa Voter ID Law (SF 2213)",
      year: 2017,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Requires voters to present a valid ID; first-time violators receive a provisional ballot. Iowa joins the majority of states with photo ID requirements.",
    },
    {
      title: "Iowa Wind Energy Production Tax Credit",
      year: 2013,
      category: "Energy",
      status: "Active",
      summary:
        "Iowa consistently leads the nation in percentage of electricity generated from wind power (>60%). State tax incentives have made it the model for wind energy development.",
    },
  ],
  ks: [
    {
      title: "Kansas Abortion Amendment Defeat (Value Them Both)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Repealed",
      summary:
        "Proposed constitutional amendment to remove abortion protections from Kansas constitution. Defeated 59–41% by voters — a landmark victory for abortion rights in a conservative state.",
    },
    {
      title: "Kansas Tax Cuts (HB 2036)",
      year: 2012,
      category: "Tax & Finance",
      status: "Amended",
      summary:
        "Sweeping income tax cuts dubbed 'The Great Kansas Experiment' by Gov. Sam Brownback. Led to fiscal crisis by 2017; most cuts reversed. A cautionary tale for supply-side tax policy.",
    },
    {
      title: "Kansas Farmland Preservation Act",
      year: 1977,
      category: "Agriculture",
      status: "Active",
      summary:
        "Protects prime agricultural land from conversion to non-farm uses through differential assessment and agricultural land preservation programs.",
    },
    {
      title: "Kansas Open Carry Law",
      year: 2006,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Kansas allows open carry of firearms without a permit; permitless concealed carry added in 2015. One of the most permissive gun law states.",
    },
  ],
  ky: [
    {
      title: "Kentucky Human Life Protection Act (HB 3)",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Near-total abortion ban; trigger law that took effect when Roe v. Wade was overturned. The law has survived state and federal legal challenges.",
    },
    {
      title: "Kentucky Education Opportunity Account Program",
      year: 2021,
      category: "Education",
      status: "Active",
      summary:
        "Tax-credit scholarship program allowing donations to fund private school vouchers in some Kentucky counties.",
    },
    {
      title: "Kentucky Right to Work Act (SB 1)",
      year: 2017,
      category: "Labor",
      status: "Active",
      summary:
        "Made Kentucky the 27th right-to-work state, prohibiting mandatory union membership. Marked a significant shift for a traditionally union-friendly state.",
    },
    {
      title: "Kentucky Pension Crisis Reform (HB 358)",
      year: 2018,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Restructured the critically underfunded state teacher pension system; Kentucky has one of the worst-funded public pension systems in the nation.",
    },
    {
      title: "Kentucky Permitless Carry (HB 173)",
      year: 2019,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows constitutional carry for Kentucky residents 21+ without requiring a license or permit.",
    },
  ],
  la: [
    {
      title: "Louisiana Ten Commandments Law (HB 71)",
      year: 2024,
      category: "Education",
      status: "Active",
      summary:
        "First state to require the Ten Commandments be displayed in public school classrooms. Faces First Amendment federal lawsuits.",
    },
    {
      title: "Louisiana Trigger Law (Act 545)",
      year: 2006,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Activated when Roe was overturned — bans nearly all abortions except for life-threatening conditions, rape, and incest (with restrictions).",
    },
    {
      title: "Louisiana Science Education Act",
      year: 2008,
      category: "Education",
      status: "Active",
      summary:
        "Allows supplemental teaching materials beyond standard curriculum, including critiques of evolution and climate change. Critics call it a backdoor for teaching creationism.",
    },
    {
      title: "Louisiana Coastal Master Plan",
      year: 2007,
      category: "Environment",
      status: "Amended",
      summary:
        "Multi-billion dollar state plan to restore and protect Louisiana's disappearing coastline, one of the fastest-disappearing coastlines in the world due to oil extraction and climate change.",
    },
    {
      title: "Louisiana Gold Dome Investment Fund (Act 23)",
      year: 2022,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Created a state rainy day fund invested in equities and bonds, using oil tax revenues to build long-term fiscal stability.",
    },
  ],
  me: [
    {
      title: "Maine Ranked Choice Voting (Question 5)",
      year: 2016,
      category: "Voting Rights",
      status: "Active",
      summary:
        "First state in the US to adopt ranked-choice voting for statewide elections, including presidential primaries and US House/Senate races.",
    },
    {
      title: "Maine Minimum Wage Initiative (Question 4)",
      year: 2016,
      category: "Labor",
      status: "Active",
      summary:
        "Voter-approved initiative raising minimum wage to $12/hr by 2020 with annual inflation adjustments. Maine now has one of the highest minimums in the region.",
    },
    {
      title: "Maine Work and Save Act (IRA-style)",
      year: 2023,
      category: "Labor",
      status: "Active",
      summary:
        "Establishes a state-facilitated retirement savings program for workers without employer-sponsored retirement plans.",
    },
    {
      title: "Maine Offshore Wind Moratorium and Research Act",
      year: 2023,
      category: "Energy",
      status: "Active",
      summary:
        "Establishes a research corridor for floating offshore wind technology in the Gulf of Maine, positioning Maine as a testing ground for deep-water wind.",
    },
    {
      title: "Maine School Safety Act (LD 2173)",
      year: 2024,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Passed in the wake of the Lewiston mass shooting; requires a 72-hour waiting period for all firearm purchases and background checks for private gun sales.",
    },
  ],
  md: [
    {
      title: "Maryland Reproductive Freedom Amendment (Question 1)",
      year: 2024,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Constitutional amendment enshrining the fundamental right to reproductive freedom, including abortion, contraception, and fertility treatment. Approved by voters in November 2024.",
    },
    {
      title: "Maryland Child Victims Act of 2023",
      year: 2023,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Eliminated the statute of limitations for childhood sexual abuse civil claims, allowing survivors of all ages to sue. Applies retroactively.",
    },
    {
      title: "Maryland Assault Weapons Ban",
      year: 1994,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Bans sale of assault pistols and certain semi-automatic rifles; among the oldest and most comprehensive assault weapons restrictions in the country.",
    },
    {
      title: "Maryland Clean Energy Jobs Act (CEJA)",
      year: 2019,
      category: "Energy",
      status: "Active",
      summary:
        "Set a 50% renewable portfolio standard by 2030 and 100% clean electricity by 2040. One of the most aggressive clean energy timelines on the East Coast.",
    },
    {
      title: "Maryland Eviction Prevention Partnership",
      year: 2021,
      category: "Healthcare",
      status: "Active",
      summary:
        "Created a statewide network of eviction prevention services and a right to counsel for low-income tenants in eviction proceedings.",
    },
  ],
  ma: [
    {
      title: "Massachusetts Health Care Reform (Chapter 58)",
      year: 2006,
      category: "Healthcare",
      status: "Active",
      summary:
        "Signed by Gov. Romney, this was the national model for the Affordable Care Act. Created an individual mandate, insurance exchanges, and Medicaid expansion — achieving near-universal coverage.",
    },
    {
      title: "Massachusetts Marijuana Legalization (Question 4)",
      year: 2016,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational marijuana. Massachusetts was the first East Coast state to legalize recreational cannabis.",
    },
    {
      title: "Massachusetts Gun Law (Chapter 180)",
      year: 1998,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Among the strictest gun laws in the nation: requires an FID or LTC for all firearms, bans assault weapons and high-capacity magazines, and has a 1-gun-per-month purchase limit.",
    },
    {
      title: "Massachusetts Equal Pay Act (Chapter 177)",
      year: 2016,
      category: "Labor",
      status: "Active",
      summary:
        "Prohibits employers from asking about salary history before making job offers and requires equal pay for comparable work regardless of gender — one of the first such laws in the nation.",
    },
    {
      title: "FAIR Share Amendment (Question 1)",
      year: 2022,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Constitutional amendment imposing an additional 4% income tax on income over $1 million, raising revenue for education and transportation. Voters approved 52–48%.",
    },
  ],
  mi: [
    {
      title: "Michigan Proposal 3 — Reproductive Rights Amendment",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Constitutional amendment enshrining the right to abortion, contraception, and fertility treatment. Approved 57% by voters in the 2022 midterm elections.",
    },
    {
      title: "Michigan Earned Sick Time Act",
      year: 2018,
      category: "Labor",
      status: "Amended",
      summary:
        "Requires employers to provide paid sick leave. The legislature watered it down after passage in a controversial 'adopt-and-amend' maneuver; the original stronger version was restored by court ruling in 2023.",
    },
    {
      title: "Michigan Clean Energy Standard (HB 5120)",
      year: 2023,
      category: "Energy",
      status: "Active",
      summary:
        "Sets 100% clean energy standard by 2040. Michigan joins a growing number of states committed to full clean energy transition.",
    },
    {
      title: "Michigan Marijuana Legalization (Prop 1)",
      year: 2018,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational marijuana. Michigan was the first Midwest state to legalize recreational cannabis.",
    },
    {
      title: "Michigan Voters Not Politicians (Prop 2)",
      year: 2018,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Created an independent citizens redistricting commission to draw Michigan's legislative and congressional maps, removing the process from legislative control.",
    },
  ],
  mn: [
    {
      title: "Minnesota Protect Reproductive Options Act (HF 1)",
      year: 2023,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Codified the right to abortion and other reproductive healthcare into state statute, protecting Minnesotans if Roe protections are further eroded federally.",
    },
    {
      title: "Minnesota Marijuana Legalization (HF 100)",
      year: 2023,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational cannabis and required that cannabis revenue fund social equity programs addressing communities harmed by prior drug enforcement.",
    },
    {
      title: "Minnesota Free School Meals Act",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Provides free breakfast and lunch to all K–12 students in Minnesota public schools regardless of family income — the first state with truly universal school meals.",
    },
    {
      title: "Minnesota Paycheck Fairness Act",
      year: 2023,
      category: "Labor",
      status: "Active",
      summary:
        "Prohibits employers from seeking salary history, bans pay secrecy policies, and requires equal pay for comparable work. Among the strongest pay equity statutes in the country.",
    },
    {
      title: "Minnesota Voting Rights Act",
      year: 2023,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Nation's first state-level Voting Rights Act, prohibiting voter suppression with an enforcement mechanism allowing individuals to sue over voting discrimination.",
    },
  ],
  ms: [
    {
      title: "Mississippi Abortion Trigger Law (HB 1510)",
      year: 2007,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Trigger law banning nearly all abortions that took effect upon the fall of Roe v. Wade. Exceptions only for rape and life-threatening medical emergencies. The Mississippi 15-week ban was the case (Dobbs v. Jackson) that overturned Roe.",
    },
    {
      title: "Mississippi Medical Marijuana Amendment (Initiative 65)",
      year: 2020,
      category: "Cannabis",
      status: "Active",
      summary:
        "Voters approved medical marijuana by 74%; the original initiative was thrown out by the Supreme Court on a technicality and replaced by a weaker legislative program.",
    },
    {
      title: "Mississippi Second Chance Act",
      year: 2021,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Allows individuals convicted of nonviolent drug offenses to petition for expungement; limited scope compared to other states but represents the first expungement law in a deep-South state.",
    },
    {
      title: "Mississippi Right to Work Law",
      year: 1960,
      category: "Labor",
      status: "Active",
      summary:
        "Constitutional prohibition on mandatory union dues; Mississippi has maintained one of the lowest union membership rates in the nation.",
    },
  ],
  mo: [
    {
      title: "Missouri Amendment 3 — Abortion Rights (2024)",
      year: 2024,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Ballot measure enshrining the right to abortion in Missouri's constitution, overriding a near-total abortion ban. Passed 52–48% in November 2024, a dramatic reversal.",
    },
    {
      title: "Missouri Constitutional Carry (HB 85)",
      year: 2016,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows Missourians 19+ to carry concealed firearms without a permit or training. Missouri also passed a law purporting to nullify federal gun regulations (Second Amendment Preservation Act), though courts have largely struck it down.",
    },
    {
      title: "Missouri Clean Missouri (Amendment 1)",
      year: 2018,
      category: "Voting Rights",
      status: "Amended",
      summary:
        "Approved independent redistricting with a nonpartisan demographer. The legislature referred a weakening amendment (Amendment 3, 2020) that replaced the independent process.",
    },
    {
      title: "Missouri Expanded Medicaid (Amendment 2)",
      year: 2020,
      category: "Healthcare",
      status: "Active",
      summary:
        "Voter-approved Medicaid expansion to adults up to 138% of poverty. The legislature initially refused to fund it; courts ordered implementation.",
    },
  ],
  mt: [
    {
      title: "Montana AI Photography Law (SB 458)",
      year: 2023,
      category: "Technology",
      status: "Active",
      summary:
        "Regulates AI-generated imagery depicting real individuals without consent in political communications — one of the first US AI deepfake laws.",
    },
    {
      title: "Montana TikTok Ban (SB 419)",
      year: 2023,
      category: "Technology",
      status: "Repealed",
      summary:
        "First state to ban TikTok statewide. Struck down by a federal judge as unconstitutional in November 2023 before taking effect.",
    },
    {
      title: "Montana Abortion Rights Amendment (CI-128)",
      year: 2024,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Enshrines the right to abortion prior to fetal viability in Montana's constitution, protecting access after the state Supreme Court had already found a prior right.",
    },
    {
      title: "Montana Constitutional Carry (HB 102)",
      year: 2021,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows permitless concealed carry statewide; removed restrictions on carrying concealed weapons in certain buildings.",
    },
    {
      title:
        "Montana Water Rights Compact (Confederated Salish and Kootenai Tribes)",
      year: 2015,
      category: "Agriculture",
      status: "Active",
      summary:
        "Largest Indian water rights settlement in US history, resolving 100+ years of water rights disputes in the Flathead River Basin.",
    },
  ],
  ne: [
    {
      title: "Nebraska Abortion Ban (LB 574)",
      year: 2023,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans abortion at 12 weeks of pregnancy with exceptions for rape, incest, and medical emergencies. Nebraska had previously permitted abortion up to 20 weeks.",
    },
    {
      title: "Nebraska Unicameral Legislature",
      year: 1934,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Nebraska's unique nonpartisan, single-chamber legislature — the only unicameral state legislature in the nation. Adopted in the Progressive Era reform movement.",
    },
    {
      title:
        "Nebraska Electoral Vote Allocation (Congressional District Method)",
      year: 1996,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Nebraska (and Maine) allocate electoral votes by congressional district rather than winner-take-all. Omaha's 2nd Congressional District became a battleground in multiple elections.",
    },
    {
      title: "Nebraska Property Tax Relief Act (LB 34)",
      year: 2024,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Largest property tax relief in Nebraska history, capping school district property tax levies and shifting costs to state general fund.",
    },
  ],
  nv: [
    {
      title: "Nevada Equal Rights Caucus / Abortion Rights Amendment",
      year: 1990,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Nevada codified abortion rights by referendum in 1990, protecting access through the first 24 weeks. The state is an island of access in a conservative region.",
    },
    {
      title: "Nevada Question 3 — Open Primaries",
      year: 2024,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Passed by voters to implement top-five open primaries and ranked-choice voting for general elections, mirroring Alaska's system.",
    },
    {
      title: "Nevada Marijuana Legalization (Question 2)",
      year: 2016,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational marijuana; Nevada generates over $1 billion annually in cannabis sales.",
    },
    {
      title: "Nevada Automatic Voter Registration",
      year: 2019,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Automatically registers eligible Nevadans when interacting with the DMV. Nevada has one of the most accessible voter registration systems in the country.",
    },
    {
      title: "Nevada Equal Pay for Equal Work Act (AB 2)",
      year: 2019,
      category: "Labor",
      status: "Active",
      summary:
        "Comprehensive pay equity law prohibiting wage discrimination and salary history inquiries.",
    },
  ],
  nh: [
    {
      title: "New Hampshire Education Freedom Accounts (SB 130)",
      year: 2021,
      category: "Education",
      status: "Active",
      summary:
        "Creates state-funded ESAs for students to attend non-public schools. New Hampshire's program has been one of the most rapidly expanding school choice programs in New England.",
    },
    {
      title: "New Hampshire Right-to-Know Law (RSA 91-A)",
      year: 1967,
      category: "Civil Rights",
      status: "Active",
      summary:
        "One of the first and strongest state public records laws. Requires virtually all government meetings to be open to the public and government documents to be accessible.",
    },
    {
      title: "New Hampshire Permitless Carry (SB 12)",
      year: 2017,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Eliminated the requirement for a concealed carry license. New Hampshire is the only New England state with constitutional carry.",
    },
    {
      title:
        "New Hampshire No Income or Sales Tax (Constitution, Part II, Art. 6)",
      year: 1784,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "New Hampshire's constitution effectively prohibits a broad income tax; the state relies on property taxes and a rooms-and-meals tax, with no general sales tax.",
    },
  ],
  nj: [
    {
      title: "New Jersey Reproductive Freedom Act",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Codified abortion rights into state statute after the fall of Roe. New Jersey is a sanctuary abortion state for residents of surrounding states.",
    },
    {
      title: "New Jersey SAFE Carry Law (A4769)",
      year: 2023,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Passed after the Supreme Court's Bruen decision struck down concealed carry restrictions. Designates most public places as sensitive areas where carry is prohibited.",
    },
    {
      title: "New Jersey Clean Energy Act (A3723)",
      year: 2018,
      category: "Energy",
      status: "Active",
      summary:
        "Set targets of 50% renewables by 2030 and 100% clean energy by 2050; dramatically expanded offshore wind commitments in the Atlantic.",
    },
    {
      title: "New Jersey Paid Family Leave Expansion",
      year: 2019,
      category: "Labor",
      status: "Active",
      summary:
        "Extended leave to 12 weeks and raised benefits to 85% of wages (up to state average). One of the most generous paid family leave programs in the country.",
    },
    {
      title: "New Jersey Marijuana Legalization (Public Question 1)",
      year: 2020,
      category: "Cannabis",
      status: "Active",
      summary:
        "Constitutional amendment legalizing adult recreational cannabis, approved by 67% of voters.",
    },
  ],
  nm: [
    {
      title: "New Mexico Abortion Access Act (SB 10)",
      year: 2023,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Repealed all prior abortion restrictions and removed criminal penalties for abortion providers. New Mexico has become a primary destination for patients from neighboring Texas.",
    },
    {
      title: "New Mexico Cannabis Regulation Act",
      year: 2021,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational cannabis; notable for dedicating 10% of cannabis tax revenue to the Communities Reinvestment Fund for communities most harmed by drug enforcement.",
    },
    {
      title: "New Mexico Indian Water Rights Settlement Act",
      year: 2009,
      category: "Agriculture",
      status: "Active",
      summary:
        "Resolved water rights claims for multiple Pueblos; New Mexico is party to some of the most complex water rights cases in the western United States.",
    },
    {
      title: "New Mexico Early Childhood Education and Care Department Act",
      year: 2019,
      category: "Education",
      status: "Active",
      summary:
        "Created the nation's first standalone early childhood education department, funded partly through the state's investment of Permanent Fund earnings.",
    },
  ],
  ny: [
    {
      title: "New York Reproductive Health Act (S240)",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Enshrined abortion rights in state law up to 24 weeks; removed abortion from the penal code and allowed non-physicians to perform certain procedures. Signed into law on the anniversary of Roe v. Wade.",
    },
    {
      title: "New York SAFE Act (Gun Control)",
      year: 2013,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Nation's strictest assault weapons ban at the time; requires background checks on all gun sales, limits magazines to 7 rounds, requires gun owner re-certification.",
    },
    {
      title: "New York Climate Leadership and Community Protection Act (CLCPA)",
      year: 2019,
      category: "Environment",
      status: "Active",
      summary:
        "Nation's most aggressive climate law: net-zero emissions by 2050, 70% renewables by 2030, and dedicated 35% of clean energy benefits to disadvantaged communities.",
    },
    {
      title: "New York Bail Reform (S2101B)",
      year: 2019,
      category: "Criminal Justice",
      status: "Amended",
      summary:
        "Eliminated cash bail for most misdemeanors and nonviolent felonies. Modified in 2020 and 2022 after political pressure following high-profile recidivism cases.",
    },
    {
      title: "New York Child Victims Act",
      year: 2019,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Opened a one-year look-back window for childhood sex abuse civil claims regardless of when the abuse occurred. Resulted in over 10,000 lawsuits against institutions including the Catholic Church.",
    },
    {
      title: "NY HERO Act — Worker Safety",
      year: 2021,
      category: "Labor",
      status: "Active",
      summary:
        "First airborne infectious disease exposure prevention law in the nation, requiring employers to adopt airborne disease safety plans (passed after COVID-19).",
    },
  ],
  nc: [
    {
      title: "North Carolina HB 2 ('Bathroom Bill')",
      year: 2016,
      category: "LGBTQ+",
      status: "Repealed",
      summary:
        "Required transgender people to use bathrooms matching their birth sex in public buildings. Led to massive economic boycott ($525M+) and was largely repealed in 2017, though LGBT protections were delayed.",
    },
    {
      title: "North Carolina Voter ID Amendment (Amendment 1)",
      year: 2018,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Constitutional amendment requiring photo ID to vote. Challenged in courts for racial discrimination; implementation has been intermittent pending litigation.",
    },
    {
      title: "North Carolina Certificate of Need Law",
      year: 1978,
      category: "Healthcare",
      status: "Active",
      summary:
        "Requires healthcare providers to obtain state approval before adding medical equipment or beds. Highly controversial; critics say it limits competition and healthcare access in rural areas.",
    },
    {
      title: "North Carolina Farm Act",
      year: 2021,
      category: "Agriculture",
      status: "Active",
      summary:
        "Protects farmers from nuisance lawsuits from neighbors of large animal operations (Right to Farm protections). Strengthened to prevent third-party lawsuits against hog farm operators.",
    },
    {
      title: "North Carolina Medicaid Expansion (S321)",
      year: 2023,
      category: "Healthcare",
      status: "Active",
      summary:
        "After a decade of resistance, North Carolina became the 40th state to expand Medicaid under the ACA, covering 600,000 low-income adults.",
    },
  ],
  nd: [
    {
      title: "North Dakota Abortion Trigger Law (NDCC 12.1-31-12)",
      year: 2007,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Triggered by Dobbs, this law bans nearly all abortions. North Dakota became one of the first states to have a near-total abortion ban take effect after Roe fell.",
    },
    {
      title: "North Dakota Measure 5 — Abortion Rights (2024)",
      year: 2024,
      category: "Abortion & Reproductive",
      status: "Repealed",
      summary:
        "Ballot measure to enshrine abortion rights failed; North Dakota remains one of the most restrictive abortion states.",
    },
    {
      title: "North Dakota Legacy Fund",
      year: 2010,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Constitutional amendment created the Legacy Fund, depositing 30% of oil tax revenues into a permanent savings fund. Has grown to over $10 billion, designed to fund future generations after oil runs out.",
    },
    {
      title: "North Dakota Anti-Corporate Farming Law",
      year: 1932,
      category: "Agriculture",
      status: "Active",
      summary:
        "Constitutional prohibition on corporate farming; North Dakota has the most protective anti-corporate farming statute in the nation, though modified over decades.",
    },
  ],
  oh: [
    {
      title: "Ohio Issue 1 — Reproductive Rights Amendment",
      year: 2023,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Constitutional amendment enshrining the right to contraception, fertility treatment, miscarriage care, and abortion up to viability. Approved by 57% of voters in November 2023.",
    },
    {
      title: "Ohio Issue 2 — Marijuana Legalization",
      year: 2023,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized adult recreational marijuana, approved by voters in November 2023. Ohio became the 24th state to legalize recreational cannabis.",
    },
    {
      title: "Ohio HB 6 — FirstEnergy Nuclear Bailout",
      year: 2019,
      category: "Energy",
      status: "Repealed",
      summary:
        "Provided $1 billion in ratepayer subsidies to nuclear plants. Led to the largest bribery scandal in Ohio history ($60M+ scheme); HB 6 was repealed in 2023.",
    },
    {
      title: "Ohio Stand Your Ground Law",
      year: 2021,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Removed duty to retreat before using force in self-defense situations. Ohio joined the majority of states with stand-your-ground provisions.",
    },
    {
      title: "Ohio Noncompete Agreements (SB 7)",
      year: 2022,
      category: "Labor",
      status: "Active",
      summary:
        "Legislation limiting noncompete agreements. Ohio has been active in scrutinizing noncompete agreements following the FTC's national rulemaking.",
    },
  ],
  ok: [
    {
      title: "Oklahoma HB 4327 — Abortion Trigger Law",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "One of the nation's strictest abortion bans, criminalizing abortion at fertilization with limited exceptions. Oklahoma's law extends criminal penalties to abortion providers.",
    },
    {
      title: "Oklahoma SQ 788 — Medical Marijuana",
      year: 2018,
      category: "Cannabis",
      status: "Active",
      summary:
        "Passed with unusually broad provisions including for patient self-determination. Oklahoma has issued more medical marijuana licenses per capita than any other state.",
    },
    {
      title: "Oklahoma Permitless Open Carry",
      year: 2019,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows constitutional carry (open and concealed) without a permit for all adults 21+ (18+ for veterans).",
    },
    {
      title: "Oklahoma Education Vouchers (HB 3543)",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Oklahoma Parental Choice Tax Credit provides up to $7,500 per student in tax credits for private school tuition.",
    },
    {
      title: "Oklahoma Anti-Drag Performance Act (HB 3009)",
      year: 2023,
      category: "LGBTQ+",
      status: "Active",
      summary:
        "Restricts drag performances in public spaces where minors are present; part of a broader national legislative trend.",
    },
  ],
  or: [
    {
      title: "Oregon Death with Dignity Act (Measure 16)",
      year: 1994,
      category: "Healthcare",
      status: "Active",
      summary:
        "First law in the nation legalizing physician-assisted dying for terminally ill patients. Survived a repeal attempt in 1997 and multiple court challenges. The model for similar laws in 10+ states.",
    },
    {
      title: "Oregon Measure 110 — Drug Decriminalization",
      year: 2020,
      category: "Criminal Justice",
      status: "Amended",
      summary:
        "Decriminalized personal possession of all drugs; the first US state to do so. Treatment funding proved inadequate; recriminalized in 2024 after overdose deaths spiked.",
    },
    {
      title: "Oregon Mandatory Insurance for Guns (Measure 114)",
      year: 2022,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Requires firearm liability insurance and a permit-to-purchase process. Implementation delayed by courts; permit-to-purchase requirement being litigated.",
    },
    {
      title: "Oregon Reproductive Health Equity Act (SB 1543)",
      year: 2017,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Requires insurance plans to cover abortion and contraception without copay. Oregon has no gestational limits on abortion access.",
    },
    {
      title: "Oregon Clean Electricity and Coal Transition Plan (HB 4036)",
      year: 2016,
      category: "Energy",
      status: "Active",
      summary:
        "Requires Oregon's two major utilities to eliminate coal from their energy mix by 2030 and reach 50% renewables by 2040.",
    },
  ],
  pa: [
    {
      title: "Pennsylvania Clean Slate Act (HB 1419)",
      year: 2018,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Automatically seals certain misdemeanor and summary offense records after 10 years. Pennsylvania was one of the first states to implement automatic expungement.",
    },
    {
      title: "Pennsylvania Abortion Control Act",
      year: 1982,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Pennsylvania's existing law prohibits abortion after 24 weeks, requires 24-hour waiting period, parental consent for minors, and informed consent. Unchanged since Dobbs.",
    },
    {
      title:
        "Pennsylvania Constitution Article 1, Section 27 (Environmental Rights)",
      year: 1971,
      category: "Environment",
      status: "Active",
      summary:
        "Only state constitution with explicit environmental rights guaranteeing clean air, pure water, and the preservation of the natural environment. Interpreted broadly by courts since 2017.",
    },
    {
      title: "Pennsylvania Medical Marijuana Act (SB 3)",
      year: 2016,
      category: "Cannabis",
      status: "Active",
      summary:
        "Legalized medical marijuana in Pennsylvania; one of the largest medical cannabis markets in the country.",
    },
    {
      title: "Pennsylvania Minimum Wage Stagnation",
      year: 2006,
      category: "Labor",
      status: "Active",
      summary:
        "Pennsylvania's minimum wage remains at $7.25/hr (federal minimum), tied for the lowest in the Northeast. Multiple legislative attempts to raise it have failed, making it a persistent political issue.",
    },
  ],
  ri: [
    {
      title: "Rhode Island Reproductive Privacy Act (SB 648)",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Codified Roe v. Wade protections into state law ahead of potential federal rollback. Protects abortion access through fetal viability.",
    },
    {
      title: "Rhode Island Hate Crimes Law (Equal Access to Justice Act)",
      year: 2001,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Extends hate crime protections to sexual orientation and gender identity; among the earliest such state laws in New England.",
    },
    {
      title: "Rhode Island Medical Aid in Dying (SB 2002)",
      year: 2023,
      category: "Healthcare",
      status: "Active",
      summary:
        "Legalized medical aid in dying for terminally ill adults; Rhode Island became the 11th state to do so.",
    },
    {
      title: "Rhode Island Plastic Bag Ban (SB 2762A)",
      year: 2019,
      category: "Environment",
      status: "Active",
      summary:
        "Prohibited single-use plastic bags at retail stores; one of the strongest statewide plastic reduction laws in the Northeast.",
    },
  ],
  sc: [
    {
      title: "South Carolina Fetal Heartbeat Act (S.474)",
      year: 2023,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans most abortions after approximately 6 weeks of pregnancy when cardiac activity is detected. Upheld by the SC Supreme Court in August 2023 in a contentious 3-2 ruling — notable because three of the five justices are women, with the two dissenters arguing it violated bodily autonomy rights in the state constitution.",
    },
    {
      title: "South Carolina Constitutional Carry (H.3594)",
      year: 2023,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows law-abiding citizens 18+ to carry firearms — open or concealed — without a permit or training requirement. South Carolina joined 27 other permitless carry states; the law took effect March 7, 2024.",
    },
    {
      title: "South Carolina Voter ID Law (Act 79)",
      year: 2011,
      category: "Voting Rights",
      status: "Active",
      summary:
        "Requires a photo ID to vote in person. SC was one of the first states to have its voter ID law survive Department of Justice preclearance scrutiny under Section 5 of the Voting Rights Act (before Shelby County v. Holder gutted preclearance). Courts allowed it to take effect in 2013.",
    },
    {
      title: "South Carolina Tort Reform Act (S.431)",
      year: 2005,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Caps non-economic damages in civil lawsuits at $350,000 and limits punitive damages. Part of a broader business-friendly legal reform effort; South Carolina has among the lowest tort liability costs in the Southeast.",
    },
    {
      title: "SC Ports Authority Enabling Act & Boeing Incentive Package",
      year: 2009,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "SC offered Boeing a $900 million incentive package to build its 787 Dreamliner final assembly plant in North Charleston — the largest economic development package in SC history. Combined with the SC Ports Authority expansion, it transformed the Lowcountry into a major aerospace and logistics hub.",
    },
    {
      title: "South Carolina Right to Work Law",
      year: 1954,
      category: "Labor",
      status: "Active",
      summary:
        "Prohibits mandatory union membership as a condition of employment. South Carolina has one of the lowest union membership rates in the nation (~2%) and aggressively markets this in recruiting foreign manufacturers — BMW, Michelin, Volvo, and Mercedes-Benz Vans all have major SC plants.",
    },
    {
      title: "South Carolina Hate Crimes Act (S.1100)",
      year: 2023,
      category: "Criminal Justice",
      status: "Active",
      summary:
        "Enacted hate crime legislation 28 years after the Emanuel AME Church massacre in Charleston (2015) — where nine Black parishioners were killed in a racially-motivated shooting. South Carolina was one of the last states to pass hate crime protections; the law adds enhanced penalties for crimes motivated by bias.",
    },
    {
      title: "SC Education Scholarship Trust Fund (ESTF, H.4655)",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Creates universal school choice through Education Scholarship Trust Fund accounts providing up to $6,000 per student annually for private school tuition, homeschooling, tutoring, and educational therapies. Open to all SC families regardless of income.",
    },
    {
      title: "South Carolina Right to Farm Act",
      year: 1981,
      category: "Agriculture",
      status: "Active",
      summary:
        "Protects established agricultural and forestry operations — particularly poultry, hog, and peach farming — from nuisance lawsuits as coastal and suburban development expands into rural areas. South Carolina is the top US producer of peaches east of the Rockies.",
    },
    {
      title: "South Carolina Solar Energy Incentives Act (S.1087)",
      year: 2014,
      category: "Energy",
      status: "Active",
      summary:
        "Provides a 25% tax credit for residential solar installations (up to $3,500) and net metering rights. South Carolina has emerged as a top-10 solar state by installed capacity, driven partly by the legislation and Duke Energy's large solar procurements.",
    },
  ],
  sd: [
    {
      title: "South Dakota Measure 22 — Ethics Commission",
      year: 2016,
      category: "Voting Rights",
      status: "Repealed",
      summary:
        "Voter-approved government accountability measure; the legislature repealed it within days of the new session using an emergency clause, one of the most controversial uses of legislative power in South Dakota history.",
    },
    {
      title: "South Dakota Medical Marijuana (Amendment A)",
      year: 2020,
      category: "Cannabis",
      status: "Active",
      summary:
        "Voters approved both medical and recreational marijuana; Gov. Noem challenged recreational legalization in court, blocking it until 2023.",
    },
    {
      title: "South Dakota No Income Tax / Financial Services Hub",
      year: 1980,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "South Dakota eliminated its usury cap in 1981, attracting Citibank and creating the modern credit card industry. Combined with no income or capital gains tax, SD has become the nation's premier trust and financial services domicile.",
    },
    {
      title: "South Dakota Trigger Abortion Ban (HB 1318)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Near-total abortion ban that took immediate effect upon the Supreme Court's Dobbs decision. Governor Noem said no special session was needed; the trigger law applied automatically.",
    },
  ],
  tn: [
    {
      title: "Tennessee Heartbeat Law (SB 2196)",
      year: 2019,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans all abortions after approximately 6 weeks; near-total ban trigger took effect in 2022 with exceptions only for life of the mother.",
    },
    {
      title: "Tennessee Expulsion of Representatives (2023 'Tennessee Three')",
      year: 2023,
      category: "Civil Rights",
      status: "Repealed",
      summary:
        "Tennessee House expelled two Black Democratic representatives for leading a gun control protest on the House floor after the Covenant School massacre. One was later reinstated by his local council; the expulsions drew national attention to legislative decorum laws.",
    },
    {
      title: "Tennessee Anti-Drag Performance Law (SB 3)",
      year: 2023,
      category: "LGBTQ+",
      status: "Active",
      summary:
        "Restricts 'adult cabaret' performances, including drag shows, in public or where minors could be present. A federal judge struck it down but a higher court allowed enforcement to resume.",
    },
    {
      title: "Tennessee School Vouchers (Governor's Education Savings Account)",
      year: 2019,
      category: "Education",
      status: "Active",
      summary:
        "Created a school voucher program; controversial rollout with legal challenges. Expanded significantly in 2023.",
    },
    {
      title: "Tennessee Constitutional Carry (HB 786)",
      year: 2021,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows permitless carry for Tennesseans 21+. Notably passed just weeks after the Covenant School shooting in Nashville (2023) without additional restrictions.",
    },
  ],
  tx: [
    {
      title: "Texas Heartbeat Act (SB 8)",
      year: 2021,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Novel enforcement mechanism using private civil lawsuits rather than government prosecution; bans abortion after 6 weeks. The unique design circumvented immediate federal court blocking, allowing it to remain in effect pending Dobbs.",
    },
    {
      title: "Texas Senate Bill 4 — Immigration Enforcement",
      year: 2023,
      category: "Immigration",
      status: "Active",
      summary:
        "Allows Texas law enforcement to arrest migrants who cross the border illegally and creates a state crime for illegal entry. Challenged as unconstitutional; enforcement paused and resumed multiple times through 2024.",
    },
    {
      title: "Texas Education Savings Account (HB 1)",
      year: 2023,
      category: "Education",
      status: "Active",
      summary:
        "Largest school voucher program in US history by dollar amount: $500M+ annually for private school scholarships.",
    },
    {
      title: "Texas Permitless Carry (HB 1927)",
      year: 2021,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Allows Texas residents 21+ to carry handguns without a license or training. Texas had historically required a license; the shift was politically significant given the state's size.",
    },
    {
      title: "Texas Anti-ESG Investment Law (SB 13)",
      year: 2021,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Prohibits state pension funds from investing in companies that 'boycott' the energy sector. Part of broader red-state pushback against ESG (Environmental, Social, Governance) investing.",
    },
    {
      title: "Texas Property Tax Reform (SB 2)",
      year: 2023,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Largest property tax cut in Texas history ($18 billion); increases homestead exemption to $100,000 and caps appraisal increases. Approved by voters November 2023.",
    },
  ],
  ut: [
    {
      title: "Utah Social Media Regulation Act (HB 311)",
      year: 2023,
      category: "Technology",
      status: "Active",
      summary:
        "Requires parental consent for minors to use social media, mandates 'safe harbor' hours, and bans platforms from addiction-promoting algorithms for minors. Partially blocked by federal court.",
    },
    {
      title: "Utah Compact on Immigration",
      year: 2011,
      category: "Immigration",
      status: "Active",
      summary:
        "Nation's first comprehensive state immigration agreement emphasizing humane treatment, family unity, and economic reality — a moderate contrast to Arizona's SB 1070.",
    },
    {
      title: "Utah Medicaid Work Requirement (Prop 3 + SB 96)",
      year: 2019,
      category: "Healthcare",
      status: "Amended",
      summary:
        "Voters approved full Medicaid expansion; legislature modified it to impose work requirements. CMS rejected the work requirement; full expansion implemented 2020.",
    },
    {
      title: "Utah Liquor Control Laws (DABC)",
      year: 1935,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Utah maintains one of the most restrictive alcohol licensing systems in the nation through the Dept. of Alcoholic Beverage Services, reflecting LDS community values.",
    },
    {
      title: "Utah Abortion Trigger Law (HB 2019)",
      year: 2020,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Bans abortion except for rape, incest, severe fetal abnormalities, and life of the mother. Took effect in 2022 after initially delayed by court order.",
    },
  ],
  vt: [
    {
      title: "Vermont Proposition 5 — Reproductive Autonomy",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Constitutional amendment explicitly enshrining the right to personal reproductive autonomy, including abortion, passed by 77% of voters. Vermont was the first state to add this right to its constitution.",
    },
    {
      title: "Vermont Universal School Meals (Act 68)",
      year: 2022,
      category: "Education",
      status: "Active",
      summary:
        "First state to make universal free school meals permanent (beyond COVID waivers). Expanded nationally discussed, but Vermont was the first to codify it into law.",
    },
    {
      title: "Vermont Affordable Heat Act (S.5)",
      year: 2023,
      category: "Energy",
      status: "Active",
      summary:
        "Created a Clean Heat Standard requiring fuel dealers to reduce greenhouse gas emissions from heating fuels. Gov. Scott vetoed it twice; the legislature overrode the veto.",
    },
    {
      title: "Vermont Single Payer Healthcare Attempt (Act 48)",
      year: 2011,
      category: "Healthcare",
      status: "Repealed",
      summary:
        "The most ambitious attempt at single-payer healthcare in US history. Gov. Shumlin abandoned it in 2014 when projected costs (>$2B for a state of 620K) proved prohibitive.",
    },
    {
      title: "Vermont Cannabis Act (S.54)",
      year: 2018,
      category: "Cannabis",
      status: "Active",
      summary:
        "First state to legalize recreational marijuana through the legislature (not a ballot initiative). Vermont signed the bill into law via the legislature, setting a precedent.",
    },
  ],
  va: [
    {
      title: "Virginia Voting Rights Act (HB 1890)",
      year: 2021,
      category: "Voting Rights",
      status: "Active",
      summary:
        "State-level voting rights act prohibiting voter suppression practices, passed as a direct response to the Supreme Court's weakening of the federal Voting Rights Act.",
    },
    {
      title: "Virginia Marijuana Legalization (SB 1406)",
      year: 2021,
      category: "Cannabis",
      status: "Active",
      summary:
        "Virginia became the first Southern state to legalize adult recreational marijuana through the legislature. Retail sales began in 2024.",
    },
    {
      title: "Virginia CLEAN Economy Act",
      year: 2020,
      category: "Energy",
      status: "Active",
      summary:
        "Sets 100% carbon-free electricity standard by 2045 for Dominion Energy and 2050 for Appalachian Power. Most comprehensive clean energy law in the South.",
    },
    {
      title: "Virginia Equal Rights Amendment (HJ 1)",
      year: 2020,
      category: "Civil Rights",
      status: "Active",
      summary:
        "Virginia became the 38th state to ratify the federal Equal Rights Amendment in January 2020, potentially completing the constitutional ratification process (though the legal status remains contested federally).",
    },
    {
      title: "Virginia Gun Safety Laws (HB 421)",
      year: 2020,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Package of gun control measures passed when Democrats took the legislature: universal background checks, one-handgun-per-month limit, and red flag law. A dramatic change for a traditionally gun-permissive state.",
    },
  ],
  wa: [
    {
      title: "Washington Climate Commitment Act (SB 5126)",
      year: 2021,
      category: "Environment",
      status: "Active",
      summary:
        "Cap-and-invest program for greenhouse gas emissions — only the second state after California to implement economy-wide carbon pricing. Challenged by Initiative 2117 in 2024 (which passed, repealing it).",
    },
    {
      title: "Washington Reproductive Privacy Act (HB 1008)",
      year: 2023,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Protects providers and patients who come to Washington for abortions from legal actions by other states. Part of a growing 'shield law' trend post-Dobbs.",
    },
    {
      title: "Washington My Health MY Data Act (SB 5536)",
      year: 2023,
      category: "Technology",
      status: "Active",
      summary:
        "First state law specifically protecting consumer health data outside HIPAA scope; covers data collected by apps, wearables, and non-medical entities.",
    },
    {
      title: "Washington Universal Long-Term Care Program (WA Cares Fund)",
      year: 2019,
      category: "Healthcare",
      status: "Active",
      summary:
        "Nation's first and only public long-term care insurance program, funded by a payroll tax. Provides $36,500+ in lifetime benefits for care needs.",
    },
    {
      title: "Washington Wealth Tax (Capital Gains Tax, SB 5096)",
      year: 2021,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "7% excise tax on capital gains above $250K — upheld by the Washington Supreme Court in 2023. Washington had no income tax; critics argued this was an unconstitutional income tax.",
    },
  ],
  wv: [
    {
      title: "West Virginia HOPE Scholarship (HB 2013)",
      year: 2021,
      category: "Education",
      status: "Active",
      summary:
        "Universal education savings account program allowing families to use public school funding for private or home education — the most expansive ESA in the country at passage.",
    },
    {
      title: "West Virginia Abortion Trigger Law (SB 4008)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Near-total abortion ban passed in a special session after Dobbs. One of the first post-Dobbs legislative bans to pass; only exceptions for life of mother, rape, and incest.",
    },
    {
      title: "West Virginia Industrial Hemp Act",
      year: 2018,
      category: "Agriculture",
      status: "Active",
      summary:
        "One of the earliest state laws to establish a comprehensive hemp production framework; West Virginia is a major hemp producer.",
    },
    {
      title: "West Virginia Coalfield Tax Relief / Coal Economy Transition",
      year: 2022,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Addresses the economic transition from coal; various tax incentives for manufacturing and data centers to replace lost coal employment.",
    },
    {
      title: "West Virginia Consumer Protection from ESG Investing",
      year: 2022,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Restricts state banking contracts from institutions that discriminate against energy companies. West Virginia vs. EPA (2022) — WV also won the landmark SCOTUS case limiting EPA's climate regulatory power.",
    },
  ],
  wi: [
    {
      title: "Wisconsin Act 10 (Collective Bargaining Restrictions)",
      year: 2011,
      category: "Labor",
      status: "Active",
      summary:
        "Gov. Walker's landmark law eliminated most collective bargaining rights for public sector unions, limited union dues, and required annual recertification votes. Led to the largest state protests in US history and a recall election.",
    },
    {
      title: "Wisconsin Abortion Law (1849 Statute)",
      year: 1849,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Wisconsin's near-total pre-Roe abortion ban (with exception only for life of mother) was revived by Dobbs. A Democratic AG declined to enforce it; the law's status remains in ongoing legal dispute.",
    },
    {
      title: "Wisconsin Gerrymandering (2011 REDMAP Maps)",
      year: 2011,
      category: "Voting Rights",
      status: "Amended",
      summary:
        "Wisconsin's Republican-drawn maps were among the most extreme partisan gerrymanders in the nation. Partially redrawn by courts in 2023 following a Democratic State Supreme Court majority.",
    },
    {
      title: "Wisconsin Open Carry Law",
      year: 1998,
      category: "Gun Policy",
      status: "Active",
      summary:
        "Wisconsin generally allows open carry without a permit; concealed carry permit required. Constitutional carry efforts have not passed.",
    },
    {
      title: "Wisconsin Dairy Industry Regulations (DATCP)",
      year: 1945,
      category: "Agriculture",
      status: "Active",
      summary:
        "Wisconsin's comprehensive dairy regulations through the Dept of Agriculture have shaped the state as 'America's Dairyland,' with some of the strictest milk quality and cheese standards in the nation.",
    },
  ],
  wy: [
    {
      title: "Wyoming Abortion Ban (HB 92)",
      year: 2022,
      category: "Abortion & Reproductive",
      status: "Active",
      summary:
        "Trigger law banning nearly all abortions that took effect with Dobbs. Wyoming courts have issued injunctions; the state has fought the litigation aggressively.",
    },
    {
      title: "Wyoming Constitutional Carry (HB 111)",
      year: 2011,
      category: "Gun Policy",
      status: "Active",
      summary:
        "One of the earliest constitutional carry laws in the nation; Wyoming allows permitless carry for residents.",
    },
    {
      title: "Wyoming Digital Asset Framework (SF 0038)",
      year: 2019,
      category: "Technology",
      status: "Active",
      summary:
        "Wyoming created the most permissive crypto regulatory framework in the US, becoming the legal home of major crypto companies. Established the first bank charter for crypto institutions (SPDI).",
    },
    {
      title: "Wyoming No Income Tax (Constitutional Prohibition)",
      year: 1969,
      category: "Tax & Finance",
      status: "Active",
      summary:
        "Wyoming's constitution prohibits a personal income tax; the state relies primarily on mineral extraction taxes, making it highly dependent on coal, oil, and gas revenues.",
    },
    {
      title: "Wyoming Wolf Management Act",
      year: 2012,
      category: "Agriculture",
      status: "Active",
      summary:
        "Classifies gray wolves as predatory animals outside designated wilderness and national park areas, allowing hunting. Controversial given Wyoming's role in the Yellowstone wolf reintroduction program.",
    },
  ],
};

// ─── Legal Status Data ────────────────────────────────────────────────────────
type LegalStatusValue =
  | "Legal"
  | "Illegal"
  | "Decriminalized"
  | "Medical Only"
  | "Restricted"
  | "Varies";

interface LegalStatusItem {
  topic: string;
  icon: string;
  status: LegalStatusValue;
  note?: string;
}

const STATUS_BADGE: Record<LegalStatusValue, string> = {
  Legal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Illegal: "text-red-400 bg-red-500/10 border-red-500/30",
  Decriminalized: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "Medical Only": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  Restricted: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  Varies: "text-violet-400 bg-violet-500/10 border-violet-500/30",
};

const STATE_LEGAL_STATUS: Record<string, LegalStatusItem[]> = {
  al: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "No medical either; possession is a misdemeanor",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Compassion Act (2021) — limited CBD/low-THC",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; no rape/incest exceptions",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2023",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Federal law applies",
    },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; nitrogen hypoxia used 2024",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No red flag / ERPO law enacted",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale of raw milk prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "No clear statutory framework; courts may not enforce",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  ak: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2014 (Measure 2); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 1998",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected by state constitution",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry; no license required",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not authorized",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1957",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Enforceable surrogacy agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  az: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2020 (Prop 207); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2010",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "15-week ban (SB 1164); limited exceptions",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2010",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2021",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law enacted",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and retail permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Enforceable contracts; progressive framework",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal compact",
    },
  ],
  ar: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Ballot measure failed 2022",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Legal since 2016 amendment",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; no rape/incest exceptions",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2013",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    { topic: "Sports Betting", icon: "🎲", status: "Illegal" },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "No statutory framework; unenforced",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  ca: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2016 (Prop 64); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 1996 (Prop 215)",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Decriminalized",
      note: "Decrim in several cities; SB 58 (2023) decrim for adults",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "No gestational limits; state constitution protected",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; 'good cause' removed by Bruen",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Generally banned in public",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not yet authorized statewide",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Restricted",
      note: "On moratorium since 2019",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "End of Life Option Act (2015)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "GVRO enacted 2014; one of the first in nation",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Most consumer fireworks banned; localities vary",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail sale allowed; licensed dairies only",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Fully enforceable; most permissive state",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized; tribal gaming only",
    },
  ],
  co: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "First state to legalize (2012); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2000",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Legal",
      note: "Prop 122 (2022) legalized regulated use; 21+",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "No restrictions at any gestational age",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "Localities may restrict",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2019",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2020",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "End of Life Options Act (2016)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2019",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide; localities vary",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and herdshare permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Fully enforceable agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized statewide",
    },
  ],
  ct: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2021; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2012",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected through viability and beyond for health",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; discretionary",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Restricted",
      note: "Permit required",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished prospectively 2012",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Death with Dignity Act (2021)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 1999 — one of the first in nation",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Legally recognized and enforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino and poker authorized 2021",
    },
  ],
  de: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2023; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2011",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected through viability",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit needed",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2018",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Struck down by DE Supreme Court 2016",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2018",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Enforceable agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino gaming authorized 2012",
    },
  ],
  fl: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Ballot measure narrowly failed Nov 2024 (needed 60%)",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Amendment 2 (2016)",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "6-week ban (SB 300) in effect since May 2024",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2023 (HB 543)",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Open carry generally prohibited",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Seminole compact authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; reduced jury threshold to 8/12 in 2023",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "Risk Protection Order enacted 2018 after Parkland",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Legal only for certain agricultural uses; consumer use technically prohibited but widely sold",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited; pet food loophole exists",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Comprehensive Surrogacy Act (2015)",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal compact",
    },
  ],
  ga: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Low-THC oil only (HB 324, 2019)",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "6-week ban (LIFE Act) since 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2022",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "Weapons Carry License not required for open carry",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not yet authorized",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Enforceable gestational surrogacy agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  hi: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2024; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2000",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected under state law; no gestational limits",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue post-Bruen",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Generally prohibited",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    { topic: "Sports Betting", icon: "🎲", status: "Illegal" },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1957",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Our Care Our Choice Act (2018)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2020",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide due to fire risk",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  id: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Illegal",
      note: "No medical program; CBD only (hemp-derived)",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; trigger law active since 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2016",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    { topic: "Sports Betting", icon: "🎲", status: "Illegal" },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law; preempts local ordinances",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail sale permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "No statutory framework; agreements may be unenforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  il: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2019; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2013",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Decriminalized",
      note: "Decrim in Chicago; statewide still illegal",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Codified right; sanctuary state post-Dobbs",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; only state that was last to allow CC",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Prohibited in most public places",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2019",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2011",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "FOID-based firearm removal; ERPO enacted 2019",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale of raw milk prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Gestational Surrogacy Act (2004) — fully enforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online sports betting and casino gaming authorized 2019",
    },
    {
      topic: "Cash Bail",
      icon: "🏦",
      status: "Illegal",
      note: "SAFE-T Act eliminated cash bail statewide (Jan 2023) — first in US",
    },
    {
      topic: "Assault Weapons",
      icon: "⚙️",
      status: "Illegal",
      note: "Assault weapons ban enacted Jan 2023 (PICA); challenged in courts",
    },
  ],
  in: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Illegal",
      note: "No medical program",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; first post-Dobbs state to pass a ban",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2022",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2019",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "Surrogacy contracts void and unenforceable under state law",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  ia: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Very restricted CBD/low-THC program",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "6-week ban effective 2024",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2021",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2019",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1965",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; courts apply case-by-case",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  ks: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    { topic: "Medical Cannabis", icon: "💊", status: "Illegal" },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Voters rejected abortion ban 59-41% in 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2015",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2022",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active but moratorium since 1994 (no executions)",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted; limited retail",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; court enforcement varies",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  ky: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Legalized 2023; program launching 2025",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; trigger law active since 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2019",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not yet authorized",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; enforceability unclear",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  la: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Decriminalized",
      note: "Decrim (≤14g = civil fine); not fully legal",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Medical program active since 2015",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; trigger law since 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2024 (July)",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; most executions per capita",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "Surrogacy contracts void under Louisiana law",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online sports betting authorized 2021; casino gaming via tribal compact",
    },
  ],
  me: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2016; retail sales since 2020",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 1999",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected; no gestational limit in state law",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2015",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2022",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1887",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Death with Dignity Act (2019)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "Yellow Flag Law enacted 2024 after Lewiston shooting",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal; local rules vary",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements legally recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  md: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2023; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2014",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Constitutional right enshrined Nov 2024",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; restrictive but shall-issue post-Bruen",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Not generally permitted",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2013",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "End-of-Life Option Act (2023)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2018",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Maryland Family Law recognizes gestational surrogacy",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino gaming authorized 2021",
    },
  ],
  ma: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2016; first East Coast state",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2012",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected through 24 weeks; beyond for health",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "License required; may-issue transitioning to shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Restricted",
      note: "Technically allowed with license; uncommon",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "First state to legalize (2004)",
    },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2022",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1984",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2018",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm and retail sales permitted with permit",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy contracts enforceable under state law",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Online casino gaming not yet authorized",
    },
  ],
  mi: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "First Midwest state; legal since 2018",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2008",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Decriminalized",
      note: "Decrim in Ann Arbor, Detroit; statewide still illegal",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Constitutional right enshrined by Proposal 3 (2022)",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "CPL required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required; local restrictions apply",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2019",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1847 — first English-speaking jurisdiction",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2023",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal; local rules vary",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and herdshare permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Michigan Surrogate Parenting Act updated; enforceable agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino gaming and poker authorized 2019",
    },
  ],
  mn: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2023; retail sales began 2025",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2014",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Codified right; protected under state constitution",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Restricted",
      note: "Technically allowed with permit",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not yet authorized (tribal gaming exists)",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1911",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "End of Life Option Act (2023)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2023",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Only certain consumer fireworks permitted; no aerial fireworks",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Parentage Act recognizes surrogacy agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal gaming",
    },
  ],
  ms: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Program active since 2022 (after court voided Measure 1)",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; Mississippi ban was the Dobbs case",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2013",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Long authorized at casinos",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "No statutory framework; historically not enforced",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Land-based casino only; no online platform",
    },
  ],
  mo: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2022 (Amendment 3); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2018",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Amendment 3 (2024) restored abortion rights; overrode prior ban",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2016; 19+",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not yet authorized",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; among most active states",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO — state law preempts local red flag ordinances",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and cow-share programs permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; courts enforce on case-by-case basis",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  mt: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2020 (CI-118); retail since 2022",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2004",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "CI-128 (2024) enshrined constitutional right",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2021",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active but rarely used",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Allowed by court ruling (Baxter v. Montana, 2009)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal; county restrictions vary",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements enforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal gaming",
    },
  ],
  ne: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Initiative 437 (2024) passed; implementation ongoing",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Initiative 438 (2024) passed simultaneously",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "12-week ban (LB 574) since 2023",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2023",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Limited to keno and horse racing; expanded 2024",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; voters rejected abolition in 2016",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and herdshare permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; courts may enforce",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized statewide",
    },
  ],
  nv: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2016; over $1B in annual sales",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2001",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected through 24 weeks since 1990 referendum",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required in most areas",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Legal for decades; the original sports betting state",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; rarely carried out",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "End of Life Option Act (2023 — effective 2024)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2019",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide; Clark County restricted",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Nevada Parentage Act fully recognizes surrogacy",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online poker authorized since 2013; full online casino gaming",
    },
  ],
  nh: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legalized 2024 — last New England state to do so",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Therapeutic Cannabis Program since 2013",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "24-week ban with limited exceptions",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2017; only New England state",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "First in New England; authorized 2019",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2019 (legislature override of veto)",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO — Live Free or Die ethos prevails",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail and direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond DraftKings fantasy",
    },
  ],
  nj: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2021 (Public Question 1); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2010",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Codified right; sanctuary state post-Dobbs",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; most public spaces designated sensitive areas",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Effectively prohibited",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "NJ was the state that challenged the federal ban (Murphy v. NCAA)",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2007",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Aid in Dying for the Terminally Ill Act (2019)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2019",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "New Jersey Gestational Carrier Agreement Act (2018)",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino gaming and poker authorized 2013",
    },
  ],
  nm: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2021; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2007",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "No restrictions; major destination for TX patients",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Tribal compact only",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2009",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Elizabeth Whitefield End of Life Options Act (2021)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2020",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Seasonal bans during fire danger; localities restrict heavily",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm and retail sales permitted with licensing",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements enforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal compact",
    },
  ],
  ny: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2021; retail rollout ongoing",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2014",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Illegal",
      note: "Bills introduced but not passed",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Protected through 24 weeks; beyond for health",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; strict sensitive locations post-Bruen",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Illegal",
      note: "Effectively prohibited statewide",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Mobile betting since 2022",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Court struck it down 2004; never reinstated",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2019; expanded 2022",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail sale permitted with license; on-farm sales allowed",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Child-Parent Security Act (2021) — fully enforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Online casino gaming not yet authorized; legislation pending",
    },
  ],
  nc: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "NC Farm Act (2023) — hemp/CBD only; full med bill stalled",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "12-week ban (SB 20) since July 2023; exceptions apply",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2023; mobile sports betting launched 2024",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; Racial Justice Act repeal controversies",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law enacted",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Limited consumer fireworks; aerial prohibited without permit",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted; not at retail",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements recognized; no prohibitive statute",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not yet authorized",
    },
  ],
  nd: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Ballot measure failed 2022",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Legal since 2016 (Measure 5)",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban active since 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2017",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Not authorized",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Authorized but no execution since 1905",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "Surrogacy contracts void and unenforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  oh: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Issue 2 (2023) legalized; 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2016",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Issue 1 (2023) enshrined constitutional right to abortion",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2022",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Mobile betting launched Jan 2023",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; moratorium since 2021 pending drug supply issues",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2024",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide since 2022",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and herdshare permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Gestational surrogacy legally recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Online casino gaming not yet authorized",
    },
  ],
  ok: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "SQ 820 failed March 2023",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "SQ 788 (2018); most licenses per capita in US",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Banned at fertilization; among strictest in US",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2019; 21+",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Restricted",
      note: "Tribal compacts only",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; resumed 2021 after pause",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements enforceable under state law",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal gaming",
    },
  ],
  or: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2014; first state to decriminalize all drugs (2020)",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 1998",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Legal",
      note: "Measure 109 (2020) — supervised therapeutic use centers; 21+",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "No gestational limits; insurance must cover",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit-to-purchase (Measure 114) being litigated",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Restricted",
      note: "Local jurisdictions may ban",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized via lottery",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Restricted",
      note: "On moratorium since 2011",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Death with Dignity Act (1994) — first in the nation",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2018; expanded by Measure 114",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide; fire risk",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm and retail sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Fully enforceable surrogacy agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized statewide",
    },
  ],
  pa: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Legislature has not passed legalization despite bills",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "One of the largest medical markets; since 2016",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "24-week limit with 24-hr wait; no new restrictions post-Dobbs",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "License required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No license required outside Philadelphia",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2017; among first states",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Restricted",
      note: "Moratorium declared by governor; not abolished",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2023 under Gov. Shapiro",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal for PA residents since 2017",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail sale permitted with permit — PA has one of the largest raw milk markets",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; courts handle case-by-case",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino gaming and poker authorized 2017",
    },
  ],
  ri: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Legal since 2022; retail sales began Dec 2022",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2006",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Codified right through viability (SB 648, 2019)",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Attorney General issues permits; may-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Restricted",
      note: "Technically allowed; rarely practiced",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2018",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1984",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Rhode Island Medical Aid in Dying Act (2023)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2018",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Illegal",
      note: "Retail sale prohibited",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Legal",
      note: "Online casino gaming authorized 2023",
    },
  ],
  sc: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "No recreational or comprehensive medical program; hemp CBD only",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Illegal",
      note: "Compassionate Care Act has failed repeatedly in the SC Senate",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "6-week ban (S.474) upheld by SC Supreme Court in August 2023",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since March 7, 2024 (H.3594); 18+",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "Open carry also allowed permitless since H.3594",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Federal law applies; SC constitution still has ban language",
    },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "One of few states with no legal sports betting framework",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; SC resumed executions in 2024 using firing squad",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law enacted",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Gestational surrogacy agreements legally recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized",
    },
  ],
  sd: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "Delayed by Gov. Noem challenge; legal since 2023",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Amendment A (2020) passed; program active",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; trigger law activated immediately on Dobbs",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2019",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Restricted",
      note: "In-person only in Deadwood; no mobile",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm and retail sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; courts may enforce case-by-case",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond Deadwood casinos",
    },
  ],
  tn: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Illegal",
      note: "No program; hemp-derived CBD allowed",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; trigger law with exception for mother's life only",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2021; 21+",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2019; online only",
    },
    { topic: "Death Penalty", icon: "⚖️", status: "Legal", note: "Active" },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO — effort to pass failed after Covenant School shooting",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Illegal",
      note: "Surrogacy contracts unenforceable under TN law",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "No online casino gaming authorized",
    },
  ],
  tx: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Compassionate Use Program; very limited THC cap",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "SB 8 (6-week) + trigger ban; criminal penalties for providers",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2021 (HB 1927)",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "Long gun open carry; handgun open carry with permit prior; now permitless",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Federal law; Texas AG argued against in 2021",
    },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Legislature has rejected multiple times",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Most executions of any state in the US",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO — legislature blocked after El Paso and Uvalde shootings",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp; TX passed law to nullify federal rules (blocked by courts)",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal in most of TX; ban within city limits varies",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail sale from licensed dairy permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Texas Family Code recognizes gestational agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized; frequent legalization attempts blocked",
    },
  ],
  ut: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Prop 2 (2018); legislature modified program significantly",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Trigger ban with rape/incest/health exceptions; court injunctions ongoing",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2021",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Illegal",
      note: "Banned; state constitution prohibits gambling",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; firing squad option restored 2015",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2019",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Seasonal bans; fire danger — desert climate means strict restrictions",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail sale with permit; direct farm sales also permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Utah Parentage Act recognizes gestational surrogacy agreements",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Prohibited by state constitution",
    },
  ],
  vt: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "First state to legalize via legislature (2018); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2004",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Constitutional right enshrined by Prop 5 (2022); 77% voted yes",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Never required a permit; constitutional carry since founding",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "First state to legalize via legislature override (2009)",
    },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2023",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1964",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Patient Choice and Control at End of Life Act (2013)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2018",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Illegal",
      note: "Consumer fireworks banned statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail and direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements legally recognized",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond state sports betting",
    },
  ],
  va: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "First Southern state to legalize via legislature (2021); retail since 2024",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 2018",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Restricted",
      note: "15-week ban enacted 2023 by GOP-led legislature; governor signed",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required; localities may limit in some areas",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Authorized 2020; one of the biggest markets",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 2021 — first Southern state to do so",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2020 as part of broader gun safety package",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Localities control; most urban areas ban consumer fireworks",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail and direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Surrogacy agreements recognized and enforceable",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Online casino gaming not authorized",
    },
  ],
  wa: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Legal",
      note: "First state to legalize (tie with CO in 2012); 21+",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Legal",
      note: "Legal since 1998",
    },
    {
      topic: "Psilocybin / Mushrooms",
      icon: "🍄",
      status: "Decriminalized",
      note: "SB 5263 (2023) created working group; personal use decriminalized",
    },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Legal",
      note: "Shield law protects providers; no gestational limits in state law",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Permit required; shall-issue; assault weapons restricted",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required; some local restrictions",
    },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Restricted",
      note: "Tribal casinos only; online not yet authorized",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Restricted",
      note: "Moratorium since 2014; court struck it as unconstitutional in 2018",
    },
    {
      topic: "Physician-Assisted Dying",
      icon: "🏥",
      status: "Legal",
      note: "Death with Dignity Act (2008)",
    },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Legal",
      note: "ERPO enacted 2016 — one of the first states",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Illegal",
      note: "Banned statewide",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Restricted",
      note: "Consumer fireworks banned in most areas; local exceptions in rural counties",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Retail and direct farm sales permitted with licensing",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Legal",
      note: "Washington Uniform Parentage Act fully supports surrogacy",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized statewide",
    },
  ],
  wv: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Medical Only",
      note: "Medical Cannabis Act (2017); program launched 2019",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Near-total ban; trigger law since 2022",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2016",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "First state to launch mobile sports betting after PASPA repeal",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1965",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; enforceability unclear",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond sports betting",
    },
  ],
  wi: [
    {
      topic: "Recreational Cannabis",
      icon: "🌿",
      status: "Illegal",
      note: "Gov. Evers has vetoed GOP-backed partial legalization; no law passed",
    },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Illegal",
      note: "No medical program; limited hemp-derived CBD only",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "1849 near-total ban revived by Dobbs; enforcement disputed but chilling effect real",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Restricted",
      note: "Carry permit required (CCW); shall-issue; no permitless carry",
    },
    {
      topic: "Open Carry",
      icon: "🛡️",
      status: "Legal",
      note: "No permit required for open carry; localities cannot restrict",
    },
    {
      topic: "Same-Sex Marriage",
      icon: "🏳️‍🌈",
      status: "Legal",
      note: "Federal law applies; WI constitution still has ban language from 2006",
    },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Restricted",
      note: "Tribal casinos only; no commercial or online sports betting",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Illegal",
      note: "Abolished 1853 — one of the first states to abolish",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO — GOP-controlled legislature has blocked all efforts",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks legal statewide; local rules may apply",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales and herdshare programs permitted; WI is a major dairy state",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; courts vary on enforceability",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond tribal gaming compacts",
    },
  ],
  wy: [
    { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
    {
      topic: "Medical Cannabis",
      icon: "💊",
      status: "Illegal",
      note: "No program; CBD-only (hemp-derived)",
    },
    { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
    {
      topic: "Abortion",
      icon: "⚕️",
      status: "Illegal",
      note: "Trigger ban + felony statute; courts have issued injunctions",
    },
    {
      topic: "Concealed Carry",
      icon: "🔫",
      status: "Legal",
      note: "Permitless carry since 2011; one of the first states",
    },
    { topic: "Open Carry", icon: "🛡️", status: "Legal" },
    { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
    {
      topic: "Sports Betting",
      icon: "🎲",
      status: "Legal",
      note: "Mobile sports betting authorized 2021",
    },
    {
      topic: "Death Penalty",
      icon: "⚖️",
      status: "Legal",
      note: "Active; rarely used",
    },
    { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
    {
      topic: "Red Flag Law",
      icon: "🚩",
      status: "Illegal",
      note: "No ERPO / red flag law",
    },
    {
      topic: "Suppressors / Silencers",
      icon: "🔇",
      status: "Legal",
      note: "Legal with federal NFA tax stamp",
    },
    {
      topic: "Recreational Fireworks",
      icon: "🎆",
      status: "Legal",
      note: "Consumer fireworks broadly legal statewide",
    },
    {
      topic: "Raw Milk Sales",
      icon: "🥛",
      status: "Legal",
      note: "Direct farm sales permitted",
    },
    {
      topic: "Commercial Surrogacy",
      icon: "👶",
      status: "Varies",
      note: "No specific statute; limited case law",
    },
    {
      topic: "Online Gambling / Poker",
      icon: "🃏",
      status: "Illegal",
      note: "Not authorized beyond mobile sports betting",
    },
  ],
};

const DEFAULT_LEGAL_STATUS: LegalStatusItem[] = [
  { topic: "Recreational Cannabis", icon: "🌿", status: "Illegal" },
  { topic: "Medical Cannabis", icon: "💊", status: "Medical Only" },
  { topic: "Psilocybin / Mushrooms", icon: "🍄", status: "Illegal" },
  { topic: "Abortion", icon: "⚕️", status: "Restricted" },
  {
    topic: "Concealed Carry",
    icon: "🔫",
    status: "Restricted",
    note: "Permit required",
  },
  { topic: "Open Carry", icon: "🛡️", status: "Varies" },
  { topic: "Same-Sex Marriage", icon: "🏳️‍🌈", status: "Legal" },
  { topic: "Sports Betting", icon: "🎲", status: "Varies" },
  { topic: "Death Penalty", icon: "⚖️", status: "Varies" },
  { topic: "Physician-Assisted Dying", icon: "🏥", status: "Illegal" },
];

const DEFAULT_STATE_LAWS: StateLaw[] = [
  {
    title: "State Minimum Wage Law",
    year: 2020,
    category: "Labor",
    status: "Active",
    summary:
      "Sets the minimum hourly wage for workers in the state, reflecting regional cost of living and legislative priorities.",
  },
  {
    title: "State Environmental Regulations",
    year: 2015,
    category: "Environment",
    status: "Active",
    summary:
      "Establishes standards for air and water quality, waste management, and land use within state jurisdiction.",
  },
  {
    title: "State Education Funding Formula",
    year: 2010,
    category: "Education",
    status: "Active",
    summary:
      "Determines how state education dollars are distributed among school districts based on enrollment, need, and local tax capacity.",
  },
];

function LegalStatusGrid({ state }: { state: USState }) {
  const items = STATE_LEGAL_STATUS[state.id] ?? DEFAULT_LEGAL_STATUS;
  const legalCount = items.filter((i) => i.status === "Legal").length;
  const illegalCount = items.filter((i) => i.status === "Illegal").length;
  const restrictedCount = items.filter(
    (i) =>
      i.status === "Restricted" ||
      i.status === "Medical Only" ||
      i.status === "Decriminalized" ||
      i.status === "Varies",
  ).length;

  return (
    <div className="modal-tile rounded-xl p-4 border border-border/50">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <p className="text-sm font-bold font-sans text-foreground">
            What&#39;s Legal in {state.name}?
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
            {legalCount} legal
          </span>
          <span className="px-2 py-0.5 rounded-full border text-red-400 bg-red-500/10 border-red-500/30">
            {illegalCount} illegal
          </span>
          {restrictedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full border text-yellow-400 bg-yellow-500/10 border-yellow-500/30">
              {restrictedCount} restricted
            </span>
          )}
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/40 border border-border/30"
          >
            <span className="text-lg leading-none shrink-0 mt-0.5">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold font-sans text-foreground leading-tight">
                {item.topic}
              </p>
              {item.note && (
                <p className="text-[10px] font-sans text-muted-foreground mt-0.5 leading-snug">
                  {item.note}
                </p>
              )}
            </div>
            <span
              className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${STATUS_BADGE[item.status]}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateLawsTab({ state }: { state: USState }) {
  return (
    <div className="space-y-4">
      {/* Section intro */}
      <div className="flex items-center gap-3 p-4 modal-tile rounded-xl border border-border/60">
        <div className="p-2 bg-secondary/15 rounded-lg shrink-0">
          <Scales size={16} weight="fill" className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-sans text-foreground">
            {state.name} · Legal Status Guide
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            What is legal, illegal, restricted, or varies by topic in this state
          </p>
        </div>
        <SourceLink sources={SRC_CONGRESS} />
      </div>

      {/* Legal Status Grid — full focus */}
      <LegalStatusGrid state={state} />
    </div>
  );
}

// ─── State location map using an SVG iframe from simplemaps ──────────────────
function StateMapTab({ state }: { state: USState }) {
  // Use a free embedded map from simplemaps (no key needed for basic embed)
  // We construct a Google Maps embed focused on the state
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(state.name + ", USA")}&z=6&output=embed&t=m`;

  const regionColors: Record<string, string> = {
    West: "from-blue-500/20 to-cyan-500/10",
    South: "from-green-500/20 to-emerald-500/10",
    Northeast: "from-purple-500/20 to-violet-500/10",
    Midwest: "from-amber-500/20 to-yellow-500/10",
  };

  return (
    <div className="space-y-4">
      {/* Info strip */}
      <div
        className={`rounded-xl p-4 bg-gradient-to-r ${regionColors[state.region] ?? "from-secondary/20 to-secondary/10"} border border-border/50`}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm font-sans">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-secondary" weight="fill" />
            <span className="text-muted-foreground">Capital:</span>
            <span className="font-semibold text-foreground">
              {state.capital}
            </span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Region:</span>
            <span className="font-semibold text-foreground">
              {state.region}
            </span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Area:</span>
            <span className="font-semibold text-foreground font-mono">
              {(state.areaKm2 / 1000).toFixed(0)}K km²
            </span>
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Statehood:</span>
            <span className="font-semibold text-foreground font-mono">
              {state.statehood}
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Google Map */}
      <div
        className="relative rounded-xl overflow-hidden border border-border shadow-lg"
        style={{ height: 420 }}
      >
        <iframe
          title={`${state.name} map`}
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {/* Neighboring info */}
      <div className="modal-tile rounded-xl p-4">
        <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider mb-3">
          Location Facts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
              Abbreviation
            </p>
            <p className="text-lg font-bold font-mono text-foreground">
              {state.abbreviation}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
              Population Density
            </p>
            <p className="text-lg font-bold font-mono text-foreground">
              {(state.population / state.areaKm2).toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">
                /km²
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-0.5">
              US Region
            </p>
            <span
              className={`inline-block text-xs font-sans px-2 py-0.5 rounded-full border ${
                state.region === "West"
                  ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                  : state.region === "South"
                    ? "text-green-400 border-green-500/40 bg-green-500/10"
                    : state.region === "Northeast"
                      ? "text-purple-400 border-purple-500/40 bg-purple-500/10"
                      : "text-amber-400 border-amber-500/40 bg-amber-500/10"
              }`}
            >
              {state.region}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
type ModalTab = "overview" | "map" | "laws";

function StateModal({
  state,
  onClose,
}: {
  state: USState;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [isExpanded, setIsExpanded] = useState(false);
  const { openNote } = useNotes();

  React.useEffect(() => {
    setActiveTab("overview");
  }, [state.id]);

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

  const tabs: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <ListBullets size={13} weight="bold" />,
    },
    { id: "map", label: "Map", icon: <MapTrifold size={13} weight="fill" /> },
    { id: "laws", label: "Laws", icon: <Scales size={13} weight="fill" /> },
  ];

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
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 border border-border shadow-md relative bg-muted">
                <img
                  src={`https://flagcdn.com/w160/us-${state.id}.png`}
                  alt={`${state.name} flag`}
                  className="w-full h-full object-cover"
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
                    {state.abbreviation}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold font-sans text-foreground">
                  {state.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                    <MapPin size={12} /> {state.capital}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground font-sans">
                    {state.region} Region
                  </span>
                  <span
                    className={`text-xs border px-2 py-0.5 rounded-full font-sans ${partyColor[state.party]}`}
                  >
                    {state.party}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  openNote({ entityName: state.name, entityType: "State" })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors cursor-pointer"
                aria-label="Take note about this state"
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
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-sans cursor-pointer"
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
            {tabs.map((tab) => (
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

          {/* Tab: Map */}
          {activeTab === "map" && <StateMapTab state={state} />}

          {/* Tab: Laws */}
          {activeTab === "laws" && <StateLawsTab state={state} />}

          {/* Tab: Overview */}
          {
            activeTab === "overview" && (
              <>
                {/* Key Stats — organized by category */}

                {/* ── ECONOMIC ── */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                      📊 Economic
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard
                      label="GDP"
                      value={`$${state.gdp >= 1000 ? (state.gdp / 1000).toFixed(1) + "T" : state.gdp + "B"}`}
                      sub="billions USD"
                    />
                    <StatCard
                      label="GDP Per Capita"
                      value={`$${Math.round((state.gdp * 1e9) / state.population).toLocaleString()}`}
                      sub="est. per person"
                    />
                    <StatCard
                      label="Median Income"
                      value={`$${state.medianIncome.toLocaleString()}`}
                      sub="household"
                    />
                    <StatCard
                      label="Min Wage"
                      value={
                        state.minimumWage != null
                          ? state.minimumWage <= 7.25
                            ? "$7.25"
                            : `$${state.minimumWage.toFixed(2)}`
                          : "Fed. min"
                      }
                      sub="per hour"
                    />
                    <StatCard
                      label="Unemployment"
                      value={`${state.unemploymentRate}%`}
                      sub="current rate"
                    />
                    <StatCard
                      label="Income Tax"
                      value={
                        state.stateTaxRate != null
                          ? state.stateTaxRate === 0
                            ? "None"
                            : `${state.stateTaxRate}%`
                          : "—"
                      }
                      sub="top marginal rate"
                    />
                    <StatCard
                      label="Sales Tax"
                      value={
                        state.salesTaxRate != null
                          ? state.salesTaxRate === 0
                            ? "None"
                            : `${state.salesTaxRate}%`
                          : "—"
                      }
                      sub="state + local avg"
                    />
                    <StatCard
                      label="Avg. Income"
                      value={
                        state.averageIncome != null
                          ? `$${(state.averageIncome / 1000).toFixed(1)}K`
                          : "—"
                      }
                      sub="per capita"
                    />
                  </div>
                </div>

                {/* ── GOVERNANCE & GEOGRAPHY ── */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                      🏛️ Governance &amp; Geography
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard
                      label="Population"
                      value={`${(state.population / 1e6).toFixed(1)}M`}
                      sub="residents"
                    />
                    <StatCard
                      label="Mean Elevation"
                      value={`${(STATE_ELEVATION_FT[state.id] ?? 0).toLocaleString()} ft`}
                      sub={`~${Math.round((STATE_ELEVATION_FT[state.id] ?? 0) * 0.3048)} m`}
                    />
                    <StatCard
                      label="Governor Approval"
                      value={`${state.approvalRating}%`}
                      sub="approval rating"
                    />
                    <StatCard
                      label="Political Lean"
                      value={state.party}
                      sub="dominant party"
                    />
                    <StatCard
                      label="Statehood"
                      value={`${state.statehood}`}
                      sub={`${new Date().getFullYear() - state.statehood} yrs ago`}
                    />
                    <StatCard
                      label="Area"
                      value={`${(state.areaKm2 / 1000).toFixed(0)}K km²`}
                      sub="total land"
                    />
                    <StatCard
                      label="House Seats"
                      value={`${state.houseSeats}`}
                      sub="US House reps"
                    />
                    <StatCard
                      label="Region"
                      value={state.region}
                      sub="US region"
                    />
                  </div>
                </div>

                {/* Quality of Living tile */}
                <div className="grid grid-cols-2 gap-3 mb-0 items-stretch">
                  <div className="modal-tile rounded-lg p-4 flex flex-col gap-1 col-span-2 h-full">
                    <p className="text-xs text-muted-foreground font-sans">
                      Quality of Living Score
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-2xl font-bold font-mono ${state.qualityOfLiving >= 75 ? "text-success" : state.qualityOfLiving >= 55 ? "text-warning" : "text-destructive"}`}
                      >
                        {state.qualityOfLiving}
                        <span className="text-sm font-normal text-muted-foreground">
                          /100
                        </span>
                      </span>
                      <div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${state.qualityOfLiving >= 75 ? "bg-success" : state.qualityOfLiving >= 55 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${state.qualityOfLiving}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-sans px-2 py-0.5 rounded-full border ${state.qualityOfLiving >= 75 ? "text-success bg-success/10 border-success/30" : state.qualityOfLiving >= 55 ? "text-warning bg-warning/10 border-warning/30" : "text-destructive bg-destructive/10 border-destructive/30"}`}
                      >
                        {state.qualityOfLiving >= 75
                          ? "High"
                          : state.qualityOfLiving >= 55
                            ? "Moderate"
                            : "Low"}
                      </span>
                    </div>
                  </div>
                  <TaxCard
                    incomeTax={state.stateTaxRate}
                    salesTax={state.salesTaxRate}
                    minimumWage={state.minimumWage}
                    averageIncome={state.averageIncome}
                  />
                </div>
                <SourceLink
                  sources={[...SRC_BEA, ...SRC_BLS]}
                  className="mb-4"
                />

                {/* 6 Charts */}
                <DemographicsCharts state={state} />

                {/* Sociological Breakdown */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <UsersThree
                      size={14}
                      weight="fill"
                      className="text-secondary"
                    />
                    <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                      Sociological Breakdown
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Ethnic Composition */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Ethnic Composition
                      </p>
                      <div className="space-y-1.5">
                        {state.ethnicity
                          .filter((e) => e.pct > 0)
                          .map((e, i) => (
                            <div
                              key={e.group}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    ETHNICITY_COLORS[
                                      i % ETHNICITY_COLORS.length
                                    ],
                                }}
                              />
                              <span className="text-[11px] font-sans text-muted-foreground flex-1 truncate">
                                {e.group}
                              </span>
                              <span
                                className="text-[11px] font-mono font-semibold"
                                style={{
                                  color:
                                    ETHNICITY_COLORS[
                                      i % ETHNICITY_COLORS.length
                                    ],
                                }}
                              >
                                {e.pct}%
                              </span>
                            </div>
                          ))}
                      </div>
                      {/* stacked diversity bar */}
                      <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-px">
                        {state.ethnicity
                          .filter((e) => e.pct > 0)
                          .map((e, i) => (
                            <div
                              key={e.group}
                              style={{
                                width: `${e.pct}%`,
                                backgroundColor:
                                  ETHNICITY_COLORS[i % ETHNICITY_COLORS.length],
                              }}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Age Structure */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Age Structure
                        <span className="ml-1 normal-case font-normal text-muted-foreground">
                          · median {state.medianAge} yrs
                        </span>
                      </p>
                      <div className="space-y-1.5">
                        {state.ageGroups.map((g, i) => (
                          <div
                            key={g.group}
                            className="flex items-center gap-2"
                          >
                            <span className="text-[11px] font-sans text-muted-foreground w-16 shrink-0">
                              {g.group}
                            </span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${g.pct * 3}%`,
                                  backgroundColor:
                                    AGE_COLORS[i % AGE_COLORS.length],
                                }}
                              />
                            </div>
                            <span
                              className="text-[11px] font-mono w-7 text-right shrink-0"
                              style={{
                                color: AGE_COLORS[i % AGE_COLORS.length],
                              }}
                            >
                              {g.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Political Alignment */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Political Alignment
                      </p>
                      <div className="flex gap-1 h-5 rounded-full overflow-hidden mb-2">
                        {state.voterShare.map((v, i) => (
                          <div
                            key={v.party}
                            style={{
                              width: `${v.pct}%`,
                              backgroundColor:
                                VOTER_COLORS[i % VOTER_COLORS.length],
                            }}
                          />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {state.voterShare.map((v, i) => (
                          <div
                            key={v.party}
                            className="flex items-center justify-between text-[11px]"
                          >
                            <span className="flex items-center gap-1.5 font-sans text-muted-foreground">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    VOTER_COLORS[i % VOTER_COLORS.length],
                                }}
                              />
                              {v.party}
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              {v.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border font-sans ${
                            state.party === "Democrat"
                              ? "text-secondary border-secondary/40 bg-secondary/10"
                              : state.party === "Republican"
                                ? "text-red-400 border-red-500/40 bg-red-500/10"
                                : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
                          }`}
                        >
                          {state.party} Leaning
                        </span>
                      </div>
                    </div>

                    {/* Wealth Distribution */}
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-2">
                        Wealth Distribution
                      </p>
                      <div className="space-y-1.5">
                        {state.wealthPoverty.map((w, i) => (
                          <div
                            key={w.label}
                            className="flex items-center gap-2"
                          >
                            <span className="text-[11px] font-sans text-muted-foreground w-24 shrink-0">
                              {w.label}
                            </span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${w.pct * 2}%`,
                                  backgroundColor:
                                    WEALTH_COLORS[i % WEALTH_COLORS.length],
                                }}
                              />
                            </div>
                            <span
                              className="text-[11px] font-mono w-7 text-right shrink-0"
                              style={{
                                color: WEALTH_COLORS[i % WEALTH_COLORS.length],
                              }}
                            >
                              {w.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-sans">
                          Median Household Income
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground">
                          ${state.medianIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <SourceLink sources={SRC_CENSUS} className="mt-3" />

                  {/* Social Scores Row */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="modal-tile rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Education Rank
                      </p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        #{state.educationRank}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        out of 50
                      </p>
                    </div>
                    <div className="modal-tile rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Healthcare Rank
                      </p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        #{state.healthcareRank}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        out of 50
                      </p>
                    </div>
                    <div className="modal-tile rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Crime Index
                      </p>
                      <p
                        className={`text-lg font-bold font-mono ${state.crimeIndex >= 55 ? "text-destructive" : state.crimeIndex >= 40 ? "text-warning" : "text-success"}`}
                      >
                        {state.crimeIndex}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        per 100k
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Stats */}
                {(() => {
                  const ss = getStateSocialStats(state.id);
                  const ci = state.crimeIndex;
                  const crimeData = [
                    {
                      name: "Assault",
                      value: Math.round(ci * 1.52),
                      color: "#f87171",
                    },
                    {
                      name: "Robbery",
                      value: Math.round(ci * 0.62),
                      color: "#fb923c",
                    },
                    {
                      name: "Burglary",
                      value: Math.round(ci * 2.4),
                      color: "#fbbf24",
                    },
                    {
                      name: "Theft",
                      value: Math.round(ci * 4.85),
                      color: "#a78bfa",
                    },
                    {
                      name: "Auto",
                      value: Math.round(ci * 1.1),
                      color: "#60a5fa",
                    },
                    {
                      name: "Fraud",
                      value: Math.round(ci * 0.98),
                      color: "#34d399",
                    },
                  ];
                  const crimeTotal = crimeData.reduce((s, d) => s + d.value, 0);
                  return (
                    <div className="modal-tile rounded-xl p-4 mt-4 border border-border/50">
                      <p className="text-xs font-bold font-sans text-foreground uppercase tracking-widest mb-3">
                        Social Statistics{" "}
                        <span className="text-muted-foreground normal-case font-normal">
                          (per 100k residents)
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Homelessness */}
                        {ss && (
                          <div className="rounded-lg border border-border bg-background/40 p-3">
                            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                              🏚️ Homelessness Rate
                            </p>
                            <p
                              className={`text-xl font-bold font-mono ${ss.homelessnessRate >= 25 ? "text-destructive" : ss.homelessnessRate >= 12 ? "text-warning" : "text-success"}`}
                            >
                              {ss.homelessnessRate}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                              per 100,000 residents
                            </p>
                            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min(100, (ss.homelessnessRate / 70) * 100)}%`,
                                  background:
                                    ss.homelessnessRate >= 25
                                      ? "hsl(0,70%,55%)"
                                      : ss.homelessnessRate >= 12
                                        ? "hsl(38,92%,50%)"
                                        : "hsl(142,71%,45%)",
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Incarceration */}
                        {ss && (
                          <div className="rounded-lg border border-border bg-background/40 p-3">
                            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-1">
                              ⛓️ Incarceration Rate
                            </p>
                            <p
                              className={`text-xl font-bold font-mono ${ss.incarcerationRate >= 600 ? "text-destructive" : ss.incarcerationRate >= 350 ? "text-warning" : "text-success"}`}
                            >
                              {ss.incarcerationRate}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                              per 100,000 residents
                            </p>
                            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min(100, (ss.incarcerationRate / 800) * 100)}%`,
                                  background:
                                    ss.incarcerationRate >= 600
                                      ? "hsl(0,70%,55%)"
                                      : ss.incarcerationRate >= 350
                                        ? "hsl(38,92%,50%)"
                                        : "hsl(142,71%,45%)",
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Crime Rate — full width */}
                        <div className="col-span-2 rounded-lg border border-border bg-background/40 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">
                              🚨 Crime Rate
                            </p>
                            <span
                              className={`text-sm font-bold font-mono ${state.crimeIndex >= 55 ? "text-destructive" : state.crimeIndex >= 40 ? "text-warning" : "text-success"}`}
                            >
                              {state.crimeIndex}
                              <span className="text-[10px] font-normal text-muted-foreground">
                                /100
                              </span>
                            </span>
                            <span
                              className={`text-[10px] font-sans px-1.5 py-0.5 rounded-full border shrink-0 ${state.crimeIndex >= 55 ? "text-destructive bg-destructive/10 border-destructive/30" : state.crimeIndex >= 40 ? "text-warning bg-warning/10 border-warning/30" : "text-success bg-success/10 border-success/30"}`}
                            >
                              {state.crimeIndex >= 55
                                ? "High"
                                : state.crimeIndex >= 40
                                  ? "Moderate"
                                  : "Low"}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div
                              style={{ width: 80, height: 80, flexShrink: 0 }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <defs>
                                    {crimeData.map((d, i) => (
                                      <linearGradient
                                        key={i}
                                        id={`crimeGrad-${state.id}-${i}`}
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor={d.color}
                                          stopOpacity={0.9}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor={d.color}
                                          stopOpacity={0.6}
                                        />
                                      </linearGradient>
                                    ))}
                                  </defs>
                                  <Pie
                                    data={crimeData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={20}
                                    outerRadius={36}
                                    paddingAngle={1}
                                    isAnimationActive
                                    animationDuration={600}
                                  >
                                    {crimeData.map((_d, i) => (
                                      <Cell
                                        key={i}
                                        fill={`url(#crimeGrad-${state.id}-${i})`}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }: any) => {
                                      if (!active || !payload?.length)
                                        return null;
                                      const p = payload[0];
                                      return (
                                        <div className="bg-card border border-border rounded-md p-1.5 text-[10px] font-mono shadow-lg">
                                          <p style={{ color: p.payload.color }}>
                                            {p.name}: {p.value}{" "}
                                            <span className="text-muted-foreground">
                                              /100k
                                            </span>
                                          </p>
                                        </div>
                                      );
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                {crimeData.map((d) => (
                                  <div
                                    key={d.name}
                                    className="flex items-center gap-1.5"
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: d.color }}
                                    />
                                    <span className="text-[10px] font-sans text-muted-foreground truncate">
                                      {d.name}
                                    </span>
                                    <span
                                      className="text-[10px] font-mono font-semibold ml-auto shrink-0"
                                      style={{ color: d.color }}
                                    >
                                      {d.value}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                                      (
                                      {Math.round((d.value / crimeTotal) * 100)}
                                      %)
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-1 pt-1 flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground font-sans uppercase tracking-wider">
                                  Safety Index
                                </span>
                                <span
                                  className={`text-[11px] font-bold font-mono ${100 - state.crimeIndex >= 60 ? "text-success" : 100 - state.crimeIndex >= 45 ? "text-warning" : "text-destructive"}`}
                                >
                                  {100 - state.crimeIndex}
                                  <span className="text-[9px] font-normal text-muted-foreground">
                                    /100
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <SourceLink
                            sources={[
                              {
                                label: "Numbeo Crime Index",
                                url: "https://www.numbeo.com/crime/rankings_by_country.jsp",
                              },
                              {
                                label: "FBI Crime Data Explorer",
                                url: "https://cde.ucr.cjis.gov/",
                              },
                            ]}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-sans mt-3">
                        Sources: HUD Annual Homeless Assessment Report · Bureau
                        of Justice Statistics (BJS)
                      </p>
                    </div>
                  );
                })()}

                {/* Transportation Panel */}
                <TransportationPanel state={state} />

                {/* Housing Panel */}
                <HousingPanel state={state} />

                {/* Education Panel */}
                <StateEducationPanel state={state} />

                {/* Governor / Statehood */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">
                      Governor
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {state.governor}
                    </p>
                    <p
                      className={`text-xs mt-1 font-sans ${state.party === "Democrat" ? "text-secondary" : "text-red-400"}`}
                    >
                      {state.party}
                    </p>
                  </div>
                  <div className="modal-tile rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-sans mb-1">
                      Statehood
                    </p>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      Since {state.statehood}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {new Date().getFullYear() - state.statehood} years as a
                      state
                    </p>
                  </div>
                </div>

                {/* Senators */}
                {state.senators && state.senators.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle
                        size={14}
                        weight="fill"
                        className="text-secondary"
                      />
                      <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                        US Senators
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.senators.map((sen, i) => (
                        <div
                          key={i}
                          className="modal-tile rounded-lg p-3 flex items-start justify-between gap-2"
                        >
                          <div>
                            <p className="text-sm font-semibold font-sans text-foreground">
                              {sen.name}
                            </p>
                            <p
                              className={`text-xs font-sans mt-0.5 ${sen.party === "Democrat" ? "text-secondary" : sen.party === "Republican" ? "text-red-400" : "text-yellow-400"}`}
                            >
                              {sen.party}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-card border border-border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                            Term ends {sen.termEnd}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* House Representatives */}
                {state.representatives && state.representatives.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel size={14} weight="fill" className="text-warning" />
                      <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
                        House Representatives
                        <span className="ml-2 text-muted-foreground normal-case font-normal">
                          ({state.houseSeats} seat
                          {state.houseSeats !== 1 ? "s" : ""})
                        </span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {state.representatives.map((rep, i) => (
                        <div
                          key={i}
                          className="modal-tile rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold font-sans text-foreground truncate">
                              {rep.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans">
                              {rep.district}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded border ${rep.party === "Democrat" ? "border-secondary/40 text-secondary bg-secondary/10" : rep.party === "Republican" ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"}`}
                          >
                            {rep.party === "Democrat"
                              ? "D"
                              : rep.party === "Republican"
                                ? "R"
                                : "I"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) /* end overview tab */
          }
        </div>
      </div>
    </div>
  );
}

// ─── Election Countdown ──────────────────────────────────────────────────────
function useElectionCountdown() {
  const target = new Date("2028-11-07T00:00:00");
  const [diff, setDiff] = useState(target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSecs = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return { days, hours, mins, secs };
}

// ─── National Stats Banner ────────────────────────────────────────────────────
function USNationalBanner() {
  const { days, hours, mins, secs } = useElectionCountdown();

  const totalGDP = usStatesData.reduce((sum, s) => sum + s.gdp, 0);
  const totalPop = usStatesData.reduce((sum, s) => sum + s.population, 0);
  const avgUnemployment = (
    usStatesData.reduce((sum, s) => sum + s.unemploymentRate, 0) /
    usStatesData.length
  ).toFixed(1);
  const avgMedianIncome = Math.round(
    usStatesData.reduce((sum, s) => sum + s.medianIncome, 0) /
      usStatesData.length,
  );
  const demStates = usStatesData.filter((s) => s.party === "Democrat").length;
  const repStates = usStatesData.filter((s) => s.party === "Republican").length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8 shadow-lg">
      {/* Header */}
      <div className="relative overflow-hidden px-6 py-6 flex flex-wrap items-center justify-between gap-5 border-b border-border">
        {/* Background gradient — vivid in dark, softer in light */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-blue-700/20 dark:from-blue-900/70 dark:via-cyan-800/50 dark:to-blue-900/70 pointer-events-none" />
        {/* Subtle star/shine overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />

        {/* Left: title + inline countdown */}
        <div className="relative flex items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold font-sans text-foreground tracking-tight leading-tight">
              United States of America
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground font-sans">
                Federal Republic
              </span>
              <span className="w-1 h-1 rounded-full bg-border inline-block" />
              <span className="text-xs font-medium text-muted-foreground font-sans">
                50 States
              </span>
              <span className="w-1 h-1 rounded-full bg-border inline-block" />
              <span className="text-xs font-medium text-muted-foreground font-sans">
                Washington, D.C.
              </span>
            </div>
          </div>

          {/* Inline Election countdown */}
          <div className="flex items-center gap-3 bg-background/60 dark:bg-black/40 backdrop-blur-sm border border-border dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-400/15 dark:bg-yellow-400/20 border border-yellow-400/30 shrink-0">
              <Timer
                size={14}
                className="text-yellow-500 dark:text-yellow-400"
                weight="fill"
              />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground font-sans uppercase tracking-widest mb-1">
                Next Presidential Election · Nov 2028
              </p>
              <div className="flex items-end gap-1 font-mono">
                {[
                  { val: String(days).padStart(3, "0"), label: "days" },
                  { val: String(hours).padStart(2, "0"), label: "hrs" },
                  { val: String(mins).padStart(2, "0"), label: "min" },
                  { val: String(secs).padStart(2, "0"), label: "sec" },
                ].map(({ val, label }, i) => (
                  <span key={label} className="inline-flex items-end gap-1">
                    {i > 0 && (
                      <span className="text-muted-foreground/60 text-base mb-0.5 leading-none">
                        :
                      </span>
                    )}
                    <span className="flex flex-col items-center">
                      <span className="text-base font-bold text-yellow-500 dark:text-yellow-400 leading-none tabular-nums">
                        {val}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {label}
                      </span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key national stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-border border-b border-border">
        {[
          {
            label: "Total GDP",
            value: `$${(totalGDP / 1000).toFixed(1)}T`,
            sub: "2026 estimate",
            icon: <CurrencyDollar size={14} weight="fill" />,
            color: "text-green-400",
          },
          {
            label: "Population",
            value: `${(totalPop / 1e6).toFixed(0)}M`,
            sub: "2026 estimate",
            icon: <Users size={14} weight="fill" />,
            color: "text-blue-400",
          },
          {
            label: "Unemployment",
            value: `${avgUnemployment}%`,
            sub: "Mar 2026 avg",
            icon: <ChartBar size={14} weight="fill" />,
            color: "text-orange-400",
          },
          {
            label: "Median Income",
            value: `$${(avgMedianIncome / 1000).toFixed(0)}K`,
            sub: "2026 avg",
            icon: <Factory size={14} weight="fill" />,
            color: "text-purple-400",
          },
          {
            label: "Democrat States",
            value: `${demStates}`,
            sub: "blue states (2026)",
            icon: <Flag size={14} weight="fill" />,
            color: "text-secondary",
          },
          {
            label: "Republican States",
            value: `${repStates}`,
            sub: "red states (2026)",
            icon: <Flag size={14} weight="fill" />,
            color: "text-red-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 px-3 py-2.5">
            <div className={`flex items-center gap-1 ${stat.color}`}>
              {stat.icon}
              <span className="text-[9px] font-sans text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className="text-base font-bold font-mono text-foreground leading-tight">
              {stat.value}
            </p>
            <p className="text-[9px] text-muted-foreground font-sans">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom: snapshot */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wider">
            National Snapshot
          </p>
          <SourceLink sources={SRC_BEA} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Largest State (area)",
              value: "Alaska — 1.7M km²",
              color: "bg-blue-500/20 text-blue-300",
            },
            {
              label: "Most Populous",
              value: "California — 39.5M",
              color: "bg-green-500/20 text-green-300",
            },
            {
              label: "Highest GDP",
              value: "California — $4.1T",
              color: "bg-yellow-500/20 text-yellow-300",
            },
            {
              label: "Lowest Unemployment",
              value: "North Dakota — 2.2%",
              color: "bg-purple-500/20 text-purple-300",
            },
            {
              label: "Highest Median Income",
              value: "New Jersey — $100K",
              color: "bg-pink-500/20 text-pink-300",
            },
            {
              label: "Oldest State",
              value: "Delaware — 1787",
              color: "bg-orange-500/20 text-orange-300",
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground font-sans">
                {item.label}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full self-start ${item.color}`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function exportStatesToCSV(states: USState[]) {
  const headers = [
    "Name",
    "Abbreviation",
    "Region",
    "Party",
    "Governor",
    "Capital",
    "Population",
    "GDP (B USD)",
    "Median Income",
    "Unemployment %",
    "Quality of Living",
    "Crime Index",
    "Education Rank",
    "Healthcare Rank",
    "Statehood",
  ];
  const rows = states.map((s) => [
    s.name,
    s.abbreviation,
    s.region,
    s.party,
    s.governor,
    s.capital,
    s.population,
    s.gdp,
    s.medianIncome,
    s.unemploymentRate,
    s.qualityOfLiving,
    s.crimeIndex,
    s.educationRank,
    s.healthcareRank,
    s.statehood,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "us_states_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function StatesPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [partyFilter, setPartyFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "population" | "gdp" | "medianIncome" | "approvalRating"
  >("gdp");
  const [modalState, setModalState] = useState<USState | null>(null);

  const {
    states: liveStates,
    isRefreshing,
    lastUpdated,
    patchedCount,
    source,
  } = useLiveData();

  // Deep-link: open entity from search bar via ?open=<id>
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId) {
      const found = liveStates.find((s) => s.id === openId);
      if (found) setModalState(found);
      // Clean URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      window.history.replaceState({}, "", url.toString());
    }
  }, [liveStates]);

  const regions = ["All", "West", "South", "Northeast", "Midwest"];
  const parties = ["All", "Democrat", "Republican", "Independent"];

  const filtered = liveStates
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.abbreviation.toLowerCase().includes(search.toLowerCase());
      const matchRegion = regionFilter === "All" || s.region === regionFilter;
      const matchParty = partyFilter === "All" || s.party === partyFilter;
      return matchSearch && matchRegion && matchParty;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* US National Banner */}
        <USNationalBanner />

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <Buildings size={26} weight="fill" className="text-secondary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-sans text-foreground">
              US States
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              Demographics, economics, and governance data for all 50 states
            </p>
          </div>
          {/* CSV Export */}
          <button
            onClick={() => exportStatesToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-sans cursor-pointer"
            title="Export visible states to CSV"
          >
            <DownloadSimple size={13} weight="bold" />
            Export CSV
          </button>
          {/* Live data status badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all ${isRefreshing ? "bg-warning/10 border-warning/30 text-warning" : lastUpdated ? "bg-success/10 border-success/30 text-success" : "bg-muted/50 border-border text-muted-foreground"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRefreshing ? "bg-warning animate-pulse" : lastUpdated ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
            />
            {isRefreshing
              ? "Fetching live data…"
              : lastUpdated
                ? `Live · ${patchedCount} updated · ${source}`
                : "Static data"}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "States Tracked",
              value: "50",
              icon: <Buildings size={18} weight="fill" />,
              color: "text-secondary",
            },
            {
              label: "Total Population",
              value: "335M+",
              icon: <Users size={18} weight="fill" />,
              color: "text-success",
            },
            {
              label: "Largest Economy",
              value: "CA · $4.1T",
              icon: <CurrencyDollar size={18} weight="fill" />,
              color: "text-warning",
            },
            {
              label: "Avg Unemployment",
              value: "3.8%",
              icon: <TrendDown size={18} weight="fill" />,
              color: "text-secondary",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-3"
            >
              <span className={s.color}>{s.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground font-sans">
                  {s.label}
                </p>
                <p className="text-base font-bold font-mono text-foreground">
                  {s.value}
                </p>
              </div>
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
              placeholder="Search states…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Pills + Sort */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  regionFilter === r
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {r}
              </button>
            ))}
            <div className="w-px h-5 bg-border shrink-0" />
            {parties.map((p) => {
              const isActive = partyFilter === p;
              const activeStyle =
                p === "Democrat"
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : p === "Republican"
                    ? "bg-red-500/15 text-red-400 border-red-500/40"
                    : p === "Independent"
                      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                      : "bg-secondary/20 text-secondary border-secondary/40";
              return (
                <button
                  key={p}
                  onClick={() => setPartyFilter(p)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? activeStyle
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <div className="w-px h-5 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdp">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="medianIncome">Sort: Median Income</option>
              <option value="approvalRating">Sort: Approval</option>
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
              {getUpcoming("states").map((e) => (
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

        {modalState && (
          <StateModal state={modalState} onClose={() => setModalState(null)} />
        )}

        {/* State Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {filtered.map((state) => (
            <article
              key={state.id}
              onClick={() => setModalState(state)}
              className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40"
            >
              {/* Card header with flag background */}
              <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                {/* Flag background */}
                <img
                  src={`https://flagcdn.com/w320/us-${state.id}.png`}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 select-none pointer-events-none"
                />
                {/* Gradient overlay so text stays readable */}
                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <img
                      src={`https://flagcdn.com/w80/us-${state.id}.png`}
                      alt={`${state.name} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.onerror = null;
                        t.style.display = "none";
                        const fb = t.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-1 items-center justify-center hidden">
                      <span className="text-sm font-bold font-mono text-primary-foreground">
                        {state.abbreviation}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold font-sans text-foreground text-sm">
                      {state.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {state.capital} · {state.region}
                    </p>
                  </div>
                </div>
                <span
                  className={`relative text-xs border px-2 py-0.5 rounded-full font-sans ${partyColor[state.party]}`}
                >
                  {state.party === "Democrat"
                    ? "D"
                    : state.party === "Republican"
                      ? "R"
                      : "I"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-sans">GDP</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    ${state.gdp}B
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Population
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {(state.population / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Income Tax
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {state.stateTaxRate != null
                      ? state.stateTaxRate === 0
                        ? "None"
                        : `${state.stateTaxRate}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Sales Tax
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {state.salesTaxRate != null
                      ? state.salesTaxRate === 0
                        ? "None"
                        : `${state.salesTaxRate}%`
                      : "—"}
                  </p>
                </div>
              </div>
              {/* QoL bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-sans">
                    Quality of Living
                  </span>
                  <span
                    className={`font-mono font-semibold ${state.qualityOfLiving >= 75 ? "text-success" : state.qualityOfLiving >= 55 ? "text-warning" : "text-destructive"}`}
                  >
                    {state.qualityOfLiving}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${state.qualityOfLiving >= 75 ? "bg-success" : state.qualityOfLiving >= 55 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${state.qualityOfLiving}%` }}
                  />
                </div>
              </div>

              {/* Voter share mini bars */}
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden mb-2">
                {state.voterShare.map((v, i) => (
                  <div
                    key={v.party}
                    style={{ width: `${v.pct}%`, background: VOTER_COLORS[i] }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-sans">
                {state.voterShare.map((v) => (
                  <span key={v.party}>
                    {v.party.slice(0, 3)} {v.pct}%
                  </span>
                ))}
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 modal-tile rounded-xl p-12 text-center">
              <p className="text-muted-foreground font-sans text-sm">
                No states match your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
