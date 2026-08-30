import React, { useState, useMemo, useEffect } from "react";
import {
  Leaf,
  Heart,
  Wrench,
  BookOpen,
  TrendUp,
  ShieldCheck,
  Desktop,
  Users,
  Buildings,
  Globe,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react";
import { usStatesData } from "../data/statesData";

// ── Types ───────────────────────────────────────────────────────────────────

type PolicyCategory =
  | "Climate"
  | "Healthcare"
  | "Infrastructure"
  | "Education"
  | "Economy"
  | "Defense"
  | "Technology"
  | "Social";

type Trend = "up" | "down" | "stable";

interface PolicyCard {
  id: string;
  entityId: string;
  entityName: string;
  entityType: "state" | "country";
  category: PolicyCategory;
  policyName: string;
  description: string;
  allocated: string;
  gdpPct: string;
  score: number;
  trend: Trend;
}

// ── Inline mini country dataset (avoids bundler parsing countriesData.ts) ──

interface MiniCountry {
  id: string;
  name: string;
  code: string;
  continent: string;
  population: number;
  gdp: number;
}

const MINI_COUNTRIES: MiniCountry[] = [
  // ── G20 + Major Economies ─────────────────────────────────────────────────
  {
    id: "us",
    name: "United States",
    code: "us",
    continent: "North America",
    population: 340110988,
    gdp: 30340,
  },
  {
    id: "cn",
    name: "China",
    code: "cn",
    continent: "Asia",
    population: 1419000000,
    gdp: 20410,
  },
  {
    id: "de",
    name: "Germany",
    code: "de",
    continent: "Europe",
    population: 84500000,
    gdp: 4650,
  },
  {
    id: "jp",
    name: "Japan",
    code: "jp",
    continent: "Asia",
    population: 123900000,
    gdp: 4500,
  },
  {
    id: "in",
    name: "India",
    code: "in",
    continent: "Asia",
    population: 1463000000,
    gdp: 4560,
  },
  {
    id: "gb",
    name: "United Kingdom",
    code: "gb",
    continent: "Europe",
    population: 68000000,
    gdp: 3350,
  },
  {
    id: "fr",
    name: "France",
    code: "fr",
    continent: "Europe",
    population: 68400000,
    gdp: 3180,
  },
  {
    id: "br",
    name: "Brazil",
    code: "br",
    continent: "South America",
    population: 218000000,
    gdp: 2450,
  },
  {
    id: "it",
    name: "Italy",
    code: "it",
    continent: "Europe",
    population: 59400000,
    gdp: 2280,
  },
  {
    id: "ca_c",
    name: "Canada",
    code: "ca",
    continent: "North America",
    population: 39500000,
    gdp: 2320,
  },
  {
    id: "kr",
    name: "South Korea",
    code: "kr",
    continent: "Asia",
    population: 51800000,
    gdp: 1860,
  },
  {
    id: "au",
    name: "Australia",
    code: "au",
    continent: "Oceania",
    population: 26600000,
    gdp: 1830,
  },
  {
    id: "es",
    name: "Spain",
    code: "es",
    continent: "Europe",
    population: 48000000,
    gdp: 1790,
  },
  {
    id: "mx_c",
    name: "Mexico",
    code: "mx",
    continent: "North America",
    population: 129000000,
    gdp: 1440,
  },
  {
    id: "id_c",
    name: "Indonesia",
    code: "id",
    continent: "Asia",
    population: 277534122,
    gdp: 1540,
  },
  {
    id: "sa",
    name: "Saudi Arabia",
    code: "sa",
    continent: "Asia",
    population: 36500000,
    gdp: 1170,
  },
  {
    id: "nl",
    name: "Netherlands",
    code: "nl",
    continent: "Europe",
    population: 17900000,
    gdp: 1170,
  },
  {
    id: "tr",
    name: "Turkey",
    code: "tr",
    continent: "Europe",
    population: 85000000,
    gdp: 1180,
  },
  {
    id: "ch",
    name: "Switzerland",
    code: "ch",
    continent: "Europe",
    population: 8800000,
    gdp: 870,
  },
  {
    id: "pl",
    name: "Poland",
    code: "pl",
    continent: "Europe",
    population: 38100000,
    gdp: 810,
  },
  {
    id: "se",
    name: "Sweden",
    code: "se",
    continent: "Europe",
    population: 10600000,
    gdp: 600,
  },
  {
    id: "no",
    name: "Norway",
    code: "no",
    continent: "Europe",
    population: 5500000,
    gdp: 550,
  },
  {
    id: "th",
    name: "Thailand",
    code: "th",
    continent: "Asia",
    population: 71800000,
    gdp: 540,
  },
  {
    id: "be",
    name: "Belgium",
    code: "be",
    continent: "Europe",
    population: 11700000,
    gdp: 630,
  },
  {
    id: "ar_c",
    name: "Argentina",
    code: "ar",
    continent: "South America",
    population: 46100000,
    gdp: 640,
  },
  {
    id: "sg",
    name: "Singapore",
    code: "sg",
    continent: "Asia",
    population: 6030000,
    gdp: 500,
  },
  {
    id: "za",
    name: "South Africa",
    code: "za",
    continent: "Africa",
    population: 61500000,
    gdp: 380,
  },
  {
    id: "ng",
    name: "Nigeria",
    code: "ng",
    continent: "Africa",
    population: 226000000,
    gdp: 370,
  },
  {
    id: "eg",
    name: "Egypt",
    code: "eg",
    continent: "Africa",
    population: 108000000,
    gdp: 390,
  },
  {
    id: "nz",
    name: "New Zealand",
    code: "nz",
    continent: "Oceania",
    population: 5200000,
    gdp: 250,
  },
  {
    id: "ru",
    name: "Russia",
    code: "ru",
    continent: "Europe",
    population: 144000000,
    gdp: 2070,
  },
  {
    id: "ae",
    name: "United Arab Emirates",
    code: "ae",
    continent: "Asia",
    population: 9900000,
    gdp: 520,
  },
  {
    id: "il",
    name: "Israel",
    code: "il",
    continent: "Asia",
    population: 9800000,
    gdp: 520,
  },
  {
    id: "at",
    name: "Austria",
    code: "at",
    continent: "Europe",
    population: 9200000,
    gdp: 480,
  },
  {
    id: "dk",
    name: "Denmark",
    code: "dk",
    continent: "Europe",
    population: 6000000,
    gdp: 420,
  },
  {
    id: "fi_c",
    name: "Finland",
    code: "fi",
    continent: "Europe",
    population: 5600000,
    gdp: 300,
  },
  {
    id: "gr",
    name: "Greece",
    code: "gr",
    continent: "Europe",
    population: 10700000,
    gdp: 240,
  },
  {
    id: "pt",
    name: "Portugal",
    code: "pt",
    continent: "Europe",
    population: 10400000,
    gdp: 310,
  },
  {
    id: "cz",
    name: "Czechia",
    code: "cz",
    continent: "Europe",
    population: 10900000,
    gdp: 330,
  },
  {
    id: "ro",
    name: "Romania",
    code: "ro",
    continent: "Europe",
    population: 19100000,
    gdp: 350,
  },
  {
    id: "hu",
    name: "Hungary",
    code: "hu",
    continent: "Europe",
    population: 9700000,
    gdp: 220,
  },
  {
    id: "ua",
    name: "Ukraine",
    code: "ua",
    continent: "Europe",
    population: 43500000,
    gdp: 180,
  },
  {
    id: "sk",
    name: "Slovakia",
    code: "sk",
    continent: "Europe",
    population: 5500000,
    gdp: 130,
  },
  {
    id: "bg",
    name: "Bulgaria",
    code: "bg",
    continent: "Europe",
    population: 6500000,
    gdp: 110,
  },
  {
    id: "hr",
    name: "Croatia",
    code: "hr",
    continent: "Europe",
    population: 3900000,
    gdp: 80,
  },
  {
    id: "rs",
    name: "Serbia",
    code: "rs",
    continent: "Europe",
    population: 6900000,
    gdp: 70,
  },
  {
    id: "ie",
    name: "Ireland",
    code: "ie",
    continent: "Europe",
    population: 5400000,
    gdp: 590,
  },
  {
    id: "tw",
    name: "Taiwan",
    code: "tw",
    continent: "Asia",
    population: 23600000,
    gdp: 760,
  },
  {
    id: "hk",
    name: "Hong Kong",
    code: "hk",
    continent: "Asia",
    population: 7500000,
    gdp: 370,
  },
  {
    id: "ir",
    name: "Iran",
    code: "ir",
    continent: "Asia",
    population: 87300000,
    gdp: 400,
  },
  {
    id: "iq",
    name: "Iraq",
    code: "iq",
    continent: "Asia",
    population: 43700000,
    gdp: 280,
  },
  {
    id: "my",
    name: "Malaysia",
    code: "my",
    continent: "Asia",
    population: 33200000,
    gdp: 440,
  },
  {
    id: "vn",
    name: "Vietnam",
    code: "vn",
    continent: "Asia",
    population: 98600000,
    gdp: 430,
  },
  {
    id: "ph",
    name: "Philippines",
    code: "ph",
    continent: "Asia",
    population: 117300000,
    gdp: 440,
  },
  {
    id: "bd",
    name: "Bangladesh",
    code: "bd",
    continent: "Asia",
    population: 172000000,
    gdp: 460,
  },
  {
    id: "pk",
    name: "Pakistan",
    code: "pk",
    continent: "Asia",
    population: 230000000,
    gdp: 340,
  },
  {
    id: "lk",
    name: "Sri Lanka",
    code: "lk",
    continent: "Asia",
    population: 22200000,
    gdp: 80,
  },
  {
    id: "np",
    name: "Nepal",
    code: "np",
    continent: "Asia",
    population: 30000000,
    gdp: 40,
  },
  {
    id: "mm",
    name: "Myanmar",
    code: "mm",
    continent: "Asia",
    population: 54400000,
    gdp: 70,
  },
  {
    id: "kh",
    name: "Cambodia",
    code: "kh",
    continent: "Asia",
    population: 17100000,
    gdp: 30,
  },
  {
    id: "uz",
    name: "Uzbekistan",
    code: "uz",
    continent: "Asia",
    population: 35300000,
    gdp: 100,
  },
  {
    id: "kz",
    name: "Kazakhstan",
    code: "kz",
    continent: "Asia",
    population: 19400000,
    gdp: 260,
  },
  {
    id: "kw",
    name: "Kuwait",
    code: "kw",
    continent: "Asia",
    population: 4500000,
    gdp: 160,
  },
  {
    id: "qa",
    name: "Qatar",
    code: "qa",
    continent: "Asia",
    population: 2800000,
    gdp: 220,
  },
  {
    id: "et",
    name: "Ethiopia",
    code: "et",
    continent: "Africa",
    population: 125000000,
    gdp: 170,
  },
  {
    id: "ke",
    name: "Kenya",
    code: "ke",
    continent: "Africa",
    population: 55000000,
    gdp: 120,
  },
  {
    id: "gh",
    name: "Ghana",
    code: "gh",
    continent: "Africa",
    population: 33000000,
    gdp: 80,
  },
  {
    id: "tz",
    name: "Tanzania",
    code: "tz",
    continent: "Africa",
    population: 64000000,
    gdp: 80,
  },
  {
    id: "ao",
    name: "Angola",
    code: "ao",
    continent: "Africa",
    population: 36000000,
    gdp: 100,
  },
  {
    id: "ma",
    name: "Morocco",
    code: "ma",
    continent: "Africa",
    population: 37700000,
    gdp: 140,
  },
  {
    id: "mz",
    name: "Mozambique",
    code: "mz",
    continent: "Africa",
    population: 33900000,
    gdp: 20,
  },
  {
    id: "co",
    name: "Colombia",
    code: "co",
    continent: "South America",
    population: 52200000,
    gdp: 360,
  },
  {
    id: "cl",
    name: "Chile",
    code: "cl",
    continent: "South America",
    population: 19300000,
    gdp: 350,
  },
  {
    id: "pe",
    name: "Peru",
    code: "pe",
    continent: "South America",
    population: 33400000,
    gdp: 270,
  },
  {
    id: "ve",
    name: "Venezuela",
    code: "ve",
    continent: "South America",
    population: 28300000,
    gdp: 100,
  },
  {
    id: "ec",
    name: "Ecuador",
    code: "ec",
    continent: "South America",
    population: 18000000,
    gdp: 120,
  },
  // ── Additional Africa ─────────────────────────────────────────────────────
  {
    id: "dz",
    name: "Algeria",
    code: "dz",
    continent: "Africa",
    population: 45000000,
    gdp: 250,
  },
  {
    id: "sd",
    name: "Sudan",
    code: "sd",
    continent: "Africa",
    population: 46000000,
    gdp: 40,
  },
  {
    id: "ug",
    name: "Uganda",
    code: "ug",
    continent: "Africa",
    population: 48000000,
    gdp: 50,
  },
  {
    id: "ci",
    name: "Ivory Coast",
    code: "ci",
    continent: "Africa",
    population: 27000000,
    gdp: 80,
  },
  {
    id: "cm",
    name: "Cameroon",
    code: "cm",
    continent: "Africa",
    population: 28000000,
    gdp: 50,
  },
  {
    id: "zm",
    name: "Zambia",
    code: "zm",
    continent: "Africa",
    population: 20000000,
    gdp: 28,
  },
  {
    id: "zw",
    name: "Zimbabwe",
    code: "zw",
    continent: "Africa",
    population: 16000000,
    gdp: 24,
  },
  {
    id: "sn",
    name: "Senegal",
    code: "sn",
    continent: "Africa",
    population: 17000000,
    gdp: 32,
  },
  {
    id: "tn",
    name: "Tunisia",
    code: "tn",
    continent: "Africa",
    population: 12000000,
    gdp: 48,
  },
  {
    id: "cd",
    name: "DR Congo",
    code: "cd",
    continent: "Africa",
    population: 100000000,
    gdp: 60,
  },
  {
    id: "rw",
    name: "Rwanda",
    code: "rw",
    continent: "Africa",
    population: 14000000,
    gdp: 14,
  },
  {
    id: "ml",
    name: "Mali",
    code: "ml",
    continent: "Africa",
    population: 22000000,
    gdp: 20,
  },
  {
    id: "bf",
    name: "Burkina Faso",
    code: "bf",
    continent: "Africa",
    population: 22000000,
    gdp: 19,
  },
  {
    id: "ne",
    name: "Niger",
    code: "ne",
    continent: "Africa",
    population: 26000000,
    gdp: 15,
  },
  {
    id: "mg",
    name: "Madagascar",
    code: "mg",
    continent: "Africa",
    population: 28000000,
    gdp: 14,
  },
  {
    id: "na",
    name: "Namibia",
    code: "na",
    continent: "Africa",
    population: 2700000,
    gdp: 13,
  },
  {
    id: "bw",
    name: "Botswana",
    code: "bw",
    continent: "Africa",
    population: 2600000,
    gdp: 20,
  },
  {
    id: "mw",
    name: "Malawi",
    code: "mw",
    continent: "Africa",
    population: 21000000,
    gdp: 12,
  },
  {
    id: "so",
    name: "Somalia",
    code: "so",
    continent: "Africa",
    population: 17000000,
    gdp: 7,
  },
  {
    id: "er",
    name: "Eritrea",
    code: "er",
    continent: "Africa",
    population: 3600000,
    gdp: 2,
  },
  // ── Additional Asia ───────────────────────────────────────────────────────
  {
    id: "af",
    name: "Afghanistan",
    code: "af",
    continent: "Asia",
    population: 41000000,
    gdp: 14,
  },
  {
    id: "om",
    name: "Oman",
    code: "om",
    continent: "Asia",
    population: 4700000,
    gdp: 110,
  },
  {
    id: "jo",
    name: "Jordan",
    code: "jo",
    continent: "Asia",
    population: 10300000,
    gdp: 52,
  },
  {
    id: "lb",
    name: "Lebanon",
    code: "lb",
    continent: "Asia",
    population: 5500000,
    gdp: 18,
  },
  {
    id: "sy",
    name: "Syria",
    code: "sy",
    continent: "Asia",
    population: 21000000,
    gdp: 11,
  },
  {
    id: "ye",
    name: "Yemen",
    code: "ye",
    continent: "Asia",
    population: 34000000,
    gdp: 22,
  },
  {
    id: "az",
    name: "Azerbaijan",
    code: "az",
    continent: "Asia",
    population: 10300000,
    gdp: 78,
  },
  {
    id: "ge_c",
    name: "Georgia",
    code: "ge",
    continent: "Asia",
    population: 3800000,
    gdp: 30,
  },
  {
    id: "am",
    name: "Armenia",
    code: "am",
    continent: "Asia",
    population: 3000000,
    gdp: 24,
  },
  {
    id: "tm",
    name: "Turkmenistan",
    code: "tm",
    continent: "Asia",
    population: 6200000,
    gdp: 55,
  },
  {
    id: "tj",
    name: "Tajikistan",
    code: "tj",
    continent: "Asia",
    population: 10000000,
    gdp: 11,
  },
  {
    id: "kg",
    name: "Kyrgyzstan",
    code: "kg",
    continent: "Asia",
    population: 7000000,
    gdp: 11,
  },
  {
    id: "mn",
    name: "Mongolia",
    code: "mn",
    continent: "Asia",
    population: 3400000,
    gdp: 20,
  },
  {
    id: "la",
    name: "Laos",
    code: "la",
    continent: "Asia",
    population: 7400000,
    gdp: 15,
  },
  {
    id: "bn",
    name: "Brunei",
    code: "bn",
    continent: "Asia",
    population: 450000,
    gdp: 15,
  },
  {
    id: "bt",
    name: "Bhutan",
    code: "bt",
    continent: "Asia",
    population: 780000,
    gdp: 3,
  },
  {
    id: "mv",
    name: "Maldives",
    code: "mv",
    continent: "Asia",
    population: 520000,
    gdp: 7,
  },
  {
    id: "tl",
    name: "Timor-Leste",
    code: "tl",
    continent: "Asia",
    population: 1400000,
    gdp: 2,
  },
  // ── Additional Europe ─────────────────────────────────────────────────────
  {
    id: "by",
    name: "Belarus",
    code: "by",
    continent: "Europe",
    population: 9500000,
    gdp: 75,
  },
  {
    id: "md",
    name: "Moldova",
    code: "md",
    continent: "Europe",
    population: 2600000,
    gdp: 15,
  },
  {
    id: "al",
    name: "Albania",
    code: "al",
    continent: "Europe",
    population: 2800000,
    gdp: 22,
  },
  {
    id: "mk",
    name: "North Macedonia",
    code: "mk",
    continent: "Europe",
    population: 1800000,
    gdp: 14,
  },
  {
    id: "ba",
    name: "Bosnia & Herzegovina",
    code: "ba",
    continent: "Europe",
    population: 3200000,
    gdp: 24,
  },
  {
    id: "me",
    name: "Montenegro",
    code: "me",
    continent: "Europe",
    population: 620000,
    gdp: 7,
  },
  {
    id: "xk",
    name: "Kosovo",
    code: "xk",
    continent: "Europe",
    population: 1800000,
    gdp: 10,
  },
  {
    id: "si",
    name: "Slovenia",
    code: "si",
    continent: "Europe",
    population: 2100000,
    gdp: 68,
  },
  {
    id: "lv",
    name: "Latvia",
    code: "lv",
    continent: "Europe",
    population: 1840000,
    gdp: 43,
  },
  {
    id: "lt",
    name: "Lithuania",
    code: "lt",
    continent: "Europe",
    population: 2800000,
    gdp: 78,
  },
  {
    id: "ee",
    name: "Estonia",
    code: "ee",
    continent: "Europe",
    population: 1400000,
    gdp: 40,
  },
  {
    id: "is",
    name: "Iceland",
    code: "is",
    continent: "Europe",
    population: 380000,
    gdp: 27,
  },
  {
    id: "lu",
    name: "Luxembourg",
    code: "lu",
    continent: "Europe",
    population: 680000,
    gdp: 85,
  },
  {
    id: "cy",
    name: "Cyprus",
    code: "cy",
    continent: "Europe",
    population: 1200000,
    gdp: 30,
  },
  {
    id: "mt",
    name: "Malta",
    code: "mt",
    continent: "Europe",
    population: 530000,
    gdp: 20,
  },
  {
    id: "li",
    name: "Liechtenstein",
    code: "li",
    continent: "Europe",
    population: 39000,
    gdp: 7,
  },
  {
    id: "mc",
    name: "Monaco",
    code: "mc",
    continent: "Europe",
    population: 36000,
    gdp: 7,
  },
  {
    id: "sm",
    name: "San Marino",
    code: "sm",
    continent: "Europe",
    population: 34000,
    gdp: 2,
  },
  // ── Caribbean & Central America ───────────────────────────────────────────
  {
    id: "cu",
    name: "Cuba",
    code: "cu",
    continent: "North America",
    population: 11400000,
    gdp: 107,
  },
  {
    id: "do",
    name: "Dominican Republic",
    code: "do",
    continent: "North America",
    population: 11200000,
    gdp: 120,
  },
  {
    id: "ht",
    name: "Haiti",
    code: "ht",
    continent: "North America",
    population: 11600000,
    gdp: 19,
  },
  {
    id: "gt",
    name: "Guatemala",
    code: "gt",
    continent: "North America",
    population: 17600000,
    gdp: 96,
  },
  {
    id: "hn",
    name: "Honduras",
    code: "hn",
    continent: "North America",
    population: 10400000,
    gdp: 34,
  },
  {
    id: "sv",
    name: "El Salvador",
    code: "sv",
    continent: "North America",
    population: 6300000,
    gdp: 34,
  },
  {
    id: "ni",
    name: "Nicaragua",
    code: "ni",
    continent: "North America",
    population: 6700000,
    gdp: 17,
  },
  {
    id: "cr",
    name: "Costa Rica",
    code: "cr",
    continent: "North America",
    population: 5200000,
    gdp: 72,
  },
  {
    id: "pa",
    name: "Panama",
    code: "pa",
    continent: "North America",
    population: 4400000,
    gdp: 76,
  },
  {
    id: "jm",
    name: "Jamaica",
    code: "jm",
    continent: "North America",
    population: 2800000,
    gdp: 18,
  },
  {
    id: "tt",
    name: "Trinidad & Tobago",
    code: "tt",
    continent: "North America",
    population: 1400000,
    gdp: 26,
  },
  {
    id: "bs",
    name: "Bahamas",
    code: "bs",
    continent: "North America",
    population: 410000,
    gdp: 13,
  },
  {
    id: "bb",
    name: "Barbados",
    code: "bb",
    continent: "North America",
    population: 290000,
    gdp: 5,
  },
  {
    id: "bz",
    name: "Belize",
    code: "bz",
    continent: "North America",
    population: 420000,
    gdp: 3,
  },
  // ── South America ─────────────────────────────────────────────────────────
  {
    id: "uy",
    name: "Uruguay",
    code: "uy",
    continent: "South America",
    population: 3500000,
    gdp: 78,
  },
  {
    id: "py",
    name: "Paraguay",
    code: "py",
    continent: "South America",
    population: 7300000,
    gdp: 44,
  },
  {
    id: "bo",
    name: "Bolivia",
    code: "bo",
    continent: "South America",
    population: 12200000,
    gdp: 44,
  },
  {
    id: "sr",
    name: "Suriname",
    code: "sr",
    continent: "South America",
    population: 620000,
    gdp: 3,
  },
  {
    id: "gy",
    name: "Guyana",
    code: "gy",
    continent: "South America",
    population: 800000,
    gdp: 17,
  },
  // ── Oceania ───────────────────────────────────────────────────────────────
  {
    id: "pg",
    name: "Papua New Guinea",
    code: "pg",
    continent: "Oceania",
    population: 10000000,
    gdp: 26,
  },
  {
    id: "fj",
    name: "Fiji",
    code: "fj",
    continent: "Oceania",
    population: 930000,
    gdp: 5,
  },
  {
    id: "sb",
    name: "Solomon Islands",
    code: "sb",
    continent: "Oceania",
    population: 700000,
    gdp: 2,
  },
  {
    id: "vu",
    name: "Vanuatu",
    code: "vu",
    continent: "Oceania",
    population: 330000,
    gdp: 1,
  },
  {
    id: "ws",
    name: "Samoa",
    code: "ws",
    continent: "Oceania",
    population: 220000,
    gdp: 1,
  },
  {
    id: "to",
    name: "Tonga",
    code: "to",
    continent: "Oceania",
    population: 100000,
    gdp: 0.5,
  },
  // ── Additional Middle East ────────────────────────────────────────────────
  {
    id: "bh",
    name: "Bahrain",
    code: "bh",
    continent: "Asia",
    population: 1500000,
    gdp: 44,
  },
  {
    id: "ps",
    name: "Palestine",
    code: "ps",
    continent: "Asia",
    population: 5300000,
    gdp: 17,
  },
];

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  PolicyCategory,
  { icon: React.ElementType; color: string; bg: string; bar: string }
> = {
  Climate: {
    icon: Leaf,
    color: "text-emerald-400",
    bg: "bg-emerald-400/15",
    bar: "bg-emerald-400",
  },
  Healthcare: {
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-400/15",
    bar: "bg-pink-400",
  },
  Infrastructure: {
    icon: Wrench,
    color: "text-orange-400",
    bg: "bg-orange-400/15",
    bar: "bg-orange-400",
  },
  Education: {
    icon: BookOpen,
    color: "text-yellow-400",
    bg: "bg-yellow-400/15",
    bar: "bg-yellow-400",
  },
  Economy: {
    icon: TrendUp,
    color: "text-purple-400",
    bg: "bg-purple-400/15",
    bar: "bg-purple-400",
  },
  Defense: {
    icon: ShieldCheck,
    color: "text-red-400",
    bg: "bg-red-400/15",
    bar: "bg-red-400",
  },
  Technology: {
    icon: Desktop,
    color: "text-cyan-400",
    bg: "bg-cyan-400/15",
    bar: "bg-cyan-400",
  },
  Social: {
    icon: Users,
    color: "text-rose-400",
    bg: "bg-rose-400/15",
    bar: "bg-rose-400",
  },
};

const SCORE_COLORS = [
  { min: 8.5, bar: "bg-emerald-400" },
  { min: 7.5, bar: "bg-blue-400" },
  { min: 6.5, bar: "bg-yellow-400" },
  { min: 0, bar: "bg-red-400" },
];

function getBarColor(score: number) {
  return SCORE_COLORS.find((c) => score >= c.min)?.bar ?? "bg-red-400";
}

// ── Seeded RNG helper ────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Policy data generator ────────────────────────────────────────────────────

const CATEGORIES: PolicyCategory[] = [
  "Climate",
  "Healthcare",
  "Infrastructure",
  "Education",
  "Economy",
  "Defense",
  "Technology",
  "Social",
];

// ── State-specific policy descriptions ────────────────────────────────────────
// Each state gets one unique description per category, grounded in that state's
// real economy, energy mix, geography, and political priorities.

const STATE_SPECIFIC_POLICIES: Record<
  string,
  Record<PolicyCategory, { name: string; description: string }>
> = {
  al: {
    Climate: {
      name: "Coal Transition Fund",
      description:
        "Supports Alabama's coal-dependent communities in transitioning toward natural gas and emerging solar capacity.",
    },
    Healthcare: {
      name: "Rural Hospital Stabilization",
      description:
        "Provides emergency funding to keep rural Alabama hospitals open amid persistent closure threats.",
    },
    Infrastructure: {
      name: "I-20 Corridor Upgrade",
      description:
        "Rehabilitates the aging I-20 freight corridor connecting Birmingham to Atlanta and Mississippi.",
    },
    Education: {
      name: "Alabama Reads Initiative",
      description:
        "Targets Alabama's bottom-five national literacy ranking with early-grade reading intervention programs.",
    },
    Economy: {
      name: "Automotive Supplier Network",
      description:
        "Expands the supply chain ecosystem supporting Mercedes-Benz, Honda, and Hyundai plants in Alabama.",
    },
    Defense: {
      name: "Redstone Arsenal Modernization",
      description:
        "Upgrades facilities and cyber capabilities at Redstone Arsenal, home to Army aviation and missile defense.",
    },
    Technology: {
      name: "Rural Broadband Bridge",
      description:
        "Extends fiber-optic connectivity to Black Belt counties where fewer than 40% of households have broadband.",
    },
    Social: {
      name: "Black Belt Poverty Reduction Plan",
      description:
        "Directs targeted investment into Alabama's historically impoverished Black Belt region.",
    },
  },
  ak: {
    Climate: {
      name: "Arctic Resilience Strategy",
      description:
        "Addresses accelerating permafrost thaw and coastal erosion threatening Alaska's Native villages and infrastructure.",
    },
    Healthcare: {
      name: "Bush Medical Access Program",
      description:
        "Funds air-transport medical services and telemedicine for Alaska's remote communities unreachable by road.",
    },
    Infrastructure: {
      name: "AMHS Ferry System Overhaul",
      description:
        "Revitalizes the Alaska Marine Highway System connecting coastal communities with no road access.",
    },
    Education: {
      name: "Alaska Native Language Preservation",
      description:
        "Integrates Alaska's 20 indigenous languages into school curricula to prevent further language loss.",
    },
    Economy: {
      name: "Permanent Fund Dividend Optimization",
      description:
        "Reevaluates the formula distributing Alaska's oil revenue among residents to ensure long-term fiscal health.",
    },
    Defense: {
      name: "NORAD Northern Perimeter Upgrade",
      description:
        "Strengthens Alaska's early-warning radar and interceptor capacity as a front line of North American defense.",
    },
    Technology: {
      name: "Satellite Broadband Deployment",
      description:
        "Leverages satellite technology to deliver reliable internet to remote Alaskan villages beyond terrestrial reach.",
    },
    Social: {
      name: "Alaska Native Housing Initiative",
      description:
        "Addresses severe overcrowding and mold-contaminated housing in rural Alaska Native communities.",
    },
  },
  az: {
    Climate: {
      name: "Colorado River Conservation Compact",
      description:
        "Implements mandatory water conservation measures as Arizona's Colorado River allotment faces historic cuts.",
    },
    Healthcare: {
      name: "Border Health Corridor Program",
      description:
        "Expands healthcare access along Arizona's 370-mile southern border where provider shortages are acute.",
    },
    Infrastructure: {
      name: "Phoenix Light Rail Network Extension",
      description:
        "Extends the Valley Metro Rail system to connect fast-growing outer Phoenix suburbs to the urban core.",
    },
    Education: {
      name: "Arizona College Promise",
      description:
        "Expands free community college access for recent high school graduates statewide.",
    },
    Economy: {
      name: "Semiconductor Corridor Development",
      description:
        "Supports TSMC and Intel manufacturing ramp-ups with workforce training and infrastructure investment.",
    },
    Defense: {
      name: "Luke AFB Area Protection Plan",
      description:
        "Safeguards airspace and land use around Luke Air Force Base, host to F-35 pilot training operations.",
    },
    Technology: {
      name: "AI & Data Center Hub Strategy",
      description:
        "Positions Arizona as a preferred destination for hyperscale data centers and AI model training facilities.",
    },
    Social: {
      name: "Maricopa Affordable Housing Fund",
      description:
        "Addresses Maricopa County's acute housing shortage driven by rapid in-migration and rising home prices.",
    },
  },
  ar: {
    Climate: {
      name: "Arkansas River Water Quality Act",
      description:
        "Reduces agricultural runoff and nutrient pollution flowing into the Arkansas River and its tributaries.",
    },
    Healthcare: {
      name: "Medicaid Expansion Sustainability",
      description:
        "Extends Arkansas' private-option Medicaid expansion to maintain coverage for 250,000 low-income adults.",
    },
    Infrastructure: {
      name: "Delta Agricultural Road Network",
      description:
        "Repairs farm-to-market roads in the Arkansas Delta critical to the state's $20B agriculture sector.",
    },
    Education: {
      name: "LEARNS Act Implementation Fund",
      description:
        "Allocates resources for the literacy, choice, and educator pay provisions of the 2023 LEARNS Act.",
    },
    Economy: {
      name: "Walmart Supplier Ecosystem Growth",
      description:
        "Cultivates small business suppliers for Bentonville-based retail and logistics giants.",
    },
    Defense: {
      name: "Little Rock AFB Readiness Program",
      description:
        "Maintains crew training and airlift capacity at Little Rock Air Force Base, the C-130 center of excellence.",
    },
    Technology: {
      name: "Northwest Arkansas Innovation District",
      description:
        "Builds on the Bentonville tech cluster with grants for startups and supply-chain technology ventures.",
    },
    Social: {
      name: "Delta Poverty Reduction Initiative",
      description:
        "Targets Arkansas's Mississippi Delta region with workforce development, childcare, and nutrition programs.",
    },
  },
  ca: {
    Climate: {
      name: "100% Clean Energy by 2035",
      description:
        "Advances California's mandate to source all retail electricity from carbon-free resources by 2035.",
    },
    Healthcare: {
      name: "Medi-Cal Expansion for All Adults",
      description:
        "Extends full Medi-Cal coverage to all income-eligible adults regardless of immigration status.",
    },
    Infrastructure: {
      name: "High-Speed Rail Central Valley Link",
      description:
        "Accelerates construction of the Fresno-to-Bakersfield segment of California's high-speed rail project.",
    },
    Education: {
      name: "Universal Transitional Kindergarten",
      description:
        "Rolls out California's TK program to ensure all 4-year-olds have access to pre-kindergarten education.",
    },
    Economy: {
      name: "California CHIPS Act Incentives",
      description:
        "Pairs state incentives with federal CHIPS funding to attract semiconductor fabs to Silicon Valley and SD.",
    },
    Defense: {
      name: "Wildfire Emergency Response Overhaul",
      description:
        "Restructures Cal Fire's pre-positioning and air tanker resources to counter increasingly catastrophic wildfire seasons.",
    },
    Technology: {
      name: "Generative AI Accountability Act",
      description:
        "Establishes disclosure and safety requirements for frontier AI models developed or deployed in California.",
    },
    Social: {
      name: "CARE Court Homelessness Diversion",
      description:
        "Expands the Community Assistance, Recovery, and Empowerment Court to address unsheltered homelessness.",
    },
  },
  co: {
    Climate: {
      name: "Colorado Greenhouse Gas Roadmap",
      description:
        "Enforces sector-specific emission reduction requirements to meet Colorado's 50%-by-2030 GHG target.",
    },
    Healthcare: {
      name: "Colorado Option Public Health Plan",
      description:
        "Offers a state-standardized insurance product to compete with private insurers and lower premiums.",
    },
    Infrastructure: {
      name: "I-70 Mountain Corridor Improvement",
      description:
        "Expands and modernizes the I-70 mountain corridor, a critical freight and tourism artery through the Rockies.",
    },
    Education: {
      name: "Colorado Preschool Program Expansion",
      description:
        "Scales universal preschool to every 4-year-old in Colorado, building on a decade of voluntary enrollment.",
    },
    Economy: {
      name: "Outdoor Recreation Economy Plan",
      description:
        "Invests in trails, public lands access, and outdoor-industry talent pipelines anchoring Colorado's $47B recreation economy.",
    },
    Defense: {
      name: "NORAD & Space Command Sustainment",
      description:
        "Protects and expands Colorado's role as home to NORAD, Space Command, and 25+ military installations.",
    },
    Technology: {
      name: "Denver Tech Corridor Expansion",
      description:
        "Develops innovation corridors linking Denver, Boulder, and Colorado Springs with shared tech infrastructure.",
    },
    Social: {
      name: "Front Range Affordable Housing Compact",
      description:
        "Coordinates Denver metro communities to zone for density and fund workforce housing near transit hubs.",
    },
  },
  ct: {
    Climate: {
      name: "Connecticut Offshore Wind Procurement",
      description:
        "Contracts for offshore wind energy to meet Connecticut's 40% renewable target and replace aging gas peakers.",
    },
    Healthcare: {
      name: "HUSKY Health Benefit Expansion",
      description:
        "Strengthens Connecticut's HUSKY Medicaid program with dental, vision, and behavioral health parity.",
    },
    Infrastructure: {
      name: "Metro-North Rail Modernization",
      description:
        "Upgrades Connecticut's Metro-North commuter rail fleet and station infrastructure serving New York commuters.",
    },
    Education: {
      name: "Achievement Gap Task Force",
      description:
        "Implements evidence-based interventions targeting Connecticut's nation-leading Black-white academic achievement gap.",
    },
    Economy: {
      name: "Insurance Sector Talent Pipeline",
      description:
        "Partners with Hartford's insurance industry to grow actuarial and insurtech talent in the state.",
    },
    Defense: {
      name: "Submarine Industrial Base Investment",
      description:
        "Expands workforce and facility capacity at Electric Boat's Groton yards building Virginia-class submarines.",
    },
    Technology: {
      name: "FinTech & InsurTech Innovation Hub",
      description:
        "Positions Hartford as a national center for insurance technology and financial services innovation.",
    },
    Social: {
      name: "Connecticut Child Poverty Reduction Act",
      description:
        "Strengthens the state's child tax credit and childcare subsidies to cut child poverty rates in Hartford and Bridgeport.",
    },
  },
  de: {
    Climate: {
      name: "Delaware Clean Water Blueprint",
      description:
        "Reduces nitrogen and phosphorus runoff from poultry and agriculture operations into the Chesapeake Bay watershed.",
    },
    Healthcare: {
      name: "Delaware Cancer Consortium",
      description:
        "Expands access to cancer screening and treatment to address Delaware's above-average cancer mortality rates.",
    },
    Infrastructure: {
      name: "I-95 Corridor and Port Access",
      description:
        "Upgrades the I-95 interchange and access roads serving the Port of Wilmington, the nation's largest banana port.",
    },
    Education: {
      name: "Delaware STARS Quality Rating",
      description:
        "Raises standards and compensation for early childhood educators through the state's STARS rating system.",
    },
    Economy: {
      name: "Corporate Headquarters Retention",
      description:
        "Modernizes Delaware's General Corporation Law to keep it the preferred home for U.S. corporate charters.",
    },
    Defense: {
      name: "Dover AFB Airlift Mission Support",
      description:
        "Sustains and expands Dover Air Force Base's strategic airlift and mortuary affairs operations.",
    },
    Technology: {
      name: "Wilmington Fintech Cluster Initiative",
      description:
        "Leverages Delaware's banking charter advantages to attract next-generation fintech companies to Wilmington.",
    },
    Social: {
      name: "Wilmington Violence Interruption Program",
      description:
        "Expands community-based violence interruption programs in Wilmington, which records disproportionate homicide rates.",
    },
  },
  fl: {
    Climate: {
      name: "Florida Resilient Coastlines Act",
      description:
        "Funds beach nourishment, seawall upgrades, and managed retreat strategies against rising sea levels threatening South Florida.",
    },
    Healthcare: {
      name: "Florida Surgeon General Initiative",
      description:
        "Promotes individualized medicine and data transparency while expanding rural healthcare access statewide.",
    },
    Infrastructure: {
      name: "Brightline West Coast Rail Extension",
      description:
        "Extends Brightline passenger rail service to Tampa and Orlando to reduce I-4 corridor congestion.",
    },
    Education: {
      name: "Hope Scholarship & School Choice",
      description:
        "Expands Florida's education savings accounts so families can choose among public, private, and charter schools.",
    },
    Economy: {
      name: "Space Coast Workforce Development",
      description:
        "Builds aerospace engineering and technician talent pipelines to support Kennedy Space Center's growing commercial launch activity.",
    },
    Defense: {
      name: "MacDill AFB SOCOM Modernization",
      description:
        "Upgrades facilities and information systems at MacDill, headquarters of US Special Operations Command and CENTCOM.",
    },
    Technology: {
      name: "Miami Tech Hub Expansion",
      description:
        "Deepens Miami's emergence as a fintech and Web3 capital with grants, visa support, and co-investment funds.",
    },
    Social: {
      name: "Affordable Housing Trust Fund Boost",
      description:
        "Reverses years of Sadowski Fund sweeps by dedicating documentary stamp revenues to affordable housing production.",
    },
  },
  ga: {
    Climate: {
      name: "Georgia Coastal Wetlands Protection",
      description:
        "Strengthens protections for Georgia's 368,000-acre tidal marshes threatened by coastal development.",
    },
    Healthcare: {
      name: "Georgia Pathways Medicaid Program",
      description:
        "Links Medicaid eligibility to work and community engagement requirements under the state's Section 1115 waiver.",
    },
    Infrastructure: {
      name: "Port of Savannah Inland Corridor",
      description:
        "Expands freight rail and road access to the Port of Savannah, the nation's fastest-growing container port.",
    },
    Education: {
      name: "Georgia HOPE Scholarship Sustainability",
      description:
        "Ensures long-term funding for the HOPE Scholarship and Pre-K lottery program through revenue forecasting reforms.",
    },
    Economy: {
      name: "EV Manufacturing Corridor",
      description:
        "Supports Hyundai Metaplant, Rivian, and battery suppliers anchoring Georgia's emerging electric vehicle supply chain.",
    },
    Defense: {
      name: "Fort Moore Transformation Support",
      description:
        "Funds community transition programs as Fort Benning completes its rebranding and mission expansion as Fort Moore.",
    },
    Technology: {
      name: "Atlanta Digital Innovation District",
      description:
        "Develops Midtown Atlanta as a hub for cybersecurity, media technology, and financial services innovation.",
    },
    Social: {
      name: "Rural Georgia Access to Care Fund",
      description:
        "Addresses healthcare and economic deserts in Georgia's rural south through mobile clinics and telehealth infrastructure.",
    },
  },
  hi: {
    Climate: {
      name: "Hawaii 100% Renewable Mandate",
      description:
        "Accelerates deployment of solar, wind, and storage to meet Hawaii's legally binding 100% clean energy by 2045 goal.",
    },
    Healthcare: {
      name: "Hawaii Prepaid Health Care Expansion",
      description:
        "Strengthens Hawaii's unique employer health mandate to close coverage gaps for part-time and gig workers.",
    },
    Infrastructure: {
      name: "Honolulu Rail Transit System Completion",
      description:
        "Funds the final stations of the Skyline rail line connecting Kapolei to Ala Moana Center.",
    },
    Education: {
      name: "Hawaiian Language Immersion Program",
      description:
        "Expands Hawaiian-language immersion schools to support cultural revitalization and bilingual education.",
    },
    Economy: {
      name: "Tourism Diversification Strategy",
      description:
        "Reduces Hawaii's over-reliance on tourism by investing in ocean technology, defense, and creative industries.",
    },
    Defense: {
      name: "Pearl Harbor-Hickam Resilience Plan",
      description:
        "Hardens Joint Base Pearl Harbor-Hickam against sea-level rise and cyber threats given its Pacific strategic role.",
    },
    Technology: {
      name: "Blue Economy Innovation Fund",
      description:
        "Invests in ocean science, aquaculture technology, and marine renewable energy suited to Hawaii's island economy.",
    },
    Social: {
      name: "Maui Fire Recovery & Housing Program",
      description:
        "Funds long-term housing reconstruction and community economic recovery following the 2023 Lahaina wildfire.",
    },
  },
  id: {
    Climate: {
      name: "Snake River Water Compact",
      description:
        "Negotiates updated water allocation agreements for the Snake River to balance agriculture, hydropower, and fish recovery.",
    },
    Healthcare: {
      name: "Idaho Medicaid Expansion Stabilization",
      description:
        "Sustains voter-approved Medicaid expansion after legislative restrictions by ensuring provider rate adequacy.",
    },
    Infrastructure: {
      name: "Rural Broadband Idaho Act",
      description:
        "Deploys last-mile fiber and fixed wireless to remote Idaho farm communities and mountain towns.",
    },
    Education: {
      name: "Idaho Launch Workforce Grant",
      description:
        "Provides $8,500 workforce training grants for Idaho graduates who skip traditional four-year degrees.",
    },
    Economy: {
      name: "Treasure Valley Semiconductor Cluster",
      description:
        "Positions the Boise metropolitan area to attract chip fabrication and semiconductor equipment suppliers.",
    },
    Defense: {
      name: "Mountain Home AFB Expansion Plan",
      description:
        "Upgrades F-15E facilities and training ranges at Mountain Home AFB, the Air Force's premier overland strike wing.",
    },
    Technology: {
      name: "Boise Tech Corridor Initiative",
      description:
        "Develops Boise's emerging technology sector with a focus on agtech, precision agriculture, and industrial software.",
    },
    Social: {
      name: "Rural Childcare Desert Initiative",
      description:
        "Funds childcare center development in Idaho's rural counties where licensed slots are critically scarce.",
    },
  },
  il: {
    Climate: {
      name: "Climate & Equitable Jobs Act Rollout",
      description:
        "Implements Illinois' landmark 2021 CEJA mandate for 100% clean energy by 2050 with equity provisions.",
    },
    Healthcare: {
      name: "Illinois' All Kids Health Access",
      description:
        "Maintains universal health coverage for all children in Illinois regardless of immigration status.",
    },
    Infrastructure: {
      name: "Chicago Transit Authority Modernization",
      description:
        "Funds CTA Red Line south extension and fleet replacement to restore reliability across Chicago's rail network.",
    },
    Education: {
      name: "Evidence-Based Funding Model",
      description:
        "Continues Illinois' shift to evidence-based K-12 funding that prioritizes districts most in need of resources.",
    },
    Economy: {
      name: "CHIPS Illinois Manufacturing Initiative",
      description:
        "Leverages Illinois' logistics advantage to attract semiconductor packaging and advanced manufacturing facilities.",
    },
    Defense: {
      name: "Scott AFB Logistics Hub Security",
      description:
        "Protects and expands Scott Air Force Base's role as the Air Mobility Command headquarters and military logistics hub.",
    },
    Technology: {
      name: "Chicago Quantum Exchange Expansion",
      description:
        "Builds on the University of Chicago's quantum computing leadership through state investment in quantum research.",
    },
    Social: {
      name: "Chicago Violence Reduction Strategy",
      description:
        "Expands community investment, mental health, and workforce programs in Chicago's highest-violence neighborhoods.",
    },
  },
  in: {
    Climate: {
      name: "Indiana Coal-to-Clean Transition Plan",
      description:
        "Manages Indiana's shift away from coal — its largest power source — while protecting utility worker communities.",
    },
    Healthcare: {
      name: "Indiana Healthy Indiana Plan (HIP)",
      description:
        "Sustains Indiana's consumer-driven Medicaid HIP 2.0 program requiring beneficiary health accounts.",
    },
    Infrastructure: {
      name: "I-69 Completion & Intermodal Upgrade",
      description:
        "Completes Indiana's I-69 corridor from Indianapolis to Evansville and upgrades intermodal freight facilities.",
    },
    Education: {
      name: "Indiana Next Level Jobs",
      description:
        "Expands free workforce training certifications for high-demand fields aligned with Indiana's manufacturing economy.",
    },
    Economy: {
      name: "Indiana Statewide EV and Battery Cluster",
      description:
        "Attracts and connects EV battery manufacturers, including Samsung SDI and Stellantis joint ventures, across the state.",
    },
    Defense: {
      name: "Crane Naval Surface Warfare Expansion",
      description:
        "Grows research and manufacturing capacity at Crane NSWC, the Navy's largest inland military installation.",
    },
    Technology: {
      name: "Indiana AgriTech Innovation Fund",
      description:
        "Partners Purdue University research with agribusiness investment to develop precision agriculture technologies.",
    },
    Social: {
      name: "Indiana Opioid Response Fund",
      description:
        "Channels opioid settlement funds into treatment, recovery housing, and harm reduction across rural Indiana.",
    },
  },
  ia: {
    Climate: {
      name: "Iowa Wind Integration Study",
      description:
        "Plans grid upgrades to accommodate Iowa's wind-dominated energy mix, which already generates over 50% of state electricity.",
    },
    Healthcare: {
      name: "Iowa Wellbeing Index & Prevention",
      description:
        "Funds preventive care and mental health programs to address Iowa's rural physician shortage and aging workforce.",
    },
    Infrastructure: {
      name: "Iowa 80-Series Highway Corridor",
      description:
        "Upgrades I-80 and connecting state highways critical to Iowa's $33B annual agricultural export logistics.",
    },
    Education: {
      name: "Iowa Reading Corps Scale-Up",
      description:
        "Expands the evidence-based Iowa Reading Corps tutoring program to every school district in the state.",
    },
    Economy: {
      name: "Iowa Soy & Corn Value-Add Strategy",
      description:
        "Invests in processing and biofuels infrastructure to increase in-state value of Iowa's dominant commodity crops.",
    },
    Defense: {
      name: "Iowa National Guard Disaster Readiness",
      description:
        "Pre-positions Iowa National Guard assets for rapid response to floods and derecho storms that regularly strike the state.",
    },
    Technology: {
      name: "Iowa Data Center Energy Efficiency Fund",
      description:
        "Regulates and incentivizes energy efficiency in the large data centers clustered in Des Moines metro.",
    },
    Social: {
      name: "Iowa Rural Immigration Integration",
      description:
        "Helps Iowa's meatpacking communities integrate immigrant workforces into schools, healthcare, and civic life.",
    },
  },
  ks: {
    Climate: {
      name: "Kansas Wind Promise 2030",
      description:
        "Sets a voluntary 50% wind energy target and expands transmission lines to export power to Midwest markets.",
    },
    Healthcare: {
      name: "Kansas Medicaid Gap Coverage",
      description:
        "Addresses Kansas's coverage gap by exploring hybrid Medicaid options for adults above the federal poverty line.",
    },
    Infrastructure: {
      name: "Wichita Airport & Aviation Corridor",
      description:
        "Modernizes Wichita Mid-Continent Airport facilities to support the nation's largest general aviation manufacturing cluster.",
    },
    Education: {
      name: "Kansas Education Funding Formula",
      description:
        "Implements the Kansas Supreme Court's adequacy ruling by equalizing per-pupil funding across wealthy and poor districts.",
    },
    Economy: {
      name: "Kansas Agribusiness Innovation Park",
      description:
        "Develops agribusiness incubators near Kansas State to commercialize research in crop science and food technology.",
    },
    Defense: {
      name: "Fort Riley Combined Arms Training",
      description:
        "Upgrades combined-arms training ranges at Fort Riley to support 1st Armored Division readiness standards.",
    },
    Technology: {
      name: "Kansas Precision Agriculture Network",
      description:
        "Deploys IoT sensors and satellite connectivity across Kansas farmland to support data-driven crop management.",
    },
    Social: {
      name: "Western Kansas Rural Stabilization Fund",
      description:
        "Offers incentives for healthcare workers, teachers, and businesses to relocate to depopulating western Kansas counties.",
    },
  },
  ky: {
    Climate: {
      name: "Kentucky Coal Miner Jobs Transition",
      description:
        "Provides retraining and economic diversification support for Appalachian Kentucky's coal-mining workforce.",
    },
    Healthcare: {
      name: "Kentucky kynect Health Coverage",
      description:
        "Operates Kentucky's state-based insurance marketplace and expands outreach to the uninsured in rural counties.",
    },
    Infrastructure: {
      name: "Appalachian Kentucky Road Plan",
      description:
        "Accelerates completion of four-lane highway links through eastern Kentucky to end the region's transportation isolation.",
    },
    Education: {
      name: "Dual Credit Expansion for Rural Students",
      description:
        "Brings college and vocational dual-credit courses to Kentucky high schools in districts without proximity to campuses.",
    },
    Economy: {
      name: "Toyota & Ford EV Transition Support",
      description:
        "Ensures Kentucky's major automotive plants in Georgetown and Louisville are competitive in the EV production era.",
    },
    Defense: {
      name: "Fort Campbell Air Assault Readiness",
      description:
        "Maintains the training intensity, Chinook fleet, and special operations readiness of Fort Campbell's 101st Airborne Division.",
    },
    Technology: {
      name: "Kentucky Cybersecurity Talent Pipeline",
      description:
        "Develops cybersecurity curriculum at community colleges to fuel the growing security operations sector in Lexington.",
    },
    Social: {
      name: "Appalachian Opioid Recovery Network",
      description:
        "Expands medication-assisted treatment and recovery community organizations across Kentucky's hardest-hit Appalachian counties.",
    },
  },
  la: {
    Climate: {
      name: "Louisiana Coastal Master Plan",
      description:
        "Invests in marsh restoration, levee upgrades, and barrier island rebuilding to slow Louisiana's catastrophic land loss.",
    },
    Healthcare: {
      name: "Louisiana Medicaid Behavioral Health",
      description:
        "Expands mental health and addiction treatment benefits within Medicaid following the state's opioid crisis surge.",
    },
    Infrastructure: {
      name: "New Orleans Flood Protection System",
      description:
        "Maintains and upgrades the $14B Greater New Orleans Hurricane and Storm Damage Risk Reduction System.",
    },
    Education: {
      name: "Louisiana LEAP Act Literacy Plan",
      description:
        "Implements structured literacy instruction aligned with reading science in every K-3 classroom statewide.",
    },
    Economy: {
      name: "LNG Export Terminal Growth Strategy",
      description:
        "Supports Louisiana's expansion of LNG export capacity, making the state a key U.S. energy export hub.",
    },
    Defense: {
      name: "Barksdale AFB B-52 Sustainment",
      description:
        "Ensures Barksdale Air Force Base retains its B-52H Stratofortress wing amid Air Force Global Strike Command realignments.",
    },
    Technology: {
      name: "New Orleans Creative Technology Corridor",
      description:
        "Leverages New Orleans' film industry and music scene to attract digital media and gaming companies.",
    },
    Social: {
      name: "Louisiana Child Poverty Emergency Act",
      description:
        "Addresses Louisiana's nation-leading child poverty rate with expanded child tax credits and home visiting programs.",
    },
  },
  me: {
    Climate: {
      name: "Maine Offshore Wind Development Plan",
      description:
        "Positions Maine as the test site for floating offshore wind technology suitable for the deep North Atlantic.",
    },
    Healthcare: {
      name: "Maine Dirigo Health Rural Access",
      description:
        "Expands primary care and mental health services in Maine's vast rural stretches and island communities.",
    },
    Infrastructure: {
      name: "Maine Turnpike Digital Corridor",
      description:
        "Deploys smart infrastructure along the Maine Turnpike to improve winter maintenance and truck platooning safety.",
    },
    Education: {
      name: "Maine Learning Technology Initiative",
      description:
        "Maintains Maine's pioneering 1-to-1 laptop program while updating devices for modern digital learning.",
    },
    Economy: {
      name: "Maine Lobster and Aquaculture Resilience",
      description:
        "Protects Maine's $1.6B lobster industry and develops sustainable aquaculture amid warming Gulf of Maine waters.",
    },
    Defense: {
      name: "Portsmouth Naval Shipyard Nuclear Overhaul",
      description:
        "Supports Portsmouth Naval Shipyard's submarine overhaul capacity to meet growing SSN maintenance backlogs.",
    },
    Technology: {
      name: "Maine Remote Work Attraction Program",
      description:
        "Incentivizes remote technology workers from urban centers to relocate to rural Maine communities.",
    },
    Social: {
      name: "Maine Wabanaki Tribal Services Parity",
      description:
        "Addresses gaps in healthcare, housing, and social services for Maine's four federally recognized Wabanaki tribes.",
    },
  },
  md: {
    Climate: {
      name: "Maryland Climate Solutions Now Act",
      description:
        "Implements Maryland's mandate for a 60% reduction in greenhouse gases by 2031 and net-zero by 2045.",
    },
    Healthcare: {
      name: "Maryland CRISP Health Data Exchange",
      description:
        "Expands the state's clinical data exchange to improve care coordination and reduce preventable hospital readmissions.",
    },
    Infrastructure: {
      name: "Purple Line Light Rail Completion",
      description:
        "Completes the Purple Line connecting Bethesda and New Carrollton through Maryland's under-served inner suburbs.",
    },
    Education: {
      name: "Blueprint for Maryland's Future",
      description:
        "Funds the decade-long Blueprint reform requiring higher teacher salaries, expanded pre-K, and community schools.",
    },
    Economy: {
      name: "BioHealth Capital Region Strategy",
      description:
        "Builds on Maryland's NIH and FDA proximity to attract biotech, genomics, and life science companies.",
    },
    Defense: {
      name: "Fort Meade Cyber Workforce Expansion",
      description:
        "Grows the cybersecurity talent pipeline feeding NSA, Cyber Command, and the defense contractor ecosystem at Fort Meade.",
    },
    Technology: {
      name: "Maryland Tech Council Innovation Fund",
      description:
        "Partners state government with the Maryland Tech Council to co-fund emerging technology startups.",
    },
    Social: {
      name: "Baltimore Renter Protections & Housing",
      description:
        "Strengthens Baltimore City's renter protections and funds affordable housing preservation in gentrifying neighborhoods.",
    },
  },
  ma: {
    Climate: {
      name: "Massachusetts Clean Energy Standard",
      description:
        "Ratchets up Massachusetts' annual requirements for utility procurement of clean electricity toward full decarbonization.",
    },
    Healthcare: {
      name: "Massachusetts Health Connector Stabilization",
      description:
        "Strengthens the nation's first state health insurance exchange by expanding subsidies and simplifying enrollment.",
    },
    Infrastructure: {
      name: "MBTA Safety & Reliability Overhaul",
      description:
        "Funds the Federal Transit Administration-mandated safety upgrades and hiring to restore MBTA service reliability.",
    },
    Education: {
      name: "Massachusetts Early College Initiative",
      description:
        "Expands dual enrollment pathways allowing high schoolers to earn college credits in partnership with state universities.",
    },
    Economy: {
      name: "Massachusetts Life Sciences Capital Program",
      description:
        "Extends Massachusetts' landmark life sciences capital investment program anchoring its $32B biotech cluster.",
    },
    Defense: {
      name: "Hanscom AFB Digital Systems Hub",
      description:
        "Grows Hanscom Air Force Base's role as the Air Force's digital and command-and-control acquisition center.",
    },
    Technology: {
      name: "Boston Quantum Computing Initiative",
      description:
        "Invests in quantum hardware, software, and talent to secure Boston's position as a global quantum computing leader.",
    },
    Social: {
      name: "MBTA Communities Affordable Housing Act",
      description:
        "Requires towns served by MBTA rail to zone for multi-family housing to address the Boston metro housing crisis.",
    },
  },
  mi: {
    Climate: {
      name: "Michigan Healthy Climate Plan",
      description:
        "Implements Governor Whitmer's 2023 clean energy act requiring 100% carbon-free electricity by 2040.",
    },
    Healthcare: {
      name: "Michigan Healthy Michigan Plan",
      description:
        "Sustains Michigan's expanded Medicaid program covering 700,000 adults with community engagement components.",
    },
    Infrastructure: {
      name: "Detroit-to-Pontiac I-75 Expansion",
      description:
        "Reconstructs and widens the aging I-75 corridor connecting Detroit's auto manufacturing core to northern suburbs.",
    },
    Education: {
      name: "Michigan Reconnect Adult Education",
      description:
        "Provides free community college tuition to Michiganders 25 and older to retrain for the evolving economy.",
    },
    Economy: {
      name: "Michigan EV Transition Fund",
      description:
        "Supports UAW workers and Tier 1 suppliers navigating the transition from ICE to EV production at Detroit-area plants.",
    },
    Defense: {
      name: "Michigan National Guard Cyber Unit Growth",
      description:
        "Expands Michigan's elite National Guard cyber protection units supporting state and federal cyber defense operations.",
    },
    Technology: {
      name: "Michigan Mobility Innovation Sandbox",
      description:
        "Operates the nation's largest autonomous and connected vehicle testing infrastructure in Ann Arbor and Detroit.",
    },
    Social: {
      name: "Flint Water Recovery & Lead Remediation",
      description:
        "Continues replacing lead service lines and monitoring water quality as part of Flint's long-term recovery effort.",
    },
  },
  mn: {
    Climate: {
      name: "Minnesota 100% Clean Electricity Act",
      description:
        "Implements the 2023 law requiring Minnesota utilities to supply 100% carbon-free electricity by 2040.",
    },
    Healthcare: {
      name: "MinnesotaCare Public Option Expansion",
      description:
        "Opens MinnesotaCare to all Minnesota residents regardless of income, creating a genuine public health insurance option.",
    },
    Infrastructure: {
      name: "Twin Cities Light Rail Blue & Green Line",
      description:
        "Extends the Blue and Green Line light rail networks to connect underserved suburbs to the Minneapolis-Saint Paul core.",
    },
    Education: {
      name: "Minnesota Reading Success Plan",
      description:
        "Mandates structured literacy methods statewide to address early reading disparities across income and race lines.",
    },
    Economy: {
      name: "Medical Alley Life Science Strategy",
      description:
        "Expands the Medical Alley corridor anchored by Medtronic and Mayo Clinic with new device and biotech investment.",
    },
    Defense: {
      name: "Minnesota National Guard Arctic Training",
      description:
        "Develops cold-weather military training capacity in northern Minnesota for increasingly relevant Arctic operations.",
    },
    Technology: {
      name: "Minneapolis Health Tech Innovation Hub",
      description:
        "Positions Minneapolis as a national health technology center leveraging its unique concentration of health IT companies.",
    },
    Social: {
      name: "Minnesota Invest in Youth Initiative",
      description:
        "Funds youth employment, mentorship, and violence prevention programs in Saint Paul and Minneapolis.",
    },
  },
  ms: {
    Climate: {
      name: "Mississippi River Restoration Compact",
      description:
        "Joins multistate efforts to restore wetlands and reduce agricultural runoff entering the Mississippi River.",
    },
    Healthcare: {
      name: "Mississippi Rural Health Initiative",
      description:
        "Addresses Mississippi's nation-worst health outcomes with mobile clinics across its 29 rural Critical Access Hospitals.",
    },
    Infrastructure: {
      name: "Port of Gulfport Expansion",
      description:
        "Expands Port of Gulfport's containerized cargo capacity and improves rail connections to inland distribution centers.",
    },
    Education: {
      name: "Mississippi Literacy-Based Promotion Act",
      description:
        "Retains third graders who cannot read proficiently and provides intensive intervention rather than social promotion.",
    },
    Economy: {
      name: "Mississippi Automotive Manufacturing Recovery",
      description:
        "Rebuilds the supplier ecosystem surrounding the Toyota Corolla plant and JATCO transmission facility in Blue Springs.",
    },
    Defense: {
      name: "Camp Shelby Training Range Modernization",
      description:
        "Upgrades Camp Shelby's maneuver ranges to support joint and multinational training at the South's largest National Guard facility.",
    },
    Technology: {
      name: "Mississippi Broadband Development Act",
      description:
        "Deploys fiber internet to Mississippi's counties where 30%+ of residents lack any broadband access option.",
    },
    Social: {
      name: "Mississippi Childhood Poverty Emergency Plan",
      description:
        "Targets Mississippi's 27% child poverty rate with expanded SNAP, EITC, and universal school meals.",
    },
  },
  mo: {
    Climate: {
      name: "Missouri Wind and Solar Expansion Act",
      description:
        "Removes regulatory barriers to utility-scale wind and solar development in Missouri's energy mix.",
    },
    Healthcare: {
      name: "Missouri Medicaid Expansion Implementation",
      description:
        "Funds the voter-mandated Medicaid expansion after legislative delays that left thousands without coverage.",
    },
    Infrastructure: {
      name: "Gateway Arch Region Transit Plan",
      description:
        "Develops a metro transit strategy connecting East Saint Louis, Saint Louis, and western Missouri commuter corridors.",
    },
    Education: {
      name: "Missouri A+ Schools Program",
      description:
        "Expands the A+ program paying community college tuition for graduates of qualifying public high schools.",
    },
    Economy: {
      name: "Kansas City Animal Health Corridor",
      description:
        "Invests in the 200-mile K.C.-to-Columbia Animal Health Corridor, home to 30% of global animal health industry R&D.",
    },
    Defense: {
      name: "Whiteman AFB B-21 Raider Transition",
      description:
        "Manages Whiteman Air Force Base's transition from B-2 Spirit to the next-generation B-21 Raider stealth bomber.",
    },
    Technology: {
      name: "Saint Louis Financial Technology Growth",
      description:
        "Supports Saint Louis' Centene-anchored digital health and insurance technology startup ecosystem.",
    },
    Social: {
      name: "Ferguson Consent Decree Community Investment",
      description:
        "Pairs police accountability reforms with neighborhood investment in the Saint Louis communities affected by consent decrees.",
    },
  },
  mt: {
    Climate: {
      name: "Montana Wildfire Resilience Plan",
      description:
        "Expands forest thinning, controlled burns, and community defensible-space programs amid increasing wildfire severity.",
    },
    Healthcare: {
      name: "Montana HELP Act Medicaid Continuity",
      description:
        "Renews and strengthens Montana's Medicaid expansion program covering 100,000 low-income adults since 2016.",
    },
    Infrastructure: {
      name: "Montana Backroads Improvement Fund",
      description:
        "Repairs rural county roads and bridges that are the only access routes to remote communities and ranches.",
    },
    Education: {
      name: "Montana Indian Education for All",
      description:
        "Fulfills the state's constitutional mandate to teach the history and culture of Montana's 12 tribal nations in public schools.",
    },
    Economy: {
      name: "Montana Outdoor Recreation Economy Strategy",
      description:
        "Diversifies Montana's economy by marketing its public lands as a national destination for outdoor recreation businesses.",
    },
    Defense: {
      name: "Malmstrom AFB ICBM Sentinel Transition",
      description:
        "Supports Malmstrom AFB's shift from Minuteman III to the LGM-35A Sentinel ICBM, modernizing nuclear deterrence.",
    },
    Technology: {
      name: "Montana Rural Digital Connectivity Plan",
      description:
        "Brings reliable broadband to Montana's vast rural expanse to retain young workers and support remote-work migration.",
    },
    Social: {
      name: "Montana Missing and Murdered Indigenous Persons Act",
      description:
        "Funds investigations and victim services addressing the disproportionate rate of MMIP cases among Montana's tribal nations.",
    },
  },
  ne: {
    Climate: {
      name: "Nebraska Ogallala Aquifer Conservation",
      description:
        "Enforces water use limits and efficiency incentives to slow depletion of the Ogallala Aquifer underpinning Nebraska agriculture.",
    },
    Healthcare: {
      name: "Nebraska Medicaid Expansion Stabilization",
      description:
        "Protects and strengthens the voter-mandated Medicaid expansion covering 90,000 Nebraskans since 2020.",
    },
    Infrastructure: {
      name: "Nebraska Interstate Grain Corridor",
      description:
        "Upgrades I-80 and connecting rail lines handling Nebraska's massive grain, beef, and ethanol export volumes.",
    },
    Education: {
      name: "Nebraska Sandhills Teacher Recruitment",
      description:
        "Provides loan forgiveness and housing subsidies to attract certified teachers to sparsely populated Sandhills districts.",
    },
    Economy: {
      name: "Nebraska Beef Value Chain Initiative",
      description:
        "Invests in processing capacity and branding to capture more value from Nebraska's position as the nation's top beef state.",
    },
    Defense: {
      name: "Offutt AFB Strategic Command Resilience",
      description:
        "Addresses chronic flooding risk at Offutt AFB to protect the US Strategic Command headquarters from future disasters.",
    },
    Technology: {
      name: "Nebraska Precision Cattle Technology Hub",
      description:
        "Partners with University of Nebraska and John Deere to develop real-time livestock health monitoring solutions.",
    },
    Social: {
      name: "Nebraska Rural Mental Health Network",
      description:
        "Builds telehealth mental health capacity for Nebraska's farming communities experiencing high rates of farm-stress suicide.",
    },
  },
  nv: {
    Climate: {
      name: "Nevada Water Conservation & Reuse Act",
      description:
        "Mandates water recycling and turf removal to manage Las Vegas' shrinking Colorado River allotment.",
    },
    Healthcare: {
      name: "Nevada Medicaid Managed Care Expansion",
      description:
        "Extends Medicaid managed care into rural Nevada counties currently served only by fee-for-service providers.",
    },
    Infrastructure: {
      name: "I-15 Las Vegas Interchange Reconstruction",
      description:
        "Reconstructs the I-15/US-95 interchange handling 400,000 daily vehicles in the Las Vegas metro area.",
    },
    Education: {
      name: "Nevada Zoom Schools Initiative",
      description:
        "Provides supplemental literacy and English-language learning funding to schools with high ELL populations in Clark County.",
    },
    Economy: {
      name: "Nevada Tourism Diversification Beyond Gaming",
      description:
        "Develops conventions, outdoor recreation, and sports tourism to reduce economic concentration in casino gaming.",
    },
    Defense: {
      name: "Nellis AFB Advanced Warfare Center Expansion",
      description:
        "Expands Nellis Air Force Base's advanced air warfare training range, including Red Flag exercise infrastructure.",
    },
    Technology: {
      name: "Tahoe-Reno Industrial Center Tech Growth",
      description:
        "Leverages the Tesla Gigafactory and Switch data center cluster to attract semiconductor and battery manufacturers.",
    },
    Social: {
      name: "Nevada Comprehensive Harm Reduction Act",
      description:
        "Expands syringe service programs and naloxone distribution to address Nevada's above-average opioid mortality rate.",
    },
  },
  nh: {
    Climate: {
      name: "New Hampshire Clean Energy Future",
      description:
        "Sets a voluntary 25% renewable energy standard and creates incentives for community solar and geothermal heating.",
    },
    Healthcare: {
      name: "New Hampshire Medicaid Care Management",
      description:
        "Modernizes New Hampshire's Medicaid managed care contracts to improve mental health and addiction treatment outcomes.",
    },
    Infrastructure: {
      name: "Northern Pass Successor Transmission Line",
      description:
        "Develops an alternative clean energy transmission corridor after the Northern Pass project was denied.",
    },
    Education: {
      name: "New Hampshire Education Freedom Accounts",
      description:
        "Expands Education Freedom Accounts allowing families to use state education funds at private or home schools.",
    },
    Economy: {
      name: "New Hampshire Innovation Economy Fund",
      description:
        "Supports the Manchester-Portsmouth tech corridor with co-investment in defense technology and advanced manufacturing.",
    },
    Defense: {
      name: "Portsmouth Naval Shipyard Expansion",
      description:
        "Advocates for New Hampshire facilities and workers at Portsmouth Naval Shipyard during submarine overhaul capacity expansion.",
    },
    Technology: {
      name: "New Hampshire Digital Government Initiative",
      description:
        "Modernizes state permitting, licensing, and benefits systems to be fully accessible via mobile devices.",
    },
    Social: {
      name: "New Hampshire Granite Solutions Housing",
      description:
        "Develops workforce housing near Manchester and Nashua to address the Seacoast and Manchester metro housing shortage.",
    },
  },
  nj: {
    Climate: {
      name: "New Jersey Offshore Wind Master Plan",
      description:
        "Advances New Jersey's 11 GW offshore wind commitment with port infrastructure, workforce training, and supply chain investment.",
    },
    Healthcare: {
      name: "New Jersey FamilyCare Expansion",
      description:
        "Extends NJ FamilyCare to cover all residents up to 200% of the federal poverty line with no enrollment barriers.",
    },
    Infrastructure: {
      name: "Gateway Tunnel Hudson River Project",
      description:
        "Partners with New York and the federal government to build a new rail tunnel doubling Amtrak and NJ Transit capacity under the Hudson.",
    },
    Education: {
      name: "New Jersey Reading by 3rd Grade",
      description:
        "Implements early literacy screening and intervention for every New Jersey student before reaching fourth grade.",
    },
    Economy: {
      name: "New Jersey Life Sciences & Pharma Corridor",
      description:
        "Strengthens NJ's pharmaceutical corridor anchored by Johnson & Johnson, Merck, and Bristol Myers Squibb.",
    },
    Defense: {
      name: "Joint Base MDL Mission Preservation",
      description:
        "Protects Joint Base McGuire-Dix-Lakehurst's diverse airlift, Army Reserve, and homeland defense missions.",
    },
    Technology: {
      name: "New Jersey Innovation HQ Program",
      description:
        "Attracts corporate technology headquarters and R&D centers with site preparation grants and talent incentives.",
    },
    Social: {
      name: "New Jersey Eviction Protection & Housing Stability",
      description:
        "Strengthens tenant protections and funds legal aid to prevent displacement from NJ's high-cost rental market.",
    },
  },
  nm: {
    Climate: {
      name: "New Mexico Energy Transition Act",
      description:
        "Implements New Mexico's mandate for 50% renewable electricity by 2030 and 80% by 2040 from its solar-rich resource base.",
    },
    Healthcare: {
      name: "New Mexico Behavioral Health System Rebuild",
      description:
        "Reconstructs New Mexico's behavioral health network a decade after the 2013 provider sanctions dismantled it.",
    },
    Infrastructure: {
      name: "New Mexico Rural Water Authority",
      description:
        "Secures long-term water rights and infrastructure for tribal communities and rural colonias lacking clean water supply.",
    },
    Education: {
      name: "New Mexico 3-Tiered Licensure & Teacher Pay",
      description:
        "Implements substantial teacher pay raises tied to a performance and specialization-based licensure framework.",
    },
    Economy: {
      name: "Spaceport America Commercial Expansion",
      description:
        "Attracts additional commercial launch operators and aerospace companies to Spaceport America in Truth or Consequences.",
    },
    Defense: {
      name: "Kirtland AFB Nuclear Weapons Security",
      description:
        "Maintains the physical security systems and classified operations protecting nuclear weapons stored at Kirtland AFB.",
    },
    Technology: {
      name: "Los Alamos National Lab Tech Commercialization",
      description:
        "Transfers Los Alamos National Laboratory's quantum and materials science discoveries into commercial New Mexico ventures.",
    },
    Social: {
      name: "New Mexico Early Childhood Education Fund",
      description:
        "Uses Land Grant Permanent Fund earnings to pay for universal early childhood education and childcare subsidies.",
    },
  },
  ny: {
    Climate: {
      name: "Climate Leadership and Community Protection Act",
      description:
        "Enforces New York's nation-leading law mandating 70% renewable electricity by 2030 and net-zero GHG by 2050.",
    },
    Healthcare: {
      name: "New York Health Act Single-Payer Study",
      description:
        "Advances feasibility analysis for a universal single-payer healthcare system to replace fragmented private insurance.",
    },
    Infrastructure: {
      name: "Penn Station & MTA Capital Overhaul",
      description:
        "Executes New York's $68B MTA capital program while advancing a redesigned Penn Station area development.",
    },
    Education: {
      name: "New York Universal Pre-K Expansion",
      description:
        "Scales New York City's universal pre-K model statewide to give every 3 and 4-year-old access to quality early education.",
    },
    Economy: {
      name: "New York Life Sciences Cluster Investment",
      description:
        "Partners with academia and private investors to build a biotech ecosystem in New York City's East Side innovation corridor.",
    },
    Defense: {
      name: "West Point Cyber Leadership Institute",
      description:
        "Expands West Point's cybersecurity programs to produce military and government cyber officers for national security.",
    },
    Technology: {
      name: "New York City Artificial Intelligence Hub",
      description:
        "Positions New York City as a counterweight to Silicon Valley in AI research, talent, and startup formation.",
    },
    Social: {
      name: "New York City Right to Shelter Sustainability",
      description:
        "Reforms and funds the legally mandated right-to-shelter system to improve outcomes and manage record demand.",
    },
  },
  nc: {
    Climate: {
      name: "North Carolina Clean Energy Plan",
      description:
        "Implements Duke Energy's regulatory mandate to reduce carbon emissions 70% by 2030 and reach net-zero by 2050.",
    },
    Healthcare: {
      name: "NC Medicaid Managed Care Transformation",
      description:
        "Completes North Carolina's shift to Medicaid managed care while extending coverage to 600,000 newly eligible adults.",
    },
    Infrastructure: {
      name: "Charlotte & Raleigh-Durham Airport Expansion",
      description:
        "Funds concurrent capacity expansions at CLT and RDU to handle booming passenger demand in the Research Triangle.",
    },
    Education: {
      name: "NC Leandro Education Equity Ruling",
      description:
        "Implements the state Supreme Court's Leandro ruling requiring adequate, equitable education funding for every child.",
    },
    Economy: {
      name: "Research Triangle Life Science Cluster",
      description:
        "Expands the Research Triangle's biotech, pharma, and genomics industry with targeted university-industry partnerships.",
    },
    Defense: {
      name: "Fort Liberty Airborne & Special Ops Readiness",
      description:
        "Sustains the training readiness of Fort Liberty's 82nd Airborne Division and adjacent Special Operations units.",
    },
    Technology: {
      name: "NC Microelectronics Hub Initiative",
      description:
        "Leverages the CHIPS Act designation as part of the National Semiconductor Technology Center's Southeast node.",
    },
    Social: {
      name: "Opportunity NC Rural Poverty Initiative",
      description:
        "Targets persistent poverty in North Carolina's eastern Coastal Plain and western mountain counties.",
    },
  },
  nd: {
    Climate: {
      name: "North Dakota Carbon Capture & Storage Hub",
      description:
        "Develops geological CO2 storage sites to pair with North Dakota's ethanol and power plant emissions for carbon-neutral energy.",
    },
    Healthcare: {
      name: "North Dakota Behavioral Health Access Plan",
      description:
        "Funds telehealth and mobile behavioral health services for the rural western oilfield belt and primary care shortage areas.",
    },
    Infrastructure: {
      name: "Bakken Oil Infrastructure Upgrade",
      description:
        "Upgrades Bakken crude pipeline and road infrastructure to handle density of oil production and truck traffic.",
    },
    Education: {
      name: "North Dakota Behavioral Health Graduate Program",
      description:
        "Partners with universities to grow the behavioral health workforce addressing North Dakota's rural mental health shortage.",
    },
    Economy: {
      name: "North Dakota Agricultural Trade Expansion",
      description:
        "Opens new export markets for North Dakota's No. 1-ranked crop commodity exports including durum wheat and sunflowers.",
    },
    Defense: {
      name: "Minot AFB Dual-Mission Modernization",
      description:
        "Sustains Minot Air Force Base's unique dual nuclear mission operating both B-52H bombers and Minuteman III ICBMs.",
    },
    Technology: {
      name: "North Dakota Precision Ag Drone Corridor",
      description:
        "Designates North Dakota's open airspace as a premier testing zone for agricultural drone and UAS operations.",
    },
    Social: {
      name: "North Dakota Native American Tribal Services Compact",
      description:
        "Expands state-tribal compacts delivering improved healthcare, housing, and social services to ND's five tribal nations.",
    },
  },
  oh: {
    Climate: {
      name: "Ohio Nuclear Preservation & Clean Energy",
      description:
        "Supports Ohio's nuclear plants as a clean baseload resource while developing offshore wind agreements on Lake Erie.",
    },
    Healthcare: {
      name: "OhioMHAS Addiction Recovery Services",
      description:
        "Expands Ohio's mental health and addiction services system, which became a national model during the opioid crisis.",
    },
    Infrastructure: {
      name: "Ohio Turnpike Modernization Program",
      description:
        "Reinvests Ohio Turnpike revenues into major corridor upgrades supporting the state's dominant freight economy.",
    },
    Education: {
      name: "Ohio Straight A Fund Innovation Grants",
      description:
        "Funds collaborative K-12 innovation projects demonstrating measurable improvement in student achievement outcomes.",
    },
    Economy: {
      name: "Ohio Intel Semiconductor Ecosystem Build",
      description:
        "Develops the workforce, supply chain, and utility infrastructure to support Intel's New Albany chip fab megasite.",
    },
    Defense: {
      name: "Wright-Patterson AFB Research Hub",
      description:
        "Expands R&D partnerships with Ohio universities and the Air Force Research Laboratory at Wright-Patterson AFB.",
    },
    Technology: {
      name: "Ohio TechCred Workforce Upskilling",
      description:
        "Reimburses Ohioans for industry-recognized technology credentials through the TechCred short-term training program.",
    },
    Social: {
      name: "Ohio Issue 1 Reproductive Rights Infrastructure",
      description:
        "Implements the constitutional reproductive rights amendment by ensuring provider access and Medicaid coverage.",
    },
  },
  ok: {
    Climate: {
      name: "Oklahoma Wind & Solar Grid Integration",
      description:
        "Upgrades power transmission lines to carry Oklahoma's large wind surplus east to load centers in drought years.",
    },
    Healthcare: {
      name: "Oklahoma Tribal Health Compact Expansion",
      description:
        "Expands the state-tribal healthcare compact model that has produced superior health outcomes for tribal citizens.",
    },
    Infrastructure: {
      name: "Oklahoma I-40 & Crossroads Corridor",
      description:
        "Upgrades the I-40/I-35/I-44 crossroads in Oklahoma City, one of the nation's highest-volume freight intersections.",
    },
    Education: {
      name: "Oklahoma Reading Sufficiency Act",
      description:
        "Funds intensive early reading intervention and prevents third-grade social promotion without demonstrated literacy proficiency.",
    },
    Economy: {
      name: "Oklahoma Space & Aerospace Cluster",
      description:
        "Develops the Clinton-Sherman Industrial Airpark and MidAmerica Airport into aerospace manufacturing destinations.",
    },
    Defense: {
      name: "Tinker AFB B-21 Depot Preparation",
      description:
        "Prepares Tinker Air Force Base's Aerospace Maintenance and Regeneration depot for B-21 heavy maintenance work.",
    },
    Technology: {
      name: "Oklahoma Agtech & Precision Farming Initiative",
      description:
        "Partners Oklahoma State University with agriculture technology companies to modernize the state's farming operations.",
    },
    Social: {
      name: "Oklahoma Native American Child Welfare Compact",
      description:
        "Strengthens implementation of the Indian Child Welfare Act in Oklahoma's court system following the Haaland v. Brackeen ruling.",
    },
  },
  or: {
    Climate: {
      name: "Oregon Clean Fuels Program Expansion",
      description:
        "Strengthens Oregon's low-carbon fuel standard to cut transportation sector emissions from vehicles and trucks.",
    },
    Healthcare: {
      name: "Oregon Coordinated Care Organizations",
      description:
        "Expands Oregon's innovative Medicaid CCO model integrating physical, mental, and dental health around each community.",
    },
    Infrastructure: {
      name: "Portland Metro MAX & Bus Rapid Transit",
      description:
        "Extends MAX light rail and implements bus rapid transit corridors to reduce I-205 congestion.",
    },
    Education: {
      name: "Oregon Student Success Act",
      description:
        "Directs corporate activity tax revenues into early learning, K-12 instructional improvement, and post-secondary CTE.",
    },
    Economy: {
      name: "Oregon Advanced Manufacturing Hub",
      description:
        "Diversifies manufacturing across Portland metro and the Willamette Valley with semiconductor and clean tech anchors.",
    },
    Defense: {
      name: "Camp Rilea Pacific Coast Training Expansion",
      description:
        "Expands Oregon National Guard's Camp Rilea to support Pacific Command exercises and tsunami response readiness.",
    },
    Technology: {
      name: "Silicon Forest Semiconductor Continuity",
      description:
        "Supports Intel's Hillsboro R&D campus and the surrounding semiconductor equipment supply chain through capital incentives.",
    },
    Social: {
      name: "Oregon Measure 110 Addiction Treatment Fund",
      description:
        "Directs cannabis tax revenues into the treatment, recovery, and harm reduction infrastructure mandated by Measure 110.",
    },
  },
  pa: {
    Climate: {
      name: "Pennsylvania RGGI Participation",
      description:
        "Implements Governor Shapiro's approach to carbon pricing for power sector while navigating legislative opposition.",
    },
    Healthcare: {
      name: "Pennsylvania Medicaid Managed Care Reform",
      description:
        "Reforms the HealthChoices managed care program to improve behavioral health carve-in integration and quality.",
    },
    Infrastructure: {
      name: "Pennsylvania bridge Rebuilding Program",
      description:
        "Executes the largest state highway and bridge rebuild in 40 years using a bundled design-build approach for 1,200 bridges.",
    },
    Education: {
      name: "Pennsylvania Basic Education Funding Reform",
      description:
        "Implements the court-ordered funding equity mandate ensuring Pennsylvania's poorest districts receive adequate state support.",
    },
    Economy: {
      name: "Pennsylvania Manufacturing Renaissance Fund",
      description:
        "Attracts advanced manufacturing back to the Rust Belt corridor from Pittsburgh to Philadelphia with targeted incentives.",
    },
    Defense: {
      name: "Tobyhanna Army Depot Technology Refresh",
      description:
        "Upgrades Tobyhanna Army Depot's electronics and communications systems repair capability for modern battlefield equipment.",
    },
    Technology: {
      name: "Pittsburgh Autonomous Vehicle Corridor",
      description:
        "Designates Pittsburgh's hill-and-bridge network as a premier autonomous vehicle testing and development environment.",
    },
    Social: {
      name: "Philadelphia Anti-Poverty Action Plan",
      description:
        "Addresses Philadelphia's nation-leading big-city poverty rate of 21% with workforce, housing, and family support.",
    },
  },
  ri: {
    Climate: {
      name: "Rhode Island Offshore Wind Development",
      description:
        "Builds on Block Island 's pioneering offshore wind farm by contracting additional capacity for the New England grid.",
    },
    Healthcare: {
      name: "Rhode Island Unified Health Infrastructure",
      description:
        "Upgrades Rhode Island's linked health data system enabling population health management across all payers.",
    },
    Infrastructure: {
      name: "Providence Train Station & I-195 Corridor",
      description:
        "Redevelops the former I-195 corridor and modernizes Providence Station to become a transit-oriented innovation district.",
    },
    Education: {
      name: "Rhode Island College Promise Scholarship",
      description:
        "Provides last-dollar scholarships at CCRI and RIC to make community and state college effectively tuition-free.",
    },
    Economy: {
      name: "Rhode Island Ocean Economy Strategy",
      description:
        "Develops blue economy sectors including ocean science, offshore wind, and marine tech around Narragansett Bay.",
    },
    Defense: {
      name: "Naval Station Newport Officer Education Hub",
      description:
        "Maintains and expands Naval Station Newport's role as the Navy's officer professional development and war gaming center.",
    },
    Technology: {
      name: "Brown University Innovation District",
      description:
        "Partners Brown University and RISD with the Providence startup community to commercialize design and biotech innovations.",
    },
    Social: {
      name: "Rhode Island Central Falls Community Recovery Fund",
      description:
        "Invests in economic opportunity and community development in Central Falls, the state's most densely populated city.",
    },
  },
  sc: {
    Climate: {
      name: "South Carolina Resilient Coastal Communities",
      description:
        "Manages accelerating shoreline erosion on the Sea Islands and Myrtle Beach areas with nature-based coastal defenses.",
    },
    Healthcare: {
      name: "SC Rural Hospital Incentive Program",
      description:
        "Offers loan forgiveness and recruitment bonuses to attract physicians and nurses to South Carolina's rural hospital deserts.",
    },
    Infrastructure: {
      name: "Port of Charleston Deepening & Expansion",
      description:
        "Completes harbor deepening enabling Neo-Panamax vessels to call at Charleston's Leatherman Terminal at full capacity.",
    },
    Education: {
      name: "SC Read to Succeed Literacy Act",
      description:
        "Sustains SC's early literacy law requiring grade-level reading by end of third grade with retention and support tools.",
    },
    Economy: {
      name: "SC Boeing & Advanced Manufacturing Growth",
      description:
        "Deepens the aerospace manufacturing cluster anchored by Boeing 787 Dreamliner final assembly in North Charleston.",
    },
    Defense: {
      name: "Shaw AFB Ninth Air Force Readiness",
      description:
        "Maintains Ninth Air Force's A-10 and F-16 training programs at Shaw AFB under evolving air superiority threats.",
    },
    Technology: {
      name: "SC Cybersecurity Center of Excellence",
      description:
        "Builds a state cybersecurity workforce through Clemson and USC partnerships serving financial and defense tech industries.",
    },
    Social: {
      name: "SC Rural Broadband and Telehealth Initiative",
      description:
        "Connects the telehealth infrastructure needed for South Carolina's isolated rural patients to specialist care remotely.",
    },
  },
  sd: {
    Climate: {
      name: "South Dakota Wind Energy Leadership Plan",
      description:
        "Positions South Dakota to export surplus wind energy via new transmission lines to neighboring load centers.",
    },
    Healthcare: {
      name: "South Dakota Native Health Equality Plan",
      description:
        "Closes the 10-year life expectancy gap between reservation communities and non-tribal South Dakotans.",
    },
    Infrastructure: {
      name: "South Dakota Roads for Economic Growth",
      description:
        "Upgrades the secondary road network connecting South Dakota's grain elevators and livestock yards to I-90 and I-29.",
    },
    Education: {
      name: "SD Teacher Compensation Initiative",
      description:
        "Raises teacher pay toward the national average after South Dakota ranked last among states for decades.",
    },
    Economy: {
      name: "South Dakota Financial Services Hub",
      description:
        "Maintains the competitive banking laws that have made South Dakota a leading home for national credit card and banking companies.",
    },
    Defense: {
      name: "Ellsworth AFB B-21 Raider Beddown",
      description:
        "Manages the operational conversion of Ellsworth Air Force Base from B-1B Lancers to B-21 Raider stealth bombers.",
    },
    Technology: {
      name: "South Dakota Crop Data Analytics Center",
      description:
        "Creates a state-backed agricultural data center enabling precision analytics for South Dakota's soy and corn farmers.",
    },
    Social: {
      name: "Pine Ridge Reservation Economic Development",
      description:
        "Provides capital, infrastructure, and business support to Pine Ridge, one of the nation's most economically distressed communities.",
    },
  },
  tn: {
    Climate: {
      name: "Tennessee Valley Clean Energy Partnership",
      description:
        "Coordinates with TVA to accelerate decarbonization of Tennessee's utility grid through nuclear expansion and solar.",
    },
    Healthcare: {
      name: "Tennessee TennCare Innovation Waiver",
      description:
        "Tests global budgeting and integrated care delivery models within TennCare to improve outcomes and slow cost growth.",
    },
    Infrastructure: {
      name: "Nashville Transit Now",
      description:
        "Advances multi-modal transit for the Nashville metro after years of failed referenda and explosive population growth.",
    },
    Education: {
      name: "Tennessee Drive to 55 Alliance",
      description:
        "Pursues the goal of 55% of Tennesseans holding a post-secondary credential by 2025 through DegreeNow and TN Promise.",
    },
    Economy: {
      name: "Tennessee EV & Battery Supply Chain",
      description:
        "Leverages Ford BlueOval City in Stanton and Volkswagen in Chattanooga to build the EV manufacturing workforce.",
    },
    Defense: {
      name: "Arnold Engineering Development Complex Growth",
      description:
        "Expands AEDC's aerospace testing capabilities, which support every major US military and commercial aircraft program.",
    },
    Technology: {
      name: "Nashville Health IT Innovation District",
      description:
        "Positions Nashville's HCA-anchored health management industry as a hub for health information technology startups.",
    },
    Social: {
      name: "Tennessee Rural Mental Health and Addiction Recovery",
      description:
        "Funds county-based mental health courts, crisis stabilization units, and peer recovery programs across rural Tennessee.",
    },
  },
  tx: {
    Climate: {
      name: "ERCOT Grid Storm Hardening Act",
      description:
        "Implements weatherization mandates for Texas power plants following the catastrophic February 2021 winter storm failure.",
    },
    Healthcare: {
      name: "Texas DSH Hospital Supplemental Funding",
      description:
        "Secures federal disproportionate share funding for Texas's safety-net hospitals serving the state's 5M uninsured residents.",
    },
    Infrastructure: {
      name: "Texas TxDOT Unified Transportation Program",
      description:
        "Executes Texas' $100B 10-year transportation plan targeting I-35 expansion and border port-of-entry upgrades.",
    },
    Education: {
      name: "Texas House Bill 3 Funding Reform",
      description:
        "Sustains HB 3's historic teacher pay raises and early literacy funding amid property tax compression pressures.",
    },
    Economy: {
      name: "Texas Semiconductor & AI Manufacturing Cluster",
      description:
        "Builds on TSMC, Samsung, and Texas Instruments investments to create a full semiconductor ecosystem in Central Texas.",
    },
    Defense: {
      name: "Fort Cavazos Armored Brigade Readiness",
      description:
        "Maintains Fort Cavazos's III Corps armored readiness and supports the rotation of NATO commitment forces through Texas.",
    },
    Technology: {
      name: "Austin-San Antonio Tech Corridor Expansion",
      description:
        "Bridges Austin's Corridor 130 tech cluster with San Antonio's cybersecurity cluster through joint infrastructure investment.",
    },
    Social: {
      name: "Texas Border Humanitarian Response",
      description:
        "Expands state-funded migrant processing capacity and provides humanitarian services at Texas's Rio Grande crossings.",
    },
  },
  ut: {
    Climate: {
      name: "Utah Water Conservation Mandate",
      description:
        "Requires per-capita water use reductions across Utah's municipalities as Great Salt Lake levels reach historic lows.",
    },
    Healthcare: {
      name: "Utah Medicaid Expansion Full Implementation",
      description:
        "Shifts Utah from a partial to full Medicaid expansion following voter approval to cover all adults to 138% FPL.",
    },
    Infrastructure: {
      name: "Utah FrontRunner Rail Frequency Increase",
      description:
        "Increases FrontRunner commuter rail service frequency along the Wasatch Front to compete with I-15 congestion.",
    },
    Education: {
      name: "Utah Dual Enrollment College Concurrent Act",
      description:
        "Expands college concurrent enrollment to every Utah high school so all students can earn college credits before graduation.",
    },
    Economy: {
      name: "Silicon Slopes Expansion Initiative",
      description:
        "Deepens the Lehi-Provo tech corridor with hyper-growth policies attracting tech headquarters formerly based in California.",
    },
    Defense: {
      name: "Hill AFB F-35 Operations Group Expansion",
      description:
        "Supports Hill Air Force Base's growing F-35 fleet and its role as the primary USAF F-35 depot maintenance center.",
    },
    Technology: {
      name: "Utah AI & Machine Learning Research Center",
      description:
        "Partners the University of Utah and BYU with Silicon Slopes companies on AI and computer science research programs.",
    },
    Social: {
      name: "Utah Refugee Resettlement Integration Plan",
      description:
        "Integrates Utah's large refugee population — among the highest per-capita nationally — through workforce and education programs.",
    },
  },
  vt: {
    Climate: {
      name: "Vermont Climate Action Plan Implementation",
      description:
        "Executes Vermont's nation-leading climate commitment to reduce emissions 26% below 2005 levels by 2025.",
    },
    Healthcare: {
      name: "Vermont Green Mountain Care Sustainability",
      description:
        "Sustains Vermont's all-payer Accountable Care Organization model and explores expanded public option alternatives.",
    },
    Infrastructure: {
      name: "Vermont Road Flood Resilience Program",
      description:
        "Rebuilds roads and bridges after repeated severe flooding events that have damaged Vermont's rural road network.",
    },
    Education: {
      name: "Vermont Act 46 District Consolidation",
      description:
        "Implements school district consolidation to address declining enrollment and unsustainable property tax burdens statewide.",
    },
    Economy: {
      name: "Vermont Creative Economy Development Plan",
      description:
        "Supports Vermont's craft beverage, food artisan, and outdoor recreation sectors that anchor the rural creative economy.",
    },
    Defense: {
      name: "Burlington VTANG F-35 Integration",
      description:
        "Manages the political and operational integration of F-35A aircraft at Burlington International Airport's Air National Guard base.",
    },
    Technology: {
      name: "Vermont Remote Work Welcome Center",
      description:
        "Markets Vermont as a destination for remote tech workers through relocation incentives and broadband investment.",
    },
    Social: {
      name: "Vermont Opioid Abatement Authority",
      description:
        "Directs opioid settlement funds into Vermont's nationally recognized hub-and-spoke addiction treatment model.",
    },
  },
  va: {
    Climate: {
      name: "Virginia Clean Economy Act Execution",
      description:
        "Implements Virginia's law requiring 100% clean electricity by 2045 and 30% offshore wind by 2030.",
    },
    Healthcare: {
      name: "Virginia Medicaid Expansion & Second Chance",
      description:
        "Sustains Virginia's 2019 Medicaid expansion while adding work requirement waivers for justice-involved individuals.",
    },
    Infrastructure: {
      name: "I-66 & I-95 Northern Virginia Express",
      description:
        "Expands Northern Virginia's managed lanes network to handle the nation's second-worst commuter congestion.",
    },
    Education: {
      name: "Virginia 3rd Grade Reading Guarantee",
      description:
        "Implements Virginia's early literacy reform requiring structured phonics instruction and grade-level proficiency by 3rd grade.",
    },
    Economy: {
      name: "Virginia Quantum Initiative",
      description:
        "Positions Northern Virginia's defense tech and data center ecosystem as an early leader in quantum computing applications.",
    },
    Defense: {
      name: "Pentagon Force Protection Agency Modernization",
      description:
        "Upgrades the physical security, screening, and cyber monitoring systems for the Pentagon campus and reservation.",
    },
    Technology: {
      name: "Northern Virginia Data Center Leadership Strategy",
      description:
        "Manages the world's largest data center market responsibly through energy, zoning, and fiber policies.",
    },
    Social: {
      name: "Virginia Eviction Prevention & Diversion",
      description:
        "Scales the Virginia Rent Relief Program that became a national model for rapid-response eviction prevention.",
    },
  },
  wa: {
    Climate: {
      name: "Washington Climate Commitment Act Cap-and-Trade",
      description:
        "Operates Washington's cap-and-invest carbon market, directing revenues into clean transportation and environmental justice.",
    },
    Healthcare: {
      name: "Washington Cascade Care Public Option",
      description:
        "Offers the nation's first state-designed public health option on the exchange with negotiated provider rates.",
    },
    Infrastructure: {
      name: "SR-99 Tunnel & Seattle Surface Rebuild",
      description:
        "Completes surface street investments following the Alaskan Way Viaduct replacement with the SR-99 deep-bore tunnel.",
    },
    Education: {
      name: "Washington College Grant Expansion",
      description:
        "Increases the income threshold for Washington's need-based college grant to make college affordable for middle-income families.",
    },
    Economy: {
      name: "Washington Aerospace & Defense Cluster",
      description:
        "Protects Boeing's supply chain and deepens the commercial space and defense technology ecosystem in the Puget Sound.",
    },
    Defense: {
      name: "Naval Base Kitsap Trident Submarine Support",
      description:
        "Maintains the strategic infrastructure supporting Trident ballistic missile submarines homeported at Naval Base Kitsap-Bangor.",
    },
    Technology: {
      name: "Washington Clean Tech & AI Growth Strategy",
      description:
        "Aligns Microsoft, Amazon, and a growing AI startup ecosystem with state investment in clean technology applications.",
    },
    Social: {
      name: "Washington Covenant Scholarship Act",
      description:
        "Provides tuition-free college to Washington students from low- and middle-income families who commit to in-state careers.",
    },
  },
  wv: {
    Climate: {
      name: "West Virginia RECLAIM Act Remediation",
      description:
        "Funds reclamation of abandoned mine lands statewide to prevent acid drainage, flooding, and community health hazards.",
    },
    Healthcare: {
      name: "West Virginia AllPayer Claims Database",
      description:
        "Uses comprehensive claims data to address WV's worst-in-nation health outcomes and direct treatment resources efficiently.",
    },
    Infrastructure: {
      name: "Corridor H Appalachian Highway Completion",
      description:
        "Completes West Virginia's final segment of the Appalachian Development Highway System connecting rural counties to the I-81 spine.",
    },
    Education: {
      name: "West Virginia Hope Scholarship",
      description:
        "Allows WV families to use state education funds for private, homeschool, or specialized education options.",
    },
    Economy: {
      name: "West Virginia Hydrogen Hub Development",
      description:
        "Positions WV's natural gas and industrial pipeline infrastructure as a platform for clean hydrogen production and export.",
    },
    Defense: {
      name: "WV National Guard Chemical-Biological Response",
      description:
        "Trains and equips West Virginia National Guard CBRN units for domestic chemical-biological incident response.",
    },
    Technology: {
      name: "West Virginia Broadband Enhancement Council",
      description:
        "Coordinates federal and state broadband funding to close WV's 33%-unserved household gap through a statewide plan.",
    },
    Social: {
      name: "West Virginia Substance Use Recovery Ecosystem",
      description:
        "Builds a statewide network of recovery COACH programs, sober housing, and recovery-friendly employers across all 55 counties.",
    },
  },
  wi: {
    Climate: {
      name: "Wisconsin Clean Energy Future Act",
      description:
        "Establishes a voluntary 100% clean electricity goal for Wisconsin utilities by 2050 with milestones reviewable by the PSC.",
    },
    Healthcare: {
      name: "Wisconsin Medicaid BadgerCare Plus Expansion",
      description:
        "Examines full Medicaid expansion as the BadgerCare gap leaves 90,000 Wisconsinites without coverage options.",
    },
    Infrastructure: {
      name: "Wisconsin highways & Freight Corridor Plan",
      description:
        "Executes WisDOT's highway system plan with emphasis on the I-94 Fox Valley corridor and Madison beltline.",
    },
    Education: {
      name: "Wisconsin Reading First Literacy Initiative",
      description:
        "Implements early literacy screening and evidence-based reading instruction requirements in Wisconsin K-3 classrooms.",
    },
    Economy: {
      name: "Wisconsin Foxconn Site Redevelopment Strategy",
      description:
        "Repurposes the former Foxconn site in Racine County into a diversified tech and manufacturing campus.",
    },
    Defense: {
      name: "Volk Field Combat Readiness Training Upgrade",
      description:
        "Modernizes Volk Field's air combat range facilities to support F-35 transition training for ANG units.",
    },
    Technology: {
      name: "Milwaukee Water Technology Hub",
      description:
        "Expands Milwaukee's water technology cluster led by A.O. Smith into a global center for municipal water innovation.",
    },
    Social: {
      name: "Wisconsin Milwaukee Violence Interruption Program",
      description:
        "Expands community-based credible messenger and violence interruption programs in Milwaukee's highest-violence districts.",
    },
  },
  wy: {
    Climate: {
      name: "Wyoming Coal Carbon Capture Initiative",
      description:
        "Invests in carbon capture and sequestration technology at Wyoming's Dry Fork coal plant to demonstrate low-carbon coal.",
    },
    Healthcare: {
      name: "Wyoming Rural Health Access Compact",
      description:
        "Uses interstate medical licensing compacts and telemedicine to counter Wyoming's extreme rural physician-to-patient distances.",
    },
    Infrastructure: {
      name: "Wyoming Gas Gathering Pipeline Upgrade",
      description:
        "Upgrades natural gas gathering pipelines in the Pinedale Anticline to reduce methane venting from wellpads.",
    },
    Education: {
      name: "Wyoming Heritage Scholarship",
      description:
        "Offers in-state tuition scholarships to Wyoming graduates who commit to careers in the state's priority economic sectors.",
    },
    Economy: {
      name: "Wyoming Diversification Beyond Coal and Gas",
      description:
        "Develops outdoor recreation, data centers, and advanced manufacturing as alternative economic pillars beyond mineral extraction.",
    },
    Defense: {
      name: "F.E. Warren AFB Sentinel ICBM Conversion",
      description:
        "Manages F.E. Warren Air Force Base's transition from aging Minuteman III to the next-generation Sentinel ICBM system.",
    },
    Technology: {
      name: "Wyoming Carbon Utilization Research Center",
      description:
        "Creates a center for carbon utilization research converting captured CO2 into fuels, materials, and agricultural inputs.",
    },
    Social: {
      name: "Wyoming Wind River Reservation Services",
      description:
        "Improves state-delivered healthcare, education, and housing services to the Eastern Shoshone and Northern Arapaho on Wind River.",
    },
  },
};

// Fallback generic pool for states not in the specific map
const STATE_POLICIES: Record<
  PolicyCategory,
  Array<{ name: string; description: string }>
> = {
  Climate: [
    {
      name: "Clean Air Initiative",
      description:
        "Reduces industrial emissions and improves air quality standards statewide.",
    },
    {
      name: "Renewable Portfolio Standard",
      description:
        "Mandates a percentage of electricity from renewable sources by a set deadline.",
    },
  ],
  Healthcare: [
    {
      name: "Medicaid Expansion Program",
      description:
        "Extends Medicaid eligibility to cover more low-income residents.",
    },
    {
      name: "Public Health Modernization",
      description:
        "Upgrades public health systems and data infrastructure across the state.",
    },
  ],
  Infrastructure: [
    {
      name: "Roads & Bridges Overhaul",
      description:
        "Repairs and upgrades aging highway and bridge infrastructure.",
    },
    {
      name: "Broadband Expansion Plan",
      description:
        "Extends high-speed internet access to rural and underserved communities.",
    },
  ],
  Education: [
    {
      name: "K-12 Excellence Fund",
      description:
        "Boosts per-pupil spending and teacher retention in public schools.",
    },
    {
      name: "Early Childhood Literacy",
      description:
        "Invests in pre-K reading programs to close the early literacy gap.",
    },
  ],
  Economy: [
    {
      name: "Small Business Growth Act",
      description:
        "Provides grants and tax credits to support small business formation.",
    },
    {
      name: "Job Creation Fund",
      description:
        "Partners with private sector to attract investment and create jobs.",
    },
  ],
  Defense: [
    {
      name: "National Guard Readiness",
      description:
        "Improves training, equipment, and mobilization capacity of the National Guard.",
    },
    {
      name: "Cybersecurity Shield",
      description:
        "Strengthens state cybersecurity defenses against foreign and domestic threats.",
    },
  ],
  Technology: [
    {
      name: "Digital Transformation Fund",
      description:
        "Digitalizes government services to improve efficiency and accessibility.",
    },
    {
      name: "Broadband for All",
      description:
        "Ensures universal access to high-speed internet for residents and businesses.",
    },
  ],
  Social: [
    {
      name: "Affordable Housing Act",
      description:
        "Increases housing supply and prevents displacement of low-income residents.",
    },
    {
      name: "Food Security Program",
      description:
        "Expands food assistance and supports local food banks and nutrition access.",
    },
  ],
};

// ── Country-specific policy descriptions ─────────────────────────────────────
const COUNTRY_SPECIFIC_POLICIES: Record<
  string,
  Record<PolicyCategory, { name: string; description: string }>
> = {
  // ── G20 + Major Economies ─────────────────────────────────────────────────
  us: {
    Climate: {
      name: "Inflation Reduction Act Clean Energy",
      description:
        "Deploys $369B in clean energy tax credits to accelerate US solar, wind, and EV adoption.",
    },
    Healthcare: {
      name: "ACA Marketplace Stabilization",
      description:
        "Extends enhanced premium subsidies and expands Medicaid to close the remaining coverage gap.",
    },
    Infrastructure: {
      name: "Bipartisan Infrastructure Law",
      description:
        "Invests $1.2T in roads, bridges, broadband, water systems, and the electric grid.",
    },
    Education: {
      name: "FAFSA Simplification & Pell Expansion",
      description:
        "Streamlines federal student aid and increases Pell Grant maximums for low-income students.",
    },
    Economy: {
      name: "CHIPS and Science Act",
      description:
        "Provides $52B to reshore semiconductor manufacturing and fund domestic R&D at national labs.",
    },
    Defense: {
      name: "National Defense Authorization Act",
      description:
        "Funds a $886B defense budget prioritizing Indo-Pacific posture, hypersonics, and cyber readiness.",
    },
    Technology: {
      name: "Executive Order on Safe AI",
      description:
        "Requires safety evaluations, federal standards, and transparency for advanced AI systems.",
    },
    Social: {
      name: "American Rescue Plan Housing Aid",
      description:
        "Channels $45B in emergency rental assistance to prevent mass eviction and housing instability.",
    },
  },
  cn: {
    Climate: {
      name: "Dual Carbon Goals Strategy",
      description:
        "Pursues peak CO2 emissions before 2030 and carbon neutrality by 2060 through massive renewables build-out.",
    },
    Healthcare: {
      name: "Healthy China 2030 Plan",
      description:
        "Expands rural healthcare infrastructure and raises life expectancy through nationwide wellness initiatives.",
    },
    Infrastructure: {
      name: "Belt and Road Domestic Corridor",
      description:
        "Accelerates domestic high-speed rail and highway grid completion connecting inland provinces to coastal hubs.",
    },
    Education: {
      name: "Double Reduction Education Policy",
      description:
        "Limits after-school tutoring and homework to reduce academic pressure on primary school students.",
    },
    Economy: {
      name: "Made in China 2025 Advanced Manufacturing",
      description:
        "Drives domestic self-sufficiency in semiconductors, aerospace, and robotics to reduce tech import dependence.",
    },
    Defense: {
      name: "PLA Modernization 2035 Program",
      description:
        "Upgrades the People's Liberation Army with hypersonic missiles, stealth aircraft, and space-based warfare capabilities.",
    },
    Technology: {
      name: "New Generation AI Development Plan",
      description:
        "Positions China as the global AI leader by 2030 through centralized research funding and data governance.",
    },
    Social: {
      name: "Common Prosperity Initiative",
      description:
        "Redistributes wealth through tax reform, charitable donations, and housing controls to narrow inequality.",
    },
  },
  de: {
    Climate: {
      name: "Energiewende Phase III",
      description:
        "Accelerates Germany's transition from nuclear and coal to offshore wind, green hydrogen, and district heating.",
    },
    Healthcare: {
      name: "Statutory Health Insurance Reform",
      description:
        "Stabilizes GKV premiums and expands mental health coverage under Germany's dual public-private system.",
    },
    Infrastructure: {
      name: "Deutschlandtakt Rail Upgrade",
      description:
        "Implements integrated timed rail schedules and track capacity expansion connecting 200 German cities.",
    },
    Education: {
      name: "National Vocational Training Pact",
      description:
        "Partners German industry with the Dual System to train 1.3M apprentices annually in shortage occupations.",
    },
    Economy: {
      name: "National Industrial Strategy 2030",
      description:
        "Identifies strategic industries including automotive, chemicals, and machinery for targeted state support.",
    },
    Defense: {
      name: "Zeitenwende Defense Investment",
      description:
        "Commits €100B Sondervermögen special fund to modernize Bundeswehr equipment and meet NATO's 2% GDP target.",
    },
    Technology: {
      name: "German AI Strategy",
      description:
        "Invests €5B to build competitive AI research centers and ethical AI standards for European leadership.",
    },
    Social: {
      name: "Housing Benefit Plus Expansion",
      description:
        "Triples Wohngeld recipients and raises thresholds to protect renters from Germany's surging housing costs.",
    },
  },
  jp: {
    Climate: {
      name: "Green Transformation GX Strategy",
      description:
        "Mobilizes ¥150T over 10 years to decarbonize Japan's energy-intensive economy through hydrogen and nuclear restart.",
    },
    Healthcare: {
      name: "Universal Health Insurance Sustainability",
      description:
        "Addresses financing shortfalls in Japan's universal health insurance as the population rapidly ages.",
    },
    Infrastructure: {
      name: "Linear Chuo Shinkansen Construction",
      description:
        "Builds the maglev Linear Chuo Shinkansen connecting Tokyo and Osaka in 67 minutes by 2037.",
    },
    Education: {
      name: "GIGA School Digital Learning Plan",
      description:
        "Provides every Japanese student with a device and high-speed connectivity for personalized digital learning.",
    },
    Economy: {
      name: "New Capitalism Growth Strategy",
      description:
        "Stimulates wage growth, startup investment, and regional economic revitalization through targeted fiscal policy.",
    },
    Defense: {
      name: "Japan Defense Capability Enhancement Plan",
      description:
        "Doubles defense spending to 2% of GDP and acquires counterstrike missile capability for the first time.",
    },
    Technology: {
      name: "Moonshot R&D Program",
      description:
        "Funds moonshot research targeting quantum computing, carbon-neutral energy, and AI-human collaboration.",
    },
    Social: {
      name: "Declining Birthrate Emergency Measures",
      description:
        "Triples childcare funding and expands parental leave to reverse Japan's historic fertility rate decline.",
    },
  },
  in: {
    Climate: {
      name: "National Solar Mission Scale-Up",
      description:
        "Targets 500 GW of renewable capacity by 2030, anchored by Rajasthan's solar parks and offshore wind.",
    },
    Healthcare: {
      name: "Ayushman Bharat PM-JAY Expansion",
      description:
        "Extends free hospital care to 500M Indians under the world's largest health assurance scheme.",
    },
    Infrastructure: {
      name: "PM Gati Shakti National Master Plan",
      description:
        "Coordinates multimodal transport infrastructure across rail, road, ports, and logistics parks using GIS mapping.",
    },
    Education: {
      name: "National Education Policy 2020 Implementation",
      description:
        "Transforms India's school and higher education system toward multidisciplinary, foundational literacy-first learning.",
    },
    Economy: {
      name: "Production Linked Incentive Scheme",
      description:
        "Offers $26B in output-linked incentives to grow domestic manufacturing in 14 sectors from smartphones to textiles.",
    },
    Defense: {
      name: "Atmanirbhar Bharat Defence Indigenization",
      description:
        "Bans 101 defense imports and funds indigenous production of fighter jets, submarines, and missiles.",
    },
    Technology: {
      name: "Digital India Mission",
      description:
        "Digitizes government services and expands internet access to 800M citizens through fiber and mobile broadband.",
    },
    Social: {
      name: "PM Awas Yojana Housing for All",
      description:
        "Constructs 20M affordable homes for the urban and rural poor under India's flagship housing mission.",
    },
  },
  gb: {
    Climate: {
      name: "UK Net Zero Strategy",
      description:
        "Charts Britain's path to net-zero emissions by 2050 with offshore wind, hydrogen, and heat pump expansion.",
    },
    Healthcare: {
      name: "NHS 10-Year Workforce Plan",
      description:
        "Trains 300,000 additional NHS staff over a decade to address record waiting lists and staff shortages.",
    },
    Infrastructure: {
      name: "HS2 Phase 1 Delivery",
      description:
        "Completes the London-Birmingham high-speed rail segment while reassessing northern extensions.",
    },
    Education: {
      name: "Levelling Up Skills Bootcamps",
      description:
        "Funds free short-course training for adults in digital, green, and technical skills linked to employer vacancies.",
    },
    Economy: {
      name: "UK Industrial Strategy Green Book",
      description:
        "Targets advanced manufacturing, life sciences, and clean energy as priority growth sectors for public co-investment.",
    },
    Defense: {
      name: "Integrated Review Refresh 2023",
      description:
        "Elevates NATO commitments and Indo-Pacific engagement while increasing defense spending to £100B annually.",
    },
    Technology: {
      name: "Pro-Innovation AI Regulation Framework",
      description:
        "Assigns AI oversight to existing regulators rather than a new body, prioritizing innovation over precaution.",
    },
    Social: {
      name: "Rough Sleeping Strategy",
      description:
        "Targets ending rough sleeping with Housing First pilots, mental health outreach, and local authority funding.",
    },
  },
  fr: {
    Climate: {
      name: "France Relance Green Component",
      description:
        "Channels €30B of stimulus into building renovation, hydrogen, and biodiversity to meet 2030 climate targets.",
    },
    Healthcare: {
      name: "Ma Santé 2022 Healthcare Reform",
      description:
        "Restructures French healthcare around territorial health hubs to reduce hospital over-dependence.",
    },
    Infrastructure: {
      name: "Grand Paris Express Metro Extension",
      description:
        "Builds 200 km of new automatic metro lines around Paris, the largest urban transit project in Europe.",
    },
    Education: {
      name: "Reform of Lycée & Baccalaureate",
      description:
        "Replaces France's traditional baccalauréat with a continuous assessment and specialization-based model.",
    },
    Economy: {
      name: "France 2030 Industrial Investment Plan",
      description:
        "Commits €54B to reindustrialize France in green tech, semiconductors, health, and culture sectors.",
    },
    Defense: {
      name: "Loi de Programmation Militaire 2024-2030",
      description:
        "Budgets €413B over seven years to modernize French nuclear deterrence, space, and cyber capabilities.",
    },
    Technology: {
      name: "French National AI Strategy",
      description:
        "Establishes a €1.5B national AI plan anchored by INRIA research centers and Paris's Station F startups.",
    },
    Social: {
      name: "Plan Pauvreté Social Investment",
      description:
        "Invests in early childhood, youth employment, and poverty prevention to reduce France's social exclusion rate.",
    },
  },
  br: {
    Climate: {
      name: "Amazon Fund Reactivation",
      description:
        "Reactivates Norway and Germany co-funded Amazon Fund to halt deforestation and support forest communities.",
    },
    Healthcare: {
      name: "SUS Universal Health System Expansion",
      description:
        "Increases funding for Brazil's SUS public health system to cut regional access disparities.",
    },
    Infrastructure: {
      name: "PAC Infrastructure Acceleration Program",
      description:
        "Revives the $350B Growth Acceleration Program targeting energy, sanitation, and transport projects.",
    },
    Education: {
      name: "Compromisso Nacional Criança Alfabetizada",
      description:
        "Guarantees all Brazilian children are literate by age 8 through structured phonics-based instruction.",
    },
    Economy: {
      name: "Nova Industria Brasil Manufacturing Policy",
      description:
        "Channels public bank lending into decarbonizing industry, agro-industry modernization, and deep-sea oil.",
    },
    Defense: {
      name: "SISFRON Border Monitoring System",
      description:
        "Expands SISFRON sensor networks along Brazil's 16,000 km land border to combat illegal trade and deforestation.",
    },
    Technology: {
      name: "Brazil's Artificial Intelligence Strategy",
      description:
        "Coordinates federal AI investment through MCTI with applications in agriculture, health, and public services.",
    },
    Social: {
      name: "Bolsa Família Expanded Program",
      description:
        "Reactivates and expands Bolsa Família cash transfers to 21M families with added food and education bonuses.",
    },
  },
  it: {
    Climate: {
      name: "PNIEC National Energy-Climate Plan",
      description:
        "Sets Italy's path to 65% renewable electricity by 2030 while phasing out coal plants.",
    },
    Healthcare: {
      name: "Piano Nazionale di Ripresa Sanità",
      description:
        "Uses PNRR recovery funds to modernize Italy's NHS facilities and reduce North-South healthcare inequality.",
    },
    Infrastructure: {
      name: "Ponte sullo Stretto di Messina",
      description:
        "Revives construction of the Strait of Messina bridge connecting Sicily to mainland Italy.",
    },
    Education: {
      name: "Piano Scuola 4.0 Digital Transformation",
      description:
        "Converts Italian classrooms into collaborative digital learning environments using €2.1B PNRR funding.",
    },
    Economy: {
      name: "Piano Transizione 5.0 Industry Incentives",
      description:
        "Extends tax credits for Italian firms investing in energy efficiency and digital-green integrated upgrades.",
    },
    Defense: {
      name: "Italy NATO 2% Commitment Plan",
      description:
        "Increases Italian defense spending toward NATO's GDP threshold with focus on joint interoperability.",
    },
    Technology: {
      name: "Italian National Supercomputing Center",
      description:
        "Operates the Leonardo supercomputer in Bologna to advance AI research, climate modeling, and drug discovery.",
    },
    Social: {
      name: "Piano Nazionale Contro la Povertà",
      description:
        "Implements Italy's Reddito di Inclusione and active labor market measures to cut severe deprivation rates.",
    },
  },
  ca_c: {
    Climate: {
      name: "Pan-Canadian Framework on Clean Growth",
      description:
        "Implements carbon pricing, clean fuel standards, and methane regulation across all provinces and territories.",
    },
    Healthcare: {
      name: "Canada's Dental Care Plan",
      description:
        "Provides public dental coverage to 9M uninsured Canadians under a landmark new federal program.",
    },
    Infrastructure: {
      name: "Investing in Canada Infrastructure Plan",
      description:
        "Directs $181B over 12 years to transit, green, social, and rural infrastructure priorities.",
    },
    Education: {
      name: "Canada Learning Bond Outreach",
      description:
        "Proactively enrolls low-income children in the Canada Learning Bond to build RESP education savings.",
    },
    Economy: {
      name: "Canadian Critical Minerals Strategy",
      description:
        "Positions Canada as a reliable supplier of lithium, cobalt, and nickel for global EV battery supply chains.",
    },
    Defense: {
      name: "NORAD Modernization Initiative",
      description:
        "Invests $40B to upgrade Canada's Arctic surveillance, Over-the-Horizon Radar, and interceptor capacity.",
    },
    Technology: {
      name: "Pan-Canadian Artificial Intelligence Strategy",
      description:
        "Funds CIFAR-led AI institutes in Montreal, Toronto, and Edmonton to sustain Canada's global AI research edge.",
    },
    Social: {
      name: "National Housing Strategy",
      description:
        "Commits $82B over 10 years to build 160,000 new homes, repair 300,000 units, and protect renters.",
    },
  },
  kr: {
    Climate: {
      name: "Korean Green New Deal",
      description:
        "Invests ₩73T in renewable energy, green buildings, and clean mobility to achieve 2050 carbon neutrality.",
    },
    Healthcare: {
      name: "K-바이오 Healthcare R&D Initiative",
      description:
        "Funds biotech and pharmaceutical innovation to position Korea as a global biologics and vaccine manufacturing hub.",
    },
    Infrastructure: {
      name: "GTX Metropolitan Express Network",
      description:
        "Builds three express underground rail corridors cutting commute times across the Seoul metropolitan area.",
    },
    Education: {
      name: "IB Programme National Expansion",
      description:
        "Scales the International Baccalaureate into Korean public schools to reduce exam-centric educational pressure.",
    },
    Economy: {
      name: "Korean Battery & Semiconductor Strategy",
      description:
        "Supports Samsung, SK Hynix, and LG Energy through tax credits and R&D co-investment in strategic technologies.",
    },
    Defense: {
      name: "Kill Chain & KAMD Defense Triad",
      description:
        "Accelerates indigenous missile defense, early warning, and counter-missile capabilities against North Korean threats.",
    },
    Technology: {
      name: "Digital New Deal 2.0",
      description:
        "Invests ₩49T in AI, cloud, data infrastructure, and 5G to digitalize the Korean economy.",
    },
    Social: {
      name: "Low Birthrate National Emergency Response",
      description:
        "Allocates ₩280T over five years to childcare, housing, and youth employment to reverse record-low fertility.",
    },
  },
  au: {
    Climate: {
      name: "Rewiring the Nation Electricity Plan",
      description:
        "Funds new transmission infrastructure to integrate 82% renewable electricity by 2030 into the NEM.",
    },
    Healthcare: {
      name: "Medicare Urgent Care Clinics",
      description:
        "Opens 50 new bulk-billing urgent care clinics to reduce unnecessary emergency department presentations.",
    },
    Infrastructure: {
      name: "Fast Rail Network Study",
      description:
        "Develops a national fast rail strategy connecting Sydney, Melbourne, Brisbane, and Canberra.",
    },
    Education: {
      name: "Universities Accord Implementation",
      description:
        "Raises the attainment target for Australians with a tertiary qualification to 80% by 2050.",
    },
    Economy: {
      name: "Future Made in Australia Act",
      description:
        "Provides $22.7B in production tax credits to build critical minerals processing and clean energy manufacturing.",
    },
    Defense: {
      name: "AUKUS Nuclear Submarine Pathway",
      description:
        "Implements the AUKUS agreement to acquire nuclear-powered submarines in partnership with the US and UK.",
    },
    Technology: {
      name: "National Quantum Strategy",
      description:
        "Positions Australia as a global quantum technology market leader through industry and research co-investment.",
    },
    Social: {
      name: "Closing the Gap Refresh Strategy",
      description:
        "Accelerates progress on 17 Aboriginal and Torres Strait Islander socioeconomic targets under the National Agreement.",
    },
  },
  es: {
    Climate: {
      name: "Ley de Cambio Climático y Transición Energética",
      description:
        "Mandates 74% renewable electricity by 2030 and bans new fossil fuel exploration in Spain.",
    },
    Healthcare: {
      name: "Spanish Mental Health Strategy",
      description:
        "Expands public mental health services and adds 1,000 clinical psychologists to Spain's NHS through 2025.",
    },
    Infrastructure: {
      name: "Spain Rail PERTE Railway Modernization",
      description:
        "Invests €12B in renewing Spain's 17,000 km conventional rail network with next-generation signalling.",
    },
    Education: {
      name: "LOMLOE Education Law Implementation",
      description:
        "Restructures Spain's educational system with student-centered learning, bilingual programs, and STEM integration.",
    },
    Economy: {
      name: "Spain Digital Decade Industrial PERTE",
      description:
        "Channels PERTE strategic project funds into EV production, semiconductors, and hydrogen green industries.",
    },
    Defense: {
      name: "Plan DIANA Defense Innovation Fund",
      description:
        "Mirrors NATO's DIANA fund at the national level to accelerate dual-use technology development in Spain.",
    },
    Technology: {
      name: "Spain National AI Strategy ENIA",
      description:
        "Allocates €600M to build AI talent pipelines, regulatory capacity, and public-sector AI deployment.",
    },
    Social: {
      name: "Ingreso Mínimo Vital Basic Income",
      description:
        "Provides a minimum vital income to Spain's 1.5M most vulnerable households to eliminate extreme poverty.",
    },
  },
  mx_c: {
    Climate: {
      name: "Mexico Nationally Determined Contribution",
      description:
        "Commits Mexico to 35% clean energy by 2024 and net-zero by 2050, though implementation lags targets.",
    },
    Healthcare: {
      name: "IMSS Bienestar Universal Access",
      description:
        "Rolls out IMSS Bienestar to replace Seguro Popular and provide primary care to 52M uninsured Mexicans.",
    },
    Infrastructure: {
      name: "Tren Maya Railway Completion",
      description:
        "Completes the 1,554 km Tren Maya passenger and cargo railway across Mexico's Yucatán Peninsula.",
    },
    Education: {
      name: "Nueva Escuela Mexicana Curriculum",
      description:
        "Replaces Mexico's textbooks with community-oriented, critical thinking-based learning materials.",
    },
    Economy: {
      name: "Mexico Nearshoring Competitiveness Plan",
      description:
        "Prepares industrial parks, electricity, and water capacity in northern Mexico to capture relocating US supply chains.",
    },
    Defense: {
      name: "Guardia Nacional Border Security Mission",
      description:
        "Deploys the National Guard to curb cartel violence and irregular migration at Mexico's northern and southern borders.",
    },
    Technology: {
      name: "Mexico Digital Agenda 2024-2030",
      description:
        "Closes Mexico's 55% digital gap through community internet centers and universal mobile connectivity.",
    },
    Social: {
      name: "Sembrando Vida Rural Livelihoods",
      description:
        "Provides 420,000 rural smallholders with monthly payments and technical support to restore degraded land.",
    },
  },
  id_c: {
    Climate: {
      name: "Indonesia Just Energy Transition Partnership",
      description:
        "Mobilizes $20B from G7 countries to retire Sumatran coal plants and scale up Indonesia's renewable capacity.",
    },
    Healthcare: {
      name: "JKN Universal Health Coverage Expansion",
      description:
        "Strengthens Jaminan Kesehatan Nasional financial sustainability to maintain coverage for 260M Indonesians.",
    },
    Infrastructure: {
      name: "Nusantara Capital City Construction",
      description:
        "Builds Indonesia's new capital city on Borneo to relieve pressure on Jakarta's sinking coastline.",
    },
    Education: {
      name: "Merdeka Belajar Education Freedom Policy",
      description:
        "Reforms Indonesia's curriculum to reduce national examinations and promote project-based deeper learning.",
    },
    Economy: {
      name: "Nickel Downstreaming Industrialization",
      description:
        "Bans raw nickel ore exports to force domestic processing and capture battery-supply-chain value in Indonesia.",
    },
    Defense: {
      name: "Minimum Essential Force Modernization",
      description:
        "Upgrades the TNI with new fighter jets, submarines, and missile systems to meet the MEF target.",
    },
    Technology: {
      name: "Satu Data Indonesia Digital Governance",
      description:
        "Integrates government data across 34 ministries and 500 local governments into a single national platform.",
    },
    Social: {
      name: "Indonesia Zero Stunting 2024 Program",
      description:
        "Provides nutrition supplements, clean water, and sanitation to cut childhood stunting from 21% to 14%.",
    },
  },
  sa: {
    Climate: {
      name: "Saudi Green Initiative 2030",
      description:
        "Plants 10 billion trees, grows renewables to 50%, and captures 278M tons of CO₂ by 2030.",
    },
    Healthcare: {
      name: "Saudi Vision 2030 Health Privatization",
      description:
        "Transfers healthcare delivery to private operators while maintaining universal public financing through CCHI.",
    },
    Infrastructure: {
      name: "NEOM Giga-Project Development",
      description:
        "Constructs THE LINE, OXAGON, and SINDALAH as pillars of a $500B futuristic city in the Tabuk region.",
    },
    Education: {
      name: "Saudi Human Capital Transformation",
      description:
        "Overhauls university curricula and technical training to reduce youth unemployment among 12M nationals.",
    },
    Economy: {
      name: "Vision 2030 Economic Diversification",
      description:
        "Reduces oil's share of GDP from 42% to 16% through tourism, entertainment, mining, and manufacturing.",
    },
    Defense: {
      name: "Saudi Localized Defense Industry Program",
      description:
        "Grows domestic defense manufacturing to 50% localization through GAMI licensing and Vision 2030 partnerships.",
    },
    Technology: {
      name: "Saudi Data and AI Authority Strategy",
      description:
        "Invests $20B in AI infrastructure, data centers, and local AI talent through SDAIA and Aramco Digital.",
    },
    Social: {
      name: "Saudi Male Guardianship Reform Expansion",
      description:
        "Extends social and legal reforms enabling Saudi women greater economic participation and freedom of movement.",
    },
  },
  nl: {
    Climate: {
      name: "Netherlands Climate Agreement Implementation",
      description:
        "Executes binding sector-level CO2 targets across industry, agriculture, mobility, and the built environment.",
    },
    Healthcare: {
      name: "Dutch Long-Term Care Reform",
      description:
        "Restructures Wet langdurige zorg to improve home-based care and manage the cost of an aging population.",
    },
    Infrastructure: {
      name: "Netherlands Hydrogen Backbone Network",
      description:
        "Repurposes decommissioned gas pipelines into a national hydrogen transport backbone for industrial clusters.",
    },
    Education: {
      name: "Dutch Basic Skills Action Plan",
      description:
        "Tackles functional illiteracy among 250,000 Dutch adults with employer-led workplace literacy programs.",
    },
    Economy: {
      name: "National Growth Fund Technology Investment",
      description:
        "Allocates €20B to R&D, knowledge development, and physical infrastructure driving Dutch long-run growth.",
    },
    Defense: {
      name: "Netherlands NATO Adaptive Defense Plan",
      description:
        "Scales defense spending toward 2% GDP and positions Rotterdam as NATO's logistics and supply chain anchor.",
    },
    Technology: {
      name: "Dutch AI Coalition National Program",
      description:
        "Coordinates NWO, TNO, and the private sector around responsible AI and semiconductor photolithography leadership.",
    },
    Social: {
      name: "National Action Program Discrimination",
      description:
        "Combats labor market discrimination against ethnic minorities and women through enforcement and employer monitoring.",
    },
  },
  tr: {
    Climate: {
      name: "Turkey Green Deal Action Plan",
      description:
        "Aligns Turkey's industrial and energy policy with the EU Green Deal as a candidate for EU membership.",
    },
    Healthcare: {
      name: "Health Transformation Program Phase II",
      description:
        "Modernizes Turkish hospital facilities and addresses physician retention following steep post-pandemic attrition.",
    },
    Infrastructure: {
      name: "Istanbul Canal Mega-Project",
      description:
        "Builds a 45 km artificial waterway parallel to the Bosphorus Strait to ease maritime traffic and seismic risk.",
    },
    Education: {
      name: "Mesleki Eğitim Vocational Revolution",
      description:
        "Partners Turkish industry with vocational schools to produce qualified technicians for manufacturing and energy.",
    },
    Economy: {
      name: "Turkish Unorthodox Monetary Stabilization",
      description:
        "Restores conventional central bank rate policy after years of unconventional cuts to tame 80% inflation.",
    },
    Defense: {
      name: "ASELSAN & Bayraktar Defense Self-Sufficiency",
      description:
        "Achieves 70%+ domestic content in defense procurement through Bayraktar drones, ASELSAN radar, and ALTAY tanks.",
    },
    Technology: {
      name: "National Technology Initiative Hamle",
      description:
        "Funds Turkish national car, fighter jet, and satellite programs under the Hamle (Move) technology program.",
    },
    Social: {
      name: "Syrian Refugee Integration Strategy",
      description:
        "Supports 3.5M Syrian refugees in Turkey with legal status, employment access, and language training programs.",
    },
  },
  ch: {
    Climate: {
      name: "Switzerland CO2 Act Revision",
      description:
        "Funds building renovations, heat pump retrofits, and clean mobility through a domestic carbon levy.",
    },
    Healthcare: {
      name: "Swiss Healthcare Cost Containment",
      description:
        "Introduces reference pricing for pharmaceuticals and hospital fee reforms to curb double-digit premium growth.",
    },
    Infrastructure: {
      name: "BAHN 2050 Rail Vision",
      description:
        "Plans Switzerland's next-generation railway infrastructure, expanding capacity and cutting cross-country travel times.",
    },
    Education: {
      name: "Swiss MINT Talent Promotion",
      description:
        "Strengthens Swiss STEM talent pipelines through ETH Zurich collaborations and vocational apprenticeship modernization.",
    },
    Economy: {
      name: "Switzerland Financial Sector Resilience",
      description:
        'Implements emergency liquidity backstops and "too big to fail" reforms following the UBS-Credit Suisse merger.',
    },
    Defense: {
      name: "Swiss Armed Forces Development Plan 2035",
      description:
        "Modernizes ground forces, acquires F-35 jets, and expands cyber defense while maintaining neutrality doctrine.",
    },
    Technology: {
      name: "Swiss Federal AI Council Strategy",
      description:
        "Develops AI ethics guidelines, promotes open federal AI tools, and ensures AI-ready public administration.",
    },
    Social: {
      name: "Swiss Supplementary Benefits Housing Aid",
      description:
        "Expands rent subsidies for elderly and disabled beneficiaries to prevent housing precarity in expensive Swiss cities.",
    },
  },
  pl: {
    Climate: {
      name: "Polish Energy Policy to 2040",
      description:
        "Transitions Poland away from coal reliance through offshore Baltic wind, nuclear, and EU ETS-linked green investment.",
    },
    Healthcare: {
      name: "Polish Hospital Network Reform",
      description:
        "Restructures hospital funding under a new network model to improve primary care access and reduce inequalities.",
    },
    Infrastructure: {
      name: "CPK Central Communication Hub",
      description:
        "Develops Centralny Port Komunikacyjny, a new mega-airport and rail hub outside Warsaw, as Poland's transport spine.",
    },
    Education: {
      name: "Polish Curriculum Quality Restoration",
      description:
        "Reverses prior government curriculum changes, restoring history, civic education, and democratic values in schools.",
    },
    Economy: {
      name: "Polish Investments in Development Agency",
      description:
        "Channels EU structural funds and state co-investment into Poland's lagging eastern and industrial transition regions.",
    },
    Defense: {
      name: "Poland 4% GDP Defense Buildup",
      description:
        "Increases defense spending to 4% of GDP, acquiring K2 tanks, HIMARS, and F-35s to deter Russian aggression.",
    },
    Technology: {
      name: "Digital Poland Program 3.0",
      description:
        "Extends fiber broadband to every Polish household and digitizes public services using EU Digital Decade funds.",
    },
    Social: {
      name: "800 Plus Child Benefit Enhancement",
      description:
        "Raises Poland's flagship child benefit from 500 to 800 PLN per month to support families and boost birth rates.",
    },
  },
  se: {
    Climate: {
      name: "Swedish Climate Policy Framework",
      description:
        "Enforces net-zero GHG by 2045 through carbon taxes, green industrial transformation, and fossil-free steel.",
    },
    Healthcare: {
      name: "National Healthcare Queue Reduction Plan",
      description:
        "Funds extra care capacity to meet the guarantee that no patient waits more than 90 days for treatment.",
    },
    Infrastructure: {
      name: "Swedish High-Speed Rail Expansion",
      description:
        "Builds new high-speed rail lines between Stockholm, Gothenburg, and Malmö to double rail capacity.",
    },
    Education: {
      name: "Swedish Läslyft National Reading Boost",
      description:
        "Provides professional development in evidence-based reading instruction for all Swedish primary school teachers.",
    },
    Economy: {
      name: "Swedish Innovation Agency Vinnova Program",
      description:
        "Co-invests with industry in decarbonized steel, battery technology, and hydrogen for Swedish export competitiveness.",
    },
    Defense: {
      name: "NATO Integration Defense Plan",
      description:
        "Restructures Sweden's total defense system around NATO Article 5 commitments following 2024 accession.",
    },
    Technology: {
      name: "Sweden Datadriven Public Sector",
      description:
        "Digitizes all public services and creates open government data infrastructure for private-sector AI applications.",
    },
    Social: {
      name: "Swedish Labor Market Integration Reform",
      description:
        "Redesigns the introduction program for new arrivals to accelerate employment and Swedish language acquisition.",
    },
  },
  no: {
    Climate: {
      name: "Norway Electrification of Continental Shelf",
      description:
        "Powers offshore oil platforms from shore-based electricity to eliminate 2.5M tons of CO2 annually from the sector.",
    },
    Healthcare: {
      name: "Norwegian Primary Care Strengthening",
      description:
        "Increases GP capacity and continuity through the Fastlegeordning regular GP system modernization.",
    },
    Infrastructure: {
      name: "National Transport Plan 2025-2036",
      description:
        "Allocates NOK 1.2T to road, rail, cycling, and coastal transport infrastructure over Norway's 12-year NTP.",
    },
    Education: {
      name: "Norwegian Competence Reform Lære Hele Livet",
      description:
        "Funds flexible university and vocational pathways for adults to retrain throughout their working lives.",
    },
    Economy: {
      name: "Government Pension Fund Global Rebalancing",
      description:
        "Adjusts GPFG investment mandates to include unlisted renewable energy infrastructure globally.",
    },
    Defense: {
      name: "Norway Long-Term Defence Plan",
      description:
        "Commits NOK 600B over a decade to scale up the Armed Forces following Russia's invasion of Ukraine.",
    },
    Technology: {
      name: "Norwegian Data Economy Initiative",
      description:
        "Creates sovereign data sharing infrastructure for Norway's fisheries, energy, and maritime industries.",
    },
    Social: {
      name: "Norway Poverty Reduction Children Programme",
      description:
        "Targets grants, free activities, and school meals at the 10% of Norwegian children living in low-income families.",
    },
  },
  th: {
    Climate: {
      name: "Thailand National Energy Plan 2024",
      description:
        "Raises renewable energy to 51% of Thailand's mix by 2037 through solar, wind, and biogas expansion.",
    },
    Healthcare: {
      name: "Thailand 30 Baht Universal Coverage Scheme",
      description:
        "Extends the 30 Baht healthcare scheme with free primary and emergency care for all 66M citizens.",
    },
    Infrastructure: {
      name: "Eastern Economic Corridor Rail Link",
      description:
        "Builds a high-speed rail connecting Bangkok airports and Pattaya to anchor the EEC industrial zone.",
    },
    Education: {
      name: "Thailand EEC Skill Development Program",
      description:
        "Trains 500,000 workers in advanced manufacturing and digital skills for the Eastern Economic Corridor.",
    },
    Economy: {
      name: "Thailand BCG Bio-Circular-Green Economy",
      description:
        "Pivots Thailand toward bioenergy, biomedical, and sustainable agriculture as next-generation economic pillars.",
    },
    Defense: {
      name: "Royal Thai Armed Forces Modernization",
      description:
        "Upgrades Thailand's ground and air forces in response to growing regional tensions and maritime boundary disputes.",
    },
    Technology: {
      name: "Thailand Digital Economy Promotion Plan",
      description:
        "Develops digital parks, smart cities, and an AI talent pipeline to position Bangkok as ASEAN's digital hub.",
    },
    Social: {
      name: "Thailand Social Protection Floor Reform",
      description:
        "Expands cash transfers to 14M informal workers lacking labor protections under Thailand's social insurance system.",
    },
  },
  be: {
    Climate: {
      name: "Belgium National Energy Climate Plan",
      description:
        "Pursues 40% renewable electricity by 2030 through offshore wind in the North Sea and energy renovation of buildings.",
    },
    Healthcare: {
      name: "Belgian Mental Health Reform Plan",
      description:
        "Shifts psychiatric care from hospitals to community mental health networks under the 107 reform framework.",
    },
    Infrastructure: {
      name: "Belgian Rail Vision 2040",
      description:
        "Modernizes Belgian rail with ETCS signalling and new rolling stock to compete with road freight and private cars.",
    },
    Education: {
      name: "Pacte d'Excellence School Reform",
      description:
        "Redesigns Wallonia's schooling system with competency-based learning and reduced early tracking between ages 6-15.",
    },
    Economy: {
      name: "Belgian National Recovery Plan",
      description:
        "Deploys €5.9B of EU recovery funds into digitalization, mobility, healthcare, and the energy transition.",
    },
    Defense: {
      name: "Belgian Strategic Vision 2030 Defense",
      description:
        "Invests €9.2B to re-equip the Belgian military with new frigates, F-35s, and armored vehicles.",
    },
    Technology: {
      name: "Belgium AI4Belgium Action Plan",
      description:
        "Coordinates AI research at KU Leuven, VUB, and industry through a Belgium-wide responsible AI program.",
    },
    Social: {
      name: "Belgian Poverty Reduction Strategy",
      description:
        "Addresses Belgium's structural poverty via benefit indexation, social housing investment, and energy poverty relief.",
    },
  },
  ar_c: {
    Climate: {
      name: "Argentina Just Energy Transition Strategy",
      description:
        "Develops Patagonian wind and Andean solar to diversify Argentina's energy matrix beyond natural gas.",
    },
    Healthcare: {
      name: "PAIS Health Emergency Fund",
      description:
        "Maintains emergency funding for medicines and hospital operations amid Argentina's macroeconomic crisis.",
    },
    Infrastructure: {
      name: "Vaca Muerta Pipeline Expansion",
      description:
        "Builds the Néstor Kirchner gas pipeline to export Vaca Muerta shale gas surpluses to Brazil and Chile.",
    },
    Education: {
      name: "Argentina University Autonomy Defense",
      description:
        "Protects federal university funding and academic freedom amid austerity budget cuts from the Milei administration.",
    },
    Economy: {
      name: "Argentina Libertad Avanza Economic Shock Therapy",
      description:
        "Aggressively slashes fiscal deficit, dollarizes key transactions, and eliminates state agencies to stabilize the peso.",
    },
    Defense: {
      name: "Argentine Military Equipment Modernization",
      description:
        "Upgrades FAA with second-hand F-16 jets from Denmark and restores deteriorated naval and army equipment.",
    },
    Technology: {
      name: "Argentina Vaca Muerta Tech Transfer Hub",
      description:
        "Builds a tech and engineering services cluster in Neuquén serving Vaca Muerta oil and gas operators.",
    },
    Social: {
      name: "Argentina Emergency Social Assistance Program",
      description:
        "Maintains Potenciar Trabajo and food card programs as shock therapy cuts push poverty above 40%.",
    },
  },
  sg: {
    Climate: {
      name: "Singapore Green Plan 2030",
      description:
        "Targets 80% green buildings, 2 GW solar by 2030, and net-zero emissions as early as 2050 despite land constraints.",
    },
    Healthcare: {
      name: "Healthier SG Preventive Care Plan",
      description:
        "Shifts Singapore's health system toward preventive care through GP enrolment, health plans, and community programs.",
    },
    Infrastructure: {
      name: "Singapore-Johor Rapid Transit System",
      description:
        "Connects Singapore's Woodlands to Johor Bahru with a cross-border rail link easing daily commuter congestion.",
    },
    Education: {
      name: "Singapore Skills Future Mid-Career Support",
      description:
        "Provides S$4,000 SkillsFuture credits to Singaporeans over 40 for mid-career upskilling and reskilling.",
    },
    Economy: {
      name: "Singapore Economic Development Board AI Strategy",
      description:
        "Positions Singapore as the premier ASEAN HQ for AI and advanced manufacturing companies through EDB incentives.",
    },
    Defense: {
      name: "Singapore Next Generation SAF Transformation",
      description:
        "Integrates AI, autonomous systems, and cyber capabilities into the Singapore Armed Forces' digital ground, sea, and air operations.",
    },
    Technology: {
      name: "Singapore National AI Strategy 2.0",
      description:
        "Deepens AI adoption across critical sectors with 15,000 AI practitioners and a new National Multimodal LLM Program.",
    },
    Social: {
      name: "Singapore HDB Flat Affordability Plan",
      description:
        "Introduces More Subsidized Flats and tightens resale price regulation to maintain public housing affordability.",
    },
  },
  za: {
    Climate: {
      name: "South Africa Just Energy Transition Plan",
      description:
        "Mobilizes $8.5B from G7+ nations to decommission Eskom coal plants and fund renewable energy and workers.",
    },
    Healthcare: {
      name: "National Health Insurance Bill Implementation",
      description:
        "Begins phased implementation of universal NHI to replace South Africa's deeply unequal private-public health divide.",
    },
    Infrastructure: {
      name: "South Africa Electricity Grid Emergency Plan",
      description:
        "Accelerates private power generation approvals and Eskom transmission upgrades to end chronic load shedding.",
    },
    Education: {
      name: "South Africa Early Grade Reading Assessment",
      description:
        "Implements diagnostic reading assessments and targeted support for Grade 1-3 students across all provinces.",
    },
    Economy: {
      name: "Operation Vulindlela Microeconomic Reforms",
      description:
        "Removes bottlenecks in electricity, water, freight rail, and spectrum through a joint National Treasury-Presidency unit.",
    },
    Defense: {
      name: "SANDF Capabilities Restoration Program",
      description:
        "Rebuilds South Africa's atrophied military with new equipment, improved pay, and reformed recruitment standards.",
    },
    Technology: {
      name: "South Africa Digital and Future Skills",
      description:
        "Partners the DHET and tech companies to train 1M youth in digital skills amid 32% youth unemployment.",
    },
    Social: {
      name: "South Africa Social Relief of Distress Grant",
      description:
        "Maintains the R350/month SRD grant to 9M unemployed adults while debating transition to a permanent basic income.",
    },
  },
  ng: {
    Climate: {
      name: "Nigeria Energy Transition Plan 2060",
      description:
        "Mobilizes $410B over four decades to achieve net-zero through gas bridging, solar minigrids, and efficiency gains.",
    },
    Healthcare: {
      name: "Nigeria Basic Health Care Provision Fund",
      description:
        "Channels 1% of consolidated revenue to primary healthcare centers across Nigeria's 36 states.",
    },
    Infrastructure: {
      name: "Lagos-Kano Rail Modernization",
      description:
        "Completes the standard gauge rail linking Lagos to Kano, Nigeria's two largest commercial cities.",
    },
    Education: {
      name: "Nigeria UBEC Universal Basic Education Fund",
      description:
        "Matches state contributions for classroom construction and teacher training to address 20M out-of-school children.",
    },
    Economy: {
      name: "Nigeria FX Unification and Fiscal Reform",
      description:
        "Unifies Nigeria's multiple exchange rates and removes petrol subsidy to stabilize the naira and fiscal balance.",
    },
    Defense: {
      name: "Nigeria Counter-Insurgency Northeast Strategy",
      description:
        "Coordinates military, police, and civilian resources to degrade Boko Haram and ISWAP activity in the northeast.",
    },
    Technology: {
      name: "Nigerian Startup Act Implementation",
      description:
        "Implements the 2022 Startup Act with tax incentives, labels, and a startup portal to grow Lagos's tech ecosystem.",
    },
    Social: {
      name: "Nigeria Social Investment Programme",
      description:
        "Delivers conditional cash transfers, school feeding, and skills training to 10M households under the NSIPs.",
    },
  },
  eg: {
    Climate: {
      name: "Egypt Nexus of Water-Food-Energy Plan",
      description:
        "Integrates water conservation, solar desalination, and food security into Egypt's adaptation to Nile water stress.",
    },
    Healthcare: {
      name: "Egyptian Universal Health Insurance Law",
      description:
        "Phases in universal health coverage across Egypt's 27 governorates over 15 years starting with Port Said.",
    },
    Infrastructure: {
      name: "Egypt New Administrative Capital",
      description:
        "Completes construction of Egypt's new 45,000 hectare capital city east of Cairo to decongest the megacity.",
    },
    Education: {
      name: "Egypt Vision 2030 Education Reform",
      description:
        "Introduces updated curricula, digital learning, and teacher training in alignment with Egypt's development goals.",
    },
    Economy: {
      name: "Egypt Ras El Hekma Mega-Development Deal",
      description:
        "Executes a record $35B UAE investment to develop the Ras El Hekma coastal tourist and economic zone.",
    },
    Defense: {
      name: "Egyptian Armed Forces Capability Modernization",
      description:
        "Upgrades Egypt's air, naval, and ground forces as the largest Arab military amid persistent regional instability.",
    },
    Technology: {
      name: "Egypt Digital Economy & E-Government",
      description:
        "Digitizes 800 government services through the GOV.EG platform and expands 4G to Upper Egypt rural areas.",
    },
    Social: {
      name: "Takaful and Karama Social Protection Programme",
      description:
        "Provides conditional cash transfers to 4.5M poor Egyptian families through the MOSS social protection system.",
    },
  },
  nz: {
    Climate: {
      name: "New Zealand Emissions Trading Scheme Reform",
      description:
        "Tightens the NZ ETS cap and introduces an industrial allocation review to put a credible price on carbon.",
    },
    Healthcare: {
      name: "New Zealand Health Reforms Te Whatu Ora",
      description:
        "Merges 20 DHBs into a single national health system to reduce inequalities and streamline commissioning.",
    },
    Infrastructure: {
      name: "New Zealand Let's Get Wellington Moving",
      description:
        "Delivers rapid transit and road improvements for Wellington's congested transport network.",
    },
    Education: {
      name: "New Zealand Learning Support Action Plan",
      description:
        "Funds specialist teachers and therapists to reduce wait times for children with learning and behaviour needs.",
    },
    Economy: {
      name: "NZ Going for Housing Growth",
      description:
        "Requires councils in major urban areas to zone for medium and high-density housing near transit to improve affordability.",
    },
    Defense: {
      name: "New Zealand Defence Capability Plan 2024",
      description:
        "Invests NZ$9B over four years to replace aging P-3 Orions, upgrade frigates, and grow the NZDF workforce.",
    },
    Technology: {
      name: "New Zealand Digital Strategy 2030",
      description:
        "Expands rural broadband, champions data portability rights, and develops an ethical AI framework for government.",
    },
    Social: {
      name: "New Zealand Whānau Ora Service Delivery",
      description:
        "Funds Māori-led family support services addressing health, welfare, housing, and education through Whānau Ora providers.",
    },
  },
  ru: {
    Climate: {
      name: "Russia Carbon Neutrality by 2060 Strategy",
      description:
        "Sets a 2060 net-zero target relying on nuclear expansion, carbon sinks in Siberian forests, and gas transition.",
    },
    Healthcare: {
      name: "Russian National Healthcare Project",
      description:
        "Modernizes primary care facilities and oncology centers while addressing wartime medical system strain.",
    },
    Infrastructure: {
      name: "Russia Northern Sea Route Development",
      description:
        "Invests in icebreakers, ports, and navigation technology to open the Arctic Northern Sea Route to year-round shipping.",
    },
    Education: {
      name: "Russia STEM Priority Education Program",
      description:
        "Identifies 100 priority STEM schools and 12 national research universities as centers of engineering excellence.",
    },
    Economy: {
      name: "Russia Import Substitution Strategy",
      description:
        "Replaces Western-brand goods with domestic production under sanctions-driven self-reliance policy across all sectors.",
    },
    Defense: {
      name: "Russian State Armament Program GPV 2033",
      description:
        "Funds wartime military-industrial mobilization with accelerated production of missiles, tanks, and drones.",
    },
    Technology: {
      name: "Russia Domestic Tech Stack Development",
      description:
        "Develops Russian-made operating systems, software, and internet infrastructure to reduce dependence on Western tech.",
    },
    Social: {
      name: "Russia Social Payments Expansion Under War",
      description:
        "Increases veteran payments, family subsidies, and mobilization benefits to maintain domestic support for the war effort.",
    },
  },
  ae: {
    Climate: {
      name: "UAE Net Zero 2050 Strategic Initiative",
      description:
        "Invests $163B to decarbonize the UAE's economy through Abu Dhabi's Barakah nuclear and ADNOC low-carbon gas.",
    },
    Healthcare: {
      name: "UAE Unified Medical Record System",
      description:
        "Links all UAE healthcare providers through Malaffi and Nabidh HIEs to enable seamless patient data sharing.",
    },
    Infrastructure: {
      name: "Etihad Rail National Network Completion",
      description:
        "Completes the 1,200 km Etihad Rail connecting all UAE emirates and the Saudi border for freight and passengers.",
    },
    Education: {
      name: "UAE Centennial 2071 Education Vision",
      description:
        "Redesigns UAE schooling around creativity, science, and multilingual competence for a post-oil knowledge economy.",
    },
    Economy: {
      name: "UAE Projects of the 50 Economic Program",
      description:
        "Launches 50 transformative economic projects including Nasdaq Dubai expansion and Dubai Chamber 2.0.",
    },
    Defense: {
      name: "UAE EDGE Defense Industry Expansion",
      description:
        "Builds EDGE Group into a top 25 global defense company producing drones, cyber tools, and smart munitions.",
    },
    Technology: {
      name: "UAE National AI Strategy 2031",
      description:
        "Targets 25% contribution to GDP from AI by 2031 through Abu Dhabi's Falcon LLM and G42 research programs.",
    },
    Social: {
      name: "UAE Gender Balance National Agenda",
      description:
        "Increases women's representation in leadership, tech, and government to meet the National Gender Balance Index targets.",
    },
  },
  il: {
    Climate: {
      name: "Israel National Climate Change Program",
      description:
        "Targets 30% renewable electricity by 2030 using Negev Desert solar and Mediterranean offshore natural gas bridging.",
    },
    Healthcare: {
      name: "Israel Digital Health Innovation Fund",
      description:
        "Leverages Israel's unique population health data to develop AI diagnostic and hospital management systems.",
    },
    Infrastructure: {
      name: "Israel Fast Rail Tel Aviv-Jerusalem Upgrade",
      description:
        "Expands high-speed rail connectivity between Tel Aviv and Jerusalem and extends the network to Beer Sheva.",
    },
    Education: {
      name: "Israel High-Tech Talent Pipeline Expansion",
      description:
        "Funds university computer science capacity and post-army coding bootcamps to sustain the 8200 unit tech ecosystem.",
    },
    Economy: {
      name: "Israel Startup Nation Wartime Resilience",
      description:
        "Provides bridge capital to startups, expedites foreign worker permits, and stabilizes the shekel through central bank interventions.",
    },
    Defense: {
      name: "Israel Iron Dome and David's Sling Replenishment",
      description:
        "Accelerates domestic restocking and US-assisted production of Iron Dome and David's Sling interceptor missiles.",
    },
    Technology: {
      name: "Israel Quantum Computing National Plan",
      description:
        "Operates the IQC at the Hebrew University and Weizmann Institute as centers of government quantum investment.",
    },
    Social: {
      name: "Israel Displaced Population Resettlement Fund",
      description:
        "Supports tens of thousands of Israelis displaced from northern and southern border towns through housing and income aid.",
    },
  },
  at: {
    Climate: {
      name: "Austria Ökostromausbau-Beschleunigungsgesetz",
      description:
        "Accelerates Austria's transition to 100% renewable electricity by 2030 through streamlined permitting.",
    },
    Healthcare: {
      name: "Austria Healthcare Reform 2023",
      description:
        "Funds 100 new primary care centers to reduce outpatient hospital overcrowding and improve GP access.",
    },
    Infrastructure: {
      name: "Brenner Base Tunnel Completion",
      description:
        "Advances Austria's Brenner Base Tunnel to shift Alpine freight traffic from road to rail by 2032.",
    },
    Education: {
      name: "Austria Pflichtschule Digital Skills Plan",
      description:
        "Integrates coding and digital literacy into compulsory school curricula from primary through gymnasium.",
    },
    Economy: {
      name: "Austria Investitionsprämie Green Investment",
      description:
        "Extends the green investment premium to firms decarbonizing production through energy efficiency and electrification.",
    },
    Defense: {
      name: "Austria Armed Forces Equipment Procurement",
      description:
        "Replaces Austrian military's largest capability gaps with new helicopters, vehicles, and signals equipment.",
    },
    Technology: {
      name: "Austria AI Innovation Lab Network",
      description:
        "Funds AI labs at TU Wien, JKU Linz, and Graz University of Technology to support industry AI adoption.",
    },
    Social: {
      name: "Austria Wohnbauoffensive Affordable Housing",
      description:
        "Increases subsidized social housing construction to counter Vienna's rapidly rising private rental prices.",
    },
  },
  dk: {
    Climate: {
      name: "Denmark Climate Act 70% Reduction Target",
      description:
        "Enforces legally binding 70% GHG reduction by 2030 through carbon capture, offshore wind, and green agriculture.",
    },
    Healthcare: {
      name: "Danish Sundhedsreform 2024 Healthcare",
      description:
        "Merges hospital management reforms and community care expansion to reduce regional health inequality.",
    },
    Infrastructure: {
      name: "Fehmarnbelt Fixed Link Completion",
      description:
        "Completes the world's longest immersed tunnel under the Fehmarnbelt, linking Denmark and Germany by 2029.",
    },
    Education: {
      name: "Denmark Gymnasiereform Secondary Overhaul",
      description:
        "Rewrites gymnasium study programs to strengthen foundational skills and student wellbeing in Danish high schools.",
    },
    Economy: {
      name: "Danish Pharmaceutical Competitiveness Strategy",
      description:
        "Supports Novo Nordisk's global GLP-1 expansion by developing talent and regulatory capacity in Denmark.",
    },
    Defense: {
      name: "Denmark Defense & Intelligence Uplift",
      description:
        "Increases defense spending to 2% of GDP and accelerates acquisition of F-35s and Arctic patrol vessels.",
    },
    Technology: {
      name: "Danish Digital Strategy 2024-2027",
      description:
        "Expands government AI, digital identity, and interoperability standards across Danish public administration.",
    },
    Social: {
      name: "Denmark Kontanthjælpsreform Benefit Reform",
      description:
        "Links welfare benefits to job search obligations and Danish language requirements to reduce long-term dependency.",
    },
  },
  fi_c: {
    Climate: {
      name: "Finland Carbon Neutrality by 2035 Plan",
      description:
        "Targets the world's earliest carbon neutrality among large economies through forestry, clean energy, and CCS.",
    },
    Healthcare: {
      name: "Finnish Wellbeing Services Counties Reform",
      description:
        "Transfers healthcare and social services to 21 wellbeing counties to equalize access across urban and rural areas.",
    },
    Infrastructure: {
      name: "Finland Rail Network 12-Year Plan",
      description:
        "Invests €12B in the Rail Network Condition and Reliability Programme to tackle Finland's infrastructure backlog.",
    },
    Education: {
      name: "Finland Teacher Profession Attractiveness Program",
      description:
        "Restores teaching's prestige through salary reform and reduced workload to attract qualified educators.",
    },
    Economy: {
      name: "Finland Sustainable Growth Program",
      description:
        "Channels EU recovery funds into green transition, digitalization, and R&D through the Kestävä kasvu plan.",
    },
    Defense: {
      name: "Finland NATO Integration Defense Build-up",
      description:
        "Integrates Finland's F-35, HX fighter, and northern defense doctrine into NATO's Article 5 posture.",
    },
    Technology: {
      name: "Finnish AI Program AINO",
      description:
        "Funds 15 flagship AI research programs across Helsinki and Aalto universities with industrial AI matchmaking.",
    },
    Social: {
      name: "Finland Basic Income Experiment Expansion",
      description:
        "Evaluates expanding the Kela basic income pilot to a permanent active social security benefit.",
    },
  },
  gr: {
    Climate: {
      name: "Greece REPowerEU Island Decarbonization",
      description:
        "Decarbonizes 28 non-interconnected Greek islands through hybrid storage systems and solar-wind microgrids.",
    },
    Healthcare: {
      name: "Greece National Primary Care Network TOBY",
      description:
        "Builds a nationwide primary health care network to reduce dependence on Athens and Thessaloniki hospital centers.",
    },
    Infrastructure: {
      name: "Athens-Thessaloniki High-Speed Rail",
      description:
        "Completes Hellenic Train's high-speed upgrade cutting Athens-Thessaloniki travel time to 3 hours.",
    },
    Education: {
      name: "Greece University Law Reform 2024",
      description:
        "Allows private university operations in Greece for the first time to broaden higher education access.",
    },
    Economy: {
      name: "Greece Hellenic Recovery & Resilience Plan",
      description:
        "Deploy €30.5B of EU recovery funds into green transition, digital transformation, and sustainable tourism.",
    },
    Defense: {
      name: "Greece Hellenic Armed Forces Procurement",
      description:
        "Acquires Rafale jets, FDI frigates, and SCALP cruise missiles to modernize Greece's military amid Turkey tensions.",
    },
    Technology: {
      name: "Greece Digital Transformation Bible",
      description:
        "Digitizes all 1,535 state services and deploys 5G nationwide with a single GSRT digital transformation ministry.",
    },
    Social: {
      name: "Greece Anti-Poverty Social Inclusion Plan",
      description:
        "Extends the Social Solidarity Income to 400,000 households and expands guaranteed minimum income coverage.",
    },
  },
  pt: {
    Climate: {
      name: "Portugal National Energy and Climate Plan",
      description:
        "Achieves 80% renewable electricity by 2026 using the Iberian Peninsula's exceptional solar and wind resources.",
    },
    Healthcare: {
      name: "Portugal SNS Primary Care Expansion",
      description:
        "Hires 1,500 family doctors and opens 200 community health centers to close SNS primary care gaps.",
    },
    Infrastructure: {
      name: "Portugal High-Speed Rail Lisbon-Porto",
      description:
        "Advances the Lisbon-Porto high-speed rail project cutting journey time from 3 hours to under 1 hour.",
    },
    Education: {
      name: "Portugal 2030 Student Success Plan",
      description:
        "Reduces school dropout rates through tutoring, social support, and vocational pathways for at-risk youth.",
    },
    Economy: {
      name: "Portugal PRR Recovery and Resilience Plan",
      description:
        "Invests €16.6B of EU recovery funds in housing, digital infrastructure, and green industrial transformation.",
    },
    Defense: {
      name: "Portugal NATO Atlantic Flank Investment",
      description:
        "Upgrades maritime patrol, Azores basing, and C2 capacity to strengthen Portugal's Atlantic Alliance role.",
    },
    Technology: {
      name: "Portugal Startup Act Implementation",
      description:
        "Expands Portugal's innovative startup visa, R&D tax credits, and the Web Summit legacy tech ecosystem.",
    },
    Social: {
      name: "Portugal Emergency Housing Plan MAIS HABITAÇÃO",
      description:
        "Caps rent increases, expands social housing, and offers state-backed mortgages to tackle Portugal's housing crisis.",
    },
  },
  cz: {
    Climate: {
      name: "Czech Modernization Fund Coal Exit",
      description:
        "Uses EU ETS revenues in the Modernization Fund to retire Czechoslovak-era coal plants and fund new wind capacity.",
    },
    Healthcare: {
      name: "Czech Digital Health Records Act",
      description:
        "Implements a patient-controlled electronic health record system to improve care coordination nationwide.",
    },
    Infrastructure: {
      name: "Czech High-Speed Rail Network Construction",
      description:
        "Begins construction of four high-speed rail corridors connecting Prague to Berlin, Vienna, and Warsaw.",
    },
    Education: {
      name: "Czech Education Development Strategy 2030+",
      description:
        "Shifts Czech education from rote learning to competency-based teaching and reduces early streaming between tracks.",
    },
    Economy: {
      name: "Czech Transition to Electric Vehicles Plan",
      description:
        "Funds Czech automotive suppliers' switch to EV components as Skoda and local Tier 1 plants electrify.",
    },
    Defense: {
      name: "Czech F-35 Acquisition Program",
      description:
        "Contracts 24 F-35 aircraft to replace aging Gripen leases as part of Czech NATO capability commitments.",
    },
    Technology: {
      name: "Czech Digital Czechia Government Strategy",
      description:
        "Digitizes Czech public administration, introduces digital identity, and opens government data for AI development.",
    },
    Social: {
      name: "Czech Anti-Poverty Minimum Wage Increase",
      description:
        "Raises the statutory minimum wage toward 50% of the median to reduce in-work poverty for low earners.",
    },
  },
  ro: {
    Climate: {
      name: "Romania National Energy and Climate Plan",
      description:
        "Develops Black Sea offshore gas and balances fossil extraction with 30.7% renewable target by 2030.",
    },
    Healthcare: {
      name: "Romania National Health Infrastructure Investment",
      description:
        "Builds 10 new regional hospitals using EU Recovery funds to replace Romania's crumbling Soviet-era facilities.",
    },
    Infrastructure: {
      name: "Romania Moldova-Iași-Ungheni Gas Pipeline",
      description:
        "Expands interconnection pipelines to reduce Romania's energy dependence on Russian gas.",
    },
    Education: {
      name: "Romania Educated Romania Presidential Program",
      description:
        "Overhauls Romanian education law to raise quality, cut dropout rates, and align with OECD PISA standards.",
    },
    Economy: {
      name: "Romania PNRR Smart Manufacturing",
      description:
        "Channels €29.2B of EU recovery funds into digitalization, green hydrogen, and competitiveness improvements.",
    },
    Defense: {
      name: "Romania NATO Eastern Flank F-16 Program",
      description:
        "Operates fleet of F-16 jets and hosts NATO battle groups as Romania's defense spending rises above 2% GDP.",
    },
    Technology: {
      name: "Romania Digital Romania Initiative",
      description:
        "Modernizes public services, expands broadband to rural areas, and establishes cybersecurity national frameworks.",
    },
    Social: {
      name: "Romania Roma Inclusion Strategy",
      description:
        "Implements housing construction, school enrollment, and healthcare access programs for Romania's 2M Roma citizens.",
    },
  },
  hu: {
    Climate: {
      name: "Hungary National Clean Development Strategy",
      description:
        "Invests in Paks II nuclear expansion and solar scaling to reduce dependence on Russian gas and meet EU targets.",
    },
    Healthcare: {
      name: "Hungarian Health Service Renewal Program",
      description:
        "Addresses physician emigration and outdated hospital infrastructure through salary reform and capital investment.",
    },
    Infrastructure: {
      name: "Budapest Metro 4 Line Extension",
      description:
        "Extends Budapest's M4 metro line to relieve the city's most congested surface transit corridors.",
    },
    Education: {
      name: "Hungary Dual Vocational Training Reform",
      description:
        "Expands company-based apprenticeship training aligned with Germany's dual system for Hungarian industry.",
    },
    Economy: {
      name: "Hungary Battery Manufacturing Corridor",
      description:
        "Attracts CATL, Samsung SDI, and SVOLT to Hungary's EV battery industrial zone along the M7 corridor.",
    },
    Defense: {
      name: "Hungary Army Zrínyi 2026 Modernization",
      description:
        "Procures Leopard 2 tanks, H225M helicopters, and MANPADS systems under the Zrínyi 2026 defense plan.",
    },
    Technology: {
      name: "Hungary Digital Success Program",
      description:
        "Funds digital skills training and startup grants through the Digitális Sikeres Magyar program for SMEs.",
    },
    Social: {
      name: "Hungary Family Protection Action Plan",
      description:
        "Provides mortgage relief, baby bonds, and grandparent childcare subsidies to raise Hungary's birth rate.",
    },
  },
  ua: {
    Climate: {
      name: "Ukraine Green Recovery Reconstruction Plan",
      description:
        "Integrates climate-resilient rebuilding and renewable energy dominance into Ukraine's post-war reconstruction.",
    },
    Healthcare: {
      name: "Ukraine Medical Guarantee Program Continuity",
      description:
        "Maintains the Medical Guarantee Program providing free primary care amid wartime system disruptions.",
    },
    Infrastructure: {
      name: "Ukraine FRU Wartime Infrastructure Repair",
      description:
        "Coordinates Fund for Restoration of Ukraine resources to repair bombed power grids, roads, and bridges.",
    },
    Education: {
      name: "Ukraine Wartime Online Education Safeguard",
      description:
        "Maintains accredited digital schooling for 4M students forced from classrooms by Russian bombardment.",
    },
    Economy: {
      name: "Ukraine Marshall Plan Reconstruction Strategy",
      description:
        "Develops a multi-hundred-billion EU and G7-backed reconstruction plan for housing, industry, and infrastructure.",
    },
    Defense: {
      name: "Ukraine General Staff 2024 Strategic Defense",
      description:
        "Coordinates combined arms defense with F-16 jets, Patriot missiles, and drone warfare along the 1,000 km front.",
    },
    Technology: {
      name: "Ukraine Diia Digital State App",
      description:
        "Operates Diia as the world's leading government super-app, delivering 150+ services digitally despite wartime conditions.",
    },
    Social: {
      name: "Ukraine Internally Displaced Persons Support",
      description:
        "Provides housing, cash transfers, and employment to 3.6M Ukrainians displaced within their own country.",
    },
  },
  sk: {
    Climate: {
      name: "Slovakia National Energy and Climate Plan",
      description:
        "Pursues 80% low-carbon electricity through Mochovce nuclear expansion and Slovak Wind Energy Association targets.",
    },
    Healthcare: {
      name: "Slovakia Healthcare Transformation Plan",
      description:
        "Reforms hospital governance and recruits abroad to address Slovakia's acute physician and nurse shortage.",
    },
    Infrastructure: {
      name: "Slovakia D4 Bratislava Ring Road",
      description:
        "Completes the Bratislava D4/R7 ring road and bridge PPP project easing the capital's severe traffic congestion.",
    },
    Education: {
      name: "Slovak Education Resilience Plan",
      description:
        "Increases teacher salaries and modernizes Slovak school infrastructure using EU cohesion fund resources.",
    },
    Economy: {
      name: "Slovakia EV Battery Plant Attraction Strategy",
      description:
        "Positions Trencin and Zilina as destinations for EV and battery manufacturing to succeed the conventional auto industry.",
    },
    Defense: {
      name: "Slovakia F-16 Block 70 Air Force Upgrade",
      description:
        "Transitions the Slovak Air Force from MiG-29s to 14 F-16 Block 70 jet fighters under a US FMS agreement.",
    },
    Technology: {
      name: "Slovakia Digital Transformation Act 2030",
      description:
        "Mandates full digital public service availability and launches Slovakia's government cloud infrastructure.",
    },
    Social: {
      name: "Slovakia Roma Community Integration Strategy",
      description:
        "Builds social housing, improves sanitation, and increases school enrollment for Slovakia's 400,000 Roma citizens.",
    },
  },
  bg: {
    Climate: {
      name: "Bulgaria REPowerEU Transition Plan",
      description:
        "Phases out lignite coal operations and grows renewables to address Bulgaria's high per-capita emissions.",
    },
    Healthcare: {
      name: "Bulgaria National Healthcare Strategy 2030",
      description:
        "Rebuilds Bulgaria's degraded hospital infrastructure and improves physician retention to stop healthcare emigration.",
    },
    Infrastructure: {
      name: "Bulgaria Hemus Motorway Completion",
      description:
        "Completes the long-delayed Hemus motorway connecting Sofia to Varna and improving North-South Bulgarian connectivity.",
    },
    Education: {
      name: "Bulgaria National Education Strategy 2030",
      description:
        "Addresses Bulgaria's workforce literacy crisis through early intervention, teacher pay increases, and school modernization.",
    },
    Economy: {
      name: "Bulgaria PNRR Competitiveness Reforms",
      description:
        "Uses EU recovery funds for R&D investment, public administration reform, and private sector innovation capacity.",
    },
    Defense: {
      name: "Bulgaria F-16 Procurement & NATO Integration",
      description:
        "Procures F-16 Block 70 fighters and integrates Bulgarian air and naval forces into NATO's eastern flank architecture.",
    },
    Technology: {
      name: "Bulgaria Digital Transformation Roadmap",
      description:
        "Modernizes Bulgarian e-government with a digital ID system, interoperable registers, and cloud-first public procurement.",
    },
    Social: {
      name: "Bulgaria Anti-Demographic Decline Strategy",
      description:
        "Offers pro-natalist subsidies, diaspora return incentives, and childcare expansion to reverse Bulgaria's population collapse.",
    },
  },
  hr: {
    Climate: {
      name: "Croatia National Energy and Climate Plan",
      description:
        "Pursues 36.4% renewable energy by 2030 guided by Adriatic offshore wind and solar scaling.",
    },
    Healthcare: {
      name: "Croatia Healthcare Reform and Digitalization",
      description:
        "Digitizes patient records and restructures hospital management in Croatia's National Recovery and Resilience Plan.",
    },
    Infrastructure: {
      name: "Croatia Pelješac Bridge Leveraging",
      description:
        "Uses the Pelješac Bridge opening to accelerate Dubrovnik-Split coastal motorway and ferry upgrades.",
    },
    Education: {
      name: "Croatia Curriculum Reform CRO-Školstvo",
      description:
        "Implements competency-based learning reform across all levels of Croatian education through 2025.",
    },
    Economy: {
      name: "Croatia Post-Euro Tourism Competitiveness",
      description:
        "Manages euro-adoption tourism price pressures and develops year-round sustainable tourism beyond the Dalmatian coast.",
    },
    Defense: {
      name: "Croatia Rafale Integration & NATO Contribution",
      description:
        "Integrates 12 French Rafale M jets into Croatian Air Force and contributes to NATO's Baltic Air Policing rotation.",
    },
    Technology: {
      name: "Croatia Digital Croatia Strategy 2026",
      description:
        "Invests in 5G rollout, digital skills, and e-government services through the NPOO recovery plan.",
    },
    Social: {
      name: "Croatia Diaspora Return and Integration Fund",
      description:
        "Incentivizes Croatian diaspora return through housing subsidies, recognition of foreign qualifications, and startup grants.",
    },
  },
  rs: {
    Climate: {
      name: "Serbia Energy Transition Plan",
      description:
        "Commits to closing the lignite Nikola Tesla power plant by 2050 and targets 40% renewable electricity by 2040.",
    },
    Healthcare: {
      name: "Serbia Healthcare Sector Improvement Project",
      description:
        "Modernizes primary and secondary care infrastructure with World Bank funding across 10 Serbian districts.",
    },
    Infrastructure: {
      name: "Serbia Belgrade-Budapest High-Speed Rail",
      description:
        "Completes the Budapest-Belgrade HSR link as part of China's BRI and EU Trans-European Network priorities.",
    },
    Education: {
      name: "Serbia Dual Education System Scale-Up",
      description:
        "Expands company-based vocational education nationwide to reduce skills gaps in manufacturing and services.",
    },
    Economy: {
      name: "Serbia FDI Industrial Zones Expansion",
      description:
        "Develops greenfield industrial zones near Kragujevac and Novi Sad to attract European manufacturing relocation.",
    },
    Defense: {
      name: "Serbia Military Neutrality Balance Strategy",
      description:
        "Maintains military neutrality while purchasing equipment from both Western and Chinese/Russian suppliers.",
    },
    Technology: {
      name: "Serbia Digital Serbia Initiative",
      description:
        "Upgrades e-government services and positions Serbia as a Balkan digital hub through IT sector fiscal incentives.",
    },
    Social: {
      name: "Serbia Roma Inclusion Decade Commitments",
      description:
        "Continues Roma Decade commitments on housing, education, employment, and healthcare with EU support.",
    },
  },
  ie: {
    Climate: {
      name: "Ireland Climate Action Plan 2024",
      description:
        "Enforces legally binding sectoral ceilings reducing Ireland's GHG emissions 51% by 2030 across all sectors.",
    },
    Healthcare: {
      name: "Ireland Sláintecare Reform Implementation",
      description:
        "Phases in public-only hospital billing and expands community care under the Sláintecare 10-year health reform.",
    },
    Infrastructure: {
      name: "Ireland National Planning Framework",
      description:
        "Steers half of new development outside Dublin to balanced regional growth in Galway, Cork, Limerick, and Waterford.",
    },
    Education: {
      name: "Ireland Action Plan for Education",
      description:
        "Raises Ireland's PISA rankings, expands special needs support, and grows STEM participation by 20%.",
    },
    Economy: {
      name: "Ireland Pillar Two Corporate Tax Compliance",
      description:
        "Implements the OECD global 15% minimum tax while retaining the 12.5% rate for below-threshold companies.",
    },
    Defense: {
      name: "Ireland Defence Forces Transformation Plan",
      description:
        "Dramatically increases Defence Forces pay, equipment, and manpower after decades of chronic underfunding.",
    },
    Technology: {
      name: "Ireland AI Ireland Strategy",
      description:
        "Positions Ireland as Europe's transparent and ethical AI hub leveraging its Big Tech cluster in Dublin.",
    },
    Social: {
      name: "Ireland Housing for All Plan",
      description:
        "Targets 33,000 new homes annually through state construction, planning reform, and Croí Cónaithe town support.",
    },
  },
  tw: {
    Climate: {
      name: "Taiwan 2050 Net-Zero Pathway",
      description:
        "Pursues net-zero by 2050 through offshore wind, solar, green hydrogen, and energy efficiency in semiconductor fabs.",
    },
    Healthcare: {
      name: "Taiwan National Health Insurance Adjustment",
      description:
        "Reforms NHI premium and copayment structures to sustain the world's most-cited single-payer insurance system.",
    },
    Infrastructure: {
      name: "Taiwan HSR Capacity Expansion",
      description:
        "Adds track capacity and rolling stock to Taiwan's high-speed rail to handle explosive demand between Taipei and Kaohsiung.",
    },
    Education: {
      name: "Taiwan STEM and Semiconductor Talent Program",
      description:
        "Expands EE and materials science enrollment to feed TSMC, ASE, and the semiconductor supply chain with graduates.",
    },
    Economy: {
      name: "Taiwan TSMC Domestic Fab Expansion",
      description:
        "Co-invests with TSMC to build 2nm and beyond domestic fab capacity as a national economic security priority.",
    },
    Defense: {
      name: "Taiwan Asymmetric Defense Strategy",
      description:
        "Funds mobile anti-ship missiles, drone swarms, and reserve force reform to deter PLA amphibious operations.",
    },
    Technology: {
      name: "Taiwan Semiconductor Industrial Zone Policy",
      description:
        "Designates an advanced semiconductor industrial zone for ASML, TSMC suppliers, and EDA tool companies.",
    },
    Social: {
      name: "Taiwan Long-Term Care 2.0 Expansion",
      description:
        "Scales long-term care services to cover 900,000 elderly Taiwanese by 2029 as the population rapidly ages.",
    },
  },
  hk: {
    Climate: {
      name: "Hong Kong Climate Action Plan 2050",
      description:
        "Phases out coal-fired power by 2035 and achieves carbon neutrality by 2050 with LNG, nuclear, and solar.",
    },
    Healthcare: {
      name: "Hong Kong Primary Healthcare Blueprint",
      description:
        "Expands district health centres and family doctor registrations to shift care upstream from Hospital Authority.",
    },
    Infrastructure: {
      name: "Northern Metropolis Development Strategy",
      description:
        "Develops 300,000 homes and a Northern Metropolis linked to Shenzhen along the Lo Wu and Lok Ma Chau corridors.",
    },
    Education: {
      name: "Hong Kong STEAM Education Promotion",
      description:
        "Integrates STEAM across K-12 with maker labs, robotics, and AI literacy in all government-aided schools.",
    },
    Economy: {
      name: "Hong Kong Fintech and Virtual Asset Policy",
      description:
        "Issues comprehensive licensing for virtual asset trading platforms to position Hong Kong as Asia's crypto hub.",
    },
    Defense: {
      name: "HKPF National Security Law Implementation",
      description:
        "Operationalizes the National Security Law through police national security units and court infrastructure.",
    },
    Technology: {
      name: "Hong Kong InnoHub Innovation District",
      description:
        "Builds InnoHub in Pak Shek Kok as a 100 hectare deep tech research and venture capital cluster.",
    },
    Social: {
      name: "Hong Kong Poverty Alleviation Community Care",
      description:
        "Extends community care vouchers and elderly poverty relief as Hong Kong's Gini coefficient remains the developed world's highest.",
    },
  },
  ir: {
    Climate: {
      name: "Iran Renewable Energy Targets",
      description:
        "Aims for 10 GW of renewables by 2025 while managing the contradiction of oil dependence under sanctions.",
    },
    Healthcare: {
      name: "Iran Health Transformation Plan",
      description:
        "Expands health insurance and hospital admission subsidies to reduce out-of-pocket spending below 30% of costs.",
    },
    Infrastructure: {
      name: "Iran North-South Transport Corridor",
      description:
        "Develops the International North-South Transport Corridor connecting Russia to the Persian Gulf through Iran.",
    },
    Education: {
      name: "Iran National Knowledge-Based Economy Plan",
      description:
        "Funds KBE knowledge-based companies from universities to reduce sanctions-driven technology isolation.",
    },
    Economy: {
      name: "Iran Resistance Economy Anti-Sanctions Strategy",
      description:
        "Builds self-sufficiency in food, medicine, and industrial goods to neutralize US and EU sanctions pressure.",
    },
    Defense: {
      name: "Iran IRGC Strategic Defense Doctrine",
      description:
        "Maintains forward defense through proxy networks, ballistic missiles, and nuclear escalation management.",
    },
    Technology: {
      name: "Iran National Internet (SHOMA) Infrastructure",
      description:
        "Develops a domestic internet network to enable selective decoupling from the global internet.",
    },
    Social: {
      name: "Iran Subsidy Reform Targeting Program",
      description:
        "Redirects untargeted energy subsidies toward direct cash transfers to lower-income Iranian households.",
    },
  },
  iq: {
    Climate: {
      name: "Iraq Flaring Reduction Partnership",
      description:
        "Partners with World Bank GGFR to end routine gas flaring from Iraq's oil fields and monetize associated gas.",
    },
    Healthcare: {
      name: "Iraq Primary Healthcare Reconstruction",
      description:
        "Rebuilds primary healthcare centers destroyed during IS conflict with WHO and USAID funding.",
    },
    Infrastructure: {
      name: "Iraq Development Road Project",
      description:
        "Builds a 1,200 km highway and rail corridor from the Grand Faw Port to the Turkish border.",
    },
    Education: {
      name: "Iraq School Quality Improvement Program",
      description:
        "Repairs 7,000 damaged schools and trains 150,000 teachers through World Bank technical assistance.",
    },
    Economy: {
      name: "Iraq Oil Revenue Diversification Strategy",
      description:
        "Invests oil windfall into agriculture, tourism, and logistics to build non-oil GDP income streams.",
    },
    Defense: {
      name: "Iraq ISF Counter-ISIL Consolidation Plan",
      description:
        "Builds Iraqi Security Forces capacity to independently maintain the territorial defeat of ISIL across Anbar and Nineveh.",
    },
    Technology: {
      name: "Iraq Digital Infrastructure Development",
      description:
        "Expands fiber broadband and data center capacity to support Iraq's emerging e-commerce and digital services sector.",
    },
    Social: {
      name: "Iraq IDP Return and Reconstruction Fund",
      description:
        "Funds safe housing, livelihoods, and social cohesion for 1.2M Iraqis still internally displaced from IS conflict.",
    },
  },
  my: {
    Climate: {
      name: "Malaysia New Industrial Master Plan Green Pillar",
      description:
        "Integrates solar manufacturing, green hydrogen, and EV assembly into Malaysia's 2030 industrial strategy.",
    },
    Healthcare: {
      name: "Malaysia MyHealth Initiative Expansion",
      description:
        "Extends the Ministry of Health's digital health record and teleconsultation system to all 1,036 government clinics.",
    },
    Infrastructure: {
      name: "Malaysia East Coast Rail Link Completion",
      description:
        "Completes the ECRL linking Port Klang to Kota Bharu, opening Malaysia's interior to industrial development.",
    },
    Education: {
      name: "Malaysia Malaysia Education Blueprint 2013-2025 Close-Out",
      description:
        "Closes out the 11-year Education Blueprint with final wave of curriculum reform and teacher quality improvements.",
    },
    Economy: {
      name: "Malaysia National Semiconductor Strategy",
      description:
        "Targets $24B in new semiconductor investment to move Malaysia up the value chain from back-end to advanced packaging.",
    },
    Defense: {
      name: "Malaysia Royal Malaysian Armed Forces Modernization",
      description:
        "Upgrades Malaysia's navy and air force to defend the South China Sea maritime boundary claims.",
    },
    Technology: {
      name: "Malaysia MyDIGITAL Digital Economy Blueprint",
      description:
        "Digitizes government services, develops cloud infrastructure, and grows Malaysia's digital economy to 22.6% of GDP.",
    },
    Social: {
      name: "Malaysia PADU Household Data Registry",
      description:
        "Builds a unified population database to better target subsidies and welfare to the bottommost 40% of earners.",
    },
  },
  vn: {
    Climate: {
      name: "Vietnam Just Energy Transition Partnership",
      description:
        "Mobilizes $15.5B from G7 partners to retire Vietnam's coal plants and accelerate offshore wind development.",
    },
    Healthcare: {
      name: "Vietnam Universal Health Coverage Strategy",
      description:
        "Raises health insurance enrollment from 91% to 95% while improving the quality of rural commune health stations.",
    },
    Infrastructure: {
      name: "Vietnam North-South Expressway Completion",
      description:
        "Completes the 1,811 km North-South Expressway connecting Hanoi to Ho Chi Minh City by 2025.",
    },
    Education: {
      name: "Vietnam National Education Reform Decree 30",
      description:
        "Reforms university governance to increase academic autonomy and align research with enterprise needs.",
    },
    Economy: {
      name: "Vietnam FDI Supply Chain Upgrade",
      description:
        "Attracts tier-1 Samsung, Intel, and Apple supplier relocations while increasing domestic content requirements.",
    },
    Defense: {
      name: "Vietnam Three No's Defense Policy Modernization",
      description:
        "Modernizes navy and air force while maintaining the 'Three Nos' foreign policy to manage China tensions.",
    },
    Technology: {
      name: "Vietnam National Digital Transformation Program",
      description:
        "Targets a digital economy worth 30% of GDP by 2030 through e-government, digital commerce, and smart cities.",
    },
    Social: {
      name: "Vietnam Hunger Eradication and Poverty Reduction",
      description:
        "Implements the National Multidimensional Poverty Reduction Program to bring remaining poor to sustainable income levels.",
    },
  },
  ph: {
    Climate: {
      name: "Philippines Renewable Energy Act Implementation",
      description:
        "Mandates competitive renewable energy auctions to raise renewables from 29% to 35% of the generation mix by 2030.",
    },
    Healthcare: {
      name: "Philippines Universal Health Care Act",
      description:
        "Implements automatic enrollment of all Filipinos in PhilHealth with primary care and medicines coverage.",
    },
    Infrastructure: {
      name: "Philippines Build Better More Infrastructure",
      description:
        "Continues the $180B Build Better More program with roads, bridges, airports, and flood control works.",
    },
    Education: {
      name: "Philippines MATATAG K-12 Curriculum Overhaul",
      description:
        "Simplifies the K-12 curriculum and raises foundational literacy and numeracy targets for all Filipino students.",
    },
    Economy: {
      name: "Philippines PEZA Economic Zone Expansion",
      description:
        "Opens new PEZA special economic zones near Clark and Subic to attract semiconductor and BPO investment.",
    },
    Defense: {
      name: "Philippines South China Sea Maritime Patrol",
      description:
        "Deploys coast guard and AFP vessels to resupply Second Thomas Shoal and assert West Philippine Sea rights.",
    },
    Technology: {
      name: "Philippines Digital Transformation Roadmap",
      description:
        "Digitizes 1,000 government services through eGov PH Super App to improve citizen access and reduce corruption.",
    },
    Social: {
      name: "Philippines Subsidized Rice for All Program",
      description:
        "Implements President Marcos's P29/kg subsidized rice program for low-income Filipinos amid supply shortages.",
    },
  },
  bd: {
    Climate: {
      name: "Bangladesh Delta Plan 2100",
      description:
        "Implements a 100-year adaptive delta management strategy to protect Bangladesh from sea-level rise and riverine flooding.",
    },
    Healthcare: {
      name: "Bangladesh Community Clinic Expansion",
      description:
        "Scales up the community clinic model providing basic healthcare to 30M rural Bangladeshis at the village level.",
    },
    Infrastructure: {
      name: "Bangladesh Padma Bridge Transport Link",
      description:
        "Leverages the newly opened Padma Bridge to industrialize Bangladesh's south and west regions.",
    },
    Education: {
      name: "Bangladesh Smart Education Program",
      description:
        "Deploys tablets, digital content, and teacher ICT training to close rural-urban digital education divides.",
    },
    Economy: {
      name: "Bangladesh Post-LDC Export Diversification",
      description:
        "Builds export sectors beyond garments including ICT, pharmaceuticals, and light engineering before LDC graduation.",
    },
    Defense: {
      name: "Bangladesh Armed Forces Modernization 2030",
      description:
        "Procures new fighter aircraft, naval vessels, and surveillance systems to modernize the Bangladesh Armed Forces.",
    },
    Technology: {
      name: "Bangladesh Digital Bangladesh 2041",
      description:
        "Extends Digital Bangladesh vision to a Smart Bangladesh by 2041 with AI, robotics, and smart citizenship.",
    },
    Social: {
      name: "Bangladesh Social Safety Net Expansion",
      description:
        "Consolidates 100+ social protection programs into a unified registry covering 22M vulnerable Bangladeshis.",
    },
  },
  pk: {
    Climate: {
      name: "Pakistan 10 Billion Tree Tsunami",
      description:
        "Restores 10 billion trees across degraded Pakistani landscapes to mitigate the impacts of devastating floods and heat.",
    },
    Healthcare: {
      name: "Pakistan Sehat Sahulat Universal Healthcare Program",
      description:
        "Provides Rs.1M free inpatient coverage per family annually under Imran Khan's landmark health card scheme.",
    },
    Infrastructure: {
      name: "Pakistan CPEC Phase II Development",
      description:
        "Advances the $62B China-Pakistan Economic Corridor into its second phase expanding industrial zones and energy.",
    },
    Education: {
      name: "Pakistan Single National Curriculum",
      description:
        "Implements a unified national curriculum across private, public, and madrassah schools for the first time.",
    },
    Economy: {
      name: "Pakistan IMF Stabilization Program",
      description:
        "Implements IMF-mandated fiscal consolidation, FX liberalization, and tax base expansion to stabilize the economy.",
    },
    Defense: {
      name: "Pakistan Full Spectrum Deterrence Strategy",
      description:
        "Maintains second-strike nuclear capability and conventional defense against India through indigenous missile programs.",
    },
    Technology: {
      name: "Pakistan IT Export Expansion Strategy",
      description:
        "Targets $5B in annual IT exports through freelancer support, SEZ development, and digital skills training.",
    },
    Social: {
      name: "Pakistan Ehsaas Poverty Alleviation Program",
      description:
        "Provides Kafaalat cash transfers to 8M impoverished Pakistani families as a unified social protection umbrella.",
    },
  },
  lk: {
    Climate: {
      name: "Sri Lanka 70% Renewable by 2030 Plan",
      description:
        "Targets 70% renewable electricity through wind farms in Mannar and solar parks replacing oil-fired generation.",
    },
    Healthcare: {
      name: "Sri Lanka Free Health Services Restoration",
      description:
        "Restores medicines, consumables, and doctor shortages following the 2022 economic collapse's impact on healthcare.",
    },
    Infrastructure: {
      name: "Sri Lanka Port City Colombo completion",
      description:
        "Develops the Colombo Port City as a Special Economic Zone and financial hub to diversify the economy.",
    },
    Education: {
      name: "Sri Lanka Tech Talent Pipeline",
      description:
        "Expands ICT and engineering graduates through reformed university curricula aligned with IT export sector demand.",
    },
    Economy: {
      name: "Sri Lanka Debt Restructuring & IMF Program",
      description:
        "Executes a $2.9B IMF Extended Fund Facility with bilateral debt restructuring of Chinese and other creditors.",
    },
    Defense: {
      name: "Sri Lanka Post-War Military Right-Sizing",
      description:
        "Reduces the oversized wartime military while retaining professionalized maritime and anti-terrorism capabilities.",
    },
    Technology: {
      name: "Sri Lanka Digital Economy Strategy",
      description:
        "Digitizes government services and develops free trade zone ICT clusters to grow exports above $1B.",
    },
    Social: {
      name: "Sri Lanka Aswesuma Social Assistance Program",
      description:
        "Replaces multiple welfare schemes with Aswesuma to reach the poorest 1.8M households with monthly transfers.",
    },
  },
  np: {
    Climate: {
      name: "Nepal NDC Hydro-Centric Energy Vision",
      description:
        "Harnesses Nepal's 83 GW hydropower potential as the centerpiece of its nationally determined contribution.",
    },
    Healthcare: {
      name: "Nepal Health Insurance Program Expansion",
      description:
        "Extends the national health insurance scheme to all 77 districts providing Rs.100,000 inpatient coverage.",
    },
    Infrastructure: {
      name: "Nepal Fast Track Road Kathmandu-Terai",
      description:
        "Completes the 72 km Fast Track connecting Kathmandu to the Terai plains to end the capital's supply bottleneck.",
    },
    Education: {
      name: "Nepal School Sector Development Plan",
      description:
        "Raises school completion rates through infrastructure grants, scholarship programs, and trained teacher deployment.",
    },
    Economy: {
      name: "Nepal Remittance-to-Investment Conversion Strategy",
      description:
        "Channels large remittance inflows into domestic investment through diaspora bonds and matched savings programs.",
    },
    Defense: {
      name: "Nepal Army UN Peacekeeping Contribution",
      description:
        "Maintains Nepal's status as a top UN peacekeeping contributor with specialized engineering and medical units.",
    },
    Technology: {
      name: "Nepal Digital Nepal Framework",
      description:
        "Builds Nepal's digital government infrastructure addressing e-governance, digital skills, and national cybersecurity.",
    },
    Social: {
      name: "Nepal Social Security Allowance Expansion",
      description:
        "Extends old age, disability, and single-women allowances as Nepal builds a formal social protection floor.",
    },
  },
  mm: {
    Climate: {
      name: "Myanmar NDC Climate Adaptation in Conflict",
      description:
        "Pursues cyclone preparedness, mangrove restoration, and solar minigrids despite post-coup governance collapse.",
    },
    Healthcare: {
      name: "Myanmar Civil Society Health Service Delivery",
      description:
        "Relies on civil society and ethnic health organizations to maintain basic healthcare amid military governance.",
    },
    Infrastructure: {
      name: "Myanmar Kyaukphyu SEZ China Corridor",
      description:
        "Advances China-financed Kyaukphyu deep-sea port as the anchor of Myanmar's southern economic corridor.",
    },
    Education: {
      name: "Myanmar Civil Disobedience Schools",
      description:
        "Supports underground civil disobedience movement schools that replaced the SAC-controlled public school system.",
    },
    Economy: {
      name: "Myanmar Shadow Economy Formalization",
      description:
        "Attempts to formalize border trade with Thailand and China amid widespread sanctions on junta-linked enterprises.",
    },
    Defense: {
      name: "Myanmar SAC Counter-Insurgency Campaign",
      description:
        "Conducts aerial bombing and ground operations against resistance forces holding large territories across Myanmar.",
    },
    Technology: {
      name: "Myanmar Digital Communications Suppression",
      description:
        "Enforces internet shutdowns and social media bans through state-controlled telecoms to limit resistance organizing.",
    },
    Social: {
      name: "Myanmar IDPs and Humanitarian Crisis Response",
      description:
        "Responds to 2.7M internally displaced persons through cross-border UN and NGO aid amid SAC access denials.",
    },
  },
  kh: {
    Climate: {
      name: "Cambodia Climate Change Strategic Plan",
      description:
        "Focuses climate investment on flood and drought adaptation for vulnerable Cambodian farming and coastal communities.",
    },
    Healthcare: {
      name: "Cambodia Health Equity Fund",
      description:
        "Provides free public hospital care to Cambodia's 2.2M poverty-card holders through the Health Equity Fund.",
    },
    Infrastructure: {
      name: "Cambodia Phnom Penh-Sihanoukville Expressway",
      description:
        "Develops a network of expressways from Phnom Penh to coastal and border economic zones.",
    },
    Education: {
      name: "Cambodia Education Strategic Plan 2024-2028",
      description:
        "Raises primary school completion, improves technical education, and narrows gender gaps in rural provinces.",
    },
    Economy: {
      name: "Cambodia SEZ Export Diversification",
      description:
        "Develops Special Economic Zones beyond garments into electronics, auto parts, and digital services exports.",
    },
    Defense: {
      name: "Cambodia Ream Naval Base China Cooperation",
      description:
        "Manages international skepticism over Chinese-funded upgrades to Ream Naval Base on the Gulf of Thailand.",
    },
    Technology: {
      name: "Cambodia Digital Economy and Society Policy",
      description:
        "Develops the digital economy through a fintech regulatory sandbox and e-payment infrastructure expansion.",
    },
    Social: {
      name: "Cambodia Social Assistance Program ID-Poor",
      description:
        "Delivers targeted social assistance, food, and healthcare to the 2.2M households in Cambodia's poor registry.",
    },
  },
  uz: {
    Climate: {
      name: "Uzbekistan Renewable Energy 25% Target",
      description:
        "Develops 5 GW of solar and wind capacity to achieve 25% renewable electricity and reduce Aral Sea energy use.",
    },
    Healthcare: {
      name: "Uzbekistan Healthcare Reform Concept 2025",
      description:
        "Builds a tiered primary, secondary, and tertiary care system replacing Uzbekistan's legacy Soviet Semashko model.",
    },
    Infrastructure: {
      name: "Uzbekistan New Tashkent City Development",
      description:
        "Develops New Tashkent as a satellite city with modern infrastructure to relieve the capital's density pressure.",
    },
    Education: {
      name: "Uzbekistan New Uzbekistan University",
      description:
        "Partners internationally to build world-class universities, reversing the education quality decline of the post-Soviet era.",
    },
    Economy: {
      name: "Uzbekistan Free Economic Zone Expansion",
      description:
        "Develops Navoi, Urgut, and Angren special economic zones to attract FDI and diversify from cotton and gas.",
    },
    Defense: {
      name: "Uzbekistan CSTO Independent Security Strategy",
      description:
        "Maintains separate defense doctrine from CSTO, developing bilateral military partnerships with the US and China.",
    },
    Technology: {
      name: "Uzbekistan Digital Uzbekistan 2030",
      description:
        "Digitizes public services, develops IT Parks, and trains 200,000 tech specialists for export to global markets.",
    },
    Social: {
      name: "Uzbekistan Labor Migration Management",
      description:
        "Formalizes labor mobility agreements with Russia, South Korea, and the UAE for 2M migrant Uzbek workers.",
    },
  },
  kz: {
    Climate: {
      name: "Kazakhstan Carbon Neutrality 2060 Strategy",
      description:
        "Allocates 50% of Kazakh state investment in a green economy, retiring coal plants while buffering oil revenues.",
    },
    Healthcare: {
      name: "Kazakhstan Healthy Kazakhstan 2025 Program",
      description:
        "Builds polyclinics and upgrades rural hospitals to reduce medical tourism and improve population health metrics.",
    },
    Infrastructure: {
      name: "Kazakhstan Trans-Caspian Trade Corridor",
      description:
        "Develops Middle Corridor rail and ferry capacity through the Caspian to bypass Russia for European trade.",
    },
    Education: {
      name: "Kazakhstan Trilingual Education Policy",
      description:
        "Phases in instruction in Kazakh, Russian, and English to create multilingual graduates aligned with global economy needs.",
    },
    Economy: {
      name: "Kazakhstan AIFC Astana Financial Hub",
      description:
        "Develops the Astana International Financial Centre as Central Asia's foremost capital markets and FinTech hub.",
    },
    Defense: {
      name: "Kazakhstan CSTO Deterrence Balance",
      description:
        "Maintains CSTO membership while pursuing independent diplomacy and multi-vector security alliances regionally.",
    },
    Technology: {
      name: "Kazakhstan Digital Kazakhstan Program",
      description:
        "Digitizes government services and attracts IT companies to Technopark Alatau and Astana Hub.",
    },
    Social: {
      name: "Kazakhstan Nurly Zhol Social Infrastructure",
      description:
        "Funds affordable housing, kindergartens, and cultural centers in rapidly urbanizing Almaty and Astana.",
    },
  },
  kw: {
    Climate: {
      name: "Kuwait National Energy Strategy 2035",
      description:
        "Targets 15% renewable energy through solar projects while managing OPEC quota obligations and oil export revenues.",
    },
    Healthcare: {
      name: "Kuwait Health Assurance Hospitals Program",
      description:
        "Builds new Health Assurance Authority hospitals to decongest the MOH public hospital network.",
    },
    Infrastructure: {
      name: "Kuwait Silk City & Boubyan Island Project",
      description:
        "Develops Madinat Al-Hareer as a $100B city-within-a-city and Boubyan Island as a major container port.",
    },
    Education: {
      name: "Kuwait PAAET Vocational Training Reform",
      description:
        "Revamps PAAET technical colleges to align vocational outputs with Kuwait's labor nationalization (Kuwaitization) goals.",
    },
    Economy: {
      name: "Kuwait Vision 2035 New Kuwait Diversification",
      description:
        "Transforms Kuwait into a regional financial and trade hub reducing oil dependence from 90% of revenues.",
    },
    Defense: {
      name: "Kuwait Eurofighter & Defense Modernization",
      description:
        "Procures 28 Eurofighter Typhoon aircraft and upgrades Patriot batteries to defend against regional missile threats.",
    },
    Technology: {
      name: "Kuwait Digital Transformation Initiative",
      description:
        "Digitizes 240 government services and develops Al-Asimah smart city infrastructure in Kuwait City.",
    },
    Social: {
      name: "Kuwait Bidun Statelessness Resolution",
      description:
        "Addresses the estimated 100,000 Bidun stateless residents' access to services, documentation, and naturalization pathways.",
    },
  },
  qa: {
    Climate: {
      name: "Qatar National Environment and Climate Strategy",
      description:
        "Targets 20% renewable energy and 20% energy efficiency improvement by 2030 in a petrostate decarbonizing gradually.",
    },
    Healthcare: {
      name: "Qatar National Health Strategy 2023-2030",
      description:
        "Builds Sidra Medicine capacity and expands preventive care for both nationals and migrant worker populations.",
    },
    Infrastructure: {
      name: "Qatar Integrated Rail & Metrolink Expansion",
      description:
        "Extends Doha Metro lines and Qatar Rail freight network to connect the New Beijing-Doha projects.",
    },
    Education: {
      name: "Qatar Education City Internationalization",
      description:
        "Expands Education City with new international university partnerships in energy, AI, and digital management.",
    },
    Economy: {
      name: "Qatar National Vision 2030 QNV Post-World Cup",
      description:
        "Leverages World Cup infrastructure and international visibility to grow tourism, finance, and logistics sectors.",
    },
    Defense: {
      name: "Qatar Al Udeid Air Base Strategic Value",
      description:
        "Maintains Al Udeid as the largest US air base in the Middle East while balancing regional neutrality diplomacy.",
    },
    Technology: {
      name: "Qatar Digital Agenda 2030",
      description:
        "Develops Qatar's digital economy through QF's Arab Research and Innovation Academy and smart government services.",
    },
    Social: {
      name: "Qatar Kafala Labour Reform 2024",
      description:
        "Implements minimum wage, right to change jobs, and exit permit reforms for Qatar's 2M migrant workers.",
    },
  },
  et: {
    Climate: {
      name: "Ethiopia Green Legacy Initiative",
      description:
        "Plants 20B trees in five years to restore degraded Ethiopian highlands and meet NDC forest cover targets.",
    },
    Healthcare: {
      name: "Ethiopia Health Extension Program Scale-Up",
      description:
        "Deploys 30,000 new Health Extension Workers to village level for preventive care and maternal health services.",
    },
    Infrastructure: {
      name: "Ethiopia Grand Renaissance Dam Completion",
      description:
        "Completes the GERD to generate 6,450 MW of electricity for Ethiopia and for export to Sudan and Egypt.",
    },
    Education: {
      name: "Ethiopia General Education Quality Improvement",
      description:
        "Increases teacher quality, textbook provision, and classroom construction for Ethiopia's 26M primary students.",
    },
    Economy: {
      name: "Ethiopia Homegrown Economic Reform",
      description:
        "Floats the birr, liberalizes telecom, and opens banking to foreign investors as IMF-supported structural reform.",
    },
    Defense: {
      name: "Ethiopia Post-Tigray National Reconciliation Command",
      description:
        "Rebuilds the ENDF as a national not ethnic institution following the Tigray War's devastating institutional damage.",
    },
    Technology: {
      name: "Ethiopia Ethio Telecom 4G National Expansion",
      description:
        "Expands Ethio Telecom's 4G network to connect 20 million new users and enable mobile financial services.",
    },
    Social: {
      name: "Ethiopia National Social Protection Policy",
      description:
        "Implements Ethiopia's Productive Safety Net Program with expanded cash-for-work and direct support for 8M beneficiaries.",
    },
  },
  ke: {
    Climate: {
      name: "Kenya National Climate Change Action Plan III",
      description:
        "Grows geothermal, wind, and solar capacity in the Lake Turkana corridor to maintain 90%+ clean electricity.",
    },
    Healthcare: {
      name: "Kenya Social Health Authority UHC Rollout",
      description:
        "Replaces NHIF with the Social Health Authority to provide preventive, primary, and hospital coverage for all Kenyans.",
    },
    Infrastructure: {
      name: "Kenya SGR Standard Gauge Railway Phase 2",
      description:
        "Extends the Standard Gauge Railway from Naivasha to Kisumu and Mombasa to complete the national corridor.",
    },
    Education: {
      name: "Kenya Competency Based Curriculum Full Implementation",
      description:
        "Completes the rollout of Kenya's new CBC system across all grades with adequate teacher training and materials.",
    },
    Economy: {
      name: "Kenya Africa Digital Economy Ambition",
      description:
        "Targets Nairobi as Africa's leading fintech hub through M-Pesa ecosystem development and startup ecosystem support.",
    },
    Defense: {
      name: "Kenya Multinational Security Support Haiti Mission",
      description:
        "Leads the MSS Kenya-led multinational security mission to restore order in gang-controlled Port-au-Prince.",
    },
    Technology: {
      name: "Kenya Konza Technopolis Smart City",
      description:
        "Develops Konza Technopolis as a 5,000-acre smart city and ICT hub 60 km south of Nairobi.",
    },
    Social: {
      name: "Kenya Hustler Fund Financial Inclusion",
      description:
        "Provides micro-loans from Ksh.500 to 50M through the Hustler Fund to informally employed Kenyans.",
    },
  },
  gh: {
    Climate: {
      name: "Ghana Nationally Determined Contributions 2030",
      description:
        "Funds solar park development and sustainable forest management to meet Ghana's 15% emissions reduction pledge.",
    },
    Healthcare: {
      name: "Ghana NHIA Health Insurance Sustainability",
      description:
        "Reforms the National Health Insurance Authority's claims processing to prevent provider payment arrears.",
    },
    Infrastructure: {
      name: "Ghana Accra-Kumasi Expressway Construction",
      description:
        "Builds the Accra-Kumasi 4-lane expressway to improve the economic artery between Ghana's two largest cities.",
    },
    Education: {
      name: "Ghana Free Senior High School Policy",
      description:
        "Sustains and improves quality of Ghana's Free SHS program which has doubled secondary school enrollment.",
    },
    Economy: {
      name: "Ghana Gold for Oil Barter Program",
      description:
        "Develops a structured gold purchase and oil barter program to address Ghana's chronic FX shortage.",
    },
    Defense: {
      name: "Ghana Armed Forces UN Peacekeeping Enhancement",
      description:
        "Maintains Ghana's tradition of UN peacekeeping contributions with investments in training and equipment.",
    },
    Technology: {
      name: "Ghana Digital Financial Services Policy",
      description:
        "Builds on Mobile Money interoperability to develop a comprehensive digital payments and fintech regulation framework.",
    },
    Social: {
      name: "Ghana LEAP Livelihood Empowerment Against Poverty",
      description:
        "Provides bimonthly cash grants to 350,000 extremely poor Ghanaian households with children and elderly members.",
    },
  },
  tz: {
    Climate: {
      name: "Tanzania Climate Change Response Strategy",
      description:
        "Expands Julius Nyerere Hydropower Station and protects the Serengeti-Kilimanjaro watershed from deforestation.",
    },
    Healthcare: {
      name: "Tanzania Big Results Now Health Program",
      description:
        "Targets maternal mortality, child mortality, and malaria reductions through frontline health worker management reform.",
    },
    Infrastructure: {
      name: "Tanzania Standard Gauge Railway Central Line",
      description:
        "Constructs the Dar es Salaam-Mwanza standard gauge railway linking the Indian Ocean coast to Lake Victoria.",
    },
    Education: {
      name: "Tanzania Free Basic Education Policy",
      description:
        "Eliminates primary and ordinary secondary school fees to raise completion rates among poor and rural Tanzanians.",
    },
    Economy: {
      name: "Tanzania LNG Export Project Development",
      description:
        "Finalizes the stalled offshore LNG project with Shell and Equinor to begin commercial production by 2030.",
    },
    Defense: {
      name: "Tanzania TPDF Regional Peacekeeping Role",
      description:
        "Deploys TPDF units to SADC-led regional missions in eastern DRC to address M23 insurgency spillover.",
    },
    Technology: {
      name: "Tanzania Digital Tanzania Project",
      description:
        "Builds fiber optic connectivity, digitizes public services, and creates technology parks in Dar es Salaam.",
    },
    Social: {
      name: "Tanzania Social Protection Expansion",
      description:
        "Scales the Productive Social Safety Net to cover 1M extremely poor Tanzanian households with cash and nutrition support.",
    },
  },
  ao: {
    Climate: {
      name: "Angola Renewable Energy for All Program",
      description:
        "Develops the Caculo Cabaça hydropower project and solar mini-grids to electrify Angola's 50% unelectrified population.",
    },
    Healthcare: {
      name: "Angola National Health Development Plan",
      description:
        "Rebuilds Angola's primary health network devastated by civil war with 210 new health centers.",
    },
    Infrastructure: {
      name: "Angola Lobito Corridor Railway Rehabilitation",
      description:
        "Rehabilitates the 1,344 km Lobito Corridor connecting Zambia and DRC copper and cobalt mines to Angola's Atlantic port.",
    },
    Education: {
      name: "Angola Education Expansion Plan",
      description:
        "Builds 13,000 classrooms and trains 200,000 teachers to accommodate Angola's rapidly growing youth population.",
    },
    Economy: {
      name: "Angola Oil Sector Diversification Strategy",
      description:
        "Develops agriculture, fisheries, and diamond mining to complement oil as Angola's sovereign wealth fund diversifies.",
    },
    Defense: {
      name: "Angola FAPLA Maritime Security Enhancement",
      description:
        "Expands Angola's naval patrol capacity in the Gulf of Guinea to combat piracy and protect offshore oil platforms.",
    },
    Technology: {
      name: "Angola Digital Agenda 2022-2027",
      description:
        "Develops Angola's telecoms infrastructure, e-government, and digital economy with fiber connecting all 18 provinces.",
    },
    Social: {
      name: "Angola National Social Action Program",
      description:
        "Provides cash transfers, food baskets, and subsidized utilities to Angola's extreme poor as oil wealth contracts.",
    },
  },
  ma: {
    Climate: {
      name: "Morocco Integrated Wind-Solar Energy Plan",
      description:
        "Scales Noor Ouarzazate CSP and Tarfaya wind to achieve 52% renewable electricity by 2030.",
    },
    Healthcare: {
      name: "Morocco Universal Medical Coverage AMO TADAMON",
      description:
        "Extends compulsory health insurance to 22M informal workers and self-employed through the AMO Tadamon scheme.",
    },
    Infrastructure: {
      name: "Morocco Atlantic-Mediterranean High-Speed Rail",
      description:
        "Expands the Al Boraq TGV from Tangier-Casablanca to Agadir and Marrakech as North Africa's premier rail network.",
    },
    Education: {
      name: "Morocco National Education Reform 2022-2026",
      description:
        "Redesigns Moroccan education to increase French and Arabic bilingual competence and STEM graduate rates.",
    },
    Economy: {
      name: "Morocco Green Hydrogen National Plan",
      description:
        "Develops green hydrogen production using Moroccan solar and wind resources for European market export.",
    },
    Defense: {
      name: "Morocco F-16 Fleet Expansion Program",
      description:
        "Expands the Royal Moroccan Air Force F-16 fleet and upgrades advanced weapons systems for Sahel security.",
    },
    Technology: {
      name: "Morocco Digital Morocco 2030",
      description:
        "Builds Casablanca Technopark capacity and a nationwide 5G network to position Morocco as an African digital hub.",
    },
    Social: {
      name: "Morocco Al Ghad Social Protection Reform",
      description:
        "Transitions Morocco's subsidy system to targeted cash transfers for the poorest 30% of households.",
    },
  },
  mz: {
    Climate: {
      name: "Mozambique Climate Resilience Building",
      description:
        "Hardens cyclone-prone coastal communities with mangrove restoration, early warning, and climate-resilient housing.",
    },
    Healthcare: {
      name: "Mozambique Health Systems Strengthening",
      description:
        "Expands HIV treatment access and child vaccination coverage through Fundo Nacional de Saúde reforms.",
    },
    Infrastructure: {
      name: "Mozambique Nacala Corridor Development",
      description:
        "Rehabilitates the Nacala Corridor railway linking Malawi and Zambia to the deep-water Nacala port.",
    },
    Education: {
      name: "Mozambique Accelerated Literacy Program",
      description:
        "Targets Mozambique's 60% adult illiteracy through community literacy circles and radio-based education.",
    },
    Economy: {
      name: "Mozambique LNG Rovuma Basin Development",
      description:
        "Develops the Rovuma Basin LNG projects with TotalEnergies and Eni to generate transformative export revenues.",
    },
    Defense: {
      name: "Mozambique Rwandan-SADC Cabo Delgado Security",
      description:
        "Coordinates Rwandan and SADC forces to stabilize Cabo Delgado province against Al-Shabaab insurgent attacks.",
    },
    Technology: {
      name: "Mozambique Digital Financial Inclusion",
      description:
        "Extends M-Pesa and mobile banking access to Mozambique's 85% unbanked rural population.",
    },
    Social: {
      name: "Mozambique First 1000 Days Child Nutrition",
      description:
        "Implements First 1000 Days programs to address Mozambique's 38% stunting rate among children under five.",
    },
  },
  co: {
    Climate: {
      name: "Colombia Total Transformation Energy Plan",
      description:
        "Accelerates offshore wind, solar, and green hydrogen development to complement Colombia's hydro-dominated grid.",
    },
    Healthcare: {
      name: "Colombia Petro Healthcare Reform",
      description:
        "Restructures Colombia's managed care system to increase public funding and reduce EPS insurer margins.",
    },
    Infrastructure: {
      name: "Colombia Concesiones Viales 5G Program",
      description:
        "Awards the $15B fifth generation road concessions to build 1,200 km of new highway and 8,000 km of upgrades.",
    },
    Education: {
      name: "Colombia Matrícula Cero Free Higher Education",
      description:
        "Eliminates tuition at public universities for students from low-income families through the Matrícula Cero program.",
    },
    Economy: {
      name: "Colombia Oil Transition Reinvention Strategy",
      description:
        "Plans a gradual exit from oil exploration dependency while developing agroindustry and creative economy sectors.",
    },
    Defense: {
      name: "Colombia FARC Second Wave Security Response",
      description:
        "Responds to FARC dissident and ELN resurgence with targeted military operations and coca eradication programs.",
    },
    Technology: {
      name: "Colombia Blockchain and Digital Government",
      description:
        "Uses blockchain for land registry and anti-corruption controls in Colombia's notoriously fraud-prone title systems.",
    },
    Social: {
      name: "Colombia Total Peace Reintegration Program",
      description:
        "Extends benefits and economic reintegration support to 13,000 FARC ex-combatants under the 2016 peace accord.",
    },
  },
  cl: {
    Climate: {
      name: "Chile Carbon Neutrality 2050 Roadmap",
      description:
        "Targets 80% renewable electricity by 2030 using Atacama Desert solar, Patagonian wind, and green hydrogen export.",
    },
    Healthcare: {
      name: "Chile FONASA Premium Coverage Expansion",
      description:
        "Raises FONASA's benefit basket to include prescription drugs, dental care, and mental health services.",
    },
    Infrastructure: {
      name: "Chile Tren Central Electrification Program",
      description:
        "Electrifies Chile's central rail network from Santiago to Curicó reducing carbon emissions from passenger travel.",
    },
    Education: {
      name: "Chile Gratuidad Free Higher Education",
      description:
        "Funds full tuition-free tertiary study for students from the bottom 60% of household income distributions.",
    },
    Economy: {
      name: "Chile Lithium National Strategy",
      description:
        "Establishes state participation in lithium extraction through Codelco and SQM JVs to maximize sovereign revenues.",
    },
    Defense: {
      name: "Chile Pacific Maritime Patrol Expansion",
      description:
        "Modernizes the Armada de Chile with new Type 23 frigates and AIP submarines to project Pacific maritime sovereignty.",
    },
    Technology: {
      name: "Chile Technology and Telecommunications Fund",
      description:
        "Funds rural broadband, AI public services, and cyber-security standards through the FDT Chile Digital fund.",
    },
    Social: {
      name: "Chile Constitutional Social Rights Process",
      description:
        "Implements social rights commitments from the constitutional process through pension reform and universal childcare.",
    },
  },
  pe: {
    Climate: {
      name: "Peru Amazon Deforestation Zero Plan",
      description:
        "Combines forest protection payments, indigenous territorial titling, and sustainable livelihoods to prevent Amazon clearing.",
    },
    Healthcare: {
      name: "Peru SIS Universal Health Insurance Strengthening",
      description:
        "Raises quality of SIS-financed care through result-based contracts at primary health facilities.",
    },
    Infrastructure: {
      name: "Peru Línea 2 Lima Metro Completion",
      description:
        "Completes Línea 2 of Lima Metro providing east-west mass transit to relieve the city's gridlocked road network.",
    },
    Education: {
      name: "Peru Aprendo en Casa Learning Recovery",
      description:
        "Implements a combined in-person and digital learning recovery program post-COVID for Peru's 8.7M students.",
    },
    Economy: {
      name: "Peru Mine Conflict Resolution Strategy",
      description:
        "Modernizes the prior consultation process and social license framework governing Peru's $60B mining pipeline.",
    },
    Defense: {
      name: "Peru Pacific Coast Defense Modernization",
      description:
        "Upgrades FAP fighter jets and Marina de Guerra submarines while managing civilian oversight of a politically active military.",
    },
    Technology: {
      name: "Peru Digital Transformation Government Plan",
      description:
        "Digitizes all citizen-facing government services and launches Peru's national digital identity credential.",
    },
    Social: {
      name: "Peru Cuna Más Early Childhood Program",
      description:
        "Delivers home visits, growth monitoring, and stimulation kits to 300,000 poor Peruvian children under 36 months.",
    },
  },
  ve: {
    Climate: {
      name: "Venezuela Orinoco Belt Gas Flaring Reduction",
      description:
        "Attempts to reduce massive routine gas flaring from Orinoco Basin oil production under extreme resource constraints.",
    },
    Healthcare: {
      name: "Venezuela CLAP Medical Supply Network",
      description:
        "Distributes medicines through CLAP local supply networks as private pharmacies face acute shortages.",
    },
    Infrastructure: {
      name: "Venezuela Caracas Metro Rehabilitation",
      description:
        "Attempts partial rehabilitation of Caracas Metro system degraded by over a decade of deferred maintenance.",
    },
    Education: {
      name: "Venezuela Mission Robinson Literacy Continuity",
      description:
        "Sustains Mission Robinson adult literacy and primary education programs despite mass teacher emigration.",
    },
    Economy: {
      name: "Venezuela Dollarization Management Strategy",
      description:
        "Adapts monetary policy to informal dollarization as the bolívar remains unreliable for everyday transactions.",
    },
    Defense: {
      name: "Venezuela FANB Renegade Mine Control",
      description:
        "Attempts FANB control over illegal mining (sindicatos) in Bolívar state competing with official state mining plans.",
    },
    Technology: {
      name: "Venezuela CONATEL Digital Censorship Management",
      description:
        "Operates CONATEL internet regulation including selective blocking of opposition news and social media platforms.",
    },
    Social: {
      name: "Venezuela Carnet de la Patria Social Payment System",
      description:
        "Distributes state benefits, subsidized food, and cash transfers exclusively through the Carnet de la Patria system.",
    },
  },
  ec: {
    Climate: {
      name: "Ecuador Galapagos Zero Plastic Initiative",
      description:
        "Eliminates single-use plastics from the Galapagos Islands and develops a marine plastic interception network.",
    },
    Healthcare: {
      name: "Ecuador Universal Health Coverage Plan MAIS",
      description:
        "Implements the Modelo de Atención Integral en Salud expanding primary care in rural and coastal Ecuador.",
    },
    Infrastructure: {
      name: "Ecuador Multimodal Trade Corridor Development",
      description:
        "Develops the Manta-Manaos corridor connecting Ecuador's Pacific coast to Brazil's Amazon river system.",
    },
    Education: {
      name: "Ecuador Millennium Education Units Expansion",
      description:
        "Builds modern Millennium Education Unit schools in rural communities replacing one-room schoolhouses.",
    },
    Economy: {
      name: "Ecuador Non-Oil Economy Diversification",
      description:
        "Develops shrimp aquaculture, cut flowers, and cacao specialty exports to broaden Ecuador's dollarized economy.",
    },
    Defense: {
      name: "Ecuador Mexico Asylum Crisis Management",
      description:
        "Manages diplomatic fallout from the Ecuador police storming of the Mexican embassy and Noboa security agenda.",
    },
    Technology: {
      name: "Ecuador State Digital Services Portal",
      description:
        "Consolidates 800 public services into the Ecuador Digital citizen portal to reduce corruption in public administration.",
    },
    Social: {
      name: "Ecuador Bono de Desarrollo Humano Conditional Cash",
      description:
        "Provides monthly conditional cash transfers to 1M poor families contingent on school attendance and health checkups.",
    },
  },
  dz: {
    Climate: {
      name: "Algeria Solar Renewable Target SKTM",
      description:
        "Targets 15 GW of solar capacity by 2035 through the Sahara's exceptional irradiation resources.",
    },
    Healthcare: {
      name: "Algeria National Health Plan 2025",
      description:
        "Builds 50 new hospital facilities and upgrades 1,000 polyclinics to address Algeria's expanding urban population.",
    },
    Infrastructure: {
      name: "Algeria Trans-Saharan Highway Completion",
      description:
        "Completes the Trans-Saharan Highway linking Algeria to Nigeria through Niger for regional trade and migration management.",
    },
    Education: {
      name: "Algeria University STEM Modernization",
      description:
        "Reforms Algerian university engineering and science faculties to produce graduates meeting international employer standards.",
    },
    Economy: {
      name: "Algeria Hydrocarbons Revenue Management Post-2030",
      description:
        "Plans fiscal alternatives to oil and gas as reserves and production face long-term decline.",
    },
    Defense: {
      name: "Algeria Armed Forces Regional Power Projection",
      description:
        "Sustains Algeria's position as Africa's largest defense spender with Russian and Chinese equipment procurement.",
    },
    Technology: {
      name: "Algeria Algérie Télécom 4G National Rollout",
      description:
        "Extends 4G coverage to all 48 wilayas and accelerates fiber deployment for e-government and digital economy.",
    },
    Social: {
      name: "Algeria Unemployment Youth Insertion Strategy",
      description:
        "Funds 300,000 micro-enterprise grants for Algerian youth as 25% unemployment threatens social stability.",
    },
  },
  sd: {
    Climate: {
      name: "Sudan Khartoum Region Desertification Control",
      description:
        "Implements sand barrier plantings and watershed management to slow the Sahara's southward advance.",
    },
    Healthcare: {
      name: "Sudan Wartime Health Services Continuity",
      description:
        "Maintains WHO and NGO-supported health services as RSF-SAF civil war collapses the formal health system.",
    },
    Infrastructure: {
      name: "Sudan Merowe Dam Region Power Restoration",
      description:
        "Restores power transmission from Merowe Dam after war damage to Khartoum's electricity supply grid.",
    },
    Education: {
      name: "Sudan Emergency Education in Displacement",
      description:
        "Delivers UNICEF-supported education to 4M displaced Sudanese children in camps in Chad and South Sudan.",
    },
    Economy: {
      name: "Sudan Post-War Economic Reconstruction Plan",
      description:
        "Develops a future post-conflict reconstruction framework with IMF, World Bank, and Gulf creditor support components.",
    },
    Defense: {
      name: "Sudan SAF-RSF Civil War Military Operations",
      description:
        "Conducts armed operations against the RSF paramilitaries across Khartoum, Darfur, and North Kordofan.",
    },
    Technology: {
      name: "Sudan Digital Communications Wartime Disruption",
      description:
        "Addresses near-total internet outage across conflict zones while maintaining military communication channels.",
    },
    Social: {
      name: "Sudan Humanitarian Emergency Response Plan",
      description:
        "Coordinates the world's largest displacement crisis response for 10M displaced Sudanese through UN OCHA.",
    },
  },
  ug: {
    Climate: {
      name: "Uganda EACOP Climate Controversy Management",
      description:
        "Balances EACOP oil project revenues with managing international climate and human rights pressure campaigns.",
    },
    Healthcare: {
      name: "Uganda NRM Health Insurance Pilot",
      description:
        "Pilots community health insurance in 3 districts as a precursor to Uganda's Universal Health Coverage rollout.",
    },
    Infrastructure: {
      name: "Uganda Kampala-Entebbe Expressway Extension",
      description:
        "Extends the expressway network from Kampala toward Jinja and the new Kampala International Airport.",
    },
    Education: {
      name: "Uganda Universal Primary Education Improvement",
      description:
        "Improves quality benchmarks for the Universal Primary Education program which has tripled enrollment since 1997.",
    },
    Economy: {
      name: "Uganda Oil Production Readiness 2025",
      description:
        "Prepares the fiscal, legal, and logistical infrastructure to start oil production from the Albertine Graben by 2025.",
    },
    Defense: {
      name: "Uganda UPDF Somalia AMISOM Contribution",
      description:
        "Maintains Uganda's lead role in AMISOM/ATMIS as the largest troop contributor to Somalia's stabilization mission.",
    },
    Technology: {
      name: "Uganda Digital Transformation Masterplan",
      description:
        "Builds fiber backbone, expands mobile money, and digitizes government payments through the National IT Authority.",
    },
    Social: {
      name: "Uganda Bonna Bagagawale Wealth Creation",
      description:
        "Provides interest-free Parish Development Model grants to 10,594 parishes for income-generating activities.",
    },
  },
  ci: {
    Climate: {
      name: "Ivory Coast Forest Code Implementation",
      description:
        "Enforces zero-deforestation cocoa supply chain standards to preserve Ivory Coast's remaining 3M hectares of forest.",
    },
    Healthcare: {
      name: "Ivory Coast Couverture Maladie Universelle",
      description:
        "Expands the CMU health insurance to cover 4M cocoa farming families currently excluded from formal coverage.",
    },
    Infrastructure: {
      name: "Ivory Coast Abidjan Metropolitan Express",
      description:
        "Builds the Abidjan metro line linking Abobo and Anyama to the commercial Plateau district.",
    },
    Education: {
      name: "Ivory Coast School Feeding Program Scale-Up",
      description:
        "Extends the national school feeding program to all 17,000 primary schools to reduce absenteeism and malnutrition.",
    },
    Economy: {
      name: "Ivory Coast Cocoa Transformation Industrial Policy",
      description:
        "Mandates domestic grinding of 50% of cocoa beans to capture value-added processing revenues locally.",
    },
    Defense: {
      name: "Ivory Coast Post-Crisis Security Sector Reform",
      description:
        "Continues professionalizing the FRCI armed forces following decade of post-electoral conflict.",
    },
    Technology: {
      name: "Ivory Coast Digital Côte d'Ivoire Strategy",
      description:
        "Develops the Abidjan digital economy with fiber expansion, startups, and a Francophone tech talent pool.",
    },
    Social: {
      name: "Ivory Coast Child Labour in Cocoa Elimination",
      description:
        "Implements the Child Labour Monitoring and Remediation System in cocoa communities through 2025 targets.",
    },
  },
  cm: {
    Climate: {
      name: "Cameroon NDC REDD+ Forest Carbon",
      description:
        "Monetizes Cameroon's Congo Basin forests through REDD+ carbon credits to fund conservation and community development.",
    },
    Healthcare: {
      name: "Cameroon Basic Health Districts Reform",
      description:
        "Rebuilds the district health system in conflict-affected Anglophone regions and the Far North.",
    },
    Infrastructure: {
      name: "Cameroon Kribi Deep-Sea Port Phase 2",
      description:
        "Develops Phase 2 of Kribi's deep-sea port to position Cameroon as the logistics hub for Central Africa.",
    },
    Education: {
      name: "Cameroon Anglophone Education Crisis Response",
      description:
        "Develops Anglophone community school models to resume education for children displaced by the Anglophone Crisis.",
    },
    Economy: {
      name: "Cameroon Oil Transition Fiscal Strategy",
      description:
        "Prepares Cameroon's budget for declining oil revenues by developing bauxite, rubber, and manufacturing sectors.",
    },
    Defense: {
      name: "Cameroon BIR Anti-Boko Haram Operations",
      description:
        "Deploys the Rapid Intervention Battalion to protect the Far North from Boko Haram cross-border attacks.",
    },
    Technology: {
      name: "Cameroon Digital Economy Development",
      description:
        "Develops Cameroon's startup ecosystem through Orange Digital Centers and the national fiber optic backbone.",
    },
    Social: {
      name: "Cameroon Anglophone Crisis IDPs Support",
      description:
        "Provides shelter, food, and livelihoods support to 640,000 Anglophone Crisis IDPs in the NW and SW regions.",
    },
  },
  zm: {
    Climate: {
      name: "Zambia Drought Response and Energy Diversification",
      description:
        "Diversifies from hydro-dependent electricity toward solar amid Lake Kariba drought-driven power cuts.",
    },
    Healthcare: {
      name: "Zambia Universal Health Coverage Road Map",
      description:
        "Develops health financing and primary care frameworks for Zambia's path to universal coverage.",
    },
    Infrastructure: {
      name: "Zambia TAZARA Rail Rehabilitation",
      description:
        "Rehabilitates the Tanzania-Zambia Railway to reduce copper export dependence on South African rail routes.",
    },
    Education: {
      name: "Zambia Free Education Policy Sustainability",
      description:
        "Sustains fees-free basic and secondary education with adequate teacher recruitment and textbook provision.",
    },
    Economy: {
      name: "Zambia Copper-Cobalt Transition Economy",
      description:
        "Expands Zambia's cobalt and manganese processing to capture EV battery supply chain value beyond raw ore export.",
    },
    Defense: {
      name: "Zambia ZAF C-27J airlift capacity",
      description:
        "Maintains the Zambia Air Force's C-27J tactical airlift capacity for humanitarian and peacekeeping deployments.",
    },
    Technology: {
      name: "Zambia Digital Economy Policy 2021",
      description:
        "Expands mobile money, e-government, and ICT skills through a Zambia Information Communications Technology Authority program.",
    },
    Social: {
      name: "Zambia Social Cash Transfer Programme",
      description:
        "Provides monthly cash to 900,000 households in extreme poverty with a focus on child nutrition outcomes.",
    },
  },
  zw: {
    Climate: {
      name: "Zimbabwe Climate Change Policy 2023",
      description:
        "Focuses adaptation investment on smallholder agriculture resilience against cyclones and drought in Masvingo province.",
    },
    Healthcare: {
      name: "Zimbabwe Health Sector Investment Plan",
      description:
        "Rehabilitates collapsed government hospitals with equipment procurement using diaspora remittance matching funds.",
    },
    Infrastructure: {
      name: "Zimbabwe Beitbridge Border Post Modernization",
      description:
        "Modernizes the Beitbridge border post between Zimbabwe and South Africa to cut cross-border clearance times.",
    },
    Education: {
      name: "Zimbabwe School Rehabilitation Infrastructure Fund",
      description:
        "Repairs 3,000 school buildings damaged by Cyclones Idai and Freddy using World Bank and DFID grants.",
    },
    Economy: {
      name: "Zimbabwe Structured Currency Reform ZiG",
      description:
        "Introduces the Zimbabwe Gold (ZiG) structured currency backed by precious metals to replace the RTGS dollar.",
    },
    Defense: {
      name: "Zimbabwe ZNA SADC DRC Deployment",
      description:
        "Contributes Zimbabwe National Army battalions to the SADC Mission in DRC combating M23 insurgents.",
    },
    Technology: {
      name: "Zimbabwe National E-Government Master Plan",
      description:
        "Digitizes government services and expands mobile money integration with ZIMRA tax collection.",
    },
    Social: {
      name: "Zimbabwe Harmonized Social Cash Transfer",
      description:
        "Provides ZIMRA-collected revenue-backed monthly transfers to Zimbabwe's most destitute households.",
    },
  },
  sn: {
    Climate: {
      name: "Senegal Grand Vent Wind Farms Development",
      description:
        "Develops the Taiba N'Diaye and planned offshore wind projects to shift Senegal's electricity from expensive fuel oil.",
    },
    Healthcare: {
      name: "Senegal Couverture Maladie Universelle CMU",
      description:
        "Advances the CMU mutual insurance program toward universal coverage targeting 75% population enrollment by 2025.",
    },
    Infrastructure: {
      name: "Senegal TER Train Express Régional Dakar",
      description:
        "Operates the TER light rail connecting Dakar center to Blaise Diagne International Airport in 45 minutes.",
    },
    Education: {
      name: "Senegal Programme d'Amélioration de la Qualité",
      description:
        "Improves foundational reading and numeracy in Senegalese schools through structured pedagogy training programs.",
    },
    Economy: {
      name: "Senegal Pétrole et Gaz First Revenues Strategy",
      description:
        "Prepares Senegal's sovereign wealth fund and local content rules for first oil and gas production revenues.",
    },
    Defense: {
      name: "Senegal ECOWAS Regional Security Anchor",
      description:
        "Supports ECOWAS good governance and security missions from Dakar as the region's most stable democratic anchor.",
    },
    Technology: {
      name: "Senegal Digital Senegal Policy 2025",
      description:
        "Builds on the St. Louis Smart City and Dakar Silicon Valley ambitions to grow Senegal's technology exports.",
    },
    Social: {
      name: "Senegal Programme Nationale Bourses de Sécurité Familiale",
      description:
        "Provides conditional cash transfers to 360,000 extremely poor Senegalese households with children.",
    },
  },
  tn: {
    Climate: {
      name: "Tunisia National Energy Transition Plan",
      description:
        "Targets 35% renewable electricity by 2030 using Tunisia's solar and wind resources for domestic and European export.",
    },
    Healthcare: {
      name: "Tunisia CNAM Health Insurance Reform",
      description:
        "Reforms the CNAM national insurance fund's provider payment system to reduce out-of-pocket costs for chronic disease.",
    },
    Infrastructure: {
      name: "Tunisia Tunis-Sfax Rail Modernization",
      description:
        "Upgrades Tunisia's main north-south rail corridor to reduce freight costs and link coastal cities.",
    },
    Education: {
      name: "Tunisia School Reform and Dropout Prevention",
      description:
        "Redesigns secondary education tracks to reduce Tunisia's 100,000 annual school dropouts and unemployment cliff.",
    },
    Economy: {
      name: "Tunisia IMF Support Program 2024",
      description:
        "Implements fiscal consolidation and SOE restructuring to secure IMF program disbursements amid currency crisis.",
    },
    Defense: {
      name: "Tunisia Border Security against Sahel Threats",
      description:
        "Fortifies the Libyan and Algerian borders against AQIM and ISIS Sahara Province infiltration.",
    },
    Technology: {
      name: "Tunisia Digital Economy Act Implementation",
      description:
        "Implements Tunisia's FinTech regulatory sandbox, startup law, and e-commerce payment infrastructure expansion.",
    },
    Social: {
      name: "Tunisia Amen Social Protection Program",
      description:
        "Targets cash and in-kind support to 290,000 extremely poor Tunisian families under the Amen social program.",
    },
  },
  cd: {
    Climate: {
      name: "DRC Congo Basin CAFI Forest Protection",
      description:
        "Partners with Norway and UK in the Central African Forest Initiative to preserve the world's second largest rainforest.",
    },
    Healthcare: {
      name: "DRC Ebola Emergency Response Capacity",
      description:
        "Builds permanent rapid response infrastructure to contain future Ebola outbreaks in DRC's endemic eastern provinces.",
    },
    Infrastructure: {
      name: "DRC Grand Inga Hydropower Expansion",
      description:
        "Develops Grand Inga 3 to generate 11,000 MW connecting DRC's 80M unelectrified citizens and export to Southern Africa.",
    },
    Education: {
      name: "DRC Gratuité de l'Enseignement Free Primary Education",
      description:
        "Implements President Tshisekedi's free primary schooling mandate that added 4M new students in its first year.",
    },
    Economy: {
      name: "DRC Critical Minerals Coltan Governance",
      description:
        "Improves coltan, cobalt, and lithium governance frameworks to capture more value from DRC's extraordinary mineral wealth.",
    },
    Defense: {
      name: "DRC FARDC M23 Eastern Congo Operations",
      description:
        "Coordinates FARDC with UN MONUSCO and SADC forces against Rwanda-backed M23 insurgency in North Kivu.",
    },
    Technology: {
      name: "DRC Digital Congo River Development",
      description:
        "Leverages Airtel and Vodacom mobile money to deliver financial services to DRC's vast unbanked rural population.",
    },
    Social: {
      name: "DRC Food Security Emergency Response",
      description:
        "Responds to the world's largest food security crisis with 25M food-insecure Congolese through WFP crisis operations.",
    },
  },
  rw: {
    Climate: {
      name: "Rwanda Green Growth and Climate Resilience",
      description:
        "Implements Rwanda's Green Growth strategy combining reforestation, wetland restoration, and clean cooking fuel.",
    },
    Healthcare: {
      name: "Rwanda Mutuelle de Santé Community Health",
      description:
        "Operates the community-based Mutuelle de Santé insurance covering 90% of Rwandans at subsidized premiums.",
    },
    Infrastructure: {
      name: "Rwanda Kigali Mass Transit System",
      description:
        "Deploys Bus Rapid Transit and electric buses to address Kigali's rapidly worsening urban traffic congestion.",
    },
    Education: {
      name: "Rwanda Smart Classroom Digital Learning",
      description:
        "Equips all 3,000 Rwandan secondary schools with digital hubs for computer-aided STEM instruction.",
    },
    Economy: {
      name: "Rwanda Visit Rwanda Tourism Strategy",
      description:
        "Grows Rwanda's premium tourism brand through gorilla permits, MICE conferences, and Arsenal FC sponsorship.",
    },
    Defense: {
      name: "Rwanda RDF Regional Peacekeeping Operations",
      description:
        "Deploys 4,000 RDF troops to Mozambique Cabo Delgado and SADC DRC missions as Africa's premium peace force.",
    },
    Technology: {
      name: "Rwanda Smart Kigali Innovation City",
      description:
        "Develops Kigali Innovation City as a 2 km² tech and entrepreneurship hub attracting pan-African startups.",
    },
    Social: {
      name: "Rwanda Girinka One Cow Per Family Program",
      description:
        "Provides dairy cows to 350,000 poor Rwandan families to improve nutrition, income, and female economic empowerment.",
    },
  },
  ml: {
    Climate: {
      name: "Mali Sahel Great Green Wall Contribution",
      description:
        "Plants trees and restores 5M hectares of degraded Sahelian land as Mali's contribution to the Great Green Wall.",
    },
    Healthcare: {
      name: "Mali PRODESS Health Sector Development",
      description:
        "Implements Mali's health program to rebuild primary care networks devastated by conflict in the north and center.",
    },
    Infrastructure: {
      name: "Mali Dakar-Bamako Rail Rehabilitation",
      description:
        "Rehabilitates the historic Dakar-Bamako railway for passenger and freight to reduce Mali's transport isolation.",
    },
    Education: {
      name: "Mali Conflict-Sensitive Education Response",
      description:
        "Supports UNICEF school reopening programs for 1.3M children in conflict-affected northern and central zones.",
    },
    Economy: {
      name: "Mali Gold Mining Revenue Management",
      description:
        "Improves Mali's gold taxation and local content frameworks to retain more value from its #1 export.",
    },
    Defense: {
      name: "Mali FAMA Wagner/Africa Corps Partnership",
      description:
        "Coordinates FAMA operations with Russian Africa Corps forces replacing French Barkhane for jihadist counter-insurgency.",
    },
    Technology: {
      name: "Mali Mobile Financial Services Expansion",
      description:
        "Extends Orange Money and Moov Africa mobile payment platforms to Mali's rural smallholder farming communities.",
    },
    Social: {
      name: "Mali Humanitarian Crisis Response Plan",
      description:
        "Provides food, shelter, and protection to 8M Mali conflict-displaced persons through WFP, UNHCR, and ICRC.",
    },
  },
  bf: {
    Climate: {
      name: "Burkina Faso Great Green Wall Reforestation",
      description:
        "Mobilizes community-based reforestation to halt the Sahara's advance into Burkina's degraded Sahel farmland.",
    },
    Healthcare: {
      name: "Burkina Faso Resilient Health System Plan",
      description:
        "Attempts to maintain basic health services as 60% of health facilities in the north are closed by insecurity.",
    },
    Infrastructure: {
      name: "Burkina Faso Infrastructure Emergency Repair",
      description:
        "Restores road and telecommunications infrastructure cut by jihadist groups across northern and eastern regions.",
    },
    Education: {
      name: "Burkina Faso Emergency Education Junta Plan",
      description:
        "Reopens schools in secured areas while providing accelerated learning programs for 350,000 displaced children.",
    },
    Economy: {
      name: "Burkina Faso Gold Revenue Reinvestment",
      description:
        "Directs Société des Mines du Burkina gold revenue into military operations and basic social service provision.",
    },
    Defense: {
      name: "Burkina Faso AES Alliance Security Framework",
      description:
        "Coordinates with Mali and Niger in the Alliance des États du Sahel replacing ECOWAS and French security partners.",
    },
    Technology: {
      name: "Burkina Faso Mobile Connectivity Under Insecurity",
      description:
        "Attempts to maintain telecoms infrastructure as jihadist groups increasingly target cell towers and fiber links.",
    },
    Social: {
      name: "Burkina Faso IDP Emergency Food Security",
      description:
        "Coordinates WFP and OCHA food aid for 2M internally displaced people fleeing jihadist violence in the north.",
    },
  },
  ne: {
    Climate: {
      name: "Niger Great Green Wall National Contribution",
      description:
        "Implements farmer-managed natural regeneration on 5M hectares as Niger's Great Green Wall cornerstone.",
    },
    Healthcare: {
      name: "Niger Maternal Child Health Emergency Scale-Up",
      description:
        "Funds UNFPA and UNICEF emergency packages to address Niger's world-highest birth rate and child mortality.",
    },
    Infrastructure: {
      name: "Niger Trans-Saharan Highway Section Development",
      description:
        "Builds Niger's sections of the Trans-Saharan Highway linking Agadez to Arlit and Algeria.",
    },
    Education: {
      name: "Niger Demographic Pressure School Construction",
      description:
        "Constructs emergency classrooms to serve Niger's 3.7% annual population growth rate overwhelming school capacity.",
    },
    Economy: {
      name: "Niger Uranium to Petrostate Transition",
      description:
        "Develops the Agadem Basin oil field with China National Petroleum to build non-uranium fiscal revenues.",
    },
    Defense: {
      name: "Niger CNSP Junta AES Defense Framework",
      description:
        "Develops military partnership with Mali and Burkina Faso in the AES following French force expulsion in 2023.",
    },
    Technology: {
      name: "Niger Mobile Connectivity Rural Expansion",
      description:
        "Extends Niamey's telecoms network to Diffa, Agadez, and Tahoua regions with satellite-assisted connectivity.",
    },
    Social: {
      name: "Niger Food Aid Crisis Response",
      description:
        "Coordinates WFP food aid for 4.4M food-insecure Nigeriens as conflict, drought, and junta sanctions compound.",
    },
  },
  mg: {
    Climate: {
      name: "Madagascar Great South Climate Adaptation",
      description:
        "Addresses the southern Grand Sud's worst drought in 40 years with water harvesting and dry-land agriculture support.",
    },
    Healthcare: {
      name: "Madagascar FANOME Pharmacy Network",
      description:
        "Sustains the FANOME essential medicines revolving fund supplying antibiotics and vaccines to remote health posts.",
    },
    Infrastructure: {
      name: "Madagascar Route Nationale 7 Rehabilitation",
      description:
        "Rehabilitates Route Nationale 7 linking Antananarivo to Toliara as the nation's economic spine.",
    },
    Education: {
      name: "Madagascar Accessible Quality Education Plan",
      description:
        "Recruits 10,000 FRAM community teachers and provides textbooks to reverse Madagascar's school quality decline.",
    },
    Economy: {
      name: "Madagascar Vanilla and Ecotourism Strategy",
      description:
        "Supports premium vanilla export quality certification and expands ecotourism to leverage Madagascar's biodiversity.",
    },
    Defense: {
      name: "Madagascar Coast Guard Anti-Piracy Capacity",
      description:
        "Develops coast guard patrol capacity with EU CRIMARIO support to deter piracy in Madagascar's Exclusive Economic Zone.",
    },
    Technology: {
      name: "Madagascar Digital Madagascar Plan",
      description:
        "Deploys local content, e-government services, and mobile financial inclusion programs through the MTEN digital strategy.",
    },
    Social: {
      name: "Madagascar Fiavota Social Protection Program",
      description:
        "Provides cash transfers to 200,000 food-insecure households in Madagascar's drought-stricken southern regions.",
    },
  },
  na: {
    Climate: {
      name: "Namibia Green Hydrogen Ambition Strategy",
      description:
        "Develops Namibia's Tsau //Khaeb green hydrogen project to produce and export green ammonia using Namib wind and sun.",
    },
    Healthcare: {
      name: "Namibia National Health Policy 2014-2024 Review",
      description:
        "Evaluates and refreshes Namibia's national health policy to address HIV, TB, and NCDs amid inequality.",
    },
    Infrastructure: {
      name: "Namibia Trans-Caprivi Corridor Upgrade",
      description:
        "Upgrades the Trans-Caprivi Highway connecting Namibia's Walvis Bay port to Zambia, Zimbabwe, and Botswana.",
    },
    Education: {
      name: "Namibia Education and Training Sector Plan",
      description:
        "Raises pass rates and graduate quality in the VTC vocational training system supporting Namibia's mining economy.",
    },
    Economy: {
      name: "Namibia Critical Minerals Green Economy Plan",
      description:
        "Attracts battery supply chain investment in Namibian graphite, lithium, and vanadium for European markets.",
    },
    Defense: {
      name: "Namibia NDF SADC Mission Contribution",
      description:
        "Deploys Namibia Defence Force units to SADC missions in DRC as part of Namibia's regional security role.",
    },
    Technology: {
      name: "Namibia Digital Namibia Initiative",
      description:
        "Expands fiber connectivity, government digital services, and mobile broadband to Namibia's dispersed rural population.",
    },
    Social: {
      name: "Namibia Basic Income Grant Pilot",
      description:
        "Evaluates a permanent BIG following the Otjivero-Omitara pilot's demonstrated impacts on poverty and crime reduction.",
    },
  },
  bw: {
    Climate: {
      name: "Botswana Solar Energy Security Fund",
      description:
        "Develops the 200 MW Shashe and Tswapong solar parks to replace costly diesel and coal-fired generation.",
    },
    Healthcare: {
      name: "Botswana HIV Treatment Program",
      description:
        "Maintains Botswana's world-leading 99% viral suppression rate among HIV-positive citizens on ART.",
    },
    Infrastructure: {
      name: "Botswana Rail Modernization Initiative",
      description:
        "Upgrades Botswana Railways' coal and copper freight capacity on the North-South rail corridor.",
    },
    Education: {
      name: "Botswana Human Capital Development Strategy",
      description:
        "Reforms tertiary education to align graduates with Botswana's economic diversification priorities beyond diamonds.",
    },
    Economy: {
      name: "Botswana Economic Diversification Drive",
      description:
        "Develops beef, tourism, and financial services to reduce dependence on Debswana's diamond revenue.",
    },
    Defense: {
      name: "Botswana BDF Professionalization Program",
      description:
        "Builds the BDF's border protection, counter-poaching, and regional peacekeeping professionalism.",
    },
    Technology: {
      name: "Botswana Smart Botswana National Strategy",
      description:
        "Develops the Innovation Hub, BITC tech investment, and e-government infrastructure for Botswana's knowledge economy.",
    },
    Social: {
      name: "Botswana Ipelegeng Labor Programme",
      description:
        "Provides 60,000 seasonal work opportunities for Botswana's poor through the Ipelegeng public works program.",
    },
  },
  mw: {
    Climate: {
      name: "Malawi National Resilience Strategy",
      description:
        "Scales climate-smart agriculture and early warning systems to protect farmers from Cyclone Freddy-scale disasters.",
    },
    Healthcare: {
      name: "Malawi National Health Sector Strategic Plan",
      description:
        "Rebuilds health facility infrastructure and supply chains after recurring climate disaster damage to facilities.",
    },
    Infrastructure: {
      name: "Malawi Nacala Corridor Road Improvement",
      description:
        "Upgrades the M1 corridor roads linking Malawi to Nacala port in Mozambique as its trade lifeline.",
    },
    Education: {
      name: "Malawi Free Primary Education Strengthening",
      description:
        "Improves teacher deployment and textbook supply for Malawi's 4.7M primary students enrolled in free education.",
    },
    Economy: {
      name: "Malawi Tobacco Diversification Strategy",
      description:
        "Develops soybean, groundnut, and specialty coffee exports to reduce Malawi's structural dependence on tobacco.",
    },
    Defense: {
      name: "Malawi MDF UN Peacekeeping Contribution",
      description:
        "Trains and deploys Malawi Defence Force units to UN MONUSCO in DRC and UNMISS in South Sudan.",
    },
    Technology: {
      name: "Malawi Digital Malawi Program",
      description:
        "Connects Malawi's 4G network to rural health centers, schools, and government offices via the fiber backbone.",
    },
    Social: {
      name: "Malawi Social Cash Transfer Programme",
      description:
        "Delivers monthly cash to 300,000 ultra-poor Malawian households including child-burdened and labor-constrained families.",
    },
  },
  so: {
    Climate: {
      name: "Somalia Flood and Drought Early Warning",
      description:
        "Develops SWALIM flood and drought early warning with FAO to protect Somalia's climate-vulnerable riverine communities.",
    },
    Healthcare: {
      name: "Somalia Essential Package of Health Services",
      description:
        "Funds the WHO-designed EPHS through GAVI, Global Fund, and donor grants reaching 50% of Somalis' basic care needs.",
    },
    Infrastructure: {
      name: "Somalia Mogadishu Port Redevelopment",
      description:
        "Develops Mogadishu's port with DP World concession to create a sustainable customs and trade revenue base.",
    },
    Education: {
      name: "Somalia Education Sector Strategic Plan",
      description:
        "Rebuilds the formal education system from 15% net enrollment to 40% with new school construction and teacher pay.",
    },
    Economy: {
      name: "Somalia Debt Relief HIPC Completion Point",
      description:
        "Reaches HIPC completion point unlocking $4.5B of multilateral debt relief enabling development financing.",
    },
    Defense: {
      name: "Somalia Transition Plan from ATMIS to SSDF",
      description:
        "Develops the Somali Security and Defence Forces to take over the peacekeeping burden as ATMIS withdraws.",
    },
    Technology: {
      name: "Somalia Hormuud Telesom Mobile Economy",
      description:
        "Leverages Somalia's world-leading mobile money penetration through Hormuud's EVC Plus as a development platform.",
    },
    Social: {
      name: "Somalia Durable Solutions Displacement Response",
      description:
        "Provides shelter, livelihoods, and services to 3.8M internally displaced Somalis through the government and UN cluster system.",
    },
  },
  er: {
    Climate: {
      name: "Eritrea Saline Agriculture Adaptation",
      description:
        "Develops salt-tolerant crop varieties and solar-powered desalination for coastal agricultural communities.",
    },
    Healthcare: {
      name: "Eritrea Primary Healthcare Vertical Program",
      description:
        "Maintains vertical health programs for malaria, TB, and HIV despite extremely limited international access.",
    },
    Infrastructure: {
      name: "Eritrea Massawa Port Development",
      description:
        "Upgrades Massawa port to handle increased mineral exports from future Bisha and Asmara mining operations.",
    },
    Education: {
      name: "Eritrea National Service Education Obligation",
      description:
        "Operates Sawa Defence Training Centre as a combined secondary school and military service induction center.",
    },
    Economy: {
      name: "Eritrea Bisha Mine Expansion Strategy",
      description:
        "Expands the Bisha gold-copper-zinc mine to maintain export revenue amid comprehensive international isolation.",
    },
    Defense: {
      name: "Eritrea PFDJ Standing Army Maintenance",
      description:
        "Maintains one of Africa's largest militaries relative to population under indefinite national service conscription.",
    },
    Technology: {
      name: "Eritrea Restricted Telecoms Infrastructure",
      description:
        "Operates state-controlled EriTel telecoms monopoly with among the world's lowest internet penetration rates.",
    },
    Social: {
      name: "Eritrea Diaspora Remittances Formalization",
      description:
        "Channels diaspora remittances through the state-owned banking system to fund state development priorities.",
    },
  },
  af: {
    Climate: {
      name: "Afghanistan Drought and Water Stress Adaptation",
      description:
        "Develops small-scale irrigation, solar water pumps, and drought-resistant seeds for vulnerable Afghan farmers.",
    },
    Healthcare: {
      name: "Afghanistan Basic Package of Health Services",
      description:
        "Maintains WHO and NGO-delivered BPHS clinics as the only functioning primary health network under Taliban rule.",
    },
    Infrastructure: {
      name: "Afghanistan Salma Dam Reconstruction Support",
      description:
        "Sustains the Salma Dam's irrigation and electricity generation serving western Afghanistan's Herat province.",
    },
    Education: {
      name: "Afghanistan Girls' Education Suppression Response",
      description:
        "Supports underground and community-based schooling for girls banned from education beyond 6th grade by the Taliban.",
    },
    Economy: {
      name: "Afghanistan Opium Economy Eradication",
      description:
        "Implements Taliban's opium ban reducing 90% of global heroin supply overnight but collapsing farmer livelihoods.",
    },
    Defense: {
      name: "Afghanistan IEA Internal Security Operations",
      description:
        "Conducts Islamic Emirates of Afghanistan security sweeps against ISIS-K cells in Kabul and Nangarhar province.",
    },
    Technology: {
      name: "Afghanistan Mobile Banking Continuity",
      description:
        "Maintains mobile money transfer networks that replaced the collapsed formal banking system for domestic payments.",
    },
    Social: {
      name: "Afghanistan UN Humanitarian Emergency Response",
      description:
        "Coordinates $3B annual UN humanitarian response for 29M food-insecure Afghans under severely restricted operations.",
    },
  },
  om: {
    Climate: {
      name: "Oman Vision 2040 Carbon Neutral Ambition",
      description:
        "Targets net-zero by 2050 through solar and green hydrogen development aligned with Oman's Vision 2040.",
    },
    Healthcare: {
      name: "Oman National Health Strategy 2016-2020 Extension",
      description:
        "Extends national health priorities including NCD prevention and primary care reform into Vision 2040.",
    },
    Infrastructure: {
      name: "Oman Duqm Special Economic Zone Development",
      description:
        "Develops Duqm SEZ as an industrial and logistics hub competing with Dubai and Singapore for Indian Ocean trade.",
    },
    Education: {
      name: "Oman Applied Sciences University Expansion",
      description:
        "Builds applied science and technology universities in Sohar and Salalah supporting Oman's industrial economy.",
    },
    Economy: {
      name: "Oman Omanisation Labour Nationalisation",
      description:
        "Enforces Omanisation quotas in oil, gas, finance, and tourism to reduce dependence on foreign labour.",
    },
    Defense: {
      name: "Oman Strategic Neutrality Air Base Access",
      description:
        "Maintains strategic neutrality while granting RAF and USAF access to Muscat and Salalah air bases.",
    },
    Technology: {
      name: "Oman Digital Oman Strategy",
      description:
        "Digitizes government services, develops Muscat's IT ecosystem, and promotes Oman as a data center destination.",
    },
    Social: {
      name: "Oman Tanfeedh Diversification Job Creation",
      description:
        "Creates local employment in logistics, manufacturing, and tourism through the Tanfeedh economic roadmap.",
    },
  },
  jo: {
    Climate: {
      name: "Jordan National Green Growth Plan",
      description:
        "Targets 31% renewable electricity by 2030 using Jordan's Aqaba wind and Ma'an solar resources.",
    },
    Healthcare: {
      name: "Jordan Health Sector Reform National Strategy",
      description:
        "Improves health financing and purchaser-provider split to extend quality coverage to Jordan's large refugee population.",
    },
    Infrastructure: {
      name: "Jordan National Railway Project",
      description:
        "Develops a national railway connecting Aqaba port to Irbed and the Syrian border for phosphate and potash export.",
    },
    Education: {
      name: "Jordan Reaching All Children with Education",
      description:
        "Ensures 94% of Syrian refugee children in Jordan access formal or informal education through the RACE program.",
    },
    Economy: {
      name: "Jordan Aqaba SEZ Competitiveness Upgrade",
      description:
        "Streamlines Aqaba Special Economic Zone regulations to compete for Red Sea logistics and industry investment.",
    },
    Defense: {
      name: "Jordan JAF Counter-Smuggling Border Operation",
      description:
        "Intensifies JAF aerial and ground operations against drug and weapons smuggling from Syria and Iraq.",
    },
    Technology: {
      name: "Jordan Digital Jordan Transformation",
      description:
        "Builds Jordan's digital economy through e-government, ICT outsourcing exports, and fintech ecosystem development.",
    },
    Social: {
      name: "Jordan Syrian Refugee Jordan Compact",
      description:
        "Implements the 2016 Jordan Compact granting work permits to 50,000 Syrian refugees in exchange for EU market access.",
    },
  },
  lb: {
    Climate: {
      name: "Lebanon Solar Energy Crisis Response",
      description:
        "Deploys rooftop solar for hospitals, schools, and homes replacing diesel generators amid grid collapse.",
    },
    Healthcare: {
      name: "Lebanon Health Sector Emergency Fund",
      description:
        "Maintains critical hospital operations through WHO and donor funding as Lebanon's health system faces collapse.",
    },
    Infrastructure: {
      name: "Lebanon Beirut Port Reconstruction",
      description:
        "Rebuilds Beirut's port following the 2020 ammonium nitrate explosion that destroyed the country's main trade gateway.",
    },
    Education: {
      name: "Lebanon RACE2 Refugee Education Access",
      description:
        "Maintains double-shift public schools enrolling 200,000 Syrian students within Lebanon's collapsed education system.",
    },
    Economy: {
      name: "Lebanon IMF Capital Controls Reform",
      description:
        "Negotiates IMF program conditions requiring banking sector restructuring and depositor haircut formalization.",
    },
    Defense: {
      name: "Lebanon LAF Security Line Management",
      description:
        "Manages the ceasefire line demarcation with IDF in southern Lebanon following November 2024 ceasefire.",
    },
    Technology: {
      name: "Lebanon Digital Economy Amid Crisis",
      description:
        "Supports Beirut's resilient startup ecosystem continuing to raise capital and export digital services despite the crisis.",
    },
    Social: {
      name: "Lebanon Social Protection Emergency Net",
      description:
        "Delivers World Bank funded Emergency Social Safety Net cash transfers to Lebanon's extreme poor and refugees.",
    },
  },
  sy: {
    Climate: {
      name: "Syria Reconstruction Environmental Assessment",
      description:
        "Assesses environmental contamination and resource damage from 13 years of war for post-conflict recovery planning.",
    },
    Healthcare: {
      name: "Syria Northwest Health Response",
      description:
        "Maintains OCHA-coordinated cross-border healthcare for 4M people in northwest Syria through Turkish-border facilities.",
    },
    Infrastructure: {
      name: "Syria Post-Assad Infrastructure Reconstruction",
      description:
        "Begins assessment and early reconstruction of Syria's destroyed power grid, water networks, and road system.",
    },
    Education: {
      name: "Syria No Lost Generation Education Scale-Up",
      description:
        "Scales No Lost Generation education programming to enroll 2M out-of-school Syrian children in formal or non-formal education.",
    },
    Economy: {
      name: "Syria Sanctions Relief Transition Economy",
      description:
        "Navigates partial Western sanctions relief following regime change while negotiating Arab League re-engagement terms.",
    },
    Defense: {
      name: "Syria SNA Post-Assad Security Consolidation",
      description:
        "Integrates Syria's fractured armed factions into a unified national defense structure under HTS-led governance.",
    },
    Technology: {
      name: "Syria Telecommunication Reconstruction Priority",
      description:
        "Restores SyriaTel and MTN Syria networks as foundational infrastructure for economic recovery and humanitarian operations.",
    },
    Social: {
      name: "Syria Refugee Return Voluntary Program",
      description:
        "Develops voluntary return conditions, housing rehabilitation, and property restitution for 6.8M Syrian refugees abroad.",
    },
  },
  ye: {
    Climate: {
      name: "Yemen Water Security Emergency Program",
      description:
        "Addresses Yemen's critical water scarcity through solar-powered desalination and groundwater protection aid.",
    },
    Healthcare: {
      name: "Yemen Health System Wartime Continuity",
      description:
        "Maintains 50% functional health facilities through WHO and USAID support amid Houthi-coalition conflict.",
    },
    Infrastructure: {
      name: "Yemen Aden Port Rehabilitation",
      description:
        "Rehabilitates Aden port capacity for fuel and food imports critical to southern Yemen's humanitarian supply chain.",
    },
    Education: {
      name: "Yemen Conflict-Sensitive Education Continuity",
      description:
        "Maintains schooling for 4.5M Yemeni students through safe schools initiative and community-based programs.",
    },
    Economy: {
      name: "Yemen Central Bank Unification Strategy",
      description:
        "Attempts to reconcile the split between Sanaa and Aden central banks as a prerequisite for economic stabilization.",
    },
    Defense: {
      name: "Yemen Arab Coalition Air Campaign Continuation",
      description:
        "Executes air and ground operations against Houthi positions in Hodeidah, Marib, and Red Sea shipping corridors.",
    },
    Technology: {
      name: "Yemen Mobile Money Humanitarian Transfers",
      description:
        "Uses mobile money platforms for cash-for-food and humanitarian cash transfer distributions in conflict-affected governorates.",
    },
    Social: {
      name: "Yemen Humanitarian Response Plan $4.3B",
      description:
        "Implements the UN Yemen Humanitarian Response Plan addressing food, medicine, and shelter for 21M in dire need.",
    },
  },
  az: {
    Climate: {
      name: "Azerbaijan Karabakh Green Energy Zone",
      description:
        "Develops newly recovered Karabakh territories as a green energy zone with solar, wind, and hydro projects.",
    },
    Healthcare: {
      name: "Azerbaijan National Health System Reform",
      description:
        "Modernizes hospital infrastructure and expands the compulsory health insurance system to all citizens.",
    },
    Infrastructure: {
      name: "Azerbaijan Baku Tbilisi Kars Railway Expansion",
      description:
        "Expands BTK railway capacity to position Azerbaijan as the trans-Caspian trade corridor between Asia and Europe.",
    },
    Education: {
      name: "Azerbaijan State Program on Education",
      description:
        "Expands STEM education and English-language instruction to build Azerbaijan's non-oil knowledge economy workforce.",
    },
    Economy: {
      name: "Azerbaijan COP29 Green Economy Transition",
      description:
        "Leverages COP29 host status to reshape Azerbaijan's image and attract green hydrogen investment beyond oil.",
    },
    Defense: {
      name: "Azerbaijan Bayraktar Modernized Armed Forces",
      description:
        "Integrates drone technology, electronic warfare, and Israeli weapons systems into the Azerbaijan Armed Forces.",
    },
    Technology: {
      name: "Azerbaijan Innovation and Digital Development",
      description:
        "Develops the Baku Tech Hub and digital government services to diversify from oil revenues.",
    },
    Social: {
      name: "Azerbaijan Karabakh IDP Return Program",
      description:
        "Funds housing, services, and mine clearance for Azerbaijanis returning to recaptured Karabakh territories.",
    },
  },
  ge_c: {
    Climate: {
      name: "Georgia Hydropower to Solar Diversification",
      description:
        "Develops Kartli and Black Sea offshore wind to complement Georgia's hydro-dominated but drought-vulnerable grid.",
    },
    Healthcare: {
      name: "Georgia Universal Healthcare Program Sustainability",
      description:
        "Sustains Georgia's universal healthcare program covering 2.7M citizens through efficient managed care contracts.",
    },
    Infrastructure: {
      name: "Georgia Anaklia Deep Sea Port Development",
      description:
        "Revives the Anaklia deep-sea port project to make Georgia a key Caspian-Black Sea transshipment hub.",
    },
    Education: {
      name: "Georgia Teachers' Professional Development",
      description:
        "Implements mandatory professional development cycles and performance pay reform for Georgian public school teachers.",
    },
    Economy: {
      name: "Georgia European Integration Economic Reform",
      description:
        "Implements EU Association Agreement trade provisions to bring Georgian products to European single market standards.",
    },
    Defense: {
      name: "Georgia NATO Interoperability Program",
      description:
        "Advances Georgia's Annual National Program with NATO to align defense reforms toward membership standards.",
    },
    Technology: {
      name: "Georgia Digital Economy Strategy",
      description:
        "Develops Tbilisi's startup ecosystem and e-government through the Enterprise Georgia digital acceleration fund.",
    },
    Social: {
      name: "Georgia Pro-EU Civil Society Response",
      description:
        "Navigates government-civil society tensions over EU integration path following 2024 disputed election protests.",
    },
  },
  am: {
    Climate: {
      name: "Armenia Renewable Energy Development Plan",
      description:
        "Targets 50% renewable electricity by 2030 through Talin wind farm expansion and southern solar projects.",
    },
    Healthcare: {
      name: "Armenia Universal Health Insurance Expansion",
      description:
        "Expands the state-funded medical care program to cover additional diagnostic and pharmaceutical services.",
    },
    Infrastructure: {
      name: "Armenia North-South Road Corridor Completion",
      description:
        "Completes the North-South Highway linking the Iranian border to Tbilisi as Armenia's economic spine.",
    },
    Education: {
      name: "Armenia Digital School Program",
      description:
        "Delivers tablets, internet access, and digital teaching materials to all Armenian secondary schools.",
    },
    Economy: {
      name: "Armenia IT Export Growth Strategy",
      description:
        "Builds on the post-2022 Russian tech worker influx to grow Armenia's IT exports beyond $500M annually.",
    },
    Defense: {
      name: "Armenia Military Procurement Diversification",
      description:
        "Diversifies Armenia's defense procurement from Russia toward France, India, and Greece following Karabakh defeat.",
    },
    Technology: {
      name: "Armenia Data and High Technology Park Expansion",
      description:
        "Expands HSBC-assisted tech park incentives to attract foreign IT companies to Yerevan.",
    },
    Social: {
      name: "Armenia Nagorno-Karabakh Refugee Integration",
      description:
        "Provides housing, employment, and documentation to 100,000 ethnic Armenian refugees from Karabakh.",
    },
  },
  tm: {
    Climate: {
      name: "Turkmenistan Methane Leak Reduction Plan",
      description:
        "Addresses Turkmenistan's status as the world's second largest methane emitter from oil and gas infrastructure.",
    },
    Healthcare: {
      name: "Turkmenistan State Medical Reform",
      description:
        "Gradually opens medical statistics and hospital data after decades of denial of epidemic disease reporting.",
    },
    Infrastructure: {
      name: "Turkmenistan Trans-Caspian Pipeline Development",
      description:
        "Advances Turkmenistan's push for a Trans-Caspian Pipeline to export gas to Europe bypassing Russia.",
    },
    Education: {
      name: "Turkmenistan Higher Education Access Expansion",
      description:
        "Expands enrollment caps at Turkmen State University to reduce the dependence on foreign study.",
    },
    Economy: {
      name: "Turkmenistan China Gas Export Diversification",
      description:
        "Manages nearly total gas export dependence on China through CNPC pipeline by exploring alternative buyers.",
    },
    Defense: {
      name: "Turkmenistan Permanent Neutrality Defense Doctrine",
      description:
        "Maintains UN-recognized permanent neutrality while funding a military prioritizing internal stability over external threats.",
    },
    Technology: {
      name: "Turkmenistan IT Infrastructure Investment",
      description:
        "Expands Ashgabat's fiber internet backbone and mobile networks as a tool of controlled modernization.",
    },
    Social: {
      name: "Turkmenistan Social Security Benefits Management",
      description:
        "Maintains gas, water, and electricity subsidies as key social contract between the state and citizens.",
    },
  },
  tj: {
    Climate: {
      name: "Tajikistan Glacial Melt Water Security",
      description:
        "Monitors Pamiri glaciers and develops water storage to manage growing drought risk as glaciers rapidly shrink.",
    },
    Healthcare: {
      name: "Tajikistan State Guaranteed Benefits Package",
      description:
        "Defines and funds a minimum health benefit package accessible to all Tajiks under the state guarantees system.",
    },
    Infrastructure: {
      name: "Tajikistan CASA-1000 Electricity Export",
      description:
        "Completes the CASA-1000 project transmitting Tajik and Kyrgyz hydropower to Pakistan and Afghanistan.",
    },
    Education: {
      name: "Tajikistan Education Quality Reform",
      description:
        "Rebuilds Soviet-era education quality through international curriculum alignment and teacher recertification.",
    },
    Economy: {
      name: "Tajikistan Rogun Dam Revenue Model",
      description:
        "Develops the Rogun Hydropower Plant as Tajikistan's primary long-term electricity export revenue strategy.",
    },
    Defense: {
      name: "Tajikistan 201st Russian Military Base Hosting",
      description:
        "Hosts Russia's 201st Military Base as the core of Tajikistan's security against Afghan border threats.",
    },
    Technology: {
      name: "Tajikistan E-Government Portal Development",
      description:
        "Develops Tajikistan's single e-services portal to reduce bureaucratic barriers and corruption in public services.",
    },
    Social: {
      name: "Tajikistan Remittance-Dependent Social Stability",
      description:
        "Manages social programs funded partially by the 35% of GDP in worker remittances from Russia and Kazakhstan.",
    },
  },
  kg: {
    Climate: {
      name: "Kyrgyzstan Renewable Energy Expansion",
      description:
        "Develops new small hydro and wind farms to reduce power cuts and enable electricity exports to Central Asian neighbors.",
    },
    Healthcare: {
      name: "Kyrgyzstan Single Payer Mandatory Health Insurance",
      description:
        "Strengthens the MHIF mandatory health insurance fund to cover drugs and specialist visits for all citizens.",
    },
    Infrastructure: {
      name: "Kyrgyzstan China-Kyrgyzstan-Uzbekistan Railway",
      description:
        "Advances the long-stalled CKU railway that would transform Kyrgyzstan into a Central Asian transit hub.",
    },
    Education: {
      name: "Kyrgyzstan Education Reform 2012-2020 Continuation",
      description:
        "Continues competency-based curriculum reform and Kyrgyz language instruction strengthening in public schools.",
    },
    Economy: {
      name: "Kyrgyzstan Gold Trade Transparency Reform",
      description:
        "Regulates and formalizes Kumtor gold mine revenues and artisanal gold trade to expand fiscal resources.",
    },
    Defense: {
      name: "Kyrgyzstan CSTO Collective Security Contribution",
      description:
        "Participates in CSTO collective security while managing border tensions with Tajikistan over Ferghana Valley land.",
    },
    Technology: {
      name: "Kyrgyzstan Digital Transformation Program",
      description:
        "Builds on tunduk interoperability platform to digitize government services and develop Bishkek's tech ecosystem.",
    },
    Social: {
      name: "Kyrgyzstan Labor Migration Social Protection",
      description:
        "Protects 1M Kyrgyz migrant workers in Russia with bilateral social insurance agreements and consular support.",
    },
  },
  mn: {
    Climate: {
      name: "Mongolia Net Zero Carbon Fund",
      description:
        "Channels Asian Development Bank green bonds into renewable energy to diversify Mongolia's coal-dependent grid.",
    },
    Healthcare: {
      name: "Mongolia National Health Development Program",
      description:
        "Builds regional health centers in aimag capitals to reduce Ulaanbaatar over-concentration of medical services.",
    },
    Infrastructure: {
      name: "Mongolia-China Rail Expansion",
      description:
        "Expands rail capacity on Mongolia's south-north corridor to increase coal export throughput to China.",
    },
    Education: {
      name: "Mongolia Mongolian Language Education Reform",
      description:
        "Switches from Cyrillic to traditional Mongolian script in schools to reinforce national identity and cultural heritage.",
    },
    Economy: {
      name: "Mongolia Oyu Tolgoi Copper Revenue Management",
      description:
        "Manages the Rio Tinto Oyu Tolgoi copper mine ramp-up to transform Mongolia's GDP within a decade.",
    },
    Defense: {
      name: "Mongolia Third Neighbor Military Partnership",
      description:
        "Deepens military exercises with the US and Japan as building blocks of Mongolia's Third Neighbor security policy.",
    },
    Technology: {
      name: "Mongolia Smart Mongolia Digital Strategy",
      description:
        "Deploys e-government, digital ID, and 4G connectivity to Mongolia's sparsely populated steppe communities.",
    },
    Social: {
      name: "Mongolia Child Money Programme",
      description:
        "Provides monthly child allowances funded by mineral royalties to all Mongolian children under 18.",
    },
  },
  la: {
    Climate: {
      name: "Laos Hydropower Sustainability Standards",
      description:
        "Develops international sustainability certification for new Mekong River dams to access green financing.",
    },
    Healthcare: {
      name: "Laos Health Sector Reform Plan",
      description:
        "Expands district hospital capacity and outreach to Laos's remote mountainous provinces and ethnic minority communities.",
    },
    Infrastructure: {
      name: "Laos China Railway Connectivity Expansion",
      description:
        "Uses the Laos-China Railway as a backbone for additional SEZ industrial park development along the corridor.",
    },
    Education: {
      name: "Laos Education Sector Development Plan",
      description:
        "Raises primary school enrollment and Lao literacy rates through expanded school feeding and stipend programs.",
    },
    Economy: {
      name: "Laos Land-Linked Economy Strategy",
      description:
        "Transforms from land-locked to land-linked by leveraging the Laos-China railway to attract transit trade and tourism.",
    },
    Defense: {
      name: "Laos LPDR Defense Modernization",
      description:
        "Maintains close defense partnerships with Vietnam and China while gradually modernizing the Lao People's Army.",
    },
    Technology: {
      name: "Laos Digital Economy Policy",
      description:
        "Develops e-government and mobile payment infrastructure leveraging the Laos-China telecoms modernization.",
    },
    Social: {
      name: "Laos UXO Contamination Clearance Program",
      description:
        "Continues removing unexploded ordnance from the Vietnam era that makes 25% of Laos's land unusable.",
    },
  },
  bn: {
    Climate: {
      name: "Brunei Green Economy Blueprint 2035",
      description:
        "Develops mangrove conservation, solar energy, and carbon trading within Brunei's forest carbon stock framework.",
    },
    Healthcare: {
      name: "Brunei National Health Blueprint 2035",
      description:
        "Expands mental health services and NCD prevention to serve Brunei's aging and increasingly sedentary population.",
    },
    Infrastructure: {
      name: "Brunei Pulau Muara Besar Industrial Island",
      description:
        "Develops PMB industrial island's downstream oil refinery and petrochemical complex for export diversification.",
    },
    Education: {
      name: "Brunei SPN21 Education System Improvement",
      description:
        "Refines the 21st-century Brunei National Education System with greater English instruction and STEM emphasis.",
    },
    Economy: {
      name: "Brunei Vision 2035 Non-Oil Revenue Development",
      description:
        "Develops tourism, halal food, and Islamic finance to supplement Brunei's declining oil and gas revenues.",
    },
    Defense: {
      name: "Brunei Royal Brunei Armed Forces UK Partnership",
      description:
        "Maintains a British Gurkha garrison in Seria and bilateral training exercises as the cornerstone of RBAF defense.",
    },
    Technology: {
      name: "Brunei Digital Economy Council Masterplan",
      description:
        "Launches a Digital Economy Masterplan covering fintech, e-commerce, and smart government services.",
    },
    Social: {
      name: "Brunei Skim Wawasan Brunei Social Housing",
      description:
        "Provides affordable housing to Bruneian families on the national housing waiting list through the Wawasan scheme.",
    },
  },
  bt: {
    Climate: {
      name: "Bhutan Carbon-Negative Commitment",
      description:
        "Maintains and expands Bhutan's carbon-negative status by protecting 72% forest cover and exporting clean hydropower.",
    },
    Healthcare: {
      name: "Bhutan Free Universal Healthcare System",
      description:
        "Provides free healthcare to all Bhutanese through a network of hospitals and basic health units.",
    },
    Infrastructure: {
      name: "Bhutan Gelephu Mindfulness City Development",
      description:
        "Develops the visionary Gelephu Mindfulness City as Bhutan's gateway to India and economic diversification hub.",
    },
    Education: {
      name: "Bhutan GNH-Based Education System",
      description:
        "Integrates Gross National Happiness values of mindfulness, cultural heritage, and environmental stewardship into education.",
    },
    Economy: {
      name: "Bhutan Tourism High-Value Low-Volume Policy",
      description:
        "Maintains the $200/night sustainable development fee for tourists to preserve Bhutan's Himalayan environment and culture.",
    },
    Defense: {
      name: "Bhutan India Security Umbrella Partnership",
      description:
        "Relies on India's security guarantee and the 2007 Friendship Treaty as Bhutan's primary defense framework.",
    },
    Technology: {
      name: "Bhutan Desuung Digital Transformation Scouts",
      description:
        "Deploys volunteers to bring digital literacy, biometric ID, and government services to remote rural communities.",
    },
    Social: {
      name: "Bhutan Decentralized Gewog Connectivity Program",
      description:
        "Extends roads, solar electricity, and internet to all 205 Bhutanese gewog blocks for universal public services.",
    },
  },
  mv: {
    Climate: {
      name: "Maldives Climate Emergency Declaration",
      description:
        "Accelerates the 100% renewable energy by 2030 target and pursues climate liability reparations from major emitters.",
    },
    Healthcare: {
      name: "Maldives Aasandha Universal Health Insurance",
      description:
        "Maintains Aasandha universal coverage for all Maldivian citizens and expands coverage to migrant workers.",
    },
    Infrastructure: {
      name: "Maldives Greater Malé Connectivity Bridge",
      description:
        "Builds the Malé-Vilimalé-Thilafushi bridge network to connect the overcrowded capital island to surrounding islands.",
    },
    Education: {
      name: "Maldives Public University Expansion",
      description:
        "Expands Maldives National University enrollment to reduce the drain of students studying in Sri Lanka and India.",
    },
    Economy: {
      name: "Maldives Tourism Diversification Strategy",
      description:
        "Develops integrated resorts, marine sports, and cultural tourism to extend visitor seasonality and per-capita spend.",
    },
    Defense: {
      name: "Maldives MNDF India Partnership Rebalancing",
      description:
        "Navigates military balance between India and China relationships within the MNDF modernization framework.",
    },
    Technology: {
      name: "Maldives Digital Governance 2023-2027",
      description:
        "Digitizes all government services and develops the undersea cable network connecting outer atolls to services.",
    },
    Social: {
      name: "Maldives Affordable Housing Development Program",
      description:
        "Constructs social flats in Hulhumalé Phase 2 to rehouse Malé's densely packed residents.",
    },
  },
  tl: {
    Climate: {
      name: "Timor-Leste Climate Change Policy",
      description:
        "Develops climate-smart agriculture and mangrove restoration to protect Timor-Leste's coastal communities.",
    },
    Healthcare: {
      name: "Timor-Leste Health Sector Strategic Plan IV",
      description:
        "Builds basic health unit capacity in all 65 sub-districts to deliver maternal, child, and communicable disease care.",
    },
    Infrastructure: {
      name: "Timor-Leste Tasi Mane Petroleum Infrastructure",
      description:
        "Develops the Tasi Mane coastal petroleum infrastructure connecting offshore Sunrise gas to an onshore LNG facility.",
    },
    Education: {
      name: "Timor-Leste Basic Education Strengthening",
      description:
        "Improves Tetum-language early instruction and teacher attendance to raise primary completion rates.",
    },
    Economy: {
      name: "Timor-Leste Petroleum Fund Sustainability",
      description:
        "Manages draw-down rates of the $18B Petroleum Fund to avoid depletion before non-oil revenues replace them.",
    },
    Defense: {
      name: "Timor-Leste F-FDTL UN Mission Preparation",
      description:
        "Trains F-FDTL forces for UN peacekeeping missions to provide income and experience for Timorese soldiers.",
    },
    Technology: {
      name: "Timor-Leste Digital Economy Master Plan",
      description:
        "Extends mobile broadband, fintech, and government digitalization to Timor-Leste's 13 municipalities.",
    },
    Social: {
      name: "Timor-Leste Bolsa da Mãe Social Transfer",
      description:
        "Provides conditional cash transfers to poor Timorese mothers enrolling children in school and health checkups.",
    },
  },
  by: {
    Climate: {
      name: "Belarus NDC Emission Reduction Plan",
      description:
        "Targets 35% GHG reduction by 2030 through nuclear power expansion and marginally increased renewable capacity.",
    },
    Healthcare: {
      name: "Belarus State Health System Reform",
      description:
        "Upgrades Belarus's largely Soviet-era healthcare system with new diagnostic equipment and specialist centers.",
    },
    Infrastructure: {
      name: "Belarus BelNPP Nuclear Station Operation",
      description:
        "Operates the Ostrovets BelNPP nuclear plant providing 40% of Belarus's electricity and reducing Russian gas dependence.",
    },
    Education: {
      name: "Belarus IT Education Specialization",
      description:
        "Expands BSU and BSUIR ICT faculties to serve the Hi-Tech Park's $3.5B annual software export industry.",
    },
    Economy: {
      name: "Belarus Russian Integration Economic Union",
      description:
        "Deepens EAEU integration through Union State economic programs reducing bilateral trade barriers with Russia.",
    },
    Defense: {
      name: "Belarus Russia Wagner Deterrence Deployment",
      description:
        "Hosts Wagner Group forces in Belarus following their Prigozhin mutiny as a forward deterrent against NATO.",
    },
    Technology: {
      name: "Belarus Hi-Tech Park Startup Hub",
      description:
        "Maintains the Hi-Tech Park's generous tax exemptions attracting global tech companies and fostering domestic startups.",
    },
    Social: {
      name: "Belarus State Social Support Maintenance",
      description:
        "Sustains Soviet-era social guarantees including child benefits, subsidized housing, and state employment commitments.",
    },
  },
  md: {
    Climate: {
      name: "Moldova Energy Independence from Russia",
      description:
        "Develops Romanian electricity interconnections, solar farms, and EU energy market integration to end Russian gas dependence.",
    },
    Healthcare: {
      name: "Moldova National Health Strategy 2030",
      description:
        "Modernizes Moldova's degraded health system infrastructure with EU neighborhood fund support.",
    },
    Infrastructure: {
      name: "Moldova Iași-Ungheni-Chișinău Gas Pipeline",
      description:
        "Completes the gas interconnector pipeline enabling Romania gas supplies to all of Moldova's consumers.",
    },
    Education: {
      name: "Moldova EU Horizon Education Integration",
      description:
        "Aligns Moldovan universities with European academic standards as part of the EU accession preparation process.",
    },
    Economy: {
      name: "Moldova EU Candidate Structural Reform",
      description:
        "Implements judicial reform, anti-corruption measures, and business environment improvements for EU accession.",
    },
    Defense: {
      name: "Moldova Constitutional Neutrality Defense Balance",
      description:
        "Maintains constitutional military neutrality while accepting NATO trust fund support and EU military assistance.",
    },
    Technology: {
      name: "Moldova Digital Transformation 2023-2030",
      description:
        "Digitizes public services, develops the Technopark Inofarm cluster, and builds national cybersecurity capacity.",
    },
    Social: {
      name: "Moldova Ukrainian Refugee Integration",
      description:
        "Integrates 100,000 Ukrainian refugees — the highest per capita of any country — into Moldova's social services.",
    },
  },
  al: {
    Climate: {
      name: "Albania National Energy Strategy Renewables",
      description:
        "Diversifies from hydropower dominance with wind and solar to reduce flood-year electricity import dependence.",
    },
    Healthcare: {
      name: "Albania National Health System Transformation",
      description:
        "Restructures Albania's primary care system with new family medicine centers in urban and rural areas.",
    },
    Infrastructure: {
      name: "Albania Adriatic-Ionian Highway Completion",
      description:
        "Completes Albania's sections of the Adriatic-Ionian Motorway corridor connecting Western Balkans to EU networks.",
    },
    Education: {
      name: "Albania Reforming Pre-University Education System",
      description:
        "Implements EU-aligned curriculum reforms and new teacher evaluation frameworks in Albania's reopened school system.",
    },
    Economy: {
      name: "Albania EU Accession Economic Convergence",
      description:
        "Aligns Albanian trade, competition, and customs policies with the EU acquis within the accession negotiation framework.",
    },
    Defense: {
      name: "Albania NATO Membership Expansion Host",
      description:
        "Hosts and integrates NATO enhanced forward presence capabilities at Kuçovë Air Base following 2009 membership.",
    },
    Technology: {
      name: "Albania Digital Transformation Agenda",
      description:
        "Launches e-Albania all-in-one portal reducing bureaucracy and corruption in 450 government service processes.",
    },
    Social: {
      name: "Albania National Strategy Against Trafficking",
      description:
        "Implements comprehensive anti-trafficking legislation and victim support services for Albania's vulnerable populations.",
    },
  },
  mk: {
    Climate: {
      name: "North Macedonia Energy and Climate Plan",
      description:
        "Phases out the REK Bitola coal plant by 2027 and scales solar and wind to achieve 38% renewable electricity.",
    },
    Healthcare: {
      name: "North Macedonia Universal Health Coverage Strengthening",
      description:
        "Reforms FZOM public insurance administration and provider payment to improve coverage quality and equity.",
    },
    Infrastructure: {
      name: "North Macedonia Corridor 8 Railway Link",
      description:
        "Builds the Corridor 8 rail linking Albania's Adriatic coast through Macedonia to Bulgaria and the Black Sea.",
    },
    Education: {
      name: "North Macedonia Curriculum Reform 2018-2025",
      description:
        "Transitions all schools to competency-based curriculum aligned with European learning standards.",
    },
    Economy: {
      name: "North Macedonia EU SME Instrument Absorption",
      description:
        "Absorbs IPA III funding for SME competitiveness, digital transformation, and green transition investments.",
    },
    Defense: {
      name: "North Macedonia NATO Integration Defense Plan",
      description:
        "Fully integrates North Macedonia's defense into NATO collective defense structures following 2020 accession.",
    },
    Technology: {
      name: "North Macedonia Digital Agenda 2025",
      description:
        "Digitizes 50 priority government services and builds national cybersecurity infrastructure aligned with EU ENISA.",
    },
    Social: {
      name: "North Macedonia Social Inclusion Strategy",
      description:
        "Addresses socioeconomic exclusion of Roma, rural poor, and persons with disabilities through ESF-funded programs.",
    },
  },
  ba: {
    Climate: {
      name: "Bosnia & Herzegovina Energy Community Treaty",
      description:
        "Implements Energy Community obligations to phase out high-polluting coal plants in Tuzla and Kakanj.",
    },
    Healthcare: {
      name: "Bosnia & Herzegovina Health System Coordination",
      description:
        "Improves coordination among Bosnia's 13 separate health ministries to standardize essential benefit packages.",
    },
    Infrastructure: {
      name: "Bosnia & Herzegovina Corridor 5c Motorway",
      description:
        "Completes the Corridor 5c motorway linking Hungary through Sarajevo to the Adriatic Sea at Ploče.",
    },
    Education: {
      name: "Bosnia & Herzegovina Education Reform Coordination",
      description:
        "Coordinates curriculum harmonization across Republika Srpska, the Federation, and Brčko District education authorities.",
    },
    Economy: {
      name: "Bosnia & Herzegovina EU Candidate Reforms",
      description:
        "Implements anti-corruption and market reforms required for EU candidate status following 2022 recognition.",
    },
    Defense: {
      name: "Bosnia & Herzegovina EUFOR Althea Security Support",
      description:
        "Maintains EUFOR Althea's 1,100 troops providing Bosnia's security guarantees while building local capacity.",
    },
    Technology: {
      name: "Bosnia & Herzegovina Digital Transformation Plan",
      description:
        "Aligns e-government and broadband infrastructure with EU Digital Agenda standards in both entities.",
    },
    Social: {
      name: "Bosnia & Herzegovina Dayton-era Ethnic Reconciliation",
      description:
        "Funds EU-supported transitional justice programs and inter-ethnic dialogue initiatives to deepen post-war reconciliation.",
    },
  },
  me: {
    Climate: {
      name: "Montenegro Renewable Energy Action Plan",
      description:
        "Develops the Bijela wind farm and solar projects to supplement hydro and meet EU clean energy requirements.",
    },
    Healthcare: {
      name: "Montenegro Health System Reform and IPA",
      description:
        "Implements hospital modernization and primary care reform through EU IPA pre-accession health projects.",
    },
    Infrastructure: {
      name: "Montenegro Bar-Boljare Motorway Phase 2",
      description:
        "Finances Phase 2 of the Bar-Boljare motorway to complete the Adriatic-Ionian corridor through Montenegro.",
    },
    Education: {
      name: "Montenegro Bologna Process Implementation",
      description:
        "Aligns university education with the Bologna Process as Montenegro progresses through EU accession negotiations.",
    },
    Economy: {
      name: "Montenegro Euro-Zone Tourism and FDI Growth",
      description:
        "Leverages the € and Adriatic coastline to attract high-value real estate and yachting tourism.",
    },
    Defense: {
      name: "Montenegro NATO Smallest Member Contribution",
      description:
        "Contributes specialized engineering and support units to NATO operations despite a military of only 2,400 active personnel.",
    },
    Technology: {
      name: "Montenegro Digital Montenegro Strategy 2022-2027",
      description:
        "Builds 5G coverage, e-government, and cybersecurity capacity as part of EU digital accession commitments.",
    },
    Social: {
      name: "Montenegro Roma and Displaced Persons Integration",
      description:
        "Provides housing and legal documentation improvements for Roma and displaced persons from former Yugoslavia.",
    },
  },
  xk: {
    Climate: {
      name: "Kosovo Energy Transition Away from KEK Coal",
      description:
        "Closes the highly polluting Kosovo C coal plant and develops solar and wind alternatives with EU support.",
    },
    Healthcare: {
      name: "Kosovo National Health Strategy 2021-2030",
      description:
        "Builds universal primary care coverage and referral systems for Kosovo's predominantly young population.",
    },
    Infrastructure: {
      name: "Kosovo Highway R7 Prishtina-Montenegro",
      description:
        "Develops the R7 highway connecting Kosovo to the Adriatic coast through Albania and Montenegro.",
    },
    Education: {
      name: "Kosovo Pre-University Education Strategy",
      description:
        "Improves teacher quality, bilingual instruction, and school infrastructure under EU IPA education funding.",
    },
    Economy: {
      name: "Kosovo Diaspora Investment Attraction",
      description:
        "Channels the Kosovar diaspora's 15% of GDP remittances into productive FDI through a diaspora investment fund.",
    },
    Defense: {
      name: "Kosovo KSF NATO Interoperability Upgrade",
      description:
        "Transforms the Kosovo Security Force into a NATO-interoperable light infantry force by 2027.",
    },
    Technology: {
      name: "Kosovo Digital Kosovo Vision 2030",
      description:
        "Develops e-government, fintech, and IT outsourcing as Kosovo's fastest-growing economic sectors.",
    },
    Social: {
      name: "Kosovo Youth Employment Challenge",
      description:
        "Addresses Kosovo's 25% youth unemployment with EU-funded vocational training and SME startup programs.",
    },
  },
  si: {
    Climate: {
      name: "Slovenia Long-Term Climate Strategy",
      description:
        "Replaces the ŠOŠTANJ coal plant by 2033 and implements net-zero by 2050 via extensive building renovation.",
    },
    Healthcare: {
      name: "Slovenia ZZZS Health Insurance Adequacy",
      description:
        "Addresses waiting list crises in Slovenian specialist care through supplementary insurance reform.",
    },
    Infrastructure: {
      name: "Slovenia Second Track Rail Koper-Divača",
      description:
        "Builds a second rail line between the Port of Koper and Divača to double freight capacity from the Adriatic.",
    },
    Education: {
      name: "Slovenia Digital Competence Framework Schools",
      description:
        "Integrates e-Šolska torba digital tools and computational thinking into Slovenia's primary curriculum.",
    },
    Economy: {
      name: "Slovenia Innovation Ecosystem Strengthening",
      description:
        "Builds on Lek pharmaceuticals and Iskra electronics heritage to grow Slovenia's med-tech startup ecosystem.",
    },
    Defense: {
      name: "Slovenia NATO Enhanced Forward Presence Host",
      description:
        "Hosts and contributes to NATO's enhanced forward presence in the Eastern Flank's collective defense architecture.",
    },
    Technology: {
      name: "Slovenia Digital Slovenia 2030",
      description:
        "Advances Slovenia's digital transformation in government, healthcare, and SME digitalization with EU NextGen funds.",
    },
    Social: {
      name: "Slovenia Long-Term Care Act Implementation",
      description:
        "Implements the Long-Term Care Act providing comprehensive elderly and disabled care financed through new insurance.",
    },
  },
  lv: {
    Climate: {
      name: "Latvia National Energy and Climate Plan 2030",
      description:
        "Sources 57% of energy from renewables and improves building energy efficiency to reduce gas import dependence.",
    },
    Healthcare: {
      name: "Latvia Mandatory Health Insurance Reform",
      description:
        "Introduces mandatory health insurance to end the two-tier system that excludes non-employed residents.",
    },
    Infrastructure: {
      name: "Latvia Rail Baltica Active Construction",
      description:
        "Advances Rail Baltica's European standard gauge railway connecting Riga to Tallinn and Warsaw.",
    },
    Education: {
      name: "Latvia Latvian Language as Sole Education Medium",
      description:
        "Completes the transition to Latvian as the sole language of public education in Russian-speaking minority schools.",
    },
    Economy: {
      name: "Latvia Defense Industry Cluster Development",
      description:
        "Attracts NATO defense contractors to Latvia's industrial parks as demand for Baltic defense manufacturing rises.",
    },
    Defense: {
      name: "Latvia NATO Battle Group Host and Expansion",
      description:
        "Hosts Canada-led NATO enhanced forward presence Battle Group and funds expansion to brigade-level defense.",
    },
    Technology: {
      name: "Latvia Digital Transformation Guidelines 2027",
      description:
        "Advances e-Latvija interoperability, government data sharing, and Riga's ICT startup ecosystem.",
    },
    Social: {
      name: "Latvia Demographic Reversal Action Plan",
      description:
        "Implements pro-natalist benefits, diaspora return programs, and immigration policy reform to reverse population decline.",
    },
  },
  lt: {
    Climate: {
      name: "Lithuania National Energy Independence Plan",
      description:
        "Builds Baltic wind farms, LNG terminal, and power grid synchronization with Continental Europe to end Russian energy links.",
    },
    Healthcare: {
      name: "Lithuania Health System Reform Act",
      description:
        "Restructures hospital networks, improves PHC, and addresses specialist shortages following physician emigration.",
    },
    Infrastructure: {
      name: "Lithuania Rail Baltica Electrification",
      description:
        "Electrifies new Rail Baltica track and upgrades existing Lithuanian rail for full EU integration.",
    },
    Education: {
      name: "Lithuania STEM National Program",
      description:
        "Invests €150M in STEM education infrastructure, teachers, and research at KTU and Vilnius University.",
    },
    Economy: {
      name: "Lithuania Laser and Photonics Industry Strategy",
      description:
        "Develops and protects Lithuania's globally leading laser and photonics manufacturing cluster in Vilnius.",
    },
    Defense: {
      name: "Lithuania German Brigade Forward Deployment",
      description:
        "Finalizes the permanent stationing of a German NATO brigade in Vilnius as the eastern flank deterrence centerpiece.",
    },
    Technology: {
      name: "Lithuania Digital Public Infrastructure Strategy",
      description:
        "Develops digital identity, open banking, and e-government services for Lithuania's digital residents and citizens.",
    },
    Social: {
      name: "Lithuania Child Poverty Safety Net Enhancement",
      description:
        "Raises child benefits, expands subsidized childcare, and increases free school meals provision for low-income families.",
    },
  },
  ee: {
    Climate: {
      name: "Estonia Climate Ambitions Green Deal Alignment",
      description:
        "Phases out oil shale electricity by 2035 and develops Baltic offshore wind to achieve net-zero before 2050.",
    },
    Healthcare: {
      name: "Estonia E-Health Digital Record Expansion",
      description:
        "Leverages Estonia's X-Road data infrastructure to integrate hospital, pharmacy, and GP health records nationwide.",
    },
    Infrastructure: {
      name: "Estonia Rail Baltic Tallinn-Pärnu Section",
      description:
        "Completes Rail Baltica's Estonian section connecting Tallinn International Airport to the Latvian border.",
    },
    Education: {
      name: "Estonia Computing & Coding in Schools",
      description:
        "Maintains and deepens Estonia's pioneering K-12 coding curriculum as the model for EU digital skills education.",
    },
    Economy: {
      name: "Estonia Startup Estonia Unicorn Pipeline",
      description:
        "Develops the next generation of Estonian unicorns following Skype, Wise, and Bolt through Startup Estonia grants.",
    },
    Defense: {
      name: "Estonia NATO Article 5 Forward Defense Model",
      description:
        "Advocates for and hosts NATO forward defense battalion as the model for credible Baltic deterrence.",
    },
    Technology: {
      name: "Estonia Digital Nation Blueprint 2030",
      description:
        "Advances Estonia's global digital governance leadership through e-Residency, X-Road, and digital embassies.",
    },
    Social: {
      name: "Estonia Working Life Integration of Russians",
      description:
        "Funds Estonian language training for Russian-speaking residents to improve labor market access and social cohesion.",
    },
  },
  is: {
    Climate: {
      name: "Iceland Carbon Capture and Storage CCS Leadership",
      description:
        "Develops and commercializes direct air capture and geothermal CO2 injection making Iceland a CCS technology leader.",
    },
    Healthcare: {
      name: "Iceland Universal Healthcare Sustainability Review",
      description:
        "Addresses long waiting times in Iceland's universal healthcare system through capacity and workforce expansion.",
    },
    Infrastructure: {
      name: "Iceland Highlands Road F-System Development",
      description:
        "Develops sustainable highland road infrastructure enabling year-round access and eco-tourism development.",
    },
    Education: {
      name: "Iceland University of Iceland Strategic Vision",
      description:
        "Strengthens Iceland's only comprehensive university to reduce student emigration to Scandinavia and the UK.",
    },
    Economy: {
      name: "Iceland Data Center Green Economy Development",
      description:
        "Attracts hyperscale data centers seeking geothermal and hydroelectric clean power for green computing operations.",
    },
    Defense: {
      name: "Iceland Keflavík US-NATO Base Operations Continuation",
      description:
        "Maintains Keflavík base operations with US and NATO partners as Iceland's non-military defense contribution.",
    },
    Technology: {
      name: "Iceland Digital Iceland Government Strategy",
      description:
        "Digitizes all citizen services, connects all homes to fiber, and develops an Arctic digital infrastructure hub.",
    },
    Social: {
      name: "Iceland Gender Pay Gap Enforcement Law",
      description:
        "Enforces Iceland's Equal Pay Standard requiring companies to certify equal pay to retain operating licenses.",
    },
  },
  lu: {
    Climate: {
      name: "Luxembourg Climate Law Net-Zero 2050",
      description:
        "Implements Luxembourg's binding climate law with carbon pricing, renewable incentives, and EV fleet mandates.",
    },
    Healthcare: {
      name: "Luxembourg CNS Health System Stabilization",
      description:
        "Reforms the CNS national health fund to manage unsustainable cost growth in one of Europe's richest health systems.",
    },
    Infrastructure: {
      name: "Luxembourg Free Public Transit Upgrade",
      description:
        "Expands rail and tram capacity following Luxembourg's historic 2020 introduction of free national public transport.",
    },
    Education: {
      name: "Luxembourg Multilingual Education Enhancement",
      description:
        "Strengthens trilingual Luxembourgish-German-French instruction to serve Luxembourg's 47% foreign-born population.",
    },
    Economy: {
      name: "Luxembourg Space Economy Leadership Plan",
      description:
        "Builds on SES, LuxSpace, and Space Resources legislation to make Luxembourg the EU's commercial space economy hub.",
    },
    Defense: {
      name: "Luxembourg NATO Collective Defense Contribution",
      description:
        "Provides financial contributions, satellite communications, and F-35 acquisition as Luxembourg's NATO commitment.",
    },
    Technology: {
      name: "Luxembourg AI and Data Economy Fund",
      description:
        "Invests €100M in AI research, data infrastructure, and digital finance innovation through Luxinnovation.",
    },
    Social: {
      name: "Luxembourg Housing Crisis Solutions Package",
      description:
        "Introduces rent controls, accelerated permitting, and social housing investment to address Luxembourg's acute housing shortage.",
    },
  },
  cy: {
    Climate: {
      name: "Cyprus National Energy and Climate Plan",
      description:
        "Targets 29% renewable electricity by 2030 and funds energy storage to manage solar intermittency in the island grid.",
    },
    Healthcare: {
      name: "Cyprus GESY General Health System Stabilization",
      description:
        "Fine-tunes GESY's capitation payments and specialist co-pay structures as Cyprus's landmark health reform matures.",
    },
    Infrastructure: {
      name: "Cyprus Energy Interconnection with Israel-Greece",
      description:
        "Advances the EuroAsia Interconnector undersea cable connecting Cyprus to Israel and Greece's European grid.",
    },
    Education: {
      name: "Cyprus Vocational Education Attractiveness Reform",
      description:
        "Reduces stigma against vocational routes by improving TVET funding, equipment, and graduate employment rates.",
    },
    Economy: {
      name: "Cyprus Post-Passports Scheme FDI Diversification",
      description:
        "Attracts FDI from tech, shipping, and asset management following the shutdown of the controversial citizenship-by-investment scheme.",
    },
    Defense: {
      name: "Cyprus National Guard Hellenic Defense Cooperation",
      description:
        "Deepens military cooperation with Greece under the Joint Defense Doctrine as a deterrent against Turkish threats.",
    },
    Technology: {
      name: "Cyprus Digital Strategy 2025",
      description:
        "Develops Nicosia as a regional tech hub for fintech, cybersecurity, and digital services companies.",
    },
    Social: {
      name: "Cyprus Guaranteed Minimum Income Reform",
      description:
        "Revises the ΕΕΕΕ guaranteed minimum income to improve targeting accuracy and work incentive compatibility.",
    },
  },
  mt: {
    Climate: {
      name: "Malta Climate Action Plan",
      description:
        "Develops the Bahar ic-Caghaq floating solar facility and energy storage to replace Malta's gas-fired generation.",
    },
    Healthcare: {
      name: "Malta Health Strategy National Plan",
      description:
        "Reduces hospital waiting times and expands community mental health services for Malta's aging population.",
    },
    Infrastructure: {
      name: "Malta Gozo Tunnel Feasibility",
      description:
        "Evaluates a permanent tunnel link between Malta and Gozo replacing the existing ferry service.",
    },
    Education: {
      name: "Malta Scholarship Program Expansion",
      description:
        "Expands government scholarship funding to attract Maltese diaspora back and retain local talent in priority sectors.",
    },
    Economy: {
      name: "Malta iGaming and Digital Services Economy",
      description:
        "Modernizes the regulatory framework for Malta's dominant iGaming and digital services export sector.",
    },
    Defense: {
      name: "Malta Armed Forces SAR Enhancement",
      description:
        "Upgrades AFM maritime search and rescue and Frontex cooperation capacity for Mediterranean migration management.",
    },
    Technology: {
      name: "Malta AI Strategy 2030",
      description:
        "Positions Malta as a regulatory sandbox for AI governance and blockchain applications within EU Digital Single Market.",
    },
    Social: {
      name: "Malta Integration of Irregular Migrants",
      description:
        "Manages EU burden-sharing and community integration programs for irregular migrants arriving via Mediterranean crossings.",
    },
  },
  li: {
    Climate: {
      name: "Liechtenstein Climate Strategy 2050",
      description:
        "Achieves net-zero through heating oil replacement with heat pumps, renewable electricity from Austria, and EV fleet.",
    },
    Healthcare: {
      name: "Liechtenstein OKP Compulsory Insurance Quality",
      description:
        "Maintains healthcare quality for 39,000 residents through the OKP compulsory insurance and cross-border Swiss services.",
    },
    Infrastructure: {
      name: "Liechtenstein E-Bus Public Transit Expansion",
      description:
        "Converts Vaduz public bus fleet to electric and improves cross-border cycling and transit links to Switzerland.",
    },
    Education: {
      name: "Liechtenstein Dual Education Innovation System",
      description:
        "Strengthens Liechtenstein's high-quality apprenticeship system feeding precision manufacturing and financial industries.",
    },
    Economy: {
      name: "Liechtenstein Financial Center Modernization",
      description:
        "Adapts Liechtenstein's wealth management and foundations industry to EU AMLD compliance and digital asset regulation.",
    },
    Defense: {
      name: "Liechtenstein Police Non-Military Security",
      description:
        "Maintains public order and border management through the 80-officer Landespolizei with no standing army.",
    },
    Technology: {
      name: "Liechtenstein Blockchain Act Implementation",
      description:
        "Implements the Token and Trusted Technologies Act positioning Liechtenstein as a leading blockchain regulation model.",
    },
    Social: {
      name: "Liechtenstein Cross-Border Worker Integration",
      description:
        "Manages social cohesion as 55% of Liechtenstein's workforce commutes daily from Switzerland and Austria.",
    },
  },
  mc: {
    Climate: {
      name: "Monaco National Pact for Energy Transition",
      description:
        "Achieves carbon neutrality by 2050 through zero-emission mobility, solar rooftops, and offshore energy import.",
    },
    Healthcare: {
      name: "Monaco Healthcare for Residents and Monaco-Ville",
      description:
        "Maintains universal healthcare for Monaco's residents through the state medical network and CAF subsidies.",
    },
    Infrastructure: {
      name: "Monaco Land Reclamation Extension Project",
      description:
        "Develops the Portier Cove land extension adding 6 hectares of eco-engineered land to Monaco's coastline.",
    },
    Education: {
      name: "Monaco Public Education Quality Maintenance",
      description:
        "Operates Monaco's small but high-quality public schools delivering multilingual education aligned with French curricula.",
    },
    Economy: {
      name: "Monaco Tech and Green Economy Diversification",
      description:
        "Attracts biotech, yachting, and sustainability-focused businesses through tax and residency incentives.",
    },
    Defense: {
      name: "Monaco France Security Guarantee Treaty",
      description:
        "Relies on the 2002 France-Monaco Treaty of Friendship for external defense while maintaining a 260-person Carabiniers police.",
    },
    Technology: {
      name: "Monaco 5G Smart Principality Initiative",
      description:
        "Deploys one of the world's densest 5G networks supporting smart maritime, traffic, and building management.",
    },
    Social: {
      name: "Monaco Affordable Housing for Monégasques",
      description:
        "Maintains rent-controlled communal housing for Monégasque nationals to ensure they can afford to live in the Principality.",
    },
  },
  sm: {
    Climate: {
      name: "San Marino Renewable Energy Action Plan",
      description:
        "Develops rooftop solar and geothermal heating to reach 20% self-sufficiency and reduce energy import costs.",
    },
    Healthcare: {
      name: "San Marino ISS Health Authority Modernization",
      description:
        "Upgrades the San Marino ISS hospital and cross-border specialist agreements with Rimini to improve care quality.",
    },
    Infrastructure: {
      name: "San Marino Tourism Infrastructure Upgrade",
      description:
        "Modernizes access roads, parking, and pedestrian areas in the historic center to support 3M annual tourists.",
    },
    Education: {
      name: "San Marino University Internationalization",
      description:
        "Attracts foreign students and international partnerships to the University of San Marino through scholarship programs.",
    },
    Economy: {
      name: "San Marino Banking Sector Reform",
      description:
        "Reforms San Marino's banking system following the 2014 Banca CIS crisis to rebuild international correspondent banking.",
    },
    Defense: {
      name: "San Marino Crossbow Corps Ceremonial Guard",
      description:
        "Maintains the Crossbow Corps and Guard of the Great and General Council as civil defense and ceremonial forces.",
    },
    Technology: {
      name: "San Marino Digital Republic Agenda",
      description:
        "Partners with private sector to offer digital residency, e-government, and blockchain public registry services.",
    },
    Social: {
      name: "San Marino Equal Opportunities Commission",
      description:
        "Implements gender equality legislation and anti-discrimination protections covering work, family, and civic participation.",
    },
  },
  cu: {
    Climate: {
      name: "Cuba Solar Energy Emergency Deployment",
      description:
        "Deploys distributed solar panels and batteries to address chronic power cuts from degraded thermoelectric plants.",
    },
    Healthcare: {
      name: "Cuba Biopharmaceutical Innovation Program",
      description:
        "Develops and exports Cuban-developed vaccines and biotech products as a key source of hard-currency earnings.",
    },
    Infrastructure: {
      name: "Cuba US Tourism Opening Infrastructure Preparation",
      description:
        "Prepares hotel, transportation, and airport capacity for anticipated US tourist arrivals amid policy fluctuations.",
    },
    Education: {
      name: "Cuba Technology Education Modernization",
      description:
        "Updates university ICT curricula and provides limited computer access to maintain Cuba's high human capital base.",
    },
    Economy: {
      name: "Cuba Currency Unification Stability Measures",
      description:
        "Manages consequences of the Tarea Ordenamiento currency unification that collapsed purchasing power in 2021.",
    },
    Defense: {
      name: "Cuba Revolutionary Armed Forces Modernization",
      description:
        "Maintains the FAR's internal security and international training cooperation roles amid deteriorating equipment.",
    },
    Technology: {
      name: "Cuba ETECSA Network Expansion",
      description:
        "Expands ETECSA's 3G and 4G mobile network while maintaining state control over internet access and content.",
    },
    Social: {
      name: "Cuba Food Rationing System Libreta Reform",
      description:
        "Revises the libreta rationing system as food import constraints and subsidy costs reach unsustainable levels.",
    },
  },
  do: {
    Climate: {
      name: "Dominican Republic National Climate Change Policy",
      description:
        "Develops coastal protection, flood management, and renewable energy to address Hurricane Fiona-level climate risk.",
    },
    Healthcare: {
      name: "Dominican Republic SENASA Universal Insurance",
      description:
        "Expands SENASA health insurance toward full population coverage including informal workers.",
    },
    Infrastructure: {
      name: "Dominican Republic Metro and Cable Car Expansion",
      description:
        "Extends Santo Domingo Metro lines and develops cable car connections to hillside communities.",
    },
    Education: {
      name: "Dominican Republic Extended School Day Program",
      description:
        "Operates the Tanda Extendida extended school day in 8,000 schools improving educational quality and meals access.",
    },
    Economy: {
      name: "Dominican Republic Free Trade Zone Growth",
      description:
        "Expands free trade zone manufacturing in medical devices, tobacco, and textiles leveraging DR-CAFTA access.",
    },
    Defense: {
      name: "Dominican Republic Haiti Border Security",
      description:
        "Deploys additional forces and border fencing following Haiti's governance collapse and gang control of Port-au-Prince.",
    },
    Technology: {
      name: "Dominican Republic Digital Economy Strategy",
      description:
        "Develops Dominican tech talent through coding bootcamps, digital hubs, and BPO services for North American clients.",
    },
    Social: {
      name: "Dominican Republic Supérate Social Protection",
      description:
        "Provides conditional cash transfers and food subsidies through the Supérate program to 800,000 poor families.",
    },
  },
  ht: {
    Climate: {
      name: "Haiti Climate Resilience Strategy",
      description:
        "Develops disaster risk reduction and early warning capacities for Haiti's extreme vulnerability to hurricanes and floods.",
    },
    Healthcare: {
      name: "Haiti MSPP Emergency Health System Support",
      description:
        "Maintains basic health services through international NGOs as gang violence collapses the formal health system.",
    },
    Infrastructure: {
      name: "Haiti Port-au-Prince Port Rehabilitation",
      description:
        "Restores Port-au-Prince port operations to support humanitarian imports as gangs threaten supply chain access.",
    },
    Education: {
      name: "Haiti Emergency School Reopening Plan",
      description:
        "Reopens closed schools with UNICEF support as gang violence prevents access to 900,000 students.",
    },
    Economy: {
      name: "Haiti MSS Economic Stabilization Framework",
      description:
        "Develops an economic recovery framework aligned with the Kenyan-led Multinational Security Support mission objectives.",
    },
    Defense: {
      name: "Haiti Multinational Security Support Coordination",
      description:
        "Partners with the Kenya-led MSS force to rebuild HNP capacity and reclaim territory from controlling gangs.",
    },
    Technology: {
      name: "Haiti Mobile Money Digicel MonCash Expansion",
      description:
        "Extends MonCash mobile money and humanitarian cash transfer infrastructure amid banking system collapse.",
    },
    Social: {
      name: "Haiti Internally Displaced Persons Emergency Relief",
      description:
        "Provides food, shelter, and protection to 600,000 Haitians displaced by gang violence in Port-au-Prince.",
    },
  },
  gt: {
    Climate: {
      name: "Guatemala Green Compact NDC Implementation",
      description:
        "Implements afforestation, clean cookstoves, and hydropower targets from Guatemala's Nationally Determined Contribution.",
    },
    Healthcare: {
      name: "Guatemala Universal Health Coverage Expansion",
      description:
        "Scales the Programa de Extensión de Cobertura extending basic health services to Mayan rural communities.",
    },
    Infrastructure: {
      name: "Guatemala Ring Road Circumscription Plan",
      description:
        "Develops a Guatemala City ring road to relieve congestion and connect industrial parks to port infrastructure.",
    },
    Education: {
      name: "Guatemala Bilingual Intercultural Education",
      description:
        "Expands indigenous Mayan language education in 22 linguistic communities to reduce dropout and improve outcomes.",
    },
    Economy: {
      name: "Guatemala Anti-Corruption Investment Climate Reform",
      description:
        "Implements President Arévalo's anti-corruption agenda to improve investment climate and FDI attraction.",
    },
    Defense: {
      name: "Guatemala Northern Triangle Border Security",
      description:
        "Coordinates Guatemalan Armed Forces border operations with the US against narcotrafficking and irregular migration.",
    },
    Technology: {
      name: "Guatemala Digital Economy and Fintech Policy",
      description:
        "Develops digital payment infrastructure and fintech regulation to formalize Guatemala's large informal economy.",
    },
    Social: {
      name: "Guatemala Semilla Migration Root Causes Strategy",
      description:
        "Invests in rural poverty reduction, education, and anti-violence programs in high-migration Guatemalan communities.",
    },
  },
  hn: {
    Climate: {
      name: "Honduras NDC Adaptation Forests and Water",
      description:
        "Protects Honduras's forest cover and watershed protection as climate adaptation for its agriculture-dependent economy.",
    },
    Healthcare: {
      name: "Honduras SESAL Primary Care Service Delivery",
      description:
        "Expands SESAL's outreach to rural Honduras through mobile teams and community health volunteers.",
    },
    Infrastructure: {
      name: "Honduras Corredor Seco Highway Rehabilitation",
      description:
        "Rehabilitates roads in the Corredor Seco linking drought-affected communities to food markets and cities.",
    },
    Education: {
      name: "Honduras Bono 10,000 Education Conditionality",
      description:
        "Links Bono 10,000 cash transfers to school attendance requirements to improve completion in rural areas.",
    },
    Economy: {
      name: "Honduras Próspera ZEDE Special Zone Policy",
      description:
        "Manages the political and legal dispute surrounding Próspera's charter city model following regulatory reversal.",
    },
    Defense: {
      name: "Honduras Armed Forces Counter-Narcotics Operations",
      description:
        "Coordinates with DEA and SOUTHCOM to disrupt Honduran drug trafficking networks and MS-13 gang infrastructure.",
    },
    Technology: {
      name: "Honduras Digital Government Modernization",
      description:
        "Digitizes business registration, tax filing, and public procurement to reduce corruption and improve competitiveness.",
    },
    Social: {
      name: "Honduras Ciudad Mujer Women's Services Centers",
      description:
        "Operates Ciudad Mujer integrated service centers providing healthcare, legal aid, and economic empowerment.",
    },
  },
  sv: {
    Climate: {
      name: "El Salvador Climate Vulnerability Adaptation",
      description:
        "Implements mangrove restoration and drought-resistant agriculture for the SICA climate-vulnerable Pacific corridor.",
    },
    Healthcare: {
      name: "El Salvador Free Medicine Policy Continuity",
      description:
        "Continues the Bukele-era free medicine distribution in public hospitals expanding drug availability.",
    },
    Infrastructure: {
      name: "El Salvador New Capital Nuevas Ideas",
      description:
        "Develops the new legislative palace and government complex in San Salvador as a flagship Bukele infrastructure project.",
    },
    Education: {
      name: "El Salvador Digital Education Pack",
      description:
        "Provides tablets and connectivity to all primary school students in El Salvador's public education system.",
    },
    Economy: {
      name: "El Salvador Bitcoin Legal Tender Evolution",
      description:
        "Manages the scaled-back Bitcoin legal tender policy maintained despite IMF pressure for a voluntary-only approach.",
    },
    Defense: {
      name: "El Salvador Estado de Excepción Gang Eradication",
      description:
        "Operates the state of exception enabling mass gang member arrests that reduced homicide rates to record lows.",
    },
    Technology: {
      name: "El Salvador Chivo Digital Wallet Infrastructure",
      description:
        "Maintains the Chivo Bitcoin wallet and national digital payment infrastructure under revised legal framework.",
    },
    Social: {
      name: "El Salvador CECOT Mega-Prison Incarceration Model",
      description:
        "Operates the CECOT mega-prison housing 39,000 gang members while managing international human rights concerns.",
    },
  },
  ni: {
    Climate: {
      name: "Nicaragua Renewable Energy Geothermal Expansion",
      description:
        "Expands Nicaragua's remarkable 75% renewable grid through geothermal and wind additions in Rivas and León.",
    },
    Healthcare: {
      name: "Nicaragua Primary Healthcare Network Strengthening",
      description:
        "Operates the MINSA casa base community health model despite international isolation from political repression.",
    },
    Infrastructure: {
      name: "Nicaragua Gran Canal Feasibility Reassessment",
      description:
        "Reassesses the stalled HKND Group Nicaragua canal project amid investor withdrawal and environmental concerns.",
    },
    Education: {
      name: "Nicaragua Literacy Campaign 2.0 Continuation",
      description:
        "Maintains Nicaragua's tradition of mass literacy campaigns to address remaining adult illiteracy.",
    },
    Economy: {
      name: "Nicaragua Maquila Export Manufacturing Strategy",
      description:
        "Develops textile and cigar export manufacturing leveraging Nicaragua's CAFTA-DR market access and low labor costs.",
    },
    Defense: {
      name: "Nicaragua Ejército de Nicaragua Internal Security",
      description:
        "Maintains the Ejército de Nicaragua's internal security functions supporting Ortega government stability.",
    },
    Technology: {
      name: "Nicaragua Digital Connectivity Government Program",
      description:
        "Extends government-controlled internet connectivity to rural municipalities through TELCOR regulation.",
    },
    Social: {
      name: "Nicaragua Bono Productivo Alimentario Program",
      description:
        "Provides productive assets, training, and food aid to rural Nicaraguan families through the Hambre Cero program.",
    },
  },
  cr: {
    Climate: {
      name: "Costa Rica Carbon Neutrality 2050 Plan",
      description:
        "Operationalizes Costa Rica's National Decarbonization Plan targeting net-zero through transport and energy transition.",
    },
    Healthcare: {
      name: "Costa Rica CCSS Universal Insurance Modernization",
      description:
        "Reforms the CCSS to reduce waiting times and digitize services while maintaining Costa Rica's universal coverage model.",
    },
    Infrastructure: {
      name: "Costa Rica Route 27 Pacific Highway Expansion",
      description:
        "Expands Route 27 to six lanes connecting San José to Caldera's Pacific port for tourist and freight traffic.",
    },
    Education: {
      name: "Costa Rica National Education Plan Quality Focus",
      description:
        "Shifts Costa Rica's education investment from access to quality, targeting PISA benchmark improvements.",
    },
    Economy: {
      name: "Costa Rica Medical Device Export Expansion",
      description:
        "Deepens Costa Rica's medical device export cluster in the Coyol Free Zone as the No. 1 US medical device supplier.",
    },
    Defense: {
      name: "Costa Rica Fuerza Pública Border Security",
      description:
        "Strengthens the Fuerza Pública's border control capacity to manage narcotics trafficking from Panama and Nicaragua.",
    },
    Technology: {
      name: "Costa Rica Digital Transformation Plan 2023-2026",
      description:
        "Digitizes 90% of government services and develops the GovTech ecosystem in the tech-mature San José metro.",
    },
    Social: {
      name: "Costa Rica Universal Child Protection Network",
      description:
        "Expands PANI child welfare services to address rising child poverty as remittance-dependent households struggle.",
    },
  },
  pa: {
    Climate: {
      name: "Panama Climate Change National Plan",
      description:
        "Funds watershed protection and low-carbon cities to safeguard the Panama Canal's water supply from drought.",
    },
    Healthcare: {
      name: "Panama CSS Social Security Health Reform",
      description:
        "Modernizes the CSS health system to reduce chronic waiting times in its provider network.",
    },
    Infrastructure: {
      name: "Panama Canal Water Management Plan",
      description:
        "Implements Gatun Lake water conservation and the proposed Río Indio reservoir to ensure Canal operational capacity.",
    },
    Education: {
      name: "Panama Educando en Casa Distance Learning",
      description:
        "Maintains digital learning infrastructure built during the COVID era to reach remote provinces.",
    },
    Economy: {
      name: "Panama Cobre Panamá Resolution Finance Plan",
      description:
        "Manages economic impacts of the Cobre Panamá mine closure through fiscal consolidation and FDI attraction.",
    },
    Defense: {
      name: "Panama Canal Security Cooperation Plan",
      description:
        "Coordinates Panama Canal Zone security with US SOUTHCOM partnerships and coast guard capacity building.",
    },
    Technology: {
      name: "Panama Digital Hub for the Americas Strategy",
      description:
        "Develops Panama City as the premier data center and digital services hub connecting North and South America.",
    },
    Social: {
      name: "Panama Red de Oportunidades Social Transfer",
      description:
        "Provides monthly cash transfers and social services to Panama's extreme rural and indigenous poor populations.",
    },
  },
  jm: {
    Climate: {
      name: "Jamaica Vision 2030 Climate Resilience",
      description:
        "Develops Blue and Green Economy sectors while hardening infrastructure against intensifying Caribbean hurricanes.",
    },
    Healthcare: {
      name: "Jamaica NHF and JADEP Sustainability",
      description:
        "Sustains Jamaica's National Health Fund and drug plan for chronic disease management on a constrained budget.",
    },
    Infrastructure: {
      name: "Jamaica JUTC BRT Kingston Bus Rapid Transit",
      description:
        "Develops bus rapid transit in Kingston to reduce dependency on informal taxis (robots) and car ownership.",
    },
    Education: {
      name: "Jamaica Early Childhood Commission Quality Program",
      description:
        "Raises quality standards across Jamaica's 2,700 early childhood institutions catering to 130,000 children.",
    },
    Economy: {
      name: "Jamaica Tourism Post-COVID Resilience Strategy",
      description:
        "Rebuilds high-end tourism, develops short-term rental regulation, and diversifies visitor source markets.",
    },
    Defense: {
      name: "Jamaica JDF Counter-Narcotics Maritime Operations",
      description:
        "Executes joint Jamaica Defence Force and US JIATF-S operations to interdict cocaine shipments through the Caribbean.",
    },
    Technology: {
      name: "Jamaica Digital Government Transformation",
      description:
        "Delivers the eGov Jamaica platform consolidating citizen services and improving public sector efficiency.",
    },
    Social: {
      name: "Jamaica PATH Social Assistance Program",
      description:
        "Provides conditional cash transfers and social services to 375,000 low-income Jamaicans on the PATH program.",
    },
  },
  tt: {
    Climate: {
      name: "Trinidad & Tobago NDC 15% Emission Reduction",
      description:
        "Pursues a 15% unconditional GHG reduction through natural gas efficiency and renewable energy development.",
    },
    Healthcare: {
      name: "Trinidad & Tobago NHI Universal Coverage",
      description:
        "Develops a National Health Insurance system to complement RHAs delivering free public care to all citizens.",
    },
    Infrastructure: {
      name: "Trinidad & Tobago Interisland Fast Ferry Service",
      description:
        "Modernizes interisland sea bridge fast ferry services connecting Port of Spain to Scarborough.",
    },
    Education: {
      name: "Trinidad & Tobago GATE Tertiary Education Reform",
      description:
        "Reforms the GATE tertiary education grant to prioritize STEM, technical, and priority program disciplines.",
    },
    Economy: {
      name: "Trinidad & Tobago Gas and Downstream Industrial Revival",
      description:
        "Secures new Atlantic LNG train feedgas supply agreements and develops downstream petrochemical exports.",
    },
    Defense: {
      name: "Trinidad & Tobago TTDF Coastal Maritime Patrol",
      description:
        "Operates TTDF coast guard patrols combating cocaine trafficking through Trinidad's strategic Caribbean location.",
    },
    Technology: {
      name: "Trinidad & Tobago Digital Transformation Roadmap",
      description:
        "Digitizes TTBizLink trade facilitation, e-government services, and develops Port of Spain's fintech sector.",
    },
    Social: {
      name: "Trinidad & Tobago SOCIAL SECTOR Investment Programme",
      description:
        "Funds social housing, food support, and community uplift programs for T&T's urban and rural poor.",
    },
  },
  bs: {
    Climate: {
      name: "Bahamas National Resilience Plan Post-Dorian",
      description:
        "Implements Dorian hurricane reconstruction with a focus on resilient housing and mangrove coastal protection.",
    },
    Healthcare: {
      name: "Bahamas National Health Insurance Program",
      description:
        "Develops and expands the NHI Bahamas program toward universal coverage for all resident Bahamians.",
    },
    Infrastructure: {
      name: "Bahamas Paradise Island Bridge Upgrade",
      description:
        "Rehabilitates the Nassau-Paradise Island bridge infrastructure critical to Bahamas' tourism industry connectivity.",
    },
    Education: {
      name: "Bahamas Education Transformation Plan",
      description:
        "Revises curriculum, upgrades school facilities, and recruits teachers to close COVID-era learning gaps.",
    },
    Economy: {
      name: "Bahamas FATF Watchlist Remediation Strategy",
      description:
        "Implements AML/CFT regulatory improvements to exit the FATF grey list and restore financial system reputation.",
    },
    Defense: {
      name: "Bahamas RBDF Maritime Drug Interdiction",
      description:
        "Operates Royal Bahamas Defence Force patrols intercepting Cuban migrants and Caribbean narcotraffickers.",
    },
    Technology: {
      name: "Bahamas Sand Dollar CBDC Leadership",
      description:
        "Refines and expands the Sand Dollar central bank digital currency as the global model for small island CBDCs.",
    },
    Social: {
      name: "Bahamas Grand Bahama Abaco Recovery Fund",
      description:
        "Continues rebuilding low-income communities on Abaco and Grand Bahama devastated by Hurricane Dorian.",
    },
  },
  bb: {
    Climate: {
      name: "Barbados Bridgetown Initiative Climate Finance",
      description:
        "Champions PM Mottley's Bridgetown Initiative reforming the global financial architecture for climate-vulnerable countries.",
    },
    Healthcare: {
      name: "Barbados QEH Queen Elizabeth Hospital Expansion",
      description:
        "Expands and modernizes the QEH as a regional referral center for the Eastern Caribbean health services.",
    },
    Infrastructure: {
      name: "Barbados Transport Board Electric Bus Fleet",
      description:
        "Converts the Transport Board to an all-electric bus fleet by 2030 as part of Barbados' energy transition.",
    },
    Education: {
      name: "Barbados SJPP Samuel Jackman Prescod Polytechnic Reform",
      description:
        "Modernizes SJPP curriculum and equipment to address skills gaps in construction, IT, and services.",
    },
    Economy: {
      name: "Barbados Tourism Recovery and Diversification",
      description:
        "Rebuilds tourism from the COVID collapse through the Welcome Stamp remote-work visa and sustainable tourism standards.",
    },
    Defense: {
      name: "Barbados Barbados Defence Force Regional Disaster Role",
      description:
        "Maintains the BDF's small regional disaster response and coast guard capacity for Eastern Caribbean security.",
    },
    Technology: {
      name: "Barbados Digital Economy Policy 2025-2030",
      description:
        "Develops Bridgetown's fintech, digital nomad, and blockchain innovation ecosystem based on a clear regulatory framework.",
    },
    Social: {
      name: "Barbados National Housing Programme Affordable Units",
      description:
        "Constructs 5,000 affordable housing units for low and middle-income Barbadians priced out of the market.",
    },
  },
  bz: {
    Climate: {
      name: "Belize Blue Economy Climate Adaptation",
      description:
        "Develops marine protected areas, mangrove conservation, and sustainable fisheries anchored by the Belize Barrier Reef.",
    },
    Healthcare: {
      name: "Belize Universal Health Coverage Development",
      description:
        "Expands Karl Heusner Memorial Hospital specialist services and rural polyclinic coverage statewide.",
    },
    Infrastructure: {
      name: "Belize Philip Goldson Highway Expansion",
      description:
        "Expands the Philip Goldson Highway corridor connecting Belize City to Corozal and the Mexican border.",
    },
    Education: {
      name: "Belize National Education Reform Roadmap",
      description:
        "Raises literacy outcomes, reduces dropout, and improves teacher support systems across primary and secondary schools.",
    },
    Economy: {
      name: "Belize Debt-for-Nature Swap Blue Bond",
      description:
        "Executes a blue bond debt swap directing savings toward marine conservation protecting Belize's tourism economy.",
    },
    Defense: {
      name: "Belize BDF Guatemala Border Defense",
      description:
        "Maintains Belize Defence Force operations along the Guatemalan border amid longstanding territorial claims.",
    },
    Technology: {
      name: "Belize National ICT Strategic Plan",
      description:
        "Extends broadband connectivity to rural Cayo and Toledo districts and digitizes selected government services.",
    },
    Social: {
      name: "Belize Social Investment Fund Community Development",
      description:
        "Funds community infrastructure, school meals, and poverty reduction programs in Belize's most vulnerable communities.",
    },
  },
  uy: {
    Climate: {
      name: "Uruguay 100% Clean Electricity Achievement",
      description:
        "Sustains Uruguay's 98% renewable electricity leadership while developing green hydrogen export for Europe.",
    },
    Healthcare: {
      name: "Uruguay FONASA Integrated Health Reform",
      description:
        "Deepens the integrated national health fund binding public and private providers under equitable capitation.",
    },
    Infrastructure: {
      name: "Uruguay Ferrocarril Central Train Modernization",
      description:
        "Modernizes the Central Railway for passenger revival and Montes del Plata pulp freight transport.",
    },
    Education: {
      name: "Uruguay Plan Ceibal Digital Education Model",
      description:
        "Evolves Plan Ceibal from the world's first 1:1 laptop program to an AI-driven personalized learning platform.",
    },
    Economy: {
      name: "Uruguay Hydrogen Andes-Atlantic Ambition",
      description:
        "Develops offshore wind-powered green hydrogen to position Uruguay as a South American energy export hub.",
    },
    Defense: {
      name: "Uruguay FFAA UN Peacekeeping Engagement",
      description:
        "Maintains Uruguay's strong tradition as a proportional UN peacekeeping contributor in the DRC, Haiti, and Colombia.",
    },
    Technology: {
      name: "Uruguay Digital Uruguay Gov.uy Portal",
      description:
        "Deepens Uruguay's Gov.uy digital government services into a fully integrated citizen data and services platform.",
    },
    Social: {
      name: "Uruguay Uruguay Social MIDES Income Support",
      description:
        "Maintains MIDES universal social programs including Tarjeta Uruguay Social food cards and employment pathways.",
    },
  },
  py: {
    Climate: {
      name: "Paraguay National Climate Change Plan",
      description:
        "Develops reforestation incentives and cattleman carbon offset programs for the Chaco's deforested farmland.",
    },
    Healthcare: {
      name: "Paraguay Universal Coverage Health Reform",
      description:
        "Expands the MSPyBS primary care network with mobile units serving Paraguay's dispersed rural population.",
    },
    Infrastructure: {
      name: "Paraguay Bioceanic Road Corridor Completion",
      description:
        "Completes the Bioceanic Corridor linking the Atlantic coast to Chilean Pacific ports through Paraguayan territory.",
    },
    Education: {
      name: "Paraguay Jóvenes en Acción TVET Expansion",
      description:
        "Scales technical and vocational education through SNPP to reduce Paraguay's structural skills mismatch.",
    },
    Economy: {
      name: "Paraguay Crypto Mining Clean Energy Position",
      description:
        "Markets Paraguay's Itaipú hydroelectric surplus as clean energy for Bitcoin mining and data center operations.",
    },
    Defense: {
      name: "Paraguay FAP Anti-Narcotrafficking Operations",
      description:
        "Conducts Fuerzas Armadas del Paraguay operations against EPP criminal group and cocaine corridor trafficking.",
    },
    Technology: {
      name: "Paraguay Paraguay Digital Government Plan",
      description:
        "Digitizes HACIENDA tax, customs, and civil registry services to reduce informality and improve revenue collection.",
    },
    Social: {
      name: "Paraguay Tekoporã Conditional Cash Transfer",
      description:
        "Provides monthly Tekoporã transfers and social support to 160,000 extremely poor Paraguayan families.",
    },
  },
  bo: {
    Climate: {
      name: "Bolivia Lithium and Renewable Energy Strategy",
      description:
        "Develops domestic lithium battery production through the state YLB enterprise and pairs it with solar energy.",
    },
    Healthcare: {
      name: "Bolivia SAFCI Community Family Health Policy",
      description:
        "Integrates traditional Andean medicine with biomedical primary care through the SAFCI community health model.",
    },
    Infrastructure: {
      name: "Bolivia Puerto Busch Atlantic Access Canal",
      description:
        "Develops Bolivia's Puerto Busch canal project to gain direct river access to the Paraná-Paraguay waterway.",
    },
    Education: {
      name: "Bolivia Constitutional Plurinational Education Reform",
      description:
        "Deepens the implementation of indigenous language instruction across Bolivia's 36 recognized languages.",
    },
    Economy: {
      name: "Bolivia Natural Gas Income Stabilization",
      description:
        "Manages the fiscal cliff from declining gas exports to Argentina and Brazil by expanding lithium and quinoa exports.",
    },
    Defense: {
      name: "Bolivia FFAA Counter-Coca Military Operations",
      description:
        "Coordinates UMOPAR and military resources for coca eradication in the Chapare region under DEA partnership.",
    },
    Technology: {
      name: "Bolivia Tupak Katari Satellite Utilization",
      description:
        "Leverages the Tupak Katari communications satellite for telehealth, distance education, and rural internet access.",
    },
    Social: {
      name: "Bolivia Bono Juana Azurduy Mother-Child Transfer",
      description:
        "Provides prenatal and postnatal cash transfers to Bolivian mothers attending regular health and education checkups.",
    },
  },
  sr: {
    Climate: {
      name: "Suriname Rainforest Carbon Sink Protection",
      description:
        "Seeks payment for Suriname's 93% forest cover which makes it one of the world's few carbon-negative countries.",
    },
    Healthcare: {
      name: "Suriname MOH Primary Health Reconstruction",
      description:
        "Rebuilds the MOH primary care system following years of economic crisis and COVID disruptions.",
    },
    Infrastructure: {
      name: "Suriname Nieuwe Haven Paramaribo Port",
      description:
        "Develops the new Paramaribo port to handle Suriname's anticipated offshore oil and gold export surge.",
    },
    Education: {
      name: "Suriname National Education Plan 2030",
      description:
        "Aligns Suriname's education system with Dutch Caricom standards and local economic development priorities.",
    },
    Economy: {
      name: "Suriname TotalEnergies Offshore Oil Production",
      description:
        "Develops the Block 58 offshore oil discovery to become a major new revenue source for Suriname's treasury.",
    },
    Defense: {
      name: "Suriname SNS Amazon Border Security",
      description:
        "Deploys Suriname National Army units to combat illegal gold mining and drug trafficking on Amazon border areas.",
    },
    Technology: {
      name: "Suriname Digital Transformation Foundation",
      description:
        "Builds foundational digital government infrastructure including a national ID and e-service platform.",
    },
    Social: {
      name: "Suriname Social Safety Net Reconstruction",
      description:
        "Rebuilds poverty assistance programs depleted during the 2020-2022 economic crisis and IMF adjustment.",
    },
  },
  gy: {
    Climate: {
      name: "Guyana Low Carbon Development Strategy",
      description:
        "Negotiates carbon credit payments for forest protection while managing the paradox of fast-growing oil production.",
    },
    Healthcare: {
      name: "Guyana Oil Revenue Health Investment",
      description:
        "Channels oil windfall revenues into new hospitals and specialist services in this historically underserved country.",
    },
    Infrastructure: {
      name: "Guyana New Amsterdam East Bank Highway",
      description:
        "Builds a four-lane East Bank highway from Georgetown to New Amsterdam to support oil sector growth.",
    },
    Education: {
      name: "Guyana Oil Revenue Education Transformation",
      description:
        "Invests oil royalties in university expansion, scholarships, and technical training aligned with energy sector needs.",
    },
    Economy: {
      name: "Guyana EXXON-led Oil Economy Management",
      description:
        "Establishes the Natural Resource Fund governance model to responsibly manage Guyana's booming oil revenues.",
    },
    Defense: {
      name: "Guyana GDF Venezuela Border Protection",
      description:
        "Strengthens Guyana Defence Force capacity following Venezuela's 2023 annexation claim over the Essequibo region.",
    },
    Technology: {
      name: "Guyana National ICT Plan 2030",
      description:
        "Deploys fiber connectivity, digital government services, and tech skills training as oil revenues transform the economy.",
    },
    Social: {
      name: "Guyana Hinterland Communities Development Program",
      description:
        "Provides infrastructure, services, and economic opportunities to Amerindian communities in Guyana's interior regions.",
    },
  },
  pg: {
    Climate: {
      name: "Papua New Guinea NDC Forests and Energy",
      description:
        "Pursues REDD+ forest carbon payments and hydro expansion to monetize PNG's extraordinary natural resources.",
    },
    Healthcare: {
      name: "Papua New Guinea National Health Plan",
      description:
        "Rebuilds PNG's collapsed rural health system through aid-funded community health worker deployment.",
    },
    Infrastructure: {
      name: "Papua New Guinea Highlands Highway Rehabilitation",
      description:
        "Rehabilitates the Highlands Highway to reconnect coffee, gold, and food-producing highland provinces to Lae port.",
    },
    Education: {
      name: "Papua New Guinea Free Education Policy",
      description:
        "Sustains Tuition Fee Free education policy while improving teacher quality and school infrastructure in remote areas.",
    },
    Economy: {
      name: "Papua New Guinea P-LNG Expansion Train",
      description:
        "Develops additional LNG trains at Papua LNG to double gas export revenues from the Elk-Antelope fields.",
    },
    Defense: {
      name: "Papua New Guinea Australia Defense Cooperation",
      description:
        "Deepens the PNG-Australia Defence Cooperation Agreement with naval basing and land force modernization.",
    },
    Technology: {
      name: "Papua New Guinea Connect PNG Connectivity",
      description:
        "Deploys submarine cable connectivity and rural broadband towers to reduce PNG's extreme digital exclusion.",
    },
    Social: {
      name: "Papua New Guinea Gender-Based Violence Emergency Plan",
      description:
        "Addresses PNG's extreme GBV rates through safe houses, legal reform, and community-based prevention programs.",
    },
  },
  fj: {
    Climate: {
      name: "Fiji 100% Renewable Energy Target",
      description:
        "Advances Fiji's 100% renewable electricity goal using hydro, solar, and wind on Viti Levu and Vanua Levu.",
    },
    Healthcare: {
      name: "Fiji Non-Communicable Disease Response",
      description:
        "Combats Fiji's extremely high NCD burden through community health promotion and primary care strengthening.",
    },
    Infrastructure: {
      name: "Fiji Kings Road Upgrade Viti Levu Circular",
      description:
        "Rehabilitates the Kings Road around Viti Levu completing the island's circular highway network.",
    },
    Education: {
      name: "Fiji Free Education from Primary to Secondary",
      description:
        "Maintains tuition-free education through Year 13 while improving quality in rural schools and outer islands.",
    },
    Economy: {
      name: "Fiji Sugar and Tourism Diversification Strategy",
      description:
        "Diversifies beyond sugar and tourism through aquaculture, timber, and Pacific financial services.",
    },
    Defense: {
      name: "Fiji RFMF UN Peacekeeping Tradition",
      description:
        "Maintains Fiji's contribution to UN peacekeeping in the Golan Heights and other missions as a national tradition.",
    },
    Technology: {
      name: "Fiji Digital Fiji ICT Strategy",
      description:
        "Connects outer island communities through satellite internet and develops Suva as a Pacific digital services hub.",
    },
    Social: {
      name: "Fiji Poverty Benefit Scheme Expansion",
      description:
        "Raises PBS payments and extends coverage to vulnerable Fijians not connected to the formal social protection system.",
    },
  },
  sb: {
    Climate: {
      name: "Solomon Islands NDC Coastal Adaptation",
      description:
        "Funds mangrove restoration and community relocation for low-lying islands facing sea-level rise submersion.",
    },
    Healthcare: {
      name: "Solomon Islands National Health Strategic Plan",
      description:
        "Provides essential health services through Church and government networks to 700,000 islanders spread over 900 islands.",
    },
    Infrastructure: {
      name: "Solomon Islands Honiara Urban Transport",
      description:
        "Develops basic Honiara infrastructure to manage rapid urban migration following 2021 civil unrest.",
    },
    Education: {
      name: "Solomon Islands Free Basic Education Continuation",
      description:
        "Sustains free basic education and TVET expansion through the Ministry of Education Strategic Plan.",
    },
    Economy: {
      name: "Solomon Islands Tuna and Logging Export Management",
      description:
        "Manages sustainable export of tuna and logs while transitioning toward value-added processing industries.",
    },
    Defense: {
      name: "Solomon Islands China Security Agreement Response",
      description:
        "Manages Australia and Pacific partners' concerns about the 2022 Solomon Islands-China Security Agreement.",
    },
    Technology: {
      name: "Solomon Islands Submarine Cable Connectivity",
      description:
        "Leverages the Australia-funded submarine cable to extend mobile money and internet services to provincial centers.",
    },
    Social: {
      name: "Solomon Islands Ethnic Tension Reconciliation",
      description:
        "Implements post-2021 Honiara riots reconciliation programs addressing Malaita-Guadalcanal ethnic tensions.",
    },
  },
  vu: {
    Climate: {
      name: "Vanuatu Climate Loss and Damage Pioneer",
      description:
        "Advances the global loss and damage finance mechanism and cyclone-resilient building codes for Vanuatu.",
    },
    Healthcare: {
      name: "Vanuatu Primary Healthcare and Vaccination Program",
      description:
        "Maintains immunization and outreach health services through the Vanuatu Community Health Program.",
    },
    Infrastructure: {
      name: "Vanuatu Port Vila Urban Reconstruction",
      description:
        "Rebuilds Port Vila housing and roads following repeated Category 4-5 cyclone damage.",
    },
    Education: {
      name: "Vanuatu Bislama Mother Tongue Education",
      description:
        "Implements Bislama mother-tongue early instruction before transitioning to English and French bilingual education.",
    },
    Economy: {
      name: "Vanuatu Citizenship-by-Investment Reform",
      description:
        "Reforms the citizenship-by-investment scheme following EU grey listing to improve governance and transparency.",
    },
    Defense: {
      name: "Vanuatu VMF Force Professionalization",
      description:
        "Develops the Vanuatu Mobile Force's disaster response and internal security capabilities with Australian support.",
    },
    Technology: {
      name: "Vanuatu Rural Internet and Mobile Money",
      description:
        "Extends VCTC and Vodafone connectivity to outer islands enabling mobile payments and e-government services.",
    },
    Social: {
      name: "Vanuatu Traditional land and Kastom Rights",
      description:
        "Recognizes traditional Kastom governance and land rights within Vanuatu's formal legal and social protection systems.",
    },
  },
  ws: {
    Climate: {
      name: "Samoa Nationally Determined Contribution 100% Renewable",
      description:
        "Pursues 100% renewable electricity by 2025 using solar, hydro, and waste-to-energy in Apia.",
    },
    Healthcare: {
      name: "Samoa National Health Services NHD",
      description:
        "Maintains Tupua Tamasese Meaole Hospital as the referral center and expands rural health sub-centers.",
    },
    Infrastructure: {
      name: "Samoa Road Access Programme Upgrade",
      description:
        "Upgrades the Cross Island Road and coastal roads damaged by recurring tropical cyclone events.",
    },
    Education: {
      name: "Samoa Education Sector Plan",
      description:
        "Improves school access, teacher quality, and ICT skills to meet Samoa's human development goals.",
    },
    Economy: {
      name: "Samoa Remittance-Dependent Economy Management",
      description:
        "Maintains low transfer cost policies and builds financial literacy for Samoa's 20% GDP remittance inflows.",
    },
    Defense: {
      name: "Samoa SPS Samoa Police Service Maritime Patrol",
      description:
        "Develops Samoa Police Service maritime patrol capacity for EEZ enforcement and disaster response.",
    },
    Technology: {
      name: "Samoa Digital Economy Development Policy",
      description:
        "Connects rural districts through satellite internet and digitizes government services for a digital Pacific.",
    },
    Social: {
      name: "Samoa COVID Recovery Social Protection",
      description:
        "Provides food vouchers, housing repair grants, and cash assistance to low-income Samoan families post-pandemic.",
    },
  },
  to: {
    Climate: {
      name: "Tonga Integrated Resilience Framework",
      description:
        "Combines cyclone-resilient infrastructure, mangrove protection, and 70% renewable electricity for Tonga's resilience.",
    },
    Healthcare: {
      name: "Tonga National Health Promotion Strategy",
      description:
        "Addresses Tonga's extreme NCD burden through community sports, dietary change, and primary care campaigns.",
    },
    Infrastructure: {
      name: "Tonga Hunga Volcano Recovery Reconstruction",
      description:
        "Rebuilds Tonga's internet cable, port, and housing infrastructure destroyed by the 2022 Hunga Tonga eruption.",
    },
    Education: {
      name: "Tonga Education Sector Plan Quality Assurance",
      description:
        "Improves teacher standards and school quality across Tonga's 169 islands through ministry-led reform.",
    },
    Economy: {
      name: "Tonga Blue Economy Ocean Resources",
      description:
        "Manages fishing license fees, seafloor mineral rights, and sustainable aquaculture as ocean economy pillars.",
    },
    Defense: {
      name: "Tonga HMAF Disaster Response Readiness",
      description:
        "Maintains His Majesty's Armed Forces disaster response capacity following the Hunga Tonga volcanic eruption.",
    },
    Technology: {
      name: "Tonga National ICT Policy Digital Connectivity",
      description:
        "Restores and upgrades the Southern Cross NEXT submarine cable and develops mobile money for island remittances.",
    },
    Social: {
      name: "Tonga Diaspora Remittances Social Services",
      description:
        "Manages 38% of GDP in diaspora remittances as the primary social protection mechanism for Tongan families.",
    },
  },
  bh: {
    Climate: {
      name: "Bahrain National Energy Efficiency Action Plan",
      description:
        "Targets 5% renewable energy and 6% energy efficiency improvement as Bahrain's contribution to regional decarbonization.",
    },
    Healthcare: {
      name: "Bahrain National Health Strategy 2030",
      description:
        "Develops private healthcare capacity and specialized tertiary services for Bahrain's regional medical tourism ambitions.",
    },
    Infrastructure: {
      name: "Bahrain Metro Urban Mobility Project",
      description:
        "Develops a metro and bus rapid transit system to reduce Manama's traffic congestion and car dependency.",
    },
    Education: {
      name: "Bahrain Vision 2030 Knowledge Economy Push",
      description:
        "Develops vocational training through Tamkeen and university partnerships for Bahraini graduates in tech and finance.",
    },
    Economy: {
      name: "Bahrain Economic Vision 2030 Diversification",
      description:
        "Develops aluminum, financial services, and tourism sectors to reduce oil dependence with Aluminium Bahrain as anchor.",
    },
    Defense: {
      name: "Bahrain NAVCENT US 5th Fleet Host",
      description:
        "Hosts the US Navy's 5th Fleet at NSA Bahrain as the anchor of US military presence and Gulf security architecture.",
    },
    Technology: {
      name: "Bahrain Cloud First Government Strategy",
      description:
        "Migrates government services to cloud infrastructure and develops a regulatory sandbox for FinTech innovation.",
    },
    Social: {
      name: "Bahrain Housing Aid and Subsidies Program",
      description:
        "Provides subsidized housing loans and land grants to Bahraini nationals on the national housing waiting list.",
    },
  },
  ps: {
    Climate: {
      name: "Palestine NDC Renewable Energy Adaptation",
      description:
        "Develops solar energy capacity as a pathway to energy independence from Israeli-controlled electricity supply.",
    },
    Healthcare: {
      name: "Palestine Ministry of Health Emergency Response",
      description:
        "Maintains emergency healthcare delivery in Gaza and West Bank under blockade and conflict conditions.",
    },
    Infrastructure: {
      name: "Palestine Gaza Reconstruction International Plan",
      description:
        "Coordinates international donor reconstruction plans for Gaza's destroyed housing, water, and hospital infrastructure.",
    },
    Education: {
      name: "Palestine UNRWA School Emergency Operations",
      description:
        "Maintains UNRWA educational services for 300,000 Palestinian refugee students in Gaza, West Bank, and diaspora.",
    },
    Economy: {
      name: "Palestine Post-Conflict Economic Reconstruction",
      description:
        "Plans post-conflict economic reconstruction to rebuild Gaza's $26B destroyed economy with international donor support.",
    },
    Defense: {
      name: "Palestine PNA Security Coordination Framework",
      description:
        "Manages Palestinian Authority security coordination with Israel while addressing population security needs in the West Bank.",
    },
    Technology: {
      name: "Palestine Tech Startup Ecosystem Development",
      description:
        "Supports Palestinian tech entrepreneurs through Ramallah-based accelerators and diaspora investment despite restrictions.",
    },
    Social: {
      name: "Palestine Gaza Humanitarian Emergency Response",
      description:
        "Coordinates UNRWA, WHO, and WFP emergency services for 2.2M Palestinians in the most acute humanitarian emergency.",
    },
  },
};

// Fallback generic pool for countries not in the specific map
const COUNTRY_POLICY_FALLBACK: Record<
  PolicyCategory,
  Array<{ name: string; description: string }>
> = {
  Climate: [
    {
      name: "National Climate Action Plan",
      description:
        "A comprehensive strategy to cut emissions and reach Paris Agreement targets.",
    },
    {
      name: "Renewable Energy Expansion",
      description:
        "Scales up wind, solar, and hydro capacity to replace fossil fuel generation.",
    },
  ],
  Healthcare: [
    {
      name: "Universal Healthcare Reform",
      description:
        "Extends affordable health coverage to all citizens regardless of income.",
    },
    {
      name: "Public Hospital Modernization",
      description:
        "Upgrades public hospital facilities, equipment, and staffing standards.",
    },
  ],
  Infrastructure: [
    {
      name: "National Infrastructure Plan",
      description:
        "Long-term investment roadmap for transport, energy, and digital infrastructure.",
    },
    {
      name: "Digital Infrastructure Act",
      description:
        "Funds fiber networks, 5G rollout, and data center buildout nationwide.",
    },
  ],
  Education: [
    {
      name: "National Education Reform",
      description:
        "Overhauls curriculum, teacher pay, and school funding formulas nationally.",
    },
    {
      name: "Vocational Training Initiative",
      description:
        "Expands technical and trade education to align with labor market needs.",
    },
  ],
  Economy: [
    {
      name: "Economic Competitiveness Act",
      description:
        "Streamlines regulations and incentivizes investment to boost productivity.",
    },
    {
      name: "National Industry Strategy",
      description:
        "Identifies and develops key strategic industries for long-term growth.",
    },
  ],
  Defense: [
    {
      name: "National Defense Strategy",
      description:
        "Sets out priorities for military posture, alliances, and threat response.",
    },
    {
      name: "Military Modernization Fund",
      description:
        "Invests in next-generation weapons systems and force readiness.",
    },
  ],
  Technology: [
    {
      name: "National AI Strategy",
      description:
        "Coordinates AI investment, regulation, and research across government and industry.",
    },
    {
      name: "Digital Economy Blueprint",
      description:
        "Drives digital transformation of key economic sectors and public services.",
    },
  ],
  Social: [
    {
      name: "Social Safety Net Reform",
      description:
        "Consolidates and strengthens income support programs for vulnerable populations.",
    },
    {
      name: "Youth Employment Initiative",
      description:
        "Tackles youth unemployment with apprenticeships and job placement programs.",
    },
  ],
};

function generateCountryPolicies(): PolicyCard[] {
  const cards: PolicyCard[] = [];
  MINI_COUNTRIES.forEach((country, ci) => {
    CATEGORIES.forEach((cat, ki) => {
      const r = seededRand(ci * 113 + ki * 17 + 5);
      const specificEntry = COUNTRY_SPECIFIC_POLICIES[country.id]?.[cat];
      let policyName: string;
      let description: string;
      if (specificEntry) {
        policyName = specificEntry.name;
        description = specificEntry.description;
      } else {
        const fallbackOptions = COUNTRY_POLICY_FALLBACK[cat];
        const fallbackItem =
          fallbackOptions[Math.floor(r() * fallbackOptions.length)];
        policyName = fallbackItem.name;
        description = fallbackItem.description;
      }
      r(); // consume one value to keep score/trend RNG consistent
      const gdpPctVal = parseFloat((r() * 15 + 0.5).toFixed(1));
      const allocBillions = parseFloat(
        (country.gdp * (gdpPctVal / 100) * (0.3 + r() * 0.7)).toFixed(1),
      );
      const allocStr =
        allocBillions >= 1000
          ? `$${(allocBillions / 1000).toFixed(1)}T`
          : `$${allocBillions.toFixed(0)}B`;
      const score = parseFloat((4.5 + r() * 5.5).toFixed(1));
      const trendRoll = r();
      const trend: Trend =
        trendRoll > 0.6 ? "up" : trendRoll < 0.25 ? "down" : "stable";
      cards.push({
        id: `country-${country.id}-${cat}`,
        entityId: country.id,
        entityName: country.name,
        entityType: "country",
        category: cat,
        policyName,
        description,
        allocated: allocStr,
        gdpPct: `${gdpPctVal}% GDP`,
        score,
        trend,
      });
    });
  });
  return cards;
}

function generateStatePolicies(): PolicyCard[] {
  const cards: PolicyCard[] = [];
  usStatesData.forEach((state, si) => {
    CATEGORIES.forEach((cat, ci) => {
      const r = seededRand(si * 97 + ci * 13 + 3);
      // Use state-specific policy if available, otherwise fall back to generic pool
      const specificEntry = STATE_SPECIFIC_POLICIES[state.id]?.[cat];
      let policyName: string;
      let description: string;
      if (specificEntry) {
        policyName = specificEntry.name;
        description = specificEntry.description;
      } else {
        const policyOptions = STATE_POLICIES[cat];
        const policyItem =
          policyOptions[Math.floor(r() * policyOptions.length)];
        policyName = policyItem.name;
        description = policyItem.description;
      }
      // Consume one random value to keep score/trend RNG consistent
      r();
      const gdpPctVal = parseFloat((r() * 12 + 0.5).toFixed(1));
      const allocBillions = parseFloat(
        (state.gdp * (gdpPctVal / 100) * (0.4 + r() * 0.6)).toFixed(1),
      );
      const allocStr =
        allocBillions >= 1000
          ? `$${(allocBillions / 1000).toFixed(1)}T`
          : `$${allocBillions.toFixed(0)}B`;
      const score = parseFloat((5.5 + r() * 4.5).toFixed(1));
      const trendRoll = r();
      const trend: Trend =
        trendRoll > 0.6 ? "up" : trendRoll < 0.25 ? "down" : "stable";
      cards.push({
        id: `state-${state.id}-${cat}`,
        entityId: state.id,
        entityName: state.name,
        entityType: "state",
        category: cat,
        policyName,
        description,
        allocated: allocStr,
        gdpPct: `${gdpPctVal}%`,
        score,
        trend,
      });
    });
  });
  return cards;
}

// ── Country meta lookup ──────────────────────────────────────────────────────

const countryMetaMap = new Map(
  MINI_COUNTRIES.map((c) => [
    c.id,
    {
      flagUrl: `https://flagcdn.com/w80/${c.code}.png`,
      continent: c.continent,
      population: c.population,
      gdp: c.gdp,
    },
  ]),
);

function getCountryMeta(entityId: string) {
  return countryMetaMap.get(entityId);
}

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatGDP(gdp: number): string {
  if (gdp >= 1000) return `$${(gdp / 1000).toFixed(1)}T`;
  return `$${gdp.toFixed(0)}B`;
}

// ── Group by entity ──────────────────────────────────────────────────────────

interface EntityGroup {
  entityId: string;
  entityName: string;
  entityType: "state" | "country";
  flagUrl?: string;
  continent?: string;
  population?: number;
  gdp?: number;
  avgScore: number;
  policies: PolicyCard[];
}

function getStateFlag(stateId: string): string {
  const abbrevMap: Record<string, string> = {
    ca: "us-ca",
    tx: "us-tx",
    ny: "us-ny",
    fl: "us-fl",
    il: "us-il",
    pa: "us-pa",
    oh: "us-oh",
    ga: "us-ga",
    nc: "us-nc",
    mi: "us-mi",
    wa: "us-wa",
    az: "us-az",
    co: "us-co",
    tn: "us-tn",
    in: "us-in",
    ma: "us-ma",
    wv: "us-wv",
    mn: "us-mn",
    wi: "us-wi",
    mo: "us-mo",
    md: "us-md",
    sc: "us-sc",
    al: "us-al",
    la: "us-la",
    ky: "us-ky",
    or: "us-or",
    ok: "us-ok",
    ct: "us-ct",
    ut: "us-ut",
    ia: "us-ia",
    nv: "us-nv",
    ar: "us-ar",
    ms: "us-ms",
    ks: "us-ks",
    nm: "us-nm",
    ne: "us-ne",
    id: "us-id",
    hi: "us-hi",
    nh: "us-nh",
    me: "us-me",
    mt: "us-mt",
    ri: "us-ri",
    de: "us-de",
    sd: "us-sd",
    nd: "us-nd",
    ak: "us-ak",
    vt: "us-vt",
    wy: "us-wy",
    dc: "us-dc",
  };
  const slug = abbrevMap[stateId] ?? "us";
  return `https://flagcdn.com/w80/${slug}.png`;
}

function groupByEntity(policies: PolicyCard[]): EntityGroup[] {
  const map = new Map<string, EntityGroup>();
  for (const p of policies) {
    const key = `${p.entityType}-${p.entityId}`;
    if (!map.has(key)) {
      let flagUrl: string | undefined;
      let continent: string | undefined;
      let population: number | undefined;
      let gdp: number | undefined;
      if (p.entityType === "country") {
        const meta = getCountryMeta(p.entityId);
        if (meta) {
          flagUrl = meta.flagUrl;
          continent = meta.continent;
          population = meta.population;
          gdp = meta.gdp;
        }
      } else {
        flagUrl = getStateFlag(p.entityId);
        continent = "United States";
      }
      map.set(key, {
        entityId: p.entityId,
        entityName: p.entityName,
        entityType: p.entityType,
        flagUrl,
        continent,
        population,
        gdp,
        avgScore: 0,
        policies: [],
      });
    }
    map.get(key)!.policies.push(p);
  }
  for (const group of map.values()) {
    group.avgScore = parseFloat(
      (
        group.policies.reduce((s, p) => s + p.score, 0) / group.policies.length
      ).toFixed(1),
    );
    group.policies.sort(
      (a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category),
    );
  }
  return Array.from(map.values()).sort((a, b) => b.avgScore - a.avgScore);
}

// ── Sub-components ───────────────────────────────────────────────────────────

const TABS = ["All", "US States", "Countries"] as const;
type Tab = (typeof TABS)[number];

const CATEGORY_FILTERS: ("All" | PolicyCategory)[] = [
  "All",
  "Climate",
  "Healthcare",
  "Infrastructure",
  "Education",
  "Economy",
  "Defense",
  "Technology",
  "Social",
];

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up")
    return <ArrowUp size={11} className="text-emerald-400" weight="bold" />;
  if (trend === "down")
    return <ArrowDown size={11} className="text-red-400" weight="bold" />;
  return (
    <ArrowRight size={11} className="text-muted-foreground" weight="bold" />
  );
}

function PolicyCardItem({ card }: { card: PolicyCard }) {
  const cfg = CATEGORY_CONFIG[card.category];
  const Icon = cfg.icon;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 flex flex-col gap-2.5 hover:border-border/80 hover:shadow-sm transition-all duration-150">
      {/* Top row: badge | trend + GDP% + score */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} flex-shrink-0`}
        >
          <Icon size={12} weight="fill" className={cfg.color} />
          <span className={`text-[11px] font-semibold ${cfg.color}`}>
            {card.category}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <TrendIcon trend={card.trend} />
          <span className="text-[10px] text-muted-foreground font-medium">
            {card.gdpPct}
          </span>
          <span className="text-[15px] font-bold text-foreground leading-none ml-1">
            {card.score.toFixed(1)}
            <span className="text-[10px] font-normal text-muted-foreground">
              /10
            </span>
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${cfg.bar}`}
          style={{ width: `${(card.score / 10) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-full bg-blue-400/40"
          style={{ left: `${(card.score / 10) * 100}%`, right: "0" }}
        />
      </div>

      {/* Policy name */}
      <p
        className={`text-[12px] font-semibold leading-snug line-clamp-2 ${cfg.color}`}
      >
        {card.policyName}
      </p>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
        {card.description}
      </p>

      {/* Allocation */}
      <p className="text-[11px] text-muted-foreground">
        <span className="text-foreground font-semibold">{card.allocated}</span>{" "}
        allocated
      </p>
    </div>
  );
}

function AvgScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "text-emerald-400"
      : score >= 7
        ? "text-blue-400"
        : score >= 6
          ? "text-yellow-400"
          : "text-red-400";
  return (
    <span className={`text-[13px] font-bold ${color}`}>
      {score.toFixed(1)}
      <span className="text-[10px] font-normal text-muted-foreground">/10</span>
    </span>
  );
}

function EntityFlag({ group }: { group: EntityGroup }) {
  const src = group.flagUrl;
  if (!src) {
    return (
      <div className="w-12 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Globe size={14} className="text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="w-12 h-8 rounded-md overflow-hidden flex-shrink-0 bg-muted ring-1 ring-border/40">
      <img
        src={src}
        alt={group.entityName}
        className="w-full h-full object-cover"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = "none";
          if (el.parentElement)
            el.parentElement.innerHTML = `<span class='text-[10px] text-muted-foreground px-1'>${group.entityName.slice(0, 2).toUpperCase()}</span>`;
        }}
      />
    </div>
  );
}

function EntityRow({ group }: { group: EntityGroup }) {
  const [open, setOpen] = useState(false);

  const categoryScores = CATEGORIES.map((cat) => {
    const p = group.policies.find((x) => x.category === cat);
    return { cat, score: p?.score ?? 0, cfg: CATEGORY_CONFIG[cat] };
  });

  return (
    <div className="modal-tile rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 transition-colors text-left"
      >
        <EntityFlag group={group} />

        <div className="flex flex-col items-start min-w-0 flex-1 gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-foreground leading-tight">
              {group.entityName}
            </span>
            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wide">
              {group.entityType === "country" ? "Country" : "US State"}
            </span>
            {group.continent && (
              <span className="text-[9px] text-muted-foreground hidden sm:inline">
                {group.continent}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {group.population != null && (
              <span className="text-[10px] text-muted-foreground">
                <span className="text-foreground/70 font-medium">
                  {formatPop(group.population)}
                </span>{" "}
                pop
              </span>
            )}
            {group.gdp != null && (
              <span className="text-[10px] text-muted-foreground">
                <span className="text-foreground/70 font-medium">
                  {formatGDP(group.gdp)}
                </span>{" "}
                GDP
              </span>
            )}
          </div>
          <div className="hidden sm:flex mt-0.5">
            {(() => {
              const top = [...group.policies].sort(
                (a, b) => b.score - a.score,
              )[0];
              if (!top) return null;
              const cfg = CATEGORY_CONFIG[top.category];
              const Icon = cfg.icon;
              return (
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-semibold ${cfg.color}`}
                >
                  <Icon size={11} weight="fill" />
                  <span>{top.category}</span>
                  <span className="opacity-40 font-normal mx-0.5">·</span>
                  <span>{top.score.toFixed(1)}</span>
                  <span className="opacity-40 font-normal mx-0.5">·</span>
                  <span className="font-medium opacity-70">
                    {top.policyName}
                  </span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* Category mini-bars */}
        <div
          className="items-end gap-1.5 mx-3 hidden md:flex"
          style={{ height: "36px" }}
        >
          {categoryScores.map(({ cat, score, cfg }) => (
            <div
              key={cat}
              className="flex flex-col items-center justify-end h-full"
              title={`${cat}: ${score.toFixed(1)}/10`}
            >
              <div
                className="rounded-full bg-muted overflow-hidden flex items-end"
                style={{ width: "4px", height: "100%" }}
              >
                <div
                  className={`w-full rounded-full ${cfg.bar} transition-all`}
                  style={{ height: `${(score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-muted-foreground">avg</div>
            <AvgScoreBadge score={group.avgScore} />
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
            {group.policies.length} policies
          </span>
          {open ? (
            <CaretDown size={13} className="text-muted-foreground" />
          ) : (
            <CaretRight size={13} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {group.policies.map((card) => (
              <PolicyCardItem key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PolicyPage() {
  const [tab, setTab] = useState<Tab>("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | PolicyCategory>(
    "All",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [allPolicies, setAllPolicies] = useState<PolicyCard[]>([]);
  const PAGE_SIZE = 40;

  useEffect(() => {
    const statePolicies = generateStatePolicies();
    const countryPolicies = generateCountryPolicies();
    setAllPolicies([...statePolicies, ...countryPolicies]);
  }, []);

  const filteredPolicies = useMemo(() => {
    let list = allPolicies;
    if (tab === "US States")
      list = list.filter((c) => c.entityType === "state");
    if (tab === "Countries")
      list = list.filter((c) => c.entityType === "country");
    if (categoryFilter !== "All")
      list = list.filter((c) => c.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.entityName.toLowerCase().includes(q) ||
          c.policyName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tab, categoryFilter, search, allPolicies]);

  const groups = useMemo(
    () => groupByEntity(filteredPolicies),
    [filteredPolicies],
  );

  const paginatedGroups = useMemo(
    () => groups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [groups, page],
  );
  const totalPages = Math.ceil(groups.length / PAGE_SIZE);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setPage(0);
  };
  const handleCatChange = (c: "All" | PolicyCategory) => {
    setCategoryFilter(c);
    setPage(0);
  };
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <Buildings size={16} weight="fill" className="text-blue-400" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Public Policy
          </h1>
        </div>
        <p className="text-xs text-muted-foreground pl-8">
          Policy ratings, allocations, and spending priorities across US States
          and Countries
        </p>
      </div>

      {/* Controls — unified filter bar (EconomiesPage style) */}
      <div className="search-sticky sticky top-16 z-30 flex flex-col border border-border/60 rounded-2xl px-4 py-2.5 w-full">
        {/* Row 1: Search */}
        <div className="flex items-center gap-2">
          <MagnifyingGlass
            size={16}
            className="text-muted-foreground shrink-0"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search countries, states, or policies…"
            className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          />
          <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
            {groups.length.toLocaleString()} entities ·{" "}
            {filteredPolicies.length.toLocaleString()} policies
          </span>
        </div>
        {/* Row 2: Tab pills + divider + category pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
          {/* Entity-type tabs */}
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                tab === t
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {t === "All" ? (
                <Globe size={11} />
              ) : t === "US States" ? (
                <Buildings size={11} />
              ) : (
                <Globe size={11} />
              )}
              {t}
            </button>
          ))}
          <div className="w-px h-4 bg-border shrink-0" />
          {/* Category pills */}
          {CATEGORY_FILTERS.map((c) => {
            if (c === "All") return null;
            const isActive = categoryFilter === c;
            const cfg = CATEGORY_CONFIG[c];
            const Icon = cfg.icon;
            return (
              <button
                key={c}
                onClick={() => handleCatChange(isActive ? "All" : c)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? `${cfg.bg} ${cfg.color} border-transparent`
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon
                  size={11}
                  weight="fill"
                  className={isActive ? cfg.color : "text-muted-foreground"}
                />
                {c === "Infrastructure" ? "Infra" : c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entity rows */}
      {paginatedGroups.length === 0 ? (
        <div className="modal-tile rounded-xl p-10 text-center text-muted-foreground text-sm">
          No policies match your filters.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedGroups.map((group) => (
            <EntityRow
              key={`${group.entityType}-${group.entityId}`}
              group={group}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 text-[11px] rounded-md bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-[11px] text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 text-[11px] rounded-md bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
