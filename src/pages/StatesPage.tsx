import React, { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  MapPin,
  Timer,
  UserCircle,
  Gavel,
  UsersThree,
  MapTrifold,
  ListBullets,
  Scales,
} from "@phosphor-icons/react";
// Bookmark feature removed
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
import { type USState } from "../data/statesData";
import { getStateSocialStats } from "../data/socialStatsData";
import { getUpcoming } from "../data/upcomingToWatch";
import { useLiveData } from "../hooks/useLiveData";
import { SourceLink } from "../components/SourceLink";
import { CollapsibleFilters } from "../components/CollapsibleFilters";

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

// Fallback images by region if state not in map

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
                onClick={() => setIsExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label={
                  isExpanded ? "Collapse modal" : "Expand modal to full screen"
                }
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                <span className="text-xs font-sans font-medium">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-sans cursor-pointer"
                aria-label="Close"
              >
                <span className="text-xs font-sans font-medium">Close</span>
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

                {/* Quality of Living tile.
                    The wrapper tracks TaxCard's own col-span-2 sm:col-span-4.
                    It used to be a fixed grid-cols-2, so TaxCard's span of 4
                    created two implicit 0px columns; spanning those picked up
                    two extra gaps and left TaxCard 24px wider than this tile
                    and than every other section in the modal. */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-0 items-stretch">
                  <div className="modal-tile rounded-lg p-4 flex flex-col gap-1 col-span-2 sm:col-span-4 h-full">
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

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "States Tracked",
              value: "50",
            },
            {
              label: "Total Population",
              value: "335M+",
            },
            {
              label: "Largest Economy",
              value: "CA · $4.1T",
            },
            {
              label: "Avg Unemployment",
              value: "3.8%",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className="text-base font-bold font-mono text-foreground">
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
              placeholder="Search states…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Pills + Sort */}
          <CollapsibleFilters>
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
              aria-label="Sort results"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdp">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="medianIncome">Sort: Median Income</option>
              <option value="approvalRating">Sort: Approval</option>
            </select>
          </CollapsibleFilters>
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
