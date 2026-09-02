import React, { useState, useCallback } from "react";
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  MagnifyingGlass,
  ArrowsLeftRight,
  Tree,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { economiesData, type Economy } from "../data/economiesData";
import { getUpcoming } from "../data/upcomingToWatch";
import { type EconomyRents } from "../data/resourceRents";
import { useResourceRents } from "../hooks/useResourceRents";
import { SourceLink } from "../components/SourceLink";
import { countriesData } from "../data/countriesData";
import { CollapsibleFilters } from "../components/CollapsibleFilters";
import { StyledSelect } from "../components/StyledSelect";

// ── Rare Earth Minerals data per economy ────────────────────────────────────
type RareEarthMineral = {
  name: string;
  symbol: string;
  has: boolean; // does this economy have known reserves?
  surplus: boolean; // is it a net exporter / surplus producer?
  reserveKt: number | null; // known reserves in kt (null = trace/unknown)
  globalShare: string;
  use: string; // primary strategic use
  color: string;
};

const RARE_EARTH_MINERALS: Record<string, RareEarthMineral[]> = {
  "usa-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 1400,
      globalShare: "~1.8%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: true,
      surplus: false,
      reserveKt: 180,
      globalShare: "~1.2%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
    {
      name: "Lanthanum",
      symbol: "La",
      has: true,
      surplus: false,
      reserveKt: 900,
      globalShare: "~1.5%",
      use: "Catalysts, optics",
      color: "#a78bfa",
    },
    {
      name: "Cerium",
      symbol: "Ce",
      has: true,
      surplus: false,
      reserveKt: 2100,
      globalShare: "~2.1%",
      use: "Polishing, glass",
      color: "#c4b5fd",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 9800,
      globalShare: "~8%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: false,
      reserveKt: 68,
      globalShare: "~1%",
      use: "Battery cathodes",
      color: "#4f46e5",
    },
    {
      name: "Europium",
      symbol: "Eu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Phosphors, displays",
      color: "#818cf8",
    },
    {
      name: "Terbium",
      symbol: "Tb",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Solid-state devices",
      color: "#a5b4fc",
    },
  ],
  "china-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: true,
      reserveKt: 44000,
      globalShare: "~60%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: true,
      surplus: true,
      reserveKt: 4200,
      globalShare: "~58%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
    {
      name: "Lanthanum",
      symbol: "La",
      has: true,
      surplus: true,
      reserveKt: 36000,
      globalShare: "~55%",
      use: "Catalysts, optics",
      color: "#a78bfa",
    },
    {
      name: "Cerium",
      symbol: "Ce",
      has: true,
      surplus: true,
      reserveKt: 55000,
      globalShare: "~58%",
      use: "Polishing, glass",
      color: "#c4b5fd",
    },
    {
      name: "Europium",
      symbol: "Eu",
      has: true,
      surplus: true,
      reserveKt: 320,
      globalShare: "~65%",
      use: "Phosphors, displays",
      color: "#818cf8",
    },
    {
      name: "Terbium",
      symbol: "Tb",
      has: true,
      surplus: true,
      reserveKt: 140,
      globalShare: "~60%",
      use: "Solid-state devices",
      color: "#a5b4fc",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: true,
      surplus: true,
      reserveKt: 8200,
      globalShare: "~52%",
      use: "LEDs, superconductors",
      color: "#67e8f9",
    },
    {
      name: "Praseodymium",
      symbol: "Pr",
      has: true,
      surplus: true,
      reserveKt: 12000,
      globalShare: "~57%",
      use: "Aircraft engines",
      color: "#38bdf8",
    },
  ],
  "eu-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 1100,
      globalShare: "~1.4%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 5800,
      globalShare: "~4.8%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: false,
      reserveKt: 140,
      globalShare: "~2%",
      use: "Battery cathodes",
      color: "#4f46e5",
    },
    {
      name: "Lanthanum",
      symbol: "La",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Catalysts, optics",
      color: "#a78bfa",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.3%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
    {
      name: "Cerium",
      symbol: "Ce",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Polishing, glass",
      color: "#c4b5fd",
    },
    {
      name: "Scandium",
      symbol: "Sc",
      has: true,
      surplus: false,
      reserveKt: 18,
      globalShare: "~3%",
      use: "Aerospace alloys",
      color: "#34d399",
    },
    {
      name: "Gallium",
      symbol: "Ga",
      has: true,
      surplus: false,
      reserveKt: 31,
      globalShare: "~4%",
      use: "Semiconductors",
      color: "#6ee7b7",
    },
  ],
  "germany-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.1%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.1%",
      use: "Battery cathodes",
      color: "#4f46e5",
    },
    {
      name: "Indium",
      symbol: "In",
      has: true,
      surplus: false,
      reserveKt: 8,
      globalShare: "~3%",
      use: "Thin-film solar, displays",
      color: "#f59e0b",
    },
    {
      name: "Germanium",
      symbol: "Ge",
      has: true,
      surplus: false,
      reserveKt: 12,
      globalShare: "~5%",
      use: "Fiber optics, IR optics",
      color: "#84cc16",
    },
    {
      name: "Gallium",
      symbol: "Ga",
      has: true,
      surplus: false,
      reserveKt: 19,
      globalShare: "~3.5%",
      use: "Semiconductors",
      color: "#6ee7b7",
    },
    {
      name: "Scandium",
      symbol: "Sc",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Aerospace alloys",
      color: "#34d399",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.2%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
  ],
  "india-eco": [
    {
      name: "Lanthanum",
      symbol: "La",
      has: true,
      surplus: false,
      reserveKt: 6900,
      globalShare: "~6%",
      use: "Catalysts, optics",
      color: "#a78bfa",
    },
    {
      name: "Cerium",
      symbol: "Ce",
      has: true,
      surplus: false,
      reserveKt: 8200,
      globalShare: "~8%",
      use: "Polishing, glass",
      color: "#c4b5fd",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 3400,
      globalShare: "~4.5%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Thorium",
      symbol: "Th",
      has: true,
      surplus: true,
      reserveKt: 290000,
      globalShare: "~25%",
      use: "Next-gen nuclear",
      color: "#f97316",
    },
    {
      name: "Monazite",
      symbol: "—",
      has: true,
      surplus: true,
      reserveKt: 11000,
      globalShare: "~10%",
      use: "REE source mineral",
      color: "#fbbf24",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: true,
      surplus: false,
      reserveKt: 410,
      globalShare: "~2.5%",
      use: "LEDs, superconductors",
      color: "#67e8f9",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: true,
      surplus: false,
      reserveKt: 290,
      globalShare: "~3%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 5900,
      globalShare: "~5%",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "japan-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.1%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.1%",
      use: "Battery cathodes",
      color: "#4f46e5",
    },
    {
      name: "Indium",
      symbol: "In",
      has: true,
      surplus: false,
      reserveKt: 220,
      globalShare: "~5.2%",
      use: "Thin-film solar, displays",
      color: "#f59e0b",
    },
    {
      name: "Iodine",
      symbol: "I",
      has: true,
      surplus: true,
      reserveKt: 9500,
      globalShare: "~27%",
      use: "Medical, chemicals",
      color: "#a21caf",
    },
    {
      name: "Scandium",
      symbol: "Sc",
      has: true,
      surplus: false,
      reserveKt: 24,
      globalShare: "~4%",
      use: "Aerospace alloys",
      color: "#34d399",
    },
    {
      name: "Seabed REE",
      symbol: "—",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Emerging",
      use: "Future ocean mining",
      color: "#06b6d4",
    },
    {
      name: "Gallium",
      symbol: "Ga",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Semiconductors",
      color: "#6ee7b7",
    },
  ],
  "brazil-eco": [
    {
      name: "Niobium",
      symbol: "Nb",
      has: true,
      surplus: true,
      reserveKt: 10900000,
      globalShare: "~92%",
      use: "Steel alloys, superconductors",
      color: "#f97316",
    },
    {
      name: "Tantalum",
      symbol: "Ta",
      has: true,
      surplus: true,
      reserveKt: 52000,
      globalShare: "~35%",
      use: "Capacitors, electronics",
      color: "#fb923c",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: true,
      reserveKt: 220000,
      globalShare: "~19%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 3200,
      globalShare: "~4.2%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lanthanum",
      symbol: "La",
      has: true,
      surplus: false,
      reserveKt: 4800,
      globalShare: "~4%",
      use: "Catalysts, optics",
      color: "#a78bfa",
    },
    {
      name: "Cerium",
      symbol: "Ce",
      has: true,
      surplus: false,
      reserveKt: 5400,
      globalShare: "~5.4%",
      use: "Polishing, glass",
      color: "#c4b5fd",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: false,
      reserveKt: 91,
      globalShare: "~1.3%",
      use: "Battery cathodes",
      color: "#4f46e5",
    },
    {
      name: "Scandium",
      symbol: "Sc",
      has: true,
      surplus: false,
      reserveKt: 4,
      globalShare: "~1.5%",
      use: "Aerospace alloys",
      color: "#34d399",
    },
  ],
  "saudi-arabia": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 420,
      globalShare: "~0.6%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: true,
      reserveKt: 3800000,
      globalShare: "~5%",
      use: "Fertilizers",
      color: "#84cc16",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: false,
      reserveKt: 32,
      globalShare: "~0.5%",
      use: "Battery cathodes",
      color: "#4f46e5",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 890,
      globalShare: "~0.7%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Lanthanum",
      symbol: "La",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.3%",
      use: "Catalysts, optics",
      color: "#a78bfa",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.3%",
      use: "High-temp magnets",
      color: "#8b5cf6",
    },
    {
      name: "Tantalum",
      symbol: "Ta",
      has: true,
      surplus: false,
      reserveKt: 280,
      globalShare: "~0.8%",
      use: "Capacitors, electronics",
      color: "#fb923c",
    },
    {
      name: "Scandium",
      symbol: "Sc",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "<0.5%",
      use: "Aerospace alloys",
      color: "#34d399",
    },
  ],
  "australia-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: true,
      reserveKt: 7000,
      globalShare: "~24%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: true,
      reserveKt: 5700,
      globalShare: "~5%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 1500,
      globalShare: "~15%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: true,
      surplus: true,
      reserveKt: 220,
      globalShare: "~3%",
      use: "High-temp magnets",
      color: "#f59e0b",
    },
    {
      name: "Zirconium",
      symbol: "Zr",
      has: true,
      surplus: true,
      reserveKt: 50000,
      globalShare: "~65%",
      use: "Ceramics, nuclear cladding",
      color: "#10b981",
    },
    {
      name: "Scandium",
      symbol: "Sc",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Deposits held",
      use: "Aerospace alloys",
      color: "#14b8a6",
    },
  ],
  "chile-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: true,
      reserveKt: 9300,
      globalShare: "~33%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 190000,
      globalShare: "~19%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Molybdenum",
      symbol: "Mo",
      has: true,
      surplus: true,
      reserveKt: 1400,
      globalShare: "~9%",
      use: "Steel alloys",
      color: "#0ea5e9",
    },
    {
      name: "Rhenium",
      symbol: "Re",
      has: true,
      surplus: true,
      reserveKt: 1.3,
      globalShare: "~52%",
      use: "Jet engine superalloys",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "indonesia-eco": [
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: true,
      reserveKt: 55000,
      globalShare: "~42%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 600,
      globalShare: "~5%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: true,
      surplus: true,
      reserveKt: 800,
      globalShare: "~17%",
      use: "Solder, electronics",
      color: "#f59e0b",
    },
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: 1000000,
      globalShare: "~3%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "russia-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 10000,
      globalShare: "~9%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Palladium",
      symbol: "Pd",
      has: true,
      surplus: true,
      reserveKt: 3.1,
      globalShare: "~40%",
      use: "Catalytic converters",
      color: "#f59e0b",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: true,
      reserveKt: 8300,
      globalShare: "~6%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 250,
      globalShare: "~2%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: 4000,
      globalShare: "~9%",
      use: "Aerospace alloys",
      color: "#14b8a6",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 1000,
      globalShare: "~3%",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "vietnam-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 3500,
      globalShare: "~3%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lanthanum",
      symbol: "La",
      has: true,
      surplus: false,
      reserveKt: 900,
      globalShare: "~3%",
      use: "Catalysts, optics",
      color: "#f59e0b",
    },
    {
      name: "Tungsten",
      symbol: "W",
      has: true,
      surplus: true,
      reserveKt: 100,
      globalShare: "~3%",
      use: "Cutting tools, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: false,
      reserveKt: 5800000,
      globalShare: "~19%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "canada-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 830,
      globalShare: "~1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: true,
      reserveKt: 2200,
      globalShare: "~2%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 220,
      globalShare: "~2%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 3000,
      globalShare: "~10%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Uranium",
      symbol: "U",
      has: true,
      surplus: true,
      reserveKt: 590,
      globalShare: "~10%",
      use: "Nuclear fuel",
      color: "#14b8a6",
    },
    {
      name: "Potash",
      symbol: "K",
      has: true,
      surplus: true,
      reserveKt: 1100000,
      globalShare: "~31%",
      use: "Fertilizer",
      color: "#f97316",
    },
  ],
  "southafrica-eco": [
    {
      name: "Platinum",
      symbol: "Pt",
      has: true,
      surplus: true,
      reserveKt: 63,
      globalShare: "~90%",
      use: "Catalysts, hydrogen",
      color: "#0ea5e9",
    },
    {
      name: "Manganese",
      symbol: "Mn",
      has: true,
      surplus: true,
      reserveKt: 640000,
      globalShare: "~37%",
      use: "Steel, batteries",
      color: "#f59e0b",
    },
    {
      name: "Chromium",
      symbol: "Cr",
      has: true,
      surplus: true,
      reserveKt: 200000,
      globalShare: "~36%",
      use: "Stainless steel",
      color: "#10b981",
    },
    {
      name: "Vanadium",
      symbol: "V",
      has: true,
      surplus: true,
      reserveKt: 3500,
      globalShare: "~23%",
      use: "Alloys, grid batteries",
      color: "#14b8a6",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 790,
      globalShare: "~1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "kazakhstan-eco": [
    {
      name: "Uranium",
      symbol: "U",
      has: true,
      surplus: true,
      reserveKt: 815,
      globalShare: "~13%",
      use: "Nuclear fuel",
      color: "#14b8a6",
    },
    {
      name: "Chromium",
      symbol: "Cr",
      has: true,
      surplus: true,
      reserveKt: 230000,
      globalShare: "~41%",
      use: "Stainless steel",
      color: "#10b981",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: 900,
      globalShare: "~2%",
      use: "Aerospace alloys",
      color: "#0ea5e9",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 20000,
      globalShare: "~2%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "malaysia-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 30,
      globalShare: "<1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Ionic clay deposits",
      use: "LEDs, superconductors",
      color: "#f59e0b",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: true,
      surplus: true,
      reserveKt: 250,
      globalShare: "~5%",
      use: "Solder, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: false,
      reserveKt: 110000,
      globalShare: "<1%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "myanmar-eco": [
    {
      name: "Dysprosium",
      symbol: "Dy",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Major heavy-REE supplier",
      use: "High-temp magnets",
      color: "#f59e0b",
    },
    {
      name: "Terbium",
      symbol: "Tb",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Major heavy-REE supplier",
      use: "Magnets, phosphors",
      color: "#10b981",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: true,
      surplus: true,
      reserveKt: 110,
      globalShare: "~2%",
      use: "Solder, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Unquantified",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "turkey-eco": [
    {
      name: "Boron",
      symbol: "B",
      has: true,
      surplus: true,
      reserveKt: 950000,
      globalShare: "~73%",
      use: "Glass, ceramics, agriculture",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Beylikova, unproven",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Chromium",
      symbol: "Cr",
      has: true,
      surplus: true,
      reserveKt: 26000,
      globalShare: "~5%",
      use: "Stainless steel",
      color: "#0ea5e9",
    },
    {
      name: "Marble",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "~33% of trade",
      use: "Construction stone",
      color: "#f97316",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "morocco-eco": [
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: true,
      reserveKt: 50000000,
      globalShare: "~70%",
      use: "Fertilizer, LFP batteries",
      color: "#10b981",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 13,
      globalShare: "<1%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: true,
      reserveKt: 7,
      globalShare: "~1%",
      use: "Electronics, solar",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Negligible",
      use: "LEDs, superconductors",
      color: "#14b8a6",
    },
  ],
  "argentina-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: true,
      reserveKt: 4000,
      globalShare: "~14%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 12000,
      globalShare: "~1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: true,
      reserveKt: 6,
      globalShare: "~2%",
      use: "Electronics, solar",
      color: "#f59e0b",
    },
    {
      name: "Boron",
      symbol: "B",
      has: true,
      surplus: true,
      reserveKt: 2000,
      globalShare: "~1%",
      use: "Glass, ceramics",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "peru-eco": [
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 120000,
      globalShare: "~12%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: true,
      reserveKt: 110,
      globalShare: "~22%",
      use: "Electronics, solar",
      color: "#f59e0b",
    },
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: true,
      reserveKt: 19000,
      globalShare: "~8%",
      use: "Galvanizing, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Molybdenum",
      symbol: "Mo",
      has: true,
      surplus: true,
      reserveKt: 2300,
      globalShare: "~15%",
      use: "Steel alloys",
      color: "#10b981",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
  ],
  "mexico-eco": [
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: true,
      reserveKt: 37,
      globalShare: "~7%",
      use: "Electronics, solar",
      color: "#f59e0b",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 53000,
      globalShare: "~5%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Fluorspar",
      symbol: "F",
      has: true,
      surplus: true,
      reserveKt: 68000,
      globalShare: "~13%",
      use: "Refrigerants, steel flux",
      color: "#10b981",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 1700,
      globalShare: "~6%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: true,
      reserveKt: 11000,
      globalShare: "~5%",
      use: "Galvanizing, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
  ],
  "philippines-eco": [
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: true,
      reserveKt: 4800,
      globalShare: "~4%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 260,
      globalShare: "~2%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 4000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.9,
      globalShare: "~2%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
  ],
  "ukraine-eco": [
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: 5900,
      globalShare: "~7%",
      use: "Aerospace alloys",
      color: "#0ea5e9",
    },
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: false,
      reserveKt: 19000,
      globalShare: "~6%",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Manganese",
      symbol: "Mn",
      has: true,
      surplus: false,
      reserveKt: 140000,
      globalShare: "~8%",
      use: "Steel, batteries",
      color: "#f59e0b",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 500,
      globalShare: "~2%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Deposits unquantified",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#10b981",
    },
  ],
  "sweden-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 1000,
      globalShare: "~1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Iron",
      symbol: "Fe",
      has: true,
      surplus: true,
      reserveKt: 1300000,
      globalShare: "~1%",
      use: "Steel",
      color: "#f97316",
    },
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: false,
      reserveKt: 1000,
      globalShare: "<1%",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 1000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#0ea5e9",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#10b981",
    },
  ],
  "finland-eco": [
    {
      name: "Cobalt",
      symbol: "Co",
      has: true,
      surplus: true,
      reserveKt: 210,
      globalShare: "~2%",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: true,
      reserveKt: 1600,
      globalShare: "~1%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 100,
      globalShare: "<1%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Chromium",
      symbol: "Cr",
      has: true,
      surplus: true,
      reserveKt: 25000,
      globalShare: "~4%",
      use: "Stainless steel",
      color: "#14b8a6",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Graphite",
      symbol: "C",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Anodes, refractories",
      color: "#f59e0b",
    },
  ],
  "norway-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Fen complex, unproven",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: false,
      reserveKt: 100,
      globalShare: "<1%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: 37000,
      globalShare: "~5%",
      use: "Aerospace alloys",
      color: "#0ea5e9",
    },
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: false,
      reserveKt: 600,
      globalShare: "<1%",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#f59e0b",
    },
  ],
  "portugal-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 60,
      globalShare: "Largest in EU",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Tungsten",
      symbol: "W",
      has: true,
      surplus: true,
      reserveKt: 3,
      globalShare: "~1%",
      use: "Cutting tools, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 2000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#10b981",
    },
  ],
  "spain-eco": [
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 3000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Tungsten",
      symbol: "W",
      has: true,
      surplus: true,
      reserveKt: 32,
      globalShare: "~1%",
      use: "Cutting tools, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 300,
      globalShare: "~1%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Fluorspar",
      symbol: "F",
      has: true,
      surplus: true,
      reserveKt: 6000,
      globalShare: "~1%",
      use: "Refrigerants, steel flux",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "poland-eco": [
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 34000,
      globalShare: "~3%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: true,
      reserveKt: 63,
      globalShare: "~12%",
      use: "Electronics, solar",
      color: "#f59e0b",
    },
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: false,
      reserveKt: 1600,
      globalShare: "<1%",
      use: "Galvanizing, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "czechia-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 1300,
      globalShare: "~4%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Tungsten",
      symbol: "W",
      has: true,
      surplus: false,
      reserveKt: 2,
      globalShare: "<1%",
      use: "Cutting tools, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Kaolin",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: 300000,
      globalShare: "~3%",
      use: "Ceramics, paper",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#f59e0b",
    },
  ],
  "serbia-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 1200,
      globalShare: "~4%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 3000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Boron",
      symbol: "B",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Jadar deposit",
      use: "Glass, ceramics",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#f59e0b",
    },
  ],
  "mozambique-eco": [
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: true,
      reserveKt: 25000,
      globalShare: "~8%",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: 14000,
      globalShare: "~2%",
      use: "Aerospace alloys, pigment",
      color: "#0ea5e9",
    },
    {
      name: "Aluminium",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Mozal smelter",
      use: "Aluminium products",
      color: "#f97316",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#10b981",
    },
  ],
  "tanzania-eco": [
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: false,
      reserveKt: 18000,
      globalShare: "~6%",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: 890,
      globalShare: "~1%",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 1.1,
      globalShare: "~2%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: false,
      reserveKt: 300,
      globalShare: "<1%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
  ],
  "ghana-eco": [
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: 900000,
      globalShare: "~3%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Manganese",
      symbol: "Mn",
      has: true,
      surplus: true,
      reserveKt: 13000,
      globalShare: "~1%",
      use: "Steel, batteries",
      color: "#f59e0b",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 1.0,
      globalShare: "~2%",
      use: "Electronics, reserves",
      color: "#10b981",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Ewoyaa, pre-production",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "nigeria-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Emerging producer",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Tantalum",
      symbol: "Ta",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Columbite-tantalite",
      use: "Capacitors, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: true,
      surplus: false,
      reserveKt: 50,
      globalShare: "~1%",
      use: "Solder, electronics",
      color: "#f59e0b",
    },
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: false,
      reserveKt: 500,
      globalShare: "<1%",
      use: "Galvanizing, alloys",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "uzbekistan-eco": [
    {
      name: "Uranium",
      symbol: "U",
      has: true,
      surplus: true,
      reserveKt: 130,
      globalShare: "~2%",
      use: "Nuclear fuel",
      color: "#14b8a6",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 1.8,
      globalShare: "~4%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 6000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Molybdenum",
      symbol: "Mo",
      has: true,
      surplus: false,
      reserveKt: 60,
      globalShare: "<1%",
      use: "Steel alloys",
      color: "#0ea5e9",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
  ],
  "saudiarabia-eco": [
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: true,
      reserveKt: 1400000,
      globalShare: "~2%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: false,
      reserveKt: 0.3,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: 200000,
      globalShare: "<1%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 900,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Brine pilots only",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "colombia-eco": [
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: true,
      reserveKt: 800,
      globalShare: "<1%",
      use: "Stainless steel, batteries",
      color: "#10b981",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.3,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Emeralds",
      symbol: "Be",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "~55% of trade",
      use: "Gemstones",
      color: "#0ea5e9",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 1000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
  ],
  "uk-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Cornwall, pre-production",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: true,
      surplus: false,
      reserveKt: 12,
      globalShare: "<1%",
      use: "Solder, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Kaolin",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: 230000,
      globalShare: "~2%",
      use: "Ceramics, paper",
      color: "#10b981",
    },
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: 55000,
      globalShare: "<1%",
      use: "Plasterboard, cement",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "france-eco": [
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: 320,
      globalShare: "~1%",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Talc",
      symbol: "Mg",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Trimouns, large",
      use: "Fillers, ceramics",
      color: "#10b981",
    },
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: 100000,
      globalShare: "~1%",
      use: "Plasterboard, cement",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Processing, not reserves",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Refining only",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
  "southkorea-eco": [
    {
      name: "Tungsten",
      symbol: "W",
      has: true,
      surplus: false,
      reserveKt: 26,
      globalShare: "~1%",
      use: "Cutting tools, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: false,
      reserveKt: 1500,
      globalShare: "<1%",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Refining, not reserves",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Refining, not reserves",
      use: "Battery cathodes",
      color: "#10b981",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "Stainless steel, batteries",
      color: "#f59e0b",
    },
  ],
  "netherlands-eco": [
    {
      name: "Salt",
      symbol: "Na",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Major EU producer",
      use: "Chemicals, de-icing",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
  "switzerland-eco": [
    {
      name: "Gold",
      symbol: "Au",
      has: false,
      surplus: true,
      reserveKt: null,
      globalShare: "~65% of refining",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Salt",
      symbol: "Na",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Domestic supply",
      use: "Chemicals, de-icing",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Wiring, electrification",
      color: "#f97316",
    },
  ],
  "uae-eco": [
    {
      name: "Aluminium",
      symbol: "Al",
      has: false,
      surplus: true,
      reserveKt: null,
      globalShare: "~3% of smelting",
      use: "Aluminium products",
      color: "#f97316",
    },
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Large exporter",
      use: "Plasterboard, cement",
      color: "#f59e0b",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: false,
      surplus: true,
      reserveKt: null,
      globalShare: "Major refining hub",
      use: "Electronics, reserves",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "belgium-eco": [
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: true,
      reserveKt: null,
      globalShare: "Umicore refining hub",
      use: "Battery cathodes",
      color: "#0ea5e9",
    },
    {
      name: "Germanium",
      symbol: "Ge",
      has: false,
      surplus: true,
      reserveKt: null,
      globalShare: "Major refiner",
      use: "Optics, semiconductors",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Recycling only",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#f59e0b",
    },
  ],
  "singapore-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Solder, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "LEDs, superconductors",
      color: "#f59e0b",
    },
  ],
  "israel-eco": [
    {
      name: "Bromine",
      symbol: "Br",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "~35% of output",
      use: "Flame retardants, drilling",
      color: "#f97316",
    },
    {
      name: "Potash",
      symbol: "K",
      has: true,
      surplus: true,
      reserveKt: 40000,
      globalShare: "~1%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: true,
      reserveKt: 60000,
      globalShare: "<1%",
      use: "Fertilizer",
      color: "#f59e0b",
    },
    {
      name: "Magnesium",
      symbol: "Mg",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Dead Sea brines",
      use: "Alloys, lightweighting",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "egypt-eco": [
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: true,
      reserveKt: 2800000,
      globalShare: "~4%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.6,
      globalShare: "~1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Black sands, unquantified",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Black sand ilmenite",
      use: "Aerospace alloys, pigment",
      color: "#0ea5e9",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "thailand-eco": [
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: 200000,
      globalShare: "Top exporter",
      use: "Plasterboard, cement",
      color: "#f59e0b",
    },
    {
      name: "Tin",
      symbol: "Sn",
      has: true,
      surplus: false,
      reserveKt: 170,
      globalShare: "~4%",
      use: "Solder, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Potash",
      symbol: "K",
      has: true,
      surplus: false,
      reserveKt: 400000,
      globalShare: "~4%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Ionic clay, small",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "denmark-eco": [
    {
      name: "Chalk",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Domestic supply",
      use: "Cement, agriculture",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None in Denmark proper",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
  "pakistan-eco": [
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 6000,
      globalShare: "~1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Salt",
      symbol: "Na",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Khewra, very large",
      use: "Chemicals, food",
      color: "#10b981",
    },
    {
      name: "Chromium",
      symbol: "Cr",
      has: true,
      surplus: false,
      reserveKt: 500,
      globalShare: "<1%",
      use: "Stainless steel",
      color: "#0ea5e9",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: false,
      reserveKt: 0.4,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "bangladesh-eco": [
    {
      name: "Limestone",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Domestic supply",
      use: "Cement",
      color: "#f59e0b",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Beach sands, small",
      use: "Pigment, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
  ],
  "austria-eco": [
    {
      name: "Tungsten",
      symbol: "W",
      has: true,
      surplus: true,
      reserveKt: 10,
      globalShare: "~1%",
      use: "Cutting tools, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Magnesite",
      symbol: "Mg",
      has: true,
      surplus: true,
      reserveKt: 15000,
      globalShare: "~2%",
      use: "Refractories, steel",
      color: "#10b981",
    },
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Historic producer",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Koralpe, pre-production",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#f59e0b",
    },
  ],
  "iran-eco": [
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: true,
      reserveKt: 20000,
      globalShare: "~8%",
      use: "Galvanizing, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 21000,
      globalShare: "~2%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Iron",
      symbol: "Fe",
      has: true,
      surplus: true,
      reserveKt: 2700000,
      globalShare: "~2%",
      use: "Steel",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Claims unverified",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "iraq-eco": [
    {
      name: "Sulfur",
      symbol: "S",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Mishraq, large",
      use: "Chemicals, fertilizer",
      color: "#f59e0b",
    },
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: false,
      reserveKt: 430000,
      globalShare: "<1%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
  ],
  "greece-eco": [
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: true,
      reserveKt: 250000,
      globalShare: "Largest in EU",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Perlite",
      symbol: "Si",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "~30% of output",
      use: "Insulation, filtration",
      color: "#10b981",
    },
    {
      name: "Nickel",
      symbol: "Ni",
      has: true,
      surplus: false,
      reserveKt: 500,
      globalShare: "<1%",
      use: "Stainless steel, batteries",
      color: "#0ea5e9",
    },
    {
      name: "Magnesite",
      symbol: "Mg",
      has: true,
      surplus: true,
      reserveKt: 30000,
      globalShare: "~3%",
      use: "Refractories, steel",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "kuwait-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Local construction use",
      use: "Plasterboard, cement",
      color: "#f59e0b",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
  "qatar-eco": [
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Local construction use",
      use: "Plasterboard, cement",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
  "ethiopia-eco": [
    {
      name: "Tantalum",
      symbol: "Ta",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Kenticha, notable",
      use: "Capacitors, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Potash",
      symbol: "K",
      has: true,
      surplus: false,
      reserveKt: 130000,
      globalShare: "~1%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.2,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Kenticha, pre-production",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "kenya-eco": [
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Kwale mineral sands",
      use: "Pigment, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Soda ash",
      symbol: "Na",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Lake Magadi, large",
      use: "Glass, chemicals",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Mrima Hill, undeveloped",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Zirconium",
      symbol: "Zr",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Mineral sands by-product",
      use: "Ceramics, refractories",
      color: "#f59e0b",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "angola-eco": [
    {
      name: "Diamonds",
      symbol: "C",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Top 5 by value",
      use: "Gemstones, industrial",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Longonjo, pre-production",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Phosphate",
      symbol: "P",
      has: true,
      surplus: false,
      reserveKt: 150000,
      globalShare: "<1%",
      use: "Fertilizer",
      color: "#10b981",
    },
    {
      name: "Iron",
      symbol: "Fe",
      has: true,
      surplus: false,
      reserveKt: 100000,
      globalShare: "<1%",
      use: "Steel",
      color: "#f59e0b",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "venezuela-eco": [
    {
      name: "Iron",
      symbol: "Fe",
      has: true,
      surplus: false,
      reserveKt: 4000000,
      globalShare: "~2%",
      use: "Steel",
      color: "#f59e0b",
    },
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: false,
      reserveKt: 320000,
      globalShare: "~1%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: false,
      reserveKt: 0.8,
      globalShare: "~1%",
      use: "Electronics, reserves",
      color: "#10b981",
    },
    {
      name: "Coltan",
      symbol: "Ta",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Orinoco, informal",
      use: "Capacitors, electronics",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
  ],
  "ecuador-eco": [
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 3000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.3,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: false,
      reserveKt: 1,
      globalShare: "<1%",
      use: "Electronics, solar",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "cambodia-eco": [
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Undeveloped deposits",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: false,
      reserveKt: 0.1,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Limestone",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Domestic supply",
      use: "Cement",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "srilanka-eco": [
    {
      name: "Graphite",
      symbol: "C",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Only vein graphite source",
      use: "Anodes, refractories",
      color: "#14b8a6",
    },
    {
      name: "Titanium",
      symbol: "Ti",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Pulmoddai ilmenite",
      use: "Pigment, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Zirconium",
      symbol: "Zr",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Mineral sands by-product",
      use: "Ceramics, refractories",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Monazite, small",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#10b981",
    },
  ],
  "nepal-eco": [
    {
      name: "Limestone",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Domestic cement supply",
      use: "Cement",
      color: "#f59e0b",
    },
    {
      name: "Magnesite",
      symbol: "Mg",
      has: true,
      surplus: false,
      reserveKt: 20000,
      globalShare: "<1%",
      use: "Refractories, steel",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
  ],
  "newzealand-eco": [
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.2,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Iron",
      symbol: "Fe",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Titanomagnetite sands",
      use: "Steel",
      color: "#f97316",
    },
    {
      name: "Silver",
      symbol: "Ag",
      has: true,
      surplus: false,
      reserveKt: 1,
      globalShare: "<1%",
      use: "Electronics, solar",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "romania-eco": [
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: false,
      reserveKt: 0.4,
      globalShare: "~1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Salt",
      symbol: "Na",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Large domestic reserves",
      use: "Chemicals, de-icing",
      color: "#10b981",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: false,
      reserveKt: 1000,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "hungary-eco": [
    {
      name: "Bauxite",
      symbol: "Al",
      has: true,
      surplus: false,
      reserveKt: 20000,
      globalShare: "<1%",
      use: "Aluminium feedstock",
      color: "#f97316",
    },
    {
      name: "Manganese",
      symbol: "Mn",
      has: true,
      surplus: false,
      reserveKt: 2000,
      globalShare: "<1%",
      use: "Steel, batteries",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Refining, not reserves",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#0ea5e9",
    },
  ],
  "slovakia-eco": [
    {
      name: "Magnesite",
      symbol: "Mg",
      has: true,
      surplus: true,
      reserveKt: 100000,
      globalShare: "~5%",
      use: "Refractories, steel",
      color: "#10b981",
    },
    {
      name: "Talc",
      symbol: "Mg",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Gemerská Poloma",
      use: "Fillers, ceramics",
      color: "#f59e0b",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
  ],
  "bulgaria-eco": [
    {
      name: "Copper",
      symbol: "Cu",
      has: true,
      surplus: true,
      reserveKt: 1500,
      globalShare: "<1%",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: true,
      surplus: true,
      reserveKt: 0.2,
      globalShare: "<1%",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: false,
      reserveKt: 500,
      globalShare: "<1%",
      use: "Galvanizing, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "croatia-eco": [
    {
      name: "Limestone",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Cement and stone",
      use: "Cement, construction",
      color: "#f59e0b",
    },
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Domestic supply",
      use: "Plasterboard, cement",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Wiring, electrification",
      color: "#f97316",
    },
  ],
  "ireland-eco": [
    {
      name: "Zinc",
      symbol: "Zn",
      has: true,
      surplus: true,
      reserveKt: 1200,
      globalShare: "Largest in EU",
      use: "Galvanizing, alloys",
      color: "#0ea5e9",
    },
    {
      name: "Lead",
      symbol: "Pb",
      has: true,
      surplus: true,
      reserveKt: 300,
      globalShare: "<1%",
      use: "Batteries, shielding",
      color: "#f59e0b",
    },
    {
      name: "Gypsum",
      symbol: "Ca",
      has: true,
      surplus: false,
      reserveKt: null,
      globalShare: "Domestic supply",
      use: "Plasterboard, cement",
      color: "#10b981",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Exploration stage",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "italy-eco": [
    {
      name: "Feldspar",
      symbol: "Si",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Top global producer",
      use: "Ceramics, glass",
      color: "#10b981",
    },
    {
      name: "Marble",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Carrara, premium stone",
      use: "Construction stone",
      color: "#f59e0b",
    },
    {
      name: "Pumice",
      symbol: "Si",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Significant producer",
      use: "Abrasives, cement",
      color: "#f97316",
    },
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Geothermal brine pilots",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "None significant",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
  ],
  "taiwan-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Marble",
      symbol: "Ca",
      has: true,
      surplus: true,
      reserveKt: null,
      globalShare: "Hualien, large",
      use: "Construction stone",
      color: "#f59e0b",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Import dependent",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
  "hongkong-eco": [
    {
      name: "Neodymium",
      symbol: "Nd",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "EV motors, wind turbines",
      color: "#6366f1",
    },
    {
      name: "Lithium",
      symbol: "Li",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Batteries",
      color: "#7c3aed",
    },
    {
      name: "Cobalt",
      symbol: "Co",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Battery cathodes",
      color: "#14b8a6",
    },
    {
      name: "Copper",
      symbol: "Cu",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "Trading hub only",
      use: "Wiring, electrification",
      color: "#f97316",
    },
    {
      name: "Gold",
      symbol: "Au",
      has: false,
      surplus: true,
      reserveKt: null,
      globalShare: "Major bullion market",
      use: "Electronics, reserves",
      color: "#f59e0b",
    },
    {
      name: "Yttrium",
      symbol: "Y",
      has: false,
      surplus: false,
      reserveKt: null,
      globalShare: "No domestic reserves",
      use: "LEDs, superconductors",
      color: "#0ea5e9",
    },
  ],
};

// Default for economies without specific data
const DEFAULT_RARE_EARTHS: RareEarthMineral[] = [
  {
    name: "Neodymium",
    symbol: "Nd",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "EV motors, wind turbines",
    color: "#6366f1",
  },
  {
    name: "Lithium",
    symbol: "Li",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "Batteries",
    color: "#7c3aed",
  },
  {
    name: "Cobalt",
    symbol: "Co",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "Battery cathodes",
    color: "#4f46e5",
  },
  {
    name: "Dysprosium",
    symbol: "Dy",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "High-temp magnets",
    color: "#8b5cf6",
  },
  {
    name: "Lanthanum",
    symbol: "La",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "Catalysts, optics",
    color: "#a78bfa",
  },
  {
    name: "Cerium",
    symbol: "Ce",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "Polishing, glass",
    color: "#c4b5fd",
  },
  {
    name: "Scandium",
    symbol: "Sc",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "Aerospace alloys",
    color: "#34d399",
  },
  {
    name: "Yttrium",
    symbol: "Y",
    has: false,
    surplus: false,
    reserveKt: null,
    globalShare: "None significant",
    use: "LEDs, superconductors",
    color: "#67e8f9",
  },
];

// ── Per-economy natural resources data ──────────────────────────────────────
const ECONOMY_RESOURCES: Record<
  string,
  {
    name: string;
    value: number;
    unit: string;
    color: string;
    icon: string;
    share: string;
  }[]
> = {
  "usa-eco": [
    {
      name: "Natural Gas",
      value: 12.6,
      unit: "tcf/yr",
      color: "#6366f1",
      icon: "🔥",
      share: "Top 1 producer",
    },
    {
      name: "Crude Oil",
      value: 13.2,
      unit: "mb/d",
      color: "#f97316",
      icon: "🛢️",
      share: "Top 1 producer",
    },
    {
      name: "Coal",
      value: 485,
      unit: "Mt/yr",
      color: "#6b7280",
      icon: "⛏️",
      share: "3rd global",
    },
    {
      name: "Gold",
      value: 170,
      unit: "t/yr",
      color: "#f59e0b",
      icon: "🥇",
      share: "4th global",
    },
    {
      name: "Copper",
      value: 1.1,
      unit: "Mt/yr",
      color: "#dc2626",
      icon: "🔩",
      share: "4th global",
    },
  ],
  "china-eco": [
    {
      name: "Coal",
      value: 4560,
      unit: "Mt/yr",
      color: "#6b7280",
      icon: "⛏️",
      share: "50% of global",
    },
    {
      name: "Rare Earth",
      value: 210,
      unit: "kt/yr",
      color: "#059669",
      icon: "🧲",
      share: "60% of global",
    },
    {
      name: "Steel",
      value: 1018,
      unit: "Mt/yr",
      color: "#94a3b8",
      icon: "🏗️",
      share: "57% of global",
    },
    {
      name: "Copper",
      value: 1.9,
      unit: "Mt/yr",
      color: "#dc2626",
      icon: "🔩",
      share: "1st global",
    },
    {
      name: "Gold",
      value: 330,
      unit: "t/yr",
      color: "#f59e0b",
      icon: "🥇",
      share: "1st global",
    },
  ],
  "eu-eco": [
    {
      name: "Natural Gas",
      value: 47,
      unit: "bcm/yr",
      color: "#6366f1",
      icon: "🔥",
      share: "Imports ~80%",
    },
    {
      name: "Coal",
      value: 132,
      unit: "Mt/yr",
      color: "#6b7280",
      icon: "⛏️",
      share: "Declining",
    },
    {
      name: "Lithium",
      value: 0.9,
      unit: "kt/yr",
      color: "#7c3aed",
      icon: "🔋",
      share: "Growing",
    },
    {
      name: "Copper",
      value: 0.8,
      unit: "Mt/yr",
      color: "#dc2626",
      icon: "🔩",
      share: "Refining hub",
    },
    {
      name: "Uranium",
      value: 0.4,
      unit: "kt/yr",
      color: "#84cc16",
      icon: "☢️",
      share: "Czech/France",
    },
  ],
  "germany-eco": [
    {
      name: "Coal",
      value: 131,
      unit: "Mt/yr",
      color: "#6b7280",
      icon: "⛏️",
      share: "EU largest",
    },
    {
      name: "Potash",
      value: 3.9,
      unit: "Mt/yr",
      color: "#a3a3a3",
      icon: "🌿",
      share: "3rd global",
    },
    {
      name: "Salt",
      value: 14,
      unit: "Mt/yr",
      color: "#e2e8f0",
      icon: "🧂",
      share: "Major EU",
    },
    {
      name: "Gravel/Sand",
      value: 260,
      unit: "Mt/yr",
      color: "#d97706",
      icon: "🪨",
      share: "EU top",
    },
    {
      name: "Natural Gas",
      value: 5,
      unit: "bcm/yr",
      color: "#6366f1",
      icon: "🔥",
      share: "Imports 90%",
    },
  ],
  "india-eco": [
    {
      name: "Coal",
      value: 898,
      unit: "Mt/yr",
      color: "#6b7280",
      icon: "⛏️",
      share: "2nd global",
    },
    {
      name: "Iron Ore",
      value: 230,
      unit: "Mt/yr",
      color: "#b45309",
      icon: "⚙️",
      share: "3rd global",
    },
    {
      name: "Mica",
      value: 0.9,
      unit: "Mt/yr",
      color: "#f0abfc",
      icon: "💎",
      share: "1st global",
    },
    {
      name: "Manganese",
      value: 3.2,
      unit: "Mt/yr",
      color: "#8b5cf6",
      icon: "🔬",
      share: "5th global",
    },
    {
      name: "Chromite",
      value: 3.5,
      unit: "Mt/yr",
      color: "#0ea5e9",
      icon: "🧲",
      share: "2nd global",
    },
  ],
  "japan-eco": [
    {
      name: "Iodine",
      value: 9.5,
      unit: "kt/yr",
      color: "#a21caf",
      icon: "💧",
      share: "2nd global",
    },
    {
      name: "Pyrophyllite",
      value: 0.4,
      unit: "Mt/yr",
      color: "#78716c",
      icon: "🪨",
      share: "Significant",
    },
    {
      name: "Zinc",
      value: 0.1,
      unit: "Mt/yr",
      color: "#71717a",
      icon: "🔩",
      share: "Limited",
    },
    {
      name: "Natural Gas",
      value: 3.5,
      unit: "bcm/yr",
      color: "#6366f1",
      icon: "🔥",
      share: "Imports 98%",
    },
    {
      name: "Fish Catch",
      value: 3.2,
      unit: "Mt/yr",
      color: "#06b6d4",
      icon: "🐟",
      share: "6th global",
    },
  ],
  "brazil-eco": [
    {
      name: "Iron Ore",
      value: 411,
      unit: "Mt/yr",
      color: "#b45309",
      icon: "⚙️",
      share: "2nd global",
    },
    {
      name: "Crude Oil",
      value: 3.6,
      unit: "mb/d",
      color: "#f97316",
      icon: "🛢️",
      share: "8th global",
    },
    {
      name: "Soybeans",
      value: 154,
      unit: "Mt/yr",
      color: "#65a30d",
      icon: "🌱",
      share: "1st global",
    },
    {
      name: "Sugar",
      value: 42,
      unit: "Mt/yr",
      color: "#fde68a",
      icon: "🍬",
      share: "1st global",
    },
    {
      name: "Copper",
      value: 0.4,
      unit: "Mt/yr",
      color: "#dc2626",
      icon: "🔩",
      share: "Growing",
    },
  ],
  "saudiarabia-eco": [
    {
      name: "Crude Oil",
      value: 10.5,
      unit: "mb/d",
      color: "#f97316",
      icon: "🛢️",
      share: "2nd global",
    },
    {
      name: "Natural Gas",
      value: 4.6,
      unit: "tcf/yr",
      color: "#6366f1",
      icon: "🔥",
      share: "Top 10",
    },
    {
      name: "Petrochemicals",
      value: 8.6,
      unit: "%GDP",
      color: "#a78bfa",
      icon: "🧪",
      share: "Major exporter",
    },
    {
      name: "Gold",
      value: 8,
      unit: "t/yr",
      color: "#f59e0b",
      icon: "🥇",
      share: "Growing",
    },
    {
      name: "Phosphate",
      value: 3.8,
      unit: "Mt/yr",
      color: "#84cc16",
      icon: "🌿",
      share: "Significant",
    },
  ],
};

// Fallback generic resources for economies not explicitly listed
const FALLBACK_RESOURCES = [
  {
    name: "Agricultural",
    value: 45,
    unit: "% land",
    color: "#4ade80",
    icon: "🌾",
    share: "Varies",
  },
  {
    name: "Hydro Power",
    value: 28,
    unit: "TWh/yr",
    color: "#38bdf8",
    icon: "💧",
    share: "Regional",
  },
  {
    name: "Forestry",
    value: 22,
    unit: "% coverage",
    color: "#65a30d",
    icon: "🌲",
    share: "Regional",
  },
  {
    name: "Fisheries",
    value: 18,
    unit: "Mt/yr",
    color: "#06b6d4",
    icon: "🐟",
    share: "Regional",
  },
  {
    name: "Minerals",
    value: 12,
    unit: "% exports",
    color: "#94a3b8",
    icon: "⛏️",
    share: "Varies",
  },
];

const SRC_IMF = [
  {
    label: "IMF World Economic Outlook",
    url: "https://www.imf.org/en/Publications/WEO",
  },
  { label: "World Bank Open Data", url: "https://data.worldbank.org/" },
];
const SRC_OECD = [
  { label: "OECD.Stat", url: "https://stats.oecd.org/" },
  { label: "IMF Data", url: "https://www.imf.org/en/Data" },
];
const SRC_WTO = [
  {
    label: "WTO Statistics",
    url: "https://www.wto.org/english/res_e/statis_e/statis_e.htm",
  },
];
const SRC_MARITIME = [
  {
    label: "UNCTAD Maritime Transport",
    url: "https://unctad.org/topic/transport-and-trade-logistics/review-of-maritime-transport",
  },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  CAD: "CA$",
  AUD: "A$",
  KRW: "₩",
  RUB: "₽",
  MXN: "MX$",
  IDR: "Rp",
  CHF: "Fr",
  ARS: "$",
  AED: "د.إ",
  SAR: "﷼",
  TRY: "₺",
  PLN: "zł",
  SEK: "kr",
  DKK: "kr",
  NOK: "kr",
  SGD: "S$",
  MYR: "RM",
  ILS: "₪",
  EGP: "£",
  ZAR: "R",
  THB: "฿",
  NGN: "₦",
  PKR: "₨",
  VND: "₫",
  CLP: "$",
  PHP: "₱",
  BDT: "৳",
  NZD: "NZ$",
  HUF: "Ft",
  CZK: "Kč",
  RON: "lei",
  BGN: "лв",
  HRK: "€",
  UAH: "₴",
  RSD: "дин",
  KWD: "د.ك",
  QAR: "﷼",
  ETB: "Br",
  KES: "KSh",
  GHS: "₵",
  TZS: "TSh",
  AOA: "Kz",
  MAD: "د.م.",
  MZN: "MT",
  PEN: "S/.",
  VES: "Bs.S",
  TWD: "NT$",
  HKD: "HK$",
  UZS: "so'm",
  KZT: "₸",
  MMK: "K",
  KHR: "៛",
  LKR: "Rs",
  NPR: "Rs",
  IRR: "﷼",
  IQD: "ع.د",
  COP: "$",
};

// Static mid-market rates vs USD (Aug 2026 approx.)
const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.921,
  GBP: 0.787,
  JPY: 149.8,
  CNY: 7.24,
  INR: 83.5,
  BRL: 4.97,
  CAD: 1.363,
  AUD: 1.531,
  KRW: 1325,
  RUB: 91.2,
  MXN: 17.15,
  IDR: 15640,
  CHF: 0.894,
  ARS: 874,
  AED: 3.673,
  SAR: 3.751,
  TRY: 32.4,
  PLN: 3.96,
  SEK: 10.42,
  DKK: 6.87,
  NOK: 10.55,
  SGD: 1.339,
  MYR: 4.71,
  ILS: 3.73,
  EGP: 30.9,
  ZAR: 18.62,
  THB: 35.1,
  NGN: 1480,
  PKR: 278,
  VND: 24350,
  CLP: 897,
  PHP: 56.2,
  BDT: 110,
  NZD: 1.628,
  HUF: 352,
  CZK: 22.7,
  RON: 4.58,
  UAH: 37.2,
  KWD: 0.308,
  QAR: 3.641,
  TWD: 31.9,
  HKD: 7.825,
  HKD2: 7.825,
  KZT: 455,
  MMK: 2098,
  LKR: 327,
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  BRL: "Brazilian Real",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  KRW: "South Korean Won",
  RUB: "Russian Ruble",
  MXN: "Mexican Peso",
  IDR: "Indonesian Rupiah",
  CHF: "Swiss Franc",
  ARS: "Argentine Peso",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  TRY: "Turkish Lira",
  PLN: "Polish Złoty",
  SEK: "Swedish Krona",
  DKK: "Danish Krone",
  NOK: "Norwegian Krone",
  SGD: "Singapore Dollar",
  MYR: "Malaysian Ringgit",
  ILS: "Israeli Shekel",
  EGP: "Egyptian Pound",
  ZAR: "South African Rand",
  THB: "Thai Baht",
  NGN: "Nigerian Naira",
  PKR: "Pakistani Rupee",
  VND: "Vietnamese Dong",
  CLP: "Chilean Peso",
  PHP: "Philippine Peso",
  BDT: "Bangladeshi Taka",
  NZD: "New Zealand Dollar",
  HUF: "Hungarian Forint",
  CZK: "Czech Koruna",
  RON: "Romanian Leu",
  UAH: "Ukrainian Hryvnia",
  KWD: "Kuwaiti Dinar",
  QAR: "Qatari Riyal",
  TWD: "Taiwan Dollar",
  HKD: "Hong Kong Dollar",
  KZT: "Kazakhstani Tenge",
  MMK: "Myanmar Kyat",
  LKR: "Sri Lankan Rupee",
};

const POPULAR_PAIRS = [
  { from: "USD", to: "EUR" },
  { from: "USD", to: "GBP" },
  { from: "USD", to: "JPY" },
  { from: "EUR", to: "GBP" },
  { from: "GBP", to: "JPY" },
  { from: "USD", to: "CNY" },
];

function CurrencyConverter() {
  const [amount, setAmount] = useState("1");
  const [fromCur, setFromCur] = useState("USD");
  const [toCur, setToCur] = useState("EUR");

  const convert = useCallback((val: string, from: string, to: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || !FX_RATES[from] || !FX_RATES[to]) return "—";
    const inUSD = n / FX_RATES[from];
    const result = inUSD * FX_RATES[to];
    if (result >= 1e6)
      return result.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (result >= 1000)
      return result.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return result.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }, []);

  const rate = useCallback((from: string, to: string) => {
    if (!FX_RATES[from] || !FX_RATES[to]) return "—";
    const r = FX_RATES[to] / FX_RATES[from];
    if (r >= 100)
      return r.toLocaleString("en-US", { maximumFractionDigits: 1 });
    return r.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }, []);

  const swap = () => {
    setFromCur(toCur);
    setToCur(fromCur);
  };

  const fromSym = CURRENCY_SYMBOLS[fromCur] ?? fromCur;
  const toSym = CURRENCY_SYMBOLS[toCur] ?? toCur;
  const resultVal = convert(amount, fromCur, toCur);
  const currencies = Object.keys(FX_RATES).filter((c) => c !== "HKD2");

  const currencyOptions = currencies.map((c) => ({
    value: c,
    label: `${c} — ${CURRENCY_NAMES[c] ?? c}`,
  }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-secondary/20">
          <ArrowsLeftRight size={16} weight="fill" className="text-secondary" />
        </div>
        <div>
          <p className="text-sm font-semibold font-sans text-foreground leading-tight">
            Currency Converter
          </p>
          <p className="text-[10px] text-muted-foreground font-sans">
            Mid-market rates · Aug 2026
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {POPULAR_PAIRS.map((p) => (
            <button
              key={`${p.from}-${p.to}`}
              onClick={() => {
                setFromCur(p.from);
                setToCur(p.to);
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${fromCur === p.from && toCur === p.to ? "bg-secondary/20 border-secondary/40 text-secondary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
            >
              {p.from}/{p.to}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* FROM */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Amount
          </label>
          <div className="flex items-center gap-2 bg-background/60 border border-border rounded-xl px-3 py-2.5">
            <span className="text-sm font-bold font-mono text-secondary shrink-0">
              {fromSym}
            </span>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm font-mono text-foreground focus:outline-none min-w-0"
              placeholder="1"
            />
            <StyledSelect
              value={fromCur}
              onValueChange={setFromCur}
              ariaLabel="Convert from currency"
              options={currencyOptions}
            />
          </div>
        </div>

        {/* SWAP */}
        <button
          onClick={swap}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20 hover:border-secondary/40 transition-all cursor-pointer self-end sm:self-auto mb-1 sm:mb-0 shrink-0"
          aria-label="Swap currencies"
        >
          <ArrowsLeftRight size={14} weight="bold" />
        </button>

        {/* TO */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Result
          </label>
          <div className="flex items-center gap-2 bg-secondary/5 border border-secondary/20 rounded-xl px-3 py-2.5">
            <span className="text-sm font-bold font-mono text-secondary shrink-0">
              {toSym}
            </span>
            <span className="flex-1 text-sm font-mono font-bold text-foreground min-w-0 truncate">
              {resultVal}
            </span>
            <StyledSelect
              value={toCur}
              onValueChange={setToCur}
              ariaLabel="Convert to currency"
              options={currencyOptions}
            />
          </div>
        </div>
      </div>

      {/* Rate row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
              1 {fromCur}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              = {rate(fromCur, toCur)} {toCur}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
              1 {toCur}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              = {rate(toCur, fromCur)} {fromCur}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-sans text-right">
          Indicative rates only.
          <br />
          Not for transactional use.
        </p>
      </div>
    </div>
  );
}

const getCurrencyDisplay = (code: string, name: string) => {
  const sym = CURRENCY_SYMBOLS[code];
  return sym ? `${sym} ${code} · ${name}` : `${code} · ${name}`;
};

const ratingColor = (r: string) => {
  if (r.startsWith("AAA"))
    return "text-success bg-success/10 border-success/30";
  if (r.startsWith("AA"))
    return "text-secondary bg-secondary/10 border-secondary/30";
  if (r.startsWith("A"))
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-orange-400 bg-orange-500/10 border-orange-500/30";
};

const SECTOR_COLORS: Record<string, string> = {
  Services: "#38bdf8",
  Industry: "#a78bfa",
  Agriculture: "#4ade80",
  Manufacturing: "#fb923c",
  Finance: "#f472b6",
  Technology: "#facc15",
  Energy: "#f97316",
  Mining: "#a3a3a3",
  Tourism: "#34d399",
  IT: "#60a5fa",
  Logistics: "#c084fc",
  Chemicals: "#fbbf24",
  "Trade & Logistics": "#22d3ee",
  Pharmaceuticals: "#e879f9",
  Semiconductors: "#f87171",
  BPO: "#818cf8",
  Fisheries: "#06b6d4",
  Garments: "#ec4899",
  Automotive: "#fb923c",
  Textiles: "#10b981",
};

function getSectorColor(name: string): string {
  return SECTOR_COLORS[name] ?? "#94a3b8";
}

/**
 * One sector row inside the GDP-composition tile.
 *
 * Previously each sector rendered its own bordered card, which put four cards
 * inside the modal-tile they already sat in, repeated "Share of GDP" four
 * times, and used a five-dot meter that appears nowhere else in the app.
 * This is the label / mono-value / h-1.5 bar pattern used for every other
 * measured value in the codebase.
 */
function SectorBar({ name, share }: { name: string; share: number }) {
  const color = getSectorColor(name);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 gap-3">
        <span className="text-muted-foreground font-sans truncate">{name}</span>
        <span className="font-mono text-foreground shrink-0">{share}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${share}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SectorDonut({
  sectors,
  economyId,
}: {
  sectors: { name: string; shareOfGDP: number }[];
  economyId: string;
}) {
  const dominant = [...sectors].sort((a, b) => b.shareOfGDP - a.shareOfGDP)[0];
  const pieData = sectors.map((s) => ({ name: s.name, value: s.shareOfGDP }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const entry = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-2.5 text-xs font-mono shadow-lg">
          <p
            style={{ color: getSectorColor(entry.name) }}
            className="font-semibold"
          >
            {entry.name}
          </p>
          <p className="text-foreground">{entry.value}% of GDP</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Sector Distribution
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* Recharts PieChart donut */}
        <div className="shrink-0" style={{ width: 110, height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationDuration={600}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={getSectorColor(entry.name)}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Center label overlay via absolute-ish trick using a separate div */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Dominant callout */}
          <div className="flex items-baseline gap-1.5 mb-1">
            <span
              className="text-xl font-bold font-mono"
              style={{ color: getSectorColor(dominant.name) }}
            >
              {dominant.shareOfGDP}%
            </span>
            <span className="text-xs font-sans text-muted-foreground">
              {dominant.name}
            </span>
          </div>
          {/* Legend rows */}
          {sectors.slice(0, 5).map((s) => (
            <div key={s.name} className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: getSectorColor(s.name) }}
              />
              <span className="text-[11px] font-sans text-foreground truncate flex-1">
                {s.name}
              </span>
              <span
                className="text-[11px] font-mono shrink-0"
                style={{ color: getSectorColor(s.name) }}
              >
                {s.shareOfGDP}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-muted">
        <span className="text-sm font-semibold font-sans text-foreground">
          {title}
        </span>
      </div>
      <div className="px-4 py-3 bg-muted/40">{children}</div>
    </div>
  );
}

function EconomyModal({
  economy,
  onClose,
  rents,
}: {
  economy: Economy;
  onClose: () => void;
  /** World Bank resource rents for this economy, when the fetch succeeded. */
  rents?: EconomyRents;
}) {
  const [activeChart, setActiveChart] = useState<
    "gdp" | "growth" | "inflation"
  >("gdp");
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

  const chartDataKey =
    activeChart === "gdp"
      ? "gdp"
      : activeChart === "growth"
        ? "growth"
        : "inflation";
  const chartName =
    activeChart === "gdp"
      ? "GDP ($T)"
      : activeChart === "growth"
        ? "Growth (%)"
        : "Inflation (%)";
  const chartColor =
    activeChart === "gdp"
      ? "hsl(200,85%,50%)"
      : activeChart === "growth"
        ? "hsl(150,55%,45%)"
        : "hsl(35,100%,50%)";

  // Prefer World Bank resource rents over the curated list: they are
  // sourced, dated and cover ~250 economies. Curated data is the fallback
  // for economies the World Bank does not report (Taiwan) and for when
  // the request fails.
  const resources = rents?.items.length
    ? rents.items.map((r) => ({
        name: r.name,
        value: r.pctOfGdp,
        unit: "% of GDP",
        color: r.color,
        icon: "",
        share: `World Bank ${r.year}`,
      }))
    : (ECONOMY_RESOURCES[economy.id] ?? FALLBACK_RESOURCES);

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
          {/* ── HEADER with flag-style background ── */}
          <div className="relative flex items-start justify-between mb-0 -mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden">
            {/* Gradient background banner */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/25 via-secondary/10 to-secondary/20 pointer-events-none" />
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />

            {/* Left: entity icon + name */}
            <div className="relative flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold font-sans text-foreground leading-tight">
                  {economy.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground border border-border/60 px-2 py-0.5 rounded-full bg-background/40">
                    {economy.entityType}
                  </span>
                  <span
                    className={`text-xs border px-2 py-0.5 rounded-full font-mono font-semibold ${ratingColor(economy.creditRating)}`}
                  >
                    {economy.creditRating}
                  </span>
                  <span className="text-xs text-muted-foreground font-sans">
                    {economy.currencyCode}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-mono ${economy.gdpGrowthRate >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {economy.gdpGrowthRate}% growth
                  </span>
                </div>
              </div>
            </div>

            {/* Right: expand + close */}
            <div className="relative flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label={
                  isExpanded ? "Collapse modal" : "Expand to full screen"
                }
                title={isExpanded ? "Collapse" : "Expand to full screen"}
              >
                <span className="text-xs font-sans font-medium">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="text-xs font-sans font-medium">Close</span>
              </button>
            </div>
          </div>

          {/* ── ALL SECTIONS ── */}
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* ════════════════════════════════════════
                SECTION: OVERVIEW
            ════════════════════════════════════════ */}
            <div className="space-y-4">
              {/* ── ECONOMIC CATEGORY ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Key Economic Metrics
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "GDP",
                      value: `$${economy.gdpTrillions.toFixed(2)}T`,
                      color: "text-secondary",
                    },
                    {
                      label: "Per Capita",
                      value: `$${economy.gdpPerCapita.toLocaleString()}`,
                      color: "text-foreground",
                    },
                    {
                      label: "Inflation",
                      value: `${economy.inflationRate}%`,
                      color:
                        economy.inflationRate > 5
                          ? "text-destructive"
                          : "text-success",
                    },
                    {
                      label: "Unemployment",
                      value: `${economy.unemploymentRate}%`,
                      color:
                        economy.unemploymentRate > 6
                          ? "text-warning"
                          : "text-success",
                    },
                    {
                      label: "Debt/GDP",
                      value: `${economy.debtToGDPRatio}%`,
                      color:
                        economy.debtToGDPRatio > 100
                          ? "text-destructive"
                          : "text-warning",
                    },
                    {
                      label: "Interest Rate",
                      value: `${economy.interestRate}%`,
                      color: "text-foreground",
                    },
                    {
                      label: "Trade Volume",
                      value: `$${economy.tradeVolumeTrillions}T`,
                      color: "text-foreground",
                    },
                    {
                      label: "FDI Inflow",
                      value: `$${economy.fdiInflowBillions}B`,
                      color: "text-secondary",
                    },
                    {
                      label: "Mkt Cap",
                      value: `$${economy.stockMarketCap}T`,
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="modal-tile rounded-lg px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <p className="text-xs text-muted-foreground font-sans truncate">
                        {s.label}
                      </p>
                      <p
                        className={`text-sm font-bold font-mono whitespace-nowrap ${s.color}`}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <SourceLink sources={SRC_IMF} showIcon={false} />

              {/* ── 5-YEAR TRENDS CHART ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    5-Year Trends
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                  <div className="flex gap-1">
                    {(["gdp", "growth", "inflation"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveChart(tab)}
                        className={`px-2 py-0.5 rounded text-xs font-sans transition-colors cursor-pointer ${activeChart === tab ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={economy.trends}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id={`ecoGrad-${economy.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={chartColor}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={chartColor}
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
                          width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey={chartDataKey}
                          name={chartName}
                          stroke={chartColor}
                          strokeWidth={2}
                          fill={`url(#ecoGrad-${economy.id})`}
                          dot={false}
                          isAnimationActive
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── GDP SECTOR COMPOSITION ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    GDP Composition by Sector
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <div className="mb-4">
                    <SectorDonut
                      sectors={economy.topSectors}
                      economyId={economy.id}
                    />
                  </div>
                  <div className="space-y-2.5 mb-3">
                    {economy.topSectors.map((s) => (
                      <SectorBar
                        key={s.name}
                        name={s.name}
                        share={s.shareOfGDP}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                        Dominant
                      </p>
                      <p className="text-xs font-bold font-sans text-foreground mt-0.5">
                        {
                          [...economy.topSectors].sort(
                            (a, b) => b.shareOfGDP - a.shareOfGDP,
                          )[0]?.name
                        }
                      </p>
                      <p
                        className="text-[10px] font-mono"
                        style={{
                          color: getSectorColor(
                            [...economy.topSectors].sort(
                              (a, b) => b.shareOfGDP - a.shareOfGDP,
                            )[0]?.name,
                          ),
                        }}
                      >
                        {
                          [...economy.topSectors].sort(
                            (a, b) => b.shareOfGDP - a.shareOfGDP,
                          )[0]?.shareOfGDP
                        }
                        % of GDP
                      </p>
                    </div>
                    <div className="text-center border-x border-border/40">
                      <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                        Sectors
                      </p>
                      <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                        {economy.topSectors.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        tracked
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                        Diversification
                      </p>
                      <p
                        className="text-xs font-bold font-sans mt-0.5"
                        style={{
                          color:
                            economy.topSectors.length >= 4
                              ? "#4ade80"
                              : "#fb923c",
                        }}
                      >
                        {economy.topSectors.length >= 4
                          ? "High"
                          : economy.topSectors.length >= 3
                            ? "Medium"
                            : "Low"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        {economy.topSectors.length >= 4
                          ? "Multi-sector"
                          : "Concentrated"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── TRADE & PARTNERS ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Trade &amp; Partners
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-sans mb-1.5">
                        Top Exports
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {economy.topExports.slice(0, 4).map((e) => (
                          <span
                            key={e}
                            className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-sans mb-1.5">
                        Top Partners
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {economy.tradingPartners.slice(0, 4).map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════
                SECTION DIVIDER: MARKETS
            ════════════════════════════════════════ */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30">
                <span className="text-[10px] font-bold font-sans text-secondary uppercase tracking-widest">
                  Markets
                </span>
              </div>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="space-y-4">
              {/* Quick KPI tiles */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Financial Markets
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Stock Market Cap",
                      value: `$${economy.stockMarketCap}T`,
                      color: "text-secondary",
                    },
                    {
                      label: "FDI Inflow",
                      value: `$${economy.fdiInflowBillions}B`,
                      color: "text-green-400",
                    },
                    {
                      label: "Trade Volume",
                      value: `$${economy.tradeVolumeTrillions}T`,
                      color: "text-blue-400",
                    },
                    {
                      label: "Interest Rate",
                      value: `${economy.interestRate}%`,
                      color:
                        economy.interestRate > 5
                          ? "text-warning"
                          : "text-success",
                    },
                    {
                      label: "Debt / GDP",
                      value: `${economy.debtToGDPRatio}%`,
                      color:
                        economy.debtToGDPRatio > 100
                          ? "text-destructive"
                          : economy.debtToGDPRatio > 60
                            ? "text-warning"
                            : "text-success",
                    },
                    {
                      label: "Credit Rating",
                      value: economy.creditRating,
                      color: ratingColor(economy.creditRating).split(" ")[0],
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="modal-tile rounded-xl p-3 flex items-center gap-3"
                    >
                      <div>
                        <p className="text-[10px] text-muted-foreground font-sans">
                          {s.label}
                        </p>
                        <p
                          className={`text-base font-bold font-mono ${s.color}`}
                        >
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inflation vs Growth trend */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Growth vs Inflation Trend
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={economy.trends}
                        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
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
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="growth"
                          name="GDP Growth %"
                          fill="hsl(142,60%,45%)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={18}
                        />
                        <Bar
                          dataKey="inflation"
                          name="Inflation %"
                          fill="hsl(35,100%,50%)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {[
                      { label: "GDP Growth", color: "hsl(142,60%,45%)" },
                      { label: "Inflation", color: "hsl(35,100%,50%)" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ background: l.color }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {l.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SourceLink sources={SRC_OECD} showIcon={false} />
            </div>

            {/* ════════════════════════════════════════
                SECTION DIVIDER: RESOURCES
            ════════════════════════════════════════ */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                <span className="text-[10px] font-bold font-sans text-amber-400 uppercase tracking-widest">
                  Resources
                </span>
              </div>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="space-y-4">
              {(() => {
                const pieData = resources.map((r) => ({
                  name: r.name,
                  value: r.value,
                }));
                const ResourceTooltip = ({ active, payload }: any) => {
                  if (active && payload?.length) {
                    const entry = payload[0];
                    const res = resources.find((r) => r.name === entry.name);
                    return (
                      <div className="bg-card border border-border rounded-lg p-2.5 text-xs font-mono shadow-lg">
                        <p
                          style={{ color: res?.color ?? "#fff" }}
                          className="font-semibold"
                        >
                          {entry.name}
                        </p>
                        <p className="text-foreground">
                          {entry.value} {res?.unit}
                        </p>
                        <p className="text-muted-foreground">{res?.share}</p>
                      </div>
                    );
                  }
                  return null;
                };
                return (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                          Natural Resources &amp; Commodities
                        </span>
                        <div className="flex-1 h-px bg-border/60" />
                        <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background/50">
                          {resources.length} tracked
                        </span>
                      </div>

                      {/* Donut + resource rows in a single tile. The separate
                          "Production & Output" bar chart listed the same five
                          resources a second time, so its data is shown here as
                          inline bars instead. */}
                      <div className="modal-tile rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="shrink-0"
                            style={{ width: 120, height: 120 }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={54}
                                  paddingAngle={2}
                                  dataKey="value"
                                  startAngle={90}
                                  endAngle={-270}
                                  isAnimationActive
                                  animationDuration={600}
                                >
                                  {pieData.map((entry) => {
                                    const res = resources.find(
                                      (r) => r.name === entry.name,
                                    );
                                    return (
                                      <Cell
                                        key={entry.name}
                                        fill={res?.color ?? "#94a3b8"}
                                        stroke="transparent"
                                      />
                                    );
                                  })}
                                </Pie>
                                <Tooltip content={<ResourceTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-bold font-mono truncate"
                              style={{ color: resources[0]?.color }}
                            >
                              {resources[0]?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-sans">
                              {resources[0]?.share}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {resources.slice(0, 5).map((r) => {
                            // Units differ between rows, so the bar shows each
                            // resource against the largest value in this set
                            // rather than implying a like-for-like comparison.
                            const peak = Math.max(
                              ...resources.slice(0, 5).map((x) => x.value),
                              1,
                            );
                            return (
                              <div key={r.name}>
                                <div className="flex justify-between text-xs mb-1 gap-3">
                                  <span className="text-muted-foreground font-sans truncate">
                                    {r.name}
                                    {r.share && (
                                      <span className="text-muted-foreground/60">
                                        {" · "}
                                        {r.share}
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono text-foreground shrink-0">
                                    {r.value}
                                    <span className="text-muted-foreground">
                                      {" "}
                                      {r.unit}
                                    </span>
                                  </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${(r.value / peak) * 100}%`,
                                      background: r.color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary strip */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="modal-tile rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                            Resources
                          </p>
                          <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                            {resources.length}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-sans">
                            tracked
                          </p>
                        </div>
                        <div className="modal-tile rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                            Top Resource
                          </p>
                          <p
                            className="text-xs font-bold font-sans mt-0.5"
                            style={{ color: resources[0]?.color }}
                          >
                            {resources[0]?.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-sans">
                            {resources[0]?.share}
                          </p>
                        </div>
                        <div className="modal-tile rounded-xl p-3 text-center">
                          <p className="text-[9px] text-muted-foreground font-sans uppercase tracking-wide">
                            Data Source
                          </p>
                          <p className="text-[10px] font-sans text-muted-foreground mt-0.5 leading-snug">
                            World Bank · IEA · BGS 2025
                          </p>
                        </div>
                      </div>

                      {/* ── Rare Earth Minerals ── */}
                      {(() => {
                        const rareEarths =
                          RARE_EARTH_MINERALS[economy.id] ??
                          DEFAULT_RARE_EARTHS;
                        const hasCount = rareEarths.filter((r) => r.has).length;
                        const surplusCount = rareEarths.filter(
                          (r) => r.surplus,
                        ).length;
                        return (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                                Rare Earth &amp; Critical Minerals
                              </span>
                              <div className="flex-1 h-px bg-border/60" />
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-success/10 mineral-pill-has border border-success/25">
                                  {hasCount} has
                                </span>
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-warning/10 mineral-pill-surplus border border-warning/25">
                                  {surplusCount} surplus
                                </span>
                              </div>
                            </div>
                            {/* Legend */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-success/20 border border-success/40 flex items-center justify-center">
                                  <span className="text-[8px] text-success">
                                    ✓
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-sans">
                                  Has reserves
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-warning/20 border border-warning/40 flex items-center justify-center">
                                  <span className="text-[8px] text-warning">
                                    ↑
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-sans">
                                  Net surplus / exporter
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-muted border border-border flex items-center justify-center">
                                  <span className="text-[8px] text-muted-foreground">
                                    –
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-sans">
                                  Scarce / imports
                                </span>
                              </div>
                            </div>
                            {/* One row per mineral, matching the row lists used
                                elsewhere in this modal rather than a grid of
                                tinted cards nested inside this tile. Status
                                colours use the success/warning tokens, which
                                are defined for both themes — the previous
                                emerald-400/amber-400 literals were fixed values
                                that washed out on the light background. */}
                            <div className="divide-y divide-border/40">
                              {rareEarths.map((m) => (
                                <div
                                  key={m.name}
                                  className="flex items-center gap-2 py-2"
                                >
                                  <span
                                    className="text-[10px] font-bold font-mono px-1 py-0.5 rounded shrink-0"
                                    style={{
                                      color: m.color,
                                      background: `${m.color}1f`,
                                    }}
                                  >
                                    {m.symbol}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold font-sans text-foreground truncate">
                                      {m.name}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground font-sans truncate">
                                      {m.use}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[9px] font-mono text-foreground">
                                      {m.reserveKt != null
                                        ? m.reserveKt >= 1000
                                          ? `${(m.reserveKt / 1000).toFixed(0)}Mt`
                                          : `${m.reserveKt}kt`
                                        : "—"}
                                    </p>
                                    <p className="text-[9px] font-mono text-muted-foreground">
                                      {m.globalShare}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${
                                      m.surplus
                                        ? "bg-warning/15 mineral-pill-surplus border-warning/35"
                                        : m.has
                                          ? "bg-success/15 mineral-pill-has border-success/35"
                                          : "bg-muted text-muted-foreground border-border"
                                    }`}
                                  >
                                    {m.surplus
                                      ? "surplus"
                                      : m.has
                                        ? "has"
                                        : "none"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <SourceLink sources={SRC_WTO} showIcon={false} />
                  </>
                );
              })()}
            </div>

            {/* ════════════════════════════════════════
                SECTION DIVIDER: MARITIME
            ════════════════════════════════════════ */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30">
                <span className="text-[10px] font-bold font-sans text-blue-400 uppercase tracking-widest">
                  Maritime
                </span>
              </div>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">
                    Maritime Trade
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="modal-tile rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-4">
                    {economy.maritime.maritimeTrade}
                  </p>

                  {/* KPI tiles */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Annual Cargo
                      </p>
                      <p className="text-base font-bold font-mono text-secondary">
                        {economy.maritime.annualCargoMT.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        metric tonnes
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        TEU
                      </p>
                      <p className="text-base font-bold font-mono text-foreground">
                        {(economy.maritime.containersTEU / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[9px] text-muted-foreground font-sans">
                        containers
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-sans mb-0.5">
                        Navy
                      </p>
                      <p className="text-xs font-mono text-foreground leading-tight mt-0.5">
                        {economy.maritime.navyStrength.split("—")[0].trim()}
                      </p>
                    </div>
                  </div>

                  {/* Ports */}
                  <div className="mb-3">
                    <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
                      Major Ports
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {economy.maritime.majorPorts.map((port) => (
                        <span
                          key={port}
                          className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-sans"
                        >
                          {port}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Shipping lanes */}
                  <div>
                    <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
                      Shipping Lanes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {economy.maritime.shippingLanes.map((lane) => (
                        <span
                          key={lane}
                          className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-sans"
                        >
                          {lane}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <SourceLink sources={SRC_MARITIME} showIcon={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewMode = "economies" | "resources";

const RESOURCES_DATA = [
  {
    name: "Crude Oil",
    unit: "$/bbl",
    price: 83.2,
    change: +1.8,
    holder: "Saudi Arabia",
    reserve: "17% of global",
    color: "#f97316",
    icon: "🛢️",
  },
  {
    name: "Natural Gas",
    unit: "$/MMBtu",
    price: 2.84,
    change: -0.3,
    holder: "Russia",
    reserve: "24% of global",
    color: "#6366f1",
    icon: "🔥",
  },
  {
    name: "Gold",
    unit: "$/troy oz",
    price: 2341,
    change: +0.6,
    holder: "USA",
    reserve: "8,133 tons",
    color: "#f59e0b",
    icon: "🥇",
  },
  {
    name: "Coal",
    unit: "$/ton",
    price: 128,
    change: -2.1,
    holder: "China",
    reserve: "21% of global",
    color: "#6b7280",
    icon: "⛏️",
  },
  {
    name: "Iron Ore",
    unit: "$/ton",
    price: 114,
    change: +0.4,
    holder: "Australia",
    reserve: "28% of global",
    color: "#b45309",
    icon: "⚙️",
  },
  {
    name: "Copper",
    unit: "$/ton",
    price: 9280,
    change: +1.2,
    holder: "Chile",
    reserve: "23% of global",
    color: "#dc2626",
    icon: "🔩",
  },
  {
    name: "Lithium",
    unit: "$/ton",
    price: 15400,
    change: +3.4,
    holder: "Chile",
    reserve: "36% of global",
    color: "#7c3aed",
    icon: "🔋",
  },
  {
    name: "Wheat",
    unit: "$/bushel",
    price: 5.62,
    change: -0.8,
    holder: "Russia",
    reserve: "17% exports",
    color: "#ca8a04",
    icon: "🌾",
  },
  {
    name: "Rare Earth",
    unit: "$/kg avg",
    price: 42,
    change: +2.1,
    holder: "China",
    reserve: "38% of global",
    color: "#059669",
    icon: "🧲",
  },
  {
    name: "Uranium",
    unit: "$/lb",
    price: 91.5,
    change: +4.2,
    holder: "Kazakhstan",
    reserve: "29% of global",
    color: "#84cc16",
    icon: "☢️",
  },
  {
    name: "Aluminum",
    unit: "$/ton",
    price: 2410,
    change: +0.9,
    holder: "China",
    reserve: "N/A (produced)",
    color: "#94a3b8",
    icon: "🏗️",
  },
  {
    name: "Silver",
    unit: "$/troy oz",
    price: 29.4,
    change: +1.1,
    holder: "Mexico",
    reserve: "23% of global",
    color: "#cbd5e1",
    icon: "🥈",
  },
];

export function EconomiesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdpTrillions" | "gdpGrowthRate" | "inflationRate" | "stockMarketCap"
  >("gdpTrillions");
  const [selectedEconomy, setSelectedEconomy] = useState<Economy | null>(null);
  const [modalEconomy, setModalEconomy] = useState<Economy | null>(null);
  const { rents: resourceRents } = useResourceRents();
  const [viewMode, setViewMode] = useState<ViewMode>("economies");

  // Deep-link: open entity from search bar via ?open=<id>
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId) {
      const found = economiesData.find((e) => e.id === openId);
      if (found) setModalEconomy(found);
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const filtered = economiesData
    .filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || e.entityType === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const globalGDP = economiesData.reduce(
    (sum, e) => sum + (e.entityType === "Country" ? e.gdpTrillions : 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Global Economies
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              GDP, growth, trade, inflation, credit ratings, and sector
              breakdowns
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Global GDP",
              value: "$118.4T",
              // World Bank world aggregate for 2025, the latest completed year
              // the source publishes. Was $104.5T labelled "estimated 2024".
              sub: "World Bank · 2025",
              color: "text-secondary",
            },
            {
              label: "Fastest Growing",
              value: "India +6.3%",
              sub: "tracked nations",
              color: "text-success",
            },
            {
              label: "Largest Market",
              value: "USA $27.4T",
              sub: "by nominal GDP",
              color: "text-warning",
            },
            {
              label: "Avg Inflation",
              value: "4.2%",
              sub: "tracked economies",
              color: "text-destructive",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        <CurrencyConverter />

        <SourceLink sources={SRC_IMF} className="mb-4 -mt-2" />

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
              placeholder="Search economies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: View tabs + filters + sort */}
          <CollapsibleFilters>
            {(
              [
                {
                  id: "economies",
                  label: "Economies",
                  icon: <CurrencyDollar size={13} weight="fill" />,
                },
                {
                  id: "resources",
                  label: "Resources",
                  icon: <Tree size={13} weight="fill" />,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  viewMode === tab.id
                    ? "bg-secondary/20 border-secondary/40 text-secondary"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            {(["All", "Country", "Bloc"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  typeFilter === t
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {t}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdpTrillions">Sort: GDP</option>
              <option value="gdpGrowthRate">Sort: GDP Growth</option>
              <option value="inflationRate">Sort: Inflation</option>
              <option value="stockMarketCap">Sort: Mkt Cap</option>
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
              {getUpcoming("economies").map((e) => (
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

        {modalEconomy && (
          <EconomyModal
            economy={modalEconomy}
            rents={resourceRents[modalEconomy.id]}
            onClose={() => setModalEconomy(null)}
          />
        )}

        {/* ── Resources View ── */}
        {viewMode === "resources" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold font-sans text-foreground">
                  Global Resource Markets
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Commodity prices, reserves & top holders · Aug 2026
                </p>
              </div>
              <span className="text-[10px] font-mono bg-muted border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                {RESOURCES_DATA.length} commodities tracked
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {RESOURCES_DATA.map((r) => (
                <div
                  key={r.name}
                  className="bg-card border border-border rounded-xl p-4 hover:border-secondary/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold font-sans text-foreground">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {r.unit}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${r.change >= 0 ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
                    >
                      {r.change >= 0 ? "+" : ""}
                      {r.change}%
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold font-mono mb-1"
                    style={{ color: r.color }}
                  >
                    {r.price.toLocaleString()}
                  </p>
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-sans">
                        Top Holder
                      </span>
                      <span className="text-[10px] font-semibold font-sans text-foreground">
                        {r.holder}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-sans">
                        Reserve
                      </span>
                      <span className="text-[10px] font-mono text-foreground">
                        {r.reserve}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.abs(r.change) * 15 + 30)}%`,
                        background: r.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* ── Rare Earth Minerals Global Overview ── */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold font-sans text-foreground">
                    Rare Earth &amp; Critical Minerals — Global Overview
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans">
                    Which economies have reserves vs. surplus · USGS / BGS 2025
                  </p>
                </div>
              </div>
              {/* Economy comparison table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold min-w-[110px]">
                          Mineral
                        </th>
                        {[
                          "China",
                          "USA",
                          "Australia",
                          "Brazil",
                          "Chile",
                          "Russia",
                          "India",
                          "Indonesia",
                        ].map((eco) => (
                          <th
                            key={eco}
                            className="text-center px-3 py-2.5 text-muted-foreground font-semibold whitespace-nowrap min-w-[80px]"
                          >
                            {eco}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "Neodymium",
                        "Lithium",
                        "Cobalt",
                        "Dysprosium",
                        "Lanthanum",
                        "Cerium",
                      ].map((mineralName, idx) => {
                        const econKeys = [
                          "china-eco",
                          "usa-eco",
                          "australia-eco",
                          "brazil-eco",
                          "chile-eco",
                          "russia-eco",
                          "india-eco",
                          "indonesia-eco",
                        ];
                        return (
                          <tr
                            key={mineralName}
                            className={`border-b border-border/40 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                          >
                            <td className="px-4 py-2.5 font-semibold text-foreground">
                              {mineralName}
                            </td>
                            {econKeys.map((ecoId) => {
                              const minerals =
                                RARE_EARTH_MINERALS[ecoId] ??
                                DEFAULT_RARE_EARTHS;
                              const m = minerals.find(
                                (x) => x.name === mineralName,
                              );
                              return (
                                <td
                                  key={ecoId}
                                  className="px-3 py-2.5 text-center"
                                >
                                  {m === undefined ? (
                                    <span
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-muted-foreground/50"
                                      title={`${mineralName} is not among the minerals tracked for this economy`}
                                    >
                                      ·
                                    </span>
                                  ) : m.surplus ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-warning/15 mineral-pill-surplus border border-warning/25">
                                      ↑ surplus
                                    </span>
                                  ) : m.has ? (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success/15 mineral-pill-has border border-success/25">
                                      ✓ has
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                      — none
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-warning/15 mineral-pill-surplus border border-warning/25 text-[9px] font-mono">
                      ↑ surplus
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      Net exporter / strategic surplus
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-success/15 mineral-pill-has border border-success/25 text-[9px] font-mono">
                      ✓ has
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      Known reserves, not surplus
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[9px] font-mono">
                      — none
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      Scarce / must import
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-muted-foreground/50 text-[9px] font-mono">
                      ·
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      Not tracked for that economy
                    </span>
                  </div>
                </div>
              </div>
              {/* Strategic context callout */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    flag: "🇨🇳",
                    title: "China dominates",
                    body: "Controls ~60% of global rare earth mining and ~85% of processing capacity. Key leverage in tech supply chains.",
                    color: "border-red-500/30 bg-red-500/8",
                  },
                  {
                    flag: "🇧🇷",
                    title: "Brazil — rising force",
                    body: "Holds ~92% of global Niobium reserves and growing Lithium deposits. Positioned as a critical counterweight.",
                    color: "border-green-500/30 bg-green-500/8",
                  },
                  {
                    flag: "🇮🇳",
                    title: "India — Thorium giant",
                    body: "World's largest Thorium reserves (~25%). Pursuing rare earth self-sufficiency under PM Gati Shakti.",
                    color: "border-orange-500/30 bg-orange-500/8",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className={`rounded-xl border p-4 ${c.color}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{c.flag}</span>
                      <span className="text-xs font-bold font-sans text-foreground">
                        {c.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <SourceLink sources={SRC_WTO} className="mt-2" />
          </div>
        )}

        {/* ── Economies View (default) ── */}
        {viewMode === "economies" && (
          <div className="min-w-0">
            {/* Economy Cards */}
            <div className="space-y-4 min-w-0">
              {filtered.map((economy) => (
                <div
                  key={economy.id}
                  className="flex gap-3 items-stretch min-w-0 overflow-hidden"
                >
                  {/* ── Main card ── */}
                  <article
                    onClick={() => setModalEconomy(economy)}
                    className="modal-tile rounded-xl p-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 flex-1 min-w-0"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-sm font-semibold font-sans text-foreground leading-tight">
                            {economy.name}
                          </h3>
                          <span
                            className={`text-[10px] border px-1.5 py-px rounded-full font-mono font-semibold ${ratingColor(economy.creditRating)}`}
                          >
                            {economy.creditRating}
                          </span>
                          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-px rounded-full font-sans">
                            {economy.entityType}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-sans leading-tight">
                          {getCurrencyDisplay(
                            economy.currencyCode,
                            economy.currencyName,
                          )}{" "}
                          · Interest Rate: {economy.interestRate}%
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold font-mono text-secondary leading-tight">
                          ${economy.gdpTrillions.toFixed(2)}T
                        </p>
                        <p
                          className={`text-[10px] font-mono flex items-center gap-0.5 justify-end ${economy.gdpGrowthRate >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {economy.gdpGrowthRate >= 0 ? (
                            <TrendUp size={10} weight="bold" />
                          ) : (
                            <TrendDown size={10} weight="bold" />
                          )}
                          {economy.gdpGrowthRate >= 0 ? "+" : ""}
                          {economy.gdpGrowthRate}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-2 gap-y-0.5 mb-1.5">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-sans">
                          GDP/Capita
                        </p>
                        <p className="text-xs font-bold font-mono text-foreground leading-tight">
                          ${economy.gdpPerCapita.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-sans">
                          Inflation
                        </p>
                        <p
                          className={`text-xs font-bold font-mono leading-tight ${economy.inflationRate > 6 ? "text-destructive" : economy.inflationRate > 3 ? "text-warning" : "text-success"}`}
                        >
                          {economy.inflationRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-sans">
                          Unemployment
                        </p>
                        <p className="text-xs font-bold font-mono text-foreground leading-tight">
                          {economy.unemploymentRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-sans">
                          Debt/GDP
                        </p>
                        <p
                          className={`text-xs font-bold font-mono leading-tight ${economy.debtToGDPRatio > 120 ? "text-destructive" : economy.debtToGDPRatio > 80 ? "text-warning" : "text-success"}`}
                        >
                          {economy.debtToGDPRatio}%
                        </p>
                      </div>
                    </div>

                    {/* GDP share bar */}
                    <div className="mb-1">
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-muted-foreground font-sans">
                          Share of Global GDP
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {((economy.gdpTrillions / 104.5) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (economy.gdpTrillions / 104.5) * 100 * 4)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* ── Inline country economic stats (for Country-type economies) ── */}
                    {economy.entityType === "Country" &&
                      (() => {
                        const country = countriesData.find(
                          (c) => c.name === economy.name || c.id === economy.id,
                        );
                        if (!country) return null;
                        const stats = [
                          {
                            label: "GDP Per Capita",
                            value: `$${country.gdpPerCapita.toLocaleString()}`,
                            color: "text-foreground",
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
                            label: "Unemployment",
                            value: `${country.unemploymentRate}%`,
                            color:
                              country.unemploymentRate <= 5
                                ? "text-success"
                                : country.unemploymentRate <= 10
                                  ? "text-warning"
                                  : "text-destructive",
                          },
                          {
                            label: "Inflation",
                            value: `${country.inflationRate}%`,
                            color:
                              country.inflationRate <= 3
                                ? "text-success"
                                : country.inflationRate <= 8
                                  ? "text-warning"
                                  : "text-destructive",
                          },
                          {
                            label: "Trade Balance",
                            value: `${country.tradeBalance >= 0 ? "+" : ""}$${country.tradeBalance}B`,
                            color:
                              country.tradeBalance >= 0
                                ? "text-success"
                                : "text-destructive",
                          },
                        ];
                        return (
                          <div className="mt-2 pt-2 border-t border-border/40">
                            <p className="text-[9px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">
                              Country Economic Stats
                            </p>
                            <div className="grid grid-cols-5 gap-1">
                              {stats.map((s) => (
                                <div
                                  key={s.label}
                                  className="rounded-md bg-background/50 border border-border/40 px-1.5 py-1 text-center"
                                >
                                  <p className="text-[8px] text-muted-foreground font-sans leading-tight mb-0.5">
                                    {s.label}
                                  </p>
                                  <p
                                    className={`text-[10px] font-bold font-mono leading-tight ${s.color}`}
                                  >
                                    {s.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                    {/* Top sectors pills */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {economy.topExports.slice(0, 3).map((exp) => (
                        <span
                          key={exp}
                          className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-1.5 py-px rounded-full font-sans"
                        >
                          {exp}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-px rounded-full font-sans">
                        +{economy.topExports.length - 3} more
                      </span>
                    </div>
                  </article>

                  {/* ── GDP chart box ── */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:flex w-28 md:w-36 h-28 md:h-36 shrink-0 bg-card border border-border rounded-xl p-2 flex-col justify-between"
                  >
                    {(() => {
                      const gdpVals = economy.trends.map((t) => t.gdp);
                      const minGdp = Math.min(...gdpVals);
                      const maxGdp = Math.max(...gdpVals);
                      const pad = (maxGdp - minGdp) * 0.12 || maxGdp * 0.05;
                      const domainMin = Math.max(0, minGdp - pad);
                      const domainMax = maxGdp + pad;
                      const loPoint = economy.trends.find(
                        (t) => t.gdp === minGdp,
                      );
                      const hiPoint = economy.trends.find(
                        (t) => t.gdp === maxGdp,
                      );
                      return (
                        <>
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-secondary leading-none">
                              GDP $T
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono text-emerald-400 leading-none">
                                ▲{maxGdp.toFixed(2)}
                              </span>
                              <span className="text-[8px] font-mono text-rose-400 leading-none">
                                ▼{minGdp.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={economy.trends}
                                margin={{
                                  top: 4,
                                  right: 2,
                                  left: -28,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id={`cardGdpGrad-${economy.id}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="hsl(200,85%,50%)"
                                      stopOpacity={0.4}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="hsl(200,85%,50%)"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="rgba(255,255,255,0.05)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="year"
                                  tick={{
                                    fill: "hsl(0,0%,50%)",
                                    fontSize: 8,
                                    fontFamily: "IBM Plex Mono",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                  interval={1}
                                />
                                <YAxis
                                  domain={[domainMin, domainMax]}
                                  tick={{
                                    fill: "hsl(0,0%,50%)",
                                    fontSize: 8,
                                    fontFamily: "IBM Plex Mono",
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v) =>
                                    `${v % 1 === 0 ? v : v.toFixed(1)}`
                                  }
                                  tickCount={4}
                                  width={28}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: "hsl(222,30%,14%)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8,
                                    fontSize: 10,
                                    fontFamily: "IBM Plex Mono",
                                  }}
                                  formatter={(v: number) => [`$${v}T`, "GDP"]}
                                  labelStyle={{ color: "hsl(0,0%,55%)" }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="gdp"
                                  name="GDP"
                                  stroke="hsl(200,85%,50%)"
                                  fill={`url(#cardGdpGrad-${economy.id})`}
                                  strokeWidth={1.5}
                                  dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.gdp === maxGdp) {
                                      return (
                                        <circle
                                          key={`hi-${economy.id}-${cx}`}
                                          cx={cx}
                                          cy={cy}
                                          r={3}
                                          fill="#4ade80"
                                          stroke="hsl(222,30%,14%)"
                                          strokeWidth={1}
                                        />
                                      );
                                    }
                                    if (payload.gdp === minGdp) {
                                      return (
                                        <circle
                                          key={`lo-${economy.id}-${cx}`}
                                          cx={cx}
                                          cy={cy}
                                          r={3}
                                          fill="#f87171"
                                          stroke="hsl(222,30%,14%)"
                                          strokeWidth={1}
                                        />
                                      );
                                    }
                                    return (
                                      <circle
                                        key={`dot-${economy.id}-${cx}`}
                                        cx={cx}
                                        cy={cy}
                                        r={0}
                                        fill="transparent"
                                      />
                                    );
                                  }}
                                  isAnimationActive
                                  animationDuration={600}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          {/* growth badge */}
                          <div className="mt-1 flex items-center justify-between gap-1 min-w-0">
                            <span className="text-[8px] text-muted-foreground font-mono truncate">
                              {economy.trends[0]?.year}–
                              {economy.trends[economy.trends.length - 1]?.year}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold shrink-0 ${economy.gdpGrowthRate >= 0 ? "text-success" : "text-destructive"}`}
                            >
                              {economy.gdpGrowthRate >= 0 ? "+" : ""}
                              {economy.gdpGrowthRate}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
